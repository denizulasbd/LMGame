// Zanaat Atölyesi ve kişisel ekipman (9. aşama).
//
//   Üretim : atölyedeki zanaatkâr (BehaviorSystem -> work) stoktan kaynak harcayıp tezgâhtaki ekipmanı
//            bitirir; ekipman kasaba deposuna (state.equipment) girer: 'equipment:crafted' { item, building }.
//            Ne üretileceğini oyuncu Yapı Bilgi Paneli'nden seçer ('ui:setCraftMode'): 'auto' depoda en çok
//            eksik olanı (sonbahar ve kışın önce paltoyu) sırayla üretir; seçilen ekipman ise ihtiyaçtan
//            biraz fazla birikene kadar üretilir. Yapacak iş ya da malzeme yoksa atölye boşta kalır
//            (building.idle, building.craftStatus) ve kimse çalışmaya gelmez.
//   Kuşanma: depoda boşta ekipman varsa ona en çok ihtiyacı olan yetişkin (itemFor) atölyeye ya da kilere
//            yürüyüp kuşanır (Brain -> planEquip, BehaviorSystem -> equip): 'equipment:equipped'.
//   Görünüş: paltosu olan sonbahar ve kışın paltosunu giyer (Character.coatVisible).
//   Tarif  : (10. aşama) alet demir + odundan, palto ve çanta yünden yapılır (asıl tarif). Kasabada o malzemeyi
//            üreten tamamlanmış bir yapı (Demir Madeni / Koyun Ağılı) yoksa eski usul odun / taş / yiyecek
//            tarifiyle (fallbackCost) üretilir; üreten yapı varsa zanaatkâr malzemeyi bekler. Tezgâhtaki işin
//            hangi tarifle yapıldığı building.craft.recipe'tedir ('material' | 'fallback').
// Ekipmanın etkileri src/systems/Equipment.js'teki saf yardımcılarla hesaplanır.
import { gearsNeeded } from './GoldenAge.js';
import { CLOCK_GEAR } from '../data/goldenAge.js';
import { EQUIPMENT, EQUIPMENT_KEYS, CRAFTING, CRAFT_MODES } from '../data/equipment.js';
import { BUILDINGS } from '../data/buildings.js';
import { lacking } from './Equipment.js';
import { RESOURCES, formatCost } from '../data/resources.js';
import { getSeason } from '../data/seasons.js';
import { isShivering } from './HeatingSystem.js';
import { schemeIronSaving } from './Exploration.js';

const GEAR_ITEM = 'clockGear'; // (20. aşama) tezgâhtaki Kadim Dişli (ekipman değil; bitince stoğa 'gears' olarak girer)
const itemName = (item) => (item === GEAR_ITEM ? CLOCK_GEAR.name : EQUIPMENT[item].name);

// Ekipmanı alabileceği yerler (yakın olan seçilir)
const PICKUP_TYPES = ['workshop', 'storage', 'supplyCamp'];

export class CraftingSystem {
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
    this.unsubscribers = [
      game.events.on('ui:setCraftMode', ({ buildingId, mode }) => {
        const building = this.world.getBuilding(buildingId);
        if (!building?.definition.crafting || !CRAFT_MODES[mode] || building.craftMode === mode) return;
        building.craftMode = mode;
        this.events.emit('toast', {
          text: mode === 'auto' ? `${building.name}: eksik olana göre sırayla üretecek` : `${building.name}: ${EQUIPMENT[mode].name} üretecek`,
          tone: 'info',
          icon: 'anvil',
        });
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get stock() {
    return this.state.equipment;
  }

  update() {
    const coatSeason = CRAFTING.coatSeasons.includes(getSeason(this.state.time.day).key);
    for (const c of this.world.characters) c.coatVisible = coatSeason && c.equipment.clothing === 'winterCoat';
    for (const building of this.world.buildings) {
      if (!building.definition.crafting) continue;
      if (!building.functional || building.damaged) {
        building.idle = true;
        building.craftStatus = building.damaged ? 'Fırtınada hasar gördü: onarılana kadar çalışmaz' : null;
        continue;
      }
      if (building.craft) {
        building.idle = false;
        building.craftStatus = null;
        continue;
      }
      const choice = this.chooseItem(building);
      building.idle = !choice.item;
      building.craftStatus =
        choice.reason ?? `Sıradaki: ${itemName(choice.item)}${choice.recipe.kind === 'fallback' ? ' (eski usul)' : ''}`;
    }
  }

  /**
   * Tezgâha alınacak ekipman: { item } ya da üretmeme nedeni { reason }.
   * Otomatikte ihtiyacı (kuşanmamış yetişkin sayısı - depodaki) en büyük olan; sonbahar ve kışın palto önce.
   */
  chooseItem(building) {
    // (20. aşama) Ulu Saat Kulesi'nin Gövdesi bittiyse atölye önce Mekanizma & Çan için Kadim Dişli döker
    let gearReason = null;
    if (gearsNeeded(this.state) > 0) {
      if (this.economy.canAfford(CLOCK_GEAR.cost)) return { item: GEAR_ITEM, recipe: { cost: CLOCK_GEAR.cost, kind: 'material' } };
      gearReason = `Kadim Dişli için malzeme bekleniyor (${formatCost(CLOCK_GEAR.cost)})`;
    }
    const choice = this.chooseEquipment(building);
    return gearReason && !choice.item ? { reason: gearReason } : choice;
  }

  chooseEquipment(building) {
    const mode = building.craftMode;
    const coatSeason = CRAFTING.coatSeasons.includes(getSeason(this.state.time.day).key);
    const candidates = mode === 'auto' ? EQUIPMENT_KEYS : [mode];
    let best = null;
    let reason = null;
    for (const item of candidates) {
      const demand = lacking(this.world.characters, item).length;
      const need = demand - this.stock[item] + (mode === 'auto' ? 0 : CRAFTING.spareStock);
      if (need <= 0) continue;
      const recipe = this.recipeFor(item);
      if (!recipe.cost) {
        reason ??= recipe.reason;
        continue;
      }
      const priority = need + (item === 'winterCoat' && coatSeason ? 100 : 0);
      if (!best || priority > best.priority) best = { item, priority, recipe };
    }
    if (best) return { item: best.item, recipe: best.recipe };
    if (reason) return { reason };
    return { reason: mode === 'auto' ? 'Herkesin ekipmanı tamam: sipariş bekleniyor' : `Depoda yeterince ${EQUIPMENT[mode].shortName.toLowerCase()} var` };
  }

  /** Kasabada bu malzemeyi (yün, demir) üreten tamamlanmış bir yapı var mı? */
  hasProducer(material) {
    return this.world.getCompleted().some((b) => {
      const production = BUILDINGS[b.type].production;
      return production && (production.resource === material || production.extra?.[material] !== undefined);
    });
  }

  /**
   * (16. aşama) Kadim Çelik Döküm Tekniği: harcanan demirin bir kısmı dökümde artar ve depoya geri döner
   * (küsurat state.exploration.ironCredit'te birikir; ortalamada tüketim %20 azalır).
   */
  saveIron(spent) {
    const saving = schemeIronSaving(this.world.state);
    const ex = this.world.state.exploration;
    if (!saving || !spent || !ex) return;
    ex.ironCredit = (ex.ironCredit ?? 0) + spent * saving;
    const whole = Math.floor(ex.ironCredit + 1e-9);
    if (whole > 0) {
      ex.ironCredit -= whole;
      this.economy.add('iron', whole);
    }
  }

  /**
   * Bu ekipmanın şimdi hangi tarifle yapılabileceği:
   *   { cost, kind: 'material' } asıl tarif (demir / yün), { cost, kind: 'fallback' } eski usul tarif ya da
   *   { reason } neden yapılamadığı. Eski usul tarif yalnızca malzemeyi üreten yapı yokken kullanılır.
   */
  recipeFor(item) {
    const def = EQUIPMENT[item];
    if (this.economy.canAfford(def.cost)) return { cost: def.cost, kind: 'material' };
    const material = RESOURCES[def.material];
    if (def.fallbackCost && !this.hasProducer(def.material)) {
      if (this.economy.canAfford(def.fallbackCost)) return { cost: def.fallbackCost, kind: 'fallback' };
      return { reason: `Malzeme bekleniyor: ${def.name} (${formatCost(def.cost)} ya da eski usul ${formatCost(def.fallbackCost)})` };
    }
    return { reason: `${material.name} bekleniyor: ${def.name} (${formatCost(def.cost)})` };
  }

  /**
   * Zanaatkârın çalışması (BehaviorSystem çağırır): tezgâh boşsa sıradaki ekipmanın malzemesini
   * harcayıp başlar, iş bitince ekipman depoya girer. Yapacak iş kalmadıysa false (zanaatkâr ayrılır).
   */
  work(building, amount) {
    if (!building.craft) {
      const { item, recipe } = this.chooseItem(building);
      if (!item || !this.economy.spend(recipe.cost)) return false;
      building.craft = { item, progress: 0, recipe: recipe.kind };
      this.saveIron(recipe.cost.iron ?? 0);
    }
    building.craft.progress += amount;
    const item = building.craft.item;
    if (building.craft.progress < (item === GEAR_ITEM ? CLOCK_GEAR.work : EQUIPMENT[item].work)) return true;
    const recipe = building.craft.recipe ?? 'material';
    building.craft = null;
    if (item === GEAR_ITEM) {
      this.economy.add('gears', 1);
      building.producedToday += 1;
      this.events.emit('goldenAge:gearCast', { building, gears: this.state.resources.gears });
      return true;
    }
    this.stock[item] += 1;
    building.producedToday += 1;
    this.events.emit('equipment:crafted', { item, building, recipe });
    return true;
  }

  /** Tezgâhtaki işin adı (durum metni için) ya da null. */
  currentItemName(building) {
    return building.craft ? itemName(building.craft.item) : null;
  }

  /**
   * Bu sakinin şimdi gidip kuşanması gereken ekipman (yoksa null). Depodaki adet kadar en çok ihtiyacı
   * olan sakin seçilir; yolda olan (aynı ekipmanı almaya giden) sakinler adetten düşülür.
   */
  itemFor(c) {
    if (c.isChild || c.role) return null;
    for (const item of EQUIPMENT_KEYS) {
      const available = this.stock[item] - this.claims(item, c);
      if (available <= 0 || c.equipment[EQUIPMENT[item].slot] === item) continue;
      const ranked = lacking(this.world.characters, item)
        .filter((o) => !(o.task?.activity === 'equip' && o.task.item === item))
        .sort((x, y) => this.needScore(y, item) - this.needScore(x, item));
      if (ranked.slice(0, available).includes(c)) return item;
    }
    return null;
  }

  /** Bu ekipmanı almaya yola çıkmış diğer sakinler. */
  claims(item, except) {
    return this.world.characters.filter((o) => o !== except && o.task?.activity === 'equip' && o.task.item === item).length;
  }

  /**
   * Ekipmana ihtiyaç puanı: alet ve çanta en çok çalışana (toplam meslek deneyimi; çanta için inşaatçılık
   * ve oduncu / taşçılık ağır basar), palto sonbahar-kış üşüyene ve dışarıda çalışana.
   */
  needScore(c, item) {
    const xp = Object.values(c.skills).reduce((sum, v) => sum + v, 0);
    if (item === 'winterCoat') {
      const coatSeason = CRAFTING.coatSeasons.includes(getSeason(this.state.time.day).key);
      return (coatSeason ? 1000 : 0) + (isShivering(c, this.state) ? 500 : 0) + xp / 10;
    }
    if (item === 'backpack') return (c.skills.building ?? 0) * 2 + (c.skills.woodcutting ?? 0) + (c.skills.masonry ?? 0) + xp / 4;
    return xp;
  }

  /** Ekipmanın alınabileceği yapılar (atölye, kiler, erzak kampı). */
  pickupPlaces() {
    return this.world.getCompleted().filter((b) => PICKUP_TYPES.includes(b.type));
  }

  /** Depodan ekipmanı alıp kuşanır (BehaviorSystem, equip etkinliği bitince çağırır). Başarılıysa true. */
  equip(c, item) {
    const slot = EQUIPMENT[item].slot;
    if (this.stock[item] <= 0 || c.equipment[slot] === item) return false;
    this.stock[item] -= 1;
    c.equipment[slot] = item;
    c.showBubble('sparkle', 2.4);
    this.events.emit('equipment:equipped', { character: c, item });
    return true;
  }
}
