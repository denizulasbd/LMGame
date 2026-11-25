// Kasaba sakini. Kim olduğu (isim, görünüm, özellikler, ihtiyaçlar) ve anlık hâli
// (konum, yön, poz, yürüdüğü yol, ifade balonu) burada tutulur. Ne yapacağına
// src/ai/Brain.js karar verir, src/systems/ altındaki sistemler uygular.
//
// 9. aşama: aile bağları (partnerId, married, parentIds), çocukluk (growsUpAt: büyüyeceği oyun
// dakikası; null = yetişkin) ve kişisel ekipman (equipment: { tool, clothing, bag } -> data/equipment.js).
// 19. aşama: karakter huyu (quirk), son duyduğu dedikodu (lastNews), eşiyle akşam yemeği günü ve randevu zamanı.
// 21. aşama: kişisel kese (coins) ve çanta (inventory: [{ kind, qty, name? }]; ekipman yuvalarından bağımsız,
// systems/Citizens.js). Eski kayıtlarda kese yoksa başlangıç harçlığı verilir.
// 23. aşama: hafif yaralanma (isInjured, injuryTimer: kalan oyun dakikası; yürüme ve çalışma %20 yavaş, ölüm yoktur; CrisisSystem).
// 25.1: yaşam evresi (lifeStage: 'child' | 'youth' | 'adult' | 'elder') ve gün cinsinden yaş (ageInDays; gün dönümünde ilerler,
// age = ageInDays / yıl). Kıdemli Bilge ölmez, emekli olur (retired: kaydedilmez, LifeStageSystem her saat yeniden hesaplar).
// 25.2: çıraklık (apprenticeship: { masterId, profession, buildingId, progress 0-100, since, crafted }; ApprenticeshipSystem)
// ve konuşma baloncuğu (speech: { text, at, duration }; kaydedilmez, ikon balonundan ayrı bir katmandır).
// 25.4: Aile Kütüğü (generation, parents: doğum ebeveynleri, familyId: ocak, children; LineageSystem).
// 29.2: ruh halleri (moodlets: en çok 6; mood: toplam etki ve baskın ruh hali; MoodletSystem).
// 29.3: arzular (wants: en çok 3), korkular (fears: en çok 2), yaşam doyumu (satisfaction 0-100), son sonuçlar (wantLog: 8),
// fearStreak / wishCount; (29.4) growth / growthToday / growthCause / deepTraits / evolutions / evolutionCount / acquiredCount; drive: davranış kancaları (kaydedilmez; Wants.recomputeDrive; WantSystem).
// 29.1: sosyal kimya ve duygusal etiketler (relationships: { karşıKimlik: { chemistry -2..+3, craft, tags, until } }; ChemistrySystem).
// 22. aşama: köyü terk etmeye karar verdiyse yola çıktığı an ve çıkış karosu (emigrating: { since, exit }; DesertionSystem).
import { PROFESSIONS } from '../data/apprenticeship.js';
import { sanitizeLifespan } from '../data/lifeStages.js';
import { CONFIG } from '../config.js';
import { Entity } from './Entity.js';
import { bodyKind, walkPeriod, computeBodyOffset, displayFacing, drawBodyDecor } from '../rendering/BodyLanguage.js';
import { NEED_KEYS } from '../data/characters.js';
import { CHILDREN } from '../data/family.js';
import { buildTraitProfile } from '../ai/TraitProfile.js';
import { startingCoins, sanitizeInventory } from '../systems/Citizens.js';
import { stageFor, daysForAge, ageFromDays, isLifeStage } from '../systems/LifeStages.js';
import { sanitizeApprenticeship } from '../systems/Apprenticeship.js';
import { AGING } from '../data/lifeStages.js';
import { getCharacterSprite, characterHeight, CHARACTER_WIDTH, CHARACTER_HEIGHT, getFlowerCrownSprite } from '../art/sprites/index.js';

const CELEBRATION_SECONDS = 2.6; // (15. aşama) usta işi eser kutlamasının süresi
import {
  getBubbleSprite,
  getHeldToolSprite,
  getCarrySprite,
  getBackpackSprite,
  getStoolSprite,
  BUBBLE_WIDTH,
  BUBBLE_HEIGHT,
} from '../art/ui/index.js';
import { sanitizeOrigin } from '../systems/Temperament.js';
import { sanitizeMentees } from '../systems/Heirloom.js';
import { sanitizeRelations } from '../systems/Chemistry.js';
import { sanitizeMoodlets, neutralMood, recomputeMood } from '../systems/Moodlets.js';
import { sanitizeGrowth, sanitizeGrowthToday, sanitizeGrowthCause, sanitizeDeepTraits, sanitizeEvolutions, sanitizeEvoCount } from '../systems/Evolution.js';
import { sanitizeWants, sanitizeWantLog, clampSatisfaction, sanitizeCount, neutralDrive, recomputeDrive } from '../systems/Wants.js';
import { WANTS, FEARS, WANT_CAPS } from '../data/wants.js';
import { sanitizeLoyalty } from '../systems/Loyalty.js';
import { sanitizeHigherStudy, sanitizeGraduate } from '../systems/University.js'; // (32.4)
import { sanitizeClub } from '../systems/Clubs.js'; // (32.5)
import { getEaselSprite } from '../art/sprites/structuresClubs.js'; // (32.5)

const HALF_WIDTH = CHARACTER_WIDTH / 2;
const BUBBLE_POP_TIME = 0.15;
const SWING_SECONDS = 0.25; // çalışırken alet bu sürede bir kalkıp iner

// Elde tutulan aletin karaktere göre konumu: [kalkık, inik] (sağa bakarken; sola aynalanır)
const TOOL_OFFSETS = {
  right: [[3, -17], [5, -12]],
  left: [[-8, -17], [-10, -12]],
  down: [[2, -15], [3, -11]],
  up: [[-2, -19], [-1, -15]],
};

// Olta (9x9, sapı sol altta, ucu sağ üstte): sapın karakterin elinde olacağı konum [x, y] ve
// ucunun sprite içindeki yeri. Sola bakarken sprite aynalanır.
const ROD_OFFSETS = { right: [3, -17], left: [-12, -17] };
const ROD_TIP = { right: { x: 11.5, y: -16.5 }, left: { x: -11.5, y: -16.5 } };
const BOBBER_DISTANCE = 17; // olta ucundan şamandıraya yatay mesafe
const LINE_COLOR = 'rgba(238, 251, 255, 0.85)';

// Kazmanın vurduğu nokta (karakterin ayağına göre), baktığı yöne göre: toz buradan kalkar
const DUST_OFFSETS = { up: [1, -19], down: [3, -2], right: [9, -8], left: [-9, -8] };

const EMPTY_EQUIPMENT = { tool: null, clothing: null, bag: null };

export class Character extends Entity {
  constructor({
    id,
    name,
    age = 20,
    traits = [],
    appearance,
    needs,
    homeId = null,
    x = 0,
    y = 0,
    growsUpAt = null,
    parentIds = [],
    partnerId = null,
    married = false,
    partnerSince = null,
    marriedAt = null,
    lastChildAt = null,
    equipment = null,
    relocating = false,
    illness = null,
    exposure = 0,
    away = null,
    schooling = 0,
    schoolDay = 0,
    schoolToday = 0,
    educated = false,
    workplaceId = null,
    customName = false,
    memories = [],
    tale = null,
    quirk = null,
    lastNews = null,
    dinnerDay = null,
    lastDateAt = null,
    coins = null,
    inventory = [],
    emigrating = null,
    isInjured = false,
    injuryTimer = 0,
    lifeStage = null,
    ageInDays = null,
    agedDays = 0,
    apprenticeship = null,
    isGrandmaster = false,
    isVenerable = false,
    lifespan = null,
    grandmasterProfession = null,
    grandmasterBatches = 0,
    quirkOrigin = null,
    generation = null,
    parents = null,
    familyId = null,
    children = null,
    mentees = null,
    relationships = null,
    moodlets = null,
    wants = null,
    fears = null,
    satisfaction = null,
    wantLog = null,
    fearStreak = 0,
    wishCount = 0,
    growth = null,
    growthToday = null,
    growthCause = null,
    deepTraits = null,
    evolutions = null,
    evolutionCount = 0,
    acquiredCount = 0,
    loyalty = 0,
    weddingDay = null,
    specialDay = null,
    sentence = null,
    higherStudy = null,
    graduate = null,
    club = null,
  }) {
    super({ id, x, y });
    this.name = name;
    this.age = age;
    this.traits = traits;
    this.appearance = appearance;
    this.needs = needs ?? Object.fromEntries(NEED_KEYS.map((k) => [k, 100]));
    this.homeId = homeId;
    // Aile: çocuksa büyüyeceği oyun dakikası; ebeveynleri; partneri / eşi
    this.growsUpAt = growsUpAt;
    this.parentIds = [...parentIds];
    this.partnerId = partnerId;
    this.married = married;
    this.partnerSince = partnerSince; // partner olduğu oyun dakikası
    this.marriedAt = marriedAt; // evlendiği oyun dakikası
    this.lastChildAt = lastChildAt; // ailesine son çocuğun katıldığı oyun dakikası
    this.relocating = relocating; // evlenince eşiyle paylaşacağı yeni eve taşınacak
    this.equipment = { ...EMPTY_EQUIPMENT, ...(equipment ?? {}) };
    // 11. aşama: sağlık ve keşif seferi
    this.illness = illness ? { ...illness } : null; // üşütme: { since, remaining (oyun dakikası) }
    this.exposure = exposure; // hastalığa yakınlık 0-100 (soğuk, yağmur, açlık, bitkinlik; data/health.js)
    this.away = away ? { ...away } : null; // keşif seferinde: { stage: 'leaving' | 'away', until, exit }
    // 12. aşama: okul (çocukken Bilgelik Evi'nde dinlenen ders dakikası; yeterliyse büyüyünce Kalfa başlar)
    this.schooling = schooling;
    this.schoolDay = schoolDay;
    this.schoolToday = schoolToday;
    this.educated = educated; // okulu bitirip meslekte Kalfa olarak başladı
    // 13. aşama: oyuncunun sabitlediği iş yeri (yalnızca orada çalışır) ve oyuncunun verdiği ad
    this.workplaceId = workplaceId;
    this.customName = customName;
    // 14. aşama: hayat yolculuğu (MemorySystem): { day, hour, text, icon, kind, fond }; o an hatırladığı anı ve
    // Çiçek Şenliği'nde saça takılan çiçek (bu ikisi kaydedilmez)
    this.memories = (memories ?? []).filter((m) => m && typeof m.text === 'string').map((m) => ({ ...m }));
    // 16. aşama: seferden dönen maceracının anlatacağı hikâye { until, told, progress, route } (kayda girer)
    this.tale = tale && Number.isFinite(tale.until) ? { told: 0, progress: 0, route: 'Keşif', ...tale } : null;
    // 19. aşama: karakter huyu (data/social.js -> QUIRKS; SocialSystem dağıtır), son duyduğu haber
    // { id, text, story, from, fromId, day, hour }, eşiyle son akşam yemeği yediği gün ve son randevu isteği (kayda girer)
    this.quirk = typeof quirk === 'string' ? quirk : null;
    this.lastNews = lastNews && typeof lastNews.text === 'string' ? { ...lastNews } : null;
    this.dinnerDay = Number.isFinite(dinnerDay) ? dinnerDay : null;
    this.lastDateAt = Number.isFinite(lastDateAt) ? lastDateAt : null;
    // 21. aşama: kişisel kese ve çanta (kayda girer; eski kayıtlarda başlangıç harçlığı)
    this.coins = Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : startingCoins(growsUpAt !== null);
    this.inventory = sanitizeInventory(inventory);
    this.emigrating = emigrating && Number.isFinite(emigrating.since) ? { since: emigrating.since, exit: emigrating.exit ? { ...emigrating.exit } : null } : null;
    // 23. aşama: hafif yaralanma (kayda girer); injuryTimer bitince kendiliğinden iyileşir
    this.injuryTimer = Number.isFinite(injuryTimer) ? Math.max(0, injuryTimer) : 0;
    this.isInjured = Boolean(isInjured) && this.injuryTimer > 0;
    // 25.1: yaşam evresi ve gün cinsinden yaş. Yeni sakinde yaştan (18-20 'youth', 70+ 'elder'), eski kayıtlarda (v2-v23,
    // fromJSON) yetişkinler 'adult' başlar; gün cinsinden yaş yaştan ve kimlikten türetilir. Kazanılmış evre geri dönmez
    this.ageInDays = Number.isFinite(ageInDays) && ageInDays >= 0 ? Math.floor(ageInDays) : daysForAge(Number.isFinite(this.age) ? this.age : 20, this.id);
    this.age = ageFromDays(this.ageInDays);
    this.lifeStage = stageFor({ isChild: this.isChild, age: this.age, lifeStage: isLifeStage(lifeStage) ? lifeStage : null });
    // Kasabaya katıldığından / büyüdüğünden beri yaşlandığı gün: gönül ilişkisindeki yaş farkı katılım anındaki "kuşak yaşına"
    // göre ölçülür (LifeStages.ageGap), böylece doğum günlerinin yıla dağılması eşleşmeleri günden güne değiştirmez
    this.agedDays = Number.isFinite(agedDays) && agedDays >= 0 ? Math.min(Math.floor(agedDays), this.ageInDays) : 0;
    // 25.2: çıraklık (yalnızca Genç'te anlamlıdır; kayda girer)
    this.apprenticeship = this.lifeStage === 'youth' ? sanitizeApprenticeship(apprenticeship) : null;
    this.speech = null; // usta / çırak konuşma baloncuğu (kaydedilmez)
    // 25.3: huyun kaynağı (Aile mirası / Usta etkisi / Mesleğin doğası / Özgün gelişim; kayda girer)
    this.quirkOrigin = sanitizeOrigin(quirkOrigin);
    // (28.2) Başusta: çıraklığı %100 bitirenin kalıcı unvanı (grandmasterProfession = çıraklık yapısı türü); batches: hammaddesiz üretim sayacı
    // (28.3) Saygın Büyük: ocağını ve yadigârını devredip yatağını boşaltan Kıdemli Bilge (nüfus kotasından muaf); lifespan: vefat yaşı (67-75)
    this.isVenerable = Boolean(isVenerable) && this.lifeStage === 'elder';
    this.lifespan = sanitizeLifespan(lifespan);
    this.isGrandmaster = Boolean(isGrandmaster) && PROFESSIONS[grandmasterProfession] !== undefined;
    this.grandmasterProfession = this.isGrandmaster ? grandmasterProfession : null;
    this.grandmasterBatches = this.isGrandmaster ? Math.max(0, Math.floor(Number(grandmasterBatches) || 0)) : 0;
    // 25.4: Aile Kütüğü (kayda girer; eksikse LineageSystem yüklemede tamamlar): kuşak, doğum ebeveynleri, ocak, çocuklar
    this.generation = Number.isInteger(generation) && generation >= 1 ? generation : null;
    this.parents = Array.isArray(parents) ? parents.filter((id) => Number.isFinite(id) && id !== this.id) : [...this.parentIds];
    this.familyId = Number.isFinite(familyId) ? familyId : null;
    this.children = Array.isArray(children) ? children.filter((id) => Number.isFinite(id)) : [];
    // 25.5: ustanın yetiştirdiği çıraklar [{ id, progress }] (yadigâr mirasçısı için; kayda girer)
    this.mentees = sanitizeMentees(mentees);
    // (29.1) Sosyal kimya ve duygusal etiketler: { karşıKimlik: { chemistry, craft, tags, until } } (kayda girer; systems/Chemistry.js)
    this.relationships = sanitizeRelations(relationships, this.id);
    // (29.2) Ruh halleri: [{ key, tier, since, until, reason, whoId?, whoName? }] (kayda girer); mood: toplam çarpanlar ve baskın ruh hali
    // (kaydedilmez; Moodlets.recomputeMood yerinde günceller, sıcak yollar yalnızca okur)
    this.moodlets = sanitizeMoodlets(moodlets);
    // (29.3) Arzular, korkular ve yaşam doyumu (kayda girer; çocukta boş, doyum 50). drive: davranış kancaları (kaydedilmez)
    const child = growsUpAt !== null;
    this.wants = child ? [] : sanitizeWants(wants, WANTS, WANT_CAPS.wants);
    this.fears = child ? [] : sanitizeWants(fears, FEARS, WANT_CAPS.fears);
    this.satisfaction = child ? 50 : clampSatisfaction(satisfaction);
    this.wantLog = sanitizeWantLog(wantLog);
    this.fearStreak = sanitizeCount(fearStreak);
    this.wishCount = sanitizeCount(wishCount);
    // (29.4) Kalıcı kişilik evrimi (kayda girer; Evolution.js / EvolutionSystem). Çocukta eksenler 0'da durur; deepTraits yalnızca traits içindekiler
    this.growth = child ? [0, 0, 0, 0] : sanitizeGrowth(growth);
    this.growthToday = child ? [0, 0, 0, 0] : sanitizeGrowthToday(growthToday);
    this.growthCause = child ? [null, null, null, null] : sanitizeGrowthCause(growthCause);
    this.deepTraits = child ? [] : sanitizeDeepTraits(traits, deepTraits);
    this.evolutions = child ? [] : sanitizeEvolutions(evolutions);
    this.evolutionCount = child ? 0 : Math.max(sanitizeEvoCount(evolutionCount), this.evolutions.length);
    this.acquiredCount = child ? 0 : sanitizeEvoCount(acquiredCount);
    // (29.6) Yönetime sadakat -100..+100 (çocukta 0); (29.7) evlendiği gün ve o günün özel gün durumu (kayda girer)
    this.loyalty = sanitizeLoyalty(loyalty, child);
    this.weddingDay = Number.isFinite(weddingDay) && weddingDay >= 1 ? Math.floor(weddingDay) : null;
    this.specialDay = sanitizeSpecialDay(specialDay);
    this.specialSeek = []; // (29.7) özel günde aranan kişiler (kaydedilmez; RiteSystem kurar)
    // (32.2) Adalet Sarayı cezası (isteğe bağlı, kayda yalnızca doluyken girer): { service?: kalan saat, serviceDay?, serviceToday?,
    // caseId?, banUntil?: oyun dakikası, exile?: { since, exit } } — CourtSystem yazar
    this.sentence = sanitizeSentence(sentence);
    // (32.4) Darülfünun (isteğe bağlı, kayda yalnızca doluyken girer): öğrencilik { field, minutes, today, day, since } ve mezuniyet { field, day }
    this.higherStudy = sanitizeHigherStudy(higherStudy);
    this.graduate = sanitizeGraduate(graduate);
    // (32.5) Hobi evi üyeliği (isteğe bağlı, kayda yalnızca doluyken girer): { key, since, missed } — ClubSystem yazar
    this.club = sanitizeClub(club);
    this.drive = neutralDrive();
    recomputeDrive(this);
    this.mood = neutralMood();
    this.flowStreak = 0; // kendi tezgâhında art arda verimli mesai (kaydedilmez)
    this.lastConsoleAt = null; // son teselli ettiği oyun dakikası (kaydedilmez)
    this.retired = false; // emekli bilge mi (kaydedilmez; LifeStageSystem çekirdek sakin kuralıyla hesaplar)
    this.waterBucket = false; // yangında kovası dolu mu (kaydedilmez)
    this.recall = null;
    this.flowerCrown = false;
    this.profile = this.buildProfile();
    recomputeMood(this);

    // Anlık durum (kaydedilmez, yapay zekâ yeniden kurar)
    this.facing = 'down';
    this.pose = 'stand'; // stand | walk | sit | gather | work | fish | tend | hidden
    this.visible = true;
    this.insideBuildingId = null;
    this.activityLabel = 'Etrafa bakınıyor';
    this.task = null;
    this.waypoints = null;
    this.waypointIndex = 0;
    this.animTime = Math.random() * 2; // herkes aynı anda nefes almasın
    this.bubble = null;
    this.bubbleCooldown = 2 + Math.random() * 4;
    this.tool = null; // çalışırken elindeki alet
    this.carrying = null; // kilere taşıdığı yük { resource, amount }
    this.newcomer = false; // kasabaya yeni geldi, önce evine yerleşecek
    this.workEffect = null; // çalışırken çizilen efekt ('dust')
    this.buffs = {}; // kişisel geçici bonuslar: { warmMeal, warmUntil: bitiş dakikası }
    this.skills = {}; // meslek deneyimi: { woodcutting: çalışılan dakika, ... } (data/skills.js)
    this.role = null; // 'merchant' gibi kasabalı olmayan ziyaretçiler için
    this.backpack = false; // gezgin tüccarın sırt çantası
    this.coatVisible = false; // paltosu varsa sonbahar ve kışın giyer (CraftingSystem günceller)
    this.celebrateAt = null; // (15. aşama) usta işi eser kutlamasının başladığı gerçek zaman (çizim)
    this.outfit = null; // (15. aşama) meslek kıyafeti 'kit:kademe' (deneyimden türetilir, kaydedilmez)
    this.lookCache = null;
  }

  /** Henüz büyümemiş çocuk mu? */
  get isChild() {
    return this.growsUpAt !== null;
  }

  /** (25.1) Kıdemli Bilge mi? */
  get isElder() {
    return this.lifeStage === 'elder';
  }

  /** (25.1) Genç mi? */
  get isYouth() {
    return this.lifeStage === 'youth';
  }

  /** Evreye göre davranış profili (çocuk / genç / yetişkin / bilge). */
  buildProfile() {
    return buildTraitProfile(this.traits, { child: this.isChild, youth: this.lifeStage === 'youth', elder: this.lifeStage === 'elder', deep: this.deepTraits });
  }

  /**
   * (25.1) Bir gün yaşlanır (gün dönümünde LifeStageSystem çağırır). Evre değiştiyse { from, to }, değilse null.
   * Çocuğun büyümesi FamilySystem'in işidir (growsUpAt); çocukken yalnızca yaş sayacı ilerler.
   */
  ageOneDay() {
    this.ageInDays += 1;
    this.agedDays += 1;
    this.age = ageFromDays(this.ageInDays);
    return this.refreshLifeStage();
  }

  /** Evreyi yaşa göre günceller; değiştiyse profili yeniler. Dönüş { from, to } ya da null. */
  refreshLifeStage() {
    const from = this.lifeStage;
    const to = stageFor(this);
    if (to === from) return null;
    this.lifeStage = to;
    this.profile = this.buildProfile();
    return { from, to };
  }

  /** Sprite görünüşü: çocuk / palto / sırt çantası / (25.1) evre (önbellekli nesne; anahtar değişince yenilenir). */
  get look() {
    const child = this.isChild;
    const coat = !child && this.coatVisible;
    const bag = !child && this.equipment.bag === 'backpack';
    const outfit = child ? null : this.outfit; // (15. aşama) meslek kıyafeti (CraftsmanshipSystem yazar)
    const stage = this.lifeStage === 'youth' || this.lifeStage === 'elder' ? this.lifeStage : null;
    const cached = this.lookCache;
    if (!cached || cached.child !== child || cached.coat !== coat || cached.bag !== bag || cached.outfit !== outfit || cached.stage !== stage) this.lookCache = { child, coat, bag, outfit, stage };
    return this.lookCache;
  }

  get spriteHeight() {
    return characterHeight(this.look);
  }

  /** Çocuk büyüyüp yetişkin olur: çalışabilir, kendi kişilik düzenine kavuşur. */
  growUp() {
    this.growsUpAt = null;
    this.age = CHILDREN.adultAge;
    // (25.1) büyüyen çocuk Genç evresine geçer (18 yaşının doğum gününden başlar)
    this.ageInDays = Math.max(this.ageInDays, this.age * AGING.daysPerAge);
    this.agedDays = 0; // yetişkin hayatının kuşak yaşı 18
    this.age = ageFromDays(this.ageInDays);
    this.lifeStage = stageFor(this);
    this.profile = this.buildProfile();
  }

  get tileX() {
    return Math.floor(this.x / CONFIG.TILE_SIZE);
  }

  get tileY() {
    return Math.floor(this.y / CONFIG.TILE_SIZE);
  }

  get isMoving() {
    return this.waypoints !== null;
  }

  get isSleeping() {
    return this.task?.activity === 'sleep' && this.task.phase === 'perform';
  }

  /** Y-sıralama anahtarı; oturan karakter bankın önünde kalsın diye yarım piksel öne alınır. */
  get sortY() {
    return this.pose === 'sit' ? this.y + 0.5 : this.y;
  }

  setWaypoints(points) {
    this.waypoints = points.length > 0 ? points : null;
    this.waypointIndex = 0;
  }

  clearPath() {
    this.waypoints = null;
    this.waypointIndex = 0;
  }

  /** Kalan yol noktaları (seçili karakterin rotasını çizmek için). */
  remainingWaypoints() {
    return this.waypoints ? this.waypoints.slice(this.waypointIndex) : [];
  }

  showBubble(icon, duration = 2.2) {
    this.bubble = { icon, time: 0, duration };
  }

  faceToward(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx >= 0 ? 'right' : 'left';
    else this.facing = dy >= 0 ? 'down' : 'up';
  }

  /** Dünya pikselindeki nokta bu karakterin üzerinde mi (tıklama için). */
  hitTest(worldX, worldY) {
    if (!this.visible) return false;
    const top = this.y - this.spriteHeight + (this.pose === 'sit' ? 2 : 0);
    return worldX >= this.x - HALF_WIDTH - 1 && worldX <= this.x + HALF_WIDTH + 1 && worldY >= top && worldY <= this.y + 2;
  }

  currentFrame() {
    const t = this.animTime;
    switch (this.pose) {
      case 'walk': {
        // (29.8) beden dili: yaslı sakin sallanmadan yürür, tükenmiş sakinde sallanma yarı hızdadır
        const kind = bodyKind(this);
        if (kind === 'grief') return 'walk0';
        return Math.floor(t / walkPeriod(kind)) % 2 === 0 ? 'walk0' : 'walk1';
      }
      case 'sit':
        return t % 2.2 > 1.6 ? 'sit1' : 'sit0';
      case 'gather':
        return Math.floor(t / 0.28) % 2 === 0 ? 'idle0' : 'idle1';
      case 'work':
        return Math.floor(t / SWING_SECONDS) % 2 === 0 ? 'idle0' : 'idle1';
      case 'fish':
        return t % 2.6 > 2 ? 'idle1' : 'idle0'; // olta başında uzun uzun bekler
      default:
        return t % 1.6 > 1.1 ? 'idle1' : 'idle0';
    }
  }

  currentSprite() {
    const frame = this.currentFrame();
    const facing = frame.startsWith('sit') ? 'down' : this.facing;
    return getCharacterSprite(this.appearance, facing, frame, this.look);
  }

  queueDraw(queue) {
    if (!this.visible) return;
    // (29.8) beden dili: yalnızca çizim kaydırması (durum yazılmaz); kırgın çalışanlar birbirine sırt döner
    const kind = bodyKind(this);
    const offset = computeBodyOffset(this, kind);
    const facing = displayFacing(this, kind);
    const frame = this.currentFrame();
    const sprite = getCharacterSprite(this.appearance, frame.startsWith('sit') ? 'down' : facing, frame, this.look);
    const x = Math.round(this.x) + offset.x;
    const y = Math.round(this.y) + offset.y;
    // (25.2) Çırak ustasının yanında küçük bir taburede oturur
    if ((this.task?.activity === 'apprentice' || this.task?.activity === 'clubSession') && this.pose === 'sit') queue.addImage(this.sortY - 0.01, getStoolSprite(), x - 4, y - 1); // ayakları taburenin önünde, bacakları altından görünür ((32.5) Dikiş-Nakış Evi de)
    // (32.5) Resim Atölyesi: baktığı yanda şövale (yalnızca çizim; durum yazılmaz)
    if (this.task?.easel && this.task.phase === 'perform') queue.addImage(this.sortY + 0.01, getEaselSprite(), facing === 'left' ? x - 13 : x + 4, y - 15);
    queue.addImage(this.sortY, sprite, x - HALF_WIDTH, y - sprite.height + 1);
    // (14. aşama) Çiçek Şenliği: saçta küçük bir çiçek
    if (this.flowerCrown) {
      const side = facing === 'left' ? -4 : facing === 'right' ? 1 : this.id % 2 === 0 ? -4 : 1;
      queue.addImage(this.sortY + 0.02, getFlowerCrownSprite(this.id % 3), x + side, y - sprite.height + 1);
    }

    // Gezgin tüccarın sırt çantası: yukarı bakarken önde (sırtı görünür), diğer yönlerde arkada
    if (this.backpack) {
      const view = facing === 'up' ? 'back' : facing === 'down' ? 'front' : facing;
      const sprite = getBackpackSprite(view);
      const bob = this.pose === 'walk' && Math.floor(this.animTime / 0.16) % 2 === 0 ? 1 : 0;
      const offsetX = facing === 'left' ? 1 : facing === 'right' ? -7 : -5;
      queue.addImage(this.sortY + (facing === 'up' ? 0.01 : -0.01), sprite, x + offsetX, y - CHARACTER_HEIGHT - 3 + bob);
    }
    // Olta: karakterin önünde, uzun süre sabit durur
    if (this.tool === 'rod' && this.pose === 'fish') {
      const side = facing === 'left' ? 'left' : 'right';
      const [dx, dy] = ROD_OFFSETS[side];
      const lift = this.animTime % 2.6 > 2.3 ? -1 : 0; // ara sıra oltayı kaldırıp indirir
      queue.addImage(this.sortY + 0.01, getHeldToolSprite('rod', side === 'left', this.hasSturdyTool), x + dx, y + dy + lift);
    }
    // Çoban değneği: yere dayalı, dik tutulur; elinin olduğu yanda, gövdenin önünde görünür
    else if (this.tool && this.pose === 'tend') {
      const sprite = getHeldToolSprite(this.tool, facing === 'left', false);
      const dx = facing === 'left' ? -8 : 3;
      queue.addImage(this.sortY + 0.01, sprite, x + dx, y - sprite.height + 1);
    }
    // Alet: yukarı bakarken karakterin arkasında, diğer yönlerde önünde
    else if (this.tool && this.pose === 'work') {
      const raised = Math.floor(this.animTime / SWING_SECONDS) % 2 === 0;
      const [dx, dy] = TOOL_OFFSETS[facing][raised ? 0 : 1];
      const order = facing === 'up' ? -0.01 : 0.01;
      queue.addImage(this.sortY + order, getHeldToolSprite(this.tool, facing === 'left', this.hasSturdyTool), x + dx, y + dy);
    }
    // Taşınan yük başın üstünde
    if (this.carrying) {
      const bob = this.pose === 'walk' && Math.floor(this.animTime / 0.16) % 2 === 0 ? 1 : 0;
      queue.addImage(this.sortY + 0.02, getCarrySprite(this.carrying.resource), x - 4, y - this.spriteHeight - 3 + bob);
    }
  }

  /** Sağlam Alet kuşanmışsa çalışırken elindeki alet parlak çeliktir. */
  get hasSturdyTool() {
    return this.equipment.tool === 'sturdyTool';
  }

  /** Dünya katmanında, gece örtüsünün altında çizilen efektler: kazma tozu, olta ipi. */
  drawEffects(renderer, time) {
    if (this.celebrateAt !== null && this.visible) this.drawCelebration(renderer, time);
    if (!this.visible || this.waypoints) return;
    if (this.workEffect === 'dust' && this.pose === 'work') this.drawWorkDust(renderer);
    if (this.tool === 'rod' && this.pose === 'fish') this.drawFishingLine(renderer, time);
  }

  /** (15. aşama) Usta işi bir eser çıkınca başının çevresinde altın kıvılcımlar yükselir (birkaç saniye). */
  celebrate() {
    this.celebrateAt = -1; // ilk çizimde gerçek zamanla başlar
  }

  drawCelebration(renderer, time) {
    if (this.celebrateAt < 0) this.celebrateAt = time;
    const t = (time - this.celebrateAt) / CELEBRATION_SECONDS;
    if (t >= 1 || t < 0) {
      this.celebrateAt = null;
      return;
    }
    const cx = Math.round(this.x);
    const top = Math.round(this.y) - this.spriteHeight;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 3;
      const r = 5 + t * 7;
      const px = Math.round(cx + Math.cos(angle) * r);
      const py = Math.round(top + 6 - t * 10 + Math.sin(angle) * r * 0.5);
      const alpha = (1 - t).toFixed(2);
      renderer.fillRect(px, py, 1, 1, `rgba(255, 243, 176, ${alpha})`);
      if (i % 2 === 0) {
        renderer.fillRect(px - 1, py, 3, 1, `rgba(255, 210, 63, ${alpha})`);
        renderer.fillRect(px, py - 1, 1, 3, `rgba(255, 210, 63, ${alpha})`);
      }
    }
  }

  /**
   * Kazma her indiğinde vurulan noktadan toz kalkar ve birkaç taş kıymığı fırlar. Nokta karakterin
   * baktığı yöne göre aletin ucudur; böylece efekt her zaman çalışanla aynı yerde ve aynı ritimde.
   */
  drawWorkDust(renderer) {
    const [ox, oy] = DUST_OFFSETS[this.facing];
    const period = SWING_SECONDS * 2;
    // Alet inerken (salınımın ikinci yarısı) vuruş olur: t = vuruştan bu yana geçen oran
    const t = ((this.animTime + SWING_SECONDS) % period) / period;
    const cx = Math.round(this.x) + ox;
    const cy = Math.round(this.y) + oy;
    for (let i = 0; i < 4; i++) {
      // Toz bulutu iki yana açılır (yukarı bakarken başın iki yanında görünür)
      const side = i % 2 === 0 ? -1 : 1;
      const spread = side * (3 + t * 6 + (i >> 1) * 2);
      const size = t < 0.35 ? 2 : 3;
      const alpha = (0.85 * (1 - t)).toFixed(2);
      const px = Math.round(cx + spread);
      const py = Math.round(cy - t * 6 - (i >> 1) * 2);
      renderer.fillRect(px, py, size, size, `rgba(233, 214, 170, ${alpha})`);
      renderer.fillRect(px, py + size, size, 1, `rgba(150, 128, 96, ${(0.5 * (1 - t)).toFixed(2)})`);
    }
    if (t < 0.5) {
      const k = t / 0.5;
      for (const dir of [-1, 1]) {
        const px = Math.round(cx + dir * (2 + k * 6));
        const py = Math.round(cy - Math.sin(k * Math.PI) * 5 + k * 3);
        renderer.fillRect(px, py, 1, 1, dir < 0 ? '#b9bcc6' : '#8b8f9c');
      }
    }
  }

  /** Balıkçının olta ipi ve şamandırası. */
  drawFishingLine(renderer, time) {
    const side = this.facing === 'left' ? 'left' : 'right';
    const dir = side === 'left' ? -1 : 1;
    const tip = ROD_TIP[side];
    const startX = Math.round(this.x + tip.x);
    const startY = Math.round(this.y + tip.y);
    const bob = Math.sin(time * 2.2 + this.id) > 0.55 ? 1 : 0;
    const endX = Math.round(this.x + tip.x + dir * BOBBER_DISTANCE);
    const endY = Math.round(this.y + 1) + bob;

    // İp: uçtan şamandıraya sarkan hafif bir yay (her adımda bir piksel)
    const steps = Math.abs(endX - startX);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sag = Math.sin(t * Math.PI) * 4 * (1 - t * 0.3);
      renderer.fillRect(startX + dir * i, Math.round(startY + (endY - startY) * t * t + sag * (1 - t)), 1, 1, LINE_COLOR);
    }
    // Şamandıra ve çevresindeki halka
    renderer.fillRect(endX, endY - 1, 2, 1, '#ffffff');
    renderer.fillRect(endX, endY, 2, 1, '#e8463c');
    const ring = (time * 0.9 + this.id * 0.37) % 1;
    if (ring < 0.7) {
      const r = 2 + Math.floor(ring * 5);
      const alpha = (0.7 - ring).toFixed(2);
      renderer.fillRect(endX - r, endY + 1, r * 2 + 2, 1, `rgba(238, 251, 255, ${alpha})`);
    }
  }

  /** Başın üstündeki ifade balonu (her şeyin üstünde çizilir). */
  drawOverlay(renderer) {
    if (!this.visible) return;
    // (29.8) beden dili kaplamaları: gözyaşı, özel gün kurdelesi, yan yana çalışanların pırıltısı
    drawBodyDecor(renderer, this, bodyKind(this));
    if (!this.bubble) return;
    // (29.8) konuşma balonu da varsa ikon, metin balonunun sol ucunda tek balon olarak çizilir (SpeechBubbles)
    if (this.speech && this.speech.remaining !== 0) return;
    const pop = this.bubble.time < BUBBLE_POP_TIME ? 2 : 0;
    const top = Math.round(this.y) - this.spriteHeight + (this.pose === 'sit' ? 2 : 0) - (this.carrying ? 5 : 0);
    renderer.drawImage(
      getBubbleSprite(this.bubble.icon),
      Math.round(this.x) - Math.floor(BUBBLE_WIDTH / 2) + 3,
      top - BUBBLE_HEIGHT + 3 + pop
    );
  }

  /**
   * Kayıt için veri. Görev ve yol kaydedilmez (yapay zekâ yüklemeden sonra yeniden karar verir);
   * konum, ihtiyaçlar, kim olduğu, evde mi olduğu, sırtındaki yük, oturuyor olması, aile bağları,
   * çocukluk süresi ve kuşandığı ekipman saklanır.
   */
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      age: this.age,
      traits: this.traits,
      appearance: this.appearance,
      needs: this.needs,
      homeId: this.homeId,
      facing: this.facing,
      insideBuildingId: this.insideBuildingId,
      carrying: this.carrying,
      newcomer: this.newcomer,
      sitting: this.pose === 'sit',
      activityLabel: this.activityLabel,
      buffs: this.buffs,
      skills: this.skills,
      growsUpAt: this.growsUpAt,
      parentIds: this.parentIds,
      partnerId: this.partnerId,
      married: this.married,
      partnerSince: this.partnerSince,
      marriedAt: this.marriedAt,
      lastChildAt: this.lastChildAt,
      relocating: this.relocating,
      equipment: this.equipment,
      illness: this.illness,
      exposure: this.exposure,
      away: this.away,
      schooling: this.schooling,
      schoolDay: this.schoolDay,
      schoolToday: this.schoolToday,
      educated: this.educated,
      workplaceId: this.workplaceId,
      customName: this.customName,
      memories: this.memories,
      tale: this.tale,
      quirk: this.quirk,
      lastNews: this.lastNews,
      dinnerDay: this.dinnerDay,
      lastDateAt: this.lastDateAt,
      coins: this.coins,
      inventory: this.inventory,
      emigrating: this.emigrating,
      isInjured: this.isInjured,
      injuryTimer: this.isInjured ? Math.round(this.injuryTimer) : 0,
      lifeStage: this.lifeStage,
      ageInDays: this.ageInDays,
      agedDays: this.agedDays,
      apprenticeship: this.apprenticeship,
      quirkOrigin: this.quirkOrigin,
      isGrandmaster: this.isGrandmaster,
      isVenerable: this.isVenerable,
      lifespan: this.lifespan,
      grandmasterProfession: this.grandmasterProfession,
      grandmasterBatches: this.grandmasterBatches,
      generation: this.generation,
      parents: this.parents,
      familyId: this.familyId,
      children: this.children,
      mentees: this.mentees,
      relationships: this.relationships,
      moodlets: this.moodlets,
      wants: this.wants,
      fears: this.fears,
      satisfaction: this.satisfaction,
      wantLog: this.wantLog,
      fearStreak: this.fearStreak,
      wishCount: this.wishCount,
      growth: this.growth,
      growthToday: this.growthToday,
      growthCause: this.growthCause,
      deepTraits: this.deepTraits,
      evolutions: this.evolutions,
      evolutionCount: this.evolutionCount,
      acquiredCount: this.acquiredCount,
      loyalty: this.loyalty,
      weddingDay: this.weddingDay,
      specialDay: this.specialDay,
      ...(this.sentence ? { sentence: this.sentence } : {}), // (32.2)
      ...(this.higherStudy ? { higherStudy: this.higherStudy } : {}), // (32.4)
      ...(this.graduate ? { graduate: this.graduate } : {}), // (32.4)
      ...(this.club ? { club: { key: this.club.key, since: this.club.since, missed: this.club.missed } } : {}), // (32.5)
    };
  }

  static fromJSON(data) {
    // (25.1) Evresi olmayan eski kayıtlar (v2-v23) ve bozuk evreler: yetişkinler 'adult' başlar (70+ 'elder'); yaş korunur
    const c = new Character(isLifeStage(data.lifeStage) ? data : { ...data, lifeStage: data.growsUpAt === null || data.growsUpAt === undefined ? 'adult' : null });
    if (data.facing) c.facing = data.facing;
    c.carrying = data.carrying ?? null;
    c.newcomer = Boolean(data.newcomer);
    if (data.insideBuildingId) {
      c.insideBuildingId = data.insideBuildingId;
      c.visible = false;
      c.pose = 'hidden';
    } else if (data.sitting) {
      c.pose = 'sit';
    }
    if (data.activityLabel) c.activityLabel = data.activityLabel;
    c.buffs = { ...(data.buffs ?? {}) };
    c.skills = { ...(data.skills ?? {}) };
    // Sefere yola çıkmışken kaydedildiyse yüklenince doğrudan seferde sayılır (görünmez)
    if (c.away) {
      c.away.stage = 'away';
      c.visible = false;
      c.pose = 'hidden';
      c.insideBuildingId = null;
    }
    return c;
  }
}

/** (29.7) Kayıttaki özel gün durumu: { day, kind, celebrated, gifted } ya da null. */
function sanitizeSpecialDay(d) {
  if (!d || typeof d !== 'object' || !Number.isFinite(d.day) || (d.kind !== 'birthday' && d.kind !== 'anniversary')) return null;
  return { day: Math.max(1, Math.floor(d.day)), kind: d.kind, celebrated: Boolean(d.celebrated), gifted: Boolean(d.gifted) };
}

/** (32.2) Kayıttaki ceza durumu: bozuk alanlar atılır; hiçbir şey kalmazsa null. */
function sanitizeSentence(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  if (Number.isFinite(raw.service) && raw.service > 0) {
    out.service = Math.round(raw.service * 100) / 100;
    if (Number.isInteger(raw.serviceDay)) out.serviceDay = raw.serviceDay;
    if (Number.isFinite(raw.serviceToday)) out.serviceToday = Math.max(0, raw.serviceToday);
    if (Number.isInteger(raw.caseId)) out.caseId = raw.caseId;
  }
  if (Number.isFinite(raw.banUntil) && raw.banUntil > 0) out.banUntil = Math.round(raw.banUntil);
  if (raw.exile && Number.isFinite(raw.exile.since)) {
    const e = raw.exile;
    out.exile = { since: e.since, exit: e.exit && Number.isFinite(e.exit.x) ? { x: e.exit.x, y: e.exit.y } : null };
    if (typeof e.band === 'string') out.exile.band = e.band.slice(0, 12);
    if (typeof e.crime === 'string') out.exile.crime = e.crime.slice(0, 20);
  }
  return Object.keys(out).length ? out : null;
}
