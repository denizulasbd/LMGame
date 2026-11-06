// (23. aşama) Haydut Baskını penceresi: üst çubuktaki "Haydut izleri" çipine (ya da Gözcü Kulesi paneline) tıklayınca ortada
// açılır ve üç çözüm yolunu sunar (bekçilerle püskürt, haraç öde, hazırlıksız yakalan). Oyun durmaz; karar verilince ya da
// baskın çözülünce kapanır. Pencere yalnızca durumu okur; kararı 'ui:raidChoice' olarak yayınlar.
import { el } from '../dom.js';
import { modalHeader } from '../dockButton.js';
import { raidCard } from './crisisCards.js';

export class CrisisModal {
  constructor(game) {
    this.slot = 'free';
    this.game = game;
    this.open = false;
    this.modalHost = null; // UIManager bağlar
    this.lastKey = '';
    this.body = el('div', { className: 'crisis-body' });
    this.window = el('div', { className: 'panel crisis-panel ui-interactive', hidden: true }, [modalHeader('Haydut Baskını', () => this.setOpen(false), { icon: 'bandit' }), this.body]);
    this.modal = { id: 'crisis', element: this.window };
    game.events.on('ui:openRaid', () => this.setOpen(true));
    game.events.on('crisis:raidResolved', () => this.setOpen(false));
  }

  setOpen(open) {
    const raid = this.game.state.crisis?.raid;
    if (open && !raid) return;
    this.open = open;
    this.window.hidden = !open;
    this.lastKey = '';
    if (open) this.modalHost?.opened('crisis');
    else this.modalHost?.closed('crisis');
  }

  render(game) {
    if (!this.open) return;
    const state = game.state;
    if (!state.crisis?.raid) {
      this.setOpen(false);
      return;
    }
    const key = JSON.stringify([state.crisis.raid, Math.floor(state.totalMinutes / 60), state.resources.gold, state.resources.food, state.equipment?.sturdyTool, state.buildings.filter((b) => b.type === 'guardTower').map((b) => [b.functional, b.damaged, b.workerIds.size]), state.characters.filter((c) => c.isInjured).length]);
    if (key === this.lastKey) return;
    this.lastKey = key;
    const card = raidCard(state, (name, payload) => game.events.emit(name, payload));
    this.body.replaceChildren(card);
  }
}
