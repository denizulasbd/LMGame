// (22. aşama) Krallık katmanı: iç vergi ve öşür, Krallık Vergisi ve Kraliyet Tahsildarı, Kraliyet Fermanları, Kraliyet
// Aslanlı Heykeli ve göç / terk ediş. Mantık: systems/TaxSystem.js, systems/CrownSystem.js, systems/DesertionSystem.js
// (saf hesaplar systems/Crown.js). 21. aşamanın kese ve çantası, Yönetim Güveni ve isyanı üstüne kurulur; onları yalnızca
// okur ve kendi olaylarıyla etkiler.

// ---------------------------------------------------------------------------
// İç vergi ve ayni öşür (TaxSystem)
// ---------------------------------------------------------------------------
// percent : her tahsilatta yetişkinlerin kesesinden kesilen oran (öşür: çantadaki fazla erzak / ekmek / odundan da aynı oran)
// trust   : her tahsilatta Yönetim Güveni'ne etkisi; fun: her yetişkinin keyfine etkisi
// workSpeed: oran seçili kaldıkça kasabanın çalışma hızı çarpanı (Ağır Vergi -%15)
export const TAX_RATES = {
  exempt: { name: 'Vergi Muafiyeti', short: 'Muaf', percent: 0, trust: 6, fun: 5, icon: 'heart', description: 'Kesinti yok. Her vergi döneminde güven +6, keyif +5' },
  low: { name: 'Düşük / Adil Vergi', short: 'Düşük', percent: 10, trust: 2, fun: 0, icon: 'coin', description: 'Az kesinti (%10). Güven +2, verim etkilenmez' },
  standard: { name: 'Standart Vergi', short: 'Standart', percent: 20, trust: 0, fun: 0, icon: 'coin', description: 'Makul kesinti (%20). Güven sabit kalır' },
  heavy: { name: 'Ağır Vergi / Haraç', short: 'Ağır', percent: 45, trust: -8, fun: -10, workSpeed: 0.85, icon: 'torch', description: 'Yüksek kesinti (%45)! Her tahsilatta güven -8, keyif -10; çalışma hızı -%15' },
};
export const TAX_RATE_KEYS = Object.keys(TAX_RATES);

export const TAX = {
  defaultRate: 'standard',
  lockDays: 3, // (28.1) Vergi Fermanı: kademe değişince bu kadar oyun günü kilitlenir (bir tam tahsilat döngüsü)
  everyDays: 3, // her 3 günde bir ...
  hour: 12, // ... öğlen 12:00'de
  minCoins: 2, // kesesinde bundan azı olandan kesinti yapılmaz
  titheKeep: 1, // çantadaki her erzak / ekmek / odundan bu kadarı bırakılır, fazlasından öşür alınır
  tithe: { ration: 'food', bread: 'bread', firewood: 'wood' }, // çanta eşyası -> kilere giden kaynak
  logSize: 8,
};

// ---------------------------------------------------------------------------
// Krallık Vergisi ve Kraliyet Tahsildarı (CrownSystem)
// ---------------------------------------------------------------------------
// Tutar = (base + perTier × seviye + perResident × nüfus) × (Altın Çağ ise goldenAge) × itibar çarpanı
export const LEVY = {
  everyDays: 6,
  hour: 12,
  noticeDays: 2, // tahsildar bu kadar gün önce yola çıkar ("Kraliyet Tahsildarı Yolda")
  base: 20,
  perTier: 15,
  perResident: 3,
  goldenAge: 1.5, // Ulu Saat Kulesi'yle Altın Çağ'a giren kasabanın şanı vergisini artırır
  inKindShare: 0.5, // altın yetmezse vergi tutarının en çok yarısı malla ödenebilir
  inKindPerGold: 2, // 1 altın yerine 2 birim yiyecek / odun / taş
  inKindResources: ['food', 'wood', 'stone'],
  paid: { trust: 3, reputation: 8 },
  failed: { trust: -12, reputation: -20, goodsShare: 0.4, goodsPerGold: 3 }, // ödenemezse hazineye el konur, depodan mal çekilir
};

// Krallık İtibarı (0-100, başlangıç 50): vergiyi ve ferman ödüllerini etkiler
export const REPUTATION = {
  start: 50,
  levels: [
    { min: 75, key: 'good', name: 'Saygın', levy: 0.9, reward: 1.2 },
    { min: 40, key: 'ok', name: 'Sadık', levy: 1, reward: 1 },
    { min: 0, key: 'bad', name: 'Şüpheli', levy: 1.2, reward: 0.9 },
  ],
};

// ---------------------------------------------------------------------------
// Kraliyet Fermanları / görevleri (CrownSystem)
// ---------------------------------------------------------------------------
// need(k): teslim edilecek kaynaklar (k = kasaba seviyesi); kind 'research': süre içinde bir araştırma bitirilmeli;
// kind 'masterwork': depodaki bir usta işi eser teslim edilir. requires: fermanın gelmesi için kasabada olması gerekenler.
// reward: altın (k ile ölçeklenir, itibarla çarpılır) ve özel ödül (item)
export const DECREES = {
  garrison: {
    name: 'Sınır Garnizonu İçin Erzak',
    icon: 'bread',
    text: 'Sınır garnizonu kışa erzaksız girmesin: fırınlarınızdan ekmek, madenlerinizden demir istiyoruz.',
    need: (k) => ({ bread: 10 * k + 5, iron: 3 * k + 1 }),
    requires: ['mill', 'ironMine'],
    reward: { goldPerTier: 80, item: 'gears', amount: 2 },
  },
  library: {
    name: 'Saray Kütüphanesi İçin Bilgelik',
    icon: 'book',
    text: "Saray kütüphanesi yeni bilgilere aç: Bilgelik Evi'nizde bir araştırmayı tamamlayıp sonuçlarını gönderin.",
    kind: 'research',
    requires: ['academy'],
    reward: { goldPerTier: 70, item: 'ancientBook', amount: 1 },
  },
  treasure: {
    name: 'Saray Hazinesi İçin Usta İşi Eser',
    icon: 'masterpiece',
    text: 'Saray hazinesine layık bir usta işi eser istiyoruz: ustalarınızın en güzel işini gönderin.',
    kind: 'masterwork',
    requires: [],
    reward: { goldPerTier: 90, item: 'rareSeed', amount: 1 },
  },
  feast: {
    name: 'Kraliyet Şöleni İçin Balık ve Şerbet',
    icon: 'fish',
    text: 'Kraliyet şöleni hazırlanıyor: sofralar için bol balık, yiyecek ve taze ekmek bekliyoruz.',
    need: (k) => ({ food: 25 * k, bread: 5 * k }),
    requires: ['mill'],
    reward: { goldPerTier: 60, item: 'rareSeed', amount: 1 },
  },
  shipyard: {
    name: 'Kraliyet Tersanesi İçin Kereste ve Taş',
    icon: 'wood',
    text: 'Kraliyet tersanesi yeni gemiler kuruyor: kereste ve kesme taş gönderin; sadakatiniz bir beratla ödüllendirilecek.',
    need: (k) => ({ wood: 30 * k, stone: 20 * k }),
    requires: [],
    reward: { goldPerTier: 60, item: 'statueRight', amount: 1 },
  },
};
export const DECREE_KEYS = Object.keys(DECREES);

export const DECREE = {
  firstDay: 5,
  minTier: 2, // Köy seviyesinden itibaren Krallık görev verir
  intervalMinutes: [5760, 8640], // 4-6 günde bir
  deadlineMinutes: 4320, // 3 gün
  delivered: { reputation: 10, trust: 4 },
  failed: { goldPerTier: 40, foodPerTier: 15, reputation: -12, trust: -4 }, // süre doldu ya da reddedildi
  logSize: 10,
  bookFallbackGold: 100, // kitaplık doluysa antik kitap yerine
  rightFallbackGold: 100, // berat zaten varsa
};

// Özel ödüllerin adları (arayüz ve günlük)
export const DECREE_ITEMS = {
  gears: { name: 'Kadim Dişli', icon: 'gears' },
  ancientBook: { name: 'Antik Kitap', icon: 'book' },
  rareSeed: { name: 'Nadir Tohum', icon: 'vineSeed' },
  statueRight: { name: 'Kraliyet Beratı: Aslanlı Heykel dikme hakkı', icon: 'royalStatue' },
};

// Kraliyet Aslanlı Heykeli: beratla açılır; kalıcı refah (yapı tanımındaki townBonus) ve saat başı güven
export const ROYAL_STATUE = { trustPerHour: 0.1 };

// ---------------------------------------------------------------------------
// Göç / terk ediş (DesertionSystem)
// ---------------------------------------------------------------------------
export const EXODUS = {
  despairBelow: 20, // güven ya da refah bunun altında ...
  graceHours: 24, // ... bu kadar saat kalırsa ve isyan yağmaya varmışsa (ya da bir gündür sürüyorsa) terk ediş başlar
  revoltHours: 24,
  everyMinutes: 360, // 6 saatte bir bir sakin (ya da bir aile) ayrılır
  // (30.4a, ENGINES.gentleExodus) terk ediş sınırı: bir oyun gününde en çok maxPerDay, bir isyan boyunca (isyan bittikten sonraki
  // terk edişler de son isyana sayılır; yeni isyan sayacı sıfırlar) en çok maxPerRevolt sakin ayrılır. Aile tek birimdir: sayaç
  // sınırın altındayken yola çıkan aile sınırı bir kez aşabilir.
  maxPerDay: 2,
  maxPerRevolt: 4,
  core: 3, // kasabada her koşulda en az bu kadar sakin kalır
  leaveTimeoutMinutes: 720, // harita kenarına bu kadar sürede varamayan doğrudan ayrılmış sayılır
  // Kötü şöhret: göç koşullarına eklenen şart
  immigrationBlockBelow: 35, // güven bunun altındaysa (ya da terk ediş sürüyorsa) göçmen gelmez
  immigrationSlowBelow: 50, // bunun altındaysa sabah en çok 1 göçmen
  logSize: 12,
};
