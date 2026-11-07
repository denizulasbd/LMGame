// (26.3) Gezgin konukların saf hesapları (durum değiştirmez). Sayılar src/data/guest.js'te.
//   state.activeGuest : null | { type, name, look, arrivalDay, departureDay, x, y, leaving, resting, barters, lastBarterDay }
//   state.guestBook   : { nextDay, visits, lastType, barters, wisdom, rare: { schema, shard, seed } }
import { GUEST, GUEST_KEYS, BARTER_OFFERS, BARTER_KEYS, GUEST_TYPES } from '../data/guest.js';
import { isGoldenAge } from './GoldenAge.js';
import { isFairDay } from './Fair.js';

export function emptyGuestBook() {
  return { nextDay: null, visits: 0, lastType: null, barters: 0, wisdom: 0, rare: { schema: 0, shard: 0, seed: 0 } };
}

export function restoreGuestBook(raw) {
  const out = emptyGuestBook();
  if (!raw || typeof raw !== 'object') return out;
  const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  out.nextDay = Number.isFinite(raw.nextDay) ? Math.floor(raw.nextDay) : null;
  out.visits = n(raw.visits);
  out.lastType = GUEST_TYPES[raw.lastType] ? raw.lastType : null;
  out.barters = n(raw.barters);
  out.wisdom = Number.isFinite(raw.wisdom) && raw.wisdom > 0 ? Math.round(raw.wisdom * 1000) / 1000 : 0;
  for (const k of BARTER_KEYS) out.rare[k] = n(raw.rare?.[k]);
  return out;
}

/** Kayıttaki aktif konuk: bozuksa null (v2-v30 kayıtlarında alan yoktur). */
export function sanitizeActiveGuest(raw) {
  if (!raw || typeof raw !== 'object' || !GUEST_TYPES[raw.type]) return null;
  if (!Number.isFinite(raw.arrivalDay) || !Number.isFinite(raw.departureDay) || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) return null;
  const arrivalDay = Math.floor(raw.arrivalDay);
  const def = GUEST_TYPES[raw.type];
  return {
    type: raw.type,
    name: typeof raw.name === 'string' && raw.name ? raw.name : def.names[0],
    look: Number.isInteger(raw.look) && raw.look >= 0 && raw.look < def.appearances.length ? raw.look : 0,
    arrivalDay,
    departureDay: Math.max(arrivalDay, Math.floor(raw.departureDay)),
    x: raw.x,
    y: raw.y,
    leaving: Boolean(raw.leaving),
    resting: Boolean(raw.resting),
    barters: Number.isFinite(raw.barters) && raw.barters > 0 ? Math.floor(raw.barters) : 0,
    lastBarterDay: Number.isFinite(raw.lastBarterDay) ? Math.floor(raw.lastBarterDay) : null,
  };
}

/** Konuk kabul edilir mi? Altın Çağ'dan önce hiç. */
export function guestOpen(state) {
  return isGoldenAge(state);
}

/** Bugün yeni konuk gelmeli mi (09:00)? nextDay yoksa Altın Çağ'dan firstDelayDays sonrasına kurulur. */
export function arrivalDue(state) {
  if (!guestOpen(state) || state.activeGuest) return false;
  const book = state.guestBook;
  const day = state.time.day;
  const next = book.nextDay ?? state.goldenAge.since.day + GUEST.firstDelayDays;
  if (state.characters.length < GUEST.minPopulation) return false;
  return day >= next || (isFairDay(day) && day >= next - GUEST.fairSnapDays);
}

/** Konuk türleri: son gelenden farklı olanlar (hepsi aynıysa hepsi). */
export function pickableTypes(lastType) {
  const rest = GUEST_KEYS.filter((k) => k !== lastType);
  return rest.length ? rest : GUEST_KEYS;
}

/** Bugünkü misafir: { guest, def, type } ya da null (arayüz için). */
export function currentGuest(state) {
  const g = state?.activeGuest;
  return g ? { guest: g, def: GUEST_TYPES[g.type], type: g.type } : null;
}

/** Takas: elde yeterli fazla lüks mal olan teklifler (bedel + rezerv). */
export function affordableOffers(state, reserve) {
  const res = state.resources;
  return BARTER_KEYS.filter((k) => Object.entries(BARTER_OFFERS[k].cost).every(([r, q]) => (res[r] ?? 0) >= q + (reserve[r] ?? 0)));
}
