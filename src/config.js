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
  SAVE_VERSION: 10,                    // 12. aşama: araştırmalar, okul, nehir limanı ve teknesi, Kasaba Hazinesi, Harika
  SAVE_MIN_VERSION: 2,                 // bundan eski kayıtlar açılmaz; arası eksik alanlarla yüklenir
  AUTOSAVE_HOUR: 6,                    // her sabah bu saatte otomatik kayıt

  // --- Ses ---
  AUDIO_MUTE_KEY: 'lmgame.audio.muted', // ses kapalı tercihi
  AUDIO_MASTER_VOLUME: 0.5,
};
