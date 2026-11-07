// (24. aşama) Tarımsal çeşitlilik: Sebze Bahçesi'nin ekim tercihi (mahsul seçimi) ve Ürün Silosu.
// Kurallar burada, saf hesaplar systems/Granary.js'te, olaylar ve saatlik bozulma systems/GranarySystem.js'te.
//
//   CROPS          : bahçenin ekebileceği mahsuller. Seçilen mahsul bahçenin ana ürününü (resource) ve saatlik verimini
//                    (perHour) belirler; mevsim, yağmur, biyom, sera, şema, asma ve kuyu çarpanları her mahsule aynen uygulanır.
//     grain        : Buğday / Sebze (varsayılan): klasik yiyecek üretimi (değirmende un ve ekmeğe döner)
//     flax         : Keten: lifli tarım ürünü; gıda değildir, ileride dokumada kullanılacak sanayi hammaddesi
//     hops         : Meyve / Şerbetçiotu: tatlı meyve ve aromatik bitki; ileride han ve şerbet üretiminde kullanılacak
//     label        : bahçıvanın o mahsulde çalışırken balonundaki etkinlik metni (Buğday'da bahçenin eski metni)
//   DEFAULT_CROP   : yeni bahçeler ve eski kayıtların (sürüm 2-20) bahçeleri bununla başlar
//   AGRI_KEYS      : tarımsal kaynaklar: Ürün Silosu (data/buildings.js -> silo.granary.capacity, +150) bunların depo
//                    kapasitesini artırır
//   SPOILAGE       : silosu olmayan kasabada ham mahsulün yağmurda ve kışın bozulması
//     keys         : bozulan ham mahsuller (ekmek fırından çıkmıştır, bozulmaz)
//     safeStock    : bu miktara kadarki stok kilerde güvendedir (yalnızca fazlası bozulur)
//     perHour      : yağmurlu ya da kış saatinde, güvenli stoğun üstündeki miktarın bozulan oranı
//   Silo kurulunca (işleyen bir silo yeterlidir) hiçbir mahsul bozulmaz.
export const CROPS = {
  grain: {
    name: 'Buğday / Sebze',
    shortName: 'Buğday',
    resource: 'food',
    perHour: 5,
    icon: 'food',
    label: 'Bahçeyi çapalıyor',
    description: 'Klasik gıda üretimi: altın başaklı buğday, lahana ve havuç. Değirmen bunu una ve ekmeğe çevirir.',
  },
  flax: {
    name: 'Keten',
    shortName: 'Keten',
    resource: 'flax',
    perHour: 3,
    icon: 'flax',
    label: 'Mavi çiçekli keten saplarını topluyor',
    description: 'Lifli tarım ürünü (gıda değildir): ileride dokuma tezgâhında kumaşa dönecek sanayi hammaddesi.',
  },
  hops: {
    name: 'Meyve / Şerbetçiotu',
    shortName: 'Şerbetçiotu',
    resource: 'hops',
    perHour: 3,
    icon: 'hops',
    label: 'Şerbetçiotu salkımlarını ve meyveleri topluyor',
    description: 'Tatlı meyve ve aromatik bitki (gıda değildir): ileride handa şerbet ve içecek yapımında kullanılacak.',
  },
};
export const CROP_KEYS = Object.keys(CROPS);
export const DEFAULT_CROP = 'grain';

// Tarımsal kaynaklar: Ürün Silosu bunların depo kapasitesini artırır (Buğday / yiyecek, Un / ekmek, Keten, Şerbetçiotu)
export const AGRI_KEYS = ['food', 'bread', 'flax', 'hops'];

export const SPOILAGE = {
  keys: ['food', 'flax', 'hops'],
  safeStock: 80,
  perHour: 0.004,
};
