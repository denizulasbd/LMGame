// (24.2) Katma değerli üretim yapıları. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   Dokuma Tezgâhı (2x2, 32x40): taş temelli, ön yüzü açık ahşap atölye; kiremit çatının altında mavi-bej çözgü iplikli büyük
//     tezgâh, yanda katlanmış kumaş topları ve keten demeti. Dokumacı çalışırken (active) mekik çözgünün iki ucu arasında gider gelir.
//   Şerbethane (2x2, 32x40): kesme taş mahzen, kemerli ahşap kapı, kiremit çatı ve tüten baca; önde demir çemberli fıçılar ve
//     bakır kazan. Mahzen ustası çalışırken (active) kazanın altında ateş yanar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const LOOM_ART = { width: 32, height: 40 };
export const BREWERY_ART = { width: 32, height: 40, chimney: { x: 25, y: 2 } };

function buildLoomRows(frame) {
  const g = new CharGrid(LOOM_ART.width, LOOM_ART.height);
  g.ellipse(16, 38, 15, 2, 'k');
  // Taş temel
  g.rect(1, 33, 30, 6, 'K');
  g.rect(2, 34, 28, 4, 'r');
  g.hline(2, 29, 34, 'q');
  for (const x of [7, 14, 21, 27]) g.vline(x, 35, 37, 'M');
  // Arka duvar (koyu kalas) ve köşe direkleri
  g.rect(3, 13, 26, 21, 'x');
  for (let x = 4; x < 28; x += 4) g.vline(x, 13, 32, 'w');
  for (const x of [2, 28]) g.rect(x, 12, 2, 22, 'K').vline(x + 1, 12, 32, 'X');
  // Kiremit çatı
  for (let y = 2; y <= 12; y++) {
    const inset = Math.max(0, 6 - Math.floor((y - 2) * 0.6));
    g.hline(inset, 31 - inset, y, (y - 2) % 3 === 2 ? 'U' : 'C');
    g.set(inset, y, 'K').set(31 - inset, y, 'K');
  }
  g.hline(6, 25, 1, 'K');
  g.hline(7, 24, 2, 'Z');
  g.hline(0, 31, 12, 'K');
  // Dokuma tezgâhı: çerçeve, çözgü iplikleri, dokunmuş kumaş ve göğüs kirişi
  g.rect(7, 15, 18, 15, 'K');
  g.rect(8, 16, 16, 13, 'x');
  for (let x = 9; x <= 22; x++) g.vline(x, 16, 22, x % 2 ? 'S' : 'c');
  g.rect(9, 23, 14, 4, 'S');
  for (let x = 9; x <= 22; x += 3) g.vline(x, 23, 26, 'z');
  g.hline(8, 23, 22, 'X');
  g.hline(7, 24, 27, 'X').hline(7, 24, 28, 'w');
  // Mekik (çalışırken bir uçtan ötekine)
  const sx = frame % 2 ? 18 : 10;
  g.rect(sx, 21, 4, 2, 'K').hline(sx + 1, sx + 2, 21, 'E');
  // Tezgâhın ayakları ve pedal
  g.vline(8, 29, 32, 'K').vline(23, 29, 32, 'K');
  g.hline(12, 19, 31, 'w');
  // Sağda katlanmış kumaş topları, solda keten demeti
  g.rect(25, 26, 5, 7, 'K');
  g.rect(26, 27, 3, 2, 'S').rect(26, 29, 3, 1, 'c').rect(26, 30, 3, 2, 'S');
  g.stamp(['.c.a.', 'cvavc', '.v.v.', '.XXX.', '.v.v.', '.f.f.'], 2, 27);
  return g.toRows();
}

export function getLoomSprite(active = false, frame = 0) {
  const f = active ? frame % 2 : 0;
  return getSprite(`building:loom:${f}`, () => buildLoomRows(f));
}

function buildBreweryRows(active, frame) {
  const g = new CharGrid(BREWERY_ART.width, BREWERY_ART.height);
  g.ellipse(16, 38, 15, 2, 'k');
  // Kesme taş gövde
  g.rect(2, 14, 28, 25, 'K');
  g.rect(3, 15, 26, 23, 'r');
  for (let y = 17; y < 38; y += 3) g.hline(3, 28, y, 'R');
  for (let y = 15; y < 38; y += 3) for (let x = 4 + ((y / 3) % 2) * 3; x < 28; x += 6) g.vline(x, y, y + 1, 'M');
  g.hline(3, 28, 15, 'q');
  // Kiremit çatı ve baca
  for (let y = 4; y <= 14; y++) {
    const inset = Math.max(0, 7 - Math.floor((y - 4) * 0.7));
    g.hline(inset, 31 - inset, y, (y - 4) % 3 === 2 ? 'U' : 'C');
    g.set(inset, y, 'K').set(31 - inset, y, 'K');
  }
  g.hline(7, 24, 3, 'K').hline(8, 23, 4, 'Z');
  g.hline(0, 31, 14, 'K');
  g.rect(23, 0, 5, 9, 'K').rect(24, 1, 3, 7, 'R').hline(24, 26, 1, 'q');
  // Kemerli ahşap kapı
  g.rect(11, 22, 10, 16, 'K');
  g.rect(12, 23, 8, 15, 'w');
  g.hline(13, 18, 22, 'K');
  for (const x of [14, 17]) g.vline(x, 24, 37, 'x');
  g.set(18, 30, 'Y');
  // Fıçılar (solda üst üste), bakır kazan (sağda) ve altında ateş
  const cask = ['.KKKK.', 'KXEXwK', 'QQQQQQ', 'KXEXwK', '.KKKK.'];
  g.stamp(cask, 2, 33);
  g.stamp(cask, 3, 28);
  g.rect(22, 29, 8, 7, 'K');
  g.rect(23, 30, 6, 5, 'O');
  g.hline(23, 28, 30, 'Y');
  g.hline(24, 27, 29, 'q');
  g.vline(23, 36, 37, 'K').vline(28, 36, 37, 'K');
  if (active) {
    g.hline(24, 27, 37, frame % 2 ? 'o' : 'O');
    g.set(25 + (frame % 2), 36, 'P');
  }
  return g.toRows();
}

export function getBrewerySprite(active = false, frame = 0) {
  const f = active ? frame % 2 : 0;
  return getSprite(`building:brewery:${active ? 1 : 0}:${f}`, () => buildBreweryRows(active, f));
}
