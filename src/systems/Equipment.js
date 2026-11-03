// Kişisel ekipmanın etkileri için saf hesaplar (durum değiştirmez). BehaviorSystem (iş hızı),
// NeedsSystem (üşüme, yol yorgunluğu), HeatingSystem (üşüme balonu), CraftingSystem (kimin ihtiyacı var)
// ve arayüz aynı kuralı kullansın diye tek yerde. Sayılar src/data/equipment.js'te.
import { EQUIPMENT } from '../data/equipment.js';

/** Kuşanılan ekipmanların iş hızı çarpanı (Sağlam Alet 1,25 × Sırt Çantası 1,15). */
export function equipmentWorkSpeed(c) {
  let value = 1;
  for (const item of Object.values(c.equipment)) if (item) value *= EQUIPMENT[item].workSpeed ?? 1;
  return value;
}

/** Üşümeye karşı koruma 0-1 (palto 0,6). */
export function coldProtection(c) {
  let value = 0;
  for (const item of Object.values(c.equipment)) if (item) value = Math.max(value, EQUIPMENT[item].coldProtection ?? 0);
  return value;
}

/** Yürürken enerji azalma çarpanı (sırt çantası 0,6). */
export function travelFatigue(c) {
  let value = 1;
  for (const item of Object.values(c.equipment)) if (item) value *= EQUIPMENT[item].travelFatigue ?? 1;
  return value;
}

/** Bu ekipmanı kuşanabilecek ama henüz kuşanmamış sakinler (çocuklar ekipman kuşanmaz). */
export function lacking(characters, item) {
  const slot = EQUIPMENT[item].slot;
  return characters.filter((c) => !c.isChild && c.equipment[slot] !== item);
}
