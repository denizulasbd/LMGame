// (29.3 "Yaşayan Ruh") Arzular, korkular ve yaşam doyumu. Saf hesaplar src/systems/Wants.js'te, olaylar ve durum değişiklikleri
// src/systems/WantSystem.js'te; burada yalnızca sayılar, adlar ve sözler var.
//
// c.wants = [{ key, since, until, whoId?, whoName? }]  : en çok 3 arzu (kategori başına 1, uzun soluklu en çok 1)
// c.fears = [{ key, since, until, whoId?, whoName? }]  : en çok 2 korku
//   until: bitiş dakikası (state.totalMinutes); uzun soluklu kayıtta null (gerçekleşene ya da uygunluğu bitene dek sürer)
// c.satisfaction (0..100)  : yaşam doyumu. Gerçekleşen arzu +puan, süresi dolan arzu -2, başına gelen korku -puan, geçen korku +2;
//                            her gün dönümünde 50'ye doğru kayar. Kademesi c.mood çarpanlarına katılır (Moodlets.recomputeMood).
// c.wantLog = [{ key, kind, outcome, day, whoName?, burned? }] : son 8 kayıt (halka). outcome: fulfilled | expired | realized | passed | void
// c.fearStreak / c.wishCount : araya arzu girmeden üst üste gerçekleşen korku / ömür boyu gerçekleşen arzu (29.4 kancaları)
//
// Seçim: boş yuvalar her gün 06:00'da (rollHour) dolar. Zar ana üreteçten DEĞİL, (tohum, kimlik, gün, salt) karmasından türeyen
// durumsuz bir üreteçten çekilir (Wants.wantRng): kaydet-yükle sonrası aynı gün aynı seçim çıkar.
//
// Katalog alanları: name ({who}: hedef kişinin adı), cat (kategori: aynı kategoriden en çok 1 aktif arzu), days (null = uzun soluklu),
// points (doyum etkisi), base (temel ağırlık), traits / quirks (ağırlık çarpanları), icon (balon ve çip simgesi), drive (davranış kancası:
// leisure: boş zaman etkinlikleri, inn: han, seek: hedefi arar, social: sohbet arar, focus: mola vermez, ownCraft: kendi işini seçer,
// shop: Pazar'a meyleder; korkularda avoid: hedeften kaçınır, hunger / energy: daha erken yer / dinlenir, warmth: sıcak mekân arar).

export const WANT_SEED_OFFSET = 39; // izole üreteç: tohum + 39 (yalnızca söz seçimi ve söz olasılığı; seçim durumsuz karmadan)
export const WANT_CAPS = { wants: 3, fears: 2, longWants: 1, log: 8 };
export const WANT_RULES = {
  rollHour: 6, // boş yuvalar her gün 06:00'da dolar (anında değil: ritim)
  repeatDays: 2, // wantLog'da son 2 günde görülen anahtar yeniden seçilmez
  expirePenalty: 2, // süresi dolan arzu: doyum -2
  passReward: 2, // gerçekleşmeden süresi dolan korku: doyum +2
  driftAbove: 2, driftBelow: 1, driftCenter: 50, // her gün dönümünde 50'ye doğru kayma
  tierAt: { minor: 0, major: 10, critical: 18 }, // puana göre moodlet kademesi
  memoryAt: 12, // bu puan ve üstü anı bırakır
  partnerPull: 60, // findPartner: aranan kişi bu kadar piksel yakınmış gibi
  workTiles: 4, // findWorkFor: kendi uzmanlık işi bu kadar karo yakınmış gibi
  leisureMul: 2.5, // arzunun işaret ettiği boş zaman etkinliği ağırlığı
  shopMul: 2.5, // "Kendime bir şey alayım": Pazar zarının eşiği bu kat (zar yine bir kez atılır)
  warmthMul: 2, // "Soğukta üşümek" korkusu: sonbahar / kışta han ve ateş başı ağırlığı
  hungerBonus: 8, energyBonus: 6, // korku: daha erken yer / dinlenir
  speechChance: 0.5, speechSeconds: 3.2, bubbleSeconds: 2.4,
  nearRadius: 48,
  friendScore: 40, // "dost" ilişki puanı (data/relationships.js -> Dost seviyesi)
  lovedAge: 60, // "yokluğu" korkusu: eşi / ebeveyni / ruh ikizi bu yaşta ya da yaşlıysa
};

export const SATISFACTION = {
  start: 50,
  min: 0,
  max: 100,
  tiers: [
    { key: 'crushed', below: 20, name: 'Hayal Kırıklığı', effects: { workMul: 0.95, joyRateMul: 1.15, quarrelMul: 1.2 } },
    { key: 'restless', below: 40, name: 'Arayışta', effects: { joyRateMul: 1.06 } },
    { key: 'content', below: 65, name: 'Hâlinden Memnun', effects: {} },
    { key: 'fulfilled', below: 85, name: 'Doyumlu', effects: { workMul: 1.03, joyRateMul: 0.92 } },
    { key: 'radiant', below: 101, name: 'Gönlü Zengin', effects: { workMul: 1.05, joyRateMul: 0.85, xpMul: 1.1 } },
  ],
};

// Arzu kataloğu (sıra = seçim sırası; aynı olay bir sakinde en çok bir arzuyu, bu sırayla ilkini gerçekleştirir)
export const WANTS = {
  see_pupil_master: { name: 'Çırağım {who} ustalaşsın', cat: 'legacy', days: null, points: 14, grandmasterBonus: 8, base: 1, icon: 'masterpiece', traits: {}, quirks: { craftsman: 1.5 }, drive: {} },
  pass_heirloom: { name: 'Yadigârımı devredeyim', cat: 'legacy', days: null, points: 18, base: 1, icon: 'treasure', traits: {}, quirks: {}, drive: {} },
  see_grandchild: { name: 'Torun seveyim', cat: 'family', days: null, points: 20, base: 1, icon: 'heart', traits: { cheerful: 1.3 }, quirks: {}, drive: {} },
  get_married: { name: '{who} ile evleneyim', cat: 'love', days: null, points: 20, base: 1.5, icon: 'ring', traits: {}, quirks: {}, drive: { seek: true } },
  have_child: { name: 'Bir evladımız olsun', cat: 'family', days: null, points: 22, base: 1, icon: 'heart', traits: {}, quirks: {}, drive: {} },
  find_love: { name: 'Gönlüme göre birini bulayım', cat: 'love', days: 4, points: 18, base: 1, icon: 'love', traits: { socialButterfly: 1.3, introvert: 0.6 }, quirks: {}, drive: { social: true } },
  craft_masterwork: { name: 'Usta işi bir eser çıkarayım', cat: 'craft', days: 4, points: 20, base: 1, icon: 'masterpiece', traits: { ambitious: 2.5, hardworking: 1.5 }, quirks: { craftsman: 1.5 }, drive: { focus: true, ownCraft: true } },
  level_up_skill: { name: 'Mesleğimde ilerleyeyim', cat: 'craft', days: 3, points: 10, base: 1, icon: 'hammer', traits: { ambitious: 2, hardworking: 2 }, quirks: {}, drive: { focus: true, ownCraft: true } },
  chat_kindred: { name: '{who} ile dertleşeyim', cat: 'social', days: 2, points: 8, base: 1, icon: 'chat', traits: { socialButterfly: 1.5 }, quirks: {}, drive: { seek: true, social: true } },
  make_friend: { name: 'Yeni bir dost edineyim', cat: 'social', days: 3, points: 12, base: 1, icon: 'handshake', traits: { socialButterfly: 2.5, introvert: 0.4 }, quirks: {}, drive: { social: true } },
  reconcile: { name: '{who} ile barışayım', cat: 'social', days: 3, points: 12, base: 1, icon: 'handshake', traits: { grumpy: 0.5 }, quirks: {}, drive: { seek: true, social: true } },
  sherbet_with_spouse: { name: '{who} ile handa şerbet içeyim', cat: 'love', days: 2, points: 10, base: 1, icon: 'sherbet', traits: { cheerful: 1.5 }, quirks: {}, drive: { inn: true, seek: true, social: true } },
  family_dinner: { name: 'Ailece sofraya oturalım', cat: 'family', days: 2, points: 8, base: 1, icon: 'apple', traits: { cheerful: 1.5 }, quirks: {}, drive: {} },
  feast_meal: { name: 'Ağız tadıyla bir ziyafet', cat: 'comfort', days: 2, points: 6, base: 1, icon: 'sherbet', traits: { glutton: 3 }, quirks: {}, drive: { inn: true } },
  quiet_day: { name: 'Kafamı dinleyeyim', cat: 'comfort', days: 2, points: 6, base: 1, icon: 'book', traits: { introvert: 3, natureLover: 2, grumpy: 1.5 }, quirks: { bookworm: 1.5, philosopher: 1.5 }, drive: { leisure: true } },
  treat_self: { name: 'Kendime bir şey alayım', cat: 'comfort', days: 3, points: 6, base: 1, icon: 'purse', traits: {}, quirks: { entrepreneur: 0.5 }, drive: { shop: true } },
  go_expedition: { name: 'Sefere çıkayım', cat: 'craft', days: 4, points: 12, base: 1, icon: 'adventure', traits: { ambitious: 2 }, quirks: {}, drive: {} },
  be_heard: { name: 'Dilekçem kabul görsün', cat: 'civic', days: null, points: 12, base: 1, icon: 'scroll', traits: {}, quirks: {}, drive: {} },
};
export const WANT_KEYS = Object.keys(WANTS);

// Korku kataloğu (sıra = seçim sırası)
export const FEARS = {
  fire_at_work: { name: 'İş yerimde yangın çıkması', days: 4, points: 10, burnedPoints: 6, base: 1, icon: 'fire', traits: {}, quirks: {}, drive: {} },
  quarrel_foe: { name: '{who} ile kavga etmek', days: 3, points: 8, base: 1, icon: 'angry', traits: { grumpy: 0.5, cheerful: 1.5 }, quirks: {}, drive: { avoid: true } },
  winter_cold: { name: 'Soğukta üşümek', days: 4, points: 8, base: 1, icon: 'cold', traits: { natureLover: 1.5 }, quirks: {}, drive: { warmth: true } },
  go_hungry: { name: 'Aç kalmak', days: 3, points: 8, base: 1, icon: 'apple', traits: { glutton: 3 }, quirks: {}, drive: { hunger: true } },
  loss_of_loved: { name: '{who} için: yokluğu', days: null, points: 20, base: 3, icon: 'candle', traits: {}, quirks: {}, drive: {} },
  be_lonely: { name: 'Yapayalnız kalmak', days: 3, points: 6, base: 1, icon: 'sulk', traits: { socialButterfly: 3, introvert: 0.3 }, quirks: {}, drive: {} },
  fall_ill: { name: 'Hastalanmak / yaralanmak', days: 4, points: 8, base: 1, icon: 'sneeze', traits: {}, quirks: {}, drive: {} },
  heartbreak: { name: 'Kalbimin kırılması', days: 4, points: 12, base: 1, icon: 'sulk', traits: {}, quirks: {}, drive: {} },
  unheard: { name: 'Sesimin duyulmaması', days: null, points: 8, base: 1, icon: 'scroll', traits: { ambitious: 1.5 }, quirks: {}, drive: {} },
  burnout: { name: 'Tükenmek', days: 3, points: 6, base: 1, icon: 'zzz', traits: { sleepyhead: 2.5, hardworking: 0.5 }, quirks: {}, drive: { energy: true } },
};
export const FEAR_KEYS = Object.keys(FEARS);

// Evre çarpanları: anahtar ya da kategori adı (anahtar önce bakılır)
export const WANT_STAGE = {
  elder: { legacy: 2, craft: 0.5, find_love: 0.3, fall_ill: 2 },
  youth: { craft: 1.3, find_love: 1.5 },
};
// Moodlet bağlamı: sakinin üzerinde bu moodlet varken arzu / korku ağırlığı çarpılır
export const WANT_MOOD = {
  lonely_ache: { make_friend: 3, chat_kindred: 2 },
  hangry: { feast_meal: 3 },
  raw_ration: { feast_meal: 3 },
  sour_encounter: { reconcile: 2, quiet_day: 2 },
  flow_state: { craft_masterwork: 2 },
  inspired: { craft_masterwork: 2 },
};
// Yastaki sakin: aşk ve keyif arzuları susar, ruh ikiziyle dertleşmek öne çıkar
export const WANT_GRIEF = { love: 0, comfort: 0, chat_kindred: 2 };

// "Kafamı dinleyeyim": tenha boş zaman etkinlikleri (Brain.planLeisure; yalnızca zaten açık olan etkinlikler ölçeklenir)
export const QUIET_LEISURE = ['bench', 'river', 'readBench', 'readLibrary', 'viewpoint', 'shade', 'flowers'];
export const WARM_LEISURE = ['inn', 'campfire'];

// Moodlet -> korku eşlemesi (moodlet:added tek dinleyicide çözülür)
export const FEAR_MOODLETS = {
  chilled: 'winter_cold',
  cold_wake: 'winter_cold',
  hangry: 'go_hungry',
  mourning: 'loss_of_loved',
  lonely_ache: 'be_lonely',
  heartbroken: 'heartbreak',
  neglected: 'unheard',
  exhausted: 'burnout',
};
// Moodlet -> arzu eşlemesi
export const WANT_MOODLETS = { quiet_peace: 'quiet_day', nature_bliss: 'quiet_day' };

// Gerçekleşince söylenen sözler ({who}: hedef kişinin adı)
export const WANT_LINES = {
  see_pupil_master: ['{who} artık usta, gözüm arkada kalmaz.', 'Emeğim boşa gitmedi!'],
  pass_heirloom: ['Emanetim artık güvende.', 'Bu yadigâr yaşamaya devam edecek.'],
  see_grandchild: ['Torunum oldu, torunum!', 'Soyumuz sürüyor!'],
  get_married: ['{who} ile dünya evine girdik!', 'Ömrüm boyunca yanında.'],
  have_child: ['Evimize bir can geldi!', 'Ocağımız şenlendi.'],
  find_love: ['Kalbim yerini buldu.', 'Gönlüm şarkı söylüyor!'],
  craft_masterwork: ['İşte ömürlük bir eser!', 'Elimden çıktığına inanamıyorum.'],
  level_up_skill: ['Mesleğimde bir basamak daha!', 'Emek ustalığa döndü.'],
  chat_kindred: ['{who} ile içimi döktüm.', 'Dertleşmek ne iyi geldi.'],
  make_friend: ['Yeni bir dostum var!', 'Dost kazanmak ne güzel.'],
  reconcile: ['{who} ile aramız düzeldi.', 'Kırgınlık bitti, oh be.'],
  sherbet_with_spouse: ['{who} ile şerbetin tadı başka!', 'Kana kana, el ele.'],
  family_dinner: ['Ailece sofra gibisi yok.', 'Ev sıcacık oldu.'],
  feast_meal: ['Ağzıma layık bir sofra!', 'Bayram yemeği gibi!'],
  quiet_day: ['Kafam dinlendi.', 'Sessizlik ilaç gibi.'],
  treat_self: ['Kendimi şımarttım.', 'Bunu hak ettim!'],
  go_expedition: ['Yollar bizi bekliyordu!', 'Ne maceralar gördüm!'],
  be_heard: ['Sesimizi duydular!', 'Dilekçem karşılık buldu.'],
};
// Korku başına gelince söylenen sözler
export const FEAR_LINES = {
  fire_at_work: ['Korktuğum başıma geldi: yangın!', 'Alevler... emeğim!'],
  quarrel_foe: ['Yine {who} ile ağız dalaşı...', 'Bu kavgadan korkuyordum.'],
  winter_cold: ['İliklerime kadar üşüdüm.', 'Kışın soğuğu kemiğime işledi.'],
  go_hungry: ['Açlık kapıya dayandı.', 'Midem kazınıyor...'],
  loss_of_loved: ['{who}, gittin demek...', 'En büyük korkum buydu.'],
  be_lonely: ['Kimsem kalmadı...', 'Yalnızlık çöktü üstüme.'],
  fall_ill: ['Tam da korktuğum gibi, hastayım.', 'Bedenim beni yarı yolda bıraktı.'],
  heartbreak: ['Kalbim paramparça.', 'Korktuğum oldu.'],
  unheard: ['Sesimi duyan yok.', 'Korktuğum gibi, yok sayıldım.'],
  burnout: ['Tükendim...', 'Dizlerimde derman kalmadı.'],
};
