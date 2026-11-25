// (30.6, ENGINES.novicePath) Para ve Akış: oyuncuya "altın nereden gelir, malı kim üretir" sorusunu cevaplayan SAF hesaplar.
// Durum yazmaz, zar çekmez. Altın kalemleri EconomySystem.ledger'dan (kaydedilmez), yollar ve üreticiler data/buildings.js'ten okunur.
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { TOWN_TIERS } from '../data/town.js';
import { CROPS } from '../data/crops.js';
import { levyAmount } from './Crown.js';
import { CLUB_KEYS } from '../data/clubs.js';

const tierName = (t) => TOWN_TIERS[Math.max(1, Math.min(TOWN_TIERS.length, t)) - 1].name;
const tierOf = (state) => state.town?.tier ?? 1;

/** Gelir kalemi adları (EconomySystem.add'in `source` parametresi). */
export const INCOME_LABELS = { tax: 'vergi', export: 'ihracat', contract: 'sözleşme', sale: 'satış', decree: 'ferman', event: 'olay', raid: 'ganimet' };

/** Son `days` günün (bugün dahil) altın gelir kalemleri: { toplam, kalemler: [{ id, ad, miktar }] } (büyükten küçüğe). */
export function recentIncome(ledger, today, days = 3) {
  const sums = {};
  for (let d = today - days + 1; d <= today; d++) for (const [k, v] of Object.entries(ledger?.[d] ?? {})) sums[k] = (sums[k] ?? 0) + v;
  const items = Object.entries(sums).map(([id, amount]) => ({ id, name: INCOME_LABELS[id] ?? id, amount })).sort((a, b) => b.amount - a.amount);
  return { total: items.reduce((a, b) => a + b.amount, 0), items };
}

/** Yaklaşan ödemeler: [{ id, text, amount, inDays }] (Krallık Vergisi, süren ferman cezası). */
export function upcomingPayments(state) {
  const out = [];
  const now = state.totalMinutes;
  const cr = state.crown;
  if (cr && Number.isFinite(cr.nextLevyAt)) {
    const amount = cr.notice?.amount ?? levyAmount(state);
    out.push({ id: 'levy', text: 'Krallık Vergisi', amount, inDays: Math.max(0, Math.ceil((cr.nextLevyAt - now) / 1440)), announced: Boolean(cr.notice) });
  }
  return out;
}

/** Bir yapının kilidi: { open, text } — kasaba seviyesi yetmiyorsa "Köy seviyesinde açılır". */
export function buildingAccess(state, type) {
  const def = BUILDINGS[type];
  const have = state.buildings.some((b) => b.type === type && b.functional);
  if (have) return { open: true, have: true, text: `${def.name} var` };
  if (def.requiresTier && tierOf(state) < def.requiresTier) return { open: false, have: false, text: `${tierName(def.requiresTier)} seviyesinde ${def.name} açılır` };
  return { open: true, have: false, text: `${def.name} kur` };
}

/** "Altın kazanmanın yolları": { id, name, open, text } — open: o yolla şimdi altın gelebilir. */
export function goldWays(state) {
  const tier = tierOf(state);
  const way = (id, name, open, text) => ({ id, name, open, text });
  const harbor = buildingAccess(state, 'harbor');
  const post = buildingAccess(state, 'tradingPost');
  const workshop = state.buildings.some((b) => b.type === 'workshop' && b.functional);
  return [
    way('tax', 'İç vergi', true, `açık · her ${3} günde bir sakinlerin kesesinden (oranı Belediye Konağı / meydan havuzundan seç)`),
    way('event', 'Karar olayları', true, 'açık · "Kervana sat" gibi seçenekler (Bereketli Hasat)'),
    way('decree', 'Kraliyet Fermanı ödülü', tier >= 2, tier >= 2 ? 'açık · fermanı süresinde teslim et' : `kilitli · ${tierName(2)} seviyesinde ferman gelmeye başlar`),
    way('sale', 'Usta işi eser satışı', workshop && (harbor.have || tier >= 1), workshop ? 'açık · eseri limana ya da tüccara sat' : 'kilitli · Zanaat Atölyesi usta işi eser yapar'),
    way('export', 'Ticaret Limanı ihracatı', harbor.have, harbor.have ? 'açık · stok sınırı aşılınca fazlalık satılır' : `kilitli · ${harbor.text}`),
    way('contract', 'Ticaret İskelesi sözleşmeleri', post.have, post.have ? 'açık · gelen gemiye mal sözleşmesi' : `kilitli · ${post.text}`),
  ];
}

/** Üst çubuktaki altın sayacının ipucu metni (satırlar). */
export function goldTooltip(state, ledger) {
  const lines = [`Kasaba Hazinesi: ${state.resources.gold ?? 0} altın`];
  const inc = recentIncome(ledger, state.time.day, 3);
  lines.push(inc.items.length ? `Son 3 gün gelir: +${inc.total} (${inc.items.map((i) => `${i.name} ${i.amount}`).join(', ')})` : 'Son 3 gün gelir: yok');
  const pay = upcomingPayments(state);
  lines.push(pay.length ? `Yaklaşan: ${pay.map((p) => `${p.text} ${p.amount} altın (${p.inDays === 0 ? 'bugün' : `${p.inDays} gün sonra`})`).join(' · ')}` : 'Yaklaşan ödeme: yok');
  lines.push('', 'Altın kazanmanın yolları:');
  for (const w of goldWays(state)) lines.push(`${w.open ? '✓' : '✗'} ${w.name}: ${w.text}`);
  return lines;
}

/** Bir malı üreten yapı türleri (açılış seviyesine göre sıralı). */
export function producerTypes(resource) {
  const out = [];
  for (const [type, def] of Object.entries(BUILDINGS)) {
    if (!def.buildable) continue;
    const makes = def.production?.resource === resource
      || def.production?.extra?.[resource] !== undefined
      || def.processing?.output?.[resource] !== undefined
      || (def.crops ?? []).some((c) => CROPS[c]?.resource === resource);
    if (makes) out.push(type);
  }
  if (resource === 'gears') out.push('workshop');
  return [...new Set(out)].sort((a, b) => (BUILDINGS[a].requiresTier ?? 1) - (BUILDINGS[b].requiresTier ?? 1));
}

/**
 * Mallar listesi satırı: üreten yapı yokken "Yün · Koyun Ağılı üretir (Köy seviyesinde açılır)".
 * { text, type, open } — type: tıklayınca inşa menüsünde seçilecek yapı (kilitliyse null).
 */
export function goodsHint(state, resource) {
  const types = producerTypes(resource);
  const name = RESOURCES[resource].name;
  if (!types.length) return { text: `${name} · üreten yapı yok`, detail: 'üreten yapı yok', type: null, open: false };
  const type = types[0];
  const def = BUILDINGS[type];
  const tier = tierOf(state);
  const crop = (def.crops ?? []).find((c) => CROPS[c]?.resource === resource);
  const label = crop && def.production?.resource !== resource ? `${def.name} (ekim tercihi: ${CROPS[crop].shortName})` : def.name;
  const locked = def.requiresTier && tier < def.requiresTier;
  const unmet = !locked && def.requiresBuilding && !state.buildings.some((b) => b.type === def.requiresBuilding.type && b.functional);
  const tail = locked ? `${tierName(def.requiresTier)} seviyesinde açılır` : unmet ? `önce ${BUILDINGS[def.requiresBuilding.type].name} gerekir` : 'şimdi kurulabilir';
  const detail = `${label} üretir (${tail})`;
  return { text: `${name} · ${detail}`, detail, type: locked || unmet ? null : type, open: !locked };
}

/** Hazine ya da taş "kuruduğunda" önerilecek en kolay altın yolu (rehber kartı). */
export function easiestGoldWay(state) {
  const rate = state.tax?.rate;
  if (rate === 'exempt' || rate === 'low') return 'Vergi oranını Standart yap (Belediye Konağı ya da meydan havuzu).';
  const open = goldWays(state).filter((w) => w.open && !['tax'].includes(w.id));
  if (state.crown?.decree) return 'Süren Kraliyet Fermanını teslim et: ödülü altın.';
  const pick = open.find((w) => w.id === 'export') ?? open.find((w) => w.id === 'contract');
  if (pick) return `${pick.name}: ${pick.text.replace('açık · ', '')}.`;
  return 'Sakinler çalışıp kazandıkça Standart Vergi altın getirir; nüfusu ve yapıları artır.';
}

/** Taşın kalıcı kaynağı: kayalar tükenince ya da taş 2 gün 0'da kalınca. */
export function stoneSource(state) {
  const a = buildingAccess(state, 'quarry');
  return a.have ? 'Taş Ocağı var; işçisi çalıştırıyor mu bak.' : a.open ? `Taş için bir **Taş Ocağı** kur (${costText(BUILDINGS.quarry)}; kayalık bir alanın yanına): kayalar bitse de taş akar.` : `Taş için ${a.text}.`;
}

const costText = (def) => Object.entries(def.cost ?? {}).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ');

/** Bir yapı gerekiyorsa "Pazar Yeri gerekir · 40 odun, 15 taş" (kilitliyse açılış seviyesi), yapı varsa null. */
function needBuilding(state, type) {
  const a = buildingAccess(state, type);
  if (a.have) return null;
  const def = BUILDINGS[type];
  if (!a.open) return a.text;
  const unmet = def.requiresBuilding && !state.buildings.some((b) => b.type === def.requiresBuilding.type && b.functional);
  return unmet ? `önce ${BUILDINGS[def.requiresBuilding.type].name}, sonra ${def.name} · ${costText(def)}` : `${def.name} gerekir · ${costText(def)}`;
}

/** "Sıradaki" hedefi engelleyen şey (tek satır, "Pazar Yeri gerekir · 40 odun, 15 taş") ya da null. */
export function milestoneBlocker(state, milestone, progress = null) {
  if (!milestone) return null;
  const left = progress ? Math.max(0, progress.target - progress.current) : 0;
  switch (milestone.kind) {
    case 'buildingsCompleted': return null;
    case 'mealsCooked': return needBuilding(state, 'inn') ?? 'Handa yemek pişirilmesini bekle: aşçı için bir sakin işe girmeli';
    case 'trades': return needBuilding(state, 'market') ?? 'Gezgin tüccar tezgâha gelince ona tıkla ve takas yap';
    case 'population': return left ? `${left} sakin daha gerekir · yatak (Kulübe) ve yiyecek` : null;
    case 'masters': return left ? `${left} sakin daha ustalaşmalı · aynı mesleği çalıştır` : null;
    case 'petitionsMet': return left ? `${left} dilekçe daha karşıla · üstteki çipe tıkla` : null;
    case 'pulseStreak': return 'Halkın Nabzı Memnun olmalı · vergiyi hafiflet, dilekçeleri karşıla';
    case 'condolences': return 'Bir sakin vefat edince anma töreninde Taziye Sofrası kur';
    case 'doctrine': return needBuilding(state, 'townHall') ?? 'Belediye Konağı panelinden bir doktrin seç';
    case 'heirloomPassed': return 'Bir yadigâr sahibi vefat edince bir sonraki kuşağa devredilir';
    case 'wintersSurvived': return 'Kışı kimseyi kaybetmeden atlat · kışlık yiyecek ve odun biriktir';
    case 'streets': return 'Sokak Feneri ve Taş Yol: Yol & Zemin sekmesinden';
    case 'monument': return needBuilding(state, 'monument') ?? null;
    case 'wonder': return needBuilding(state, 'wonder') ?? null;
    // (32.6b) geç oyun hedefleri
    case 'justiceServed': return needBuilding(state, 'courthouse') ?? 'Suç yakalanınca dava açılır: dava penceresinde hak edilene yakın bir ceza seç (adil karar)';
    case 'firstClub': return state.buildings.some((b) => CLUB_KEYS.includes(b.type) && b.functional) ? 'Üyeler 2 günde bir akşam kulüp evinin önünde buluşur: en az 3 uygun üye gerekir' : needBuilding(state, 'gardenClub');
    case 'firstGraduate': return needBuilding(state, 'university') ?? 'Bilgelik Evi\'ni bitiren bir genç (18-20) Darülfünun\'a kabul edilir; 540 dakikalık dersle mezun olur';
    case 'royalFavorite': return 'Adil kararlar, güven, refah, eğitim ve kulüpler itibarı yükseltir; Halkın Nabzı\'nı iyi tut';
    default: return null;
  }
}
