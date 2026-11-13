// (30.2 "Görünen Hikâye") Hikâye kartlarının veri tablosu: hangi olay kaç öncelikli, hangi eşikler, süzgeç kademeleri. Metinler
// systems/StoryCards.js'te saf işlevlerle üretilir (aynı olay yükü aynı metni verir). Bu tablo yalnızca arayüzü etkiler;
// simülasyona hiçbir şey yazmaz. Sayıları buradan ayarla (gün başına 2-8 kart hedefi: tools/sim/tests/30.2-stories.mjs).
export const STORY_TABLE_VERSION = 1;

export const STORY_LIMITS = {
  visible: 2, // aynı anda görünen kart
  queue: 6, // kuyrukta bekleyen kart; fazlası önceliği düşükten atılır
  fadeSeconds: 12, // kart bu kadar GERÇEK saniye sonra solar (fare üstündeyken ya da duraklatılmışken beklemez)
  summaryHour: 22, // gün özeti saati
  summaryItems: 3, // gün özetinde en önemli kaç olay
  watchedMax: 3, // "Yakından izle" üst sınırı
  wantMin: 18, // dilek kartı için en düşük puan
  fearMin: 12, // korku kartı için en düşük puan
  specialStartHour: 6, // özel gün sabahı kartı (RiteSystem 06:00'da işaretler)
  storyChars: 220, // "Öyküsünü oku" ile açılan metnin üst sınırı
};

// Olay -> öncelik (5 en önemli). Süzgeç: 'important' öncelik >= 3 olanları gösterir.
export const STORY_PRIORITY = {
  'population:died': 5,
  'rite:started': 5,
  'relationship:married': 4,
  'family:childBorn': 4,
  'trait:evolved': 4,
  'special:morning': 3,
  'special:forgotten': 3,
  'want:fulfilled': 3,
  'fear:realized': 3,
  'apprentice:grandmaster': 3,
  'masterwork:created': 3,
  'relationship:partnered': 2,
  'chemistry:kindred': 2,
  'loyalty:changed': 2,
  'moodlet:mourning': 2,
  'moodlet:consoled': 2,
  'family:grownUp': 2,
  'venerable:became': 2,
  'relationship:quarrel': 1,
  'relationship:reconciled': 1,
  'story:summary': 2,
};

export const STORY_FILTERS = {
  all: { name: 'Hepsi', min: 0, hint: 'Her olay bir kart olur' },
  important: { name: 'Yalnızca önemli', min: 3, hint: 'Öncelik 3 ve üstü kart olur; ötekiler gün özetine girer' },
  off: { name: 'Kapalı', min: Infinity, hint: 'Hikâye kartı çıkmaz (izlenenler dahil)' },
};
export const STORY_DEFAULT_FILTER = 'important';

/** Kartın eylem düğmesi etiketleri. */
export const STORY_ACTIONS = {
  story: 'Öyküsünü oku',
  condolence: 'Taziye Sofrası Kur',
  gift: 'Armağan Gönder',
};

export const STORY_TEXT = {
  go: 'Git',
  summaryLead: 'Bugün kasabada:',
  watchedTip: 'Yakından izlenen sakin',
};
