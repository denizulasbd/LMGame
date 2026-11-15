// (29.7 "Anma Töreni ve Özel Günler") Sayılar, adlar ve sözler. Saf hesaplar src/systems/Rites.js'te, olaylar ve davranış
// src/systems/RiteSystem.js'te (Brain -> planMemorial).
//
// state.rites = { pending: [{ name, day, age, id, friends, closestId }], active: null | { names, day, place, condolence, attendees,
//                 ids, deadIds, closestId }, names: [{ name, day, age }], held, condolences, celebrated, forgotten }
// c.weddingDay (evlendiği gün; eski kayıtta null), c.specialDay = null | { day, kind: 'birthday' | 'anniversary', celebrated, gifted }
// HİÇ ZAR ÇEKMEZ: izole üreteç (tohum + 41, LoyaltySystem ile aynı anahtar) yalnızca veda / kutlama sözlerinin seçimi içindir.
import { CALENDAR } from './seasons.js';

export const RITE_RULES = {
  startHour: 18, // vefatı izleyen gün 18:00-19:00
  endHour: 19,
  prepHour: 6, // Taziye Sofrası düğmesi bu saatten tören bitimine dek
  friendMin: 40, // ölenle ilişki puanı en az bu kadar olan yetişkinler de katılır
  minHunger: 15, // acil ihtiyaç: tokluk bunun altındaysa ya da hastaysa törene gitmez
  minEnergy: 12,
  mourningMul: 0.7, // törene katılanın yasının kalan süresi
  condolenceMul: 0.5, // Taziye Sofrası kurulduysa
  spirit: 3, // kişilik evrimi (moodlet:added farewell üzerinden; data/evolution.js)
  namesMax: 40, // kitabedeki en çok ad
  condolenceCost: { food: 20, gold: 10 }, // Taziye Sofrası
};

export const SPECIAL_RULES = {
  yearDays: CALENDAR.daysPerYear, // evlilik yıl dönümü: 16 günde bir (bir takvim yılı; 30.4a: yaşlanmadan bağımsız)
  startHour: 6, // o gün 06:00'da başlar
  deadlineHour: 22, // 22:00'ye dek kutlanmazsa "Unutuldu"
  closest: 2, // doğum gününde birbirini arayan en yakın kişi sayısı (eş, ebeveyn, sonra ilişki puanı)
  celebratedJoy: 3, // yaşam doyumu (denge: 6 -> 4 -> 3; 6'da tohum 42'nin, 4'te tohum 13'ün son gün ortalama doyumu 71,5 / 70,6, bant 45-70)
  celebratedFriendship: 5,
  forgottenJoy: -4,
  giftCost: 5, // altın
  giftJoy: 4,
};

export const RITE_VENUES = ['monument', 'fountain']; // tamamlanmış anıt varsa anıt, yoksa meydan havuzu

export const FAREWELL_LINES = ['Yolun açık olsun {who}.', 'Hakkını helal et {who}.', 'Seni hep anacağız {who}.', 'Işıklar içinde uyu {who}.'];
export const CELEBRATE_LINES = {
  birthday: ['Nice yaşlara {who}!', 'İyi ki doğdun {who}!'],
  anniversary: ['Nice mutlu yıllara!', 'İyi ki seninleyim {who}.'],
};
export const SPECIAL_KIND_NAMES = { birthday: 'Doğum Günü', anniversary: 'Evlilik Yıl Dönümü' };
