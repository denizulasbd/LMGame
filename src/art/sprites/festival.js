// 14. aşama: mevsim festivallerinin süslemeleri (karo kaplamaz, yalnızca çizilir; yerlerini SeasonFestivalSystem seçer).
//   flowerArch   (22x28) Çiçek Şenliği'nin pembe-beyaz-sarı çiçeklerle örülü kemeri
//   flowerBasket (12x12) çiçek dolu hasır sepet
//   feastTable   (26x16) Güneş ve Nehir Panayırı'nın ziyafet sofrası: karpuz, ekmek, balık, sürahi
//   flagPole     (6x26)  tepesinde dalgalanan renkli flama (iki kare)
//   harvestBasket(22x20) Büyük Hasat Bayramı'nın dev hasat sepeti: elma, buğday başakları, mısır
//   pumpkin      (10x9)  turuncu dev kabak
//   ciderBarrel  (12x15) musluklu elma şırası fıçısı
//   snowman      (14x24) Işıklar Gecesi'nin kardan adamı: üç kademede yükselir (gövde, orta, baş ve şapka)
//   flowerCrown  (4x3)   Çiçek Şenliği'nde sakinlerin saçına taktığı çiçek
import { getSprite, CharGrid } from '../PixelSprite.js';

function flowerArchRows() {
  const g = new CharGrid(22, 28);
  g.hline(1, 4, 27, 'k').hline(17, 20, 27, 'k');
  // İki ahşap direk
  for (const x of [2, 18]) {
    g.rect(x, 8, 3, 19, 'K');
    g.vline(x + 1, 9, 26, 'w');
  }
  // Kemer: dış K, içi yeşil sarmaşık
  for (let y = 0; y <= 11; y++) {
    for (let x = 0; x < 22; x++) {
      const d = Math.hypot(x + 0.5 - 11, y + 0.5 - 11);
      if (d <= 10.6 && d > 9.4) g.set(x, y, 'K');
      else if (d <= 9.4 && d > 6.8) g.set(x, y, (x + y) % 3 === 0 ? 'V' : 'v');
      else if (d <= 6.8 && d > 6) g.set(x, y, 'K');
    }
  }
  // Çiçekler kemer boyunca ve direklerde
  const colors = ['p', 'u', 'P', 'i', 'o'];
  const spots = [[3, 7], [5, 4], [8, 2], [11, 1], [14, 2], [17, 4], [19, 7], [6, 6], [16, 6], [11, 3], [3, 12], [19, 13], [2, 17], [20, 19], [3, 22], [19, 24]];
  spots.forEach(([x, y], i) => {
    const c = colors[i % colors.length];
    g.set(x, y, c).set(x + 1, y, c).set(x, y + 1, c === 'u' ? 'P' : 'Y');
  });
  return g.toRows();
}

function flowerBasketRows() {
  const g = new CharGrid(12, 12);
  g.hline(1, 10, 11, 'k');
  g.rect(1, 6, 10, 5, 'K');
  g.rect(2, 7, 8, 3, 'X');
  for (let x = 2; x < 10; x += 2) g.vline(x, 7, 9, 'E');
  g.line(2, 6, 5, 2, 'x').line(9, 6, 6, 2, 'x');
  const colors = ['p', 'u', 'P', 'i', 'o', 'p'];
  [[2, 5], [4, 4], [6, 3], [8, 4], [9, 5], [5, 5], [7, 5]].forEach(([x, y], i) => g.set(x, y, colors[i % colors.length]).set(x, y + 1, 'v'));
  return g.toRows();
}

function feastTableRows() {
  const g = new CharGrid(26, 16);
  g.hline(1, 24, 15, 'k');
  // Kırmızı-beyaz damalı örtülü uzun masa
  g.rect(0, 5, 26, 6, 'K');
  for (let y = 6; y < 10; y++) for (let x = 1; x < 25; x++) g.set(x, y, (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? 'o' : 'u');
  g.hline(1, 24, 10, 'U');
  for (const x of [2, 23]) g.vline(x, 11, 14, 'x');
  // Yiyecekler: karpuz dilimi, ekmek, balık, sürahi
  g.stamp(['.KKK.', 'KoooK', 'KvVvK'], 2, 2);
  g.stamp(['.KKKK.', 'KEXXEK', '.KKKK.'], 8, 3);
  g.stamp(['KK.KK', 'KbcbK', '.KKK.'], 15, 3);
  g.stamp(['.KK.', 'KaaK', 'KcaK', 'KKKK'], 21, 1);
  return g.toRows();
}

function flagPoleRows(frame) {
  const g = new CharGrid(10, 26);
  g.hline(0, 3, 25, 'k');
  g.vline(1, 2, 25, 'K').vline(2, 2, 25, 'x');
  g.rect(1, 0, 2, 2, 'P');
  const flag = frame % 2 === 0 ? ['oooooo.', 'oPPPooo', 'ooooo..', 'ooo....'] : ['ooooo..', 'oPPPoo.', 'oooooo.', '.oooo..'];
  const tint = ['o', 'B', 'v'];
  flag.forEach((row, y) => [...row].forEach((c, x) => c !== '.' && g.set(3 + x, 2 + y, c === 'o' ? tint[(y + frame) % 3] : c)));
  return g.toRows();
}

function harvestBasketRows() {
  const g = new CharGrid(22, 20);
  g.hline(1, 20, 19, 'k');
  // Dev hasır sepet
  g.rect(1, 9, 20, 10, 'K');
  g.rect(2, 10, 18, 8, 'X');
  for (let y = 11; y < 18; y += 2) g.hline(2, 19, y, 'E');
  for (let x = 4; x < 20; x += 4) g.vline(x, 10, 17, 'x');
  g.hline(0, 21, 9, 'K');
  // Taşan ürünler: elmalar, mısır, buğday başakları, armut
  g.stamp(['..P.P.P..', '.PYPYPY..', '..x.x.x..', '..x.x.x..'], 1, 0);
  g.stamp(['.KK.', 'KooK', 'KoZK', '.KK.'], 6, 5);
  g.stamp(['.KK.', 'KooK', 'KooK', '.KK.'], 10, 4);
  g.stamp(['.vK.', 'KPPK', 'KPYK', 'KPPK', '.KK.'], 14, 3);
  g.stamp(['.KK.', 'KvvK', 'KvVK', '.KK.'], 17, 6);
  g.stamp(['.KK.', 'KOOK', 'KO3K', '.KK.'], 3, 6);
  return g.toRows();
}

function pumpkinRows() {
  const g = new CharGrid(10, 9);
  g.hline(1, 8, 8, 'k');
  g.ellipse(5, 5, 4.6, 3.4, 'K');
  g.ellipse(5, 5, 3.7, 2.6, 'O');
  g.vline(3, 3, 7, '3').vline(6, 3, 7, '3');
  g.set(2, 4, 'Y').set(4, 3, 'Y');
  g.rect(4, 0, 2, 2, 'f');
  g.set(6, 0, 'v');
  return g.toRows();
}

function ciderBarrelRows() {
  const g = new CharGrid(12, 15);
  g.hline(1, 10, 14, 'k');
  g.rect(1, 2, 10, 12, 'K');
  g.rect(2, 3, 8, 10, 'w');
  g.vline(4, 3, 12, 'X').vline(7, 3, 12, 'x');
  g.hline(2, 9, 5, 'q').hline(2, 9, 10, 'q');
  g.set(2, 3, 'X');
  // Musluk ve damlayan şıra
  g.rect(10, 9, 2, 2, 'R');
  g.set(11, 11, 'Y');
  // Üstte elmalar
  g.set(4, 1, 'o').set(5, 1, 'o').set(6, 1, 'v').set(7, 1, 'o');
  return g.toRows();
}

function snowmanRows(stage) {
  const g = new CharGrid(14, 24);
  g.hline(1, 12, 23, 'k');
  // Gövde
  g.ellipse(7, 18.5, 5.6, 4.8, 'K');
  g.ellipse(7, 18.5, 4.7, 3.9, '8');
  g.set(4, 17, '7').set(5, 19, '7').set(9, 20, '6').set(10, 18, '6');
  if (stage >= 1) {
    g.ellipse(7, 11.5, 4.4, 3.8, 'K');
    g.ellipse(7, 11.5, 3.5, 2.9, '8');
    g.set(7, 11, 'K').set(7, 13, 'K'); // kömür düğmeler
    g.line(2, 11, 0, 8, 'x').line(12, 11, 13, 8, 'x'); // dal kollar
    g.set(9, 12, '6');
  }
  if (stage >= 2) {
    g.ellipse(7, 5.5, 3.4, 3, 'K');
    g.ellipse(7, 5.5, 2.5, 2.1, '8');
    g.set(6, 5, 'K').set(8, 5, 'K'); // gözler
    g.set(7, 6, 'O').set(8, 6, 'O'); // havuç burun
    // Atkı ve şapka
    g.hline(4, 10, 8, 'o').set(10, 9, 'o').set(10, 10, 'o');
    g.rect(4, 2, 7, 1, 'K');
    g.rect(5, 0, 5, 2, 'K');
    g.hline(5, 9, 1, 'R');
  }
  return g.toRows();
}

const CROWNS = [
  ['.p.', 'pPp', '.v.'],
  ['.u.', 'uPu', '.v.'],
  ['.i.', 'iui', '.v.'],
];

/**
 * @param {string} kind süsleme türü
 * @param {{ frame?: number, stage?: number }} opts frame: flamanın dalgası; stage: kardan adamın kademesi (0-2)
 */
export function getFestivalDecorSprite(kind, { frame = 0, stage = 2 } = {}) {
  switch (kind) {
    case 'flowerArch':
      return getSprite('festival:flowerArch', flowerArchRows);
    case 'flowerBasket':
      return getSprite('festival:flowerBasket', flowerBasketRows);
    case 'feastTable':
      return getSprite('festival:feastTable', feastTableRows);
    case 'flagPole':
      return getSprite(`festival:flagPole:${frame % 2}`, () => flagPoleRows(frame % 2));
    case 'harvestBasket':
      return getSprite('festival:harvestBasket', harvestBasketRows);
    case 'pumpkin':
      return getSprite('festival:pumpkin', pumpkinRows);
    case 'ciderBarrel':
      return getSprite('festival:ciderBarrel', ciderBarrelRows);
    case 'snowman': {
      const s = Math.max(0, Math.min(2, stage));
      return getSprite(`festival:snowman:${s}`, () => snowmanRows(s));
    }
    default:
      return null;
  }
}

/** Çiçek Şenliği'nde saçtaki çiçek (3 renk). */
export function getFlowerCrownSprite(variant = 0) {
  const v = variant % CROWNS.length;
  return getSprite(`festival:crown:${v}`, CROWNS[v]);
}
