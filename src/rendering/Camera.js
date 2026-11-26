// Dünyanın hangi bölümünün ekranda görüneceğini belirler.
// x, y: görünümün sol üst köşesinin dünya pikseli cinsinden konumu.
// zoom: tam sayı ölçek (1 dünya pikseli = zoom ekran pikseli).
import { CONFIG } from '../config.js';
import { clamp } from '../utils/math.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = CONFIG.DEFAULT_ZOOM;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  /** Ekrandaki bir noktayı sabit tutarak yakınlaştırır (fare imleci etrafında zoom). */
  zoomAt(screenX, screenY, newZoom) {
    const zoom = clamp(Math.round(newZoom), CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM);
    if (zoom === this.zoom) return false;
    const anchor = this.screenToWorld(screenX, screenY);
    this.zoom = zoom;
    this.x = anchor.x - screenX / zoom;
    this.y = anchor.y - screenY / zoom;
    return true;
  }

  /** Kamerayı dünya içinde tutar; dünya ekrandan küçükse ortalar. */
  clamp(worldWidth, worldHeight, screenWidth, screenHeight, left = 0, top = 0) {
    // (34.1) left / top: gezilebilir alanın sol üst köşesi (genişleyen haritada eksi olabilir); worldWidth / worldHeight onun boyutu
    const viewW = screenWidth / this.zoom;
    const viewH = screenHeight / this.zoom;
    this.x = viewW >= worldWidth ? left + (worldWidth - viewW) / 2 : clamp(this.x, left, left + worldWidth - viewW);
    this.y = viewH >= worldHeight ? top + (worldHeight - viewH) / 2 : clamp(this.y, top, top + worldHeight - viewH);
  }

  centerOn(worldX, worldY, screenWidth, screenHeight) {
    this.x = worldX - screenWidth / this.zoom / 2;
    this.y = worldY - screenHeight / this.zoom / 2;
  }

  screenToWorld(screenX, screenY) {
    return { x: screenX / this.zoom + this.x, y: screenY / this.zoom + this.y };
  }

  /** Görünen dünya dikdörtgeni (piksel). Frustum culling için kullanılır. */
  getViewBounds(screenWidth, screenHeight) {
    return {
      left: this.x,
      top: this.y,
      right: this.x + screenWidth / this.zoom,
      bottom: this.y + screenHeight / this.zoom,
    };
  }
}
