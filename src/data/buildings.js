// Kasaba yapılarının kuralları (görselden bağımsız). Görseller: src/art/sprites/structures.js
// (8. aşamanın Seviye 2 yapıları ve harabeleri: src/art/sprites/structuresTier2.js; 10. aşamanın ağılı,
// değirmeni, madeni ve belediyesi: structuresFarm.js, structuresIndustry.js, structuresCivic.js)
import { GROUND_TILES } from './tiles.js';
//
//   size        : kapladığı karo sayısı (bu karolar yürünemez ve inşa edilemez)
//   spots       : karakterlerin yapıyı kullanırken durduğu yerler
//                 'ring'     -> yapının çevresindeki karolar (havuz, ateş başı, bahçe)
//                 'adjacent' -> dört yandaki karolar (çalıya uzanmak)
//                 'self'     -> yapının kendi karosu (bankta oturmak)
//                 'door'     -> kapı önündeki karolar (eve / kilere girmek)
//                 'front'    -> yapının hemen önündeki (güney) karolar (oduncu)
//                 'none'     -> kullanılmaz (fener)
//   capacity    : (ev) kaç kişi barınabilir
//   seat        : (bank) oturan karakterin ayaklarının konumu
//   litHours    : (ateş) yandığı saat aralığı; to < from ise gece yarısını geçer
//   maxBerries / regrowHours : (çalı) taşıyabileceği porsiyon ve bir porsiyonun yenilenme süresi
//
// İnşa edilebilir yapılar ek olarak:
//   buildable, category, description, cost, buildWork (oyun dakikası × işçi),
//   allowedTiles (varsayılan GROUND_TILES: çimen ve biyom zeminleri), demolishable
//   workers / production / workActivity : üretim binası
//   storageBonus : depo kapasitesine eklenen miktar
//   funAura      : { radius, perMinute } yanından geçenin / dinlenenin keyfi (litHours varsa yalnızca yanarken)
//   production.rainBonus : yağmurda üretime eklenen oran (bahçe)
//   production.seasonal  : verimi mevsimin bu alanıyla çarpılır (bahçe: 'farm'; kışın 0 = donar)
//   requires     : { nearObjects, radius, min, reason } yakında şu doğal nesneler olmalı (taş ocağı)
//   placement    : 'shore' -> nehir kıyısına, kumla suyun birleştiği yere kurulur (iskele)
//   workPoint / workFacing : (iskele) çalışanın duracağı nokta ve baktığı yön; yapının sol üstüne göre
//                 piksel, 'orientation' sol ise yatayda aynalanır
//   sortLine     : yapının derinlik sıralama çizgisi (üstten piksel); ayakları basılabilen yapılar için
//   workPoints   : (taş ocağı) birden çok çalışanın duracağı noktalar; workPoint'in çoğul hâli
//   requiresBuilding : { type, reason } kasabada önce bu yapının tamamlanmış olması gerekir (pazar -> kiler)
//   gatherSpots  : 'terrace' -> sohbet edenler yapının önündeki iki sırada toplanır (han)
//   (han, litHours boyunca yanarken akşam toplanma yeri olarak açıktır)
//   kitchen      : { perHour, foodPerMeal, capacity } aşçının ham yiyecekten sıcak yemek pişirmesi (han)
//   unique       : kasabada yalnızca bir tane kurulabilir (anıt)
//   prestige     : { happinessBonus, funDecay } tamamlanınca kalıcı kasaba bonusu (anıt)
//   funAura.energyPerMinute : (kadim çeşme) yanındakilerin enerjisi de dolar
//   crafting     : { recipes } zanaatkâr stoktan kaynak harcayıp kişisel ekipman üretir (zanaat atölyesi;
//                  tarifler data/equipment.js'te)
//   chimney      : { x, y } çalışırken tüten ocak bacasının görsel üstündeki yeri (zanaat atölyesi)
//
// 10. aşama — üretim zincirleri, hayvancılık ve kasaba seviyesi:
//   production.extra : { kaynak: saatlik } ana ürünün yanında aynı verimle gelen yan ürün (ağılda yiyecek,
//                      madende taş)
//   processing   : { perHour, input, output } işleme yapısı: çalışan saatte perHour kez stoktan input'u alıp
//                  output'u üretir (değirmen: 1 yiyecek -> 1 ekmek). Malzeme yoksa ya da depo doluysa boşta kalır
//   flock        : { sheep, lambSeasons } ağılda dolaşan koyun sayısı ve kuzuların görüldüğü mevsimler (görsel)
//   requires.biome : { tile, min } yakında yeterli nesne yoksa ayak izinde en az min karo bu biyomsa da olur
//                  (demir madeni: kayalık tepe ya da kayaların yanı)
//   requiresTier : kasaba bu seviyeye ulaşınca kilidi açılır (data/town.js -> TOWN_TIERS; değirmen Köy,
//                  belediye Kasaba)
//   civic        : { workSpeed } tamamlanınca kasabanın tüm iş ve inşaat hızı çarpanı (belediye); her sabahki
//                  erzak dengesi data/town.js -> TOWN_HALL'da
//
// Seviye 2 (8. aşama) — upgrade: yapı yıkılmadan Yapı Bilgi Paneli'nden geliştirilir:
//   { name, description, cost, buildWork, capacity?, workers?, productionBonus?, seasonalFloor?,
//     heatingFactor?, sleepFunPerMinute? }
//   productionBonus : üretime eklenen oran (0,4 = +%40)
//   seasonalFloor   : mevsim verimi bunun altına düşmez (sera kışın %60, atölye karda %70)
//   heatingFactor   : kışın yakılan odun çarpanı (taş ev 0,7 = %30 daha az)
//   sleepFunPerMinute : içinde uyuyanın keyfi dakikada bu kadar artar ("mutlu uyanır")
//
// Kadim harabeler (8. aşama) — ruin: haritada yıkık hâlde bulunur, onarılınca asıl yapıya dönüşür:
//   { name, description, cost, buildWork, biomes, treasure? }
//   biomes   : harita üretilirken tercih ettiği biyomlar
//   treasure : onarılınca bir kez çıkan kaynak hazinesi
//   townBonus: { happiness } onarılmış yapının kasaba refahına kalıcı katkısı (gözetleme kulesi)
export const BUILDINGS = {
  cabin: {
    name: 'Kulübe',
    size: { w: 2, h: 2 },
    spots: 'door',
    capacity: 2,
    doorTiles: [
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
    ],
    entrance: { x: 16, y: 30 },
    buildable: true,
    demolishable: true,
    category: 'Konut',
    description: '2 kişilik ev. Boş yatak olunca ertesi sabah 08:00\'de yeni bir sakin gelir.',
    cost: { wood: 25, stone: 10 },
    buildWork: 180,
    upgrade: {
      name: 'Taş Ev',
      description: 'İki katlı, kiremit çatılı taş ev. 4 kişilik; yalıtımlı olduğu için kışın %30 daha az odun yakar, içinde uyuyanlar keyifle uyanır.',
      cost: { wood: 20, stone: 25 },
      buildWork: 180,
      capacity: 4,
      heatingFactor: 0.7,
      sleepFunPerMinute: 0.05,
    },
  },
  lumberHut: {
    name: 'Oduncu Kulübesi',
    size: { w: 2, h: 2 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description: 'Gündüz burada çalışan bir sakin yakındaki ağaçlardan düzenli odun üretir.',
    cost: { wood: 20, stone: 10 },
    buildWork: 150,
    workers: 1,
    workActivity: 'lumber',
    // Verim, çevredeki (radius karo) ağaç sayısı ideal'e ulaşınca tamdır
    production: { resource: 'wood', perHour: 3, needsTrees: { radius: 8, ideal: 6 }, seasonal: 'lumber' },
    upgrade: {
      name: 'Kereste Atölyesi',
      description: 'Hızar tezgâhlı gelişmiş atölye: 2 çalışan, odun üretimi +%40; karda verim %70\'in altına düşmez.',
      cost: { wood: 20, stone: 20 },
      buildWork: 160,
      workers: 2,
      productionBonus: 0.4,
      seasonalFloor: 0.7,
    },
  },
  garden: {
    name: 'Sebze Bahçesi',
    size: { w: 3, h: 3 },
    spots: 'ring',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description: 'Lahana, havuç ve domates yetişen bahçe. Çalışan sakin düzenli yiyecek üretir.',
    cost: { wood: 15, stone: 5 },
    buildWork: 120,
    workers: 1,
    workActivity: 'farm',
    production: { resource: 'food', perHour: 5, rainBonus: 0.25, seasonal: 'farm' },
    upgrade: {
      name: 'Cam Sera',
      description: 'Cam çatılı sera: kışın donmaz, kar yağarken bile %60 verimle taze yiyecek üretir.',
      cost: { wood: 25, stone: 30 },
      buildWork: 180,
      seasonalFloor: 0.6,
    },
  },
  quarry: {
    name: 'Taş Ocağı',
    size: { w: 3, h: 3 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description: 'Kayalık bir alanın yakınında kurulur. Çalışanlar düzenli taş çıkarır; açık kayalar bitse de taş akar.',
    cost: { wood: 35, stone: 15 },
    buildWork: 220,
    workers: 2,
    workActivity: 'quarry',
    production: { resource: 'stone', perHour: 3 },
    upgrade: {
      name: 'Derin Maden Ocağı',
      description: 'Güçlendirilmiş vinç, raylar ve maden vagonu: taş üretimi +%50.',
      cost: { wood: 30, stone: 20 },
      buildWork: 220,
      productionBonus: 0.5,
    },
    // Çalışanlar ocağın önünden içeri iner ve kaya yüzüne dönük kazma sallar
    workPoints: [
      { x: 14, y: 31 },
      { x: 30, y: 31 },
    ],
    workFacing: 'up',
    sortLine: 29,
    requires: {
      nearObjects: ['rock', 'pebbles'],
      radius: 7,
      min: 2,
      reason: 'Kayalık bir alana yakın olmalı (7 karo içinde en az 2 kaya)',
    },
  },
  fishingPier: {
    name: 'Balıkçı İskelesi',
    size: { w: 2, h: 2 },
    spots: 'pier',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description: 'Nehir kıyısına kurulur. Çalışan olta atar ve düzenli yiyecek getirir; geceleri feneri yanar.',
    cost: { wood: 30, stone: 5 },
    buildWork: 140,
    allowedTiles: ['sand', 'water'],
    placement: 'shore',
    workers: 1,
    workActivity: 'fish',
    workPoint: { x: 27, y: 19 },
    workFacing: 'right',
    sortLine: 8,
    litHours: { from: 18.5, to: 6.5 },
    production: { resource: 'food', perHour: 4, seasonal: 'fishing' },
  },
  flowerBed: {
    name: 'Çiçek Tarhı',
    size: { w: 2, h: 2 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description: 'Rengârenk bir park köşesi. Yanından geçenlerin ve etrafında dinlenenlerin keyfi yerine gelir.',
    cost: { wood: 8, stone: 2 },
    buildWork: 50,
    funAura: { radius: 38, perMinute: 0.07 },
  },
  inn: {
    name: 'Kasaba Hanı',
    size: { w: 3, h: 3 },
    spots: 'door',
    doorTiles: [{ dx: 1, dy: 3 }],
    entrance: { x: 24, y: 46 },
    buildable: true,
    demolishable: true,
    category: 'Sosyal',
    description:
      'Aşçısı ham yiyeceği sıcak yemeğe çevirir: burada yiyenler çabuk doyar, keyiflenir ve bir süre yavaş acıkır. Akşamları kasabanın buluşma yeridir.',
    cost: { wood: 45, stone: 25 },
    buildWork: 260,
    workers: 1,
    workActivity: 'cook',
    kitchen: { perHour: 6, foodPerMeal: 1, capacity: 20 },
    gatherSpots: 'terrace',
    litHours: { from: 17, to: 1 },
  },
  workshop: {
    name: 'Zanaat Atölyesi',
    size: { w: 3, h: 2 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Zanaat',
    description:
      'Zanaatkâr kişisel ekipman üretir: demir ve odundan Sağlam Alet, yünden Kışlık Palto ve Sırt Çantası. Kasabada henüz demir ya da yün üreten yapı yoksa eski usulle odun, taş ve yiyecekten yapar. Boşta kalan ekipmanı en çok ihtiyacı olan sakin gelip kuşanır.',
    cost: { wood: 25, stone: 20 },
    buildWork: 180,
    workers: 1,
    workActivity: 'craft',
    workFacing: 'up',
    crafting: { recipes: ['sturdyTool', 'winterCoat', 'backpack'] },
  },
  // --- 10. aşama: üretim zincirleri ve hayvancılık ---
  sheepFarm: {
    name: 'Koyun Ağılı',
    size: { w: 3, h: 3 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Hayvancılık',
    description:
      'Çitle çevrili ağılda koyunlar otlar. Çoban düzenli yün (kumaş malzemesi) ve biraz süt-peynir (yiyecek) getirir. İlkbaharda kırkım bereketlidir; kışın koyunlar ahırda daha az yün verir.',
    cost: { wood: 30, stone: 8, food: 10 },
    buildWork: 170,
    workers: 1,
    workActivity: 'herd',
    // Çoban ağılın kapısının önünde, koyunlara dönük durur
    workPoints: [{ x: 24, y: 52 }],
    workFacing: 'up',
    production: { resource: 'wool', perHour: 2, extra: { food: 1 }, seasonal: 'pasture' },
    flock: { sheep: 4, lambSeasons: ['spring'] },
  },
  mill: {
    name: 'Yel Değirmeni ve Fırın',
    size: { w: 3, h: 3 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description:
      'Rüzgârla dönen yelkenli taş değirmen ve taş fırın. Fırıncı bahçelerden gelen yiyeceği una, unu sıcak ekmeğe çevirir: 1 yiyecek, 2,5 yiyecek değerinde 1 ekmek olur. Kışın da çalışır.',
    cost: { wood: 40, stone: 35 },
    buildWork: 260,
    workers: 1,
    workActivity: 'bake',
    // Fırıncı taş fırının ağzının önünde çalışır
    workPoints: [{ x: 38, y: 51 }],
    workFacing: 'up',
    processing: { perHour: 4, input: { food: 1 }, output: { bread: 1 } },
    requiresBuilding: { type: 'garden', reason: 'Önce bir Sebze Bahçesi tamamlanmalı (değirmen tahıl ister)' },
    requiresTier: 2,
  },
  ironMine: {
    name: 'Demir Madeni',
    size: { w: 3, h: 3 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Üretim',
    description:
      'Kayalık tepeye açılmış derin maden. Madenciler kızıl demir cevheri ve yanında bir miktar taş çıkarır; girişteki fener geceleri yanar.',
    cost: { wood: 40, stone: 20 },
    buildWork: 240,
    workers: 2,
    workActivity: 'mineIron',
    production: { resource: 'iron', perHour: 1.5, extra: { stone: 1 } },
    // Madenciler tünel ağzının iki yanında kaya yüzüne dönük kazma sallar
    workPoints: [
      { x: 13, y: 39 },
      { x: 35, y: 39 },
    ],
    workFacing: 'up',
    sortLine: 37,
    litHours: { from: 18.5, to: 6.5 },
    requires: {
      nearObjects: ['rock', 'pebbles'],
      radius: 6,
      min: 3,
      biome: { tile: 'rocky', min: 3 },
      reason: 'Kayalık Tepe biyomuna ya da kayaların yanına kurulmalı (6 karo içinde en az 3 kaya / çakıl)',
    },
  },
  townHall: {
    name: 'Belediye Konağı',
    size: { w: 3, h: 3 },
    spots: 'door',
    doorTiles: [{ dx: 1, dy: 3 }],
    entrance: { x: 24, y: 47 },
    buildable: true,
    demolishable: true,
    unique: true,
    category: 'Yönetim',
    description:
      'Saat kuleli, sütunlu görkemli meydan konağı. Bürokrasiyi düzene sokar: kasabanın tüm iş ve inşaat verimi +%15. Her sabah vergi ve erzak defterini tutar, bolca olan temel kaynağın bir kısmını azalan kaynağa aktarır.',
    cost: { wood: 60, stone: 80, iron: 8 },
    buildWork: 420,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    requiresTier: 3,
    civic: { workSpeed: 1.15 },
    townBonus: { happiness: 3 },
  },
  market: {
    name: 'Pazar Yeri',
    size: { w: 3, h: 2 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Ticaret',
    description: 'Renkli tenteli tezgâh. İki üç günde bir gezgin tüccar gelir; ona tıklayıp takas edebilirsin.',
    cost: { wood: 40, stone: 15 },
    buildWork: 160,
    requiresBuilding: { type: 'storage', reason: 'Önce kasabada bir Kiler tamamlanmalı' },
  },
  storage: {
    name: 'Kiler',
    size: { w: 3, h: 2 },
    spots: 'door',
    doorTiles: [{ dx: 1, dy: 2 }],
    entrance: { x: 24, y: 30 },
    buildable: true,
    demolishable: true,
    category: 'Depolama',
    description: 'Depo kapasitesini artırır. Toplanan malzeme buraya taşınır, acıkanlar burada yer.',
    cost: { wood: 30, stone: 20 },
    buildWork: 200,
    storageBonus: 100,
  },
  bench: {
    name: 'Ahşap Bank',
    size: { w: 1, h: 1 },
    spots: 'self',
    seat: { x: 8, y: 13 },
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description: 'Sakinlerin oturup dinlendiği bank.',
    cost: { wood: 4 },
    buildWork: 20,
    allowedTiles: [...GROUND_TILES, 'plaza'],
  },
  lantern: {
    name: 'Sokak Feneri',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description: 'Kıvrık direkli şirin fener. 19:00-06:00 arası sıcak sarı bir ışık halkası yayar, gece yanından geçenlerin keyfini korur.',
    cost: { wood: 1, stone: 1 },
    buildWork: 15,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    litHours: { from: 19, to: 6 },
    funAura: { radius: 44, perMinute: 0.07 },
  },
  monument: {
    name: 'Kasaba Anıtı',
    size: { w: 2, h: 2 },
    spots: 'ring',
    buildable: true,
    demolishable: true,
    unique: true,
    category: 'Prestij',
    description: 'Görkemli mermer heykel. Kasabada yalnızca bir tane olur; tamamlanınca refaha kalıcı bonus verir, sakinler önünde gururla durur.',
    cost: { wood: 40, stone: 40 },
    buildWork: 320,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    funAura: { radius: 56, perMinute: 0.05 },
    // Kalıcı prestij: kasaba refahına eklenen puan ve keyif azalma çarpanı (systems/TownStatus.js)
    prestige: { happinessBonus: 6, funDecay: 0.88 },
  },
  fountain: {
    name: 'Süs Havuzu',
    size: { w: 2, h: 2 },
    spots: 'ring',
  },
  // --- Kadim harabeler (8. aşama): haritada yıkık bulunur, Yapı Bilgi Paneli'nden onarılır ---
  watchtower: {
    name: 'Gözetleme Kulesi',
    size: { w: 2, h: 2 },
    spots: 'ring',
    demolishable: false,
    category: 'Kadim Yapı',
    description: 'Onarılmış taş kule. Tepesindeki fener geceleri çevresini aydınlatır; kasaba ona bakıp güven duyar.',
    litHours: { from: 18, to: 6 },
    funAura: { radius: 48, perMinute: 0.05 },
    townBonus: { happiness: 4 },
    ruin: {
      name: 'Yıkık Gözetleme Kulesi',
      description: 'Yosun tutmuş, yarısı çökmüş eski bir taş kule. Onarılırsa kasabaya kalıcı refah verir, geceleri çevresini aydınlatır.',
      cost: { wood: 25, stone: 30 },
      buildWork: 240,
      biomes: ['rocky'],
    },
  },
  supplyCamp: {
    name: 'Erzak Kampı',
    size: { w: 2, h: 2 },
    spots: 'ring',
    demolishable: false,
    category: 'Kadim Yapı',
    description: 'Onarılmış erzak kampı: küçük bir depo (+40 kapasite) ve uzak yollarda yorulanların dinlendiği mola yeri.',
    storageBonus: 40,
    ruin: {
      name: 'Terk Edilmiş Erzak Kampı',
      description: 'Çökmüş bir çadır, kırık sandıklar ve devrik fıçılar. İçinde hâlâ bir şeyler var gibi: onarılınca büyük bir erzak hazinesi çıkar.',
      cost: { wood: 15, stone: 10 },
      buildWork: 150,
      biomes: ['forest'],
      treasure: { wood: 35, stone: 25, food: 30 },
    },
  },
  ancientFountain: {
    name: 'Kadim Çeşme',
    size: { w: 2, h: 2 },
    spots: 'ring',
    demolishable: false,
    category: 'Kadim Yapı',
    description: 'Şırıl şırıl akan berrak, büyülü su. Yanına gelenlerin keyfi ve enerjisi çok hızlı dolar.',
    funAura: { radius: 40, perMinute: 0.12, energyPerMinute: 0.1 },
    ruin: {
      name: 'Kurumuş Kadim Çeşme',
      description: 'Çatlak, yosunlu, kupkuru bir taş çeşme. Onarılırsa yeniden akar ve yanına gelenleri tazeler.',
      cost: { wood: 15, stone: 35 },
      buildWork: 220,
      biomes: ['forest', 'meadow'],
    },
  },
  campfire: {
    name: 'Kamp Ateşi',
    size: { w: 1, h: 1 },
    spots: 'ring',
    litHours: { from: 17, to: 2 },
  },
  berryBush: {
    name: 'Böğürtlen Çalısı',
    size: { w: 1, h: 1 },
    spots: 'adjacent',
    maxBerries: 3,
    regrowHours: 3,
    // Toplama emri: her porsiyon bu kadar iş ve bu kadar yiyecek
    harvest: { job: 'forage', workPerBerry: 8, yieldsPerBerry: { food: 4 } },
  },
};

// Zemine anında döşenen yapılar (şantiye kurulmaz). Fırçayla sürüklenerek boyanır.
export const TILE_BUILDS = {
  path: {
    name: 'Toprak Yol',
    category: 'Zemin',
    description: 'Sakinler yollarda daha hızlı yürür ve yolları tercih eder.',
    cost: {},
    allowedTiles: GROUND_TILES,
    result: 'path',
  },
  bridge: {
    name: 'Ahşap Köprü',
    category: 'Zemin',
    description: 'Suyun üzerinden geçit açar.',
    cost: { wood: 2 },
    allowedTiles: ['water'],
    result: 'bridge',
  },
  stonePath: {
    name: 'Taş Yol',
    category: 'Zemin',
    description: 'Arnavut kaldırımı: toprak yoldan şık, üzerinde %15 daha hızlı yürünür. Toprak yolun üstüne de döşenir.',
    cost: { stone: 1 },
    allowedTiles: [...GROUND_TILES, 'path'],
    result: 'cobble',
  },
};

// Kaldırılınca zeminin döneceği karo (taş yol toprak yola, köprü suya döner; toprak yol çimene ya da
// harita üretildiğinde orada olan biyom zeminine — bkz. ConstructionSystem.demolishAt)
export const TILE_REMOVAL = { bridge: 'water', cobble: 'path', path: 'grass' };

// İnşa menüsündeki sıra
export const BUILD_MENU = [
  'path',
  'stonePath',
  'bridge',
  'cabin',
  'lumberHut',
  'quarry',
  'ironMine',
  'garden',
  'sheepFarm',
  'mill',
  'fishingPier',
  'storage',
  'inn',
  'workshop',
  'market',
  'townHall',
  'flowerBed',
  'bench',
  'lantern',
  'monument',
];

/** Bir menü öğesinin tanımı (yapı ya da zemin). */
export function getBuildDefinition(type) {
  return BUILDINGS[type] ?? TILE_BUILDS[type] ?? null;
}

// Kaldırılan yapı türlerinin yerini alanlar. Eski kayıtlar yüklenirken (state/SaveManager.js)
// bu türler yenisine çevrilir; ör. 1-6. aşamanın "Sokak Lambası" artık Sokak Feneri'dir.
export const LEGACY_BUILDING_TYPES = {
  lamp: 'lantern',
};

// Haritada yıkık bulunan kadim yapılar (harita üretici bu sırayla yerleştirir)
export const RUIN_TYPES = ['watchtower', 'supplyCamp', 'ancientFountain'];
