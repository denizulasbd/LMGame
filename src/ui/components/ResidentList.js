// Sağ üstteki "Kasaba Sakinleri" çekmecesi: herkesin portresi (çocuk, paltolu, çantalı, meslek kıyafetli), adı ve şu an
// ne yaptığı. Bir satıra tıklamak o karakteri seçer (karakter kartı açılır, kamera ona kayar).
// (17. aşama) Başlıktaki ▸ düğmesi çekmeceyi sağa doğru kapatır; kapalıyken kenarda yalnızca ince bir sekme kalır
// (kişi simgesi ve sakin sayısı), tıklanınca çekmece sağdan kayarak açılır. Tercih tarayıcıda hatırlanır.
// (Eski hata: listenin CSS'teki display: flex kuralı [hidden] özniteliğini eziyordu; düğme çalışmıyor gibi görünüyordu.)
import { getCharacterPortraitURL, lookKey } from '../../art/sprites/index.js';
import { NEED_KEYS } from '../../data/characters.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { el } from '../dom.js';

const COLLAPSED_KEY = 'lmgame.ui.residentsCollapsed';

const DRAWER_CLOSE_MS = 180; // kapanma animasyonunun süresi (CSS drawer-out ile aynı)

// Telefon genişliğinde (tercih kaydedilmemişse) çekmece kapalı başlar; oyun alanı kapanmasın
const NARROW_SCREEN = 620;

function readCollapsed() {
  const narrow = typeof window !== 'undefined' && window.innerWidth <= NARROW_SCREEN;
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? narrow : stored === '1';
  } catch {
    return narrow;
  }
}

function writeCollapsed(collapsed) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

/** İhtiyaçların en düşüğüne göre ruh hâli: iyi / idare eder / kötü. */
function moodClass(character) {
  const lowest = Math.min(...NEED_KEYS.map((k) => character.needs[k]));
  if (lowest < 25) return 'is-bad';
  if (lowest < 50) return 'is-warn';
  return 'is-ok';
}

export class ResidentList {
  constructor(game) {
    this.slot = 'drawer';
    this.collapsed = false;
    this.selectedId = null;
    this.rows = new Map(); // karakter kimliği -> { row, status, mood }
    this.rosterKey = '';

    this.title = el('span', { className: 'resident-title' });
    this.toggle = el('button', { className: 'hud-btn resident-toggle', type: 'button', text: '▸', title: 'Listeyi gizle', tabIndex: -1 });
    this.toggle.setAttribute('aria-label', 'Sakinler listesini gizle');
    this.toggle.addEventListener('mousedown', (e) => e.preventDefault());
    this.toggle.addEventListener('click', () => this.setCollapsed(true));
    this.list = el('div', { className: 'resident-list' });
    this.panel = el('div', { className: 'panel residents ui-interactive' }, [
      el('div', { className: 'resident-header' }, [el('img', { className: 'resident-title-icon', src: getAnyIconURL('people'), alt: '' }), this.title, this.toggle]),
      this.list,
    ]);
    // Kapalıyken kalan ince sekme
    this.tabCount = el('span', { className: 'resident-tab-count' });
    this.tab = el('button', { className: 'hud-btn resident-tab ui-interactive', type: 'button', title: 'Kasaba Sakinleri listesini aç', tabIndex: -1 }, [
      el('img', { src: getAnyIconURL('people'), alt: '' }),
      this.tabCount,
      el('span', { className: 'resident-tab-caret', text: '◂' }),
    ]);
    this.tab.setAttribute('aria-label', 'Sakinler listesini aç');
    this.tab.addEventListener('mousedown', (e) => e.preventDefault());
    this.tab.addEventListener('click', () => this.setCollapsed(false));
    this.element = el('div', { className: 'resident-drawer' }, [this.tab, this.panel]);
    this.setCollapsed(readCollapsed(), false);

    this.events = game.events;
    game.events.on('character:selected', (id) => {
      this.selectedId = id;
      for (const [rowId, { row }] of this.rows) row.classList.toggle('is-selected', rowId === id);
    });
  }

  setCollapsed(collapsed, remember = true) {
    const changed = collapsed !== this.collapsed;
    this.collapsed = collapsed;
    clearTimeout(this.closeTimer);
    this.element.classList.toggle('is-collapsed', collapsed);
    this.panel.setAttribute('aria-hidden', String(collapsed));
    this.tab.hidden = !collapsed;
    this.panel.classList.remove('is-opening', 'is-closing');
    if (collapsed) {
      // Sağa doğru kayarak kapanır, ardından tamamen gizlenir (ekran dışında görünmez bir panel kalmaz)
      if (changed && this.panel.offsetParent !== null) {
        void this.panel.offsetWidth;
        this.panel.classList.add('is-closing');
        this.closeTimer = setTimeout(() => (this.panel.hidden = true), DRAWER_CLOSE_MS);
      } else {
        this.panel.hidden = true;
      }
    } else {
      this.panel.hidden = false;
      // Açılırken sağdan kayarak gelir (animasyon her açılışta yeniden başlar)
      if (changed) {
        void this.panel.offsetWidth;
        this.panel.classList.add('is-opening');
      }
    }
    if (remember) writeCollapsed(collapsed);
    if (!collapsed) this.rosterKey = ''; // kapalıyken güncellenmeyen satırlar yenilensin
  }

  rebuild(characters) {
    this.list.replaceChildren();
    this.rows.clear();
    for (const c of characters) {
      const status = el('span', { className: 'resident-status' });
      const mood = el('span', { className: 'status-dot resident-mood' });
      const row = el('button', { className: 'resident-row', type: 'button', tabIndex: -1 }, [
        el('img', { className: `resident-portrait${c.isChild ? ' is-child' : ''}`, src: getCharacterPortraitURL(c.appearance, c.look), alt: '' }),
        el('span', { className: 'resident-text' }, [el('span', { className: 'resident-name', text: c.name }), status]),
        mood,
      ]);
      row.addEventListener('mousedown', (e) => e.preventDefault());
      row.addEventListener('click', () => this.events.emit('ui:selectCharacter', c.id));
      row.classList.toggle('is-selected', c.id === this.selectedId);
      this.list.append(row);
      this.rows.set(c.id, { row, status, mood, lastStatus: '', lastMood: '' });
    }
  }

  render(game) {
    const characters = game.state.characters;
    const rosterKey = characters.map((c) => `${c.id}:${lookKey(c.look)}`).join(',');
    if (rosterKey !== this.rosterKey) {
      this.rosterKey = rosterKey;
      this.title.textContent = `Kasaba Sakinleri (${characters.length})`;
      this.tabCount.textContent = String(characters.length);
      this.rebuild(characters);
    }
    if (this.collapsed) return;

    for (const c of characters) {
      const entry = this.rows.get(c.id);
      if (entry.lastStatus !== c.activityLabel) {
        entry.lastStatus = c.activityLabel;
        entry.status.textContent = c.activityLabel;
      }
      const mood = moodClass(c);
      if (entry.lastMood !== mood) {
        entry.lastMood = mood;
        entry.mood.className = `status-dot resident-mood ${mood}`;
      }
    }
  }
}
