// (21. aşama) Yönetim Güveni / asayiş, isyan, yağma ve yatıştırma. Sayılar src/data/citizens.js'te.
// Refah (TownStatus.townHappiness) hesabına dokunmaz; onunla paralel çalışır ve onu okur.
//
//   Güven      : 0-100, başlangıçta 75. Saat başı kasabanın ortalama refahına göre değişir (%70 üstü artar, %35 altı erir),
//                açlıktan kıvranan sakinler ve kışın soğuyan evler güveni düşürür. Dilekçeler (PetitionSystem adjust'ı
//                çağırır), şenlikler, festivaller, Büyük Ziyafet, Altın İkramiye ve toplanma zili etkiler. 'trust:changed'.
//   İsyan      : güven ya da refah REVOLT.graceHours saat boyunca kritik eşiğin (%25) altında kalırsa çıkar
//                ('revolt:started' { rioters }). Mutsuz yetişkinler (en az 2, en çok %60) işlerini bırakır, gündüz meydanda
//                öfkeyle toplanır (Brain -> planRiot / 'protest').
//   Yağma      : isyan sürerken 3 saatte bir en çok 3 isyancı Kiler'e (erzak, odun), Fırın'a (ekmek) ya da Belediye
//                Konağı'na (hazine) yürür ('revolt:raid'); vardıklarında ('riot:loot') kasaba stoğundan düşülen mal
//                kaybolmaz, birebir yağmacının çantasına (Erzak, Ekmek, Odun Demeti), altın da kesesine geçer ('riot:looted').
//   Yatıştırma : oyuncu meydan havuzunun ya da Belediye Konağı'nın panelinden acil erzak / altın dağıtır ('ui:relief'),
//                şenlik düzenler ya da dilekçeleri karşılar; güven %35'in üstüne çıkıp refah kritik olmaktan kurtulunca
//                isyan biter ('revolt:ended'), sakinler işlerinin başına döner.
// Durum: state.trust (kayda girer).
import { TRUST, REVOLT, RELIEF, PURSE } from '../data/citizens.js';
import { emptyTrust, trustValue, addItem, addCoins, roomFor, raidOf } from './Citizens.js';
import { townHappiness, happinessOf, foodSupply } from './TownStatus.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';

export const LOOT_ITEMS = { food: 'ration', bread: 'bread', wood: 'firewood' };

/** Ortalama refah (TownLevelSystem'in yürüyen ortalaması; yoksa anlık refah). */
export function trustWelfare(state) {
  return Number.isFinite(state.town?.welfare) ? state.town.welfare : townHappiness(state);
}

/** Acil dağıtımın durumu ve bedeli: { ok, reason, cost } (cost: yiyecek değeri ya da altın). */
export function reliefStatus(state, kind) {
  const def = RELIEF[kind];
  if (!def) return { ok: false, reason: 'Bilinmeyen dağıtım', cost: 0 };
  const people = state.characters.filter((c) => !c.role);
  const adults = people.filter((c) => !c.isChild);
  const cost = Math.max(def.min, def.perResident * (kind === 'gold' ? adults.length : people.length));
  const last = state.trust?.relief?.[kind];
  if (Number.isFinite(last) && state.totalMinutes - last < def.cooldownMinutes) {
    const wait = Math.ceil((def.cooldownMinutes - (state.totalMinutes - last)) / 60);
    return { ok: false, reason: `${wait} saat sonra yeniden dağıtılabilir`, cost };
  }
  if (kind === 'food' && foodSupply(state) < cost) return { ok: false, reason: `Kilerde ${cost} yiyecek değeri yok`, cost };
  if (kind === 'gold' && (state.resources.gold ?? 0) < cost) return { ok: false, reason: `Hazinede ${cost} altın yok`, cost };
  return { ok: true, reason: null, cost };
}

export class TrustSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem }} services
   * @param {import('../utils/random.js').Random} rng
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, { economy }, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.rng = rng;
    this.attract = attract;
    this.state.trust ??= emptyTrust();
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('time:hour', () => this.hourly()),
      on('ui:relief', ({ kind }) => this.relief(kind)),
      on('riot:loot', ({ character, building }) => this.loot(character, building)),
      on('festival:started', () => this.onEvent('festival')),
      on('seasonFestival:ended', () => this.onEvent('seasonFestival')),
      on('civic:decreed', ({ id }) => id === 'grandFeast' && this.onEvent('grandFeast')),
      on('goldDecree:issued', ({ id }) => id === 'goldBonus' && this.onEvent('goldBonus')),
      on('rally:rung', () => this.onEvent(this.state.trust.revolt ? 'rallyRevolt' : 'rally', true)),
      on('heating:cold', () => this.onEvent('cold')),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get trust() {
    return this.state.trust;
  }

  /** Güveni değiştirir (0-100). Gerçek değişimi döndürür. */
  adjust(delta, reason = '') {
    const t = this.trust;
    const before = trustValue(this.state);
    t.value = clamp(before + delta, 0, 100);
    t.min = Math.min(t.min ?? t.value, t.value);
    const change = t.value - before;
    if (change !== 0 && reason) this.events.emit('trust:changed', { value: t.value, delta: change, reason });
    return change;
  }

  /** Kasaba olayının güvene etkisi (daily: aynı tür günde bir kez sayılır). */
  onEvent(kind, daily = false) {
    const key = kind === 'rallyRevolt' ? 'rally' : kind;
    if (daily && this.trust.eventDays[key] === this.state.time.day) return;
    this.trust.eventDays[key] = this.state.time.day;
    this.adjust(TRUST.events[kind] ?? 0, kind);
  }

  /** Saat başı: refah, açlık ve soğuğa göre güven; isyanın başlaması, yağmalar ve bitişi. */
  hourly() {
    const s = this.state;
    const welfare = trustWelfare(s);
    let delta = (TRUST.welfareDrift.find((d) => welfare >= d.min) ?? TRUST.welfareDrift[TRUST.welfareDrift.length - 1]).perHour;
    const starving = s.characters.filter((c) => !c.away && !c.role && c.needs.hunger < TRUST.starvingBelow).length;
    delta += Math.max(TRUST.starvingMaxPerHour, starving * TRUST.starvingPerHour);
    if (s.heating?.cold) delta += TRUST.coldPerHour;
    this.adjust(delta);

    const t = this.trust;
    const now = s.totalMinutes;
    const critical = trustValue(s) < REVOLT.critical || welfare < REVOLT.critical;
    if (critical) t.lowSince ??= now;
    else t.lowSince = null;

    if (!t.revolt) {
      if (!this.attract && critical && now - t.lowSince >= REVOLT.graceHours * 60) this.startRevolt();
      return;
    }
    if (trustValue(s) >= REVOLT.endTrust && welfare >= REVOLT.critical) {
      this.endRevolt();
      return;
    }
    this.updateRevolt();
  }

  // ---------------------------------------------------------------------------
  // İsyan
  // ---------------------------------------------------------------------------

  adults() {
    return this.state.characters.filter((c) => !c.isChild && !c.role);
  }

  /** İsyana katılacak yetişkinler: mutluluğu düşük olanlar (en az REVOLT.minRioters, en çok %60). */
  pickRioters(existing = []) {
    const adults = this.adults();
    const cap = Math.max(REVOLT.minRioters, Math.ceil(adults.length * REVOLT.maxShare));
    const ranked = adults.filter((c) => !c.away && !existing.includes(c.id)).map((c) => ({ c, h: happinessOf(c) })).sort((a, b) => a.h - b.h || a.c.id - b.c.id);
    const angry = ranked.filter((x) => x.h < REVOLT.angryBelow - (existing.length ? 10 : 0));
    const chosen = existing.length || angry.length >= REVOLT.minRioters ? angry : ranked.slice(0, REVOLT.minRioters);
    return chosen.slice(0, Math.max(0, cap - existing.length)).map((x) => x.c.id);
  }

  /** İsyan çıkabilir mi / çıkar. Dönüş: isyan ya da null. */
  startRevolt() {
    const s = this.state;
    if (this.trust.revolt || this.adults().length < REVOLT.minAdults) return null;
    const rioters = this.pickRioters();
    if (rioters.length < REVOLT.minRioters) return null;
    const now = s.totalMinutes;
    this.trust.revolt = { since: now, rioters, raids: [], nextRaidAt: now + 60, nextJoinAt: now + REVOLT.rejoinEveryMinutes, nextRaidId: 1, looted: {} };
    this.trust.revolts = (this.trust.revolts ?? 0) + 1;
    s.stats.revolts = (s.stats.revolts ?? 0) + 1;
    for (const id of rioters) {
      const c = this.world.getCharacter(id);
      if (c?.visible) c.showBubble('angry', 2.6);
    }
    const names = rioters.map((id) => this.world.getCharacter(id)?.name).filter(Boolean);
    this.events.emit('revolt:started', { rioters, names });
    this.events.emit('toast', { text: `İsyan çıktı! ${names.length} sakin işi bıraktı ve meydanda toplanıyor. Erzak / altın dağıt ya da dilekleri karşıla.`, tone: 'warn', icon: 'torch' });
    return this.trust.revolt;
  }

  /** İsyan sürerken: öfkesi artanlar katılır, yağma baskınları düzenlenir ve biter. */
  updateRevolt() {
    const s = this.state;
    const r = this.trust.revolt;
    const now = s.totalMinutes;
    r.rioters = r.rioters.filter((id) => this.world.getCharacter(id));
    if (r.rioters.length === 0) {
      this.endRevolt();
      return;
    }
    if (now >= r.nextJoinAt) {
      r.nextJoinAt = now + REVOLT.rejoinEveryMinutes;
      const joined = this.pickRioters(r.rioters);
      if (joined.length) {
        r.rioters.push(...joined);
        this.events.emit('revolt:joined', { ids: joined });
      }
    }
    // Biten ya da süresi geçen baskınlar
    for (const raid of [...r.raids]) {
      const left = raid.members.filter((id) => !raid.done.includes(id) && this.world.getCharacter(id));
      if (left.length === 0 || now > raid.until) this.endRaid(raid);
    }
    const hour = s.time.hour;
    if (r.raids.length === 0 && now >= r.nextRaidAt && hour >= REVOLT.hours[0] && hour < REVOLT.hours[1]) this.startRaid();
  }

  /** Yağmalanacak yapılar (içinde alınacak bir şey olan). */
  raidTargets() {
    const s = this.state;
    const hasHall = s.buildings.some((b) => b.functional && b.type === 'townHall');
    return s.buildings.filter((b) => {
      if (!b.functional || !REVOLT.targets.includes(b.type) || this.world.getSpots(b).length === 0) return false;
      if (b.type === 'storage') return s.resources.food > 0 || s.resources.wood > 0 || (!hasHall && s.resources.gold > 0);
      if (b.type === 'mill') return s.resources.bread > 0;
      return s.resources.gold > 0;
    });
  }

  /** Yağma baskını başlatır: en çok 3 uyanık isyancı bir depoya yürür. Dönüş: baskın ya da null. */
  startRaid(targetId = null) {
    const r = this.trust.revolt;
    if (!r) return null;
    const targets = this.raidTargets();
    const target = targetId !== null ? targets.find((b) => b.id === targetId) : targets.length ? this.rng.pick(targets) : null;
    r.nextRaidAt = this.state.totalMinutes + REVOLT.raidEveryMinutes;
    if (!target) return null;
    const ready = r.rioters
      .map((id) => this.world.getCharacter(id))
      .filter((c) => c && !c.away && !c.isSleeping && !c.isChild && (target.type === 'townHall' || this.lootRoom(c, target) > 0));
    const members = this.rng.shuffle(ready).slice(0, REVOLT.raidSize).map((c) => c.id);
    if (members.length === 0) return null;
    const raid = { id: r.nextRaidId++, targetId: target.id, target: target.name, members, done: [], startedAt: this.state.totalMinutes, until: this.state.totalMinutes + 240, goods: {}, gold: 0 };
    r.raids.push(raid);
    this.state.stats.raids = (this.state.stats.raids ?? 0) + 1;
    for (const id of members) {
      const c = this.world.getCharacter(id);
      if (c?.visible) c.showBubble('torch', 2.6);
    }
    this.events.emit('revolt:raid', { raid, target });
    return raid;
  }

  /** Bu yağmacının o yapıdan alabileceği toplam mal (çantasındaki yere göre). */
  lootRoom(c, building) {
    return this.lootPlan(c, building).reduce((a, x) => a + x.amount, 0);
  }

  /** Yağma planı: [{ resource, item, amount }] — stok, sınır ve çantadaki yer kadar. */
  lootPlan(c, building) {
    const s = this.state;
    const hasHall = s.buildings.some((b) => b.functional && b.type === 'townHall');
    const keys = building.type === 'storage' ? ['food', 'wood'] : building.type === 'mill' ? ['bread'] : [];
    const out = [];
    for (const r of keys) {
      const amount = Math.min(REVOLT.loot[r], s.resources[r] ?? 0, roomFor(c, LOOT_ITEMS[r]));
      if (amount > 0) out.push({ resource: r, item: LOOT_ITEMS[r], amount });
    }
    if (building.type === 'townHall' || (building.type === 'storage' && !hasHall)) {
      const gold = Math.min(REVOLT.loot.gold, s.resources.gold ?? 0, PURSE.max - (c.coins ?? 0));
      if (gold > 0) out.push({ resource: 'gold', item: null, amount: gold });
    }
    return out;
  }

  /**
   * Yağmacı depoya vardı: kasaba stoğundan düşülen mal birebir çantasına, altın kesesine geçer (hiçbir şey kaybolmaz).
   * Dönüş: { goods: { kaynak: miktar }, gold } ya da null.
   */
  loot(c, building) {
    const r = this.trust.revolt;
    const raid = r && c ? raidOf(this.state, c) : null;
    if (!raid || raid.targetId !== building?.id || raid.done.includes(c.id)) return null;
    raid.done.push(c.id);
    const goods = {};
    let gold = 0;
    for (const { resource, item, amount } of this.lootPlan(c, building)) {
      if (resource === 'gold') {
        const got = addCoins(c, amount);
        if (got > 0 && this.economy.spend({ gold: got })) gold += got;
        continue;
      }
      const got = addItem(c, item, amount);
      if (got > 0 && this.economy.spend({ [resource]: got })) goods[resource] = (goods[resource] ?? 0) + got;
    }
    const units = Object.values(goods).reduce((a, b) => a + b, 0);
    for (const [k, v] of Object.entries(goods)) {
      raid.goods[k] = (raid.goods[k] ?? 0) + v;
      r.looted[k] = (r.looted[k] ?? 0) + v;
    }
    raid.gold += gold;
    r.looted.gold = (r.looted.gold ?? 0) + gold;
    this.state.stats.lootedGoods = (this.state.stats.lootedGoods ?? 0) + units;
    this.state.stats.lootedGold = (this.state.stats.lootedGold ?? 0) + gold;
    if (units + gold > 0) addMemory(this.state, c, `Öfkeli kalabalıkla ${building.name} yağmasına katıldı`, 'torch', { kind: 'life', fond: false });
    if (c.visible) c.showBubble('loot', 2.4);
    this.events.emit('riot:looted', { character: c, building, goods, gold });
    if (raid.members.every((id) => raid.done.includes(id) || !this.world.getCharacter(id))) this.endRaid(raid);
    return { goods, gold };
  }

  endRaid(raid) {
    const r = this.trust.revolt;
    if (!r) return;
    const i = r.raids.indexOf(raid);
    if (i < 0) return;
    r.raids.splice(i, 1);
    const names = raid.done.map((id) => this.world.getCharacter(id)?.name).filter(Boolean);
    if (Object.keys(raid.goods).length || raid.gold) {
      this.trust.lastLoot = { day: this.state.time.day, hour: this.state.time.hour, target: raid.target, names, goods: { ...raid.goods }, gold: raid.gold };
    }
    this.events.emit('revolt:raidEnded', { raid, names });
  }

  /** İsyan biter: isyancılar işlerine döner. */
  endRevolt() {
    const r = this.trust.revolt;
    if (!r) return;
    this.trust.revolt = null;
    this.trust.lowSince = null;
    for (const id of r.rioters) {
      const c = this.world.getCharacter(id);
      if (!c) continue;
      addMemory(this.state, c, 'Kasabadaki isyana katıldı; yatışınca işinin başına döndü', 'torch', { kind: 'life', fond: false });
      if (c.visible) c.showBubble('sparkle', 2);
    }
    const hours = Math.round((this.state.totalMinutes - r.since) / 60);
    this.events.emit('revolt:ended', { rioters: r.rioters, looted: r.looted, hours });
    this.events.emit('toast', { text: 'İsyan yatıştı: sakinler işlerinin başına dönüyor.', tone: 'success', icon: 'trust' });
  }

  // ---------------------------------------------------------------------------
  // Yatıştırma
  // ---------------------------------------------------------------------------

  /** Acil erzak ya da altın dağıtımı. Dönüş: { ok, reason }. */
  relief(kind) {
    const s = this.state;
    const def = RELIEF[kind];
    const st = reliefStatus(s, kind);
    if (!st.ok) {
      this.events.emit('toast', { text: `${def?.name ?? 'Dağıtım'}: ${st.reason}`, tone: 'warn', icon: def?.icon ?? 'coin' });
      return st;
    }
    if (kind === 'food') {
      if (!this.economy.consumeFood(st.cost).ok) return { ok: false, reason: 'Kilerde yiyecek yok' };
      for (const c of s.characters) {
        if (c.role) continue;
        c.needs.hunger = clamp(c.needs.hunger + def.hunger, 0, 100);
        c.needs.fun = clamp(c.needs.fun + def.fun, 0, 100);
      }
    } else {
      if (!this.economy.spend({ gold: st.cost })) return { ok: false, reason: 'Hazinede altın yok' };
      const adults = this.adults();
      const share = Math.floor(st.cost / Math.max(1, adults.length));
      for (const c of adults) {
        addCoins(c, share);
        c.needs.fun = clamp(c.needs.fun + def.fun, 0, 100);
      }
    }
    for (const c of s.characters) if (c.visible && !c.role && !c.bubble) c.showBubble(kind === 'food' ? 'apple' : 'purse', 2);
    this.trust.relief[kind] = s.totalMinutes;
    s.stats.reliefs = (s.stats.reliefs ?? 0) + 1;
    this.adjust(def.trust, `relief:${kind}`);
    this.events.emit('relief:given', { kind, cost: st.cost, trust: trustValue(s) });
    this.events.emit('toast', { text: `${def.name}: ${kind === 'food' ? `${st.cost} yiyecek değeri` : `${st.cost} altın`} halka dağıtıldı (güven %${Math.round(trustValue(s))})`, tone: 'success', icon: def.icon });
    // İsyan sürüyorsa eşiği aşan güven hemen yatıştırır
    if (this.trust.revolt && trustValue(s) >= REVOLT.endTrust && trustWelfare(s) >= REVOLT.critical) this.endRevolt();
    return { ok: true };
  }
}
