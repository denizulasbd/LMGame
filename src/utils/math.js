export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
/** (34.3b) Her zaman 0..n-1 arası kalan (JS'in % işleci eksi sayıda eksi döner; 34.1'den beri dünya koordinatları eksi olabilir). */
export const mod = (a, n) => ((a % n) + n) % n;
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
/** Perlin eğrisi: 0-1 arası değeri yumuşatır (6t^5 - 15t^4 + 10t^3). */
export const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
/** `value`'yu `target`'a en fazla `step` kadar yaklaştırır. */
export const approach = (value, target, step) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step);
