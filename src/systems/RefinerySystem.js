// (24.2) Katma değerli üretim: Dokuma Tezgâhı ve Şerbethane'nin kasaba içindeki kullanımı. Sayılar data/refinery.js'te,
// saf hesaplar ./Refinery.js'te. Tezgâh ve mahzenin kendisi işleme yapısıdır (BehaviorSystem.process; StructureSystem
// malzeme yokken ya da kasaba açken boşta bırakır).
//
//   Han ikmali  : her saat başı, işleyen her hana kasaba deposundan en çok 2 fıçı şerbet taşınır (handa en çok 12 fıçı).
//   Handa şerbet: handa oturup sohbet etmeye başlayan sakin ('citizen:innVisit') handa fıçı varsa bir bardak içer: +15 keyif,
//                 handa kaldığı sürece keyif ve sosyallik iki kat hızlı dolar (task.sherbet; BehaviorSystem) ve ertesi gün
//                 12:00'ye kadar "Keyifli Damak" morali (keyfi yavaş düşer; NeedsSystem). Kesesi yeterse ve handa en az 3 fıçı
//                 varsa çantasına bir Şerbet Testisi alır (testi yoksa).
//   Testi       : çantasında testi olan uyanık sakinin keyfi 35'in altına inince saat başı testiden içer (+15 keyif).
//   Giysi       : Pazar Yeri'nde kasabanın kumaşından Dayanıklı Giysi dikilir (PurseSystem.shop).
// Rastgelelik yoktur: hiçbir üretecin sırası değişmez.
import { INN_SHERBET, SHERBET_JUG } from '../data/refinery.js';
import { addItem, takeItem, countItem, roomFor, payCoins } from './Citizens.js';
import { palateUntil } from './Refinery.js';
import { clamp } from '../utils/math.js';
import { TEMPERAMENT } from '../data/temperament.js';

export class RefinerySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem }} services
   */
  constructor(game, world, { economy }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.unsubscribers = [
      game.events.on('citizen:innVisit', ({ character, task, building }) => this.serve(character, task, building)),
      game.events.on('time:hour', () => this.hourly()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  hourly() {
    this.restock();
    this.drinkJugs();
  }

  /** Kasaba deposundan hanlara fıçı taşır. Dönüş: taşınan fıçı. */
  restock() {
    let moved = 0;
    for (const inn of this.world.getCompleted('inn')) {
      if (!inn.functional || inn.damaged || inn.isBurning) continue;
      const want = Math.min(INN_SHERBET.restockPerHour, INN_SHERBET.capacity - inn.sherbet, this.economy.amount('sherbet'));
      if (want <= 0) continue;
      if (!this.economy.spend({ sherbet: want })) continue;
      inn.sherbet += want;
      moved += want;
    }
    return moved;
  }

  /** Handa sohbete oturan sakine bir bardak fıçı şerbeti. Dönüş: içti mi. */
  serve(c, task, inn) {
    if (!c || !task || !inn || inn.type !== 'inn' || inn.sherbet < 1) return false;
    inn.sherbet -= 1;
    task.sherbet = true;
    const now = this.state.totalMinutes;
    c.needs.fun = clamp(c.needs.fun + INN_SHERBET.fun, 0, 100);
    c.buffs.merryPalate = palateUntil(now);
    const stats = this.state.stats;
    stats.sherbetServed = (stats.sherbetServed ?? 0) + 1;
    if (c.visible) c.showBubble('sherbet', 2);
    this.events.emit('citizen:sherbet', { character: c, building: inn });
    // Kesesi yetiyorsa çantasına bir testi alır
    // (25.3) Şenlik Neşesi'nin çantasında testi eksik olmaz: fıçı azken de alır, iki testi taşır
    const festive = c.quirk === 'festive';
    if (!c.isChild && countItem(c, 'sherbetJug') < (festive ? TEMPERAMENT.festiveJugs : 1) && inn.sherbet >= (festive ? TEMPERAMENT.festiveJugMin : SHERBET_JUG.minCasks) && (c.coins ?? 0) >= SHERBET_JUG.price && roomFor(c, 'sherbetJug') > 0) {
      if (addItem(c, 'sherbetJug', 1) === 1) {
        inn.sherbet -= 1;
        payCoins(c, SHERBET_JUG.price);
        stats.purchases = (stats.purchases ?? 0) + 1;
        stats.sherbetJugs = (stats.sherbetJugs ?? 0) + 1;
        this.events.emit('citizen:bought', { character: c, kind: 'sherbetJug', price: SHERBET_JUG.price, building: inn });
      }
    }
    return true;
  }

  /** Keyfi düşen sakin çantasındaki testiden içer. Dönüş: içen sayısı. */
  drinkJugs() {
    let n = 0;
    for (const c of this.world.characters) {
      if (c.away || c.isSleeping || c.needs.fun >= (c.quirk === 'festive' ? TEMPERAMENT.festiveDrinkBelow : SHERBET_JUG.drinkBelowFun) || countItem(c, 'sherbetJug') <= 0) continue;
      if (takeItem(c, 'sherbetJug', 1) !== 1) continue;
      c.needs.fun = clamp(c.needs.fun + SHERBET_JUG.fun, 0, 100);
      this.state.stats.jugsDrunk = (this.state.stats.jugsDrunk ?? 0) + 1;
      if (c.visible) c.showBubble('sherbet', 1.8);
      n++;
    }
    return n;
  }
}
