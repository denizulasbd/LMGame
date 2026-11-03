// Saate göre ekranın üstüne atmosferik bir renk katmanı uygular ve gece ışıklarını çizer.
//
// Işıklar iki adımda işlenir:
//   1. Karanlık katmanı ayrı bir tuvalde hazırlanır; her ışık bu katmanda bir "delik" açar
//      (destination-out) — ışığın çevresi gerçekten aydınlık görünür.
//   2. Üzerine sıcak renkli, toplamsal (lighter) bir parıltı eklenir.
// Işıkların gücü karanlıkla orantılıdır: gündüz görünmez, gece en parlaktır.
import { lerp, clamp } from '../utils/math.js';

// Anahtar kareler arasında doğrusal geçiş yapılır; [saat, r, g, b, opaklık].
const KEYFRAMES = [
  [0.0, 16, 20, 66, 0.55],    // gece yarısı laciverti
  [4.5, 16, 20, 66, 0.55],
  [5.5, 74, 52, 120, 0.42],   // şafak öncesi mor
  [6.5, 255, 150, 110, 0.22], // gün doğumu pembesi
  [8.0, 255, 220, 160, 0.06], // sabah aydınlığı
  [9.5, 255, 255, 255, 0.0],  // gündüz: renk yok
  [16.5, 255, 255, 255, 0.0],
  [17.5, 255, 190, 100, 0.12], // ikindi altını
  [18.5, 245, 110, 60, 0.24],  // akşamüstü kızıllığı
  [19.5, 120, 50, 110, 0.36],  // alacakaranlık
  [21.0, 16, 20, 66, 0.55],
  [24.0, 16, 20, 66, 0.55],
];

const NIGHT_ALPHA = 0.55;

/** Verilen saat (0-24, ondalıklı) için { r, g, b, a } döndürür. */
export function getAmbientColor(hour) {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (h >= a[0] && h <= b[0]) {
      const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
      return {
        r: Math.round(lerp(a[1], b[1], t)),
        g: Math.round(lerp(a[2], b[2], t)),
        b: Math.round(lerp(a[3], b[3], t)),
        a: lerp(a[4], b[4], t),
      };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { r: last[1], g: last[2], b: last[3], a: last[4] };
}

// Bulutlu ve yağmurlu havada gündüze eklenen gri-mavi örtü
const OVERCAST = { r: 84, g: 98, b: 128 };
const OVERCAST_CLOUD_ALPHA = 0.14;
const OVERCAST_RAIN_ALPHA = 0.12;

/** Günün rengine hava örtüsünü katar: alfalar birleşir, renkler alfaya göre karışır. */
export function withOvercast(ambient, weather) {
  if (!weather) return ambient;
  const o = clamp(weather.cloud * OVERCAST_CLOUD_ALPHA + weather.rain * OVERCAST_RAIN_ALPHA, 0, 0.3);
  if (o <= 0.001) return ambient;
  const a = ambient.a + o - ambient.a * o;
  const wa = ambient.a / (ambient.a + o);
  return {
    r: Math.round(ambient.r * wa + OVERCAST.r * (1 - wa)),
    g: Math.round(ambient.g * wa + OVERCAST.g * (1 - wa)),
    b: Math.round(ambient.b * wa + OVERCAST.b * (1 - wa)),
    a,
  };
}

/** Gündüz, gecenin karanlığıyla orantılı azalan hafif mevsim rengi ekler. */
export function withSeasonTint(ambient, tint) {
  if (!tint || tint.a <= 0) return ambient;
  const day = 1 - clamp(ambient.a / NIGHT_ALPHA, 0, 1);
  const t = tint.a * day;
  if (t <= 0.001) return ambient;
  const a = ambient.a + t - ambient.a * t;
  const wa = ambient.a / (ambient.a + t);
  return {
    r: Math.round(ambient.r * wa + tint.r * (1 - wa)),
    g: Math.round(ambient.g * wa + tint.g * (1 - wa)),
    b: Math.round(ambient.b * wa + tint.b * (1 - wa)),
    a,
  };
}

export class DayNightOverlay {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.screenLights = [];
  }

  /**
   * @param {import('./Renderer.js').Renderer} renderer
   * @param {import('./Camera.js').Camera} camera
   * @param {number} hour ondalıklı saat
   * @param {{x:number, y:number, radius:number, color:number[], intensity:number, glow:number}[]} lights dünya pikseli
   * @param {{cloud:number, rain:number}|null} weather bulutlu / yağmurlu havada gökyüzü kararır ve griye çalar
   * @param {{r:number, g:number, b:number, a:number}|null} seasonTint gündüz eklenen mevsim ışığı (yazın sıcak, kışın soğuk)
   */
  render(renderer, camera, hour, lights, weather = null, seasonTint = null) {
    const ambient = getAmbientColor(hour);
    const { r, g, b, a } = withOvercast(withSeasonTint(ambient, seasonTint), weather);
    if (a <= 0.001) return;
    // Işıkların gücü yalnızca günün karanlığına bağlıdır; bulut gündüz fenerleri yakmaz
    const darkness = clamp(ambient.a / NIGHT_ALPHA, 0, 1);
    const { width, height } = renderer;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    // Işıklar ekran koordinatına yerinde çevrilir (her karede kopya üretilmez); ekranın dışında kalanlar için
    // gradyan hiç kurulmaz
    const screenLights = this.screenLights;
    screenLights.length = 0;
    if (darkness > 0.05) {
      for (const light of lights) {
        if (toScreen(light, camera, width, height)) screenLights.push(light);
      }
    }

    // 1. Karanlıkta delik aç
    ctx.globalCompositeOperation = 'destination-out';
    for (const light of screenLights) {
      const gradient = ctx.createRadialGradient(light.sx, light.sy, 0, light.sx, light.sy, light.sr);
      const strength = light.intensity * darkness;
      gradient.addColorStop(0, `rgba(0, 0, 0, ${strength.toFixed(3)})`);
      gradient.addColorStop(0.55, `rgba(0, 0, 0, ${(strength * 0.55).toFixed(3)})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(light.sx - light.sr, light.sy - light.sr, light.sr * 2, light.sr * 2);
    }

    const target = renderer.ctx;
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.drawImage(this.canvas, 0, 0);

    // 2. Sıcak parıltı
    target.globalCompositeOperation = 'lighter';
    for (const light of screenLights) {
      const [lr, lg, lb] = light.color;
      const gradient = target.createRadialGradient(light.sx, light.sy, 0, light.sx, light.sy, light.sr);
      gradient.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, ${(light.glow * darkness).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0)`);
      target.fillStyle = gradient;
      target.fillRect(light.sx - light.sr, light.sy - light.sr, light.sr * 2, light.sr * 2);
    }
    target.restore();
    screenLights.length = 0;
  }
}

/** Işığa ekran koordinatlarını yazar (sx, sy, sr); ışık halkası ekranla kesişiyorsa true. */
function toScreen(light, camera, width, height) {
  light.sx = (light.x - camera.x) * camera.zoom;
  light.sy = (light.y - camera.y) * camera.zoom;
  light.sr = light.radius * camera.zoom;
  return light.sx + light.sr > 0 && light.sy + light.sr > 0 && light.sx - light.sr < width && light.sy - light.sr < height;
}
