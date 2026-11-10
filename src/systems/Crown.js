// (22. aşama) Krallık katmanının saf hesapları (durum değiştirmez): vergi oranı ve verim çarpanı, takvim, Krallık Vergisi
// tutarı, itibar seviyesi, ferman ihtiyacı ve durumu, kötü şöhretin göçe etkisi. TownStatus da bunları kullanır; bu yüzden
// burada TownStatus içe aktarılmaz.
import { doctrineLevyMultiplier } from './Doctrine.js';
import { CIVIC_PROJECTS } from '../data/town.js';
import { TAX, TAX_RATES, LEVY, REPUTATION, DECREES, DECREE, EXODUS } from '../data/crown.js';
import { RESOURCES } from '../data/resources.js';
import { trustValue } from './Citizens.js';
import { isGoldenAge } from './GoldenAge.js';

export function emptyTax() {
  return { rate: TAX.defaultRate, nextAt: null, lockedUntil: 0, collections: 0, totalGold: 0, totalGoods: 0, last: null, log: [] };
}

export function emptyCrown() {
  return {
    reputation: REPUTATION.start,
    nextLevyAt: null,
    notice: null, // yoldaki tahsildar: { at, amount }
    levies: 0,
    paid: 0,
    failed: 0,
    lastLevy: null,
    decree: null, // süren ferman { id, kind, need, createdAt, deadline, baseline }
    nextDecreeAt: null,
    nextDecreeId: 1,
    delivered: 0,
    decreesFailed: 0,
    decreeLog: [],
    statueRight: false,
  };
}

export function emptyExodus() {
  return { lowSince: null, lastAt: null, active: false, startedAt: null, left: 0, coins: 0, items: 0, log: [] };
}

/** Takvimdeki sıradaki an: gün numarası `everyDays`'in katı olan günlerin `hour`'unda, `now`'dan sonra (oyun dakikası). */
export function nextOnSchedule(now, everyDays, hour) {
  let day = Math.max(everyDays, Math.ceil((Math.floor(now / 1440) + 1) / everyDays) * everyDays);
  while ((day - 1) * 1440 + hour * 60 <= now) day += everyDays;
  return (day - 1) * 1440 + hour * 60;
}

/** Seçili iç vergi kademesinin tanımı. */
export function taxRateOf(state) {
  return TAX_RATES[state.tax?.rate] ?? TAX_RATES[TAX.defaultRate];
}

/** Ağır Vergi seçili kaldıkça kasabanın çalışma hızı çarpanı (öteki kademelerde 1). */
export function taxWorkMultiplier(state) {
  return taxRateOf(state).workSpeed ?? 1;
}

/** (28.1) Vergi Fermanı kilidine kalan oyun dakikası (0 = kilit yok). */
export function taxLockLeft(state) {
  return Math.max(0, (state.tax?.lockedUntil ?? 0) - state.totalMinutes);
}

/** Bir sakinden bu oranla kesilecek altın (kesesi azsa 0). */
export function coinTax(c, percent) {
  if (c.isChild || c.role || (c.coins ?? 0) < TAX.minCoins) return 0;
  return Math.floor((c.coins * percent) / 100);
}

/** Bir sakinin çantasından alınacak öşür: { eşya: miktar } (her türden TAX.titheKeep kadarı bırakılır). */
export function titheOf(c, percent) {
  const out = {};
  if (c.isChild || c.role || percent <= 0) return out;
  for (const kind of Object.keys(TAX.tithe)) {
    const qty = (c.inventory ?? []).reduce((n, s) => n + (s.kind === kind ? s.qty : 0), 0);
    const take = Math.floor((Math.max(0, qty - TAX.titheKeep) * percent) / 100);
    if (take > 0) out[kind] = take;
  }
  return out;
}

/** Seçili (ya da verilen) oranla bir sonraki tahsilatın tahmini: { gold, goods, payers }. */
export function estimateTax(state, rateKey = state.tax?.rate) {
  const percent = (TAX_RATES[rateKey] ?? TAX_RATES[TAX.defaultRate]).percent;
  let gold = 0;
  let goods = 0;
  let payers = 0;
  for (const c of state.characters) {
    const g = coinTax(c, percent);
    const t = Object.values(titheOf(c, percent)).reduce((a, b) => a + b, 0);
    gold += g;
    goods += t;
    if (g + t > 0) payers += 1;
  }
  return { gold, goods, payers };
}

/** Krallık İtibarı'nın seviyesi. */
export function reputationLevel(value) {
  return REPUTATION.levels.find((l) => value >= l.min) ?? REPUTATION.levels[REPUTATION.levels.length - 1];
}

/** Bu kasabanın Krallık Vergisi (altın): seviye, nüfus, Altın Çağ ve itibarla ölçeklenir. */
export function levyAmount(state) {
  const tier = state.town?.tier ?? 1;
  const pop = state.characters.filter((c) => !c.role).length;
  const golden = isGoldenAge(state) ? LEVY.goldenAge : 1;
  const rep = reputationLevel(state.crown?.reputation ?? REPUTATION.start).levy;
  const trade = doctrineLevyMultiplier(state) * (state.civic?.tradeCharter ? CIVIC_PROJECTS.tradeCharter.levyMultiplier : 1); // (28.4) Ticaret Doktrini ve Beratı
  return Math.round((LEVY.base + LEVY.perTier * tier + LEVY.perResident * pop) * golden * rep * trade);
}

/**
 * Krallık Vergisi şimdi ödense nasıl ödenir: { ok, gold, goods: { kaynak: miktar }, short } — önce altın, yetmezse tutarın en
 * çok yarısı malla (1 altın = 2 birim yiyecek / odun / taş, en bol olandan).
 */
export function levyPlan(state, amount = levyAmount(state)) {
  const gold = Math.min(state.resources.gold ?? 0, amount);
  let rest = amount - gold;
  const goods = {};
  const kindMax = Math.floor(amount * LEVY.inKindShare);
  if (rest > 0 && rest <= kindMax) {
    const stock = LEVY.inKindResources.map((r) => [r, state.resources[r] ?? 0]).sort((a, b) => b[1] - a[1]);
    for (const [r, have] of stock) {
      if (rest <= 0) break;
      const units = Math.min(have, rest * LEVY.inKindPerGold);
      const covered = Math.floor(units / LEVY.inKindPerGold);
      if (covered <= 0) continue;
      goods[r] = covered * LEVY.inKindPerGold;
      rest -= covered;
    }
  }
  return { ok: rest <= 0, gold, goods, short: Math.max(0, rest) };
}

/** Fermanın kasaba seviyesine göre teslim edilecek kaynakları ({} araştırma / eser fermanında). */
export function decreeNeed(state, kind) {
  const def = DECREES[kind];
  return def?.need ? def.need(Math.max(1, Math.min(4, state.town?.tier ?? 1))) : {};
}

/** Ferman teslim edilebilir mi? { ok, reason, missing } */
export function decreeStatus(state, decree) {
  if (!decree) return { ok: false, reason: 'Süren ferman yok', missing: [] };
  const def = DECREES[decree.kind];
  if (def.kind === 'research') {
    const done = Object.keys(state.research?.done ?? {}).length;
    return done > (decree.baseline?.done ?? 0) ? { ok: true, reason: null, missing: [] } : { ok: false, reason: "Bilgelik Evi'nde bir araştırma tamamlanmalı", missing: [] };
  }
  if (def.kind === 'masterwork') {
    const stored = (state.masterworks?.items ?? []).some((i) => i.status === 'stored');
    return stored ? { ok: true, reason: null, missing: [] } : { ok: false, reason: 'Depoda (vitrinde değil) bir usta işi eser olmalı', missing: [] };
  }
  const missing = Object.entries(decree.need ?? {}).filter(([r, v]) => (state.resources[r] ?? 0) < v).map(([r]) => RESOURCES[r].name);
  return missing.length ? { ok: false, reason: `Eksik: ${missing.join(', ')}`, missing } : { ok: true, reason: null, missing };
}

/** Kasabada şu an terk ediş (umutsuzluk) sürüyor mu? */
export function isExodus(state) {
  return Boolean(state.exodus?.active);
}

/**
 * Kötü şöhretin göçe etkisi: { blocked, slow, text } — güven %35 altındayken (ya da terk ediş sürerken) göçmen gelmez,
 * %50 altındayken sabah en çok bir göçmen gelir.
 */
export function reputationForImmigration(state) {
  const trust = Math.round(trustValue(state));
  const exodus = isExodus(state);
  if (exodus) return { blocked: true, slow: true, text: 'Sakinler kasabayı terk ediyor: kötü şöhret yüzünden göçmen gelmiyor' };
  if (trust < EXODUS.immigrationBlockBelow) return { blocked: true, slow: true, text: `Kasabanın şöhreti kötü (güven %${trust}): göçmen gelmiyor` };
  if (trust < EXODUS.immigrationSlowBelow) return { blocked: false, slow: true, text: `Kasabanın şöhreti zayıf (güven %${trust}): sabah en çok 1 göçmen` };
  return { blocked: false, slow: false, text: `Kasabanın şöhreti iyi (güven %${trust})` };
}

/** Takvim yardımcısı: oyun dakikasını "Gün 12, 12:00" biçiminde yazar. */
export function formatStamp(minute) {
  const day = Math.floor(minute / 1440) + 1;
  const hour = Math.floor((minute % 1440) / 60);
  return `Gün ${day}, ${String(hour).padStart(2, '0')}:00`;
}

export { DECREE };
