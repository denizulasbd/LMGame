// Haritanın kaydı. Harita her zaman aynı tohumdan yeniden üretilir; kayda yalnızca üretilmiş
// haritadan FARKLI karolar yazılır (döşenen yollar, kesilen ağaçlar, kütükler, söküldü yollar...).
// Böylece kayıt küçük kalır ve harita üretici değişse bile oyuncunun değişiklikleri korunur.

/** Üretilmiş (dokunulmamış) haritanın kopyası; kayıt anında farkı bulmak için saklanır. */
export function captureTerrain(map) {
  return {
    tiles: map.tiles.slice(),
    variants: map.variants.slice(),
    objects: map.objects.slice(),
  };
}

/** Haritanın tabana göre değişen karoları: [[indeks, zemin, varyasyon, nesne], ...] */
export function diffTerrain(base, map) {
  const cells = [];
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] !== base.tiles[i] || map.variants[i] !== base.variants[i] || map.objects[i] !== base.objects[i]) {
      cells.push([i, map.tiles[i], map.variants[i], map.objects[i]]);
    }
  }
  return cells;
}

/** Kayıttaki karo farklarını yeni üretilmiş haritaya uygular. Geçersiz kayıtta hata fırlatır. */
export function applyTerrain(map, cells) {
  if (!Array.isArray(cells)) throw new Error('Harita kaydı geçersiz');
  for (const cell of cells) {
    const [index, tile, variant, object] = cell;
    if (!Number.isInteger(index) || index < 0 || index >= map.tiles.length) throw new Error('Harita karosu geçersiz');
    map.tiles[index] = tile;
    map.variants[index] = variant;
    map.objects[index] = object;
  }
}
