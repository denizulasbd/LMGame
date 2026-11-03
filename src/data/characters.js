// Kasaba sakinleriyle ilgili saf veriler: ihtiyaçlar, kişilik özellikleri, günlük düzen
// ve başlangıç sakinleri havuzu. Bu verilerin nasıl yorumlandığı src/ai/ altındadır.

// İhtiyaçlar 0-100 arası; 100 = tamamen karşılanmış. decayPerHour: oyun saati başına azalma.
export const NEEDS = {
  hunger: { name: 'Tokluk', decayPerHour: 5 },
  energy: { name: 'Enerji', decayPerHour: 4.2 },
  social: { name: 'Sosyallik', decayPerHour: 4 },
  fun: { name: 'Keyif', decayPerHour: 3.5 },
};
export const NEED_KEYS = Object.keys(NEEDS);

// Uyurken ihtiyaçların azalma çarpanı (enerji uyurken dolar, azalmaz)
export const SLEEP_DECAY_MULTIPLIER = { hunger: 0.5, energy: 0, social: 0.3, fun: 0.3 };

// Varsayılan günlük düzen (saat, ondalıklı). bedtime 24'ü geçebilir (ör. 25 = gece 01:00).
export const DEFAULT_SCHEDULE = { bedtime: 22, wake: 6.5 };

// Mesai saatleri: bu aralıkta acil bir ihtiyacı olmayan sakin önce iş kuyruğuna bakar
export const WORK_HOURS = { start: 8, end: 17 };

// Çalışmanın varsayılan etkileri: hız çarpanı, dakika başına enerji/keyif kaybı, mola olasılığı
export const DEFAULT_WORK = { speed: 1, energyCost: 0.05, funCost: 0.015, breakChance: 0.05 };

// Bu eşiklerin altına düşen ihtiyaç için karakter harekete geçer
export const DEFAULT_THRESHOLDS = { hunger: 35, energy: 22, social: 45 };

// Boş zaman etkinliklerinin varsayılan tercih ağırlıkları (src/data/activities.js'teki adlar)
export const DEFAULT_LEISURE = {
  stroll: 1,
  bench: 1,
  river: 1,
  flowers: 1,
  fountain: 1.2,
  campfire: 1,
  inn: 1.5, // yalnızca han akşam açıkken
  monument: 1.2, // yalnızca anıt tamamlandıysa
  ancientSpring: 1, // yalnızca kadim çeşme onarıldıysa (uzakta: tazelenmeye yürüyerek gidilir)
  campRest: 0.6, // yalnızca erzak kampı onarıldıysa
};

// Kişilik özellikleri
//   decay   : ihtiyaç azalma çarpanları
//   gain    : etkinlikten kazanım çarpanları (ihtiyaç adı ya da 'nature' = nehir/çiçek keyfi)
//   leisure : boş zaman tercih ağırlığı çarpanları
//   schedule, thresholds: varsayılanların üzerine yazılır
//   speed   : yürüme hızı çarpanı;  bubbleRate: ifade balonu sıklığı çarpanı
//   work    : { speed, fatigue, breakChance } — iş hızı, çalışırken yorulma çarpanı, mola olasılığı
//   rainLover: true ise yağmurda dışarıdayken keyfi düşmez, aksine artar
//   skillPreference: { meslek: karo } bu meslekteki işler o kadar karo yakınmış gibi seçilir
//   quarrelChance: atışma olasılığı çarpanı (Huysuz daha çabuk parlar)
// Zıt özellikler OPPOSING_TRAITS'te: bu özelliklere sahip iki sakin yan yana çalışırken ya da dar
// bir yerde karşılaşınca atışabilir (src/systems/ConflictSystem.js).
export const TRAITS = {
  natureLover: {
    name: 'Doğa Sever',
    description: 'Nehir kenarında ve çiçeklerin arasında keyfi çok daha hızlı yerine gelir. Yağmuru ve koyun ağılında çobanlığı sever.',
    decay: { fun: 0.9 },
    gain: { nature: 1.6 },
    rainLover: true,
    leisure: { river: 3, flowers: 3, stroll: 1.5 },
    work: { breakChance: 0.25 },
    skillPreference: { husbandry: 8 }, // koyunlarla açık havada çalışmayı sever
  },
  sleepyhead: {
    name: 'Uykucu',
    description: 'Çabuk yorulur, erken yatar, geç kalkar; banklarda pinekler.',
    decay: { energy: 1.35 },
    schedule: { bedtime: 21, wake: 8.5 },
    leisure: { bench: 2.5 },
    work: { speed: 0.9, fatigue: 1.3, breakChance: 0.3 },
  },
  socialButterfly: {
    name: 'Sosyal Kelebek',
    description: 'Yalnız kalmaya dayanamaz; meydanda ve ateş başında insan arar.',
    decay: { social: 1.5 },
    gain: { social: 1.3 },
    thresholds: { social: 60 },
    leisure: { fountain: 2.5, campfire: 2 },
  },
  glutton: {
    name: 'Obur',
    description: 'Çabuk acıkır ve karnı biraz bile kazınsa çalılara koşar.',
    decay: { hunger: 1.4 },
    gain: { hunger: 1.2 },
    thresholds: { hunger: 50 },
  },
  hardworking: {
    name: 'Çalışkan',
    description: 'Erken kalkar, hızlı yürür ve çalışır, işte daha az yorulur; mola vermez.',
    schedule: { wake: 5.5 },
    speed: 1.15,
    leisure: { stroll: 3, bench: 0.5 },
    work: { speed: 1.4, fatigue: 0.6, breakChance: 0 },
  },
  nightOwl: {
    name: 'Gece Kuşu',
    description: 'Gece yarısından sonra yatar, sabahları uyanamaz; ateş başının müdavimi.',
    schedule: { bedtime: 25, wake: 9.5 },
    leisure: { campfire: 3, river: 1.5 },
  },
  introvert: {
    name: 'İçine Kapanık',
    description: 'Kalabalığa az ihtiyaç duyar; sessiz köşeleri sever.',
    decay: { social: 0.6 },
    gain: { social: 0.8 },
    thresholds: { social: 30 },
    leisure: { bench: 2, river: 2, fountain: 0.5, campfire: 0.6 },
  },
  cheerful: {
    name: 'Neşeli',
    description: 'Keyfi kolay kolay kaçmaz, sık sık şarkı mırıldanır.',
    decay: { fun: 0.7 },
    bubbleRate: 1.6,
    leisure: { fountain: 1.5 },
  },
  ambitious: {
    name: 'Hırslı',
    description: 'Taş ocağında, madende ve kaya başında çalışmaya bayılır, hızlı çalışır; boş durunca keyfi kaçar. Anıtı çok sever.',
    decay: { fun: 1.15 },
    skillPreference: { masonry: 10, mining: 10 },
    leisure: { monument: 2.5, stroll: 1.5, river: 0.6, flowers: 0.5 },
    work: { speed: 1.15 },
  },
  grumpy: {
    name: 'Huysuz',
    description: 'Kolay kolay gülmez, sabahları homurdanır; tartışmaya hazırdır ama handa sıcak yemek onu yumuşatır.',
    decay: { social: 0.85 },
    bubbleRate: 0.6,
    quarrelChance: 1.5,
    leisure: { inn: 1.6, fountain: 0.7, bench: 1.4 },
  },
};

// Birbiriyle çatışan özellik çiftleri (sırası önemsiz)
export const OPPOSING_TRAITS = [
  ['hardworking', 'sleepyhead'],
  ['socialButterfly', 'introvert'],
  ['natureLover', 'ambitious'],
  ['cheerful', 'grumpy'],
];

// Sakin havuzu. Başlangıçta tohuma göre içlerinden 6'sı seçilir; kalanlar boş ev
// açıldıkça göçmen olarak gelir. Havuz biterse ad ve görünüm rastgele birleştirilir.
// Görünüm renkleri src/art/palette.js -> CHARACTER_COLORS içindeki adlardır.
export const RESIDENT_POOL = [
  {
    name: 'Ayşe',
    age: 27,
    traits: ['natureLover', 'cheerful'],
    appearance: { hair: 'long', hairColor: 'auburn', skin: 'light', shirt: 'rose', pants: 'navy' },
  },
  {
    name: 'Mehmet',
    age: 41,
    traits: ['hardworking', 'glutton'],
    appearance: { hair: 'short', hairColor: 'black', skin: 'tan', shirt: 'forest', pants: 'brown' },
  },
  {
    name: 'Elif',
    age: 23,
    traits: ['socialButterfly', 'nightOwl'],
    appearance: { hair: 'bun', hairColor: 'blonde', skin: 'light', shirt: 'sky', pants: 'plum' },
  },
  {
    name: 'Can',
    age: 19,
    traits: ['sleepyhead', 'glutton', 'cheerful'],
    appearance: { hair: 'spiky', hairColor: 'brown', skin: 'medium', shirt: 'mustard', pants: 'denim' },
  },
  {
    name: 'Zeynep',
    age: 34,
    traits: ['introvert', 'natureLover'],
    appearance: { hair: 'long', hairColor: 'black', skin: 'medium', shirt: 'lavender', pants: 'teal' },
  },
  {
    name: 'Emre',
    age: 30,
    traits: ['hardworking', 'socialButterfly'],
    appearance: { hair: 'hat', hairColor: 'ginger', skin: 'light', shirt: 'red', pants: 'denim' },
  },
  {
    name: 'Deniz',
    age: 66,
    traits: ['grumpy', 'introvert'],
    appearance: { hair: 'short', hairColor: 'gray', skin: 'deep', shirt: 'teal', pants: 'brown' },
  },
  {
    name: 'Selin',
    age: 25,
    traits: ['cheerful', 'socialButterfly', 'sleepyhead'],
    appearance: { hair: 'bun', hairColor: 'brown', skin: 'tan', shirt: 'mint', pants: 'navy' },
  },
  {
    name: 'Mert',
    age: 29,
    traits: ['ambitious', 'cheerful'],
    appearance: { hair: 'spiky', hairColor: 'black', skin: 'medium', shirt: 'navy', pants: 'brown' },
  },
  {
    name: 'Defne',
    age: 21,
    traits: ['natureLover', 'socialButterfly'],
    appearance: { hair: 'long', hairColor: 'ginger', skin: 'light', shirt: 'mint', pants: 'plum' },
  },
  {
    name: 'Kemal',
    age: 58,
    traits: ['grumpy', 'hardworking'],
    appearance: { hair: 'hat', hairColor: 'gray', skin: 'tan', shirt: 'mustard', pants: 'navy' },
  },
  {
    name: 'Nilay',
    age: 32,
    traits: ['ambitious', 'nightOwl'],
    appearance: { hair: 'bun', hairColor: 'black', skin: 'deep', shirt: 'red', pants: 'denim' },
  },
  {
    name: 'Ozan',
    age: 26,
    traits: ['sleepyhead', 'natureLover'],
    appearance: { hair: 'short', hairColor: 'blonde', skin: 'light', shirt: 'teal', pants: 'brown' },
  },
  {
    name: 'Leyla',
    age: 37,
    traits: ['cheerful', 'hardworking', 'introvert'],
    appearance: { hair: 'long', hairColor: 'brown', skin: 'tan', shirt: 'lavender', pants: 'navy' },
  },
];

export const STARTING_RESIDENT_COUNT = 6;

// Havuz tükenince göçmenler için ad ve görünüm parçaları
export const EXTRA_NAMES = ['Bora', 'Ece', 'Kaan', 'Yağmur', 'Arda', 'Duru', 'Efe', 'Lale', 'Tolga', 'Sude'];
export const APPEARANCE_PARTS = {
  hair: ['short', 'long', 'bun', 'spiky', 'hat'],
  hairColor: ['black', 'brown', 'auburn', 'blonde', 'ginger'],
  skin: ['light', 'medium', 'tan', 'deep'],
  shirt: ['rose', 'forest', 'sky', 'mustard', 'lavender', 'red', 'teal', 'mint'],
  pants: ['navy', 'brown', 'denim', 'plum'],
};

// Oyuncunun sakine verebileceği adın en çok uzunluğu (13. aşama: Karakter Paneli'nde ada tıklayınca)
export const CHARACTER_NAME_MAX_LENGTH = 16;
