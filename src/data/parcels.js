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

// Kilitli alanın çizimi
export const LOCKED_VIEW = {
  fog: 'rgba(214, 222, 230, 0.55)', // soluk, sisli örtü
  border: 'rgba(255, 246, 214, 0.9)', // açık alanın kenarındaki ince çizgi
  cameraMargin: 6,                    // kamera açık alanın bu kadar karo ötesini gösterir
};

// Metinler
export const PARCEL_TEXT = {
  locked: 'Bu toprak henüz kasabanın değil',
};
