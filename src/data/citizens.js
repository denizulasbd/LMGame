// (21. aşama) Vatandaşlık katmanı: kişisel kese ve çanta, vatandaş dilekçeleri, Yönetim Güveni, isyan ve yağma.
// Mantık: systems/Citizens.js (saf yardımcılar), PurseSystem.js (yevmiye, çanta, alışveriş), PetitionSystem.js (dilekçeler),
// TrustSystem.js (güven, isyan, yağma, yatıştırma). Bu katman mevcut sistemlerin üstüne eklenir: kasaba hazinesine,
// ekipman yuvalarına (alet, kıyafet, çanta) ve refah hesabına dokunmaz; yalnızca olayları dinler.

// ---------------------------------------------------------------------------
// Kişisel kese (coins)
// ---------------------------------------------------------------------------
// Yevmiyeler kasaba hazinesinden ödenmez: sakinin emeğinin karşılığı olarak keseye "yeni" para girer (gelecekteki
// vergi / haraç sistemlerinin altyapısı). Alışverişte harcanan para da hazineye değil esnafa gider.
export const PURSE = {
  allowance: { adult: 12, child: 3 }, // yeni sakinin ve eski kayıtlardaki sakinlerin başlangıç harçlığı
  wage: {
    shift: 1, // üretim yapısında ya da iş emrinde biten her vardiya
    harvest: 1, // ağaç / kaya / çalı işini bitirene
    build: 2, // şantiyeyi, yükseltmeyi ya da onarımı bitirene
    masterwork: 15, // usta işi eser çıkaran zanaatkâra ödül
  },
  max: 9999, // kesenin üst sınırı (taşmasın)
};

// ---------------------------------------------------------------------------
// Kişisel çanta (inventory): her yuvada tek tür eşya, istiflenir
// ---------------------------------------------------------------------------
// hunger : yenince tokluğa eklenen (birim başına); heal: hastalığın kalan süresini bu oranla kısaltır
// fun    : (hatıra) bakınca keyfe eklenen; kalıcıdır, yenmez
// resource: kasaba deposundaki karşılığı (yağmalanan mallar birebir bu eşyaya dönüşür)
export const ITEMS = {
  bread: { name: 'Ekmek', icon: 'bread', stack: 6, hunger: 30, resource: 'bread', food: true },
  ration: { name: 'Erzak', icon: 'food', stack: 12, hunger: 18, resource: 'food', food: true },
  pie: { name: 'Börek', icon: 'bread', stack: 4, hunger: 35, food: true }, // handan azık
  fruit: { name: 'Meyve', icon: 'apple', stack: 4, hunger: 14, food: true },
  herb: { name: 'Şifalı Ot', icon: 'herb', stack: 3, heal: 0.4 },
  souvenir: { name: 'Hatıra', icon: 'souvenir', stack: 1, fun: 14 },
  firewood: { name: 'Odun Demeti', icon: 'wood', stack: 15, resource: 'wood' },
  // (24.2) Pazar Yeri'nin terzisinden Dayanıklı Giysi (kışın soğuğa karşı korur) ve handan Şerbet Testisi (keyif)
  garment: { name: 'Dayanıklı Giysi', icon: 'cloth', stack: 1 },
  sherbetJug: { name: 'Şerbet Testisi', icon: 'sherbet', stack: 2, fun: 15 },
  // (25.2) Çırak işi: hammadde tüketmeden çıkan küçük yan ürünler (Pazar Yeri'nde value altına satılır); kurabiye yenir
  noviceNails: { name: 'Acemi Çivisi', icon: 'anvil', stack: 6, value: 2, craft: true },
  woodenSpoon: { name: 'Tahta Kaşık', icon: 'wood', stack: 4, value: 2, craft: true },
  herbSachet: { name: 'Ot Kesesi', icon: 'herb', stack: 4, value: 3, craft: true },
  crispCookie: { name: 'Kıtır Kurabiye', icon: 'bread', stack: 6, hunger: 8, value: 2, craft: true, food: true },
  plainCloth: { name: 'Basit Bez', icon: 'cloth', stack: 4, value: 3, craft: true },
  syrupVial: { name: 'Acemi Şerbeti', icon: 'sherbet', stack: 3, value: 3, craft: true },
};
export const ITEM_KEYS = Object.keys(ITEMS);
// Pazarda satılan küçük hatıralar (çantada adıyla görünür)
export const SOUVENIRS = ['Boncuk Kolye', 'Oymalı Tahta At', 'Renkli Mendil', 'Pirinç Yüzük', 'Kuş Düdüğü', 'Desenli Tarak', 'Bakır Bilezik', 'Kurutulmuş Çiçek'];

export const INVENTORY = {
  slots: 4, // çanta yuvası
  backpackSlots: 2, // Sırt Çantası kuşananın ek yuvası (ekipmana dokunulmaz, yalnızca okunur)
  childSlots: 2,
  foodKeep: 2, // en çok bu kadar yiyecek yuvası doldurulur (çanta yiyecekle dolmasın)
};

// İş yerinden pay olarak alınan küçük eşyalar: vardiya bitince olasılıkla; kaynaklıysa kasaba stoğundan düşülür
// (min: stokta bundan az varsa pay alınmaz)
export const SHIFT_SHARES = {
  mill: { item: 'bread', chance: 0.3, from: 'bread', min: 6 },
  garden: { item: 'fruit', chance: 0.25 },
  healerHut: { item: 'herb', chance: 0.3 },
  fishingPier: { item: 'ration', chance: 0.2, from: 'food', min: 12 },
};

// Alışveriş: Pazar Yeri'nde boş zamanda (günde en çok bir kez) ve handa yemekten sonra azık
export const SHOP = {
  chance: 0.12, // boş zaman kararında pazara gitme olasılığı (kesesi ve çantasında yeri varsa)
  cooldownMinutes: 1440,
  minCoins: 4,
  prices: { fruit: 2, herb: 3, souvenir: 6, bread: 3 },
  innTakeaway: { chance: 0.35, price: 3, minMeals: 3 }, // handa yemekten sonra pişmiş bir porsiyonu azık (Börek) olarak alır
};

// Çantadan yemek / ot içmek / hatıraya bakmak
export const SNACK = {
  chance: 0.5, // acıkınca (eşik altında) çantadan yeme olasılığı; çok açken (tokluk < 15) her zaman
  keepsakeBelowFun: 30,
  keepsakeCooldownMinutes: 360,
};

// ---------------------------------------------------------------------------
// Vatandaş dilekçeleri (PetitionSystem)
// ---------------------------------------------------------------------------
export const PETITIONS = {
  firstAfterMinutes: 1800, // yeni kasabada ilk dilekçe ~1,25 gün sonra
  intervalMinutes: [2880, 4320], // sonrakiler 2-3 günde bir
  hours: [9, 17], // dilekçeler gündüz verilir
  maxOpen: 2,
  deadlineMinutes: 3600, // 2,5 gün
  acceptExtraMinutes: 720, // kabul edilen dilekçeye yarım gün ek süre
  nearHome: 7, // fidan, fener ya da bank evin bu kadar karo yakınında olmalı
  bubbleEveryMinutes: 90, // açık dilekçesi olan sakinin başında parşömen balonu
  reward: { trust: 6, acceptedBonus: 2, fun: 20 },
  accept: { trust: 1, fun: 3 },
  reject: { trust: -5, fun: -12 },
  expire: { trust: -6, brokenPromise: -3, fun: -15 }, // kabul edip yerine getirmemek ek güven kaybı
  logSize: 12,
};

// Dilekçe türleri. text: sakinin ağzından; grant: "Hemen Karşıla" bedeli (yoksa yalnızca kabul / ret)
export const PETITION_KINDS = {
  sapling: { name: 'Fidan', icon: 'leaf', text: 'Evimin yakınına bir fidan dikilmesini istiyorum.', grant: { wood: 2, food: 2 }, grantLabel: 'Fidanı Dik' },
  street: { name: 'Fener ya da Bank', icon: 'lantern', text: 'Sokağımıza bir fener veya bank konulmasını istiyorum.', grant: { wood: 4 }, grantLabel: 'Bank Koy' },
  academy: { name: 'Bilgelik Evi', icon: 'book', text: 'Kasabamıza bir Bilgelik Evi kurulmasını talep ediyorum.' },
  research: { name: 'Yeni Araştırma', icon: 'book', text: "Bilgelik Evi'nde yeni bir araştırmaya başlanmasını talep ediyorum." },
  books: { name: 'Antik Kitap', icon: 'book', text: 'Kitaplığa bir antik kitap alınmasını talep ediyorum.' },
  stock: { name: 'Kışlık Stok', icon: 'wood', text: 'Kış yaklaşırken odun ve yiyecek stokunun güvenli seviyeye çıkarılmasını istiyorum.' },
  tool: { name: 'Sağlam Alet', icon: 'sturdyTool', text: 'Bana sağlam bir alet verilmesini istiyorum.', grant: { iron: 4, wood: 3 }, grantLabel: 'Aleti Ver' },
  gathering: { name: 'Meydanda Buluşma', icon: 'bell', text: 'Meydanda hep birlikte toplanacağımız bir şenlik ya da buluşma istiyorum.', grantLabel: 'Zili Çal' },
  // (25.3) Yeni nesil huyların dilekçeleri
  craftTools: { name: 'Atölye Malzemesi', icon: 'quirkCraft', text: 'Atölyelerimize yeni el aletleri ve tezgâh malzemesi alınsın; elimiz işe daha iyi yatsın.', grant: { iron: 6, wood: 6 }, grantLabel: 'Malzemeyi Ver' },
  marketFees: { name: 'Pazar Harçları', icon: 'quirkTrade', text: 'Pazar harçları hafifletilsin; adil bir vergiyle esnaf da kasaba da kazansın.', grant: { gold: 25 }, grantLabel: 'Harçları Hafiflet' },
  // (25.4) Altın Çağ'da evlenip aynı çatı altında yer bulamayan 2. kuşak çift (LineageSystem açar)
  newHome: { name: 'Yeni Konut Talebi', icon: 'heart', text: 'Yeni evlendik; Belediye Konağı\'ndan kendi yuvamızı kuracağımız bir kulübe istiyoruz.' },
  sherbetCask: { name: 'Fazladan Şerbet', icon: 'quirkFestive', text: 'Hana fazladan bir şerbet fıçısı açılsın; bu akşam herkes neşelensin!', grant: { sherbet: 3 }, grantLabel: 'Fıçıyı Aç' },
};

// ---------------------------------------------------------------------------
// Yönetim Güveni / asayiş (TrustSystem)
// ---------------------------------------------------------------------------
export const TRUST = {
  start: 75,
  // Saat başı değişim: kasabanın ortalama refahına göre (yüksek refah güveni besler, kritik refah eritir)
  welfareDrift: [
    { min: 70, perHour: 0.25 },
    { min: 55, perHour: 0.1 },
    { min: 35, perHour: 0 },
    { min: 25, perHour: -0.5 },
    { min: 0, perHour: -0.8 },
  ],
  starvingBelow: 10, // tokluğu bunun altındaki her sakin saat başı güveni düşürür
  starvingPerHour: -0.06,
  starvingMaxPerHour: -0.6,
  coldPerHour: -0.3, // kışın odun bitip evler soğuyunca
  // Kasabadaki olayların tek seferlik etkisi
  events: { festival: 4, seasonFestival: 6, grandFeast: 8, goldBonus: 6, rally: 2, rallyRevolt: 4, cold: -3 },
  levels: [
    { min: 70, key: 'good', name: 'Güvenli' },
    { min: 45, key: 'ok', name: 'Huzursuz' },
    { min: 25, key: 'low', name: 'Gergin' },
    { min: 0, key: 'bad', name: 'Asayiş Bozuk' },
  ],
};

// Yatıştırma: acil erzak ve altın dağıtımı (meydan havuzunun ya da Belediye Konağı'nın panelinde)
export const RELIEF = {
  food: { name: 'Erzak Dağıt', icon: 'food', perResident: 2, min: 12, hunger: 30, fun: 5, trust: 10, cooldownMinutes: 720 },
  gold: { name: 'Altın Dağıt', icon: 'coin', perResident: 8, min: 40, fun: 8, trust: 12, cooldownMinutes: 720 },
};

// İsyan ve yağma
export const REVOLT = {
  critical: 25, // güven ya da refah bunun altında ...
  graceHours: 12, // ... bu kadar saat kalırsa isyan çıkar
  endTrust: 35, // güven bunun üstüne çıkınca (ve refah kritik değilse) isyan biter
  minAdults: 3,
  minRioters: 2,
  maxShare: 0.6, // yetişkinlerin en çok bu kadarı isyana katılır
  angryBelow: 50, // mutluluğu bunun altındaki yetişkinler isyancı olur
  hours: [8, 20], // isyancılar gündüz meydanda toplanır / yağmaya çıkar
  raidEveryMinutes: 180,
  raidSize: 3,
  // Bir yağmacının bir seferde alabileceği en çok mal (çantasındaki yer kadar) ve altın
  loot: { food: 12, bread: 6, wood: 15, gold: 40 },
  targets: ['storage', 'mill', 'townHall'], // Kiler (erzak, odun), Fırın (ekmek), Belediye Konağı (hazine)
  rejoinEveryMinutes: 360, // isyan sürerken öfkesi artan sakinler katılır
};
