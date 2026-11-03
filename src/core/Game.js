// Tüm alt sistemleri bir araya getiren merkez. Sahneler buna "game" olarak erişir.
import { CONFIG } from '../config.js';
import { EventBus } from './EventBus.js';
import { GameLoop } from './GameLoop.js';
import { Input } from './Input.js';
import { SceneManager } from './SceneManager.js';
import { AssetLoader } from './AssetLoader.js';
import { SoundEngine } from './SoundEngine.js';
import { Renderer } from '../rendering/Renderer.js';
import { GameState } from '../state/GameState.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
  constructor({ canvas, uiRoot }) {
    this.events = new EventBus();
    this.input = new Input(canvas);
    this.assets = new AssetLoader();
    this.sound = new SoundEngine({ storageKey: CONFIG.AUDIO_MUTE_KEY, volume: CONFIG.AUDIO_MASTER_VOLUME });
    this.renderer = new Renderer(canvas);
    this.scenes = new SceneManager();
    this.state = new GameState();
    this.ui = new UIManager(uiRoot, this);

    this.loop = new GameLoop({
      tickRate: CONFIG.TICK_RATE,
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha),
    });
  }

  start(sceneName, params = {}) {
    this.scenes.switchTo(sceneName, params);
    this.loop.start();
  }

  update(dt) {
    this.scenes.update(dt);
    this.input.endFrame();
  }

  render(alpha) {
    this.renderer.beginFrame();
    this.scenes.render(this.renderer, alpha);
    this.ui.render();
  }
}
