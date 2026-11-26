// Haritanın kaydı. Harita her zaman aynı tohumdan yeniden üretilir; kayda yalnızca üretilmiş
// haritadan FARKLI karolar yazılır (döşenen yollar, kesilen ağaçlar, kütükler, söküldü yollar...).
// Böylece kayıt küçük kalır ve harita üretici değişse bile oyuncunun değişiklikleri korunur.
//
// (34.1, kayıt sürümü 42) Farklar DÜNYA KOORDİNATIYLA saklanır: [x, y, zemin, varyasyon, nesne]. Harita genişleyince
// (parseller, eksi koordinatlar) indeksler kayardı; koordinat kaymaz. Eski (sürüm ≤ 41) kayıtların 4'lü hücreleri
// [indeks, zemin, varyasyon, nesne] çekirdek genişliğiyle koordinata çevrilir (legacyTerrainToCoords).

import { CONFIG } from '../config.js';

/** Kayıttaki çekirdek harita boyutu (8. aşamadan eski kayıtlarda harita alanı yoktur: 48x48). */
export function savedCoreSize(data) {
  const w = data?.map?.width;
  const h = data?.map?.height;
  return Number.isInteger(w) && Number.isInteger(h) ? { width: w, height: h } : { width: CONFIG.LEGACY_MAP_SIZE, height: CONFIG.LEGACY_MAP_SIZE };
}

/** Üretilmiş (dokunulmamış) haritanın kopyası; kayıt anında farkı bulmak için saklanır. */
export function captureTerrain(map) {
  return {
    tiles: map.tiles.slice(),
    variants: map.variants.slice(),
    objects: map.objects.slice(),
  };
}

/** Haritanın tabana göre değişen karoları: [[x, y, zemin, varyasyon, nesne], ...] */
export function diffTerrain(base, map) {
  const cells = [];
  for (let i = 0; i < map.tiles.length; i++) {
    if (map.tiles[i] !== base.tiles[i] || map.variants[i] !== base.variants[i] || map.objects[i] !== base.objects[i]) {
      const { x, y } = map.coordOf(i);
      cells.push([x, y, map.tiles[i], map.variants[i], map.objects[i]]);
    }
  }
  return cells;
}

/**
 * Eski (sürüm ≤ 41) hücreleri [indeks, z, v, n] koordinatlı biçime [x, y, z, v, n] çevirir. Zaten koordinatlı hücreler
 * olduğu gibi kalır. width / height: kayıttaki çekirdek harita boyutu. Geçersiz ya da çekirdek dışı hücre olduğu gibi bırakılır
 * (applyTerrain eskisi gibi reddeder).
 */
export function legacyTerrainToCoords(cells, width, height) {
  if (!Array.isArray(cells)) return cells;
  return cells.map((cell) => {
    if (!Array.isArray(cell) || cell.length !== 4 || !Number.isInteger(cell[0]) || cell[0] < 0 || cell[0] >= width * height) return cell;
    const [index, tile, variant, object] = cell;
    return [index % width, Math.floor(index / width), tile, variant, object];
  });
}

/** Kayıttaki karo farklarını yeni üretilmiş haritaya uygular. Geçersiz kayıtta hata fırlatır. */
export function applyTerrain(map, cells) {
  if (!Array.isArray(cells)) throw new Error('Harita kaydı geçersiz');
  for (const cell of cells) {
    if (!Array.isArray(cell) || cell.length !== 5) throw new Error('Harita karosu geçersiz');
    const [x, y, tile, variant, object] = cell;
    if (!Number.isInteger(x) || !Number.isInteger(y) || !map.inBounds(x, y)) throw new Error('Harita karosu geçersiz');
    const index = map.index(x, y);
    map.tiles[index] = tile;
    map.variants[index] = variant;
    map.objects[index] = object;
  }
}
