// (29.2) Dinamik ruh hallerinin (moodlet) SAF hesapları. Sayılar src/data/moodlets.js'te; olaylar ve davranış
// src/systems/MoodletSystem.js'te. Buradaki hiçbir işlev rastgelelik kullanmaz ve düz kayıt nesneleriyle de çalışır.
//
//   addMoodlet(c, key, now, opts)  : ekler / tazeler (katman tavanı ve öncelik kurallarıyla); eklenen kayıt ya da null
//   removeMoodlet / expireMoodlets : siler / süresi dolanları siler
//   recomputeMood(c)               : c.mood'u (toplam çarpanlar, davranış bayrakları, baskın ruh hali) YERİNDE günceller.
//                                    c.mood her sakinde tek bir nesnedir; sıcak yollar (hareket, ihtiyaç, iş) yalnızca okur,
//                                    hiçbir adımda tahsisat yapılmaz. mood.version her değişiklikte artar (arayüz bununla yenilenir).
//   traumaOf(c)                    : teselli edilebilir, henüz teselli edilmemiş travma (yas, sarsıntı, kalp kırıklığı) ya da null
//   soothe(c, now, by)             : teselli: travmanın kalan süresi %40 kısalır, "Yüreği Ferahladı" eklenir
//   effectText(m) / remainingHours : kart metinleri
//   (30.3) recomputeMood sadakat kademesinin (Loyalty.levelEffects) çarpanlarını da katar (şalter: ENGINES.discontent)
//   (29.3) recomputeMood yaşam doyumu kademesinin (Wants.satisfactionTier) etkilerini de katar: mood.satisfaction = kademe anahtarı
import { MOODLETS, MOODLET_CAPS, MOOD_LIMITS, TIER_SCALE, NEUTRAL_FEEL, DOMINANT_THRESHOLD, MOOD_RULES, CONSOLE, MOOD_REASONS } from '../data/moodlets.js';
import { satisfactionTier } from './Wants.js';
import { levelEffects } from './Loyalty.js';

/**
 * Motorun ana şalteri. Oyunda hep açıktır. Hedefli testler (tools/sim/tests.mjs) eski aşamaların kesin sayılı kurallarını
 * ruh hali katmanından YALITMAK için kapatır (kapalıyken hiçbir moodlet eklenmez); 29.2 testleri, denetim, geriye uyumluluk,
 * stres matrisi ve otopilot açık motorla koşar.
 */
export const MOOD_ENGINE = { enabled: true };

const MUL_KEYS = ['workMul', 'moveMul', 'joyRateMul', 'socialMul', 'xpMul', 'energyMul', 'quarrelMul', 'scareMul'];
const EFFECT_NAMES = { workMul: 'İş', moveMul: 'Yürüme', joyRateMul: 'Keyif düşüşü', socialMul: 'Sohbet kazancı', xpMul: 'Deneyim', energyMul: 'Enerji kaybı', quarrelMul: 'Atışma', scareMul: 'Gece ürkme' };

export function neutralMood() {
  return { workMul: 1, moveMul: 1, joyRateMul: 1, socialMul: 1, xpMul: 1, energyMul: 1, quarrelMul: 1, scareMul: 1, masterwork: 0, shirk: false, focus: false, seek: false, grief: false, feel: NEUTRAL_FEEL, tone: 'neutral', net: 0, satisfaction: 'content', version: 0 };
}

export function emptyMoodletStats() {
  return { given: {}, consoled: 0, grieved: 0, mourners: 0 };
}

export function restoreMoodletStats(data) {
  const out = emptyMoodletStats();
  if (!data || typeof data !== 'object') return out;
  // kayıttaki sıra korunur (kayıt -> yükleme birebir aynı metni üretsin); bilinmeyen anahtarlar atılır
  for (const key of Object.keys(data.given ?? {})) {
    const n = MOODLETS[key] ? Math.floor(Number(data.given[key]) || 0) : 0;
    if (n > 0) out.given[key] = n;
  }
  for (const key of ['consoled', 'grieved', 'mourners']) out[key] = Math.max(0, Math.floor(Number(data[key]) || 0));
  return out;
}

/** Kayıttan gelen moodlet listesini temizler (bilinmeyen anahtar, bozuk kademe / süre atılır; katman tavanları uygulanır). */
export function sanitizeMoodlets(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  const counts = { core: 0, action: 0, need: 0 };
  for (const raw of data) {
    const def = MOODLETS[raw?.key];
    if (!def || out.some((m) => m.key === raw.key)) continue;
    if (counts[def.layer] >= MOODLET_CAPS[def.layer]) continue;
    const until = raw.until === null || raw.until === undefined ? null : Number.isFinite(raw.until) ? Math.round(raw.until) : NaN;
    if (Number.isNaN(until) || (until === null && def.hours !== null)) continue;
    counts[def.layer]++;
    const m = { key: raw.key, tier: TIER_SCALE[raw.tier] ? raw.tier : 'minor', since: Number.isFinite(raw.since) ? Math.round(raw.since) : 0, until, reason: MOOD_REASONS[raw.reason] ? raw.reason : null };
    if (Number.isFinite(raw.whoId)) m.whoId = raw.whoId;
    if (typeof raw.whoName === 'string') m.whoName = raw.whoName.slice(0, 32);
    if (raw.harsh) m.harsh = true;
    out.push(m);
  }
  return out;
}

export function getMoodlet(c, key) {
  const list = c?.moodlets;
  if (!list) return null;
  for (let i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
  return null;
}

export function hasMoodlet(c, key) {
  return getMoodlet(c, key) !== null;
}

const TIER_ORDER = ['minor', 'major', 'critical'];

/**
 * Moodlet ekler ya da tazeler. Aynı moodlet varsa süresi uzar, kademesi yükselebilir (düşmez). Katman doluysa en düşük
 * öncelikli olan (eşitlikte en eskisi) çıkar; yeni gelen ondan düşük öncelikliyse EKLENMEZ (null).
 * @param {{ tier?: string, reason?: string, whoId?: number, whoName?: string, harsh?: boolean, hours?: number }} opts
 * @returns {object | null} eklenen / tazelenen kayıt; `fresh` alanı yeni eklendiyse true (kaydedilmez)
 */
export function addMoodlet(c, key, now, opts = {}) {
  const def = MOODLETS[key];
  if (!def || !c || !MOOD_ENGINE.enabled) return null;
  const list = (c.moodlets ??= []);
  const tier = TIER_SCALE[opts.tier] ? opts.tier : 'minor';
  const hours = opts.hours ?? def.hours;
  const until = hours === null ? null : Math.round(now + hours * 60);
  const existing = getMoodlet(c, key);
  if (existing) {
    if (until !== null && (existing.until === null || until > existing.until)) existing.until = until;
    if (TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(existing.tier)) existing.tier = tier;
    if (opts.harsh) existing.harsh = true;
    recomputeMood(c);
    return existing;
  }
  let count = 0;
  let weakest = null;
  for (const m of list) {
    const d = MOODLETS[m.key];
    if (d.layer !== def.layer) continue;
    count++;
    if (!weakest || d.priority < MOODLETS[weakest.key].priority || (d.priority === MOODLETS[weakest.key].priority && m.since < weakest.since)) weakest = m;
  }
  if (count >= MOODLET_CAPS[def.layer]) {
    if (MOODLETS[weakest.key].priority > def.priority) return null;
    list.splice(list.indexOf(weakest), 1);
  }
  const m = { key, tier, since: Math.round(now), until, reason: MOOD_REASONS[opts.reason] ? opts.reason : null };
  if (Number.isFinite(opts.whoId)) m.whoId = opts.whoId;
  if (typeof opts.whoName === 'string') m.whoName = opts.whoName;
  if (opts.harsh) m.harsh = true;
  list.push(m);
  recomputeMood(c);
  return m;
}

export function removeMoodlet(c, key) {
  const list = c?.moodlets;
  if (!list) return false;
  for (let i = 0; i < list.length; i++) {
    if (list[i].key !== key) continue;
    list.splice(i, 1);
    recomputeMood(c);
    return true;
  }
  return false;
}

/** Süresi dolan moodlet'leri siler. Silinen sayısı. */
export function expireMoodlets(c, now) {
  const list = c?.moodlets;
  if (!list || list.length === 0) return 0;
  let removed = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].until !== null && list[i].until <= now) {
      list.splice(i, 1);
      removed++;
    }
  }
  if (removed) recomputeMood(c);
  return removed;
}

/** c.mood'u yerinde yeniden hesaplar (tahsisat yok). */
export function recomputeMood(c) {
  const mood = c.mood ?? (c.mood = neutralMood());
  const list = c.moodlets ?? [];
  for (const k of MUL_KEYS) mood[k] = 1;
  mood.masterwork = 0;
  mood.shirk = mood.focus = mood.seek = mood.grief = false;
  let soothing = 1;
  for (let i = 0; i < list.length; i++) {
    const s = MOODLETS[list[i].key].soothes;
    if (s !== undefined) soothing = s;
  }
  let net = 0;
  let best = null;
  let bestWeight = 0;
  let hangry = false;
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const def = MOODLETS[m.key];
    const scale = TIER_SCALE[m.tier] * (def.tone === 'trauma' ? soothing : 1);
    for (const k of MUL_KEYS) {
      const base = def.effects[k];
      if (base !== undefined) mood[k] *= 1 + (base - 1) * scale;
      if (m.harsh && def.harshEffects?.[k] !== undefined) mood[k] *= 1 + (def.harshEffects[k] - 1) * scale;
    }
    if (def.effects.masterwork) mood.masterwork += def.effects.masterwork * scale;
    if (def.shirk) mood.shirk = true;
    if (def.focus) mood.focus = true;
    if (def.seek) mood.seek = true;
    if (def.grief) mood.grief = true;
    if (m.key === 'hangry') hangry = true;
    const w = def.weight * scale;
    net += def.tone === 'positive' ? w : -w;
  }
  // Huysuz + aç: atışma olasılığı iki katına çıkar
  if (hangry && Array.isArray(c.traits) && c.traits.includes('grumpy')) mood.quarrelMul *= MOOD_RULES.hangryGrumpyQuarrel;
  // (29.3) Yaşam doyumu kademesi: çarpanlar kırpmadan ÖNCE katılır (toplam yine MOOD_LIMITS içinde kalır)
  const tier = satisfactionTier(c.satisfaction);
  for (const k in tier.effects) mood[k] *= tier.effects[k];
  mood.satisfaction = tier.key;
  // (30.3) Sadakat kademesi (Kırgın / Homurdanıyor / Memnun / Sadık): yaşam doyumu gibi kırpmadan ÖNCE katılır (ENGINES.discontent)
  const lev = levelEffects(c);
  if (lev) for (const k in lev) mood[k] *= lev[k];
  for (const k of MUL_KEYS) {
    const limit = MOOD_LIMITS[k];
    if (mood[k] < limit[0]) mood[k] = limit[0];
    else if (mood[k] > limit[1]) mood[k] = limit[1];
  }
  // Olumsuz ve olumlu bayrak çakışırsa beden kazanır: bıkkın / yorgun sakin "odak" sayılmaz
  if (mood.shirk) mood.focus = false;
  mood.net = net;
  const sign = net >= DOMINANT_THRESHOLD ? 1 : net <= -DOMINANT_THRESHOLD ? -1 : 0;
  if (sign !== 0) {
    for (let i = 0; i < list.length; i++) {
      const def = MOODLETS[list[i].key];
      if ((def.tone === 'positive' ? 1 : -1) !== sign) continue;
      const w = def.weight * TIER_SCALE[list[i].tier];
      if (w > bestWeight) {
        bestWeight = w;
        best = def;
      }
    }
  }
  mood.feel = best ? best.feel : NEUTRAL_FEEL;
  mood.tone = best ? best.tone : 'neutral';
  mood.version = (mood.version | 0) + 1;
  return mood;
}

/** Teselli edilebilir, henüz teselli edilmemiş travma (yas, sarsıntı, kalp kırıklığı) ya da null. */
export function traumaOf(c) {
  const list = c?.moodlets;
  if (!list || list.length === 0) return null;
  let trauma = null;
  for (let i = 0; i < list.length; i++) {
    if (list[i].key === 'comforted') return null;
    if (MOODLETS[list[i].key].consolable) trauma = list[i];
  }
  return trauma;
}

/**
 * Teselli: travmanın KALAN süresi CONSOLE.shorten oranında kısalır ve "Yüreği Ferahladı" eklenir.
 * Dönüş: { trauma, before, after } (dakika cinsinden kalan süre) ya da null.
 */
export function soothe(c, now, by = null) {
  const trauma = traumaOf(c);
  if (!trauma) return null;
  const before = Math.max(0, trauma.until - now);
  const after = Math.round(before * (1 - CONSOLE.shorten));
  trauma.until = Math.round(now + after);
  addMoodlet(c, 'comforted', now, { reason: 'comforted', whoId: by?.id, whoName: by?.name });
  recomputeMood(c);
  return { trauma, before, after };
}

/** Kalan süre (saat, yukarı yuvarlanır); koşula bağlı moodlet'te null. */
export function remainingHours(m, now) {
  return m.until === null ? null : Math.max(0, Math.ceil((m.until - now) / 60));
}

/** Tetiklenme nedeni metni ("Eşi Deniz vefat etti"). */
export function reasonText(m) {
  const text = MOOD_REASONS[m.reason];
  return text ? text.replace('{who}', m.whoName ?? 'biri') : '';
}

function pct(mul) {
  const p = Math.round((mul - 1) * 100);
  return `${p > 0 ? '+' : '−'}%${Math.abs(p)}`;
}

/** Moodlet'in net mekanik etkisi ("İş +%8 · Keyif düşüşü −%15"). soothing: teselli çarpanı (travmada). */
export function effectText(m, soothing = 1) {
  const def = MOODLETS[m.key];
  const scale = TIER_SCALE[m.tier] * (def.tone === 'trauma' ? soothing : 1);
  const parts = [];
  for (const k of MUL_KEYS) {
    let mul = def.effects[k] !== undefined ? 1 + (def.effects[k] - 1) * scale : 1;
    if (m.harsh && def.harshEffects?.[k] !== undefined) mul *= 1 + (def.harshEffects[k] - 1) * scale;
    if (Math.abs(mul - 1) >= 0.005) parts.push(`${EFFECT_NAMES[k]} ${pct(mul)}`);
  }
  if (def.effects.masterwork) parts.push(`Eser şansı +%${Math.round(def.effects.masterwork * scale * 100)}`);
  if (def.soothes !== undefined) parts.push('Travma cezaları yarıya iner');
  if (def.grief) parts.push('Eğlenceye ve flörte girmez');
  return parts.join(' · ');
}

/** Sakinin teselli çarpanı (kart metinleri için). */
export function soothingOf(c) {
  const m = getMoodlet(c, 'comforted');
  return m ? MOODLETS.comforted.soothes : 1;
}

/** (v36 -> v37) Her sakine boş moodlet listesi, duruma boş sayaçlar. Düz veriyle çalışır. */
export function migrateMoodlets(data) {
  if (Array.isArray(data?.characters)) {
    for (const c of data.characters) if (c && typeof c === 'object') c.moodlets = sanitizeMoodlets(c.moodlets);
  }
  data.moodlets = restoreMoodletStats(data.moodlets);
  return data;
}
