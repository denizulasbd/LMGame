// Geriye uyumluluk: eski sürümlerin kayıtları (fixtures/) bugünkü oyunda açılır mı, bir gün sorunsuz yaşar mı?
//   save-v7.json : 9. aşamanın oyunu (kayıt sürümü 7): 14 sakin, atölye, anıt, iki Taş Ev
//   save-v8.json : 10. aşamanın oyunu (kayıt sürümü 8): 33. gün, 30 sakin, Gelişmiş Şehir, tüm üretim zincirleri
//   save-v9.json : 11. aşamanın oyunu (kayıt sürümü 9): 33. gün, 30 sakin, şifacı, hayvanlar, fermanlar ve olaylar
// Kullanım: node tools/sim/compat.mjs
import fs from 'fs';
import { openGame, createChecks } from './lib.mjs';

const fixtures = ['save-v7.json', 'save-v8.json', 'save-v9.json'].map((name) => ({
  name,
  raw: fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
}));

const { browser, page, errors } = await openGame({ seed: 1 });
const { results, report } = createChecks();

for (const { name, raw } of fixtures) {
  const data = JSON.parse(raw);
  const r = await page.evaluate((raw) => {
    const game = window.game;
    const log = [];
    const offs = ['town:tierUp', 'town:tierAssessed', 'pet:arrived'].map((n) => game.events.on(n, (p) => log.push(n)));
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    const s = game.state;
    const loaded = { day: s.time.day, pop: s.characters.length, buildings: s.buildings.length, res: { ...s.resources } };
    window.sim.step(225 * 24); // bir gün
    game.render(0);
    offs.forEach((off) => off());
    return {
      loaded,
      after: { day: s.time.day, pop: s.characters.length, tier: s.town.tier, assessed: s.town.assessed },
      animals: s.animals.length,
      wild: s.animals.filter((a) => !a.isPet).length,
      pets: s.animals.filter((a) => a.isPet).length,
      civic: { ...s.civic },
      research: s.research,
      trade: s.trade,
      gold: s.resources.gold,
      academy: s.buildings.filter((b) => b.type === 'academy' || b.type === 'harbor' || b.type === 'wonder').length,
      dilemma: s.dilemma.nextDay,
      log,
      celebration: !document.querySelector('.celebration').hidden,
      title: document.querySelector('.hud-town-name').textContent,
    };
  }, raw);
  const tag = `${name} (sürüm ${data.version})`;
  results.push({ name: `${tag}: açıldı`, ok: r.loaded.pop === data.characters.length && r.loaded.buildings >= data.buildings.length, detail: `gün ${r.loaded.day}, ${r.loaded.pop} sakin, ${r.loaded.buildings} yapı` });
  results.push({ name: `${tag}: bir gün yaşadı`, ok: r.after.day === r.loaded.day + 1, detail: `gün ${r.after.day}, ${r.after.pop} sakin` });
  results.push({ name: `${tag}: yaban hayatı yerleşti`, ok: r.wild > 0, detail: `${r.wild} yaban, ${r.pets} evcil` });
  if (data.version < 9) results.push({ name: `${tag}: fermanlar boş başlar`, ok: r.civic.storageLevel === 0 && !r.civic.craftGuild });
  else results.push({ name: `${tag}: fermanlar korundu`, ok: r.civic.storageLevel === (data.civic.storageLevel ?? 0) && r.civic.craftGuild === Boolean(data.civic.craftGuild), detail: `depo kademesi ${r.civic.storageLevel}` });
  results.push({
    name: `${tag}: araştırma, liman ve hazine boş başlar`,
    ok: r.research.active === null && Object.keys(r.research.done).length === 0 && r.trade.shipments === 0 && r.gold === 0 && r.academy === 0 && r.civic.expeditionsSinceTalisman >= 0,
  });
  results.push({ name: `${tag}: olay takvimi kuruldu`, ok: Number.isFinite(r.dilemma), detail: `ilk olay günü ${r.dilemma}` });
  if (data.version < 8) {
    results.push({ name: `${tag}: seviye sessizce belirlendi`, ok: r.after.assessed && (r.log.includes('town:tierAssessed') || r.after.tier === 1), detail: `${r.title} · ${r.log.join(', ')}` });
  } else {
    results.push({ name: `${tag}: seviye korundu`, ok: r.after.tier === data.town.tier, detail: r.title });
  }
}
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
