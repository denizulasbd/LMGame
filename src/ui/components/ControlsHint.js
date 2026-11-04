// Sol sütunun dibindeki kontrol ipuçları; ayrıca yakınlaştırma seviyesi ve harita tohumunu gösterir.
import { el } from '../dom.js';

const CONTROLS = [
  [['Sol tık'], 'sakini / yapıyı seç'],
  [['B', 'H', 'X'], 'inşa · topla · yık'],
  [['Esc'], 'araç / seçimi bırak'],
  [['J', 'G', 'I'], 'günlük · hedefler · arşiv'],
  [['F'], 'fotoğraf modu'],
  [['W', 'A', 'S', 'D'], 'kamera'],
  [['Sağ tık'], 'sürükle'],
  [['Tekerlek'], 'yakınlaştır'],
  [['Boşluk'], 'duraklat'],
  [['1', '2', '3'], 'hız'],
];

export class ControlsHint {
  constructor(game) {
    this.slot = 'left';
    this.zoom = null;
    this.lastMeta = '';
    this.meta = el('div', { className: 'hint-meta' });

    const lines = CONTROLS.map(([keys, label]) =>
      el('div', {}, [...keys.flatMap((k) => [el('kbd', { text: k }), ' ']), label])
    );
    this.element = el('div', { className: 'panel controls-hint' }, [...lines, this.meta]);

    game.events.on('camera:zoom', (zoom) => (this.zoom = zoom));
  }

  render(game) {
    const meta = `Yakınlık ${this.zoom ?? '-'}x · Tohum ${game.state.seed}`;
    if (meta !== this.lastMeta) {
      this.lastMeta = meta;
      this.meta.textContent = meta;
    }
  }
}
