// (33.1) Sakin adları: yeni oyunda başlangıç sakinleri, göçmenler ve yeni doğanlar bu havuzdan ad alır.
// Yaygın, sıcak, kısa (en çok MAX_NAME_LENGTH harf) Türkçe adlar; tekrar yok; oyunda cinsiyet olmadığı için tek liste.
// Elle yazılmış 14 tanıdık yüzün (data/characters.js -> RESIDENT_POOL) ve eski ek adların hepsi buradadır.
export const MAX_NAME_LENGTH = 8;

export const RESIDENT_NAMES = [
  // tanıdık yüzler (RESIDENT_POOL) ve eski ek adlar (EXTRA_NAMES)
  'Ayşe', 'Mehmet', 'Elif', 'Can', 'Zeynep', 'Emre', 'Deniz', 'Selin', 'Mert', 'Defne', 'Kemal', 'Nilay', 'Ozan', 'Leyla',
  'Bora', 'Ece', 'Kaan', 'Yağmur', 'Arda', 'Duru', 'Efe', 'Lale', 'Tolga', 'Sude',
  // eski çocuk adları
  'Ada', 'Aras', 'Poyraz', 'Masal', 'Çınar', 'Lina', 'Ege', 'Kuzey', 'Mira', 'Atlas', 'Nehir', 'Yaz', 'Toprak',
  // yaygın ve sıcak adlar
  'Ali', 'Veli', 'Hasan', 'Hüseyin', 'Mustafa', 'Ahmet', 'İbrahim', 'İsmail', 'Osman', 'Murat', 'Burak', 'Cem', 'Okan', 'Serkan',
  'Tarık', 'Barış', 'Onur', 'Koray', 'Umut', 'Selim', 'Orhan', 'Cengiz', 'Fatih', 'Gökhan', 'Hakan', 'Levent', 'Metin', 'Oğuz',
  'Sinan', 'Taner', 'Volkan', 'Yusuf', 'Zafer', 'Alper', 'Berk', 'Eren', 'Furkan', 'Kerem', 'Tuna', 'Doruk', 'Batu', 'Yiğit',
  'Emir', 'Tayfun', 'Kağan', 'Rüzgâr', 'Ayaz', 'Tan', 'Derin', 'Ilgaz', 'Mete', 'Polat', 'Kudret', 'Süleyman', 'Ferhat', 'Nihat',
  'Fatma', 'Hatice', 'Merve', 'Büşra', 'Esra', 'Gül', 'Gülay', 'Sevgi', 'Aylin', 'Burcu', 'Cansu', 'Derya', 'Dilek', 'Ebru',
  'Figen', 'Gamze', 'Hande', 'Işıl', 'Jale', 'Kader', 'Melek', 'Nur', 'Özlem', 'Pınar', 'Rabia', 'Seda', 'Tülin', 'Yeliz',
  'Zehra', 'Aslı', 'Bahar', 'Çiğdem', 'Damla', 'Eda', 'Gizem', 'Hülya', 'İpek', 'Kübra', 'Mine', 'Nazlı', 'Oya', 'Reyhan',
  'Sema', 'Tuba', 'Yasemin', 'Sibel', 'Sevim', 'Sultan', 'Melis', 'Naz', 'Su', 'İrem', 'Ceren', 'Dilan', 'Ela', 'Beren',
  'Hazal', 'Mavi', 'Gonca', 'Gökçe', 'Yaprak', 'Çağla', 'Doğa', 'Irmak', 'Mercan', 'Sevil', 'Umay', 'Yaren', 'Ilgın', 'Deren',
  'Songül', 'Nesrin', 'Gülşen', 'Hanife', 'Emine', 'Ayten', 'Nermin', 'Berrin', 'Müge', 'Pelin', 'Sinem', 'Tuğba', 'Şule', 'Gülten',
];
