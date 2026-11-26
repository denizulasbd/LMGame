// (26.1) Mevsimlik panayırın görünümü (kural yok, yalnızca çizim): meydan havuzunun çevresine kurulan geçici tentler
// (şeritli kumaş saçaklar), direkler ve bayrak flamaları ('prep' ve 'party' evrelerinde), şenlik saatinde ('party') ise
// mevsimin süsleri: ilkbaharda çiçek çelenkleri, yazın güneş fenerleri, sonbaharda hasat sepetleri, kışın meydan meşalesi
// ve ateşi. Hiçbir şey harita matrisine ya da yapı listesine yazılmaz: panayır bitince çizilmeyi bırakır, geriye iz kalmaz.
// Yalnızca renderer.fillRect(x, y, w, h, renk) kullanır (tools/art-preview.html bir tuvale aynı arayüzle çizdirir).
import { FAIRS } from '../data/fair.js';
import { mod } from '../utils/math.js';

const POLE = '#6b4a2a';
const OUTLINE = '#1b1423';
// (27.3) Sık çizilen döngülerde her karede dizi / nesne üretilmesin: renkler ve ışık renkleri modül sabitleri
const WREATH_COLORS = ['#f06b8a', '#ffffff', '#f9b4c6', '#ffd23f'];
const FLAMES = ['#ff9a3c', '#ffd23f', '#e8463c', '#fff3b0'];
const LIGHT_TABLE = [255, 214, 140];
const LIGHT_SUN = [255, 214, 100];
const LIGHT_TORCH = [255, 160, 70];
const LIGHT_WREATH = [255, 190, 210];
const LIGHT_BASKET = [255, 190, 110];

export class FairDecor {
  constructor() {
    // (27.3) Yeniden kullanılan dikdörtgenler: bounds() / tableRect() her karede yeni nesne üretmez
    this._b = { left: 0, right: 0, top: 0, bottom: 0 };
    this._t = { x: 0, y: 0, w: 26, h: 9 };
  }

  /** Panayır alanı: yapının çevresindeki dikdörtgen (piksel). Dönen nesne yeniden kullanılır (bir sonraki çağrıya kadar geçerli). */
  bounds(venue) {
    const b = this._b;
    b.left = venue.x - 28;
    b.right = venue.x + venue.width + 28;
    b.top = venue.y - 26;
    b.bottom = venue.y + venue.height + 20;
    return b;
  }

  /** Dünya katmanında: tentler, flamalar, Büyük Ziyafet Sofrası ve (şenlik saatinde) mevsim süsleri. feast: Feast.currentFeastOf sonucu ya da null. */
  draw(renderer, venue, time, type, phase, feast = null) {
    const fair = FAIRS[type];
    const b = this.bounds(venue);
    this.drawPoles(renderer, b);
    this.drawAwning(renderer, b, fair.colors, time);
    this.drawBunting(renderer, b, fair.colors, time);
    if (feast) this.drawBanquet(renderer, venue, time, fair.colors[0], feast, phase);
    if (phase !== 'party') return;
    if (fair.prop === 'wreath') this.drawWreaths(renderer, b, time);
    else if (fair.prop === 'sunLantern') this.drawSunLanterns(renderer, b, time);
    else if (fair.prop === 'basket') this.drawBaskets(renderer, b, time);
    else if (fair.prop === 'torch') this.drawTorches(renderer, b, venue, time);
  }

  /** Sofranın konumu: meydan havuzunun sağında, yanında. Dönen nesne yeniden kullanılır. */
  tableRect(venue) {
    const t = this._t;
    t.x = venue.x + venue.width + 3;
    t.y = venue.y + venue.height - 6;
    t.w = 26;
    t.h = 9;
    return t;
  }

  /**
   * (26.2) Büyük Ziyafet Sofrası: uzun ahşap masa, mevsim renginde örtü; hazırlıkta yalnızca örtü, şenlik saatinde ikram doludur
   * (kalan ikram oranı kadar tabak / testi) ve mumlar yanar; zengin sofrada şerbet fıçıları, köpüklü kadehler ve testiler.
   * Tier: 'symbolic' | 'modest' | 'rich'. left / total: kalan ve toplam ikram.
   */
  drawBanquet(renderer, venue, time, cloth, feast, phase) {
    const t = this.tableRect(venue);
    // Ayaklar ve masa tablası, örtü
    renderer.fillRect(t.x + 1, t.y + t.h - 2, 2, 3, POLE);
    renderer.fillRect(t.x + t.w - 3, t.y + t.h - 2, 2, 3, POLE);
    renderer.fillRect(t.x, t.y + 2, t.w, 5, OUTLINE);
    renderer.fillRect(t.x + 1, t.y + 3, t.w - 2, 3, '#a0662f');
    renderer.fillRect(t.x + 1, t.y + 3, t.w - 2, 1, '#c98a4a');
    renderer.fillRect(t.x + 2, t.y + 3, t.w - 4, 2, cloth); // sofra örtüsü
    renderer.fillRect(t.x + 2, t.y + 5, t.w - 4, 1, '#ffffff'); // örtü saçağı
    if (feast.tier === 'rich') {
      renderer.fillRect(t.x + 4, t.y + 3, t.w - 8, 1, '#ffd23f'); // altın yol
    }
    if (phase !== 'party') return;
    // İkram doluluğu: kalan ikram oranı kadar tabak
    const slots = feast.tier === 'symbolic' ? 3 : 7;
    const filled = feast.total > 0 ? Math.ceil((feast.left / feast.total) * slots) : 0;
    for (let i = 0; i < slots; i++) {
      const x = t.x + 3 + Math.round((i * (t.w - 8)) / Math.max(1, slots - 1));
      if (i >= filled) {
        renderer.fillRect(x, t.y + 3, 2, 1, '#d8d8d8'); // boş tabak
        continue;
      }
      renderer.fillRect(x, t.y + 4, 3, 1, '#6b4a2a'); // tabağın gölgesi (örtüde seçilsin)
      if (feast.tier === 'rich' && i % 3 === 1) {
        renderer.fillRect(x, t.y, 2, 4, '#4aa3df'); // testi
        renderer.fillRect(x, t.y - 1, 2, 1, '#ffffff'); // köpük
      } else if (i % 2 === 0) {
        renderer.fillRect(x, t.y + 2, 3, 2, '#c98a4a'); // ekmek
        renderer.fillRect(x + 1, t.y + 2, 1, 1, '#f0c850');
      } else {
        renderer.fillRect(x, t.y + 2, 3, 2, '#ffffff'); // tabak
        renderer.fillRect(x + 1, t.y + 2, 1, 1, '#e8463c'); // sebze
      }
    }
    // Zengin sofra: uçlarda şerbet fıçıları
    if (feast.tier === 'rich') {
      for (let k = 0; k < 2; k++) {
        const x = k === 0 ? t.x - 4 : t.x + t.w + 1;
        renderer.fillRect(x, t.y + 1, 4, 6, OUTLINE);
        renderer.fillRect(x + 1, t.y + 2, 2, 4, '#8a5524');
        renderer.fillRect(x + 1, t.y + 3, 2, 1, '#c0c0c0'); // çember
        renderer.fillRect(x + 1, t.y, 2, 1, mod(Math.floor(time * 3 + x), 2) ? '#ffffff' : '#f4f0e0'); // köpük
      }
    }
    // Mumlar
    for (let k = 0; k < 2; k++) {
      const x = k === 0 ? t.x + 5 : t.x + t.w - 7;
      renderer.fillRect(x, t.y + 1, 1, 2, '#f4f0e0');
      renderer.fillRect(x, t.y - 1 + mod(Math.floor(time * 6 + x), 2), 1, 2, '#ffd23f');
    }
  }

  drawPoles(renderer, b) {
    for (let k = 0; k < 2; k++) {
      const x = k === 0 ? b.left : b.right;
      renderer.fillRect(x, b.top, 1, 14, POLE);
      renderer.fillRect(x - 1, b.top - 1, 3, 1, OUTLINE);
      renderer.fillRect(x, b.bottom - 8, 1, 8, POLE);
    }
  }

  /** Üst kenarda şeritli kumaş tent: kare şeritler, altı dişli saçak. */
  drawAwning(renderer, b, colors, time) {
    const w = b.right - b.left;
    for (let x = 0, i = 0; x < w; x += 4, i++) {
      const c = colors[i % 2 === 0 ? 0 : 1];
      const sway = Math.floor(time * 1.5 + i * 0.7) % 3 === 0 ? 1 : 0;
      renderer.fillRect(b.left + x, b.top, 4, 3, c);
      renderer.fillRect(b.left + x + 1, b.top + 3, 2, 1 + sway, c); // saçak dişi
    }
    renderer.fillRect(b.left, b.top - 1, w, 1, OUTLINE);
    // Yan tentler: iki yanda kısa şeritli saçaklar
    for (let k = 0; k < 2; k++) {
      const x = k === 0 ? b.left : b.right - 3;
      for (let y = 0, i = 0; y < 24; y += 4, i++) renderer.fillRect(x, b.top + 4 + y, 3, 3, colors[(i + 1) % colors.length]);
    }
  }

  /** İki yan ve alt kenarda küçük üçgen flamalar. */
  drawBunting(renderer, b, colors, time) {
    this.rope(renderer, colors, time, b.left, b.bottom - 8, b.right - b.left, true, 1);
    this.rope(renderer, colors, time, b.left, b.top + 14, b.bottom - b.top - 22, false, 2);
    this.rope(renderer, colors, time, b.right, b.top + 14, b.bottom - b.top - 22, false, 3);
  }

  /** (27.3) Tek flama ipi (önceden her karede üretilen iç kapanışın yerine yöntem). */
  rope(renderer, colors, time, x0, y0, len, horizontal, offset) {
    for (let k = 0, i = 0; k < len; k += 6, i++) {
      const sag = Math.round(Math.sin((k / len) * Math.PI) * 3);
      const sway = Math.floor(time * 2 + i + offset) % 2;
      const c = colors[(i + offset) % colors.length];
      const x = horizontal ? x0 + k : x0 + sag;
      const y = horizontal ? y0 + sag : y0 + k;
      renderer.fillRect(x, y, horizontal ? 6 : 1, horizontal ? 1 : 6, POLE);
      if (horizontal) {
        renderer.fillRect(x + 1, y + 1, 4, 1, c);
        renderer.fillRect(x + 2, y + 2, 2 + sway, 1, c);
      } else {
        renderer.fillRect(x + 1, y + 1, 1, 4, c);
        renderer.fillRect(x + 2, y + 2, 1, 2 + sway, c);
      }
    }
  }

  /** İlkbahar: çiçek çelenkleri (halka, pembe-beyaz çiçek noktaları). */
  drawWreaths(renderer, b, time) {
    for (let i = 0; i < 3; i++) {
      const x = i === 0 ? b.left + 6 : i === 1 ? (b.left + b.right) / 2 - 6 : b.right - 18;
      const y = b.top + 5;
      const colors = WREATH_COLORS;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const px = Math.round(x + 6 + Math.cos(a) * 5);
        const py = Math.round(y + 6 + Math.sin(a) * 4);
        renderer.fillRect(px, py, 2, 2, k % 3 === 0 ? '#5fa34a' : colors[(k + i + Math.floor(time * 2)) % colors.length]);
      }
    }
  }

  /** Yaz: güneş fenerleri (sarı-turuncu yuvarlak fenerler, ışıkları collectLights'ta). */
  drawSunLanterns(renderer, b, time) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const x = Math.round(b.left + 8 + (i * (b.right - b.left - 20)) / (count - 1));
      const y = b.top + 8 + (i % 2) * 3;
      const glow = Math.sin(time * 3 + i) > -0.5;
      renderer.fillRect(x + 3, y - 4, 1, 4, POLE);
      renderer.fillRect(x, y, 8, 8, OUTLINE);
      renderer.fillRect(x + 1, y + 1, 6, 6, glow ? '#ffd23f' : '#ffb347');
      renderer.fillRect(x + 2, y + 2, 4, 4, '#fff3b0');
      renderer.fillRect(x + 3, y + 8, 2, 2, '#e8463c');
    }
  }

  /** Sonbahar: köşelere hasat sepetleri (kahverengi sepet, balkabağı, elma, buğday başağı). */
  drawBaskets(renderer, b, time) {
    for (let i = 0; i < 4; i++) {
      const x = i % 2 === 0 ? b.left + 3 : b.right - 15;
      const y = i < 2 ? b.bottom - 15 : b.top + 22;
      renderer.fillRect(x, y + 4, 12, 7, OUTLINE);
      renderer.fillRect(x + 1, y + 5, 10, 5, i % 2 ? '#a0662f' : '#8a5524');
      renderer.fillRect(x + 1, y + 7, 10, 1, '#6b4a2a');
      renderer.fillRect(x + 2, y + 2, 4, 4, '#e8812c'); // balkabağı
      renderer.fillRect(x + 4, y + 1, 1, 1, '#5fa34a');
      renderer.fillRect(x + 7, y + 3, 3, 3, '#c0392b'); // elma
      renderer.fillRect(x + 9, y + (Math.floor(time * 2 + i) % 2), 1, 4, '#f0c850'); // başak
    }
  }

  /** Kış: köşelerde meydan meşaleleri; kıvılcımlar ve alevler. */
  drawTorches(renderer, b, venue, time) {
    const flames = FLAMES;
    for (let s = 0; s < 4; s++) {
      const x = s % 2 === 0 ? b.left + 2 : b.right - 2;
      const y = s < 2 ? b.top + 16 : b.bottom - 14;
      renderer.fillRect(x, y, 1, 14, POLE);
      renderer.fillRect(x - 2, y - 1, 5, 2, OUTLINE);
      for (let i = 0; i < 8; i++) {
        const phase = (time * 1.8 + i / 8 + s * 0.13) % 1;
        const fx = Math.round(x - 1 + ((i * 3) % 3) + Math.sin(time * 7 + i + s) * 1);
        const fy = Math.round(y - 2 - phase * 9);
        renderer.fillRect(fx, fy, phase < 0.5 ? 2 : 1, 2, flames[(i + s) % flames.length]);
      }
    }
    // Meydanın ortasında küçük şenlik ateşi
    const cx = Math.round(venue.x + venue.width / 2);
    const cy = venue.y + venue.height + 8;
    renderer.fillRect(cx - 4, cy, 9, 2, OUTLINE);
    for (let i = 0; i < 10; i++) {
      const phase = (time * 1.6 + i / 10) % 1;
      renderer.fillRect(cx - 3 + ((i * 5) % 7) + Math.round(Math.sin(time * 6 + i)), Math.round(cy - phase * 14), phase < 0.5 ? 2 : 1, 2, flames[i % flames.length]);
    }
  }

  /** Gece ışıkları: şenlik saatinde fener / meşale / ateş parıltısı (hazırlıkta ışık yok). */
  collectLights(out, venue, type, phase, feast = null) {
    if (phase !== 'party') return;
    const b = this.bounds(venue);
    if (feast) {
      const t = this.tableRect(venue);
      out.push({ x: t.x + t.w / 2, y: t.y, radius: 34, color: LIGHT_TABLE, intensity: 0.6, glow: 0.3 });
    }
    const prop = FAIRS[type].prop;
    if (prop === 'sunLantern') {
      for (let i = 0; i < 5; i++) out.push({ x: b.left + 12 + (i * (b.right - b.left - 20)) / 4, y: b.top + 12 + (i % 2) * 3, radius: 22, color: LIGHT_SUN, intensity: 0.6, glow: 0.3 });
    } else if (prop === 'torch') {
      for (let s = 0; s < 4; s++) out.push({ x: s % 2 === 0 ? b.left : b.right, y: s < 2 ? b.top + 10 : b.bottom - 20, radius: 40, color: LIGHT_TORCH, intensity: 0.8, glow: 0.35 });
      out.push({ x: venue.x + venue.width / 2, y: venue.y + venue.height + 2, radius: 70, color: LIGHT_TORCH, intensity: 0.9, glow: 0.4 });
    } else if (prop === 'wreath') {
      out.push({ x: (b.left + b.right) / 2, y: b.top + 10, radius: 40, color: LIGHT_WREATH, intensity: 0.5, glow: 0.2 });
    } else {
      for (let s = 0; s < 2; s++) out.push({ x: s === 0 ? b.left + 8 : b.right - 8, y: b.bottom - 10, radius: 26, color: LIGHT_BASKET, intensity: 0.5, glow: 0.25 });
    }
  }
}
