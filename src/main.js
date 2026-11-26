// Giriş noktası: oyunu kurar ve başlatır. Burada oyun mantığı olmamalı.
//
// Hangi oyunla başlanır:
//   1. Adreste ?seed=12345 varsa o harita tohumuyla yeni bir oyun (aynı haritayı tekrar görmek için; (33.1) sakinler her seferinde farklıdır,
//      ?life= yalnızca araçlar için hayat tohumunu sabitler); (30.1) ama oturum kaydı aynı
//      tohumlu bir oyunsa yeni oyun başlatılmaz, kayıt sürdürülür: adres çubuğundaki ?seed= bağlantısını yeniden açmak (tarayıcıyı
//      kapatıp açmak) eskiden ilerlemeyi Gün 1'e sıfırlıyor ve oturum kaydının üstüne yazıyordu. Tohum adresten silinir, F5 bu oyunu sürdürür
//   2. Aksi halde son oturumun kaydı varsa oyun doğrudan kaldığı yerden sürer (F5)
//   3. Oturum kaydı yoksa başlangıç ekranı açılır: arkada (varsa son kayıttaki, yoksa rastgele) kasaba
//      sessizce yaşar; oyuncu "Kaldığın Yerden Devam Et" ya da "Yeni Kasaba Kur" seçer
import { Game } from './core/Game.js';
import { SaveManager } from './state/SaveManager.js';
import { TownScene } from './scenes/TownScene.js';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-layer');

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed'), 10);
// (33.1) ?life= hayat tohumunu sabitler (yalnızca araçlar kullanır: testler, otopilot). Adreste yoksa her yeni oyunda rastgele
const lifeParam = Number.parseInt(params.get('life'), 10);

const game = new Game({ canvas, uiRoot });

function startNewGame(seed, lifeSeed = null) {
  game.state.reset(seed, null, lifeSeed); // (33.1) lifeSeed boşsa rastgele: ?seed=42 aynı haritayı açar, insanlar her seferinde farklıdır
}

// (32.7) Okunamayan kayıt asla silinmez: ham veri önce yedek anahtarına kopyalanır (SaveManager.quarantine), sonra yuva temizlenir
let loadWarning = null;
function resumeSavedGame(slots) {
  for (const slot of slots) {
    const data = SaveManager.read(slot); // bozuk JSON / desteklenmeyen sürüm: okurken yedeklenir
    if (!data) continue;
    try {
      const warnings = game.state.restore(data);
      if (warnings?.skippedBuildings?.length) loadWarning = `Kayıttaki ${warnings.skippedBuildings.length} yapı tanınmadı ve atlandı.`;
      return true;
    } catch (err) {
      console.warn(`${slot} kaydı yüklenemedi, yedeklenip atlanıyor:`, err);
      SaveManager.quarantine(slot);
    }
  }
  return false;
}

let attract = false;
let resumedFromSeed = false;
if (Number.isFinite(seedParam)) {
  // (30.1) Aynı tohumlu oturum kaydı varsa sürdür; yoksa (ya da başka tohumsa) istenen tohumla yeni oyun
  const saved = SaveManager.read('session');
  const sameLife = !Number.isFinite(lifeParam) || (saved?.lifeSeed ?? saved?.seed) === lifeParam;
  resumedFromSeed = saved?.seed === seedParam && sameLife && resumeSavedGame(['session']);
  if (!resumedFromSeed) startNewGame(seedParam, Number.isFinite(lifeParam) ? lifeParam : null);
  window.history.replaceState(null, '', window.location.pathname);
} else if (!resumeSavedGame(['session'])) {
  attract = true;
  if (!resumeSavedGame(['main'])) startNewGame();
}

game.scenes.register('town', new TownScene(game));
game.start('town', { attract });
if (SaveManager.takeNotice()) game.events.emit('toast', { text: 'Bir kayıt okunamadı ve yedeklendi.', tone: 'warn', icon: 'demolish' });
if (loadWarning) game.events.emit('toast', { text: loadWarning, tone: 'warn', icon: 'demolish' });
if (resumedFromSeed) game.events.emit('toast', { text: 'Kayıtlı oyun sürdürülüyor. Baştan başlamak için Ayarlar > Yeni Harita.', tone: 'info', icon: 'sparkle' });

// Geliştirme sırasında konsoldan erişim için
window.game = game;
