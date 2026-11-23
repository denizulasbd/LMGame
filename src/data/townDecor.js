// (31. aşama) Kasaba Süsleri: küçük işleri olan dekoratif yapıların kuralları (saf veri). Mantık src/systems/TownDecor.js (saf)
// ve src/systems/TownDecorSystem.js; şalter ENGINES.townDecor. Görseller src/art/sprites/structuresDecor.js.
//
//   NOTICE_BOARD : İlan Tahtası (Köy). Panelinde kasabanın bütün açık işleri (dilekçe, Kraliyet Fermanı, tahsildar, vergi günü,
//                  Kraliyet Cezası, haydut baskını, isyan) tek listede durur. Kasabada bir tahta varsa yeni açılan her
//                  dilekçenin süresi petitionExtraMinutes uzar (sakin tahtaya asar, komşular okur). Tahtada en çok maxNotes
//                  kâğıt görünür; Kraliyet Fermanı varken mühürlü parşömen asılır.
//   WOODPILE     : Odun Yığını (Mezra). Yalnızca oduna +capacity depo. Çevresindeki radius karoda (merkezden merkeze) oturulan
//                  evler kışın heatingFactor kadar odun yakar (odun kapı önünde: soba hep dolu). Kütükler odun stoğunun depo
//                  sınırına oranıyla görünür (fillSteps eşiği: 0 boş, 1 tek sıra, 2 iki sıra, 3 dolu).
//   SCARECROW    : Korkuluk (Mezra). radius karo içindeki (ayak izinden ayak izine) bahçeye +gardenBonus verim; bahçe başına
//                  bir korkuluk sayılır. Kolundaki karga crowSeconds döngüsünde konup kalkar (yalnızca görsel); sonbaharda
//                  şenlik kıyafeti giyer.
//   BANDSTAND    : Müzik Köşkü (Gelişmiş Şehir, tek). Panelden Akşam Konseri: concertGold altın; startHour-lastStartHour arası
//                  başlar, cooldownDays günde bir. Konser minutes dakika sürer ve Toplanma Zili gibi uyanık sakinleri köşkün
//                  çevresinde toplar; orada duranların keyfi ve sosyalliği her dakika dolar, bitişte Yönetim Güveni +trust.
//                  Seyyar Ozan kasabadaysa konserde çalar: keyif ve sosyallik bardMul katı. Dinleyenlere 'concert' moodlet'i.
//   HERO_STATUE  : Kahraman Heykeli (Gelişmiş Şehir). Kurulunca panelden bir sakin onurlandırılır (adı künyeye kazınır, figürün
//                  aleti ustalığına göre: poses). Onurlandırılanın eşi, çocukları, torunları ve ebeveynleri her gün ilk kez
//                  radius karo yakınından geçince 'ancestor_pride' moodlet'i alır. Bir sakin yalnızca bir heykelde olur.
export const NOTICE_BOARD = {
  petitionExtraMinutes: 360,
  maxNotes: 4,
};

export const WOODPILE = {
  capacity: 25,
  radius: 5,
  heatingFactor: 0.85,
  fillSteps: [0.05, 0.35, 0.7],
};

export const SCARECROW = {
  radius: 2,
  gardenBonus: 0.08,
  crowSeconds: 14,
};

export const BANDSTAND = {
  concertGold: 40,
  startHour: 17,
  lastStartHour: 21,
  cooldownDays: 2,
  minutes: 120,
  radius: 5, // karo: köşkün merkezinden bu uzaklıktakiler dinleyici sayılır
  funPerMinute: 0.22,
  socialPerMinute: 0.18,
  trust: 4,
  bardMul: 2,
};

export const HERO_STATUE = {
  radius: 4,
  // Figürün elindeki alet: onurlandırılanın en yüksek becerisine göre (yoksa çekiç)
  poses: {
    scholarship: 'book',
    herbalism: 'book',
    fishing: 'rod',
    farming: 'sickle',
    husbandry: 'sickle',
  },
  defaultPose: 'hammer',
};

export const DECOR_TYPES = ['noticeBoard', 'woodpile', 'scarecrow', 'bandstand', 'heroStatue'];
