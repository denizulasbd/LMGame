// Aşama 32.3 testleri: Kasaba Şöhreti (Krallık İtibarı'nın günlük hedefe kayması, katkıların yönü, kademeler ve etkiler, kademe kartı,
// Kraliyet Lütfu: gizli yapılar, zar, aralık, kalıcılık, etkiler ve Şüpheli'de yarıya inmesi, rozet, kayıt, şalter).
// Kullanım: node tools/sim/tests/32.3-renown.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.3
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];

// ---- A. şalter kapalı (açılıştan önce): itibar yalnızca olaylarla, state.renown yok, menüde yok, üç kademe
{
  const { browser, page } = await openGame({ seed: 5, enginesOff: ['renown'] });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const Cr = await import('/src/systems/Crown.js');
    const B = await import('/src/data/buildings.js');
    const { sim } = window;
    const st = game.state;
    const sc = game.scenes.current;
    st.town.tier = 4;
    sim.give({ gold: 2000 });
    const rep0 = st.crown.reputation;
    st.time.day = 12;
    game.events.emit('time:newDay', 12);
    sc.crown.collectLevy();
    const rep1 = st.crown.reputation;
    sim.step(225 * 30); // 30 saat
    c('şalter kapalı: gün dönümünde kayma yok, vergi olayı anında +8, state.renown yok', !sc.renown.unsubscribers.length && st.renown === null && rep1 === rep0 + 8 && st.crown.reputation >= rep1 && !('renown' in st.toJSON()), `${rep0} ${rep1} ${st.crown.reputation}`);
    c('şalter kapalı: üç kademe (95 Saygın), lütuf yapıları menüde ve kurulumda yok, rozet gizli', Cr.reputationLevel(95).key === 'good' && Cr.reputationLevel(95).levy === 0.9 && !B.BUILD_MENU.includes('peaceFountain') && /kapalı/.test(sc.construction.globalBlock('peaceFountain') ?? '') && document.querySelector('.hud-renown')?.hidden === true && !('reputation' in st.history.at(-1)));
    return out;
  })));
  await browser.close();
}

// ---- B. şalter açık
const { browser, page } = await openGame({ seed: 5 });
page.on('pageerror', (e) => errors.push(String(e)));
results.push(...(await page.evaluate(async () => {
  const out = [];
  const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const R = await import('/src/systems/Renown.js');
  const D = await import('/src/data/renown.js');
  const Cr = await import('/src/systems/Crown.js');
  const CrD = await import('/src/data/crown.js');
  const J = await import('/src/systems/Justice.js');
  const B = await import('/src/data/buildings.js');
  const L = await import('/src/data/landscape.js');
  const SD = await import('/src/data/storyCards.js');
  const SC = await import('/src/systems/StoryCards.js');
  const TS = await import('/src/systems/TownStatus.js');
  const RC = await import('/src/ui/components/renownCards.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { CONFIG } = await import('/src/config.js');
  const { Random } = await import('/src/utils/random.js');
  const { sim } = window;
  let st = game.state;
  let sc = game.scenes.current;
  const E = game.events;
  const fixed = (v) => Object.assign(new Random(1), { next: () => v });
  const fakeCase = (id, day, verdict = null) => ({ id, day, minute: (day - 1) * 1440 + 600, crime: 'pantryRation', status: verdict ? 'closed' : 'open', offenderId: null, offenderName: 'X', closedDay: day, ...(verdict ? { verdict } : {}) });
  sim.give({ wood: 999, stone: 999, food: 400, gold: 3000, iron: 200, cloth: 60, gears: 5 });

  // ---- 1. veri
  c('veri: şalter renown açık, tohum + 44 izole (42 suç, 43 saray), dört kademe (Gözde ≥ 90), kart tablosu 6, kayıt sürümü 41',
    ENGINES.renown === true && D.RENOWN_SEED_OFFSET === 44 && D.RENOWN_LEVELS.length === 4 && D.RENOWN_LEVELS[0].key === 'favored' && D.RENOWN_LEVELS[0].min === 90 && SD.STORY_TABLE_VERSION === 6 && CONFIG.SAVE_VERSION === 41 && sc.renown.dice !== sc.crime.dice && sc.renown.dice !== sc.court.dice);

  // ---- 2. katkıların yönü
  st.time.day = 20;
  st.town.tier = 3;
  st.justice = J.emptyJustice();
  const base = R.renownTarget(st);
  for (let i = 0; i < 6; i++) st.justice.cases.push(fakeCase(100 + i, 19));
  const crimes = R.renownTarget(st);
  st.justice.cases = [];
  c('suç oranı ↑ → hedef ↓ (katkı sınırlı)', crimes.target < base.target && crimes.values.crime < base.values.crime && crimes.values.crime >= D.RENOWN_TARGET.crime.min, `${base.target} → ${crimes.target}`);
  const fair = (id) => fakeCase(id, 19, { by: 'court', band: 'fair', kind: 'warning' });
  st.justice.log = [fair(1), fair(2), fair(3), fair(4)];
  const allFair = R.renownTarget(st);
  st.justice.log = [fair(1), fair(2), fakeCase(3, 19, { by: 'court', band: 'harsh' }), fakeCase(4, 19, { by: 'court', band: 'lenient' })];
  const halfFair = R.renownTarget(st);
  c('adil oran ↑ → hedef ↑', allFair.target > halfFair.target && allFair.values.justice > halfFair.values.justice, `${halfFair.values.justice} → ${allFair.values.justice}`);
  st.justice.log = [fair(1), fair(2), fair(3), fakeCase(4, 19, { by: 'court', band: 'cruel' })];
  const cruel = R.renownTarget(st);
  c('zalim karar → belirgin ↓ (her biri −4, ayrı katkı)', cruel.values.cruel === D.RENOWN_TARGET.justice.cruelEach && cruel.target < allFair.target - 4, `${cruel.target} / ${allFair.target}`);
  st.justice.log.push({ ...fakeCase(9, 19, { by: 'court', band: 'lax', impunity: 6, stale: true }) });
  const stale = R.renownTarget(st);
  c('sürüncemede dava ve cezasızlık → ↓', stale.values.stale < 0 && stale.values.impunity < 0, JSON.stringify(stale.values));
  st.justice = null;
  const tr0 = st.trust.value;
  st.trust.value = 40;
  const lowT = R.renownTarget(st);
  st.trust.value = 100;
  const hiT = R.renownTarget(st);
  st.trust.value = tr0;
  c('güven ↑ → hedef ↑ (tek başına tavan: +6)', hiT.target > lowT.target && hiT.values.trust === D.RENOWN_TARGET.trust.max, `${lowT.target} → ${hiT.target}`);
  const adults = st.characters.filter((x) => !x.role && !x.isChild);
  const loy0 = adults.map((x) => x.loyalty);
  for (const x of adults) x.loyalty = -60;
  const bitter = R.renownTarget(st);
  adults.forEach((x, i) => (x.loyalty = loy0[i]));
  c('Halkın Nabzı: Kırgın pay → ↓ (en çok −10)', bitter.values.pulse === D.RENOWN_TARGET.pulse.min && bitter.target < R.renownTarget(st).target, `${bitter.values.pulse}`);
  c('eğitim ve kulüp yerleri: 32.4 / 32.5 için hazır, değer 0, ağırlık 0 değil', R.renownEducation(st) === 0 && R.renownClubs(st) === 0 && base.values.education === 0 && base.values.clubs === 0 && D.RENOWN_TARGET.education.weight > 0 && D.RENOWN_TARGET.clubs.weight > 0);
  const t3 = R.renownTarget(st).values.tier;
  st.town.tier = 1;
  const t1 = R.renownTarget(st).values.tier;
  st.town.tier = 3;
  c('kasaba seviyesi küçük taban artışı (Mezra 0, Kasaba +2)', t1 === 0 && t3 === 2);

  // ---- 3. kayma
  c('kayma: boşluğun %20si, en çok ±4/gün', R.renownStep(50, 60) === 2 && R.renownStep(50, 90) === 4 && R.renownStep(90, 20) === -4 && R.renownStep(50, 50) === 0, `${R.renownStep(50, 60)} ${R.renownStep(50, 90)}`);
  st.crown.reputation = 50;
  const early = sc.renown.newDay(5);
  c('ilk 5 gün kayma yok', early === null && st.crown.reputation === 50);
  st.time.day = 20;
  const tg = R.renownTarget(st).target;
  const d1 = sc.renown.newDay(20);
  c('gün dönümünde hedefe doğru kayar; nedenler ve Arşiv satırı yazılır', d1 && Math.abs(st.crown.reputation - (50 + R.renownStep(50, tg))) < 0.051 && st.renown.reasons.length > 0 && st.renown.reasons.length <= 3 && st.renown.drift.target === tg, `${st.crown.reputation} hedef ${tg} ${JSON.stringify(st.renown.reasons)}`);
  st.crown.reputation = 50;
  st.crown.nextLevyAt = st.totalMinutes;
  sc.crown.collectLevy();
  c('olay değişimleri anında etki eder (vergi +8), kayma onları silmez', st.crown.reputation === 58);

  // ---- 4. kademeler ve etkiler
  const g = Cr.reputationLevel(92);
  c('Kraliyet Gözdesi: vergi ×0,85, ödül ×1,25; Saygın / Sadık / Şüpheli değerleri aynı', g.key === 'favored' && g.levy === 0.85 && g.reward === 1.25 && Cr.reputationLevel(80).key === 'good' && Cr.reputationLevel(80).levy === CrD.REPUTATION.levels[0].levy && Cr.reputationLevel(20).levy === 1.2 && Cr.reputationLevel(20).reward === 0.9);
  st.crown.reputation = 50;
  const lv50 = Cr.levyAmount(st);
  st.crown.reputation = 95;
  const lv95 = Cr.levyAmount(st);
  const rw95 = sc.crown.rewardFor('shipyard').gold;
  st.crown.reputation = 50;
  c('vergi ve ödül çarpanları kademeye göre', lv95 < lv50 && rw95 > sc.crown.rewardFor('shipyard').gold, `${lv50}/${lv95}`);
  const newcomer = { id: 777, skills: {} };
  sc.renown.welcome(newcomer);
  st.crown.reputation = 80;
  const nc2 = { id: 778, skills: {} };
  sc.renown.welcome(nc2);
  const sk = R.immigrantSkillFor(nc2);
  c('göç: Saygın ve üstünde yeni gelen bir meslekte Kalfa gelir; Sadık\'ta değişmez', Object.keys(newcomer.skills).length === 0 && nc2.skills[sk] === 480, JSON.stringify(nc2.skills));
  st.crown.decree = null;
  st.crown.reputation = 30;
  const dS = sc.crown.openDecree('shipyard');
  const spanS = dS.deadline - dS.createdAt;
  st.crown.decree = null;
  st.crown.reputation = 50;
  const dO = sc.crown.openDecree('shipyard');
  const spanO = dO.deadline - dO.createdAt;
  st.crown.decree = null;
  c('Şüpheli: ferman süresi 3 günden 2 güne iner (para cezası değil)', spanS === 2880 && spanO === 4320, `${spanS} ${spanO}`);

  // ---- 5. kademe geçişi: kart ve günlük
  st.crown.reputation = 50;
  sc.renown.checkTier();
  let tierEv = null;
  const offT = E.on('renown:tier', (p) => (tierEv = p));
  const j0 = st.journal.length;
  st.crown.reputation = 93;
  sc.renown.checkTier();
  offT();
  const card = tierEv && SC.makeCard('renown:tier', tierEv, { state: st });
  c('kademe geçişi: Gözde\'ye çıkış kartı (öncelik 4) ve Kasaba Günlüğü satırı', tierEv?.key === 'favored' && tierEv.up && /saygıyla anılıyor/.test(tierEv.text) && card?.priority === 4 && st.journal.length === j0 + 1 && st.renown.tiers.at(-1).key === 'favored', tierEv?.text);
  const nT = st.renown.tiers.length;
  st.crown.reputation = 88.5;
  sc.renown.checkTier();
  const held = st.renown.tiers.length === nT && st.renown.rank === 3;
  st.crown.reputation = 20;
  sc.renown.checkTier();
  c('düşüşte de geçiş yazılır (Şüpheli); eşiğin 3 puan içindeki iniş bildirim üretmez', held && st.renown.tiers.at(-1).key === 'bad' && !st.renown.tiers.at(-1).up);

  // ---- 6. gizli yapılar: kilitliyken yok
  const menu = [...document.querySelectorAll('.build-item')];
  const btn = (type) => menu.find((b) => b.dataset.type === type);
  E.emit('ui:setTool', { tool: 'build' });
  sim.step(2);
  game.ui.render();
  c('kilitliyken: inşa menüsünde düğme ve sekme gizli, globalBlock reddeder', ['peaceFountain', 'royalRoseGarden', 'royalArchive'].every((t) => btn(t)?.hidden && /Kraliyet Lütfu/.test(sc.construction.globalBlock(t) ?? '')) && document.querySelector('.build-tab[data-tab="royal"]')?.hidden === true);
  st.town.tier = 2;
  st.renown.gozdeStreak = 10;
  st.renown.lastGrantDay = null;
  c('koşul: Kasaba seviyesi ve (Gelişmiş Şehir ya da Altın Çağ) yoksa zar yok', !R.grantEligible(st));
  st.town.tier = 4;
  st.renown.gozdeStreak = 5;
  c('koşul: art arda 6 gün Gözde yoksa zar yok', !R.grantEligible(st));
  st.renown.gozdeStreak = 6;
  c('koşullar tutunca zar atılabilir', R.grantEligible(st, 30));
  st.crown.reputation = 95;
  sc.renown.dice = fixed(0.5);
  const miss = sc.renown.rollGrant(30);
  sc.renown.dice = fixed(0);
  let grantEv = null;
  const offG = E.on('renown:grant', (p) => (grantEv = p));
  const g1 = sc.renown.rollGrant(30);
  offG();
  c('zar (%15): 0,5 tutmaz, 0 tutar; lütuf yazılır, olay ve Lütufname kartı', miss === null && g1 && st.renown.grants.length === 1 && st.renown.lastGrantDay === 30 && grantEv?.key === g1.key && SC.makeCard('renown:grant', grantEv, { state: st })?.action?.type === 'letter', g1?.key);
  c('aralık kuralı: 12 gün dolmadan ikinci lütuf yok', !R.grantEligible(st, 41) && sc.renown.rollGrant(41) === null && R.grantEligible(st, 42));
  for (const t of D.ROYAL_TYPES) if (!R.royalGranted(st, t)) sc.renown.grant(t, 42);
  st.crown.reputation = 10;
  c('kalıcılık: itibar düşse de lütuf geri alınmaz; üçü açılınca zar yok', D.ROYAL_TYPES.every((t) => R.royalGranted(st, t)) && !R.grantEligible(st, 80));
  sim.step(2);
  game.ui.render();
  c('lütuf gelince: menüde Kraliyet Lütfu sekmesi ve düğmeler, globalBlock serbest', document.querySelector('.build-tab[data-tab="royal"]')?.hidden === false && ['peaceFountain', 'royalRoseGarden', 'royalArchive'].every((t) => btn(t)?.dataset.tab === 'royal' && sc.construction.globalBlock(t) === null) && B.BUILDINGS.peaceFountain.category === 'Kraliyet Lütfu');
  E.emit('ui:setTool', { tool: 'select' });
  E.emit('ui:openRoyalLetter', { key: 'peaceFountain' });
  sim.step(1);
  const letter = document.querySelector('.royal-letter');
  c('Kraliyet Lütufnamesi penceresi açılır (mühür, metin; oyunu durdurmaz)', letter && !letter.hidden && /Barış Çeşmesi/.test(letter.textContent) && letter.querySelector('.royal-letter-seal') && !st.time.paused);
  letter?.querySelector('.modal-close')?.click();

  // ---- 7. etkiler
  st.crown.reputation = 60;
  const someone = st.characters.find((x) => !x.role && !x.isChild && J.crimeCandidate(st, x));
  const risk0 = J.crimeRisk(st, someone);
  const fountain = sim.place('peaceFountain');
  const risk1 = J.crimeRisk(st, someone);
  c('Barış Çeşmesi (2x2, tek): suç riski ×0,85 (Justice faktör listesinde `renown`)', fountain?.type === 'peaceFountain' && Math.abs(risk1 / risk0 - 0.85) < 1e-9 && J.riskFactors(st, someone).renown === 0.85 && /yalnızca bir/.test(sc.construction.globalBlock('peaceFountain') ?? ''), `${risk0} → ${risk1}`);
  const bonus0 = TS.townHappinessBonus(st);
  const garden = sim.place('royalRoseGarden');
  c('Gül Bahçesi (3x3): refah +2, yüksek estetik, aşk ×1,2', garden && TS.townHappinessBonus(st) === bonus0 + 2 && L.AESTHETIC.values.royalRoseGarden >= 6 && R.renownRomanceFactor(st) === 1.2);
  const academy = sim.place('academy');
  st.research.active = { id: 'gears', progress: 0 };
  sc.research.work(academy, 100);
  const without = st.research.active?.progress ?? 0;
  const archive = sim.place('royalArchive');
  st.research.active = { id: 'gears', progress: 0 };
  sc.research.work(academy, 100);
  const withA = st.research.active?.progress ?? 0;
  st.research.active = null;
  c('Kraliyet Arşivi (2x3): araştırma hızı ×1,15; Tarihçe\'de Kraliyet Defteri', archive && Math.abs(withA / without - 1.15) < 1e-9 && RC.royalLedger(st)?.title === 'Kasabanın Kraliyet Defteri', `${withA}/${without}`);
  st.crown.reputation = 20;
  const weakRisk = J.crimeRisk(st, someone);
  c('Şüpheli\'de etkiler yarıya iner (risk ×0,925, refah +1, araştırma ×1,075; panelde yazılı)', Math.abs(weakRisk / risk0 - 0.925) < 1e-9 && TS.townHappinessBonus(st) === bonus0 + 1 && Math.abs(R.renownResearchFactor(st) - 1.075) < 1e-9 && RC.royalBuildingLines(st, 'peaceFountain').some((l) => /yarıya/.test(l)));
  st.crown.reputation = 60;

  // ---- 8. dava sonucu satırı
  st.justice = J.emptyJustice();
  st.justice.log = [fair(1), fair(2), fair(3), fakeCase(4, st.time.day, { by: 'court', band: 'cruel' })];
  const imp = R.verdictRenownImpact(st, st.justice.log[3]);
  c('dava sonucu: zalim kararın hedefe etkisi eksi ("yarından itibaren hedef −N")', imp <= -4, `${imp}`);
  st.justice = null;

  // ---- 9. rozet, ipucu, Belediye satırı, Arşiv
  sim.step(2);
  game.ui.render();
  const badge = document.querySelector('.hud-renown');
  c('üst çubuk rozeti: taç, %, kademe adı, yön oku; ipucunda hedef ve nedenler', badge && !badge.hidden && /%\d+/.test(badge.textContent) && badge.querySelector('.renown-arrow') && /Hedef %\d+/.test(badge.title ?? badge.dataset.tip ?? '') && /Nedenler/.test(badge.title ?? ''), badge?.title);
  const snap = (await import('/src/systems/StatsSystem.js')).townSnapshot(st);
  c('Arşiv günlük özetinde itibar (reputation) ve Belediye satırının dökümü', snap.reputation === Math.round(st.crown.reputation) && RC.renownLines(st).length >= 3);

  // ---- 10. kaydet → yükle, determinizm
  st.renown.reasons = [{ key: 'crime', label: 'Suç oranı düşük', value: 5 }];
  const before = JSON.stringify(st.renown);
  const repB = st.crown.reputation;
  E.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  E.emit('ui:load');
  st = game.state;
  sc = game.scenes.current;
  c('kaydet → yükle: state.renown ve itibar aynı, sürüm 41', raw.version === 41 && JSON.stringify(st.renown) === before && st.crown.reputation === repB, `${before} ||| ${JSON.stringify(st.renown)}`);
  const a1 = JSON.stringify(R.renownTarget(st));
  const a2 = JSON.stringify(R.renownTarget(st));
  c('determinizm: hedef saf (iki çağrı aynı), lütuf zarı ayrı üreteç', a1 === a2 && sc.renown.dice instanceof Random);
  return out;
})));
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
