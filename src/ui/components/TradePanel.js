// Takas penceresi: gezgin tüccar tezgâhtayken ona ya da Pazar Yeri'ne tıklayınca sağda açılır.
// Teklifleri (data/trade.js) maliyet ve kazançlarıyla listeler; "Takas" düğmesi 'ui:trade' yayınlar,
// kuralları EventSystem uygular. Tüccar ayrılınca pencere kendiliğinden kapanır.
// (13. aşama) İki sekme: "Takas" ve yalnızca altınla alınan "Lüks Mallar" (baharat sandığı, ipek ve mermer, kasaba
// yadigârları; kartlar luxuryCards.js'te, kuralları LuxurySystem uygular).
import { MERCHANT, offersFor } from '../../data/trade.js';
import { getSeason } from '../../data/seasons.js';
import { RESOURCES } from '../../data/resources.js';
import { getCharacterPortraitURL } from '../../art/sprites/index.js';
import { getIconDataURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { luxuryCards } from './luxuryCards.js';

const pad = (n) => String(n).padStart(2, '0');

export class TradePanel {
  constructor(game) {
    this.slot = 'right';
    this.events = game.events;
    this.open = false;
    this.lastKey = '';

    this.portrait = el('img', { className: 'trade-portrait', alt: '' });
    this.name = el('h2', { className: 'character-name' });
    this.meta = el('div', { className: 'character-meta' });
    this.offers = el('div', { className: 'trade-offers' });
    this.tab = 'trade';
    this.tabs = [
      ['trade', 'Takas'],
      ['luxury', 'Lüks Mallar (Altın)'],
    ].map(([id, label]) => {
      const b = el('button', { className: 'hud-btn trade-tab', type: 'button', text: label, tabIndex: -1 });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        this.tab = id;
        this.lastKey = '';
      });
      return [id, b];
    });
    this.title = el('div', { className: 'relations-title trade-title', text: 'Takas teklifleri' });
    const close = el('button', { className: 'hud-btn character-close', type: 'button', text: '✕', title: 'Kapat', tabIndex: -1 });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.setOpen(false));

    this.element = el('div', { className: 'panel character-panel trade-panel ui-interactive', hidden: true }, [
      close,
      el('div', { className: 'character-header' }, [
        el('div', { className: 'trade-portrait-frame' }, [this.portrait]),
        el('div', { className: 'character-identity' }, [this.name, this.meta]),
      ]),
      el('div', { className: 'trade-tabs' }, this.tabs.map(([, b]) => b)),
      this.title,
      this.offers,
    ]);

    game.events.on('ui:openTrade', () => this.setOpen(true));
    game.events.on('merchant:left', () => this.setOpen(false));
  }

  setOpen(open) {
    this.open = open;
    this.element.hidden = !open;
    this.lastKey = '';
    if (open) this.element.parentElement?.scrollTo({ top: 0 });
  }

  render(game) {
    if (!this.open) return;
    const m = game.state.events.merchant;
    if (!m.present || m.leaving) {
      this.setOpen(false);
      return;
    }
    const resources = game.state.resources;
    const state = game.state;
    const key = `${this.tab}|${m.name}|${state.time.day}|${state.town?.tier}|${JSON.stringify(m.stock)}|${Object.values(resources).join(',')}|${JSON.stringify(state.luxury)}|${Math.floor((state.buffs.spices ?? 0) / 60)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    this.portrait.src = getCharacterPortraitURL(m.appearance);
    this.name.textContent = m.name;
    this.meta.textContent =
      (m.tier ?? 1) >= 3
        ? `Kervanında uzak şehirlerin malları: yün, demir, sıcak ekmek. ${pad(MERCHANT.departHour)}:00'e kadar Pazar Yeri'nde.`
        : `Sırt çantasında uzak kasabaların malları. ${pad(MERCHANT.departHour)}:00'e kadar Pazar Yeri'nde.`;
    for (const [id, b] of this.tabs) b.classList.toggle('is-active', id === this.tab);
    if (this.tab === 'luxury') {
      this.title.textContent = 'Lüks ve egzotik mallar · yalnızca altınla';
      this.offers.replaceChildren(...luxuryCards(state, this.events, 'merchant'));
      return;
    }
    this.title.textContent = 'Takas teklifleri';
    const offers = offersFor(getSeason(game.state.time.day).key, game.state.town?.tier ?? 1);
    this.offers.replaceChildren(...offers.map((offer) => this.offerRow(offer, m.stock[offer.id] ?? 0, resources)));
  }

  offerRow(offer, stock, resources) {
    const affordable = Object.entries(offer.give).every(([r, v]) => resources[r] >= v);
    const button = el('button', { className: 'hud-btn trade-button', type: 'button', text: 'Takas', tabIndex: -1 });
    button.disabled = stock <= 0 || !affordable;
    button.title = stock <= 0 ? 'Tüccarın bu mal için stoğu bitti' : affordable ? 'Takas et' : 'Yetersiz kaynak';
    button.addEventListener('mousedown', (e) => e.preventDefault());
    button.addEventListener('click', () => this.events.emit('ui:trade', { offerId: offer.id }));

    const deal = el('div', { className: 'trade-deal' }, [
      ...costChips(offer.give, resources),
      el('span', { className: 'trade-arrow', text: '→' }),
      ...(offer.get ? costChips(offer.get) : [el('span', { className: 'trade-special', text: offer.name })]),
      ...(offer.get && offer.name ? [el('span', { className: 'trade-special', text: offer.name })] : []),
    ]);
    const info = el('div', { className: 'trade-info' }, [
      deal,
      ...(offer.description ? [el('div', { className: 'trade-description', text: offer.description })] : []),
    ]);
    const tierClass = (offer.minTier ?? 1) > 1 ? ' is-tier' : '';
    return el('div', { className: `trade-row${offer.buff || offer.seasons ? ' is-special' : ''}${tierClass}` }, [
      info,
      el('div', { className: 'trade-side' }, [button, el('span', { className: 'trade-stock', text: `stok ${stock}` })]),
    ]);
  }
}

function costChips(cost, resources = null) {
  return Object.entries(cost).map(([r, v]) =>
    el('span', { className: `build-cost${resources && resources[r] < v ? ' is-missing' : ''}` }, [
      el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }),
      String(v),
    ])
  );
}
