// Aşama 32.4 testleri: Darülfünun (Bilgelik Evi'nin üst kademesi). Şalter, menü kilidi, kabul (yalnızca Bilgelik Evi mezunu gençler,
// kapasite, sıra), bölüm seçim sırası ve zar çekilmemesi, ders saati / günlük tavan / çarpanlar, Brain sırası (mola zarından sonra,
// acil ihtiyaç önce), çırak öğrencinin telafisi ve Başusta, mezuniyette Kalfa tabanı, bölüm XP çarpanı, yarım bırakma, suç ve itibar
// faktörleri, kayıt temizliği, kaydet → yükle, Bilgelik Evi'nin rastgele meslek seçimi.
// Kullanım: node tools/sim/tests/32.4-university.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 32.4
import { openGame, createChecks } from '../lib.mjs';

const { results, report } = createChecks();
const errors = [];

// ---- A. şalter kapalı (açılıştan önce): dinleyici yok, menüde yok, faktörler nötr, alanlar yazılmaz
{
  const { browser, page } = await openGame({ seed: 5, enginesOff: ['university'] });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const B = await import('/src/data/buildings.js');
    const J = await import('/src/systems/Justice.js');
    const R = await import('/src/systems/Renown.js');
    const U = await import('/src/systems/University.js');
    const { ENGINES, engineOn } = await import('/src/systems/Engines.js');
    const st = game.state;
    const sc = game.scenes.current;
    st.town.tier = 4;
    const a = st.characters.find((x) => !x.isChild && !x.role);
    a.educated = true;
    st.characters.find((x) => x !== a && !x.isChild && !x.role).graduate = { field: 'herbalism', day: 1 };
    c('şalter kapalı: dinleyici yok, menüde ve kurulumda yok, educationMerit de kapalı sayılır', !sc.university.unsubscribers.length && !B.BUILD_MENU.includes('university') && /kapalı/.test(sc.construction.globalBlock('university') ?? '') && ENGINES.educationMerit === true && !engineOn('educationMerit'));
    c('şalter kapalı: suç faktörü 1, itibar eğitim payı 0, işleyen Darülfünun yok', J.educationFactor(a) === 1 && R.renownEducation(st) === 0 && U.universityOf(st) === null);
    sim.step(225 * 30);
    c('şalter kapalı: state.university ve karakter alanları yazılmaz (yeni oyunda)', st.university === null && !('university' in st.toJSON()) && st.characters.every((x) => !x.higherStudy) && !('students' in (st.history.at(-1) ?? {})));
    return out;
  })));
  await browser.close();
}

// ---- B. şalter açık
{
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const U = await import('/src/systems/University.js');
    const UD = await import('/src/data/university.js');
    const B = await import('/src/data/buildings.js');
    const J = await import('/src/systems/Justice.js');
    const R = await import('/src/systems/Renown.js');
    const SK = await import('/src/systems/SkillSystem.js');
    const SD = await import('/src/data/storyCards.js');
    const SC = await import('/src/systems/StoryCards.js');
    const MD = await import('/src/data/moodlets.js');
    const RS = await import('/src/data/research.js');
    const UC = await import('/src/ui/components/universityCards.js');
    const RC = await import('/src/ui/components/renownCards.js');
    const { ENGINES } = await import('/src/systems/Engines.js');
    const { CONFIG } = await import('/src/config.js');
    const { Random } = await import('/src/utils/random.js');
    let st = game.state;
    let sc = game.scenes.current;
    const E = game.events;
    sim.give({ wood: 999, stone: 999, food: 600, gold: 3000, iron: 300, cloth: 200, wool: 200 });
    for (let i = 0; i < 5; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(10); // en az 12 yetişkin: 8 genç + Müderris, bilge, usta, ebeveyn
    const rngStates = () => Object.entries(sc).filter(([, v]) => v && typeof v === 'object' && (v.rng instanceof Random || v.dice instanceof Random)).map(([k, v]) => `${k}:${(v.rng ?? v.dice).state}`).join(',');

    // ---- 1. veri
    c('veri: şalter açık, kapasite 6, ders 14-16 / 90 dk, eşik 540, Gelişmiş Şehir (4) ve tek, kart tablosu 7, kayıt 41, moodlet 33',
      ENGINES.university && ENGINES.educationMerit && UD.UNIVERSITY.capacity === 6 && UD.UNIVERSITY.hours.from === 14 && UD.UNIVERSITY.hours.to === 16 && UD.UNIVERSITY.minutesPerDay === 90 && UD.UNIVERSITY.graduateMinutes === 540 &&
      B.BUILDINGS.university.requiresTier === 4 && B.BUILDINGS.university.unique && B.BUILDINGS.university.category === 'Bilgi' && !B.BUILDINGS.university.cost.gold && B.BUILD_MENU.includes('university') &&
      SD.STORY_TABLE_VERSION === 8 && CONFIG.SAVE_VERSION === 41 && Object.keys(MD.MOODLETS).length === 33);

    // ---- 2. kilit
    st.town.tier = 3;
    const locked = sc.construction.globalBlock('university');
    st.town.tier = 4;
    const free = sc.construction.globalBlock('university');
    c('Gelişmiş Şehir\'den önce kilitli (menü / kurulum), sonra açık', /Gelişmiş Şehir/.test(locked ?? '') && !free, `${locked} | ${free}`);
    const uni = sim.place('university');
    c('kurulum: 4x3 yapı yerleşti, işleyen Darülfünun bulundu', uni && U.universityOf(st) === uni && uni.workerSlots === 1);

    // ---- 3. kabul: yalnızca educated gençler, kapasite, sıra
    const pool = st.characters.filter((x) => !x.isChild && !x.role).sort((a, b) => a.id - b.id);
    c('kurulum: en az 12 yetişkin', pool.length >= 12, `${pool.length}`);
    const youths = pool.slice(0, 8);
    youths.forEach((y, i) => {
      y.lifeStage = 'youth';
      y.age = 19; y.ageInDays = 19 * 4 + 1; // (33.0) gençliğin başı: kabul için en az 6 gün kalmalı
      y.educated = i !== 7; // sonuncusu Bilgelik Evi'ni bitirmedi
      y.schooling = 400 + (i === 2 ? 0 : 10 * i); // 2 numara en düşük: sırada kalır
      y.higherStudy = null;
      y.graduate = null;
      y.apprenticeship = null;
      y.illness = null;
    });
    const adultsLeft = pool.slice(8);
    const before = rngStates();
    sc.university.newDay();
    const after = rngStates();
    const students = U.studentsOf(st);
    c('kabul: en çok 6 öğrenci, Bilgelik Evi mezunu olmayan alınmaz', students.length === 6 && !youths[7].higherStudy, `${students.length}`);
    c('kabul sırası: en yüksek schooling önce; sıradaki (en düşük) bekler', !youths[2].higherStudy && U.admissionQueue(st)[0] === youths[2], U.admissionQueue(st).map((x) => x.name).join(','));
    {
      // (33.0) gençliğinin bitmesine 6 günden az kalan genç kabul edilmez; panelde nedeni yazılır
      const y = youths[2];
      const keep = y.ageInDays;
      y.ageInDays = 21 * 4 - 5;
      const late5 = !U.canEnroll(y) && U.tooLate(y) && U.lateOnes(st).includes(y) && U.youthDaysLeft(y) === 5;
      y.ageInDays = 21 * 4 - 6;
      const ok6 = U.canEnroll(y) && !U.tooLate(y);
      y.ageInDays = 21 * 4 - 5;
      const cards = await import('/src/ui/components/universityCards.js');
      const shown = cards.universitySection(uni, st).map((n) => n.textContent).join(' | ');
      y.ageInDays = keep;
      c('Darülfünun: gençliğinin bitmesine 6 günden az kalan genç kabul edilmez (5 gün: hayır, 6 gün: evet); sayı data/university.js\'te; panelde "Zamanı yetmeyen" ve neden', UD.UNIVERSITY.minYouthDaysLeft === 6 && late5 && ok6 && /Zamanı yetmeyen/.test(shown) && /5 gün kaldı/.test(shown), shown.slice(-200));
    }

    // ---- 4. bölüm seçim sırası
    const probe = (o) => U.fieldFor({ id: 7, traits: [], quirk: null, skills: {}, apprenticeship: null, ...o });
    c('bölüm: çırak mesleği önce (Şifacı Kulübesi → Şifacılık)', probe({ apprenticeship: { profession: 'healerHut' }, quirk: 'philosopher' }).field === 'herbalism' && probe({ apprenticeship: { profession: 'healerHut' } }).source === 'apprentice');
    c('bölüm: sonra huy / özellik tablosu (Bilge Düşünür / İçine Kapanık → Bilgelik, Obur → Aşçılık, Çalışkan → İnşaat)', probe({ quirk: 'philosopher' }).field === 'scholarship' && probe({ traits: ['introvert'] }).field === 'scholarship' && probe({ traits: ['glutton'] }).field === 'cooking' && probe({ traits: ['hardworking'] }).field === 'building' && probe({ traits: ['natureLover'] }).source === 'trait');
    c('bölüm: sonra primarySkill, en son kimliğe göre (zar yok, aynı girdi aynı sonuç)', probe({ traits: ['sleepyhead'], skills: { masonry: 300, farming: 20 } }).field === 'masonry' && probe({ traits: ['sleepyhead'] }).source === 'fallback' && probe({ traits: ['sleepyhead'] }).field === probe({ traits: ['sleepyhead'] }).field);
    c('kartta bölüm adı görünür ("Darülfünun öğrencisi · Şifacılık · %N")', /Darülfünun öğrencisi · .+ · %\d+/.test(UC.universityTag(students[0])?.text ?? ''), UC.universityTag(students[0])?.text);

    // ---- 5. ders: saat, tavan, çarpanlar
    const s0 = students[0];
    const day = st.time.day;
    s0.higherStudy.minutes = 0;
    s0.higherStudy.today = 0;
    s0.higherStudy.day = day;
    sc.university.learn(s0, uni, 200);
    const capped = s0.higherStudy.today === 90 && s0.higherStudy.minutes === 90;
    sc.university.learn(s0, uni, 30);
    c('günlük tavan 90 dk (fazlası sayılmaz); Müderris yokken ×1', capped && s0.higherStudy.today === 90 && s0.higherStudy.minutes === 90, JSON.stringify(s0.higherStudy));
    const prof = adultsLeft[0];
    uni.workerIds.add(prof.id);
    const oldTask = prof.task;
    prof.task = { activity: 'profess', workBuildingId: uni.id, buildingId: uni.id, phase: 'perform', elapsed: 0, duration: 60 };
    const m1 = U.lectureMultiplier(st, uni).total;
    st.renown ??= R.emptyRenown();
    st.renown.grants.push({ key: 'royalArchive', day });
    const arch = sim.place('royalArchive');
    const m2 = U.lectureMultiplier(st, uni).total;
    const elder = adultsLeft[1];
    const eTask = elder.task;
    elder.task = { activity: 'uniTalk', buildingId: uni.id, phase: 'perform', elapsed: 0, duration: 60 };
    const m3 = U.lectureMultiplier(st, uni).total;
    c('çarpanlar: Müderris ×2, Kraliyet Arşivi ×1,2, misafir bilge ×1,25 (çarpılır)', m1 === 2 && arch && Math.abs(m2 - 2.4) < 1e-9 && Math.abs(m3 - 3) < 1e-9, `${m1} ${m2} ${m3}`);
    const panel = UC.universitySection(uni, st).map((n) => n.textContent).join(' | ');
    c('panel: Müderris, derste olanlar, öğrenciler / ilerleme, sıradakiler, mezun sayısı, çarpanlar', /Müderris: /.test(panel) && /Şu an derste/.test(panel) && /Sırada: /.test(panel) && /Mezun \d+/.test(panel) && /Kraliyet Arşivi ×1,2/.test(panel) && /misafir bilge ×1,25/.test(panel), panel.slice(0, 300));
    elder.task = eTask;
    c('ders saati 14:00-16:00; Müderris 13:30\'dan açar; Bilgelik Evi paneline tek satır', U.isLectureHour(14) && U.isLectureHour(15.9) && !U.isLectureHour(16) && !U.isLectureHour(13.9) && U.isTeacherHour(13.5) && /Darülfünun/.test(UC.academyUniversityLine() ?? ''));

    // ---- 6. Brain: mola zarından sonra, acil ihtiyaç önce
    const brain = sc.behavior.brain;
    const s1 = students[1];
    for (const k of Object.keys(s1.needs)) s1.needs[k] = 100;
    s1.higherStudy.today = 0;
    s1.higherStudy.day = st.time.day;
    s1.task = null;
    s1.married = false;
    const rngBefore = brain.rng.state;
    const plan = brain.decide(s1, 14);
    const expect = new Random(0);
    expect.state = rngBefore;
    expect.next(); // yalnızca mola zarı
    c('Brain: ders saatinde öğrenci derse gider; ders planı kurulur', plan?.activity === 'lecture' && plan.buildingId === uni.id && plan.duration <= 90, `${plan?.activity} ${brain.rng.state} ${expect.state}`);
    s1.needs.hunger = 5;
    const hungry = brain.decide(s1, 14);
    s1.needs.hunger = 100;
    const off = brain.decide(s1, 10);
    c('Brain: acil ihtiyaç önce (açlıkta derse gitmez); ders saati dışında ders yok', hungry?.activity !== 'lecture' && off?.activity !== 'lecture', `${hungry?.activity} ${off?.activity}`);
    s1.isInjuredTest = true;
    const nonStudent = youths[7];
    for (const k of Object.keys(nonStudent.needs)) nonStudent.needs[k] = 100;
    const ns = brain.decide(nonStudent, 14);
    c('Brain: öğrenci olmayan Genç için ders dalı hiç çalışmaz', ns?.activity !== 'lecture');

    // ---- 7. çırak öğrenci: telafi ve Başusta
    const ap = students[2];
    const wsBuilding = sim.place('healerHut');
    const master = adultsLeft[2];
    ap.apprenticeship = { masterId: master.id, profession: 'healerHut', buildingId: wsBuilding.id, progress: 10, since: 0, crafted: 0 };
    const mTask = master.task;
    master.task = { activity: 'brew', workBuildingId: wsBuilding.id, buildingId: wsBuilding.id, phase: 'perform', elapsed: 0, duration: 60 };
    const apTask = { activity: 'apprentice', buildingId: wsBuilding.id, phase: 'perform', elapsed: 0, duration: 60 };
    sc.apprenticeship.learn(ap, apTask, 60);
    const gainWork = ap.apprenticeship.progress - 10;
    ap.apprenticeship.progress = 10;
    ap.higherStudy.today = 0;
    ap.higherStudy.day = st.time.day;
    sc.university.learn(ap, uni, 60); // usta tezgâhta: ders dakikası çıraklık sayılır (×1,3)
    const gainLecture = ap.apprenticeship.progress - 10;
    master.task = null;
    ap.apprenticeship.progress = 10;
    ap.higherStudy.today = 0;
    sc.university.learn(ap, uni, 60); // usta tezgâhta değil: telafi yok (öğrenci olmasaydı da ilerlemeyecekti)
    const gainAway = ap.apprenticeship.progress - 10;
    master.task = { activity: 'brew', workBuildingId: wsBuilding.id, buildingId: wsBuilding.id, phase: 'perform', elapsed: 0, duration: 60 };
    c('çırak öğrenci: ders dakikası yalnızca ustası o an tezgâhtaysa çıraklık sayılır (×apprenticeCredit, yürüyüşü karşılar); öğrenci değilken çıraklık hızı aynı', Math.abs(gainLecture / gainWork - UD.UNIVERSITY.apprenticeCredit) < 1e-6 && gainAway === 0 && Math.abs(gainWork - 60 / 18) < 1e-6, `${gainWork.toFixed(3)} ${gainLecture.toFixed(3)} ${gainAway}`);
    ap.apprenticeship.progress = 100;
    ap.higherStudy.field = 'herbalism'; // kabul anında çırak olsaydı bölümü bu olurdu (fieldFor: çırak mesleği önce)
    ap.higherStudy.minutes = 600;
    ap.skills.herbalism = 0;
    master.task = mTask;
    ap.lifeStage = 'adult';
    E.emit('lifeStage:changed', { character: ap, from: 'youth', to: 'adult' });
    c('çırak öğrenci Başusta olur ve Darülfünun mezunu sayılır; Yetkin Usta korunur (Darülfünun Usta vermez, Kalfa yalnızca taban)', ap.isGrandmaster && ap.graduate?.field === 'herbalism' && ap.skills.herbalism === 1500 && st.university.grandmasters === 1 && st.university.apprentices === 1 && !ap.higherStudy, JSON.stringify({ g: ap.graduate, xp: ap.skills.herbalism }));

    // ---- 8. mezuniyet: Kalfa tabanı, Usta korunur, XP çarpanı, ebeveyn gururu, kart
    const g1 = students[3];
    const g2 = students[4];
    g1.higherStudy.field = 'farming';
    g1.higherStudy.minutes = 540;
    g1.skills.farming = 100;
    g2.higherStudy.field = 'crafting';
    g2.higherStudy.minutes = 700;
    g2.skills.crafting = 2000;
    const parent = adultsLeft[3];
    g1.parentIds = [parent.id];
    const cards = [];
    const offCard = E.on('university:graduated', (p) => cards.push(SC.makeCard('university:graduated', p, { state: st })));
    g1.lifeStage = 'adult';
    E.emit('lifeStage:changed', { character: g1, from: 'youth', to: 'adult' });
    g2.lifeStage = 'adult';
    E.emit('lifeStage:changed', { character: g2, from: 'youth', to: 'adult' });
    offCard();
    c('mezuniyet: bölümde en az Kalfa (100 → 480), Usta dokunulmaz (2000), c.graduate yazılır', g1.skills.farming === 480 && g2.skills.crafting === 2000 && g1.graduate?.field === 'farming' && g2.graduate?.day === st.time.day && U.educationLevel(g1) === 2);
    c('mezuniyet kartı önemli (4) ve metin "… Darülfünun\'u Çiftçilik bölümünden bitirdi."; ebeveyne Hatırlandı (yeni moodlet yok)', cards[0]?.priority === 4 && /Darülfünun'u Çiftçilik bölümünden bitirdi/.test(cards[0]?.text ?? '') && parent.moodlets?.some((m) => m.key === 'celebrated' && m.reason === 'child_graduate'), cards[0]?.text);
    const x0 = g1.skills.farming;
    SK.addExperience(E, g1, 'farm', 100);
    const x1 = g1.skills.farming;
    const w0 = g1.skills.woodcutting ?? 0;
    SK.addExperience(E, g1, 'chop', 100);
    c('bölüm XP çarpanı ×1,15 yalnızca o bölümde (öteki meslekte ×1)', Math.abs(x1 - x0 - 115) < 1e-9 && Math.abs((g1.skills.woodcutting ?? 0) - w0 - 100) < 1e-9, `${x1 - x0} ${(g1.skills.woodcutting ?? 0) - w0}`);
    // çıraklığın kendi yazımı (Math.max) çarpılmaz
    const g3 = youths[0];
    g3.graduate = { field: 'crafting', day: 1 };
    g3.apprenticeship = { masterId: null, profession: 'workshop', buildingId: wsBuilding.id, progress: 100, since: 0, crafted: 0 };
    g3.skills.crafting = 0;
    g3.higherStudy = null;
    sc.apprenticeship.graduate(g3);
    c('çıraklığın mezuniyet yazımına çarpan uygulanmaz (Yetkin Usta tam 1500)', g3.skills.crafting === 1500, `${g3.skills.crafting}`);

    // ---- 9. yarım bırakma
    const d1 = students[5];
    d1.higherStudy.minutes = 200;
    const dropped0 = st.university.dropped;
    const dropCards = [];
    const offDrop = E.on('university:dropped', (p) => dropCards.push(SC.makeCard('university:dropped', p, { state: st })));
    d1.lifeStage = 'adult';
    E.emit('lifeStage:changed', { character: d1, from: 'youth', to: 'adult' });
    offDrop();
    c('eşik altı: yarım bıraktı (anı ve kart), mezun sayılmaz, kayıt silinir', !d1.graduate && !d1.higherStudy && st.university.dropped === dropped0 + 1 && d1.memories.some((m) => /yarım bıraktı/.test(m.text)) && /yarım bıraktı/.test(dropCards[0]?.text ?? ''));

    // ---- 10. suç ve itibar faktörleri
    const plain = { lifeStage: 'adult' };
    c('educationFactor: eğitimsiz 1, Bilgelik Evi ×0,8 (32.6a), Darülfünun ×0,65, öğrenci ×0,8', J.educationFactor(plain) === 1 && J.educationFactor({ educated: true }) === 0.8 && J.educationFactor({ educated: true, graduate: { field: 'farming' } }) === 0.65 && J.educationFactor({ educated: true, higherStudy: { field: 'farming' } }) === 0.8);
    ENGINES.educationMerit = false;
    const meritOff = J.educationFactor({ educated: true });
    ENGINES.educationMerit = true;
    c('educationMerit kapalıyken Bilgelik Evi mezununun riski 1 (alt anahtar), Darülfünun etkisi sürer', meritOff === 1 && J.educationFactor({ graduate: { field: 'farming' } }) === 0.65);
    const fake = { characters: [
      { lifeStage: 'adult', graduate: { field: 'farming' } }, { lifeStage: 'adult', educated: true }, { lifeStage: 'adult', educated: true },
      { lifeStage: 'adult' }, { lifeStage: 'youth', educated: true }, { lifeStage: 'adult', role: 'merchant', graduate: { field: 'x' } },
    ] };
    const share = R.renownEducation(fake);
    c('renownEducation: yetişkinlerde (mezun payı + 0,3 × yalnızca Bilgelik Evi payı) = (1 + 0,6) / 4 = 0,4', Math.abs(share - 0.4) < 1e-9, `${share}`);
    const t = R.renownTarget(st);
    const eduLine = RC.renownLines(st).find((l) => /^Eğitim/.test(l));
    c('itibar hedefinde Eğitim katkısı (ağırlık 6) ve dökümde "Eğitim" satırı', t.values.education === Math.round(R.renownEducation(st) * 6 * 10) / 10 && /Eğitim \+[\d,]+ \(Darülfünun mezunu %\d+/.test(eduLine ?? ''), eduLine);

    // ---- 11. kayıt temizliği
    for (const y of adultsLeft.slice(4, 7)) {
      y.lifeStage = 'youth';
      y.age = 19; y.ageInDays = 19 * 4 + 1; // (33.0) gençliğin başı: kabul için en az 6 gün kalmalı
      y.educated = true;
      y.illness = null;
    }
    sc.university.newDay(); // boşalan yerlere sıradakiler
    c('boşalan yerlere sıradakiler alınır (en az 3 öğrenci)', U.studentsOf(st).length >= 3, `${U.studentsOf(st).length}`);
    const leaver = U.studentsOf(st)[0];
    leaver.emigrating = { exit: { x: 0, y: 0 }, since: st.totalMinutes };
    const exiled = U.studentsOf(st)[1];
    exiled.sentence = { exile: { since: st.totalMinutes, exit: null } };
    sc.university.newDay();
    const gone = U.studentsOf(st)[0];
    E.emit('population:left', { character: gone, reason: 'death' });
    c('ayrılan / sürgündeki / ölen öğrencinin kaydı silinir; öğrenci sayısı ≤ 6; ayrılan yeniden alınmaz', !leaver.higherStudy && !exiled.higherStudy && !gone.higherStudy && U.studentsOf(st).length <= 6 && !U.canEnroll(leaver) && !U.canEnroll(exiled));
    leaver.emigrating = null;
    exiled.sentence = null;

    // ---- 12. Bilgelik Evi aynen: rastgele meslek, üreteç tohum + 12, 360 dk
    const kid = { name: 'X', schooling: 400, skills: {}, educated: false };
    const r0 = sc.research.rng.state;
    const copy = new Random(0);
    copy.state = r0;
    const expectSkill = copy.pick((await import('/src/data/skills.js')).SKILL_KEYS);
    sc.research.graduate(kid);
    c('Bilgelik Evi: okul 360 dk, bir meslekte Kalfa, educated = true', RS.SCHOOL.graduateMinutes === 360 && RS.SCHOOL.hours.from === 9 && kid.educated && Object.values(kid.skills).some((v) => v === 480));

    // ---- 13. saat 14:00 zili ve ders etkinliği (kısa koşu)
    const live = U.studentsOf(st);
    for (const x of live) {
      x.higherStudy.today = 0;
      x.higherStudy.day = st.time.day;
      for (const k of Object.keys(x.needs)) x.needs[k] = 100;
    }
    let bell = null;
    const offBell = E.on('university:bell', (p) => { bell = p; });
    E.emit('time:hour', 14);
    offBell();
    c('14:00 zili: derse gidecek öğrencilerin listesi yayınlanır', bell && bell.ids.length === live.filter((x) => !x.away && !x.illness).length && bell.ids.length > 0, JSON.stringify(bell));

    // ---- 14. kaydet → yükle
    const sKey = JSON.stringify(st.characters.filter((x) => x.higherStudy || x.graduate).map((x) => [x.id, x.higherStudy, x.graduate]));
    const uKey = JSON.stringify(st.university);
    E.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    E.emit('ui:load');
    st = game.state;
    sc = game.scenes.current;
    const sKey2 = JSON.stringify(st.characters.filter((x) => x.higherStudy || x.graduate).map((x) => [x.id, x.higherStudy, x.graduate]));
    c('kaydet → yükle: öğrencilik, mezuniyet ve sayaçlar aynı; sürüm 41; boş alan yazılmaz', raw.version === 41 && sKey === sKey2 && JSON.stringify(st.university) === uKey && raw.characters.some((x) => x.higherStudy) && raw.characters.some((x) => !('higherStudy' in x) && !('graduate' in x)), `${sKey.slice(0, 120)} | ${sKey2.slice(0, 120)}`);
    c('yüklemeden sonra tek sistem dinler (çift kabul yok)', sc.university.unsubscribers.length === 5 && U.studentsOf(st).length <= 6);
    return out;
  })));
  await browser.close();
}

// ---- C. kısa koşu: gerçek zamanlı ders (öğrenciler içeri girer, ilerleme birikir), sayfa hatası yok
{
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  results.push(...(await page.evaluate(async () => {
    const out = [];
    const c = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const U = await import('/src/systems/University.js');
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 999, stone: 999, food: 600, gold: 3000, iron: 300, cloth: 200, wool: 200 });
    st.town.tier = 4;
    const uni = sim.place('university');
    const ys = st.characters.filter((x) => !x.isChild && !x.role).sort((a, b) => a.id - b.id).slice(0, 3);
    for (const y of ys) {
      y.lifeStage = 'youth';
      y.age = 19; y.ageInDays = 19 * 4 + 1; // (33.0) gençliğin başı: kabul için en az 6 gün kalmalı
      y.educated = true;
    }
    sc.university.newDay();
    // 13:00'e kadar ilerle, sonra 16:30'a
    const toHour = (h) => { let guard = 0; while ((st.time.hour !== h || st.time.minute > 5) && guard++ < 225 * 30) sim.step(1); };
    toHour(13);
    toHour(15);
    const inside = sc.university.inLecture(uni).length;
    const lit = Boolean(uni.look?.lecture);
    toHour(17);
    const mins = ys.map((y) => y.higherStudy?.minutes ?? 0);
    c('gerçek koşu: 15:00\'te öğrenciler içeride ders dinliyor, pencereler aydınlık; gün sonunda ilerleme birikti (≤ 90 × çarpan)', inside >= 1 && lit && mins.every((m) => m > 0 && m <= 90 * 3) && ys.every((y) => y.higherStudy.today <= 90), `${inside} ${lit} ${mins}`);
    return out;
  })));
  await browser.close();
}

// ---- D. çırak telafisi ölçümü: aynı tohum ve kurulum, bir mesai günü; öğrenci çırak ile öğrenci olmayan çırağın kazancı (±%3)
async function apprenticeDay(student) {
  const { browser, page } = await openGame({ seed: 5 });
  page.on('pageerror', (e) => errors.push(String(e)));
  const r = await page.evaluate(async (student) => {
    const st = game.state;
    const sc = game.scenes.current;
    sim.give({ wood: 999, stone: 999, food: 900, gold: 3000, iron: 300, wool: 300 });
    st.town.tier = 4;
    for (let i = 0; i < 3; i++) sim.place('cabin');
    sc.population.welcomeNewcomers(4);
    sim.place('university');
    const hut = sim.place('healerHut');
    const ad = st.characters.filter((c) => !c.isChild && !c.role).sort((a, b) => a.id - b.id);
    const y = ad[0];
    const m = ad[1];
    m.workplaceId = hut.id;
    m.skills.herbalism = 2000;
    y.lifeStage = 'youth';
    y.age = 19; y.ageInDays = 19 * 4 + 1; // (33.0) gençliğin başı: kabul için en az 6 gün kalmalı
    y.educated = true;
    y.apprenticeship = { masterId: m.id, profession: 'healerHut', buildingId: hut.id, progress: 0, since: 0, crafted: 0 };
    if (student) sc.university.newDay();
    while (st.time.hour < 18) sim.step(15);
    return { gain: y.apprenticeship?.progress ?? -1, student: Boolean(y.higherStudy), lectured: y.higherStudy?.today ?? 0 };
  }, student);
  await browser.close();
  return r;
}
{
  const plain = await apprenticeDay(false);
  const stud = await apprenticeDay(true);
  const ratio = stud.gain / plain.gain;
  results.push({ name: 'ölçüm: aynı tohumda öğrenci çırak, öğrenci olmayan çıraktan en çok %3 geride / önde (bir mesai günü, ders 90 dk alındı)', ok: plain.gain > 0 && stud.student && stud.lectured >= 60 && Math.abs(ratio - 1) <= 0.03, detail: `${stud.gain.toFixed(2)} / ${plain.gain.toFixed(2)} = ${ratio.toFixed(3)} · ders ${stud.lectured} dk` });
}

const ok = report(errors);
process.exit(ok ? 0 : 1);
