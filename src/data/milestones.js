// Kasaba hedefleri (başarımlar). Sıra paneldeki sıradır. Nasıl ölçüldükleri
// src/systems/MilestoneSystem.js'te; burada yalnızca ad, açıklama, simge ve hedef sayı var.
//   kind  : ölçüm türü (MilestoneSystem yorumlar)
//   target: tamamlanması için gereken sayı (ilerleme çubuğu için)
export const MILESTONES = [
  {
    id: 'firstHome',
    name: 'İlk Yuva',
    description: 'İlk kulübeyi ya da herhangi bir yapıyı tamamla.',
    icon: 'hammer',
    kind: 'buildingsCompleted',
    target: 1,
  },
  {
    id: 'warmTable',
    name: 'Sıcak Sofra',
    description: 'Kasaba Hanı kur ve ilk sıcak yemeği pişir.',
    icon: 'food',
    kind: 'mealsCooked',
    target: 1,
  },
  {
    id: 'tradeRoutes',
    name: 'Ticaret Yolları',
    description: 'Pazar Yeri kur ve gezgin tüccarla ilk takası yap.',
    icon: 'coin',
    kind: 'trades',
    target: 1,
  },
  {
    id: 'growingFamily',
    name: 'Büyüyen Aile',
    description: 'Kasaba nüfusunu 10 sakine çıkar.',
    icon: 'heart',
    kind: 'population',
    target: 10,
  },
  {
    id: 'artisans',
    name: 'Zanaatkârlar',
    description: 'Kasabada en az 3 farklı sakini bir meslekte Usta yap.',
    icon: 'star',
    kind: 'masters',
    target: 3,
  },
  // (30.4b, ENGINES.midgame) beş ara hedef: şalter kapalıyken liste dokuz hedeftir (MilestoneSystem.activeMilestones)
  {
    id: 'heardVoices',
    name: 'Kulak Veren Yönetim',
    description: '5 vatandaş dilekçesini karşıla.',
    icon: 'heart',
    kind: 'petitionsMet',
    target: 5,
    midgame: true,
  },
  {
    id: 'peoplesHeart',
    name: 'Halkın Gönlü',
    description: 'Halkın Nabzı art arda 3 gün Memnun ya da Minnettar olsun.',
    icon: 'smile',
    kind: 'pulseStreak',
    target: 3,
    midgame: true,
  },
  {
    id: 'firstFarewell',
    name: 'Vefa Borcu',
    description: 'Bir anma töreninde Taziye Sofrası kur.',
    icon: 'candle',
    kind: 'condolences',
    target: 1,
    midgame: true,
  },
  {
    id: 'chosenPath',
    name: 'Yolunu Seç',
    description: 'Bir Kasaba Doktrini seç.',
    icon: 'wonder',
    kind: 'doctrine',
    target: 1,
    midgame: true,
  },
  {
    id: 'legacy',
    name: 'Kuşaktan Kuşağa',
    description: 'İlk yadigârın bir sonraki kuşağa devredilmesini sağla.',
    icon: 'star',
    kind: 'heirloomPassed',
    target: 1,
    midgame: true,
  },
  {
    id: 'winterTrial',
    name: 'Kış Sınavı',
    description: 'Bir kışı kimseyi kaybetmeden ve refahı %65\'in altına düşürmeden atlat.',
    icon: 'winter',
    kind: 'wintersSurvived',
    target: 1,
  },
  {
    id: 'brightStreets',
    name: 'Işıltılı Sokaklar',
    description: 'En az 6 Sokak Feneri kur ve 15 karo Taş Yol döşe.',
    icon: 'sun',
    kind: 'streets',
    target: 2, // iki koşul: fenerler ve taş yollar
    lights: 6,
    cobbles: 15,
  },
  {
    id: 'crown',
    name: 'Kasabanın Tacı',
    description: 'Görkemli Kasaba Anıtı\'nı inşa et!',
    icon: 'smile',
    kind: 'monument',
    target: 1,
  },
  {
    id: 'pearl',
    name: 'Vadinin İncisi',
    description: 'Ulu Saat Kulesi\'ni üç aşamasıyla (Temel, Gövde, Mekanizma & Çan) tamamla ve Altın Çağ\'ı başlat.',
    icon: 'wonder',
    kind: 'wonder',
    target: 3, // temel, gövde, kule
  },
];

// Kış sınavı: kış boyunca refah bunun altına düşmemeli
export const WINTER_TRIAL_MIN_HAPPINESS = 65;
