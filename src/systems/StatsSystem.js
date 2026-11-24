// Kasaba Arşivi (13. aşama): her gün başında kasabanın kısa bir özetini state.history'ye yazar (Kasaba Arşivi
// panelinin grafikleri bunu çizer) ve olay sayaçlarını tutar (düğün, doğum). En çok CONFIG.HISTORY_DAYS gün saklanır.
//   özet: { day, population, children, welfare, stock, gold, buildings }
//     welfare: kasabanın ortalama refahı (TownLevelSystem'in yürüyen ortalaması; yoksa anlık refah)
//     stock  : altın dışındaki tüm kaynakların toplamı
import { CONFIG } from '../config.js';
import { RESOURCES } from '../data/resources.js';
import { townHappiness } from './TownStatus.js';
import { engineOn } from './Engines.js';

/** Kasabanın şu anki özeti (arşiv satırı). */
export function townSnapshot(state) {
  const stock = Object.entries(state.resources).reduce((sum, [r, v]) => sum + (RESOURCES[r]?.treasury ? 0 : v), 0);
  return {
    day: state.time.day,
    population: state.characters.length,
    children: state.characters.filter((c) => c.isChild).length,
    welfare: Math.round(state.town?.welfare ?? townHappiness(state)),
    stock,
    gold: state.resources.gold ?? 0,
    buildings: state.buildings.filter((b) => b.functional && b.definition.buildable).length,
    ...(engineOn('renown') ? { reputation: Math.round(state.crown?.reputation ?? 50) } : {}), // (32.3) RenownSystem gün dönümü kaymasından sonra günceller
  };
}

export class StatsSystem {
  /** @param {import('../core/Game.js').Game} game */
  constructor(game) {
    this.state = game.state;
    this.events = game.events;
    const stats = this.state.stats;
    this.unsubscribers = [
      game.events.on('time:newDay', () => this.record()),
      game.events.on('relationship:married', () => (stats.weddings = (stats.weddings ?? 0) + 1)),
      game.events.on('family:childBorn', () => (stats.births = (stats.births ?? 0) + 1)),
    ];
    // Arşiv boşsa (yeni oyun ya da eski kayıt) bugünün özeti hemen yazılır
    const last = this.state.history[this.state.history.length - 1];
    if (!last || last.day < this.state.time.day) this.record();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  record() {
    const history = this.state.history;
    const snapshot = townSnapshot(this.state);
    if (history.length && history[history.length - 1].day === snapshot.day) history[history.length - 1] = snapshot;
    else history.push(snapshot);
    if (history.length > CONFIG.HISTORY_DAYS) history.splice(0, history.length - CONFIG.HISTORY_DAYS);
    this.events.emit('stats:recorded', snapshot);
  }
}
