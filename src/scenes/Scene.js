// Tüm sahnelerin temel sınıfı. Alt sınıflar ihtiyaç duyduğu metotları ezer.
export class Scene {
  constructor(game) {
    this.game = game;
  }

  /** Sahne etkinleştiğinde çağrılır; kaynakları burada kur. */
  enter(_params) {}

  /** Sahneden çıkarken çağrılır; olay aboneliklerini burada kaldır. */
  exit() {}

  update(_dt) {}

  render(_renderer, _alpha) {}
}
