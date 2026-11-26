// Aşama 34.3 testi: alan açma. Kesilen ağaç ve kırılan kaya karoyu boşaltır (kayanın verimi 7 + 2 = 9 taş), eski kayıttaki kütükler temizlenir,
// orman kasabadan uzakta yenilenir, ağaç ve kaya olan yere şantiye kurulur / temizlenir / inşaat biter / iptalde işler düşer,
// yol üstüne onaylı inşa ve iade, bağlantıyı kesen söküm reddedilir.
// Kullanım: node tools/sim/tests/34.3-clearing.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 34.3
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();

const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const TD = await import('/src/data/tiles.js');
  const FD = await import('/src/data/forest.js');
  const F = await import('/src/systems/Forest.js');
  const CL = await import('/src/systems/Clearing.js');
  const { BUILDINGS } = await import('/src/data/buildings.js');
  const sc = () => game.scenes.current;
  const st = game.state;
  const bounds = () => sc().map.openBounds;
  const cells = function* () {
    const o = bounds();
    for (let y = o.y0; y < o.y1; y++) for (let x = o.x0; x < o.x1; x++) yield { x, y };
  };
  const findTile = (pred) => {
    for (const c of cells()) if (pred(c, sc().map)) return c;
    return null;
  };
  sim.give({ wood: 400, stone: 400, food: 200, gold: 500 });

  // 1. Veri: kalıntı yok, kaya 9 taş
  const O = TD.OBJECT_TYPES;
  check('veri: ağaç ve kaya kalıntı bırakmaz', O.oak.harvest.leaves === null && O.pine.harvest.leaves === null && O.rock.harvest.leaves === null);
  check('veri: kaya 7 + 2 = 9 taş, çakıl 2 taş, ağaç 8 / 7 odun', TD.ROCK_STONE === 7 && TD.PEBBLE_STONE === 2 && O.rock.harvest.yields.stone === 9 && O.pebbles.harvest.yields.stone === 2 && O.oak.harvest.yields.wood === 8 && O.pine.harvest.yields.wood === 7);

  // 2. Kesilen ağaç ve kırılan kaya karoyu boşaltır; doğal çakıllar kalır
  const map0 = sc().map;
  const pebblesBefore = [...cells()].filter((c) => map0.getObject(c.x, c.y) === 'pebbles').length;
  const harvestOne = (kind) => {
    const c = findTile((p, m) => m.getObject(p.x, p.y) === kind && sc().jobs.isHarvestable(p.x, p.y));
    if (!c) return null;
    const job = sc().jobs.designate(c.x, c.y);
    sc().jobs.applyWork(job, job.work);
    const done = sc().jobs.complete(job);
    return { ...c, yields: done.yields, after: sc().map.getObject(c.x, c.y) };
  };
  const oak = harvestOne('oak');
  const pine = harvestOne('pine');
  const rock = harvestOne('rock');
  check('meşe kesilince karo boşalır, 8 odun', oak && oak.after === null && oak.yields.wood === 8, JSON.stringify(oak));
  check('çam kesilince karo boşalır, 7 odun', pine && pine.after === null && pine.yields.wood === 7, JSON.stringify(pine));
  check('kaya kırılınca çakıl kalmaz, 9 taş', rock && rock.after === null && rock.yields.stone === 9, JSON.stringify(rock));
  check('haritada kendiliğinden bulunan çakıllar olduğu gibi', [...cells()].filter((c) => map0.getObject(c.x, c.y) === 'pebbles').length === pebblesBefore && pebblesBefore > 0, `${pebblesBefore}`);
  check('kütük yok, yeniden büyüme kaydı eklenmedi', ![...cells()].some((c) => map0.getObject(c.x, c.y) === 'stump') && st.regrowth.length === 0, `${st.regrowth.length}`);
  const pebble = findTile((p, m) => m.getObject(p.x, p.y) === 'pebbles');
  const pj = sc().jobs.designate(pebble.x, pebble.y);
  sc().jobs.applyWork(pj, pj.work);
  check('çakıl hâlâ 2 taş verir ve kendi başına kalıntı bırakmaz', sc().jobs.complete(pj).yields.stone === 2 && sc().map.getObject(pebble.x, pebble.y) === null);

  // 3. Eski kayıt: kütükler kalkar, kütük aşamasındaki kayıtlar düşer, fidan aşaması sürer
  const stumpTiles = [];
  for (const c of cells()) {
    if (stumpTiles.length >= 3) break;
    if (map0.getObject(c.x, c.y) === null && ['grass', 'forest'].includes(map0.get(c.x, c.y)) && map0.getOccupant(c.x, c.y) === 0) stumpTiles.push(c);
  }
  const sap = findTile((p, m) => m.getObject(p.x, p.y) === null && ['grass', 'forest'].includes(m.get(p.x, p.y)) && m.getOccupant(p.x, p.y) === 0 && !stumpTiles.some((s) => s.x === p.x && s.y === p.y));
  for (const t of stumpTiles) map0.setObject(t.x, t.y, 'stump');
  map0.setObject(sap.x, sap.y, 'sapling');
  st.regrowth = [
    { x: stumpTiles[0].x, y: stumpTiles[0].y, tree: 'oak', stage: 'stump', hours: 3 },
    { x: stumpTiles[1].x, y: stumpTiles[1].y, tree: 'pine', stage: 'stump', hours: 20 },
    { x: sap.x, y: sap.y, tree: 'oak', stage: 'sapling', hours: 10 },
  ];
  const snap = sc().saves.snapshot();
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...snap, version: 42 }));
  game.events.emit('ui:load');
  const m2 = sc().map;
  check('eski kayıt: açık alandaki kütükler kalktı', stumpTiles.every((t) => m2.getObject(t.x, t.y) === null), stumpTiles.map((t) => m2.getObject(t.x, t.y)).join());
  check('eski kayıt: kütük aşamasındaki kayıtlar düştü, fidan aşaması sürüyor', st.regrowth.length === 1 && st.regrowth[0].stage === 'sapling' && m2.getObject(sap.x, sap.y) === 'sapling', JSON.stringify(st.regrowth));
  const snap2 = sc().saves.snapshot();
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...snap2, version: 42 }));
  game.events.emit('ui:load');
  check('ikinci yükleme: aynı sonuç (bir kerelik temizlik zararsız)', game.state.regrowth.length === 1 && sc().map.getObject(sap.x, sap.y) === 'sapling');
  // Fidan hâlâ büyüyor: 36 saate yetişince ağaç olur
  game.state.regrowth[0].hours = 35.99;
  sim.step(300);
  check('kayıttaki fidan ağaca dönüyor', ['oak', 'pine'].includes(sc().map.getObject(sap.x, sap.y)) && game.state.regrowth.length === 0, `${sc().map.getObject(sap.x, sap.y)}`);

  // 4. Orman kendiliğinden yenilenir: kasabadan uzakta, var olan ağaçların yanına
  check('veri: oran eşikleri ve hızlar', saplingsFor(0.5) === FD.FOREST.fastPerDay && saplingsFor(0.85) === FD.FOREST.slowPerDay && saplingsFor(1) === 0 && saplingsFor(1.4) === 0 && FD.FOREST.minDistance === 4, `${FD.FOREST.fastPerDay}/${FD.FOREST.slowPerDay}`);
  function saplingsFor(r) { return F.saplingsForToday(r); }
  const forest = () => sc().forest;
  check('başlangıçta ağaç oranı yaklaşık 1', forest().ratio() > 0.95 && forest().ratio() <= 1.01, forest().ratio().toFixed(3));
  forest().sprout(30);
  forest().newDay();
  check('oran 1\'in üstündeyken gün dönümünde fidan çıkmaz', forest().ratio() > 1 && forest().lastSprouted === 0, forest().ratio().toFixed(3));
  // Ağaçların %40'ını kaldır: oran < 0.7 -> günde fastPerDay fidan
  let n = 0;
  for (const c of cells()) if (['oak', 'pine'].includes(sc().map.getObject(c.x, c.y)) && n++ % 5 < 2) sc().map.setObject(c.x, c.y, null);
  const ratioLow = forest().ratio();
  check('ağaçların bir kısmı kalkınca oran 0,7\'nin altına iner', ratioLow < FD.FOREST.fastBelow, ratioLow.toFixed(2));
  const regrowBefore = st.regrowth.length;
  const treesBefore = F.countTrees(sc().map);
  forest().newDay();
  const planted = st.regrowth.slice(regrowBefore);
  check('gün dönümünde hızlı fidan (günde 4)', forest().lastSprouted === FD.FOREST.fastPerDay && planted.length === FD.FOREST.fastPerDay && planted.every((e) => e.stage === 'sapling' && sc().map.getObject(e.x, e.y) === 'sapling'), `${planted.length}`);
  const buildingsNow = st.buildings.map((b) => ({ b, w: BUILDINGS[b.type].size.w, h: BUILDINGS[b.type].size.h }));
  const roadOrBuildingNear = (x, y, d) => {
    const m = sc().map;
    for (let dy = -(d - 1); dy <= d - 1; dy++) for (let dx = -(d - 1); dx <= d - 1; dx++) if (m.get(x + dx, y + dy) && ['path', 'cobble', 'plaza', 'bridge'].includes(m.get(x + dx, y + dy))) return true;
    return buildingsNow.some(({ b, w, h }) => Math.max(b.tileX - x, 0, x - (b.tileX + w - 1)) < d && Math.max(b.tileY - y, 0, y - (b.tileY + h - 1)) < d);
  };
  check('fidanlar her yapıdan, yoldan ve meydandan en az 4 karo uzakta', planted.every((e) => !roadOrBuildingNear(e.x, e.y, FD.FOREST.minDistance)), JSON.stringify(planted.map((e) => [e.x, e.y])));
  const nearTree = (x, y) => [-2, -1, 0, 1, 2].some((dy) => [-2, -1, 0, 1, 2].some((dx) => ['oak', 'pine'].includes(sc().map.getObject(x + dx, y + dy))));
  check('fidanlar var olan ağaçların yanında (en çok 2 karo)', planted.every((e) => nearTree(e.x, e.y)));
  // Çok sayıda gün: yapı ve yol yakınına hiç fidan çıkmaz
  let allFar = true;
  const log = [];
  for (let d = 0; d < 10; d++) {
    const before = st.regrowth.length;
    forest().sprout(8);
    for (const e of st.regrowth.slice(before)) if (roadOrBuildingNear(e.x, e.y, FD.FOREST.minDistance)) allFar = false;
    log.push(st.regrowth.length - before);
  }
  check('10 gün x 8 fidan: hiçbiri kasabaya 4 karodan yakın değil', allFar, log.join());
  // Toplama işareti konmuş karoya fidan çıkmaz
  const spots = (() => {
    const m = sc().map;
    const mask = F.townMask(m, sc().world.buildings, (b) => BUILDINGS[b.type].size);
    return F.sproutSpots(m, mask, new Set());
  })();
  if (spots.length > 0) {
    const mark = spots[0];
    st.jobs.push({ id: 9999, type: 'chop', x: mark.x, y: mark.y, object: 'oak', work: 45, progress: 0, assignees: [] });
    const m = sc().map;
    const mask = F.townMask(m, sc().world.buildings, (b) => BUILDINGS[b.type].size);
    const marked = new Set(st.jobs.filter((j) => !j.buildingId).map((j) => `${j.x},${j.y}`));
    check('toplama işareti konmuş karo aday olmaz', !F.sproutSpots(m, mask, marked).some((s) => s.x === mark.x && s.y === mark.y));
    st.jobs.pop();
  } else check('fidan adayı bulundu', false);
  // Fidan mevcut süreyle ağaca döner; peyzaj fidanı (yapı) etkilenmez
  const first = planted[0];
  st.regrowth.find((e) => e.x === first.x && e.y === first.y).hours = TD.TREE_REGROWTH.saplingHours;
  sim.step(2);
  check('fidan 36 saatte ağaca döner', ['oak', 'pine'].includes(sc().map.getObject(first.x, first.y)), `${sc().map.getObject(first.x, first.y)}`);
  const treeBuildings = st.buildings.filter((b) => ['oakTree', 'pineTree', 'birchTree', 'cherryTree'].includes(b.type)).length;
  forest().sprout(20);
  check('peyzaj fidanı ve süsleri değişmez', st.buildings.filter((b) => ['oakTree', 'pineTree', 'birchTree', 'cherryTree'].includes(b.type)).length === treeBuildings && F.countTrees(sc().map) >= treesBefore);

  // 5. Ağaç ve kaya olan yere şantiye
  const sitePlan = (type, pred) => {
    for (const c of cells()) {
      const r = sc().construction.checkPlacement(type, c.x, c.y);
      if (r.ok && pred(r)) return { ...c, r };
    }
    return null;
  };
  const plan = sitePlan('cabin', (r) => r.clears.trees >= 2 && !r.clears.rocks);
  check('ağaçlı yer kurulabilir; önizleme notu "Önce N ağaç temizlenecek (+X odun)"', plan && /^Önce \d+ ağaç temizlenecek \(\+\d+ odun\)$/.test(plan.r.note) && plan.r.clears.wood > 0, plan?.r.note);
  const planRock = sitePlan('cabin', (r) => r.clears.rocks >= 1);
  check('kayalı yer: not "kaya" ve taş kazancını yazar', planRock && /kaya/.test(planRock.r.note) && /\+\d+ taş/.test(planRock.r.note) && planRock.r.clears.stone % 9 === 0, planRock?.r.note);
  const fmt = CL.clearingNote({ tiles: [1, 2, 3, 4], trees: 3, rocks: 1, wood: 24, stone: 9 });
  check('örnek yazı: "Önce 3 ağaç ve 1 kaya temizlenecek (+24 odun, +9 taş)"', fmt === 'Önce 3 ağaç ve 1 kaya temizlenecek (+24 odun, +9 taş)', fmt);
  const wood0 = st.resources.wood;
  st.resources.wood = 100;
  const placed = sc().construction.placeSite('cabin', plan.x, plan.y);
  const siteJobs = st.jobs.filter((j) => j.siteId === placed.building?.id);
  check('yerleştirince şantiye kurulur, her ağaç için öncelikli toplama işi açılır', placed.ok && siteJobs.length === plan.r.clears.trees && siteJobs.every((j) => j.urgent && j.type === 'chop'), `${siteJobs.length}/${plan.r.clears.trees}`);
  check('alan açılırken inşaat işi beklemede (şantiye geçilebilir, ağaçlar duruyor)', sc().world.isClearing(placed.building) && placed.building.underConstruction);
  // Tek bir kişi de olsa iş ilerler: günleri sür
  let days = 0;
  while (days < 12 && !(placed.building && !placed.building.underConstruction)) {
    sim.step(225 * 6);
    days += 0.25;
    if (!sc().world.getBuilding(placed.building.id)) break;
  }
  const b1 = sc().world.getBuilding(placed.building.id);
  check('ağaçlar toplandı, karolar boşaldı, yapı karoları kapandı', b1 && plan.r.footprint.every((t) => sc().map.getObject(t.x, t.y) === null) && !sc().world.isClearing(b1), `${days} gün`);
  check('alan temizlenince inşaat başlayıp bitti', b1 && !b1.underConstruction, `${days} gün`);
  check('toplanan odun depoya girdi (kabaca)', st.resources.wood > 100 - BUILDINGS.cabin.cost.wood, `${st.resources.wood}`);

  // 6. İptal: açılmış işler düşer
  const plan2 = sitePlan('cabin', (r) => r.clears.trees >= 1);
  const site2 = sc().construction.placeSite('cabin', plan2.x, plan2.y);
  const n2 = st.jobs.filter((j) => j.siteId === site2.building.id).length;
  const trees2 = plan2.r.clears.tiles.map((t) => sc().map.getObject(t.x, t.y));
  sc().construction.demolish(site2.building);
  check('şantiye iptalinde toplama işleri de iptal', n2 > 0 && !st.jobs.some((j) => j.siteId === site2.building.id || j.buildingId === site2.building.id), `${n2} iş`);
  check('iptal edilen alandaki ağaçlar yerinde', plan2.r.clears.tiles.every((t, i) => sc().map.getObject(t.x, t.y) === trees2[i]) && !sc().map.getOccupant(plan2.x, plan2.y));

  // 7. Su, başka yapı hâlâ engel
  const water = findTile((p, m) => m.get(p.x, p.y) === 'water');
  check('su yine engel', water && !sc().construction.checkPlacement('cabin', water.x, water.y, { roads: true }).ok);
  const other = st.buildings[0];
  check('başka yapı yine engel', !sc().construction.checkPlacement('cabin', other.tileX, other.tileY, { roads: true }).ok);

  // 8. Şantiye alan açarken kaydet -> yükle
  const plan3 = sitePlan('cabin', (r) => r.clears.trees >= 1);
  const site3 = sc().construction.placeSite('cabin', plan3.x, plan3.y);
  const sj = st.jobs.filter((j) => j.siteId === site3.building.id).length;
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...sc().saves.snapshot(), version: 42 }));
  game.events.emit('ui:load');
  const b3 = game.state.buildings.find((b) => b.tileX === plan3.x && b.tileY === plan3.y && b.underConstruction);
  check('kayıt-yükleme: şantiye ve alan açma işleri korunur', b3 && game.state.jobs.filter((j) => j.siteId === b3.id).length === sj && sc().world.isClearing(b3), `${sj}`);
  for (let i = 0; i < 12 && sc().world.isClearing(sc().world.getBuilding(b3.id)); i++) sim.step(225 * 3);
  check('yüklemeden sonra alan açılır', b3 && !sc().world.isClearing(sc().world.getBuilding(b3.id)), `${st.jobs.length} iş`);

  // 9. Yol üstüne inşa
  const grassFree = (p, m) => m.get(p.x, p.y) === 'grass' && !m.getObject(p.x, p.y) && !m.getOccupant(p.x, p.y);
  let roadPlan = null;
  for (const c of cells()) {
    const m = sc().map;
    if (![0, 1].every((dy) => [0, 1].every((dx) => grassFree({ x: c.x + dx, y: c.y + dy }, m)))) continue;
    if (sc().construction.checkPlacement('cabin', c.x, c.y).ok) { roadPlan = c; break; }
  }
  st.resources.stone = 60;
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) sc().construction.paintTile('plazaTile', roadPlan.x + dx, roadPlan.y + dy);
  const noRoad = sc().construction.checkPlacement('cabin', roadPlan.x, roadPlan.y);
  const withRoad = sc().construction.checkPlacement('cabin', roadPlan.x, roadPlan.y, { roads: true });
  check('yol üstü: eski çağrı reddeder, yerleşim aracı kabul eder (4 yol karosu)', !noRoad.ok && withRoad.ok && withRoad.roads.length === 4 && /4 yol karosu sökülecek/.test(withRoad.note), `${noRoad.reason} | ${withRoad.note}`);
  const tools = sc().tools;
  const stone0 = st.resources.stone;
  const sitesBefore = st.buildings.length;
  tools.setTool('build', 'cabin');
  tools.hovered = { tileX: roadPlan.x, tileY: roadPlan.y };
  tools.updatePreview();
  check('önizleme: "4 yol karosu sökülecek", yol karoları işaretli', tools.preview.ok && /4 yol karosu sökülecek/.test(tools.preview.text) && tools.preview.roads.length === 4, tools.preview.text);
  const anchor = sc().construction.anchorFor('cabin', roadPlan.x, roadPlan.y);
  tools.beginStroke({ tileX: roadPlan.x, tileY: roadPlan.y });
  tools.finishStroke?.();
  check('ilk tıklama yalnızca işaretler (yapı kurulmaz, yol yerinde)', st.buildings.length === sitesBefore && sc().map.get(anchor.x, anchor.y) === 'plaza' && tools.roadArm, `${st.buildings.length}`);
  tools.updatePreview();
  check('işaretliyken önizleme "onaylamak için yeniden tıkla" der', /yeniden tıkla/.test(tools.preview.text) && tools.preview.armed, tools.preview.text);
  tools.beginStroke({ tileX: roadPlan.x, tileY: roadPlan.y });
  tools.finishStroke?.();
  const siteRoad = st.buildings.find((b) => b.tileX === anchor.x && b.tileY === anchor.y && b.type === 'cabin' && b.underConstruction);
  check('ikinci tıklama onaylar: şantiye kurulur, yol karoları söküldü', Boolean(siteRoad) && ![0, 1].some((dy) => [0, 1].some((dx) => sc().map.get(anchor.x + dx, anchor.y + dy) === 'plaza')), `${sc().map.get(anchor.x, anchor.y)}`);
  const cabinStone = BUILDINGS.cabin.cost.stone ?? 0;
  check('sökülen yol için yıkımdaki iade (yarısı: 4 plaka x 1 taş)', st.resources.stone - stone0 === 4 - cabinStone, `${st.resources.stone - stone0} (kulübe taşı ${cabinStone})`);
  tools.setTool('select');

  // 10. Meydan ve köprü sökülmez; bağlantıyı kesen söküm reddedilir
  const { plaza } = sc().world.landmarks;
  const plazaCheck = sc().construction.checkPlacement('cabin', plaza.x + 1, plaza.y + 1, { roads: true });
  check('meydan sökülmez', !plazaCheck.ok && !plazaCheck.roads.length, plazaCheck.reason);
  const bridge = findTile((p, m) => m.get(p.x, p.y) === 'bridge');
  check('köprü sökülmez', !bridge || !sc().construction.checkPlacement('cabin', bridge.x, bridge.y, { roads: true }).ok, bridge ? 'köprü var' : 'bu haritada köprü yok');
  let cut = null;
  for (const c of cells()) {
    const r = sc().construction.checkPlacement('cabin', c.x, c.y, { roads: true });
    if (!r.ok && /^Bu yol sökülürse .+ yolu kesilir$/.test(r.reason)) { cut = r; break; }
  }
  check('bağlantıyı kesen söküm reddedilir: "Bu yol sökülürse ... yolu kesilir"', cut, cut?.reason);

  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
