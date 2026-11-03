// Hava durumu verileri (kurallar src/systems/WeatherSystem.js'te, çizim src/rendering/).
//
//   cloud / rain : hedef bulutluluk ve yağmur şiddeti (0-1); değerler yumuşakça bu hedefe yaklaşır
//   next         : bir sonraki değişimde hangi havaların hangi ağırlıkla seçileceği
// 14. aşama — nadir hava olayları (WEATHER_SPECIALS ile belli saatte zar atılarak başlar, normal sırada seçilmez):
//   mist         : sis yoğunluğu (0-1); sabah sisi haritayı kaplar, nehrin üstünde süzülür
//   downpour     : yağmur damlası yoğunluğu çarpanı (bardaktan boşanırcasına)
//   thunder      : şimşek çakar ve gök gürler (yalnızca görüntü ve ses)
//   durationHours: [en az, en çok] süresi (oyun saati); funDecay: dışarıdakilerin keyif azalma çarpanı
//
// Gece ateşböcekleri ayrı bir hava türü değildir: açık (güneşli) bir gece FIREFLY_NIGHT
// saatlerine denk gelirse arayüz ve atmosfer onu "Ateşböcekleri" olarak gösterir.
export const WEATHER_TYPES = {
  sunny: {
    name: 'Güneşli',
    icon: 'sun',
    cloud: 0,
    rain: 0,
    next: { sunny: 0.4, cloudy: 0.45, rainy: 0.15 },
  },
  cloudy: {
    name: 'Bulutlu',
    icon: 'cloud',
    cloud: 0.7,
    rain: 0,
    next: { sunny: 0.35, cloudy: 0.2, rainy: 0.45 },
  },
  rainy: {
    name: 'Yağmurlu',
    icon: 'rain',
    cloud: 1,
    rain: 1,
    next: { sunny: 0.3, cloudy: 0.5, rainy: 0.2 },
  },
  mist: {
    name: 'Sabah Sisi',
    icon: 'mist',
    cloud: 0.2,
    rain: 0,
    mist: 1,
    durationHours: [2.5, 4.5],
    funDecay: 0.8, // sisli sabah dinlendirir: dışarıdakilerin keyfi yavaş düşer
    next: { sunny: 0.75, cloudy: 0.25 },
  },
  thunderstorm: {
    name: 'Gök Gürültülü Fırtına',
    icon: 'thunder',
    cloud: 1,
    rain: 1,
    downpour: 2.2,
    thunder: true,
    durationHours: [1.5, 2.5],
    next: { cloudy: 0.6, sunny: 0.4 },
  },
};

// Nadir hava olaylarının zarı: her gün rollHour'da, bu mevsimlerde bu olasılıkla ve şu an from havalarından biri
// sürüyorsa başlar (ilkbahar / sonbahar sabahları sis, yaz öğleden sonraları kısa gök gürültülü fırtına)
export const WEATHER_SPECIALS = {
  mist: { rollHour: 5, seasons: { spring: 0.4, autumn: 0.18 }, from: ['sunny', 'cloudy'] },
  thunderstorm: { rollHour: 14, seasons: { summer: 0.3 }, from: ['sunny', 'cloudy'] },
};

export const STARTING_WEATHER = 'sunny';

// Hava değişimi günde bir iki kez olur: iki değişim arası bu kadar oyun saati geçer
export const WEATHER_TIMING = {
  minHoursBetween: 9,
  maxHoursBetween: 17,
  transitionMinutes: 45, // bulut ve yağmurun hedefe yumuşakça ulaşma süresi
};

// Ateşböcekleri bu saatler arasında (gece yarısını geçer) açık havada belirir; kenarlarda yavaşça solar
export const FIREFLY_NIGHT = { from: 20, to: 4, fadeHours: 0.5 };

// Yağmurun kasaba üzerindeki etkileri
export const RAIN_EFFECTS = {
  activeThreshold: 0.5,       // yağmur şiddeti bu değeri aşınca etkiler başlar
  growthMultiplier: 2,        // kütük ve fidanlar iki kat hızlı büyür
  funDecayMultiplier: 1.7,    // dışarıdaki sakinlerin keyfi bu kat hızlı düşer (Doğa Sever hariç)
  rainLoverFunPerMinute: 0.05, // yağmuru seven sakinlerin dışarıda dakikada kazandığı keyif
};

/** Yağmurun etkilerinin geçerli olup olmadığı. */
export function isRainActive(weather) {
  return Boolean(weather) && weather.rain >= RAIN_EFFECTS.activeThreshold;
}

/** Saat, açık gece penceresinin ne kadarında? 0 = dışında, 1 = tam içinde (kenarlarda yumuşak geçiş). */
export function fireflyHourFactor(hour) {
  const { from, to, fadeHours } = FIREFLY_NIGHT;
  const h = ((hour % 24) + 24) % 24;
  const inside = h >= from || h < to;
  if (!inside) return 0;
  const sinceStart = h >= from ? h - from : h + 24 - from;
  const untilEnd = h < to ? to - h : to + 24 - h;
  return Math.min(1, sinceStart / fadeHours, untilEnd / fadeHours);
}

/** Ateşböceklerinin görünürlüğü 0-1: açık gece ve gökyüzü bulutlanmamışsa. */
export function fireflyIntensity(weather, hour) {
  if (!weather || weather.type !== 'sunny') return 0;
  return fireflyHourFactor(hour) * Math.max(0, 1 - weather.cloud * 2);
}

/** Arayüzde gösterilecek hava: { key, name, icon }. Kışın yağış kar olarak gösterilir. */
export function describeWeather(weather, hour, season = 'summer') {
  if (season === 'winter' && weather.type === 'rainy') return { key: 'snowy', name: 'Karlı', icon: 'snow' };
  if (weather.type === 'sunny' && fireflyIntensity(weather, hour) > 0.05) {
    return { key: 'fireflies', name: 'Ateşböcekleri', icon: 'firefly' };
  }
  const def = WEATHER_TYPES[weather.type] ?? WEATHER_TYPES.sunny;
  return { key: weather.type, name: def.name, icon: def.icon };
}
