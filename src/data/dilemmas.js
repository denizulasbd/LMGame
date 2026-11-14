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
//                   (30.4b, ENGINES.midgame) yeni etki türleri: gold, resources { ad: ±N }, loyalty { all | target | target2 | both |
//                   friendsOfTarget | parentsOfTarget | elders | lowest: [adet, N] }, trust, satisfaction { all | target }, relation { pair },
//                   tag { from, to, tag }, moodlet { who, key, reason }, energy, sick, reputation, quarantine (gün), leave: 'target'
//     (30.4b) target: kişili olay kuralı ('master' | 'feud' | 'smallestChild'; zar çekmez); metinde {who} / {who2}; requires'a
//                   minTier, buildingsMin { tür: adet }, plaza, foodRatio, child; midgame: true = yeni kart (şalter kapalıyken havuzda yok)
//     default     : süre dolunca uygulanır; birden çoksa ilk uygulanabilir olanı (güvenli seçenek)
export const DILEMMA_SCHEDULE = {
  hour: 10, // olay sabah bu saatte gelir
  firstDay: 4, // ilk olayın en erken günü
  intervalDays: [2, 4], // iki olay arası gün
  timeoutSeconds: 30, // karar süresi (gerçek saniye; oyun duraklatılır)
  repeatGapDays: 6, // aynı olay bu kadar gün içinde tekrarlanmaz
};

// (30.4b, ENGINES.midgame) orta oyun: tekrar kuralları ve yeni kartların ağırlığı
export const MIDGAME = {
  repeatGapDays: 8, // aynı olay en az bu kadar gün sonra
  noRepeatLast: 2, // seçilen kart son iki karttan biri olamaz (havuzda başka uygun kart varsa)
  lateDay: 20, // bu günden sonra yeni kartların toplam ağırlığı eski kartlarınkinin en az lateRatio katı
  lateRatio: 2,
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

// (30.4b) Orta oyun kartları. Sayılar başlangıç değeridir; ayar yalnızca buradaki ağırlık, bedel ve etki sayılarıyla yapılır.
// Her seçeneğin görünür bir bedeli vardır (cost ya da olumsuz etki); default = "orta yol".
const MID = {
  masterOffer: {
    title: 'Şehirden İş Teklifi',
    icon: 'star',
    text: 'Şehirden bir lonca ustası geldi: {who} için yüklü maaşlı bir iş teklifi getirmiş. {who} kararsız; gözü sana bakıyor.',
    weight: 3,
    target: 'master',
    requires: { minPopulation: 8, minDay: 20 },
    options: [
      { id: 'pay', label: 'Maaş ver', cost: { gold: 60 }, effect: { loyalty: { target: 15 } }, result: '{who} için maaş zammı yapıldı; gözü kasabadan başka yere kaymadı.' },
      { id: 'feast', label: 'Onuruna sofra kur', cost: { food: 30 }, effect: { loyalty: { target: 8 }, fun: 5 }, result: 'Meydanda {who} için sofra kuruldu; herkes ustasıyla gurur duydu.', default: true },
      { id: 'release', label: 'Yolun açık olsun', effect: { leave: 'target', loyalty: { friendsOfTarget: -4 } }, result: '{who} bohçasını toplayıp şehre doğru yola çıktı. Dostları ardından uzun uzun baktı.' },
    ],
  },
  neighborFeud: {
    title: 'Komşu Husumeti',
    icon: 'angry',
    text: '{who} ile {who2} arasındaki husumet büyüdü. Bahçe çitinden başlayan laf, artık sokakta herkesin ağzında.',
    weight: 3,
    target: 'feud',
    requires: { minPopulation: 8, minDay: 12 },
    options: [
      { id: 'side', label: 'Haklı bul: {who}', effect: { loyalty: { target2: -12 }, tag: { from: 'target2', to: 'target', tag: 'resentful' } }, result: '{who} haklı bulundu; {who2} kırgın ve gönülsüz döndü.' },
      { id: 'scold', label: 'İkisini de azarla', effect: { loyalty: { both: -5 }, relation: { pair: 10 } }, result: 'İkisi de azar işitti; kızgın ama suskun, aralarındaki ip biraz gevşedi.', default: true },
      { id: 'reconcile', label: 'Meydanda barıştır', cost: { gold: 20, food: 15 }, effect: { relation: { pair: 25 }, moodlet: { who: 'both', key: 'comforted', reason: 'Meydanda barıştırıldı' } }, result: 'Meydanda ortak bir sofra kuruldu; {who} ile {who2} el sıkıştı.' },
    ],
  },
  drought: {
    title: 'Kuraklık',
    icon: 'sun',
    text: 'Haftalardır yağmur yok, tarlalar çatlıyor. Bahçelerin çatlak toprağı kasabanın kileri için kötü haber.',
    weight: 3,
    requires: { minPopulation: 8, minDay: 16, seasons: ['summer'], buildingsMin: { garden: 2 } },
    options: [
      { id: 'muster', label: 'Kuyudan sulama seferberliği', effect: { energy: -20 }, result: 'Bütün kasaba kovalarla kuyu başına dizildi; mahsul kurtuldu, kollar yorgun.', default: true },
      { id: 'buy', label: 'Dışarıdan erzak al', cost: { gold: 80 }, effect: { resources: { food: 60 } }, result: 'Bir kervancıdan pahalıya erzak alındı; kiler idare edecek.' },
      { id: 'wait', label: 'Bekle', effect: { resources: { food: -35 }, loyalty: { all: -2 } }, result: 'Tarlalar kurudu, kilerden yenen yiyecek geri gelmedi; sakinler söylendi.' },
    ],
  },
  census: {
    title: 'Kraliyet Sayımı',
    icon: 'coin',
    text: 'Kraliyet sayım memuru geldi: kasabadan iki genç asker istiyor. Reddetmek ağır bir laf yedirir, göndermek sakinlerin gönlünü kırar.',
    weight: 2,
    requires: { minPopulation: 14, minDay: 24, minTier: 3 },
    options: [
      { id: 'send', label: 'Gönüllüleri azıklandır', cost: { gold: 60, food: 30 }, effect: { energy: -15, reputation: 8 }, result: 'Kasaba gönüllüleri azıkla yolcu etti; krallıkta adın iyiye çıktı.' },
      { id: 'pay', label: 'Bedelini öde', cost: { gold: 120 }, effect: {}, result: 'Sayım memuru kesesini doldurup gitti; kimse askere gitmedi.', default: true },
      { id: 'refuse', label: 'Reddet', effect: { reputation: -10, loyalty: { all: 3 } }, result: 'Memur kasvetle ayrıldı. Sakinler seninle gurur duydu, krallık ise kaşını çattı.' },
    ],
  },
  plagueRumor: {
    title: 'Salgın Söylentisi',
    icon: 'heart',
    text: 'Komşu köyde salgın söylentisi var. Henüz kimse hasta değil ama kasabada fısıltılar dolaşıyor.',
    weight: 2,
    requires: { minPopulation: 14, minDay: 20 },
    options: [
      { id: 'close', label: 'Kapıları kapat', effect: { quarantine: 1, loyalty: { all: -3 } }, result: 'Bir gün boyunca kapılar kapandı: ne tüccar ne göçmen girdi. Sakinler söylendi.' },
      { id: 'herbs', label: 'Şifalı ot stokla', cost: { gold: 50 }, effect: {}, result: 'Şifacılara ot alındı; salgın kasabanın kapısından geri döndü.', default: true },
      { id: 'ignore', label: 'Kulak asma', effect: { sick: 3 }, result: 'Söylenti gerçek çıktı: üç sakin yatağa düştü.' },
    ],
  },
  travelingTheater: {
    title: 'Seyyar Tiyatro',
    icon: 'note',
    text: 'Bir seyyar tiyatro kumpanyası konaklamak istiyor. Meydanı sahne yapıp bir gece oyun çıkarmayı teklif ediyorlar.',
    weight: 3,
    requires: { minPopulation: 8, minDay: 12, plaza: true },
    options: [
      { id: 'pay', label: 'Parasını ver', cost: { gold: 40 }, effect: { fun: 15, satisfaction: { all: 3 } }, result: 'Meydanda fenerler yandı; oyun herkesi güldürüp düşündürdü.' },
      { id: 'feed', label: 'Erzakla ağırla', cost: { food: 30 }, effect: { fun: 10 }, result: 'Kumpanya karnını doyurup kısa bir gösteri yaptı.', default: true },
      { id: 'refuse', label: 'Geri çevir', effect: { fun: -3, loyalty: { all: -2 } }, result: 'Kumpanya arabalarını çevirip yola koyuldu; çocuklar kapıdan baktı.' },
    ],
  },
  lostChild: {
    title: 'Kayıp Çocuk',
    icon: 'map',
    text: '{who} akşam eve dönmedi. Ebeveynleri kapıda, gözleri karanlık ormanda.',
    weight: 2,
    target: 'smallestChild',
    requires: { minPopulation: 8, child: true },
    options: [
      { id: 'all', label: 'Herkes arasın', effect: { energy: -25, loyalty: { parentsOfTarget: 12, all: 3 } }, result: 'Bütün kasaba meşalelerle ormana döküldü; {who} ağaç kovuğunda uyurken bulundu.', default: true },
      { id: 'guards', label: 'Bekçiler arasın', cost: { gold: 20 }, requires: 'guardTower', effect: { loyalty: { parentsOfTarget: 6 } }, result: 'Bekçiler gece boyunca aradı; {who} sabaha karşı bulundu.' },
      { id: 'wait', label: 'Sabahı bekle', effect: { loyalty: { parentsOfTarget: -15 }, moodlet: { who: 'parentsOfTarget', key: 'shaken', reason: 'Çocuğu bir gece kayıptı' } }, result: '{who} sabah kendi kendine döndü; ebeveynleri geceyi gözyaşıyla geçirdi ve yönetime kırgın.' },
    ],
  },
  bumperHarvest: {
    title: 'Bereketli Hasat',
    icon: 'food',
    text: 'Bu yıl bereket taştı; kiler ağzına kadar dolu. Fazlasıyla ne yapalım?',
    weight: 3,
    requires: { minPopulation: 8, seasons: ['autumn'], foodRatio: 0.7 },
    options: [
      { id: 'feast', label: 'Hasat şöleni', cost: { food: 40 }, effect: { fun: 10, loyalty: { all: 4 } }, result: 'Meydanda hasat şöleni kuruldu; herkes doyasıya yedi, türküler söylendi.', default: true },
      { id: 'sell', label: 'Kervana sat', cost: { food: 40 }, effect: { gold: 70 }, result: 'Fazla ürün bir kervana satıldı; hazine doldu.' },
      { id: 'give', label: 'Yoksula dağıt', cost: { food: 25 }, effect: { loyalty: { lowest: [5, 10] } }, result: 'Fazla yiyecek en muhtaç sakinlere dağıtıldı; duaları ardından geldi.' },
    ],
  },
};
for (const def of Object.values(MID)) {
  def.midgame = true;
  for (const o of def.options) o.detail = '';
}
Object.assign(DILEMMAS, MID);
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
