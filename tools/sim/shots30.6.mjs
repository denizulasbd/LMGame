// (30.6) Ekran görüntüleri: altın ipucu, Mallar listesi, tahsildar rehber kartı, pasif seçenekli karar penceresi ("Oyun durdu"),
// hasar kartı ve "Sıradaki" hedefin engel satırı. 1280x800; çıktı docs/playtest/img30.6/ (commit edilir).
// Kullanım: node tools/sim/shots30.6.mjs [--out klasör]
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const out = options.out ?? 'docs/playtest/img30.6';
fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openGame({ seed: 21, stopLoop: false, viewport: { width: 1280, height: 800 } });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => { await wait(350); await page.screenshot({ path: `${out}/${name}.png` }); console.log(`${out}/${name}.png`); };

// Hazırlık: Köy seviyesinde, birkaç yapılı bir kasaba; zaman durur (ekran görüntüsü kararlı olsun)
await page.evaluate(async () => {
  const { sim } = window;
  const s = game.state;
  sim.give({ wood: 400, stone: 200, food: 160, gold: 0 });
  for (const t of ['storage', 'garden', 'cabin', 'cabin', 'lumberHut']) sim.place(t);
  s.town.tier = 2;
  s.guide = { done: ['move', 'meet', 'harvest', 'build', 'food', 'storage', 'speed', 'goals', 'upgrade', 'petition', 'cards', 'cardAction', 'watch'], off: false };
  game.events.emit('time:setPaused', true);
});
await wait(500);

// 1. Altın ipucu: son 3 günün gelir kalemleri, yaklaşan ödeme, yolların durumu
await page.evaluate(() => {
  const sc = game.scenes.current;
  sc.economy.ledger = {};
  sc.economy.add('gold', 24, 'tax');
  sc.economy.add('gold', 18, 'tax');
  sc.economy.add('gold', 40, 'event');
  game.state.crown.nextLevyAt = game.state.totalMinutes + 3 * 1440;
});
await wait(700);
const goldBox = await page.evaluateHandle(() => [...document.querySelectorAll('.hud .resource')].find((b) => b.title.includes('Altın kazanmanın yolları')));
await goldBox.asElement().hover();
await wait(400);
await shot('01-altin-ipucu');
await page.mouse.move(640, 500);

// 2. Mallar listesi: hangi yapı üretir, hangi seviyede açılır; açık olana tıklanır
await page.evaluate(() => { game.state.buildings = game.state.buildings.filter((b) => !['mill', 'sheepFarm', 'ironMine'].includes(b.type)); game.state.town.tier = 1; });
await wait(700);
await page.click('.goods-toggle');
await wait(500);
await shot('02-mallar-listesi');
await page.click('.goods-toggle');
await page.evaluate(() => { game.state.town.tier = 2; });

// 3. Tahsildar rehber kartı
await page.evaluate(() => {
  const s = game.state;
  s.guide.done = s.guide.done.filter((x) => x !== 'levy');
  s.crown.levies = 0;
  s.crown.notice = { at: s.totalMinutes + 2 * 1440, amount: 58, announcedAt: s.totalMinutes };
});
await wait(900);
await shot('03-tahsildar-rehber-karti');
await page.evaluate(() => { game.state.crown.notice = null; game.state.guide.done.push('levy'); });

// 4. Pasif seçenekli karar penceresi ve "Oyun durdu · kararını bekliyor"
await page.evaluate(() => {
  const sc = game.scenes.current;
  game.state.town.tier = 3;
  game.state.resources.gold = 70;
  game.state.resources.food = 90;
  sc.dilemmas.dilemma.active = { id: 'census', remaining: 30, wasPaused: true };
  sc.dilemmas.publishOptions();
  game.state.settings.dilemmaTimer = false;
});
await wait(600);
await shot('04-karar-pasif-secenek-oyun-durdu');
await page.evaluate(() => { game.events.emit('ui:chooseDilemma', { optionId: 'refuse' }); game.state.town.tier = 2; });
await wait(300);

// 5. Hasar kartı
await page.evaluate(() => {
  const sc = game.scenes.current;
  const damaged = game.state.buildings.filter((b) => ['garden', 'storage'].includes(b.type));
  for (const b of damaged) b.damaged = true;
  sc.storyDirector.queue = [];
  sc.storyDirector.visible = [];
  game.events.emit('storm:struck', { kind: 'storm', damaged, safe: false, winter: false });
});
await wait(900);
await shot('05-hasar-karti');

// 6. "Sıradaki" hedefin engel satırı (Hedefler penceresi)
await page.evaluate(() => {
  for (const b of game.state.buildings) b.damaged = false;
  game.state.milestones = { firstHome: { day: 1, hour: 8, minute: 0 }, warmTable: { day: 2, hour: 12, minute: 0 } };
  game.state.buildings = game.state.buildings.filter((b) => b.type !== 'market');
  game.events.emit('ui:toggleGoals');
});
await wait(900);
await shot('06-siradaki-hedef-engel-satiri');

await browser.close();
if (errors.length) { console.log('Sayfa hataları:', errors.join('\n')); process.exit(1); }
