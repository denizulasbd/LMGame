// (28.3) Sürdürülebilir kuşak döngüsünün saf hesapları: ömür (izole üreteç), aktif nüfus, Saygın Büyük hazırlığı. Durum değiştirmez.
//   lifespanFor(seed, id)   : sakinin ömrü (80-90 yaş); tohum + 35'ten ve kimlikten türeyen izole bir üreteçle (ana üretece dokunmaz, sıraya bağlı değil)
//   activePopulation(state) : nüfus kotasına sayılan sakinler (Saygın Büyükler hariç)
//   venerables(state)       : Saygın Büyükler
//   hearthSettled / heirloomSettled / venerableReady : Saygın Büyük olma koşulları
import { Random } from '../utils/random.js';
import { activePopulation } from './LifeStages.js';
import { LIFESPAN, VENERABLE, sanitizeLifespan } from '../data/lifeStages.js';

export { sanitizeLifespan, activePopulation };
import { hearthsOf, headOf } from './Lineage.js';
import { heirloomSlot } from './Citizens.js';

export function lifespanFor(seed, id) {
  const mixed = (Math.imul((Number(seed) || 0) + LIFESPAN.seedOffset, 2654435761) + Math.imul(Number(id) || 0, 40503)) >>> 0;
  const rng = new Random(mixed);
  rng.next();
  return rng.int(LIFESPAN.min, LIFESPAN.max);
}

export function isVenerable(c) {
  return Boolean(c?.isVenerable);
}

export function venerables(state) {
  return state.characters.filter((c) => c.isVenerable);
}

/** Ocak Devri tamam mı: reisi olduğu ev kalmadı (devretti) ya da canlı biyolojik evladı yok (muaf) ya da devredemeden hearthGraceAge'e geldi (muaf). */
export function hearthSettled(state, c) {
  const homes = hearthsOf(state, c);
  if (homes.every((h) => headOf(state, h) !== c)) return true;
  const kids = (c.children ?? []).filter((id) => state.characters.some((x) => x.id === id));
  if (kids.length === 0) return true;
  return (c.age ?? 0) >= VENERABLE.hearthGraceAge;
}

/** Yadigâr Devri tamam mı: kendi yadigârı çantasında kalmadı (teslim etti / arşive kalktı). */
export function heirloomSettled(c) {
  const slot = heirloomSlot(c);
  return !slot || slot.heirloom?.ownerId !== c.id;
}

/** Kıdemli Bilge Saygın Büyük olabilir mi (kasabadan ayrılmıyor, seferde değil)? Yadigâr arşive kaldırma kararı sistemdedir. */
export function venerableCandidate(c) {
  return Boolean(c) && !c.role && c.lifeStage === 'elder' && !c.isVenerable && !c.away && !c.emigrating;
}
