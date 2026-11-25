// (32.2) Adalet Sarayı: Yapı Bilgi Paneli'nin saray bölümü (açık davalar, son kararlar, sayaçlar), üst çubuğun "Dava · {suçlu}"
// çipleri ve sakin kartındaki küçük "Dava dosyası" bağlantısı / ceza rozeti. Paneli yalnızca okur; istekleri olay olarak yayınlar:
// ui:openCase { id }. Dava penceresinin kendisi ./CaseModal.js'te. Şalter ENGINES.court kapalıyken hiçbir şey çizmez.
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { CRIMES, SENTENCES, BANDS, COURT } from '../../data/justice.js';
import { engineOn } from '../../systems/Engines.js';
import { courtOf, justiceRecord, impunityFactor, isBanned } from '../../systems/Justice.js';

function icon(name) {
  try {
    return el('img', { src: getAnyIconURL(name), alt: '' });
  } catch {
    return el('img', { src: getAnyIconURL('scroll'), alt: '' });
  }
}

const text = (t, cls = '') => el('div', { className: `upgrade-text${cls ? ` ${cls}` : ''}`, text: t });

/** "1 gün 4 sa", "5 sa", "40 dk". */
export function leftText(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m >= 1440) return `${Math.floor(m / 1440)} gün ${Math.floor((m % 1440) / 60)} sa`;
  if (m >= 60) return `${Math.floor(m / 60)} sa`;
  return `${m} dk`;
}

/** Saraydaki açık davalar, en acil önce. */
export function openCourtCases(state) {
  if (!courtOf(state)) return [];
  return (state.justice?.cases ?? []).filter((k) => k.court).sort((a, b) => a.deadline - b.deadline || a.id - b.id);
}

export function isUrgent(state, k) {
  return k.deadline - state.totalMinutes < COURT.urgentHours * 60;
}

/** Üst çubuk çipleri (Hud): [{ id, text, tip, urgent }]. */
export function caseChips(state) {
  return openCourtCases(state).map((k) => ({
    id: k.id,
    text: `Dava · ${k.offenderName}`,
    urgent: isUrgent(state, k),
    tip: {
      what: `${CRIMES[k.crime]?.name ?? 'Suç'}: ${k.offenderName} yargılanmayı bekliyor.`,
      why: k.revealed ? `${k.revealed.witnessName} sonunda konuştu.` : 'Suçüstü yakalandı; dava Adalet Sarayı\'na düştü.',
      left: `${leftText(k.deadline - state.totalMinutes)} içinde karar verilmezse sürüncemede kalır (Yönetim Güveni −2).`,
      effect: 'Tıkla: dava dosyasını aç. Oyun durmaz.',
    },
  }));
}

/** Değişim anahtarı (BuildingPanel): yalnızca bu değişince yeniden çizilir. */
export function justiceKey(building, state) {
  if (!engineOn('court') || building.type !== 'courthouse' || !building.functional) return '';
  const cases = openCourtCases(state).map((k) => `${k.id}:${Math.floor((k.deadline - state.totalMinutes) / 60)}`).join(',');
  const log = (state.justice?.log ?? []).filter((k) => k.verdict?.by === 'court').slice(-COURT.logShow).map((k) => `${k.id}${k.verdict.band ?? ''}${k.verdict.served ? 's' : ''}`).join(',');
  return `${cases}|${log}|${JSON.stringify(state.justice?.stats?.court ?? null)}|${impunityFactor(state).toFixed(2)}`;
}

/** Saray bölümünün düğümleri (boşsa []). emit(name, payload) olay yayını. */
export function justiceSection(building, state, { emit }) {
  if (!engineOn('court') || building.type !== 'courthouse' || !building.functional) return [];
  const now = state.totalMinutes;
  const cases = openCourtCases(state);
  const rows = cases.map((k) => {
    const urgent = isUrgent(state, k);
    const row = el('button', { className: `notice-row case-row${urgent ? ' is-urgent' : ''}`, type: 'button', title: 'Tıkla: dava dosyasını aç' }, [
      icon('scales'),
      el('span', { className: 'notice-body' }, [
        el('span', { className: 'notice-title', text: `${k.offenderName} · ${CRIMES[k.crime]?.name ?? 'Suç'}` }),
        el('span', { className: 'notice-text', text: `Gün ${k.day}${k.revealed ? ` · tanık: ${k.revealed.witnessName}` : ''}` }),
      ]),
      el('span', { className: 'notice-left', text: leftText(k.deadline - now) }),
    ]);
    row.addEventListener('mousedown', (e) => e.preventDefault());
    row.addEventListener('click', () => emit('ui:openCase', { id: k.id }));
    return row;
  });
  const recent = (state.justice?.log ?? []).filter((k) => k.verdict?.by === 'court').slice(-COURT.logShow).reverse();
  const verdictRows = recent.map((k) => {
    const v = k.verdict;
    const band = v.stale ? 'stale' : v.band ?? 'fair';
    const label = v.stale ? 'Sürüncemede' : BANDS.names[band];
    const row = el('button', { className: `notice-row case-row is-${band}`, type: 'button', title: 'Tıkla: kararın sonucunu aç' }, [
      icon(SENTENCES[v.kind]?.icon ?? 'scroll'),
      el('span', { className: 'notice-body' }, [
        el('span', { className: 'notice-title', text: `${k.offenderName} · ${SENTENCES[v.kind]?.name ?? 'Uyarı'}` }),
        el('span', { className: 'notice-text', text: `Gün ${v.day ?? k.closedDay} · ${CRIMES[k.crime]?.name ?? 'Suç'}${v.served ? ' · borcunu ödedi' : ''}` }),
      ]),
      el('span', { className: `case-band is-${band}`, text: label }),
    ]);
    row.addEventListener('mousedown', (e) => e.preventDefault());
    row.addEventListener('click', () => emit('ui:openCase', { id: k.id }));
    return row;
  });
  const rec = justiceRecord(state);
  const st = state.justice?.stats?.court ?? {};
  const imp = impunityFactor(state);
  const card = (iconName, head, badge, children) => el('div', { className: 'decree luxury-card' }, [el('div', { className: 'decree-head' }, [icon(iconName), head, el('span', { className: 'decree-state', text: badge })]), ...children]);
  return [
    el('div', { className: 'building-section-title', text: 'Adalet Sarayı' }),
    card('scales', 'Açık Davalar', cases.length ? `${cases.length} dava` : 'yok', [
      ...(rows.length ? [el('div', { className: 'notice-list' }, rows)] : [text('Bekleyen dava yok. Yakalanan suçlar buraya düşer.')]),
      text(`Her davaya ${COURT.deadlineDays} gün içinde karar ver; yoksa sürüncemede kalır. Oyun durmaz.`),
    ]),
    card('scroll', 'Son Kararlar', recent.length ? `${recent.length}` : 'yok', [
      ...(verdictRows.length ? [el('div', { className: 'notice-list' }, verdictRows)] : [text('Henüz karar verilmedi.')]),
    ]),
    card('trust', 'Adalet Defteri', rec.verdicts ? `%${Math.round(rec.fairRatio * 100)} adil` : '—', [
      text(`Adil ${st.fair ?? 0} · Sert ${st.harsh ?? 0} · Zalim ${st.cruel ?? 0} · Hafif ${st.lenient ?? 0} · Gevşek ${st.lax ?? 0}`),
      text(`Sürüncemede ${st.stale ?? 0} · Sürgün ${st.exiled ?? 0} · Sonradan konuşan tanık ${st.revealed ?? 0}`),
      text(imp > 1.001 ? `Cezasızlık: suç riski ×${imp.toFixed(2).replace('.', ',')} (hafif ve gevşek kararlar, sürüncemede kalan davalar; adil kararlar söndürür)` : 'Cezasızlık yok: kasaba adaletin işlediğini biliyor.', imp > 1.001 ? 'is-warn' : ''),
    ]),
  ];
}

/** Sakin kartı: ceza durumu ve açık davası (değişim anahtarı). */
export function sentenceKey(c, state) {
  if (!engineOn('court')) return '';
  const k = openCourtCases(state).find((x) => x.offenderId === c.id);
  const st = c.sentence;
  return `${k?.id ?? ''}|${st?.service ?? ''}|${isBanned(state, c) ? Math.ceil((st.banUntil - state.totalMinutes) / 1440) : ''}|${st?.exile ? 1 : ''}`;
}

/** Sakin kartı: "Dava dosyası" bağlantısı ve ceza rozeti (yoksa []). */
export function sentenceNodes(c, state, emit) {
  if (!engineOn('court')) return [];
  const out = [];
  const st = c.sentence;
  if (st?.exile) out.push(el('span', { className: 'purse-rioter is-leaving', text: 'Sürgün yolunda', title: 'Adalet Sarayı onu kasabadan sürdü; ailesi kalıyor' }));
  else if (st?.service > 0) out.push(el('span', { className: 'purse-rioter is-service', text: `Kamu hizmeti · ${Math.ceil(st.service)} sa`, title: 'Boş zamanında meydanı ve yolları süpürüyor (ücretsiz)' }));
  if (!st?.exile && isBanned(state, c)) out.push(el('span', { className: 'purse-rioter is-service', text: `Han ve Pazar yasağı · ${leftText(st.banUntil - state.totalMinutes)}`, title: 'Uzaklaştırma: Han\'a ve Pazar\'a giremez; evde ve kilerde yemek serbest' }));
  const k = openCourtCases(state).find((x) => x.offenderId === c.id);
  if (k) {
    const link = el('button', { className: 'case-link', type: 'button', tabIndex: -1, text: 'Dava dosyası', title: 'Adalet Sarayı\'ndaki açık davası' });
    link.addEventListener('mousedown', (e) => e.preventDefault());
    link.addEventListener('click', () => emit('ui:openCase', { id: k.id }));
    out.push(link);
  }
  return out;
}
