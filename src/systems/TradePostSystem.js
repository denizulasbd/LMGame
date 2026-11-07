// (24.3) Dış ticaret döngüsü: Ticaret İskelesi / Kervan Konağı. Sayılar data/tradePost.js'te, saf hesaplar ./TradePost.js'te.
//
//   Takvim     : iskele tamamlanınca en az 12 saat sonra, 09:00'da ilk Ticaret Gemisi (yapının yanında su varsa) ya da Kervanı
//                (yoksa) gelir; 24 saat kalır, sonra ayrılır. Sonraki ziyaret sırayla 3 ve 4 gün sonra 09:00'dadır. İskele
//                çalışmıyorsa (şantiye, hasar, yangın) gelen olmaz; vakit gelince ilk uygun saatte uğrar.
//   Sözleşme   : her ziyarette 3 ihracat talebi (Kumaş, Fıçı Şerbeti + sırayla Ekmek / Erzak / Yün). 'ui:completeContract'
//                { index }: mallar depodan düşer, karşılığı (taban altın × pazar çarpanı) Kasaba Hazinesi'ne girer.
//   Doygunluk  : aynı mal 3 kez peş peşe ihraç edilince o malın çarpanı %12 düşer (her ek satışta yeniden; en düşük %55).
//                Başka bir mal satılınca öteki malların çarpanı %5 toparlanır; her yeni ziyarette önceki ziyarette satılmayan
//                malların çarpanı %5 toparlanır (en çok 1).
//   İthalat    : 'ui:importPackage' { kind }: gemi / kervan buradayken altınla Odun / Taş / Demir paketi alınır; mallar anında
//                ambara iner (depoda yer olmalı). Her paketten ziyaret başına 3 tane.
// Durum: state.tradePost (kayda girer). Rastgelelik yoktur.
import { VISIT, CONTRACTS, MARKET, IMPORTS } from '../data/tradePost.js';
import { RESOURCES } from '../data/resources.js';
import { emptyTradePost, nextArrival, intervalFor, contractsFor, contractStatus, importStatus, tradePostReady, shipDocked } from './TradePost.js';

const ROADS = new Set(['path', 'cobble', 'plaza', 'bridge']);

export class TradePostSystem {
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
    this.state.tradePost ??= emptyTradePost();
    this.ensureSchedule();
    this.unsubscribers = [
      game.events.on('ui:completeContract', ({ index }) => this.complete(index)),
      game.events.on('ui:importPackage', ({ kind }) => this.buy(kind)),
      game.events.on('building:completed', (b) => b?.type === 'tradingPost' && this.ensureSchedule()),
      game.events.on('time:hour', () => this.hourly()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get post() {
    return this.world.buildings.find((b) => b.type === 'tradingPost' && !b.underConstruction) ?? null;
  }

  /** İskele varsa ve takvim kurulmamışsa ilk varışı belirler. */
  ensureSchedule() {
    const tp = this.state.tradePost;
    if (tp.ship || tp.nextShipAt !== null || !this.post) return;
    tp.nextShipAt = nextArrival(this.state.totalMinutes + VISIT.firstHours * 60, 0);
  }

  hourly() {
    const tp = this.state.tradePost;
    const now = this.state.totalMinutes;
    if (tp.ship && now >= tp.ship.leavesAt) this.depart();
    if (!tp.ship && tp.nextShipAt !== null && now >= tp.nextShipAt && tradePostReady(this.state)) this.arrive();
  }

  /** Yapının yanında su varsa gemi, yoksa kervan; yanaştığı karo (çizim için). */
  visitorFor(building) {
    const map = this.world.map;
    const { w, h } = building.definition.size;
    const sides = [];
    for (let y = building.tileY; y < building.tileY + h; y++) {
      sides.push({ x: building.tileX + w, y, side: 'right' }, { x: building.tileX - 1, y, side: 'left' });
    }
    for (let x = building.tileX; x < building.tileX + w; x++) sides.push({ x, y: building.tileY + h, side: 'down' });
    const water = sides.find((t) => map.inBounds(t.x, t.y) && map.get(t.x, t.y) === 'water');
    if (water) return { mode: 'ship', ...water };
    const road = sides.find((t) => map.inBounds(t.x, t.y) && ROADS.has(map.get(t.x, t.y)));
    return { mode: 'caravan', ...(road ?? sides[0]) };
  }

  arrive() {
    const tp = this.state.tradePost;
    const now = this.state.totalMinutes;
    const post = this.post;
    // Önceki ziyarette satılmayan malların fiyatı toparlanır
    const lastSold = new Set(tp.lastSold ?? []);
    for (const r of Object.keys(tp.market)) {
      if (lastSold.has(r)) continue;
      this.recover(r, MARKET.recoverPerVisit);
    }
    const visitor = post ? this.visitorFor(post) : { mode: 'ship' };
    tp.ship = {
      arrivedAt: now,
      leavesAt: now + VISIT.stayHours * 60,
      mode: visitor.mode,
      contracts: contractsFor(tp.visits),
      stock: Object.fromEntries(Object.entries(IMPORTS).map(([k, d]) => [k, d.stock])),
      sold: [],
    };
    tp.visits += 1;
    tp.nextShipAt = null;
    const who = visitor.mode === 'ship' ? 'Ticaret Gemisi iskeleye demir attı' : 'Kervan konağa çadır kurdu';
    this.events.emit('trade:shipArrived', { ship: tp.ship, building: post });
    this.events.emit('toast', { text: `${who}: 24 saat kalacak, ${tp.ship.contracts.length} ihracat talebi var`, tone: 'info', icon: 'coin' });
    return tp.ship;
  }

  depart() {
    const tp = this.state.tradePost;
    const ship = tp.ship;
    if (!ship) return;
    const done = ship.contracts.filter((c) => c.done).length;
    tp.log.push({ day: this.state.time.day, text: `${ship.mode === 'ship' ? 'Gemi' : 'Kervan'} ayrıldı: ${done}/${ship.contracts.length} sözleşme`, done });
    if (tp.log.length > 8) tp.log.splice(0, tp.log.length - 8);
    tp.lastSold = [...ship.sold];
    tp.ship = null;
    tp.nextShipAt = nextArrival(this.state.totalMinutes, intervalFor(tp.visits - 1));
    this.events.emit('trade:shipLeft', { done });
  }

  recover(resource, amount) {
    const m = this.state.tradePost.market;
    if (m[resource] === undefined) return;
    m[resource] = Math.min(1, m[resource] + amount);
    if (m[resource] >= 1 - 1e-9) delete m[resource];
  }

  /** İhracat sözleşmesini tamamlar. Dönüş: kazanılan altın (olmadıysa 0). */
  complete(index) {
    const status = contractStatus(this.state, index);
    if (!status.ok) {
      this.events.emit('toast', { text: status.reason, tone: 'warn', icon: 'coin' });
      return 0;
    }
    const tp = this.state.tradePost;
    const c = tp.ship.contracts[index];
    if (!this.economy.spend({ [c.resource]: c.qty })) return 0;
    const gold = status.gold;
    this.economy.add('gold', gold);
    c.done = true;
    c.paid = gold;
    tp.ship.sold.push(c.resource);
    tp.completed += 1;
    tp.goldEarned += gold;
    tp.exported[c.resource] = (tp.exported[c.resource] ?? 0) + c.qty;
    // Doygunluk: aynı mal peş peşe; başka mal satılınca ötekiler toparlanır
    if (tp.streak.resource === c.resource) tp.streak.count += 1;
    else tp.streak = { resource: c.resource, count: 1 };
    for (const r of Object.keys(tp.market)) if (r !== c.resource) this.recover(r, MARKET.recoverOnOther);
    if (tp.streak.count >= MARKET.streak) tp.market[c.resource] = Math.max(MARKET.floor, (tp.market[c.resource] ?? 1) - MARKET.drop);
    this.events.emit('trade:contractDone', { contract: c, gold });
    this.events.emit('toast', { text: `${CONTRACTS[c.resource].title} tamamlandı: ${c.qty} ${RESOURCES[c.resource].name.toLocaleLowerCase('tr')} yüklendi, hazineye +${gold} altın`, tone: 'good', icon: 'coin' });
    return gold;
  }

  /** Hammadde paketi ithal eder. Dönüş: alındı mı. */
  buy(kind) {
    const status = importStatus(this.state, kind);
    if (!status.ok) {
      this.events.emit('toast', { text: status.reason, tone: 'warn', icon: 'coin' });
      return false;
    }
    const def = IMPORTS[kind];
    const tp = this.state.tradePost;
    if (!this.economy.spend(def.give)) return false;
    for (const [r, v] of Object.entries(def.get)) {
      this.economy.add(r, v);
      tp.imported[r] = (tp.imported[r] ?? 0) + v;
    }
    tp.ship.stock[kind] -= 1;
    tp.imports += 1;
    tp.goldSpent += def.give.gold;
    this.events.emit('trade:imported', { kind, def });
    this.events.emit('toast', { text: `${def.name} ambara indi (${def.give.gold} altın)`, tone: 'info', icon: RESOURCES[Object.keys(def.get)[0]].icon });
    return true;
  }

  /** Her kare: iskelede yanaşan gemi / kervanın çizim bilgisi. */
  update() {
    const post = this.post;
    if (!post) return;
    const docked = shipDocked(this.state) && post.functional;
    if (!docked) {
      post.visitor = null;
      return;
    }
    if (!post.visitor) post.visitor = this.visitorFor(post);
  }
}
