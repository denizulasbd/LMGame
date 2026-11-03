// Farenin üzerinde olduğu karoyu (ya da bir yapının kapladığı alanı) köşe parantezleriyle
// vurgular. Parantezler hafifçe "nefes alır"; uygun olmayan yerlerde kırmızımsı olur.
import { CONFIG } from '../config.js';
import { getCursorCorner } from '../art/ui/index.js';

const CORNER_SIZE = 5;
const FILL = {
  ok: 'rgba(255, 243, 176, 0.18)',
  blocked: 'rgba(232, 70, 60, 0.18)',
};

/**
 * Karo cinsinden bir dikdörtgeni vurgular.
 * @param {boolean} ok uygun (krem) / uygun değil (kırmızı)
 * @param {boolean} [fill] içini hafifçe boya
 */
export function drawAreaCursor(renderer, tileX, tileY, w, h, time, ok, fill = true) {
  const size = CONFIG.TILE_SIZE;
  const x = tileX * size;
  const y = tileY * size;
  const width = w * size;
  const height = h * size;
  const tone = ok ? 'ok' : 'blocked';
  const bob = Math.sin(time * 5) > 0 ? 1 : 0;

  if (fill) renderer.fillRect(x, y, width, height, FILL[tone]);

  const left = x - 1 - bob;
  const top = y - 1 - bob;
  const right = x + width + 1 + bob - CORNER_SIZE;
  const bottom = y + height + 1 + bob - CORNER_SIZE;
  renderer.drawImage(getCursorCorner(0, tone), left, top);
  renderer.drawImage(getCursorCorner(1, tone), right, top);
  renderer.drawImage(getCursorCorner(2, tone), right, bottom);
  renderer.drawImage(getCursorCorner(3, tone), left, bottom);
}

export function drawTileCursor(renderer, tileX, tileY, time, ok) {
  drawAreaCursor(renderer, tileX, tileY, 1, 1, time, ok);
}
