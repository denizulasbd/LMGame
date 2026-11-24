// Aşama 32.2 testleri: Adalet Sarayı ve Dava (Muhtar kuralı, saray davası, süre, her ceza her suçta, orantılılık ve bantlar, etkiler,
// para cezası / kamu hizmeti / uzaklaştırma / iade, cezasızlık, sonradan konuşan tanık, sürgün ve geride kalan aile, utanç ve karalama,
// yadigâr ve ocak, kayıt, pencere ve çip, şalter). Kullanım: node tools/sim/tests/32.2-court.mjs [--verbose]
//   ya da   node tools/sim/gate.mjs --quick --only 32.2
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const { browser, page } = await openGame({ seed: 5 });
page.on('pageerror', (e) => errors.push(String(e)));
results.push(...(await page.evaluate(async () => {
  const out = [];
  const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const J = await import('/src/systems/Justice.js');
  const D = await import('/src/data/justice.js');
  const MD = await import('/src/data/moodlets.js');
  const SD = await import('/src/data/storyCards.js');
  const SC = await import('/src/systems/StoryCards.js');
  const GD = await import('/src/data/guide.js');
  const B = await import('/src/data/buildings.js');
  const Mo = await import('/src/systems/Moodlets.js');
  const Ch = await import('/src/systems/Chemistry.js');
  const TD = await import('/src/systems/TownDecor.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { CONFIG } = await import('/src/config.js');
  const { Random } = await import('/src/utils/random.js');
  const Ci = await import('/src/systems/Citizens.js');
  const { sim } = window;
  let st = game.state;
  let sc = game.scenes.current;
  const E = game.events;
  const T = CONFIG.TILE_SIZE;
  sim.give({ wood: 900, stone: 900, food: 300, gold: 3000, iron: 200 });
  st.town.tier = 3;
  st.time.day = 8;
  const storage = sim.place('storage');
  const inn = sim.place('inn');
  const market = sim.place('market');
  const setMinutes = (s, t) => { s.time.day = Math.floor(t / 1440) + 1; s.time.hour = Math.floor((t % 1440) / 60); s.time.minute = t % 60; };
  const at = (ch, x, y) => { ch.x = x * T + T / 2; ch.y = y * T + T / 2; ch.visible = true; ch.insideBuildingId = null; if (ch.task?.activity === 'sleep') ch.task = null; };
  const calm = (ch) => { ch.task = null; ch.newcomer = false; ch.relocating = false; ch.coins = 40; ch.needs.hunger = 90; ch.loyalty = 0; ch.traits = []; ch.quirk = null; ch.moodlets = []; ch.mood.grief = false; ch.illness = null; ch.isInjured = false; ch.sentence = null; };
  for (const x of st.characters) calm(x);
  const fixed = (v) => Object.assign(new Random(1), { next: () => v });
  const adults = () => st.characters.filter((x) => !x.role && !x.isChild && J.crimeCandidate(st, x));
  const p0 = () => ({ crime: 'pantryRation', variant: 'ration', buildingId: storage.id });
  const real = sc.crime.dice;
  /** Yakalanan dava (suçüstü): zar 0 → yakalanır. */
  const caught = (who, plan, building = null, motive = 'temptation') => {
    sc.crime.dice = fixed(0);
    const k = sc.crime.commit(who, { crime: { ...plan, motive } }, building);
    sc.crime.dice = real;
    return k;
  };

  // ---- 1. veri
  const harsh = D.SENTENCE_KEYS.map((k) => D.SENTENCES[k].harsh).join();
  c('veri: şalter court açık, tohum + 43 izole, sekiz ceza (sertlik 0-6), Mahcup eylem katmanında (moodlet sayısı 33), kartlar sürüm 5, rehber sürüm 6',
    ENGINES.court === true && D.COURT_SEED_OFFSET === 43 && D.SENTENCE_KEYS.length === 8 && harsh === '0,1,2,2,3,3.5,3.5,6' && MD.MOODLET_KEYS.length === 33 && MD.MOODLETS.shamed.layer === 'action' &&
    SD.STORY_TABLE_VERSION === 5 && GD.GUIDE_TABLE_VERSION === 6 && GD.GUIDE_STEPS.some((s) => s.id === 'court') && CONFIG.SAVE_VERSION === 41 && B.BUILDINGS.courthouse.requiresTier === 3 && B.BUILDINGS.courthouse.unique && B.BUILD_MENU.includes('courthouse'), harsh);

  // ---- 2. saray yokken Muhtar kuralı aynen
  const [a, b, k3, d4] = adults();
  for (const x of [a, b, k3, d4]) calm(x);
  at(a, 5, 5); at(b, 6, 5);
  const m1 = caught(a, p0(), storage, 'hunger');
  const t0 = st.totalMinutes;
  setMinutes(st, m1.deadline);
  sc.crime.closeDue();
  setMinutes(st, t0);
  c('saray yokken: süre 1 gün, Muhtar uyarısı (by elder), dava saraya geçmez, ifade yazılmaz', m1 && m1.deadline === m1.minute + D.JUSTICE.closeAfterMinutes && m1.status === 'closed' && m1.verdict?.by === 'elder' && !m1.court && !m1.statement && J.courtOf(st) === null);

  // ---- 3. saray varken dava saraya düşer
  const court = sim.place('courthouse');
  c('Adalet Sarayı kurulur (3x3, Kasaba, tek); courtOf bulur; ikincisi kurulamaz', court?.type === 'courthouse' && J.courtOf(st) === court && /yalnızca bir/.test(sc.construction.globalBlock('courthouse') ?? ''), sc.construction.globalBlock('courthouse'));
  const j0 = st.journal.length;
  const k1 = caught(a, p0(), storage, 'hunger');
  setMinutes(st, k1.minute + D.JUSTICE.closeAfterMinutes + 5);
  sc.crime.closeDue();
  const stillOpen = k1.status === 'open';
  setMinutes(st, t0);
  c('saray varken: dava Muhtar\'a gitmez, süre 2 gün, ifade / tanık değişkeni yazılır, günlük "Adalet Sarayı\'na düştü"', stillOpen && k1.court === true && k1.deadline === k1.minute + 2 * 1440 && Number.isInteger(k1.statement?.offender) && st.journal.slice(j0).some((x) => /Adalet Sarayı/.test(x.text)), JSON.stringify(k1.statement));
  const card = SC.makeCard('crime:caught', { kase: k1, text: 'x', character: a }, { state: st });
  c('suçüstü kartında "Dava dosyası" eylemi (dava açıkken etkin)', card?.action?.type === 'case' && SC.actionStatus(st, card).enabled, JSON.stringify(card?.action));

  // ---- 4. her ceza her suçta seçilebilir
  const variety = [['innPilfer', 'meal', inn], ['marketFruit', 'fruit', market], ['pantryRation', 'ration', storage]];
  inn.meals = 10;
  const optsOk = variety.every(([crime, variant, bld]) => {
    const kk = { ...k1, crime, variant, buildingId: bld.id };
    const o = J.sentenceOptions(st, kk);
    return o.length === 8 && o.every((x) => x.enabled);
  }) && J.sentenceOptions(st, { ...k1, crime: 'pursePinch', variant: 'coins', stolen: { coins: true, amount: 5, value: 5 } }).every((x) => x.enabled) && J.sentenceOptions(st, { ...k1, crime: 'pettyVandal', variant: 'scuff', stolen: null }).every((x) => x.enabled);
  c('her ceza her suçta seçilebilir: sekiz seçenek, hiçbiri pasif ya da gizli değil (altı suç türü)', optsOk);

  // ---- 5. hak edilen sertliğin yönleri
  const base = { ...k1, severity: 2, stolen: null, remorse: 'apologize', context: { ...k1.context, hungry: false, coins: 40, repeat: 0, ageStage: 'adult' }, statement: {} };
  const dv = (patch) => J.deserved({ ...base, ...patch, context: { ...base.context, ...(patch.context ?? {}) } }, st, { famine: false });
  const ref = dv({});
  const dirs = {
    hungry: dv({ context: { hungry: true } }) < ref,
    poor: dv({ context: { coins: 2 } }) < ref,
    confess: dv({ remorse: 'confess' }) > ref && dv({ remorse: 'confess' }) < dv({ remorse: 'excuse' }),
    denyWitness: dv({ remorse: 'deny', witnessName: 'X' }) > dv({ remorse: 'deny', witnessName: null }),
    repeat: dv({ context: { repeat: 2 } }) > ref,
    youth: dv({ context: { ageStage: 'youth' } }) < ref,
    forgive: dv({ statement: { plea: 'forgive' } }) < ref,
    lesson: dv({ statement: { plea: 'lesson' } }) > ref,
    famine: J.deserved({ ...base, severity: 3, context: { ...base.context, hungry: true } }, st, { famine: true }) < dv({ severity: 3, context: { hungry: true } }),
  };
  c('hak edilen sertlik: açlık / kıtlık, yoksulluk, özür, gençlik, "affedin" düşürür; inkâr + tanık, tekrar, "ders almalı" artırır', Object.values(dirs).every(Boolean), JSON.stringify(dirs));
  const unret = J.deserved(k1, st) - J.deserved(k1, st, { restitution: true });
  c('çalınan duruyor ve iade ettirilmezse hak edilen +0,5', Math.abs(unret - D.DESERVED.unreturned) < 1e-9, String(unret));
  c('beş bant doğru seçilir (sınırlar dahil)', J.verdictBand(0) === 'fair' && J.verdictBand(0.75) === 'fair' && J.verdictBand(-0.75) === 'fair' && J.verdictBand(1) === 'harsh' && J.verdictBand(2) === 'harsh' && J.verdictBand(2.01) === 'cruel' && J.verdictBand(-1) === 'lenient' && J.verdictBand(-2) === 'lenient' && J.verdictBand(-2.01) === 'lax');

  // ---- 6. bantların etkileri
  const court$ = sc.court;
  const rngs = () => JSON.stringify([sc.behavior.brain.rng.state, sc.behavior.brain.citizenRng.state, ...Object.values(sc).filter((v) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number').map((v) => v.rng.state)]);
  const fresh = (who, victim = null, motive = 'temptation', remorse = 'confess') => {
    let kk;
    if (victim) { victim.coins = 120; at(who, 5, 5); at(victim, 6, 5); kk = caught(who, { crime: 'pursePinch', variant: 'coins', victimId: victim.id }, null, motive); }
    else kk = caught(who, p0(), storage, motive);
    if (kk) {
      kk.remorse = remorse;
      kk.context.repeat = 0; // sicil temiz (testin kendisi ayarlar)
      kk.context.hungry = false;
    }
    return kk;
  };
  const pickFor = (kk, band) => {
    const want = J.deserved(kk, st);
    return D.SENTENCE_KEYS.find((s) => J.verdictBand(D.SENTENCES[s].harsh - want) === band) ?? null;
  };
  // adil
  a.loyalty = 0; b.loyalty = 0;
  let tr = st.trust.value = 60;
  let kk = fresh(a, b, 'poverty', 'confess');
  const rng0 = rngs();
  let s1 = pickFor(kk, 'fair');
  let r = court$.decide(kk, s1);
  c('adil karar: güven +2, itiraf eden suçlu +3, kurban +3; dava kapanır; ana üreteçler ilerlemez', r?.band === 'fair' && st.trust.value === tr + 2 && a.loyalty === 3 && b.loyalty === 3 && kk.status === 'closed' && kk.verdict.by === 'court' && kk.verdict.band === 'fair' && rngs() === rng0, `${s1} ${st.trust.value - tr} ${a.loyalty} ${b.loyalty}`);
  // sert
  for (const x of st.characters) x.loyalty = 0;
  tr = st.trust.value = 60;
  kk = fresh(a, null, 'temptation', 'confess');
  r = court$.decide(kk, pickFor(kk, 'harsh'));
  const kinA = J.kinOf(st, a);
  c('sert karar: güven −3, suçlu ve ailesi / dostları −4', r?.band === 'harsh' && st.trust.value === tr - 3 && a.loyalty === -4 && kinA.every((x) => x.loyalty === -4), `${st.trust.value - tr} ${a.loyalty} aile ${kinA.length}`);
  // zalim
  for (const x of st.characters) x.loyalty = 0;
  tr = st.trust.value = 60;
  kk = fresh(a, null, 'hunger', 'confess');
  kk.context.hungry = true;
  r = court$.decide(kk, 'fineHeavy');
  const others = st.characters.filter((x) => !x.isChild && !x.role && x !== a && !kinA.includes(x) && !sc.loyalty.friendsOf(a).includes(x));
  c('zalim karar: güven −8, bütün yetişkinler −3, aile ve dostlar −8', r?.band === 'cruel' && st.trust.value === tr - 8 && a.loyalty === -8 && others.every((x) => x.loyalty === -3), `${r?.band} ${r?.sentence} ${st.trust.value - tr} ${a.loyalty} ${others.map((x) => x.loyalty)}`);
  // hafif ve gevşek
  for (const x of st.characters) x.loyalty = 0;
  const imp0 = J.impunityScore(st);
  kk = fresh(a, b, 'poverty', 'confess');
  r = court$.decide(kk, pickFor(kk, 'lenient'));
  const lenOk = r?.band === 'lenient' && b.loyalty === -3 && kk.verdict.impunity === 1;
  tr = st.trust.value = 60;
  b.loyalty = 0;
  kk = fresh(a, b, 'poverty', 'confess');
  r = court$.decide(kk, 'pardon');
  c('hafif: kurban ve dostları −3, cezasızlık +1 · gevşek: kurban −6, güven −2, cezasızlık +2', lenOk && r?.band === 'lax' && b.loyalty === -6 && st.trust.value === tr - 2 && kk.verdict.impunity === 2 && J.impunityScore(st) >= imp0, `${lenOk} ${r?.band} ${b.loyalty} ${J.impunityScore(st)}`);
  const impHigh = J.impunityFactor(st);
  for (let i = 0; i < 4; i++) { const q = fresh(a, b); court$.decide(q, pickFor(q, 'fair')); }
  c('impunityFactor yükselir (hafif / gevşek / sürüncemede) ve adil kararlarla söner; tavanlı', impHigh > 1.2 && J.impunityFactor(st) < impHigh && J.impunityFactor(st) >= 1 && J.impunityFactor({ ...st, justice: { log: Array.from({ length: 20 }, () => ({ closedDay: st.time.day, verdict: { by: 'court', impunity: 2 } })) } }) === D.IMPUNITY.cap, `${impHigh.toFixed(2)} → ${J.impunityFactor(st).toFixed(2)}`);
  const rec = J.justiceRecord(st);
  c('justiceRecord: son kararlarda adil oranı, bantlar, cezasızlık; Muhtar ve sürüncemede ayrı sayılır', rec.verdicts >= 7 && rec.bands.fair >= 5 && rec.elder >= 1 && rec.fairRatio > 0 && rec.fairRatio < 1 && Number.isFinite(rec.impunityFactor), JSON.stringify(rec));

  // ---- 7. para cezası ve kamu hizmeti
  a.sentence = null;
  kk = fresh(a, b);
  a.coins = 2;
  const gold0 = st.resources.gold;
  const asked = J.fineAmount(kk, 'fineHeavy');
  court$.decide(kk, 'fineHeavy');
  const needH = Math.ceil((asked - 2) / D.COURT.fineHourCoins);
  c('para cezası: kese yetmezse kalanı saat başına 4 altınla kamu hizmetine çevrilir (hazineye ödenen kadar)', a.coins === 0 && st.resources.gold === gold0 + 2 && a.sentence?.service === needH && kk.verdict.fine?.hours === needH, `${asked} istendi, ${a.sentence?.service} sa`);
  // hizmet: boş zamanda planlanır, saat azalır, mesaiyi bölmez
  const brain = sc.behavior.brain;
  at(a, st.buildings.find((x) => x.type === 'fountain')?.tileX ?? 20, (st.buildings.find((x) => x.type === 'fountain')?.tileY ?? 20) + 3);
  const plan = brain.planService(a);
  const left0 = a.sentence.service;
  E.emit('court:served', { character: a, task: { duration: 60 } });
  const wp = st.buildings.find((x) => x.functional && x.workerSlots > 0 && x.type !== 'courthouse');
  a.workplaceId = wp?.id ?? null;
  wp?.workerIds.add(a.id);
  const bc = a.profile.work.breakChance;
  a.profile.work.breakChance = 0;
  a.task = null;
  const workPlan = brain.decide(a, 10);
  a.profile.work.breakChance = bc;
  const evePlan = brain.decide(a, 19);
  c('kamu hizmeti: boş zamanda meydana "publicService" (süpürge), oturum bitince saat 1 azalır; mesai saatinde işe gider', plan?.activity === 'publicService' && a.sentence.service === left0 - 1 && workPlan?.activity !== 'publicService' && evePlan?.activity === 'publicService', `${plan?.activity} ${left0}→${a.sentence.service} mesai:${workPlan?.activity} akşam:${evePlan?.activity}`);
  // hizmetin bitişi: sicilde "borcunu ödedi"
  a.sentence.service = 1;
  E.emit('court:served', { character: a, task: { duration: 60 } });
  c('hizmet bitince ceza silinir, sicilde "borcunu ödedi", anısı yazılır', a.sentence === null && kk.verdict.served === true && a.memories.some((m) => /borcunu ödedi/.test(m.text)));

  // ---- 8. uzaklaştırma
  kk = fresh(d4);
  court$.decide(kk, 'ban');
  d4.coins = 60;
  d4.needs.hunger = 10;
  d4.lastShopAt = null;
  const shopTries = Array.from({ length: 30 }, () => brain.planShop(d4)).filter(Boolean).length;
  const meal = brain.planMeal(d4);
  inn.lit = true;
  const leisure = Array.from({ length: 40 }, () => brain.planLeisure(d4, 20)?.activity);
  d4.task = { activity: 'innMeal', buildingId: inn.id, phase: 'travel' };
  const turned = court$.turnBack(d4);
  c('uzaklaştırma: 4 gün; han / pazar planı çıkmaz, evde ya da kilerde yemek çıkar; hana yürürken yolda döner', J.isBanned(st, d4) && d4.sentence.banUntil === st.totalMinutes + 4 * 1440 && shopTries === 0 && meal && meal.activity === 'meal' && !leisure.includes('inn') && turned, `${shopTries} ${meal?.activity} ${leisure.filter((x) => x === 'inn').length}`);
  d4.sentence = null;
  d4.task = null;

  // ---- 9. iade
  st.resources.food = 100;
  kk = fresh(k3);
  const took = kk.stolen.amount;
  const food0 = st.resources.food;
  const have0 = Ci.countItem(k3, 'ration');
  court$.decide(kk, 'warning', { restitution: true });
  const coinCase = fresh(k3, b);
  const vb = b.coins;
  const amt = coinCase.stolen.amount;
  court$.decide(coinCase, 'warning', { restitution: true });
  c('iade: erzak kilere döner (stok ve çanta tutarlı), keseden alınan altın kurbana döner; ceza değil, karara yazılır', kk.verdict.restitution === took && st.resources.food === food0 + took && Ci.countItem(k3, 'ration') === have0 - took && b.coins === vb + amt && coinCase.verdict.restitution === amt, `${took} ${st.resources.food - food0} · ${amt} ${b.coins - vb}`);

  // ---- 10. sürüncemede
  for (const q of [...st.justice.cases]) court$.decide(q, 'warning');
  kk = fresh(k3);
  tr = st.trust.value = 60;
  const staleCards = [];
  const offS = E.on('court:stale', (p) => staleCards.push(p));
  setMinutes(st, kk.deadline);
  court$.hourly(st.time.hour);
  setMinutes(st, t0);
  offS();
  c('süre dolunca "sürüncemede kaldı": otomatik Uyarı, güven −2, cezasızlık +1, hikâye kartı', kk.status === 'closed' && kk.verdict.stale && kk.verdict.kind === 'warning' && kk.verdict.impunity === 1 && st.trust.value === tr - 2 && staleCards.length === 1 && SC.makeCard('court:stale', staleCards[0], { state: st })?.text, `${kk.status} ${JSON.stringify(kk.verdict)} ${st.trust.value - tr} ${staleCards.length}`);

  // ---- 11. sonradan konuşan tanık
  sc.crime.dice = fixed(0.99);
  const u = sc.crime.commit(k3, { crime: { ...p0(), motive: 'hunger' } }, storage);
  sc.crime.dice = real;
  const caught0 = st.justice.stats.caught;
  const hidden = st.justice.log.includes(u) && u.offenderId === k3.id && u.unsolved;
  const realDice = court$.dice;
  court$.dice = Object.assign(new Random(3), { next: () => 0 });
  const rev = court$.revealDay();
  court$.dice = realDice;
  c('yakalanmayan suç (log\'da gizli offenderId) saray varken bir tanıkla davaya döner; yakalanan sayacı artar', hidden && rev === u && u.status === 'open' && u.revealed?.witnessName && u.witnessName && !u.unsolved && st.justice.cases.includes(u) && st.justice.stats.caught === caught0 + 1 && st.justice.stats.court.revealed >= 1 && J.witnessText(u)?.includes(u.witnessName), J.witnessText(u));
  court$.decide(u, 'warning');

  // ---- 12. sürgün: yalnızca suçlu gider, ailesi kalır
  // aile kur: x (suçlu) + eş y + çocuk z (aynı ev)
  const home = st.buildings.find((x) => x.type === 'cabin' && x.functional);
  const pop = st.characters.filter((q) => !q.role && !q.isChild);
  const x = pop.find((q) => q !== a && q !== b && J.crimeCandidate(st, q)) ?? k3;
  const y = pop.find((q) => q !== x && q !== a);
  calm(x); calm(y);
  for (const q of [x, y]) { q.married = false; q.partnerId = null; }
  for (const q of st.characters) if (q.partnerId === x.id || q.partnerId === y.id) { q.partnerId = null; q.married = false; }
  x.partnerId = y.id; y.partnerId = x.id; x.married = true; y.married = true;
  x.homeId = home.id; y.homeId = home.id;
  const child = st.characters.find((q) => q.isChild) ?? null;
  if (child) { child.parentIds = [x.id, y.id]; child.parents = [x.id, y.id]; child.homeId = home.id; x.children = [child.id]; y.children = [child.id]; }
  // yadigâr ve ocak reisliği
  const relicKind = Object.keys((await import('/src/data/heirloom.js')).HEIRLOOMS)[0];
  x.inventory = [{ kind: relicKind, qty: 1, name: 'Yadigâr', heirloom: Ci.sanitizeHeirloomMeta({ ownerId: x.id, ownerName: x.name, story: 'Eski bir hikâye', since: 1, chain: [x.name] }) }];
  st.lineage.heads[home.id] = x.id;
  const exo = JSON.stringify([st.exodus.left, st.exodus.cap ?? null, st.stats.emigrants ?? 0]);
  const archive0 = st.heirloom.archive.length;
  const carriers0 = st.characters.filter((q) => (q.inventory ?? []).some((s) => s.heirloom)).length;
  const leftEvents = [];
  const offL = E.on('population:left', (p) => leftEvents.push(p.reason));
  const jx = st.journal.length;
  kk = fresh(x);
  court$.decide(kk, 'exile');
  const walking = Boolean(x.sentence?.exile) && st.characters.includes(x);
  const ex = brain.planExile(x);
  court$.departExile(x);
  offL();
  const ids = new Set(st.characters.map((q) => q.id));
  const childOk = !child || (st.characters.includes(child) && child.homeId !== null && st.buildings.some((h) => h.id === child.homeId) && child.parentIds.every((p) => ids.has(p)) && child.parents.every((p) => ids.has(p)) && child.parentIds.includes(y.id));
  c('sürgün: önce bohçasıyla kenara yürür ("exile"), sonra yalnızca suçlu kasabadan çıkar; eş ve çocuk kalır', walking && (ex === null || ex.activity === 'exile') && !st.characters.includes(x) && st.characters.includes(y) && childOk && !y.married && y.partnerId === null, `${walking} ${ex?.activity} çocuk ${child?.name ?? '-'}`);
  c('terk ediş sayaçları değişmez (exodus.left, exodus.cap, stats.emigrants); justice sayacı ve günlük ayrı; population:left { reason: exile }', JSON.stringify([st.exodus.left, st.exodus.cap ?? null, st.stats.emigrants ?? 0]) === exo && st.justice.stats.court.exiled === 1 && st.justice.exiles?.at(-1)?.name === x.name && leftEvents.includes('exile') && st.journal.slice(jx).some((q) => /sürüldü/.test(q.text)) && !st.journal.slice(jx).some((q) => /köyden temelli ayrıldı/.test(q.text)));
  const carriers1 = st.characters.filter((q) => (q.inventory ?? []).some((s) => s.heirloom)).length;
  c('yadigâr kaybolmaz (mirasçıya ya da arşive geçer); ocak reisliği düşer (evin en yaşlı yetişkini reis sayılır)', (carriers1 === carriers0 || st.heirloom.archive.length === archive0 + 1) && st.lineage.heads[home.id] === undefined, `${carriers0}→${carriers1} arşiv ${archive0}→${st.heirloom.archive.length}`);
  const sh = Mo.getMoodlet(y, 'shamed');
  const tagged = st.characters.filter((q) => Ch.hasTag(q, y.id, 'resentful'));
  c('geride kalan aileye "Mahcup", eşe "Kalbi Kırık"; tanıyan birkaç sakinden aileye süreli Kırgın etiketi (karalama)', sh && Mo.getMoodlet(y, 'heartbroken') && (!child || Mo.getMoodlet(child, 'shamed')) && tagged.length >= 1 && tagged.length <= 3, `${tagged.length} karalayan`);
  // süre sonunda kalkar
  const later = st.totalMinutes + 4 * 1440 + 120;
  setMinutes(st, later);
  E.emit('time:hour', st.time.hour);
  sc.moodlets.update?.({ gameMinutes: 1, minutes: 1, dt: 0.01 });
  for (const q of st.characters) Ch.expireTags(q, st.totalMinutes);
  for (const q of st.characters) Mo.expireMoodlets?.(q, st.totalMinutes);
  c('Mahcup ve karalama etiketi süre sonunda kendiliğinden kalkar', !Mo.getMoodlet(y, 'shamed') && st.characters.every((q) => !Ch.hasTag(q, y.id, 'resentful')), `${Mo.getMoodlet(y, 'shamed')?.until} / ${st.totalMinutes}`);
  setMinutes(st, t0);
  // tek ebeveyn sürgün: çocuk evde yetişkin kalmazsa akraba / boş yatağa taşınır
  let single = 'çocuk yok';
  if (child && st.characters.includes(child)) {
    const p = st.characters.find((q) => !q.role && !q.isChild && q !== y && J.crimeCandidate(st, q) && q.partnerId === null);
    const lone = st.buildings.find((h) => h.type === 'cabin' && h.functional && h.id !== home.id && st.characters.every((q) => q.homeId !== h.id)) ?? sim.place('cabin');
    calm(p);
    p.homeId = lone.id; child.homeId = lone.id; child.parentIds = [p.id]; child.parents = [p.id]; p.children = [child.id];
    for (const q of st.characters) if (q !== p && q !== child && q.homeId === lone.id) q.homeId = home.id;
    const kp = fresh(p);
    court$.decide(kp, 'exile');
    court$.departExile(p);
    const h2 = st.buildings.find((h) => h.id === child.homeId);
    single = h2 && st.characters.some((q) => q.homeId === h2.id && !q.isChild) ? 'ok' : `ev ${child.homeId}`;
  }
  c('tek ebeveyn sürgün edilirse çocuk yetişkini olan bir eve (önce akrabaya) taşınır; evsiz ya da kopuk referans yok', single === 'ok' || single === 'çocuk yok', single);
  const ids2 = new Set(st.characters.map((q) => q.id));
  const dangling = st.characters.some((q) => q.parentIds.some((p) => !ids2.has(p)) || (q.partnerId !== null && !ids2.has(q.partnerId)) || (q.children ?? []).some((p) => !ids2.has(p)) || (q.homeId !== null && !st.buildings.some((h) => h.id === q.homeId))) || [...st.justice.cases, ...st.justice.log].some((q) => [q.offenderId, q.victimId, q.witnessId].some((v) => v !== null && v !== undefined && !ids2.has(v)));
  c('sürgünden sonra kopuk kişi / ev referansı kalmaz (eş, ebeveyn, çocuk, ev, dava)', !dangling);

  // ---- 13. pencere, çip, İlan Tahtası, sakin kartı
  const kw = fresh(a, b, 'hunger', 'confess');
  const board = sim.place('noticeBoard');
  const notice = TD.noticeItems(st).some((i) => i.key === `case:${kw.id}` && i.target?.case === kw.id);
  E.emit('ui:openCase', { id: kw.id });
  game.ui.render();
  const panel = document.querySelector('.case-panel');
  const opts = [...document.querySelectorAll('.case-option')].map((x) => x.dataset.sentence);
  const paused = game.state.time.minute;
  const chip = [...document.querySelectorAll('.buff-chip.is-case, .hud-more-list .is-case')].length;
  document.querySelector('.case-option[data-sentence="warning"]')?.click();
  game.ui.render();
  document.querySelector('.case-decide')?.click();
  game.ui.render();
  const resultText = document.querySelector('.case-result-band')?.textContent ?? '';
  c('dava penceresi açılır (oyun durmaz), sekiz ceza düğmesi; karar verilince sonuç ekranı (halkın tepkisi); çip ve İlan Tahtası\'nda dava', panel && !panel.hidden && opts.length === 8 && kw.status === 'closed' && /Halk kararı/.test(resultText) && notice && chip >= 1 && Boolean(board), `${opts.join(',')} · ${resultText} · çip ${chip} · dur ${paused}`);
  E.emit('ui:openCase', { id: -5 });
  document.querySelector('.case-panel .modal-close')?.click();

  // ---- 14. kaydet → yükle: süren hizmet, yasak, açık dava, utanç
  const kOpen = fresh(a, b, 'hunger', 'apologize');
  const ks = fresh(b);
  court$.decide(ks, 'serviceHeavy');
  const kb = fresh(d4);
  court$.decide(kb, 'ban');
  sc.moodlets.apply(y, 'shamed', { reason: 'shamed_exile', whoName: 'X' });
  const shamedId = y.id; // sürgünden kalan eşin Mahcup'u
  const beforeJ = JSON.stringify(st.justice);
  const sent = JSON.stringify([b.sentence, d4.sentence]);
  E.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  E.emit('ui:load');
  st = game.state;
  sc = game.scenes.current;
  const b2 = st.characters.find((q) => q.id === b.id);
  const d2 = st.characters.find((q) => q.id === d4.id);
  const k32 = st.characters.find((q) => q.id === shamedId);
  const afterJ = JSON.stringify(st.justice);
  let diffAt = -1;
  for (let i = 0; i < Math.max(afterJ.length, beforeJ.length); i++) if (afterJ[i] !== beforeJ[i]) { diffAt = i; break; }
  c('kaydet → yükle: dava (ifade dahil), hizmet saati, yasak ve Mahcup aynı; sürüm 41; boş ceza alanı yazılmaz', raw.version === 41 && afterJ === beforeJ && JSON.stringify([b2.sentence, d2.sentence]) === sent && Mo.getMoodlet(k32, 'shamed') && st.justice.cases.some((q) => q.id === kOpen.id && q.statement) && raw.characters.filter((q) => !q.sentence).length > 0 && raw.characters.every((q) => !('sentence' in q) || q.sentence), `${afterJ === beforeJ} ${diffAt >= 0 ? beforeJ.slice(diffAt - 60, diffAt + 40) + ' ||| ' + afterJ.slice(diffAt - 60, diffAt + 40) : ''} ${JSON.stringify([b2.sentence, d2.sentence]) === sent} ${Boolean(Mo.getMoodlet(k32, 'shamed'))}`);

  // ---- 15. şalter kapalı: 32.1 davranışı
  ENGINES.court = false;
  const a3 = st.characters.find((q) => q.id === a.id);
  calm(a3);
  sc.crime.dice = fixed(0);
  const off1 = sc.crime.commit(a3, { crime: { crime: 'pantryRation', variant: 'ration', buildingId: st.buildings.find((q) => q.type === 'storage').id, motive: 'hunger' } }, st.buildings.find((q) => q.type === 'storage'));
  const tt = st.totalMinutes;
  setMinutes(st, off1.deadline);
  sc.crime.closeDue();
  setMinutes(st, tt);
  const block = sc.construction.globalBlock('courthouse');
  c('ENGINES.court kapalı: courtOf null, dava 1 günde Muhtar uyarısıyla kapanır, ifade yok, cezasızlık 1, saray kurulamaz', J.courtOf(st) === null && off1.verdict?.by === 'elder' && !off1.court && !off1.statement && J.impunityFactor(st) === 1 && /kapalı/.test(block ?? ''), block);
  ENGINES.court = true;
  ENGINES.justice = false;
  c('justice kapalıyken court da etkisiz (engineOn court false)', !(await import('/src/systems/Engines.js')).engineOn('court') && J.courtOf(st) === null);
  ENGINES.justice = true;
  return out;
})));
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
