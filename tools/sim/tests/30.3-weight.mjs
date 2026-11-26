// Aşama 30.3 testleri: Kararın Ağırlığı (günlük sadakat kaynakları, beş kademe, iş bırakma, Halkın Nabzı, anında geri bildirim,
// kıtlık, özel ipucu, kart dili, sızıntı). En çok 30 test.
// Kullanım: node tools/sim/tests/30.3-weight.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 30.3
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};

// ---------------------------------------------------------------- Kaynaklar, kademeler, şalter
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const D = await import('/src/data/loyalty.js');
    const L = await import('/src/systems/Loyalty.js');
    const M = await import('/src/systems/Moodlets.js');
    const MD = await import('/src/data/moodlets.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { pairKey } = await import('/src/systems/RelationshipSystem.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500, iron: 50 });
    sim.step(60);
    const adults = () => st.characters.filter((x) => !x.role && !x.isChild);
    const zero = () => { for (const x of st.characters) { x.loyalty = 0; M.recomputeMood(x); } };
    const S = D.LOYALTY_SOURCES;
    c('tablo: yeni kaynaklar şartnameyle aynı (sürüm 2: taxDaily 6/2/1/−3, Kırgın iş x0,85, bitterTrust −0,4 → 30.4a: −0,6); mevcut kaynaklar duruyor', D.DISCONTENT_TABLE_VERSION === 3 && D.LOYALTY.bitterTrust.perHour === -0.6 && JSON.stringify(S.taxDaily) === JSON.stringify({ exempt: 6, low: 2, standard: 1, heavy: -3 }) && S.hungryDaily === -4 && S.coldDaily === -3 && S.friendRejected === -4 && S.friendFulfilled === 2 && D.DISCONTENT.friendAt === 40 && S.petitionRejected === -15 && S.taxCollected.heavy === -7 && S.gift === 10 && ENGINES.discontent === true);
    // günlük vergi kaynağı
    const [a, b, k, d] = adults();
    const rows = [];
    for (const rate of ['exempt', 'low', 'standard', 'heavy']) {
      zero();
      st.tax.rate = rate;
      for (const x of st.characters) x.moodlets = x.moodlets.filter((m) => m.key !== 'hangry');
      sc.loyalty.coldToday.clear();
      sc.loyalty.daily();
      rows.push(a.loyalty);
    }
    st.tax.rate = 'standard';
    c('taxDaily: gün dönümünde kademeye göre +6 / +2 / +1 / −3 (30.3 ayarı)', rows.join() === '6,2,1,-3', rows.join());
    // açlık ve üşüme
    zero();
    M.addMoodlet(a, 'hangry', st.totalMinutes, { reason: 'hangry' });
    game.events.emit('moodlet:added', { character: b, moodlet: { key: 'cold_wake' } });
    game.events.emit('moodlet:added', { character: b, moodlet: { key: 'chilled' } });
    sc.loyalty.daily();
    const after = [a.loyalty, b.loyalty, k.loyalty];
    sc.loyalty.daily();
    M.removeMoodlet(a, 'hangry');
    c('hungryDaily −4 (Açlıktan Gözü Dönmüş), coldDaily −3 (o gün üşüyen; günde bir kez); Standart Vergi +1 üstüne', st.tax.rate === 'standard' && after.join() === '-3,-2,1' && b.loyalty === -1, `${after} / ${b.loyalty}`);
    // dostlar
    zero();
    st.relationships[pairKey(a.id, b.id)] = 40;
    st.relationships[pairKey(a.id, k.id)] = 39;
    if (d) st.relationships[pairKey(a.id, d.id)] = 70;
    sc.loyalty.onPetition(a, 'rejected');
    const rej = [a.loyalty, b.loyalty, k.loyalty, d?.loyalty];
    zero();
    sc.loyalty.onPetition(a, 'fulfilled');
    const ful = [a.loyalty, b.loyalty, k.loyalty];
    c('dost etkisi yalnızca ilişki ≥ 40: ret −4, karşılama +2 (sahibi −15 / +15)', rej.slice(0, 3).join() === '-15,-4,0' && (!d || rej[3] === -4) && ful.join() === '15,2,0', `${rej} / ${ful}`);
    // beş kademe sınırları
    const cases = [[-100, 'bitter'], [-40, 'bitter'], [-39, 'grumbling'], [-20, 'grumbling'], [-19, 'calm'], [19, 'calm'], [20, 'pleased'], [39, 'pleased'], [40, 'loyal'], [100, 'loyal']];
    const badL = cases.filter(([v, key]) => L.loyaltyLevel(v) !== key);
    const faces = [[-31, 'angry'], [-30, 'angry'], [-29.9, 'grumbling'], [-10, 'grumbling'], [-9.9, 'calm'], [9.9, 'calm'], [10, 'pleased'], [29.9, 'pleased'], [30, 'grateful']];
    const badF = faces.filter(([v, key]) => L.pulseFace(v) !== key);
    c('beş kademe ve Nabız yüzü sınır değerleri', badL.length === 0 && badF.length === 0, `${badL} | ${badF}`);
    // c.mood çarpanları
    zero();
    a.moodlets = [];
    a.satisfaction = 50;
    const base = M.recomputeMood(a).workMul;
    const muls = {};
    for (const [v, key] of [[-50, 'bitter'], [-25, 'grumbling'], [25, 'pleased'], [50, 'loyal']]) {
      sc.loyalty.adjust(a, v - a.loyalty, 'test');
      muls[key] = { w: Math.round((a.mood.workMul / base) * 1000) / 1000, q: a.mood.quarrelMul };
    }
    c('kademe değişince c.mood yenilenir: iş x0,85 / 0,92 / 1,03 / 1,06, Kırgın atışma x1,2', muls.bitter.w === 0.85 && muls.bitter.q === 1.2 && muls.grumbling.w === 0.92 && muls.grumbling.q === 1 && muls.pleased.w === 1.03 && muls.loyal.w === 1.06, JSON.stringify(muls));
    // MOOD_LIMITS içinde kalma
    a.loyalty = -100;
    for (const key of ['hangry', 'exhausted', 'mourning', 'drudgery', 'cold_wake']) M.addMoodlet(a, key, st.totalMinutes, { tier: 'critical' });
    a.satisfaction = 5;
    M.recomputeMood(a);
    const lim = MD.MOOD_LIMITS;
    c('Kırgın + ağır moodlet yığını: çarpanlar MOOD_LIMITS içinde', a.mood.workMul >= lim.workMul[0] && a.mood.workMul <= lim.workMul[1] && a.mood.quarrelMul <= lim.quarrelMul[1], `${a.mood.workMul} ${a.mood.quarrelMul}`);
    a.moodlets = [];
    // beş kademe için olay
    zero();
    const seen = [];
    const off = game.events.on('loyalty:changed', (p) => seen.push(`${p.from}>${p.to}`));
    sc.loyalty.adjust(a, 10, 't'); sc.loyalty.adjust(a, 20, 't'); sc.loyalty.adjust(a, 15, 't'); sc.loyalty.adjust(a, -70, 't'); sc.loyalty.adjust(a, -10, 't');
    off();
    c('loyalty:changed beş kademe için (aynı kademe içinde olay yok)', seen.join() === '10>30,30>45,45>-25', seen.join());
    // şalter kapalı
    zero();
    ENGINES.discontent = false;
    const deltas = [];
    const off2 = game.events.on('loyalty:delta', (p) => deltas.push(p));
    const seen2 = [];
    const off3 = game.events.on('loyalty:changed', (p) => seen2.push(`${p.from}>${p.to}`));
    st.tax.rate = 'heavy';
    M.addMoodlet(a, 'hangry', st.totalMinutes, { reason: 'hangry' });
    sc.loyalty.daily();
    const dailyOff = a.loyalty === 0;
    sc.loyalty.adjust(b, -30, 't');
    b.moodlets = []; k.moodlets = []; b.satisfaction = 50; k.satisfaction = 50;
    const wb = M.recomputeMood(b).workMul;
    const wk = M.recomputeMood(k).workMul;
    sc.loyalty.onPetition(a, 'rejected');
    const friendOff = b.loyalty === -30;
    off2(); off3();
    ENGINES.discontent = true;
    st.tax.rate = 'standard';
    M.removeMoodlet(a, 'hangry');
    c('şalter kapalı: günlük kaynak, dost etkisi, çarpan, beş kademe olayı ve loyalty:delta yok', dailyOff && wb === wk && friendOff && deltas.length === 0 && seen2.length === 0 && L.levelEffects(b) !== null, `${dailyOff} ${wb}/${wk} ${friendOff} ${deltas.length} ${seen2}`);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- İş bırakma
{
  const { browser, page } = await open({ seed: 42 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const L = await import('/src/systems/Loyalty.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
    const stepTo = (h, m = 0) => { while (!(st.time.hour === h && st.time.minute >= m)) sim.step(5); };
    stepTo(9, 50);
    const adults = st.characters.filter((x) => !x.role && !x.isChild);
    for (const x of adults) { x.loyalty = 0; x.needs.hunger = Math.max(x.needs.hunger, 70); x.needs.energy = Math.max(x.needs.energy, 70); }
    // tek Kırgın: toplanma yok
    adults[0].loyalty = -60;
    const started = [];
    const offS = game.events.on('strike:started', (p) => started.push(p.ids.length));
    stepTo(10, 30);
    const lone = started.length === 0 && !adults[0].task?.activity?.startsWith('strike') && L.strikerIds(st).length === 0;
    c('tek Kırgın protesto etmez (en az 2 kişi)', lone, `${started} ${adults[0].task?.activity}`);
    // ertesi gün iki Kırgın
    stepTo(9, 55);
    const [x1, x2] = adults;
    x2.loyalty = -60;
    for (const x of [x1, x2]) { x.needs.hunger = 90; x.needs.energy = 90; }
    // zar çekilmemesi: planStrike ve iş bırakma saati işleyicisi üreteç tüketmez
    const brain = sc.behavior.brain;
    const rngs = [brain.rng, brain.citizenRng, ...Object.values(sc).filter((v) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number').map((v) => v.rng)];
    const r0 = JSON.stringify(rngs.map((r) => r.state));
    let mathCalls = 0;
    const mr = Math.random;
    Math.random = () => { mathCalls++; return mr(); };
    const snap = st.totalMinutes;
    const plan = brain.planStrike(x1);
    const ids = L.strikerIds(st);
    const should = L.shouldStrike(st, x1, 10) && L.shouldStrike(st, x1, 11) && !L.shouldStrike(st, x1, 9) && !L.shouldStrike(st, x1, 12);
    Math.random = mr;
    const noDraw = r0 === JSON.stringify(rngs.map((r) => r.state)) && mathCalls === 0 && snap === st.totalMinutes;
    stepTo(10, 40);
    const at1040 = [x1, x2].map((x) => x.task?.activity);
    const venue = sc.world.getCompleted('fountain')[0] ?? sc.world.getCompleted('campfire')[0];
    const near = [x1, x2].every((x) => x.task?.buildingId === venue?.id);
    c('10:00: en az 2 Kırgın yetişkin meydanda iş bırakır (strike:started; görev "strike", meydan)', started.length >= 1 && at1040.every((a) => a === 'strike') && near && ids.length >= 2 && should && plan?.activity === 'strike', `${started} ${at1040} ${near}`);
    // öncelikler: acil ihtiyaç, yaralı, isyan
    x1.needs.hunger = 5;
    const hungryPlan = brain.decide(x1, 10)?.activity;
    x1.needs.hunger = 90;
    x2.isInjured = true;
    const injuredStrike = L.shouldStrike(st, x2, 10);
    x2.isInjured = false;
    st.trust.revolt = { rioters: [], raids: [] };
    const revoltStrike = L.shouldStrike(st, x2, 10) || L.strikerIds(st).length > 0;
    st.trust.revolt = null;
    c('öncelik: aç (acil ihtiyaç), yaralı ve isyan iş bırakmadan önce gelir', hungryPlan && hungryPlan !== 'strike' && !injuredStrike && !revoltStrike, `${hungryPlan} ${injuredStrike} ${revoltStrike}`);
    const ended = [];
    const offE = game.events.on('strike:ended', (p) => ended.push(p.ids.length));
    stepTo(12, 20);
    const back = st.characters.filter((x) => x.task?.activity === 'strike').length;
    offS(); offE();
    c('12:00: strike:ended, kimse iş bırakmış kalmaz (işe döner)', ended.length >= 1 && back === 0, `${ended} ${back}`);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Nabız, kayıt, geri bildirim, ipucu
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const L = await import('/src/systems/Loyalty.js');
    const D = await import('/src/data/loyalty.js');
    const { pairKey } = await import('/src/systems/RelationshipSystem.js');
    const { TIP_DELAY_MS } = await import('/src/ui/components/HoverTip.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500, iron: 60 });
    sim.step(60);
    const hud = game.ui.components.find((x) => x.pulseWrap);
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const adults = () => st.characters.filter((x) => !x.role && !x.isChild);
    for (const x of st.characters) x.loyalty = 0;
    // yön oku
    const dirs = [L.pulseDirection(-5, 0), L.pulseDirection(1, 0), L.pulseDirection(3, 0), L.pulseDirection(-1.9, 0), L.pulseDirection(5, undefined)];
    sc.discontent.ring = Array(24).fill(10);
    const sDown = sc.discontent.summary().dir;
    sc.discontent.ring = [];
    st.pulse = { daily: [-10], reasons: [] };
    const sUp = sc.discontent.summary().dir;
    const dirOk = dirs.join() === 'down,flat,up,flat,flat' && sDown === 'down' && sUp === 'up';
    // neden toplamları: 2 gün penceresi
    const day = st.time.day;
    const reasons = [{ day: day - 2, totals: { 'tax:heavy': -500 } }, { day: day - 1, totals: { 'tax:heavy': -50, petitionRejected: -30 } }, { day, totals: { 'tax:heavy': -34, 'relief:food': 16, hunger: -8 } }];
    const top = L.topReasons(reasons, day);
    c('yön oku (24 saat öncesine göre ±2; halka yoksa günlük ortalama) ve neden toplamları (son 2 gün, en büyük üç)', dirOk && L.reasonsText(top) === 'Ağır Vergi −84 · reddedilen dilekçe −30 · erzak dağıtımı +16', `${dirs} ${sDown} ${sUp} | ${L.reasonsText(top)}`);
    // kayıt gidiş-dönüşü ve eski kayıt
    st.pulse = { daily: [1.5, -2, -4.5], reasons: [{ day, totals: { 'tax:heavy': -12, hunger: -4 } }], eaten: [30, 28] };
    const { CONFIG } = await import('/src/config.js');
    const snap = JSON.parse(JSON.stringify({ ...sc.saves.snapshot(), version: CONFIG.SAVE_VERSION, savedAt: 0 }));
    const json = JSON.stringify(snap.pulse);
    const load = (data) => { const g2 = new st.constructor(); g2.restore(JSON.parse(JSON.stringify(data))); return g2; };
    const back = JSON.stringify(load(snap).pulse);
    const old = JSON.parse(JSON.stringify(snap));
    delete old.pulse;
    const g3 = load(old);
    const oldOk = g3.pulse === null && !('pulse' in g3.toJSON());
    st.pulse = null;
    const emptyOk = sc.discontent.summary().top.length === 0 && Array.isArray(sc.discontent.pulse.daily);
    const bad = JSON.parse(JSON.stringify(snap));
    bad.pulse = { daily: ['x', 3, 4, 5, 6], reasons: [{ day: 'a' }, { day, totals: { zz: 4, hunger: 2 } }] };
    const cleaned = JSON.stringify(load(bad).pulse) === JSON.stringify({ daily: [4, 5, 6], reasons: [{ day, totals: { hunger: 2 } }] });
    const oldOk2 = oldOk && emptyOk;
    c('kayıt: state.pulse gidiş-dönüşü aynı; alanı olmayan eski kayıt boş başlar; bozuk alan temizlenir', json && json === back && oldOk2 && cleaned, `${json} / ${back} / ${oldOk} ${emptyOk} ${cleaned}`);
    // Nabız: tıklama ve ipucu
    for (const x of st.characters) x.loyalty = 0;
    adults()[0].loyalty = -50;
    st.pulse = { daily: [0], reasons: [{ day, totals: { 'tax:heavy': -84, petitionRejected: -30, 'relief:food': 16 } }] };
    hud.renderWelfare(st);
    const tip = hud.pulseWrap.title;
    const sel = [];
    const offSel = game.events.on('ui:selectBuilding', (id) => sel.push(id));
    hud.pulseWrap.click();
    offSel();
    const hall = st.buildings.find((x) => x.functional && x.definition.civic) ?? st.buildings.find((x) => x.functional && x.type === 'fountain');
    c('Nabız: yüz + ad + ok; ipucunda kademe sayıları ve üç neden; tıklayınca Belediye / meydan paneli', hud.pulseName.textContent.length > 0 && hud.pulseArrow.textContent.length === 1 && /Kırgın 1/.test(tip) && tip.includes('Ağır Vergi −84 · reddedilen dilekçe −30 · erzak dağıtımı +16') && tip.includes('isyan eşiği') && sel[0] === hall?.id && document.querySelector('.hud .trust-mini-mark'), tip.split('\n').slice(0, 3).join(' | '));
    // anında geri bildirim
    const fbs = [];
    game.events.on('pulse:feedback', (fb) => fbs.push(fb));
    const take = () => fbs.splice(0);
    for (const x of st.characters) x.loyalty = 0;
    st.tax.rate = 'standard';
    st.tax.lockedUntil = 0;
    game.events.emit('ui:setTaxRate', { rate: 'heavy' });
    const heavy = take();
    await frame();
    const line = document.querySelector('.pulse-feedback');
    const lineOk = line && !line.hidden && line.textContent === heavy[0]?.text && hud.pulseWrap.classList.contains('is-flash-bad');
    st.tax.lockedUntil = 0;
    game.events.emit('ui:setTaxRate', { rate: 'low' });
    const lowFb = take();
    const n = adults().length;
    c('vergi: Ağır Vergi\'ye geçişte "Halk: N sakin hoşnutsuz (Ağır Vergi)" + satır + parlama; Düşük\'e geçiş anında etkisiz (satır yok)', heavy.length === 1 && heavy[0].text === `Halk: ${n} sakin hoşnutsuz (Ağır Vergi)` && lineOk && lowFb.length === 0, `${heavy[0]?.text} ${lineOk} ${lowFb.length}`);
    // dilekçe: ret (sahibi + dostu), karşılama, kabul (etkisiz)
    const [a, b, k] = adults();
    for (const x of st.characters) x.loyalty = 0;
    for (const x of st.characters) if (x !== a) st.relationships[pairKey(a.id, x.id)] = 0;
    st.relationships[pairKey(a.id, b.id)] = 60;
    st.petitions.list = [];
    let p = sc.petitions.open(a, 'tool');
    game.events.emit('ui:acceptPetition', { id: p.id });
    const acc = take();
    game.events.emit('ui:rejectPetition', { id: p.id });
    const rej = take();
    p = sc.petitions.open(k, 'tool');
    game.events.emit('ui:grantPetition', { id: p.id });
    const gr = take();
    c('dilekçe: ret "2 sakin hoşnutsuz (reddedilen dilekçe)", karşılama memnun, kabul etkisiz', acc.length === 0 && rej[0]?.text === 'Halk: 2 sakin hoşnutsuz (reddedilen dilekçe)' && gr[0]?.tone === 'good' && gr[0]?.reason === 'petitionFulfilled', `${acc.length} ${rej[0]?.text} ${gr[0]?.text}`);
    // dağıtım, armağan, karar (etkisiz)
    for (const x of st.characters) x.loyalty = 0;
    st.trust.relief = {};
    sim.give({ food: 400, gold: 400 });
    game.events.emit('ui:relief', { kind: 'food' });
    const rf = take();
    st.trust.relief = {};
    game.events.emit('ui:relief', { kind: 'gold' });
    const rg = take();
    a.specialDay = { day: st.time.day, kind: 'birthday', celebrated: false, gifted: false };
    game.events.emit('ui:giftSpecialDay', { id: a.id });
    const gift = take();
    game.events.emit('ui:chooseDilemma', { optionId: 'none' });
    const dil = take();
    c('dağıtım (erzak / altın) ve armağan memnun satırı; karar penceresi etkisiz', rf[0]?.text === `Halk: ${n} sakin memnun (erzak dağıtımı)` && rg[0]?.text === `Halk: ${n} sakin memnun (altın dağıtımı)` && gift[0]?.text === 'Halk: 1 sakin memnun (özel gün armağanı)' && dil.length === 0, `${rf[0]?.text} | ${rg[0]?.text} | ${gift[0]?.text} | ${dil.length}`);
    // Taziye Sofrası: etkisi törenin sonunda gelir
    for (const x of st.characters) x.loyalty = 0;
    sc.discontent.passive = new Map();
    for (const x of [a, b]) game.scenes.current.loyalty.adjust(x, D.LOYALTY_SOURCES.condolence, 'condolence');
    game.events.emit('rite:held', { names: ['X'], attendees: [a.id, b.id], place: null, condolence: true });
    const cond = take();
    c('Taziye Sofrası: tören sonunda "Halk: 2 sakin memnun (Taziye Sofrası)"', cond[0]?.text === 'Halk: 2 sakin memnun (Taziye Sofrası)', cond[0]?.text);
    // vergi ve ret düğmesi ipuçları
    game.events.emit('ui:selectBuilding', hall.id);
    game.render(0);
    await frame();
    game.render(0);
    const heavyBtn = document.querySelector('.building-crown .tax-rate-button.is-heavy');
    const stdBtn = document.querySelector('.building-crown .tax-rate-button.is-standard');
    st.petitions.list = [];
    p = sc.petitions.open(a, 'tool');
    game.events.emit('ui:selectCharacter', a.id);
    game.render(0);
    await frame();
    game.render(0);
    const rejBtn = document.querySelector('.petition-buttons .is-reject');
    c('ipuçları: Ağır Vergi "Günlük: herkes −3 sadakat · tahsilatta −7"; ret "Sahibi −15 · dostları −4"', heavyBtn?.title.includes('Günlük: herkes −3 sadakat · tahsilatta −7') && stdBtn?.title.includes('Günlük: herkes +1 sadakat · tahsilatta −1') && rejBtn?.title.includes('Sahibi −15 · dostları −4') && heavyBtn.dataset.htip === '1', `${heavyBtn?.title.split('\n').at(-1)} | ${rejBtn?.title.split('\n').at(-1)}`);
    // özel ipucu: bütün çiplerde, Nabız'da, sayaçlarda ve nüfusta 300 ms'de açılır
    game.events.emit('ui:deselect');
    st.tax.lockedUntil = 0;
    game.events.emit('ui:setTaxRate', { rate: 'heavy' });
    hud.lastBuffs = '';
    hud.renderWelfare(st);
    hud.renderGoodsDetail(st);
    await frame();
    const targets = [...document.querySelectorAll('.hud-buffs .buff-chip.is-action'), hud.pulseWrap, hud.populationWrap, hud.welfareRow, ...Object.values(hud.resources).filter((r) => r.box.isConnected && !r.box.closest('[hidden]')).map((r) => r.box)];
    const tipBox = document.querySelector('.hover-tip');
    const problems = [];
    for (const t of targets) {
      t.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 60));
      const early = !tipBox.hidden;
      await new Promise((r) => setTimeout(r, TIP_DELAY_MS + 40));
      const rect = tipBox.getBoundingClientRect();
      if (early || tipBox.hidden || !tipBox.textContent.trim() || t.hasAttribute('title') || rect.left < 0 || rect.right > innerWidth || rect.bottom > innerHeight) problems.push(`${t.className}: ${early} ${tipBox.hidden} ${t.hasAttribute('title')}`);
      document.body.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }
    c('özel ipucu: çipler, Nabız, nüfus, refah ve kaynak sayaçlarında 300 ms sonra açılır, metni dolu, ekrandan taşmaz, yerel title yok', targets.length >= 8 && problems.length === 0 && document.querySelectorAll('.hud-buffs .buff-chip.is-action').length >= 1, `${targets.length} hedef; ${problems.slice(0, 3).join(' | ')}`);
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- Kıtlık, homurdanma, kart dili, rozet, sızıntı
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const L = await import('/src/systems/Loyalty.js');
    const D = await import('/src/data/loyalty.js');
    const W = await import('/src/data/wants.js');
    const S = await import('/src/systems/StoryCards.js');
    const M = await import('/src/systems/Moodlets.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 200, gold: 500 });
    sim.step(60);
    const hud = game.ui.components.find((x) => x.pulseWrap);
    const adults = () => st.characters.filter((x) => !x.role && !x.isChild);
    // "≈ N gün" hesabı
    const calc = [L.foodDaysLeft(30, [20, 40]), L.foodDaysLeft(30, []), L.foodDaysLeft(0, [5]), L.foodDaysLeft(50, [0, 25])];
    c('"≈ N gün" = stok ÷ son 2 günün günlük tüketimi (kayıt yoksa tahmin yok)', calc[0] === 1 && calc[1] === Infinity && calc[2] === 0 && calc[3] === 2 && D.DISCONTENT.famine.criticalDays === 3, calc.join());
    // sayaç: kritik, kırmızı eşik, hikâye kartı
    if (!sc.world.getCompleted('storage').length) sim.place('storage');
    const cards = [];
    const offC = game.events.on('pantry:low', (p) => cards.push(p));
    st.pulse = { daily: [], reasons: [], eaten: [40, 40] };
    st.resources.food = 100;
    st.resources.bread = 0;
    st.pantry.credit = 0;
    sc.discontent.lowWarned = false;
    sc.discontent.checkPantry();
    hud.renderGoodsDetail(st);
    const ok2 = !hud.foodDays.hidden && hud.foodDays.textContent === '≈ 2,5 gün' && !hud.resources.food.box.classList.contains('is-famine') && cards.length === 0 && hud.resources.food.box.title.includes('≈ 2,5 gün yeter');
    st.resources.food = 30;
    sc.discontent.checkPantry();
    sc.discontent.checkPantry();
    hud.renderGoodsDetail(st);
    const red = hud.resources.food.box.classList.contains('is-famine') && hud.foodDays.textContent === '≈ 0,7 gün';
    const dir = sc.storyDirector;
    const card = S.makeCard('pantry:low', cards[0] ?? {}, { state: st });
    offC();
    const storage = sc.world.getCompleted('storage')[0];
    c('kıtlık: 3 günün altında sayacın yanında "≈ N gün", 1 günün altında kırmızı; bir kez "Kiler boşalıyor" kartı (Git: kiler)', ok2 && red && cards.length === 1 && card?.text === 'Kiler boşalıyor: yiyecek bir günden az yeter.' && card.priority >= 3 && card.go?.kind === 'building' && card.go.id === storage?.id && dir.log.some((x) => x.event === 'pantry:low'), `${ok2} ${red} ${cards.length} ${card?.text} p${card?.priority} ${JSON.stringify(card?.go)} ${storage?.id} ${dir.log.map((x) => x.event).join()}`);
    st.resources.food = 200;
    // açlık Nabız'da "açlık" nedeni
    st.pulse = { daily: [], reasons: [] };
    for (const x of st.characters) x.loyalty = 0;
    for (const x of adults()) M.addMoodlet(x, 'hangry', st.totalMinutes, { reason: 'hangry' });
    sc.loyalty.daily();
    for (const x of adults()) M.removeMoodlet(x, 'hangry');
    const top = sc.discontent.summary().top;
    c('aç sakinlerin sadakati düşer; Nabız ipucunda neden "açlık"', top[0]?.key === 'hunger' && top[0].name === 'açlık' && top[0].points === -4 * adults().length && adults().every((x) => x.loyalty === -3), JSON.stringify(top));
    // homurdanma sözü (söz üreteci; c.speech'e yazılmaz)
    for (const x of st.characters) { x.loyalty = 0; x.grumble = null; x.speech = null; }
    const awake = adults().filter((x) => x.visible && !x.isSleeping && !x.away);
    const [a, b] = awake.length >= 2 ? awake : adults();
    a.loyalty = -30;
    b.loyalty = -60;
    sc.discontent.lastCause.clear();
    st.tax.rate = 'heavy';
    const sp0 = sc.discontent.speech.state;
    for (let i = 0; i < 60 && !(a.grumble && b.grumble); i++) sc.discontent.grumble();
    const said = [a.grumble?.text, b.grumble?.text];
    const calmQuiet = adults().filter((x) => x !== a && x !== b).every((x) => !x.grumble);
    st.tax.rate = 'standard';
    c('Homurdanan / Kırgın sakin yönetimden yakınır (vergi sözü, c.speech boş; Sakin susar)', said.every((t) => D.LOYALTY_LINES.tax.includes(t)) && a.speech === null && b.speech === null && calmQuiet, said.join(' | '));
    // kart dili
    const missing = [...Object.entries(W.WANTS), ...Object.entries(W.FEARS)].filter(([, d]) => !d.told || d.told === d.name).map(([k]) => k);
    const w = S.makeCard('want:fulfilled', { character: a, want: { key: 'find_love' }, points: 20 }, { state: st });
    const f = S.makeCard('fear:realized', { character: a, fear: { key: 'winter_cold' }, points: 14 }, { state: st });
    const g = S.makeCard('want:fulfilled', { character: a, want: { key: 'get_married', whoName: 'Deniz' }, points: 20 }, { state: st });
    c('kart dili: her dilek ve korkuda told var; kartlar üçüncü ağızla ("Mehmet gönlüne göre birini buldu.")', missing.length === 0 && w.text === `${a.name} gönlüne göre birini buldu.` && f.text === `${a.name} soğukta üşüdü.` && g.text === `${a.name} Deniz ile evlendi.` && W.WANTS.find_love.name === 'Gönlüme göre birini bulayım', `${missing} | ${w.text} | ${f.text}`);
    // rozet: beş kademe (Sakin'de gizli)
    const panel = game.ui.components.find((x) => x.loyaltyBox);
    const shown = {};
    for (const v of [-60, -25, 0, 25, 60]) {
      a.loyalty = v;
      panel.lastLoyalty = '';
      panel.renderLoyalty(a, st);
      shown[v] = panel.loyaltyBox.hidden ? '-' : panel.loyaltyBox.querySelector('.petition-title')?.textContent;
    }
    a.loyalty = 0;
    c('sakin kartı rozeti beş kademe (Sakin\'de gizli)', shown[-60] === 'Sadakat · Kırgın' && shown[-25] === 'Sadakat · Homurdanıyor' && shown[0] === '-' && shown[25] === 'Sadakat · Memnun' && shown[60] === 'Sadakat · Sadık', JSON.stringify(shown));
    // sızıntı: bir gün boyunca (24 saat + gün dönümü) bu aşamanın kancaları yalnızca söz üretecini ilerletir
    for (const x of st.characters) x.loyalty = 0;
    adults().forEach((x, i) => { x.loyalty = i % 2 ? -30 : -60; x.grumble = null; });
    st.tax.rate = 'heavy';
    const brain = sc.behavior.brain;
    const rngs = [brain.rng, brain.citizenRng, ...Object.values(sc).filter((v) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number' && v !== sc.rites).map((v) => v.rng)];
    const r0 = JSON.stringify(rngs.map((r) => r.state));
    const s0 = sc.discontent.speech.state;
    let mathCalls = 0;
    const mr = Math.random;
    Math.random = () => { mathCalls++; return mr(); };
    const bubbles = [];
    const offStart = game.events.on('strike:started', ({ ids }) => bubbles.push(ids.length));
    for (let h = 0; h < 24; h++) sc.discontent.hourly(h);
    sc.loyalty.daily();
    sc.discontent.newDay();
    for (const x of adults()) brain.planStrike(x);
    sc.discontent.summary();
    sc.discontent.foodDays();
    offStart();
    Math.random = mr;
    st.tax.rate = 'standard';
    return out;
  })));
  await browser.close();
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
