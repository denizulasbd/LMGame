// Kasaba Zaferi ve Altın Çağ (20. aşama). Sayılar src/data/goldenAge.js'te, saf yardımcılar ./GoldenAge.js'te.
//
//   Ulu Saat Kulesi : kademeli inşa (Temel, Gövde, Mekanizma & Çan) ConstructionSystem'dedir; burada her aşamanın
//                     tamamlandığı gün Tarihçe'ye yazılır.
//   Çağ Kutlaması   : kule tamamlanınca ('wonder:completed') kasaba kalıcı olarak Altın Çağ'a girer (oyun sürer):
//                     meydanda AGE_CELEBRATION.minutes dakikalık büyük kutlama başlar, uyanık herkes katılır
//                     ('goldenAge:celebrationStarted'), çan ilk kez çalar, konfeti yağar. Bitince katılanlara anı yazılır.
//   Kule saati      : Altın Çağ'da her gün 08:00 ve 18:00'de çalar ('goldenAge:chime' { hour, heard }): sesi duyan uyanık
//                     sakinlerin yorgunluğu azalır (enerji +12, keyif +4). Kalıcı çalışma şevki (+%10) ve refah çarpanı
//                     (+%10) TownStatus'tadır.
//   Tarihçe Kütüğü  : kurucu sakinler, ilk evlenen çift, ilk usta işi eseri yapan zanaatkâr, kulenin baş ustası (en çok
//                     emek veren inşaatçı; BehaviorSystem emeği yazar) ve kulenin aşamaları. Eski kayıtlarda yüklenince
//                     mevcut sakinlerden, evliliklerden ve eserlerden çıkarılır.
// Durum: state.goldenAge, state.chronicle (kayda girer).
import { AGE_CELEBRATION, GOLDEN_AGE, CHRONICLE } from '../data/goldenAge.js';
import { isGoldenAge, towerOf, towerMasterOf, emptyGoldenAge, emptyChronicle } from './GoldenAge.js';
import { MASTERPIECES } from '../data/masterpieces.js';
import { addMemory } from './MemorySystem.js';
import { clamp } from '../utils/math.js';

const stamp = (state) => ({ day: state.time.day, hour: state.time.hour, minute: state.time.minute });

export class GoldenAgeSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ attract?: boolean }} options
   */
  constructor(game, world, { attract = false } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.attract = attract;
    this.state.goldenAge ??= emptyGoldenAge();
    this.state.chronicle ??= emptyChronicle();
    this.restoreChronicle();
    // Eski kayıt: kule zaten tamamlanmışsa Altın Çağ sessizce (kutlamasız) başlar
    const tower = towerOf(this.state);
    if (tower?.wonderComplete && !isGoldenAge(this.state)) {
      this.state.goldenAge.since = stamp(this.state);
      this.state.chronicle.goldenAge ??= { ...stamp(this.state), assessed: true };
    }

    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('relationship:married', ({ a, b }) => {
        if (!this.state.chronicle.firstCouple) this.state.chronicle.firstCouple = { a: a.name, b: b.name, ids: [a.id, b.id], ...stamp(this.state) };
      }),
      on('masterwork:created', ({ piece, character }) => {
        if (!this.state.chronicle.firstMasterwork) this.state.chronicle.firstMasterwork = { maker: character.name, makerId: character.id, piece: piece.name, ...stamp(this.state) };
      }),
      on('wonder:stageCompleted', ({ index, stage }) => {
        this.state.chronicle.towerStages[index] = { name: stage.name, ...stamp(this.state) };
      }),
      on('wonder:completed', ({ building }) => this.begin(building)),
      on('time:hour', (hour) => {
        if (isGoldenAge(this.state) && GOLDEN_AGE.chimeHours.includes(hour)) this.chime(hour);
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Eski kayıtlardan / yeni kasabadan Tarihçe'nin eksik satırlarını çıkarır. */
  restoreChronicle() {
    const ch = this.state.chronicle;
    const people = this.state.characters;
    if (ch.founders.length === 0 && people.length > 0) {
      // Kurucular: ilk sakinlerin anısı ("Kasabanın ilk sakinlerinden biri oldu"), yoksa en eski kimlikli yetişkinler
      const byMemory = people.filter((c) => c.memories?.[0]?.text === 'Kasabanın ilk sakinlerinden biri oldu');
      const pool = byMemory.length ? byMemory : [...people].filter((c) => c.parentIds.length === 0).sort((x, y) => x.id - y.id).slice(0, CHRONICLE.founders);
      ch.founders = pool.map((c) => ({ id: c.id, name: c.name }));
    }
    if (!ch.firstCouple) {
      const married = people.filter((c) => c.married && c.partnerId !== null && c.marriedAt !== null).sort((x, y) => x.marriedAt - y.marriedAt || x.id - y.id);
      const a = married[0];
      const b = a && people.find((c) => c.id === a.partnerId);
      if (a && b) {
        const day = Math.floor(a.marriedAt / 1440) + 1;
        ch.firstCouple = { a: a.name, b: b.name, ids: [a.id, b.id], day, hour: Math.floor((a.marriedAt % 1440) / 60), minute: 0 };
      }
    }
    if (!ch.firstMasterwork) {
      const first = [...(this.state.masterworks?.items ?? [])].sort((x, y) => x.id - y.id)[0];
      if (first) ch.firstMasterwork = { maker: first.maker, makerId: first.makerId, piece: MASTERPIECES[first.type]?.name ?? first.type, day: first.day, hour: first.hour, minute: 0 };
    }
    const tower = towerOf(this.state);
    if (tower && !tower.underConstruction) {
      const stages = tower.definition.wonder.stages;
      for (let i = 1; i <= Math.min(tower.wonderStage, stages.length); i++) ch.towerStages[i] ??= { name: stages[i - 1].name, unknown: true };
    }
  }

  /** Kule tamamlandı: Altın Çağ başlar, meydanda Çağ Kutlaması, çan ilk kez çalar. */
  begin(building) {
    const ga = this.state.goldenAge;
    const ch = this.state.chronicle;
    const now = this.state.totalMinutes;
    if (!ga.since) ga.since = stamp(this.state);
    ch.goldenAge = { ...stamp(this.state) };
    const master = towerMasterOf(this.state);
    if (master) ch.towerMaster = master;
    const venue = this.world.getCompleted('fountain')[0] ?? building;
    const point = venue.center;
    ga.celebration = { venueId: venue.id, x: point.x, y: point.y, startedAt: now, until: now + AGE_CELEBRATION.minutes, attended: [] };
    this.state.stats.ageCelebrations = (this.state.stats.ageCelebrations ?? 0) + 1;
    if (master) {
      const c = this.world.getCharacter(master.id);
      if (c) addMemory(this.state, c, `Ulu Saat Kulesi'nin baş ustası olarak adı Tarihçe Kütüğü'ne altın harflerle yazıldı`, 'wonder', { kind: 'skill' });
    }
    this.events.emit('goldenAge:began', { building, master, celebration: ga.celebration });
    this.events.emit('goldenAge:celebrationStarted', { celebration: ga.celebration });
    this.chime(this.state.time.hour, true);
  }

  /** Kule saati çalar: uyanık sakinlerin yorgunluğu azalır. first: Çağ Kutlaması'ndaki ilk çan. */
  chime(hour, first = false) {
    const ga = this.state.goldenAge;
    let heard = 0;
    for (const c of this.world.characters) {
      if (c.away || c.isSleeping || c.role) continue;
      heard += 1;
      c.needs.energy = clamp(c.needs.energy + GOLDEN_AGE.chimeEnergy, 0, 100);
      c.needs.fun = clamp(c.needs.fun + GOLDEN_AGE.chimeFun, 0, 100);
      if (c.visible && !c.bubble) c.showBubble('bell', 2.4);
    }
    ga.chimes = (ga.chimes ?? 0) + 1;
    ga.lastChime = { at: this.state.totalMinutes, hour, heard };
    const tower = towerOf(this.state);
    this.events.emit('goldenAge:chime', { hour, heard, first, tower });
  }

  /** Şu an Çağ Kutlaması sürüyor mu? */
  celebrating() {
    const cel = this.state.goldenAge.celebration;
    return Boolean(cel && this.state.totalMinutes < cel.until);
  }

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const cel = this.state.goldenAge.celebration;
    if (!cel) return;
    if (this.state.totalMinutes >= cel.until) {
      this.endCelebration();
      return;
    }
    for (const c of this.world.characters) {
      if (c.task?.activity !== 'ageCelebration' || c.task.phase !== 'perform') continue;
      c.needs.fun = clamp(c.needs.fun + AGE_CELEBRATION.funPerMinute * tick.gameMinutes, 0, 100);
      if (!cel.attended.includes(c.id)) cel.attended.push(c.id);
    }
  }

  endCelebration() {
    const cel = this.state.goldenAge.celebration;
    this.state.goldenAge.celebration = null;
    if (!cel) return;
    for (const id of cel.attended ?? []) {
      const c = this.world.getCharacter(id);
      if (c) addMemory(this.state, c, "Ulu Saat Kulesi'nin ilk çanını meydanda Çağ Kutlaması'nda dinledi", 'wonder', { kind: 'festival' });
    }
    this.events.emit('goldenAge:celebrationEnded', { attended: cel.attended?.length ?? 0 });
  }
}
