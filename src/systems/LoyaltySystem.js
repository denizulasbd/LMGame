// (29.6 "Vefa ve Husumet") Sadakat ve vefa / husumet olayları. Sayılar src/data/loyalty.js'te, saf hesaplar ./Loyalty.js'te.
//
//   Sadakat   : dilekçe sonucu, erzak / altın dağıtımı, vergi tahsilatı ve Ağır Vergi'ye geçiş, Acil Seferberlik yorgunluğu, ziyafet
//               ikramı, "Sesimiz Duyulmadı", evin yanması, isyanın yardımla yatışması (elebaşı / isyancı) sakinin c.loyalty'sini
//               değiştirir; gün dönümünde 0'a doğru söner. Eşik (Sadık / Kırgın) geçilince 'loyalty:changed' { character, from, to, reason }.
//   Husumet   : isyanda yağmalanan yapının sakinleri ve çalışanları yağmacıya kırgın olur (ChemistrySystem.tag; anı "{who} isyanda ...").
//   Hatırlama : 'memory:recalled' ile hatırlanan anının kişisi hayattaysa c.recall'a { whoId, whoUntil } yazılır (kaydedilmez);
//               Wants.recomputeDrive onu seekIds'e ekler (yalnızca güzel anılar hatırlanır), süre dolunca silinir. Hatırlamanın zarı MemorySystem'de.
//   (30.3)    : ENGINES.discontent açıkken gün dönümünde vergi kademesi (taxDaily), açlık (hungryDaily: gün dönümünde ya da o gün
//               "Açlıktan Gözü Dönmüş" olan; günde bir kez) ve o gün üşüme (coldDaily)
//               sadakati değiştirir; reddedilen / karşılanan dilekçenin sahibinin dostları (ilişki >= DISCONTENT.friendAt) da etkilenir.
//               'loyalty:changed' beş kademe için yayınlanır ve kademe değişince c.mood yeniden hesaplanır (iş / atışma çarpanı).
//               Her gerçek değişim 'loyalty:delta' { character, delta, reason } olarak yayınlanır (Halkın Nabzı ve anında geri bildirim).
// Kancaların hepsi ENGINES.loyalty ile sarılıdır. HİÇ ZAR ÇEKMEZ; üreteci yoktur.
import { LOYALTY, LOYALTY_SOURCES as SRC, DEBT_MEMORIES, DEBT_RULES, DISCONTENT } from '../data/loyalty.js';
import { engineOn } from './Engines.js';
import { loyaltyScope, clampLoyalty, loyaltyOf, eventTier, loyaltyLevel, driftLoyalty, isHangry } from './Loyalty.js';
import { addMemory } from './MemorySystem.js';
import { recomputeDrive } from './Wants.js';
import { recomputeMood } from './Moodlets.js';
import { getFriendship } from './RelationshipSystem.js';

const on = () => engineOn('loyalty');

export class LoyaltySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ chemistry: import('./ChemistrySystem.js').ChemistrySystem }} services
   */
  constructor(game, world, { chemistry } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.chemistry = chemistry;
    this.coldToday = new Set(); // (30.3) o gün üşüyenler (kayda girmez)
    this.hungryToday = new Set(); // (30.3) o gün "Açlıktan Gözü Dönmüş" olanlar (kayda girmez)
    const sub = (name, fn) => game.events.on(name, (p = {}) => on() && fn(p));
    this.unsubscribers = [
      sub('time:newDay', () => {
        this.daily();
        this.drift();
      }),
      // (30.3) o gün üşüyerek uyanan / donan sakinler (gün dönümünde bir kez coldDaily); kayda girmez
      sub('moodlet:added', ({ character, moodlet }) => {
        if (!character || !engineOn('discontent')) return;
        if (moodlet?.key === 'cold_wake' || moodlet?.key === 'chilled') this.coldToday.add(character.id);
        if (moodlet?.key === 'hangry') this.hungryToday.add(character.id);
      }),
      sub('time:hour', () => this.expireRecalls()),
      sub('petition:resolved', ({ outcome, character }) => this.onPetition(character, outcome)),
      sub('relief:given', ({ recipientIds, hungryIds, kind }) => this.onRelief(recipientIds ?? [], hungryIds ?? [], kind)),
      sub('tax:collected', ({ rate }) => this.everyone(SRC.taxCollected[rate] ?? 0, `tax:${rate}`)),
      sub('tax:rateChanged', ({ rate, from }) => rate === 'heavy' && from !== 'heavy' && this.everyone(SRC.taxRaisedToHeavy, 'tax:heavy')),
      sub('crisis:musterFatigue', ({ helpers }) => this.ids(helpers, SRC.musterFatigue, 'muster')),
      sub('feast:served', ({ character }) => this.adjust(character, SRC.feastServed, 'feast')),
      sub('moodlet:added', ({ character, moodlet }) => moodlet?.key === 'neglected' && this.adjust(character, SRC.neglected, 'neglected')),
      sub('crisis:burnedDown', ({ building }) => building && this.homeBurned(building)),
      sub('revolt:ended', ({ appeased, rioters, leaderId }) => appeased && this.appease(rioters ?? [], leaderId)),
      sub('riot:looted', ({ character, building }) => this.onLooted(character, building)),
      sub('memory:recalled', ({ character, memory }) => this.onRecalled(character, memory)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Sadakati değiştirir (kapsam dışında yok sayılır). Eşik geçilince olay. Gerçek değişim. */
  adjust(c, delta, reason = '') {
    if (!on() || !loyaltyScope(c) || !this.state.characters.includes(c) || !delta) return 0;
    const from = loyaltyOf(c);
    const to = clampLoyalty(from + delta);
    c.loyalty = to;
    this.changed(c, from, to, reason);
    if (to !== from && engineOn('discontent')) this.events.emit('loyalty:delta', { character: c, delta: to - from, reason });
    return to - from;
  }

  /** Kademe değiştiyse olay; (30.3) beş kademeden biri değiştiyse ruh hali çarpanları yenilenir. */
  changed(c, from, to, reason) {
    if (eventTier(from) !== eventTier(to)) this.events.emit('loyalty:changed', { character: c, from, to, reason });
    if (engineOn('discontent') && loyaltyLevel(from) !== loyaltyLevel(to) && c.mood) recomputeMood(c);
  }

  /** (30.3) Gün dönümü kaynakları: o günkü vergi kademesi, açlık, üşüme. */
  daily() {
    if (!engineOn('discontent')) {
      this.coldToday.clear();
      this.hungryToday.clear();
      return;
    }
    const rate = this.state.tax?.rate ?? 'standard';
    const tax = SRC.taxDaily[rate] ?? 0;
    for (const c of [...this.state.characters]) {
      if (!loyaltyScope(c)) continue;
      if (tax) this.adjust(c, tax, `taxDaily:${rate}`);
      if (isHangry(c) || this.hungryToday.has(c.id)) this.adjust(c, SRC.hungryDaily, 'hunger');
      if (this.coldToday.has(c.id)) this.adjust(c, SRC.coldDaily, 'cold');
    }
    this.coldToday.clear();
    this.hungryToday.clear();
  }

  /** (30.3) Dilekçe sahibinin dostları (ilişki puanı >= friendAt): reddedilince friendRejected, karşılanınca friendFulfilled. */
  friendsOf(owner) {
    return this.state.characters.filter((x) => x !== owner && loyaltyScope(x) && getFriendship(this.state, owner, x) >= DISCONTENT.friendAt);
  }

  everyone(delta, reason) {
    if (!delta) return;
    for (const c of [...this.state.characters]) if (loyaltyScope(c)) this.adjust(c, delta, reason);
  }

  ids(list, delta, reason) {
    for (const id of list ?? []) this.adjust(this.world.getCharacter(id), delta, reason);
  }

  /** Gün dönümü: herkes 0'a doğru biraz söner. */
  drift() {
    for (const c of this.state.characters) {
      if (!loyaltyScope(c)) continue;
      const from = loyaltyOf(c);
      const to = driftLoyalty(from);
      if (to === from) continue;
      c.loyalty = to;
      this.changed(c, from, to, 'drift');
    }
  }

  onPetition(c, outcome) {
    if (!c) return;
    // (30.3) dostlar sahibin değişiminden ÖNCE seçilir (ilişki puanı değişmez; sıra kimlik sırası)
    const friends = engineOn('discontent') && (outcome === 'fulfilled' || outcome === 'rejected') ? this.friendsOf(c) : [];
    if (outcome === 'fulfilled') this.adjust(c, SRC.petitionFulfilled * (loyaltyLevel(c) === 'bitter' ? SRC.bitterFulfilledBonus : 1), 'petition:fulfilled');
    else if (outcome === 'rejected') this.adjust(c, SRC.petitionRejected, 'petition:rejected');
    else if (outcome === 'expired') this.adjust(c, SRC.petitionExpired, 'petition:expired');
    for (const f of friends) this.adjust(f, outcome === 'rejected' ? SRC.friendRejected : SRC.friendFulfilled, outcome === 'rejected' ? 'friend:rejected' : 'friend:fulfilled');
  }

  /** Erzak / altın dağıtımı: alanlara relief, o an aç olanlara reliefHungry. */
  onRelief(recipientIds, hungryIds, kind = 'food') {
    const reason = engineOn('discontent') ? `relief:${kind === 'gold' ? 'gold' : 'food'}` : 'relief';
    for (const id of recipientIds) this.adjust(this.world.getCharacter(id), hungryIds.includes(id) ? SRC.reliefHungry : SRC.relief, reason);
  }

  homeBurned(building) {
    for (const c of [...this.state.characters]) if (c.homeId === building.id) this.adjust(c, SRC.homeBurned, 'homeBurned');
  }

  /** İsyan yardımla (erzak / altın dağıtımıyla) yatıştı: elebaşı ve isyancılar Yönetime ısınır. */
  appease(rioters, leaderId) {
    for (const id of rioters) this.adjust(this.world.getCharacter(id), id === leaderId ? LOYALTY.appease.leader : LOYALTY.appease.rioter, 'appeased');
  }

  /** Yağma: yapıda oturanlar ve çalışanlar yağmacıya kırgın olur (anı: "{who} isyanda evini yağmaladı"). */
  onLooted(looter, building) {
    if (!looter || !building) return;
    for (const c of this.state.characters) {
      if (c === looter || c.role) continue;
      const home = c.homeId === building.id;
      if (!home && c.workplaceId !== building.id && !building.workerIds?.has(c.id)) continue;
      if (this.chemistry) this.chemistry.tag(c, looter.id, 'resentful');
      addMemory(this.state, c, (home ? DEBT_MEMORIES.looted : DEBT_MEMORIES.lootedWork).replace('{who}', looter.name), 'torch', { kind: 'life', fond: false, whoId: looter.id });
    }
  }

  /** Hatırlanan (güzel) anının kişisi hayattaysa bir süre aranır. */
  onRecalled(c, memory) {
    if (!c?.recall || !Number.isFinite(memory?.whoId)) return;
    const who = this.world.getCharacter(memory.whoId);
    if (!who || who === c) return;
    c.recall.whoId = who.id;
    c.recall.whoUntil = this.state.totalMinutes + DEBT_RULES.recallMinutes;
    recomputeDrive(c);
  }

  expireRecalls() {
    const now = this.state.totalMinutes;
    for (const c of this.state.characters) {
      const r = c.recall;
      if (!r || !Number.isFinite(r.whoId)) continue;
      if (r.whoUntil > now && this.world.getCharacter(r.whoId)) continue;
      delete r.whoId;
      delete r.whoUntil;
      recomputeDrive(c);
    }
  }
}

