// Aşama testi iskeleti. Kopyala: tools/sim/tests/29.5-ad.mjs   (başı "_" olan dosyalar kapıya girmez)
// Kullanım: node tools/sim/tests/29.5-ad.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 29.5
// Taze openGame ile kendi dünyasında koşar; ENGINES'in bütün anahtarları açıktır. Yeni mekanik anahtarını src/systems/Engines.js'e ekler.
// Tek page.evaluate içinde check(ad, koşul, ayrıntı) topla; sonuçlar createChecks ile raporlanır. Eski tests.mjs'e test EKLEME.
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225);
  check('örnek: oyun ilerledi', game.state.time.day >= 1, `gün ${game.state.time.day}`);
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
