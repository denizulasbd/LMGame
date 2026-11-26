// (34.3) Alan açma: ağaç ve kaya olan yere şantiye kurulur; önce içindekiler toplanır, sonra inşaat başlar. Yol üstüne inşa:
// sökülen yol karoları yıkımdaki iade oranıyla geri ödenir (data/buildings.js -> DEMOLISH_REFUND).
export const CLEARING_TEXT = {
  // "Önce 3 ağaç ve 1 kaya temizlenecek (+24 odun, +9 taş)"
  tree: 'ağaç',
  rock: 'kaya',
  note: (parts, gains) => `Önce ${parts} temizlenecek${gains ? ` (${gains})` : ''}`,
  and: ' ve ',
  waiting: 'Alan temizleniyor',
  roads: (n) => `${n} yol karosu sökülecek`,
  roadsConfirm: (n) => `${n} yol karosu sökülecek · onaylamak için yeniden tıkla`,
  roadCutDoor: (name) => `Bu yol sökülürse ${name} yolu kesilir`,
  toastRoads: (n) => `${n} yol karosu söküldü`,
  toastClearing: (n) => `Alan açılıyor: ${n} ağaç / kaya öncelikli toplanacak`,
};

// Yol üstüne inşada ikinci tıklamanın süresi (ms); yıkım onayıyla aynı
export const ROAD_CONFIRM_MS = 4000;
