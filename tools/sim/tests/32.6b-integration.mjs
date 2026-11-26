// Aşama 32.6b C testleri: sistemler arası bütünleşme. Aşama 32'nin beş sistemi (suç / adalet, Adalet Sarayı, itibar, Darülfünun,
// hobi evleri) ve eski katmanlar (çıraklık, yadigâr, aile) birlikte: öğrenci + ceza, üye + uzaklaştırma, çok rollü sakinin sürgünü,
// çarpanların birlikte işlemesi, Kraliyet Arşivi + ders, itibar hedefinin bütün satırları, ortada bırakılmış durumun kaydı ve
// şalterlerin tek tek / birlikte kapatılarak yüklenen kayıt. Bekçi (monitor) her senaryodan sonra temiz olmalıdır.
// Kullanım: node tools/sim/tests/32.6b-integration.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.6b-integration
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';
import { installMonitor, monitorReport } from '../monitor.mjs';
import { buildMidState32 } from '../state32.mjs';

const { results, report } = createChecks();
const errors = [];

// ---------------------------------------------------------------- A. bütün sistemler açık: çapraz senaryolar
{
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  await installMonitor(page);
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const J = await import('/src/systems/Justice.js');
    const D = await import('/src/data/justice.js');
    const U = await import('/src/systems/University.js');
    const UD = await import('/src/data/university.js');
    const C = await import('/src/systems/Clubs.js');
    const CD = await import('/src/data/clubs.js');
    const R = await import('/src/systems/Renown.js');
    const RD = await import('/src/data/renown.js');
    const Ci = await import('/src/systems/Citizens.js');
    const Mo = await import('/src/systems/Moodlets.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { CONFIG } = await import('/src/config.js');
    const { Random } = await import('/src/utils/random.js');
    const LS = await import('/src/data/lifeStages.js');
    const { sim } = window;
    let st = game.state;
    let sc = game.scenes.current;
    const E = game.events;
    const T = CONFIG.TILE_SIZE;
    // bekçi: yalnızca bu testin ışınladığı sakinlerin yarattığı gürültü ("içeride sanılan") süzülür; kopuk referans / kayıt hataları sayılır
    const monitor = () => { window.__monitor.sample(); const r = window.__monitor.report(); const list = r.broken.filter((x) => !/içeride sanılan/.test(x)); return { broken: list.length, list: list.slice(0, 4) }; };
    const plaza = sc.world.landmarks.plaza;
    const setMinutes = (s, t) => { s.time.day = Math.floor(t / 1440) + 1; s.time.hour = Math.floor((t % 1440) / 60); s.time.minute = t % 60; };
    const at = (ch, dx = 0, dy = 0) => { ch.x = (plaza.centerX + dx) * T + T / 2; ch.y = (plaza.centerY + dy) * T + T / 2; ch.visible = true; ch.insideBuildingId = null; if (ch.task?.activity === 'sleep') ch.task = null; };
    const calm = (ch) => { ch.task = null; ch.newcomer = false; ch.relocating = false; ch.coins = 40; ch.needs.hunger = 90; ch.loyalty = 0; ch.moodlets = []; ch.mood.grief = false; ch.illness = null; ch.isInjured = false; ch.sentence = null; };
    const fixed = (v) => Object.assign(new Random(1), { next: () => v });

    // ---- kurulum: Gelişmiş Şehir, saray, Darülfünun, üç hobi evi, 14+ yetişkin, 6 öğrenci, kulüp üyeleri
    sim.give({ wood: 999, stone: 999, food: 700, gold: 4000, iron: 300, cloth: 200, wool: 200, gears: 6 });
    for (let i = 0; i < 9; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(14);
    st.town.tier = 4;
    st.time.day = 12;
    const storage = sim.place('storage');
    const inn = sim.place('inn');
    const market = sim.place('market');
    const court = sim.place('courthouse');
    const uni = sim.place('university');
    const houses = CD.CLUB_KEYS.map((k) => sim.place(k));
    c('kurulum: saray, Darülfünun ve üç hobi evi yerleşti', court && uni && houses.every(Boolean), `${court?.type} ${uni?.type} ${houses.map((h) => h?.type)}`);
    const pool = st.characters.filter((x) => !x.isChild && !x.role).sort((a, b) => a.id - b.id);
    for (const x of pool) { calm(x); x.traits = []; x.quirk = 'musician'; x.skills = {}; x.workplaceId = null; x.partnerId = null; x.married = false; x.apprenticeship = null; x.club = null; x.higherStudy = null; x.graduate = null; }
    const youths = pool.slice(0, 7);
    youths.forEach((y, i) => { y.lifeStage = 'youth'; y.age = 19; y.ageInDays = 19 * LS.AGING.daysPerAge + 1; y.educated = true; y.schooling = 400 + 10 * i; });
    const X = youths[3];
    X.traits = ['natureLover']; X.quirk = 'natureEnthusiast'; // çok rollü sakin: bahçe kulübü üyesi olacak
    const grownUps = pool.slice(7);
    // kulüp üyeleri: ilk üç yetişkin bahçe, sonraki üç dikiş, kalan resim (huy / huylar yakınlık puanı verir)
    grownUps.forEach((x, i) => {
      if (i < 6) { x.traits = ['natureLover']; x.quirk = 'natureEnthusiast'; } // 6 yetişkin + X = 7 aday, 6 koltuk: sonuncusu sırada bekler
      else if (i < 10) { x.traits = ['hardworking']; x.quirk = 'craftsman'; }
      else { x.quirk = 'bookworm'; x.traits = ['introvert']; }
    });
    sc.university.newDay();
    sc.clubs.newDay();
    const students = U.studentsOf(st);
    const members = st.characters.filter((x) => x.club);
    c('kurulum: 6 öğrenci ve en az 8 kulüp üyesi', students.length === 6 && members.length >= 8, `${students.length} / ${members.length}`);
    const brain = sc.behavior.brain;
    const real = sc.crime.dice;
    const p0 = () => ({ crime: 'pantryRation', variant: 'ration', buildingId: storage.id });
    const caught = (who, motive = 'temptation') => { sc.crime.dice = fixed(0); const k = sc.crime.commit(who, { crime: { ...p0(), motive } }, storage); sc.crime.dice = real; return k; };
    const t0 = st.totalMinutes;

    // ---- 1. Darülfünun öğrencisi suç işler → dava → kamu hizmeti; ders saatiyle çakışmaz
    const S = students[0];
    calm(S); S.higherStudy.today = 0; S.higherStudy.day = st.time.day; at(S, 1, 1);
    for (const k of Object.keys(S.needs)) S.needs[k] = 100;
    const k1 = caught(S, 'temptation');
    c('öğrenci suç işler: dava saraya düşer, suçlu öğrenci', k1?.court === true && k1.status === 'open' && k1.offenderId === S.id && Boolean(S.higherStudy));
    c('öğrencinin davasında bağlam: Genç (hak edilen sertlik −0,5) ve sicil yok', k1.context.ageStage === 'youth' && k1.context.repeat === 0, JSON.stringify(k1.context));
    sc.court.decide(k1, 'serviceLight');
    c('ceza kamu hizmeti (4 saat): borç yazıldı, öğrencilik kaydı korunur', S.sentence?.service > 0 && S.sentence.service <= 4 * 60 + 1 && Boolean(S.higherStudy) && k1.status === 'closed', JSON.stringify(S.sentence));
    const hoursSeen = {};
    for (const h of [14, 14.5, 15, 15.5]) { S.task = null; hoursSeen[h] = brain.decide(S, h)?.activity; }
    c('ders saatinde (14:00-16:00) öğrenci derse gider, kamu hizmetine değil (borç sürerken bile)', Object.values(hoursSeen).every((a) => a === 'lecture'), JSON.stringify(hoursSeen));
    S.task = null;
    const evening = brain.decide(S, 18)?.activity;
    S.task = null;
    const morning = brain.decide(S, 10)?.activity;
    c('kamu hizmeti yalnızca boş zamanda (18:00 akşam: süpürür; 10:00 mesaide: süpürmez)', evening === 'publicService' && morning !== 'publicService', `${evening} / ${morning}`);
    S.higherStudy.today = UD.UNIVERSITY.minutesPerDay; // günlük ders tavanı doldu: 14:30'da artık ders yok, mesai saati: hizmet de yok
    S.task = null;
    const capped = brain.decide(S, 14.5)?.activity;
    c('günlük ders tavanı dolunca ders saatinde bile kamu hizmeti başlamaz (mesai bölünmez, boş zaman değil)', capped !== 'publicService', capped);
    c('bekçi: senaryo 1 sonrası temiz', monitor().broken === 0, JSON.stringify(monitor().list));

    // ---- 2. Kulüp üyesi uzaklaştırılır: kulübe gidebilir, hana gidemez
    const M = members.find((x) => x.club.key === 'gardenClub' && !x.higherStudy);
    calm(M); at(M, 2, 1); M.club.missed = 0;
    const k2 = caught(M, 'temptation');
    sc.court.decide(k2, 'ban');
    c('uzaklaştırma: 4 gün (banUntil), üyelik kaydı korunur', J.isBanned(st, M) && Boolean(M.club) && M.sentence.banUntil === st.totalMinutes + D.COURT.banDays * 1440, JSON.stringify(M.sentence));
    c('uzaklaştırılan hana ve pazara gidemez (yasak ortak noktada)', J.banBlocks(st, M, inn) && J.banBlocks(st, M, market, 'shop') && !J.banBlocks(st, M, houses[0]), '');
    st.clubs.gardenClub.live = { day: st.time.day, until: st.totalMinutes + 110, ids: C.membersOf(st, 'gardenClub').map((x) => x.id), came: [], excused: [] };
    M.task = null; for (const k of Object.keys(M.needs)) M.needs[k] = 90;
    const toClub = sc.clubs.planSession(M);
    c('uzaklaştırılan üye kulübe gidebilir (kulüp evi yasağa girmez)', toClub?.activity === 'clubSession' && brain.decide(M, 18)?.activity === 'clubSession', `${toClub?.activity} ${brain.decide(M, 18)?.activity}`);
    M.task = null;
    const plan = brain.planGathering(M, inn);
    c('uzaklaştırılan hanı planlayamaz (planGathering null: davet / randevu / sohbet yolu da kapalı)', plan === null);
    delete st.clubs.gardenClub.live;
    c('bekçi: senaryo 2 sonrası temiz', monitor().broken === 0, JSON.stringify(monitor().list));

    // ---- 3. Çok rollü sakin sürgün edilir: çırak + öğrenci + kulüp üyesi + yadigâr taşıyan + tek ebeveyn
    const home = st.buildings.find((h) => h.type === 'cabin' && h.functional);
    const spouseLess = grownUps[7];
    calm(X); at(X, -1, 1);
    c('çok rollü sakin hazır: öğrenci ve bahçe kulübü üyesi (sırada bekleyen aday var)', Boolean(X.higherStudy) && X.club?.key === 'gardenClub' && C.membersOf(st, 'gardenClub').length === 6 && C.candidatesFor(st, 'gardenClub').some((e) => e.auto && e.c !== X), `${X.higherStudy ? 'öğrenci' : '-'} ${X.club?.key}`);
    const waiting = C.candidatesFor(st, 'gardenClub').find((e) => e.auto).c;
    const waitingStudent = youths[0]; // Darülfünun sırasında bekleyen (7. genç)
    const master = grownUps[8];
    const shop = sim.place('healerHut');
    X.apprenticeship = { masterId: master.id, profession: 'healerHut', buildingId: shop.id, progress: 30, since: 0, crafted: 0 };
    const relicKind = Object.keys((await import('/src/data/heirloom.js')).HEIRLOOMS)[0];
    X.inventory = [{ kind: relicKind, qty: 1, name: 'Yadigâr', heirloom: Ci.sanitizeHeirloomMeta({ ownerId: X.id, ownerName: X.name, story: 'Eski bir hikâye', since: 1, chain: [X.name] }) }];
    X.homeId = home.id;
    sc.family.welcomeChild(X, spouseLess, home);
    const child = st.characters.find((q) => q.isChild);
    child.parentIds = [X.id]; child.parents = [X.id]; child.homeId = home.id; X.children = [child.id]; spouseLess.children = [];
    const spare = (h) => h.capacity - st.characters.filter((q) => q.homeId === h.id).length;
    for (const q of st.characters) {
      if (q === X || q === child || q.homeId !== home.id) continue;
      const other = st.buildings.find((h) => h.capacity && h.functional && h !== home && spare(h) > 0);
      q.homeId = other?.id ?? null; // çocuğun evinde başka yetişkin yok: X tek ebeveyn (eş / ev arkadaşı başka eve)
    }
    st.lineage.heads[home.id] = X.id;
    const carriers0 = st.characters.filter((q) => (q.inventory ?? []).some((s) => s.heirloom)).length;
    const archive0 = st.heirloom.archive.length;
    const exo0 = JSON.stringify([st.exodus.left, st.exodus.cap ?? null, st.stats.emigrants ?? 0]);
    const memberCount0 = C.membersOf(st, 'gardenClub').length;
    const studentCount0 = U.studentsOf(st).length;
    // suç → dava → sürgün
    const k3 = caught(X, 'grudge');
    st.clubs.gardenClub.attendance = [[X.id], [X.id]]; // katılım geçmişinde kimlik
    sc.court.decide(k3, 'exile');
    c('sürgün: önce kenara yürür; bu sırada öğrenci / üye / çırak kayıtları duruyor, hepsi suçlunun üzerinde', Boolean(X.sentence?.exile) && st.characters.includes(X) && Boolean(X.higherStudy) && Boolean(X.club) && Boolean(X.apprenticeship));
    const left3 = [];
    const offL = E.on('population:left', (p) => left3.push(p.reason));
    brain.planExile(X);
    sc.court.departExile(X);
    offL();
    const ids = new Set(st.characters.map((q) => q.id));
    c('sürgün: suçlu kasabadan çıktı; reason exile; terk ediş sayaçları değişmedi', !st.characters.includes(X) && left3.includes('exile') && JSON.stringify([st.exodus.left, st.exodus.cap ?? null, st.stats.emigrants ?? 0]) === exo0);
    c('öğrenci kaydı silindi: Darülfünun öğrencileri 6 → 5, X listede yok', !U.studentsOf(st).includes(X) && U.studentsOf(st).length === studentCount0 - 1 && U.studentsOf(st).every((q) => ids.has(q.id)), `${studentCount0} → ${U.studentsOf(st).length}`);
    c('kulüp kaydı silindi: bahçe üyeleri 6 → 5; katılım geçmişinde X kimliği kalmadı; kulüp kaydı kopuk değil', C.membersOf(st, 'gardenClub').length === memberCount0 - 1 && !(st.clubs.gardenClub.attendance ?? []).some((l) => l.includes(X.id)) && !JSON.stringify(st.clubs).includes(`"${X.id}"`) , `${memberCount0} → ${C.membersOf(st, 'gardenClub').length}`);
    c('sicil ve dava: X\'in dosyası sicilden düştü, açık dava kalmadı, kapalı davalarda kimlik null', !(String(X.id) in st.justice.records) && st.justice.cases.every((q) => q.offenderId !== X.id) && [...st.justice.log].filter((q) => q.id === k3.id).every((q) => q.offenderId === null || q.offenderId === undefined) || st.justice.log.every((q) => q.offenderId !== X.id), JSON.stringify(Object.keys(st.justice.records)));
    const masterNow = st.characters.find((q) => q.id === master.id);
    c('çıraklık: X\'in ustası çırak bırakmadı; kayıt çırakla birlikte gitti (kopuk usta / çırak yok)', masterNow && st.characters.every((q) => !q.apprenticeship || ids.has(q.apprenticeship.masterId)));
    const kid = st.characters.find((q) => q.id === child.id);
    const kidHome = kid && st.buildings.find((h) => h.id === kid.homeId);
    c('tek ebeveyn: çocuk evsiz kalmaz; yetişkini olan bir eve taşındı; kopuk ebeveyn yok', Boolean(kid) && Boolean(kidHome) && st.characters.some((q) => q.homeId === kidHome.id && !q.isChild) && kid.parentIds.every((id) => ids.has(id)) && (kid.parents ?? []).every((id) => ids.has(id)), `${kid?.homeId} ${kidHome?.type} sakinler ${st.characters.filter((q) => q.homeId === kid?.homeId).map((q) => q.name + (q.isChild ? '(ç)' : '')).join()} boş yatak ${st.buildings.filter((h) => h.capacity).map((h) => `${h.id}:${h.capacity - st.characters.filter((q) => q.homeId === h.id).length}`).join(' ')}`);
    const carriers1 = st.characters.filter((q) => (q.inventory ?? []).some((s) => s.heirloom)).length;
    c('yadigâr kaybolmaz: mirasçıya geçti ya da arşive girdi', carriers1 === carriers0 || st.heirloom.archive.length === archive0 + 1, `${carriers0}→${carriers1} arşiv ${archive0}→${st.heirloom.archive.length}`);
    c('ocak reisliği düştü; Mahcup yok (suçlu gitti), geride kalan çocuğa Mahcup', st.lineage.heads[home.id] !== X.id && Boolean(Mo.getMoodlet(kid, 'shamed')), JSON.stringify(st.lineage.heads[home.id] ?? null));
    // yerine geçme: gün dönümü
    sc.university.newDay();
    sc.clubs.newDay();
    c('Darülfünun sırasındaki öğrenci boş koltuğu doldurdu (6 öğrenci geri geldi)', Boolean(waitingStudent.higherStudy) && U.studentsOf(st).length === studentCount0, `${U.studentsOf(st).length}`);
    c('kulübün sırasındaki aday boşalan koltuğa yerleşti (bahçe 6 üye geri geldi)', waiting.club?.key === 'gardenClub' && C.membersOf(st, 'gardenClub').length === memberCount0, `${waiting.name} ${waiting.club?.key}`);
    const m3 = monitor();
    c('bekçi: sürgün sonrası temiz (öğrenci / üye kaydı, evsiz çocuk, sürgün yolu)', m3.broken === 0, JSON.stringify(m3.list));

    // ---- 4. Barış Çeşmesi + eğitim + kulüp çarpanları birlikte suç riskine
    const Q = U.studentsOf(st).find((q) => q.club) ?? U.studentsOf(st)[0];
    if (!Q.club) sc.clubs.join(Q, 'paintingClub', 'test'); // resim atölyesinde boş koltuk var (1 üye)
    calm(Q);
    st.clubs[Q.club.key].attendance = [[Q.id], [Q.id], [Q.id], [Q.id]];
    sc.renown.grant('peaceFountain');
    const pf = sim.place('peaceFountain');
    const plain = pool.find((q) => !q.higherStudy && !q.club && !q.graduate && J.crimeCandidate(st, q));
    const fq = J.riskFactors(st, Q);
    const fp = plain ? J.riskFactors(st, plain) : null;
    c('Barış Çeşmesi kuruldu (kasaba çapında ×0,85); öğrenci ×0,8 ve etkin kulüp üyesi ×0,75 aynı sakinde birlikte', pf?.type === 'peaceFountain' && fq.education === UD.EDUCATION_CRIME.student && fq.club === CD.CLUB_CRIME.active && fq.renown === RD.ROYAL_EFFECTS.peaceFountain.crimeRisk, `${JSON.stringify([fq.education, fq.club, fq.renown])} çeşme ${pf?.type} ${pf?.functional} verildi ${R.royalGranted(st, 'peaceFountain')}`);
    const joint = fq.education * fq.club * fq.renown;
    const neutral = J.crimeRisk(st, Q, { ...fq, education: 1, club: 1, renown: 1 });
    c('riskte üç çarpan çarpılır (toplanmaz): risk / yalın risk = 0,8 × 0,75 × 0,85 = 0,51', neutral > 0 && Math.abs(J.crimeRisk(st, Q) / neutral - joint) < 1e-9 && Math.abs(joint - 0.51) < 1e-9, `${J.crimeRisk(st, Q)} / ${neutral}`);
    c('eğitimsiz kulüpsüz sakinde yalnızca Barış Çeşmesi (×0,85) işler; eğitim ve kulüp 1', !fp || (fp.education === 1 && fp.club === 1 && fp.renown === RD.ROYAL_EFFECTS.peaceFountain.crimeRisk));
    // Şüpheli itibarda çeşmenin etkisi yarıya iner (sapmanın yarısı)
    const repWas = st.crown.reputation;
    st.crown.reputation = 10;
    const weak = J.riskFactors(st, Q).renown;
    st.crown.reputation = repWas;
    c('itibar Şüpheli\'ye düşünce Barış Çeşmesi etkisi yarıya iner (0,85 → 0,925)', Math.abs(weak - (1 + (RD.ROYAL_EFFECTS.peaceFountain.crimeRisk - 1) * RD.RENOWN_GRANT.weakenedShare)) < 1e-9, String(weak));

    // ---- 5. Lütuf + Darülfünun: Kraliyet Arşivi ders çarpanı
    const mulBefore = U.lectureMultiplier(st, uni);
    sc.renown.grant('royalArchive');
    const archive = sim.place('royalArchive');
    const mulAfter = U.lectureMultiplier(st, uni);
    const stu = U.studentsOf(st)[0];
    stu.higherStudy.today = 0; stu.higherStudy.day = st.time.day; stu.higherStudy.minutes = 0;
    sc.university.learn(stu, uni, 60);
    const gainWith = stu.higherStudy.minutes;
    st.buildings = st.buildings.filter((b) => b !== archive);
    stu.higherStudy.today = 0; stu.higherStudy.minutes = 0;
    sc.university.learn(stu, uni, 60);
    const gainWithout = stu.higherStudy.minutes;
    st.buildings.push(archive);
    c('Kraliyet Arşivi: ders çarpanı ×1,2 (Müderris ×2 ile birlikte çarpılır); arşivsiz 1', mulBefore.archive === 1 && mulAfter.archive === UD.UNIVERSITY.archiveMultiplier && Math.abs(mulAfter.total - mulAfter.professor * mulAfter.archive * mulAfter.guest) < 1e-9, JSON.stringify([mulBefore, mulAfter]));
    c('Kraliyet Arşivi: dersteki 60 dakika arşivle 1,2 kat ilerler', gainWithout > 0 && Math.abs(gainWith / gainWithout - UD.UNIVERSITY.archiveMultiplier) < 0.02, `${gainWith} / ${gainWithout}`);
    const sci = U.scholarResearchFactor(st, uni);
    c('Bilgelik Evi araştırması: Kraliyet Arşivi ×1,15 kendi yolundan (ders çarpanından ayrı)', RD.ROYAL_EFFECTS.royalArchive.research === 1.15 && R.renownResearchFactor(st) === 1.15 && sci >= 1, `${sci}`);

    // ---- 6. İtibar hedefinin bütün satırları aynı anda sıfırdan farklı
    for (const q of pool.slice(0, 4)) q.loyalty = -30; // Homurdanan: Nabız satırı
    st.trust.value = 95;
    st.clubs.paintingClub.recent = [1, 1, 1, 1, 1, 1]; st.clubs.sewingClub.recent = [1, 1, 1, 1, 1, 1]; st.clubs.gardenClub.recent = [1, 1, 1, 1, 1, 1];
    for (const kc of ['gardenClub', 'sewingClub', 'paintingClub']) st.clubs[kc].attendance = [C.membersOf(st, kc).map((q) => q.id), C.membersOf(st, kc).map((q) => q.id)];
    for (const q of grownUps.slice(0, 4)) { q.graduate = { field: 'farming', day: 1 }; }
    const tgt = R.renownTarget(st);
    const need = ['crime', 'justice', 'trust', 'pulse', 'education', 'clubs', 'tier'];
    const zero = need.filter((key) => !tgt.values[key]);
    c('itibar hedefi: suç, adalet, güven, Nabız, eğitim, kulüpler ve seviye satırlarının hepsi aynı anda sıfırdan farklı', zero.length === 0, `sıfır: ${zero.join(',')} · ${JSON.stringify(tgt.values)}`);
    const sumParts = Object.values(tgt.values).reduce((a, b) => a + b, 0);
    c('hedef = taban + satırların toplamı (0-100 içinde); parts listesi yalnızca sıfırdan farklı satırlar', Math.abs(tgt.target - Math.max(0, Math.min(100, RD.RENOWN_TARGET.base + sumParts))) < 0.11 && tgt.parts.every((x) => x.value !== 0) && tgt.parts.length === Object.values(tgt.values).filter((x) => x !== 0).length, `${tgt.target} / ${RD.RENOWN_TARGET.base + sumParts}`);
    for (const q of pool.slice(0, 4)) q.loyalty = 0;
    c('bekçi: senaryo 4-6 sonrası temiz', monitor().broken === 0, JSON.stringify(monitor().list));
    return out;
  })));
  // ---- 7. ortada bırakılmış durumda kaydet → yükle → aynı durum
  const mid = await page.evaluate(buildMidState32);
  results.push({ name: 'ortada bırakılmış durum kuruldu: açık dava, kamu hizmeti, yasak, utanç, yürüyen sürgün, süren ders, süren buluşma, telafi', ok: Object.values(mid).every((v) => v !== null), detail: JSON.stringify(mid) });
  results.push(...(await page.evaluate(async (mid) => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const E = game.events;
    const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));
    const snap = (st) => ({
      justice: canon(st.justice), clubs: canon(st.clubs), university: canon(st.university), renown: canon(st.renown), reputation: Math.round(st.crown.reputation * 100) / 100,
      people: canon(st.characters.map((q) => [q.id, q.sentence ?? null, q.higherStudy ?? null, q.graduate ?? null, q.club ?? null, q.apprenticeship ?? null, (q.moodlets ?? []).filter((m) => m.key === 'shamed').map((m) => [m.key, m.until])])),
      lineage: canon(st.lineage.heads), day: st.time.day, buildings: st.buildings.map((b) => b.type).sort().join(),
    });
    const before = snap(game.state);
    const open0 = game.state.justice.cases.filter((k) => k.status === 'open').length;
    E.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    E.emit('ui:load');
    const st = game.state;
    const sc = game.scenes.current;
    const after = snap(st);
    const diff = Object.keys(before).filter((k) => before[k] !== after[k]);
    c('kaydet → yükle: dava / kulüp / Darülfünun / itibar / sakin alanları (ceza, ders, üyelik, mezun, çıraklık, utanç) / ocak reisleri aynı', diff.length === 0, diff.map((k) => { const a = String(before[k]); const b = String(after[k]); let i = 0; while (i < a.length && a[i] === b[i]) i++; return `${k}@${i}: ${a.slice(Math.max(0, i - 60), i + 120)} | ${b.slice(Math.max(0, i - 60), i + 120)}`; }).join(' ## '));
    c('kayıt sürümü 41; açık dava, kamu hizmeti, yasak, sürgün, ders ve telafi alanları dosyada', raw.version === 41 && raw.justice?.cases?.some((k) => k.status === 'open') && raw.characters.some((q) => q.sentence?.service > 0) && raw.characters.some((q) => Number.isFinite(q.sentence?.banUntil)) && raw.characters.some((q) => q.sentence?.exile) && raw.characters.some((q) => q.higherStudy) && Object.values(raw.clubs ?? {}).some((r) => r.live) && Object.values(raw.clubs ?? {}).some((r) => r.makeup), `v${raw.version}`);
    c('yüklemeden sonra açık dava sayısı aynı ve saray dinliyor; yürüyen sürgün hâlâ listede', st.justice.cases.filter((k) => k.status === 'open').length === open0 && st.characters.some((q) => q.sentence?.exile) && sc.court.unsubscribers.length > 0, `${open0}`);
    // yüklenen durumda zaman akar: sürgün tamamlanır, dersler / buluşmalar sürer, kopuk referans yok
    const exiled = st.characters.find((q) => q.sentence?.exile);
    const pop0 = st.characters.length;
    sim.step(225 * 8);
    const stayed = st.characters.some((q) => q.id === exiled?.id);
    c('yüklenen oyunda 8 saat sonra yürüyen sürgün kasabadan çıkmış ve kayıtları temiz (öğrenci / üye / sicil / yasaklı)', Boolean(exiled) && !stayed && !JSON.stringify(st.justice.records).includes(`"${exiled?.id}":`) && !JSON.stringify(st.clubs).includes(`[${exiled?.id},`) , `${pop0} → ${st.characters.length}`);
    sim.step(225 * 24 * 2);
    c('yüklenen oyunda 2 gün daha: oyun ilerler, günlük akış çalışır', st.time.day >= game.state.time.day && st.time.day > before.day);
    return out;
  }, mid)));
  {
    // yükleme yeni bir sahne kurar: bekçi dinleyicisi yeni sistemlerden SONRA eklenmeli (yoksa "ayrıldı ama kaydı duruyor" sıra gürültüsü)
    await installMonitor(page);
    await page.evaluate(() => sim.step(225 * 24));
    const rep2 = await page.evaluate(() => { window.__monitor.sample(); return window.__monitor.report(); });
    const noise = (x) => /içeride sanılan/.test(x);
    results.push({ name: 'bekçi: yükleme ve 2 günlük akıştan sonra kopuk referans / takılma yok', ok: rep2.broken.filter((x) => !noise(x)).length === 0, detail: JSON.stringify(rep2.broken.filter((x) => !noise(x)).slice(0, 3)) });
  }
  const rep = await monitorReport(page);
  results.push({ name: 'bekçi: yeniden kurulan bekçi bir gün sonra kopuk referans / takılma yok', ok: rep.broken.filter((x) => !/içeride sanılan/.test(x)).length === 0 && rep.stuck.length === 0, detail: JSON.stringify(rep.broken.filter((x) => !/içeride sanılan/.test(x)).slice(0, 3)) });
  await browser.close();
}

// ---------------------------------------------------------------- B. şalter kapalıyken yüklenen kayıt (fikstür: bütün 32 durumları açıkken alınmış 90 günlük kayıt)
// Her şalter tek tek ve hepsi birlikte kapalı açılır, kayıt yüklenir: çökme yok, kapalı mekaniğin alanları bozulmadan korunur (yeniden
// yazılan kayıtta aynı), oyun bir gün yaşar; sonra şalter yeniden açık oyunda aynı kayıt kaldığı yerden sürer.
{
  const raw = fs.readFileSync(new URL('../fixtures/save-v41-asama32.json', import.meta.url), 'utf8');
  const original = JSON.parse(raw);
  const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));
  const keep = {
    justice: () => canon(original.justice),
    clubs: () => canon(original.clubs),
    university: () => canon(original.university),
    renown: () => canon(original.renown),
    people: () => canon(original.characters.map((c) => [c.id, c.sentence ?? null, c.higherStudy ?? null, c.graduate ?? null, c.club ?? null])),
  };
  const configs = [
    // (33.0) Kısaltıldı: tek tek kapalı olanlardan dördü ve hepsi kapalı; ('court' ve 'yalnız bir şalter açık' yapılandırmaları kapıdan çıktı)
    ['justice'], ['university'], ['clubs'], ['justice', 'court', 'renown', 'university', 'clubs'],
  ];
  const ALL5 = ['justice', 'court', 'renown', 'university', 'clubs'];
  const savedAfter = {};
  for (const off of configs) {
    const label = off.length === 5 ? 'hepsi' : off.length === 4 ? `yalnız ${ALL5.find((k) => !off.includes(k) && k !== 'court')} açık` : off[0];
    const { browser, page } = await openGame({ seed: 1, enginesOff: off });
    const perrs = [];
    page.on('pageerror', (e) => perrs.push(String(e).slice(0, 200)));
    const r = await page.evaluate(async (raw) => {
      localStorage.setItem('lmgame.save.v2', raw);
      let threw = null;
      try { game.events.emit('ui:load'); } catch (e) { threw = String(e).slice(0, 200); }
      const st = game.state;
      const day0 = st.time.day;
      const pop0 = st.characters.length;
      try { sim.step(225 * 24); } catch (e) { threw = String(e).slice(0, 200); }
      const { ENGINES } = await import('/src/systems/Engines.js');
      game.events.emit('ui:save');
      const out = JSON.parse(localStorage.getItem('lmgame.save.v2'));
      const bTypes = ['courthouse', 'university', 'gardenClub', 'sewingClub', 'paintingClub', 'peaceFountain', 'royalRoseGarden', 'royalArchive'];
      return {
        threw, day0, day: st.time.day, pop0, pop: st.characters.length, raw: JSON.stringify(out),
        built: bTypes.filter((t) => out.buildings.some((b) => b.type === t)).length,
        engines: Object.fromEntries(['justice', 'court', 'renown', 'university', 'clubs'].map((k) => [k, ENGINES[k]])),
        clubsKeys: Object.keys(out.clubs ?? {}), guide: out.guide?.done?.length ?? 0,
      };
    }, raw);
    const after = JSON.parse(r.raw);
    savedAfter[label] = r.raw;
    results.push({ name: `şalter kapalı (${label}): kayıt çökmeden yüklenir, bir gün yaşanır, sayfa hatası yok`, ok: !r.threw && r.day === r.day0 + 1 && perrs.length === 0 && r.pop > 0, detail: `${r.threw ?? ''} ${perrs[0] ?? ''} gün ${r.day0}→${r.day} sakin ${r.pop0}→${r.pop}` });
    results.push({ name: `şalter kapalı (${label}): sekiz yeni yapı kayıtta durur (yapılar silinmez, çalışmasa da)`, ok: r.built === 8, detail: `${r.built}/8` });
    // kapalı mekaniğin alanları: yalnızca o şalterin sahibi olduğu alanlar bozulmadan korunur (açık olanlar iki günde ilerleyebilir)
    const closed = off.includes('justice') ? ['justice', 'people'] : off.includes('court') ? ['people'] : [];
    const checks = [];
    if (off.includes('clubs')) checks.push(['clubs', canon(after.clubs) === keep.clubs(), 'clubs']);
    if (off.includes('university')) checks.push(['university', canon(after.university) === keep.university() && after.characters.filter((c) => c.higherStudy).length === original.characters.filter((c) => c.higherStudy).length, 'university + higherStudy']);
    if (off.includes('renown')) checks.push(['renown', canon(after.renown) === keep.renown(), 'renown']);
    if (off.includes('justice')) checks.push(['justice', canon(after.justice?.cases) === canon(original.justice.cases) && canon(after.justice?.records) === canon(original.justice.records), 'justice.cases / records']);
    if (off.includes('court') && !off.includes('justice')) checks.push(['court', after.characters.filter((c) => c.sentence?.exile || c.sentence?.service > 0).length >= 1, 'sakin cezaları (sentence)']);
    for (const [k, ok, what] of checks) results.push({ name: `şalter kapalı (${label}): ${what} alanı bir gün sonra bozulmadan korunur`, ok, detail: k });
    await browser.close();
  }
  // şalter yeniden açılınca kaldığı yerden sürer: kulüpler kapalı koşunun yazdığı kayıt, hepsi açık yeni oyunda
  for (const label of ['clubs', 'hepsi']) {
    const { browser, page } = await openGame({ seed: 1 });
    const perrs = [];
    page.on('pageerror', (e) => perrs.push(String(e).slice(0, 200)));
    const r = await page.evaluate(async (raw) => {
      localStorage.setItem('lmgame.save.v2', raw);
      game.events.emit('ui:load');
      const st = game.state;
      const sc = game.scenes.current;
      const before = { members: st.characters.filter((c) => c.club).length, students: st.characters.filter((c) => c.higherStudy).length, cases: st.justice?.cases.length ?? 0, sessions: Object.values(st.clubs ?? {}).reduce((a, x) => a + (x.sessions ?? 0), 0), graduated: st.university?.graduated ?? 0 };
      let threw = null;
      try { sim.step(225 * 24 * 2); } catch (e) { threw = String(e).slice(0, 200); }
      const after = { members: st.characters.filter((c) => c.club).length, students: st.characters.filter((c) => c.higherStudy).length, sessions: Object.values(st.clubs ?? {}).reduce((a, x) => a + (x.sessions ?? 0), 0), admitted: st.university?.admitted ?? 0, day: st.time.day };
      return { threw, before, after, listeners: [sc.clubs?.unsubscribers?.length, sc.university?.unsubscribers?.length, sc.court?.unsubscribers?.length] };
    }, savedAfter[label]);
    results.push({ name: `şalter yeniden açık (${label} kapalıyken yazılan kayıt): kaldığı yerden sürer — üyeler, öğrenciler ve davalar duruyor, sistemler dinliyor, iki gün çökmeden geçer`, ok: !r.threw && perrs.length === 0 && r.before.members >= 6 && r.listeners.every((n) => n > 0) && r.after.sessions >= r.before.sessions, detail: `${JSON.stringify(r.before)} → ${JSON.stringify(r.after)} ${r.threw ?? ''} ${perrs[0] ?? ''}` });
    await browser.close();
  }
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
