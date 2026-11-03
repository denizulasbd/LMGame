// Kişilik özelliklerini (src/data/characters.js -> TRAITS) tek bir davranış profiline
// birleştirir. Çarpanlar çarpılır; günlük düzen ve eşikler sırayla üzerine yazılır.
// Çocukların düzeni ve boş zaman tercihleri özelliklerden bağımsızdır (data/family.js).
import {
  NEED_KEYS,
  TRAITS,
  OPPOSING_TRAITS,
  DEFAULT_SCHEDULE,
  DEFAULT_THRESHOLDS,
  DEFAULT_LEISURE,
  DEFAULT_WORK,
  WORK_HOURS,
} from '../data/characters.js';
import { CHILD_SCHEDULE, CHILD_LEISURE, CHILD_SPEED } from '../data/family.js';

/** İki özellik listesi arasındaki ilk çatışan çift ([a'nınki, b'ninki]) ya da null. */
export function clashingTraits(traitsA, traitsB) {
  for (const [x, y] of OPPOSING_TRAITS) {
    if (traitsA.includes(x) && traitsB.includes(y)) return [x, y];
    if (traitsA.includes(y) && traitsB.includes(x)) return [y, x];
  }
  return null;
}

/** Bu özelliğin zıddı (yoksa null). */
export function opposingTrait(key) {
  const pair = OPPOSING_TRAITS.find((p) => p.includes(key));
  return pair ? pair.find((k) => k !== key) : null;
}

/** Özellik listesine eklenince kendi içinde çatışma yaratır mı? */
export function clashesWithOwn(traitKeys, key) {
  const opposite = opposingTrait(key);
  return opposite !== null && traitKeys.includes(opposite);
}

/**
 * @param {string[]} traitKeys
 * @param {{ child?: boolean }} options child: çocuk profili (erken yatar, çalışmaz, oyun oynar)
 */
export function buildTraitProfile(traitKeys, { child = false } = {}) {
  const profile = {
    decay: Object.fromEntries(NEED_KEYS.map((k) => [k, 1])),
    gain: { ...Object.fromEntries(NEED_KEYS.map((k) => [k, 1])), nature: 1 },
    leisure: { ...DEFAULT_LEISURE },
    schedule: { ...DEFAULT_SCHEDULE },
    thresholds: { ...DEFAULT_THRESHOLDS },
    speed: 1,
    bubbleRate: 1,
    work: { speed: DEFAULT_WORK.speed, fatigue: 1, breakChance: DEFAULT_WORK.breakChance },
    rainLover: false,
    skillPreference: {},
    quarrelChance: 1,
  };

  for (const key of traitKeys) {
    const trait = TRAITS[key];
    if (!trait) continue;
    for (const [need, m] of Object.entries(trait.decay ?? {})) profile.decay[need] *= m;
    for (const [need, m] of Object.entries(trait.gain ?? {})) profile.gain[need] = (profile.gain[need] ?? 1) * m;
    for (const [activity, m] of Object.entries(trait.leisure ?? {})) {
      profile.leisure[activity] = (profile.leisure[activity] ?? 1) * m;
    }
    Object.assign(profile.schedule, trait.schedule ?? {});
    Object.assign(profile.thresholds, trait.thresholds ?? {});
    profile.speed *= trait.speed ?? 1;
    profile.bubbleRate *= trait.bubbleRate ?? 1;
    profile.quarrelChance *= trait.quarrelChance ?? 1;
    if (trait.rainLover) profile.rainLover = true;
    for (const [skill, tiles] of Object.entries(trait.skillPreference ?? {})) {
      profile.skillPreference[skill] = (profile.skillPreference[skill] ?? 0) + tiles;
    }
    if (trait.work) {
      profile.work.speed *= trait.work.speed ?? 1;
      profile.work.fatigue *= trait.work.fatigue ?? 1;
      if (trait.work.breakChance !== undefined) {
        profile.work.breakChance = trait.work.breakChance === 0 ? 0 : Math.max(profile.work.breakChance, trait.work.breakChance);
      }
    }
  }
  if (child) {
    profile.schedule = { ...CHILD_SCHEDULE };
    profile.leisure = { ...CHILD_LEISURE };
    profile.speed = CHILD_SPEED;
    profile.bubbleRate *= 1.4;
  }
  return profile;
}

/** Karakterin uyku saatinde olup olmadığı. bedtime 24'ü geçebilir (25 = 01:00). */
export function isBedtime(profile, hour) {
  const { bedtime, wake } = profile.schedule;
  if (bedtime >= 24) return hour >= bedtime - 24 && hour < wake;
  return hour >= bedtime || hour < wake;
}

/** Mesai saati mi? */
export function isWorkHours(hour) {
  return hour >= WORK_HOURS.start && hour < WORK_HOURS.end;
}
