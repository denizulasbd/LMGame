// (23. aşama) Güvenlik yapıları. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   Su Kuyusu (1x1, 16x24): taş halkalı kuyu, iki ahşap direk üstünde kiremit çatı, çıkrık, ip ve ahşap kova; içinde su parlar.
//   Gözcü Kulesi (2x2, 32x56): taş gövdeli, kemerli kapılı kule; üstünde ahşap korkuluklu nöbet köşkü, kiremit çatı, kırmızı flama.
//     Gece (lit) köşkün iki penceresi ve fener sıcak sarı yanar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const WELL_ART = { width: 16, height: 24 };
export const GUARD_TOWER_ART = { width: 32, height: 56, light: { x: 16, y: 17 }, windows: [{ x: 11, y: 15 }, { x: 21, y: 15 }] };

// ---------------------------------------------------------------------------
// Su Kuyusu
// ---------------------------------------------------------------------------

function buildWellRows(frame) {
  const g = new CharGrid(WELL_ART.width, WELL_ART.height);
  g.ellipse(8, 21.5, 7, 2, 'k');
  // Taş halka: dış duvar, üstte su yüzeyi
  g.rect(2, 15, 12, 7, 'K');
  g.rect(3, 16, 10, 5, 'r');
  g.hline(3, 12, 16, 'q');
  g.hline(3, 12, 18, 'R');
  g.hline(3, 12, 20, 'R');
  for (const x of [5, 9]) g.vline(x, 16, 17, 'R');
  for (const x of [4, 7, 11]) g.vline(x, 18, 19, 'R');
  g.vline(6, 20, 20, 'R').vline(10, 20, 20, 'R');
  g.ellipse(8, 15, 6, 2.2, 'K');
  g.ellipse(8, 15, 5, 1.6, 'b');
  g.hline(5, 10, 15, 'c');
  g.set(6 + (frame % 3), 15, 'a');
  // Ahşap direkler ve çatı
  for (const x of [3, 12]) g.vline(x, 5, 16, 'x').vline(x + (x < 8 ? 1 : -1), 5, 16, 'w');
  g.hline(2, 13, 5, 'K').hline(3, 12, 6, 'x');
  g.hline(5, 10, 0, 'K').hline(4, 11, 1, 'U').hline(3, 12, 2, 'C').hline(2, 13, 3, 'C').hline(2, 13, 4, 'U');
  g.hline(5, 10, 1, 'Z');
  g.hline(4, 11, 2, 'Z').set(7, 2, 'C');
  // Çıkrık, ip ve kova
  g.hline(5, 10, 7, 'X').hline(5, 10, 8, 'x');
  g.vline(8, 9, 11, 'E');
  g.rect(6, 12, 5, 3, 'K').rect(7, 12, 3, 2, 'w').hline(7, 9, 12, 'X');
  g.set(11, 7, 'x').set(12, 7, 'x'); // kol
  return g.toRows();
}

export function getWellSprite(frame = 0) {
  return getSprite(`building:well:${frame % 3}`, () => buildWellRows(frame % 3));
}

// ---------------------------------------------------------------------------
// Gözcü Kulesi
// ---------------------------------------------------------------------------

function buildGuardTowerRows(lit) {
  const g = new CharGrid(GUARD_TOWER_ART.width, GUARD_TOWER_ART.height);
  g.ellipse(16, 53.5, 14, 2.2, 'k');
  // Taş gövde (hafif daralan), tuğla derzleri
  g.rect(6, 27, 20, 26, 'K');
  g.rect(7, 27, 18, 25, 'r');
  g.vline(7, 28, 51, 'q').vline(24, 28, 51, 'R');
  for (let y = 30; y < 52; y += 4) {
    g.hline(7, 24, y, 'R');
    const off = ((y - 30) / 4) % 2 ? 0 : 3;
    for (let x = 9 + off; x < 24; x += 6) g.vline(x, y + 1, Math.min(51, y + 3), 'R');
  }
  g.hline(7, 24, 51, 'Q');
  // Kemerli kapı
  g.rect(13, 42, 6, 10, 'K').rect(14, 41, 4, 1, 'K').rect(14, 43, 4, 9, 'x').vline(16, 43, 51, 'w').hline(14, 17, 42, 'w');
  g.set(17, 47, 'P');
  // Ok yuvası
  g.rect(15, 33, 2, 5, 'K');
  g.vline(15, 34, 36, 'Q');
  // Nöbet platformu: ahşap döşeme ve altındaki kirişler
  g.rect(2, 24, 28, 4, 'K');
  g.rect(3, 24, 26, 3, 'X');
  g.hline(3, 28, 24, 'E').hline(3, 28, 26, 'w').hline(4, 27, 27, 'x');
  for (let x = 5; x < 28; x += 5) g.vline(x, 24, 26, 'w');
  // Korkuluk
  for (const x of [3, 28]) g.vline(x, 18, 24, 'x');
  g.hline(2, 29, 18, 'w').hline(2, 29, 19, 'x');
  for (const x of [7, 11, 20, 24]) g.vline(x, 20, 23, 'w');
  // Nöbet köşkü
  g.rect(8, 9, 16, 15, 'K');
  g.rect(9, 10, 14, 14, 'w');
  g.hline(9, 22, 10, 'X');
  for (const x of [11, 15, 19, 22]) g.vline(x, 11, 23, 'x');
  // Pencereler
  for (const w of GUARD_TOWER_ART.windows) {
    g.rect(w.x - 2, w.y - 2, 5, 5, 'K');
    g.rect(w.x - 1, w.y - 1, 3, 3, lit ? 'P' : 'N');
    if (lit) g.set(w.x - 1, w.y - 1, 'u');
  }
  // Çatı
  g.hline(6, 25, 9, 'K');
  g.hline(7, 24, 8, 'U').hline(8, 23, 7, 'C').hline(9, 22, 6, 'C').hline(10, 21, 5, 'Z').hline(11, 20, 4, 'C').hline(12, 19, 3, 'C');
  g.hline(7, 24, 8, 'U');
  g.vline(15, 4, 8, 'U').vline(18, 5, 8, 'U');
  g.hline(13, 18, 2, 'K');
  // Flama direği
  g.vline(16, -1 + 1, 2, 'K').vline(16, 0, 3, 'x');
  g.rect(17, 0, 4, 3, 'o').set(20, 1, 'o').set(21, 1, 'C').hline(17, 20, 0, 'Z');
  // Fener (köşkün önünde)
  g.rect(13, 12, 6, 6, 'K').rect(14, 13, 4, 4, lit ? 'P' : 'Y');
  if (lit) g.set(15, 14, 'u').set(16, 14, 'u');
  g.hline(14, 17, 13, lit ? 'u' : 'P');
  return g.toRows();
}

export function getGuardTowerSprite(lit = false) {
  return getSprite(`building:guardTower:${lit ? 1 : 0}`, () => buildGuardTowerRows(Boolean(lit)));
}
