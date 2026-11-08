// (25.2) Konuşma baloncukları: usta / çırak (ve bilge) sözlerini karakterin başının üstünde küçük bir metin balonu olarak
// ekran koordinatında çizer. c.speech = { text, at, duration, remaining? }. İkon balonundan (c.bubble) ayrı bir katmandır.
// (27.1) Süre simülasyonda düşer: updateSpeechBubbles() TownScene.update'te her adımda (tick.dtSeconds) çağrılır ve biten
// sözü siler; drawSpeechBubbles() SALT OKUNUR çizimdir. Böylece çizim açık da olsa kapalı da (başsız simülasyon) sözler aynı
// adımda biter ve sözün bitişine bakan üreteçlerin (seed + 32 / 33 / 34 ...) sırası çizime bağlı kaymaz.
const FONT = "11px 'Pixelify Sans', ui-monospace, monospace";
const PAD_X = 5;
const HEIGHT = 16;

/** Sözün kalan süresi (sn): ilk güncellemede duration'dan başlar. */
function remainingOf(s) {
  return Number.isFinite(s.remaining) ? s.remaining : Number.isFinite(s.duration) ? s.duration : 0;
}

/**
 * (27.1) Saf simülasyon adımı: her listedeki karakterin sözü dtSeconds kadar eskir, süresi dolan söz silinir.
 * Görünmez karakterin sözü de eskir (çizilmez ama süresi işler). Rastgelelik kullanmaz.
 */
export function updateSpeechBubbles(characters, guests, dtSeconds) {
  const dt = Number.isFinite(dtSeconds) && dtSeconds > 0 ? dtSeconds : 0;
  for (const list of [characters, guests]) {
    if (!list) continue;
    for (const c of list) {
      const s = c.speech;
      if (!s) continue;
      const left = remainingOf(s) - dt;
      if (left <= 0) c.speech = null;
      else s.remaining = left;
    }
  }
}

/** Salt okunur çizim: sözlere ve sürelerine dokunmaz. */
export function drawSpeechBubbles(renderer, camera, characters) {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  for (const c of characters) {
    const s = c.speech;
    if (!s || !c.visible) continue;
    const left = remainingOf(s);
    if (!(left > 0)) continue;
    const t = Math.max(0, s.duration - left);
    const z = camera.zoom;
    const sx = Math.round((c.x - camera.x) * z);
    const sy = Math.round((c.y - c.spriteHeight - (c.bubble ? 12 : 2) - camera.y) * z);
    const w = Math.ceil(ctx.measureText(s.text).width) + PAD_X * 2;
    const x = sx - Math.round(w / 2);
    const y = sy - HEIGHT - 4 - Math.round(Math.min(1, t / 0.15) * 2);
    const alpha = left < 0.4 ? Math.max(0, left / 0.4) : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1b1423';
    ctx.fillRect(x - 1, y - 1, w + 2, HEIGHT + 2);
    ctx.fillStyle = '#fff8e7';
    ctx.fillRect(x, y, w, HEIGHT);
    ctx.fillRect(sx - 2, y + HEIGHT, 4, 2);
    ctx.fillStyle = '#1b1423';
    ctx.fillRect(sx - 1, y + HEIGHT + 2, 2, 2);
    ctx.fillStyle = '#3a2a1f';
    ctx.fillText(s.text, x + PAD_X, y + HEIGHT / 2 + 1);
  }
  ctx.restore();
}
