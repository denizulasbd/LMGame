// (26.3) Gezgin konukların görünümü (kural yok, yalnızca çizim): türüne has aksesuar (ozan: tüylü şapka ve lir; takasçı: geniş kenarlı şapka ve
// sırtında nadide halılı çanta; masalcı: kapüşonlu pelerin ve kitap) ve ozan çalarken havaya yükselip sallanarak kaybolan müzik notaları.
// Aksesuar yalnızca renderer.fillRect, notalar renderer.drawImage kullanır (tools/art-preview.html bir tuvale aynı arayüzle çizdirir).
import { getNoteSprite } from '../art/ui/index.js';

const OUTLINE = '#1b1423';
const NOTE_COLORS = ['P', 'p', 'i', 'a', 'O'];

export class GuestEffects {
  constructor() {
    // (27.3) Kuyruğa her karede yeni kapanış yerine bu sabit çizim işlevi (renderer, guest, type, time) verilir
    this.drawQueued = (renderer, guest, type, time) => this.drawAccessory(renderer, guest.x, guest.y, guest.spriteHeight, guest.facing, type, time, guest.playing);
  }

  /**
   * Çizim kuyruğuna aksesuarı ekler (karakterin derinliğiyle sıralanır).
   * @param {{ addCall: Function }} queue
   * @param {import('../entities/Character.js').Character} guest
   * @param {string} type 'bard' | 'collector' | 'storyteller'
   */
  queue(queue, guest, type, time) {
    if (!guest.visible) return;
    queue.addCall(guest.sortY + 0.03, this.drawQueued, guest, type, time);
  }

  /** Karakterin ayak noktası (x, y) ve boyuna göre aksesuar. */
  drawAccessory(renderer, x, y, h, facing, type, time = 0, playing = false) {
    x = Math.round(x);
    y = Math.round(y);
    const top = y - h + 1; // başın tepesi
    const side = facing === 'left' ? -1 : 1;
    if (type === 'bard') {
      // Yeşil kep, kırmızı tüy; elde lir (çalarken hafifçe sallanır)
      renderer.fillRect(x - 4, top - 1, 8, 2, '#2f6f5e');
      renderer.fillRect(x - 3, top - 3, 5, 2, '#2f6f5e');
      renderer.fillRect(x + 2 * side, top - 5, 1, 3, '#e8463c');
      renderer.fillRect(x + 3 * side, top - 6, 1, 2, '#ffd23f');
      const sway = playing ? Math.round(Math.sin(time * 8)) : 0;
      const lx = x + 5 * side - (side < 0 ? 3 : 0);
      const ly = y - 9 + sway;
      renderer.fillRect(lx, ly, 4, 5, OUTLINE);
      renderer.fillRect(lx + 1, ly + 1, 2, 3, '#c98a4a');
      renderer.fillRect(lx + 1, ly + 2, 2, 1, '#6b4a2a'); // ses deliği
      renderer.fillRect(lx + (side < 0 ? 0 : 3), ly - 4, 1, 4, '#6b4a2a'); // sap
    } else if (type === 'collector') {
      // Geniş kenarlı şapka, omzunda kırmızı atkı; arkada halı rulosu
      renderer.fillRect(x - 6, top, 12, 1, '#7a4a21');
      renderer.fillRect(x - 3, top - 2, 6, 2, '#8a5524');
      renderer.fillRect(x - 3, top - 1, 6, 1, '#e8463c');
      renderer.fillRect(x - 5, y - h + 7, 10, 2, '#e8463c');
      const rx = side < 0 ? x + 5 : x - 8; // halı rulosu: omzunda, arka yanda
      renderer.fillRect(rx, y - h + 6, 3, 9, '#a04a3a');
      renderer.fillRect(rx, y - h + 7, 3, 1, '#ffd23f');
    } else {
      // Kapüşonlu mor pelerin, elinde kitap
      renderer.fillRect(x - 5, top, 10, 3, '#5a4a8a');
      renderer.fillRect(x - 6, top + 3, 12, 4, '#5a4a8a');
      renderer.fillRect(x - 6, top + 7, 2, 7, '#4a3a78');
      renderer.fillRect(x + 4, top + 7, 2, 7, '#4a3a78');
      renderer.fillRect(x - 2, top + 2, 4, 3, '#e8c9a0'); // yüz
      const bx = x + 5 * side - (side < 0 ? 4 : 0);
      renderer.fillRect(bx, y - 8, 4, 5, OUTLINE);
      renderer.fillRect(bx + 1, y - 7, 2, 3, '#e8463c');
      renderer.fillRect(bx + 1, y - 6, 2, 1, '#ffd23f');
    }
  }

  /** Ozan çalarken: havaya yükselen müzik notaları (dünya katmanı). */
  drawNotes(renderer, guest, time) {
    if (!guest.visible || !guest.playing) return;
    for (let i = 0; i < 6; i++) {
      const phase = (time * 0.45 + i / 6) % 1;
      if (phase > 0.88 && Math.floor(time * 8) % 2 === 0) continue;
      const x = Math.round(guest.x + 6 + Math.sin(phase * 7 + i) * 5 + i * 2 - 5);
      const y = Math.round(guest.y - 14 - phase * 34);
      renderer.drawImage(getNoteSprite(NOTE_COLORS[i % NOTE_COLORS.length]), x, y);
    }
  }
}
