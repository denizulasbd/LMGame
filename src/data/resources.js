// Kasabanın ortak kaynakları. Miktarlar GameState.resources'ta, kurallar burada.
//
//   Temel kaynaklar  : Odun, Taş, Yiyecek (toplama ve temel üretim yapıları)
//   İşlenmiş mallar  : (10. aşama) Yün / Kumaş, Demir Cevheri, Un / Ekmek — üretim zincirlerinden gelir
//   processed        : HUD'da "İşlenmiş mallar" satırında (açılır / özet görünüm) durur; stoğu bitince günlüğe
//                      "tükendi" yazılmaz (zanaatkâr son parçayı kullandıkça her seferinde yazmasın)
//   foodValue        : 1 birimin yiyecek değeri. Ekmek 2,5'tir: öğünler ve göç koşulu ekmeği bu değerle sayar
//                      (bkz. EconomySystem.consumeFood, TownStatus.foodSupply)
//   longName / hint  : HUD ipucu ve panellerdeki uzun ad / ne işe yaradığı
//   treasury         : (12. aşama) Kasaba Hazinesi: depo sınırı yoktur, ihracattan gelir, harikada harcanır
export const RESOURCES = {
  wood: { name: 'Odun', icon: 'wood', hint: 'İnşaat, ısınma ve zanaat malzemesi' },
  stone: { name: 'Taş', icon: 'stone', hint: 'İnşaat ve yükseltme malzemesi' },
  food: { name: 'Yiyecek', icon: 'food', foodValue: 1, hint: 'Öğünler, handaki sıcak yemek ve fırındaki ekmek' },
  wool: {
    name: 'Yün',
    longName: 'Yün ve Kumaş',
    icon: 'wool',
    processed: true,
    hint: 'Koyun Ağılı üretir. Kışlık palto ve sırt çantası malzemesi',
  },
  iron: {
    name: 'Demir',
    longName: 'Demir Cevheri',
    icon: 'iron',
    processed: true,
    hint: 'Demir Madeni çıkarır. Sağlam (çelik başlı) alet malzemesi',
  },
  bread: {
    name: 'Ekmek',
    longName: 'Un ve Ekmek',
    icon: 'bread',
    processed: true,
    foodValue: 2.5,
    hint: 'Yel Değirmeni ve Fırın 1 yiyecekten 1 sıcak ekmek yapar: her ekmek 2,5 yiyecek değerindedir',
  },
  gold: {
    name: 'Altın',
    longName: 'Kasaba Hazinesi',
    icon: 'coin',
    processed: true,
    treasury: true,
    hint: 'Büyük Ticaret Limanı\'ndan ihraç edilen mallar altına döner. Depo sınırı yoktur; Büyük Saat Kulesi\'nin aşamalarında harcanır',
  },
};
export const RESOURCE_KEYS = Object.keys(RESOURCES);
// Temel kaynaklar ve işlenmiş mallar (HUD bunları iki satırda gösterir)
export const BASE_RESOURCE_KEYS = RESOURCE_KEYS.filter((k) => !RESOURCES[k].processed);
export const GOODS_KEYS = RESOURCE_KEYS.filter((k) => RESOURCES[k].processed);
// Yiyecek yerine sayılan kaynaklar (yiyecek, ekmek)
export const FOOD_KEYS = RESOURCE_KEYS.filter((k) => RESOURCES[k].foodValue);

export const STARTING_RESOURCES = { wood: 30, stone: 20, food: 25, wool: 0, iron: 0, bread: 0, gold: 0 };

// Depo binası olmadan her kaynaktan saklanabilecek miktar (her Kiler buna eklenir)
export const BASE_STORAGE_CAPACITY = 100;

// Kilerden / evden yenen bir öğünün maliyeti (yiyecek değeri; ekmek varsa önce ekmek yenir)
export const MEAL_FOOD_COST = 3;

/** "Odun 25, Taş 10" gibi okunabilir maliyet metni. */
export function formatCost(cost) {
  const parts = Object.entries(cost ?? {}).map(([k, v]) => `${RESOURCES[k].name} ${v}`);
  return parts.length ? parts.join(', ') : 'Ücretsiz';
}
