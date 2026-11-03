// Kasabadaki bir hayvan (11. aşama): yaban hayatı (tavşan, geyik) ya da kasaba hayvanı (kedi, köpek).
// Kim olduğu (tür, ad, renk, yuva) kayda girer; anlık hâli (ne yaptığı, yolu) yüklenince AnimalSystem yeniden
// kurar. Davranış src/systems/AnimalSystem.js'te, görseller src/art/sprites/animals.js'te.
import { Entity } from './Entity.js';
import { getAnimalSprite } from '../art/sprites/index.js';

const HEART_TIME = 1.4; // sevilince başının üstünde kalp (gerçek saniye değil, oyun saniyesi)
export const CHEER_TIME = 1.2; // (14. aşama) oyuncu fareyle sevince: sevinçle zıplar, kalpler uçuşur (gerçek saniye)

export class Animal extends Entity {
  constructor({ id, kind, x, y, homeX = null, homeY = null, name = null, variant = 0 }) {
    super({ id, x, y });
    this.kind = kind;
    this.name = name;
    this.variant = variant;
    this.homeX = homeX ?? Math.floor(x / 16); // yuvanın karosu
    this.homeY = homeY ?? Math.floor(y / 16);

    // Anlık durum (kaydedilmez)
    this.facing = 'right';
    this.pose = 'sit';
    this.mode = 'idle'; // idle | wander | flee | rest | follow | sleep | arrive
    this.timer = 0;
    this.target = null; // { x, y } dünya pikseli (düz yürüyüş)
    this.waypoints = null; // yol bulunmuş yürüyüş (kasaba hayvanları)
    this.waypointIndex = 0;
    this.anim = Math.random() * 3;
    this.heart = 0; // sevildi: başının üstünde kalp
    this.visible = true;
    this.followId = null; // köpek: peşinden gittiği sakin
    this.cheer = 0; // oyuncu sevdi: kalan sevinç süresi (gerçek saniye)
  }

  get isPet() {
    return this.kind === 'cat' || this.kind === 'dog';
  }

  get tileX() {
    return Math.floor(this.x / 16);
  }

  get tileY() {
    return Math.floor(this.y / 16);
  }

  /** Görsel pozu: yürürken kareler değişir, geyik ve tavşanın kendi pozları var. */
  frame() {
    const step = Math.floor(this.anim / (this.kind === 'rabbit' ? 0.12 : 0.18)) % 2;
    switch (this.kind) {
      case 'rabbit':
        if (this.pose === 'walk') return step === 0 ? 'hop0' : 'hop1';
        if (this.pose === 'eat') return Math.floor(this.anim / 0.5) % 3 === 0 ? 'sit' : 'eat';
        return 'sit';
      case 'deer':
        if (this.pose === 'walk') return step === 0 ? 'walk0' : 'walk1';
        if (this.pose === 'eat') return 'graze';
        if (this.pose === 'sleep') return 'lie';
        return 'stand';
      default:
        if (this.pose === 'walk') return step === 0 ? 'walk0' : 'walk1';
        if (this.pose === 'sleep') return 'sleep';
        return 'sit';
    }
  }

  queueDraw(queue, env) {
    if (!this.visible) return;
    const sprite = getAnimalSprite(this.kind, this.frame(), this.facing, this.variant, this.kind === 'rabbit' && env.season === 'winter');
    const x = Math.round(this.x - sprite.width / 2);
    // Sevinçle iki kez zıplar
    const hop = this.cheer > 0 ? Math.round(Math.abs(Math.sin(((CHEER_TIME - this.cheer) / CHEER_TIME) * Math.PI * 2)) * 4) : 0;
    const y = Math.round(this.y - sprite.height + 1) - hop;
    queue.addImage(this.y, sprite, x, y);
  }

  /** Dünya pikselindeki nokta bu hayvanın üstünde mi? (tıklayıp sevmek için; yalnızca kedi ve köpek) */
  hitTest(worldX, worldY) {
    return this.visible && this.isPet && Math.abs(worldX - this.x) <= 7 && worldY <= this.y + 2 && worldY >= this.y - 12;
  }

  /** Sevilince başının üstünde yükselen küçük kalp (gece de okunur). */
  drawOverlay(renderer) {
    if (!this.visible) return;
    if (this.cheer > 0) {
      // Uçuşan üç kalp
      const t = 1 - this.cheer / CHEER_TIME;
      for (let i = 0; i < 3; i++) {
        const k = Math.min(1, Math.max(0, t * 1.3 - i * 0.15));
        if (k <= 0) continue;
        this.drawHeart(renderer, Math.round(this.x - 6 + i * 5 + Math.sin(k * 6 + i) * 2), Math.round(this.y - 13 - k * 12 - (i % 2) * 2));
      }
      return;
    }
    if (this.heart <= 0) return;
    const rise = Math.round((1 - this.heart / HEART_TIME) * 5);
    const x = Math.round(this.x) - 2;
    const y = Math.round(this.y) - 14 - rise;
    const c = '#e8463c';
    renderer.fillRect(x, y, 2, 1, c);
    renderer.fillRect(x + 3, y, 2, 1, c);
    renderer.fillRect(x, y + 1, 5, 1, c);
    renderer.fillRect(x + 1, y + 2, 3, 1, c);
    renderer.fillRect(x + 2, y + 3, 1, 1, c);
    renderer.fillRect(x + 1, y, 1, 1, '#f06b8a');
  }

  drawHeart(renderer, x, y) {
    const c = '#e8463c';
    renderer.fillRect(x, y, 2, 1, c);
    renderer.fillRect(x + 3, y, 2, 1, c);
    renderer.fillRect(x, y + 1, 5, 1, c);
    renderer.fillRect(x + 1, y + 2, 3, 1, c);
    renderer.fillRect(x + 2, y + 3, 1, 1, c);
    renderer.fillRect(x + 1, y, 1, 1, '#f06b8a');
  }

  showHeart() {
    this.heart = HEART_TIME;
  }

  clearPath() {
    this.waypoints = null;
    this.waypointIndex = 0;
  }

  toJSON() {
    return { ...super.toJSON(), kind: this.kind, name: this.name, variant: this.variant, homeX: this.homeX, homeY: this.homeY };
  }

  static fromJSON(data) {
    return new Animal(data);
  }
}
