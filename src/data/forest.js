// (34.3) Orman kendiliğinden yenilenir: kesilen ağaç kütük bırakmadığı için odun tükenmesin diye, gün dönümünde açık alanda
// var olan ağaçların yanına yeni fidanlar çıkar. Fidan mevcut süreyle (data/tiles.js -> TREE_REGROWTH) ağaca döner.
export const FOREST_SEED_OFFSET = 45; // üreteç: hayat tohumu + 45 (44 Kraliyet Lütfu)

export const FOREST = {
  // Yeni fidan her yapıdan (kurulu ya da şantiye), yoldan, köprüden ve meydandan en az bu kadar karo uzakta olur (Chebyshev)
  minDistance: 4,
  // Fidan, var olan bir ağacın en çok bu kadar karo yanına çıkar
  nearTreeRadius: 2,
  // Fidan çıkabilecek zeminler (bereketli toprak bahçelere ayrılır; kayalıkta yalnızca çam)
  tiles: ['grass', 'forest', 'rocky'],
  rockyTree: 'pine',
  // Açık alandaki ağaç (fidanlar dahil) sayısı / başlangıçtaki ağaç sayısı: oranın altında hız
  //   hızlı : ağaç oranı fastBelow'un altındaysa günde fastPerDay fidan
  //   yavaş : oran slowBelow'un altındaysa günde slowPerDay fidan
  //   üstünde: fidan çıkmaz
  fastBelow: 0.7,
  slowBelow: 1,
  fastPerDay: 6,
  slowPerDay: 2,
};
