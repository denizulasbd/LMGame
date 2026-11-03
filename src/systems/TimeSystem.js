// Oyun saatini ilerletir. Dinlediği olaylar:
//   'time:togglePause'          -> durdur / devam
//   'time:setSpeed' (sayı)      -> hızı değiştirir ve duraklatmayı kaldırır
// Yayınladığı olaylar:
//   'time:hour'   (saat)  -> her oyun saati başında
//   'time:newDay' (gün)   -> her yeni günde
//   'time:seasonChanged' { season, previous } -> mevsim değişen günün başında (data/seasons.js)
//   'time:pauseChanged' (bool), 'time:speedChanged' (sayı)
import { CONFIG } from '../config.js';
import { getSeason } from '../data/seasons.js';

/** Saate göre gün evresi: arayüz ve atmosfer için. */
export function getDayPhase(hour) {
  if (hour < 5) return { key: 'night', name: 'Gece', icon: 'moon' };
  if (hour < 7) return { key: 'dawn', name: 'Şafak', icon: 'sunset' };
  if (hour < 12) return { key: 'morning', name: 'Sabah', icon: 'sun' };
  if (hour < 17) return { key: 'afternoon', name: 'Öğleden Sonra', icon: 'sun' };
  if (hour < 20) return { key: 'evening', name: 'Akşamüstü', icon: 'sunset' };
  return { key: 'night', name: 'Gece', icon: 'moon' };
}

export class TimeSystem {
  constructor(game) {
    this.game = game;
    this.elapsed = 0; // bir sonraki oyun dakikasına doğru biriken gerçek süre
    this.unsubscribers = [
      game.events.on('time:togglePause', () => this.setPaused(!game.state.time.paused)),
      game.events.on('time:setSpeed', (speed) => this.setSpeed(speed)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  setPaused(paused) {
    const time = this.game.state.time;
    if (time.paused === paused) return;
    time.paused = paused;
    this.game.events.emit('time:pauseChanged', paused);
  }

  setSpeed(speed) {
    if (!CONFIG.TIME_SPEEDS.includes(speed)) return;
    const time = this.game.state.time;
    this.setPaused(false);
    if (time.speed === speed) return;
    time.speed = speed;
    this.game.events.emit('time:speedChanged', speed);
  }

  update(dt) {
    const time = this.game.state.time;
    if (time.paused) return;

    this.elapsed += dt * time.speed;
    while (this.elapsed >= CONFIG.REAL_SECONDS_PER_GAME_MINUTE) {
      this.elapsed -= CONFIG.REAL_SECONDS_PER_GAME_MINUTE;
      this.advanceMinute(time);
    }
  }

  advanceMinute(time) {
    time.minute++;
    if (time.minute < 60) return;
    time.minute = 0;
    time.hour++;
    if (time.hour >= 24) {
      time.hour = 0;
      time.day++;
      this.game.events.emit('time:newDay', time.day);
      const season = getSeason(time.day);
      const previous = getSeason(time.day - 1);
      if (season.key !== previous.key) this.game.events.emit('time:seasonChanged', { season, previous });
    }
    this.game.events.emit('time:hour', time.hour);
  }

  /**
   * Diğer sistemlere verilen adım bilgisi:
   *   simDt       : oyun hızıyla çarpılmış süre (saniye); duraklatılmışsa 0
   *   gameMinutes : bu adımda geçen oyun dakikası (ondalıklı)
   *   hour        : ondalıklı saat
   */
  getTick(dt) {
    const { paused, speed } = this.game.state.time;
    const simDt = paused ? 0 : dt * speed;
    return {
      realDt: dt,
      simDt,
      gameMinutes: simDt / CONFIG.REAL_SECONDS_PER_GAME_MINUTE,
      hour: this.getHourFloat(),
    };
  }

  /** Dakikanın içindeki ilerlemeyi de içeren ondalıklı saat (ör. 18.42). Akıcı ışık geçişi için. */
  getHourFloat() {
    const { hour, minute } = this.game.state.time;
    const minuteFraction = this.elapsed / CONFIG.REAL_SECONDS_PER_GAME_MINUTE;
    return hour + (minute + minuteFraction) / 60;
  }
}
