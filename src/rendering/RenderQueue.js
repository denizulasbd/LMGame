// Derinlik sıralı çizim kuyruğu (Y-sorting). Her öğe bir "taban çizgisi" (sortY) ile
// eklenir; kuyruk boşaltılırken tabanı daha yukarıda olan önce çizilir. Böylece bir
// karakter ağacın ya da evin arkasına geçtiğinde gerçekten arkasında kalır.
export class RenderQueue {
  constructor() {
    this.items = [];
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

  push(sortY, image, x, y, draw) {
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
    this.count++;
  }

  flush(renderer) {
    const active = this.items.slice(0, this.count);
    active.sort((a, b) => a.sortY - b.sortY || a.order - b.order);
    for (const item of active) {
      if (item.draw) item.draw(renderer);
      else renderer.drawImage(item.image, item.x, item.y);
      item.image = null;
      item.draw = null;
    }
    this.count = 0;
  }
}
