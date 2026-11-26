// (34.3) Kare süresi ölçümü: gerçek tarayıcıda (başsız Chromium), gerçek oyun döngüsüyle, 4x hızda N kişilik kasabada D oyun günü.
// Nüfus ve yatak araçla verilir (speed34.mjs ile aynı kurulum). Döngünün kare gövdesi (güncelleme + çizim) sarılıp süresi ölçülür.
// Çıktı: ortalama, en yavaş %5'in ortalaması, p95, en uzun tek kare; ayrıca 08:00 ve 17:00 vardiya pencereleri (±45 oyun dakikası).
// Kullanım: node tools/sim/frames34.mjs [--size 60] [--days 2] [--seed 42]
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const size = Number(options.size ?? 60);
const days = Number(options.days ?? 2);
const seed = Number(options.seed ?? 42);

const { browser, page, errors } = await openGame({ seed, stopLoop: false, viewport: { width: 1280, height: 800 } });
const setup = await page.evaluate(async (size) => {
  const { sim, game } = window;
  const scene = game.scenes.current;
  game.loop.stop();
  sim.unlockAllParcels();
  game.state.settings.dilemmaTimer = true;
  sim.give({ wood: 99999, stone: 99999, food: 99999, gold: 99999 });
  let homes = 0;
  for (let guard = 0; guard < 120; guard++) {
    const beds = game.state.buildings.filter((b) => b.type === 'cabin' && b.functional).reduce((a, b) => a + (b.capacity ?? 0), 0);
    if (beds >= size + 4) break;
    if (!sim.place('cabin', { maxRadius: 60 })) break;
    homes++;
  }
  let guard = 0;
  while (game.state.characters.length < size && guard++ < size * 2) if (!scene.population.spawnNewcomer()) break;
  sim.step(900 * 2);
  // Gün 06:00'ya kadar sür, sonra gerçek döngüyü başlat
  while (game.state.time.hour !== 6) sim.step(30);
  const guide = game.state.guide;
  game.state.guide = { ...(guide ?? {}), off: true };
  game.state.time.speed = 4;
  game.state.time.paused = false;
  return { pop: game.state.characters.length, homes, day: game.state.time.day };
}, size);
console.log(`kurulum: nüfus ${setup.pop}, ${setup.homes} kulübe, başlangıç günü ${setup.day} 06:00`);

await page.evaluate(() => {
  const { game, sim } = window;
  const loop = game.loop;
  const frames = [];
  const original = loop.frame;
  let last = 0;
  loop.frame = function (now) {
    const t0 = performance.now();
    original(now);
    const t = game.state.time;
    frames.push({ ms: performance.now() - t0, gap: last ? now - last : 0, minute: t.hour * 60 + t.minute, day: t.day });
    last = now;
  };
  window.__frames = frames;
  window.__feed = setInterval(() => sim.give({ wood: 99999, stone: 99999, food: 99999, gold: 99999 }), 15000);
  loop.start();
});
// 4x hızda bir oyun günü = 24 x 3,75 sn = 90 sn gerçek süre
const total = days * 90 + 6;
for (let s = 0; s < total; s += 15) await page.waitForTimeout(15000);
const frames = await page.evaluate(() => { clearInterval(window.__feed); window.game.loop.stop(); return window.__frames; });
await browser.close();

const stat = (list) => {
  if (list.length === 0) return null;
  const ms = list.map((f) => f.ms).sort((a, b) => a - b);
  const slow = ms.slice(Math.floor(ms.length * 0.95));
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  return { n: ms.length, mean: mean(ms), slow5: mean(slow), p95: ms[Math.floor(ms.length * 0.95)], max: ms[ms.length - 1] };
};
const fmt = (s) => (s ? `${s.n} kare · ortalama ${s.mean.toFixed(2)} ms · en yavaş %5 ort. ${s.slow5.toFixed(2)} ms · p95 ${s.p95.toFixed(2)} ms · en uzun ${s.max.toFixed(1)} ms` : 'kare yok');
const near = (minute, center) => Math.abs(minute - center) <= 45;
console.log('BÜTÜN:   ', fmt(stat(frames)));
console.log('08:00:   ', fmt(stat(frames.filter((f) => near(f.minute, 8 * 60)))));
console.log('17:00:   ', fmt(stat(frames.filter((f) => near(f.minute, 17 * 60)))));
console.log('diğer:   ', fmt(stat(frames.filter((f) => !near(f.minute, 8 * 60) && !near(f.minute, 17 * 60)))));
const gaps = frames.map((f) => f.gap).filter((g) => g > 0).sort((a, b) => a - b);
console.log(`kare aralığı (rAF): ortalama ${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1)} ms, p95 ${gaps[Math.floor(gaps.length * 0.95)].toFixed(1)} ms, en uzun ${gaps[gaps.length - 1].toFixed(0)} ms`);
console.log(`oyun süresi: gün ${frames[0].day}-${frames[frames.length - 1].day}; sayfa hatası ${errors.length}`);
process.exit(0);
