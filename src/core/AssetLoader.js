// Dış dosyaları (PNG, ses, JSON harita) yükler ve önbelleğe alır.
// Kodla çizilen sprite'lar için src/art/ kullanılır; bu sınıf assets/ klasörü içindir.
export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.audio = new Map();
    this.json = new Map();
  }

  loadImage(key, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Görsel yüklenemedi: ${url}`));
      img.src = url;
    });
  }

  loadAudio(key, url) {
    const audio = new Audio(url);
    this.audio.set(key, audio);
    return Promise.resolve(audio);
  }

  async loadJSON(key, url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`JSON yüklenemedi: ${url}`);
    const data = await res.json();
    this.json.set(key, data);
    return data;
  }
}
