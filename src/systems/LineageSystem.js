// (25. aşama, 25.4) Aile Kütüğü, yeni evlilikler ve konut mirası.
//
//   Kütük      : her sakinin kuşağı, doğum ebeveynleri, ocağı (familyId) ve çocukları; doğumda (çocuk ilk ebeveyninin ocağını taşır,
//                kuşağı ebeveyninin bir fazlası) ve göçte (yeni ocak) yazılır, yüklemede tutarlı kılınır (Lineage.rebuildLineage).
//   Evlilik    : 19. aşamanın flört ve düğün kuralları aynen geçerlidir; kan bağı engeli artık doğum kaydını da kullanır (ebeveyni
//                köyden ayrılmış kardeşler de evlenemez; RelationshipSystem.canRomance -> closeKin). İlk 2. kuşak düğünü Tarihçe'ye
//                altın harflerle yazılır.
//   Yeni Yuva  : Altın Çağ'da evlenen ve en az biri 2. kuşak olan çift boş bir kulübe varsa oraya taşınır; yoksa aynı evdeyseler ve
//                ev ebeveynlerinden birininse "Geniş Aile" olarak yaşar; ayrı kaldılarsa Belediye Konağı'na "Yeni Konut Talebi" verir.
//   Ocak Devri : Kıdemli Bilge olan ocak reisi evinin reisliğini (sembolik tapu) evli yetişkin çocuğuna devreder.
// Bu sistem KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 30): yalnızca eşit uzaklıktaki boş kulübeler arasında seçer.
// Altın Çağ öncesinde yalnızca kütük verisi yazar (hiçbir sakinin davranışını ya da evini değiştirmez).
// Yayınladığı olaylar: 'lineage:newHome' { a, b, home }, 'lineage:extendedFamily' { a, b, home }, 'lineage:housingPetition' { a, b },
//   'lineage:handover' { elder, heir, home }, 'lineage:gen2Wedding' { a, b, first }.
import { rebuildLineage, openFamily, headOf } from './Lineage.js';
import { developmentOpen } from './Temperament.js';
import { addMemory } from './MemorySystem.js';

export class LineageSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng yalnızca bu sistemin üreteci
   * @param {{ petitions?: import('./PetitionSystem.js').PetitionSystem }} services
   */
  constructor(game, world, rng, { petitions = null } = {}) {
    this.state = game.state;
    this.events = game.events;
    this.world = world;
    this.rng = rng;
    this.petitions = petitions;
    rebuildLineage(this.state);
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('family:childBorn', ({ child, parents }) => this.onBirth(child, parents)),
      on('population:joined', ({ character }) => this.onJoined(character)),
      on('relationship:married', ({ a, b }) => this.onMarried(a, b)),
      on('lifeStage:changed', ({ character, to }) => to === 'elder' && this.onElder(character)),
    ];
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  get lineage() {
    return this.state.lineage;
  }

  onBirth(child, parents) {
    child.parents = parents.map((p) => p.id);
    child.generation = Math.max(...parents.map((p) => p.generation ?? 1)) + 1;
    child.familyId = parents[0].familyId ?? openFamily(this.lineage, parents[0], this.state.time.day);
    child.children = [];
    for (const p of parents) if (!p.children.includes(child.id)) p.children.push(child.id);
  }

  onJoined(c) {
    if (!c || c.role) return;
    if (!Number.isInteger(c.generation)) c.generation = 1;
    if (!c.parents?.length) c.parents = [];
    if (!this.lineage.families[c.familyId]) c.familyId = openFamily(this.lineage, c, this.state.time.day);
    c.children ??= [];
  }

  /** Düğün: 2. kuşak sayacı ve Tarihçe (her zaman, yalnızca veri); Yeni Yuva (yalnızca Altın Çağ'da). */
  onMarried(a, b) {
    if ((a.generation ?? 1) < 2 && (b.generation ?? 1) < 2) return;
    const lineage = this.lineage;
    lineage.gen2Weddings += 1;
    const ch = this.state.chronicle;
    const first = !ch.firstGen2Couple;
    if (first) ch.firstGen2Couple = { a: a.name, b: b.name, ids: [a.id, b.id], day: this.state.time.day, hour: this.state.time.hour, minute: this.state.time.minute };
    this.events.emit('lineage:gen2Wedding', { a, b, first });
    if (developmentOpen(this.state)) this.settle(a, b);
  }

  /** Altın Çağ kuşağının yeni yuvası: boş kulübe > Geniş Aile > Yeni Konut Talebi. */
  settle(a, b) {
    const lineage = this.lineage;
    const empty = this.world.getCompleted('cabin').filter((h) => h.functional && this.world.getResidents(h).length === 0);
    if (empty.length) {
      const from = this.world.getBuilding(a.homeId) ?? this.world.getBuilding(b.homeId);
      const d = (h) => (from ? Math.hypot(h.tileX - from.tileX, h.tileY - from.tileY) : 0);
      const best = Math.min(...empty.map(d));
      const home = this.rng.pick(empty.filter((h) => d(h) === best));
      for (const c of [a, b]) {
        c.homeId = home.id;
        c.relocating = true;
      }
      lineage.newHomes += 1;
      lineage.heads[home.id] = a.generation >= b.generation ? a.id : b.id;
      for (const [x, y] of [[a, b], [b, a]]) addMemory(this.state, x, `${y.name} ile kendi yuvalarını kurdu`, 'heart', { kind: 'home' });
      this.events.emit('lineage:newHome', { a, b, home });
      return 'newHome';
    }
    if (a.homeId !== null && a.homeId === b.homeId) {
      const home = this.world.getBuilding(a.homeId);
      const parentsHere = this.state.characters.some((p) => p.homeId === home?.id && (a.parents.includes(p.id) || b.parents.includes(p.id)));
      if (parentsHere) {
        lineage.extended += 1;
        this.events.emit('lineage:extendedFamily', { a, b, home });
        return 'extended';
      }
      return 'shared';
    }
    lineage.petitions += 1;
    const asker = a.generation >= b.generation ? a : b;
    const p = this.petitions?.open(asker, 'newHome');
    if (p) p.baseline = { ...(p.baseline ?? {}), partnerId: (asker === a ? b : a).id, cabins: this.world.getCompleted('cabin').length };
    this.events.emit('lineage:housingPetition', { a, b, petition: p ?? null });
    return 'petition';
  }

  /** Ocak Devri: Kıdemli Bilge olan reis evinin reisliğini evli yetişkin çocuğuna devreder (aynı evde yaşayan öncelikli). */
  onElder(elder) {
    const home = this.world.getBuilding(elder.homeId);
    if (!home || headOf(this.state, home) !== elder) return;
    const heirs = (elder.children ?? [])
      .map((id) => this.world.getCharacter(id))
      .filter((c) => c && c.married && !c.isChild && c.lifeStage !== 'elder' && !c.emigrating)
      .sort((x, y) => (y.homeId === home.id) - (x.homeId === home.id) || x.id - y.id);
    const heir = heirs[0];
    if (!heir) return;
    this.lineage.heads[home.id] = heir.id;
    this.lineage.handovers += 1;
    addMemory(this.state, heir, `${elder.name} ocağın reisliğini ona devretti`, 'heart', { kind: 'home' });
    addMemory(this.state, elder, `Ocağın reisliğini ${heir.name} adlı evladına devretti`, 'heart', { kind: 'home' });
    this.events.emit('lineage:handover', { elder, heir, home });
  }
}
