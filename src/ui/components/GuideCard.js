// (30.1) Rehber kartı: araç çubuğunun üstünde, haritayı örtmeyen küçük bir kutu. Aynı anda en çok bir kart; en çok iki kısa cümle
// ve bir "Anladım" düğmesi. Hangi adımın görüneceğini systems/GuideSystem.js (sync) söyler; kart yalnızca çizer ve ilgili düğmeyi
// (araç çubuğu ya da panel düğmesi) hafifçe yanıp söndürür (CSS .guide-glow). Başlangıç ekranı, karar penceresi, fotoğraf modu ve
// açık pencere varken gizlenir. Durumu yalnızca GuideSystem değiştirir ('ui:guideDismiss').
import { el } from '../dom.js';

const GLOW_REFRESH_MS = 400;

/** "**kalın**" işaretli metni güvenli biçimde düğüm listesine çevirir. */
function richText(text) {
  const parts = text.split('**');
  return parts.map((part, i) => (i % 2 === 1 ? el('strong', { text: part }) : document.createTextNode(part)));
}

export class GuideCard {
  constructor(game) {
    this.slot = 'free';
    this.game = game;
    this.stepId = null;
    this.glowing = [];
    this.glowAt = 0;
    this.text = el('p', { className: 'guide-text' });
    this.ok = el('button', { className: 'hud-btn guide-ok', type: 'button', text: 'Anladım', tabIndex: -1 });
    this.ok.addEventListener('mousedown', (e) => e.preventDefault());
    this.ok.addEventListener('click', () => this.stepId && game.events.emit('ui:guideDismiss', { id: this.stepId }));
    this.element = el('div', { className: 'panel guide-card ui-interactive', hidden: true, role: 'status' }, [
      el('span', { className: 'guide-badge', text: 'İpucu' }),
      this.text,
      this.ok,
    ]);
  }

  render(game) {
    const system = game.scenes.current?.guideSystem;
    const step = system?.sync() ?? null;
    const root = this.element.parentElement;
    const suppressed = !step || game.state.dilemma?.active || root?.classList.contains('is-title') || root?.classList.contains('is-cinematic') || root?.classList.contains('has-modal');
    const id = suppressed ? null : step.id;
    if (id !== this.stepId) {
      this.stepId = id;
      this.element.hidden = !id;
      this.element.dataset.step = id ?? '';
      if (id) this.text.replaceChildren(...richText(step.text));
      this.glowAt = 0;
    }
    if (!id) {
      this.setGlow([]);
      return;
    }
    const now = performance.now();
    if (now < this.glowAt) return;
    this.glowAt = now + GLOW_REFRESH_MS;
    // Seçici virgüllü olabilir ("depodaki Kiler, yoksa İnşa Et düğmesi"): ilk uyan öğeler yanıp söner
    let found = [];
    if (step.target) {
      for (const sel of step.target.split(/,\s*(?=[.#\[])/)) {
        found = [...document.querySelectorAll(sel)];
        if (found.length) break;
      }
    }
    this.setGlow(found);
  }

  setGlow(nodes) {
    for (const node of this.glowing) if (!nodes.includes(node)) node.classList.remove('guide-glow');
    for (const node of nodes) node.classList.add('guide-glow');
    this.glowing = nodes;
  }
}
