// (30.3) Özel ipucu bileşeni: üst çubuğun çipleri, Halkın Nabzı, kaynak sayaçları, nüfus ibareleri ve vergi düğmeleri yerel
// `title` yerine bunu kullanır. Fare üstüne gelince 300 ms sonra açılır, öğenin altında (sığmazsa üstünde) ekrandan taşmadan durur
// ve DOM'da olduğu için ekran görüntüsünde görünür. Görünüşü araç çubuğunun ipucuyla (.dock-tip) aynıdır; sınıfı ayrıdır (.hover-tip).
//
// adoptTip(el): öğenin `title` özelliğini data-tip'e yönlendirir. Böylece `el.title = metin` yazan eski kod ve `el.title` okuyan
// eski testler değişmeden çalışır, ama tarayıcının kendi ipucu çıkmaz. İlk satır ipucunun başlığı olarak kalın yazılır.
// Tek örnek: HoverTip.instance (UIManager serbest katmana ekler). Durum yazmaz, oyunu etkilemez.
import { el } from '../dom.js';

export const TIP_DELAY_MS = 300;
const GAP = 8;

/** Öğenin `title` özelliğini özel ipucuna yönlendirir (data-tip). Öğeyi döndürür. */
export function adoptTip(node, text = null) {
  if (!node || node.dataset.htip === '1') {
    if (node && text !== null) node.title = text;
    return node;
  }
  const initial = text ?? node.getAttribute('title') ?? '';
  node.removeAttribute('title');
  node.dataset.htip = '1';
  Object.defineProperty(node, 'title', {
    configurable: true,
    get() {
      return this.dataset.tip ?? '';
    },
    set(v) {
      const t = v === null || v === undefined ? '' : String(v);
      if (this.dataset.tip === t) return;
      this.dataset.tip = t;
      HoverTip.instance?.refresh(this);
    },
  });
  node.title = initial;
  return node;
}

export class HoverTip {
  constructor() {
    HoverTip.instance = this;
    this.title = el('div', { className: 'hover-tip-title' });
    this.text = el('div', { className: 'hover-tip-text' });
    this.box = el('div', { className: 'hover-tip', hidden: true }, [this.title, this.text]);
    this.floating = [this.box]; // serbest katmanda (UIManager)
    this.target = null;
    this.timer = 0;
    document.addEventListener('mouseover', (e) => this.over(e.target));
    document.addEventListener('mousedown', () => this.hide());
    window.addEventListener('blur', () => this.hide());
  }

  over(node) {
    const t = node?.closest?.('[data-htip="1"]') ?? null;
    if (t === this.target) return;
    this.hide();
    if (!t) return;
    this.target = t;
    this.timer = setTimeout(() => this.show(t), TIP_DELAY_MS);
  }

  /** Hemen gösterir (testler ve klavye için de). */
  show(t) {
    clearTimeout(this.timer);
    this.target = t;
    const tip = t?.dataset.tip ?? '';
    if (!t || !tip || !t.isConnected) {
      this.box.hidden = true;
      return;
    }
    const [first, ...rest] = tip.split('\n');
    this.title.textContent = first;
    this.text.textContent = rest.join('\n');
    this.text.hidden = rest.length === 0;
    this.box.hidden = false;
    this.place(t);
  }

  /** İpucu açıkken öğenin metni değişirse yerinde tazelenir. */
  refresh(t) {
    if (t === this.target && !this.box.hidden) this.show(t);
  }

  place(t) {
    const r = t.getBoundingClientRect();
    const w = this.box.offsetWidth;
    const h = this.box.offsetHeight;
    const x = Math.min(Math.max(GAP, r.left + r.width / 2 - w / 2), window.innerWidth - w - GAP);
    let y = r.bottom + GAP;
    if (y + h > window.innerHeight - GAP) y = Math.max(GAP, r.top - h - GAP);
    this.box.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  hide() {
    clearTimeout(this.timer);
    this.target = null;
    this.box.hidden = true;
  }

  get visible() {
    return !this.box.hidden;
  }
}
