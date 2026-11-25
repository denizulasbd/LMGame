// (18. aşama) Serbest imar, peyzaj fırçası ve kasaba estetiği: saf veri ve denge değerleri.
//
//   AESTHETIC     : süs yapılarının ve döşemeli zeminin çevresine yaydığı "Çevre Estetiği"; puanın 4-5 karoluk
//                   bölgeye nasıl yayıldığı, yürüyen ve bankta oturan sakinin keyfine etkisi, hafif güzel anılar ve
//                   kasabanın toplam estetiğinin refaha kalıcı çarpanı (+%1 ... +%5)
//   DARKNESS      : gece dışarıda, hiçbir ışığın düşmediği karanlık sokakta yürüyen sakin ürker (keyfi biraz hızlı
//                   kaçar); sokak fenerleri bunu önler
//   MUD           : yağmurda toprak patika çamurlanır (yavaş yürünür, yol bulma parke taşı yeğler)
//   ORNAMENTAL_TREES : dikilen süs fidanları iki günde büyür (fidan -> genç ağaç -> ulu ağaç); gölgesinde dinlenilir
//   STREET_NAMES  : yeni dikilen Mahalle Tabelası'nın önerilen adı (oyuncu tıklayıp değiştirir)
//   BUILD_TABS    : alt dock'taki İnşa menüsünün sekmeleri

export const AESTHETIC = {
  radius: 4.5, // karo: süs yapısının estetiği bu yarıçaptaki bölgeye yayılır (merkezde tam, kenarda azalarak)
  // Yapı türü -> estetik puanı (yarıçapın merkezindeki katkı). Süs ağaçları büyüdükçe tam puana ulaşır.
  values: {
    flowerBed: 3,
    planter: 2.2,
    flowerFence: 1.2,
    woodFence: 0.5,
    fenceGate: 0.8,
    cherryTree: 3,
    birchTree: 2.4,
    oakTree: 2.4,
    pineTree: 2.2,
    marbleArch: 3,
    gazebo: 4,
    bench: 1,
    parkBench: 2,
    lantern: 1.4,
    ironLantern: 2,
    signpost: 1,
    grapeVine: 2,
    ancientTorch: 2,
    monument: 4,
    fountain: 3,
    marbleFountain: 6, // (20. aşama) Altın Çağ'ın prestij peyzajı
    goldenLantern: 3.5,
    royalStatue: 7, // (22. aşama) Kraliyet Aslanlı Heykeli: kasabanın en şık anıtı
    well: 1.5, // (23. aşama) Su Kuyusu: hafif estetik
    guardTower: 1, // (23. aşama) Gözcü Kulesi
    // (31. aşama) Kasaba Süsleri
    noticeBoard: 1,
    scarecrow: 1.2,
    woodpile: 0.4,
    bandstand: 6,
    heroStatue: 6,
    courthouse: 3, // (32.2) Adalet Sarayı
    peaceFountain: 5, royalRoseGarden: 9, royalArchive: 3, // (32.3) Kraliyet Lütfu
    university: 3, // (32.4) Darülfünun
    gardenClub: 1.5, sewingClub: 1, paintingClub: 1, // (32.5) hobi evleri (ürünleri Clubs.clubAesthetic ile tavanlı artar)
  },
  // Döşemeli zemin karoları: komşuluğuna küçük estetik katkı (taş plaka meydanı en şık zemindir)
  tileValues: { plaza: 0.35, cobble: 0.2 },
  tileRadius: 1.5,
  // Sakinlere etki
  pleasantThreshold: 2.5, // bu puanın üstündeki karo "güzel sokak" sayılır
  walkFunPerMinute: 0.035, // güzel sokakta yürürken dakikada keyif (puanla artar, en çok 2 katı)
  benchFunPerMinute: 0.12, // güzel bir köşedeki bankta otururken dakikada ek keyif (manzara)
  maxFactor: 2,
  memoryChancePerMinute: 0.004, // güzel sokakta yürürken / bankta otururken hafif güzel anı olasılığı
  memoryCooldownDays: 2, // aynı sakinin iki estetik anısı arası en az
  flowerRadius: 1.6, // karo: çiçek kokusu (saksı, çiçek tarhı, çiçekli çit, kiraz)
  flowerTypes: ['planter', 'flowerBed', 'flowerFence', 'cherryTree'],
  // Kasabanın toplam estetiği -> refah çarpanı: ilk eşikte +%1, her adımda +%1, en çok +%5
  townScoreSteps: [12, 30, 55, 85, 120],
  tileScoreWeight: 0.05, // döşemeli her karonun toplam puana katkısı (taş plaka 0,05 x 2)
};

export const DARKNESS = {
  fromHour: 20,
  toHour: 5,
  funPerMinute: 0.015, // karanlık sokakta yürüyen sakinin keyfi dakikada bu kadar fazla kaçar (keyif azalmasının ~%25'i)
  // Gecenin karanlığını yaran ışık kaynakları ve ışık yarıçapları (piksel)
  lights: { lantern: 52, ironLantern: 68, ancientTorch: 58, campfire: 70, watchtower: 84, guardTower: 90, inn: 34, fishingPier: 46, harbor: 56, wonder: 230, goldenLantern: 96 },
};

export const MUD = {
  tiles: ['path'], // parke taşı, taş plaka ve köprü çamurlanmaz
  speedMultiplier: 0.8, // çamurlu patikada yürüme hızı çarpanı
  extraMoveCost: 0.35, // yol bulmada çamurlu patikanın ek maliyeti (sakinler parke taşı yeğler)
};

export const ORNAMENTAL_TREES = {
  growHours: 48, // dikildikten sonra ulu ağaç olana dek (2 gün)
  youngAt: 0.4, // büyümenin bu oranında fidan genç ağaç olur
  shadeFunPerMinute: 0.45, // gölgede dinlenen sakinin keyfi (etkinlik: shade)
};

export const STREET_NAMES = [
  'Gül Sokağı', 'Çınar Yolu', 'Değirmen Yokuşu', 'Lale Sokağı', 'Kestane Yolu', 'Kuyu Başı', 'Fener Sokağı',
  'Bahar Yolu', 'Ihlamur Sokağı', 'Dere Boyu', 'Ardıç Mahallesi', 'Papatya Sokağı', 'Elma Yolu', 'Yel Sokağı',
];

// İnşa menüsünün sekmeleri. items: data/buildings.js -> BUILD_MENU'deki sırayla bu sekmeye düşen türler
export const BUILD_TABS = [
  { id: 'buildings', name: 'Yapılar', icon: 'hammer' },
  { id: 'roads', name: 'Yol & Zemin', icon: 'road' },
  { id: 'decor', name: 'Peyzaj & Dekorasyon', icon: 'flower' },
];

/** Kasabanın toplam estetiğinden refah çarpanı yüzdesi (0-5). */
export function aestheticPercent(score) {
  return AESTHETIC.townScoreSteps.filter((s) => score >= s).length;
}
