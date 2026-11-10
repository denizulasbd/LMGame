// Kasabanın genel durumu için saf hesaplar (durum değiştirmez): sakin ve kasaba mutluluğu (refah),
// konut kapasitesi, göç koşulları ve kasaba çapındaki geçici bonuslar. Sistemler ve arayüz
// aynı hesabı kullansın diye tek yerde.
// 10. aşama: kasabanın toplam yiyecek değeri (ekmek 2,5 sayılır), kasaba seviyesi (Mezra -> Gelişmiş
// Şehir) ölçütleri ve unvanı, belediyenin iş verimi çarpanı.
import { goldenWelfareMultiplier, goldenWorkMultiplier } from './GoldenAge.js';
import { silkPrestige } from './Luxury.js';
import { BUILDINGS } from '../data/buildings.js';
import { HAPPINESS_WEIGHTS, HAPPINESS_LEVELS, IMMIGRATION, TOWN_BUFFS, TOWN_TIERS, TITLE_WORDS, CIVIC_PROJECTS } from '../data/town.js';
import { EXPEDITION } from '../data/dilemmas.js';
import { RESOURCES, FOOD_KEYS } from '../data/resources.js';
import { masterworkHappiness } from './Masterworks.js';
import { clothWelfare } from './Refinery.js';
import { aestheticWelfareMultiplier } from './Landscape.js';
import { taxWorkMultiplier, reputationForImmigration } from './Crown.js';
import { elderWelfare, activePopulation } from './LifeStages.js';

/** Bir sakinin mutluluğu 0-100: ihtiyaçlarının ağırlıklı ortalaması. */
export function happinessOf(character) {
  let total = 0;
  for (const [need, weight] of Object.entries(HAPPINESS_WEIGHTS)) total += character.needs[need] * weight;
  return total;
}

/**
 * Kasabanın ortalama mutluluğu (sakin yoksa 0); anıt ve onarılmış gözetleme kulesi kalıcı puan ekler
 * (en çok 100). (18. aşama) Kasabanın toplam estetiği sakinlerin ortalamasına kalıcı küçük bir çarpan ekler
 * (+%1 ... +%5; systems/Landscape.js).
 */
export function townHappiness(state) {
  const people = state.characters;
  if (people.length === 0) return 0;
  const average = people.reduce((sum, c) => sum + happinessOf(c), 0) / people.length;
  // (20. aşama) Altın Çağ: kasaba refahına kalıcı +%10 çarpan
  return Math.min(100, (average * aestheticWelfareMultiplier(state) + townHappinessBonus(state)) * goldenWelfareMultiplier(state));
}

/**
 * Kasaba refahına eklenen kalıcı ve geçici puanlar: anıt, gözetleme kulesi / belediye, şehir gururu,
 * (11. aşama) etkin bonuslar (Büyük Ziyafet, Panayır, İyilik Şöhreti) ve keşiflerden gelen kadim tılsımlar.
 */
export function townHappinessBonus(state) {
  let bonus = (prestige(state)?.happinessBonus ?? 0) + landmarkBonus(state) + (townTier(state).happiness ?? 0);
  for (const key of Object.keys(TOWN_BUFFS)) {
    if (TOWN_BUFFS[key].happiness && isBuffActive(state, key)) bonus += TOWN_BUFFS[key].happiness;
  }
  bonus += (state.civic?.relics ?? 0) * EXPEDITION.relicHappiness;
  // (13. aşama) İpek Kumaş ve Mermer Sütunlar: Seviye 2 yapıların kalıcı prestiji
  bonus += silkPrestige(state);
  // (15. aşama) Kasaba Arşivi'nin vitrininde sergilenen usta işi eserler
  bonus += masterworkHappiness(state);
  // (24.2) Dokunan keten kumaş: her 40 topta kalıcı +1 (en çok +3)
  bonus += clothWelfare(state);
  // (25.1) Emekli Kıdemli Bilgeler: her biri +1 (en çok +3); bilge yoksa 0
  bonus += elderWelfare(state);
  return bonus;
}

/** Tamamlanmış prestij yapısının (anıt) kalıcı bonusu ya da null. */
export function prestige(state) {
  const building = state.buildings.find((b) => b.functional && BUILDINGS[b.type].prestige);
  return building ? BUILDINGS[building.type].prestige : null;
}

/** Ortalama keyif (şenlik koşulu). */
export function townFun(state) {
  const people = state.characters;
  if (people.length === 0) return 0;
  return people.reduce((sum, c) => sum + c.needs.fun, 0) / people.length;
}

export function happinessLevel(value) {
  return HAPPINESS_LEVELS.find((level) => value >= level.min) ?? HAPPINESS_LEVELS[HAPPINESS_LEVELS.length - 1];
}

/** Tamamlanmış evlerdeki toplam yatak. */
export function housingCapacity(state) {
  return state.buildings.filter((b) => b.functional && b.capacity).reduce((sum, b) => sum + b.capacity, 0);
}

/**
 * Göçmenlere açık boş yatak: evli bir çiftin yaşadığı evlerin boş yatakları çocuklarına ayrılır.
 * Dönüş: { open, family } — göçmenlere açık ve ailelere ayrılmış boş yatak sayısı
 */
export function freeBeds(state) {
  let open = 0;
  let family = 0;
  for (const home of state.buildings) {
    if (!home.functional || !home.capacity) continue;
    const residents = state.characters.filter((c) => c.homeId === home.id);
    const free = Math.max(0, home.capacity - residents.length);
    if (residents.some((c) => c.married)) family += free;
    else open += free;
  }
  return { open, family };
}

/** Onarılmış kadim yapıların (gözetleme kulesi) kasaba refahına kalıcı katkısı. */
export function landmarkBonus(state) {
  // Harika yalnızca son aşaması bitince sayılır
  return state.buildings
    .filter((b) => b.functional && BUILDINGS[b.type].townBonus && (!BUILDINGS[b.type].wonder || b.wonderComplete))
    .reduce((sum, b) => sum + BUILDINGS[b.type].townBonus.happiness, 0);
}

/**
 * Göç koşulları ve her birinin durumu (HUD ipucu ve EventSystem aynı sonucu kullanır).
 * Dönüş: { ok, freeBeds, checks: [{ key, ok, text }] }
 */
export function immigrationStatus(state) {
  const population = activePopulation(state); // (28.3) Saygın Büyükler nüfus kotasına sayılmaz
  const beds = freeBeds(state);
  const maxPopulation = immigrationLimit(state);
  const freeBedCount = Math.max(0, Math.min(beds.open, maxPopulation - population));
  const foodNeeded = Math.max(IMMIGRATION.minFood, population * IMMIGRATION.foodPerResident);
  const happiness = townHappiness(state);
  const supply = Math.floor(foodSupply(state));
  // (22. aşama) Kasabanın şöhreti: güven çok düşükse (ya da sakinler terk ediyorsa) göçmen gelmez, düşükse sabah en çok 1
  const fame = reputationForImmigration(state);
  const checks = [
    {
      key: 'beds',
      ok: freeBedCount > 0,
      text:
        population >= maxPopulation
          ? `Nüfus sınırı (${maxPopulation}) doldu`
          : freeBedCount > 0
            ? `${freeBedCount} boş yatak`
            : beds.family > 0
              ? 'Boş yatak yok (aile evlerindeki yataklar çocuklara ayrılı): kulübe kur'
              : 'Boş yatak yok: kulübe kur',
    },
    {
      key: 'food',
      ok: supply >= foodNeeded,
      text: state.resources.bread > 0 ? `Yiyecek (ekmek dahil) ${supply}/${foodNeeded}` : `Yiyecek ${supply}/${foodNeeded}`,
    },
    {
      key: 'happiness',
      ok: happiness >= IMMIGRATION.minHappiness,
      text: `Refah %${Math.round(happiness)} (en az %${IMMIGRATION.minHappiness})`,
    },
    { key: 'fame', ok: !fame.blocked, text: fame.text },
  ];
  const perMorning = townTier(state).maxPerMorning ?? IMMIGRATION.maxPerMorning;
  return { ok: checks.every((c) => c.ok), freeBeds: freeBedCount, maxPerMorning: fame.slow ? Math.min(1, perMorning) : perMorning, checks };
}

/** Göçle ulaşılabilecek en yüksek nüfus (Gelişmiş Şehir'de artar). */
export function immigrationLimit(state) {
  return townTier(state).maxPopulation ?? IMMIGRATION.maxPopulation;
}

// ---------------------------------------------------------------------------
// Yiyecek değeri (10. aşama)
// ---------------------------------------------------------------------------

/** Kasabanın toplam yiyecek değeri: yiyecek + ekmek × 2,5 + dilimlenmiş ekmekten artan pay. */
export function foodSupply(state) {
  let total = state.pantry?.credit ?? 0;
  for (const key of FOOD_KEYS) total += (state.resources[key] ?? 0) * RESOURCES[key].foodValue;
  return total;
}

// ---------------------------------------------------------------------------
// Kasaba seviyesi / prestij (10. aşama): ölçütler, unvan, belediye
// ---------------------------------------------------------------------------

/** Kasabanın şu anki seviyesinin tanımı (data/town.js -> TOWN_TIERS). */
export function townTier(state) {
  const tier = state.town?.tier ?? 1;
  return TOWN_TIERS.find((t) => t.tier === tier) ?? TOWN_TIERS[0];
}

/** Bir sonraki seviyenin tanımı (en üstteyse null). */
export function nextTownTier(state) {
  return TOWN_TIERS.find((t) => t.tier === townTier(state).tier + 1) ?? null;
}

/**
 * Seviye için sayılan yapı mı? Tamamlanmış (ya da onarılmış) ve süsleme olmayan, oyuncunun kurduğu ya da
 * onardığı yapılar sayılır: bank, fener, çiçek tarhı ve haritanın doğal parçaları (çalı, havuz, ateş) sayılmaz.
 */
export function isTownBuilding(building) {
  const def = BUILDINGS[building.type];
  if (!building.functional) return false;
  if (def.ruin) return true;
  return Boolean(def.buildable) && def.category !== 'Süsleme';
}

/** Kasaba seviyesi ölçütleri: { population, buildings, upgraded, welfare, townHall } */
export function townMetrics(state) {
  return {
    population: activePopulation(state),
    buildings: state.buildings.filter(isTownBuilding).length,
    upgraded: state.buildings.filter((b) => b.functional && b.upgraded).length,
    welfare: state.town?.welfare ?? townHappiness(state),
    townHall: state.buildings.filter((b) => b.functional && BUILDINGS[b.type].civic).length,
  };
}

const METRIC_LABELS = {
  population: { name: 'Nüfus', icon: 'heart' },
  buildings: { name: 'Yapı', icon: 'hammer' },
  upgraded: { name: 'Seviye 2 yapı', icon: 'star' },
  welfare: { name: 'Ortalama refah', icon: 'smile', percent: true },
  townHall: { name: 'Belediye Konağı', icon: 'tierTown' },
};

/**
 * Bir seviyenin koşullarının durumu: [{ key, name, icon, current, target, ok, text }] (sıfır hedefler atlanır).
 */
export function tierChecks(state, tierDef, metrics = townMetrics(state)) {
  if (!tierDef?.requires) return [];
  return Object.entries(tierDef.requires)
    .filter(([, target]) => target > 0)
    .map(([key, target]) => {
      const label = METRIC_LABELS[key];
      const current = key === 'welfare' ? Math.floor(metrics[key]) : metrics[key];
      const text = label.percent ? `${label.name} %${current} / %${target}` : `${label.name} ${current}/${target}`;
      return { key, name: label.name, icon: label.icon, current, target, ok: current >= target, text };
    });
}

/** Ölçütlere göre ulaşılabilen en yüksek seviye (koşulların hepsi birlikte sağlanmalı). */
export function eligibleTier(state, metrics = townMetrics(state)) {
  let best = 1;
  for (const def of TOWN_TIERS) {
    if (!def.requires) continue;
    if (tierChecks(state, def, metrics).every((c) => c.ok)) best = Math.max(best, def.tier);
    else break; // seviyeler sırayla atlanır
  }
  return best;
}

/**
 * Kasaba adı ve unvanı: "Yeşilvadi Kasabası". Ad zaten bir unvanla bitiyorsa ("Ayışığı Köyü") unvan ayrıca
 * eklenir: "Ayışığı Köyü · Kasaba".
 */
export function formatTownTitle(name, tierDef) {
  const words = String(name).trim().split(/\s+/);
  const last = words[words.length - 1].toLocaleLowerCase('tr');
  if (TITLE_WORDS.some((w) => last.startsWith(w))) return `${name} · ${tierDef.name}`;
  return `${name} ${tierDef.suffix}`;
}

/** Tamamlanmış belediyenin (civic) kasaba çapındaki iş ve inşaat hızı çarpanı (yoksa 1). */
export function civicWorkMultiplier(state) {
  let value = 1;
  for (const b of state.buildings) {
    const civic = BUILDINGS[b.type].civic;
    if (civic && b.functional) value = Math.max(value, civic.workSpeed ?? 1);
  }
  return value;
}

/** Zanaat Loncası fermanının meslek deneyimi çarpanı (ilan edilmediyse 1). */
export function civicXpMultiplier(state) {
  return state.civic?.craftGuild ? CIVIC_PROJECTS.craftGuild.xpMultiplier : 1;
}

/** Zanaat Loncası fermanının üretim yapılarındaki çalışma verimi çarpanı (ilan edilmediyse 1). */
export function civicProductionMultiplier(state) {
  return state.civic?.craftGuild ? CIVIC_PROJECTS.craftGuild.productionMultiplier : 1;
}

/** Kasaba çapında iş hızı: geçici bonuslar (Alet Paketi, şenlik, lonca) × belediye. */
export function townWorkMultiplier(state) {
  // (20. aşama) Altın Çağ şevki +%10; (22. aşama) Ağır Vergi seçiliyken -%15
  return buffMultiplier(state, 'workSpeed') * civicWorkMultiplier(state) * goldenWorkMultiplier(state) * taxWorkMultiplier(state);
}

// ---------------------------------------------------------------------------
// Kasaba bonusları: state.buffs = { anahtar: bitiş oyun dakikası }
// ---------------------------------------------------------------------------

export function isBuffActive(state, key) {
  return (state.buffs?.[key] ?? -1) > state.totalMinutes;
}

/** Etkin bonuslar: [{ key, name, icon, minutesLeft }] */
export function activeBuffs(state) {
  return Object.keys(TOWN_BUFFS)
    .filter((key) => isBuffActive(state, key))
    .map((key) => ({ key, ...TOWN_BUFFS[key], minutesLeft: state.buffs[key] - state.totalMinutes }));
}

/** Etkin bonusların bir alanının çarpımı (ör. 'workSpeed', 'funDecay'); bonus yoksa 1. */
export function buffMultiplier(state, field) {
  let value = 1;
  for (const key of Object.keys(TOWN_BUFFS)) {
    if (TOWN_BUFFS[key][field] !== undefined && isBuffActive(state, key)) value *= TOWN_BUFFS[key][field];
  }
  return value;
}
