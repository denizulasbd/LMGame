// Aşama 30.4b testleri: orta oyun (sekiz yeni karar olayı, kişili olaylar, yeni etki türleri, tekrar kuralları, beş ara hedef).
// En çok 30 test. Kullanım: node tools/sim/tests/30.4b-midgame.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 30.4b
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  // (30.6) 30.4b'nin yazılı bedelleri Kasaba (x1) sayılarıdır: bedel ölçeği şalteri kapalı sınanır (ölçeğin kendisi 30.6 testlerinde)
  await g.page.evaluate(async () => { (await import('/src/systems/Engines.js')).ENGINES.novicePath = false; });
  return g;
};

// ---------------------------------------------------------------- Altyapı, etki türleri, tekrar kuralları, şalter
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const D = await import('/src/data/dilemmas.js');
    const M = await import('/src/systems/Midgame.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { pairKey } = await import('/src/systems/RelationshipSystem.js');
    const { hasTag } = await import('/src/systems/Chemistry.js');
    const { immigrationStatus } = await import('/src/systems/TownStatus.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    const d = sc.dilemmas;
    const dl = d.dilemma;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 2000, iron: 50, wool: 100, bread: 50 });
    sim.step(60);
    const adults = () => st.characters.filter((x) => !x.role && !x.isChild);
    const zero = () => { for (const x of st.characters) x.loyalty = 0; };
    const reset = () => { dl.active = null; dl.history = {}; dl.recent = []; dl.storm = null; dl.quarantineUntil = 0; dl.nextDay = 0; st.time.paused = false; };
    const NEW = D.DILEMMA_KEYS.filter((k) => D.DILEMMAS[k].midgame);
    for (const k of D.DILEMMA_KEYS) D.DILEMMAS[k].requires.minPopulation = 1;
    dl.nextDay = 0;
    const [a, b, k, e, f] = adults();
    for (const x of [b, k]) x.traits = []; // çelişen kişilikler ilişki kazancını yarıya indirir

    // ---- veri
    c('tablo: sekiz yeni kart (üç seçenek, tek varsayılan), toplam 13 olay, tekrar aralığı 6 → 8, son iki kart kuralı; hiçbir yeni seçenek bedelsiz ve her birinde yazılı bedel / etki', NEW.length === 8 && NEW.every((id) => D.DILEMMAS[id].options.length === 3 && D.DILEMMAS[id].options.filter((o) => o.default).length === 1 && D.DILEMMAS[id].options.every((o) => M.hasVisibleCost(o) && /Bedel: [^—]/.test(M.describeOption(o, { who: 'Ali', who2: 'Veli' })))) && D.DILEMMA_KEYS.length === 13 && D.MIDGAME.repeatGapDays === 8 && D.DILEMMA_SCHEDULE.repeatGapDays === 6 && D.MIDGAME.noRepeatLast === 2 && ENGINES.midgame === true, NEW.filter((id) => D.DILEMMAS[id].options.some((o) => !M.hasVisibleCost(o))).join());

    // ---- kişili olaylar: zar yok, hedef yoksa uygun değil
    for (const x of st.characters) x.skills = {};
    const draws = () => Object.values(sc).filter((s) => s?.rng && typeof s.rng.state === 'number').map((s) => s.rng.state).join();
    st.time.day = 22;
    reset();
    const none = [d.eligible('masterOffer'), d.eligible('neighborFeud'), d.eligible('lostChild')];
    const before = draws();
    a.skills.crafting = 99999;
    const t1 = M.pickTargets(st, 'master');
    zero();
    st.relationships[pairKey(b.id, k.id)] = -20;
    const t2 = M.pickTargets(st, 'feud');
    const t3 = M.pickTargets(st, 'smallestChild');
    c('kişili olaylar: hedef kuralları zar çekmez (hiçbir üretecin durumu değişmez); usta, en kötü ilişkili çift (who = küçük kimlik); hedef yoksa olay uygun değil', draws() === before && t1?.who === a && t2?.who === b && t2?.who2 === k && t3 === null && none.every((x) => x === false), `${t1?.who?.id} ${t2?.who?.id}/${t2?.who2?.id} ${t3} ${none}`);

    // ---- yeni etki türleri
    const g0 = st.resources.gold;
    d.apply('x', { gold: 70, resources: { food: 60 } }, {});
    const lim = d.economy.limit('wood');
    st.resources.wood = lim - 5;
    d.apply('x', { resources: { wood: 40 } }, {});
    const w1 = st.resources.wood;
    st.resources.food = 20;
    d.apply('x', { resources: { food: -35 } }, {});
    c('gold ve resources: altın artar, depo sınırına saygı (taşma yok), eksi miktar stoğun altına inmez', st.resources.gold === g0 + 70 && w1 === lim && st.resources.food === 0, `${st.resources.gold - g0} ${w1}/${lim} ${st.resources.food}`);
    zero();
    st.relationships[pairKey(a.id, e.id)] = 50;
    st.relationships[pairKey(a.id, f.id)] = 50;
    const reasons = [];
    game.events.on('loyalty:delta', (p) => reasons.push(p.reason));
    d.apply('lostChild', { loyalty: { target: 15, friendsOfTarget: -4, parentsOfTarget: 12, all: 3 } }, { who: a, who2: null });
    const L1 = [a.loyalty, e.loyalty, f.loyalty, b.loyalty];
    zero();
    d.apply('bumperHarvest', { loyalty: { lowest: [2, 10] } }, {});
    const low = adults().filter((x) => x.loyalty === 10).length;
    zero();
    d.apply('x', { loyalty: { both: -5, target2: -12 } }, { who: b, who2: k });
    c('loyalty: all / target / friendsOfTarget / lowest / both / target2 LoyaltySystem üzerinden; neden olayın adı (dilemma:<id>)', L1.join() === '18,-1,-1,3' && low === 2 && b.loyalty === -5 && k.loyalty === -17 && reasons.includes('dilemma:lostChild') && reasons.includes('dilemma:bumperHarvest'), `${L1} ${low} ${b.loyalty}/${k.loyalty} ${[...new Set(reasons)]}`);
    st.trust.value = 50;
    for (const x of st.characters) { x.satisfaction = 50; x.needs.energy = 100; }
    st.crown.reputation = 50;
    d.apply('x', { trust: -10, satisfaction: { all: 3 }, energy: -20, reputation: 8 }, {});
    d.apply('x', { satisfaction: { target: -5 } }, { who: a, who2: null });
    c('trust, satisfaction (all / target), energy (herkes), reputation: değerler değişir', st.trust.value === 40 && b.satisfaction === 53 && a.satisfaction === 48 && b.needs.energy === 80 && st.crown.reputation === 58, `${st.trust.value} ${a.satisfaction}/${b.satisfaction} ${b.needs.energy} ${st.crown.reputation}`);
    const r0 = sc.relationships.get(b, k);
    d.apply('x', { relation: { pair: 10 }, tag: { from: 'target2', to: 'target', tag: 'resentful' }, moodlet: { who: 'both', key: 'comforted', reason: 'deneme' } }, { who: b, who2: k });
    c('relation (çift puanı), tag (ChemistrySystem: who2 → who kırgın), moodlet (mevcut anahtar) uygulanır', sc.relationships.get(b, k) === r0 + 10 && hasTag(k, b.id, 'resentful') && b.moodlets.some((m) => m.key === 'comforted') && k.moodlets.some((m) => m.key === 'comforted'), `${r0}→${sc.relationships.get(b, k)}`);
    for (const x of st.characters) { x.illness = null; x.needs.energy = 90; }
    f.needs.energy = 10; e.needs.energy = 20; a.needs.energy = 30;
    d.apply('x', { sick: 2 }, {});
    c('sick: HealthSystem yoluyla en düşük enerjili N yetişkin hastalanır', Boolean(f.illness) && Boolean(e.illness) && !a.illness && st.characters.filter((x) => x.illness).length === 2);
    for (const x of st.characters) x.illness = null;
    d.apply('x', { quarantine: 1 }, {});
    const imm = immigrationStatus(st);
    sc.townEvents.merchantState.nextVisitDay = 0;
    const present0 = sc.townEvents.merchantState.present;
    sc.townEvents.tryMerchantVisit();
    const blocked = imm.checks.some((x) => x.key === 'quarantine' && !x.ok) && !imm.ok && sc.townEvents.merchantState.present === present0;
    const day0 = st.time.day;
    st.time.day += 2;
    const open2 = !immigrationStatus(st).checks.some((x) => x.key === 'quarantine');
    st.time.day = day0;
    d.apply('x', { leave: 'target' }, { who: e, who2: null });
    c('quarantine: bir gün göç ve tüccar yok, sonra açılır; leave: hedef terk ediş yoluna çıkar (DesertionSystem.startLeaving)', blocked && open2 && Boolean(e.emigrating), `${blocked} ${open2} ${Boolean(e.emigrating)}`);
    e.emigrating = null;

    // ---- tekrar kuralları
    reset();
    st.buildings.push({ id: 9999, type: 'fountain', functional: true });
    st.time.day = 14;
    dl.history.travelingTheater = 14 - 7;
    const e7 = d.eligible('travelingTheater');
    dl.history.travelingTheater = 14 - 8;
    const e8 = d.eligible('travelingTheater');
    dl.history.refugees = 14 - 7;
    const old7 = d.eligible('refugees');
    st.buildings.pop();
    c('tekrar aralığı 8 gün: 7 gün önce görülen uygun değil, 8 gün önce görülen uygun; eski kartlara da uygulanır', !e7 && e8 && !old7, `${e7} ${e8} ${old7}`);
    reset();
    dl.recent = ['bards', 'storm'];
    const pool = d.shapePool([['bards', 3], ['storm', 2], ['refugees', 3]]);
    const pool2 = d.shapePool([['bards', 3], ['storm', 2]]);
    c('son iki kart havuzdan çıkar (başka uygun kart varsa); başka kart yoksa çıkarılmaz', pool.map((x) => x[0]).join() === 'refugees' && pool2.length === 2);
    reset();
    st.time.day = 30;
    const mixed = d.shapePool([['refugees', 3], ['bards', 3], ['storm', 2], ['drought', 3], ['census', 2]]);
    const sum = (m) => mixed.filter(([id]) => !!D.DILEMMAS[id].midgame === m).reduce((x, [, w]) => x + w, 0);
    st.time.day = 15;
    const early = d.shapePool([['refugees', 3], ['drought', 3]]);
    c('20. günden sonra yeni kartların toplam ağırlığı eski kartlarınkinin en az iki katı; 20. günden önce ağırlıklar olduğu gibi', sum(true) >= 2 * sum(false) - 1e-9 && early[1][1] === 3, `${sum(true)} / ${sum(false)}`);
    // şalter kapalı: havuz, aralık, çekiş sayısı
    reset();
    st.time.day = 30;
    let n1 = 0;
    const origNext = d.rng.next.bind(d.rng);
    d.rng.next = () => { n1++; return origNext(); };
    d.maybeStart();
    game.events.emit('ui:chooseDilemma', { optionId: dl.active.defaultId });
    const drawsOn = n1;
    ENGINES.midgame = false;
    const seen = new Set();
    for (let i = 0; i < 40; i++) { reset(); d.maybeStart(); if (dl.active) seen.add(dl.active.id); dl.active = null; }
    reset();
    n1 = 0;
    d.maybeStart();
    game.events.emit('ui:chooseDilemma', { optionId: dl.active.defaultId });
    const drawsOff = n1;
    dl.history.bards = 30 - 6;
    const gap6 = d.eligible('bards');
    ENGINES.midgame = true;
    d.rng.next = origNext;
    c('şalter kapalıyken havuz eski beş karttır, aralık 6 gün, olay başına çekiş sayısı açıkla aynı', [...seen].every((id) => !D.DILEMMAS[id].midgame) && seen.size >= 3 && gap6 && drawsOn === drawsOff && drawsOn >= 1, `${[...seen]} gap6=${gap6} çekiş ${drawsOn}/${drawsOff}`);
    // sızıntı
    reset();
    st.time.day = 30;
    const s0 = Object.values(sc).filter((s) => s?.rng && typeof s.rng.state === 'number' && s !== d);
    const snap = s0.map((s) => s.rng.state);
    const own = d.rng.state;
    d.maybeStart();
    game.events.emit('ui:chooseDilemma', { optionId: dl.active.defaultId });
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Sekiz olay (olay başına bir test), karar sonrası kart ve "Halk:" satırı
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const D = await import('/src/data/dilemmas.js');
    const { pairKey } = await import('/src/systems/RelationshipSystem.js');
    const { hasTag } = await import('/src/systems/Chemistry.js');
    const { SKILL_LEVELS } = await import('/src/data/skills.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    const d = sc.dilemmas;
    const dl = d.dilemma;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 2000, iron: 50 });
    sim.step(60);
    const NEW = D.DILEMMA_KEYS.filter((x) => D.DILEMMAS[x].midgame);
    for (const x of NEW) D.DILEMMAS[x].requires.minPopulation = 1;
    const adults = () => st.characters.filter((x) => !x.role && !x.isChild);
    const [a, b, k] = adults();
    for (const x of [b, k]) x.traits = [];
    const zero = () => { for (const x of st.characters) { x.loyalty = 0; x.needs.energy = 100; x.needs.fun = 50; x.illness = null; x.moodlets = []; } };
    const reset = () => { dl.active = null; dl.history = {}; dl.recent = []; dl.storm = null; dl.quarantineUntil = 0; dl.nextDay = 0; st.time.paused = false; zero(); };
    for (const x of st.characters) x.skills = {};
    const stub = (types) => { const orig = sc.world.getCompleted.bind(sc.world); sc.world.getCompleted = (t = null) => (types[t] ? Array.from({ length: types[t] }, (_, i) => ({ id: 9000 + i })) : orig(t)); return () => { sc.world.getCompleted = orig; }; };
    const play = (id, optionId, day, setup) => {
      reset();
      st.time.day = day;
      setup?.();
      d.maybeStart(id);
      const act = dl.active;
      const snap = { gold: st.resources.gold, food: st.resources.food };
      if (act) game.events.emit('ui:chooseDilemma', { optionId });
      return { act, dGold: st.resources.gold - snap.gold, dFood: st.resources.food - snap.food };
    };
    const master = () => { a.skills.crafting = SKILL_LEVELS[SKILL_LEVELS.length - 1].xp; };

    // masterOffer
    {
      reset(); st.time.day = 19; master(); const early = d.eligible('masterOffer');
      const p = play('masterOffer', 'pay', 22, master);
      const aPay = a.loyalty;
      const q = play('masterOffer', 'feast', 22, master);
      const aFeast = a.loyalty;
      const r = play('masterOffer', 'release', 22, () => { master(); st.relationships[pairKey(a.id, b.id)] = 60; });
      c('masterOffer: gün ≥ 20 ve usta çalışan; Maaş ver (altın −60, {who} +15) · sofra (yiyecek −30, {who} +8) · Yolun açık olsun ({who} ayrılır, dostları −4)', !early && p.act?.who === a.id && p.dGold === -60 && aPay === 15 && q.dFood === -30 && aFeast === 8 && r.act && Boolean(a.emigrating) && b.loyalty === -4, `${early} ${p.dGold} ${aPay} ${q.dFood} ${aFeast} ${b.loyalty}`);
      a.emigrating = null;
      a.skills = {};
    }
    // neighborFeud
    {
      const setup = () => { st.relationships[pairKey(b.id, k.id)] = -20; };
      reset(); st.time.day = 11; setup(); const early = d.eligible('neighborFeud');
      play('neighborFeud', 'side', 14, setup);
      const s1 = [k.loyalty, hasTag(k, b.id, 'resentful')];
      play('neighborFeud', 'scold', 14, setup);
      const s2 = [b.loyalty, k.loyalty, sc.relationships.get(b, k)];
      const p3 = play('neighborFeud', 'reconcile', 14, setup);
      c('neighborFeud: gün ≥ 12, ilişkisi ≤ −10 çift; haklı bul ({who2} −12, kırgın) · ikisini azarla (−5, ilişki +10) · barıştır (altın −20, yiyecek −15, ilişki +25, comforted)', !early && s1[0] === -12 && s1[1] && s2.join() === '-5,-5,-10' && p3.dGold === -20 && p3.dFood === -15 && sc.relationships.get(b, k) === 5 && b.moodlets.some((m) => m.key === 'comforted') && k.moodlets.some((m) => m.key === 'comforted'), `${early} ${s1} ${s2} ${p3.dGold}/${p3.dFood}`);
      delete st.relationships[pairKey(b.id, k.id)];
    }
    // drought
    {
      const off = stub({ garden: 1 });
      reset(); st.time.day = 22; const one = d.eligible('drought'); off();
      const on = stub({ garden: 2 });
      const p = play('drought', 'muster', 22);
      const en = b.needs.energy;
      const q = play('drought', 'buy', 22, () => { st.resources.food = 20; });
      st.resources.food = 100;
      const r = play('drought', 'wait', 22);
      const loy = b.loyalty;
      st.time.day = 14; const spring = d.eligible('drought');
      on();
      c('drought: yaz, gün ≥ 16, en az 2 bahçe; seferberlik (enerji −20) · erzak al (altın −80, yiyecek +60) · bekle (yiyecek −35, sadakat −2)', !one && !spring && p.act && en === 80 && q.dGold === -80 && q.dFood === 60 && r.dFood === -35 && loy === -2, `${one} ${spring} ${en} ${q.dGold}/${q.dFood} ${r.dFood} ${loy}`);
    }
    // census
    {
      reset(); st.time.day = 26; st.town.tier = 2; const low = d.eligible('census');
      st.town.tier = 3; st.time.day = 23; const early = d.eligible('census');
      st.crown.reputation = 50;
      const p = play('census', 'send', 26);
      const rep1 = st.crown.reputation;
      st.crown.reputation = 50;
      const q = play('census', 'pay', 26);
      st.crown.reputation = 50;
      const r = play('census', 'refuse', 26);
      c('census: gün ≥ 24 ve Kasaba seviyesi; gönüllüleri azıklandır (altın −60, yiyecek −30, itibar +8) · bedelini öde (altın −120) · reddet (itibar −10, sadakat +3)', !low && !early && p.dGold === -60 && p.dFood === -30 && rep1 === 58 && q.dGold === -120 && r.dGold === 0 && st.crown.reputation === 40 && b.loyalty === 3, `${low} ${early} ${rep1} ${q.dGold} ${st.crown.reputation} ${b.loyalty}`);
      st.town.tier = 1;
    }
    // plagueRumor
    {
      const { immigrationStatus } = await import('/src/systems/TownStatus.js');
      reset(); st.time.day = 18; const early = d.eligible('plagueRumor');
      D.DILEMMAS.plagueRumor.requires.minPopulation = 999; st.time.day = 22; const small = d.eligible('plagueRumor'); D.DILEMMAS.plagueRumor.requires.minPopulation = 1;
      play('plagueRumor', 'close', 22);
      const q1 = [b.loyalty, immigrationStatus(st).ok, st.characters.filter((x) => x.illness).length];
      const p2 = play('plagueRumor', 'herbs', 22);
      const q2 = st.characters.filter((x) => x.illness).length;
      play('plagueRumor', 'ignore', 22);
      const q3 = st.characters.filter((x) => x.illness).length;
      c('plagueRumor: gün ≥ 20, nüfus ≥ 14; kapıları kapat (1 gün göç yok, sadakat −3) · şifalı ot (altın −50, kimse hastalanmaz) · kulak asma (3 sakin hastalanır)', !early && !small && q1[0] === -3 && q1[1] === false && q1[2] === 0 && p2.dGold === -50 && q2 === 0 && q3 === 3, `${early} ${small} ${q1} ${p2.dGold} ${q2} ${q3}`);
    }
    // travelingTheater
    {
      reset();
      st.buildings.push({ id: 9999, type: 'fountain', functional: true });
      st.time.day = 11; const early = d.eligible('travelingTheater');
      for (const x of st.characters) x.satisfaction = 50;
      const p = play('travelingTheater', 'pay', 14);
      const fun1 = b.needs.fun; const sat = b.satisfaction;
      const q = play('travelingTheater', 'feed', 14);
      const fun2 = b.needs.fun;
      play('travelingTheater', 'refuse', 14);
      c('travelingTheater: gün ≥ 12 ve meydan; parasını ver (altın −40, keyif +15, doyum +3) · erzakla ağırla (yiyecek −30, keyif +10) · geri çevir (keyif −3, sadakat −2)', !early && p.dGold === -40 && fun1 === 65 && sat === 53 && q.dFood === -30 && fun2 === 60 && b.needs.fun === 47 && b.loyalty === -2, `${early} ${fun1} ${sat} ${fun2} ${b.needs.fun}`);
      st.buildings.pop();
    }
    // lostChild
    {
      const kid = adults().at(-1);
      reset(); st.time.day = 22;
      const wasNone = d.eligible('lostChild');
      kid.growsUpAt = 999999; kid.ageInDays = 3; kid.parentIds = [a.id];
      const p = play('lostChild', 'all', 22);
      const L1 = [a.loyalty, b.loyalty, b.needs.energy];
      const noTower = d.optionStatus(D.DILEMMAS.lostChild.options[1]);
      const on = stub({ guardTower: 1 });
      const q = play('lostChild', 'guards', 22);
      const L2 = [a.loyalty, q.dGold];
      on();
      play('lostChild', 'wait', 22);
      c('lostChild: bir çocuk; herkes arasın (enerji −25, ebeveyn +12, herkes +3) · bekçiler (Gözcü Kulesi, altın −20, ebeveyn +6) · sabahı bekle (ebeveyn −15 ve shaken)', wasNone === false && p.act?.who === kid.id && L1.join() === '15,3,75' && !noTower.ok && L2.join() === '6,-20' && a.loyalty === -15 && a.moodlets.some((m) => m.key === 'shaken'), `${wasNone} ${L1} ${noTower.ok} ${L2} ${a.loyalty}`);
      kid.growsUpAt = null; kid.parentIds = [];
    }
    // bumperHarvest
    {
      reset(); st.time.day = 26;
      const lim = d.economy.limit('food');
      st.resources.food = Math.floor(lim * 0.5); const low = d.eligible('bumperHarvest');
      st.resources.food = lim;
      st.time.day = 22; const summer = d.eligible('bumperHarvest');
      const p = play('bumperHarvest', 'feast', 26);
      const L1 = [b.loyalty, b.needs.fun];
      st.resources.food = lim;
      const q = play('bumperHarvest', 'sell', 26);
      st.resources.food = lim;
      const r = play('bumperHarvest', 'give', 26);
      const gave = adults().filter((x) => x.loyalty === 10).length;
      c('bumperHarvest: sonbahar ve yiyecek ≥ depo %70; hasat şöleni (yiyecek −40, keyif +10, sadakat +4) · kervana sat (yiyecek −40, altın +70) · yoksula dağıt (yiyecek −25, en düşük 5 sakin +10)', !low && !summer && p.dFood === -40 && L1.join() === '4,60' && q.dFood === -40 && q.dGold === 70 && r.dFood === -25 && gave === Math.min(5, adults().length), `${low} ${summer} ${p.dFood} ${L1} ${q.dGold} ${r.dFood} ${gave}`);
    }
    // karar sonrası hikâye kartı ve "Halk:" satırı
    {
      reset(); st.time.day = 26;
      sc.storyDirector.queue = []; sc.storyDirector.visible = []; sc.storyDirector.missed = [];
      const fb = [];
      game.events.on('pulse:feedback', (x) => fb.push(x));
      st.resources.food = d.economy.limit('food');
      d.maybeStart('bumperHarvest');
      game.events.emit('ui:chooseDilemma', { optionId: 'feast' });
      const cards = [...sc.storyDirector.queue, ...sc.storyDirector.visible].filter((x) => x.event === 'dilemma:resolved');
      c('karar sonrası: sonucu anlatan hikâye kartı (öncelik 4) ve "Halk: N sakin memnun (bereketli hasat)" satırı', cards.length === 1 && /hasat şöleni/i.test(cards[0].text) && cards[0].priority === 4 && fb.length === 1 && /^Halk: \d+ sakin memnun \(bereketli hasat\)$/.test(fb[0].text), `${cards.map((x) => x.text)} / ${fb.map((x) => x.text)}`);
    }
    // pencere: kişi adı, portre, bedelli seçenekler (kişili olay)
    {
      reset(); st.time.day = 22; master();
      d.maybeStart('masterOffer');
      const act = dl.active;
      c('kişili olay penceresi: metinde ve seçeneklerde kişi adı, portre verisi, her seçenekte "Bedel:" metni (sadakat etkisi dahil)', act.text.includes(a.name) && !act.text.includes('{who}') && act.portraits.length === 1 && act.portraits[0].id === a.id && act.options.every((x) => x.detail.startsWith('Bedel:')) && act.options[0].detail.includes(`${a.name} sadakat +15`), act.options.map((x) => x.detail).join(' / '));
      dl.active = null; st.time.paused = false;
      a.skills = {};
    }
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Beş ara hedef
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const MS = await import('/src/data/milestones.js');
    const MSys = await import('/src/systems/MilestoneSystem.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { GameState } = await import('/src/state/GameState.js');
    const { CONFIG } = await import('/src/config.js');
    const G = await import('/src/systems/Guide.js');
    const GD = await import('/src/data/guide.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
    sim.step(60);
    const prog = (id) => MSys.milestoneProgress(MS.MILESTONES.find((m) => m.id === id), st);
    const ids = MSys.activeMilestones().map((m) => m.id);
    c('hedef listesi: 18 hedef (32.6b: +4 geç oyun); beş yenisi artisans\'tan sonra (heardVoices, peoplesHeart, firstFarewell, chosenPath, legacy)', ids.length === 18 && ids.slice(4, 11).join() === 'artisans,heardVoices,peoplesHeart,firstFarewell,chosenPath,legacy,winterTrial', ids.join());
    st.petitions.fulfilled = 4;
    const p1 = prog('heardVoices').current;
    st.petitions.fulfilled = 5;
    const p2 = prog('heardVoices').current;
    st.stats.pleasedStreak = 2;
    const s1 = prog('peoplesHeart').current;
    for (const x of st.characters) if (!x.role && !x.isChild) x.loyalty = 25;
    game.events.emit('time:newDay');
    const s2 = prog('peoplesHeart').current;
    for (const x of st.characters) x.loyalty = 0;
    game.events.emit('time:newDay');
    const s3 = prog('peoplesHeart').current;
    const f0 = prog('firstFarewell').current;
    game.events.emit('rite:held', { names: ['X'], attendees: [], place: null, condolence: false });
    const f1 = prog('firstFarewell').current;
    game.events.emit('rite:held', { names: ['X'], attendees: [], place: null, condolence: true });
    const f2 = prog('firstFarewell').current;
    const h0 = prog('chosenPath').current;
    st.doctrine = { chosen: 'industry', day: 3 };
    const h1 = prog('chosenPath').current;
    const l0 = prog('legacy').current;
    st.chronicle.firstHeirloom = { elder: 'A', heir: 'B', item: 'x', ids: [1, 2], day: 9, hour: 8, minute: 0 };
    const l1 = prog('legacy').current;
    c('ölçüm: dilekçe sayısı, Nabız serisi (Memnun günlerde artar, Sakin günde sıfırlanır), Taziye Sofrası (yalnızca taziyeli tören), Kasaba Doktrini, ilk yadigâr devri', p1 === 4 && p2 === 5 && s1 === 2 && s2 === 3 && s3 === 0 && f0 === 0 && f1 === 0 && f2 === 1 && h0 === 0 && h1 === 1 && l0 === 0 && l1 === 1, `${p1}${p2} ${s1}${s2}${s3} ${f0}${f1}${f2} ${h0}${h1} ${l0}${l1}`);
    sc.milestones.check();
    const done = ['heardVoices', 'firstFarewell', 'chosenPath', 'legacy'].every((id) => st.milestones[id]);
    st.stats.pleasedStreak = 2;
    const json = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
    const back = new GameState();
    back.restore(json);
    c('kayıt: sayaçlar (pleasedStreak, condolences) ve tamamlanan hedefler gidiş-dönüşte korunur; sürüm 42 (34.1)', done && back.stats.pleasedStreak === 2 && back.stats.condolences === 1 && Boolean(back.milestones.legacy) && CONFIG.SAVE_VERSION === 42, `${done} ${back.stats.pleasedStreak} ${back.stats.condolences}`);
    for (const id of Object.keys(st.milestones)) delete st.milestones[id];
    st.milestones.firstHome = { day: 1, hour: 8, minute: 0 };
    st.milestones.warmTable = { day: 1, hour: 9, minute: 0 };
    const nxt = MSys.nextMilestone(st);
    game.events.emit('ui:toggleGoals');
    await new Promise((r) => setTimeout(r, 700));
    game.ui.render();
    const rows = [...document.querySelectorAll('.goals-panel .goal-row[data-goal]')];
    const nextRows = rows.filter((r) => r.classList.contains('is-next'));
    c('Hedefler penceresi: 18 hedef satırı, tamamlanmamış ilk hedefte (tek) "Sıradaki" etiketi', rows.length === 18 && nextRows.length === 1 && nextRows[0].dataset.goal === nxt.id && /Sıradaki/.test(nextRows[0].textContent), `${rows.length} ${nextRows.map((r) => r.dataset.goal)} ${nxt?.id}`);
    game.events.emit('ui:toggleGoals');
    ENGINES.midgame = false;
    const off = MSys.activeMilestones().map((m) => m.id);
    ENGINES.midgame = true;
    c('midgame şalteri kapalıyken ara hedefler yok (32.6b: dört geç oyun hedefi kendi şalterlerine bağlı, dokuz + 4)', off.length === 13 && off.join() === 'firstHome,warmTable,tradeRoutes,growingFamily,artisans,winterTrial,brightStreets,crown,pearl,justiceServed,firstClub,firstGraduate,royalFavorite', off.join());
    st.doctrine = { chosen: null, day: null };
    const ctx = () => ({ state: st, guide: { done: [] }, facts: {} });
    const hallOff = G.CONDITIONS.doctrine.when(ctx());
    st.buildings.push({ id: 9998, type: 'townHall', functional: true });
    const hallOn = G.CONDITIONS.doctrine.when(ctx());
    st.doctrine = { chosen: 'industry', day: 5 };
    const chosen = G.CONDITIONS.doctrine.when(ctx());
    st.buildings.pop();
    const step = GD.GUIDE_STEPS.find((s) => s.id === 'doctrine');
    c('rehber: Belediye Konağı hazır ve doktrin seçilmemişken "Kasaba Doktrini" kartı (geri dönüşü yok); seçilince çıkmaz', !hallOff && hallOn && !chosen && /Kasaba Doktrini/.test(step.text) && /geri dönüşü yoktur/.test(step.text));
    return out;
  })));
  await browser.close();
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
