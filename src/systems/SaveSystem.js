// Kayıt / yükleme akışı. Arayüz yalnızca olay yayınlar, işi burada yapılır:
//   'ui:save'    -> oyunu 'main' yuvasına yazar
//   'ui:load'    -> 'main' yuvasındaki kaydı yükler ve sahneyi yeniden kurar
//   'ui:newGame' -> rastgele yeni bir tohumla sıfırdan başlar
// Ayrıca her sabah 06:00'da otomatik kaydeder, sayfa kapanırken / gizlenirken 'session'
// yuvasına yazar (F5 oyunu kaldığı yerden sürdürür). Durum değişince 'save:changed' yayınlar:
//   { exists, label, townName, townTitle, population, savedAt } -> HUD "Yükle" düğmesini ve kayıt bilgisini,
//   başlangıç ekranı "Kaldığın Yerden Devam Et" satırını ("Yeşilvadi Kasabası · Gün 12, 06:00") günceller.
import { CONFIG } from '../config.js';
import { SaveManager } from '../state/SaveManager.js';
import { TOWN_TIERS } from '../data/town.js';
import { formatTownTitle } from './TownStatus.js';

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
      game.events.on('ui:retryBroken', ({ key }) => this.retryBroken(key)),
      game.events.on('ui:downloadBroken', ({ key }) => this.downloadBroken(key)),
      game.events.on('ui:exportSave', () => this.exportSave()),
      game.events.on('ui:importSave', ({ text }) => this.importSave(text)),
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
    // (30.1) Oturum kaydı da her sabah tazelenir: sayfa kapanış olayları hiç çalışmasa (tarayıcı sonlandırıldı) en çok bir gün gider
    this.persistSession();
    if (this.write('main')) this.events.emit('toast', { text: 'Otomatik kaydedildi', tone: 'info', icon: 'sparkle' });
    this.announce();
  }

  /**
   * (32.7) Kaydı duruma yükler. Okunamazsa kayıt SİLİNMEZ: ham veri yedeklenir (slot verilmişse yuva temizlenir), oyun olduğu gibi kalır.
   * Dönüş: yüklendiyse { warnings }, yoksa null.
   */
  applySave(data, slot) {
    try {
      const warnings = this.game.state.restore(data);
      return { warnings };
    } catch (err) {
      console.warn(err);
      if (slot) SaveManager.quarantine(slot);
      this.events.emit('toast', { text: 'Kayıt okunamadı ve yedeklendi.', tone: 'warn', icon: 'demolish' });
      this.announce();
      return null;
    }
  }

  warnSkipped(warnings) {
    const n = warnings?.skippedBuildings?.length ?? 0;
    if (n) this.events.emit('toast', { text: `Kayıttaki ${n} yapı tanınmadı ve atlandı.`, tone: 'warn', icon: 'demolish' });
  }

  loadManual() {
    const data = SaveManager.read('main');
    if (!data) {
      this.events.emit('toast', { text: SaveManager.takeNotice() ? 'Kayıt okunamadı ve yedeklendi.' : 'Yüklenecek kayıt yok', tone: 'warn', icon: 'demolish' });
      this.announce();
      return;
    }
    const done = this.applySave(data, 'main');
    if (!done) return;
    this.reloadScene();
    this.events.emit('toast', { text: `Oyun yüklendi: ${this.label(data.time)}`, tone: 'success', icon: 'sparkle' });
    this.warnSkipped(done.warnings);
  }

  /** Başlangıç ekranı: son elle / otomatik kayda dön. */
  continueGame() {
    const data = SaveManager.read('main');
    if (!data) {
      if (SaveManager.takeNotice()) this.events.emit('toast', { text: 'Kayıt okunamadı ve yedeklendi.', tone: 'warn', icon: 'demolish' });
      this.announce();
      return;
    }
    const done = this.applySave(data, 'main');
    if (!done) return;
    this.reloadScene();
    this.events.emit('toast', { text: `Hoş geldin! ${this.state.townName} seni bekliyordu.`, tone: 'success', icon: 'heart' });
    this.warnSkipped(done.warnings);
  }

  /**
   * (32.7) Yedeklenen kayıt ya da içe aktarılan dosya oyuna alınır: önce yüklenir (başarısızsa hiçbir şey değişmez), sonra mevcut ana
   * kayıt yedeğe kopyalanır (ezilmez), yeni kayıt 'main' ve oturum yuvalarına yazılır. Dönüş: { warnings } ya da null.
   */
  adopt(raw) {
    let data;
    try {
      data = SaveManager.parseRaw(raw);
    } catch (err) {
      console.warn(err);
      return null;
    }
    try {
      const warnings = this.game.state.restore(data);
      const old = SaveManager.readRaw('main');
      if (old && old !== raw) SaveManager.backupRaw('main', old);
      this.reloadScene();
      this.write('main');
      this.persistSession();
      this.announce();
      return { warnings, data };
    } catch (err) {
      console.warn(err);
      return null;
    }
  }

  /** Ayarlar > Yedeklenen kayıtlar > Yeniden dene: başarılıysa yedek silinir. */
  retryBroken(key) {
    const raw = SaveManager.readBroken(key);
    if (raw === null) return;
    const done = this.adopt(raw);
    if (!done) {
      this.events.emit('toast', { text: 'Yedek yine okunamadı; dosya olarak indirip saklayabilirsin.', tone: 'warn', icon: 'demolish' });
      return;
    }
    SaveManager.removeBroken(key);
    this.announce();
    this.events.emit('toast', { text: `Yedek yüklendi: ${this.label(done.data.time)}`, tone: 'success', icon: 'sparkle' });
    this.warnSkipped(done.warnings);
  }

  downloadBroken(key) {
    const raw = SaveManager.readBroken(key);
    if (raw === null) return;
    this.events.emit('save:file', { name: `${key.replace('lmgame.save.', 'lmgame-')}.json`, text: raw });
  }

  /** Bütün oyuncular için: ana kayıt ve oturum kaydı tek JSON dosyası olarak indirilir. */
  exportSave() {
    this.persistSession(); // oturum kaydı güncel olsun (başlangıç ekranındaki arka plan kasabası yazmaz)
    const slots = {};
    for (const slot of ['main', 'session']) {
      const raw = SaveManager.readRaw(slot);
      if (raw) slots[slot] = raw;
    }
    if (!Object.keys(slots).length) {
      this.events.emit('toast', { text: 'İndirilecek kayıt yok', tone: 'warn', icon: 'demolish' });
      return;
    }
    const text = JSON.stringify({ lmgameSaveFile: 1, slots });
    this.events.emit('save:file', { name: `lmgame-kayit-${new Date().toISOString().slice(0, 10)}.json`, text });
    this.events.emit('toast', { text: 'Kayıt dosyası hazırlandı', tone: 'success', icon: 'sparkle' });
  }

  /** "Dosyadan yükle": dışa aktarılan dosya (ana + oturum) ya da tek bir ham kayıt. Oturum kaydı öncelikli (en yeni olan). */
  importSave(text) {
    let candidates = [];
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && parsed.slots && typeof parsed.slots === 'object') {
        candidates = ['session', 'main'].map((k) => parsed.slots[k]).filter((v) => typeof v === 'string');
      } else candidates = [text];
    } catch {
      candidates = [];
    }
    for (const raw of candidates) {
      const done = this.adopt(raw);
      if (done) {
        this.events.emit('toast', { text: `Dosyadan yüklendi: ${this.label(done.data.time)}`, tone: 'success', icon: 'sparkle' });
        this.warnSkipped(done.warnings);
        return;
      }
    }
    this.events.emit('toast', { text: 'Dosya okunamadı; oyun olduğu gibi duruyor.', tone: 'warn', icon: 'demolish' });
  }

  /** Başlangıç ekranı: verilen adla (ve isteğe bağlı tohumla) yeni kasaba. */
  startNewTown(name, seed) {
    SaveManager.clear('session');
    const difficulty = this.game.state.crisis?.difficulty;
    const prefs = this.preferences();
    this.game.state.reset(Number.isFinite(seed) ? seed : undefined, name);
    this.restorePreferences(prefs, false); // başlangıç ekranından yeni kasaba: rehber her zaman açık başlar (arka plandaki eski kayıt kapalı olabilir)
    if (difficulty && this.game.state.crisis) this.game.state.crisis.difficulty = difficulty; // (23. aşama) tehlike sıklığı tercihi yeni kasabaya taşınır
    this.reloadScene();
    this.events.emit('toast', { text: `${this.state.townName} kuruldu. Kolay gelsin!`, tone: 'success', icon: 'sun' });
  }

  newGame() {
    SaveManager.clear('session');
    const difficulty = this.game.state.crisis?.difficulty;
    const prefs = this.preferences();
    this.game.state.reset();
    this.restorePreferences(prefs);
    if (difficulty && this.game.state.crisis) this.game.state.crisis.difficulty = difficulty; // (23. aşama) tercih yeni haritaya taşınır
    this.reloadScene();
    this.events.emit('toast', { text: 'Yeni harita başladı', tone: 'info', icon: 'sun' });
  }

  /** (30.1) Oyuncu tercihleri (karar süresi, rehber açık / kapalı) yeni kasabaya taşınır; rehberin ilerlemesi sıfırlanır. */
  preferences() {
    return { settings: { ...this.game.state.settings }, guideOff: this.game.state.guide?.off === true };
  }

  restorePreferences({ settings, guideOff }, keepGuideOff = true) {
    this.game.state.settings = settings;
    this.game.state.guide = { done: [], off: keepGuideOff && guideOff };
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
      townTitle: info?.tier ? formatTownTitle(info.townName, TOWN_TIERS[info.tier - 1]) : info?.townName ?? null,
      population: info?.population ?? null,
      savedAt: info?.savedAt ?? null,
      broken: SaveManager.listBroken(), // (32.7) yedeklenen kayıtlar: [{ key, slot, ts, size }]
    });
  }
}
