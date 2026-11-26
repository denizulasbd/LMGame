// (34.2) Hız ölçümü: N kişilik kasabada 10 oyun gününün adım süresi (duvar saati). Nüfus ve yatak araçla verilir (kulübe kurulur, göçmen
// çağrılır); yiyecek ve odun her gün doldurulur, böylece iki kasaba da aynı koşulda yaşar. Her koşu ayrı bir tarayıcıdır.
// Kullanım: node tools/sim/speed34.mjs [--sizes 30,60] [--days 10] [--seed 42] [--repeat 2] [--profile]
//   --profile: en büyük kasabada CPU profili; en pahalı 12 işlev (kendi süresi) basılır.
import { openGame, parseArgs, capOutput } from './lib.mjs';

capOutput('speed34');
const { options } = parseArgs();
const sizes = String(options.sizes ?? '30,60').split(',').map(Number);
const days = Number(options.days ?? 10);
const seed = Number(options.seed ?? 42);
const repeat = Number(options.repeat ?? 2);

async function measure(size, profile = false) {
  const { browser, page, errors } = await openGame({ seed });
  const cdp = profile ? await page.context().newCDPSession(page) : null;
  const setup = await page.evaluate((size) => {
    const { sim, game } = window;
    const scene = game.scenes.current;
    sim.unlockAllParcels();
    game.state.settings.dilemmaTimer = true;
    sim.give({ wood: 99999, stone: 99999, food: 99999, gold: 99999 });
    // Yatak: gereken kadar kulübe (halka halka meydandan uzaklaşarak; açık parsellere de taşar)
    let homes = 0;
    for (let guard = 0; guard < 120; guard++) {
      const beds = game.state.buildings.filter((b) => b.type === 'cabin' && b.functional).reduce((a, b) => a + (b.capacity ?? 0), 0);
      if (beds >= size + 4) break;
      if (!sim.place('cabin', { maxRadius: 60 })) break;
      homes++;
    }
    let guard = 0;
    while (game.state.characters.length < size && guard++ < size * 2) {
      if (!scene.population.spawnNewcomer()) break;
    }
    sim.step(900 * 2); // varışlar yerleşsin (yaklaşık yarım gün)
    return { pop: game.state.characters.length, homes, beds: game.state.buildings.filter((b) => b.type === 'cabin').reduce((a, b) => a + (b.capacity ?? 0), 0) };
  }, size);
  if (cdp) {
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.start');
  }
  const run = await page.evaluate((days) => {
    const { sim, game } = window;
    const perDay = 225 * 24; // 4x hızda bir oyun günü
    let slowest = 0;
    const t0 = performance.now();
    for (let d = 0; d < days; d++) {
      sim.give({ wood: 99999, stone: 99999, food: 99999, gold: 99999 });
      const d0 = performance.now();
      sim.step(perDay);
      slowest = Math.max(slowest, performance.now() - d0);
    }
    return { ms: performance.now() - t0, slowest, pop: game.state.characters.length, day: game.state.time.day };
  }, days);
  let top = null;
  if (cdp) {
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map();
    const dt = profile.timeDeltas;
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    profile.samples.forEach((id, i) => {
      const n = byId.get(id);
      const key = `${n.callFrame.functionName || '(anonim)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber + 1}`;
      self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0));
    });
    top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${(v / 1000).toFixed(0)} ms ${k}`);
  }
  await browser.close();
  return { size, ...setup, ...run, errors, top };
}

const table = [];
for (const size of sizes) {
  const runs = [];
  for (let i = 0; i < repeat; i++) {
    const r = await measure(size, options.profile && size === Math.max(...sizes) && i === 0);
    runs.push(r);
    console.log(`N=${size} koşu ${i + 1}: nüfus ${r.pop} (kurulum ${r.pop}/${size}, kulübe ${r.homes}), ${days} gün ${(r.ms / 1000).toFixed(1)} sn, en yavaş gün ${(r.slowest / 1000).toFixed(2)} sn, sayfa hatası ${r.errors.length}`);
    if (r.top) console.log(`  CPU profili (kendi süresi):\n    ${r.top.join('\n    ')}`);
  }
  table.push({ size, ms: Math.min(...runs.map((r) => r.ms)), pops: runs.map((r) => r.pop).join('/') });
}
const base = table[0];
for (const t of table) console.log(`N=${t.size}: ${(t.ms / 1000).toFixed(1)} sn (en iyi koşu), nüfus ${t.pops}, oran ×${(t.ms / base.ms).toFixed(2)} (N=${base.size}'a göre)`);
process.exit(0);
