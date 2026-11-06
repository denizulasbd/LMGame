// Karakterlerin yapabildiği etkinlikler. Davranış kodu (src/systems/BehaviorSystem.js,
// src/ai/Brain.js) bu tabloyu okur; yeni etkinlik eklemek çoğunlukla buraya bir kayıt
// ve Brain içinde bir hedef seçici eklemekten ibarettir.
//
//   kind        : need (ihtiyaç gidermek) | rest (uyku) | social | leisure | idle | work | festival | away (sefer)
//                 festival yarıda kesilmez (uyku saati gelse de şenlik bitene kadar sürer).
//                 social/leisure/idle/work etkinlikleri acil bir ihtiyaç doğunca yarıda kesilir.
//   indoor      : hedefe varınca kapıdan girip görünmez olur (uyku, evde yemek)
//   target      : hedef türü (Brain.resolveTarget bunu yorumlar)
//   duration    : [en az, en çok] oyun dakikası
//   effects     : etkinlik sürerken dakika başına ihtiyaç kazancı
//   travelEffects: hedefe yürürken dakika başına kazanç (yürüyüş keyfi)
//   socialGain / aloneSocialGain: toplanma yerinde biriyle / yalnızken dakika başına sosyallik
//   nature      : true ise 'Doğa Sever' kazanç çarpanı uygulanır
//   pose        : stand | sit | gather | work | fish | tend (aletini dik tutup bekler: çoban değneği)
//   tool        : çalışırken elde tutulan alet (art/ui -> held tools)
//   effect      : çalışırken karakterin önünde çizilen efekt ('dust': kazma darbesinde toz ve kıymık)
//   friendshipMultiplier: bu yerde sohbet edenlerin arkadaşlık puanı kazanç çarpanı
//   romanceMultiplier   : (13. aşama, çardak) burada sohbet eden bekârların aşık olma ve çiftlerin evlenme olasılığı çarpanı
//   dance       : şenlikte karakter ritimle sağa sola döner
//   bubbles     : etkinlik sırasında çıkan ifade balonları; partnerBubbles: sohbet ederken
//                 (sevgilisi / eşiyle sohbet ederken LOVE_BUBBLES, anlaşamadığıyla RIVAL_BUBBLES)
//   urgentBubble: hedefe acil ihtiyaçla yürürken başta gösterilen balon
//   travelLabel / label / partnerLabel: arayüzde görünen durum metinleri; dateLabel: (19. aşama) randevudaki çiftin
//   (19. aşama) {pet} hayvanın adı ("Tekir'in"), {place} çalınan yer ("Handa" / "Meydanda") ile değiştirilir
export const ACTIVITIES = {
  sleep: {
    kind: 'rest',
    indoor: true,
    target: 'home',
    travelLabel: 'Evine dönüyor',
    label: 'Kulübesinde uyuyor',
    napLabel: 'Kulübesinde kestiriyor',
    effects: { energy: 0.3 },
    urgentBubble: 'zzz',
  },
  meal: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Yemek yemeye gidiyor',
    label: 'Evinde yemek yiyor',
    storageLabel: 'Kilerde yemek yiyor',
    breadLabel: 'Evinde taze ekmekle yemek yiyor',
    breadStorageLabel: 'Kilerde taze ekmekle yemek yiyor',
    breadEffects: { fun: 0.25 }, // sıcak ekmekli öğün biraz da keyif verir
    duration: [12, 18],
    effects: { hunger: 4 },
    urgentBubble: 'apple',
  },
  eat: {
    kind: 'need',
    target: 'berryBush',
    travelLabel: 'Böğürtlen çalısına yürüyor',
    label: 'Böğürtlen topluyor ve yiyor',
    duration: [20, 30],
    effects: { hunger: 1.7 },
    pose: 'gather',
    bubbles: ['berry'],
    urgentBubble: 'apple',
  },
  campfire: {
    kind: 'social',
    target: 'campfire',
    travelLabel: 'Kamp ateşine gidiyor',
    label: 'Kamp ateşinde ısınıyor',
    partnerLabel: '{partner} ile ateş başında sohbet ediyor',
    duration: [50, 90],
    effects: { fun: 0.5 },
    socialGain: 1.2,
    aloneSocialGain: 0.15,
    faceBuilding: true,
    bubbles: ['fire', 'note'],
    partnerBubbles: ['heart', 'laugh', 'chat', 'note'],
  },
  fountain: {
    kind: 'social',
    target: 'fountain',
    travelLabel: 'Meydana yürüyor',
    label: 'Meydanda havuzu seyrediyor',
    partnerLabel: '{partner} ile sohbet ediyor',
    duration: [35, 60],
    effects: { fun: 0.45 },
    socialGain: 1.0,
    aloneSocialGain: 0.1,
    bubbles: ['sparkle'],
    partnerBubbles: ['chat', 'laugh', 'heart', 'note'],
  },
  // 13. aşama: Ahşap Çardak — çiftlerin ve dostların sevdiği sohbet köşesi (arkadaşlık ve aşk daha hızlı gelişir)
  gazebo: {
    kind: 'social',
    target: 'gazebo',
    travelLabel: 'Çardağa yürüyor',
    label: 'Çardakta oturup çiçekleri seyrediyor',
    partnerLabel: '{partner} ile çardakta sohbet ediyor',
    dateLabel: '{partner} ile çardakta baş başa buluştu',
    duration: [45, 80],
    effects: { fun: 0.6, energy: 0.08 },
    socialGain: 1.4,
    aloneSocialGain: 0.15,
    pose: 'sit',
    friendshipMultiplier: 1.6,
    romanceMultiplier: 2.5,
    bubbles: ['note', 'sparkle'],
    partnerBubbles: ['heart', 'chat', 'laugh', 'note'],
  },
  // 14. aşama: Toplanma Zili — sakinler meydanda toplanıp bekler
  rally: {
    kind: 'social',
    target: 'fountain',
    travelLabel: 'Toplanma zilini duyup meydana koşuyor',
    label: 'Meydanda toplandı, kalabalığı seyrediyor',
    partnerLabel: '{partner} ile meydanda merakla bekliyor',
    duration: [60, 60],
    effects: { fun: 0.2 },
    socialGain: 0.9,
    aloneSocialGain: 0.4,
    faceBuilding: true,
    bubbles: ['note', 'chat'],
    partnerBubbles: ['chat', 'laugh', 'note'],
  },
  // 19. aşama: düğün kutlaması — evlenen çift ve dostları meydanda konfetiler arasında kutlar (data/social.js)
  weddingParty: {
    kind: 'social',
    target: 'fountain',
    travelLabel: 'Düğün kutlamasına koşuyor',
    label: 'Meydanda düğünü kutluyor',
    partnerLabel: '{partner} ile meydanda düğünü kutluyor',
    duration: [45, 45],
    effects: { fun: 0.3 },
    socialGain: 1.3,
    aloneSocialGain: 0.6,
    friendshipMultiplier: 1.4,
    bubbles: ['note', 'laugh', 'heart'],
    partnerBubbles: ['laugh', 'heart', 'note', 'ring'],
  },
  // 20. aşama: Ulu Saat Kulesi tamamlanınca meydanda büyük Çağ Kutlaması (uyanık herkes katılır)
  ageCelebration: {
    kind: 'social',
    target: 'fountain',
    travelLabel: "Çağ Kutlaması'na koşuyor",
    label: "Meydanda Çağ Kutlaması'nda",
    partnerLabel: "{partner} ile meydanda Altın Çağ'ı kutluyor",
    duration: [120, 120],
    effects: { fun: 0.3 },
    socialGain: 1.3,
    aloneSocialGain: 0.7,
    friendshipMultiplier: 1.3,
    bubbles: ['bell', 'note', 'laugh', 'sparkle'],
    partnerBubbles: ['laugh', 'note', 'bell', 'heart'],
  },
  // 19. aşama: evli çift akşamları evde birlikte yemek yer (içeride; öğün başı yiyecek değeri öder)
  homeDinner: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Akşam yemeği için eve dönüyor',
    label: 'Eşiyle evde akşam yemeği yiyor',
    partnerLabel: 'Eşi {partner} ile evde akşam yemeği yiyor',
    duration: [25, 35],
    effects: { hunger: 3.2 },
  },
  // 19. aşama: karakter huyları
  // Hayvansever: sokaktaki kediye / köpeğe yürüyüp başını okşar
  petAnimal: {
    kind: 'leisure',
    travelLabel: 'Sokaktaki {pet} yanına gidiyor',
    label: '{pet} başını okşuyor',
    duration: [6, 10],
    effects: { fun: 0.2 },
    pose: 'gather',
    bubbles: ['heart', 'paw'],
  },
  // Kitap Kurdu: fener altındaki bankta ya da Bilgelik Evi'nde kitap okur
  readBench: {
    kind: 'leisure',
    target: 'bench',
    travelLabel: 'Kitabını alıp fener altındaki banka yürüyor',
    label: 'Fener altındaki bankta kitap okuyor',
    duration: [40, 70],
    effects: { fun: 0.55, energy: 0.1 },
    pose: 'sit',
    bubbles: ['book', 'sparkle'],
  },
  readLibrary: {
    kind: 'leisure',
    indoor: true,
    travelLabel: "Bilgelik Evi'ne kitap okumaya gidiyor",
    label: "Bilgelik Evi'nde kitap okuyor",
    duration: [45, 75],
    effects: { fun: 0.6, social: 0.1 },
  },
  // Müzisyen: akşamları handa ya da meydan havuzunun başında çalar; dinleyenlerin keyfi dolar (SocialSystem)
  music: {
    kind: 'leisure',
    travelLabel: '{place} çalmaya gidiyor',
    label: '{place} melodiler çalıyor',
    duration: [40, 70],
    effects: { fun: 0.4, social: 0.6 },
    bubbles: ['melody', 'note', 'melody'],
  },
  // Doğa Tutkunu: süs ağacının gölgesinde ya da nehir kenarında manzarayı izler
  viewpoint: {
    kind: 'leisure',
    travelLabel: 'Manzarayı izlemeye yürüyor',
    label: 'Nehir kenarında manzarayı izleyip dinleniyor',
    treeLabel: 'Süs ağacının gölgesinde manzarayı izliyor',
    duration: [35, 60],
    effects: { fun: 0.75, energy: 0.15 },
    nature: true,
    pose: 'sit',
    bubbles: ['sparkle', 'heart', 'note'],
  },
  // 18. aşama: ulu süs ağacının gölgesinde dinlenmek
  shade: {
    kind: 'leisure',
    target: 'tree',
    travelLabel: 'Ağaç gölgesine yürüyor',
    label: 'Ağaç gölgesinde dinleniyor',
    duration: [30, 55],
    effects: { fun: 0.45, energy: 0.1 },
    pose: 'sit',
    bubbles: ['note', 'sparkle'],
  },
  bench: {
    kind: 'leisure',
    target: 'bench',
    travelLabel: 'Banka doğru yürüyor',
    label: 'Bankta dinleniyor',
    duration: [30, 60],
    effects: { fun: 0.5, energy: 0.12 },
    pose: 'sit',
    bubbles: ['note', 'sparkle'],
  },
  river: {
    kind: 'leisure',
    target: 'riverbank',
    travelLabel: 'Nehir kenarına yürüyor',
    label: 'Nehri izliyor',
    duration: [25, 45],
    effects: { fun: 0.7 },
    nature: true,
    bubbles: ['sparkle'],
  },
  flowers: {
    kind: 'leisure',
    target: 'flowers',
    travelLabel: 'Çiçek tarlasına yürüyor',
    label: 'Çiçekleri kokluyor',
    duration: [15, 30],
    effects: { fun: 0.7 },
    nature: true,
    bubbles: ['sparkle', 'heart'],
  },
  monument: {
    kind: 'leisure',
    target: 'monument',
    travelLabel: 'Kasaba Anıtı\'na yürüyor',
    label: 'Kasaba Anıtı\'nı gururla seyrediyor',
    duration: [15, 30],
    effects: { fun: 0.6 },
    bubbles: ['sparkle', 'heart'],
  },
  ancientSpring: {
    kind: 'leisure',
    target: 'ancientFountain',
    travelLabel: 'Kadim Çeşme\'ye yürüyor',
    label: 'Kadim Çeşme\'nin berrak suyuyla tazeleniyor',
    duration: [20, 35],
    effects: { fun: 1.1, energy: 0.6 },
    nature: true,
    bubbles: ['sparkle', 'heart'],
  },
  campRest: {
    kind: 'leisure',
    target: 'supplyCamp',
    travelLabel: 'Erzak Kampı\'na yürüyor',
    label: 'Erzak Kampı\'nda soluklanıyor',
    duration: [20, 40],
    effects: { fun: 0.45, energy: 0.35 },
    bubbles: ['note', 'sparkle'],
  },
  stroll: {
    kind: 'leisure',
    target: 'stroll',
    travelLabel: 'Kasabada yürüyüş yapıyor',
    label: 'Manzaranın tadını çıkarıyor',
    duration: [5, 12],
    effects: { fun: 0.3 },
    travelEffects: { fun: 0.3 },
    bubbles: ['note'],
  },
  // --- Çalışma (mesai saatlerinde) ---
  build: {
    kind: 'work',
    travelLabel: 'Şantiyeye gidiyor',
    label: 'İnşaat yapıyor: {target}',
    pose: 'work',
    tool: 'hammer',
    bubbles: ['hammer', 'sweat'],
  },
  chop: {
    kind: 'work',
    travelLabel: 'Ağaç kesmeye gidiyor',
    label: 'Ağaç kesiyor',
    pose: 'work',
    tool: 'axe',
    bubbles: ['sweat', 'note'],
  },
  mine: {
    kind: 'work',
    travelLabel: 'Taş kırmaya gidiyor',
    label: 'Taş kırıyor',
    pose: 'work',
    tool: 'pickaxe',
    effect: 'dust',
    bubbles: ['sweat'],
  },
  forage: {
    kind: 'work',
    travelLabel: 'Böğürtlen toplamaya gidiyor',
    label: 'Kiler için böğürtlen topluyor',
    pose: 'gather',
    bubbles: ['berry'],
  },
  lumber: {
    kind: 'work',
    travelLabel: 'Oduncu kulübesine gidiyor',
    label: 'Oduncu kulübesinde odun yarıyor',
    pose: 'work',
    tool: 'axe',
    bubbles: ['sweat', 'note'],
  },
  farm: {
    kind: 'work',
    travelLabel: 'Bahçeye gidiyor',
    label: 'Bahçeyi çapalıyor',
    pose: 'work',
    tool: 'hoe',
    bubbles: ['sparkle', 'note'],
  },
  quarry: {
    kind: 'work',
    travelLabel: 'Taş ocağına gidiyor',
    label: 'Taş ocağında taş yontuyor',
    pose: 'work',
    tool: 'pickaxe',
    effect: 'dust',
    bubbles: ['sweat', 'note'],
  },
  fish: {
    kind: 'work',
    travelLabel: 'İskeleye gidiyor',
    label: 'İskelede olta atıyor',
    pose: 'fish',
    tool: 'rod',
    bubbles: ['fish', 'note', 'sparkle'],
  },
  cook: {
    kind: 'work',
    indoor: true,
    travelLabel: 'Hana aşçılığa gidiyor',
    label: 'Handa sıcak yemek pişiriyor',
  },
  // --- 10. aşama: hayvancılık, değirmen-fırın ve demir madeni ---
  herd: {
    kind: 'work',
    travelLabel: 'Koyun ağılına gidiyor',
    label: 'Ağılda koyunları otlatıyor',
    pose: 'tend',
    tool: 'crook',
    bubbles: ['note', 'heart', 'sparkle'],
  },
  bake: {
    kind: 'work',
    travelLabel: 'Değirmene ve fırına gidiyor',
    label: 'Fırında sıcak ekmek pişiriyor',
    idleLabel: 'Fırının başında un bekliyor',
    pose: 'work',
    tool: 'peel',
    bubbles: ['fire', 'sparkle', 'note'],
  },
  mineIron: {
    kind: 'work',
    travelLabel: 'Demir madenine gidiyor',
    label: 'Madende demir cevheri kazıyor',
    pose: 'work',
    tool: 'pickaxe',
    effect: 'dust',
    bubbles: ['sweat', 'note'],
  },
  // --- 11. aşama: şifacılık, tedavi ve keşif seferi ---
  brew: {
    kind: 'work',
    travelLabel: 'Şifacı kulübesine gidiyor',
    label: 'Havanda şifalı ot dövüp iksir hazırlıyor',
    pose: 'work',
    tool: 'pestle',
    bubbles: ['herb', 'sparkle', 'note'],
  },
  gatherHerbs: {
    kind: 'work',
    travelLabel: 'Şifalı ot toplamaya gidiyor',
    label: 'Doğadan şifalı ot topluyor',
    pose: 'gather',
    bubbles: ['herb', 'sparkle'],
  },
  // Hasta sakin şifacıya gidip iksirle tedavi olur (içeride)
  heal: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Şifacıya gidiyor',
    label: 'Şifacıda iksirle tedavi oluyor',
    duration: [25, 35],
    effects: { energy: 0.4 },
    urgentBubble: 'fever',
  },
  // --- 12. aşama: Bilgelik Evi ---
  teach: {
    kind: 'work',
    indoor: true,
    travelLabel: 'Bilgelik Evi\'ne gidiyor',
    label: 'Bilgelik Evi\'nde araştırma yapıyor',
    teachLabel: 'Bilgelik Evi\'nde çocuklara ders veriyor',
  },
  // Çocuklar ders saatlerinde Bilgelik Evi'nde ders dinler (içeride)
  school: {
    kind: 'leisure',
    indoor: true,
    travelLabel: 'Okula koşuyor',
    label: 'Bilgelik Evi\'nde ders dinliyor',
    duration: [50, 80],
    effects: { social: 0.3, fun: 0.15 },
  },
  // Keşif seferine çıkan sakin harita kenarına yürür ve bir gün ortadan kaybolur
  expedition: {
    kind: 'away',
    travelLabel: 'Keşif seferine yola çıkıyor',
    label: 'Keşif seferinde',
  },
  // Zanaat atölyesinde ekipman üretimi ({item}: yapılan ekipman)
  craft: {
    kind: 'work',
    travelLabel: 'Zanaat Atölyesi\'ne gidiyor',
    label: 'Atölyede {item} yapıyor',
    idleLabel: 'Atölyede tezgâhı topluyor',
    pose: 'work',
    tool: 'hammer',
    bubbles: ['hammer', 'sparkle', 'note'],
  },
  // Depodaki boşta ekipmanı atölyeden / kilerden alıp kuşanmak ({item})
  equip: {
    kind: 'need',
    travelLabel: '{item} almaya gidiyor',
    label: '{item} kuşanıyor',
    duration: [3, 5],
    bubbles: ['sparkle'],
  },
  // Evlenen sakin eşiyle paylaşacağı eve taşınır
  relocate: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Yeni evine taşınıyor',
    label: 'Yeni evine yerleşiyor',
    duration: [15, 25],
    bubbles: ['heart'],
  },
  // Çocuklar: meydanda, hanın ve ateşin çevresinde koşuşturup oynar (gören yetişkinler keyiflenir)
  play: {
    kind: 'leisure',
    target: 'playground',
    travelLabel: 'Koşturarak oyuna gidiyor',
    label: 'Neşeyle oynuyor',
    duration: [5, 10],
    effects: { fun: 0.9, social: 0.45 },
    travelEffects: { fun: 0.4 },
    pose: 'gather',
    bubbles: ['note', 'laugh', 'sparkle', 'heart'],
  },
  // Handa sıcak yemek: hızlı doyurur, keyif verir; bitince bir süre yavaş acıkır (WARM_MEAL)
  innMeal: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Hana sıcak yemeğe gidiyor',
    label: 'Handa sıcak yemek yiyor',
    duration: [14, 20],
    effects: { hunger: 7, fun: 0.6 },
    urgentBubble: 'apple',
  },
  inn: {
    kind: 'social',
    target: 'inn',
    travelLabel: 'Hana gidiyor',
    label: 'Hanın önünde dinleniyor',
    partnerLabel: '{partner} ile handa sohbet ediyor',
    dateLabel: '{partner} ile handa aynı masayı paylaşıyor',
    duration: [50, 90],
    effects: { fun: 0.6 },
    socialGain: 1.4,
    aloneSocialGain: 0.2,
    friendshipMultiplier: 1.35,
    bubbles: ['note'],
    partnerBubbles: ['laugh', 'chat', 'heart', 'note'],
  },
  festival: {
    kind: 'festival',
    travelLabel: 'Şenliğe koşuyor',
    label: 'Şenlikte dans ediyor',
    partnerLabel: '{partner} ile şenlikte dans ediyor',
    effects: { fun: 1.1 },
    socialGain: 1.5,
    aloneSocialGain: 0.6,
    friendshipMultiplier: 1.15,
    pose: 'gather',
    dance: true,
    bubbles: ['note', 'note', 'laugh'],
    partnerBubbles: ['note', 'heart', 'laugh', 'note'],
  },
  haul: {
    kind: 'need',
    travelLabel: 'Kilere {resource} taşıyor',
    label: 'Kilere bırakıyor',
    duration: [1, 2],
  },
  moveIn: {
    kind: 'need',
    indoor: true,
    travelLabel: 'Kasabaya geliyor',
    label: 'Yeni evine yerleşiyor',
    duration: [20, 30],
    bubbles: ['heart'],
  },

  wait: {
    kind: 'idle',
    target: 'none',
    label: 'Etrafa bakınıyor',
    duration: [8, 15],
    effects: {},
  },
};

// Evden çıkarken kısa süre görünen durum
export const LEAVING_HOME_LABEL = 'Evinden çıkıyor';

// Mesai saatinde mola veren sakinin durum metni öneki
export const BREAK_PREFIX = 'Mola: ';

// Sevgilisi ya da eşiyle sohbet ederken başının üstünde çıkan balonlar; anlaşamadığıyla sohbet ederken
export const LOVE_BUBBLES = ['love', 'heart', 'love', 'note'];
export const RIVAL_BUBBLES = ['sulk', 'chat'];
