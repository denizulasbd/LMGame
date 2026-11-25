// (18. aşama) Peyzaj ve kasaba estetiğinin saf hesapları (durum değiştirmez): çevre estetiği haritası, kasabanın toplam
// estetik puanı ve refaha eklediği yüzde, süs fidanının büyümesi, gece bir karoya ışık düşüp düşmediği.
// LandscapeSystem, arayüz ve testler aynı hesabı kullanır.
import { doctrineAestheticMultiplier } from './Doctrine.js';
import { BUILDINGS } from '../data/buildings.js';
import { AESTHETIC, DARKNESS, ORNAMENTAL_TREES, aestheticPercent } from '../data/landscape.js';
import { CONFIG } from '../config.js';
import { clubAesthetic } from './Clubs.js'; // (32.5) hobi evlerinin ürünleri (tavanlı)

const T = CONFIG.TILE_SIZE;

/** Süs fidanının büyümesi 0-1 (dikildiği andan growHours sonra 1). Fidan değilse 1. */
export function treeGrowth(building, now) {
  if (!BUILDINGS[building.type]?.ornamentalTree) return 1;
  if (!building.functional) return 0;
  if (building.plantedAt === null || building.plantedAt === undefined) return 1; // dikiliş anı bilinmiyorsa (eski kayıt) büyümüş say
  return Math.max(0, Math.min(1, (now - building.plantedAt) / (ORNAMENTAL_TREES.growHours * 60)));
}

/** Bir yapının estetik değeri (fidan büyüdükçe tam değere ulaşır; inşaattaki yapı sayılmaz). */
export function aestheticValue(building) {
  const value = AESTHETIC.values[building.type];
  if (!value || !building.functional) return 0;
  if (BUILDINGS[building.type].ornamentalTree) return value * (0.35 + 0.65 * (building.growth ?? 1));
  if (BUILDINGS[building.type].clubHouse) return value + clubAesthetic(building); // (32.5) tarh / tablo başına, tavanlı
  return value;
}

/**
 * Çevre estetiği haritası: her karo için yakındaki süslerin ve döşemeli zeminin katkısı (Float32Array).
 * Süsün değeri merkezde tam, yarıçapın kenarına doğru azalır.
 */
export function computeAestheticField(map, buildings) {
  const field = new Float32Array(map.width * map.height);
  const spread = (cx, cy, value, radius) => {
    const r = Math.ceil(radius);
    for (let y = Math.floor(cy) - r; y <= Math.ceil(cy) + r; y++) {
      for (let x = Math.floor(cx) - r; x <= Math.ceil(cx) + r; x++) {
        if (!map.inBounds(x, y)) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d > radius) continue;
        field[map.index(x, y)] += value * (1 - d / (radius + 1));
      }
    }
  };
  for (const b of buildings) {
    const value = aestheticValue(b);
    if (!value) continue;
    const { w, h } = BUILDINGS[b.type].size;
    spread(b.tileX + (w - 1) / 2, b.tileY + (h - 1) / 2, value, AESTHETIC.radius + (Math.max(w, h) - 1) / 2);
  }
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const value = AESTHETIC.tileValues[map.get(x, y)];
      if (value) spread(x, y, value, AESTHETIC.tileRadius);
    }
  }
  return field;
}

/** Kasabanın toplam estetik puanı: süslerin değerleri + döşemeli zeminin (taş plaka, parke) küçük katkısı. */
export function townAestheticScore(map, buildings) {
  let score = 0;
  for (const b of buildings) score += aestheticValue(b);
  let tiles = 0;
  for (let i = 0; i < map.tiles.length; i++) {
    const x = i % map.width;
    const y = Math.floor(i / map.width);
    const value = AESTHETIC.tileValues[map.get(x, y)];
    if (value) tiles += value / AESTHETIC.tileValues.cobble; // parke 1, taş plaka 1,75 sayılır
  }
  return score + tiles * AESTHETIC.tileScoreWeight;
}

export { aestheticPercent };

/** Refah çarpanı: 1 + yüzde / 100 (kayıttaki son hesap; LandscapeSystem günceller). */
export function aestheticWelfareMultiplier(state) {
  return (1 + (state.landscape?.percent ?? 0) / 100) * doctrineAestheticMultiplier(state); // (28.4) Sanayi Doktrini estetiği düşürür
}

/** Estetik puanının okunabilir düzeyi (ipucu ve panel). */
export function aestheticLevel(value) {
  if (value >= 6) return 'Büyüleyici';
  if (value >= 4) return 'Çok güzel';
  if (value >= AESTHETIC.pleasantThreshold) return 'Güzel';
  if (value >= 1) return 'Şirin';
  return null;
}

/** Gece mi (karanlık sokak saatleri)? */
export function isDarkHour(hour) {
  return hour >= DARKNESS.fromHour || hour < DARKNESS.toHour;
}

/** Yanan ışık kaynakları: [{ x, y, r2 }] (dünya pikseli; yarıçapın karesi). */
export function litSources(buildings) {
  const out = [];
  for (const b of buildings) {
    const radius = DARKNESS.lights[b.type];
    if (!radius || !b.functional) continue;
    const lit = b.lit || (b.type === 'wonder' && b.wonderComplete);
    if (!lit) continue;
    out.push({ x: b.x + (BUILDINGS[b.type].size.w * T) / 2, y: b.y + (BUILDINGS[b.type].size.h * T) / 2, r2: radius * radius });
  }
  return out;
}

/** Nokta bir ışığın altında mı? */
export function isLitPoint(sources, x, y) {
  return sources.some((s) => (s.x - x) ** 2 + (s.y - y) ** 2 <= s.r2);
}
