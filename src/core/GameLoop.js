// Sabit adımlı simülasyon + değişken hızlı çizim döngüsü.
// update() her zaman aynı dt ile çağrılır; bu, simülasyonu deterministik tutar.
export class GameLoop {
  constructor({ tickRate, update, render }) {
    this.step = 1 / tickRate;
    this.update = update;
    this.render = render;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    // Sekme arka plana alınınca oluşan dev sıçramaları sınırla
    const delta = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.accumulator += delta;

    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }

    this.render(this.accumulator / this.step);
    requestAnimationFrame(this.frame);
  }
}
