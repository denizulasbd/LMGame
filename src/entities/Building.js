// Haritaya yerleştirilmiş bir yapı. Türün kuralları src/data/buildings.js'te,
// görselleri src/art/sprites/structures.js'te. Bu sınıf yapının anlık durumunu
// (inşaat ilerlemesi, içindekiler, çalışanlar, üretim, meyve, ateş) tutar ve kendini çizer.
//
// 8. aşama: yapının seviyesi (level 1 / 2: yükseltilmiş), harabe durumu (condition 'ruined' /
// 'restored') ve sürmekte olan yükseltme ya da onarım (project: { kind, progress, work }) da burada.
// Seviye 2'nin ad, kapasite, çalışan sayısı gibi farkları data/buildings.js -> upgrade alanından okunur.
//
// 9. aşama: oyuncunun işten çıkardığı sakinler (excludedWorkers: burada bir daha çalışmazlar), son
// çalışanlar (recentWorkers, Yapı Bilgi Paneli için) ve zanaat atölyesinin üretim seçimi (craftMode)
// ile tezgâhtaki iş (craft: { item, progress }).
//
// 10. aşama: koyun ağılı iki katmanda çizilir, aradaki koyunlar (flock, entities/Flock.js) derinlik sırasıyla
// girer; değirmenin kanatları rüzgârda ağır ağır, fırıncı çalışırken hızlı döner (sailPhase); fırın ve
// belediye geceleri ışık verir; madenin girişinde fener yanar.
//
// 23. aşama: yangın (isBurning, fireProgress 0-100, fireWater atılan kova) ve hasar nedeni (damageKind 'storm' | 'fire' |
// 'raid', damagedAt). Hasarlı yapı haritadan silinmez: onarılana kadar çalışmaz (isDamaged, damaged ile aynı bayrak).
// Gözcü Kulesi'nin nöbet yeri sayısı (guardSlots) CrisisSystem'den gelir.
import { CLOCK_GEAR } from '../data/goldenAge.js';
import { CONFIG } from '../config.js';
import { Entity } from './Entity.js';
import { BUILDINGS, PROJECT_WORDS } from '../data/buildings.js';
import { DAMAGE_KINDS } from '../data/crisis.js';
import { normalizeCrop } from '../systems/Granary.js';
import { EQUIPMENT } from '../data/equipment.js';
import {
  getStructureSprite,
  getConstructionSiteSprite,
  CABIN_ART,
  PIER_ART,
  INN_ART,
  LANTERN_ART,
  TORCH_ART,
  MONUMENT_ART,
  STONE_HOUSE_ART,
  WATCHTOWER_ART,
  GUARD_TOWER_ART,
  WORKSHOP_ART,
  BREWERY_ART,
  MILL_ART,
  IRON_MINE_ART,
  TOWN_HALL_ART,
  HEALER_ART,
  ACADEMY_ART,
  HARBOR_ART,
  WONDER_ART,
  CHERRY_ART,
  IRON_LANTERN_ART,
  GOLDEN_LANTERN_ART,
  SIGNPOST_ART,
  getGazeboLayer,
  getSheepFarmLayer,
} from '../art/sprites/index.js';
import { getBubbleSprite, BUBBLE_WIDTH, BUBBLE_HEIGHT, getIconSprite } from '../art/ui/index.js';
import { winterize } from '../art/seasons.js';

const T = CONFIG.TILE_SIZE;

// Taban çizgisi: görselin "yere bastığı" yer, Y-sıralamada kullanılır (karonun altından yukarı)
const BASELINE_INSET = {
  cabin: 2,
  fountain: 4,
  bench: 3,
  campfire: 3,
  berryBush: 3,
  lumberHut: 2,
  garden: 2,
  storage: 2,
  inn: 2,
  market: 2,
  lantern: 3,
  monument: 2,
  quarry: 2,
  fishingPier: 2,
  flowerBed: 2,
  watchtower: 2,
  supplyCamp: 2,
  ancientFountain: 3,
  workshop: 2,
  sheepFarm: 2,
  mill: 3,
  ironMine: 2,
  townHall: 3,
  healerHut: 2,
  academy: 3,
  harbor: 2,
  wonder: 4,
  cherryTree: 3,
  gazebo: 2,
  marbleArch: 1,
  flowerFence: 3,
  ancientTorch: 6,
  // 18. aşama
  woodFence: 3,
  fenceGate: 3,
  ironLantern: 3,
  marbleFountain: 3,
  goldenLantern: 3,
  signpost: 3,
  parkBench: 3,
  planter: 3,
  birchTree: 3,
  oakTree: 3,
  pineTree: 3,
  royalStatue: 3,
  // 23. aşama
  well: 3,
  guardTower: 2,
  // 24. aşama
  silo: 2,
  // 24.2
  loom: 2,
  brewery: 2,
};
// Çardağın çatısı kışın karla örtülür (arka katman çatı altında kalır, karlanmaz)
const GAZEBO_WINTER_ROOF = { light: ['E'], main: ['X'], dark: ['w'], maxRow: 21 };
const SITE_BASELINE_INSET = 2;
const RECENT_WORKERS_EXTRA = 2; // panelde çalışan yuvasından bu kadar fazla "son çalışan" hatırlanır

// Animasyon kare hızı (kare / saniye): ateş titrer, tabela ve flama sallanır, çiçekler eğilir
const FRAME_RATES = { campfire: 8, flowerBed: 1.4, planter: 1.2, inn: 2.5, market: 3, ancientFountain: 4, workshop: 5, loom: 4, brewery: 3, mill: 6, ironMine: 1.4, townHall: 2.5, healerHut: 3, academy: 2.5, harbor: 1.6, wonder: 2.4, marbleFountain: 4, well: 1.5 };
const DEFAULT_FRAME_RATE = 3;
const MAX_OVERHANG = 70; // yapıların karolarının üstüne taşabileceği en fazla piksel (görünürlük testi; harika 64)
// Değirmen kanatları: saniyede kaç kare (çeyrek tur = MILL_ART.sailFrames kare) döner
const SAIL_SPEED = { wind: 2.5, working: 9 };
const SHEEP_Z_COLOR = 'rgba(238, 244, 250, 0.85)';

export class Building extends Entity {
  constructor({
    id,
    type,
    tileX,
    tileY,
    tone = 0,
    berries,
    underConstruction = false,
    buildProgress = 0,
    orientation = 'right',
    regrowProgress = 0,
    producedToday = 0,
    meals = 0,
    level = 1,
    condition,
    project = null,
    craftMode = 'auto',
    craft = null,
    excludedWorkers = [],
    recentWorkers = [],
    herbs = 0,
    remedies = 0,
    damaged = false,
    isDamaged = false,
    isBurning = false,
    fireProgress = 0,
    fireWater = 0,
    damageKind = null,
    damagedAt = null,
    treatedToday = 0,
    wonderStage = 0,
    exportThreshold = undefined,
    crate = null,
    label = null,
    plantedAt = null,
    crop = undefined,
    sherbet = 0,
  }) {
    super({ id, x: tileX * T, y: tileY * T });
    this.type = type;
    this.tileX = tileX;
    this.tileY = tileY;
    this.tone = tone;
    this.orientation = orientation; // iskele: suyun hangi yanda olduğu ('right' | 'left')

    this.underConstruction = underConstruction;
    this.buildProgress = buildProgress; // oyun dakikası × işçi
    this.occupants = new Set(); // şu an içeride olan karakter kimlikleri
    this.workerIds = new Set(); // üretim binasında çalışanlar
    this.productionBuffer = 0; // henüz depoya girmemiş küsurat
    this.producedToday = producedToday;
    this.efficiency = 1; // üretim verimi: 1 = tam (oduncu: çevredeki ağaçlara göre düşer, yağmurda bahçe artar)
    this.active = false; // şu an biri çalışıyor mu (ocak ve iskele animasyonları)
    this.meals = meals; // han: pişmiş, yenmeyi bekleyen sıcak yemek porsiyonu
    this.mealBuffer = 0; // han: pişmekte olan porsiyonun küsuratı
    this.open = false; // pazar: tüccar şu an tezgâhta mı (EventSystem)
    this.lit = false; // ateş / fener yanıyor mu
    this.berries = berries ?? this.definition.maxBerries ?? 0;
    this.regrowProgress = regrowProgress; // saat cinsinden
    this.level = level; // 2 = yükseltilmiş (Taş Ev, Kereste Atölyesi, Cam Sera, Derin Maden Ocağı)
    this.condition = condition ?? (this.definition.ruin ? 'ruined' : null); // harabe: 'ruined' | 'restored'
    this.project = project ? { ...project } : null; // sürmekte olan { kind: 'upgrade' | 'repair', progress, work }
    this.excludedWorkers = new Set(excludedWorkers); // oyuncunun bu işten çıkardığı sakinler
    this.recentWorkers = [...recentWorkers]; // son çalışanlar (en yenisi sonda)
    this.craftMode = craftMode; // atölye: 'auto' ya da üretilecek ekipman (data/equipment.js)
    this.craft = craft ? { ...craft } : null; // atölye: tezgâhtaki iş { item, progress }
    this.craftStatus = null; // atölye: neden üretmediği (CraftingSystem her karede yazar)
    this.idle = false; // yapılacak iş yok (atölyede malzeme ya da sipariş yok): kimse çalışmaya gelmez
    this.processStatus = null; // değirmen-fırın: neden boşta olduğu (StructureSystem yazar)
    this.extraBuffers = {}; // yan ürünün (ağılda yiyecek, madende taş) henüz depoya girmemiş küsuratı
    this.extraToday = 0; // bugün gelen yan ürün
    this.flock = null; // ağıldaki koyunlar (yalnızca görsel; StructureSystem kurar ve günceller)
    this.sailPhase = (this.id * 0.37) % 6; // değirmen kanatlarının açısı (kare cinsinden; gerçek zamanla döner)
    this.sailClock = null;
    // 11. aşama: şifacı kulübesindeki şifalı ot ve iksir stoğu; fırtına / kurt hasarı
    this.herbs = herbs;
    this.remedies = remedies;
    this.treatedToday = treatedToday;
    this.damaged = Boolean(damaged || isDamaged); // hasarlı yapı onarılana (project 'mend') kadar çalışmaz
    // 23. aşama: yangın (söndürülmezse fireProgress 100'de yapı hasar alır) ve hasarın nedeni
    this.isBurning = Boolean(isBurning);
    this.fireProgress = Number.isFinite(fireProgress) ? Math.min(100, Math.max(0, fireProgress)) : 0;
    this.fireWater = Math.max(0, Math.floor(Number(fireWater) || 0));
    this.damageKind = (this.damaged || this.isBurning) && DAMAGE_KINDS[damageKind] ? damageKind : null; // null = fırtına (eski kayıtlar)
    this.damagedAt = Number.isFinite(damagedAt) ? damagedAt : null;
    this.guardSlots = 1; // Gözcü Kulesi: nöbet tutabilecek bekçi sayısı (CrisisSystem yetişkin sayısına göre günceller)
    // 12. aşama: harikanın tamamlanan aşaması (0 şantiye, 1 temel, 2 gövde, 3 tamamlandı); limanın fazlalık
    // ihracatı sınırı (null = kapalı) ve rıhtımda bekleyen ihracat sandığı { kaynak: birim }
    this.wonderStage = wonderStage;
    this.exportThreshold = exportThreshold === undefined ? null : exportThreshold;
    this.crate = crate ? { ...crate } : null;
    // 18. aşama: mahalle tabelasının adı (oyuncu verir) ve süs fidanının dikildiği an (oyun dakikası; büyüme buna göre)
    this.label = typeof label === 'string' && label.trim() ? label.trim() : null;
    this.plantedAt = Number.isFinite(plantedAt) ? plantedAt : null;
    this.growth = 1; // süs fidanı: 0-1 büyüme (LandscapeSystem her adımda yazar)
    // 24. aşama: bahçenin ekim tercihi (data/crops.js); eski kayıtlarda (sürüm 2-20) ve geçersiz değerde Buğday / Sebze
    this.crop = normalizeCrop(type, crop);
    // 24.2: handaki fıçı şerbeti (RefinerySystem kasaba deposundan taşır); eski kayıtlarda 0
    this.sherbet = type === 'inn' ? Math.max(0, Math.floor(Number(sherbet) || 0)) : 0;
  }

  /** (18. aşama) Süs fidanının büyüme kademesi: 0 fidan, 1 genç ağaç, 2 ulu ağaç. */
  get growthStage() {
    if (!this.definition.ornamentalTree) return 2;
    if (this.underConstruction) return 0;
    return this.growth >= 1 ? 2 : this.growth >= 0.4 ? 1 : 0;
  }

  /** Burada çalışmaya başlayan sakini son çalışanlar listesine ekler. */
  noteWorker(characterId) {
    this.recentWorkers = this.recentWorkers.filter((id) => id !== characterId);
    this.recentWorkers.push(characterId);
    const limit = this.workerSlots + RECENT_WORKERS_EXTRA;
    if (this.recentWorkers.length > limit) this.recentWorkers.splice(0, this.recentWorkers.length - limit);
  }

  /** Atölyede yapılan işin ilerlemesi 0-1. */
  get craftRatio() {
    return this.craft ? Math.min(1, this.craft.progress / (EQUIPMENT[this.craft.item] ?? CLOCK_GEAR).work) : 0; // (20. aşama) Kadim Dişli
  }

  get definition() {
    return BUILDINGS[this.type];
  }

  /** Çok aşamalı harikanın son aşaması bitti mi? */
  get wonderComplete() {
    return Boolean(this.definition.wonder) && this.wonderStage >= this.definition.wonder.stages.length;
  }

  /** Yükseltilmiş mi (Seviye 2)? */
  get upgraded() {
    return this.level >= 2 && Boolean(this.definition.upgrade);
  }

  /** Yıkık harabe mi (henüz onarılmamış)? */
  get ruined() {
    return this.condition === 'ruined';
  }

  /** Kullanılabilir mi: inşaatı bitmiş ve yıkık bir harabe değil. */
  get functional() {
    return !this.underConstruction && !this.ruined;
  }

  /** Seviyeye göre değişen bir alan: Seviye 2'de upgrade'deki değer, yoksa temel tanımdaki. */
  stat(key, fallback = undefined) {
    const def = this.definition;
    if (this.upgraded && def.upgrade[key] !== undefined) return def.upgrade[key];
    return def[key] ?? fallback;
  }

  get name() {
    if (this.ruined) return this.definition.ruin.name;
    if (this.label && this.type === 'signpost') return this.label;
    if (this.definition.grownName && this.functional && this.growthStage === 2) return this.definition.grownName;
    return this.upgraded ? this.definition.upgrade.name : this.definition.name;
  }

  get description() {
    if (this.ruined) return this.definition.ruin.description;
    return this.upgraded ? this.definition.upgrade.description : this.definition.description;
  }

  /** Ev kapasitesi (Taş Ev 4 kişi). */
  get capacity() {
    return this.stat('capacity', 0);
  }

  /** Aynı anda çalışabilecek kişi sayısı (Kereste Atölyesi 2; Gözcü Kulesi 1-2 bekçi). */
  get workerSlots() {
    if (this.definition.guard) return this.functional && !this.damaged && !this.isBurning ? this.guardSlots : 0;
    return this.stat('workers', 0);
  }

  /** (23. aşama) Hasarlı mı? `damaged` ile aynı bayrak (fırtına, yangın ya da baskın hasarı). */
  get isDamaged() {
    return this.damaged;
  }

  set isDamaged(value) {
    this.damaged = Boolean(value);
    if (!this.damaged) {
      this.damageKind = null;
      this.damagedAt = null;
    }
  }

  /** Yükseltme ya da onarım ilerlemesi 0-1. */
  get projectRatio() {
    return this.project ? Math.min(1, this.project.progress / this.project.work) : 0;
  }

  get width() {
    return this.definition.size.w * T;
  }

  get height() {
    return this.definition.size.h * T;
  }

  get sortY() {
    if (!this.underConstruction && this.definition.sortLine !== undefined) return this.y + this.definition.sortLine;
    return this.y + this.height - (this.underConstruction ? SITE_BASELINE_INSET : BASELINE_INSET[this.type]);
  }

  /**
   * Çalışanların ayaklarının basacağı noktalar (iskelenin ucu, ocağın kaya yüzü önü); yapı yönüne göre
   * aynalanır. Tanımı olmayan yapılarda boş dizi.
   */
  get workPoints() {
    const def = this.definition;
    const points = def.workPoints ?? (def.workPoint ? [def.workPoint] : []);
    return points.map((p) => ({ x: this.x + (this.orientation === 'left' ? this.width - p.x : p.x), y: this.y + p.y }));
  }

  /** İlk çalışma noktası (tek çalışanlı yapılar). */
  get workPoint() {
    return this.workPoints[0];
  }

  /** İskelede çalışanın baktığı yön (su tarafı). */
  get workFacing() {
    const facing = this.definition.workFacing;
    if (!facing) return undefined;
    return this.orientation === 'left' && facing === 'right' ? 'left' : facing;
  }

  /** Yapının dünya pikseli cinsinden merkezi (karakterlerin yüzünü dönmesi için). */
  get center() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  /** Kapının dünya pikseli konumu (içeri giren karakter burada kaybolur). */
  get entrancePoint() {
    const e = this.definition.entrance ?? { x: this.width / 2, y: this.height };
    return { x: this.x + e.x, y: this.y + e.y };
  }

  /** Bankta oturan karakterin ayak noktası. */
  get seatPoint() {
    const seat = this.definition.seat ?? { x: this.width / 2, y: this.height - 3 };
    return { x: this.x + seat.x, y: this.y + seat.y };
  }

  /** İnşaat ilerlemesi 0-1 (şantiye). */
  get buildRatio() {
    const work = this.definition.buildWork ?? 1;
    return Math.min(1, this.buildProgress / work);
  }

  /** Arayüzde (HUD) gösterilecek kısa ad ve ayrıntı. */
  describe(world) {
    if (this.underConstruction) {
      return { name: `Şantiye: ${this.name}`, detail: `%${Math.floor(this.buildRatio * 100)} tamamlandı` };
    }
    if (this.project) {
      const verb = PROJECT_WORDS[this.project.kind].ing;
      return { name: this.name, detail: `${verb}: %${Math.floor(this.projectRatio * 100)}` };
    }
    if (this.ruined) return { name: this.name, detail: 'Kadim harabe · tıkla ve onar' };
    if (this.damaged) return { name: this.name, detail: 'Hasarlı · tıkla ve onar' };
    if (this.type === 'cabin') {
      const names = world.getResidents(this).map((c) => c.name);
      const owner = names.length ? `${names.join(' ve ')} yaşıyor` : 'Boş, yeni sakin bekliyor';
      const inside = this.occupants.size ? ` · içeride ${this.occupants.size} kişi` : '';
      return { name: this.name, detail: `${owner} (${world.getResidents(this).length}/${this.capacity})${inside}` };
    }
    if (this.type === 'berryBush') {
      const max = this.definition.maxBerries;
      return { name: this.name, detail: this.berries > 0 ? `${this.berries}/${max} porsiyon` : 'Yeniden yetişiyor' };
    }
    if (this.type === 'campfire') {
      return { name: this.name, detail: this.lit ? 'Çıtır çıtır yanıyor' : 'Söndü, akşam yakılacak' };
    }
    if (this.type === 'inn') {
      const cap = this.definition.kitchen.capacity;
      return { name: this.name, detail: `Sıcak yemek: ${this.meals}/${cap} porsiyon${this.lit ? ' · akşam toplanma yeri' : ''}` };
    }
    if (this.type === 'market') {
      return { name: this.name, detail: this.open ? 'Gezgin tüccar tezgâhta · tıkla ve takas et' : 'Gezgin tüccar bekleniyor' };
    }
    if (this.type === 'flowerBed') {
      return { name: this.name, detail: 'Yanındakilerin keyfi artıyor' };
    }
    if (this.type === 'workshop') {
      if (this.craft) return { name: this.name, detail: `${(EQUIPMENT[this.craft.item] ?? CLOCK_GEAR).name}: %${Math.floor(this.craftRatio * 100)}` };
      return { name: this.name, detail: this.craftStatus ?? 'Zanaatkâr bekleniyor' };
    }
    if (this.type === 'mill') {
      if (this.processStatus) return { name: this.name, detail: this.processStatus };
      return { name: this.name, detail: `Bugün ${this.producedToday} sıcak ekmek · ${this.active ? 'fırın yanıyor' : 'kanatlar rüzgârda dönüyor'}` };
    }
    if (this.type === 'sheepFarm') {
      const count = this.flock ? this.flock.sheep.length + (this.flock.lamb ? 1 : 0) : this.definition.flock.sheep;
      return { name: this.name, detail: `${count} koyun · bugün ${this.producedToday} yün${this.active ? ' · çoban başında' : ''}` };
    }
    if (this.type === 'townHall') {
      return { name: this.name, detail: 'Kasabanın iş ve inşaat verimi +%15 · her sabah erzak dengesi · fermanlar' };
    }
    if (this.type === 'academy') {
      if (this.processStatus) return { name: this.name, detail: this.processStatus };
      return { name: this.name, detail: this.active ? 'Bilge çalışıyor · araştırma ve ders' : 'Bilge bekleniyor' };
    }
    if (this.type === 'harbor') {
      const t = this.exportThreshold;
      return { name: this.name, detail: `${this.active ? 'Tekne yanaştı, yükleniyor · ' : ''}${t === null ? 'Fazlalık ihracatı kapalı' : `Stok ${t}'ü geçince fazlası ihraç edilir`}` };
    }
    if (this.type === 'wonder') {
      const n = this.definition.wonder.stages.length;
      return { name: this.name, detail: this.wonderComplete ? 'Altın çağ · geceleri vadiyi aydınlatır ve ısıtır' : `Aşama ${this.wonderStage}/${n} tamamlandı · tıkla ve sıradakini başlat` };
    }
    if (this.type === 'gazebo') return { name: this.name, detail: 'Çiftlerin ve dostların sohbet köşesi' };
    if (this.type === 'cherryTree') return { name: this.name, detail: 'Rüzgârda yaprakları savrulan süs ağacı' };
    if (this.type === 'marbleArch') return { name: this.name, detail: 'Altından geçilebilir' };
    // 18. aşama: sokak eşyaları ve süs ağaçları
    if (this.type === 'signpost') return { name: this.name, detail: 'Mahalle tabelası · tıkla ve adını değiştir' };
    if (this.type === 'fenceGate') return { name: this.name, detail: 'Sakinler kapıdan geçer' };
    if (this.type === 'woodFence') return { name: this.name, detail: 'Geçilemez · bir Çit Kapısı bırak' };
    if (this.type === 'ironLantern' || this.type === 'lantern' || this.type === 'goldenLantern') return { name: this.name, detail: this.lit ? 'Yanıyor · sokağı aydınlatıyor' : 'Akşam yanacak' };
    if (this.type === 'parkBench' || this.type === 'bench') return { name: this.name, detail: 'Sakinler oturup manzarayı izler' };
    if (this.type === 'planter') return { name: this.name, detail: 'Yanından geçenler çiçek kokusunu içine çeker' };
    if (this.definition.ornamentalTree) {
      const stage = ['Fidan', 'Genç ağaç', 'Ulu ağaç · gölgesinde dinlenilir'][this.growthStage];
      return { name: this.name, detail: this.growthStage === 2 ? stage : `${stage} · büyüyor %${Math.floor(this.growth * 100)}` };
    }
    if (this.type === 'healerHut') {
      return { name: this.name, detail: `İksir ${this.remedies}/${this.definition.apothecary.maxRemedies} · şifalı ot ${Math.floor(this.herbs)}` };
    }
    if (this.workerSlots) {
      const workers = [...this.workerIds].map((id) => world.getCharacter(id)?.name).filter(Boolean);
      return { name: this.name, detail: workers.length ? `Çalışan: ${workers.join(', ')}` : 'Çalışan yok' };
    }
    return { name: this.name, detail: this.description ?? null };
  }

  // ---------------------------------------------------------------------------
  // Çizim
  // ---------------------------------------------------------------------------

  isVisible(view) {
    return (
      this.x + this.width > view.left &&
      this.x < view.right &&
      this.y + this.height > view.top &&
      this.y - MAX_OVERHANG < view.bottom
    );
  }

  currentSprite(env) {
    if (this.underConstruction) {
      const { w, h } = this.definition.size;
      const site = getConstructionSiteSprite(w, h, Math.min(2, Math.floor(this.buildRatio * 3)), this.type, this.orientation);
      return env.season === 'winter' ? winterize(site) : site;
    }
    if (this.type === 'mill') this.advanceSails(env.time);
    return getStructureSprite(this.type, {
      sailFrame: Math.floor(this.sailPhase),
      windowsLit: env.windowsLit,
      tone: this.tone,
      frame: Math.floor(env.time * (FRAME_RATES[this.type] ?? DEFAULT_FRAME_RATE)),
      open: this.open,
      season: env.season,
      lit: this.lit,
      active: this.active,
      orientation: this.orientation,
      berries: this.berries,
      maxBerries: this.definition.maxBerries,
      level: this.upgraded ? 2 : 1,
      ruined: this.ruined,
      wonderStage: this.wonderStage,
      relics: env.relics ?? 0,
      connect: this.connect,
      growthStage: this.growthStage,
      scaffold: this.project?.kind === 'stage',
      step: Math.min(3, Math.floor(this.projectRatio * 4)),
      crop: this.crop,
    });
  }

  /** Değirmen kanatları gerçek zamanla döner: rüzgârda ağır ağır, fırıncı çalışırken hızlı (hız yumuşak değişir). */
  advanceSails(time) {
    const dt = this.sailClock === null ? 0 : Math.max(0, Math.min(0.25, time - this.sailClock));
    this.sailClock = time;
    const target = this.active ? SAIL_SPEED.working : SAIL_SPEED.wind;
    this.sailSpeed = (this.sailSpeed ?? target) + (target - (this.sailSpeed ?? target)) * Math.min(1, dt * 1.5);
    this.sailPhase = (this.sailPhase + dt * this.sailSpeed) % (MILL_ART.sailFrames * 1000);
  }

  /** Görseli derinlik kuyruğuna ekler (karolarının alt kenarına hizalı). */
  queueDraw(queue, env) {
    // Koyun ağılı: arka katman (otlak, ahır, yan çitler) + koyunlar + ön çit; koyunlar çitin arkasında kalır
    if (this.type === 'sheepFarm' && !this.underConstruction) {
      const back = getSheepFarmLayer('back', env.season);
      const front = getSheepFarmLayer('front', env.season);
      const top = this.y + this.height - back.height;
      queue.addImage(this.y + 4, back, this.x, top);
      this.flock?.queueDraw(queue, this.x, this.y);
      queue.addImage(this.y + this.height - BASELINE_INSET.sheepFarm, front, this.x, top);
      return;
    }
    // (13. aşama) Çardak: arka katman (döşeme, kafes, banklar) + oturanlar + ön katman (direkler, çatı)
    if (this.type === 'gazebo' && !this.underConstruction) {
      const back = getGazeboLayer('back');
      const front = env.season === 'winter' ? winterize(getGazeboLayer('front'), GAZEBO_WINTER_ROOF) : getGazeboLayer('front');
      const top = this.y + this.height - back.height;
      queue.addImage(this.y + 4, back, this.x, top);
      queue.addImage(this.y + this.height - BASELINE_INSET.gazebo, front, this.x, top);
      return;
    }
    const sprite = this.currentSprite(env);
    queue.addImage(this.sortY, sprite, this.x, this.y + this.height - sprite.height);
  }

  /**
   * Yapıların üstünde, atmosfer katmanının altında çizilen efektler: baca dumanı, çiçek tarhının
   * kelebekleri, iskelede sıçrayan balık. (Ocaktaki toz kazma sallayan karakterin efektidir.)
   */
  drawEffects(renderer, env) {
    if (this.underConstruction) return;
    if (this.damaged) this.drawDamage(renderer);
    if (this.isBurning) this.drawFlames(renderer, env);
    else if (this.type === 'well') this.drawWellDrip(renderer, env);
    switch (this.type) {
      case 'cabin':
        if (env.smokingHomes?.has(this.id)) {
          const art = this.homeArt;
          const artTop = this.y + this.height - art.height;
          this.drawChimneySmoke(renderer, env, this.x + art.chimney.x, artTop + art.chimney.y, this.occupants.size > 0 ? 1 : 0.55);
        }
        break;
      case 'inn':
        // Ocak yanarken (akşam ya da aşçı çalışırken) han bacası tüter
        if (this.lit || this.active) {
          const artTop = this.y + this.height - INN_ART.height;
          this.drawChimneySmoke(renderer, env, this.x + INN_ART.chimney.x, artTop + INN_ART.chimney.y, 1);
        }
        break;
      case 'flowerBed':
        this.drawButterflies(renderer, env);
        break;
      case 'workshop':
        // Zanaatkâr çalışırken ocak bacası tüter
        if (this.active) {
          const artTop = this.y + this.height - WORKSHOP_ART.height;
          this.drawChimneySmoke(renderer, env, this.x + WORKSHOP_ART.chimney.x, artTop + WORKSHOP_ART.chimney.y, 1);
        }
        break;
      case 'brewery':
        // (24.2) Mahzen ustası çalışırken kazanın bacası tüter
        if (this.active) {
          const artTop = this.y + this.height - BREWERY_ART.height;
          this.drawChimneySmoke(renderer, env, this.x + BREWERY_ART.chimney.x, artTop + BREWERY_ART.chimney.y, 1);
        }
        break;
      case 'fishingPier':
        this.drawFishJump(renderer, env);
        break;
      case 'healerHut':
        // Şifacı çalışırken kazandan yeşilimsi buhar yükselir
        if (this.active) this.drawSteam(renderer, env);
        break;
      case 'cherryTree':
        this.drawPetals(renderer, env);
        break;
      case 'mill': {
        // Fırın bacası: fırıncı çalışırken yoğun, gündüz fırın sıcakken ince tüter
        const artTop = this.y + this.height - MILL_ART.height;
        const warm = env.hour >= 6 && env.hour < 20 && this.producedToday > 0;
        if (this.active || warm) this.drawChimneySmoke(renderer, env, this.x + MILL_ART.chimney.x, artTop + MILL_ART.chimney.y, this.active ? 1 : 0.55);
        break;
      }
      default:
        break;
    }
  }

  /** Kulübe ya da taş evin çizim ölçüleri (baca, pencereler). */
  get homeArt() {
    return this.upgraded ? STONE_HOUSE_ART : CABIN_ART;
  }

  /** Bacadan yükselen duman; strength 1 = yoğun, daha az ise seyrek ve soluk. */
  drawChimneySmoke(renderer, env, chimneyX, chimneyY, strength) {
    const puffs = strength === 1 ? 5 : 3;

    // Yükseldikçe büyüyen, sağa savrulan, solan pikseller; üstlerinde açık bir vurgu
    for (let i = 0; i < puffs; i++) {
      const phase = (env.time * 0.4 + i / puffs + this.id * 0.17) % 1;
      const px = Math.round(chimneyX + Math.sin(phase * 6 + i * 1.7) * 1.6 + phase * 7);
      const py = Math.round(chimneyY - 2 - phase * 20);
      const size = phase < 0.25 ? 2 : phase < 0.6 ? 3 : 4;
      const alpha = 0.62 * strength * Math.pow(1 - phase, 1.2);
      renderer.fillRect(px - 1, py, size, size, `rgba(222, 218, 234, ${alpha.toFixed(2)})`);
      renderer.fillRect(px - 1, py, size - 1, 1, `rgba(252, 250, 255, ${(alpha * 0.8).toFixed(2)})`);
    }
  }

  /** Gündüz, yağmur yokken tarhın üstünde iki kelebek uçar. */
  drawButterflies(renderer, env) {
    if (env.windowsLit || env.raining || !env.butterflies) return;
    const colors = [['#ffd23f', '#ff9a3c'], ['#f6e6b4', '#f06b8a']];
    for (let i = 0; i < 2; i++) {
      const t = env.time * (0.5 + i * 0.17) + this.id * 1.3 + i * 3;
      const cx = this.x + this.width / 2 + Math.sin(t) * 13 + Math.sin(t * 2.3) * 3;
      const cy = this.y + 6 + Math.cos(t * 1.4) * 5 + Math.sin(t * 3.1) * 2;
      const flap = Math.floor(env.time * 7 + i) % 2 === 0;
      const [wing, tip] = colors[i];
      const x = Math.round(cx);
      const y = Math.round(cy);
      renderer.fillRect(x, y, 1, 2, '#1b1423');
      renderer.fillRect(x - (flap ? 2 : 1), y - (flap ? 1 : 0), 2, flap ? 2 : 1, wing);
      renderer.fillRect(x + 1, y - (flap ? 1 : 0), 2, flap ? 2 : 1, wing);
      if (flap) {
        renderer.fillRect(x - 2, y + 1, 1, 1, tip);
        renderer.fillRect(x + 2, y + 1, 1, 1, tip);
      }
    }
  }

  /** Çalışan varken iskelenin ucunda ara sıra bir balık sıçrar ve suda halka bırakır. */
  drawFishJump(renderer, env) {
    if (!this.active) return;
    const cycle = (env.time * 0.55 + this.id * 0.31) % 1;
    const dir = this.orientation === 'left' ? -1 : 1;
    const baseX = this.workPoint.x + dir * 12;
    const waterY = this.y + 24;
    if (cycle < 0.22) {
      const k = cycle / 0.22;
      const arc = Math.sin(k * Math.PI) * 9;
      const x = Math.round(baseX + dir * k * 10);
      const y = Math.round(waterY - arc);
      renderer.fillRect(x, y, 4, 2, '#9be3f2');
      renderer.fillRect(x + (dir > 0 ? 3 : -1), y - 1, 1, 1, '#4aa3df');
      renderer.fillRect(x + (dir > 0 ? 0 : 3), y, 1, 1, '#1b1423');
    } else if (cycle < 0.5) {
      const r = 1 + Math.floor((cycle - 0.22) * 18);
      const alpha = (0.8 - (cycle - 0.22) * 2.6).toFixed(2);
      const x = Math.round(baseX + dir * 10);
      renderer.fillRect(x - r, waterY, r * 2 + 1, 1, `rgba(238, 251, 255, ${alpha})`);
    }
  }

  /** Atmosfer katmanının üstünde (gece de okunur) çizilen işaretler: "Zzz", şantiye ilerlemesi. */
  drawOverlay(renderer, env) {
    if (this.underConstruction) {
      this.drawProgressBar(renderer, env, this.buildRatio);
      return;
    }
    if (this.isBurning) {
      this.drawFireWarning(renderer, env);
      return;
    }
    if (this.project) {
      // Yükseltme / onarım: çekiç ve ilerleme çubuğu yapının tepesinde (yıkık harabe alçaktır:
      // çubuk ayak izinin üstünde durur)
      const top = this.ruined ? this.y : this.y + this.height - this.currentSprite(env).height + 4;
      this.drawProgressBar(renderer, env, this.projectRatio, top);
      return;
    }
    if (this.damaged) {
      // Hasarlı yapının üstünde sallanan uyarı: fırtına bulutu ya da (yangın / baskın) kırık-çekiç simgesi
      const bob = Math.sin(env.time * 3) > 0 ? 0 : 1;
      const icon = this.damageKind === 'fire' || this.damageKind === 'raid' ? 'repair' : 'storm';
      renderer.drawImage(getIconSprite(icon), Math.round(this.center.x) - 4, this.y + this.height - this.currentSprite(env).height - 6 + bob);
    }
    if (this.type === 'sheepFarm' && this.flock) {
      this.drawSleepingSheep(renderer, env);
      return;
    }
    if (this.type !== 'cabin' || !env.sleepingHomes.has(this.id)) return;
    const artTop = this.y + this.height - this.homeArt.height;
    const bob = Math.round(Math.sin(env.time * 2.4) * 1.5);
    const bx = this.x + Math.floor((this.width - BUBBLE_WIDTH) / 2) - 3;
    const by = artTop - BUBBLE_HEIGHT + 2 + bob;
    renderer.drawImage(getBubbleSprite('zzz'), bx, by);
  }

  /** Kiraz ağacından rüzgârda süzülen yapraklar / çiçek yaprakları (kışın dökülmez). */
  drawPetals(renderer, env) {
    const colors = CHERRY_ART.petals[env.season] ?? [];
    if (colors.length === 0) return;
    const artTop = this.y + this.height - CHERRY_ART.height;
    const { x: cx, y: cy, rx } = CHERRY_ART.canopy;
    const count = env.raining ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const phase = (env.time * 0.22 + i / count + this.id * 0.37) % 1;
      const startX = this.x + cx + (((i * 7 + this.id * 3) % 11) - 5) * (rx / 5);
      const x = Math.round(startX + phase * 14 + Math.sin(phase * 9 + i) * 2.5);
      const y = Math.round(artTop + cy + 2 + phase * 20);
      const color = colors[(i + this.id) % colors.length];
      renderer.fillRect(x, y, Math.floor(env.time * 3 + i) % 2 === 0 ? 2 : 1, 1, color);
    }
  }

  /** Şifacı kazanından yükselen ince, yeşilimsi buhar. */
  drawSteam(renderer, env) {
    const artTop = this.y + this.height - HEALER_ART.height;
    for (let i = 0; i < 4; i++) {
      const phase = (env.time * 0.6 + i / 4 + this.id * 0.13) % 1;
      const x = Math.round(this.x + HEALER_ART.steam.x + Math.sin(phase * 7 + i) * 1.5);
      const y = Math.round(artTop + HEALER_ART.steam.y - phase * 12);
      const alpha = (0.55 * (1 - phase)).toFixed(2);
      renderer.fillRect(x, y, phase < 0.5 ? 1 : 2, 1, `rgba(200, 240, 200, ${alpha})`);
    }
  }

  /** Fırtına hasarı: yapının dibine saçılmış kırık tahtalar, kiremit ve taş parçaları. */
  drawDamage(renderer) {
    const base = this.y + this.height - 3;
    const pieces = [
      [0.15, -1, 4, 1, '#7a4a2a'],
      [0.32, 0, 2, 1, '#b4523f'],
      [0.55, -2, 5, 1, '#a8703f'],
      [0.62, 0, 1, 2, '#4f2d1a'],
      [0.8, -1, 3, 1, '#8b8f9c'],
      [0.45, 1, 2, 1, '#5d6070'],
    ];
    for (const [fx, dy, w, h, color] of pieces) {
      renderer.fillRect(Math.round(this.x + this.width * fx), base + dy, w, h, color);
    }
    // Eğik, kırık bir kalas
    for (let i = 0; i < 6; i++) renderer.fillRect(Math.round(this.x + this.width * 0.25) + i, base - 4 + Math.floor(i / 2), 1, 1, '#4f2d1a');
  }

  /** (23. aşama) Yanan yapı: ilerlemeyle büyüyen alev dilleri ve yükselen duman. */
  drawFlames(renderer, env) {
    const sprite = this.currentSprite(env);
    const top = this.y + this.height - sprite.height;
    const grow = 0.45 + 0.55 * (this.fireProgress / 100);
    const tongues = Math.max(3, Math.floor(this.width / 7));
    const span = this.width - 6;
    for (let i = 0; i < tongues; i++) {
      const t = env.time * 11 + i * 1.9 + this.id;
      const flick = Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.3;
      const x = Math.round(this.x + 3 + (span * (i + 0.5)) / tongues);
      const baseY = Math.round(top + sprite.height * (0.55 + 0.12 * ((i * 5) % 3)));
      const h = Math.max(4, Math.round((9 + (i % 3) * 3 + flick * 3) * grow));
      renderer.fillRect(x - 2, baseY - h, 5, h, '#e8463c');
      renderer.fillRect(x - 1, baseY - h - 2, 3, h + 1, '#ff9a3c');
      renderer.fillRect(x, baseY - h - 3, 1, Math.max(2, Math.round(h * 0.6)), '#ffd23f');
    }
    for (let i = 0; i < 4; i++) {
      const phase = (env.time * 0.5 + i / 4 + this.id * 0.17) % 1;
      const x = Math.round(this.x + this.width * (0.25 + 0.17 * i) + Math.sin(phase * 6 + i) * 2);
      const y = Math.round(top + 2 - phase * 22);
      const size = phase < 0.4 ? 3 : 4;
      renderer.fillRect(x, y, size, size, `rgba(70, 64, 80, ${(0.55 * (1 - phase)).toFixed(2)})`);
    }
  }

  /** (23. aşama) Yangın uyarısı: yapının tepesinde zıplayan alev simgesi ve ilerleme çubuğu (dolarsa yapı hasar alır). */
  drawFireWarning(renderer, env) {
    const top = this.y + this.height - this.currentSprite(env).height;
    const bob = Math.sin(env.time * 7) > 0 ? 0 : 1;
    const cx = Math.round(this.center.x);
    renderer.drawImage(getIconSprite('fire'), cx - 4, top - 14 + bob);
    const w = Math.max(14, this.width - 10);
    const x = cx - Math.round(w / 2);
    const y = top - 3;
    renderer.fillRect(x - 1, y - 1, w + 2, 4, '#1b1423');
    renderer.fillRect(x, y, w, 2, '#5a2a20');
    renderer.fillRect(x, y, Math.round((w * this.fireProgress) / 100), 2, '#ff9a3c');
  }

  /** (23. aşama) Su Kuyusu: kovadan ara sıra düşen su damlası. */
  drawWellDrip(renderer, env) {
    if (!this.functional || this.damaged) return;
    const phase = (env.time * 0.7 + this.id * 0.37) % 1;
    if (phase > 0.5) return;
    const x = this.x + 8;
    const y = Math.round(this.y + 10 + phase * 14);
    renderer.fillRect(x, y, 1, 2, '#9be3f2');
  }

  /** Uyuyan koyunların başının üstünde yavaşça yükselen küçük "z" harfleri. */
  drawSleepingSheep(renderer, env) {
    const sleepers = this.flock.sleepers();
    sleepers.forEach((s, i) => {
      if (s.lamb || i % 2 === 1) return; // hepsinde değil: kalabalık görünmesin
      const phase = (env.time * 0.35 + i * 0.41 + this.id * 0.13) % 1;
      const x = Math.round(this.x + s.x + 3 + phase * 3);
      const y = Math.round(this.y + s.y - 8 - phase * 6);
      renderer.fillRect(x, y, 3, 1, SHEEP_Z_COLOR);
      renderer.fillRect(x + 1, y + 1, 1, 1, SHEEP_Z_COLOR);
      renderer.fillRect(x, y + 2, 3, 1, SHEEP_Z_COLOR);
    });
  }

  drawProgressBar(renderer, env, ratio, top = this.y) {
    const barWidth = Math.max(10, this.width - 14);
    const x = Math.round(this.x + (this.width - barWidth) / 2) + 4;
    const y = top - 14;
    const bob = Math.sin(env.time * 3) > 0 ? 0 : 1;
    renderer.drawImage(getIconSprite('hammer'), x - 11, y - 3 + bob);
    renderer.fillRect(x - 1, y - 1, barWidth + 2, 5, '#1b1423');
    renderer.fillRect(x, y, barWidth, 3, '#7d5233');
    renderer.fillRect(x, y, Math.round(barWidth * ratio), 3, '#a4dd5c');
    renderer.fillRect(x, y, Math.round(barWidth * ratio), 1, '#e8f6d6');
  }

  /** Gece ışık katmanı için ışık kaynakları. */
  collectLights(out, env) {
    if (!this.functional) return;
    if (this.type === 'campfire' && this.lit) {
      const flicker = Math.sin(env.time * 11) * 3 + Math.sin(env.time * 17.3) * 2;
      out.push({ x: this.x + T / 2, y: this.y + T / 2, radius: 74 + flicker, color: [255, 160, 70], intensity: 0.95, glow: 0.38 });
    } else if (this.type === 'lantern' && this.lit) {
      // Sokak feneri: sıcak sarı, geniş ışık halkası
      const artTop = this.y + this.height - LANTERN_ART.height;
      // (14. aşama) Işıklar Gecesi'nde bütün fenerler parıldar
      const sparkle = env.festivalTheme === 'winter' ? 1.35 + Math.sin(env.time * 4 + this.id) * 0.08 : 1;
      out.push({ x: this.x + LANTERN_ART.light.x, y: artTop + LANTERN_ART.light.y, radius: 52 * sparkle, color: [255, 214, 120], intensity: 0.85, glow: 0.34 * Math.min(1.25, sparkle) });
    } else if (this.type === 'ironLantern' && this.lit) {
      // (18. aşama) Demir sokak feneri: ahşap fenerden geniş, yumuşak sarı ışık
      const artTop = this.y + this.height - IRON_LANTERN_ART.height;
      const sparkle = env.festivalTheme === 'winter' ? 1.3 : 1;
      out.push({ x: this.x + IRON_LANTERN_ART.light.x, y: artTop + IRON_LANTERN_ART.light.y, radius: 68 * sparkle, color: [255, 222, 140], intensity: 0.85, glow: 0.3 });
    } else if (this.type === 'goldenLantern' && this.lit) {
      // (20. aşama) Altın Çağ Feneri: geniş, sıcak altın sarısı ışık
      const artTop = this.y + this.height - GOLDEN_LANTERN_ART.height;
      out.push({ x: this.x + GOLDEN_LANTERN_ART.light.x, y: artTop + GOLDEN_LANTERN_ART.light.y, radius: 96, color: [255, 204, 90], intensity: 0.9, glow: 0.4 });
    } else if (this.type === 'ancientTorch' && this.lit) {
      // (16. aşama) Kadim Meşale: titreyen mavi alev, geniş ve serin bir ışık halkası
      const artTop = this.y + this.height - TORCH_ART.height;
      const flicker = Math.sin(env.time * 9 + this.id) * 3;
      out.push({ x: this.x + TORCH_ART.light.x, y: artTop + TORCH_ART.light.y, radius: 58 + flicker, color: [90, 170, 255], intensity: 0.9, glow: 0.42 });
    } else if (this.type === 'monument' && env.windowsLit) {
      // Anıtın yıldızı gece hafifçe parlar
      const artTop = this.y + this.height - MONUMENT_ART.height;
      out.push({ x: this.x + MONUMENT_ART.star.x, y: artTop + MONUMENT_ART.star.y, radius: 26, color: [255, 220, 120], intensity: 0.6, glow: 0.4 });
    } else if (this.type === 'fishingPier' && this.lit) {
      const flipped = this.orientation === 'left';
      const lx = flipped ? this.width - PIER_ART.light.x : PIER_ART.light.x;
      out.push({
        x: this.x + lx,
        y: this.y + this.height - PIER_ART.height + PIER_ART.light.y,
        radius: 46,
        color: [255, 220, 140],
        intensity: 0.8,
        glow: 0.28,
      });
    } else if (this.type === 'inn' && this.lit) {
      const artTop = this.y + this.height - INN_ART.height;
      for (const w of INN_ART.windows) {
        out.push({ x: this.x + w.x, y: artTop + w.y, radius: 26, color: [255, 170, 80], intensity: 0.8, glow: 0.36 });
      }
      const l = INN_ART.lantern;
      out.push({ x: this.x + l.x, y: artTop + l.y, radius: 34, color: [255, 190, 100], intensity: 0.8, glow: 0.3 });
    } else if (this.type === 'watchtower' && this.lit) {
      // Onarılmış kulenin tepesindeki fener: geniş, sıcak bir ışık halkası
      const artTop = this.y + this.height - WATCHTOWER_ART.height;
      const flicker = Math.sin(env.time * 7) * 2;
      out.push({ x: this.x + WATCHTOWER_ART.light.x, y: artTop + WATCHTOWER_ART.light.y, radius: 84 + flicker, color: [255, 200, 110], intensity: 0.9, glow: 0.4 });
    } else if (this.type === 'guardTower' && this.lit) {
      // (23. aşama) Gözcü Kulesi: köşkün feneri ve iki penceresi geceleri sıcak sarı yanar
      const artTop = this.y + this.height - GUARD_TOWER_ART.height;
      const flicker = Math.sin(env.time * 6 + this.id) * 2;
      out.push({ x: this.x + GUARD_TOWER_ART.light.x, y: artTop + GUARD_TOWER_ART.light.y, radius: 90 + flicker, color: [255, 205, 110], intensity: 0.9, glow: 0.4 });
    } else if (this.type === 'mill') {
      const artTop = this.y + this.height - MILL_ART.height;
      if (env.windowsLit) out.push({ x: this.x + MILL_ART.window.x, y: artTop + MILL_ART.window.y, radius: 20, color: [255, 214, 120], intensity: 0.7, glow: 0.3 });
      if (this.active) {
        const flicker = Math.sin(env.time * 9) * 2;
        out.push({ x: this.x + MILL_ART.oven.x, y: artTop + MILL_ART.oven.y, radius: 30 + flicker, color: [255, 150, 60], intensity: 0.85, glow: 0.4 });
      }
    } else if (this.type === 'ironMine' && this.lit) {
      const artTop = this.y + this.height - IRON_MINE_ART.height;
      const flicker = Math.sin(env.time * 8 + this.id) * 1.5;
      out.push({ x: this.x + IRON_MINE_ART.light.x, y: artTop + IRON_MINE_ART.light.y, radius: 40 + flicker, color: [255, 190, 100], intensity: 0.85, glow: 0.35 });
    } else if (this.type === 'townHall' && env.windowsLit) {
      const artTop = this.y + this.height - TOWN_HALL_ART.height;
      for (const w of TOWN_HALL_ART.windows) {
        out.push({ x: this.x + w.x, y: artTop + w.y, radius: 18, color: [255, 214, 120], intensity: 0.7, glow: 0.28 });
      }
      // (13. aşama) Ebedi Ateş Kandili sergileniyorsa basamak fenerleri turkuaz yanar
      const eternal = Boolean((env.relics ?? 0) & (1 << 4));
      for (const l of TOWN_HALL_ART.lamps) {
        out.push({ x: this.x + l.x, y: artTop + l.y, radius: eternal ? 40 : 34, color: eternal ? [140, 235, 255] : [255, 200, 110], intensity: 0.85, glow: eternal ? 0.26 : 0.35 });
      }
    } else if (this.type === 'healerHut' && env.windowsLit) {
      const artTop = this.y + this.height - HEALER_ART.height;
      out.push({ x: this.x + HEALER_ART.window.x, y: artTop + HEALER_ART.window.y, radius: 20, color: [190, 255, 170], intensity: 0.6, glow: 0.3 });
    } else if (this.type === 'academy' && env.windowsLit) {
      const artTop = this.y + this.height - ACADEMY_ART.height;
      for (const w of ACADEMY_ART.windows) {
        out.push({ x: this.x + w.x, y: artTop + w.y, radius: 18, color: [255, 214, 120], intensity: 0.7, glow: 0.28 });
      }
      for (const l of ACADEMY_ART.lamps) {
        out.push({ x: this.x + l.x, y: artTop + l.y, radius: 30, color: [255, 200, 110], intensity: 0.8, glow: 0.34 });
      }
    } else if (this.type === 'harbor' && this.lit) {
      const artTop = this.y + this.height - HARBOR_ART.height;
      const flipped = this.orientation === 'left';
      const lx = flipped ? this.width - HARBOR_ART.light.x : HARBOR_ART.light.x;
      const wx = flipped ? this.width - HARBOR_ART.window.x : HARBOR_ART.window.x;
      const flicker = Math.sin(env.time * 6 + this.id) * 1.5;
      out.push({ x: this.x + lx, y: artTop + HARBOR_ART.light.y, radius: 56 + flicker, color: [255, 214, 130], intensity: 0.85, glow: 0.36 });
      out.push({ x: this.x + wx, y: artTop + HARBOR_ART.window.y, radius: 16, color: [255, 200, 110], intensity: 0.6, glow: 0.26 });
    } else if (this.type === 'wonder' && env.windowsLit) {
      // 128 piksellik tam çerçeve alt kenara hizalı: ışık noktaları aşamadan bağımsız
      const frameTop = this.y + this.height - WONDER_ART.fullHeight;
      for (const b of WONDER_ART.braziers) {
        const flicker = Math.sin(env.time * 9 + b.x) * 2;
        out.push({ x: this.x + b.x, y: frameTop + b.y, radius: 34 + flicker, color: [255, 160, 70], intensity: 0.85, glow: 0.4 });
      }
      if (this.wonderStage >= 2) {
        for (const w of WONDER_ART.windows) out.push({ x: this.x + w.x, y: frameTop + w.y, radius: 18, color: [255, 200, 110], intensity: 0.65, glow: 0.28 });
      }
      if (this.wonderComplete) {
        // Altın çağ: çan odası tüm vadiyi aydınlatan bir fener gibi parlar (hafifçe nefes alır)
        const pulse = Math.sin(env.time * 1.3) * 8;
        const { radius } = this.definition.wonder.light;
        const bx = this.x + WONDER_ART.beacon.x;
        const by = frameTop + WONDER_ART.beacon.y;
        out.push({ x: bx, y: by, radius: radius + pulse, color: [255, 214, 140], intensity: 0.7, glow: 0.16 });
        out.push({ x: bx, y: by, radius: 34, color: [255, 236, 170], intensity: 0.9, glow: 0.42 }); // fenerin sıcak çekirdeği
      }
    } else if (this.type === 'ancientFountain' && env.windowsLit) {
      // Kadim çeşmenin suyu gece hafif mavi parıldar
      out.push({ x: this.center.x, y: this.center.y, radius: 30, color: [150, 220, 255], intensity: 0.55, glow: 0.35 });
    } else if (this.type === 'cabin' && env.windowsLit) {
      const art = this.homeArt;
      const artTop = this.y + this.height - art.height;
      for (const w of art.windows) {
        out.push({ x: this.x + w.x, y: artTop + w.y, radius: 22, color: [255, 214, 120], intensity: 0.75, glow: 0.3 });
      }
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: this.type,
      tileX: this.tileX,
      tileY: this.tileY,
      tone: this.tone,
      berries: this.berries,
      underConstruction: this.underConstruction,
      buildProgress: this.buildProgress,
      orientation: this.orientation,
      regrowProgress: this.regrowProgress,
      producedToday: this.producedToday,
      meals: this.meals,
      level: this.level,
      condition: this.condition,
      project: this.project,
      craftMode: this.craftMode,
      craft: this.craft,
      excludedWorkers: [...this.excludedWorkers],
      recentWorkers: this.recentWorkers,
      herbs: this.herbs,
      remedies: this.remedies,
      treatedToday: this.treatedToday,
      damaged: this.damaged,
      isDamaged: this.damaged,
      isBurning: this.isBurning,
      fireProgress: this.fireProgress,
      fireWater: this.fireWater,
      damageKind: this.damageKind,
      damagedAt: this.damagedAt,
      wonderStage: this.wonderStage,
      exportThreshold: this.exportThreshold,
      crate: this.crate,
      label: this.label,
      plantedAt: this.plantedAt,
      crop: this.crop,
      sherbet: this.sherbet,
    };
  }
}
