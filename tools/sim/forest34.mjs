// (34.3) Orman yenilenmesi ölçümü: açık alandaki ağaçların bir kısmı kesilir (oyuncu emriyle), sonra D oyun günü izlenir.
// Çıktı: günlük ağaç oranı (fidanlar dahil), dikilen fidan, ağaca dönen fidan. Kullanım: node tools/sim/forest34.mjs [--seed 42] [--days 20] [--cut 0.3]
import { openGame, parseArgs } from './lib.mjs';

const { options } = parseArgs();
const seed = Number(options.seed ?? 42);
const days = Number(options.days ?? 20);
const cut = Number(options.cut ?? 0.3);
const { browser, page, errors } = await openGame({ seed });
const res = await page.evaluate(({ days, cut }) => {
  const { sim, game } = window;
  const sc = () => game.scenes.current;
  sim.give({ wood: 400, food: 400 });
  const F = sc().forest;
  const trees = [];
  const o = sc().map.openBounds;
  for (let y = o.y0; y < o.y1; y++) for (let x = o.x0; x < o.x1; x++) if (sc().map.isOpen(x, y) && ['oak', 'pine'].includes(sc().map.getObject(x, y))) trees.push({ x, y });
  const base = trees.length;
  const want = Math.round(base * cut);
  // Kasabaya yakın ağaçlardan başlayarak kesilir (oyuncu önce yakındakileri keser)
  const plaza = sc().world.landmarks.plaza;
  trees.sort((a, b) => Math.hypot(a.x - plaza.centerX, a.y - plaza.centerY) - Math.hypot(b.x - plaza.centerX, b.y - plaza.centerY));
  let chopped = 0;
  for (const t of trees.slice(0, want)) {
    const job = sc().jobs.designate(t.x, t.y);
    if (!job) continue;
    sc().jobs.applyWork(job, job.work);
    sc().jobs.complete(job);
    chopped++;
  }
  const rows = [];
  let sprouted = 0;
  const start = game.state.time.day;
  for (let d = 0; d < days; d++) {
    const regBefore = game.state.regrowth.length;
    sim.step(225 * 24);
    sim.give({ food: 400 });
    sprouted += F.lastSprouted;
    rows.push({ day: d + 1, ratio: F.ratio(), pending: game.state.regrowth.length, trees: sc().map ? 0 : 0 });
  }
  const standing = (() => { let n = 0; for (let y = o.y0; y < o.y1; y++) for (let x = o.x0; x < o.x1; x++) if (['oak', 'pine'].includes(sc().map.getObject(x, y))) n++; return n; })();
  return { base, chopped, sprouted, rows, standing };
}, { days, cut });
console.log(`başlangıç ${res.base} ağaç, kesilen ${res.chopped} (oran ${(1 - res.chopped / res.base).toFixed(2)}), ${days} günde dikilen fidan ${res.sprouted}, bekleyen fidan ${res.rows.at(-1).pending}`);
console.log(`gün sonu oranı (fidan dahil): ${res.rows.filter((r) => r.day % 4 === 0 || r.day === 1).map((r) => `G${r.day} ${r.ratio.toFixed(2)}`).join(' · ')}`);
console.log(`${days} gün sonunda ayakta ağaç ${res.standing} (başlangıcın %${Math.round((res.standing / res.base) * 100)}'i); yeniden büyüyen = ${res.standing - (res.base - res.chopped)}`);
console.log(errors.length ? errors.join('\n') : 'hata yok');
await browser.close();
