// (21. aşama) Kişisel kese ve çanta. Sayılar src/data/citizens.js'te, saf yardımcılar ./Citizens.js'te.
//
//   Yevmiye   : biten her vardiya ('work:shiftEnded'), bitirilen hasat / inşaat işi ('work:jobDone') ve usta işi eser
//               ('masterwork:created') sakinin kesesine küçük bir pay ekler. Kasaba hazinesinden ödenmez.
//   Pay       : fırıncı ekmek, bahçıvan meyve, şifacı şifalı ot, balıkçı erzak alır (kaynaklıysa kasaba stoğundan düşer).
//   Alışveriş : Pazar Yeri'nde (Brain -> planShop) meyve, şifalı ot ya da hatıra; handa yemekten sonra azık (Börek).
//               Harcanan para esnafa gider (hazineye girmez).
//   Çanta     : acıkan sakin çantasından yer ('snack'), üşüten şifalı ot demler ('herbTea'), keyfi düşen hatırasına
//               bakar ('keepsake'). Etkiler etkinlik bitince uygulanır (BehaviorSystem 'finishEvent' yayınlar).
// Durum sakinlerdedir (c.coins, c.inventory); sayaçlar state.stats'tadır (wagesPaid, purchases, bagMeals).
import { PURSE, ITEMS, INVENTORY, SHIFT_SHARES, SHOP, SOUVENIRS } from '../data/citizens.js';
import { addCoins, payCoins, addItem, takeItem, countItem, roomFor, foodSlots } from './Citizens.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';
import { GARMENT } from '../data/refinery.js';
import { getSeason } from '../data/seasons.js';
import { TEMPERAMENT } from '../data/temperament.js';

export class PurseSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   * @param {import('../utils/random.js').Random} rng  Brain de bu katmanın kararlarında (alışveriş, çantadan yemek) bunu kullanır
   */
  constructor(game, world, economy, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.rng = rng;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('work:shiftEnded', ({ character, building }) => this.onShift(character, building)),
      on('work:jobDone', ({ character, job }) => this.pay(character, job.type === 'build' ? PURSE.wage.build : PURSE.wage.harvest)),
      on('masterwork:created', ({ character }) => this.pay(character, PURSE.wage.masterwork)), // kutlama balonu ustanındır
      on('citizen:snack', ({ character, task }) => this.snack(character, task.bagItem)),
      on('citizen:herbTea', ({ character }) => this.herbTea(character)),
      on('citizen:keepsake', ({ character }) => this.keepsake(character)),
      on('citizen:shop', ({ character, building }) => this.shop(character, building)),
      on('citizen:innMeal', ({ character, building }) => this.takeaway(character, building)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Keseye yevmiye öder (çocuklar ve ziyaretçiler hariç). Ödenen miktar. */
  pay(c, amount) {
    if (!c || c.isChild || c.role || amount <= 0) return 0;
    // (25.3) Girişimci Kanı: her yevmiyede pazarlık payı
    const paid = addCoins(c, amount + (c.quirk === 'entrepreneur' ? TEMPERAMENT.thriftBonus : 0));
    this.state.stats.wagesPaid = (this.state.stats.wagesPaid ?? 0) + paid;
    return paid;
  }

  /** Vardiya bitti: yevmiye ve iş yerinden küçük bir pay. */
  onShift(c, building) {
    this.pay(c, PURSE.wage.shift);
    if (!c || c.isChild || !building) return;
    const share = SHIFT_SHARES[building.type];
    if (!share || this.rng.next() >= share.chance) return;
    const def = ITEMS[share.item];
    if (def.food && foodSlots(c) >= INVENTORY.foodKeep && countItem(c, share.item) === 0) return;
    if (roomFor(c, share.item) <= 0) return;
    if (share.from) {
      if (this.economy.amount(share.from) < share.min) return;
      if (addItem(c, share.item, 1) === 1) this.economy.spend({ [share.from]: 1 });
    } else if (building.type === 'healerHut') {
      // Şifacı kulübenin ot stoğundan bir demet alır (stok azsa almaz)
      if ((building.herbs ?? 0) < 3) return;
      if (addItem(c, 'herb', 1) === 1) building.herbs -= 1;
    } else {
      addItem(c, share.item, 1);
    }
  }

  /** Çantadan yemek: tokluğu dolana kadar (en çok 3 birim) yer. */
  snack(c, kind) {
    const def = ITEMS[kind];
    if (!def?.food || countItem(c, kind) <= 0) return 0;
    const want = Math.max(1, Math.min(3, Math.ceil((100 - c.needs.hunger) / def.hunger)));
    const eaten = takeItem(c, kind, Math.min(want, countItem(c, kind)));
    c.needs.hunger = clamp(c.needs.hunger + eaten * def.hunger, 0, 100);
    this.state.stats.bagMeals = (this.state.stats.bagMeals ?? 0) + 1;
    if (c.visible) c.showBubble('apple', 1.8);
    this.events.emit('citizen:ate', { character: c, kind, eaten });
    return eaten;
  }

  /** Üşüten sakin çantasındaki şifalı otu demleyip içer: hastalığı çabuk geçer, maruziyeti azalır. */
  herbTea(c) {
    if (takeItem(c, 'herb', 1) !== 1) return false;
    if (c.illness) c.illness.remaining *= 1 - ITEMS.herb.heal;
    c.exposure = Math.max(0, (c.exposure ?? 0) - 30);
    if (c.visible) c.showBubble('herb', 2);
    this.events.emit('citizen:healed', { character: c });
    return true;
  }

  /** Hatırasına bakıp gülümser (hatıra yenmez). */
  keepsake(c) {
    if (countItem(c, 'souvenir') <= 0) return false;
    c.needs.fun = clamp(c.needs.fun + ITEMS.souvenir.fun, 0, 100);
    c.lastKeepsakeAt = this.state.totalMinutes;
    if (c.visible) c.showBubble('heart', 1.8);
    return true;
  }

  /**
   * Pazar Yeri'nde alışveriş: ihtiyaca göre şifalı ot (hasta ya da üşümüşse), hatıra (hiç yoksa ve kesesi bolsa) ya da
   * meyve (çantada yiyecek azsa). Dönüş: alınan eşya türü ya da null.
   */
  shop(c, building) {
    if (!c || c.isChild || !building?.functional) return null;
    const prices = SHOP.prices;
    const options = [];
    if ((c.illness || (c.exposure ?? 0) > 40) && countItem(c, 'herb') === 0) options.push('herb');
    // Kesesi bolsa ve hiç hatırası yoksa önce kendine küçük bir hatıra alır
    if (countItem(c, 'souvenir') === 0 && (c.coins ?? 0) >= prices.souvenir + 2) options.push('souvenir');
    // (24.2) Sonbaharda ve kışta kasabanın kumaşından Dayanıklı Giysi diktirir (terzi tezgâhı)
    const season = getSeason(this.state.time.day).key;
    if (GARMENT.seasons.includes(season) && countItem(c, 'garment') === 0 && this.economy.amount('cloth') >= GARMENT.cloth) options.push('garment');
    if (foodSlots(c) < INVENTORY.foodKeep) options.push('fruit');
    if (options.length === 0) options.push('fruit');
    // (25.3) Zanaatkâr Ruhu önce tezgâhı için malzeme bakar (çantasında yoksa bir avuç Acemi Çivisi)
    if (c.quirk === 'craftsman' && countItem(c, TEMPERAMENT.craftShop.item) === 0) options.unshift('craft');
    for (const kind of options) {
      // (25.3) Girişimci Kanı kesesini korur: alışveriş sonrası thriftReserve'den azı kalacaksa (ilaç dışında) almaz
      if (c.quirk === 'entrepreneur' && kind !== 'herb' && (c.coins ?? 0) - (prices[kind] ?? GARMENT.price) < TEMPERAMENT.thriftReserve) continue;
      if (kind === 'craft') {
        const { item, price } = TEMPERAMENT.craftShop;
        if ((c.coins ?? 0) < price || roomFor(c, item) <= 0 || addItem(c, item, 1) !== 1) continue;
        payCoins(c, price);
        this.state.stats.purchases = (this.state.stats.purchases ?? 0) + 1;
        this.events.emit('citizen:bought', { character: c, kind: item, price, building });
        return item;
      }
      if (kind === 'garment') {
        if ((c.coins ?? 0) < GARMENT.price || roomFor(c, 'garment') <= 0 || !this.economy.spend({ cloth: GARMENT.cloth })) continue;
        addItem(c, 'garment', 1);
        payCoins(c, GARMENT.price);
        this.state.stats.purchases = (this.state.stats.purchases ?? 0) + 1;
        this.state.stats.garments = (this.state.stats.garments ?? 0) + 1;
        if (c.visible) c.showBubble('cloth', 2);
        this.events.emit('citizen:bought', { character: c, kind, price: GARMENT.price, building });
        return kind;
      }
      if ((c.coins ?? 0) < prices[kind] || roomFor(c, kind) <= 0) continue;
      const name = kind === 'souvenir' ? this.rng.pick(SOUVENIRS) : null;
      if (addItem(c, kind, 1, name) !== 1) continue;
      payCoins(c, prices[kind]);
      this.state.stats.purchases = (this.state.stats.purchases ?? 0) + 1;
      if (kind === 'souvenir') addMemory(this.state, c, `Pazar Yeri'nden kendine bir ${name} aldı`, 'souvenir', { kind: 'life' });
      if (c.visible) c.showBubble('purse', 2);
      this.events.emit('citizen:bought', { character: c, kind, name, price: prices[kind], building });
      return kind;
    }
    return null;
  }

  /** Handa yemekten sonra pişmiş bir porsiyonu azık (Börek) olarak alır (handa yeterince yemek varsa). */
  takeaway(c, inn) {
    const t = SHOP.innTakeaway;
    if (!c || c.isChild || !inn || (inn.meals ?? 0) < t.minMeals || (c.coins ?? 0) < t.price) return false;
    if (foodSlots(c) >= INVENTORY.foodKeep || roomFor(c, 'pie') <= 0 || this.rng.next() >= t.chance) return false;
    if (addItem(c, 'pie', 1) !== 1) return false;
    inn.meals -= 1;
    payCoins(c, t.price);
    this.state.stats.purchases = (this.state.stats.purchases ?? 0) + 1;
    this.events.emit('citizen:bought', { character: c, kind: 'pie', price: t.price, building: inn });
    return true;
  }
}
