// Sağlık (11. aşama): üşütme / halsizlik ve iyileşme. Sayılar src/data/health.js'te.
//
//   Maruziyet: kışın dışarıda üşüyen (palto korur), yağmurda ıslanan, enerjisi ya da tokluğu çok düşen sakinin
//              maruziyeti (c.exposure) birikir; sıcak bir yerde (ev, han, ateş başı) ya da iyi durumdayken azalır.
//              Eşiği aşınca küçük bir olasılıkla üşütür: 'health:fellIll' { character }.
//   Hastalık : yürüme ve çalışma %35 yavaş, enerji biraz daha çabuk düşer; başında ara sıra hapşırma / ateş
//              balonu çıkar. Kendiliğinden ~40 saatte (evinde uyurken iki kat hızlı) geçer: 'health:recovered'.
//   Tedavi   : Şifacı Kulübesi'nde iksir varsa hasta oraya gider (Brain -> planHeal), bir iksirle hemen iyileşir ve
//              12 saatlik "Dinçlik" (+%15 iş ve yürüme hızı, enerji yavaş düşer) kazanır: 'health:cured'.
// Etkileri MovementSystem (yürüme), BehaviorSystem (çalışma) ve NeedsSystem (enerji) bu dosyadaki saf
// yardımcılarla uygular.
import { ILLNESS, VIGOR } from '../data/health.js';
import { BUILDINGS } from '../data/buildings.js';
import { isRainActive } from '../data/weather.js';
import { isShivering } from './HeatingSystem.js';
import { coldProtection } from './Equipment.js';
import { clamp } from '../utils/math.js';
import { researchVigorHours } from './ResearchSystem.js';

/** Dinçlik bonusu sürüyor mu? */
export function hasVigor(c, now) {
  return (c.buffs.vigor ?? -1) > now;
}

/** Yürüme hızı çarpanı: hasta 0,65, dinç 1,15. */
export function healthWalkMultiplier(c, now) {
  if (c.illness) return ILLNESS.walkSpeed;
  return hasVigor(c, now) ? VIGOR.walkSpeed : 1;
}

/** Çalışma hızı çarpanı: hasta 0,65, dinç 1,15. */
export function healthWorkMultiplier(c, now) {
  if (c.illness) return ILLNESS.workSpeed;
  return hasVigor(c, now) ? VIGOR.workSpeed : 1;
}

/** Enerji azalma çarpanı: hasta 1,2, dinç 0,85. */
export function healthEnergyMultiplier(c, now) {
  if (c.illness) return ILLNESS.energyDecay;
  return hasVigor(c, now) ? VIGOR.energyDecay : 1;
}

export class HealthSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
  }

  update(tick) {
    const minutes = tick.gameMinutes;
    if (minutes <= 0) return;
    const state = this.state;
    const raining = isRainActive(state.weather);
    const now = state.totalMinutes;
    const e = ILLNESS.exposure;
    for (const c of this.world.characters) {
      if (c.away) continue; // seferdekiler kendi erzaklarıyla
      // Maruziyet kaynakları
      let gain = 0;
      if (isShivering(c, state)) gain += e.cold * (1 - (c.visible ? coldProtection(c) : 0));
      if (raining && c.visible && !c.profile.rainLover) gain += e.rain;
      if (c.needs.energy < ILLNESS.exhaustedBelow) gain += e.exhausted;
      if (c.needs.hunger < ILLNESS.starvingBelow) gain += e.starving;
      if (gain > 0) c.exposure = clamp(c.exposure + gain * minutes, 0, 100);
      else {
        const warm = !c.visible || (c.buffs.warmUntil ?? -1) > now;
        c.exposure = clamp(c.exposure - (warm ? e.warmRecovery : e.recovery) * minutes, 0, 100);
      }

      if (!c.illness) {
        if (c.exposure > ILLNESS.threshold && !hasVigor(c, now)) {
          const over = (c.exposure - ILLNESS.threshold) / (100 - ILLNESS.threshold);
          if (this.rng.next() < ILLNESS.chancePerMinute * over * minutes) this.fallIll(c);
        }
        continue;
      }
      // Hasta: kendiliğinden iyileşme (evinde uyurken iki kat hızlı)
      const sleepingHome = c.isSleeping && c.insideBuildingId === c.homeId;
      c.illness.remaining -= minutes * (sleepingHome ? ILLNESS.sleepRecovery : 1);
      if (c.illness.remaining <= 0) {
        c.illness = null;
        c.exposure = Math.min(c.exposure, ILLNESS.threshold / 2);
        this.events.emit('health:recovered', { character: c });
        continue;
      }
      if (c.visible && !c.bubble && this.rng.next() < ILLNESS.bubbleChance * minutes) c.showBubble(this.rng.pick(ILLNESS.bubbles), 1.8);
    }
  }

  fallIll(c) {
    c.illness = { since: this.state.totalMinutes, remaining: ILLNESS.recoveryHours * 60 };
    this.state.stats.illnesses = (this.state.stats.illnesses ?? 0) + 1;
    if (c.visible) c.showBubble('sneeze', 2.2);
    this.events.emit('health:fellIll', { character: c });
  }

  /** Hastalığı tedavi edebilecek yapılar: iksiri olan, kullanılabilir şifacı kulübeleri. */
  clinics() {
    return this.world.getCompleted().filter((b) => BUILDINGS[b.type].apothecary && !b.damaged && b.remedies > 0);
  }

  /** Bu kulübeye tedaviye gitmekte olan diğer hastalar (iksirler yolda paylaşılmasın). */
  claims(building, except) {
    return this.world.characters.filter((o) => o !== except && o.task?.activity === 'heal' && o.task.buildingId === building.id && o.task.phase === 'travel').length;
  }

  /**
   * Hasta sakin kulübeye girince bir iksir kullanılır (BehaviorSystem.enterIndoor). İksir kalmadıysa false.
   */
  takeRemedy(building) {
    if (!building || building.remedies <= 0) return false;
    building.remedies -= 1;
    building.treatedToday += 1;
    return true;
  }

  /** Tedavi bitti: hastalık geçer, maruziyet sıfırlanır, Dinçlik başlar. */
  cure(c, building = null) {
    const wasIll = Boolean(c.illness);
    c.illness = null;
    c.exposure = 0;
    c.buffs.vigor = this.state.totalMinutes + (researchVigorHours(this.state) ?? VIGOR.hours) * 60;
    c.showBubble('sparkle', 2.2);
    this.state.stats.cured = (this.state.stats.cured ?? 0) + 1;
    this.events.emit('health:cured', { character: c, building, wasIll });
  }
}
