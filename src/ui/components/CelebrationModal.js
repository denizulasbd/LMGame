// Kasaba Anıtı tamamlanınca ('town:legendary') ekranın ortasında açılan kutlama penceresi.
// Oyun durmaz; "Oynamaya Devam Et" pencereyi kapatır.
import { getStructureSprite } from '../../art/sprites/index.js';
import { el } from '../dom.js';

export class CelebrationModal {
  constructor(game) {
    this.slot = 'free';
    this.art = el('canvas', { className: 'celebration-art', width: 32 * 4, height: 56 * 4 });
    this.message = el('p', { className: 'celebration-text' });
    const ok = el('button', { className: 'hud-btn title-btn is-primary', type: 'button', text: 'Oynamaya Devam Et', tabIndex: -1 });
    ok.addEventListener('click', () => (this.element.hidden = true));
    this.confetti = el('div', { className: 'celebration-confetti' });
    for (let i = 0; i < 24; i++) {
      this.confetti.append(el('span', { style: `left: ${(i * 41) % 100}%; animation-delay: ${(i % 8) * 0.25}s; background: ${['#ffd23f', '#f06b8a', '#4aa3df', '#a4dd5c'][i % 4]}` }));
    }
    this.element = el('div', { className: 'celebration ui-interactive', hidden: true }, [
      this.confetti,
      el('div', { className: 'panel celebration-panel' }, [
        el('h2', { className: 'celebration-title', text: 'Tebrikler, Kasabanız Efsaneleşti!' }),
        this.art,
        this.message,
        ok,
      ]),
    ]);
    game.events.on('town:legendary', ({ townName }) => this.show(townName, game.state));
  }

  show(townName, state) {
    const ctx = this.art.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.art.width, this.art.height);
    ctx.drawImage(getStructureSprite('monument', {}), 0, 0, this.art.width, this.art.height);
    this.message.textContent =
      `${townName}, ${state.time.day} günde ${state.characters.length} sakinli, mutlu bir kasabaya dönüştü. ` +
      'Kasaba Anıtı artık meydanın gururu. (Oynamaya devam edebilirsiniz.)';
    this.element.hidden = false;
  }
}
