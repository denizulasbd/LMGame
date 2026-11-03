// İkilem / karar penceresi (11. aşama): bir sürpriz olay gelince ('dilemma:opened') ekranın ortasında açılır.
// Başlık, simge, atmosferik metin ve 2-3 seçenek (maliyet çipleri, etkisi; koşulu tutmayan seçenek soluk ve
// nedeni yazılı). Oyun duraklatılmıştır; alttaki çubuk 30 saniyelik süreyi gösterir: süre dolunca varsayılan
// güvenli seçenek uygulanır. Seçim 'ui:chooseDilemma' { optionId } olarak yayınlanır; kurallar DilemmaSystem'de.
// Pencere yalnızca GameState'i okur: seçeneklerin uygunluğu, başlık ve varsayılan seçenek DilemmaSystem'in
// state.dilemma.active'e yazdığı alanlardan gelir (options: [{ id, ok, reason }], defaultId, title).
import { DILEMMAS, DILEMMA_SCHEDULE } from '../../data/dilemmas.js';
import { RESOURCES } from '../../data/resources.js';
import { getAnyIconURL, getIconDataURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

export class DilemmaModal {
  constructor(game) {
    this.slot = 'free';
    this.game = game;
    this.events = game.events;
    this.lastKey = '';

    this.icon = el('img', { className: 'dilemma-icon', alt: '' });
    this.title = el('h2', { className: 'dilemma-title' });
    this.text = el('p', { className: 'dilemma-text' });
    this.options = el('div', { className: 'dilemma-options' });
    this.timerFill = el('span', { className: 'dilemma-timer-fill' });
    this.timerText = el('span', { className: 'dilemma-timer-text' });
    this.element = el('div', { className: 'dilemma ui-interactive', hidden: true }, [
      el('div', { className: 'panel dilemma-panel' }, [
        el('div', { className: 'dilemma-head' }, [el('div', { className: 'dilemma-icon-frame' }, [this.icon]), this.title]),
        this.text,
        this.options,
        el('div', { className: 'dilemma-timer' }, [el('span', { className: 'dilemma-timer-bar' }, [this.timerFill]), this.timerText]),
      ]),
    ]);
  }

  render(game) {
    const active = game.state.dilemma?.active;
    this.element.hidden = !active;
    if (!active) {
      this.lastKey = '';
      return;
    }
    const def = DILEMMAS[active.id];
    const resources = game.state.resources;
    const statuses = def.options.map((o) => active.options?.find((x) => x.id === o.id) ?? { ok: true, reason: null });
    const key = `${active.id}|${statuses.map((s) => s.ok).join(',')}|${Object.values(resources).join(',')}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.icon.src = getAnyIconURL(def.icon);
      this.title.textContent = active.title ?? def.title;
      this.text.textContent = def.text;
      this.options.replaceChildren(...def.options.map((option, i) => this.optionButton(option, statuses[i], resources)));
    }
    const left = Math.max(0, active.remaining);
    this.timerFill.style.width = `${(left / DILEMMA_SCHEDULE.timeoutSeconds) * 100}%`;
    const fallback = def.options.find((o) => o.id === active.defaultId);
    this.timerText.textContent = `Oyun duraklatıldı · ${Math.ceil(left)} sn içinde seçilmezse: ${fallback?.label ?? '—'}`;
  }

  optionButton(option, status, resources) {
    const costs = Object.entries(option.cost ?? {}).map(([r, v]) =>
      el('span', { className: `build-cost${(resources[r] ?? 0) < v ? ' is-missing' : ''}` }, [
        el('img', { src: getIconDataURL(RESOURCES[r].icon), alt: RESOURCES[r].name }),
        String(v),
      ])
    );
    const button = el('button', { className: `dilemma-option${option.default ? ' is-default' : ''}`, type: 'button', tabIndex: -1 }, [
      el('span', { className: 'dilemma-option-label', text: option.label }),
      el('span', { className: 'dilemma-option-detail', text: status.ok ? option.detail : `${option.detail} · ${status.reason}` }),
      el('span', { className: 'build-costs' }, costs.length ? costs : [el('span', { className: 'build-cost', text: 'Bedelsiz' })]),
    ]);
    button.disabled = !status.ok;
    button.addEventListener('mousedown', (e) => e.preventDefault());
    button.addEventListener('click', () => this.events.emit('ui:chooseDilemma', { optionId: option.id }));
    return button;
  }
}
