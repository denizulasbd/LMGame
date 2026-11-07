// (25.2) Konuşma baloncukları: usta / çırak (ve bilge) sözlerini karakterin başının üstünde küçük bir metin balonu olarak
// ekran koordinatında çizer. c.speech = { text, at, duration } (at < 0: ilk çizimde gerçek zamanla başlar). İkon balonundan
// (c.bubble) ayrı bir katmandır: simülasyonun balon zarına ve hiçbir üretece dokunmaz, yalnızca çizimdir.
const FONT = "11px 'Pixelify Sans', ui-monospace, monospace";
const PAD_X = 5;
const HEIGHT = 16;

export function drawSpeechBubbles(renderer, camera, characters, time) {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  for (const c of characters) {
    const s = c.speech;
    if (!s) continue;
    if (s.at < 0) s.at = time;
    const t = time - s.at;
    if (t > s.duration || t < 0 || !c.visible) {
      if (t > s.duration || t < 0) c.speech = null;
      continue;
    }
    const z = camera.zoom;
    const sx = Math.round((c.x - camera.x) * z);
    const sy = Math.round((c.y - c.spriteHeight - (c.bubble ? 12 : 2) - camera.y) * z);
    const w = Math.ceil(ctx.measureText(s.text).width) + PAD_X * 2;
    const x = sx - Math.round(w / 2);
    const y = sy - HEIGHT - 4 - Math.round(Math.min(1, t / 0.15) * 2);
    const alpha = t > s.duration - 0.4 ? Math.max(0, (s.duration - t) / 0.4) : 1;
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
