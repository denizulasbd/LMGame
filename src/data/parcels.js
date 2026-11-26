// (34.1) Genişleyen harita: parsel halkaları, içerik üretimi ve kilitli alan görünümü için sayılar.
export const PARCELS = {
  // (34.2) Çekirdeğin çevresindeki halkaların kalınlığı (karo; harita tohumundan, [en az, en çok]). Halkalar toplamı en az 42 karo:
  // 34.1 bölünmesinin dünyası bunun içinde kalır (eski v42 kayıtlarındaki arazi yeni haritaya sığar).
  rings: [
    [20, 22],
    [22, 24],
  ],
  // Bir şeridin boyunca kesilen parsel kenarı (karo): en az, en çok, hedef (parça sayısı uzunluk / hedefe yakın olur)
  segment: { min: 24, max: 40, target: 36 },
  seedSalt: 0x34a1, // parsel bölünmesi ve içerik gürültüsü harita tohumunun bu karmasından (çekirdek üretecine dokunmaz)
  // (34.1) İlk bölünme (kimlikler `r1n0`): yalnızca eski kayıtlardaki açık parselleri yeni parsellere çevirmek için
  legacy: { rings: [[14, 18], [18, 24]], segment: { min: 12, max: 24 }, idPrefix: 'r' },
};

// Parsel içeriği (dünya koordinatından): çekirdek kenarı devralma, biyomlar, göller, nehir, yollar
export const EXPANSION = {
  inheritReach: 8,        // çekirdek kenarından bu kadar karo içeride biyom çekirdekten devralınır (gürültülü geçiş)
  biomeScale: 0.08,
  rocky: 0.35,            // kayalık tepe gürültü eşiği
  forest: 0.12,           // derin orman gürültü eşiği
  meadowRiverReach: 5,    // nehre / göle bu kadar yakın çimen bereketli toprak olur
  lake: { scale: 0.07, threshold: 0.5, coreGap: 5, roadGap: 3 },
  river: { drift: 0.06, meander: 3 },   // nehrin devamı: kıvrım gürültüsünün ölçeği ve genliği (karo)
  road: { meander: 0.05, amplitude: 2 },
  trees: { sparse: 0.3, forestBase: 0.5, forestGain: 0.45 }, // çekirdekle aynı: çayır ve tepede seyrek, ormanda sık
  rocks: { cluster: -0.05, rockyChance: 0.42, scatterAt: 0.3, scatterChance: 0.3, pebbleChance: 0.012 },
};

// (34.2) Parsel çerçevesi (üstüne gelince / kart açıkken) ve satın alma efekti: çizim, zamanlar saniye
export const PARCEL_VIEW = {
  hoverFill: 'rgba(255, 246, 214, 0.16)',
  hoverBorder: 'rgba(255, 236, 160, 0.95)',
  borderWidth: 2,
  fx: { seconds: 1.6, glow: 'rgba(255, 224, 120, 0.38)', spark: '#fff1b0', sparks: 26 }, // sevinç: parlayan çerçeve ve yükselen pırıltılar
};

// Kilitli alanın çizimi
export const LOCKED_VIEW = {
  fog: 'rgba(214, 222, 230, 0.55)', // soluk, sisli örtü
  border: 'rgba(255, 246, 214, 0.9)', // açık alanın kenarındaki ince çizgi
  cameraMargin: 6,                    // kamera açık alanın bu kadar karo ötesini gösterir
};

// (34.2) Parsel satın alma: fiyat, kota, seviye kapısı. Hepsi buradan ayarlanır.
export const PARCEL_MARKET = {
  // Fiyat (altın) = işe yarar karo (su ve kaya nesnesi dışı) × karo başı fiyat × çarpan, 5'in katına yuvarlanır.
  // Çarpan = ratio ^ (alınmış parsel sayısı / (toplam parsel − 1)): ilk parselde ×1, sonuncuda ×ratio; arası üstel artar (tohumda kaç parsel
  // olursa olsun son parseller aynı bantta kalır). Hedef: ilk parsel 40-80, orta parseller 300-800, son parseller 3.000-6.000
  // (tools/sim/tests/34.2-parcels.mjs ölçer).
  price: { perTile: 0.09, ratio: 60, min: 40, roundTo: 5 },
  // Nüfus kotası: (işe yarar karo − offset) / tilesPerResident (yuvarlanır), [min, max] içinde: alan büyüdükçe kota artar.
  quota: { offset: 300, tilesPerResident: 150, min: 1, max: 4 },
  // Kasaba seviyesine göre kapı: maxParcels = o seviyede toplam en çok kaç parsel; ring = en dış alınabilir halka (atlama yok: ikinci
  // halka yalnızca Gelişmiş Şehir'de). Kasaba'da ilk halkanın tamamı, Gelişmiş Şehir'de her şey açıktır.
  gates: { 1: { maxParcels: 2, ring: 1 }, 2: { maxParcels: 6, ring: 1 }, 3: { ring: 1 }, 4: { ring: Infinity } },
  maxPopulation: 60, // göç sınırı (seviye sınırı + açık parsellerin kotası) bunu aşmaz; mevcut kasabanın sınırı hiçbir zaman düşmez
  // Parsel içeriği: hangi ölçüt neye bakar (öncelik sırasıyla: göl > kaya > orman > çayır). Oranlar parsel alanına göredir.
  content: { lake: 0.04, rocky: 0.15, forest: 0.3 },
  goalId: 'firstExpansion',
  // Satın alma sevinç efekti (kısa, çizim)
  celebrateSeconds: 1.6,
};

// Parsel adları: yön + içerik. göl ve kaya parselleri yönsüz anılır (adı aynıysa yön eklenir, sonra sıra sayısı)
export const PARCEL_NAMES = {
  directions: { n: 'Kuzey', ne: 'Kuzeydoğu', e: 'Doğu', se: 'Güneydoğu', s: 'Güney', sw: 'Güneybatı', w: 'Batı', nw: 'Kuzeybatı' },
  // kind: orman / kaya / göl / çayır. withDirection: adın başına yön gelir. noun: adın gövdesi
  kinds: {
    forest: { label: 'orman', withDirection: true, nouns: { pine: 'Çam Ormanı', oak: 'Meşe Ormanı' } },
    rocky: { label: 'kaya', withDirection: false, nouns: { any: 'Kayalık Yamaç' } },
    lake: { label: 'göl', withDirection: false, nouns: { any: 'Göl Kıyısı Çayırı' } },
    meadow: { label: 'çayır', withDirection: true, nouns: { any: 'Çayırı' } },
  },
  ordinals: ['', ' II', ' III', ' IV', ' V', ' VI'],
};

// Metinler
export const PARCEL_TEXT = {
  locked: 'Bu toprak henüz kasabanın değil',
  tip: ({ name, w, h, label, price, quota }) => `Bu toprak henüz kasabanın değil · ${name} · ${w}×${h} · ${label} · ${price} altın · Nüfus +${quota}`,
  buy: 'Satın Al',
  cardTitle: 'Toprak Parseli',
  close: 'Kapat',
  owned: 'Kasabanın toprağı',
  // pasif düğmenin nedenleri
  needNeighbor: 'Önce komşu toprağı al',
  needTier: (tierName) => `${tierName} seviyesinde açılır`,
  needGold: (price, have) => `Yetersiz altın (${price} gerekir, ${have} var)`,
  priceLine: ({ useful, perTile, step, multiplier, total }) => `${useful} işe yarar karo × ${String(perTile).replace('.', ',')} altın × ${String(multiplier).replace('.', ',')} (${step}. parsel) = ${total} altın`,
  usefulLine: ({ useful, area }) => `İşe yarar alan: ${useful}/${area} karo (su ve kaya dışı)`,
  quotaLine: (quota) => `Nüfus kotası: +${quota}`,
  story: (name) => `Kasaba genişledi: ${name} artık bizim!`,
  journal: (name, price, quota) => `Kasaba genişledi: ${name} satın alındı (${price} altın, nüfus sınırı +${quota})`,
  toast: (name) => `${name} artık kasabanın!`,
  guide: 'Kasaban sıkıştı: kenardaki toprakları satın alabilirsin.',
  limitLine: ({ tier, parcels, total, cap }) => `Göç sınırı: ${tier} (seviye) + ${parcels} (parseller) = ${total}${total >= cap ? ` (en çok ${cap})` : ''}`,
  goal: { name: 'İlk Genişleme', description: 'Kasabanın çevresinden bir parsel satın al.' },
};
