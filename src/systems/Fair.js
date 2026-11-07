// (26.1) Mevsimlik panayırın saf yardımcıları: takvim, yer seçimi, kayıt temizliği. Durumu FairSystem yazar.
//   state.currentFestival : null | { type: 'spring' | 'summer' | 'autumn' | 'winter', day, phase: 'prep' | 'party' }
import { FAIR, FAIRS, FAIR_PHASES } from '../data/fair.js';
import { getSeason } from '../data/seasons.js';
import { isGoldenAge } from './GoldenAge.js';

/** Bu gün bir mevsimin son günü mü (panayır günü)? */
export function isFairDay(day) {
  const season = getSeason(day);
  return season.dayOfSeason === season.daysInSeason;
}

/** Panayır kurulabilir mi? Altın Çağ'dan önce hiç kurulmaz (erken oyun ve kule öncesi kayıtlar aynı kalır). */
export function fairOpen(state) {
  return isGoldenAge(state);
}

/** Süren panayır (arayüz ve çizim için): { fair, type, phase } ya da null. */
export function currentFair(state) {
  const cf = state?.currentFestival;
  if (!cf || cf.day !== state.time.day || !FAIRS[cf.type]) return null;
  return { fair: FAIRS[cf.type], type: cf.type, phase: cf.phase };
}

/** Bugün panayır kuruluysa eski (14. aşama) mevsim festivali yerini ona bırakır. */
export function fairOwnsToday(state) {
  return Boolean(state?.currentFestival) && state.currentFestival.day === state.time.day;
}

/** Panayır yeri: meydan havuzu, yoksa kamp ateşi, yoksa han (hasarsız, tamamlanmış). */
export function fairVenue(world) {
  for (const type of FAIR.venues) {
    const venue = world.getCompleted(type).find((b) => !b.damaged);
    if (venue) return venue;
  }
  return null;
}

/** Kayıttaki panayır durumu: bozuksa null (v2-v28 kayıtlarında alan yoktur, null'a düşer). */
export function sanitizeCurrentFestival(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!FAIRS[raw.type] || !FAIR_PHASES.includes(raw.phase) || !Number.isFinite(raw.day)) return null;
  return { type: raw.type, day: Math.floor(raw.day), phase: raw.phase };
}
