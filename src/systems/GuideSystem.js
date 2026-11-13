// (30.1) Rehber kartlarının durum yöneticisi. Simülasyona dokunmaz: güncelleme listesinde değildir, zar çekmez; yalnızca oyuncunun
// eylemlerini olaylardan dinler (kamera, sakin seçimi, yapı yerleştirme, hız, Hedefler, yükseltme) ve state.guide'ı günceller.
// GuideCard her karede sync() çağırır: koşulu sağlanan adımlar tamamlanır, görünecek adım currentStep ile bulunur.
//   'ui:guideDismiss' { id }  -> "Anladım": adımı tamamlar
//   'ui:guideSetOff' { off }  -> Ayarlar: rehber Açık / Kapalı
//   'ui:guideRestart'         -> Ayarlar: baştan başlat (tamamlananlar silinir, rehber açılır)
import { currentStep, newlyDone } from './Guide.js';

export class GuideSystem {
  constructor(game, { attract = false } = {}) {
    this.game = game;
    this.state = game.state;
    this.events = game.events;
    this.attract = attract;
    this.facts = {};
    if (attract) return;
    const on = (name, fn) => game.events.on(name, fn);
    this.unsubscribers = [
      on('camera:moved', () => (this.facts.moved = true)),
      on('character:selected', (id) => {
        if (id === null || id === undefined) return;
        this.facts.selected = true;
        if ((this.state.petitions?.list ?? []).some((p) => p.characterId === id)) this.facts.petitionSelected = true;
      }),
      on('building:placed', ({ building } = {}) => {
        if (!building?.definition?.brush) this.facts.placed = true;
      }),
      on('building:upgraded', () => (this.facts.upgraded = true)),
      on('time:setSpeed', () => (this.facts.speedChanged = true)),
      on('time:togglePause', () => (this.facts.speedChanged = true)),
      on('ui:modalChanged', ({ id } = {}) => id === 'goals' && (this.facts.goalsOpened = true)),
      on('ui:guideDismiss', ({ id }) => this.complete(id)),
      on('ui:guideSetOff', ({ off }) => this.setOff(off)),
      on('ui:guideRestart', () => this.restart()),
    ];
  }

  destroy() {
    this.unsubscribers?.forEach((off) => off());
  }

  get guide() {
    return this.state.guide;
  }

  complete(id) {
    const guide = this.guide;
    if (guide.done.includes(id)) return;
    guide.done.push(id);
    if (id === 'build') (guide.at ??= {}).build = this.state.totalMinutes;
    this.events.emit('guide:changed', { id });
  }

  setOff(off) {
    this.guide.off = Boolean(off);
    this.events.emit('guide:changed', { off: this.guide.off });
  }

  restart() {
    this.state.guide = { done: [], off: false };
    this.facts = {};
    this.events.emit('guide:changed', { restart: true });
  }

  /** Koşulu sağlanan adımları tamamlar; görünecek adımı ({ id, text, target }) ya da null döndürür. */
  sync() {
    if (this.attract) return null;
    const guide = this.guide;
    for (const id of newlyDone(this.state, guide, this.facts)) this.complete(id);
    return currentStep(this.state, guide, this.facts);
  }
}
