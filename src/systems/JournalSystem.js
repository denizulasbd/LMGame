// Kasaba günlüğü: önemli olayları saatiyle GameState.journal'a yazar.
// Olayları kendisi üretmez, yalnızca diğer sistemlerin yayınladıklarını dinler:
//   population:joined, building:completed, building:placed, building:removed,
//   relationship:levelUp, weather:changed, resource:depleted, festival:started / ended,
//   merchant:arrived / left, trade:completed, immigration:blocked, time:seasonChanged,
//   heating:cold / restored, skill:levelUp,
//   9. aşama: relationship:partnered / married / quarrel / reconciled / levelDown, family:homeShared /
//   childBorn / grownUp, equipment:equipped, worker:dismissed
//   10. aşama: goods:firstProduced (ilk yün / demir / ekmek), town:tierUp / tierAssessed (kasaba seviyesi),
//   townHall:balanced (belediyenin erzak dengesi)
// Yazılan her kayıt için 'journal:added' yayınlanır (arayüz okunmamış sayacını günceller).
import { WEATHER_TYPES } from '../data/weather.js';
import { RESOURCES } from '../data/resources.js';
import { EQUIPMENT } from '../data/equipment.js';
import { TRAITS } from '../data/characters.js';
import { describeOffer } from './EventSystem.js';
import { SKILLS } from '../data/skills.js';
import { formatTownTitle } from './TownStatus.js';

// İşlenmiş malların ilk üretimi
const FIRST_GOODS_TEXT = {
  wool: 'Koyun Ağılı\'nda ilk yün kırkıldı: artık paltolar ve çantalar yünden dokunacak',
  iron: 'Demir Madeni\'nden ilk demir cevheri çıktı: zanaatkâr çelik başlı aletler dövebilir',
  bread: 'Fırından ilk sıcak ekmekler çıktı: kasabanın sofrası bereketlendi',
};

const RECONCILE_PLACES = { inn: 'handa', festival: 'şenlikte' };

const WEATHER_TEXT = {
  rainy: 'Yağmur başladı; bahçeler sevinecek.',
  cloudy: 'Gökyüzü bulutlandı.',
  sunny: 'Bulutlar dağıldı, hava açtı.',
};

/** Hazinenin kısa yazımı: "35 odun, 25 taş ve 30 yiyecek". */
function describeLoot(treasure) {
  const parts = Object.entries(treasure).map(([r, v]) => `${v} ${RESOURCES[r].name.toLowerCase()}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} ve ${parts[parts.length - 1]}` : parts[0];
}

export class JournalSystem {
  /** @param {import('../core/Game.js').Game} game */
  constructor(game) {
    this.state = game.state;
    this.events = game.events;
    const on = (name, handler) => game.events.on(name, handler);
    this.unsubscribers = [
      on('population:joined', ({ character }) => this.log(`${character.name} kasabaya katıldı`, 'heart')),
      on('building:placed', ({ building }) => this.log(`${building.name} için şantiye kuruldu`, 'hammer')),
      on('building:completed', (building) => this.log(`${building.name} tamamlandı`, 'hammer')),
      on('building:projectStarted', ({ building, kind }) =>
        this.log(kind === 'repair' ? `${building.name} için onarım başladı` : `${building.name} yükseltiliyor`, 'hammer')
      ),
      on('building:upgraded', ({ building, from }) => this.log(`${from} yükseltildi: artık bir ${building.name}`, 'star')),
      on('ruin:restored', ({ building, from, treasure }) => {
        const loot = treasure && Object.keys(treasure).length ? `; içinden ${describeLoot(treasure)} çıktı` : '';
        this.log(`${from} onarıldı, ${building.name} yeniden hayat buldu${loot}`, 'star');
      }),
      on('building:removed', (building) => {
        if (!building.underConstruction) this.log(`${building.name} yıkıldı`, 'demolish');
      }),
      on('relationship:levelUp', ({ a, b, level }) => {
        if (level.key === 'friend') this.log(`${a.name} ve ${b.name} dost oldu`, 'heart');
        if (level.key === 'bestFriend') this.log(`${a.name} ve ${b.name} yakın arkadaş oldu`, 'heart');
      }),
      on('relationship:levelDown', ({ a, b, level }) => {
        if (level.key === 'dislike') this.log(`${a.name} ile ${b.name} artık birbirinden hoşlanmıyor`, 'sulk');
        if (level.key === 'rival') this.log(`${a.name} ile ${b.name} rakip oldu!`, 'angry');
      }),
      on('relationship:quarrel', ({ a, b, traits, kind, place, firstToday }) => {
        // Yolda karşılaşınca çıkan atışmalar yalnızca balonla görünür; günlüğe iş yeri ve sohbet atışmaları
        if (!firstToday || kind === 'encounter') return;
        const why = `${TRAITS[traits[0]].name} ${a.name}, ${TRAITS[traits[1]].name.toLocaleLowerCase('tr')} ${b.name} ile`;
        this.log(`${why} atıştı${place ? ` (${place})` : ''}`, 'angry');
      }),
      on('relationship:reconciled', ({ a, b, place }) => this.log(`${a.name} ile ${b.name} ${RECONCILE_PLACES[place]} barıştı`, 'heart')),
      on('relationship:partnered', ({ a, b }) => this.log(`${a.name} ile ${b.name} birbirine aşık oldu!`, 'love')),
      on('relationship:married', ({ a, b, venue, festival }) => {
        const where = festival ? 'şenlikte' : venue ? `${venue.name} başında` : 'kasabada';
        this.log(`Düğün var! ${a.name} ile ${b.name} ${where} evlendi`, 'ring');
      }),
      on('family:homeShared', ({ a, b, home, swapped }) => {
        const swap = swapped ? `; ${swapped.name} onların eski evine geçti` : '';
        this.log(`${a.name} ile ${b.name} artık aynı evde (${home.name}) yaşıyor${swap}`, 'heart');
      }),
      on('family:madeRoom', ({ character, to }) => this.log(`${character.name}, ailenin büyümesi için başka bir eve (${to.name}) taşındı`, 'heart')),
      on('family:childBorn', ({ child, parents }) => this.log(`${parents[0].name} ve ${parents[1].name} ailesine küçük ${child.name} katıldı`, 'love')),
      on('family:grownUp', ({ character }) => this.log(`${character.name} büyüdü ve kasabanın genç bir sakini oldu`, 'star')),
      on('equipment:equipped', ({ character, item }) => this.log(`${character.name} ${EQUIPMENT[item].name} kuşandı`, EQUIPMENT[item].icon)),
      on('worker:dismissed', ({ building, character }) => this.log(`${character.name} ${building.name} işinden çıkarıldı`, 'sulk')),
      on('weather:changed', ({ type }) => this.log(WEATHER_TEXT[type] ?? WEATHER_TYPES[type].name, WEATHER_TYPES[type].icon)),
      on('festival:started', ({ venue }) => this.log(`Kasaba Şenliği başladı (${venue.name})`, 'note')),
      on('festival:ended', () => this.log('Şenlik bitti; herkes yarına neşeyle başlayacak', 'sparkle')),
      on('merchant:arrived', ({ name }) => this.log(`${name} kasabaya geldi`, 'sparkle')),
      on('merchant:left', ({ name, nextVisitDay }) => this.log(`${name} ayrıldı; Gün ${nextVisitDay} gibi yine gelir`, 'sparkle')),
      on('trade:completed', ({ offer }) => this.log(`Takas: ${describeOffer(offer)}`, 'sparkle')),
      on('immigration:blocked', ({ reason }) => this.log(`Göçmenler gelmedi: ${reason}`, 'heart')),
      on('time:seasonChanged', ({ season }) => this.log(season.arrival, season.icon)),
      on('heating:cold', () => this.log('Odun bitti! Evler soğudu, sakinler üşüyor', 'cold')),
      on('heating:restored', () => this.log('Ocaklar yeniden yanıyor, evler ısındı', 'fire')),
      on('skill:levelUp', ({ character, skill, level }) => {
        const title = SKILLS[skill].title;
        if (level.level === 3) this.log(`${character.name} artık Usta bir ${title} oldu!`, 'star');
        else this.log(`${character.name} ${SKILLS[skill].name} dalında ${level.name} oldu`, 'star');
      }),
      on('milestone:completed', ({ milestone }) => this.log(`Hedef tamamlandı: ${milestone.name}`, milestone.icon)),
      on('town:legendary', ({ townName }) => this.log(`${townName} efsaneleşti! Kasaba Anıtı göğe yükseldi`, 'star')),
      on('town:renamed', ({ name }) => this.log(`Kasabanın yeni adı: ${name}`, 'heart')),
      on('resource:depleted', ({ resource }) => this.log(`${RESOURCES[resource].name} stoğu tükendi`, RESOURCES[resource].icon)),
      on('goods:firstProduced', ({ resource }) => this.log(FIRST_GOODS_TEXT[resource] ?? `İlk ${RESOURCES[resource].name} üretildi`, RESOURCES[resource].icon)),
      on('town:tierUp', ({ tier, townName }) =>
        this.log(`${townName} büyüdü: artık bir ${tier.name}! ${formatTownTitle(townName, tier)} adını gururla taşıyor`, tier.icon)
      ),
      on('town:tierAssessed', ({ tier, townName }) => this.log(`Kasaba seviyesi belirlendi: ${formatTownTitle(townName, tier)}`, tier.icon)),
      on('townHall:balanced', ({ building, from, to, amount }) =>
        this.log(`${building.name} erzak dengesini sağladı: ${amount} ${RESOURCES[from].name.toLocaleLowerCase('tr')} ambarlardan ${RESOURCES[to].name.toLocaleLowerCase('tr')} ambarına geçti`, RESOURCES[to].icon)
      ),
    ];
    if (this.state.journal.length === 0) this.log('Kasabanın hikâyesi başladı', 'sun');
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
  }

  log(text, icon = null) {
    const entry = this.state.addJournal(text, icon);
    this.events.emit('journal:added', entry);
  }
}
