// (29.2 "Yaşayan Ruh") Dinamik ruh halleri (moodlet), yas ve teselli. Saf hesaplar src/systems/Moodlets.js'te, olaylar ve
// davranış src/systems/MoodletSystem.js'te; burada yalnızca sayılar, adlar ve sözler var.
//
// c.moodlets = [{ key, tier, since, until, reason, whoId?, whoName?, harsh?, comfortedAt? }]
//   Üç katman, katman başına tavan (toplam en çok 6):
//     core   (1) : derin travmalar ve zaferler (yas, sarsıntı, kalp kırıklığı, ihmal, coşku, ilham)
//     action (3) : günlük eylem x kişilik / huy rezonansı (üretim gururu, angarya, damak şöleni, tatlı sohbet, teselli...)
//     need   (2) : anlık ihtiyaç ve çevre baskısı (tükenmiş, aç, yalnız, ıslak, doğa keyfi, estetik)
//   tier: şiddet kademesi; etkinin 1'den sapması TIER_SCALE ile çarpılır (minor 1, major 1,5, critical 2).
//   until: bitiş dakikası (state.totalMinutes); koşula bağlı ihtiyaç moodlet'lerinde null (koşul geçince silinir).
//
// Etkiler (hepsi çarpan; 1 = etkisiz): workMul iş hızı, moveMul yürüme, joyRateMul keyfin AZALMA hızı (küçük = iyi),
// socialMul sohbette sosyallik / keyif kazancı, xpMul meslek deneyimi, energyMul enerjinin azalma hızı, quarrelMul atışma
// olasılığı, scareMul karanlıkta ürkme; masterwork: usta işi eser şansına EKLENEN pay (0,02 = +%2).
// Davranış bayrakları (Brain): shirk ağır işten kaçar / erken dinlenir, focus mola vermez ve tezgâhta uzun kalır,
// seek dost arar (İçine Kapanık tenha köşe arar), grief eğlenceye ve flörte girmez.

export const MOODLET_SEED_OFFSET = 38; // izole üreteç: tohum + 38 (yalnızca söz seçimi ve söz olasılığı)
export const MOODLET_CAPS = { core: 1, action: 3, need: 2 };
export const MOODLET_LAYERS = ['core', 'action', 'need'];
export const TIER_SCALE = { minor: 1, major: 1.5, critical: 2 };
export const TIER_NAMES = { minor: 'hafif', major: 'güçlü', critical: 'çok güçlü' };

// tone: positive | negative | trauma (çip rengi ve baskın ruh hali işareti); weight: baskın ruh halindeki ağırlığı;
// priority: aynı katmanda yer kalmayınca düşük öncelikli olan çıkar (çekirdekte: yeni olan ancak eşit / yüksek öncelikliyse yerleşir)
export const MOODLETS = {
  // --- Katman A: eylem x kişilik ---
  proud_work: { name: 'Alın Teri', layer: 'action', tone: 'positive', icon: 'hammer', hours: 8, weight: 2, priority: 3, feel: 'Keyifli', effects: { workMul: 1.08, joyRateMul: 0.85 }, focus: true },
  drudgery: { name: 'Angarya Bıkkınlığı', layer: 'action', tone: 'negative', icon: 'sweat', hours: 6, weight: 2, priority: 4, feel: 'Bıkkın', effects: { workMul: 0.9, joyRateMul: 1.25 }, shirk: true },
  flow_state: { name: 'Ustalık Akışı', layer: 'action', tone: 'positive', icon: 'masterpiece', hours: 10, weight: 3, priority: 5, feel: 'İlhamlı', effects: { workMul: 1.12, xpMul: 1.25, masterwork: 0.02 }, focus: true },
  feast_bliss: { name: 'Damak Şöleni', layer: 'action', tone: 'positive', icon: 'sherbet', hours: 8, weight: 2, priority: 2, feel: 'Keyifli', effects: { joyRateMul: 0.7, energyMul: 0.9 } },
  raw_ration: { name: 'Kuru Tayın', layer: 'action', tone: 'negative', icon: 'apple', hours: 6, weight: 1, priority: 2, feel: 'Bıkkın', effects: { joyRateMul: 1.15 } },
  well_rested: { name: 'Deliksiz Uyku', layer: 'action', tone: 'positive', icon: 'zzz', hours: 10, weight: 2, priority: 2, feel: 'Dingin', effects: { moveMul: 1.08, workMul: 1.06 } },
  cold_wake: { name: 'Üşüyerek Uyandı', layer: 'action', tone: 'negative', icon: 'cold', hours: 8, weight: 2, priority: 4, feel: 'Yorgun', effects: { workMul: 0.9, moveMul: 0.92 }, shirk: true },
  warm_chat: { name: 'Tatlı Sohbet', layer: 'action', tone: 'positive', icon: 'chat', hours: 6, weight: 1, priority: 1, feel: 'Keyifli', effects: { socialMul: 1.2 } },
  sour_encounter: { name: 'Tatsız Karşılaşma', layer: 'action', tone: 'negative', icon: 'angry', hours: 8, weight: 2, priority: 3, feel: 'Bıkkın', effects: { joyRateMul: 1.2, quarrelMul: 1.3 }, seek: true },
  quiet_peace: { name: 'İç Huzuru', layer: 'action', tone: 'positive', icon: 'book', hours: 8, weight: 2, priority: 2, feel: 'Dingin', effects: { workMul: 1.08, joyRateMul: 0.8 } },
  // Teselli eylem katmanındadır: çekirdekteki travmayla birlikte durur ve onun cezalarını yarıya indirir
  comforted: { name: 'Yüreği Ferahladı', layer: 'action', tone: 'positive', icon: 'handshake', hours: 24, weight: 2, priority: 6, feel: 'Dingin', effects: {}, soothes: 0.5 },

  // --- Katman B: ihtiyaç ve çevre ---
  exhausted: { name: 'Tükenmiş', layer: 'need', tone: 'negative', icon: 'zzz', hours: null, weight: 3, priority: 6, feel: 'Yorgun', effects: { moveMul: 0.82, workMul: 0.8 }, shirk: true },
  hangry: { name: 'Açlıktan Gözü Dönmüş', layer: 'need', tone: 'negative', icon: 'apple', hours: null, weight: 3, priority: 5, feel: 'Bıkkın', effects: { workMul: 0.85, joyRateMul: 1.4 } },
  lonely_ache: { name: 'Yalnızlık Sızısı', layer: 'need', tone: 'negative', icon: 'sulk', hours: null, weight: 2, priority: 4, feel: 'Kederli', effects: { joyRateMul: 1.3 }, seek: true },
  drenched: { name: 'Sırılsıklam', layer: 'need', tone: 'negative', icon: 'sneeze', hours: 3, weight: 1, priority: 2, feel: 'Bıkkın', effects: { joyRateMul: 1.15, moveMul: 0.95 } },
  chilled: { name: 'Donuyor', layer: 'need', tone: 'negative', icon: 'cold', hours: 3, weight: 2, priority: 3, feel: 'Yorgun', effects: { joyRateMul: 1.2, workMul: 0.94, moveMul: 0.94 } },
  nature_bliss: { name: 'Doğa Keyfi', layer: 'need', tone: 'positive', icon: 'herb', hours: 4, weight: 2, priority: 2, feel: 'Dingin', effects: { joyRateMul: 0.8, workMul: 1.05 } },
  aesthetic_joy: { name: 'Gözü Gönlü Açıldı', layer: 'need', tone: 'positive', icon: 'sparkle', hours: 6, weight: 1, priority: 1, feel: 'Keyifli', effects: { joyRateMul: 0.85 } },

  // --- Katman C: travmalar ve zaferler ---
  mourning: { name: 'Derin Yas', layer: 'core', tone: 'trauma', icon: 'candle', hours: 72, weight: 6, priority: 6, feel: 'Kederli', effects: { moveMul: 0.85, workMul: 0.8, joyRateMul: 1.4 }, grief: true, consolable: true },
  heartbroken: { name: 'Kalbi Kırık', layer: 'core', tone: 'trauma', icon: 'sulk', hours: 36, weight: 4, priority: 5, feel: 'Kederli', effects: { socialMul: 0.75, joyRateMul: 1.15 }, consolable: true },
  shaken: { name: 'Sarsılmış', layer: 'core', tone: 'trauma', icon: 'fire', hours: 24, weight: 4, priority: 4, feel: 'Sarsılmış', effects: { workMul: 0.9, scareMul: 2 }, consolable: true },
  neglected: { name: 'Sesimiz Duyulmadı', layer: 'core', tone: 'trauma', icon: 'scroll', hours: 36, weight: 3, priority: 3, feel: 'Kırgın', effects: { joyRateMul: 1.1 }, harshEffects: { workMul: 0.9 } },
  euphoric: { name: 'Hayatının Günü', layer: 'core', tone: 'positive', icon: 'love', hours: 48, weight: 6, priority: 3, feel: 'Coşkulu', effects: { workMul: 1.15, joyRateMul: 0.5 } },
  inspired: { name: 'İlham Dolu', layer: 'core', tone: 'positive', icon: 'melody', hours: 24, weight: 4, priority: 2, feel: 'İlhamlı', effects: { xpMul: 1.3, masterwork: 0.03 }, focus: true },
};
export const MOODLET_KEYS = Object.keys(MOODLETS);
// Toplam çarpanların sınırları: altı moodlet üst üste binse de etki bu aralıkta kalır (enflasyon / çöküş olmaz)
export const MOOD_LIMITS = { workMul: [0.6, 1.25], moveMul: [0.7, 1.15], joyRateMul: [0.45, 2.2], socialMul: [0.5, 1.5], xpMul: [0.5, 1.6], energyMul: [0.8, 1.3], quarrelMul: [0.5, 3], scareMul: [1, 3] };
export const NEUTRAL_FEEL = 'Dengeli';

// Tetikleme kuralları
export const MOOD_RULES = {
  heavyWork: ['mine', 'quarry', 'mineIron', 'build'], // ağır işler (Maden, Taş Ocağı, İnşaat)
  drudgeryEnergy: 35, // bu enerjinin altında ağır işte çalışan bıkar
  proudTraits: ['hardworking', 'ambitious'],
  proudQuirk: 'craftsman',
  // Kişiliğe ters işler (etkinlik adları): Doğa Sever yer altını, Hırslı tarla işini sevmez
  misfit: { natureLover: ['mine', 'quarry', 'mineIron'], ambitious: ['farm', 'forage'], introvert: ['teach'] },
  flowEnergy: 50, // Ustalık Akışı: enerji ve keyif bunun ÜSTÜNDE olmalı (> %50)
  flowFun: 50,
  flowStreak: 2, // kendi uzmanlık yapısında art arda bu kadar üretim
  feastStrongTraits: ['glutton', 'cheerful'],
  rationFoodPerHead: 2, // kişi başı yiyecek değeri bunun altındaysa "kıtlık"
  restedEnergy: 95,
  restedHunger: 55, // deliksiz uyku: karnı da tok uyanmış olmalı (aç uyanan dinlenmiş sayılmaz)
  coldWakeEnergy: 50,
  chatStrong: { traits: ['socialButterfly'], quirks: ['festive'] },
  sourStrongTraits: ['grumpy'],
  warmVenues: ['gazebo', 'inn'],
  quietActivities: ['readLibrary', 'readBench', 'river', 'viewpoint', 'shade', 'flowers', 'bench', 'stroll'],
  quietTraits: ['introvert', 'natureLover'],
  quietQuirks: ['bookworm', 'philosopher'],
  quietCrowd: 2, // yakınında (48 piksel) bundan fazla sakin varsa "tenha" sayılmaz
  quietRadius: 48,
  exhausted: 20, // enerji eşiği (iyileşme: +10)
  hangry: 25,
  lonely: 25,
  lonelySocial: 40, // Sosyal Kelebek'te eşik
  recover: 10, // ihtiyaç eşiğin bu kadar üstüne çıkınca moodlet silinir
  hangryGrumpyQuarrel: 2, // Huysuz + aç: atışma olasılığı çarpanı
  outdoorWork: ['farm', 'forage', 'herd', 'chop', 'fish', 'gatherHerbs'],
  aestheticAt: 2.5, // "güzel sokak" eşiği (data/landscape.js -> AESTHETIC.pleasantThreshold ile aynı)
  shakenRadius: 96, // piksel: kazaya tanık olma uzaklığı
  neglectTrust: 50, // güven bunun altındaysa "Sesimiz Duyulmadı" işi de yavaşlatır
  inspiringChemistry: 2,
  bardRadius: 150,
  rivalLevel: 'rival',
  speechChance: 0.6, // moodlet oluşunca söz söyleme olasılığı (izole üreteç)
  speechSeconds: 3.2,
  bubbleSeconds: 2.4,
  shirkEnergyBonus: 12, // shirk: enerji eşiği bu kadar yükselir (erken dinlenir)
  focusDuration: 1.15, // focus: iş görevi bu kat uzun sürer
  seekChemistry: 25, // seek: dost seçerken kimya puanı başına karo-piksel indirimi
  grieveVenues: ['monument', 'gazebo', 'shade'],
};

// Teselli
export const CONSOLE = {
  minScore: 40, // dost: ilişki puanı en az bu
  minChemistry: 0,
  minutes: 12, // yan yana bu kadar oyun dakikası
  radius: 40, // piksel
  shorten: 0.4, // travmanın KALAN süresi bu oranda kısalır
  relationship: 12,
  cooldownMinutes: 180, // aynı teselli eden bu süre yeniden teselliye çıkmaz
};

// Baskın ruh hali: net ağırlık bu eşiklerin dışındaysa en ağır moodlet'in hissi, içindeyse "Dengeli"
export const DOMINANT_THRESHOLD = 1;

// Tetiklenme nedenleri (kartta görünür). {who}: kişi adı
export const MOOD_REASONS = {
  proud_trait: 'Çalışkan doğası gereği üretimden gurur duydu',
  proud_ambitious: 'Hırsı işini bitirince tatmin oldu',
  proud_craft: 'Zanaatkâr ruhu tezgâh başında şevke geldi',
  proud_loved: 'Sevdiği meslekte çalıştı',
  drudgery_sleepy: 'Uykucu bedeni ağır işe isyan etti',
  drudgery_tired: 'Yorgunken ağır işte çalıştırıldı',
  drudgery_misfit: 'Doğasına ters bir işte çalıştı',
  flow: 'Kendi tezgâhında art arda üretti',
  feast_inn: 'Handa sıcak yemek yedi',
  feast_sherbet: 'Soğuk şerbet içti',
  feast_table: 'Ziyafet sofrasından ikram aldı',
  ration_winter: 'Kışın tek tip soğuk erzakla karnını doyurdu',
  ration_scarce: 'Kıtlıkta kuru erzakla yetindi',
  rested_stone: 'Taş evinde deliksiz uyudu',
  rested_warm: 'Sıcak odada deliksiz uyudu',
  rested_home: 'Eşinin yanında huzurla uyudu',
  cold_room: 'Soğuk odada uyandı',
  cold_homeless: 'Başını sokacak bir evi yokken uyandı',
  cold_tired: 'Dinlenemeden uyanmak zorunda kaldı',
  chat_friend: '{who} ile tatlı bir sohbet etti',
  chat_venue: 'Çardakta / handa hoş vakit geçirdi',
  sour_chat: '{who} ile gergin bir sohbet etti',
  sour_quarrel: '{who} ile atıştı',
  quiet: 'Kalabalıktan uzakta kendini dinledi',
  quiet_read: 'Sessizce kitabına daldı',
  comforted: '{who} onu teselli etti',
  exhausted: 'Enerjisi tükendi',
  hangry: 'Karnı zil çalıyor',
  lonely: 'Günlerdir kimseyle dertleşmedi',
  drenched: 'Yağmurda sırılsıklam oldu',
  chilled: 'Paltosuz soğukta kaldı',
  nature_rain: 'Yağmurun tadını çıkardı',
  nature_work: 'Açık havada, toprağın içinde çalıştı',
  aesthetic: 'Çiçekli, bakımlı bir sokakta vakit geçirdi',
  mourn_spouse: 'Eşi {who} vefat etti',
  mourn_parent: 'Ebeveyni {who} vefat etti',
  mourn_child: 'Evladı {who} vefat etti',
  mourn_kindred: 'Ruh ikizi {who} vefat etti',
  mourn_master: 'Ustası {who} vefat etti',
  mourn_pupil: 'Çırağı {who} vefat etti',
  shaken_fire: 'Yangının ortasında kaldı',
  shaken_burned: 'Evi / iş yeri gözünün önünde yandı',
  shaken_injured: 'Yaralandı',
  shaken_witness: '{who} gözünün önünde can verdi',
  heart_unrequited: '{who} başkasına gönül verdi',
  heart_rival: '{who} ile araları onarılmaz biçimde bozuldu',
  neglect_rejected: 'Dilekçesi reddedildi',
  neglect_expired: 'Dilekçesi yanıtsız kaldı',
  euphoric_wed: '{who} ile evlendi',
  euphoric_child: 'Evladı {who} dünyaya geldi',
  euphoric_master: 'Başusta oldu',
  inspired_work: 'Usta işi bir eser ortaya koydu',
  inspired_date: '{who} ile unutulmaz bir randevuya çıktı',
  inspired_bard: 'Seyyar Ozan\'ın ezgisini dinledi',
};

// Moodlet oluşunca söylenen sözler ({who}: kişi adı). Kişiliğe özgü sözler önce denenir (TRAIT_LINES).
export const MOOD_LINES = {
  proud_work: ['Tam bana göre bir iş!', 'Alnımın teriyle!', 'İşte böyle olur.'],
  drudgery: ['Sırtım koptu...', 'Bu iş bitmek bilmiyor.', 'Bir soluk alsam...'],
  flow_state: ['Elim kendiliğinden gidiyor.', 'Bugün tezgâh benimle konuşuyor.'],
  feast_bliss: ['Sıcak çorba gibisi yok!', 'Oh, kana kana!', 'Ellerine sağlık!'],
  raw_ration: ['Yine mi kuru ekmek...', 'Sıcak bir tas çorba olsaydı.'],
  well_rested: ['Mışıl mışıl uyudum!', 'Bugün dağları deviririm.'],
  cold_wake: ['Kemiklerim sızlıyor...', 'Brr, oda buz gibi.'],
  warm_chat: ['Ne güzel sohbetti!', 'İçim ısındı.'],
  sour_encounter: ['Keyfimi kaçırdı.', 'Hıh, ne yüzsüzlük!'],
  quiet_peace: ['Sessizlik ne güzel.', 'Kafam dinlendi.'],
  comforted: ['Yüreğime su serptin.', 'İyi ki varsın {who}.'],
  exhausted: ['Ayakta uyuyorum...', 'Dizlerimde derman kalmadı.'],
  hangry: ['Açlıktan gözüm döndü!', 'Bir lokma ekmek!'],
  lonely_ache: ['Kimsem yok mu?', 'Bir dost sesi olsa...'],
  drenched: ['İliklerime kadar ıslandım!', 'Bu yağmur da ne böyle.'],
  chilled: ['Dondum...', 'Bir palto olsaydı.'],
  nature_bliss: ['Toprak kokusu!', 'Yağmur ne güzel yağıyor.'],
  aesthetic_joy: ['Kasabamız ne güzel olmuş.', 'Gözüm gönlüm açıldı.'],
  mourning: ['Seni hiç unutmayacağım...', 'Yerin dolmaz {who}.', 'Nur içinde yat {who}.'],
  shaken: ['Hâlâ ellerim titriyor.', 'Gözümün önünden gitmiyor.'],
  heartbroken: ['Kalbim paramparça.', 'Demek öyle...'],
  neglected: ['Sesimizi duyan yok.', 'Boşuna yazmışım.'],
  euphoric: ['Hayatımın en güzel günü!', 'Dünyalar benim oldu!'],
  inspired: ['Aklıma neler geliyor!', 'İçimde bir kıpırtı var.'],
};
// Kişiliğe özgü söz: moodlet -> özellik / huy -> söz
export const TRAIT_LINES = {
  proud_work: { hardworking: 'Çalışmak ibadettir!', ambitious: 'Daha iyisini de yaparım!', craftsman: 'Elimin emeği, gönlümün işi.' },
  drudgery: { sleepyhead: 'Şurada bir kestirsem...', natureLover: 'Güneşi özledim.' },
  feast_bliss: { glutton: 'Bir tabak daha alırım!', cheerful: 'Sofra keyfi başka!' },
  well_rested: { sleepyhead: 'Yatağım, canım yatağım!' },
  sour_encounter: { grumpy: 'Bugün kimse bana bulaşmasın!' },
  quiet_peace: { introvert: 'Yalnızlık da bir dosttur.', bookworm: 'Bir bölüm daha okusam.', philosopher: 'Sessizlikte düşünce demlenir.', natureLover: 'Kuş sesleri yeter bana.' },
  warm_chat: { socialButterfly: 'Sohbetin tadına doyamadım!', festive: 'Bir şerbet daha, bir sohbet daha!' },
  nature_bliss: { natureLover: 'Yağmuru seven ıslanmaz!' },
  hangry: { grumpy: 'Aç adamın sabrı olmaz!', glutton: 'Midem sırtıma yapıştı!' },
};

// Teselli sözleri ve yas metinleri
export const CONSOLE_LINES = ['Başın sağ olsun, yanındayım.', 'Geçecek, hep birlikteyiz.', 'Acını paylaşmaya geldim.'];
export const GRIEVE_LABEL = '{who} aziz hatırasını anıyor'; // {who}: tamlayan ekiyle ("Deniz'in")
export const GRIEVE_FALLBACK = 'Anılara dalmış, sessizce duruyor';
