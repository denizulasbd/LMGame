// (32.3) Kasaba Şöhreti arayüz parçaları. Yalnızca GameState'i okur; şalter ENGINES.renown kapalıyken rozet gizlenir.
//   renownSummary(state)   : rozet / ipucu / Belediye satırının ortak özeti (değer, kademe, hedef, bugünkü kayma, yön, nedenler)
//   RenownBadge            : üst çubukta Nabız'ın yanında küçük rozet (taç, %, kademe adı, 24 saatlik yön oku); tıklayınca Belediye
//   RoyalLetter            : "Kraliyet Lütufnamesi" penceresi (mühürlü mektup; oyunu durdurmaz), 'ui:openRoyalLetter' { key }
//   royalBuildingLines     : lütuf yapısının paneli (etki, Şüpheli'de yarıya iner)
//   royalLedger            : Tarihçe'de "Kasabanın Kraliyet Defteri" (Kraliyet Arşivi kurulunca)
import { el } from '../dom.js';
import { modalHeader } from '../dockButton.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { adoptTip } from './HoverTip.js';
import { educationRenownLine } from './universityCards.js'; // (32.4)
import { clubRenownLine } from './clubCards.js'; // (32.5)
import { UNIVERSITY } from '../../data/university.js'; // (32.4)
import { BUILDINGS } from '../../data/buildings.js';
import { ROYAL_LETTER, ROYAL_EFFECTS, RENOWN_GRANT, RENOWN_DRIFT, RENOWN_LEVELS } from '../../data/renown.js';
import { engineOn } from '../../systems/Engines.js';
import { renownTarget, renownStep, renownLevelOf, renownReasonsText, royalWeakened, grantTownReady, rankOf } from '../../systems/Renown.js';

const ARROWS = { up: '▲', flat: '▬', down: '▼' };
const ARROW_TEXT = { up: 'yükseliyor', flat: 'durgun', down: 'düşüyor' };
const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(Math.round(v * 10) / 10)}`;

/** Ortak özet: { value, level, target, step, dir, reasons, parts }. */
export function renownSummary(state) {
  const value = state.crown?.reputation ?? 50;
  const level = renownLevelOf(value);
  const t = renownTarget(state);
  const step = renownStep(value, t.target);
  const day = state.time.day;
  const prev = (state.history ?? []).find((h) => h.day === day - 1 && Number.isFinite(h.reputation));
  const ref = prev ? prev.reputation : state.renown?.drift?.from;
  const d = Number.isFinite(ref) ? value - ref : 0;
  const dir = d >= 1 ? 'up' : d <= -1 ? 'down' : 'flat';
  const reasons = state.renown?.reasons?.length ? state.renown.reasons : t.parts.filter((p) => p.key !== 'tier').slice(0, RENOWN_DRIFT.reasonsKept).map((p) => ({ ...p, value: Math.round(p.value) }));
  return { value, level, target: t.target, step, dir, reasons, parts: t.parts };
}

/** İpucu / panel satırları. */
export function renownLines(state, s = renownSummary(state)) {
  const early = state.time.day < RENOWN_DRIFT.minDay;
  return [
    `Krallık İtibarı: %${Math.round(s.value)} · ${s.level.name} ${ARROWS[s.dir]} (24 saatte ${ARROW_TEXT[s.dir]})`,
    early ? `Hedef %${Math.round(s.target)} · kayma ${RENOWN_DRIFT.minDay}. günden itibaren` : `Hedef %${Math.round(s.target)} · bu gece ${signed(s.step)} (boşluğun %${Math.round(RENOWN_DRIFT.share * 100)}'si, en çok ${RENOWN_DRIFT.maxStep})`,
    `Nedenler: ${s.reasons.length ? renownReasonsText(s.reasons) : 'henüz yok'}`,
    ...((t) => (t ? [t] : []))(educationRenownLine(state)), // (32.4) hedefteki Eğitim katkısı
    ...((t) => (t ? [t] : []))(clubRenownLine(state)), // (32.5) hedefteki Kulüpler katkısı
    `Vergi ×${s.level.levy} · ferman ödülü ×${s.level.reward}${s.level.key === 'bad' ? ' · fermanlar 2 günlük' : rankOf(state) >= 2 ? ' · göçmenler Kalfa gelir' : ''}`,
  ];
}

export class RenownBadge {
  constructor(game, openHall) {
    this.game = game;
    this.icon = el('img', { className: 'hud-icon renown-crown', src: getAnyIconURL('crown'), alt: '' });
    this.value = el('span', { className: 'renown-value' });
    this.name = el('span', { className: 'renown-name' });
    this.arrow = el('span', { className: 'renown-arrow' });
    this.element = adoptTip(el('button', { className: 'hud-chip hud-renown', type: 'button', tabIndex: -1 }, [this.icon, this.value, this.name, this.arrow]));
    this.element.addEventListener('mousedown', (e) => e.preventDefault());
    this.element.addEventListener('click', () => openHall());
    this.element.hidden = !engineOn('renown');
    this.last = '';
  }

  render(state, force = false) {
    if (!engineOn('renown')) return;
    const hour = state.time.hour;
    const key = `${Math.round(state.crown?.reputation ?? 0)}|${state.time.day}|${hour}|${state.renown?.reasons?.map((r) => r.key + r.value).join(',')}`;
    if (!force && key === this.last) return;
    this.last = key;
    const s = renownSummary(state);
    this.value.textContent = `%${Math.round(s.value)}`;
    this.name.textContent = s.level.name;
    this.arrow.textContent = ARROWS[s.dir];
    this.arrow.className = `renown-arrow is-${s.dir}`;
    this.element.dataset.level = s.level.key;
    this.element.title = [...renownLines(state, s), 'Tıkla: Belediye Konağı (Krallık)'].join('\n');
  }
}

/** Lütuf yapısının panel satırları. */
export function royalBuildingLines(state, type) {
  const weak = royalWeakened(state);
  const half = (txt) => (weak ? `${txt} (itibar Şüpheli: etkiler yarıya indi)` : txt);
  const e = ROYAL_EFFECTS[type];
  const share = RENOWN_GRANT.weakenedShare;
  const lines = [];
  if (type === 'peaceFountain') lines.push(half(`Kasaba çapında suç riski −%${Math.round((1 - e.crimeRisk) * 100 * (weak ? share : 1))}`), 'Akşamları suyu ışıl ışıl; çevresinde dinlenenlerin keyfi dolar');
  if (type === 'royalRoseGarden') lines.push(half(`Kasaba refahı +${weak ? e.happiness * share : e.happiness} · aşk ve evlilik olasılığı +%${Math.round((e.romance - 1) * 100 * (weak ? share : 1))}`), 'Çevresine bolca güzellik yayar');
  if (type === 'royalArchive') lines.push(half(`Araştırma ve yazıt çözme +%${Math.round((e.research - 1) * 100 * (weak ? share : 1))}`), 'Tarihçe Kütüğü: Kasabanın Kraliyet Defteri');
  if (type === 'royalArchive' && engineOn('university')) lines.push(`Darülfünun'da ders ×${String(UNIVERSITY.archiveMultiplier).replace('.', ',')} (saray defterleri derste okunur)`); // (32.4)
  const g = state.renown?.grants?.find((x) => x.key === type);
  if (g) lines.push(`Kraliyet Lütfu: Gün ${g.day}`);
  lines.push(`Etkiler itibar Şüpheli'ye (%${RENOWN_LEVELS.find((l) => l.key === 'ok').min} altı) düşerse yarıya iner`);
  return lines;
}

/** Tarihçe: "Kasabanın Kraliyet Defteri" girdisinin gövdesi (Kraliyet Arşivi kurulu değilse null). */
export function royalLedger(state) {
  if (!engineOn('renown') || !state.buildings.some((b) => b.functional && b.type === 'royalArchive')) return null;
  const r = state.renown ?? {};
  const levelName = (k) => RENOWN_LEVELS.find((l) => l.key === k)?.name ?? k;
  const tiers = (r.tiers ?? []).slice(-6).map((t) => `Gün ${t.day} ${t.up ? '▲' : '▼'} ${levelName(t.key)}`).join(', ');
  const grants = (r.grants ?? []).map((g) => `${BUILDINGS[g.key].name} (Gün ${g.day})`).join(', ');
  const exiles = (state.justice?.exiles ?? []).slice(-4).map((e) => `${e.name} (Gün ${e.day})`).join(', ');
  return {
    title: 'Kasabanın Kraliyet Defteri',
    body: [`Kademeler: ${tiers || 'değişmedi'}`, `Lütuflar: ${grants || 'yok'}`, `Sürgünler: ${exiles || 'yok'}`],
    meta: `Krallık İtibarı bugün %${Math.round(state.crown?.reputation ?? 0)} · ${renownLevelOf(state.crown?.reputation ?? 0).name}`,
  };
}

/** Lütfun koşullarına dair kısa durum (Belediye satırı). */
export function grantStatusText(state) {
  if (!engineOn('renown')) return '';
  const r = state.renown;
  const granted = r?.grants?.length ?? 0;
  if (granted >= 3) return 'Bütün Kraliyet Lütufları alındı';
  if (!grantTownReady(state)) return granted ? `Kraliyet Lütfu: ${granted}/3` : '';
  const streak = r?.gozdeStreak ?? 0;
  return `Kraliyet Lütfu ${granted}/3 · Gözde serisi ${Math.min(streak, RENOWN_GRANT.streakDays)}/${RENOWN_GRANT.streakDays} gün`;
}

export class RoyalLetter {
  constructor(game) {
    this.game = game;
    this.events = game.events;
    this.open = false;
    this.key = null;
    this.modalHost = null;
    this.body = el('div', { className: 'royal-letter-body' });
    this.panel = el('div', { className: 'panel royal-letter ui-interactive', hidden: true }, [
      modalHeader(ROYAL_LETTER.title, () => this.setOpen(false), { icon: 'decree' }),
      this.body,
    ]);
    this.modal = { id: 'royalLetter', element: this.panel };
    game.events.on('ui:openRoyalLetter', ({ key } = {}) => {
      if (!engineOn('renown') || !BUILDINGS[key]) return;
      this.key = key;
      this.setOpen(true);
    });
  }

  setOpen(open) {
    this.open = open;
    this.panel.hidden = !open;
    if (open) {
      this.fill(this.game.state);
      this.modalHost?.opened('royalLetter');
    } else this.modalHost?.closed('royalLetter');
  }

  fill(state) {
    const key = this.key;
    const g = state.renown?.grants?.find((x) => x.key === key);
    const town = state.townName || 'Kasaba';
    const build = el('button', { className: 'hud-btn royal-letter-build', type: 'button', tabIndex: -1, text: `${BUILDINGS[key].name} kur` });
    build.addEventListener('mousedown', (e) => e.preventDefault());
    build.addEventListener('click', () => {
      this.setOpen(false);
      this.events.emit('ui:setTool', { tool: 'build', buildType: key });
    });
    this.body.replaceChildren(
      el('div', { className: 'royal-letter-paper' }, [
        el('div', { className: 'royal-letter-lead', text: ROYAL_LETTER.lead.replace('{town}', town) }),
        el('p', { className: 'royal-letter-text', text: ROYAL_LETTER.body[key] }),
        el('div', { className: 'royal-letter-meta', text: `${BUILDINGS[key].name} · ${BUILDINGS[key].description}` }),
        el('div', { className: 'royal-letter-foot' }, [
          el('span', { className: 'royal-letter-date', text: g ? `Gün ${g.day}` : '' }),
          el('span', { className: 'royal-letter-seal', title: ROYAL_LETTER.seal }, [el('img', { src: getAnyIconURL('crown'), alt: ROYAL_LETTER.seal })]),
        ]),
        el('div', { className: 'royal-letter-close', text: ROYAL_LETTER.close }),
      ]),
      el('div', { className: 'royal-letter-actions' }, [build])
    );
  }

  render() {}
}

/** (BuildingPanel) Lütuf yapısının bölüm anahtarı (değişince yeniden çizilir). */
export function royalKey(building, state) {
  if (!engineOn('renown') || !BUILDINGS[building.type]?.royalGrant || !building.functional) return '';
  return `${building.type}|${royalWeakened(state)}|${state.renown?.grants?.length ?? 0}`;
}

/** (BuildingPanel) Lütuf yapısının bölümü (boşsa []). */
export function royalSection(building, state) {
  if (!royalKey(building, state)) return [];
  const lines = royalBuildingLines(state, building.type);
  return [
    el('div', { className: 'building-section-title', text: 'Kraliyet Lütfu' }),
    el('div', { className: `decree luxury-card royal-card${royalWeakened(state) ? ' is-weak' : ''}` }, [
      el('div', { className: 'decree-head' }, [el('img', { src: getAnyIconURL('crown'), alt: '' }), BUILDINGS[building.type].name, el('span', { className: 'decree-state', text: royalWeakened(state) ? 'Zayıfladı' : 'Etkin' })]),
      ...lines.map((t) => el('div', { className: 'upgrade-text', text: t })),
    ]),
  ];
}
