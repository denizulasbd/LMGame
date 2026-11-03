// Kasabanın sesleri: oyun olaylarını SoundEngine'deki sentezlenmiş seslere bağlar (dosya yok).
//
//   Arayüz ve inşaat : düğme tıkırtısı, şantiye kurma gümbürtüsü, tamamlanma akoru, yıkım, günlük çanı
//   Sabah            : 06:00'da üç notalık sıcak bir melodi
//   Tüccar ve şenlik : tüccar çanı, takas sikkesi, şenlik boyunca hafif bir pentatonik ezgi
//   Ambiyans         : yağmurda pembe gürültü hışırtısı; gündüz ara sıra kuş cıvıltısı (kışın yok); ateşböceği
//                      gecelerinde cırcır böceği; kamera suya yaklaştıkça kahverengi gürültü su şırıltısı;
//                      kışın hafif rüzgâr uğultusu (kar yağarken güçlenir)
//   Mevsim ve ustalık: mevsim değişince yumuşak bir akor, bir sakin usta olunca kutlama ezgisi
//   10. aşama        : kamera bir koyun ağılına yakınken gündüz ara sıra meleyen koyunlar; kasaba seviye atlayınca
//                      büyük kutlama ezgisi; ilk yün / demir / ekmek çıkınca kısa bir başarı ezgisi
//
// 'ui:toggleMute' ile ses açılıp kapanır (tercih localStorage'da), 'audio:muteChanged' yayınlanır.
import { fireflyIntensity, isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';

const NOTE = { C4: 262, E4: 330, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047 };
const FESTIVAL_MELODY = ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'E5', 'G5', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5', null];
const FESTIVAL_STEP_SECONDS = 0.3;
const CHIME_COOLDOWN = 0.6;      // art arda gelen günlük kayıtları tek çan çalsın
const WATER_SAMPLE_SECONDS = 0.5;
const WATER_RADIUS_TILES = 6;    // kameranın ortasına bu kadar yakın su karoları duyulur
const SHEEP_HEARING_TILES = 10;  // kameranın ortası koyun ağılına bu kadar yakınsa meleme duyulur

export class AudioSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {() => { x: number, y: number }} getListener kameranın ortasının dünya koordinatı
   */
  constructor(game, world, getListener) {
    this.game = game;
    this.sound = game.sound;
    this.state = game.state;
    this.world = world;
    this.getListener = getListener;
    this.birdTimer = 3;
    this.cricketTimer = 1;
    this.festivalTimer = 0;
    this.festivalStep = 0;
    this.lastChime = -10;
    this.time = 0;
    this.waterTimer = 0;
    this.waterLevel = 0;
    this.sheepTimer = 4;

    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('ui:toggleMute', () => {
        this.sound.setMuted(!this.sound.muted);
        game.events.emit('audio:muteChanged', this.sound.muted);
      }),
      on('building:placed', () => this.playPlace()),
      on('building:completed', (building) => (building.type === 'monument' ? this.playGrandFanfare() : this.playComplete())),
      on('milestone:completed', () => this.playMilestone()),
      on('building:upgraded', () => this.playMastery()),
      on('ruin:restored', () => this.playGrandFanfare()),
      on('town:tierUp', () => this.playGrandFanfare()),
      on('civic:decreed', () => this.playGrandFanfare()),
      on('dilemma:opened', () => this.playBell()),
      on('storm:struck', ({ kind, safe }) => (kind === 'wolves' ? this.playHowl() : this.playThunder(safe))),
      on('pet:arrived', () => this.playChime()),
      on('health:fellIll', () => this.playSneeze()),
      on('health:cured', () => this.playMilestone()),
      on('expedition:returned', () => this.playFanfare()),
      on('goods:firstProduced', () => this.playMilestone()),
      on('relationship:married', () => this.playWedding()),
      on('relationship:partnered', () => this.playChime()),
      on('family:childBorn', () => this.playLullaby()),
      on('family:grownUp', () => this.playMilestone()),
      on('relationship:quarrel', () => this.playGrumble()),
      on('relationship:reconciled', () => this.playChime()),
      on('equipment:equipped', () => this.playCoin()),
      on('building:removed', () => this.playDemolish()),
      on('journal:added', () => this.playChime()),
      on('time:hour', (hour) => {
        if (hour === 6) this.playMorning();
      }),
      on('merchant:arrived', () => this.playBell()),
      on('trade:completed', () => this.playCoin()),
      on('festival:started', () => this.playFanfare()),
      on('time:seasonChanged', () => this.playSeasonChord()),
      on('skill:levelUp', ({ level }) => (level.level === 3 ? this.playMastery() : this.playChime())),
    ];
    // Arayüzdeki her düğmeye hafif bir tahta tıkırtısı
    this.onClick = (e) => {
      if (e.target.closest?.('#ui-layer button')) this.playClick();
    };
    document.addEventListener('click', this.onClick);
    game.events.emit('audio:muteChanged', this.sound.muted);
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    document.removeEventListener('click', this.onClick);
    this.sound.silenceLoops();
  }

  // ---------------------------------------------------------------------------
  // Ambiyans (gerçek zamanla, her karede)
  // ---------------------------------------------------------------------------

  update(dt, hour) {
    this.time += dt;
    const sound = this.sound;
    if (!sound.ctx) return;
    sound.loop('rain', { color: 'pink', filters: [{ type: 'highpass', freq: 400 }, { type: 'lowpass', freq: 2600 }] });
    sound.loop('water', { color: 'brown', filters: [{ type: 'bandpass', freq: 520, q: 0.9 }], wobble: { rate: 0.35, depth: 180 } });

    sound.loop('wind', { color: 'white', filters: [{ type: 'bandpass', freq: 600, q: 0.6 }], wobble: { rate: 0.12, depth: 260 } });
    const weather = this.state.weather;
    const season = getSeason(this.state.time.day);
    // Kışın yağış kar: yağmur hışırtısı yerine rüzgâr uğultusu
    sound.setLoopLevel('rain', season.cold ? 0 : weather.rain * 0.55);
    sound.setLoopLevel('wind', season.cold ? 0.05 + weather.rain * 0.12 : 0);

    this.waterTimer -= dt;
    if (this.waterTimer <= 0) {
      this.waterTimer = WATER_SAMPLE_SECONDS;
      this.waterLevel = this.sampleWater();
    }
    sound.setLoopLevel('water', this.waterLevel * 0.9);

    const raining = isRainActive(weather);
    const daytime = hour >= 6.5 && hour < 18.5;
    if (daytime && !raining && season.birds) {
      this.birdTimer -= dt;
      if (this.birdTimer <= 0) {
        this.playBirds();
        this.birdTimer = 4 + Math.random() * 9;
      }
    }
    // Ağıldaki koyunlar gündüz ara sıra meler (kamera yakınsa, yakınlığa göre yüksek sesle)
    if (hour >= 6 && hour < 20.5) {
      this.sheepTimer -= dt;
      if (this.sheepTimer <= 0) {
        const near = this.sheepProximity();
        if (near > 0) this.playBleat(near);
        this.sheepTimer = 5 + Math.random() * 9;
      }
    }
    if (fireflyIntensity(weather, hour) * season.fireflies > 0.2) {
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.playCrickets();
        this.cricketTimer = 0.6 + Math.random() * 1.4;
      }
    }
    if (this.state.events.festival.active) {
      this.festivalTimer -= dt;
      if (this.festivalTimer <= 0) {
        this.playFestivalStep();
        this.festivalTimer = FESTIVAL_STEP_SECONDS;
      }
    }
  }

  /** Kameranın ortasına en yakın koyun ağılının yakınlığı (0: duyulmaz, 1: tam önünde). */
  sheepProximity() {
    const center = this.getListener();
    let best = 0;
    for (const farm of this.world.getCompleted('sheepFarm')) {
      const d = Math.hypot(farm.center.x - center.x, farm.center.y - center.y) / 16;
      best = Math.max(best, 1 - d / SHEEP_HEARING_TILES);
    }
    return best;
  }

  /** Kameranın ortasına yakın su karolarının oranı (0-1); yakın olanlar daha çok sayılır. */
  sampleWater() {
    const center = this.getListener();
    const map = this.world.map;
    const cx = Math.floor(center.x / 16);
    const cy = Math.floor(center.y / 16);
    let weight = 0;
    let total = 0;
    for (let y = cy - WATER_RADIUS_TILES; y <= cy + WATER_RADIUS_TILES; y++) {
      for (let x = cx - WATER_RADIUS_TILES; x <= cx + WATER_RADIUS_TILES; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > WATER_RADIUS_TILES) continue;
        const w = 1 - d / (WATER_RADIUS_TILES + 1);
        total += w;
        if (map.get(x, y) === 'water') weight += w;
      }
    }
    return total > 0 ? Math.min(1, (weight / total) * 3) : 0;
  }

  // ---------------------------------------------------------------------------
  // Sesler
  // ---------------------------------------------------------------------------

  playClick() {
    this.sound.noise({ filter: 'bandpass', freq: 2200, q: 4, duration: 0.035, volume: 0.12 });
    this.sound.tone({ freq: 900, to: 600, type: 'triangle', duration: 0.04, volume: 0.05 });
  }

  playPlace() {
    this.sound.noise({ color: 'brown', filter: 'lowpass', freq: 500, duration: 0.18, volume: 0.35 });
    this.sound.tone({ freq: 160, to: 90, duration: 0.16, volume: 0.18 });
    this.sound.noise({ color: 'brown', filter: 'lowpass', freq: 400, duration: 0.14, volume: 0.25, delay: 0.1 });
  }

  playComplete() {
    this.lastChime = this.time; // aynı anda gelen günlük kaydı çanı üst üste binmesin
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: i === 3 ? 0.5 : 0.2, volume: 0.08, delay: i * 0.09 })
    );
  }

  playDemolish() {
    this.sound.noise({ color: 'brown', filter: 'lowpass', freq: 900, to: 180, duration: 0.5, volume: 0.4 });
    this.sound.tone({ freq: 110, to: 55, type: 'square', duration: 0.3, volume: 0.03 });
  }

  playChime() {
    if (this.time - this.lastChime < CHIME_COOLDOWN) return;
    this.lastChime = this.time;
    this.sound.tone({ freq: NOTE.C6, duration: 0.45, volume: 0.04 });
    this.sound.tone({ freq: 1568, duration: 0.55, volume: 0.03, delay: 0.08 });
  }

  playMorning() {
    ['G4', 'B4', 'D5'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], duration: 0.8, attack: 0.06, volume: 0.07, delay: i * 0.28 })
    );
    this.sound.tone({ freq: NOTE.G4 / 2, duration: 1.6, attack: 0.2, volume: 0.04 });
  }

  playBell() {
    this.lastChime = this.time; // aynı anda gelen günlük kaydı çanı üst üste binmesin
    this.sound.tone({ freq: NOTE.A5, type: 'triangle', duration: 0.9, volume: 0.06 });
    this.sound.tone({ freq: NOTE.A5 * 1.5, duration: 0.7, volume: 0.03, delay: 0.02 });
    this.sound.tone({ freq: NOTE.E5, type: 'triangle', duration: 0.9, volume: 0.05, delay: 0.25 });
  }

  playCoin() {
    this.lastChime = this.time; // aynı anda gelen günlük kaydı çanı üst üste binmesin
    this.sound.tone({ freq: 988, type: 'square', duration: 0.06, volume: 0.035 });
    this.sound.tone({ freq: 1319, type: 'square', duration: 0.16, volume: 0.035, delay: 0.07 });
  }

  playFanfare() {
    this.lastChime = this.time; // aynı anda gelen günlük kaydı çanı üst üste binmesin
    ['C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: 0.18, volume: 0.07, delay: i * 0.1 })
    );
  }

  /** Hedef tamamlandı: parlak, yükselen kısa bir ezgi. */
  playMilestone() {
    this.lastChime = this.time;
    ['E5', 'G5', 'C6'].forEach((n, i) => this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: i === 2 ? 0.5 : 0.14, volume: 0.07, delay: 0.25 + i * 0.1 }));
  }

  /** Anıt tamamlandı: büyük kutlama ezgisi (melodi + bas + parıltı). */
  playGrandFanfare() {
    this.lastChime = this.time;
    const melody = ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E5', 'G5', 'C6'];
    melody.forEach((n, i) => this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: i === melody.length - 1 ? 1.2 : 0.2, volume: 0.08, delay: i * 0.15 }));
    [0, 0.6, 1.2].forEach((d, i) => this.sound.tone({ freq: [NOTE.C4 / 2, NOTE.G4 / 2, NOTE.C4 / 2][i], duration: 0.6, volume: 0.06, delay: d }));
    for (let i = 0; i < 6; i++) this.sound.tone({ freq: 2093 + i * 220, duration: 0.15, volume: 0.02, delay: 1.3 + i * 0.07 });
  }

  /** Düğün: çan, ardından neşeli kısa bir ezgi. */
  playWedding() {
    this.lastChime = this.time;
    [0, 0.45].forEach((d) => {
      this.sound.tone({ freq: NOTE.A5, type: 'triangle', duration: 0.9, volume: 0.06, delay: d });
      this.sound.tone({ freq: NOTE.A5 * 1.5, duration: 0.7, volume: 0.025, delay: d + 0.02 });
    });
    ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: i === 7 ? 0.7 : 0.16, volume: 0.06, delay: 0.9 + i * 0.13 })
    );
  }

  /** Aileye çocuk katıldı: yumuşak, yavaş bir ninni. */
  playLullaby() {
    this.lastChime = this.time;
    ['E5', 'G5', 'E5', 'C5', 'D5', 'C5'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], duration: 0.45, attack: 0.05, volume: 0.05, delay: i * 0.32 })
    );
  }

  /** Atışma: kısa, alçak bir homurtu. */
  playGrumble() {
    if (this.time - this.lastChime < CHIME_COOLDOWN) return;
    this.lastChime = this.time;
    this.sound.tone({ freq: 180, to: 130, type: 'square', duration: 0.12, volume: 0.025 });
    this.sound.tone({ freq: 160, to: 110, type: 'square', duration: 0.14, volume: 0.025, delay: 0.16 });
  }

  playSeasonChord() {
    this.lastChime = this.time;
    ['C4', 'G4', 'C5', 'E5'].forEach((n, i) => this.sound.tone({ freq: NOTE[n], duration: 1.4, attack: 0.15, volume: 0.045, delay: i * 0.12 }));
  }

  playMastery() {
    this.lastChime = this.time;
    ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) =>
      this.sound.tone({ freq: NOTE[n], type: 'triangle', duration: i === 6 ? 0.6 : 0.15, volume: 0.07, delay: i * 0.09 })
    );
  }

  playBirds() {
    const base = 2600 + Math.random() * 900;
    const chirps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chirps; i++) {
      this.sound.tone({ freq: base, to: base * 1.35, duration: 0.07, volume: 0.025, delay: i * 0.11, vibrato: 60 });
    }
  }

  /** "Meee": titreşimli, genizden gelen kısa meleme; kuzu daha ince sesle karşılık verebilir. */
  playBleat(proximity) {
    const volume = 0.05 * proximity;
    const base = 330 + Math.random() * 90;
    this.sound.tone({ freq: base, to: base * 0.86, type: 'triangle', duration: 0.55, attack: 0.04, volume, vibrato: 22 });
    this.sound.tone({ freq: base * 2, to: base * 1.7, type: 'square', duration: 0.5, attack: 0.04, volume: volume * 0.12, vibrato: 30 });
    if (Math.random() < 0.35) {
      const lamb = base * 1.6;
      this.sound.tone({ freq: lamb, to: lamb * 0.9, type: 'triangle', duration: 0.35, attack: 0.03, volume: volume * 0.7, delay: 0.75, vibrato: 30 });
    }
  }

  /** Hapşırma: kısa, genizden bir nefes ve patlama. */
  playSneeze() {
    this.sound.noise({ filter: 'bandpass', freq: 2400, q: 1.5, duration: 0.12, volume: 0.05, attack: 0.08 });
    this.sound.noise({ filter: 'highpass', freq: 3000, duration: 0.18, volume: 0.09, delay: 0.16 });
  }

  /** Gök gürültüsü (güçlendirilmiş kasabada daha uzak ve boğuk). */
  playThunder(far) {
    this.sound.noise({ color: 'brown', filter: 'lowpass', freq: far ? 300 : 700, to: 90, duration: 1.6, volume: far ? 0.25 : 0.45, attack: 0.02 });
    this.sound.noise({ color: 'brown', filter: 'lowpass', freq: 200, duration: 1.2, volume: 0.2, delay: 0.5 });
  }

  /** Uzaktan kurt uluması. */
  playHowl() {
    this.sound.tone({ freq: 420, to: 620, type: 'sine', duration: 0.6, attack: 0.25, volume: 0.05, vibrato: 8 });
    this.sound.tone({ freq: 620, to: 380, type: 'sine', duration: 1.1, attack: 0.05, volume: 0.05, delay: 0.6, vibrato: 10 });
  }

  playCrickets() {
    const freq = 4200 + Math.random() * 400;
    for (let i = 0; i < 4; i++) this.sound.tone({ freq, duration: 0.03, volume: 0.012, delay: i * 0.045 });
  }

  playFestivalStep() {
    const note = FESTIVAL_MELODY[this.festivalStep % FESTIVAL_MELODY.length];
    if (note) this.sound.tone({ freq: NOTE[note], type: 'triangle', duration: 0.24, volume: 0.035 });
    if (this.festivalStep % 4 === 0) this.sound.tone({ freq: NOTE.C4 / (this.festivalStep % 8 === 0 ? 2 : 1.5), duration: 0.3, volume: 0.04 });
    this.festivalStep++;
  }
}
