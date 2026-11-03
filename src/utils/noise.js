// Tohumlu 2B Perlin gürültüsü. Aynı Random tohumu aynı gürültüyü üretir.
// perlin(x, y) yaklaşık [-1, 1] aralığında, tam sayı koordinatlarda 0 döner;
// bu yüzden örneklerken koordinatları küçük bir çarpanla ölçekleyin (ör. x * 0.1).
import { lerp, fade } from './math.js';

const D = Math.SQRT1_2;
const GRADIENTS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [D, D], [-D, D], [D, -D], [-D, -D],
];

export class Noise2D {
  /** @param {import('./random.js').Random} rng */
  constructor(rng) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  gradient(hash, x, y) {
    const g = GRADIENTS[hash & 7];
    return g[0] * x + g[1] * y;
  }

  perlin(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const p = this.perm;

    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    const u = fade(xf);
    const v = fade(yf);
    const top = lerp(this.gradient(aa, xf, yf), this.gradient(ba, xf - 1, yf), u);
    const bottom = lerp(this.gradient(ab, xf, yf - 1), this.gradient(bb, xf - 1, yf - 1), u);
    return lerp(top, bottom, v) * Math.SQRT2;
  }

  /** Fraktal gürültü: farklı ölçeklerdeki katmanların toplamı, daha doğal görünür. */
  fbm(x, y, octaves = 4) {
    let amplitude = 1;
    let frequency = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amplitude * this.perlin(x * frequency, y * frequency);
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / norm;
  }
}
