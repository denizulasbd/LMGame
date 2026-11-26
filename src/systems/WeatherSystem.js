// Hava durumu: güneşli, bulutlu ve yağmurlu arasında günde bir iki kez, yumuşak geçişlerle değişir.
//
//   state.weather.type          : hedef hava (WEATHER_TYPES anahtarı)
//   state.weather.cloud / rain  : o an görünen bulutluluk ve yağmur şiddeti (0-1); hedefe doğru süzülür
//   state.weather.nextChangeAt  : bir sonraki değişimin oyun dakikası
//
// Seçim, tohuma ve değişim sayısına bağlı sabit bir rastgelelikle yapılır; böylece kayıttan
// yüklenince aynı hava dizisi devam eder. Yayınladığı olay: 'weather:changed' { type, previous }.
// Etkileri (bahçe verimi, büyüme hızı, keyif) ilgili sistemler isRainActive() ile kendisi okur.
// (14. aşama) Nadir hava olayları: her gün belli saatte (data/weather.js -> WEATHER_SPECIALS) mevsime göre zar atılır;
// tutarsa ilkbahar / sonbahar sabahı sis ya da yaz öğleden sonrası kısa gök gürültülü fırtına başlar ve kendi süresi
// (durationHours) bitince normal sıraya döner. state.weather.mist sisin görünen yoğunluğudur.
import { WEATHER_TYPES, WEATHER_TIMING, WEATHER_SPECIALS } from '../data/weather.js';
import { Random } from '../utils/random.js';
import { getSeason } from '../data/seasons.js';
import { approach } from '../utils/math.js';
import { lifeSeedOf } from '../utils/lifeSeed.js';

export class WeatherSystem {
  /** @param {import('../core/Game.js').Game} game */
  constructor(game) {
    this.state = game.state;
    this.events = game.events;
    if (this.state.weather.nextChangeAt === null) this.scheduleNext();
    if (!WEATHER_TYPES[this.state.weather.type]) this.state.weather.type = 'sunny';
    this.unsubscribe = game.events.on('time:hour', (hour) => this.rollSpecial(hour));
  }

  destroy() {
    this.unsubscribe();
  }

  /** Günün belli saatinde nadir hava olayı zarı (aynı tohum ve gün aynı sonucu verir). */
  rollSpecial(hour) {
    const season = getSeason(this.state.time.day).key;
    for (const [type, spec] of Object.entries(WEATHER_SPECIALS)) {
      if (hour !== spec.rollHour || !spec.from.includes(this.weather.type)) continue;
      const chance = spec.seasons[season] ?? 0;
      const rng = new Random(lifeSeedOf(this.state) * 13 + this.state.time.day * 101 + spec.rollHour);
      if (chance > 0 && rng.next() < chance) {
        this.force(type);
        return type;
      }
    }
    return null;
  }

  get weather() {
    return this.state.weather;
  }

  /** Değişim sayısına bağlı, kayıttan sonra da aynı sonucu veren rastgelelik. */
  rngFor(salt) {
    return new Random(lifeSeedOf(this.state) * 31 + this.weather.changes * 7919 + salt);
  }

  scheduleNext() {
    // Nadir olaylar kendi sürelerince, diğerleri 9-17 saat sürer
    const [min, max] = WEATHER_TYPES[this.weather.type]?.durationHours ?? [WEATHER_TIMING.minHoursBetween, WEATHER_TIMING.maxHoursBetween];
    const hours = this.rngFor(1).int(min * 10, max * 10) / 10;
    this.weather.nextChangeAt = this.state.totalMinutes + Math.round(hours * 60);
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const weather = this.weather;
    if (this.state.totalMinutes >= weather.nextChangeAt) this.changeWeather();

    const target = WEATHER_TYPES[weather.type];
    const step = tick.gameMinutes / WEATHER_TIMING.transitionMinutes;
    weather.cloud = approach(weather.cloud, target.cloud, step);
    weather.rain = approach(weather.rain, target.rain, step);
    weather.mist = approach(weather.mist ?? 0, target.mist ?? 0, step);
  }

  changeWeather() {
    const weather = this.weather;
    const previous = weather.type;
    // Mevsim ağırlıkları: yazın daha az yağmur, sonbaharda daha çok, kışın yağış kar olur
    const seasonal = getSeason(this.state.time.day).weather;
    const options = Object.entries(WEATHER_TYPES[previous].next).map(([type, w]) => [type, w * (seasonal[type] ?? 1)]);
    weather.type = this.rngFor(2).weighted(options);
    weather.changes++;
    this.scheduleNext();
    if (weather.type !== previous) this.events.emit('weather:changed', { type: weather.type, previous });
  }

  /** Hata ayıklama / test için havayı hemen değiştirir. */
  force(type) {
    const previous = this.weather.type;
    this.weather.type = type;
    this.weather.changes++;
    this.scheduleNext();
    if (type !== previous) this.events.emit('weather:changed', { type, previous });
  }
}
