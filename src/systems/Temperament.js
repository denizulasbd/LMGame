// (25.3) Mizaç katmanının saf yardımcıları: kayıttaki sayaçlar, huyun kaynağı ve gelişimin açık olup olmadığı.

// Yeni nesil huyların dilekçe türleri (sayaç)
export const GENERATION_PETITIONS = ['craftTools', 'marketFees', 'sherbetCask'];

/** Kayıttaki mizaç sayaçları (petitions: açılan yeni tür dilekçeler). */
export function emptyTemperament() {
  return { developed: 0, family: 0, mentor: 0, craft: 0, self: 0, auraMinutes: 0, petitions: {} };
}

export function restoreTemperament(data) {
  const out = emptyTemperament();
  if (!data || typeof data !== 'object') return out;
  for (const key of ['developed', 'family', 'mentor', 'craft', 'self']) out[key] = Math.max(0, Math.floor(Number(data[key]) || 0));
  out.auraMinutes = Number.isFinite(Number(data.auraMinutes)) ? Math.max(0, Number(data.auraMinutes)) : 0;
  for (const k of GENERATION_PETITIONS) {
    const n = Math.floor(Number(data.petitions?.[k]) || 0);
    if (n > 0) out.petitions[k] = n;
  }
  return out;
}

/** Kayıttan gelen huy kaynağı (bilinmeyen tür null). */
export function sanitizeOrigin(o) {
  if (!o || typeof o !== 'object' || !['family', 'mentor', 'craft', 'self'].includes(o.kind)) return null;
  return { kind: o.kind, fromId: Number.isFinite(o.fromId) ? o.fromId : null, fromName: typeof o.fromName === 'string' ? o.fromName : null, day: Number.isFinite(o.day) ? o.day : null };
}

/** Kişilik gelişimi açık mı (Altın Çağ kuşağı)? */
export function developmentOpen(state) {
  return Boolean(state.goldenAge?.since);
}

