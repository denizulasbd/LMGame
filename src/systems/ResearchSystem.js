// Bilgelik Evi (12. aşama): kasaba araştırmaları ve çocukların okulu. Kurallar src/data/research.js'te.
//
//   Araştırma: oyuncu panelden seçer ('ui:startResearch' { id }); maliyet peşin ödenir, state.research.active'e
//              yazılır. Bilge içeride çalıştıkça (BehaviorSystem -> teach) ilerler; bitince teknoloji kalıcı olur:
//              'research:completed' { id, research }. Etkileri bu dosyadaki saf yardımcılarla diğer sistemler uygular.
//   Okul     : ders saatlerinde (09:00-15:00) çocuklar Bilgelik Evi'nde ders dinler (Brain -> planSchool); Bilge o
//              sırada içerideyse iki kat öğrenirler (c.schooling). Yeterince okuyan çocuk büyüyünce rastgele bir
//              meslekte doğrudan Kalfa olur: 'school:graduated' { character, skill }.
// Durum state.research'tedir (kayda girer): { active: { id, progress } | null, done: { id: { day, hour, minute } } }.
//   (16. aşama) Kadim yazıt: araştırma yokken Bilge çözülmeyi bekleyen yazıtın başına oturur
//              (state.exploration.decoding); çözülünce kalıcı imar şeması: 'inscription:decoded' { id, inscription }.
import { bookResearchMultiplier } from './GoldenAge.js';
import { renownResearchFactor } from './Renown.js';
import { scholarResearchFactor } from './University.js'; // (32.4)
import { RESEARCH, SCHOOL } from '../data/research.js';
import { SKILL_LEVELS, SKILL_KEYS } from '../data/skills.js';
import { isWithinHours } from './StructureSystem.js';
import { INSCRIPTIONS } from '../data/exploration.js';
import { doctrineGate, chooseDoctrine } from './Doctrine.js';

// ---------------------------------------------------------------------------
// Araştırmaların etkileri (saf yardımcılar)
// ---------------------------------------------------------------------------

export function hasResearch(state, id) {
  return Boolean(state.research?.done?.[id]);
}

/** Bu yapı türünde üretim / işleme verimi çarpanı (Gelişmiş Çarklar). */
export function researchProductionMultiplier(state, type) {
  let m = 1;
  for (const def of Object.entries(RESEARCH)) {
    const [id, research] = def;
    const p = research.effect.production;
    if (p && hasResearch(state, id) && p.types.includes(type)) m *= p.multiplier; // (28.4) Münavebe de üretimi artırır
  }
  return m;
}

/** (28.4) Liman satış değeri çarpanı (Ticaret Hukuku). */
export function researchExportMultiplier(state) {
  return hasResearch(state, 'tradeLaw') ? RESEARCH.tradeLaw.effect.exportValue : 1;
}

/** İnşaat, yükseltme ve onarım hızı çarpanı (Mimarlık Loncası). */
export function researchBuildMultiplier(state) {
  return hasResearch(state, 'architecture') ? RESEARCH.architecture.effect.buildSpeed : 1;
}

/** Fırtına / kurt hasarına direnç (hasar alan yapı sayısı bu sayıya bölünür). */
export function stormResistance(state) {
  return hasResearch(state, 'architecture') ? RESEARCH.architecture.effect.stormResistance : 1;
}

/** Şifacıda tedavi ve iksir hazırlama hızı çarpanı. */
export function healSpeedMultiplier(state) {
  return hasResearch(state, 'herbalism') ? RESEARCH.herbalism.effect.healSpeed : 1;
}

/** Dinçlik süresi (oyun saati); araştırma yoksa null (varsayılan süre). */
export function researchVigorHours(state) {
  return hasResearch(state, 'herbalism') ? RESEARCH.herbalism.effect.vigorHours : null;
}

/** Evlerin kışlık odun tüketimi çarpanı (Kışlık Yalıtım). */
export function researchHeatingMultiplier(state) {
  return hasResearch(state, 'insulation') ? RESEARCH.insulation.effect.heating : 1;
}

/** Araştırma başlatılabilir mi? { ok, reason } (arayüz de aynı sonucu gösterir). */
export function researchStatus(state, id, hasAcademy = true) {
  const def = RESEARCH[id];
  const r = state.research;
  if (!def) return { ok: false, reason: 'Bilinmeyen araştırma' };
  if (r.done[id]) return { ok: false, reason: 'Tamamlandı', done: true };
  if (r.active?.id === id) return { ok: false, reason: 'Araştırılıyor', active: true };
  if (!hasAcademy) return { ok: false, reason: 'Önce Bilgelik Evi tamamlanmalı' };
  const gate = doctrineGate(state, def.doctrine ?? null); // (28.4) Kasaba Doktrinleri: karşılıklı dışlayan yollar
  if (!gate.ok) return { ok: false, reason: gate.reason, locked: true };
  if (r.active) return { ok: false, reason: 'Bilge başka bir araştırmayla meşgul' };
  const missing = Object.entries(def.cost).filter(([res, v]) => (state.resources[res] ?? 0) < v);
  if (missing.length) return { ok: false, reason: 'Yetersiz kaynak' };
  return { ok: true, reason: null };
}

export class ResearchSystem {
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
    this.unsubscribers = [
      game.events.on('ui:startResearch', ({ id }) => this.start(id)),
      game.events.on('family:grownUp', ({ character }) => this.graduate(character)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  academies() {
    return this.world.getCompleted().filter((b) => b.definition.academy && !b.damaged);
  }

  start(id) {
    const status = researchStatus(this.state, id, this.academies().length > 0);
    if (!status.ok) {
      this.events.emit('toast', { text: `${RESEARCH[id]?.name ?? 'Araştırma'}: ${status.reason}`, tone: 'warn', icon: 'book' });
      return status;
    }
    this.economy.spend(RESEARCH[id].cost);
    this.state.research.active = { id, progress: 0 };
    if (chooseDoctrine(this.state, RESEARCH[id].doctrine ?? null)) this.events.emit('doctrine:chosen', { doctrine: this.state.doctrine.chosen, source: 'research', id });
    this.events.emit('research:started', { id, research: RESEARCH[id] });
    this.events.emit('toast', { text: `Araştırma başladı: ${RESEARCH[id].name}. Bilge çalıştıkça ilerleyecek.`, tone: 'info', icon: 'book' });
    return { ok: true };
  }

  /** Ders saati mi? */
  schoolHours(hour = this.state.time.hour + this.state.time.minute / 60) {
    return isWithinHours(hour, SCHOOL.hours);
  }

  /** İçeride ders dinleyen çocuklar. */
  pupils(building) {
    return this.world.characters.filter((c) => c.task?.activity === 'school' && c.task.buildingId === building.id && c.task.phase === 'perform');
  }

  update() {
    for (const b of this.world.buildings) {
      if (!b.definition.academy) continue;
      const kids = this.world.characters.some((c) => c.isChild);
      // Bilge araştırma varken ya da ders saatinde çocuk varken gelir
      const decoding = this.state.exploration?.decoding;
      b.idle = !b.functional || b.damaged || (!this.state.research.active && !decoding && !(kids && this.schoolHours()));
      b.processStatus = b.damaged
        ? 'Fırtınada hasar gördü: onarılana kadar çalışmaz'
        : b.idle
          ? 'Araştırma ya da çözülecek yazıt seçilmedi; ders saatinde çocuk da yok'
          : !this.state.research.active && decoding
            ? `Bilge kadim yazıtı çözüyor: ${INSCRIPTIONS[decoding.id].name}`
            : null;
    }
  }

  /**
   * Bilge'nin çalışması (BehaviorSystem çağırır): araştırma varsa ilerletir; yoksa ders saatinde çocuklara ders
   * verir. Yapacak iş yoksa false (Bilge ayrılır).
   */
  work(building, amount) {
    const active = this.state.research.active;
    if (active) {
      active.progress += amount * bookResearchMultiplier(this.state) * renownResearchFactor(this.state) * scholarResearchFactor(this.state, building); // (20. aşama) antik kitaplar; (32.3) Kraliyet Arşivi; (32.4) Bilgelik bölümü mezunu Bilge
      const def = RESEARCH[active.id];
      if (active.progress >= def.work) this.complete(active.id);
      return true;
    }
    const decoding = this.state.exploration?.decoding;
    if (decoding) {
      decoding.progress += amount * renownResearchFactor(this.state); // (32.3) Kraliyet Arşivi
      if (decoding.progress >= INSCRIPTIONS[decoding.id].work) this.decode(decoding.id);
      return true;
    }
    return this.schoolHours() && this.world.characters.some((c) => c.isChild);
  }

  /** (16. aşama) Kadim yazıt çözüldü: imar şeması kalıcı olarak kasabanındır. */
  decode(id) {
    const ex = this.state.exploration;
    const { day, hour, minute } = this.state.time;
    ex.inscriptions[id] = { ...(ex.inscriptions[id] ?? {}), status: 'decoded', decodedAt: { day, hour, minute } };
    ex.decoding = null;
    this.events.emit('inscription:decoded', { id, inscription: INSCRIPTIONS[id] });
    this.events.emit('toast', { text: `Kadim yazıt çözüldü: ${INSCRIPTIONS[id].name}! ${INSCRIPTIONS[id].description}`, tone: 'success', icon: 'scheme' });
  }

  complete(id) {
    const { day, hour, minute } = this.state.time;
    this.state.research.done[id] = { day, hour, minute };
    this.state.research.active = null;
    this.events.emit('research:completed', { id, research: RESEARCH[id] });
    this.events.emit('toast', { text: `Araştırma tamamlandı: ${RESEARCH[id].name}! ${RESEARCH[id].description}`, tone: 'success', icon: 'book' });
  }

  /** Ders dinleyen çocuğun öğrenmesi (BehaviorSystem her dakika çağırır). */
  learn(c, building, minutes) {
    const day = this.state.time.day;
    if (c.schoolDay !== day) {
      c.schoolDay = day;
      c.schoolToday = 0;
    }
    // Günlük ders sınırı: fazlası sayılmaz (ders biterken birkaç dakika oyalanan çocuk fazladan öğrenmez)
    const learned = Math.min(minutes, Math.max(0, SCHOOL.minutesPerDay - c.schoolToday));
    if (learned <= 0) return;
    const sage = [...building.workerIds].some((id) => this.world.getCharacter(id)?.task?.phase === 'perform');
    c.schooling = (c.schooling ?? 0) + learned * (sage ? SCHOOL.sageMultiplier : 1);
    c.schoolToday += learned;
  }

  /** Okula yeterince giden çocuk büyüyünce rastgele bir meslekte Kalfa olarak başlar. */
  graduate(c) {
    if ((c.schooling ?? 0) < SCHOOL.graduateMinutes) return;
    const journeyman = SKILL_LEVELS.find((l) => l.level === 2).xp;
    const skill = this.rng.pick(SKILL_KEYS);
    c.skills[skill] = Math.max(c.skills[skill] ?? 0, journeyman);
    c.educated = true;
    this.events.emit('school:graduated', { character: c, skill });
  }
}
