// Başlangıç ekranı: arka planda kasaba sessizce yaşarken ortada pixel-art menü.
//   - "Kaldığın Yerden Devam Et": son elle / otomatik kayıt (yoksa soluk)
//   - "Yeni Kasaba Kur": kasaba adı (rastgele Türkçe ad önerilir, zar yenisini getirir) ve isteğe
//     bağlı tohum ile yeni oyun
// Sahne 'title:show' / 'title:hide' yayınlar; menü açıkken diğer arayüz gizlenir. Seçimler
// 'ui:continueGame' ve 'ui:startNewTown' { name, seed } olarak yayınlanır (SaveSystem uygular).
import { CONFIG } from '../../config.js';
import { TOWN_NAMES, TOWN_NAME_MAX_LENGTH } from '../../data/town.js';
import { getStructureSprite, getCharacterSprite } from '../../art/sprites/index.js';
import { getObjectSprite } from '../../art/tiles/index.js';
import { el } from '../dom.js';

const LOGO_SCALE = 3;

export class TitleMenu {
  constructor(game) {
    this.slot = 'free';
    this.events = game.events;
    this.save = null;

    this.logo = el('canvas', { className: 'title-logo-art', width: 112 * LOGO_SCALE, height: 44 * LOGO_SCALE });
    this.continueButton = this.button('Kaldığın Yerden Devam Et', () => this.events.emit('ui:continueGame'));
    this.continueInfo = el('span', { className: 'title-save-info' });
    this.continueButton.append(this.continueInfo);
    const newButton = this.button('Yeni Kasaba Kur', () => this.showForm(true));

    this.nameInput = el('input', { className: 'title-input', type: 'text', maxLength: TOWN_NAME_MAX_LENGTH, placeholder: 'Kasabanın adı' });
    const dice = this.button('Başka Ad', () => this.suggestName());
    dice.classList.add('title-small');
    this.seedInput = el('input', { className: 'title-input title-seed', type: 'text', inputMode: 'numeric', placeholder: 'Rastgele', maxLength: 10 });
    const start = this.button('Kasabayı Kur', () => this.startNewTown());
    start.classList.add('is-primary');
    const back = this.button('Geri', () => this.showForm(false));
    back.classList.add('title-small');
    for (const input of [this.nameInput, this.seedInput]) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.startNewTown();
        if (e.key === 'Escape') this.showForm(false);
      });
    }

    this.mainButtons = el('div', { className: 'title-buttons' }, [this.continueButton, newButton]);
    this.form = el('div', { className: 'title-form', hidden: true }, [
      el('label', { className: 'title-label', text: 'Kasabanın adı' }),
      el('div', { className: 'title-row' }, [this.nameInput, dice]),
      el('label', { className: 'title-label', text: 'Harita tohumu (isteğe bağlı)' }),
      el('div', { className: 'title-row' }, [this.seedInput]),
      el('div', { className: 'title-row title-actions' }, [back, start]),
    ]);

    this.element = el('div', { className: 'title-screen ui-interactive', hidden: true }, [
      el('div', { className: 'panel title-panel' }, [
        this.logo,
        el('h1', { className: 'title-name', text: CONFIG.GAME_TITLE }),
        el('p', { className: 'title-tagline', text: 'Küçük bir kasaba kur, sakinlerini mutlu et, mevsimleri birlikte karşılayın.' }),
        this.mainButtons,
        this.form,
        el('p', { className: 'title-hint', text: 'İpucu: oyunda B ile inşa et, H ile kaynak topla, J günlük, G hedefler.' }),
      ]),
    ]);

    game.events.on('title:show', () => this.setVisible(true));
    game.events.on('title:hide', () => this.setVisible(false));
    game.events.on('save:changed', (info) => {
      this.save = info;
      this.updateContinue();
    });
  }

  button(text, onClick) {
    const b = el('button', { className: 'hud-btn title-btn', type: 'button', text, tabIndex: -1 });
    b.addEventListener('mousedown', (e) => {
      if (e.target === b) e.preventDefault();
    });
    b.addEventListener('click', onClick);
    return b;
  }

  setVisible(visible) {
    this.element.hidden = !visible;
    this.element.parentElement?.classList.toggle('is-title', visible);
    if (visible) {
      this.showForm(false);
      this.drawLogo();
    }
  }

  updateContinue() {
    const exists = Boolean(this.save?.exists);
    this.continueButton.disabled = !exists;
    this.continueInfo.textContent = exists
      ? `${this.save.townTitle ?? this.save.townName ?? 'Kasaban'} · ${this.save.label}${this.save.population ? ` · ${this.save.population} sakin` : ''}`
      : 'Henüz kayıt yok';
  }

  showForm(show) {
    this.form.hidden = !show;
    this.mainButtons.hidden = show;
    if (show) {
      this.suggestName();
      this.seedInput.value = '';
      this.nameInput.focus();
      this.nameInput.select();
    }
  }

  suggestName() {
    const current = this.nameInput.value;
    const choices = TOWN_NAMES.filter((n) => n !== current);
    this.nameInput.value = choices[Math.floor(Math.random() * choices.length)];
  }

  startNewTown() {
    const name = this.nameInput.value.trim().slice(0, TOWN_NAME_MAX_LENGTH) || TOWN_NAMES[0];
    const seedText = this.seedInput.value.trim();
    const seed = seedText ? Number.parseInt(seedText.replace(/\D/g, ''), 10) : NaN;
    this.events.emit('ui:startNewTown', { name, seed: Number.isFinite(seed) ? seed : null });
  }

  /** Logo resmi: iki ağaç arasında bir kulübe ve önünde selamlaşan iki sakin. */
  drawLogo() {
    const ctx = this.logo.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.logo.width, this.logo.height);
    ctx.save();
    ctx.scale(LOGO_SCALE, LOGO_SCALE);
    ctx.fillStyle = '#6cc04a';
    ctx.fillRect(0, 38, 112, 6);
    ctx.fillStyle = '#4a9a46';
    ctx.fillRect(0, 42, 112, 2);
    ctx.drawImage(getObjectSprite('oak', 'summer'), 8, 20);
    ctx.drawImage(getObjectSprite('pine', 'summer'), 88, 20);
    ctx.drawImage(getStructureSprite('cabin', { windowsLit: true, tone: 0 }), 40, 2);
    ctx.drawImage(getCharacterSprite({ hair: 'long', hairColor: 'auburn', skin: 'light', shirt: 'rose', pants: 'navy' }, 'right', 'idle0'), 26, 24);
    ctx.drawImage(getCharacterSprite({ hair: 'hat', hairColor: 'ginger', skin: 'light', shirt: 'red', pants: 'denim' }, 'left', 'idle0'), 74, 24);
    ctx.restore();
  }
}
