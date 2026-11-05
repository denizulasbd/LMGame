// Kasaba Günlüğü: önemli olayları ("Gün 2, 08:00 - Leyla kasabaya katıldı") saatleriyle, en yenisi üstte listeleyen
// olay kaydı. Kayıtları JournalSystem yazar (GameState.journal); burası yalnızca okur. (17. aşama) Ekranın ortasında
// açılan bir penceredir (ModalHost); dock'taki "Günlük" düğmesi ya da J tuşu açar / kapatır, ✕ / Esc / dışına
// tıklamak kapatır. Kapalıyken okunmamış olay sayısı dock düğmesinde görünür.
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { dockButton, modalHeader } from '../dockButton.js';

const pad = (n) => String(n).padStart(2, '0');
const VISIBLE_ENTRIES = 60;

export class TownJournal {
  constructor(game) {
    this.open = false;
    this.unread = 0;
    this.lastKey = '';
    this.modalHost = null; // UIManager bağlar

    this.badge = el('span', { className: 'dock-badge journal-badge', hidden: true });
    this.toggle = dockButton({ icon: 'journal', label: 'Günlük', key: 'J', tip: 'Kasaba Günlüğü: önemli olaylar saatleriyle', onClick: () => this.setOpen(!this.open), className: 'journal-toggle' });
    this.toggle.append(this.badge);
    this.dockButtons = [this.toggle];

    this.list = el('div', { className: 'journal-list' });
    this.panel = el('div', { className: 'panel journal-panel ui-interactive', hidden: true }, [
      modalHeader('Kasaba Günlüğü', () => this.setOpen(false), { icon: 'journal' }),
      this.list,
    ]);
    this.modal = { id: 'journal', element: this.panel };

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
    if (open) this.modalHost?.opened('journal');
    else this.modalHost?.closed('journal');
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
