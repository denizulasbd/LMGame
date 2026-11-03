// Kasabanın ortak kaynakları. Miktarlar GameState.resources'ta, kurallar burada.
export const RESOURCES = {
  wood: { name: 'Odun', icon: 'wood' },
  stone: { name: 'Taş', icon: 'stone' },
  food: { name: 'Yiyecek', icon: 'food' },
};
export const RESOURCE_KEYS = Object.keys(RESOURCES);

export const STARTING_RESOURCES = { wood: 30, stone: 20, food: 25 };

// Depo binası olmadan her kaynaktan saklanabilecek miktar (her Kiler buna eklenir)
export const BASE_STORAGE_CAPACITY = 100;

// Kilerden / evden yenen bir öğünün maliyeti
export const MEAL_FOOD_COST = 3;

/** "Odun 25, Taş 10" gibi okunabilir maliyet metni. */
export function formatCost(cost) {
  const parts = Object.entries(cost ?? {}).map(([k, v]) => `${RESOURCES[k].name} ${v}`);
  return parts.length ? parts.join(', ') : 'Ücretsiz';
}
