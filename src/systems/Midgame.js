// (30.4b, ENGINES.midgame) Orta oyun karar olaylarının SAF yardımcıları: kişili olayların hedef seçimi, metin yer tutucuları ve
// seçenek açıklamaları. Hiçbiri zar çekmez; eşitlikte küçük kimlik kazanır. Durum değiştiren kısım DilemmaSystem'dedir.
import { SKILL_KEYS } from '../data/skills.js';
import { RESOURCES } from '../data/resources.js';
import { skillLevel } from './SkillSystem.js';
import { getFriendship } from './RelationshipSystem.js';

/** Olaya konu olabilecek yetişkin: çocuk, rolsüz (tüccar...), seferde ya da yolda olmayan. */
export const isAdultResident = (c) => !c.isChild && !c.role && !c.away && !c.emigrating;

const totalXp = (c) => SKILL_KEYS.reduce((a, s) => a + (c.skills?.[s] ?? 0), 0);
const bestLevel = (c) => SKILL_KEYS.reduce((m, s) => Math.max(m, skillLevel(c, s).level), 0);

/** Şehirden teklif gelen: Usta (3. seviye) bir çalışan; en çok toplam deneyimli, eşitlikte küçük kimlik. */
export function pickMaster(state) {
  const list = state.characters.filter((c) => isAdultResident(c) && !c.newcomer && bestLevel(c) >= 3);
  list.sort((a, b) => totalXp(b) - totalXp(a) || a.id - b.id);
  return list[0] ?? null;
}

/** Husumetli çift: ilişkisi en kötü (≤ maxScore) iki yetişkin; who = küçük kimlik. */
export function pickFeud(state, maxScore = -10) {
  const adults = state.characters.filter(isAdultResident).sort((a, b) => a.id - b.id);
  let best = null;
  for (let i = 0; i < adults.length; i++) {
    for (let j = i + 1; j < adults.length; j++) {
      const score = getFriendship(state, adults[i], adults[j]);
      if (score <= maxScore && (!best || score < best.score)) best = { score, a: adults[i], b: adults[j] };
    }
  }
  return best ? { who: best.a, who2: best.b } : null;
}

/** En küçük çocuk (gün cinsinden yaşı en küçük; eşitlikte küçük kimlik). */
export function pickSmallestChild(state) {
  const alive = (id) => state.characters.some((x) => x.id === id);
  const all = state.characters.filter((c) => c.isChild && !c.away && !c.emigrating);
  // ebeveyni hayatta olan çocuk önce (olayın etkisi ebeveynlere yöneliktir)
  const kids = all.some((c) => c.parentIds?.some(alive)) ? all.filter((c) => c.parentIds?.some(alive)) : all;
  kids.sort((a, b) => (a.ageInDays ?? 0) - (b.ageInDays ?? 0) || a.id - b.id);
  return kids[0] ?? null;
}

/** Hedef kuralı -> { who, who2 } (kural karşılanmıyorsa null). */
export function pickTargets(state, rule) {
  if (rule === 'master') {
    const who = pickMaster(state);
    return who ? { who, who2: null } : null;
  }
  if (rule === 'feud') return pickFeud(state);
  if (rule === 'smallestChild') {
    const who = pickSmallestChild(state);
    return who ? { who, who2: null } : null;
  }
  return null;
}

/** {who} / {who2} yer tutucularını doldurur. */
export function fillNames(text, names = {}) {
  return String(text ?? '').replaceAll('{who2}', names.who2 ?? 'biri').replaceAll('{who}', names.who ?? 'biri');
}

const sign = (n) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);
const resName = (r) => (RESOURCES[r]?.name ?? r).toLocaleLowerCase('tr');
const SCOPE = { all: 'herkes', target: '{who}', target2: '{who2}', both: '{who} ve {who2}', friendsOfTarget: '{who}\'ın dostları', parentsOfTarget: 'ebeveynler', elders: 'yaşlılar' };
const SCOPE_PLAIN = { friendsOfTarget: 'dostları', parentsOfTarget: 'ebeveynler' };

/** Etkiyi { cost: [...], gain: [...] } parçalarına açar (olumsuz parçalar bedel sayılır). Metinler yer tutucusuz (isimler doldurulmuş). */
export function effectPieces(effect = {}, names = {}) {
  const out = [];
  const put = (text, value) => out.push({ text: fillNames(text, names), value });
  const who = (k) => fillNames(SCOPE[k] ?? k, names);
  if (effect.gold) put(`altın ${sign(effect.gold)}`, effect.gold);
  for (const [r, v] of Object.entries(effect.resources ?? {})) put(`${resName(r)} ${sign(v)}`, v);
  for (const [k, v] of Object.entries(effect.loyalty ?? {})) {
    if (k === 'lowest') put(`en düşük sadakatli ${v[0]} sakin sadakat ${sign(v[1])}`, v[1]);
    else if (k === 'friendsOfTarget') put(`${names.who ?? 'biri'} dostları sadakat ${sign(v)}`, v);
    else put(`${who(k)} sadakat ${sign(v)}`, v);
  }
  if (effect.trust) put(`güven ${sign(effect.trust)}`, effect.trust);
  for (const [k, v] of Object.entries(effect.satisfaction ?? {})) put(`${who(k)} doyum ${sign(v)}`, v);
  if (effect.fun) put(`herkes keyif ${sign(effect.fun)}`, effect.fun);
  if (effect.energy) put(`herkes enerji ${sign(effect.energy)}`, effect.energy);
  if (effect.reputation) put(`krallık itibarı ${sign(effect.reputation)}`, effect.reputation);
  if (effect.relation?.pair) put(`ilişki ${sign(effect.relation.pair)}`, effect.relation.pair);
  if (effect.tag) put(`${fillNames(SCOPE[effect.tag.from] ?? '', names)} kırgın olur`, -1);
  if (effect.moodlet) put('ruh hali etkisi', effect.moodlet.key === 'shaken' ? -1 : 1);
  if (effect.sick) put(`${effect.sick} sakin hastalanır`, -1);
  if (effect.quarantine) put(`${effect.quarantine} gün ticaret ve göç yok`, -1);
  if (effect.leave) put(`${names.who ?? 'biri'} ayrılır`, -1);
  return out;
}

/** Seçeneğin görünür bedeli var mı? (cost ya da olumsuz bir etki parçası) */
export function hasVisibleCost(option) {
  if (Object.keys(option.cost ?? {}).length) return true;
  return effectPieces(option.effect ?? {}, {}).some((p) => p.value < 0);
}

/** "Bedel: altın 60 · Etki: {who} sadakat +15" biçiminde, sadakat etkisi dahil yazılı açıklama. */
export function describeOption(option, names = {}) {
  const costs = Object.entries(option.cost ?? {}).map(([r, v]) => `${resName(r)} ${v}`);
  const pieces = effectPieces(option.effect ?? {}, names);
  const bad = [...costs, ...pieces.filter((p) => p.value < 0).map((p) => p.text)];
  const good = pieces.filter((p) => p.value >= 0).map((p) => p.text);
  const parts = [];
  parts.push(`Bedel: ${bad.length ? bad.join(', ') : '—'}`);
  if (good.length) parts.push(`Etki: ${good.join(', ')}`);
  return parts.join(' · ');
}
