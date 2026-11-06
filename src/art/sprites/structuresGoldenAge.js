// (20. aşama) Altın Çağ'ın prestij peyzajı. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   Mermer Çeşme (2x2, 32x36): beyaz mermer sekizgen havuz, altın kuşaklı, ortada üç katlı mermer sütun ve altın
//     tepelik; sütundan fışkıran su dört karede kabarıp iner, havuzda parıltılar dolaşır.
//   Altın Çağ Feneri (1x1, 16x40): koyu dökme demir direk, altın kuşaklar ve kıvrık altın kollar; taç biçimli fanus.
//     Gece sıcak altın sarısı yanar (ışığı demir fenerden geniştir).
import { getSprite, CharGrid } from '../PixelSprite.js';

export const MARBLE_FOUNTAIN_ART = { width: 32, height: 36 };
export const GOLDEN_LANTERN_ART = { width: 16, height: 40, light: { x: 8, y: 8 } };

// ---------------------------------------------------------------------------
// Mermer Çeşme
// ---------------------------------------------------------------------------

function buildMarbleFountainRows(frame) {
  const g = new CharGrid(MARBLE_FOUNTAIN_ART.width, MARBLE_FOUNTAIN_ART.height);
  // Gölge
  g.ellipse(16, 33.5, 14, 2.2, 'k');
  // Havuzun dış duvarı (sekizgen): mermer, altın kuşak
  g.rect(3, 22, 26, 11, 'K');
  g.rect(2, 24, 28, 7, 'K');
  g.rect(4, 23, 24, 9, 'u');
  g.rect(3, 25, 26, 5, 'u');
  g.hline(3, 28, 27, 'P').hline(4, 27, 28, 'Y'); // altın kuşak
  g.hline(4, 27, 31, 'q').hline(3, 28, 30, 'q');
  for (let x = 6; x <= 26; x += 5) g.set(x, 25, 'q').set(x, 29, 'q'); // mermer damarları
  // Su yüzeyi (havuzun içi, üstten görünür)
  g.rect(5, 20, 22, 4, 'K');
  g.rect(6, 20, 20, 3, 'b');
  g.hline(6, 25, 20, 'c');
  const glint = frame % 4;
  g.set(8 + glint * 4, 21, 'a').set(22 - glint * 3, 22, 'W').set(12 + ((glint + 2) % 4) * 3, 21, 'a');
  // Sütun: üç katlı mermer kaide ve gövde
  g.rect(13, 14, 6, 8, 'K').rect(14, 14, 4, 7, 'u').vline(17, 14, 20, 'q');
  g.rect(11, 12, 10, 3, 'K').hline(12, 19, 13, 'u').hline(12, 19, 12, 'P');
  g.rect(14, 6, 4, 6, 'K').rect(15, 6, 2, 6, 'u');
  g.rect(12, 4, 8, 3, 'K').hline(13, 18, 5, 'q').hline(13, 18, 4, 'u');
  // Altın tepelik
  g.set(15, 1, 'K').set(16, 1, 'K').set(15, 2, 'P').set(16, 2, 'Y').hline(14, 17, 3, 'K').set(15, 3, 'Y').set(16, 3, 'P');
  // Su: tepelikten ve kaide çanağından fışkıran, kareye göre kabarıp inen damlalar
  const lift = [0, 1, 2, 1][frame % 4];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = 16 + side * (3 + i * 2);
      const y = 6 + i * 3 - (i === 0 ? lift : 0) + (i === 3 ? 0 : Math.floor(lift / 2));
      g.set(x, y, i % 2 ? 'c' : 'a');
    }
    for (let i = 0; i < 3; i++) g.set(16 + side * (6 + i * 3), 14 + i * 2 - (lift > 1 ? 1 : 0), i === 2 ? 'c' : 'a');
  }
  g.set(15, 0, frame % 2 ? 'a' : '.').set(16, 0, frame % 2 ? '.' : 'W');
  return g.toRows();
}

export function getMarbleFountainSprite(frame = 0) {
  return getSprite(`building:marbleFountain:${frame % 4}`, () => buildMarbleFountainRows(frame % 4));
}

// ---------------------------------------------------------------------------
// Altın Çağ Feneri
// ---------------------------------------------------------------------------

function buildGoldenLanternRows(lit) {
  const g = new CharGrid(GOLDEN_LANTERN_ART.width, GOLDEN_LANTERN_ART.height);
  g.ellipse(8, 38.5, 5, 1.4, 'k');
  // Basamaklı kaide: koyu demir, altın kuşak
  g.rect(3, 35, 10, 3, 'K').hline(4, 11, 36, 'R').hline(4, 11, 35, 'P');
  g.rect(4, 32, 8, 3, 'K').hline(5, 10, 33, 'Q').hline(5, 10, 32, 'Y');
  // Direk: yivli, iki altın bilezik
  g.rect(6, 15, 4, 17, 'K');
  g.vline(7, 16, 31, 'R').vline(8, 16, 31, 'Q');
  g.hline(6, 9, 21, 'P').hline(6, 9, 27, 'P');
  // Kıvrık altın kollar
  g.set(4, 16, 'K').set(3, 15, 'P').set(3, 14, 'K').set(4, 13, 'P').set(11, 16, 'K').set(12, 15, 'P').set(12, 14, 'K').set(11, 13, 'P');
  g.hline(5, 10, 15, 'K').hline(5, 10, 14, 'Y');
  // Taç biçimli fanus: altın taç, cam, taban
  g.set(5, 0, 'P').set(8, 0, 'P').set(10, 0, 'P');
  g.hline(4, 11, 1, 'K').set(5, 1, 'Y').set(8, 1, 'Y').set(10, 1, 'Y');
  g.hline(4, 11, 2, 'P').hline(3, 12, 3, 'K');
  g.rect(3, 4, 10, 8, 'K');
  const glass = lit ? 'y' : 'a';
  const core = lit ? 'P' : 'c';
  g.rect(4, 4, 8, 7, glass);
  g.rect(6, 6, 4, 4, core);
  if (lit) g.set(7, 7, 'u').set(8, 7, 'u');
  g.vline(8, 4, 10, 'K').vline(5, 4, 10, 'Y');
  g.hline(3, 12, 12, 'K').hline(4, 11, 11, 'P').hline(5, 10, 13, 'K');
  return g.toRows();
}

export function getGoldenLanternSprite(lit) {
  return getSprite(`building:goldenLantern:${lit ? 'lit' : 'day'}`, () => buildGoldenLanternRows(Boolean(lit)));
}

// ---------------------------------------------------------------------------
// (22. aşama) Kraliyet Aslanlı Heykeli (2x2, 32x40): Kraliyet Beratı'yla dikilen anıt. Altın kuşaklı beyaz mermer kaide,
// önünde kraliyet arması (taçlı kalkan) işli altın levha, üstünde taç giymiş oturan altın aslan; iki yanda kırmızı flamalar.
// ---------------------------------------------------------------------------
export const ROYAL_STATUE_ART = { width: 32, height: 40 };

function buildRoyalStatueRows() {
  const g = new CharGrid(ROYAL_STATUE_ART.width, ROYAL_STATUE_ART.height);
  g.ellipse(16, 37.5, 14, 2.2, 'k');
  // Kaide
  g.rect(3, 22, 26, 3, 'K').hline(4, 27, 23, 'u').hline(4, 27, 24, 'q');
  g.rect(4, 25, 24, 13, 'K').rect(5, 25, 22, 11, 'u').vline(26, 25, 35, 'q').vline(5, 25, 35, 'q');
  g.hline(5, 26, 27, 'P').hline(5, 26, 28, 'Y').hline(5, 26, 35, 'q').hline(5, 26, 36, 'r');
  // Altın levha ve arma (taçlı kalkan)
  g.rect(11, 29, 10, 6, 'K').rect(12, 30, 8, 4, 'Y').hline(12, 19, 30, 'P');
  g.rect(15, 30, 2, 3, 'o').set(15, 33, 'o').set(16, 33, 'C').set(14, 30, 'P').set(17, 30, 'P');
  // Flamalar (iki köşede)
  for (const x of [5, 26]) {
    g.vline(x, 13, 22, 'K');
    g.rect(x === 5 ? 6 : 23, 13, 3, 4, 'o').set(x === 5 ? 8 : 23, 17, 'o').hline(x === 5 ? 6 : 23, x === 5 ? 8 : 25, 13, 'C');
    g.set(x, 12, 'P');
  }
  // Aslanın gövdesi (oturur, sağa dönük), kuyruğu
  g.rect(15, 12, 10, 10, 'K').rect(16, 13, 8, 9, 'Y').hline(16, 23, 13, 'P').vline(23, 14, 21, 'O');
  g.ellipse(21, 18, 3, 3, 'Y').hline(19, 23, 21, 'O');
  g.line(25, 15, 27, 11, 'K').set(28, 10, 'O').set(27, 10, 'O').set(28, 9, 'P');
  // Ön ayaklar
  g.rect(10, 16, 4, 6, 'K').rect(11, 16, 2, 5, 'Y').hline(10, 14, 21, 'K').hline(11, 13, 20, 'P');
  g.rect(14, 17, 3, 5, 'K').rect(15, 17, 1, 4, 'Y');
  // Yele ve baş
  g.ellipse(12, 10, 6, 6, 'K');
  g.ellipse(12, 10, 5, 5, 'O');
  g.ellipse(12, 10, 3.6, 3.6, 'Y');
  g.ellipse(12, 11, 2.4, 2.2, 'P');
  g.set(11, 10, 'K').set(13, 10, 'K').set(12, 12, 'x').hline(11, 13, 13, 'O');
  // Taç
  g.hline(9, 15, 4, 'K').hline(10, 14, 3, 'Y').set(10, 2, 'P').set(12, 1, 'P').set(14, 2, 'P').set(12, 2, 'o');
  return g.toRows();
}

export function getRoyalStatueSprite() {
  return getSprite('building:royalStatue', buildRoyalStatueRows);
}
