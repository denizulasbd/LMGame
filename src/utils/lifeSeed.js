// (33.1) İki tohum: `state.seed` HARİTA tohumudur (arazi, işaretler, başlangıç yapıları, Vadi Karakteri; aynı tohum aynı haritayı verir),
// `state.lifeSeed` HAYAT tohumudur (sakinler, hava, hayvanlar, kimya, ömür, suç vb.: haritanın dışındaki her üreteç). Her yeni oyunda
// hayat tohumu rastgeledir; eski kayıtta alan yoksa harita tohumu kullanılır, böylece kayıt eskisi gibi devam eder.

/** Yeni oyun için rastgele tohum (harita ya da hayat). */
export const randomSeed = () => Math.floor(Math.random() * 1_000_000_000);

/** Haritanın DIŞINDAKİ bütün üreteçlerin tohumu: lifeSeed varsa o, yoksa (eski kayıt) harita tohumu. `state` kayıt verisi de olabilir. */
export function lifeSeedOf(state) {
  return Number.isFinite(state?.lifeSeed) ? state.lifeSeed : Number(state?.seed) || 0;
}
