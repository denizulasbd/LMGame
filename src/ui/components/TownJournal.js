// Kasaba Günlüğü: sol sütunda HUD'un altında açılıp kapanan olay kaydı. Önemli olayları ("Gün 2, 08:00 -
// Leyla kasabaya katıldı") saatleriyle, en yenisi üstte listeler. Kayıtları JournalSystem yazar
// (GameState.journal); burası yalnızca okur. Kapalıyken yeni olay sayısı düğmede görünür.
// J tuşu ya da düğme açar / kapatır.
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const pad = (n) => String(n).padStart(2, '0');
const VISIBLE_ENTRIES = 60;

export class TownJournal {
  constructor(game) {
    this.slot = 'left';
    this.open = false;
    this.unread = 0;
    this.lastKey = '';

    this.badge = el('span', { className: 'journal-badge', hidden: true });
    this.toggle = el('button', { className: 'hud-btn journal-toggle', type: 'button', title: 'Kasaba Günlüğü (J)', tabIndex: -1 }, [
      el('img', { className: 'tool-icon', src: getAnyIconURL('journal'), alt: '' }),
      el('span', { text: 'Günlük' }),
      el('kbd', { text: 'J' }),
      this.badge,
    ]);
    this.toggle.addEventListener('mousedown', (e) => e.preventDefault());
    this.toggle.addEventListener('click', () => this.setOpen(!this.open));

    const close = el('button', { className: 'hud-btn journal-close', type: 'button', text: '✕', title: 'Kapat (J)', tabIndex: -1 });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.setOpen(false));

    this.list = el('div', { className: 'journal-list' });
    this.panel = el('div', { className: 'panel journal-panel ui-interactive', hidden: true }, [
      el('div', { className: 'journal-header' }, [el('span', { text: 'Kasaba Günlüğü' }), close]),
      this.list,
    ]);
    this.element = el('div', { className: 'town-journal ui-interactive' }, [this.toggle, this.panel]);

    game.events.on('ui:toggleJournal', () => this.setOpen(!this.open));
    game.events.on('journal:added', () => {
      if (!this.open) {
        this.unread++;
        this.updateBadge();
      }
    });
  }

  setOpen(open) {
    this.open = open;
    this.panel.hidden = !open;
    this.toggle.classList.toggle('is-active', open);
    if (open) this.unread = 0;
    this.updateBadge();
    this.lastKey = '';
  }

  updateBadge() {
    this.badge.hidden = this.unread === 0;
    this.badge.textContent = String(Math.min(this.unread, 99));
  }

  render(game) {
    if (!this.open) return;
    const journal = game.state.journal;
    const last = journal[journal.length - 1];
    const key = `${journal.length}|${last ? last.text : ''}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const rows = journal
      .slice(-VISIBLE_ENTRIES)
      .reverse()
      .map((entry) =>
        el('div', { className: 'journal-entry' }, [
          el('span', { className: 'journal-time', text: `Gün ${entry.day}, ${pad(entry.hour)}:${pad(entry.minute)} -` }),
          ...(entry.icon ? [el('img', { className: 'journal-icon', src: getAnyIconURL(entry.icon), alt: '' })] : []),
          el('span', { className: 'journal-text', text: entry.text }),
        ])
      );
    this.list.replaceChildren(...(rows.length ? rows : [el('div', { className: 'journal-empty', text: 'Henüz kaydedilecek bir şey olmadı.' })]));
  }
}
