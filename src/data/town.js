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
export const TOWN_BUFFS = {
  tools: { name: 'Alet Paketi', icon: 'hammer', hours: 24, workSpeed: 1.25 },
  guild: { name: 'Lonca Ustaları', icon: 'anvil', hours: 24, workSpeed: 1.2, funDecay: 0.85 },
  feast: { name: 'Kasaba İkramı', icon: 'food', hours: 24, funDecay: 0.5, instantFun: 25 },
  festival: { name: 'Şenlik Coşkusu', icon: 'sparkle', hours: 20, workSpeed: 1.15, funDecay: 0.7 },
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
    requires: { population: 10, buildings: 6, upgraded: 0, welfare: 60 },
    merchantBonus: 1,
    unlocks: ['mill'],
    perks: ['Yel Değirmeni ve Fırın inşa edilebilir', 'Gezgin tüccar yün balyası ve demir külçesi getirir', 'Tüccarın her malından +1 stok'],
  },
  {
    tier: 3,
    key: 'town',
    name: 'Kasaba',
    suffix: 'Kasabası',
    icon: 'tierTown',
    requires: { population: 16, buildings: 13, upgraded: 2, welfare: 65 },
    merchantBonus: 2,
    unlocks: ['townHall'],
    maxPerMorning: 3,
    perks: ['Belediye Konağı inşa edilebilir', 'Tüccar kervanla gelir: ekmek sepeti, yün ve demir alımı', 'Tüccarın her malından +2 stok', 'Bir sabah 3 göçmene kadar gelebilir'],
  },
  {
    tier: 4,
    key: 'city',
    name: 'Gelişmiş Şehir',
    suffix: 'Şehri',
    icon: 'tierCity',
    requires: { population: 24, buildings: 22, upgraded: 6, welfare: 72, townHall: 1 },
    merchantBonus: 3,
    maxPerMorning: 3,
    maxPopulation: 30,
    happiness: 4,
    perks: ['Şehir gururu: kasaba refahına kalıcı +4', 'Göç sınırı 24 yerine 30 sakin', 'Kervanbaşı Şehir Kervanı ve Lonca Ustaları getirir', 'Tüccarın her malından +3 stok'],
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
