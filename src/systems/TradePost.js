// (24.3) Dış ticaretin saf hesapları (durum değiştirmez). Sayılar data/tradePost.js'te.
//   emptyTradePost() / restoreTradePost(data) : kayıttaki dış ticaret durumu
//   nextArrival(total, days)  : total dakikasından en az days gün sonraki varış saati (oyun dakikası)
//   contractsFor(visit)       : o ziyaretin üç ihracat talebi (Kumaş, Fıçı Şerbeti + sırayla Ekmek / Erzak / Yün)
//   priceMultiplier(state, r) : malın pazar çarpanı (doygunluk; 1 = tam fiyat)
//   contractPrice(state, c)   : sözleşmenin şu anki altın karşılığı
//   contractStatus(state, i)  : i. sözleşme tamamlanabilir mi { ok, reason, gold }
//   importStatus(state, kind) : ithalat paketi alınabilir mi { ok, reason }
//   shipDocked(state)         : gemi / kervan şu an kasabada mı
import { RESOURCES } from '../data/resources.js';
import { VISIT, CONTRACTS, FIXED_CONTRACTS, ROTATING_CONTRACTS, MARKET, IMPORTS } from '../data/tradePost.js';
import { storageLimit } from './Granary.js';

export function emptyTradePost() {
  return { ship: null, nextShipAt: null, visits: 0, market: {}, streak: { resource: null, count: 0 }, completed: 0, imports: 0, goldEarned: 0, goldSpent: 0, exported: {}, imported: {}, log: [], lastSold: [] };
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function restoreTradePost(data) {
  const out = emptyTradePost();
  if (!data || typeof data !== 'object') return out;
  out.nextShipAt = Number.isFinite(data.nextShipAt) ? data.nextShipAt : null;
  out.visits = Math.max(0, Math.floor(num(data.visits)));
  for (const r of Object.keys(CONTRACTS)) {
    const m = num(data.market?.[r], 1);
    if (m < 1) out.market[r] = Math.max(MARKET.floor, Math.min(1, m));
  }
  const sr = data.streak?.resource;
  out.streak = CONTRACTS[sr] ? { resource: sr, count: Math.max(0, Math.floor(num(data.streak.count))) } : { resource: null, count: 0 };
  for (const k of ['completed', 'imports', 'goldEarned', 'goldSpent']) out[k] = Math.max(0, Math.floor(num(data[k])));
  for (const k of ['exported', 'imported']) {
    for (const [r, v] of Object.entries(data[k] ?? {})) if (RESOURCES[r] && num(v) > 0) out[k][r] = Math.floor(num(v));
  }
  out.lastSold = Array.isArray(data.lastSold) ? data.lastSold.filter((r) => CONTRACTS[r]) : [];
  out.log = Array.isArray(data.log) ? data.log.filter((e) => e && typeof e.text === 'string').slice(-8) : [];
  const s = data.ship;
  if (s && Number.isFinite(s.arrivedAt) && Number.isFinite(s.leavesAt) && Array.isArray(s.contracts)) {
    out.ship = {
      arrivedAt: s.arrivedAt,
      leavesAt: s.leavesAt,
      mode: s.mode === 'caravan' ? 'caravan' : 'ship',
      contracts: s.contracts.filter((c) => c && CONTRACTS[c.resource]).map((c) => ({ resource: c.resource, qty: Math.max(1, Math.floor(num(c.qty, CONTRACTS[c.resource].qty))), gold: Math.max(1, Math.floor(num(c.gold, CONTRACTS[c.resource].gold))), done: Boolean(c.done), ...(c.done && num(c.paid) > 0 ? { paid: Math.floor(num(c.paid)) } : {}) })),
      stock: Object.fromEntries(Object.keys(IMPORTS).map((k) => [k, Math.max(0, Math.min(IMPORTS[k].stock, Math.floor(num(s.stock?.[k], IMPORTS[k].stock))))])),
      sold: Array.isArray(s.sold) ? s.sold.filter((r) => CONTRACTS[r]) : [],
    };
  }
  return out;
}

/** total dakikasından en az `days` gün sonraki, VISIT.arrivalHour'daki varış (oyun dakikası). */
export function nextArrival(total, days) {
  const target = total + days * 1440;
  const day = Math.floor(target / 1440);
  const at = day * 1440 + VISIT.arrivalHour * 60;
  return at >= target ? at : at + 1440;
}

/** Ziyaret aralığı (gün): sırayla 3, 4, 3, 4... */
export function intervalFor(visit) {
  const list = VISIT.intervalDays;
  return list[visit % list.length];
}

/** Ziyaretin talepleri: Kumaş, Fıçı Şerbeti ve sırayla Ekmek / Erzak / Yün. */
export function contractsFor(visit) {
  const kinds = [...FIXED_CONTRACTS, ROTATING_CONTRACTS[visit % ROTATING_CONTRACTS.length]];
  return kinds.map((resource) => ({ resource, qty: CONTRACTS[resource].qty, gold: CONTRACTS[resource].gold, done: false }));
}

export function priceMultiplier(state, resource) {
  return state.tradePost?.market?.[resource] ?? 1;
}

export function contractPrice(state, contract) {
  return Math.max(1, Math.round(contract.gold * priceMultiplier(state, contract.resource)));
}

export function shipDocked(state) {
  const ship = state.tradePost?.ship;
  return Boolean(ship && state.totalMinutes < ship.leavesAt);
}

/** İskele / konak işliyor mu (tamamlanmış, hasarsız, yanmıyor). */
export function tradePostReady(state) {
  return state.buildings.some((b) => b.type === 'tradingPost' && b.functional && !b.damaged && !b.isBurning);
}

export function contractStatus(state, index) {
  const ship = state.tradePost?.ship;
  const c = ship?.contracts?.[index];
  if (!c) return { ok: false, reason: 'Böyle bir talep yok', gold: 0 };
  const gold = contractPrice(state, c);
  if (c.done) return { ok: false, reason: 'Bu sözleşme tamamlandı', gold };
  if (!shipDocked(state)) return { ok: false, reason: 'Gemi / kervan kasabada değil', gold };
  if (!tradePostReady(state)) return { ok: false, reason: 'Ticaret İskelesi çalışmıyor', gold };
  const have = state.resources[c.resource] ?? 0;
  if (have < c.qty) return { ok: false, reason: `Yetersiz ${RESOURCES[c.resource].name.toLocaleLowerCase('tr')} (${have}/${c.qty})`, gold };
  return { ok: true, reason: null, gold };
}

export function importStatus(state, kind) {
  const def = IMPORTS[kind];
  if (!def) return { ok: false, reason: 'Böyle bir paket yok' };
  if (!shipDocked(state)) return { ok: false, reason: 'Tüccar kasabada değil' };
  if (!tradePostReady(state)) return { ok: false, reason: 'Ticaret İskelesi çalışmıyor' };
  if ((state.tradePost.ship.stock?.[kind] ?? 0) <= 0) return { ok: false, reason: 'Bu ziyarette tüccarın stoğu bitti' };
  const gold = def.give.gold;
  if ((state.resources.gold ?? 0) < gold) return { ok: false, reason: `Yetersiz altın (${state.resources.gold ?? 0}/${gold})` };
  for (const [r, v] of Object.entries(def.get)) {
    if ((state.resources[r] ?? 0) + v > storageLimit(state, r)) return { ok: false, reason: `${RESOURCES[r].name} deposunda yer yok` };
  }
  return { ok: true, reason: null };
}
