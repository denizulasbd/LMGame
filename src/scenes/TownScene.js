// Ana oyun sahnesi: kasaba haritası, yapılar, sakinler, kamera, seçim, yönetim araçları,
// zaman ve atmosfer. Sahne sistemleri doğru sırayla çalıştırır ve her şeyi derinlik
// sırasına göre çizer; oyun kuralları sistemlerde ve yapay zekâdadır.
import { Scene } from './Scene.js';
import { ToolController } from './ToolController.js';
import { CONFIG } from '../config.js';
import { Camera } from '../rendering/Camera.js';
import { DayNightOverlay, getAmbientColor } from '../rendering/DayNightOverlay.js';
import { WeatherEffects } from '../rendering/WeatherEffects.js';
import { FireflyField } from '../rendering/Fireflies.js';
import { RenderQueue } from '../rendering/RenderQueue.js';
import { drawTileCursor, drawAreaCursor } from '../rendering/TileCursor.js';
import { drawJobMarkers } from '../rendering/JobMarkers.js';
import { generateTown } from '../world/WorldGenerator.js';
import { World } from '../world/World.js';
import { captureTerrain, diffTerrain, applyTerrain } from '../world/TerrainSnapshot.js';
import { BUILDINGS } from '../data/buildings.js';
import { fireflyIntensity, isRainActive } from '../data/weather.js';
import { getSeason } from '../data/seasons.js';
import { LeafFall } from '../rendering/SeasonalEffects.js';
import { createStartingResidents } from '../world/residents.js';
import { Building } from '../entities/Building.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { NeedsSystem } from '../systems/NeedsSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { BehaviorSystem } from '../systems/BehaviorSystem.js';
import { StructureSystem } from '../systems/StructureSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { JobSystem } from '../systems/JobSystem.js';
import { ConstructionSystem } from '../systems/ConstructionSystem.js';
import { NatureSystem } from '../systems/NatureSystem.js';
import { PopulationSystem } from '../systems/PopulationSystem.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { RelationshipSystem } from '../systems/RelationshipSystem.js';
import { ConflictSystem } from '../systems/ConflictSystem.js';
import { FamilySystem } from '../systems/FamilySystem.js';
import { CraftingSystem } from '../systems/CraftingSystem.js';
import { JournalSystem } from '../systems/JournalSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { HeatingSystem } from '../systems/HeatingSystem.js';
import { MilestoneSystem } from '../systems/MilestoneSystem.js';
import { TownLevelSystem } from '../systems/TownLevelSystem.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { AnimalSystem } from '../systems/AnimalSystem.js';
import { CivicSystem } from '../systems/CivicSystem.js';
import { DilemmaSystem } from '../systems/DilemmaSystem.js';
import { ResearchSystem } from '../systems/ResearchSystem.js';
import { HarborSystem } from '../systems/HarborSystem.js';
import { LuxurySystem } from '../systems/LuxurySystem.js';
import { StatsSystem } from '../systems/StatsSystem.js';
import { relicMask } from '../systems/Luxury.js';
import { SeasonFestivalSystem } from '../systems/SeasonFestivalSystem.js';
import { MemorySystem } from '../systems/MemorySystem.js';
import { RallySystem } from '../systems/RallySystem.js';
import { CraftsmanshipSystem } from '../systems/CraftsmanshipSystem.js';
import { ExpeditionSystem } from '../systems/ExpeditionSystem.js';
import { LandscapeSystem } from '../systems/LandscapeSystem.js';
import { SocialSystem } from '../systems/SocialSystem.js';
import { WeddingConfetti } from '../rendering/WeddingConfetti.js';
import { GoldenAgeSystem } from '../systems/GoldenAgeSystem.js';
import { ChimeWaves } from '../rendering/ChimeWaves.js';
import { towerOf } from '../systems/GoldenAge.js';
import { PurseSystem } from '../systems/PurseSystem.js';
import { TrustSystem } from '../systems/TrustSystem.js';
import { PetitionSystem } from '../systems/PetitionSystem.js';
import { TaxSystem } from '../systems/TaxSystem.js';
import { CrownSystem } from '../systems/CrownSystem.js';
import { DesertionSystem } from '../systems/DesertionSystem.js';
import { CrisisSystem } from '../systems/CrisisSystem.js';
import { GranarySystem } from '../systems/GranarySystem.js';
import { getFestivalDecorSprite } from '../art/sprites/index.js';
import { SNOWMAN_STAGES } from '../data/festivals.js';
import { TILE_TYPES, TILE_BY_ID, isGround, OBJECT_TYPES } from '../data/tiles.js';
import { JOBS } from '../data/jobs.js';
import { TOWN_NAME_MAX_LENGTH } from '../data/town.js';
import { CHARACTER_NAME_MAX_LENGTH } from '../data/characters.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { FestivalEffects } from '../rendering/FestivalEffects.js';
import { Random } from '../utils/random.js';
import { getSelectionRing, getTargetMarker } from '../art/ui/index.js';

const SIGN_NAME_MAX_LENGTH = 24; // (18. aşama) mahalle tabelasının adı
const FOLLOW_SMOOTHING = 5;      // büyük = kamera karaktere daha çabuk yetişir
const HOVER_REFRESH_SECONDS = 0.5;
const PATH_DOT_SPACING = 5;      // seçili karakterin rota noktaları arası (dünya pikseli)
const PATH_DOT_COLOR = '#fff3b0';
const PATH_DOT_SHADOW = 'rgba(27, 20, 35, 0.55)';

export class TownScene extends Scene {
  /**
   * @param {{ attract?: boolean }} params attract: başlangıç ekranının arkasında yaşayan tanıtım kasabası
   *   (girdi kapalı, kamera kendiliğinden süzülür, hiçbir şey kaydedilmez)
   */
  enter(params = {}) {
    const { state, renderer, events } = this.game;
    this.attract = Boolean(params.attract);
    if (this.attract) {
      state.time.speed = CONFIG.TIME_SPEEDS[0];
      state.time.paused = false;
    }
    const { width, height, generator } = state.map;
    const { map, landmarks, structures } = generateTown(width, height, new Random(state.seed), { biomes: generator >= 2 });
    this.map = map;
    this.baseTerrain = captureTerrain(map); // kayıtta yalnızca bundan farklı karolar saklanır

    // Kayıttan yüklendiyse harita farkları ve yapılar kayıttan gelir, sakinler zaten durumdadır
    const restoring = state.pendingTerrain !== null;
    if (restoring) {
      applyTerrain(map, state.pendingTerrain);
      state.pendingTerrain = null;
      map.occupants.fill(0);
      map.passable.fill(0);
      for (const building of state.buildings) this.occupyFootprint(building);
    } else {
      state.buildings = structures.map((record) => new Building(record));
    }
    this.world = new World(map, state, landmarks);
    if (restoring) this.reattachResidents();
    else state.characters = createStartingResidents(this.world, new Random(state.seed + 1), this.currentHour());

    // Servisler: birbirine ihtiyaç duyan sistemler
    this.timeSystem = new TimeSystem(this.game);
    this.economy = new EconomySystem(this.game, this.world);
    this.jobs = new JobSystem(this.game, this.world);
    this.construction = new ConstructionSystem(this.game, this.world, this.economy, this.jobs, {
      // Kaldırılan toprak yolun altından, harita üretildiğindeki biyom zemini geri gelir
      groundAt: (x, y) => {
        const tile = TILE_BY_ID[this.baseTerrain.tiles[map.index(x, y)]];
        return isGround(tile) ? tile : null;
      },
      // (18. aşama) Oyuncunun döşediği zemin kaldırılınca harita üretildiğindeki zemin geri gelir
      baseTileAt: (x, y) => TILE_BY_ID[this.baseTerrain.tiles[map.index(x, y)]] ?? null,
    });
    this.nature = new NatureSystem(this.game, this.world);
    this.population = new PopulationSystem(this.game, this.world, new Random(state.seed + 3));
    this.townEvents = new EventSystem(this.game, this.world, { population: this.population, economy: this.economy });
    this.audio = new AudioSystem(this.game, this.world, () => {
      const { width, height } = this.game.renderer;
      return this.camera.screenToWorld(width / 2, height / 2);
    });
    this.weather = new WeatherSystem(this.game);
    this.relationships = new RelationshipSystem(this.game, this.world, new Random(state.seed + 5));
    this.conflicts = new ConflictSystem(this.game, this.world, this.relationships, new Random(state.seed + 6));
    this.family = new FamilySystem(this.game, this.world, new Random(state.seed + 7));
    this.social = new SocialSystem(this.game, this.world, new Random(state.seed + 19), { relationships: this.relationships });
    this.crafting = new CraftingSystem(this.game, this.world, this.economy);
    this.health = new HealthSystem(this.game, this.world, new Random(state.seed + 8));
    this.animals = new AnimalSystem(this.game, this.world, new Random(state.seed + 9));
    this.civic = new CivicSystem(this.game, this.world, this.economy);
    this.journal = new JournalSystem(this.game);
    this.research = new ResearchSystem(this.game, this.world, this.economy, new Random(state.seed + 12));
    this.harbor = new HarborSystem(this.game, this.world, this.economy, new Random(state.seed + 13));
    this.luxury = new LuxurySystem(this.game, this.economy);
    this.stats = new StatsSystem(this.game);
    this.seasonFestivals = new SeasonFestivalSystem(this.game, this.world, new Random(state.seed + 14), { attract: this.attract });
    this.memories = new MemorySystem(this.game, this.world, new Random(state.seed + 15));
    // (20. aşama) Altın Çağ: anılardan sonra kurulur (Tarihçe'nin kurucuları ilk sakinlerin anısından çıkarılır)
    this.goldenAge = new GoldenAgeSystem(this.game, this.world, { attract: this.attract });
    this.rally = new RallySystem(this.game);
    this.craftsmanship = new CraftsmanshipSystem(this.game, this.world, this.economy, new Random(state.seed + 16));
    // (21. aşama) Vatandaşlık katmanı: kişisel kese ve çanta, Yönetim Güveni ve isyan, vatandaş dilekçeleri (kendi üreteçleri)
    this.purse = new PurseSystem(this.game, this.world, this.economy, new Random(state.seed + 21));
    this.trust = new TrustSystem(this.game, this.world, { economy: this.economy }, new Random(state.seed + 22), { attract: this.attract });
    this.petitions = new PetitionSystem(this.game, this.world, { economy: this.economy, construction: this.construction, crafting: this.crafting, trust: this.trust }, new Random(state.seed + 23), { attract: this.attract });
    // (22. aşama) Krallık katmanı: iç vergi ve öşür, Krallık Vergisi ve Kraliyet Fermanları, köyü terk etme
    this.tax = new TaxSystem(this.game, this.world, { economy: this.economy, trust: this.trust });
    this.crown = new CrownSystem(this.game, this.world, { economy: this.economy, trust: this.trust }, new Random(state.seed + 24), { attract: this.attract });
    this.desertion = new DesertionSystem(this.game, this.world, { jobs: this.jobs }, new Random(state.seed + 25), { attract: this.attract });
    // (23. aşama) Yönetilebilir krizler: yangın ve itfaiye, haydut baskınları, hasar / tamir, yaralanma (ana üretece dokunmaz)
    this.crisis = new CrisisSystem(this.game, this.world, { economy: this.economy, trust: this.trust, construction: this.construction, social: this.social }, new Random(state.seed + 26), { attract: this.attract });
    // (24. aşama) Tarımsal çeşitlilik: bahçenin ekim tercihi, Ürün Silosu ve silosuz kasabada mahsul bozulması (rastgelelik yok)
    this.granary = new GranarySystem(this.game, this.world, { economy: this.economy });
    this.behavior = new BehaviorSystem(this.game, this.world, new Random(state.seed + 2), {
      citizens: this.purse,
      crisis: this.crisis,
      economy: this.economy,
      jobs: this.jobs,
      relationships: this.relationships,
      crafting: this.crafting,
      health: this.health,
      research: this.research,
    });
    this.saves = new SaveSystem(this.game, {
      captureTerrain: () => diffTerrain(this.baseTerrain, this.map),
      reloadScene: () => this.game.scenes.switchTo('town'),
      attract: this.attract,
    });
    this.milestones = new MilestoneSystem(this.game, this.world, TILE_TYPES.cobble.id);
    this.townLevel = new TownLevelSystem(this.game, this.world, this.economy, { attract: this.attract });
    this.dilemmas = new DilemmaSystem(this.game, this.world, new Random(state.seed + 10), { economy: this.economy, population: this.population }, { attract: this.attract });
    this.expeditions = new ExpeditionSystem(this.game, this.world, { economy: this.economy, health: this.health, dilemmas: this.dilemmas }, new Random(state.seed + 17));

    // Sıra önemlidir: hava, yapı durumu ve kapasite, Bilgelik Evi ve liman durumu, iş temizliği, atölye durumu, ihtiyaç azalması,
    // yürüme, kararlar, ilişkiler (gruplar), atışma / barışma, aile, sonra olaylar, kasaba seviyesi ve doğa
    this.structures = new StructureSystem(this.game, this.world);
    this.landscape = new LandscapeSystem(this.game, this.world, new Random(state.seed + 18));
    this.heating = new HeatingSystem(this.game, this.world, this.economy);
    this.systems = [
      this.weather,
      this.structures,
      this.landscape,
      this.research,
      this.harbor,
      this.economy,
      this.jobs,
      this.crafting,
      new NeedsSystem(this.world),
      this.health,
      new MovementSystem(this.world),
      this.behavior,
      this.crisis,
      this.animals,
      this.relationships,
      this.conflicts,
      this.family,
      this.social,
      this.townEvents,
      this.seasonFestivals,
      this.memories,
      this.goldenAge,
      this.rally,
      this.petitions,
      this.heating,
      this.milestones,
      this.townLevel,
      this.dilemmas,
      this.expeditions,
      this.nature,
    ];

    this.tools = new ToolController(this.game, this.world, { construction: this.construction, jobs: this.jobs });
    this.disposables = [
      this.timeSystem,
      this.construction,
      this.nature,
      this.population,
      this.behavior,
      this.tools,
      this.journal,
      this.saves,
      this.townEvents,
      this.audio,
      this.structures,
      this.heating,
      this.milestones,
      this.relationships,
      this.family,
      this.social,
      this.crafting,
      this.townLevel,
      this.animals,
      this.civic,
      this.dilemmas,
      this.research,
      this.harbor,
      this.luxury,
      this.stats,
      this.seasonFestivals,
      this.memories,
      this.goldenAge,
      this.rally,
      this.craftsmanship,
      this.expeditions,
      this.landscape,
      this.purse,
      this.trust,
      this.petitions,
      this.tax,
      this.crown,
      this.desertion,
      this.crisis,
      this.granary,
    ];

    this.camera = new Camera();
    const size = CONFIG.TILE_SIZE;
    this.camera.centerOn(landmarks.plaza.centerX * size, landmarks.plaza.centerY * size, renderer.width, renderer.height);
    this.camera.clamp(map.pixelWidth, map.pixelHeight, renderer.width, renderer.height);

    this.queue = new RenderQueue();
    this.dayNight = new DayNightOverlay();
    this.weatherFx = new WeatherEffects();
    this.fireflies = new FireflyField(state.seed);
    this.festivalFx = new FestivalEffects();
    this.confetti = new WeddingConfetti(); // (19. aşama) meydandaki düğün kutlaması
    this.ageConfetti = new WeddingConfetti(); // (20. aşama) Çağ Kutlaması
    this.chimeWaves = new ChimeWaves(); // (20. aşama) kule çanının ses dalgaları
    this.leaves = new LeafFall();
    this.animationTime = 0; // görsel animasyonlar için gerçek zaman (oyun duraklasa da akar)

    this.hovered = null;
    this.hoverKey = '';
    this.hoverRefresh = 0;
    this.hoveredCharacterId = null;
    this.selectedId = null;
    this.selectedBuildingId = null;
    this.followId = null;
    this.focusId = null;
    this.cinematic = false; // (13. aşama) fotoğraf modu: arayüz gizli, haritada imleç ve seçim çizilmez

    this.unsubscribers = [
      events.on('goldenAge:chime', () => this.chimeWaves.ring()),
      events.on('ui:setCinematic', (on) => {
        this.cinematic = Boolean(on);
        if (this.cinematic) this.tools.setTool('select');
      }),
      events.on('ui:selectCharacter', (id) => {
        this.select(id);
        this.focusId = id; // listeden seçilince kamera bir kez karaktere kayar
      }),
      events.on('ui:followCharacter', (id) => this.setFollow(id)),
      events.on('ui:selectBuilding', (id) => this.selectBuilding(id)),
      events.on('ui:demolishBuilding', (id) => {
        const building = this.world.getBuilding(id);
        const result = building ? this.construction.demolishAt(building.tileX, building.tileY) : null;
        if (result && !result.ok) events.emit('toast', { text: result.reason, tone: 'warn', icon: 'demolish' });
      }),
      events.on('ui:startProject', (id) => {
        const result = this.construction.startProject(this.world.getBuilding(id));
        if (!result.ok) events.emit('toast', { text: result.reason, tone: 'warn', icon: 'hammer' });
      }),
      events.on('ui:cancelProject', (id) => this.construction.cancelProject(this.world.getBuilding(id))),
      events.on('building:removed', (building) => {
        if (building.id === this.selectedBuildingId) this.selectBuilding(null);
      }),
      // (13. aşama) Sakinin adını değiştirmek: boş ya da başka bir sakinin adıyla aynı olamaz
      events.on('ui:renameCharacter', ({ id, name }) => {
        const c = this.world.getCharacter(id);
        const clean = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, CHARACTER_NAME_MAX_LENGTH);
        if (!c || !clean || clean === c.name) return;
        const taken = state.characters.some((o) => o !== c && o.name.toLocaleLowerCase('tr') === clean.toLocaleLowerCase('tr'));
        if (taken) {
          events.emit('toast', { text: `Kasabada zaten ${clean} adında biri var`, tone: 'warn', icon: 'heart' });
          return;
        }
        const from = c.name;
        c.name = clean;
        c.customName = true;
        events.emit('character:renamed', { character: c, from });
      }),
      // (18. aşama) Mahalle tabelasına ad vermek
      events.on('ui:renameSign', ({ id, name }) => {
        const sign = this.world.getBuilding(id);
        const clean = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, SIGN_NAME_MAX_LENGTH);
        if (!sign || sign.type !== 'signpost' || !clean || clean === sign.label) return;
        const from = sign.label;
        sign.label = clean;
        events.emit('sign:renamed', { building: sign, from, name: clean });
      }),
      events.on('ui:renameTown', (name) => {
        const clean = String(name ?? '').trim().slice(0, TOWN_NAME_MAX_LENGTH);
        if (!clean || clean === state.townName) return;
        state.townName = clean;
        events.emit('town:renamed', { name: clean });
      }),
    ];

    events.emit('camera:zoom', this.camera.zoom);
    events.emit('map:hover', null);
    events.emit('character:selected', null);
    events.emit('building:selected', null);
    events.emit('camera:followChanged', null);
    events.emit('tool:changed', { tool: 'select', buildType: null });
    events.emit(this.attract ? 'title:show' : 'title:hide', {});
  }

  exit() {
    this.unsubscribers?.forEach((off) => off());
    // Olay aboneliği olan her sistem (güncelleme listesindekiler dahil) bir kez temizlenir; listeye eklemeyi
    // unutmak sahne her yeniden kurulduğunda (Yükle / Yeni Harita) dinleyici sızdırırdı.
    const owners = new Set([...(this.disposables ?? []), ...(this.systems ?? [])]);
    for (const system of owners) system?.destroy?.();
    this.unsubscribers = null;
    this.disposables = null;
    this.systems = null;
  }

  /** Kayıttan gelen yapının kapladığı karoları haritada işaretler. */
  occupyFootprint(building) {
    const { w, h } = BUILDINGS[building.type].size;
    for (let y = building.tileY; y < building.tileY + h; y++) {
      for (let x = building.tileX; x < building.tileX + w; x++) this.map.setOccupant(x, y, building.id, Boolean(BUILDINGS[building.type].walkable));
    }
  }

  /** Kayıttan yüklenen sakinlerden içeride olanları binalarına geri yerleştirir; bina yoksa dışarı çıkarır. */
  reattachResidents() {
    for (const character of this.world.characters) {
      if (character.insideBuildingId === null) continue;
      const building = this.world.getBuilding(character.insideBuildingId);
      if (building) {
        building.occupants.add(character.id);
      } else {
        character.insideBuildingId = null;
        character.visible = true;
        character.pose = 'stand';
      }
    }
  }

  currentHour() {
    const { hour, minute } = this.game.state.time;
    return hour + minute / 60;
  }

  // ---------------------------------------------------------------------------
  // Seçim ve takip
  // ---------------------------------------------------------------------------

  select(id) {
    const valid = id !== null && this.world.getCharacter(id) ? id : null;
    if (valid !== null) this.selectBuilding(null);
    if (valid === this.selectedId) return;
    this.selectedId = valid;
    // Başka biri seçilince (ya da seçim kalkınca) eski takip biter
    if (this.followId !== null && this.followId !== valid) this.setFollow(null);
    if (valid === null) this.focusId = null;
    this.game.events.emit('character:selected', valid);
  }

  selectBuilding(id) {
    const valid = id !== null && this.world.getBuilding(id) ? id : null;
    if (valid !== null) this.select(null);
    if (valid === this.selectedBuildingId) return;
    this.selectedBuildingId = valid;
    this.game.events.emit('building:selected', valid);
  }

  setFollow(id) {
    const valid = id !== null && this.world.getCharacter(id) ? id : null;
    if (valid !== null) this.select(valid);
    if (valid === this.followId) return;
    this.followId = valid;
    this.focusId = null;
    this.game.events.emit('camera:followChanged', valid);
  }

  // ---------------------------------------------------------------------------
  // Güncelleme
  // ---------------------------------------------------------------------------

  update(dt) {
    this.animationTime += dt;
    if (this.attract) this.driftCamera();
    else {
      this.handleTimeControls();
      this.handleCamera(dt);
    }

    this.timeSystem.update(dt);
    const tick = this.timeSystem.getTick(dt);
    for (const system of this.systems) system.update(tick);

    const { renderer } = this.game;
    const season = getSeason(this.game.state.time.day);
    this.weatherFx.update(dt, this.game.state.weather, this.camera, renderer, this.map, season.key, tick.gameMinutes);
    if (this.weatherFx.takeLightning()) this.game.events.emit('weather:lightning', {});
    this.leaves.update(dt, season.key === 'autumn', this.camera, renderer, this.map);
    this.fireflies.update(dt, this.map);
    this.audio.update(dt, tick.hour);

    if (this.attract) {
      this.drainInput();
      return;
    }
    // (13. aşama) Fotoğraf modu: kamera ve zaman kullanılır, haritaya tıklamak bir şey seçmez; Esc ya da F çıkar
    if (this.cinematic) {
      if (this.game.input.wasPressed('cancel')) this.game.events.emit('ui:toggleCinematic');
      this.game.input.consumeClick();
      this.game.input.consumeLeftPress();
      this.game.input.consumeLeftRelease();
      this.updateCameraTarget(dt);
      return;
    }
    const hovered = this.hoveredTile();
    const escapeUsed = this.tools.handleKeys();
    this.tools.update(hovered);
    if (!this.tools.isActive) this.handleSelectionInput(escapeUsed);

    this.updateCameraTarget(dt);
    this.updateHover(dt, hovered);
  }

  /** Başlangıç ekranında kamera meydanın çevresinde yavaşça süzülür. */
  driftCamera() {
    const { renderer } = this.game;
    const { plaza } = this.world.landmarks;
    const t = this.animationTime;
    const size = CONFIG.TILE_SIZE;
    this.camera.centerOn(
      plaza.centerX * size + Math.cos(t * 0.045) * 150,
      plaza.centerY * size + Math.sin(t * 0.06) * 90,
      renderer.width,
      renderer.height
    );
    this.camera.clamp(this.map.pixelWidth, this.map.pixelHeight, renderer.width, renderer.height);
  }

  /** Başlangıç ekranında haritaya gelen tıklama ve sürüklemeler yok sayılır. */
  drainInput() {
    const { input } = this.game;
    input.consumeClick();
    input.consumeDrag();
    input.consumeZoomSteps();
    input.consumeLeftPress();
    input.consumeLeftRelease();
  }

  handleTimeControls() {
    const { input, events } = this.game;
    if (input.wasPressed('pause')) events.emit('time:togglePause');
    if (input.wasPressed('toggleJournal')) events.emit('ui:toggleJournal');
    if (input.wasPressed('toggleGoals')) events.emit('ui:toggleGoals');
    if (input.wasPressed('toggleStats')) events.emit('ui:toggleStats');
    if (input.wasPressed('toggleCinematic')) events.emit('ui:toggleCinematic');
    ['speed1', 'speed2', 'speed3'].forEach((action, i) => {
      if (input.wasPressed(action)) events.emit('time:setSpeed', CONFIG.TIME_SPEEDS[i]);
    });
  }

  handleCamera(dt) {
    const { input, renderer } = this.game;
    const camera = this.camera;

    // Klavye: ekranda sabit hızda kaysın diye yakınlaştırmaya bölünür
    const speed = (CONFIG.CAMERA_SPEED * dt) / camera.zoom;
    let manual = false;
    const moves = { left: [-speed, 0], right: [speed, 0], up: [0, -speed], down: [0, speed] };
    for (const [action, [dx, dy]] of Object.entries(moves)) {
      if (input.isDown(action)) {
        camera.move(dx, dy);
        manual = true;
      }
    }

    // Sağ tık sürükleme: harita imleci takip eder
    const drag = input.consumeDrag();
    if (drag.x || drag.y) {
      camera.move(-drag.x / camera.zoom, -drag.y / camera.zoom);
      manual = true;
    }
    // Elle kaydırma takibi bırakır
    if (manual) {
      this.setFollow(null);
      this.focusId = null;
    }

    // Tekerlek imleç etrafında, klavye ekran merkezinde yakınlaştırır
    let zoomSteps = input.consumeZoomSteps();
    if (input.wasPressed('zoomIn')) zoomSteps++;
    if (input.wasPressed('zoomOut')) zoomSteps--;
    if (zoomSteps !== 0) {
      const anchorX = input.mouse.inside && !this.followId ? input.mouse.x : renderer.width / 2;
      const anchorY = input.mouse.inside && !this.followId ? input.mouse.y : renderer.height / 2;
      if (camera.zoomAt(anchorX, anchorY, camera.zoom + zoomSteps)) {
        this.game.events.emit('camera:zoom', camera.zoom);
      }
    }

    camera.clamp(this.map.pixelWidth, this.map.pixelHeight, renderer.width, renderer.height);
  }

  hoveredTile() {
    const tile = this.game.input.getHoveredTile(this.camera);
    return tile && this.map.inBounds(tile.tileX, tile.tileY) ? tile : null;
  }

  /** Seç aracında: karaktere, yoksa yapıya tıklamak onu seçer; boş yere tıklamak seçimi bırakır. */
  handleSelectionInput(escapeUsed) {
    const { input } = this.game;
    if (input.wasPressed('cancel') && !escapeUsed) {
      this.select(null);
      this.selectBuilding(null);
    }

    const click = input.consumeClick();
    if (!click) return;
    const point = this.camera.screenToWorld(click.x, click.y);
    // Gezgin tüccara tıklamak takas penceresini açar
    if (this.world.findVisitorAt(point.x, point.y)) {
      this.game.events.emit('ui:openTrade');
      return;
    }
    // (14. aşama) Kediye / köpeğe tıklamak onu sever: sevinçle zıplar, kalpler uçuşur
    const pet = this.game.state.animals.find((a) => a.hitTest?.(point.x, point.y));
    if (pet) {
      this.game.events.emit('ui:petAnimal', { id: pet.id });
      return;
    }
    const character = this.world.findCharacterAt(point.x, point.y);
    if (character) {
      this.select(character.id);
      return;
    }
    const buildingId = this.map.getOccupant(Math.floor(point.x / CONFIG.TILE_SIZE), Math.floor(point.y / CONFIG.TILE_SIZE));
    if (buildingId) {
      this.selectBuilding(buildingId);
      if (this.world.getBuilding(buildingId)?.open) this.game.events.emit('ui:openTrade');
      return;
    }
    // (14. aşama) Ağaca ya da kayaya tıklamak onu öncelikli kesme / kırma hedefi yapar
    const tx = Math.floor(point.x / CONFIG.TILE_SIZE);
    const ty = Math.floor(point.y / CONFIG.TILE_SIZE);
    const object = this.map.getObject(tx, ty);
    if (object && OBJECT_TYPES[object]?.harvest) {
      const job = this.jobs.prioritize(tx, ty);
      if (job) {
        const verb = job.type === 'chop' ? 'kesilecek' : job.type === 'mine' ? 'kırılacak' : 'toplanacak';
        this.game.events.emit('toast', { text: `Öncelikli hedef: bu ${OBJECT_TYPES[object].name.toLocaleLowerCase('tr')} ilk iş olarak ${verb}; boştaki işçiler koşuyor`, tone: 'info', icon: JOBS[job.type].marker });
      }
      this.select(null);
      this.selectBuilding(null);
      return;
    }
    this.select(null);
    this.selectBuilding(null);
  }

  /** Takip edilen (ya da listeden seçilip odaklanılan) karaktere kamerayı yumuşakça kaydırır. */
  updateCameraTarget(dt) {
    const targetId = this.followId ?? this.focusId;
    if (targetId === null) return;
    const character = this.world.getCharacter(targetId);
    if (!character) {
      this.setFollow(null);
      this.focusId = null;
      return;
    }
    const { renderer } = this.game;
    const viewW = renderer.width / this.camera.zoom;
    const viewH = renderer.height / this.camera.zoom;
    const tx = character.x - viewW / 2;
    const ty = character.y - 8 - viewH / 2;
    const k = 1 - Math.exp(-dt * FOLLOW_SMOOTHING);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
    this.camera.clamp(this.map.pixelWidth, this.map.pixelHeight, renderer.width, renderer.height);

    // Tek seferlik odaklanma hedefe varınca biter
    if (this.focusId !== null && Math.hypot(tx - this.camera.x, ty - this.camera.y) < 1) this.focusId = null;
  }

  updateHover(dt, hovered) {
    const { input, renderer } = this.game;
    const point = input.getWorldPosition(this.camera);
    const visitor = point && !this.tools.isActive ? this.world.findVisitorAt(point.x, point.y) : null;
    const character = visitor ?? (point && !this.tools.isActive ? this.world.findCharacterAt(point.x, point.y) : null);
    const pet = point && !this.tools.isActive && this.game.state.animals.some((a) => a.hitTest?.(point.x, point.y));
    renderer.canvas.classList.toggle('is-pointing', Boolean(character) || Boolean(pet));

    this.hovered = hovered;
    this.hoveredCharacterId = character?.id ?? null;
    this.hoverRefresh -= dt;
    const key = hovered ? `${hovered.tileX},${hovered.tileY},${this.hoveredCharacterId}` : '';
    // Karo değişince ya da yapı durumu (meyve, ateş, inşaat) güncellensin diye arada bir yayınla
    if (key === this.hoverKey && (key === '' || this.hoverRefresh > 0)) return;
    this.hoverKey = key;
    this.hoverRefresh = HOVER_REFRESH_SECONDS;

    let info = hovered ? this.world.getTileInfo(hovered.tileX, hovered.tileY) : null;
    if (info && character) info = { ...info, character: { id: character.id, name: character.name, visitor: Boolean(visitor) } };
    if (info) info.job = this.jobs.jobAt(hovered.tileX, hovered.tileY)?.type ?? null;
    this.game.events.emit('map:hover', info);
  }

  // ---------------------------------------------------------------------------
  // Çizim
  // ---------------------------------------------------------------------------

  render(renderer) {
    const hour = this.timeSystem.getHourFloat();
    const weather = this.game.state.weather;
    const season = getSeason(this.game.state.time.day);
    const freezing = this.game.state.heating.cold; // kışın odun bitti: ocaklar söndü
    // Çizim ortamı kareler arasında yeniden kullanılır (her karede yeni nesne ve küme üretilmez)
    const env = this.renderEnv ?? (this.renderEnv = { sleepingHomes: new Set(), smokingHomes: new Set() });
    env.time = this.animationTime;
    env.hour = hour;
    env.season = season.key;
    env.butterflies = season.butterflies;
    env.windowsLit = hour >= 18.5 || hour < 6.5;
    env.raining = isRainActive(weather);
    env.sleepingHomes.clear();
    env.smokingHomes.clear(); // odun bitince bacalardan duman tütmez
    for (const c of this.world.characters) {
      if (c.isSleeping && c.insideBuildingId) env.sleepingHomes.add(c.insideBuildingId);
      if (!freezing && c.homeId !== null) env.smokingHomes.add(c.homeId);
    }
    env.relics = relicMask(this.game.state); // (13. aşama) Belediye Konağı'nda sergilenen yadigârlar
    // (14. aşama) süren mevsim festivalinin teması (kışın fenerler parıldar, şölen ateşi harlanır)
    env.festivalTheme = this.game.state.events.festival.active ? this.game.state.events.festival.theme ?? null : null;
    const view = this.camera.getViewBounds(renderer.width, renderer.height);

    renderer.applyCamera(this.camera);
    this.map.renderGround(renderer, this.camera, this.animationTime, season.key, { wet: env.raining });
    this.weatherFx.drawGround(renderer);
    if (!this.cinematic) this.drawSelectionGround(renderer);

    // Derinlik sıralı katman: ağaçlar, kayalar, yapılar ve karakterler birlikte sıralanır
    this.map.queueObjects(this.queue, renderer, this.camera, season.key);
    for (const building of this.world.buildings) {
      if (building.isVisible(view)) building.queueDraw(this.queue, env);
    }
    for (const character of this.world.characters) character.queueDraw(this.queue);
    for (const visitor of this.world.visitors) visitor.queueDraw(this.queue);
    for (const animal of this.game.state.animals) animal.queueDraw(this.queue, env);
    for (const boat of this.world.boats ?? []) boat.queueDraw(this.queue, env);
    this.queueFestivalDecor(env);
    this.queue.flush(renderer);

    for (const building of this.world.buildings) building.drawEffects(renderer, env);
    for (const character of this.world.characters) character.drawEffects(renderer, this.animationTime);
    for (const boat of this.world.boats ?? []) boat.drawEffects(renderer, this.animationTime);
    this.leaves.draw(renderer);
    this.weatherFx.drawClouds(renderer, this.camera, weather, this.map, this.animationTime);
    this.weatherFx.drawMist(renderer, this.camera, weather, this.map, this.animationTime);

    const lights = this.lights ?? (this.lights = []);
    lights.length = 0;
    for (const building of this.world.buildings) building.collectLights(lights, env);
    const festivalVenue = this.festivalVenue();
    if (festivalVenue) this.festivalFx.collectLights(lights, festivalVenue, env.festivalTheme, this.game.state.seasonFestival);
    this.dayNight.render(renderer, this.camera, hour, lights, weather, season.tint);

    // Atmosferin üstü: ateşböcekleri, yağmur, balonlar, iş işaretleri, araç önizlemesi ve imleç gece de net görünsün
    renderer.applyCamera(this.camera);
    this.fireflies.draw(renderer, view, fireflyIntensity(weather, hour), this.animationTime, season.fireflies);
    if (festivalVenue) this.festivalFx.draw(renderer, festivalVenue, this.animationTime, env.festivalTheme, this.game.state.seasonFestival);
    const party = this.game.state.social.party;
    if (party && this.game.state.totalMinutes < party.until) this.confetti.draw(renderer, party, this.animationTime, view);
    const ageParty = this.game.state.goldenAge?.celebration;
    if (ageParty && this.game.state.totalMinutes < ageParty.until) this.ageConfetti.draw(renderer, ageParty, this.animationTime, view);
    this.chimeWaves.draw(renderer, towerOf(this.game.state), this.animationTime);
    renderer.resetCamera();
    const daylight = 1 - Math.min(1, getAmbientColor(hour).a / 0.55);
    this.weatherFx.drawRain(renderer, this.camera, weather, daylight);
    this.weatherFx.drawLightning(renderer);
    renderer.applyCamera(this.camera);
    for (const building of this.world.buildings) building.drawOverlay(renderer, env);
    if (!this.cinematic) drawJobMarkers(renderer, this.jobs.jobs, this.animationTime);
    for (const character of this.world.characters) character.drawOverlay(renderer);
    for (const visitor of this.world.visitors) visitor.drawOverlay(renderer);
    for (const animal of this.game.state.animals) animal.drawOverlay(renderer);
    if (this.cinematic) {
      renderer.resetCamera();
      return; // fotoğraf modunda imleç, seçim ve araç önizlemesi çizilmez
    }
    this.drawSelectedBuilding(renderer);

    if (this.tools.isActive) {
      this.tools.render(renderer, env);
    } else if (this.hovered && this.hoveredCharacterId === null) {
      const { tileX, tileY } = this.hovered;
      drawTileCursor(renderer, tileX, tileY, this.animationTime, this.map.isBuildable(tileX, tileY));
    }
    renderer.resetCamera();
  }

  /** (14. aşama) Mevsim festivalinin süslemeleri: çiçek kemerleri, sofralar, hasat sepeti, kardan adam... */
  queueFestivalDecor(env) {
    const sf = this.game.state.seasonFestival;
    if (sf.stage !== 'active') return;
    const elapsed = this.game.state.totalMinutes - (sf.startedAt ?? 0);
    const snowStage = SNOWMAN_STAGES.filter((m) => elapsed >= m).length - 1;
    for (const d of sf.decor) {
      const sprite = getFestivalDecorSprite(d.kind, { frame: Math.floor(env.time * 3), stage: snowStage, season: env.season });
      if (!sprite) continue;
      this.queue.addImage(d.y, sprite, Math.round(d.x - sprite.width / 2), Math.round(d.y - sprite.height + 2));
    }
  }

  /** Şenlik sürüyorsa yapıldığı yer, yoksa null. */
  festivalVenue() {
    const festival = this.game.state.events.festival;
    return festival.active ? this.world.getBuilding(festival.venueId) : null;
  }

  drawSelectedBuilding(renderer) {
    const building = this.selectedBuildingId !== null ? this.world.getBuilding(this.selectedBuildingId) : null;
    if (!building) return;
    const { w, h } = building.definition.size;
    drawAreaCursor(renderer, building.tileX, building.tileY, w, h, this.animationTime, true, false);
  }

  /** Seçili karakterin ayak altı halkası ve gideceği yolun noktalı çizgisi. */
  drawSelectionGround(renderer) {
    const character = this.selectedId !== null ? this.world.getCharacter(this.selectedId) : null;
    if (!character) return;

    const points = character.remainingWaypoints();
    if (points.length > 0) {
      const offset = (this.animationTime * 12) % PATH_DOT_SPACING;
      let travelled = 0;
      let prev = { x: character.x, y: character.y };
      for (const point of points) {
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.hypot(dx, dy);
        const start = (((offset - travelled) % PATH_DOT_SPACING) + PATH_DOT_SPACING) % PATH_DOT_SPACING;
        for (let d = start; d < length; d += PATH_DOT_SPACING) {
          const x = Math.round(prev.x + (dx * d) / length);
          const y = Math.round(prev.y + (dy * d) / length);
          renderer.fillRect(x, y + 1, 1, 1, PATH_DOT_SHADOW); // her zeminde okunsun diye gölgeli
          renderer.fillRect(x, y, 1, 1, PATH_DOT_COLOR);
        }
        travelled += length;
        prev = point;
      }
      const last = points[points.length - 1];
      renderer.drawImage(getTargetMarker(), Math.round(last.x) - 2, Math.round(last.y) - 2);
    }

    if (character.visible) {
      const ring = getSelectionRing(Math.floor(this.animationTime * 2.5));
      renderer.drawImage(ring, Math.round(character.x) - 7, Math.round(character.y) - 3);
    }
  }
}
