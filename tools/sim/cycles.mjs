// (32.6a) Döngüsel içe aktarma denetimi: src/ altındaki ES modüllerinin statik içe aktarmalarını (import ... from, export ... from)
// okur, birbirine döngüyle bağlı modül kümelerini (Tarjan SCC) ve her kümeden bir örnek döngüyü basar. Dinamik import() sayılmaz.
//   node tools/sim/cycles.mjs            bütün döngüleri basar; döngü varsa çıkış kodu 1
//   node tools/sim/cycles.mjs --json     makinece okunur çıktı
// Bilinen döngüler ALLOW listesinde (gerekçesiyle); listede olmayan yeni bir döngü kapıyı kırar.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const src = path.join(root, 'src');

/** Bilinen ve kabul edilmiş döngüler (küme üyeleri, sıralı, '|' ile). Boş kalması hedeflenir. */
export const ALLOW = new Set([
  // 29f64fa (main) öncesinden kalan iki küçük döngü; yalnızca işlev bildirimleri arasında (modül yüklenirken çağrı yok), davranışa etkisi yok
  'systems/Loyalty.js|systems/Moodlets.js', // Loyalty.getMoodlet ↔ Moodlets.levelEffects
  'systems/Refinery.js|systems/TownStatus.js', // Refinery.foodSupply ↔ TownStatus.clothWelfare
]);

export function scanImports(dir = src) {
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.m?js$/.test(e.name)) files.push(p);
    }
  };
  walk(dir);
  const graph = new Map();
  const re = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"`;]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const deps = new Set();
    for (const m of text.matchAll(re)) {
      if (!m[1].startsWith('.')) continue;
      const target = path.resolve(path.dirname(f), m[1]);
      if (fs.existsSync(target)) deps.add(target);
    }
    graph.set(f, [...deps]);
  }
  return graph;
}

export function findCycles(graph) {
  let index = 0;
  const idx = new Map();
  const low = new Map();
  const stack = [];
  const on = new Set();
  const sccs = [];
  const strong = (v) => {
    idx.set(v, index);
    low.set(v, index++);
    stack.push(v);
    on.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        on.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1 || (graph.get(v) ?? []).includes(v)) sccs.push(comp);
    }
  };
  for (const v of graph.keys()) if (!idx.has(v)) strong(v);
  const rel = (p) => path.relative(src, p);
  return sccs.map((comp) => {
    const set = new Set(comp);
    // örnek döngü: kümenin ilk düğümünden BFS ile kendine dönüş
    const start = comp.slice().sort()[0];
    const prev = new Map([[start, null]]);
    const q = [start];
    let loop = null;
    while (q.length && !loop) {
      const v = q.shift();
      for (const w of graph.get(v) ?? []) {
        if (!set.has(w)) continue;
        if (w === start) {
          loop = [];
          for (let x = v; x; x = prev.get(x)) loop.unshift(x);
          loop.push(start);
          break;
        }
        if (!prev.has(w)) {
          prev.set(w, v);
          q.push(w);
        }
      }
    }
    const members = comp.map(rel).sort();
    return { members, key: members.join('|'), example: (loop ?? []).map(rel) };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cycles = findCycles(scanImports());
  const bad = cycles.filter((c) => !ALLOW.has(c.key));
  if (process.argv.includes('--json')) console.log(JSON.stringify(cycles, null, 1));
  else {
    for (const c of cycles) console.log(`${ALLOW.has(c.key) ? 'izinli' : 'DÖNGÜ'} (${c.members.length} modül): ${c.example.join(' → ')}`);
    console.log(`${cycles.length} döngü kümesi, ${bad.length} izinsiz`);
  }
  process.exit(bad.length ? 1 : 0);
}
