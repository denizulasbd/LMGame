// Kasaba Arşivi (13. aşama): dock'ta "Arşiv" (I) ve "Fotoğraf" (F) düğmeleri; Arşiv düğmesi ekranın ortasında
// bir pencere açar (17. aşama: ModalHost; ✕ / Esc / dışına tıklamak kapatır). Pencerede son 32 günün dört küçük grafiği (Nüfus, Ortalama Refah, Stok Toplamı, Kasaba Hazinesi;
// canvas'a piksel çizgisiyle) ve kasabanın toplam istatistikleri (üretilen ekmek, düğünler, doğan çocuklar, atlatılan
// kışlar, sergilenen yadigârlar...) yer alır. Veriyi StatsSystem (state.history) ve diğer sistemler (state.stats,
// state.trade, state.luxury, state.research) yazar; burası yalnızca GameState'i okur.
// (15. aşama) "Usta İşi Eserler" vitrini: ustaların çıkardığı eserler; her biri sergilenir (kalıcı +1 refah) ya da
// limandan / tüccara satılır. Düğmeler yalnızca 'ui:exhibitMasterwork' / 'ui:sellMasterwork' yayınlar.
// (20. aşama) Pencerenin üstünde iki sekme: "Kasaba Arşivi" (grafikler, tarih, eserler) ve "Tarihçe Kütüğü": kasabanın
// gurur tablosu (berat): kurucu sakinler, ilk evlenen çift, ilk usta işi eser, Ulu Saat Kulesi'nin aşamaları ve baş
// ustası (altın harflerle), Altın Çağ. Veriyi GoldenAgeSystem (state.chronicle, state.goldenAge) yazar.
import { towerOf, towerMasterOf, isGoldenAge } from '../../systems/GoldenAge.js';
import { BUILDINGS } from '../../data/buildings.js';
import { CONFIG } from '../../config.js';
import { RELIC_KEYS } from '../../data/luxury.js';
import { RESEARCH_KEYS } from '../../data/research.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { townSnapshot } from '../../systems/StatsSystem.js';
import { MASTERPIECES, MASTERWORK } from '../../data/masterpieces.js';
import { masterworkSaleStatus, masterworkHappiness, bestMasterworkBuyer } from '../../systems/Masterworks.js';
import { el } from '../dom.js';
import { dockButton, modalHeader } from '../dockButton.js';

const CHART_W = 236;
const CHART_H = 84;
const PAD = { left: 4, right: 4, top: 8, bottom: 6 };
const CHARTS = [
  { key: 'population', title: 'Nüfus', icon: 'heart', color: '#e8463c', fill: 'rgba(232, 70, 60, 0.22)', unit: 'sakin' },
  { key: 'welfare', title: 'Ortalama Refah', icon: 'smile', color: '#5cc46a', fill: 'rgba(56, 160, 70, 0.22)', unit: '%', min: 0, max: 100 },
  { key: 'stock', title: 'Stok Toplamı', icon: 'wood', color: '#d69a5c', fill: 'rgba(214, 154, 92, 0.2)', unit: 'birim' },
  { key: 'gold', title: 'Kasaba Hazinesi', icon: 'coin', color: '#ffd23f', fill: 'rgba(255, 210, 63, 0.2)', unit: 'altın' },
];

const formatNumber = (n) => Math.round(n).toLocaleString('tr-TR');

export class StatsPanel {
  constructor(game) {
    this.events = game.events;
    this.open = false;
    this.lastKey = '';
    this.modalHost = null; // UIManager bağlar

    // (17. aşama) Arşiv ve Fotoğraf düğmeleri alt dock'ta
    this.toggle = dockButton({ icon: 'chart', label: 'Arşiv', key: 'I', tip: 'Kasaba Arşivi: grafikler, tarih ve usta işi eserler', onClick: () => this.setOpen(!this.open), className: 'archive-toggle' });
    this.photo = dockButton({ icon: 'camera', label: 'Fotoğraf', key: 'F', tip: 'Fotoğraf modu: arayüzü gizle, kasabayı seyret', onClick: () => this.events.emit('ui:toggleCinematic'), className: 'photo-toggle' });
    this.dockButtons = [this.toggle, this.photo];

    // Pencere: ekranın ortasında (ModalHost)
    this.subtitle = el('div', { className: 'archive-subtitle' });
    this.charts = CHARTS.map((spec) => {
      const canvas = el('canvas', { className: 'archive-canvas', width: CHART_W, height: CHART_H });
      const value = el('span', { className: 'archive-value' });
      const change = el('span', { className: 'archive-change' });
      const range = el('div', { className: 'archive-range' });
      const box = el('div', { className: 'archive-chart' }, [
        el('div', { className: 'archive-chart-head' }, [el('img', { src: getAnyIconURL(spec.icon), alt: '' }), el('span', { className: 'archive-chart-title', text: spec.title }), value, change]),
        canvas,
        range,
      ]);
      return { spec, canvas, value, change, range, box };
    });
    this.totals = el('div', { className: 'archive-totals' });
    this.vitrineInfo = el('div', { className: 'archive-subtitle masterwork-info' });
    this.vitrine = el('div', { className: 'masterwork-list' });
    this.lastVitrine = '';
    // (20. aşama) Sekmeler: Kasaba Arşivi | Tarihçe Kütüğü
    this.tab = 'archive';
    this.tabButtons = [
      ['archive', 'Kasaba Arşivi', 'chart'],
      ['chronicle', 'Tarihçe Kütüğü', 'wonder'],
    ].map(([id, label, icon]) => {
      const b = el('button', { className: 'hud-btn archive-tab', type: 'button', tabIndex: -1, dataset: { tab: id } }, [el('img', { src: getAnyIconURL(icon), alt: '' }), label]);
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => this.setTab(id));
      return [id, b];
    });
    this.archiveView = el('div', { className: 'archive-view' }, [
      this.subtitle,
      el('div', { className: 'archive-grid' }, this.charts.map((c) => c.box)),
      el('div', { className: 'building-section-title', text: 'Kasabanın tarihi' }),
      this.totals,
      el('div', { className: 'building-section-title', text: 'Usta İşi Eserler' }),
      this.vitrineInfo,
      this.vitrine,
    ]);
    this.chronicleView = el('div', { className: 'chronicle-view', hidden: true });
    this.lastChronicle = '';
    this.window = el('div', { className: 'panel archive-panel ui-interactive', hidden: true }, [
      modalHeader('Kasaba Arşivi', () => this.setOpen(false), { icon: 'chart' }),
      el('div', { className: 'archive-tabs' }, this.tabButtons.map(([, b]) => b)),
      this.archiveView,
      this.chronicleView,
    ]);
    this.setTab('archive');
    this.modal = { id: 'archive', element: this.window };

    game.events.on('ui:toggleStats', () => this.setOpen(!this.open));
  }

  /** (20. aşama) Sekme seç: 'archive' | 'chronicle'. */
  setTab(tab) {
    this.tab = tab;
    for (const [id, b] of this.tabButtons) b.classList.toggle('is-active', id === tab);
    this.archiveView.hidden = tab !== 'archive';
    this.chronicleView.hidden = tab !== 'chronicle';
    this.lastKey = '';
    this.lastVitrine = '';
    this.lastChronicle = '';
  }

  setOpen(open) {
    this.open = open;
    this.window.hidden = !open;
    this.toggle.classList.toggle('is-active', open);
    this.lastKey = '';
    this.lastVitrine = '';
    if (open) this.modalHost?.opened('archive');
    else this.modalHost?.closed('archive');
  }

  render(game) {
    if (!this.open) return;
    const state = game.state;
    if (this.tab === 'chronicle') {
      this.renderChronicle(state);
      return;
    }
    this.renderVitrine(state);
    // Grafiklerin son noktası her zaman bugünün anlık değeri (arşiv her sabah yazılır)
    const now = townSnapshot(state);
    const history = state.history.filter((h) => h.day < now.day).slice(-(CONFIG.HISTORY_CHART_DAYS - 1));
    const points = [...history, now];
    const key = JSON.stringify([points, state.stats, state.trade.shipments, state.luxury, Object.keys(state.research.done).length]);
    if (key === this.lastKey) return;
    this.lastKey = key;

    const first = points[0];
    this.subtitle.textContent = `${state.townName} · Gün ${first.day} – Gün ${now.day} (${points.length} gün)`;
    for (const chart of this.charts) this.drawChart(chart, points);
    this.renderTotals(state);
  }

  drawChart({ spec, canvas, value, change, range }, points) {
    const values = points.map((p) => p[spec.key] ?? 0);
    const last = values[values.length - 1];
    const firstValue = values[0];
    value.textContent = `${formatNumber(last)}${spec.unit === '%' ? '%' : ` ${spec.unit}`}`;
    const delta = last - firstValue;
    change.textContent = points.length > 1 ? `${delta >= 0 ? '▲' : '▼'} ${formatNumber(Math.abs(delta))}` : '';
    change.className = `archive-change${delta > 0 ? ' is-up' : delta < 0 ? ' is-down' : ''}`;

    let lo = spec.min ?? Math.min(...values);
    let hi = spec.max ?? Math.max(...values);
    if (spec.min === undefined) lo = Math.max(0, Math.floor(lo - (hi - lo) * 0.1));
    if (hi - lo < 1) hi = lo + 1;
    range.textContent = `en düşük ${formatNumber(Math.min(...values))} · en yüksek ${formatNumber(Math.max(...values))}`;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CHART_W, CHART_H);
    // (17. aşama) Koyu parşömen zemin ve yatay kılavuz çizgileri
    ctx.fillStyle = '#231813';
    ctx.fillRect(0, 0, CHART_W, CHART_H);
    ctx.fillStyle = 'rgba(242, 228, 196, 0.1)';
    const plotH = CHART_H - PAD.top - PAD.bottom;
    const plotW = CHART_W - PAD.left - PAD.right;
    for (let i = 0; i <= 4; i++) ctx.fillRect(PAD.left, Math.round(PAD.top + (plotH * i) / 4), plotW, 1);
    const xAt = (i) => Math.round(PAD.left + (points.length === 1 ? plotW : (plotW * i) / (points.length - 1)));
    const yAt = (v) => Math.round(PAD.top + plotH - ((v - lo) / (hi - lo)) * plotH);

    // Alan dolgusu
    ctx.fillStyle = spec.fill;
    ctx.beginPath();
    ctx.moveTo(xAt(0), PAD.top + plotH);
    values.forEach((v, i) => ctx.lineTo(xAt(i), yAt(v)));
    ctx.lineTo(xAt(values.length - 1), PAD.top + plotH);
    ctx.closePath();
    ctx.fill();
    // Piksel çizgi: noktalar arası 2 piksellik basamaklı çizgi
    ctx.fillStyle = spec.color;
    for (let i = 0; i < values.length; i++) {
      const x0 = xAt(i);
      const y0 = yAt(values[i]);
      if (i > 0) {
        const xp = xAt(i - 1);
        const yp = yAt(values[i - 1]);
        const steps = Math.max(Math.abs(x0 - xp), Math.abs(y0 - yp), 1);
        for (let s = 0; s <= steps; s++) {
          ctx.fillRect(Math.round(xp + ((x0 - xp) * s) / steps), Math.round(yp + ((y0 - yp) * s) / steps), 2, 2);
        }
      }
    }
    // Gün noktaları (son nokta büyük)
    ctx.fillStyle = '#f2e4c4';
    values.forEach((v, i) => {
      const big = i === values.length - 1;
      ctx.fillRect(xAt(i) - (big ? 2 : 1), yAt(v) - (big ? 2 : 1), big ? 5 : 3, big ? 5 : 3);
    });
    ctx.fillStyle = spec.color;
    ctx.fillRect(xAt(values.length - 1) - 1, yAt(last) - 1, 3, 3);
  }

  /** (15. aşama) Usta işi eserler: depodakiler (Sergile / Sat), sergilenenler ve satılanların özeti. */
  renderVitrine(state) {
    const mw = state.masterworks;
    const buyer = bestMasterworkBuyer(state);
    const key = JSON.stringify([mw.items.map((i) => `${i.id}${i.status}`), buyer]);
    if (key === this.lastVitrine) return;
    this.lastVitrine = key;
    const shown = mw.items.filter((i) => i.status !== 'sold');
    const bonus = masterworkHappiness(state);
    this.vitrineInfo.textContent = mw.made
      ? `${mw.made} eser yapıldı · ${mw.items.filter((i) => i.status === 'exhibited').length} sergileniyor (refah +${bonus}/${MASTERWORK.maxExhibitHappiness}) · ${mw.sold} satıldı (+${formatNumber(mw.goldEarned)} altın)`
      : 'Henüz eser yok. Usta (Lv.3) sakinler kendi iş yerlerinde çalışırken nadiren usta işi bir eser ortaya koyar.';
    const row = (item) => {
      const piece = MASTERPIECES[item.type];
      const actions = [];
      if (item.status === 'stored') {
        actions.push(this.vitrineButton('Sergile', `Vitrinde sergile: kasaba refahına kalıcı +${MASTERWORK.exhibitHappiness}`, () => this.events.emit('ui:exhibitMasterwork', { id: item.id })));
        const source = buyer ?? 'harbor';
        const sale = masterworkSaleStatus(state, item.id, source);
        const sell = this.vitrineButton(`Sat ${sale.price} altın`, sale.ok ? `${source === 'harbor' ? 'Limandan ihraç et' : 'Gezgin tüccara sat'}: +${sale.price} altın` : `Satılamıyor: ${sale.reason}`, () =>
          this.events.emit('ui:sellMasterwork', { id: item.id, source })
        );
        sell.disabled = !sale.ok;
        actions.push(sell);
      } else {
        actions.push(el('span', { className: 'masterwork-state', text: 'Sergileniyor' }));
      }
      return el('div', { className: `masterwork-row is-${item.status}`, title: piece.description }, [
        el('img', { src: getAnyIconURL(piece.icon), alt: '' }),
        el('div', { className: 'masterwork-text' }, [
          el('span', { className: 'masterwork-name', text: piece.name }),
          el('span', { className: 'masterwork-meta', text: `Usta ${item.maker} · Gün ${item.day}` }),
        ]),
        el('div', { className: 'masterwork-actions' }, actions),
      ]);
    };
    this.vitrine.replaceChildren(...shown.sort((a, b) => (a.status === b.status ? b.id - a.id : a.status === 'stored' ? -1 : 1)).map(row));
  }

  /** (20. aşama) Tarihçe Kütüğü: kasabanın gurur tablosu, altın harflerle. */
  renderChronicle(state) {
    const ch = state.chronicle ?? {};
    const ga = state.goldenAge ?? {};
    const tower = towerOf(state);
    const leader = towerMasterOf(state);
    const key = JSON.stringify([ch, ga.since, ga.chimes, ga.books, tower?.wonderStage, tower?.underConstruction, leader, state.townName]);
    if (key === this.lastChronicle) return;
    this.lastChronicle = key;
    const when = (v) => (v && Number.isFinite(v.day) ? `Gün ${v.day}${Number.isFinite(v.hour) ? `, ${String(v.hour).padStart(2, '0')}:00` : ''}` : '');
    const gold = (text) => el('span', { className: 'chronicle-gold', text });
    const pending = (text) => el('span', { className: 'chronicle-pending', text });
    const entry = (icon, title, body, meta = '') =>
      el('div', { className: 'chronicle-entry' }, [
        el('img', { src: getAnyIconURL(icon), alt: '' }),
        el('div', { className: 'chronicle-text' }, [el('div', { className: 'chronicle-title', text: title }), el('div', { className: 'chronicle-body' }, body), ...(meta ? [el('div', { className: 'chronicle-meta', text: meta })] : [])]),
      ]);

    const stages = BUILDINGS.wonder.wonder.stages;
    const stageRows = stages.map((s, i) => {
      const done = ch.towerStages?.[i + 1];
      return el('li', { className: done ? 'is-done' : '' }, [`${i + 1}. ${s.name}: `, done ? gold(done.unknown ? 'tamamlandı' : when(done)) : pending('bekliyor')]);
    });
    let towerBody;
    if (ch.towerMaster) towerBody = [gold(ch.towerMaster.name), ` kulenin baş ustası (${formatNumber(ch.towerMaster.work)} emek)`];
    else if (leader) towerBody = ['Kule yükseliyor; şu an en çok emek veren: ', gold(leader.name), ` (${formatNumber(leader.work)})`];
    else towerBody = [pending(tower ? 'Kule yükseliyor; henüz kimsenin emeği yazılmadı' : 'Kasaba 20 sakine ve Kasaba seviyesine ulaşınca Ulu Saat Kulesi başlatılabilir')];

    this.chronicleView.replaceChildren(
      el('div', { className: 'chronicle-scroll' }, [
        el('div', { className: 'chronicle-head' }, [
          el('div', { className: 'chronicle-seal', text: '✦' }),
          el('div', { className: 'chronicle-town', text: `${state.townName} Tarihçe Kütüğü` }),
          el('div', { className: 'chronicle-sub', text: isGoldenAge(state) ? `Altın Çağ · ${when(ga.since)}'den beri · kule saati ${ga.chimes ?? 0} kez çaldı` : 'Kasabanın gurur tablosu' }),
        ]),
        entry('heart', 'Kurucu Sakinler', ch.founders?.length ? [gold(ch.founders.map((f) => f.name).join(', '))] : [pending('Henüz yazılmadı')], 'Kasabayı ilk kuran ve ilk kulübelere yerleşenler'),
        entry('ring', 'İlk Evlenen Çift', ch.firstCouple ? [gold(`${ch.firstCouple.a} ile ${ch.firstCouple.b}`)] : [pending('Henüz kimse evlenmedi')], when(ch.firstCouple)),
        entry('masterpiece', 'İlk Usta Eseri', ch.firstMasterwork ? [gold(ch.firstMasterwork.maker), ` · ${ch.firstMasterwork.piece}`] : [pending('Henüz bir usta eser vermedi')], when(ch.firstMasterwork)),
        entry('wonder', 'Ulu Saat Kulesi', towerBody),
        el('ul', { className: 'chronicle-stages' }, stageRows),
        entry('bell', 'Altın Çağ', isGoldenAge(state) ? [gold(`${when(ch.goldenAge ?? ga.since)}`), ' · çalışma şevki +%10, refah +%10', ...(ga.books ? [` · kitaplıkta ${ga.books} antik kitap`] : [])] : [pending('Kule tamamlanınca başlar')]),
      ])
    );
  }

  vitrineButton(label, title, onClick) {
    const b = el('button', { className: 'hud-btn masterwork-btn', type: 'button', text: label, title, tabIndex: -1 });
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', onClick);
    return b;
  }

  renderTotals(state) {
    const stats = state.stats;
    const goods = stats.goods ?? {};
    const relics = RELIC_KEYS.filter((id) => state.luxury.relics[id]).length;
    const rows = [
      ['bread', 'Fırından çıkan ekmek', goods.bread ?? 0],
      ['wool', 'Kırkılan yün', goods.wool ?? 0],
      ['iron', 'Çıkarılan demir', goods.iron ?? 0],
      ['flax', 'Toplanan keten', goods.flax ?? 0],
      ['hops', 'Toplanan şerbetçiotu', goods.hops ?? 0],
      ['cloth', 'Dokunan kumaş', goods.cloth ?? 0],
      ['sherbet', 'Handa içilen şerbet', stats.sherbetServed ?? 0],
      ['food', 'Pişen sıcak yemek', stats.mealsCooked ?? 0],
      ['love', 'Kıyılan düğün', stats.weddings ?? 0],
      ['heart', 'Doğan çocuk', stats.births ?? 0],
      ['winter', 'Atlatılan kış', stats.wintersSurvived ?? 0],
      ['hammer', 'Tamamlanan yapı', stats.buildingsCompleted ?? 0],
      ['sparkle', 'Tüccarla takas', stats.trades ?? 0],
      ['boat', 'İhracat seferi', state.trade.shipments ?? 0],
      ['coin', 'Ticaretten kazanılan altın', state.trade.goldEarned ?? 0],
      ['spice', 'Lüks ve fermanlara harcanan altın', state.luxury.goldSpent ?? 0],
      ['relicSun', 'Sergilenen yadigâr', `${relics}/${RELIC_KEYS.length}`],
      ['book', 'Tamamlanan araştırma', `${Object.keys(state.research.done).length}/${RESEARCH_KEYS.length}`],
      ['remedy', 'Şifacıda iyileşen', stats.cured ?? 0],
      ['map', 'Verilen karar', stats.dilemmas ?? 0],
      ['handshake', 'Barışan küsler', stats.reconciliations ?? 0],
      ['masterpiece', 'Usta işi eser', state.masterworks?.made ?? 0],
      ['map', 'Keşif seferi', state.exploration?.expeditions ?? 0],
      ['mountain', 'Atlatılan macera', stats.adventures ?? 0],
      ['adventure', 'Handa anlatılan hikâye', stats.talesTold ?? 0],
      ['scheme', 'Çözülen kadim yazıt', `${Object.values(state.exploration?.inscriptions ?? {}).filter((i) => i.status === 'decoded').length}/3`],
    ];
    this.totals.replaceChildren(
      ...rows.map(([icon, label, v]) =>
        el('div', { className: 'archive-total' }, [
          el('img', { src: getAnyIconURL(icon), alt: '' }),
          el('span', { className: 'archive-total-label', text: label }),
          el('span', { className: 'archive-total-value', text: typeof v === 'number' ? formatNumber(v) : v }),
        ])
      )
    );
  }
}
