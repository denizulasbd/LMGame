// Doğanın kendini yenilemesi: fidan zamanla ağaca döner (yeni fidanları ForestSystem diker). Yağmur yağarken büyüme hızlanır.
// (34.3) Kesilen ağaç kütük bırakmaz; eski kayıtlardaki kütükler açılışta temizlenir (purgeStumps).
// Kayıtlar GameState.regrowth'ta tutulur: { x, y, tree, stage: 'sapling', hours }
// Yetişecek ağaç bir yapının girişini (ya da ona giden tek geçidi) kapatacaksa fidan gelişemez, kurur:
// kesilen ağacın kütüğü bir değirmenin, madenin, evin önünü sonradan tıkamasın.
import { TREE_REGROWTH } from '../data/tiles.js';
import { RAIN_EFFECTS, isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';

export class NatureSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world) {
    this.state = game.state;
    this.world = world;
  }

  destroy() {}

  update(tick) {
    if (tick.gameMinutes <= 0) return;
    const map = this.world.map;
    let changed = false;
    // Yağmur büyümeyi hızlandırır; mevsim de etkiler (ilkbaharda hızlı, kışın durur)
    const growth = (isRainActive(this.state.weather) ? RAIN_EFFECTS.growthMultiplier : 1) * getSeason(this.state.time.day).growth;

    this.state.regrowth = this.state.regrowth.filter((entry) => {
      // Üzerine yapı / yol kurulduysa ya da fidan kaldırıldıysa büyüme biter (eski kütük kaydı da düşer)
      if (entry.stage !== 'sapling' || map.getObject(entry.x, entry.y) !== entry.stage || map.getOccupant(entry.x, entry.y) !== 0) return false;
      entry.hours += (tick.gameMinutes / 60) * growth;

      if (entry.hours >= TREE_REGROWTH.saplingHours) {
        // Üzerinde biri duruyorsa ağaç onun içinden çıkmasın; bir sonraki adımda tekrar dener
        if (this.world.charactersOnTile(entry.x, entry.y).length > 0) return true;
        // Bir yapının girişini kapatacak fidan kurur (sakinler ayaklarıyla ezer)
        if (this.world.wouldIsolate([{ x: entry.x, y: entry.y }])) {
          map.setObject(entry.x, entry.y, null);
          return false;
        }
        map.setObject(entry.x, entry.y, entry.tree);
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) this.world.refreshStaticData();
  }
}

/**
 * (34.3) Bir kerelik temizlik: eski kayıtlardaki ağaç kütükleri kaldırılır ve "kütük" aşamasındaki yeniden büyüme kayıtları düşer;
 * "fidan" aşamasındakiler büyümeye devam eder. Kütük artık hiç oluşmadığı için tekrar çalıştırmak zararsızdır (bir şey bulamaz).
 * Kilitli parsellerdeki karolara dokunulmaz (oyuncu orada kütük bırakamaz). Dönüş: kaldırılan kütük sayısı.
 */
export function purgeStumps(map, state) {
  let removed = 0;
  const { x0, y0, x1, y1 } = map.openBounds;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (map.isOpen(x, y) && map.getObject(x, y) === 'stump') {
        map.setObject(x, y, null);
        removed++;
      }
    }
  }
  state.regrowth = state.regrowth.filter((entry) => entry?.stage === 'sapling');
  return removed;
}
