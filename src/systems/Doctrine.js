// (28.4) Kasaba Doktrinleri'nin saf hesapları (durum değiştirmek yalnızca chooseDoctrine'dedir). Sayılar data/doctrines.js'te.
//   state.doctrine = { chosen: anahtar | null, day: seçildiği gün | null }  (kayda girer)
import { DOCTRINES } from '../data/doctrines.js';
import { RESEARCH } from '../data/research.js';
import { CIVIC_PROJECTS } from '../data/town.js';

export function emptyDoctrine() {
  return { chosen: null, day: null };
}

export function restoreDoctrine(data) {
  const out = emptyDoctrine();
  if (data && DOCTRINES[data.chosen]) {
    out.chosen = data.chosen;
    out.day = Number.isFinite(data.day) ? data.day : null;
  }
  return out;
}

export function chosenDoctrine(state) {
  return DOCTRINES[state.doctrine?.chosen] ? state.doctrine.chosen : null;
}

/** Bir araştırma / fermanın bağlı olduğu doktrin (nötrse null). */
export function doctrineOfResearch(id) {
  return RESEARCH[id]?.doctrine ?? null;
}
export function doctrineOfCivic(id) {
  return CIVIC_PROJECTS[id]?.doctrine ?? null;
}

/** Doktrine bağlı bir öğe başlatılabilir mi (nötr, ya da seçilen doktrin bu mu / henüz seçilmedi)? { ok, reason } */
export function doctrineGate(state, tag) {
  if (!tag) return { ok: true, reason: null };
  const chosen = chosenDoctrine(state);
  if (!chosen || chosen === tag) return { ok: true, reason: null };
  return { ok: false, reason: `Doktrin kilitli: ${DOCTRINES[chosen].name} seçildi (${DOCTRINES[tag].name} yolu kapalı)` };
}

/** Doktrini seçer (zaten seçiliyse dokunmaz). Dönüş: bu çağrıda yeni mi seçildi. */
export function chooseDoctrine(state, tag) {
  if (!tag || chosenDoctrine(state)) return false;
  state.doctrine = { chosen: tag, day: state.time.day };
  return true;
}

function active(state) {
  return DOCTRINES[chosenDoctrine(state)] ?? null;
}

export function doctrineProductionMultiplier(state, type) {
  return active(state)?.production?.[type] ?? 1;
}

/** Çevre estetiğinin refaha katkı çarpanı (Sanayi Doktrini'nde 0,92). */
export function doctrineAestheticMultiplier(state) {
  return active(state)?.aesthetic ?? 1;
}

/** Ürün Silosu'nun tarımsal kapasite katkısına ek oran (Tarım Doktrini'nde 0,5). */
export function doctrineGranaryBonus(state) {
  return active(state)?.granary ?? 0;
}

export function doctrineContractMultiplier(state) {
  return active(state)?.contract ?? 1;
}
export function doctrineExportMultiplier(state) {
  return active(state)?.export ?? 1;
}
export function doctrineLevyMultiplier(state) {
  return active(state)?.levy ?? 1;
}
