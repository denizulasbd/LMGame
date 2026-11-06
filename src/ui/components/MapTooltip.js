// (17. aşama) Harita ipucu: farenin altındaki karonun bilgisi (Toprak Yol · Yürünebilir, sakin, yapı, iş emri)
// eskiden HUD kutusundaydı; şimdi imlecin hemen altında küçük bir ipucu olarak belirir. Sahne her karo değişiminde
// 'map:hover' yayınlar (TownScene.updateHover); ipucunun yeri fare canvas üzerinde gezindikçe güncellenir. İmleç
// arayüzün üstündeyken, canvas dışındayken, sağ tıkla sürüklerken, bir araç (inşa / topla / yık) seçiliyken, pencere
// açıkken ya da fotoğraf modunda görünmez (araçların kendi ipucu dock'tadır).
import { JOBS } from '../../data/jobs.js';
import { aestheticLevel } from '../../systems/Landscape.js';
import { el } from '../dom.js';

const OFFSET_X = 16;
const OFFSET_Y = 20;
const SHOW_DELAY_MS = 180; // imleç bir karoda bu kadar durunca görünür (geçerken titreşmesin)

export class MapTooltip {
  constructor(game) {
    this.slot = 'free';
    this.info = null;
    this.key = '';
    this.tool = 'select';
    this.blocked = false; // pencere / fotoğraf modu
    this.mouse = { x: 0, y: 0, onCanvas: false, dragging: false };
    this.shownAt = 0;
    this.name = el('span', { className: 'map-tip-name' });
    this.dot = el('span', { className: 'status-dot' });
    this.status = el('span', { className: 'map-tip-status' });
    this.beauty = el('div', { className: 'map-tip-beauty', hidden: true }); // (18. aşama) çevre estetiği
    this.element = el('div', { className: 'map-tooltip', hidden: true }, [this.name, el('div', { className: 'map-tip-row' }, [this.dot, this.status]), this.beauty]);

    game.events.on('map:hover', (info) => {
      this.info = info;
      const key = info ? `${info.x},${info.y},${info.character?.id ?? ''},${info.building?.name ?? ''},${info.job ?? ''}` : '';
      if (key !== this.key) {
        this.key = key;
        this.shownAt = performance.now() + SHOW_DELAY_MS;
        this.element.hidden = true;
      }
      this.fill(info);
    });
    game.events.on('tool:changed', ({ tool }) => (this.tool = tool));
    game.events.on('ui:modalChanged', ({ id }) => (this.blocked = Boolean(id)));
    game.events.on('ui:setCinematic', (on) => (this.cinematic = on));
    const canvas = document.getElementById('game-canvas');
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.onCanvas = e.target === canvas;
      this.mouse.dragging = (e.buttons & 6) !== 0;
    });
    canvas?.addEventListener('mouseleave', () => (this.mouse.onCanvas = false));
  }

  fill(info) {
    if (!info) return;
    let name;
    let status;
    let tone = 'is-info';
    if (info.character) {
      name = info.character.name;
      status = info.character.visitor ? 'Gezgin tüccar · tıkla ve takas et' : 'Kasaba sakini · tıkla ve incele';
    } else if (info.building) {
      name = info.building.name;
      const job = info.job && info.job !== 'build' ? ` · Emir: ${JOBS[info.job].name}` : '';
      status = `${info.building.detail ?? 'Geçilemez'}${job}`;
    } else if (info.job) {
      name = info.objectName ?? info.tileName;
      status = `Emir verildi: ${JOBS[info.job].name}`;
    } else {
      const variant = info.variantName && info.variantName !== 'Sade' && !info.biomeHint ? ` (${info.variantName})` : '';
      name = `${info.tileName}${variant}${info.objectName ? ` · ${info.objectName}` : ''}`;
      status = 'Geçilemez';
      tone = 'is-bad';
      if (info.buildable) {
        status = 'İnşa Edilebilir';
        tone = 'is-ok';
      } else if (info.walkable) {
        status = 'Yürünebilir · İnşa Edilemez';
        tone = 'is-warn';
      }
      if (info.biomeHint) status = `${status} · ${info.biomeHint}`;
    }
    if (info.muddy) status = `${status} · Çamurlu (yağmur)`;
    // (18. aşama) Mahalle tabelası: ad küçük ahşap bir tabelada; güzel köşelerde çevre estetiği
    this.element.classList.toggle('is-sign', Boolean(info.building?.sign) && !info.character);
    const level = aestheticLevel(info.aesthetic ?? 0);
    const beauty = level ? `✿ Çevre estetiği: ${level}` : '';
    if (this.beauty.textContent !== beauty) this.beauty.textContent = beauty;
    this.beauty.hidden = !beauty;
    if (this.name.textContent !== name) this.name.textContent = name;
    if (this.status.textContent !== status) this.status.textContent = status;
    this.dot.className = `status-dot ${tone}`;
  }

  render() {
    const visible =
      Boolean(this.info) && this.mouse.onCanvas && !this.mouse.dragging && this.tool === 'select' && !this.blocked && !this.cinematic && performance.now() >= this.shownAt;
    if (this.element.hidden === visible) this.element.hidden = !visible;
    if (!visible) return;
    // İmlecin sağ altında; pencere kenarına taşarsa imlecin öbür yanına geçer
    const w = this.element.offsetWidth;
    const h = this.element.offsetHeight;
    let x = this.mouse.x + OFFSET_X;
    let y = this.mouse.y + OFFSET_Y;
    if (x + w > window.innerWidth - 8) x = this.mouse.x - w - 8;
    if (y + h > window.innerHeight - 8) y = this.mouse.y - h - 10;
    this.element.style.transform = `translate(${Math.round(Math.max(4, x))}px, ${Math.round(Math.max(4, y))}px)`;
  }
}
