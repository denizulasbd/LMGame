// Aşama 32.1 testleri: Suç Motoru (aday, risk, motivasyon, miktar, aktarım, tanık / bekçi, dava, Muhtar uyarısı, temizlik, kayıt,
// determinizm, Brain kancası, hikâye kartı). Kullanım: node tools/sim/tests/32.1-crime.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.1
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
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { CONFIG } = await import('/src/config.js');
  const { Random } = await import('/src/utils/random.js');
  const Ci = await import('/src/systems/Citizens.js');
  const { sim } = window;
  const st = game.state;
  const sc = game.scenes.current;
  const E = game.events;
  const T = CONFIG.TILE_SIZE;
  sim.give({ wood: 900, stone: 900, food: 300, gold: 3000, iron: 200 });
  st.town.tier = 3;
  st.time.day = 8;
  const storage = sim.place('storage');
  const inn = sim.place('inn');
  const market = sim.place('market');
  const tower = sim.place('guardTower');
  const bench = sim.place('bench');
  const adults = () => st.characters.filter((x) => !x.role && !x.isChild && J.crimeCandidate(st, x));
  const [a, b, k] = adults();
  const at = (ch, x, y) => { ch.x = x * T + T / 2; ch.y = y * T + T / 2; ch.visible = true; ch.insideBuildingId = null; if (ch.task?.activity === 'sleep') ch.task = null; };
  // state.totalMinutes saatten türer: dakikayı ilerletmek için saati kur
  const setMinutes = (s, t) => { s.time.day = Math.floor(t / 1440) + 1; s.time.hour = Math.floor((t % 1440) / 60); s.time.minute = t % 60; };
  const far = (ch) => at(ch, 1, 1);
  const calm = (ch) => { ch.task = null; ch.newcomer = false; ch.relocating = false; ch.coins = 40; ch.needs.hunger = 90; ch.loyalty = 0; ch.traits = []; ch.quirk = null; ch.moodlets = []; ch.mood.grief = false; ch.illness = null; ch.isInjured = false; };
  for (const x of st.characters) calm(x);

  // ---- 1. veri
  c('veri: şalter açık, tohum + 42 izole (35-41 dolu), altı suç türü, ağırlıklar 1-5, moodlet sayısı 33', ENGINES.justice === true && D.JUSTICE_SEED_OFFSET === 42 && D.CRIME_KEYS.join() === 'innPilfer,marketFruit,pantryRation,woodpile,pursePinch,pettyVandal' && D.CRIME_KEYS.every((key) => D.CRIMES[key].severity.every((v) => v >= 1 && v <= 5)) && MD.MOODLET_KEYS.length === 33 && CONFIG.SAVE_VERSION === 41);

  // ---- 2. adaylar
  const elder = { ...a, lifeStage: 'elder', isChild: false };
  const child = { ...a, lifeStage: 'child', isChild: true };
  const youth = Object.assign(Object.create(Object.getPrototypeOf(a)), a, { lifeStage: 'youth' });
  const visitor = { ...a, role: 'guest' };
  const away = { ...a, away: { stage: 'away' } };
  const sick = { ...a, illness: { kind: 'cold' } };
  const mourning = { ...a, mood: { ...a.mood, grief: true } };
  c('aday: Genç ve Yetişkin evet; çocuk, Kıdemli Bilge, rollü, seferdeki, hasta, yastaki hayır', J.crimeCandidate(st, a) && J.crimeCandidate(st, youth) && ![elder, child, visitor, away, sick, mourning].some((x) => J.crimeCandidate(st, x)) && J.crimeRisk(st, child) === 0 && J.crimeRisk(st, elder) === 0);
  a.task = { activity: 'patrol' };
  const patrolReady = J.crimeReady(st, a, 14);
  a.task = null;
  st.trust.revolt = { rioters: [a.id], raids: [] };
  const riotDay = J.crimeReady(st, a, 14);
  const riotNight = J.crimeReady(st, a, 21);
  const otherDay = J.crimeReady(st, b, 14);
  st.trust.revolt = null;
  c('isyancı isyan saatinde (08-20) suç işlemez, gece ve öteki sakinler işleyebilir; nöbetteki bekçi işlemez', !riotDay && riotNight && otherDay && !patrolReady);
  a.loyalty = -60; b.loyalty = -60;
  const strike = !J.crimeReady(st, a, 10) && J.crimeReady(st, a, 13);
  a.loyalty = 0; b.loyalty = 0;
  c('iş bırakma saatindeki Kırgın sakin (10-12) suç işlemez', strike);

  // ---- 3. risk monoton
  const risk = (mut) => { calm(a); mut(a); const r = J.crimeRisk(st, a); calm(a); return r; };
  const pov = [100, 20, 8, 2].map((v) => risk((x) => (x.coins = v)));
  const hun = [90, 40, 10].map((v) => risk((x) => (x.needs.hunger = v)));
  const loy = [60, 30, 0, -30, -60].map((v) => risk((x) => (x.loyalty = v)));
  const inc = (arr) => arr.every((v, i) => i === 0 || v > arr[i - 1]);
  c('risk yoksullukla, açlıkla ve sadakat düştükçe monoton artar', inc(pov) && inc(hun) && inc(loy), `${pov.map((v) => v.toFixed(4))} | ${hun.map((v) => v.toFixed(4))} | ${loy.map((v) => v.toFixed(4))}`);
  const f = J.riskFactors(st, a);
  c('eğitim / kulüp / cezasızlık çarpanları bu adımda 1 (imzalar hazır)', f.education === 1 && f.club === 1 && f.impunity === 1 && J.educationFactor(a) === 1 && J.clubFactor(a) === 1 && J.impunityFactor(st) === 1);
  const mot = (mut) => { calm(a); mut(a); const m = J.motiveOf(a, J.riskFactors(st, a)); calm(a); return m; };
  c('motivasyon baskın çarpandan: aç → hunger, meteliksiz → poverty, Kırgın → grudge, hiçbiri → temptation', mot((x) => (x.needs.hunger = 10)) === 'hunger' && mot((x) => (x.coins = 2)) === 'poverty' && mot((x) => (x.loyalty = -60)) === 'grudge' && mot(() => {}) === 'temptation');
  const kurul = st.trust.value;
  st.trust.value = 20;
  const lowTrust = J.crimeRisk(st, a);
  st.trust.value = kurul;
  c('Yönetim Güveni düşükse risk artar; Huysuz kişilik haylazlığa eğilimli', lowTrust > J.crimeRisk(st, a) && (() => { a.traits = ['grumpy']; const o = J.crimeOptions(st, a, 'mischief'); a.traits = []; const o2 = J.crimeOptions(st, a, 'mischief'); const w = (l) => l.filter(([x]) => x.crime === 'pettyVandal').reduce((s, [, v]) => s + v, 0); return w(o) > w(o2); })());

  // ---- 4. motor kapısı ve yuvalar
  const tier = st.town.tier;
  st.town.tier = 1;
  const mezra = J.justiceActive(st);
  st.town.tier = tier;
  st.time.day = 4;
  const early = J.justiceActive(st);
  st.time.day = 8;
  c('Mezra\'da ve ilk 5 günde suç yok; günde en çok 1 yuva (20 sakini aşınca 2)', !mezra && !early && J.justiceActive(st) && J.slotsFor(st) === (st.characters.filter((x) => !x.role).length > 20 ? 2 : 1) && J.slotsFor({ characters: Array.from({ length: 21 }, () => ({})) }) === 2);

  // ---- 5. miktarlar
  st.resources.food = 300;
  const p0 = { crime: 'pantryRation', variant: 'ration', buildingId: storage.id };
  const amt300 = J.crimeAmount(st, a, p0, 0.5).amount;
  st.resources.food = 100;
  const amt100 = J.crimeAmount(st, a, p0, 0.5).amount;
  st.resources.food = 300;
  const pulse = st.pulse;
  st.pulse = { daily: [], reasons: [], eaten: [5000] };
  const famine = J.isFamine(st);
  const amtFamine = J.crimeAmount(st, a, p0, 0.5).amount;
  st.pulse = pulse;
  b.coins = 200;
  const pinch = J.crimeAmount(st, a, { crime: 'pursePinch', variant: 'coins', victimId: b.id }, 0.99, { victim: b }).amount;
  b.coins = 20;
  const pinchSmall = J.crimeAmount(st, a, { crime: 'pursePinch', variant: 'coins', victimId: b.id }, 0.99, { victim: b }).amount;
  c('miktar: stoğun ~%2\'si (en çok 6 erzak), kıtlıkta yarıya iner; kese en çok 10 altın ve kurbanın %25\'i', amt300 === 6 && amt100 === 2 && famine && amtFamine === 3 && pinch === 10 && pinchSmall === 5, `${amt300}/${amt100}/${amtFamine} · ${pinch}/${pinchSmall}`);
  const inv = a.inventory;
  a.inventory = [{ kind: 'herb', qty: 3 }, { kind: 'herb', qty: 3 }, { kind: 'herb', qty: 3 }, { kind: 'herb', qty: 3 }];
  a.equipment = { ...(a.equipment ?? {}), bag: null };
  const full = J.crimeOptions(st, a, 'hunger').filter(([o]) => o.crime !== 'pursePinch');
  a.inventory = inv;
  c('çanta doluysa eşya suçu seçilmez', full.length === 0 && J.crimeOptions(st, a, 'hunger').some(([o]) => o.crime === 'pantryRation'), full.map(([o]) => o.crime).join());

  // ---- 6. yakalanma olasılığı
  const tx = tower.tileX;
  const ty = tower.tileY + 3;
  for (const x of st.characters) far(x);
  at(a, tx, ty);
  const g = st.characters.find((x) => x !== a && !x.role && !x.isChild);
  tower.workerIds.add(g.id);
  g.task = { activity: 'patrol' };
  at(g, tower.tileX, tower.tileY + 1);
  const withGuard = J.catchChance(st, a, { x: tx, y: ty }, { hour: 14 });
  g.task = null;
  far(g);
  const noGuard = J.catchChance(st, a, { x: tx, y: ty }, { hour: 14 });
  at(k, tx + 2, ty);
  const witness = J.catchChance(st, a, { x: tx, y: ty }, { hour: 14 });
  const night = J.catchChance(st, a, { x: tx, y: ty }, { hour: 23 });
  far(k);
  c('nöbetteki bekçi (kule menzilinde) ve yakındaki sakin yakalanmayı artırır, gece ve tenha yer düşürür', withGuard.p > witness.p && witness.p > noGuard.p && night.p < witness.p && noGuard.secluded && withGuard.witnesses.some((w) => w.guard && w.id === g.id), `bekçi ${withGuard.p.toFixed(2)} · tanık ${witness.p.toFixed(2)} · gece ${night.p.toFixed(2)} · tenha ${noGuard.p.toFixed(2)}`);

  // ---- 7. aktarım ve dava (zarı sabitleyen sahte üreteç: 0,99 → yakalanmaz, 0,0 → yakalanır)
  const real = sc.crime.dice;
  const fixed = (v) => Object.assign(new Random(1), { next: () => v });
  const recorded = [];
  const cards = [];
  const offR = E.on('crime:recorded', (p) => recorded.push(p));
  const offU = E.on('crime:unsolved', (p) => cards.push(['u', p]));
  const offC = E.on('crime:caught', (p) => cards.push(['c', p]));
  st.justice = null;
  const food0 = st.resources.food;
  const ration0 = Ci.countItem(a, 'ration');
  sc.crime.dice = fixed(0.99);
  const journal0 = st.journal.length;
  const k1 = sc.crime.commit(a, { crime: { ...p0, motive: 'hunger' } }, storage);
  const took = k1?.stolen?.amount ?? 0;
  c('çalınan mal yok olmaz: stok aynı miktarda düşer, suçlunun çantasına geçer', took > 0 && food0 - st.resources.food === took && Ci.countItem(a, 'ration') - ration0 === took, `${took} erzak, stok ${food0} → ${st.resources.food}`);
  c('yakalanmayan suç unsolved sayılır, kayıp kartı ("kimse bir şey görmedi") ve günlük satırı çıkar', k1?.unsolved && k1.status === 'closed' && st.justice.stats.unsolved === 1 && st.justice.log.includes(k1) && cards.some(([t, p]) => t === 'u' && /kimse bir şey görmedi/.test(p.text)) && st.journal.length > journal0, cards.map(([, p]) => p.text).join(' | '));
  const vCoins = 100;
  b.coins = vCoins;
  const aCoins = a.coins;
  sc.crime.dice = fixed(0);
  at(a, 5, 5); at(b, 6, 5);
  const rel0 = sc.relationships.get(a, b);
  const k2 = sc.crime.commit(a, { crime: { crime: 'pursePinch', variant: 'coins', victimId: b.id, motive: 'poverty' } }, null);
  c('kese hafifletme: kurbanın kesesinden düşen altın suçlunun kesesine geçer (en çok 10)', k2 && k2.stolen.coins && vCoins - b.coins === a.coins - aCoins && a.coins - aCoins === k2.stolen.amount && k2.stolen.amount <= 10, `${k2?.stolen?.amount}`);
  c('yakalanan dava açık kalır: şema alanları (motivasyon, bağlam, pişmanlık, son gün, tanık) dolu', k2?.status === 'open' && st.justice.cases.includes(k2) && k2.victimId === b.id && D.REMORSE.keys.includes(k2.remorse) && k2.context.ageStage === a.lifeStage && Number.isFinite(k2.context.coins) && k2.deadline === k2.minute + D.JUSTICE.closeAfterMinutes && k2.verdict === null && k2.witnessName === b.name, JSON.stringify(k2?.context));
  c('anılar: suçlu ve kurban (kurbanın anısının kişisi suçlu); kurbanla küçük ilişki düşüşü', a.memories.some((m) => /yakalandı/.test(m.text)) && b.memories.some((m) => /kesesinden/.test(m.text) && m.whoId === a.id) && sc.relationships.get(a, b) < rel0 && sc.relationships.get(a, b) >= rel0 + D.VICTIM_RELATION - 0.01, `${rel0} → ${sc.relationships.get(a, b)}`);
  const caughtCard = cards.find(([t]) => t === 'c')?.[1];
  const card = caughtCard && SC.makeCard('crime:caught', caughtCard, { state: st });
  c('hikâye kartı: öncelik 3, suçlu ve tanık portresi, "Git" suçluya (tablo sürümü 7)', card && card.priority === 3 && card.ids[0] === a.id && card.ids.includes(b.id) && card.go?.id === a.id && SD.STORY_TABLE_VERSION === 7 && SD.STORY_PRIORITY['crime:unsolved'] === 3, card?.text);
  // Yalnızca önemli süzgecinde günde en çok bir suç kartı
  const dir = sc.storyDirector;
  st.settings.storyCards = 'important';
  dir.crimeCards = { day: -1, n: 0 };
  const mk = (id) => ({ ...SC.makeCard('crime:unsolved', { kase: { id }, text: `kayıp ${id}`, building: storage }, { state: st }), day: st.time.day });
  const first = dir.offer(mk(901));
  const second = dir.offer(mk(902));
  c('"Yalnızca önemli" süzgecinde günde en çok bir suç kartı (fazlası gün özetine)', first === true && second === false && dir.missed.some((x) => x.key === 'crime:902'));
  // kayıt ve sicil: Muhtar uyarısı
  const trust0 = st.trust.value;
  const loy0 = a.loyalty;
  const tNow = st.totalMinutes;
  setMinutes(st, k2.deadline - 1);
  sc.crime.closeDue();
  const stillOpen = k2.status === 'open';
  setMinutes(st, k2.deadline);
  sc.crime.closeDue();
  setMinutes(st, tNow);
  c('Adalet Sarayı yokken açık dava bir gün sonra Muhtar uyarısıyla kapanır; sicile yazılır; güven / sadakat değişmez', stillOpen && k2.status === 'closed' && k2.verdict?.kind === 'warning' && k2.verdict.by === 'elder' && k2.verdict.auto === true && st.justice.cases.length === 0 && st.justice.log.includes(k2) && st.justice.records[a.id]?.count === 1 && st.trust.value === trust0 && a.loyalty === loy0 && J.courtOf(st) === null);
  // ölçüler
  const pop = st.characters.filter((x) => !x.role).length;
  c('crimeRate: son 8 günde sakin başına suç; solvedRatio yakalanan / işlenen', Math.abs(J.crimeRate(st) - 2 / pop) < 1e-9 && J.solvedRatio(st) === 0.5 && J.crimeRate({ ...st, justice: null }) === 0, `${J.crimeRate(st).toFixed(3)} (${pop} sakin)`);

  // ---- 8. kaydet → yükle → aynı durum (geçici plan düşer)
  a.crimePlan = { crime: 'pantryRation', variant: 'ration', buildingId: storage.id, at: 0, until: 1e9, duration: 9, motive: 'hunger' };
  const k3 = sc.crime.commit(b, { crime: { ...p0, motive: 'temptation' } }, storage);
  const before = JSON.stringify(st.justice);
  E.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  E.emit('ui:load');
  const st2 = game.state;
  const sc2 = game.scenes.current;
  c('kaydet → yükle: state.justice aynı, kayıt sürümü 41, c.crimePlan kaydedilmez', raw.version === 41 && JSON.stringify(raw.justice) === before && JSON.stringify(st2.justice) === before && st2.characters.every((x) => x.crimePlan === undefined) && !raw.characters.some((x) => 'crimePlan' in x), `${k3?.id}`);

  // ---- 9. ayrılan / ölen suçlunun davası düşer, kopuk referans kalmaz
  const a2 = st2.characters.find((x) => x.id === a.id);
  const b2 = st2.characters.find((x) => x.id === b.id);
  sc2.crime.dice = fixed(0);
  const k4 = sc2.crime.commit(a2, { crime: { crime: 'pursePinch', variant: 'coins', victimId: b2.id, motive: 'grudge' } }, null);
  const openBefore = st2.justice.cases.filter((x) => x.offenderId === a2.id).length;
  sc2.desertion.depart(a2);
  const ids = new Set(st2.characters.map((x) => x.id));
  const dangling = [...st2.justice.cases, ...st2.justice.log].some((x) => [x.offenderId, x.victimId, x.witnessId].some((v) => v !== null && v !== undefined && !ids.has(v))) || Object.keys(st2.justice.records).some((key) => !ids.has(Number(key)));
  c('ayrılan suçlunun açık davası düşer; kapanmış davalarda ve sicilde kopuk kimlik kalmaz (ad kalır)', k4 && openBefore === 1 && !st2.justice.cases.some((x) => x.offenderId === a.id) && !dangling && st2.justice.log.some((x) => x.offenderName === a.name && x.offenderId === null), `${Boolean(k4)} ${openBefore} ${dangling}`);
  // vefat yolu: sakin başka bir yoldan silinse de saatlik temizlik
  const b3 = st2.characters.find((x) => x.id === b.id);
  const k5 = sc2.crime.commit(b3, { crime: { ...p0, motive: 'hunger' } }, st2.buildings.find((x) => x.id === storage.id));
  st2.characters.splice(st2.characters.indexOf(b3), 1);
  sc2.crime.prune();
  c('saatlik temizlik: başka yoldan silinen sakinin davası düşer', k5 && !st2.justice.cases.some((x) => x.offenderId === b.id) && st2.justice.log.every((x) => x.offenderId !== b.id && x.victimId !== b.id));
  st2.characters.push(b3);

  // ---- 10. Brain kancası: zar çekmez, pencere dışında yok
  const brain = sc2.behavior.brain;
  const z = st2.characters.find((x) => J.crimeCandidate(st2, x) && x.id !== b.id);
  calm(z);
  at(z, storage.tileX + 3, storage.tileY + 3);
  const now = st2.totalMinutes;
  z.crimePlan = { crime: 'pantryRation', variant: 'ration', buildingId: storage.id, at: now + 30, until: now + 300, duration: 9, motive: 'hunger' };
  const rngs = [brain.rng, brain.citizenRng, ...Object.values(sc2).filter((v) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number').map((v) => v.rng)];
  const r0 = JSON.stringify(rngs.map((r) => r.state));
  const early2 = brain.planCrime(z, 19);
  setMinutes(st2, now + 31);
  const plan = brain.planCrime(z, 19);
  setMinutes(st2, now);
  c('Brain.planCrime: zamanı gelmeden yok; gelince hedefin kapısına "pilfer" (süre plandan), plan tüketilir, hiçbir üreteç ilerlemez', early2 === null && plan?.activity === 'pilfer' && plan.buildingId === storage.id && plan.duration === 9 && z.crimePlan === undefined && JSON.stringify(rngs.map((r) => r.state)) === r0, `${early2?.activity} / ${plan?.activity} / ${z.name} ${J.crimeReady(st2, z, 19)}`);

  // ---- 11. uçtan uca: plan → yürüyüş → eylem → kayıt
  const n0 = st2.justice.stats.committed;
  st2.time.hour = 19;
  st2.time.minute = 0;
  const tStart = st2.totalMinutes;
  z.crimePlan = { crime: 'pantryRation', variant: 'ration', buildingId: storage.id, at: tStart, until: tStart + 600, duration: 9, motive: 'hunger' };
  z.task = null;
  let sawPilfer = false;
  for (let i = 0; i < 225 * 3 && st2.justice.stats.committed === n0; i++) {
    sim.step(1);
    if (z.task?.activity === 'pilfer') sawPilfer = true;
  }
  c('uçtan uca: sakin boş zamanında kilere yürür ("pilfer"), eylem bitince suç kaydedilir', sawPilfer && st2.justice.stats.committed === n0 + 1, `committed ${n0} → ${st2.justice.stats.committed} · görev ${z.task?.activity}`);

  // ---- 12. determinizm: aynı üreteç durumu ve aynı kasaba → aynı plan
  st2.trust.value = 10;
  for (const x of st2.characters) if (!x.role) { x.coins = 1; x.loyalty = -60; x.needs.hunger = 10; }
  const runPlan = (seed) => { sc2.crime.dice = new Random(seed); for (const x of st2.characters) delete x.crimePlan; const got = sc2.crime.planDay(); return JSON.stringify(got.map((x) => [x.id, x.crimePlan.crime, x.crimePlan.at, x.crimePlan.victimId ?? x.crimePlan.buildingId])); };
  const plans = [];
  for (let sd = 1; sd <= 30; sd++) plans.push(runPlan(st2.seed + 42 + sd));
  const again = [];
  for (let sd = 1; sd <= 30; sd++) again.push(runPlan(st2.seed + 42 + sd));
  const cand = st2.characters.filter((x) => J.crimeCandidate(st2, x));
  c('determinizm: aynı tohumla aynı suç planı (30 tohum); yoksul ve güvensiz kasabada planlar çıkar', plans.join() === again.join() && plans.filter((p) => p !== '[]').length >= 10, `${plans.filter((p) => p !== '[]').length}/30 dolu · aday ${cand.length} · risk ${cand.reduce((s, x) => s + J.crimeRisk(st2, x), 0).toFixed(3)} · etkin ${J.justiceActive(st2)}`);
  for (const x of st2.characters) delete x.crimePlan;
  sc2.crime.dice = real;

  // ---- 13. şalter kapalı: state.justice yazılmaz
  const s3 = st2;
  s3.justice = null;
  ENGINES.justice = false;
  for (const x of s3.characters) if (!x.role) x.coins = 1;
  E.emit('time:hour', 8);
  const z2 = s3.characters.find((x) => J.crimeCandidate(s3, x));
  E.emit('crime:committed', { character: z2, task: { crime: { ...p0, motive: 'hunger' } }, building: s3.buildings.find((x) => x.id === storage.id) });
  const offPlans = s3.characters.filter((x) => x.crimePlan).length;
  E.emit('ui:save');
  const rawOff = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  ENGINES.justice = true;
  c('şalter kapalıyken plan yok, state.justice yazılmaz ve kayda girmez', s3.justice === null && offPlans === 0 && !('justice' in rawOff));

  offR(); offU(); offC();
  return out;
})));
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
