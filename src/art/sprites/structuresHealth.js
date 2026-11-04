// 11. aşama: Şifacı / Aktar Kulübesi (2x2, görsel 32x42).
//   - ahşap çatkılı sıvalı küçük kulübe, yuvarlak pencerede renkli iksir şişeleri, yaprak işaretli tabela
//   - saman çatının üstünde ve saçağında kurumaya asılmış şifalı ot demetleri (yeşil, lavanta, papatya)
//   - önde tezgâhta taş havan; sağda üç ayaklı küçük kazan: şifacı çalışırken içindeki yeşil iksir kaynar
//     ve buhar tüter (bkz. Building), saksılarda nane ve adaçayı
// Görsel yapının kapladığı karoların ALT kenarına hizalanır; çatı üstteki karoya 10 piksel taşar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const HEALER_ART = { width: 32, height: 42, steam: { x: 26, y: 27 }, window: { x: 15.5, y: 23.5 } };

// Saçaktan sarkan ot demetleri: [x, renk]
const BUNDLES = [
  [4, 'v'],
  [8, 'i'],
  [12, 'V'],
  [20, 'u'],
  [24, 'v'],
  [28, 'i'],
];

function buildHealerRows(active, frame, lit) {
  const g = new CharGrid(HEALER_ART.width, HEALER_ART.height);
  g.rect(2, 40, 30, 2, 'k');

  // Gövde: sıvalı duvar, ahşap çatkı
  g.rect(2, 18, 28, 20, 'K');
  g.rect(3, 19, 26, 18, 'S');
  g.hline(3, 28, 19, 'X').hline(3, 28, 28, 'X').hline(3, 28, 36, 'x');
  for (const x of [3, 28]) g.vline(x, 19, 36, 'X');
  g.line(4, 29, 9, 35, 'w');
  g.line(27, 29, 22, 35, 'w');
  // Taş temel
  g.rect(2, 37, 28, 3, 'K');
  g.rect(3, 37, 26, 2, 'r');
  g.hline(3, 28, 37, 'q');
  for (let x = 6; x < 28; x += 5) g.set(x, 38, 'M');

  // Kapı (sağda) ve yuvarlak pencere (ortada), şişeler
  g.rect(18, 26, 7, 11, 'K');
  g.rect(19, 27, 5, 10, 'w');
  g.hline(19, 23, 27, 'X');
  g.vline(21, 28, 36, 'x');
  g.set(22, 32, 'P');
  g.ellipse(11.5, 23.5, 3.6, 3.6, 'K');
  g.ellipse(11.5, 23.5, 2.7, 2.7, lit ? 'y' : 'a');
  g.vline(11, 21, 26, 'K');
  if (!lit) g.set(10, 22, 'u');
  // Pencere içindeki iksir şişeleri (yeşil, mor, kırmızı)
  g.set(10, 25, 'v').set(10, 24, 'v').set(12, 25, 'i').set(13, 25, 'o').set(13, 24, 'o');
  g.hline(7, 16, 27, 'X');

  // Yaprak işaretli tabela (kapının yanında)
  g.rect(24, 21, 6, 5, 'K');
  g.rect(25, 22, 4, 3, 'E');
  g.set(26, 23, 'v').set(27, 22, 'V').set(27, 23, 'v');
  g.vline(27, 19, 20, 'x');

  // Saman çatı: aşağı doğru genişler, saçağı sarkık
  for (let y = 6; y <= 19; y++) {
    const inset = Math.max(0, Math.floor((19 - y) / 2) - 1);
    for (let x = inset; x < 32 - inset; x++) {
      const streak = (x * 7 + y * 3) % 5;
      g.set(x, y, streak === 0 ? 'X' : y % 4 === 0 ? 'Y' : 'P');
    }
    g.set(inset, y, 'K').set(31 - inset, y, 'K');
  }
  g.hline(6, 25, 5, 'K');
  g.hline(0, 31, 19, 'X');
  g.hline(0, 31, 20, 'K');
  // Çatının sırtında kurumaya serilmiş ot demetleri
  for (const [x, c] of [[8, 'v'], [13, 'i'], [18, 'V'], [23, 'v']]) {
    g.set(x, 7, c).set(x + 1, 7, c).set(x, 8, 'f').set(x + 1, 8, c).set(x + 2, 8, 'f');
  }
  // Saçaktan sarkan demetler (iple bağlı)
  for (const [x, c] of BUNDLES) {
    g.set(x, 21, 'x');
    g.set(x - 1, 22, c).set(x, 22, c).set(x + 1, 22, c === 'u' ? 'P' : c);
    g.set(x, 23, c === 'i' ? 'i' : 'f');
  }

  // Önde tezgâh ve taş havan (şifacı burada çalışır)
  g.rect(2, 33, 11, 3, 'K');
  g.hline(3, 11, 33, 'E');
  g.hline(3, 11, 34, 'X');
  g.vline(3, 36, 38, 'x').vline(11, 36, 38, 'x');
  g.stamp(['.KKK.', 'KqqqK', 'KrRrK', '.KKK.'], 4, 29);
  g.set(6, 28, 'x').set(7, 27, 'x');
  g.set(9, 32, 'v').set(10, 32, 'V'); // tezgâhta taze yapraklar

  // Sağda kazan: çalışırken yeşil iksir kaynar
  g.ellipse(26, 35.5, 3.6, 2.8, 'K');
  g.ellipse(26, 35.5, 2.6, 1.8, 'Q');
  g.hline(23, 29, 33, 'K');
  g.hline(24, 28, 33, active ? (frame % 2 === 0 ? 'v' : 'V') : 'f');
  if (active) g.set(25 + (frame % 2), 33, 'u');
  g.set(23, 38, 'K').set(29, 38, 'K');
  if (active) {
    g.set(25, 39, 'O').set(26, 39, frame % 2 === 0 ? 'P' : 'Y').set(27, 39, 'O');
  }
  // Saksılarda nane ve adaçayı
  g.stamp(['.vVv.', 'vvfvv', '.KCK.', '.KUK.'], 13, 35);
  return g.toRows();
}

/**
 * @param {boolean} active şifacı çalışıyor: kazanda iksir kaynar
 * @param {number} frame kaynama karesi
 * @param {boolean} lit gece: pencere yanar
 */
export function getHealerHutSprite(active = false, frame = 0, lit = false) {
  const f = active ? frame % 2 : 0;
  return getSprite(`building:healerHut:${active ? 1 : 0}:${f}:${lit ? 1 : 0}`, () => buildHealerRows(active, f, lit));
}
