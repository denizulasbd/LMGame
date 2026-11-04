// Lüks mal, yadigâr ve altın fermanı kartları (13. aşama): takas penceresinin "Lüks Mallar" sekmesi, limanın ve
// Belediye Konağı'nın panelleri aynı kartları kullanır. Yalnızca GameState okunur (src/systems/Luxury.js'teki saf
// durum hesapları); düğmeler olay yayınlar ('ui:buyLuxury', 'ui:buyRelic', 'ui:goldDecree').
import { LUXURY_GOODS, LUXURY_KEYS, RELICS, RELIC_KEYS, GOLD_DECREES, GOLD_DECREE_KEYS } from '../../data/luxury.js';
import { luxuryStatus, relicStatus, goldDecreeStatus, relicCount } from '../../systems/Luxury.js';
import { getAnyIconURL, getIconDataURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

function button(label, title, onClick) {
  const b = el('button', { className: 'hud-btn upgrade-button', type: 'button', text: label, title, tabIndex: -1 });
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', onClick);
  return b;
}

function priceChip(price, gold) {
  return el('span', { className: `luxury-price${gold < price ? ' is-missing' : ''}` }, [el('img', { src: getIconDataURL('coin'), alt: 'Altın' }), String(price)]);
}

function card({ icon, name, stateText, description, price, gold, status, label, onClick, done }) {
  const children = [
    el('div', { className: 'decree-head' }, [el('img', { src: getAnyIconURL(icon), alt: '' }), name, el('span', { className: 'decree-state', text: stateText })]),
    el('div', { className: 'upgrade-text', text: description }),
  ];
  if (!done) {
    const go = button(label, status.ok ? `${name}: ${price} altın` : status.reason, onClick);
    go.disabled = !status.ok;
    children.push(el('div', { className: 'upgrade-row' }, [el('span', { className: 'build-costs' }, [priceChip(price, gold)]), go]));
    if (!status.ok) children.push(el('div', { className: 'upgrade-text is-active', text: status.reason }));
  }
  return el('div', { className: `decree luxury-card${done ? ' is-done' : ''}` }, children);
}

/** Lüks mallar ve satın alınabilecek yadigârlar (source: 'merchant' | 'harbor'). */
export function luxuryCards(state, events, source) {
  const gold = state.resources.gold ?? 0;
  const goods = LUXURY_KEYS.map((id) => {
    const good = LUXURY_GOODS[id];
    const status = luxuryStatus(state, id, source);
    const active = id === 'spiceCrate' && (state.buffs.spices ?? 0) > state.totalMinutes;
    const hoursLeft = active ? Math.ceil((state.buffs.spices - state.totalMinutes) / 60) : 0;
    return card({
      icon: good.icon,
      name: good.name,
      stateText: status.done ? 'Kasabada var' : active ? `Handa · ${hoursLeft} sa` : good.once ? 'Kalıcı' : 'Tekrar alınabilir',
      description: good.description,
      price: status.price,
      gold,
      status,
      label: 'Satın Al',
      done: status.done,
      onClick: () => events.emit('ui:buyLuxury', { id, source }),
    });
  });
  const owned = relicCount(state);
  const relics = RELIC_KEYS.filter((id) => !state.luxury.relics[id]).map((id) => {
    const relic = RELICS[id];
    const status = relicStatus(state, id, source);
    return card({
      icon: relic.icon,
      name: relic.name,
      stateText: `Yadigâr ${owned + 1}/${RELIC_KEYS.length}`,
      description: `${relic.description} Belediye Konağı'nda sergilenir.`,
      price: status.price,
      gold,
      status,
      label: 'Satın Al',
      onClick: () => events.emit('ui:buyRelic', { id, source }),
    });
  });
  const header = el('div', { className: 'upgrade-text', text: `Kasaba Hazinesi: ${gold} altın · Yadigârlar ${owned}/${RELIC_KEYS.length} (her yeni yadigâr bir öncekinden pahalıdır)` });
  return [header, ...goods, ...relics];
}

/** Belediye Konağı: sergilenen yadigârların rafı (sahip olunmayanlar soluk). */
export function relicShelf(state) {
  return el(
    'div',
    { className: 'relic-shelf' },
    RELIC_KEYS.map((id) => {
      const relic = RELICS[id];
      const owned = Boolean(state.luxury.relics[id]);
      const since = state.luxury.relics[id];
      return el('div', { className: `relic-slot${owned ? ' is-owned' : ' is-empty'}`, title: `${relic.name}\n${relic.description}${owned ? `\nGün ${since.day}'den beri sergileniyor` : '\nGezgin tüccardan ya da limandan altınla alınır'}` }, [
        el('img', { src: getAnyIconURL(relic.icon), alt: '' }),
        el('span', { text: owned ? relic.name : '?' }),
      ]);
    })
  );
}

/** Belediye Konağı: altın fermanlarının kartları. */
export function goldDecreeCards(state, events) {
  const gold = state.resources.gold ?? 0;
  return GOLD_DECREE_KEYS.map((id) => {
    const decree = GOLD_DECREES[id];
    const status = goldDecreeStatus(state, id);
    const active = (state.buffs[decree.buff] ?? 0) > state.totalMinutes;
    const hoursLeft = active ? Math.ceil((state.buffs[decree.buff] - state.totalMinutes) / 60) : 0;
    return card({
      icon: decree.icon,
      name: decree.name,
      stateText: active ? `Sürüyor · ${hoursLeft} sa` : `${decree.cooldownDays} günde bir`,
      description: decree.description,
      price: status.price,
      gold,
      status,
      label: 'Fermanı İlan Et',
      onClick: () => events.emit('ui:goldDecree', { id }),
    });
  });
}
