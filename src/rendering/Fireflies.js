// Ateşböcekleri: açık gecelerde (20:00-04:00) ormanların ve nehir kıyısının çevresinde
// süzülüp sarı-yeşil yanıp sönen parçacıklar. Görünürlüğü hava ve saat belirler
// (data/weather.js -> fireflyIntensity); burası yalnızca konumları ve çizimi yönetir.
import { Random } from '../utils/random.js';

const FLIES_PER_SWARM = 11;
const FOREST_SWARMS = 12;
const RIVER_SWARMS = 7;
const SWARM_SPACING = 5;     // iki sürü merkezi arası en az karo
const SWARM_SPREAD = 22;     // sürüdeki böceklerin merkezden en fazla uzaklığı (piksel)
const REFRESH_SECONDS = 6;   // harita değişince (ağaç kesildi vb.) çıpalar yenilenir
const TILE = 16;

export class FireflyField {
  constructor(seed) {
    this.rng = new Random(seed + 777);
    this.flies = [];
    this.sinceRefresh = REFRESH_SECONDS;
  }

  /**
   * Ağaç karolarından ve su kenarındaki kumdan sürü merkezleri seçer (birbirinden uzak); her sürü,
   * merkezinin çevresinde süzülen birkaç ateşböceğinden oluşur. Böylece ormanın ve kıyının
   * kenarlarında yoğun, aralarda boş parıltı kümeleri oluşur.
   */
  refresh(map) {
    const forest = [];
    const river = [];
    const open = map.openBounds; // (34.1) yalnızca açık alan
    for (let y = open.y0; y < open.y1; y++) {
      for (let x = open.x0; x < open.x1; x++) {
        const object = map.getObject(x, y);
        if (object === 'oak' || object === 'pine') forest.push({ x, y });
        else if (map.get(x, y) === 'sand' && nearWater(map, x, y)) river.push({ x, y });
      }
    }
    const rng = new Random(this.rng.state);
    const centers = [...pickSpread(forest, FOREST_SWARMS, rng), ...pickSpread(river, RIVER_SWARMS, rng)];
    this.flies = [];
    for (const center of centers) {
      for (let i = 0; i < FLIES_PER_SWARM; i++) {
        this.flies.push({
          ax: center.x * TILE + 8 + (rng.next() - 0.5) * 2 * SWARM_SPREAD,
          ay: center.y * TILE + 6 + (rng.next() - 0.5) * SWARM_SPREAD,
          rx: 5 + rng.next() * 12,
          ry: 3 + rng.next() * 7,
          fx: 0.25 + rng.next() * 0.35,
          fy: 0.2 + rng.next() * 0.3,
          phase: rng.next() * Math.PI * 2,
          blink: 0.8 + rng.next() * 1.4,
          height: 4 + rng.next() * 10,
        });
      }
    }
  }

  update(dt, map) {
    this.sinceRefresh += dt;
    if (this.sinceRefresh >= REFRESH_SECONDS) {
      this.sinceRefresh = 0;
      this.refresh(map);
    }
  }

  /** Dünya koordinatında, gece örtüsünün üstünde (parıltı toplamsal karışımla). */
  /** density (0-1): mevsime göre görünen böcek oranı (yazın hepsi, ilkbaharda yarısı...). */
  draw(renderer, view, intensity, time, density = 1) {
    if (intensity <= 0.01 || density <= 0) return;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.flies.length; i++) {
      if ((i * 37) % 100 >= density * 100) continue;
      const f = this.flies[i];
      const x = f.ax + Math.cos(time * f.fx + f.phase) * f.rx;
      const y = f.ay - f.height + Math.sin(time * f.fy + f.phase * 1.7) * f.ry;
      if (x < view.left - 6 || x > view.right + 6 || y < view.top - 6 || y > view.bottom + 6) continue;
      // Yumuşak açılıp kapanan, ortasında parlak bir plato olan yanıp sönme
      const pulse = Math.min(1, Math.max(0, Math.sin(time * f.blink + f.phase * 3) * 1.8));
      const glow = pulse * intensity;
      if (glow < 0.04) continue;
      const px = Math.round(x);
      const py = Math.round(y);
      // Yumuşak sarı-yeşil hale (haç biçimli), orta parıltı ve parlak çekirdek
      ctx.fillStyle = `rgba(190, 230, 60, ${(0.22 * glow).toFixed(3)})`;
      ctx.fillRect(px - 3, py, 7, 1);
      ctx.fillRect(px, py - 3, 1, 7);
      ctx.fillStyle = `rgba(200, 235, 70, ${(0.5 * glow).toFixed(3)})`;
      ctx.fillRect(px - 1, py - 1, 3, 3);
      ctx.fillStyle = `rgba(244, 255, 154, ${(0.95 * glow).toFixed(3)})`;
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.restore();
  }
}

function nearWater(map, x, y) {
  return map.get(x - 1, y) === 'water' || map.get(x + 1, y) === 'water' || map.get(x, y - 1) === 'water' || map.get(x, y + 1) === 'water';
}

/** Listeden birbirinden en az SWARM_SPACING karo uzak, en çok `count` rastgele nokta seçer. */
function pickSpread(points, count, rng) {
  const picked = [];
  for (const p of rng.shuffle([...points])) {
    if (picked.length >= count) break;
    if (picked.every((q) => Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)) >= SWARM_SPACING)) picked.push(p);
  }
  return picked;
}
