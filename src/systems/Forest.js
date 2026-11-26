// (34.3) Orman yenilenmesinin saf hesapları (durum değiştirmez): ağaç sayımı, günlük fidan sayısı, fidan çıkabilecek karolar.
import { FOREST } from '../data/forest.js';
import { OBJECT_TYPES, TILE_TYPES } from '../data/tiles.js';

const TREE_IDS = new Set([OBJECT_TYPES.oak.id, OBJECT_TYPES.pine.id, OBJECT_TYPES.sapling.id]);
const OAK = OBJECT_TYPES.oak.id;
const PINE = OBJECT_TYPES.pine.id;

/** Açık alandaki ağaç sayısı (fidanlar da sayılır: büyümekte olan ağaç). objects: harita nesne katmanı (varsayılan: haritanın kendisi). */
export function countTrees(map, objects = map.objects) {
  let count = 0;
  const { x0, y0, x1, y1 } = map.openBounds;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = map.index(x, y);
      if (map.open[i] === 1 && TREE_IDS.has(objects[i])) count++;
    }
  }
  return count;
}

/** Bugün kaç fidan çıkar? ratio = ağaç sayısı / başlangıçtaki ağaç sayısı. */
export function saplingsForToday(ratio) {
  if (!(ratio >= 0)) return 0;
  if (ratio < FOREST.fastBelow) return FOREST.fastPerDay;
  if (ratio < FOREST.slowBelow) return FOREST.slowPerDay;
  return 0;
}

/** Yapıdan, yoldan, köprüden ve meydandan minDistance karodan yakın karoların maskesi (1 = fidan çıkamaz). */
export function townMask(map, buildings, buildingSize, distance = FOREST.minDistance) {
  const mask = new Uint8Array(map.width * map.height);
  const reach = distance - 1;
  const stamp = (x, y) => {
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) if (map.inBounds(x + dx, y + dy)) mask[map.index(x + dx, y + dy)] = 1;
    }
  };
  const { x0, y0, x1, y1 } = map.openBounds;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (TILE_TYPES[map.get(x, y)]?.road) stamp(x, y);
  for (const b of buildings) {
    const { w, h } = buildingSize(b);
    for (let y = b.tileY; y < b.tileY + h; y++) for (let x = b.tileX; x < b.tileX + w; x++) stamp(x, y);
  }
  return mask;
}

/**
 * Fidan çıkabilecek karolar: [{ x, y, tree }]. Karo açık, uygun zeminde, boş (nesne ve yapı yok), kasabadan uzak, toplama işareti
 * olmayan ve var olan bir ağacın yanında olmalı. tree: yanındaki ağacın türü (kayalıkta yalnızca çam).
 * marked: toplama işareti konmuş karoların "x,y" kümesi.
 */
export function sproutSpots(map, mask, marked) {
  const spots = new Map();
  const r = FOREST.nearTreeRadius;
  const { x0, y0, x1, y1 } = map.openBounds;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const id = map.objects[map.index(x, y)];
      if (id !== OAK && id !== PINE) continue;
      const species = id === OAK ? 'oak' : 'pine';
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (!map.inBounds(tx, ty)) continue;
          const i = map.index(tx, ty);
          if (spots.has(i) || map.open[i] !== 1 || mask[i] === 1 || map.objects[i] !== 0 || map.occupants[i] !== 0) continue;
          const tile = map.get(tx, ty);
          if (!FOREST.tiles.includes(tile) || marked.has(`${tx},${ty}`)) continue;
          spots.set(i, { x: tx, y: ty, tree: tile === 'rocky' ? FOREST.rockyTree : species });
        }
      }
    }
  }
  return [...spots.values()];
}
