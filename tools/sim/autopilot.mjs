// Otopilotlu uzun simülasyon: hile yok. Oyuncu gibi toplama emri verir, sırayla yapı kurar ve yükseltir,
// karar olaylarında seçim yapar, stoklar dolunca belediye fermanı ilan eder. (12. aşama) Bilgelik Evi'nde
// araştırma seçer, limanda fazlalık ihracatını açık tutar ve mal birikince ihracat sandığı hazırlar, Gelişmiş
// Şehir olunca Harika'nın üç aşamasını kaynak yettikçe başlatır. (13. aşama) Harika bitince hazinedeki altını
// yadigârlara, lüks mallara ve altın fermanlarına harcar; planın sonunda peyzaj yapıları (kiraz, çardak, kemer, çit)
// kurar. (14. aşama) Harika bittikten sonra Büyük İhracat Seferi'ni bekleme süresi dolunca ilan eder; sonunda mevsim
// festivallerini, sakinlerin anılarını ve nadir hava olaylarını raporlar. Günlük özet, olay günlüğü ve sonunda stokların
// nereye harcandığını (araştırma, ihracat, harika) basar. (18. aşama) İmar: her yeni yapının kapısını en yakın yola
// toprak patikayla bağlar (en kısa yol BFS ile, yalnızca doğal zemin döşenir), taş bolken meydana yakın patikaları parke
// taşa çevirir, mahalle tabelası, park bankı, saksı, fener ve süs ağaçları diker, bir bahçeyi ahşap çitle çevirir;
// sonunda döşenen yolu, estetik puanını ve yürüyüşlerin yollardan geçme oranını raporlar. (19. aşama) Sosyal yaşamı
// raporlar: evli çiftler ve aynı evde yaşayanlar, randevu, düğün kutlaması, akşam yemeği, boşalan ev, dedikodu, huyların
// davranışları, en düşük nüfus ve evsizler; bekçinin sosyal sıkışma raporu (taşınamayan / ayrı kalan çift) çıkış kodunu etkiler.
// (20. aşama) Ulu Saat Kulesi'ni Kasaba seviyesinde ve 20 sakinle kurar, aşamaları kaynak ve Kadim Dişli yettikçe başlatır;
// Altın Çağ'da Mermer Çeşme ve Altın Çağ Feneri diker, tüccardan antik kitap ve nadir tohum alır; aşama günlerini, dökülen
// dişlileri, baş ustayı, çanları ve Tarihçe'yi raporlar. (21. aşama) Vatandaş dilekçelerini yanıtlar: fidan, bank, sağlam alet
// ve meydanda buluşma isteklerini bedelini ödeyip hemen karşılar ("Hemen Karşıla"), ötekileri kabul edip yerine getirmeye
// çalışır (kışlık stok için ek kesim / toplama emri, araştırma, antik kitap); güven düşerse acil erzak / altın dağıtır.
// Güveni, dilekçe sonuçlarını, isyanı, yevmiyeleri, alışverişi ve çantalardaki eşyaları raporlar. (22. aşama) İç vergiyi
// dengeli yönetir (güven düşerse Düşük / Muaf, toparlanınca Standart; Ağır Vergi'ye hiç geçmez), tahsildar yoldayken hazineyi
// lüks harcamalara açmaz, Kraliyet Fermanlarını kaynak yettiğinde teslim eder, Kraliyet Beratı gelince Aslanlı Heykel'i diker;
// vergileri, Krallık Vergisi ödemelerini, fermanları ve terk edenleri raporlar. (23. aşama) Krizleri yönetir: kasabaya bir Su Kuyusu
// ve (Kasaba seviyesinde) bir Gözcü Kulesi diker; yangın çıkınca "Acil Söndür" der, hasarlı yapıyı "Tamir Et" ile hemen onarır;
// haydut izi gelince savunma yetiyorsa püskürtür, yetmiyorsa haraç öder (ikisi de olmazsa hazırlıksız yakalanır); yangın, hasar,
// baskın, yaralanma ve iyileşme sayılarını raporlar. (24. aşama) Tarımsal çeşitlilik: Ulu Saat Kulesi tamamlanınca (kulenin taşı, kerestesi
// ve altını kısılmasın) bahçelerin yanına bir Ürün Silosu kurar; silo varken ve kişi başı besin bolken (en az 3 bahçeyle) bir bahçeye
// Keten, (4 bahçeyle) birine Şerbetçiotu ektirir.
// Gıda kritikse (kişi başı besin 6'nın altında) bütün bahçeleri hemen Buğday'a döndürür; ekilen malın deposu dolunca da o bahçe
// Buğday'a döner. Ekim değişikliklerini, kritik gıda saatlerini, keten / şerbetçiotu hasadını ve bozulan mahsulü raporlar.
// (24.2) Kule tamamlanmış, nüfus 22+ ve kişi başı besin 10'un üstündeyken (temel gıda ve kule hedefleri güvende) silodan sonra
// dördüncü bir bahçe (Şerbetçiotu için), handa ya da pazarın yanında bir Dokuma Tezgâhı ve bir Şerbethane kurar; dokumacı ve mahzen
// ustası iş seçiminde temel üretimden sonra gelir. Dokunan kumaşı, yapılan fıçıları, handa içilen şerbeti, testileri ve giysileri raporlar.
// (24.3) Kule ve Dokuma Tezgâhı tamamlandıktan sonra yolun / nehrin kenarına bir Ticaret İskelesi kurar. Gemi / kervan buradayken
// rezervler korunduğu sürece (en az 10 kumaş, 5 fıçı şerbet, 30 yün; ekmek / erzak satışından sonra kişi başı en az 12 besin)
// ihracat sözleşmelerini tamamlar; hazinede bol altın varken (vergi ayrıldıktan sonra 400+) odun 60, taş 50, demir 20'nin altına
// inince hammadde paketi ithal eder. Ziyaretleri, sözleşmeleri, ithalatı ve pazar çarpanlarını raporlar.
// (25.1) Yaşam evrelerini raporlar: evre sayıları, emekli bilgeler, yaş aralığı, unvanı alan bilgeler, nasihat dakikası ve
// emekliyken işte görülen bilge (bekçi: evre / yaş sayacı tutarlılığı ve çekirdek sakin güvencesi kopuk referans sayılır).
//
// Kullanım: node tools/sim/autopilot.mjs [tohum=42] [gün=32] [--speed 1|2|4] [--save kayit.json] [--json rapor.json] [--passive] [--quiet]
//                                         [--crisis huzurlu|dengeli|cetin] [--no-safety] [--crisis-state]
//   --passive : karar pencerelerine dokunmaz (30 sn sonra varsayılan seçenek uygulanır)
//   --speed   : oyun hızı (varsayılan 4); 1x'te aynı oyun günü dört kat çok, daha küçük adımla geçer
//   --save    : simülasyon sonunda oyunu kayıt dosyasına yazar (uyumluluk testinin fikstürü için)
//   --crisis  : (23. aşama) tehlike sıklığı (varsayılan dengeli); huzurlu + --no-safety, 22. aşamayla bire bir aynı koşuyu verir
//   --crisis-state : (23. aşama) kayıttan hemen önce bir yangın, bir hasarlı yapı, bir yaralı ve bekleyen bir haydut baskını oluşturur
//               (save-v20.json fikstürü bu bayrakla üretilir: kriz alanlarının hepsi kayda girer)
//   --no-agri : (24. aşama) Ürün Silosu kurulmaz ve bahçeler hep Buğday ekili kalır (mahsul bozulması yine işler)
//   --no-apprentice : (25.2) Çırak Kapısı hiç açılmaz (çıraklık katmanının kapalıyken oyunu hiç değiştirmediğini göstermek için)
//   --no-safety : (23. aşama) Su Kuyusu ve Gözcü Kulesi kurulmaz, yangın / hasar / baskın politikası da kapalıdır (kriz sisteminin
//               oyunun ana üretecini tüketmediğini göstermek için: --crisis huzurlu ile 22. aşamanın koşusunu bire bir verir)
//   --json    : bekçinin (monitor.mjs) raporunu ve özet metrikleri dosyaya yazar; takılma ya da kopuk referans
//               bulunursa çıkış kodu 1 olur
import fs from 'fs';
import { openGame, parseArgs, runHours } from './lib.mjs';
import { installMonitor, monitorReport } from './monitor.mjs';

const { positional, options } = parseArgs();
const seed = Number(positional[0] ?? 42);
const days = Number(positional[1] ?? 32);
const speed = Number(options.speed ?? 4);

const { browser, page, errors } = await openGame({ seed });
await page.evaluate((speed) => (window.game.state.time.speed = speed), speed);
await installMonitor(page);
await page.evaluate((o) => {
  window.__noSafety = o.noSafety;
  window.__noAgri = o.noAgri; // (24. aşama)
  window.__noApprentice = o.noApprentice; // (25.2)
  if (o.crisis) window.game.state.crisis.difficulty = o.crisis; // doğrudan durumdan (bildirim / ses tüketmesin: huzurlu + --no-safety koşusu 22. aşamayla bire bir aynı olmalı)
}, { noSafety: Boolean(options['no-safety']), noAgri: Boolean(options['no-agri']), noApprentice: Boolean(options['no-apprentice']), crisis: options.crisis ?? null });

await page.evaluate((passive) => {
  const game = window.game;
  const sim = window.sim;
  window.__stats = { crafted: { material: 0, fallback: 0 }, minWelfare: 100, daily: [], spent: { research: {}, wonder: {}, crates: 0 }, gears: 0 };
  game.events.on('goldenAge:gearCast', () => window.__stats.gears++);
  window.__stats.patrolShifts = 0;
  game.events.on('work:shiftEnded', ({ activity }) => activity === 'patrol' && window.__stats.patrolShifts++); // (23. aşama) bekçi vardiyaları
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
  window.__stats.weather = {};
  game.events.on('adventure:resolved', ({ success }) => { if (!success) window.__stats.mishaps = (window.__stats.mishaps ?? 0) + 1; });
  game.events.on('weather:changed', ({ type }) => (window.__stats.weather[type] = (window.__stats.weather[type] ?? 0) + 1));
  window.__stats.festivals = [];
  game.events.on('seasonFestival:ended', ({ theme, attendees }) => window.__stats.festivals.push(`G${game.state.time.day - 1} ${theme}:${attendees.length}`));
  window.__stats.gold = { relics: 0, goods: 0, decrees: 0, items: [] };
  game.events.on('relic:exhibited', ({ relic, price }) => {
    window.__stats.gold.relics += price;
    window.__stats.gold.items.push(relic.name);
  });
  game.events.on('luxury:bought', ({ good, price }) => {
    window.__stats.gold.goods += price;
    window.__stats.gold.items.push(good.name);
  });
  game.events.on('goldDecree:issued', ({ decree, price }) => {
    window.__stats.gold.decrees += price;
    window.__stats.gold.items.push(decree.name);
  });
  for (const name of ['research:completed', 'school:graduated', 'harbor:shipped', 'wonder:stageCompleted', 'wonder:completed', 'goldenAge:began', 'goldenAge:celebrationEnded']) {
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
    'cherryTree', 'gazebo', 'marbleArch', 'flowerFence', 'flowerFence', 'cherryTree',
  ];
  // (23. aşama) Su Kuyusu ve Gözcü Kulesi: seviye ve kaynak yettiğinde (isteğe bağlı) PLAN'ın başına yakın kurulur
  if (!window.__noSafety) {
    PLAN.splice(PLAN.indexOf('mill') + 1, 0, 'well');
    PLAN.splice(PLAN.indexOf('townHall') + 1, 0, 'guardTower');
  }
  const UPGRADES = ['cabin', 'cabin', 'lumberHut', 'garden', 'cabin', 'quarry', 'cabin', 'garden', 'cabin', 'cabin', 'lumberHut', 'cabin'];
  const WOOD = { storage: 30, lumberHut: 20, garden: 15, cabin: 25, quarry: 35, inn: 45, workshop: 25, sheepFarm: 30, market: 40, ironMine: 40, mill: 40, fishingPier: 30, townHall: 60, monument: 40, healerHut: 30, flowerBed: 8, academy: 70, harbor: 120, well: 15, guardTower: 50, silo: 40 };
  const ESSENTIAL = ['storage', 'lumberHut', 'garden', 'cabin'];
  // (23. aşama) Su Kuyusu ateşli yapıların (fırın, atölye) yanına, Gözcü Kulesi meydandan uzağa (kenar mahalleye) dikilir: meydana
  // yakın boş yerleri (Ulu Saat Kulesi gibi büyük yapılara lazım) kapatmasın
  const SAFETY = ['well', 'guardTower'];
  const safetySpot = (type) => {
    if (!SAFETY.includes(type) && !['silo', 'loom', 'brewery'].includes(type)) return null;
    const scene = game.scenes.current;
    const plaza = scene.world.landmarks.plaza;
    const anchorTypes = type === 'silo' ? ['garden', 'mill'] : type === 'loom' || type === 'brewery' ? ['inn', 'market', 'workshop'] : ['mill', 'workshop'];
    const anchor = ['well', 'silo', 'loom', 'brewery'].includes(type) ? game.state.buildings.find((b) => b.functional && anchorTypes.includes(b.type)) : null;
    if (['silo', 'loom', 'brewery'].includes(type) && !anchor) return null;
    const [ax, ay, from, to] = anchor ? [anchor.tileX, anchor.tileY, 2, 7] : [plaza.centerX, plaza.centerY, 13, 34];
    for (let r = from; r <= to; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (scene.construction.checkPlacement(type, ax + dx, ay + dy).ok) return { x: ax + dx, y: ay + dy };
        }
      }
    }
    return null;
  };
  // İsteğe bağlı yapılar: kaçıncı kopyasından itibaren (kurulamıyorsa sıra beklemeden atlanır)
  const OPTIONAL = { academy: 1, harbor: 1, ironMine: 1, mill: 2, cherryTree: 1, gazebo: 1, marbleArch: 1, flowerFence: 1, well: 1, guardTower: 1, silo: 1 };

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
    // (16. aşama) Macera: kafileyle riski en çok %15 olan ganimetli yollardan en değerlisi (bulgusu çok olan), yoksa
    // güvenli kamp. Kazasız geçen riskli yollar (usta + alet) önce gelir.
    if (active.kind === 'adventure') {
      const X = window.__exploration;
      const scen = window.__adventures[active.id];
      const members = (game.state.dilemma.expedition?.members ?? []).map((id) => scene.world.getCharacter(id)).filter(Boolean);
      const value = (o) => (o.finds ?? []).reduce((a, f) => a + f.chance, 0) + Object.keys(o.loot ?? {}).length * 0.1;
      const options = scen.options
        .map((o) => ({ o, risk: X.optionRisk(members, o).chance }))
        .filter((x) => x.risk <= 0.15)
        .sort((a, b) => value(b.o) - value(a.o) || a.risk - b.risk);
      const pick = options[0]?.o ?? scen.options.find((o) => o.default);
      window.__stats.adventureChoices = window.__stats.adventureChoices ?? {};
      const key = `${pick.risk ? (options[0].risk === 0 ? 'güvenli-riskli' : 'riskli') : 'kamp/güvenli'}`;
      window.__stats.adventureChoices[key] = (window.__stats.adventureChoices[key] ?? 0) + 1;
      game.events.emit('ui:chooseDilemma', { optionId: pick.id });
      return;
    }
    const def = window.__dilemmaDefs?.[active.id];
    for (const id of PREFER[active.id] ?? []) {
      const option = def?.options.find((o) => o.id === id);
      if (option && system.optionStatus(option).ok) {
        game.events.emit('ui:chooseDilemma', { optionId: id });
        return;
      }
    }
  };


  // (18. aşama) İmar ve peyzaj otopilotu
  window.__landscapeStats = { pathTiles: 0, cobbleTiles: 0, plazaTiles: 0, linked: 0, onRoad: 0, walked: 0, decor: {} };
  game.events.on('terrain:painted', ({ type }) => {
    if (type === 'path') window.__landscapeStats.pathTiles++;
    if (type === 'stonePath') window.__landscapeStats.cobbleTiles++;
    if (type === 'plazaTile') window.__landscapeStats.plazaTiles++;
  });
  const linked = new Set();
  const ROADS = new Set(['path', 'cobble', 'plaza', 'bridge']);
  const DECOR_PLAN = [
    { type: 'signpost', count: 1, tier: 1, wood: 20 },
    { type: 'planter', count: 4, tier: 1, wood: 30 },
    { type: 'parkBench', count: 2, tier: 2, wood: 40 },
    { type: 'oakTree', count: 2, tier: 2, wood: 40 },
    { type: 'birchTree', count: 2, tier: 2, wood: 40 },
    { type: 'pineTree', count: 2, tier: 2, wood: 40 },
    { type: 'ironLantern', count: 3, tier: 3, wood: 30 },
    { type: 'lantern', count: 2, tier: 2, wood: 40 },
    { type: 'signpost', count: 2, tier: 3, wood: 40 },
  ];
  /** Bir karodan en yakın yol karosuna en kısa yürünebilir rota (BFS, en çok 30 adım); rota üzerindeki doğal zemin. */
  const routeToRoad = (world, sx, sy) => {
    const map = world.map;
    const key = (x, y) => y * map.width + x;
    const prev = new Map([[key(sx, sy), null]]);
    const queue = [[sx, sy, 0]];
    while (queue.length) {
      const [x, y, d] = queue.shift();
      if (ROADS.has(map.get(x, y)) && (x !== sx || y !== sy)) {
        const tiles = [];
        let k = prev.get(key(x, y));
        while (k !== null && k !== undefined) {
          const tx = k % map.width;
          const ty = Math.floor(k / map.width);
          tiles.push({ x: tx, y: ty });
          k = prev.get(k);
        }
        return tiles;
      }
      if (ROADS.has(map.get(x, y))) return [];
      if (d >= 30) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!map.inBounds(nx, ny) || prev.has(key(nx, ny)) || !map.isWalkable(nx, ny)) continue;
        prev.set(key(nx, ny), key(x, y));
        queue.push([nx, ny, d + 1]);
      }
    }
    return null;
  };
  window.__imar = (scene, s, res) => {
    const world = scene.world;
    const map = world.map;
    const L = window.__landscapeStats;
    // Yürüyenlerin rotalarının ne kadarı yollardan geçiyor?
    for (const c of s.characters) {
      if (!c.visible || !c.waypoints) continue;
      for (const p of c.remainingWaypoints()) {
        const tx = Math.floor(p.x / 16);
        const ty = Math.floor(p.y / 16);
        L.walked++;
        if (ROADS.has(map.get(tx, ty))) L.onRoad++;
      }
    }
    if (s.time.hour !== 9 && s.time.hour !== 14) return;
    // 1) Kapıları yola bağla (yapı başına bir kez; odun yedekte kalsın)
    let painted = 0;
    for (const b of world.getCompleted()) {
      if (linked.has(b.id) || painted >= 12 || res.wood < 30) continue;
      const def = b.definition;
      if (def.spots === 'none' || !def.buildable || def.size.w * def.size.h < 2) continue;
      const doors = world.getSpots(b);
      if (!doors.length) continue;
      const d = doors[0];
      const route = routeToRoad(world, d.x, d.y);
      linked.add(b.id);
      if (!route) continue;
      for (const t of [{ x: d.x, y: d.y }, ...route]) {
        if (painted >= 12 || res.wood < 25) break;
        if (scene.construction.checkPaint('path', t.x, t.y).ok && scene.construction.paintTile('path', t.x, t.y).ok) painted++;
      }
      L.linked++;
    }
    if (painted) world.refreshStaticData();
    // 2) Taş bolken meydana yakın patikaları parke taşa çevir (günde en çok 8 karo)
    if (res.stone > 80) {
      const plaza = world.landmarks.plaza;
      let paved = 0;
      for (let r = 1; r < 14 && paved < 8; r++) {
        for (let dy = -r; dy <= r && paved < 8; dy++) {
          for (let dx = -r; dx <= r && paved < 8; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = plaza.centerX + dx;
            const y = plaza.centerY + dy;
            if (map.get(x, y) === 'path' && scene.construction.checkPaint('stonePath', x, y).ok && scene.construction.paintTile('stonePath', x, y).ok) paved++;
          }
        }
      }
      if (paved) world.refreshStaticData();
    }
    // 3) Sokak eşyaları ve süs ağaçları (sırayla; her çağrıda en çok bir tane)
    const have = (t) => s.buildings.filter((b) => b.type === t).length;
    const planned = {};
    for (const item of DECOR_PLAN) {
      planned[item.type] = (planned[item.type] ?? 0) + item.count;
      if (have(item.type) >= planned[item.type] || s.town.tier < item.tier || res.wood < item.wood) continue;
      if (!scene.economy.canAfford(window.__buildings[item.type].cost)) continue;
      const spot = sim.findSpot(item.type, 14);
      if (spot && scene.construction.placeSite(item.type, spot.x, spot.y, { quiet: true }).ok) {
        L.decor[item.type] = (L.decor[item.type] ?? 0) + 1;
        break;
      }
    }
    // 4) Bir bahçenin üst kenarına ahşap çit (bir kez; yerleşim kuralı geçitleri kapatmayı engeller)
    if (!window.__fenced && s.town.tier >= 2 && res.wood > 60) {
      const garden = world.getCompleted('garden')[0];
      if (garden) {
        window.__fenced = true;
        const { w } = garden.definition.size;
        for (let x = garden.tileX - 1; x <= garden.tileX + w; x++) {
          if (scene.construction.checkPlacement('woodFence', x, garden.tileY - 1).ok) {
            scene.construction.placeSite('woodFence', x, garden.tileY - 1, { quiet: true });
            L.decor.woodFence = (L.decor.woodFence ?? 0) + 1;
          }
        }
      }
    }
  };

  // Bekçi saat buçuğunda örnek alır (runHours'un ikinci işlevi): saat başındaki otopilot eylemleri ve görev
  // geçişleri örneğe "görevsiz sakin" olarak yansımasın
  window.__sample = () => window.__monitor.sample();

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
    // (21. aşama) Vatandaş dilekçeleri ve Yönetim Güveni
    {
      const PT = window.__petitions;
      for (const p of [...s.petitions.list]) {
        const grant = PT.grantStatus(s, p, s.equipment.sturdyTool ?? 0);
        const spare = p.kind !== 'tool' || (s.equipment.sturdyTool ?? 0) > 0 || (res.iron >= 12 && res.wood >= 30);
        if (grant.available && grant.ok && spare) {
          game.events.emit('ui:grantPetition', { id: p.id });
          if (!s.petitions.list.includes(p)) continue;
        }
        if (p.status !== 'accepted') game.events.emit('ui:acceptPetition', { id: p.id });
        if (p.kind === 'stock' && s.time.hour >= 6 && s.time.hour < 18) {
          if (res.wood < p.target.wood && scene.jobs.jobs.filter((j) => j.type === 'chop').length < 6) {
            let made = 0;
            for (let r = 2; r < 26 && made < 3; r++) {
              for (let dy = -r; dy <= r && made < 3; dy++) {
                for (let dx = -r; dx <= r && made < 3; dx++) {
                  if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                  const x = cx + dx;
                  const y = cy + dy;
                  if (!['oak', 'pine'].includes(map.getObject(x, y)) || !world.getApproachSpots(x, y).length) continue;
                  if (scene.jobs.designate(x, y)) made++;
                }
              }
            }
          }
        }
      }
      // (22. aşama) İç vergi: güven düştükçe hafiflet, toparlanınca Standart'a dön
      {
        const CR = window.__crown;
        const t = s.trust.value;
        const want = t < 40 ? 'exempt' : t < 62 ? 'low' : 'standard';
        if (s.tax.rate !== want) game.events.emit('ui:setTaxRate', { rate: want });
        const d = s.crown.decree;
        if (d && CR.decreeStatus(s, d).ok) {
          const margin = Object.entries(d.need ?? {}).every(([r, v]) => res[r] >= v + 25);
          if (margin || d.deadline - s.totalMinutes < 12 * 60) game.events.emit('ui:deliverDecree');
        }
        if (s.crown.statueRight && !s.buildings.some((b) => b.type === 'royalStatue') && res.stone >= 90 && res.gold >= 220) {
          const spot = sim.findSpot('royalStatue', 16);
          if (spot) scene.construction.placeSite('royalStatue', spot.x, spot.y);
        }
      }
      // (23. aşama) Krizler: yangını söndür, hasarlıyı tamir et, haydut izine karşı püskürt / uzlaş
      if (!window.__noSafety) {
        const CRI = window.__crisis;
        // Sakinler kovalarla uğraşır; yangın yarıyı aşarsa oyuncu "Acil Söndür" der
        for (const b of s.buildings) if (b.isBurning && b.fireProgress >= 45) game.events.emit('ui:extinguish', { buildingId: b.id });
        for (const b of s.buildings) if (b.damaged && !b.isBurning && !b.project) game.events.emit('ui:repairBuilding', { buildingId: b.id });
        const raid = s.crisis.raid;
        if (raid) {
          const choice = CRI.defenseStatus(s).ok ? 'defend' : CRI.tributeStatus(s, raid.tribute).ok ? 'tribute' : 'caught';
          game.events.emit('ui:raidChoice', { choice });
          window.__stats.raidChoices = window.__stats.raidChoices ?? {};
          window.__stats.raidChoices[choice] = (window.__stats.raidChoices[choice] ?? 0) + 1;
        }
      }
      // (24. aşama) Ekim tercihi: gıda kritikse hepsi Buğday; silo varken ve besin bolken bir bahçe Keten, biri Şerbetçiotu
      if (!window.__noAgri) {
        const GR = window.__granary;
        const A = (window.__stats.agri ??= { toGrain: 0, toFlax: 0, toHops: 0, critical: 0, fullBack: 0 });
        const gardens = world.getCompleted('garden').filter((b) => !b.damaged).sort((a, b) => a.id - b.id);
        const pop = Math.max(1, s.characters.length);
        const supply = window.__foodSupply(s);
        const setCrop = (b, crop, why) => {
          if (b.crop === crop) return;
          game.events.emit('ui:setCrop', { buildingId: b.id, crop });
          if (b.crop !== crop) return;
          if (crop === 'grain') A.toGrain++;
          else A[crop === 'flax' ? 'toFlax' : 'toHops']++;
          if (why) A[why]++;
        };
        if (supply < pop * 6) {
          if (gardens.some((b) => b.crop !== 'grain')) A.critical++;
          for (const b of gardens) setCrop(b, 'grain');
        } else {
          const silo = s.buildings.some((b) => b.type === 'silo' && b.functional);
          const ample = silo && supply > pop * 10;
          const want = new Map();
          if (ample && gardens.length >= 3) want.set(gardens[gardens.length - 1], 'flax');
          if (ample && gardens.length >= 4) want.set(gardens[gardens.length - 2], 'hops');
          for (const b of gardens) {
            const crop = want.get(b);
            const room = crop && res[crop] < GR.storageLimit(s, crop) * 0.9;
            if (crop && room) setCrop(b, crop);
            else if (b.crop !== 'grain' && (!crop || !room)) setCrop(b, 'grain', crop ? 'fullBack' : null);
          }
        }
      }
      // (24.3) Dış ticaret: rezervleri koruyarak ihracat, altın bolken kritik hammaddeyi ithal et
      if (!window.__noAgri && s.tradePost?.ship && window.__tradePost.shipDocked(s)) {
        const TPm = window.__tradePost;
        const X = (window.__stats.trade ??= { contracts: 0, gold: 0, imports: 0, held: 0 });
        const pop = Math.max(1, s.characters.length);
        const RESERVE = { cloth: 10, sherbet: 5, wool: 30 };
        s.tradePost.ship.contracts.forEach((c, i) => {
          if (c.done || !TPm.contractStatus(s, i).ok) return;
          const value = c.resource === 'bread' ? 2.5 : c.resource === 'food' ? 1 : 0;
          const keep = value ? window.__foodSupply(s) - c.qty * value >= pop * 12 : res[c.resource] - c.qty >= (RESERVE[c.resource] ?? 0);
          if (!keep) {
            X.held++;
            return;
          }
          const gold = TPm.contractStatus(s, i).gold;
          game.events.emit('ui:completeContract', { index: i });
          if (c.done) {
            X.contracts++;
            X.gold += gold;
          }
        });
        const reserveGold = 400 + (s.crown.notice ? s.crown.notice.amount : 0);
        const LOW = { wood: 60, stone: 50, iron: 20 };
        for (const kind of ['wood', 'stone', 'iron']) {
          if (res[kind] < LOW[kind] && res.gold >= reserveGold && TPm.importStatus(s, kind).ok) {
            game.events.emit('ui:importPackage', { kind });
            X.imports++;
          }
        }
      }
      // Güven düşerse (ya da isyan çıkarsa) acil dağıtım
      const T = window.__trust;
      if (s.trust.revolt || s.trust.value < 40) {
        for (const kind of ['food', 'gold']) if (T.reliefStatus(s, kind).ok) game.events.emit('ui:relief', { kind });
      }
    }
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
    // Liman: fazlalık ihracatı açık. Harika için biriktirirken sınır yüksek (taş, demir ve yün kalsın), önce düşük (250),
    // harika bitince oyunun varsayılanı (400); (14. aşama) stok 400'ün çok üstüne çıkınca Büyük İhracat Seferi;
    // harika yükselirken ihracat sandığı hazırlanmaz
    const wonder = s.buildings.find((b) => b.type === 'wonder');
    // (20. aşama) Ulu Saat Kulesi Kasaba seviyesinde ve 20 sakinle açılır: o andan itibaren biriktirilir
    const towerOpen = s.town.tier >= window.__wonder.requiresTier && s.characters.length >= window.__wonder.requiresPopulation;
    const saving = (towerOpen || wonder) && !wonder?.wonderComplete;
    for (const h of world.getCompleted('harbor')) {
      const threshold = saving ? 550 : wonder?.wonderComplete ? 400 : 250; // harika bitince oyunun varsayılan sınırı
      if (h.exportThreshold !== threshold) game.events.emit('ui:setExportThreshold', { buildingId: h.id, threshold });
      if (!saving && !h.crate && (res.wool > 300 || res.iron > 300 || res.bread > 300)) game.events.emit('ui:prepareCrate', { buildingId: h.id });
      // (14. aşama) Harika bitince stok 250'nin çok üstündeyse Büyük İhracat Seferi
      const over = ['wood', 'stone', 'food', 'wool', 'iron', 'bread'].reduce((a, r) => a + Math.max(0, res[r] - 400), 0);
      if (!saving && wonder?.wonderComplete && over > 900 && window.__harbor.grandVoyageStatus(s).ok) game.events.emit('ui:grandVoyage', { buildingId: h.id });
    }
    // Ulu Saat Kulesi: açılınca kurulur, aşamalar kaynak (ve Kadim Dişli) yettikçe başlatılır
    if (towerOpen && !wonder && Object.entries(window.__wonder.cost).every(([r, v]) => res[r] >= v)) {
      const spot = sim.findSpot('wonder', 34);
      if (spot) scene.construction.placeSite('wonder', spot.x, spot.y);
    } else if (wonder && wonder.functional && !wonder.project && !wonder.wonderComplete) {
      const stage = window.__wonder.wonder.stages[wonder.wonderStage];
      if (Object.entries(stage.cost).every(([r, v]) => res[r] >= v)) scene.construction.startProject(wonder);
    }

    // (24. aşama) Ürün Silosu: kule bittikten sonra, kaynak bolken bahçelerin (ya da değirmenin) yanına
    if (!window.__noAgri && wonder?.wonderComplete && !s.buildings.some((b) => b.type === 'silo') && res.wood >= 90 && res.stone >= 70) {
      const spot = safetySpot('silo') ?? sim.findSpot('silo', 30);
      if (spot) scene.construction.placeSite('silo', spot.x, spot.y);
    }
    // (24.2) Katma değerli üretim: kule bitmiş, nüfus 22+ ve kiler rahatken dördüncü bahçe, Dokuma Tezgâhı ve Şerbethane (birer tane)
    if (!window.__noAgri && wonder?.wonderComplete && s.buildings.some((b) => b.type === 'silo' && b.functional) && s.characters.length >= 22 && window.__foodSupply(s) >= s.characters.length * 10) {
      const has = (t) => s.buildings.some((b) => b.type === t);
      const gardens = s.buildings.filter((b) => b.type === 'garden').length;
      const busyRefinery = s.buildings.some((b) => ['loom', 'brewery', 'garden'].includes(b.type) && b.underConstruction);
      const place = (type) => {
        const spot = safetySpot(type) ?? sim.findSpot(type, 30);
        if (spot) scene.construction.placeSite(type, spot.x, spot.y);
      };
      if (!busyRefinery) {
        if (!has('loom') && res.wood >= 90 && res.stone >= 60 && res.iron >= 30) place('loom');
        else if (!has('brewery') && res.wood >= 80 && res.stone >= 80) place('brewery');
        else if (has('brewery') && gardens < 4 && res.wood >= 60 && res.stone >= 30) place('garden');
        // (24.3) Ticaret İskelesi: tezgâh kurulduktan sonra, yolun ya da nehrin kenarına
        else if (has('loom') && !has('tradingPost') && res.wood >= 110 && res.stone >= 80 && res.iron >= 40) {
          const spot = sim.findSpot('tradingPost', 30);
          if (spot) scene.construction.placeSite('tradingPost', spot.x, spot.y);
        }
      }
    }
    // (25.2) Usta-Çırak: Ulu Saat Kulesi tamamlandıktan sonra (kule günleri değişmesin) her zanaat yapısının Çırak Kapısı'nı açar;
    // boştaki gençler ertesi sabah 07:00'de oraya çırak yazılır (gıda ve çekirdek iş gücü güvende değilse çıraklar işe koşar)
    if (!window.__noApprentice && wonder?.wonderComplete && s.apprenticeship) {
      for (const b of s.buildings) {
        if (b.functional && window.__appr.professionFor(b.type) && !s.apprenticeship.open.includes(b.id)) game.events.emit('ui:toggleApprenticeDoor', { buildingId: b.id });
      }
    }
    // (20. aşama) Altın Çağ: prestij peyzajı (bir Mermer Çeşme, iki Altın Çağ Feneri) ve tüccarın nadir malları
    if (wonder?.wonderComplete && s.goldenAge?.since) {
      const count = (t) => s.buildings.filter((b) => b.type === t).length;
      if (count('marbleFountain') < 1 && res.gold >= 600 && res.stone >= 120) {
        const spot = sim.findSpot('marbleFountain', 14);
        if (spot) scene.construction.placeSite('marbleFountain', spot.x, spot.y);
      } else if (count('goldenLantern') < 2 && res.gold >= 300 && res.iron >= 10) {
        const spot = sim.findSpot('goldenLantern', 12);
        if (spot) scene.construction.placeSite('goldenLantern', spot.x, spot.y);
      }
      const m = s.events.merchant;
      if (scene.townEvents.canTrade()) {
        for (const id of ['ancientBooks', 'rareSeeds']) if ((m.stock[id] ?? 0) > 0 && res.gold >= 500) game.events.emit('ui:trade', { offerId: id });
      }
    }

    // (13. aşama) Harika bitince hazine: önce yadigârlar (biraz yedek kalsın), ipek ve mermer, baharat, altın fermanları
    // (22. aşama) Kraliyet Tahsildarı yoldayken vergi parası ayrılır
    const levyReserve = s.crown.notice ? s.crown.notice.amount + 300 : 0;
    if (wonder?.wonderComplete && res.gold >= levyReserve) {
      const L = window.__luxury;
      const source = world.getCompleted('harbor').length ? 'harbor' : 'merchant';
      const price = L.relicPrice(s);
      const relic = window.__relicKeys.find((id) => !s.luxury.relics[id]);
      if (relic && price !== null && res.gold >= price + 300) game.events.emit('ui:buyRelic', { id: relic, source });
      if (!s.luxury.silk && res.gold >= 900) game.events.emit('ui:buyLuxury', { id: 'silkMarble', source });
      if ((s.buffs.spices ?? 0) <= s.totalMinutes && res.gold >= 1200 && L.luxuryStatus(s, 'spiceCrate', source).ok) game.events.emit('ui:buyLuxury', { id: 'spiceCrate', source });
      if (res.gold >= 2500 && L.goldDecreeStatus(s, 'goldBonus').ok) game.events.emit('ui:goldDecree', { id: 'goldBonus' });
      const busy = s.buildings.filter((b) => b.underConstruction || b.project).length;
      if (busy >= 2 && res.gold >= 3000 && L.goldDecreeStatus(s, 'royalArchitects').ok) game.events.emit('ui:goldDecree', { id: 'royalArchitects' });
    }

    // (16. aşama) Keşif: Belediye Konağı ya da Liman varsa erzak bolken sefer düzenle; yazıtları çöz; ganimetleri dik
    {
      const X = window.__exploration;
      const ex = s.exploration;
      const source = ['townHall', 'harbor'].find((t) => X.expeditionLaunchStatus(s, t).ok);
      if (source && res.food + res.bread > 140 && s.time.hour >= 8 && s.time.hour <= 11) game.events.emit('ui:launchExpedition', { source });
      if (!ex.decoding) {
        const id = Object.keys(ex.inscriptions).find((k) => X.decodeStatus(s, k).ok);
        if (id) game.events.emit('ui:decodeInscription', { id });
      }
      if (ex.items.vineSeed > 0) {
        for (const garden of world.getCompleted('garden')) {
          if (ex.items.vineSeed <= 0) break;
          const spots = [[-1, 0], [2, 0], [0, -1], [0, 2], [1, -1], [1, 2], [-1, 1], [2, 1]];
          for (const [dx, dy] of spots) {
            const x = garden.tileX + dx;
            const y = garden.tileY + dy;
            if (scene.construction.checkPlacement('grapeVine', x, y).ok) {
              scene.construction.placeSite('grapeVine', x, y);
              break;
            }
          }
        }
      }
      if (ex.items.ancientTorch > 0) {
        const spot = sim.findSpot('ancientTorch', 12);
        if (spot) scene.construction.placeSite('ancientTorch', spot.x, spot.y);
      }
    }

    // (15. aşama) Usta işi eserler: vitrin dolana kadar sergile (kalıcı refah), sonra limandan / tüccara sat
    {
      const MW = window.__masterworks;
      for (const item of MW.storedMasterworks(s)) {
        if (MW.masterworkHappiness(s) < window.__mwMax) game.events.emit('ui:exhibitMasterwork', { id: item.id });
        else {
          const buyer = MW.bestMasterworkBuyer(s);
          if (buyer) game.events.emit('ui:sellMasterwork', { id: item.id, source: buyer });
        }
      }
    }

    // (18. aşama) İmar: kapıları yola bağla, meydanı parke taşa çevir, sokak eşyaları ve ağaçlar
    window.__imar(scene, s, res);

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
        const spot = safetySpot(type) ?? (SAFETY.includes(type) ? null : sim.findSpot(type, type === 'harbor' ? 45 : 30));
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
    const spot = nextSpot ?? safetySpot(next) ?? (SAFETY.includes(next) ? null : sim.findSpot(next));
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
  window.__luxury = await import('/src/systems/Luxury.js');
  window.__relicKeys = (await import('/src/data/luxury.js')).RELIC_KEYS;
  window.__harbor = await import('/src/systems/HarborSystem.js');
  window.__masterworks = await import('/src/systems/Masterworks.js');
  window.__exploration = await import('/src/systems/Exploration.js');
  window.__adventures = (await import('/src/data/exploration.js')).ADVENTURES;
  window.__mwMax = (await import('/src/data/masterpieces.js')).MASTERWORK.maxExhibitHappiness;
  window.__buildings = BUILDINGS;
  window.__petitions = await import('/src/systems/Petitions.js');
  window.__trust = await import('/src/systems/TrustSystem.js');
  window.__crown = await import('/src/systems/Crown.js');
  window.__crisis = await import('/src/systems/Crisis.js');
  window.__granary = await import('/src/systems/Granary.js');
  window.__tradePost = await import('/src/systems/TradePost.js');
  window.__appr = await import('/src/systems/Apprenticeship.js'); // (25.2)
  window.__foodSupply = (await import('/src/systems/TownStatus.js')).foodSupply;
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
    const p12 = `araştırma=${Object.keys(s.research.done).length}${s.research.active ? `+${s.research.active.id}` : ''} altın=${r.gold} sefer=${s.trade.shipments} harika=${wonder ? wonder.wonderStage + (wonder.project ? '+' : '') : '-'} mezun=${s.characters.filter((c) => c.educated).length} yadigâr=${Object.keys(s.luxury.relics).length} harcanan=${s.luxury.goldSpent}`;
    return (
      `G${s.time.day} nüfus=${s.characters.length}(${s.characters.filter((c) => c.isChild).length}ç) seviye=${s.town.tier} refah=${Math.round(s.town.welfare)} ` +
      `O${r.wood} T${r.stone} Y${r.food} yün${r.wool} demir${r.iron} ekmek${r.bread} depo=${s.storageCapacity} | ${p12} | hasta=${sick} hastalık=${s.stats.illnesses} şifa=${s.stats.cured} ` +
      `evcil=${pets} sevme=${s.stats.petted} karar=${s.stats.dilemmas} ferman=${s.civic.decrees} | ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' ')}`
    );
  });
}

for (let d = 0; d < days; d++) {
  for (let h = 0; h < 4; h++) await runHours(page, 6, '__autopilot', '__sample');
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
    // (20. aşama) Ulu Saat Kulesi ve Altın Çağ
    golden: {
      since: s.goldenAge?.since?.day ?? null,
      chimes: s.goldenAge?.chimes ?? 0,
      books: s.goldenAge?.books ?? 0,
      celebrations: s.stats.ageCelebrations ?? 0,
      stages: Object.fromEntries(Object.entries(s.chronicle?.towerStages ?? {}).map(([k, v]) => [k, v.day ?? '?'])),
      master: s.chronicle?.towerMaster ?? null,
      builders: Object.keys(s.chronicle?.towerWork ?? {}).length,
      founders: (s.chronicle?.founders ?? []).map((f) => f.name),
      couple: s.chronicle?.firstCouple ? `${s.chronicle.firstCouple.a} & ${s.chronicle.firstCouple.b}` : null,
      masterwork: s.chronicle?.firstMasterwork?.maker ?? null,
      gears: window.__stats.gears ?? 0,
      prestige: ['marbleFountain', 'goldenLantern'].map((t) => `${t}:${s.buildings.filter((b) => b.type === t && b.functional).length}`).join(' '),
    },
    gold: s.resources.gold,
    goldSpent: s.luxury.goldSpent,
    relics: Object.keys(s.luxury.relics),
    landscape: { ...window.__landscapeStats, score: s.landscape.score, percent: s.landscape.percent, strolls: s.landscape.strolls, painted: s.landscape.roadsPainted, strollMemories: s.characters.reduce((a, c) => a + c.memories.filter((m) => m.kind === 'stroll').length, 0), grown: s.buildings.filter((b) => b.definition.ornamentalTree && b.growthStage === 2).length },
    decor: ['cherryTree', 'gazebo', 'marbleArch', 'flowerFence'].map((t) => `${t}:${s.buildings.filter((b) => b.type === t && b.functional).length}`).join(' '),
    pinned: s.characters.filter((c) => c.workplaceId !== null).length,
    history: s.history.map((h) => `${h.day}:${h.gold}`).slice(-12).join(' '),
    held: s.seasonFestival.held,
    memories: s.characters.map((c) => c.memories.length),
    recollections: s.stats.recollections ?? 0,
    sampleMemories: (s.characters.find((c) => c.memories.length >= 6) ?? s.characters[0]).memories.slice(-8).map((m) => `G${m.day} ${m.text}`),
    sampleName: (s.characters.find((c) => c.memories.length >= 6) ?? s.characters[0]).name,
    grandVoyages: s.trade.grandVoyages ?? 0,
    quarrels: s.stats.quarrels ?? 0,
    reconciliations: s.stats.reconciliations ?? 0,
    ex: {
      expeditions: s.exploration.expeditions,
      adventures: s.stats.adventures ?? 0,
      mishaps: window.__stats.mishaps ?? 0,
      tales: s.stats.talesTold ?? 0,
      items: s.exploration.items,
      cityMap: s.exploration.cityMap,
      inscriptions: Object.fromEntries(Object.entries(s.exploration.inscriptions).map(([k, v]) => [k, v.status])),
      vines: s.buildings.filter((b) => b.type === 'grapeVine' && b.functional).length,
      torches: s.buildings.filter((b) => b.type === 'ancientTorch' && b.functional).length,
    },
    mw: { made: s.masterworks.made, exhibited: s.masterworks.exhibited, sold: s.masterworks.sold, goldEarned: s.masterworks.goldEarned },
    outfits: s.characters.reduce((acc, c) => {
      const k = c.outfit ? c.outfit.split(':')[1] === '3' ? 'usta' : 'kalfa' : c.isChild ? 'çocuk' : 'çırak';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
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
const g = report.stats.gold;
console.log(`altın harcaması (harika sonrası): ${report.goldSpent} altın · yadigârlar ${g.relics} (${report.relics.length}/5), lüks mallar ${g.goods}, fermanlar ${g.decrees}; ${g.items.length} alım`);
console.log(`peyzaj: ${report.decor} · arşiv (gün:altın) ${report.history}`);
{
  const L = report.landscape;
  console.log(
    `(18. aşama) imar: patika ${L.pathTiles} karo, parke ${L.cobbleTiles}, taş plaka ${L.plazaTiles} · yola bağlanan yapı ${L.linked} · süsler ${JSON.stringify(L.decor)} · ulu ağaç ${L.grown} · ` +
      `estetik ${L.score} puan (refah +%${L.percent}) · güzel sokak anısı ${L.strollMemories} · yürüyüş rotalarının %${L.walked ? Math.round((L.onRoad / L.walked) * 100) : 0}'i yollardan`
  );
}
console.log(`mevsim festivalleri: ${JSON.stringify(report.held)} · ${report.stats.festivals.join(', ')}`);
const mem = report.memories;
console.log(`anılar: sakin başına ${Math.min(...mem)}-${Math.max(...mem)} (ortalama ${(mem.reduce((a, b) => a + b, 0) / mem.length).toFixed(1)}), ${report.recollections} kez hatırlandı · Büyük İhracat Seferi: ${report.grandVoyages}`);
console.log(`hava değişimleri: ${JSON.stringify(report.stats.weather)}`);
console.log(`(16. aşama) sefer ${report.ex.expeditions} · macera ${report.ex.adventures} (${JSON.stringify(report.stats.adventureChoices ?? {})}) · kaza ${report.ex.mishaps} · anlatılan hikâye ${report.ex.tales} · ganimet ${JSON.stringify(report.ex.items)} harita ${report.ex.cityMap} · yazıt ${JSON.stringify(report.ex.inscriptions)} · asma ${report.ex.vines} meşale ${report.ex.torches}`);
console.log(`(15. aşama) atışma ${report.quarrels} · barışma ${report.reconciliations} (oran %${report.quarrels ? Math.round((report.reconciliations / report.quarrels) * 100) : 0}) · usta işi eser ${report.mw.made} (sergilenen ${report.mw.exhibited}, satılan ${report.mw.sold}, +${report.mw.goldEarned} altın) · kıyafet ${JSON.stringify(report.outfits)}`);
console.log(`${report.sampleName} anıları:\n  ${report.sampleMemories.join('\n  ')}`);
console.log(`harika: aşama ${report.wonder}/3, ${sum(spent.wonder)} birim (${fmt(spent.wonder)}); hazinede ${report.gold} altın`);
{
  const g = report.golden;
  console.log(
    `(20. aşama) Ulu Saat Kulesi aşamaları (gün) ${JSON.stringify(g.stages)} · dökülen Kadim Dişli ${g.gears} · emek veren ${g.builders} sakin · baş usta ${g.master ? `${g.master.name} (${g.master.work})` : '-'} · ` +
      `Altın Çağ ${g.since !== null ? `G${g.since}'den beri, çan ${g.chimes} kez, Çağ Kutlaması ${g.celebrations}` : 'başlamadı'} · antik kitap ${g.books} · prestij ${g.prestige} · ` +
      `Tarihçe: kurucular ${g.founders.join(', ')} · ilk çift ${g.couple ?? '-'} · ilk usta eseri ${g.masterwork ?? '-'}`
  );
}
const late = report.stats.daily.slice(-12);
if (late.length) {
  const keys = ['wood', 'stone', 'food', 'wool', 'iron', 'bread'];
  const avg = Object.fromEntries(keys.map((k) => [k, Math.round(late.reduce((a, d) => a + d[k], 0) / late.length)]));
  const full = late.filter((d) => keys.some((k) => d[k] >= d.cap)).length;
  console.log(`son ${late.length} gün ortalama stok: ${fmt(avg)} · depo ${late[late.length - 1].cap} · deposu dolan gün: ${full}`);
}
if (options['crisis-state']) {
  const made = await page.evaluate(() => {
    const scene = window.game.scenes.current;
    const s = window.game.state;
    const c = scene.crisis;
    const pick = (types, skip = []) => s.buildings.find((b) => types.includes(b.type) && b.functional && !b.damaged && !b.isBurning && !skip.includes(b));
    const burning = pick(['workshop', 'mill', 'lumberHut']);
    const wrecked = pick(['quarry', 'garden', 'lumberHut', 'market'], [burning]);
    if (burning) c.startFire(burning);
    if (burning) {
      burning.fireProgress = 38;
      burning.fireWater = 1;
    }
    if (wrecked) c.damage(wrecked, 'raid');
    const hurt = s.characters.find((x) => !x.isChild && !x.role && !x.isInjured);
    if (hurt) c.injure(hurt, 'raid');
    if (hurt) hurt.injuryTimer = 1500;
    s.crisis.raid = null;
    c.warnRaid();
    return { burning: burning?.name, damaged: wrecked?.name, injured: hurt?.name, raid: Boolean(s.crisis.raid) };
  });
  console.log('kriz durumu kuruldu:', JSON.stringify(made));
}
if (options.save) {
  const snapshot = await page.evaluate(async () => {
    const { CONFIG } = await import('/src/config.js');
    return JSON.stringify({ ...window.game.scenes.current.saves.snapshot(), version: CONFIG.SAVE_VERSION, savedAt: 0 });
  });
  fs.writeFileSync(options.save, snapshot);
  console.log('kayıt yazıldı:', options.save);
}
const mon = await monitorReport(page);
const so = mon.social;
console.log(
  `(19. aşama) evli çift ${so.couples} (aynı evde ${so.couplesTogether}) · randevu ${so.dates} · düğün kutlaması ${so.parties} · akşam yemeği ${so.dinners} · ` +
    `boşalan ev ${so.homesFreed} · dedikodu ${so.gossip} (dolaşan haber ${so.news}) · müzik ${so.serenades} · hayvan sevme ${so.cuddles} · kitap ${so.books} · ` +
    `huylar ${JSON.stringify(so.quirks)} · nüfus en az ${so.minPop} · en çok evsiz ${so.homelessMax} · sosyal sıkışma ${so.stuck.length}${so.stuck.length ? `: ${so.stuck.slice(0, 3).join(' | ')}` : ''}`
);
{
  const z = mon.citizens;
  const P = z.petitions;
  console.log(
    `(21. aşama) Yönetim Güveni %${z.trust} (en az %${z.trustMin}, en çok %${z.trustMax}) · isyan ${z.revolts} (${z.revoltHours} saat) · yağma ${z.raids} (${z.lootedGoods} mal, ${z.lootedGold} altın) · acil dağıtım ${z.reliefs} · ` +
      `dilekçe ${P.made} (karşılanan ${P.fulfilled}, reddedilen ${P.rejected}, süresi dolan ${P.expired}, açık ${P.open}; kabul ${P.accepted}) · yevmiye ${z.wages} altın · alışveriş ${z.purchases} · çantadan yemek ${z.bagMeals} · keselerde ${z.coins} altın, çantalarda ${z.items} eşya`
  );
}
{
  const k = mon.crown;
  console.log(
    `(22. aşama) iç vergi ${k.rate} · ${k.collections} tahsilat (+${k.taxGold} altın, ${k.taxGoods} birim öşür) · Krallık Vergisi ${k.paid}/${k.levies} ödendi (ceza ${k.failed}) · ` +
      `itibar %${k.reputation} · ferman teslim ${k.delivered}, başarısız ${k.decreesFailed} · Kraliyet Beratı ${k.statueRight ? 'var' : 'yok'}, heykel ${k.statues} · terk eden ${k.emigrants} (terk ediş ${k.exodusHours} saat)`
  );
}
{
  const c = mon.crisis;
  console.log(
    `(23. aşama) tehlike sıklığı ${c.difficulty} · Su Kuyusu ${c.wells}, Gözcü Kulesi ${c.towers} (nöbetteki bekçi ${c.guards}, biten nöbet vardiyası ${report.stats.patrolShifts}) · yangın ${c.fires} (söndürülen ${c.extinguished}, hasar bırakan ${c.burned}; ${c.fireHours} yangın saati) · ` +
      `haydut baskını ${c.raids} (püskürtülen ${c.repelled}, haraç ${c.tributes}, hazırlıksız ${c.caught}; seçimler ${JSON.stringify(report.stats.raidChoices ?? {})}) · yaralanma ${c.injuries} (şifacıda iyileşen ${c.treated}, şu an ${c.injuredNow}; ${c.injuredHours} yaralı saati) · ` +
      `tamir ${c.repairs} (şu an hasarlı ${c.damagedNow}, yanan ${c.burningNow}; ${c.damagedHours} hasarlı yapı saati, 3 günü aşan ${c.longDamaged})`
  );
}
{
  const f = mon.food;
  const a = mon.agri;
  const A = report.stats.agri ?? {};
  const r = mon.refinery;
  console.log(
    `(24. aşama) gıda güvencesi: kişi başı en düşük besin ${f.minPerCap} (ortalama ${f.avgPerCap}), kritik gıda saati ${f.criticalHours}, sonda ${f.end} besin` +
      (a
        ? ` · Ürün Silosu ${a.silos} (+${a.granaryCapacity}) · bahçeler ${a.gardens || '-'} · bahçe-saat ${JSON.stringify(a.cropHours)} · keten ${a.flax}, şerbetçiotu ${a.hops} · ` +
          `bozulan ${JSON.stringify(a.spoiled)} · ekim değişikliği ${a.switches} (Buğday'a ${A.toGrain ?? 0}, Keten'e ${A.toFlax ?? 0}, Şerbetçiotu'na ${A.toHops ?? 0}; gıda kritik ${A.critical ?? 0}, depo dolu ${A.fullBack ?? 0})`
        : '') +
      (mon.trade ? ` · (24.3) Ticaret İskelesi ${mon.trade.posts} · ziyaret ${mon.trade.visits} · sözleşme ${mon.trade.completed} (+${mon.trade.goldEarned} altın; ${JSON.stringify(mon.trade.exported)}) · ithalat ${mon.trade.imports} paket (-${mon.trade.goldSpent} altın; ${JSON.stringify(mon.trade.imported)}) · rezerv için bekletilen ${(report.stats.trade ?? {}).held ?? 0} · pazar ${JSON.stringify(mon.trade.market)}` : '') +
      (r ? ` · (24.2) Dokuma Tezgâhı ${r.looms}, Şerbethane ${r.breweries} · dokunan kumaş ${r.clothWoven}, yapılan fıçı ${r.sherbetMade} (stok ${r.cloth} / ${r.sherbet}) · handa içilen şerbet ${r.served}, handaki fıçı ${r.innCasks} · testi ${r.jugs} (içilen ${r.jugsDrunk}) · Dayanıklı Giysi ${r.garments} (giyen ${r.dressed}) · refah katkısı +${r.welfare} · açken çalışan lüks işçi ${r.hungryLuxury}` : '')
  );
}
if (mon.temperament) {
  const T = mon.temperament;
  const gen = ['craftsman', 'entrepreneur', 'philosopher', 'festive'].map((k) => `${k} ${T.counts[k] ?? 0}`).join(', ');
  console.log(
    `(25.3) mizaç: yeni nesil huylar ${gen} (en çok ${T.maxGeneration}) · gelişen ${T.state.developed} (aile ${T.state.family}, usta ${T.state.mentor}, meslek ${T.state.craft}, özgün ${T.state.self}) · ` +
      `Şenlik aurası ${Math.round(T.state.auraMinutes)} dk · yeni dilekçeler ${JSON.stringify(T.petitions)}`
  );
}
if (mon.apprentice) {
  const P = mon.apprentice;
  console.log(
    `(25.2) çıraklık: açık kapı ${P.open} · çırak ${P.active} (en çok ${P.maxActive}; ${P.list.join(', ') || '-'}) · yazılan ${P.state.enrolled}, mezun ${P.state.graduated} · ` +
      `Gururlu Usta ${P.state.masters} · çırak mesaisi ${Math.round(P.state.minutes / 60)} sa · çırak işi ${P.state.crafted} (satılan ${P.state.sold}, +${P.state.coins} altın) · ` +
      `ustasız çırak ${P.orphanSamples} örnek · yetişkin çırak ${P.adultApprentices}`
  );
}
if (mon.life) {
  const L = mon.life;
  const ages = L.ages.length ? `${Math.min(...L.ages)}-${Math.max(...L.ages)}` : '-';
  console.log(
    `(25.1) yaşam evreleri: çocuk ${L.counts.child}, genç ${L.counts.youth}, yetişkin ${L.counts.adult}, Kıdemli Bilge ${L.counts.elder} (emekli ${L.retired}) · ` +
      `en çok bilge ${L.maxElders}, en çok genç ${L.maxYouth} · yaş aralığı ${ages} · unvanı alan bilge ${L.state.elders ?? 0}, yetişkinliğe geçen genç ${L.state.adults ?? 0} · ` +
      `nasihat ${Math.round(L.state.adviceMinutes ?? 0)} dk · işteki emekli ${L.retiredWorking} · emeklilik gecikmesi ${L.retireLag}`
  );
}
console.log(`bekçi: ${mon.samples} örnek · takılma ${mon.stuck.length} · kopuk referans ${mon.brokenCount} · taşan ev ${mon.overfullCount} · bekleyen iş ${mon.staleJobs.length} · üretmeyen iş yeri ${mon.stalledWorkplaces.length} · sosyal sıkışma ${mon.social.stuck.length}`);
for (const st of mon.stuck.slice(0, 10)) console.log(`  takıldı: G${st.day} ${st.hour}:00 ${st.name} @${st.tile} ${st.reason} (${st.task ?? '-'}/${st.phase ?? '-'}: ${st.label})`);
for (const b of mon.broken.slice(0, 10)) console.log(`  referans: ${b}`);
for (const j of mon.staleJobs.slice(0, 5)) console.log(`  iş: ${j}`);
for (const w of mon.stalledWorkplaces.slice(0, 5)) console.log(`  iş yeri: ${w}`);
const healthy = errors.length === 0 && mon.stuck.length === 0 && mon.brokenCount === 0 && mon.overfullCount === 0 && mon.outfitErrors.length === 0 && mon.social.stuck.length === 0;
for (const o of mon.outfitErrors.slice(0, 5)) console.log(`  kıyafet: ${o}`);
if (options.json) {
  fs.writeFileSync(options.json, JSON.stringify({ seed, days, speed, errors, monitor: mon, healthy }, null, 1));
}
console.log('Sayfa hataları:', errors.length ? `\n${errors.slice(0, 20).join('\n')}` : 'yok');
await browser.close();
process.exit(healthy ? 0 : 1);
