// Kasabanın ortak kaynak bankası: Odun, Taş, Yiyecek.
//   - Depo kapasitesi = temel kapasite + tamamlanmış Kiler'lerin katkısı
//   - Harcama / ekleme tek yerden yapılır ve 'resources:changed' olayı yayınlanır
//     (HUD +5 / -10 vurgularını bu olaydan çizer)
//   - Depo dolunca ya da yiyecek bitince bir kez bildirim gösterilir
import { RESOURCES, BASE_STORAGE_CAPACITY } from '../data/resources.js';
import { BUILDINGS } from '../data/buildings.js';

const FULL_RESET_RATIO = 0.9; // doluluk bu oranın altına inince "depo doldu" uyarısı yeniden verilebilir

export class EconomySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world) {
    this.events = game.events;
    this.state = game.state;
    this.world = world;
    this.fullWarned = new Set();
    this.recalculateCapacity();
  }

  update() {
    this.recalculateCapacity();
  }

  recalculateCapacity() {
    let capacity = BASE_STORAGE_CAPACITY;
    for (const b of this.world.buildings) {
      if (b.functional) capacity += BUILDINGS[b.type].storageBonus ?? 0;
    }
    this.state.storageCapacity = capacity;
  }

  get capacity() {
    return this.state.storageCapacity;
  }

  amount(resource) {
    return this.state.resources[resource] ?? 0;
  }

  canAfford(cost = {}) {
    return Object.entries(cost).every(([r, v]) => this.amount(r) >= v);
  }

  /** Eksik kalan kaynakların adları (bildirim metni için). */
  missing(cost = {}) {
    return Object.entries(cost)
      .filter(([r, v]) => this.amount(r) < v)
      .map(([r]) => RESOURCES[r].name);
  }

  /** Maliyeti öder; yetmiyorsa hiçbir şey harcamaz ve false döner. */
  spend(cost = {}) {
    if (!this.canAfford(cost)) return false;
    for (const [resource, value] of Object.entries(cost)) {
      if (value <= 0) continue;
      this.state.resources[resource] -= value;
      this.emitChange(resource, -value);
      if (this.amount(resource) === 0) this.events.emit('resource:depleted', { resource });
      if (resource === 'food' && this.amount('food') === 0) {
        this.events.emit('toast', { text: 'Kilerde yiyecek kalmadı! Sakinler çalılara yöneliyor.', tone: 'warn', icon: 'food' });
      }
    }
    return true;
  }

  /** Kaynak ekler (depo kapasitesine kadar). Gerçekten eklenen miktarı döndürür. */
  add(resource, amount) {
    const current = this.amount(resource);
    const added = Math.max(0, Math.min(Math.floor(amount), this.capacity - current));
    if (added > 0) {
      this.state.resources[resource] = current + added;
      this.emitChange(resource, added);
    }
    const now = this.amount(resource);
    if (now >= this.capacity && !this.fullWarned.has(resource)) {
      this.fullWarned.add(resource);
      this.events.emit('toast', {
        text: `${RESOURCES[resource].name} deposu doldu! Kiler kurarak kapasiteyi artırabilirsin.`,
        tone: 'warn',
        icon: RESOURCES[resource].icon,
      });
    } else if (now < this.capacity * FULL_RESET_RATIO) {
      this.fullWarned.delete(resource);
    }
    return added;
  }

  /** İnşaat iptali / yıkım iadesi. */
  refund(cost = {}, ratio = 1) {
    for (const [resource, value] of Object.entries(cost)) this.add(resource, Math.floor(value * ratio));
  }

  emitChange(resource, delta) {
    this.events.emit('resources:changed', { resource, delta, amount: this.amount(resource) });
  }
}
