// Bir karakterin sıradaki işine karar verir. Sonuç bir "plan"dır:
//   { activity, buildingId?, spot?: {x,y}, finalPoint?: {x,y}, allowBlockedGoal?,
//     reserve?, facing?, duration?, nap?, inviteId? }
// Planı uygulamak (yürümek, yapmak, bitirmek) src/systems/BehaviorSystem.js'in işidir.
//
// Öncelik sırası:
//   0. Kasabaya yeni geldiyse ya da evlenip eşinin evine taşınacaksa önce yeni evine yerleşmek
//   1. Çok açsa (Tokluk < 15) her şeyden önce yemek
//   1b. (11. aşama) Üşüttüyse iksiri olan Şifacı Kulübesi'ne gidip tedavi olmak; şifacı yoksa gündüz yorulunca
//       evinde kestirmek
//   2. Uyku saati geldiyse ya da enerjisi bittiyse eve dönüp uyumak
//   3. Sırtında yük varsa kilere bırakmak
//   2b. Akşam şenliği varsa (ve çok yorgun değilse) meydana koşmak
//   4. Acıktıysa (kişiye özel eşik) handa sıcak yemek, kilerden / evden yemek (ekmek varsa taze ekmekle),
//      stok yoksa böğürtlen
//   4b. Depoda ona ayrılmış boşta ekipman varsa atölyeye / kilere gidip kuşanmak (yetişkinler)
//   5. Mesai saatindeyse iş kuyruğu: şantiye > toplama emri > üretim binası
//      (kişiliğe göre ara sıra mola verir; çocuklar çalışmaz)
//   6. Yalnız hissediyorsa toplanma yerine gitmek, gerekirse birini davet etmek (çocuklar oynar)
//   6b. (12. aşama) Çocuk: ders saatinde (09:00-15:00) günlük dersini dinlemediyse Bilgelik Evi'ne gitmek
//   7. Değilse kişiliğine göre ağırlıklı bir boş zaman etkinliği (çocuklar: oyun, çiçekler, yürüyüş)
//
// 19. aşama: düğün kutlamasına davetliyse önce meydana koşar (yeni eve taşınmadan da önce); evliyse akşam (18:00-20:30)
// acıkınca eşini evde birlikte yemeğe çağırır; bekârsa sevgilisini ya da hoşlandığı kişiyi randevuya (çardak, han, yan
// yana iki bank) çağırır; boş zamanda huyuna göre (Hayvansever, Kitap Kurdu, Müzisyen, Doğa Tutkunu) etkinlik seçer.
//
// 21. aşama (vatandaşlık katmanı; kararlarını kendi rastgele sayı üretecinden verir, eski kararların sırası bozulmaz):
//   - Acıkınca çantasında yiyecek varsa yürümeden çantasından yer ('snack'; çok açken her zaman, değilse yarı yarıya)
//   - Üşüttüyse çantasındaki şifalı otu demler ('herbTea'), keyfi düşünce hatırasına bakar ('keepsake')
//   - Boş zamanında kesesi ve çantasında yeri varsa Pazar Yeri'ne alışverişe gider ('shop'; günde en çok bir kez)
// 23. aşama (krizler; kararlarını krizin kendi üretecinden verir, ana üreteci tüketmez):
//   - Yangın varsa ve yanan yapıya en yakın sağlam yetişkinlerdendiyse her şeyden önce kova taşır: en yakın Su Kuyusu'na (yoksa
//     nehir kıyısına) koşup kovasını doldurur ('fetchWater'), yanan yapıya boşaltır ('fightFire')
//   - Hafif yaralıysa boş zamanında önce Şifacı Kulübesi'ne gider ('tendWound'); şifacı yoksa çantasındaki şifalı otu demler ya da
//     evinde dinlenir
//   - İsyancıysa gündüz (08:00-20:00) işe gitmez: meydanda öfkeyle toplanır ('protest') ya da yağma baskınındaysa
//     depoya yürür ('loot'). Yemek ve uyku önce gelir; şenlik, kutlama ve toplanma zili isyandan önce gelir.
import { ACTIVITIES } from '../data/activities.js';
import { BENCH_TYPES, BUILDINGS } from '../data/buildings.js';
import { MEAL_FOOD_COST } from '../data/resources.js';
import { WORK_SESSION } from '../data/jobs.js';
import { isBedtime, isWorkHours } from './TraitProfile.js';
import { getSeason } from '../data/seasons.js';
import { ILLNESS } from '../data/health.js';
import { FIRE } from '../data/crisis.js';
import { VENERABLE } from '../data/lifeStages.js';
import { SCHOOL } from '../data/research.js';
import { UNIVERSITY } from '../data/university.js'; // (32.4)
import { universityOf, isLectureHour } from '../systems/University.js'; // (32.4)
import { CLUB } from '../data/clubs.js'; // (32.5)
import { isRallyActive } from '../systems/RallySystem.js';
import { healSpeedMultiplier } from '../systems/ResearchSystem.js';
import { QUIRKS, QUIRK_RULES, DATING, HOME_DINNER } from '../data/social.js';
import { partnerOf, canRomance } from '../systems/RelationshipSystem.js';
import { genitive } from '../utils/turkish.js';
import { SHOP, SNACK, REVOLT } from '../data/citizens.js';
import { foodItemOf, countItem, roomFor, isRioter, raidOf } from '../systems/Citizens.js';
import { ELDER } from '../data/lifeStages.js';
import { hasTag } from '../systems/Chemistry.js';
import { EMOTION_RULES } from '../data/chemistry.js';
import { MOOD_RULES, CONSOLE } from '../data/moodlets.js';
import { WANT_RULES } from '../data/wants.js';
import { WARMTH_LEISURE } from '../systems/Wants.js';
import { getMoodlet } from '../systems/Moodlets.js';
import { findSufferer } from '../systems/MoodletSystem.js';
import { TEMPERAMENT } from '../data/temperament.js';
import { isMemorialTime, memorialEligible, urgentNeed, riteWindow, riteVenue } from '../systems/Rites.js';
import { engineOn } from '../systems/Engines.js';
import { shouldStrike } from '../systems/Loyalty.js';
import { crimeReady, isBanned, banBlocks, serviceDue } from '../systems/Justice.js';
import { COURT, SHAME, JUSTICE, CRIMES } from '../data/justice.js';
import { DISCONTENT } from '../data/loyalty.js';

const COLD_SEASONS = ['autumn', 'winter']; // (29.3) "Soğukta üşümek" korkusunun sıcak mekân arayışı

// Çocukların oyun oynadığı yerler: bu yapıların çevresi ve meydan
const PLAYGROUND_TYPES = ['fountain', 'campfire', 'inn', 'monument'];
const PLAZA_PLAY_RADIUS = 8; // meydan merkezine bu kadar karo yakın yollar da oyun yeridir

// Boş zamanda gidilen yapılar: etkinlik -> yapı türü (yalnızca kullanılabilir hâldeyse seçilir)
// (18. aşama) Süs ağacının çevresinde gölgede oturulan yanlar: [dx, dy, ağaca dönük yüz]
const SHADE_SIDES = [
  [0, 1, 'up'],
  [-1, 0, 'right'],
  [1, 0, 'left'],
  [0, -1, 'down'],
];

const LANDMARK_LEISURE = new Map([
  ['monument', 'monument'],
  ['ancientSpring', 'ancientFountain'],
  ['campRest', 'supplyCamp'],
]);

const GATHERING_ACTIVITIES = ['campfire', 'fountain', 'inn', 'gazebo'];
const ALWAYS_OPEN_GATHERINGS = ['fountain', 'gazebo']; // ateş yanarken, han akşamları açıkken; bunlar hep açık
const GAZEBO_INVITE_CHANCE = 0.35; // davet edenin çardağı seçme olasılığı (sevgilisi / eşi varsa her zaman)
const INN_MEAL_PREFERENCE = 0.5; // handaki sıcak yemek, yol maliyeti yarıymış gibi tercih edilir
const EVENING_START = 17;
const EVENING_END = 2;
const PARTNER_SOCIAL_LIMIT = 92;
const FESTIVAL_MIN_ENERGY = 12; // bundan yorgun olan şenliğe gitmez, uyur

export class Brain {
  /**
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   * @param {{ economy: import('../systems/EconomySystem.js').EconomySystem, jobs: import('../systems/JobSystem.js').JobSystem,
   *   relationships: import('../systems/RelationshipSystem.js').RelationshipSystem,
   *   crafting: import('../systems/CraftingSystem.js').CraftingSystem }} services
   */
  constructor(world, rng, { economy, jobs, relationships, crafting, health, research, citizens = null, crisis = null, apprenticeship = null, university = null, clubs = null }) {
    this.clubs = clubs; // (32.5) hobi evleri (kendi üreteci yok; zar çekmez)
    this.university = university; // (32.4) Darülfünun (kendi üreteci yok; zar çekmez)
    this.crisis = crisis; // (23. aşama) yangın ve yaralanma kararları
    this.apprenticeship = apprenticeship; // (25.2) çıraklık (kendi üreteci)

    this.citizenRng = citizens?.rng ?? rng; // (21. aşama) vatandaşlık kararları kendi üretecinden
    this.health = health;
    this.research = research;
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    this.jobs = jobs;
    this.relationships = relationships;
    this.crafting = crafting;
  }

  decide(c, hour) {
    const { needs, profile } = c;
    const bedtime = isBedtime(profile, hour);

    // (32.2) Sürgün: yalnızca suçlu, her şeyden önce bohçasıyla harita kenarına yürür (terk edişten ayrı işaret: c.sentence.exile)
    if (c.sentence?.exile && engineOn('court')) {
      const plan = this.planExile(c);
      if (plan) return plan;
    }
    // (22. aşama) Köyü terk etmeye karar verdiyse her şeyden önce harita kenarına yürür
    if (c.emigrating) {
      const plan = this.planEmigrate(c);
      if (plan) return plan;
    }
    // (23. aşama) Yangın: yanan yapıya en yakın sağlam yetişkinler her şeyi bırakıp kova taşır
    if (this.crisis && !c.isChild) {
      const plan = this.planFirefight(c);
      if (plan) return plan;
    }
    // (20. aşama) Çağ Kutlaması: Ulu Saat Kulesi tamamlanınca uyanık herkes meydanda kutlar
    // (29.2) Yastaki sakin kutlamaya, düğüne, şenliğe katılmaz
    const grieving = c.mood.grief;
    if (!grieving && this.world.state.goldenAge?.celebration && needs.energy > FESTIVAL_MIN_ENERGY && !this.world.state.events.festival.active) {
      const plan = this.planAgeCelebration(c);
      if (plan) return plan;
    }
    // (19. aşama) Düğün kutlaması: çift ve davetli dostları meydanda konfetiler arasında kutlar
    if (!grieving && this.world.state.social?.party && needs.energy > FESTIVAL_MIN_ENERGY && !this.world.state.events.festival.active) {
      const plan = this.planWeddingParty(c);
      if (plan) return plan;
    }
    if (c.newcomer || c.relocating) {
      const plan = this.planMoveIn(c);
      if (plan) return plan;
      c.newcomer = false;
      c.relocating = false;
    }
    if (needs.hunger < 15) {
      const snack = this.planSnack(c, true);
      if (snack) return snack;
      const plan = this.planEat(c);
      if (plan) return plan;
    }
    if (c.illness) {
      const tea = this.planHerbTea(c);
      if (tea) return tea;
      const plan = this.planHeal(c);
      if (plan) return plan;
      if (!bedtime && needs.energy < ILLNESS.restBelow) {
        const nap = this.planSleep(c, true);
        if (nap) return nap;
      }
    }
    // (32.6a) vakti gelmiş suç planı olan sakin şenliğe gitmez (JUSTICE.festivalSneak): aşağıdaki suç dalı onu hedefe götürür
    const sneak = JUSTICE.festivalSneak && c.crimePlan && engineOn('justice') && !c.isChild && this.world.state.totalMinutes >= c.crimePlan.at && this.world.state.totalMinutes <= c.crimePlan.until && crimeReady(this.world.state, c, hour);
    if (!grieving && !sneak && this.world.state.events.festival.active && needs.energy > FESTIVAL_MIN_ENERGY) {
      const plan = this.planFestival(c);
      if (plan) return plan;
    }
    // (14. aşama) Toplanma Zili çaldıysa uyanık herkes meydana koşar
    if (isRallyActive(this.world.state)) {
      const plan = this.planRally(c);
      if (plan) return plan;
    }
    // (29.7) Anma Töreni: 18:00-19:00 arasında ölen için yas tutanlar ve dostları anıtın / meydan havuzunun başında (zar çekmez)
    if (engineOn('rites') && !c.isChild && isMemorialTime(this.world.state) && memorialEligible(this.world.state, c) && !urgentNeed(c)) {
      const plan = this.planMemorial(c);
      if (plan) return plan;
    }
    // (29.2) bıkkın, tükenmiş ya da üşüyerek uyanmış sakin dinlenmeye çok daha erken yönelir
    // (29.3) "Tükenmek" korkusu: biraz daha erken dinlenir
    if (bedtime || needs.energy < profile.thresholds.energy + (c.mood.shirk ? MOOD_RULES.shirkEnergyBonus : 0) + c.drive.energyBonus) {
      const plan = this.planSleep(c, !bedtime);
      if (plan) return plan;
    }
    if (c.carrying) {
      const plan = this.planHaul(c);
      if (plan) return plan;
    }
    // (19. aşama) Evli çift akşamları evde birlikte yemek yer
    if (c.married) {
      const plan = this.planHomeDinner(c, hour);
      if (plan) return plan;
    }
    // (29.3) "Aç kalmak" korkusu: biraz daha erken yer
    if (needs.hunger < profile.thresholds.hunger + c.drive.hungerBonus) {
      const snack = this.planSnack(c, false);
      if (snack) return snack;
      const plan = this.planEat(c);
      if (plan) return plan;
    }
    if (!c.isChild) {
      const plan = this.planEquip(c);
      if (plan) return plan;
    }
    // (21. aşama) İsyancı gündüz işe gitmez: meydanda toplanır ya da yağmaya çıkar
    if (this.world.state.trust?.revolt && isRioter(this.world.state, c)) {
      const plan = this.planRiot(c, hour);
      if (plan) return plan;
    }

    let onBreak = false;
    if (isWorkHours(hour) && !c.isChild) {
      // (29.2) gururlu / akıştaki / ilhamlı sakin mola vermez (zar yine atılır: üretecin sırası değişmez)
      // (29.3) mesleğinde ilerlemek / eser çıkarmak isteyen de (drive.focus)
      const breakRoll = this.rng.next();
      // (30.3) İş bırakma: Kırgın yetişkin 10:00-12:00 meydanda protesto eder (mola zarı yine atıldı; acil ihtiyaç, yangın, yaralı, isyan önce)
      if (engineOn('discontent') && shouldStrike(this.world.state, c, hour) && !urgentNeed(c)) {
        const plan = this.planStrike(c);
        if (plan) return plan;
      }
      // (32.4) Darülfünun dersi: öğrenci (c.higherStudy) 14:00-16:00 derse gider. Mola zarı yine atıldı (üretecin sırası değişmez); acil
      // ihtiyaç, yangın, isyan, iş bırakma ve yaralı önce. Çırak planından ve planWork'ten ÖNCE; öğrenci yokken bu dal hiç çalışmaz.
      if (c.higherStudy && this.university && engineOn('university') && !urgentNeed(c) && !c.isInjured) {
        const plan = this.university.planLecture(c, hour);
        if (plan) return plan;
      }
      if (breakRoll >= profile.work.breakChance || c.mood.focus || c.drive.focus) {
        // (25.2) Çırak: ustası tezgâhtaysa onun yanına (mola zarı her zamanki gibi atıldı; çırak planı kendi üretecini kullanır)
        const plan = (c.apprenticeship && this.apprenticeship?.planFor(c)) || this.planWork(c);
        // (29.2) bıkkın / tükenmiş / üşümüş sakin ağır işten (maden, taş ocağı, inşaat) kaçınır; öncelikli iş emri hariç
        if (plan && c.mood.shirk && MOOD_RULES.heavyWork.includes(plan.activity) && !(plan.jobId && this.jobs.getJob(plan.jobId)?.urgent)) onBreak = true;
        else if (plan) return plan;
      } else {
        onBreak = true;
      }
    }
    // (23. aşama) Hafif yaralı sakin boş zamanında önce yaralarını sarar
    if (c.isInjured && !c.isChild && (!isWorkHours(hour) || onBreak || !c.task)) {
      const plan = this.planTreatInjury(c);
      if (plan) return { ...plan, onBreak };
    }
    // (29.2) Acılı (yaslı, sarsılmış, kalbi kırık) bir yakını varsa boş zamanında önce onu teselli etmeye gider
    if (!c.isChild && (!isWorkHours(hour) || onBreak)) {
      const plan = this.planConsole(c);
      if (plan) return { ...plan, onBreak };
    }
    // (29.2) Yastaki sakin eğlenceye ve flörte girmez: anıtın, çardağın ya da evinin önünde anılara dalar
    if (grieving && (!isWorkHours(hour) || onBreak)) {
      const plan = this.planGrieve(c);
      if (plan) return { ...plan, onBreak };
    }
    // (32.1) Suç: CrimeSystem 08:00'da izole üreteçle (tohum + 42) planladıysa boş zamanda / molada, acil ihtiyaç, yangın, isyan, yara,
    // teselli ve yas önceliklerinden SONRA (randevu, sohbet, alışveriş ve planLeisure'dan ÖNCE) hedefin kapısına gider; zar çekmez.
    // Plan enjekte edildiğinde atlanan randevu / sohbet / alışveriş / planLeisure zarlarının kayması beklenen bir durumdur (suç
    // işlenmedikçe kararlar ve zar sırası aynıdır). Ölçüm: planLeisure'ın hemen önünde planların ~%75'i sohbete (meydan) kaçıyordu.
    // Buraya mesai saatinde gelen sakin ya moladadır ya da iş bulamamıştır (boşta): ikisi de boş zaman sayılır.
    if (c.crimePlan && engineOn('justice') && !c.isChild) {
      const plan = this.planCrime(c, hour);
      if (plan) return { ...plan, onBreak };
    }
    // (32.2) Kamu Hizmeti: Adalet Sarayı'nın cezası, boş zamanda / molada (mesai ve uyku bölünmez, acil ihtiyaçlar önce); zar çekmez
    if (!c.isChild && (!isWorkHours(hour) || onBreak) && serviceDue(this.world.state, c)) {
      const plan = this.planService(c);
      if (plan) return { ...plan, onBreak };
    }
    // (32.5) Kulüp buluşması: ClubSystem buluşmayı kurduysa (en az 3 uygun üye) üye kulüp evine gider. Acil ihtiyaç, yangın, isyan,
    // şenlik, Toplanma Zili / konser, anma, düğün, aile yemeği, yas, teselli, suç planı ve kamu hizmeti önce; yalnızca mesai dışında
    // (uyku yukarıda önce gelir: mesai ve uyku bölünmez). Randevu, sohbet ve planLeisure'dan ÖNCE; zar çekmez. Üyesi yokken çalışmaz.
    if (c.club && this.clubs && engineOn('clubs') && !c.isChild && !grieving && !isWorkHours(hour)) {
      const plan = this.clubs.planSession(c);
      if (plan) return plan;
    }
    // (19. aşama) Bekâr ve ilişkisi yüksek sakinler boş zamanlarında birbirleriyle vakit geçirmeye öncelik verir
    if (!c.isChild && !c.married && !grieving && (!isWorkHours(hour) || onBreak)) {
      const plan = this.planDate(c, hour);
      if (plan) return { ...plan, onBreak };
    }
    // (29.2) yalnızlık sızısı / tatsız karşılaşma: dost arar (İçine Kapanık ise kalabalığa değil tenha köşeye çekilir: planLeisure)
    // (29.3) sohbet / dost / barışma arzusu olan (İçine Kapanık dahil) de arar; yastaki sakinde arzular davranışa yansımaz
    const seeking = (c.drive.social && !grieving) || (c.mood.seek && !c.traits.includes('introvert'));
    if ((needs.social < profile.thresholds.social || seeking) && !c.isChild) {
      const plan = this.planSocial(c, hour);
      if (plan) return { ...plan, onBreak };
    }
    if (c.isChild) {
      const plan = this.planSchool(c, hour);
      if (plan) return plan;
    }
    // (21. aşama) Çantadaki hatıra ve pazar alışverişi
    if (!c.isChild) {
      const plan = this.planKeepsake(c) ?? this.planShop(c);
      if (plan) return { ...plan, onBreak };
    }
    const leisure = this.planLeisure(c, hour);
    return leisure ? { ...leisure, onBreak } : this.planWait();
  }

  /** (32.2) Sürgün yolu: harita kenarındaki çıkış (yol yoksa null; CourtSystem süre dolunca çıkarır). */
  planExile(c) {
    const exit = c.sentence?.exile?.exit;
    if (!exit || !this.world.findPath(this.originTile(c), exit)) return null;
    return { activity: 'exile', spot: exit, duration: 0 };
  }

  /**
   * (32.2) Kamu Hizmeti: meydanın çevresindeki yürüyüş karolarından biri (sakin kimliği ve saatten belirlenir: zar çekmez); yolu
   * olan ilk aday. Bir oturum COURT.serviceMinutes sürer.
   */
  planService(c) {
    const plaza = this.world.landmarks.plaza;
    const center = { x: plaza.centerX, y: plaza.centerY };
    const pool = this.world.strollSpots.filter((p) => distanceSq(p, center) <= 64);
    const spots = pool.length ? pool : this.world.strollSpots;
    if (!spots.length) return null;
    const origin = this.originTile(c);
    const start = (c.id * 7 + Math.floor(this.world.state.totalMinutes / 60)) % spots.length;
    for (let i = 0; i < Math.min(4, spots.length); i++) {
      const spot = spots[(start + i * 3) % spots.length];
      if (this.world.findPath(origin, spot)) return { activity: 'publicService', spot, facing: 'down', duration: COURT.serviceMinutes };
    }
    return null;
  }

  /** (32.1) Yapının ayak izini çevreleyen yürünebilir ve kasabaya bağlı karolar (kapısı olmayan süsler için). */
  crimeRing(b) {
    const { w, h } = BUILDINGS[b.type]?.size ?? { w: 1, h: 1 };
    const out = [];
    for (let y = b.tileY - 1; y <= b.tileY + h; y++) {
      for (let x = b.tileX - 1; x <= b.tileX + w; x++) {
        const edge = x === b.tileX - 1 || x === b.tileX + w || y === b.tileY - 1 || y === b.tileY + h;
        if (edge && this.world.map.isWalkable(x, y) && this.world.isReachable(x, y)) out.push({ x, y });
      }
    }
    return out;
  }

  /** (32.1) Planlanan suçun hedefi: yapının kapısı ya da kurbanın yanı. Zamanı gelmediyse / uygun değilse null. Zar çekmez. */
  planCrime(c, hour) {
    const state = this.world.state;
    const plan = c.crimePlan;
    if (state.totalMinutes < plan.at || state.totalMinutes > plan.until || !crimeReady(state, c, hour)) return null;
    const origin = this.originTile(c);
    let spot = null;
    let target = null;
    if (plan.victimId !== undefined) {
      const v = this.world.getCharacter(plan.victimId);
      if (!v || v.away) return null;
      const home = v.insideBuildingId ? this.world.getBuilding(v.insideBuildingId) : null;
      const doors = home ? this.world.getSpots(home) : [];
      spot = home ? (doors.length ? this.nearest(doors, c) : null) : { x: v.tileX, y: v.tileY };
    } else {
      target = this.world.getBuilding(plan.buildingId);
      if (!target?.functional) return null;
      // süs yapılarının (çit, bank, fener) kullanım noktası yoksa çevresindeki yürünebilir karo
      const doors = this.world.getSpots(target);
      const around = doors.length ? doors : this.crimeRing(target);
      if (!around.length) return null;
      // en yakın birkaç noktadan yolu olan ilki (çitle çevrili bahçe gibi yerlerde en yakın karo kopuk olabilir)
      const d2 = (p) => (p.x - origin.x) ** 2 + (p.y - origin.y) ** 2;
      spot = [...around].sort((p, q) => d2(p) - d2(q)).slice(0, 4).find((p) => this.world.findPath(origin, p)) ?? null;
      // (32.6a) haylazlık: hedefe yol yoksa yakındaki başka bir süs (en çok JUSTICE.vandalRetarget; zar yok, plan güncellenir)
      if (!spot && plan.crime === 'pettyVandal' && JUSTICE.vandalRetarget) {
        const others = this.world.buildings
          .filter((b) => b !== target && b.functional && !b.damaged && !b.isBurning && CRIMES.pettyVandal.targets.includes(b.type))
          .sort((a, b) => d2({ x: a.tileX, y: a.tileY }) - d2({ x: b.tileX, y: b.tileY }) || a.id - b.id)
          .slice(0, JUSTICE.vandalRetarget);
        for (const o of others) {
          const ring = this.world.getSpots(o).length ? this.world.getSpots(o) : this.crimeRing(o);
          spot = [...ring].sort((p, q) => d2(p) - d2(q)).slice(0, 2).find((p) => this.world.findPath(origin, p)) ?? null;
          if (spot) {
            target = o;
            plan.buildingId = o.id;
            break;
          }
        }
      }
      if (!spot) return null;
    }
    // kurban bankta / havuz başında oturuyor olabilir (yürünemez karo): yanına kadar yürür
    if (!spot) return null;
    const blocked = plan.victimId !== undefined && !this.world.map.isWalkable(spot.x, spot.y);
    if (plan.victimId !== undefined && !this.world.findPath(origin, spot, { allowBlockedGoal: blocked })) return null;
    delete c.crimePlan;
    return { activity: 'pilfer', ...(target ? { buildingId: target.id, faceTarget: target.center } : {}), spot, ...(blocked ? { allowBlockedGoal: true } : {}), duration: plan.duration, crime: plan };
  }

  // ---------------------------------------------------------------------------
  // (21. aşama) Kişisel çanta, alışveriş, isyan
  // ---------------------------------------------------------------------------

  /** Krizin kendi üretecinden süre (sabit aralıklar üretece dokunmaz). */
  crisisDuration(activity, fire = null) {
    const range = ACTIVITIES[activity].duration;
    if (!range) return 0;
    const base = range[0] === range[1] ? range[0] : (this.crisis?.rng ?? this.rng).int(range[0], range[1]);
    // (28.1) Acil Seferberlik: kova taşıma işleri 2 kat hızlıdır (süre yarıya iner)
    return fire?.emergencyMuster ? base / FIRE.muster.speed : base;
  }

  /**
   * (23. aşama) Yangın: kovası boşsa en yakın Su Kuyusu'na (yoksa nehir kıyısına) koşup doldurur, doluysa yanan yapının
   * kapısına koşup boşaltır. Yanan yapıya atanmış değilse ya da yol yoksa null.
   */
  planFirefight(c) {
    if (c.away || c.emigrating) return null;
    const fire = this.crisis.fireAssignment(c);
    if (!fire) {
      c.waterBucket = false;
      return null;
    }
    const origin = this.originTile(c);
    if (c.waterBucket) {
      const doors = this.world.getSpots(fire);
      if (doors.length === 0) return null;
      const spot = this.nearest(doors, c);
      if (!this.world.findPath(origin, spot)) return null;
      return { activity: 'fightFire', buildingId: fire.id, fireId: fire.id, spot, faceTarget: fire.center, duration: this.crisisDuration('fightFire', fire) };
    }
    const source = this.crisis.waterSource(fire, c);
    if (!source) return null;
    return {
      activity: 'fetchWater',
      buildingId: source.building?.id ?? null,
      fireId: fire.id,
      spot: source.spot,
      facing: source.spot.facing,
      faceTarget: source.building?.center,
      duration: this.crisisDuration('fetchWater', fire),
    };
  }

  /** (23. aşama) Hafif yaralı: iyileştirici bir Şifacı Kulübesi'ne gider; yoksa şifalı ot demler ya da evinde kestirir. */
  planTreatInjury(c) {
    const origin = this.originTile(c);
    let best = null;
    for (const clinic of this.world.getCompleted('healerHut')) {
      if (clinic.damaged || clinic.isBurning) continue;
      const doors = this.world.getSpots(clinic);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { clinic, spot, cost };
    }
    if (best) {
      return { activity: 'tendWound', buildingId: best.clinic.id, spot: best.spot, finalPoint: best.clinic.entrancePoint, duration: this.crisisDuration('tendWound') };
    }
    if (countItem(c, 'herb') > 0) return { activity: 'herbTea', duration: this.crisisDuration('herbTea') };
    if (c.needs.energy < 90) return this.planSleep(c, true);
    return null;
  }

  /** (22. aşama) Köyü terk eden sakin harita kenarındaki çıkışa yürür (yol yoksa null; DesertionSystem süre dolunca çıkarır). */
  planEmigrate(c) {
    const exit = c.emigrating?.exit;
    if (!exit || !this.world.findPath(this.originTile(c), exit)) return null;
    return { activity: 'emigrate', spot: exit, duration: 0 };
  }

  /** Çantadan yemek (urgent: çok aç; değilse yarı yarıya). */
  planSnack(c, urgent) {
    const kind = foodItemOf(c);
    if (!kind) return null;
    if (!urgent && this.citizenRng.next() >= SNACK.chance) return null;
    return { activity: 'snack', bagItem: kind, duration: this.durationFor('snack') };
  }

  /** Üşüten sakin çantasındaki şifalı otu demler. */
  planHerbTea(c) {
    if (!c.illness || countItem(c, 'herb') <= 0) return null;
    return { activity: 'herbTea', duration: this.durationFor('herbTea') };
  }

  /** Keyfi düşen sakin çantasındaki hatırasına bakar (6 saatte bir). */
  planKeepsake(c) {
    if (c.needs.fun >= SNACK.keepsakeBelowFun || countItem(c, 'souvenir') + countItem(c, 'handkerchief') <= 0) return null; // (32.5) Nakışlı Mendil de
    const now = this.world.state.totalMinutes;
    if (c.lastKeepsakeAt !== undefined && c.lastKeepsakeAt !== null && now - c.lastKeepsakeAt < SNACK.keepsakeCooldownMinutes) return null;
    c.lastKeepsakeAt = now;
    return { activity: 'keepsake', duration: this.durationFor('keepsake') };
  }

  /** Pazar Yeri'nde alışveriş: kesesi yetiyor, çantasında yer varsa, günde en çok bir kez. */
  planShop(c) {
    if (c.role || (c.coins ?? 0) < SHOP.minCoins) return null;
    const now = this.world.state.totalMinutes;
    if (c.lastShopAt !== undefined && c.lastShopAt !== null && now - c.lastShopAt < SHOP.cooldownMinutes) return null;
    const markets = this.world.getCompleted('market');
    if (markets.length === 0 || (roomFor(c, 'fruit') <= 0 && roomFor(c, 'souvenir') <= 0)) return null;
    // (25.3) Girişimci ve Zanaatkâr Pazar'a daha sık uğrar (zar her sakinde aynı atılır)
    // (29.3) "Kendime bir şey alayım" arzusu: eşik shopMul kat (zar yine bir kez atılır)
    if (this.citizenRng.next() >= SHOP.chance * (TEMPERAMENT.shopBoost[c.quirk] ?? 1) * c.drive.shopMul) return null;
    if (isBanned(this.world.state, c)) return null; // (32.2) Uzaklaştırma: Pazar yasağı (zar yine atıldı)
    const origin = this.originTile(c);
    for (const market of markets) {
      const doors = this.world.getSpots(market);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      if (!this.world.findPath(origin, spot)) continue;
      c.lastShopAt = now;
      return { activity: 'shop', buildingId: market.id, spot, faceTarget: market.center, duration: this.durationFor('shop') };
    }
    return null;
  }

  /** İsyancı: yağma baskınındaysa depoya, değilse meydanda (havuz, ateş; yoksa kiler önü) öfkeli toplanma. */
  planRiot(c, hour) {
    if (c.isChild || c.away || hour < REVOLT.hours[0] || hour >= REVOLT.hours[1]) return null;
    const state = this.world.state;
    const raid = raidOf(state, c);
    if (raid && !raid.done.includes(c.id)) {
      const target = this.world.getBuilding(raid.targetId);
      const doors = target ? this.world.getSpots(target) : [];
      if (doors.length) {
        const spot = this.nearest(doors, c);
        if (this.world.findPath(this.originTile(c), spot)) {
          return { activity: 'loot', buildingId: target.id, spot, faceTarget: target.entrancePoint ?? target.center, raidId: raid.id, duration: this.durationFor('loot') };
        }
      }
    }
    const venue = this.world.getCompleted('fountain')[0] ?? this.world.getCompleted('campfire')[0] ?? null;
    if (venue) {
      const plan = this.planGathering(c, venue, null, 'festival');
      if (plan) return { ...plan, activity: 'protest', duration: this.durationFor('protest') };
    }
    const storage = this.world.getCompleted('storage')[0];
    const doors = storage ? this.world.getSpots(storage) : [];
    if (doors.length) return { activity: 'protest', buildingId: storage.id, spot: this.nearest(doors, c), faceTarget: storage.center, duration: this.durationFor('protest') };
    return null;
  }

  /** Boş zaman etkinliğini yarıda kesmeyi gerektiren bir durum var mı? */
  hasUrgentNeed(c, hour) {
    const { needs, profile } = c;
    // Yalnızca giderilebilecek ihtiyaç işi yarıda keser. Kıtlıkta (yiyecek, pişmiş yemek, böğürtlen yok) ya da evsizken
    // her yürüyüşü kesmek sakini "işe git -> yolda vazgeç -> yeniden işe git" döngüsüne sokuyordu: ne çalışıyor ne yiyordu.
    if ((isBedtime(profile, hour) || needs.energy < profile.thresholds.energy - 5) && this.canSleep(c)) return true;
    return needs.hunger < profile.thresholds.hunger - 5 && this.canEat();
  }

  /** Uyuyabileceği bir evi var mı (planSleep bir plan döndürebilir mi)? */
  canSleep(c) {
    const home = this.world.getBuilding(c.homeId);
    return Boolean(home) && (c.insideBuildingId === home.id || this.world.getSpots(home).length > 0);
  }

  /** Kasabada yenecek bir şey var mı: handa pişmiş yemek, depoda yiyecek / ekmek ya da çalıda böğürtlen? (ucuz ön kontrol) */
  canEat() {
    if (this.economy.canFeed(MEAL_FOOD_COST)) return true;
    for (const b of this.world.buildings) {
      if (!b.functional) continue;
      if (b.type === 'inn' && b.meals > 0) return true;
      if (b.type === 'berryBush' && b.berries > 0 && !this.jobs.jobAt(b.tileX, b.tileY)) return true; // emirli çalıdan atıştırılmaz
    }
    return false;
  }

  /**
   * Bu karakter şu an sohbete davet edilebilir mi? Mesai saatinde yalnızca molada olanlar
   * davet edilir (kimse çalışanı işinden alıkoymasın).
   */
  isAvailableForChat(c, hour) {
    if (c.isChild || c.insideBuildingId || !c.visible || isBedtime(c.profile, hour)) return false;
    if (c.needs.social >= PARTNER_SOCIAL_LIMIT) return false;
    if (isWorkHours(hour) && !c.task?.onBreak) return false;
    if (!c.task) return true;
    if (c.task.clubKey && c.task.activity !== 'clubHobby') return false; // (32.5) kulüp buluşmasındaki üye sohbet davetine kalkmaz
    const kind = ACTIVITIES[c.task.activity].kind;
    return kind === 'leisure' || kind === 'idle';
  }

  // ---------------------------------------------------------------------------
  // Plan oluşturucular
  // ---------------------------------------------------------------------------

  planWait() {
    return { activity: 'wait', duration: this.durationFor('wait') };
  }

  /**
   * (29.2) Yas: anıtın başında, çardakta ya da evinin önünde anılara dalar ("Deniz'in aziz hatırasını anıyor").
   * Hiçbiri yoksa null (olağan boş zaman; şenlik ve flört zaten kapalıdır).
   */
  planGrieve(c) {
    const who = getMoodlet(c, 'mourning')?.whoName ?? null;
    const base = () => ({ activity: 'grieve', grieve: true, grieveFor: who, duration: this.durationFor('grieve') }); // süre yalnızca yer bulununca çekilir
    for (const type of ['monument', 'gazebo']) {
      for (const b of this.world.getCompleted(type)) {
        const spots = this.world.freeGatherSpots(b, c.id);
        if (spots.length === 0) continue;
        const spot = this.nearest(spots, c);
        return { ...base(), buildingId: b.id, spot, reserve: true };
      }
    }
    const home = c.homeId !== null ? this.world.getBuilding(c.homeId) : null;
    const doors = home ? this.world.getSpots(home) : [];
    if (doors.length > 0) return { ...base(), spot: this.nearest(doors, c) };
    return null;
  }

  /**
   * (29.2) Teselli: acılı bir yakını (eşi, ailesi, ruh ikizi, kimyası eksi olmayan dostu) varsa yanına gider. Teselli
   * MoodletSystem'de, yan yana CONSOLE.minutes dakika durunca gerçekleşir. Aynı sakin cooldownMinutes ara verir.
   */
  planConsole(c) {
    if (c.away || c.emigrating) return null;
    const state = this.world.state;
    if (c.lastConsoleAt !== null && c.lastConsoleAt !== undefined && state.totalMinutes - c.lastConsoleAt < CONSOLE.cooldownMinutes) return null;
    const s = findSufferer(state, this.world.characters, c);
    if (!s) return null;
    const tx = s.tileX;
    const ty = s.tileY;
    let spot = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!spot && this.world.map.isWalkable(tx + dx, ty + dy)) spot = { x: tx + dx, y: ty + dy };
    }
    spot ??= { x: tx, y: ty };
    return { activity: 'console', spot, consoleId: s.id, consoleName: s.name, duration: this.durationFor('console') };
  }

  planSleep(c, nap) {
    // (28.3) Saygın Büyük'ün yatağı yoktur: geceleri Bilgelik Evi'nde, handa ya da belediyede sabahlar
    const home = c.isVenerable ? this.venerableRoost(c) : this.world.getBuilding(c.homeId);
    if (!home) return null;
    if (c.insideBuildingId === home.id) return { activity: 'sleep', buildingId: home.id, nap };
    const doors = this.world.getSpots(home);
    if (doors.length === 0) return null;
    return {
      activity: 'sleep',
      buildingId: home.id,
      nap,
      spot: this.nearest(doors, c),
      finalPoint: home.entrancePoint,
    };
  }

  /** (28.3) Saygın Büyük'ün sabahladığı yapı: VENERABLE.sleepVenues sırasıyla ilk sağlam yapı (aynı türde en yakın). */
  venerableRoost(c) {
    for (const type of VENERABLE.sleepVenues) {
      const options = this.world.getCompleted(type).filter((b) => b.functional && !b.damaged && !b.isBurning && this.world.getSpots(b).length > 0);
      if (options.length === 0) continue;
      return options.reduce((best, b) => (Math.hypot(b.center.x - c.x, b.center.y - c.y) < Math.hypot(best.center.x - c.x, best.center.y - c.y) ? b : best));
    }
    return null;
  }

  /** Acıkınca: stokta yiyecek varsa evde / kilerde yemek (daha hızlı), yoksa böğürtlen. */
  planEat(c) {
    const meal = this.planMeal(c);
    const berries = this.planBerries(c);
    if (meal && berries) return berries.cost < meal.cost * 0.4 ? berries : meal;
    return meal ?? berries;
  }

  /**
   * Oturup yemek: pişmiş yemeği olan han (tercih edilir, sıcak yemek), kiler ya da ev (kilerden 3 yiyecek).
   * En kısa yol seçilir; han yolu yarı maliyetli sayılır.
   */
  planMeal(c) {
    const origin = this.originTile(c);
    const places = [];
    // (32.2) Uzaklaştırma cezalısı hana giremez; evde ve kilerde yemek her zaman serbest
    if (!isBanned(this.world.state, c)) for (const inn of this.world.getCompleted('inn')) if (inn.meals > 0) places.push({ place: inn, activity: 'innMeal' });
    // Kilerde yiyecek ya da ekmek (2,5 yiyecek değerinde) varsa evde / kilerde oturup yenir
    if (this.economy.canFeed(MEAL_FOOD_COST)) {
      for (const storage of this.world.getCompleted('storage')) places.push({ place: storage, activity: 'meal' });
      const home = this.world.getBuilding(c.homeId);
      if (home && !home.underConstruction) places.push({ place: home, activity: 'meal' });
    }

    let best = null;
    for (const { place, activity } of places) {
      // Zaten oradaysa yürümeden yer
      if (c.insideBuildingId === place.id) return { activity, buildingId: place.id, cost: 0, duration: this.durationFor(activity) };
      const doors = this.world.getSpots(place);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path) * (activity === 'innMeal' ? INN_MEAL_PREFERENCE : 1);
      if (!best || cost < best.cost) best = { place, activity, spot, cost };
    }
    if (!best) return null;
    return {
      activity: best.activity,
      buildingId: best.place.id,
      spot: best.spot,
      finalPoint: best.place.entrancePoint,
      cost: best.cost,
      duration: this.durationFor(best.activity),
    };
  }

  /** Taşıdığı yükü en yakın kilere bırakma planı. */
  planHaul(c) {
    const origin = this.originTile(c);
    let best = null;
    for (const storage of this.world.getCompleted('storage')) {
      const doors = this.world.getSpots(storage);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { storage, spot, cost };
    }
    if (!best) return null;
    return {
      activity: 'haul',
      cargo: c.carrying.resource,
      buildingId: best.storage.id,
      spot: best.spot,
      faceTarget: best.storage.entrancePoint,
      duration: this.durationFor('haul'),
    };
  }

  /** Çocuk: ders saatinde, bugünkü dersini dinlemediyse en yakın Bilgelik Evi'ne gider (yoksa null). */
  planSchool(c, hour) {
    if (!this.research || !this.research.schoolHours(hour)) return null;
    const today = c.schoolDay === this.world.state.time.day ? c.schoolToday : 0;
    if (today >= SCHOOL.minutesPerDay - 10) return null; // bugünkü dersini (neredeyse) dinledi
    const origin = this.originTile(c);
    for (const school of this.research.academies()) {
      const doors = this.world.getSpots(school);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      if (!this.world.findPath(origin, spot)) continue;
      return { activity: 'school', buildingId: school.id, spot, finalPoint: school.entrancePoint, duration: Math.min(this.durationFor('school'), SCHOOL.minutesPerDay - today) };
    }
    return null;
  }

  /** Hasta sakin: iksiri olan en yakın şifacı kulübesine gidip içeride tedavi olur (yoksa null). */
  planHeal(c) {
    if (!this.health) return null;
    const origin = this.originTile(c);
    let best = null;
    for (const clinic of this.health.clinics()) {
      if (clinic.remedies - this.health.claims(clinic, c) <= 0) continue;
      const doors = this.world.getSpots(clinic);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { clinic, spot, cost };
    }
    if (!best) return null;
    return {
      activity: 'heal',
      buildingId: best.clinic.id,
      spot: best.spot,
      finalPoint: best.clinic.entrancePoint,
      // Şifalı Bitki Yetiştiriciliği araştırması tedaviyi hızlandırır
      duration: Math.ceil(this.durationFor('heal') / healSpeedMultiplier(this.world.state)),
    };
  }

  /**
   * Şifacının işi: kulübede yeterince ot yoksa yakındaki ağaçların ya da çiçeklerin dibinde ot toplar,
   * varsa kulübenin önündeki tezgâhta iksir hazırlar.
   */
  planHerbalist(c, building, found, duration) {
    const spec = building.definition.apothecary;
    const brewing = building.herbs >= spec.herbsPerRemedy && building.remedies < spec.maxRemedies;
    const gathering = building.herbs < spec.maxHerbs && (!brewing || building.herbs < spec.herbsPerRemedy * 2);
    if (gathering) {
      const spot = this.herbSpot(c, building);
      if (spot) {
        return {
          activity: 'gatherHerbs',
          buildingId: building.id,
          workBuildingId: building.id,
          spot,
          reserve: true,
          facing: spot.facing ?? 'down',
          faceTarget: spot.face,
          duration,
        };
      }
    }
    return {
      activity: 'brew',
      buildingId: building.id,
      workBuildingId: building.id,
      spot: found.spot,
      reserve: true,
      faceTarget: building.center,
      finalPoint: this.freeWorkPoint(building, c),
      facing: building.workFacing,
      duration,
    };
  }

  /** Kulübenin yakınında ot toplanacak yer: bir ağacın dibi ya da çiçekli çimen (yoksa null). */
  herbSpot(c, building) {
    const spec = building.definition.apothecary;
    const cx = building.tileX + 1;
    const cy = building.tileY + 1;
    const options = [];
    const map = this.world.map;
    for (let y = cy - spec.natureRadius; y <= cy + spec.natureRadius; y++) {
      for (let x = cx - spec.natureRadius; x <= cx + spec.natureRadius; x++) {
        const object = map.getObject(x, y);
        if (object !== 'oak' && object !== 'pine') continue;
        for (const s of this.world.getApproachSpots(x, y)) {
          if (!this.world.isReserved(s.x, s.y, c.id)) options.push({ ...s, face: { x: x * 16 + 8, y: y * 16 + 8 } });
        }
      }
    }
    for (const s of this.world.flowerSpots) {
      if (Math.abs(s.x - cx) <= spec.natureRadius && Math.abs(s.y - cy) <= spec.natureRadius && !this.world.isReserved(s.x, s.y, c.id)) options.push(s);
    }
    if (options.length === 0) return null;
    const origin = this.originTile(c);
    options.sort((a, b) => distanceSq(a, origin) - distanceSq(b, origin));
    return this.rng.pick(options.slice(0, 6));
  }

  /** İş kuyruğundan bir iş ya da üretim binasında boş bir koltuk. */
  planWork(c) {
    const found = this.jobs.findWorkFor(c, this.originTile(c));
    if (!found) return null;
    const duration = this.rng.int(WORK_SESSION[0], WORK_SESSION[1]);
    if (found.job) {
      return {
        activity: found.job.type,
        jobId: found.job.id,
        buildingId: found.job.buildingId ?? null,
        spot: found.spot,
        reserve: true,
        faceTarget: this.jobs.targetCenter(found.job),
        duration,
      };
    }
    const building = found.building;
    if (building.definition.apothecary) return this.planHerbalist(c, building, found, duration);
    return {
      activity: building.definition.workActivity,
      buildingId: building.id,
      workBuildingId: building.id,
      spot: found.spot,
      reserve: true,
      faceTarget: building.center,
      // iskele ucu / ocağın kaya yüzü önü; handa aşçı kapıdan içeri girer
      finalPoint: this.freeWorkPoint(building, c) ?? (ACTIVITIES[building.definition.workActivity].indoor ? building.entrancePoint : undefined),
      facing: building.workFacing,
      duration,
    };
  }

  /** Yapının diğer çalışanların tutmadığı ilk çalışma noktası (tanımlı değilse undefined). */
  freeWorkPoint(building, c) {
    const points = building.workPoints;
    if (points.length === 0) return undefined;
    const taken = [...building.workerIds]
      .filter((id) => id !== c.id)
      .map((id) => this.world.getCharacter(id)?.task?.finalPoint)
      .filter(Boolean);
    return points.find((p) => !taken.some((t) => t.x === p.x && t.y === p.y)) ?? points[0];
  }

  /** Yeni gelen sakin kenardaki yoldan yürüyüp evine yerleşir; evlenen sakin eşiyle paylaşacağı eve taşınır. */
  planMoveIn(c) {
    const home = this.world.getBuilding(c.homeId);
    if (!home) return null;
    const activity = c.newcomer ? 'moveIn' : 'relocate';
    if (c.insideBuildingId === home.id) return { activity, buildingId: home.id, duration: this.durationFor(activity) };
    const doors = this.world.getSpots(home);
    if (doors.length === 0) return null;
    return {
      activity,
      buildingId: home.id,
      spot: this.nearest(doors, c),
      finalPoint: home.entrancePoint,
      duration: this.durationFor(activity),
    };
  }

  /**
   * Depoda bu sakine ayrılmış boşta ekipman varsa en yakın atölyeye / kilere gidip kuşanma planı.
   * Alınacak yer yoksa (atölye yıkılmış) olduğu yerde kuşanır.
   */
  planEquip(c) {
    const item = this.crafting.itemFor(c);
    if (!item) return null;
    const plan = { activity: 'equip', item, duration: this.durationFor('equip') };
    const origin = this.originTile(c);
    let best = null;
    for (const place of this.crafting.pickupPlaces()) {
      const doors = this.world.getSpots(place);
      if (doors.length === 0) continue;
      const spot = this.nearest(doors, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { place, spot, cost };
    }
    if (!best) return plan;
    return { ...plan, buildingId: best.place.id, spot: best.spot, faceTarget: best.place.entrancePoint };
  }

  planBerries(c) {
    const origin = this.originTile(c);
    let best = null;
    for (const bush of this.world.getBuildingsOfType('berryBush')) {
      // Toplama emri verilmiş çalıdan atıştırılmaz (kilere gidecek)
      if (bush.berries <= 0 || this.jobs.jobAt(bush.tileX, bush.tileY)) continue;
      const spots = this.world.freeSpots(bush, c.id);
      if (spots.length === 0) continue;
      const spot = this.nearest(spots, c);
      const path = this.world.findPath(origin, spot);
      if (!path) continue;
      const cost = this.world.pathCost(path);
      if (!best || cost < best.cost) best = { bush, spot, cost };
    }
    if (!best) return null;
    return {
      activity: 'eat',
      buildingId: best.bush.id,
      spot: best.spot,
      reserve: true,
      cost: best.cost,
      duration: this.durationFor('eat'),
    };
  }

  planSocial(c, hour) {
    const banned = isBanned(this.world.state, c); // (32.2) Han yasağı
    const gatherings = banned ? this.availableGatherings().filter((b) => !COURT.banVenues.includes(b.type)) : this.availableGatherings();

    // Önce zaten insanların toplandığı yere katıl
    let best = null;
    for (const building of gatherings) {
      const people = this.participants(building, c);
      const count = people.length;
      if (count === 0 || this.world.freeGatherSpots(building, c.id).length === 0) continue;
      // (29.1) kırgın olduğu biri oturuyorsa o masaya gitmez; minnettar olduğu kişinin yanına gitmeye can atar
      const mood = this.companyMood(c, people);
      if (mood < 0) continue;
      const rank = count + mood * 3 + (building.type === 'inn' ? 1.5 : building.type === 'campfire' ? 0.5 : building.type === 'gazebo' ? 1 : 0);
      const better = !best || rank > best.count;
      if (better) best = { building, count: rank };
    }
    if (best) return this.planGathering(c, best.building);

    // Kimse yoksa uygun birini davet et
    // (29.1) kırgın olduğu birinin oturduğu yerde kendi sohbetini de başlatmaz
    const calm = gatherings.filter((b) => this.companyMood(c, this.participants(b, c)) >= 0);
    const campfire = calm.find((b) => b.type === 'campfire');
    const fountain = calm.find((b) => b.type === 'fountain');
    const inn = calm.find((b) => b.type === 'inn');
    const evening = hour >= EVENING_START || hour < EVENING_END;
    // Akşamları han kamp ateşinden de çok sevilir
    let place = evening ? inn ?? campfire ?? fountain : fountain ?? campfire ?? inn;
    // (13. aşama) Çiftler çardakta baş başa oturmayı, dostlar da arada bir orada sohbeti sever
    const gazebo = calm.find((b) => b.type === 'gazebo' && this.world.freeGatherSpots(b, c.id).length >= 2);
    const lover = c.partnerId !== null && c.partnerId !== undefined ? this.world.getCharacter(c.partnerId) : null;
    if (gazebo && ((lover && this.isAvailableForChat(lover, hour)) || this.rng.next() < GAZEBO_INVITE_CHANCE)) place = gazebo;
    if (!place) return null;

    const plan = this.planGathering(c, place);
    if (!plan) return null;
    const partner = place === gazebo && lover && this.isAvailableForChat(lover, hour) ? lover : this.findPartner(c, hour);
    if (partner) plan.inviteId = partner.id;
    return plan;
  }

  /**
   * Toplanma yerine (havuz/ateş) gitme planı.
   * - Havuzda sohbet edenler yan yana durur: nearSpot (davet edenin yeri) verilirse ona en yakın boş yer.
   * - Ateş başında herkes ateşe döner: dolu yerlerin yanına ceza verilerek çember boyunca yayılırlar.
   */
  planGathering(c, building, nearSpot = null, mode = 'gather', fixedDuration = null) {
    if (banBlocks(this.world.state, c, building)) return null; // (32.6a) Uzaklaştırma: davet / randevu / sohbet planı dahil, ortak nokta
    const spots = this.world.freeGatherSpots(building, c.id, mode);
    if (spots.length === 0) return null;
    const spread = mode === 'festival' || Boolean(ACTIVITIES[building.type]?.faceBuilding);
    const reference = spread || !nearSpot ? this.originTile(c) : nearSpot;
    const taken = spread ? this.world.getGatherSpots(building, mode).filter((s) => this.world.isReserved(s.x, s.y, c.id)) : [];
    const crowding = (spot) => taken.filter((t) => Math.max(Math.abs(t.x - spot.x), Math.abs(t.y - spot.y)) <= 1).length;
    const score = (spot) => Math.sqrt(distanceSq(spot, reference)) + crowding(spot) * 4;
    const ordered = [...spots]
      .filter((s) => !nearSpot || s.x !== nearSpot.x || s.y !== nearSpot.y)
      .sort((a, b) => score(a) - score(b));
    if (ordered.length === 0) return null;
    const spot = ordered[0];
    return {
      activity: building.type,
      buildingId: building.id,
      spot,
      reserve: true,
      // Çardakta önündeki karodan içeri, bankına oturur
      ...(spot.seat ? { finalPoint: spot.seat, facing: 'down' } : {}),
      // Liman ve iskele gibi toplanma etkinliği olmayan festival yerlerinde süreyi çağıran belirler
      // (29.7) fixedDuration: süre çağırandan gelir, zar çekilmez (anma töreni)
      duration: fixedDuration ?? (ACTIVITIES[building.type] ? this.durationFor(building.type) : 60),
    };
  }

  /** (29.7) Anma Töreni: anıtın (yoksa meydan havuzunun) çevresinde tören bitene (19:00) kadar; zar çekmez. */
  planMemorial(c) {
    const state = this.world.state;
    const w = riteWindow(state);
    const now = state.totalMinutes;
    if (!w || now >= w.end - 3) return null;
    const venue = this.world.getBuilding(state.rites.active.place) ?? riteVenue(state);
    if (!venue?.functional) return null;
    const plan = this.planGathering(c, venue, null, 'festival', Math.max(3, w.end - now));
    if (!plan) return null;
    return { ...plan, activity: 'memorial' };
  }

  /** (30.3) İş bırakma: meydan havuzunun (yoksa kamp ateşinin) çevresinde 12:00'ye kadar; zar çekmez. */
  planStrike(c) {
    const state = this.world.state;
    const venue = this.world.getCompleted('fountain')[0] ?? this.world.getCompleted('campfire')[0] ?? null;
    if (!venue) return null;
    const end = (state.time.day - 1) * 1440 + DISCONTENT.strike.hours[1] * 60;
    const left = end - state.totalMinutes;
    if (left < 3) return null;
    const plan = this.planGathering(c, venue, null, 'festival', left);
    if (!plan) return null;
    return { ...plan, activity: 'strike' };
  }

  /** Toplanma Zili: meydanın çevresinde zil süresi bitene kadar beklemek. */
  planRally(c) {
    const rally = this.world.state.rally;
    const venue = this.world.getBuilding(rally.venueId);
    if (!venue) return null;
    const plan = this.planGathering(c, venue, null, 'festival');
    if (!plan) return null;
    return { ...plan, activity: 'rally', duration: Math.max(5, rally.until - this.world.state.totalMinutes) };
  }

  /** Şenlik yerine gidip bitene kadar dans etmek. */
  planFestival(c) {
    const festival = this.world.state.events.festival;
    const venue = this.world.getBuilding(festival.venueId);
    if (!venue) return null;
    const plan = this.planGathering(c, venue, null, 'festival');
    if (!plan) return null;
    return { ...plan, activity: 'festival', duration: Math.max(10, festival.endsAt - this.world.state.totalMinutes) };
  }

  planLeisure(c, hour) {
    const weights = { ...c.profile.leisure };
    // Mevsim tercihleri: kışın nehir ve çiçek yerine ateş başı ve han, yazın nehir kenarı
    for (const [name, m] of Object.entries(getSeason(this.world.state.time.day).leisure)) weights[name] = (weights[name] ?? 0) * m;
    const campfire = this.world.getBuildingsOfType('campfire')[0];
    const evening = hour >= EVENING_START + 1 || hour < EVENING_END;
    if (!campfire?.lit) weights.campfire = 0;
    else if (evening) weights.campfire *= 4;
    const inn = this.world.getCompleted('inn').find((b) => b.lit);
    if (!inn) weights.inn = 0;
    else if (evening) weights.inn *= 5;
    const banned = isBanned(this.world.state, c); // (32.2) Uzaklaştırma: han ağırlığı 0
    if (banned) weights.inn = 0;
    // (16. aşama) Seferden dönen maceracı anlatacak hikâyesiyle hana koşar (han yoksa ateş başına / meydana)
    if (c.tale) {
      weights.inn = (weights.inn ?? 0) * 6;
      weights.campfire = (weights.campfire ?? 0) * 2;
      weights.fountain = (weights.fountain ?? 0) * 1.5;
    }
    // Anıt, kadim çeşme ve erzak kampı yalnızca kullanılabilir hâldeyse
    for (const [activity, type] of LANDMARK_LEISURE) {
      if (this.world.getCompleted(type).length === 0) weights[activity] = 0;
    }
    // (13. aşama) Çardak: meydandaki havuz kadar sevilir; sevgilisi / eşi olan için iki kat
    if (this.availableGatherings().some((b) => b.type === 'gazebo')) weights.gazebo = (weights.fountain ?? 1) * (c.partnerId !== null && c.partnerId !== undefined ? 1.8 : 0.9);
    for (const building of this.availableGatherings()) {
      if (banned && COURT.banVenues.includes(building.type)) continue;
      const people = this.participants(building, c);
      if (people.length === 0) continue;
      // (29.1) kırgın olduğu kişinin oturduğu yerden kaçınır, minnettar olduğu kişinin olduğu yere meyleder
      const mood = this.companyMood(c, people);
      weights[building.type] = (weights[building.type] ?? 0) * 1.6 * (mood < 0 ? EMOTION_RULES.resentVenue : mood > 0 ? EMOTION_RULES.gratefulVenue : 1);
    }
    // (18. aşama) Ulu süs ağaçlarının gölgesinde dinlenmek: bankı ve çiçekleri sevenler daha çok sever (kışın az)
    if (this.shadeTrees().length > 0) {
      const winter = getSeason(this.world.state.time.day).key === 'winter';
      weights.shade = ((weights.bench ?? 1) + (weights.flowers ?? 1)) * (winter ? 0.15 : 0.5);
    }
    this.addQuirkLeisure(c, hour, weights);
    // (29.2) ruh hali: bıkkın / tükenmiş / üşümüş sakin hana, ateş başına ve banka (dinlenme, ısınma) yönelir; yalnızlık ya da
    // tatsız karşılaşma yaşamış İçine Kapanık kalabalık han yerine tenha bir köşede huzur arar
    if (c.mood.shirk) {
      for (const k of ['inn', 'campfire', 'bench', 'shade']) if (weights[k]) weights[k] *= 2;
      if (weights.stroll) weights.stroll *= 0.3;
    }
    // (32.2) Mahcup (sürgün edilenin ailesi): kalabalık mekânlardan hafifçe kaçınır
    if (engineOn('court') && getMoodlet(c, 'shamed')) for (const k of ['inn', 'fountain', 'campfire', 'gazebo']) if (weights[k]) weights[k] *= SHAME.crowdMul;
    if (c.mood.seek && c.traits.includes('introvert')) {
      for (const k of ['bench', 'river', 'readBench', 'readLibrary', 'viewpoint', 'shade', 'flowers']) if (weights[k]) weights[k] *= 3;
      for (const k of ['inn', 'fountain', 'campfire', 'gazebo']) if (weights[k]) weights[k] *= 0.3;
    }
    // (29.3) arzular: işaret ettikleri boş zaman etkinlikleri (yalnızca zaten açık olanlar ölçeklenir; kapalı mekân açılmaz);
    // "Soğukta üşümek" korkusu sonbahar / kışta han ve ateş başını öne çıkarır. Yastaki sakinde uygulanmaz.
    if (!c.mood.grief) {
      for (const [k, m] of Object.entries(c.drive.leisure)) if (weights[k]) weights[k] *= m;
      if (c.drive.warmth && COLD_SEASONS.includes(getSeason(this.world.state.time.day).key)) for (const k of WARMTH_LEISURE) if (weights[k]) weights[k] *= WANT_RULES.warmthMul;
    }
    // (25.1) Kıdemli Bilge: çardak ve gölge (yukarıda yeniden hesaplanır) ile Bilgelik Evi'nde kitap okumak daha cazip
    if (c.profile.elder) {
      if (weights.gazebo) weights.gazebo *= ELDER.leisure.gazebo;
      if (weights.shade) weights.shade *= ELDER.leisure.shade;
      if (this.world.getCompleted('academy').length > 0) weights.readLibrary = (weights.readLibrary ?? 0) + ELDER.readLibraryBase * ELDER.leisure.readLibrary;
      // (32.4) Misafir hoca: Darülfünun varken ders saatinde düşük ağırlıklı "Darülfünun'da sohbet" (yapı yokken anahtar hiç eklenmez)
      if (this.university && universityOf(this.world.state) && isLectureHour(hour)) weights.uniTalk = ELDER.readLibraryBase * UNIVERSITY.guestWeight;
    }
    // (32.5) Kulüp üyesi: kendi kulüp evinde tek başına uğraş (düşük ağırlık; kulübü ya da yapısı yokken anahtar hiç eklenmez)
    if (c.club && this.clubs?.hobbyAvailable(c)) weights.clubHobby = CLUB.hobbyWeight;

    const options = Object.entries(weights).filter(([name, w]) => w > 0 && ACTIVITIES[name]);
    while (options.length > 0) {
      const choice = this.rng.weighted(options);
      const plan = this.resolveLeisure(c, choice, hour);
      if (plan) return plan;
      options.splice(options.findIndex(([name]) => name === choice), 1);
    }
    return null;
  }

  resolveLeisure(c, activity, hour) {
    const duration = this.durationFor(activity);
    switch (activity) {
      case 'bench': {
        // (18. aşama) Ahşap bank ve park bankı
        const benches = this.freeBenches(c);
        if (benches.length === 0) return null;
        const bench = this.nearest(benches.map((b) => ({ x: b.tileX, y: b.tileY, bench: b })), c).bench;
        return this.benchPlan(bench, activity, duration);
      }
      // (19. aşama) Karakter huyları
      case 'petAnimal':
        return this.planPetAnimal(c, duration);
      case 'readBench': {
        const benches = this.lanternBenches(c);
        if (benches.length === 0) return null;
        const bench = this.nearest(benches.map((b) => ({ x: b.tileX, y: b.tileY, bench: b })), c).bench;
        return this.benchPlan(bench, activity, duration);
      }
      case 'readLibrary': {
        const origin = this.originTile(c);
        for (const library of this.world.getCompleted('academy')) {
          const doors = this.world.getSpots(library);
          if (doors.length === 0) continue;
          const spot = this.nearest(doors, c);
          if (!this.world.findPath(origin, spot)) continue;
          return { activity, buildingId: library.id, spot, finalPoint: library.entrancePoint, duration };
        }
        return null;
      }
      case 'uniTalk': {
        // (32.4) misafir Kıdemli Bilge: Darülfünun'un kapısından içeri
        const uni = universityOf(this.world.state);
        const doors = uni ? this.world.getSpots(uni) : [];
        if (!doors.length) return null;
        const spot = this.nearest(doors, c);
        if (!this.world.findPath(this.originTile(c), spot)) return null;
        return { activity, buildingId: uni.id, spot, finalPoint: uni.entrancePoint, duration };
      }
      case 'clubHobby':
        return this.clubs?.planHobby(c, duration) ?? null; // (32.5)
      case 'music':
        return this.planMusic(c, hour, duration);
      case 'viewpoint':
        return this.planViewpoint(c, duration);
      case 'river':
      case 'flowers': {
        const pool = activity === 'river' ? this.world.riverbankSpots : this.world.flowerSpots;
        const spot = this.pickNearby(pool, c, 26);
        if (!spot) return null;
        return { activity, spot, reserve: true, facing: spot.facing ?? 'down', duration };
      }
      case 'monument':
      case 'ancientSpring':
      case 'campRest': {
        // Anıtı gururla seyreder, kadim çeşmede tazelenir ya da erzak kampında soluklanır
        const places = this.world.getCompleted(LANDMARK_LEISURE.get(activity)).map((b) => ({ x: b.tileX, y: b.tileY, building: b }));
        if (places.length === 0) return null;
        const place = this.nearest(places, c).building;
        const spots = this.world.freeGatherSpots(place, c.id);
        if (spots.length === 0) return null;
        return { activity, buildingId: place.id, spot: this.nearest(spots, c), reserve: true, duration };
      }
      case 'fountain':
      case 'inn':
      case 'campfire': {
        const building = this.availableGatherings().find((b) => b.type === activity);
        return building ? this.planGathering(c, building) : null;
      }
      case 'gazebo': {
        const gazebos = this.availableGatherings().filter((b) => b.type === 'gazebo' && this.world.freeGatherSpots(b, c.id).length > 0);
        if (gazebos.length === 0) return null;
        return this.planGathering(c, this.nearest(gazebos.map((b) => ({ x: b.tileX, y: b.tileY, b })), c).b);
      }
      case 'shade': {
        // (18. aşama) Ulu süs ağacının yanındaki boş bir karoya oturup gölgede dinlenir (yüzü ağaca dönük)
        const spot = this.pickNearby(this.shadeSpots(c, this.shadeTrees()), c, 26);
        if (!spot) return null;
        return { activity, spot, reserve: true, facing: spot.facing, duration };
      }
      case 'play': {
        // Çocuklar meydanda, havuzun, ateşin ve hanın çevresinde koşuşturur
        const spot = this.pickNearby(this.playSpots(), c, 30);
        if (!spot) return null;
        return { activity, spot, reserve: true, facing: this.rng.pick(['down', 'left', 'right']), duration };
      }
      case 'stroll': {
        const candidates = this.world.strollSpots.filter((s) => {
          const d = Math.sqrt(distanceSq(s, { x: c.tileX, y: c.tileY }));
          return d >= 6 && d <= 20;
        });
        if (candidates.length === 0) return null;
        const spot = this.rng.pick(candidates);
        return { activity, spot, facing: this.rng.pick(['down', 'left', 'right']), duration };
      }
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Yardımcılar
  // ---------------------------------------------------------------------------

  /** (18. aşama) Gölgesinde dinlenilebilen ulu süs ağaçları; (19. aşama) Doğa Tutkunu genç ağaçlara da oturur. */
  shadeTrees(minStage = 2) {
    return this.world.buildings.filter((b) => b.functional && BUILDINGS[b.type].ornamentalTree && b.growthStage >= minStage);
  }

  /** Ağaçların çevresindeki boş gölge karoları: [{ x, y, facing, treeId }]. */
  shadeSpots(c, trees) {
    const spots = [];
    for (const tree of trees) {
      for (const [dx, dy, facing] of SHADE_SIDES) {
        const x = tree.tileX + dx;
        const y = tree.tileY + dy;
        if (this.world.map.isWalkable(x, y) && this.world.isReachable(x, y) && !this.world.isReserved(x, y, c.id)) spots.push({ x, y, facing, treeId: tree.id });
      }
    }
    return spots;
  }

  /** Oturulabilen boş banklar. */
  freeBenches(c) {
    return this.world.getCompleted().filter((b) => BENCH_TYPES.includes(b.type) && this.world.freeSpots(b, c.id).length > 0);
  }

  /** Bankta oturma planı (bank, Kitap Kurdu'nun okuma bankı, randevu bankı). */
  benchPlan(bench, activity, duration) {
    return {
      activity,
      buildingId: bench.id,
      spot: { x: bench.tileX, y: bench.tileY },
      allowBlockedGoal: true,
      finalPoint: bench.seatPoint,
      reserve: true,
      facing: 'down',
      duration,
    };
  }

  // ---------------------------------------------------------------------------
  // 19. aşama: sosyal yaşam
  // ---------------------------------------------------------------------------

  /** Huyun boş zaman ağırlıkları (yalnızca o an yapılabiliyorsa). */
  addQuirkLeisure(c, hour, weights) {
    const quirk = QUIRKS[c.quirk];
    // Müzisyen çalarken handa / meydanda olmak herkese daha cazip gelir
    for (const m of this.world.characters) {
      if (m === c || m.task?.activity !== 'music' || m.task.phase !== 'perform') continue;
      const venue = this.world.getBuilding(m.task.buildingId);
      if (venue && weights[venue.type] !== undefined) weights[venue.type] *= QUIRK_RULES.listenBoost;
    }
    if (!quirk) return;
    for (const [name, w] of Object.entries(quirk.leisure)) weights[name] = (weights[name] ?? 0) + w;
    if (weights.petAnimal) {
      const pets = this.visiblePets();
      if (pets.length === 0) weights.petAnimal = 0;
      else if (pets.some((p) => Math.hypot(p.x - c.x, p.y - c.y) <= QUIRK_RULES.petSeenTiles * 16)) weights.petAnimal *= QUIRK_RULES.seenBoost;
    }
    if (weights.music && !this.isMusicHour(hour)) weights.music = 0;
    if (weights.readLibrary && this.world.getCompleted('academy').length === 0) weights.readLibrary = 0;
  }

  isMusicHour(hour) {
    return hour >= QUIRK_RULES.musicFrom && hour < QUIRK_RULES.musicTo;
  }

  visiblePets() {
    return this.world.state.animals.filter((a) => a.isPet && a.visible && a.mode !== 'arrive' && a.mode !== 'sleep' && a.mode !== 'toShelter');
  }

  /** Hayvansever: yakındaki kediye / köpeğe yürüyüp başını okşar. */
  planPetAnimal(c, duration) {
    const origin = this.originTile(c);
    const maxSq = (QUIRK_RULES.petSearchTiles * 16) ** 2;
    const pets = this.visiblePets()
      .filter((p) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= maxSq && !(p.heldUntil > this.world.state.totalMinutes && p.heldBy !== c.id))
      .sort((p, q) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2 - ((q.x - c.x) ** 2 + (q.y - c.y) ** 2));
    for (const pet of pets.slice(0, 3)) {
      const tx = Math.floor(pet.x / 16);
      const ty = Math.floor(pet.y / 16);
      const spot = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }))
        .find((s) => this.world.map.isWalkable(s.x, s.y) && this.world.isReachable(s.x, s.y) && !this.world.isReserved(s.x, s.y, c.id));
      if (!spot || !this.world.findPath(origin, spot)) continue;
      const kind = pet.kind === 'cat' ? 'kedi' : 'köpek';
      return { activity: 'petAnimal', spot, petId: pet.id, petName: `${kind} ${genitive(pet.name ?? kind)}`, faceTarget: { x: pet.x, y: pet.y }, duration };
    }
    return null;
  }

  /** Fenere yakın boş banklar (Kitap Kurdu'nun okuma yeri). */
  lanternBenches(c) {
    const lanterns = this.world.buildings.filter((b) => b.functional && (b.type === 'lantern' || b.type === 'ironLantern'));
    if (lanterns.length === 0) return [];
    const r = QUIRK_RULES.lanternBenchTiles;
    return this.freeBenches(c).filter((b) => lanterns.some((l) => Math.abs(l.tileX - b.tileX) <= r && Math.abs(l.tileY - b.tileY) <= r));
  }

  /** Müzisyen: akşamları handa (açıksa) ya da meydan havuzunun başında çalar. */
  planMusic(c, hour, duration) {
    if (!this.isMusicHour(hour)) return null;
    const inn = isBanned(this.world.state, c) ? null : this.world.getCompleted('inn').find((b) => b.lit); // (32.2) Han yasağı
    const fountain = this.world.getCompleted('fountain')[0];
    const venues = [inn, fountain].filter(Boolean);
    if (inn && fountain && this.rng.next() < 0.45) venues.reverse();
    for (const venue of venues) {
      const plan = this.planGathering(c, venue);
      if (!plan) continue;
      const atInn = venue.type === 'inn';
      return { ...plan, activity: 'music', placeTo: atInn ? 'Hana' : 'Meydana', placeAt: atInn ? 'Handa' : 'Meydanda', duration };
    }
    return null;
  }

  /** Doğa Tutkunu: süs ağacının gölgesinde ya da nehir kenarında manzarayı izler. */
  planViewpoint(c, duration) {
    const trees = this.shadeTrees(QUIRK_RULES.viewTreeStage);
    const treeSpot = trees.length ? this.pickNearby(this.shadeSpots(c, trees), c, 30) : null;
    const riverSpot = this.pickNearby(this.world.riverbankSpots, c, 26);
    const useTree = treeSpot && (!riverSpot || this.rng.next() < 0.6);
    const spot = useTree ? treeSpot : riverSpot;
    if (!spot) return null;
    return { activity: 'viewpoint', spot, reserve: true, facing: spot.facing ?? 'down', view: useTree ? 'tree' : 'river', duration };
  }

  /** (20. aşama) Çağ Kutlaması: meydanda (havuz başı; yoksa kulenin dibinde) kutlama bitene kadar. */
  planAgeCelebration(c) {
    const cel = this.world.state.goldenAge.celebration;
    const now = this.world.state.totalMinutes;
    if (!cel || now >= cel.until - 3 || c.away || c.role) return null;
    const venue = this.world.getBuilding(cel.venueId);
    if (!venue) return null;
    const plan = this.planGathering(c, venue, null, 'festival');
    if (!plan) return null;
    return { ...plan, activity: 'ageCelebration', duration: Math.max(3, cel.until - now) };
  }

  /** Düğün kutlamasına davetliyse meydanda kutlama yerine gitmek. */
  planWeddingParty(c) {
    const party = this.world.state.social.party;
    const now = this.world.state.totalMinutes;
    if (!party || now >= party.until - 3 || c.away) return null;
    if (!party.coupleIds.includes(c.id) && !party.guestIds.includes(c.id)) return null;
    const venue = this.world.getBuilding(party.venueId);
    if (!venue) return null;
    const plan = this.planGathering(c, venue, null, 'festival');
    if (!plan) return null;
    return { ...plan, activity: 'weddingParty', duration: Math.max(3, party.until - now) };
  }

  /**
   * Evli çiftin akşam yemeği: akşam (18:00-20:30) acıkan sakin, aynı evde yaşayan ve müsait olan eşini evde birlikte
   * yemeğe çağırır (günde bir kez). Eşin planı BehaviorSystem'de kurulur (dinnerWithId).
   */
  planHomeDinner(c, hour) {
    const day = this.world.state.time.day;
    if (c.isChild || c.dinnerDay === day || hour < HOME_DINNER.from || hour >= HOME_DINNER.to) return null;
    if (c.needs.hunger >= HOME_DINNER.hungerBelow) return null;
    const partner = partnerOf(this.world.state, c);
    if (!partner || !partner.married || partner.homeId !== c.homeId || partner.dinnerDay === day || !this.canJoinDinner(partner)) return null;
    const home = this.world.getBuilding(c.homeId);
    if (!home?.functional || !this.economy.canFeed(MEAL_FOOD_COST * 2)) return null;
    const plan = this.homeDinnerPlan(c, home);
    return plan ? { ...plan, dinnerWithId: partner.id } : null;
  }

  /** Eş sofraya katılabilir mi: uyanık, seferde değil, boş zamanda ya da evde boşta. */
  canJoinDinner(p) {
    if (p.away || p.isSleeping || p.isChild) return false;
    if (!p.task) return true;
    const kind = ACTIVITIES[p.task.activity].kind;
    return kind === 'leisure' || kind === 'idle' || kind === 'social';
  }

  homeDinnerPlan(c, home) {
    const duration = this.durationFor('homeDinner');
    if (c.insideBuildingId === home.id) return { activity: 'homeDinner', buildingId: home.id, duration };
    const doors = this.world.getSpots(home);
    if (doors.length === 0) return null;
    return { activity: 'homeDinner', buildingId: home.id, spot: this.nearest(doors, c), finalPoint: home.entrancePoint, duration };
  }

  /**
   * Flört: sevgilisini ya da hoşlandığı kişiyi (ilişki puanı en az DATING.crushScore, aşık olabilecekleri biri)
   * randevuya çağırır: çardakta baş başa, handa aynı masada ya da yan yana iki bankta. Davet BehaviorSystem.invite'ta.
   */
  planDate(c, hour) {
    const now = this.world.state.totalMinutes;
    if (c.lastDateAt !== null && now - c.lastDateAt < DATING.cooldownMinutes) return null;
    const lover = c.partnerId !== null ? partnerOf(this.world.state, c) : null;
    if (this.rng.next() >= (lover ? DATING.partnerChance : DATING.chance)) return null;
    let target = lover;
    if (!target) {
      let best = null;
      for (const o of this.world.characters) {
        if (o === c || !canRomance(c, o)) continue;
        const score = this.relationships.get(c, o);
        if (score >= DATING.crushScore && (!best || score > best.score)) best = { o, score };
      }
      target = best?.o ?? null;
    }
    if (!target || !this.isAvailableForDate(target, c, hour)) return null;
    if (target.lastDateAt !== null && now - target.lastDateAt < DATING.cooldownMinutes / 2) return null;

    const options = [];
    const gazebo = this.availableGatherings().find((b) => b.type === 'gazebo' && this.world.freeGatherSpots(b, c.id).length >= 2);
    if (gazebo) options.push(['gazebo', DATING.venues.gazebo]);
    const inn = isBanned(this.world.state, c) ? null : this.availableGatherings().find((b) => b.type === 'inn' && this.world.freeGatherSpots(b, c.id).length >= 2); // (32.2) Han yasağı
    if (inn) options.push(['inn', DATING.venues.inn]);
    const benches = this.benchPair(c);
    if (benches) options.push(['bench', DATING.venues.bench]);
    if (options.length === 0) return null;
    const venue = this.rng.weighted(options);
    let plan = null;
    if (venue === 'bench') plan = { ...this.benchPlan(benches[0], 'bench', this.durationFor('bench')), dateBenchId: benches[1].id };
    else plan = this.planGathering(c, venue === 'gazebo' ? gazebo : inn);
    if (!plan) return null;
    return { ...plan, inviteId: target.id, dateWithId: target.id };
  }

  /**
   * Randevuya çağrılabilir mi: sohbet davetinden farklı olarak sosyalliği dolu olsa da gelir (sevgilisi çağırıyor!) ve
   * sohbetini yarıda bırakabilir; uyuyan, çalışan, içeride olan, seferdeki ya da başka bir randevudaki gelmez.
   */
  isAvailableForDate(o, c, hour) {
    if (o.isChild || o.insideBuildingId || !o.visible || o.away || isBedtime(o.profile, hour)) return false;
    if (o.mood.grief) return false; // (29.2) yastaki sakin randevuya gelmez
    if (isWorkHours(hour) && !o.task?.onBreak) return false;
    if (!o.task) return true;
    if (o.task.dateWithId !== undefined && o.task.dateWithId !== c.id) return false;
    if (o.task.clubKey && o.task.activity !== 'clubHobby') return false; // (32.5) kulüp buluşmasındaki üye randevuya kalkmaz
    const kind = ACTIVITIES[o.task.activity].kind;
    return kind === 'leisure' || kind === 'idle' || kind === 'social';
  }

  /** Yan yana (en çok DATING.benchGap karo aralıklı) iki boş bank; bu sakine en yakın çift. */
  benchPair(c) {
    const benches = this.freeBenches(c);
    if (benches.length < 2) return null;
    const origin = this.originTile(c);
    let best = null;
    for (let i = 0; i < benches.length; i++) {
      for (let j = i + 1; j < benches.length; j++) {
        const [a, b] = [benches[i], benches[j]];
        if (Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY)) > DATING.benchGap) continue;
        const d = distanceSq({ x: a.tileX, y: a.tileY }, origin);
        if (!best || d < best.d) best = { pair: [a, b], d };
      }
    }
    return best?.pair ?? null;
  }

  durationFor(activity) {
    const range = ACTIVITIES[activity].duration;
    return range ? this.rng.int(range[0], range[1]) : 0;
  }

  /** Planın başlayacağı karo: evdeyse kapı önü, değilse bulunduğu karo. */
  originTile(c) {
    if (c.insideBuildingId) {
      const home = this.world.getBuilding(c.insideBuildingId);
      const door = home && this.world.getSpots(home)[0];
      if (door) return door;
    }
    return { x: c.tileX, y: c.tileY };
  }

  nearest(items, c) {
    const origin = this.originTile(c);
    return items.reduce((best, item) => (distanceSq(item, origin) < distanceSq(best, origin) ? item : best));
  }

  /** Yakındaki boş noktalardan rastgele birini seçer (hep aynı yere gidilmesin). */
  pickNearby(pool, c, maxDistance) {
    const origin = this.originTile(c);
    const free = pool.filter(
      (s) => !this.world.isReserved(s.x, s.y, c.id) && distanceSq(s, origin) <= maxDistance * maxDistance
    );
    if (free.length === 0) return null;
    free.sort((a, b) => distanceSq(a, origin) - distanceSq(b, origin));
    return this.rng.pick(free.slice(0, 8));
  }

  /** Çocukların oyun yerleri: toplanma yapılarının çevresi ve meydana yakın yollar. */
  playSpots() {
    const spots = [];
    for (const building of this.world.getCompleted()) {
      if (PLAYGROUND_TYPES.includes(building.type)) spots.push(...this.world.getGatherSpots(building));
    }
    const plaza = this.world.landmarks.plaza;
    const center = { x: plaza.centerX, y: plaza.centerY };
    for (const s of this.world.strollSpots) {
      if (distanceSq(s, center) <= PLAZA_PLAY_RADIUS * PLAZA_PLAY_RADIUS) spots.push(s);
    }
    return spots;
  }

  /** Şu an kullanılabilen toplanma yerleri (ateş yalnızca yanarken, han akşamları açıkken). */
  availableGatherings() {
    return this.world
      .getCompleted()
      .filter((b) => GATHERING_ACTIVITIES.includes(b.type) && (ALWAYS_OPEN_GATHERINGS.includes(b.type) || b.lit));
  }

  /** Bir toplanma yerinde olan ya da oraya giden diğer karakterler. */
  participants(building, except) {
    return this.world.characters.filter(
      (o) => o !== except && o.task?.buildingId === building.id && GATHERING_ACTIVITIES.includes(o.task.activity)
    );
  }

  /** (29.1) Toplanma yerindekilere karşı his: kırgın olduğu biri varsa -1, minnettar olduğu biri varsa +1, yoksa 0. */
  companyMood(c, people) {
    let mood = 0;
    for (const o of people) {
      if (hasTag(c, o.id, 'resentful') || c.drive.avoidIds.includes(o.id)) return -1; // (29.3) kavgasından korktuğu kişi de
      if (hasTag(c, o.id, 'grateful')) mood = 1;
    }
    return mood;
  }

  /** Sohbete çağrılacak uygun kişi: yakın olan, ama dost olduğu kişiler öne geçer. */
  findPartner(c, hour) {
    let best = null;
    for (const other of this.world.characters) {
      if (other === c || !this.isAvailableForChat(other, hour)) continue;
      if (hasTag(c, other.id, 'resentful')) continue; // (29.1) kırgın olduğu kişiyi sohbete çağırmaz
      // (29.2) dost arayan (yalnız / keyfi kaçmış) sakin kimyası yüksek olanı seçer
      const pull = c.mood.seek ? (c.relationships[other.id]?.chemistry ?? 0) * MOOD_RULES.seekChemistry : 0;
      // (29.3) arzunun hedefi (ruh ikizi, barışmak istediği, eşi) bu kadar piksel yakınmış gibi (yastayken değil)
      const want = !c.mood.grief && c.drive.seekIds.includes(other.id) ? WANT_RULES.partnerPull : 0;
      const rank = Math.sqrt(distanceSq(other, c)) - this.relationships.get(c, other) * 0.8 - (hasTag(c, other.id, 'grateful') ? 40 : 0) - pull - want;
      if (!best || rank < best.rank) best = { other, rank };
    }
    return best?.other ?? null;
  }
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
