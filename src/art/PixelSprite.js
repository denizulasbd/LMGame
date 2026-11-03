// Metin ızgarasıyla tanımlanan pixel art'ı offscreen canvas'a dönüştürür.
// Örnek tanım (her harf PALETTE'teki bir renk, '.' şeffaf):
//   ['..KK..',
//    '.KyyK.',
//    '..KK..']
//
// Ayrıca ızgaralar üzerinde çalışan yardımcılar içerir (döndürme, aynalama,
// kaydırma, üst üste damgalama); böylece varyasyonlar elle tekrar çizilmez.
import { PALETTE } from './palette.js';

const cache = new Map();

function validate(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Sprite tanımı boş: ${label}`);
  }
  const width = rows[0].length;
  rows.forEach((row, i) => {
    if (row.length !== width) {
      throw new Error(`Sprite "${label}" satır ${i} uzunluğu ${row.length}, beklenen ${width}`);
    }
  });
}

export function createSprite(rows, palette = PALETTE, label = 'adsız') {
  validate(rows, label);
  const height = rows.length;
  const width = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = rows[y][x];
      if (!(char in palette)) {
        throw new Error(`Sprite "${label}" içinde paletde olmayan karakter: "${char}"`);
      }
      const color = palette[char];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/**
 * Önbellekli sprite. rowsOrFactory bir dizi ya da diziyi üreten fonksiyon olabilir;
 * fonksiyon yalnızca ilk istekte çalışır.
 */
export function getSprite(key, rowsOrFactory, palette = PALETTE) {
  let sprite = cache.get(key);
  if (!sprite) {
    const rows = typeof rowsOrFactory === 'function' ? rowsOrFactory() : rowsOrFactory;
    sprite = createSprite(rows, palette, key);
    cache.set(key, sprite);
  }
  return sprite;
}

// ---------------------------------------------------------------------------
// Izgara yardımcıları (string dizileri üzerinde çalışır, canvas üretmez)
// ---------------------------------------------------------------------------

/** Saat yönünde 90° döndürür. */
export function rotateRowsCW(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let r = 0; r < w; r++) {
    let line = '';
    for (let c = 0; c < h; c++) line += rows[h - 1 - c][r];
    out.push(line);
  }
  return out;
}

/** Saat yönünde times × 90° döndürür. */
export function rotateRows(rows, times) {
  let out = rows;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) out = rotateRowsCW(out);
  return out;
}

export function flipRowsHorizontal(rows) {
  return rows.map((row) => [...row].reverse().join(''));
}

/** Satırları dikey olarak kaydırır (taşan satırlar diğer uçtan girer). */
export function shiftRowsVertical(rows, dy) {
  const h = rows.length;
  return rows.map((_, i) => rows[(((i - dy) % h) + h) % h]);
}

/** Bir desenin '.' olmayan piksellerini taban ızgaranın (x, y) konumuna basar. */
export function stampRows(base, pattern, x, y) {
  const out = base.map((row) => [...row]);
  pattern.forEach((line, py) => {
    [...line].forEach((char, px) => {
      const ty = y + py;
      const tx = x + px;
      if (char !== '.' && out[ty] && tx >= 0 && tx < out[ty].length) out[ty][tx] = char;
    });
  });
  return out.map((row) => row.join(''));
}

/** Birden çok damgayı sırayla uygular: stamps = [[desen, x, y], ...] */
export function composeRows(base, stamps) {
  return stamps.reduce((rows, [pattern, x, y]) => stampRows(rows, pattern, x, y), base);
}

/** Izgaradaki bir rengi diğeriyle değiştirir (ör. aynı şeklin farklı renk tonu). */
export function recolorRows(rows, mapping) {
  return rows.map((row) => [...row].map((c) => mapping[c] ?? c).join(''));
}

/** Verilen genişlikte boş (şeffaf) satırlar üretir. */
export function emptyRows(count, width) {
  return Array.from({ length: count }, () => '.'.repeat(width));
}

/** Üstten `count` boş satır ekleyip verilen satırları çıkarır; şekil aşağı "çöker". */
export function squashRows(rows, removeIndexes) {
  const width = rows[0].length;
  const remove = new Set(removeIndexes);
  return [...emptyRows(remove.size, width), ...rows.filter((_, i) => !remove.has(i))];
}

/**
 * Büyük çizimler (bina, havuz) için karakter ızgarası. Dikdörtgen, elips, çizgi gibi
 * şekilleri palet harfleriyle çizer; sonuç yine metin satırlarıdır (toRows).
 */
export class CharGrid {
  constructor(width, height, fill = '.') {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () => Array(width).fill(fill));
  }

  set(x, y, char) {
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (cx >= 0 && cy >= 0 && cx < this.width && cy < this.height) this.cells[cy][cx] = char;
    return this;
  }

  get(x, y) {
    return this.cells[y]?.[x] ?? null;
  }

  rect(x, y, w, h, char) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, char);
    return this;
  }

  hline(x0, x1, y, char) {
    for (let x = x0; x <= x1; x++) this.set(x, y, char);
    return this;
  }

  vline(x, y0, y1, char) {
    for (let y = y0; y <= y1; y++) this.set(x, y, char);
    return this;
  }

  /** Dolu elips; merkez ve yarıçaplar piksel cinsinden (ondalıklı olabilir). */
  ellipse(cx, cy, rx, ry, char) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.cells[y][x] = char;
      }
    }
    return this;
  }

  /** Bresenham çizgisi. */
  line(x0, y0, x1, y1, char) {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x, y, char);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
    return this;
  }

  /** Desen damgalar ('.' alttakini korur). */
  stamp(pattern, x, y) {
    pattern.forEach((line, py) => {
      [...line].forEach((char, px) => {
        if (char !== '.') this.set(x + px, y + py, char);
      });
    });
    return this;
  }

  toRows() {
    return this.cells.map((row) => row.join(''));
  }
}
