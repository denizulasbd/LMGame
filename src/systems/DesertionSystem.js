// (22. aşama) Son aşama çöküş: köyü terk etme. Sayılar src/data/crown.js -> EXODUS'ta.
//
//   Umutsuzluk : Yönetim Güveni ya da refah EXODUS.despairBelow'un (%20) altında EXODUS.graceHours (24) saat kalır ve isyan
//                yağmaya varmışsa (ya da bir gündür sürüyorsa) terk ediş başlar ('exodus:started'; state.exodus.active). Kriz
//                çözülünce biter ('exodus:ended').
//   Terk ediş  : 6 saatte bir en mutsuz yetişkin (evliyse eşi ve çocuklarıyla birlikte) "Köyü Terk Etme" kararı alır; kişisel
//                kesesini ve çantasını yanına alıp başında bohça balonuyla harita kenarına yürür (Brain -> 'emigrate') ve
//                kasabadan temelli ayrılır ('population:left'; günlüğe acı bir not). Kasabada her koşulda en az EXODUS.core (3)
//                sakin kalır.
//   Şöhret     : terk ediş sürerken ve güven çok düşükken göçmen gelmez (TownStatus.immigrationStatus -> Crown.js).
// Ayrılan sakinin bütün referansları (ev, iş yeri, eş / ebeveyn bağları, ilişkiler, dedikodu, kutlama, dilekçe, isyan, iş
// emri, rezervasyon) temizlenir. Durum: state.exodus ve sakinin `emigrating` alanı (kayda girer).
import { EXODUS } from '../data/crown.js';
import { emptyExodus } from './Crown.js';
import { trustValue } from './Citizens.js';
import { trustWelfare } from './TrustSystem.js';
import { happinessOf } from './TownStatus.js';
import { engineOn } from './Engines.js';
import { unrestKey, loyaltyTier } from './Loyalty.js';

export class DesertionSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ jobs: import('./JobSystem.js').JobSystem }} services
   * @param {import('../utils/random.js').Random} rng
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, { jobs }, rng, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.jobs = jobs;
    this.rng = rng;
    this.attract = attract;
    this.state.exodus ??= emptyExodus();
    this.unsubscribers = [
      game.events.on('time:hour', () => this.hourly()),
      game.events.on('citizen:emigrated', ({ character }) => this.depart(character)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get exodus() {
    return this.state.exodus;
  }

  /** Kasabada kalması gereken sakinler dışında kaç kişi ayrılabilir? */
  residents() {
    return this.state.characters.filter((c) => !c.role);
  }

  hourly() {
    const s = this.state;
    const e = this.exodus;
    const now = s.totalMinutes;
    // Yola çıkıp kenara varamayan ayrılmış sayılır
    for (const c of [...s.characters]) if (c.emigrating && now - c.emigrating.since > EXODUS.leaveTimeoutMinutes) this.depart(c);
    if (this.attract) return;
    const despair = trustValue(s) < EXODUS.despairBelow || trustWelfare(s) < EXODUS.despairBelow;
    if (!despair) {
      e.lowSince = null;
      if (e.active) this.end();
      return;
    }
    e.lowSince ??= now;
    const revolt = s.trust?.revolt;
    const pastLoot = Boolean(revolt) && (Object.keys(revolt.looted ?? {}).length > 0 || now - revolt.since >= EXODUS.revoltHours * 60);
    if (!e.active && now - e.lowSince >= EXODUS.graceHours * 60 && pastLoot) {
      e.active = true;
      e.startedAt = now;
      this.events.emit('exodus:started', {});
      this.events.emit('toast', { text: 'Umut tükeniyor: sakinler köyü terk etmeyi konuşuyor! Göçmenler de kötü şöhret yüzünden gelmiyor.', tone: 'warn', icon: 'bundle' });
    }
    if (e.active && (e.lastAt === null || e.lastAt === undefined || now - e.lastAt >= EXODUS.everyMinutes)) {
      if (this.leaveNext()) e.lastAt = now;
    }
  }

  end() {
    const e = this.exodus;
    e.active = false;
    this.events.emit('exodus:ended', { left: e.left });
    this.events.emit('toast', { text: 'Kasabaya umut döndü: terk edişler durdu, göçmenler yeniden gelebilir.', tone: 'success', icon: 'heart' });
  }

  /** Ayrılacak grup: sakin, kasabadaki eşi ve çocukları. */
  familyOf(c) {
    const group = [c];
    const partner = c.married ? this.world.getCharacter(c.partnerId) : null;
    if (partner && !partner.away && !partner.emigrating) group.push(partner);
    for (const o of this.state.characters) {
      if (o.isChild && !o.away && !o.emigrating && o.parentIds.some((id) => group.includes(this.world.getCharacter(id)))) group.push(o);
    }
    return group;
  }

  /** En mutsuz yetişkini (ve ailesini) yola çıkarır; çekirdek sakinler kalır. Dönüş: yola çıkanlar ya da null. */
  leaveNext() {
    const staying = this.residents().filter((c) => !c.emigrating);
    let candidates = staying.filter((c) => !c.isChild && !c.away && !c.newcomer);
    if (engineOn('loyalty')) {
      // (29.6) sadakati düşük olan önce gider; Sadık sakin ancak başka aday kalmazsa (sıranın sonunda)
      const loyal = (c) => (loyaltyTier(c) === 'loyal' ? 1 : 0);
      candidates = candidates.map((c) => ({ c, k: unrestKey(happinessOf(c), c) })).sort((a, b) => loyal(a.c) - loyal(b.c) || a.k - b.k || a.c.id - b.c.id).map((x) => x.c);
    } else candidates.sort((a, b) => happinessOf(a) - happinessOf(b) || a.id - b.id);
    for (const c of candidates) {
      let group = this.familyOf(c);
      if (staying.length - group.length < EXODUS.core) group = c.married ? [] : [c];
      if (group.length === 0 || staying.length - group.length < EXODUS.core) continue;
      this.startLeaving(group);
      return group;
    }
    return null;
  }

  /** Yola çıkış: sakinler harita kenarındaki bir çıkışa yürür (Brain -> planEmigrate). */
  startLeaving(group) {
    const now = this.state.totalMinutes;
    const exit = this.world.findEntryTile(this.rng);
    for (const c of group) {
      c.emigrating = { since: now, exit: exit ? { x: exit.x, y: exit.y } : null };
      if (c.visible) c.showBubble('bundle', 3);
    }
    const lead = group[0];
    this.events.emit('exodus:leaving', { ids: group.map((c) => c.id), names: group.map((c) => c.name), lead });
    this.events.emit('toast', { text: `${group.map((c) => c.name).join(', ')} bohçasını topladı: köyü terk ediyor${group.length > 1 ? 'lar' : ''}.`, tone: 'warn', icon: 'bundle' });
    if (!exit) for (const c of group) this.depart(c);
  }

  /** Sakin kasabadan temelli ayrılır: kesesi ve çantası onunla gider, bütün referansları temizlenir. */
  depart(c) {
    const s = this.state;
    if (!c || !s.characters.includes(c)) return false;
    const e = this.exodus;
    const coins = c.coins ?? 0;
    const items = (c.inventory ?? []).reduce((n, x) => n + x.qty, 0);
    removeResident(s, this.world, this.jobs, c);
    e.left += 1;
    e.coins += coins;
    e.items += items;
    s.stats.emigrants = (s.stats.emigrants ?? 0) + 1;
    e.log.push({ id: c.id, name: c.name, day: s.time.day, hour: s.time.hour, coins, items });
    if (e.log.length > EXODUS.logSize) e.log.splice(0, e.log.length - EXODUS.logSize);
    this.events.emit('population:changed', s.characters.length);
    this.events.emit('population:left', { character: c, coins, items });
    return true;
  }
}

/**
 * Sakini oyundan çıkarır ve ona işaret eden her şeyi temizler. Ayrılanla birlikte gitmeyen eşin evliliği çözülür, çocukların
 * ebeveyn bağı silinir.
 */
export function removeResident(state, world, jobs, c) {
  const id = c.id;
  world.releaseAll(id);
  jobs?.releaseCharacter(id);
  for (const b of state.buildings) {
    b.occupants.delete(id);
    b.workerIds.delete(id);
    b.excludedWorkers?.delete(id);
    if (b.recentWorkers) b.recentWorkers = b.recentWorkers.filter((x) => x !== id);
  }
  const index = state.characters.indexOf(c);
  if (index >= 0) state.characters.splice(index, 1);
  for (const o of state.characters) {
    if (o.partnerId === id) {
      o.partnerId = null;
      o.married = false;
      o.partnerSince = null;
      o.marriedAt = null;
      o.relocating = false;
    }
    if (o.parentIds.includes(id)) o.parentIds = o.parentIds.filter((x) => x !== id);
  }
  for (const key of Object.keys(state.relationships)) {
    const [a, b] = key.split('-').map(Number);
    if (a === id || b === id) delete state.relationships[key];
  }
  const social = state.social;
  if (social?.party) {
    if (social.party.coupleIds.includes(id)) social.party.until = state.totalMinutes; // kutlama biter
    social.party.guestIds = social.party.guestIds.filter((x) => x !== id);
    social.party.attended = (social.party.attended ?? []).filter((x) => x !== id);
  }
  for (const n of social?.gossip ?? []) {
    n.heardBy = n.heardBy.filter((x) => x !== id);
    if (n.selfStories) delete n.selfStories[id];
  }
  if (state.goldenAge?.celebration) state.goldenAge.celebration.attended = state.goldenAge.celebration.attended.filter((x) => x !== id);
  if (state.seasonFestival) state.seasonFestival.attendees = state.seasonFestival.attendees.filter((x) => x !== id);
  if (state.petitions) state.petitions.list = state.petitions.list.filter((p) => p.characterId !== id);
  const revolt = state.trust?.revolt;
  if (revolt) {
    revolt.rioters = revolt.rioters.filter((x) => x !== id);
    if (revolt.leaderId === id) revolt.leaderId = null; // (29.6)
    for (const r of revolt.raids) {
      r.members = r.members.filter((x) => x !== id);
      r.done = r.done.filter((x) => x !== id);
    }
  }
  const rite = state.rites?.active; // (29.7) anma töreni katılımcıları
  if (rite) {
    rite.attendees = rite.attendees.filter((x) => x !== id);
    rite.ids = rite.ids.filter((x) => x !== id);
  }
  if (state.dilemma?.expedition) state.dilemma.expedition.members = state.dilemma.expedition.members.filter((x) => x !== id);
  for (const a of state.animals) if (a.followId === id) a.followId = null;
}

