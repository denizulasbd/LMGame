// (23. aşama) Yönetilebilir krizler: yangın ve itfaiye, su kuyusu, gözcü kulesi ve bekçiler, haydut baskınları,
// yaralanma ve tamir. Bu dosya yalnızca sayılar ve metinler içerir; kurallar systems/Crisis.js (saf hesaplar) ile
// systems/CrisisSystem.js'te (durum değiştiren) uygulanır.
//
// Temel ilke: kalıcı yıkım ve ölüm yoktur. Yanan ya da yağmalanan yapı haritadan silinmez, yalnızca "hasarlı" olur
// (building.damaged / isDamaged) ve onarılana kadar çalışmaz; yaralanan sakin ölmez, "hafif yaralı" olur (isInjured).
// Krizler kendi tohumlanmış rastgele sayı üretecini kullanır: oyunun ana üretecine hiç dokunmaz.

/** Tehlike sıklığı (Ayarlar): rate doğal kriz olasılığının çarpanıdır (0 = hiç çıkmaz). */
export const CRISIS_DIFFICULTY = {
  huzurlu: { name: 'Huzurlu', rate: 0, description: 'Kendiliğinden yangın ve haydut baskını hiç çıkmaz.' },
  dengeli: { name: 'Dengeli', rate: 1, description: 'Normal kriz sıklığı: ara sıra bir yangın, on günde bir haydut izi.' },
  cetin: { name: 'Çetin', rate: 1.5, description: 'Yangınlar ve haydut baskınları %50 daha sık yaşanır.' },
};
export const CRISIS_DIFFICULTY_KEYS = Object.keys(CRISIS_DIFFICULTY);
export const DEFAULT_DIFFICULTY = 'dengeli';

export const CRISIS = {
  fireStartDay: 8, // doğal yangın bu günden önce çıkmaz
  banditStartDay: 10, // ilk haydut izi bu günden önce görülmez
  graceHours: 24, // kayıt yüklenince (aktif kriz yoksa) ilk bu kadar oyun saatinde doğal kriz çıkmaz
  logSize: 12,
};

/** Yangın: doğal çıkış olasılıkları, söndürme ve sonuçlar. */
export const FIRE = {
  checkHour: 14, // doğal yangın her gün bu saatte (bir kez) yoklanır
  // Yapı türü başına günlük yangın olasılığı (Dengeli); ateşli yapılar önde
  chance: { mill: 0.03, workshop: 0.03, ironMine: 0.015, lumberHut: 0.008, market: 0.006, healerHut: 0.006, sheepFarm: 0.006, garden: 0.004 },
  seasons: { spring: 0.7, summer: 1.8, autumn: 1, winter: 0.9 }, // yazın yangın çok daha olasıdır
  wellRadius: 8, // Su Kuyusu bu karo yarıçapındaki yapılarda yangın ihtimalini azaltır
  wellReduction: 0.8, // -%80
  burnMinutes: 360, // yangın bu kadar oyun dakikasında tam yanar (fireProgress 0 -> 100): hasar
  buckets: 4, // sönmesi için gereken kova sayısı
  bucketsNearWell: 3, // yakında kuyu varsa (kova zinciri) daha az
  bucketSetback: 12, // her kova yangın ilerlemesini bu kadar geriletir
  maxFighters: 4, // aynı anda koşan en çok sakin
  injuryChance: 0.06, // yangın %40'ı geçtikten sonra atılan her kovada çarpanıyla yaralanma olasılığı
  injuryAfter: 40,
  trustOut: 2, // el birliğiyle söndürülünce Yönetim Güveni
  trustBurned: -2, // söndürülemeyip bina hasar alınca
  burnedInjuryChance: 0.5, // bina hasar alırken en az bir söndürücü yaralanma olasılığı
  waterMinutes: 3, // kovayı doldurma süresi (oyun dakikası)
  throwMinutes: 3, // kovayı yangına boşaltma süresi
  bankRadius: 40, // kuyu yoksa nehir kıyısı aranan karo yarıçapı
};

/** Su Kuyusu. */
export const WELL = {
  gardenRadius: 4, // bu kadar karo yakınındaki bahçelere sulama bonusu
  gardenBonus: 0.1, // +%10 verim
  gardenTypes: ['garden'],
};

/** Gözcü Kulesi ve Kasaba Bekçileri. */
export const GUARD = {
  trustPerHour: 0.2, // kule ayaktayken saat başı Yönetim Güveni katkısı
  trustPerGuard: 0.1, // nöbette olan her bekçi için ek
  twoGuardsAdults: 12, // en az bu kadar yetişkin varsa ikinci bekçi
  warnDaysWithTower: 2, // haydut baskını kuleyle 2 gün önceden
  warnDaysWithout: 1,
};

/** Haydut baskınları ve üç çözüm yolu. */
export const BANDIT = {
  intervalDays: [8, 10], // iki iz arası (Dengeli)
  tribute: { min: 25, max: 40 }, // haraç (altın)
  tributeFoodPerGold: 2, // altın yoksa kilerden bu oranla yiyecek verilir
  loot: { min: 15, max: 25 }, // püskürtülen haydutların bıraktığı ganimet (altın)
  repelTrust: 6,
  tributeTrust: -2,
  caughtTrust: -8,
  caughtMaxShare: 0.15, // hazırlıksız yakalanınca en çok mevcut stoğun bu kadarı gider (asla tamamı değil)
  repelInjuryChance: 0.5, // püskürtmeye katılan bir sakinin hafif yaralanma olasılığı
  repelInjuryChanceTower: 0.3, // Gözcü Kulesi varsa
  defense: { minAdults: 4, minTools: 1 }, // kulesiz savunma: yeterli yetişkin ve en az bir sağlam alet
  defenders: 3, // anıya yazılan savunmacı sayısı
  resolveAfterHours: 0, // varış anında karar verilmediyse otomatik çözülür
  buff: 'banditsRepelled',
};

/** Hafif yaralanma. */
export const INJURY = {
  naturalHours: 36, // 1,5 gün: şifacı olmasa da kendiliğinden geçer
  sleepRecovery: 2, // evinde uyurken iki kat hızlı
  speed: 0.8, // yürüme ve çalışma hızı -%20
  treatedFun: 10, // şifacıda yaraları sarılınca keyif
  clinicMinutes: [12, 16], // şifacıda kalış süresi
  herbMultiplier: 3, // şifalı ot demleyen sakinin yarası bu kadar hızlı kapanır
  bubbles: ['bandage', 'sweat'],
};

/** Tamir: inşa maliyetinin %25'i (odun ve taş); boştaki ustalar da otomatik onarır. */
export const REPAIR = {
  costRatio: 0.25,
  buildWork: 60, // kısa onarım işi
  autoDelayHours: 2, // hasardan bu kadar sonra kaynak yetiyorsa usta onarımı otomatik başlar
};

/** Hasarın nedeni (building.damageKind); fırtına eski onarım kuralını korur. */
export const DAMAGE_KINDS = {
  storm: 'Fırtına',
  fire: 'Yangın',
  raid: 'Haydut baskını',
};
