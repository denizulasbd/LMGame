// (30.1) Rehber kartları: ilk saatte oyuncuyu tek tek yönlendiren dokuz kısa adım. Bu dosya yalnızca metin ve ilgili düğmeyi
// söyler; görünme ve tamamlanma koşulları systems/Guide.js'te (saf işlevler, oyun durumundan okunur).
// Her kart en çok iki kısa cümle; **kalın** sözcükler arayüzdeki düğme adlarıdır. target: karta eşlik eden düğmenin
// CSS seçicisi (GuideCard yanıp söndürür; seçici hiçbir öğeye uymuyorsa kart yine görünür).
export const GUIDE_TABLE_VERSION = 4; // (30.2) hikâye kartı ve Yakından izle adımları eklendi; (30.4a) ilk doğal vefat kartı; (30.4b) Kasaba Doktrini kartı

export const GUIDE_STEPS = [
  // (30.4a) kasabadaki ilk doğal vefatta bir kez (tablonun başında: bekleyen öteki adımların arkasında kalmasın; "Anladım" ile biter)
  { id: 'lifespan', text: 'Sakinlerin ömrü var. Vefat edenler anıtta anılır; öyküleri kitabede kalır.', target: null },
  { id: 'move', text: 'Haritayı WASD ya da sağ tıkla sürükleyerek gez. Tekerlek yakınlaştırır.', target: null },
  { id: 'meet', text: 'Sakinlerin kendi başına yaşar. Birine tıkla, kim olduğuna bak.', target: null },
  { id: 'harvest', text: 'Odun ve taş için **Topla**\'yı seç, ağaçların ve kayaların üstünde sürükle.', target: '.tool-btn[data-tool="harvest"]' },
  { id: 'build', text: '**İnşa Et**\'ten bir yapı seç. Yeşil boyalı karolar uygun yerlerdir.', target: '.tool-btn[data-tool="build"]' },
  { id: 'storage', text: 'Depo doluyor, fazlası boşa gider. Bir **Kiler** kur.', target: '.build-item[data-type="storage"]:not([hidden]), .tool-btn[data-tool="build"]' },
  { id: 'speed', text: 'Boşluk tuşu zamanı durdurur; üstteki düğmeler hızlandırır.', target: '.hud-speed .hud-btn' },
  { id: 'goals', text: 'Sırada ne var? **Hedefler** penceresi yol gösterir.', target: '.goals-toggle' },
  { id: 'upgrade', text: 'Bir kulübeye tıkla, panelindeki **Yükselt**\'e bas.', target: '.upgrade-button' },
  { id: 'petition', text: 'Bir sakinin senden isteği var. Üstteki çipe tıkla.', target: '.hud-buffs .is-petition' },
  // (30.2)
  { id: 'cards', text: 'Sol alttaki kartlar kasabada olup biteni anlatır. **Git** seni oraya götürür.', target: '.story-card .story-go' },
  { id: 'cardAction', text: 'Bazı kartlarda yapabileceğin bir şey vardır.', target: '.story-card .story-action' },
  // (30.4b, ENGINES.midgame) Belediye Konağı kurulunca, doktrin seçilene dek
  { id: 'doctrine', text: 'Belediye Konağı\'nda bir **Kasaba Doktrini** seçebilirsin; geri dönüşü yoktur.', target: null },
  { id: 'watch', text: 'Bir sakini **Yakından izle**; başına gelenleri kaçırmazsın.', target: '.resident-watch, .watch-toggle' },
];
/** Nüfus bu sayıya ulaşınca "Yakından izle" adımı çıkar. */
export const GUIDE_WATCH_POPULATION = 8;

/** Depo sınırının bu oranına gelen kaynak için "Kiler kur" kartı çıkar. */
export const GUIDE_STORAGE_RATIO = 0.9;
/** "Boşluk tuşu" kartı, inşaat adımı bittikten bu kadar oyun dakikası sonra çıkar (2 oyun saati). */
export const GUIDE_SPEED_DELAY_MINUTES = 120;
/** Kayıtta rehber bilgisi yoksa nüfusu bundan fazla olan oyunda rehber kapalı başlar. */
export const GUIDE_OLD_SAVE_POPULATION = 8;
