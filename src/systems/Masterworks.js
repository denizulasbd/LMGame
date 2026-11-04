// (15. aşama) Usta işi eserlerin saf hesapları: satış fiyatı, sergileme / satış durumu, refah katkısı. Sistemler
// (CraftsmanshipSystem, TownStatus) ve arayüz (Kasaba Arşivi, Belediye Konağı ve liman panelleri) yalnızca GameState'i
// okuyarak bunları kullanır. Kurallar src/data/masterpieces.js'te.
//
// Durum state.masterworks'tedir (kayda girer):
//   { items: [{ id, type, makerId, maker, day, hour, status: 'stored' | 'exhibited' | 'sold', price? }], nextId,
//     made, exhibited, sold, goldEarned, lastByMaker: { sakinId: gün } }
import { MASTERPIECES, MASTERWORK } from '../data/masterpieces.js';

const hasHarbor = (state) => state.buildings.some((b) => b.type === 'harbor' && b.functional && !b.damaged);
const merchantHere = (state) => state.events.merchant.present && !state.events.merchant.leaving;

export function masterworkItem(state, id) {
  return state.masterworks?.items.find((i) => i.id === id) ?? null;
}

/** Depoda bekleyen (sergilenmemiş, satılmamış) eserler. */
export function storedMasterworks(state) {
  return (state.masterworks?.items ?? []).filter((i) => i.status === 'stored');
}

export function exhibitedMasterworks(state) {
  return (state.masterworks?.items ?? []).filter((i) => i.status === 'exhibited');
}

/** Eserin bu satıcıdan getireceği altın: liman tam değeri, gezgin tüccar MASTERWORK.merchantRate'ini öder. */
export function masterworkPrice(type, source) {
  const value = MASTERPIECES[type]?.value ?? 0;
  return source === 'merchant' ? Math.round(value * MASTERWORK.merchantRate) : value;
}

/** Eser satılabilir mi? { ok, reason, price } */
export function masterworkSaleStatus(state, id, source) {
  const item = masterworkItem(state, id);
  if (!item || item.status !== 'stored') return { ok: false, reason: 'Eser depoda değil', price: 0 };
  const price = masterworkPrice(item.type, source);
  if (source === 'harbor' && !hasHarbor(state)) return { ok: false, reason: 'Önce Büyük Ticaret Limanı tamamlanmalı', price };
  if (source === 'merchant' && !merchantHere(state)) return { ok: false, reason: 'Gezgin tüccar tezgâhta değil', price };
  if (source !== 'harbor' && source !== 'merchant') return { ok: false, reason: 'Bilinmeyen alıcı', price };
  return { ok: true, reason: null, price };
}

/** Eserin satılabileceği en iyi yer ('harbor' > 'merchant') ya da null. */
export function bestMasterworkBuyer(state) {
  if (hasHarbor(state)) return 'harbor';
  if (merchantHere(state)) return 'merchant';
  return null;
}

/** Eser sergilenebilir mi? { ok, reason } (Kasaba Arşivi'nin vitrini her zaman açıktır) */
export function masterworkExhibitStatus(state, id) {
  const item = masterworkItem(state, id);
  if (!item || item.status !== 'stored') return { ok: false, reason: 'Eser depoda değil' };
  return { ok: true, reason: null };
}

/** Sergilenen eserlerin kasaba refahına kalıcı katkısı. */
export function masterworkHappiness(state) {
  const count = exhibitedMasterworks(state).length;
  return Math.min(MASTERWORK.maxExhibitHappiness, count * MASTERWORK.exhibitHappiness);
}
