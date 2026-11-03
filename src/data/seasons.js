// Mevsimler: 4 mevsim, her biri CONFIG.DAYS_PER_SEASON gün (varsayılan 4; yıl = 16 gün).
// Oyun 1. gün ilkbaharda başlar. Mevsim kaydedilmez, oyun gününden hesaplanır.
//
//   farm        : sebze bahçesi üretim çarpanı (kışın 0 = tarla donar)
//   fishing     : balıkçı iskelesi üretim çarpanı (kışın buzlu suda %75)
//   lumber      : oduncu kulübesi üretim çarpanı (kışın karda %45)
//   pasture     : koyun ağılı üretim çarpanı (10. aşama: ilkbaharda kırkım bereketi, kışın ahırda az yün)
//   berries     : böğürtlen çalısının yenilenme ve toplama verimi çarpanı (kışın 0 = donar)
//   growth      : kütük / fidan büyüme çarpanı
//   cold        : kış: ısınma için odun yakılır, dışarıdakiler üşür
//   weather     : hava geçiş ağırlıklarının çarpanı (yazın az, sonbaharda çok yağmur; kışın kar)
//   fireflies   : gece ateşböceği yoğunluğu (0-1)
//   birds       : gündüz kuş sesi
//   butterflies : çiçek tarhında kelebek
//   leisure     : boş zaman tercih çarpanları (kışın nehir kenarı yerine ateş ve han)
//   tint        : gündüz ekrana eklenen hafif mevsim ışığı { r, g, b, a }
import { CONFIG } from '../config.js';

export const SEASONS = [
  {
    key: 'spring',
    name: 'İlkbahar',
    icon: 'spring',
    farm: 1,
    fishing: 1,
    lumber: 1,
    pasture: 1.25, // kırkım mevsimi
    berries: 1,
    growth: 1.3,
    weather: { rainy: 1.1 },
    fireflies: 0.55,
    birds: true,
    butterflies: true,
    leisure: { flowers: 1.5 },
    tint: { r: 255, g: 235, b: 245, a: 0.03 },
    arrival: 'İlkbahar geldi: doğa uyanıyor, bahçeler yeniden yeşeriyor.',
  },
  {
    key: 'summer',
    name: 'Yaz',
    icon: 'summer',
    farm: 1,
    fishing: 1,
    lumber: 1,
    pasture: 1,
    berries: 1,
    growth: 1,
    weather: { rainy: 0.5, cloudy: 0.8 },
    fireflies: 1,
    birds: true,
    butterflies: true,
    leisure: { river: 1.5 },
    tint: { r: 255, g: 200, b: 120, a: 0.07 },
    arrival: 'Yaz geldi: güneş parlak, geceler ateşböcekleriyle dolu.',
  },
  {
    key: 'autumn',
    name: 'Sonbahar',
    icon: 'autumn',
    farm: 1.35,
    fishing: 1,
    lumber: 1,
    pasture: 1,
    berries: 1.35,
    growth: 0.8,
    weather: { rainy: 1.4, cloudy: 1.2 },
    fireflies: 0.25,
    birds: true,
    butterflies: true,
    leisure: {},
    tint: { r: 255, g: 175, b: 90, a: 0.06 },
    arrival: 'Sonbahar geldi: hasat zamanı! Kış için yiyecek ve odun biriktir.',
  },
  {
    key: 'winter',
    name: 'Kış',
    icon: 'winter',
    farm: 0,
    fishing: 0.75, // buzlu suda balık az
    lumber: 0.45, // karda ağaç kesmek zor
    pasture: 0.6, // koyunlar ahırda, samanla beslenir
    berries: 0,
    growth: 0,
    cold: true,
    weather: { rainy: 1.3, cloudy: 1.2 },
    fireflies: 0,
    birds: false,
    butterflies: false,
    leisure: { river: 0.3, flowers: 0, stroll: 0.5, campfire: 2.5, inn: 2 },
    tint: { r: 190, g: 210, b: 240, a: 0.09 },
    arrival: 'Kış geldi! Tarlalar dondu; evler ısınmak için odun yakacak.',
  },
];

export const SEASON_KEYS = SEASONS.map((s) => s.key);

/** Oyun gününün mevsimi: { ...mevsim, index, dayOfSeason (1..), year (1..) } */
export function getSeason(day) {
  const perSeason = CONFIG.DAYS_PER_SEASON;
  const dayIndex = Math.max(0, day - 1);
  const seasonIndex = Math.floor(dayIndex / perSeason) % SEASONS.length;
  return {
    ...SEASONS[seasonIndex],
    index: seasonIndex,
    dayOfSeason: (dayIndex % perSeason) + 1,
    daysInSeason: perSeason,
    year: Math.floor(dayIndex / (perSeason * SEASONS.length)) + 1,
  };
}

// Kış ısınması: dakika yerine gün başına odun; her kaynak yandığı sürece yakar
export const HEATING = {
  homePerDay: 4,        // içinde sakin yaşayan her kulübe
  campfirePerDay: 3,    // yanan kamp ateşi (yalnızca yandığı saatlerde)
  innPerDay: 4,         // açık (ışıkları yanan) han
  warmRadius: 44,       // kamp ateşinin ısıttığı yarıçap (dünya pikseli)
  warmHours: 2,         // ısınan sakinin "İçi Isındı" bonusu süresi (oyun saati)
  winterGloom: 1.2,     // kışın dışarıdaki herkesin (içi ısınmış olsa da) keyif azalma çarpanı
  coldEnergy: 1.45,     // üşüyen sakinin enerji azalma çarpanı
  coldFun: 1.75,        // ve keyif azalma çarpanı
  // Odun bitince (ocaklar sönük) evde ya da dışarıda herkes donar:
  freezingFun: 8,       // keyif azalma çarpanı
  freezingEnergy: 2.6,  // enerji azalma çarpanı (soğuk evde iyi dinlenilmez)
  freezingHunger: 1.5,  // açlık azalma çarpanı (titreyen beden çabuk acıkır)
  freezingSocial: 1.6,  // sosyallik azalma çarpanı (herkes kendi köşesine büzülür)
  freezingRecovery: 0.35,// uyku ve eğlencenin keyif/enerji kazancı çarpanı (soğukta tam dinlenilmez)
  relightWood: 4,       // sönen ocakları yeniden yakmak için stokta gereken odun
};

// Gezgin tüccarın sonbahara özel teklifleri data/trade.js'te (seasons alanı)
