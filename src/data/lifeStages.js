// (25. aşama, 25.1) Yaşam evreleri ve yaş döngüsü: Çocuk -> Genç -> Yetişkin -> Kıdemli Bilge.
// Hesaplar src/systems/LifeStages.js (saf) ve LifeStageSystem.js'te (durum değiştirir); burada yalnızca sayılar ve adlar var.
//
// İlke (25.1): yaşlanan sakin "Kıdemli Bilge" unvanı kazanır, ağır işlerden emekli olur ve çardakta, bankta, meydan havuzunda ya da
// Bilgelik Evi'nde vakit geçirerek kasabaya bilgelik katar. (28.3) "Ölümsüzlük" kuralı KALKTI: Bilge ocağını ve yadigârını devredince
// "Saygın Büyük" olur (yatağını boşaltır, nüfus kotasından düşer) ve ömrünün sonunda huzur içinde vefat eder; yangın, baskın ve
// seferde çok nadir kazalar da can alabilir.
//
// Yaş döngüsü RASTGELELİK KULLANMAZ: her sakinin doğum günü kimliğinden türetilir, yaşı yalnızca gün dönümlerinde (00:00)
// ilerler; oyunun hiçbir üretecinin sırası değişmez.
import { CONFIG } from '../config.js';

export const LIFE_STAGE_KEYS = ['child', 'youth', 'adult', 'elder'];

// Evrelerin adları, rozet simgeleri ve kartta görünen kısa açıklamaları
export const LIFE_STAGES = {
  child: { name: 'Çocuk', icon: 'star', description: 'Kasabada neşeyle koşturur, oynar ve okula gider; çalışmaz.' },
  youth: { name: 'Genç', icon: 'sparkle', description: 'Gençlik evresi (18-20 yaş): çevik ve hevesli; kasabanın işlerine yetişkinler gibi yardım eder. Yakında bir ustanın yanında çıraklığa başlayabilir.' },
  adult: { name: 'Yetişkin', icon: 'hammer', description: 'Kasabanın tam kapasite çalışan, üretken sakini.' },
  elder: { name: 'Kıdemli Bilge', icon: 'book', description: 'Emekli usta: ağır işlerden muaftır; çardakta, bankta ve Bilgelik Evi\'nde vakit geçirir, gençlere Bilge Nasihati verir.' },
};

// Takvim: bir yaş = bir oyun yılı (4 mevsim). Gençlik youthUntil yaşına kadar sürer; elderAt yaşında sakin Kıdemli Bilge olur.
// (29.2b) Kuruluş sakinlerinin en yaşlısı (66) oyunun ilk günlerinde bilgeleşir, ikincisi (58) yaklaşık 7 yıl (112 gün) sonra (çocuklar 18 yaşında Genç olur).
export const AGING = {
  daysPerYear: CONFIG.DAYS_PER_SEASON * 4,
  youthUntil: 21,
  elderAt: 65,
  // Doğum günleri kimliğe göre yılın ilk birthdaySpread gününe dağılır (herkes aynı gün yaşlanmasın; rastgelelik yok)
  birthdaySpread: 8,
};

// Gençlik: energyGain, uykuda ve dinlenirken enerjinin dolma çarpanıdır. 25.1'de 1 (kapalı): 1,15 denendiğinde tohum 42'nin
// Altın Çağ'ı G28'den G31'e kaydı (gençler daha erken uyanıp iş düzeni değişiyor). Determinizm kuralı gereği bonus, çıraklıkla
// birlikte dengelenmek üzere 25.2'ye bırakıldı; çalışma ve iş yükü yetişkinle aynıdır.
// (28.2) Gençler uykuda ve dinlenirken %20 daha hızlı toparlanır (eski takvimi korumak için kilitli olan 1 değeri kalktı)
export const YOUTH = { energyGain: 1.2 };

// Kıdemli Bilge
//   minCoreAdults: kasabada çalışabilir en az bu kadar yetişkin / genç kalır. Daha azsa en dinç bilgeler (kimlik sırasıyla)
//                  gönüllü olarak işe döner ("Gönüllü usta"); yeter sayıya ulaşılınca yeniden emekli olur.
//   advice       : bilge, boş zamanında radius piksel yakınındaki uyanık yetişkin ve gençlere dakikada fun / social kadar
//                  "Bilge Nasihati" morali verir (dinleyen başına üst sınır yok; bilge sayısı kadar toplanmaz: en yakın bilge sayılır)
//   welfare      : her emekli bilge kasaba refahına perElder puan katar (en çok max)
//   leisure      : boş zaman tercihleri (çarpan); ağır yürüyüş ve nehir kenarı yerine bank, çardak, havuz, gölge ve kütüphane
//   speed        : yürüme hızı çarpanı (ağır ve tatlı adımlar)
export const ELDER = {
  minCoreAdults: 3,
  advice: { radius: 40, fun: 0.04, social: 0.02 },
  welfare: { perElder: 1, max: 3 },
  leisure: { bench: 3, gazebo: 2.5, fountain: 2, shade: 2, readBench: 2, readLibrary: 2.5, campfire: 1.2, river: 0.4, stroll: 0.5, flowers: 1.2 },
  readLibraryBase: 1.5, // Bilgelik Evi varsa kitap okumak bilgenin boş zaman seçenekleri arasına bu ağırlıkla girer
  speed: 0.9,
};

// Bilge Nasihati baloncukları ve Kasaba Günlüğü cümleleri (kendi üreteciyle seçilir: ana üretece dokunmaz)
export const ELDER_LINES = [
  '{name} artık kasabanın kıdemli bir bilgesi oldu, gençlere yol gösterecek!',
  '{name} Kıdemli Bilge unvanını aldı: aletlerini gençlere bırakıp çardakta nasihat vermeye başladı!',
  '{name} kasabanın yeni Kıdemli Bilgesi! Yılların birikimi artık meydanda dinleyenlerin.',
];

// (25.2) Bilge Nasihati sözleri (metin baloncuğu; kendi üreteciyle seçilir)
export const ELDER_ADVICE = ['Sabır her işin başıdır, evlat.', 'Ağaç yaşken eğilir.', 'Komşu komşunun külüne muhtaç.', 'Bir elin nesi var, iki elin sesi var.', 'Damlaya damlaya göl olur.'];

// (28.3) Sürdürülebilir kuşak döngüsü
//   LIFESPAN  : her sakinin ömrü (yaş olarak; 1 yaş = AGING.daysPerYear oyun günü) 66-75 arasından kimliğinden ve tohumdan türetilir
//               (Venerable.lifespanFor: izole üreteç, ana üretece dokunmaz). Kıdemli Bilge / Saygın Büyük bu yaşa ulaştığı gün dönümünde (00:00) vefat eder.
//   VENERABLE : Kıdemli Bilge, Ocak Devri'ni ve Yadigâr Devri'ni tamamlayınca Saygın Büyük olur (kontrol her gün 19:00'da; Yadigâr töreni 18:00'dır).
//               hearthGraceAge: ocağını bu yaşa dek devredememiş (evlatları evlenmemiş) bilgenin devri muaf sayılır (kasaba kilitlenmesin).
//               sleepVenues: yatağı olmayan Saygın Büyük'ün geceleri sabahladığı yapılar (öncelik sırasıyla)
//   FATAL     : trajik kazalar. chance = yaralanma zarının hemen yanındaki ölümcül aralık (tek zar: üreteç akışı değişmez), minAble: kasabada en az bu kadar
//               sağlam yetişkin varsa (çekirdek iş gücü korunur) ölüm gerçekleşir. Seferde: yalnızca kafileden kaza geçiren (mishap) biri için ek zar.
// (29.2b) 80-90 yaşlık ömür 50-72 günlük koşularda hiç doğal vefat / Derin Yas getirmiyordu: ömür 66-75'e, Kıdemli Bilge yaşı 70'ten 65'e çekildi.
export const LIFESPAN = { min: 66, max: 75, seedOffset: 30 };
export const VENERABLE = { checkHour: 19, hearthGraceAge: 68, sleepVenues: ['academy', 'inn', 'townHall', 'library'] };
export const FATAL = { fire: 0.015, raid: 0.02, expedition: 0.02, minAble: 6 };

/** Kayıttan gelen ömür: geçerli değilse null (LifecycleSystem kimlikten atar). */
export function sanitizeLifespan(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= LIFESPAN.min && n <= LIFESPAN.max ? n : null;
}
