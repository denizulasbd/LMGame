// (28.3) Sürdürülebilir kuşak döngüsü: Saygın Büyük statüsü, doğal vefat ve trajik kazalar. Saf hesaplar ./Venerable.js'te, sayılar
// data/lifeStages.js'te (LIFESPAN, VENERABLE, FATAL).
//
//   Ömür         : her sakine (doğum / göç / yükleme) kimliğinden ve tohumdan türeyen 66-75 yaşlık bir ömür atanır (lifespanFor: izole üreteç, seed + 35).
//   Saygın Büyük : her gün 19:00'da Kıdemli Bilge, Ocak Devri'ni (devretti / evladı yok / zaman aşımı) ve Yadigâr Devri'ni (teslim etti; devredecek
//                  kimsesi yoksa yadigâr kasaba arşivine kalkar) tamamlamışsa `isVenerable = true` olur: evini / yatağını boşaltır (homeId = null),
//                  nüfus kotasına sayılmaz ('venerable:became'). Geceleri Bilgelik Evi'nde, handa ya da belediyede sabahlar (Brain.planSleep).
//   Vefat        : gün dönümünde (00:00, yaşlanmadan sonra) ömrüne ulaşan Kıdemli Bilge / Saygın Büyük huzur içinde vefat eder ('population:died'):
//                  sakin DesertionSystem.removeResident ile tüm referanslarından temizlenir (eş, iş, ev, çıraklık, ilişki, ocak kütüğü, sefer...),
//                  yadigârı mirasçısına (yoksa arşive) geçer ('population:left' { reason: 'death' }), kesesi eşine ya da evladına kalır.
//   Kaza         : 'life:fatalAccident' { character, cause } (CrisisSystem: yangın / baskın, ExpeditionSystem: sefer) sakini anında öldürür.
// Rastgelelik kullanmaz (ömür kimlikten türer; kazanın zarı onu atan sistemdedir).
import { removeResident } from './DesertionSystem.js';
import { lifespanFor, hearthSettled, heirloomSettled, venerableCandidate } from './Venerable.js';
import { heirloomSlot } from './Citizens.js';
import { pickHeir } from './Heirloom.js';
import { addMemory } from './MemorySystem.js';
import { VENERABLE } from '../data/lifeStages.js';

const CAUSE_TEXT = {
  fire: 'yangın söndürürken kahramanca can verdi',
  raid: 'haydutlara karşı kasabayı savunurken can verdi',
  expedition: 'seferde yolunu kaybedip bir daha dönmedi',
};

export class LifecycleSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ jobs?: import('./JobSystem.js').JobSystem }} services
   */
  constructor(game, world, { jobs = null } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.jobs = jobs;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('population:joined', () => this.ensureLifespans()),
      on('population:changed', () => this.ensureLifespans()),
      on('time:newDay', () => this.dailyDeaths()),
      on('time:hour', (hour) => hour === VENERABLE.checkHour && this.checkVenerables()),
      on('life:fatalAccident', ({ character, cause }) => this.die(character, { cause })),
    ];
    this.ensureLifespans();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get stats() {
    return this.state.lifeStages;
  }

  /** Ömrü olmayan her sakine kimliğinden ve tohumdan türeyen ömrü atar (kayıttan gelen geçerli ömür korunur). */
  ensureLifespans() {
    for (const c of this.state.characters) if (c.lifespan === null || c.lifespan === undefined) c.lifespan = lifespanFor(this.state.seed, c.id);
  }

  // ---------------------------------------------------------------------------
  // Saygın Büyük
  // ---------------------------------------------------------------------------

  /** 19:00: Ocak ve Yadigâr devirlerini bitiren Kıdemli Bilgeler Saygın Büyük olur. Dönüş: olanlar. */
  checkVenerables() {
    const done = [];
    for (const c of [...this.state.characters].sort((a, b) => a.id - b.id)) {
      if (!venerableCandidate(c) || !hearthSettled(this.state, c)) continue;
      if (!heirloomSettled(c)) {
        // Devredecek kimsesi yoksa yadigâr kasaba arşivine kalkar (törenin yapıldığı 18:00'dan sonra)
        const slot = heirloomSlot(c);
        if (!slot || slot.heirloom.since >= this.state.time.day || pickHeir(this.state, c, slot.kind)) continue;
        this.archiveHeirloom(c, slot);
      }
      if (this.makeVenerable(c)) done.push(c);
    }
    return done;
  }

  archiveHeirloom(c, slot) {
    c.inventory.splice(c.inventory.indexOf(slot), 1);
    this.state.heirloom.archive.push({ kind: slot.kind, name: slot.name, story: slot.heirloom.story, day: this.state.time.day });
    this.events.emit('heirloom:archived', { character: c, kind: slot.kind });
  }

  /** Bilgeyi Saygın Büyük yapar: yatağını boşaltır, nüfus kotasından düşer. */
  makeVenerable(c) {
    if (!venerableCandidate(c)) return false;
    const oldHome = c.homeId;
    if (c.insideBuildingId !== null && c.insideBuildingId === oldHome) this.stepOutside(c);
    c.isVenerable = true;
    c.homeId = null;
    c.relocating = false;
    this.stats.venerables += 1;
    addMemory(this.state, c, 'Ocağını ve yadigârını devredip kasabanın Saygın Büyüğü oldu', 'star', { kind: 'elder' });
    this.events.emit('venerable:became', { character: c, homeId: oldHome });
    this.events.emit('toast', { text: `${c.name} Saygın Büyük oldu: yatağını gençlere bıraktı, artık nüfus kotasına sayılmıyor`, tone: 'success', icon: 'star' });
    return true;
  }

  /** Evin içindeki bilgeyi kapıya çıkarır (yatağı artık onun değil). */
  stepOutside(c) {
    const building = this.world.getBuilding(c.insideBuildingId);
    c.insideBuildingId = null;
    c.visible = true;
    c.pose = 'stand';
    if (c.task?.activity === 'sleep' || c.task?.activity === 'meal') c.task = null;
    if (!building) return;
    building.occupants.delete(c.id);
    c.x = building.entrancePoint.x;
    c.y = building.entrancePoint.y;
  }

  // ---------------------------------------------------------------------------
  // Vefat
  // ---------------------------------------------------------------------------

  /** Gün dönümü: ömrüne ulaşan Kıdemli Bilge / Saygın Büyük huzur içinde vefat eder (seferdeki, ayrılmakta olan sonraya kalır). */
  dailyDeaths() {
    this.ensureLifespans();
    const due = this.state.characters
      .filter((c) => !c.role && c.lifeStage === 'elder' && !c.away && !c.emigrating && c.age >= c.lifespan)
      .sort((a, b) => a.id - b.id);
    for (const c of due) this.die(c, { cause: 'age' });
    return due;
  }

  /**
   * Sakini kalıcı olarak kaldırır (doğal vefat ya da kaza). Kesesi eşine / evladına kalır, yadigârı mirasçısına geçer, bütün referansları temizlenir.
   * Dönüş: true.
   */
  die(c, { cause = 'age' } = {}) {
    const s = this.state;
    if (!c || c.role || !s.characters.includes(c)) return false;
    const age = c.age;
    const name = c.name;
    // (29.2) referanslar temizlenmeden önce: geride kalanlar (eş, aile, ruh ikizi, usta / çırak) yasa girer
    this.events.emit('population:dying', { character: c, cause });
    // Kese: eşine, yoksa ilk yaşayan evladına
    const kin = [c.partnerId, ...(c.children ?? [])].map((id) => this.world.getCharacter(id)).filter((x) => x && x !== c && !x.role);
    const coins = c.coins ?? 0;
    if (coins > 0 && kin[0]) kin[0].coins = (kin[0].coins ?? 0) + coins;
    c.coins = 0;
    removeResident(s, this.world, this.jobs, c);
    // Ocak kütüğü, aile bağları ve usta / çırak referansları
    const lineage = s.lineage;
    if (lineage?.heads) for (const [home, head] of Object.entries(lineage.heads)) if (head === c.id) delete lineage.heads[home];
    for (const o of s.characters) {
      if (o.children) o.children = o.children.filter((x) => x !== c.id);
      if (o.parents) o.parents = o.parents.filter((x) => x !== c.id);
      if (o.mentees) o.mentees = o.mentees.filter((m) => m.id !== c.id);
      if (o.apprenticeship?.masterId === c.id) o.apprenticeship.masterId = null;
    }
    const st = this.stats;
    st.deaths += 1;
    if (cause !== 'age') st.accidents += 1;
    st.lastDeath = { name, age, day: s.time.day, cause };
    s.stats.deaths = (s.stats.deaths ?? 0) + 1;
    this.events.emit('population:changed', s.characters.length);
    this.events.emit('population:left', { character: c, coins: 0, items: 0, reason: 'death' });
    const text = cause === 'age' ? `${name} ${age} yaşında huzur içinde hayata gözlerini yumdu.` : `${name} ${age} yaşında ${CAUSE_TEXT[cause] ?? 'can verdi'}.`;
    this.events.emit('population:died', { character: c, age, cause, text });
    this.events.emit('toast', { text, tone: cause === 'age' ? 'info' : 'warn', icon: cause === 'age' ? 'book' : 'heart' });
    return true;
  }
}
