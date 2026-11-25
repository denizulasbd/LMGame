// (32.3) Kasaba Şöhreti: SAF hesaplar (durum yazmaz, zar çekmez). Sayılar data/renown.js, durum systems/RenownSystem.js.
//   renownTarget(state)      : itibarın gün dönümünde kaydığı hedef ve katkıları
//   renownStep(rep, target)  : bir günlük kayma
//   renownLevels / renownLevelOf : kademeler (şalter kapalıyken REPUTATION.levels'in üç kademesi aynen)
//   royal*                   : Kraliyet Lütfu yapılarının kilidi ve etkileri (Şüpheli'de yarıya iner)
// (32.6a) TownStatus / Justice / RelationshipSystem / ResearchSystem kademe ve lütuf çarpanlarını RoyalEffects.js'ten alır (döngüsüz).
import { RENOWN_DRIFT, RENOWN_TARGET as T, RENOWN_PART_LABELS, RENOWN_RANK, RENOWN_EFFECTS, RENOWN_GRANT, ROYAL_TYPES } from '../data/renown.js';
import { JUSTICE } from '../data/justice.js';
import { engineOn } from './Engines.js';
// (32.6a) kademe ve lütuf etkisi işlevleri döngü yaratmasın diye RoyalEffects.js'te (TownStatus / Justice / RelationshipSystem oradan alır)
import { renownLevels, renownRank, renownLevelOf, rankOf, royalGranted, royalWeakened, renownCrimeFactor, renownRomanceFactor, renownResearchFactor, renownHappiness } from './RoyalEffects.js';
export { renownLevels, renownRank, renownLevelOf, rankOf, royalGranted, royalWeakened, renownCrimeFactor, renownRomanceFactor, renownResearchFactor, renownHappiness };
import { crimeRate, solvedRatio, justiceRecord, trustOf } from './Justice.js';
import { trustWelfare } from './TrustSystem.js';
import { pulseStats } from './Loyalty.js';
import { isGoldenAge } from './GoldenAge.js';
import { SKILL_LEVELS } from '../data/skills.js';
import { renownEducationShare } from './University.js'; // (32.4)
import { renownClubShare } from './Clubs.js'; // (32.5)

const clampTo = (v, min, max) => Math.max(min, Math.min(max, v));
const round1 = (v) => Math.round(v * 10) / 10;

export function emptyRenown() {
  return { reasons: [], daily: [], gozdeStreak: 0, grants: [], lastGrantDay: null, rank: null, tiers: [], drift: null };
}

/** Kayıttan gelen state.renown (isteğe bağlı): bozuk alanlar atılır. */
export function restoreRenown(data) {
  if (!data || typeof data !== 'object') return null;
  const out = emptyRenown();
  const NUM = (v) => (Number.isFinite(v) ? v : null);
  out.reasons = (Array.isArray(data.reasons) ? data.reasons : []).filter((r) => r && RENOWN_PART_LABELS[r.key] && Number.isFinite(r.value)).slice(0, RENOWN_DRIFT.reasonsKept).map((r) => ({ key: r.key, label: String(r.label ?? ''), value: r.value }));
  out.daily = (Array.isArray(data.daily) ? data.daily : []).filter((d) => d && Number.isFinite(d.day) && d.parts && typeof d.parts === 'object').slice(-RENOWN_DRIFT.reasonDays).map((d) => ({ day: d.day, parts: Object.fromEntries(Object.entries(d.parts).filter(([k, v]) => RENOWN_PART_LABELS[k] && Number.isFinite(v))) }));
  out.gozdeStreak = Math.max(0, Math.floor(NUM(data.gozdeStreak) ?? 0));
  const seen = new Set();
  out.grants = (Array.isArray(data.grants) ? data.grants : []).filter((g) => g && ROYAL_TYPES.includes(g.key) && Number.isFinite(g.day) && !seen.has(g.key) && seen.add(g.key)).map((g) => ({ key: g.key, day: g.day }));
  out.lastGrantDay = NUM(data.lastGrantDay);
  out.rank = Number.isFinite(data.rank) ? clampTo(Math.floor(data.rank), 0, 3) : null;
  out.tiers = (Array.isArray(data.tiers) ? data.tiers : []).filter((t) => t && Number.isFinite(t.day) && RENOWN_RANK[t.key] !== undefined).slice(-12).map((t) => ({ day: t.day, key: t.key, up: Boolean(t.up) }));
  out.drift = data.drift && Number.isFinite(data.drift.target) ? { day: NUM(data.drift.day), from: NUM(data.drift.from), to: NUM(data.drift.to), target: data.drift.target } : null;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------- kademeler

// ---------------------------------------------------------------------------------------------------------------------- hedef

/**
 * (32.4) Eğitim payı: 0-1. Yetişkinler içinde Darülfünun mezunu payı + 0,3 × yalnızca Bilgelik Evi mezunu payı (ikincisi
 * ENGINES.educationMerit'e bağlı; beklenen 0-0,6). Ağırlık RENOWN_TARGET.education (6). Şalter university kapalıyken 0.
 */
export function renownEducation(state) {
  return renownEducationShare(state);
}

/**
 * (32.5) Kulüp payı: 0-1 = (etkin üye / yetişkin + Kıdemli Bilge) × canlılık (son buluşma günlerinin gerçekleşme oranı); beklenen
 * 0-0,7. Ağırlık RENOWN_TARGET.clubs (5). Şalter kapalıyken ya da kulüp yokken 0 (systems/Clubs.js → renownClubShare).
 */
export function renownClubs(state) {
  return renownClubShare(state);
}

/** Son `days` günde suç işlendi mi (çözülen oranı yalnızca o zaman sayılır). */
function recentCrimes(state, days = JUSTICE.rateDays) {
  const j = state.justice;
  if (!j) return 0;
  const from = state.time.day - days;
  return [...j.cases, ...j.log].filter((k) => k.day > from).length;
}

/** Adalet sicili katkıları (yalnızca Adalet Sarayı kararları): { justice, cruel, impunity, stale } — karar yoksa hepsi 0. */
export function justiceParts(state, { exclude = null } = {}) {
  const st = exclude && state.justice ? { ...state, justice: { ...state.justice, log: state.justice.log.filter((k) => k.id !== exclude) } } : state;
  const r = justiceRecord(st);
  const J = T.justice;
  const out = { justice: 0, cruel: 0, impunity: 0, stale: 0 };
  if (r.verdicts > 0) {
    out.justice = round1((r.fairRatio - J.fairPivot) * J.fairScale);
    out.cruel = Math.max(J.cruelMin, r.cruel * J.cruelEach);
  }
  out.impunity = round1(Math.max(J.impunityMin, r.impunity * J.impunityEach));
  out.stale = Math.max(J.staleMin, r.stale * J.staleEach);
  return out;
}

/**
 * Hedef itibar: { target: 0-100, parts: [{ key, label, value }] } (parts: sıfır olmayan katkılar, büyük mutlak değer önce).
 * Taban + suç oranı + çözülen + adalet sicili + güven + refah + Nabız + eğitim + kulüp + seviye + Altın Çağ.
 */
export function renownTarget(state) {
  const v = {};
  v.crime = round1(clampTo((T.crime.pivot - crimeRate(state)) * T.crime.scale, T.crime.min, T.crime.max));
  v.solved = recentCrimes(state) > 0 ? round1(clampTo((solvedRatio(state) - T.solved.pivot) * T.solved.scale, T.solved.min, T.solved.max)) : 0;
  Object.assign(v, justiceParts(state));
  v.trust = round1(clampTo((trustOf(state) - T.trust.pivot) * T.trust.scale, T.trust.min, T.trust.max));
  v.welfare = round1(clampTo((trustWelfare(state) - T.welfare.pivot) * T.welfare.scale, T.welfare.min, T.welfare.max));
  const p = pulseStats(state);
  v.pulse = p.n ? round1(Math.max(T.pulse.min, ((p.counts.grumbling + T.pulse.bitterWeight * p.counts.bitter) / p.n) * T.pulse.scale)) : 0;
  v.education = round1(clampTo(renownEducation(state), 0, 1) * T.education.weight);
  v.clubs = round1(clampTo(renownClubs(state), 0, 1) * T.clubs.weight);
  v.tier = T.tier[Math.max(0, Math.min(T.tier.length - 1, state.town?.tier ?? 1))] ?? 0;
  v.goldenAge = isGoldenAge(state) ? T.goldenAge : 0;
  const sum = Object.values(v).reduce((a, b) => a + b, 0);
  const parts = Object.entries(v)
    .filter(([, x]) => x !== 0)
    .map(([key, value]) => ({ key, label: partLabel(key, value), value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || (a.key < b.key ? -1 : 1));
  return { target: round1(clampTo(T.base + sum, 0, 100)), parts, values: v };
}

export function partLabel(key, value) {
  const l = RENOWN_PART_LABELS[key];
  return l ? (value >= 0 ? l.up : l.down) : key;
}

/** Bir günlük kayma: boşluğun RENOWN_DRIFT.share'i, en çok ±maxStep (0,1'e yuvarlanır). */
export function renownStep(rep, target) {
  const raw = clampTo((target - rep) * RENOWN_DRIFT.share, -RENOWN_DRIFT.maxStep, RENOWN_DRIFT.maxStep);
  return Math.round(raw * 10) / 10;
}

/** Son günlerin katkılarının ortalamasından en büyük `n` neden: [{ key, label, value }]. */
export function topRenownReasons(daily, n = RENOWN_DRIFT.reasonsKept) {
  if (!daily?.length) return [];
  const sum = {};
  for (const d of daily) for (const [k, x] of Object.entries(d.parts ?? {})) sum[k] = (sum[k] ?? 0) + x;
  return Object.entries(sum)
    .map(([key, x]) => ({ key, value: Math.round(x / daily.length) }))
    .filter((r) => r.value !== 0 && r.key !== 'tier')
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || (a.key < b.key ? -1 : 1))
    .slice(0, n)
    .map((r) => ({ ...r, label: partLabel(r.key, r.value) }));
}

/** "Suç oranı düşük +5 · Zalim karar −8 · Güven yüksek +4" */
export function renownReasonsText(list) {
  return (list ?? []).map((r) => `${r.label} ${r.value > 0 ? '+' : '−'}${Math.abs(Math.round(r.value))}`).join(' · ');
}

/**
 * (CaseModal) Bu kararın yarından itibaren hedefe etkisi (tam sayı, 0 ya da eksi): kararın olduğu ve olmadığı adalet sicili farkı.
 */
export function verdictRenownImpact(state, k) {
  if (!engineOn('renown') || !k) return 0;
  const sum = (p) => p.justice + p.cruel + p.impunity + p.stale;
  return Math.round(sum(justiceParts(state)) - sum(justiceParts(state, { exclude: k.id })));
}

// ---------------------------------------------------------------------------------------------------------------------- göç

/** Saygın ve üstünde göçmenin Kalfa geleceği meslek (kimlikten türer, zar yok). */
export function immigrantSkillFor(c) {
  const list = RENOWN_EFFECTS.skilledImmigrant.skills;
  const id = Number(c?.id) || 0;
  return list[((id % list.length) + list.length) % list.length];
}
export const KALFA_XP = () => SKILL_LEVELS[1].xp;

// ---------------------------------------------------------------------------------------------------------------------- Kraliyet Lütfu

/** Kilidin genel koşulu: Kasaba seviyesi ve (Gelişmiş Şehir ya da Altın Çağ). */
export function grantTownReady(state) {
  const tier = state.town?.tier ?? 1;
  return tier >= RENOWN_GRANT.minTier && (tier >= RENOWN_GRANT.cityTier || isGoldenAge(state));
}

/** Bu gün dönümünde lütuf zarı atılabilir mi (zar dışı koşullar). */
export function grantEligible(state, day = state.time.day) {
  const r = state.renown;
  if (!engineOn('renown') || !r || !grantTownReady(state)) return false;
  if (r.gozdeStreak < RENOWN_GRANT.streakDays) return false;
  if (Number.isFinite(r.lastGrantDay) && day - r.lastGrantDay < RENOWN_GRANT.gapDays) return false;
  return ROYAL_TYPES.some((t) => !royalGranted(state, t));
}
