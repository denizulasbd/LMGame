// Kasabanın geneline ait kurallar: refah (ortalama mutluluk), göç koşulları, şenlik,
// kasaba çapındaki geçici bonuslar ve (10. aşama) kasaba seviyesi / prestij ile belediyenin erzak dengesi.
// Hesaplar src/systems/TownStatus.js, EventSystem.js ve TownLevelSystem.js'te.

// Bir sakinin mutluluğu ihtiyaçlarının ağırlıklı ortalamasıdır (0-100)
export const HAPPINESS_WEIGHTS = { fun: 0.4, social: 0.2, hunger: 0.2, energy: 0.2 };

// Refah göstergesinin renk eşikleri
export const HAPPINESS_LEVELS = [
  { min: 70, key: 'good', name: 'Mutlu' },
  { min: 50, key: 'ok', name: 'Huzurlu' },
  { min: 0, key: 'bad', name: 'Mutsuz' },
];

// Göç: sabah ARRIVAL_HOUR'da şu koşullar sağlanırsa en fazla maxPerMorning kişi gelir
export const IMMIGRATION = {
  arrivalHour: 8,
  maxPerMorning: 2,
  maxPopulation: 24,
  minHappiness: 55,
  minFood: 15,           // en az bu kadar
  foodPerResident: 3,    // ve sakin başı bu kadar yiyecek (bir öğün)
};

// Akşam şenliği: başlangıç saatinde koşullar sağlanırsa bitişe kadar sürer
export const FESTIVAL = {
  startHour: 19,
  endHour: 22,
  minDaysBetween: 3,
  minFun: 60,            // kasabanın ortalama keyfi
  minPopulation: 3,
  // Şenlik yeri önceliği: meydan havuzu, kamp ateşi, han
  venues: ['fountain', 'campfire', 'inn'],
  afterglowFun: 30,      // şenlik bitince herkesin keyfine eklenen
};

// Kasaba çapındaki geçici bonuslar. hours: süre; workSpeed: iş hızı çarpanı; funDecay: keyif azalma
// çarpanı; instantFun: başladığı an herkese eklenen keyif
// 11. aşama: happiness: etkinken kasaba refahına eklenen puan; friendship: sohbetlerde arkadaşlık kazancı çarpanı
export const TOWN_BUFFS = {
  tools: { name: 'Alet Paketi', icon: 'hammer', hours: 24, workSpeed: 1.25 },
  guild: { name: 'Lonca Ustaları', icon: 'anvil', hours: 24, workSpeed: 1.2, funDecay: 0.85 },
  // Belediye fermanı ve ikilem olaylarının bonusları (11. aşama)
  grandFeast: { name: 'Büyük Ziyafet', icon: 'bread', hours: 72, workSpeed: 1.2, funDecay: 0.5, happiness: 6 },
  fair: { name: 'Büyük Panayır', icon: 'note', hours: 48, funDecay: 0.4, friendship: 1.6, happiness: 4 },
  goodwill: { name: 'İyilik Şöhreti', icon: 'heart', hours: 48, happiness: 5 },
  talisman: { name: 'Kadim Tılsım', icon: 'star', hours: 72, workSpeed: 1.15, funDecay: 0.8 },
  // 12. aşama: ihracat teknesinin nadir ticaret bonusu
  prosperity: { name: 'Ticaret Bereketi', icon: 'coin', hours: 24, workSpeed: 1.1, happiness: 3 },
  feast: { name: 'Kasaba İkramı', icon: 'food', hours: 24, funDecay: 0.5, instantFun: 25 },
  festival: { name: 'Şenlik Coşkusu', icon: 'sparkle', hours: 20, workSpeed: 1.15, funDecay: 0.7 },
  // 13. aşama: altın fermanları ve lüks mallar (data/luxury.js)
  goldBonus: { name: 'Altın İkramiye', icon: 'coin', hours: 72, workSpeed: 1.2, funDecay: 0.8, happiness: 5 },
  royalArchitects: { name: 'Kraliyet Mimarları', icon: 'hammer', hours: 48, buildSpeed: 3 },
  spices: { name: 'Baharat ve Kahve', icon: 'spice', hours: 96 },
  // 14. aşama: mevsim festivalleri sürerken (data/festivals.js) ve bittikten sonra
  blossomFestival: { name: 'Çiçek Şenliği', icon: 'blossom', hours: 9, friendship: 1.8, romance: 2.5, funDecay: 0.5 },
  sunFair: { name: 'Güneş ve Nehir Panayırı', icon: 'sunfair', hours: 9, friendship: 1.4, funDecay: 0.4, happiness: 4 },
  harvestFeast: { name: 'Büyük Hasat Bayramı', icon: 'harvest', hours: 9, friendship: 1.4, funDecay: 0.5, happiness: 5 },
  // 26.1: panayırın şenlik saati (data/fair.js) — Panayır Coşkusu
  fairSpirit: { name: 'Panayır Coşkusu', icon: 'sparkle', hours: 4, friendship: 1.4, funDecay: 0.5 },
  lightsNight: { name: 'Işıklar Gecesi', icon: 'snowman', hours: 9, friendship: 1.5, funDecay: 0.4, happiness: 6 },
  seasonCheer: { name: 'Mevsim Coşkusu', icon: 'sparkle', hours: 24, workSpeed: 1.15, funDecay: 0.8, happiness: 6 },
  // 21. aşama: bir vatandaş dilekçesi karşılanınca (PetitionSystem) kasaba bir gün "sesimiz duyuldu" der
  heard: { name: 'Sesimiz Duyuldu', icon: 'scroll', hours: 24, happiness: 3 },
  // 22. aşama: Krallık Vergisi ödenemeyince (CrownSystem) iki gün boyunca refah darbesi
  royalPenalty: { name: 'Kraliyet Cezası', icon: 'collector', hours: 48, happiness: -8 },
  // 23. aşama: haydut baskını bekçilerce püskürtülünce (CrisisSystem) kasaba bir gün huzurla yaşar
  banditsRepelled: { name: 'Haydutlar Kovuldu', icon: 'shield', hours: 24, happiness: 4 },
};

// Handa sıcak yemek yiyen sakinin kişisel bonusu: bu kadar oyun saati boyunca yavaş acıkır
export const WARM_MEAL = { hours: 8, hungerDecay: 0.6 };

// Kasaba adı önerileri (başlangıç ekranında rastgele biri önerilir; zar düğmesi yenisini getirir)
export const TOWN_NAMES = [
  'Yeşilvadi',
  'Çamlıköy',
  'Gümüşdere',
  'Kuzupınar',
  'Elmalıyurt',
  'Sarıçiçek',
  'Ilgınbağ',
  'Akçakaya',
  'Serinsu',
  'Lavantalı',
  'Dutluca',
  'Ayışığı Köyü',
  'Kırlangıç',
  'Göknarlı',
  'Bal Tepesi',
  'Söğütlüdere',
];
export const TOWN_NAME_MAX_LENGTH = 24;

// ---------------------------------------------------------------------------
// Kasaba seviyesi / prestij (10. aşama): Mezra -> Köy -> Kasaba -> Gelişmiş Şehir
// ---------------------------------------------------------------------------
// Kasaba büyüdükçe kendiliğinden seviye atlar; seviye hiç düşmez (oyuncu cezalandırılmaz, yalnızca
// büyüme ödüllendirilir). Bir seviyeye geçmek için koşulların hepsi aynı anda sağlanmalıdır:
//   population : nüfus (çocuklar dahil)
//   buildings  : tamamlanmış yapı sayısı (süsleme kategorisi — bank, fener, çiçek tarhı — ve doğal
//                yapılar sayılmaz; onarılmış kadim yapılar sayılır)
//   upgraded   : Seviye 2'ye yükseltilmiş yapı sayısı
//   welfare    : ortalama refah: kasaba refahının yaklaşık yarım günlük (TOWN_LEVEL.welfareHours) yürüyen
//                ortalaması; bir anlık şenlik coşkusu yetmez, kasaba bir süre mutlu kalmalıdır
//   townHall   : tamamlanmış Belediye Konağı (Kasaba seviyesinde açılır; şehir olmak için gerekir)
// Seviye ödülleri:
//   suffix          : HUD'da kasaba adının yanına eklenen unvan ("Yeşilvadi Kasabası")
//   unlocks         : kilidi açılan yapılar (data/buildings.js -> requiresTier)
//   merchantBonus   : gezgin tüccarın her takas teklifine eklenen stok (mal miktarı); yeni mallar
//                     data/trade.js -> minTier ile gelir (mal çeşitliliği)
//   maxPerMorning   : bir sabah gelebilecek en çok göçmen
//   maxPopulation   : göçle ulaşılabilecek en yüksek nüfus
//   happiness       : kasaba refahına kalıcı katkı (şehir gururu)
//   perks           : seviye penceresinde ve hedef panelinde gösterilen ödül metinleri
export const TOWN_TIERS = [
  {
    tier: 1,
    key: 'hamlet',
    name: 'Mezra',
    suffix: 'Mezrası',
    icon: 'tierHamlet',
    requires: null,
    merchantBonus: 0,
    perks: ['Birkaç kulübe ve bir kamp ateşi: her şey burada başlıyor'],
  },
  {
    tier: 2,
    key: 'village',
    name: 'Köy',
    suffix: 'Köyü',
    icon: 'tierVillage',
    requires: { population: 13, buildings: 8, upgraded: 1, welfare: 63 },
    merchantBonus: 1,
    unlocks: ['mill', 'academy'],
    perks: ['Yel Değirmeni ve Fırın inşa edilebilir', 'Bilgelik Evi inşa edilebilir: kasaba araştırmaları ve çocuklar için okul', 'Kasabaya bir kedi ve bir köpek yerleşir', 'Gezgin tüccar yün balyası ve demir külçesi getirir', 'Tüccarın her malından +1 stok'],
  },
  {
    tier: 3,
    key: 'town',
    name: 'Kasaba',
    suffix: 'Kasabası',
    icon: 'tierTown',
    requires: { population: 20, buildings: 17, upgraded: 3, welfare: 68 },
    merchantBonus: 2,
    unlocks: ['townHall', 'harbor', 'wonder'],
    maxPerMorning: 3,
    perks: ['Belediye Konağı inşa edilebilir', 'Ulu Saat Kulesi başlatılabilir (20 sakinle): üç aşamalı mega proje ve Altın Çağ', 'Büyük Ticaret Limanı kurulabilir: nehir teknesiyle ihracat ve Kasaba Hazinesi', 'Tüccar kervanla gelir: ekmek sepeti, yün ve demir alımı', 'Tüccarın her malından +2 stok', 'Bir sabah 3 göçmene kadar gelebilir', 'Bir kedi daha gelir'],
  },
  {
    tier: 4,
    key: 'city',
    name: 'Gelişmiş Şehir',
    suffix: 'Şehri',
    icon: 'tierCity',
    requires: { population: 25, buildings: 28, upgraded: 8, welfare: 75, townHall: 1 },
    merchantBonus: 3,
    maxPerMorning: 3,
    maxPopulation: 30,
    happiness: 4,
    perks: ['Şehir gururu: kasaba refahına kalıcı +4', 'Göç sınırı 24 yerine 30 sakin', 'Kervanbaşı Şehir Kervanı ve Lonca Ustaları getirir', 'Tüccarın her malından +3 stok', 'Bir köpek daha gelir'],
  },
];

export const TOWN_LEVEL = {
  welfareHours: 12, // ortalama refahın zaman sabiti (oyun saati): yaklaşık yarım günlük yürüyen ortalama
  checkMinutes: 10, // seviye koşulları bu sıklıkla denetlenir
};

// Kasaba adında unvan zaten varsa ("Ayışığı Köyü") tekrar eklenmez: "Ayışığı Köyü · Kasaba" yazılır
export const TITLE_WORDS = ['mezra', 'köy', 'kasaba', 'şehir', 'şehri', 'kent'];

// Belediye Konağı'nın her sabahki vergi ve erzak dengesi: temel kaynaklardan deposu en dolu olanın
// (en az richRatio) bir kısmı (share, en çok max) deposu en boş olana (poorRatio'nun altı) 1'e 1 aktarılır
export const TOWN_HALL = {
  hour: 7,
  resources: ['wood', 'stone', 'food'],
  richRatio: 0.5,
  poorRatio: 0.3,
  share: 0.15,
  max: 12,
};

// ---------------------------------------------------------------------------
// Belediye fermanları (11. aşama): geç oyunun kaynak bolluğunu kalıcı yatırımlara çevirir.
// Belediye Konağı'nın Yapı Bilgi Paneli'nden ilan edilir; mantık src/systems/CivicSystem.js'te.
//   cost       : stoktan harcanan kaynak
//   provisions : ayrıca harcanan erzak birimi (önce ekmek, yetmezse yiyecek; birim birim sayılır)
//   buff       : başlayan kasaba bonusu (TOWN_BUFFS), instant: herkese hemen eklenen ihtiyaç
//   cooldownDays: tekrar ilan edilebilmesi için geçmesi gereken gün
//   levels     : kademeli ferman: her kademe kendi maliyeti; capacity depo kapasitesine kalıcı eklenir,
//                cobbles meydana yakın bu kadar toprak yol karosu taş yola çevrilir ("yollar güzelleşir")
//   once       : bir kez ilan edilir; xpMultiplier meslek deneyimi, productionMultiplier üretim yapılarındaki
//                çalışma verimi çarpanı (kalıcı)
// ---------------------------------------------------------------------------
export const CIVIC_PROJECTS = {
  grandFeast: {
    name: 'Büyük Kışlık Ziyafet',
    icon: 'bread',
    description: 'Meydanda üç gün süren büyük ziyafet: herkes doyar, keyfi tavan yapar; 3 gün boyunca refah +6, iş şevki +%20, keyif yarı hızda düşer.',
    cost: { wood: 40 },
    provisions: 80,
    buff: 'grandFeast',
    instant: { fun: 30, hunger: 45 },
    cooldownDays: 5,
  },
  storehouse: {
    name: 'Altyapı ve Depo Genişletmesi',
    icon: 'stone',
    description: 'Ambarlar büyütülür, yollar arnavut kaldırımıyla döşenir: tüm kaynakların depo sınırı kalıcı olarak +150.',
    levels: [
      { cost: { wood: 100, stone: 100, iron: 40 }, capacity: 150, cobbles: 30 },
      { cost: { wood: 150, stone: 150, iron: 60 }, capacity: 150, cobbles: 40 },
    ],
  },
  craftGuild: {
    name: 'Zanaat Loncası Desteği',
    icon: 'anvil',
    description: 'Kasabanın ustalarına lonca kurulur: meslek deneyimi kazanma hızı ve üretim yapılarındaki verim kalıcı olarak +%15.',
    cost: { wool: 50, iron: 50 },
    once: true,
    xpMultiplier: 1.15,
    productionMultiplier: 1.15,
  },
};
export const CIVIC_PROJECT_KEYS = Object.keys(CIVIC_PROJECTS);
