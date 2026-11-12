// Aşama 29.6: Vefa ve Husumet — sadakat, isyan elebaşı, vergi ve terk ediş, yangın minneti, yağma kırgınlığı, anının kişisi.
// Çalıştır: node tools/sim/tests/29.6-loyalty.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 29.6
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();
const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const L = await import('/src/data/loyalty.js');
  const LO = await import('/src/systems/Loyalty.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { hasTag, addTag } = await import('/src/systems/Chemistry.js');
  const { REVOLT } = await import('/src/data/citizens.js');
  const { happinessOf } = await import('/src/systems/TownStatus.js');
  const { EMOTION_RULES } = await import('/src/data/chemistry.js');
  sim.give({ wood: 999, stone: 999, food: 999, gold: 999 });
  sim.step(225 * 3);
  const scene = game.scenes.current;
  const s = game.state;
  const adults = () => s.characters.filter((c) => !c.isChild && !c.role && !c.away);
  const zero = () => { for (const c of s.characters) c.loyalty = 0; };
  const [a, b, c3, d4] = adults();
  const S = L.LOYALTY_SOURCES;

  // 1. kaynak tablosu
  const rows = [];
  const row = (name, fn, who, want) => { zero(); fn(); rows.push([name, who.loyalty === want, who.loyalty]); };
  row('dilek karşılandı +15', () => scene.loyalty.onPetition(a, 'fulfilled'), a, S.petitionFulfilled);
  row('dilek reddedildi -15', () => scene.loyalty.onPetition(a, 'rejected'), a, S.petitionRejected);
  row('dilek süresi doldu -8', () => scene.loyalty.onPetition(a, 'expired'), a, S.petitionExpired);
  for (const c of s.characters) c.needs.hunger = 90;
  s.trust.relief = {};
  b.needs.hunger = 10;
  row('erzak dağıtımı +4', () => scene.trust.relief('food'), a, S.relief);
  rows.push(['erzak dağıtımı, aç olana +8', b.loyalty === S.reliefHungry, b.loyalty]);
  for (const rate of ['exempt', 'low', 'standard', 'heavy']) row(`vergi tahsilatı ${rate} ${S.taxCollected[rate]}`, () => { s.tax.rate = rate; scene.tax.collect(); }, a, S.taxCollected[rate]);
  row('Ağır Vergi\'ye geçiş -6', () => { s.tax.rate = 'standard'; s.tax.lockedUntil = 0; scene.tax.setRate('heavy'); }, a, S.taxRaisedToHeavy);
  s.tax.rate = 'standard'; s.tax.lockedUntil = 0;
  row('seferberlik yorgunluğu -3', () => game.events.emit('crisis:musterFatigue', { building: { name: 'Test', emergencyMuster: true }, helpers: [a.id] }), a, S.musterFatigue);
  row('ziyafet ikramı +2', () => game.events.emit('feast:served', { character: a, tier: 'plain' }), a, S.feastServed);
  a.moodlets = a.moodlets.filter((m) => m.key !== 'neglected');
  row('Sesimiz Duyulmadı -5', () => scene.moodlets.apply(a, 'neglected', { reason: 'neglect_rejected' }), a, S.neglected);
  const home = s.buildings.find((x) => x.id === a.homeId);
  row('evi yandı -6', () => game.events.emit('crisis:burnedDown', { building: home }), a, S.homeBurned);
  check('sadakat kaynakları (dilekçe, dağıtım, vergi, seferberlik, ziyafet, ihmal, yangın) tablo değerleri', rows.every((r) => r[1]), JSON.stringify(rows.filter((r) => !r[1])));

  // 2. Kırgın'ın dileği
  zero(); a.loyalty = -50;
  scene.loyalty.onPetition(a, 'fulfilled');
  check('Kırgın sakinin dileği karşılanınca kazanç iki kat (+30)', a.loyalty === -20, String(a.loyalty));

  // 3. kırpma ve kayma
  zero();
  scene.loyalty.adjust(a, 500, 'test');
  scene.loyalty.adjust(b, -500, 'test');
  const clampOk = a.loyalty === 100 && b.loyalty === -100;
  c3.loyalty = 1; d4.loyalty = -3;
  scene.loyalty.drift();
  check('sadakat -100..+100 kırpılır, gün dönümünde 0\'a 1 yaklaşır', clampOk && a.loyalty === 99 && b.loyalty === -99 && c3.loyalty === 0 && d4.loyalty === -2, `${a.loyalty} ${b.loyalty} ${c3.loyalty} ${d4.loyalty}`);
  const kids = s.characters.filter((c) => c.isChild);
  if (kids[0]) scene.loyalty.adjust(kids[0], 20, 'test');
  check('çocukta ve kapsam dışında sadakat değişmez', !kids[0] || kids[0].loyalty === 0);

  // 4. eşik olayı
  zero();
  const seen = [];
  const off = game.events.on('loyalty:changed', (p) => seen.push(`${p.from}>${p.to}`));
  scene.loyalty.adjust(a, 30, 't'); scene.loyalty.adjust(a, 15, 't'); scene.loyalty.adjust(a, -10, 't'); scene.loyalty.adjust(a, -80, 't');
  off();
  check('loyalty:changed yalnızca Sadık / Kırgın eşiği geçilince', seen.join() === '30>45,45>35,35>-45', seen.join());

  // 5. isyancı sıralaması ve elebaşı
  zero();
  for (const c of adults()) { c.needs.fun = 30; c.needs.social = 30; c.needs.hunger = 30; c.needs.energy = 30; }
  const ranked0 = scene.trust.pickRioters();
  const happiest = adults().filter((c) => !ranked0.includes(c.id))[0] ?? adults().at(-1);
  happiest.loyalty = -100;
  const ranked1 = scene.trust.pickRioters();
  const keyOf = (c) => happinessOf(c) + c.loyalty * L.LOYALTY.riotWeight;
  const sortedOk = ranked1.every((id, i) => i === 0 || keyOf(s.characters.find((x) => x.id === ranked1[i - 1])) <= keyOf(s.characters.find((x) => x.id === id)));
  check('isyancı sıralaması: mutluluk + sadakat x 0,3 (Kırgın öne geçer)', ranked1[0] === happiest.id && sortedOk, `${ranked1.join(',')} / önce ${ranked0.join(',')}`);
  s.trust.revolt = null;
  const r = scene.trust.startRevolt();
  const lowest = r && [...r.rioters].sort((x, y) => s.characters.find((c) => c.id === x).loyalty - s.characters.find((c) => c.id === y).loyalty || x - y)[0];
  const journalOk = s.journal?.some?.((j) => j.text?.includes('elebaşı')) ?? true;
  check('isyan başlarken en düşük sadakatli isyancı elebaşıdır (kayıtta, günlükte adı)', r && r.leaderId === lowest && r.leaderId === happiest.id && journalOk, `${r?.leaderId} / ${lowest}`);

  // 6. yardımla yatışma
  zero();
  for (const c of s.characters) c.needs.hunger = 90;
  s.trust.relief = {};
  s.trust.value = REVOLT.endTrust - 1;
  s.town.welfare = 60;
  s.resources.gold = 9999;
  const rioters = [...s.trust.revolt.rioters];
  const leader = s.trust.revolt.leaderId;
  const other = rioters.find((id) => id !== leader);
  const bystander = adults().find((c) => !rioters.includes(c.id));
  scene.trust.relief('gold');
  const L1 = (id) => s.characters.find((c) => c.id === id)?.loyalty;
  check('isyan yardımla yatışınca elebaşı +10, isyancı +5 (dağıtımın +4\'üne ek)', !s.trust.revolt && L1(leader) === 14 && L1(other) === 9 && (!bystander || bystander.loyalty === 4), `${L1(leader)} ${L1(other)} ${bystander?.loyalty}`);
  zero();
  s.trust.revolt = null; scene.trust.startRevolt();
  const rr = [...(s.trust.revolt?.rioters ?? [])];
  s.trust.value = 80; s.town.welfare = 80;
  scene.trust.hourly();
  check('kendiliğinden biten isyanda yatışma puanı yok', !s.trust.revolt && rr.every((id) => L1(id) === 0));

  // 7. vergi keyif çarpanı, altın aynı
  zero();
  const trio = [a, b, c3];
  const prep = () => { for (const c of s.characters) { if (!c.isChild && !c.role) { c.coins = 60; c.needs.fun = 60; } } };
  s.tax.rate = 'heavy';
  prep(); const g0 = s.resources.gold; scene.tax.collect(); const gold0 = s.resources.gold - g0;
  a.loyalty = 50; b.loyalty = 0; c3.loyalty = -50;
  prep(); const g1 = s.resources.gold; scene.tax.collect(); const gold1 = s.resources.gold - g1;
  const funs = trio.map((c) => 60 - c.needs.fun);
  s.tax.rate = 'standard';
  check('Ağır Vergi keyfi: Sadık x0,5, Kırgın x2; tahsil edilen altın aynı', funs.join() === '5,10,20' && gold0 === gold1 && gold0 > 0, `${funs.join()} · ${gold0}/${gold1}`);

  // 8. terk ediş sırası
  zero();
  for (const c of adults()) { c.needs.fun = 50; c.needs.social = 50; c.needs.hunger = 50; c.needs.energy = 50; c.newcomer = false; }
  const single = adults().filter((c) => !c.married);
  const saddest = single[0];
  saddest.needs.fun = 0;
  saddest.loyalty = 50;
  const bitter = single.find((c) => c !== saddest);
  bitter.loyalty = -100;
  const group = scene.desertion.leaveNext();
  for (const c of group ?? []) c.emigrating = null;
  check('terk ediş: Kırgın önce yola çıkar, Sadık başka aday varken seçilmez', group && group[0] === bitter && !group.includes(saddest), group?.map((c) => c.name).join());

  // 9. yangın minneti (en çok 3, kimlik sırası) ve anının kişisi
  const site = s.buildings.find((x) => x.functional && x.occupants?.size && s.characters.some((c) => c.homeId === x.id));
  const owner = s.characters.find((c) => c.homeId === site.id && !c.role);
  const helpers = adults().filter((c) => c !== owner && c.homeId !== site.id).map((c) => c.id).sort((x, y) => x - y).slice(0, 5);
  for (const id of helpers) { if (owner.relationships?.[id]) owner.relationships[id].tags = []; }
  game.events.emit('crisis:fireOut', { building: site, helpers: [...helpers].reverse(), byPlayer: false });
  const thanked = helpers.filter((id) => hasTag(owner, id, 'grateful'));
  const mem = owner.memories.find((m) => m.whoId === helpers[0] && m.text.includes('yangında'));
  check('yangın: sakin en çok 3 söndürene (kimlik sırasıyla) minnettar; anı "{who} yangında evini kurtardı" whoId ile', thanked.join() === helpers.slice(0, 3).join() && Boolean(mem) && mem.text.includes('evini'), `${thanked.join()} · ${mem?.text}`);

  // 10. yağma kırgınlığı
  const store = s.buildings.find((x) => x.functional && x.type === 'storage') ?? sim.place('storage') ?? s.buildings.find((x) => x.functional && x.id !== a.homeId);
  const victim = adults().find((c) => c !== a);
  victim.workplaceId = store.id;
  game.events.emit('riot:looted', { character: a, building: store, goods: {}, gold: 0 });
  victim.workplaceId = null;
  const vm = victim.memories.find((m) => m.whoId === a.id && m.text.includes('yağmaladı'));
  check('yağma: yapının çalışanı yağmacıya kırgın, anı whoId ile', hasTag(victim, a.id, 'resentful') && Boolean(vm) && vm.fond === false, vm?.text);

  // 11. minnettar olunanın şantiyesi
  const jobs = scene.jobs;
  const sites = [];
  for (let i = 0; i < 2; i++) { const x = sim.place('cabin', { instant: false }); if (x) sites.push(x); }
  const buildJobs = sites.map((x) => jobs.jobs.find((j) => j.buildingId === x.id)).filter(Boolean);
  let siteOk = false; let siteDetail = 'şantiye kurulamadı';
  if (buildJobs.length === 2) {
    for (const bb of scene.world.getCompleted()) bb.idle = true;
    const keep = new Set(buildJobs);
    for (const j of [...jobs.jobs]) if (!keep.has(j)) jobs.jobs.splice(jobs.jobs.indexOf(j), 1);
    const me = adults().find((c) => c !== a && c !== b);
    me.task = null; me.skills = {}; me.profile.skillPreference = {}; me.workplaceId = null;
    for (const j of buildJobs) j.assignees = [];
    const origin = { x: me.tileX, y: me.tileY };
    const base = jobs.findWorkFor(me, origin)?.job;
    const far = buildJobs.find((j) => j !== base);
    far.assignees = [b.id];
    me.relationships ??= {};
    addTag(me, b.id, 'grateful', s.totalMinutes);
    const spotD = (j) => Math.min(...jobs.spotsFor(j).map((sp) => Math.hypot(sp.x - origin.x, sp.y - origin.y)));
    const gap = spotD(far) - spotD(base);
    const pick = jobs.findWorkFor(me, origin)?.job;
    siteOk = !base || gap > EMOTION_RULES.helpTiles + 8 ? true : pick === far;
    siteDetail = `fark ${gap.toFixed(1)} karo, seçilen ${pick === far ? 'minnettar olunanın şantiyesi' : 'yakın şantiye'}`;
    for (const bb of scene.world.getCompleted()) bb.idle = false;
    for (const j of buildJobs) j.assignees = [];
  }
  check('minnettar olduğu kişinin çalıştığı şantiye (eşit öncelik) tercih edilir', siteOk, siteDetail);

  // 12. whoId'li anılar: teselli, düğün
  const [p1, p2] = adults().filter((c) => !c.married && c.partnerId === null).slice(0, 2);
  scene.moodlets.apply(p2, 'mourning', { reason: 'mourn_kindred', tier: 'major', whoId: 999, whoName: 'X' });
  scene.moodlets.console(p1, p2);
  game.events.emit('relationship:married', { a: p1, b: p2, venue: null, festival: false });
  const consoled = p2.memories.find((m) => m.text.includes('teselli etti') && m.whoId === p1.id);
  const wed = p1.memories.find((m) => m.kind === 'wedding' && m.whoId === p2.id);
  check('teselli ve düğün anıları kişinin kimliğiyle (whoId) yazılır', Boolean(consoled) && Boolean(wed), `${consoled?.text} · ${wed?.text}`);

  // 13. hatırlama -> seek / avoid ve süre dolumu
  const rc = adults().find((c) => c !== b);
  rc.recall = null;
  const saved = rc.memories.map((m) => m.fond);
  for (const m of rc.memories) m.fond = false;
  rc.memories.push({ day: 1, hour: 8, text: `${b.name} ile test anısı`, icon: 'heart', kind: 'love', fond: true, whoId: b.id });
  scene.memories.recall(rc);
  const seekOk = rc.drive.seekIds.includes(b.id) && rc.recall?.whoUntil === s.totalMinutes + L.DEBT_RULES.recallMinutes;
  rc.recall.whoUntil = s.totalMinutes - 1;
  game.events.emit('time:hour', s.time.hour);
  const expired = !rc.drive.seekIds.includes(b.id);
  rc.recall = { at: s.totalMinutes, until: s.totalMinutes + 90, text: 'x' };
  game.events.emit('memory:recalled', { character: rc, memory: { text: 'x', whoId: b.id, fond: false } });
  const avoidOk = rc.drive.avoidIds.includes(b.id) && !rc.drive.seekIds.includes(b.id);
  rc.memories.pop(); rc.memories.forEach((m, i) => (m.fond = saved[i]));
  rc.recall = null; game.events.emit('time:hour', s.time.hour);
  check('hatırlanan anının kişisi aranır (güzel) / kaçınılır, 240 dk sonra silinir', seekOk && expired && avoidOk, `${seekOk} ${expired} ${avoidOk}`);

  // 14. şalter kapalı: eski davranış
  zero();
  ENGINES.loyalty = false;
  scene.loyalty.onPetition(a, 'fulfilled');
  a.loyalty = -100;
  const offRank = scene.trust.pickRioters();
  const plain = adults().filter((c) => !c.away).map((c) => ({ c, h: happinessOf(c) })).sort((x, y) => x.h - y.h || x.c.id - y.c.id).map((x) => x.c.id);
  const fireOwner = owner;
  for (const id of helpers) if (fireOwner.relationships?.[id]) fireOwner.relationships[id].tags = [];
  const memCount = fireOwner.memories.length;
  const site2 = s.buildings.find((x) => x.id === fireOwner.homeId) ?? site;
  game.events.emit('crisis:fireOut', { building: site2, helpers: helpers.filter((id) => id !== fireOwner.id), byPlayer: false });
  const allThanked = helpers.filter((id) => id !== fireOwner.id && s.characters.find((c) => c.id === id)?.homeId !== fireOwner.homeId).every((id) => hasTag(fireOwner, id, 'grateful'));
  b.loyalty = 50; b.coins = 60; b.needs.fun = 60; s.tax.rate = 'heavy'; scene.tax.collect(); s.tax.rate = 'standard';
  ENGINES.loyalty = true;
  check('ENGINES.loyalty=false: sadakat değişmez, sıralama yalnızca mutluluk, yangında herkese minnet ve anı yok, vergi keyfi x1', a.loyalty === -100 && offRank.every((id, i) => plain.indexOf(id) <= plain.indexOf(offRank[i + 1] ?? id)) && allThanked && fireOwner.memories.length === memCount && b.needs.fun === 50, `${a.loyalty} · ${allThanked} ${helpers.map((id) => hasTag(fireOwner, id, 'grateful') ? 1 : 0).join('')} ${helpers.join(',')} · ${b.needs.fun} · ${offRank.join(',')} / ${plain.join(',')}`);

  // 15. sızıntı: sadakat kancaları üreteçlere dokunmaz
  const rngs = Object.entries(scene).filter(([, v]) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number' && v !== scene.moodlets && v !== scene.rites).map(([, v]) => v.rng);
  const before = JSON.stringify(rngs.map((x) => x.state));
  let calls = 0; const realRandom = Math.random; Math.random = () => { calls++; return realRandom(); };
  scene.loyalty.drift(); scene.loyalty.adjust(a, 7, 't'); game.events.emit('feast:served', { character: a, tier: 'plain' });
  game.events.emit('riot:looted', { character: a, building: store, goods: {}, gold: 0 });
  Math.random = realRandom;
  check('sadakat ve husumet kancaları: üreteçler ve Math.random aynı', rngs.length > 5 && before === JSON.stringify(rngs.map((x) => x.state)) && calls === 0, `${rngs.length} üreteç, ${calls}`);
  check('saf yardımcılar: kademe, kayma, vergi çarpanı', LO.loyaltyTier(40) === 'loyal' && LO.loyaltyTier(-40) === 'bitter' && LO.loyaltyTier(39) === null && LO.driftLoyalty(-1) === 0 && LO.taxJoyMul({ loyalty: 50 }) === 0.5 && LO.taxJoyMul({ loyalty: -50 }) === 2 && LO.clampLoyalty('x') === 0);
  return out;
});
results.push(...out);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
