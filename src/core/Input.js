// Klavye ve fare durumunu tutar. Oyun kodu tuşlara değil, eylem adlarına bakar.
//
// Fare özellikleri:
//   - Tekerlek: consumeZoomSteps() ile adım adım yakınlaştırma
//   - Sağ (veya orta) tık basılı sürükleme: consumeDrag() ile kaydırma miktarı
//   - Sol tık: consumeClick() ile ekran koordinatı (sürükleme sayılmaz)
//   - Sol tuşa basma / bırakma: consumeLeftPress(), consumeLeftRelease(), mouse.leftHeld
//     (inşa ve toplama araçlarında fırça gibi sürükleyerek boyamak için)
//   - getHoveredTile(camera): imlecin altındaki karonun koordinatı
import { CONFIG } from '../config.js';

const KEY_BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  pause: ['Space'],
  speed1: ['Digit1', 'Numpad1'],
  speed2: ['Digit2', 'Numpad2'],
  speed3: ['Digit3', 'Numpad3'],
  zoomIn: ['Equal', 'NumpadAdd'],
  zoomOut: ['Minus', 'NumpadSubtract'],
  cancel: ['Escape'],
  toolBuild: ['KeyB'],
  toolHarvest: ['KeyH'],
  toolDemolish: ['KeyX'],
  toggleJournal: ['KeyJ'],
  toggleGoals: ['KeyO', 'KeyG'], // O; eski kısayol G de çalışır
  toggleStats: ['KeyI'],
  toggleCinematic: ['KeyF'],
  toggleEmotions: ['KeyM'], // (29.8) Duygu Katmanı
};

const BOUND_CODES = new Set(Object.values(KEY_BINDINGS).flat());

const isTypingTarget = (target) =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

// Sol tık bu kadar pikselden fazla kayarsa tıklama sayılmaz
const CLICK_TOLERANCE = 5;

// Fare tekerleğinde bir "çentik" genelde 100 birimdir; dokunmatik yüzeyler
// küçük değerler gönderir, bu yüzden biriktirip eşik aşılınca adım sayarız.
const WHEEL_STEP_THRESHOLD = 80;

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedThisFrame = new Set();

    this.mouse = { x: 0, y: 0, inside: false, leftHeld: false };
    this.dragging = false;
    this.dragDelta = { x: 0, y: 0 };
    this.wheelAccumulator = 0;
    this.zoomSteps = 0;
    this.leftDown = null;
    this.pendingClick = null;
    this.pendingLeftPress = false;
    this.pendingLeftRelease = false;

    this.bindKeyboard();
    this.bindMouse();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Metin kutusuna yazarken (kasaba adı, tohum) oyun tuşları devreye girmez
      if (isTypingTarget(e.target)) return;
      if (BOUND_CODES.has(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressedThisFrame.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    // Tuş basılıyken bir metin kutusuna geçilirse (ör. W basılıyken ada tıklamak) kamera yazarken kaymaya devam etmesin
    window.addEventListener('focusin', (e) => {
      if (isTypingTarget(e.target)) {
        this.keys.clear();
        this.pressedThisFrame.clear();
      }
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.stopDrag();
      if (this.mouse.leftHeld) {
        this.mouse.leftHeld = false;
        this.pendingLeftRelease = true;
      }
    });
  }

  bindMouse() {
    const canvas = this.canvas;

    const trackPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.inside = true;
    };
    canvas.addEventListener('mousemove', trackPointer);
    canvas.addEventListener('mouseleave', () => (this.mouse.inside = false));

    // Sağ tık menüsünü kapat; sağ tık sürükleme için kullanılıyor
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        trackPointer(e);
        this.leftDown = { x: this.mouse.x, y: this.mouse.y };
        this.mouse.leftHeld = true;
        this.pendingLeftPress = true;
      }
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        this.dragging = true;
        canvas.classList.add('is-dragging');
      }
    });

    // Sürükleme imleç canvas dışına çıksa da devam etsin
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      this.dragDelta.x += e.movementX;
      this.dragDelta.y += e.movementY;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 1 || e.button === 2) this.stopDrag();
      if (e.button === 0 && this.mouse.leftHeld) {
        this.mouse.leftHeld = false;
        this.pendingLeftRelease = true;
      }
      if (e.button === 0 && this.leftDown) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const moved = Math.hypot(x - this.leftDown.x, y - this.leftDown.y);
        if (moved <= CLICK_TOLERANCE) this.pendingClick = { x, y };
        this.leftDown = null;
      }
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        trackPointer(e); // zoom imlecin tam altındaki noktaya sabitlensin
        // deltaMode 1 = satır cinsinden (Firefox); piksele çevir
        const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        this.wheelAccumulator += delta;
        while (Math.abs(this.wheelAccumulator) >= WHEEL_STEP_THRESHOLD) {
          const direction = Math.sign(this.wheelAccumulator);
          this.zoomSteps -= direction; // tekerlek yukarı = yakınlaş
          this.wheelAccumulator -= direction * WHEEL_STEP_THRESHOLD;
        }
      },
      { passive: false }
    );
  }

  stopDrag() {
    this.dragging = false;
    this.canvas.classList.remove('is-dragging');
  }

  /** Eylemin tuşu basılı tutuluyor mu? */
  isDown(action) {
    return KEY_BINDINGS[action]?.some((code) => this.keys.has(code)) ?? false;
  }

  /** Eylemin tuşuna bu karede mi basıldı? */
  wasPressed(action) {
    return KEY_BINDINGS[action]?.some((code) => this.pressedThisFrame.has(code)) ?? false;
  }

  /** Son okumadan bu yana biriken yakınlaştırma adımı (+ yakın, - uzak). */
  consumeZoomSteps() {
    const steps = this.zoomSteps;
    this.zoomSteps = 0;
    return steps;
  }

  /** Son okumadan bu yana sürükleme miktarı (ekran pikseli). */
  consumeDrag() {
    const delta = { x: this.dragDelta.x, y: this.dragDelta.y };
    this.dragDelta.x = 0;
    this.dragDelta.y = 0;
    return delta;
  }

  /** Sol tuşa canvas üzerinde basıldı mı (son okumadan bu yana)? */
  consumeLeftPress() {
    const pressed = this.pendingLeftPress;
    this.pendingLeftPress = false;
    return pressed;
  }

  /** Sol tuş bırakıldı mı (son okumadan bu yana)? */
  consumeLeftRelease() {
    const released = this.pendingLeftRelease;
    this.pendingLeftRelease = false;
    return released;
  }

  /** Son okumadan bu yana yapılan sol tıklama (ekran pikseli) ya da null. */
  consumeClick() {
    const click = this.pendingClick;
    this.pendingClick = null;
    return click;
  }

  /** İmlecin dünya koordinatı (piksel). İmleç canvas dışındaysa null. */
  getWorldPosition(camera) {
    if (!this.mouse.inside) return null;
    return camera.screenToWorld(this.mouse.x, this.mouse.y);
  }

  /** İmlecin üzerinde olduğu karo { tileX, tileY }. İmleç canvas dışındaysa null. */
  getHoveredTile(camera) {
    const world = this.getWorldPosition(camera);
    if (!world) return null;
    return {
      tileX: Math.floor(world.x / CONFIG.TILE_SIZE),
      tileY: Math.floor(world.y / CONFIG.TILE_SIZE),
    };
  }

  /** Her simülasyon adımının sonunda çağrılır. */
  endFrame() {
    this.pressedThisFrame.clear();
  }
}
