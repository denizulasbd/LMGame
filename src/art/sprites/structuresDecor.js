// (31. aşama) Kasaba Süsleri. Görseller yapının kapladığı karoların ALT kenarına hizalanır.
//   İlan Tahtası (1x1, 16x26): çatılı tahta pano; açık iş sayısı kadar kâğıt (en çok 4), Kraliyet Fermanı varken mühürlü parşömen.
//   Odun Yığını (1x1, 16x20): kepenk çatılı sundurma; kütükler odun stoğuyla 0-3 kat (kütüğe saplı balta).
//   Korkuluk (1x1, 16x28): hasır şapka, yamalı mavi gömlek; kolunda karga; sonbaharda kırmızı şenlik kıyafeti.
//   Müzik Köşkü (3x3, 48x54): taş platform, beyaz sütunlar, kırmızı-beyaz kubbe, altın tepelik; akşam ışık dizisi yanar.
//   Kahraman Heykeli (2x2, 32x46): mermer kaide, altın künye, bronz figür; elindeki alet onurlandırılanın ustalığına göre
//     (çekiç, kitap, olta, orak); kimse onurlandırılmadıysa kaide boş, üstünde örtülü figür.
import { getSprite, CharGrid } from '../PixelSprite.js';

export const NOTICE_BOARD_ART = { width: 16, height: 26 };
export const WOODPILE_ART = { width: 16, height: 20 };
export const SCARECROW_ART = { width: 16, height: 28 };
export const BANDSTAND_ART = { width: 48, height: 54, lights: [{ x: 12, y: 24 }, { x: 36, y: 24 }, { x: 24, y: 30 }] };
export const HERO_STATUE_ART = { width: 32, height: 46 };

function buildNoticeBoardRows(notes = 3, royal = true) {
  const g = new CharGrid(16, 26);
  g.ellipse(8, 24.6, 7, 1.2, 'k');
  for (const x of [1, 13]) g.vline(x, 4, 24, 'K').vline(x + 1, 4, 24, 'w');
  // çatı
  g.hline(0, 15, 3, 'K').hline(0, 15, 2, 'U').hline(1, 14, 1, 'C').hline(2, 13, 0, 'K');
  // pano
  g.rect(1, 5, 14, 12, 'K').rect(2, 6, 12, 10, 'X');
  for (let y = 7; y <= 15; y += 3) g.hline(2, 13, y, 'w');
  // kâğıtlar
  const spots = [[3, 7, 'u'], [8, 6, 'y'], [3, 11, 'S'], [9, 11, 'u']];
  spots.slice(0, notes).forEach(([x, y, c], i) => {
    g.rect(x, y, 4, 4, c).hline(x, x + 3, y + 4, 'k');
    g.set(x + 1, y + 1, 'R').set(x + 2, y + 1, 'R').set(x + 1, y + 2, 'R');
    g.set(x + 1 + (i % 2), y, 'o'); // raptiye
  });
  if (royal) {
    g.rect(6, 12, 4, 4, 'K').rect(7, 12, 2, 3, 'S').set(8, 14, 'o').set(7, 15, 'P');
  }
  // tahta saksı: altında
  g.hline(1, 14, 17, 'K').hline(2, 13, 18, 'x');
  return g.toRows();
}

function buildWoodpileRows(fill = 3) {
  const g = new CharGrid(16, 20);
  g.ellipse(8, 18.6, 7.5, 1.4, 'k');
  // sundurma direkleri ve arka tahta
  g.rect(1, 6, 14, 12, 'K').rect(2, 7, 12, 10, 'x');
  for (let x = 4; x <= 12; x += 4) g.vline(x, 7, 16, 'K');
  // kütük uçları: 4x4 halkalı yuvarlaklar, piramit
  const log = (x, y) => {
    g.hline(x + 1, x + 2, y, 'K').rect(x, y + 1, 4, 2, 'K').hline(x + 1, x + 2, y + 3, 'K');
    g.set(x + 1, y + 1, 'E').set(x + 2, y + 1, 'e').set(x + 1, y + 2, 'X').set(x + 2, y + 2, 'E');
  };
  const layers = [
    [[2, 13], [6, 13], [10, 13]],
    [[4, 10], [8, 10]],
    [[6, 7]],
  ];
  layers.slice(0, Math.max(0, Math.min(3, fill))).forEach((row) => row.forEach(([x, y]) => log(x, y)));
  if (fill >= 3) { log(2, 10); log(10, 10); log(3, 7); log(9, 7); }
  // taban kirişi
  g.hline(0, 15, 17, 'K').hline(1, 14, 16, 'w');
  // eğik kepenk çatı
  g.hline(0, 15, 5, 'K').hline(0, 15, 4, 'U').hline(1, 14, 3, 'C').hline(2, 13, 2, 'Z').hline(3, 12, 1, 'K');
  for (let x = 2; x <= 14; x += 3) g.set(x, 4, 'K');
  // kütüğe saplanmış balta
  if (fill > 0) g.vline(14, 11, 15, 'x').set(13, 11, 'q').set(13, 12, 'r').set(14, 10, 'K');
  return g.toRows();
}

function buildScarecrowRows({ crow = false, dressed = false } = {}) {
  const g = new CharGrid(16, 28);
  g.ellipse(8, 26.5, 4, 1.3, 'k');
  // direk
  g.vline(7, 10, 26, 'K').vline(8, 10, 26, 'X').vline(9, 10, 26, 'w').vline(10, 10, 26, 'K');
  // kollar (yatay sırık)
  g.hline(0, 15, 11, 'K').hline(1, 14, 12, 'X').hline(0, 15, 13, 'K');
  // gömlek
  const shirt = dressed ? 'o' : 'B';
  const shade = dressed ? 'U' : 'n';
  g.rect(4, 11, 8, 9, 'K').rect(5, 11, 6, 8, shirt).vline(10, 12, 18, shade);
  g.rect(2, 11, 3, 3, 'K').rect(11, 11, 3, 3, 'K').hline(2, 4, 12, shirt).hline(11, 13, 12, shirt);
  if (!dressed) g.rect(6, 15, 2, 2, 'o').set(6, 15, 'Z'); // yama
  else g.hline(5, 10, 14, 'P').hline(5, 10, 17, 'P');
  g.hline(5, 10, 19, 'x'); // kemer ipi
  // saman püsküller (kol uçları, bel)
  g.set(0, 11, 'P').set(0, 13, 'Y').set(15, 11, 'P').set(15, 13, 'Y').set(1, 14, 'P').set(14, 14, 'P');
  g.set(5, 20, 'P').set(7, 21, 'Y').set(10, 20, 'P').set(6, 20, 'Y');
  // çul kafa
  g.ellipse(8, 7.5, 3.6, 3.6, 'K').ellipse(8, 7.5, 2.7, 2.7, 's');
  g.set(7, 7, 'K').set(9, 7, 'K').hline(7, 9, 9, 'x').set(6, 8, 'z').set(10, 6, 'S');
  // hasır şapka
  g.hline(2, 13, 4, 'K').hline(3, 12, 3, 'E').hline(5, 10, 2, 'K').hline(6, 9, 1, 'E').hline(5, 10, 0, 'K');
  g.hline(5, 10, 3, dressed ? 'p' : 'Y');
  if (dressed) g.set(11, 2, 'p').set(12, 2, 'P').set(11, 1, 'o');
  if (crow) {
    g.rect(12, 8, 3, 3, 'K').set(15, 9, 'Y').set(13, 8, 'Q').set(14, 9, 'u').hline(11, 12, 10, 'K');
  }
  return g.toRows();
}

function buildBandstandRows(lit = false) {
  const g = new CharGrid(48, 54);
  g.ellipse(24, 51.5, 22, 2.6, 'k');
  // taş platform (sekizgen)
  g.rect(3, 38, 42, 13, 'K').rect(1, 41, 46, 8, 'K');
  g.rect(4, 39, 40, 3, 'q').rect(2, 42, 44, 2, 'q');
  g.rect(4, 42, 40, 7, 'r').rect(2, 44, 44, 4, 'r');
  for (let x = 6; x <= 42; x += 6) g.vline(x, 44, 48, 'R');
  g.hline(4, 43, 49, 'R');
  // basamaklar
  g.rect(18, 46, 12, 6, 'K').hline(19, 28, 47, 'q').hline(19, 28, 49, 'r').hline(19, 28, 50, 'R');
  // ahşap zemin
  g.rect(5, 36, 38, 4, 'K').hline(6, 41, 37, 'E').hline(6, 41, 38, 'X');
  // sütunlar (beyaz)
  for (const x of [6, 16, 30, 40]) {
    g.rect(x - 1, 16, 4, 21, 'K').vline(x, 17, 35, 'u').vline(x + 1, 17, 35, '6');
  }
  // korkuluk
  g.hline(5, 42, 31, 'K').hline(5, 42, 32, 'u');
  for (let x = 8; x <= 40; x += 3) g.vline(x, 33, 35, 'u');
  // kubbe çatı: kırmızı-beyaz dilimler
  for (let y = 4; y <= 16; y++) {
    const t = (y - 4) / 12;
    const half = Math.round(4 + t * 19);
    for (let x = 24 - half; x <= 24 + half; x++) {
      const band = Math.floor(((x - 24) / (half + 0.01)) * 3 + 3);
      g.set(x, y, band % 2 ? 'C' : 'u');
    }
    g.set(24 - half - 1, y, 'K').set(24 + half + 1, y, 'K');
  }
  g.hline(1, 47, 17, 'K').hline(2, 46, 16, 'U');
  // saçak süsü (bayrakçıklar)
  for (let x = 3; x <= 45; x += 4) g.set(x, 18, 'P').set(x + 1, 18, 'P').set(x + 1, 19, 'Y');
  g.hline(19, 29, 3, 'K');
  // altın tepelik
  g.rect(22, 0, 4, 4, 'K').rect(23, 1, 2, 2, 'P').set(23, 1, 'y');
  // içeride: nota sehpası ve davul
  g.rect(20, 30, 8, 6, 'K').rect(21, 31, 6, 4, 'o').hline(21, 26, 31, 'Z').hline(21, 26, 34, 'P');
  g.vline(33, 26, 35, 'K').rect(31, 24, 5, 3, 'K').hline(32, 34, 25, 'u');
  if (lit) {
    // ışık dizisi: sütunlar arası
    for (let x = 4; x <= 44; x += 3) g.set(x, 20 + (x % 2), x % 6 === 1 ? 'O' : 'y');
    g.set(13, 24, 'P').set(36, 24, 'P');
  }
  return g.toRows();
}

function buildHeroStatueRows(pose = null) {
  const g = new CharGrid(32, 46);
  g.ellipse(16, 43.5, 14, 2.2, 'k');
  // basamaklı mermer kaide
  g.rect(2, 38, 28, 5, 'K').rect(3, 39, 26, 3, 'u').hline(3, 28, 41, 'q');
  g.rect(6, 26, 20, 13, 'K').rect(7, 27, 18, 11, 'u').vline(24, 27, 37, '6').vline(23, 27, 37, '6');
  g.rect(5, 24, 22, 3, 'K').hline(6, 25, 25, 'q');
  // altın künye
  g.rect(10, 30, 12, 5, 'K').rect(11, 31, 10, 3, 'P').hline(12, 19, 32, 'Y');
  for (let x = 12; x <= 19; x += 2) g.set(x, 32, pose ? 'w' : 'Y');
  if (!pose) {
    // Henüz kimse onurlandırılmadı: kaidenin üstünde örtülü figür (bağlı ip, açılmayı bekleyen kumaş)
    for (let y = 4; y <= 23; y++) {
      const half = y < 9 ? 2 + Math.floor((y - 4) / 2) : 5 + Math.floor((y - 9) / 5);
      g.set(16 - half - 1, y, 'K').set(16 + half, y, 'K');
      for (let x = 16 - half; x < 16 + half; x++) g.set(x, y, x < 14 ? 'u' : x > 18 ? '5' : '6');
    }
    g.hline(14, 17, 3, 'K').hline(10, 21, 24, 'K');
    g.hline(11, 20, 17, 'o').set(13, 18, 'o').set(18, 18, 'o'); // kırmızı kurdele
    g.set(12, 12, '5').set(19, 15, '5').set(15, 20, '5');
    return g.toRows();
  }
  // bronz figür: önlüklü usta, saçlı baş, omuzlar eğimli
  const b = 'X', s = 'w', d = 'x', hl = 'E';
  // etek / önlük (aşağı genişler)
  for (let y = 15; y <= 23; y++) {
    const half = 3 + Math.floor((y - 15) / 3);
    g.set(16 - half - 1, y, 'K').set(16 + half, y, 'K');
    for (let x = 16 - half; x < 16 + half; x++) g.set(x, y, x < 15 ? hl : x > 17 ? s : b);
  }
  g.hline(11, 20, 24, 'K');
  g.rect(14, 17, 4, 6, d).hline(14, 17, 17, s); // önlük
  // gövde ve eğimli omuzlar
  g.rect(12, 10, 8, 6, 'K').rect(13, 10, 6, 5, b).vline(18, 10, 14, s).set(13, 11, hl);
  g.set(11, 11, 'K').set(20, 11, 'K').set(12, 10, 'K').set(19, 10, 'K');
  // baş: yuvarlak, saç
  g.ellipse(16, 6, 3.4, 3.6, 'K').ellipse(16, 6.3, 2.5, 2.7, b);
  g.hline(14, 18, 3, d).hline(13, 19, 4, d).set(13, 5, d).set(19, 5, d); // saç
  g.set(15, 6, d).set(17, 6, d).set(14, 5, hl);
  // sol kol aşağıda
  g.vline(11, 11, 17, 'K').vline(12, 12, 16, b).set(11, 18, 'K').set(12, 17, s);
  if (pose === 'hammer') {
    // sağ kol yukarı, çekiç
    g.line(20, 11, 23, 5, 'K').line(19, 11, 22, 5, s);
    g.vline(23, 0, 5, 'K').rect(20, 0, 7, 3, 'K').hline(21, 25, 1, s).set(21, 1, hl);
  } else if (pose === 'rod') {
    // sağ elde yukarı uzanan olta, ucunda sallanan ip
    g.vline(20, 11, 15, 'K').set(21, 14, 'K');
    g.line(21, 14, 28, 0, 'K').line(22, 14, 29, 0, s);
    g.vline(30, 1, 7, 'x').set(30, 8, 'P');
  } else if (pose === 'sickle') {
    // sağ elde orak, kolunda başak demeti
    g.vline(20, 11, 15, 'K').vline(21, 13, 16, 'K').vline(22, 9, 15, 'x');
    g.set(23, 8, 'K').set(24, 7, 'K').set(25, 7, 'K').set(26, 8, 'K').set(26, 9, 'K').set(24, 8, s).set(25, 8, hl);
    g.set(10, 12, 'P').set(9, 11, 'P').set(10, 10, 'Y').set(11, 11, 'Y');
  } else {
    // kitap göğüste
    g.vline(20, 11, 15, 'K').rect(17, 11, 5, 5, 'K').rect(18, 12, 3, 3, s).vline(19, 12, 14, d);
  }
  // patina
  g.set(14, 13, 'L').set(19, 21, 'L').set(17, 4, 'L');
  // çiçek çelengi kaide önünde
  g.set(8, 37, 'p').set(9, 37, 'P').set(22, 37, 'p').set(23, 37, 'i').set(10, 37, 'v').set(21, 37, 'v');
  return g.toRows();
}

export function getNoticeBoardSprite(notes = 0, royal = false) {
  const n = Math.max(0, Math.min(4, notes | 0));
  return getSprite(`building:noticeBoard:${n}:${royal ? 1 : 0}`, () => buildNoticeBoardRows(n, royal));
}

export function getWoodpileSprite(fill = 3) {
  const f = Math.max(0, Math.min(3, fill | 0));
  return getSprite(`building:woodpile:${f}`, () => buildWoodpileRows(f));
}

export function getScarecrowSprite(crow = false, dressed = false) {
  return getSprite(`building:scarecrow:${crow ? 1 : 0}:${dressed ? 1 : 0}`, () => buildScarecrowRows({ crow, dressed }));
}

export function getBandstandSprite(lit = false) {
  return getSprite(`building:bandstand:${lit ? 1 : 0}`, () => buildBandstandRows(lit));
}

export function getHeroStatueSprite(pose = null) {
  return getSprite(`building:heroStatue:${pose ?? 'veiled'}`, () => buildHeroStatueRows(pose));
}
