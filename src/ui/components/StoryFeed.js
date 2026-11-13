// (30.2) Hikâye kartları ve Duygu Katmanı açıklama kutusu: ekranın sol altındaki sütun (UIManager 'left' yuvası: yukarıdan aşağı
// açıklama kutusu, hikâye kartları, rehber kartı; sütun dock'un hemen üstünde biter, haritayı ve araç çubuğunu örtmez).
// Çizim SALT OKUNURDUR: kartların durumu systems/StoryDirector.js'te; burası her karede gerçek zamanı (performance.now) yöneticiye
// iletir, yalnızca değişen kartın DOM'unu günceller. Düğmeler yalnızca olay yayınlar ('ui:storyGo', 'ui:storyAction', 'ui:storyDismiss').
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { getCharacterPortraitURL } from '../../art/sprites/index.js';
import { actionStatus } from '../../systems/StoryCards.js';
import { STORY_TEXT } from '../../data/storyCards.js';
import { MOOD_MARKS, BOND_LINES, LINK_COLORS, markIconURL, readEmotionPref } from '../../rendering/ExpressionLayer.js';

export const LEGEND_HIDDEN_KEY = 'lmgame.ui.emotionLegendHidden';

export function readLegendHidden() {
  try {
    return localStorage.getItem(LEGEND_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeLegendHidden(hidden) {
  try {
    localStorage.setItem(LEGEND_HIDDEN_KEY, hidden ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

export class StoryFeed {
  constructor(game) {
    this.slot = 'left';
    this.game = game;
    this.events = game.events;
    this.lastTime = 0;
    this.cardKey = '';
    this.nodes = new Map(); // uid -> { root, bar, action, ... }

    // --- Duygu Katmanı açıklaması
    const close = el('button', { className: 'hud-btn legend-close', type: 'button', text: '✕', title: 'Açıklamayı kapat (Duygular açılınca yeniden görünmez)', tabIndex: -1 });
    close.setAttribute('aria-label', 'Açıklamayı kapat');
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.setLegendHidden(true));
    const rows = [
      ...Object.entries(MOOD_MARKS).map(([key, def]) =>
        el('li', { className: 'legend-row', title: def.hint }, [el('img', { className: 'legend-mark', src: markIconURL(key), alt: '' }), el('span', { text: def.name })])
      ),
      ...Object.entries(BOND_LINES).map(([key, def]) =>
        el('li', { className: 'legend-row', title: def.hint }, [el('i', { className: 'legend-line', style: `background:${LINK_COLORS[key]}` }), el('span', { text: def.name })])
      ),
    ];
    this.legend = el('div', { className: 'panel emotion-legend ui-interactive', hidden: true, role: 'note' }, [
      el('div', { className: 'legend-head' }, [el('span', { className: 'legend-title', text: 'Duygu Katmanı' }), close]),
      el('ul', { className: 'legend-list' }, rows),
    ]);
    this.legendHidden = readLegendHidden();
    this.legendOn = readEmotionPref();
    game.events.on('ui:emotionsChanged', (on) => {
      this.legendOn = Boolean(on);
    });
    // Ayarlar > Hikâye: açıklamayı yeniden aç / kapat (✕ ile kapatılan açıklama kalıcı olarak hatırlanır)
    game.events.on('ui:setEmotionLegend', ({ hidden } = {}) => this.setLegendHidden(Boolean(hidden)));

    // --- Kartlar
    this.cards = el('div', { className: 'story-cards' });
    this.element = el('div', { className: 'story-feed' }, [this.legend, this.cards]);
    this.cards.addEventListener('mouseover', () => (this.hover = true));
    this.cards.addEventListener('mouseleave', () => (this.hover = false));
    this.hover = false;
    // (30.2) Duygu Katmanı açıkken seçili sakin yoksa haritada ipucu (seçim yapılınca kaybolur)
    this.mapHint = el('div', { className: 'map-hint', hidden: true, role: 'note', text: 'Bir sakine tıkla, bağlarını gör.' });
    this.floating = [this.mapHint];
  }

  get director() {
    return this.game.scenes.current?.storyDirector ?? null;
  }

  setLegendHidden(hidden) {
    this.legendHidden = hidden;
    writeLegendHidden(hidden);
    this.events.emit('story:legendChanged', hidden);
  }

  buildCard(card) {
    const dir = this.director;
    const portraits = el('div', { className: 'story-portraits' }, card.portraits.map((p) => el('img', { className: `story-portrait${p.isChild ? ' is-child' : ''}`, src: getCharacterPortraitURL(p.appearance, p.look), alt: p.name, title: p.name })));
    const star = el('img', { className: 'story-watched', src: getAnyIconURL('star'), alt: '', title: STORY_TEXT.watchedTip, hidden: true });
    const text = el('p', { className: 'story-text', text: card.text });
    const story = el('p', { className: 'story-long', hidden: true });
    const btn = (label, cls, onClick) => {
      const b = el('button', { className: `hud-btn story-btn ${cls}`, type: 'button', text: label, tabIndex: -1 });
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', onClick);
      return b;
    };
    const go = card.go ? btn(STORY_TEXT.go, 'story-go', () => this.events.emit('ui:storyGo', { uid: card.uid })) : null;
    const action = card.action ? btn(card.action.label, 'story-action', () => this.events.emit('ui:storyAction', { uid: card.uid })) : null;
    const close = el('button', { className: 'story-close', type: 'button', text: '✕', title: 'Kapat', tabIndex: -1 });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.events.emit('ui:storyDismiss', { uid: card.uid }));
    const bar = el('i', { className: 'story-timer' });
    const root = el('div', { className: `panel story-card ui-interactive is-p${card.priority}${card.summary ? ' is-summary' : ''}`, role: 'status', dataset: { uid: String(card.uid), event: card.event } }, [
      el('div', { className: 'story-main' }, [portraits, el('div', { className: 'story-body' }, [text, story]), star, close]),
      el('div', { className: 'story-buttons' }, [go, action].filter(Boolean)),
      bar,
    ]);
    void dir;
    return { root, bar, action, star, story, text, last: '' };
  }

  render(game) {
    const now = performance.now();
    const dt = this.lastTime ? Math.min(0.25, (now - this.lastTime) / 1000) : 0;
    this.lastTime = now;
    const dir = this.director;
    const root = this.element.parentElement?.parentElement ?? null;
    const hidden = !dir || root?.classList.contains('is-title') || root?.classList.contains('is-cinematic');
    this.element.hidden = Boolean(hidden);
    this.legend.hidden = hidden || !this.legendOn || this.legendHidden;
    this.mapHint.hidden = Boolean(hidden) || !this.legendOn || (game.scenes.current?.selectedId ?? null) !== null;
    if (hidden) return;
    dir.tick(dt, { paused: game.state.time.paused, hovered: this.hover });
    const state = game.state;
    const key = dir.visible.map((c) => c.uid).join(',');
    if (key !== this.cardKey) {
      this.cardKey = key;
      const keep = new Map();
      for (const card of dir.visible) keep.set(card.uid, this.nodes.get(card.uid) ?? this.buildCard(card));
      this.nodes = keep;
      this.cards.replaceChildren(...dir.visible.map((c) => keep.get(c.uid).root));
    }
    for (const card of dir.visible) {
      const n = this.nodes.get(card.uid);
      n.bar.style.width = `${Math.max(0, Math.min(100, (card.left / 12) * 100))}%`;
      const watched = card.ids.some((id) => state.watched?.includes(id));
      if (n.star.hidden === watched) n.star.hidden = !watched;
      const st = actionStatus(state, card);
      const sig = `${st.show}|${st.enabled}|${card.used}|${card.open}`;
      if (n.action && n.last !== sig) {
        n.last = sig;
        n.action.hidden = !st.show;
        n.action.disabled = !st.enabled;
        n.action.title = st.reason;
        n.action.classList.toggle('is-used', Boolean(card.used));
        if (card.action.type === 'story') n.action.textContent = card.open ? 'Kapat' : card.action.label;
        if (card.action.type !== 'story') n.action.textContent = card.used ? `${card.action.label} ✓` : card.action.label;
        n.story.hidden = !(card.action?.type === 'story' && card.open);
        if (!n.story.hidden) n.story.textContent = card.story;
      }
    }
  }
}
