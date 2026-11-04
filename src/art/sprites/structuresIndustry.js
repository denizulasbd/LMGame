// 10. aşama üretim yapıları:
//   Yel Değirmeni ve Fırın (3x3, görsel 48x72): sıvalı taş kule, kırmızı kiremitli döner başlık ve dört
//     yelkenli kanat (6 karede çeyrek tur döner: rüzgârda ağır ağır, fırıncı çalışırken hızlı), kulenin
//     dibinde un çuvalları; sağda kubbeli taş fırın: ağzında ateş titrer, bacası tüter (bkz. Building)
//   Demir Madeni (3x3, görsel 48x56): boz kayalık tepeye açılmış, ahşap destekli tünel; tünelden öne
//     uzanan raylar, kızıl cevher dolu vagon (çalışılırken raylarda gidip gelir), cevher yığını, girişte
//     geceleri yanan fener
// Her görsel yapının kapladığı karoların ALT kenarına hizalanır; yukarı taşan kısım üstteki karolara düşer.
import { getSprite, CharGrid } from '../PixelSprite.js';
import { winterize } from '../seasons.js';

function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Yel Değirmeni ve Fırın
// ---------------------------------------------------------------------------
export const MILL_ART = {
  width: 48,
  height: 72,
  hub: { x: 17.5, y: 24.5 },
  sailRadius: 17,
  sailFrames: 6, // çeyrek turun kare sayısı (dört kanat simetrik)
  chimney: { x: 43, y: 45 }, // fırın bacasının ağzı (görselin sol üstüne göre)
  oven: { x: 38, y: 64 }, // fırın ağzının ortası (gece ateş ışığı)
  window: { x: 17.5, y: 41.5 }, // kulenin penceresi (gece yanar)
};

/** Kanatlar: göbekten çıkan koyu kol ve kolun bir yanında kafesli krem yelken bezi. */
function drawSails(g, angle) {
  const { hub, sailRadius: R } = MILL_ART;
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const rx = x + 0.5 - hub.x;
      const ry = y + 0.5 - hub.y;
      if (rx * rx + ry * ry > (R + 1.5) * (R + 1.5)) continue;
      for (let k = 0; k < 4; k++) {
        const a = angle + (k * Math.PI) / 2;
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        const u = rx * ux + ry * uy; // kol boyunca
        const v = -rx * uy + ry * ux; // kola dik (yelken bu yanda)
        if (u >= 1 && u <= R && Math.abs(v) <= 0.75) {
          g.set(x, y, u > R - 1 ? 'K' : 'x');
          break;
        }
        if (u >= 4.5 && u <= R - 0.3 && v > 0.75 && v <= 4.8) {
          let c = 'S';
          if (v > 4) c = 'K';
          else if (u > R - 1.3 || u < 5.4) c = 'X';
          else if (Math.floor(u) % 3 === 0) c = 'X';
          else if (v > 3.2) c = 's';
          g.set(x, y, c);
          break;
        }
      }
    }
  }
  // Göbek
  const hx = Math.floor(hub.x);
  const hy = Math.floor(hub.y);
  g.rect(hx - 1, hy - 1, 3, 3, 'K');
  g.set(hx, hy, 'E');
}

function buildMillRows(sailFrame, active, ovenFrame, lit, sails = true) {
  const g = new CharGrid(MILL_ART.width, MILL_ART.height);
  // Yere düşen gölge ve toprak avlu
  g.rect(2, 69, 45, 3, 'k');
  g.rect(1, 64, 46, 5, 'd');
  for (let x = 1; x < 47; x++) if (hash(x, 66, 4) > 0.75) g.set(x, 64 + Math.floor(hash(x, 2, 5) * 5), 'e');

  // Kule: aşağı doğru genişleyen sıvalı taş gövde (sol ışık, sağ gölge), arada taş görünür
  for (let y = 27; y <= 66; y++) {
    const half = 7 + Math.round(((y - 27) / 39) * 4);
    const x0 = 17 - half;
    const x1 = 18 + half;
    g.set(x0, y, 'K').set(x1, y, 'K');
    for (let x = x0 + 1; x < x1; x++) {
      let c = x > x1 - 4 ? 's' : 'S';
      if (x < x0 + 2) c = 'y';
      const h = hash(x, y, 1);
      if (h > 0.95) c = 'q';
      else if (h > 0.92) c = 'z';
      g.set(x, y, c);
    }
  }
  g.hline(5, 30, 67, 'K');
  g.hline(6, 29, 66, 'r');
  g.hline(6, 29, 65, 'q');
  // Pencere (gece yanar) ve kemerli kapı
  g.rect(15, 38, 6, 7, 'K');
  g.rect(16, 39, 4, 5, lit ? 'y' : 'a');
  g.vline(17, 39, 43, 'K');
  g.hline(16, 19, 41, 'K');
  if (lit) g.set(16, 39, 'P').set(19, 42, 'P');
  g.hline(14, 21, 45, 'X');
  g.rect(13, 54, 9, 12, 'K');
  g.rect(14, 56, 7, 10, 'w');
  g.hline(15, 19, 55, 'w');
  g.vline(16, 56, 65, 'x').vline(18, 56, 65, 'x');
  g.set(19, 60, 'P');
  // Kulenin dibinde un çuvalları
  g.stamp(['.KKK.', 'KSuSK', 'KSPSK', 'KszsK', '.KKK.'], 2, 61);
  g.stamp(['.KKK.', 'KSuSK', 'KsSsK', 'KzzzK', '.KKK.'], 5, 63);

  // Döner başlık: kırmızı kiremitli kubbe, saçağı kulenin üstünde
  for (let y = 13; y <= 28; y++) {
    const t = (y - 13) / 15;
    const half = Math.round(2 + Math.sqrt(t) * 8.5);
    const x0 = 17 - half;
    const x1 = 18 + half;
    for (let x = x0; x <= x1; x++) {
      const course = (y - 13) % 3;
      g.set(x, y, course === 2 ? 'U' : (x + Math.floor((y - 13) / 3)) % 4 === 0 ? 'Z' : 'C');
    }
    g.set(x0, y, 'K').set(x1, y, 'K');
  }
  g.hline(15, 20, 12, 'K');
  g.set(17, 11, 'K').set(18, 11, 'K').set(17, 10, 'P');
  g.hline(6, 29, 28, 'K');
  g.hline(7, 28, 27, 'U');

  // Fırın: kubbeli taş fırın, kemerli ağız, tuğla baca
  g.ellipse(38.5, 66, 9.5, 12, 'K');
  g.ellipse(38.5, 66, 8.5, 11, 'r');
  for (let y = 55; y <= 67; y++) {
    for (let x = 30; x <= 47; x++) {
      if (g.get(x, y) !== 'r') continue;
      const course = Math.floor((y - 55) / 3);
      if ((y - 55) % 3 === 2 || (x + course * 2) % 5 === 0) g.set(x, y, 'M');
      else if (y < 59 && hash(x, y, 2) > 0.5) g.set(x, y, 'q');
      else if (x > 43) g.set(x, y, 'R');
    }
  }
  g.rect(28, 66, 21, 2, 'K');
  g.hline(29, 47, 66, 'R');
  // Ağız: içi kor, çalışırken alev titrer
  g.rect(34, 60, 9, 6, 'K');
  g.rect(35, 61, 7, 5, active ? 'U' : 'x');
  g.hline(35, 41, 60, 'K');
  g.set(34, 60, '.').set(42, 60, '.');
  if (active) {
    const flames = ovenFrame % 2 === 0 ? [[36, 64, 'O'], [37, 63, 'P'], [38, 64, 'Y'], [39, 62, 'O'], [40, 64, 'P']] : [[36, 63, 'O'], [37, 64, 'Y'], [38, 62, 'P'], [39, 64, 'O'], [40, 63, 'O']];
    for (const [x, y, c] of flames) g.set(x, y, c);
    g.hline(35, 41, 65, 'o');
  } else {
    g.set(37, 65, 'R').set(39, 65, 'U').set(40, 64, 'R');
  }
  // Fırının önünde tahta raf ve sıcak ekmekler
  g.rect(28, 58, 6, 2, 'K');
  g.hline(29, 32, 58, 'E');
  g.vline(29, 60, 64, 'x').vline(32, 60, 64, 'x');
  g.set(29, 57, 'Y').set(30, 57, 'O').set(31, 57, 'Y').set(32, 57, 'O');
  // Baca
  g.rect(41, 46, 5, 10, 'K');
  g.rect(42, 47, 3, 9, 'C');
  g.hline(42, 44, 49, 'U').hline(42, 44, 52, 'U');
  g.hline(40, 46, 46, 'K');
  g.hline(41, 45, 47, 'Z');

  // Kanatlar en önde
  if (sails) drawSails(g, (sailFrame / MILL_ART.sailFrames) * (Math.PI / 2));
  return g.toRows();
}

/** Yalnızca kanatlar (kışın karlanmış gövdenin üstüne çizilir: kanatlara kar tutmaz). */
function buildSailRows(sailFrame) {
  const g = new CharGrid(MILL_ART.width, MILL_ART.height);
  drawSails(g, (sailFrame / MILL_ART.sailFrames) * (Math.PI / 2));
  return g.toRows();
}

// Kışın değirmenin başlığı ve fırının kubbesi karlanır (kanatlar dönerken kar tutmaz)
const MILL_WINTER_ROOF = { light: ['Z'], main: ['C'], dark: ['U'], maxRow: 29 };
const winterMillCache = new Map();

/**
 * @param {number} sailFrame kanatların açısı (0..sailFrames-1, çeyrek tur)
 * @param {boolean} active fırıncı çalışıyor: fırının ağzında alev
 * @param {number} ovenFrame alevin titremesi
 * @param {boolean} lit gece: kule penceresi yanar
 */
export function getMillSprite(sailFrame = 0, active = false, ovenFrame = 0, lit = false, season = 'summer') {
  const s = ((sailFrame % MILL_ART.sailFrames) + MILL_ART.sailFrames) % MILL_ART.sailFrames;
  const o = active ? ovenFrame % 2 : 0;
  if (season !== 'winter') return getSprite(`building:mill:${s}:${active ? 1 : 0}:${o}:${lit ? 1 : 0}`, () => buildMillRows(s, active, o, lit));
  const key = `${s}:${active ? 1 : 0}:${o}:${lit ? 1 : 0}`;
  if (!winterMillCache.has(key)) {
    const body = getSprite(`building:mill:body:${active ? 1 : 0}:${o}:${lit ? 1 : 0}`, () => buildMillRows(s, active, o, lit, false));
    const snowy = winterize(body, MILL_WINTER_ROOF);
    const canvas = document.createElement('canvas');
    canvas.width = MILL_ART.width;
    canvas.height = MILL_ART.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(snowy, 0, 0);
    ctx.drawImage(getSprite(`building:mill:sails:${s}`, () => buildSailRows(s)), 0, 0);
    winterMillCache.set(key, canvas);
  }
  return winterMillCache.get(key);
}

// ---------------------------------------------------------------------------
// Demir Madeni
// ---------------------------------------------------------------------------
export const IRON_MINE_ART = {
  width: 48,
  height: 56,
  light: { x: 24.5, y: 15.5 }, // giriş fenerinin ışığı
};

// Vagonun ray üzerindeki yeri (görselin üstünden piksel): tünelin karanlığından çıkar, öne gelir, döner
const CART_STOPS = [37, 42, 47, 42];
const ORE = ['..KK.KK..', '.KCUKOCK.', 'KUCRCUCRK'];

function drawCart(g, y, loaded) {
  if (loaded) g.stamp(ORE, 20, y - 3);
  g.rect(19, y, 11, 6, 'K');
  g.rect(20, y + 1, 9, 4, 'R');
  g.hline(20, 28, y + 1, 'r');
  g.vline(24, y + 1, y + 4, 'Q');
  for (const cx of [21, 27]) {
    g.rect(cx, y + 5, 2, 2, 'K');
    g.set(cx, y + 5, 'q');
  }
}

function buildIronMineRows(frame, active, lit) {
  const g = new CharGrid(IRON_MINE_ART.width, IRON_MINE_ART.height);
  g.ellipse(24, 53, 23.5, 3, 'k');

  // Kayalık tepe: ortası yüksek, yanlara doğru alçalan höyük; boz toprak, kaya katmanları, pas damarları
  const tops = [];
  for (let x = 0; x <= 47; x++) {
    const t = (x + 0.5 - 24) / 24.5;
    const dome = Math.sqrt(Math.max(0, 1 - t * t));
    tops[x] = Math.round(37 - dome * 30 + 1.3 * Math.sin(x * 0.7) + 0.9 * Math.sin(x * 1.9 + 1));
  }
  for (let x = 0; x <= 47; x++) {
    for (let y = tops[x]; y <= 44; y++) {
      const depth = y - tops[x];
      const shade = x > 33 ? ')' : '(';
      let c = shade;
      if (depth === 0) c = 'K';
      else if (depth === 1) c = x < 30 ? ':' : '(';
      else if ((y + Math.floor(x / 6)) % 6 === 0 && depth > 3) c = ')';
      else if (hash(x, y, 11) > 0.9) c = x > 33 ? 'R' : 'r';
      else if (hash(x, y, 13) > 0.955) c = 'C'; // pas renkli demir damarları
      else if (hash(x, y, 14) > 0.97) c = 'U';
      g.set(x, y, c);
    }
    // Yan kenarların konturu (komşu sütundan daha alçaksa)
    if (x > 0 && tops[x - 1] > tops[x]) for (let y = tops[x]; y < tops[x - 1]; y++) g.set(x, y, 'K');
    if (x < 47 && tops[x + 1] > tops[x]) for (let y = tops[x]; y < tops[x + 1]; y++) g.set(x, y, 'K');
  }
  // Tepede iri kayalar, yosun ve bir iki çalı
  g.stamp(['.KKKK.', 'KqqrrK', 'KqrrRK', 'KRRRRK', '.KKKK.'], 8, 15);
  g.stamp(['.KKK.', 'KqrrK', 'KrRRK', '.KKK.'], 34, 14);
  g.stamp(['..KK..', '.KqrK.', 'KrrRRK', '.KKKK.'], 40, 27);
  g.stamp(['.ff.', 'fvvf', 'fvVf'], 18, 6);
  g.stamp(['.ff..', 'fvVvf', '.fff.'], 28, 7);
  g.stamp(['.f.', 'fvf'], 4, 29);
  // Kaya yüzünün dibi: çalışanların kazdığı yüzey, dökülmüş taş kırıntıları
  g.hline(0, 47, 44, 'K');
  g.hline(1, 46, 43, ')');
  [[6, 42], [11, 41], [36, 42], [42, 41], [45, 42]].forEach(([x, y]) => g.set(x, y, 'q').set(x + 1, y, 'R'));

  // Tünel: kemerli karanlık ağız, kalın ahşap çerçeve, derinde bir destek halkası
  g.rect(16, 19, 17, 26, 'K');
  g.ellipse(24.5, 25, 6.2, 5, 'K');
  g.rect(19, 25, 11, 20, 'K');
  g.ellipse(24.5, 30, 3.6, 3.2, 'Q');
  g.ellipse(24.5, 30.5, 2.6, 2.4, 'K');
  g.hline(21, 28, 36, 'Q');
  for (const x of [16, 30]) {
    g.vline(x + 1, 22, 44, 'X');
    g.vline(x + 2, 22, 44, 'x');
    g.set(x + 1, 30, 'E').set(x + 1, 38, 'E');
  }
  g.rect(14, 19, 21, 4, 'K');
  g.hline(15, 33, 20, 'E');
  g.hline(15, 33, 21, 'X');
  g.set(15, 21, 'x').set(33, 21, 'x');
  // Giriş feneri (kirişe asılı)
  g.vline(24, 22, 23, 'K');
  g.rect(23, 23, 3, 3, 'K');
  g.set(24, 24, lit ? 'P' : 'R');
  if (lit) g.set(23, 24, 'Y').set(25, 24, 'Y');

  // Raylar: tünelden öne, traversler
  for (let y = 45; y <= 55; y++) {
    if (y % 2 === 1) g.hline(19, 29, y, 'x');
    g.set(21, y, 'q').set(27, y, 'q');
  }

  // Sağ önde kızıl cevher yığını ve elek, solda destek kütükleri ve kazma
  g.stamp(['....KK....', '..KKCUKK..', '.KUCRCOCK.', 'KCURCUCRUK', 'KKKKKKKKKK'], 35, 46);
  g.stamp(['KKKKKKKK', 'KXEXEXEK', 'KxXxXxXK', 'KXEXEXEK', 'KKKKKKKK'], 4, 48);
  g.line(9, 47, 12, 41, 'w');
  g.stamp(['KKKK.', 'Kq.qK'], 10, 40);

  // Vagon: çalışılırken raylarda gidip gelir (tünelin içindeyken karanlıkta kalır), boşta önde durur
  const stop = active ? CART_STOPS[frame % CART_STOPS.length] : 47;
  drawCart(g, stop, !active || frame % CART_STOPS.length === 1 || frame % CART_STOPS.length === 2); // dolu çıkar, boş döner
  if (stop < 44) g.rect(19, stop - 3, 11, 44 - (stop - 3), 'K'); // tünelin karanlığı vagonun içerideki kısmını örter
  return g.toRows();
}

/**
 * @param {number} frame vagonun konumu (çalışırken)
 * @param {boolean} active madenciler çalışıyor
 * @param {boolean} lit giriş feneri yanıyor (gece)
 */
export function getIronMineSprite(frame = 0, active = false, lit = false) {
  const f = active ? frame % CART_STOPS.length : 0;
  return getSprite(`building:ironMine:${f}:${active ? 1 : 0}:${lit ? 1 : 0}`, () => buildIronMineRows(f, active, lit));
}
