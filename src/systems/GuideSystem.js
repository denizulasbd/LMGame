// (30.1) Rehber kartlarının durum yöneticisi. Simülasyona dokunmaz: güncelleme listesinde değildir, zar çekmez; yalnızca oyuncunun
// eylemlerini olaylardan dinler (kamera, sakin seçimi, yapı yerleştirme, hız, Hedefler, yükseltme) ve state.guide'ı günceller.
// GuideCard her karede sync() çağırır: koşulu sağlanan adımlar tamamlanır, görünecek adım currentStep ile bulunur.
//   'ui:guideDismiss' { id }  -> "Anladım": adımı tamamlar
//   'ui:guideSetOff' { off }  -> Ayarlar: rehber Açık / Kapalı
//   'ui:guideRestart'         -> Ayarlar: baştan başlat (tamamlananlar silinir, rehber açılır)
import { currentStep, newlyDone, guideVars } from './Guide.js';
import { engineOn } from './Engines.js';

export class GuideSystem {
  constructor(game, { attract = false } = {}) {
    this.game = game;
    this.state = game.state;
    this.events = game.events;
    this.attract = attract;
    this.facts = {};
    this.current = null; // sync() sonucu: GuideCard çizimde yalnızca bunu okur (çizim durumu değiştirmez)
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
      on('story:shown', ({ action } = {}) => {
        this.facts.storyShown = true;
        if (action) this.facts.storyActionShown = true;
      }),
      on('ui:storyGo', () => (this.facts.storyGo = true)),
      on('immigration:capped', () => (this.facts.capped = true)), // (34.2) göç nüfus sınırında kaldı
      on('ui:storyAction', () => (this.facts.storyActed = true)),
      // (30.6) hazine / taş art arda kaç gün 0'da (yalnızca oturum gerçeği; kaydedilmez) ve çevredeki kayalar tükendi mi
      on('time:newDay', () => this.dailyFacts()),
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

  dailyFacts() {
    const r = this.state.resources;
    const f = this.facts;
    f.goldDry = (r.gold ?? 0) <= 0 ? (f.goldDry ?? 0) + 1 : 0;
    f.stoneDry = (r.stone ?? 0) <= 0 ? (f.stoneDry ?? 0) + 1 : 0;
    if (f.rocksGone !== true && this.state.time.day > 3) {
      const world = this.game.scenes?.current?.world;
      const map = world?.map;
      if (map?.getObject) {
        let rocks = 0;
        for (let y = map.openBounds.y0; y < map.openBounds.y1 && !rocks; y++) for (let x = map.openBounds.x0; x < map.openBounds.x1; x++) if (map.getObject(x, y) === 'rock' && map.isOpen(x, y)) { rocks = 1; break; }
        if (!rocks) f.rocksGone = true;
      }
    }
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
    const step = currentStep(this.state, guide, this.facts);
    // (30.6) işlev metinler (sayılar o anki durumdan) çözülür; çizim yalnızca düz metni okur
    this.current = step && typeof step.text === 'function' ? { ...step, text: step.text(guideVars(this.state)) } : step;
    return this.current;
  }
}
