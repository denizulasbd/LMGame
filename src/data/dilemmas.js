// İkilem ve karar olayları (11. aşama). Birkaç günde bir kasabanın kapısına sürpriz bir olay gelir; oyun
// duraklar ve ortada bir karar penceresi açılır. Oyuncu 30 saniye içinde seçmezse varsayılan (güvenli)
// seçenek uygulanır. Mantık src/systems/DilemmaSystem.js'te, pencere src/ui/components/DilemmaModal.js'te.
//
//   weight      : seçilme ağırlığı; requires: { minPopulation, building, seasons, minDay } olayın çıkma koşulları
//   options     : { id, label, detail, cost, provisions?, requires?, effect, result, default? }
//     cost        : seçilince harcanan kaynak (yetmiyorsa seçenek kilitli)
//     requires    : 'freeBed' (boş yatak), 'explorers:N' (boşta N yetişkin), 'tools:N' (depoda / üstünde N Sağlam Alet),
//                   'dog' (kasabada köpek)
//     effect      : { buff, fun, recruit, fortify, explorers, expedition, watchChance }
//     default     : süre dolunca uygulanır; birden çoksa ilk uygulanabilir olanı (güvenli seçenek)
export const DILEMMA_SCHEDULE = {
  hour: 10, // olay sabah bu saatte gelir
  firstDay: 4, // ilk olayın en erken günü
  intervalDays: [2, 4], // iki olay arası gün
  timeoutSeconds: 30, // karar süresi (gerçek saniye; oyun duraklatılır)
  repeatGapDays: 6, // aynı olay bu kadar gün içinde tekrarlanmaz
};

export const DILEMMAS = {
  refugees: {
    title: 'Sığınmacı Kafilesi',
    icon: 'heart',
    text: 'Kasabanın kapısına yorgun, üstü başı toz içinde bir kafile geldi. Kuzeydeki köyleri sel basmış; bir lokma ekmek ve sıcak bir köşe istiyorlar.',
    weight: 3,
    requires: { minPopulation: 6 },
    options: [
      {
        id: 'feed',
        label: 'Doyur ve misafir et',
        detail: '2 gün refah +5 (İyilik Şöhreti), herkesin keyfi +10',
        cost: { food: 40, wood: 20 },
        effect: { buff: 'goodwill', fun: 10 },
        result: 'Kafile karnını doyurup ısındı; giderken kasabaya dualar etti. Kasabanın iyiliği dillere düştü.',
      },
      {
        id: 'recruit',
        label: 'En yeteneklisini kasabaya al',
        detail: 'Bir meslekte usta biri boş bir yatağa yerleşir',
        requires: 'freeBed',
        effect: { recruit: true },
        result: 'Kafilenin en becerikli üyesi kasabada kalmaya karar verdi.',
      },
      {
        id: 'decline',
        label: 'Kibarca geri çevir',
        detail: 'Bedeli yok; sakinler biraz üzülür (keyif −3)',
        effect: { fun: -3 },
        result: 'Kafile başını önüne eğip yoluna devam etti.',
        default: true,
      },
    ],
  },
  bards: {
    title: 'Gezgin Ozanlar',
    icon: 'note',
    text: 'Sazları ve rengârenk arabalarıyla gezgin ozanlar kasabaya uğradı. Meydanda büyük bir panayır kurmayı teklif ediyorlar.',
    weight: 3,
    requires: { minPopulation: 8 },
    options: [
      {
        id: 'fair',
        label: 'Büyük Panayır kur',
        detail: '2 gün: keyif çok yavaş düşer, arkadaşlık 1,6 kat hızlı, refah +4; hemen keyif +20',
        cost: { bread: 30, wool: 20 },
        effect: { buff: 'fair', fun: 20 },
        result: 'Meydanda fenerler asıldı, sazlar çalındı: Büyük Panayır başladı!',
      },
      {
        id: 'show',
        label: 'Bir akşamlık gösteri',
        detail: 'Herkesin keyfi hemen +10',
        cost: { food: 15 },
        effect: { fun: 10 },
        result: 'Ozanlar meydanda bir akşam türküler söyledi.',
      },
      {
        id: 'decline',
        label: 'Teşekkür edip uğurla',
        detail: 'Bedeli yok',
        effect: {},
        result: 'Ozanlar el sallayıp bir sonraki kasabaya yollandı.',
        default: true,
      },
    ],
  },
  storm: {
    title: 'Sert Fırtına Uyarısı',
    winterTitle: 'Kar Fırtınası Uyarısı',
    icon: 'storm',
    text: 'Dağlardan inen çoban kara bulutlar gördü: yarın kasabaya sert bir fırtına vuracak. Ağıllar, damlar ve iskeleler güçlendirilmezse zarar görebilir.',
    weight: 2,
    requires: { minPopulation: 6, minBuildings: 2 },
    options: [
      {
        id: 'fortifyIron',
        label: 'Demir kuşaklarla güçlendir',
        detail: 'Fırtına hasarsız atlatılır',
        cost: { wood: 35, iron: 25 },
        effect: { fortify: true },
        result: 'Kirişler demir kuşaklarla bağlandı. Kasaba fırtınaya hazır.',
      },
      {
        id: 'fortifyStone',
        label: 'Taş ve kalasla güçlendir',
        detail: 'Fırtına hasarsız atlatılır',
        cost: { wood: 35, stone: 25 },
        effect: { fortify: true },
        result: 'Damlar taşla bastırıldı, kapılar kalaslarla desteklendi.',
        default: true,
      },
      {
        id: 'risk',
        label: 'Şansına güven',
        detail: 'Bedeli yok; fırtınada 1-3 üretim yapısı hasar alabilir (onarım gerekir)',
        effect: { fortify: false },
        result: 'Kasaba hiçbir hazırlık yapmadan fırtınayı beklemeye başladı.',
        default: true,
      },
    ],
  },
  wolves: {
    title: 'Kurt Sürüsü',
    icon: 'wolf',
    text: 'Geceleri ormandan uluma sesleri geliyor; kurt izleri Koyun Ağılı\'nın çitine kadar uzanıyor. Önlem alınmazsa sürü ağıla dalabilir.',
    weight: 2,
    requires: { minPopulation: 6, building: 'sheepFarm', seasons: ['autumn', 'winter'] },
    options: [
      {
        id: 'fence',
        label: 'Ağıl çitini yükselt',
        detail: 'Kurtlar ağıla giremez',
        cost: { wood: 30, stone: 20 },
        effect: { fortify: true },
        result: 'Ağılın çiti yükseltildi, kapıya demir sürgü takıldı.',
        default: true,
      },
      {
        id: 'dogs',
        label: 'Köpekleri nöbete koy',
        detail: 'Bedeli yok; köpekler kurtları %75 olasılıkla kaçırır',
        requires: 'dog',
        effect: { watchChance: 0.75 },
        result: 'Kasabanın köpekleri geceyi ağılın başında geçirecek.',
      },
      {
        id: 'risk',
        label: 'Önlem alma',
        detail: 'Bedeli yok; kurtlar ağıla dalarsa ağıl hasar alır, kasaba korkar (keyif −6)',
        effect: { fortify: false },
        result: 'Kasaba kurtların uzak duracağını umdu.',
        default: true,
      },
    ],
  },
  expedition: {
    title: 'Kayıp Hazine Haritası',
    icon: 'map',
    text: 'Gezgin bir çerçinin bıraktığı yıpranmış haritada, eski bir madenin yeri işaretli. Birkaç cesur sakin keşfe çıkabilir; bir gün sonra dönerler.',
    weight: 2,
    requires: { minPopulation: 8, minDay: 5 },
    options: [
      {
        id: 'bigParty',
        label: '2 kişilik keşif seferi',
        detail: '2 boşta sakin, 30 yiyecek ve 2 Sağlam Alet: bol demir, yün ya da nadir bir tılsım',
        cost: { food: 30 },
        requires: 'explorers:2,tools:2',
        effect: { expedition: 'big', explorers: 2 },
        result: 'İki cesur sakin sırt çantalarını kuşanıp yola çıktı. Yarın bu saatlerde dönerler.',
      },
      {
        id: 'scout',
        label: 'Tek bir izci gönder',
        detail: '1 boşta sakin ve 15 yiyecek: daha küçük bir ganimet',
        cost: { food: 15 },
        requires: 'explorers:1',
        effect: { expedition: 'small', explorers: 1 },
        result: 'Bir izci haritayı alıp ormana daldı.',
      },
      {
        id: 'ignore',
        label: 'Haritayı sandığa kaldır',
        detail: 'Bedeli yok',
        effect: {},
        result: 'Harita belediyenin sandığına kaldırıldı.',
        default: true,
      },
    ],
  },
};
export const DILEMMA_KEYS = Object.keys(DILEMMAS);

// Fırtına / kurt saldırısı: karardan bu kadar oyun saati sonra gelir; güçlendirilmemişse hasar verir
export const STORM = {
  delayHours: [20, 30],
  damage: [1, 3], // güçlendirilmemiş kasabada hasar alan üretim yapısı sayısı
  wolfFun: -6,
  mend: { costRatio: 0.2, buildWork: 90 }, // hasarlı yapının onarımı: yapının maliyetinin %20'si (28.1: %30'dan indirildi)
};

// Keşif seferi: süre ve ganimet tabloları (rastgele biri; büyük seferde tılsım şansı)
export const EXPEDITION = {
  hours: 24,
  loot: {
    big: [
      { weight: 3, get: { iron: [25, 40] }, text: 'Eski madenin galerilerinde zengin demir damarları' },
      { weight: 3, get: { wool: [20, 35], food: [10, 20] }, text: 'Terk edilmiş bir yaylada sahipsiz koyun sürüsünün yünleri' },
      { weight: 2, get: { iron: [10, 20], stone: [20, 30] }, text: 'Çökmüş bir kalenin işlenmiş taşları ve demir kapı menteşeleri' },
      { weight: 2, get: { iron: [10, 15] }, buff: 'talisman', relic: 2, text: 'Kadim bir tapınakta parıldayan bir tılsım!' },
    ],
    small: [
      { weight: 3, get: { iron: [8, 15] }, text: 'Dere yatağında demir cevheri' },
      { weight: 3, get: { wool: [8, 15] }, text: 'Dikenlere takılmış yün yumakları' },
      { weight: 2, get: { food: [15, 25] }, text: 'Yaban meyveleri ve mantar' },
    ],
  },
  relicHappiness: 2, // tılsımla dönen seferin kasaba refahına kalıcı katkısı (adet başına)
  // Şans sayacı: tılsımsız dönen her seferden sonra artar; bu sayıya ulaşan sefer (büyük ya da küçük) tılsımı
  // kesin bulur (en geç 3. başarılı seferde)
  talismanPity: 3,
};
