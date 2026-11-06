// (17. aşama) Ortalanmış pencereler: Kasaba Günlüğü, Kasaba Hedefleri, Kasaba Arşivi ve Ayarlar ekranın tam ortasında
// zarif bir çerçevede açılır. Aynı anda yalnızca biri açık olur (yenisi açılınca öteki kapanır). Pencerenin sağ üstündeki
// ✕, Esc tuşu ya da pencerenin dışına (haritanın üstündeki hafif karartmaya) tıklamak pencereyi kapatır.
//
// Bileşen kendini UIManager üzerinden kaydeder: { id, element, close }. Açıldığını / kapandığını opened(id) /
// closed(id) ile bildirir; ModalHost diğer pencereyi kapatır ve karartmayı gösterir / gizler. Esc yakalama aşamasında
// (capture) dinlenir: pencere açıksa Esc yalnızca pencereyi kapatır, oyuna (araç / seçim bırakma) geçmez. Metin
// kutusuna yazarken ya da karar penceresi açıkken Esc'e dokunulmaz.
import { el } from './dom.js';

const isTypingTarget = (target) =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

export class ModalHost {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.modals = new Map(); // id -> { element, close }
    this.current = null;
    this.backdrop = el('div', { className: 'modal-backdrop ui-interactive', hidden: true });
    this.layer = el('div', { className: 'modal-layer' });
    this.backdrop.addEventListener('mousedown', (e) => e.preventDefault());
    this.backdrop.addEventListener('click', () => this.closeCurrent());
    root.append(this.backdrop, this.layer);
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape' || !this.current || isTypingTarget(e.target)) return;
        if (game.state.dilemma?.active) return; // karar penceresi açıkken Esc pencereleri kapatmaz
        e.preventDefault();
        e.stopPropagation();
        this.closeCurrent();
      },
      true
    );
  }

  /** Bir pencereyi kaydeder: öğesi pencere katmanına taşınır. */
  register(id, element, close) {
    this.modals.set(id, { element, close });
    element.classList.add('modal-window');
    element.dataset.modal = id;
    this.layer.append(element);
  }

  /** Bileşen penceresini açtı: başka açık pencere varsa kapanır. */
  opened(id) {
    if (this.current && this.current !== id) {
      const previous = this.current;
      this.current = null;
      this.modals.get(previous)?.close();
    }
    this.current = id;
    this.backdrop.hidden = false;
    this.root.classList.add('has-modal');
    this.game.events.emit('ui:modalChanged', { id });
  }

  /** Bileşen penceresini kapattı. */
  closed(id) {
    if (this.current !== id) return;
    this.current = null;
    this.backdrop.hidden = true;
    this.root.classList.remove('has-modal');
    this.game.events.emit('ui:modalChanged', { id: null });
  }

  closeCurrent() {
    if (!this.current) return;
    this.modals.get(this.current)?.close();
  }
}
