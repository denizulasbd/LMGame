// Kasaba Hedefleri: başarım listesi. (17. aşama) Ekranın ortasında açılan bir penceredir (ModalHost); dock'taki
// "Hedefler" düğmesi ya da O (eski kısayol G de çalışır) açar / kapatır; ✕ / Esc / dışına tıklamak kapatır.
// Her hedef için simge, ad, açıklama ve ilerleme çubuğu; tamamlananlar tik ve tarihle görünür.
// 10. aşama: listenin başında "Kasaba Seviyesi" kartı: şimdiki unvan, sonraki seviyenin koşulları (nüfus,
// yapı, Seviye 2 yapı, ortalama refah) ilerleme çubuklarıyla ve seviyenin ödülleri.
// Ölçüm src/systems/MilestoneSystem.js ve TownStatus.js'te; burası yalnızca GameState'i okur.
import { MILESTONES } from '../../data/milestones.js';
import { TOWN_TIERS } from '../../data/town.js';
import { milestoneProgress } from '../../systems/MilestoneSystem.js';
import { townTier, nextTownTier, tierChecks, formatTownTitle } from '../../systems/TownStatus.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';
import { dockButton, modalHeader } from '../dockButton.js';

const pad = (n) => String(n).padStart(2, '0');
const REFRESH_MS = 600;

export class MilestonePanel {
  constructor(game) {
    this.open = false;
    this.lastKey = '';
    this.refreshAt = 0;
    this.modalHost = null; // UIManager bağlar

    this.count = el('span', { className: 'dock-badge goal-count' });
    this.toggle = dockButton({ icon: 'star', label: 'Hedefler', key: 'O', tip: 'Kasaba Hedefleri ve kasaba seviyesi', onClick: () => this.setOpen(!this.open), className: 'goals-toggle' });
    this.toggle.append(this.count);
    this.dockButtons = [this.toggle];

    this.list = el('div', { className: 'journal-list goal-list' });
    this.panel = el('div', { className: 'panel journal-panel goals-panel ui-interactive', hidden: true }, [
      modalHeader('Kasaba Hedefleri', () => this.setOpen(false), { icon: 'star' }),
      this.list,
    ]);
    this.modal = { id: 'goals', element: this.panel };

    game.events.on('ui:toggleGoals', () => this.setOpen(!this.open));
    game.events.on('town:tierUp', () => {
      this.lastKey = '';
      this.toggle.classList.add('is-celebrating');
      setTimeout(() => this.toggle.classList.remove('is-celebrating'), 2400);
    });
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
    this.refreshAt = 0;
    if (open) this.modalHost?.opened('goals');
    else this.modalHost?.closed('goals');
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
    const tier = townTier(state);
    const next = nextTownTier(state);
    const checks = next ? tierChecks(state, next) : [];
    const tierKey = `${state.townName}:${tier.tier}:${checks.map((c) => c.current).join(',')}`;
    const key = `${tierKey}|${rows.map((r) => `${r.m.id}:${r.progress.current}:${r.progress.detail ?? ''}:${Boolean(r.completed)}`).join('|')}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.list.replaceChildren(this.tierCard(state, tier, next, checks), ...rows.map((r) => this.row(r)));
  }

  /** Kasaba seviyesi kartı: unvan, seviye armaları, sonraki seviyenin koşulları ve ödülleri. */
  tierCard(state, tier, next, checks) {
    const reached = state.town?.reached?.[tier.tier];
    const pips = TOWN_TIERS.map((t) =>
      el('span', { className: `tier-step${t.tier <= tier.tier ? ' is-on' : ''}`, title: t.name }, [el('img', { src: getAnyIconURL(t.icon), alt: '' })])
    );
    const children = [
      el('div', { className: 'tier-head' }, [
        el('img', { className: 'goal-icon', src: getAnyIconURL(tier.icon), alt: '' }),
        el('div', { className: 'goal-text' }, [
          el('span', { className: 'goal-name', text: formatTownTitle(state.townName, tier) }),
          el('span', { className: 'goal-description', text: `Kasaba seviyesi ${tier.tier}/${TOWN_TIERS.length}: ${tier.name}${reached && tier.tier > 1 ? ` · Gün ${reached.day}'den beri` : ''}` }),
        ]),
      ]),
      el('div', { className: 'tier-steps' }, pips),
    ];
    if (next) {
      children.push(el('div', { className: 'building-section-title', text: `Sonraki seviye: ${next.name}` }));
      for (const c of checks) {
        const ratio = Math.min(1, c.current / c.target);
        children.push(
          el('div', { className: `tier-check${c.ok ? ' is-ok' : ''}` }, [
            el('img', { src: getAnyIconURL(c.icon), alt: '' }),
            el('span', { className: 'tier-check-name', text: c.text }),
            el('span', { className: 'need-bar goal-bar' }, [el('span', { className: 'need-fill goal-fill', style: `width: ${Math.round(ratio * 100)}%` })]),
          ])
        );
      }
      children.push(el('div', { className: 'goal-description tier-perks', text: `Ödüller: ${next.perks.join(' · ')}` }));
    } else {
      children.push(el('div', { className: 'goal-description tier-perks', text: 'En yüksek seviyeye ulaştın: kasaban artık gelişmiş bir şehir!' }));
    }
    return el('div', { className: 'goal-row tier-card' }, [el('div', { className: 'tier-body' }, children)]);
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
