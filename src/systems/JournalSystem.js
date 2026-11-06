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
//   11. aşama: pet:arrived, health:fellIll / recovered / cured, dilemma:resolved / recruited, storm:struck,
//   expedition:departed / returned, civic:decreed, building:mended
// Yazılan her kayıt için 'journal:added' yayınlanır (arayüz okunmamış sayacını günceller).
import { WEATHER_TYPES } from '../data/weather.js';
import { RESOURCES } from '../data/resources.js';
import { EQUIPMENT } from '../data/equipment.js';
import { TRAITS } from '../data/characters.js';
import { describeOffer } from './EventSystem.js';
import { SKILLS } from '../data/skills.js';
import { formatTownTitle } from './TownStatus.js';
import { cargoValue } from './HarborSystem.js';

// İşlenmiş malların ilk üretimi
const FIRST_GOODS_TEXT = {
  wool: 'Koyun Ağılı\'nda ilk yün kırkıldı: artık paltolar ve çantalar yünden dokunacak',
  iron: 'Demir Madeni\'nden ilk demir cevheri çıktı: zanaatkâr çelik başlı aletler dövebilir',
  bread: 'Fırından ilk sıcak ekmekler çıktı: kasabanın sofrası bereketlendi',
};

// (15. aşama) barışılan yer; 'chat' sohbet edilen herhangi bir yer
const RECONCILE_PLACES = { inn: 'handa ', gazebo: 'çardakta ', campfire: 'ateş başında ', festival: 'şenlikte ', chat: '' };

const WEATHER_TEXT = {
  rainy: 'Yağmur başladı; bahçeler sevinecek.',
  cloudy: 'Gökyüzü bulutlandı.',
  sunny: 'Bulutlar dağıldı, hava açtı.',
  mist: 'Sabah sisi çöktü; nehrin üstünde süzülüyor.',
  thunderstorm: 'Gök gürledi, bardaktan boşanırcasına yağmur başladı!',
};

/** Hazinenin kısa yazımı: "35 odun, 25 taş ve 30 yiyecek". */
function describeLoot(treasure) {
  // (16. aşama) seferden gelen şifalı otlar kaynak değil, Şifacı Kulübesi'nin stoğudur
  const parts = Object.entries(treasure).map(([r, v]) => `${v} ${r === 'herbs' ? 'şifalı ot' : RESOURCES[r]?.name.toLocaleLowerCase('tr') ?? r}`);
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
      // (18. aşama) Fırçayla art arda dikilen çit, saksı ve fidanlar günlüğü doldurmasın
      on('building:placed', ({ building }) => !building.definition.brush && this.log(`${building.name} için şantiye kuruldu`, 'hammer')),
      on('building:completed', (building) => {
        if (!building.definition.wonder && !building.definition.brush) this.log(`${building.name} tamamlandı`, 'hammer'); // harikanın ilk aşaması aşağıda
      }),
      on('sign:renamed', ({ from, name }) => this.log(from ? `${from} tabelasının adı değişti: ${name}` : `Yeni mahalle tabelası: ${name}`, 'signpost')),
      on('tree:grown', ({ building }) => this.log(`${building.name} ulu bir ağaç oldu; gölgesinde dinlenilebilir`, 'flower')),
      on('landscape:aestheticChanged', ({ percent, before }) => {
        if (percent > before) this.log(`Kasaba güzelleşiyor: estetik refaha +%${percent} katıyor`, 'aesthetic');
      }),
      on('building:projectStarted', ({ building, kind }) =>
        this.log(kind === 'upgrade' ? `${building.name} yükseltiliyor` : kind === 'stage' ? `${building.name}: yeni aşamanın inşaatı başladı` : `${building.name} için onarım başladı`, 'hammer')
      ),
      on('building:upgraded', ({ building, from }) => this.log(`${from} yükseltildi: artık bir ${building.name}`, 'star')),
      on('ruin:restored', ({ building, from, treasure }) => {
        const loot = treasure && Object.keys(treasure).length ? `; içinden ${describeLoot(treasure)} çıktı` : '';
        this.log(`${from} onarıldı, ${building.name} yeniden hayat buldu${loot}`, 'star');
      }),
      on('building:removed', (building) => {
        if (!building.underConstruction && !building.definition.brush) this.log(`${building.name} yıkıldı`, 'demolish');
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
      on('relationship:reconciled', ({ a, b, place }) => this.log(`${a.name} ile ${b.name} ${RECONCILE_PLACES[place] ?? ''}barıştı`, 'handshake')),
      // (15. aşama) usta işi eserler
      on('masterwork:created', ({ piece, character }) => this.log(`Usta ${character.name} usta işi bir eser ortaya koydu: ${piece.name}`, piece.icon)),
      on('masterwork:exhibited', ({ piece }) => this.log(`${piece.name} Kasaba Arşivi'nin vitrininde sergilenmeye başladı`, piece.icon)),
      on('masterwork:sold', ({ piece, price, source }) => this.log(`${piece.name} ${source === 'harbor' ? 'limandan ihraç edildi' : 'gezgin tüccara satıldı'}: +${price} altın`, 'coin')),
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
      on('festival:started', ({ venue, festival }) => this.log(festival ? `${festival.name} başladı (${venue.name})` : `Kasaba Şenliği başladı (${venue.name})`, festival?.icon ?? 'note')),
      on('festival:ended', ({ theme } = {}) => !theme && this.log('Şenlik bitti; herkes yarına neşeyle başlayacak', 'sparkle')),
      // 14. aşama: mevsim festivalleri, toplanma zili
      on('seasonFestival:announced', ({ festival }) => this.log(`Duyuru: bugün 15:00'te ${festival.name}`, festival.icon)),
      on('seasonFestival:ended', ({ festival, attendees }) => this.log(`${festival.name} gece yarısı sona erdi; ${attendees.length} sakin kutladı, kasaba yeni mevsime coşkuyla giriyor`, festival.icon)),
      on('rally:rung', () => this.log('Toplanma Zili çaldı; sakinler meydanda toplandı', 'bell')),
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
      on('pet:arrived', ({ animal }) => this.log(`Kasabaya ${animal.name} adında bir ${animal.kind === 'cat' ? 'kedi' : 'köpek'} yerleşti`, 'paw')),
      on('health:fellIll', ({ character }) => this.log(`${character.name} üşüttü; halsiz ve yavaş`, 'sneeze')),
      on('health:recovered', ({ character }) => this.log(`${character.name} iyileşti`, 'heart')),
      on('health:cured', ({ character, wasIll }) =>
        this.log(wasIll ? `${character.name} şifacının iksiriyle iyileşti ve dinçleşti` : `${character.name} şifacıdan dinç çıktı`, 'herb')
      ),
      on('dilemma:resolved', ({ title, option, auto }) => this.log(`${title}: ${option.label}${auto ? ' (süre doldu)' : ''}`, 'map')),
      on('dilemma:recruited', ({ character, skill }) => this.log(`Kafilenin en becerikli üyesi ${character.name}, usta bir ${SKILLS[skill].title}, kasabaya katıldı`, 'heart')),
      on('storm:struck', ({ kind, damaged, safe, winter }) => {
        if (kind === 'wolves') this.log(safe ? 'Kurt sürüsü ağıla yaklaşamadan kovuldu' : 'Kurtlar Koyun Ağılı\'na daldı, ağıl hasar gördü', 'wolf');
        else this.log(safe ? `${winter ? 'Kar fırtınası' : 'Fırtına'} kasabayı hasarsız geçti` : `${winter ? 'Kar fırtınası' : 'Fırtına'} hasar verdi: ${damaged.map((b) => b.name).join(', ')}`, 'storm');
      }),
      on('expedition:departed', ({ members }) => this.log(`${members.map((c) => c.name).join(' ve ')} keşif seferine çıktı`, 'map')),
      on('expedition:returned', ({ members, loot, text, route }) => {
        const got = Object.keys(loot).length ? `: ${describeLoot(loot)}` : '';
        this.log(`${members.map((c) => c.name).join(', ')} ${route ? `${route} Seferi'nden` : 'seferden'} döndü. ${text}${got}`, 'map');
      }),
      // (16. aşama) maceralar, egzotik ganimetler ve kadim yazıtlar
      on('adventure:resolved', ({ scenario, option, success, member }) =>
        this.log(`Maceracı Günlüğü · ${scenario.title}: ${option.label}${success ? '' : ` (${member?.name} ${option.risk.text})`}`, scenario.icon)
      ),
      on('exotic:found', ({ def }) => this.log(`Seferden ${def.name} geldi`, def.icon)),
      on('inscription:found', ({ inscription, source }) => this.log(`${source === 'ruin' ? 'Onarılan harabenin içinden' : 'Seferden'} kadim bir yazıt çıktı: ${inscription.name}`, 'inscription')),
      on('inscription:decoded', ({ inscription }) => this.log(`Bilge kadim yazıtı çözdü: ${inscription.name} (${inscription.description})`, 'scheme')),
      on('expedition:taleTold', ({ teller, listeners, route }) => this.log(`${teller.name} ${route} Seferi'ni anlattı; ${listeners.length} kişi soluksuz dinledi`, 'adventure')),
      // 12. aşama: Bilgelik Evi, okul, liman ve harika
      on('research:started', ({ research }) => this.log(`Bilgelik Evi'nde araştırma başladı: ${research.name}`, 'book')),
      on('research:completed', ({ research }) => this.log(`Araştırma tamamlandı: ${research.name}`, research.icon)),
      on('school:graduated', ({ character, skill }) =>
        this.log(`${character.name} okulda öğrendikleriyle doğrudan Kalfa ${SKILLS[skill].title} olarak başladı`, 'book')
      ),
      on('harbor:cratePrepared', ({ cargo }) => this.log(`Rıhtıma ihracat sandığı hazırlandı (${cargoValue(cargo)} altın değerinde)`, 'boat')),
      on('harbor:grandVoyage', ({ price }) => this.log(`Büyük İhracat Seferi ilan edildi (${price} altın): kervan teknesi yolda`, 'boat')),
      on('harbor:shipped', ({ cargo, gold, bonus, grand }) => {
        if (gold <= 0) return;
        const units = Object.values(cargo).reduce((a, b) => a + b, 0);
        this.log(`${grand ? 'Kervan teknesi (Büyük İhracat Seferi)' : 'Ticaret teknesi'} ${units} birim malı nehirden götürdü: Kasaba Hazinesi'ne +${gold} altın${bonus ? ' · Ticaret Bereketi' : ''}`, 'coin');
      }),
      on('wonder:stageCompleted', ({ building, stage, index }) =>
        this.log(`${building.name}: ${stage.name} aşaması tamamlandı (${index}/${building.definition.wonder.stages.length})`, 'wonder')
      ),
      on('wonder:completed', ({ building, townName }) => this.log(`${building.name} göğe yükseldi! ${townName} altın çağını yaşıyor`, 'star')),
      // 13. aşama: altın ekonomisi, sakin adları ve sabit işçiler
      on('luxury:bought', ({ good, price }) => this.log(`Hazineden ${price} altınla alındı: ${good.name}`, good.icon)),
      on('relic:exhibited', ({ relic, price, count }) => this.log(`${relic.name} Belediye Konağı'nda sergileniyor (${count}. yadigâr, ${price} altın)`, relic.icon)),
      on('goldDecree:issued', ({ decree, price }) => this.log(`Altın fermanı: ${decree.name} (${price} altın)`, decree.icon)),
      on('character:renamed', ({ character, from }) => this.log(`${from} artık ${character.name} adıyla anılıyor`, 'heart')),
      on('worker:pinned', ({ building, character }) => this.log(`${character.name} ${building.name} işine sabitlendi`, 'pin')),
      on('civic:decreed', ({ project }) => this.log(`Belediye fermanı: ${project.name}`, project.icon)),
      on('building:mended', ({ building }) => this.log(`${building.name} fırtına hasarından onarıldı`, 'hammer')),
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
