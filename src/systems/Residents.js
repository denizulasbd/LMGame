// (33.1) Rastgele kadro: yeni sakinleri (başlangıç altılısı, göçmenler, yeni doğanlar) üreten SAF hesaplar. Durum değiştirmez; rastgelelik
// yalnızca verilen üreteçten gelir. Ad havuzu data/names.js, kurallar ve olasılıklar data/cast.js, özellik / görünüş parçaları data/characters.js.
// Sakinlerin KARARLARINA şans eklenmez: çeşitlilik yalnızca farklı insanlardan (ad, görünüş, kişilik, yaş) gelir.
import { TRAITS, APPEARANCE_PARTS, RESIDENT_POOL, IMMIGRANT_AGE } from '../data/characters.js';
import { RESIDENT_NAMES } from '../data/names.js';
import { START_CAST, FAMILIAR, GRAY_HAIR, RECENT_NAMES_KEEP } from '../data/cast.js';
import { clashesWithOwn } from '../ai/TraitProfile.js';
import { compoundName } from '../utils/names.js';

/** Kasabada yaşayanların ve son vefat eden / ayrılan / sürgün edilenlerin adları: yeni gelene verilmez. */
export function unavailableNames(state) {
  return new Set([...(state.characters ?? []).map((c) => c.name), ...(state.recentNames ?? [])]);
}

/** Son ayrılanlar listesine bir ad ekler (en çok RECENT_NAMES_KEEP; aynı ad tekrar yazılmaz, en yeni sonda). */
export function rememberDeparted(list, name) {
  const next = list.filter((n) => n !== name);
  next.push(name);
  return next.slice(-RECENT_NAMES_KEEP);
}

/** Kayıttan gelen son ayrılanlar listesi: yalnızca kısa metinler, en çok RECENT_NAMES_KEEP. */
export function restoreRecentNames(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((n) => typeof n === 'string' && n.trim()).map((n) => n.slice(0, 40)).slice(-RECENT_NAMES_KEEP);
}

/** Ad havuzundan boştaki bir ad; havuz biterse iki addan oluşan ad (compoundName). */
export function pickName(rng, taken) {
  const free = RESIDENT_NAMES.filter((n) => !taken.has(n));
  return free.length ? rng.pick(free) : compoundName(rng, RESIDENT_NAMES, taken);
}

/** İki özellik; birbirinin zıddı olanlar (Çalışkan ve Uykucu gibi) aynı kişide bulunmaz. */
export function rollTraits(rng) {
  const traitKeys = [];
  for (const key of rng.shuffle(Object.keys(TRAITS))) {
    if (traitKeys.length < 2 && !clashesWithOwn(traitKeys, key)) traitKeys.push(key);
  }
  return traitKeys;
}

/** Görünüş parçaları APPEARANCE_PARTS'tan; yaşlıların saçı çoğunlukla gri. */
export function rollAppearance(rng, age) {
  const appearance = Object.fromEntries(Object.entries(APPEARANCE_PARTS).map(([k, options]) => [k, rng.pick(options)]));
  if (age >= GRAY_HAIR.fromAge && rng.chance(GRAY_HAIR.chance)) appearance.hairColor = 'gray';
  return appearance;
}

/** Göçmen yaşı (data/characters.js -> IMMIGRANT_AGE). */
export function rollImmigrantAge(rng) {
  return rng.int(IMMIGRANT_AGE.min, IMMIGRANT_AGE.max);
}

/**
 * Tek bir yeni sakin: { name, age, traits, appearance }.
 * @param {import('../utils/random.js').Random} rng
 * @param {{ taken?: Set<string>, age?: number, traits?: string[] }} options taken: alınamayacak adlar; age / traits verilirse üretilmez
 */
export function makeResident(rng, { taken = new Set(), age = null, traits = null } = {}) {
  const name = pickName(rng, taken);
  const years = Number.isFinite(age) ? age : rollImmigrantAge(rng);
  return { name, age: years, traits: traits ?? rollTraits(rng), appearance: rollAppearance(rng, years) };
}

/** Başlangıç kadrosunun bozduğu güvenlik kuralları (boşsa kadro güvenli). Parça: [{ age, traits }]. Testler de kullanır. */
export function castProblems(cast) {
  const C = START_CAST;
  const problems = [];
  if (cast.filter((r) => r.age >= C.minWorking.min && r.age <= C.minWorking.max).length < C.minWorking.count) problems.push('çalışma çağında az kişi');
  if (cast.filter((r) => r.age > C.maxElders.over).length > C.maxElders.count) problems.push('çok yaşlı');
  if (!cast.some((r) => r.age >= C.wise.min && r.age <= C.wise.max)) problems.push('bilgeleşecek kişi yok');
  const counts = {};
  for (const r of cast) for (const t of r.traits) counts[t] = (counts[t] ?? 0) + 1;
  if (Object.values(counts).some((n) => n > C.maxSameTrait)) problems.push('aynı özellik çok');
  if (cast.filter((r) => r.traits.some((t) => C.usefulTraits.includes(t))).length < C.minUseful) problems.push('işe yarar özellik az');
  return problems;
}

function rollAge(rng) {
  const bracket = rng.weighted(START_CAST.ageBrackets.map((b) => [b, b.weight]));
  return rng.int(bracket.min, bracket.max);
}

/**
 * Yeni oyunun başlangıç altılısı. Önce yaş ve özellikler (ucuz) denenir; kurallar tutmazsa yeniden dener, tutan plana ad ve görünüş verilir.
 * FAMILIAR.startChance olasılıkla bir yer elle yazılmış tanıdık yüzlerden birinindir (kendi yaşı ve özellikleriyle; kurallar onu da sayar).
 * @param {import('../utils/random.js').Random} rng
 * @param {{ taken?: Set<string> }} options taken: alınamayacak adlar
 * @returns {{ name: string, age: number, traits: string[], appearance: object }[]}
 */
export function makeStartingCast(rng, { taken = new Set() } = {}) {
  const C = START_CAST;
  const candidates = RESIDENT_POOL.filter((r) => !taken.has(r.name));
  const familiar = candidates.length && rng.chance(FAMILIAR.startChance) ? structuredClone(rng.pick(candidates)) : null;
  const randomCount = C.count - (familiar ? 1 : 0);

  let plan = null;
  for (let attempt = 0; attempt < C.maxAttempts && !plan; attempt++) {
    const tryPlan = Array.from({ length: randomCount }, () => ({ age: rollAge(rng), traits: rollTraits(rng) }));
    if (castProblems(familiar ? [familiar, ...tryPlan] : tryPlan).length === 0) plan = tryPlan;
  }
  // Pratikte hiç: rastgele denemeler tükenirse güvenli sabit plan (tanıdık yüz yoksa tam altılı)
  if (!plan) {
    plan = C.fallback.slice(0, randomCount).map((p) => ({ age: p.age, traits: [...p.traits] }));
  }

  const used = new Set(taken);
  if (familiar) used.add(familiar.name);
  const cast = plan.map((p) => {
    const resident = makeResident(rng, { taken: used, age: p.age, traits: p.traits });
    used.add(resident.name);
    return resident;
  });
  if (familiar) cast.splice(rng.int(0, cast.length), 0, familiar); // tanıdık yüz rastgele bir sırada (ev dağılımı sıraya bakar)
  return cast;
}

/** Göçmen için: FAMILIAR.immigrantChance olasılıkla boştaki bir tanıdık yüz, yoksa yepyeni biri. */
export function pickImmigrant(rng, taken) {
  if (rng.chance(FAMILIAR.immigrantChance)) {
    const available = RESIDENT_POOL.filter((r) => !taken.has(r.name));
    if (available.length) return structuredClone(rng.pick(available));
  }
  return makeResident(rng, { taken });
}
