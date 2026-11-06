// (22. aşama) Krallık: Krallık Vergisi ve Kraliyet Tahsildarı, Kraliyet Fermanları, Kraliyet Aslanlı Heykeli. Sayılar
// src/data/crown.js'te, saf hesaplar ./Crown.js'te.
//
//   Krallık Vergisi : her 6 günde bir 12:00'de. Tutar seviye, nüfus, Altın Çağ ve Krallık İtibarı'yla ölçeklenir. İki gün önce
//                     tahsildar yola çıkar ('crown:levyNotice' { amount, at }: bildirim, günlük, üst çubuk çipi). Vakti gelince
//                     hazineden ödenir (altın yetmezse tutarın en çok yarısı yiyecek / odun / taşla): güven ve itibar artar
//                     ('crown:levyPaid'). Ödenemezse Krallık hazineye el koyar, depodan zorla mal çeker, güven ve refah darbe
//                     alır ('crown:levyFailed'; "Kraliyet Cezası" refah bonusu eksidir).
//   Fermanlar       : Köy seviyesinden itibaren 4-6 günde bir süreli bir görev gelir ('crown:decree'): kaynak teslimi (garnizon
//                     erzağı, şölen, tersane), araştırma ya da usta işi eser. Süresinde teslim edilirse ('ui:deliverDecree')
//                     altın ve özel ödül (Kadim Dişli, Nadir Tohum, Antik Kitap, Kraliyet Beratı); süresi dolar ya da reddedilirse
//                     ('ui:rejectDecree') Krallık para / erzak cezası keser.
//   Aslanlı Heykel  : Kraliyet Beratı'yla açılır (yapı: royalStatue); kalıcı refah (townBonus) ve saat başı güven.
// Durum: state.crown (kayda girer).
import { LEVY, DECREES, DECREE_KEYS, DECREE, DECREE_ITEMS, ROYAL_STATUE } from '../data/crown.js';
import { GOLDEN_AGE } from '../data/goldenAge.js';
import { emptyCrown, nextOnSchedule, levyAmount, levyPlan, decreeNeed, decreeStatus, reputationLevel } from './Crown.js';
import { isGoldenAge } from './GoldenAge.js';
import { researchLeft } from './Petitions.js';
import { clamp } from '../utils/math.js';

const PENALTY_BUFF = 'royalPenalty';

export class CrownSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy, trust }} services
   * @param {import('../utils/random.js').Random} rng
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, { economy, trust }, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.trust = trust;
    this.rng = rng;
    this.attract = attract;
    this.state.crown ??= emptyCrown();
    const cr = this.state.crown;
    const now = this.state.totalMinutes;
    if (!Number.isFinite(cr.nextLevyAt)) cr.nextLevyAt = nextOnSchedule(now, LEVY.everyDays, LEVY.hour);
    if (!Number.isFinite(cr.nextDecreeAt)) cr.nextDecreeAt = Math.max(now + 1440, (DECREE.firstDay - 1) * 1440 + 10 * 60);
    this.unsubscribers = [
      game.events.on('time:hour', (hour) => this.hourly(hour)),
      game.events.on('ui:deliverDecree', () => this.deliver()),
      game.events.on('ui:rejectDecree', () => this.resolveDecree('rejected')),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get crown() {
    return this.state.crown;
  }

  hourly(hour) {
    const cr = this.crown;
    const now = this.state.totalMinutes;
    // Kraliyet Aslanlı Heykeli: kalıcı güven
    const statues = this.state.buildings.filter((b) => b.functional && b.type === 'royalStatue').length;
    if (statues > 0) this.trust?.adjust(ROYAL_STATUE.trustPerHour * Math.min(1, statues));
    if (this.attract) return;
    // Tahsildar yolda: iki gün önce uyarı
    if (!cr.notice && now >= cr.nextLevyAt - LEVY.noticeDays * 1440) this.announceLevy();
    if (now >= cr.nextLevyAt) this.collectLevy();
    // Fermanlar
    if (cr.decree && now >= cr.decree.deadline) this.resolveDecree('expired');
    if (!cr.decree && now >= cr.nextDecreeAt && hour >= 8 && hour < 18) {
      if (!this.openDecree()) cr.nextDecreeAt = now + 720;
    }
  }

  // ---------------------------------------------------------------------------
  // Krallık Vergisi
  // ---------------------------------------------------------------------------

  announceLevy() {
    const cr = this.crown;
    const amount = levyAmount(this.state);
    cr.notice = { at: cr.nextLevyAt, amount, announcedAt: this.state.totalMinutes };
    this.events.emit('crown:levyNotice', { amount, at: cr.nextLevyAt });
    this.events.emit('toast', { text: `Kraliyet Tahsildarı yolda! ${LEVY.noticeDays} gün sonra Krallık Vergisi: ${amount} altın. İç vergiyi ayarla, hazineyi hazırla.`, tone: 'warn', icon: 'collector' });
    return cr.notice;
  }

  /** Vergi günü: ödenir ya da ceza kesilir. Dönüş: { ok, amount, gold, goods }. */
  collectLevy() {
    const s = this.state;
    const cr = this.crown;
    const amount = cr.notice?.amount ?? levyAmount(s);
    cr.notice = null;
    cr.nextLevyAt = s.totalMinutes + LEVY.everyDays * 1440; // sıradaki her zaman tam 6 gün sonra (takvim dışı tahsilattan sonra da)
    cr.levies += 1;
    const plan = levyPlan(s, amount);
    if (plan.ok) {
      const cost = { gold: plan.gold, ...plan.goods };
      for (const k of Object.keys(cost)) if (!cost[k]) delete cost[k];
      this.economy.spend(cost);
      cr.paid += 1;
      cr.reputation = clamp(cr.reputation + LEVY.paid.reputation, 0, 100);
      this.trust?.adjust(LEVY.paid.trust, 'levyPaid');
      cr.lastLevy = { day: s.time.day, amount, ok: true, gold: plan.gold, goods: plan.goods };
      this.events.emit('crown:levyPaid', { amount, gold: plan.gold, goods: plan.goods });
      this.events.emit('toast', { text: `Krallık Vergisi ödendi: ${amount} altın${Object.keys(plan.goods).length ? ' (bir kısmı malla)' : ''}. Krallık memnun.`, tone: 'success', icon: 'collector' });
      return { ok: true, amount, gold: plan.gold, goods: plan.goods };
    }
    // Ödenemedi: hazineye el konur, depodan zorla mal çekilir
    const seized = s.resources.gold ?? 0;
    if (seized > 0) this.economy.spend({ gold: seized });
    const short = amount - seized;
    const goods = {};
    let owed = short * LEVY.failed.goodsPerGold;
    for (const r of LEVY.inKindResources) {
      const take = Math.min(Math.floor((s.resources[r] ?? 0) * LEVY.failed.goodsShare), Math.ceil(owed / (LEVY.inKindResources.length - Object.keys(goods).length)));
      if (take <= 0) continue;
      this.economy.spend({ [r]: take });
      goods[r] = take;
      owed -= take;
    }
    cr.failed += 1;
    cr.reputation = clamp(cr.reputation + LEVY.failed.reputation, 0, 100);
    this.trust?.adjust(LEVY.failed.trust, 'levyFailed');
    s.buffs[PENALTY_BUFF] = s.totalMinutes + 48 * 60; // refah darbesi (data/town.js -> TOWN_BUFFS.royalPenalty)
    for (const c of s.characters) if (!c.role) c.needs.fun = clamp(c.needs.fun - 10, 0, 100);
    cr.lastLevy = { day: s.time.day, amount, ok: false, gold: seized, goods };
    this.events.emit('crown:levyFailed', { amount, seized, goods });
    this.events.emit('toast', { text: `Krallık Vergisi ödenemedi! Tahsildar hazineye (${seized} altın) el koydu, depodan zorla mal çekti.`, tone: 'warn', icon: 'collector' });
    return { ok: false, amount, gold: seized, goods };
  }

  // ---------------------------------------------------------------------------
  // Kraliyet Fermanları
  // ---------------------------------------------------------------------------

  /** Bu kasabaya şu an gönderilebilecek fermanlar. */
  availableDecrees() {
    const s = this.state;
    if ((s.town?.tier ?? 1) < DECREE.minTier) return [];
    const has = (type) => s.buildings.some((b) => b.functional && b.type === type);
    return DECREE_KEYS.filter((k) => {
      const def = DECREES[k];
      if (!def.requires.every(has)) return false;
      if (def.kind === 'research') return researchLeft(s);
      if (def.kind === 'masterwork') return (s.masterworks?.made ?? 0) > 0;
      if (def.reward.item === 'statueRight' && this.crown.statueRight) return this.rng.next() < 0.4; // berat alındıysa daha seyrek
      return true;
    });
  }

  /** Yeni bir ferman açar (forceKind: testler). Dönüş: ferman ya da null. */
  openDecree(forceKind = null) {
    const s = this.state;
    const cr = this.crown;
    const options = forceKind ? [forceKind] : this.availableDecrees();
    if (options.length === 0) return null;
    const kind = forceKind ?? this.rng.pick(options);
    const def = DECREES[kind];
    const now = s.totalMinutes;
    cr.decree = {
      id: cr.nextDecreeId++,
      kind,
      need: decreeNeed(s, kind),
      createdAt: now,
      deadline: now + DECREE.deadlineMinutes,
      baseline: { done: Object.keys(s.research?.done ?? {}).length },
      reward: this.rewardFor(kind),
      day: s.time.day,
    };
    cr.nextDecreeAt = now + this.rng.int(DECREE.intervalMinutes[0], DECREE.intervalMinutes[1]);
    this.events.emit('crown:decree', { decree: cr.decree, def });
    this.events.emit('toast', { text: `Kraliyet Fermanı: ${def.name}. ${Math.round(DECREE.deadlineMinutes / 1440)} gün içinde teslim edilmeli.`, tone: 'info', icon: 'decree' });
    return cr.decree;
  }

  /** Fermanın ödülü: { gold, item, amount } (altın seviye ve itibarla ölçeklenir). */
  rewardFor(kind) {
    const def = DECREES[kind];
    const tier = Math.max(1, Math.min(4, this.state.town?.tier ?? 1));
    const mult = reputationLevel(this.crown.reputation).reward;
    return { gold: Math.round(def.reward.goldPerTier * tier * mult), item: def.reward.item, amount: def.reward.amount };
  }

  /** Fermanı teslim eder. Dönüş: { ok, reason }. */
  deliver() {
    const s = this.state;
    const d = this.crown.decree;
    const st = decreeStatus(s, d);
    if (!st.ok) {
      if (d) this.events.emit('toast', { text: `${DECREES[d.kind].name}: ${st.reason}`, tone: 'warn', icon: 'decree' });
      return st;
    }
    const def = DECREES[d.kind];
    if (def.kind === 'masterwork') {
      const item = s.masterworks.items.find((i) => i.status === 'stored');
      item.status = 'sold';
      item.buyer = 'crown';
      s.masterworks.sold = (s.masterworks.sold ?? 0) + 1;
      d.piece = item.type;
    } else if (!def.kind && !this.economy.spend(d.need)) return { ok: false, reason: 'Kaynak yetmiyor' };
    this.resolveDecree('delivered');
    return { ok: true };
  }

  /** Ferman sonuçlanır: delivered (ödül) | expired / rejected (ceza). */
  resolveDecree(outcome) {
    const s = this.state;
    const cr = this.crown;
    const d = cr.decree;
    if (!d) return null;
    cr.decree = null;
    const def = DECREES[d.kind];
    const result = { outcome, kind: d.kind, name: def.name, day: s.time.day };
    if (outcome === 'delivered') {
      cr.delivered += 1;
      cr.reputation = clamp(cr.reputation + DECREE.delivered.reputation, 0, 100);
      this.trust?.adjust(DECREE.delivered.trust, 'decreeDelivered');
      const r = d.reward ?? this.rewardFor(d.kind);
      let gold = r.gold;
      let item = r.item;
      if (r.item === 'gears') this.economy.add('gears', r.amount);
      else if (r.item === 'rareSeed') {
        s.exploration.items.vineSeed = (s.exploration.items.vineSeed ?? 0) + r.amount;
      } else if (r.item === 'ancientBook') {
        if (isGoldenAge(s) && (s.goldenAge.books ?? 0) < GOLDEN_AGE.maxBooks) {
          s.goldenAge.books += r.amount;
          this.events.emit('goldenAge:book', { books: s.goldenAge.books });
        } else if ((s.goldenAge.books ?? 0) < GOLDEN_AGE.maxBooks) {
          s.goldenAge.books = (s.goldenAge.books ?? 0) + r.amount; // kitaplık Altın Çağ'dan önce de dolabilir
        } else {
          gold += DECREE.bookFallbackGold;
          item = null;
        }
      } else if (r.item === 'statueRight') {
        if (cr.statueRight) {
          gold += DECREE.rightFallbackGold;
          item = null;
        } else cr.statueRight = true;
      }
      this.economy.add('gold', gold);
      result.gold = gold;
      result.item = item;
      this.events.emit('crown:decreeDelivered', { decree: d, def, gold, item });
      this.events.emit('toast', { text: `Ferman teslim edildi: ${def.name}. Krallık ödülü: +${gold} altın${item ? ` ve ${DECREE_ITEMS[item].name}` : ''}!`, tone: 'success', icon: 'decree' });
    } else {
      cr.decreesFailed += 1;
      const tier = Math.max(1, Math.min(4, s.town?.tier ?? 1));
      const gold = Math.min(s.resources.gold ?? 0, DECREE.failed.goldPerTier * tier);
      if (gold > 0) this.economy.spend({ gold });
      let food = 0;
      if (gold < DECREE.failed.goldPerTier * tier) {
        food = Math.min(s.resources.food ?? 0, DECREE.failed.foodPerTier * tier);
        if (food > 0) this.economy.spend({ food });
      }
      cr.reputation = clamp(cr.reputation + DECREE.failed.reputation, 0, 100);
      this.trust?.adjust(DECREE.failed.trust, 'decreeFailed');
      result.fine = { gold, food };
      this.events.emit('crown:decreeFailed', { decree: d, def, outcome, gold, food });
      this.events.emit('toast', { text: `${def.name}: ferman ${outcome === 'rejected' ? 'reddedildi' : 'süresinde yerine getirilmedi'}. Krallık ceza kesti: ${gold} altın${food ? `, ${food} yiyecek` : ''}.`, tone: 'warn', icon: 'decree' });
    }
    cr.decreeLog.push(result);
    if (cr.decreeLog.length > DECREE.logSize) cr.decreeLog.splice(0, cr.decreeLog.length - DECREE.logSize);
    return result;
  }
}
