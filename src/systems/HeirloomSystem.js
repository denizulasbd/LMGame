// (25. aşama, 25.5) Aile yadigârları, miras intikali ve Kuşak Şöleni.
//
//   Yadigâr   : kasabanın Altın Çağı başladıktan sonra Kıdemli Bilge olan ya da ocağını devreden sakinin çantasında meslek geçmişine /
//               kişiliğine uygun bir yadigâr belirir (Ata Yadigârı Çekiç, Ata Yadigârı Mekik, Eski Seyyah Pusulası, Kadim Maya Kavanozu,
//               Usta Mala, Bilge Günlüğü). Satılmaz, feda edilmez, yok edilmez; çanta doluysa en sondaki sıradan eşya yer açar.
//   İntikal   : yadigâr belirdikten sonraki ilk 18:00'de yaşlı sakin onu törenle evladına (aynı mesleği yapan / çırağı olan önce) ya da
//               evladı yoksa en çok emek verdiği çırağına devreder; veda sözleri metin baloncuğunda. Mirasçı yoksa her akşam yeniden
//               denenir. Köyden ayrılan taşıyıcının yadigârı mirasçısına, o da yoksa kasaba arşivine geçer: yadigâr kaybolmaz.
//   Gurur     : yadigârı taşıyan yeni nesil "Ata Mirası Gururu" ile keyfini %10 yavaş kaybeder (NeedsSystem).
//   Şölen     : kasabada İLK devirde meydan havuzunda konfeti ve 1 saatlik Kuşak Şöleni (Toplanma Zili), Tarihçe'ye altın harflerle.
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 31): yalnızca sözleri seçer. Altın Çağ öncesinde yalnızca
// çırak geçmişini (mentees) kaydeder.
// Yayınladığı olaylar: 'heirloom:created' { character, kind, slot }, 'heirloom:passed' { from, to, kind, slot, first },
//   'heirloom:archived' { character, kind }.
import { HEIRLOOMS, HEIRLOOM, HANDOVER_LINES } from '../data/heirloom.js';
import { ITEMS } from '../data/citizens.js';
import { heirloomKindFor, heirloomStory, pickHeir, sanitizeMentees, MAX_MENTEES } from './Heirloom.js';
import { heirloomSlot, sanitizeHeirloomMeta, inventoryCapacity } from './Citizens.js';
import { developmentOpen } from './Temperament.js';
import { rallyStatus } from './RallySystem.js';
import { addMemory } from './MemorySystem.js';

export class HeirloomSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci
   * @param {{ economy?: import('./EconomySystem.js').EconomySystem }} services
   */
  constructor(game, world, rng, { economy = null } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.economy = economy;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('lifeStage:changed', ({ character, to }) => to === 'elder' && this.create(character)),
      on('lineage:handover', ({ elder }) => this.create(elder)),
      on('apprentice:graduated', ({ character, masterId, progress }) => this.recordMentee(masterId, character, progress)),
      on('time:hour', (hour) => hour === HEIRLOOM.handoverHour && this.ceremonies()),
      on('population:left', ({ character } = {}) => character && this.onLeft(character)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Ustanın yetiştirdiği çırak (mezuniyette): en yüksek ilerleme saklanır. Veri; her zaman. */
  recordMentee(masterId, c, progress) {
    const master = masterId !== null && masterId !== undefined ? this.world.getCharacter(masterId) : null;
    if (!master || !c) return;
    master.mentees ??= [];
    const m = master.mentees.find((x) => x.id === c.id);
    if (m) m.progress = Math.max(m.progress, progress);
    else master.mentees.push({ id: c.id, progress: Math.max(0, Math.min(100, progress)) });
    // (27.2) Çalışma zamanında da kayıttaki sınır (sanitizeMentees: son 12): kesintisiz oturum ile kayıt / yükleme aynı mirasçıyı seçer
    if (master.mentees.length > MAX_MENTEES) master.mentees = sanitizeMentees(master.mentees);
  }

  /** Yaşlı sakinin çantasında yadigâr belirir (Altın Çağ'da; zaten bir yadigâr taşımıyorsa). */
  create(c) {
    if (!c || c.role || !developmentOpen(this.state) || heirloomSlot(c)) return null;
    const kind = heirloomKindFor(this.state, c);
    const slot = {
      kind,
      qty: 1,
      name: HEIRLOOMS[kind].name,
      heirloom: sanitizeHeirloomMeta({ ownerId: c.id, ownerName: c.name, story: heirloomStory(c, kind), since: this.state.time.day, chain: [c.name] }),
    };
    this.place(c, slot);
    this.state.heirloom.created += 1;
    addMemory(this.state, c, `Çantasında ${HEIRLOOMS[kind].name} ile yılların emeğini taşıyor`, HEIRLOOMS[kind].icon, { kind: 'heirloom' });
    this.events.emit('heirloom:created', { character: c, kind, slot });
    return slot;
  }

  /** Yadigârı çantaya koyar; çanta doluysa en sondaki sıradan eşya yer açar (kaynaksa ambara döner). */
  place(c, slot) {
    c.inventory ??= [];
    while (c.inventory.length >= inventoryCapacity(c)) {
      const i = c.inventory.map((s, k) => [s, k]).reverse().find(([s]) => !ITEMS[s.kind]?.heirloom)?.[1];
      if (i === undefined) break;
      const [out] = c.inventory.splice(i, 1);
      const res = ITEMS[out.kind]?.resource;
      if (res && this.economy) this.economy.add(res, out.qty);
    }
    c.inventory.push(slot);
  }

  /** Akşam töreni: yadigârını en az bir gündür taşıyan Kıdemli Bilgeler mirasçısına devreder. */
  ceremonies() {
    if (!developmentOpen(this.state)) return;
    const today = this.state.time.day;
    for (const c of [...this.state.characters].sort((a, b) => a.id - b.id)) {
      if (c.lifeStage !== 'elder' || c.away) continue;
      const slot = heirloomSlot(c);
      if (!slot || slot.heirloom.ownerId !== c.id || slot.heirloom.since >= today) continue;
      const heir = pickHeir(this.state, c, slot.kind);
      if (heir) this.pass(c, heir, slot);
    }
  }

  /** Törensel devir teslim. */
  pass(from, to, slot) {
    if (heirloomSlot(to)) return false; // her sakin bir yadigâr taşır
    const i = from.inventory.indexOf(slot);
    if (i < 0) return false;
    from.inventory.splice(i, 1);
    slot.heirloom.chain = [...slot.heirloom.chain, to.name].slice(-8);
    slot.heirloom.since = this.state.time.day;
    this.place(to, slot);
    const h = this.state.heirloom;
    h.transfers += 1;
    const first = !this.state.chronicle.firstHeirloom;
    const item = HEIRLOOMS[slot.kind].name;
    if (first) this.state.chronicle.firstHeirloom = { elder: from.name, heir: to.name, item, ids: [from.id, to.id], day: this.state.time.day, hour: this.state.time.hour, minute: this.state.time.minute };
    const fill = (t) => t.replace('{item}', item.toLocaleLowerCase('tr')).replace('{heir}', to.name);
    if (from.visible) from.speech = { text: fill(this.rng.pick(HANDOVER_LINES.elder)), at: -1, duration: HEIRLOOM.speechSeconds };
    if (to.visible) to.speech = { text: fill(this.rng.pick(HANDOVER_LINES.heir)), at: -1, duration: HEIRLOOM.speechSeconds };
    addMemory(this.state, to, `${from.name} ona ${item} yadigârını törenle teslim etti`, HEIRLOOMS[slot.kind].icon, { kind: 'heirloom' });
    addMemory(this.state, from, `${item} yadigârını ${to.name} adlı mirasçısına teslim etti`, HEIRLOOMS[slot.kind].icon, { kind: 'heirloom' });
    if (first) this.feast();
    this.events.emit('heirloom:passed', { from, to, kind: slot.kind, slot, first });
    this.events.emit('toast', { text: `${from.name}, ${item} yadigârını ${to.name} adlı mirasçısına teslim etti!`, tone: 'success', icon: HEIRLOOMS[slot.kind].icon });
    return true;
  }

  /** Kuşak Şöleni: meydan havuzunda konfeti; Toplanma Zili çalınabiliyorsa kasaba 1 saat meydanda toplanır. */
  feast() {
    const venue = this.world.getCompleted('fountain')[0] ?? this.world.getCompleted('campfire')[0] ?? null;
    const now = this.state.totalMinutes;
    if (venue) this.state.heirloom.feast = { x: venue.center.x, y: venue.center.y, startedAt: now, until: now + HEIRLOOM.feastMinutes };
    if (rallyStatus(this.state).ok) this.events.emit('ui:rallyBell');
    this.events.emit('heirloom:feast', { venue });
  }

  /** Köyden ayrılan taşıyıcı: yadigâr mirasçısına, mirasçı yoksa kasaba arşivine geçer. */
  onLeft(c) {
    const slot = heirloomSlot(c);
    if (!slot) return;
    const heir = pickHeir(this.state, c, slot.kind);
    if (heir && !heirloomSlot(heir) && this.state.characters.includes(heir)) {
      this.pass(c, heir, slot);
      return;
    }
    c.inventory.splice(c.inventory.indexOf(slot), 1);
    this.state.heirloom.archive.push({ kind: slot.kind, name: slot.name, story: slot.heirloom.story, day: this.state.time.day });
    this.events.emit('heirloom:archived', { character: c, kind: slot.kind });
  }
}
