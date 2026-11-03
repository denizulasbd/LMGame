// Doğanın kendini yenilemesi: kesilen ağacın yerinde kalan kütükten zamanla fidan,
// fidandan da yeniden ağaç çıkar; kasaba tamamen çölleşmez. Yağmur yağarken büyüme hızlanır.
// Kayıtlar GameState.regrowth'ta tutulur: { x, y, tree, stage: 'stump'|'sapling', hours }
import { TREE_REGROWTH } from '../data/tiles.js';
import { RAIN_EFFECTS, isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';

export class NatureSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world) {
    this.state = game.state;
    this.world = world;
    this.unsubscribe = game.events.on('job:completed', ({ job }) => {
      if (job.type === 'chop') this.state.regrowth.push({ x: job.x, y: job.y, tree: job.object, stage: 'stump', hours: 0 });
    });
  }

  destroy() {
    this.unsubscribe();
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const map = this.world.map;
    let changed = false;
    // Yağmur büyümeyi hızlandırır; mevsim de etkiler (ilkbaharda hızlı, kışın durur)
    const growth = (isRainActive(this.state.weather) ? RAIN_EFFECTS.growthMultiplier : 1) * getSeason(this.state.time.day).growth;

    this.state.regrowth = this.state.regrowth.filter((entry) => {
      // Üzerine yapı / yol kurulduysa ya da kütük temizlendiyse büyüme biter
      if (map.getObject(entry.x, entry.y) !== entry.stage || map.getOccupant(entry.x, entry.y) !== 0) return false;
      entry.hours += (tick.gameMinutes / 60) * growth;

      if (entry.stage === 'stump' && entry.hours >= TREE_REGROWTH.stumpHours) {
        map.setObject(entry.x, entry.y, 'sapling');
        entry.stage = 'sapling';
        entry.hours = 0;
      } else if (entry.stage === 'sapling' && entry.hours >= TREE_REGROWTH.saplingHours) {
        // Üzerinde biri duruyorsa ağaç onun içinden çıkmasın; bir sonraki adımda tekrar dener
        if (this.world.charactersOnTile(entry.x, entry.y).length > 0) return true;
        map.setObject(entry.x, entry.y, entry.tree);
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) this.world.refreshStaticData();
  }
}
