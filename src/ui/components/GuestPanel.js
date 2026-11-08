// (27.3) Gezgin konuk kartı: haritada Seyyar Ozan'a, Nadir Takasçı'ya ya da Yaşlı Seyyah'a tıklayınca sağ altta (sakin kartının yerinde)
// açılır. Kim olduğu (portre, ad, tür), ne kadar süredir kasabada olduğu ve ne zaman ayrılacağı, şu an ne yaptığı; türüne göre: ozanın
// akşam çalma saatleri ve Ozan Ezgisi, masalcının masal saatleri ve Kasaba Bilgeliği, takasçının takas özeti (bu kalışta kaç takas, son
// takasta ne verip ne aldığı ve şu anki teklifler: bedel -> karşılık, rezervin üstünde stok var mı). Yalnızca okur; ✕ ya da Esc kapatır
// ('ui:selectGuest' false). Konuk ayrılınca kart kendiliğinden kapanır.
import { getCharacterSprite, CHARACTER_WIDTH, CHARACTER_HEIGHT, characterHeight } from '../../art/sprites/index.js';
import { GUEST, GUEST_TYPES, BARTER_OFFERS, BARTER_KEYS } from '../../data/guest.js';
import { RESOURCES } from '../../data/resources.js';
import { TOWN_BUFFS } from '../../data/town.js';
import { affordableOffers } from '../../systems/Guest.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const PORTRAIT_SCALE = 4;

/** Konuğun kasabada geçirdiği süre (saat): 09:00'da gelir. */
export function guestHoursHere(state, g) {
  return Math.max(0, (state.time.day - g.arrivalDay) * 24 + state.time.hour - GUEST.arrivalHour);
}

/** Bedel metni: "Kumaş 5 · Fıçı Şerbeti 3". */
export function costText(cost) {
  return Object.entries(cost)
    .map(([r, q]) => `${RESOURCES[r]?.name ?? r} ${q}`)
    .join(' · ');
}

/** Kartın satırları (saf; test ve arayüz aynı metni kullanır). */
export function guestSummary(state, character, lastBarter = null) {
  const g = state.activeGuest;
  if (!g) return null;
  const def = GUEST_TYPES[g.type];
  const hours = guestHoursHere(state, g);
  const rows = [
    ['Konuk', def.name],
    ['Kasabada', hours < 1 ? 'yeni geldi' : `${hours} saattir (G${g.arrivalDay} 09:00'dan beri)`],
    ['Ayrılış', g.leaving ? 'şu an kasabadan ayrılıyor' : `G${g.departureDay} 09:00`],
    ['Şu an', g.resting ? 'handa dinleniyor' : character?.activityLabel ?? def.name],
  ];
  if (g.type === 'bard') {
    const buff = TOWN_BUFFS[def.buff];
    rows.push(['Akşamları', `${def.playFrom}:00 - ${def.playTo}:00 meydanda lir çalar (${buff.name}: yakındaki dinleyenlerin keyfi hızla dolar)`]);
  } else if (g.type === 'storyteller') {
    rows.push(['Masal saati', `${def.tellFrom}:00 - ${def.tellTo}:00 çardakta (dinleyen çocuk ve gençlere Bilgelik deneyimi)`]);
    rows.push(['Kasaba Bilgeliği', `${Math.floor(state.guestBook?.wisdom ?? 0)} puan`]);
  }
  const barter = g.type === 'collector' ? barterSummary(state, g, def, lastBarter) : null;
  return { name: g.name, type: g.type, def, rows, barter };
}

/** Nadir Takasçı'nın takas özeti: bu kalıştaki takaslar, son takas ve şu anki teklifler. */
export function barterSummary(state, g, def, lastBarter = null) {
  const open = new Set(affordableOffers(state, def.reserve));
  const offers = BARTER_KEYS.map((key) => {
    const o = BARTER_OFFERS[key];
    return { key, name: o.name, icon: o.icon, give: costText(o.cost), get: o.text, ok: open.has(key) };
  });
  const reserve = costText(def.reserve);
  const last = lastBarter ? { name: BARTER_OFFERS[lastBarter]?.name ?? lastBarter, give: costText(BARTER_OFFERS[lastBarter]?.cost ?? {}), get: BARTER_OFFERS[lastBarter]?.text ?? '' } : null;
  return { done: g.barters, max: def.maxBarters, hour: def.barterHour, today: g.lastBarterDay === state.time.day, offers, reserve, last };
}

export class GuestPanel {
  constructor(game) {
    this.slot = 'cards';
    this.events = game.events;
    this.open = false;
    this.lastBarter = null; // son takasın türü (bu oturumda görülen 'guest:barter')
    this.lastKey = null;
    this.build();
    game.events.on('guest:selected', (on) => {
      this.open = Boolean(on);
      this.element.hidden = !this.open;
      this.lastKey = null;
    });
    game.events.on('guest:arrived', () => {
      this.lastBarter = null;
    });
    game.events.on('guest:barter', ({ key }) => {
      this.lastBarter = key;
      this.lastKey = null;
    });
  }

  build() {
    this.portrait = el('canvas', { className: 'character-portrait', width: CHARACTER_WIDTH * PORTRAIT_SCALE, height: CHARACTER_HEIGHT * PORTRAIT_SCALE });
    this.portraitCtx = this.portrait.getContext('2d');
    this.name = el('h2', { className: 'character-name' });
    this.kind = el('div', { className: 'life-stage-row guest-kind' });
    this.body = el('div', { className: 'guest-body' });
    const close = el('button', { className: 'hud-btn character-close', type: 'button', text: '✕', title: 'Kapat (Esc)', tabIndex: -1 });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.events.emit('ui:selectGuest', false));
    this.element = el('div', { className: 'panel character-panel guest-panel ui-interactive', hidden: true }, [
      close,
      el('div', { className: 'character-header' }, [
        el('div', { className: 'character-portrait-frame' }, [this.portrait]),
        el('div', { className: 'character-identity' }, [this.name, this.kind, el('div', { className: 'character-meta', text: 'Gezgin konuk · kasabanın misafiri (nüfusa sayılmaz)' })]),
      ]),
      this.body,
    ]);
  }

  render(game) {
    if (!this.open) return;
    const state = game.state;
    const character = game.scenes?.current?.world?.guests?.[0] ?? null;
    const info = guestSummary(state, character, this.lastBarter);
    if (!info || !character) {
      this.element.hidden = true;
      return;
    }
    const key = JSON.stringify([info.name, info.rows, info.barter, character.look?.coat]);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.renderPortrait(character);
    this.name.textContent = info.name;
    this.kind.replaceChildren(el('span', { className: 'life-stage-badge guest-badge' }, [el('img', { src: getAnyIconURL(info.def.icon), alt: '' }), info.def.name]));
    const row = (label, value) => el('div', { className: 'social-row' }, [el('span', { className: 'social-label', text: label }), el('span', { className: 'social-value', text: value })]);
    const section = (title, children) => el('div', { className: 'relations' }, [el('div', { className: 'relations-title', text: title }), el('div', { className: 'social-life' }, children)]);
    const parts = [section('Misafirlik', info.rows.map(([l, v]) => row(l, v)))];
    const b = info.barter;
    if (b) {
      const rows = [
        row('Bu kalışta', `${b.done}/${b.max} takas · her gün ${b.hour}:00'de${b.today ? ' (bugünkü yapıldı)' : ''}`),
        row('Son takas', b.last ? `${b.last.give} verildi -> ${b.last.name} alındı` : b.done > 0 ? `${b.done} takas yapıldı` : 'henüz yok'),
        row('Rezerv', `${b.reserve} kasabada kalır (sofraya yetsin)`),
      ];
      const offers = b.offers.map((o) =>
        el('div', { className: `guest-offer${o.ok ? ' is-ok' : ''}`, title: o.ok ? 'Öğlen takasında bu teklif seçilebilir' : 'Rezervin üstünde yeterli lüks mal yok' }, [
          el('img', { src: getAnyIconURL(o.icon), alt: '' }),
          el('span', { className: 'guest-offer-name', text: o.name }),
          el('span', { className: 'guest-offer-deal', text: `${o.give} -> ${o.get}` }),
          el('span', { className: 'guest-offer-state', text: o.ok ? 'Uygun' : 'Stok yetmez' }),
        ])
      );
      parts.push(section('Nadir Takas', [...rows, ...offers]));
    }
    this.body.replaceChildren(...parts);
  }

  renderPortrait(character) {
    const ctx = this.portraitCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.portrait.width, this.portrait.height);
    const height = characterHeight(character.look) * PORTRAIT_SCALE;
    ctx.drawImage(getCharacterSprite(character.appearance, 'down', 'idle0', character.look), 0, this.portrait.height - height, this.portrait.width, height);
  }
}
