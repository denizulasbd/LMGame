// (32.2) Dava penceresi: Adalet Sarayı'nın dava dosyası. Ekranın ortasında açılır (ModalHost) ama oyunu DURDURMAZ. Açılış:
// 'ui:openCase' { id } (saray paneli, üst çubuk çipi "Dava · {suçlu}", İlan Tahtası, sakin kartındaki "Dava dosyası", hikâye kartı).
// Dosyada sırasıyla: başlık (suç, gün, yer, suçlunun portresi ve evresi), olay, suçlunun ifadesi, bağlam satırları (gerçekler, puan
// değil), tanık ifadesi, kurbanın sözü, karar (ana ceza + "Çalınanı sahibine iade ettir"). HER ceza HER suçta seçilebilir; halkın
// tepkisi ÖNCEDEN gösterilmez. Karar 'ui:courtVerdict' { caseId, sentence, restitution } olarak yayınlanır (CourtSystem işler);
// ardından kısa sonuç ekranı: halkın tepkisi, nedeni ve etkiler. Pencere yalnızca GameState'i okur.
import { el } from '../dom.js';
import { modalHeader } from '../dockButton.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { getCharacterPortraitURL } from '../../art/sprites/index.js';
import { CRIMES, SENTENCES, BANDS, BAND_REASONS, COURT_TEXT } from '../../data/justice.js';
import { LIFE_STAGES } from '../../data/lifeStages.js';
import { LOYALTY_TIERS } from '../../data/loyalty.js';
import { engineOn } from '../../systems/Engines.js';
import { fairSentenceNames, caseText, caseFacts, statementText, witnessText, pleaText, sentenceOptions, restitutionStatus, kinOf, fill, courtOf, lootText } from '../../systems/Justice.js';
import { verdictLines } from '../../systems/CourtSystem.js';
import { leftText } from './justiceCards.js';
import { verdictRenownImpact } from '../../systems/Renown.js'; // (32.3)

const tierName = (t) => LOYALTY_TIERS[t]?.name ?? 'Sakin';

export class CaseModal {
  constructor(game) {
    this.game = game;
    this.events = game.events;
    this.open = false;
    this.caseId = null;
    this.choice = null;
    this.restitution = false;
    this.lastKey = '';
    this.modalHost = null; // UIManager bağlar
    this.body = el('div', { className: 'case-body' });
    this.panel = el('div', { className: 'panel case-panel ui-interactive', hidden: true }, [
      modalHeader('Dava Dosyası', () => this.setOpen(false), { icon: 'scales' }),
      this.body,
    ]);
    this.modal = { id: 'case', element: this.panel };
    game.events.on('ui:openCase', ({ id } = {}) => {
      if (!engineOn('court')) return;
      if (this.caseId !== id) {
        this.choice = null;
        this.restitution = false;
      }
      this.caseId = id;
      this.setOpen(true);
    });
  }

  setOpen(open) {
    this.open = open;
    this.panel.hidden = !open;
    this.lastKey = '';
    if (open) this.modalHost?.opened('case');
    else this.modalHost?.closed('case');
  }

  findCase(state) {
    const j = state.justice;
    if (!j) return { k: null, open: false };
    const open = j.cases.find((k) => k.id === this.caseId);
    if (open) return { k: open, open: true };
    return { k: j.log.find((k) => k.id === this.caseId) ?? null, open: false };
  }

  render(game) {
    if (!this.open) return;
    const state = game.state;
    const { k, open } = this.findCase(state);
    const offender = k ? state.characters.find((x) => x.id === k.offenderId) : null;
    const key = `${this.caseId}|${open}|${k?.verdict?.band ?? ''}|${k?.verdict?.served ?? ''}|${this.choice}|${this.restitution}|${open ? Math.floor((k.deadline - state.totalMinutes) / 30) : ''}|${offender?.coins ?? ''}|${(offender?.inventory ?? []).map((s) => s.kind + s.qty).join(',')}|${Boolean(courtOf(state))}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    if (!k) {
      this.body.replaceChildren(el('div', { className: 'case-empty', text: 'Bu dava dosyası artık yok.' }));
      return;
    }
    this.body.replaceChildren(...(open ? this.fileView(state, k, offender) : this.resultView(state, k)));
  }

  section(title, children) {
    return el('div', { className: 'case-section' }, [el('div', { className: 'case-section-title', text: title }), ...children]);
  }

  head(state, k, c) {
    const crime = CRIMES[k.crime]?.name ?? 'Suç';
    const place = k.buildingName ?? (k.victimName ? `${k.victimName} (kesesi)` : 'kasaba');
    const portrait = c
      ? el('img', { className: 'case-portrait', src: getCharacterPortraitURL(c.appearance, c.look), alt: c.name })
      : el('img', { className: 'case-portrait', src: getAnyIconURL('scales'), alt: '' });
    const stage = LIFE_STAGES[k.context?.ageStage]?.name ?? 'Yetişkin';
    return el('div', { className: 'case-head' }, [
      portrait,
      el('div', { className: 'case-head-text' }, [
        el('div', { className: 'case-title', text: crime }),
        el('div', { className: 'case-meta', text: `${k.offenderName} · ${stage} · Gün ${k.day} · ${place}` }),
      ]),
    ]);
  }

  fileView(state, k, c) {
    const now = state.totalMinutes;
    const building = Number.isInteger(k.buildingId) ? state.buildings.find((b) => b.id === k.buildingId) : null;
    const event = k.revealed ? fill(COURT_TEXT.revealed, { lostCap: caseText(k, 'unsolved', { buildingType: building?.type ?? null }).replace(/; kimse bir şey görmedi\.$/, ''), witness: k.revealed.witnessName, who: k.offenderName }) : caseText(k, 'caught', { buildingType: building?.type ?? null });
    const facts = caseFacts(state, k, tierName).map((r) => el('div', { className: 'case-fact' }, [el('span', { className: 'case-fact-label', text: r.label }), el('span', { className: 'case-fact-value', text: r.value })]));
    const witness = witnessText(k);
    const plea = pleaText(k);
    const urgent = k.deadline - now < 12 * 60;
    const options = sentenceOptions(state, k).map((o) => {
      const b = el('button', { className: `case-option${this.choice === o.key ? ' is-chosen' : ''}`, type: 'button', tabIndex: -1 }, [
        el('img', { src: getAnyIconURL(o.icon), alt: '' }),
        el('span', { className: 'case-option-name', text: o.name }),
        el('span', { className: 'case-option-detail', text: o.detail }),
      ]);
      b.dataset.sentence = o.key;
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        this.choice = o.key;
        this.lastKey = '';
      });
      return b;
    });
    const rs = restitutionStatus(state, k, c);
    const box = el('input', { type: 'checkbox', className: 'case-restitution-box' });
    box.checked = rs.possible && this.restitution;
    box.disabled = !rs.possible;
    box.addEventListener('change', () => {
      this.restitution = box.checked;
      this.lastKey = '';
    });
    const restitution = el('label', { className: `case-restitution${rs.possible ? '' : ' is-off'}` }, [
      box,
      el('span', { text: rs.possible ? `Çalınanı sahibine iade ettir (${lootText({ ...k.stolen, amount: rs.amount })}; bu bir ceza değil, iade)` : `Çalınanı sahibine iade ettir · ${rs.reason}` }),
    ]);
    const exileNote = [];
    if (this.choice === 'exile' && c) {
      const kin = kinOf(state, c);
      const names = kin.map((x) => x.name).join(', ');
      const kinText = kin.length ? `${COURT_TEXT.exileKin}. ${fill(COURT_TEXT.exileKinNamed, { names })}` : COURT_TEXT.exileAlone;
      exileNote.push(el('div', { className: 'case-warn', text: fill(COURT_TEXT.exileWarn, { who: c.name, kin: kinText }) }));
    }
    const decide = el('button', { className: 'hud-btn upgrade-button case-decide', type: 'button', tabIndex: -1, text: this.choice ? `Kararı ver: ${SENTENCES[this.choice].name}` : 'Önce bir ceza seç' });
    decide.disabled = !this.choice || !c;
    decide.addEventListener('mousedown', (e) => e.preventDefault());
    decide.addEventListener('click', () => {
      if (!this.choice) return;
      this.events.emit('ui:courtVerdict', { caseId: k.id, sentence: this.choice, restitution: this.restitution });
      this.lastKey = '';
    });
    return [
      this.head(state, k, c),
      el('div', { className: `case-deadline${urgent ? ' is-urgent' : ''}`, text: `Karar için kalan süre: ${leftText(k.deadline - now)} · oyun durmuyor` }),
      this.section('Olay', [el('p', { className: 'case-text', text: event }), ...(k.stolen ? [el('p', { className: 'case-text', text: `Çalınan: ${lootText(k.stolen)} (değeri ${k.stolen.value} altın)` })] : [])]),
      this.section('Suçlunun ifadesi', [el('p', { className: 'case-quote', text: `${k.offenderName}: "${statementText(k)}"` })]),
      this.section('Gerekçe ve bağlam', [el('div', { className: 'case-facts' }, facts)]),
      ...(witness ? [this.section('Tanık', [el('p', { className: 'case-quote', text: witness })])] : []),
      ...(plea ? [this.section('Kurbanın sözü', [el('p', { className: 'case-quote', text: plea })])] : []),
      this.section('Karar', [el('div', { className: 'case-options' }, options), restitution, ...exileNote, decide]),
    ];
  }

  resultView(state, k) {
    const v = k.verdict ?? {};
    const stale = Boolean(v.stale);
    const band = stale ? 'stale' : v.by === 'court' ? v.band ?? 'fair' : 'elder';
    const title = stale ? 'Dava sürüncemede kaldı' : v.by === 'court' ? `Halk kararı ${BANDS.names[band]?.toLocaleLowerCase('tr') ?? 'adil'} buldu` : 'Muhtar uyardı';
    const reason = stale ? fill(COURT_TEXT.stale, { who: k.offenderName }) : v.by === 'court' ? BAND_REASONS[band] : 'Dava Muhtar\'a gitti: "Bir daha olmasın."';
    const lines = verdictLines(k).map((t) => el('li', { text: t }));
    // (32.3) Kararın Krallık İtibarı hedefine etkisi (sicilde bu kararın olduğu ve olmadığı hâlin farkı)
    const impact = !stale && v.by === 'court' ? verdictRenownImpact(state, k) : 0;
    if (impact) lines.push(el('li', { className: `case-renown is-${impact < 0 ? 'down' : 'up'}`, text: `Krallık İtibarı'na etkisi: yarından itibaren hedef ${impact > 0 ? '+' : '−'}${Math.abs(impact)}` }));
    // (33.0) Karardan SONRA: halkın beklediği ceza aralığı (karardan önce hiçbir şey gösterilmez; bu yalnızca sonuç ekranındadır)
    if (!stale && v.by === 'court' && Number.isFinite(v.deserved)) {
      const names = fairSentenceNames(v.deserved);
      if (names.length) lines.push(el('li', { className: 'case-expected', text: fill(names.length > 1 ? COURT_TEXT.expectedRange : COURT_TEXT.expectedOne, { a: names[0], b: names[names.length - 1] }) }));
    }
    const close = el('button', { className: 'hud-btn upgrade-button case-decide', type: 'button', tabIndex: -1, text: 'Tamam' });
    close.addEventListener('mousedown', (e) => e.preventDefault());
    close.addEventListener('click', () => this.setOpen(false));
    return [
      this.head(state, k, state.characters.find((x) => x.id === k.offenderId) ?? null),
      el('div', { className: `case-result is-${band}` }, [
        el('div', { className: 'case-result-band', text: title }),
        el('div', { className: 'case-result-sentence', text: `Karar: ${SENTENCES[v.kind]?.name ?? 'Uyarı'}${v.served ? ` · ${COURT_TEXT.served}` : ''}` }),
        el('p', { className: 'case-text', text: reason }),
        el('ul', { className: 'case-effects' }, lines),
      ]),
      close,
    ];
  }
}
