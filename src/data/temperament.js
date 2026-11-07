// (25. aşama, 25.3) Mizaç kalıtımı ve kişilik gelişimi. Hesaplar src/systems/TemperamentSystem.js'te; burada sayılar ve sözler.
//
// İlke: kuruluş sakinlerinin ve göçmenlerin huyları 19. aşamadaki gibi kalır (dört huy). Kasabanın Altın Çağı başladıktan sonra
// yetişen kuşak, evre geçişlerinde mizacını yeniden biçimlendirir ve dört yeni nesil huydan birini de edinebilir:
//   Çocuk -> Genç  : Aile etkisi (ebeveynlerinden birinin huyu, family olasılığıyla) ya da özgün gelişim (kasabada en az görülen
//                     huy; sekizi de aday, eşitlikte bu katmanın üreteci seçer).
//   Genç -> Yetişkin: Usta etkisi: çıraklığını en az mentorFrom ilerlemeyle bitiren genç mentor olasılıkla ustasının huyunu ya da
//                     mesleğin doğasındaki huyu (Demirci -> Zanaatkâr Ruhu...) alır; olmazsa mizacı yine aile etkisiyle ya da
//                     özgün olarak olgunlaşır.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 29); ana üreteç ve öteki üreteçler hiç tüketilmez.
export const DEVELOPMENT = {
  family: 0.6, // ebeveyninin huyunu miras alma olasılığı (ebeveyninin bir huyu varsa)
  mentorFrom: 50, // usta etkisi için en az çıraklık ilerlemesi
  mentor: 0.6, // usta etkisi olasılığı
  mentorOwnQuirk: 0.5, // usta etkisinde ustanın kendi huyunun (mesleğin doğası yerine) seçilme olasılığı
};

// Mesleğin doğası: çıraklık yapısı -> huy
export const PROFESSION_QUIRKS = {
  workshop: 'craftsman',
  lumberHut: 'craftsman',
  loom: 'craftsman',
  healerHut: 'philosopher',
  mill: 'festive',
  brewery: 'festive',
};

// Yeni huyların sayıları
export const TEMPERAMENT = {
  craftWorkSpeed: 1.08, // Zanaatkâr Ruhu çıraklık / zanaat yapılarında
  craftFunCost: 0.6, // ... çalışırken keyif kaybı çarpanı
  craftKeep: 2, // Pazar'da satmadan çantasında sakladığı çırak işi
  craftShop: { item: 'noviceNails', price: 3 }, // Pazar'dan aldığı malzeme
  shopBoost: { entrepreneur: 2.5, craftsman: 1.5 }, // Pazar'a gitme olasılığı çarpanı
  thriftReserve: 30, // Girişimci kesesinde bundan azı kalacaksa alışveriş yapmaz
  thriftBonus: 1, // Girişimcinin her yevmiyesine pazarlık payı
  contractFun: 6, // ihracat sözleşmesi tamamlanınca Girişimcinin keyfi
  sageAdvice: 2, // Bilge Düşünür Kıdemli Bilge nasihatinden bu kat moral alır
  festiveJugMin: 1, // Şenlik Neşesi handa bu kadar fıçı varken bile testi alır (öteki sakinler 3)
  festiveJugs: 2, // çantasında taşıdığı testi
  festiveDrinkBelow: 60, // keyfi bunun altına inince testiden içer (öteki sakinler 35)
  festiveAura: { radius: 36, perMinute: 0.03 }, // boş zamanında / şenlikte yanındakilerin keyfi
  speechPerMinute: 0.006, // mizaç sözü olasılığı (boş zamanda / işte; kendi üreteciyle)
  speechSeconds: 3.2,
};

// Mizaç sözleri (metin baloncuğu; ikon balonuna dokunmaz)
export const TEMPERAMENT_LINES = {
  craftsman: ['Bu tezgâh bana göre!', 'Bir çivi, bir ilmek, bir eser...', 'Elimin emeği, gönlümün işi.', 'Şu rendeyi bir bileyeyim.'],
  entrepreneur: ['Ucuza al, değerinde sat!', 'Bir akçe bir akçedir.', 'Kervan ne zaman geliyor?', 'Bu işten kâr çıkar!'],
  philosopher: ['Bilmek, iki kere yaşamaktır.', 'Her soru bir kapı açar.', 'Kitaplar sabırlı dostlardır.', 'Zaman da bir öğretmen...'],
  festive: ['Haydi bir şerbet içelim!', 'Çalsın davullar!', 'Bu akşam şenlik var!', 'Gülmek bedava, komşular!'],
};

// Kalıtımın kaynağı (c.quirkOrigin.kind) -> kartta görünen kısa ad
export const ORIGIN_NAMES = { family: 'Aile mirası', mentor: 'Usta etkisi', craft: 'Mesleğin doğası', self: 'Özgün gelişim' };
