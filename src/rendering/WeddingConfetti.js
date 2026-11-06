// (19. aşama) Düğün kutlamasının görüntüsü (kural yok, yalnızca çizim): meydan havuzunun üstünde patlayan bir konfeti
// demeti, ardından kutlama boyunca süzülerek yağan renkli kâğıtlar ve yükselen küçük kalpler. Zaman gerçek
// zamandır (animationTime); kutlamanın kendisi state.social.party'de (SocialSystem).
const COLORS = ['#ffd23f', '#f06b8a', '#4aa3df', '#a4dd5c', '#8a6cf0', '#ff9a3c', '#ffffff'];
const PIECES = 46;
const HEARTS = 5;
const WIDTH = 96; // piksel: konfeti alanının genişliği
const FALL = 64; // piksel: konfetinin düştüğü yükseklik
const BURST_SECONDS = 1.6;

// 5x4 kalp
const HEART = ['.o.o.', 'ooooo', '.ooo.', '..o..'];

export class WeddingConfetti {
  constructor() {
    this.startKey = null;
    this.startTime = 0;
  }

  /**
   * @param {import('./Renderer.js').Renderer} renderer
   * @param {{ x: number, y: number, startedAt: number }} party
   * @param {number} time gerçek zaman (sn)
   * @param {{ left: number, top: number, right: number, bottom: number }} [view]
   */
  draw(renderer, party, time, view = null) {
    const cx = party.x;
    const cy = party.y;
    if (view && (cx < view.left - WIDTH || cx > view.right + WIDTH || cy < view.top - FALL || cy > view.bottom + FALL)) return;
    if (this.startKey !== party.startedAt) {
      this.startKey = party.startedAt;
      this.startTime = time;
    }
    const since = time - this.startTime;

    // Açılış: havuzun ortasından dört bir yana fırlayan konfeti demeti
    if (since < BURST_SECONDS) {
      const k = since / BURST_SECONDS;
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + i * 0.37;
        const r = 6 + k * (26 + (i % 5) * 4);
        const x = Math.round(cx + Math.cos(angle) * r);
        const y = Math.round(cy - 14 + Math.sin(angle) * r * 0.7 + k * k * 18);
        renderer.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 1 : 2, COLORS[i % COLORS.length]);
      }
    }

    // Süzülerek yağan kâğıtlar: her parça kendi hızında, sağa sola sallanarak düşer ve döner (1x2 / 2x1)
    for (let i = 0; i < PIECES; i++) {
      const speed = 0.16 + (i % 7) * 0.018;
      const phase = (time * speed + (i * 0.6180339) % 1) % 1;
      const baseX = cx - WIDTH / 2 + ((i * 53) % WIDTH);
      const x = Math.round(baseX + Math.sin(phase * 9 + i) * 5);
      const y = Math.round(cy - FALL + 8 + phase * FALL);
      const flip = Math.floor(time * 6 + i) % 2 === 0;
      const color = COLORS[i % COLORS.length];
      if (phase > 0.9 && Math.floor(time * 10 + i) % 2 === 0) continue; // yere değerken söner
      renderer.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2, color);
    }

    // Yükselip kaybolan küçük kalpler
    for (let i = 0; i < HEARTS; i++) {
      const phase = (time * 0.22 + i / HEARTS) % 1;
      const hx = Math.round(cx - 18 + i * 9 + Math.sin(phase * 6 + i) * 3);
      const hy = Math.round(cy - 10 - phase * 34);
      if (phase > 0.8 && Math.floor(time * 8) % 2 === 0) continue;
      HEART.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) if (row[rx] === 'o') renderer.fillRect(hx + rx, hy + ry, 1, 1, i % 2 ? '#f06b8a' : '#e8463c');
      });
    }
  }
}
