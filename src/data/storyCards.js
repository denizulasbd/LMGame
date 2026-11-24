// (30.2 "Görünen Hikâye") Hikâye kartlarının veri tablosu: hangi olay kaç öncelikli, hangi eşikler, süzgeç kademeleri. Metinler
// systems/StoryCards.js'te saf işlevlerle üretilir (aynı olay yükü aynı metni verir). Bu tablo yalnızca arayüzü etkiler;
// simülasyona hiçbir şey yazmaz. Sayıları buradan ayarla (gün başına 2-8 kart hedefi: tools/sim/tests/30.2-stories.mjs).
export const STORY_TABLE_VERSION = 7; // (32.4) 7: 'university:*' (kabul, mezuniyet, yarım bırakma); (32.3) 6: 'renown:tier' / 'renown:grant'; (30.3) 2: 'pantry:low' (Kiler boşalıyor); (30.6) 3: 'storm:struck' / 'crisis:raidResolved' (hasar kartı), fadeSeconds 20; (32.1) 4: 'crime:caught' / 'crime:unsolved'; (32.2) 5: 'court:*' (karar, sürgün, tanık, sürüncemede)

export const STORY_LIMITS = {
  visible: 2, // aynı anda görünen kart
  queue: 6, // kuyrukta bekleyen kart; fazlası önceliği düşükten atılır
  fadeSeconds: 20, // kart bu kadar GERÇEK saniye sonra solar (fare üstündeyken ya da duraklatılmışken beklemez); (30.6) 12 -> 20, eylemi geçerli olan kart kapatılana dek kalır
  summaryHour: 22, // gün özeti saati
  summaryItems: 3, // gün özetinde en önemli kaç olay
  watchedMax: 3, // "Yakından izle" üst sınırı
  wantMin: 18, // dilek kartı için en düşük puan
  fearMin: 12, // korku kartı için en düşük puan
  specialStartHour: 6, // özel gün sabahı kartı (RiteSystem 06:00'da işaretler)
  storyChars: 220, // "Öyküsünü oku" ile açılan metnin üst sınırı
  crimePerDay: 1, // (32.1) "Yalnızca önemli" süzgecinde günde en çok bu kadar suç kartı (fazlası gün özetine; izlenen sakinin kartı sayılmaz)
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
  'pantry:low': 4, // (30.3) kiler bir günden az yeter
  'storm:struck': 4, // (30.6) fırtına / kurt sonrası hasar kartı
  'crisis:raidResolved': 4, // (30.6) baskın sonrası hasar kartı (yalnızca yapı hasar gördüyse)
  'dilemma:resolved': 4, // (30.4b) orta oyun kararının sonucu (yalnızca yeni kartlar)
  'crime:caught': 3, // (32.1) suçüstü yakalanan küçük suç ("Yalnızca önemli" süzgecinde günde en çok bir suç kartı: crimePerDay)
  'crime:unsolved': 3, // (32.1) kimsenin görmediği kayıp
  'court:verdict': 2, // (32.2) Adalet Sarayı kararı: adil / hafif kısa kart (2); sert ve zalim karar önemli (kartın kendi önceliği 4)
  'court:exiled': 4, // (32.2) sürgün
  'court:revealed': 3, // (32.2) susan tanık konuştu, dava açıldı
  'court:stale': 3, // (32.2) dava sürüncemede kaldı
  'renown:tier': 3, // (32.3) Krallık İtibarı kademe değişti (Şüpheli'ye düşüş ve Gözde'ye çıkış 4)
  'renown:grant': 5, // (32.3) Kraliyet Lütufnamesi (gizli yapı açıldı)
  'university:admitted': 1, // (32.4) Darülfünun'a kabul (kısa)
  'university:graduated': 4, // (32.4) Darülfünun mezuniyeti (önemli)
  'university:dropped': 2, // (32.4) eşiğe ulaşamadan yetişkin oldu
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
  case: 'Dava dosyası', // (32.2)
  letter: 'Lütufnameyi oku', // (32.3)
};

export const STORY_TEXT = {
  go: 'Git',
  summaryLead: 'Bugün kasabada:',
  watchedTip: 'Yakından izlenen sakin',
};
