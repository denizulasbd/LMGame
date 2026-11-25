// (32.5) Hobi Evleri ve Kulüpler: bütün sayılar, adlar ve metinler bu dosyadadır. Saf hesaplar systems/Clubs.js, durum
// systems/ClubSystem.js, arayüz ui/components/clubCards.js, görsel art/sprites/structuresClubs.js. Şalter ENGINES.clubs.
//
// İlke: kulüpler küçük, sıcak, görünür bir canlılıktır; ekonomi ya da güç aracı DEĞİLDİR. Hiçbir ürün hazineye altın eklemez,
// üretim zincirlerine (bahçe verimi, kumaş) çarpan eklenmez. Rastgelelik YOK: üyelik, buluşma takvimi ve ürünler kimlikten,
// özellikten, beceriden ve takvimden türer; bu katmanın üreteci yoktur. Buluşma state.rally'yi KULLANMAZ (konser / Toplanma
// Zili ondadır); kendi kaydı state.clubs[anahtar].live'dır.

export const CLUB_KEYS = ['gardenClub', 'sewingClub', 'paintingClub'];

// Üyelik: gün dönümünde (00:00, yaşlanmadan ve Darülfünun'dan sonra). Kulüp başına en çok `capacity`, herkes en çok bir kulüpte.
// Eşiği geçen en yüksek puanlılar sırayla yerleşir (eşitlikte kimlik); dolu kulüpte mevcut üye çıkarılmaz.
export const CLUB = {
  capacity: 6,
  threshold: 3, // clubAffinity bu puanın altındaysa kendiliğinden katılmaz (oyuncu yine davet edebilir)
  minSession: 3, // bu kadar üye uygun değilse o akşam buluşma olmaz (kart da çıkmaz)
  missLimit: 3, // üst üste bu kadar buluşmayı kaçıran ve puanı eşiğin altına düşen üye kendiliğinden ayrılır
  kickDays: 8, // oyuncunun çıkardığı üye bu kadar gün aynı kulübe kendiliğinden dönmez
  blockedGrace: 30, // buluşma saatinde şenlik / konser / anma sürüyorsa bu kadar dakika beklenir; sürerse o akşam buluşma yok
  attendanceKept: 4, // son kaç buluşmanın katılımı saklanır (clubFactor ve itibar canlılığı)
  // Arkadaşlık: aynı buluşmada kulüp evinde birlikte olan üyeler arasında dakikada RELATIONSHIP_RATES.chat × bu çarpan
  // (çardağın friendshipMultiplier'ı 1,6; handa 1,4). Aşk zarı atılmaz (etkinlik 'leisure').
  friendshipMultiplier: 1.5,
  // Buluşma dışında üyenin kendi kulüp evinde tek başına uğraşı (clubHobby): boş zaman ağırlığı (yalnızca üyede, yapı varken)
  hobbyWeight: 0.6,
  // Buluşmaya gelen üyeye (bitişte, en az bu kadar dakika kaldıysa) Tatlı Sohbet (warm_chat, neden 'club')
  moodletMinutes: 30,
};

// Takvim (oyun günü tek / çift; dakika gün içinde). Aynı akşam en çok iki kulüp: tek günlerde bahçe ve resim (yarım saat
// kaydırmalı), çift günlerde dikiş.
export const CLUB_SCHEDULE = {
  gardenClub: { parity: 1, from: 17.5 * 60, to: 19.5 * 60 },
  sewingClub: { parity: 0, from: 17.5 * 60, to: 19.5 * 60 },
  paintingClub: { parity: 1, from: 18 * 60, to: 20 * 60 },
};

// Kulüpler: adlar, etiketler, poz ve alet (BehaviorSystem task.pose / task.tool), ürün kuralları.
export const CLUBS = {
  gardenClub: {
    name: 'Bahçecilik Kulübü',
    member: 'Bahçecilik Kulübü üyesi',
    icon: 'herb',
    label: "Bahçecilik Kulübü'nde fide dikiyor",
    winterLabel: "Bahçecilik Kulübü'nün serasında fide büyütüyor",
    travel: "Bahçecilik Kulübü'ne gidiyor",
    hobbyLabel: "Bahçecilik Kulübü'nün tarhlarında çapa yapıyor",
    pose: 'work',
    tool: 'hoe',
    winterIndoor: true, // kışın buluşma seranın içinde (görünüm farklı, etki aynı)
    // Ürün: her 3 buluşmada bir tarh / saksı aşaması (en çok 6); yapının estetiği aşama başına +0,5 (tavan 3)
    every: 3,
    maxWorks: 6,
    aestheticPerWork: 0.5,
    springFruit: 1, // bahar başında her üyenin çantasına (yer varsa) bir Meyve
  },
  sewingClub: {
    name: 'Dikiş-Nakış Evi',
    member: 'Dikiş-Nakış Evi üyesi',
    icon: 'cloth',
    label: "Dikiş-Nakış Evi'nde gergef işliyor",
    travel: "Dikiş-Nakış Evi'ne gidiyor",
    hobbyLabel: "Dikiş-Nakış Evi'nde tek başına nakış işliyor",
    pose: 'sit',
    tool: 'shuttle',
    // Ürün: her 4 buluşmada bir Nakışlı Mendil (kışın mevsimde bir kez Dayanıklı Giysi): kesesi en boş ya da kışın en çok üşüyen
    // sakine hediye (zarsız sıralama). Hammadde harcanmaz; altın yok.
    every: 4,
    giftRelation: 4, // hediye alanla her üye arasında ilişki +
  },
  paintingClub: {
    name: 'Resim Atölyesi',
    member: 'Resim Atölyesi üyesi',
    icon: 'masterpiece',
    label: "Resim Atölyesi'nde manzara çiziyor",
    travel: "Resim Atölyesi'ne gidiyor",
    hobbyLabel: "Resim Atölyesi'nde tek başına eskiz çiziyor",
    pose: 'stand',
    tool: null,
    easel: true,
    // Ürün: her 3 buluşmada duvara bir tablo (en çok 6; ad "Bahar Sabahı — {ressam}"), tablo başına yapının estetiği +0,4;
    // 6. tabloda bir kez Kasaba Sergisi (kart, çevresindekilere bir gün hafif keyif)
    every: 3,
    maxWorks: 6,
    aestheticPerWork: 0.4,
    exhibitAt: 6,
    exhibitMinutes: 24 * 60,
    exhibitRadius: 6, // karo
    exhibitFun: 0.03, // dakikada keyif (çevresinde dışarıda olan sakin)
  },
};

// Yakınlık puanı (clubAffinity): özellik / huy / beceri / iş yeri / dost çekimi / zıt eğilim. Eşik CLUB.threshold.
export const CLUB_AFFINITY = {
  gardenClub: {
    traits: { natureLover: 3, sleepyhead: -0.5 },
    quirks: { natureEnthusiast: 3, animalLover: 1.5 },
    skills: { farming: 0.75, herbalism: 0.75 }, // beceri seviyesi başına (en çok skillCap seviye)
    work: ['garden', 'healerHut'], // bu yapıda çalışana +work
  },
  sewingClub: {
    traits: { hardworking: 2, introvert: 1, nightOwl: 0.5 },
    quirks: { craftsman: 3, entrepreneur: 1 },
    skills: { crafting: 1, building: 0.5 },
    work: ['loom'], // dokumacılık (Dokuma Tezgâhı)
  },
  paintingClub: {
    traits: { introvert: 1.5, cheerful: 1, ambitious: -0.5 },
    quirks: { bookworm: 2.5, philosopher: 2.5, musician: 2 },
    skills: { scholarship: 0.5 },
    work: [],
  },
};
export const AFFINITY_RULES = {
  skillCap: 2, // beceri katkısı en çok bu kadar seviye sayılır
  work: 1, // ilgili iş yerinde çalışan
  friend: 1.5, // kulüpte yakın dostu (topFriends, en az 'friend' seviyesinde) olan her üye için
  friendCap: 3,
  friendLevel: 'friend',
  friendCount: 5, // topFriends kaç kişiye bakar
  social: { socialButterfly: 0.5, festive: 0.5 }, // kalabalığı seven: her kulübe biraz
  grumpy: -1, // zıt eğilim (her kulüpte)
};

// Suç riski (Justice.clubFactor): üye ×0,9; son 4 buluşmanın en az ikisine katılmış etkin üye ×0,75
export const CLUB_CRIME = { member: 0.9, active: 0.75, activeMin: 2 };

// İtibar (Renown.renownClubs): (etkin üye / yetişkin + bilge) × canlılık (son buluşmaların gerçekleşme oranı), 0-1
export const CLUB_RENOWN = { scale: 1 };

// Nakışlı Mendil (data/citizens.js ITEMS.handkerchief): yoksulluk hesabında kese yanında bu kadar değer sayılır (32.1 riski)
export const HANDKERCHIEF = { worth: 4 };

// Tablo adları: mevsim adı + resmin konusu (sırayla; zarsız)
export const PAINTING_TITLES = {
  spring: ['Bahar Sabahı', 'Çiçekli Yamaç', 'Erik Dalları'],
  summer: ['Yaz Öğleni', 'Buğday Tarlası', 'Nehir Kıyısı'],
  autumn: ['Güz Akşamı', 'Kızıl Orman', 'Bağ Bozumu'],
  winter: ['Karlı Damlar', 'Kış Ocağı', 'Buzlu Göl'],
};

export const CLUB_TEXT = {
  founded: '{club} kuruldu: {names} ilk buluşmayı bekliyor.',
  joined: '{name} {club}\'ne katıldı',
  left: '{name} {club}\'nden ayrıldı',
  kicked: '{name} {club}\'nden çıkarıldı',
  invited: '{name} {club}\'ne davet edildi ve katıldı',
  session: '{club} buluştu ({n} üye)',
  bed: '{club} kulüp evinin önüne yeni bir {what} dikti ({n}/{max}).',
  bedWords: ['çiçek tarhı', 'saksı sırası', 'gül fidesi', 'lavanta tarhı', 'sardunya saksısı', 'kasımpatı tarhı'],
  handkerchief: '{club} bir Nakışlı Mendil işledi ve {name}\'e hediye etti.',
  garment: '{club} kış için bir Dayanıklı Giysi dikti ve {name}\'e hediye etti.',
  painting: 'Resim Atölyesi\'nin duvarına yeni bir tablo asıldı: "{title}" ({n}/{max}).',
  exhibition: 'Kasaba Sergisi açıldı! Resim Atölyesi altı tabloyu halka gösteriyor; geçenlerin içi açılıyor.',
  fruit: 'Bahar geldi: Bahçecilik Kulübü üyeleri tarhlardan birer Meyve topladı.',
  memoryBed: '{club} ile kulüp evinin önüne {what} diktik',
  memoryGift: '{club} ile işlediğimiz mendili {name}\'e hediye ettik',
  memoryGiftGarment: '{club} ile diktiğimiz giysiyi {name}\'e hediye ettik',
  memoryReceived: '{club} bana bir {item} hediye etti',
  memoryPainting: 'Resim Atölyesi\'nin duvarına "{title}" asıldı',
  memoryExhibition: 'Kasaba Sergisi\'nde tablolarımız halka gösterildi',
  memoryJoined: '{club}\'ne katıldım',
};
