// (29.1) Sosyal Kimya ve Duygusal Etiketlerin SAF hesapları. Sayılar src/data/chemistry.js'te; olaylar ve davranış
// src/systems/ChemistrySystem.js'te. Buradaki hiçbir işlev ana üreteci ya da Math.random'ı tüketmez: kıvılcım, kimlik
// çiftinden ve dünya tohumundan türeyen izole bir üreteçle (tohum + 37) hesaplanır, çağrı sırasına bağlı değildir.
// İşlevler kayıttaki düz nesnelerle de çalışır (SaveManager.migrate v35 -> v36 bunları kullanır).
//
//   sparkFor(seed, idA, idB)        : çiftin sabit kıvılcımı (-1 / 0 / +1)
//   traitHarmony / quirkHarmony / craftBond : üç belirleyici (-1..+1, 0..+1, 0..+1)
//   chemistryBreakdown(seed, a, b)  : { spark, traits, quirks, craft, total }  (total: -2..+3)
//   chemistryOf(state, a, b)        : kayıttaki kimya (yoksa hesaplar ve iki yöne yazar)
//   refreshChemistry(state, a, b)   : yeniden hesaplar (meslek, huy, zanaat bağı değişmiş olabilir)
//   relationOf / hasTag / addTag / removeTag / tagsOf / expireTags : yönlü etiketler
//   sanitizeRelations / pruneRelations / migrateChemistry : kayıt
import { Random } from '../utils/random.js';
import { OPPOSING_TRAITS } from '../data/characters.js';
import { levelFor } from './SkillSystem.js';
import {
  CHEMISTRY_MIN,
  CHEMISTRY_MAX,
  CHEMISTRY_SEED_OFFSET,
  CHEMISTRY_LEVELS,
  SPARK_WEIGHTS,
  COMPLEMENTARY_TRAITS,
  TRAIT_SKILL_COMPLEMENTS,
  TRAIT_SKILL_MIN_LEVEL,
  QUIRK_RESONANCE,
  EMOTION_TAGS,
  EMOTION_TAG_KEYS,
  RULER_ID,
} from '../data/chemistry.js';
import { lifeSeedOf } from '../utils/lifeSeed.js';

const SPARK_TOTAL = SPARK_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

export function clampChemistry(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.max(CHEMISTRY_MIN, Math.min(CHEMISTRY_MAX, v));
}

/** Kimya seviyesinin tanımı (ad, simge, çarpanlar). */
export function chemistryLevel(n) {
  return CHEMISTRY_LEVELS[clampChemistry(n)];
}

/**
 * Çiftin kıvılcımı: kimlik çiftinden ve tohumdan türeyen sabit pay. Sıra önemsizdir (A-B = B-A).
 * Her çağrıda yeni, izole bir üreteç kurulur; hiçbir ortak üreteç ilerlemez.
 */
export function sparkFor(seed, idA, idB) {
  const lo = Math.min(Number(idA) || 0, Number(idB) || 0);
  const hi = Math.max(Number(idA) || 0, Number(idB) || 0);
  const mixed = (Math.imul((Number(seed) || 0) + CHEMISTRY_SEED_OFFSET, 2654435761) ^ Math.imul(lo + 1, 40503) ^ Math.imul(hi + 1, 2246822519)) >>> 0;
  const rng = new Random(mixed);
  rng.next();
  let roll = rng.next() * SPARK_TOTAL;
  for (const [value, weight] of SPARK_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return SPARK_WEIGHTS[SPARK_WEIGHTS.length - 1][0];
}

const traitsOf = (c) => (Array.isArray(c?.traits) ? c.traits : []);

function pairMatch(pairs, listA, listB) {
  for (const [x, y] of pairs) {
    if ((listA.includes(x) && listB.includes(y)) || (listA.includes(y) && listB.includes(x))) return true;
  }
  return false;
}

function skilled(c, skills) {
  return skills.some((skill) => levelFor(Number(c?.skills?.[skill]) || 0).level >= TRAIT_SKILL_MIN_LEVEL);
}

function traitSkillMatch(a, b) {
  for (const [trait, skills] of Object.entries(TRAIT_SKILL_COMPLEMENTS)) {
    if (traitsOf(a).includes(trait) && skilled(b, skills)) return true;
  }
  return false;
}

/** Kişilik uyumu: zıt özellikler -1 (baskın); ortak ya da tamamlayan özellikler (ve özellik + meslek) +1; yoksa 0. */
export function traitHarmony(a, b) {
  const ta = traitsOf(a);
  const tb = traitsOf(b);
  if (pairMatch(OPPOSING_TRAITS, ta, tb)) return -1;
  if (ta.some((t) => tb.includes(t))) return 1;
  if (pairMatch(COMPLEMENTARY_TRAITS, ta, tb)) return 1;
  return traitSkillMatch(a, b) || traitSkillMatch(b, a) ? 1 : 0;
}

/** Huy rezonansı: aynı huy ya da rezonanslı çift +1; ötekiler nötr. */
export function quirkHarmony(a, b) {
  const qa = typeof a?.quirk === 'string' ? a.quirk : null;
  const qb = typeof b?.quirk === 'string' ? b.quirk : null;
  if (!qa || !qb) return 0;
  if (qa === qb) return 1;
  return pairMatch(QUIRK_RESONANCE, [qa], [qb]) ? 1 : 0;
}

function mentors(master, pupil) {
  if (pupil?.apprenticeship?.masterId === master?.id) return true;
  return Array.isArray(master?.mentees) && master.mentees.some((m) => m?.id === pupil?.id);
}

/** Zanaat bağı: usta-çırak, ikisi de Başusta, aynı sabit iş yeri ya da aynı atölyede birlikte çalışmış olmak (kayıttaki craft). */
export function craftBond(a, b) {
  if (mentors(a, b) || mentors(b, a)) return 1;
  if (a?.isGrandmaster && b?.isGrandmaster) return 1;
  if (a?.workplaceId !== null && a?.workplaceId !== undefined && a.workplaceId === b?.workplaceId) return 1;
  return a?.relationships?.[b?.id]?.craft || b?.relationships?.[a?.id]?.craft ? 1 : 0;
}

/** Kimyanın dökümü: { spark, traits, quirks, craft, total }. */
export function chemistryBreakdown(seed, a, b) {
  const spark = sparkFor(seed, a.id, b.id);
  const traits = traitHarmony(a, b);
  const quirks = quirkHarmony(a, b);
  const craft = craftBond(a, b);
  return { spark, traits, quirks, craft, total: clampChemistry(spark + traits + quirks + craft) };
}

export function chemistryFor(seed, a, b) {
  return chemistryBreakdown(seed, a, b).total;
}

// ---------------------------------------------------------------------------------------------------------------------
// İlişki kaydı

export function emptyRelation() {
  return { chemistry: 0, craft: false, together: 0, tags: [], until: {} };
}

/** A'nın B'ye dair kaydı (yoksa null). */
export function relationOf(c, otherId) {
  return c?.relationships?.[otherId] ?? null;
}

function ensure(c, otherId) {
  c.relationships ??= {};
  return (c.relationships[otherId] ??= emptyRelation());
}

/** Kayıttaki kimya; kayıt yoksa hesaplanır ve iki yöne de yazılır. */
export function chemistryOf(state, a, b) {
  const stored = a.relationships?.[b.id];
  if (stored && b.relationships?.[a.id]) return stored.chemistry;
  return refreshChemistry(state, a, b);
}

/** Kimyayı yeniden hesaplayıp iki yöne yazar. */
export function refreshChemistry(state, a, b) {
  const total = chemistryFor(lifeSeedOf(state), a, b);
  ensure(a, b.id).chemistry = total;
  ensure(b, a.id).chemistry = total;
  return total;
}

/**
 * İki sakin aynı atölyede bir saat daha birlikte çalıştı. Sayaç `hours`'a ulaşınca zanaat bağı kalıcı olur.
 * Bağ bu çağrıda kurulduysa true.
 */
export function bondCraft(state, a, b, hours = 1) {
  const ra = ensure(a, b.id);
  const rb = ensure(b, a.id);
  if (ra.craft && rb.craft) return false;
  const together = Math.max(ra.together, rb.together) + 1;
  ra.together = together;
  rb.together = together;
  if (together < hours) return false;
  ra.craft = true;
  rb.craft = true;
  refreshChemistry(state, a, b);
  return true;
}

export function hasTag(c, otherId, tag) {
  const tags = c?.relationships?.[otherId]?.tags;
  return Boolean(tags) && tags.includes(tag);
}

/** A'nın B'ye karşı etiketleri (dizi; yoksa boş). */
export function tagsOf(c, otherId) {
  return c?.relationships?.[otherId]?.tags ?? EMPTY;
}
const EMPTY = Object.freeze([]);

/** Bu sakinin herhangi birine karşı bu etiketi var mı? */
export function hasAnyTag(c, tag) {
  const all = c?.relationships;
  if (!all) return false;
  for (const id in all) if (all[id].tags.includes(tag)) return true;
  return false;
}

/**
 * Etiket ekler (süreli etiketin bitişi yenilenir). Minnet kırgınlığı, kırgınlık minneti siler. Yeni eklendiyse true.
 * @param {number} now state.totalMinutes
 */
export function addTag(c, otherId, tag, now) {
  const def = EMOTION_TAGS[tag];
  if (!def || !c || otherId === c.id) return false;
  const rel = ensure(c, otherId);
  const opposite = tag === 'grateful' ? 'resentful' : tag === 'resentful' ? 'grateful' : null;
  if (opposite) removeTag(c, otherId, opposite);
  if (def.days !== null) rel.until[tag] = Math.round((Number(now) || 0) + def.days * 1440);
  if (rel.tags.includes(tag)) return false;
  rel.tags.push(tag);
  rel.tags.sort((x, y) => EMOTION_TAG_KEYS.indexOf(x) - EMOTION_TAG_KEYS.indexOf(y));
  // bitişler de etiket sırasında tutulur: kayıt -> yükleme (sanitizeRelations) birebir aynı metni üretir
  const until = {};
  for (const t of rel.tags) if (rel.until[t] !== undefined) until[t] = rel.until[t];
  rel.until = until;
  return true;
}

export function removeTag(c, otherId, tag) {
  const rel = c?.relationships?.[otherId];
  if (!rel) return false;
  const i = rel.tags.indexOf(tag);
  if (i < 0) return false;
  rel.tags.splice(i, 1);
  delete rel.until[tag];
  return true;
}

/** Süresi dolan etiketleri siler. Silinen etiket sayısı. */
export function expireTags(c, now) {
  let removed = 0;
  const all = c?.relationships;
  if (!all) return 0;
  for (const id in all) {
    const rel = all[id];
    for (let i = rel.tags.length - 1; i >= 0; i--) {
      const tag = rel.tags[i];
      const until = rel.until[tag];
      if (until !== undefined && until <= now) {
        rel.tags.splice(i, 1);
        delete rel.until[tag];
        removed++;
      }
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------------------------------------------------
// Kayıt

/** Kayıttan gelen ilişki kayıtlarını temizler (bozuk kimya, bilinmeyen etiket, kendine işaret eden kayıt atılır). */
export function sanitizeRelations(data, selfId = null) {
  const out = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
  for (const [key, raw] of Object.entries(data)) {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 0 || id === selfId || !raw || typeof raw !== 'object') continue;
    const tags = [...new Set((Array.isArray(raw.tags) ? raw.tags : []).filter((t) => EMOTION_TAGS[t]))].sort((x, y) => EMOTION_TAG_KEYS.indexOf(x) - EMOTION_TAG_KEYS.indexOf(y));
    const until = {};
    for (const tag of tags) {
      if (EMOTION_TAGS[tag].days === null) continue;
      until[tag] = Number.isFinite(raw.until?.[tag]) ? Math.round(raw.until[tag]) : 0;
    }
    out[id] = { chemistry: clampChemistry(raw.chemistry), craft: Boolean(raw.craft), together: Math.max(0, Math.floor(Number(raw.together) || 0)), tags, until };
  }
  return out;
}

/** Kasabada artık olmayan sakinlere işaret eden kayıtları siler (Yönetim kaydı kalır). Silinen kayıt sayısı. */
export function pruneRelations(characters) {
  const alive = new Set(characters.map((c) => c.id));
  let removed = 0;
  for (const c of characters) {
    if (!c.relationships) continue;
    for (const key of Object.keys(c.relationships)) {
      const id = Number(key);
      if (id === RULER_ID || alive.has(id)) continue;
      delete c.relationships[key];
      removed++;
    }
  }
  return removed;
}

/**
 * (v35 -> v36) Kayıttaki her ilişki puanına (relationships["küçük-büyük"]) ve her partner / eş çiftine deterministik kimyayı
 * ve boş etiket yapısını bağlar. Düz veriyle çalışır; rastgelelik tüketmez. Bağlanan çift sayısını döndürür.
 */
export function migrateChemistry(data) {
  const list = Array.isArray(data?.characters) ? data.characters.filter((c) => c && typeof c === 'object') : [];
  const byId = new Map(list.map((c) => [c.id, c]));
  for (const c of list) c.relationships = sanitizeRelations(c.relationships, c.id);
  let bound = 0;
  const bind = (a, b) => {
    if (!a || !b || a === b) return;
    const total = chemistryFor(lifeSeedOf(data), a, b);
    for (const [x, y] of [[a, b], [b, a]]) {
      const rel = (x.relationships[y.id] ??= emptyRelation());
      rel.chemistry = total;
    }
    bound++;
  };
  for (const key of Object.keys(data?.relationships ?? {})) {
    const [idA, idB] = key.split('-').map(Number);
    bind(byId.get(idA), byId.get(idB));
  }
  for (const c of list) {
    const partner = byId.get(c.partnerId);
    if (partner && c.id < partner.id && !c.relationships[partner.id]) bind(c, partner);
  }
  return bound;
}
