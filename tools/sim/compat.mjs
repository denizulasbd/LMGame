// Geriye uyumluluk: eski sürümlerin kayıtları (fixtures/) bugünkü oyunda açılır mı, bir gün sorunsuz yaşar mı?
//   save-v2..v6  : 4.-8. aşamanın kayıt biçimleri (sentez: legacy-fixtures.mjs; o aşamaların kodu depoda yok).
//                  v2-v5 eski 48x48 biyomsuz harita, v3-v5 Sokak Lambası ('lamp'), v6 yarım kalmış bir yükseltme
//   save-v7.json : 9. aşamanın oyunu (kayıt sürümü 7): 14 sakin, atölye, anıt, iki Taş Ev
//   save-v8.json : 10. aşamanın oyunu (kayıt sürümü 8): 33. gün, 30 sakin, Gelişmiş Şehir, tüm üretim zincirleri
//   save-v9.json : 11. aşamanın oyunu (kayıt sürümü 9): 33. gün, 30 sakin, şifacı, hayvanlar, fermanlar ve olaylar
//   save-v10.json: 12. aşamanın oyunu (kayıt sürümü 10): 31. gün, 30 sakin, dört araştırma, liman, hazinede altın ve
//                  tamamlanmış Büyük Vadi Saat Kulesi
//   save-v11.json: 13. aşamanın oyunu (kayıt sürümü 11): 37. gün, 30 sakin, üç yadigâr, peyzaj, arşiv
//   save-v12.json: 14. aşamanın oyunu (kayıt sürümü 12): otopilotla 34 gün; festivaller, anılar
//   save-v13.json: 15. aşamanın oyunu (kayıt sürümü 13): otopilotla 34 gün; usta işi eserler, barışmalar
//   save-v14.json: 16. aşamanın oyunu (kayıt sürümü 14): otopilotla 34 gün; seferler, ganimetler, çözülen yazıtlar
//   save-v15.json: 18. aşamanın oyunu (kayıt sürümü 15): otopilotla 34 gün; döşenen yollar, tabelalar, süs ağaçları,
//                  çitler, kasaba estetiği. Eski kayıtlarda (sürüm 2-14) peyzaj durumu boş başlar, estetik yüklenince hesaplanır
//   save-v16.json: 19. aşamanın oyunu (kayıt sürümü 16): otopilotla 34 gün; evli çiftler ve ortak evleri, karakter
//                  huyları, dolaşan dedikodular, son duyulan haberler. Eski kayıtlarda (sürüm 2-15) huylar ilk açılışta
//                  dağıtılır (dördü de görülür), dedikodu boş başlar; evli çiftler kendi evlerinde kalır. Bu kayıt bir keşif
//                  seferinin ortasındadır (macera pencereleri açılır ve sefer döner)
//   save-v17.json: 20. aşamanın oyunu (kayıt sürümü 17): otopilotla 34 gün; aşama aşama yükselen Ulu Saat Kulesi,
//                  Altın Çağ, Tarihçe Kütüğü, Mermer Çeşme ve Altın Çağ Fenerleri, antik kitaplar. Eski kayıtlarda (sürüm 2-16)
//                  Tarihçe sakinlerden çıkarılır; tamamlanmış kulesi olan kasaba Altın Çağ'a sessizce (kutlamasız) girer
//   save-v18.json: 21. aşamanın oyunu (kayıt sürümü 18): otopilotla 34 gün; sakinlerin keseleri ve çantaları,
//                  karşılanan / açık dilekçeler, Yönetim Güveni. Eski kayıtlarda (sürüm 2-17) her yetişkine 12, her çocuğa 3
//                  altın başlangıç harçlığı verilir, çantalar boş başlar, Yönetim Güveni %75'tir, dilekçe ve isyan yoktur
//   save-v19.json: 22. aşamanın oyunu (kayıt sürümü 19): otopilotla 34 gün; iç vergi kademesi ve tahsilatlar,
//                  ödenen Krallık Vergileri, teslim edilen Kraliyet Fermanları, Kraliyet Beratı ve Aslanlı Heykel. Eski kayıtlarda
//                  (sürüm 2-18) Standart Vergi, itibar 50, ferman ve terk ediş yoktur; vergi takvimi yüklenince kurulur
//   save-v20.json: 23. aşamanın oyunu (kayıt sürümü 20): otopilotla 34 gün; Su Kuyusu ve Gözcü Kulesi, yangın / baskın
//                  sayaçları, tehlike sıklığı. Eski kayıtlarda (sürüm 2-19) hiçbir yapı yanmıyor / hasarlı değil, kimse yaralı
//                  değil, tehlike sıklığı Dengeli'dir; yüklemeden sonraki ilk 24 saatte doğal kriz çıkmaz
//   save-v21.json: 24. aşamanın (24.1) oyunu (kayıt sürümü 21): otopilotla 34 gün (--crisis-state); Ulu Saat Kulesi'nden sonra
//                  kurulan Ürün Silosu, Keten ekili bir bahçe, keten stoğu, bozulan mahsul sayacı. Eski kayıtlarda (sürüm 2-20) bütün
//                  bahçeler Buğday / Sebze ekili, Keten / Şerbetçiotu 0, silo sayaçları boştur
//   save-v22.json: 24.2'nin oyunu (kayıt sürümü 22): otopilotla 40 gün (--crisis-state); Dokuma Tezgâhı ve Şerbethane,
//                  Kumaş ve Fıçı Şerbeti stokları, handaki fıçılar, sakinlerin çantasında Dayanıklı Giysi ve Şerbet Testisi. Eski kayıtlarda
//                  (sürüm 2-21) Kumaş / Fıçı Şerbeti 0, hanlarda fıçı yok, yeni yapı ve çanta eşyası yoktur
//   save-v23.json: 24.3'ün oyunu (kayıt sürümü 23): otopilotla 44 gün (--crisis-state); Ticaret İskelesi / Kervan Konağı,
//                  gemi takvimi, tamamlanan ihracat sözleşmeleri, ithalat sayaçları, pazar çarpanları. Eski kayıtlarda (sürüm 2-22) dış
//                  ticaret boştur; iskele kurulunca takvim kurulur
//   save-v24.json: 25.1'in oyunu (kayıt sürümü 24): otopilotla 64 gün (--crisis-state); her sakinin yaşam evresi
//                  (lifeStage) ve gün cinsinden yaşı (ageInDays), Genç evresindeki büyümüş çocuklar ve genç göçmenler, 63. günde
//                  kendiliğinden unvanını alan bir Kıdemli Bilge (Deniz, 70). Eski kayıtlarda (sürüm 2-23) evresi olmayan yetişkinler
//                  'adult' (70+ 'elder'), çocuklar 'child' başlar; yaş değişmez, gün sayacı yaştan kurulur, bir gün sonra ilerler
//   save-v25.json: 25.2'nin oyunu (kayıt sürümü 25): otopilotla 64 gün (--crisis-state); kuleden sonra açılan Çırak
//                  Kapıları, ustalarının yanında ilerleyen çıraklar, çırak işleri ve satışları, Gururlu Usta. Eski kayıtlarda
//                  (sürüm 2-24) çırak yoktur, bütün kapılar kapalıdır, sayaçlar boştur
//   save-v26.json: 25.3'ün oyunu (kayıt sürümü 26): otopilotla 64 gün (--crisis-state); Altın Çağ'da büyüyüp mizacını
//                  ailesinden, ustasından ya da kendinden alan gençler, yeni nesil huylar ve kaynakları, yeni dilekçe sayaçları. Eski
//                  kayıtlarda (sürüm 2-25) huylar aynen korunur (yoksa dört kuruluş huyundan dağıtılır), huy kaynağı ve sayaçlar boştur
//   save-v27.json: 25.4'ün oyunu (kayıt sürümü 27): otopilotla 72 gün (--crisis-state); Aile Kütüğü (kuşaklar, doğum
//                  ebeveynleri, ocaklar, çocuk listeleri), 2. kuşak düğünleri ve Tarihçe'deki ilki, ocak reisleri. Eski kayıtlarda (sürüm 2-26)
//                  ebeveyni kayıtlı olmayan herkes 1. kuşaktır (kendi ocağıyla), kasabada doğanlar ebeveyninin bir fazlası
//   save-v28.json: 25.5'in oyunu (kayıt sürümü 28, bugünkü): otopilotla 72 gün (--crisis-state); Kıdemli Bilge Deniz'in Eski Seyyah
//                  Pusulası 64. gün "manevi evladı" Ada'ya devredildi (çantasında, hikâyesi ve zinciriyle), Tarihçe'de ilk kuşak mirası.
//                  Eski kayıtlarda (sürüm 2-27) yadigâr, çırak geçmişi ve yadigâr sayacı yoktur
//   save-v29.json: 26.1'in oyunu (kayıt sürümü 29, bugünkü): otopilotla 71 gün (--crisis-state); Altın Çağ G28'de başladı, ilk panayır (Kış Dönümü Ateşi)
//                  32. gün 22:00'de tamamlandı ve Tarihçe'de (firstFair, 18 sakin); kayıt anında panayır yok (currentFestival null). Eski kayıtlarda
//                  (sürüm 2-28) currentFestival yoktur: null ile açılır, Tarihçe'de ilk panayır ve panayır sayacı yoktur
//   save-v30.json: 26.2'nin oyunu (kayıt sürümü 30, bugünkü): otopilotla 73 gün (--crisis-state); 72. gün (Yaz Güneşi Şenliği panayırı) hazırlık evresinde kurulmuş Zengin Şölen Sofrası
//                  (currentFeast: 5 fıçı şerbet, 9 ekmek, 22 yiyecek, 1 kumaş bağışı, 32 ikram), daha önce 10 sofra ve 171 ikram. Eski kayıtlarda
//                  (sürüm 2-29) currentFeast yoktur: null ile açılır
//   save-v37.json: 29.2'nin oyunu (kayıt sürümü 37, bugünkü): otopilotla 72 gün (--crisis-state; tohum 42): sakinlerin üzerindeki ruh halleri (moodlet'ler)
//                  ve ruh hali sayaçları. Eski kayıtlarda (sürüm 2-36) moodlets yoktur: boş liste ve boş sayaçlarla açılır
//   save-v36.json: 29.1'in oyunu (kayıt sürümü 36): otopilotla 72 gün (--crisis-state; tohum 42): sakinlerin kimya kayıtları, zanaat bağları ve
//                  duygusal etiketleri (Minnettar, Hayran, Kırgın, Kıskanç, Ruh İkizi; Yönetime karşı hisler). Eski kayıtlarda (sürüm 2-35)
//                  characters[].relationships yoktur: her mevcut ilişkiye deterministik kimya ve boş etiket yapısı bağlanır
//   save-v35.json: 28.4'ün oyunu (kayıt sürümü 35): otopilotla 72 gün (--crisis-state; tohum 42: Bereketli Delta, Tarım Doktrini, seviye 4 G30, Altın Çağ G51).
//   save-v34.json: 28.3'ün oyunu (kayıt sürümü 34, bugünkü): otopilotla 72 gün (--crisis-state; tohum 42; 64. gün ilk Saygın Büyük Deniz, kotaya sayılan 30 / toplam 31).
//   save-v33.json: 28.2'nin oyunu (kayıt sürümü 33, bugünkü): otopilotla 72 gün (--crisis-state; tohum 42, 28.2 kurallarıyla yeni referans; 3 Başusta).
//   save-v32.json: 28.1'in oyunu (kayıt sürümü 32): otopilotla 72 gün (--crisis-state; tohum 42, 28.1 kurallarıyla yeni referans).
//   save-v31.json: 26.3'ün oyunu (kayıt sürümü 31): otopilotla 69 gün (--crisis-state); 68. gün 12:xx'de haritadaki Seyyar Ozan
//                  (68. gün geldi, ayrılış 69. gün 09:00), konuk defterinde 6 ziyaret; çıraklar ve Çırak Kapıları da hâlâ açık. Eski kayıtlarda
//                  (sürüm 2-30) activeGuest ve konuk defteri yoktur: null / boş defterle açılır
// Kullanım: node tools/sim/compat.mjs
import fs from 'fs';
import { openGame, createChecks } from './lib.mjs';

const fixtures = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map((v) => `save-v${v}.json`).filter((name) => fs.existsSync(new URL(`./fixtures/${name}`, import.meta.url))).map((name) => ({
  name,
  raw: fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
}));

const { browser, page, errors } = await openGame({ seed: 1 });
const { results, report } = createChecks();

for (const { name, raw } of fixtures) {
  const data = JSON.parse(raw);
  const r = await page.evaluate(async (raw) => {
    const game = window.game;
    const log = [];
    const offs = ['town:tierUp', 'town:tierAssessed', 'pet:arrived'].map((n) => game.events.on(n, (p) => log.push(n)));
    localStorage.setItem('lmgame.save.v2', raw);
    game.events.emit('ui:load');
    const s = game.state;
    const scene = game.scenes.current;
    const loaded = {
      day: s.time.day,
      pop: s.characters.length,
      buildings: s.buildings.length,
      res: { ...s.resources },
      map: { ...s.map },
      terrain: scene.saves.snapshot().terrain.length,
      types: [...new Set(s.buildings.map((b) => b.type))],
      projects: s.buildings.filter((b) => b.project).map((b) => ({ id: b.id, job: scene.jobs.jobs.some((j) => j.buildingId === b.id) })),
      exploration: { items: { ...s.exploration.items }, inscriptions: Object.keys(s.exploration.inscriptions).length, expeditions: s.exploration.expeditions, cityMap: s.exploration.cityMap, tales: s.characters.filter((c) => c.tale).length },
      // yüklendiği an (bir gün yaşarken ustalar yeni eser çıkarabilir)
      masterworks: { items: s.masterworks.items.length, made: s.masterworks.made, exhibited: s.masterworks.items.filter((i) => i.status === 'exhibited').length },
      // (18. aşama) peyzaj: tabela adları, fidanların dikiliş anı, çit bağlantıları, estetik
      landscape: {
        score: s.landscape.score,
        percent: s.landscape.percent,
        credit: { ...s.landscape.refundCredit },
        painted: s.landscape.roadsPainted,
        field: scene.world.aesthetics.some((v) => v > 0),
        signs: s.buildings.filter((b) => b.type === 'signpost').map((b) => b.label),
        trees: s.buildings.filter((b) => b.definition.ornamentalTree).map((b) => b.plantedAt),
        fencesLinked: s.buildings.filter((b) => b.type === 'woodFence').every((b) => b.connect),
        speedPath: scene.world.map.getSpeedMultiplier(0, 0) > 0,
      },
    };
    // Referans bütünlüğü (yüklemeden hemen sonra ve bir gün sonra)
    const integrity = () => {
      const ids = new Set(s.characters.map((c) => c.id));
      const bIds = new Set(s.buildings.map((b) => b.id));
      const bad = [];
      for (const c of s.characters) {
        if (c.homeId !== null && !bIds.has(c.homeId)) bad.push(`${c.name} evsiz`);
        if (c.partnerId !== null && s.characters.find((o) => o.id === c.partnerId)?.partnerId !== c.id) bad.push(`${c.name} eş`);
        if (c.insideBuildingId !== null && !s.buildings.find((b) => b.id === c.insideBuildingId)?.occupants.has(c.id)) bad.push(`${c.name} içeride`);
        for (const p of c.parentIds) if (!ids.has(p)) bad.push(`${c.name} ebeveyn`);
      }
      for (const b of s.buildings) for (const id of b.occupants) if (!ids.has(id)) bad.push(`${b.type} içeride kayıp`);
      return bad;
    };
    loaded.integrity = integrity();
    // (20. aşama) Ulu Saat Kulesi, Altın Çağ, Tarihçe (yüklendiği an)
    const towerB = s.buildings.find((b) => b.type === 'wonder');
    loaded.golden = {
      stage: towerB?.wonderStage ?? null,
      complete: Boolean(towerB?.wonderComplete),
      since: s.goldenAge.since,
      celebration: s.goldenAge.celebration !== null,
      chimes: s.goldenAge.chimes,
      books: s.goldenAge.books,
      founders: s.chronicle.founders.length,
      couple: s.chronicle.firstCouple,
      masterwork: s.chronicle.firstMasterwork,
      stages: Object.keys(s.chronicle.towerStages).length,
      gears: s.resources.gears,
    };
    // (21. aşama) kese, çanta, güven, dilekçeler (yüklendiği an)
    loaded.citizens = {
      coins: s.characters.map((c) => [c.id, c.coins, c.isChild]),
      inv: s.characters.map((c) => [c.id, JSON.stringify(c.inventory)]),
      trust: s.trust.value,
      revolt: s.trust.revolt !== null,
      petitions: s.petitions.list.map((p) => `${p.id}:${p.kind}:${p.characterId}`),
      made: s.petitions.made,
    };
    // (23. aşama) krizler: yanan / hasarlı yapılar, yaralılar, tehlike sıklığı, bekleyen baskın (yüklendiği an)
    loaded.crisis = {
      difficulty: s.crisis.difficulty,
      burning: s.buildings.filter((b) => b.isBurning).length,
      damaged: s.buildings.filter((b) => b.damaged).length,
      injured: s.characters.filter((c) => c.isInjured).length,
      raid: s.crisis.raid !== null,
      fires: s.crisis.fires,
      raids: s.crisis.raids,
      repairs: s.crisis.repairs,
      wells: s.buildings.filter((b) => b.type === 'well').length,
      towers: s.buildings.filter((b) => b.type === 'guardTower').length,
      grace: scene.crisis.graceUntil === null ? null : scene.crisis.graceUntil - s.totalMinutes,
    };
    // (24. aşama) tarım: bahçelerin mahsulü, Keten / Şerbetçiotu, Ürün Silosu ve bozulma sayaçları (yüklendiği an)
    loaded.agri = {
      crops: s.buildings.filter((b) => b.type === 'garden').map((b) => b.crop),
      otherCrops: s.buildings.filter((b) => b.type !== 'garden' && b.crop !== null).length,
      flax: s.resources.flax,
      hops: s.resources.hops,
      silos: s.buildings.filter((b) => b.type === 'silo' && b.functional).length,
      capacity: s.granaryCapacity,
      spoiled: JSON.stringify(s.granary.spoiled),
      switches: s.granary.switches,
    };
    // (24.2) katma değerli üretim: Kumaş / Fıçı Şerbeti, tezgâh ve şerbethane, handaki fıçılar, çanta eşyaları (yüklendiği an)
    loaded.refinery = {
      cloth: s.resources.cloth,
      sherbet: s.resources.sherbet,
      looms: s.buildings.filter((b) => b.type === 'loom').length,
      breweries: s.buildings.filter((b) => b.type === 'brewery').length,
      innCasks: s.buildings.filter((b) => b.type === 'inn').map((b) => b.sherbet).join(','),
      otherCasks: s.buildings.filter((b) => b.type !== 'inn' && b.sherbet !== 0).length,
      items: s.characters.reduce((n, c) => n + c.inventory.filter((x) => x.kind === 'garment' || x.kind === 'sherbetJug').length, 0),
    };
    // (24.3) dış ticaret (yüklendiği an)
    loaded.trade243 = {
      posts: s.buildings.filter((b) => b.type === 'tradingPost').length,
      json: JSON.stringify({ ship: s.tradePost.ship, next: s.tradePost.nextShipAt, visits: s.tradePost.visits, market: s.tradePost.market, completed: s.tradePost.completed, earned: s.tradePost.goldEarned }),
      empty: !s.tradePost.ship && s.tradePost.nextShipAt === null && s.tradePost.visits === 0 && Object.keys(s.tradePost.market).length === 0 && s.tradePost.completed === 0,
    };
    // (25.1) yaşam evreleri (yüklendiği an)
    loaded.life = s.characters.map((c) => ({ id: c.id, age: c.age, days: c.ageInDays, stage: c.lifeStage, child: c.isChild, retired: c.retired, role: Boolean(c.role) }));
    loaded.lifeState = JSON.stringify(s.lifeStages);
    // (25.5) yadigârlar (yüklendiği an)
    loaded.heirloom = {
      carried: s.characters.flatMap((c) => (c.inventory ?? []).filter((x) => x.heirloom).map((x) => [c.id, x.kind, JSON.stringify(x.heirloom.chain), x.heirloom.story])),
      state: JSON.stringify(s.heirloom),
      first: s.chronicle.firstHeirloom,
      mentees: s.characters.reduce((n, c) => n + (c.mentees?.length ?? 0), 0),
    };
    // (26.3) gezgin konuk (yüklendiği an)
    loaded.guest = { active: JSON.parse(JSON.stringify(s.activeGuest)), book: JSON.parse(JSON.stringify(s.guestBook)), onMap: scene.world.guests.length, isolated: !s.characters.some((c) => c.isGuest) && !scene.world.characters.some((c) => c.isGuest), time: { day: s.time.day, hour: s.time.hour } };
    // (26.2) Büyük Ziyafet Sofrası (yüklendiği an)
    loaded.feast = { cf: JSON.parse(JSON.stringify(s.currentFeast)), fair: JSON.parse(JSON.stringify(s.currentFestival)), day: s.time.day, hour: s.time.hour };
    // (26.1) mevsimlik panayır (yüklendiği an)
    loaded.fair = { cf: JSON.parse(JSON.stringify(s.currentFestival)), first: JSON.parse(JSON.stringify(s.chronicle.firstFair)), fairs: s.stats.fairs ?? 0, time: { day: s.time.day, hour: s.time.hour } };
    // (28.4) Vadi Karakteri ve Kasaba Doktrini (yüklendiği an)
    loaded.valley = { key: s.valley, expected: (await import('/src/systems/Valley.js')).valleyFor(s.seed), doctrine: JSON.stringify(s.doctrine), tradeCharter: s.civic.tradeCharter };
    // (29.2) Ruh halleri (yüklendiği an)
    const moodSnap = () => ({ json: JSON.stringify(s.characters.map((c) => [c.id, c.moodlets])), stats: JSON.stringify(s.moodlets), count: s.characters.reduce((n, c) => n + c.moodlets.length, 0), over: s.characters.filter((c) => c.moodlets.length > 6).length, moods: s.characters.every((c) => c.mood && c.mood.workMul >= 0.6 && c.mood.workMul <= 1.25 && typeof c.mood.feel === 'string') });
    loaded.moodlets = moodSnap();
    // (29.1) Sosyal kimya ve duygusal etiketler (yüklendiği an)
    const chemSnap = () => (() => {
      const byId = new Map(s.characters.map((c) => [c.id, c]));
      const pairs = Object.keys(s.relationships).map((k) => k.split('-').map(Number)).filter(([a, b]) => byId.has(a) && byId.has(b));
      let bound = 0; let symmetric = 0; let dangling = 0; let range = true; let tags = 0; let records = 0;
      for (const [a, b] of pairs) { const ra = byId.get(a).relationships[b]; const rb = byId.get(b).relationships[a]; if (ra && rb) bound++; if (ra && rb && ra.chemistry === rb.chemistry) symmetric++; }
      for (const c of s.characters) for (const [k, r] of Object.entries(c.relationships ?? {})) { records++; if (k !== '0' && !byId.has(Number(k))) dangling++; if (!Number.isInteger(r.chemistry) || r.chemistry < -2 || r.chemistry > 3) range = false; tags += r.tags.length; }
      return { pairs: pairs.length, bound, symmetric, dangling, range, tags, records, json: JSON.stringify(s.characters.map((c) => [c.id, c.relationships])) };
    })();
    loaded.chemistry = chemSnap();
    loaded.chemistryFor = await (async () => { const CH = await import('/src/systems/Chemistry.js'); const byId = new Map(s.characters.map((c) => [c.id, c])); return Object.keys(s.relationships).map((k) => k.split('-').map(Number)).filter(([a, b]) => byId.has(a) && byId.has(b)).every(([a, b]) => { const x = byId.get(a).relationships[b]?.chemistry; return x >= -2 && x <= 3 && Math.abs(x - CH.chemistryFor(s.seed, byId.get(a), byId.get(b))) <= 1; }); })();
    // (25.4) Aile Kütüğü (yüklendiği an)
    loaded.lineage = {
      people: s.characters.filter((c) => !c.role).map((c) => ({ id: c.id, g: c.generation, f: c.familyId, p: [...(c.parents ?? [])], pi: [...c.parentIds], k: [...(c.children ?? [])], fam: Boolean(s.lineage.families[c.familyId]) })),
      families: Object.keys(s.lineage.families).length,
      first: s.chronicle.firstGen2Couple,
      weddings: s.lineage.gen2Weddings,
      kin: s.characters.filter((c) => c.partnerId !== null).some((c) => { const o = s.characters.find((x) => x.id === c.partnerId); const pa = new Set([...(c.parents ?? []), ...c.parentIds]); const pb = new Set([...(o?.parents ?? []), ...(o?.parentIds ?? [])]); return o && (pa.has(o.id) || pb.has(c.id) || [...pa].some((id) => pb.has(id))); }),
    };
    // (25.3) mizaç (yüklendiği an)
    {
      const SO = await import('/src/data/social.js');
      loaded.temper = {
        quirks: s.characters.map((c) => [c.id, c.quirk]),
        valid: s.characters.every((c) => c.role || SO.QUIRKS[c.quirk]),
        generation: s.characters.filter((c) => SO.QUIRKS[c.quirk]?.generation).length,
        origins: s.characters.filter((c) => c.quirkOrigin).map((c) => [c.id, JSON.stringify(c.quirkOrigin, ['kind', 'fromId', 'fromName', 'day'])]),
        state: JSON.stringify(s.temperament),
        classic: SO.QUIRK_KEYS,
        allKeys: SO.ALL_QUIRK_KEYS,
      };
    }
    // (25.2) çıraklık (yüklendiği an)
    loaded.appr = { list: s.characters.filter((c) => c.apprenticeship).map((c) => ({ id: c.id, a: JSON.stringify(c.apprenticeship), youth: c.lifeStage === 'youth' })), state: JSON.stringify(s.apprenticeship) };
    // (22. aşama) vergi, Krallık, terk ediş (yüklendiği an)
    loaded.crown = {
      rate: s.tax.rate,
      taxNext: Number.isFinite(s.tax.nextAt) && s.tax.nextAt > s.totalMinutes,
      collections: s.tax.collections,
      reputation: s.crown.reputation,
      levyNext: Number.isFinite(s.crown.nextLevyAt) && s.crown.nextLevyAt > s.totalMinutes,
      levies: s.crown.levies,
      paid: s.crown.paid,
      decree: s.crown.decree?.kind ?? null,
      delivered: s.crown.delivered,
      right: s.crown.statueRight,
      left: s.exodus.left,
      emigrating: s.characters.filter((c) => c.emigrating).length,
    };
    // (19. aşama) huylar, ortak evler, dedikodu (yüklendiği an)
    loaded.social = {
      quirks: s.characters.map((c) => c.quirk),
      kinds: [...new Set(s.characters.map((c) => c.quirk))].length,
      couples: s.characters.filter((c) => c.married).map((c) => [c.id, c.partnerId, c.homeId]),
      gossip: s.social.gossip.length,
      news: s.characters.filter((c) => c.lastNews).length,
      party: s.social.party !== null,
    };
    const startDay = s.time.day;
    window.sim.step(225 * 24); // bir gün
    // Yolda bir sefer varsa macera pencereleri oyunu (gerçek zamanda 30 sn) durdurur: gün dönene kadar biraz daha ilerlet
    for (let guard = 0; s.time.day === startDay && guard < 48; guard++) window.sim.step(225);
    game.render(0);
    offs.forEach((off) => off());
    const integrityAfter = integrity();
    const expeditionAfter = { active: Boolean(s.dilemma.expedition), away: s.characters.filter((c) => c.away).length, adventure: s.dilemma.active?.kind === 'adventure' };
    const { outfitFor } = await import('/src/systems/SkillSystem.js');
    const { inventoryCapacity } = await import('/src/systems/Citizens.js');
    const citizensAfter = {
      trust: s.trust.value,
      revolt: s.trust.revolt !== null,
      bagsOk: s.characters.every((c) => Number.isFinite(c.coins) && c.coins >= 0 && c.inventory.length <= inventoryCapacity(c) && c.inventory.every((x) => x.qty > 0)),
      petitionsOk: s.petitions.list.every((p) => s.characters.some((c) => c.id === p.characterId)),
      wages: s.stats.wagesPaid ?? 0,
    };
    return {
      crownAfter: { pop: s.characters.length, left: s.exodus.left, active: Boolean(s.exodus.active), rate: s.tax.rate },
      apprAfter: { ok: s.characters.every((c) => !c.apprenticeship || (c.lifeStage === 'youth' && s.buildings.some((b) => b.id === c.apprenticeship.buildingId) && c.apprenticeship.progress >= 0 && c.apprenticeship.progress <= 100)), n: s.characters.filter((c) => c.apprenticeship).length },
      lifeAfter: s.characters.map((c) => ({ id: c.id, days: c.ageInDays, stage: c.lifeStage, child: c.isChild })),
      moodletsAfter: (() => { const m = moodSnap(); delete m.json; return m; })(),
      chemistryAfter: (() => { const c = chemSnap(); delete c.json; return c; })(),
      tradeAfter: { visits: s.tradePost.visits, scheduled: s.tradePost.nextShipAt !== null || Boolean(s.tradePost.ship) },
      agriAfter: { crops: s.buildings.filter((b) => b.type === 'garden').map((b) => b.crop), capacity: s.granaryCapacity },
      crisisAfter: { fires: s.crisis.fires, raids: s.crisis.raids, raidPending: s.crisis.raid !== null, nextWarn: s.crisis.nextRaidWarnAt, burning: s.buildings.filter((b) => b.isBurning).length, injured: s.characters.filter((c) => c.isInjured).length, day: s.time.day },
      citizensAfter,
      integrityAfter,
      expeditionAfter,
      outfits: s.characters.filter((c) => c.outfit).length,
      outfitsOk: s.characters.every((c) => c.outfit === outfitFor(c) || (c.outfit?.split(':')[1] === outfitFor(c)?.split(':')[1])),
      loaded,
      after: { day: s.time.day, pop: s.characters.length, tier: s.town.tier, assessed: s.town.assessed },
      animals: s.animals.length,
      wild: s.animals.filter((a) => !a.isPet).length,
      pets: s.animals.filter((a) => a.isPet).length,
      civic: { ...s.civic },
      research: s.research,
      trade: s.trade,
      gold: s.resources.gold,
      taxGold: s.tax.totalGold, // (22. aşama) iç vergi hazineye altın getirir
      academy: s.buildings.filter((b) => b.type === 'academy' || b.type === 'harbor' || b.type === 'wonder').length,
      luxury: s.luxury,
      history: s.history.length,
      pinned: s.characters.filter((c) => c.workplaceId !== null).length,
      weddings: s.stats.weddings,
      married: s.characters.filter((c) => c.married).length,
      wonderStage: s.buildings.find((b) => b.type === 'wonder')?.wonderStage ?? 0,
      memories: s.characters.map((c) => c.memories.length),
      festivalStage: s.seasonFestival.stage,
      weather: s.weather.type,
      dilemma: s.dilemma.nextDay,
      log,
      celebration: !document.querySelector('.celebration').hidden,
      title: document.querySelector('.hud-town-name').textContent,
    };
  }, raw);
  const tag = `${name} (sürüm ${data.version})`;
  results.push({ name: `${tag}: referanslar sağlam (yüklenince ve bir gün sonra)`, ok: r.loaded.integrity.length === 0 && r.integrityAfter.length === 0, detail: [...r.loaded.integrity, ...r.integrityAfter].slice(0, 4).join(', ') });
  if (data.version < 13) results.push({ name: `${tag}: usta işi eser vitrini boş başlar`, ok: r.loaded.masterworks.items === 0 && r.loaded.masterworks.made === 0 });
  else results.push({ name: `${tag}: usta işi eserler korundu`, ok: r.loaded.masterworks.items === data.masterworks.items.length && r.loaded.masterworks.made === data.masterworks.made && r.loaded.masterworks.exhibited === data.masterworks.items.filter((i) => i.status === 'exhibited').length, detail: `${r.loaded.masterworks.items} eser, ${r.loaded.masterworks.exhibited} sergide` });
  if (data.dilemma?.expedition && !data.dilemma.expedition.adventures) {
    results.push({ name: `${tag}: eski biçimde yarım kalan sefer maceralar açmadan sürer ve döner`, ok: !r.expeditionAfter.active && r.expeditionAfter.away === 0 && !r.expeditionAfter.adventure, detail: JSON.stringify(r.expeditionAfter) });
  }
  if (data.version < 14) {
    const e = r.loaded.exploration;
    results.push({ name: `${tag}: keşif ganimeti ve yazıt boş başlar`, ok: e.inscriptions === 0 && Object.values(e.items).every((v) => v === 0) && !e.cityMap && e.tales === 0 });
  } else {
    const e = r.loaded.exploration;
    const d = data.exploration;
    results.push({
      name: `${tag}: keşif ganimetleri, yazıtlar ve sefer sayısı korundu`,
      ok: e.inscriptions === Object.keys(d.inscriptions).length && e.expeditions === d.expeditions && e.cityMap === d.cityMap && Object.entries(d.items).every(([k, v]) => e.items[k] === v),
      detail: `${e.expeditions} sefer, ${e.inscriptions} yazıt, ganimet ${JSON.stringify(e.items)}`,
    });
  }
  if (data.version < 15) {
    const L = r.loaded.landscape;
    results.push({ name: `${tag}: peyzaj durumu boş başlar, estetik yüklenince hesaplanır`, ok: Object.keys(L.credit).length === 0 && L.painted === 0 && L.percent >= 0 && L.percent <= 5 && L.signs.length === 0, detail: `estetik ${L.score} (+%${L.percent})` });
  } else {
    const L = r.loaded.landscape;
    const signs = data.buildings.filter((b) => b.type === 'signpost').map((b) => b.label);
    const trees = data.buildings.filter((b) => ['birchTree', 'oakTree', 'pineTree'].includes(b.type)).map((b) => b.plantedAt);
    results.push({
      name: `${tag}: tabela adları, fidanların dikiliş anı, çitler ve estetik korundu`,
      ok: JSON.stringify(L.signs) === JSON.stringify(signs) && JSON.stringify(L.trees) === JSON.stringify(trees) && L.fencesLinked && L.field && L.painted === data.landscape.roadsPainted && Math.abs(L.score - data.landscape.score) < 3,
      detail: `${L.signs.join(', ')} · ${L.trees.length} ağaç · estetik ${L.score}/${data.landscape.score} (+%${L.percent})`,
    });
  }
  {
    // (19. aşama) karakter huyları, evli çiftlerin evleri, dedikodu
    const S = r.loaded.social;
    // (25.3) v26'dan itibaren dört yeni nesil huy da geçerlidir; daha eski kayıtlarda yalnızca kuruluş huyları
    const valid = S.quirks.every((q) => (data.version >= 26 ? r.loaded.temper.allKeys : ['animalLover', 'bookworm', 'musician', 'natureEnthusiast']).includes(q));
    const homes = Object.fromEntries(data.characters.map((c) => [c.id, c.homeId]));
    const homesKept = S.couples.every(([id, , home]) => homes[id] === undefined || homes[id] === home || homes[id] === null);
    if (data.version < 16) {
      results.push({
        name: `${tag}: huylar ilk açılışta dağıtıldı, dedikodu boş başlar, evli çiftlerin evleri korunur`,
        ok: valid && (S.quirks.length < 4 || S.kinds === 4) && S.gossip === 0 && S.news === 0 && !S.party && homesKept,
        detail: `${S.kinds} huy, ${S.couples.length / 2} evli çift`,
      });
    } else {
      const quirks = data.characters.map((c) => c.quirk);
      results.push({
        name: `${tag}: huylar, ortak evler, son duyulan haberler ve dedikodu korundu`,
        ok: valid && JSON.stringify(S.quirks) === JSON.stringify(quirks) && homesKept && S.gossip === data.social.gossip.length && S.news === data.characters.filter((c) => c.lastNews).length,
        detail: `${S.kinds} huy, ${S.couples.length / 2} evli çift, ${S.gossip} haber, ${S.news} sakin haber duymuş`,
      });
    }
  }
  {
    // (20. aşama) Ulu Saat Kulesi aşaması, Altın Çağ ve Tarihçe Kütüğü
    const G = r.loaded.golden;
    const towerData = data.buildings.find((b) => b.type === 'wonder');
    const married = data.characters.some((c) => c.married && c.marriedAt !== null && c.marriedAt !== undefined);
    if (data.version < 17) {
      results.push({
        name: `${tag}: Tarihçe sakinlerden çıkarıldı, kule aşaması korundu, Altın Çağ yalnızca tamamlanmış kuleyle (kutlamasız)`,
        ok: G.founders >= 1 && (!married || G.couple) && (!data.masterworks?.items?.length || G.masterwork) && G.stage === (towerData ? towerData.wonderStage ?? 0 : null) && Boolean(G.since) === G.complete && !G.celebration && G.gears === 0 && G.books === 0,
        detail: `kule ${G.stage ?? '-'} · Altın Çağ ${G.since ? `G${G.since.day}` : 'yok'} · kurucu ${G.founders} · ilk çift ${G.couple ? `${G.couple.a} & ${G.couple.b}` : '-'}`,
      });
    } else {
      results.push({
        name: `${tag}: Ulu Saat Kulesi, Altın Çağ, Tarihçe Kütüğü ve antik kitaplar korundu`,
        ok: G.stage === towerData?.wonderStage && JSON.stringify(G.since) === JSON.stringify(data.goldenAge.since) && G.chimes === data.goldenAge.chimes && G.books === data.goldenAge.books && G.founders === data.chronicle.founders.length && G.stages === Object.keys(data.chronicle.towerStages).length,
        detail: `kule ${G.stage} · Altın Çağ G${G.since?.day ?? '-'} · çan ${G.chimes} · kitap ${G.books} · kurucu ${G.founders}`,
      });
    }
  }
  {
    // (21. aşama) kişisel kese ve çanta, Yönetim Güveni, dilekçeler
    const C = r.loaded.citizens;
    const A = r.citizensAfter;
    if (data.version < 18) {
      results.push({
        name: `${tag}: sakinlere başlangıç harçlığı (yetişkin 12, çocuk 3), çantalar boş, Yönetim Güveni %75, dilekçe ve isyan yok`,
        ok: C.coins.every(([, coins, child]) => coins === (child ? 3 : 12)) && C.inv.every(([, inv]) => inv === '[]') && C.trust === 75 && !C.revolt && C.petitions.length === 0 && C.made === 0,
        detail: `${C.coins.length} sakin, güven %${C.trust}`,
      });
    } else {
      const coins = data.characters.map((c) => [c.id, c.coins]);
      results.push({
        name: `${tag}: keseler, çantalar, Yönetim Güveni ve dilekçeler korundu`,
        ok: JSON.stringify(C.coins.map(([id, v]) => [id, v])) === JSON.stringify(coins) && C.inv.every(([id, inv]) => inv === JSON.stringify(data.characters.find((c) => c.id === id).inventory)) && Math.abs(C.trust - data.trust.value) < 1e-9 && C.petitions.length === data.petitions.list.length && C.made === data.petitions.made,
        detail: `${C.coins.reduce((a, [, v]) => a + v, 0)} altın kesede · güven %${Math.round(C.trust)} · ${C.petitions.length} açık dilekçe, ${C.made} dilekçe`,
      });
    }
    results.push({ name: `${tag}: bir gün sonra keseler ve çantalar geçerli, isyan yok`, ok: A.bagsOk && A.petitionsOk && !A.revolt && A.trust >= 0 && A.trust <= 100, detail: `güven %${Math.round(A.trust)}, yevmiye ${A.wages}` });
  }
  {
    // (22. aşama) iç vergi, Krallık Vergisi, Kraliyet Fermanları, terk ediş
    const K = r.loaded.crown;
    if (data.version < 19) {
      results.push({
        name: `${tag}: Standart Vergi, Krallık İtibarı 50, ferman / berat / terk ediş yok; vergi takvimi kuruldu`,
        ok: K.rate === 'standard' && K.taxNext && K.levyNext && K.collections === 0 && K.reputation === 50 && K.levies === 0 && K.decree === null && !K.right && K.left === 0 && K.emigrating === 0,
        detail: `itibar %${K.reputation}`,
      });
    } else {
      results.push({
        name: `${tag}: vergi kademesi, tahsilatlar, Krallık İtibarı, vergi sayaçları, fermanlar ve Kraliyet Beratı korundu`,
        ok: K.rate === data.tax.rate && K.collections === data.tax.collections && Math.abs(K.reputation - data.crown.reputation) < 1e-9 && K.levies === data.crown.levies && K.paid === data.crown.paid && K.delivered === data.crown.delivered && K.right === data.crown.statueRight && K.decree === (data.crown.decree?.kind ?? null) && K.left === data.exodus.left,
        detail: `${K.rate} · ${K.collections} tahsilat · itibar %${Math.round(K.reputation)} · vergi ${K.paid}/${K.levies} · ferman ${K.delivered} · berat ${K.right ? 'var' : 'yok'}`,
      });
    }
    results.push({ name: `${tag}: bir gün sonra kimse köyü terk etmedi`, ok: !r.crownAfter.active && r.crownAfter.left === K.left, detail: `${r.crownAfter.pop} sakin, terk eden ${r.crownAfter.left}` });
  }
  {
    // (23. aşama) krizler
    const C = r.loaded.crisis;
    const A = r.crisisAfter;
    if (data.version < 20) {
      results.push({
        name: `${tag}: hiçbir yapı yanmıyor / hasarlı değil, kimse yaralı değil, Dengeli, baskın yok`,
        ok: C.burning === 0 && C.damaged === 0 && C.injured === 0 && C.difficulty === 'dengeli' && !C.raid && C.fires === 0 && C.raids === 0 && C.repairs === 0,
        detail: `${C.difficulty}`,
      });
    } else {
      results.push({
        name: `${tag}: tehlike sıklığı, kriz sayaçları, Su Kuyusu / Gözcü Kulesi, yanan / hasarlı yapılar ve yaralılar korundu`,
        ok: C.difficulty === data.crisis.difficulty && C.fires === data.crisis.fires && C.raids === data.crisis.raids && C.repairs === data.crisis.repairs && C.burning === data.buildings.filter((b) => b.isBurning).length && C.damaged === data.buildings.filter((b) => b.damaged).length && C.injured === data.characters.filter((c) => c.isInjured).length && C.wells === data.buildings.filter((b) => b.type === 'well').length && C.towers === data.buildings.filter((b) => b.type === 'guardTower').length && C.raid === (data.crisis.raid !== null),
        detail: `${C.difficulty} · yangın ${C.fires} · baskın ${C.raids} · tamir ${C.repairs} · kuyu ${C.wells} · kule ${C.towers}`,
      });
    }
    const quiet = C.burning === 0 && !C.raid;
    results.push({
      // Aktif krizle kaydedilen oyunda (yanan yapı / bekleyen baskın) oyunun kuralı gereği koruma yoktur: doğal yangın çıkabilir,
      // yalnızca sayaçlar tutarlı kalmalıdır (24.3: save-v23.json'da yükleme sonrası bir yangın çıktı, bu kural doğrudur)
      name: quiet ? `${tag}: yükleme sonrası ilk 24 oyun saatinde koruma var, doğal yangın ya da baskın patlamadı` : `${tag}: aktif krizle yüklendi (koruma yok); yangın / baskın sayaçları tutarlı`,
      ok: quiet ? C.grace === 1440 && A.fires === C.fires && A.raids === C.raids && !A.raidPending && A.burning === 0 : C.grace === null && A.fires >= C.fires && A.raids >= C.raids,
      detail: `koruma ${C.grace} dk · yangın ${C.fires}->${A.fires} · baskın ${C.raids}->${A.raids}`,
    });
  }
  // (24. aşama) tarımsal çeşitlilik
  {
    const G = r.loaded.agri;
    if (data.version < 21) {
      results.push({
        name: `${tag}: bütün bahçeler Buğday / Sebze ekili, Keten / Şerbetçiotu 0, silo sayaçları boş`,
        ok: G.crops.every((c) => c === 'grain') && G.otherCrops === 0 && G.flax === 0 && G.hops === 0 && G.capacity === 0 && G.spoiled === '{}' && G.switches === 0,
        detail: `${G.crops.length} bahçe`,
      });
    } else {
      const crops = data.buildings.filter((b) => b.type === 'garden').map((b) => b.crop);
      results.push({
        name: `${tag}: bahçelerin mahsulü, Keten / Şerbetçiotu stoğu, silo kapasitesi ve bozulma sayaçları korundu`,
        ok: G.crops.join() === crops.join() && G.otherCrops === 0 && G.flax === data.resources.flax && G.hops === data.resources.hops && G.capacity === 150 * G.silos && G.silos === data.buildings.filter((b) => b.type === 'silo' && !b.underConstruction).length && G.spoiled === JSON.stringify(data.granary.spoiled) && G.switches === data.granary.switches,
        detail: `${G.crops.join(',')} · keten ${G.flax} · şerbetçiotu ${G.hops} · silo ${G.silos} (+${G.capacity})`,
      });
    }
    results.push({ name: `${tag}: bir gün sonra mahsuller geçerli, silo kapasitesi yerinde`, ok: r.agriAfter.crops.every((c) => ['grain', 'flax', 'hops'].includes(c)) && r.agriAfter.capacity === G.capacity, detail: r.agriAfter.crops.join(',') });
  }
  // (24.3) dış ticaret
  {
    const D = r.loaded.trade243;
    if (data.version < 23) {
      results.push({ name: `${tag}: dış ticaret boş (iskele, gemi, sözleşme, pazar çarpanı yok)`, ok: D.empty && D.posts === 0 && r.tradeAfter.visits === 0 });
    } else {
      const t = data.tradePost;
      const want = JSON.stringify({ ship: t.ship, next: t.nextShipAt, visits: t.visits, market: t.market, completed: t.completed, earned: t.goldEarned });
      results.push({ name: `${tag}: iskele, gemi takvimi, sözleşmeler, pazar çarpanları ve sayaçlar korundu`, ok: D.json === want && D.posts === data.buildings.filter((b) => b.type === 'tradingPost').length, detail: `${t.visits} ziyaret · ${t.completed} sözleşme · +${t.goldEarned} altın` });
      results.push({ name: `${tag}: bir gün sonra takvim sürüyor`, ok: r.tradeAfter.scheduled && r.tradeAfter.visits >= t.visits });
    }
  }
  // (29.2) Ruh halleri
  {
    const M = r.loaded.moodlets;
    const after = r.moodletsAfter;
    if (data.version < 37) {
      results.push({ name: `${tag}: her sakine boş ruh hali listesi (moodlets: []), boş sayaçlar; ruh hali nötr`, ok: M.count === 0 && M.stats === JSON.stringify({ given: {}, consoled: 0, grieved: 0, mourners: 0 }) && M.moods });
    } else {
      results.push({ name: `${tag}: ruh halleri (moodlet'ler) ve sayaçları korundu`, ok: M.json === JSON.stringify(data.characters.map((c) => [c.id, c.moodlets])) && M.stats === JSON.stringify(data.moodlets) && M.moods && M.over === 0, detail: `${M.count} moodlet` });
    }
    results.push({ name: `${tag}: bir gün sonra ruh halleri yaşıyor (tavanlar ve çarpan sınırları içinde)`, ok: after.over === 0 && after.moods && after.count > 0, detail: `${after.count} moodlet` });
  }
  // (29.1) Sosyal kimya ve duygusal etiketler
  {
    const C = r.loaded.chemistry;
    const after = r.chemistryAfter;
    if (data.version < 36) {
      results.push({ name: `${tag}: mevcut her ilişkiye deterministik kimya bağlandı (iki yönlü, -2..+3), etiket yok`, ok: C.pairs === C.bound && C.bound === C.symmetric && C.range && C.tags === 0 && C.dangling === 0 && r.loaded.chemistryFor, detail: `${C.bound}/${C.pairs} çift` });
    } else {
      const want = JSON.stringify(data.characters.map((c) => [c.id, c.relationships]));
      results.push({ name: `${tag}: kimya, zanaat bağı ve duygusal etiketler korundu`, ok: C.json === want && C.range && C.dangling === 0 && C.records > 0, detail: `${C.records} kayıt · ${C.tags} etiket` });
    }
    results.push({ name: `${tag}: bir gün sonra kimya kayıtları tutarlı (kopuk kayıt yok, iki yönlü, sınır içinde)`, ok: after.dangling === 0 && after.range && after.bound === after.symmetric, detail: `${after.records} kayıt · ${after.tags} etiket` });
  }
  // (28.4) Vadi Karakteri ve Kasaba Doktrini
  {
    const V = r.loaded.valley;
    if (data.version < 35) {
      results.push({ name: `${tag}: vadi karakteri tohumdan atandı, doktrin seçilmedi, Ticaret Beratı yok`, ok: V.key === V.expected && V.doctrine === JSON.stringify({ chosen: null, day: null }) && V.tradeCharter === false, detail: V.key });
    } else {
      results.push({ name: `${tag}: vadi karakteri ve kasaba doktrini korundu`, ok: V.key === data.valley && V.key === V.expected && V.doctrine === JSON.stringify(data.doctrine), detail: `${V.key} · doktrin ${data.doctrine.chosen ?? '-'}` });
    }
  }
  // (25.1) yaşam evreleri
  {
    const L = r.loaded.life;
    const valid = (x) => (x.child ? x.stage === 'child' : ['youth', 'adult', 'elder'].includes(x.stage)) && Number.isInteger(x.days) && x.days >= 0 && x.age === Math.floor(x.days / 16);
    if (data.version < 24) {
      const ageOf = new Map(data.characters.map((c) => [c.id, c.age]));
      const expected = (x) => (x.child ? 'child' : x.age >= 65 ? 'elder' : 'adult');
      results.push({
        name: `${tag}: evresi olmayan yetişkinler 'adult', çocuklar 'child' başladı; yaşlar değişmedi, gün sayacı yaştan kuruldu`,
        ok: L.every(valid) && L.every((x) => x.stage === expected(x)) && L.every((x) => !Number.isFinite(ageOf.get(x.id)) || x.child || x.age === Math.floor(ageOf.get(x.id))) && r.loaded.lifeState === JSON.stringify({ adviceMinutes: 0, elders: 0, adults: 0, lastElderLine: null, venerables: 0, deaths: 0, accidents: 0, lastDeath: null }),
        detail: Object.entries(L.reduce((m, x) => ({ ...m, [x.stage]: (m[x.stage] ?? 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', '),
      });
    } else {
      const saved = new Map(data.characters.map((c) => [c.id, c]));
      results.push({
        name: `${tag}: yaşam evreleri, gün cinsinden yaşlar ve evre sayaçları korundu`,
        ok: L.every(valid) && L.every((x) => saved.get(x.id)?.lifeStage === x.stage && saved.get(x.id)?.ageInDays === x.days) && r.loaded.lifeState === JSON.stringify({ ...data.lifeStages, venerables: data.lifeStages.venerables ?? 0, deaths: data.lifeStages.deaths ?? 0, accidents: data.lifeStages.accidents ?? 0, lastDeath: data.lifeStages.lastDeath ?? null }), // (28.3) v34'ten eski kayıtlarda vefat alanları 0 / null
        detail: `${L.filter((x) => x.stage === 'elder').length} bilge, ${L.filter((x) => x.stage === 'youth').length} genç · ${r.loaded.lifeState}`,
      });
      const elders = L.filter((x) => x.stage === 'elder');
      const core = L.filter((x) => !x.child && !x.role && x.stage !== 'elder').length;
      results.push({ name: `${tag}: bilgeler emekli (çekirdek sakin kuralı), ölmedi`, ok: elders.length > 0 && elders.every((x) => x.retired === core >= 3), detail: `${elders.length} bilge, ${core} çekirdek sakin` });
    }
    const before = new Map(L.map((x) => [x.id, x]));
    const grew = r.lifeAfter.filter((x) => before.has(x.id) && !before.get(x.id).role);
    results.push({
      name: `${tag}: bir gün sonra herkesin yaşı bir gün ilerledi, evreler geçerli, kimse silinmedi`,
      ok: grew.every((x) => (x.days === before.get(x.id).days + 1 || (before.get(x.id).child && !x.child && x.days >= 18 * 16)) && (x.child ? x.stage === 'child' : ['youth', 'adult', 'elder'].includes(x.stage))) && grew.length >= L.filter((x) => !x.role).length - 2,
      detail: `${grew.length} sakin`,
    });
  }
  // (26.3) gezgin konuklar
  {
    const G = r.loaded.guest;
    if (data.version < 31) {
      results.push({ name: `${tag}: activeGuest yok -> null, boş konuk defteri, haritada konuk yok`, ok: G.active === null && G.onMap === 0 && G.book.visits === 0 && G.book.nextDay === null && G.book.barters === 0, detail: JSON.stringify(G.book) });
    } else {
      const saved = data.activeGuest;
      const g = G.active;
      const gone = saved && (saved.departureDay < data.time.day || (saved.departureDay === data.time.day && data.time.hour >= 9 && !saved.leaving));
      results.push({
        name: `${tag}: gezgin konuk (activeGuest) ve konuk defteri korundu; konuk nüfus ve konuta sayılmaz`,
        ok: G.isolated && JSON.stringify(G.book.rare) === JSON.stringify(data.guestBook.rare) && G.book.visits === data.guestBook.visits && (gone || !saved ? g === null || !saved : g !== null && g.type === saved.type && g.departureDay === saved.departureDay && g.name === saved.name && G.onMap === 1),
        detail: `${g?.type ?? 'yok'} · ziyaret ${G.book.visits} · takas ${G.book.barters}`,
      });
    }
  }
  // (26.2) Büyük Ziyafet Sofrası
  {
    const E = r.loaded.feast;
    if (data.version < 30) {
      results.push({ name: `${tag}: currentFeast yok -> null (Büyük Ziyafet Sofrası kurulmamış)`, ok: E.cf === null, detail: JSON.stringify(E.cf) });
    } else {
      const saved = data.currentFeast;
      const live = saved && saved.day === data.time.day && data.currentFestival && data.time.hour >= 6 && data.time.hour < 22;
      results.push({
        name: `${tag}: süren Büyük Ziyafet Sofrası (currentFeast: seviye, bağışlar, ikram sayacı) korundu`,
        // (27.1) eatenIds v2-v31 kayıtlarında yoktur: yüklemede [] ile başlar
        ok: JSON.stringify(E.cf) === JSON.stringify(live ? { ...saved, eatenIds: saved.eatenIds ?? [] } : null),
        detail: JSON.stringify(E.cf),
      });
    }
  }
  // (26.1) mevsimlik panayır
  {
    const F = r.loaded.fair;
    if (data.version < 29) {
      results.push({ name: `${tag}: currentFestival yok -> null; Tarihçe'de ilk panayır ve panayır sayacı yok`, ok: F.cf === null && F.first === null && F.fairs === 0, detail: JSON.stringify(F.cf) });
    } else {
      const saved = data.currentFestival;
      const live = saved && saved.day === data.time.day && data.time.hour >= 6 && data.time.hour < 22;
      results.push({
        name: `${tag}: süren panayır (currentFestival) ve Tarihçe'deki ilk panayır korundu`,
        // (27.1) participants v2-v31 kayıtlarında yoktur: yüklemede [] ile başlar
        ok: JSON.stringify(F.cf) === JSON.stringify(live ? { ...saved, participants: saved.participants ?? [] } : null) && JSON.stringify(F.first) === JSON.stringify(data.chronicle.firstFair),
        detail: `${JSON.stringify(F.cf)} · ilk: ${F.first?.name ?? 'yok'}`,
      });
    }
  }
  // (25.5) yadigârlar
  {
    const H = r.loaded.heirloom;
    if (data.version < 28) {
      results.push({ name: `${tag}: yadigâr, çırak geçmişi, yadigâr sayacı ve ilk devir yok`, ok: H.carried.length === 0 && H.mentees === 0 && !H.first && H.state === JSON.stringify({ created: 0, transfers: 0, archive: [], feast: null }) });
    } else {
      const saved = data.characters.flatMap((c) => (c.inventory ?? []).filter((x) => x.heirloom).map((x) => [c.id, x.kind, JSON.stringify(x.heirloom.chain), x.heirloom.story]));
      results.push({
        name: `${tag}: çantadaki yadigârlar (hikâye, zincir), sayaçlar ve Tarihçe'deki ilk kuşak mirası korundu`,
        ok: H.carried.length > 0 && JSON.stringify(H.carried) === JSON.stringify(saved) && JSON.parse(H.state).transfers === data.heirloom.transfers && JSON.stringify(H.first) === JSON.stringify(data.chronicle.firstHeirloom),
        detail: H.carried.map((x) => `${x[1]} ${x[2]}`).join(' · '),
      });
    }
  }
  // (25.4) Aile Kütüğü
  {
    const L = r.loaded.lineage;
    const byId = new Map(L.people.map((x) => [x.id, x]));
    const consistent = L.people.every((x) => {
      const ps = x.p.map((id) => byId.get(id)).filter(Boolean);
      return Number.isInteger(x.g) && x.fam && (ps.length ? x.g === Math.max(...ps.map((p) => p.g)) + 1 : x.g >= 1) && ps.every((p) => p.k.includes(x.id)) && x.k.every((id) => byId.get(id)?.p.includes(x.id));
    });
    if (data.version < 27) {
      results.push({
        name: `${tag}: ebeveyni kayıtlı olmayan herkes 1. kuşak (kendi ocağıyla), kasabada doğanlar ebeveyninin bir fazlası; 2. kuşak düğünü yok`,
        ok: consistent && L.people.every((x) => (x.p.filter((id) => byId.has(id)).length ? x.g >= 2 : x.g === 1)) && L.families === L.people.filter((x) => x.g === 1 || !x.p.some((id) => byId.has(id))).length && !L.first && L.weddings === 0 && !L.kin,
        detail: `${L.people.filter((x) => x.g === 1).length} kurucu / göçmen, ${L.people.filter((x) => x.g >= 2).length} kasabalı · ${L.families} ocak`,
      });
    } else {
      const saved = new Map(data.characters.map((c) => [c.id, c]));
      results.push({
        name: `${tag}: kuşaklar, doğum ebeveynleri, ocaklar, çocuklar ve 2. kuşak ilk düğünü korundu; akraba çift yok`,
        ok: consistent && L.people.every((x) => saved.get(x.id)?.generation === x.g && saved.get(x.id)?.familyId === x.f) && L.families === Object.keys(data.lineage.families).length && JSON.stringify(L.first) === JSON.stringify(data.chronicle.firstGen2Couple ?? null) && L.weddings === data.lineage.gen2Weddings && !L.kin,
        detail: `${L.people.filter((x) => x.g >= 2).length} kasabalı · ${L.families} ocak · ilk 2. kuşak düğünü ${L.first ? `${L.first.a} & ${L.first.b}` : '-'}`,
      });
    }
  }
  // (25.3) mizaç
  {
    const T = r.loaded.temper;
    const savedQ = new Map(data.characters.map((c) => [c.id, c.quirk]));
    const kept = T.quirks.every(([id, q]) => !savedQ.get(id) || savedQ.get(id) === q);
    if (data.version < 26) {
      results.push({
        name: `${tag}: huylar aynen korundu (yoksa dört kuruluş huyundan), yeni nesil huy, huy kaynağı ve mizaç sayacı yok`,
        ok: T.valid && kept && T.generation === 0 && T.origins.length === 0 && T.quirks.every(([, q]) => T.classic.includes(q)) && T.state === JSON.stringify({ developed: 0, family: 0, mentor: 0, craft: 0, self: 0, auraMinutes: 0, petitions: {} }),
        detail: `${T.quirks.length} sakin`,
      });
    } else {
      const savedO = new Map(data.characters.filter((c) => c.quirkOrigin).map((c) => [c.id, JSON.stringify(c.quirkOrigin, ['kind', 'fromId', 'fromName', 'day'])]));
      results.push({
        name: `${tag}: yeni nesil huylar, huy kaynakları ve mizaç sayaçları korundu`,
        ok: T.valid && kept && T.generation === data.characters.filter((c) => ['craftsman', 'entrepreneur', 'philosopher', 'festive'].includes(c.quirk)).length && (data.version >= 37 || T.generation > 0) && T.origins.length === savedO.size && T.origins.every(([id, o]) => savedO.get(id) === o) && JSON.parse(T.state).developed === data.temperament.developed && JSON.parse(T.state).family === data.temperament.family,
        detail: `${T.generation} yeni nesil huylu · ${T.origins.length} kaynaklı · ${T.state}`,
      });
    }
  }
  // (25.2) Usta-Çırak
  {
    const P = r.loaded.appr;
    if (data.version < 25) {
      results.push({ name: `${tag}: çırak yok, Çırak Kapıları kapalı, sayaçlar boş`, ok: P.list.length === 0 && P.state === JSON.stringify({ open: [], enrolled: 0, graduated: 0, masters: 0, crafted: 0, sold: 0, coins: 0, minutes: 0, grandmasters: 0, grandmasterSaved: 0 }) && r.apprAfter.n === 0 });
    } else {
      const saved = new Map(data.characters.filter((c) => c.apprenticeship).map((c) => [c.id, JSON.stringify(c.apprenticeship)]));
      results.push({
        name: `${tag}: çıraklar, ustaları, ilerlemeleri, açık kapılar ve sayaçlar korundu`,
        ok: P.list.length === saved.size && P.list.length > 0 && P.list.every((x) => x.youth && saved.get(x.id) === x.a) && P.state === JSON.stringify({ ...data.apprenticeship, grandmasters: data.apprenticeship.grandmasters ?? 0, grandmasterSaved: data.apprenticeship.grandmasterSaved ?? 0 }), // (28.2) v33'ten eski kayıtlarda Başusta sayaçları 0 gelir
        detail: `${P.list.length} çırak · ${data.apprenticeship.open.length} açık kapı · ${data.apprenticeship.crafted} çırak işi`,
      });
    }
    results.push({ name: `${tag}: bir gün sonra çıraklık verisi geçerli (Genç, yapısı var, ilerleme 0-100)`, ok: r.apprAfter.ok, detail: `${r.apprAfter.n} çırak` });
  }
  // (24.2) katma değerli üretim
  {
    const F = r.loaded.refinery;
    const items = (d) => d.characters.reduce((n, c) => n + (c.inventory ?? []).filter((x) => x.kind === 'garment' || x.kind === 'sherbetJug').length, 0);
    if (data.version < 22) {
      results.push({
        name: `${tag}: Kumaş / Fıçı Şerbeti 0, hanlarda fıçı yok, tezgâh / şerbethane ve yeni çanta eşyası yok`,
        ok: F.cloth === 0 && F.sherbet === 0 && F.looms === 0 && F.breweries === 0 && F.innCasks.split(',').every((v) => v === '' || v === '0') && F.otherCasks === 0 && F.items === 0,
        detail: `hanlar ${F.innCasks || '-'}`,
      });
    } else {
      results.push({
        name: `${tag}: Kumaş / Fıçı Şerbeti, tezgâh ve şerbethane, handaki fıçılar ve çanta eşyaları korundu`,
        ok: F.cloth === data.resources.cloth && F.sherbet === data.resources.sherbet && F.looms === data.buildings.filter((b) => b.type === 'loom').length && F.breweries === data.buildings.filter((b) => b.type === 'brewery').length && F.innCasks === data.buildings.filter((b) => b.type === 'inn').map((b) => b.sherbet).join(',') && F.otherCasks === 0 && F.items === items(data),
        detail: `kumaş ${F.cloth} · fıçı ${F.sherbet} · hanlar ${F.innCasks} · eşya ${F.items}`,
      });
    }
  }
  results.push({ name: `${tag}: meslek kıyafetleri deneyimden giyildi`, ok: r.outfitsOk, detail: `${r.outfits} sakin kıyafetli` });
  results.push({ name: `${tag}: harita farkları birebir uygulandı`, ok: r.loaded.terrain === data.terrain.length, detail: `${r.loaded.terrain}/${data.terrain.length} karo` });
  if (!data.map) results.push({ name: `${tag}: eski 48x48 biyomsuz harita`, ok: r.loaded.map.width === 48 && r.loaded.map.height === 48 && r.loaded.map.generator === 1, detail: JSON.stringify(r.loaded.map) });
  if (data.buildings.some((b) => b.type === 'lamp')) results.push({ name: `${tag}: Sokak Lambası Sokak Feneri'ne çevrildi`, ok: !r.loaded.types.includes('lamp') && r.loaded.types.includes('lantern') });
  if (data.buildings.some((b) => b.project)) results.push({ name: `${tag}: yarım kalan proje iş emriyle sürer`, ok: r.loaded.projects.length > 0 && r.loaded.projects.every((p) => p.job), detail: `${r.loaded.projects.length} proje` });
  results.push({ name: `${tag}: açıldı`, ok: r.loaded.pop === data.characters.length && r.loaded.buildings >= data.buildings.length, detail: `gün ${r.loaded.day}, ${r.loaded.pop} sakin, ${r.loaded.buildings} yapı` });
  results.push({ name: `${tag}: bir gün yaşadı`, ok: r.after.day === r.loaded.day + 1, detail: `gün ${r.after.day}, ${r.after.pop} sakin` });
  results.push({ name: `${tag}: yaban hayatı yerleşti`, ok: r.wild > 0, detail: `${r.wild} yaban, ${r.pets} evcil` });
  if (data.version < 9) results.push({ name: `${tag}: fermanlar boş başlar`, ok: r.civic.storageLevel === 0 && !r.civic.craftGuild });
  else results.push({ name: `${tag}: fermanlar korundu`, ok: r.civic.storageLevel === (data.civic.storageLevel ?? 0) && r.civic.craftGuild === Boolean(data.civic.craftGuild), detail: `depo kademesi ${r.civic.storageLevel}` });
  if (data.version < 10) {
    results.push({
      name: `${tag}: araştırma, liman ve hazine boş başlar (hazinede yalnızca iç vergiden gelen altın)`,
      ok: r.research.active === null && Object.keys(r.research.done).length === 0 && r.trade.shipments === 0 && r.gold <= r.taxGold && r.academy === 0 && r.civic.expeditionsSinceTalisman >= 0,
    });
  } else {
    results.push({
      name: `${tag}: araştırmalar, hazine ve harika korundu`,
      ok: Object.keys(r.research.done).length === Object.keys(data.research.done).length && r.gold >= data.resources.gold && r.wonderStage === Math.max(...data.buildings.filter((b) => b.type === 'wonder').map((b) => b.wonderStage), 0),
      detail: `${Object.keys(r.research.done).length} araştırma, ${r.gold} altın, harika aşaması ${r.wonderStage}`,
    });
  }
  if (data.version < 11) {
    results.push({
      name: `${tag}: yadigâr, sabit işçi boş; arşiv kuruldu; düğün sayacı tahmin edildi`,
      ok: Object.keys(r.luxury.relics).length === 0 && !r.luxury.silk && r.pinned === 0 && r.history >= 1 && r.weddings >= Math.floor(r.married / 2), // (29.2b) kayıttaki bir bilge doğal vefat ederse evli sayısı düşer, düğün sayacı düşmez
      detail: `arşiv ${r.history} gün, düğün ${r.weddings}`,
    });
  } else {
    results.push({
      name: `${tag}: yadigârlar ve arşiv korundu`,
      ok: Object.keys(r.luxury.relics).length === Object.keys(data.luxury.relics).length && r.history >= data.history.length,
      detail: `${Object.keys(r.luxury.relics).length} yadigâr, arşiv ${r.history} gün`,
    });
  }
  results.push({
    name: `${tag}: her sakine anı defteri açıldı, festival ve hava geçerli`,
    ok: r.memories.every((n) => n >= 1) && (r.festivalStage === null || r.festivalStage === 'announced' || r.festivalStage === 'active') && typeof r.weather === 'string',
    detail: `anı ${Math.min(...r.memories)}-${Math.max(...r.memories)}, hava ${r.weather}`,
  });
  results.push({ name: `${tag}: olay takvimi kuruldu`, ok: Number.isFinite(r.dilemma), detail: `ilk olay günü ${r.dilemma}` });
  if (data.version < 8) {
    results.push({ name: `${tag}: seviye sessizce belirlendi`, ok: r.after.assessed && (r.log.includes('town:tierAssessed') || r.after.tier === 1), detail: `${r.title} · ${r.log.join(', ')}` });
  } else {
    results.push({ name: `${tag}: seviye korundu`, ok: r.after.tier === data.town.tier, detail: r.title });
  }
}
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
