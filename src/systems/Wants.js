// (29.3) Arzuların, korkuların ve yaşam doyumunun SAF hesapları. Sayılar src/data/wants.js'te; olaylar ve durum değişiklikleri
// src/systems/WantSystem.js'te. Buradaki hiçbir işlev durumu değiştirmez (recomputeDrive yalnızca c.drive'ı yerinde kurar) ve
// dışarıdan üreteç almaz: günlük seçim (tohum, kimlik, gün, salt) karmasından türeyen durumsuz bir üreteçle yapılır.
//
//   wantRng(seed, id, day, salt)          : o günün durumsuz üreteci (salt 0 = arzular, 1 = korkular)
//   eligibleWants / eligibleFears          : katalog sırasıyla { key, weight, whoId, whoName } listesi (tavanlar ve tekrar kuralıyla)
//   holds(state, c, kind, entry)           : aktif kaydın uygunluğu hâlâ sürüyor mu (bitince WantSystem 'void' eder, cezasız)
//   pickWeighted(list, rng)                : ağırlıklı seçim (liste boşsa zar çekilmez)
//   recomputeDrive(c)                      : c.drive (davranış kancaları; Brain ve JobSystem yalnızca okur)
//   satisfactionTier(value)                : doyum kademesi (etkileri Moodlets.recomputeMood c.mood'a katar)
//   sanitize* / restoreWantStats / migrateWants : kayıt
import { Random } from '../utils/random.js';
import { WANTS, FEARS, WANT_CAPS, WANT_RULES, SATISFACTION, WANT_STAGE, WANT_MOOD, WANT_GRIEF, QUIET_LEISURE, WARM_LEISURE, WANT_SEED_OFFSET } from '../data/wants.js';
import { MASTERPIECES } from '../data/masterpieces.js';
import { SHOP } from '../data/citizens.js';
import { CHILDREN } from '../data/family.js';
import { RELATIONSHIP_LEVELS } from '../data/relationships.js';
import { getSeason } from '../data/seasons.js';
import { getFriendship } from './RelationshipSystem.js';
import { hasTag } from './Chemistry.js';
import { skillLevel, primarySkill } from './SkillSystem.js';
import { heirloomSlot, petitionOf } from './Citizens.js';

export const OUTCOMES = ['fulfilled', 'expired', 'realized', 'passed', 'void'];
const RIVAL_BELOW = RELATIONSHIP_LEVELS.find((l) => l.key === 'dislike').min; // bu puanın altı "Rakip"
const CHEAPEST_GOOD = Math.min(...Object.values(SHOP.prices));

/** Durumsuz günlük üreteç (Venerable.lifespanFor kalıbı): aynı (tohum, kimlik, gün, salt) her zaman aynı akışı verir. */
export function wantRng(seed, id, day, salt) {
  const mixed =
    (Math.imul((Number(seed) || 0) + WANT_SEED_OFFSET, 2654435761) ^
      Math.imul((Number(id) || 0) + 1, 40503) ^
      Math.imul((Number(day) || 0) + 1, 2246822519) ^
      Math.imul((Number(salt) || 0) + 1, 3266489917)) >>>
    0;
  return new Random(mixed);
}

/** Arzu / korku taşıyabilen sakin: yetişkin (Genç, Yetişkin, Kıdemli Bilge, Saygın Büyük), ziyaretçi değil. */
export function wantsEnabled(c) {
  return Boolean(c) && !c.role && !c.isChild;
}

// ---------------------------------------------------------------------------------------------------------------------
// Doyum

export function clampSatisfaction(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return SATISFACTION.start;
  return Math.max(SATISFACTION.min, Math.min(SATISFACTION.max, Math.round(n)));
}

/** Doyum kademesi ({ key, below, name, effects }). */
export function satisfactionTier(value) {
  const v = Number.isFinite(value) ? value : SATISFACTION.start;
  const tiers = SATISFACTION.tiers;
  for (let i = 0; i < tiers.length; i++) if (v < tiers[i].below) return tiers[i];
  return tiers[tiers.length - 1];
}

const EFFECT_NAMES = { workMul: 'İş', joyRateMul: 'Keyif düşüşü', quarrelMul: 'Atışma', xpMul: 'Deneyim' };
/** Kademe etkisi metni ("İş +%3 · Keyif düşüşü −%8"); etkisizse "Etkisi yok". */
export function tierEffectText(tier) {
  const parts = [];
  for (const [k, mul] of Object.entries(tier.effects)) {
    const p = Math.round((mul - 1) * 100);
    parts.push(`${EFFECT_NAMES[k] ?? k} ${p > 0 ? '+' : '−'}%${Math.abs(p)}`);
  }
  return parts.length ? parts.join(' · ') : 'Etkisi yok';
}

// ---------------------------------------------------------------------------------------------------------------------
// Yardımcılar (üreteçsiz, kimlik sırasıyla)

const living = (state, id) => (Number.isFinite(id) ? state.characters.find((o) => o.id === id && !o.role) ?? null : null);
const isParentOf = (p, kid) => kid.parentIds.includes(p.id) || (kid.parents ?? []).includes(p.id);
const kidsOf = (state, c) => state.characters.filter((o) => o !== c && !o.role && isParentOf(c, o));

function partner(state, c) {
  const p = living(state, c.partnerId);
  return p && p.partnerId === c.id ? p : null;
}

/** Ruh İkizi etiketli, yaşayan kişiler (kimlik sırasıyla). */
function kindredOf(state, c) {
  const out = [];
  for (const key of Object.keys(c.relationships ?? {})) {
    const id = Number(key);
    if (!hasTag(c, id, 'kindred')) continue;
    const o = living(state, id);
    if (o && o !== c) out.push(o);
  }
  return out.sort((a, b) => a.id - b.id);
}

function friendCount(state, c) {
  let n = 0;
  for (const o of state.characters) if (o !== c && !o.role && getFriendship(state, c, o) >= WANT_RULES.friendScore) n++;
  return n;
}

/** Puanı en düşük olan (eşitlikte küçük kimlik) uygun kişi. */
function lowestScore(state, c, test) {
  let best = null;
  let bestScore = Infinity;
  for (const o of state.characters) {
    if (o === c || o.role || !test(o)) continue;
    const score = getFriendship(state, c, o);
    if (score < bestScore || (score === bestScore && o.id < best.id)) {
      best = o;
      bestScore = score;
    }
  }
  return best;
}

const grudge = (state, c, o) => hasTag(c, o.id, 'resentful') || getFriendship(state, c, o) < RIVAL_BELOW;
const foe = (state, c, o) => grudge(state, c, o) || (c.relationships?.[o.id]?.chemistry ?? 0) < 0;

function canWork(c) {
  return !c.retired && !c.isVenerable;
}

function hasStructure(state, types) {
  return state.buildings.some((b) => types.includes(b.type) && b.functional && !b.damaged && !b.underConstruction);
}

function lovedOnes(state, c) {
  const ids = new Set([...c.parentIds, ...(c.parents ?? [])]);
  const p = partner(state, c);
  const out = [];
  if (p) out.push(p);
  for (const id of ids) {
    const o = living(state, id);
    if (o && !out.includes(o)) out.push(o);
  }
  for (const o of kindredOf(state, c)) if (!out.includes(o)) out.push(o);
  return out.filter((o) => o.age >= WANT_RULES.lovedAge);
}

/** En ilerideki çırak (eşitlikte küçük kimlik). */
function bestPupil(state, c) {
  let best = null;
  for (const o of state.characters) {
    if (o.apprenticeship?.masterId !== c.id) continue;
    const p = o.apprenticeship.progress ?? 0;
    if (!best || p > (best.apprenticeship.progress ?? 0) || (p === (best.apprenticeship.progress ?? 0) && o.id < best.id)) best = o;
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------------------------
// Uygunluk. Her kural { ok, who } döndürür; `fixed` verilirse (aktif kayıt) aynı hedef için hâlâ geçerli mi diye bakar.

const NO = { ok: false, who: null };
const yes = (who = null) => ({ ok: true, who });

const WANT_TESTS = {
  see_pupil_master(state, c, fixed) {
    if (fixed) return fixed.apprenticeship?.masterId === c.id ? yes(fixed) : NO;
    const pupil = bestPupil(state, c);
    return pupil ? yes(pupil) : NO;
  },
  pass_heirloom: (state, c) => (c.isElder && heirloomSlot(c) ? yes() : NO),
  see_grandchild(state, c) {
    const kids = kidsOf(state, c);
    if (!kids.some((k) => k.married)) return NO;
    for (const k of kids) if (state.characters.some((o) => o !== k && isParentOf(k, o))) return NO;
    return yes();
  },
  get_married(state, c, fixed) {
    const p = partner(state, c);
    if (!p || c.married || (fixed && p !== fixed)) return NO;
    return yes(p);
  },
  have_child(state, c) {
    if (!c.married || c.isElder || !partner(state, c)) return NO;
    return (c.children ?? []).length < CHILDREN.maxPerCouple ? yes() : NO;
  },
  find_love: (state, c) => (c.partnerId === null && !c.mood?.grief ? yes() : NO),
  craft_masterwork(state, c) {
    if (!canWork(c)) return NO;
    return Object.values(MASTERPIECES).some((p) => skillLevel(c, p.skill).level >= 3) ? yes() : NO;
  },
  level_up_skill: (state, c) => (canWork(c) ? yes() : NO),
  chat_kindred(state, c, fixed) {
    if (fixed) return hasTag(c, fixed.id, 'kindred') ? yes(fixed) : NO;
    const k = kindredOf(state, c)[0];
    return k ? yes(k) : NO;
  },
  make_friend: (state, c) => (friendCount(state, c) < 2 ? yes() : NO),
  reconcile(state, c, fixed) {
    if (fixed) return grudge(state, c, fixed) ? yes(fixed) : NO;
    const o = lowestScore(state, c, (o) => grudge(state, c, o));
    return o ? yes(o) : NO;
  },
  sherbet_with_spouse(state, c, fixed) {
    const p = partner(state, c);
    if (!p || (fixed && p !== fixed)) return NO;
    // (uyarlama) han yalnızca akşam 17:00-01:00 yanar, dolum 06:00'dadır: "ışığı yanan han" = akşam yanacak sağlam bir han
    return hasStructure(state, ['inn']) ? yes(p) : NO;
  },
  // (uyarlama) social:familyDinner yalnızca aynı evde yaşayan eşlerin akşam yemeğinde yayınlanır: "aileden biri" = evdeki eş
  family_dinner(state, c) {
    const p = partner(state, c);
    return c.married && p && c.homeId !== null && p.homeId === c.homeId ? yes() : NO;
  },
  feast_meal: () => yes(),
  quiet_day: () => yes(),
  treat_self: (state, c) => ((c.coins ?? 0) >= CHEAPEST_GOOD && hasStructure(state, ['market']) ? yes() : NO),
  go_expedition(state, c) {
    if (c.isElder || c.isInjured || c.illness || !canWork(c)) return NO;
    return hasStructure(state, ['harbor', 'townHall']) ? yes() : NO;
  },
  be_heard: (state, c) => (petitionOf(state, c) ? yes() : NO),
};

const FEAR_TESTS = {
  fire_at_work: (state, c) => (c.homeId !== null || c.workplaceId !== null || state.buildings.some((b) => b.workerIds?.has(c.id)) ? yes() : NO),
  quarrel_foe(state, c, fixed) {
    if (fixed) return foe(state, c, fixed) ? yes(fixed) : NO;
    const o = lowestScore(state, c, (o) => foe(state, c, o));
    return o ? yes(o) : NO;
  },
  winter_cold: (state) => (['autumn', 'winter'].includes(getSeason(state.time.day).key) ? yes() : NO),
  go_hungry: () => yes(),
  loss_of_loved(state, c, fixed) {
    const list = lovedOnes(state, c);
    if (fixed) return list.includes(fixed) ? yes(fixed) : NO;
    let best = null;
    for (const o of list) if (!best || o.ageInDays > best.ageInDays || (o.ageInDays === best.ageInDays && o.id < best.id)) best = o;
    return best ? yes(best) : NO;
  },
  be_lonely: () => yes(),
  fall_ill: () => yes(),
  heartbreak: (state, c) => (c.partnerId === null || !c.married ? yes() : NO),
  unheard: (state, c) => (petitionOf(state, c) ? yes() : NO),
  burnout: (state, c) => (canWork(c) ? yes() : NO),
};

const catalogOf = (kind) => (kind === 'fear' ? FEARS : WANTS);
const testsOf = (kind) => (kind === 'fear' ? FEAR_TESTS : WANT_TESTS);

/** Aktif kaydın uygunluğu hâlâ sürüyor mu (hedefli kayıtta aynı hedef için; hedef öldüyse / göçtüyse hayır). */
export function holds(state, c, kind, entry) {
  const test = testsOf(kind)[entry.key];
  if (!test) return false;
  let fixed = null;
  if (Number.isFinite(entry.whoId)) {
    fixed = living(state, entry.whoId);
    if (!fixed) return false;
  }
  return test(state, c, fixed).ok;
}

/** Ağırlık: temel x özellik x huy x evre x moodlet bağlamı x yas. */
function weightOf(c, def, key, cat) {
  let w = def.base;
  for (const t of c.traits ?? []) if (def.traits[t] !== undefined) w *= def.traits[t];
  if (def.quirks[c.quirk] !== undefined) w *= def.quirks[c.quirk];
  const stage = WANT_STAGE[c.lifeStage];
  if (stage) w *= stage[key] ?? (cat ? stage[cat] ?? 1 : 1);
  for (const m of c.moodlets ?? []) {
    const ctx = WANT_MOOD[m.key];
    if (ctx?.[key] !== undefined) w *= ctx[key];
  }
  if (cat && c.mood?.grief) w *= WANT_GRIEF[key] ?? WANT_GRIEF[cat] ?? 1;
  return w;
}

function seenRecently(c, key, day) {
  for (const e of c.wantLog ?? []) if (e.key === key && day - e.day <= WANT_RULES.repeatDays) return true;
  return false;
}

function eligible(state, c, kind) {
  const out = [];
  if (!wantsEnabled(c)) return out;
  const catalog = catalogOf(kind);
  const tests = testsOf(kind);
  const active = kind === 'fear' ? c.fears ?? [] : c.wants ?? [];
  const day = state.time.day;
  const cats = new Set();
  let longs = 0;
  if (kind === 'want') {
    for (const w of active) {
      cats.add(WANTS[w.key].cat);
      if (WANTS[w.key].days === null) longs++;
    }
  }
  for (const key of Object.keys(catalog)) {
    const def = catalog[key];
    if (active.some((x) => x.key === key) || seenRecently(c, key, day)) continue;
    if (kind === 'want' && (cats.has(def.cat) || (def.days === null && longs >= WANT_CAPS.longWants))) continue;
    const r = tests[key](state, c, null);
    if (!r.ok) continue;
    const weight = weightOf(c, def, key, kind === 'want' ? def.cat : null);
    if (!(weight > 0)) continue;
    out.push({ key, weight, whoId: r.who ? r.who.id : null, whoName: r.who ? r.who.name : null });
  }
  return out;
}

export function eligibleWants(state, world, c) {
  return eligible(state, c, 'want');
}

export function eligibleFears(state, world, c) {
  return eligible(state, c, 'fear');
}

/** Ağırlıklı seçim: toplam ağırlık x rng.next(). Liste boşsa null ve zar çekilmez. */
export function pickWeighted(list, rng) {
  if (!list || list.length === 0) return null;
  let total = 0;
  for (const x of list) total += x.weight;
  if (!(total > 0)) return null;
  let roll = rng.next() * total;
  for (const x of list) {
    roll -= x.weight;
    if (roll < 0) return x;
  }
  return list[list.length - 1];
}

/** Kayıt adı ({who} çözülmüş). */
export function wantName(kind, entry) {
  const def = catalogOf(kind)[entry.key];
  return def ? def.name.replace('{who}', entry.whoName ?? 'biri') : '';
}

/** Kalan süre metni ("2 gün" / "5 sa" / "sürüyor"). */
export function remainingText(entry, now) {
  if (entry.until === null) return 'sürüyor';
  const left = Math.max(0, entry.until - now);
  if (left >= 1440) return `${Math.ceil(left / 1440)} gün`;
  return `${Math.max(1, Math.ceil(left / 60))} sa`;
}

/** Arzunun puanı (Başusta mezuniyetinde artı). */
export function wantPoints(key, extra = 0) {
  return (WANTS[key]?.points ?? 0) + extra;
}

/** Puana göre moodlet kademesi. */
export function tierForPoints(points) {
  const t = WANT_RULES.tierAt;
  return points >= t.critical ? 'critical' : points >= t.major ? 'major' : 'minor';
}

// ---------------------------------------------------------------------------------------------------------------------
// Davranış kancaları

export function neutralDrive() {
  return { version: 0, leisure: {}, shopMul: 1, seekIds: [], avoidIds: [], focus: false, social: false, ownCraft: false, hungerBonus: 0, energyBonus: 0, warmth: false };
}

/** c.drive'ı arzulardan / korkulardan yeniden kurar (yerinde; version her çağrıda artar). */
export function recomputeDrive(c) {
  const d = c.drive ?? (c.drive = neutralDrive());
  const leisure = {};
  d.shopMul = 1;
  d.seekIds = [];
  d.avoidIds = [];
  d.focus = d.social = d.ownCraft = d.warmth = false;
  d.hungerBonus = d.energyBonus = 0;
  for (const w of c.wants ?? []) {
    const drive = WANTS[w.key]?.drive;
    if (!drive) continue;
    if (drive.leisure) for (const k of QUIET_LEISURE) leisure[k] = WANT_RULES.leisureMul;
    if (drive.inn) leisure.inn = WANT_RULES.leisureMul;
    if (drive.shop) d.shopMul = WANT_RULES.shopMul;
    if (drive.seek && Number.isFinite(w.whoId) && !d.seekIds.includes(w.whoId)) d.seekIds.push(w.whoId);
    if (drive.social) d.social = true;
    if (drive.focus) d.focus = true;
    if (drive.ownCraft) d.ownCraft = true;
  }
  for (const f of c.fears ?? []) {
    const drive = FEARS[f.key]?.drive;
    if (!drive) continue;
    if (drive.avoid && Number.isFinite(f.whoId) && !d.avoidIds.includes(f.whoId)) d.avoidIds.push(f.whoId);
    if (drive.hunger) d.hungerBonus = WANT_RULES.hungerBonus;
    if (drive.energy) d.energyBonus = WANT_RULES.energyBonus;
    if (drive.warmth) d.warmth = true;
  }
  // (29.6) hatırlanan güzel anının kişisi (c.recall.whoId; LoyaltySystem süresini yönetir), (29.7) özel günde birbirini arayanlar (c.specialSeek)
  const r = c.recall;
  // (29.10) yalnızca güzel anılar hatırlandığı için (MemorySystem.recall) hatırlanan kişi her zaman aranır; kaçınma dalı yoktur
  if (r && Number.isFinite(r.whoId) && !d.seekIds.includes(r.whoId)) d.seekIds.push(r.whoId);
  for (const id of c.specialSeek ?? []) if (!d.seekIds.includes(id)) d.seekIds.push(id);
  d.leisure = leisure;
  d.version = (d.version | 0) + 1;
  return d;
}

/** JobSystem.findWorkFor: mesleğinde ilerlemek / eser çıkarmak isteyenin kendi uzmanlık becerisi (ana meslek) ya da null. */
export function ownCraftSkill(c) {
  return c.drive?.ownCraft ? primarySkill(c)?.skill ?? null : null;
}

/** Brain.planLeisure: sıcak mekân çarpanı alan etkinlikler (Soğukta üşümek korkusu, sonbahar / kış). */
export const WARMTH_LEISURE = WARM_LEISURE;

// ---------------------------------------------------------------------------------------------------------------------
// Kayıt

const STAT_GROUPS = { rolled: WANTS, fulfilled: WANTS, expired: WANTS, fearsRolled: FEARS, realized: FEARS, passed: FEARS };

export function emptyWantStats() {
  return { rolled: {}, fulfilled: {}, expired: {}, fearsRolled: {}, realized: {}, passed: {} };
}

export function restoreWantStats(data) {
  const out = emptyWantStats();
  if (!data || typeof data !== 'object') return out;
  // kayıttaki sıra korunur; bilinmeyen anahtarlar atılır
  for (const [group, catalog] of Object.entries(STAT_GROUPS)) {
    const src = data[group];
    if (!src || typeof src !== 'object') continue;
    for (const key of Object.keys(src)) {
      const n = catalog[key] ? Math.floor(Number(src[key]) || 0) : 0;
      if (n > 0) out[group][key] = n;
    }
  }
  return out;
}

/**
 * Kayıttan gelen arzu / korku listesini temizler: bilinmeyen anahtar, tekrar, bozuk süre atılır; tavan uygulanır
 * (arzularda kategori başına 1 ve uzun soluklu en çok WANT_CAPS.longWants).
 */
export function sanitizeWants(data, catalog, cap) {
  const out = [];
  if (!Array.isArray(data)) return out;
  const isWant = catalog === WANTS;
  const cats = new Set();
  let longs = 0;
  for (const raw of data) {
    if (out.length >= cap) break;
    const def = catalog[raw?.key];
    if (!def || out.some((x) => x.key === raw.key)) continue;
    const until = raw.until === null || raw.until === undefined ? null : Number.isFinite(raw.until) ? Math.round(raw.until) : NaN;
    if (Number.isNaN(until) || (until === null) !== (def.days === null)) continue;
    if (isWant) {
      if (cats.has(def.cat) || (def.days === null && longs >= WANT_CAPS.longWants)) continue;
      cats.add(def.cat);
      if (def.days === null) longs++;
    }
    const e = { key: raw.key, since: Number.isFinite(raw.since) ? Math.round(raw.since) : 0, until };
    if (Number.isFinite(raw.whoId)) e.whoId = raw.whoId;
    if (typeof raw.whoName === 'string') e.whoName = raw.whoName.slice(0, 32);
    out.push(e);
  }
  return out;
}

export function sanitizeWantLog(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const kind = raw.kind === 'fear' ? 'fear' : raw.kind === 'want' ? 'want' : null;
    if (!kind || !catalogOf(kind)[raw.key] || !OUTCOMES.includes(raw.outcome) || !Number.isFinite(raw.day)) continue;
    const e = { key: raw.key, kind, outcome: raw.outcome, day: Math.floor(raw.day) };
    if (typeof raw.whoName === 'string') e.whoName = raw.whoName.slice(0, 32);
    if (raw.burned === true) e.burned = true;
    out.push(e);
  }
  return out.slice(-WANT_CAPS.log);
}

export function sanitizeCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

/** Yüklemede: hayatta olmayan kişiye bağlı kayıtlar atılır (GameState.sanitizeReferences). */
export function pruneWantRefs(characters) {
  const ids = new Set(characters.map((c) => c.id));
  for (const c of characters) {
    for (const list of [c.wants, c.fears]) {
      if (!list) continue;
      for (let i = list.length - 1; i >= 0; i--) if (Number.isFinite(list[i].whoId) && (!ids.has(list[i].whoId) || list[i].whoId === c.id)) list.splice(i, 1);
    }
  }
}

/** (v37 -> v38) Her sakine boş arzu / korku listeleri ve 50 doyum, duruma boş sayaçlar. Düz veriyle çalışır, zar çekmez. */
export function migrateWants(data) {
  if (Array.isArray(data?.characters)) {
    for (const c of data.characters) {
      if (!c || typeof c !== 'object') continue;
      c.wants = [];
      c.fears = [];
      c.satisfaction = SATISFACTION.start;
      c.wantLog = [];
      c.fearStreak = 0;
      c.wishCount = 0;
    }
  }
  data.wants = emptyWantStats();
  return data;
}
