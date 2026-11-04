// Kasaba seviyesi / prestij (10. aşama): Mezra -> Köy -> Kasaba -> Gelişmiş Şehir.
//
//   Ölçüm   : nüfus, tamamlanmış yapı sayısı, Seviye 2 yapı sayısı ve ortalama refah (kasaba refahının
//             yaklaşık yarım günlük yürüyen ortalaması, state.town.welfare). Koşullar data/town.js ->
//             TOWN_TIERS'ta, hesaplar TownStatus.js'te (arayüz de aynı hesabı kullanır).
//   Atlama  : bir seviyenin tüm koşulları aynı anda sağlanınca kasaba o seviyeye çıkar; seviye hiç düşmez.
//             'town:tierUp' { tier, previous, townName } yayınlanır: günlük, ses, bildirim ve kutlama penceresi
//             dinler. Yeni seviye yapı kilitlerini açar (değirmen, belediye), tüccarın mallarını çoğaltır.
//   Eski kayıt: seviyesi yazılmamış (sürüm 7 ve öncesi) bir kasaba yüklenince ilk değerlendirme sessiz
//             yapılır: kasaba hak ettiği seviyeden başlar, günlüğe tek satır düşer, kutlama penceresi açılmaz.
//   Belediye: Belediye Konağı tamamlanmışsa her sabah (TOWN_HALL.hour) vergi ve erzak defterini tutar:
//             temel kaynaklardan deposu en dolu olanın bir kısmını deposu en boş olana 1'e 1 aktarır
//             ('townHall:balanced' { from, to, amount }).
import { TOWN_TIERS, TOWN_LEVEL, TOWN_HALL } from '../data/town.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { townHappiness, townMetrics, eligibleTier, formatTownTitle } from './TownStatus.js';

export class TownLevelSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   */
  constructor(game, world, economy, { attract = false } = {}) {
    this.attract = attract; // başlangıç ekranının arka plan kasabası: seviye sessizce değerlendirilir
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.sinceCheck = 0; // ilk karede hemen değerlendir
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => {
        if (hour === TOWN_HALL.hour) this.balanceStores();
      }),
      game.events.on('building:completed', () => (this.sinceCheck = 0)),
      game.events.on('building:upgraded', () => (this.sinceCheck = 0)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get town() {
    return this.state.town;
  }

  update(tick) {
    const town = this.town;
    // Ortalama refah: yürüyen ortalama (ilk değer o anki refah)
    const happiness = townHappiness(this.state);
    if (town.welfare === null || !Number.isFinite(town.welfare)) town.welfare = happiness;
    else if (tick.gameMinutes > 0) {
      const k = 1 - Math.exp(-tick.gameMinutes / (TOWN_LEVEL.welfareHours * 60));
      town.welfare += (happiness - town.welfare) * k;
    }
    this.sinceCheck -= tick.gameMinutes;
    if (this.sinceCheck > 0) return;
    this.sinceCheck = TOWN_LEVEL.checkMinutes;
    this.evaluate();
  }

  /** Koşulları denetler; hak edilen seviye şimdikinden yüksekse kasaba seviye atlar. */
  evaluate() {
    const town = this.town;
    const target = eligibleTier(this.state, townMetrics(this.state));
    if (this.attract) {
      town.tier = Math.max(town.tier, target);
      return;
    }
    if (!town.assessed) {
      // Eski kayıt: kasaba hak ettiği seviyeden sessizce başlar
      town.assessed = true;
      const stamp = this.stamp();
      for (let t = 1; t <= target; t++) town.reached[t] ??= stamp;
      town.tier = Math.max(town.tier, target);
      if (town.tier > 1) this.events.emit('town:tierAssessed', { tier: TOWN_TIERS[town.tier - 1], townName: this.state.townName });
      return;
    }
    if (target <= town.tier) return;
    const previous = TOWN_TIERS[town.tier - 1];
    // Birden çok seviye birden hak edildiyse (ör. hile ya da çok hızlı büyüme) aradakiler de kaydedilir
    for (let t = town.tier + 1; t <= target; t++) town.reached[t] = this.stamp();
    town.tier = target;
    const tier = TOWN_TIERS[target - 1];
    const title = formatTownTitle(this.state.townName, tier);
    this.events.emit('town:tierUp', { tier, previous, townName: this.state.townName, title });
    this.events.emit('toast', { text: `Tebrikler! Artık ${title}: ${tier.perks[0]}`, tone: 'success', icon: tier.icon });
  }

  stamp() {
    const { day, hour, minute } = this.state.time;
    return { day, hour, minute };
  }

  /**
   * Belediye Konağı'nın sabah erzak dengesi: deposu en az %50 dolu temel kaynağın bir kısmını (en çok 12)
   * deposu %30'un altında kalan kaynağa aktarır. Günde bir kez.
   */
  balanceStores() {
    const hall = this.world.getCompleted().find((b) => BUILDINGS[b.type].civic);
    const town = this.town;
    if (!hall || town.balanceDay === this.state.time.day) return;
    town.balanceDay = this.state.time.day;
    const capacity = this.economy.capacity;
    const ratio = (r) => this.economy.amount(r) / capacity;
    const sorted = [...TOWN_HALL.resources].sort((a, b) => ratio(b) - ratio(a));
    const rich = sorted[0];
    const poor = sorted[sorted.length - 1];
    if (rich === poor || ratio(rich) < TOWN_HALL.richRatio || ratio(poor) >= TOWN_HALL.poorRatio) return;
    const amount = Math.min(TOWN_HALL.max, Math.floor(this.economy.amount(rich) * TOWN_HALL.share), this.economy.room(poor));
    if (amount <= 0 || !this.economy.spend({ [rich]: amount })) return;
    this.economy.add(poor, amount);
    this.events.emit('townHall:balanced', { building: hall, from: rich, to: poor, amount });
    this.events.emit('toast', {
      text: `${hall.name} erzak dengesini sağladı: ${amount} ${RESOURCES[rich].name.toLocaleLowerCase('tr')} → ${amount} ${RESOURCES[poor].name.toLocaleLowerCase('tr')}`,
      tone: 'info',
      icon: RESOURCES[poor].icon,
    });
  }
}
