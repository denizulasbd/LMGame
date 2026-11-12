// (25.2) Konuşma baloncukları: usta / çırak (ve bilge) sözlerini karakterin başının üstünde küçük bir metin balonu olarak
// ekran koordinatında çizer. c.speech = { text, at, duration, remaining? }. İkon balonundan (c.bubble) ayrı bir katmandır.
// (27.1) Süre simülasyonda düşer: updateSpeechBubbles() TownScene.update'te her adımda (tick.dtSeconds) çağrılır ve biten
// sözü siler; drawSpeechBubbles() SALT OKUNUR çizimdir. Böylece çizim açık da olsa kapalı da (başsız simülasyon) sözler aynı
// adımda biter ve sözün bitişine bakan üreteçlerin (seed + 32 / 33 / 34 ...) sırası çizime bağlı kaymaz.
// (27.3) Balon genişliği her karede ctx.measureText ile ölçülmez: sözün ilk çiziminde bir kez ölçülüp s.width'e yazılır
// (metin değişirse yeniden). Söz kayda girmez; başsız simülasyonda hiç ölçülmez.
import { getAnyIconSprite } from '../art/ui/index.js';

const FONT = "11px 'Pixelify Sans', ui-monospace, monospace";
const PAD_X = 5;
const HEIGHT = 16;
const ICON_SCALE = 2; // (29.8) metin balonunun ucundaki ikon

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

/**
 * Salt okunur çizim: sözlerin metnine ve süresine dokunmaz (yalnızca genişlik önbelleği s.width / s.widthText yazılır).
 * (29.8) İkon balonu (c.bubble) aynı anda varsa ikon, metin balonunun sol ucunda tek balon olarak çizilir (üst üste binmez).
 * budget: { left } paylaşılan balon bütçesi (verilmezse sınırsız); selectedId + phase: 0 hepsi, 1 yalnızca seçili sakin, 2 seçili dışındakiler
 * (öncelik: seçili sakin, sonra konuşma, sonra düşünce). Bütçe konuşma balonu başına bir düşer.
 */
export function drawSpeechBubbles(renderer, camera, characters, budget = null, selectedId = null, phase = 0) {
  const ctx = renderer.ctx;
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  for (const c of characters) {
    const s = c.speech;
    if (!s || !c.visible) continue;
    if (phase === 1 && c.id !== selectedId) continue;
    if (phase === 2 && c.id === selectedId) continue;
    const left = remainingOf(s);
    if (!(left > 0)) continue;
    if (budget) {
      if (budget.left <= 0) continue;
      budget.left--;
    }
    const t = Math.max(0, s.duration - left);
    const z = camera.zoom;
    const icon = c.bubble ? getAnyIconSprite(c.bubble.icon) : null;
    const sx = Math.round((c.x - camera.x) * z);
    const sy = Math.round((c.y - c.spriteHeight - (c.bubble && !icon ? 12 : 2) - camera.y) * z);
    if (s.widthText !== s.text || !(s.width > 0)) {
      s.width = Math.ceil(ctx.measureText(s.text).width) + PAD_X * 2;
      s.widthText = s.text;
    }
    const lead = icon ? icon.width * ICON_SCALE + 3 : 0;
    const w = s.width + lead;
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
    if (icon) ctx.drawImage(icon, x + PAD_X - 1, y + Math.round((HEIGHT - icon.height * ICON_SCALE) / 2), icon.width * ICON_SCALE, icon.height * ICON_SCALE);
    ctx.fillStyle = '#3a2a1f';
    ctx.fillText(s.text, x + PAD_X + lead, y + HEIGHT / 2 + 1);
  }
  ctx.restore();
}
