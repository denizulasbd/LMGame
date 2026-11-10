// (25. aşama, 25.1) Yaşam evreleri ve yaş döngüsü: Çocuk -> Genç -> Yetişkin -> Kıdemli Bilge.
// Hesaplar src/systems/LifeStages.js (saf) ve LifeStageSystem.js'te (durum değiştirir); burada yalnızca sayılar ve adlar var.
//
// İlke: Pikselköy'de ÖLÜM YOKTUR. Yaşlanan sakin oyundan silinmez; "Kıdemli Bilge" unvanı kazanır, ağır işlerden emekli olur
// ve çardakta, bankta, meydan havuzunda ya da Bilgelik Evi'nde vakit geçirerek kasabaya bilgelik katar.
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
// Kuruluş sakinlerinin en yaşlısı (66) ilk kez yaklaşık 57-64. günlerde bilgeleşir (çocuklar 18 yaşında Genç olur).
export const AGING = {
  daysPerYear: CONFIG.DAYS_PER_SEASON * 4,
  youthUntil: 21,
  elderAt: 70,
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
