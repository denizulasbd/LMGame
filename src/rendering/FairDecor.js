// (26.1) Mevsimlik panayırın görünümü (kural yok, yalnızca çizim): meydan havuzunun çevresine kurulan geçici tentler
// (şeritli kumaş saçaklar), direkler ve bayrak flamaları ('prep' ve 'party' evrelerinde), şenlik saatinde ('party') ise
// mevsimin süsleri: ilkbaharda çiçek çelenkleri, yazın güneş fenerleri, sonbaharda hasat sepetleri, kışın meydan meşalesi
// ve ateşi. Hiçbir şey harita matrisine ya da yapı listesine yazılmaz: panayır bitince çizilmeyi bırakır, geriye iz kalmaz.
// Yalnızca renderer.fillRect(x, y, w, h, renk) kullanır (tools/art-preview.html bir tuvale aynı arayüzle çizdirir).
import { FAIRS } from '../data/fair.js';

const POLE = '#6b4a2a';
const OUTLINE = '#1b1423';

export class FairDecor {
  /** Panayır alanı: yapının çevresindeki dikdörtgen (piksel). */
  bounds(venue) {
    return { left: venue.x - 28, right: venue.x + venue.width + 28, top: venue.y - 26, bottom: venue.y + venue.height + 20 };
  }

  /** Dünya katmanında: tentler, flamalar ve (şenlik saatinde) mevsim süsleri. */
  draw(renderer, venue, time, type, phase) {
    const fair = FAIRS[type];
    const b = this.bounds(venue);
    this.drawPoles(renderer, b);
    this.drawAwning(renderer, b, fair.colors, time);
    this.drawBunting(renderer, b, fair.colors, time);
    if (phase !== 'party') return;
    if (fair.prop === 'wreath') this.drawWreaths(renderer, b, time);
    else if (fair.prop === 'sunLantern') this.drawSunLanterns(renderer, b, time);
    else if (fair.prop === 'basket') this.drawBaskets(renderer, b, time);
    else if (fair.prop === 'torch') this.drawTorches(renderer, b, venue, time);
  }

  drawPoles(renderer, b) {
    for (const x of [b.left, b.right]) {
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
    for (const x of [b.left, b.right - 3]) {
      for (let y = 0, i = 0; y < 24; y += 4, i++) renderer.fillRect(x, b.top + 4 + y, 3, 3, colors[(i + 1) % colors.length]);
    }
  }

  /** İki yan ve alt kenarda küçük üçgen flamalar. */
  drawBunting(renderer, b, colors, time) {
    const rope = (x0, y0, len, horizontal, offset) => {
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
    };
    rope(b.left, b.bottom - 8, b.right - b.left, true, 1);
    rope(b.left, b.top + 14, b.bottom - b.top - 22, false, 2);
    rope(b.right, b.top + 14, b.bottom - b.top - 22, false, 3);
  }

  /** İlkbahar: çiçek çelenkleri (halka, pembe-beyaz çiçek noktaları). */
  drawWreaths(renderer, b, time) {
    const spots = [b.left + 6, (b.left + b.right) / 2 - 6, b.right - 18];
    spots.forEach((x, i) => {
      const y = b.top + 5;
      const colors = ['#f06b8a', '#ffffff', '#f9b4c6', '#ffd23f'];
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const px = Math.round(x + 6 + Math.cos(a) * 5);
        const py = Math.round(y + 6 + Math.sin(a) * 4);
        renderer.fillRect(px, py, 2, 2, k % 3 === 0 ? '#5fa34a' : colors[(k + i + Math.floor(time * 2)) % colors.length]);
      }
    });
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
    const spots = [[b.left + 3, b.bottom - 15], [b.right - 15, b.bottom - 15], [b.left + 3, b.top + 22], [b.right - 15, b.top + 22]];
    spots.forEach(([x, y], i) => {
      renderer.fillRect(x, y + 4, 12, 7, OUTLINE);
      renderer.fillRect(x + 1, y + 5, 10, 5, i % 2 ? '#a0662f' : '#8a5524');
      renderer.fillRect(x + 1, y + 7, 10, 1, '#6b4a2a');
      renderer.fillRect(x + 2, y + 2, 4, 4, '#e8812c'); // balkabağı
      renderer.fillRect(x + 4, y + 1, 1, 1, '#5fa34a');
      renderer.fillRect(x + 7, y + 3, 3, 3, '#c0392b'); // elma
      renderer.fillRect(x + 9, y + (Math.floor(time * 2 + i) % 2), 1, 4, '#f0c850'); // başak
    });
  }

  /** Kış: köşelerde meydan meşaleleri; kıvılcımlar ve alevler. */
  drawTorches(renderer, b, venue, time) {
    const flames = ['#ff9a3c', '#ffd23f', '#e8463c', '#fff3b0'];
    const spots = [[b.left + 2, b.top + 16], [b.right - 2, b.top + 16], [b.left + 2, b.bottom - 14], [b.right - 2, b.bottom - 14]];
    spots.forEach(([x, y], s) => {
      renderer.fillRect(x, y, 1, 14, POLE);
      renderer.fillRect(x - 2, y - 1, 5, 2, OUTLINE);
      for (let i = 0; i < 8; i++) {
        const phase = (time * 1.8 + i / 8 + s * 0.13) % 1;
        const fx = Math.round(x - 1 + ((i * 3) % 3) + Math.sin(time * 7 + i + s) * 1);
        const fy = Math.round(y - 2 - phase * 9);
        renderer.fillRect(fx, fy, phase < 0.5 ? 2 : 1, 2, flames[(i + s) % flames.length]);
      }
    });
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
  collectLights(out, venue, type, phase) {
    if (phase !== 'party') return;
    const b = this.bounds(venue);
    const prop = FAIRS[type].prop;
    if (prop === 'sunLantern') {
      for (let i = 0; i < 5; i++) out.push({ x: b.left + 12 + (i * (b.right - b.left - 20)) / 4, y: b.top + 12 + (i % 2) * 3, radius: 22, color: [255, 214, 100], intensity: 0.6, glow: 0.3 });
    } else if (prop === 'torch') {
      for (const [x, y] of [[b.left, b.top + 10], [b.right, b.top + 10], [b.left, b.bottom - 20], [b.right, b.bottom - 20]]) out.push({ x, y, radius: 40, color: [255, 160, 70], intensity: 0.8, glow: 0.35 });
      out.push({ x: venue.x + venue.width / 2, y: venue.y + venue.height + 2, radius: 70, color: [255, 160, 70], intensity: 0.9, glow: 0.4 });
    } else if (prop === 'wreath') {
      out.push({ x: (b.left + b.right) / 2, y: b.top + 10, radius: 40, color: [255, 190, 210], intensity: 0.5, glow: 0.2 });
    } else {
      for (const [x, y] of [[b.left + 8, b.bottom - 10], [b.right - 8, b.bottom - 10]]) out.push({ x, y, radius: 26, color: [255, 190, 110], intensity: 0.5, glow: 0.25 });
    }
  }
}
