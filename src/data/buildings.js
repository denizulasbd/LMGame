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
//                  erzak dengesi data/town.js -> TOWN_HALL'da, belediye fermanları data/town.js -> CIVIC_PROJECTS'te
//
// 11. aşama — sağlık:
//   apothecary   : { herbsPerHour, brewPerHour, herbsPerRemedy, maxHerbs, maxRemedies, natureRadius, natureIdeal }
//                  şifacı doğadan (yakındaki ağaç ve çiçek tarlası) şifalı ot toplar, kulübede iksir ve merhem
//                  hazırlar; hasta sakinler gelip bir iksirle iyileşir (data/health.js). Çevresinde ağaç azsa ot
//                  toplamak yavaşlar (natureIdeal ağaçta tam hız)
//
// 12. aşama — bilgi, ticaret ve harika:
//   academy      : Bilgelik Evi: Bilge araştırma yapar (data/research.js), çocuklar ders dinler
//   placement 'harbor' : nehir kıyısına; ayak izinin kara yanı kum, kalanı su ve suyun ötesinde teknelerin
//                  geçeceği açık bir su şeridi olmalı (ihracat teknesi oraya yanaşır; data/trade.js -> EXPORT)
//   wonder       : { stages: [{ name, description, cost, work }] } çok aşamalı harika: ilk aşama şantiye olarak
//                  kurulur, sonrakiler Yapı Bilgi Paneli'nden başlatılır (project 'stage'); son aşama bitince
//                  townBonus, light ve warmRadius etkin olur (systems/TownStatus.js, HeatingSystem.js)
//   (DAMAGEABLE_TYPES) fırtınada ya da kurt saldırısında hasar alabilen yapılar; hasarlı yapı onarılana kadar
//                  çalışmaz (bkz. data/dilemmas.js -> STORM)
//
// 13. aşama — peyzaj ve süsleme:
//   walkable     : sakinler yapının karosundan geçebilir (Mermer Kemer; yolun üstüne de kurulur). Yapı karoyu
//                  kaplar ama yürünebilirliği bozmaz; altındaki yol / zemin olduğu gibi kalır
//   gazebo       : { seats: [{ x, y }] } Çardak: önündeki iki karodan içeri girilip banklara oturulur; çiftlerin ve
//                  dostların sevdiği sohbet köşesi (data/activities.js -> gazebo)
//   connects     : (Çiçekli Çit) yanındaki aynı türden çitlerle görsel olarak birleşir
//   seasonalFoliage : (Kiraz Ağacı) dört mevsim kendi görünümü ve rüzgârda dökülen yaprakları vardır
//
// 18. aşama — serbest imar ve peyzaj (kurallar data/landscape.js, mantık systems/LandscapeSystem.js):
//   connects     : true -> aynı türle, 'grup' -> aynı gruptaki türlerle birleşir (ahşap çit + çit kapısı)
//   brush        : inşa aracında sürükleyerek art arda dikilir (çit, saksı, fidan); tek tek bildirim çıkmaz
//   seatBench    : oturulabilen bank (park bankı; ahşap bank gibi)
//   ornamentalTree : { foliage } süs fidanı: dikildikten sonra iki günde büyür, ulu ağacın gölgesinde dinlenilir
//   grownName    : büyüyünce aldığı ad (Huş Fidanı -> Huş Ağacı)
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
  // --- 11. aşama: sağlık ---
  healerHut: {
    name: 'Şifacı Kulübesi',
    size: { w: 2, h: 2 },
    spots: 'door',
    doorTiles: [
      { dx: 0, dy: 2 },
      { dx: 1, dy: 2 },
    ],
    entrance: { x: 21, y: 31 },
    buildable: true,
    demolishable: true,
    category: 'Sağlık',
    description:
      'Çatısında şifalı otlar kurutulan aktar kulübesi. Şifacı doğadan ot toplar, havanda döverek iksir ve merhem hazırlar. Üşüten sakinler buraya gelip çabucak iyileşir ve "Dinçlik" kazanır. Ormana yakın kurulursa ot toplamak hızlanır.',
    cost: { wood: 30, stone: 15 },
    buildWork: 150,
    workers: 1,
    workActivity: 'brew',
    // Şifacı kulübenin önündeki tezgâhta havan döver
    workPoints: [{ x: 9, y: 36 }],
    workFacing: 'up',
    apothecary: { herbsPerHour: 4, brewPerHour: 1.5, herbsPerRemedy: 2, maxHerbs: 10, maxRemedies: 6, natureRadius: 7, natureIdeal: 6 },
  },
  // --- 12. aşama: Bilgelik Evi, Büyük Ticaret Limanı, Büyük Saat Kulesi ---
  academy: {
    name: 'Bilgelik Evi',
    size: { w: 3, h: 3 },
    spots: 'door',
    doorTiles: [{ dx: 1, dy: 3 }],
    entrance: { x: 24, y: 47 },
    buildable: true,
    demolishable: true,
    category: 'Bilgi',
    description:
      'Kitaplıkları ve gözlem kubbesiyle kasabanın okulu ve kütüphanesi. Bilge burada kalıcı kasaba teknolojileri araştırır; çocuklar ders saatlerinde gelip ders dinler ve büyüyünce bir meslekte doğrudan Kalfa olarak başlar.',
    cost: { wood: 70, stone: 60, wool: 15 },
    buildWork: 320,
    workers: 1,
    workActivity: 'teach',
    academy: true,
    requiresTier: 2,
  },
  harbor: {
    name: 'Büyük Ticaret Limanı',
    size: { w: 3, h: 2 },
    spots: 'pier',
    buildable: true,
    demolishable: true,
    unique: true,
    category: 'Ticaret',
    description:
      'Nehre uzanan büyük taş-ahşap rıhtım, yük vinci ve sandık yığınları. Ticaret tekneleri nehirden süzülüp yanaşır; depoda belirlenen sınırı aşan fazla malları ya da hazırlanan ihracat sandığını yükleyip götürür, karşılığında Kasaba Hazinesi\'ne altın bırakır.',
    cost: { wood: 120, stone: 80, iron: 20 },
    buildWork: 300,
    allowedTiles: ['sand', 'water'],
    placement: 'harbor',
    requiresTier: 3,
    litHours: { from: 18.5, to: 6.5 },
  },
  wonder: {
    name: 'Büyük Vadi Saat Kulesi',
    size: { w: 4, h: 4 },
    spots: 'ring',
    buildable: true,
    demolishable: false,
    unique: true,
    category: 'Harika',
    description:
      'Vadinin her yerinden görünen, saat kuleli taş külliye. Üç aşamada yükselir (Temel, Gövde, Görkemli Kule). Tamamlanınca kasaba altın çağını yaşar: refah +12, geceleri kulesi bir fener gibi vadiyi aydınlatıp ısıtır, saat başı çan çalar.',
    cost: { wood: 200, stone: 300, bread: 80, gold: 300 },
    buildWork: 600,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    requiresTier: 4,
    wonder: {
      stages: [
        { name: 'Temel', description: 'Kesme taş temel ve geniş basamaklar atılır.', cost: { wood: 200, stone: 300, bread: 80, gold: 300 }, work: 600 },
        { name: 'Gövde', description: 'Kemerli taş gövde, demir kuşaklar ve yün kilimli iç salonlar yükselir.', cost: { wood: 150, stone: 400, iron: 150, wool: 80, bread: 120, gold: 800 }, work: 900 },
        { name: 'Görkemli Kule', description: 'Saat kulesi, bronz çan ve altın kubbeli fener tamamlanır.', cost: { stone: 300, iron: 250, wool: 150, bread: 150, gold: 1600 }, work: 1200 },
      ],
      light: { radius: 230 },
      warmRadius: 420, // tamamlanınca bu yarıçaptaki (≈26 karo: kasabanın neredeyse tamamı) dışarıdaki sakinlerin içi ısınır (piksel)
    },
    townBonus: { happiness: 12 },
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
  // --- 13. aşama: peyzaj ve süsleme ---
  cherryTree: {
    name: 'Kiraz Çiçeği Ağacı',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description:
      'Zarif bir süs ağacı: ilkbahar ve yazın pembe çiçekli, sonbaharda altın yapraklı, kışın karlı pembe dallı. Rüzgârda yaprakları savrulur; yanından geçenlerin keyfi biraz yerine gelir.',
    cost: { wood: 12, food: 6, gold: 15 },
    buildWork: 30,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    seasonalFoliage: true,
    funAura: { radius: 26, perMinute: 0.04 },
  },
  gazebo: {
    name: 'Ahşap Çardak',
    size: { w: 2, h: 2 },
    spots: 'front',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description:
      'Sarmaşık ve çiçeklerle örülü, içinde iki bankı olan şirin bir kameriye. Çiftlerin ve dostların en sevdiği sohbet köşesi: burada sohbet edenlerin arkadaşlığı ve aşkı daha hızlı gelişir.',
    cost: { wood: 45, stone: 10, gold: 60 },
    buildWork: 120,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    gazebo: { seats: [{ x: 10, y: 25 }, { x: 22, y: 25 }] },
    funAura: { radius: 30, perMinute: 0.04 },
  },
  marbleArch: {
    name: 'Mermer Kemer',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description: 'Sarmaşıklı beyaz mermer kemer. Yolların ve bahçe girişlerinin üstüne kurulur; sakinler altından geçer.',
    cost: { stone: 20, gold: 30 },
    buildWork: 50,
    allowedTiles: [...GROUND_TILES, 'path', 'cobble', 'plaza'],
    walkable: true,
    sortLine: 7,
  },
  flowerFence: {
    name: 'Çiçekli Çit',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description: 'Beyaz boyalı, saksı çiçekli alçak bahçe çiti. Yan yana kurulan çitler birleşir; bahçe kenarlarını süsler.',
    cost: { wood: 5 },
    buildWork: 15,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES, 'plaza'],
    connects: true,
    funAura: { radius: 18, perMinute: 0.015 },
  },
  lantern: {
    name: 'Ahşap Sokak Feneri',
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
  // --- 18. aşama: serbest imar, peyzaj ve sokak eşyaları (category 'Peyzaj': inşa menüsünün Peyzaj & Dekorasyon sekmesi) ---
  woodFence: {
    name: 'Ahşap Çit',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Kazıklı, iki kuşaklı rustik ahşap çit. Yan yana ve alt alta kurulan çitler (ve çit kapıları) yönüne göre birleşir; bahçeleri, ağılları ve avluları çevreler. Sakinler çitin içinden geçemez: bir Çit Kapısı bırak.',
    cost: { wood: 2 },
    buildWork: 8,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES, 'plaza'],
    connects: 'woodFence',
  },
  fenceGate: {
    name: 'Çit Kapısı',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Ahşap çite takılan iki kanatlı bahçe kapısı. Çitlerle birleşir; sakinler kapıyı itip geçer, yolu kapatmaz.',
    cost: { wood: 4 },
    buildWork: 10,
    allowedTiles: [...GROUND_TILES, 'path', 'cobble', 'plaza'],
    walkable: true,
    connects: 'woodFence',
    sortLine: 12,
  },
  ironLantern: {
    name: 'Demir Sokak Feneri',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Dökme demir direkli, cam fanuslu şık sokak feneri. 18:30-06:30 arası ahşap fenerden daha geniş, yumuşak bir ışık yayar; karanlık sokakta yürüyenlerin ürkmesini önler.',
    cost: { iron: 2, stone: 2 },
    buildWork: 20,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    litHours: { from: 18.5, to: 6.5 },
    funAura: { radius: 56, perMinute: 0.08 },
  },
  signpost: {
    name: 'Mahalle Tabelası',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Ahşap direkli sokak / mahalle tabelası. Üzerine tıklayıp semte bir ad ver; imleçle üzerine gelince adı tabelada okunur, yakınında yürüyenlerin anılarında sokağın adı geçer.',
    cost: { wood: 3 },
    buildWork: 10,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    sortLine: 13,
  },
  parkBench: {
    name: 'Park Bankı',
    size: { w: 1, h: 1 },
    spots: 'self',
    seat: { x: 8, y: 13 },
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Dökme demir ayaklı, sırtlıklı yeşil park bankı. Sakinler oturup manzarayı izler; çiçekli, güzel bir köşedeyse keyifleri çok daha hızlı dolar.',
    cost: { wood: 5, iron: 1 },
    buildWork: 20,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    seatBench: true,
  },
  planter: {
    name: 'Çiçek Saksısı',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Taş çanaklı, rengârenk çiçek arkı. Yanından geçenler çiçek kokusunu içine çeker; sokak kenarlarını ve meydanları süsler.',
    cost: { wood: 1, stone: 2 },
    buildWork: 10,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES, 'plaza'],
    funAura: { radius: 22, perMinute: 0.03 },
  },
  birchTree: {
    name: 'Huş Fidanı',
    grownName: 'Huş Ağacı',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Beyaz gövdeli zarif süs huşu. İki günde büyür; ulu ağacın gölgesinde sakinler dinlenir. Kesilmez, odun vermez.',
    cost: { wood: 2, food: 2 },
    buildWork: 10,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES],
    ornamentalTree: { foliage: 'oak' },
  },
  oakTree: {
    name: 'Meşe Fidanı',
    grownName: 'Süs Meşesi',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Geniş taçlı gölgelik meşe. İki günde büyür; yazın serin gölgesinde sakinler oturup dinlenir, sonbaharda kızıla döner. Kesilmez.',
    cost: { wood: 2, food: 2 },
    buildWork: 10,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES],
    ornamentalTree: { foliage: 'oak' },
  },
  pineTree: {
    name: 'Çam Fidanı',
    grownName: 'Süs Çamı',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Peyzaj',
    description: 'Dört mevsim yeşil kalan süs çamı. İki günde büyür; kışın da yeşil gölgesiyle sokakları güzelleştirir. Kesilmez.',
    cost: { wood: 2, food: 2 },
    buildWork: 10,
    brush: true, // (18. aşama) inşa aracında sürükleyerek art arda dikilir
    allowedTiles: [...GROUND_TILES],
    ornamentalTree: { foliage: 'pine' },
  },
  // (16. aşama) Keşif seferlerinden gelen egzotik ganimetlerle dikilen yapılar (item: harcanan ganimet; kaynak bedeli yok)
  grapeVine: {
    name: 'Üzüm Asması',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description:
      'Seferden gelen egzotik üzüm fidesiyle dikilir; Sebze Bahçesi ya da Ahşap Çardak kenarına kurulur. Yanındaki bahçenin verimi +%10 (en çok iki asma), handa yemek yiyenler soğuk üzüm şerbeti içer, yanından geçenlerin keyfi yerine gelir.',
    cost: {},
    item: 'vineSeed',
    placement: 'nearGarden',
    buildWork: 20,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    funAura: { radius: 28, perMinute: 0.05 },
  },
  ancientTorch: {
    name: 'Kadim Meşale',
    size: { w: 1, h: 1 },
    spots: 'none',
    buildable: true,
    demolishable: true,
    category: 'Süsleme',
    description:
      'Kayıp bir tapınaktan getirilen mistik meşale. 18:00-06:00 arası mavi alevle yanar; yakınındaki herkesin içini ısıtır (kışın üşütmez) ve keyfini yerine getirir.',
    cost: {},
    item: 'ancientTorch',
    buildWork: 15,
    allowedTiles: [...GROUND_TILES, 'plaza'],
    litHours: { from: 18, to: 6 },
    funAura: { radius: 44, perMinute: 0.07 },
    warmAura: { radius: 44 },
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
    name: 'Toprak Patika',
    category: 'Zemin',
    description: 'Sıkıştırılmış toprak patika: sakinler patikayı tercih eder, üzerinde %10 hızlı yürür. Yağmurda çamurlanır. Sürükleyerek kesintisiz çiz.',
    cost: { wood: 1 },
    allowedTiles: GROUND_TILES,
    result: 'path',
  },
  stonePath: {
    name: 'Parke Taş Yol',
    category: 'Zemin',
    description: 'Arnavut kaldırımı parke yol: üzerinde %25 hızlı yürünür, yağmurda çamur olmaz. Toprak patikanın üstüne de döşenir.',
    cost: { stone: 1 },
    allowedTiles: [...GROUND_TILES, 'path'],
    result: 'cobble',
  },
  plazaTile: {
    name: 'Taş Plaka',
    category: 'Zemin',
    description: 'Kesme taş plakalı meydan zemini: en şık döşeme. Çevresine estetik katar, üzerinde %20 hızlı yürünür, çamurlanmaz; banklar, fenerler ve süsler üstüne kurulur.',
    cost: { stone: 2 },
    allowedTiles: [...GROUND_TILES, 'path', 'cobble'],
    result: 'plaza',
  },
  bridge: {
    name: 'Ahşap Köprü',
    category: 'Zemin',
    description: 'Suyun üzerinden geçit açar.',
    cost: { wood: 2 },
    allowedTiles: ['water'],
    result: 'bridge',
  },
};

// (18. aşama) Döşenen zemin -> onu döşeyen fırça (yıkım fırçası harcananın yarısını buradan iade eder)
export const TILE_BUILD_BY_RESULT = Object.fromEntries(Object.entries(TILE_BUILDS).map(([key, def]) => [def.result, key]));

// Kaldırılınca zeminin döneceği karo (taş yol toprak yola, köprü suya döner; toprak yol çimene ya da
// harita üretildiğinde orada olan biyom zeminine — bkz. ConstructionSystem.demolishAt)
export const TILE_REMOVAL = { bridge: 'water', cobble: 'path', path: 'grass', plaza: 'path' };

// İnşa menüsündeki sıra
export const BUILD_MENU = [
  'path',
  'stonePath',
  'plazaTile',
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
  'healerHut',
  'market',
  'harbor',
  'academy',
  'townHall',
  'monument',
  'wonder',
  'woodFence',
  'fenceGate',
  'flowerFence',
  'lantern',
  'ironLantern',
  'signpost',
  'bench',
  'parkBench',
  'planter',
  'flowerBed',
  'birchTree',
  'oakTree',
  'pineTree',
  'cherryTree',
  'marbleArch',
  'gazebo',
  'grapeVine',
  'ancientTorch',
];

/** (18. aşama) Menü öğesinin İnşa sekmesi: 'roads' (zemin fırçaları), 'decor' (süs ve sokak eşyaları), 'buildings'. */
export function buildTabFor(type) {
  if (TILE_BUILDS[type]) return 'roads';
  const category = BUILDINGS[type]?.category;
  return category === 'Süsleme' || category === 'Peyzaj' ? 'decor' : 'buildings';
}

/** Birleşen yapıların (çit) bağlantı grubu: aynı gruptakiler birbirine bağlanır (ahşap çit ile çit kapısı). */
export function connectGroup(type) {
  const c = BUILDINGS[type]?.connects;
  return c ? (c === true ? type : c) : null;
}

/** (18. aşama) Oturulabilen banklar (ahşap bank, park bankı). */
export const BENCH_TYPES = ['bench', 'parkBench'];

/** Bir menü öğesinin tanımı (yapı ya da zemin). */
export function getBuildDefinition(type) {
  return BUILDINGS[type] ?? TILE_BUILDS[type] ?? null;
}

// Fırtınada / kurt saldırısında hasar alabilen yapılar (11. aşama; data/dilemmas.js -> STORM)
export const DAMAGEABLE_TYPES = ['lumberHut', 'garden', 'quarry', 'fishingPier', 'sheepFarm', 'mill', 'ironMine', 'workshop', 'market', 'healerHut'];

// Yapı projelerinin metinleri (yükseltme, harabe onarımı, fırtına onarımı, harika aşaması)
export const PROJECT_WORDS = {
  upgrade: { noun: 'Yükseltme', ing: 'Yükseltiliyor', doing: 'Yükseltiyor', start: 'Yükselt', cancel: 'Yükseltmeyi İptal Et', busy: 'Yükseltme sürüyor' },
  repair: { noun: 'Onarım', ing: 'Onarılıyor', doing: 'Onarıyor', start: 'Onarımı Başlat', cancel: 'Onarımı İptal Et', busy: 'Onarım sürüyor' },
  mend: { noun: 'Onarım', ing: 'Onarılıyor', doing: 'Onarıyor', start: 'Onarımı Başlat', cancel: 'Onarımı İptal Et', busy: 'Onarım sürüyor' },
  stage: { noun: 'Aşama', ing: 'Yükseliyor', doing: 'Harikayı yükseltiyor', start: 'Aşamayı Başlat', cancel: 'Aşamayı İptal Et', busy: 'Aşama sürüyor' },
};

/**
 * Fırtınada hasar gören yapının onarım projesi: yapının maliyetinin bir oranı ve sabit iş (11. aşama).
 * mend: { costRatio, buildWork } (data/dilemmas.js -> STORM.mend)
 */
export function mendSpec(type, mend) {
  const def = BUILDINGS[type];
  const cost = Object.fromEntries(
    Object.entries(def.cost ?? {})
      .map(([r, v]) => [r, Math.max(1, Math.ceil(v * mend.costRatio))])
      .filter(([r]) => r === 'wood' || r === 'stone')
  );
  return { name: def.name, description: 'Fırtınanın kırdığı kirişler, uçan kiremitler ve yıkılan çitler onarılır; yapı yeniden çalışır.', cost, buildWork: mend.buildWork };
}

// Kaldırılan yapı türlerinin yerini alanlar. Eski kayıtlar yüklenirken (state/SaveManager.js)
// bu türler yenisine çevrilir; ör. 1-6. aşamanın "Sokak Lambası" artık Sokak Feneri'dir.
export const LEGACY_BUILDING_TYPES = {
  lamp: 'lantern',
};

// Haritada yıkık bulunan kadim yapılar (harita üretici bu sırayla yerleştirir)
export const RUIN_TYPES = ['watchtower', 'supplyCamp', 'ancientFountain'];
