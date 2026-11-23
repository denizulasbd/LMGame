// (32.1) Suç Motoru: bütün sayılar, adlar ve metinler. Saf hesaplar systems/Justice.js'te, durum değiştiren sistem
// systems/CrimeSystem.js'te. Şalter: ENGINES.justice. Denge ayarı yalnızca bu dosyadan yapılır.
//
// Oyunun sakin ruhu: şiddet, silah, hapis yok. Küçük, insani, hafif mizahi suçlar; çalınan mal yok olmaz, suçlunun çantasına ya
// da kesesine geçer (32.2'de tazminatın kanıtı ve kaynağı). Sonraki adımlar: 32.2 Adalet Sarayı ve dava penceresi (closeCase'in
// kararı), 32.3 Krallık İtibarı (crimeRate / solvedRatio), 32.4 eğitim (educationFactor), 32.5 kulüpler (clubFactor).

export const JUSTICE_SEED_OFFSET = 42; // izole üreteç: tohum + 42 (35 ömür, 36 vadi, 37 kimya, 38 moodlet, 39 arzu, 40 evrim, 41 söz)
export const JUSTICE_TABLE_VERSION = 1;

export const JUSTICE = {
  minDay: 6, // erken oyun: ilk 5 gün suç yok
  minTier: 2, // Mezra'da suç yok (Köy ve üstü)
  planHour: 8, // günün suçları bu saatte planlanır (izole üreteçle)
  slots: { base: 1, crowded: 2, crowdedAbove: 20 }, // günde en çok 1 suç; kasaba 20 sakini aşınca en çok 2
  baseDaily: 0.0105, // kişi başı günlük taban risk (bütün çarpanlar 1 iken); ilk ölçüm 0,0075 (planların yarısı pencereyi kaçırıyordu)
  maxDailyChance: 0.85, // bir suç yuvasının o gün dolma olasılığının üst sınırı (adayların risk toplamı)
  hours: [12, 21], // suç saati bu aralıktan seçilir [başlangıç, bitiş); ilk ölçüm [11, 23]: 22:00 planları uykuya denk geliyordu
  windowHours: 8, // sakin planlanan saatten sonra bu kadar saat içinde (en geç dayEndHour) boş zamanında eyleme geçer; geçerse plan düşer (ilk ölçüm 5)
  dayEndHour: 23, // pencere en geç bu saatte kapanır (gece yarısını aşan plan yok)
  nudgeKinds: ['leisure', 'social', 'idle'], // vakti gelince saat başı bölünen görev türleri (şenlik, iş, uyku bölünmez)
  duration: [8, 14], // eylem süresi (oyun dakikası; izole üreteçten)
  closeAfterMinutes: 1440, // açık dava (Adalet Sarayı yokken) bir gün sonra Muhtar uyarısıyla kapanır
  logSize: 40, // kapanmış davaların son N'i
  rateDays: 8, // crimeRate penceresi (gün)
  courtType: 'courthouse', // (32.2) Adalet Sarayı yapı türü; bu adımda yapı yok, kural her zaman Muhtar uyarısı
  vandalHours: 18, // bozulan süsün üstünde küçük onarım işareti kalma süresi (oyun saati; kaydedilmez)
};

// Kişi başı risk çarpanları (Justice.crimeRisk). Hepsi çarpımsal; eşikler yukarıdan aşağı ilk eşleşen.
export const RISK = {
  // Yoksulluk: kesedeki altın (PURSE ölçeği: yeni sakinin harçlığı 12)
  poverty: [
    { below: 6, mul: 1.9 },
    { below: 12, mul: 1.45 },
    { below: 25, mul: 1.15 },
    { below: 150, mul: 1 },
    { below: Infinity, mul: 0.8 },
  ],
  // Açlık: "Açlıktan Gözü Dönmüş" moodlet'i, tokluk eşikleri; kıtlıkta (kiler bir günden az yeter) herkese en az famineMul
  hangryMul: 2.2,
  hunger: [
    { below: 25, mul: 1.8 },
    { below: 45, mul: 1.2 },
    { below: Infinity, mul: 1 },
  ],
  famineMul: 1.5,
  // Sadakat kademesi (Loyalty.loyaltyLevel)
  loyalty: { bitter: 2.8, grumbling: 1.7, calm: 1, pleased: 0.8, loyal: 0.55 }, // ilk ölçüm bitter 2,2 / grumbling 1,5 (zorba ancak 1-1,8 kat)
  // Kasaba refahı (yürüyen ortalama) ve Yönetim Güveni: düşükse artar
  welfare: [
    { below: 35, mul: 1.8 }, // ilk ölçüm 1,6
    { below: 55, mul: 1.3 }, // ilk ölçüm 1,2
    { below: 75, mul: 1 },
    { below: Infinity, mul: 0.85 },
  ],
  trust: [
    { below: 25, mul: 1.6 },
    { below: 45, mul: 1.3 },
    { below: 70, mul: 1 },
    { below: Infinity, mul: 0.9 },
  ],
  // Kişilik (özellikler ve huylar): genel risk çarpanı
  traits: { grumpy: 1.3, glutton: 1.15, ambitious: 1.1, cheerful: 0.9, hardworking: 0.8 },
  quirks: { entrepreneur: 1.1, festive: 1.1, philosopher: 0.85 },
  youthMul: 1.15, // Genç: biraz daha kıpır kıpır
  dominantAt: 1.05, // baskın çarpan bunun altındaysa motivasyon 'temptation'
};

// Suç türüne kişilik eğilimi (ağırlık çarpanı)
export const TRAIT_LEAN = {
  glutton: { innPilfer: 1.6, marketFruit: 1.6, pantryRation: 1.6 },
  grumpy: { pettyVandal: 1.8 },
  ambitious: { pursePinch: 1.3 },
  cheerful: { pettyVandal: 0.6 },
};
export const QUIRK_LEAN = {
  festive: { innPilfer: 1.5 },
  entrepreneur: { pursePinch: 1.3 },
};

export const MOTIVES = {
  hunger: { name: 'açlık' },
  poverty: { name: 'yoksulluk' },
  grudge: { name: 'kırgınlık' },
  temptation: { name: 'heves' },
  mischief: { name: 'yaramazlık' },
};

// Pişmanlık (32.2'de ifade metni): motivasyona göre ağırlıklar, kişilik çarpanları
export const REMORSE = {
  keys: ['confess', 'apologize', 'deny', 'excuse'],
  byMotive: {
    hunger: { confess: 2, apologize: 3, deny: 1, excuse: 3 },
    poverty: { confess: 2, apologize: 2, deny: 1, excuse: 3 },
    grudge: { confess: 1, apologize: 1, deny: 3, excuse: 3 },
    temptation: { confess: 2, apologize: 3, deny: 2, excuse: 1 },
    mischief: { confess: 3, apologize: 2, deny: 2, excuse: 1 },
  },
  traits: { cheerful: { confess: 1.6 }, grumpy: { deny: 1.6 }, ambitious: { excuse: 1.5 }, hardworking: { apologize: 1.4 } },
  names: { confess: 'itiraf etti', apologize: 'özür diledi', deny: 'inkâr etti', excuse: 'bahane buldu' },
};

// Yakalanma (Justice.catchChance): olay yerinin yakınındaki uyanık sakinler ve nöbetteki bekçiler (Gözcü Kulesi menzili)
export const CATCH = {
  witnessRadius: 6, // karo
  resident: 0.16, // yakındaki her uyanık sakin
  childMul: 0.5,
  victim: 0.35, // kese hırsızlığında kurban yakındaysa
  guard: 0.55, // nöbetteki her bekçi (olay yeri kulenin menzilindeyse)
  guardRange: 12, // Gözcü Kulesi'nin gözetleme menzili (karo)
  hidden: 0.05, // tanık yokken bile sonradan anlaşılma
  night: 0.6, // gece (21:00-05:59)
  nightHours: [21, 6],
  secludedRadius: 10, // bu menzilde hiç uyanık sakin yoksa tenha yer
  secluded: 0.7,
  max: 0.9,
  min: 0.03,
};

// Suç türleri. severity 1-5 (32.2'de ceza ölçeği). motives: motivasyon -> ağırlık (yoksa açık değil).
// stolen: item (çantaya giren eşya) / resource (kasaba stoğu) / source ('stock' | 'inn' | 'stall' | 'purse' | 'none').
// share: tek olayda stoğun en çok payı; cap: en çok birim; minStock: stok bundan azsa seçilmez.
export const CRIMES = {
  innPilfer: {
    name: 'Handan aşırma',
    severity: [1, 2], // yemek 1, şerbet 2
    targets: ['inn'],
    variants: {
      meal: { item: 'pie', source: 'inn', field: 'meals', amount: [1, 2], minStock: 2, value: 3, severity: 1 },
      sherbet: { item: 'sherbetJug', source: 'inn', field: 'sherbet', amount: [1, 2], minStock: 2, value: 4, severity: 2 },
    },
    motives: { hunger: 2, poverty: 1, temptation: 2, mischief: 1 },
    text: {
      act: 'handan {loot} aşırırken',
      did: 'handan gizlice {loot} aşırdı',
      lost: 'Handan {loot} kayboldu',
    },
  },
  marketFruit: {
    name: 'Pazar tezgâhından aşırma',
    severity: [1, 1],
    targets: ['market'],
    variants: {
      fruit: { item: 'fruit', source: 'stall', amount: [1, 2], value: 2, severity: 1 },
      souvenir: { item: 'souvenir', source: 'stall', amount: [1, 1], value: 6, severity: 1 },
    },
    motives: { hunger: 2, poverty: 1, temptation: 2, mischief: 1 },
    text: {
      act: "Pazar Yeri'nden {loot} aşırırken",
      did: "Pazar Yeri'nden gizlice {loot} aşırdı",
      lost: "Pazar Yeri'nin tezgâhından {loot} kayboldu",
    },
  },
  pantryRation: {
    name: 'Kilerden erzak',
    severity: [2, 2],
    targets: ['storage'],
    variants: {
      ration: { item: 'ration', source: 'stock', resource: 'food', share: 0.02, cap: 6, minStock: 10, value: 1, severity: 2 },
    },
    motives: { hunger: 3, poverty: 2 },
    famineHalves: true, // kıtlıkta (kiler bir günden az yeter) çalınan miktar yarıya iner
    text: {
      act: 'kilerden {loot} alırken',
      did: 'kilerden gizlice {loot} aldı',
      lost: 'Kilerden {loot} eksildi',
    },
  },
  woodpile: {
    name: 'Odun demeti',
    severity: [1, 1],
    targets: ['woodpile', 'storage'],
    variants: {
      wood: { item: 'firewood', source: 'stock', resource: 'wood', share: 0.02, cap: 8, minStock: 15, value: 1, severity: 1 },
    },
    motives: { poverty: 2, temptation: 1 },
    text: {
      act: '{place} {loot} çekerken',
      did: '{place} gizlice {loot} çekti',
      lost: '{placeCap} {loot} eksildi',
    },
  },
  pursePinch: {
    name: 'Kese hafifletme',
    severity: [3, 3],
    victim: true,
    variants: {
      coins: { coins: true, source: 'purse', amount: [3, 10], victimShare: 0.25, minVictimCoins: 15, value: 1, severity: 3 },
    },
    motives: { poverty: 2, grudge: 2, temptation: 1 },
    text: {
      act: '{victimGen} kesesinden {loot} aşırırken',
      did: '{victimGen} kesesinden gizlice {loot} aşırdı',
      lost: '{victimGenCap} kesesinden {loot} kayboldu',
    },
  },
  pettyVandal: {
    name: 'Ufak haylazlık',
    severity: [1, 2],
    targets: ['bench', 'parkBench', 'woodFence', 'flowerFence', 'fenceGate', 'planter', 'flowerBed', 'lantern', 'ironLantern', 'signpost', 'scarecrow'],
    variants: { scuff: { source: 'none', severity: 1 } },
    motives: { grudge: 2, mischief: 3 },
    text: {
      act: '{vandalAct}',
      did: 'gizlice {vandalDid}',
      lost: 'Bir bakmışlar, {vandalPast}',
    },
  },
};
export const CRIME_KEYS = Object.keys(CRIMES);

// Haylazlığın hedefe göre cümleleri (çalma yok; yalnızca güzellik kaybı / küçük onarım işareti)
export const VANDAL_TEXT = {
  bench: { act: 'bankın tahtasını gevşetirken', did: 'bankın tahtasını gevşetti', past: 'bankın tahtası gevşemiş', severity: 1 },
  fence: { act: 'çitin bir kazığını yerinden oynatırken', did: 'çitin bir kazığını yerinden oynattı', past: 'çitin bir kazığı yerinden oynamış', severity: 1 },
  flowers: { act: 'çiçekleri ezerken', did: 'çiçekleri ezdi', past: 'çiçekler ezilmiş', severity: 2 },
  lantern: { act: 'fenerin camına çamur sürerken', did: 'fenerin camına çamur sürdü', past: 'fenerin camına çamur sürülmüş', severity: 1 },
  signpost: { act: 'tabelayı ters çevirirken', did: 'tabelayı ters çevirdi', past: 'tabela ters çevrilmiş', severity: 1 },
  scarecrow: { act: 'korkuluğun şapkasını yamultırken', did: 'korkuluğun şapkasını yamulttu', past: 'korkuluğun şapkası yamulmuş', severity: 1 },
};
export const VANDAL_GROUP = {
  bench: 'bench', parkBench: 'bench', woodFence: 'fence', flowerFence: 'fence', fenceGate: 'fence', planter: 'flowers', flowerBed: 'flowers',
  lantern: 'lantern', ironLantern: 'lantern', signpost: 'signpost', scarecrow: 'scarecrow',
};

// Çalınan şeyin ölçü adı ("2 testi şerbet")
export const LOOT_WORDS = {
  pie: 'börek',
  sherbetJug: 'testi şerbet',
  fruit: 'meyve',
  souvenir: 'hatıra',
  ration: 'torba erzak',
  firewood: 'odun demeti',
  coins: 'altın',
};

export const CRIME_TEXT = {
  caught: '{who} {act} yakalandı ({seen}).',
  seenGuard: 'Bekçi {witness} gördü',
  seenWitness: '{witness} gördü',
  seenNone: 'sonradan anlaşıldı',
  unsolved: '{lost}; kimse bir şey görmedi.',
  journalCaught: '{who} {act} yakalandı ({seen}); dava Muhtar\'a gitti',
  journalUnsolved: '{lost}; kimse bir şey görmedi',
  memoryCaught: '{actCap} yakalandı, yüzü kızardı',
  memoryUnsolved: '{didCap}, kimse görmedi',
  memoryVictimCaught: '{who} kesesinden {loot} aşırdı',
  memoryVictimUnsolved: 'Kesesinden {loot} kayboldu, kimin aldığı bilinmiyor',
  memoryWarned: 'Muhtar onu uyardı: "Bir daha olmasın."',
};

// Kayıttan sonra suçlunun balonu (yakalandı: ter, kimse görmedi: kıkırdama)
export const CRIME_BUBBLES = { caught: 'sweat', unsolved: 'laugh' }; // eylem balonları activities.js'te (pilfer)

// Kurbanla ilişki düşüşü (yakalanınca; RelationshipSystem.add ile, abartısız)
export const VICTIM_RELATION = -6;
