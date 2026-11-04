// Stres matrisi: birkaç tohumda ve hızda otopilotlu uzun simülasyonları paralel koşturur, bekçi raporlarını toplar.
// Her koşu ayrı bir tarayıcıdır (autopilot.mjs --json); sonunda tablo ve toplam basılır.
//
// Kullanım: node tools/sim/stress.mjs [--seeds 7,13,21,42,77,101] [--speeds 4,2,1] [--days 50] [--jobs 4] [--out klasör]
// Çıkış kodu: herhangi bir koşuda sayfa hatası, takılan sakin, kopuk referans ya da taşan ev varsa 1.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from './lib.mjs';

const { options } = parseArgs();
const seeds = String(options.seeds ?? '7,13,21,42,77,101').split(',').map(Number);
const speeds = String(options.speeds ?? '4,2,1').split(',').map(Number);
const days = Number(options.days ?? 50);
const jobs = Number(options.jobs ?? Math.max(1, Math.min(4, os.cpus().length)));
const out = options.out ?? fs.mkdtempSync(path.join(os.tmpdir(), 'lmgame-stress-'));
fs.mkdirSync(out, { recursive: true });
const here = path.dirname(fileURLToPath(import.meta.url));

const queue = [];
// En uzun koşular (1x) önce başlasın ki sona tek başına kalmasın
for (const speed of [...speeds].sort((a, b) => a - b)) for (const seed of seeds) queue.push({ seed, speed });

const results = [];
const started = Date.now();
async function worker() {
  while (queue.length) {
    const { seed, speed } = queue.shift();
    const json = path.join(out, `s${seed}-x${speed}.json`);
    const log = path.join(out, `s${seed}-x${speed}.log`);
    const t0 = Date.now();
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [path.join(here, 'autopilot.mjs'), String(seed), String(days), '--speed', String(speed), '--quiet', '--json', json], {
        stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log, 'a')],
      });
      child.on('exit', resolve);
    });
    let data = null;
    try {
      data = JSON.parse(fs.readFileSync(json, 'utf8'));
    } catch {
      /* koşu rapor yazamadan çöktü */
    }
    const minutes = ((Date.now() - t0) / 60000).toFixed(1);
    results.push({ seed, speed, code, data, minutes, log });
    const m = data?.monitor;
    console.log(
      `${code === 0 ? 'TAMAM' : 'SORUN'} tohum ${seed} ${speed}x: ${m ? `gün ${m.day}, nüfus ${m.pop} (en çok ${m.maxPop}, ${m.children} çocuk, ${m.married} evli), seviye ${m.tier}, refah %${m.welfare}, takılma ${m.stuck.length}, kopuk ${m.brokenCount}, taşan ${m.overfullCount}, hata ${data.errors.length}` : 'rapor yok'} · ${minutes} dk`
    );
  }
}
await Promise.all(Array.from({ length: jobs }, worker));

results.sort((a, b) => a.speed - b.speed || a.seed - b.seed);
const sum = (f) => results.reduce((a, r) => a + (r.data ? f(r.data) : 0), 0);
const q = sum((d) => d.monitor.quarrels ?? 0);
const rc = sum((d) => d.monitor.reconciliations ?? 0);
console.log(`\n${results.length} koşu, ${((Date.now() - started) / 60000).toFixed(1)} dk · raporlar: ${out}`);
console.log(
  `toplam: takılma ${sum((d) => d.monitor.stuck.length)}, kopuk referans ${sum((d) => d.monitor.brokenCount)}, taşan ev ${sum((d) => d.monitor.overfullCount)}, ` +
    `bekleyen iş ${sum((d) => d.monitor.staleJobs.length)}, üretmeyen iş yeri ${sum((d) => d.monitor.stalledWorkplaces.length)}, sayfa hatası ${sum((d) => d.errors.length)}`
);
console.log(
  `olaylar: düğün ${sum((d) => d.monitor.events.weddings)}, doğum ${sum((d) => d.monitor.events.births)}, büyüme ${sum((d) => d.monitor.events.grownUp)}, ` +
    `atışma ${sum((d) => d.monitor.events.quarrels)}, barışma ${sum((d) => d.monitor.events.reconciled)}, hastalık ${sum((d) => d.monitor.events.ill)}`
);
console.log(
  `(15. aşama) barışma / atışma: ${rc}/${q} (%${q ? Math.round((rc / q) * 100) : 0}) · usta işi eser ${sum((d) => d.monitor.events.masterworks)} ` +
    `(sergilenen ${sum((d) => d.monitor.events.exhibited)}, satılan ${sum((d) => d.monitor.events.sold)}) · Usta kostümü giyen ${sum((d) => d.monitor.outfits.filter((o) => o.endsWith(':3')).length)}, ` +
    `Kalfa ${sum((d) => d.monitor.outfits.filter((o) => o.endsWith(':2')).length)} · kıyafet hatası ${sum((d) => d.monitor.outfitErrors.length)} · ` +
    `küs çift (son / en çok / toplam çift): ${sum((d) => d.monitor.feuds ?? 0)} / ${sum((d) => d.monitor.maxFeuds ?? 0)} / ${sum((d) => d.monitor.pairs ?? 0)}`
);
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(results.map(({ data, ...r }) => ({ ...r, monitor: data?.monitor, errors: data?.errors })), null, 1));
process.exit(results.every((r) => r.code === 0) ? 0 : 1);
