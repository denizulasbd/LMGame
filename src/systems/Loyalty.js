// (29.6) Sadakatin saf hesapları: kapsam, kırpma, eşik kademesi, isyan / terk ediş sıralama anahtarı, vergi keyif çarpanı,
// gün dönümü kayması, elebaşı seçimi, dağıtımda aç sayılanlar. Durum değiştirmez, rastgelelik kullanmaz.
import { LOYALTY } from '../data/loyalty.js';

/** Sadakat hesabına giren sakin: rolü olmayan yetişkin. */
export function loyaltyScope(c) {
  return Boolean(c) && !c.role && !c.isChild;
}

/** Tam sayıya yuvarlar ve -100..+100'e kırpar (bozuk değer 0). */
export function clampLoyalty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-LOYALTY.clamp, Math.min(LOYALTY.clamp, Math.round(n)));
}

export function loyaltyOf(c) {
  return Number.isFinite(c?.loyalty) ? c.loyalty : 0;
}

/** 'loyal' | 'bitter' | null (eşik dışında). */
export function loyaltyTier(value) {
  const v = typeof value === 'object' ? loyaltyOf(value) : Number(value) || 0;
  if (v >= LOYALTY.loyalAt) return 'loyal';
  if (v <= LOYALTY.bitterAt) return 'bitter';
  return null;
}

/** Gün dönümünde 0'a doğru kayma. */
export function driftLoyalty(value, step = LOYALTY.driftPerDay) {
  const v = clampLoyalty(value);
  if (v > 0) return Math.max(0, v - step);
  if (v < 0) return Math.min(0, v + step);
  return 0;
}

/** İsyan / terk ediş sıralama anahtarı: mutluluk + sadakat x riotWeight (küçük olan önce). */
export function unrestKey(happiness, c) {
  return happiness + loyaltyOf(c) * LOYALTY.riotWeight;
}

/** Ağır verginin (eksi) keyif etkisinin çarpanı: Sadık x0,5, Kırgın x2, diğerleri x1. */
export function taxJoyMul(c) {
  const tier = loyaltyScope(c) ? loyaltyTier(c) : null;
  return tier ? LOYALTY.taxJoy[tier] : 1;
}

/** Elebaşı: en düşük sadakatli isyancı (eşitlikte küçük kimlik). ids: isyancı kimlikleri. */
export function pickLeader(state, ids) {
  let best = null;
  for (const id of ids ?? []) {
    const c = state.characters.find((x) => x.id === id);
    if (!c) continue;
    const v = loyaltyOf(c);
    if (!best || v < best.v || (v === best.v && c.id < best.c.id)) best = { c, v };
  }
  return best ? best.c.id : null;
}

/** Kayıttaki sakin sadakati (kapsam dışında 0). */
export function sanitizeLoyalty(value, child = false) {
  return child ? 0 : clampLoyalty(value);
}

/** TrustSystem.relief: dağıtımdan hemen önce aç sayılan sakinlerin kimlikleri. */
export function hungryNow(state) {
  return state.characters.filter((c) => !c.role && c.needs.hunger < LOYALTY.hungryBelow).map((c) => c.id);
}
