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
import { RELICS } from '../data/luxury.js';
import { MASTERPIECES } from '../data/masterpieces.js';
import { INSCRIPTIONS } from '../data/exploration.js';
import { emptyExploration } from '../systems/Exploration.js';
import { SEASON_FESTIVALS } from '../data/festivals.js';
import { WEATHER_TYPES } from '../data/weather.js';
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
    this.weather = { type: STARTING_WEATHER, cloud: 0, rain: 0, mist: 0, changes: 0, nextChangeAt: null };
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
      weddings: 0, // düğün (13. aşama: Kasaba Arşivi)
      births: 0, // doğan çocuk
      seasonFestivals: 0, // kutlanan mevsim festivali (14. aşama)
      recollections: 0, // sakinlerin güzel bir anıyı hatırlaması
      rallies: 0, // çalınan toplanma zili
      quarrels: 0, // (15. aşama) atışma
      reconciliations: 0, // (15. aşama) barışan küs çiftler
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
    this.trade = { boat: null, nextBoatAt: null, shipments: 0, goldEarned: 0, exported: {}, last: null, grandDay: null, grandPending: false, grandVoyages: 0 };
    // Altın ekonomisi (LuxurySystem, 13. aşama): sergilenen yadigârlar { id: { day, hour, minute } }, ipek ve mermer
    // alındı mı, altın fermanlarının son ilan günü, satın alma sayısı ve harcanan toplam altın
    this.luxury = { relics: {}, silk: false, decreeDays: {}, purchases: 0, goldSpent: 0 };
    // Kasaba Arşivi (StatsSystem, 13. aşama): her sabahın özeti { day, population, welfare, stock, gold }
    this.history = [];
    // Mevsim festivalleri (SeasonFestivalSystem, 14. aşama): duyurulan / süren festival, süslemeleri, katılanlar ve
    // her temanın kaç kez kutlandığı
    this.seasonFestival = { day: null, theme: null, stage: null, startedAt: null, decor: [], attendees: [], held: {} };
    // Toplanma Zili (14. aşama): sakinler bu dakikaya kadar meydanda toplanır { until, rungAt } ya da null
    this.rally = null;
    // Usta işi eserler (CraftsmanshipSystem, 15. aşama): ustaların çıkardığı eserler ve durumları (bkz. systems/Masterworks.js)
    this.masterworks = emptyMasterworks();
    // Keşif (ExpeditionSystem, 16. aşama): egzotik ganimetler, kadim yazıtlar ve imar şemaları, sefer günlüğü
    // (bkz. systems/Exploration.js; süren sefer state.dilemma.expedition'da)
    this.exploration = emptyExploration();
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
      festival: { active: false, venueId: null, lastDay: -99, endsAt: 0, theme: null },
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
      luxury: this.luxury,
      history: this.history,
      seasonFestival: this.seasonFestival,
      rally: this.rally,
      masterworks: this.masterworks,
      exploration: this.exploration,
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
    // 13. aşamadan eski kayıtlarda altın harcaması, yadigâr ve arşiv yoktur: boş başlar
    next.luxury = {
      ...next.luxury,
      ...(data.luxury ?? {}),
      relics: Object.fromEntries(Object.entries(data.luxury?.relics ?? {}).filter(([id]) => RELICS[id])),
      decreeDays: { ...(data.luxury?.decreeDays ?? {}) },
    };
    next.history = (data.history ?? []).filter((h) => h && Number.isFinite(h.day)).slice(-CONFIG.HISTORY_DAYS);
    // 14. aşamadan eski kayıtlarda festival, toplanma zili ve anı yoktur (anılar ilk açılışta kurulur)
    next.seasonFestival = {
      ...next.seasonFestival,
      ...(data.seasonFestival ?? {}),
      decor: [...(data.seasonFestival?.decor ?? [])],
      attendees: [...(data.seasonFestival?.attendees ?? [])],
      held: { ...(data.seasonFestival?.held ?? {}) },
    };
    if (next.seasonFestival.theme && !SEASON_FESTIVALS[next.seasonFestival.theme]) next.seasonFestival.stage = null;
    next.rally = data.rally && Number.isFinite(data.rally.until) ? { ...data.rally } : null;
    // 15. aşamadan eski kayıtlarda usta işi eser yoktur: vitrin boş başlar (kıyafetler deneyimden türetilir)
    next.masterworks = restoreMasterworks(data.masterworks);
    // 16. aşamadan eski kayıtlarda keşif ganimeti ve yazıt yoktur; yarım kalmış eski sefer maceralarsız sürer
    next.exploration = restoreExploration(data.exploration);
    if (!WEATHER_TYPES[next.weather.type]) next.weather.type = 'sunny';
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
    // Düğün ve doğum sayaçları eski kayıtlarda yoktur: sakinlerden tahmin edilir (evli çiftler, ebeveynli sakinler)
    if (data.stats?.weddings === undefined) next.stats.weddings = Math.floor(next.characters.filter((c) => c.married).length / 2);
    if (data.stats?.births === undefined) next.stats.births = next.characters.filter((c) => c.parentIds.length > 0).length;
    sanitizeReferences(next);
    next.pendingTerrain = data.terrain;
    Object.assign(this, next);
  }
}

const INSCRIPTION_STATUSES = new Set(['found', 'decoding', 'decoded']);

/** Kayıttaki keşif durumu: bilinmeyen yazıt ve eşyalar atlanır, sayılar sınırlanır. */
function restoreExploration(data) {
  const out = emptyExploration();
  if (!data || typeof data !== 'object') return out;
  for (const key of Object.keys(out.items)) out.items[key] = Math.max(0, Math.floor(Number(data.items?.[key]) || 0));
  out.cityMap = Boolean(data.cityMap);
  for (const [id, v] of Object.entries(data.inscriptions ?? {})) {
    if (INSCRIPTIONS[id] && v && INSCRIPTION_STATUSES.has(v.status)) out.inscriptions[id] = { ...v };
  }
  const d = data.decoding;
  out.decoding = d && INSCRIPTIONS[d.id] && out.inscriptions[d.id]?.status === 'decoding' ? { id: d.id, progress: Math.max(0, Number(d.progress) || 0) } : null;
  // Çözülürken kaydedilmiş ama çözüm kaydı kaybolmuş yazıt yeniden "bulundu" olur
  for (const [id, v] of Object.entries(out.inscriptions)) if (v.status === 'decoding' && out.decoding?.id !== id) v.status = 'found';
  out.expeditions = Math.max(0, Number(data.expeditions) || 0);
  out.lastLaunchDay = Number.isFinite(data.lastLaunchDay) ? data.lastLaunchDay : -99;
  out.ironCredit = Math.max(0, Number(data.ironCredit) || 0);
  out.log = (Array.isArray(data.log) ? data.log : []).filter((l) => l && typeof l.route === 'string').slice(-12);
  return out;
}

function emptyMasterworks() {
  return { items: [], nextId: 1, made: 0, exhibited: 0, sold: 0, goldEarned: 0, lastByMaker: {}, lastDay: null, today: 0 };
}

const MASTERWORK_STATUSES = new Set(['stored', 'exhibited', 'sold']);

/** Kayıttaki usta işi eserler: bilinmeyen tür ya da durumdaki eserler atlanır, sayaçlar en az eser sayısı kadar olur. */
function restoreMasterworks(data) {
  const out = emptyMasterworks();
  if (!data || typeof data !== 'object') return out;
  out.items = (Array.isArray(data.items) ? data.items : [])
    .filter((i) => i && MASTERPIECES[i.type] && MASTERWORK_STATUSES.has(i.status) && Number.isFinite(i.id))
    .map((i) => ({ ...i }));
  const maxId = out.items.reduce((m, i) => Math.max(m, i.id), 0);
  out.nextId = Math.max(maxId + 1, Number(data.nextId) || 1);
  out.made = Math.max(out.items.length, Number(data.made) || 0);
  out.exhibited = Math.max(out.items.filter((i) => i.status === 'exhibited').length, Number(data.exhibited) || 0);
  out.sold = Math.max(out.items.filter((i) => i.status === 'sold').length, Number(data.sold) || 0);
  out.goldEarned = Math.max(0, Number(data.goldEarned) || 0);
  out.lastByMaker = { ...(data.lastByMaker ?? {}) };
  out.lastDay = Number.isFinite(data.lastDay) ? data.lastDay : null;
  out.today = Math.max(0, Number(data.today) || 0);
  return out;
}

/**
 * Kayıttaki kopuk referansları onarır (elle düzenlenmiş ya da yarım yazılmış kayıtlar): var olmayan iş yerine
 * sabitleme kalkar; evi olmayan sakine boş bir yatak bulunur (yoksa evsiz kalır); karşılıksız eş / sevgili bağı
 * çözülür; var olmayan ebeveyn kimlikleri silinir.
 */
function sanitizeReferences(next) {
  const buildings = new Map(next.buildings.map((b) => [b.id, b]));
  const people = new Map(next.characters.map((c) => [c.id, c]));
  for (const c of next.characters) {
    if (c.workplaceId !== null && !buildings.has(c.workplaceId)) c.workplaceId = null;
    if (c.homeId !== null && !buildings.has(c.homeId)) c.homeId = null;
    if (c.partnerId !== null) {
      const p = people.get(c.partnerId);
      if (!p || p.partnerId !== c.id || p === c) {
        c.partnerId = null;
        c.married = false;
        c.partnerSince = null;
        c.marriedAt = null;
      }
    }
    if (c.parentIds.some((id) => id === c.id || !people.has(id))) c.parentIds = c.parentIds.filter((id) => id !== c.id && people.has(id));
  }
  const residents = new Map();
  for (const c of next.characters) if (c.homeId !== null) residents.set(c.homeId, (residents.get(c.homeId) ?? 0) + 1);
  for (const c of next.characters) {
    if (c.homeId !== null) continue;
    const home = next.buildings.find((b) => b.functional && b.capacity > (residents.get(b.id) ?? 0));
    if (!home) continue;
    c.homeId = home.id;
    c.relocating = true; // yeni evine yürür
    residents.set(home.id, (residents.get(home.id) ?? 0) + 1);
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
