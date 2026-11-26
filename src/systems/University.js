// (32.4) Darülfünun: SAF hesaplar (durum yazmaz, zar çekmez). Sayılar data/university.js, durum systems/UniversitySystem.js.
//   educationLevel(c)         : 0 / 1 (Bilgelik Evi mezunu, c.educated) / 2 (Darülfünun mezunu, c.graduate). Bütün gösterim ve faktörler bunu kullanır.
//   canEnroll / admissionQueue: kabul koşulları ve bekleme sırası (en yüksek schooling önce, eşitlikte küçük kimlik)
//   fieldFor(c)               : bölüm (çırak mesleği → huy / özellik tablosu → primarySkill → kimliğe göre yedek)
//   lectureMultiplier         : Müderris ×2, Kraliyet Arşivi ×1,2, misafir Kıdemli Bilge ×1,25
//   universityCrimeFactor / renownEducationShare / scholarResearchFactor : öteki sistemlerin kancaları (çırak telafisi ApprenticeshipSystem.lectureCredit)
// Character.js bu dosyanın yalnızca sanitize işlevlerini, Justice.js ve Renown.js faktör işlevlerini çağırır.
import { UNIVERSITY as U, EDUCATION_CRIME, EDUCATION_RENOWN, FIELD_BY_QUIRK, FIELD_BY_TRAIT, FIELD_FALLBACK } from '../data/university.js';
import { PROFESSIONS } from '../data/apprenticeship.js';
import { SKILLS, SKILL_LEVELS } from '../data/skills.js';
import { primarySkill } from './SkillSystem.js';
import { engineOn } from './Engines.js';
import { AGING } from '../data/lifeStages.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const byId = (list, id) => list[((Number(id) || 0) % list.length + list.length) % list.length];
export const KALFA_XP = () => SKILL_LEVELS.find((l) => l.level === 2).xp;

// ---------------------------------------------------------------------------------------------------------------------- seviye

/** 0: eğitimsiz · 1: Bilgelik Evi mezunu (c.educated) · 2: Darülfünun mezunu (c.graduate). */
export function educationLevel(c) {
  if (!c) return 0;
  if (c.graduate) return 2;
  return c.educated ? 1 : 0;
}

/** Ders alan genç mi (Darülfünun öğrencisi)? */
export function isStudent(c) {
  return Boolean(c?.higherStudy);
}

/** Bölümün görünen adı ("Şifacılık"). */
export function fieldName(field) {
  return SKILLS[field]?.name ?? 'Genel';
}

/** İlerleme oranı 0-1 (mezuniyet eşiğine göre). */
export function studyRatio(c) {
  return clamp01((c?.higherStudy?.minutes ?? 0) / U.graduateMinutes);
}

// ---------------------------------------------------------------------------------------------------------------------- yapı ve saat

/** Kasabanın işleyen (bitmiş, hasarsız) Darülfünun'u ya da null. */
export function universityOf(state) {
  if (!engineOn('university')) return null;
  return state.buildings.find((b) => b.type === 'university' && b.functional && !b.damaged && !b.underConstruction) ?? null;
}

const within = (hour, range) => hour >= range.from && hour < range.to;
/** Ders saati mi (14:00-16:00)? */
export const isLectureHour = (hour) => within(hour, U.hours);
/** Müderris'in yapıda olacağı saatler (13:30-16:00). */
export const isTeacherHour = (hour) => within(hour, U.teacherHours);

/** Bugün kalan ders hakkı (ham dakika). */
export function lectureLeft(c, day) {
  const s = c?.higherStudy;
  if (!s) return 0;
  const today = s.day === day ? s.today : 0;
  return Math.max(0, U.minutesPerDay - today);
}

// ---------------------------------------------------------------------------------------------------------------------- kabul

/** (33.0) Gençliğinin bitmesine kalan oyun günü (yaşlanma 21'e ulaşınca yetişkin olur); yaş günü bilinmiyorsa sonsuz. */
export function youthDaysLeft(c) {
  if (!Number.isFinite(c?.ageInDays)) return Infinity;
  return Math.max(0, AGING.youthUntil * AGING.daysPerAge - Math.floor(c.ageInDays));
}

/** Zaman dışındaki kabul koşulları: Genç, Bilgelik Evi mezunu, öğrenci / mezun değil; seferde, ayrılırken, sürgünde, hastalıkta değil. */
function enrollable(c) {
  if (!c || c.role || c.isChild || c.lifeStage !== 'youth') return false;
  if (c.educated !== true || c.higherStudy || c.graduate) return false;
  if (c.away || c.emigrating || c.sentence?.exile || c.illness) return false;
  return true;
}

/** (33.0) Her şey uygun ama gençliğinin bitmesine minYouthDaysLeft günden az kaldı: kabul edilmez (panelde nedeni yazılır). */
export function tooLate(c) {
  return enrollable(c) && youthDaysLeft(c) < U.minYouthDaysLeft;
}

/** Kabul edilebilir mi: enrollable koşulları + (33.0) gençliğinin bitmesine en az minYouthDaysLeft gün var. */
export function canEnroll(c) {
  return enrollable(c) && youthDaysLeft(c) >= U.minYouthDaysLeft;
}

/** Bekleme sırası (en yüksek Bilgelik Evi ilerlemesi önce, eşitlikte küçük kimlik). */
export function admissionQueue(state) {
  return state.characters.filter(canEnroll).sort((a, b) => (b.schooling ?? 0) - (a.schooling ?? 0) || a.id - b.id);
}

/** (33.0) Zamanı yetmediği için kabul edilmeyen gençler (panelde neden yazılır). */
export function lateOnes(state) {
  return state.characters.filter(tooLate).sort((a, b) => a.id - b.id);
}

export function studentsOf(state) {
  return state.characters.filter((c) => c.higherStudy);
}

/** Bugün kaç yer boş. */
export function freeSeats(state) {
  return Math.max(0, U.capacity - studentsOf(state).length);
}

/**
 * Bölüm (bir SKILL_KEYS değeri). Zar yok:
 *   (1) çırağın meslek becerisi; (2) huy, sonra özellik tablosu (dizi ise kimliğe göre); (3) primarySkill; (4) kimliğe göre yedek.
 * Dönüş: { field, source: 'apprentice' | 'quirk' | 'trait' | 'skill' | 'fallback' }.
 */
export function fieldFor(c) {
  const prof = c?.apprenticeship ? PROFESSIONS[c.apprenticeship.profession] : null;
  if (prof?.skill && SKILLS[prof.skill]) return { field: prof.skill, source: 'apprentice' };
  const pick = (v) => (Array.isArray(v) ? byId(v, c.id) : v);
  if (c?.quirk && FIELD_BY_QUIRK[c.quirk]) return { field: pick(FIELD_BY_QUIRK[c.quirk]), source: 'quirk' };
  for (const t of c?.traits ?? []) if (FIELD_BY_TRAIT[t]) return { field: pick(FIELD_BY_TRAIT[t]), source: 'trait' };
  const main = c ? primarySkill(c) : null;
  if (main?.skill) return { field: main.skill, source: 'skill' };
  return { field: byId(FIELD_FALLBACK, c?.id), source: 'fallback' };
}

// ---------------------------------------------------------------------------------------------------------------------- ders

/** Kraliyet Arşivi (32.3) kuruluysa ×1,2 (şalter renown kapalıyken 1). */
export function archiveFactor(state) {
  return engineOn('renown') && state.buildings.some((b) => b.type === 'royalArchive' && b.functional) ? U.archiveMultiplier : 1;
}

/** İçeride çalışan Müderris (task perform) var mı? */
export function professorInside(state, building) {
  return [...(building?.workerIds ?? [])].some((id) => {
    const o = state.characters.find((x) => x.id === id);
    return o && o.task?.workBuildingId === building.id && o.task.phase === 'perform';
  });
}

/** Misafir Kıdemli Bilge içeride sohbet ediyor mu? */
export function guestInside(state, building) {
  return state.characters.some((o) => o.task?.activity === 'uniTalk' && o.task.buildingId === building?.id && o.task.phase === 'perform');
}

/** Bu dakikanın ders çarpanı ve parçaları: { total, professor, archive, guest }. */
export function lectureMultiplier(state, building) {
  const professor = professorInside(state, building) ? U.professorMultiplier : 1;
  const archive = archiveFactor(state);
  const guest = guestInside(state, building) ? U.guestMultiplier : 1;
  return { total: professor * archive * guest, professor, archive, guest };
}

// ---------------------------------------------------------------------------------------------------------------------- kancalar

/** (Justice.educationFactor) öğrenci ×0,8 · Darülfünun mezunu ×0,65 · Bilgelik Evi mezunu ×0,85 (educationMerit) · yoksa 1. */
export function universityCrimeFactor(c) {
  if (!engineOn('university') || !c) return 1;
  if (c.higherStudy) return EDUCATION_CRIME.student;
  const level = educationLevel(c);
  if (level === 2) return EDUCATION_CRIME[2];
  if (level === 1 && engineOn('educationMerit')) return EDUCATION_CRIME[1];
  return 1;
}

/** İtibardaki eğitim payının sayıldığı yetişkinler (Genç ve çocuk hariç; misafirler hariç). */
export function educationAdults(state) {
  return state.characters.filter((c) => !c.role && !c.isChild && c.lifeStage !== 'youth');
}

/** (Renown.renownEducation) yetişkinler içinde (seviye 2 payı + 0,3 × yalnızca seviye 1 payı), 0-1. Şalter kapalıyken 0. */
export function renownEducationShare(state) {
  if (!engineOn('university')) return 0;
  const adults = educationAdults(state);
  if (!adults.length) return 0;
  let two = 0;
  let one = 0;
  for (const c of adults) {
    const l = educationLevel(c);
    if (l === 2) two += 1;
    else if (l === 1) one += 1;
  }
  const merit = engineOn('educationMerit') ? EDUCATION_RENOWN.levelOneWeight * one : 0;
  return clamp01((two + merit) / adults.length);
}

/** (ResearchSystem.work) Bilgelik Evi'nde içeride çalışan Bilge Bilgelik bölümü mezunuysa ×1,15. */
export function scholarResearchFactor(state, building) {
  if (!engineOn('university') || !building?.workerIds?.size) return 1;
  for (const id of building.workerIds) {
    const o = state.characters.find((x) => x.id === id);
    if (o?.graduate?.field === 'scholarship' && o.task?.workBuildingId === building.id && o.task.phase === 'perform') return U.scholarResearch;
  }
  return 1;
}

// ---------------------------------------------------------------------------------------------------------------------- kayıt

/** c.higherStudy (isteğe bağlı): { field, minutes, today, day, since, ap? (öğrenciyken çıraktı) } ya da null. */
export function sanitizeHigherStudy(raw) {
  if (!raw || typeof raw !== 'object' || !SKILLS[raw.field]) return null;
  const n = (v) => (Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : 0);
  return { field: raw.field, minutes: n(raw.minutes), today: n(raw.today), day: Number.isInteger(raw.day) ? raw.day : 0, since: Number.isInteger(raw.since) ? raw.since : 0, ...(raw.ap ? { ap: 1 } : {}) };
}

/** c.graduate (isteğe bağlı): { field, day } ya da null. */
export function sanitizeGraduate(raw) {
  if (!raw || typeof raw !== 'object' || !SKILLS[raw.field]) return null;
  return { field: raw.field, day: Number.isInteger(raw.day) ? raw.day : 0 };
}

/** state.university (isteğe bağlı sayaçlar). */
export function emptyUniversity() {
  return { admitted: 0, graduated: 0, dropped: 0, left: 0, studentDays: 0, lectureMinutes: 0, fields: {}, apprentices: 0, grandmasters: 0, apprenticeCredit: 0 };
}

export function restoreUniversity(data) {
  if (!data || typeof data !== 'object') return null;
  const out = emptyUniversity();
  for (const k of Object.keys(out)) {
    if (k === 'fields') continue;
    if (Number.isFinite(data[k]) && data[k] >= 0) out[k] = Math.round(data[k] * 100) / 100;
  }
  if (data.fields && typeof data.fields === 'object') for (const [k, v] of Object.entries(data.fields)) if (SKILLS[k] && Number.isFinite(v) && v > 0) out.fields[k] = Math.floor(v);
  return out;
}
