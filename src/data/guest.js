// (26. aşama, 26.3) Gezgin Konuklar: Seyyar Ozan, Nadir Takasçı ve Yaşlı Seyyah (Masalcı). Mantık: src/systems/GuestSystem.js (saf hesaplar:
// src/systems/Guest.js), çizim: src/rendering/GuestEffects.js.
//
// Kasabaya Altın Çağ'dan SONRA, 6-8 günde bir (panayır gününe yakınsa o gün) bir gezgin uğrar: sabah 09:00'da harita kenarından girer, 24-48 saat
// kalır, günlüğe teşekkür notu bırakıp yoluna devam eder. Altın Çağ'dan önce hiç gelmez: erken oyun ve kule öncesi her kayıt aynı kalır.
// Konuklar GEÇİCİ misafirdir (`isGuest: true`): state.characters'ta yer almazlar; konut kapasitesini, iş gücü kotalarını, nüfusu ve göç
// koşullarını hiçbir biçimde etkilemezler. Gece handa (yoksa çardakta) dinlenirler.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 34): geliş zamanı, tür, kimlik, takas ve söz seçimi.
// Ana üretece ve Math.random'a dokunmaz.
export const GUEST = {
  arrivalHour: 9,
  departHour: 9,
  restHour: 22, // dinlenmeye çekilir
  wakeHour: 7,
  intervalDays: [6, 8], // bir ayrılıştan sonra yeni konuğa kadar gün
  firstDelayDays: 2, // Altın Çağ'ın başladığı günden ilk konuğa en az gün
  fairSnapDays: 2, // panayır günü bu kadar gün erkenden bile gelebilir
  stayDays: [1, 2], // 24-48 saat
  minPopulation: 3,
  speechSeconds: 3.6,
  listenRadius: 150, // piksel: ozanı ve masalcıyı dinleyenler
};

export const GUEST_TYPES = {
  bard: {
    name: 'Seyyar Ozan',
    icon: 'note',
    names: ['Aydın', 'Yalın', 'Sevgül', 'Mehtap'],
    appearances: [
      { hair: 'long', hairColor: 'auburn', skin: 'light', shirt: 'teal', pants: 'brown' },
      { hair: 'short', hairColor: 'black', skin: 'tan', shirt: 'mustard', pants: 'plum' },
    ],
    arrive: 'Seyyar Ozan {name} kasabaya uğradı! Akşamları lirini çalacak.',
    thanks: 'Seyyar Ozan {name} kasabanın misafirperverliğine teşekkür ederek yeni diyarlara doğru yola çıktı.',
    // Akşam çalar: 18:00 - 22:00 (şenlik / han / meydan); gündüz handa dinlenir
    playFrom: 18,
    playTo: 22,
    buff: 'bardSong', // data/town.js -> TOWN_BUFFS: Ozan Ezgisi
    funPerMinute: 0.45, // dinleyenin keyif barına dakikada
    speechPerMinute: 0.02,
    lines: ['La la laay, kasaba şenlensin!', 'Bir türkü tutturalım hep birlikte...', 'Dinleyin, ey Pikselköylüler!', 'Lirimin teli de bu akşam neşeli!', 'Yollar uzun, ezgi sonsuz...'],
  },
  collector: {
    name: 'Nadir Takasçı',
    icon: 'sparkle',
    names: ['Kervancı Salih', 'Koleksiyoncu Nazım', 'Gezgin Perihan', 'Antikacı Behçet'],
    appearances: [
      { hair: 'bun', hairColor: 'gray', skin: 'light', shirt: 'plum', pants: 'navy' },
      { hair: 'short', hairColor: 'brown', skin: 'tan', shirt: 'forest', pants: 'brown' },
    ],
    arrive: 'Nadir Takasçı {name} kasabaya uğradı! Fazla lüks mallarınızı nadir eşyalarla takas edebilir.',
    thanks: 'Nadir Takasçı {name} takaslardan memnun, kasabanın misafirperverliğine teşekkür ederek yoluna devam etti.',
    barterHour: 12, // günde bir kez, öğlen
    maxBarters: 2, // konaklama başına
    // Fazla lüks mal: bu stokların ÜSTÜ takasa girer (Zengin Şölen Sofrası için yeter stok kalır)
    reserve: { cloth: 2, sherbet: 2 },
    lines: ['Nadide eşyalarım var, bakmaz mısınız?', 'Bu parçayı Doğu\'nun en uzak köşesinden getirdim.', 'Fıçı şerbetiniz harika, takas edelim mi?', 'Ketenle dokunmuş kumaşa bayılırım!'],
    noBarter: 'Fazla lüks malınız yok: bu sefer takas yapamayız, ama kasabanız çok güzel!',
  },
  storyteller: {
    name: 'Yaşlı Seyyah',
    icon: 'book',
    names: ['Tarık Dede', 'Nuriye Nine', 'Cemal Dede', 'Hacer Nine'],
    appearances: [
      { hair: 'bun', hairColor: 'gray', skin: 'light', shirt: 'lavender', pants: 'plum' },
      { hair: 'short', hairColor: 'gray', skin: 'tan', shirt: 'sky', pants: 'navy' },
    ],
    arrive: 'Yaşlı Seyyah {name} kasabaya uğradı! Gündüzleri çardakta masal anlatacak.',
    thanks: 'Yaşlı Seyyah {name} masallarını bırakıp kasabanın misafirperverliğine teşekkür ederek yoluna koyuldu.',
    tellFrom: 10,
    tellTo: 17,
    xpPerMinute: 0.8, // dinleyen çocuk / gencin Bilgelik (scholarship) deneyimi dakikada
    wisdomPerMinute: 0.05, // Kasaba Bilgeliği puanı (dinleyen başına dakikada)
    speechPerMinute: 0.02,
    lines: ['Bir varmış, bir yokmuş; evvel zaman içinde...', 'Dinleyin çocuklar, dağların ardında bir şehir varmış...', 'Masalın sonunda herkes kazanır!', 'Bu masalı ben de dedemden dinlemiştim.'],
    elderLines: ['Bizim zamanımızda da böyle masallar anlatılırdı...', 'Ah, ne günlerdi!', 'Yolların hatırı çoktur, dostum.'],
  },
};
export const GUEST_KEYS = Object.keys(GUEST_TYPES);

// Nadir takaslar (Nadir Takasçı): bedel kasaba deposundan düşer; karşılığı mevcut keşif ganimetleri (state.exploration) olarak kasabaya geçer
export const BARTER_OFFERS = {
  schema: { name: 'Antik Şema', icon: 'scheme', cost: { cloth: 5, sherbet: 3 }, grant: 'inscription', text: 'kadim bir imar şeması (Bilgelik Evi\'nde çözülür)' },
  shard: { name: 'Mermer Heykel Parçası', icon: 'relicShard', cost: { cloth: 3, sherbet: 2 }, grant: 'relicShard', text: 'Kadim Yadigâr Parçası (3 parça birleşince +2 refah)' },
  seed: { name: 'Egzotik Tohum', icon: 'vineSeed', cost: { sherbet: 3 }, grant: 'vineSeed', text: 'Egzotik Üzüm Fidesi (asma)' },
};
export const BARTER_KEYS = Object.keys(BARTER_OFFERS);
