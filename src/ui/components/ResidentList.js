// Sağ üstteki "Kasaba Sakinleri" listesi: herkesin portresi (çocuk, paltolu, çantalı), adı ve şu an
// ne yaptığı. Bir satıra tıklamak o karakteri seçer (karakter paneli açılır, kamera ona kayar).
import { getCharacterPortraitURL, lookKey } from '../../art/sprites/index.js';
import { NEED_KEYS } from '../../data/characters.js';
import { el } from '../dom.js';

/** İhtiyaçların en düşüğüne göre ruh hâli: iyi / idare eder / kötü. */
function moodClass(character) {
  const lowest = Math.min(...NEED_KEYS.map((k) => character.needs[k]));
  if (lowest < 25) return 'is-bad';
  if (lowest < 50) return 'is-warn';
  return 'is-ok';
}

export class ResidentList {
  constructor(game) {
    this.slot = 'right';
    this.collapsed = false;
    this.selectedId = null;
    this.rows = new Map(); // karakter kimliği -> { row, status, mood }
    this.rosterKey = '';

    this.title = el('span', { className: 'resident-title' });
    this.toggle = el('button', { className: 'hud-btn resident-toggle', type: 'button', text: '▾', title: 'Listeyi daralt', tabIndex: -1 });
    this.toggle.addEventListener('mousedown', (e) => e.preventDefault());
    this.toggle.addEventListener('click', () => this.setCollapsed(!this.collapsed));
    this.list = el('div', { className: 'resident-list' });

    this.element = el('div', { className: 'panel residents ui-interactive' }, [
      el('div', { className: 'resident-header' }, [this.title, this.toggle]),
      this.list,
    ]);

    this.events = game.events;
    game.events.on('character:selected', (id) => {
      this.selectedId = id;
      for (const [rowId, { row }] of this.rows) row.classList.toggle('is-selected', rowId === id);
    });
  }

  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.list.hidden = collapsed;
    this.toggle.textContent = collapsed ? '▸' : '▾';
    this.toggle.title = collapsed ? 'Listeyi aç' : 'Listeyi daralt';
  }

  rebuild(characters) {
    this.list.replaceChildren();
    this.rows.clear();
    for (const c of characters) {
      const status = el('span', { className: 'resident-status' });
      const mood = el('span', { className: 'status-dot resident-mood' });
      const row = el('button', { className: 'resident-row', type: 'button', tabIndex: -1 }, [
        el('img', { className: `resident-portrait${c.isChild ? ' is-child' : ''}`, src: getCharacterPortraitURL(c.appearance, c.look), alt: '' }),
        el('span', { className: 'resident-text' }, [el('span', { className: 'resident-name', text: c.name }), status]),
        mood,
      ]);
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => this.events.emit('ui:selectCharacter', c.id));
      row.classList.toggle('is-selected', c.id === this.selectedId);
      this.list.append(row);
      this.rows.set(c.id, { row, status, mood, lastStatus: '', lastMood: '' });
    }
  }

  render(game) {
    const characters = game.state.characters;
    const rosterKey = characters.map((c) => `${c.id}:${lookKey(c.look)}`).join(',');
    if (rosterKey !== this.rosterKey) {
      this.rosterKey = rosterKey;
      this.title.textContent = `Kasaba Sakinleri (${characters.length})`;
      this.rebuild(characters);
    }
    if (this.collapsed) return;

    for (const c of characters) {
      const entry = this.rows.get(c.id);
      if (entry.lastStatus !== c.activityLabel) {
        entry.lastStatus = c.activityLabel;
        entry.status.textContent = c.activityLabel;
      }
      const mood = moodClass(c);
      if (entry.lastMood !== mood) {
        entry.lastMood = mood;
        entry.mood.className = `status-dot resident-mood ${mood}`;
      }
    }
  }
}
