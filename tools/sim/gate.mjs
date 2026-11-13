// Tek kapı komutu (29.4b): sonraki aşamaların test maliyetini düşürmek için araçları paralel koşar, tek satırlık özet basar.
//   node tools/sim/gate.mjs --quick [--only <desen>]   aşama testleri (tools/sim/tests/*) + duman koşusu (autopilot 42 12)
//   node tools/sim/gate.mjs --full  [--only <desen>]   dondurulmuş tests.mjs + tests/* + audit + compat --sample + stress + determinizm
//   --jobs N  paralel iş sayısı (varsayılan: çekirdek sayısı, en çok 6)      --only: yalnızca adı desene uyan işler
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
if (!full && !options.quick) {
  console.log('Kullanım: node tools/sim/gate.mjs --quick|--full [--only <desen>] [--jobs N]');
  process.exit(2);
}
const jobsMax = Number(options.jobs ?? Math.min(6, os.cpus().length)) || 1;
const only = typeof options.only === 'string' ? new RegExp(options.only) : null;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const node = (file, ...args) => ({ cmd: process.execPath, args: [path.join(here, file), ...args] });
const jobs = [];
const add = (name, spec, extra = {}) => jobs.push({ name, ...spec, ...extra });

const stageTests = fs.existsSync(path.join(here, 'tests'))
  ? fs.readdirSync(path.join(here, 'tests')).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort()
  : [];
const pick = (name) => !only || only.test(name);

if (full) add('tests (dondurulmuş)', node('tests.mjs'));
for (const f of stageTests) if (pick(f)) add(`tests/${f}`, node(`tests/${f}`));
if (full) {
  add('audit', node('audit.mjs'));
  add('compat --sample', node('compat.mjs', '--sample'));
  add('stress 4x 50 gün', node('stress.mjs', '--speeds', '4', '--days', '50', '--jobs', '2', '--out', path.join(outDir, 'stress')));
  add('determinizm 42x50', { det: true });
} else {
  add('duman autopilot 42 12', node('autopilot.mjs', '42', '12', '--quiet'), { smoke: true });
  // audit 60 sn'den kısa (taban ölçüm: 58 sn) olduğu için hızlı kapıda da koşar; uzarsa yalnızca --full'da kalmalı
  if (pick('audit')) add('audit', node('audit.mjs'));
}

function run(job) {
  const log = path.join(outDir, `${job.name.replace(/[^\w.-]+/g, '_')}.log`);
  job.log = log;
  const t0 = Date.now();
  const spawnOne = (spec) => new Promise((resolve) => {
    const fd = fs.openSync(spec.log ?? log, 'w');
    const child = spawn(spec.cmd, spec.args, { cwd: root, stdio: ['ignore', fd, fd] });
    child.on('exit', (code) => resolve(code ?? 1));
  });
  const finish = (code, extra = {}) => {
    job.code = code;
    job.secs = Math.round((Date.now() - t0) / 1000);
    const text = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
    const m = text.match(/(\d+)\/(\d+) test geçti/);
    job.passed = m ? Number(m[1]) : code === 0 ? 1 : 0;
    job.total = m ? Number(m[2]) : 1;
    job.failedNames = text.split('\n').filter((l) => l.startsWith('KALDI ')).map((l) => l.slice(6));
    if (!m && code !== 0) job.failedNames.push(...(extra.notes ?? [`çıkış kodu ${code} (günlük: ${path.relative(root, log)})`]));
    if (m && code !== 0 && !job.failedNames.length) job.failedNames.push(`sayfa hatası / çıkış kodu ${code} (günlük: ${path.relative(root, log)})`);
  };
  if (!job.det) return spawnOne(job).then((c) => finish(c));
  // Determinizm: aynı tohum ve gün sayısıyla iki koşu, kayıt ve rapor bayt bayt aynı olmalı
  const files = ['a', 'b'].map((k) => ({ save: path.join(outDir, `det-${k}.save`), json: path.join(outDir, `det-${k}.json`), log: path.join(outDir, `det-${k}.log`) }));
  return Promise.all(files.map((f) => spawnOne({ ...node('autopilot.mjs', '42', '50', '--quiet', '--save', f.save, '--json', f.json), log: f.log }))).then((codes) => {
    const same = (k) => { try { return fs.readFileSync(files[0][k]).equals(fs.readFileSync(files[1][k])); } catch { return false; } };
    const notes = [];
    if (!same('save')) notes.push('determinizm: kayıt dosyaları farklı');
    if (!same('json')) notes.push('determinizm: rapor dosyaları farklı');
    if (codes.some((c) => c !== 0)) notes.push('determinizm: koşu sağlıksız çıktı');
    fs.writeFileSync(log, notes.length ? notes.map((n) => `KALDI ${n}`).join('\n') : '2/2 test geçti\n');
    finish(notes.length ? 1 : 0, { notes });
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
// (29.8) Evreler: hafif araçlar (tests, tests/*, compat) kendi aralarında; bitince ağır olanlar (stress, determinizm); audit en başta tek başına (30.2).
// Ağır işler ayrı çalışınca audit'in ses zamanlama testi paralel yük altında kırılmaz.
const heavy = (j) => Boolean(j.det) || /stress/.test(j.name);
// En uzun işler önce başlasın
const weight = (j) => (j.det ? 5 : /stress/.test(j.name) ? 6 : /audit|compat|tests \(/.test(j.name) ? 4 : 1);
const runPhase = async (list) => {
  const queue = [...list].sort((a, b) => weight(b) - weight(a));
  await Promise.all(Array.from({ length: Math.min(jobsMax, queue.length || 1) }, async () => { while (queue.length) await run(queue.shift()); }));
};
// (30.2) Üç evre: audit TEK BAŞINA (ses zamanlama testi paralel yük altında kırılıyordu), sonra öteki hafif araçlar, sonra ağır olanlar
const solo = (j) => j.name === 'audit';
await runPhase(jobs.filter((j) => solo(j)));
await runPhase(jobs.filter((j) => !heavy(j) && !solo(j)));
await runPhase(jobs.filter(heavy));
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
lines.push(`${allOk ? 'KAPI YEŞİL' : 'KAPI KIRMIZI'} · ${Math.round((Date.now() - t0) / 1000)} sn`);
console.log(lines.slice(0, 40).join('\n'));
process.exit(allOk ? 0 : 1);
