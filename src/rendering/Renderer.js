// Canvas'a çizimi soyutlar. Canvas ekran pikseli çözünürlüğündedir; dünya çizimleri
// kameranın tam sayı yakınlaştırmasıyla ölçeklenir, böylece her oyun pikseli
// ekranda eşit büyüklükte, net bir kare olur.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = Math.max(1, Math.floor(window.innerWidth));
    this.height = Math.max(1, Math.floor(window.innerHeight));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    // Boyut değişince bağlam ayarları sıfırlanır, tekrar kapat
    this.ctx.imageSmoothingEnabled = false;
  }

  beginFrame() {
    this.resetCamera();
    this.ctx.fillStyle = '#1b1423';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Kamerayı uygular; sonraki çizimler dünya pikseli cinsinden yapılır.
   * Kaydırma ekran pikseline yuvarlanır, böylece karolar arasında boşluk/titreme olmaz.
   */
  applyCamera(camera) {
    const z = camera.zoom;
    this.ctx.setTransform(z, 0, 0, z, -Math.round(camera.x * z), -Math.round(camera.y * z));
  }

  /** Ekran koordinatına döner (arayüz katmanları, atmosfer örtüsü). */
  resetCamera() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawImage(image, x, y) {
    this.ctx.drawImage(image, x, y);
  }

  /** Yarı saydam çizim (inşaat hayaleti gibi). */
  drawImageAlpha(image, x, y, alpha) {
    const previous = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(image, x, y);
    this.ctx.globalAlpha = previous;
  }

  fillRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  /** Mevcut dönüşümden bağımsız olarak tüm ekranı boyar. */
  fillScreen(color) {
    this.ctx.save();
    this.resetCamera();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }
}
