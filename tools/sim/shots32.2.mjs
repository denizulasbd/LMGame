// (32.2) Ekran görüntüleri: Adalet Sarayı ve Dava. Saray, saray paneli, dava penceresi (açlık + itiraf), sonuç ekranı (adil ve zalim),
// kamu hizmetindeki sakin, sürgün yolculuğu, Mahcup rozetli aile üyesi, İlan Tahtası'nda dava; dava penceresi 1024x640'ta da
// (pencere ekrandan taşmamalı: taşarsa betik "TAŞMA" yazar ve 1 ile çıkar). 1280x800; çıktı docs/playtest/img32.2/ (commit edilir).
// Kullanım: node tools/sim/shots32.2.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img32.2';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await page.mouse.move(640, 790); await wait(400); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };
const problems = [];
const fits = async (label) => {
  const r = await page.evaluate(() => {
    const p = document.querySelector('.case-panel');
    if (!p || p.hidden) return null;
    const b = p.getBoundingClientRect();
    return { top: b.top, left: b.left, right: b.right, bottom: b.bottom, w: window.innerWidth, h: window.innerHeight, scroll: p.scrollHeight > p.clientHeight };
  });
  if (!r || r.top < 0 || r.left < 0 || r.right > r.w + 0.5 || r.bottom > r.h + 0.5) problems.push(`${label}: ${JSON.stringify(r)}`);
  else console.log(`${label}: pencere ekranda (${Math.round(r.right - r.left)}x${Math.round(r.bottom - r.top)}${r.scroll ? ', kaydırmalı' : ''})`);
};
const focusAt = (x, y, zoom = 4) => page.evaluate(({ x, y, zoom }) => { const sc = game.scenes.current; sc.camera.zoom = zoom; sc.camera.centerOn(x * 16 + 8, y * 16 + 8, game.renderer.width, game.renderer.height); }, { x, y, zoom });
const focus = (type, { select = true, zoom = 4 } = {}) =>
  page.evaluate(({ type, select, zoom }) => {
    const sc = game.scenes.current;
    const b = game.state.buildings.find((x) => x.type === type);
    if (!b) return false;
    sc.camera.zoom = zoom;
    const { w, h } = b.definition.size;
    sc.camera.centerOn((b.tileX + w / 2) * 16 + 40, (b.tileY + h / 2) * 16, game.renderer.width, game.renderer.height);
    if (select) game.events.emit('ui:selectBuilding', b.id);
    return true;
  }, { type, select, zoom });

// Hazırlık: Kasaba seviyesinde kiler, han, pazar, ilan tahtası ve Adalet Sarayı; rehber kapalı; zaman durur
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  sim.give({ wood: 800, stone: 600, food: 150, gold: 900, iron: 60 });
  s.town.tier = 3;
  s.time.day = 9;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan', 'court'], off: true };
  for (const t of ['storage', 'inn', 'market', 'cabin', 'noticeBoard', 'courthouse']) sim.place(t);
  game.events.emit('time:setPaused', true);
  const { Random } = await import('/src/utils/random.js');
  const J = await import('/src/systems/Justice.js');
  const sc = game.scenes.current;
  const fixed = (v) => Object.assign(new Random(1), { next: () => v });
  const people = s.characters.filter((c) => !c.role && !c.isChild && J.crimeCandidate(s, c));
  const storage = s.buildings.find((b) => b.type === 'storage');
  const inn = s.buildings.find((b) => b.type === 'inn');
  inn.meals = 6;
  const commit = (c, plan, b, motive, remorse, hungry = false) => {
    c.needs.hunger = hungry ? 12 : 80;
    c.coins = hungry ? 2 : 30;
    sc.crime.dice = fixed(0);
    const k = sc.crime.commit(c, { crime: { ...plan, motive } }, b);
    sc.crime.dice = new Random(s.seed + 42);
    if (k) { k.remorse = remorse; k.context.hungry = hungry; k.context.coins = c.coins; }
    return k;
  };
  window.__shots = {};
  // açlık + itiraf (genç varsa genç)
  const hungry = people.find((c) => c.lifeStage === 'youth') ?? people[0];
  window.__shots.hungry = commit(hungry, { crime: 'pantryRation', variant: 'ration', buildingId: storage.id }, storage, 'hunger', 'confess', true)?.id;
  window.__shots.hungryId = hungry.id;
  // handan şerbet (sert / zalim için)
  const sly = people.find((c) => c !== hungry && c.partnerId !== null) ?? people.find((c) => c !== hungry && s.characters.some((o) => o.parentIds.includes(c.id))) ?? people.find((c) => c !== hungry);
  // sürgün edilecek sakinin bir eşi olsun (Mahcup rozeti için): başlangıç kasabasında aile yoksa bir çift evlendirilir
  if (sly.partnerId === null) {
    const mate = people.find((c) => c !== hungry && c !== sly && c.partnerId === null);
    if (mate) { sly.partnerId = mate.id; mate.partnerId = sly.id; sly.married = mate.married = true; mate.homeId = sly.homeId; }
  }
  window.__shots.sherbet = commit(sly, { crime: 'innPilfer', variant: 'meal', buildingId: inn.id }, inn, 'temptation', 'deny')?.id;
  window.__shots.slyId = sly.id;
  window.sim.step(2);
});
await wait(600);

// 1. Adalet Sarayı (kapıda parşömen: açık dava var)
await focus('courthouse', { select: false, zoom: 5 });
await wait(700);
await shot('01-adalet-sarayi');
// 2. Saray paneli: açık davalar, son kararlar, adalet defteri
await focus('courthouse', { zoom: 4 });
await wait(700);
await shot('02-saray-paneli');
// 3. Dava penceresi: açlık + itiraf (1280x800)
await page.evaluate(() => { game.events.emit('ui:selectBuilding', null); game.events.emit('ui:openCase', { id: window.__shots.hungry }); });
await wait(600);
await fits('1280x800 dava');
await shot('03-dava-acl-itiraf');
// 3b. aynı pencere 1024x640'ta
await page.setViewportSize({ width: 1024, height: 640 });
await wait(700);
await fits('1024x640 dava');
await shot('03b-dava-1024x640');
await page.setViewportSize({ width: 1280, height: 800 });
await wait(500);
// 4. Adil karar ve sonuç ekranı (aç ve itiraf eden yoksula Af + iade)
await page.evaluate(() => {
  document.querySelector('.case-option[data-sentence="pardon"]')?.click();
  const box = document.querySelector('.case-restitution-box');
  if (box && !box.disabled) { box.checked = true; box.dispatchEvent(new Event('change')); }
});
await wait(300);
await page.evaluate(() => document.querySelector('.case-decide')?.click());
await wait(600);
await fits('1280x800 sonuç');
await shot('04-sonuc-adil');
// 5. Zalim karar: handan börek için sürgün seçimi (pencerede ailenin adları) ve sonuç ekranı
await page.evaluate(() => game.events.emit('ui:openCase', { id: window.__shots.sherbet }));
await wait(400);
await page.evaluate(() => document.querySelector('.case-option[data-sentence="exile"]')?.click());
await wait(400);
await shot('05a-surgun-uyarisi');
await page.evaluate(() => document.querySelector('.case-decide')?.click());
await wait(600);
await shot('05b-sonuc-zalim');
await page.evaluate(() => document.querySelector('.case-panel .modal-close')?.click());
// 6. Sürgün yolculuğu: bohçasıyla kenara yürüyor
await page.evaluate(() => { game.events.emit('time:setPaused', false); });
await wait(1500);
const exiledAt = await page.evaluate(() => {
  const c = game.state.characters.find((x) => x.id === window.__shots.slyId);
  if (c) game.events.emit('ui:selectCharacter', c.id);
  return c ? { x: c.tileX, y: c.tileY, task: c.task?.activity } : null;
});
if (exiledAt) await focusAt(exiledAt.x, exiledAt.y, 4);
await page.evaluate(() => game.events.emit('time:setPaused', true));
await wait(500);
await shot('06-surgun-yolculugu');
// 7. Kamu hizmeti: bir sakine 12 saat hizmet; akşam meydanda süpürüyor
await page.evaluate(async () => {
  const s = game.state;
  const sc = game.scenes.current;
  const J = await import('/src/systems/Justice.js');
  const { Random } = await import('/src/utils/random.js');
  game.events.emit('ui:selectCharacter', null);
  const c = s.characters.find((x) => !x.role && !x.isChild && J.crimeCandidate(s, x) && x.id !== window.__shots.hungryId);
  const storage = s.buildings.find((b) => b.type === 'storage');
  sc.crime.dice = Object.assign(new Random(1), { next: () => 0 });
  const k = sc.crime.commit(c, { crime: { crime: 'woodpile', variant: 'wood', buildingId: storage.id, motive: 'poverty' } }, storage);
  sc.crime.dice = new Random(s.seed + 42);
  if (k) game.events.emit('ui:courtVerdict', { caseId: k.id, sentence: 'serviceHeavy', restitution: true });
  window.__shots.serviceId = c.id;
  s.time.hour = 18;
  s.time.minute = 30;
  c.task = null;
  game.events.emit('time:setPaused', false);
  for (let i = 0; i < 40 && c.task?.activity !== 'publicService'; i++) window.sim.step(5);
  for (let i = 0; i < 60 && c.task?.phase !== 'perform'; i++) window.sim.step(3);
  game.events.emit('time:setPaused', true);
  game.events.emit('ui:selectCharacter', c.id);
});
const served = await page.evaluate(() => { const c = game.state.characters.find((x) => x.id === window.__shots.serviceId); return { x: c.tileX, y: c.tileY, task: c.task?.activity }; });
await focusAt(served.x, served.y, 5);
await wait(600);
console.log(`kamu hizmeti: ${served.task}`);
await shot('07-kamu-hizmeti');
// 8. Mahcup rozetli aile üyesi (sürgün edilenin ailesi; yoksa en yakın tanıdık)
const kin = await page.evaluate(() => {
  const s = game.state;
  const gone = s.characters.find((x) => x.id === window.__shots.slyId);
  if (gone) game.scenes.current.court.departExile(gone); // yolda takılmasın: kenara varmış say
  const c = s.characters.find((x) => (x.moodlets ?? []).some((m) => m.key === 'shamed'));
  if (c) { game.events.emit('ui:selectCharacter', c.id); return { x: c.tileX, y: c.tileY, name: c.name }; }
  return null;
});
if (kin) await focusAt(kin.x, kin.y, 4);
await wait(700);
console.log(`Mahcup: ${kin?.name ?? 'yok'}`);
await shot('08-mahcup-aile');
// 9. İlan Tahtası'nda dava
await page.evaluate(async () => {
  const s = game.state;
  const sc = game.scenes.current;
  const J = await import('/src/systems/Justice.js');
  const { Random } = await import('/src/utils/random.js');
  game.events.emit('ui:selectCharacter', null);
  const c = s.characters.find((x) => !x.role && !x.isChild && J.crimeCandidate(s, x) && !x.sentence);
  const market = s.buildings.find((b) => b.type === 'market');
  sc.crime.dice = Object.assign(new Random(1), { next: () => 0 });
  sc.crime.commit(c, { crime: { crime: 'marketFruit', variant: 'fruit', buildingId: market.id, motive: 'temptation' } }, market);
  sc.crime.dice = new Random(s.seed + 42);
  window.sim.step(2);
});
await focus('noticeBoard', { zoom: 4 });
await wait(700);
await shot('09-ilan-tahtasi-dava');

if (problems.length) console.log('TAŞMA:\n' + problems.join('\n'));
if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
await browser.close();
process.exit(problems.length || errors.length ? 1 : 0);
