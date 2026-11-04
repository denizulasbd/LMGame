// Göçmenlerin kasabaya gelişi: yeni sakini üretir (havuzdan ya da rastgele), boş eve yerleştirir ve
// haritanın kenarındaki yoldan yürüterek getirir. NE ZAMAN geleceğine EventSystem karar verir
// (sabah 08:00, boş yatak + yeterli yiyecek + yüksek refah; bkz. data/town.js -> IMMIGRATION).
import { Character } from '../entities/Character.js';
import { compoundName } from '../utils/names.js';
import { RESIDENT_POOL, EXTRA_NAMES, APPEARANCE_PARTS, TRAITS, NEED_KEYS } from '../data/characters.js';
import { clashesWithOwn } from '../ai/TraitProfile.js';

const ARRIVAL_SPACING_MINUTES = 12; // aynı sabah gelenler üst üste yürümesin

export class PopulationSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('../utils/random.js').Random} rng
   */
  constructor(game, world, rng) {
    this.events = game.events;
    this.state = game.state;
    this.world = world;
    this.rng = rng;
  }

  destroy() {}

  /** count kişiyi aralıklı olarak yola çıkarır; gelen sakinleri döndürür. */
  welcomeNewcomers(count) {
    const arrived = [];
    for (let i = 0; i < count; i++) {
      const character = this.spawnNewcomer(i * ARRIVAL_SPACING_MINUTES);
      if (character) arrived.push(character);
    }
    return arrived;
  }

  /**
   * Boş yatağı olan ev (yeni kurulanlar önce dolsun diye sondan aranır). Evli bir çiftin yaşadığı evin
   * boş yatakları çocuklarına kalır: göçmen oraya yerleşmez.
   */
  findHome() {
    const homes = this.world.getCompleted('cabin');
    for (let i = homes.length - 1; i >= 0; i--) {
      const residents = this.world.getResidents(homes[i]);
      if (residents.length < homes[i].capacity && !residents.some((c) => c.married)) return homes[i];
    }
    return null;
  }

  /** @param {number} delayMinutes yola çıkmadan önce kasaba girişinde bekleme süresi */
  spawnNewcomer(delayMinutes = 0) {
    const home = this.findHome();
    const entry = this.world.findEntryTile(this.rng);
    if (!home || !entry) return null;

    const def = this.pickResident();
    const character = new Character({
      ...def,
      needs: Object.fromEntries(NEED_KEYS.map((k) => [k, this.rng.int(60, 90)])),
      homeId: home.id,
    });
    const point = this.world.standPoint(entry.x, entry.y);
    character.x = point.x;
    character.y = point.y;
    character.newcomer = true;
    if (delayMinutes > 0) {
      character.task = { activity: 'wait', phase: 'perform', elapsed: 0, duration: delayMinutes };
      character.activityLabel = 'Kasabanın girişinde soluklanıyor';
    }
    this.state.characters.push(character);

    this.events.emit('population:changed', this.state.characters.length);
    this.events.emit('population:joined', { character });
    this.events.emit('toast', { text: `Yeni bir sakin kasabaya katıldı: ${character.name}!`, tone: 'success', icon: 'heart' });
    return character;
  }

  /** Havuzda henüz kasabada olmayan biri; havuz bittiyse rastgele bir kişi. */
  pickResident() {
    const taken = new Set(this.state.characters.map((c) => c.name));
    const available = RESIDENT_POOL.filter((r) => !taken.has(r.name));
    if (available.length > 0) return structuredClone(this.rng.pick(available));

    const freeNames = EXTRA_NAMES.filter((n) => !taken.has(n));
    const name = freeNames.length ? this.rng.pick(freeNames) : compoundName(this.rng, EXTRA_NAMES, taken);
    // İki özellik; birbirinin zıddı olanlar (Çalışkan ve Uykucu gibi) aynı kişide bulunmaz
    const traitKeys = [];
    for (const key of this.rng.shuffle(Object.keys(TRAITS))) {
      if (traitKeys.length < 2 && !clashesWithOwn(traitKeys, key)) traitKeys.push(key);
    }
    const appearance = Object.fromEntries(Object.entries(APPEARANCE_PARTS).map(([k, options]) => [k, this.rng.pick(options)]));
    return { name, age: this.rng.int(18, 60), traits: traitKeys, appearance };
  }
}
