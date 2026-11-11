// Karakterleri yol noktaları boyunca yürütür. Hız; temel hız, kişilik (Çalışkan daha hızlı)
// ve üzerinde yürünen karonun hız çarpanıyla (yolda daha hızlı, kumda daha yavaş) belirlenir.
// Oyun duraklatıldığında (simDt = 0) kimse kıpırdamaz. (11. aşama) Üşüten sakin %35 yavaş, "Dinçlik"
// bonusu olan %15 hızlı yürür. (29.2) Ruh hali (c.mood.moveMul) de çarpılır.
import { CONFIG } from '../config.js';
import { healthWalkMultiplier } from './HealthSystem.js';
import { spiceWalkMultiplier } from './Luxury.js';

export class MovementSystem {
  /** @param {import('../world/World.js').World} world */
  constructor(world) {
    this.world = world;
  }

  update(tick) {
    const now = this.world.state.totalMinutes;
    // İki liste ayrı gezilir: her adımda (saniyede 60 kez) birleşik dizi kurmak çöp üretirdi
    this.step(this.world.characters, tick, now);
    this.step(this.world.visitors, tick, now);
    this.step(this.world.guests, tick, now);
  }

  step(list, tick, now) {
    for (const c of list) {
      c.animTime += tick.simDt;
      // (29.2) ruh hali yürüme hızını da etkiler (tükenmiş / yaslı ağır, dinlenmiş çevik yürür; konuklarda mood yoktur)
      if (c.waypoints && tick.simDt > 0) this.advance(c, tick.simDt * healthWalkMultiplier(c, now) * spiceWalkMultiplier(c, now) * (c.mood ? c.mood.moveMul : 1));
    }
  }

  advance(c, simDt) {
    const tileSpeed = this.world.map.getSpeedMultiplier(c.tileX, c.tileY);
    let budget = CONFIG.CHARACTER_SPEED * c.profile.speed * tileSpeed * simDt;

    while (budget > 0 && c.waypoints) {
      const target = c.waypoints[c.waypointIndex];
      const dx = target.x - c.x;
      const dy = target.y - c.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0.01) {
        if (Math.abs(dx) >= Math.abs(dy)) c.facing = dx > 0 ? 'right' : 'left';
        else c.facing = dy > 0 ? 'down' : 'up';
      }

      if (distance <= budget) {
        c.x = target.x;
        c.y = target.y;
        budget -= distance;
        c.waypointIndex++;
        if (c.waypointIndex >= c.waypoints.length) c.clearPath();
      } else {
        c.x += (dx / distance) * budget;
        c.y += (dy / distance) * budget;
        budget = 0;
      }
    }
  }
}
