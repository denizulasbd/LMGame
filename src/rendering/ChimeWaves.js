// (20. aşama) Ulu Saat Kulesi'nin çanı çalınca çan odasından yayılan altın ses dalgaları ve kulenin çevresinde süzülen
// notalar (kural yok, yalnızca çizim; zaman gerçek zamandır). Çanı GoldenAgeSystem çalar ('goldenAge:chime').
import { WONDER_ART } from '../art/sprites/index.js';
import { GOLDEN_AGE } from '../data/goldenAge.js';
import { getNoteSprite } from '../art/ui/index.js';

const RINGS = 3;
const MAX_RADIUS = 92;
const DOTS = 40;

export class ChimeWaves {
  constructor() {
    this.startedAt = null; // gerçek zaman (sn); -1: sıradaki çizimde başlar
  }

  /** Çan çaldı: dalgalar bir sonraki çizimde başlar. */
  ring() {
    this.startedAt = -1;
  }

  /** Çan odasının dünya koordinatı (128 piksellik tam çerçeve kulenin alt kenarına hizalı). */
  static bellPoint(tower) {
    const frameTop = tower.y + tower.height - WONDER_ART.fullHeight;
    return { x: tower.x + WONDER_ART.beacon.x, y: frameTop + WONDER_ART.beacon.y };
  }

  draw(renderer, tower, time) {
    if (this.startedAt === null || !tower) return;
    if (this.startedAt < 0) this.startedAt = time;
    const t = (time - this.startedAt) / GOLDEN_AGE.chimeWaveSeconds;
    if (t >= 1 || t < 0) {
      this.startedAt = null;
      return;
    }
    const { x: cx, y: cy } = ChimeWaves.bellPoint(tower);
    for (let ring = 0; ring < RINGS; ring++) {
      const k = t * 1.6 - ring * 0.25; // halkalar sırayla çıkar
      if (k <= 0 || k >= 1) continue;
      const r = 8 + k * MAX_RADIUS;
      const alpha = (0.8 * (1 - k)).toFixed(2);
      for (let i = 0; i < DOTS; i++) {
        if ((i + ring) % 3 === 0) continue; // kesik kesik dalga
        const a = (i / DOTS) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(a) * r);
        const py = Math.round(cy + Math.sin(a) * r * 0.55);
        renderer.fillRect(px, py, 2, 1, `rgba(255, 214, 90, ${alpha})`);
      }
    }
    // Kulenin iki yanında yükselen altın notalar
    for (let i = 0; i < 6; i++) {
      const phase = (t * 1.4 + i / 6) % 1;
      const side = i % 2 ? 1 : -1;
      const x = Math.round(cx + side * (14 + (i >> 1) * 9) + Math.sin(phase * 6 + i) * 3);
      const y = Math.round(cy - 4 - phase * 34);
      if (phase > 0.85 && Math.floor(time * 8) % 2 === 0) continue;
      renderer.drawImage(getNoteSprite(i % 3 ? 'P' : 'O'), x, y);
    }
  }
}
