// (21. aşama) Vatandaşlık katmanının saf yardımcıları (durum değiştirenler yalnızca verilen sakini / durumu değiştirir):
// kişisel kese ve çanta, Yönetim Güveni'nin seviyesi, isyanın durumu. Sayılar src/data/citizens.js'te.
//
// Çanta: c.inventory = [{ kind, qty, name? }] — her yuvada tek tür eşya istiflenir (ITEMS[kind].stack kadar). Yuva sayısı
// INVENTORY.slots (4); Sırt Çantası kuşanmış yetişkinde +2 (6), çocukta 2. Ekipman yuvalarına (alet, kıyafet, çanta)
// dokunulmaz, yalnızca okunur.
import { ITEMS, INVENTORY, PURSE, TRUST } from '../data/citizens.js';

// ---------------------------------------------------------------------------
// Kese
// ---------------------------------------------------------------------------

/** Yeni sakinin (ya da eski kayıttaki sakinin) başlangıç harçlığı. */
export function startingCoins(child) {
  return child ? PURSE.allowance.child : PURSE.allowance.adult;
}

/** Keseye para ekler (eksi değer harcar; 0'ın altına inmez). Gerçekten eklenen / harcanan miktarı döndürür. */
export function addCoins(c, amount) {
  const before = c.coins ?? 0;
  c.coins = Math.max(0, Math.min(PURSE.max, Math.floor(before + amount)));
  return c.coins - before;
}

/** Kesesi yetiyorsa öder (true); yetmiyorsa hiçbir şey harcamaz. */
export function payCoins(c, amount) {
  if ((c.coins ?? 0) < amount) return false;
  c.coins -= amount;
  return true;
}

// ---------------------------------------------------------------------------
// Çanta
// ---------------------------------------------------------------------------

/** Çantanın yuva sayısı: 4, Sırt Çantası kuşanmışsa 6, çocukta 2. */
export function inventoryCapacity(c) {
  if (c.isChild) return INVENTORY.childSlots;
  return INVENTORY.slots + (c.equipment?.bag === 'backpack' ? INVENTORY.backpackSlots : 0);
}

/** Kayıttan gelen çantayı temizler: bilinmeyen eşyalar atlanır, miktarlar sınırlanır, aynı tür birleşir. */
export function sanitizeInventory(list) {
  const out = [];
  for (const slot of Array.isArray(list) ? list : []) {
    const def = slot && ITEMS[slot.kind];
    const qty = Math.floor(Number(slot?.qty) || 0);
    if (!def || qty <= 0) continue;
    const same = def.stack > 1 ? out.find((s) => s.kind === slot.kind && s.qty < def.stack) : null;
    if (same) {
      const room = def.stack - same.qty;
      same.qty += Math.min(room, qty);
      if (qty > room) out.push({ kind: slot.kind, qty: Math.min(def.stack, qty - room) });
      continue;
    }
    out.push({
      kind: slot.kind,
      qty: Math.min(def.stack, qty),
      ...(typeof slot.name === 'string' ? { name: slot.name.slice(0, 32) } : {}),
      // (25.5) yadigârın hikâyesi ve devir zinciri
      ...(def.heirloom ? { heirloom: sanitizeHeirloomMeta(slot.heirloom) } : {}),
    });
  }
  return out;
}

/** Bu türden çantada kaç tane var? */
export function countItem(c, kind) {
  return (c.inventory ?? []).reduce((n, s) => n + (s.kind === kind ? s.qty : 0), 0);
}

/** Bu türden kaç tane daha sığar (mevcut yığınlardaki boşluk + boş yuvalar)? */
export function roomFor(c, kind) {
  const def = ITEMS[kind];
  if (!def) return 0;
  const inv = c.inventory ?? [];
  let room = 0;
  for (const s of inv) if (s.kind === kind) room += Math.max(0, def.stack - s.qty);
  room += Math.max(0, inventoryCapacity(c) - inv.length) * def.stack;
  return room;
}

/** Çantaya eşya koyar (sığdığı kadar). Gerçekten konan miktarı döndürür. */
export function addItem(c, kind, qty = 1, name = null) {
  const def = ITEMS[kind];
  if (!def || qty <= 0) return 0;
  c.inventory ??= [];
  let left = Math.floor(qty);
  // Adlı eşya (hatıra) ayrı yuvada durur
  if (!name) {
    for (const s of c.inventory) {
      if (left <= 0) break;
      if (s.kind !== kind || s.name) continue;
      const take = Math.min(left, def.stack - s.qty);
      s.qty += take;
      left -= take;
    }
  }
  while (left > 0 && c.inventory.length < inventoryCapacity(c)) {
    const take = Math.min(left, def.stack);
    c.inventory.push({ kind, qty: take, ...(name ? { name } : {}) });
    left -= take;
  }
  return Math.floor(qty) - left;
}

/** Çantadan eşya çıkarır (en son konulandan). Gerçekten çıkan miktarı döndürür. */
/** (25.5) Yadigâr bilgisi: { ownerId, ownerName, story, since, chain: [ad, ...] }. */
export function sanitizeHeirloomMeta(m) {
  const o = m && typeof m === 'object' ? m : {};
  return {
    ownerId: Number.isFinite(o.ownerId) ? o.ownerId : null,
    ownerName: typeof o.ownerName === 'string' ? o.ownerName : null,
    story: typeof o.story === 'string' ? o.story.slice(0, 200) : 'Kuşaktan kuşağa aktarılan bir aile yadigârı.',
    since: Number.isFinite(o.since) ? o.since : 1,
    chain: (Array.isArray(o.chain) ? o.chain : []).filter((n) => typeof n === 'string').slice(-8),
  };
}

/** (25.5) Çantadaki yadigâr yuvası (yoksa null). */
export function heirloomSlot(c) {
  return (c?.inventory ?? []).find((s) => ITEMS[s.kind]?.heirloom) ?? null;
}

export function takeItem(c, kind, qty = 1) {
  if (ITEMS[kind]?.locked) return 0; // (25.5) yadigâr satılmaz, feda edilmez, yok edilmez
  const inv = c.inventory ?? [];
  let left = qty;
  for (let i = inv.length - 1; i >= 0 && left > 0; i--) {
    if (inv[i].kind !== kind) continue;
    const take = Math.min(left, inv[i].qty);
    inv[i].qty -= take;
    left -= take;
    if (inv[i].qty <= 0) inv.splice(i, 1);
  }
  return qty - left;
}

/** Çantadaki en doyurucu yiyecek türü (yoksa null): ekmek > erzak > meyve. */
export function foodItemOf(c) {
  let best = null;
  for (const s of c.inventory ?? []) {
    const def = ITEMS[s.kind];
    if (def?.food && (!best || def.hunger > ITEMS[best].hunger)) best = s.kind;
  }
  return best;
}

/** Çantadaki yiyecek yuvası sayısı. */
export function foodSlots(c) {
  return (c.inventory ?? []).filter((s) => ITEMS[s.kind]?.food).length;
}

/** Çantanın kısa yazımı: "Ekmek ×2, Meyve, Boncuk Kolye" (boşsa ''). */
export function describeInventory(c) {
  return (c.inventory ?? []).map((s) => `${s.name ?? ITEMS[s.kind].name}${s.qty > 1 ? ` ×${s.qty}` : ''}`).join(', ');
}

/** Bu sakinin çantasındaki malların kasaba deposu karşılığı: { food, bread, wood } (yağma muhasebesi için). */
export function inventoryResources(c) {
  const out = {};
  for (const s of c.inventory ?? []) {
    const r = ITEMS[s.kind]?.resource;
    if (r) out[r] = (out[r] ?? 0) + s.qty;
  }
  return out;
}

/** Bütün kasabanın keselerindeki toplam para ve çantalardaki eşya sayısı. */
export function purseTotals(state) {
  let coins = 0;
  let items = 0;
  for (const c of state.characters) {
    coins += c.coins ?? 0;
    for (const s of c.inventory ?? []) items += s.qty;
  }
  return { coins, items };
}

// ---------------------------------------------------------------------------
// Yönetim Güveni ve isyan
// ---------------------------------------------------------------------------

export function emptyTrust() {
  return { value: TRUST.start, lowSince: null, revolt: null, revolts: 0, relief: {}, eventDays: {}, min: TRUST.start, lastLoot: null };
}

export function emptyPetitions() {
  return { list: [], nextId: 1, nextAt: null, log: [], fulfilled: 0, rejected: 0, expired: 0, accepted: 0, made: 0 };
}

/** Kasabanın Yönetim Güveni (0-100; eski kayıtlarda 75). */
export function trustValue(state) {
  const v = state.trust?.value;
  return Number.isFinite(v) ? v : TRUST.start;
}

/** Güvenin seviyesi: Güvenli / Huzursuz / Gergin / Asayiş Bozuk. */
export function trustLevel(value) {
  return TRUST.levels.find((l) => value >= l.min) ?? TRUST.levels[TRUST.levels.length - 1];
}

/** Kasabada isyan sürüyor mu? */
export function isRevolt(state) {
  return Boolean(state.trust?.revolt);
}

/** Bu sakin isyancı mı? */
export function isRioter(state, c) {
  return Boolean(state.trust?.revolt?.rioters?.includes(c.id));
}

/** Sakinin katıldığı süren yağma (yoksa null). */
export function raidOf(state, c) {
  return state.trust?.revolt?.raids?.find((r) => r.members.includes(c.id)) ?? null;
}

/** Sakinin açık dilekçesi (yoksa null). */
export function petitionOf(state, c) {
  return state.petitions?.list?.find((p) => p.characterId === c.id) ?? null;
}
