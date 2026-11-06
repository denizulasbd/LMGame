// Geriye uyumluluk: eski sürümlerin kayıtları (fixtures/) bugünkü oyunda açılır mı, bir gün sorunsuz yaşar mı?
//   save-v2..v6  : 4.-8. aşamanın kayıt biçimleri (sentez: legacy-fixtures.mjs; o aşamaların kodu depoda yok).
//                  v2-v5 eski 48x48 biyomsuz harita, v3-v5 Sokak Lambası ('lamp'), v6 yarım kalmış bir yükseltme
//   save-v7.json : 9. aşamanın oyunu (kayıt sürümü 7): 14 sakin, atölye, anıt, iki Taş Ev
//   save-v8.json : 10. aşamanın oyunu (kayıt sürümü 8): 33. gün, 30 sakin, Gelişmiş Şehir, tüm üretim zincirleri
//   save-v9.json : 11. aşamanın oyunu (kayıt sürümü 9): 33. gün, 30 sakin, şifacı, hayvanlar, fermanlar ve olaylar
//   save-v10.json: 12. aşamanın oyunu (kayıt sürümü 10): 31. gün, 30 sakin, dört araştırma, liman, hazinede altın ve
//                  tamamlanmış Büyük Vadi Saat Kulesi
//   save-v11.json: 13. aşamanın oyunu (kayıt sürümü 11): 37. gün, 30 sakin, üç yadigâr, peyzaj, arşiv
//   save-v12.json: 14. aşamanın oyunu (kayıt sürümü 12): otopilotla 34 gün; festivaller, anılar
//   save-v13.json: 15. aşamanın oyunu (kayıt sürümü 13): otopilotla 34 gün; usta işi eserler, barışmalar
//   save-v14.json: 16. aşamanın oyunu (kayıt sürümü 14): otopilotla 34 gün; seferler, ganimetler, çözülen yazıtlar
//   save-v15.json: 18. aşamanın oyunu (kayıt sürümü 15): otopilotla 34 gün; döşenen yollar, tabelalar, süs ağaçları,
//                  çitler, kasaba estetiği. Eski kayıtlarda (sürüm 2-14) peyzaj durumu boş başlar, estetik yüklenince hesaplanır
//   save-v16.json: 19. aşamanın oyunu (kayıt sürümü 16): otopilotla 34 gün; evli çiftler ve ortak evleri, karakter
//                  huyları, dolaşan dedikodular, son duyulan haberler. Eski kayıtlarda (sürüm 2-15) huylar ilk açılışta
//                  dağıtılır (dördü de görülür), dedikodu boş başlar; evli çiftler kendi evlerinde kalır. Bu kayıt bir keşif
//                  seferinin ortasındadır (macera pencereleri açılır ve sefer döner)
//   save-v17.json: 20. aşamanın oyunu (kayıt sürümü 17): otopilotla 34 gün; aşama aşama yükselen Ulu Saat Kulesi,
//                  Altın Çağ, Tarihçe Kütüğü, Mermer Çeşme ve Altın Çağ Fenerleri, antik kitaplar. Eski kayıtlarda (sürüm 2-16)
//                  Tarihçe sakinlerden çıkarılır; tamamlanmış kulesi olan kasaba Altın Çağ'a sessizce (kutlamasız) girer
//   save-v18.json: 21. aşamanın oyunu (kayıt sürümü 18, bugünkü): otopilotla 34 gün; sakinlerin keseleri ve çantaları,
//                  karşılanan / açık dilekçeler, Yönetim Güveni. Eski kayıtlarda (sürüm 2-17) her yetişkine 12, her çocuğa 3
//                  altın başlangıç harçlığı verilir, çantalar boş başlar, Yönetim Güveni %75'tir, dilekçe ve isyan yoktur
// Kullanım: node tools/sim/compat.mjs
import fs from 'fs';
import { openGame, createChecks } from './lib.mjs';

const fixtures = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((v) => `save-v${v}.json`).filter((name) => fs.existsSync(new URL(`./fixtures/${name}`, import.meta.url))).map((name) => ({
  name,
  raw: fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
}));

const { browser, page, errors } = await openGame({ seed: 1 });
const { results, report } = createChecks();

for (const { name, raw } of fixtures) {
  const data = JSON.parse(raw);
  const r = await page.evaluate(async (raw) => {
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
      exploration: { items: { ...s.exploration.items }, inscriptions: Object.keys(s.exploration.inscriptions).length, expeditions: s.exploration.expeditions, cityMap: s.exploration.cityMap, tales: s.characters.filter((c) => c.tale).length },
      // yüklendiği an (bir gün yaşarken ustalar yeni eser çıkarabilir)
      masterworks: { items: s.masterworks.items.length, made: s.masterworks.made, exhibited: s.masterworks.items.filter((i) => i.status === 'exhibited').length },
      // (18. aşama) peyzaj: tabela adları, fidanların dikiliş anı, çit bağlantıları, estetik
      landscape: {
        score: s.landscape.score,
        percent: s.landscape.percent,
        credit: { ...s.landscape.refundCredit },
        painted: s.landscape.roadsPainted,
        field: scene.world.aesthetics.some((v) => v > 0),
        signs: s.buildings.filter((b) => b.type === 'signpost').map((b) => b.label),
        trees: s.buildings.filter((b) => b.definition.ornamentalTree).map((b) => b.plantedAt),
        fencesLinked: s.buildings.filter((b) => b.type === 'woodFence').every((b) => b.connect),
        speedPath: scene.world.map.getSpeedMultiplier(0, 0) > 0,
      },
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
    // (20. aşama) Ulu Saat Kulesi, Altın Çağ, Tarihçe (yüklendiği an)
    const towerB = s.buildings.find((b) => b.type === 'wonder');
    loaded.golden = {
      stage: towerB?.wonderStage ?? null,
      complete: Boolean(towerB?.wonderComplete),
      since: s.goldenAge.since,
      celebration: s.goldenAge.celebration !== null,
      chimes: s.goldenAge.chimes,
      books: s.goldenAge.books,
      founders: s.chronicle.founders.length,
      couple: s.chronicle.firstCouple,
      masterwork: s.chronicle.firstMasterwork,
      stages: Object.keys(s.chronicle.towerStages).length,
      gears: s.resources.gears,
    };
    // (21. aşama) kese, çanta, güven, dilekçeler (yüklendiği an)
    loaded.citizens = {
      coins: s.characters.map((c) => [c.id, c.coins, c.isChild]),
      inv: s.characters.map((c) => [c.id, JSON.stringify(c.inventory)]),
      trust: s.trust.value,
      revolt: s.trust.revolt !== null,
      petitions: s.petitions.list.map((p) => `${p.id}:${p.kind}:${p.characterId}`),
      made: s.petitions.made,
    };
    // (19. aşama) huylar, ortak evler, dedikodu (yüklendiği an)
    loaded.social = {
      quirks: s.characters.map((c) => c.quirk),
      kinds: [...new Set(s.characters.map((c) => c.quirk))].length,
      couples: s.characters.filter((c) => c.married).map((c) => [c.id, c.partnerId, c.homeId]),
      gossip: s.social.gossip.length,
      news: s.characters.filter((c) => c.lastNews).length,
      party: s.social.party !== null,
    };
    const startDay = s.time.day;
    window.sim.step(225 * 24); // bir gün
    // Yolda bir sefer varsa macera pencereleri oyunu (gerçek zamanda 30 sn) durdurur: gün dönene kadar biraz daha ilerlet
    for (let guard = 0; s.time.day === startDay && guard < 48; guard++) window.sim.step(225);
    game.render(0);
    offs.forEach((off) => off());
    const integrityAfter = integrity();
    const expeditionAfter = { active: Boolean(s.dilemma.expedition), away: s.characters.filter((c) => c.away).length, adventure: s.dilemma.active?.kind === 'adventure' };
    const { outfitFor } = await import('/src/systems/SkillSystem.js');
    const { inventoryCapacity } = await import('/src/systems/Citizens.js');
    const citizensAfter = {
      trust: s.trust.value,
      revolt: s.trust.revolt !== null,
      bagsOk: s.characters.every((c) => Number.isFinite(c.coins) && c.coins >= 0 && c.inventory.length <= inventoryCapacity(c) && c.inventory.every((x) => x.qty > 0)),
      petitionsOk: s.petitions.list.every((p) => s.characters.some((c) => c.id === p.characterId)),
      wages: s.stats.wagesPaid ?? 0,
    };
    return {
      citizensAfter,
      integrityAfter,
      expeditionAfter,
      outfits: s.characters.filter((c) => c.outfit).length,
      outfitsOk: s.characters.every((c) => c.outfit === outfitFor(c) || (c.outfit?.split(':')[1] === outfitFor(c)?.split(':')[1])),
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
  if (data.version < 13) results.push({ name: `${tag}: usta işi eser vitrini boş başlar`, ok: r.loaded.masterworks.items === 0 && r.loaded.masterworks.made === 0 });
  else results.push({ name: `${tag}: usta işi eserler korundu`, ok: r.loaded.masterworks.items === data.masterworks.items.length && r.loaded.masterworks.made === data.masterworks.made && r.loaded.masterworks.exhibited === data.masterworks.items.filter((i) => i.status === 'exhibited').length, detail: `${r.loaded.masterworks.items} eser, ${r.loaded.masterworks.exhibited} sergide` });
  if (data.dilemma?.expedition && !data.dilemma.expedition.adventures) {
    results.push({ name: `${tag}: eski biçimde yarım kalan sefer maceralar açmadan sürer ve döner`, ok: !r.expeditionAfter.active && r.expeditionAfter.away === 0 && !r.expeditionAfter.adventure, detail: JSON.stringify(r.expeditionAfter) });
  }
  if (data.version < 14) {
    const e = r.loaded.exploration;
    results.push({ name: `${tag}: keşif ganimeti ve yazıt boş başlar`, ok: e.inscriptions === 0 && Object.values(e.items).every((v) => v === 0) && !e.cityMap && e.tales === 0 });
  } else {
    const e = r.loaded.exploration;
    const d = data.exploration;
    results.push({
      name: `${tag}: keşif ganimetleri, yazıtlar ve sefer sayısı korundu`,
      ok: e.inscriptions === Object.keys(d.inscriptions).length && e.expeditions === d.expeditions && e.cityMap === d.cityMap && Object.entries(d.items).every(([k, v]) => e.items[k] === v),
      detail: `${e.expeditions} sefer, ${e.inscriptions} yazıt, ganimet ${JSON.stringify(e.items)}`,
    });
  }
  if (data.version < 15) {
    const L = r.loaded.landscape;
    results.push({ name: `${tag}: peyzaj durumu boş başlar, estetik yüklenince hesaplanır`, ok: Object.keys(L.credit).length === 0 && L.painted === 0 && L.percent >= 0 && L.percent <= 5 && L.signs.length === 0, detail: `estetik ${L.score} (+%${L.percent})` });
  } else {
    const L = r.loaded.landscape;
    const signs = data.buildings.filter((b) => b.type === 'signpost').map((b) => b.label);
    const trees = data.buildings.filter((b) => ['birchTree', 'oakTree', 'pineTree'].includes(b.type)).map((b) => b.plantedAt);
    results.push({
      name: `${tag}: tabela adları, fidanların dikiliş anı, çitler ve estetik korundu`,
      ok: JSON.stringify(L.signs) === JSON.stringify(signs) && JSON.stringify(L.trees) === JSON.stringify(trees) && L.fencesLinked && L.field && L.painted === data.landscape.roadsPainted && Math.abs(L.score - data.landscape.score) < 3,
      detail: `${L.signs.join(', ')} · ${L.trees.length} ağaç · estetik ${L.score}/${data.landscape.score} (+%${L.percent})`,
    });
  }
  {
    // (19. aşama) karakter huyları, evli çiftlerin evleri, dedikodu
    const S = r.loaded.social;
    const valid = S.quirks.every((q) => ['animalLover', 'bookworm', 'musician', 'natureEnthusiast'].includes(q));
    const homes = Object.fromEntries(data.characters.map((c) => [c.id, c.homeId]));
    const homesKept = S.couples.every(([id, , home]) => homes[id] === undefined || homes[id] === home || homes[id] === null);
    if (data.version < 16) {
      results.push({
        name: `${tag}: huylar ilk açılışta dağıtıldı, dedikodu boş başlar, evli çiftlerin evleri korunur`,
        ok: valid && (S.quirks.length < 4 || S.kinds === 4) && S.gossip === 0 && S.news === 0 && !S.party && homesKept,
        detail: `${S.kinds} huy, ${S.couples.length / 2} evli çift`,
      });
    } else {
      const quirks = data.characters.map((c) => c.quirk);
      results.push({
        name: `${tag}: huylar, ortak evler, son duyulan haberler ve dedikodu korundu`,
        ok: valid && JSON.stringify(S.quirks) === JSON.stringify(quirks) && homesKept && S.gossip === data.social.gossip.length && S.news === data.characters.filter((c) => c.lastNews).length,
        detail: `${S.kinds} huy, ${S.couples.length / 2} evli çift, ${S.gossip} haber, ${S.news} sakin haber duymuş`,
      });
    }
  }
  {
    // (20. aşama) Ulu Saat Kulesi aşaması, Altın Çağ ve Tarihçe Kütüğü
    const G = r.loaded.golden;
    const towerData = data.buildings.find((b) => b.type === 'wonder');
    const married = data.characters.some((c) => c.married && c.marriedAt !== null && c.marriedAt !== undefined);
    if (data.version < 17) {
      results.push({
        name: `${tag}: Tarihçe sakinlerden çıkarıldı, kule aşaması korundu, Altın Çağ yalnızca tamamlanmış kuleyle (kutlamasız)`,
        ok: G.founders >= 1 && (!married || G.couple) && (!data.masterworks?.items?.length || G.masterwork) && G.stage === (towerData ? towerData.wonderStage ?? 0 : null) && Boolean(G.since) === G.complete && !G.celebration && G.gears === 0 && G.books === 0,
        detail: `kule ${G.stage ?? '-'} · Altın Çağ ${G.since ? `G${G.since.day}` : 'yok'} · kurucu ${G.founders} · ilk çift ${G.couple ? `${G.couple.a} & ${G.couple.b}` : '-'}`,
      });
    } else {
      results.push({
        name: `${tag}: Ulu Saat Kulesi, Altın Çağ, Tarihçe Kütüğü ve antik kitaplar korundu`,
        ok: G.stage === towerData?.wonderStage && JSON.stringify(G.since) === JSON.stringify(data.goldenAge.since) && G.chimes === data.goldenAge.chimes && G.books === data.goldenAge.books && G.founders === data.chronicle.founders.length && G.stages === Object.keys(data.chronicle.towerStages).length,
        detail: `kule ${G.stage} · Altın Çağ G${G.since?.day ?? '-'} · çan ${G.chimes} · kitap ${G.books} · kurucu ${G.founders}`,
      });
    }
  }
  {
    // (21. aşama) kişisel kese ve çanta, Yönetim Güveni, dilekçeler
    const C = r.loaded.citizens;
    const A = r.citizensAfter;
    if (data.version < 18) {
      results.push({
        name: `${tag}: sakinlere başlangıç harçlığı (yetişkin 12, çocuk 3), çantalar boş, Yönetim Güveni %75, dilekçe ve isyan yok`,
        ok: C.coins.every(([, coins, child]) => coins === (child ? 3 : 12)) && C.inv.every(([, inv]) => inv === '[]') && C.trust === 75 && !C.revolt && C.petitions.length === 0 && C.made === 0,
        detail: `${C.coins.length} sakin, güven %${C.trust}`,
      });
    } else {
      const coins = data.characters.map((c) => [c.id, c.coins]);
      results.push({
        name: `${tag}: keseler, çantalar, Yönetim Güveni ve dilekçeler korundu`,
        ok: JSON.stringify(C.coins.map(([id, v]) => [id, v])) === JSON.stringify(coins) && C.inv.every(([id, inv]) => inv === JSON.stringify(data.characters.find((c) => c.id === id).inventory)) && Math.abs(C.trust - data.trust.value) < 1e-9 && C.petitions.length === data.petitions.list.length && C.made === data.petitions.made,
        detail: `${C.coins.reduce((a, [, v]) => a + v, 0)} altın kesede · güven %${Math.round(C.trust)} · ${C.petitions.length} açık dilekçe, ${C.made} dilekçe`,
      });
    }
    results.push({ name: `${tag}: bir gün sonra keseler ve çantalar geçerli, isyan yok`, ok: A.bagsOk && A.petitionsOk && !A.revolt && A.trust >= 0 && A.trust <= 100, detail: `güven %${Math.round(A.trust)}, yevmiye ${A.wages}` });
  }
  results.push({ name: `${tag}: meslek kıyafetleri deneyimden giyildi`, ok: r.outfitsOk, detail: `${r.outfits} sakin kıyafetli` });
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
