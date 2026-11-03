// Dünyadaki her nesnenin temel sınıfı (karakter, bina, eşya...).
let nextId = 1;

export class Entity {
  constructor({ x = 0, y = 0, id = nextId++ } = {}) {
    this.id = id;
    this.x = x;   // dünya pikseli
    this.y = y;
    nextId = Math.max(nextId, id + 1);
  }

  update(_dt, _game) {}
  render(_renderer) {}

  toJSON() {
    return { id: this.id, x: this.x, y: this.y };
  }
}
