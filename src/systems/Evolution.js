// (29.4) Kalıcı kişilik evriminin SAF hesapları. Sayılar src/data/evolution.js'te; olaylar ve durum değişiklikleri
// src/systems/EvolutionSystem.js'te. Buradaki hiçbir işlev durumu değiştirmez ve dışarıdan üreteç almaz: evrim hiç zar çekmez.
//
//   axisOf(trait)                       : { index, sign } (+1 artı kutup, -1 eksi kutup) ya da null (Obur, Gece Kuşu, bilinmeyen)
//   evolves(c)                          : eksen biriktirebilen sakin (çocuk ve ziyaretçi değil)
//   contribution(c, i, amount, opts)    : stageMul, (30.4a) kıtlık çarpanı, dailyCap ve ±clamp uygulanmış, kırpılmış tam sayı katkı
//   scarcityMul(pay) / traitShares(state) : (30.4a) kişilik çeşitliliği çarpanı ve yetişkinler arasında özellik payları
//   pendingShift(c, day)                : uygulanacak { kind, axis, from, to } ya da null (bekleme, ömür, edinim sınırı, eksen sırası)
//   applyShift(c, shift)                : { traits, deepTraits } (yeni diziler; yerinde değiştirmez)
//   hintOf(c)                           : { axis, sign, text } ya da null (panel eğilim ipucu)
//   evolutionKey(c)                     : panelin yeniden kurulup kurulmayacağını belirleyen kısa anahtar
//   sanitize* / emptyEvolutionStats / restoreEvolutionStats / migrateEvolution : kayıt
import { TRAITS, OPPOSING_TRAITS } from '../data/characters.js';
import { EVOLUTION_AXES, AXIS_COUNT, EVOLUTION_KINDS, EVOLUTION_RULES, DEEP_TRAITS, CAUSE_TEXT, HINT_TEXT } from '../data/evolution.js';

const AXIS_OF = {};
EVOLUTION_AXES.forEach((a, index) => {
  AXIS_OF[a.plus] = { index, sign: 1 };
  AXIS_OF[a.minus] = { index, sign: -1 };
});

export function axisOf(trait) {
  const hit = AXIS_OF[trait];
  return hit ? { ...hit } : null;
}

/** Eksenin yön kutbu ve zıt kutbu: sign +1 -> artı kutup yönünde. */
export function poles(axisIndex, sign) {
  const a = EVOLUTION_AXES[axisIndex];
  return sign > 0 ? { target: a.plus, opposite: a.minus } : { target: a.minus, opposite: a.plus };
}

/** Eksen tablosunun OPPOSING_TRAITS ile tutarlılığı (testler için). */
export function axesMatchOpposing() {
  return (
    EVOLUTION_AXES.length === OPPOSING_TRAITS.length &&
    EVOLUTION_AXES.every((a) => OPPOSING_TRAITS.some((p) => p.includes(a.plus) && p.includes(a.minus))) &&
    OPPOSING_TRAITS.every((p) => EVOLUTION_AXES.some((a) => p.includes(a.plus) && p.includes(a.minus)))
  );
}

/** Eksen biriktirebilen sakin: kasabalı yetişkin (çocukta eksenler 0'da durur; çocuk mizacı 25.3'ündür). */
export function evolves(c) {
  return Boolean(c) && !c.role && !c.isChild;
}

const sgn = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
/** .5'ler sıfırdan uzağa yuvarlanır (artı ve eksi katkı simetrik). */
const roundAway = (n) => sgn(n) * Math.round(Math.abs(n));

export function stageMul(c) {
  return EVOLUTION_RULES.stageMul[c?.lifeStage] ?? 1;
}

/** (30.4a) Kıtlık çarpanı: clamp(base - slope x pay, min, max). Pay geçersizse 0 sayılır. */
export function scarcityMul(share) {
  const S = EVOLUTION_RULES.scarcity;
  const p = Number.isFinite(share) ? Math.max(0, Math.min(1, share)) : 0;
  return Math.max(S.min, Math.min(S.max, S.base - S.slope * p));
}

/** (30.4a) Yetişkinler (kasabalı, çocuk değil) arasında her özelliğin payı { özellik: 0..1 }; yetişkin yoksa boş. */
export function traitShares(state) {
  const adults = (state?.characters ?? []).filter((c) => evolves(c));
  const out = {};
  if (!adults.length) return out;
  for (const c of adults) for (const t of new Set(c.traits ?? [])) out[t] = (out[t] ?? 0) + 1;
  for (const t of Object.keys(out)) out[t] /= adults.length;
  return out;
}

/**
 * Bir katkının eksene gerçekte işleyecek miktarı: evre çarpanı, (30.4a) kıtlık çarpanı, yuvarlama, (gün dönümü katkısı değilse) günlük
 * sınır ve ±clamp.
 * @param {{ daily?: boolean, shares?: object|null }} opts daily: gün dönümü katkısı (dailyCap'e takılmaz; growthToday zaten sıfırlanır);
 *   shares: özellik payları (traitShares; verilmezse çarpan 1): katkının yöneldiği kutbun payına göre scarcityMul
 */
export function contribution(c, axisIndex, amount, { daily = false, shares = null } = {}) {
  if (!evolves(c) || !(axisIndex >= 0 && axisIndex < AXIS_COUNT) || !Number.isFinite(amount)) return 0;
  const R = EVOLUTION_RULES;
  const scarcity = shares && amount !== 0 ? scarcityMul(shares[poles(axisIndex, sgn(amount)).target] ?? 0) : 1;
  let v = roundAway(amount * stageMul(c) * scarcity);
  if (v === 0) return 0;
  if (!daily) {
    const today = c.growthToday?.[axisIndex] ?? 0;
    v = clampInt(today + v, -R.dailyCap, R.dailyCap) - today;
  }
  const now = c.growth?.[axisIndex] ?? 0;
  return clampInt(now + v, -R.clamp, R.clamp) - now;
}

/**
 * Bu sabah uygulanacak değişim ({ kind, axis, from, to }) ya da null.
 * Sınırlar: kapsam, ömür boyu sayısı, bekleme süresi; eksenler 0 -> 3 sırasıyla denetlenir, eşiği aşan ilk uygulanabilir eksen kazanır.
 * Sakinde yön kutbu varsa derinleşme (shiftAt); yalnızca zıt kutup varsa dönüşüm (turnAt); ikisi de yoksa edinim (shiftAt).
 * (Eski kayıtlarda iki zıt özellik birlikte olabilir: yön kutbu varsa dönüşüm aranmaz, özellik iki kez yazılmaz.)
 */
export function pendingShift(c, day) {
  if (!evolves(c)) return null;
  const R = EVOLUTION_RULES;
  if ((c.evolutionCount ?? 0) >= R.lifetimeMax) return null;
  const last = c.evolutions?.[c.evolutions.length - 1];
  if (last && Number.isFinite(day) && day - last.day < R.cooldownDays) return null;
  const traits = c.traits ?? [];
  for (let axis = 0; axis < AXIS_COUNT; axis++) {
    const value = c.growth?.[axis] ?? 0;
    const mag = Math.abs(value);
    if (mag < R.shiftAt) continue;
    const { target, opposite } = poles(axis, sgn(value));
    if (traits.includes(target)) {
      if (!(c.deepTraits ?? []).includes(target) && DEEP_TRAITS[target]) return { kind: 'deepened', axis, from: null, to: target };
    } else if (traits.includes(opposite)) {
      if (mag >= R.turnAt) return { kind: 'turned', axis, from: opposite, to: target };
    } else if (traits.length < R.maxTraits && (c.acquiredCount ?? 0) < R.acquiredMax) {
      return { kind: 'acquired', axis, from: null, to: target };
    }
  }
  return null;
}

/** Değişimin sonucu: yeni özellik ve derin özellik dizileri (yerinde değiştirmez; dönüşen derin özellik düşer). */
export function applyShift(c, shift) {
  const traits = c.traits ?? [];
  const deep = c.deepTraits ?? [];
  if (shift.kind === 'turned') {
    return { traits: traits.map((t) => (t === shift.from ? shift.to : t)), deepTraits: deep.filter((t) => t !== shift.from) };
  }
  if (shift.kind === 'deepened') return { traits: [...traits], deepTraits: [...deep, shift.to] };
  return { traits: [...traits, shift.to], deepTraits: [...deep] };
}

/** Panel ipucu: en büyük mutlak değerli eksen hintAt'i geçtiyse; eşitlikte küçük indeks. */
export function hintOf(c) {
  if (!evolves(c) || !Array.isArray(c.growth)) return null;
  let best = -1;
  let mag = 0;
  for (let i = 0; i < AXIS_COUNT; i++) {
    const m = Math.abs(c.growth[i] ?? 0);
    if (m > mag) {
      mag = m;
      best = i;
    }
  }
  if (best < 0 || mag < EVOLUTION_RULES.hintAt) return null;
  const sign = sgn(c.growth[best]);
  return { axis: best, sign, text: HINT_TEXT[EVOLUTION_AXES[best].key][sign > 0 ? 'plus' : 'minus'] };
}

/** Panel anahtarı: özellikler, derin özellikler, evrim kaydı ve ipucu değişince değişir (her karede DOM kurulmaz). */
export function evolutionKey(c) {
  const h = hintOf(c);
  return `${(c.traits ?? []).join(',')}|${(c.deepTraits ?? []).join(',')}|${c.evolutionCount ?? 0}:${c.evolutions?.length ?? 0}|${h ? h.text : ''}`;
}

/** Bir özelliğin görünen adı (derinse derin ad). */
export function traitDisplayName(c, key) {
  if ((c.deepTraits ?? []).includes(key) && DEEP_TRAITS[key]) return DEEP_TRAITS[key].name;
  return TRAITS[key]?.name ?? key;
}

// ---------------------------------------------------------------------------------------------------------------------
// Kayıt

const fixedArray = (data, fill, map) => {
  const out = [];
  for (let i = 0; i < AXIS_COUNT; i++) out.push(map(Array.isArray(data) ? data[i] : undefined, i));
  return out;
};

/** Eksen değerleri: 4 tam sayı, -clamp..clamp (uzunluk 4'e kırpılır / sıfırla tamamlanır; bozuk değer 0). */
export function sanitizeGrowth(data) {
  const lim = EVOLUTION_RULES.clamp;
  return fixedArray(data, 0, (v) => (Number.isFinite(v) ? clampInt(Math.round(v), -lim, lim) : 0));
}

/** Bugünkü net değişim: -dailyCap..dailyCap. */
export function sanitizeGrowthToday(data) {
  const lim = EVOLUTION_RULES.dailyCap;
  return fixedArray(data, 0, (v) => (Number.isFinite(v) ? clampInt(Math.round(v), -lim, lim) : 0));
}

/** Eksen başına neden anahtarı: bilinen kaynak anahtarı ya da null. */
export function sanitizeGrowthCause(data) {
  return fixedArray(data, null, (v) => (typeof v === 'string' && CAUSE_TEXT[v] !== undefined ? v : null));
}

/** Derin özellikler: bilinen, `traits` içinde bulunan, tekrarsız anahtarlar (traits sırasıyla değil, kayıt sırasıyla). */
export function sanitizeDeepTraits(traits, data) {
  const out = [];
  if (!Array.isArray(data) || !Array.isArray(traits)) return out;
  for (const key of data) if (typeof key === 'string' && DEEP_TRAITS[key] && traits.includes(key) && !out.includes(key)) out.push(key);
  return out;
}

/** Evrim kaydı: { day, kind, axis, from, to, cause }; bozuk kayıt atılır, en son logMax tutulur. */
export function sanitizeEvolutions(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    if (!EVOLUTION_KINDS.includes(raw.kind) || !Number.isInteger(raw.axis) || raw.axis < 0 || raw.axis >= AXIS_COUNT || !Number.isFinite(raw.day)) continue;
    if (typeof raw.to !== 'string' || !TRAITS[raw.to]) continue;
    const from = raw.kind === 'turned' ? (typeof raw.from === 'string' && TRAITS[raw.from] ? raw.from : null) : null;
    if (raw.kind === 'turned' && from === null) continue;
    out.push({ day: Math.floor(raw.day), kind: raw.kind, axis: raw.axis, from, to: raw.to, cause: typeof raw.cause === 'string' && CAUSE_TEXT[raw.cause] !== undefined ? raw.cause : null });
  }
  return out.slice(-EVOLUTION_RULES.logMax);
}

export function sanitizeEvoCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

const STAT_GROUPS = ['turned', 'deepened', 'acquired'];

export function emptyEvolutionStats() {
  return { turned: {}, deepened: {}, acquired: {}, total: 0 };
}

export function restoreEvolutionStats(data) {
  const out = emptyEvolutionStats();
  if (!data || typeof data !== 'object') return out;
  for (const group of STAT_GROUPS) {
    const src = data[group];
    if (!src || typeof src !== 'object') continue;
    for (const key of Object.keys(src)) {
      const n = TRAITS[key] ? Math.floor(Number(src[key]) || 0) : 0;
      if (n > 0) out[group][key] = n;
    }
  }
  out.total = sanitizeEvoCount(data.total);
  return out;
}

/** (v38 -> v39) Her sakine sıfır eksenler, boş listeler ve sayaçlar; duruma boş sayaçlar. Düz veriyle çalışır, zar çekmez, özellik değiştirmez. */
export function migrateEvolution(data) {
  if (Array.isArray(data?.characters)) {
    for (const c of data.characters) {
      if (!c || typeof c !== 'object') continue;
      c.growth = [0, 0, 0, 0];
      c.growthToday = [0, 0, 0, 0];
      c.growthCause = [null, null, null, null];
      c.deepTraits = [];
      c.evolutions = [];
      c.evolutionCount = 0;
      c.acquiredCount = 0;
    }
  }
  data.evolution = emptyEvolutionStats();
  return data;
}
