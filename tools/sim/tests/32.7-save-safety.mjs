// Aşama 32.7 testi: kayıt güvenliği. Okunamayan kayıt (bozuk JSON, desteklenmeyen sürüm, restore hatası, bilinmeyen yapı türü) ile
// açılışta yuva SİLİNMEZ: ham veri lmgame.save.broken.<yuva>.<zaman> anahtarına yedeklenir, oyun açılır, sayfa hatası olmaz;
// bilinmeyen yapı türü bütün kaydı reddettirmez (o yapı atlanır). "Dosyadan yükle" ile gidiş-dönüş.
// Kullanım: node tools/sim/tests/32.7-save-safety.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.7
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const pageErrors = [];
const SESSION = 'lmgame.session.v2';
const MAIN = 'lmgame.save.v2';

/** Açılış: verilen depolamayla ana sayfa (tohumsuz). Dönüş: { browser, page, errors, brokenKeys, ... } */
async function boot(storage) {
  const g = await openGame({ path: '?boot', storage, randomSeed: 7 });
  await g.page.waitForFunction(() => window.game?.scenes?.current?.world);
  await g.page.waitForTimeout(300);
  const info = await g.page.evaluate(() => ({
    keys: Object.keys(localStorage).filter((k) => k.startsWith('lmgame.save.broken.')),
    day: window.game.state.time.day,
    toast: [...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('Bir kayıt okunamadı ve yedeklendi.')),
  }));
  pageErrors.push(...g.errors.filter((e) => !e.startsWith('[')));
  return { ...g, ...info };
}

// Sağlam bir kayıt üret (tohum 5, birkaç gün): sonraki açılışlar bunu bozar
const seedGame = await openGame({ seed: 5 });
const goodRaw = await seedGame.page.evaluate(() => {
  sim.give({ wood: 999, stone: 999, food: 999 });
  sim.place('cabin');
  sim.step(225 * 6);
  game.scenes.current.saves.write('main');
  return localStorage.getItem('lmgame.save.v2');
});
const good = JSON.parse(goodRaw);
await seedGame.browser.close();
results.push({ name: 'kurulum: sağlam kayıt üretildi', ok: good.version > 0 && good.buildings.length > 0, detail: `v${good.version}` });

const cases = [
  ['bozuk JSON', { [SESSION]: '{"version": 41, "seed": 5, "time": {"day"' }, 'session'],
  ['desteklenmeyen sürüm', { [SESSION]: JSON.stringify({ ...good, version: 999 }) }, 'session'],
  ['restore hatası', { [SESSION]: JSON.stringify({ ...good, jobs: 'yok' }) }, 'session'],
  ['bozuk ana kayıt', { [MAIN]: 'çöp{' }, 'main'],
];
for (const [name, storage, slot] of cases) {
  const g = await boot(storage);
  const kept = g.keys.find((k) => k.startsWith(`lmgame.save.broken.${slot}.`));
  const raw = await g.page.evaluate((k) => (k ? localStorage.getItem(k) : null), kept);
  results.push({ name: `${name}: yedek anahtarı oluştu ve ham veri aynen duruyor`, ok: Boolean(kept) && raw === storage[slot === 'session' ? SESSION : MAIN], detail: g.keys.join(',') });
  results.push({ name: `${name}: oyun açıldı ve uyarı gösterildi`, ok: g.day >= 1 && g.toast, detail: `gün ${g.day} uyarı ${g.toast}` });
  const cleared = await g.page.evaluate(([a, b]) => ({ s: localStorage.getItem(a), m: localStorage.getItem(b) }), [SESSION, MAIN]);
  results.push({ name: `${name}: bozuk yuva temizlendi (yedek ayrıca duruyor)`, ok: (slot === 'session' ? cleared.s : cleared.m) !== storage[slot === 'session' ? SESSION : MAIN], detail: '' });
  await g.browser.close();
}

// bozuk oturum + sağlam ana kayıt: oyun ana kayıttan devam eder (başlangıç ekranı), oturum yedeklenir
{
  const g = await boot({ [SESSION]: 'çöp', [MAIN]: goodRaw });
  const same = await g.page.evaluate(() => window.game.state.seed);
  results.push({ name: 'bozuk oturum + sağlam ana kayıt: ana kayıttan açıldı, ana kayıt silinmedi, oturum yedeklendi', ok: same === 5 && g.keys.length === 1 && g.toast, detail: `tohum ${same} yedek ${g.keys.length}` });
  const mainKept = await g.page.evaluate((k) => localStorage.getItem(k) !== null, MAIN);
  results.push({ name: 'ana kayıt yerinde', ok: mainKept });
  await g.browser.close();
}

// en çok 3 yedek: dört bozuk açılış sonrası en eskisi gider
{
  const stale = {};
  for (let i = 1; i <= 3; i++) stale[`lmgame.save.broken.session.${1000 + i}`] = `eski${i}`;
  const g = await boot({ ...stale, [SESSION]: 'yeni çöp' });
  const left = g.keys.sort();
  results.push({ name: 'en çok 3 yedek tutulur, en eskisi silinir', ok: left.length === 3 && !left.includes('lmgame.save.broken.session.1001'), detail: left.join(',') });
  await g.browser.close();
}

// bilinmeyen yapı türü: kayıt reddedilmez, o yapı atlanır, uyarı
{
  const weird = JSON.parse(goodRaw);
  const ghost = { ...weird.buildings[0], type: 'gelecekteBirYapi', id: 99991 };
  weird.buildings.push(ghost);
  const total = weird.buildings.length;
  const g = await boot({ [SESSION]: JSON.stringify(weird) });
  const out = await g.page.evaluate(() => {
    window.game.update(1 / 60);
    return { seed: window.game.state.seed, count: window.game.state.buildings.length, ghost: window.game.state.buildings.some((b) => b.type === 'gelecekteBirYapi'), warn: [...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('yapı tanınmadı')) };
  });
  results.push({ name: 'bilinmeyen yapı türü: kayıt yüklendi, yapı atlandı, uyarı verildi, yedek gerekmedi', ok: out.seed === 5 && out.count === total - 1 && !out.ghost && out.warn && g.keys.length === 0, detail: JSON.stringify(out) });
  await g.browser.close();
}

// gidiş-dönüş: indir -> başka oyun -> Dosyadan yükle (gerçek dosya girdisiyle)
{
  const g = await openGame({ seed: 11 });
  await g.page.evaluate(() => { sim.give({ wood: 999, stone: 999, food: 999 }); sim.place('cabin'); sim.step(225 * 3); game.scenes.current.saves.write('main'); });
  const exported = await g.page.evaluate(() => new Promise((resolve) => {
    game.events.on('save:file', (f) => resolve(f));
    game.events.emit('ui:exportSave');
  }));
  const before = await g.page.evaluate(() => ({ seed: game.state.seed, day: game.state.time.day, b: game.state.buildings.length, res: JSON.stringify(game.state.resources) }));
  // oyunu başka bir kasabaya çevir
  await g.page.evaluate(() => { game.events.emit('ui:newGame'); });
  await g.page.waitForTimeout(200);
  const changed = await g.page.evaluate(() => game.state.seed);
  const fs = await import('fs');
  const os = await import('os');
  const file = `${os.tmpdir()}/lmgame-32.7-roundtrip.json`;
  fs.writeFileSync(file, exported.text);
  await g.page.evaluate(() => game.events.emit('ui:toggleSettings'));
  await g.page.setInputFiles('.settings-import-input', file);
  await g.page.waitForFunction((s) => window.game.state.seed === s, before.seed, { timeout: 5000 });
  const after = await g.page.evaluate(() => ({ seed: game.state.seed, day: game.state.time.day, b: game.state.buildings.length, res: JSON.stringify(game.state.resources), broken: Object.keys(localStorage).filter((k) => k.startsWith('lmgame.save.broken.')), rows: document.querySelectorAll('.settings-broken-item').length, rowHidden: document.querySelector('.settings-broken').hidden }));
  results.push({ name: 'gidiş-dönüş: dışa aktarma → yeni harita → Dosyadan yükle: tohum, gün, yapı sayısı ve kaynaklar aynı', ok: changed !== before.seed && after.seed === before.seed && after.day === before.day && after.b === before.b && after.res === before.res, detail: JSON.stringify({ before, after }) });
  results.push({ name: 'içe aktarma önceki ana kaydı yedekledi; Ayarlar satırı göründü', ok: after.broken.length >= 1 && after.rows === after.broken.length && after.rowHidden === false, detail: JSON.stringify(after.broken) });
  // Yeniden dene: yedeği yükler ve siler
  const key = after.broken[0];
  await g.page.evaluate((k) => game.events.emit('ui:retryBroken', { key: k }), key);
  await g.page.waitForTimeout(200);
  const retried = await g.page.evaluate((k) => ({ has: localStorage.getItem(k) !== null }), key);
  results.push({ name: 'Yeniden dene: yüklenen yedek silinir', ok: retried.has === false });
  // bozuk bir yedek yeniden denenince yerinde kalır
  await g.page.evaluate(() => localStorage.setItem('lmgame.save.broken.main.5', 'çöp'));
  await g.page.evaluate(() => game.events.emit('ui:retryBroken', { key: 'lmgame.save.broken.main.5' }));
  const stays = await g.page.evaluate(() => localStorage.getItem('lmgame.save.broken.main.5'));
  results.push({ name: 'Yeniden dene başarısızsa yedek silinmez', ok: stays === 'çöp' });
  pageErrors.push(...g.errors.filter((e) => !e.startsWith('[')));
  await g.browser.close();
}

const ok = report(pageErrors);
process.exit(ok ? 0 : 1);
