// Aşama 33.1 — Rastgele Kadro ve Hayat Tohumu.
// Kullanım: node tools/sim/tests/33.1-cast.mjs [--verbose]   ya da   node tools/sim/gate.mjs --quick --only 33.1
// Harita tohumu aynı haritayı verir (karo karo); hayat tohumu sakinleri belirler (her yeni oyunda farklı, ?life= ile sabit).
// Başlangıç güvenlik kuralları, ad çakışması, büyük havuz, eski kayıt (lifeSeed'siz fikstür), yeni kayıt, arazi farkı.
import fs from 'fs';
import { openGame, createChecks } from '../lib.mjs';

const { results, check, report } = createChecks();
const allErrors = [];
const fixtureRaw = fs.readFileSync(new URL('../fixtures/save-v41.json', import.meta.url), 'utf8');

const castOf = (page) => page.evaluate(() => game.state.characters.map((c) => ({ name: c.name, age: c.age, traits: [...c.traits], look: JSON.stringify(c.appearance) })));
const mapOf = (page) => page.evaluate(() => {
  const hash = (a) => { let x = 2166136261; for (let i = 0; i < a.length; i++) { x ^= a[i]; x = Math.imul(x, 16777619) >>> 0; } return x; };
  const b = game.scenes.current.baseTerrain;
  return { tiles: hash(b.tiles), variants: hash(b.variants), objects: hash(b.objects), buildings: JSON.stringify(game.state.buildings.map((x) => [x.type, x.tileX, x.tileY])) };
});
const namesKey = (cast) => cast.map((c) => c.name).sort().join(',');

// ---- 1) Aynı harita tohumu, farklı hayat tohumu: arazi aynı, sakinler farklı; ?life= aynı olunca sakinler aynı ----
{
  const a = await openGame({ seed: 77, life: 1001 });
  const b = await openGame({ seed: 77, life: 1002, randomSeed: 5 });
  const c = await openGame({ seed: 77, life: 1001, randomSeed: 9 }); // a ile aynı hayat tohumu, farklı Math.random akışı
  const [ca, cb, cc] = [await castOf(a.page), await castOf(b.page), await castOf(c.page)];
  const [ma, mb, mc] = [await mapOf(a.page), await mapOf(b.page), await mapOf(c.page)];
  check('aynı harita tohumu, farklı hayat tohumu: arazi (zemin, çeşit, nesne) ve başlangıç yapıları karo karo aynı', JSON.stringify(ma) === JSON.stringify(mb) && JSON.stringify(ma) === JSON.stringify(mc));
  check('aynı harita tohumu, farklı hayat tohumu: sakinler farklı (ad dizisi ve özellikler)', namesKey(ca) !== namesKey(cb) && JSON.stringify(ca.map((x) => x.traits)) !== JSON.stringify(cb.map((x) => x.traits)));
  check('?life= aynı olunca sakinler birebir aynı (ad, yaş, özellik, görünüş)', JSON.stringify(ca) === JSON.stringify(cc));
  const lifeA = await a.page.evaluate(() => ({ seed: game.state.seed, life: game.state.lifeSeed }));
  check('?seed=77&life=1001 → state.seed 77, state.lifeSeed 1001', lifeA.seed === 77 && lifeA.life === 1001, JSON.stringify(lifeA));
  allErrors.push(...a.errors, ...b.errors, ...c.errors);
  await a.browser.close();
  await b.browser.close();
  await c.browser.close();
}

// ---- 2) Yeni oyun yolları: adreste yalnızca ?seed=, Yeni Kasaba Kur (tohum doluyken), Ayarlar > Yeni Harita ----
{
  // adreste ?life= yok: iki ayrı açılışta (farklı Math.random akışı) aynı harita, farklı insanlar
  const mk = async (rs) => {
    const g = await openGame({ path: '?seed=77', randomSeed: rs });
    await g.page.waitForFunction(() => window.game?.scenes?.current?.world);
    return g;
  };
  const a = await mk(11);
  const b = await mk(12);
  const [ca, cb, ma, mb] = [await castOf(a.page), await castOf(b.page), await mapOf(a.page), await mapOf(b.page)];
  check('adres ?seed=77 (life yok): aynı harita, ama sakinler her açılışta farklı', JSON.stringify(ma) === JSON.stringify(mb) && namesKey(ca) !== namesKey(cb));
  const seeds = await a.page.evaluate(() => ({ seed: game.state.seed, life: game.state.lifeSeed }));
  check('adres ?seed=77 (life yok): lifeSeed rastgele (harita tohumundan farklı)', seeds.seed === 77 && Number.isFinite(seeds.life) && seeds.life !== 77, JSON.stringify(seeds));
  allErrors.push(...a.errors, ...b.errors);
  await b.browser.close();

  // aynı sayfada: Yeni Kasaba Kur iki kez, tohum alanı dolu
  const t = await a.page.evaluate(() => {
    const read = () => {
      const h = (arr) => { let x = 2166136261; for (let i = 0; i < arr.length; i++) { x ^= arr[i]; x = Math.imul(x, 16777619) >>> 0; } return x; };
      const bt = game.scenes.current.baseTerrain;
      return { terrain: [h(bt.tiles), h(bt.variants), h(bt.objects)].join('-'), names: game.state.characters.map((c) => c.name).sort().join(','), life: game.state.lifeSeed, seed: game.state.seed, town: game.state.townName };
    };
    game.events.emit('ui:startNewTown', { name: 'Deneme', seed: 5150 });
    const first = read();
    game.events.emit('ui:startNewTown', { name: 'Deneme', seed: 5150 });
    const second = read();
    game.events.emit('ui:newGame');
    const third = read();
    return { first, second, third };
  });
  check('Yeni Kasaba Kur (tohum 5150, iki kez): aynı arazi, farklı sakinler ve farklı hayat tohumu', t.first.terrain === t.second.terrain && t.first.names !== t.second.names && t.first.life !== t.second.life && t.first.seed === 5150 && t.second.seed === 5150, JSON.stringify([t.first, t.second]));
  check('Ayarlar > Yeni Harita: yeni harita tohumu ve yeni hayat tohumu', t.third.seed !== 5150 && t.third.life !== t.second.life && t.third.terrain !== t.second.terrain);
  await a.browser.close();
}

// ---- 3) Kadro üreticisi: güvenlik kuralları 200 rastgele üretimde, ad çakışması, büyük havuz ----
{
  const g = await openGame({ seed: 5 });
  const out = await g.page.evaluate(async () => {
    const { Random } = await import('/src/utils/random.js');
    const R = await import('/src/systems/Residents.js');
    const { RESIDENT_NAMES, MAX_NAME_LENGTH } = await import('/src/data/names.js');
    const { RESIDENT_POOL, TRAITS } = await import('/src/data/characters.js');
    const { OPPOSING_TRAITS } = await import('/src/data/characters.js');
    const { APPEARANCE_PARTS } = await import('/src/data/characters.js');
    const out = [];
    const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });

    // Ad havuzu
    const lower = RESIDENT_NAMES.map((n) => n.toLocaleLowerCase('tr'));
    check('ad havuzu: en az 150 ad, tekrar yok, hepsi en çok 8 harf', RESIDENT_NAMES.length >= 150 && new Set(lower).size === lower.length && RESIDENT_NAMES.every((n) => [...n].length <= MAX_NAME_LENGTH && MAX_NAME_LENGTH === 8), `${RESIDENT_NAMES.length} ad`);
    const oldNames = ['Ayşe', 'Mehmet', 'Elif', 'Can', 'Zeynep', 'Emre', 'Deniz', 'Selin', 'Mert', 'Defne', 'Kemal', 'Nilay', 'Ozan', 'Leyla', 'Bora', 'Ece', 'Kaan', 'Yağmur', 'Arda', 'Duru', 'Efe', 'Lale', 'Tolga', 'Sude'];
    check('ad havuzu: eski havuz ve ek adların hepsi içinde', oldNames.every((n) => RESIDENT_NAMES.includes(n)) && RESIDENT_POOL.every((r) => RESIDENT_NAMES.includes(r.name)));
    check('elle yazılmış 14 tanıdık yüz silinmedi', RESIDENT_POOL.length === 14);

    // 200 rastgele başlangıç kadrosu: kurallar testte AYRICA (üreticiden bağımsız, elle) denetlenir
    const useful = ['hardworking', 'ambitious', 'natureLover'];
    // tanıdık yüz: elle yazılmış tanımla (ad ve görünüş) birebir aynı olan; aynı ada sahip rastgele biri sayılmaz
    const isFamiliar = (c) => RESIDENT_POOL.some((r) => r.name === c.name && JSON.stringify(r.appearance) === JSON.stringify(c.appearance));
    let broken = 0, dupNames = 0, badCount = 0, badTraits = 0, familiar = 0, tooLong = 0, badLook = 0;
    const firstBroken = [];
    for (let i = 0; i < 200; i++) {
      const rng = new Random(900000 + i * 977);
      const cast = R.makeStartingCast(rng, {});
      const working = cast.filter((c) => c.age >= 20 && c.age <= 45).length;
      const over55 = cast.filter((c) => c.age > 55).length;
      const wise = cast.filter((c) => c.age >= 50 && c.age <= 58).length;
      const counts = {};
      for (const c of cast) for (const t of c.traits) counts[t] = (counts[t] ?? 0) + 1;
      const same = Math.max(...Object.values(counts));
      const usefulPeople = cast.filter((c) => c.traits.some((t) => useful.includes(t))).length;
      if (!(working >= 4 && over55 <= 1 && wise >= 1 && same <= 2 && usefulPeople >= 2)) { broken++; if (firstBroken.length < 2) firstBroken.push(JSON.stringify(cast.map((c) => [c.name, c.age, c.traits]))); }
      if (cast.length !== 6) badCount++;
      if (new Set(cast.map((c) => c.name)).size !== cast.length) dupNames++;
      if (cast.some((c) => c.traits.length < 2 || c.traits.length > 3 || c.traits.some((t) => !TRAITS[t]) || OPPOSING_TRAITS.some(([x, y]) => c.traits.includes(x) && c.traits.includes(y)))) badTraits++;
      if (cast.some(isFamiliar)) familiar++;
      if (cast.some((c) => [...c.name].length > 8 && !RESIDENT_NAMES.includes(c.name))) tooLong++;
      if (cast.filter((c) => !isFamiliar(c)).some((c) => Object.entries(APPEARANCE_PARTS).some(([k, opts]) => !opts.includes(c.appearance[k]) && !(k === 'hairColor' && c.appearance[k] === 'gray')))) badLook++;
      if (cast.some((c) => !RESIDENT_NAMES.includes(c.name))) tooLong++;
    }
    check('200 rastgele başlangıç kadrosunda güvenlik kuralları tutuyor (≥4 kişi 20-45, ≤1 kişi 55 üstü, 50-58 arası biri, aynı özellik ≤2, ≥2 işe yarar özellik)', broken === 0, `${broken} bozuk ${firstBroken.join(' | ')}`);
    check('200 kadroda: hep 6 kişi, ad tekrarı yok, her ad havuzdan', badCount === 0 && dupNames === 0 && tooLong === 0, `sayı ${badCount} tekrar ${dupNames} havuz dışı ${tooLong}`);
    check('200 kadroda: her kişide 2-3 özellik, zıt özellik birlikte yok, görünüş parçaları geçerli', badTraits === 0 && badLook === 0, `özellik ${badTraits} görünüş ${badLook}`);
    check('tanıdık yüz olasılığı yaklaşık %25 (200 kadroda 25-80 kadro)', familiar >= 25 && familiar <= 80, `${familiar}/200`);

    // Ad çakışması: havuz tükenince birleşik ad; alınmış adlar verilmez
    const rng = new Random(31337);
    const takenAll = new Set(RESIDENT_NAMES);
    const compound = Array.from({ length: 30 }, () => { const n = R.pickName(rng, takenAll); takenAll.add(n); return n; });
    check('havuz bitince birleşik ad (iki addan), çakışma yok', new Set(compound).size === 30 && compound.every((n) => n.includes(' ') && !RESIDENT_NAMES.includes(n)), compound.slice(0, 3).join(', '));
    const half = new Set(RESIDENT_NAMES.slice(0, RESIDENT_NAMES.length - 5));
    const rest = new Set(Array.from({ length: 5 }, () => { const n = R.pickName(rng, half); half.add(n); return n; }));
    check('havuzda 5 boş ad kalınca yalnızca onlar verilir', rest.size === 5 && [...rest].every((n) => RESIDENT_NAMES.slice(-5).includes(n)));
    const ages = Array.from({ length: 300 }, (_, i) => R.makeResident(new Random(i + 1), {}).age);
    check('göçmen yaşı IMMIGRANT_AGE aralığında', ages.every((a) => a >= 18 && a <= 66), `${Math.min(...ages)}-${Math.max(...ages)}`);
    const olds = Array.from({ length: 300 }, (_, i) => R.makeResident(new Random(i + 7), { age: 60 }));
    const grayShare = olds.filter((c) => c.appearance.hairColor === 'gray').length / olds.length;
    check('60 yaşındakilerin çoğunun saçı gri', grayShare > 0.6 && grayShare < 0.95, grayShare.toFixed(2));
    const kids = Array.from({ length: 100 }, (_, i) => R.makeResident(new Random(i + 70), { age: 30 }));
    check('30 yaşındakilerde gri saç yok', kids.every((c) => c.appearance.hairColor !== 'gray'));
    return out;
  });
  results.push(...out);
  allErrors.push(...g.errors);
  await g.browser.close();
}

// ---- 4) Göçmen ve yeni doğan büyük havuzdan gelir; kasabadakilerle ve son ayrılanlarla ad çakışmaz ----
{
  const g = await openGame({ seed: 9 });
  const out = await g.page.evaluate(async () => {
    const { RESIDENT_NAMES } = await import('/src/data/names.js');
    const { RESIDENT_POOL } = await import('/src/data/characters.js');
    const { sim, game } = window;
    const out = [];
    const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const scene = game.scenes.current;
    const s = game.state;
    const poolNames = new Set(RESIDENT_POOL.map((r) => r.name));
    const living = new Set(s.characters.map((c) => c.name));

    // Son ayrılanlar: vefat eden sakinin adı kayda girer ve yeni gelene verilmez
    const victim = s.characters[0];
    game.events.emit('population:left', { character: victim, coins: 0, items: 0, reason: 'death' });
    check('population:left: ayrılanın adı state.recentNames listesine girer', s.recentNames.includes(victim.name), JSON.stringify(s.recentNames));
    s.characters = s.characters.filter((c) => c !== victim);
    const forbidden = new Set([...s.characters.map((c) => c.name), victim.name]);
    const picks = Array.from({ length: 400 }, () => scene.population.pickResident());
    const clash = picks.filter((p) => forbidden.has(p.name)).length;
    check('göçmen: kasabadakilerle ve yeni ayrılanla ad çakışması yok (400 deneme)', clash === 0, `${clash} çakışma`);
    const fam = picks.filter((p) => poolNames.has(p.name)).length;
    const fresh = picks.filter((p) => !poolNames.has(p.name));
    check('göçmen: yaklaşık %10 tanıdık yüz, geri kalanı yeni insan (400 denemede 15-70)', fam >= 15 && fam <= 70, `${fam}/400`);
    check('göçmen: yeni insanların adı büyük havuzdan, özellikleri 2 tane ve zıtsız', fresh.every((p) => RESIDENT_NAMES.includes(p.name) && p.traits.length === 2 && p.age >= 18), `${fresh.length} yeni`);
    check('göçmen: ad çeşitliliği yüksek (eski 24 adın çok ötesinde)', new Set(fresh.map((p) => p.name)).size >= 60, `${new Set(fresh.map((p) => p.name)).size} ayrı ad`);

    // Yeni doğan: büyük havuzdan boştaki ad
    const names = Array.from({ length: 300 }, () => scene.family.pickName());
    check('yeni doğan: adı büyük havuzdan, kasabadakilerle ve ayrılanla çakışmaz (300 deneme)', names.every((n) => RESIDENT_NAMES.includes(n) && !forbidden.has(n)));
    check('yeni doğan: ad çeşitliliği (eski 16 çocuk adının ötesinde)', new Set(names).size >= 80, `${new Set(names).size} ayrı ad`);

    // Gerçek yoldan: doğum ve göç
    const [a, b] = s.characters;
    const home = s.buildings.find((x) => x.type === 'cabin');
    const before = s.characters.length;
    scene.family.welcomeChild(a, b, home);
    const child = s.characters[s.characters.length - 1];
    check('welcomeChild: çocuk büyük havuzdan boştaki bir adla doğar', s.characters.length === before + 1 && RESIDENT_NAMES.includes(child.name) && !forbidden.has(child.name) && child.age === 5, child.name);
    check('welcomeChild: görünüş kalıtımı aynen (ten ve saç rengi ebeveynlerden)', [a.appearance.skin, b.appearance.skin].includes(child.appearance.skin) && [a.appearance.hairColor, b.appearance.hairColor].includes(child.appearance.hairColor), JSON.stringify(child.appearance));

    // Kayıt: recentNames yazılır ve geri gelir; yokken alan yazılmaz
    const withNames = JSON.parse(JSON.stringify(scene.saves.snapshot()));
    check('kayıt: son ayrılanlar kayda yazılır', Array.isArray(withNames.recentNames) && withNames.recentNames.includes(victim.name));
    s.recentNames = [];
    check('kayıt: son ayrılan yoksa alan hiç yazılmaz', !('recentNames' in scene.saves.snapshot()));
    return out;
  });
  results.push(...out);
  allErrors.push(...g.errors);
  await g.browser.close();
}

// ---- 5) Eski kayıt (lifeSeed'siz fikstür): sakinler ve harita aynen gelir; yeni kayıt: lifeSeed korunur; arazi farkı doğru ----
{
  const g = await openGame({ seed: 3 });
  const fixture = JSON.parse(fixtureRaw);
  const out = await g.page.evaluate(async (raw) => {
    const { lifeSeedOf } = await import('/src/utils/lifeSeed.js');
    const { sim, game } = window;
    const out = [];
    const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail });
    const fixture = JSON.parse(raw);
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    let s = game.state;
    let scene = game.scenes.current;
    check('eski kayıt (lifeSeed yok): yüklenir, state.lifeSeed null, lifeSeedOf harita tohumunu verir', !('lifeSeed' in fixture) && s.lifeSeed === null && lifeSeedOf(s) === fixture.seed && s.seed === fixture.seed, `seed ${s.seed} life ${s.lifeSeed}`);
    const sameCast = fixture.characters.length === s.characters.length && fixture.characters.every((c, i) => s.characters[i].name === c.name && s.characters[i].age === c.age && JSON.stringify(s.characters[i].traits) === JSON.stringify(c.traits) && JSON.stringify(s.characters[i].appearance) === JSON.stringify(c.appearance));
    check('eski kayıt: sakinler aynen geldi (ad, yaş, özellik, görünüş)', sameCast, `${s.characters.length} kişi`);
    check('eski kayıt: yapılar ve kaynaklar aynen geldi', fixture.buildings.length === s.buildings.length && fixture.resources.gold === s.resources.gold);
    // arazi farkı: yükledikten sonra kayıt anındaki fark, fikstürdekiyle aynı
    const diff = scene.saves.snapshot().terrain;
    check('eski kayıt: yükledikten sonra arazi farkı fikstürdekiyle aynı', JSON.stringify(diff) === JSON.stringify(fixture.terrain), `${diff.length} / ${fixture.terrain.length} karo`);
    check('eski kayıt: yeniden kaydedilince lifeSeed yazılmaz (harita tohumu kullanılmaya devam eder)', !('lifeSeed' in scene.saves.snapshot()));
    sim.step(225 * 6);
    check('eski kayıt: bir süre yaşar, sakin sayısı korunur', game.state.characters.length >= fixture.characters.length - 1);

    // Yeni oyun: kaydet → yükle → lifeSeed korunur
    game.events.emit('ui:startNewTown', { name: 'Kayıt', seed: 31 });
    s = game.state;
    scene = game.scenes.current;
    const life = s.lifeSeed;
    const names = s.characters.map((c) => c.name).join(',');
    const lifespans = s.characters.map((c) => c.lifespan).join(',');
    // araziyi değiştir: bir karoyu kes / döşe (fark kayıtta görünsün)
    const m = scene.map;
    let painted = 0;
    for (let i = 0; i < m.tiles.length && painted < 6; i++) {
      if (m.objects[i] !== 0) { m.objects[i] = 0; painted++; }
    }
    const diffBefore = JSON.stringify(scene.saves.snapshot().terrain);
    game.events.emit('ui:save');
    const saved = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('yeni kayıt: lifeSeed yazılır, sürüm artmaz', saved.lifeSeed === life && saved.seed === 31 && saved.version === 41, `lifeSeed ${saved.lifeSeed} sürüm ${saved.version}`);
    game.events.emit('ui:newGame'); // başka bir oyuna geç
    game.events.emit('ui:load');
    s = game.state;
    scene = game.scenes.current;
    check('kaydet → yükle: hayat tohumu ve harita tohumu korunur', s.lifeSeed === life && s.seed === 31, `${s.lifeSeed}/${life}`);
    check('kaydet → yükle: sakinler ve ömürleri aynı', s.characters.map((c) => c.name).join(',') === names && s.characters.map((c) => c.lifespan).join(',') === lifespans);
    check('kaydet → yükle: arazi farkı birebir aynı (taban arazi harita tohumundan yeniden üretilir)', JSON.stringify(scene.saves.snapshot().terrain) === diffBefore && JSON.parse(diffBefore).length >= 6, `${JSON.parse(diffBefore).length} karo`);
    return out;
  }, fixtureRaw);
  results.push(...out);
  allErrors.push(...g.errors);
  await g.browser.close();
}

// ---- 6) Başlangıç ekranı: tohum alanının adı ve notu ----
{
  const g = await openGame({ seed: 1 });
  const out = await g.page.evaluate(() => {
    const text = [...document.querySelectorAll('.title-label')].map((e) => e.textContent).join('|');
    const note = document.querySelector('.title-seed-note')?.textContent ?? '';
    return { text, note };
  });
  check('başlangıç ekranı: "Harita tohumu (isteğe bağlı)" etiketi', out.text.includes('Harita tohumu (isteğe bağlı)'), out.text);
  check('başlangıç ekranı: not "Aynı tohum aynı haritayı verir; sakinler her yeni kasabada farklıdır."', out.note === 'Aynı tohum aynı haritayı verir; sakinler her yeni kasabada farklıdır.', out.note);
  allErrors.push(...g.errors);
  await g.browser.close();
}

const ok = report(allErrors);
process.exit(ok ? 0 : 1);
