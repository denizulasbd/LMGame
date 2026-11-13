// (30.1) Haritada imlecin yanında çizilen kısa etiketler (kurulamama nedeni, "Bu ekranda uygun yer yok", yıkım onayı) ve yön oku.
// Ekran koordinatında net yazı (SpeechBubbles gibi); salt okunur çizim: durum yazmaz, zar yok. Metin ölçümü metin başına bir kez
// yapılır (wrapText önbelleği ToolController'da tutulur), çizimde ayırma yapılmaz. Etiket ekrandan taşmaz: hedefin sağına konur,
// sığmıyorsa soluna; dikeyde üst çubuğun altında ve araç çubuğunun üstünde kalır.
export const DANGER_COLOR = '#e8463c';
const FONT = "12px 'Pixelify Sans', ui-monospace, monospace";
const LINE_HEIGHT = 15;
const PAD_X = 6;
const PAD_Y = 4;
const MAX_WIDTH = 230; // metin genişliği sınırı (piksel)
const TOP_MARGIN = 54; // üst bilgi çubuğunun altı
const BOTTOM_MARGIN = 118; // araç çubuğunun ve yapı şeridinin üstü
const ARROW_SPACE = 18;

const TONES = {
  bad: { fill: '#3b1a1d', border: '#e8463c', text: '#ffd9d2' },
  info: { fill: '#2b2230', border: '#f2d16b', text: '#fff3b0' },
};

/** Metni en çok maxLines satıra böler (taşan son satır "…" ile biter). Dönüş: { lines, width } (önbelleğe alınır). */
export function wrapText(ctx, text, maxLines = 2, maxWidth = MAX_WIDTH) {
  ctx.font = FONT;
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        line = words.slice(i).join(' ');
        break;
      }
    }
  }
  if (line) lines.push(line);
  if (lines.length) {
    let last = lines[lines.length - 1];
    if (ctx.measureText(last).width > maxWidth) {
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last}…`;
    }
  }
  let width = 0;
  for (const l of lines) width = Math.max(width, Math.ceil(ctx.measureText(l).width));
  return { lines, width };
}

/**
 * Hedefin (ekran dikdörtgeni target) yanına etiket çizer. arrow: yön oku açısı (radyan) ya da null.
 * Dönüş: yok. Ekranı (renderer.width x height) ve araç çubuğu bölgesini aşmaz.
 */
export function drawHintLabel(renderer, wrapped, target, tone = 'bad', arrow = null) {
  const ctx = renderer.ctx;
  const palette = TONES[tone] ?? TONES.bad;
  const lead = arrow === null ? 0 : ARROW_SPACE;
  const w = wrapped.width + PAD_X * 2 + lead;
  const h = wrapped.lines.length * LINE_HEIGHT + PAD_Y * 2;
  let x = Math.round(target.x + target.w + 8);
  if (x + w > renderer.width - 8) x = Math.round(target.x - w - 8);
  x = Math.max(8, Math.min(x, renderer.width - w - 8));
  const minY = TOP_MARGIN;
  const maxY = Math.max(minY, renderer.height - BOTTOM_MARGIN - h);
  const y = Math.max(minY, Math.min(Math.round(target.y), maxY));
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.border;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = palette.fill;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = palette.text;
  for (let i = 0; i < wrapped.lines.length; i++) ctx.fillText(wrapped.lines[i], x + PAD_X + lead, y + PAD_Y + LINE_HEIGHT * i + LINE_HEIGHT / 2 + 1);
  if (arrow !== null) drawArrow(ctx, x + PAD_X + 7, y + h / 2, arrow, palette.text);
  ctx.restore();
}

/** Küçük dolu ok (üçgen); açı: 0 sağ, π/2 aşağı. */
export function drawArrow(ctx, cx, cy, angle, color) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx + cos * 7, cy + sin * 7);
  ctx.lineTo(cx - cos * 5 - sin * 5, cy - sin * 5 + cos * 5);
  ctx.lineTo(cx - cos * 2, cy - sin * 2);
  ctx.lineTo(cx - cos * 5 + sin * 5, cy - sin * 5 - cos * 5);
  ctx.closePath();
  ctx.fill();
}
