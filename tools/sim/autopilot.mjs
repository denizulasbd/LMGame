// Otopilotlu uzun simülasyon: hile yok. Oyuncu gibi toplama emri verir, sırayla yapı kurar ve yükseltir,
// karar olaylarında seçim yapar, stoklar dolunca belediye fermanı ilan eder. (12. aşama) Bilgelik Evi'nde
// araştırma seçer, limanda fazlalık ihracatını açık tutar ve mal birikince ihracat sandığı hazırlar, Gelişmiş
// Şehir olunca Harika'nın üç aşamasını kaynak yettikçe başlatır. Günlük özet, olay günlüğü ve sonunda stokların
// nereye harcandığını (araştırma, ihracat, harika) basar.
//
// Kullanım: node tools/sim/autopilot.mjs [tohum=42] [gün=32] [--save kayit.json] [--passive] [--quiet]
//   --passive : karar pencerelerine dokunmaz (30 sn sonra varsayılan seçenek uygulanır)
//   --save    : simülasyon sonunda oyunu kayıt dosyasına yazar (uyumluluk testinin fikstürü için)
import fs from 'fs';
import { openGame, parseArgs, runHours, STEPS_PER_HOUR } from './lib.mjs';

const { positional, options } = parseArgs();
const seed = Number(positional[0] ?? 42);
const days = Number(positional[1] ?? 32);

const { browser, page, errors } = await openGame({ seed });

await page.evaluate((passive) => {
  const game = window.game;
  const sim = window.sim;
  window.__stats = { crafted: { material: 0, fallback: 0 }, minWelfare: 100, daily: [], spent: { research: {}, wonder: {}, crates: 0 } };
  game.events.on('equipment:crafted', (p) => window.__stats.crafted[p.recipe]++);
  const addSpent = (bucket, cost) => {
    for (const [r, v] of Object.entries(cost)) bucket[r] = (bucket[r] ?? 0) + v;
  };
  game.events.on('research:started', ({ research }) => addSpent(window.__stats.spent.research, research.cost));
  game.events.on('building:placed', ({ building }) => building.type === 'wonder' && addSpent(window.__stats.spent.wonder, building.definition.cost));
  game.events.on('building:projectStarted', ({ building, kind }) => {
    if (kind === 'stage') addSpent(window.__stats.spent.wonder, building.project.spec?.cost ?? building.definition.wonder.stages[building.wonderStage].cost);
  });
  game.events.on('harbor:cratePrepared', () => window.__stats.spent.crates++);
  for (const name of ['research:completed', 'school:graduated', 'harbor:shipped', 'wonder:stageCompleted', 'wonder:completed']) {
    game.events.on(name, (p) => {
      const what = p?.research?.name ?? (p?.skill ? `${p.character.name} -> ${p.skill}` : '') ?? '';
      const extra = name === 'harbor:shipped' ? `+${p.gold} altın (${Object.entries(p.cargo).map(([r, v]) => `${r}${v}`).join(' ')})` : p?.stage ? `${p.stage.name} (${p.index})` : '';
      sim.log.push(`${sim.stamp()} ${name} ${what} ${extra}`.trim());
    });
  }

  // Kurulum sırası (kulübeler yatak dolunca araya girer) ve yükseltme sırası
  const PLAN = [
    'storage', 'lumberHut', 'garden', 'cabin', 'quarry', 'cabin', 'inn', 'workshop', 'sheepFarm', 'cabin', 'market',
    'ironMine', 'garden', 'healerHut', 'cabin', 'mill', 'academy', 'cabin', 'fishingPier', 'cabin', 'storage', 'townHall', 'harbor', 'ironMine', 'mill', 'cabin', 'cabin',
    'monument', 'cabin', 'flowerBed', 'lumberHut', 'cabin', 'sheepFarm', 'garden', 'healerHut', 'storage', 'fishingPier', 'quarry',
  ];
  const UPGRADES = ['cabin', 'cabin', 'lumberHut', 'garden', 'cabin', 'quarry', 'cabin', 'garden', 'cabin', 'cabin', 'lumberHut', 'cabin'];
  const WOOD = { storage: 30, lumberHut: 20, garden: 15, cabin: 25, quarry: 35, inn: 45, workshop: 25, sheepFarm: 30, market: 40, ironMine: 40, mill: 40, fishingPier: 30, townHall: 60, monument: 40, healerHut: 30, flowerBed: 8, academy: 70, harbor: 120 };
  const ESSENTIAL = ['storage', 'lumberHut', 'garden', 'cabin'];
  // İsteğe bağlı yapılar: kaçıncı kopyasından itibaren (kurulamıyorsa sıra beklemeden atlanır)
  const OPTIONAL = { academy: 1, harbor: 1, ironMine: 1, mill: 2 };

  /** Karar politikası: kasabanın yararına olan ve gücü yeten seçenek. */
  const PREFER = {
    refugees: ['recruit', 'feed', 'decline'],
    bards: ['fair', 'show', 'decline'],
    storm: ['fortifyStone', 'fortifyIron', 'risk'],
    wolves: ['fence', 'dogs', 'risk'],
    expedition: ['bigParty', 'scout', 'ignore'],
  };
  window.__decide = () => {
    const scene = game.scenes.current;
    const active = game.state.dilemma.active;
    if (!active || passive) return;
    const system = scene.dilemmas;
    const def = window.__dilemmaDefs?.[active.id];
    for (const id of PREFER[active.id] ?? []) {
      const option = def?.options.find((o) => o.id === id);
      if (option && system.optionStatus(option).ok) {
        game.events.emit('ui:chooseDilemma', { optionId: id });
        return;
      }
    }
  };

  window.__autopilot = () => {
    const s = game.state;
    const scene = game.scenes.current;
    const world = scene.world;
    const map = world.map;
    const plaza = world.landmarks.plaza;
    const cx = plaza.centerX;
    const cy = plaza.centerY;
    const res = s.resources;
    window.__decide();
    window.__stats.minWelfare = Math.min(window.__stats.minWelfare, s.town.welfare ?? 100);
    if (s.time.hour < 6 || s.time.hour >= 18) return;

    // Toplama emirleri
    const pending = (type) => scene.jobs.jobs.filter((j) => j.type === type).length;
    const designateNear = (objects, count) => {
      let made = 0;
      for (let r = 2; r < 26 && made < count; r++) {
        for (let dy = -r; dy <= r && made < count; dy++) {
          for (let dx = -r; dx <= r && made < count; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = cx + dx;
            const y = cy + dy;
            if (!objects.includes(map.getObject(x, y)) || !world.getApproachSpots(x, y).length) continue;
            if (scene.jobs.designate(x, y)) made++;
          }
        }
      }
    };
    const yearDay = s.time.day % 16;
    const autumn = yearDay >= 8 && yearDay < 13;
    if (res.wood < (autumn ? 90 : 45) && pending('chop') < 4) designateNear(['oak', 'pine'], 4);
    if (res.stone < 35 && pending('mine') < 3) designateNear(['rock'], 2);
    if (res.food < 25 && pending('forage') < 3) {
      for (const bush of world.getBuildingsOfType('berryBush')) {
        if (pending('forage') >= 3) break;
        if (bush.berries > 0 && Math.hypot(bush.tileX - cx, bush.tileY - cy) < 22) scene.jobs.designate(bush.tileX, bush.tileY);
      }
    }

    // Fırtına hasarı: hemen onar; stok bolken kadim harabeleri de onar
    for (const b of s.buildings.filter((x) => x.damaged && !x.project)) scene.construction.startProject(b);
    if (res.wood > 90 && res.stone > 90) {
      const ruin = s.buildings.find((x) => x.ruined && !x.project);
      if (ruin) scene.construction.startProject(ruin);
    }

    // Belediye fermanları: stoklar dolunca
    const cap = s.storageCapacity;
    if (world.getCompleted('townHall').length) {
      if (res.wood > cap * 0.6 && res.stone > cap * 0.6 && res.iron > 60) game.events.emit('ui:civicProject', { id: 'storehouse' });
      if (res.wool > 70 && res.iron > 70) game.events.emit('ui:civicProject', { id: 'craftGuild' });
      if (res.bread + res.food > 200 && res.wood > 100) game.events.emit('ui:civicProject', { id: 'grandFeast' });
    }

    // (12. aşama) Bilgelik Evi: kaynak yedekte kalacak kadar varsa sıradaki araştırma
    const ORDER = ['gears', 'architecture', 'insulation', 'herbalism'];
    if (scene.research.academies().length && !s.research.active) {
      // Sıradaki karşılanabilir araştırma (yedekte biraz kaynak kalsın)
      const id = ORDER.find((k) => !s.research.done[k] && Object.entries(window.__research[k].cost).every(([r, v]) => res[r] >= v + 25));
      if (id) game.events.emit('ui:startResearch', { id });
    }
    // Liman: fazlalık ihracatı açık. Harika için biriktirirken sınır yüksek (taş, demir ve yün kalsın), yoksa düşük;
    // harika yükselirken ihracat sandığı hazırlanmaz
    const wonder = s.buildings.find((b) => b.type === 'wonder');
    const saving = s.town.tier >= 4 && !wonder?.wonderComplete;
    for (const h of world.getCompleted('harbor')) {
      const threshold = saving ? 550 : 250;
      if (h.exportThreshold !== threshold) game.events.emit('ui:setExportThreshold', { buildingId: h.id, threshold });
      if (!saving && !h.crate && (res.wool > 300 || res.iron > 300 || res.bread > 300)) game.events.emit('ui:prepareCrate', { buildingId: h.id });
    }
    // Harika: Gelişmiş Şehir'de kurulur, aşamalar kaynak yettikçe başlatılır
    if (s.town.tier >= 4 && !wonder && Object.entries(window.__wonder.cost).every(([r, v]) => res[r] >= v)) {
      const spot = sim.findSpot('wonder', 34);
      if (spot) scene.construction.placeSite('wonder', spot.x, spot.y);
    } else if (wonder && wonder.functional && !wonder.project && !wonder.wonderComplete) {
      const stage = window.__wonder.wonder.stages[wonder.wonderStage];
      if (Object.entries(stage.cost).every(([r, v]) => res[r] >= v)) scene.construction.startProject(wonder);
    }

    const sites = s.buildings.filter((b) => (b.underConstruction || b.project) && b.type !== 'wonder').length;
    if (sites >= 2) return;
    const beds = s.buildings.filter((b) => b.functional && b.capacity).reduce((n, b) => n + b.capacity, 0);
    const counts = {};
    for (const b of s.buildings) counts[b.type] = (counts[b.type] ?? 0) + 1;
    // Sıradaki yapı: plandaki ilk eksik. İsteğe bağlı yapılar (liman, Bilgelik Evi, ikinci maden) şu an kurulamıyorsa
    // (seviye yetmiyor ya da uygun yer yok) atlanır; ötekiler sırayı bekletir (oyuncu da önce onları kurardı)
    const planned = {};
    let next = null;
    let nextSpot = null;
    for (const type of PLAN) {
      planned[type] = (planned[type] ?? 0) + 1;
      if ((counts[type] ?? 0) >= planned[type]) continue;
      if (planned[type] >= (OPTIONAL[type] ?? Infinity)) {
        const spot = sim.findSpot(type, type === 'harbor' ? 45 : 30);
        if (!spot) continue;
        nextSpot = spot;
      }
      next = type;
      break;
    }
    if (s.characters.length >= beds - 1 && s.characters.length < 30 && (counts.cabin ?? 0) < 14) {
      next = 'cabin';
      nextSpot = null;
    }
    if (res.wood > 70 && res.stone > 55) {
      for (const type of UPGRADES) {
        const b = s.buildings.find((x) => x.type === type && x.functional && !x.upgraded && !x.project && !x.damaged);
        if (b && scene.construction.startProject(b).ok) return;
      }
    }
    if (!next) return;
    if (!ESSENTIAL.includes(next) && res.wood - (WOOD[next] ?? 0) < (autumn ? 50 : 15)) return;
    const spot = nextSpot ?? sim.findSpot(next);
    if (spot) scene.construction.placeSite(next, spot.x, spot.y);
  };
}, Boolean(options.passive));
// Olay tanımlarını sayfaya ver (karar politikası seçeneklere bakar)
await page.evaluate(async () => {
  const { DILEMMAS } = await import('/src/data/dilemmas.js');
  const { RESEARCH } = await import('/src/data/research.js');
  const { BUILDINGS } = await import('/src/data/buildings.js');
  window.__dilemmaDefs = DILEMMAS;
  window.__research = RESEARCH;
  window.__wonder = BUILDINGS.wonder;
});

function summary() {
  return page.evaluate(() => {
    const s = window.game.state;
    const counts = {};
    for (const b of s.buildings.filter((x) => x.functional && !['berryBush', 'bench', 'fountain', 'campfire'].includes(x.type))) {
      const key = b.type + (b.upgraded ? '2' : '');
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const r = s.resources;
    const sick = s.characters.filter((c) => c.illness).length;
    const pets = s.animals.filter((a) => a.isPet).length;
    window.__stats.daily.push({ day: s.time.day, cap: s.storageCapacity, wood: r.wood, stone: r.stone, food: r.food, wool: r.wool, iron: r.iron, bread: r.bread });
    const wonder = s.buildings.find((b) => b.type === 'wonder');
    const p12 = `araştırma=${Object.keys(s.research.done).length}${s.research.active ? `+${s.research.active.id}` : ''} altın=${r.gold} sefer=${s.trade.shipments} harika=${wonder ? wonder.wonderStage + (wonder.project ? '+' : '') : '-'} mezun=${s.characters.filter((c) => c.educated).length}`;
    return (
      `G${s.time.day} nüfus=${s.characters.length}(${s.characters.filter((c) => c.isChild).length}ç) seviye=${s.town.tier} refah=${Math.round(s.town.welfare)} ` +
      `O${r.wood} T${r.stone} Y${r.food} yün${r.wool} demir${r.iron} ekmek${r.bread} depo=${s.storageCapacity} | ${p12} | hasta=${sick} hastalık=${s.stats.illnesses} şifa=${s.stats.cured} ` +
      `evcil=${pets} sevme=${s.stats.petted} karar=${s.stats.dilemmas} ferman=${s.civic.decrees} | ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' ')}`
    );
  });
}

for (let d = 0; d < days; d++) {
  for (let h = 0; h < 4; h++) await runHours(page, 6, '__autopilot');
  if (!options.quiet) console.log(await summary());
}
console.log(await summary());
const report = await page.evaluate(() => {
  const scene = window.game.scenes.current;
  const world = scene.world;
  const stalled = window.game.state.buildings
    .filter((b) => b.functional && b.workerSlots && !['inn'].includes(b.type) && world.getSpots(b).length === 0)
    .map((b) => `${b.type}@${b.tileX},${b.tileY}`);
  const s = window.game.state;
  return {
    log: window.sim.log,
    stats: window.__stats,
    stalled,
    wild: s.animals.filter((a) => !a.isPet).length,
    trade: s.trade,
    research: Object.keys(s.research.done),
    wonder: s.buildings.find((b) => b.type === 'wonder')?.wonderStage ?? 0,
    gold: s.resources.gold,
  };
});
console.log(report.log.join('\n'));
console.log(`ekipman: asıl tarif ${report.stats.crafted.material}, eski usul ${report.stats.crafted.fallback}`);
console.log(`en düşük ortalama refah: %${Math.round(report.stats.minWelfare)} · yaban hayvanı: ${report.wild}`);
console.log('girişi kopuk üretim yapısı:', report.stalled.length ? report.stalled.join(', ') : 'yok');
// 12. aşama: geç oyunda biriken stoklar nereye harcandı?
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const fmt = (o) => Object.entries(o).map(([r, v]) => `${r} ${v}`).join(', ') || '-';
const { spent } = report.stats;
console.log(`araştırmalar (${report.research.length}/4: ${report.research.join(', ') || '-'}): ${sum(spent.research)} birim (${fmt(spent.research)})`);
console.log(`ihracat: ${report.trade.shipments} sefer, ${sum(report.trade.exported)} birim (${fmt(report.trade.exported)}), ${report.trade.goldEarned} altın kazanıldı; ${spent.crates} sandık`);
console.log(`harika: aşama ${report.wonder}/3, ${sum(spent.wonder)} birim (${fmt(spent.wonder)}); hazinede ${report.gold} altın`);
const late = report.stats.daily.slice(-12);
if (late.length) {
  const keys = ['wood', 'stone', 'food', 'wool', 'iron', 'bread'];
  const avg = Object.fromEntries(keys.map((k) => [k, Math.round(late.reduce((a, d) => a + d[k], 0) / late.length)]));
  const full = late.filter((d) => keys.some((k) => d[k] >= d.cap)).length;
  console.log(`son ${late.length} gün ortalama stok: ${fmt(avg)} · depo ${late[late.length - 1].cap} · deposu dolan gün: ${full}`);
}
if (options.save) {
  const snapshot = await page.evaluate(async () => {
    const { CONFIG } = await import('/src/config.js');
    return JSON.stringify({ ...window.game.scenes.current.saves.snapshot(), version: CONFIG.SAVE_VERSION, savedAt: 0 });
  });
  fs.writeFileSync(options.save, snapshot);
  console.log('kayıt yazıldı:', options.save);
}
console.log('Sayfa hataları:', errors.length ? `\n${errors.slice(0, 20).join('\n')}` : 'yok');
await browser.close();
process.exit(errors.length ? 1 : 0);
