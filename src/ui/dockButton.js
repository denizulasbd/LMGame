// (17. aşama) Alt dock'un düğmesi: piksel simge, kısa etiket ve köşede kısayol tuşu. Üzerine gelince düğmenin
// hemen üstünde kısayolu ve açıklamayı söyleyen küçük bir ipucu belirir (BuildMenu'nün .dock-tip öğesi; metni
// data-tip-title / data-tip'ten okur ve ekrana sığacak biçimde konumlar). Düğmeler odak almaz (Boşluk tuşu odaklı
// düğmeye tıklamasın) ve fare basışı odağı metin kutularından çalmaz.
import { el } from './dom.js';
import { getAnyIconURL } from '../art/ui/index.js';

/**
 * @param {{ icon: string, label: string, key?: string, tip?: string, onClick: () => void, className?: string }} spec
 */
export function dockButton({ icon, label, key = null, tip = '', onClick, className = '' }) {
  const children = [el('img', { className: 'dock-icon', src: getAnyIconURL(icon), alt: '' }), el('span', { className: 'dock-label', text: label })];
  if (key) children.push(el('kbd', { className: 'dock-key', text: key }));
  const b = el('button', { className: `dock-btn ${className}`.trim(), type: 'button', tabIndex: -1 }, children);
  b.dataset.tipTitle = `${label}${key ? ` · ${key}` : ''}`;
  b.dataset.tip = tip;
  b.setAttribute('aria-label', `${label}${key ? ` (${key})` : ''}`);
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', onClick);
  return b;
}

/** Pencerenin başlık satırı: başlık ve sağ üstte net bir kapatma (✕) düğmesi. */
export function modalHeader(title, onClose, { icon = null, extra = [] } = {}) {
  const close = el('button', { className: 'hud-btn modal-close', type: 'button', text: '✕', title: 'Kapat (Esc)', tabIndex: -1 });
  close.setAttribute('aria-label', 'Kapat');
  close.addEventListener('mousedown', (e) => e.preventDefault());
  close.addEventListener('click', onClose);
  const titleNode = el('span', { className: 'modal-title' }, [...(icon ? [el('img', { className: 'modal-title-icon', src: getAnyIconURL(icon), alt: '' })] : []), title]);
  return el('div', { className: 'modal-header' }, [titleNode, ...extra, close]);
}
