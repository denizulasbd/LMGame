// (34.2) Parsel kartı: kilitli toprağa tıklayınca tıklanan yerin yanında açılan küçük kart. Ad, boyut, içerik, işe yarar alan,
// nüfus kotası, fiyatın dökümü ve "Satın Al" düğmesi. Alınamıyorsa düğme pasiftir ve nedeni yazılıdır (komşu, seviye, altın).
// Kartı açıp kapatmak sahnenin işidir ('ui:openParcel' { id, x, y }, 'ui:closeParcel'); satın almayı ParcelSystem yapar ('ui:buyParcel').
// Fotoğraf modu, karar penceresi ve açık pencere varken gizlenir.
import { el } from '../dom.js';
import { PARCEL_TEXT as T } from '../../data/parcels.js';

export class ParcelCard {
  constructor(game) {
    this.slot = 'free';
    this.game = game;
    this.id = null;
    this.at = { x: 0, y: 0 };
    this.title = el('div', { className: 'parcel-title' });
    this.sub = el('div', { className: 'parcel-sub' });
    this.rows = el('div', { className: 'parcel-rows' });
    this.reason = el('div', { className: 'parcel-reason', hidden: true });
    this.buy = el('button', { className: 'hud-btn parcel-buy', type: 'button', text: T.buy, tabIndex: -1 });
    this.close = el('button', { className: 'hud-btn parcel-close', type: 'button', text: T.close, tabIndex: -1 });
    for (const b of [this.buy, this.close]) b.addEventListener('mousedown', (e) => e.preventDefault());
    this.buy.addEventListener('click', () => this.id && !this.buy.disabled && game.events.emit('ui:buyParcel', { id: this.id }));
    this.close.addEventListener('click', () => game.events.emit('ui:closeParcel'));
    this.element = el('div', { className: 'panel parcel-card ui-interactive', hidden: true, role: 'dialog', ariaLabel: T.cardTitle }, [
      this.title,
      this.sub,
      this.rows,
      this.reason,
      el('div', { className: 'parcel-actions' }, [this.buy, this.close]),
    ]);
    game.events.on('ui:openParcel', ({ id, x, y }) => {
      this.id = id;
      this.at = { x, y };
      this.key = '';
      this.positioned = false;
    });
    game.events.on('ui:closeParcel', () => (this.id = null));
  }

  render(game) {
    const scene = game.scenes.current;
    const system = scene?.parcelSystem;
    const root = this.element.closest('#ui-layer');
    const hidden = !this.id || !system || root?.classList.contains('is-title') || root?.classList.contains('is-cinematic') || root?.classList.contains('has-modal') || game.state.dilemma?.active;
    if (hidden) {
      if (!this.element.hidden) this.element.hidden = true;
      return;
    }
    const parcel = system.parcel(this.id);
    const status = system.status(this.id);
    if (!parcel || !status || status.owned) {
      this.element.hidden = true;
      return;
    }
    const b = status.breakdown;
    const key = `${this.id}|${status.price}|${status.ok}|${status.reason}`;
    if (key !== this.key) {
      this.key = key;
      this.title.textContent = parcel.name;
      this.sub.textContent = `${parcel.w}×${parcel.h} · ${parcel.kindLabel}`;
      this.rows.replaceChildren(
        el('div', { text: T.usefulLine({ useful: parcel.useful, area: parcel.area }) }),
        el('div', { className: 'parcel-quota', text: T.quotaLine(parcel.quota) }),
        el('div', { className: 'parcel-price-line', text: T.priceLine(b) }),
        el('div', { className: 'parcel-price', text: `${status.price} altın` })
      );
      this.buy.disabled = !status.ok;
      this.buy.title = status.ok ? '' : status.reason;
      this.reason.hidden = status.ok;
      this.reason.textContent = status.ok ? '' : status.reason;
    }
    if (this.element.hidden) this.element.hidden = false;
    if (!this.positioned) {
      // tıklanan yerin sağ altı; pencereye sığmazsa öbür yanına geçer
      const w = this.element.offsetWidth;
      const h = this.element.offsetHeight;
      let x = this.at.x + 18;
      let y = this.at.y + 18;
      if (x + w > window.innerWidth - 8) x = this.at.x - w - 18;
      if (y + h > window.innerHeight - 8) y = window.innerHeight - h - 8;
      const top = document.querySelector('.hud.topbar');
      y = Math.max(y, top ? top.getBoundingClientRect().bottom + 6 : 6);
      this.element.style.transform = `translate(${Math.round(Math.max(6, x))}px, ${Math.round(y)}px)`;
      this.positioned = w > 0;
    }
  }
}
