// Geriye uyumluluk: eski sürümlerin kayıtları (fixtures/) bugünkü oyunda açılır mı, bir gün sorunsuz yaşar mı?
//   save-v7.json : 9. aşamanın oyunu (kayıt sürümü 7): 14 sakin, atölye, anıt, iki Taş Ev
//   save-v8.json : 10. aşamanın oyunu (kayıt sürümü 8): 33. gün, 30 sakin, Gelişmiş Şehir, tüm üretim zincirleri
// Kullanım: node tools/sim/compat.mjs
import fs from 'fs';
import { openGame, createChecks } from './lib.mjs';

const fixtures = ['save-v7.json', 'save-v8.json'].map((name) => ({
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
      civic: s.civic,
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
  results.push({ name: `${tag}: fermanlar boş başlar`, ok: r.civic.storageLevel === 0 && !r.civic.craftGuild });
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
