// Sonbaharda ağaçlardan dökülüp rüzgârda süzülen yapraklar (yalnızca çizim). Yapraklar görünen
// alandaki meşe ağaçlarının tepesinden kopar, salınarak yere iner, bir süre yerde kalıp solar.
const MAX_LEAVES = 46;
const SPAWN_PER_SECOND = 9;
const FALL_SPEED = 9;      // dünya pikseli / saniye
const WIND = 7;            // sağa doğru sürüklenme
const GROUND_SECONDS = 2.5;
const LEAF_COLORS = ['#d4652a', '#9c3424', '#f0a830', '#f6d860'];
const TILE = 16;

export class LeafFall {
  constructor() {
    this.leaves = [];
    this.budget = 0;
  }

  update(dt, active, camera, renderer, map) {
    for (const leaf of this.leaves) {
      leaf.age += dt;
      if (leaf.landed) continue;
      leaf.y += FALL_SPEED * leaf.speed * dt;
      leaf.x += (WIND + Math.sin(leaf.age * 2.4 + leaf.phase) * 14) * dt;
      if (leaf.y >= leaf.groundY) {
        leaf.landed = true;
        leaf.landedAt = leaf.age;
      }
    }
    this.leaves = this.leaves.filter((l) => !l.landed || l.age - l.landedAt < GROUND_SECONDS);
    if (!active) return;

    this.budget += SPAWN_PER_SECOND * dt;
    while (this.budget >= 1) {
      this.budget -= 1;
      if (this.leaves.length < MAX_LEAVES) this.spawn(camera, renderer, map);
    }
  }

  /** Görünen alanda rastgele bir meşe bulup tepesinden bir yaprak koparır. */
  spawn(camera, renderer, map) {
    const view = camera.getViewBounds(renderer.width, renderer.height);
    for (let attempt = 0; attempt < 8; attempt++) {
      const x = Math.floor((view.left + Math.random() * (view.right - view.left)) / TILE);
      const y = Math.floor((view.top + Math.random() * (view.bottom - view.top + 2 * TILE)) / TILE);
      if (map.getObject(x, y) !== 'oak') continue;
      this.leaves.push({
        x: x * TILE + 3 + Math.random() * 10,
        y: y * TILE - 18 + Math.random() * 8,
        groundY: y * TILE + 14 + Math.random() * 10,
        speed: 0.7 + Math.random() * 0.6,
        phase: Math.random() * 6,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        age: 0,
        landed: false,
      });
      return;
    }
  }

  /** Dünya koordinatında; yaprak salındıkça iki piksel yatay ya da dikey görünür (döner gibi). */
  draw(renderer) {
    for (const leaf of this.leaves) {
      const x = Math.round(leaf.x);
      const y = Math.round(leaf.y);
      if (leaf.landed) {
        const alpha = Math.max(0, 1 - (leaf.age - leaf.landedAt) / GROUND_SECONDS);
        renderer.ctx.globalAlpha = alpha;
        renderer.fillRect(x, y, 2, 1, leaf.color);
        renderer.ctx.globalAlpha = 1;
        continue;
      }
      const flat = Math.sin(leaf.age * 4 + leaf.phase) > 0;
      renderer.fillRect(x, y, flat ? 2 : 1, flat ? 1 : 2, leaf.color);
    }
  }
}
