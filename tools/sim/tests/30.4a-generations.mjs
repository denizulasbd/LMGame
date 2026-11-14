// Aşama 30.4a testleri: Kuşaklar (terk ediş sınırı, her mevsim bir yaş, takvim yılı, kayıt sürümü 41 göçü, oyuncuya anlatım,
// kişilik çeşitliliği, sızıntı). En çok 30 test.
// Kullanım: node tools/sim/tests/30.4a-generations.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 30.4
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];
const open = async (opts) => {
  const g = await openGame(opts);
  g.page.on('pageerror', (e) => errors.push(String(e)));
  return g;
};

// ---------------------------------------------------------------- §1 Terk ediş sınırı
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { EXODUS } = await import('/src/data/crown.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
    for (let i = 0; i < 5; i++) sim.place('cabin');
    sim.step(225 * 4);
    // 24 bekâr yetişkin (göçmen değil): sınır sayılabilsin
    const { Character } = await import('/src/entities/Character.js');
    while (st.characters.filter((x) => !x.role).length < 24) {
      const n = new Character({ name: `T${st.characters.length}`, age: 30, traits: ['cheerful'], x: st.characters[0].x, y: st.characters[0].y });
      st.characters.push(n);
    }
    const reset = () => {
      for (const x of st.characters) {
        x.emigrating = null;
        x.newcomer = false;
        x.partnerId = null;
        x.married = false;
        x.away = false;
      }
      st.exodus = { lowSince: st.totalMinutes - 25 * 60, lastAt: null, active: true, startedAt: st.totalMinutes, left: 0, coins: 0, items: 0, log: [] };
      st.trust.value = 5;
      leaving = 0;
      st.trust.revolt = { since: st.totalMinutes - 25 * 60, rioters: [], raids: [], nextRaidAt: st.totalMinutes + 9999, nextJoinAt: st.totalMinutes + 9999, nextRaidId: 1, looted: { x: 1 } };
    };
    // hourly() yola çıkarır (6 saat beklemesini lastAt = null ile atlayarak); kaç kişi yola çıktı
    // (gün değişince totalMinutes da ilerler: yola çıkanlar zaman aşımıyla ayrılır; sayım yola çıkış olayından)
    let leaving = 0;
    game.events.on('exodus:leaving', ({ ids }) => (leaving += ids.length));
    const tick = (n) => {
      for (let i = 0; i < n; i++) {
        st.exodus.lastAt = null;
        sc.desertion.hourly();
      }
      return leaving;
    };
    c('sınır sabitleri data/crown.js EXODUS\'ta (günde 2, isyan başına 4); şalter ENGINES.gentleExodus', EXODUS.maxPerDay === 2 && EXODUS.maxPerRevolt === 4 && ENGINES.gentleExodus === true);
    reset();
    const day0 = st.time.day;
    const d1 = tick(5);
    st.time.day = day0 + 1;
    const d2 = tick(5);
    st.time.day = day0 + 2;
    const d3 = tick(5);
    const revoltCap = st.exodus.cap.revolt;
    // yeni isyan: sayaç sıfırlanır
    st.trust.revolt.since += 1;
    const d4 = tick(5);
    st.time.day = day0;
    c('günde en çok 2, bir isyan boyunca en çok 4 sakin; yeni isyanda sayaç sıfırlanır', d1 === 2 && d2 === 4 && d3 === 4 && revoltCap === 4 && d4 === 6, `${d1}/${d2}/${d3}/${d4}`);
    // aile tek birim: bugün 1 kişi gitmişken 3 kişilik aile birlikte gider (sınırı bir kez aşar), sonra kimse
    reset();
    const pool = st.characters.filter((x) => !x.role && !x.isChild).sort((a, b) => a.id - b.id);
    // en mutsuz (sıranın başı) aile olsun: herkesin keyfi yüksek, ailenin düşük
    for (const x of st.characters) { x.loyalty = 50; x.needs.fun = 100; }
    const [p1, p2, kid] = [pool[0], pool[1], pool[2]];
    Object.assign(p1, { partnerId: p2.id, married: true, loyalty: -90 });
    Object.assign(p2, { partnerId: p1.id, married: true, loyalty: -90 });
    st.exodus.cap = { day: st.time.day, today: 1, revoltSince: st.trust.revolt.since, revolt: 1 };
    const kidWas = { growsUpAt: kid.growsUpAt, parentIds: kid.parentIds };
    kid.growsUpAt = st.totalMinutes + 9999;
    kid.parentIds = [p1.id, p2.id];
    st.exodus.lastAt = null;
    sc.desertion.hourly();
    const famGone = [p1, p2, kid].every((x) => x.emigrating) && leaving === 3;
    const after = tick(3);
    c('aile tek birim: sayaç sınırın altındayken 3 kişilik aile birlikte gider (sınır bir kez aşılır: 4), sonra o gün kimse', famGone && st.exodus.cap.today === 4 && after === 3, `bugün ${st.exodus.cap.today}, sonra ${after}`);
    Object.assign(kid, kidWas);
    // şalter kapalı: eski davranış (6 saatte bir, sınırsız)
    reset();
    ENGINES.gentleExodus = false;
    const off = tick(6);
    ENGINES.gentleExodus = true;
    c('şalter kapalıyken sınır yok (eski davranış: her 6 saatte bir sakin; cap sayacı yazılmaz)', off === 6 && st.exodus.cap === undefined, `${off}`);
    for (const x of st.characters) x.emigrating = null;
    st.trust.revolt = null;
    st.exodus.active = false;
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- §2 Her mevsim bir yaş, takvim yılı
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { AGING } = await import('/src/data/lifeStages.js');
    const { CALENDAR } = await import('/src/data/seasons.js');
    const { SPECIAL_RULES } = await import('/src/data/rites.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const LS = await import('/src/systems/LifeStages.js');
    const RI = await import('/src/systems/Rites.js');
    const { Character } = await import('/src/entities/Character.js');
    const st = game.state;
    c('bir yaş = AGING.daysPerAge = 4 gün; takvim yılı CALENDAR.daysPerYear = 16 gün (yıl dönümü, eski ad AGING.daysPerYear); şalter ENGINES.swiftAging',
      AGING.daysPerAge === 4 && CALENDAR.daysPerYear === 16 && AGING.daysPerYear === 16 && SPECIAL_RULES.yearDays === 16 && ENGINES.swiftAging === true && AGING.elderAt === 65 && AGING.youthUntil === 21);
    // 4 günde bir yaş
    const a = new Character({ id: 900, name: 'Y', age: 30, traits: [] });
    const ages = [];
    for (let d = 0; d < 8; d++) { a.ageOneDay(); ages.push(a.age); }
    const off = LS.birthdayOffset(900);
    c('4 günde bir yaş (doğum günü kimlikten: bir yaşın ilk yarısı); kurucunun gün sayacı yaş x 4 + sapma', a.ageInDays === 30 * 4 + off + 8 && ages.filter((x, i) => i > 0 && x !== ages[i - 1]).length === 2 && LS.birthdaySpread() === 2 && off < 2, `${ages.join()} · sapma ${off}`);
    // evre geçişleri doğru yaşta
    const y = new Character({ id: 902, name: 'G', age: 20, traits: [] });
    const e = new Character({ id: 904, name: 'B', age: 64, traits: [] });
    const steps = [];
    for (let d = 0; d < 8; d++) {
      const cy = y.ageOneDay();
      const ce = e.ageOneDay();
      if (cy) steps.push(`${cy.to}@${y.age}`);
      if (ce) steps.push(`${ce.to}@${e.age}`);
    }
    c('evre geçişleri: Genç 21 yaşında Yetişkin, Yetişkin 65 yaşında Kıdemli Bilge (en geç 4 gün içinde)', y.lifeStage === 'adult' && e.lifeStage === 'elder' && [...steps].sort().join() === 'adult@21,elder@65', steps.join());
    // doğum günü yılda bir (16 gün), yıl dönümü 16 gün
    const b = new Character({ id: 906, name: 'D', age: 30, traits: [] });
    const bdays = [];
    for (let d = 0; d < 64; d++) { b.ageOneDay(); if (RI.isBirthday(b)) bdays.push(d); }
    const gaps = bdays.slice(1).map((d, i) => d - bdays[i]);
    const w = { weddingDay: 10, married: true };
    const ann = [14, 18, 22, 26, 42].map((d) => RI.isAnniversary(w, d));
    c('doğum günü kutlaması yılda bir (64 günde 4 kez, 16 gün arayla; o gün yaş alır); kalan gün tutarlı', bdays.length === 4 && gaps.every((g) => g === 16) && RI.daysToBirthday({ ageInDays: 16 * 5 - 3 }) === 3, `${bdays.join()}`);
    c('evlilik yıl dönümü 16 günde bir (4, 8, 12 gün sonra değil)', ann.join() === 'false,false,false,true,true', ann.join());
    // şalter kapalıyken 16 gün
    ENGINES.swiftAging = false;
    const k = new Character({ id: 908, name: 'K', age: 30, traits: [] });
    const kAge = [];
    for (let d = 0; d < 16; d++) { k.ageOneDay(); kAge.push(k.age); }
    const offState = [AGING.daysPerAge, LS.ageFromDays(30 * 16), LS.birthdaySpread(), kAge.filter((x, i) => i > 0 && x !== kAge[i - 1]).length];
    ENGINES.swiftAging = true;
    c('şalter kapalıyken bir yaş 16 gün (yayılım 8, eski kural)', offState.join() === '16,30,8,1', offState.join());
    // kuşak yaşı farkı tam yıl
    const g1 = new Character({ id: 3, name: 'A1', age: 25, traits: [] });
    const g2 = new Character({ id: 4, name: 'A2', age: 40, traits: [] });
    c('kuşak yaşı farkı (ageGap) yeni hızla da tam yıl', LS.ageGap(g1, g2) === 15, `${LS.ageGap(g1, g2)}`);
    // kurucular: açılışta 4 günlük yaşla kuruldu
    const founders = st.characters.filter((x) => !x.role);
    c('kurucuların gün sayacı açılışta yeni hızla (yaş = gün / 4)', founders.length >= 6 && founders.every((x) => Math.floor(x.ageInDays / 4) === x.age && x.ageInDays < x.age * 4 + 2), founders.map((x) => `${x.age}:${x.ageInDays}`).join(' '));
    return out;
  })));
  await browser.close();
}

// şalterin açılıştan önce okunması: enginesOff ile açılan oyunda kurucu yaşları 16 günlük
{
  const { browser, page } = await open({ seed: 5, enginesOff: ['swiftAging'] });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { ENGINES } = await import('/src/systems/Engines.js');
    const founders = game.state.characters.filter((x) => !x.role);
    c('enginesOff: şalter Engines.js yüklenirken okunur (öteki şalterler açık); kurucular 16 günlük yaşla kurulur', ENGINES.swiftAging === false && ENGINES.bonds === true && founders.every((x) => Math.floor(x.ageInDays / 16) === x.age && x.ageInDays >= x.age * 16), founders.map((x) => `${x.age}:${x.ageInDays}`).join(' '));
    return out;
  })));
  await browser.close();
}

// ---------------------------------------------------------------- §2.3 Kayıt sürümü 41: v40 -> v41 göçü
{
  const raw40 = fs.readFileSync(new URL('../fixtures/save-v40.json', import.meta.url), 'utf8');
  const { browser, page } = await open({ seed: 1 });
  results.push(...(await page.evaluate(async (raw) => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { CONFIG } = await import('/src/config.js');
    const { SaveManager } = await import('/src/state/SaveManager.js');
    const data = JSON.parse(raw);
    const before = new Map(data.characters.map((x) => [x.id, x]));
    let mathCalls = 0;
    const mr = Math.random;
    Math.random = () => { mathCalls++; return mr(); };
    localStorage.setItem('lmgame.save.v2', raw);
    const migrated = SaveManager.read('main');
    Math.random = mr;
    game.events.emit('ui:load');
    const s = game.state;
    const live = s.characters.filter((x) => before.has(x.id) && Number.isFinite(before.get(x.id).ageInDays));
    const same = live.every((x) => x.age === Math.floor(before.get(x.id).ageInDays / 16) && x.lifeStage === before.get(x.id).lifeStage);
    c('v40 -> v41: her sakinin yaşı (yıl) ve evresi aynı', CONFIG.SAVE_VERSION === 41 && data.version === 40 && live.length >= 20 && same, `${live.length} sakin`);
    const ratio = live.every((x) => {
      const old = before.get(x.id);
      const cohortOld = old.ageInDays - (old.agedDays ?? 0);
      return x.ageInDays === Math.floor(old.ageInDays / 4) && x.ageInDays % 4 === Math.floor(((old.ageInDays % 16) * 4) / 16) && x.agedDays === x.ageInDays - Math.floor(cohortOld / 4);
    });
    c('v40 -> v41: yaş içindeki ilerleme oranı korunur (gün x 4/16, aşağı); kuşak yaşı aynı oranla', ratio);
    const idem = SaveManager.read('main');
    game.events.emit('ui:save');
    const re = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    localStorage.setItem('lmgame.save.v2', JSON.stringify(re));
    const again = SaveManager.read('main');
    const noRescale = again.characters.every((x) => re.characters.find((y) => y.id === x.id).ageInDays === x.ageInDays);
    c('göç zar çekmez (Math.random 0); v41 kaydı yeniden ölçeklenmez (gidiş-dönüş birebir)', mathCalls === 0 && migrated && idem && re.version === 41 && noRescale, `Math.random ${mathCalls}`);
    return out;
  }, raw40)));
  await browser.close();
}

// ---------------------------------------------------------------- §2.4 Oyuncuya anlatım + sızıntı
{
  const { browser, page } = await open({ seed: 5 });
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const { lifeNoteOf } = await import('/src/ui/components/CharacterPanel.js');
    const G = await import('/src/systems/Guide.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
    sim.step(225);
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const panel = game.ui.components.find((x) => x.setTab);
    const who = st.characters.find((x) => !x.role && !x.isChild);
    game.events.emit('ui:selectCharacter', who.id);
    await frame();
    panel.renderLifeStage(who);
    const ageEl = panel.stageBadge.querySelector('.life-stage-age');
    const tip = ageEl?.getAttribute('data-tip') ?? ageEl?.title ?? '';
    c('sakin kartı: yaş ibaresinin ipucu "Sakinler her mevsim bir yaş alır."', tip.startsWith('Sakinler her mevsim bir yaş alır.'), tip);
    // notlar
    const keep = { age: who.age, lifeStage: who.lifeStage, lifespan: who.lifespan, ageInDays: who.ageInDays };
    Object.assign(who, { age: 63, lifeStage: 'adult', lifespan: 72 });
    panel.renderLifeStage(who);
    const n1 = panel.stageBadge.querySelector('.life-stage-soon')?.textContent;
    Object.assign(who, { age: 71, lifeStage: 'elder', lifespan: 72 });
    panel.renderLifeStage(who);
    const n2 = panel.stageBadge.querySelector('.life-stage-soon')?.textContent;
    Object.assign(who, { age: 40, lifeStage: 'adult' });
    panel.renderLifeStage(who);
    const n3 = panel.stageBadge.querySelector('.life-stage-soon');
    const pure = [lifeNoteOf({ age: 64, lifeStage: 'adult', lifespan: 75 })?.key, lifeNoteOf({ age: 62, lifeStage: 'adult', lifespan: 75 }), lifeNoteOf({ age: 73, lifeStage: 'elder', lifespan: 75 })?.key, lifeNoteOf({ age: 64, isChild: true })];
    Object.assign(who, keep);
    c('kart notu: Bilgeliğe 2 yaş kala "Yakında bilgeleşecek", ömrün son 2 yaşında "Ömrünün son demlerinde"; başka zaman yok', n1 === 'Yakında bilgeleşecek' && n2 === 'Ömrünün son demlerinde' && !n3 && pure.join() === 'elder,,last,', `${n1} / ${n2} / ${pure.join()}`);
    // ilk doğal vefat rehber kartı (bir kez)
    st.guide = { done: [], off: false };
    const gs = sc.guideSystem;
    const ls = st.lifeStages;
    const keepLs = { deaths: ls.deaths, accidents: ls.accidents };
    Object.assign(ls, { deaths: 1, accidents: 1 });
    const accident = gs.sync()?.id;
    Object.assign(ls, { deaths: 2, accidents: 1 });
    const first = gs.sync();
    game.events.emit('ui:guideDismiss', { id: 'lifespan' });
    Object.assign(ls, { deaths: 3, accidents: 1 });
    const again = gs.sync()?.id;
    Object.assign(ls, keepLs);
    c('rehber kartı: ilk doğal vefatta (kaza değil) "Sakinlerin ömrü var. ..." bir kez; "Anladım"dan sonra yeniden çıkmaz', accident !== 'lifespan' && first?.id === 'lifespan' && first.text === 'Sakinlerin ömrü var. Vefat edenler anıtta anılır; öyküleri kitabede kalır.' && again !== 'lifespan' && G.CONDITIONS.lifespan.done({}) === false, `${accident} / ${first?.id} / ${again}`);
    st.guide = { done: [], off: true };
    // sızıntı: bir gün dönümü boyunca bu aşamanın kancaları hiçbir üreteci ilerletmez
    for (const x of st.characters) if (!x.role) { x.ageInDays = x.age * 4 + 2; x.agedDays = Math.max(1, x.agedDays); }
    const brain = sc.behavior.brain;
    const rngs = [brain.rng, brain.citizenRng, ...Object.values(sc).filter((v) => v && typeof v === 'object' && v.rng && typeof v.rng.state === 'number').map((v) => v.rng)];
    const r0 = JSON.stringify(rngs.map((r) => r.state));
    let mathCalls = 0;
    const mr = Math.random;
    Math.random = () => { mathCalls++; return mr(); };
    sc.lifeStages.ageEveryone();
    sc.desertion.capped();
    const RI = await import('/src/systems/Rites.js');
    for (const x of st.characters) { RI.isBirthday(x); RI.daysToBirthday(x); lifeNoteOf(x); }
    Math.random = mr;
    c('sızıntı: gün dönümü (yaşlanma, terk ediş sınırı, doğum günü, notlar) bütün üreteçleri aynı bırakır; Math.random çağrılmaz', rngs.length > 5 && r0 === JSON.stringify(rngs.map((r) => r.state)) && mathCalls === 0, `${rngs.length} üreteç · Math.random ${mathCalls}`);
    return out;
  })));
  await browser.close();
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
