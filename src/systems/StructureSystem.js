// Yapıların zamanla değişen hâli: kamp ateşi ve fenerler akşam yanar; böğürtlen çalıları
// toplanan meyveleri yavaşça yeniden yetiştirir; üretim binalarının günlük sayacı sıfırlanır.
// Mevsimler: sonbaharda bahçe ve çalılar bereketli, kışın donar (frozen: kimse çalışmaz, meyve yok);
// kışın odun bitince kamp ateşi söner.
// Üretim verimi çarpanların çarpımıdır (productionFactors): mevsim (Seviye 2'de alt sınırlı: sera kışın
// %60), çevredeki ağaçlar (oduncu), yağmur (bahçe), ayak izindeki biyom (bereketli toprakta bahçe +%25,
// kayalıkta taş ocağı +%20) ve yükseltme (+%40 / +%50).
import { BUILDINGS } from '../data/buildings.js';
import { TILE_TYPES } from '../data/tiles.js';
import { isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';
import { clamp } from '../utils/math.js';

const MIN_TREE_EFFICIENCY = 0.25; // oduncunun çevresinde hiç ağaç yokken bile biraz üretir

/** Saat, [from, to) aralığında mı? to < from ise aralık gece yarısını geçer. */
export function isWithinHours(hour, { from, to }) {
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

/**
 * Ayak izindeki biyom karolarının bu yapı türüne verdiği bonus oranı (0,25 = +%25). Yapı kısmen
 * biyomun üstündeyse bonus karoların oranıyla bölünür.
 */
export function biomeBonus(map, type, tileX, tileY) {
  const { w, h } = BUILDINGS[type].size;
  let total = 0;
  for (let y = tileY; y < tileY + h; y++) {
    for (let x = tileX; x < tileX + w; x++) total += TILE_TYPES[map.get(x, y)]?.biome?.buildingBonus?.[type] ?? 0;
  }
  return total / (w * h);
}

/** Bu yapı türüne bonus veren biyom karosunun tanımı (yoksa null). */
export function biomeFor(type) {
  return Object.values(TILE_TYPES).find((t) => t.biome?.buildingBonus?.[type]) ?? null;
}

/**
 * Bir üretim yapısının verim çarpanları ve toplamı. Sistem toplamı verim olarak kullanır, çarpanlar
 * yapının `factors` alanında Yapı Bilgi Paneli için durur.
 * Dönüş: { seasonal, seasonalRaw, trees, rain, biome, biomeName, biomeFull, upgrade, total }
 */
export function productionFactors(building, world, raining, season) {
  const production = BUILDINGS[building.type].production;
  const seasonalRaw = production.seasonal ? season[production.seasonal] : 1;
  const floor = building.stat('seasonalFloor', 0);
  const seasonal = Math.max(seasonalRaw, floor);
  let trees = 1;
  if (production.needsTrees) {
    const count = world.countTreesNear(building.tileX + 1, building.tileY + 1, production.needsTrees.radius);
    trees = clamp(count / production.needsTrees.ideal, MIN_TREE_EFFICIENCY, 1);
  }
  const rain = raining && production.rainBonus ? 1 + production.rainBonus : 1;
  const bonus = biomeBonus(world.map, building.type, building.tileX, building.tileY);
  const tile = bonus > 0 ? biomeFor(building.type) : null;
  const biome = 1 + bonus;
  const upgrade = 1 + building.stat('productionBonus', 0);
  return {
    seasonal,
    seasonalRaw,
    trees,
    rain,
    biome,
    biomeName: tile?.name ?? null,
    biomeFull: tile ? bonus >= tile.biome.buildingBonus[building.type] - 1e-9 : false,
    upgrade,
    total: seasonal * trees * rain * biome * upgrade,
  };
}

export class StructureSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   */
  constructor(game, world) {
    this.state = game.state;
    this.world = world;
    this.day = game.state.time.day;
    // Kış gelince çalılardaki meyveler donar
    this.unsubscribe = game.events.on('time:seasonChanged', ({ season }) => {
      if (season.berries > 0) return;
      for (const b of this.world.buildings) {
        if (BUILDINGS[b.type].maxBerries) {
          b.berries = 0;
          b.regrowProgress = 0;
        }
      }
    });
  }

  destroy() {
    this.unsubscribe();
  }

  update(tick) {
    // Yeni günde üretim sayaçları sıfırlanır
    const newDay = this.state.time.day !== this.day;
    this.day = this.state.time.day;

    const raining = isRainActive(this.state.weather);
    const season = getSeason(this.state.time.day);
    const freezing = this.state.heating.cold;
    for (const building of this.world.buildings) {
      const def = BUILDINGS[building.type];
      if (newDay) building.producedToday = 0;
      if (def.production) {
        building.factors = productionFactors(building, this.world, raining, season);
        building.efficiency = building.factors.total;
      }
      building.frozen = Boolean(def.production?.seasonal) && building.efficiency <= 0;
      // Biri gerçekten çalışırken (yolda değil) ocak ve iskele canlanır
      building.active =
        (def.production !== undefined || def.kitchen !== undefined || def.crafting !== undefined) &&
        [...building.workerIds].some((id) => {
          const task = this.world.getCharacter(id)?.task;
          return task?.phase === 'perform';
        });
      if (def.litHours) building.lit = building.functional && isWithinHours(tick.hour, def.litHours);
      if (building.type === 'campfire' && freezing) building.lit = false; // yakacak odun yok

      if (def.maxBerries && building.berries < def.maxBerries && tick.gameMinutes > 0 && season.berries > 0) {
        building.regrowProgress += (tick.gameMinutes / 60) * season.berries;
        if (building.regrowProgress >= def.regrowHours) {
          building.regrowProgress -= def.regrowHours;
          building.berries += 1;
        }
      }
    }
  }
}
