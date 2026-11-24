// (32.2) Adalet Sarayı (3x3, görsel 48x56). Görsel yapının kapladığı karoların ALT kenarına hizalanır; alınlık üst karoya 8 piksel taşar.
//   - kesme taş gövde, dört beyaz sütunlu revak, üçgen alınlıkta altın terazi kabartması, ince kiremit saçak (kışın karlanır)
//   - kemerli çift kanat kapı, üç sıra geniş taş basamak; basamak yanlarında mevsimle boyanan saksılar
//     (ilkbahar pembe, yaz sarı-yeşil, sonbahar turuncu, kışın karlı boş saksı)
//   - açık dava varken kapının sağ kanadında küçük bir parşömen işareti (building.look.cases; kaydedilmez)
import { getSprite, CharGrid } from '../PixelSprite.js';

export const COURTHOUSE_ART = { width: 48, height: 56 };

const POTS = {
  spring: ['p', 'v'],
  summer: ['P', 'v'],
  autumn: ['O', 'Y'],
  winter: null,
};

function buildCourthouseRows(season = 'summer', notice = false) {
  const W = COURTHOUSE_ART.width;
  const g = new CharGrid(W, COURTHOUSE_ART.height);
  g.ellipse(24, 54.2, 22, 1.6, 'k');
  // basamaklar (üç sıra, aşağı doğru genişler)
  g.rect(13, 47, 22, 2, 'q').hline(13, 34, 47, 'Q');
  g.rect(11, 49, 26, 2, 'r').hline(11, 36, 49, 'Q');
  g.rect(9, 51, 30, 3, 'q').hline(9, 38, 51, 'Q').hline(9, 38, 53, 'R');
  // gövde ve kaide
  g.rect(3, 22, 42, 25, 'Q');
  g.rect(4, 23, 40, 23, 'r');
  for (let y = 25; y < 45; y += 4) {
    g.hline(4, 43, y, 'R');
    for (let x = 6 + ((y / 4) % 2) * 3; x < 44; x += 6) g.set(x, y + 1, 'R').set(x, y + 2, 'R');
  }
  g.rect(3, 45, 42, 2, 'Q').hline(4, 43, 45, 'q');
  // revak: tavan bandı ve dört sütun
  g.rect(5, 22, 38, 3, 'q').hline(5, 42, 24, 'R').hline(5, 42, 22, 'u');
  for (const x of [8, 15, 30, 37]) {
    g.rect(x, 25, 3, 20, 'u').vline(x + 2, 25, 44, 'q').vline(x, 25, 44, 'S');
    g.rect(x - 1, 25, 5, 1, 'q').rect(x - 1, 44, 5, 1, 'q'); // başlık ve kaide
  }
  // kemerli çift kanat kapı
  g.rect(19, 31, 10, 14, 'K');
  g.rect(20, 32, 8, 13, 'x');
  g.hline(21, 26, 31, 'K').set(20, 32, 'K').set(27, 32, 'K');
  g.vline(23, 33, 44, 'K').vline(24, 33, 44, 'K');
  g.rect(21, 34, 2, 9, 'w').rect(25, 34, 2, 9, 'w');
  g.set(22, 39, 'P').set(25, 39, 'P'); // kulplar
  // kapının üstünde altın şerit
  g.hline(18, 29, 30, 'Y');
  // alınlık (üçgen) ve saçak
  for (let i = 0; i <= 11; i++) {
    const y = 10 + i;
    const x0 = 24 - i * 2 - 1;
    const x1 = 24 + i * 2;
    g.hline(Math.max(1, x0), Math.min(W - 2, x1), y, 'S');
    g.set(Math.max(1, x0), y, 'Q').set(Math.min(W - 2, x1), y, 'Q');
    // saçak: alınlığın eğik kenarında ince kiremit
    g.set(Math.max(0, x0 - 1), y, 'U').set(Math.min(W - 1, x1 + 1), y, 'U');
    if (x0 - 2 >= 0) g.set(x0 - 2, y, 'C');
    if (x1 + 2 <= W - 1) g.set(x1 + 2, y, 'C');
  }
  g.set(23, 9, 'C').set(24, 9, 'C').set(23, 8, 'Z').set(24, 8, 'Z');
  g.hline(1, 46, 21, 'Q').hline(2, 45, 20, 's');
  // terazi kabartması (altın)
  g.vline(24, 12, 19, 'Y').set(23, 19, 'Y').set(25, 19, 'Y').hline(22, 26, 20, 'P');
  g.hline(18, 30, 13, 'P').set(24, 12, 'P');
  g.vline(18, 14, 15, 'Y').vline(30, 14, 15, 'Y');
  g.hline(16, 20, 16, 'Y').hline(17, 19, 17, 'P');
  g.hline(28, 32, 16, 'Y').hline(29, 31, 17, 'P');
  // mevsim saksıları (basamakların iki yanı)
  const pots = POTS[season] ?? POTS.summer;
  for (const x of [5, 40]) {
    g.rect(x, 49, 4, 4, 'D').hline(x, x + 3, 49, 'd').hline(x, x + 3, 52, 'x');
    if (pots) {
      g.rect(x, 46, 4, 3, pots[1]);
      g.set(x, 46, pots[0]).set(x + 2, 46, pots[0]).set(x + 1, 47, pots[0]).set(x + 3, 47, pots[0]);
    } else g.hline(x, x + 3, 48, 'u');
  }
  // açık dava: kapının sağ kanadında mühürlü küçük parşömen
  if (notice) {
    g.rect(25, 35, 3, 4, 'S').hline(25, 27, 35, 'e').hline(25, 27, 38, 'e');
    g.set(26, 36, 'K').set(26, 37, 'K').set(27, 38, 'o');
  }
  return g.toRows();
}

/** Adalet Sarayı: mevsim (saksılar) ve açık dava işareti. */
export function getCourthouseSprite(season = 'summer', notice = false) {
  const key = POTS[season] !== undefined ? season : 'summer';
  return getSprite(`building:courthouse:${key}:${notice ? 1 : 0}`, () => buildCourthouseRows(key, notice));
}
