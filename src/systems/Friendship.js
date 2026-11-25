// (32.6a) İlişki puanının SAF yardımcıları (durum yazmaz). RelationshipSystem.js'ten ayrıldı: Clubs.js dost çekimi için bunları
// RelationshipSystem'den alınca Clubs → RelationshipSystem → TownStatus → Landscape → Clubs döngüsü oluşuyordu. Yalnızca
// data/relationships.js'e bağlıdır; RelationshipSystem.js aynı adlarla yeniden dışa aktarır.
import { RELATIONSHIP_LEVELS, HOUSEMATE_START, FAMILY_START } from '../data/relationships.js';

export function pairKey(idA, idB) {
  return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
}

/** Ebeveyn-çocuk ya da kardeş mi? (aşık olamazlar, dost başlarlar) */
export function isFamily(a, b) {
  if (a.parentIds.includes(b.id) || b.parentIds.includes(a.id)) return true;
  return a.parentIds.some((id) => b.parentIds.includes(id));
}

/** İki karakter arasındaki ilişki puanı. */
export function getFriendship(state, a, b) {
  const stored = state.relationships[pairKey(a.id, b.id)];
  if (stored !== undefined) return stored;
  if (isFamily(a, b)) return FAMILY_START;
  return a.homeId !== null && a.homeId === b.homeId ? HOUSEMATE_START : 0;
}

export function levelIndexFor(score) {
  let index = 0;
  for (let i = 0; i < RELATIONSHIP_LEVELS.length; i++) if (score >= RELATIONSHIP_LEVELS[i].min) index = i;
  return index;
}

export function levelForScore(score) {
  return RELATIONSHIP_LEVELS[levelIndexFor(score)];
}
