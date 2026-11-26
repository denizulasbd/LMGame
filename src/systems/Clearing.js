// (34.3) Alan açmanın saf hesapları (durum değiştirmez): ayak izindeki ağaç ve kayalar, önizleme yazısı.
import { OBJECT_TYPES } from '../data/tiles.js';
import { CLEARING_TEXT } from '../data/clearing.js';

/**
 * Ayak izindeki toplanabilir nesneler (ağaç, kaya): { tiles: [{ x, y, object }], trees, rocks, wood, stone }.
 * Çakıl, fidan ve kütük sayılmaz (inşaat bunları kendiliğinden siler).
 */
export function clearingInfo(map, footprint) {
  const info = { tiles: [], trees: 0, rocks: 0, wood: 0, stone: 0 };
  for (const { x, y } of footprint) {
    const object = map.getObject(x, y);
    const harvest = object ? OBJECT_TYPES[object].harvest : null;
    if (!harvest || (harvest.job !== 'chop' && harvest.job !== 'mine')) continue;
    if (object === 'pebbles') continue;
    info.tiles.push({ x, y, object });
    if (harvest.job === 'chop') info.trees++;
    else info.rocks++;
    info.wood += harvest.yields.wood ?? 0;
    info.stone += harvest.yields.stone ?? 0;
  }
  return info;
}

/** "Önce 3 ağaç ve 1 kaya temizlenecek (+24 odun, +9 taş)" ya da temizlenecek bir şey yoksa ''. */
export function clearingNote(info) {
  if (info.tiles.length === 0) return '';
  const parts = [];
  if (info.trees) parts.push(`${info.trees} ${CLEARING_TEXT.tree}`);
  if (info.rocks) parts.push(`${info.rocks} ${CLEARING_TEXT.rock}`);
  const gains = [info.wood ? `+${info.wood} odun` : '', info.stone ? `+${info.stone} taş` : ''].filter(Boolean).join(', ');
  return CLEARING_TEXT.note(parts.join(CLEARING_TEXT.and), gains);
}
