// Derinlik sıralı çizim kuyruğu (Y-sorting). Her öğe bir "taban çizgisi" (sortY) ile
// eklenir; kuyruk boşaltılırken tabanı daha yukarıda olan önce çizilir. Böylece bir
// karakter ağacın ya da evin arkasına geçtiğinde gerçekten arkasında kalır.
const byDepth = (a, b) => a.sortY - b.sortY || a.order - b.order;

export class RenderQueue {
  constructor() {
    this.items = [];
    this.active = []; // boşaltılırken sıralanan öğeler (kareler arasında yeniden kullanılır)
    this.count = 0;
  }

  /** Hazır bir görseli kuyruğa ekler. */
  addImage(sortY, image, x, y) {
    this.push(sortY, image, x, y, null);
  }

  /** Özel çizim fonksiyonu ekler: draw(renderer) */
  addCustom(sortY, draw) {
    this.push(sortY, null, 0, 0, draw);
  }

  /**
   * (27.3) Sıfır tahsisatlı özel çizim: sabit (bir kez tanımlanmış) fn(renderer, a, b, c) argümanlarıyla çağrılır. Her karede
   * yeni bir kapanış (closure) üretmeden havuzdaki öğeye yazılır.
   */
  addCall(sortY, fn, a = null, b = null, c = null) {
    this.push(sortY, null, 0, 0, null, fn, a, b, c);
  }

  push(sortY, image, x, y, draw, fn = null, a = null, b = null, c = null) {
    // Öğe nesneleri kareler arasında yeniden kullanılır (çöp üretmemek için)
    let item = this.items[this.count];
    if (!item) {
      item = {};
      this.items.push(item);
    }
    item.sortY = sortY;
    item.order = this.count;
    item.image = image;
    item.x = x;
    item.y = y;
    item.draw = draw;
    item.fn = fn;
    item.a = a;
    item.b = b;
    item.c = c;
    this.count++;
  }

  flush(renderer) {
    const active = this.active;
    active.length = this.count;
    for (let i = 0; i < this.count; i++) active[i] = this.items[i];
    active.sort(byDepth);
    for (const item of active) {
      if (item.fn) item.fn(renderer, item.a, item.b, item.c);
      else if (item.draw) item.draw(renderer);
      else renderer.drawImage(item.image, item.x, item.y);
      item.image = null;
      item.draw = null;
      item.fn = null;
      item.a = item.b = item.c = null; // kare bitince nesnelere tutunma
    }
    active.length = 0;
    this.count = 0;
  }
}
