// Kış ısınması ve üşüme.
//
//   - Kışın içinde sakin yaşayan her kulübe, yanan kamp ateşi ve açık (ışıkları yanan) han stoktan odun
//     yakar (data/seasons.js -> HEATING). Yalıtımlı Taş Ev %30 daha az yakar (upgrade.heatingFactor).
//     Günlük toplamı heatingPerDay() verir; HUD bunu gösterir.
//   - Odun bitince evler soğur: state.heating.cold = true, bacalardan duman tütmez, kamp ateşi söner,
//     herkes donar: keyif, enerji, açlık ve sosyallik hızla düşer, uyku ve eğlence yarım dinlendirir;
//     günlüğe uyarı düşer. Ocaklar ancak stokta yeniden HEATING.relightWood odun birikince yanar.
//   - Kışın dışarıda dolaşan sakin üşür; kendi evinde, handa ya da yanan bir kamp ateşinin yanında
//     "İçi Isındı" bonusu (buffs.warmUntil) alır ve bir süre üşümez. Azalma çarpanlarını NeedsSystem uygular;
//     kışlık paltolu sakin dışarıda %60 daha az üşür (balonu da o kadar seyrek çıkar).
// Yayınladığı olaylar: 'heating:cold' (odun bitti), 'heating:restored' (yeniden ısındı).
import { BUILDINGS } from '../data/buildings.js';
import { HEATING, getSeason } from '../data/seasons.js';
import { coldProtection } from './Equipment.js';
import { researchHeatingMultiplier } from './ResearchSystem.js';
import { relicHeatingMultiplier } from './Luxury.js';

/** Evlerin kışlık odun çarpanı: Kışlık Yalıtım araştırması × Ebedi Ateş Kandili. */
const homeHeating = (state) => researchHeatingMultiplier(state) * relicHeatingMultiplier(state);

const COLD_BUBBLE_CHANCE = 0.004; // dakika başına "üşüyorum" balonu olasılığı

/** litHours aralığının günün ne kadarı olduğu (0-1). */
function litFraction(litHours) {
  const { from, to } = litHours;
  const hours = from <= to ? to - from : 24 - from + to;
  return hours / 24;
}

/** Isınma kaynakları: [{ building, perMinute }] — şu an yakan kaynaklar ve dakikalık odun. */
export function heatingSources(state) {
  const sources = [];
  const homes = new Set(state.characters.map((c) => c.homeId));
  for (const b of state.buildings) {
    if (b.underConstruction) continue;
    if (b.type === 'cabin' && homes.has(b.id)) sources.push({ building: b, perMinute: (HEATING.homePerDay * b.stat('heatingFactor', 1) * homeHeating(state)) / 1440 });
    if (b.type === 'campfire' && b.lit) sources.push({ building: b, perMinute: HEATING.campfirePerDay / (litFraction(BUILDINGS.campfire.litHours) * 1440) });
    if (b.type === 'inn' && b.lit) sources.push({ building: b, perMinute: HEATING.innPerDay / (litFraction(BUILDINGS.inn.litHours) * 1440) });
  }
  return sources;
}

/** Kışın günde yakılacak toplam odun (yanma saatleri hesaba katılarak); kış değilse 0. */
export function heatingPerDay(state) {
  if (!getSeason(state.time.day).cold) return 0;
  const homes = new Set(state.characters.map((c) => c.homeId));
  let total = 0;
  for (const b of state.buildings) {
    if (b.underConstruction) continue;
    if (b.type === 'cabin' && homes.has(b.id)) total += HEATING.homePerDay * b.stat('heatingFactor', 1) * homeHeating(state);
    if (b.type === 'campfire') total += HEATING.campfirePerDay;
    if (b.type === 'inn') total += HEATING.innPerDay;
  }
  return total;
}

/** Kış ortasında odun bitip ocaklar söndü mü? (herkes donar; cezalar NeedsSystem ve BehaviorSystem'de) */
export function isFreezing(state) {
  return state.heating.cold && getSeason(state.time.day).cold;
}

/** Sakin şu an üşüyor mu? (kış + ya kasabada odun bitti ya da dışarıda ve içi ısınmamış) */
export function isShivering(character, state) {
  if (!getSeason(state.time.day).cold) return false;
  if (state.heating.cold) return true;
  return character.visible && (character.buffs.warmUntil ?? -1) <= state.totalMinutes;
}

export class HeatingSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   */
  constructor(game, world, economy) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.unsubscribe = game.events.on('time:seasonChanged', ({ season }) => {
      // Kış bitince ocak borcu ve soğuk durumu sıfırlanır
      if (!season.cold && this.state.heating.cold) this.setCold(false);
      if (!season.cold) this.state.heating.buffer = 0;
    });
  }

  destroy() {
    this.unsubscribe();
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    if (!getSeason(this.state.time.day).cold) return;
    const heating = this.state.heating;

    for (const source of heatingSources(this.state)) heating.buffer += source.perMinute * tick.gameMinutes;
    // Sönen ocaklar tek tük gelen odunla yanmaz; yeniden yakmak için biraz stok gerekir
    if (heating.cold && this.economy.amount('wood') < HEATING.relightWood) {
      heating.buffer = Math.min(heating.buffer, 1);
      this.warmCharacters(tick.gameMinutes);
      return;
    }
    while (heating.buffer >= 1) {
      if (this.economy.spend({ wood: 1 })) {
        heating.buffer -= 1;
        if (heating.cold) this.setCold(false);
      } else {
        heating.buffer = 1; // borç birikmez: odun gelince ilk parça yakılır
        if (!heating.cold) this.setCold(true);
        break;
      }
    }
    this.warmCharacters(tick.gameMinutes);
  }

  setCold(cold) {
    const heating = this.state.heating;
    heating.cold = cold;
    if (cold) {
      this.events.emit('heating:cold', {});
      if (heating.lastNoticeDay !== this.state.time.day) {
        heating.lastNoticeDay = this.state.time.day;
        this.events.emit('toast', { text: `Odun bitti! Ocaklar söndü, sakinler donuyor. Yeniden yakmak için en az ${HEATING.relightWood} odun topla.`, tone: 'warn', icon: 'wood' });
      }
    } else {
      this.events.emit('heating:restored', {});
    }
  }

  /** Evinde, handa ya da yanan ateşin yanında olan sakinin içi ısınır. */
  warmCharacters(minutes) {
    const state = this.state;
    if (state.heating.cold) return;
    const until = state.totalMinutes + HEATING.warmHours * 60;
    // Kamp ateşi ve (16. aşama) mavi alevli Kadim Meşale gibi ısıtan, yanan yapılar
    const fires = this.world.buildings.filter((b) => (b.type === 'campfire' || b.definition.warmAura) && b.lit);
    const radius = (f) => f.definition.warmAura?.radius ?? HEATING.warmRadius;
    // (12. aşama) Tamamlanmış Büyük Saat Kulesi geniş bir yarıçapta herkesi ısıtır
    const wonders = this.world.buildings.filter((b) => b.wonderComplete);
    for (const c of this.world.characters) {
      const inside = c.insideBuildingId ? this.world.getBuilding(c.insideBuildingId) : null;
      const warmIndoors = inside && (inside.type === 'cabin' || inside.type === 'inn' || inside.type === 'academy');
      const nearFire =
        c.visible &&
        (fires.some((f) => Math.hypot(f.center.x - c.x, f.center.y - c.y) <= radius(f)) ||
          wonders.some((w) => Math.hypot(w.center.x - c.x, w.center.y - c.y) <= w.definition.wonder.warmRadius));
      if (warmIndoors || nearFire) {
        const wasCold = (c.buffs.warmUntil ?? -1) <= state.totalMinutes;
        c.buffs.warmUntil = until;
        if (wasCold && nearFire && !c.bubble) c.showBubble('fire', 2);
      } else if (isShivering(c, state) && !c.bubble && Math.random() < COLD_BUBBLE_CHANCE * minutes * (1 - coldProtection(c))) {
        c.showBubble('cold', 2);
      }
    }
  }
}
