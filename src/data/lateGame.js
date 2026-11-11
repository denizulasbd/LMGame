// (28.4) Geç Oyun Beklentisi: kasaba Gelişmiş Şehir (4. seviye) olunca ya da Altın Çağ'a girince sakinlerin hayat standardı yükselir.
//   decay       : Keyif ve Sosyallik ihtiyaçlarının doğal azalma hızı çarpanı (+%30: lükse alışanlar çabuk sıkılır)
//   perMissing  : eksik her lüks kalemi için refahtan düşen puan (en çok luxuries.length * perMissing)
//   luxuries    : sürekli akışı beklenen kalemler (SystemLateGame.luxuryChecks):
//                 sherbet = Fıçı Şerbeti (kilerde ya da bir handa), cloth = Kumaş / Dayanıklı Giysi, hotMeal = handa sıcak yemek
export const LATE_GAME = {
  minTier: 4,
  decay: 1.3,
  perMissing: 6,
  luxuries: {
    sherbet: { name: 'Fıçı Şerbeti', hint: 'Şerbethane çalıştır, handa fıçı bulunsun' },
    cloth: { name: 'Kumaş / Kıyafet', hint: 'Dokuma Tezgâhı çalıştır, kumaş stoğu ya da Dayanıklı Giysi olsun' },
    hotMeal: { name: 'Handa sıcak yemek', hint: 'Handa pişmiş yemek bulunsun (kilerde yiyecek, aşçı)' },
  },
};
export const LATE_GAME_KEYS = Object.keys(LATE_GAME.luxuries);
