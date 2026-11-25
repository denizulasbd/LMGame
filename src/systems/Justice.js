// (32.1) Suç Motoru'nun SAF hesapları: aday uygunluğu, kişi başı risk ve çarpanları, motivasyon, suç seçenekleri, miktar,
// yakalanma olasılığı, pişmanlık ağırlıkları, kendiliğinden karar (Muhtar uyarısı), ölçüler (crimeRate, solvedRatio), metinler ve
// kayıt temizliği. Durum DEĞİŞTİRMEZ, zar çekmez (zar gerekenlerde çağıran izole üretecin sayısını verir). Sayılar data/justice.js'te.
//
// Dava şeması (state.justice.cases / log; 32.2 dava penceresi bunu okur):
//   { id, day, minute, crime, variant, severity, motive, offenderId, offenderName, victimId?, victimName?, buildingId?, buildingName?,
//     stolen: { item?|resource?|coins?, amount, value } | null, witnessId?, witnessName?, witnessIsGuard,
//     context: { hungry, coins, loyaltyTier, welfare, trust, repeat, ageStage },
//     remorse: 'confess' | 'apologize' | 'deny' | 'excuse', deadline, status: 'open' | 'closed', verdict: null | { kind, by, auto, day },
//     unsolved?: true, closedDay? }
//   (32.2, isteğe bağlı) court?: true (Adalet Sarayı'nın davası), revealed?: { day, witnessName } (sonradan konuşan tanık),
//     statement?: { offender, plea?, pleaLine?, witness } (ifade değişkenleri; dava açılırken izole üreteçle bir kez seçilir),
//     verdict: { kind, by: 'elder' | 'court', auto, day, at?, band?, harsh?, deserved?, stale?, restitution?, fine?, service?, served?, effects? }
import { universityCrimeFactor } from './University.js'; // (32.4)
import { clubCrimeFactor, clubPoverty } from './Clubs.js'; // (32.5)
import { renownCrimeFactor } from './RoyalEffects.js'; // (32.3; 32.6a döngüsüz modül)
import { JUSTICE, RISK, TRAIT_LEAN, QUIRK_LEAN, REMORSE, CATCH, CRIMES, CRIME_KEYS, VANDAL_GROUP, VANDAL_TEXT, LOOT_WORDS, CRIME_TEXT } from '../data/justice.js';
import { COURT, SENTENCES, SENTENCE_KEYS, FINE, DESERVED, BANDS, IMPUNITY, STATEMENTS, VICTIM_PLEAS, PLEA_RULES, WITNESS_LINES, COURT_TEXT } from '../data/justice.js';
import { PURSE, REVOLT } from '../data/citizens.js';
import { BUILDINGS } from '../data/buildings.js';
import { engineOn } from './Engines.js';
import { roomFor } from './Citizens.js';
import { loyaltyLevel, shouldStrike, foodDaysLeft, isHangry } from './Loyalty.js';
import { townHappiness, foodSupply } from './TownStatus.js';
import { genitive, accusative } from '../utils/turkish.js';
import { countItem } from './Citizens.js';

// ---------------------------------------------------------------------------------------------------------------------- durum

export function emptyJustice() {
  return { cases: [], log: [], records: {}, stats: { committed: 0, caught: 0, unsolved: 0, byType: {} }, nextId: 1 };
}

/** (32.2) Mahkeme sayaçları (state.justice.stats.court; isteğe bağlı, ilk kararda kurulur). */
export function emptyCourtStats() {
  return { fair: 0, harsh: 0, cruel: 0, lenient: 0, lax: 0, stale: 0, exiled: 0, revealed: 0, decided: 0, waitMinutes: 0 };
}

/** Hiç suç işlenmemiş (kayda yazılmaz). */
export function justiceEmpty(j) {
  return !j || (!j.cases?.length && !j.log?.length && !Object.keys(j.records ?? {}).length && !(j.stats?.committed > 0) && !j.exiles?.length);
}

const NUM = (v, d = null) => (Number.isFinite(v) ? v : d);
const ID = (v) => (Number.isInteger(v) && v >= 0 ? v : null);
const STR = (v, n = 40) => (typeof v === 'string' ? v.slice(0, n) : null);
const COUNT = (v) => Math.max(0, Math.floor(Number(v) || 0));

function restoreCase(k) {
  if (!k || typeof k !== 'object' || !CRIMES[k.crime] || (ID(k.offenderId) === null && k.status === 'open')) return null;
  const s = k.stolen && typeof k.stolen === 'object' ? k.stolen : null;
  const ctx = k.context && typeof k.context === 'object' ? k.context : {};
  const v = k.verdict && typeof k.verdict === 'object' ? k.verdict : null;
  return {
    id: COUNT(k.id),
    day: Math.max(1, COUNT(k.day)),
    minute: COUNT(k.minute),
    crime: k.crime,
    variant: STR(k.variant, 20),
    severity: Math.max(1, Math.min(5, COUNT(k.severity) || 1)),
    motive: STR(k.motive, 20) ?? 'temptation',
    offenderId: ID(k.offenderId),
    offenderName: STR(k.offenderName) ?? '?',
    ...(ID(k.victimId) !== null || k.victimName ? { victimId: ID(k.victimId), victimName: STR(k.victimName) } : {}),
    ...(ID(k.buildingId) !== null ? { buildingId: ID(k.buildingId), buildingName: STR(k.buildingName) } : {}),
    stolen: s ? { ...(s.item ? { item: STR(s.item, 20) } : {}), ...(s.resource ? { resource: STR(s.resource, 20) } : {}), ...(s.coins ? { coins: true } : {}), amount: COUNT(s.amount), value: COUNT(s.value) } : null,
    ...(ID(k.witnessId) !== null || k.witnessName ? { witnessId: ID(k.witnessId), witnessName: STR(k.witnessName) } : {}),
    witnessIsGuard: Boolean(k.witnessIsGuard),
    context: {
      hungry: Boolean(ctx.hungry),
      coins: COUNT(ctx.coins),
      loyaltyTier: STR(ctx.loyaltyTier, 12) ?? 'calm',
      welfare: Math.round(NUM(ctx.welfare, 0)),
      trust: Math.round(NUM(ctx.trust, 0)),
      repeat: COUNT(ctx.repeat),
      ageStage: STR(ctx.ageStage, 12) ?? 'adult',
    },
    remorse: REMORSE.keys.includes(k.remorse) ? k.remorse : 'apologize',
    deadline: NUM(k.deadline, 0),
    status: k.status === 'open' ? 'open' : 'closed',
    verdict: v ? restoreVerdict(v) : null,
    ...(k.unsolved ? { unsolved: true } : {}),
    ...(Number.isFinite(k.closedDay) ? { closedDay: k.closedDay } : {}),
    // (32.2) isteğe bağlı mahkeme alanları
    ...(k.court ? { court: true } : {}),
    ...(k.revealed && typeof k.revealed === 'object' ? { revealed: { day: COUNT(k.revealed.day), witnessName: STR(k.revealed.witnessName) ?? '?' } } : {}),
    ...(k.statement && typeof k.statement === 'object' ? { statement: restoreStatement(k.statement) } : {}),
  };
}

/**
 * (32.2) Davanın alan sırası kayıttan dönenle aynı olsun (kaydet → yükle aynı JSON): nesnenin kimliği korunur, alanlar yerinde
 * yeniden dizilir. Mahkeme davayı değiştirdikçe (saraya geçiş, tanık, karar, hizmet bitişi) çağrılır.
 */
export function canonicalCase(k) {
  const c = restoreCase(k);
  if (!c) return k;
  for (const key of Object.keys(k)) delete k[key];
  return Object.assign(k, c);
}

/** (32.2) Kararın alan sırası ve biçimi sabit (çalışma anı ile kayıttan dönen aynı JSON'u versin). */
export function normalizeVerdict(v) {
  return restoreVerdict(v);
}

function restoreVerdict(v) {
  const out = { kind: STR(v.kind, 20) ?? 'warning', by: STR(v.by, 20) ?? 'elder', auto: Boolean(v.auto), ...(Number.isFinite(v.day) ? { day: v.day } : {}) };
  // (32.2) mahkeme kararının ayrıntıları (yalnızca varsa)
  if (Number.isFinite(v.at)) out.at = Math.round(v.at);
  if (BANDS.keys.includes(v.band)) out.band = v.band;
  if (Number.isFinite(v.harsh)) out.harsh = v.harsh;
  if (Number.isFinite(v.deserved)) out.deserved = Math.round(v.deserved * 100) / 100;
  if (v.stale) out.stale = true;
  if (COUNT(v.restitution)) out.restitution = COUNT(v.restitution);
  if (v.fine && typeof v.fine === 'object') out.fine = { asked: COUNT(v.fine.asked), paid: COUNT(v.fine.paid), hours: COUNT(v.fine.hours) };
  if (COUNT(v.service)) out.service = COUNT(v.service);
  if (v.served) out.served = true;
  if (Number.isFinite(v.impunity) && v.impunity > 0) out.impunity = v.impunity;
  if (v.effects && typeof v.effects === 'object') {
    const e = v.effects;
    out.effects = { trust: Math.round(NUM(e.trust, 0)), down: COUNT(e.down), up: COUNT(e.up), downPts: Math.round(NUM(e.downPts, 0)), upPts: Math.round(NUM(e.upPts, 0)) };
  }
  return out;
}

function restoreStatement(st) {
  const idx = (v) => (Number.isInteger(v) && v >= 0 && v < 8 ? v : 0);
  return {
    offender: idx(st.offender),
    witness: idx(st.witness),
    ...(VICTIM_PLEAS[st.plea] ? { plea: st.plea, pleaLine: idx(st.pleaLine) } : {}),
  };
}

/** Kayıttan gelen state.justice (isteğe bağlı): bozuk davalar atılır, kopuk kişi referansları silinir (ids verilirse). */
export function restoreJustice(data, ids = null) {
  if (!data || typeof data !== 'object') return null;
  const out = emptyJustice();
  out.cases = (Array.isArray(data.cases) ? data.cases : []).map(restoreCase).filter((k) => k && k.status === 'open');
  out.log = (Array.isArray(data.log) ? data.log : []).map(restoreCase).filter((k) => k && k.status === 'closed').slice(-JUSTICE.logSize);
  for (const [key, r] of Object.entries(data.records && typeof data.records === 'object' ? data.records : {})) {
    if (!/^\d+$/.test(key) || !r || typeof r !== 'object') continue;
    out.records[key] = { count: COUNT(r.count), lastDay: COUNT(r.lastDay) };
  }
  const st = data.stats && typeof data.stats === 'object' ? data.stats : {};
  out.stats = { committed: COUNT(st.committed), caught: COUNT(st.caught), unsolved: COUNT(st.unsolved), byType: {} };
  for (const k of CRIME_KEYS) if (COUNT(st.byType?.[k])) out.stats.byType[k] = COUNT(st.byType[k]);
  if (st.court && typeof st.court === 'object') {
    out.stats.court = emptyCourtStats();
    for (const key of Object.keys(out.stats.court)) out.stats.court[key] = COUNT(st.court[key]);
  }
  if (Array.isArray(data.exiles) && data.exiles.length) {
    out.exiles = data.exiles.filter((e) => e && typeof e.name === 'string').slice(-12).map((e) => ({ name: STR(e.name) ?? '?', day: COUNT(e.day), crime: CRIMES[e.crime] ? e.crime : 'innPilfer', band: BANDS.keys.includes(e.band) ? e.band : 'fair' }));
  }
  const maxId = Math.max(0, ...out.cases.map((k) => k.id), ...out.log.map((k) => k.id));
  out.nextId = Math.max(COUNT(data.nextId), maxId + 1, 1);
  return ids ? pruneJustice(out, ids) : out;
}

/**
 * Kopuk kişi referanslarını temizler (yerinde): suçlusu ayrılan / ölen AÇIK dava düşer; kapanmış davalarda ve açık davanın kurbanı /
 * tanığında kimlik null olur (ad kalır); sicilden silinir. ids: hayattaki sakin kimlikleri (Set). Dönüş: aynı nesne.
 */
export function pruneJustice(j, ids) {
  if (!j) return j;
  j.cases = j.cases.filter((k) => ids.has(k.offenderId));
  const scrub = (k) => {
    if (k.offenderId !== null && !ids.has(k.offenderId)) k.offenderId = null;
    if (Object.hasOwn(k, 'victimId') && k.victimId !== null && !ids.has(k.victimId)) k.victimId = null;
    if (Object.hasOwn(k, 'witnessId') && k.witnessId !== null && !ids.has(k.witnessId)) k.witnessId = null;
  };
  j.cases.forEach(scrub);
  j.log.forEach(scrub);
  for (const key of Object.keys(j.records)) if (!ids.has(Number(key))) delete j.records[key];
  return j;
}

// ---------------------------------------------------------------------------------------------------------------------- uygunluk

/** Motor bugün çalışıyor mu: şalter, erken oyun (ilk 5 gün) ve Mezra'da suç yok. */
export function justiceActive(state) {
  return engineOn('justice') && state.time.day >= JUSTICE.minDay && (state.town?.tier ?? 1) >= JUSTICE.minTier;
}

/** Suç işleyebilecek sakin (saatten bağımsız): Genç ve Yetişkin; rolsüz; seferde, ayrılırken, hasta, yaralı ya da yasta değil. */
export function crimeCandidate(state, c) {
  if (!c || c.role || c.isChild || c.isVenerable) return false;
  if (c.lifeStage !== 'youth' && c.lifeStage !== 'adult') return false; // Çocuk ve Kıdemli Bilge suç işlemez
  if (c.away || c.emigrating || c.newcomer || c.relocating || c.sentence?.exile) return false;
  if (c.illness || c.isInjured || c.mood?.grief) return false;
  return true;
}

/** (32.2) Uzaklaştırma cezası sürüyor mu (Han ve Pazar yasağı)? */
export function isBanned(state, c) {
  return engineOn('court') && Number.isFinite(c?.sentence?.banUntil) && state.totalMinutes < c.sentence.banUntil;
}

/**
 * (32.6a) Yasak bu planı engeller mi: uzaklaştırılmış sakin yasaklı yapıda (COURT.banVenues) yasaklı etkinliğe (COURT.banActivities)
 * plan alamaz. Plan üretilen ortak noktada (Brain.planGathering) çağrılır: davet edilen / randevuya çağrılan yasaklı sakin de kapsanır.
 */
export function banBlocks(state, c, building, activity = building?.type) {
  return Boolean(building) && COURT.banVenues.includes(building.type) && COURT.banActivities.includes(activity) && isBanned(state, c);
}

/** (32.2) Bugün kamu hizmetine çıkabilir mi: kalan saat var ve günlük tavan dolmadı. */
export function serviceDue(state, c) {
  const st = c?.sentence;
  if (!engineOn('court') || !st || !(st.service > 0)) return false;
  const today = st.serviceDay === state.time.day ? st.serviceToday ?? 0 : 0;
  return today < COURT.serviceDailyCap;
}

/** Şu an eyleme geçebilir mi: aday + uyanık; görevdeki bekçi, iş bırakan ya da (isyan saatinde) isyancı değil. */
export function crimeReady(state, c, hour = state.time.hour) {
  if (!crimeCandidate(state, c) || c.isSleeping) return false;
  const act = c.task?.activity;
  if (act === 'patrol' || act === 'strike' || act === 'protest' || act === 'loot') return false;
  if (state.trust?.revolt?.rioters?.includes(c.id) && hour >= REVOLT.hours[0] && hour < REVOLT.hours[1]) return false;
  if (shouldStrike(state, c, hour)) return false;
  return true;
}

/** Günün suç yuvası sayısı: 1; kasaba 20 sakini aşınca 2. */
export function slotsFor(state) {
  const n = state.characters.filter((c) => !c.role).length;
  return n > JUSTICE.slots.crowdedAbove ? JUSTICE.slots.crowded : JUSTICE.slots.base;
}

// ---------------------------------------------------------------------------------------------------------------------- risk

const step = (table, v) => (table.find((r) => v < r.below) ?? table[table.length - 1]).mul;

/** Kasabanın yürüyen ortalama refahı (yoksa anlık). */
export function welfareOf(state) {
  return Number.isFinite(state.town?.welfare) ? state.town.welfare : townHappiness(state);
}

export function trustOf(state) {
  return Number.isFinite(state.trust?.value) ? state.trust.value : 75;
}

/** Kıtlık: kiler bir günden az yeter. */
export function isFamine(state) {
  return foodDaysLeft(foodSupply(state), state.pulse?.eaten, state.characters.filter((c) => !c.role).length) < 1;
}

/** Aç mı (risk ve dava bağlamı için): "Açlıktan Gözü Dönmüş" ya da tokluk eşiğin altında. */
export function isHungry(c) {
  return isHangry(c) || (c.needs?.hunger ?? 100) < RISK.hunger[0].below;
}

/**
 * (32.4) Eğitim (systems/University.js → universityCrimeFactor): Darülfünun öğrencisi ×0,8, mezunu ×0,65; Bilgelik Evi mezunu ×0,85
 * yalnızca ENGINES.educationMerit açıkken (Darülfünun kurulmasa da suç tarihini değiştirdiği için ayrı alt anahtar). Kapalıyken 1.
 */
export function educationFactor(c) {
  return universityCrimeFactor(c);
}

/**
 * (32.5) Hobi evleri ve kulüpler (systems/Clubs.js → clubCrimeFactor): üye ×0,9; son 4 buluşmanın en az ikisine katılmış etkin üye
 * ×0,75 (data/clubs.js → CLUB_CRIME). Kulübü yoksa ya da şalter kapalıyken 1.
 */
export function clubFactor(c, state = null) {
  return clubCrimeFactor(state, c);
}

/**
 * (32.2) Cezasızlık: son IMPUNITY.days gündeki Adalet Sarayı kararlarından hafif (+1) / gevşek (+2) / sürüncemede kalan (+1) puanlar
 * riski artırır, her adil karar puanı fairDamp kadar söndürür. 1 + perPoint × puan (tavan cap). Saray kararı yoksa (Muhtar) 1.
 */
export function impunityFactor(state) {
  if (!engineOn('court')) return 1;
  const score = impunityScore(state);
  return Math.min(IMPUNITY.cap, 1 + IMPUNITY.perPoint * score);
}

/** (32.2) Cezasızlık puanı (0 ve üstü): son günlerin hafif / gevşek / sürüncemede kararları eksi adil kararlar. */
export function impunityScore(state, days = IMPUNITY.days) {
  const log = state.justice?.log;
  if (!log?.length) return 0;
  const from = state.time.day - days;
  let score = 0;
  for (const k of log) {
    const v = k.verdict;
    if (!v || v.by !== 'court' || !(k.closedDay > from)) continue;
    if (Number.isFinite(v.impunity)) score += v.impunity;
    if (v.band === 'fair') score -= IMPUNITY.fairDamp;
  }
  return Math.max(0, score);
}

/** Riskin çarpanları (hepsi 1 civarı): { poverty, hunger, loyalty, town, personality, education, club, impunity }. */
export function riskFactors(state, c) {
  const coins = (c.coins ?? 0) + clubPoverty(c); // (32.5) çantadaki Nakışlı Mendil kese yanında değer sayılır (yoksa 0)
  const poverty = step(RISK.poverty, coins);
  let hunger = isHangry(c) ? RISK.hangryMul : step(RISK.hunger, c.needs?.hunger ?? 100);
  if (isFamine(state)) hunger = Math.max(hunger, RISK.famineMul);
  const loyalty = RISK.loyalty[loyaltyLevel(c)] ?? 1;
  const town = step(RISK.welfare, welfareOf(state)) * step(RISK.trust, trustOf(state));
  let personality = c.lifeStage === 'youth' ? RISK.youthMul : 1;
  for (const t of c.traits ?? []) personality *= RISK.traits[t] ?? 1;
  if (c.quirk) personality *= RISK.quirks[c.quirk] ?? 1;
  // (32.3) renown: Barış Çeşmesi kasaba çapında riski düşürür (yoksa / şalter kapalıyken 1)
  return { poverty, hunger, loyalty, town, personality, education: educationFactor(c), club: clubFactor(c, state), impunity: impunityFactor(state), renown: renownCrimeFactor(state) };
}

/** Kişi başı günlük risk (0-1 civarı küçük sayı): taban × bütün çarpanlar. Aday değilse 0. */
export function crimeRisk(state, c, factors = null) {
  if (!crimeCandidate(state, c)) return 0;
  const f = factors ?? riskFactors(state, c);
  return JUSTICE.baseDaily * f.poverty * f.hunger * f.loyalty * f.town * f.personality * f.education * f.club * f.impunity * (f.renown ?? 1);
}

/** Motivasyon: riskin baskın çarpanından ('hunger' | 'poverty' | 'grudge' | 'temptation' | 'mischief'). Zar yok. */
export function motiveOf(c, f) {
  const list = [
    ['hunger', f.hunger],
    ['poverty', f.poverty],
    ['grudge', f.loyalty],
    ['grudge', f.town],
    [(c.traits ?? []).includes('grumpy') || (c.traits ?? []).includes('cheerful') ? 'mischief' : 'temptation', f.personality],
  ];
  let best = null;
  for (const [k, v] of list) if (!best || v > best[1]) best = [k, v];
  return best[1] >= RISK.dominantAt ? best[0] : 'temptation';
}

// ---------------------------------------------------------------------------------------------------------------------- seçenekler

const ok = (b) => b && b.functional && !b.damaged && !b.isBurning && !b.underConstruction;

function lean(c, crime) {
  let m = 1;
  for (const t of c.traits ?? []) m *= TRAIT_LEAN[t]?.[crime] ?? 1;
  if (c.quirk) m *= QUIRK_LEAN[c.quirk]?.[crime] ?? 1;
  return m;
}

/** Kese hırsızlığına uygun kurbanlar: rolsüz, çocuk olmayan, seferde olmayan, kesesi dolgun komşular. */
export function victimsFor(state, c, minCoins = CRIMES.pursePinch.variants.coins.minVictimCoins) {
  return state.characters.filter((o) => o !== c && !o.role && !o.isChild && !o.away && !o.emigrating && !o.sentence?.exile && (o.coins ?? 0) >= minCoins);
}

/**
 * Bu sakinin bu motivasyonla işleyebileceği suçlar: [[{ crime, variant, buildingId?, victimId? }, ağırlık], ...]. Çanta doluysa
 * eşya suçu, stok yetmiyorsa stok suçu seçilmez. Zar yok; çağıran izole üretecin weighted'ı ile seçer.
 */
export function crimeOptions(state, c, motive, rel = null) {
  const out = [];
  const push = (crime, variant, extra, w) => w > 0 && out.push([{ crime, variant, ...extra }, w]);
  for (const key of CRIME_KEYS) {
    const def = CRIMES[key];
    const w0 = (def.motives[motive] ?? 0) * lean(c, key);
    if (w0 <= 0) continue;
    if (def.victim) {
      const v = def.variants.coins;
      if (PURSE.max - (c.coins ?? 0) <= 0) continue;
      const vs = victimsFor(state, c, v.minVictimCoins);
      if (!vs.length) continue;
      // kırgınlıkta en kötü ilişkili komşu, öteki motivasyonlarda en dolgun kese öne çıkar
      const weights = vs.map((o) => (motive === 'grudge' && rel ? Math.max(0.2, 1 - (rel(c, o) ?? 0) / 50) : Math.min(4, (o.coins ?? 0) / 40 + 0.5)));
      const total = weights.reduce((a, b) => a + b, 0);
      vs.forEach((o, i) => push(key, 'coins', { victimId: o.id }, (w0 * weights[i]) / total));
      continue;
    }
    const targets = state.buildings.filter((b) => ok(b) && def.targets.includes(b.type));
    let pool = targets;
    if (key === 'woodpile') {
      const piles = targets.filter((b) => b.type === 'woodpile');
      pool = piles.length ? piles : targets.filter((b) => b.type === 'storage');
    }
    if (!pool.length) continue;
    const variants = Object.entries(def.variants).filter(([, v]) => variantPossible(state, c, v, pool[0]));
    if (!variants.length && key !== 'innPilfer') continue;
    for (const b of pool) {
      const vv = key === 'innPilfer' ? Object.entries(def.variants).filter(([, v]) => variantPossible(state, c, v, b)) : variants;
      for (const [vk] of vv) push(key, vk, { buildingId: b.id }, w0 / pool.length / vv.length);
    }
  }
  return out;
}

/** Bu çeşit şu an mümkün mü (çantada yer, stok)? */
export function variantPossible(state, c, v, building = null) {
  if (v.item && roomFor(c, v.item) <= 0) return false;
  if (v.source === 'stock' && (state.resources[v.resource] ?? 0) < v.minStock) return false;
  if (v.source === 'inn' && (!building || (building[v.field] ?? 0) < v.minStock)) return false;
  return true;
}

/**
 * Çalınacak miktar (saf): { item?|resource?|coins?, amount, value } ya da null (mümkün değil). roll: izole üreteçten [0,1).
 * Tek olayda stoğun ~%2'si (en çok cap) ya da en çok ~10 altın; kıtlıkta erzak yarıya iner; çantadaki yer kadar.
 */
export function crimeAmount(state, c, plan, roll = 0, { building = null, victim = null } = {}) {
  const def = CRIMES[plan.crime];
  const v = def?.variants[plan.variant];
  if (!v || v.source === 'none') return null;
  const range = (r) => r[0] + Math.floor(roll * (r[1] - r[0] + 1));
  let amount = 0;
  if (v.source === 'stock') {
    const stock = state.resources[v.resource] ?? 0;
    if (stock < v.minStock) return null;
    amount = Math.max(1, Math.min(v.cap, Math.round(stock * v.share)));
    if (def.famineHalves && isFamine(state)) amount = Math.max(1, Math.floor(amount / 2));
    amount = Math.min(amount, stock, roomFor(c, v.item));
  } else if (v.source === 'inn') {
    if (!building || (building[v.field] ?? 0) < v.minStock) return null;
    amount = Math.min(range(v.amount), building[v.field], roomFor(c, v.item));
  } else if (v.source === 'stall') {
    amount = Math.min(range(v.amount), roomFor(c, v.item));
  } else if (v.source === 'purse') {
    if (!victim || (victim.coins ?? 0) < v.minVictimCoins) return null;
    amount = Math.min(range(v.amount), Math.floor((victim.coins ?? 0) * v.victimShare), PURSE.max - (c.coins ?? 0));
  }
  if (!(amount >= 1)) return null;
  const out = v.coins ? { coins: true, amount } : { item: v.item, ...(v.resource ? { resource: v.resource } : {}), amount };
  out.value = amount * (v.value ?? 1);
  return out;
}

/** Suçun ağırlığı (1-5): çeşidin ya da haylazlık hedefinin ağırlığı. */
export function severityOf(plan, building = null) {
  const def = CRIMES[plan.crime];
  if (plan.crime === 'pettyVandal') return VANDAL_TEXT[VANDAL_GROUP[building?.type] ?? 'bench']?.severity ?? 1;
  return def?.variants[plan.variant]?.severity ?? def?.severity?.[0] ?? 1;
}

// ---------------------------------------------------------------------------------------------------------------------- yakalanma

const tileOf = (b) => {
  const { w, h } = BUILDINGS[b.type]?.size ?? { w: 1, h: 1 };
  return { x: b.tileX + (w - 1) / 2, y: b.tileY + (h - 1) / 2 };
};

/** Gece mi (21:00-05:59)? */
export function isNight(hour) {
  const [a, b] = CATCH.nightHours;
  return hour >= a || hour < b;
}

/** Nöbetteki bekçiler: kullanılabilir Gözcü Kulesi'nin çalışanlarından şu an 'patrol' görevinde olanlar. */
export function guardsWatching(state, spot) {
  const towers = state.buildings.filter((b) => b.type === 'guardTower' && ok(b));
  const out = [];
  for (const t of towers) {
    const p = tileOf(t);
    if (Math.hypot(p.x - spot.x, p.y - spot.y) > CATCH.guardRange) continue;
    for (const id of t.workerIds ?? []) {
      const g = state.characters.find((x) => x.id === id);
      if (g && g.task?.activity === 'patrol' && !g.isSleeping && !out.includes(g)) out.push(g);
    }
  }
  return out;
}

/**
 * Yakalanma olasılığı (saf): { p, witnesses: [{ id, name, p, guard }], night, secluded }. Yakındaki uyanık sakinler ve nöbetteki
 * bekçiler artırır, gece ve tenha yer düşürür. spot: olay yeri karosu { x, y }.
 */
export function catchChance(state, offender, spot, { hour = state.time.hour, victim = null } = {}) {
  const witnesses = [];
  const guards = guardsWatching(state, spot).filter((g) => g !== offender);
  for (const g of guards) witnesses.push({ id: g.id, name: g.name, p: CATCH.guard, guard: true });
  let anyone = false;
  for (const o of state.characters) {
    if (o === offender || o.role || o.away || !o.visible || o.isSleeping || o.insideBuildingId) continue;
    const d = Math.hypot((o.tileX ?? 0) - spot.x, (o.tileY ?? 0) - spot.y);
    if (d <= CATCH.secludedRadius) anyone = true;
    if (d > CATCH.witnessRadius || guards.includes(o)) continue;
    const p = o === victim ? CATCH.victim : CATCH.resident * (o.isChild ? CATCH.childMul : 1);
    witnesses.push({ id: o.id, name: o.name, p, guard: false });
  }
  const night = isNight(hour);
  const secluded = !anyone && !guards.length;
  let miss = 1 - CATCH.hidden;
  for (const w of witnesses) miss *= 1 - w.p;
  let p = 1 - miss;
  if (night) p *= CATCH.night;
  if (secluded) p *= CATCH.secluded;
  p = Math.max(CATCH.min, Math.min(CATCH.max, p));
  return { p, witnesses, night, secluded };
}

/** Pişmanlık ağırlıkları: [[anahtar, ağırlık], ...] (motivasyon × kişilik). */
export function remorseWeights(c, motive) {
  const base = REMORSE.byMotive[motive] ?? REMORSE.byMotive.temptation;
  return REMORSE.keys.map((k) => {
    let w = base[k] ?? 1;
    for (const t of c.traits ?? []) w *= REMORSE.traits[t]?.[k] ?? 1;
    return [k, w];
  });
}

// ---------------------------------------------------------------------------------------------------------------------- karar

/** (32.2) Adalet Sarayı: kullanılabilir yapı; ENGINES.court kapalıyken (ya da justice kapalıyken) her zaman null (32.1 Muhtar kuralı). */
export function courtOf(state) {
  if (!engineOn('court')) return null;
  return state.buildings.find((b) => b.type === JUSTICE.courtType && ok(b)) ?? null;
}

/**
 * Süresi dolan açık davanın kendiliğinden kararı: Adalet Sarayı yokken bir gün sonra Muhtar uyarısı. Saray varsa (32.2) ya da
 * süre dolmadıysa null. Güven / sadakat / refah etkisi yok; yalnızca sicile yazılır.
 */
export function autoVerdict(state, k, now = state.totalMinutes) {
  if (!k || k.status !== 'open' || now < k.deadline || courtOf(state)) return null;
  return { kind: 'warning', by: 'elder', auto: true };
}

// ---------------------------------------------------------------------------------------------------------------------- ölçüler

/** Son 8 günde sakin başına suç (işlenen ve yakalanmayan dahil). 32.3 Krallık İtibarı kullanır. */
export function crimeRate(state, days = JUSTICE.rateDays) {
  const j = state.justice;
  const n = state.characters.filter((c) => !c.role).length;
  if (!j || !n) return 0;
  const from = state.time.day - days;
  const count = [...j.cases, ...j.log].filter((k) => k.day > from).length;
  return count / n;
}

/** Yakalanan / işlenen (hiç suç yoksa 1). */
export function solvedRatio(state) {
  const s = state.justice?.stats;
  return s?.committed ? s.caught / s.committed : 1;
}

/**
 * (32.2) 32.3 Krallık İtibarı'nın kullanacağı adalet ölçüsü (saf): son `n` Adalet Sarayı kararında adil oranı, zalim sayısı, bant
 * dağılımı; cezasızlık puanı; Muhtar uyarıları ve sürüncemede kalan davalar AYRI sayılır (bantlara girmez).
 * Dönüş: { verdicts, fairRatio, cruel, bands: { fair, harsh, cruel, lenient, lax }, impunity, impunityFactor, elder, stale, exiled }.
 */
export function justiceRecord(state, n = 10) {
  const log = state.justice?.log ?? [];
  const bands = { fair: 0, harsh: 0, cruel: 0, lenient: 0, lax: 0 };
  const court = log.filter((k) => k.verdict?.by === 'court' && !k.verdict.stale && bands[k.verdict.band] !== undefined).slice(-n);
  for (const k of court) bands[k.verdict.band] += 1;
  const elder = log.filter((k) => k.verdict?.by === 'elder').length;
  const stale = log.filter((k) => k.verdict?.stale).length;
  return {
    verdicts: court.length,
    fairRatio: court.length ? bands.fair / court.length : 1,
    cruel: bands.cruel,
    bands,
    impunity: impunityScore(state),
    impunityFactor: impunityFactor(state),
    elder,
    stale,
    exiled: state.justice?.stats?.court?.exiled ?? 0,
  };
}

// ---------------------------------------------------------------------------------------------------------------------- (32.2) dava

/** Sakinin ailesi (eş, çocuklar, ebeveynler, kardeşler; kasabada olanlar). Saf; kimlik sırasıyla. */
export function kinOf(state, c) {
  if (!c) return [];
  const parents = new Set([...(c.parentIds ?? []), ...(c.parents ?? [])]);
  const out = state.characters.filter((o) => {
    if (o === c || o.role) return false;
    if (o.id === c.partnerId) return true;
    if (parents.has(o.id)) return true;
    if ((o.parentIds ?? []).includes(c.id) || (o.parents ?? []).includes(c.id) || (c.children ?? []).includes(o.id)) return true;
    const op = [...(o.parentIds ?? []), ...(o.parents ?? [])];
    return op.some((id) => parents.has(id)); // kardeş
  });
  return out.sort((a, b) => a.id - b.id);
}

/** Suçlu sicildeki kaçıncı suçunda (bu dava dahil): 1 = ilk suçu. */
export function recordNumber(k) {
  return (k.context?.repeat ?? 0) + 1;
}

/** Kurbanın sözü (kurban sakinse; zar yok): 'forgive' | 'restore' | 'lesson' | null. rel: ilişki puanı (kurban -> suçlu). */
export function victimPlea(state, k, victim, rel = 0) {
  if (!victim) return null;
  const offender = state.characters.find((x) => x.id === k.offenderId) ?? null;
  const traits = victim.traits ?? [];
  if (rel >= PLEA_RULES.forgiveAt || (traits.some((t) => PLEA_RULES.forgiveTraits.includes(t)) && (offender?.lifeStage === 'youth' || k.motive === 'hunger'))) return 'forgive';
  if (rel <= PLEA_RULES.lessonBelow || traits.some((t) => PLEA_RULES.lessonTraits.includes(t)) || recordNumber(k) > 1) return 'lesson';
  return 'restore';
}

/** Çalınan şimdi nerede ve iade edilebilir mi: { possible, amount, reason } (saf; suçlunun çantası / kesesi). */
export function restitutionStatus(state, k, offender = null) {
  const s = k.stolen;
  if (!s || !(s.amount > 0)) return { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.none };
  const c = offender ?? state.characters.find((x) => x.id === k.offenderId);
  if (!c) return { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.gone };
  if (s.coins) {
    const n = Math.min(s.amount, c.coins ?? 0);
    const victim = Number.isInteger(k.victimId) ? state.characters.find((x) => x.id === k.victimId) : null;
    if (!victim) return { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.gone };
    return n > 0 ? { possible: true, amount: n, reason: '' } : { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.gone };
  }
  const n = Math.min(s.amount, countItem(c, s.item));
  if (n <= 0) return { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.gone };
  if (CRIMES[k.crime]?.variants[k.variant]?.source === 'inn' && !state.buildings.some((b) => b.id === k.buildingId)) return { possible: false, amount: 0, reason: COURT_TEXT.restitutionOff.building };
  return { possible: true, amount: n, reason: '' };
}

/**
 * Hak edilen sertlik (0-6, saf): severity tabanı + bağlam (açlık, yoksulluk, pişmanlık, tekrar, gençlik, kurbanın sözü, iade).
 * opts: { restitution: bool (iade ettirilecek mi), famine: bool, plea } — verilmezse durumdan okunur.
 */
export function deserved(k, state, opts = {}) {
  const parts = deservedParts(k, state, opts);
  const v = parts.reduce((a, p) => a + p.value, 0);
  return snapDeserved(Math.max(DESERVED.min, Math.min(DESERVED.max, Math.round(v * 100) / 100)));
}

/**
 * Boşluk kuralı: hiçbir cezanın adil penceresine (sertlik ± BANDS.fairWithin) düşmeyen değer (ör. 4,25 ile 5,25 arası: ağır ceza 3,5
 * ile sürgün 6'nın arası) en yakın pencere kenarına yaslanır. Böylece her davada en az bir ceza "Adil" olur.
 */
export function snapDeserved(v) {
  const w = BANDS.fairWithin;
  const points = [...new Set(SENTENCE_KEYS.map((k) => SENTENCES[k].harsh))].sort((a, b) => a - b);
  if (points.some((p) => Math.abs(v - p) <= w)) return v;
  let best = v;
  let gap = Infinity;
  for (const p of points) {
    for (const edge of [p - w, p + w]) {
      const d = Math.abs(v - edge);
      if (d < gap - 1e-9) {
        gap = d;
        best = edge;
      }
    }
  }
  return Math.round(best * 100) / 100;
}

/** deserved'in kalemleri: [{ key, value }] (sonuç ekranının nedeni ve testler için). */
export function deservedParts(k, state, { restitution = false, famine = null, plea = undefined } = {}) {
  const ctx = k.context ?? {};
  const parts = [{ key: 'severity', value: k.severity ?? 1 }];
  if (ctx.hungry) parts.push({ key: 'hungry', value: (famine ?? isFamine(state)) ? DESERVED.hungryFamine : DESERVED.hungry });
  if ((ctx.coins ?? 0) < DESERVED.poorBelow) parts.push({ key: 'poor', value: DESERVED.poor });
  const witness = Boolean(k.witnessName) || Boolean(k.revealed);
  const r = k.remorse;
  if (r === 'deny' && witness) parts.push({ key: 'deny', value: DESERVED.denyWitness });
  else if (DESERVED.remorse[r] !== undefined) parts.push({ key: r, value: DESERVED.remorse[r] });
  if (ctx.repeat > 0) parts.push({ key: 'repeat', value: Math.min(COURT.recordCap, ctx.repeat * DESERVED.repeat) });
  if (ctx.ageStage === 'youth') parts.push({ key: 'youth', value: DESERVED.youth });
  const pl = plea === undefined ? k.statement?.plea ?? null : plea;
  if (pl && DESERVED.plea[pl]) parts.push({ key: pl, value: DESERVED.plea[pl] });
  if (!restitution && restitutionStatus(state, k).possible) parts.push({ key: 'unreturned', value: DESERVED.unreturned });
  return parts;
}

/** Bant: fark = seçilen − hak edilen. 'fair' | 'harsh' | 'cruel' | 'lenient' | 'lax'. */
export function verdictBand(diff) {
  if (Math.abs(diff) <= BANDS.fairWithin) return 'fair';
  if (diff > 0) return diff <= BANDS.harshTo ? 'harsh' : 'cruel';
  return diff >= BANDS.lenientTo ? 'lenient' : 'lax';
}

/** Para cezası tutarı (altın): hafif ≈ çalınanın değeri, ağır ≈ 3 katı (tavanlı); değersiz suçta ağırlıktan. */
export function fineAmount(k, kind) {
  const value = k.stolen?.value ?? 0;
  const base = value > 0 ? value : (k.severity ?? 1) * FINE.perSeverity;
  if (kind === 'fineLight') return Math.max(FINE.lightMin, Math.round(base));
  if (kind === 'fineHeavy') return Math.min(FINE.heavyCap, Math.max(FINE.heavyMin, Math.round(base * FINE.heavyMul)));
  return 0;
}

/** Kese yetmezse kalan altının kamu hizmeti karşılığı: { paid, hours }. */
export function finePlan(coins, amount) {
  const paid = Math.min(Math.max(0, Math.floor(coins ?? 0)), amount);
  const hours = Math.ceil((amount - paid) / COURT.fineHourCoins);
  return { paid, hours };
}

/** Her cezanın seçilebilirliği: HER ceza HER suçta seçilebilir (kısıt yok); yalnızca ayrıntı metni döner. */
export function sentenceOptions(state, k) {
  return SENTENCE_KEYS.map((key) => {
    const def = SENTENCES[key];
    let detail = def.detail;
    if (key === 'fineLight' || key === 'fineHeavy') {
      const c = state.characters.find((x) => x.id === k.offenderId);
      const amount = fineAmount(k, key);
      const plan = finePlan(c?.coins ?? 0, amount);
      detail = `${amount} altın kesesinden hazineye${plan.hours ? ` (kesesinde ${plan.paid} var: kalanı ${plan.hours} saat kamu hizmeti)` : ''}.`;
    }
    return { key, name: def.name, harsh: def.harsh, icon: def.icon, detail, enabled: true };
  });
}

/** Davanın bağlam satırları (gerçekler, puan değil): [{ label, value }]. */
export function caseFacts(state, k, tierName = (t) => t) {
  const ctx = k.context ?? {};
  const rows = [
    { label: 'Aç mıydı', value: ctx.hungry ? 'Evet, karnı açtı' : 'Hayır' },
    { label: 'Kesesinde', value: `${ctx.coins ?? 0} altın` },
    { label: 'Yönetime bakışı', value: tierName(ctx.loyaltyTier ?? 'calm') },
    { label: 'Sicil', value: recordNumber(k) === 1 ? 'İlk suçu' : `${recordNumber(k)}. suçu` },
  ];
  if (k.stolen) {
    const st = restitutionStatus(state, k);
    rows.push({ label: 'Çalınan', value: `${lootText(k.stolen)} (değeri ${k.stolen.value} altın) · ${st.possible ? (k.stolen.coins ? 'kesesinde hâlâ duruyor' : 'çantasında hâlâ duruyor') : st.reason.toLocaleLowerCase('tr')}` });
  }
  return rows;
}

/** Suçlunun ifadesi (motivasyon × pişmanlık; değişken davada yazılı). */
export function statementText(k) {
  // (32.6b) plan sabah 08:00'da açlığa göre yapılır, suç saatler sonra işlenir: o an karnı doyduysa (dosyada "Aç mıydı: Hayır") ifade
  // açlıktan söz etmez (oyun günlüğü 6: "midem kazınıyordu" ile "Aç mıydı: Hayır" çelişiyordu). Yalnızca metin: motivasyon, zar ve hak edilen aynı.
  const motive = k.motive === 'hunger' && !k.context?.hungry ? 'temptation' : k.motive;
  const lines = STATEMENTS[motive]?.[k.remorse] ?? STATEMENTS.temptation.confess;
  const line = lines[(k.statement?.offender ?? 0) % lines.length];
  return fill(line, { loot: k.stolen ? lootText(k.stolen) : 'onu' });
}

/** Tanığın ifadesi (yoksa null): bekçi "Kasaba bekçisi", sonradan konuşan tanık ayrı söz. */
export function witnessText(k) {
  if (!k.witnessName) return null;
  const pool = k.revealed ? WITNESS_LINES.revealed : k.witnessIsGuard ? WITNESS_LINES.guard : WITNESS_LINES.resident;
  const line = pool[(k.statement?.witness ?? 0) % pool.length];
  return fill(line, { witness: k.witnessName, who: k.offenderName, whoAcc: accusative(k.offenderName) });
}

/** Kurbanın sözü (yoksa null). */
export function pleaText(k) {
  const p = VICTIM_PLEAS[k.statement?.plea];
  if (!p || !k.victimName) return null;
  return `${k.victimName}: "${p.lines[(k.statement.pleaLine ?? 0) % p.lines.length]}"`;
}

// ---------------------------------------------------------------------------------------------------------------------- metinler

export function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}

const cap = (s) => (s ? s[0].toLocaleUpperCase('tr') + s.slice(1) : s);

/** "2 testi şerbet", "6 altın", "bir hatıra (Boncuk Kolye)". */
export function lootText(stolen, name = null) {
  if (!stolen) return '';
  const word = LOOT_WORDS[stolen.coins ? 'coins' : stolen.item] ?? 'şey';
  if (name) return `bir ${word} (${name})`;
  return `${stolen.amount} ${word}`;
}

/** Davanın metin değişkenleri. */
export function caseVars(k, { lootName = null, buildingType = null } = {}) {
  const def = CRIMES[k.crime];
  const loot = lootText(k.stolen, lootName);
  const vt = VANDAL_TEXT[VANDAL_GROUP[buildingType] ?? 'bench'];
  const place = buildingType === 'woodpile' ? "Odun Yığını'ndan" : 'kilerden';
  const vars = {
    who: k.offenderName,
    witness: k.witnessName ?? '',
    loot,
    place,
    placeCap: cap(place),
    victimGen: k.victimName ? genitive(k.victimName) : 'birinin',
    victimGenCap: k.victimName ? genitive(k.victimName) : 'Birinin',
    vandalAct: vt.act,
    vandalDid: vt.did,
    vandalPast: vt.past,
  };
  vars.act = fill(def.text.act, vars);
  vars.did = fill(def.text.did, vars);
  vars.lost = fill(def.text.lost, vars);
  vars.actCap = cap(vars.act);
  vars.didCap = cap(vars.did);
  vars.seen = k.witnessName ? fill(k.witnessIsGuard ? CRIME_TEXT.seenGuard : CRIME_TEXT.seenWitness, vars) : CRIME_TEXT.seenNone;
  return vars;
}

/** Hikâye kartı / günlük metni: 'caught' | 'unsolved' | 'journalCaught' | 'journalUnsolved' | 'memory*'. */
export function caseText(k, key, opts = {}) {
  return fill(CRIME_TEXT[key], caseVars(k, opts));
}
