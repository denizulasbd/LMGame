// (32.1) Suç Motoru: bütün sayılar, adlar ve metinler. Saf hesaplar systems/Justice.js'te, durum değiştiren sistem
// systems/CrimeSystem.js'te. Şalter: ENGINES.justice. Denge ayarı yalnızca bu dosyadan yapılır.
//
// Oyunun sakin ruhu: şiddet, silah, hapis yok. Küçük, insani, hafif mizahi suçlar; çalınan mal yok olmaz, suçlunun çantasına ya
// da kesesine geçer (32.2'de tazminatın kanıtı ve kaynağı). Sonraki adımlar: 32.2 Adalet Sarayı ve dava penceresi (closeCase'in
// kararı), 32.3 Krallık İtibarı (crimeRate / solvedRatio), 32.4 eğitim (educationFactor), 32.5 kulüpler (clubFactor).
// (32.2) Adalet Sarayı ve Dava: dosyanın sonundaki COURT, SENTENCES, DESERVED, BANDS, VERDICT_EFFECTS, IMPUNITY, REVEAL, EXILE, SHAME
// ve dava metinleri. Şalter ENGINES.court (justice kapalıyken etkisiz). Durum systems/CourtSystem.js'te, saf hesaplar Justice.js'te.

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
  // (32.6a) Şenlikten sıvışma: vakti gelmiş suç planı olan sakin akşam şenliğinden kalkıp eyleme geçer (herkes meydandayken). Ölçüm:
  // zorba 42 / 77'de vakti gelmiş planların saat örneklerinin %20'si şenlikteydi ve planların %35-47'si düşüyordu. false: eski kural.
  festivalSneak: true,
  // (32.6a) İsyancının planı isyan saatinden (REVOLT.hours) sonraya kayar (eskiden isyan saatine düşen plan çoğunlukla düşüyordu)
  rioterAfterRiot: true,
  // (32.6a) Haylazlık hedefine yol yoksa en yakın bu kadar başka süs denenir (plan düşmesin; zar çekmez)
  vandalRetarget: 6,
  duration: [8, 14], // eylem süresi (oyun dakikası; izole üreteçten)
  closeAfterMinutes: 1440, // açık dava (Adalet Sarayı yokken) bir gün sonra Muhtar uyarısıyla kapanır
  logSize: 40, // kapanmış davaların son N'i
  rateDays: 8, // crimeRate penceresi (gün)
  courtType: 'courthouse', // (32.2) Adalet Sarayı yapı türü (ENGINES.court kapalıyken Justice.courtOf hep null: Muhtar kuralı)
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
  famineMul: 2.4, // (32.6a) 1,5 → 2,4: kıtlıkta suç normalin ancak ×0,9-1,4'üydü (hedef ×2-3)
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
  glutton: { innPilfer: 1.6, marketFruit: 1.6, pantryRation: 1.6, gardenPick: 1.6 },
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
    motives: { hunger: 3, poverty: 1, temptation: 2, mischief: 1 }, // (32.6a) hunger 2 → 3: kıtlıkta açlığa uygun hedef
    text: {
      act: "Pazar Yeri'nden {loot} aşırırken",
      did: "Pazar Yeri'nden gizlice {loot} aşırdı",
      lost: "Pazar Yeri'nin tezgâhından {loot} kayboldu",
    },
  },
  // (32.6a) Bahçeden koparma: kıtlıkta kiler boşken açlığa uygun hedef (erzak suçu çıkmıyordu). Mal stoktan düşmez (tezgâh gibi),
  // iadede bahçeye döner sayılır.
  gardenPick: {
    name: 'Bahçeden koparma',
    severity: [1, 1],
    targets: ['garden'],
    variants: {
      produce: { item: 'fruit', source: 'stall', amount: [1, 2], value: 2, severity: 1 },
    },
    motives: { hunger: 3, poverty: 1 },
    text: {
      act: 'bahçeden {loot} koparırken',
      did: 'bahçeden gizlice {loot} kopardı',
      lost: 'Bahçeden {loot} kopartılmış',
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
  journalCourt: '{who} {act} yakalandı ({seen}); dava Adalet Sarayı\'na düştü', // (32.2)
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


// =====================================================================================================================
// (32.2) Adalet Sarayı ve Dava. Hâkim oyuncunun kendisidir; dava penceresi oyunu DURDURMAZ. HER ceza HER suçta seçilebilir:
// oyunun özü orantılı cezayı bulmak. Halkın tepkisi önceden gösterilmez; karardan sonra sonuç ekranında yazılır.
// =====================================================================================================================

export const COURT_SEED_OFFSET = 43; // izole üreteç: tohum + 43 (ifade değişkeni, tanık zarı, karalama, sürgün çıkışı); 42 suç motorunun
export const COURT_TABLE_VERSION = 1;

export const COURT = {
  deadlineDays: 2, // saray varken açık davanın süresi (oyun günü); dolarsa "sürüncemede" (otomatik Uyarı)
  stale: { trust: -2, impunity: 1 },
  recordCap: 2.25, // sicil (tekrar) payının üst sınırı
  logShow: 6, // panelde son kararlar
  urgentHours: 12, // kalan süre bunun altındaysa acil
  serviceDailyCap: 4, // kamu hizmeti: günde en çok bu kadar saat (sakin yemek, uyku ve sohbete de vakit bulsun)
  serviceMinutes: 60, // bir hizmet oturumu (oyun dakikası)
  serviceFun: -0.04, // hizmet sürerken dakikada keyif (hafif düşüş)
  fineHourCoins: 4, // kese yetmeyen para cezasının her 4 altını 1 saat kamu hizmetine çevrilir
  banDays: 4, // Uzaklaştırma: Han ve Pazar yasağı (gün)
  banVenues: ['inn', 'market'],
  banActivities: ['inn', 'innMeal', 'shop', 'music'], // yasaklının yolda döndüğü görevler (hedef yapı han / pazarsa)
};

// Cezalar ve sertlik puanları (harsh 0-6). Hepsi her suçta seçilebilir.
export const SENTENCES = {
  pardon: { name: 'Af', harsh: 0, icon: 'heart', detail: 'Hiçbir yaptırım yok; sicile yazılır.' },
  warning: { name: 'Uyarı', harsh: 1, icon: 'scroll', detail: 'Sözlü uyarı: "Bir daha olmasın."' },
  fineLight: { name: 'Para Cezası (hafif)', harsh: 2, icon: 'coin', detail: 'Çalınanın değeri kadar altın kesesinden hazineye.' },
  serviceLight: { name: 'Kamu Hizmeti (4 saat)', harsh: 2, icon: 'broom', hours: 4, detail: 'Boş zamanında ücretsiz meydan ve yol süpürür.' },
  ban: { name: 'Uzaklaştırma', harsh: 3, icon: 'sulk', detail: '4 gün Han ve Pazar yasağı (evde ve kilerde yemek serbest).' },
  fineHeavy: { name: 'Para Cezası (ağır)', harsh: 3.5, icon: 'coin', detail: 'Çalınanın üç katı altın (en çok 40) kesesinden hazineye.' },
  serviceHeavy: { name: 'Kamu Hizmeti (12 saat)', harsh: 3.5, icon: 'broom', hours: 12, detail: 'Birkaç akşam boyunca ücretsiz meydan ve yol süpürür.' },
  exile: { name: 'Sürgün', harsh: 6, icon: 'bundle', detail: 'Yalnızca suçlu kasabadan sürülür; ailesi kalır.' },
};
export const SENTENCE_KEYS = Object.keys(SENTENCES);

// Para cezası tutarları (altın): hafif ≈ değer, ağır ≈ 3 kat (tavanlı). Değeri olmayan suçta (haylazlık) ağırlıktan.
export const FINE = { lightMin: 3, heavyMul: 3, heavyMin: 9, heavyCap: 40, perSeverity: 3 };

// Hak edilen sertlik (Justice.deserved): severity tabanı + bağlam payları
export const DESERVED = {
  hungry: -1,
  hungryFamine: -1.5,
  poorBelow: 6, // kesesi bundan azsa yoksul
  poor: -0.5,
  remorse: { confess: -0.5, apologize: -0.75, deny: 0.5, excuse: 0.25 },
  denyWitness: 0.75, // inkâr ve tanık varsa (yerine)
  repeat: 0.75, // sicildeki her eski suç
  youth: -0.5,
  plea: { forgive: -0.75, lesson: 0.5, restore: 0 },
  unreturned: 0.5, // çalınan duruyor ve iade ettirilmediyse
  min: 0.25, // taban: en hafif davada Af da Uyarı da adil sayılır (ilk değer 0: aç ve itiraf eden yoksula Uyarı "sert" çıkıyordu)
  max: 6,
};

// Bantlar (fark = seçilen sertlik − hak edilen)
export const BANDS = {
  fairWithin: 0.75,
  harshTo: 2, // 0,75 < fark <= 2 sert; > 2 zalim
  lenientTo: -2, // -2 <= fark < -0,75 hafif; < -2 gevşek
  names: { fair: 'Adil', harsh: 'Sert', cruel: 'Zalim', lenient: 'Hafif', lax: 'Gevşek' },
  keys: ['fair', 'harsh', 'cruel', 'lenient', 'lax'],
};

// Bantların etkileri (var olan API'ler; sadakat nedenleri 'verdict:<bant>', PULSE_REASONS'ta)
export const VERDICT_EFFECTS = {
  fair: { trust: 2, offenderRemorseful: 3, victim: 3 },
  harsh: { trust: -3, kin: -4 },
  cruel: { trust: -8, everyone: -3, kin: -8 },
  lenient: { victimSide: -3, impunity: 1 },
  lax: { victim: -6, trust: -2, impunity: 2 },
};

// Cezasızlık: son `days` gündeki hafif / gevşek / sürüncemede kararların puanı riski artırır, adil kararlar söndürür
export const IMPUNITY = { days: 10, perPoint: 0.25, cap: 2, fairDamp: 1 }; // ilk ölçüm { 8, 0,15, 1,6 }: hafif hâkimde suç adilinkinin ×1,0'ı (hedef ≥ 1,3)

// Saray varken yakalanmamış eski suçlar (son `days` gün): günde bir izole zar; tutarsa bir tanık konuşur ve dava açılır
export const REVEAL = { hour: 9, days: 4, chance: 0.15, perDay: 1 }; // ilk ölçüm 0,3: yakalanma %80-93 (hedef %60-75)

// Sürgün: yalnızca suçlu bohçasıyla harita kenarına yürür
export const EXILE = { timeoutMinutes: 360, cruelKin: -6 };

// Geride kalan aileye utanç (Mahcup) ve halk arasında karalama (resentful etiketi, süreli)
export const SHAME = {
  hours: { fair: 48, other: 72 },
  tier: { fair: 'minor', harsh: 'minor', cruel: 'major', lenient: 'minor', lax: 'minor' },
  slander: { fair: { people: 2, days: 2 }, other: { people: 3, days: 4 } },
  crowdMul: 0.5, // Mahcup sakin hanı, meydanı ve ateş başını daha az seçer
};

// Karar penceresi ve sonuç metinleri
export const COURT_TEXT = {
  courtName: 'Adalet Sarayı',
  stale: '{who} davası sürüncemede kaldı: süre doldu, kendiliğinden Uyarı verildi.',
  staleJournal: '{who} davası sürüncemede kaldı; hâkim karar vermedi',
  opened: 'Dava Adalet Sarayı\'na düştü.',
  revealed: '{lostCap}: {witness} sonunda konuştu. Dava açıldı: {who}.',
  revealedJournal: '{lost}: {witness} sonunda konuştu, dava {who} adına açıldı',
  verdictJournal: 'Adalet Sarayı: {who} için karar {sentence} ({band})',
  verdictCard: '{who} için karar: {sentence}. Halk {bandLower} buldu.',
  exileCard: '{who} kasabadan sürüldü. Ailesi geride kaldı.',
  exileJournal: '{who} kasabadan sürüldü; kesesi ve çantasıyla yola düştü. Ailesi kasabada kaldı',
  exileChronicle: '{who} ({crime}) kasabadan sürüldü',
  exileWarn: '{who} kasabadan sürülecek. {kin}',
  exileKin: 'Eşi ve çocukları kalır',
  exileKinNamed: 'Geride kalanlar: {names}.',
  exileAlone: 'Kasabada ailesi yok.',
  restitutionOff: { none: 'Çalınan bir şey yok', gone: 'Çalınan çoktan harcanmış', building: 'Mal sahibi yapı artık yok' },
  memoryOffender: 'Adalet Sarayı\'nda yargılandı: {sentence}',
  memoryVictim: '{who} için verilen karar: {sentence}',
  memoryServed: 'Kamu hizmetini bitirdi, borcunu ödedi',
  memoryExiled: 'Kasabadan sürüldü; ardına bakmadan yürüdü',
  memoryKin: '{who} kasabadan sürüldü',
  memoryStale: 'Davası sürüncemede kaldı, kimse bir şey demedi',
  served: 'borcunu ödedi',
  turnBack: 'Yasaklı olduğunu hatırladı, yolundan döndü',
};

// Halkın tepkisinin nedeni (sonuç ekranı): bant x bağlam
export const BAND_REASONS = {
  fair: 'Halk kararı orantılı buldu: ceza suça denk düştü.',
  harsh: 'Halk kararı sert buldu: ceza suçtan ağır.',
  cruel: 'Halk kararı zalimce buldu: bu kadarını hiç kimse beklemiyordu.',
  lenient: 'Halk kararı hafif buldu: mağdur hakkını alamadı.',
  lax: 'Halk kararı gevşek buldu: suç cezasız kaldı sayılır.',
};
export const BAND_HINTS = {
  hungry: 'aç birinin ekmeğine',
  youth: 'bir gencin hatasına',
  repeat: 'sicili kabarık birine',
  deny: 'inkâr edene',
  forgive: 'kurbanın af dilediği bir suça',
  lesson: 'kurbanın ders istediği bir suça',
};

// Suçlunun ifadesi: motivasyon x pişmanlık; her biri en az iki değişken ({loot}: çalınan, {victim}: kurban)
export const STATEMENTS = {
  hunger: {
    confess: ['Üç gündür midem kazınıyordu, {loot} aldım. Utanıyorum.', 'Evet, ben aldım. Açlık insana neler yaptırıyor...'],
    apologize: ['Karnım öyle açtı ki aklım başımdan gitti. Özür dilerim, ödeyeceğim.', 'Bağışlayın beni. Bir lokma için bunu yaptım, bir daha olmayacak.'],
    deny: ['Ben mi? Ben sadece kokusuna bakıyordum.', 'Aç olabilirim ama hırsız değilim. Başkası almıştır.'],
    excuse: ['Kilerde yiyecek kalmamıştı, ne yapsaydım? Herkes aç.', 'Kimse bana bir tas çorba bile vermedi. Ben de kendim aldım.'],
  },
  poverty: {
    confess: ['Kesemde tek kuruş yoktu. {loot} aldım, doğru.', 'İnkâr etmeyeceğim. Param yoktu, aldım.'],
    apologize: ['Elim boştu, aklım karıştı. Çalışıp borcumu ödeyeceğim, söz.', 'Özür dilerim. Yoksulluk ayıp değil ama hırsızlık ayıp, biliyorum.'],
    deny: ['Benim kesemde onu alacak yer mi var? Bakın, bomboş!', 'Yanlış adam. O sırada iş arıyordum.'],
    excuse: ['Herkesin kesesi dolu, benimki bomboş. Biraz paylaştım diyelim.', 'Ücretim zaten az. Kasaba bana borçlu sayılır.'],
  },
  grudge: {
    confess: ['Evet, ben yaptım. İçim öyle doluydu ki...', 'Yaptım. Çünkü bu kasabada kimse bizi duymuyor.'],
    apologize: ['Öfkeme yenildim. Hatalıydım, özür dilerim.', 'Kırgındım ama acısını başkasından çıkardım. Bağışlayın.'],
    deny: ['Beni kim gördü? Söylesin bakalım yüzüme!', 'Ben öyle şeyler yapmam. Bana iftira atıyorlar.'],
    excuse: ['Vergiler, reddedilen dilekçeler... Sabrın da bir sınırı var.', 'Bize yapılanların yanında bu ne ki?'],
  },
  temptation: {
    confess: ['Gözüm kaydı, {loot} aldım. Kabul ediyorum.', 'Öyle güzel duruyordu ki dayanamadım. Evet, ben aldım.'],
    apologize: ['Bir anlık hevesti. Çok mahcubum, özür dilerim.', 'Hiç gerek yoktu, biliyorum. Bağışlayın, geri vereceğim.'],
    deny: ['Ben mi? O gün oralarda bile değildim.', 'Hayatımda öyle bir şey görmedim bile.'],
    excuse: ['Kimse sahip çıkmıyordu, ben de kaybolmasın diye aldım.', 'Bir tanecikten bir şey olmaz sandım.'],
  },
  mischief: {
    confess: ['Şaka olsun diye yaptım, bu kadar büyüyeceğini bilmiyordum.', 'Evet ben yaptım. Gülmek istemiştim, kimse gülmedi.'],
    apologize: ['Çocukluk ettim. Düzeltmeme izin verin, özür dilerim.', 'Haylazlığım tuttu. Bir daha olmayacak, söz.'],
    deny: ['Ben değilim! Rüzgâr yapmıştır.', 'Ben mi? Ben kuzu gibiyimdir.'],
    excuse: ['Can sıkıntısından oldu. Bu kasabada eğlence mi var?', 'Zaten yamuk duruyordu, ben sadece biraz yardım ettim.'],
  },
};

// Kurbanın sözü (kurban sakinse): ilişkiye ve kişiliğe göre (Justice.victimPlea, zar yok); metin değişkeni izole üreteçle
export const VICTIM_PLEAS = {
  forgive: { name: 'affedin', lines: ['Gençtir, bir kereliğine affedin.', 'Komşumdur, kalbi iyidir. Bu sefer affedin.'] },
  restore: { name: 'malımı geri istiyorum', lines: ['Malımı geri istiyorum, o kadar.', 'Ben kimsenin cezalanmasını istemem; yeter ki hakkım geri gelsin.'] },
  lesson: { name: 'ders almalı', lines: ['Ders almalı. Yoksa yarın yine yapar.', 'Bu iş böyle kalmasın. Ders almalı.'] },
};
export const PLEA_RULES = { forgiveAt: 40, lessonBelow: -10, forgiveTraits: ['cheerful'], lessonTraits: ['grumpy', 'ambitious'] };

// Tanık ifadesi ({witness}, {who})
export const WITNESS_LINES = {
  guard: ['Kasaba bekçisi: "Nöbetteydim, gözümle gördüm. {who} etrafına bakına bakına aldı."', 'Kasaba bekçisi: "Fenerimi tuttum, {who} kaçacak yer aradı."'],
  resident: ['{witness}: "Oradaydım, {who} olduğuna yemin ederim."', '{witness}: "Görmez olaydım. Ama gördüm, {who} idi."'],
  revealed: ['{witness}: "Günlerdir içimde tutuyordum. O gün {whoAcc} gördüm."', '{witness}: "Susmak bana ağır geldi. {who} idi."'],
};
