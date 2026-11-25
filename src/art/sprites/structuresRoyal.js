// (32.3) Kraliyet Lütfu yapıları. Görseller yapının kapladığı karoların ALT kenarına hizalanır (üst taşma serbest).
//   - Barış Çeşmesi (2x2, 32x40): mavi çinili sekizgen havuz, üç kademeli mermer çanak, tepede zeytin dallı güvercin; su iki karede
//     akar, akşam (lit) su ve çanak kenarı ışıl ışıl (açık mavi parıltı)
//   - Kraliyet Gül Bahçesi (3x3, 48x52): budanmış şimşir çit, dört gül tarhı (kırmızı / pembe / beyaz / sarı), çakıl yollar, ortada
//     beyaz kameriye (kubbesinde altın taç); kışın güller budanmış, tarhlar karlı
//   - Kraliyet Arşivi (2x3, 32x60): kubbeli taş yapı, iki beyaz sütun, altın taçlı alınlık, kemerli tunç kapı, raflı yüksek
//     pencereler; akşam pencereler sıcak sarı
import { getSprite, CharGrid } from '../PixelSprite.js';

export const PEACE_FOUNTAIN_ART = { width: 32, height: 40, light: { x: 16, y: 14 } };
export const ROSE_GARDEN_ART = { width: 48, height: 52 };
export const ROYAL_ARCHIVE_ART = { width: 32, height: 60, windows: [{ x: 9, y: 34 }, { x: 22, y: 34 }] };

function buildFountainRows(frame = 0, lit = false) {
  const g = new CharGrid(PEACE_FOUNTAIN_ART.width, PEACE_FOUNTAIN_ART.height);
  const glow = lit ? 'a' : 'c';
  g.ellipse(16, 37.5, 15, 2.2, 'k');
  // havuz: çinili kaide (koyu mavi ve beyaz baklava) ve su
  g.ellipse(16, 31, 15, 6.5, 'Q');
  g.ellipse(16, 31, 14, 5.6, 'N');
  for (let x = 3; x <= 29; x += 3) g.set(x, 34 + (x % 2), 'u').set(x + 1, 35, 'b');
  g.ellipse(16, 29, 13, 4.4, 'q');
  g.ellipse(16, 29, 12, 3.6, 'b');
  g.ellipse(16, 29, 10, 2.6, frame ? 'c' : 'b');
  for (let i = 0; i < 6; i++) g.set(6 + i * 4 + frame, 28 + ((i + frame) % 2), glow);
  // orta ayak ve alt çanak
  g.rect(14, 18, 4, 11, 'r').vline(17, 18, 28, 'R').vline(14, 18, 28, 'q');
  g.ellipse(16, 19, 8, 2.2, 'q').hline(9, 23, 20, 'R');
  g.ellipse(16, 18.5, 7, 1.4, 'b');
  // ikinci çanak
  g.rect(15, 11, 2, 7, 'r').vline(16, 11, 17, 'R');
  g.ellipse(16, 12, 5, 1.6, 'q').hline(12, 20, 13, 'R');
  g.ellipse(16, 11.6, 4, 0.9, 'b');
  // tepe: zeytin dallı güvercin
  g.rect(15, 6, 2, 5, 'u');
  g.set(14, 5, 'u').set(15, 4, 'u').set(16, 4, 'u').set(17, 5, 'u').set(18, 5, 'u').set(17, 3, 'u').set(18, 3, 'K');
  g.set(19, 4, 'O');
  g.set(20, 4, 'v').set(21, 3, 'v').set(21, 5, 'v').set(22, 4, 'f');
  // akan su: kenarlardan aşağı damlalar (iki kare)
  const drops = frame ? [[10, 21], [22, 21], [11, 24], [21, 24], [13, 14], [19, 14]] : [[9, 22], [23, 22], [10, 25], [22, 25], [12, 15], [20, 15]];
  for (const [x, y] of drops) g.set(x, y, glow).set(x, y + 1, 'b');
  g.set(16, 2 + frame, 'a').set(15, 1 + frame, 'W');
  if (lit) {
    g.hline(5, 27, 25, 'a');
    g.set(8, 20, 'W').set(24, 20, 'W');
  }
  return g.toRows();
}

/** Barış Çeşmesi: su karesi (0 / 1) ve akşam ışığı. */
export function getPeaceFountainSprite(frame = 0, lit = false) {
  const f = frame % 2;
  return getSprite(`building:peaceFountain:${f}:${lit ? 1 : 0}`, () => buildFountainRows(f, lit));
}

const ROSES = ['o', 'p', 'u', 'P'];

function buildRoseGardenRows(season = 'summer') {
  const W = ROSE_GARDEN_ART.width;
  const g = new CharGrid(W, ROSE_GARDEN_ART.height);
  const winter = season === 'winter';
  const bloom = season === 'spring' || season === 'summer';
  // zemin: çimen ve çakıl yollar
  g.rect(1, 10, W - 2, 41, winter ? 'q' : 'g');
  g.rect(21, 10, 6, 41, 'S').vline(21, 10, 50, 's').vline(26, 10, 50, 's');
  g.rect(1, 28, W - 2, 5, 'S').hline(1, W - 2, 28, 's').hline(1, W - 2, 32, 's');
  // şimşir çit (çerçeve)
  for (const [x0, y0, w, h] of [[0, 9, W, 2], [0, 49, 21, 3], [27, 49, 21, 3], [0, 9, 2, 43], [W - 2, 9, 2, 43]]) {
    g.rect(x0, y0, w, h, winter ? 'L' : 'f');
    for (let x = x0; x < x0 + w; x += 2) g.set(x, y0, winter ? 'u' : 'v');
  }
  // dört gül tarhı
  const beds = [[4, 13], [29, 13], [4, 35], [29, 35]];
  beds.forEach(([bx, by], i) => {
    g.rect(bx, by, 15, 12, 'D').rect(bx + 1, by + 1, 13, 10, winter ? 'u' : 'F');
    for (let yy = by + 2; yy < by + 11; yy += 3) {
      for (let xx = bx + 2 + ((yy / 3) % 2); xx < bx + 14; xx += 3) {
        if (winter) g.set(xx, yy, 'w');
        else {
          g.set(xx, yy, 'v').set(xx + 1, yy, 'f');
          if (bloom || (xx + yy) % 2 === 0) g.set(xx, yy - 1, ROSES[i]).set(xx + 1, yy - 1, ROSES[(i + 1) % 4] === 'u' ? ROSES[i] : ROSES[i]);
        }
      }
    }
  });
  // ortada beyaz kameriye: dört ince sütun, kubbe, altın taç
  g.ellipse(24, 33, 8, 2.4, 'k');
  g.rect(17, 22, 15, 10, '.');
  for (const x of [17, 30]) g.rect(x, 18, 2, 14, 'u').vline(x + 1, 18, 31, 'q');
  for (const x of [21, 26]) g.vline(x, 18, 31, 'q');
  g.rect(16, 30, 17, 2, 'q').hline(16, 32, 31, 'R');
  g.ellipse(24, 15, 9, 5, 'u');
  g.ellipse(24, 16, 9, 2.5, 'q');
  g.hline(15, 33, 18, 'R');
  for (let x = 16; x <= 32; x += 4) g.set(x, 17, winter ? 'u' : 'p');
  // tırmanan gül sarmaşığı
  if (!winter) for (let y = 20; y < 30; y += 3) g.set(18, y, 'v').set(31, y + 1, 'v').set(18, y + 1, bloom ? 'o' : 'f').set(31, y, bloom ? 'p' : 'f');
  // taç
  g.rect(22, 7, 5, 3, 'Y').hline(22, 26, 9, 'P');
  g.set(22, 6, 'Y').set(24, 5, 'Y').set(26, 6, 'Y').set(24, 7, 'o');
  if (winter) g.hline(16, 32, 12, 'W').hline(18, 30, 11, 'W');
  return g.toRows();
}

/** Kraliyet Gül Bahçesi: mevsime göre güller. */
export function getRoseGardenSprite(season = 'summer') {
  const key = ['spring', 'summer', 'autumn', 'winter'].includes(season) ? season : 'summer';
  return getSprite(`building:royalRoseGarden:${key}`, () => buildRoseGardenRows(key));
}

function buildArchiveRows(lit = false) {
  const W = ROYAL_ARCHIVE_ART.width;
  const g = new CharGrid(W, ROYAL_ARCHIVE_ART.height);
  g.ellipse(16, 58, 15, 1.6, 'k');
  // basamaklar
  g.rect(6, 53, 20, 2, 'q').hline(6, 25, 54, 'R');
  g.rect(4, 55, 24, 3, 'r').hline(4, 27, 55, 'q').hline(4, 27, 57, 'R');
  // gövde
  g.rect(2, 22, 28, 31, 'Q');
  g.rect(3, 23, 26, 29, 'r');
  for (let y = 26; y < 52; y += 4) {
    g.hline(3, 28, y, 'R');
    for (let x = 5 + ((y / 4) % 2) * 3; x < 28; x += 6) g.set(x, y + 1, 'R');
  }
  // yüksek pencereler (raflar görünür)
  for (const wx of [6, 19]) {
    g.rect(wx, 28, 7, 14, 'Q');
    g.rect(wx + 1, 29, 5, 12, lit ? 'Y' : 'N');
    g.hline(wx + 1, wx + 5, 29, 'Q').set(wx + 1, 29, 'r').set(wx + 5, 29, 'r');
    for (let yy = 32; yy < 41; yy += 3) {
      g.hline(wx + 1, wx + 5, yy, lit ? 'O' : 'x');
      g.set(wx + 2, yy - 1, lit ? 'o' : 'U').set(wx + 3, yy - 1, lit ? 'P' : 'w').set(wx + 4, yy - 1, lit ? 'O' : 'n');
    }
  }
  // iki beyaz sütun ve kemerli tunç kapı
  for (const x of [13, 18]) g.rect(x, 23, 2, 30, 'u').vline(x + 1, 23, 52, 'q');
  g.rect(15, 41, 3, 12, 'X').rect(15, 42, 3, 11, 'w');
  g.set(15, 41, 'Q').set(17, 41, 'Q').vline(16, 43, 52, 'x').set(17, 47, 'P');
  // saçak ve alınlık
  g.rect(1, 20, 30, 3, 'q').hline(1, 30, 22, 'R').hline(1, 30, 20, 'u');
  for (let i = 0; i <= 6; i++) {
    const y = 13 + i;
    g.hline(16 - i * 2 - 1, 15 + i * 2 + 1, y, 'S');
    g.set(16 - i * 2 - 1, y, 'Q').set(15 + i * 2 + 1, y, 'Q');
  }
  // altın taç kabartması
  g.hline(13, 18, 17, 'Y').set(13, 16, 'Y').set(15, 15, 'Y').set(16, 15, 'Y').set(18, 16, 'Y').set(15, 16, 'P').set(16, 16, 'o');
  // kubbe (alınlığın arkasında)
  g.ellipse(16, 10, 9, 7, 'b');
  g.ellipse(14, 8, 4, 3, 'c');
  g.hline(7, 25, 12, 'N');
  for (let y = 12; y < 14; y++) g.hline(7, 25, y, 'Q');
  g.vline(16, 0, 3, 'Y').set(15, 1, 'Y').set(17, 1, 'Y').set(16, 0, 'P');
  return g.toRows();
}

/** Kraliyet Arşivi: akşam pencereleri yanar. */
export function getRoyalArchiveSprite(lit = false) {
  return getSprite(`building:royalArchive:${lit ? 1 : 0}`, () => buildArchiveRows(lit));
}
