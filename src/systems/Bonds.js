// (29.5) Bağ puanı: bir sakinin bir başkasıyla yan yana çalışmaya ne kadar istekli olduğu (saf, yan etkisiz).
import { BOND_POINTS as P } from '../data/bonds.js';
import { getFriendship, arePartners } from './RelationshipSystem.js';
import { chemistryFor, hasTag } from './Chemistry.js';
import { lifeSeedOf } from '../utils/lifeSeed.js';

const peekChemistry = (state, a, b) => a.relationships?.[b.id]?.chemistry ?? chemistryFor(lifeSeedOf(state), a, b);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** c'nin o ile çalışma isteği: tam sayı, -4..+4. */
export function bondWeight(state, c, o) {
  if (!c || !o || c === o) return 0;
  let w = 0;
  if (arePartners(c, o)) w += P.partner;
  if (hasTag(c, o.id, 'kindred')) w += P.kindred;
  const friendship = getFriendship(state, c, o);
  if (friendship >= P.friendHigh.min) w += P.friendHigh.points;
  else if (friendship >= P.friendMid.min) w += P.friendMid.points;
  else if (friendship < P.rival.below) w += P.rival.points;
  const chemistry = peekChemistry(state, c, o);
  if (chemistry >= P.chemistryGood.min) w += P.chemistryGood.points;
  else if (chemistry < P.chemistryBad.below) w += P.chemistryBad.points;
  if (hasTag(c, o.id, 'grateful')) w += P.grateful;
  if (hasTag(c, o.id, 'resentful')) w += P.resentful;
  if (c.drive?.avoidIds?.includes(o.id)) w += P.avoided;
  return clamp(w, -P.clamp, P.clamp);
}

/** Bağ hesabına girmeyen sakin: çocuk, rol sahibi (ziyaretçi vb.) ya da çırak planındaki. */
export function bondExempt(c) {
  return !c || c.isChild || Boolean(c.role) || c.task?.activity === 'apprentice';
}

/** c için iş yerindeki (kimlik kümesi / dizisi) diğer çalışanların bağ puanı toplamı: -6..+6. */
export function crewBond(state, c, ids) {
  if (!ids || bondExempt(c)) return 0;
  let sum = 0;
  for (const id of ids) {
    if (id === c.id) continue;
    const o = state.characters.find((x) => x.id === id);
    if (!o || bondExempt(o)) continue;
    sum += bondWeight(state, c, o);
  }
  return clamp(sum, -P.crewClamp, P.crewClamp);
}
