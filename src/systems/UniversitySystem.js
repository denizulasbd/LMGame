// (32.4) Darülfünun: kabul, ders, Müderris, mezuniyet. Sayılar data/university.js, saf hesaplar ./University.js.
// Şalter ENGINES.university kapalıyken hiçbir dinleyici kurulmaz, state.university ve karakter alanları yazılmaz. Bu sistemin
// üreteci YOKTUR: kabul, bölüm ve mezuniyet kimlik / özellik / beceriden türer.
//
//   Kabul     ('time:newDay', yaşlanmadan SONRA): ayrılan / sürgündeki öğrencinin kaydı silinir; işleyen bir Darülfünun varsa boş yer
//              kadar uygun genç (Bilgelik Evi mezunu) sıradan alınır: c.higherStudy = { field, minutes, today, day, since }.
//   Ders      (Brain → planLecture, mesai dalında mola zarından SONRA): 14:00-16:00, günde en çok 90 dk; BehaviorSystem her dakika
//              learn() çağırır. Saat 14:00'te derse gitmesi gereken öğrencilerin yarıda kesilebilir işi biter ('university:bell').
//   Müderris  : yapının tek çalışanı (yetişkin; iş seçimi mevcut düzen). work() ders saatinde öğrenci varken true.
//   Mezuniyet ('lifeStage:changed' youth → adult): ilerleme ≥ eşikse c.graduate = { field, day }, bölümde en az Kalfa (Math.max),
//              ebeveynlere Hatırlandı; değilse "yarım bıraktı" (anı ve kart). Kayıt her iki durumda silinir.
// Yayınladığı olaylar: 'university:admitted' { character, field }, 'university:graduated' { character, field, apprentice, grandmaster },
//   'university:dropped' { character, field, ratio }, 'university:bell' { ids }, 'skill:levelUp', 'toast'.
import { UNIVERSITY as U, UNIVERSITY_TEXT as TX } from '../data/university.js';
import { engineOn } from './Engines.js';
import {
  universityOf, isLectureHour, isTeacherHour, lectureLeft, admissionQueue, studentsOf, freeSeats, fieldFor, fieldName, lectureMultiplier,
  emptyUniversity, KALFA_XP, studyRatio,
} from './University.js';
import { levelFor } from './SkillSystem.js';
import { addMemory } from './MemorySystem.js';

const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export class UniversitySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world, { moodlets = null } = {}) {
    this.game = game;
    this.events = game.events;
    this.world = world;
    this.moodlets = moodlets;
    this.unsubscribers = [];
    if (!engineOn('university')) return;
    const on = (name, fn) => this.unsubscribers.push(game.events.on(name, fn));
    on('time:newDay', () => this.newDay());
    on('time:hour', (hour) => hour === U.hours.from && this.bell());
    on('lifeStage:changed', ({ character, from, to }) => from === 'youth' && to === 'adult' && this.finish(character));
    on('population:left', ({ character } = {}) => character?.higherStudy && this.drop(character, 'left'));
    // çıraklık mezuniyeti aynı 'lifeStage:changed' olayında bizden ÖNCE işler (ApprenticeshipSystem daha önce kurulur): öğrenci çıraktı
    on('apprentice:graduated', ({ character } = {}) => character?.higherStudy && (character.higherStudy.ap = 1));
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get state() {
    return this.game.state;
  }

  /** Sayaçlar (ilk olayda kurulur; boşken kayda yazılmaz). */
  get stats() {
    return (this.state.university ??= emptyUniversity());
  }

  // ---------------------------------------------------------------------------------------------------------------------- kabul

  newDay() {
    const s = this.state;
    for (const c of studentsOf(s)) {
      if (c.lifeStage !== 'youth' || c.emigrating || c.sentence?.exile) this.drop(c, 'left');
    }
    const students = studentsOf(s);
    for (const c of students) if (c.apprenticeship) c.higherStudy.ap = 1;
    if (students.length) this.stats.studentDays += students.length;
    if (!universityOf(s)) return;
    let seats = freeSeats(s);
    for (const c of admissionQueue(s)) {
      if (seats <= 0) break;
      this.admit(c);
      seats -= 1;
    }
  }

  admit(c) {
    const s = this.state;
    const { field } = fieldFor(c);
    c.higherStudy = { field, minutes: 0, today: 0, day: s.time.day, since: s.time.day, ...(c.apprenticeship ? { ap: 1 } : {}) };
    const st = this.stats;
    st.admitted += 1;
    st.fields[field] = (st.fields[field] ?? 0) + 1;
    const vars = { name: c.name, field: fieldName(field) };
    addMemory(s, c, fill(TX.memoryAdmitted, vars), 'book', { kind: 'university' });
    this.events.emit('university:admitted', { character: c, field });
    this.events.emit('toast', { text: fill(TX.admitted, vars), tone: 'info', icon: 'book' });
  }

  /** Kayıt silinir (ayrıldı, sürgün, öldü). */
  drop(c, reason) {
    if (!c?.higherStudy) return;
    c.higherStudy = null;
    if (reason === 'left') this.stats.left += 1;
  }

  // ---------------------------------------------------------------------------------------------------------------------- ders

  /** 14:00: derse gidecek öğrencilerin yarıda kesilebilir işi biter (BehaviorSystem.interrupt; uyku, yemek, acil işler kesilmez). */
  bell() {
    if (!universityOf(this.state)) return;
    const day = this.state.time.day;
    const ids = studentsOf(this.state).filter((c) => lectureLeft(c, day) >= U.minSession && !c.away && !c.illness).map((c) => c.id);
    if (ids.length) this.events.emit('university:bell', { ids });
  }

  /** Brain (mesai dalında, mola zarından sonra): öğrencinin ders planı ya da null. Zar çekmez. */
  planLecture(c, hour) {
    const s = this.state;
    if (!c.higherStudy || !isLectureHour(hour) || c.away || c.illness || c.isInjured) return null;
    const left = lectureLeft(c, s.time.day);
    if (left < U.minSession) return null;
    const b = universityOf(s);
    if (!b) return null;
    const doors = this.world.getSpots(b);
    if (!doors.length) return null;
    const origin = { x: c.tileX, y: c.tileY };
    const spot = doors.reduce((best, p) => (Math.hypot(p.x - origin.x, p.y - origin.y) < Math.hypot(best.x - origin.x, best.y - origin.y) ? p : best));
    if (!this.world.findPath(origin, spot)) return null;
    const untilEnd = Math.max(U.minSession, Math.round((U.hours.to - hour) * 60));
    return { activity: 'lecture', buildingId: b.id, spot, finalPoint: b.entrancePoint, duration: Math.min(left, untilEnd) };
  }

  /** BehaviorSystem: içeride ders dinleyen öğrencinin dakikaları. */
  learn(c, building, minutes) {
    const h = c.higherStudy;
    if (!h || !building) return;
    const s = this.state;
    if (h.day !== s.time.day) {
      h.day = s.time.day;
      h.today = 0;
    }
    const raw = Math.min(minutes, Math.max(0, U.minutesPerDay - h.today));
    if (raw <= 0) return;
    if (c.apprenticeship) h.ap = 1;
    h.today = Math.round((h.today + raw) * 100) / 100;
    h.minutes = Math.round((h.minutes + raw * lectureMultiplier(s, building).total) * 100) / 100;
    this.stats.lectureMinutes = Math.round((this.stats.lectureMinutes + raw) * 100) / 100;
  }

  /** Şu an derste olanlar. */
  inLecture(building) {
    return this.world.characters.filter((c) => c.task?.activity === 'lecture' && c.task.buildingId === building.id && c.task.phase === 'perform');
  }

  /** Müderris'in çalışması (BehaviorSystem.performWork): ders saatinde öğrenci varken true. */
  work(building) {
    const hour = this.state.time.hour + this.state.time.minute / 60;
    return isTeacherHour(hour) && studentsOf(this.state).length > 0 && !building.damaged;
  }

  /** Her kare: yapının boşta durumu (JobSystem boşta yapıya iş vermez) ve panel durumu. */
  update() {
    if (!engineOn('university')) return;
    const s = this.state;
    const hour = s.time.hour + s.time.minute / 60;
    for (const b of this.world.buildings) {
      if (b.type !== 'university') continue;
      const students = studentsOf(s).length > 0;
      b.idle = !b.functional || b.damaged || !isTeacherHour(hour) || !students;
      // görünüm (kaydedilmez): derste öğrenci varken pencereler yanar
      const lecture = b.functional && this.inLecture(b).length > 0;
      if (Boolean(b.look?.lecture) !== lecture) b.look = lecture ? { ...(b.look ?? {}), lecture: true } : (b.look && Object.keys(b.look).some((k) => k !== 'lecture') ? { ...b.look, lecture: false } : null);
      b.processStatus = b.damaged ? 'Hasar gördü: onarılana kadar ders yok' : !students ? 'Öğrenci yok: Bilgelik Evi mezunu gençler gün dönümünde kabul edilir' : !isTeacherHour(hour) ? 'Ders saati 14:00-16:00' : null;
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------- mezuniyet

  finish(c) {
    const h = c?.higherStudy;
    if (!h) return;
    const s = this.state;
    c.higherStudy = null;
    const st = this.stats;
    const vars = { name: c.name, field: fieldName(h.field), pct: Math.floor(studyRatio({ higherStudy: h }) * 100) };
    if (h.minutes < U.graduateMinutes) {
      st.dropped += 1;
      addMemory(s, c, TX.memoryDropped, 'book', { kind: 'university', fond: false });
      this.events.emit('university:dropped', { character: c, field: h.field, ratio: studyRatio({ higherStudy: h }) });
      return;
    }
    const before = levelFor(c.skills[h.field] ?? 0);
    c.skills[h.field] = Math.max(c.skills[h.field] ?? 0, KALFA_XP()); // Usta'ysa dokunulmaz: Darülfünun Usta vermez
    const after = levelFor(c.skills[h.field]);
    c.graduate = { field: h.field, day: s.time.day };
    st.graduated += 1;
    const apprentice = Boolean(h.ap);
    if (apprentice) st.apprentices += 1;
    const grandmaster = apprentice && Boolean(c.isGrandmaster);
    if (grandmaster) st.grandmasters += 1;
    if (after.level > before.level) this.events.emit('skill:levelUp', { character: c, skill: h.field, level: after });
    addMemory(s, c, fill(TX.memoryGraduated, vars), 'star', { kind: 'university' });
    // Ebeveynlerin gururu: var olan Hatırlandı moodlet'i (yeni moodlet yok)
    const parents = new Set([...(c.parentIds ?? []), ...(c.parents ?? [])]);
    for (const p of s.characters) if (parents.has(p.id)) this.moodlets?.apply(p, 'celebrated', { reason: 'child_graduate', whoId: c.id, whoName: c.name });
    this.events.emit('university:graduated', { character: c, field: h.field, apprentice, grandmaster });
    this.events.emit('toast', { text: fill(TX.graduated, vars), tone: 'success', icon: 'star' });
  }
}
