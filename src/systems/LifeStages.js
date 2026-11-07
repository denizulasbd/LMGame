// (25.1) Yaşam evrelerinin saf hesapları: evre, yaş / gün dönüşümü, doğum günü, çekirdek yetişkinler, emeklilik ve
// bilgelerin refah katkısı. Durum değiştirmez, rastgelelik kullanmaz (LifeStageSystem uygular).
import { AGING, ELDER, LIFE_STAGE_KEYS } from '../data/lifeStages.js';

/** Kimliğe göre doğum gününün yıl içindeki sırası (0..birthdaySpread-1). */
export function birthdayOffset(id) {
  return ((Number.isFinite(id) ? Math.abs(Math.floor(id)) : 0) * 5) % AGING.birthdaySpread;
}

/** Yaş (yıl) -> doğduğundan bu yana geçen oyun günü (doğum günü kimlikten). */
export function daysForAge(age, id) {
  return Math.max(0, Math.floor(age)) * AGING.daysPerYear + birthdayOffset(id);
}

/** Oyun günü -> yaş (yıl). */
export function ageFromDays(ageInDays) {
  return Math.floor(Math.max(0, ageInDays) / AGING.daysPerYear);
}

/**
 * İki sakinin kuşak yaşı farkı (yıl): kasabaya katıldıkları / büyüdükleri andaki yaşlarının farkı. Herkes her gün birlikte
 * yaşlandığı için zamanla değişmez; doğum günleri yılın ilk 8 gününe dağıldığından (8/16 < 0,5) yuvarlama tam yıl farkını verir.
 */
export function ageGap(a, b) {
  const cohort = (c) => (Number.isFinite(c.ageInDays) ? c.ageInDays - (c.agedDays ?? 0) : (c.age ?? 0) * AGING.daysPerYear);
  return Math.round(Math.abs(cohort(a) - cohort(b)) / AGING.daysPerYear);
}

/** Yaşa ve çocukluğa göre evre. Evreler geri dönmez: kazanılmış bilge unvanı ve yetişkinlik korunur. */
export function stageFor({ isChild, age, lifeStage }) {
  if (isChild) return 'child';
  if (lifeStage === 'elder' || age >= AGING.elderAt) return 'elder';
  if (lifeStage === 'adult' || age >= AGING.youthUntil) return 'adult';
  return 'youth';
}

export function isLifeStage(value) {
  return LIFE_STAGE_KEYS.includes(value);
}

/** Kasabalı mı (gezgin tüccar gibi ziyaretçiler yaşlanmaz)? */
export function isResident(c) {
  return Boolean(c) && !c.role;
}

/** Çalışabilir çekirdek sakinler: çocuk, bilge ve ziyaretçi olmayan (gönüllü bilgeler sayılmaz). */
export function coreWorkers(state) {
  return state.characters.filter((c) => isResident(c) && !c.isChild && c.lifeStage !== 'elder' && !c.emigrating);
}

/**
 * Hangi bilgeler emekli: çekirdek sakin sayısı minCoreAdults'un altındaysa eksik kadar bilge (kimlik sırasıyla)
 * gönüllü çalışır, ötekiler emeklidir. Dönüş: { retired: Set<id>, volunteers: Set<id> }.
 */
export function retirementPlan(state) {
  const elders = state.characters.filter((c) => isResident(c) && !c.isChild && c.lifeStage === 'elder' && !c.emigrating).sort((a, b) => a.id - b.id);
  const missing = Math.max(0, ELDER.minCoreAdults - coreWorkers(state).length);
  const volunteers = new Set(elders.slice(0, missing).map((c) => c.id));
  const retired = new Set(elders.filter((c) => !volunteers.has(c.id)).map((c) => c.id));
  return { retired, volunteers };
}

/** Emekli bilgelerin kasaba refahına katkısı (puan). Bilge yoksa 0. */
export function elderWelfare(state) {
  let n = 0;
  for (const c of state.characters) if (c.retired && c.lifeStage === 'elder') n += 1;
  return Math.min(ELDER.welfare.max, n * ELDER.welfare.perElder);
}

/** Evre sayıları { child, youth, adult, elder }. */
export function stageCounts(state) {
  const out = Object.fromEntries(LIFE_STAGE_KEYS.map((k) => [k, 0]));
  for (const c of state.characters) if (isResident(c) && out[c.lifeStage] !== undefined) out[c.lifeStage] += 1;
  return out;
}

/** Kayıttaki yaşam evresi sayaçları: bilgelerin verdiği nasihat dakikası, unvanı alan bilgeler, son günlük cümlesi. */
export function emptyLifeStages() {
  return { adviceMinutes: 0, elders: 0, adults: 0, lastElderLine: null };
}

export function restoreLifeStages(data) {
  const out = emptyLifeStages();
  if (!data || typeof data !== 'object') return out;
  out.adviceMinutes = Number.isFinite(Number(data.adviceMinutes)) ? Math.max(0, Number(data.adviceMinutes)) : 0;
  out.elders = Math.max(0, Math.floor(Number(data.elders) || 0));
  out.adults = Math.max(0, Math.floor(Number(data.adults) || 0));
  out.lastElderLine = typeof data.lastElderLine === 'string' ? data.lastElderLine : null;
  return out;
}
