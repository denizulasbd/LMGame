// Sahneler arası geçişi yönetir (ör. menü -> kasaba -> ev içi).
export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.current = null;
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  switchTo(name, params = {}) {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Sahne bulunamadı: ${name}`);
    this.current?.exit();
    this.current = next;
    this.current.enter(params);
  }

  update(dt) {
    this.current?.update(dt);
  }

  render(renderer, alpha) {
    this.current?.render(renderer, alpha);
  }
}
