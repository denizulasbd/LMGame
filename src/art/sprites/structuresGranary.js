// (24. aşama) Tarımsal çeşitlilik yapıları. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   Ürün Silosu (2x2, 32x48): kesme taş temel üstünde demir çemberli, dikey ahşap kalaslı yuvarlak ambar; konik kiremit çatı,
//     tepede havalandırma şapkası, yükleme kapağı ve makara kolu, dibinde ahşap kapı ve önünde buğday çuvalı ile keten demeti.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const SILO_ART = { width: 32, height: 48 };

function buildSiloRows() {
  const g = new CharGrid(SILO_ART.width, SILO_ART.height);
  g.ellipse(16, 45.5, 15, 2.5, 'k');

  // Kesme taş temel (alçak, geniş)
  g.rect(3, 38, 26, 8, 'K');
  g.rect(4, 39, 24, 6, 'r');
  g.hline(4, 27, 39, 'q');
  g.hline(4, 27, 42, 'R');
  for (const x of [8, 14, 20, 26]) g.vline(x, 39, 41, 'M');
  for (const x of [5, 11, 17, 23]) g.vline(x, 43, 44, 'M');

  // Yuvarlak ahşap gövde: solda ışık, sağda gölge (silindir)
  g.rect(5, 14, 22, 25, 'K');
  for (let x = 6; x <= 25; x++) {
    const shade = x <= 8 ? 'E' : x <= 15 ? 'X' : x <= 21 ? 'w' : 'x';
    g.vline(x, 15, 37, shade);
  }
  // Kalas aralıkları
  for (const x of [9, 13, 17, 21]) g.vline(x, 15, 37, x <= 13 ? 'w' : 'x');
  // Demir çemberler
  for (const y of [18, 26, 34]) {
    g.hline(6, 25, y, 'Q');
    g.set(7, y, 'r').set(8, y, 'q');
  }

  // Konik kiremit çatı (saçak gövdeden taşar)
  for (let y = 3; y <= 14; y++) {
    const half = Math.round(((y - 3) / 11) * 14);
    const x0 = 16 - half;
    const x1 = 15 + half;
    g.hline(x0, x1, y, (y - 3) % 3 === 2 ? 'U' : 'C');
    if (half > 1) g.hline(x0 + 1, Math.min(x1, x0 + Math.max(1, Math.floor(half / 2))), y, (y - 3) % 3 === 2 ? 'C' : 'Z');
    g.set(x0, y, 'K').set(x1, y, 'K');
  }
  g.hline(1, 30, 15, 'K');
  g.hline(2, 29, 14, 'U');
  // Tepedeki havalandırma şapkası
  g.rect(14, 0, 4, 3, 'K');
  g.hline(15, 16, 1, 'X');
  g.hline(13, 18, 2, 'K');

  // Yükleme kapağı ve makara kolu (gövdenin üstünde)
  g.rect(13, 19, 6, 5, 'K');
  g.rect(14, 20, 4, 3, 'x');
  g.hline(14, 17, 21, 'P'); // içeride parlayan buğday
  g.hline(18, 23, 16, 'x');
  g.vline(23, 16, 21, 'x');
  g.set(23, 22, 'K');

  // Ahşap kapı (tabanda)
  g.rect(12, 29, 8, 10, 'K');
  g.rect(13, 30, 6, 9, 'w');
  g.vline(16, 30, 38, 'x');
  g.hline(13, 18, 33, 'X');
  g.set(14, 35, 'P');

  // Önde buğday çuvalı ve keten demeti
  g.rect(22, 39, 6, 6, 'K');
  g.rect(23, 40, 4, 4, 'S');
  g.hline(23, 26, 40, 'P');
  g.set(24, 42, 's').set(25, 41, 'z');
  g.stamp(['.c.a.', 'cvavc', '.v.v.', '.XXX.', '.v.v.', '.f.f.'], 3, 38);
  return g.toRows();
}

export function getSiloSprite() {
  return getSprite('building:silo', buildSiloRows);
}
