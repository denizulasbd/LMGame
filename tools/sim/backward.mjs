// (32.6b) Geri dönüş güvenliği: bir kayıt fikstürünü BAŞKA bir sürümün oyununda (LMGAME_URL; ör. main'in ayrı bir worktree kopyası) yükler.
// Yeni sürümün kaydı eski kodda çökmeden açılmalı: bilinmeyen alanlar (justice, clubs, university, renown, sakin alanları) ve bilinmeyen
// yapı türleri yüzünden çökme ya da ret olmamalı, iki gün yaşanabilmeli, eski kodun yazdığı kayıt yeni kodda yeniden açılabilmeli.
// Kullanım:  python3 tools/serve.py 8082   (main'in worktree kopyasında)
//            LMGAME_URL=http://localhost:8082 node tools/sim/backward.mjs [fikstür=fixtures/save-v41-asama32.json] [--out yazilan-kayit.json]
// Çıktı: yüklendi mi, sayfa hataları, bilinmeyen yapı türleri, iki gün sonra durum, eski kodun yeniden yazdığı kaydın boyutu / sürümü.
import fs from 'fs';
import { openGame, parseArgs } from './lib.mjs';

const { positional, options } = parseArgs();
const file = new URL(positional[0] ?? './fixtures/save-v41-asama32.json', import.meta.url);
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
const { browser, page, errors } = await openGame({ seed: 1 });
const log = (k, v) => console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
const head = await page.evaluate(async () => ({ saveVersion: (await import('/src/config.js')).CONFIG.SAVE_VERSION, buildings: Object.keys((await import('/src/data/buildings.js')).BUILDINGS).length }));
log('hedef oyun', head);
log('kayıt', { sürüm: data.version, gün: data.time?.day, sakin: data.characters.length, yapı: data.buildings.length });
const result = await page.evaluate(async (raw) => {
  const game = window.game;
  const toasts = [];
  game.events.on('toast', (t) => toasts.push(t.text));
  localStorage.setItem('lmgame.save.v2', raw);
  let threw = null;
  try { game.events.emit('ui:load'); } catch (e) { threw = String(e.stack ?? e).slice(0, 300); }
  const s = game.state;
  const { BUILDINGS } = await import('/src/data/buildings.js');
  const saved = JSON.parse(raw);
  const unknown = [...new Set(saved.buildings.map((b) => b.type).filter((t) => !BUILDINGS[t]))];
  return {
    threw, day: s.time.day, pop: s.characters.length, buildings: s.buildings.length, types: [...new Set(s.buildings.map((b) => b.type))].length,
    unknown, kept: unknown.filter((t) => s.buildings.some((b) => b.type === t)), toasts: toasts.slice(0, 5),
    stillStored: Boolean(localStorage.getItem('lmgame.save.v2')),
  };
}, raw);
log('yükleme', result);
const after = await page.evaluate(() => {
  const s = window.game.state;
  const d0 = s.time.day;
  window.sim.step(225 * 24 * 2);
  return { gün: [d0, s.time.day], sakin: s.characters.length, yapı: s.buildings.length, hazine: Math.round(s.resources.gold) };
});
log('iki gün sonra', after);
const saved = await page.evaluate(() => {
  window.game.events.emit('ui:save');
  const raw = localStorage.getItem('lmgame.save.v2');
  const j = JSON.parse(raw);
  return { raw, version: j.version, bytes: raw.length, keys: Object.keys(j).filter((k) => ['justice', 'clubs', 'university', 'renown'].includes(k)), buildingTypes: [...new Set(j.buildings.map((b) => b.type))].filter((t) => ['courthouse', 'university', 'gardenClub', 'sewingClub', 'paintingClub', 'peaceFountain', 'royalRoseGarden', 'royalArchive'].includes(t)) };
});
log('eski kodun yazdığı kayıt', { sürüm: saved.version, bayt: saved.bytes, korunanAlanlar: saved.keys, korunanYapılar: saved.buildingTypes });
if (options.out) fs.writeFileSync(options.out, saved.raw);
log('sayfa hataları', errors.length ? errors.slice(0, 5) : 'yok');
await browser.close();
const ok = !result.threw && result.pop === data.characters.length && after.gün[1] >= after.gün[0] + 1 && errors.length === 0;
console.log(ok ? 'SONUÇ: yüklendi ve yaşadı' : 'SONUÇ: SORUN VAR');
process.exit(ok ? 0 : 1);
