// (Erişilebilirlik) Kaydırma okları: tekerlek / touchpad / dokunmatik kaydırma çalışmayan oyuncular için kayan
// panellerin (sağ sütundaki kartlar ve sakin listesi, ortadaki pencereler, yapı listesi) solunda ▲ / ▼ düğmeleri.
// Ayarlar > Erişilebilirlik'ten açılır / kapanır; tercih bu cihazda hatırlanır (kayda girmez).
// Düğmeye bir kez basmak paneli yaklaşık bir sayfa kaydırır, basılı tutmak kaydırmayı sürdürür.
// Düğme yalnızca o yönde kaydırılacak içerik varsa görünür. Panellerin içeriğine dokunmaz: düğmeler ayrı bir
// katmanda durur ve her karede panelin ekrandaki yerine göre konumlanır.
import { el } from '../dom.js';

export const SCROLL_ARROWS_KEY = 'lmgame.ui.scrollArrows';

export function readScrollArrows() {
  try {
    return localStorage.getItem(SCROLL_ARROWS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeScrollArrows(on) {
  try {
    localStorage.setItem(SCROLL_ARROWS_KEY, on ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

// Okların bağlanabileceği kayan kutular
const TARGETS = [
  '.ui-right .ui-cards',
  '.ui-right .ui-cards > .panel',
  '.ui-right .resident-list',
  '.modal-window.panel',
  '.build-items.panel',
  '.build-items.panel > .build-item-list',
].join(', ');

const BUTTON = 30; // düğme kenarı (px)
const GAP = 6; // panelle düğme arası
const REPEAT_DELAY_MS = 350;
const REPEAT_MS = 120;

export class ScrollArrows {
  constructor(game) {
    this.enabled = readScrollArrows();
    this.root = null;
    this.pairs = []; // { up, down, target }
    this.element = el('div', { className: 'scroll-arrows-layer' });
    this.hold = null;

    game.events.on('ui:setScrollArrows', ({ on }) => {
      this.enabled = on;
      writeScrollArrows(on);
      if (!on) this.hideFrom(0);
    });
    const stop = () => this.stopHold();
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
  }

  makeButton(direction) {
    const b = el('button', {
      className: `hud-btn scroll-arrow ui-interactive is-${direction}`,
      type: 'button',
      tabIndex: -1,
      text: direction === 'up' ? '▲' : '▼',
      title: direction === 'up' ? 'Yukarı kaydır (basılı tut: sürekli)' : 'Aşağı kaydır (basılı tut: sürekli)',
      hidden: true,
    });
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const pair = this.pairs.find((p) => p.up === b || p.down === b);
      if (pair?.target) this.startHold(pair.target, direction === 'up' ? -1 : 1);
    });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  }

  pair(i) {
    if (!this.pairs[i]) {
      const up = this.makeButton('up');
      const down = this.makeButton('down');
      this.element.append(up, down);
      this.pairs[i] = { up, down, target: null };
    }
    return this.pairs[i];
  }

  startHold(target, sign) {
    this.stopHold();
    const step = () => target.scrollBy({ top: sign * Math.max(60, target.clientHeight * 0.6), behavior: 'smooth' });
    step();
    const timer = setTimeout(() => {
      this.hold.interval = setInterval(() => target.scrollBy({ top: sign * Math.max(40, target.clientHeight * 0.25) }), REPEAT_MS);
    }, REPEAT_DELAY_MS);
    this.hold = { timer, interval: null };
  }

  stopHold() {
    if (!this.hold) return;
    clearTimeout(this.hold.timer);
    clearInterval(this.hold.interval);
    this.hold = null;
  }

  hideFrom(i) {
    for (let k = i; k < this.pairs.length; k++) {
      const p = this.pairs[k];
      p.target = null;
      p.up.hidden = true;
      p.down.hidden = true;
    }
  }

  render() {
    if (!this.enabled) return;
    this.root ??= this.element.parentElement;
    if (!this.root || this.root.classList.contains('is-cinematic') || this.root.classList.contains('is-title')) {
      this.hideFrom(0);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let n = 0;
    for (const target of this.root.querySelectorAll(TARGETS)) {
      if (target.scrollHeight <= target.clientHeight + 2) continue;
      if (!/(auto|scroll)/.test(getComputedStyle(target).overflowY)) continue;
      const r = target.getBoundingClientRect();
      if (r.height < BUTTON || r.right <= 0 || r.left >= vw || r.bottom <= 0 || r.top >= vh) continue;
      // Düğmeler panelin (varsa çerçevesinin) soluna, haritanın üstüne gelir: panelin içeriğini ve ✕ düğmesini örtmez
      const frame = target.closest('.panel') ?? target;
      const left = Math.max(2, frame.getBoundingClientRect().left - BUTTON - GAP);
      const top = Math.max(2, r.top);
      const bottom = Math.min(vh - 2, r.bottom);
      const twoRows = bottom - top >= BUTTON * 2 + 8;
      const p = this.pair(n++);
      p.target = target;
      const atTop = target.scrollTop <= 1;
      const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
      this.place(p.up, left, twoRows ? top : (top + bottom) / 2 - BUTTON - 2, atTop);
      this.place(p.down, left, twoRows ? bottom - BUTTON : (top + bottom) / 2 + 2, atBottom);
    }
    this.hideFrom(n);
  }

  place(button, left, top, hide) {
    button.hidden = hide;
    if (hide) return;
    const l = `${Math.round(left)}px`;
    const t = `${Math.round(top)}px`;
    if (button.style.left !== l) button.style.left = l;
    if (button.style.top !== t) button.style.top = t;
  }
}
