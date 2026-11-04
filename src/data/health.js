// Sağlık (11. aşama): üşütme / halsizlik, Şifacı Kulübesi ve "Dinçlik". Mantık src/systems/HealthSystem.js'te.
//
// Maruziyet (0-100): sakinin hastalığa ne kadar yakın olduğu. Dakikada şu kaynaklardan birikir:
//   cold      : kışın dışarıda üşürken (kışlık palto bunu koruma oranında azaltır)
//   rain      : yağmurda dışarıda ıslanırken (yağmuru seven Doğa Sever ıslanmaz sayılır)
//   exhausted : enerjisi exhaustedBelow'un altındayken
//   starving  : tokluğu starvingBelow'un altındayken
// Hiçbiri yokken recovery hızıyla, evde / handa / ateş başında içi ısınmışken warmRecovery hızıyla azalır.
// Maruziyet threshold'u aşınca her dakika chancePerMinute × (aşan kısım / kalan kısım) olasılıkla üşütür.
export const ILLNESS = {
  name: 'Üşütme',
  label: 'Üşütmüş, halsiz',
  exposure: {
    cold: 0.075,
    rain: 0.05,
    exhausted: 0.06,
    starving: 0.06,
    recovery: 0.05,
    warmRecovery: 0.14,
  },
  exhaustedBelow: 12,
  starvingBelow: 12,
  threshold: 45,
  chancePerMinute: 0.0022,
  // Hastalığın etkileri: yürüme ve çalışma %35 yavaş, enerji biraz daha çabuk düşer
  walkSpeed: 0.65,
  workSpeed: 0.65,
  energyDecay: 1.2,
  // Kendiliğinden iyileşme süresi (oyun saati); sıcak evinde uyurken iki kat hızlı iyileşir
  recoveryHours: 40,
  sleepRecovery: 2,
  // Ara sıra başının üstünde hapşırma ya da ateş balonu (dakika başına olasılık)
  bubbleChance: 0.012,
  bubbles: ['sneeze', 'fever'],
  // Şifacı yoksa hasta gündüz enerjisi bu değerin altına inince evinde kestirir
  restBelow: 60,
};

// Şifacıda tedavi olan sakinin "Dinçlik" bonusu
export const VIGOR = {
  name: 'Dinçlik',
  hours: 12,
  workSpeed: 1.15,
  walkSpeed: 1.15,
  energyDecay: 0.85,
};
