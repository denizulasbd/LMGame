// Kayıt / yükleme akışı. Arayüz yalnızca olay yayınlar, işi burada yapılır:
//   'ui:save'    -> oyunu 'main' yuvasına yazar
//   'ui:load'    -> 'main' yuvasındaki kaydı yükler ve sahneyi yeniden kurar
//   'ui:newGame' -> rastgele yeni bir tohumla sıfırdan başlar
// Ayrıca her sabah 06:00'da otomatik kaydeder, sayfa kapanırken / gizlenirken 'session'
// yuvasına yazar (F5 oyunu kaldığı yerden sürdürür). Durum değişince 'save:changed' yayınlar:
//   { exists, label, savedAt } -> HUD "Yükle" düğmesini ve kayıt bilgisini günceller.
import { CONFIG } from '../config.js';
import { SaveManager } from '../state/SaveManager.js';

const pad = (n) => String(n).padStart(2, '0');

export class SaveSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {() => Array} captureTerrain sahnenin haritadaki değişiklikleri (karo farkları) verdiği işlev
   * @param {(options?: object) => void} reloadScene sahneyi mevcut GameState'ten yeniden kurar
   */
  constructor(game, { captureTerrain, reloadScene, attract = false }) {
    this.game = game;
    this.state = game.state;
    this.events = game.events;
    this.captureTerrain = captureTerrain;
    this.reloadScene = reloadScene;
    this.attract = attract; // başlangıç ekranının arka plan kasabası: hiçbir şey kaydedilmez

    // Arka plandaki tanıtım kasabası oturum kaydı yazmaz (F5 yine başlangıç ekranını açar)
    this.persistSession = () => {
      if (!this.attract) this.write('session');
    };
    this.onVisibility = () => {
      if (document.visibilityState === 'hidden') this.persistSession();
    };
    window.addEventListener('pagehide', this.persistSession);
    window.addEventListener('beforeunload', this.persistSession);
    document.addEventListener('visibilitychange', this.onVisibility);

    this.unsubscribers = [
      game.events.on('ui:save', () => this.saveManual()),
      game.events.on('ui:load', () => this.loadManual()),
      game.events.on('ui:newGame', () => this.newGame()),
      game.events.on('ui:continueGame', () => this.continueGame()),
      game.events.on('ui:startNewTown', ({ name, seed }) => this.startNewTown(name, seed)),
      game.events.on('time:hour', (hour) => {
        if (hour === CONFIG.AUTOSAVE_HOUR && !this.attract) this.autosave();
      }),
    ];
    this.announce();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    window.removeEventListener('pagehide', this.persistSession);
    window.removeEventListener('beforeunload', this.persistSession);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  snapshot() {
    return { ...this.state.toJSON(), terrain: this.captureTerrain() };
  }

  write(slot) {
    return SaveManager.write(this.snapshot(), slot);
  }

  saveManual() {
    if (this.write('main')) {
      this.events.emit('toast', { text: 'Oyun kaydedildi', tone: 'success', icon: 'sparkle' });
    } else {
      this.events.emit('toast', { text: 'Kayıt başarısız: tarayıcı depolaması kullanılamıyor', tone: 'warn', icon: 'demolish' });
    }
    this.announce();
  }

  autosave() {
    if (this.write('main')) this.events.emit('toast', { text: 'Otomatik kaydedildi', tone: 'info', icon: 'sparkle' });
    this.announce();
  }

  loadManual() {
    const data = SaveManager.read('main');
    if (!data) {
      this.events.emit('toast', { text: 'Yüklenecek kayıt yok', tone: 'warn', icon: 'demolish' });
      return;
    }
    try {
      this.game.state.restore(data);
    } catch (err) {
      console.warn(err);
      this.events.emit('toast', { text: 'Kayıt okunamadı, dosya bozuk', tone: 'warn', icon: 'demolish' });
      return;
    }
    this.reloadScene();
    this.events.emit('toast', { text: `Oyun yüklendi: ${this.label(data.time)}`, tone: 'success', icon: 'sparkle' });
  }

  /** Başlangıç ekranı: son elle / otomatik kayda dön. */
  continueGame() {
    const data = SaveManager.read('main');
    if (!data) return;
    try {
      this.game.state.restore(data);
    } catch (err) {
      console.warn(err);
      this.events.emit('toast', { text: 'Kayıt okunamadı, dosya bozuk', tone: 'warn', icon: 'demolish' });
      return;
    }
    this.reloadScene();
    this.events.emit('toast', { text: `Hoş geldin! ${this.state.townName} seni bekliyordu.`, tone: 'success', icon: 'heart' });
  }

  /** Başlangıç ekranı: verilen adla (ve isteğe bağlı tohumla) yeni kasaba. */
  startNewTown(name, seed) {
    SaveManager.clear('session');
    this.game.state.reset(Number.isFinite(seed) ? seed : undefined, name);
    this.reloadScene();
    this.events.emit('toast', { text: `${this.state.townName} kuruldu. Kolay gelsin!`, tone: 'success', icon: 'sun' });
  }

  newGame() {
    SaveManager.clear('session');
    this.game.state.reset();
    this.reloadScene();
    this.events.emit('toast', { text: 'Yeni harita başladı', tone: 'info', icon: 'sun' });
  }

  label(time) {
    return `Gün ${time.day}, ${pad(time.hour)}:${pad(time.minute)}`;
  }

  /** HUD'a kaydın durumunu bildirir. */
  announce() {
    const info = SaveManager.describe('main');
    this.events.emit('save:changed', {
      exists: info !== null,
      label: info ? this.label(info) : null,
      townName: info?.townName ?? null,
      population: info?.population ?? null,
      savedAt: info?.savedAt ?? null,
    });
  }
}
