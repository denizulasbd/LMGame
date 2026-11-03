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
import { RESEARCH } from '../data/research.js';
import { Character } from '../entities/Character.js';
import { Building } from '../entities/Building.js';
import { Animal } from '../entities/Animal.js';

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
    // Dilimlenmiş ekmekten artan yiyecek değeri (EconomySystem.consumeFood; ekmek 2,5 yiyecek sayılır)
    this.pantry = { credit: 0 };
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
      goods: { wool: 0, iron: 0, bread: 0 }, // üretim zincirlerinin toplam ürettiği işlenmiş mallar (10. aşama)
      illnesses: 0, // üşüten sakin sayısı (11. aşama)
      cured: 0, // şifacıda iyileşen
      petted: 0, // sakinlerin kedi / köpek sevmesi
      dilemmas: 0, // karar verilen ikilem olayı
    };
    // Hayvanlar (AnimalSystem, 11. aşama): yaban hayatı (tavşan, geyik) ve kasaba kedileri / köpekleri.
    // animalMeta: wildlifeSeeded yaban hayatı yerleştirildi mi, lastPetDay son evcil hayvanın geldiği gün
    this.animals = [];
    this.animalMeta = { wildlifeSeeded: false, lastPetDay: 0 };
    // Belediye fermanları (CivicSystem, 11. aşama): depo genişletme kademesi, lonca, son ziyafet günü,
    // keşif seferlerinden gelen kadim tılsımlar (refaha kalıcı katkı)
    this.civic = { storageLevel: 0, craftGuild: false, feastDay: -99, decrees: 0, relics: 0, expeditionsSinceTalisman: 0 };
    // İkilem olayları (DilemmaSystem, 11. aşama):
    //   nextDay   : bir sonraki olayın günü, history: { olay: son çıktığı gün }
    //   active    : açık karar penceresi { id, remaining (gerçek saniye), wasPaused }
    //   storm     : yaklaşan fırtına / kurt saldırısı { kind, at (oyun dakikası), fortified, watchChance }
    //   expedition: süren keşif seferi { members: [id], until, size }
    this.dilemma = { nextDay: null, history: {}, active: null, storm: null, expedition: null };
    // Bilgelik Evi (ResearchSystem, 12. aşama): süren araştırma { id, progress } ve biten araştırmalar
    // { id: { day, hour, minute } }
    this.research = { active: null, done: {} };
    // Nehir ihracatı (HarborSystem, 12. aşama):
    //   boat      : nehirdeki ticaret teknesi { stage: arriving | docked | leaving, progress, cargo, dockUntil } ya da null
    //   nextBoatAt: sıradaki teknenin yola çıkacağı oyun dakikası
    //   shipments, goldEarned, exported: toplam sefer, kazanılan altın ve kaynak başına ihraç edilen birim
    //   last      : son sefer { day, hour, minute, gold, cargo }
    this.trade = { boat: null, nextBoatAt: null, shipments: 0, goldEarned: 0, exported: {}, last: null };
    // Kasaba seviyesi / prestij (TownLevelSystem, 10. aşama):
    //   tier        : 1 Mezra, 2 Köy, 3 Kasaba, 4 Gelişmiş Şehir (hiç düşmez)
    //   reached     : { seviye: { day, hour, minute } } her seviyeye ulaşılan an
    //   welfare     : ortalama refah (kasaba refahının yarım günlük yürüyen ortalaması)
    //   balanceDay  : belediyenin erzak dengesini en son yaptığı gün
    //   assessed    : seviye bu kayıtta hiç değerlendirildi mi (eski kayıtlarda ilk değerlendirme sessiz olur)
    this.town = { tier: 1, reached: { 1: { day: this.time.day, hour: this.time.hour, minute: this.time.minute } }, welfare: null, balanceDay: 0, assessed: true };
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
      pantry: this.pantry,
      town: this.town,
      civic: this.civic,
      dilemma: this.dilemma,
      research: this.research,
      trade: this.trade,
      animals: this.animals.map((a) => a.toJSON()),
      animalMeta: this.animalMeta,
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
    // 10. aşamadan eski kayıtlarda yün, demir ve ekmek yoktur: 0 başlar
    for (const key of Object.keys(next.resources)) next.resources[key] = Math.max(0, Math.floor(Number(next.resources[key]) || 0));
    next.pantry = { credit: Math.max(0, Number(data.pantry?.credit) || 0) };
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
    next.stats.goods = { ...new GameState().stats.goods, ...(data.stats?.goods ?? {}) };
    // 11. aşamadan eski kayıtlarda hayvan, ferman ve olay yoktur: yaban hayatı ilk açılışta yerleştirilir
    next.civic = { ...next.civic, ...(data.civic ?? {}) };
    next.dilemma = { ...next.dilemma, ...(data.dilemma ?? {}), history: { ...(data.dilemma?.history ?? {}) } };
    next.animals = (data.animals ?? []).filter((a) => a && Number.isFinite(a.x) && Number.isFinite(a.y)).map((a) => Animal.fromJSON(a));
    next.animalMeta = { ...next.animalMeta, ...(data.animalMeta ?? {}) };
    // 12. aşamadan eski kayıtlarda araştırma, okul ve liman yoktur: boş başlar
    next.research = {
      active: RESEARCH[data.research?.active?.id] ? { id: data.research.active.id, progress: Math.max(0, Number(data.research.active.progress) || 0) } : null,
      done: Object.fromEntries(Object.entries(data.research?.done ?? {}).filter(([id]) => RESEARCH[id])),
    };
    next.trade = { ...next.trade, ...(data.trade ?? {}), exported: { ...(data.trade?.exported ?? {}) } };
    // Kasaba seviyesi: eski (sürüm 7 ve öncesi) kayıtlarda yoktur; ilk değerlendirme sessizce yapılır
    // (büyümüş bir kasaba yüklenince art arda kutlama çıkmasın)
    if (data.town && Number.isInteger(data.town.tier)) {
      next.town = {
        tier: Math.min(4, Math.max(1, data.town.tier)),
        reached: { ...(data.town.reached ?? {}) },
        welfare: Number.isFinite(data.town.welfare) ? data.town.welfare : null,
        balanceDay: data.town.balanceDay ?? 0,
        assessed: data.town.assessed !== false,
      };
    } else {
      next.town = { tier: 1, reached: {}, welfare: null, balanceDay: 0, assessed: false };
    }
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
