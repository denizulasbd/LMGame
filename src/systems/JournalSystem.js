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
//   19. aşama: social:partyStarted (düğün kutlaması), social:homeFreed (boşalan ev), gossip:spread (yayılan haber)
//   21. aşama: petition:opened / resolved (dilekçeler), revolt:started / ended / raidEnded (isyan ve yağma), relief:given
//   22. aşama: tax:rateChanged / collected (iç vergi), crown:levyNotice / levyPaid / levyFailed (Krallık Vergisi), crown:decree /
//              decreeDelivered / decreeFailed (Kraliyet Fermanları), exodus:started / ended, exodus:leaving, population:left
//   23. aşama: crisis:fireStarted / fireOut / burnedDown (yangın), crisis:raidWarning / raidResolved (haydut baskını), crisis:injured /
//              healed (hafif yaralanma), crisis:repaired, building:mended (nedene göre)
//   25.1: lifeStage:changed (Genç -> Yetişkin, Yetişkin -> Kıdemli Bilge; kutlama cümlesi LifeStageSystem'in kendi üretecinden),
//         lifeStage:retired (çekirdek sakin kuralıyla gönüllü çalışmaya dönen / yeniden emekli olan bilge)
//   25.2: apprentice:enrolled / proud / crafted (ilk çırak işi) / graduated (Yetkin Usta / Kıdemli Kalfa)
// Yazılan her kayıt için 'journal:added' yayınlanır (arayüz okunmamış sayacını günceller).
import { fieldName } from './University.js'; // (32.4)
import { clubName } from './Clubs.js'; // (32.5)
import { CLUB_TEXT, CLUBS } from '../data/clubs.js'; // (32.5)
import { TIERS } from '../data/feast.js';
import { WEATHER_TYPES } from '../data/weather.js';
import { RESOURCES } from '../data/resources.js';
import { EQUIPMENT } from '../data/equipment.js';
import { TRAITS } from '../data/characters.js';
import { describeOffer } from './EventSystem.js';
import { SKILLS } from '../data/skills.js';
import { formatTownTitle } from './TownStatus.js';
import { cargoValue } from './HarborSystem.js';
import { PETITION_KINDS } from '../data/citizens.js';
import { TAX_RATES, DECREE_ITEMS } from '../data/crown.js';
import { genitive, ablative } from '../utils/turkish.js';
import { QUIRKS } from '../data/social.js';
import { ITEMS } from '../data/citizens.js';
import { PROFESSIONS } from '../data/apprenticeship.js';
import { HEIRLOOMS } from '../data/heirloom.js';

// İşlenmiş malların ilk üretimi
const FIRST_GOODS_TEXT = {
  wool: 'Koyun Ağılı\'nda ilk yün kırkıldı: artık paltolar ve çantalar yünden dokunacak',
  iron: 'Demir Madeni\'nden ilk demir cevheri çıktı: zanaatkâr çelik başlı aletler dövebilir',
  bread: 'Fırından ilk sıcak ekmekler çıktı: kasabanın sofrası bereketlendi',
  // (24. aşama) bahçenin ekim tercihi
  flax: 'Bahçeden ilk keten demetleri toplandı: mavi çiçekli liflerden ileride kumaş dokunacak',
  cloth: 'Dokuma Tezgâhı\'ndan ilk top keten kumaş çıktı: terzi tezgâhında kışlık giysiler dikilecek',
  sherbet: 'Şerbethane\'nin mahzeninden ilk fıçı şerbet çıktı: handa kadehler kalkacak',
  hops: 'Bahçeden ilk şerbetçiotu salkımları ve tatlı meyveler toplandı: hanın şerbeti için kokulu bir hasat',
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
        // (29.1) zıt özelliği olmayan ama kimyası tutmayan çiftin atışması
        const why = traits ? `${TRAITS[traits[0]].name} ${a.name}, ${TRAITS[traits[1]].name.toLocaleLowerCase('tr')} ${b.name} ile` : `Kimyası tutmayan ${a.name}, ${b.name} ile`;
        this.log(`${why} atıştı${place ? ` (${place})` : ''}`, 'angry');
      }),
      // (29.2) yas ve teselli
      on('moodlet:mourning', ({ character, whoName }) => this.log(`${character.name}, ${genitive(whoName)} yasını tutuyor`, 'candle')),
      on('moodlet:consoled', ({ by, character, trauma }) => this.log(`${by.name}, ${trauma.key === 'mourning' ? 'yaslı' : trauma.key === 'shaken' ? 'sarsılmış' : 'kalbi kırık'} ${character.name} adlı dostunu teselli etti`, 'handshake')),
      on('chemistry:kindred', ({ a, b }) => this.log(`${a.name} ile ${b.name} arasında ruh ikizi bağı filizlendi`, 'love')),
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
      // (19. aşama) Sosyal yaşam: meydandaki düğün kutlaması, boşalan ev, kasabaya yayılan dedikodu
      on('social:partyStarted', ({ party, guests }) =>
        this.log(`Meydanda düğün kutlaması: ${party.names} için konfetiler havada uçuşuyor${guests.length ? ` (${guests.length} dostu el çırpıyor)` : ''}`, 'ring')
      ),
      on('social:homeFreed', ({ home, a, b }) => this.log(`${a.name} ile ${b.name} ortak evlerine taşındı; ${home.name} boşaldı ve yeni göçmenlere açık`, 'heart')),
      on('gossip:spread', ({ news }) => this.log(`Kasabada dilden dile dolaşıyor: ${news.text}`, 'whisper')),
      // (20. aşama) Altın Çağ
      on('goldenAge:began', ({ master }) =>
        this.log(`Çağ Dönüm Noktası! Ulu Saat Kulesi tamamlandı, kasaba Altın Çağ'a girdi${master ? `; baş usta ${master.name} Tarihçe Kütüğü'ne yazıldı` : ''}`, 'wonder')
      ),
      on('goldenAge:celebrationEnded', ({ attended }) => this.log(`Meydandaki Çağ Kutlaması sona erdi: ${attended} sakin ilk çanı birlikte dinledi`, 'bell')),
      on('goldenAge:gearCast', ({ gears }) => gears === 1 && this.log("Zanaat Atölyesi ilk Kadim Dişli'yi döktü: kulenin mekanizması yolda", 'gears')),
      on('goldenAge:book', ({ books }) => this.log(`Bilgelik Evi'nin kitaplığına antik bir kitap girdi (${books} kitap: araştırmalar +%${books * 5})`, 'book')),
      on('family:madeRoom', ({ character, to }) => this.log(`${character.name}, ailenin büyümesi için başka bir eve (${to.name}) taşındı`, 'heart')),
      on('family:childBorn', ({ child, parents }) => this.log(`${parents[0].name} ve ${parents[1].name} ailesine küçük ${child.name} katıldı`, 'love')),
      on('family:grownUp', ({ character }) => this.log(`${character.name} büyüdü ve kasabanın genç bir sakini oldu`, 'star')),
      // (25.1) Yaşam evreleri
      on('lifeStage:changed', ({ character, from, to }) => {
        if (to === 'elder') this.log(this.state.lifeStages?.lastElderLine ?? `${character.name} artık kasabanın kıdemli bir bilgesi oldu, gençlere yol gösterecek!`, 'book');
        else if (to === 'adult' && from === 'youth') this.log(`${character.name} ${character.age} yaşına bastı: gençliğini geride bırakıp tam bir yetişkin oldu`, 'star');
      }),
      // (25.2) Usta-Çırak
      on('apprentice:enrolled', ({ character, master, building }) =>
        this.log(`${character.name}, ${master ? `${master.name} ustanın yanında ` : ''}${PROFESSIONS[building.type].name} çıraklığına başladı (${building.name})`, 'hammer')
      ),
      on('apprentice:proud', ({ master, apprentice }) => this.log(`${master.name} çırağı ${apprentice.name} ile gurur duyuyor: tezgâhta artık iki kişiler`, 'star')),
      on('apprentice:crafted', ({ character, item }) => {
        if (character.apprenticeship?.crafted === 1) this.log(`Çırak ${character.name} ilk çırak işini çıkardı: ${ITEMS[item].name}`, 'sparkle');
      }),
      on('apprentice:grandmaster', ({ character, profession }) => this.log(`${character.name} Başusta ${PROFESSIONS[profession].master} oldu: çıraklığını kusursuz bitirdi`, 'star')),
      on('apprentice:graduated', ({ character, profession, title, progress }) =>
        this.log(
          title
            ? `${character.name} çıraklığını tamamladı: ${title} ${PROFESSIONS[profession].master} olarak yetişkinliğe adım attı`
            : `${character.name} yetişkin oldu; ${PROFESSIONS[profession].name} çıraklığı %${Math.floor(progress)}'de kaldı (deneyimi ona kaldı)`,
          'star'
        )
      ),
      // (25.5) Aile yadigârları
      on('heirloom:created', ({ character, kind }) => this.log(`${character.name} çantasında bir aile yadigârı taşıyor: ${HEIRLOOMS[kind].name}`, HEIRLOOMS[kind].icon)),
      on('heirloom:passed', ({ from, to, kind, first }) =>
        this.log(first ? `İlk Kuşak Mirası Devredildi: ${from.name} yadigârını (${HEIRLOOMS[kind].name}) ${to.name} adlı mirasçısına teslim etti! Meydanda Kuşak Şöleni` : `${from.name}, ${HEIRLOOMS[kind].name} yadigârını ${to.name} adlı mirasçısına teslim etti`, HEIRLOOMS[kind].icon)
      ),
      on('heirloom:archived', ({ character, kind }) => this.log(`${character.name} köyden ayrılırken ${HEIRLOOMS[kind].name} kasabanın arşivine emanet edildi`, HEIRLOOMS[kind].icon)),
      // (25.4) Aile Kütüğü
      on('lineage:gen2Wedding', ({ a, b, first }) => first && this.log(`Kasabanın 2. Kuşak İlk Düğünü: ${a.name} & ${b.name}! Kasabada doğan kuşak yuva kuruyor`, 'ring')),
      on('lineage:newHome', ({ a, b, home }) => this.log(`${a.name} ve ${b.name} kendi yuvalarını kurdu: boş bir eve (${home.name}) taşınıyorlar`, 'heart')),
      on('lineage:extendedFamily', ({ a, b }) => this.log(`${a.name} ve ${b.name} şimdilik ailenin evinde Geniş Aile olarak yaşıyor`, 'heart')),
      on('lineage:housingPetition', ({ a, b }) => this.log(`${a.name} ve ${b.name} aynı çatı altında yer bulamadı: Belediye Konağı'na Yeni Konut Talebi verdiler`, 'scroll')),
      on('lineage:handover', ({ elder, heir }) => this.log(`Ocak Devri: Kıdemli Bilge ${elder.name} ocağın reisliğini ${heir.name} adlı evladına devretti`, 'heart')),
      // (25.3) Mizaç gelişimi
      on('temperament:developed', ({ character, quirk, origin }) => {
        const name = QUIRKS[quirk].name;
        const text =
          origin.kind === 'family'
            ? `${character.name}, ${genitive(origin.fromName)} izinden gidip ${name} bir mizaçla gençliğe adım attı`
            : origin.kind === 'mentor'
              ? `${character.name}, ustası ${ablative(origin.fromName)} ${name} mizacını kaptı`
              : origin.kind === 'craft'
                ? `${character.name}: ${origin.fromName} çıraklığı ona ${name} mizacı kazandırdı`
                : `${character.name} kendine özgü bir mizaçla büyüdü: ${name}`;
        this.log(text, QUIRKS[quirk].icon);
      }),
      on('lifeStage:retired', ({ character, retired }) =>
        this.log(
          retired
            ? `Kıdemli Bilge ${character.name} yeniden emekliliğin tadını çıkarıyor: kasabada yeterince çalışan el var`
            : `Kıdemli Bilge ${character.name} kasabada çalışan el azalınca gönüllü usta olarak işe döndü`,
          'book'
        )
      ),
      on('equipment:equipped', ({ character, item }) => this.log(`${character.name} ${EQUIPMENT[item].name} kuşandı`, EQUIPMENT[item].icon)),
      on('worker:dismissed', ({ building, character }) => this.log(`${character.name} ${building.name} işinden çıkarıldı`, 'sulk')),
      on('weather:changed', ({ type }) => this.log(WEATHER_TEXT[type] ?? WEATHER_TYPES[type].name, WEATHER_TYPES[type].icon)),
      on('festival:started', ({ venue, festival, fair }) => this.log(fair ? `Şenlik saati: ${festival.name} ${venue.name} başında coşkuyla sürüyor` : festival ? `${festival.name} başladı (${venue.name})` : `Kasaba Şenliği başladı (${venue.name})`, festival?.icon ?? 'note')),
      // 26.1: mevsimlik panayır
      on('fair:prep', ({ fair }) => this.log(fair.start, fair.icon)),
      // 26.3: gezgin konuklar
      on('guest:arrived', ({ guest, def }) => this.log(def.arrive.replace('{name}', guest.name), def.icon)),
      on('guest:left', ({ guest, def, thanks }) => thanks && this.log(def.thanks.replace('{name}', guest.name), def.icon)),
      on('guest:barter', ({ offer }) => this.log(`Nadir takas: ${offer.name} (${offer.text})`, offer.icon)),
      on('feast:set', ({ tier }) => this.log(TIERS[tier].set, TIERS[tier].icon)),
      on('feast:ended', ({ tier, served, total }) => this.log(`${TIERS[tier].name} toplandı: ${served} sakin sofradan pay aldı (${total} ikramın)`, TIERS[tier].icon)),
      on('fair:ended', ({ fair, attendees }) => this.log(`${fair.name} 22:00'de sona erdi; ${attendees.length} sakin kutladı`, fair.icon)),
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
      // (24.3) dış ticaret
      on('trade:shipArrived', ({ ship }) => this.log(`${ship.mode === 'caravan' ? 'Kervan konağa çadır kurdu' : 'Ticaret Gemisi iskeleye demir attı'}: ${ship.contracts.map((c) => RESOURCES[c.resource].name.toLocaleLowerCase('tr')).join(', ')} talep ediliyor`, 'coin')),
      on('trade:contractDone', ({ contract, gold }) => this.log(`İhracat sözleşmesi: ${contract.qty} ${RESOURCES[contract.resource].name.toLocaleLowerCase('tr')} yüklendi, hazineye ${gold} altın girdi`, 'contract')),
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
      on('dilemma:resolved', ({ title, option, auto, label }) => this.log(`${title}: ${label ?? option.label}${auto ? ' (süre doldu)' : ''}`, 'map')),
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
      on('exotic:found', ({ def, source }) => this.log(`${source === 'merchant' ? 'Gezgin tüccardan' : 'Seferden'} ${def.name} geldi`, def.icon)),
      on('inscription:found', ({ inscription, source }) => this.log(`${source === 'ruin' ? 'Onarılan harabenin içinden' : 'Seferden'} kadim bir yazıt çıktı: ${inscription.name}`, 'inscription')),
      on('inscription:decoded', ({ inscription }) => this.log(`Bilge kadim yazıtı çözdü: ${inscription.name} (${inscription.description})`, 'scheme')),
      on('expedition:taleTold', ({ teller, listeners, route }) => this.log(`${teller.name} ${route} Seferi'ni anlattı; ${listeners.length} kişi soluksuz dinledi`, 'adventure')),
      // 21. aşama: vatandaş dilekçeleri, isyan ve yağma, yatıştırma
      on('petition:opened', ({ petition }) => this.log(`Dilekçe · ${petition.name}: "${petition.text}"`, 'scroll')),
      on('petition:resolved', ({ petition, outcome }) => {
        const what = PETITION_KINDS[petition.kind].name;
        if (outcome === 'fulfilled') this.log(`${genitive(petition.name)} dilekçesi karşılandı (${what}): yönetime güven arttı`, 'scroll');
        else if (outcome === 'rejected') this.log(`${genitive(petition.name)} dilekçesi reddedildi (${what})`, 'sulk');
        else this.log(`${genitive(petition.name)} dilekçesi yanıtsız kaldı, süresi doldu (${what})`, 'sulk');
      }),
      on('revolt:started', ({ names, leaderName }) => this.log(`ALARM · İsyan çıktı! ${names.join(', ')} işi bıraktı, meydanda öfkeyle toplanıyor${leaderName ? ` (elebaşı: ${leaderName})` : ''}`, 'torch')), // (29.6) elebaşı
      on('revolt:raidEnded', ({ raid, names }) => {
        const parts = Object.entries(raid.goods).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`);
        if (raid.gold) parts.push(`${raid.gold} altın`);
        if (parts.length) this.log(`ALARM · Yağma: ${names.join(', ')} ${raid.target} yapısını yağmaladı; ${parts.join(', ')} kasaba deposundan yağmacıların çantalarına geçti`, 'loot');
      }),
      on('revolt:ended', ({ hours }) => this.log(`İsyan yatıştı (${hours} saat sürdü); sakinler işlerinin başına döndü`, 'trust')),
      on('relief:given', ({ kind, cost }) => this.log(kind === 'food' ? `Halka acil erzak dağıtıldı (${cost} yiyecek değeri)` : `Halka altın dağıtıldı (${cost} altın)`, kind === 'food' ? 'food' : 'coin')),
      // 22. aşama: iç vergi, Krallık Vergisi, Kraliyet Fermanları, terk ediş
      on('tax:rateChanged', ({ def }) => this.log(`Belediye iç vergiyi değiştirdi: ${def.name}`, def.icon)),
      on('tax:collected', ({ def, gold, goods }) => {
        const units = Object.values(goods).reduce((a, b) => a + b, 0);
        this.log(def.percent ? `İç vergi tahsil edildi (${def.name}): Kasaba Hazinesi'ne +${gold} altın${units ? `, kilere ${units} birim öşür` : ''}` : `${def.name}: bu dönem kimseden vergi alınmadı`, 'coin');
      }),
      on('crown:levyNotice', ({ amount }) => this.log(`Kraliyet Tahsildarı yolda: iki gün sonra Krallık Vergisi ${amount} altın`, 'collector')),
      on('crown:levyPaid', ({ amount, goods }) => this.log(`Krallık Vergisi ödendi (${amount} altın${Object.keys(goods).length ? `; bir kısmı ${Object.entries(goods).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ')} ile` : ''})`, 'collector')),
      on('crown:levyFailed', ({ amount, seized, goods }) => {
        const taken = Object.entries(goods).map(([r, v]) => `${v} ${RESOURCES[r].name.toLocaleLowerCase('tr')}`).join(', ');
        this.log(`ALARM · Krallık Vergisi (${amount} altın) ödenemedi: tahsildar hazinedeki ${seized} altına el koydu${taken ? `, depodan ${taken} çekti` : ''}`, 'collector');
      }),
      on('crown:decree', ({ def }) => this.log(`Kraliyet Fermanı geldi: ${def.name}`, 'decree')),
      on('crown:decreeDelivered', ({ def, gold, item }) => this.log(`Ferman teslim edildi: ${def.name} · Krallık ödülü +${gold} altın${item ? ` ve ${DECREE_ITEMS[item].name}` : ''}`, 'decree')),
      on('crown:decreeFailed', ({ def, outcome, gold, food }) => this.log(`Ferman ${outcome === 'rejected' ? 'reddedildi' : 'yerine getirilmedi'}: ${def.name} · Krallık cezası ${gold} altın${food ? `, ${food} yiyecek` : ''}`, 'decree')),
      on('exodus:started', () => this.log('ALARM · Umut tükendi: sakinler köyü terk etmeyi konuşuyor, göçmenler artık gelmiyor', 'bundle')),
      on('exodus:ended', () => this.log('Kasabaya umut döndü: terk edişler durdu', 'heart')),
      on('exodus:leaving', ({ names }) => this.log(`${names.join(' ve ')} bohçasını topladı, köyü terk etmek için yola çıktı`, 'bundle')),
      on('population:died', ({ character, text, cause }) => this.log(text, cause === 'age' ? 'book' : 'heart')),
      on('venerable:became', ({ character }) => this.log(`${character.name} Saygın Büyük oldu: ocağını ve yadigârını devretti, yatağını gençlere bıraktı`, 'star')),
      on('population:left', ({ character, coins, items, reason }) => reason === 'death' || reason === 'exile' ? null : this.log(`${character.name} kesesindeki ${coins} altın ve çantasındaki ${items} eşyayla köyden temelli ayrıldı. Geride boş bir ev ve hüzün kaldı`, 'bundle')),
      // 12. aşama: Bilgelik Evi, okul, liman ve harika
      on('research:started', ({ research }) => this.log(`Bilgelik Evi'nde araştırma başladı: ${research.name}`, 'book')),
      on('research:completed', ({ research }) => this.log(`Araştırma tamamlandı: ${research.name}`, research.icon)),
      // (32.4) Darülfünun
      on('university:admitted', ({ character, field }) => this.log(`${character.name} Darülfünun'a kabul edildi: ${fieldName(field)} bölümü`, 'book')),
      on('university:graduated', ({ character, field }) => this.log(`${character.name} Darülfünun'u ${fieldName(field)} bölümünden bitirdi`, 'star')),
      // (32.5) Hobi evleri: üyelik, kuruluş, ürünler (buluşmanın kendisi günlüğe yazılmaz: 2 günde bir, çok sık)
      on('club:joined', ({ character, key, reason }) => this.log((reason === 'invited' ? CLUB_TEXT.invited : CLUB_TEXT.joined).replace('{name}', character.name).replace('{club}', clubName(key)), CLUBS[key]?.icon ?? 'heart')),
      on('club:left', ({ character, key, reason, silent }) => !silent && this.log((reason === 'kicked' ? CLUB_TEXT.kicked : CLUB_TEXT.left).replace('{name}', character.name).replace('{club}', clubName(key)), CLUBS[key]?.icon ?? 'heart')),
      on('club:founded', ({ key }) => this.log(`${clubName(key)} kuruldu: ilk üç üyesi buluşmaya hazır`, CLUBS[key]?.icon ?? 'heart')),
      on('club:work', ({ text, key }) => this.log(text, CLUBS[key]?.icon ?? 'heart')),
      on('club:exhibition', ({ text }) => this.log(text, 'star')),
      on('club:fruit', ({ text }) => this.log(text, 'apple')),
      on('university:dropped', ({ character, field, ratio }) => this.log(`${character.name} Darülfünun'u yarım bıraktı (${fieldName(field)}, %${Math.floor((ratio ?? 0) * 100)})`, 'book')),
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
      on('building:mended', ({ building, kind }) => this.log(`${building.name} ${kind === 'fire' ? 'yangın' : kind === 'raid' ? 'baskın' : 'fırtına'} hasarından onarıldı`, 'hammer')),
      // 23. aşama: yangın, haydut baskını, yaralanma
      on('crisis:fireStarted', ({ building, natural }) => this.log(`ALARM · ${building.name} yangın çıktı${natural ? '' : ' (yangın çıkarıldı)'}! Sakinler kovalarla koşuyor`, 'fire')),
      on('crisis:fireOut', ({ building }) => this.log(`${building.name} yangını el birliğiyle söndürüldü; yapı hasar görmedi`, 'bucket')),
      on('crisis:musterCalled', ({ building, responders }) => this.log(`Acil Seferberlik: ${building.name} yangınına ${responders.length} kişi koşturuldu`, 'bucket')),
      on('crisis:musterFatigue', ({ building, helpers }) => this.log(`${building.name} seferberliği bitti: ${helpers.length} kova taşıyıcı aşırı yorgun düştü`, 'sweat')),
      on('tax:rateLocked', ({ minutesLeft }) => this.log(`Vergi Fermanı kilitli: kademe ${Math.ceil(minutesLeft / 60)} saat değişmez`, 'coin')),
      on('crisis:burnedDown', ({ building }) => this.log(`${building.name} söndürülemedi, yanıp hasar gördü (haritadan silinmedi; onarılana kadar çalışmaz)`, 'repair')),
      on('crisis:raidWarning', ({ raid, early }) => this.log(`Ormanda haydut izleri görüldü${early ? ' (Gözcü Kulesi 2 gün önceden haber verdi)' : ''}: baskın bekleniyor`, 'bandit')),
      on('crisis:raidResolved', ({ choice, auto, text }) => this.log(`${choice === 'defend' ? 'Haydutlar püskürtüldü' : choice === 'tribute' ? 'Haydutlara haraç verildi' : 'Haydutlar hazırlıksız yakaladı'}${auto ? ' (karar verilmedi, kendiliğinden)' : ''}: ${text}`, choice === 'defend' ? 'shield' : 'bandit')),
      on('crisis:injured', ({ character, cause }) => this.log(`${character.name} ${cause === 'raid' ? 'haydutlarla çarpışırken' : 'yangını söndürürken'} hafif yaralandı`, 'bandage')),
      on('crisis:healed', ({ character, how }) => this.log(how === 'healer' ? `${character.name}'in yaraları Şifacı Kulübesi'nde sarıldı` : `${character.name}'in yarası kendiliğinden iyileşti`, 'herb')),
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
