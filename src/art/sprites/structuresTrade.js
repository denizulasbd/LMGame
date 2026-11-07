// (24.3) Dış ticaret görselleri. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   Ticaret İskelesi / Kervan Konağı (3x2, 48x40): taş temelli ahşap ambar, çizgili tente, kapı üstünde altın sikkeli tabela,
//     önde terazi, sandıklar ve balyalar; gece tentenin altındaki fener yanar. Gemi / kervan buradayken (docked) tentenin önüne
//     renkli flamalar asılır ve tüccarın sandıkları açılır.
//   Ticaret Gemisi (40x32): iki direkli değil, tek direkli geniş gövdeli yük gemisi; kırmızı-krem çizgili yelken, flama, kıç
//     fenerli kamara; yanaştığı su karosunun dibine hizalanır (yapının sol yanındaysa aynalanır).
//   Kervan (40x28): branda örtülü dört tekerli yük arabası, koşulu bir katır ve arabanın üstünde balyalar.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const TRADING_POST_ART = { width: 48, height: 40, lamp: { x: 24, y: 20 } };
export const TRADE_SHIP_ART = { width: 40, height: 32 };
export const CARAVAN_ART = { width: 40, height: 28 };

function buildTradingPostRows(lit, docked) {
  const g = new CharGrid(TRADING_POST_ART.width, TRADING_POST_ART.height);
  g.ellipse(24, 38, 23, 2, 'k');
  // Taş temel ve ahşap ambar
  g.rect(1, 33, 46, 6, 'K');
  g.rect(2, 34, 44, 4, 'r');
  g.hline(2, 45, 34, 'q');
  for (const x of [8, 16, 24, 32, 40]) g.vline(x, 35, 37, 'M');
  g.rect(3, 12, 42, 22, 'K');
  for (let x = 4; x <= 43; x++) g.vline(x, 13, 32, x % 4 === 0 ? 'x' : x % 4 === 2 ? 'X' : 'w');
  // Kırma çatı (ahşap kiremit)
  for (let y = 2; y <= 12; y++) {
    const inset = Math.max(0, 8 - Math.floor((y - 2) * 0.8));
    g.hline(inset, 47 - inset, y, (y - 2) % 3 === 2 ? 'x' : 'X');
    g.set(inset, y, 'K').set(47 - inset, y, 'K');
  }
  g.hline(8, 39, 1, 'K').hline(9, 38, 2, 'E');
  g.hline(0, 47, 12, 'K');
  // Altın sikkeli tabela
  g.rect(18, 4, 12, 6, 'K').rect(19, 5, 10, 4, 'w');
  g.ellipse(24, 7, 2, 1.5, 'P').set(24, 7, 'Y');
  // Geniş ambar kapısı (açık; içeride çuvallar)
  g.rect(17, 19, 14, 14, 'K');
  g.rect(18, 20, 12, 13, 'x');
  g.rect(19, 27, 4, 5, 'S').rect(24, 26, 5, 6, 'z');
  // Çizgili tente
  for (let x = 14; x <= 33; x++) g.vline(x, 15, 17, Math.floor((x - 14) / 2) % 2 ? 'u' : 'o');
  g.hline(14, 33, 18, 'K');
  // Fener
  g.set(24, 19, 'K').set(24, 20, lit ? 'y' : 'Q').set(24, 21, lit ? 'P' : 'R');
  // Terazi (solda), sandıklar ve balya (sağda)
  g.vline(8, 23, 32, 'K').hline(4, 12, 23, 'K');
  g.hline(3, 6, 26, 'P').hline(10, 13, 25, 'P');
  g.vline(4, 24, 25, 'K').vline(12, 24, 24, 'K');
  g.rect(35, 26, 7, 7, 'K').rect(36, 27, 5, 5, 'X').hline(36, 40, 29, 'x');
  g.rect(40, 22, 6, 5, 'K').rect(41, 23, 4, 3, 'S').hline(41, 44, 24, 'c');
  if (docked) {
    // Flamalar ve açık sandık (altın parıltısı)
    for (let x = 4; x <= 43; x += 3) g.set(x, 13, ['o', 'P', 'c', 'p'][(x / 3) % 4 | 0]);
    g.rect(36, 24, 5, 2, 'P').set(38, 23, 'y');
  }
  return g.toRows();
}

export function getTradingPostSprite(lit = false, docked = false) {
  return getSprite(`building:tradingPost:${lit ? 1 : 0}:${docked ? 1 : 0}`, () => buildTradingPostRows(lit, docked));
}

function buildShipRows(lit) {
  const g = new CharGrid(TRADE_SHIP_ART.width, TRADE_SHIP_ART.height);
  // Suda gölge ve dalga
  g.hline(2, 37, 31, 'N');
  g.hline(4, 35, 30, 'b');
  // Geniş gövde
  g.rect(3, 22, 34, 8, 'K');
  g.rect(4, 23, 32, 6, 'w');
  g.hline(4, 35, 23, 'X');
  g.hline(4, 35, 26, 'x');
  for (const x of [9, 15, 21, 27]) g.set(x, 24, 'K');
  g.hline(0, 3, 22, 'K').hline(36, 39, 22, 'K');
  // Kıç kamarası ve feneri
  g.rect(28, 17, 8, 6, 'K').rect(29, 18, 6, 4, 'X');
  g.set(31, 19, lit ? 'y' : 'c').set(33, 19, lit ? 'y' : 'c');
  g.set(36, 16, 'K').set(36, 17, lit ? 'P' : 'R');
  // Direk, yelken (kırmızı-krem çizgili) ve flama
  g.vline(17, 1, 22, 'x');
  for (let y = 3; y <= 19; y++) {
    const half = Math.min(11, 3 + Math.floor((y - 3) * 0.6));
    g.hline(17 - half, 16, y, (y >> 1) % 2 ? 'o' : 'u');
    g.set(17 - half, y, 'K');
  }
  g.hline(6, 16, 20, 'K');
  g.hline(18, 22, 1, 'o').hline(18, 20, 2, 'o');
  // Güvertede sandıklar
  g.rect(6, 19, 4, 3, 'K').rect(7, 20, 2, 1, 'X');
  g.rect(21, 18, 5, 4, 'K').rect(22, 19, 3, 2, 'S');
  return g.toRows();
}

export function getTradeShipSprite(lit = false, flipped = false) {
  return getSprite(`visitor:ship:${lit ? 1 : 0}:${flipped ? 'L' : 'R'}`, () => {
    const rows = buildShipRows(lit);
    return flipped ? rows.map((r) => [...r].reverse().join('')) : rows;
  });
}

function buildCaravanRows() {
  const g = new CharGrid(CARAVAN_ART.width, CARAVAN_ART.height);
  g.ellipse(20, 26, 19, 2, 'k');
  // Branda örtülü araba
  g.rect(14, 6, 24, 14, 'K');
  for (let y = 7; y <= 18; y++) g.hline(15, 36, y, y < 9 ? 'S' : 's');
  for (const x of [19, 25, 31]) g.vline(x, 7, 18, 'z');
  g.rect(13, 18, 26, 4, 'K').rect(14, 19, 24, 2, 'w');
  // Tekerlekler
  for (const cx of [18, 33]) {
    g.ellipse(cx, 23, 3, 3, 'K');
    g.ellipse(cx, 23, 2, 2, 'X');
    g.set(cx, 23, 'K');
  }
  // Üstte balyalar
  g.rect(18, 3, 6, 4, 'K').rect(19, 4, 4, 2, 'c');
  g.rect(26, 2, 7, 5, 'K').rect(27, 3, 5, 3, 'o');
  // Ok ve katır
  g.hline(6, 13, 19, 'x');
  g.rect(2, 12, 8, 6, 'K').rect(3, 13, 6, 4, 'R');
  g.rect(0, 9, 4, 5, 'K').rect(1, 10, 2, 3, 'R');
  g.set(1, 8, 'K').set(3, 8, 'K');
  for (const x of [3, 8]) g.vline(x, 18, 24, 'K');
  g.set(2, 11, 'u');
  return g.toRows();
}

export function getCaravanSprite(flipped = false) {
  return getSprite(`visitor:caravan:${flipped ? 'L' : 'R'}`, () => {
    const rows = buildCaravanRows();
    return flipped ? rows.map((r) => [...r].reverse().join('')) : rows;
  });
}
