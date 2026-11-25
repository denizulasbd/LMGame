// (32.5) Hobi evleri arayüzü: Yapı Bilgi Paneli'nin kulüp bölümü (üyeler: portre ve son 4 buluşmanın katılım işaretleri, Çıkar;
// sıradaki adaylar ve neden uygun oldukları, Davet et; sonraki buluşma; ürünler / tablo duvarı), sakin kartı rozeti, itibar dökümündeki
// "Kulüpler" satırı ve Arşiv özeti. Paneli yalnızca okur; düğmeler 'ui:clubKick' / 'ui:clubInvite' yayınlar. Şalter kapalıyken boş.
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { getCharacterPortraitURL } from '../../art/sprites/index.js';
import { CLUB, CLUB_KEYS, CLUBS } from '../../data/clubs.js';
import { RENOWN_TARGET } from '../../data/renown.js';
import { engineOn } from '../../systems/Engines.js';
import { membersOf, candidatesFor, nextSession, clock, clubName, isClubKey, renownClubShare, clubAdults, isActiveMember, clubVitality, farHouseWarning } from '../../systems/Clubs.js';

const text = (t, cls = '') => el('div', { className: `upgrade-text${cls ? ` ${cls}` : ''}`, text: t });
const pct = (r) => `%${Math.round(r * 100)}`;

function icon(name) {
  try {
    return el('img', { src: getAnyIconURL(name), alt: '' });
  } catch {
    return el('img', { src: getAnyIconURL('heart'), alt: '' });
  }
}

function button(label, title, onClick, disabled = false) {
  const b = el('button', { className: 'club-btn', type: 'button', text: label, title, disabled });
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', onClick);
  return b;
}

/** Değişim anahtarı (BuildingPanel): yalnızca bu değişince yeniden çizilir. */
export function clubKey(building, state) {
  if (!engineOn('clubs') || !isClubKey(building.type)) return '';
  const k = building.type;
  const members = membersOf(state, k).map((c) => `${c.id}:${c.club.missed}`).join(',');
  const cands = candidatesFor(state, k).slice(0, 5).map((e) => `${e.c.id}:${e.score}`).join(',');
  return `${members}|${cands}|${JSON.stringify(state.clubs?.[k] ?? null)}|${state.time.day}|${state.time.hour}`;
}

/** Yapı Bilgi Paneli bölümü (düğüm listesi; boşsa bölüm gizlenir). */
export function clubSection(building, state, { emit = () => {} } = {}) {
  if (!engineOn('clubs') || !isClubKey(building.type) || !building.functional) return [];
  const key = building.type;
  const def = CLUBS[key];
  const r = state.clubs?.[key] ?? {};
  const members = membersOf(state, key);
  const full = members.length >= CLUB.capacity;
  const next = nextSession(state, key);
  const live = r.live && r.live.day === state.time.day;
  const nodes = [
    el('div', { className: 'building-section-title', text: def.name }),
    el('div', { className: 'decree luxury-card club-card' }, [
      el('div', { className: 'decree-head' }, [icon(def.icon), `Üyeler ${members.length}/${CLUB.capacity}`, el('span', { className: 'decree-state', text: live ? 'Buluşmada' : next ? `${next.today ? 'Bugün' : `Gün ${next.day}`} ${clock(next.from)}` : '-' })]),
      text(live ? `Şu an buluşmada: ${r.live.came.length} üye geldi (${clock(Math.round(r.live.until % 1440))}'e dek)` : next ? `Sonraki buluşma: ${next.today ? 'bugün' : `Gün ${next.day}`} ${clock(next.from)}-${clock(next.to)} (en az ${CLUB.minSession} üye gerekir)` : 'Buluşma takvimi yok'),
      text(`Buluşma ${r.sessions ?? 0} · ürün ${r.products ?? 0}${key === 'gardenClub' ? ` · tarh ${r.works ?? 0}/${def.maxWorks}` : ''}${key === 'sewingClub' ? ` · mendil ${r.gifts ?? 0} · kış giysisi ${r.garments ?? 0}` : ''}${key === 'paintingClub' ? ` · tablo ${(r.paintings ?? []).length}/${def.maxWorks}` : ''}`),
    ]),
  ];
  // (32.6a) uzak kulüp evi uyarısı (üyelerin evlerine ortalama yol CLUB.farTiles karoyu aşarsa)
  const far = farHouseWarning(state, key, building);
  if (far) nodes.push(text(far, 'is-warn'));
  // üyeler: portre, ad, son 4 buluşmanın katılım işaretleri, Çıkar
  const att = r.attendance ?? [];
  if (members.length) {
    nodes.push(el('div', { className: 'club-list' }, members.map((c) => el('div', { className: 'club-row' }, [
      el('img', { className: 'club-portrait', src: getCharacterPortraitURL(c.appearance, c.look), alt: c.name }),
      el('span', { className: 'club-name', text: `${c.name}${isActiveMember(state, c) ? ' · etkin' : ''}` }),
      el('span', { className: 'club-marks', title: 'Son buluşmalar (eski → yeni)' }, att.map((ids) => el('span', { className: `club-mark${ids.includes(c.id) ? ' is-on' : ''}`, text: ids.includes(c.id) ? '●' : '○' }))),
      button('Çıkar', `${c.name} kulüpten çıkar (${CLUB.kickDays} gün kendiliğinden dönmez)`, () => emit('ui:clubKick', { characterId: c.id })),
    ]))));
  } else nodes.push(text('Henüz üye yok: kişiliği uygun sakinler gün dönümünde katılır'));
  // sıradaki adaylar
  const cands = candidatesFor(state, key).slice(0, 5);
  if (cands.length) {
    nodes.push(el('div', { className: 'club-subtitle', text: 'Sıradaki adaylar' }));
    nodes.push(el('div', { className: 'club-list' }, cands.map((e) => el('div', { className: 'club-row is-candidate' }, [
      el('img', { className: 'club-portrait', src: getCharacterPortraitURL(e.c.appearance, e.c.look), alt: e.c.name }),
      el('span', { className: 'club-name', text: `${e.c.name} · ${e.reasons.length ? e.reasons.join(' · ') : 'dostları üye'}`, title: `Yakınlık ${String(e.score).replace('.', ',')} (eşik ${CLUB.threshold})` }),
      button('Davet et', full ? 'Kulüp dolu' : `${e.c.name} kulübe davet et`, () => emit('ui:clubInvite', { key, characterId: e.c.id }), full),
    ]))));
  }
  // tablo duvarı
  if (key === 'paintingClub' && (r.paintings ?? []).length) {
    nodes.push(el('div', { className: 'club-subtitle', text: 'Atölye duvarı' }));
    nodes.push(el('div', { className: 'club-gallery' }, r.paintings.map((p) => el('div', { className: 'club-painting', text: `${p.title} (Gün ${p.day})` }))));
    if (r.exhibited) nodes.push(text(`Kasaba Sergisi: Gün ${r.exhibited}`));
  }
  nodes.push(text('Kulüpler küçük ve sıcak bir canlılık katar: altın getirmez, üretimi hızlandırmaz', 'is-muted'));
  return nodes;
}

/** Sakin kartı rozeti: { text, icon, cls } ya da null. */
export function clubTag(c) {
  if (!engineOn('clubs') || !c?.club) return null;
  const def = CLUBS[c.club.key];
  return def ? { text: def.member, icon: def.icon, cls: 'is-vigor' } : null;
}

/** (32.3 itibar dökümü) "Kulüpler +1,2 (etkin üye %20 · canlılık %80)" ya da null (hiç hobi evi / kayıt yokken). */
export function clubRenownLine(state) {
  if (!engineOn('clubs') || !state.clubs) return null;
  const adults = clubAdults(state);
  const n = Math.max(1, adults.length);
  const active = state.characters.filter((c) => !c.role && c.club && isActiveMember(state, c)).length;
  const v = Math.round(renownClubShare(state) * RENOWN_TARGET.clubs.weight * 10) / 10;
  return `Kulüpler +${String(v).replace('.', ',')} (etkin üye ${pct(active / n)} · canlılık ${pct(clubVitality(state))})`;
}

/** Arşiv (StatsPanel) için kısa özet. */
export function clubLedger(state) {
  if (!engineOn('clubs') || !state.clubs) return null;
  const parts = CLUB_KEYS.filter((k) => state.clubs[k] || state.buildings.some((b) => b.type === k)).map((k) => `${clubName(k)} ${membersOf(state, k).length} üye · ${state.clubs[k]?.sessions ?? 0} buluşma`);
  if (!parts.length) return null;
  const members = state.characters.filter((c) => c.club).length;
  return { title: 'Hobi Evleri ve Kulüpler', body: parts, meta: `kulüp üyesi ${members} sakin` };
}
