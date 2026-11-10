// (29. aşama "Yaşayan Ruh", 29.1) Sosyal Kimya ve Duygusal Etiketler. Hesaplar src/systems/Chemistry.js (saf) ve
// src/systems/ChemistrySystem.js'te (olaylar, davranış); burada yalnızca sayılar, adlar ve sözler var.
//
// KİMYA: iki sakin arasındaki doğal çekim / itme; -2 (Doğal Zıtlık) ile +3 (Kozmik Çekim) arası bir tamsayı.
//   kimya = sınırla( kıvılcım + kişilik uyumu + huy rezonansı + zanaat bağı , -2, +3 )
//   kıvılcım       : kimlik çiftinden ve dünya tohumundan türeyen sabit pay (-1 / 0 / +1; izole üreteç: tohum + SEED_OFFSET).
//                    Ana üreteci ve Math.random'ı HİÇ tüketmez; aynı çift, aynı tohumda hep aynı kıvılcımı alır.
//   kişilik uyumu  : zıt özellikler (OPPOSING_TRAITS) -1; ortak ya da tamamlayan özellikler +1 (zıtlık baskındır)
//   huy rezonansı  : aynı huy ya da rezonanslı huy çifti +1 (Müzisyen + Şenlik Neşesi...); ötekiler nötr
//   zanaat bağı    : aynı atölyede (çıraklık yapısı: Zanaat Atölyesi, Oduncu, Dokuma Tezgâhı, Şifacı, Değirmen, Şerbethane) uzun süre
//                    birlikte çalışmış / aynı yapıya sabitlenmiş olmak, usta-çırak bağı ya da ikisinin de Başusta olması +1
//
// İLİŞKİ KAYDI: c.relationships[karşıKimlik] = { chemistry, craft, together, tags: [...], until: { etiket: bitiş dakikası } }
//   (together: aynı atölyede birlikte geçen saat sayacı; craftHours'a ulaşınca craft = true olur)
//   chemistry simetriktir (iki yönde aynı), etiketler YÖNLÜDÜR (A, B'ye minnettar olabilir; B, A'ya olmayabilir).
//   RULER_ID (0) sakin olmayan "Yönetim"dir: dilekçesi reddedilen sakin yönetime kırgın, dileği karşılanan minnettar olur.

export const CHEMISTRY_MIN = -2;
export const CHEMISTRY_MAX = 3;
export const CHEMISTRY_SEED_OFFSET = 37; // izole üreteç: tohum + 37 (36: Vadi Karakteri, 35: ömür)
export const RULER_ID = 0;

// Kıvılcımın dağılımı (ağırlıklar): çoğu çift nötr başlar; güçlü çekim (+2 / +3) azınlıkta kalır
export const SPARK_WEIGHTS = [
  [-1, 30],
  [0, 45],
  [1, 25],
];

// Birbirini tamamlayan kişilik özellikleri (sırası önemsiz)
export const COMPLEMENTARY_TRAITS = [
  ['ambitious', 'hardworking'], // Hırslı + Çalışkan: aynı tempoda
  ['cheerful', 'socialButterfly'], // Neşeli + Sosyal Kelebek: meydanın neşesi
  ['natureLover', 'introvert'], // Doğa Sever + İçine Kapanık: sessiz nehir kıyısı
  ['nightOwl', 'socialButterfly'], // Gece Kuşu + Sosyal Kelebek: ateş başı sohbetleri
  ['glutton', 'cheerful'], // Obur + Neşeli: sofra keyfi
  ['sleepyhead', 'introvert'], // Uykucu + İçine Kapanık: bankta sessizlik
];

// Özellik + meslek tamamlayıcılığı: özelliği taşıyan sakin, o meslekte en az minLevel kademesindeki sakinle uyumludur
// (Doğa Sever + Çiftçi / Çoban, Hırslı + Taşçı / Madenci, Obur + Aşçı / Fırıncı)
export const TRAIT_SKILL_COMPLEMENTS = {
  natureLover: ['farming', 'husbandry'],
  ambitious: ['masonry', 'mining'],
  glutton: ['cooking', 'baking'],
};
export const TRAIT_SKILL_MIN_LEVEL = 2; // Kalfa

// Huy rezonansları (sırası önemsiz). Aynı huy da rezonanstır. Listede olmayan çiftler nötrdür (ör. Zanaatkâr Ruhu + Hayvansever).
export const QUIRK_RESONANCE = [
  ['musician', 'festive'], // Müzisyen + Şenlik Neşesi
  ['bookworm', 'philosopher'], // Kitap Kurdu + Bilge Düşünür
  ['animalLover', 'natureEnthusiast'], // Hayvansever + Doğa Tutkunu
  ['craftsman', 'entrepreneur'], // Zanaatkâr Ruhu + Girişimci Kanı: biri üretir, biri satar
  ['natureEnthusiast', 'philosopher'], // Doğa Tutkunu + Bilge Düşünür: manzarada tefekkür
];

// Kimya seviyeleri. chat: sohbette ilişki puanı kazanç çarpanı; fun: olumlu keyif kazancının çarpanı; funFlat: sohbette
// dakika başına ek keyif (eksi: gergin sohbet, keyif kaçar); quarrel: atışma olasılığı çarpanı;
// romance: aşık olma olasılığı çarpanı (0: aşık olamazlar); romanceScore: aşk için gereken en düşük ilişki puanı
export const CHEMISTRY_LEVELS = {
  [-2]: { key: 'clash', name: 'Doğal Zıtlık', icon: '⌁⌁', chat: 0.5, fun: 1, funFlat: -0.12, quarrel: 2, romance: 0, romanceScore: Infinity },
  [-1]: { key: 'antipathy', name: 'Antipati', icon: '⌁', chat: 0.75, fun: 1, funFlat: -0.06, quarrel: 1.5, romance: 0, romanceScore: Infinity },
  0: { key: 'neutral', name: 'Nötr', icon: '', chat: 1, fun: 1, funFlat: 0, quarrel: 1, romance: 0, romanceScore: Infinity },
  1: { key: 'harmony', name: 'Uyum', icon: '⚡', chat: 1.2, fun: 1.2, funFlat: 0, quarrel: 1, romance: 1, romanceScore: 85 },
  2: { key: 'attraction', name: 'Güçlü Çekim', icon: '⚡⚡', chat: 1.5, fun: 1.5, funFlat: 0.05, quarrel: 0.5, romance: 2, romanceScore: 75 },
  3: { key: 'cosmic', name: 'Kozmik Çekim', icon: '✨⚡⚡', chat: 1.5, fun: 1.5, funFlat: 0.08, quarrel: 0.25, romance: 3.5, romanceScore: 65 },
};

// Zıt özelliği olmayan ama kimyası eksi iki sakin de atışabilir (olasılık, zıt özellikli atışmanın bu katı)
export const CHEMISTRY_QUARREL_SHARE = 0.5;
export const KINDRED_MIN_CHEMISTRY = 2;

// Duygusal etiketler. days: kaç gün sürer (null: kalıcı; koşulu bozulursa silinir); color: çipin rengi (styles/ui.css)
export const EMOTION_TAGS = {
  grateful: { name: 'Minnettar', icon: 'heart', color: 'grateful', days: 20, description: 'Yangında yardımına koşana, yarasını saran şifacıya, dileğini karşılayana duyduğu minnet.' },
  admiration: { name: 'Hayran', icon: 'masterpiece', color: 'admiration', days: 15, description: 'Bir Başustaya, Kıdemli Bilgeye ya da şaheser çıkaran ustaya duyduğu saygı.' },
  resentful: { name: 'Kırgın', icon: 'sulk', color: 'resentful', days: 5, description: 'Dilekçesi reddedildi, atışmada haksızlığa uğradı ya da aşkına karşılık bulamadı.' },
  jealous: { name: 'Kıskanç', icon: 'angry', color: 'jealous', days: 6, description: 'Aynı atölyede kendisinden hızlı yükselene ya da eşine ilgi gösterene karşı.' },
  kindred: { name: 'Ruh İkizi', icon: 'love', color: 'kindred', days: null, description: 'Kimyası çok güçlü iki sakin arasında zamanla filizlenen bağ.' },
};
export const EMOTION_TAG_KEYS = Object.keys(EMOTION_TAGS);

// Etiket kuralları
export const EMOTION_RULES = {
  quarrelResentDays: 2, // atışma kırgınlığı kısa sürer (barışınca hemen silinir)
  admireFun: 0.04, // hayran / minnettar olduğu kişiyle sohbette dakika başına ek keyif
  jealousChat: 0.5, // kıskandığı kişiyle sohbette ilişki puanı kazancı çarpanı
  jealousFun: -0.04,
  kindredScore: 75, // Ruh İkizi: kimya +2 / +3 ve ilişki "En İyi Arkadaş" seviyesine ulaşmış (zamanla filizlenir)
  craftHours: 24, // zanaat bağı: aynı atölyede bu kadar saat başında birlikte çalışmış olmak
  elderAdmireScore: 40, // sohbet ettiği Kıdemli Bilgeye, dostuysa hayran olur
  healerLevel: 2, // kulübede o an çalışan yoksa minnet, en usta şifacıya (en az Kalfa) gider
  admireScore: 75, // şaheser çıkaran ustaya / yeni Başustaya en iyi arkadaşları da hayran olur
  admireLimit: 2, // bir sakin en çok bu kadar kişiye hayran olur (yenisi gelince en eskisi silinir)
  kindredLimit: 1, // bir sakinin en çok bu kadar ruh ikizi olur (ruh ikizi tektir)
  crushScore: 40, // karşılıksız aşk: bu puanın üstünde ve kimyası olumlu bir bekâr, sevdiği başkasına aşık olunca kırılır
  jealousBelow: 40, // terfi kıskançlığı: yalnızca dost OLMAYAN iş arkadaşına
  rivalAttention: 2, // eşe ilgi kıskançlığı: eşiyle sohbet eden bekârın eşle kimyası en az bu
  treatFun: 5, // ikram: ikram edilenin keyfi
  treatHunger: 4, // ... ve tokluğu
  treatGiverFun: 2, // ikram edenin keyfi
  helpTiles: 10, // minnettar olduğu kişinin çalıştığı iş bu kadar karo yakınmış gibi seçilir
  gratefulVenue: 2.5, // minnettar olduğu kişinin oturduğu toplanma yerinin boş zaman ağırlığı çarpanı
  resentVenue: 0.1, // kırgın olduğu kişinin oturduğu yerin ağırlık çarpanı (aynı masadan kaçınır)
  resentChat: 0, // kırgın olduğu kişiyle sohbette ilişki puanı kazancı çarpanı
  resentFun: -0.08, // ... ve dakika başına keyif
  encounterRadius: 16, // piksel: yolda karşılaşma
  encounterCooldown: 1440, // aynı çift bu kadar oyun dakikası sonra yeniden parıldar / selamlaşır
  speechSeconds: 3,
  sparkSeconds: 2.4,
};

// Selamlaşma sözleri: etiketi taşıyan sakin, etiketin hedefiyle yolda karşılaşınca söyler ({name}: karşıdakinin adı)
export const TAG_GREETINGS = {
  grateful: ['Ustam, sana minnettarım!', 'İyiliğini unutmadım {name}!', 'Sağ ol {name}, var ol!'],
  admiration: ['Elinize sağlık ustam!', 'Sizden çok şey öğreniyorum.', 'Hürmetler {name}!'],
  resentful: ['Yine mi sen...', 'Hıh.', 'Seninle konuşacak sözüm yok.'],
  jealous: ['Bakıyorum keyfin yerinde...', 'Herkes seni konuşuyor, ne âlâ.', 'Şansın yaver gidiyor {name}.'],
  kindred: ['Seni görmek ne güzel {name}!', 'Aklımdan geçiyordun!', 'Canım dostum!'],
};
export const SPARK_GREETINGS = ['Kalbim küt küt...', 'Ne hoş bir tesadüf!', 'Sen... merhaba!'];
export const TREAT_LINES = ['Buyur, ikramım olsun!', 'Bu benden {name}!', 'Bir lokma da sen al.'];
// Etiket selamında gösterilen ikon balonu (ikon balonundan ayrı olarak söz de çıkar)
export const TAG_BUBBLES = { grateful: 'heart', admiration: 'sparkle', resentful: 'sulk', jealous: 'sulk', kindred: 'heart' };
