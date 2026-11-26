// (30.2) Hikâye kartlarının SAF mantığı: olay yükünden kart metni, süzgeç, kuyruk, gün özeti, "Yakından izle" listesi.
// Durum yazmaz, zar çekmez, saat okumaz: aynı olay yükü her zaman aynı kartı verir. Olayları dinleyen ve gerçek zamanla
// kartları ilerleten yönetici systems/StoryDirector.js'tedir; çizim components/StoryFeed.js'te.
//
// Kart = { event, priority, text, portraits: [{ id, name, appearance, look, isChild }], ids: [kimlikler], go, action, story?, day, key }
//   go     : null | { kind: 'character', id } | { kind: 'building', id }   ("Git" düğmesi nereye götürür)
//   action : null | { type: 'story' | 'condolence' | 'gift' | 'case', label, id? }   ((32.2) 'case': dava penceresini açar)
import { UNIVERSITY_TEXT } from '../data/university.js'; // (32.4)
import { fieldName } from './University.js'; // (32.4)
import { CLUB_TEXT } from '../data/clubs.js'; // (32.5)
import { clubName } from './Clubs.js'; // (32.5)
import { STORY_PRIORITY, STORY_LIMITS as L, STORY_FILTERS, STORY_DEFAULT_FILTER, STORY_ACTIONS, STORY_TEXT } from '../data/storyCards.js';
import { SPECIAL_KIND_NAMES } from '../data/rites.js';
import { wantName } from './Wants.js';
import { WANTS, FEARS } from '../data/wants.js';
import { condolenceStatus, giftStatus, riteVenue } from './Rites.js';
import { loyaltyTier } from './Loyalty.js';
import { foodSupply } from './TownStatus.js';
import { genitive, accusative } from '../utils/turkish.js';
import { engineOn } from './Engines.js';
import { courtOf } from './Justice.js';
import { COURT_TEXT } from '../data/justice.js';
import { PARCEL_TEXT } from '../data/parcels.js'; // (34.2)

export function filterKeyOf(value) {
  return STORY_FILTERS[value] ? value : STORY_DEFAULT_FILTER;
}

const portrait = (c) => (c ? { id: c.id, name: c.name, appearance: c.appearance, look: c.look, isChild: Boolean(c.isChild) } : null);
const portraits = (...list) => list.filter(Boolean).map(portrait).slice(0, 2);
const kindName = (kind) => (kind === 'anniversary' ? 'evlilik yıl dönümü' : 'doğum günü');

/** İlk cümle (yaşam öyküsünden). */
export function firstSentence(text) {
  const t = String(text ?? '').trim();
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : t;
}

/** Olaydaki sakinler (kimlikler): izleme süzgeci ve "Git" için. */
export function involvedIds(card) {
  return card.ids ?? [];
}

/** (30.3) Dilek / korku kartının üçüncü ağız cümlesi: "{ad} {told}." (told yoksa eski biçim). */
export function toldText(kind, c, entry) {
  const def = (kind === 'fear' ? FEARS : WANTS)[entry?.key];
  if (def?.told) return `${c.name} ${def.told.replace('{who}', entry.whoName ?? 'biri')}.`;
  return kind === 'fear' ? `${genitive(c.name)} korktuğu başına geldi: ${wantName('fear', entry)}.` : `${genitive(c.name)} dileği oldu: ${wantName('want', entry)}.`;
}

const base = (event, text, chars, extra = {}) => {
  const ps = portraits(...chars);
  return { event, priority: STORY_PRIORITY[event], text, portraits: ps, ids: chars.filter(Boolean).map((c) => c.id), go: ps[0] ? { kind: 'character', id: ps[0].id } : null, action: null, ...extra };
};

/**
 * Olay yükünden kart (ya da kart gerektirmeyen olay için null).
 * ctx: { state, day, story? } — story: ölenin yaşam öyküsü (vefattan önce hesaplanır), journal: sistemin günlük metni.
 */
export function makeCard(event, p = {}, ctx = {}) {
  const state = ctx.state;
  const day = ctx.day ?? state?.time?.day ?? 0;
  let card = null;
  switch (event) {
    case 'population:died': {
      const c = p.character;
      if (!c) return null;
      const first = firstSentence(ctx.story) || p.text || '';
      const venue = state ? riteVenue(state) : null;
      card = base(event, `${c.name} aramızdan ayrıldı.${first ? ` ${first}` : ''}`, [c], {
        go: venue ? { kind: 'building', id: venue.id } : null,
        action: { type: 'story', label: STORY_ACTIONS.story },
        story: String(ctx.story ?? p.text ?? '').slice(0, L.storyChars * 2),
        key: `died:${c.id}`,
      });
      break;
    }
    case 'rite:started': {
      const names = p.rite?.names ?? [];
      if (!names.length) return null;
      const venue = p.rite?.place ?? (state ? riteVenue(state)?.id : null);
      const ids = (p.ids ?? []).slice(0, 2).map((id) => state?.characters.find((c) => c.id === id)).filter(Boolean);
      card = base(event, `${names.join(' ve ')} için anma töreni başlıyor.`, ids, {
        go: Number.isFinite(venue) ? { kind: 'building', id: venue } : null,
        action: { type: 'condolence', label: STORY_ACTIONS.condolence },
        key: `rite:${p.rite?.day}:${names.join()}`,
      });
      break;
    }
    case 'relationship:married':
      if (!p.a || !p.b) return null;
      card = base(event, `${p.a.name} ile ${p.b.name} evlendi.`, [p.a, p.b]);
      break;
    case 'family:childBorn': {
      const [a, b] = p.parents ?? [];
      if (!p.child) return null;
      card = base(event, a && b ? `${a.name} ile ${genitive(b.name)} bir evladı oldu: ${p.child.name}.` : `${p.child.name} dünyaya geldi.`, [a, p.child]);
      break;
    }
    case 'trait:evolved': {
      const c = p.character;
      if (!c) return null;
      card = base(event, ctx.journal || `${c.name} artık eskisi gibi değil.`, [c]);
      break;
    }
    case 'special:morning': {
      const c = p.character;
      if (!c) return null;
      const kind = p.kind ?? 'birthday';
      card = base(event, `Bugün ${genitive(c.name)} ${kindName(kind)}.`, [c], { action: { type: 'gift', id: c.id, label: STORY_ACTIONS.gift }, key: `special:${day}:${c.id}` });
      break;
    }
    case 'special:forgotten': {
      const c = p.character;
      if (!c) return null;
      card = base(event, `${genitive(c.name)} ${kindName(p.kind ?? 'birthday')}nü kimse hatırlamadı.`, [c]);
      break;
    }
    case 'want:fulfilled': {
      if (!p.character || !(p.points >= L.wantMin)) return null;
      // (30.3) kartta üçüncü ağız: "Mehmet gönlüne göre birini buldu." (WANTS[].told)
      card = base(event, toldText('want', p.character, p.want), [p.character]);
      break;
    }
    case 'fear:realized': {
      if (!p.character || !(p.points >= L.fearMin)) return null;
      card = base(event, toldText('fear', p.character, p.fear), [p.character]);
      break;
    }
    case 'parcel:bought':
      // (34.2) kasaba genişledi: "Doğu Çayırı artık bizim!" (portre yok; "Git" yok)
      if (!p.parcel) return null;
      card = base(event, PARCEL_TEXT.story(p.parcel.name), [], { go: null, key: `parcel:${p.parcel.id}` });
      break;
    case 'pantry:low':
      // (30.3) kiler bir günden az yeter ("Git" kileri seçer)
      card = base(event, 'Kiler boşalıyor: yiyecek bir günden az yeter.', [], { go: Number.isFinite(p.buildingId) ? { kind: 'building', id: p.buildingId } : null, key: `pantry:${day}` });
      break;
    case 'storm:struck':
    case 'crisis:raidResolved': {
      // (30.6) hasar nerede? Ne oldu ve hangi yapılar hasarlı; "Git" ilk hasarlı yapıyı seçer
      if (!engineOn('novicePath')) return null;
      const list = event === 'storm:struck' ? (p.damaged ?? []) : [state?.buildings.find((b) => b.id === p.damagedId)].filter(Boolean);
      const names = list.map((b) => b.name).filter(Boolean);
      if (!names.length) return null;
      const what = event === 'crisis:raidResolved' ? 'Haydutlar baskın yaptı' : p.kind === 'wolves' ? 'Kurtlar Koyun Ağılı\'na daldı' : p.winter ? 'Kar fırtınası vurdu' : 'Fırtına vurdu';
      card = base(event, `${what}: ${names.join(', ')} hasarlı. Ustalar onarır; hemen onarmak için yapıya tıkla.`, [], { go: { kind: 'building', id: list[0].id }, key: `damage:${day}:${event}` });
      break;
    }
    case 'dilemma:resolved': {
      // (30.4b) karar sonrası: sonucu anlatan kart (kişili olayda konu sakinin portresi)
      if (!p.dilemma?.midgame || !p.result) return null;
      const chars = (p.targetIds ?? []).map((id) => state?.characters.find((c) => c.id === id)).filter(Boolean);
      card = base(event, p.result, chars, { key: `dilemma:${p.id}:${day}` });
      break;
    }
    case 'crime:caught':
    case 'crime:unsolved': {
      // (32.1) suç: yakalanan (suçlu ve tanık portresi, "Git" suçluyu seçer) ya da kayıp (portresiz, "Git" yeri seçer)
      const k = p.kase;
      if (!k || !p.text) return null;
      const caught = event === 'crime:caught';
      const chars = caught ? [p.character, p.witness] : [];
      const go = caught ? null : p.building ? { kind: 'building', id: p.building.id } : p.victim ? { kind: 'character', id: p.victim.id } : null;
      // (32.2) Adalet Sarayı varken dava saraya düşer: kartta "Dava dosyası" (courtOf, ENGINES.court kapalıyken hep null)
      const court = caught && state && courtOf(state);
      card = base(event, court ? `${p.text} ${COURT_TEXT.opened}` : p.text, chars, { key: `crime:${k.id}`, crime: true, ...(caught ? {} : { go }), ...(court ? { action: { type: 'case', id: k.id, label: STORY_ACTIONS.case } } : {}) });
      break;
    }
    case 'court:verdict': {
      // (32.2) karar: sert / zalim önemli (öncelik 4), adil / hafif / gevşek kısa kart
      if (!p.kase || !p.text) return null;
      const heavy = p.band === 'harsh' || p.band === 'cruel';
      card = base(event, p.text, [p.character, p.victim], { key: `court:v:${p.kase.id}`, ...(heavy ? { priority: 4 } : {}) });
      break;
    }
    case 'court:exiled':
      if (!p.character || !p.text) return null;
      card = base(event, p.text, (p.kin ?? []).slice(0, 2), { key: `court:x:${p.character.id}` });
      break;
    case 'court:revealed':
      if (!p.kase || !p.text) return null;
      card = base(event, p.text, [p.character, p.witness], { key: `court:r:${p.kase.id}`, action: { type: 'case', id: p.kase.id, label: STORY_ACTIONS.case } });
      break;
    case 'court:stale':
      if (!p.kase || !p.text) return null;
      card = base(event, p.text, [p.character], { key: `court:s:${p.kase.id}` });
      break;
    case 'renown:tier': {
      // (32.3) Krallık İtibarı kademesi: Gözde'ye çıkış ve Şüpheli'ye düşüş önemli (4)
      if (!p.text) return null;
      const heavy = (p.up && p.key === 'favored') || (!p.up && p.key === 'bad');
      card = base(event, p.text, [], { key: `renown:t:${day}:${p.key}`, ...(heavy ? { priority: 4 } : {}) });
      break;
    }
    case 'renown:grant':
      if (!p.key || !p.name) return null;
      card = base(event, `Kraliyet Lütufnamesi geldi: ${p.name} kurma izni! (İnşa Et → Kraliyet Lütfu)`, [], { key: `renown:g:${p.key}`, once: true, action: { type: 'letter', id: p.key, label: STORY_ACTIONS.letter } });
      break;
    case 'university:admitted':
    case 'university:graduated':
    case 'university:dropped': {
      // (32.4) Darülfünun: "Zeynep Darülfünun'u Şifacılık bölümünden bitirdi."
      if (!p.character || !p.field) return null;
      const t = UNIVERSITY_TEXT[event.slice(11)];
      const text = t.replace('{name}', p.character.name).replace('{field}', fieldName(p.field)).replace('{pct}', String(Math.floor((p.ratio ?? 0) * 100)));
      card = base(event, text, [p.character], { key: `uni:${event.slice(11, 13)}:${p.character.id}`, ...(p.first ? { once: true } : {}) }); // (32.6a) ilk mezun tek seferlik
      break;
    }
    case 'club:founded':
    case 'club:work':
    case 'club:exhibition': {
      // (32.5) Hobi evleri: kuruluş (ilk 3 üye), ürün kilometre taşları, Kasaba Sergisi. "Yalnızca önemli"de günde en çok bir kulüp kartı.
      const people = (p.members ?? (p.ids ?? []).map((id) => state?.characters.find((c) => c.id === id))).filter(Boolean);
      const go = p.building ? { kind: 'building', id: p.building.id } : null;
      if (event === 'club:founded') {
        if (!p.key || people.length < 3) return null;
        const text = CLUB_TEXT.founded.replace('{club}', clubName(p.key)).replace('{names}', people.slice(0, 3).map((c) => c.name).join(', '));
        card = base(event, text, people.slice(0, 3), { key: `club:f:${p.key}`, club: true, once: true, go });
      } else if (event === 'club:work') {
        if (!p.key || !p.text) return null;
        const chars = [...(p.recipient ? [p.recipient] : []), ...people].slice(0, 3);
        card = base(event, p.text, chars, { key: `club:w:${p.key}:${p.kind}:${p.n ?? 0}`, club: true, go, ...(p.milestone ? { priority: STORY_PRIORITY['club:milestone'] } : {}) });
      } else {
        if (!p.text) return null;
        card = base(event, p.text, people.slice(0, 3), { key: `club:x:${p.key}`, club: true, once: true, go });
      }
      break;
    }
    case 'apprentice:grandmaster':
      if (!p.character) return null;
      card = base(event, `${p.character.name} Başusta oldu.`, [p.character]);
      break;
    case 'masterwork:created':
      if (!p.character) return null;
      card = base(event, `${p.character.name} usta işi bir eser yaptı${p.piece?.name ? `: ${p.piece.name}` : ''}.`, [p.character]);
      break;
    case 'relationship:partnered':
      if (!p.a || !p.b) return null;
      card = base(event, `${p.a.name} ile ${p.b.name} birbirine âşık oldu.`, [p.a, p.b]);
      break;
    case 'chemistry:kindred':
      if (!p.a || !p.b) return null;
      card = base(event, `${p.a.name} ile ${p.b.name} ruh ikizi oldu.`, [p.a, p.b]);
      break;
    case 'loyalty:changed': {
      const c = p.character;
      if (!c) return null;
      const tier = loyaltyTier(p.to);
      card = base(event, tier === 'bitter' ? `${c.name} yönetime kırgın.` : tier === 'loyal' ? `${c.name} yönetime sadık.` : '', [c]);
      if (!card.text) return null;
      break;
    }
    case 'moodlet:mourning':
      if (!p.character) return null;
      card = base(event, p.whoName ? `${p.character.name}, ${p.whoName} için yas tutuyor.` : `${p.character.name} yas tutuyor.`, [p.character]);
      break;
    case 'moodlet:consoled':
      if (!p.by || !p.character) return null;
      card = base(event, `${p.by.name}, yasta olan ${accusative(p.character.name)} teselli etti.`, [p.by, p.character]);
      break;
    case 'family:grownUp':
      if (!p.character) return null;
      card = base(event, `${p.character.name} büyüdü, artık genç bir sakin.`, [p.character]);
      break;
    case 'venerable:became':
      if (!p.character) return null;
      card = base(event, `${p.character.name} Saygın Büyük oldu, artık kasabanın bilgesi.`, [p.character]);
      break;
    case 'relationship:quarrel':
      if (!p.a || !p.b) return null;
      if (!p.firstToday && !ctx.watchedForce) return null; // o günün ilk atışması
      card = base(event, `${p.a.name} ile ${p.b.name} atıştı.`, [p.a, p.b]);
      break;
    case 'relationship:reconciled':
      if (!p.a || !p.b) return null;
      card = base(event, `${p.a.name} ile ${p.b.name} barıştı.`, [p.a, p.b]);
      break;
    default:
      return null;
  }
  if (!card) return null;
  card.day = day;
  card.key ??= `${event}:${card.ids.join(',')}:${day}`;
  return card;
}

/** Sakin kimliği olaylarından hangileri bu kartı izlenen sakin kartı yapar. */
export function isWatchedCard(card, watched) {
  return Boolean(watched?.length) && card.ids.some((id) => watched.includes(id));
}

/** Süzgeç: kart gösterilir mi? Kapalıyken hiçbir kart; izlenen sakinin her olayı süzgeçten bağımsızdır. */
export function allows(card, filter, watched = []) {
  const f = STORY_FILTERS[filterKeyOf(filter)];
  if (f.min === Infinity) return false;
  return card.priority >= f.min || isWatchedCard(card, watched);
}

/**
 * Kuyruğa ekler: aynı anahtarlı kart tekrar girmez; sınır aşılırsa önceliği en düşük (eşitse en eski) atılır.
 * Dönüş: { queue, dropped: kart | null, added: bool }
 */
export function enqueue(queue, card, limit = L.queue) {
  if (queue.some((c) => c.key === card.key)) return { queue, dropped: null, added: false };
  const next = [...queue, card];
  if (next.length <= limit) return { queue: next, dropped: null, added: true };
  // (32.6a) tek seferlik kart (once: kuruluş, sergi, lütuf, ilk mezun) atılacak kart olarak seçilmez (hepsi tek seferlikse eski kural)
  let worst = -1;
  for (let i = 0; i < next.length; i++) if (!next[i].once && (worst < 0 || next[i].priority < next[worst].priority)) worst = i;
  if (worst < 0) {
    worst = 0;
    for (let i = 1; i < next.length; i++) if (next[i].priority < next[worst].priority) worst = i;
  }
  const dropped = next.splice(worst, 1)[0];
  return { queue: next, dropped, added: dropped !== card };
}

/** Kuyrukta sıradaki kartın dizini (en yüksek öncelik, eşitte en eski); boşsa -1. */
export function nextIndex(queue) {
  let best = -1;
  for (let i = 0; i < queue.length; i++) if (best < 0 || queue[i].priority > queue[best].priority) best = i;
  return best;
}

/** Gün özeti kartı: kart olamayan olaylardan en önemli üçü ("Bugün kasabada: …"). Olay yoksa null. */
export function daySummary(missed, day) {
  if (!missed.length) return null;
  const ranked = missed.map((c, i) => ({ c, i })).sort((a, b) => b.c.priority - a.c.priority || a.i - b.i).slice(0, L.summaryItems).map((x) => x.c);
  const text = `${STORY_TEXT.summaryLead} ${ranked.map((c) => c.text.replace(/\.$/, '')).join('; ')}.`;
  const chars = [];
  for (const c of ranked) for (const pt of c.portraits) if (!chars.some((x) => x.id === pt.id) && chars.length < 2) chars.push(pt);
  return {
    event: 'story:summary',
    priority: STORY_PRIORITY['story:summary'],
    text,
    portraits: chars,
    ids: chars.map((x) => x.id),
    go: chars[0] ? { kind: 'character', id: chars[0].id } : null,
    action: null,
    day,
    key: `summary:${day}`,
    summary: true,
  };
}

/** "Yakından izle" listesi: kimliği ekler / çıkarır (en çok watchedMax). Dönüş: { list, ok }. */
export function toggleWatched(list, id, max = L.watchedMax) {
  if (list.includes(id)) return { list: list.filter((x) => x !== id), ok: true, on: false };
  if (list.length >= max) return { list, ok: false, on: false };
  return { list: [...list, id], ok: true, on: true };
}

/** Ölen / ayrılan sakinleri düşürür. */
export function pruneWatched(list, state) {
  return list.filter((id) => state.characters.some((c) => c.id === id));
}

/** Kayıttaki izleme listesi: yinelenenler ve sayı dışı değerler atılır, en çok watchedMax. */
export function restoreWatched(data) {
  if (!Array.isArray(data)) return [];
  return [...new Set(data.filter((x) => Number.isInteger(x) && x >= 0))].slice(0, L.watchedMax);
}

/** Eylem düğmesinin durumu: { show, enabled, reason }. Kart kullanıldıysa pasif. */
export function actionStatus(state, card) {
  const a = card.action;
  if (!a) return { show: false, enabled: false, reason: '' };
  if (a.type === 'story') return { show: true, enabled: true, reason: '' };
  if (card.used) return { show: true, enabled: false, reason: 'Yapıldı' };
  if (a.type === 'gift') {
    const c = state.characters.find((x) => x.id === a.id);
    const st = c ? giftStatus(state, c) : { ok: false, reason: 'Sakin yok' };
    return { show: st.ok, enabled: st.ok, reason: st.reason ?? '' };
  }
  if (a.type === 'condolence') {
    const st = condolenceStatus(state, foodSupply(state));
    return { show: st.ok, enabled: st.ok, reason: st.reason ?? '' };
  }
  if (a.type === 'letter') return { show: true, enabled: true, reason: '' }; // (32.3)
  if (a.type === 'case') {
    // (32.2) dava hâlâ açıksa dosya açılır
    const open = Boolean(state.justice?.cases?.some((k) => k.id === a.id)) && Boolean(courtOf(state));
    return { show: open, enabled: open, reason: open ? '' : 'Karara bağlandı' };
  }
  return { show: false, enabled: false, reason: '' };
}

export { SPECIAL_KIND_NAMES };
