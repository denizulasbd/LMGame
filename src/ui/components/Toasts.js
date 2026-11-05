// Üst bilgi çubuğunun hemen altında ortada beliren, birkaç saniye sonra kaybolan bildirimler.
// Herhangi bir sistem 'toast' olayı yayınlayabilir: { text, tone: info|success|warn, icon? }
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const VISIBLE_MS = 3600;
const FADE_MS = 400;
const MAX_TOASTS = 4;

export class Toasts {
  constructor(game) {
    this.slot = 'toasts'; // (17. aşama) üst çubuğun hemen altında ortada
    this.element = el('div', { className: 'toasts' });
    this.lastText = '';
    this.lastAt = 0;
    game.events.on('toast', (toast) => this.show(toast));
  }

  show({ text, tone = 'info', icon }) {
    // Aynı bildirim art arda gelirse (ör. her tıklamada "yetersiz kaynak") tekrar etme
    const now = performance.now();
    if (text === this.lastText && now - this.lastAt < 1200) return;
    this.lastText = text;
    this.lastAt = now;

    const item = el('div', { className: `toast is-${tone}` }, [
      ...(icon ? [el('img', { className: 'toast-icon', src: getAnyIconURL(icon), alt: '' })] : []),
      el('span', { text }),
    ]);
    this.element.append(item);
    while (this.element.children.length > MAX_TOASTS) this.element.firstElementChild.remove();
    setTimeout(() => item.classList.add('is-leaving'), VISIBLE_MS);
    setTimeout(() => item.remove(), VISIBLE_MS + FADE_MS);
  }
}
