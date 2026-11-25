// (32.3) Ekran görüntüleri: Kasaba Şöhreti. Üst çubuktaki Krallık İtibarı rozeti (1280 ve 1024 genişlikte), rozetin ipucu (hedef,
// kayma, en büyük üç neden), Belediye Konağı'ndaki itibar satırı, Arşiv'in itibar grafiği, Kraliyet Lütufnamesi, üç gizli yapı ve
// panelleri, dava sonucundaki "Krallık İtibarı'na etkisi" satırı, Tarihçe'deki Kraliyet Defteri. Çıktı docs/playtest/img32.3/.
// Kullanım: node tools/sim/shots32.3.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img32.3';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name, clip = null) => { await wait(400); await page.screenshot({ path: `${out}/${name}.png`, ...(clip ? { clip } : {}) }); console.log(`${out}/${name}.png`); };
const park = () => page.mouse.move(640, 790);
const focus = (type, { select = true, zoom = 4 } = {}) =>
  page.evaluate(({ type, select, zoom }) => {
    const sc = game.scenes.current;
    const b = game.state.buildings.find((x) => x.type === type);
    if (!b) return false;
    sc.camera.zoom = zoom;
    const { w, h } = b.definition.size;
    sc.camera.centerOn((b.tileX + w / 2) * 16 + (select ? 60 : 0), (b.tileY + h / 2) * 16, game.renderer.width, game.renderer.height);
    game.events.emit('ui:selectBuilding', select ? b.id : null);
    return true;
  }, { type, select, zoom });

// Hazırlık: Gelişmiş Şehir; belediye, saray, han, kiler; 30 günlük itibar arşivi; itibar Gözde; üç lütuf ve yapıları; bir dava
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  const sc = game.scenes.current;
  const { Random } = await import('/src/utils/random.js');
  const J = await import('/src/systems/Justice.js');
  sim.give({ wood: 1500, stone: 1500, food: 400, gold: 3000, iron: 200, cloth: 80, gears: 6 });
  s.town.tier = 4;
  s.time.day = 34;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court'], off: true };
  for (const t of ['storage', 'inn', 'market', 'cabin', 'townHall', 'courthouse', 'academy']) sim.place(t);
  game.events.emit('time:setPaused', true);
  // arşiv: 30 günlük itibar seyri (ilk günler 50, vergiyle sıçrar, hedefe yakınsar)
  let rep = 50;
  s.history = [];
  for (let d = 4; d <= 33; d++) {
    if (d >= 9 && d % 6 === 3) rep = Math.min(100, rep + 8);
    if (d >= 6) rep += Math.max(-4, Math.min(4, (84 - rep) * 0.2));
    s.history.push({ day: d, population: 14 + Math.floor(d / 3), children: 2, welfare: 70 + (d % 7), stock: 300 + d * 9, gold: 200 + d * 30, buildings: 10 + Math.floor(d / 2), reputation: Math.round(rep) });
  }
  s.history.at(-1).reputation = 86; // dün: rozetin 24 saatlik oku yükselişi göstersin
  s.crown.reputation = 86;
  s.trust.value = 96;
  sc.renown.newDay(34);
  s.crown.reputation = 92;
  sc.renown.checkTier();
  for (const k of ['peaceFountain', 'royalRoseGarden', 'royalArchive']) sc.renown.grant(k, k === 'peaceFountain' ? 26 : k === 'royalRoseGarden' ? 31 : 34);
  for (const t of ['peaceFountain', 'royalRoseGarden', 'royalArchive']) sim.place(t);
  // dava: handan şerbet → zalim karar (sürgün) için
  const people = s.characters.filter((c) => !c.role && !c.isChild && J.crimeCandidate(s, c));
  const inn = s.buildings.find((b) => b.type === 'inn');
  inn.meals = 6;
  const c = people[0];
  c.coins = 30;
  sc.crime.dice = Object.assign(new Random(1), { next: () => 0 });
  const k = sc.crime.commit(c, { crime: { crime: 'innPilfer', variant: 'meal', buildingId: inn.id, motive: 'temptation' } }, inn);
  sc.crime.dice = new Random(s.seed + 42);
  window.__case = k?.id;
  sim.step(2);
});
await wait(600);

// 1. üst çubuk rozeti (1280): Nabız'ın yanında taç, %, kademe adı, yön oku
await park();
await shot('01-rozet-1280', { x: 640, y: 0, width: 640, height: 70 });
// 2. 1024'te küçük rozet
await page.setViewportSize({ width: 1024, height: 700 });
await wait(600);
await shot('02-rozet-1024', { x: 384, y: 0, width: 640, height: 70 });
await page.setViewportSize({ width: 1280, height: 800 });
await wait(600);
// 3. ipucu: hedef, bu gecenin kayması, en büyük üç neden
await page.hover('.hud-renown');
await wait(900);
await shot('03-ipucu', { x: 560, y: 0, width: 720, height: 260 });
await park();
// 4. Belediye Konağı: itibar satırı aynı dökümle
await focus('townHall', { zoom: 3 });
await wait(800);
await page.evaluate(() => document.querySelector('.building-crown')?.scrollIntoView({ block: 'center' }));
await wait(400);
await shot('04-belediye-itibar');
// 5. Arşiv: itibar grafiği
await page.evaluate(() => { game.events.emit('ui:selectBuilding', null); document.querySelector('.archive-toggle')?.click(); });
await wait(700);
await page.evaluate(() => [...document.querySelectorAll('.archive-chart')].at(-1)?.scrollIntoView({ block: 'center' }));
await wait(400);
await shot('05-arsiv-itibar-grafigi');
// 5b. Tarihçe: Kraliyet Lütufları ve Kasabanın Kraliyet Defteri
await page.evaluate(() => document.querySelector('.archive-tab[data-tab="chronicle"]')?.click());
await wait(500);
await page.evaluate(() => [...document.querySelectorAll('.chronicle-title')].find((n) => /Kraliyet Defteri/.test(n.textContent))?.scrollIntoView({ block: 'center' }));
await wait(400);
await shot('05b-tarihce-kraliyet-defteri');
await page.evaluate(() => document.querySelector('.archive-tab[data-tab="archive"]')?.click());
await page.keyboard.press('Escape');
await wait(400);
// 6. Kraliyet Lütufnamesi
await page.evaluate(() => game.events.emit('ui:openRoyalLetter', { key: 'royalRoseGarden' }));
await wait(600);
await shot('06-lutufname');
await page.keyboard.press('Escape');
await wait(300);
// 7-9. üç gizli yapı ve panelleri
await focus('peaceFountain', { select: false, zoom: 6 });
await shot('07a-baris-cesmesi');
await page.evaluate(() => { game.state.time.hour = 20; game.events.emit('time:hour', 20); window.sim.step(2); });
await wait(800);
await shot('07b-baris-cesmesi-aksam');
await page.evaluate(() => { game.state.time.hour = 11; game.events.emit('time:hour', 11); window.sim.step(2); });
await focus('peaceFountain', { zoom: 4 });
await wait(700);
await shot('07c-baris-cesmesi-panel');
await focus('royalRoseGarden', { zoom: 4 });
await wait(700);
await shot('08-gul-bahcesi-panel');
await focus('royalArchive', { zoom: 4 });
await wait(700);
await shot('09-kraliyet-arsivi-panel');
// 9b. inşa menüsünde Kraliyet Lütfu sekmesi
await page.evaluate(() => { game.events.emit('ui:selectBuilding', null); game.events.emit('ui:setTool', { tool: 'build' }); });
await wait(400);
await page.evaluate(() => document.querySelector('.build-tab[data-tab="royal"]')?.click());
await wait(500);
await shot('09b-insa-kraliyet-lutfu');
await page.evaluate(() => game.events.emit('ui:setTool', { tool: 'select' }));
// 10. dava sonucu: zalim karar (sürgün) ve "Krallık İtibarı'na etkisi"
await page.evaluate(() => game.events.emit('ui:openCase', { id: window.__case }));
await wait(500);
await page.evaluate(() => document.querySelector('.case-option[data-sentence="exile"]')?.click());
await wait(300);
await page.evaluate(() => document.querySelector('.case-decide')?.click());
await wait(700);
await shot('10-dava-itibar-satiri');

if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
await browser.close();
process.exit(errors.length ? 1 : 0);
