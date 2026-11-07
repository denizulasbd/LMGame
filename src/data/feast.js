// (26. aşama, 26.2) Geleneksel İkramlar ve Büyük Ziyafet Sofrası. Mantık: src/systems/FeastSystem.js (saf hesaplar:
// src/systems/Feast.js), çizim: src/rendering/FairDecor.js.
//
// Her panayır günü 06:00'da (FairSystem 'fair:prep') meydan havuzunun yanına Büyük Ziyafet Sofrası kurulur ve kasaba kilerinden
// erzak ayrılır. Sofranın seviyesi (tier) kasabanın elindekine göre belirlenir:
//   'rich'     Zengin Şölen Sofrası : Fıçı Şerbeti ve Keten Kumaş (sofra örtüsü) varsa; ekmek / sebze + şerbet fıçıları + kadehler
//   'modest'   Mütevazı Sofra        : temel erzak (ekmek, sebze); lüks mal yok
//   'symbolic' Sembolik İkram        : kasabanın kişi başı besini 3'ün altındaysa ya da ayrılacak fazla erzak yoksa; kilerden HİÇBİR ŞEY
//                                      ayrılmaz, yalnızca hafif bir ikram (keyif ve sosyallik; tokluk yok)
// GIDA GÜVENCESİ: bağışlanan erzak ne olursa olsun kasabanın besin değeri kişi başı en az `minPerCapita` (3, Şerbethane'nin "aç kasaba"
// eşiğiyle aynı) kalır; fazlası ayrılamaz. Sofra gündüz mesaisine dokunmaz: ayrılma 06:00'da, yiyenler yalnızca 18:00 - 22:00 şenlik
// saatinde sofraya gelir; 22:00'de sofra toplanır, artan erzak kilere geri döner.
// Bu katman KENDİ tohumlanmış üretecini kullanır (TownScene -> seed + 33): yalnızca söz seçimi. Ana üretece ve Math.random'a dokunmaz.
export const FEAST = {
  minPerCapita: 3,
  // Sakin başına hedef bağış (yiyecek değeri): ekmek önce (ekmek 2,5), kalan ham yiyecekten
  perResident: { modest: 1, rich: 1.5 },
  breadShare: 0.5, // hedefin en çok bu kadarı ekmekten
  minDonation: 0.35, // sakin başına bundan az ayrılabiliyorsa sofra sembolik kalır
  // Zengin sofra: şerbet fıçısı ve kumaş
  rich: { minSherbet: 1, minCloth: 1, cloth: 1, kegsPer: 6 }, // kegsPer: kaç sakin için 1 fıçı (en az 1)
  // Yemek: sofraya gelen her sakin tek ikram alır (sofra boşalınca ikram bitmiştir)
  servings: { symbolic: 1, modest: 1, rich: 1 }, // sakin başına ikram oranı
  extraServings: { rich: 2 }, // misafir payı
  fill: {
    symbolic: { hunger: 0, fun: 6, social: 4 },
    modest: { hunger: 12, fun: 10, social: 8 },
    rich: { hunger: 20, fun: 18, social: 14 },
  },
  // Gelenek Bağı (her seviyede), Bolluk Ziyafeti (yalnızca zengin sofra): şenlik saatinden ertesi sabaha kadar
  buffs: { symbolic: [], modest: ['tradition'], rich: ['tradition', 'bounty'] },
  afterglowHours: 8, // 22:00'den sonra buff bu kadar daha sürer (uyku boyunca iyi beslenmenin etkisi)
  healMultiplier: 2, // hafif yaralılar etkin Gelenek Bağı sürerken bu kadar hızlı iyileşir
  speechSeconds: 3.2,
  speechPerMinute: 0.012,
  festiveSpeechMul: 2.4,
  craftsmanSpeechMul: 1.5,
  entrepreneurSpeechMul: 1.5,
};

export const TIERS = {
  rich: { name: 'Zengin Şölen Sofrası', icon: 'sherbet', set: 'Meydan havuzunun yanına Zengin Şölen Sofrası kuruldu: şerbet fıçıları ve kumaş örtü hazır.' },
  modest: { name: 'Mütevazı Sofra', icon: 'bread', set: 'Meydan havuzunun yanına Mütevazı Sofra kuruldu: ekmek ve sebze hazır.' },
  symbolic: { name: 'Sembolik İkram', icon: 'food', set: 'Kiler idareli tutuluyor: meydana yalnızca hafif bir ikram sofrası kuruldu.' },
};
export const TIER_KEYS = Object.keys(TIERS);

// Sofradaki neşeli kadeh / lokma sözleri (ayrı metin katmanı: c.speech)
export const TOAST_LINES = {
  symbolic: ['Bir lokma da olsa paylaşalım!', 'Şerefe, komşular!', 'Az olsun, bizim olsun!'],
  modest: ['Elinize sağlık, ne güzel ekmek!', 'Bir lokma da benden!', 'Şerefe, komşular!', 'Sofra hiç bitmesin!'],
  rich: ['Kadehler havaya, şerefe!', 'Bu şerbetin tadına doyum olmaz!', 'Ne bolluk, ne bereket!', 'Şerefe, Pikselköy!'],
};
// Huya özgü sözler: Şenlik Neşesi şerbet fıçısının başında şarkı tutturur; Zanaatkâr masanın işçiliğini över; Girişimci bolluğun ticaret itibarını anar
export const QUIRK_LINES = {
  festive: ['Bu fıçının başından kimse beni ayıramaz!', 'Haydi bir türkü tutturalım!', 'La la laay, şerbet var, şenlik var!'],
  craftsman: ['Bu masanın işçiliğine bak, kusursuz geçme!', 'Fıçıları kim yaptıysa elleri dert görmesin.', 'Ne sağlam bir ahşap!'],
  entrepreneur: ['Bu bolluk dış ticaret itibarımızı artırır!', 'Kervancılar bu sofrayı duyunca gelir.', 'Bolluk kasabanın en iyi vitrini!'],
};
