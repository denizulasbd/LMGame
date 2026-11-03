// Kasaba Hedefleri: sol sütunda HUD'un altında açılıp kapanan başarım listesi (G tuşu ya da düğme).
// Her hedef için simge, ad, açıklama ve ilerleme çubuğu; tamamlananlar tik ve tarihle görünür.
// Ölçüm src/systems/MilestoneSystem.js'te; burası yalnızca GameState'i okur.
import { MILESTONES } from '../../data/milestones.js';
import { milestoneProgress } from '../../systems/MilestoneSystem.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const pad = (n) => String(n).padStart(2, '0');
const REFRESH_MS = 600;

export class MilestonePanel {
  constructor(game) {
    this.slot = 'left';
    this.open = false;
    this.lastKey = '';
    this.refreshAt = 0;

    this.count = el('span', { className: 'goal-count' });
    this.toggle = el('button', { className: 'hud-btn journal-toggle goals-toggle', type: 'button', title: 'Kasaba Hedefleri (G)', tabIndex: -1 }, [
      el('img', { className: 'tool-icon', src: getAnyIconURL('star'), alt: '' }),
      el('span', { text: 'Hedefler' }),
      this.count,
      el('kbd', { text: 'G' }),
    ]);
    this.toggle.addEventListener('mousedown', (e) => e.preventDefault());
    this.toggle.addEventListener('click', () => this.setOpen(!this.open));

    const close = el('button', { className: 'hud-btn journal-close', type: 'button', text: '✕', title: 'Kapat (G)', tabIndex: -1 });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.setOpen(false));

    this.list = el('div', { className: 'journal-list goal-list' });
    this.panel = el('div', { className: 'panel journal-panel goals-panel ui-interactive', hidden: true }, [
      el('div', { className: 'journal-header' }, [el('span', { text: 'Kasaba Hedefleri' }), close]),
      this.list,
    ]);
    this.element = el('div', { className: 'town-journal ui-interactive' }, [this.toggle, this.panel]);

    game.events.on('ui:toggleGoals', () => this.setOpen(!this.open));
    game.events.on('milestone:completed', () => {
      this.lastKey = '';
      this.toggle.classList.add('is-celebrating');
      setTimeout(() => this.toggle.classList.remove('is-celebrating'), 2400);
    });
  }

  setOpen(open) {
    this.open = open;
    this.panel.hidden = !open;
    this.toggle.classList.toggle('is-active', open);
    this.lastKey = '';
  }

  render(game) {
    const state = game.state;
    const done = MILESTONES.filter((m) => state.milestones[m.id]).length;
    const countText = `${done}/${MILESTONES.length}`;
    if (this.count.textContent !== countText) this.count.textContent = countText;
    if (!this.open) return;

    const now = performance.now();
    if (now < this.refreshAt) return;
    this.refreshAt = now + REFRESH_MS;
    const rows = MILESTONES.map((m) => ({ m, progress: milestoneProgress(m, state), completed: state.milestones[m.id] }));
    const key = rows.map((r) => `${r.m.id}:${r.progress.current}:${r.progress.detail ?? ''}:${Boolean(r.completed)}`).join('|');
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.list.replaceChildren(...rows.map((r) => this.row(r)));
  }

  row({ m, progress, completed }) {
    const ratio = Math.min(1, progress.current / progress.target);
    const status = completed
      ? el('span', { className: 'goal-done', text: `✓ Gün ${completed.day}, ${pad(completed.hour)}:${pad(completed.minute)}` })
      : el('span', { className: 'need-bar goal-bar' }, [el('span', { className: 'need-fill goal-fill', style: `width: ${Math.round(ratio * 100)}%` })]);
    const detail = progress.detail ?? `${Math.min(progress.current, progress.target)}/${progress.target}`;
    return el('div', { className: `goal-row${completed ? ' is-done' : ''}` }, [
      el('img', { className: 'goal-icon', src: getAnyIconURL(m.icon), alt: '' }),
      el('div', { className: 'goal-text' }, [
        el('span', { className: 'goal-name', text: m.name }),
        el('span', { className: 'goal-description', text: m.description }),
        el('div', { className: 'goal-status' }, [status, ...(completed ? [] : [el('span', { className: 'goal-detail', text: detail })])]),
      ]),
    ]);
  }
}
