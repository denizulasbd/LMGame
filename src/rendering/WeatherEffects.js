// Hava durumunun görünen yüzü (hiçbir oyun kuralı içermez; yalnızca state.weather'ı okur):
//   - drawGround : yağmurun yere ve suya bıraktığı sıçrama halkaları (dünya katmanı, nesnelerin altında)
//   - drawClouds : bulutların yere düşen yumuşak gölgeleri (dünya katmanı, gece örtüsünün altında)
//   - drawRain   : ekranda çapraz düşen piksel yağmur damlaları (ekran katmanı); kışın bunların
//                  yerine yavaşça salınarak süzülen lapa lapa kar taneleri çizilir
//   (14. aşama) drawMist  : sabah sisi: haritada yavaşça süzülen yumuşak beyaz şeritler, suyun üstünde daha yoğun
//               drawLightning: gök gürültülü fırtınada ekranda anlık beyaz şimşek parıltısı (çift çakma); şimşek
//               çaktığında takeLightning() true döner ve sahne gök gürültüsünü duyurur ('weather:lightning')
// Animasyon gerçek zamanla işler, oyun duraklasa da yağmur yağmaya devam eder.
import { CONFIG } from '../config.js';
import { WEATHER_TYPES } from '../data/weather.js';
import { Random } from '../utils/random.js';

const T = CONFIG.TILE_SIZE;

const DROP_DENSITY = 1 / 5200;         // tam yağmurda ekran pikseli başına damla
const DROP_SPEED = 430;                // ekran pikseli / saniye
const DROP_SLANT = 0.34;               // yatay / dikey hız oranı (sola doğru eğik)
const SNOW_SPEED = 46;                 // kar tanesi düşüş hızı (ekran pikseli / saniye)
const MAX_SPLASHES = 70;
const SPLASH_SECONDS = 0.55;
const SPLASHES_PER_SECOND = 46;        // tam yağmurda, görünür alanda
const SHADOW_COLOR = '18, 28, 56';

// Gölge bulutları: deterministik; dünya üstünde süzülür ve kenarlardan taşınca öbür uçtan girer
const CLOUD_COUNT = 11;
const CLOUD_SHAPE_SEED = 90210;
// Şimşek: iki çakma arası oyun dakikası (hızdan bağımsız: fırtına başına birkaç şimşek) ve parıltının sönme hızı
const LIGHTNING_GAP = [8, 20];
const FLASH_DECAY = 3.2;
// Sis şeritleri
const MIST_BANDS = 9;

export class WeatherEffects {
  constructor() {
    this.rng = new Random(CLOUD_SHAPE_SEED);
    this.drops = [];
    this.splashes = [];
    this.splashBudget = 0;
    this.flash = 0; // şimşek parıltısı 0-1
    this.lightningTimer = 3;
    this.lightningPending = false;
    this.clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
      x: this.rng.next(),                // dünya genişliğine oranla başlangıç
      y: this.rng.next(),
      rx: this.rng.int(34, 70),
      ry: this.rng.int(14, 26),
      speed: 3 + this.rng.next() * 3,    // piksel / saniye
      lobe: this.rng.next(),
      id: i,
    }));
  }

  /** Gerçek zaman adımı: damlaları ve sıçramaları ilerletir, yenilerini üretir. */
  update(dt, weather, camera, renderer, map, season = 'summer', gameMinutes = 0) {
    const rain = weather.rain;
    this.snowing = season === 'winter';
    const type = WEATHER_TYPES[weather.type] ?? {};
    const targetDrops = Math.round(renderer.width * renderer.height * DROP_DENSITY * rain * (type.downpour ?? 1));
    // Gök gürültülü fırtına: arada bir şimşek çakar
    this.flash = Math.max(0, this.flash - dt * FLASH_DECAY);
    if (type.thunder && rain > 0.6) {
      this.lightningTimer -= gameMinutes;
      if (this.lightningTimer <= 0) {
        this.flash = 1;
        this.lightningPending = true;
        this.lightningTimer = LIGHTNING_GAP[0] + Math.random() * (LIGHTNING_GAP[1] - LIGHTNING_GAP[0]);
      }
    }
    while (this.drops.length < targetDrops) this.drops.push(this.newDrop(renderer, true));
    if (this.drops.length > targetDrops) this.drops.length = targetDrops;

    const z = camera.zoom;
    for (const d of this.drops) {
      if (this.snowing) {
        // Kar: yavaş düşer, rüzgârda salınır
        d.y += SNOW_SPEED * d.speed * dt;
        d.x += (Math.sin(d.y * 0.02 + d.speed * 10) * 18 - 10) * dt;
      } else {
        d.y += DROP_SPEED * d.speed * dt;
        d.x -= DROP_SPEED * d.speed * DROP_SLANT * dt;
      }
      if (d.y > renderer.height + 8 * z || d.x < -8 * z) {
        Object.assign(d, this.newDrop(renderer, false));
      }
    }

    // Kar sıçratmaz; halkalar yalnızca yağmurda
    this.splashes = this.splashes.filter((s) => (s.age += dt) < SPLASH_SECONDS);
    this.splashBudget += this.snowing ? 0 : SPLASHES_PER_SECOND * rain * dt;
    while (this.splashBudget >= 1) {
      this.splashBudget -= 1;
      if (this.splashes.length < MAX_SPLASHES) this.spawnSplash(camera, renderer, map);
    }
  }

  newDrop(renderer, anywhere) {
    return {
      x: Math.random() * (renderer.width + renderer.height * DROP_SLANT),
      y: anywhere ? Math.random() * renderer.height : -8 * (1 + Math.random() * 6),
      speed: 0.85 + Math.random() * 0.4,
    };
  }

  /** Görünür alanda rastgele bir karoya sıçrama ekler; suya daha sık düşer. */
  spawnSplash(camera, renderer, map) {
    const view = camera.getViewBounds(renderer.width, renderer.height);
    const x0 = Math.max(0, Math.floor(view.left / T));
    const y0 = Math.max(0, Math.floor(view.top / T));
    const x1 = Math.min(map.width - 1, Math.floor(view.right / T));
    const y1 = Math.min(map.height - 1, Math.floor(view.bottom / T));
    if (x1 < x0 || y1 < y0) return;

    let tileX = 0;
    let tileY = 0;
    let onWater = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      tileX = x0 + Math.floor(Math.random() * (x1 - x0 + 1));
      tileY = y0 + Math.floor(Math.random() * (y1 - y0 + 1));
      onWater = map.get(tileX, tileY) === 'water';
      if (onWater) break;
    }
    this.splashes.push({
      x: tileX * T + 2 + Math.random() * (T - 4),
      y: tileY * T + 2 + Math.random() * (T - 4),
      age: 0,
      onWater,
    });
  }

  /** Su ve zemin üzerindeki küçük halkalar (dünya koordinatı). */
  drawGround(renderer) {
    for (const s of this.splashes) {
      const k = s.age / SPLASH_SECONDS;
      const frame = Math.min(3, Math.floor(k * 4));
      const alpha = Math.max(0, 1 - k) * (s.onWater ? 0.9 : 0.6);
      const color = s.onWater ? `rgba(238, 251, 255, ${alpha.toFixed(2)})` : `rgba(190, 225, 255, ${alpha.toFixed(2)})`;
      const cx = Math.round(s.x);
      const cy = Math.round(s.y);
      if (frame === 0) {
        renderer.fillRect(cx, cy, 1, 1, color);
        continue;
      }
      if (!s.onWater && frame > 2) continue;
      // Yatay basık halka: bir piksel kalınlığında elips noktaları
      const rx = frame + (s.onWater ? 1 : 0);
      const ry = Math.max(1, Math.round(rx / 2));
      const seen = new Set();
      for (let a = 0; a < 16; a++) {
        const angle = (a / 16) * Math.PI * 2;
        const px = cx + Math.round(Math.cos(angle) * rx);
        const py = cy + Math.round(Math.sin(angle) * ry);
        const key = px * 1000 + py;
        if (seen.has(key)) continue;
        seen.add(key);
        renderer.fillRect(px, py, 1, 1, color);
      }
    }
  }

  /** Bulut gölgeleri: yatay şeritlerle çizilen yumuşak elipsler (dünya koordinatı). */
  drawClouds(renderer, camera, weather, map, time) {
    const cover = weather.cloud;
    if (cover <= 0.02) return;
    const view = camera.getViewBounds(renderer.width, renderer.height);
    const span = map.pixelWidth + 200;
    const alpha = (0.22 * cover).toFixed(3);

    for (const cloud of this.clouds) {
      const cx = ((cloud.x * span + time * cloud.speed) % span) - 100;
      const cy = cloud.y * map.pixelHeight;
      if (cx + cloud.rx < view.left || cx - cloud.rx > view.right) continue;
      if (cy + cloud.ry < view.top || cy - cloud.ry > view.bottom) continue;
      // Her şerit ayrı çizilir; üst üste binmediği için koyu kenar oluşmaz
      for (let dy = -cloud.ry; dy <= cloud.ry; dy += 2) {
        const half = cloud.rx * Math.sqrt(1 - (dy / cloud.ry) ** 2) * (0.82 + 0.18 * Math.sin(dy * 0.4 + cloud.lobe * 6));
        renderer.fillRect(Math.round(cx - half), Math.round(cy + dy), Math.round(half * 2), 2, `rgba(${SHADOW_COLOR}, ${alpha})`);
      }
    }
  }

  /** Bu karede şimşek çaktı mı? (bir kez true döner; sahne gök gürültüsü olayını yayınlar) */
  takeLightning() {
    const pending = this.lightningPending;
    this.lightningPending = false;
    return pending;
  }

  /** Şimşek parıltısı (ekran katmanı, en üstte): hızlı sönen beyaz örtü, ortasında ikinci kısa çakma. */
  drawLightning(renderer) {
    if (this.flash <= 0.01) return;
    const flicker = this.flash > 0.55 && this.flash < 0.7 ? 0.25 : 1;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(236, 244, 255, ${(this.flash * 0.55 * flicker).toFixed(3)})`;
    ctx.fillRect(0, 0, renderer.width, renderer.height);
    ctx.restore();
  }

  /**
   * Sabah sisi (dünya katmanı): yavaşça yana süzülen, kenarları yumuşak beyaz şeritler; nehrin üstünde ayrıca
   * dalgalanan ince bir pus. Yoğunluk state.weather.mist (0-1).
   */
  drawMist(renderer, camera, weather, map, time) {
    const mist = weather.mist ?? 0;
    if (mist <= 0.02) return;
    const view = camera.getViewBounds(renderer.width, renderer.height);
    const height = view.bottom - view.top;
    // Bütün manzarayı yumuşatan hafif beyaz örtü
    renderer.fillRect(Math.floor(view.left), Math.floor(view.top), Math.ceil(view.right - view.left) + 1, Math.ceil(height) + 1, `rgba(232, 238, 246, ${(0.2 * mist).toFixed(3)})`);
    for (let i = 0; i < MIST_BANDS; i++) {
      const baseY = view.top + ((i + 0.5) / MIST_BANDS) * height + Math.sin(time * 0.15 + i * 1.7) * 10;
      const drift = (time * (4 + (i % 3) * 2) + i * 97) % (view.right - view.left + 240);
      const cx = view.left - 120 + drift;
      const rx = 90 + (i % 4) * 30;
      for (let dy = -12; dy <= 12; dy += 2) {
        const half = rx * Math.sqrt(1 - (dy / 13) ** 2);
        const alpha = (0.12 + 0.12 * (1 - Math.abs(dy) / 12)) * mist;
        renderer.fillRect(Math.round(cx - half), Math.round(baseY + dy), Math.round(half * 2), 2, `rgba(238, 244, 250, ${alpha.toFixed(3)})`);
      }
    }
    // Nehrin üstünde süzülen pus
    const x0 = Math.max(0, Math.floor(view.left / T));
    const y0 = Math.max(0, Math.floor(view.top / T));
    const x1 = Math.min(map.width - 1, Math.floor(view.right / T));
    const y1 = Math.min(map.height - 1, Math.floor(view.bottom / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (map.get(x, y) !== 'water') continue;
        const wave = Math.sin(time * 0.6 + x * 0.9 + y * 0.5);
        const alpha = (0.3 + 0.12 * wave) * mist;
        renderer.fillRect(x * T, y * T + 2 + Math.round(wave * 2), T, 9, `rgba(242, 247, 252, ${alpha.toFixed(3)})`);
        renderer.fillRect(x * T + 3, y * T + Math.round(wave * 3), T - 6, 3, `rgba(250, 252, 255, ${(alpha * 0.6).toFixed(3)})`);
      }
    }
  }

  /** Kar taneleri: bir ya da iki oyun pikseli büyüklüğünde beyaz noktalar (ekran koordinatı). */
  drawSnow(renderer, camera, weather) {
    const z = camera.zoom;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.85 * Math.min(1, weather.rain * 1.4)).toFixed(2)})`;
    for (const d of this.drops) {
      const px = Math.round(d.x / z) * z;
      const py = Math.round(d.y / z) * z;
      const size = d.speed > 1.05 ? 2 * z : z; // yakındaki iri, uzaktaki küçük taneler
      ctx.fillRect(px, py, size, size);
    }
    ctx.restore();
  }

  /** Yağmur damlaları (ekran koordinatı). daylight: 0 gece - 1 gündüz; gece damlalar sönükleşir. */
  drawRain(renderer, camera, weather, daylight) {
    if (this.drops.length === 0) return;
    if (this.snowing) {
      this.drawSnow(renderer, camera, weather);
      return;
    }
    const z = camera.zoom;
    const ctx = renderer.ctx;
    const alpha = (0.35 + 0.35 * daylight) * Math.min(1, weather.rain * 1.4);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(214, 234, 255, ${alpha.toFixed(2)})`;
    for (const d of this.drops) {
      // Her damla üç piksellik eğik bir çizgi; konum oyun pikseline oturur
      const px = Math.round(d.x / z) * z;
      const py = Math.round(d.y / z) * z;
      ctx.fillRect(px, py, z, z);
      ctx.fillRect(px, py + z, z, z);
      ctx.fillRect(px - z, py + 2 * z, z, z);
    }
    ctx.restore();
  }
}
