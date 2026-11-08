// (21. aşama) Vatandaş dilekçelerinin saf yardımcıları: bir dilekçenin karşılanıp karşılanmadığı, ilerleme metni ve
// "Hemen Karşıla"nın durumu. PetitionSystem ve arayüz (karakter kartı, yapı paneli) aynı hesabı kullanır.
import { PETITIONS, PETITION_KINDS } from '../data/citizens.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESEARCH } from '../data/research.js';
import { GOLDEN_AGE } from '../data/goldenAge.js';
import { RESOURCES } from '../data/resources.js';
import { foodSupply } from './TownStatus.js';
import { isRallyActive, rallyStatus } from './RallySystem.js';

// Dilekçe türüne göre "evin yakınında" aranan yapılar
export const PETITION_TYPES = {
  sapling: ['oakTree', 'birchTree', 'pineTree', 'cherryTree'],
  street: ['lantern', 'ironLantern', 'goldenLantern', 'bench', 'parkBench'],
};

/** Yapının evden (ayak izinin kenarından) karo cinsinden uzaklığı. */
export function distanceToHome(home, b) {
  const hs = BUILDINGS[home.type].size;
  const bs = BUILDINGS[b.type].size;
  const dx = Math.max(0, home.tileX - (b.tileX + bs.w - 1), b.tileX - (home.tileX + hs.w - 1));
  const dy = Math.max(0, home.tileY - (b.tileY + bs.h - 1), b.tileY - (home.tileY + hs.h - 1));
  return Math.max(dx, dy);
}

/** Evin yakınındaki (fidan / fener / bank) yapıların kimlikleri. */
export function nearHomeIds(state, homeId, kind) {
  const home = state.buildings.find((b) => b.id === homeId);
  if (!home) return [];
  const types = PETITION_TYPES[kind] ?? [];
  return state.buildings.filter((b) => types.includes(b.type) && distanceToHome(home, b) <= PETITIONS.nearHome).map((b) => b.id);
}

/** Dilekçe sahibinin evi (yoksa null). */
function homeOf(state, p) {
  const c = state.characters.find((x) => x.id === p.characterId);
  return c ? state.buildings.find((b) => b.id === c.homeId) ?? null : null;
}

const researchDone = (state) => Object.keys(state.research?.done ?? {}).length;

/** Dilekçe yerine getirildi mi? */
export function petitionMet(state, p) {
  const base = p.baseline ?? {};
  switch (p.kind) {
    case 'sapling':
    case 'street': {
      const c = state.characters.find((x) => x.id === p.characterId);
      if (!c) return false;
      const before = new Set(base.ids ?? []);
      return nearHomeIds(state, c.homeId, p.kind).some((id) => !before.has(id));
    }
    case 'academy':
      return state.buildings.some((b) => BUILDINGS[b.type].academy);
    case 'research':
      return researchDone(state) > (base.done ?? 0) || Boolean(state.research?.active && state.research.active.id !== base.active);
    case 'books':
      return (state.goldenAge?.books ?? 0) > (base.books ?? 0);
    case 'stock':
      return (state.resources.wood ?? 0) >= (p.target?.wood ?? 0) && foodSupply(state) >= (p.target?.food ?? 0);
    case 'tool': {
      const c = state.characters.find((x) => x.id === p.characterId);
      return c?.equipment?.tool === 'sturdyTool';
    }
    case 'gathering':
      return Boolean(p.met) || isRallyActive(state) || Boolean(state.events?.festival?.active);
    // (25.3) yeni nesil huyların dilekçeleri: hemen karşılanır ya da kasabadaki işlerle (yükseltme, vergi, şenlik)
    case 'craftTools':
      return Boolean(p.met) || state.buildings.filter((b) => CRAFT_TYPES.includes(b.type) && b.upgraded).length > (base.upgraded ?? 0);
    case 'marketFees':
      return Boolean(p.met) || ['low', 'exempt'].includes(state.tax?.rate);
    case 'sherbetCask':
      return Boolean(p.met) || Boolean(state.events?.festival?.active);
    // (25.4) Yeni Konut Talebi: (27.2) yalnızca çift gerçekten aynı çatı altında buluşunca karşılanır (yeni kulübe bitince
    // LineageSystem çifti oraya taşır; kulübe sayısının artması tek başına yetmez)
    case 'newHome': {
      const a = state.characters.find((x) => x.id === p.characterId);
      const b = state.characters.find((x) => x.id === base.partnerId);
      return Boolean(a && b && a.homeId !== null && a.homeId !== undefined && a.homeId === b.homeId);
    }
    default:
      return false;
  }
}

// (25.3) Atölye Malzemesi dilekçesinin "yükseltilmiş zanaat yapısı" sayımı
export const CRAFT_TYPES = ['workshop', 'lumberHut', 'healerHut', 'mill', 'loom', 'brewery'];

/** (25.3) Hanların toplam fıçısı ve en az biri boşsa ilk han (Fazladan Şerbet için). */
export function innForCask(state) {
  return state.buildings.find((b) => b.type === 'inn' && b.functional && (b.sherbet ?? 0) <= 9) ?? null;
}

/** İlerleme / ne yapılmalı metni (kartta ve panelde). */
export function petitionProgress(state, p) {
  switch (p.kind) {
    case 'sapling':
      return homeOf(state, p) ? `Evinin ${PETITIONS.nearHome} karo yakınına bir süs fidanı (Peyzaj) dik` : 'Önce bir evi olmalı';
    case 'street':
      return homeOf(state, p) ? `Evinin ${PETITIONS.nearHome} karo yakınına bir fener ya da bank koy` : 'Önce bir evi olmalı';
    case 'academy':
      return 'İnşa menüsünden bir Bilgelik Evi kur';
    case 'research':
      return "Bilgelik Evi'nin panelinden yeni bir araştırma başlat";
    case 'books':
      return `Gezgin tüccardan antik kitap al (kitaplıkta ${state.goldenAge?.books ?? 0}/${GOLDEN_AGE.maxBooks})`;
    case 'stock':
      return `Odun ${state.resources.wood ?? 0}/${p.target.wood} · Yiyecek ${Math.floor(foodSupply(state))}/${p.target.food}`;
    case 'tool':
      return "Zanaat Atölyesi'nde Sağlam Alet üret ya da hemen ver";
    case 'gathering':
      return 'Meydanda Toplanma Zili çal ya da bir şenlik düzenle';
    case 'craftTools':
      return 'Hemen karşıla (demir ve odun) ya da bir zanaat yapısını Seviye 2\'ye yükselt';
    case 'marketFees':
      return 'Hemen karşıla (Kasaba Hazinesi\'nden esnafa destek) ya da iç vergiyi Düşük / Muaf kademesine indir';
    case 'sherbetCask':
      return 'Hemen karşıla (depodan hana 3 fıçı) ya da meydanda bir şenlik düzenle';
    case 'newHome':
      return 'İnşa menüsünden yeni bir kulübe kur (çift oraya taşınır)';
    default:
      return '';
  }
}

/** "Hemen Karşıla" düğmesinin durumu: { available, ok, reason, cost, label }. */
export function grantStatus(state, p, toolStock = 0) {
  const def = PETITION_KINDS[p.kind];
  if (!def.grantLabel) return { available: false, ok: false, reason: null, cost: {}, label: null };
  const cost = p.kind === 'sapling' ? BUILDINGS.oakTree.cost : p.kind === 'street' ? BUILDINGS.bench.cost : def.grant ?? {};
  const out = { available: true, ok: true, reason: null, cost, label: def.grantLabel };
  if (p.kind === 'gathering') {
    const st = rallyStatus(state);
    return { ...out, cost: {}, ok: st.ok, reason: st.reason };
  }
  if (p.kind === 'tool' && toolStock > 0) return { ...out, cost: {}, reason: 'Depodaki Sağlam Alet verilir' };
  if (p.kind === 'sherbetCask' && !innForCask(state)) return { ...out, ok: false, reason: 'Fıçıya yer olan bir han yok' };
  if ((p.kind === 'sapling' || p.kind === 'street') && !homeOf(state, p)) return { ...out, ok: false, reason: 'Sakinin evi yok' };
  const missing = Object.entries(cost).filter(([r, v]) => (state.resources[r] ?? 0) < v).map(([r]) => RESOURCES[r].name);
  if (missing.length) return { ...out, ok: false, reason: `Yetersiz: ${missing.join(', ')}` };
  return out;
}

/** Bilgelik Evi'nde başlatılabilecek bir araştırma kaldı mı? */
export function researchLeft(state) {
  return Object.keys(RESEARCH).some((id) => !state.research?.done?.[id]);
}

/** Kalan süre metni: "1 gün 6 saat" / "5 saat". */
export function formatRemaining(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  if (days > 0) return `${days} gün${hours ? ` ${hours} saat` : ''}`;
  return hours > 0 ? `${hours} saat` : `${m % 60} dakika`;
}
