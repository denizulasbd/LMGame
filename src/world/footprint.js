// Bir yapının kapladığı karolar ve ona ulaşmak için gereken karolar (kapı önü, ön cephe,
// çevresi, iskelenin karaya bağlandığı yer). Henüz kurulmamış yapılar için de çalışır.
import { BUILDINGS } from '../data/buildings.js';

/**
 * İskelenin / limanın kum tarafındaki sütunun x'i: 'right' ise sol sütun, 'left' ise sağ sütun.
 * width: yapının karo genişliği (iskele 2, liman 3).
 */
export function pierLandColumn(tileX, orientation, width = 2) {
  return orientation === 'left' ? tileX + width - 1 : tileX;
}

/** Suyun bulunduğu yönün tersindeki, karaya çıkış karoları: kum sütununun üst, alt ve kara yanı. */
export function pierLandingTiles(tileX, tileY, orientation, width = 2) {
  const landX = pierLandColumn(tileX, orientation, width);
  const outside = orientation === 'left' ? landX + 1 : landX - 1;
  return [
    { x: outside, y: tileY },
    { x: outside, y: tileY + 1 },
    { x: landX, y: tileY - 1 },
    { x: landX, y: tileY + 2 },
  ];
}

/** Yapıya ulaşmak için gereken karolar. */
export function accessTiles(type, tileX, tileY, orientation = 'right') {
  const def = BUILDINGS[type];
  const { w, h } = def.size;
  if (def.doorTiles) return def.doorTiles.map(({ dx, dy }) => ({ x: tileX + dx, y: tileY + dy }));
  if (def.spots === 'front') return Array.from({ length: w }, (_, i) => ({ x: tileX + i, y: tileY + h }));
  if (def.spots === 'pier') return pierLandingTiles(tileX, tileY, orientation, w);
  const ring = [];
  for (let y = tileY - 1; y <= tileY + h; y++) {
    for (let x = tileX - 1; x <= tileX + w; x++) {
      const inside = x >= tileX && x < tileX + w && y >= tileY && y < tileY + h;
      if (!inside) ring.push({ x, y });
    }
  }
  return ring;
}

/** Başka yapıların girişini kapatmamak için korunan (giriş kuralı olan) yapı türü mü? */
export function hasAccessRule(def) {
  return Boolean(def.doorTiles) || def.spots === 'front' || def.spots === 'pier';
}
