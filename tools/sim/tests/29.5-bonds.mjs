// Aşama 29.5: Omuz Omuza — bağ puanı, sosyal iş seçimi, yan yana çalışma moodlet'leri. Çalıştır: node tools/sim/tests/29.5-bonds.mjs
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const B = await import('/src/systems/Bonds.js');
  const D = await import('/src/data/bonds.js');
  const MD = await import('/src/data/moodlets.js');
  const EV = await import('/src/data/evolution.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { addTag, removeTag } = await import('/src/systems/Chemistry.js');
  const { pairKey } = await import('/src/systems/RelationshipSystem.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 3);
  const scene = game.scenes.current;
  const s = game.state;
  const adults = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away);
  const [a, b, c3, d4] = adults();
  const reset = (...cs) => {
    for (const x of cs) { x.relationships = {}; x.partnerId = null; x.drive.avoidIds = []; }
    for (const x of cs) for (const y of cs) if (x !== y) delete s.relationships[pairKey(x.id, y.id)];
  };
  const chem = (x, y, v) => { x.relationships ??= {}; x.relationships[y.id] ??= { chemistry: v, craft: false, tags: [], until: {} }; x.relationships[y.id].chemistry = v; };
  const W = () => B.bondWeight(s, a, b);

  // 1. bondWeight tablosu
  const rows = [];
  const clampRows = [];
  const row = (name, ok) => rows.push([name, Boolean(ok)]);
  reset(a, b); chem(a, b, 0);
  row('boş ilişki: 0', W() === 0);
  a.partnerId = b.id; b.partnerId = a.id;
  row('eş +3', W() === 3);
  reset(a, b); chem(a, b, 0); addTag(a, b.id, 'kindred', s.totalMinutes);
  row('kindred +3', W() === 3);
  reset(a, b); chem(a, b, 0); s.relationships[pairKey(a.id, b.id)] = 75;
  row('puan ≥ 70: +2, 40–69: +1', W() === 2 && ((s.relationships[pairKey(a.id, b.id)] = 50), W() === 1));
  reset(a, b); chem(a, b, 2);
  row('kimya ≥ 2: +1; kimya < 0: -1', W() === 1 && (chem(a, b, -1), W() === -1));
  reset(a, b); chem(a, b, 0); addTag(a, b.id, 'grateful', s.totalMinutes);
  row('grateful +1', W() === 1);
  reset(a, b); chem(a, b, 0); addTag(a, b.id, 'resentful', s.totalMinutes);
  row('resentful -3', W() === -3);
  reset(a, b); chem(a, b, 0); s.relationships[pairKey(a.id, b.id)] = -20;
  row('rakip (< -10): -3', W() === -3);
  reset(a, b); chem(a, b, 0); a.drive.avoidIds = [b.id];
  row('kaçınılan kişi -2', W() === -2);
  check('bondWeight tablo satırları (eş, kindred, puan, kimya, grateful, resentful, rakip, kaçınılan)', rows.every((r) => r[1]), JSON.stringify(rows.filter((r) => !r[1])));
  reset(a, b); a.partnerId = b.id; b.partnerId = a.id; chem(a, b, 3); addTag(a, b.id, 'kindred', s.totalMinutes); s.relationships[pairKey(a.id, b.id)] = 90;
  clampRows.push(['+4', W() === 4]);
  reset(a, b); chem(a, b, -2); addTag(a, b.id, 'resentful', s.totalMinutes); s.relationships[pairKey(a.id, b.id)] = -30; a.drive.avoidIds = [b.id];
  clampRows.push(['-4', W() === -4]);
  reset(a, b, c3, d4);
  for (const o of [b, c3, d4]) { a.partnerId = null; chem(a, o, 0); addTag(a, o.id, 'kindred', s.totalMinutes); }
  clampRows.push(['crew', B.crewBond(s, a, [a.id, b.id, c3.id, d4.id]) === 6 && B.crewBond(s, a, null) === 0]);
  check('toplam -4..+4 ve crewBond -6..+6 kırpılır, kendini saymaz', clampRows.every((r) => r[1]), JSON.stringify(clampRows));

  // 2-3. findWorkFor
  const jobs = scene.jobs;
  let b1 = null;
  for (const t of ['quarry', 'ironMine', 'garden', 'mill', 'workshop', 'lumberHut']) { const x = sim.place(t); if (x && x.workerSlots >= 2) { b1 = x; break; } }
  let b2 = null;
  for (const t of ['lumberHut', 'garden', 'fishingPier', 'workshop', 'sheepFarm']) { const x = sim.place(t); if (x && x !== b1 && x.workerSlots >= 1) { b2 = x; break; } }
  const ok = Boolean(b1 && b2 && b1 !== b2);
  for (const x of [b1, b2]) if (x) Object.defineProperty(x, 'workerSlots', { value: 3, configurable: true }); // her ikisi 3 yuvalı (test düzeneği)
  check('iki üretim yapısı kuruldu', ok, `${b1?.type}/${b2?.type}`);
  if (ok) {
    jobs.jobs.splice(0);
    for (const b of scene.world.getCompleted()) { b.workerIds.clear(); b.frozen = false; b.idle = false; b.excludedWorkers.clear(); }
    const others = scene.world.getCompleted().filter((b) => b !== b1 && b !== b2 && b.workerSlots);
    for (const o of others) o.idle = true; // yalnızca b1 ve b2 aday
    const free = adults().filter((x) => x.workplaceId == null);
    const me = free.find((x) => x !== b && x !== c3) ?? free[0];
    const mate = free.find((x) => x !== me) ?? a;
    const foe = free.find((x) => x !== me && x !== mate) ?? c3;
    me.task = null; me.skills = {}; me.profile.skillPreference = {};
    // c, b1'e daha yakın; eşi / düşmanı yakın-uzak yapıda
    const mid = { x: Math.round((b1.tileX + b2.tileX) / 2), y: Math.round((b1.tileY + b2.tileY) / 2) };
    const choose = () => jobs.findWorkFor(me, mid);
    reset(me, mate, foe);
    const base = choose();
    const X = base?.building;
    const Y = X === b1 ? b2 : b1;
    const nd = (bb) => Math.min(...scene.world.getSpots(bb).map((sp) => Math.hypot(sp.x - mid.x, sp.y - mid.y)));
    check('taban: orta noktadan bir yapı seçilir', Boolean(X), `X=${X?.type} d1=${nd(b1).toFixed(1)} d2=${nd(b2).toFixed(1)} adaylar=${free.length}`);
    me.partnerId = mate.id; mate.partnerId = me.id;
    // mesafe farkı ≥ 1 puan x tilesPerPoint'i aşabilsin: ikinci bir ruh ikizi de aynı yapıda
    const pal = free.find((x) => x !== me && x !== mate && x !== foe) ?? c3;
    chem(me, pal, 0); addTag(me, pal.id, 'kindred', s.totalMinutes);
    Y.workerIds.add(mate.id); Y.workerIds.add(pal.id);
    check('eşinin çalıştığı yapı, eşit öncelikli yakın yapıya tercih edilir', choose()?.building === Y);
    mate.partnerId = null; me.partnerId = null; Y.workerIds.clear();
    chem(me, foe, 0); addTag(me, foe.id, 'resentful', s.totalMinutes);
    removeTag(me, pal.id, 'kindred'); addTag(me, pal.id, 'resentful', s.totalMinutes);
    X.workerIds.add(foe.id); X.workerIds.add(pal.id);
    check('kırgın olduğu kişinin yapısı yerine öteki seçilir', choose()?.building === Y);
    for (const bb of [Y, ...others]) bb.idle = true;
    check('tek aday kaçınılan kişinin yapısıysa yine oraya gider', choose()?.building === X);
    X.workerIds.clear();
    for (const bb of [Y, ...others]) bb.idle = false;
    // öncelik: acil iş her bağdan önce
    b1.workerIds.add(foe.id);
    const tree = jobs.designate(...(() => { const m = scene.world.map; for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (m.getObject(x, y) === 'oak' && scene.world.getApproachSpots(x, y).length) return [x, y]; return [0, 0]; })());
    if (tree) { tree.urgent = true; check('acil iş, bağ puanı ne olursa olsun önce seçilir', choose()?.job === tree); jobs.cancel(tree); }
    else check('acil iş testi (ağaç yok, atlandı)', true);
    // sabitlenmiş işçi
    b1.workerIds.clear();
    jobs.jobs.splice(0);
    me.workplaceId = b2.id;
    const pinned = choose();
    check('sabitlenmiş işçi bağdan etkilenmez', !pinned || pinned.building === b2);
    me.workplaceId = null;
    // şalter kapalı: sonuç ilişkisiz dünyayla aynı
    reset(me, mate, foe); b1.workerIds.clear(); b2.workerIds.clear();
    const clean = choose();
    ENGINES.bonds = false;
    me.partnerId = mate.id; mate.partnerId = me.id; b2.workerIds.add(mate.id);
    const off = choose();
    check('ENGINES.bonds=false: findWorkFor bağsız sonuçla aynı aday', off?.building === clean?.building && off?.spot?.x === clean?.spot?.x);
    ENGINES.bonds = true;
    reset(me, mate, foe); b2.workerIds.clear();
  }

  // 4. moodlet'ler (BondSystem.onHour doğrudan, deterministik kurulum)
  const sys = scene.bonds;
  const bld = scene.world.getCompleted().find((x) => x.workerSlots >= 2) ?? scene.world.getCompleted().find((x) => x.workerSlots);
  const duo = adults().slice(0, 2);
  const setup = (x, y) => { reset(x, y); for (const z of [x, y]) { z.task = { activity: 'farm', phase: 'perform', workBuildingId: bld.id }; z.moodlets = []; z.mood.grief = false; z.away = false; } };
  const has = (z, k) => z.moodlets.find((m) => m.key === k);
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id; chem(duo[0], duo[1], 0);
  sys.onHour(10);
  const sbs = has(duo[0], 'side_by_side');
  check('eş çalışırken Omuz Omuza (major) verilir', sbs?.tier === 'major' && sbs.whoId === duo[1].id, JSON.stringify(sbs));
  check('Omuz Omuza etkisi c.mood\'a yansır (workMul > 1)', duo[0].mood.workMul > 1.0, String(duo[0].mood.workMul));
  setup(...duo); s.relationships[pairKey(duo[0].id, duo[1].id)] = 75; chem(duo[0], duo[1], 0);
  sys.onHour(10);
  check('puan 2: minor kademe', has(duo[0], 'side_by_side')?.tier === 'minor');
  setup(...duo); chem(duo[0], duo[1], 0); addTag(duo[0], duo[1].id, 'resentful', s.totalMinutes);
  sys.onHour(10);
  check('kırgın: Diken Üstünde verilir, etki yansır', has(duo[0], 'rubbing_wrong') && duo[0].mood.workMul < 1.0 && !has(duo[0], 'side_by_side'));
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id; sys.moodlets.apply(duo[0], 'mourning', { reason: 'mourn_spouse', whoName: 'X' });
  sys.onHour(10);
  check('yasta olana Omuz Omuza verilmez', !has(duo[0], 'side_by_side') && Boolean(has(duo[1], 'side_by_side')));
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id;
  sys.onHour(21);
  duo[1].task.phase = 'walk'; duo[0].task.phase = 'walk'; sys.onHour(10);
  check('mesai dışında ve perform dışında verilmez', !has(duo[0], 'side_by_side') && !has(duo[1], 'side_by_side'));
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id; ENGINES.bonds = false; sys.onHour(10); ENGINES.bonds = true;
  check('şalter kapalıyken moodlet verilmez', !has(duo[0], 'side_by_side'));
  check('moodlet sayısı 32, sözler ve nedenler tamam', MD.MOODLET_KEYS.length === 32 && MD.MOOD_LINES.side_by_side.length === 2 && MD.MOOD_LINES.rubbing_wrong.length === 2 && MD.MOOD_REASONS.side_by_side.includes('{who}') && MD.MOODLETS.side_by_side.icon === 'handshake' && MD.MOODLETS.rubbing_wrong.icon === 'angry');

  // 5. evrim
  check('evrim kancası: company +1 / -1', EV.EVOLUTION_SOURCES.moodlets.side_by_side[0][1] === 1 && EV.EVOLUTION_SOURCES.moodlets.rubbing_wrong[0][1] === -1 && EV.EVOLUTION_SOURCES.moodlets.side_by_side[0][0] === 1);

  // 6. sızıntı: bir saatlik tarama + iş seçimi boyunca bütün üreteçlerin durumu aynı (moodlet sözü izole seed+38 üretecini kullanabilir)
  const rngs = Object.entries(scene).filter(([k, v]) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number' && v !== scene.moodlets).map(([, v]) => v.rng);
  const before = JSON.stringify(rngs.map((r) => r.state));
  let calls = 0; const realRandom = Math.random; Math.random = () => { calls++; return realRandom(); };
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id;
  sys.onHour(11); jobs.findWorkFor(duo[0], { x: duo[0].tileX, y: duo[0].tileY });
  Math.random = realRandom;
  check('bağ taraması + iş seçimi: üreteçler ve Math.random aynı', rngs.length > 5 && before === JSON.stringify(rngs.map((r) => r.state)) && calls === 0, `${rngs.length} üreteç, ${calls} Math.random`);

  // 8. kaydet-yükle
  setup(...duo); duo[0].partnerId = duo[1].id; duo[1].partnerId = duo[0].id; sys.onHour(10);
  const id0 = duo[0].id; const pre = JSON.stringify(duo[0].moodlets.map((m) => m.key));
  game.events.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  game.events.emit('ui:load');
  const back = game.state.characters.find((x) => x.id === id0);
  check('kaydet-yükle: yeni moodlet geri gelir, kayıt sürümü 40', raw.version === 40 && back?.moodlets.some((m) => m.key === 'side_by_side'), `önce ${pre}, sonra ${JSON.stringify(back?.moodlets?.map((m) => m.key))}`);
  return out;
});
results.push(...out);
const okAll = report(errors);
await browser.close();
process.exit(okAll ? 0 : 1);
