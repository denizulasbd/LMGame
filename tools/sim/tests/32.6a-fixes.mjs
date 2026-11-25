// Aşama 32.6a testleri: düzeltmeler ve denge. A1 placementPlan saf (hata fırlasa da durum değişmez), A2 src/ altında izinsiz
// döngüsel içe aktarma yok, A3 kulüp zilinin listesi ACTIVITIES'ten türer, A4 tek seferlik kartlar günlük kategori sınırından muaf,
// A5 uzaklaştırılan sakin davet / randevu / sohbet planıyla da hana gidemez (ortak nokta Brain.planGathering), A6 uzak kulüp evi:
// zil yürüme payı kadar erken (en çok 45 dk), panel uyarısı; B2 düşen buluşmanın ertesi akşam telafisi. Kullanım: node tools/sim/tests/32.6a-fixes.mjs [--verbose]
//   ya da   node tools/sim/gate.mjs --quick --only 32.6a
import { openGame, createChecks } from '../lib.mjs';
import { scanImports, findCycles, ALLOW } from '../cycles.mjs';

const { results, report } = createChecks();

// ---- A2. döngüsel içe aktarma (node tarafında, dosyalardan)
{
  const cycles = findCycles(scanImports());
  const bad = cycles.filter((c) => !ALLOW.has(c.key));
  const clubsLoop = cycles.some((c) => c.members.includes('systems/Clubs.js') || c.members.includes('systems/Renown.js'));
  results.push({ name: 'A2: src/ altında izinsiz döngüsel içe aktarma yok; Clubs / Renown hiçbir döngüde değil', ok: bad.length === 0 && !clubsLoop, detail: bad.map((c) => c.example.join(' → ')).join(' ; ') });
}

const { browser, page, errors } = await openGame({ seed: 5 });
const out = await page.evaluate(async () => {
  const out = [];
  const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const C = await import('/src/systems/Clubs.js');
  const CD = await import('/src/data/clubs.js');
  const SC = await import('/src/systems/StoryCards.js');
  const J = await import('/src/systems/Justice.js');
  const { ACTIVITIES } = await import('/src/data/activities.js');
  const st = game.state;
  const sc = game.scenes.current;
  sim.give({ wood: 999, stone: 999, food: 900, gold: 3000, iron: 300, cloth: 200, wool: 200 });
  for (let i = 0; i < 5; i++) sim.place('cabin');
  sc.population.welcomeNewcomers(10);
  st.town.tier = 3;
  const pool = st.characters.filter((x) => !x.isChild && !x.role).sort((a, b) => a.id - b.id);
  for (const x of pool) { x.traits = []; x.quirk = null; x.skills = {}; x.workplaceId = null; }
  const [g1, g2, g3, g4, fb, p1] = pool;
  for (const x of [g1, g2, g3, g4]) { x.traits = ['natureLover']; x.quirk = 'natureEnthusiast'; }
  fb.traits = ['socialButterfly'];
  sc.relationships.set(fb, g3, 60);
  sc.relationships.set(fb, g4, 60);
  const houses = CD.CLUB_KEYS.map((k) => sim.place(k));
  c('kurulum: üç hobi evi ve en az 12 yetişkin', houses.every(Boolean) && pool.length >= 12, `${pool.length}`);

  // ---- A1. placementPlan saf
  const snap = () => JSON.stringify(st.characters.map((x) => [x.id, x.club ?? null]));
  const before = snap();
  const plan = C.placementPlan(st);
  const fbPlanned = plan.find((p) => p.c === fb);
  c('A1: plan durum yazmaz (c.club hiç değişmez); dost çekimi yine planlanan üyelerden sayılır', snap() === before && plan.length >= 4 && fbPlanned?.key === 'gardenClub', plan.map((p) => `${p.c.id}:${p.key}`).join(','));
  // bir sakinin özellik okuması ikinci turda hata fırlatır: eskiden c.club geçici yazılı kalıyordu
  let reads = 0;
  Object.defineProperty(p1, 'traits', { configurable: true, get() { reads += 1; if (reads > CD.CLUB_KEYS.length) throw new Error('deneme'); return []; } });
  let threw = false;
  try { C.placementPlan(st); } catch { threw = true; }
  delete p1.traits;
  p1.traits = [];
  c('A1: plan ortasında hata fırlasa da hiçbir sakinin c.club alanı değişmez', threw && snap() === before && st.characters.every((x) => x.club === null || x.club === undefined), `${threw} ${reads}`);

  // ---- A3. kulüp zili ACTIVITIES'ten türer
  const OLD = ['wait', 'petAnimal', 'readBench', 'readLibrary', 'music', 'viewpoint', 'shade', 'bench', 'river', 'flowers', 'monument', 'ancientSpring', 'campRest', 'stroll', 'campfire', 'fountain', 'gazebo', 'inn', 'clubHobby'].sort();
  const derived = Object.keys(ACTIVITIES).filter((k) => C.clubBellInterrupts(k)).sort();
  const fake = { ...ACTIVITIES, kite: { kind: 'leisure', label: 'Uçurtma uçuruyor' }, nap2: { kind: 'idle', label: '' }, kite2: { kind: 'work', label: '' } };
  c('A3: türetilen liste eski elle yazılmış listeyle aynı; dışlama listesi açık (randevu, teselli, anma, konser, kamu hizmeti...)',
    JSON.stringify(derived) === JSON.stringify(OLD) && ['console', 'memorial', 'rally', 'publicService', 'lecture', 'clubSession'].every((k) => !C.clubBellInterrupts(k)), derived.filter((k) => !OLD.includes(k)).join(','));
  c('A3: activities\'e yeni bir leisure / idle etkinliği eklenirse zil onu kendiliğinden kaldırır (work kaldırılmaz)', C.clubBellInterrupts('kite', fake) && C.clubBellInterrupts('nap2', fake) && !C.clubBellInterrupts('kite2', fake) && !C.clubBellInterrupts('kite'));

  // ---- A4. tek seferlik kartlar günlük kulüp / suç sınırından muaf
  const dir = sc.storyDirector;
  game.events.emit('ui:setStoryFilter', { filter: 'important' });
  dir.clubCards = { day: -1, n: 0 };
  dir.queue = [];
  const gb = C.clubBuilding(st, 'gardenClub');
  const work = { ...SC.makeCard('club:work', { key: 'gardenClub', kind: 'bed', n: 1, milestone: true, text: 'İlk tarh', ids: [g1.id], building: gb }, { state: st }), key: 'w1' };
  const exhib = SC.makeCard('club:exhibition', { key: 'paintingClub', ids: [g1.id, g2.id, g3.id], text: 'Kasaba Sergisi açıldı', building: gb }, { state: st });
  const founded = SC.makeCard('club:founded', { key: 'sewingClub', members: [g1, g2, g3], building: gb }, { state: st });
  const work2 = { ...work, key: 'w2' };
  const r = [dir.offer(work), dir.offer(exhib), dir.offer(founded), dir.offer(work2)];
  c('A4: sıradan kulüp kartı günün hakkını alır; Kasaba Sergisi ve kuruluş kartı (tek seferlik) yine gösterilir, ikinci sıradan kart özete düşer',
    dir.filter === 'important' && exhib.once && founded.once && !work.once && r[0] && r[1] && r[2] && !r[3] && dir.missed.some((x) => x.key === 'w2') && !dir.missed.some((x) => x.once), JSON.stringify(r));
  const grant = SC.makeCard('renown:grant', { key: 'peaceFountain', name: 'Barış Çeşmesi' }, { state: st });
  const firstGrad = SC.makeCard('university:graduated', { character: g1, field: 'farming', first: true }, { state: st });
  const laterGrad = SC.makeCard('university:graduated', { character: g2, field: 'farming' }, { state: st });
  const q = [1, 2, 3, 4, 5].map((i) => ({ key: `low${i}`, priority: 5, text: '' }));
  const res = SC.enqueue([...q.slice(0, 4), { ...grant }], { key: 'hi', priority: 5, text: '' }, 5);
  c('A4: lütuf ve ilk mezun kartı tek seferlik (sonraki mezun değil); kuyruk taşınca tek seferlik kart atılmaz', grant.once && firstGrad.once && !laterGrad.once && res.dropped && !res.dropped.once && res.queue.some((x) => x.key === grant.key), res.dropped?.key);

  // ---- A5. uzaklaştırma: davet / randevu / sohbet planı da hana çıkmaz (ortak nokta planGathering)
  const inn = sim.place('inn');
  inn.lit = true;
  const brain = sc.behavior.brain;
  const [b1, b2] = pool.slice(6, 8);
  b1.sentence = { banUntil: st.totalMinutes + 1440 };
  const banned = brain.planGathering(b1, inn);
  const free = brain.planGathering(b2, inn);
  const fountain = st.buildings.find((b) => b.type === 'fountain');
  const square = fountain ? brain.planGathering(b1, fountain) : { ok: 1 };
  c('A5: yasaklı sakine handa toplanma planı çıkmaz (davet edilen de bu yoldan geçer); yasaksıza çıkar; meydan serbest',
    J.isBanned(st, b1) && banned === null && free?.buildingId === inn.id && Boolean(square) && J.banBlocks(st, b1, inn) && !J.banBlocks(st, b2, inn) && !J.banBlocks(st, b1, inn, 'publicService'));
  // davet yolu: b2 hana gidip b1'i çağırır → b1 hana gitmez
  b1.task = null;
  b2.task = { ...free, inviteId: b1.id, phase: 'travel' };
  sc.behavior.invite(b2, 19);
  c('A5: hana davet edilen yasaklı sakin daveti kabul edemez (görevi han değil)', b1.task?.buildingId !== inn.id && b2.task.meetWithId === undefined, JSON.stringify(b1.task?.activity ?? null));
  b1.sentence = null;
  b2.task = null;

  // ---- A6. uzak kulüp evi: zil yürüme payı kadar erken (en çok 45 dk), panel uyarısı
  c('A6: yürüme payı karo × 2,2 dk, en çok 45 dk', C.leadMinutes(0) === 0 && C.leadMinutes(10) === 22 && C.leadMinutes(60) === CD.CLUB.leadMax && CD.CLUB.leadMax === 45);
  sc.clubs.newDay();
  const gm = C.membersOf(st, 'gardenClub');
  const day = st.time.day % 2 === 1 ? st.time.day : st.time.day + 1;
  const lead = sc.clubs.leadFor('gardenClub', gb, day);
  const rec = st.clubs.gardenClub.lead;
  c('A6: zilin erken çalma payı üyelerin evinden yol uzunluğundan, günde bir kez yazılır', gm.length >= 3 && rec?.day === day && rec.minutes === lead && lead === C.leadMinutes(rec.tiles) && lead >= 0 && lead <= 45, JSON.stringify(rec));
  const near = C.farHouseWarning(st, 'gardenClub', gb);
  st.clubs.gardenClub.lead = { day, tiles: 40, minutes: 45 };
  const far = C.farHouseWarning(st, 'gardenClub', gb);
  const CC = await import('/src/ui/components/clubCards.js');
  const panel = CC.clubSection(gb, st).map((n) => n.textContent).join(' ');
  c('A6: ortalama yol uzunsa panel "Kulüp evi evlerden uzak" der; yakınsa demez', (rec.tiles >= CD.CLUB.farTiles || near === null) && /evlerden uzak/.test(far ?? '') && /evlerden uzak/.test(panel), `${near} | ${far}`);
  st.clubs.gardenClub.lead = null;
  // saat: zil pencere başından payı kadar önce çalar
  const w = C.sessionWindow('gardenClub', day);
  st.clubs.gardenClub.lead = { day, tiles: 20, minutes: 30 };
  delete st.clubs.gardenClub.evaluated;
  delete st.clubs.gardenClub.live;
  let rung = null;
  const off = game.events.on('club:bell', () => { rung ??= st.totalMinutes; });
  const t0 = st.totalMinutes;
  const target = w.start - 60;
  if (target > t0) sim.step(Math.ceil(((target - t0) / 60) * 225));
  for (let i = 0; i < 225 * 2 && rung === null; i++) sim.step(1);
  off();
  const early = rung !== null ? w.start - rung : null;
  c('A6: zil pencereden payı kadar önce çalar (30 dk pay → 27-31 dk önce)', early === null ? st.clubs.gardenClub.recent?.length > 0 : early >= 27 && early <= 31, `${early}`);

  // ---- B2. düşen buluşma ertesi akşam bir kez telafi edilir
  const gr = st.clubs.gardenClub;
  const live0 = gr.live;
  if (live0) sc.clubs.finish('gardenClub', gb);
  let odd = st.time.day; // önümüzdeki, henüz değerlendirilmemiş bahçe günü (penceresi en az bir saat sonra)
  while (!C.isSessionDay('gardenClub', odd) || gr.evaluated === odd || C.sessionWindow('gardenClub', odd).start - 60 < st.totalMinutes) odd += 1;
  c('B2: takvim dışı günde pencere yalnızca telafi günüyse açılır', C.sessionWindow('gardenClub', odd + 1) === null && C.sessionWindow('gardenClub', odd + 1, { makeup: odd + 1 })?.makeup === true && !C.sessionWindow('gardenClub', odd, { makeup: odd })?.makeup);
  const wOdd = C.sessionWindow('gardenClub', odd);
  const stepTo = (m) => { for (let i = 0; i < 400 && st.totalMinutes < m; i++) sim.step(Math.max(1, Math.min(225, Math.ceil(((m - st.totalMinutes) / 60) * 225)))); };
  stepTo(wOdd.start - 120);
  st.clubs.gardenClub.lead = { day: odd, tiles: 0, minutes: 0 }; // pay 0: zil tam pencere başında
  stepTo(wOdd.start - 5);
  sc.clubs.blocked = () => true; // şenlik sürüyor say (örnek yöntem; sınıfınki geri gelir)
  stepTo(wOdd.start + CD.CLUB.blockedGrace + 5);
  delete sc.clubs.blocked;
  const scheduled = gr.makeup;
  const plannedA = gr.planned ?? 0;
  let bell = 0;
  const offB = game.events.on('club:bell', ({ key }) => { if (key === 'gardenClub') bell += 1; });
  const wNext = C.sessionWindow('gardenClub', odd + 1, gr);
  if (wNext) {
    stepTo(wNext.start - 120);
    st.clubs.gardenClub.lead = { day: odd + 1, tiles: 0, minutes: 0 };
    stepTo(wNext.start + CD.CLUB.blockedGrace + 5); // o akşam gerçek bir şenlik / anma varsa en çok 30 dk beklenir
  }
  offB();
  c('B2: şenlik yüzünden düşen buluşma ertesi akşama kayar (telafi günü zil çalar ya da değerlendirilir); planlanan sayacı yalnızca takvim gününde artar', scheduled === odd + 1 && gr.evaluated === odd + 1 && (bell === 1 || gr.recent.length > 0) && (gr.planned ?? 0) === plannedA, `${scheduled} ${gr.evaluated} ${bell} ${gr.planned} gün ${st.time.day} tek ${odd} üye ${C.membersOf(st, 'gardenClub').length} ${JSON.stringify(gr.recent)}`);
  if (gr.live) sc.clubs.finish('gardenClub', gb);
  c('B2: telafinin kendisi düşse de yeniden kaydırılmaz', gr.makeup === undefined || gr.makeup <= odd + 1, `${gr.makeup}`);
  return out;
});
results.push(...out);

// ---- C1. suç planları daha az düşer: isyancının planı isyan saatinden sonra, şenlikten sıvışma, haylazlıkta yakın başka süs
const out2 = await page.evaluate(async () => {
  const out = [];
  const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const J = await import('/src/systems/Justice.js');
  const D = await import('/src/data/justice.js');
  const { REVOLT } = await import('/src/data/citizens.js');
  const st = game.state;
  const sc = game.scenes.current;
  const T = 16;
  st.town.tier = 3;
  sim.give({ wood: 900, stone: 900, gold: 3000, food: 500, iron: 200 });
  if (st.time.day < 8) st.time.day = 8;
  const cands = st.characters.filter((x) => J.crimeCandidate(st, x));
  // isyancı
  const prevRevolt = st.trust.revolt;
  st.trust.revolt = { rioters: cands.map((x) => x.id), raids: [] };
  const hours = [];
  for (let i = 0; i < 60 && hours.length < 8; i++) {
    for (const p of sc.crime.planDay()) hours.push(Math.floor((p.crimePlan.at % 1440) / 60));
  }
  for (const x of st.characters) delete x.crimePlan;
  st.trust.revolt = prevRevolt;
  c('C1: isyancının suç planı isyan saatinin bitiminden (20:00) önce değil', D.JUSTICE.rioterAfterRiot && hours.length >= 3 && hours.every((h) => h >= REVOLT.hours[1]), hours.join(','));
  // şenlikten sıvışma
  const brain = sc.behavior.brain;
  const a = cands.find((x) => !x.isChild && x.lifeStage === 'adult') ?? cands[0];
  const market = st.buildings.find((b) => b.type === 'market' && b.functional) ?? sim.place('market') ?? sim.place('inn');
  const venue = st.buildings.find((b) => b.type === 'fountain') ?? market;
  a.task = null; a.needs.hunger = 90; a.needs.energy = 90; a.illness = null; a.mood.grief = false; a.visible = true; a.insideBuildingId = null;
  const now = st.totalMinutes;
  const crimeKey = market?.type === 'inn' ? 'innPilfer' : 'marketFruit';
  a.crimePlan = { crime: crimeKey, variant: 'fruit', buildingId: market?.id, motive: 'temptation', at: now - 5, until: now + 300, duration: 10 };
  const festPrev = { ...st.events.festival };
  Object.assign(st.events.festival, { active: true, venueId: venue.id, endsAt: now + 120 });
  const hr = 19;
  const sneak = J.crimeReady(st, a, hr) ? brain.decide(a, hr)?.activity : 'notready';
  a.crimePlan = { crime: 'marketFruit', variant: 'fruit', buildingId: market.id, motive: 'temptation', at: now + 600, until: now + 900, duration: 10 };
  const later = brain.decide(a, hr)?.activity;
  delete a.crimePlan;
  Object.assign(st.events.festival, festPrev);
  c('C1: vakti gelmiş suç planı olan sakin şenliğe değil hedefe gider; vakti gelmemişse şenliğe gider', sneak === 'pilfer' && later === 'festival', `${sneak} / ${later}`);
  // haylazlık: hedefe yol yoksa yakındaki başka bir süs
  const b1 = sim.place('bench');
  const b2 = sim.place('planter') ?? sim.place('signpost') ?? sim.place('bench');
  const fp = sc.world.findPath.bind(sc.world);
  const ring1 = new Set([...sc.world.getSpots(b1), ...brain.crimeRing(b1)].map((p) => `${p.x},${p.y}`));
  const ring2 = new Set([...sc.world.getSpots(b2), ...brain.crimeRing(b2)].map((p) => `${p.x},${p.y}`));
  for (const k of ring2) ring1.delete(k); // ortak karolar ikinci hedefe açık kalsın
  sc.world.findPath = (o, g, opt) => (ring1.has(`${g.x},${g.y}`) ? null : fp(o, g, opt));
  a.task = null;
  a.crimePlan = { crime: 'pettyVandal', variant: 'scuff', buildingId: b1.id, motive: 'mischief', at: now - 5, until: now + 300, duration: 10 };
  const vp = brain.planCrime(a, hr);
  sc.world.findPath = fp;
  delete a.crimePlan;
  c('C1: haylazlık hedefine yol yoksa yakındaki başka süse gider (plan düşmez)', D.JUSTICE.vandalRetarget > 0 && vp?.activity === 'pilfer' && vp.buildingId !== b1.id && vp.crime.buildingId === vp.buildingId, `${vp?.buildingId} ${b1.id} ${b2?.type}:${b2?.id} ${ring2.size}`);
  return out;
});
results.push(...out2);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
