// Geriye uyumluluk: eski sürümlerin kayıtları (fixtures/) bugünkü oyunda açılır mı, bir gün sorunsuz yaşar mı?
//   save-v2..v6  : 4.-8. aşamanın kayıt biçimleri (sentez: legacy-fixtures.mjs; o aşamaların kodu depoda yok).
//                  v2-v5 eski 48x48 biyomsuz harita, v3-v5 Sokak Lambası ('lamp'), v6 yarım kalmış bir yükseltme
//   save-v7.json : 9. aşamanın oyunu (kayıt sürümü 7): 14 sakin, atölye, anıt, iki Taş Ev
//   save-v8.json : 10. aşamanın oyunu (kayıt sürümü 8): 33. gün, 30 sakin, Gelişmiş Şehir, tüm üretim zincirleri
//   save-v9.json : 11. aşamanın oyunu (kayıt sürümü 9): 33. gün, 30 sakin, şifacı, hayvanlar, fermanlar ve olaylar
//   save-v10.json: 12. aşamanın oyunu (kayıt sürümü 10): 31. gün, 30 sakin, dört araştırma, liman, hazinede altın ve
//                  tamamlanmış Büyük Vadi Saat Kulesi
//   save-v11.json: 13. aşamanın oyunu (kayıt sürümü 11): 37. gün, 30 sakin, üç yadigâr, peyzaj, arşiv
//   save-v12.json: 14. aşamanın oyunu (kayıt sürümü 12, bugünkü): otopilotla 34 gün; festivaller, anılar
// Kullanım: node tools/sim/compat.mjs
import fs from 'fs';
import { openGame, createChecks } from './lib.mjs';

const fixtures = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => `save-v${v}.json`).filter((name) => fs.existsSync(new URL(`./fixtures/${name}`, import.meta.url))).map((name) => ({
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
    const scene = game.scenes.current;
    const loaded = {
      day: s.time.day,
      pop: s.characters.length,
      buildings: s.buildings.length,
      res: { ...s.resources },
      map: { ...s.map },
      terrain: scene.saves.snapshot().terrain.length,
      types: [...new Set(s.buildings.map((b) => b.type))],
      projects: s.buildings.filter((b) => b.project).map((b) => ({ id: b.id, job: scene.jobs.jobs.some((j) => j.buildingId === b.id) })),
    };
    // Referans bütünlüğü (yüklemeden hemen sonra ve bir gün sonra)
    const integrity = () => {
      const ids = new Set(s.characters.map((c) => c.id));
      const bIds = new Set(s.buildings.map((b) => b.id));
      const bad = [];
      for (const c of s.characters) {
        if (c.homeId !== null && !bIds.has(c.homeId)) bad.push(`${c.name} evsiz`);
        if (c.partnerId !== null && s.characters.find((o) => o.id === c.partnerId)?.partnerId !== c.id) bad.push(`${c.name} eş`);
        if (c.insideBuildingId !== null && !s.buildings.find((b) => b.id === c.insideBuildingId)?.occupants.has(c.id)) bad.push(`${c.name} içeride`);
        for (const p of c.parentIds) if (!ids.has(p)) bad.push(`${c.name} ebeveyn`);
      }
      for (const b of s.buildings) for (const id of b.occupants) if (!ids.has(id)) bad.push(`${b.type} içeride kayıp`);
      return bad;
    };
    loaded.integrity = integrity();
    window.sim.step(225 * 24); // bir gün
    game.render(0);
    offs.forEach((off) => off());
    const integrityAfter = integrity();
    return {
      integrityAfter,
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
      luxury: s.luxury,
      history: s.history.length,
      pinned: s.characters.filter((c) => c.workplaceId !== null).length,
      weddings: s.stats.weddings,
      married: s.characters.filter((c) => c.married).length,
      wonderStage: s.buildings.find((b) => b.type === 'wonder')?.wonderStage ?? 0,
      memories: s.characters.map((c) => c.memories.length),
      festivalStage: s.seasonFestival.stage,
      weather: s.weather.type,
      dilemma: s.dilemma.nextDay,
      log,
      celebration: !document.querySelector('.celebration').hidden,
      title: document.querySelector('.hud-town-name').textContent,
    };
  }, raw);
  const tag = `${name} (sürüm ${data.version})`;
  results.push({ name: `${tag}: referanslar sağlam (yüklenince ve bir gün sonra)`, ok: r.loaded.integrity.length === 0 && r.integrityAfter.length === 0, detail: [...r.loaded.integrity, ...r.integrityAfter].slice(0, 4).join(', ') });
  results.push({ name: `${tag}: harita farkları birebir uygulandı`, ok: r.loaded.terrain === data.terrain.length, detail: `${r.loaded.terrain}/${data.terrain.length} karo` });
  if (!data.map) results.push({ name: `${tag}: eski 48x48 biyomsuz harita`, ok: r.loaded.map.width === 48 && r.loaded.map.height === 48 && r.loaded.map.generator === 1, detail: JSON.stringify(r.loaded.map) });
  if (data.buildings.some((b) => b.type === 'lamp')) results.push({ name: `${tag}: Sokak Lambası Sokak Feneri'ne çevrildi`, ok: !r.loaded.types.includes('lamp') && r.loaded.types.includes('lantern') });
  if (data.buildings.some((b) => b.project)) results.push({ name: `${tag}: yarım kalan proje iş emriyle sürer`, ok: r.loaded.projects.length > 0 && r.loaded.projects.every((p) => p.job), detail: `${r.loaded.projects.length} proje` });
  results.push({ name: `${tag}: açıldı`, ok: r.loaded.pop === data.characters.length && r.loaded.buildings >= data.buildings.length, detail: `gün ${r.loaded.day}, ${r.loaded.pop} sakin, ${r.loaded.buildings} yapı` });
  results.push({ name: `${tag}: bir gün yaşadı`, ok: r.after.day === r.loaded.day + 1, detail: `gün ${r.after.day}, ${r.after.pop} sakin` });
  results.push({ name: `${tag}: yaban hayatı yerleşti`, ok: r.wild > 0, detail: `${r.wild} yaban, ${r.pets} evcil` });
  if (data.version < 9) results.push({ name: `${tag}: fermanlar boş başlar`, ok: r.civic.storageLevel === 0 && !r.civic.craftGuild });
  else results.push({ name: `${tag}: fermanlar korundu`, ok: r.civic.storageLevel === (data.civic.storageLevel ?? 0) && r.civic.craftGuild === Boolean(data.civic.craftGuild), detail: `depo kademesi ${r.civic.storageLevel}` });
  if (data.version < 10) {
    results.push({
      name: `${tag}: araştırma, liman ve hazine boş başlar`,
      ok: r.research.active === null && Object.keys(r.research.done).length === 0 && r.trade.shipments === 0 && r.gold === 0 && r.academy === 0 && r.civic.expeditionsSinceTalisman >= 0,
    });
  } else {
    results.push({
      name: `${tag}: araştırmalar, hazine ve harika korundu`,
      ok: Object.keys(r.research.done).length === Object.keys(data.research.done).length && r.gold >= data.resources.gold && r.wonderStage === Math.max(...data.buildings.filter((b) => b.type === 'wonder').map((b) => b.wonderStage), 0),
      detail: `${Object.keys(r.research.done).length} araştırma, ${r.gold} altın, harika aşaması ${r.wonderStage}`,
    });
  }
  if (data.version < 11) {
    results.push({
      name: `${tag}: yadigâr, sabit işçi boş; arşiv kuruldu; düğün sayacı tahmin edildi`,
      ok: Object.keys(r.luxury.relics).length === 0 && !r.luxury.silk && r.pinned === 0 && r.history >= 1 && r.weddings === Math.floor(r.married / 2),
      detail: `arşiv ${r.history} gün, düğün ${r.weddings}`,
    });
  } else {
    results.push({
      name: `${tag}: yadigârlar ve arşiv korundu`,
      ok: Object.keys(r.luxury.relics).length === Object.keys(data.luxury.relics).length && r.history >= data.history.length,
      detail: `${Object.keys(r.luxury.relics).length} yadigâr, arşiv ${r.history} gün`,
    });
  }
  results.push({
    name: `${tag}: her sakine anı defteri açıldı, festival ve hava geçerli`,
    ok: r.memories.every((n) => n >= 1) && (r.festivalStage === null || r.festivalStage === 'announced' || r.festivalStage === 'active') && typeof r.weather === 'string',
    detail: `anı ${Math.min(...r.memories)}-${Math.max(...r.memories)}, hava ${r.weather}`,
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
