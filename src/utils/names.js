// Ad yardımcıları (oyun kuralı yok).
/**
 * (14. aşama) Ad havuzu tükenince iki addan oluşan bir ad ("Defne Su", "Arda Can") seçer; sayılı ad ("Arda 30")
 * kullanılmaz. Hepsi doluysa son çare sayı eklenir.
 */
export function compoundName(rng, pool, taken) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const a = rng.pick(pool);
    const b = rng.pick(pool);
    const name = `${a} ${b}`;
    if (a !== b && !taken.has(name) && name.length <= 16) return name;
  }
  return `${rng.pick(pool)} ${taken.size + 1}`;
}
