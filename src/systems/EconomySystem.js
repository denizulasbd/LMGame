// Kasabanın ortak kaynak bankası: Odun, Taş, Yiyecek ve (10. aşama) işlenmiş mallar Yün, Demir, Ekmek.
//   - Depo kapasitesi = temel kapasite + tamamlanmış Kiler'lerin katkısı (her kaynak için ayrı ayrı)
//   - (24. aşama) Ürün Silosu yalnızca tarımsal kaynakların (yiyecek, ekmek, keten, şerbetçiotu) sınırına ekler:
//     state.granaryCapacity; bir kaynağın sınırı Granary.storageLimit(state, kaynak)
//   - Harcama / ekleme tek yerden yapılır ve 'resources:changed' olayı yayınlanır
//     (HUD +5 / -10 vurgularını bu olaydan çizer)
//   - Depo dolunca ya da kasabanın yiyeceği (ekmek dahil) bitince bir kez bildirim gösterilir
//   - Yiyecek değeri: ekmek 2,5 yiyecek sayılır. Öğünler consumeFood ile ödenir: önce kesilmiş ekmekten
//     artan pay (state.pantry.credit), sonra ekmek, en son ham yiyecek; handaki aşçı ise önce ham yiyecek
//     kullanır. Bir ekmek dilimlenince artan yiyecek değeri pay olarak saklanır, hiçbir şey kaybolmaz.
//   - Üretim yapıları produce() ile ekler: işlenmiş malların toplam üretimi state.stats.goods'a yazılır,
//     kasabanın ilk yünü / demiri / ekmeği için 'goods:firstProduced' { resource, building } yayınlanır
import { RESOURCES, BASE_STORAGE_CAPACITY } from '../data/resources.js';
import { BUILDINGS } from '../data/buildings.js';
import { foodSupply } from './TownStatus.js';
import { civicStorageBonus } from './CivicSystem.js';
import { storageLimit, isAgricultural } from './Granary.js';

const FULL_RESET_RATIO = 0.9; // doluluk bu oranın altına inince "depo doldu" uyarısı yeniden verilebilir
const EPSILON = 1e-9;
const HUNGER_WARNING_SUPPLY = 1; // kasabanın toplam yiyecek değeri bunun altına inince uyarı
const HUNGER_RESET_SUPPLY = 6; // ve bunun üstüne çıkınca uyarı yeniden verilebilir

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
    this.hungerWarned = false;
    this.recalculateCapacity();
  }

  update() {
    this.recalculateCapacity();
  }

  recalculateCapacity() {
    // (11. aşama) Belediyenin Altyapı ve Depo Genişletmesi fermanı her kademede kalıcı +150 ekler
    let capacity = BASE_STORAGE_CAPACITY + civicStorageBonus(this.state);
    let granary = 0;
    for (const b of this.world.buildings) {
      if (!b.functional) continue;
      const def = BUILDINGS[b.type];
      capacity += def.storageBonus ?? 0;
      granary += def.granary?.capacity ?? 0; // (24. aşama) Ürün Silosu
    }
    this.state.storageCapacity = capacity;
    this.state.granaryCapacity = granary;
  }

  /** (24. aşama) Bu kaynağın depo sınırı (tarımsal kaynaklarda silo katkısı dahil; hazine sınırsız). */
  limit(resource) {
    return storageLimit(this.state, resource);
  }

  get capacity() {
    return this.state.storageCapacity;
  }

  amount(resource) {
    return this.state.resources[resource] ?? 0;
  }

  /** Bu kaynak için depoda kalan boş yer. */
  room(resource) {
    if (RESOURCES[resource].treasury) return Infinity;
    return Math.max(0, this.limit(resource) - this.amount(resource));
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
      // İşlenmiş mallar (yün, demir, ekmek) zanaatkâr ve fırın kullandıkça sık sık sıfırlanır: günlüğe
      // yazılmaz. Ham yiyecek de fırın una çevirdikçe biter; kilerde ekmek varsa kasaba aç değildir.
      const depleted = this.amount(resource) === 0 && !RESOURCES[resource].processed;
      if (depleted && (resource !== 'food' || this.foodSupply() < HUNGER_WARNING_SUPPLY)) {
        this.events.emit('resource:depleted', { resource });
      }
    }
    if (cost.food || cost.bread) this.checkHunger();
    return true;
  }

  /** Kaynak ekler (depo kapasitesine kadar). Gerçekten eklenen miktarı döndürür. */
  add(resource, amount) {
    const current = this.amount(resource);
    const limit = this.limit(resource); // hazinenin (altın) sınırı yok; tarımsal kaynaklara silo eklenir
    const added = Math.max(0, Math.min(Math.floor(amount), limit - current));
    if (added > 0) {
      this.state.resources[resource] = current + added;
      this.emitChange(resource, added);
    }
    const now = this.amount(resource);
    if (now >= limit && !this.fullWarned.has(resource)) {
      this.fullWarned.add(resource);
      this.events.emit('toast', {
        text: `${RESOURCES[resource].name} deposu doldu! ${isAgricultural(resource) ? 'Kiler ya da Ürün Silosu' : 'Kiler'} kurarak kapasiteyi artırabilirsin.`,
        tone: 'warn',
        icon: RESOURCES[resource].icon,
      });
    } else if (now < limit * FULL_RESET_RATIO) {
      this.fullWarned.delete(resource);
    }
    if (added > 0 && RESOURCES[resource].foodValue) this.checkHunger();
    return added;
  }

  /**
   * Bir üretim yapısının ürünü stoğa girer (add gibi). İşlenmiş malların toplam üretimi sayılır; kasabanın
   * ilk yünü, demiri ya da ekmeği çıkınca 'goods:firstProduced' yayınlanır (günlük ve bildirim).
   */
  produce(resource, amount, building = null) {
    const added = this.add(resource, amount);
    if (added > 0 && RESOURCES[resource].processed) {
      const goods = this.state.stats.goods;
      const first = !goods[resource];
      goods[resource] = (goods[resource] ?? 0) + added;
      if (first) this.events.emit('goods:firstProduced', { resource, building });
    }
    return added;
  }

  /** İnşaat iptali / yıkım iadesi. */
  refund(cost = {}, ratio = 1) {
    for (const [resource, value] of Object.entries(cost)) this.add(resource, Math.floor(value * ratio));
  }

  // ---------------------------------------------------------------------------
  // Yiyecek değeri (10. aşama): ekmek 2,5 yiyecek sayılır
  // ---------------------------------------------------------------------------

  /** Kasabanın toplam yiyecek değeri: yiyecek + ekmek × 2,5 + dilimlenmiş ekmekten artan pay. */
  foodSupply() {
    return foodSupply(this.state);
  }

  /** Bu kadar yiyecek değeri karşılanabilir mi (ekmek dahil)? */
  canFeed(units) {
    return this.foodSupply() + EPSILON >= units;
  }

  /**
   * units yiyecek değerini öder. Öğünler önce ekmek yer (preferRaw: false); handaki aşçı önce ham yiyecek
   * kullanır (preferRaw: true). Yetmiyorsa hiçbir şey harcamaz.
   * Dönüş: { ok, bread } — bread: ödemenin bir kısmı ekmekten mi karşılandı
   */
  consumeFood(units, { preferRaw = false } = {}) {
    if (!this.canFeed(units)) return { ok: false, bread: false };
    if (preferRaw && Number.isInteger(units) && this.amount('food') >= units) {
      this.spend({ food: units });
      return { ok: true, bread: false };
    }
    const pantry = this.state.pantry;
    const breadValue = RESOURCES.bread.foodValue;
    let need = units;
    let usedBread = false;
    const takeCredit = () => {
      const take = Math.min(pantry.credit, need);
      pantry.credit -= take;
      need -= take;
    };
    takeCredit();
    while (need > EPSILON && this.amount('bread') > 0) {
      this.spend({ bread: 1 });
      pantry.credit += breadValue;
      usedBread = true;
      takeCredit();
    }
    if (need > EPSILON) {
      // Kalan pay ham yiyecekten; tam birim harcanır, artanı pay olarak saklanır
      const whole = Math.ceil(need - EPSILON);
      this.spend({ food: whole });
      pantry.credit += whole - need;
      need = 0;
    }
    if (pantry.credit < EPSILON) pantry.credit = 0;
    this.checkHunger();
    return { ok: true, bread: usedBread };
  }

  /** Kasabanın yiyeceği (ekmek dahil) bitince bir kez uyarır. */
  checkHunger() {
    const supply = this.foodSupply();
    if (supply < HUNGER_WARNING_SUPPLY && !this.hungerWarned) {
      this.hungerWarned = true;
      this.events.emit('toast', { text: 'Kilerde yiyecek ve ekmek kalmadı! Sakinler çalılara yöneliyor.', tone: 'warn', icon: 'food' });
    } else if (supply >= HUNGER_RESET_SUPPLY) {
      this.hungerWarned = false;
    }
  }

  emitChange(resource, delta) {
    this.events.emit('resources:changed', { resource, delta, amount: this.amount(resource) });
  }
}
