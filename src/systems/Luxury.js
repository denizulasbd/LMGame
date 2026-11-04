// Altın ekonomisinin saf hesapları (13. aşama): satın alınabilirlik durumları ve kalıcı etkiler. Hem sistemler
// (LuxurySystem, BehaviorSystem, MovementSystem, HarborSystem, HeatingSystem, HealthSystem, TownStatus) hem de
// arayüz bunları kullanır; yalnızca GameState'i okur. Kurallar src/data/luxury.js'te.
//
// Durum state.luxury'dedir (kayda girer):
//   { relics: { id: { day, hour, minute } }, silk: bool, decreeDays: { id: gün }, purchases, goldSpent }
import { LUXURY_GOODS, RELICS, RELIC_KEYS, RELIC_PRICES, GOLD_DECREES } from '../data/luxury.js';

const hasCompleted = (state, type) => state.buildings.some((b) => b.type === type && b.functional && !b.damaged);

/** Bu kaynakta (tüccar tezgâhta / liman kurulu) lüks mal satılıyor mu? { ok, reason } */
export function luxurySource(state, source) {
  if (source === 'merchant') {
    const m = state.events.merchant;
    return m.present && !m.leaving ? { ok: true } : { ok: false, reason: 'Gezgin tüccar tezgâhta değil' };
  }
  if (source === 'harbor') return hasCompleted(state, 'harbor') ? { ok: true } : { ok: false, reason: 'Önce Büyük Ticaret Limanı tamamlanmalı' };
  return { ok: false, reason: 'Bilinmeyen satıcı' };
}

/** Lüks malın durumu: { ok, reason, price, done } */
export function luxuryStatus(state, id, source) {
  const good = LUXURY_GOODS[id];
  if (!good) return { ok: false, reason: 'Bilinmeyen mal', price: 0 };
  const price = good.price;
  if (good.once && state.luxury?.silk) return { ok: false, reason: 'Kasabada zaten var', price, done: true };
  const from = luxurySource(state, source);
  if (!from.ok) return { ok: false, reason: from.reason, price };
  if (good.requires && !hasCompleted(state, good.requires.type)) return { ok: false, reason: good.requires.reason, price };
  if ((state.resources.gold ?? 0) < price) return { ok: false, reason: `Yetersiz altın (${state.resources.gold ?? 0}/${price})`, price };
  return { ok: true, reason: null, price };
}

export function hasRelic(state, id) {
  return Boolean(state.luxury?.relics?.[id]);
}

export function relicCount(state) {
  return RELIC_KEYS.filter((id) => hasRelic(state, id)).length;
}

/** Sıradaki yadigârın fiyatı (hepsi alındıysa null). */
export function relicPrice(state) {
  return RELIC_PRICES[relicCount(state)] ?? null;
}

/** Yadigârın durumu: { ok, reason, price, owned } */
export function relicStatus(state, id, source) {
  if (!RELICS[id]) return { ok: false, reason: 'Bilinmeyen yadigâr', price: 0 };
  if (hasRelic(state, id)) return { ok: false, reason: 'Belediye Konağı\'nda sergileniyor', price: 0, owned: true };
  const price = relicPrice(state);
  if (!hasCompleted(state, 'townHall')) return { ok: false, reason: 'Önce Belediye Konağı tamamlanmalı (yadigârlar orada sergilenir)', price };
  const from = luxurySource(state, source);
  if (!from.ok) return { ok: false, reason: from.reason, price };
  if ((state.resources.gold ?? 0) < price) return { ok: false, reason: `Yetersiz altın (${state.resources.gold ?? 0}/${price})`, price };
  return { ok: true, reason: null, price };
}

/** Altın fermanının durumu: { ok, reason, price, waitDays } */
export function goldDecreeStatus(state, id) {
  const decree = GOLD_DECREES[id];
  if (!decree) return { ok: false, reason: 'Bilinmeyen ferman', price: 0 };
  const price = decree.price;
  if (!hasCompleted(state, 'townHall')) return { ok: false, reason: 'Önce Belediye Konağı tamamlanmalı', price };
  const last = state.luxury?.decreeDays?.[id];
  if (last !== undefined && state.time.day - last < decree.cooldownDays) {
    const waitDays = decree.cooldownDays - (state.time.day - last);
    return { ok: false, reason: `${waitDays} gün sonra yeniden ilan edilebilir`, price, waitDays };
  }
  if ((state.resources.gold ?? 0) < price) return { ok: false, reason: `Yetersiz altın (${state.resources.gold ?? 0}/${price})`, price };
  return { ok: true, reason: null, price };
}

// ---------------------------------------------------------------------------
// Kalıcı ve geçici etkiler
// ---------------------------------------------------------------------------

/** Handa baharatlı yemek yiyen sakinin bonusu sürüyor mu? */
export function isSpiced(c, now) {
  return (c.buffs?.spiced ?? -1) > now;
}

export function spiceWorkMultiplier(c, now) {
  return isSpiced(c, now) ? LUXURY_GOODS.spiceCrate.personal.workSpeed : 1;
}

export function spiceWalkMultiplier(c, now) {
  return isSpiced(c, now) ? LUXURY_GOODS.spiceCrate.personal.walkSpeed : 1;
}

/** İpek ve mermerin kalıcı refah katkısı: Seviye 2 yapı başına (üst sınırlı). */
export function silkPrestige(state) {
  if (!state.luxury?.silk) return 0;
  const { perUpgraded, max } = LUXURY_GOODS.silkMarble.prestige;
  const upgraded = state.buildings.filter((b) => b.upgraded && b.functional).length;
  return Math.min(max, upgraded * perUpgraded);
}

const relicEffect = (state, id, field) => (hasRelic(state, id) ? RELICS[id].effect[field] : 1);

/** Üretim yapısında verim çarpanı: Güneş Saati Küresi (hepsi) × Bereket Boynuzu (yiyecek). */
export function relicProductionMultiplier(state, resource = null) {
  return relicEffect(state, 'sunSphere', 'production') * (resource === 'food' ? relicEffect(state, 'cornucopia', 'food') : 1);
}

export function relicXpMultiplier(state) {
  return relicEffect(state, 'guildSeal', 'xp');
}

export function relicExportCapacity(state) {
  return relicEffect(state, 'compass', 'exportCapacity');
}

export function relicExportValue(state) {
  return relicEffect(state, 'compass', 'exportValue');
}

export function relicHeatingMultiplier(state) {
  return relicEffect(state, 'eternalFlame', 'heating');
}

export function relicColdMultiplier(state) {
  return relicEffect(state, 'eternalFlame', 'cold');
}

/** Belediye Konağı'nın görselinde sergilenen yadigârlar: 5 bitlik maske (RELIC_KEYS sırasıyla). */
export function relicMask(state) {
  return RELIC_KEYS.reduce((mask, id, i) => (hasRelic(state, id) ? mask | (1 << i) : mask), 0);
}
