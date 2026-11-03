// Nehirdeki ticaret teknesi (12. aşama). Yalnızca çizim ve konum; yolculuğu HarborSystem yönetir, kaydı
// state.trade.boat'tadır. Tekne yükünü aldıysa güvertesinde sandıklar görünür, ardında köpüklü bir iz bırakır.
import { getBoatSprite } from '../art/sprites/index.js';

export class Boat {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.facing = 'right';
    this.loaded = false;
    this.moving = false;
    this.visible = true;
    this.heading = { x: 0, y: 1 }; // gidiş yönü (iz için)
  }

  queueDraw(queue, env) {
    if (!this.visible) return;
    const frame = Math.floor(env.time * (this.moving ? 3 : 1.2)) % 2;
    const sprite = getBoatSprite(this.facing, this.loaded, frame);
    // Tekne suyun üstündedir: kıyıdaki her şeyin arkasında kalmasın diye kendi alt kenarıyla sıralanır
    queue.addImage(this.y + 4, sprite, Math.round(this.x - sprite.width / 2), Math.round(this.y - sprite.height + 6));
  }

  /** Teknenin ardındaki köpük izi ve rıhtımda beklerken suda halka. */
  drawEffects(renderer, time) {
    if (!this.visible) return;
    if (this.moving) {
      for (let i = 1; i <= 4; i++) {
        const px = Math.round(this.x - this.heading.x * (8 + i * 4) + Math.sin(time * 4 + i) * 1.5);
        const py = Math.round(this.y + 4 - this.heading.y * (6 + i * 4));
        const a = (0.6 - i * 0.12).toFixed(2);
        renderer.fillRect(px - 2, py, 2, 1, `rgba(238, 251, 255, ${a})`);
        renderer.fillRect(px + 2, py, 2, 1, `rgba(238, 251, 255, ${a})`);
      }
    } else {
      const ring = (time * 0.5) % 1;
      const r = 8 + Math.floor(ring * 6);
      renderer.fillRect(Math.round(this.x - r), Math.round(this.y + 5), r * 2, 1, `rgba(238, 251, 255, ${(0.5 - ring * 0.5).toFixed(2)})`);
    }
  }
}
