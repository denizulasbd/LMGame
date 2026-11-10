// (28.4) Vadi Karakteri: harita tohumundan deterministik seçilen, oyun boyunca değişmeyen asimetrik coğrafya. Seçim systems/Valley.js'te.
//   production : yapı türü -> verim çarpanı (BehaviorSystem.performWork; araştırma ve doktrin çarpanlarıyla çarpılır)
//   heating    : tüm evlerin ve yapıların (han, kamp ateşi) kışlık odun tüketimi çarpanı
// Her karakterin bir gücü ve bir zayıflığı vardır; Kasaba Doktrinleri (data/doctrines.js) bunu dengeleyebilir ya da uçurabilir.
export const VALLEYS = {
  fertileDelta: {
    name: 'Bereketli Delta',
    icon: 'harvest',
    short: 'Tarım ve balıkçılık güçlü, maden zor',
    description: 'Nehir ağzının verimli çamuru: Sebze Bahçesi (Keten ve Şerbetçiotu dahil) ve Balıkçı İskelesi +%25 verimli; ama taş ve demir bulmak zor: Taş Ocağı ve Demir Madeni -%30 verimle çalışır.',
    production: { garden: 1.25, fishingPier: 1.25, quarry: 0.7, ironMine: 0.7 },
    heating: 1,
  },
  windyGorge: {
    name: 'Rüzgârlı Boğaz',
    icon: 'gears',
    short: 'Rüzgâr ve maden güçlü, kış sert',
    description: 'Dağ geçidinin sürekli rüzgârı ve yarık kayaları: Yel Değirmeni, Taş Ocağı ve Demir Madeni +%25 verimli; ama kışlar çok sert geçer: tüm evlerin ve yapıların ısınma odunu %40 artar.',
    production: { mill: 1.25, quarry: 1.25, ironMine: 1.25 },
    heating: 1.4,
  },
  ancientWeald: {
    name: 'Kadim Orman',
    icon: 'leaf',
    short: 'Odun ve yaban hayatı bol, güneş az',
    description: 'Yüzyıllık meşelerin gölgesi: Oduncu ve Kereste Atölyesi +%30 verimli (avcılık ve toplayıcılık da zengin); ama güneş azdır: Sebze Bahçesi üretimi -%20 düşer.',
    production: { lumberHut: 1.3, garden: 0.8 },
    heating: 1,
  },
};
export const VALLEY_KEYS = Object.keys(VALLEYS);
export const VALLEY_SEED_OFFSET = 36; // vadi seçimi izole üreteci: seed + 36
