// Kaydedilebilir tüm oyun verisinin tek kaynağı.
// Sistemler durumu burada değiştirir; çizim ve UI yalnızca okur.
// Harita kaydedilmez: aynı tohumdan (seed) yeniden üretilir, yalnızca değişen karolar
// kayda eklenir (bkz. world/TerrainSnapshot.js; kayıt dosyasını SaveManager yazar).
import { CONFIG } from '../config.js';
import { STARTING_RESOURCES, BASE_STORAGE_CAPACITY } from '../data/resources.js';
import { STARTING_WEATHER } from '../data/weather.js';
import { BUILDINGS } from '../data/buildings.js';
import { getSeason } from '../data/seasons.js';
import { TOWN_NAMES, TOWN_NAME_MAX_LENGTH } from '../data/town.js';
import { EQUIPMENT_KEYS } from '../data/equipment.js';
import { Character } from '../entities/Character.js';
import { Building } from '../entities/Building.js';

const randomSeed = () => Math.floor(Math.random() * 1_000_000_000);

/** Tohuma göre önerilen kasaba adı (aynı tohum aynı adı önerir). */
export function defaultTownName(seed) {
  return TOWN_NAMES[Math.abs(Math.floor(seed)) % TOWN_NAMES.length];
}
const MAX_JOURNAL_ENTRIES = 200;

export class GameState {
  constructor() {
    this.reset();
  }

  reset(seed = randomSeed(), townName = null) {
    this.seed = seed;
    this.townName = townName ?? defaultTownName(seed);
    // Harita tohumdan yeniden üretilir; boyutu ve üretici sürümü kayda girer ki eski 48x48 haritalar
    // kendi boyutunda, biyomsuz olarak açılsın (yeni oyunlar 80x80 ve biyomlu)
    this.map = { width: CONFIG.MAP_WIDTH, height: CONFIG.MAP_HEIGHT, generator: CONFIG.WORLD_GEN_VERSION };
    this.time = {
      day: CONFIG.START_DAY,
      hour: CONFIG.START_HOUR,
      minute: CONFIG.START_MINUTE,
      paused: false,
      speed: CONFIG.TIME_SPEEDS[0],
    };
    this.resources = { ...STARTING_RESOURCES };
    this.storageCapacity = BASE_STORAGE_CAPACITY; // EconomySystem yapılara göre günceller
    this.characters = [];
    this.buildings = [];
    this.jobs = []; // oyuncunun verdiği iş emirleri (JobSystem)
    this.nextJobId = 1;
    this.regrowth = []; // yeniden büyüyen ağaçlar (NatureSystem)
    // Hava: type hedef hava, cloud/rain o an görünen yumuşak değerler, changes değişim sayacı,
    // nextChangeAt bir sonraki değişimin oyun dakikası (WeatherSystem)
    this.weather = { type: STARTING_WEATHER, cloud: 0, rain: 0, changes: 0, nextChangeAt: null };
    this.relationships = {}; // "küçükId-büyükId" -> ilişki puanı -50..100 (RelationshipSystem)
    // Kasaba deposundaki boşta kişisel ekipman: { sturdyTool, winterCoat, backpack } (CraftingSystem)
    this.equipment = Object.fromEntries(EQUIPMENT_KEYS.map((k) => [k, 0]));
    this.journal = []; // kasaba günlüğü: { day, hour, minute, text, icon } (JournalSystem)
    this.buffs = {}; // kasaba bonusları: { tools | feast | festival: bitiş oyun dakikası }
    // Kış ısınması (HeatingSystem): buffer yakılmayı bekleyen odun küsuratı, cold odun bittiği için
    // evlerin soğuk olduğu, lastNoticeDay uyarının o gün verilip verilmediği
    this.heating = { buffer: 0, cold: false, lastNoticeDay: 0 };
    // Kasaba hedefleri (MilestoneSystem): tamamlananlar { id: { day, hour, minute } } ve sayaçlar
    this.milestones = {};
    this.stats = {
      buildingsCompleted: 0,
      mealsCooked: 0,
      trades: 0,
      wintersSurvived: 0,
      cobbles: 0, // döşenmiş taş yol karosu (MilestoneSystem sayar)
      winter: null, // sürmekte olan kışın takibi: { minHappiness, startPopulation }
    };
    // Dinamik olaylar (EventSystem):
    //   festival : { active, venueId, lastDay, endsAt } akşam şenliği
    //   merchant : { nextVisitDay, visits, present, leaving, name, appearance, x, y, exit, stock } gezgin tüccar
    //   immigration: { lastNoticeDay } göçmenlerin gelmediği günün bildirimi bir kez verilsin
    this.events = {
      festival: { active: false, venueId: null, lastDay: -99, endsAt: 0 },
      merchant: {
        nextVisitDay: null,
        visits: 0,
        present: false,
        leaving: false,
        name: null,
        appearance: null,
        x: 0,
        y: 0,
        exit: null,
        stock: {},
      },
      immigration: { lastNoticeDay: 0 },
    };
    this.pendingTerrain = null; // yüklenen kaydın harita farkları; sahne kurulurken uygulanır
  }

  /** Şu anki oyun zamanı, günün başından itibaren değil oyun başından itibaren dakika olarak. */
  get totalMinutes() {
    const { day, hour, minute } = this.time;
    return (day - 1) * 1440 + hour * 60 + minute;
  }

  addJournal(text, icon = null) {
    const { day, hour, minute } = this.time;
    this.journal.push({ day, hour, minute, text, icon });
    if (this.journal.length > MAX_JOURNAL_ENTRIES) this.journal.splice(0, this.journal.length - MAX_JOURNAL_ENTRIES);
    return this.journal[this.journal.length - 1];
  }

  /** Kayıt için düz veri (harita farkları dışında; onu sahne ekler). */
  toJSON() {
    return {
      seed: this.seed,
      townName: this.townName,
      map: this.map,
      time: this.time,
      resources: this.resources,
      jobs: this.jobs.map((j) => ({ ...j, assignees: [] })), // görevler kaydedilmez, işler yeniden dağıtılır
      nextJobId: this.nextJobId,
      regrowth: this.regrowth,
      weather: this.weather,
      relationships: this.relationships,
      equipment: this.equipment,
      journal: this.journal,
      buffs: this.buffs,
      events: this.events,
      heating: this.heating,
      milestones: this.milestones,
      stats: this.stats,
      season: getSeason(this.time.day).key, // bilgi amaçlı: mevsim yüklenirken günden yeniden hesaplanır
      characters: this.characters.map((c) => c.toJSON()),
      buildings: this.buildings.map((b) => b.toJSON()),
    };
  }

  /**
   * Kayıttan duruma yükler. Geçersiz kayıtta hata fırlatır ve durumu olduğu gibi bırakır.
   * Haritanın karo farkları pendingTerrain'e konur; TownScene.enter() uygular.
   */
  restore(data) {
    validateSave(data);
    const next = new GameState();
    next.reset(data.seed);
    // 8. aşamadan eski kayıtlar: haritaları 48x48 ve biyomsuzdur
    next.map = data.map
      ? { width: data.map.width, height: data.map.height, generator: data.map.generator }
      : { width: CONFIG.LEGACY_MAP_SIZE, height: CONFIG.LEGACY_MAP_SIZE, generator: 1 };
    next.time = { ...next.time, ...data.time };
    next.resources = { ...next.resources, ...data.resources };
    next.jobs = data.jobs.map((j) => ({ ...j, assignees: [] }));
    next.nextJobId = data.nextJobId ?? next.jobs.reduce((m, j) => Math.max(m, j.id + 1), 1);
    next.regrowth = data.regrowth ?? [];
    next.weather = { ...next.weather, ...data.weather };
    next.relationships = { ...(data.relationships ?? {}) };
    // 9. aşamadan eski kayıtlarda ekipman deposu yoktur: boş başlar
    for (const key of EQUIPMENT_KEYS) next.equipment[key] = Math.max(0, Math.floor(data.equipment?.[key] ?? 0));
    next.journal = (data.journal ?? []).slice(-MAX_JOURNAL_ENTRIES);
    next.buffs = { ...(data.buffs ?? {}) };
    next.heating = { ...next.heating, ...(data.heating ?? {}) };
    // 7. aşamadan eski kayıtlarda ad yoksa tohumdan önerilen ad verilir
    if (typeof data.townName === 'string' && data.townName.trim()) next.townName = data.townName.trim().slice(0, TOWN_NAME_MAX_LENGTH);
    next.milestones = { ...(data.milestones ?? {}) };
    next.stats = { ...next.stats, ...(data.stats ?? {}) };
    // Eski (2. sürüm) kayıtlarda olay alanları yoksa varsayılanlar kalır
    for (const key of Object.keys(next.events)) next.events[key] = { ...next.events[key], ...(data.events?.[key] ?? {}) };
    next.buildings = data.buildings.map((b) => new Building(b));
    next.characters = data.characters.map((c) => Character.fromJSON(c));
    next.pendingTerrain = data.terrain;
    Object.assign(this, next);
  }
}

function validateSave(data) {
  const fail = (what) => {
    throw new Error(`Kayıt geçersiz: ${what}`);
  };
  if (!data || typeof data !== 'object') fail('veri yok');
  if (!(data.version >= CONFIG.SAVE_MIN_VERSION && data.version <= CONFIG.SAVE_VERSION)) fail(`sürüm ${data.version}`);
  if (!Number.isFinite(data.seed)) fail('harita tohumu');
  if (!data.time || !Number.isFinite(data.time.day)) fail('zaman');
  if (!data.resources) fail('kaynaklar');
  for (const key of ['jobs', 'characters', 'buildings', 'terrain']) if (!Array.isArray(data[key])) fail(key);
  if (data.map && !(Number.isInteger(data.map.width) && Number.isInteger(data.map.height) && data.map.width >= 16 && data.map.height >= 16)) {
    fail('harita boyutu');
  }
  for (const b of data.buildings) if (!BUILDINGS[b.type]) fail(`bilinmeyen yapı ${b.type}`);
}
