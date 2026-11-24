// (32.4) Ekran görüntüleri: Darülfünun. Yapı (yaz / kış / ders saati), Yapı Bilgi Paneli (Müderris, derste olanlar, öğrenciler ve
// ilerleme çubukları, sıradakiler, çarpanlar), ders saatinde içeri giren gençler, sakin kartı rozetleri (öğrenci / mezun), mezuniyet
// kartı, Belediye'deki itibar dökümünde "Eğitim" satırı, Bilgelik Evi'nin tek satırı ve 1024×640 panel. Çıktı docs/playtest/img32.4/.
// Kullanım: node tools/sim/shots32.4.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img32.4';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name, clip = null) => { await wait(400); await page.screenshot({ path: `${out}/${name}.png`, ...(clip ? { clip } : {}) }); console.log(`${out}/${name}.png`); };
const park = () => page.mouse.move(640, 790);
const focus = (type, { select = true, zoom = 4, dx = 60 } = {}) =>
  page.evaluate(({ type, select, zoom, dx }) => {
    const sc = game.scenes.current;
    const b = game.state.buildings.find((x) => x.type === type);
    if (!b) return false;
    sc.camera.zoom = zoom;
    const { w, h } = b.definition.size;
    sc.camera.centerOn((b.tileX + w / 2) * 16 + (select ? dx : 0), (b.tileY + h / 2) * 16, game.renderer.width, game.renderer.height);
    game.events.emit('ui:selectBuilding', select ? b.id : null);
    return true;
  }, { type, select, zoom, dx });
const toHour = (h, m = 0) => page.evaluate(({ h, m }) => {
  const st = game.state;
  let guard = 0;
  while (!(st.time.hour === h && st.time.minute >= m) && guard++ < 225 * 30) window.sim.step(1);
}, { h, m });

// Hazırlık: Gelişmiş Şehir; Bilgelik Evi, Darülfünun, Kraliyet Arşivi; altı öğrenci (biri çırak), bir mezun; Müderris
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  const sc = game.scenes.current;
  sim.give({ wood: 1500, stone: 1500, food: 600, gold: 3000, iron: 300, cloth: 200, wool: 200 });
  s.town.tier = 4;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court'], off: true };
  for (const t of ['storage', 'inn', 'market', 'cabin', 'cabin', 'cabin', 'cabin', 'townHall', 'academy', 'healerHut', 'university']) sim.place(t);
  s.renown ??= (await import('/src/systems/Renown.js')).emptyRenown();
  s.renown.grants.push({ key: 'royalArchive', day: 1 });
  sim.place('royalArchive');
  sc.population.welcomeNewcomers(8);
  const people = s.characters.filter((c) => !c.isChild && !c.role).sort((a, b) => a.id - b.id);
  const youths = people.slice(0, 7);
  youths.forEach((y, i) => { y.lifeStage = 'youth'; y.age = 19; y.educated = true; y.schooling = 380 + i * 5; y.newcomer = false; });
  const healer = s.buildings.find((b) => b.type === 'healerHut');
  youths[0].apprenticeship = { masterId: null, profession: 'healerHut', buildingId: healer.id, progress: 42, since: 0, crafted: 0 };
  sc.university.newDay();
  const prog = [0.82, 0.55, 0.3, 0.7, 0.12, 0.95];
  s.characters.filter((c) => c.higherStudy).forEach((c, i) => { c.higherStudy.minutes = Math.round(540 * prog[i % prog.length]); });
  // bir mezun (yetişkin) ve onun annesi
  const grad = people[8];
  grad.graduate = { field: 'herbalism', day: s.time.day };
  grad.skills.herbalism = Math.max(grad.skills.herbalism ?? 0, 480);
  window.__grad = grad.id;
  window.__student = youths[0].id;
  s.university.graduated = 1;
  s.university.admitted += 1;
  sim.step(2);
});
await wait(600);

// 1-3. yapı: yaz gündüz, ders saati (içeri giren gençler, aydınlık pencereler), kış
await toHour(13, 50);
await focus('university', { select: false, zoom: 5 });
await park();
await shot('01-darulfunun-yaz');
await toHour(14, 12);
await focus('university', { select: false, zoom: 5 });
await shot('02-ders-saati-iceri-giren-gencler');
await toHour(14, 40);
await focus('university', { zoom: 4, dx: 90 });
await wait(800);
await page.evaluate(() => document.querySelector('.building-university')?.scrollIntoView({ block: 'start' }));
await shot('03-panel-derste');
await page.evaluate(async () => {
  const { getSeason } = await import('/src/data/seasons.js');
  const st = game.state;
  for (let d = st.time.day; d < st.time.day + 20; d++) if (getSeason(d).key === 'winter') { st.time.day = d; break; }
  game.events.emit('ui:selectBuilding', null);
  window.sim.step(2);
});
await focus('university', { select: false, zoom: 5 });
await wait(900);
await shot('04-darulfunun-kis');
// 5. sakin kartı: öğrenci rozeti ve mezun rozeti
await page.evaluate(() => game.events.emit('ui:selectCharacter', window.__student));
await wait(800);
await shot('05a-sakin-karti-ogrenci');
await page.evaluate(() => game.events.emit('ui:selectCharacter', window.__grad));
await wait(800);
await shot('05b-sakin-karti-mezun');
await page.evaluate(() => game.events.emit('ui:selectCharacter', null));
// 6. mezuniyet kartı
await page.evaluate(() => {
  const st = game.state;
  const c = st.characters.find((x) => x.higherStudy && x.higherStudy.minutes >= 540) ?? st.characters.find((x) => x.higherStudy);
  c.higherStudy.minutes = 600;
  c.lifeStage = 'adult';
  game.events.emit('lifeStage:changed', { character: c, from: 'youth', to: 'adult' });
  window.sim.step(2);
});
await wait(900);
await park();
await shot('06-mezuniyet-karti');
// 7. Belediye: itibar dökümünde "Eğitim" satırı
await focus('townHall', { zoom: 3 });
await wait(800);
await page.evaluate(() => document.querySelector('.building-crown, .crown-card')?.scrollIntoView({ block: 'center' }));
await wait(400);
await shot('07-itibar-egitim-satiri');
// 8. Bilgelik Evi: tek satır
await focus('academy', { zoom: 4 });
await wait(800);
await page.evaluate(() => [...document.querySelectorAll('.building-panel .upgrade-text, .building-panel div')].find((n) => /Darülfünun'a devam/.test(n.textContent) && n.children.length === 0)?.scrollIntoView({ block: 'center' }));
await shot('08-bilgelik-evi-satiri');
// 9. 1024×640 panel
await page.setViewportSize({ width: 1024, height: 640 });
await wait(600);
await toHour(15, 0);
await focus('university', { zoom: 3, dx: 110 });
await wait(900);
await page.evaluate(() => document.querySelector('.building-university')?.scrollIntoView({ block: 'start' }));
await shot('09-panel-1024x640');

if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
await browser.close();
process.exit(errors.length ? 1 : 0);
