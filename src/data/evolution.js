// (29.4 "Kalıcı Kişilik Evrimi") Yaşananlar sakinin özelliklerini kalıcı olarak değiştirir. Saf hesaplar src/systems/Evolution.js'te,
// olaylar ve durum değişiklikleri src/systems/EvolutionSystem.js'te; burada yalnızca sayılar, adlar ve sözler var.
//
// Her sakinin 2 özelliği vardır (c.traits); OPPOSING_TRAITS'teki dört zıt çift birer EKSENdir (-100..+100). Yaşananlar ekseni iter,
// değer her gün 0'a doğru söner. Eşik aşılınca sabaha karşı (checkHour) kalıcı bir değişim olur:
//   Dönüşüm  (turned)   : sakinde zıt kutup varsa onun yerine yön kutbu geçer (dizideki yeri korunur)          eşik turnAt
//   Derinleşme (deepened): sakinde yön kutbu varsa ve derinleşmemişse c.deepTraits'e eklenir (DEEP_TRAITS)      eşik shiftAt
//   Edinim   (acquired) : sakinde ikisi de yoksa, özellik sayısı < maxTraits ve daha önce edinimi yoksa üçüncü özellik eşik shiftAt
//
// c.growth       = [0,0,0,0]  eksen değerleri (EVOLUTION_AXES sırası)
// c.growthToday  = [0,0,0,0]  bugün uygulanan net değişim (dailyCap için; gün dönümünde sıfırlanır)
// c.growthCause  = [null x4]  eksen başına son anlamlı katkının kaynak anahtarı (CAUSE_TEXT)
// c.deepTraits   = []         derinleşmiş özellik anahtarları (yalnızca c.traits içindekiler)
// c.evolutions   = [{ day, kind, axis, from, to, cause }]  en çok logMax (halka); from: yalnızca dönüşümde eski özellik
// c.evolutionCount / c.acquiredCount : ömür boyu değişim / edinim sayaçları (logdan bağımsız)
//
// EVRİM HİÇ ZAR ÇEKMEZ: tamamı eşik tabanlıdır. Sistemin izole üreteci (tohum + 40) yalnızca söz seçimi / söz olasılığı içindir.

export const EVOLUTION_SEED_OFFSET = 40;

/** Eksenler (sıra sabittir; kayıtta indeksle tutulur). plus: artı kutup, minus: eksi kutup. */
export const EVOLUTION_AXES = [
  { key: 'drive', plus: 'hardworking', minus: 'sleepyhead' },
  { key: 'company', plus: 'socialButterfly', minus: 'introvert' },
  { key: 'calling', plus: 'natureLover', minus: 'ambitious' },
  { key: 'spirit', plus: 'cheerful', minus: 'grumpy' },
];
export const AXIS_COUNT = EVOLUTION_AXES.length;
export const EVOLUTION_KINDS = ['turned', 'deepened', 'acquired'];

export const EVOLUTION_RULES = {
  checkHour: 5, // değişim her gün 05:00'te denetlenir (06:00 arzu dolumundan önce; "bir sabah değişmiş uyandı")
  shiftAt: 60, // edinim / derinleşme eşiği (mutlak değer)
  turnAt: 75, // dönüşüm eşiği
  decayPerDay: 3, // gün dönümünde 0'a doğru sönme (şartname başlangıcı 1; 3 olunca yalnızca günde ortalama 3'ten fazla itilen eksen birikir)
  dailyCap: 20, // bir eksenin bir günde değişebileceği en büyük mutlak miktar
  clamp: 100,
  cooldownDays: 12, // iki değişim arasında en az bu kadar gün
  lifetimeMax: 3, // bir sakinin ömür boyu değişim sayısı
  acquiredMax: 1, // ömür boyu edinim (özellik sayısı en çok 3)
  maxTraits: 3,
  stageMul: { youth: 1.5, adult: 1, elder: 0.6 }, // genç kalıplanır, bilge kolay değişmez
  // (30.4a, ENGINES.traitScarcity) kişilik çeşitliliği: bir kutba doğru katkı, o özelliğin yetişkinler arasındaki payına göre ölçeklenir:
  // çarpan = clamp(base - slope x pay, min, max). Pay gün dönümünde bir kez hesaplanır (EvolutionSystem.refreshShares). Zar yok.
  // Şartname başlangıcı { base: 1,5, slope: 2,5, min: 0,25, max: 1,25 }: 120. günde en yaygın özellik %57-61 -> %42 / %37, ama 50 günde
  // tohum 21'de değişim 2'ye indi (bant 3-14). base 1,75 / max 1,5 değişimi artırdı ama 120. günde tohum 42'de Çalışkan %48 oldu; slope 2,5 -> 3,
  // min 0,25 -> 0,1: pay %10 -> 1,45 · %20 -> 1,15 · %30 -> 0,85 · %40 -> 0,55 · %50 -> 0,25 · %55+ -> 0,1.
  scarcity: { base: 1.75, slope: 3, min: 0.1, max: 1.5 },
  causeMin: 5, // neden olarak kaydedilecek en küçük katkı (mutlak)
  hintAt: 30, // panelde "eğilim" ipucu bu mutlak değerden sonra görünür
  logMax: 4,
  speechChance: 0.7,
  speechSeconds: 3.6,
  bubbleSeconds: 2.8,
};

/**
 * Katkı kaynakları. Yazım: eksen indeksi -> miktar; miktar stageMul ile çarpılır, tam sayıya yuvarlanır, dailyCap ile sınırlanır.
 * Eksenler: 0 drive (+Çalışkan / -Uykucu), 1 company (+Sosyal Kelebek / -İçine Kapanık), 2 calling (+Doğa Sever / -Hırslı),
 * 3 spirit (+Neşeli / -Huysuz). Kaynak anahtarı CAUSE_TEXT'te de bulunur.
 */
const DRIVE = 0;
const COMPANY = 1;
const CALLING = 2;
const SPIRIT = 3;

export const EVOLUTION_SOURCES = {
  // arzu gerçekleşince: genel katkı spirit +puan x wantMul; belirli arzular ek katkı verir
  wantFulfilled: { spiritPerPoint: 0.4 }, // şartname başlangıcı 0,5
  wants: {
    make_friend: [[COMPANY, 10]],
    quiet_day: [[CALLING, 4]],
    craft_masterwork: [[CALLING, -5]],
    level_up_skill: [[CALLING, -5]],
  },
  // korku gerçekleşince: genel katkı spirit -puan x fearMul; belirli korkular ek katkı verir
  fearRealized: { spiritPerPoint: -1.2 },
  fears: { burnout: [[DRIVE, -8]] },
  consoled: [[SPIRIT, 8]], // teselli edilen
  consoler: [[COMPANY, 6]], // teselli eden
  masterwork: [[DRIVE, 10], [CALLING, -8]],
  skillLevelUp: [[DRIVE, 5], [CALLING, -4]],
  graduated: [[DRIVE, 12]], // mezun olan
  grandmaster: [[CALLING, -15]],
  expedition: [[CALLING, -8]],
  married: [[COMPANY, 12]], // ikisi
  kindred: [[COMPANY, 12]], // ikisi
  quarrel: [[COMPANY, -2]], // ikisi (şartname başlangıcı -4)
  // moodlet:added (moodlet anahtarına göre); major: ikinci değer (varsa) major / critical kademede geçerlidir
  moodlets: {
    mourning: [[SPIRIT, -15]],
    neglected: [[SPIRIT, -8]],
    heartbroken: [[SPIRIT, -8], [COMPANY, -8]],
    euphoric: [[SPIRIT, 10]],
    flow_state: [[DRIVE, 3]],
    proud_work: [[DRIVE, 1]],
    exhausted: [[DRIVE, -4]],
    drudgery: [[DRIVE, -2]],
    cold_wake: [[DRIVE, -1]],
    warm_chat: [[COMPANY, 1]],
    side_by_side: [[COMPANY, 1]],
    rubbing_wrong: [[COMPANY, -1]],
    sour_encounter: [[COMPANY, -1]], // şartname başlangıcı -2
    lonely_ache: [[COMPANY, -2]],
    quiet_peace: [[COMPANY, -1], [CALLING, 2]],
    nature_bliss: [[CALLING, 3]],
    farewell: [[SPIRIT, 3]], // (29.7) anma töreninde helalleşti
    forgotten: [[SPIRIT, -3], [COMPANY, -2]], // (29.7) özel günü unutuldu
    aesthetic_joy: [], // şartname başlangıcı calling +1: günde ~1 kez, herkesin calling eksenini sürekli artıya itiyordu; ayarla kapatıldı
  },
  moodletMajor: { warm_chat: [[COMPANY, 2]] }, // major / critical kademede bu katkı (üstteki yerine) geçerlidir
  moodletIgnored: ['wish_come_true', 'dread_realized'], // çifte sayım olmasın
  // gün dönümü: doyum kademesine göre spirit; üst üste gerçekleşen korku
  dailyTier: { radiant: 3, fulfilled: 1, content: 0, restless: -2, crushed: -5 }, // şartname başlangıcı radiant +4, fulfilled +2
  fearStreak: { at: 3, spirit: -3 },
};

// Derin biçimler: TRAITS[key] ile aynı biçimde KISMİ blok. İç içe gruplarda (decay, gain, leisure, work) yalnızca listelenen alanlar
// temel özelliğin alanlarının yerine geçer; geri kalan alanlar aynen sürer. Katalogdaki özellik çarpanları derin biçimde de geçerlidir.
export const DEEP_TRAITS = {
  hardworking: { name: 'Yorulmaz', description: 'İşte neredeyse hiç yorulmaz; omuzları ağır yüke de alışmıştır.', work: { fatigue: 0.5 } },
  sleepyhead: { name: 'Bitkin', description: 'Yorgunluk kemiğine işlemiş; enerjisi gözle görülür biçimde çabuk tükenir.', decay: { energy: 1.5 } },
  socialButterfly: { name: 'Kasabanın Gülü', description: 'Kasabanın gözbebeği olmuştur; her sohbetten daha çok keyif alır, her yüzü tanır.', gain: { social: 1.5 } },
  introvert: { name: 'Münzevi', description: 'Kalabalığa neredeyse hiç ihtiyaç duymaz; çeşmenin başındaki gürültüden uzak durur.', decay: { social: 0.45 }, leisure: { fountain: 0.3 } },
  natureLover: { name: 'Toprağın Dostu', description: 'Doğanın içinde kendinden geçer; her çiçek, her dere ruhuna daha çok iyi gelir.', gain: { nature: 1.9 } },
  ambitious: { name: 'Gözü Yükseklerde', description: 'Hırsı yaşlandıkça büyümüş; işte daha hızlı, boş durunca da daha huzursuzdur.', work: { speed: 1.22 }, decay: { fun: 1.25 } },
  cheerful: { name: 'Gönül Ferahı', description: 'Neşesi bir sığınak gibi; keyfi neredeyse hiç tükenmez.', decay: { fun: 0.6 } },
  grumpy: { name: 'Aksi', description: 'Huysuzluğu iyice keskinleşmiş; en ufak şeye parlamaya hazırdır.', quarrelChance: 1.8 },
};
export const DEEP_TRAIT_KEYS = Object.keys(DEEP_TRAITS);

/** Değişimin sabahında söylenen sözler: EVOLUTION_LINES[tür][yön kutbu özelliği] (2'şer). */
export const EVOLUTION_LINES = {
  turned: {
    hardworking: ['Artık elim işe daha yatkın.', 'Bir sabah uyandım, çalışmak istiyorum.'],
    sleepyhead: ['Bir yorgunluk çöktü üstüme.', 'Eskisi kadar dinç değilim galiba.'],
    socialButterfly: ['İnsanlara karışasım var bugün.', 'Yalnızlık eskisi kadar cazip gelmiyor.'],
    introvert: ['Sessizliğin tadını yeni çıkardım.', 'Kalabalık beni yoruyor artık.'],
    natureLover: ['Toprağın kokusu daha güzel geliyor.', 'Hırs bırakmış, doğa çağırıyor beni.'],
    ambitious: ['Daha yükseğe bakmak istiyorum.', 'İçimde yeni bir hırs uyandı.'],
    cheerful: ['İçim nedense hafifledi.', 'Gülmek geldi içimden, yine de.'],
    grumpy: ['Bir şeyler değişti içimde...', 'Gülmek zor geliyor artık.'],
  },
  deepened: {
    hardworking: ['İşim ben oldum, ben işim.', 'Yorulmak nedir, bilmiyorum artık.'],
    sleepyhead: ['Hep bir yorgunluk var üstümde.', 'Gözüm kapanıyor, dermanım yok.'],
    socialButterfly: ['Herkes dostum bu kasabada.', 'Sohbetsiz bir gün, gün müdür?'],
    introvert: ['Bana uzak durun, ben iyiyim.', 'Yalnızlık en iyi dostum.'],
    natureLover: ['Toprak beni çağırıyor.', 'Her yaprağın bir sözü var.'],
    ambitious: ['Zirveden aşağısı olmaz.', 'Gözüm hep yukarıda.'],
    cheerful: ['Dünya güzel, dünya benim!', 'İçim bayram yeri.'],
    grumpy: ['Beni sinirlendirmeyin.', 'Şu dünyadan bıktım usandım.'],
  },
  acquired: {
    hardworking: ['İşe sarılasım geldi birden.', 'Çalışmak iyi geliyor bana.'],
    sleepyhead: ['Eskisi gibi dinç değilim.', 'Uyku şu sıra çok çekici.'],
    socialButterfly: ['Meğer kalabalığı özlermişim.', 'İnsanlarla olmak iyi geliyor.'],
    introvert: ['Yalnız kalmak da güzelmiş.', 'Kendi sessizliğimi buldum.'],
    natureLover: ['Doğanın içinde olmayı sevmişim.', 'Dere kenarı çağırıyor beni.'],
    ambitious: ['Daha çok şey yapabilirim!', 'Gözüm yükseklerde artık.'],
    cheerful: ['Güneş yeniden doğdu içimde.', 'Gülümsemek ne kolaymış.'],
    grumpy: ['Dünya bana hiç adil değil.', 'Kolay kolay gülemiyorum artık.'],
  },
};

/** Değişimin nedeni (growthCause kaynak anahtarı -> günlükteki okunur hâli; "X, ..." cümlesinin başına gelir). */
export const CAUSE_TEXT = {
  'want:fulfilled': 'gerçekleşen dileklerin verdiği huzurla',
  'want:make_friend': 'edinilen dostlukların ardından',
  'want:quiet_day': 'sessiz günlerin ardından',
  'want:craft_masterwork': 'ömürlük bir eserin ardından',
  'want:level_up_skill': 'mesleğinde ilerledikçe',
  'fear:realized': 'başına gelen korkuların ardından',
  'fear:burnout': 'tükenmişliğin ardından',
  'fear:streak': 'üst üste gerçekleşen korkuların ardından',
  consoled: 'teselli edilince',
  consoler: 'dertlilere omuz verdikçe',
  masterwork: 'ustalığın verdiği güvenle',
  skill: 'mesleğinde ilerledikçe',
  graduated: 'çırağını yetiştirmenin gururuyla',
  grandmaster: 'çırağının Başusta oluşunun ardından',
  expedition: 'seferlerden döndükten sonra',
  married: 'evliliğin ardından',
  kindred: 'ruh ikizini bulunca',
  quarrel: 'sürüp giden atışmaların ardından',
  'tier:radiant': 'gönlü zengin günlerin ardından',
  'tier:fulfilled': 'doyumlu günlerin ardından',
  'tier:restless': 'huzursuz günlerin ardından',
  'tier:crushed': 'hayal kırıklığı dolu günlerin ardından',
  'moodlet:mourning': "Derin Yas'tan sonra",
  'moodlet:neglected': 'sesi duyulmayınca',
  'moodlet:heartbroken': 'kalbi kırılınca',
  'moodlet:euphoric': "Hayatının Günü'nün ardından",
  'moodlet:side_by_side': 'omuz omuza çalıştıkça',
  'moodlet:rubbing_wrong': 'diken üstünde çalışmaktan',
  'moodlet:flow_state': 'tezgâhta akışa girdikçe',
  'moodlet:proud_work': 'alın terinin gururuyla',
  'moodlet:exhausted': 'tükenip bitince',
  'moodlet:drudgery': 'angaryadan bıkınca',
  'moodlet:cold_wake': 'üşüyerek uyandıkça',
  'moodlet:warm_chat': 'tatlı sohbetlerin ardından',
  'moodlet:sour_encounter': 'tatsız karşılaşmaların ardından',
  'moodlet:lonely_ache': 'yalnızlık sızısının ardından',
  'moodlet:quiet_peace': 'iç huzurunu buldukça',
  'moodlet:nature_bliss': 'doğanın içinde keyif aldıkça',
  'moodlet:aesthetic_joy': 'güzelliklerle gönlü açıldıkça',
  'moodlet:farewell': 'anma töreninde helalleştikçe',
  'moodlet:forgotten': 'özel günü unutulunca',
};
export const CAUSE_KEYS = Object.keys(CAUSE_TEXT);

/** Panel eğilim ipucu: HINT_TEXT[eksen][plus | minus] (eğilimin yönü: artı / eksi kutba doğru). */
export const HINT_TEXT = {
  drive: { plus: 'İşine dört elle sarılıyor', minus: 'İşe gitmeye hevesi azalıyor' },
  company: { plus: 'İnsan içinde giderek açılıyor', minus: 'Giderek içine kapanıyor' },
  calling: { plus: 'Doğanın sesine kulak vermeye başladı', minus: 'Gözünü daha yükseklere dikiyor' },
  spirit: { plus: 'Yüzü gülmeye başladı', minus: 'Yüzü eskisi kadar gülmüyor' },
};

/** Değişim anısı ve günlük kaydı için tür başına kalıp ({name}: sakin, {cause}: neden, {from} / {to}: özellik adları, {deep}: derin ad). */
export const EVOLUTION_TEXT = {
  journal: {
    turned: '{name} artık eskisi gibi değil: {cause} {from} yanı söndü, {to} oldu.',
    deepened: '{name} artık eskisi gibi değil: {cause} {to} yanı derinleşti: {deep}.',
    acquired: '{name} artık eskisi gibi değil: {cause} {to} yanı ortaya çıktı.',
  },
  memory: {
    turned: '{cause}: {from} yanı söndü, {to} oldu',
    deepened: '{cause}: {to} yanı derinleşti ({deep})',
    acquired: '{cause}: {to} yanı ortaya çıktı',
  },
  noCause: 'Zamanla',
};
