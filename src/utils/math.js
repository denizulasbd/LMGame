export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
/** Perlin eğrisi: 0-1 arası değeri yumuşatır (6t^5 - 15t^4 + 10t^3). */
export const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
/** `value`'yu `target`'a en fazla `step` kadar yaklaştırır. */
export const approach = (value, target, step) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step);
