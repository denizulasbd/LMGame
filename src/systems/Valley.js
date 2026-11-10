// (28.4) Vadi Karakteri'nin saf hesapları. Durum state.valley'dedir (anahtar; kayda girer). Rastgelelik ana üretece dokunmaz.
import { Random } from '../utils/random.js';
import { VALLEYS, VALLEY_KEYS, VALLEY_SEED_OFFSET } from '../data/valley.js';

/** Tohumdan deterministik vadi karakteri (izole üreteç: seed + 36). */
export function valleyFor(seed) {
  const rng = new Random(((Number(seed) || 0) + VALLEY_SEED_OFFSET) >>> 0);
  rng.next();
  return VALLEY_KEYS[rng.int(0, VALLEY_KEYS.length - 1)];
}

/** Kayıttan gelen anahtar geçerli mi? Değilse tohumdan atanır. */
export function sanitizeValley(value, seed) {
  return VALLEYS[value] ? value : valleyFor(seed);
}

export function valleyOf(state) {
  return VALLEYS[state.valley] ?? null;
}

/** Bu yapı türünün vadi verim çarpanı (yoksa 1). */
export function valleyProductionMultiplier(state, type) {
  return valleyOf(state)?.production[type] ?? 1;
}

/** Isınma odunu çarpanı (Rüzgârlı Boğaz'da 1,4). */
export function valleyHeatingMultiplier(state) {
  return valleyOf(state)?.heating ?? 1;
}
