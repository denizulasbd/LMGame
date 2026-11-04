// (16. aşama) Genişletilmiş keşif: maceracı seferleri, mini maceralar, egzotik ganimetler ve kadim yazıtlar.
//
//   EXPLORATION : seferin başlatılması (Liman ya da Belediye Konağı), süresi, macera sayısı, hikâye anlatma
//   ADVENTURES  : yolda açılan "Maceracı Günlüğü" karar pencereleri. Her seçenek:
//     route    : seçilen yol seferin adını verir ("Karanlık Maden Seferi")
//     risk     : { chance, kind: 'injury' | 'chill', text } kaza olasılığı ve ne olduğu
//     safeWith : kafilede bu meslekte bu kademede (ve tool: Sağlam Aletli) biri varsa risk SIFIRLANIR
//     easeWith : kafilede bu meslekte bu kademede biri varsa risk factor ile çarpılır
//     loot     : başarıda gelen kaynaklar [en az, en çok] (kazada yarısı)
//     finds    : başarıda olasılıkla bulunan egzotik ganimetler { item, chance }
//   EXOTIC_ITEMS: ganimetler (fide ve meşale kasabaya yapı olarak dikilir; harita kendiliğinden işe yarar)
//   INSCRIPTIONS: harabelerden ve seferlerden çıkan kadim yazıtlar; Bilgelik Evi'nde çözülünce kalıcı imar şeması
import { SKILLS } from './skills.js';

export const EXPLORATION = {
  hours: 24, // sefer süresi (oyun saati)
  cost: { food: 30 }, // Liman / Belediye Konağı'ndan düzenlenen seferin erzakı
  partySize: 3, // düzenlenen seferin kafilesi
  cooldownDays: 2, // iki düzenlenmiş sefer arası en az gün
  adventureAt: [0.3, 0.65], // macera pencereleri yolculuğun bu oranlarında açılır (küçük seferde yalnızca ilki)
  retryMinutes: 20, // başka bir karar penceresi açıksa macera bu kadar sonra yeniden denenir
  shardsPerRelic: 3, // bu kadar Kadim Yadigâr Parçası birleşince kasabaya kalıcı bir yadigâr (+refah)
  relicHappiness: 2,
  injuryHours: 18, // kazada yaralanan / üşüyen sakinin hastalık süresi
  // Dönenler 2 gün boyunca akşamları handa (yoksa ateş başında / meydanda) maceralarını anlatır
  tale: { days: 2, tellings: 3, minutes: 40, listenerFun: 8, tellerFun: 5, venues: ['inn', 'innMeal', 'campfire', 'fountain'] },
};

export const ADVENTURES = {
  mountainPass: {
    title: 'Keşif Kafilesi Dağ Geçidinde',
    icon: 'mountain',
    text: 'Ekip dağın ardında sisli bir vadiye ulaştı. Solda çökmek üzere olan eski bir maden girişi, sağda ise yabani bitkilerle kaplı dik bir patika var. Nereye yönelsinler?',
    options: [
      {
        id: 'mine',
        label: 'Maden girişine dal',
        detail: 'Bol demir cevheri, yüksek ihtimalle Kadim Yadigâr Parçası',
        route: 'Karanlık Maden',
        risk: { chance: 0.35, kind: 'injury', text: 'tavandan taş düştü' },
        safeWith: [{ skill: 'mining', level: 3, tool: true, text: 'Sağlam Aletli Usta Madenci' }, { skill: 'masonry', level: 3, tool: true, text: 'Sağlam Aletli Usta Taşçı' }],
        easeWith: [{ skill: 'mining', level: 2, factor: 0.5 }, { skill: 'masonry', level: 2, factor: 0.6 }],
        loot: { iron: [30, 50], stone: [10, 20] },
        finds: [{ item: 'relicShard', chance: 0.7 }, { item: 'inscription', chance: 0.25 }],
      },
      {
        id: 'path',
        label: 'Dik patikadan tırman',
        detail: 'Daha güvenli: Egzotik Üzüm Fidesi ve bol şifalı ot',
        route: 'Sisli Vadi',
        risk: { chance: 0.12, kind: 'chill', text: 'sisin soğuğunda üşüdü' },
        easeWith: [{ skill: 'herbalism', level: 2, factor: 0 }, { skill: 'farming', level: 3, factor: 0.3 }],
        loot: { food: [15, 25], herbs: [6, 10] },
        finds: [{ item: 'vineSeed', chance: 0.75 }],
      },
      {
        id: 'camp',
        label: 'Kamp kur ve gözle',
        detail: 'Risk yok: standart erzakla dönülür',
        route: 'Dağ Geçidi',
        loot: { food: [8, 14], wood: [8, 14] },
        default: true,
      },
    ],
  },
  wildRiver: {
    title: 'Azgın Dere',
    icon: 'river',
    text: 'Kafile köpüren bir derenin kıyısında. Karşı yakada yosun tutmuş taşlardan bir kervan yolu ve yarı gömülü bir sandık seçiliyor. Sular hızlı, köprü yok.',
    options: [
      {
        id: 'raft',
        label: 'Sal çatıp karşıya geç',
        detail: 'Sandıkta Kayıp Şehir Haritası olabilir; sular soğuk',
        route: 'Azgın Dere',
        risk: { chance: 0.3, kind: 'chill', text: 'sal devrildi, buz gibi suya düştü' },
        safeWith: [{ skill: 'woodcutting', level: 3, text: 'Usta Oduncu salı sağlam çattı' }, { skill: 'building', level: 3, text: 'Yapı Ustası salı sağlam çattı' }],
        easeWith: [{ skill: 'fishing', level: 2, factor: 0.4 }],
        loot: { wool: [10, 20], iron: [5, 12] },
        finds: [{ item: 'cityMap', chance: 0.6 }, { item: 'relicShard', chance: 0.3 }],
      },
      {
        id: 'ford',
        label: 'Sığ bir geçit ara',
        detail: 'Biraz ıslanırlar ama balık ve yaban meyvesi bol',
        route: 'Dere Boyu',
        risk: { chance: 0.1, kind: 'chill', text: 'ayakları ıslanıp üşüdü' },
        easeWith: [{ skill: 'fishing', level: 2, factor: 0 }],
        loot: { food: [20, 32] },
        finds: [{ item: 'vineSeed', chance: 0.3 }],
      },
      {
        id: 'camp',
        label: 'Kıyıda kamp kur',
        detail: 'Risk yok: standart erzakla dönülür',
        route: 'Dere Kıyısı',
        loot: { food: [8, 14], wood: [6, 10] },
        default: true,
      },
    ],
  },
  vineTemple: {
    title: 'Sarmaşıklı Tapınak',
    icon: 'temple',
    text: 'Ormanın derinliklerinde sarmaşıklara gömülü bir tapınak buldular. İçeriden mavi bir ışık sızıyor; kapı eşiğinde kadim bir dilde yazılar var. Avluda ise hiç görmedikleri çiçekler açmış.',
    options: [
      {
        id: 'enter',
        label: 'Tapınağa gir',
        detail: 'Kadim Meşale ve kadim yazıt; içeride tuzaklar olabilir',
        route: 'Kayıp Tapınak',
        risk: { chance: 0.3, kind: 'injury', text: 'eski bir tuzağa yakalandı' },
        safeWith: [{ skill: 'scholarship', level: 3, text: 'Usta Bilge yazıları okuyup tuzakları buldu' }],
        easeWith: [{ skill: 'scholarship', level: 2, factor: 0.4 }, { skill: 'masonry', level: 3, factor: 0.5 }],
        loot: { stone: [10, 20] },
        finds: [{ item: 'ancientTorch', chance: 0.8 }, { item: 'inscription', chance: 0.5 }],
      },
      {
        id: 'courtyard',
        label: 'Avludaki çiçekleri topla',
        detail: 'Egzotik çiçek fideleri ve şifalı otlar',
        route: 'Çiçekli Avlu',
        risk: { chance: 0.08, kind: 'chill', text: 'dikenli sarmaşığa takıldı' },
        easeWith: [{ skill: 'herbalism', level: 2, factor: 0 }],
        loot: { herbs: [5, 9], food: [6, 12] },
        finds: [{ item: 'vineSeed', chance: 0.85 }],
      },
      {
        id: 'camp',
        label: 'Uzaktan gözle, kamp kur',
        detail: 'Risk yok: standart erzakla dönülür',
        route: 'Orman Kampı',
        loot: { food: [8, 14], wood: [8, 14] },
        default: true,
      },
    ],
  },
  starryCamp: {
    title: 'Yıldızlı Gecede Işıklar',
    icon: 'firefly',
    text: 'Gece kampında ufukta titreyen mavi ışıklar belirdi. Kafiledeki en yaşlı sakin, eski masallarda kayıp bir şehrin ışıklarından söz edildiğini hatırlıyor.',
    options: [
      {
        id: 'follow',
        label: 'Işıkları takip et',
        detail: 'Kayıp Şehir Haritası ya da Kadim Meşale; karanlıkta yolu şaşırabilirler',
        route: 'Kayıp Şehir',
        risk: { chance: 0.28, kind: 'chill', text: 'gecenin ayazında yolunu kaybetti' },
        safeWith: [{ skill: 'scholarship', level: 3, text: 'Usta Bilge yıldızlardan yön buldu' }],
        easeWith: [{ skill: 'herbalism', level: 3, factor: 0.5 }, { skill: 'husbandry', level: 2, factor: 0.6 }],
        loot: { wool: [6, 12] },
        finds: [{ item: 'cityMap', chance: 0.45 }, { item: 'ancientTorch', chance: 0.4 }, { item: 'inscription', chance: 0.2 }],
      },
      {
        id: 'stories',
        label: 'Ateş başında masal anlat',
        detail: 'Güvenli: kafile dinç ve keyifli döner (sefer anıları güzelleşir)',
        route: 'Yıldızlı Kamp',
        loot: { food: [6, 10] },
        spirit: 15,
        default: true,
      },
    ],
  },
};
export const ADVENTURE_KEYS = Object.keys(ADVENTURES);

/** Seçeneğin risk kuralında geçen meslek adı ("Usta Madenci"). */
export function ruleTitle(rule) {
  const level = rule.level === 3 ? 'Usta' : rule.level === 2 ? 'Kalfa' : 'Çırak';
  return `${level} ${SKILLS[rule.skill]?.title ?? rule.skill}`;
}

// Egzotik ganimetler: dikilebilenler (vineSeed, ancientTorch) inşa menüsünde yapı olarak görünür; harita ve parça
// kendiliğinden işler. herbs ganimeti Şifacı Kulübesi'nin ot stoğuna (yoksa yiyeceğe) girer.
export const EXOTIC_ITEMS = {
  vineSeed: { name: 'Egzotik Üzüm Fidesi', icon: 'vineSeed', building: 'grapeVine', description: 'Sebze Bahçesi ya da Çardak kenarına dikilen bir asma' },
  ancientTorch: { name: 'Kadim Meşale', icon: 'ancientTorch', building: 'ancientTorch', description: 'Geceleri mavi alevle yanan, çevresini ısıtan mistik bir meşale' },
  cityMap: { name: 'Kayıp Şehir Haritası', icon: 'cityMap', description: 'Gezgin tüccar kasabanın yolunu iki kat sık bulur' },
  relicShard: { name: 'Kadim Yadigâr Parçası', icon: 'relicShard', description: '3 parça birleşince kasabaya kalıcı bir yadigâr (+2 refah)' },
};
export const EXOTIC_KEYS = Object.keys(EXOTIC_ITEMS);

// Kadim yazıtlar: harabe onarılınca içinden (ruin: hangi harabeden) ya da seferde bulunur; Bilgelik Evi'nde Bilge
// çalıştıkça çözülür (work, araştırma yoksa sıradaki yazıt). Çözülünce kalıcı imar şeması (effect).
export const INSCRIPTIONS = {
  aqueduct: {
    name: 'Antik Su Kemeri Şeması',
    ruin: 'ancientFountain',
    icon: 'scheme',
    work: 240,
    description: 'Sebze bahçelerinin sulama verimi kalıcı +%15',
    effect: { gardenYield: 1.15 },
  },
  steelCasting: {
    name: 'Kadim Çelik Döküm Tekniği',
    ruin: 'watchtower',
    icon: 'scheme',
    work: 260,
    description: 'Zanaat Atölyesi demiri %20 daha az tüketir',
    effect: { ironSaving: 0.2 },
  },
  millstone: {
    name: 'Kadim Değirmen Taşı',
    ruin: 'supplyCamp',
    icon: 'scheme',
    work: 220,
    description: 'Yel Değirmeni ve Fırın kalıcı %15 daha hızlı ekmek çıkarır',
    effect: { bakeSpeed: 1.15 },
  },
};
export const INSCRIPTION_KEYS = Object.keys(INSCRIPTIONS);

// Üzüm asması: çevresindeki bahçeye verim (en çok iki asma sayılır); varken handa yemek yiyenler üzüm şerbeti içer
export const VINE = { gardenBonus: 0.1, maxPerGarden: 2, sherbetFun: 5, radius: 1 };
