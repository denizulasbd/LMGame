// Arayüz için küçük pixel art parçaları: karo imleci köşeleri, HUD simgeleri,
// konuşma/ifade balonları ve seçili karakter halkası.
import { getSprite, rotateRows, recolorRows, composeRows } from '../PixelSprite.js';

// Sol üst köşe; diğer köşeler döndürülerek elde edilir
const CURSOR_CORNER = [
  'KKKKK',
  'KyyyK',
  'KyKKK',
  'KyK..',
  'KKK..',
];

const CURSOR_TONES = {
  ok: {},             // krem/sarı
  blocked: { y: 'O' }, // turuncu-kırmızı
};

/** dir: 0 sol üst, 1 sağ üst, 2 sağ alt, 3 sol alt. */
export function getCursorCorner(dir, tone = 'ok') {
  return getSprite(`ui:cursor:${tone}:${dir}`, () =>
    rotateRows(recolorRows(CURSOR_CORNER, CURSOR_TONES[tone]), dir)
  );
}

const ICONS = {
  sun: [
    '....Y....',
    '.Y.....Y.',
    '...PPP...',
    '..PPPPP..',
    'Y.PPuPP.Y',
    '..PPPPP..',
    '...PPP...',
    '.Y.....Y.',
    '....Y....',
  ],
  sunset: [
    '....o....',
    '.o.....o.',
    '...OOO...',
    '..OOPOO..',
    'o.OPPPO.o',
    '..OOOOO..',
    'KKKKKKKKK',
    '.KKKKKKK.',
    '.........',
  ],
  moon: [
    '..qqqq...',
    '.quuq....',
    'quuq.....',
    'quu......',
    'quu....u.',
    'quu......',
    'quuq.....',
    '.quuq..u.',
    '..qqqq...',
  ],
};

// Kaynak simgeleri (HUD, inşa menüsü maliyetleri)
Object.assign(ICONS, {
  wood: [
    '.........',
    '..KKKKKK.',
    '.KEXwwwwK',
    'KEXEKwXwK',
    'KXxXKwwwK',
    'KEXEKxxxK',
    '.KKKKKKK.',
    '.........',
    '.........',
  ],
  stone: [
    '.........',
    '...KKKK..',
    '..KqqqrK.',
    '.KqqrrrRK',
    '.KqrrrRRK',
    '.KrrRRRRK',
    '..KKKKKK.',
    '.........',
    '.........',
  ],
  food: [
    '....xg...',
    '..KKxKK..',
    '.KoooooK.',
    '.KouoooK.',
    '.KoooooK.',
    '.KooooUK.',
    '..KoUoK..',
    '...KKK...',
    '.........',
  ],
  // İş işaretleri ve araç çubuğu simgeleri
  axe: [
    '.KKK.....',
    'KqqqK....',
    'KqqqXK...',
    '.KKXwXK..',
    '....KwXK.',
    '.....KwXK',
    '......KwK',
    '.......K.',
    '.........',
  ],
  pickaxe: [
    '..KKKKK..',
    '.KqqqqqK.',
    'KqKKXKKqK',
    'KK.KwK.KK',
    '...KwK...',
    '...KwK...',
    '...KwK...',
    '...KKK...',
    '.........',
  ],
  basket: [
    '..KKKKK..',
    '.K.....K.',
    '.K.mlm.K.',
    'KKKKKKKKK',
    'KXwXwXwXK',
    'KwXwXwXwK',
    '.KXwXwXK.',
    '..KKKKK..',
    '.........',
  ],
  hammer: [
    '.KKKKKKK.',
    'KqqqqrRRK',
    '.KKKwKKK.',
    '...KwK...',
    '...KwK...',
    '...KwK...',
    '...KXK...',
    '...KKK...',
    '.........',
  ],
  select: [
    'K........',
    'KK.......',
    'KuK......',
    'KuuK.....',
    'KuuuK....',
    'KuuuuK...',
    'KuuKKK...',
    'KK.KuK...',
    '....KK...',
  ],
  demolish: [
    'KK.....KK',
    'KoK...KoK',
    '.KoK.KoK.',
    '..KoKoK..',
    '...KoK...',
    '..KoKoK..',
    '.KoK.KoK.',
    'KoK...KoK',
    'KK.....KK',
  ],
});

// Hava durumu ve kasaba günlüğü simgeleri (HUD)
Object.assign(ICONS, {
  cloud: [
    '.........',
    '...KKK...',
    '..KWWWK..',
    '.KWWWWWKK',
    'KWWWWWWWK',
    'KWWqWWWqK',
    '.KqqqqqK.',
    '..KKKKK..',
    '.........',
  ],
  rain: [
    '..KKK....',
    '.KWWWKK..',
    'KWWWWWWK.',
    'KWqWWqWWK',
    '.KKKKKKK.',
    '.c..c..c.',
    'c..c..c..',
    '.c..c..c.',
    'c..c..c..',
  ],
  firefly: [
    '.........',
    '.q.....q.',
    'qqq.K.qqq',
    '.qqKKKqq.',
    '...KKK...',
    '...yPy...',
    '..yPPPy..',
    '...yPy...',
    '....y....',
  ],
  journal: [
    '.........',
    '.KKK.KKK.',
    'KuuuKuuuK',
    'KuKKKuKKK',
    'KuuuKuuuK',
    'KuKKKuKKK',
    'KuuuKuuuK',
    '.KwwKwwK.',
    '..KKKKK..',
  ],
});

// Mevsim, kar ve ustalık yıldızı simgeleri
Object.assign(ICONS, {
  spring: [
    '...pp....',
    '..pppp.u.',
    '.ppPPpuuu',
    '.pPYPp.u.',
    '.ppPPp...',
    '..pppp...',
    '...pg....',
    '....g.gg.',
    '....ggg..',
  ],
  summer: [
    'O...O...O',
    '.O.YYY.O.',
    '..YPPPY..',
    '.YPPuPPY.',
    'OYPPPPPYO',
    '.YPPPPPY.',
    '..YPPPY..',
    '.O.YYY.O.',
    'O...O...O',
  ],
  autumn: [
    '....K....',
    '...K3K...',
    '.KK343KK.',
    'K3334333K',
    '.K33433K.',
    '..K343K..',
    '.K33433K.',
    '..KKwKK..',
    '....w....',
  ],
  winter: [
    '....c....',
    '.c..a..c.',
    '..c.a.c..',
    '...cac...',
    'caaa8aaac',
    '...cac...',
    '..c.a.c..',
    '.c..a..c.',
    '....c....',
  ],
  snow: [
    '..KKK....',
    '.K777KK..',
    'K7777777K',
    'K5775775K',
    '.KKKKKKK.',
    '.8...8...',
    '...8...8.',
    '.8...8...',
    '...8...8.',
  ],
  star: [
    '....K....',
    '...KPK...',
    'KKKKPKKKK',
    'KPPPYPPPK',
    '.KPPPPPK.',
    '..KPPPK..',
    '.KPPKPPK.',
    '.KPK.KPK.',
    '.KK...KK.',
  ],
  starEmpty: [
    '....K....',
    '...KqK...',
    'KKKKqKKKK',
    'Kqqq7qqqK',
    '.KqqqqqK.',
    '..KqqqK..',
    '.KqqKqqK.',
    '.KqK.KqK.',
    '.KK...KK.',
  ],
});

// Ses düğmesi ve refah göstergesi simgeleri
Object.assign(ICONS, {
  sound: [
    '.........',
    '...K...K.',
    '..KK.K..K',
    'KKqK..K.K',
    'KqqK..K.K',
    'KKqK..K.K',
    '..KK.K..K',
    '...K...K.',
    '.........',
  ],
  mute: [
    '.........',
    '...K.....',
    '..KK.o..o',
    'KKqK..oo.',
    'KqqK..oo.',
    'KKqK.o..o',
    '..KK.....',
    '...K.....',
    '.........',
  ],
  smile: [
    '..KKKKK..',
    '.KPPPPPK.',
    'KPPKPKPPK',
    'KPPPPPPPK',
    'KPKPPPKPK',
    'KPPKKKPPK',
    '.KPPPPPK.',
    '..KKKKK..',
    '.........',
  ],
  frown: [
    '..KKKKK..',
    '.KOOOOOK.',
    'KOOKOKOOK',
    'KOOOOOOOK',
    'KOOKKKOOK',
    'KOKOOOKOK',
    '.KOOOOOK.',
    '..KKKKK..',
    '.........',
  ],
  coin: [
    '..KKKKK..',
    '.KPPPPPK.',
    'KPPYYYPPK',
    'KPYPuPYPK',
    'KPYPPPYPK',
    'KPPYYYPPK',
    '.KPPPPPK.',
    '..KKKKK..',
    '.........',
  ],
});

// Kişisel ekipman ve zanaat simgeleri (9. aşama): karakter paneli yuvaları, atölye paneli, meslek
Object.assign(ICONS, {
  // Sağlam Alet: çelik başlı, sapı sarılı çekiç
  sturdyTool: [
    '.KKKKKKK.',
    'KuaqqqqRK',
    'KqqqqqRRK',
    '.KKKwKKK.',
    '...KPK...',
    '...KwK...',
    '...KPK...',
    '...KxK...',
    '...KKK...',
  ],
  // Kalın Kışlık Palto: kürk yakalı, düğmeli
  winterCoat: [
    '..KK.KK..',
    '.KuuKuuK.',
    'KBBuuuBBK',
    'KBnBPBnBK',
    'KBnBBBnBK',
    'KBKBPBKBK',
    'KBKBBBKBK',
    '.K.BnB.K.',
    '...KKK...',
  ],
  // Sırt Çantası: kapaklı deri çanta, askılı
  backpack: [
    '...KKK...',
    '..Kx.xK..',
    '.KKKKKKK.',
    'KXEEEEEXK',
    'KXKKPKKXK',
    'KXXXXXXXK',
    'KwXXXXXwK',
    'KwwwwwwwK',
    '.KKKKKKK.',
  ],
  // Zanaatkârlık: örs
  anvil: [
    '.........',
    'KKKKKKKK.',
    'KuqqqqqqK',
    '.KKrrrrRK',
    '...KrrK..',
    '...KrRK..',
    '..KRRRRK.',
    '.KKKKKKKK',
    '.........',
  ],
});

// 10. aşama: işlenmiş mallar (yün yumağı, demir cevheri, sıcak ekmek) ve kasaba seviyesi armaları
Object.assign(ICONS, {
  // Yün: yumak ve sarkan iplik
  wool: [
    '...KKK...',
    '..KuuuK..',
    '.Kuq6uuK.',
    'Kuq6uq6uK',
    'Ku6uq6uuK',
    'Kuuq6uquK',
    '.Kuu6uuK.',
    '..KKKKKqq',
    '.......q.',
  ],
  // Demir cevheri: pas damarlı kaya parçası
  iron: [
    '.........',
    '...KKKK..',
    '..KrCUqK.',
    '.KrCUCRrK',
    '.KRUCrCUK',
    'KRrCURCRK',
    'KKRRRRRK.',
    '.KKKKKK..',
    '.........',
  ],
  // Ekmek: çizikli kızarmış somun
  bread: [
    '.........',
    '...KKKK..',
    '..KyYYYK.',
    '.KyYXYXYK',
    'KYYXYXYEK',
    'KEYYYYEXK',
    '.KXEEEXK.',
    '..KKKKK..',
    '.........',
  ],
  // (24.3) İhracat sözleşmesi: kırmızı mühürlü parşömen
  contract: [
    '.KKKKKKK.',
    'KSSSSSSSK',
    '.KsKKKsK.',
    '.KSSSSSK.',
    '.KsKKsSK.',
    '.KSSSooK.',
    '.KsKoooK.',
    'KSSSSoSSK',
    '.KKKKKKK.',
  ],
  // (24.2) Kumaş: katlanmış iki top keten kumaş (açık bej, mavi şeritli)
  cloth: [
    '.........',
    '.KKKKKKK.',
    'KSSSSSSSK',
    'KcccccccK',
    'KSSSSSSSK',
    'KzKKKKKzK',
    'KSSSSSSSK',
    'KcccccccK',
    '.KKKKKKK.',
  ],
  // (24.2) Fıçı Şerbeti: demir çemberli küçük ahşap fıçı, kehribar şerbet damlası
  sherbet: [
    '....Y....',
    '..KKKKK..',
    '.KXEXXwK.',
    '.QQQQQQQ.',
    'KXEXXwwxK',
    'KXEXXwwxK',
    '.QQQQQQQ.',
    '.KXEXwwK.',
    '..KKKKK..',
  ],
  // (24. aşama) Keten: mavi çiçekli, iple bağlanmış lif demeti
  flax: [
    '.c.a.c...',
    'cacvcac..',
    '.vVvVv...',
    '..vVv....',
    '..KXK....',
    '..vVv....',
    '.vVvVv...',
    '.v.v.v...',
    '.........',
  ],
  // (24. aşama) Şerbetçiotu: yapraklı dalda koyu yeşil-mor salkım ve tatlı meyve
  hops: [
    '....xx...',
    '...Kx.K..',
    '..KfFKVK.',
    '.KFlfFvK.',
    '.KfmlFK..',
    '.KFlmFK..',
    '..KFfK...',
    '...KK....',
    '.........',
  ],
  // Mezra: çadır
  tierHamlet: [
    '....K....',
    '...KsK...',
    '..KssSK..',
    '.KsszsSK.',
    'KsszKzsSK',
    'KszKxKzsK',
    'KKKKKKKKK',
    '.........',
    '.........',
  ],
  // Köy: kiremit çatılı ev
  tierVillage: [
    '....K....',
    '...KCK...',
    '..KCZCK..',
    '.KCUCUCK.',
    'KKKKKKKKK',
    '.KXwKaXK.',
    '.KwXKXwK.',
    '.KKKKKKK.',
    '.........',
  ],
  // Kasaba: bayraklı, sütunlu konak
  tierTown: [
    '....Koo..',
    '....Ko...',
    '....K....',
    '..KKKKK..',
    '.KPSSSPK.',
    'KKKKKKKKK',
    '.KuKuKuK.',
    '.KuKuKuK.',
    'KKKKKKKKK',
  ],
  // Gelişmiş Şehir: mazgallı kuleler ve altın kapı
  tierCity: [
    'K.K...K.K',
    'KKK.o.KKK',
    'KqK.K.KqK',
    'KqKKKKKqK',
    'KqqqPqqqK',
    'KqKqqqKqK',
    'KqqKPKqqK',
    'KqqKPKqqK',
    'KKKKKKKKK',
  ],
});

// 11. aşama: şifalı ot, iksir, fırtına, kurt, hazine haritası, pati, hasta / dinç sakin
Object.assign(ICONS, {
  herb: [
    '....vV...',
    '...vVv.V.',
    '.Vv.f.vV.',
    '.vVvfvVv.',
    '...vfv...',
    '..V.f.i..',
    '..vvf.ii.',
    '....f.i..',
    '....x....',
  ],
  remedy: [
    '...KKK...',
    '...KEK...',
    '...KxK...',
    '..KcacK..',
    '.KvVvvvK.',
    '.KvVvvvK.',
    '.KvvvvfK.',
    '..KKKKK..',
    '.........',
  ],
  storm: [
    '..KKK....',
    '.KqqqKK..',
    'KqqqqqqK.',
    'KRqRqqRK.',
    '.KKPKKK..',
    '...PP....',
    '..PP.c.c.',
    '...P..c..',
    '....c..c.',
  ],
  wolf: [
    'K.......K',
    'KRK...KRK',
    'KrRKKKRrK',
    'KrrrrrrrK',
    'KrKrrrKrK',
    'KrrrqrrrK',
    '.KrqqqrK.',
    '..KqKqK..',
    '...KKK...',
  ],
  map: [
    '.........',
    'KKKKKKKK.',
    'KSsSSsSK.',
    'KSoS.SsKK',
    'KsSoSSSsK',
    'KSsSoSoSK',
    'KSSsSSsSK',
    '.KKKKKKKK',
    '.........',
  ],
  paw: [
    '.........',
    '.KK...KK.',
    'KXXK.KXXK',
    '.KK.K.KK.',
    '...KXK...',
    '..KXXXK..',
    '.KXXXXXK.',
    '.KXXXXXK.',
    '..KKKKK..',
  ],
  sick: [
    '..KKKKK..',
    '.KaaaaaK.',
    'KaaKaKaaK',
    'KaaaaaaaK',
    'KaKKKKKaK',
    'KaaaaaaaK',
    '.KaaaaaK.',
    '..KKKKK..',
    '.........',
  ],
});

// 12. aşama: Bilgelik Evi (açık kitap), araştırmalar (dişli), liman teknesi, Kasaba Harikası (saat kulesi)
Object.assign(ICONS, {
  book: [
    '.........',
    '.KKK.KKK.',
    'KuuuKuuuK',
    'KuRRKRRuK',
    'KuuuKuuuK',
    'KuRRKRRuK',
    'KuuuKuuuK',
    'KBBBKBBBK',
    '.KKK.KKK.',
  ],
  gears: [
    '...K.K...',
    '..KqKqK..',
    '.KqqqqrK.',
    'KqqKKKrrK',
    '.qrK.KrR.',
    'KqrKKKrRK',
    '.KrrrRRK.',
    '..KRKRK..',
    '...K.K...',
  ],
  boat: [
    '....Koo..',
    '...KK....',
    '..KuK....',
    '.KuuK....',
    'KuuuK....',
    '....K....',
    'KKKKKKKKK',
    '.KXwwwwK.',
    'c.KKKKK.c',
  ],
  wonder: [
    '....P....',
    '...KYK...',
    '..KYPOK..',
    '..KKKKK..',
    '..KuKuK..',
    '..KuuKK..',
    '.KKqqqKK.',
    'KqqKwKqqK',
    'KKKKKKKKK',
  ],
});

// 13. aşama: kasaba yadigârları, lüks mallar, arşiv, sinematik mod ve işçi sabitleme
Object.assign(ICONS, {
  relicSun: [
    '...K.K...',
    '..KYPYK..',
    '.KYuPPOK.',
    'KKPPYPPKK',
    '.KYPPPOK.',
    '..KOPOK..',
    '...KKK...',
    '..KrqrK..',
    '.KKKKKKK.',
  ],
  relicHorn: [
    '......KK.',
    '.....KEK.',
    '....KXEK.',
    '.KKKXXK..',
    'KovPXXK..',
    'KPoXXK...',
    'KvKxK....',
    '.KKK.....',
    '.........',
  ],
  relicSeal: [
    '..KKKKK..',
    '.KoooooK.',
    'KooPPPooK',
    'KoPoooPoK',
    'KoPoPoPoK',
    'KoPoooPoK',
    'KooPPPooK',
    '.KoooooK.',
    '..KKKKK..',
  ],
  relicCompass: [
    '..KKKKK..',
    '.KPqqqPK.',
    'KqqqoqqqK',
    'KqqqoqqqK',
    'KqqqKqqqK',
    'KqqqBqqqK',
    'KqqqBqqqK',
    '.KPqqqPK.',
    '..KKKKK..',
  ],
  relicFlame: [
    '....a....',
    '...aca...',
    '...cuc...',
    '..KcacK..',
    '.KPPPPPK.',
    '..KYYYK..',
    '...KPK...',
    '..KPPPK..',
    '.KKKKKKK.',
  ],
  spice: [
    '..o.x.O..',
    '.KKKKKKK.',
    '.KoOxOoK.',
    'KKKKKKKKK',
    'KXEXXEXXK',
    'KxXXxXXxK',
    'KXEXXEXXK',
    'KxXXxXXxK',
    'KKKKKKKKK',
  ],
  silk: [
    'KKKKKKKKK',
    'KuqKiiipK',
    'KuqKiippK',
    'KuqKipp.K',
    'KuqK.pp..',
    'KuqK..p..',
    'KuqK.....',
    'KrRK.....',
    'KKKK.....',
  ],
  camera: [
    '.........',
    '..KKK....',
    'KKKKKKKKK',
    'KqqKKKqqK',
    'KqKcacKqK',
    'KqKaucKqK',
    'KqqKKKqqK',
    'KKKKKKKKK',
    '.........',
  ],
  chart: [
    'K........',
    'K......P.',
    'K.....PKK',
    'K..P.P.Kc',
    'K.PKP..Kc',
    'K.KcK.KKc',
    'KKKcKKKcc',
    'KccccKccc',
    'KKKKKKKKK',
  ],
  pin: [
    '...KKK...',
    '..KoooK..',
    '..KoOoK..',
    '..KoooK..',
    '...KoK...',
    '..KKKKK..',
    '....K....',
    '....K....',
    '....q....',
  ],
});

// 14. aşama: mevsim festivalleri, toplanma zili, nadir hava olayları
Object.assign(ICONS, {
  blossom: [
    '...pp....',
    '..pupp.p.',
    '.ppPpp.pp',
    '..pppp.v.',
    '...pp.vv.',
    '....fv...',
    '...vf.pp.',
    '..vv.pup.',
    '.....pp..',
  ],
  sunfair: [
    'P...P...P',
    '.P.KKK.P.',
    '..KPPPK..',
    'PKPYYYPKP',
    '.KPYuYPK.',
    '..KPPPK..',
    'o.oKKKo.o',
    'ooo.o.ooo',
    'o...o...o',
  ],
  harvest: [
    '..P.P.P..',
    '.PYPYPYP.',
    '..x.x.x..',
    'KKKKKKKKK',
    'KXEXEXEXK',
    'KEXEXEXEK',
    'KXEXEXEXK',
    '.KXEXEXK.',
    '..KKKKK..',
  ],
  snowman: [
    '...KKK...',
    '..KRRRK..',
    '..K8K8K..',
    '..K8O8K..',
    '.ooooooo.',
    '.K88888K.',
    'K888K888K',
    'K8888888K',
    '.KKKKKKK.',
  ],
  bell: [
    '....K....',
    '...KPK...',
    '..KYPPK..',
    '..KYPPK..',
    '.KYPPPOK.',
    '.KYPPPOK.',
    'KKKKKKKKK',
    '...KYK...',
    '....K....',
  ],
  mist: [
    '.........',
    '.aaaaa...',
    '.........',
    '...aaaaaa',
    '.........',
    'aaaaaa...',
    '.........',
    '..aaaaaa.',
    '.........',
  ],
  thunder: [
    '..KKK....',
    '.KRRRKK..',
    'KRRRRRRK.',
    'KRqRRRqK.',
    '.KKPKKK..',
    '...PP....',
    '..PPc.c..',
    '...P.c...',
    '..P.c..c.',
  ],
});

// (15. aşama) Sosyal denge ve ustalık: barışma, usta işi eser madalyası, altı eser ve zanaat rozetleri
Object.assign(ICONS, {
  handshake: [
    '.........',
    'BB.....oo',
    'BBK...Koo',
    '.KTTtTTK.',
    '.KTtTTtK.',
    '..KTTTK..',
    '...KKK...',
    '.........',
    '.........',
  ],
  masterpiece: [
    '.o.....o.',
    '..o...o..',
    '...o.o...',
    '..KKKKK..',
    '.KPPYPPK.',
    '.KPYuYPK.',
    '.KPPYPPK.',
    '..KYYYK..',
    '...KKK...',
  ],
  mwChest: [
    '.........',
    '.KKKKKKK.',
    'KXEEEEEXK',
    'KwXXPXXwK',
    'KKKKPKKKK',
    'KwXXXXXwK',
    'KwXEPEXwK',
    'KxwwwwwxK',
    '.KKKKKKK.',
  ],
  mwFigure: [
    '...KKK...',
    '..KqqqK..',
    '..KqrqK..',
    '.KKqqqKK.',
    'KqKqrqKqK',
    '..KqqrK..',
    '..KqKqK..',
    '.KRRRRRK.',
    '.KKKKKKK.',
  ],
  mwStatue: [
    '...KKK...',
    '..KaqaK..',
    '..KqRqK..',
    '.KRqqqRK.',
    'KRKqRqKRK',
    '..KRqRK..',
    '..KRKRK..',
    '.KQQQQQK.',
    '.KKKKKKK.',
  ],
  mwLoaf: [
    '.........',
    '...KKK...',
    '.KKEuEKK.',
    'KEXEXEXEK',
    'KXEuEuEXK',
    'KEXEXEXEK',
    '.KXXXXXK.',
    '..KKKKK..',
    '.........',
  ],
  mwRug: [
    'KKKKKKKKK',
    'KoooooooK',
    'KoPPiPPoK',
    'KoPiiiPoK',
    'KoiiuiioK',
    'KoPiiiPoK',
    'KoPPiPPoK',
    'KoooooooK',
    'KKKKKKKKK',
  ],
  mwElixir: [
    '...KKK...',
    '...KxK...',
    '...KaK...',
    '..KaaaK..',
    '.KaHHHaK.',
    'KaHVHHVaK',
    'KaHHVHHaK',
    '.KaHHHaK.',
    '..KKKKK..',
  ],
  badgeBronze: [
    '.oo...BB.',
    '..o..B...',
    '...KKK...',
    '..KXEXK..',
    '.KXEwEXK.',
    '.KEwEwEK.',
    '.KXEwEXK.',
    '..KXEXK..',
    '...KKK...',
  ],
  badgeSilver: [
    '.oo...BB.',
    '..o..B...',
    '...KKK...',
    '..KqaqK..',
    '.KqauaqK.',
    '.KaurraK.',
    '.KqarqaK.',
    '..KqaqK..',
    '...KKK...',
  ],
  badgeGold: [
    '.oo...BB.',
    '..o..B...',
    '...KKK...',
    '..KPYPK..',
    '.KPYuYPK.',
    '.KYuPPYK.',
    '.KPYPYPK.',
    '..KPYPK..',
    '...KKK...',
  ],
});

// (17. aşama) Arayüz: sakinler çekmecesinin sekmesi (iki kişi) ve Ayarlar (dişli)
Object.assign(ICONS, {
  people: [
    '..KK.....',
    '.KTTK.KK.',
    '.KTTKKTTK',
    '..KK.KTTK',
    '.KooK.KK.',
    'KooooKBBK',
    'KooooKBBK',
    'KooooKBBK',
    '.KKKK.KK.',
  ],
  gear: [
    '...KK....',
    '.K.Kq.K..',
    '.KKqqKqK.',
    '..KqRRqK.',
    'KKqR.RqKK',
    '.KqRRqK..',
    '.KqKqqKK.',
    '..K.qK.K.',
    '....KK...',
  ],
});

// (16. aşama) Keşif seferleri: macera sahneleri, egzotik ganimetler, kadim yazıt ve imar şeması
Object.assign(ICONS, {
  mountain: [
    '....K....',
    '...KuK...',
    '..KuuqK..',
    '..KrqrK..',
    '.KrrRrrK.',
    '.KrRrrRK.',
    'KRrrRrrRK',
    'KgggggggK',
    'KKKKKKKKK',
  ],
  river: [
    '.........',
    'gg.....gg',
    'gKbbbbbKg',
    'gKbcbbcKg',
    'gKbbcbbKg',
    'gKcbbbcKg',
    'gKbbcbbKg',
    'gg.....gg',
    '.........',
  ],
  temple: [
    '....K....',
    '...KcK...',
    '..KKKKK..',
    '.KqqqqqK.',
    'KKvKqKvKK',
    '.KqKcKqK.',
    '.KvKcKvK.',
    'KKKKKKKKK',
    'KqqqqqqqK',
  ],
  vineSeed: [
    '...vV....',
    '..vVv.i..',
    '.v.x.iii.',
    '...x..i..',
    '..KKKKK..',
    '.KwXXXwK.',
    '.KXDDDXK.',
    '.KwXXXwK.',
    '..KKKKK..',
  ],
  ancientTorch: [
    '....c....',
    '...cac...',
    '..caWac..',
    '..KcacK..',
    '..KYYYK..',
    '...KrK...',
    '...KcK...',
    '...KrK...',
    '..KKKKK..',
  ],
  cityMap: [
    'KKKKKKKKK',
    'KSssSssSK',
    'KsoSsKsSK',
    'KSsoSsKsK',
    'KsSsoooSK',
    'KSKsSsoSK',
    'KsSsKsSxK',
    'KSssSsxoK',
    'KKKKKKKKK',
  ],
  relicShard: [
    '.........',
    '....K....',
    '...KaK...',
    '..KaucK..',
    '.KacccaK.',
    '..KcicK..',
    '...KcK...',
    '....K....',
    '.........',
  ],
  inscription: [
    '.KKKKKKK.',
    'KqqqqqqqK',
    'KqKqKKqqK',
    'KqqqqqqqK',
    'KqKKqKKqK',
    'KqqqqqqqK',
    'KqKqqKqqK',
    'KqqqqqqqK',
    '.KKKKKKK.',
  ],
  scheme: [
    'KKKKKKKKK',
    'KBBBBBBBK',
    'KBuBBBuBK',
    'KBuBuBuBK',
    'KBuuuuuBK',
    'KBuBBBuBK',
    'KBuBBBuBK',
    'KBBBBBBBK',
    'KKKKKKKKK',
  ],
  adventure: [
    '...K.....',
    '..KuK..P.',
    '.KqrqK.Y.',
    'KrRrrRK..',
    'KKKKKKKK.',
    '..KxxK...',
    '.KxPPxK..',
    '.KxxxxK..',
    '..KKKK...',
  ],
});

// (18. aşama) Serbest imar ve peyzaj: inşa menüsü sekmeleri (yol, çiçek), çit, tabela, estetik
Object.assign(ICONS, {
  road: [
    '.gd...dg.',
    '.gdd.ddg.',
    '..dddddg.',
    '.gdeddeg.',
    '.gddddd..',
    '.gdeqedg.',
    '..dqrqd..',
    '.gdqrqdg.',
    '.gdd.ddg.',
  ],
  flower: [
    '...pp....',
    '..pPPp...',
    '..pPPp.u.',
    '...pp.uPu',
    '....v..u.',
    '.v..v.v..',
    '..v.vv...',
    '..KKKKK..',
    '..KCCCK..',
  ],
  fence: [
    '.K...K...',
    'KuK.KuK.K',
    'KuKKKuKKu',
    'KuqqKuqqu',
    'KuKKKuKKu',
    'KuqqKuqqu',
    'KuK.KuK.K',
    'KuK.KuK.K',
    '.k...k...',
  ],
  signpost: [
    'KKKKKKKK.',
    'KXEEEEXKK',
    'KXwwwwXXK',
    'KKKKKKKK.',
    '...KwK...',
    '...KwK...',
    '...KwK...',
    '..gKwKg..',
    '.gggggg..',
  ],
  aesthetic: [
    '....P....',
    '...PYP...',
    'PPPYuYPPP',
    '.PYuuuYP.',
    '..PYuYP..',
    '.PYP.PYP.',
    '.PP...PP.',
    'P.......P',
    '.........',
  ],
});

// 19. aşama: karakter huyları (Müzisyen'in udu, Doğa Tutkunu'nun yaprağı; Hayvansever pati, Kitap Kurdu kitap simgesini kullanır)
Object.assign(ICONS, {
  lute: [
    '......KK.',
    '.....KXK.',
    '....KwK..',
    '...KwK...',
    '.KKKK....',
    'KXEEXK...',
    'KEKKEK...',
    'KXEEXK...',
    '.KKKK....',
  ],
  leaf: [
    '.......K.',
    '.....KKvK',
    '...KKvVvK',
    '..KvVvvK.',
    '.KvVvvK..',
    '.KvvvK...',
    '.KvKK....',
    '.K.......',
    'K........',
  ],
  // 22. aşama: Kraliyet Tahsildarı (mühürlü kese ve şapka), Kraliyet Fermanı (kırmızı mühürlü rulo), taç, Aslanlı Heykel, bohça
  collector: ['..KKKKK..', '.KnnnnnK.', 'KKKKKKKKK', '...KPK...', '..KdddK..', '.KdeYedK.', 'KddYoYddK', 'KdeeYeedK', '.KKKKKKK.'],
  decree: ['.KKKKKKK.', 'KeSSSSSeK', 'KKSSSSSKK', '.KsKKKsK.', '.KsSSSsK.', '.KsKKoKK.', '.KsSooo.K', 'KeSSoooeK', '.KKKKKKK.'],
  crown: ['.........', 'P...P...P', 'PP.PYP.PP', 'PYPYYYPYP', 'PYYYoYYYP', 'KPPPPPPPK', 'KYYYYYYYK', '.KKKKKKK.', '.........'],
  royalStatue: ['..P.P.P..', '..PYYYP..', '.KOOOOK..', 'KOYPYOKK.', 'KOYYYOYYK', '.KOOOKYYK', '.KKKKKKKK', 'KuuPPPuuK', 'KKKKKKKKK'],
  bundle: ['....K....', '...KoK...', '..KoooK..', '.KoBoBoK.', 'KoBoooBoK', 'KoooBoooK', '.KoBoBoK.', '..KoooK..', '...KKK...'],
  // 21. aşama: dilekçe (parşömen), Yönetim Güveni (kalkan), isyan meşalesi, kişisel kese, hatıra, sokak feneri, yağma çuvalı
  scroll: ['.KKKKKKK.', 'KeSSSSSeK', '.KsSSSSK.', '.KsKKKsK.', '.KsSSSsK.', '.KsKKSsK.', '.KsSSSsK.', 'KeSSSSSeK', '.KKKKKKK.'],
  trust: ['.KKKKKKK.', 'KBBBuBBBK', 'KBBuPuBBK', 'KBBuPuBBK', 'KBuPPPuBK', '.KBuPuBK.', '.KBBuBBK.', '..KBBBK..', '...KKK...'],
  torch: ['...O.O...', '..OPO.O..', '..OPYPO..', '...OPO...', '..KXXXK..', '...KwK...', '...KwK...', '...KwK...', '...KKK...'],
  purse: ['...KKK...', '..KPKPK..', '...KdK...', '..KdddK..', '.KdeYedK.', 'KddYPYddK', 'KdeeYeedK', '.KdddddK.', '..KKKKK..'],
  souvenir: ['..o...o..', '...o.o...', 'KKKKoKKKK', 'KiiioiiiK', 'KKKKoKKKK', '.KiioiiK.', '.KiioiiK.', '.KiioiiK.', '.KKKKKKK.'],
  lantern: ['...KKK...', '..KxxxK..', '..KPYPK..', '..KYPYK..', '..KxxxK..', '...KwK...', '...KwK...', '...KwK...', '..KKKKK..'],
  loot: ['...K.K...', '....K....', '...KXK...', '..KXXXK..', '.KXEXXXK.', 'KXXXEXXXK', 'KXEXXXEXK', '.KXXXXXK.', '..KKKKK..'],
  // 23. aşama: yangın, su kovası, kalkan (Gözcü Kulesi / savunma), haydut, bandaj (hafif yaralı) ve tamir
  fire: ['....o....', '...oO....', '..ooOo...', '..oOPOo..', '.ooOPPOo.', '.oOPyPPo.', '.oOPyyPo.', '..oOPPo..', '...ooo...'],
  bucket: ['..KKKKK..', '.K.....K.', 'KKKKKKKKK', 'KcaWcacaK', '.KwXwXwK.', '.KwXwXwK.', '.KrrrrrK.', '.KwXwXwK.', '..KKKKK..'],
  shield: ['KKKKKKKKK', 'KbbbPbbbK', 'KbbbPbbbK', 'KPPPPPPPK', 'KbbbPbbbK', '.KbbPbbK.', '.KbbPbbK.', '..KbbbK..', '...KKK...'],
  bandit: ['...KKK...', '..KxxxK..', 'KKKxxxKKK', '.KsssssK.', '.KuKKKuK.', '.KKKKKKK.', '.KoooooK.', '..KoooK..', '...KKK...'],
  bandage: ['.........', '.........', '.KKKKKKK.', 'KSSSSSSSK', 'KSsKsKsSK', 'KSSSSSSSK', '.KKKKKKK.', '.........', '.........'],
  repair: ['.KKKKKKK.', 'KqqqqrRRK', '.KKKwKKK.', '...KwK..o', '...KwK.o.', '...KwKo..', '...KXK.o.', '...KKK..o', '.........'],
});

// (25.3) Yeni nesil huyların rozetleri: Zanaatkâr Ruhu (çekiç ve örs), Girişimci Kanı (sikkeli kese), Bilge Düşünür (baykuş),
// Şenlik Neşesi (köpüklü kadeh ve konfeti)
Object.assign(ICONS, {
  quirkCraft: ['.KKKK....', '.KqqqKK..', '.KKKKwK..', '....KwK..', 'KKKKKKwK.', 'KqqqqqKK.', '.KKqqKK..', '..KrrrK..', '.KKKKKKK.'],
  quirkTrade: ['...KKK...', '..KPYPK..', '...KKK...', '.KKwwwKK.', 'KwXXXXXwK', 'KXXKPKXXK', 'KXXPYPXXK', '.KXXKXXK.', '..KKKKK..'],
  quirkSage: ['.K.....K.', '.KK...KK.', 'KwwKKKwwK', 'KuKuwuKuK', 'KwuwwwuwK', '.KwwPwwK.', '.KXwwwXK.', '..KXXXK..', '..PK.KP..'],
  quirkFestive: ['p..P..i..', '..o..c...', '.KKKKKK..', '.KyyyyK.p', '.KOOOOK..', '..KOOK.P.', '...KK....', '...KK....', '..KKKK...'],
});

// (25.5) Aile yadigârları: altın çerçeveli, eski ve değerli görünümlü
Object.assign(ICONS, {
  heirloomHammer: ['PKKKKP...', 'KqqqqKK..', 'KKKKKwK..', 'P...KwK..', '....KwK..', '....KwK..', '....KXK..', '...KYYK..', 'P..KKKK.P'],
  heirloomShuttle: ['P.......P', '.KKKKKKK.', 'KXEEEEEXK', 'KwKpppKwK', 'KXEEEEEXK', '.KKKKKKK.', '...KpK...', '..KpK....', 'P.KK....P'],
  heirloomCompass: ['P.KKKKK.P', '.KYPPPYK.', 'KYPuoPPYK', 'KPPKoPPPK', 'KPPPKPPPK', 'KPPPbKPPK', 'KYPPPbPYK', '.KYPPPYK.', 'P.KKKKK.P'],
  heirloomYeast: ['P.KKKKK.P', '..KxxxK..', '.KKKKKKK.', 'KaWWWWWaK', 'KaSSsSSaK', 'KasSSsSaK', 'KaSSSSSaK', '.KaaaaaK.', 'P.KKKKK.P'],
  heirloomTrowel: ['P......KP', '......KwK', '.....KwK.', '..KKKwK..', '.KqqqKK..', 'KqqqqqK..', 'KrqqqqK..', '.KrrrK...', 'P.KKK...P'],
  heirloomJournal: ['P.......P', '.KKKKKKK.', 'KoPooooPK', 'KoPoYYoPK', 'KoPoYYoPK', 'KoPooooPK', 'KoPooooPK', '.KKKKKKK.', 'P.......P'],
});

/** Dünyada (canvas) çizilecek simge: iş işaretleri, kaynak simgeleri. */
export function getIconSprite(name) {
  return getSprite(`ui:icon:${name}`, ICONS[name]);
}

// ---------------------------------------------------------------------------
// Elde tutulan aletler (5x6, sağa bakarken; sola bakınca aynalanır) ve taşınan yükler
// ---------------------------------------------------------------------------
const HELD_TOOLS = {
  hammer: ['KKKK.', 'KqRK.', '.Kw..', '..w..', '..w..', '..x..'],
  axe: ['.KK..', 'KqqK.', 'KqKw.', '.K.w.', '...w.', '...x.'],
  pickaxe: ['.KKK.', 'KqwqK', 'K.w.K', '..w..', '..w..', '..x..'],
  hoe: ['KKKw.', 'Kq.w.', '...w.', '...w.', '...w.', '...x.'],
  // Havan eli (11. aşama, şifacı)
  pestle: ['..KK.', '.KqqK', '.KqK.', '..r..', '..r..', '..R..'],
  // (24.2) Dokuma mekiği (dokumacı) ve uzun saplı kepçe (mahzen ustası)
  shuttle: ['.....', 'KXXK.', 'KSSK.', 'KXXK.', '.w...', '.w...'],
  ladle: ['KKK..', 'KYK..', '.Kw..', '..w..', '..w..', '..x..'],
  // Fırın küreği: geniş yassı ağız, uzun sap (10. aşama)
  peel: ['KEEK.', 'KXXK.', '.Kw..', '..w..', '..w..', '..x..'],
  // Çoban değneği (5x15): tepesi kıvrık uzun asa; çoban onu yere dayayıp dik tutar ('tend' pozu)
  crook: [
    '.www.',
    'w...w',
    'w...w',
    'x...w',
    '....w',
    '....w',
    '....X',
    '....w',
    '....w',
    '....w',
    '....X',
    '....w',
    '....w',
    '....w',
    '....x',
  ],
  // Olta (9x9): sapı sol altta, ince ucu sağ üstte
  rod: [
    '........w',
    '.......w.',
    '......w..',
    '.....w...',
    '....X....',
    '...X.....',
    '..X......',
    '.xE......',
    'xx.......',
  ],
};

// Sağlam Alet kuşanan sakinin aletleri: parlak çelik baş, açık renk sap, altın sarılı uç
const STURDY_TOOL_COLORS = { q: 'a', R: 'q', w: 'E', x: 'P', X: 'P' };

/** @param {boolean} sturdy Sağlam Alet kuşanmış sakinin parlak aleti */
export function getHeldToolSprite(tool, flipped, sturdy = false) {
  return getSprite(`ui:tool:${tool}:${flipped ? 'L' : 'R'}:${sturdy ? 'S' : ''}`, () => {
    const rows = sturdy ? recolorRows(HELD_TOOLS[tool], STURDY_TOOL_COLORS) : HELD_TOOLS[tool];
    return flipped ? rows.map((r) => [...r].reverse().join('')) : rows;
  });
}

const CARRY_BUNDLES = {
  wood: ['.KKKKKK.', 'KEwwwwwK', 'KKKKKKKK', 'KEwwwwwK', '.KKKKKK.'],
  stone: ['..KKKK..', '.KqqrrK.', 'KqrrRRRK', 'KrRRRRQK', '.KKKKKK.'],
  food: ['.K....K.', '.KKKKKK.', 'KmlmlmmK', 'KXwXwXwK', '.KKKKKK.'],
  wool: ['.KKKKKK.', 'Kuu6uuuK', 'Ku6uu6uK', 'K6uuuu6K', '.KKKKKK.'],
  iron: ['..KKKK..', '.KCUrCK.', 'KUCRCUCK', 'KRRRRRRK', '.KKKKKK.'],
  bread: ['.K....K.', '.KKKKKK.', 'KYOYOYOK', 'KXwXwXwK', '.KKKKKK.'],
  cloth: ['.KKKKKK.', 'KSSSSSSK', 'KccccccK', 'KSSSSSSK', '.KKKKKK.'],
  sherbet: ['..KKKK..', '.KXEXwK.', 'QQQQQQQQ', '.KXEXwK.', '..KKKK..'],
  flax: ['.c.a.c..', 'KvKvKvK.', 'KvXXXvK.', 'KvKvKvK.', '.KKKKK..'],
  hops: ['..KKKK..', '.KlFmFK.', 'KFmlFlFK', 'KfFlfFfK', '.KKKKKK.'],
};

export function getCarrySprite(resource) {
  return getSprite(`ui:carry:${resource}`, CARRY_BUNDLES[resource]);
}

const iconUrlCache = new Map();

/** HUD'da <img> olarak kullanmak için simgenin data URL'si. */
export function getIconDataURL(name) {
  if (!iconUrlCache.has(name)) {
    const sprite = getSprite(`ui:icon:${name}`, ICONS[name]);
    iconUrlCache.set(name, sprite.toDataURL());
  }
  return iconUrlCache.get(name);
}

// ---------------------------------------------------------------------------
// İfade balonları (11x12): beyaz balon + 7x6 simge
// ---------------------------------------------------------------------------
const BUBBLE = [
  '.KKKKKKKKK.',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  'KuuuuuuuuuK',
  '.KKKuKKKKK.',
  '...KuK.....',
  '....K......',
];

const BUBBLE_ICONS = {
  heart: ['.oo.oo.', 'ooooooo', 'oZooooo', '.ooooo.', '..ooo..', '...o...'],
  note: ['..iiiii', '..i...i', '..i...i', '.ii..ii', 'iii.iii', '.i...i.'],
  laugh: ['.YYYYY.', 'YKYYYKY', 'YYYYYYY', 'YKKKKKY', 'YKoooKY', '.YYYYY.'],
  chat: ['.......', '.......', '.K.K.K.', '.K.K.K.', '.......', '.......'],
  apple: ['...xg..', '.ooooo.', 'oouoooo', 'ooooooo', 'ooooooo', '.oo.oo.'],
  berry: ['...g...', '..mlm..', '.mlmlm.', '.lmlml.', '..mlm..', '...m...'],
  zzz: ['....BBB', '.....B.', '....BBB', 'BBBB...', '.BB....', 'BBBB...'],
  sparkle: ['...P...', '..PYP..', 'PYYuYYP', '..PYP..', '...P...', '.......'],
  fire: ['...o...', '..oO...', '.oOPo..', '.oPyPo.', '.oPyPo.', '..ooo..'],
  hammer: ['.KKKKK.', '.KqqRK.', '..KwK..', '..KwK..', '..KwK..', '..KKK..'],
  sweat: ['...c...', '..cc...', '.ccac..', '.cccc..', '..cc...', '.......'],
  fish: ['.......', '.bbbb.b', 'bKbbbbb', 'bNNNNbb', '.bbbb.b', '.......'],
  cold: ['...c...', '.c.a.c.', '..cac..', 'caa8aac', '..cac..', '.c.a.c.'],
  // 9. aşama: aşk (pembe ve kırmızı çift kalp), öfke şimşeği, somurtma bulutu, düğün yüzüğü
  love: ['pp.pp..', 'ppppp..', '.poo.oo', '..oZooo', '...ooo.', '....o..'],
  angry: ['...YYO.', '..YYO..', '.YYYYYO', '...YYO.', '..YYO..', '..YO...'],
  sulk: ['..RRR..', '.RrrrR.', 'RrqrrrR', '.RRRRR.', '..c..c.', '.c..c..'],
  ring: ['...a...', '..aWa..', '..PPP..', '.P...P.', '.P...P.', '..PPP..'],
  // 11. aşama: hapşırma, ateş (termometre), şifalı ot, iyileşme
  sneeze: ['....c.c', '...c.a.', 'KK..c.c', 'KTK..a.', 'KK..c.c', '....c..'],
  fever: ['...K...', '..KuK..', '..KoK..', '..KoK..', '.KoooK.', '..KKK..'],
  herb: ['...vV..', '..vVv.V', '.V.f.v.', '.vvfvV.', '...f...', '...x...'],
  // 14. aşama: güzel bir anıyı hatırlamak (çerçeveli küçük resim, içinde kalp)
  memory: ['KKKKKKK', 'KyoyoyK', 'KyoooyK', 'KyyoyyK', 'KKKKKKK', '.......'],
  // 15. aşama: barışma (iki elin sıkışması: biri ten, biri koyu ten; kollarda kumaş), usta işi eser (altın madalya)
  handshake: ['.......', 'BB...oo', 'BTTtTTo', '.TtTtT.', '..TTT..', '.......'],
  masterpiece: ['.o...o.', '..o.o..', '..PPP..', '.PYuYP.', '.PYYYP.', '..PPP..'],
  // 16. aşama: maceracı hikâyesi (karlı dağ) ve hazine sandığı
  adventure: ['...K...', '..KuK..', '.KqrrK.', 'KrRrRrK', 'gggggg.', '.......'],
  treasure: ['.KKKKK.', 'KXPXPXK', 'KKKPKKK', 'KwXXXwK', 'KwwwwwK', '.KKKKK.'],
  // 19. aşama: dedikodu / haber fısıltısı (menekşe balonda ünlem), müzisyenin melodisi, kitap kurdunun kitabı, pati
  whisper: ['.KKKKK.', 'KiiYiiK', 'KiiYiiK', 'KiiiiiK', 'KiiYiiK', '.KKKKK.'],
  melody: ['P..O...', '...OO..', '...O.O.', '.P.O...', '.OOO..P', '.OO....'],
  book: ['.KK.KK.', 'KuRKRuK', 'KuRKRuK', 'KuuKuuK', 'KBBKBBK', '.KK.KK.'],
  paw: ['.w...w.', 'www.www', '...w...', '..www..', '.wwwww.', '..www..'],
  // 20. aşama: Ulu Saat Kulesi'nin çanı (altın çan, iki yanında ses çizgileri)
  bell: ['c..P..c', '.cPYPc.', 'c.PYP.c', '.PYYYP.', 'PPPPPPP', '...o...'],
  // 21. aşama: dilekçe parşömeni, isyan meşalesi, kese (yevmiye / alışveriş), yağma çuvalı
  scroll: ['.KKKKK.', 'KeSSSeK', '.KsKsK.', '.KsSsK.', 'KeSSSeK', '.KKKKK.'],
  torch: ['..O.O..', '.OPYO..', '..OPO..', '..KXK..', '...w...', '...w...'],
  purse: ['..K.K..', '...K...', '..KdK..', '.KdYdK.', 'KddPddK', '.KKKKK.'],
  loot: ['..KXK..', '.KXXXK.', 'KXEXXXK', 'KXXXEXK', '.KKKKKP', '....PYP'],
  // 22. aşama: köyü terk edenin bohçası (değnek ucunda kırmızı puantiyeli çıkın), tahsildar ve ferman
  bundle: ['...K..K', '..KoK.K', '.KoBoKK', 'KoooBKw', '.KoBoKw', '..KKK.w'],
  collector: ['.KKKKK.', 'KnnnnnK', '..KPK..', '.KdYdK.', 'KddoddK', '.KKKKK.'],
  decree: ['KKKKKK.', 'KSSSSK.', 'KsKKsK.', 'KsSSsKo', 'KSSSSoo', 'KKKKKoo'],
  // 23. aşama: su kovası, kalkan, haydut, bandaj ve tamir
  bucket: ['..KKK..', '.K...K.', 'KKKKKKK', 'KcWacaK', '.KwXwK.', '..KKK..'],
  shield: ['KKKKKKK', 'KbbPbbK', 'KPPPPPK', 'KbbPbbK', '.KbPbK.', '..KKK..'],
  bandit: ['..KKK..', '.KxxxK.', 'KKxxxKK', 'KuKKKuK', 'KoooooK', '.KKKKK.'],
  bandage: ['.......', '.KKKKK.', 'KSSSSSK', 'KSsKsSK', '.KKKKK.', '.......'],
  repair: ['KKKK...', 'KqrRK.o', '.Kw..o.', '..w.o..', '..x..o.', '.....o.'],
  // (24.2) bir bardak fıçı şerbeti ve dikilen Dayanıklı Giysi
  sherbet: ['..Y....', '.KKKKK.', 'KYYYYYK', 'KYOYOYK', '.KYYYK.', '..KKK..'],
  cloth: ['.......', 'KKKKKKK', 'KSSSSSK', 'KcccccK', 'KSSSSSK', 'KKKKKKK'],
  // (29.2) yas mumu
  candle: ['...O...', '..OPO..', '...O...', '..SSS..', '..SsS..', '.KSSSK.'],
  // (29.1) sosyal kimya: çift mavi şimşek (güçlü çekim)
  spark: ['..bc.bc', '.bc.bc.', 'bcabca.', '.bc.bc.', 'bc.bc..', 'c..c...'],
};

export const BUBBLE_WIDTH = 11;
export const BUBBLE_HEIGHT = 12;

/** HTML arayüzü için herhangi bir simgenin (HUD simgesi ya da balon simgesi) data URL'si. */
export function getAnyIconURL(name) {
  if (ICONS[name]) return getIconDataURL(name);
  const key = `ui:bubbleIcon:${name}`;
  if (!iconUrlCache.has(key)) iconUrlCache.set(key, getSprite(key, BUBBLE_ICONS[name]).toDataURL());
  return iconUrlCache.get(key);
}

/** (29.8) Çerçevesiz simge (HUD ya da balon simgesi) canvas'ı: düşünce / konuşma balonlarının içine çizilir. */
export function getAnyIconSprite(name) {
  if (ICONS[name]) return getIconSprite(name);
  if (!BUBBLE_ICONS[name]) return null;
  return getSprite(`ui:bubbleIcon:${name}`, BUBBLE_ICONS[name]);
}

export function getBubbleSprite(icon) {
  return getSprite(`ui:bubble:${icon}`, () => composeRows(BUBBLE, [[BUBBLE_ICONS[icon], 2, 2]]));
}

// ---------------------------------------------------------------------------
// Seçili karakterin ayak altı halkası (14x6, iki kare nabız) ve hedef işareti
// ---------------------------------------------------------------------------
const SELECTION_RING = [
  '...yyyyyyyy...',
  '.yy........yy.',
  'y............y',
  'y............y',
  '.yy........yy.',
  '...yyyyyyyy...',
];

export function getSelectionRing(frame) {
  return getSprite(`ui:ring:${frame % 2}`, () =>
    frame % 2 === 0 ? SELECTION_RING : recolorRows(SELECTION_RING, { y: 'Y' })
  );
}

const TARGET_MARKER = [
  '..y..',
  '.yYy.',
  'yYKYy',
  '.yYy.',
  '..y..',
];

export function getTargetMarker() {
  return getSprite('ui:target', TARGET_MARKER);
}

// ---------------------------------------------------------------------------
// Gezgin tüccarın sırt çantası (10x14): üstünde rulo battaniye ve asılı tava.
// 'front': karakter bize bakarken omuzlarının üstünden görünen kısım; 'back': sırtı bize dönükken
// tüm çanta; 'left' / 'right': yandan.
// ---------------------------------------------------------------------------
const BACKPACK_BACK = [
  '.KKKKKKKK.',
  'KppppppppK',
  'KpPpPpPpPK',
  '.KKKKKKKK.',
  '.KxxxxxxK.',
  'KxXXXXXXxK',
  'KxXEEEEXxK',
  'KxXEKKEXxK',
  'KxXXXXXXxK',
  'KxwwwwwwxK',
  'KxXXXXXXxK',
  'KxXXXXXXxK',
  '.KxxxxxxK.',
  '..KKKKKK..',
];
const BACKPACK_FRONT = [
  '.KKKKKKKK.',
  'KppppppppK',
  'KpPpPpPpPK',
  '.KKKKKKKK.',
  '.KxxxxxxK.',
  'KxX....XxK',
  'Kx......xK',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const BACKPACK_SIDE = [
  '..KKKKK...',
  '.KpppppK..',
  '.KpPpPpK..',
  '..KKKKK...',
  '..KxxxxK..',
  '.KxXXXxK..',
  '.KxXEXxKK.',
  '.KxXXXxKqK',
  '.KxwwwxKqK',
  '.KxXXXxKK.',
  '.KxXXXxK..',
  '.KxXXXxK..',
  '..KxxxK...',
  '...KKK....',
];

export function getBackpackSprite(view) {
  return getSprite(`ui:backpack:${view}`, () => {
    if (view === 'back') return BACKPACK_BACK;
    if (view === 'front') return BACKPACK_FRONT;
    return view === 'left' ? BACKPACK_SIDE.map((r) => [...r].reverse().join('')) : BACKPACK_SIDE;
  });
}

// (25.2) Çırağın taburesi (8x4): ustasının yanında oturduğu küçük ahşap tabure
const STOOL = ['KKKKKKKK', 'KEEXXEEK', '.Kx..xK.', '.K....K.'];

export function getStoolSprite() {
  return getSprite('ui:stool', () => STOOL);
}

// Şenlikte havada süzülen müzik notası (5x6); renk palet harfi olarak verilir
const NOTE_SHAPE = ['..cc.', '..c.c', '..c..', '..c..', 'ccc..', 'ccc..'];

export function getNoteSprite(color) {
  return getSprite(`ui:note:${color}`, () => NOTE_SHAPE.map((r) => r.replaceAll('c', color)));
}
