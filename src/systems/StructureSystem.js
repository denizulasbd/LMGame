// Yapıların zamanla değişen hâli: kamp ateşi ve fenerler akşam yanar; böğürtlen çalıları
// toplanan meyveleri yavaşça yeniden yetiştirir; üretim binalarının günlük sayacı sıfırlanır.
// Mevsimler: sonbaharda bahçe ve çalılar bereketli, kışın donar (frozen: kimse çalışmaz, meyve yok);
// kışın odun bitince kamp ateşi söner.
// Üretim verimi çarpanların çarpımıdır (productionFactors): mevsim (Seviye 2'de alt sınırlı: sera kışın
// %60), çevredeki ağaçlar (oduncu), yağmur (bahçe), ayak izindeki biyom (bereketli toprakta bahçe +%25,
// kayalıkta taş ocağı +%20) ve yükseltme (+%40 / +%50).
// 10. aşama: işleme yapıları (değirmen-fırın) malzeme yoksa ya da ürünün deposu doluysa boşta kalır
// (building.idle, building.processStatus); koyun ağılındaki koyunlar (building.flock, yalnızca görsel)
// oyun zamanıyla otlar, dolaşır, gece ahırın önünde yatar.
// 11. aşama: şifacı kulübesi otlar ve iksir raflar doluysa boşta kalır; fırtınada / kurt saldırısında hasar alan
// yapı onarılana kadar boşta kalır (building.damaged), hasarlı ağılda koyunların bir kısmı kaçmıştır.
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { Flock } from '../entities/Flock.js';
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
    const offSeason = game.events.on('time:seasonChanged', ({ season }) => {
      if (season.berries > 0) return;
      for (const b of this.world.buildings) {
        if (BUILDINGS[b.type].maxBerries) {
          b.berries = 0;
          b.regrowProgress = 0;
        }
      }
    });
    // (13. aşama) Çiçekli çitler yanındakilerle birleşir: yapı eklenip kaldırıldıkça bağlantılar yenilenir
    const refresh = () => this.connectFences();
    this.unsubscribers = [offSeason, ...['building:placed', 'building:completed', 'building:removed'].map((n) => game.events.on(n, refresh))];
    this.connectFences();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  /** Birleşen yapıların (çit) dört yandaki komşu bağlantıları: building.connect = { left, right, up, down }. */
  connectFences() {
    const map = this.world.map;
    const types = new Map(this.world.buildings.map((b) => [b.id, b.type]));
    for (const b of this.world.buildings) {
      if (!BUILDINGS[b.type].connects) continue;
      const same = (x, y) => types.get(map.getOccupant(x, y)) === b.type;
      b.connect = { left: same(b.tileX - 1, b.tileY), right: same(b.tileX + 1, b.tileY), up: same(b.tileX, b.tileY - 1), down: same(b.tileX, b.tileY + 1) };
    }
  }

  /**
   * İşleme yapısının (değirmen-fırın) durumu: stokta malzeme yoksa ya da ürünün deposu doluysa boşta kalır,
   * kimse çalışmaya gelmez (building.idle); panel nedenini processStatus'tan okur.
   */
  updateProcessing(building, processing) {
    const resources = this.state.resources;
    const capacity = this.state.storageCapacity;
    const missing = Object.entries(processing.input).filter(([r, v]) => (resources[r] ?? 0) < v);
    const full = Object.keys(processing.output).filter((r) => (resources[r] ?? 0) >= capacity);
    if (!building.functional) {
      building.idle = true;
      building.processStatus = null;
    } else if (missing.length) {
      building.idle = true;
      building.processStatus = `${missing.map(([r]) => RESOURCES[r].name).join(', ')} bekleniyor: kilerde un yapılacak bir şey yok`;
    } else if (full.length) {
      building.idle = true;
      building.processStatus = `${full.map((r) => RESOURCES[r].name).join(', ')} deposu dolu: kiler kurarak yer aç`;
    } else {
      building.idle = false;
      building.processStatus = null;
    }
  }

  /** Şifacı kulübesi: otlar ve iksir rafları doluysa şifacı gelmez. */
  updateApothecary(building, spec) {
    const full = building.remedies >= spec.maxRemedies && building.herbs >= spec.maxHerbs - 0.01;
    const trees = this.world.countTreesNear(building.tileX + 1, building.tileY + 1, spec.natureRadius);
    building.natureFactor = clamp(trees / spec.natureIdeal, 0.35, 1); // panelde ot toplama verimi
    building.idle = !building.functional || full;
    building.processStatus = full ? 'İksir rafları ve ot sepetleri dolu: hasta bekleniyor' : null;
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
      if (newDay) {
        building.producedToday = 0;
        building.extraToday = 0;
        building.treatedToday = 0;
      }
      if (def.production) {
        building.factors = productionFactors(building, this.world, raining, season);
        building.efficiency = building.factors.total;
      }
      building.frozen = Boolean(def.production?.seasonal) && building.efficiency <= 0;
      if (!def.crafting && !def.processing && !def.apothecary) building.idle = false;
      if (def.processing) this.updateProcessing(building, def.processing);
      if (def.apothecary) this.updateApothecary(building, def.apothecary);
      if (building.damaged) {
        building.idle = true;
        building.processStatus = building.project ? 'Onarılıyor' : 'Fırtınada hasar gördü: onarılana kadar çalışmaz';
      }
      if (def.flock) {
        building.flock ??= new Flock(building);
        if (building.functional) building.flock.update(tick, season.key, raining);
      }
      // Biri gerçekten çalışırken (yolda değil) ocak, iskele, değirmen ve fırın canlanır; Bilge çalışırken
      // Bilgelik Evi'nin kubbesinden dürbün uzanır (limanın vinci HarborSystem'de, tekne yanaşınca çalışır)
      building.active =
        (def.production !== undefined || def.kitchen !== undefined || def.crafting !== undefined || def.processing !== undefined || def.apothecary !== undefined || def.academy !== undefined) &&
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
