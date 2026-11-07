// (25.5) Aile yadigârlarının saf yardımcıları: yadigâr türü (meslek geçmişi / kişilik), hikâye cümlesi, mirasçı seçimi,
// kayıttaki durum. Durum değiştirmez, rastgelelik kullanmaz.
import { HEIRLOOMS, HEIRLOOM_KINDS, HEIRLOOM } from '../data/heirloom.js';
import { getFriendship } from './RelationshipSystem.js';
import { primarySkill } from './SkillSystem.js';

/** Sakinin yadigârı: seferlere çıkmışsa pusula; değilse ana mesleği (tezgâh yeri), kişiliği; hiçbiri yoksa Usta Mala. */
export function heirloomKindFor(state, c) {
  if ((c.memories ?? []).some((m) => m.kind === 'expedition')) return 'heirloomCompass';
  const skill = primarySkill(c)?.skill ?? null;
  const work = state.buildings.find((b) => b.id === c.workplaceId)?.type ?? null;
  for (const kind of HEIRLOOM_KINDS) if (work && HEIRLOOMS[kind].workplaces?.includes(work)) return kind;
  for (const kind of HEIRLOOM_KINDS) if (skill && HEIRLOOMS[kind].skills.includes(skill)) return kind;
  for (const kind of HEIRLOOM_KINDS) if (HEIRLOOMS[kind].quirks?.includes(c.quirk)) return kind;
  return 'heirloomTrowel';
}

/** "Mehmet Usta'nın 30 yıllık emektar çekici. Kuşaktan kuşağa aktarılır." */
export function heirloomStory(c, kind) {
  const years = Math.max(1, (c.age ?? 40) - 18);
  return `${c.name} Usta'nın ${years} yıllık emektar ${HEIRLOOMS[kind].noun}. Kuşaktan kuşağa aktarılır.`;
}

/** Yadigârın mesleği taşıyanınkiyle aynı mı? */
function sameTrade(kind, c) {
  const skill = primarySkill(c)?.skill ?? null;
  return Boolean(skill && HEIRLOOMS[kind].skills.includes(skill));
}

/**
 * Mirasçı: önce kasabadaki Genç / yetişkin evlatları (aynı mesleği yapan ya da onun çırağı olan önce, sonra en yaşlısı), evladı yoksa
 * en çok emek verdiği (en yüksek ilerlemeyle yetiştirdiği) çırağı, o da yoksa kasabada doğan kuşaktan en yakın dostu (manevi evlat);
 * hiçbiri yoksa null. Kıdemli Bilge, çocuk, köyü terk eden olmaz.
 */
export function pickHeir(state, elder, kind) {
  const ok = (c) => c && c !== elder && !c.role && !c.isChild && c.lifeStage !== 'elder' && !c.emigrating && !c.away;
  const byId = (id) => state.characters.find((x) => x.id === id);
  const mentees = new Map((elder.mentees ?? []).map((m) => [m.id, m.progress]));
  for (const a of state.characters) if (a.apprenticeship?.masterId === elder.id) mentees.set(a.id, Math.max(mentees.get(a.id) ?? 0, a.apprenticeship.progress));
  const kids = (elder.children ?? []).map(byId).filter(ok);
  if (kids.length) {
    const score = (k) => (sameTrade(kind, k) || mentees.has(k.id) ? 1e6 : 0) + (k.ageInDays ?? 0);
    return kids.reduce((best, k) => (score(k) > score(best) || (score(k) === score(best) && k.id < best.id) ? k : best));
  }
  const pupils = [...mentees.entries()].map(([id, progress]) => ({ c: byId(id), progress })).filter((x) => ok(x.c));
  if (pupils.length) return pupils.reduce((best, x) => (x.progress > best.progress || (x.progress === best.progress && x.c.id < best.c.id) ? x : best)).c;
  // Manevi evlat: evladı da çırağı da yoksa, kasabada doğan kuşaktan (2+) en yakın dostu (ilişki en az HEIRLOOM.adoptFriendship)
  const friends = state.characters.filter((c) => ok(c) && (c.generation ?? 1) >= 2).map((c) => ({ c, score: getFriendship(state, elder, c) })).filter((x) => x.score >= HEIRLOOM.adoptFriendship);
  if (friends.length) return friends.reduce((best, x) => (x.score > best.score || (x.score === best.score && x.c.id < best.c.id) ? x : best)).c;
  return null;
}

/** Kayıttaki yadigâr durumu: oluşan / devredilen sayısı, köyden ayrılan mirasçısız yadigârların arşivi, süren Kuşak Şöleni. */
export function emptyHeirloomState() {
  return { created: 0, transfers: 0, archive: [], feast: null };
}

export function restoreHeirloomState(data) {
  const out = emptyHeirloomState();
  if (!data || typeof data !== 'object') return out;
  out.created = Math.max(0, Math.floor(Number(data.created) || 0));
  out.transfers = Math.max(0, Math.floor(Number(data.transfers) || 0));
  out.archive = (Array.isArray(data.archive) ? data.archive : []).filter((a) => a && HEIRLOOMS[a.kind] && typeof a.name === 'string').slice(-12).map((a) => ({ kind: a.kind, name: a.name, story: typeof a.story === 'string' ? a.story : '', day: Number.isFinite(a.day) ? a.day : 1 }));
  const f = data.feast;
  out.feast = f && [f.x, f.y, f.startedAt, f.until].every(Number.isFinite) ? { x: f.x, y: f.y, startedAt: f.startedAt, until: f.until } : null;
  return out;
}

/** Kayıttan gelen çırak geçmişi: [{ id, progress }]. */
export function sanitizeMentees(list) {
  return (Array.isArray(list) ? list : []).filter((m) => m && Number.isFinite(m.id) && Number.isFinite(m.progress)).slice(-12).map((m) => ({ id: m.id, progress: Math.max(0, Math.min(100, m.progress)) }));
}
