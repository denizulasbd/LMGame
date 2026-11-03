// Web Audio API ile ses sentezi (oyundan bağımsız; hiçbir ses dosyası kullanmaz).
//
//   tone(...)       : tek nota (osilatör + zarf), isteğe bağlı frekans kayması ve gecikme
//   noise(...)      : filtrelenmiş kısa gürültü patlaması (tıkırtı, gümbürtü, sıçrama)
//   loop(name, ...) : sürekli çalan gürültü katmanı (yağmur, su); setLoopLevel ile yumuşakça açılıp kapanır
//
// Tarayıcılar sesi ancak bir kullanıcı etkileşiminden sonra başlatmaya izin verir: motor ilk tıklama
// ya da tuşa basışta kendini açar, o zamana kadar gelen sesleri sessizce yok sayar.
// Sessiz tercihi verilen anahtarla localStorage'da hatırlanır.

const NOISE_SECONDS = 2;
const MUTE_FADE_SECONDS = 0.25; // ses kapanırken / açılırken kazancın yumuşak geçişi (ani kesilme tık sesi yapar)

export class SoundEngine {
  /** @param {{ storageKey?: string, volume?: number }} options */
  constructor({ storageKey = null, volume = 0.5 } = {}) {
    this.storageKey = storageKey;
    this.volume = volume;
    this.ctx = null;
    this.master = null;
    this.buffers = {};
    this.loops = new Map();
    this.muted = this.readMuted();
    this.suspendTimer = null;

    this.unlock = () => this.start();
    window.addEventListener('pointerdown', this.unlock);
    window.addEventListener('keydown', this.unlock);
  }

  get ready() {
    return this.ctx !== null && this.ctx.state === 'running' && !this.muted;
  }

  /**
   * İlk kullanıcı etkileşiminde ses bağlamını kurar / sürdürür. Ses kapalıyken bağlam hiç kurulmaz (ya da askıda
   * kalır): sessizde Web Audio düğümleri işlemci harcamaz; ses açılınca (o tıklamanın içinde) kurulur.
   */
  start() {
    if (this.muted) return;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    const release = () => {
      if (this.ctx?.state !== 'running') return;
      window.removeEventListener('pointerdown', this.unlock);
      window.removeEventListener('keydown', this.unlock);
    };
    if (this.ctx.state === 'suspended') this.ctx.resume().then(release, () => {});
    release();
  }

  readMuted() {
    if (!this.storageKey) return false;
    try {
      return localStorage.getItem(this.storageKey) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Sesi kapatır / açar. Kapatınca ana kazanç yumuşakça 0'a iner, ardından bağlam askıya alınır (döngüler ve LFO'lar
   * durur, işlemci harcanmaz). Açınca bağlam sürdürülür ve kazanç 0'dan yumuşakça yükselir (cızırtı / tık olmaz).
   */
  setMuted(muted) {
    this.muted = muted;
    try {
      if (this.storageKey) localStorage.setItem(this.storageKey, muted ? '1' : '0');
    } catch {
      /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
    }
    clearTimeout(this.suspendTimer);
    if (!this.ctx) {
      if (!muted) this.start(); // sessiz başlanmıştı: bağlam bu tıklamayla kurulur
      return;
    }
    const gain = this.master.gain;
    const hold = () => {
      const now = this.ctx.currentTime;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      return now;
    };
    if (muted) {
      gain.setTargetAtTime(0, hold(), MUTE_FADE_SECONDS / 4);
      this.suspendTimer = setTimeout(() => {
        if (this.muted && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
      }, MUTE_FADE_SECONDS * 1000 + 100);
      return;
    }
    const fadeIn = () => {
      if (this.muted) return;
      const now = this.ctx.currentTime;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(Math.min(gain.value, 0.0001), now);
      gain.setTargetAtTime(this.volume, now, MUTE_FADE_SECONDS / 4);
    };
    if (this.ctx.state === 'suspended') this.ctx.resume().then(fadeIn, () => {});
    else fadeIn();
  }

  /** Bağlam o an gerçekten ses işliyor mu (sessizde askıya alınmış olmalı)? */
  get processing() {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  // ---------------------------------------------------------------------------
  // Tek seferlik sesler
  // ---------------------------------------------------------------------------

  /**
   * @param {{ freq: number, to?: number, type?: OscillatorType, duration?: number, attack?: number,
   *   volume?: number, delay?: number, vibrato?: number }} p
   */
  tone({ freq, to = null, type = 'sine', duration = 0.2, attack = 0.01, volume = 0.2, delay = 0, vibrato = 0 }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 18;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + duration + 0.05);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /**
   * @param {{ color?: 'white'|'pink'|'brown', duration?: number, filter?: BiquadFilterType, freq?: number,
   *   to?: number, q?: number, volume?: number, attack?: number, delay?: number }} p
   */
  noise({ color = 'white', duration = 0.1, filter = 'bandpass', freq = 1000, to = null, q = 1, volume = 0.2, attack = 0.005, delay = 0 }) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(color);
    const biquad = ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.setValueAtTime(freq, t0);
    if (to) biquad.frequency.exponentialRampToValueAtTime(to, t0 + duration);
    biquad.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    source.connect(biquad).connect(gain).connect(this.master);
    source.start(t0, Math.random() * Math.max(0, NOISE_SECONDS - duration - 0.05));
    source.stop(t0 + duration + 0.05);
  }

  // ---------------------------------------------------------------------------
  // Sürekli katmanlar (ambiyans)
  // ---------------------------------------------------------------------------

  /**
   * Adlandırılmış sürekli gürültü katmanı oluşturur (yoksa); seviyesi 0'dan başlar.
   * @param {string} name
   * @param {{ color?: string, filters?: {type: BiquadFilterType, freq: number, q?: number}[], wobble?: {rate: number, depth: number} }} p
   *   wobble: filtre frekansını yavaşça dalgalandıran LFO (su şırıltısı gibi)
   */
  loop(name, { color = 'pink', filters = [], wobble = null } = {}) {
    if (!this.ctx || this.loops.has(name)) return;
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(color);
    source.loop = true;
    let node = source;
    const biquads = filters.map(({ type, freq, q = 0.7 }) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      node.connect(f);
      node = f;
      return f;
    });
    if (wobble && biquads.length > 0) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = wobble.rate;
      depth.gain.value = wobble.depth;
      lfo.connect(depth).connect(biquads[biquads.length - 1].frequency);
      lfo.start();
    }
    const gain = ctx.createGain();
    gain.gain.value = 0;
    node.connect(gain).connect(this.master);
    source.start();
    this.loops.set(name, { gain, level: 0 });
  }

  /** Katmanın seviyesini (0-1 arası ses yüksekliği) yumuşakça değiştirir. */
  setLoopLevel(name, level, seconds = 1.5) {
    const loop = this.loops.get(name);
    if (!loop || Math.abs(loop.level - level) < 0.002) return;
    loop.level = level;
    loop.gain.gain.setTargetAtTime(level, this.ctx.currentTime, seconds / 3);
  }

  /** Tüm sürekli katmanları susturur (sahne değişirken). */
  silenceLoops() {
    for (const name of this.loops.keys()) this.setLoopLevel(name, 0, 0.5);
  }

  /** Beyaz / pembe / kahverengi gürültü tamponu (önbellekli). */
  noiseBuffer(color) {
    if (this.buffers[color]) return this.buffers[color];
    const length = Math.floor(this.ctx.sampleRate * NOISE_SECONDS);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'pink') {
        // Paul Kellet'in basitleştirilmiş pembe gürültü filtresi
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      } else if (color === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    this.buffers[color] = buffer;
    return buffer;
  }
}
