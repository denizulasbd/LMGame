// Mesleki ustalık hesapları. Deneyim Character.skills içinde ({ meslek: dakika }) tutulur ve kayda
// girer. BehaviorSystem çalışma sırasında addExperience çağırır; kademe atlanınca 'skill:levelUp'
// { character, skill, level } yayınlanır (günlük, ses ve bildirim dinler).
import { SKILLS, SKILL_LEVELS, ACTIVITY_SKILLS } from '../data/skills.js';

/** Deneyime göre kademe kaydı ({ level, name, xp, bonus }). */
export function levelFor(xp) {
  let current = SKILL_LEVELS[0];
  for (const level of SKILL_LEVELS) if (xp >= level.xp) current = level;
  return current;
}

/** Bir sakinin bir meslekteki kademesi. */
export function skillLevel(character, skill) {
  return levelFor(character.skills[skill] ?? 0);
}

/** Etkinliğin geliştirdiği meslek (yoksa null). */
export function skillForActivity(activity) {
  return ACTIVITY_SKILLS[activity] ?? null;
}

/** O işi yaparken iş hızı çarpanı (meslek yoksa 1). */
export function workBonus(character, activity) {
  const skill = skillForActivity(activity);
  return skill ? skillLevel(character, skill).bonus : 1;
}

/** Bir sonraki kademeye ilerleme 0-1 (en üst kademede 1). */
export function progressToNext(xp) {
  const current = levelFor(xp);
  const next = SKILL_LEVELS.find((l) => l.level === current.level + 1);
  if (!next) return 1;
  return (xp - current.xp) / (next.xp - current.xp);
}

/** En çok gelişmiş meslekler: [{ skill, def, xp, level }] (deneyimi olanlar, çoktan aza). */
export function topSkills(character, count) {
  return Object.entries(character.skills)
    .filter(([key, xp]) => xp > 0 && SKILLS[key])
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([skill, xp]) => ({ skill, def: SKILLS[skill], xp, level: levelFor(xp) }));
}

/** Deneyim ekler; kademe atlarsa olayı yayınlar. */
export function addExperience(events, character, activity, minutes) {
  const skill = skillForActivity(activity);
  if (!skill || minutes <= 0) return;
  const before = levelFor(character.skills[skill] ?? 0);
  character.skills[skill] = (character.skills[skill] ?? 0) + minutes;
  const after = levelFor(character.skills[skill]);
  if (after.level > before.level) events.emit('skill:levelUp', { character, skill, level: after });
}
