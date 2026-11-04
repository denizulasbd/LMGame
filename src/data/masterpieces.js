// (15. aşama) Usta işi eserler: Usta (Lv.3) bir sakin kendi iş yerinde bir mesaiyi bitirince nadiren normal ürünün
// yanında eşsiz bir eser ortaya koyar. Eser kasabanın deposuna (Kasaba Arşivi'nin "Usta İşi Eserler" vitrini) girer;
// oyuncu onu sergileyip kasabaya kalıcı refah katabilir ya da limandan / gezgin tüccara yüksek fiyata satabilir.
//
//   skill    : eseri yapan meslek (src/data/skills.js)
//   activity : hangi iş yerinde çalışırken çıkar (data/activities.js anahtarı)
//   value    : limandan satış fiyatı (altın); tüccar MASTERWORK.merchantRate'ini öder
export const MASTERPIECES = {
  carvedChest: {
    name: 'İşlemeli Yadigâr Sandık',
    skill: 'woodcutting',
    activity: 'lumber',
    icon: 'mwChest',
    value: 280,
    description: 'Ceviz kerestesinden, kapağı vadinin haritasıyla oyulmuş bir sandık',
  },
  stoneFigure: {
    name: 'Görkemli Taş Figür',
    skill: 'masonry',
    activity: 'quarry',
    icon: 'mwFigure',
    value: 260,
    description: 'Taş ocağının en sağlam bloğundan yontulmuş, meydanı süsleyecek bir figür',
  },
  ironStatue: {
    name: 'Kusursuz Demir Heykel',
    skill: 'mining',
    activity: 'mineIron',
    icon: 'mwStatue',
    value: 360,
    description: 'Tek parça cevherden dövülmüş, pası tutmayan bir heykel',
  },
  royalLoaf: {
    name: 'Kraliyet Ziyafet Ekmeği',
    skill: 'baking',
    activity: 'bake',
    icon: 'mwLoaf',
    value: 240,
    description: 'Örgülü, susamlı, bal sürülmüş; saraya layık bir ziyafet ekmeği',
  },
  townRug: {
    name: 'İnce Dokuma Kasaba Halısı',
    skill: 'husbandry',
    activity: 'herd',
    icon: 'mwRug',
    value: 320,
    description: 'Ağılın en ince yününden dokunmuş, kasabanın armasını taşıyan bir halı',
  },
  lifeElixir: {
    name: 'Mucizevi Hayat İksiri',
    skill: 'herbalism',
    activity: 'brew',
    icon: 'mwElixir',
    value: 400,
    description: 'Yedi şifalı otun özünden damıtılmış, ışıl ışıl bir iksir',
  },
};

export const MASTERPIECE_KEYS = Object.keys(MASTERPIECES);

// Hangi iş hangi eseri çıkarır (iş -> eser)
export const MASTERPIECE_BY_ACTIVITY = Object.fromEntries(MASTERPIECE_KEYS.map((k) => [MASTERPIECES[k].activity, k]));

export const MASTERWORK = {
  baseChance: 0.04, // Usta bir mesaiyi bitirince
  pinnedBonus: 0.02, // oyuncunun sabitlediği iş yerinde (kendi tezgâhı)
  toolBonus: 0.02, // Sağlam Alet kuşanmışsa
  townPerDay: 1, // kasabada günde en çok bir usta işi eser (nadir kalsın)
  makerCooldownDays: 3, // bir usta iki eser arasında en az bu kadar gün bekler (kasabada 20+ usta olunca eser bollaşmasın)
  exhibitHappiness: 1, // sergilenen her eser kasaba refahına kalıcı +1
  maxExhibitHappiness: 12,
  merchantRate: 0.85, // gezgin tüccar limanın ödediğinin %85'ini öder
  maxStored: 12, // satılmayı / sergilenmeyi bekleyen en çok eser (vitrin dolunca usta yeni eser yapmaz)
};
