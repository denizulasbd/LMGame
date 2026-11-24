// (31. aşama) Kasaba Süsleri: Yapı Bilgi Paneli'nin süs bölümleri (İlan Tahtası'nın açık işler listesi, Odun Yığını, Korkuluk,
// Müzik Köşkü'nün Akşam Konseri, Kahraman Heykeli'nin onurlandırma seçimi). Paneli yalnızca okur; istekleri olay olarak yayınlar:
// ui:selectCharacter, ui:selectBuilding, ui:startConcert { buildingId }, ui:honorStatue { buildingId, characterId }.
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { NOTICE_BOARD, WOODPILE, SCARECROW, BANDSTAND, HERO_STATUE } from '../../data/townDecor.js';
import { storageLimit } from '../../systems/Granary.js';
import { engineOn } from '../../systems/Engines.js';
import {
  noticeItems,
  woodpileHeatingFactor,
  gardensGuarded,
  concertStatus,
  isConcert,
  bardInTown,
  statueCandidates,
  statueKin,
} from '../../systems/TownDecor.js';

const POSE_NAMES = { hammer: 'çekiç', book: 'kitap', rod: 'olta', sickle: 'orak' };

function icon(name) {
  try {
    return el('img', { src: getAnyIconURL(name), alt: '' });
  } catch {
    return el('img', { src: getAnyIconURL('scroll'), alt: '' });
  }
}

function card(iconName, head, state, children) {
  return el('div', { className: 'decree luxury-card' }, [el('div', { className: 'decree-head' }, [icon(iconName), head, el('span', { className: 'decree-state', text: state })]), ...children]);
}

const text = (t, active = false) => el('div', { className: `upgrade-text${active ? ' is-active' : ''}`, text: t });

function hallOf(state) {
  return state.buildings.find((x) => x.functional && BUILDINGS[x.type].civic) ?? state.buildings.find((x) => x.functional && x.type === 'fountain') ?? null;
}

/** Değişim anahtarı: panel yalnızca bu değişince yeniden çizilir. */
export function decorKey(building, state) {
  if (!engineOn('townDecor') || !building.functional) return '';
  switch (building.type) {
    case 'noticeBoard':
      return noticeItems(state).map((i) => `${i.key}:${i.left}:${i.urgent}`).join(',');
    case 'woodpile':
      return `${Math.floor(state.resources.wood ?? 0)}/${storageLimit(state, 'wood')}`;
    case 'scarecrow':
      return gardensGuarded(state, building).map((g) => g.id).join(',');
    case 'bandstand': {
      const st = concertStatus(state, building);
      return `${st.ok}|${st.reason}|${isConcert(state)}|${bardInTown(state)}|${building.decor?.concerts ?? 0}`;
    }
    case 'heroStatue': {
      const d = building.decor;
      if (Number.isFinite(d?.honoreeId)) return `h${d.honoreeId}|${statueKin(state, d.honoreeId).length}`;
      return statueCandidates(state).slice(0, 8).map((c) => c.id).join(',');
    }
    default:
      return '';
  }
}

/**
 * Süs bölümünün düğümleri (boşsa []). button(label, title, onClick) panelin düğme üreticisi; emit(name, payload) olay yayını.
 */
export function decorSection(building, state, { button, emit }) {
  if (!engineOn('townDecor') || !building.functional) return [];
  switch (building.type) {
    case 'noticeBoard':
      return noticeSection(state, emit);
    case 'woodpile':
      return woodpileSection(building, state);
    case 'scarecrow':
      return scarecrowSection(building, state);
    case 'bandstand':
      return bandstandSection(building, state, button, emit);
    case 'heroStatue':
      return statueSection(building, state, button, emit);
    default:
      return [];
  }
}

function noticeSection(state, emit) {
  const items = noticeItems(state);
  const hall = hallOf(state);
  const rows = items.map((item) => {
    const go = () => {
      if (item.target?.case !== undefined) emit('ui:openCase', { id: item.target.case }); // (32.2) dava dosyası
      else if (item.target?.character !== undefined) emit('ui:selectCharacter', item.target.character);
      else if (hall) emit('ui:selectBuilding', hall.id);
    };
    const row = el('button', { className: `notice-row${item.urgent ? ' is-urgent' : ''}`, type: 'button', title: 'Tıkla: ilgili sakini ya da yönetim binasını aç' }, [
      icon(item.icon),
      el('span', { className: 'notice-body' }, [
        el('span', { className: 'notice-title', text: item.title }),
        el('span', { className: 'notice-text', text: [item.text, item.need ? `İstenen: ${item.need}.` : ''].filter(Boolean).join(' ') }),
      ]),
      el('span', { className: 'notice-left', text: item.left ?? '' }),
    ]);
    row.addEventListener('click', go);
    return row;
  });
  const urgent = items.filter((i) => i.urgent).length;
  return [
    el('div', { className: 'building-section-title', text: 'Açık İşler' }),
    card('scroll', 'İlan Tahtası', items.length ? `${items.length} iş${urgent ? ` · ${urgent} acil` : ''}` : 'boş', [
      ...(rows.length ? [el('div', { className: 'notice-list' }, rows)] : [text('Bekleyen bir iş yok: kasaba sakin.')]),
      text(`Tahta varken yeni dilekçeler komşulara duyurulur: süreleri ${Math.round(NOTICE_BOARD.petitionExtraMinutes / 60)} saat uzar.`),
    ]),
  ];
}

function woodpileSection(building, state) {
  const homes = state.buildings.filter((b) => b.type === 'cabin' && b.functional && woodpileHeatingFactor(state, b) < 1).length;
  const wood = Math.floor(state.resources.wood ?? 0);
  return [
    el('div', { className: 'building-section-title', text: 'Odun Yığını' }),
    card('wood', 'Kışlık odun', `${wood}/${storageLimit(state, 'wood')}`, [
      text(`Yalnızca oduna +${WOODPILE.capacity} depo (kasabadaki her yığın ayrı sayılır).`),
      text(homes ? `Çevresindeki ${homes} ev kışın %${Math.round((1 - WOODPILE.heatingFactor) * 100)} daha az odun yakar.` : `${WOODPILE.radius} karo yakınında ev yok: kışın ısınmaya katkısı olmaz.`, !homes),
    ]),
  ];
}

function scarecrowSection(building, state) {
  const gardens = gardensGuarded(state, building);
  return [
    el('div', { className: 'building-section-title', text: 'Korkuluk' }),
    card('basket', 'Bahçe bekçisi', gardens.length ? `${gardens.length} bahçe` : 'bahçe yok', [
      text(gardens.length ? `${SCARECROW.radius} karo yakınındaki ${gardens.length} bahçeye kuş dadanmıyor: +%${Math.round(SCARECROW.gardenBonus * 100)} verim (bahçe başına bir korkuluk sayılır).` : `${SCARECROW.radius} karo yakınında Sebze Bahçesi yok: korkuluk şimdilik yalnızca süs.`, !gardens.length),
    ]),
  ];
}

function bandstandSection(building, state, button, emit) {
  const st = concertStatus(state, building);
  const live = isConcert(state) && state.rally.venueId === building.id;
  const bard = bardInTown(state);
  const go = button(
    live ? 'Konser sürüyor' : `Akşam Konseri · ${BANDSTAND.concertGold} altın`,
    st.ok ? `Sakinler ${Math.round(BANDSTAND.minutes / 60)} saat köşkün önünde toplanır` : st.reason,
    () => emit('ui:startConcert', { buildingId: building.id })
  );
  go.disabled = !st.ok;
  return [
    el('div', { className: 'building-section-title', text: 'Müzik Köşkü' }),
    card('melody', 'Akşam Konseri', live ? 'çalıyor' : `${building.decor?.concerts ?? 0} konser`, [
      text(`${BANDSTAND.startHour}:00 ile ${BANDSTAND.lastStartHour}:59 arasında, ${BANDSTAND.cooldownDays} günde bir. Uyanık sakinler ${Math.round(BANDSTAND.minutes / 60)} saat köşkün önünde toplanır; dinleyenlerin keyfi ve sosyalliği dolar, bitince Yönetim Güveni +${BANDSTAND.trust}.`),
      text(bard ? `Seyyar Ozan kasabada: konserde sahneye çıkar, etkisi ${BANDSTAND.bardMul} katı.` : 'Seyyar Ozan kasabaya geldiğinde konser verirsen sahneye çıkar (etkisi iki katı).', bard),
      ...(st.ok || live ? [] : [text(st.reason, true)]),
      el('div', { className: 'upgrade-row' }, [go]),
    ]),
  ];
}

function statueSection(building, state, button, emit) {
  const d = building.decor;
  if (Number.isFinite(d?.honoreeId)) {
    const alive = state.characters.find((c) => c.id === d.honoreeId);
    const kin = statueKin(state, d.honoreeId);
    const pick = alive ? button(`${alive.name} kartını aç`, 'Onurlandırılan sakini seç', () => emit('ui:selectCharacter', alive.id)) : null;
    return [
      el('div', { className: 'building-section-title', text: 'Künye' }),
      card('masterpiece', `${d.honoreeName}`, `${d.honoredDay}. gün`, [
        text(`Bronz figürün elinde ${POSE_NAMES[d.pose] ?? 'çekiç'} var.${alive ? '' : ' Artık aramızda değil; adı künyede yaşıyor.'}`),
        text(kin.length ? `Ailesinden ${kin.length} kişi heykelin önünden geçtikçe gururlanıyor (${HERO_STATUE.radius} karo).` : 'Kasabada yaşayan yakını yok.'),
        ...(pick ? [el('div', { className: 'upgrade-row' }, [pick])] : []),
      ]),
    ];
  }
  const list = statueCandidates(state).slice(0, 8);
  const buttons = list.map((c) => {
    const b = button(c.name, `${c.name} adına heykel dök`, () => emit('ui:honorStatue', { buildingId: building.id, characterId: c.id }));
    b.classList.add('statue-pick');
    return b;
  });
  return [
    el('div', { className: 'building-section-title', text: 'Kimin heykeli olsun?' }),
    card('masterpiece', 'Heykeli Ada', 'örtülü', [
      text('Bir sakin seç: adı altın künyeye kazınır, figürün elindeki alet ustalığına göre dökülür. Seçim kalıcıdır.'),
      ...(buttons.length ? [el('div', { className: 'statue-picks' }, buttons)] : [text('Heykeli dikilebilecek yetişkin sakin yok.', true)]),
    ]),
  ];
}
