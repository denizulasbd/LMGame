// (29.6) Sadakatin saf hesapları: kapsam, kırpma, eşik kademesi, isyan / terk ediş sıralama anahtarı, vergi keyif çarpanı,
// gün dönümü kayması, elebaşı seçimi, dağıtımda aç sayılanlar. Durum değiştirmez, rastgelelik kullanmaz.
import { LOYALTY, DISCONTENT, PULSE_REASONS } from '../data/loyalty.js';
import { engineOn } from './Engines.js';
import { getMoodlet } from './Moodlets.js';

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

// ---------------------------------------------------------------------------------------------------------------------
// (30.3) Kararın Ağırlığı: beş kademe, kademe etkileri, iş bırakma uygunluğu, Halkın Nabzı ve kıtlık hesapları (saf).
const LEVEL_KEYS = DISCONTENT.levels.map((l) => l.key);

/** Beş kademeden biri: 'bitter' | 'grumbling' | 'calm' | 'pleased' | 'loyal'. Değer ya da sakin. */
export function loyaltyLevel(value) {
  const v = typeof value === 'object' ? loyaltyOf(value) : Number(value) || 0;
  for (const l of DISCONTENT.levels) if (v <= l.max) return l.key;
  return 'loyal';
}

/** Eşik olayının kademesi: şalter açıkken beş kademe, kapalıyken eski üçlü (Sadık / Kırgın / null). */
export function eventTier(value) {
  return engineOn('discontent') ? loyaltyLevel(value) : loyaltyTier(value);
}

/** Sakin kartındaki rozetin kademesi (Sakin'de ve kapsam dışında null). */
export function badgeTier(c) {
  if (!loyaltyScope(c)) return null;
  if (!engineOn('discontent')) return loyaltyTier(c);
  const k = loyaltyLevel(c);
  return k === 'calm' ? null : k;
}

/** Kademenin ruh hali çarpanları (recomputeMood'a katılır); şalter kapalıyken ya da kapsam dışında boş. */
export function levelEffects(c) {
  if (!engineOn('discontent') || !loyaltyScope(c)) return null;
  const key = loyaltyLevel(c);
  return DISCONTENT.levels[LEVEL_KEYS.indexOf(key)].effects;
}

/** Kırgın yetişkin: iş bırakmaya aday (rolsüz, seferde değil). */
export function isBitterAdult(c) {
  return loyaltyScope(c) && !c.away && !c.emigrating && loyaltyOf(c) <= DISCONTENT.levels[0].max;
}

/** İş bırakma saati mi (10:00-12:00)? */
export function strikeHour(hour) {
  return hour >= DISCONTENT.strike.hours[0] && hour < DISCONTENT.strike.hours[1];
}

/** İş bırakmaya uyan Kırgın yetişkinlerin kimlikleri (en az minBitter değilse boş). İsyan sürerken iş bırakma olmaz. */
export function strikerIds(state) {
  if (!engineOn('discontent') || state.trust?.revolt) return [];
  const ids = state.characters.filter(isBitterAdult).map((c) => c.id);
  return ids.length >= DISCONTENT.strike.minBitter ? ids : [];
}

/** Bu sakin şu an iş bırakmalı mı (saat, kademe, en az iki Kırgın; acil ihtiyaç / yaralı / hastada hayır)? */
export function shouldStrike(state, c, hour = state.time.hour) {
  if (!engineOn('discontent') || !strikeHour(hour) || !isBitterAdult(c) || c.isInjured || c.illness) return false;
  if (state.trust?.revolt) return false;
  let n = 0;
  for (const x of state.characters) if (isBitterAdult(x) && ++n >= DISCONTENT.strike.minBitter) return true;
  return false;
}

/** Nabız yüzü (yetişkinlerin ortalama sadakatinden). */
export function pulseFace(avg) {
  const t = DISCONTENT.faceAt;
  const v = Number(avg) || 0;
  if (v <= t.angry) return 'angry';
  if (v <= t.grumbling) return 'grumbling';
  if (v >= t.grateful) return 'grateful';
  if (v >= t.pleased) return 'pleased';
  return 'calm';
}

/** Yön oku: 'up' | 'flat' | 'down' (ortalamanın referansa göre değişimi). */
export function pulseDirection(now, ref) {
  if (!Number.isFinite(ref)) return 'flat';
  const d = (Number(now) || 0) - ref;
  if (d >= DISCONTENT.pulse.arrowAt) return 'up';
  if (d <= -DISCONTENT.pulse.arrowAt) return 'down';
  return 'flat';
}

/** Yetişkinlerin sadakat ortalaması ve kademe sayıları. */
export function pulseStats(state) {
  const counts = { bitter: 0, grumbling: 0, calm: 0, pleased: 0, loyal: 0 };
  let sum = 0;
  let n = 0;
  for (const c of state.characters) {
    if (!loyaltyScope(c)) continue;
    const v = loyaltyOf(c);
    sum += v;
    n++;
    counts[loyaltyLevel(v)]++;
  }
  return { avg: n ? sum / n : 0, n, counts };
}

/** LoyaltySystem.adjust nedenini Nabız nedenine çevirir (gün dönümü kayması ve test nedenleri null). */
export function reasonKey(reason) {
  const r = String(reason ?? '');
  if (!r || r === 'drift') return null;
  if (r.startsWith('tax:') || r.startsWith('taxDaily:')) {
    const k = `tax:${r.split(':')[1]}`;
    return PULSE_REASONS[k] ? k : 'other';
  }
  if (r === 'petition:rejected' || r === 'friend:rejected') return 'petitionRejected';
  if (r === 'petition:fulfilled' || r === 'friend:fulfilled') return 'petitionFulfilled';
  if (r === 'petition:expired') return 'petitionExpired';
  if (r === 'relief') return 'relief:food';
  return PULSE_REASONS[r] ? r : 'other';
}

/** Son `days` günün neden toplamları (en büyük mutlak değer önce): [{ key, name, points }]. */
export function topReasons(reasons, day, n = DISCONTENT.pulse.topReasons, days = DISCONTENT.pulse.dayWindow) {
  const totals = {};
  for (const r of reasons ?? []) {
    if (!(r.day > day - days && r.day <= day)) continue;
    for (const [k, v] of Object.entries(r.totals ?? {})) totals[k] = (totals[k] ?? 0) + v;
  }
  return Object.entries(totals)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]) || (a[0] < b[0] ? -1 : 1))
    .slice(0, n)
    .map(([key, points]) => ({ key, name: PULSE_REASONS[key] ?? PULSE_REASONS.other, points }));
}

/** "Ağır Vergi −84 · reddedilen dilekçe −30 · erzak dağıtımı +16" */
export function reasonsText(list) {
  return list.map((r) => `${r.name} ${r.points > 0 ? '+' : '−'}${Math.abs(r.points)}`).join(' · ');
}

/** Kayıttan gelen state.pulse (isteğe bağlı): bozuk alanlar atılır; yoksa boş. */
export function restorePulse(data) {
  const out = { daily: [], reasons: [] };
  if (!data || typeof data !== 'object') return out;
  if (Array.isArray(data.daily)) out.daily = data.daily.map(Number).filter(Number.isFinite).slice(-DISCONTENT.pulse.dailyKeep);
  if (Array.isArray(data.reasons)) {
    for (const r of data.reasons) {
      if (!r || !Number.isFinite(r.day) || typeof r.totals !== 'object' || !r.totals) continue;
      const totals = {};
      for (const [k, v] of Object.entries(r.totals)) if (PULSE_REASONS[k] && Number.isFinite(v)) totals[k] = Math.round(v);
      out.reasons.push({ day: Math.round(r.day), totals });
    }
    out.reasons = out.reasons.slice(-DISCONTENT.pulse.dayWindow);
  }
  if (Array.isArray(data.eaten)) out.eaten = data.eaten.map(Number).filter((v) => Number.isFinite(v) && v >= 0).slice(-DISCONTENT.famine.windowDays);
  return out;
}

/** Kiler kaç gün yeter: stok ÷ günlük tüketim (son 2 günün ortalaması). Tüketim kaydı yoksa tahmin yok (Infinity). */
export function foodDaysLeft(supply, eaten) {
  const list = (eaten ?? []).filter((v) => Number.isFinite(v) && v > 0);
  if (!list.length) return Infinity;
  const perDay = list.reduce((a, b) => a + b, 0) / list.length;
  return Math.max(0, supply) / perDay;
}

/** Gün dönümünde "Açlıktan Gözü Dönmüş" olan sakin. */
export function isHangry(c) {
  return Boolean(getMoodlet(c, 'hangry'));
}
