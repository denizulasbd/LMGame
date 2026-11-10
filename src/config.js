// Oyun genelindeki sabit ayarlar. Denge/ayar değişiklikleri önce buraya bakılarak yapılır.
export const CONFIG = {
  // --- Oyun ---
  GAME_TITLE: 'Pikselköy',     // başlangıç ekranındaki oyun adı

  // --- Dünya ---
  TILE_SIZE: 16,              // Bir karonun piksel boyutu
  MAP_WIDTH: 80,              // Karo cinsinden harita genişliği (yeni oyunlar; 8. aşama)
  MAP_HEIGHT: 80,
  WORLD_GEN_VERSION: 2,       // 2: mikro-biyomlu ve harabeli harita; 1: 1-7. aşamaların haritası
  LEGACY_MAP_SIZE: 48,        // haritası kayda yazılmamış eski (1-7. aşama) kayıtların harita boyutu

  // --- Kamera ---
  DEFAULT_ZOOM: 3,            // Her oyun pikseli ekranda kaç piksel olacak
  MIN_ZOOM: 2,
  MAX_ZOOM: 6,                // Yakınlaştırma tam sayı adımlarla yapılır (pixel-perfect)
  CAMERA_SPEED: 600,          // Klavye ile kaydırma hızı (ekran pikseli / saniye)

  // --- Döngü ---
  TICK_RATE: 60,              // Saniyedeki sabit simülasyon adımı

  // --- Zaman ---
  REAL_SECONDS_PER_GAME_MINUTE: 0.25, // 1x hızda bir oyun günü = 6 gerçek dakika
  TIME_SPEEDS: [1, 2, 4],     // HUD'daki hız seçenekleri
  START_DAY: 1,
  START_HOUR: 6,
  START_MINUTE: 0,
  DAYS_PER_SEASON: 4,         // 4 mevsim x 4 gün = 16 günlük yıl; oyun 1. gün ilkbaharda başlar

  // --- Karakterler ---
  CHARACTER_SPEED: 28,        // yürüme hızı (dünya pikseli / oyun-hızlı saniye)

  // --- Görsel ---
  WATER_ANIMATION_FPS: 4,

  // --- Kayıt ---
  SAVE_KEY: 'lmgame.save.v2',          // elle kaydedilen / sabah otomatik kaydedilen oyun
  SESSION_KEY: 'lmgame.session.v2',    // sayfa kapanırken yazılır: F5 oyunu kaldığı yerden sürdürür
  SAVE_VERSION: 33,                    // 28.2: Başusta (characters[].isGrandmaster, grandmasterProfession, grandmasterBatches; apprenticeship.grandmasters / grandmasterSaved); 28.1: Acil Seferberlik (yanan yapıda emergencyMuster), Vergi Fermanı kilidi (tax.lockedUntil); 26.3: Gezgin Konuklar (activeGuest: null | { type, name, look, arrivalDay, departureDay, x, y, leaving, resting, barters, lastBarterDay }, guestBook); 26.2: Büyük Ziyafet Sofrası (currentFeast: null | { tier, day, contributions, servings, served }); 26.1: Mevsimlik Panayır (aktif panayır durumu currentFestival: null | { type, day, phase }); 25.5: aile yadigârları (çantada heirloom bilgisi), çırak geçmişi (mentees), yadigâr sayaçları ve arşivi, Kuşak Şöleni, ilk yadigâr devri; 25.4: Aile Kütüğü (generation, parents, familyId, children), ocaklar ve reisler (lineage), ilk 2. kuşak düğünü, Yeni Konut Talebi; 25.3: yeni nesil huylar ve huyun kaynağı (quirkOrigin), mizaç sayaçları (temperament), yeni dilekçe türleri; 25.2: çıraklık (apprenticeship: usta, meslek, yapı, ilerleme), açık çırak kapıları ve sayaçlar, Gururlu Usta; 25.1: yaşam evresi (lifeStage) ve gün cinsinden yaş (ageInDays), yaşam evresi sayaçları (lifeStages); 24.3: Ticaret İskelesi / Kervan Konağı, gemi takvimi, ihracat sözleşmeleri, pazar çarpanları, ithalat sayaçları; 24.2: Dokuma Tezgâhı ve Şerbethane, Kumaş ve Fıçı Şerbeti stokları, handaki fıçılar, Dayanıklı Giysi ve Şerbet Testisi, Keyifli Damak; 24. aşama: bahçenin ekim tercihi (Buğday / Keten / Şerbetçiotu), Keten ve Şerbetçiotu stokları, Ürün Silosu ve mahsul bozulması sayaçları; 23. aşama: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi ve bekçiler, haydut baskınları, hasar / tamir, hafif yaralanma, tehlike sıklığı ayarı; 22. aşama: iç vergi ve öşür, Krallık Vergisi ve itibar, Kraliyet Fermanları ve Beratı, terk ediş; 21. aşama: kişisel kese ve çanta, vatandaş dilekçeleri, Yönetim Güveni, isyan ve yağma; 20. aşama: Ulu Saat Kulesi aşamaları ve Kadim Dişli, Altın Çağ, Tarihçe Kütüğü; 19. aşama: evlilik ortak evi, karakter huyları, randevu, dedikodu, düğün kutlaması; 18. aşama: peyzaj (tabela adı, fidan büyümesi, estetik, iade birikimi); 16. aşama: keşif ganimetleri, kadim yazıtlar, maceralı sefer; 15. aşama: usta işi eserler
  SAVE_MIN_VERSION: 2,                 // bundan eski kayıtlar açılmaz; arası eksik alanlarla yüklenir
  AUTOSAVE_HOUR: 6,                    // her sabah bu saatte otomatik kayıt
  HISTORY_DAYS: 64,                    // Kasaba Arşivi'nde saklanan günlük özet sayısı
  HISTORY_CHART_DAYS: 32,              // Arşiv grafiklerinin çizdiği son gün sayısı

  // --- Ses ---
  AUDIO_MUTE_KEY: 'lmgame.audio.muted', // ses kapalı tercihi
  AUDIO_MASTER_VOLUME: 0.5,
};
