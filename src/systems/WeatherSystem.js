// Hava durumu: güneşli, bulutlu ve yağmurlu arasında günde bir iki kez, yumuşak geçişlerle değişir.
//
//   state.weather.type          : hedef hava (WEATHER_TYPES anahtarı)
//   state.weather.cloud / rain  : o an görünen bulutluluk ve yağmur şiddeti (0-1); hedefe doğru süzülür
//   state.weather.nextChangeAt  : bir sonraki değişimin oyun dakikası
//
// Seçim, tohuma ve değişim sayısına bağlı sabit bir rastgelelikle yapılır; böylece kayıttan
// yüklenince aynı hava dizisi devam eder. Yayınladığı olay: 'weather:changed' { type, previous }.
// Etkileri (bahçe verimi, büyüme hızı, keyif) ilgili sistemler isRainActive() ile kendisi okur.
import { WEATHER_TYPES, WEATHER_TIMING } from '../data/weather.js';
import { Random } from '../utils/random.js';
import { getSeason } from '../data/seasons.js';
import { approach } from '../utils/math.js';

export class WeatherSystem {
  /** @param {import('../core/Game.js').Game} game */
  constructor(game) {
    this.state = game.state;
    this.events = game.events;
    if (this.state.weather.nextChangeAt === null) this.scheduleNext();
  }

  destroy() {}

  get weather() {
    return this.state.weather;
  }

  /** Değişim sayısına bağlı, kayıttan sonra da aynı sonucu veren rastgelelik. */
  rngFor(salt) {
    return new Random(this.state.seed * 31 + this.weather.changes * 7919 + salt);
  }

  scheduleNext() {
    const hours = this.rngFor(1).int(WEATHER_TIMING.minHoursBetween * 10, WEATHER_TIMING.maxHoursBetween * 10) / 10;
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
