// (34.1) Genişleyen harita: çekirdeğin çevresindeki halkaların parsellere bölünmesi (saf hesap, durum değiştirmez).
// Bölünme yalnızca harita tohumundan ve çekirdek boyutundan gelir: aynı tohum aynı parselleri verir.
// Her halka dört şeride ayrılır (kuzey ve güney şeritleri köşeleri de kapsar); her şerit boyunca 12-24 karoluk parçalara kesilir.
import { Random } from '../utils/random.js';
import { PARCELS } from '../data/parcels.js';

const SIDES = ['n', 'e', 's', 'w'];

/** Harita tohumundan parsel üretecinin tohumu (çekirdek üretecinden ayrı). */
export function parcelSeed(seed, salt = 0) {
  let h = (Math.imul((seed >>> 0) ^ PARCELS.seedSalt, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}

/** Bir uzunluğu [min, max] aralığında parçalara böler (toplam tam uzunluk). */
function split(length, rng) {
  const { min, max } = PARCELS.segment;
  const out = [];
  let left = length;
  while (left > max) {
    const s = rng.int(min, Math.min(max, left - min));
    out.push(s);
    left -= s;
  }
  out.push(left);
  return out;
}

/**
 * @param {number} coreW çekirdek genişliği (karo)
 * @param {number} coreH çekirdek yüksekliği
 * @param {number} seed harita tohumu (state.seed)
 * @returns {{ parcels: object[], bounds: { x0, y0, x1, y1 }, rings: number[] }}
 *   parcel: { id, ring, side, x, y, w, h, area, neighbors: id[] }
 */
export function layoutParcels(coreW, coreH, seed) {
  const rng = new Random(parcelSeed(seed));
  const rings = PARCELS.rings.map(([lo, hi]) => rng.int(lo, hi));
  const parcels = [];
  let inner = { x0: 0, y0: 0, x1: coreW, y1: coreH };
  rings.forEach((t, r) => {
    const ring = r + 1;
    const outer = { x0: inner.x0 - t, y0: inner.y0 - t, x1: inner.x1 + t, y1: inner.y1 + t };
    const strips = {
      n: { x: outer.x0, y: outer.y0, along: outer.x1 - outer.x0, across: t, horizontal: true },
      s: { x: outer.x0, y: inner.y1, along: outer.x1 - outer.x0, across: t, horizontal: true },
      w: { x: outer.x0, y: inner.y0, along: inner.y1 - inner.y0, across: t, horizontal: false },
      e: { x: inner.x1, y: inner.y0, along: inner.y1 - inner.y0, across: t, horizontal: false },
    };
    for (const side of SIDES) {
      const strip = strips[side];
      let at = 0;
      split(strip.along, rng).forEach((len, i) => {
        const p = strip.horizontal
          ? { x: strip.x + at, y: strip.y, w: len, h: strip.across }
          : { x: strip.x, y: strip.y + at, w: strip.across, h: len };
        parcels.push({ id: `r${ring}${side}${i}`, ring, side, ...p, area: p.w * p.h, neighbors: [] });
        at += len;
      });
    }
    inner = outer;
  });
  // Komşuluk: kenar paylaşan parseller ve (ring 1) çekirdeğe değenler 'core'
  const touches = (a, b) => {
    const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return (xOverlap > 0 && (a.y + a.h === b.y || b.y + b.h === a.y)) || (yOverlap > 0 && (a.x + a.w === b.x || b.x + b.w === a.x));
  };
  const core = { x: 0, y: 0, w: coreW, h: coreH };
  for (const p of parcels) {
    if (touches(p, core)) p.neighbors.push('core');
    for (const q of parcels) if (q !== p && touches(p, q)) p.neighbors.push(q.id);
  }
  return { parcels, bounds: inner, rings };
}
