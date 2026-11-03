// Kasaba şenliğinin görüntüsü (kural yok, yalnızca çizim): şenlik yerinin çevresine gerilmiş renkli
// fener dizisi (gece ışık katmanına da eklenir) ve havaya yükselip sallanarak kaybolan müzik notaları.
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
  draw(renderer, venue, time) {
    this.lanternPoints(venue).forEach((p, i) => {
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

  /** Gece ışık katmanına fenerlerin renkli parıltısı. */
  collectLights(out, venue) {
    this.lanternPoints(venue).forEach((p, i) => {
      if (i % 2 !== 0) return;
      out.push({ x: p.x, y: p.y, radius: 16, color: LANTERN_COLORS[i % LANTERN_COLORS.length].rgb, intensity: 0.55, glow: 0.35 });
    });
  }
}
