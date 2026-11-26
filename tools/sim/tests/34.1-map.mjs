// Aşama 34.1 testi: genişleyen harita altyapısı. Parsel bölünmesi ve içeriği tohumdan; çekirdek eskisiyle karo karo aynı;
// kilitli alanda yürüme / inşa / toplama yok, açılınca var; nehir sınırda sürüyor; açık parselde yol, kesilen ağaç ve yapı
// kayıt-yükleme sonrası aynı yerde; göçmen açık alanın kenarından gelir; eski (indeksli) kayıtların arazisi aynı koordinatta.
// Kullanım: node tools/sim/tests/34.1-map.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 34.1
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';

const { browser, page, errors } = await openGame({ seed: 42 });
const { results, report } = createChecks();

const out = await page.evaluate(async () => {
  const { sim, game } = window;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
  const { generateTown } = await import('/src/world/WorldGenerator.js');
  const { expandWorld } = await import('/src/world/Expansion.js');
  const { Random } = await import('/src/utils/random.js');

  // 1. Aynı tohum → aynı parseller ve içerik; başka tohum → başka
  const build = (seed) => expandWorld(generateTown(80, 80, new Random(seed), { biomes: true }).map, seed);
  const sig = (w) => {
    let h = 0;
    for (let i = 0; i < w.map.tiles.length; i++) h = (Math.imul(h, 31) + w.map.tiles[i] * 7 + w.map.objects[i] * 3 + w.map.variants[i]) | 0;
    return `${w.parcels.map((p) => `${p.id}:${p.x},${p.y},${p.w}x${p.h}`).join('|')}#${h}`;
  };
  const a = build(42);
  const b = build(42);
  const c = build(43);
  check('aynı tohum: aynı parsel bölünmesi ve içerik', sig(a) === sig(b), `${a.parcels.length} parsel, dünya ${a.map.width}x${a.map.height}`);
  check('başka tohum: başka bölünme / içerik', sig(a) !== sig(c));
  const sizesOk = a.parcels.every((p) => Math.min(p.w, p.h) >= 20 && Math.max(p.w, p.h) <= 40);
  check('parsel kenarları 20-40 karo (34.2 bölünmesi)', sizesOk, a.parcels.map((p) => `${p.w}x${p.h}`).slice(0, 6).join(' '));
  check('parsellerin alanı toplamı = halkalar', a.parcels.reduce((s, p) => s + p.area, 0) === a.map.width * a.map.height - 80 * 80);

  // 2. Çekirdek eskisiyle (yalnız çekirdek üretimi) karo karo aynı; 48'lik eski harita da
  for (const [size, biomes] of [[80, true], [48, false]]) {
    const core = generateTown(size, size, new Random(42), { biomes }).map;
    const world = expandWorld(generateTown(size, size, new Random(42), { biomes }).map, 42).map;
    let diff = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = core.index(x, y);
      const j = world.index(x, y);
      if (core.tiles[i] !== world.tiles[j] || core.variants[i] !== world.variants[j] || core.objects[i] !== world.objects[j]) diff++;
    }
    check(`çekirdek ${size}x${size} karo karo aynı`, diff === 0, `${diff} fark, dünya ${world.width}x${world.height}`);
  }

  // 3. Kilitli alan: yürünmez, kurulamaz, yol döşenemez, toplanamaz
  sim.give({ wood: 9999, stone: 9999, food: 999, gold: 9999 });
  const scene = game.scenes.current;
  const map = scene.map;
  const parcel = scene.parcels.find((p) => p.ring === 1 && p.side === 'n' && p.neighbors.includes('core') && p.w >= 16);
  let free = null;
  let tree = null;
  for (let y = parcel.y + 2; y < parcel.y + parcel.h - 2 && !(free && tree); y++) {
    for (let x = parcel.x + 2; x < parcel.x + parcel.w - 2; x++) {
      const t = map.get(x, y);
      if (!free && (t === 'grass' || t === 'meadow') && !map.getObject(x, y) && ['grass', 'meadow'].includes(map.get(x + 1, y + 1)) && !map.getObject(x + 1, y + 1) && ['grass', 'meadow'].includes(map.get(x + 1, y)) && ['grass', 'meadow'].includes(map.get(x, y + 1)) && !map.getObject(x + 1, y) && !map.getObject(x, y + 1)) free = { x, y };
      if (!tree && (map.getObject(x, y) === 'oak' || map.getObject(x, y) === 'pine')) tree = { x, y };
    }
  }
  check('test parseli boş çimen ve ağaç buldu', free && tree, `${parcel.id} ${JSON.stringify(free)} ${JSON.stringify(tree)}`);
  check('kilitli: yürünmez', !map.isWalkable(free.x, free.y) && !map.isOpen(free.x, free.y));
  check('kilitli: yapı kurulamaz', !scene.construction.checkPlacement('flowerBed', free.x, free.y).ok, scene.construction.checkPlacement('flowerBed', free.x, free.y).reason);
  check('kilitli: yol döşenemez', !scene.construction.checkPaint('path', free.x, free.y).ok);
  check('kilitli: ağaç toplanamaz', scene.jobs.designate(tree.x, tree.y) === null);
  check('kilitli: yol bulma girmez', scene.world.findPath({ x: 40, y: 40 }, { x: free.x, y: free.y }) === null);

  // 4. Nehir çekirdek sınırında sürüyor (üst ve alt satır)
  const waterRow = (y) => { const xs = []; for (let x = map.x0; x < map.x1; x++) if (map.get(x, y) === 'water') xs.push(x); return xs; };
  const overlap = (r1, r2) => r1.some((x) => r2.includes(x));
  check('nehir kuzey sınırında devam ediyor', overlap(waterRow(0), waterRow(-1)) && overlap(waterRow(-1), waterRow(map.y0)), `${waterRow(0).join(',')} / ${waterRow(-1).join(',')}`);
  check('nehir güney sınırında devam ediyor', overlap(waterRow(79), waterRow(80)) && waterRow(map.y1 - 1).length > 0);

  // 5. Parsel açılınca yürünür ve kurulur; göçmen açık alanın kenarından gelir
  check('parsel açılıyor', sim.unlockParcel(parcel.id) === true && sim.unlockParcel(parcel.id) === false);
  check('açık: yürünür', map.isWalkable(free.x, free.y) && scene.world.isReachable(free.x, free.y));
  check('açık: yol bulma ulaşır', Boolean(scene.world.findPath({ x: 40, y: 40 }, { x: free.x, y: free.y })));
  const placed = scene.construction.checkPlacement('flowerBed', free.x, free.y);
  check('açık: yapı kurulabilir', placed.ok, placed.reason);
  const rng = new Random(5);
  let entries = 0;
  let bad = 0;
  let inside = 0;
  for (let i = 0; i < 300; i++) {
    const e = scene.world.findEntryTile(rng);
    if (!e) continue;
    entries++;
    if (map.isOpen(e.x, e.y - 1) && map.isOpen(e.x, e.y + 1) && map.isOpen(e.x - 1, e.y) && map.isOpen(e.x + 1, e.y)) bad++;
    if (e.y === 0 && e.x >= parcel.x && e.x < parcel.x + parcel.w) inside++;
  }
  check('göçmen girişi açık alanın kenarında', entries > 0 && bad === 0 && inside === 0, `${entries} giriş, ${bad} iç karo, ${inside} açılmış sınırda`);
  const newcomer = scene.population.spawnNewcomer();
  check('göçmen açık karoda doğuyor', !newcomer || map.isOpen(Math.floor(newcomer.x / 16), Math.floor(newcomer.y / 16)));

  // 6. Açık parselde yol, kesilen ağaç, yapı → kaydet → yükle → aynı yerde
  const road = { x: free.x + 3, y: free.y };
  while (!(scene.construction.checkPaint('path', road.x, road.y).ok) && road.x < parcel.x + parcel.w - 1) road.x++;
  const painted = scene.construction.paintTile('path', road.x, road.y).ok;
  if (map.getObject(tree.x, tree.y)) map.setObject(tree.x, tree.y, null); // (34.3) kesilen ağaç kalıntı bırakmaz
  const res = scene.construction.placeSite('flowerBed', free.x, free.y);
  if (res.ok) {
    const job = scene.jobs.jobs.find((j) => j.buildingId === res.building.id);
    if (job) scene.jobs.cancel(job);
    scene.construction.complete(res.building);
  }
  const before = { road: map.get(road.x, road.y), tree: map.getObject(tree.x, tree.y), bed: res.ok ? { x: res.building.tileX, y: res.building.tileY, type: res.building.type } : null };
  const snap = scene.saves.snapshot();
  check('kayıt v42 biçimi: koordinatlı arazi, parseller', snap.terrain.every((cell) => cell.length === 5) && snap.parcels.includes(parcel.id) && snap.terrain.some((cell) => cell[1] < 0), `${snap.terrain.length} hücre`);
  localStorage.setItem('lmgame.save.v2', JSON.stringify({ ...snap, version: 42 }));
  game.events.emit('ui:load');
  const s2 = game.scenes.current;
  const m2 = s2.map;
  const bed2 = game.state.buildings.find((b) => b.type === 'flowerBed' && b.tileX === free.x && b.tileY === free.y);
  check('yükleme: parsel açık', game.state.parcels.includes(parcel.id) && m2.isOpen(free.x, free.y));
  check('yükleme: yol aynı yerde', painted && m2.get(road.x, road.y) === 'path' && before.road === 'path', JSON.stringify(road));
  check('yükleme: kesilen ağaç aynı yerde (boş karo)', m2.getObject(tree.x, tree.y) === before.tree && before.tree === null, `${before.tree}`);
  check('yükleme: yapı aynı yerde', Boolean(bed2) && m2.getOccupant(free.x, free.y) === bed2.id, JSON.stringify(before.bed));
  sim.step(225);
  check('yüklemeden sonra bir saat sorunsuz', game.state.characters.length > 0);
  return out;
});
results.push(...out);

// 7. Eski (sürüm ≤ 41, indeksli) kayıtlar: arazi farkları aynı koordinata düşer; yapılar yerinde (80'lik ve 48'lik harita)
for (const name of ['save-v41.json', 'save-v41-asama32.json', 'save-v8.json', 'save-v2.json']) {
  const raw = fs.readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
  const data = JSON.parse(raw);
  const width = data.map?.width ?? 48;
  const expected = data.terrain.map(([i, t, v, o]) => [i % width, Math.floor(i / width), t, v, o]);
  const r = await page.evaluate(({ raw, expected }) => {
    const { game } = window;
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    const map = game.scenes.current.map;
    let wrong = 0;
    for (const [x, y, t, v, o] of expected) {
      const i = map.index(x, y);
      if (map.tiles[i] !== t || map.variants[i] !== v || map.objects[i] !== (o === 5 ? 0 : o)) wrong++; // (34.3) eski kayıttaki kütük (5) açılışta temizlenir
    }
    const src = JSON.parse(raw);
    const moved = src.buildings.filter((b) => !game.state.buildings.some((n) => n.id === b.id && n.tileX === b.tileX && n.tileY === b.tileY)).length;
    const occupied = game.state.buildings.filter((b) => map.getOccupant(b.tileX, b.tileY) !== b.id).length;
    return { wrong, moved, occupied, n: expected.length, world: `${map.width}x${map.height}`, parcels: game.state.parcels.length };
  }, { raw, expected });
  check(`${name}: arazi farkları aynı koordinatta`, r.wrong === 0 && r.n > 0, `${r.n} hücre, ${r.wrong} farklı, dünya ${r.world}`);
  check(`${name}: yapılar aynı karoda`, r.moved === 0 && r.occupied === 0, `${r.moved} kaymış, ${r.occupied} boş`);
  check(`${name}: parsel açılmamış`, r.parcels === 0);
}

// 8. v42 fikstürü: açılmış parseller ve eksi koordinatlı arazi farkları yerinde
{
  const raw = fs.readFileSync(new URL('../fixtures/save-v42-asama34.1.json', import.meta.url), 'utf8');
  const data = JSON.parse(raw);
  const r = await page.evaluate((raw) => {
    const { game } = window;
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    const map = game.scenes.current.map;
    const src = JSON.parse(raw);
    const wrong = src.terrain.filter(([x, y, t, v, o]) => map.get(x, y) === null || map.tiles[map.index(x, y)] !== t || map.variants[map.index(x, y)] !== v || map.objects[map.index(x, y)] !== (o === 5 ? 0 : o)).length;
    const lockedBuild = game.state.buildings.filter((b) => !map.isOpen(b.tileX, b.tileY)).length;
    return { wrong, lockedBuild, parcels: [...game.state.parcels], neg: src.terrain.filter((c) => c[0] < 0 || c[1] < 0).length };
  }, raw);
  // (34.2) Eski (34.1) parsel kimlikleri yeni bölünmeye çevrilir: eski dikdörtgenlere değen bütün yeni parseller açık, arazi ve yapı yerinde
  check('save-v42-asama34.1.json: arazi farkları yerinde, eski parseller yeni kimliğe çevrildi', r.wrong === 0 && r.neg > 0 && r.parcels.length >= data.parcels.length && r.parcels.every((id) => id.startsWith('p')), `${r.neg} eksi koordinatlı hücre, parseller ${r.parcels.join(',')}`);
  check('save-v42-asama34.1.json: bütün yapılar açık alanda', r.lockedBuild === 0);
}

function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
}

const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
