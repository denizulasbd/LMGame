// Koyun Ağılı'ndaki sürü (10. aşama). Yalnızca görseldir: kayda girmez, yükleme sonrası yeniden doğar.
// Koyunlar oyun zamanıyla (hız düğmesine uyar, duraklatınca durur) ağılın içinde dolaşır:
//   otlama (baş eğik, çiğner) -> kısa bir yürüyüş -> durup etrafa bakma -> yeniden otlama
// Akşam karanlığında (20:30-05:30) ahırın önündeki yataklarına yürüyüp yatarlar, sabah kalkarlar.
// Kışın ve yağmurda ahıra yakın dolaşırlar. İlkbaharda (data/buildings.js -> flock.lambSeasons) bir kuzu
// annesinin peşinden koşturur. Çizimi Building.queueDraw çağırır (ağılın iki katmanı arasında).
import { BUILDINGS } from '../data/buildings.js';
import { SHEEP_FARM_ART, getSheepSprite } from '../art/sprites/structuresFarm.js';

const WALK_SPEED = 5; // dünya pikseli / oyun-hızlı saniye (sakinler 28)
const LAMB_SPEED = 8;
const NIGHT = { from: 20.5, to: 5.5 };
const SEPARATION = 7; // iki koyun bu kadar pikselden fazla iç içe girmesin
const STEP_SECONDS = 0.18; // yürürken bacak karesi

export class Flock {
  /** @param {import('./Building.js').Building} building */
  constructor(building) {
    this.building = building;
    this.seed = (building.id * 2654435761) >>> 0 || 1;
    const def = BUILDINGS[building.type].flock;
    this.sheep = [];
    for (let i = 0; i < def.sheep; i++) this.sheep.push(this.spawn(false, i));
    this.lamb = null;
  }

  /** Küçük tohumlu sayı üreteci (her ağıl kendi düzeninde dolaşır). */
  rand() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  spawn(lamb, index) {
    const { pen } = SHEEP_FARM_ART;
    const point = this.randomPoint(pen);
    return {
      lamb,
      index,
      x: point.x,
      y: point.y,
      tx: point.x,
      ty: point.y,
      facing: this.rand() < 0.5 ? 'left' : 'right',
      state: 'graze',
      timer: 1 + this.rand() * 6,
      anim: this.rand() * 3,
    };
  }

  randomPoint(area) {
    return { x: area.left + this.rand() * (area.right - area.left), y: area.top + this.rand() * (area.bottom - area.top) };
  }

  /** Gündüz dolaşılacak alan: kışın ve yağmurda ahıra yakın (sol üst yarı). */
  wanderArea(season, raining) {
    const { pen } = SHEEP_FARM_ART;
    if (season === 'winter' || raining) return { left: pen.left, right: pen.left + (pen.right - pen.left) * 0.6, top: pen.top, bottom: pen.top + (pen.bottom - pen.top) * 0.55 };
    return pen;
  }

  /**
   * @param {{ simDt: number, hour: number }} tick
   * @param {string} season mevsim anahtarı
   * @param {boolean} raining
   */
  update(tick, season, raining) {
    const dt = tick.simDt;
    if (dt <= 0) return;
    const def = BUILDINGS[this.building.type].flock;
    const night = tick.hour >= NIGHT.from || tick.hour < NIGHT.to;

    // İlkbaharda bir kuzu annesinin (ilk koyun) peşinden gelir; mevsim geçince büyüyüp sürüye karışır
    const lambSeason = (def.lambSeasons ?? []).includes(season);
    if (lambSeason && !this.lamb) this.lamb = this.spawn(true, this.sheep.length);
    if (!lambSeason) this.lamb = null;

    const area = this.wanderArea(season, raining);
    for (const s of this.sheep) this.step(s, dt, night, area, s.index);
    if (this.lamb) this.stepLamb(this.lamb, dt, night);
    this.separate();
  }

  step(s, dt, night, area, index) {
    s.anim += dt;
    if (night) {
      const bed = SHEEP_FARM_ART.beds[index % SHEEP_FARM_ART.beds.length];
      if (s.state !== 'sleep') {
        s.tx = bed.x;
        s.ty = bed.y;
        if (this.moveToward(s, dt, WALK_SPEED)) s.state = 'sleep';
        else s.state = 'walk';
      }
      return;
    }
    if (s.state === 'sleep') {
      // Sabah: biraz gerinip otlamaya başlar
      s.state = 'idle';
      s.timer = 1 + this.rand() * 3;
    }
    if (s.state === 'walk') {
      if (this.moveToward(s, dt, WALK_SPEED)) {
        s.state = this.rand() < 0.75 ? 'graze' : 'idle';
        s.timer = s.state === 'graze' ? 4 + this.rand() * 9 : 1.5 + this.rand() * 3;
      }
      return;
    }
    s.timer -= dt;
    if (s.timer > 0) return;
    const roll = this.rand();
    if (roll < 0.6) {
      // Yakında taze bir tutama yürür (ağılın içinde kalır)
      const angle = this.rand() * Math.PI * 2;
      const reach = 6 + this.rand() * 12;
      s.tx = clamp(s.x + Math.cos(angle) * reach, area.left, area.right);
      s.ty = clamp(s.y + Math.sin(angle) * reach * 0.6, area.top, area.bottom);
      s.state = 'walk';
    } else if (roll < 0.85) {
      s.state = 'graze';
      s.timer = 3 + this.rand() * 8;
    } else {
      s.state = 'idle';
      s.timer = 1 + this.rand() * 3;
      if (this.rand() < 0.5) s.facing = s.facing === 'left' ? 'right' : 'left';
    }
  }

  /** Kuzu annesinin yanında koşturur; gece annesinin dibinde yatar. */
  stepLamb(lamb, dt, night) {
    const mother = this.sheep[0];
    lamb.anim += dt;
    const side = mother.facing === 'left' ? 7 : -7;
    lamb.tx = mother.x + side;
    lamb.ty = mother.y + 3;
    const arrived = this.moveToward(lamb, dt, LAMB_SPEED, 2);
    if (night && mother.state === 'sleep') lamb.state = arrived ? 'sleep' : 'walk';
    else if (!arrived) lamb.state = 'walk';
    else if (lamb.state === 'walk' || lamb.state === 'sleep') {
      lamb.state = mother.state === 'graze' ? 'graze' : 'idle';
      lamb.facing = mother.facing;
    }
  }

  /** Hedefe doğru yürür; vardıysa true. */
  moveToward(s, dt, speed, tolerance = 0.6) {
    const dx = s.tx - s.x;
    const dy = s.ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= tolerance) return true;
    const stepLength = Math.min(dist, speed * dt);
    s.x += (dx / dist) * stepLength;
    s.y += (dy / dist) * stepLength;
    if (Math.abs(dx) > 0.3) s.facing = dx < 0 ? 'left' : 'right';
    return false;
  }

  /** Üst üste binen koyunları biraz iter (uyuyanlar ve yürüyenler hariç). */
  separate() {
    const { pen } = SHEEP_FARM_ART;
    const all = this.lamb ? [...this.sheep, this.lamb] : this.sheep;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (a.state === 'sleep' || b.state === 'sleep' || a.lamb || b.lamb) continue;
        const dx = b.x - a.x;
        const dy = (b.y - a.y) * 1.6;
        const d = Math.hypot(dx, dy);
        if (d >= SEPARATION || d === 0) continue;
        const push = (SEPARATION - d) * 0.05;
        const mover = a.state === 'walk' ? b : a;
        const sign = mover === a ? -1 : 1;
        mover.x = clamp(mover.x + sign * (dx / d) * push, pen.left, pen.right);
        mover.y = clamp(mover.y + sign * (dy / d) * push * 0.6, pen.top - 2, pen.bottom);
      }
    }
  }

  /** Koyunun o anki görsel pozu. */
  poseOf(s) {
    if (s.state === 'sleep') return 'sleep';
    if (s.state === 'walk') return Math.floor(s.anim / STEP_SECONDS) % 2 === 0 ? 'walk0' : 'walk1';
    if (s.state === 'graze') return Math.floor(s.anim / 0.7) % 3 === 2 ? 'graze1' : 'graze0';
    return 'stand';
  }

  /** Koyunları derinlik kuyruğuna ekler (bx, by: yapının sol üst köşesinin dünya pikseli). */
  queueDraw(queue, bx, by) {
    // Kurtlar ağıla daldıysa (yapı hasarlı) koyunların çoğu kaçmıştır: onarılana kadar ikisi kalır
    const flock = this.building.damaged ? this.sheep.slice(0, 2) : this.sheep;
    const all = this.lamb && !this.building.damaged ? [...flock, this.lamb] : flock;
    for (const s of all) {
      const sprite = getSheepSprite(this.poseOf(s), s.facing, s.lamb);
      const x = Math.round(bx + s.x - sprite.width / 2);
      const y = Math.round(by + s.y - sprite.height + 1);
      queue.addImage(by + s.y, sprite, x, y);
    }
  }

  /** Uyuyan koyunlar (Building, gece başlarının üstünde küçük "z" çizer). */
  sleepers() {
    const all = this.lamb ? [...this.sheep, this.lamb] : this.sheep;
    return all.filter((s) => s.state === 'sleep');
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
