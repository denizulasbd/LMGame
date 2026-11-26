// Göçmenlerin kasabaya gelişi: yeni sakini üretir (havuzdan ya da rastgele), boş eve yerleştirir ve
// haritanın kenarındaki yoldan yürüterek getirir. NE ZAMAN geleceğine EventSystem karar verir
// (sabah 08:00, boş yatak + yeterli yiyecek + yüksek refah; bkz. data/town.js -> IMMIGRATION).
import { Character } from '../entities/Character.js';
import { NEED_KEYS } from '../data/characters.js';
import { pickImmigrant, unavailableNames, rememberDeparted } from './Residents.js';

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
    // (33.1) Vefat eden, köyden ayrılan ya da sürgün edilenlerin adı bir süre yeni gelenlere verilmez (state.recentNames)
    this.off = game.events.on('population:left', ({ character } = {}) => {
      if (character?.name) this.state.recentNames = rememberDeparted(this.state.recentNames ?? [], character.name);
    });
  }

  destroy() {
    this.off?.();
  }

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

  /**
   * (33.1) Göçmen: %10 olasılıkla elle yazılmış tanıdık yüzlerden boştaki biri, yoksa yepyeni biri (ad, kişilik ve görünüş büyük havuzdan;
   * kasabadakilerle ve son ayrılanlarla ad çakışmaz). Kararlara şans eklenmez: çeşitlilik yalnızca farklı insanlardan gelir.
   */
  pickResident() {
    return pickImmigrant(this.rng, unavailableNames(this.state));
  }
}
