// (24. aşama) Tarımsal çeşitlilik: bahçenin ekim tercihi ve Ürün Silosu. Kurallar data/crops.js'te, saf hesaplar ./Granary.js'te.
//
//   Ekim tercihi : oyuncu Sebze Bahçesi'nin panelinden mahsul seçer ('ui:setCrop' { buildingId, crop }). Bahçenin ana ürünü
//                  ve saatlik verimi hemen değişir (BehaviorSystem üretimi Granary.productionOf'tan okur); tarlanın görseli
//                  seçilen mahsule göre çizilir. Biriken üretim küsuratı yeni mahsule geçmez (sıfırlanır). 'crop:changed'.
//   Silo         : işleyen her Ürün Silosu tarımsal kaynakların depo sınırına +150 ekler (EconomySystem.recalculateCapacity).
//   Bozulma      : kasabada işleyen bir silo yokken yağmurlu ya da kış saatlerinde ham mahsulün (yiyecek, keten, şerbetçiotu)
//                  güvenli stoğun (80) üstündeki kısmından saatte %0,4'ü bozulur. Küsurat state.granary.buffers'ta birikir,
//                  bozulan miktar state.granary.spoiled'a yazılır; günde bir kez bildirim gösterilir. Silo kurulunca hiçbir
//                  mahsul bozulmaz. Rastgelelik yoktur (oyunun hiçbir üretecine dokunmaz).
// Durum: state.granary (kayda girer).
import { CROPS, SPOILAGE } from '../data/crops.js';
import { RESOURCES } from '../data/resources.js';
import { isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';
import { canChooseCrop, normalizeCrop, spoilageAt, emptyGranary } from './Granary.js';

export class GranarySystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {{ economy: import('./EconomySystem.js').EconomySystem }} services
   */
  constructor(game, world, { economy }) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.economy = economy;
    this.state.granary ??= emptyGranary();
    this.noticeDay = null;
    this.unsubscribers = [
      game.events.on('ui:setCrop', ({ buildingId, crop }) => this.setCrop(this.world.getBuilding(buildingId), crop)),
      game.events.on('time:hour', () => this.spoil()),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Bahçenin ekim tercihini değiştirir. Dönüş: değişti mi. */
  setCrop(building, crop) {
    if (!building || !canChooseCrop(building.type) || !CROPS[crop] || normalizeCrop(building.type, crop) !== crop) return false;
    if (building.crop === crop) return false;
    const from = building.crop;
    building.crop = crop;
    building.productionBuffer = 0; // yarım kalan hasat eski mahsuldendir
    this.state.granary.switches += 1;
    this.events.emit('crop:changed', { building, crop, from });
    this.events.emit('toast', { text: `${building.name}: artık ${CROPS[crop].name} ekilecek`, tone: 'info', icon: CROPS[crop].icon });
    return true;
  }

  /** Yağmur ya da kış mı (silosuz kasabada mahsul bozulur). */
  spoilWeather() {
    return isRainActive(this.state.weather) || getSeason(this.state.time.day).key === 'winter';
  }

  /** Saatlik bozulma (silo varsa ya da hava kuruysa hiçbir şey olmaz). Dönüş: { kaynak: bozulan } */
  spoil(hours = 1) {
    const out = {};
    if (!this.spoilWeather()) return out;
    const g = this.state.granary;
    for (const key of SPOILAGE.keys) {
      const amount = spoilageAt(this.state, key, hours);
      if (amount <= 0) continue;
      g.buffers[key] = (g.buffers[key] ?? 0) + amount;
      const whole = Math.floor(g.buffers[key]);
      if (whole <= 0) continue;
      g.buffers[key] -= whole;
      const lost = Math.min(whole, this.state.resources[key] ?? 0);
      if (lost <= 0) continue;
      this.economy.spend({ [key]: lost });
      g.spoiled[key] = (g.spoiled[key] ?? 0) + lost;
      out[key] = lost;
    }
    if (Object.keys(out).length) {
      this.events.emit('granary:spoiled', { lost: out });
      if (this.noticeDay !== this.state.time.day) {
        this.noticeDay = this.state.time.day;
        const text = Object.entries(out).map(([k, v]) => `${v} ${RESOURCES[k].name.toLocaleLowerCase('tr')}`).join(', ');
        this.events.emit('toast', { text: `Nem ve soğuk kilerdeki mahsulü bozuyor (${text}): bir Ürün Silosu bunu önler`, tone: 'warn', icon: 'food' });
      }
    }
    return out;
  }
}
