// Bilgelik Evi (12. aşama): kasaba araştırmaları (Ar-Ge) ve çocukların okulu. Mantık src/systems/ResearchSystem.js'te.
//
// Araştırma: oyuncu Bilgelik Evi'nin panelinden bir araştırma seçer, maliyeti peşin öder; Bilge (öğretmen) içeride
// çalıştıkça ilerleme (work, oyun dakikası × iş hızı) birikir, dolunca teknoloji kalıcı olarak kazanılır. Aynı anda
// tek araştırma yürür.
//   effect.production      : { types, multiplier } bu yapılarda üretim / işleme verimi çarpanı
//   effect.buildSpeed      : inşaat, yükseltme ve onarım hızı çarpanı
//   effect.stormResistance : fırtına / kurt hasarına direnç (2 = hasar alan yapı sayısı yarıya iner)
//   effect.healSpeed       : şifacıda tedavi ve iksir hazırlama hızı çarpanı; vigorHours: Dinçlik süresi
//   effect.heating         : evlerin kışlık odun tüketimi çarpanı
export const RESEARCH = {
  gears: {
    name: 'Gelişmiş Çarklar ve Vinçler',
    icon: 'gears',
    description: 'Dişli çarklar, makaralı vinçler ve su çarkları: Oduncu / Kereste Atölyesi, Taş Ocağı, Demir Madeni ve Yel Değirmeni +%20 üretir.',
    cost: { wood: 160, stone: 80, iron: 90 },
    work: 600,
    effect: { production: { types: ['lumberHut', 'quarry', 'ironMine', 'mill'], multiplier: 1.2 } },
  },
  architecture: {
    name: 'Mimarlık Loncası',
    icon: 'hammer',
    description: 'Kemer, kubbe ve kalıp bilgisi: tüm inşaat, yükseltme ve onarımlar %35 hızlı; yapılar fırtınaya iki kat dayanıklı.',
    cost: { wood: 160, stone: 220, iron: 50 },
    work: 700,
    effect: { buildSpeed: 1.35, stormResistance: 2 },
  },
  herbalism: {
    name: 'Şifalı Bitki Yetiştiriciliği',
    icon: 'herb',
    description: 'Kulübenin bahçesinde şifalı ot yetiştirilir: tedavi ve iksir hazırlama iki kat hızlı, Dinçlik 24 saat sürer.',
    cost: { wood: 80, wool: 60, bread: 90 },
    work: 500,
    effect: { healSpeed: 2, vigorHours: 24 },
  },
  insulation: {
    name: 'Kışlık Yalıtım Teknikleri',
    icon: 'wool',
    description: 'Keçe kaplama, çift cam ve kerpiç sıva: evlerin kışlık odun tüketimi %25 azalır.',
    cost: { wood: 140, stone: 90, wool: 120 },
    work: 550,
    effect: { heating: 0.75 },
  },
};
export const RESEARCH_KEYS = Object.keys(RESEARCH);

// Okul: çocuklar ders saatlerinde Bilgelik Evi'ne gidip ders dinler. Bilge içeride çalışıyorsa iki kat öğrenirler.
// graduateMinutes öğrenmeye ulaşan çocuk büyüyünce rastgele bir meslekte doğrudan Kalfa olarak başlar.
export const SCHOOL = {
  hours: { from: 9, to: 15 },
  minutesPerDay: 120, // bir çocuk günde en çok bu kadar ders dinler
  sageMultiplier: 2,
  graduateMinutes: 360,
};
