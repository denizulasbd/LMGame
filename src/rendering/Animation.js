// Kare tabanlı animasyon oynatıcı. Kareler herhangi bir çizilebilir nesne olabilir
// (src/art'tan gelen canvas'lar ya da sprite sheet koordinatları).
export class Animation {
  constructor(frames, fps = 8, loop = true) {
    this.frames = frames;
    this.frameDuration = 1 / fps;
    this.loop = loop;
    this.time = 0;
    this.index = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;
    this.time += dt;
    while (this.time >= this.frameDuration) {
      this.time -= this.frameDuration;
      this.index++;
      if (this.index >= this.frames.length) {
        if (this.loop) this.index = 0;
        else {
          this.index = this.frames.length - 1;
          this.finished = true;
        }
      }
    }
  }

  reset() {
    this.time = 0;
    this.index = 0;
    this.finished = false;
  }

  get frame() {
    return this.frames[this.index];
  }
}
