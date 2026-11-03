// Kasabanın dış dünyayla bağı: zamana ve koşullara bağlı dinamik olaylar.
//
//   Göç      : her sabah 08:00'de boş yatak, güvenli yiyecek stoğu ve yüksek refah varsa haritanın
//              kenarındaki yoldan yeni sakinler gelir (en fazla IMMIGRATION.maxPopulation)
//   Tüccar   : Pazar Yeri varsa iki üç günde bir 09:00'da sırt çantalı gezgin tüccar gelir, pazarın
//              önünde 18:00'e kadar durur; oyuncu ona (ya da pazara) tıklayıp takas eder ('ui:trade').
//              (10. aşama) Kasaba seviyesi arttıkça tüccar daha çok çeşit (yün, demir, ekmek, kervan) ve
//              her maldan daha çok stok getirir; unvanı da büyür (Gezgin Tüccar -> Kervancı -> Kervanbaşı)
//   Şenlik   : meydan / ateş / han varsa, kasabanın keyfi yüksekse ve yağmur yoksa birkaç günde bir
//              19:00-22:00 arası şenlik olur; bitince herkes "Şenlik Coşkusu" bonusuyla uyanır
//
// Olayların durumu GameState.events'te (kayda girer). Yayınladığı olaylar:
//   'festival:started' / 'festival:ended', 'merchant:arrived' / 'merchant:left', 'trade:completed',
//   'immigration:blocked' { reason } — günlük ve ses bunları dinler.
import { Character } from '../entities/Character.js';
import { IMMIGRATION, FESTIVAL, TOWN_BUFFS } from '../data/town.js';
import { MERCHANT, offersFor, offerStock } from '../data/trade.js';
import { getSeason } from '../data/seasons.js';
import { RESOURCES } from '../data/resources.js';
import { isRainActive } from '../data/weather.js';
import { immigrationStatus, townFun, townTier } from './TownStatus.js';
import { Random } from '../utils/random.js';
import { clamp } from '../utils/math.js';

const MERCHANT_BUBBLE_SECONDS = 2.4;

export class EventSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ population: import('./PopulationSystem.js').PopulationSystem,
   *   economy: import('./EconomySystem.js').EconomySystem }} services
   */
  constructor(game, world, { population, economy }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.population = population;
    this.economy = economy;
    this.merchant = null; // haritadaki tüccar karakteri (yalnızca çalışma anında; kaydı state.events.merchant)
    this.bubbleCooldown = 3;

    this.unsubscribers = [
      game.events.on('time:hour', (hour) => this.onHour(hour)),
      game.events.on('building:completed', (building) => {
        if (building.type === 'market') this.scheduleFirstVisit();
      }),
      game.events.on('building:removed', (building) => {
        if (building.type === 'market' && this.merchantState.present && !this.findMarket()) this.sendMerchantAway();
      }),
      game.events.on('ui:trade', ({ offerId }) => this.trade(offerId)),
    ];

    if (this.merchantState.present) this.restoreMerchant();
    if (this.findMarket()) this.scheduleFirstVisit();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.world.visitors = [];
  }

  get merchantState() {
    return this.state.events.merchant;
  }

  get festival() {
    return this.state.events.festival;
  }

  onHour(hour) {
    if (hour === IMMIGRATION.arrivalHour) this.tryImmigration();
    if (hour === MERCHANT.arrivalHour) this.tryMerchantVisit();
    if (hour === MERCHANT.departHour && this.merchantState.present) this.sendMerchantAway();
    if (hour === FESTIVAL.startHour) this.tryFestival();
  }

  update(tick) {
    // Şenlik bitişi dakikası gelince (kayıttan sonra saat atlansa da) biter
    if (this.festival.active && this.state.totalMinutes >= this.festival.endsAt) this.endFestival();
    if (this.merchant) this.updateMerchant(tick);
  }

  // ---------------------------------------------------------------------------
  // Göç
  // ---------------------------------------------------------------------------

  tryImmigration() {
    const status = immigrationStatus(this.state);
    if (status.ok) {
      this.population.welcomeNewcomers(Math.min(status.freeBeds, status.maxPerMorning));
      return;
    }
    // Boş yatak var ama başka bir koşul tutmuyor: oyuncu nedenini bir kez görsün
    const blocker = status.checks.find((c) => !c.ok);
    const day = this.state.time.day;
    if (status.freeBeds > 0 && this.state.events.immigration.lastNoticeDay !== day) {
      this.state.events.immigration.lastNoticeDay = day;
      const reason = blocker.key === 'food' ? 'yiyecek stoğu yetersiz' : 'kasabanın refahı düşük';
      this.events.emit('immigration:blocked', { reason, detail: blocker.text });
      this.events.emit('toast', { text: `Göçmenler bu sabah gelmedi: ${reason} (${blocker.text})`, tone: 'warn', icon: 'heart' });
    }
  }

  // ---------------------------------------------------------------------------
  // Gezgin tüccar
  // ---------------------------------------------------------------------------

  findMarket() {
    return this.world.getCompleted('market')[0] ?? null;
  }

  scheduleFirstVisit() {
    if (this.merchantState.nextVisitDay === null) {
      this.merchantState.nextVisitDay = this.state.time.day + MERCHANT.firstVisitDelayDays;
    }
  }

  rngFor(salt) {
    return new Random(this.state.seed * 13 + this.merchantState.visits * 101 + salt);
  }

  tryMerchantVisit() {
    const m = this.merchantState;
    const market = this.findMarket();
    if (!market || m.present || m.nextVisitDay === null || this.state.time.day < m.nextVisitDay) return;
    const entry = this.world.findEntryTile(this.rngFor(1));
    if (!entry) return;

    const rng = this.rngFor(2);
    const index = rng.int(0, MERCHANT.names.length - 1);
    // Kasaba büyüdükçe tüccar daha çok çeşit ve her maldan daha çok stok getirir (bu mevsimin teklifleri)
    const tier = townTier(this.state).tier;
    m.present = true;
    m.leaving = false;
    m.tier = tier;
    m.name = `${MERCHANT.titles[tier - 1] ?? MERCHANT.titles[0]} ${MERCHANT.names[index]}`;
    m.appearance = MERCHANT.appearances[index % MERCHANT.appearances.length];
    m.stock = Object.fromEntries(offersFor(getSeason(this.state.time.day).key, tier).map((o) => [o.id, offerStock(o, tier)]));
    const point = this.world.standPoint(entry.x, entry.y);
    m.x = point.x;
    m.y = point.y;
    m.exit = entry;
    this.spawnMerchant();
    this.walkMerchantTo(this.marketStandTile(market));
    market.open = true;
    this.events.emit('merchant:arrived', { name: m.name });
    this.events.emit('toast', { text: `${m.name} kasabaya geldi! Pazar Yeri'nde 18:00'e kadar takas yapabilirsin.`, tone: 'success', icon: 'sparkle' });
  }

  /** Kayıttan: tüccarı kaldığı yerde yeniden oluşturur ve gideceği yere yürütür. */
  restoreMerchant() {
    const m = this.merchantState;
    const market = this.findMarket();
    this.spawnMerchant();
    if (!market || m.leaving || this.state.time.hour >= MERCHANT.departHour || this.state.time.hour < MERCHANT.arrivalHour) {
      this.sendMerchantAway();
      return;
    }
    market.open = true;
    this.walkMerchantTo(this.marketStandTile(market));
  }

  spawnMerchant() {
    const m = this.merchantState;
    const merchant = new Character({ name: m.name, age: 50, traits: [], appearance: m.appearance, x: m.x, y: m.y });
    merchant.role = 'merchant';
    merchant.backpack = true;
    merchant.activityLabel = 'Pazar yerine yürüyor';
    this.merchant = merchant;
    this.world.visitors = [merchant];
  }

  /** Tüccarın duracağı yer: pazarın önündeki karolardan en soldaki boş olanı. */
  marketStandTile(market) {
    const spots = this.world.getSpots(market);
    return spots[0] ?? null;
  }

  walkMerchantTo(tile) {
    const merchant = this.merchant;
    if (!tile) return;
    const from = { x: merchant.tileX, y: merchant.tileY };
    const path = this.world.findPath(from, tile);
    if (path && path.length > 1) {
      merchant.setWaypoints(path.slice(1).map((s) => this.world.standPoint(s.x, s.y)));
      merchant.pose = 'walk';
    } else {
      // Yol bulunamazsa (ör. kayıttan sonra harita değişti) doğrudan hedefe yerleşir
      const point = this.world.standPoint(tile.x, tile.y);
      merchant.x = point.x;
      merchant.y = point.y;
      merchant.clearPath();
    }
  }

  sendMerchantAway() {
    const m = this.merchantState;
    if (!this.merchant) return;
    m.leaving = true;
    const market = this.findMarket();
    if (market) market.open = false;
    this.merchant.activityLabel = 'Kasabadan ayrılıyor';
    const exit = m.exit ?? this.world.findEntryTile(this.rngFor(3));
    m.exit = exit;
    this.walkMerchantTo(exit);
    if (!this.merchant.isMoving) this.finishMerchantVisit();
  }

  finishMerchantVisit() {
    const m = this.merchantState;
    const name = m.name;
    m.present = false;
    m.leaving = false;
    m.visits++;
    const [minDays, maxDays] = MERCHANT.intervalDays;
    m.nextVisitDay = this.state.time.day + this.rngFor(4).int(minDays, maxDays);
    this.merchant = null;
    this.world.visitors = [];
    this.events.emit('merchant:left', { name, nextVisitDay: m.nextVisitDay });
  }

  updateMerchant(tick) {
    const merchant = this.merchant;
    const m = this.merchantState;
    m.x = merchant.x;
    m.y = merchant.y;

    if (merchant.bubble) {
      merchant.bubble.time += tick.simDt;
      if (merchant.bubble.time >= merchant.bubble.duration) merchant.bubble = null;
    }
    if (merchant.isMoving) return;
    if (m.leaving) {
      this.finishMerchantVisit();
      return;
    }
    // Tezgâhın önünde durur, ara sıra müşteri çağırır
    merchant.pose = 'stand';
    merchant.facing = 'down';
    merchant.activityLabel = 'Pazar yerinde mal satıyor';
    this.bubbleCooldown -= tick.simDt;
    if (this.bubbleCooldown <= 0 && !merchant.bubble) {
      merchant.showBubble(['sparkle', 'chat', 'laugh'][Math.floor(Math.random() * 3)], MERCHANT_BUBBLE_SECONDS);
      this.bubbleCooldown = 6 + Math.random() * 6;
    }
  }

  /** Tüccar tezgâhta mı (takas yapılabilir mi)? */
  canTrade() {
    return Boolean(this.merchant) && this.merchantState.present && !this.merchantState.leaving;
  }

  trade(offerId) {
    const offer = offersFor(getSeason(this.state.time.day).key, townTier(this.state).tier).find((o) => o.id === offerId);
    const m = this.merchantState;
    const warn = (text) => this.events.emit('toast', { text, tone: 'warn', icon: 'demolish' });
    if (!offer) return;
    if (!this.canTrade()) return warn('Tüccar şu an tezgâhta değil');
    if ((m.stock[offer.id] ?? 0) <= 0) return warn('Tüccarın bu teklif için malı kalmadı');
    if (!this.economy.canAfford(offer.give)) return warn(`Yetersiz kaynak: ${this.economy.missing(offer.give).join(', ')}`);
    for (const [resource, amount] of Object.entries(offer.get ?? {})) {
      // Verilen kaynak yer açacaksa onu da hesaba kat
      const freed = offer.give[resource] ?? 0;
      if (this.economy.amount(resource) - freed + amount > this.economy.capacity) {
        return warn(`${RESOURCES[resource].name} deposunda yer yok`);
      }
    }

    this.economy.spend(offer.give);
    for (const [resource, amount] of Object.entries(offer.get ?? {})) this.economy.add(resource, amount);
    m.stock[offer.id] -= 1;
    if (offer.buff) this.applyBuff(offer.buff);
    this.merchant.showBubble('heart', MERCHANT_BUBBLE_SECONDS);
    this.events.emit('trade:completed', { offer, merchant: m.name });
    this.events.emit('toast', { text: `Takas yapıldı: ${describeOffer(offer)}`, tone: 'success', icon: 'sparkle' });
  }

  applyBuff(key) {
    const buff = TOWN_BUFFS[key];
    this.state.buffs[key] = this.state.totalMinutes + buff.hours * 60;
    if (buff.instantFun) {
      for (const c of this.state.characters) c.needs.fun = clamp(c.needs.fun + buff.instantFun, 0, 100);
    }
  }

  // ---------------------------------------------------------------------------
  // Akşam şenliği
  // ---------------------------------------------------------------------------

  /** Şenliğin yapılacağı yer: meydan havuzu, yoksa kamp ateşi, yoksa han. */
  findVenue() {
    for (const type of FESTIVAL.venues) {
      const venue = this.world.getCompleted(type)[0];
      if (venue) return venue;
    }
    return null;
  }

  tryFestival() {
    const f = this.festival;
    const day = this.state.time.day;
    if (f.active || day - f.lastDay < FESTIVAL.minDaysBetween) return;
    if (this.state.characters.length < FESTIVAL.minPopulation) return;
    if (isRainActive(this.state.weather) || townFun(this.state) < FESTIVAL.minFun) return;
    const venue = this.findVenue();
    if (!venue) return;
    this.startFestival(venue);
  }

  startFestival(venue) {
    const f = this.festival;
    f.active = true;
    f.venueId = venue.id;
    f.lastDay = this.state.time.day;
    f.endsAt = this.state.totalMinutes + (FESTIVAL.endHour - this.state.time.hour) * 60 - this.state.time.minute;
    this.events.emit('festival:started', { venue });
    this.events.emit('toast', { text: `Kasaba Şenliği başladı! Herkes ${venue.name} başına toplanıyor.`, tone: 'success', icon: 'note' });
  }

  endFestival() {
    const f = this.festival;
    const theme = f.theme ?? null;
    f.active = false;
    f.theme = null;
    // (14. aşama) Mevsim festivalinin kapanışını (Mevsim Coşkusu, anılar) SeasonFestivalSystem yapar
    if (theme) {
      this.events.emit('festival:ended', { theme });
      return;
    }
    for (const c of this.state.characters) c.needs.fun = clamp(c.needs.fun + FESTIVAL.afterglowFun, 0, 100);
    this.applyBuff('festival');
    this.events.emit('festival:ended', { theme: null });
    this.events.emit('toast', { text: 'Şenlik sona erdi. Kasaba yarına tam motivasyonla başlayacak!', tone: 'info', icon: 'sparkle' });
  }
}

/** "12 Odun → 8 Yiyecek" ya da "Alet Paketi" gibi kısa metin. */
export function describeOffer(offer) {
  const list = (cost) =>
    Object.entries(cost ?? {})
      .map(([r, v]) => `${v} ${RESOURCES[r].name}`)
      .join(' + ');
  if (!offer.name) return `${list(offer.give)} → ${list(offer.get)}`;
  return offer.get ? `${offer.name}: ${list(offer.give)} → ${list(offer.get)}` : `${offer.name} (${list(offer.give)})`;
}
