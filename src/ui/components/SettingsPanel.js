// (17. aşama) Ayarlar penceresi: eskiden HUD'a ve sol sütuna dağılmış ayrıntılar tek bir ortalanmış pencerede.
//   Oyun     : Kaydet / Yükle / Yeni Harita (onay ister, 6 sn içinde onaylanmazsa vazgeçilir) ve son kaydın bilgisi
//   Tehlike Sıklığı : (23. aşama) Huzurlu / Dengeli / Çetin: doğal yangın ve haydut baskını sıklığı (kayda girer)
//   Erişilebilirlik: panel kaydırma okları (▲ / ▼; tercih bu cihazda hatırlanır)
//   Ses      : sesi aç / kapat (tercih hatırlanır)
//   Bilgi    : harita tohumu ve yakınlaştırma
//   Kontroller: bütün kısayollar
// Dock'taki "Ayarlar" düğmesi açar; ✕ / Esc / dışına tıklamak kapatır. Düğmeler yalnızca olay yayınlar.
import { el } from '../dom.js';
import { dockButton, modalHeader } from '../dockButton.js';
import { getIconDataURL } from '../../art/ui/index.js';
import { CRISIS_DIFFICULTY } from '../../data/crisis.js';
import { STORY_FILTERS } from '../../data/storyCards.js';
import { readLegendHidden } from './StoryFeed.js';
import { readScrollArrows } from './ScrollArrows.js';

const CONFIRM_TIMEOUT_MS = 6000;

export const CONTROLS = [
  [['Sol tık'], 'sakini / yapıyı seç, ağaca tıklayınca öncelikli kesim'],
  [['B'], 'inşa et'],
  [['H'], 'kaynak topla'],
  [['X'], 'yık / iptal et (sürükleyince yol, çit ve süsleri geri dönüştürür)'],
  [['Sol tık', 'sürükle'], 'yol / zemin fırçası ve çit, saksı, fidan dizme'],
  [['Esc'], 'açık pencereyi kapat, aracı / seçimi bırak'],
  [['O'], 'Kasaba Hedefleri'],
  [['J'], 'Kasaba Günlüğü'],
  [['I'], 'Kasaba Arşivi'],
  [['F'], 'fotoğraf modu'],
  [['W', 'A', 'S', 'D'], 'kamerayı kaydır'],
  [['Sağ tık'], 'haritayı sürükle'],
  [['Tekerlek'], 'yakınlaştır / uzaklaştır'],
  [['Boşluk'], 'duraklat'],
  [['1', '2', '3'], 'zaman hızı 1x / 2x / 4x'],
];

export class SettingsPanel {
  constructor(game) {
    this.game = game;
    this.events = game.events;
    this.open = false;
    this.zoom = null;
    this.lastInfo = '';
    this.confirmTimer = null;
    this.modalHost = null; // UIManager bağlar

    this.toggle = dockButton({ icon: 'gear', label: 'Ayarlar', tip: 'Kaydet / yükle, ses, kontroller', onClick: () => this.setOpen(!this.open), className: 'settings-toggle' });
    this.dockButtons = [this.toggle];

    const button = (label, title, onClick, cls = '') => {
      const b = el('button', { className: `hud-btn settings-btn ${cls}`.trim(), type: 'button', text: label, title, tabIndex: -1 });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', onClick);
      return b;
    };
    this.saveButton = button('Kaydet', 'Oyunu kaydet (her sabah 06:00\'da otomatik kayıt da alınır)', () => this.events.emit('ui:save'), 'settings-save');
    this.loadButton = button('Yükle', 'Son kayda dön', () => this.events.emit('ui:load'), 'settings-load');
    this.newButton = button('Yeni Harita', 'Rastgele yeni bir harita ile baştan başla', () => this.setConfirming(true), 'settings-new');
    this.saveInfo = el('div', { className: 'settings-note settings-save-info' });
    this.saveRow = el('div', { className: 'settings-row' }, [this.saveButton, this.loadButton, this.newButton]);
    const yes = button('Evet, baştan başla', 'Mevcut oyun silinir', () => {
      this.setConfirming(false);
      this.setOpen(false);
      this.events.emit('ui:newGame');
    }, 'is-danger');
    const no = button('Vazgeç', 'Oyuna devam et', () => this.setConfirming(false));
    this.confirmRow = el('div', { className: 'settings-row settings-confirm', hidden: true }, [el('span', { className: 'settings-note', text: 'Yeni harita? Kaydedilmemiş ilerleme kaybolur.' }), yes, no]);

    this.muteIcon = el('img', { className: 'hud-btn-icon', alt: '' });
    this.muteText = el('span');
    this.muteButton = button('', 'Sesi kapat / aç', () => this.events.emit('ui:toggleMute'), 'settings-mute');
    this.muteButton.append(this.muteIcon, this.muteText);
    this.info = el('div', { className: 'settings-note' });
    // (23. aşama) Tehlike Sıklığı: doğal yangın ve haydut baskını
    this.crisisButtons = Object.entries(CRISIS_DIFFICULTY).map(([key, def]) => {
      const b = button(def.name, def.description, () => this.events.emit('ui:setCrisisDifficulty', { difficulty: key }), 'settings-crisis');
      b.dataset.difficulty = key;
      return b;
    });
    this.crisisNote = el('div', { className: 'settings-note' });
    // (30.1) Rehber ve karar süresi
    const toggleButtons = (labels, onPick, cls) =>
      labels.map(([value, label, title]) => {
        const b = button(label, title, () => onPick(value), cls);
        b.dataset.value = String(value);
        return b;
      });
    this.guideButtons = toggleButtons([[true, 'Açık', 'İlk saatte ipucu kartları çıkar'], [false, 'Kapalı', 'İpucu kartları çıkmaz']], (on) => this.events.emit('ui:guideSetOff', { off: !on }), 'settings-guide');
    this.guideRestart = button('Rehberi baştan başlat', 'Tamamlanan ipuçları silinir, kartlar ilk adımdan çıkar', () => this.events.emit('ui:guideRestart'), 'settings-guide-restart');
    // (30.2) Hikâye kartları: Hepsi / Yalnızca önemli / Kapalı
    this.storyButtons = toggleButtons(Object.entries(STORY_FILTERS).map(([key, def]) => [key, def.name, def.hint]), (key) => this.events.emit('ui:setStoryFilter', { filter: key }), 'settings-story');
    this.legendButtons = toggleButtons([[false, 'Göster', 'Duygular açıkken sol altta işaret ve çizgi renklerinin açıklaması görünür'], [true, 'Gizle', 'Açıklama kutusu görünmez']], (hidden) => this.events.emit('ui:setEmotionLegend', { hidden }), 'settings-legend');
    // (Erişilebilirlik) Kaydırma okları: tekerlek / touchpad ile kaydıramayanlar için panellerin yanında ▲ / ▼
    this.arrowButtons = toggleButtons([[false, 'Kapalı', 'Paneller tekerlek, touchpad ya da dokunmatik ekranla kaydırılır'], [true, 'Açık', 'Kayan panellerin solunda ▲ / ▼ düğmeleri çıkar (basılı tut: sürekli kaydırır)']], (on) => this.events.emit('ui:setScrollArrows', { on }), 'settings-arrows');
    this.timerButtons = toggleButtons([[false, 'Kapalı', 'Karar penceresi sen seçene dek bekler'], [true, '30 saniye', 'Seçilmezse 30 saniye sonra güvenli seçenek uygulanır']], (on) => this.events.emit('ui:setDilemmaTimer', { on }), 'settings-timer');

    const keys = CONTROLS.map(([ks, label]) =>
      el('div', { className: 'settings-key' }, [el('span', { className: 'settings-keys' }, ks.map((k) => el('kbd', { text: k }))), el('span', { text: label })])
    );
    const section = (title, ...children) => el('div', { className: 'settings-section' }, [el('div', { className: 'building-section-title', text: title }), ...children]);
    this.window = el('div', { className: 'panel settings-panel ui-interactive', hidden: true }, [
      modalHeader('Ayarlar', () => this.setOpen(false), { icon: 'gear' }),
      section('Oyun', this.saveRow, this.confirmRow, this.saveInfo),
      section('Tehlike Sıklığı', el('div', { className: 'settings-row' }, this.crisisButtons), this.crisisNote),
      section('Rehber', el('div', { className: 'settings-row settings-guide-row' }, [el('span', { className: 'settings-label', text: 'Rehber:' }), ...this.guideButtons, this.guideRestart])),
      section('Hikâye', el('div', { className: 'settings-row settings-story-row' }, [el('span', { className: 'settings-label', text: 'Hikâye kartları:' }), ...this.storyButtons]), el('div', { className: 'settings-row' }, [el('span', { className: 'settings-label', text: 'Duygu Katmanı açıklaması:' }), ...this.legendButtons])),
      section('Kararlar', el('div', { className: 'settings-row settings-timer-row' }, [el('span', { className: 'settings-label', text: 'Kararlarda süre sınırı:' }), ...this.timerButtons])),
      section('Erişilebilirlik', el('div', { className: 'settings-row settings-arrows-row' }, [el('span', { className: 'settings-label', text: 'Panel kaydırma okları:' }), ...this.arrowButtons])),
      section('Ses ve görünüm', el('div', { className: 'settings-row' }, [this.muteButton]), this.info),
      section('Kontroller', el('div', { className: 'settings-keys-list' }, keys)),
    ]);
    this.modal = { id: 'settings', element: this.window };

    game.events.on('ui:toggleSettings', () => this.setOpen(!this.open));
    game.events.on('camera:zoom', (zoom) => (this.zoom = zoom));
    game.events.on('save:changed', ({ exists, label }) => {
      this.loadButton.disabled = !exists;
      this.saveInfo.textContent = exists ? `Son kayıt: ${label} (her sabah 06:00'da otomatik kaydedilir)` : 'Henüz kayıt yok';
      this.loadButton.title = exists ? `Son kayda dön (${label})` : 'Yüklenecek kayıt yok';
    });
    game.events.on('audio:muteChanged', (muted) => {
      this.muteIcon.src = getIconDataURL(muted ? 'mute' : 'sound');
      this.muteText.textContent = muted ? 'Ses kapalı · aç' : 'Ses açık · kapat';
      this.muteButton.classList.toggle('is-active', muted);
    });
  }

  setOpen(open) {
    this.open = open;
    this.window.hidden = !open;
    this.toggle.classList.toggle('is-active', open);
    if (!open) this.setConfirming(false);
    this.lastInfo = '';
    if (open) this.modalHost?.opened('settings');
    else this.modalHost?.closed('settings');
  }

  setConfirming(confirming) {
    clearTimeout(this.confirmTimer);
    this.saveRow.hidden = confirming;
    this.confirmRow.hidden = !confirming;
    if (confirming) this.confirmTimer = setTimeout(() => this.setConfirming(false), CONFIRM_TIMEOUT_MS);
  }

  render(game) {
    if (!this.open) return;
    const current = game.state.crisis?.difficulty ?? 'dengeli';
    for (const b of this.crisisButtons) b.classList.toggle('is-active', b.dataset.difficulty === current);
    const guideOn = game.state.guide?.off !== true;
    for (const b of this.guideButtons) b.classList.toggle('is-active', (b.dataset.value === 'true') === guideOn);
    const storyMode = game.state.settings?.storyCards ?? 'important';
    for (const b of this.storyButtons) b.classList.toggle('is-active', b.dataset.value === storyMode);
    const legendHidden = readLegendHidden();
    for (const b of this.legendButtons) b.classList.toggle('is-active', (b.dataset.value === 'true') === legendHidden);
    const arrows = readScrollArrows();
    for (const b of this.arrowButtons) b.classList.toggle('is-active', (b.dataset.value === 'true') === arrows);
    const timed = game.state.settings?.dilemmaTimer === true;
    for (const b of this.timerButtons) b.classList.toggle('is-active', (b.dataset.value === 'true') === timed);
    const note = `${CRISIS_DIFFICULTY[current]?.description ?? ''} Yanan yapılar haritadan silinmez, yaralanan sakin ölmez.`;
    if (this.crisisNote.textContent !== note) this.crisisNote.textContent = note;
    const text = `Harita tohumu ${game.state.seed} · yakınlık ${this.zoom ?? '-'}x · ${game.state.map.width}x${game.state.map.height} harita`;
    if (text !== this.lastInfo) {
      this.lastInfo = text;
      this.info.textContent = text;
    }
  }
}
