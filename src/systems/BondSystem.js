// (29.5) Yan yana çalışma: mesaide aynı yapıda / aynı iş emrinde birlikte çalışan sakinler arasında bağ puanına göre
// "Omuz Omuza" (dost) ya da "Diken Üstünde" (kırgın / rakip) moodlet'i doğar. Üreteç almaz, zar çekmez.
// Çiftler belleğte sayılır (kayda yazılmaz): pairs = Map('küçükId-büyükId' -> saat sayısı), yalnızca ölçüm içindir.
import { BOND_RULES } from '../data/bonds.js';
import { isWorkHours } from '../ai/TraitProfile.js';
import { engineOn } from './Engines.js';
import { bondWeight, bondExempt } from './Bonds.js';

export class BondSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ moodlets: import('./MoodletSystem.js').MoodletSystem, relationships: object }} services
   */
  constructor(game, world, { moodlets, relationships } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.moodlets = moodlets;
    this.relationships = relationships;
    this.pairs = new Map();
    this.unsubscribers = [game.events.on('time:hour', (hour) => this.onHour(Number.isFinite(hour) ? hour : this.state.time.hour))];
  }

  destroy() {
    this.unsubscribers?.forEach((off) => off());
    this.unsubscribers = null;
  }

  /** Bu sakinin şu an yan yana çalıştığı diğer sakinler. */
  coworkers(c, working) {
    const t = c.task;
    return working.filter((o) => {
      if (o === c) return false;
      const u = o.task;
      if (t.jobId) return u.jobId === t.jobId && Math.hypot(o.x - c.x, o.y - c.y) <= BOND_RULES.scanRadius;
      return t.workBuildingId && u.workBuildingId === t.workBuildingId;
    });
  }

  onHour(hour) {
    if (!engineOn('bonds') || !isWorkHours(hour)) return;
    const state = this.state;
    const working = state.characters.filter((c) => !bondExempt(c) && !c.away && !c.emigrating && c.task?.phase === 'perform' && (c.task.jobId || c.task.workBuildingId));
    for (const c of working) {
      let best = null;
      let worst = null;
      for (const o of this.coworkers(c, working)) {
        const w = bondWeight(state, c, o);
        if (!best || w > best.w || (w === best.w && o.id < best.o.id)) best = { w, o };
        if (!worst || w < worst.w || (w === worst.w && o.id < worst.o.id)) worst = { w, o };
        if (c.id < o.id && w >= BOND_RULES.sideAt) {
          const key = `${c.id}-${o.id}`;
          this.pairs.set(key, (this.pairs.get(key) ?? 0) + 1);
        }
      }
      if (best && best.w >= BOND_RULES.sideAt && !c.mood?.grief) {
        this.moodlets.apply(c, 'side_by_side', { reason: 'side_by_side', whoId: best.o.id, whoName: best.o.name, tier: best.w >= BOND_RULES.majorAt ? 'major' : 'minor' });
      } else if (worst && worst.w <= BOND_RULES.rubAt) {
        this.moodlets.apply(c, 'rubbing_wrong', { reason: 'rubbing_wrong', whoId: worst.o.id, whoName: worst.o.name });
      }
    }
  }
}
