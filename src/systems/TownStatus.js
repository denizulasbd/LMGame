// Kasabanın genel durumu için saf hesaplar (durum değiştirmez): sakin ve kasaba mutluluğu (refah),
// konut kapasitesi, göç koşulları ve kasaba çapındaki geçici bonuslar. Sistemler ve arayüz
// aynı hesabı kullansın diye tek yerde.
import { BUILDINGS } from '../data/buildings.js';
import { HAPPINESS_WEIGHTS, HAPPINESS_LEVELS, IMMIGRATION, TOWN_BUFFS } from '../data/town.js';

/** Bir sakinin mutluluğu 0-100: ihtiyaçlarının ağırlıklı ortalaması. */
export function happinessOf(character) {
  let total = 0;
  for (const [need, weight] of Object.entries(HAPPINESS_WEIGHTS)) total += character.needs[need] * weight;
  return total;
}

/**
 * Kasabanın ortalama mutluluğu (sakin yoksa 0); anıt ve onarılmış gözetleme kulesi kalıcı puan ekler
 * (en çok 100).
 */
export function townHappiness(state) {
  const people = state.characters;
  if (people.length === 0) return 0;
  const average = people.reduce((sum, c) => sum + happinessOf(c), 0) / people.length;
  return Math.min(100, average + (prestige(state)?.happinessBonus ?? 0) + landmarkBonus(state));
}

/** Tamamlanmış prestij yapısının (anıt) kalıcı bonusu ya da null. */
export function prestige(state) {
  const building = state.buildings.find((b) => b.functional && BUILDINGS[b.type].prestige);
  return building ? BUILDINGS[building.type].prestige : null;
}

/** Ortalama keyif (şenlik koşulu). */
export function townFun(state) {
  const people = state.characters;
  if (people.length === 0) return 0;
  return people.reduce((sum, c) => sum + c.needs.fun, 0) / people.length;
}

export function happinessLevel(value) {
  return HAPPINESS_LEVELS.find((level) => value >= level.min) ?? HAPPINESS_LEVELS[HAPPINESS_LEVELS.length - 1];
}

/** Tamamlanmış evlerdeki toplam yatak. */
export function housingCapacity(state) {
  return state.buildings.filter((b) => b.functional && b.capacity).reduce((sum, b) => sum + b.capacity, 0);
}

/**
 * Göçmenlere açık boş yatak: evli bir çiftin yaşadığı evlerin boş yatakları çocuklarına ayrılır.
 * Dönüş: { open, family } — göçmenlere açık ve ailelere ayrılmış boş yatak sayısı
 */
export function freeBeds(state) {
  let open = 0;
  let family = 0;
  for (const home of state.buildings) {
    if (!home.functional || !home.capacity) continue;
    const residents = state.characters.filter((c) => c.homeId === home.id);
    const free = Math.max(0, home.capacity - residents.length);
    if (residents.some((c) => c.married)) family += free;
    else open += free;
  }
  return { open, family };
}

/** Onarılmış kadim yapıların (gözetleme kulesi) kasaba refahına kalıcı katkısı. */
export function landmarkBonus(state) {
  return state.buildings
    .filter((b) => b.functional && BUILDINGS[b.type].townBonus)
    .reduce((sum, b) => sum + BUILDINGS[b.type].townBonus.happiness, 0);
}

/**
 * Göç koşulları ve her birinin durumu (HUD ipucu ve EventSystem aynı sonucu kullanır).
 * Dönüş: { ok, freeBeds, checks: [{ key, ok, text }] }
 */
export function immigrationStatus(state) {
  const population = state.characters.length;
  const beds = freeBeds(state);
  const freeBedCount = Math.max(0, Math.min(beds.open, IMMIGRATION.maxPopulation - population));
  const foodNeeded = Math.max(IMMIGRATION.minFood, population * IMMIGRATION.foodPerResident);
  const happiness = townHappiness(state);
  const checks = [
    {
      key: 'beds',
      ok: freeBedCount > 0,
      text:
        population >= IMMIGRATION.maxPopulation
          ? `Nüfus sınırı (${IMMIGRATION.maxPopulation}) doldu`
          : freeBedCount > 0
            ? `${freeBedCount} boş yatak`
            : beds.family > 0
              ? 'Boş yatak yok (aile evlerindeki yataklar çocuklara ayrılı): kulübe kur'
              : 'Boş yatak yok: kulübe kur',
    },
    {
      key: 'food',
      ok: state.resources.food >= foodNeeded,
      text: `Yiyecek ${state.resources.food}/${foodNeeded}`,
    },
    {
      key: 'happiness',
      ok: happiness >= IMMIGRATION.minHappiness,
      text: `Refah %${Math.round(happiness)} (en az %${IMMIGRATION.minHappiness})`,
    },
  ];
  return { ok: checks.every((c) => c.ok), freeBeds: freeBedCount, checks };
}

// ---------------------------------------------------------------------------
// Kasaba bonusları: state.buffs = { anahtar: bitiş oyun dakikası }
// ---------------------------------------------------------------------------

export function isBuffActive(state, key) {
  return (state.buffs?.[key] ?? -1) > state.totalMinutes;
}

/** Etkin bonuslar: [{ key, name, icon, minutesLeft }] */
export function activeBuffs(state) {
  return Object.keys(TOWN_BUFFS)
    .filter((key) => isBuffActive(state, key))
    .map((key) => ({ key, ...TOWN_BUFFS[key], minutesLeft: state.buffs[key] - state.totalMinutes }));
}

/** Etkin bonusların bir alanının çarpımı (ör. 'workSpeed', 'funDecay'); bonus yoksa 1. */
export function buffMultiplier(state, field) {
  let value = 1;
  for (const key of Object.keys(TOWN_BUFFS)) {
    if (TOWN_BUFFS[key][field] !== undefined && isBuffActive(state, key)) value *= TOWN_BUFFS[key][field];
  }
  return value;
}
