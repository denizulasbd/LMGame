// (31) Ekran görüntüleri: Kasaba Süsleri. İlan Tahtası'nın açık işler paneli, Odun Yığını ve Korkuluk, Müzik Köşkü'nde Akşam Konseri
// (gece), Kahraman Heykeli'nin onurlandırma seçimi ve künyesi. 1280x800; çıktı docs/playtest/img31/ (commit edilir).
// Kullanım: node tools/sim/shots31.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img31';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await page.mouse.move(640, 790); await wait(400); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };
const focus = (type, { select = true, zoom = 4 } = {}) =>
  page.evaluate(({ type, select, zoom }) => {
    const sc = game.scenes.current;
    const b = game.state.buildings.find((x) => x.type === type);
    if (!b) return false;
    sc.camera.zoom = zoom;
    const T = 16;
    const { w, h } = b.definition.size;
    sc.camera.centerOn((b.tileX + w / 2) * T + 40, (b.tileY + h / 2) * T, game.renderer.width, game.renderer.height);
    if (select) game.events.emit('ui:selectBuilding', b.id);
    return true;
  }, { type, select, zoom });

// Hazırlık: Şehir seviyesinde birkaç yapılı bir kasaba; rehber kapalı; zaman durur
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  sim.give({ wood: 800, stone: 600, food: 300, gold: 900, iron: 60 });
  s.town.tier = 4;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch', 'levy', 'gold', 'stone', 'doctrine', 'lifespan'], off: true };
  for (const t of ['storage', 'garden', 'scarecrow', 'cabin', 'woodpile', 'noticeBoard', 'bandstand', 'heroStatue']) sim.place(t);
  game.events.emit('time:setPaused', true);
});
await wait(600);

// 1. İlan Tahtası: dilekçe, Kraliyet Fermanı, tahsildar ve vergi günü tek listede
await page.evaluate(() => {
  const s = game.state;
  const sc = game.scenes.current;
  sc.petitions.create();
  sc.petitions.create();
  s.crown.decree = { id: 9, kind: 'garrison', need: { bread: 15, iron: 4 }, createdAt: s.totalMinutes, deadline: s.totalMinutes + 3 * 1440 };
  s.crown.notice = { at: s.totalMinutes + 1440 + 300, amount: 64, announcedAt: s.totalMinutes };
  window.sim.step(2);
});
await focus('noticeBoard');
await wait(700);
await shot('01-ilan-tahtasi');

// 2. Odun Yığını (dolu) ve bahçe kenarında Korkuluk
await page.evaluate(() => { game.events.emit('ui:selectBuilding', null); game.state.resources.wood = 140; window.sim.step(2); });
await focus('scarecrow');
await wait(600);
await shot('02-korkuluk-bahce');
await focus('woodpile');
await wait(600);
await shot('03-odun-yigini');

// 3. Müzik Köşkü: akşam konseri (gece ışıkları, sakinler köşkte)
await page.evaluate(() => {
  const s = game.state;
  game.events.emit('ui:selectBuilding', null);
  s.time.hour = 19;
  s.time.minute = 0;
  game.events.emit('time:setPaused', false);
  game.events.emit('ui:startConcert', { buildingId: s.buildings.find((b) => b.type === 'bandstand').id });
  window.sim.step(225 * 0.6);
  game.events.emit('time:setPaused', true);
});
await focus('bandstand', { zoom: 3 });
await wait(900);
await shot('04-muzik-kosku-konser');

// 4. Kahraman Heykeli: örtülü heykel ve sakin seçimi, sonra künye
await page.evaluate(() => { const s = game.state; s.time.hour = 11; game.events.emit('ui:selectBuilding', null); window.sim.step(2); });
await focus('heroStatue');
await wait(700);
await shot('05-heykel-secimi');
await page.evaluate(() => {
  const s = game.state;
  const statue = s.buildings.find((b) => b.type === 'heroStatue');
  const pick = document.querySelector('.statue-pick');
  pick?.click();
  window.sim.step(2);
  return statue.decor;
});
await wait(700);
await shot('06-heykel-kunye');

if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
await browser.close();
