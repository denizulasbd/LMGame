// Giriş noktası: oyunu kurar ve başlatır. Burada oyun mantığı olmamalı.
//
// Hangi oyunla başlanır:
//   1. Adreste ?seed=12345 varsa o tohumla yeni bir oyun (aynı haritayı tekrar görmek için); (30.1) ama oturum kaydı aynı
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

const game = new Game({ canvas, uiRoot });

function startNewGame(seed) {
  game.state.reset(seed);
}

function resumeSavedGame(slots) {
  for (const slot of slots) {
    const data = SaveManager.read(slot);
    if (!data) continue;
    try {
      game.state.restore(data);
      return true;
    } catch (err) {
      console.warn(`${slot} kaydı yüklenemedi, atlanıyor:`, err);
      SaveManager.clear(slot);
    }
  }
  return false;
}

let attract = false;
let resumedFromSeed = false;
if (Number.isFinite(seedParam)) {
  // (30.1) Aynı tohumlu oturum kaydı varsa sürdür; yoksa (ya da başka tohumsa) istenen tohumla yeni oyun
  resumedFromSeed = SaveManager.read('session')?.seed === seedParam && resumeSavedGame(['session']);
  if (!resumedFromSeed) startNewGame(seedParam);
  window.history.replaceState(null, '', window.location.pathname);
} else if (!resumeSavedGame(['session'])) {
  attract = true;
  if (!resumeSavedGame(['main'])) startNewGame();
}

game.scenes.register('town', new TownScene(game));
game.start('town', { attract });
if (resumedFromSeed) game.events.emit('toast', { text: 'Kayıtlı oyun sürdürülüyor. Baştan başlamak için Ayarlar > Yeni Harita.', tone: 'info', icon: 'sparkle' });

// Geliştirme sırasında konsoldan erişim için
window.game = game;
