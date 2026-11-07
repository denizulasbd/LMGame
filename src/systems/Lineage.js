// (25.4) Aile Kütüğü'nün saf yardımcıları: soy verisinin kurulması ve temizlenmesi, kuşak adı, birinci derece kan bağı denetimi,
// ocak reisi ve kayıttaki sayaçlar. Durum değiştirmez (yalnızca kurulum yardımcıları sakinin soy alanlarını yazar), rastgelelik yoktur.
import { GENERATION_NAMES, familyName } from '../data/lineage.js';

/** Birinci derece kan bağı: ebeveyn-çocuk ya da en az bir ortak ebeveyni olan kardeşler (doğum kaydıyla; ebeveyn köyden ayrılsa da). */
export function closeKin(a, b) {
  if (!a || !b || a === b) return false;
  const pa = new Set([...(a.parents ?? []), ...(a.parentIds ?? [])]);
  const pb = new Set([...(b.parents ?? []), ...(b.parentIds ?? [])]);
  if (pa.has(b.id) || pb.has(a.id)) return true;
  for (const id of pa) if (pb.has(id)) return true;
  return false;
}

/** Kartta kuşak adı. */
export function generationName(state, c) {
  const g = c.generation ?? 1;
  if (g <= 1) return (state.chronicle?.founders ?? []).some((f) => f.id === c.id) ? GENERATION_NAMES.founder : GENERATION_NAMES.settler;
  return g === 2 ? GENERATION_NAMES.second : GENERATION_NAMES.later(g);
}

/** Kayıttaki kütük: ocaklar { id: { name, founderId, founderName, since } }, sıradaki ocak kimliği, ocak reisleri, sayaçlar. */
export function emptyLineage() {
  return { nextFamilyId: 1, families: {}, heads: {}, newHomes: 0, extended: 0, petitions: 0, handovers: 0, gen2Weddings: 0 };
}

export function restoreLineage(data) {
  const out = emptyLineage();
  if (!data || typeof data !== 'object') return out;
  out.nextFamilyId = Math.max(1, Math.floor(Number(data.nextFamilyId) || 1));
  for (const [id, f] of Object.entries(data.families ?? {})) {
    if (!Number.isFinite(Number(id)) || !f || typeof f.name !== 'string') continue;
    out.families[id] = { name: f.name, founderId: Number.isFinite(f.founderId) ? f.founderId : null, founderName: typeof f.founderName === 'string' ? f.founderName : null, since: Number.isFinite(f.since) ? f.since : 1 };
    out.nextFamilyId = Math.max(out.nextFamilyId, Number(id) + 1);
  }
  for (const [home, head] of Object.entries(data.heads ?? {})) if (Number.isFinite(Number(home)) && Number.isFinite(head)) out.heads[home] = head;
  for (const key of ['newHomes', 'extended', 'petitions', 'handovers', 'gen2Weddings']) out[key] = Math.max(0, Math.floor(Number(data[key]) || 0));
  return out;
}

/** Yeni bir ocak açar (kurucu ya da ocaksız eski sakin için). Ocak kimliği. */
export function openFamily(lineage, founder, day) {
  const id = lineage.nextFamilyId++;
  lineage.families[id] = { name: familyName(founder.name), founderId: founder.id, founderName: founder.name, since: day };
  return id;
}

/**
 * Bütün sakinlerin soy verisini tamamlar ve tutarlı kılar (yüklemede ve yeni kasabada; deterministik, kimlik sırasıyla):
 *   parents: yoksa parentIds'ten; generation: ebeveyni kayıtlı olanlar ebeveyninin bir fazlası, yoksa 1 (Kurucu Kuşak);
 *   familyId: yoksa ilk ebeveyninin ocağı, o da yoksa kendi adına yeni bir ocak; children: ebeveyn kayıtlarından yeniden kurulur.
 */
export function rebuildLineage(state) {
  const lineage = state.lineage;
  const people = [...state.characters].sort((a, b) => a.id - b.id);
  const byId = new Map(people.map((c) => [c.id, c]));
  for (const c of people) {
    if (!Array.isArray(c.parents) || c.parents.length === 0) c.parents = [...(c.parentIds ?? [])];
  }
  // Kuşak: ebeveyni kasabada olanlar ebeveyninin bir fazlası (birkaç geçişle; döngü yok)
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const c of people) {
      const ps = c.parents.map((id) => byId.get(id)).filter(Boolean);
      const want = ps.length ? Math.max(...ps.map((p) => p.generation ?? 1)) + 1 : Number.isInteger(c.generation) && c.generation >= 1 ? c.generation : 1;
      if (c.generation !== want) {
        c.generation = want;
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Ocak: kuşak sırasıyla (önce ebeveynler)
  for (const c of [...people].sort((a, b) => a.generation - b.generation || a.id - b.id)) {
    if (c.familyId !== null && c.familyId !== undefined && lineage.families[c.familyId]) continue;
    const first = c.parents.map((id) => byId.get(id)).find((p) => p && lineage.families[p.familyId]);
    c.familyId = first ? first.familyId : openFamily(lineage, c, state.time?.day ?? 1);
  }
  for (const c of people) c.children = people.filter((o) => o.parents.includes(c.id)).map((o) => o.id);
  // Ocak reisi: var olmayan ev / sakin düşer
  const homes = new Set(state.buildings.filter((b) => b.capacity).map((b) => String(b.id)));
  for (const [home, head] of Object.entries(lineage.heads)) if (!homes.has(home) || !byId.has(head)) delete lineage.heads[home];
}

/** Evin ocak reisi: devredilmiş reis ya da evdeki en yaşlı yetişkin (eşitlikte küçük kimlik). */
export function headOf(state, home) {
  if (!home) return null;
  const set = state.lineage?.heads?.[home.id];
  const residents = state.characters.filter((c) => c.homeId === home.id && !c.role);
  if (set !== undefined) {
    const c = state.characters.find((x) => x.id === set); // devredilen reislik sembolik bir tapudur: reis başka evde yaşayabilir
    if (c) return c;
  }
  const adults = residents.filter((c) => !c.isChild);
  return adults.length ? adults.reduce((best, c) => (c.ageInDays > best.ageInDays || (c.ageInDays === best.ageInDays && c.id < best.id) ? c : best)) : null;
}
