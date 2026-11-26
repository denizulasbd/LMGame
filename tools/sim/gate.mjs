// Tek kapı komutu (29.4b; 33.0'da hafifletildi). Araçları paralel koşar, tek satırlık özet basar.
//   node tools/sim/gate.mjs [--quick]   (varsayılan) cycles + bütün aşama testleri (tests/*) + compat --sample + 1 tohum × 15 gün otopilot dumanı. Hedef ≤ 5 dk.
//   node tools/sim/gate.mjs --full      quick + compat --all + 3 tohum × 30 gün otopilot (yalnızca çökme ve bekçi/monitor; sayısal hedef yok)
//   --jobs N  paralel iş sayısı (varsayılan: çekirdek sayısı, en çok 4)      --only <desen>: yalnızca adı desene uyan işler
// Kapıda DEĞİLDİR (araç olarak elle koşulur): audit, stress, determinizm (iki otopilot koşusunu karşılaştırma), tools/sim/archive/tests.mjs.
// Sunucu açık değilse kapı kendisi başlatıp kapatır. Ayrıntılı günlükler tools/sim/out/gate/ altına yazılır.
// Çıktı en çok 40 satır: iş başına bir satır, ardından yalnızca kalan testlerin adları. Çıkış kodu: hepsi yeşilse 0.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs, BASE_URL } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(here, 'out', 'gate');
const { options } = parseArgs();
const full = Boolean(options.full);
const jobsMax = Number(options.jobs ?? Math.min(4, os.cpus().length)) || 1;
const only = typeof options.only === 'string' ? new RegExp(options.only) : null;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const node = (file, ...args) => ({ cmd: process.execPath, args: [path.join(here, file), ...args] });
const jobs = [];
const pick = (name) => !only || only.test(name);
const add = (name, spec, weight = 1, extra = {}) => { if (pick(name)) jobs.push({ name, weight, ...spec, ...extra }); };

const stageTests = fs.existsSync(path.join(here, 'tests'))
  ? fs.readdirSync(path.join(here, 'tests')).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()
  : [];

add('cycles', node('cycles.mjs'));
// 30.1 gerçek fare ve gerçek zamanla çalışır: paralel yükte arada takılır, bu yüzden kaldıysa bir kez yeniden denenir (günlükte yazar)
for (const f of stageTests) add(`tests/${f}`, node(`tests/${f}`), /32\.6b-integration|30\.1-first-hour/.test(f) ? 6 : 2, { retry: /30\.1-first-hour/.test(f) ? 1 : 0 });
add('compat --sample', node('compat.mjs', '--sample'), 5);
add('duman autopilot 42 × 15 gün', node('autopilot.mjs', '42', '15', '--quiet'), 9);
if (full) {
  add('compat --all', node('compat.mjs', '--all'), 7);
  for (const seed of [42, 7, 101]) add(`otopilot ${seed} × 30 gün`, node('autopilot.mjs', String(seed), '30', '--quiet'), 10);
}

function run(job) {
  const log = path.join(outDir, `${job.name.replace(/[^\w.-]+/g, '_')}.log`);
  const t0 = Date.now();
  const once = () => new Promise((resolve) => {
    const fd = fs.openSync(log, 'w');
    const child = spawn(job.cmd, job.args, { cwd: root, stdio: ['ignore', fd, fd] });
    child.on('exit', (code) => resolve(code ?? 1));
  });
  return once().then(async (code) => {
    for (let i = 0; i < (job.retry ?? 0) && code !== 0; i++) { job.name += ' (2. deneme)'; code = await once(); }
    return code;
  }).then((code) => {
    job.code = code;
    job.secs = Math.round((Date.now() - t0) / 1000);
    const text = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
    const m = text.match(/(\d+)\/(\d+) test geçti/);
    job.passed = m ? Number(m[1]) : code === 0 ? 1 : 0;
    job.total = m ? Number(m[2]) : 1;
    job.failedNames = text.split('\n').filter((l) => l.startsWith('KALDI ')).map((l) => l.slice(6));
    if (!m && code !== 0) job.failedNames.push(`çıkış kodu ${code} (günlük: ${path.relative(root, log)})`);
    if (m && code !== 0 && !job.failedNames.length) job.failedNames.push(`sayfa hatası / çıkış kodu ${code} (günlük: ${path.relative(root, log)})`);
  });
}

async function serverUp() {
  try { return (await fetch(BASE_URL)).ok; } catch { return false; }
}
let server = null;
if (!(await serverUp())) {
  const port = new URL(BASE_URL).port || '8080';
  server = spawn('python3', [path.join(root, 'tools', 'serve.py'), port], { stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await serverUp()); i++) await new Promise((r) => setTimeout(r, 200));
}

const t0 = Date.now();
// En uzun işler önce başlasın (daha iyi paketleme); hepsi tek kuyrukta
const queue = [...jobs].sort((a, b) => b.weight - a.weight);
await Promise.all(Array.from({ length: Math.min(jobsMax, queue.length || 1) }, async () => { while (queue.length) await run(queue.shift()); }));
server?.kill();

const lines = [];
let allOk = true;
for (const j of jobs) {
  const ok = j.code === 0 && j.passed === j.total;
  allOk &&= ok;
  lines.push(`${ok ? 'TAMAM' : 'SORUN'} ${j.name}: ${j.passed}/${j.total} · ${j.secs} sn`);
}
const fails = jobs.flatMap((j) => j.failedNames.map((n) => `  KALDI [${j.name}] ${n}`));
const room = Math.max(0, 40 - lines.length - 1);
lines.push(...fails.slice(0, room));
if (fails.length > room) lines.push(`  ... ${fails.length - room} satır daha (günlükler: ${path.relative(root, outDir)})`);
lines.push(`${allOk ? 'KAPI YEŞİL' : 'KAPI KIRMIZI'} (${full ? 'full' : 'quick'}) · ${Math.round((Date.now() - t0) / 1000)} sn`);
console.log(lines.slice(0, 40).join('\n'));
process.exit(allOk ? 0 : 1);
