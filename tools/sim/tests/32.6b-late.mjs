// Aşama 32.6b B testleri: geç oyun görünürlüğü (dört yeni hedef, iki rehber kartı, seviye ödül satırları).
// Kullanım: node tools/sim/tests/32.6b-late.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.6b-late
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const { browser, page, errors } = await openGame({ seed: 5 });
results.push(...(await page.evaluate(async () => {
  const out = [];
  const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const MS = await import('/src/data/milestones.js');
  const MSys = await import('/src/systems/MilestoneSystem.js');
  const Money = await import('/src/systems/Money.js');
  const G = await import('/src/systems/Guide.js');
  const GD = await import('/src/data/guide.js');
  const T = await import('/src/data/town.js');
  const { ENGINES } = await import('/src/systems/Engines.js');
  const { GameState } = await import('/src/state/GameState.js');
  const { CONFIG } = await import('/src/config.js');
  const { sim } = window;
  const st = game.state;
  const sc = game.scenes.current;
  sim.give({ wood: 500, stone: 500, food: 500, gold: 500 });
  sim.step(60);
  const NEW = ['justiceServed', 'firstClub', 'firstGraduate', 'royalFavorite'];
  const goal = (id) => MS.MILESTONES.find((m) => m.id === id);
  const prog = (id) => MSys.milestoneProgress(goal(id), st);
  const withEngines = (keys, fn) => {
    const was = Object.fromEntries(keys.map((k) => [k, ENGINES[k]]));
    for (const k of keys) ENGINES[k] = false;
    try { return fn(); } finally { for (const k of keys) ENGINES[k] = was[k]; }
  };

  // ---- B1 hedefler
  const ids = MSys.activeMilestones().map((m) => m.id);
  c('B1: hedef listesinin sonunda dört geç oyun hedefi (Pearl\'ün ardından: Adalet, Kulüp, Mezun, Gözde); toplam 18', ids.length === 18 && ids.slice(-5).join() === 'pearl,justiceServed,firstClub,firstGraduate,royalFavorite', ids.slice(-5).join());
  c('B1: ödül alanı yok (altın değil, hiçbir ödül), her biri kendi şalterine bağlı', NEW.every((id) => !('reward' in goal(id)) && !('gold' in goal(id)) && typeof goal(id).engine === 'string'), NEW.map((id) => goal(id).engine).join());
  c('B1: şalter kapalıyken ilgili hedef listede yok (court / clubs / university / renown)', [['court', 'justiceServed'], ['clubs', 'firstClub'], ['university', 'firstGraduate'], ['renown', 'royalFavorite']].every(([k, id]) => withEngines([k], () => !MSys.activeMilestones().some((m) => m.id === id) && MSys.activeMilestones().length === 17)), '');
  c('B1: justice kapalıysa court da kapalı sayılır; hedef gizlenir', withEngines(['justice'], () => !MSys.activeMilestones().some((m) => m.id === 'justiceServed')), '');
  c('B1: bütün 32 şalterleri kapalıyken liste 14 (eski dört + ara hedefler)', withEngines(['justice', 'court', 'university', 'clubs', 'renown'], () => MSys.activeMilestones().length === 14), '');

  // Adaleti Tesis Et: saray + 3 adil karar
  st.buildings = st.buildings.filter((b) => b.type !== 'courthouse');
  const j0 = prog('justiceServed');
  st.justice ??= { cases: [], log: [], records: {}, stats: { committed: 0, caught: 0, unsolved: 0, byType: {} }, nextId: 1 };
  st.justice.stats.court = { fair: 5, harsh: 0, cruel: 0, lenient: 0, lax: 0, stale: 0, exiled: 0, revealed: 0, decided: 5, waitMinutes: 0 };
  const j1 = prog('justiceServed');
  st.buildings.push({ id: 9901, type: 'courthouse', functional: true });
  const j2 = prog('justiceServed');
  st.justice.stats.court.fair = 2;
  const j3 = prog('justiceServed');
  st.justice.stats.court.fair = 3;
  const j4 = prog('justiceServed');
  c('B1: Adaleti Tesis Et — saray yokken 0, yalnızca adil karar (saray olmadan) 3/4 sayılır ama tamamlanmaz; saray + 3 adil karar = 4/4', j0.current === 0 && j1.current === 3 && j2.current === 4 && j3.current === 3 && j4.current === 4 && j4.target === 4 && /Saray 1\/1 · Adil karar 3\/3/.test(j4.detail), JSON.stringify([j0, j1.current, j2.current, j3.current, j4.current]));
  st.justice.stats.court.fair = 2;
  sc.milestones.check();
  const noEarly = !st.milestones.justiceServed;
  st.justice.stats.court.fair = 3;
  let toasted = '';
  const off = game.events.on('toast', (t) => { if (/Adaleti Tesis Et/.test(t.text ?? '')) toasted = t.text; });
  sc.milestones.check();
  off?.();
  c('B1: üç adil karar olunca hedef tamamlanır (iki kararda değil), tebrik bildirimi', noEarly && Boolean(st.milestones.justiceServed) && /Hedef tamamlandı/.test(toasted), toasted);

  // Kasabanın İlk Kulübü
  st.buildings = st.buildings.filter((b) => !['gardenClub', 'sewingClub', 'paintingClub'].includes(b.type));
  st.clubs = {};
  const k0 = prog('firstClub');
  st.buildings.push({ id: 9902, type: 'sewingClub', functional: true });
  const k1 = prog('firstClub');
  st.clubs.sewingClub = { realized: 0, planned: 2 };
  const k2 = prog('firstClub');
  st.clubs.sewingClub.realized = 1;
  const k3 = prog('firstClub');
  c('B1: Kasabanın İlk Kulübü — hobi evi 1/2, ilk gerçekleşen buluşma 2/2 (planlanan buluşma sayılmaz)', k0.current === 0 && k1.current === 1 && k2.current === 1 && k3.current === 2 && /Hobi evi 1\/1 · İlk buluşma 1\/1/.test(k3.detail), JSON.stringify([k0.current, k1.current, k2.current, k3.current]));

  // İlk Darülfünun Mezunu
  st.university = undefined;
  const u0 = prog('firstGraduate');
  st.university = { admitted: 3, graduated: 0 };
  const u1 = prog('firstGraduate');
  st.university.graduated = 4;
  const u2 = prog('firstGraduate');
  c('B1: İlk Darülfünun Mezunu — mezun sayısı 0 → 0/1, kabul edilen sayılmaz, ilk mezun 1/1 (üstü 1\'e kırpılır)', u0.current === 0 && u1.current === 0 && u2.current === 1 && u2.target === 1, JSON.stringify([u0.current, u1.current, u2.current]));

  // Kraliyet Gözdesi
  st.crown.reputation = 89.9;
  const r1 = prog('royalFavorite');
  st.crown.reputation = 90;
  const r2 = prog('royalFavorite');
  st.crown.reputation = 100;
  const r3 = prog('royalFavorite');
  c('B1: Kraliyet Gözdesi — 89,9 → 89/90 (tamamlanmaz), 90 ve üstü → 90/90; ayrıntıda itibar', r1.current === 89 && r2.current === 90 && r3.current === 90 && r3.target === 90 && /Krallık İtibarı %100\/90/.test(r3.detail), JSON.stringify([r1.current, r2.current, r3.current]));

  // Sıradaki engel satırı
  st.buildings = st.buildings.filter((b) => b.id < 9900);
  st.university = undefined;
  st.clubs = {};
  const blockers = {
    justice: Money.milestoneBlocker(st, goal('justiceServed'), { current: 0, target: 4 }),
    club: Money.milestoneBlocker(st, goal('firstClub'), { current: 0, target: 2 }),
    grad: Money.milestoneBlocker(st, goal('firstGraduate'), { current: 0, target: 1 }),
    royal: Money.milestoneBlocker(st, goal('royalFavorite'), { current: 0, target: 90 }),
  };
  c('B1: "Sıradaki" engel satırı dört hedefte de dolu (yapı bedeli ya da ne yapılacağı)', Object.values(blockers).every((b) => typeof b === 'string' && b.length > 10) && /Adalet Sarayı/.test(blockers.justice) && /Bahçecilik Kulübü/.test(blockers.club), JSON.stringify(blockers));

  // Hedefler penceresi: 18 satır, yeni hedefler çizilir
  for (const id of Object.keys(st.milestones)) delete st.milestones[id];
  game.events.emit('ui:toggleGoals');
  await new Promise((r) => setTimeout(r, 700));
  game.ui.render();
  const rows = [...document.querySelectorAll('.goals-panel .goal-row[data-goal]')];
  const late = NEW.map((id) => rows.find((r) => r.dataset.goal === id));
  c('B1: Hedefler penceresinde 18 satır; dört geç oyun hedefi satırda ad, açıklama ve ilerleme ayrıntısıyla', rows.length === 18 && late.every(Boolean) && late.every((r) => r.querySelector('.goal-name')?.textContent.length > 5 && r.querySelector('.goal-description')?.textContent.length > 10), rows.length);
  game.events.emit('ui:toggleGoals');

  // ---- B2 rehber
  c('B2: rehber tablo sürümü 7, 21 adım; iki yeni adım tabloda', GD.GUIDE_TABLE_VERSION === 7 && GD.GUIDE_STEPS.length === 21 && ['townGrown', 'cityGrown'].every((id) => GD.GUIDE_STEPS.some((s) => s.id === id)), '');
  const tg = GD.GUIDE_STEPS.find((s) => s.id === 'townGrown');
  const cg = GD.GUIDE_STEPS.find((s) => s.id === 'cityGrown');
  c('B2: Kasaba kartının metni tam ("Kasaban büyüdü: Adalet Sarayı ve hobi evleri artık kurulabilir."), tek cümleye yakın', tg.text.replace(/\*\*/g, '') === 'Kasaban büyüdü: Adalet Sarayı ve hobi evleri artık kurulabilir.' && /Darülfünun/.test(cg.text), tg.text);
  const ctx = (tier, buildings = []) => ({ state: { ...st, town: { ...st.town, tier }, buildings }, guide: { done: [] }, facts: {} });
  const tier2 = G.CONDITIONS.townGrown.when(ctx(2));
  const tier3 = G.CONDITIONS.townGrown.when(ctx(3));
  const tier3built = G.CONDITIONS.townGrown.when(ctx(3, [{ type: 'courthouse', functional: true }]));
  const tier3club = G.CONDITIONS.townGrown.done(ctx(3, [{ type: 'paintingClub', functional: false }]));
  c('B2: Kasaba kartı Köy\'de görünmez, Kasaba\'da görünür, saray (ya da hobi evi) kurulunca biter', !tier2 && tier3 && !tier3built && tier3club, JSON.stringify([tier2, tier3, tier3built, tier3club]));
  const c3 = G.CONDITIONS.cityGrown.when(ctx(3));
  const c4 = G.CONDITIONS.cityGrown.when(ctx(4));
  const c4built = G.CONDITIONS.cityGrown.when(ctx(4, [{ type: 'university', functional: false }]));
  c('B2: Gelişmiş Şehir kartı Kasaba\'da görünmez, Şehir\'de görünür, Darülfünun kurulunca (şantiye dahil) biter', !c3 && c4 && !c4built && G.CONDITIONS.cityGrown.done(ctx(4, [{ type: 'university' }])), JSON.stringify([c3, c4, c4built]));
  const offs = withEngines(['court', 'clubs'], () => ({ w: G.CONDITIONS.townGrown.when(ctx(3)), d: G.CONDITIONS.townGrown.done(ctx(3, [{ type: 'courthouse' }])) }));
  const offu = withEngines(['university'], () => ({ w: G.CONDITIONS.cityGrown.when(ctx(4)), d: G.CONDITIONS.cityGrown.done(ctx(4, [{ type: 'university' }])) }));
  const onlyClubs = withEngines(['court'], () => G.CONDITIONS.townGrown.when(ctx(3)));
  c('B2: şalterler kapalıyken kartlar hiç görünmez ve kendiliğinden tamamlanmaz (kayıt aynı kalır); yalnız court kapalıysa hobi evleri için görünür', !offs.w && !offs.d && !offu.w && !offu.d && onlyClubs, JSON.stringify([offs, offu, onlyClubs]));
  // Gerçek rehber akışı: Kasaba'da kart çıkar, "Anladım" ile kalkar
  const gs = sc.guide ?? game.scenes.current.guideSystem;
  c('B2: rehber geri yükleme eski kayıtta bilinmeyen adımı sessizce atar, yeni adımlar tanınır', G.restoreGuide({ done: ['move', 'townGrown', 'cityGrown', 'yok'], off: false }, 3).done.join() === 'move,townGrown,cityGrown', G.restoreGuide({ done: ['move', 'townGrown', 'yok'] }).done.join());

  // ---- B3 seviye ödül satırları
  const town = T.TOWN_TIERS[2].perks;
  const city = T.TOWN_TIERS[3].perks;
  c('B3: Kasaba ödüllerinde Adalet Sarayı ve hobi evleri, Gelişmiş Şehir ödüllerinde Darülfünun satırı', town.some((p) => /Adalet Sarayı/.test(p)) && town.some((p) => /Hobi evleri/.test(p) && /Bahçecilik/.test(p)) && city.some((p) => /Darülfünun/.test(p)), `${town.length} ${city.length}`);
  const townOff = withEngines(['court', 'clubs'], () => T.TOWN_TIERS[2].perks);
  const cityOff = withEngines(['university'], () => T.TOWN_TIERS[3].perks);
  c('B3: şalterler kapalıyken satırlar yok (eski ödül listeleri aynen): Kasaba 7, Gelişmiş Şehir 5 (açıkken 9 ve 6)', townOff.length === 7 && cityOff.length === 5 && town.length === 9 && city.length === 6, `${townOff.length} ${cityOff.length} ${town.length} ${city.length}`);
  c('B3: ilk ödül satırı değişmedi (seviye atlama bildirimi perks[0]\'ı okur)', town[0] === townOff[0] && city[0] === cityOff[0], '');

  // ---- E. oyun günlüğü 6'dan küçük düzeltmeler (metin / ipucu)
  const JU = await import('/src/systems/Justice.js');
  const JD = await import('/src/data/justice.js');
  const RC = await import('/src/ui/components/renownCards.js');
  const baseCase = { crime: 'marketFruit', motive: 'hunger', remorse: 'confess', statement: { offender: 0 }, stolen: null, context: { hungry: false } };
  const fedText = JU.statementText(baseCase);
  const hungryText = JU.statementText({ ...baseCase, context: { hungry: true } });
  const hungerLines = JD.STATEMENTS.hunger.confess;
  const temptLines = JD.STATEMENTS.temptation.confess;
  c('E: ifade açlıktan söz ederken dosyada "Aç mıydı: Hayır" olmaz — karnı doymuş sanığın ifadesi açlık satırlarından seçilmez', temptLines.some((l) => l.replace(/\{loot\}/g, 'onu') === fedText) && !hungerLines.includes(fedText) && hungerLines.some((l) => l.replace(/\{loot\}/g, 'onu') === hungryText), `${fedText} | ${hungryText}`);
  const lines = RC.renownLines(st);
  c('E: itibar ipucunda ok geçmişi söyler ("son 24 saatte yükseldi / düştü / durgun kaldı"), "bu gece" ayrı satırda gelecektir', /son 24 saatte (yükseldi|düştü|durgun kaldı)/.test(lines[0]) && /bu gece|kayma/.test(lines[1]), lines.slice(0, 2).join(' / '));

  // ---- kayıt
  st.milestones.justiceServed = { day: 12, hour: 9, minute: 0 };
  const json = JSON.parse(JSON.stringify({ ...st.toJSON(), version: CONFIG.SAVE_VERSION, terrain: [] }));
  const back = new GameState();
  back.restore(json);
  c('Kayıt: tamamlanan geç oyun hedefi gidiş-dönüşte korunur; sürüm 41 kalır', back.milestones.justiceServed?.day === 12 && CONFIG.SAVE_VERSION === 41, '');
  return out;
})));
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
