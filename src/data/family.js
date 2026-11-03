// Aile kurma (9. aşama): evlilik sonrası aynı eve taşınma, "Mutlu Yuva" morali, çocuklar ve büyüme,
// zıt kişilikli sakinlerin atışması ve barışması. Hesaplar src/systems/FamilySystem.js ve
// ConflictSystem.js'te; burada yalnızca sayılar ve adlar var.

// Mutlu Yuva: eşiyle aynı evde uyuyan ya da akşam birlikte vakit geçiren sakin ertesi sabah
// wakeFun keyifle uyanır ve hours saat boyunca keyfi funDecay çarpanıyla daha yavaş azalır
export const HAPPY_HOME = { hours: 10, funDecay: 0.7, wakeFun: 12, eveningFrom: 17 };

// Çocuklar: her sabah birthHour'da şu koşullar sağlanırsa çifte chancePerDay olasılıkla bir çocuk katılır:
//   aynı evde yaşıyorlar, evde boş yatak var, kasaba refahı en az minHappiness, nüfus maxPopulation'dan az
//   (göç sınırının üstünde: dolu kasabada da aileler büyüyebilir), en az minDaysMarried gündür evliler, son
//   çocuktan bu yana minDaysBetween gün geçti, en çok maxPerCouple. Ailenin evi doluysa evdeki bekâr bir
//   ev arkadaşı (başka bir evde boş yatak varsa) yer açmak için oraya taşınır. Göçmenler evli çiftlerin
//   evine yerleşmez: o yataklar çocuklara kalır.
// Çocuk growDays gün (aralıktan rastgele) sonra adultAge yaşında yetişkin olur.
export const CHILDREN = {
  birthHour: 7,
  maxPopulation: 30,
  chancePerDay: 0.45,
  minHappiness: 62,
  minDaysMarried: 1,
  minDaysBetween: 4,
  maxPerCouple: 2,
  growDays: [6, 8],
  adultAge: 18,
};

// Çocukların günlük düzeni ve boş zaman tercihleri (kişilik özelliklerinin düzeninin yerine geçer)
export const CHILD_SCHEDULE = { bedtime: 20.5, wake: 7.5 };
export const CHILD_LEISURE = { play: 5, flowers: 2, stroll: 0.8, river: 0.6 };
export const CHILD_SPEED = 1.15; // koşuşturarak yürür

// Oynayan çocukların yanındaki yetişkinlerin keyfi (dakika başına) artar
export const CHILD_JOY = { radius: 44, perMinute: 0.05 };

// Çocuk adları (kasabada henüz olmayan biri seçilir)
export const CHILD_NAMES = ['Duru', 'Ada', 'Aras', 'Elif Naz', 'Poyraz', 'Masal', 'Çınar', 'Lina', 'Ege', 'Defne Su', 'Kuzey', 'Mira', 'Atlas', 'Nehir', 'Yaz', 'Toprak'];
// Çocukların gömlek renkleri (canlı tonlar; saç ve ten ebeveynlerden gelir)
export const CHILD_SHIRTS = ['rose', 'sky', 'mustard', 'mint', 'red', 'lavender'];
export const CHILD_HAIR_STYLES = ['short', 'long', 'bun', 'spiky'];

// Atışma: zıt kişilikli (data/characters.js -> OPPOSING_TRAITS) iki sakin
//   - aynı yapıda / şantiyede yan yana çalışırken dakikada workChancePerMinute
//   - aynı toplanma yerinde sohbet ederken dakikada chatChancePerMinute
//   - dar bir yerde (encounterRadius piksel) karşılaşınca dakikada encounterChancePerMinute
// olasılıkla atışır. Atışmada ilişki scoreLoss puan, ikisinin keyfi funLoss düşer; aynı çift
// cooldownMinutes boyunca yeniden atışmaz. Zıt kişilikliler sohbet ve çalışmadan yarı puan kazanır.
export const CONFLICT = {
  // (15. aşama) Sosyal denge: 50 günlük stres koşularında 5330 atışmaya 128 barışma düşüyordu; sürtüşmeler
  // törpülendi (olasılıklar düştü, aynı çift en az 10 saat ara verir), barışma yerleri çoğaldı
  workChancePerMinute: 0.012,
  chatChancePerMinute: 0.0005,
  encounterChancePerMinute: 0.004,
  encounterRadius: 12,
  cooldownMinutes: 600,
  scoreLoss: 8,
  funLoss: 6,
  clashGainMultiplier: 0.5,
  feudQuarrelMultiplier: 0.25, // küs çift birbirini görmezden gelir: yeniden atışma olasılığı dörtte bir
};

// Barışma: puanı below'un altında olan (küs: atışıp eksiye düşmüş) iki sakin aynı toplanma yerinde sohbet ederken dakikada chancePerMinute
// olasılıkla barışır; puanları resetTo olur. (15. aşama) Gönül alma yerlerinde (Kasaba Hanı, Ahşap Çardak, Kamp Ateşi,
// şenlik ve mevsim festivalleri) olasılık venueMultiplier kat (+%300) olur ve bu yerlerde kimse atışmaz.
// Akşam (eveningFrom'dan sonra) handa sıcak yemek yiyenler de içeride barışabilir.
export const RECONCILE = {
  below: 0, // (15. aşama) atışıp eksiye düşen her çift küstür (eskiden yalnızca -10'un altı)
  chancePerMinute: 0.05,
  venueMultiplier: 4,
  venues: ['inn', 'gazebo', 'campfire', 'festival'],
  resetTo: 12,
  eveningFrom: 17,
};
// Barışılan yer -> anı cümlesinin başı ("Han'da Deniz ile barıştı")
export const RECONCILE_PLACES = { inn: "Han'da ", gazebo: 'Çardakta ', campfire: 'Ateş başında ', festival: 'Şenlikte ', chat: '' };
