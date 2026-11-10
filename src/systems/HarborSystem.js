// Büyük Ticaret Limanı ve nehir ihracatı (12. aşama). Kurallar src/data/trade.js -> EXPORT'ta.
//
//   Ayarlar : limanın panelinden "fazlalık ihracatı" sınırı seçilir ('ui:setExportThreshold' { buildingId, threshold }):
//             o sınırın üstündeki her stok (altın hariç) tekneyle gider. "İhracat Sandığı Hazırla" ('ui:prepareCrate')
//             her kaynaktan bir parça ayırıp rıhtıma koyar; sıradaki tekne onu da yükler.
//   Tekne   : 06:00-20:00 arası, birkaç saatte bir nehrin bir ucundan süzülerek gelir (yol: nehir ve köprü altları),
//             limanın önündeki açık suya yanaşır, yükler ve öteki uca doğru gider. Ayrılırken yükün değeri altın olarak
//             Kasaba Hazinesi'ne girer ('harbor:shipped' { cargo, gold, bonus }); ara sıra Ticaret Bereketi getirir.
//   (14. aşama) Büyük İhracat Seferi ('ui:grandVoyage' { buildingId }): altınla ilan edilir; büyük bir kervan teknesi
//             hemen yola çıkar (nehirde yük almamış tekne varsa o kervana dönüşür), normalin 2,5 katı yük alır ve sınırı
//             350'ye indirerek fazlalığı boşaltır; yükün değeri %10 fazladır ('harbor:grandVoyage' { building }).
// Durum state.trade'dedir (kayda girer): { boat, nextBoatAt, shipments, goldEarned, exported, last, grandDay,
// grandPending, grandVoyages }.
import { researchExportMultiplier } from './ResearchSystem.js';
import { doctrineExportMultiplier } from './Doctrine.js';
import { EXPORT } from '../data/trade.js';
import { RESOURCES } from '../data/resources.js';
import { TOWN_BUFFS } from '../data/town.js';
import { isWithinHours } from './StructureSystem.js';
import { Boat } from '../entities/Boat.js';
import { relicExportCapacity, relicExportValue } from './Luxury.js';

const T = 16;

/** Yükün altın değeri (multiplier: Denizci Pusulası). */
export function cargoValue(cargo, multiplier = 1) {
  return Math.floor(Object.entries(cargo ?? {}).reduce((sum, [r, v]) => sum + v * (EXPORT.values[r] ?? 0), 0) * multiplier);
}

/** Teknenin taşıyabileceği en çok birim (Denizci Pusulası ile artar; Büyük İhracat Seferi'nde 2,5 katı). */
export function boatCapacity(state, grand = false) {
  return Math.round(EXPORT.capacity * relicExportCapacity(state) * (grand ? EXPORT.grandVoyage.capacityMultiplier : 1));
}

/** Büyük İhracat Seferi ilan edilebilir mi? { ok, reason, price, waitDays } (arayüz de aynı sonucu gösterir). */
export function grandVoyageStatus(state) {
  const spec = EXPORT.grandVoyage;
  const price = spec.price;
  const harbor = state.buildings.some((b) => b.type === 'harbor' && b.functional && !b.damaged);
  if (!harbor) return { ok: false, reason: 'Önce Büyük Ticaret Limanı tamamlanmalı', price };
  const trade = state.trade;
  if (trade.grandPending || trade.boat?.grand) return { ok: false, reason: 'Kervan teknesi zaten yolda', price };
  const last = trade.grandDay;
  if (last !== null && last !== undefined && state.time.day - last < spec.cooldownDays) {
    const waitDays = spec.cooldownDays - (state.time.day - last);
    return { ok: false, reason: `${waitDays} gün sonra yeniden ilan edilebilir`, price, waitDays };
  }
  if ((state.resources.gold ?? 0) < price) return { ok: false, reason: `Yetersiz altın (${state.resources.gold ?? 0}/${price})`, price };
  return { ok: true, reason: null, price };
}

/** Sınırı aşan fazlalık: { kaynak: birim } (altın ve sınır yoksa boş). */
export function exportExcess(state, threshold) {
  const out = {};
  if (threshold === null || threshold === undefined) return out;
  for (const [r, v] of Object.entries(state.resources)) {
    if (RESOURCES[r]?.treasury || EXPORT.values[r] === undefined) continue;
    if (v > threshold) out[r] = v - threshold;
  }
  return out;
}

/** İhracat sandığına konacaklar: her kaynaktan stokta minStock kalacak şekilde en çok perResource birim. */
export function cratePreview(state) {
  const { perResource, minStock } = EXPORT.crate;
  const out = {};
  for (const r of Object.keys(EXPORT.values)) {
    const n = Math.min(perResource, (state.resources[r] ?? 0) - minStock);
    if (n > 0) out[r] = n;
  }
  return out;
}

/** Teknenin durumu (panel ve günlük için kısa metin). */
export function boatStatus(state) {
  const boat = state.trade?.boat;
  if (boat?.grand && boat.stage === 'arriving') return 'Kervan teknesi (Büyük İhracat Seferi) nehirden geliyor';
  if (boat?.grand && boat.stage === 'docked') return 'Kervan teknesi rıhtımda: bütün fazlalık yükleniyor';
  if (boat?.stage === 'arriving') return 'Ticaret teknesi nehirden süzülerek geliyor';
  if (boat?.stage === 'docked') return 'Tekne rıhtımda: mallar yükleniyor';
  if (boat?.stage === 'leaving') return 'Tekne yüküyle nehrin aşağısına gidiyor';
  const at = state.trade?.nextBoatAt;
  if (at === null || at === undefined) return 'Sıradaki tekne yakında haber alıp gelecek';
  const day = Math.floor(at / 1440) + 1;
  const hour = Math.floor((at % 1440) / 60);
  const from = EXPORT.hours.from;
  const shown = hour < from || hour >= EXPORT.hours.to ? `Gün ${hour >= EXPORT.hours.to ? day + 1 : day} sabahı` : `Gün ${day}, ${String(hour).padStart(2, '0')}:00 civarı`;
  return `Sıradaki tekne: ${shown}`;
}

export class HarborSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./EconomySystem.js').EconomySystem} economy
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, economy, rng) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.rng = rng;
    this.entity = null; // nehirdeki tekne (çizim)
    this.route = null; // { harborId, arrive: [nokta], leave: [nokta] } (önbellek)
    this.unsubscribers = [
      game.events.on('ui:setExportThreshold', ({ buildingId, threshold }) => this.setThreshold(buildingId, threshold)),
      game.events.on('ui:prepareCrate', ({ buildingId }) => this.prepareCrate(buildingId)),
      game.events.on('ui:grandVoyage', () => this.orderGrandVoyage()),
      game.events.on('building:completed', (b) => {
        if (b.type === 'harbor') this.onBuilt(b);
      }),
      game.events.on('building:removed', (b) => {
        if (b.type === 'harbor') this.dismissBoat();
        this.route = null;
      }),
      game.events.on('building:placed', () => (this.route = null)),
    ];
    if (this.trade.boat) this.ensureEntity();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.world.boats = [];
  }

  get trade() {
    return this.state.trade;
  }

  harbor() {
    return this.world.getCompleted('harbor').find((b) => !b.damaged) ?? null;
  }

  onBuilt(building) {
    if (building.exportThreshold === null) building.exportThreshold = EXPORT.defaultThreshold;
    this.trade.nextBoatAt = Math.min(this.trade.nextBoatAt ?? Infinity, this.state.totalMinutes + 120);
  }

  setThreshold(buildingId, threshold) {
    const b = this.world.getBuilding(buildingId);
    if (!b || b.type !== 'harbor' || !EXPORT.thresholds.includes(threshold)) return;
    b.exportThreshold = threshold;
    this.events.emit('toast', {
      text: threshold === null ? 'Fazlalık ihracatı kapatıldı' : `Fazlalık ihracatı: ${threshold} birimin üstündeki mallar teknelerle gidecek`,
      tone: 'info',
      icon: 'boat',
    });
  }

  /** İhracat sandığı: her kaynaktan stokta minStock'un üstünde kalanından en çok perResource birim ayrılır. */
  prepareCrate(buildingId) {
    const b = this.world.getBuilding(buildingId);
    if (!b || b.type !== 'harbor') return null;
    const { minStock } = EXPORT.crate;
    const taken = {};
    for (const [r, n] of Object.entries(cratePreview(this.state))) {
      if (this.economy.spend({ [r]: n })) taken[r] = n;
    }
    if (Object.keys(taken).length === 0) {
      this.events.emit('toast', { text: `Sandığa koyacak fazla mal yok (her kaynaktan en az ${minStock} stokta kalır)`, tone: 'warn', icon: 'boat' });
      return null;
    }
    b.crate = { ...(b.crate ?? {}) };
    for (const [r, v] of Object.entries(taken)) b.crate[r] = (b.crate[r] ?? 0) + v;
    this.events.emit('harbor:cratePrepared', { building: b, cargo: taken });
    this.events.emit('toast', { text: `İhracat sandığı rıhtımda (${cargoValue(taken)} altın değerinde); sıradaki tekne yükleyecek`, tone: 'info', icon: 'boat' });
    return taken;
  }

  // ---------------------------------------------------------------------------
  // Tekne yolu: nehirde (su ve köprü altı, yapısız) limanın önündeki açık suya, haritanın iki ucundan
  // ---------------------------------------------------------------------------

  mooringTiles(harbor) {
    const w = harbor.definition.size.w;
    const x = harbor.orientation === 'right' ? harbor.tileX + w : harbor.tileX - 1;
    return [{ x, y: harbor.tileY }, { x, y: harbor.tileY + 1 }];
  }

  navigable(x, y) {
    const map = this.world.map;
    if (!map.inBounds(x, y)) return false;
    const tile = map.get(x, y);
    return (tile === 'water' || tile === 'bridge') && map.getOccupant(x, y) === 0;
  }

  /** Rıhtımdan nehrin uçlarına en kısa yollar (BFS). Dönüş: { arrive, leave } nokta dizileri ya da null. */
  computeRoute(harbor) {
    const map = this.world.map;
    const start = this.mooringTiles(harbor).find((t) => this.navigable(t.x, t.y));
    if (!start) return null;
    const prev = new Map();
    const key = (x, y) => y * map.width + x;
    const queue = [start];
    prev.set(key(start.x, start.y), null);
    const edges = [];
    while (queue.length) {
      const t = queue.shift();
      if (t.x === 0 || t.y === 0 || t.x === map.width - 1 || t.y === map.height - 1) edges.push(t);
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = t.x + dx;
        const ny = t.y + dy;
        const k = key(nx, ny);
        if (prev.has(k) || !this.navigable(nx, ny)) continue;
        prev.set(k, t);
        queue.push({ x: nx, y: ny });
      }
    }
    const toPoints = (edge) => {
      const tiles = [];
      for (let t = edge; t; t = prev.get(key(t.x, t.y))) tiles.push(t);
      return tiles.map((t) => ({ x: t.x * T + 8, y: t.y * T + 9 })); // uçtan rıhtıma
    };
    const top = edges.filter((e) => e.y === 0).sort((a, b) => a.x - b.x)[0];
    const bottom = edges.filter((e) => e.y === map.height - 1).sort((a, b) => a.x - b.x)[0];
    const from = top ?? edges[0];
    const to = bottom ?? edges[edges.length - 1];
    if (!from) return null; // rıhtımdan nehrin uçlarına su yolu yok
    const arrive = toPoints(from);
    const leave = toPoints(to ?? from).reverse();
    // Rıhtımda tekne iskelenin ucuna değil, biraz açığına yanaşır (gövdesi iskelenin altında kalmasın)
    const dx = harbor.orientation === 'left' ? -4 : 4;
    arrive[arrive.length - 1] = { ...arrive[arrive.length - 1], x: arrive[arrive.length - 1].x + dx };
    leave[0] = { ...leave[0], x: leave[0].x + dx };
    return { arrive, leave };
  }

  getRoute(harbor) {
    if (!this.route || this.route.harborId !== harbor.id) this.route = { harborId: harbor.id, ...(this.computeRoute(harbor) ?? { arrive: null, leave: null }) };
    return this.route.arrive ? this.route : null;
  }

  // ---------------------------------------------------------------------------
  // Tekne yolculuğu
  // ---------------------------------------------------------------------------

  ensureEntity() {
    if (!this.entity) this.entity = new Boat();
    this.world.boats = [this.entity];
  }

  dismissBoat() {
    this.trade.boat = null;
    this.entity = null;
    this.world.boats = [];
  }

  update(tick) {
    const harbor = this.harbor();
    const boat = this.trade.boat;
    if (!harbor) {
      if (boat) this.dismissBoat();
      return;
    }
    if (!boat) {
      const now = this.state.totalMinutes;
      if (this.trade.nextBoatAt === null) this.trade.nextBoatAt = now + 120;
      if (now >= this.trade.nextBoatAt && (isWithinHours(tick.hour, EXPORT.hours) || this.trade.grandPending)) this.launch(harbor);
      return;
    }
    const route = this.getRoute(harbor);
    if (!route) {
      this.dismissBoat();
      return;
    }
    harbor.active = boat.stage === 'docked';
    const path = boat.stage === 'leaving' ? route.leave : route.arrive;
    if (boat.stage === 'docked') {
      this.place(route.arrive[route.arrive.length - 1], null, false);
      if (this.state.totalMinutes >= boat.dockUntil) this.depart(harbor);
      return;
    }
    if (tick.simDt <= 0) {
      this.place(this.pointAt(path, boat.progress), null, true);
      return;
    }
    boat.progress = Math.min(path.length - 1, boat.progress + (EXPORT.speed * tick.simDt) / T);
    const here = this.pointAt(path, boat.progress);
    const ahead = this.pointAt(path, Math.min(path.length - 1, boat.progress + 0.5));
    this.place(here, ahead, true);
    if (boat.progress >= path.length - 1) {
      if (boat.stage === 'arriving') this.dock(harbor);
      else this.finishVoyage();
    }
  }

  pointAt(path, progress) {
    const i = Math.floor(progress);
    const a = path[Math.min(i, path.length - 1)];
    const b = path[Math.min(i + 1, path.length - 1)];
    const f = progress - i;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  place(point, ahead, moving) {
    this.ensureEntity();
    const e = this.entity;
    if (ahead) {
      const dx = ahead.x - point.x;
      const dy = ahead.y - point.y;
      const d = Math.hypot(dx, dy) || 1;
      e.heading = { x: dx / d, y: dy / d };
      if (Math.abs(dx) > 0.2) e.facing = dx < 0 ? 'left' : 'right';
    }
    e.x = point.x;
    e.y = point.y;
    e.moving = moving;
    // Köprünün altından geçerken görünmez (köprü karosu teknenin üstünde kalır gibi)
    const map = this.world.map;
    e.visible = map.get(Math.floor(point.x / T), Math.floor(point.y / T)) !== 'bridge';
    e.loaded = Object.keys(this.trade.boat?.cargo ?? {}).length > 0;
    e.grand = Boolean(this.trade.boat?.grand);
  }

  launch(harbor) {
    if (!this.getRoute(harbor)) {
      this.trade.nextBoatAt = this.state.totalMinutes + 120;
      return;
    }
    const grand = Boolean(this.trade.grandPending);
    this.trade.grandPending = false;
    this.trade.boat = { stage: 'arriving', progress: 0, cargo: {}, dockUntil: 0, grand };
    this.ensureEntity();
    this.events.emit('harbor:boatArriving', { building: harbor, grand });
  }

  /** (14. aşama) Büyük İhracat Seferi: altın ödenir, kervan teknesi hemen yola çıkar ya da sıradaki tekne kervan olur. */
  orderGrandVoyage() {
    const status = grandVoyageStatus(this.state);
    if (!status.ok) {
      this.events.emit('toast', { text: `Büyük İhracat Seferi: ${status.reason}`, tone: 'warn', icon: 'boat' });
      return status;
    }
    const harbor = this.harbor();
    if (!this.economy.spend({ gold: status.price })) return { ok: false, reason: 'Yetersiz altın' };
    const trade = this.trade;
    trade.grandDay = this.state.time.day;
    trade.grandVoyages = (trade.grandVoyages ?? 0) + 1;
    if (this.state.luxury) {
      this.state.luxury.goldSpent += status.price;
      this.state.luxury.purchases += 1;
    }
    const boat = trade.boat;
    if (boat && boat.stage === 'arriving') boat.grand = true; // henüz yük almamış tekne kervana dönüşür
    else {
      trade.grandPending = true;
      if (!boat) this.launch(harbor); // saati beklemeden hemen yola çıkar
    }
    this.events.emit('harbor:grandVoyage', { building: harbor, price: status.price });
    this.events.emit('toast', {
      text: `Büyük İhracat Seferi ilan edildi (−${status.price} altın): kervan teknesi nehirden geliyor; ${EXPORT.grandVoyage.threshold}'ü aşan mallar 2,5 kat yükle gidecek.`,
      tone: 'success',
      icon: 'boat',
    });
    return { ok: true };
  }

  /** Yanaştı: sandığı ve sınırı aşan fazlalığı yükler (tekne kapasitesine kadar, orantılı). */
  dock(harbor) {
    const boat = this.trade.boat;
    boat.stage = 'docked';
    boat.dockUntil = this.state.totalMinutes + EXPORT.dockHours * 60;
    const grand = Boolean(boat.grand);
    let room = boatCapacity(this.state, grand);
    const cargo = {};
    // Önce rıhtımdaki sandık
    for (const [r, v] of Object.entries(harbor.crate ?? {})) {
      const n = Math.min(v, room);
      if (n > 0) cargo[r] = n;
      room -= n;
    }
    harbor.crate = null;
    // Sonra fazlalık (her kaynaktan orantılı)
    // Büyük İhracat Seferi'nde sınır geçici olarak düşer (ihracat kapalıysa bile)
    const threshold = grand ? Math.min(harbor.exportThreshold ?? Infinity, EXPORT.grandVoyage.threshold) : harbor.exportThreshold;
    const excess = exportExcess(this.state, threshold);
    const total = Object.values(excess).reduce((a, b) => a + b, 0);
    if (total > 0 && room > 0) {
      const ratio = Math.min(1, room / total);
      for (const [r, v] of Object.entries(excess)) {
        const n = Math.floor(v * ratio);
        if (n > 0 && this.economy.spend({ [r]: n })) cargo[r] = (cargo[r] ?? 0) + n;
      }
    }
    boat.cargo = cargo;
    this.events.emit('harbor:boatDocked', { building: harbor, cargo });
  }

  /** Ayrılırken yükün değeri hazineye girer; ara sıra Ticaret Bereketi. */
  depart(harbor) {
    const boat = this.trade.boat;
    const cargo = boat.cargo ?? {};
    const grand = Boolean(boat.grand);
    const gold = cargoValue(cargo, relicExportValue(this.state) * researchExportMultiplier(this.state) * doctrineExportMultiplier(this.state) * (grand ? EXPORT.grandVoyage.valueBonus : 1)); // (28.4)
    const trade = this.trade;
    let bonus = null;
    if (gold > 0) {
      this.economy.add('gold', gold);
      trade.shipments += 1;
      trade.goldEarned += gold;
      for (const [r, v] of Object.entries(cargo)) trade.exported[r] = (trade.exported[r] ?? 0) + v;
      if (this.rng.next() < EXPORT.bonusChance) {
        bonus = EXPORT.bonusBuff;
        this.state.buffs[bonus] = this.state.totalMinutes + TOWN_BUFFS[bonus].hours * 60;
      }
      const { day, hour, minute } = this.state.time;
      trade.last = { day, hour, minute, gold, cargo };
    }
    boat.stage = 'leaving';
    boat.progress = 0;
    harbor.active = false;
    this.events.emit('harbor:shipped', { building: harbor, cargo, gold, bonus, grand });
    if (gold > 0) {
      const list = Object.entries(cargo).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ');
      this.events.emit('toast', {
        text: `${grand ? 'Büyük İhracat Seferi: kervan teknesi' : 'Ticaret teknesi'} yüklendi: ${list} → +${gold} altın${bonus ? ' · Ticaret Bereketi!' : ''}`,
        tone: 'success',
        icon: 'coin',
      });
    }
  }

  finishVoyage() {
    this.dismissBoat();
    // Bekleyen bir Büyük İhracat Seferi varsa kervan hemen gelir
    this.trade.nextBoatAt = this.state.totalMinutes + (this.trade.grandPending ? 0 : EXPORT.intervalHours * 60);
  }
}
