// Kasaba şenliğinin görüntüsü (kural yok, yalnızca çizim): şenlik yerinin çevresine gerilmiş renkli
// fener dizisi (gece ışık katmanına da eklenir) ve havaya yükselip sallanarak kaybolan müzik notaları.
// (14. aşama) Mevsim festivallerinde temaya göre: ilkbaharda süzülen çiçek yaprakları, yazın fener dizisi yerine
// renkli üçgen flamalar, sonbaharda dökülen yapraklar, kışın kamp ateşinin harlanıp şölen ateşine dönüşmesi ve
// fenerlerin çevresinde kıvılcımlar; süslemelerin gece ışıkları (şölen ateşi, kardan adamın feneri).
import { getNoteSprite } from '../art/ui/index.js';

const NOTE_COLORS = ['P', 'p', 'i', 'a', 'O'];
const NOTE_COUNT = 10;
const LANTERN_COLORS = [
  { css: '#ffd23f', rgb: [255, 210, 63] },
  { css: '#f06b8a', rgb: [240, 107, 138] },
  { css: '#4aa3df', rgb: [74, 163, 223] },
  { css: '#a4dd5c', rgb: [164, 221, 92] },
];
const LANTERN_SPACING = 10; // piksel

export class FestivalEffects {
  /** Yer çevresindeki fener noktaları: yapının iki karo dışından geçen dikdörtgen. */
  lanternPoints(venue) {
    const left = venue.x - 20;
    const right = venue.x + venue.width + 20;
    const top = venue.y - 22;
    const bottom = venue.y + venue.height + 14;
    const points = [];
    for (let x = left; x <= right; x += LANTERN_SPACING) points.push({ x, y: top + Math.sin(x * 0.2) * 2 }, { x, y: bottom });
    for (let y = top + LANTERN_SPACING; y < bottom; y += LANTERN_SPACING) points.push({ x: left, y }, { x: right, y });
    return points;
  }

  /** Dünya katmanında: fener dizisi ve notalar (gece örtüsünün üstünde çizilir ki parlasın). */
  draw(renderer, venue, time, theme = null, sf = null) {
    if (theme) this.drawTheme(renderer, venue, time, theme, sf);
    this.lanternPoints(venue).forEach((p, i) => {
      if (theme === 'summer') return; // yazın fenerlerin yerine flamalar
      const color = LANTERN_COLORS[i % LANTERN_COLORS.length].css;
      const blink = Math.sin(time * 3 + i) > -0.6;
      renderer.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 1, '#1b1423');
      if (blink) renderer.fillRect(Math.round(p.x) - 1, Math.round(p.y), 2, 2, color);
    });
    for (let i = 0; i < NOTE_COUNT; i++) {
      const phase = (time * 0.35 + i / NOTE_COUNT) % 1;
      const startX = venue.x + ((i * 37) % Math.max(1, venue.width + 40)) - 20;
      const x = Math.round(startX + Math.sin(phase * 7 + i) * 4);
      const y = Math.round(venue.y + venue.height - phase * 46);
      if (phase > 0.85 && Math.floor(time * 8) % 2 === 0) continue; // sönerken titrer
      renderer.drawImage(getNoteSprite(NOTE_COLORS[i % NOTE_COLORS.length]), x, y);
    }
  }

  /** Mevsim festivalinin temaya özgü süsleri (dünya katmanı). */
  drawTheme(renderer, venue, time, theme, sf) {
    const cx = venue.x + venue.width / 2;
    const cy = venue.y + venue.height / 2;
    if (theme === 'spring' || theme === 'autumn') {
      // Süzülen çiçek yaprakları / dökülen sonbahar yaprakları
      const colors = theme === 'spring' ? ['#f06b8a', '#ffffff', '#f9b4c6', '#ffd23f'] : ['#f0a830', '#d4652a', '#9c3424', '#f6d860'];
      for (let i = 0; i < 18; i++) {
        const phase = (time * 0.18 + i / 18) % 1;
        const x = Math.round(cx - 48 + ((i * 53) % 96) + Math.sin(phase * 8 + i) * 6 + phase * 10);
        const y = Math.round(cy - 50 + phase * 80);
        renderer.fillRect(x, y, Math.floor(time * 4 + i) % 2 === 0 ? 2 : 1, 1, colors[i % colors.length]);
      }
    }
    if (theme === 'summer') {
      // Rengârenk üçgen flamalar: yerin üstünden ve iki yanından geçen ip
      const left = venue.x - 24;
      const right = venue.x + venue.width + 24;
      const top = venue.y - 20;
      const colors = ['#e8463c', '#ffd23f', '#4aa3df', '#a4dd5c', '#f06b8a', '#8a6cf0'];
      for (let x = left, i = 0; x <= right; x += 6, i++) {
        const sag = Math.round(Math.sin(((x - left) / (right - left)) * Math.PI) * 5);
        const sway = Math.floor(time * 2 + i) % 2;
        renderer.fillRect(x, top + sag, 6, 1, '#4f2d1a');
        renderer.fillRect(x + 1, top + sag + 1, 4, 1, colors[i % colors.length]);
        renderer.fillRect(x + 2, top + sag + 2, 2 + sway, 1, colors[i % colors.length]);
        renderer.fillRect(x + 2 + sway, top + sag + 3, 1, 1, colors[i % colors.length]);
      }
    }
    if (theme === 'winter') {
      // Şölen ateşi: kamp ateşiyse yeri harlanır, değilse meydanın ortasında büyük alevler
      const fx = cx;
      const fy = venue.type === 'campfire' ? venue.y + venue.height - 5 : venue.y + venue.height + 10;
      const flames = ['#ff9a3c', '#ffd23f', '#e8463c', '#fff3b0'];
      for (let i = 0; i < 16; i++) {
        const phase = (time * 1.6 + i / 16) % 1;
        const x = Math.round(fx - 7 + ((i * 5) % 14) + Math.sin(time * 7 + i) * 1.5);
        const y = Math.round(fy - phase * 20);
        const size = phase < 0.5 ? 2 : 1;
        renderer.fillRect(x, y, size, size + 1, flames[i % flames.length]);
      }
      // Fenerlerin çevresinde ve meydanda parıldayan kıvılcımlar
      for (let i = 0; i < 10; i++) {
        const t = (time * 0.7 + i * 0.37) % 1;
        if (t > 0.5) continue;
        const x = Math.round(cx - 40 + ((i * 29) % 80));
        const y = Math.round(cy - 36 + ((i * 17) % 60));
        renderer.fillRect(x, y, 1, 1, '#ffffff');
        if (t < 0.2) {
          renderer.fillRect(x - 1, y, 3, 1, 'rgba(255, 255, 255, 0.6)');
          renderer.fillRect(x, y - 1, 1, 3, 'rgba(255, 255, 255, 0.6)');
        }
      }
    }
  }

  /** Gece ışık katmanına fenerlerin renkli parıltısı. */
  collectLights(out, venue, theme = null, sf = null) {
    if (theme === 'winter') {
      const flicker = Math.sin(Date.now() / 90) * 4;
      const fy = venue.type === 'campfire' ? venue.y + venue.height - 8 : venue.y + venue.height + 6;
      out.push({ x: venue.x + venue.width / 2, y: fy, radius: 120 + flicker, color: [255, 160, 70], intensity: 0.95, glow: 0.42 });
    }
    for (const d of sf?.stage === 'active' ? sf.decor : []) {
      if (d.kind === 'feastTable' || d.kind === 'flowerArch' || d.kind === 'harvestBasket') out.push({ x: d.x, y: d.y - 8, radius: 22, color: [255, 214, 140], intensity: 0.5, glow: 0.25 });
    }
    this.lanternPoints(venue).forEach((p, i) => {
      if (theme === 'summer') return;
      if (i % 2 !== 0) return;
      out.push({ x: p.x, y: p.y, radius: 16, color: LANTERN_COLORS[i % LANTERN_COLORS.length].rgb, intensity: 0.55, glow: 0.35 });
    });
  }
}
