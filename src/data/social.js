// Sosyal yaşam (19. aşama): flört ve randevular, düğün kutlaması, evli çiftlerin akşam yemeği, karakter huyları
// ve kasaba dedikodusu. Hesaplar src/systems/SocialSystem.js ve src/ai/Brain.js'te; burada yalnızca sayılar ve adlar var.

// Flört: bekâr iki yetişkinin ilişkisi crushScore'u (Dost) geçtiyse (ya da zaten sevgililerse) boş zamanlarında birbirlerini
// randevuya çağırırlar. Brain her boş zaman kararında chance (sevgililer partnerChance) olasılıkla randevu planlar;
// aynı sakin cooldownMinutes boyunca yeniden randevu istemez. Randevu yerleri: çardak (baş başa), han (aynı masa;
// yalnızca akşam açıkken) ve yan yana iki bank (en çok benchGap karo aralıklı). Randevudaki çift birlikteyken
// dakikada bonusRate fazladan ilişki puanı ve funPerMinute keyif kazanır; banktaki çift de aşık olabilir / evlenebilir.
export const DATING = {
  crushScore: 40, // "Dost" seviyesi
  chance: 0.35,
  partnerChance: 0.55,
  cooldownMinutes: 240,
  bonusRate: 0.12,
  funPerMinute: 0.25,
  socialPerMinute: 1.1,
  benchGap: 3,
  nearPixels: 40, // randevudakiler bu kadar yakınsa "birlikte" sayılır
  venues: { gazebo: 3, inn: 2, bench: 1.5 }, // yer seçim ağırlıkları
};

// Düğün kutlaması: evlenen çift ve en çok guests kadar dostu (ilişki puanı en az guestScore, uyanık, seferde değil)
// kasaba meydanında (havuz başı) minutes dakika kutlar: konfeti yağar, el çırpılır. Kutlamaya katılanların keyfi
// funPerMinute dolar ve Yaşam Günlüğü'ne "düğününde konfeti attı" anısı düşer.
export const WEDDING_PARTY = { minutes: 45, guests: 6, guestScore: 25, funPerMinute: 0.6 };

// Ortak yaşam: evli ve aynı evde yaşayan çift akşam (from-to) evde birlikte yemek yer. Biri acıkınca
// (tokluk hungerBelow'un altında) eşini sofraya çağırır; birlikte yerken ikisinin keyfi ve sosyalliği dolar,
// ertesi sabah Mutlu Yuva moraliyle uyanırlar. Çift günde bir kez birlikte yer.
export const HOME_DINNER = { from: 18, to: 20.5, hungerBelow: 80, funPerMinute: 0.35, socialPerMinute: 0.9 };

// Karakter huyları: her sakine (çocuklar dahil) bir huy düşer. leisure: boş zaman tercih ağırlıkları (Brain.planLeisure).
//   animalLover      : kediyi / köpeği görünce yanına gidip sever (keyif +petFun, kedi mırlar)
//   bookworm         : Bilgelik Evi'nde ya da fener altındaki bir bankta kitap okur
//   musician         : akşamları handa ya da meydan havuzunda çalar; çevredeki en çok listeners sakinin keyfi dolar
//   natureEnthusiast : süs ağaçlarının gölgesinde ya da nehir kenarında manzarayı izleyip dinlenir
export const QUIRKS = {
  animalLover: {
    name: 'Hayvansever',
    icon: 'paw',
    description: 'Sokakta bir kedi ya da köpek görünce yanına gidip başını okşar; hayvanlar da onu çok sever.',
    leisure: { petAnimal: 3 },
  },
  bookworm: {
    name: 'Kitap Kurdu',
    icon: 'book',
    description: "Serbest zamanında Bilgelik Evi'ne ya da fener altındaki bir banka gidip kitap okur.",
    leisure: { readLibrary: 2.2, readBench: 2.2 },
  },
  musician: {
    name: 'Müzisyen',
    icon: 'lute',
    description: 'Akşamları handa ya da meydan havuzunun başında melodiler çalar; dinleyenlerin keyfi hızla yükselir.',
    leisure: { music: 3.5 },
  },
  natureEnthusiast: {
    name: 'Doğa Tutkunu',
    icon: 'leaf',
    description: 'Süs ağaçlarının gölgesinde ya da nehir kenarında manzarayı izleyip dinlenir.',
    leisure: { viewpoint: 3 },
  },
};
export const QUIRK_KEYS = Object.keys(QUIRKS);

// Huyların sayıları
export const QUIRK_RULES = {
  petFun: 10, // hayvan severken bir kez
  petSearchTiles: 22, // bu kadar karo yakındaki kedi / köpeğe yürür
  petSeenTiles: 9, // bu kadar yakında bir hayvan "görürse" tercih ağırlığı seenBoost katına çıkar
  seenBoost: 2.5,
  petHoldMinutes: 25, // sakin yürürken hayvan bekler
  lanternBenchTiles: 3, // fenere bu kadar yakın bank "fener altı" sayılır
  musicFrom: 17, // müzisyen bu saatten sonra çalar (gece yarısına dek)
  musicTo: 24,
  listenRadius: 44, // piksel: dinleyici uzaklığı
  listeners: 4, // en çok kaç dinleyici
  listenFunPerMinute: 0.55,
  musicianFunPerMinute: 0.4,
  listenBoost: 1.6, // müzik çalarken handa / meydanda olmak isteyenler (ağırlık çarpanı)
  viewTreeStage: 1, // Doğa Tutkunu genç fidanın gölgesine de oturur (diğerleri yalnızca ulu ağaca)
};

// Dedikodu: büyük olaylar bir "haber" olur (usta işi eser, seferden dönüş, barışma, düğün, festival / şenlik).
// Olayın kahramanları haberi bilir; sakinler sohbette (dakikada chatChance) ya da yolda karşılaşıp selamlaşınca
// (greetRadius piksel, dakikada greetChance; aynı ikili greetCooldown dakika ara verir) bilmeyene anlatır.
// Haberi ilk kez duyan sakinin Yaşam Günlüğü'ne küçük bir not düşer. Haberler maxAgeDays gün dolaşır; en çok
// maxItems haber tutulur. Haber kasabanın spreadShare'ine ulaşınca günlüğe "dilden dile dolaştı" yazılır.
export const GOSSIP = {
  chatChance: 0.06,
  greetChance: 0.35,
  greetRadius: 14,
  greetCooldown: 180,
  maxAgeDays: 4,
  maxItems: 12,
  spreadShare: 0.75,
  reconcilePerDay: 1, // barışma haberi günde en çok bu kadar
  memoryKeep: 6, // Yaşam Günlüğü'nde en çok bu kadar dedikodu notu (en eskisi silinir; aşk, düğün, dostluk kalır)
};
