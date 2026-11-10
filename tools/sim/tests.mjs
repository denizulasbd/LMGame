// Hedefli testler: oyunun kurallarını tarayıcıda, gerçek sistemlerle tek tek dener.
// Kullanım: node tools/sim/tests.mjs   (sunucu: python3 tools/serve.py)
//   10. aşama: yiyecek değeri, seviye kilitleri, eski usul / asıl tarif, tüccar malları, belediye, unvan, yerleşim
//   11. aşama: hastalık ve şifacı, kasaba hayvanları ve sevme, yaban hayatının ürkmesi, karar olayları (zaman aşımı,
//              fırtına hasarı ve onarım, keşif seferi), belediye fermanları, kayıt gidiş-dönüşü
//   12. aşama: Gelişmiş Şehir eşiği, karar seçeneklerinin GameState'te olması, Kadim Tılsım şans sayacı (en geç 3.
//              seferde), Bilgelik Evi araştırmaları ve etkileri, okul ve Kalfa mezun, liman yerleşimi, ihracat
//              sandığı, ticaret teknesinin seferi ve Kasaba Hazinesi, üç aşamalı Harika ve 9. hedef
//   13. aşama: lüks mallar (baharat, ipek ve mermer), beş yadigâr ve artan fiyatları, etkileri (gerçek üretim dahil),
//              altın fermanları (ikramiye, 3 kat hızlı inşaat), kemer / çit / kiraz / çardak, sakin adı, işçi sabitleme,
//              Kasaba Arşivi ve sayaçlar, fotoğraf modu
//   14. aşama: tekne kapasitesi ve Büyük İhracat Seferi, sabah sisi ve yaz fırtınası (şimşek), dört mevsim festivali
//              (duyuru, yer, süsleme, katılım, anı, Mevsim Coşkusu), anılar ve nostalji, hayvan sevme, öncelikli kesim,
//              Toplanma Zili
//   16. aşama: maceralı keşif seferi (risk, usta ve alet, kaza, dönüş, anı, hikâye), egzotik ganimetler (asma, meşale,
//              harita, yadigâr parçası), harabe yazıtları ve imar şemaları, kayıt sürümü 14
//   18. aşama: inşa menüsü sekmeleri, zemin fırçaları (maliyet, hız, kesintisiz sürükleme, otomatik viraj / kavşak),
//              yağmurda çamur, A*'ın yolları öncelikli kullanması, yıkım fırçası (%50 iade, küsurat), ahşap çit ve kapı
//              bağlantıları, mahalle tabelası, çevre estetiği (keyif, anı, refah çarpanı), karanlık ve fener, park bankı,
//              süs ağaçlarının büyümesi ve gölgesi, kayıt sürümü 15
//   19. aşama: Türkçe ad ekleri, karakter huyları (dağıtım, kalıtım, Hayvansever / Kitap Kurdu / Müzisyen / Doğa Tutkunu
//              davranışları), flört ve randevu (çardak, han, yan yana iki bank; ilişki bonusu, ilk randevu anısı, bankta aşk),
//              evlenen çiftin aynı kulübeye taşınması ve boşalan kulübenin göçmenlere açılması, meydanda düğün kutlaması ve
//              konfeti, evli çiftin akşam yemeği, dedikodu (haber oluşturma, sohbette ve selamlaşırken aktarma, Yaşam Günlüğü
//              notu, yayılma, eskime), Karakter Detay Kartı'nın Sosyal Hayat bölümü, kayıt sürümü 16
//   20. aşama: Ulu Saat Kulesi (Kasaba seviyesi + 20 sakin, üç aşama ve malzemeleri, ustalık katkısı, Kadim Dişli dökümü,
//              Tarihçe'ye yazılan emek), Altın Çağ (çalışma şevki ve refah +%10, 08:00 / 18:00 çanı ve ses dalgası, Çağ
//              Kutlaması), prestij peyzajı (Mermer Çeşme, Altın Çağ Feneri), tüccarın nadir malları, Tarihçe Kütüğü sekmesi,
//              kayıt sürümü 17
//   21. aşama: kişisel kese ve çanta (harçlık, yuvalar, istif, yevmiye, iş yerinden pay, çantadan yemek, şifalı ot,
//              pazar alışverişi, han azığı, Kişisel Kese & Çanta kartı), vatandaş dilekçeleri (huy / meslek eşlemesi,
//              oluşma, kabul, hemen karşılama, ret, süre dolması, stok / alet / buluşma, kart ve üst çubuk), Yönetim Güveni
//              (refah, açlık, soğuk, şenlik), isyan (12 saatlik eşik, isyancılar, alarm), yağma (kasaba deposundan
//              yağmacıların çantasına / kesesine birebir), yatıştırma (erzak ve altın dağıtımı), kayıt sürümü 18
//   22. aşama: iç vergi kademeleri (keselerden hazineye birebir, öşür, güven / keyif / verim etkileri, takvim, panel
//              düğmeleri), Krallık Vergisi (ölçeklenme, 2 gün önce tahsildar uyarısı, ödeme, malla ödeme, ceza), Kraliyet
//              Fermanları (seviye kilidi, beş ferman, teslim ve ödüller, Kraliyet Beratı ve Aslanlı Heykel, süre dolması ve
//              ret cezası), kötü şöhretin göçe etkisi, köyü terk etme (eşik, aile, çekirdek sakinler, referans temizliği,
//              bitişi), kayıt sürümü 19
//   23. aşama: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi ve bekçiler, haydut baskınları, hasar / tamir, yaralanma, kayıt sürümü 20
//   24. aşama (24.1): bahçenin ekim tercihi (Buğday / Keten / Şerbetçiotu; değiştirme döngüsü, geçersiz seçimler, gerçek hasat,
//              ilk mal, etkinlik metni, kışın donma), Mallar listesindeki yeni kalemler, Ürün Silosu (seviye kilidi, +150 tarımsal
//              kapasite, iki silo, fırının ekmek deposu), silosuz kasabada yağmurda / kışın mahsul bozulması ve silonun koruması,
//              Ekim Tercihi paneli, tarla ve silo görselleri, kayıt sürümü 21 (gidiş-dönüş, bozuk değerler, v20 kaydı)
//   24. aşama (24.2): Dokuma Tezgâhı ve Şerbethane (tanım, Kasaba kilidi, 2:1 girdi-çıktı oranları gerçek performWork ile, ilk mal,
//              malzemesizken / depo doluyken / kasaba açken boşta kalma), lüks iş önceliği (temel yuvalar önce, dolunca tezgâha), gerçek
//              vardiya (sabit dokumacı, yevmiye, deneyim), han ikmali, handa şerbet (+15 keyif, iki kat keyif ve sosyallik, Keyifli
//              Damak), Şerbet Testisi alma / içme, Dayanıklı Giysi (mevsim, kumaş stoğu, soğuk koruması), kumaşın refah katkısı, HUD ve
//              paneller, görseller, kayıt sürümü 22 (gidiş-dönüş, bozuk değerler, v21 kaydı)
//   24. aşama (24.3): Ticaret İskelesi / Kervan Konağı (tanım, Kasaba kilidi, yol / su kenarı yerleşimi, gemi ya da kervan), takvim
//              (ilk varış, 24 saat, 3 ve 4 günlük aralık, hasarlı iskele, gerçek saatler), ihracat sözleşmeleri (tamamlama, ikinci kez
//              ödenmeme, yetersiz mal, günlük), hammadde ithalatı (paketler, stok, altın, depo yeri), pazar doygunluğu (3 peş peşe satış,
//              düşüş, başka malla ve ziyaretle toparlanma, taban), panel ve tek tıkla tamamlama, görseller, kayıt sürümü 23 (gidiş-dönüş,
//              bozuk değerler, v22 kaydı)
//   25. aşama (25.1): yaşam evreleri (Çocuk / Genç / Yetişkin / Kıdemli Bilge; veri, saf hesaplar, doğum günleri), karakter modeli
//              ve profiller, gün dönümünde yaşlanma (ziyaretçi hariç, gerçek saatle), 70 yaşında bilgelik (olay, bildirim, Kasaba
//              Günlüğü, anı, ölmeme), görseller (kır saç, baston, oturunca bırakılan baston, genç fuları, çocuk silüeti), emeklilik
//              (iş bulucu, itfaiye / savunma, sefer), çekirdek sakin güvencesi (gönüllü usta ve yeniden emeklilik), refah katkısı,
//              boş zaman tercihleri, Bilge Nasihati (menzil, uyku, gönüllü), Genç -> Yetişkin, ana üreteçlerin tüketilmemesi, gönül
//              ilişkisinde kuşak yaşı, Karakter Detay Kartı rozeti, kayıt sürümü 24 (gidiş-dönüş, bozuk değerler, v23 kaydı)
//   25. aşama (25.2): Usta-Çırak (dallar, çırak işleri, uygunluk, usta seçimi, kontenjan, kapalı kapıda etkisizlik ve izole üreteç,
//              çırak yazma, plan (ustası yokken / kıtlıkta işe döner), öğrenme, Gururlu Usta ve +%5 verim, Çırak İşi ve Pazar satışı,
//              metin baloncukları, gerçek mesai, kart ve atölye paneli, kayıt sürümü 25, Çırak Kapısı ve mezuniyet)
//   25. aşama (25.3): sekiz huy ve kuruluş dağıtımının dört huyla kalması, Altın Çağ kapısı, Aile etkisi (~%60) ve özgün gelişim,
//              Usta etkisi ve mesleğin doğası, Zanaatkâr şevki, Pazar sıklığı, malzeme, Girişimci tutumluluğu ve pazarlık payı,
//              sözleşme sevinci, Şenlik testisi / aurası, Bilge Düşünür nasihati, mizaç sözleri, çırak işini saklama, üç yeni dilekçe,
//              izole üreteç, kart rozeti ve mizacın kaynağı, kayıt sürümü 26 (gidiş-dönüş, bozuk değerler, v25 kaydı)
//   25. aşama (25.4): Aile Kütüğü (kuşak, doğum ebeveynleri, ocak, çocuklar; doğum ve göç), kuşak adları, birinci derece kan bağı
//              engeli (ebeveyni ayrılmış kardeşler dahil), 2. kuşak ilk düğünü (Tarihçe, günlük), Altın Çağ kapısı, Yeni Yuva, Geniş Aile,
//              Yeni Konut Talebi, Ocak Devri, kart ve ev paneli, izole üreteç, kayıt sürümü 27 (gidiş-dönüş, bozuk değerler, v26 kaydı)
//   25. aşama (25.5): altı aile yadigârı ve kilidi (takeItem reddeder, kayıt bilgisi), meslek / kişiliğe göre yadigâr ve hikâyesi,
//              Altın Çağ kapısı, oluşma ve çantada yer açma, mirasçı önceliği (aynı meslekten evlat, en yaşlı evlat, çırak, manevi
//              evlat), çırak geçmişi, akşam töreni, veda sözleri, Tarihçe ve Kuşak Şöleni, Ata Mirası Gururu, kart çerçevesi, köyden
//              ayrılan taşıyıcı ve arşiv, ocak devri, izole üreteç, kayıt sürümü 28 (gidiş-dönüş, bozuk değerler, v27 kaydı)
//   27. aşama (27.3): sıfır tahsisatlı çizim (GuestEffects sabit işlev + RenderQueue.addCall, balon genişliği önbelleği, FairDecor yeniden
//              kullanılan dikdörtgenler), tıklanabilir gezgin konuk ve misafir kartı (süre, ayrılış, takas özeti), havuz panelinde Büyük
//              Ziyafet Sofrası bloğu (kademe, bağışlar, ikram, bonuslar), çıraklık bekleme nedeni, yadigâr devir zinciri satırı
//   27. aşama (27.2): tıkanan mekanikler (boştaki atölyede / dolu raflı şifacıda Tezgâh Pratiği, ot toplayan şifacı ustası, hasarlı / yanan
//              yapıya çırak yazılmaması ve ders ortası güvenlik, sonradan evlenen evlada ve ev halkına Ocak Devri, kütükteki reislik, Altın Çağ
//              başlarken bekleyen çiftlerin yuvası, sınırlı ve gerçek buluşmayla karşılanan Yeni Konut Talebi, yadigârı olan mirasçının
//              atlanması, çalışma zamanında 12 çırak sınırı, Altın Çağ'da yeni nesil huy dilekçelerinin önceliği, izole üreteçler)
//   27. aşama (27.1): kayıt bütünlüğü ve onarımlar (ziyafette eatenIds ile çift ikramın önlenmesi, 0..1'e kilitli ve depo sınırlı iade,
//              panayır iptalinde / hazırlıkta erzak iadesi, kayda giren panayır katılımcıları, simülasyonda biten konuşma balonları ve salt
//              okunur çizim, konuğun Entity kimlik sayacını ilerletmemesi, ayrılan konuğun kayıt / yüklemede çıkışa yürümesi, tıkanınca yeniden
//              rota, seferdeki / göç eden sakinin çekirdek kadrodan düşmesi, emekli bilgenin sabit iş yuvasını kilitlememesi)
//   26. aşama (26.3): Gezgin Konuklar (Seyyar Ozan, Nadir Takasçı, Yaşlı Seyyah: Altın Çağ kapısı, 09:00 giriş, 24-48 saat kalış, panayıra yakınlık,
//              geçici misafir: nüfus / konut / iş gücü etkilenmez, ozan ezgisi, nadir takaslar ve rezerv, masal ve bilgelik, gece dinlenme, ayrılış), çizim,
//              izole üreteç (seed + 34), kayıt sürümü 31 (gidiş-dönüş, bozuk değerler, süresi dolmuş konuk, v30 kaydı)
//   26. aşama (26.2): Büyük Ziyafet Sofrası (üç seviye, gıda güvencesi: kişi başı 3 besin, panayır dışında / Altın Çağ öncesinde sofra yok, 06:00 kuruluş,
//              mesai korunur, 18:00 bonuslar ve güven, ikram, Keyifli Damak, 2 kat şifa, huy sözleri, 22:00 toplanma ve iade), çizim, izole üreteç
//              (seed + 33), kayıt sürümü 30 (gidiş-dönüş, bozuk değerler, v29 kaydı)
//   26. aşama (26.1): dört mevsimlik panayır (Bahar Çiçek Panayırı, Yaz Güneşi Şenliği, Hasat Bayramı, Kış Dönümü Ateşi), Altın Çağ kapısı
//              (erken oyun aynı kalır, eski mevsim festivali devri), 06:00 hazırlık / 08:00 - 17:00 mesai / 18:00 - 22:00 şenlik /
//              22:00 kapanış, harita matrisinin değişmemesi, Panayır Coşkusu, Şenlik Neşesi 2. kuşak dansçı, Kıdemli Bilge nostaljisi,
//              ayrı metin katmanı, Tarihçe'deki ilk panayır, çizim, izole üreteç (seed + 32), kayıt sürümü 29 (gidiş-dönüş, bozuk değerler, v28 kaydı)
//   15. aşama: sosyal denge (gönül alma yerleri, el sıkışma, yerli barışma anısı), meslek kıyafetleri ve zanaat
//              rozeti, usta işi eserler (üretim, sergileme, satış, refah), kayıt sürümü 13
import { openGame, createChecks } from './lib.mjs';

const { browser, page, errors } = await openGame({ seed: 5 });
const { results, report } = createChecks();

const pageResults = await page.evaluate(async () => {
  const game = window.game;
  const sim = window.sim;
  const scene = game.scenes.current;
  const s = game.state;
  const eco = scene.economy;
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok: Boolean(ok), detail: String(detail) });
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const rich = () => sim.give({ wood: 250, stone: 250, food: 200, iron: 60, wool: 60, bread: 60 });
  const hours = (h) => sim.step(Math.round(h * 225));
  const plaza = scene.world.landmarks.plaza;
  // 26. aşama öncesi bölümler panayırsız bir dünyada yazıldı: Altın Çağ'dan sonra panayır (ve Büyük Ziyafet Sofrası) kurulursa o bölümlerin
  // geçmişe bağımlı (kelebek etkili) beklentileri kayar. Panayır 26.1 bölümünde açılır; eski bölümler aynen yazıldıkları dünyada koşar.
  const { FairSystem: FairClass } = await import('/src/systems/FairSystem.js');
  const realPrepare = FairClass.prototype.prepare;
  FairClass.prototype.prepare = () => false;
  const { GuestSystem: GuestClass } = await import('/src/systems/GuestSystem.js');
  const realArrive = GuestClass.prototype.arrive;
  GuestClass.prototype.arrive = () => false; // gezgin konuklar 26.3 bölümüne kadar kapalı (aynı gerekçe)

  // ===== 10. aşama =====
  // Yiyecek değeri
  sim.give({ food: 0, bread: 2 });
  s.pantry.credit = 0;
  let r = eco.consumeFood(3);
  check('ekmekle öğün ve dilim payı', r.ok && r.bread && s.resources.bread === 0 && near(s.pantry.credit, 2));
  sim.give({ food: 2, bread: 0 });
  s.pantry.credit = 0.5;
  r = eco.consumeFood(3);
  check('yetersiz besin reddedilir', !r.ok && s.resources.food === 2);
  sim.give({ food: 4, bread: 3 });
  s.pantry.credit = 0;
  r = eco.consumeFood(1, { preferRaw: true });
  check('aşçı önce ham yiyecek kullanır', r.ok && !r.bread && s.resources.food === 3);
  const { immigrationStatus, formatTownTitle, townWorkMultiplier, tierChecks, townHappiness } = await import('/src/systems/TownStatus.js');
  sim.give({ food: 0, bread: 10 });
  check('göç koşulu ekmeği sayar', immigrationStatus(s).checks.find((c) => c.key === 'food').ok);

  // Seviye kilitleri
  rich();
  const lockHall = scene.construction.checkPlacement('townHall', plaza.centerX + 5, plaza.centerY + 5);
  check('belediye Kasaba seviyesinde açılır', !lockHall.ok && lockHall.reason.includes('Kasaba'), lockHall.reason);
  const lockMill = scene.construction.checkPlacement('mill', plaza.centerX + 5, plaza.centerY + 5);
  check('değirmen Köy seviyesinde açılır', !lockMill.ok && lockMill.reason.includes('Köy'), lockMill.reason);

  // Tarifler
  sim.place('storage');
  const workshop = sim.place('workshop');
  sim.give({ wood: 100, stone: 100, food: 100, wool: 0, iron: 0 });
  check('ağıl yokken palto eski usulle', scene.crafting.recipeFor('winterCoat').kind === 'fallback');
  check('maden yokken alet eski usulle', scene.crafting.recipeFor('sturdyTool').kind === 'fallback');
  rich();
  const farm = sim.place('sheepFarm');
  sim.give({ wool: 0 });
  check('ağıl varken yün beklenir', String(scene.crafting.recipeFor('winterCoat').reason).includes('Yün bekleniyor'));
  sim.give({ wool: 3, wood: 10 });
  workshop.craftMode = 'winterCoat';
  scene.crafting.work(workshop, 1);
  check('palto yünden yapılır', workshop.craft?.recipe === 'material' && s.resources.wool === 0);

  // Tüccar
  const { offersFor, offerStock } = await import('/src/data/trade.js');
  check('Mezra tüccarı temel mallar', !offersFor('spring', 1).some((o) => o.id === 'woolBale'));
  check('Kasaba tüccarı kervan malları', ['woolBale', 'breadBasket', 'sellWool'].every((id) => offersFor('spring', 3).some((o) => o.id === id)));
  check('stok seviyeyle artar', offerStock(offersFor('spring', 1)[0], 4) === offersFor('spring', 1)[0].stock + 3);

  // Unvan ve yerleşim
  const { TOWN_TIERS } = await import('/src/data/town.js');
  check('unvan', formatTownTitle('Yeşilvadi', TOWN_TIERS[2]) === 'Yeşilvadi Kasabası');
  check('unvan tekrarı yok', formatTownTitle('Ayışığı Köyü', TOWN_TIERS[2]) === 'Ayışığı Köyü · Kasaba');
  check('Gelişmiş Şehir için belediye gerekir', tierChecks(s, TOWN_TIERS[3]).some((c) => c.key === 'townHall'));
  {
    const map = scene.world.map;
    let spot = null;
    for (let y = 5; y < map.height - 8 && !spot; y++) {
      for (let x = 5; x < map.width - 8 && !spot; x++) {
        let clear = true;
        for (let yy = y - 1; yy <= y + 4 && clear; yy++)
          for (let xx = x - 2; xx <= x + 3 && clear; xx++)
            if (map.get(xx, yy) !== 'grass' || map.getObject(xx, yy) || map.getOccupant(xx, yy) || !scene.world.isReachable(xx, yy)) clear = false;
        if (clear) spot = { x, y };
      }
    }
    const ring = [];
    for (let xx = spot.x - 1; xx <= spot.x + 2; xx++) ring.push({ x: xx, y: spot.y + 3 });
    ring.push({ x: spot.x - 1, y: spot.y + 2 }, { x: spot.x + 2, y: spot.y + 2 });
    for (const t of ring) map.setObject(t.x, t.y, 'rock');
    scene.world.refreshStaticData();
    check('kendi girişini koparan yapı reddedilir', !scene.construction.checkPlacement('lumberHut', spot.x, spot.y).ok);
    for (const t of ring) map.setObject(t.x, t.y, null);
    scene.world.refreshStaticData();
  }

  // ===== 11. aşama =====
  // --- Hastalık ve şifacı ---
  const { ILLNESS, VIGOR } = await import('/src/data/health.js');
  const { healthWalkMultiplier, healthWorkMultiplier } = await import('/src/systems/HealthSystem.js');
  const patient = s.characters.find((c) => !c.isChild);
  scene.health.fallIll(patient);
  check('hasta %35 yavaş yürür ve çalışır', near(healthWalkMultiplier(patient, s.totalMinutes), ILLNESS.walkSpeed) && near(healthWorkMultiplier(patient, s.totalMinutes), ILLNESS.workSpeed));
  rich();
  const hut = sim.place('healerHut');
  check('şifacı kulübesi kuruldu', Boolean(hut));
  hut.remedies = 2;
  const plan = scene.behavior.brain.decide(patient, 11);
  check('hasta şifacıya gider', plan.activity === 'heal' && plan.buildingId === hut.id, plan.activity);
  scene.behavior.endTask(patient);
  scene.behavior.startPlan(patient, plan, 11);
  for (let i = 0; i < 225 * 6 && patient.illness; i++) game.update(1 / 60);
  check('iksirle iyileşir ve Dinçlik alır', !patient.illness && (patient.buffs.vigor ?? 0) > s.totalMinutes && hut.remedies === 1, `iksir ${hut.remedies}`);
  check('dinç sakin %15 hızlı', near(healthWorkMultiplier(patient, s.totalMinutes), VIGOR.workSpeed));
  const other = s.characters.find((c) => !c.isChild && c !== patient);
  scene.health.fallIll(other);
  other.illness.remaining = 5;
  hours(0.2);
  check('hastalık kendiliğinden geçer', !other.illness);
  // Maruziyet: kışın dışarıda paltosuz üşüyen birikir
  const exposed = s.characters.find((c) => !c.isChild && c !== patient && c !== other);
  exposed.exposure = 0;
  const save = { day: s.time.day, heating: { ...s.heating } };
  s.time.day = 13; // kış
  s.heating.cold = true; // odun yok: herkes üşür
  scene.health.update({ gameMinutes: 60, simDt: 0, realDt: 0, hour: 12 });
  check('soğukta maruziyet birikir', exposed.exposure > 3, exposed.exposure.toFixed(1));
  s.time.day = save.day;
  s.heating = save.heating;

  // Şifacı işi: ot toplar, iksir hazırlar
  hut.herbs = 0;
  hut.remedies = 0;
  const brew1 = scene.behavior.apothecaryWork(hut, { activity: 'gatherHerbs' }, 60);
  check('şifacı ot toplar', brew1 && hut.herbs > 1, hut.herbs.toFixed(2));
  hut.herbs = 6;
  scene.behavior.apothecaryWork(hut, { activity: 'brew' }, 90);
  check('otlardan iksir hazırlanır', hut.remedies >= 2 && hut.herbs < 6, `iksir ${hut.remedies} ot ${hut.herbs}`);

  // --- Kasaba hayvanları ---
  s.town.tier = 2;
  s.animalMeta.lastPetDay = 0;
  const before = s.animals.filter((a) => a.isPet).length;
  scene.animals.petArrival();
  check('Köy seviyesinde kedi gelir', s.animals.filter((a) => a.kind === 'cat').length === 1 && before === 0);
  scene.animals.petArrival();
  check('günde en çok bir hayvan gelir', s.animals.filter((a) => a.isPet).length === 1);
  s.animalMeta.lastPetDay = 0;
  scene.animals.petArrival();
  check('ertesi gün köpek gelir', s.animals.some((a) => a.kind === 'dog'));
  const cat = s.animals.find((a) => a.kind === 'cat');
  cat.mode = 'idle';
  cat.timer = 99;
  const lover = s.characters.find((c) => !c.isChild && c.visible && !c.task?.phase);
  const petter = lover ?? s.characters.find((c) => c.visible);
  petter.x = cat.x + 4;
  petter.y = cat.y;
  petter.lastPetAt = -9999;
  petter.needs.fun = 40;
  const funBefore = petter.needs.fun;
  for (let i = 0; i < 30 && petter.lastPetAt < 0; i++) scene.animals.petting(5);
  check('yanından geçen sakin hayvanı sever', petter.needs.fun > funBefore && cat.heart > 0, `keyif ${funBefore} -> ${petter.needs.fun.toFixed(1)}`);
  check('yaban hayatı yerleşti', s.animals.filter((a) => a.kind === 'rabbit').length >= 3 && s.animals.some((a) => a.kind === 'deer'));
  // Ürkme: bir sakini tavşanın dibine koy
  const rabbit = s.animals.find((a) => a.kind === 'rabbit' && a.visible);
  if (rabbit) {
    const walker = s.characters.find((c) => c.visible && c !== petter) ?? petter;
    const keep = { x: walker.x, y: walker.y };
    walker.x = rabbit.x - 10;
    walker.y = rabbit.y;
    const dist0 = Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y);
    for (let i = 0; i < 40; i++) scene.animals.updateWild(rabbit, 1 / 15, 12);
    check('tavşan sakinden ürküp kaçar', Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y) > dist0 + 4, `${dist0.toFixed(0)} -> ${Math.hypot(rabbit.x - walker.x, rabbit.y - walker.y).toFixed(0)}`);
    walker.x = keep.x;
    walker.y = keep.y;
  }

  // --- Karar olayları ---
  const dil = scene.dilemmas;
  const paused0 = s.time.paused;
  check('olay açılır ve oyunu durdurur', dil.maybeStart('refugees') && s.dilemma.active?.id === 'refugees' && s.time.paused);
  sim.step(31 * 60); // 31 gerçek saniye
  check('süre dolunca varsayılan seçenek uygulanır', !s.dilemma.active && s.dilemma.history.refugees === s.time.day && s.time.paused === paused0);
  // Fırtına: risk -> hasar -> onarım
  rich();
  for (const t of ['lumberHut', 'quarry', 'garden']) sim.place(t);
  s.dilemma.history = {};
  dil.maybeStart('storm');
  game.events.emit('ui:chooseDilemma', { optionId: 'risk' });
  check('fırtına yaklaşıyor', s.dilemma.storm && !s.dilemma.storm.fortified);
  s.dilemma.storm.at = s.totalMinutes;
  game.update(1 / 60);
  const damaged = s.buildings.filter((b) => b.damaged);
  check('güçlendirilmemiş kasabada yapılar hasar alır', damaged.length >= 1, damaged.map((b) => b.type).join(','));
  game.update(1 / 60);
  check('hasarlı yapı çalışmaz', damaged.every((b) => b.idle));
  rich();
  const mend = scene.construction.startProject(damaged[0]);
  check('hasarlı yapı onarım projesi başlatır', mend.ok && damaged[0].project?.kind === 'mend', mend.reason);
  damaged[0].project.progress = damaged[0].project.work;
  scene.construction.completeProject(damaged[0]);
  check('onarılan yapı yeniden çalışır', !damaged[0].damaged);
  // Güçlendirilmiş fırtına hasarsız
  for (const b of s.buildings) b.damaged = false;
  s.dilemma.history = {};
  rich();
  dil.maybeStart('storm');
  game.events.emit('ui:chooseDilemma', { optionId: 'fortifyStone' });
  s.dilemma.storm.at = s.totalMinutes;
  game.update(1 / 60);
  check('güçlendirilmiş kasaba fırtınayı hasarsız atlatır', !s.buildings.some((b) => b.damaged));
  // Keşif seferi
  rich();
  s.dilemma.history = {};
  s.time.day = Math.max(s.time.day, 6);
  for (const c of s.characters) c.illness = null;
  const { DILEMMAS } = await import('/src/data/dilemmas.js');
  const req = DILEMMAS.expedition.requires;
  DILEMMAS.expedition.requires = {}; // küçük test kasabası (6 sakin) için nüfus koşulu kaldırılır
  const started = dil.maybeStart('expedition');
  DILEMMAS.expedition.requires = req;
  game.events.emit('ui:chooseDilemma', { optionId: 'scout' });
  const explorer = s.characters.find((c) => c.away);
  check('izci sefere çıkar', started && explorer && s.dilemma.expedition);
  const res0 = { ...s.resources };
  // (16. aşama) yolda açılan macera penceresi oyunu durdurur (30 sn sonra güvenli seçenek): sefer bitene dek beklenir
  for (let i = 0; i < 80 && (s.dilemma.expedition || s.characters.some((c) => c.away)); i++) hours(0.5);
  check('izci döner ve ganimet getirir', !s.characters.some((c) => c.away) && !s.dilemma.expedition && Object.keys(res0).some((k) => s.resources[k] > res0[k]));

  // --- Belediye fermanları ---
  s.town.tier = 3;
  rich();
  const hall = sim.place('townHall');
  if (!hall) check('belediye yeri', false, JSON.stringify(scene.construction.checkPlacement('townHall', plaza.centerX + 4, plaza.centerY - 6).reason));
  const { civicWorkMultiplier } = await import('/src/systems/TownStatus.js');
  check('belediye kuruldu ve iş verimi +%15', hall && near(civicWorkMultiplier(s), 1.15) && townWorkMultiplier(s) >= 1.15 - 1e-9);
  const { civicStatus } = await import('/src/systems/CivicSystem.js');
  sim.give({ wood: 120, stone: 120, iron: 50 });
  const cap0 = s.storageCapacity;
  game.events.emit('ui:civicProject', { id: 'storehouse' });
  check('depo genişletmesi +150 kapasite', s.storageCapacity === cap0 + 150 && s.civic.storageLevel === 1, `${cap0} -> ${s.storageCapacity}`);
  sim.give({ wool: 60, iron: 60 });
  game.events.emit('ui:civicProject', { id: 'craftGuild' });
  check('zanaat loncası kalıcı', s.civic.craftGuild && civicStatus(s, 'craftGuild').maxed);
  sim.give({ bread: 50, food: 50, wood: 60 });
  const happy0 = townHappiness(s);
  game.events.emit('ui:civicProject', { id: 'grandFeast' });
  check('büyük ziyafet bonusu ve refah', (s.buffs.grandFeast ?? 0) > s.totalMinutes && townHappiness(s) > happy0 && s.resources.bread === 0 && s.resources.food === 20);
  check('ziyafet bekleme süresi', !civicStatus(s, 'grandFeast').ok);

  // ===== 12. aşama =====
  // --- Rötuşlar: Gelişmiş Şehir eşiği, karar seçenekleri GameState'te, Kadim Tılsım şans sayacı ---
  check('Gelişmiş Şehir nüfus eşiği 25', TOWN_TIERS[3].requires.population === 25);
  s.dilemma.history = {};
  dil.maybeStart('refugees');
  const act = s.dilemma.active;
  check(
    'karar seçenekleri GameState\'te',
    act && Array.isArray(act.options) && act.options.length >= 2 && act.options.every((o) => typeof o.ok === 'boolean' && 'reason' in o) && act.options.some((o) => o.id === act.defaultId) && typeof act.title === 'string'
  );
  game.events.emit('ui:chooseDilemma', { optionId: act.defaultId });
  {
    const { EXPEDITION } = await import('/src/data/dilemmas.js');
    const hours0 = EXPEDITION.hours;
    EXPEDITION.hours = 2; // seferler kısa sürsün (ganimet ve sayaç kuralları aynı)
    const returns = [];
    const off = game.events.on('expedition:returned', (p) => returns.push(p.buff));
    const expedition = (counter = null) => {
      for (const c of s.characters) c.illness = null;
      s.dilemma.history = {};
      if (counter !== null) s.civic.expeditionsSinceTalisman = counter;
      const req2 = DILEMMAS.expedition.requires;
      DILEMMAS.expedition.requires = {};
      sim.give({ food: 200 });
      const ok = dil.maybeStart('expedition');
      DILEMMAS.expedition.requires = req2;
      const scout = s.dilemma.active?.options?.find((o) => o.id === 'scout');
      if (!scout?.ok) sim.log.push(`izci seçilemedi: ${scout?.reason} (${ok})`);
      game.events.emit('ui:chooseDilemma', { optionId: 'scout' });
      for (let i = 0; i < 40 && s.dilemma.expedition; i++) hours(0.5);
      return ok;
    };
    // Sayaç sıfırdan: üç seferin en az birinde (en geç üçüncüsünde) tılsım çıkmalı
    s.civic.expeditionsSinceTalisman = 0;
    const firstThree = [expedition(0), expedition(), expedition()];
    const firstTalisman = returns.indexOf('talisman');
    check('Kadim Tılsım en geç 3. seferde çıkar', firstThree.every(Boolean) && returns.length === 3 && firstTalisman >= 0 && firstTalisman <= 2, returns.join(','));
    // Sayaç 2'deyken (iki tılsımsız sefer) üçüncü sefer tılsımı kesin bulur ve sayaç sıfırlanır
    for (let round = 0; round < 3; round++) {
      returns.length = 0;
      expedition(2);
      if (returns[0] !== 'talisman' || s.civic.expeditionsSinceTalisman !== 0) break;
    }
    check('şans sayacı dolunca tılsım kesin', returns[0] === 'talisman' && s.civic.expeditionsSinceTalisman === 0 && (s.buffs.talisman ?? 0) > s.totalMinutes, `${returns[0]} sayaç ${s.civic.expeditionsSinceTalisman} ${sim.log.filter((l) => l.includes('izci')).join(' | ')}`);
    // Tılsımsız sefer sayacı artırır
    returns.length = 0;
    expedition(0);
    check('tılsımsız sefer sayacı artırır', returns[0] === 'talisman' ? s.civic.expeditionsSinceTalisman === 0 : s.civic.expeditionsSinceTalisman === 1, `${returns[0]} sayaç ${s.civic.expeditionsSinceTalisman}`);
    off();
    EXPEDITION.hours = hours0;
  }

  // --- Bilgelik Evi ve araştırmalar ---
  const { RESEARCH, SCHOOL } = await import('/src/data/research.js');
  const R = await import('/src/systems/ResearchSystem.js');
  s.town.tier = 1;
  check('Bilgelik Evi Köy seviyesinde açılır', !scene.construction.checkPlacement('academy', plaza.centerX, plaza.centerY + 8).ok && String(scene.construction.checkPlacement('academy', plaza.centerX, plaza.centerY + 8).reason).includes('Köy'));
  s.town.tier = 3;
  check('Bilgelik Evi yokken araştırma yapılamaz', !R.researchStatus(s, 'gears', scene.research.academies().length > 0).ok);
  rich();
  sim.give({ iron: 300, wool: 300, bread: 300 });
  const academy = sim.place('academy');
  check('Bilgelik Evi kuruldu', academy && scene.research.academies().length === 1);
  const wood0 = s.resources.wood;
  game.events.emit('ui:startResearch', { id: 'gears' });
  check('araştırma başlar ve maliyet ödenir', s.research.active?.id === 'gears' && s.resources.wood === wood0 - RESEARCH.gears.cost.wood);
  game.events.emit('ui:startResearch', { id: 'architecture' });
  check('aynı anda tek araştırma', s.research.active?.id === 'gears' && !R.researchStatus(s, 'architecture', true).ok);
  // Bilge mesaide çalışır ve araştırma ilerler (küçük test kasabasında diğer iş yerleri geçici olarak kapatılır)
  const closed = [];
  for (const b of scene.world.getCompleted()) {
    if (b === academy || !b.workerSlots) continue;
    for (const c of s.characters) if (!b.excludedWorkers.has(c.id)) closed.push([b, c.id]) && b.excludedWorkers.add(c.id);
  }
  for (let i = 0; i < 96 && !(s.time.hour >= 9 && s.time.hour < 12); i++) hours(0.25);
  let sage = null;
  for (let i = 0; i < 24 && !(sage && s.research.active.progress > 0); i++) {
    hours(0.25);
    sage ??= s.characters.find((c) => c.task?.activity === 'teach' && c.task.phase === 'perform');
  }
  for (const [b, id] of closed) b.excludedWorkers.delete(id);
  check('Bilge çalışır, araştırma ilerler', s.research.active && s.research.active.progress > 0, `${s.research.active?.progress?.toFixed(0)} · ${sage?.name ?? 'bilge yok'}`);
  scene.research.work(academy, RESEARCH.gears.work);
  check('araştırma tamamlanır', s.research.done.gears && !s.research.active);
  check('Gelişmiş Çarklar: maden, ocak, değirmen, oduncu +%20', ['quarry', 'ironMine', 'mill', 'lumberHut'].every((t) => near(R.researchProductionMultiplier(s, t), 1.2)) && R.researchProductionMultiplier(s, 'garden') === 1);
  scene.research.complete('architecture');
  check('Mimarlık Loncası: inşaat +%35, fırtına direnci x2', near(R.researchBuildMultiplier(s), 1.35) && R.stormResistance(s) === 2);
  scene.research.complete('herbalism');
  const patient2 = s.characters.find((c) => !c.isChild);
  scene.health.cure(patient2);
  check('Şifalı Bitki: tedavi x2, Dinçlik 24 saat', R.healSpeedMultiplier(s) === 2 && patient2.buffs.vigor - s.totalMinutes === 24 * 60);
  scene.research.complete('insulation');
  check('Kışlık Yalıtım: odun tüketimi -%25', near(R.researchHeatingMultiplier(s), 0.75));
  {
    // Gerçek ısınma kaynakları: yalıtımlı evlerin dakikalık odunu dörtte üçe iner
    const { heatingSources } = await import('/src/systems/HeatingSystem.js');
    const homesRate = () => heatingSources(s).filter((x) => x.building.type === 'cabin').reduce((a, x) => a + x.perMinute, 0);
    const withIns = homesRate();
    const done = s.research.done.insulation;
    delete s.research.done.insulation;
    const without = homesRate();
    s.research.done.insulation = done;
    check('yalıtımlı evler kışın daha az odun yakar', withIns > 0 && near(withIns / without, 0.75), `${(withIns * 1440).toFixed(1)} / ${(without * 1440).toFixed(1)} odun/gün`);
  }

  // --- Okul: çocuk ders dinler, büyüyünce Kalfa olur ---
  {
    const adults = s.characters.filter((c) => !c.isChild);
    const home = scene.world.getCompleted('cabin').find((b) => b);
    scene.family.welcomeChild(adults[0], adults[1], home);
    const kid = s.characters[s.characters.length - 1];
    home.occupants.delete(kid.id);
    Object.assign(kid, { task: null, visible: true, pose: 'stand', insideBuildingId: null });
    for (let i = 0; i < 120 && !(s.time.hour >= 9 && s.time.hour < 11); i++) hours(0.25);
    let sawSchool = false;
    for (let i = 0; i < 16; i++) {
      hours(0.25);
      if (kid.task?.activity === 'school' && kid.task.phase === 'perform') sawSchool = true;
    }
    check('çocuk ders saatinde okula gider', sawSchool && kid.schooling > 0, `öğrenme ${kid.schooling?.toFixed(0)} dk`);
    check('günlük ders sınırı', kid.schoolToday <= SCHOOL.minutesPerDay + 1, kid.schoolToday?.toFixed(0));
    kid.schooling = SCHOOL.graduateMinutes;
    const grads = [];
    const off = game.events.on('school:graduated', (p) => grads.push(p));
    scene.family.growUp(kid);
    off();
    const journeyman = (await import('/src/data/skills.js')).SKILL_LEVELS.find((l) => l.level === 2).xp;
    check('okulu bitiren çocuk büyüyünce Kalfa', grads.length === 1 && kid.educated && kid.skills[grads[0].skill] >= journeyman, grads[0]?.skill);
    const other = new (s.characters[0].constructor)({ name: 'Deneme', age: 5, traits: [], appearance: kid.appearance, homeId: home.id, growsUpAt: 0, parentIds: [] });
    other.schooling = 10;
    scene.research.graduate(other);
    check('okula yeterince gitmeyen çocuk Kalfa olmaz', !other.educated);
  }

  // --- Büyük Ticaret Limanı ve nehir ihracatı ---
  const { EXPORT } = await import('/src/data/trade.js');
  const H = await import('/src/systems/HarborSystem.js');
  s.town.tier = 2;
  check('liman Kasaba seviyesinde açılır', !sim.findSpot('harbor', 45));
  s.town.tier = 3;
  {
    const land = scene.construction.checkPlacement('harbor', plaza.centerX, plaza.centerY + 8);
    check('liman karada kurulamaz', !land.ok, land.reason);
  }
  rich();
  const harbor = sim.place('harbor', { maxRadius: 45 });
  if (harbor) s.trade.nextBoatAt = s.totalMinutes + 99999; // tekne testin istediği an gelsin
  check('liman nehir kıyısına kuruldu', harbor && ['left', 'right'].includes(harbor.orientation) && harbor.exportThreshold === EXPORT.defaultThreshold, harbor ? `${harbor.tileX},${harbor.tileY} ${harbor.orientation}` : 'yer yok');
  check('ikinci liman kurulamaz', !sim.findSpot('harbor', 45));
  // Hazine depo sınırını tanımaz
  const g0 = s.resources.gold;
  eco.add('gold', s.storageCapacity + 500);
  check('altın depo sınırına takılmaz', s.resources.gold === g0 + s.storageCapacity + 500);
  s.resources.gold = 0;
  // Sandık
  sim.give({ wood: 300, stone: 300, food: 120, wool: 90, iron: 60, bread: 140 });
  game.events.emit('ui:prepareCrate', { buildingId: harbor.id });
  check('ihracat sandığı hazırlanır', harbor.crate && harbor.crate.wood === 40 && harbor.crate.food === 20 && !harbor.crate.iron && s.resources.wood === 260, JSON.stringify(harbor.crate));
  // Tekne seferi: fazlalık + sandık
  game.events.emit('ui:setExportThreshold', { buildingId: harbor.id, threshold: 250 });
  check('fazlalık sınırı ayarlanır', harbor.exportThreshold === 250);
  sim.give({ wood: 480, stone: 450 });
  const stages = [];
  const offB = ['harbor:boatArriving', 'harbor:boatDocked', 'harbor:shipped'].map((n) => game.events.on(n, () => stages.push(n.split(':')[1])));
  let sawBoat = false;
  for (let i = 0; i < 96 && !(s.time.hour >= 7 && s.time.hour < 12); i++) hours(0.25);
  s.trade.nextBoatAt = s.totalMinutes;
  const woodDock = s.resources.wood;
  for (let i = 0; i < 100 && s.trade.shipments === 0; i++) {
    hours(0.25);
    if (scene.world.boats.length === 1 && s.trade.boat) sawBoat = true;
  }
  const shipped = s.trade.last;
  check('tekne nehirden gelip yanaşır ve yükler', stages.slice(0, 3).join(',') === 'boatArriving,boatDocked,shipped' && sawBoat, stages.join(','));
  check('fazlalık ve sandık ihraç edilir', shipped && shipped.cargo.wood > 40 && shipped.cargo.stone > 40 && s.resources.wood < woodDock && !harbor.crate && !shipped.cargo.iron, shipped && JSON.stringify(shipped.cargo));
  check('ihracat Kasaba Hazinesi\'ne altın getirir', s.resources.gold === H.cargoValue(shipped.cargo) && s.trade.goldEarned === s.resources.gold && s.trade.shipments === 1, `${s.resources.gold} altın`);
  check('tekne kapasitesi aşılmaz', Object.values(shipped.cargo).reduce((a, b) => a + b, 0) <= EXPORT.capacity);
  for (let i = 0; i < 60 && s.trade.boat; i++) hours(0.25);
  check('tekne nehrin öteki ucunda kaybolur', !s.trade.boat && scene.world.boats.length === 0 && s.trade.nextBoatAt > s.totalMinutes);
  offB.forEach((off) => off());
  game.events.emit('ui:setExportThreshold', { buildingId: harbor.id, threshold: null });
  check('ihracat kapatılabilir', harbor.exportThreshold === null && Object.keys(H.exportExcess(s, null)).length === 0);

  // --- Kasaba Harikası: üç aşama ---
  const { BUILDINGS } = await import('/src/data/buildings.js');
  // (20. aşama) Ulu Saat Kulesi: Kasaba seviyesinde ve 20 sakinle açılır
  s.town.tier = 2;
  check('Ulu Saat Kulesi Köy seviyesinde açılmaz', !sim.findSpot('wonder') && scene.construction.checkPlacement('wonder', plaza.centerX + 6, plaza.centerY + 6).reason.includes('Kasaba'));
  s.town.tier = 3;
  const popReason = scene.construction.checkPlacement('wonder', plaza.centerX + 6, plaza.centerY + 6).reason;
  check('Ulu Saat Kulesi 20 sakinle açılır', s.characters.length >= 20 || popReason.includes('20 sakine'), popReason);
  const keepPop = BUILDINGS.wonder.requiresPopulation;
  BUILDINGS.wonder.requiresPopulation = Math.min(keepPop, s.characters.length); // test kasabası küçük: nüfus koşulu geçici olarak karşılanır
  s.town.tier = 4;
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000, gears: 8 });
  {
    // Harikanın şantiyesi iptal edilebilir (tam iade); bitmiş harika yıkılamaz
    const gold0 = s.resources.gold;
    const site = sim.place('wonder', { instant: false });
    const cancel = site ? scene.construction.demolishAt(site.tileX, site.tileY) : { ok: false };
    check('harika şantiyesi iptal edilebilir', site && cancel.ok && !s.buildings.includes(site) && s.resources.gold === gold0, cancel.reason);
  }
  sim.give({ wood: 600, stone: 1200, iron: 600, wool: 400, bread: 500, gold: 3000, gears: 8 }); // iade depo sınırına takılır: yeniden ver
  const wonder = sim.place('wonder');
  const { MILESTONES } = await import('/src/data/milestones.js');
  const { milestoneProgress } = await import('/src/systems/MilestoneSystem.js');
  const pearl = MILESTONES.find((m) => m.id === 'pearl');
  check('Harika kuruldu: Temel (aşama 1/3)', wonder && wonder.wonderStage === 1 && !wonder.wonderComplete && milestoneProgress(pearl, s).current === 1);
  check('Harika yıkılamaz', !scene.construction.demolishAt(wonder.tileX, wonder.tileY).ok && s.buildings.includes(wonder));
  const { landmarkBonus } = await import('/src/systems/TownStatus.js');
  const landmarkW = landmarkBonus(s);
  const stone0 = s.resources.stone;
  game.events.emit('ui:startProject', wonder.id);
  check('Gövde aşaması başlar ve maliyeti ödenir', wonder.project?.kind === 'stage' && s.resources.stone === stone0 - BUILDINGS.wonder.wonder.stages[1].cost.stone);
  // İnşaatçılar aşamayı gerçekten yükseltir
  const p0 = wonder.project.progress;
  for (let i = 0; i < 160 && wonder.project && !(wonder.project.progress > p0); i++) hours(0.25);
  check('inşaatçılar aşamayı yükseltir', wonder.project && wonder.project.progress > p0, `${wonder.project?.progress?.toFixed(0)} ${sim.stamp()} iş: ${s.jobs.map((j) => `${j.type}:${j.buildingId}:${j.assignees.length}`).join(',')} görev: ${s.characters.map((c) => c.task?.activity ?? '-').join(',')}`);
  scene.construction.completeProject(wonder);
  check('Gövde tamamlandı (2/3)', wonder.wonderStage === 2 && milestoneProgress(pearl, s).current === 2 && !s.milestones.pearl);
  game.events.emit('ui:startProject', wonder.id);
  const wonderEvents = [];
  const offW = game.events.on('wonder:completed', (p) => wonderEvents.push(p));
  scene.construction.completeProject(wonder);
  offW();
  check('Görkemli Kule tamamlandı: altın çağ', wonder.wonderComplete && wonderEvents.length === 1 && !scene.construction.projectFor(wonder));
  check('9. hedef Vadinin İncisi tamamlandı', Boolean(s.milestones.pearl));
  check('altın çağ refahı +12', landmarkBonus(s) - landmarkW === 12, `${landmarkW} -> ${landmarkBonus(s)}`);
  check('ikinci harika kurulamaz', !sim.findSpot('wonder'));
  BUILDINGS.wonder.requiresPopulation = keepPop;

  // ===== 13. aşama =====
  const L = await import('/src/systems/Luxury.js');
  const { LUXURY_GOODS, RELIC_PRICES, RELIC_KEYS, GOLD_DECREES } = await import('/src/data/luxury.js');
  const { ACTIVITIES } = await import('/src/data/activities.js');
  const now = () => s.totalMinutes;
  // --- Lüks mallar: satıcı ve koşullar ---
  s.events.merchant.present = false;
  check('tüccar yokken tüccardan lüks mal alınamaz', !L.luxuryStatus(s, 'silkMarble', 'merchant').ok);
  s.resources.gold = 0;
  check('altın yetmezse alınamaz', String(L.luxuryStatus(s, 'silkMarble', 'harbor').reason).includes('Yetersiz altın'));
  rich();
  let inn = scene.world.getCompleted('inn')[0] ?? sim.place('inn');
  s.resources.gold = 400;
  game.events.emit('ui:buyLuxury', { id: 'spiceCrate', source: 'harbor' });
  check('baharat sandığı limandan alınır ve hana teslim edilir', s.resources.gold === 0 && (s.buffs.spices ?? 0) - now() === 96 * 60 && s.luxury.goldSpent === 400, `${s.resources.gold} altın`);
  {
    // Handa yemek yiyen sakin baharatlı yemekle hızlanır
    const eater = s.characters.find((c) => !c.isChild && !c.away);
    eater.task = { activity: 'innMeal', buildingId: inn.id, phase: 'perform', elapsed: 100, duration: 1 };
    scene.behavior.perform(eater, eater.task, ACTIVITIES.innMeal, { gameMinutes: 1, hour: 19, simDt: 1, realDt: 1 / 60 });
    check('handa yiyen sakin %25 hızlı çalışır ve yürür', L.isSpiced(eater, now()) && near(L.spiceWorkMultiplier(eater, now()), 1.25) && near(L.spiceWalkMultiplier(eater, now()), 1.25) && (eater.buffs.spiced - now()) === LUXURY_GOODS.spiceCrate.personal.hours * 60);
  }
  {
    const cabin = scene.world.getCompleted('cabin')[0];
    cabin.level = 2;
    const { townHappinessBonus } = await import('/src/systems/TownStatus.js');
    const bonus0 = townHappinessBonus(s);
    s.resources.gold = 700;
    game.events.emit('ui:buyLuxury', { id: 'silkMarble', source: 'harbor' });
    check('ipek ve mermer: Seviye 2 yapılara kalıcı prestij ve şenlik', s.luxury.silk && L.silkPrestige(s) >= 0.5 && townHappinessBonus(s) > bonus0 && (s.buffs.festival ?? 0) > now() && s.resources.gold === 100);
    s.resources.gold = 700;
    game.events.emit('ui:buyLuxury', { id: 'silkMarble', source: 'harbor' });
    check('ipek ve mermer bir kez alınır', s.resources.gold === 700 && L.luxuryStatus(s, 'silkMarble', 'harbor').done);
  }
  // --- Kasaba yadigârları ---
  check('ilk yadigâr 1.500 altın', L.relicPrice(s) === RELIC_PRICES[0] && L.relicPrice(s) === 1500);
  s.resources.gold = 40000;
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'merchant' });
  check('tüccar yokken yadigâr alınamaz', !L.hasRelic(s, 'sunSphere'));
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'harbor' });
  check('yadigâr alınır ve sergilenir; sıradaki pahalanır', L.hasRelic(s, 'sunSphere') && s.resources.gold === 38500 && L.relicPrice(s) === 3000);
  game.events.emit('ui:buyRelic', { id: 'sunSphere', source: 'harbor' });
  check('aynı yadigâr iki kez alınamaz', s.resources.gold === 38500);
  for (const id of ['cornucopia', 'guildSeal', 'compass', 'eternalFlame']) game.events.emit('ui:buyRelic', { id, source: 'harbor' });
  const relicTotal = RELIC_PRICES.reduce((a, b) => a + b, 0);
  check('beş yadigâr: 1.500 → 3.000 → 5.000 → 7.000 → 9.000', L.relicCount(s) === 5 && s.resources.gold === 40000 - relicTotal && L.relicPrice(s) === null && L.relicMask(s) === 31, `${s.resources.gold}`);
  check('Güneş Saati Küresi ve Bereket Boynuzu', near(L.relicProductionMultiplier(s, 'wood'), 1.1) && near(L.relicProductionMultiplier(s, 'food'), 1.1 * 1.25));
  check('Usta Lonca Mührü: deneyim +%30', near(L.relicXpMultiplier(s), 1.3));
  const H13 = await import('/src/systems/HarborSystem.js');
  check('Denizci Pusulası: tekne +%50 yük, altın +%20', H13.boatCapacity(s) === Math.round(EXPORT.capacity * 1.5) && H13.cargoValue({ wood: 100 }, L.relicExportValue(s)) === 120);
  {
    const { heatingSources } = await import('/src/systems/HeatingSystem.js');
    const rate = () => heatingSources(s).filter((x) => x.building.type === 'cabin').reduce((a, x) => a + x.perMinute, 0);
    const withFlame = rate();
    const saved = s.luxury.relics.eternalFlame;
    delete s.luxury.relics.eternalFlame;
    const without = rate();
    s.luxury.relics.eternalFlame = saved;
    check('Ebedi Ateş: evler %30 az odun yakar, üşüme yarıya iner', near(withFlame / without, 0.7) && near(L.relicColdMultiplier(s), 0.5));
  }
  {
    // Gerçek üretim: Güneş Saati Küresi ile aynı emek daha çok üretir
    const quarry = scene.world.getCompleted('quarry')[0] ?? sim.place('quarry');
    const worker = s.characters.find((c) => !c.isChild && !c.away && !c.illness);
    const run = () => {
      quarry.productionBuffer = 0;
      worker.task = { activity: 'mine', workBuildingId: quarry.id, buildingId: quarry.id, phase: 'perform', elapsed: 0, duration: 999 };
      scene.behavior.performWork(worker, worker.task, 60);
      return quarry.productionBuffer + quarry.producedToday;
    };
    quarry.producedToday = 0;
    const withSun = run();
    const saved = s.luxury.relics.sunSphere;
    delete s.luxury.relics.sunSphere;
    quarry.producedToday = 0;
    const without = run();
    s.luxury.relics.sunSphere = saved;
    worker.task = null;
    check('Güneş Saati Küresi üretim yapısında gerçekten +%10', without > 0 && near(withSun / without, 1.1), `${withSun.toFixed(2)} / ${without.toFixed(2)}`);
  }
  // --- Altın fermanları ---
  s.resources.gold = 3000;
  const fun0 = s.characters.reduce((a, c) => a + c.needs.fun, 0);
  game.events.emit('ui:goldDecree', { id: 'goldBonus' });
  const { buffMultiplier } = await import('/src/systems/TownStatus.js');
  check('Ustalara Altın İkramiye: 3 gün iş hızı +%20 ve keyif', s.resources.gold === 2000 && (s.buffs.goldBonus ?? 0) - now() === 72 * 60 && buffMultiplier(s, 'workSpeed') >= 1.2 - 1e-9 && s.characters.reduce((a, c) => a + c.needs.fun, 0) > fun0);
  game.events.emit('ui:goldDecree', { id: 'goldBonus' });
  check('altın fermanının bekleme süresi', s.resources.gold === 2000 && L.goldDecreeStatus(s, 'goldBonus').waitDays === GOLD_DECREES.goldBonus.cooldownDays);
  {
    // Kraliyet Mimarları: aynı inşaatçı aynı sürede 3 kat ilerletir
    const site = sim.place('storage', { instant: false });
    const builder = s.characters.find((c) => !c.isChild && !c.away && !c.illness);
    const job = s.jobs.find((j) => j.buildingId === site.id);
    const progress = () => {
      const before = site.buildProgress;
      builder.task = { activity: 'build', jobId: job.id, buildingId: site.id, phase: 'perform', elapsed: 0, duration: 999 };
      scene.behavior.performWork(builder, builder.task, 3);
      return site.buildProgress - before;
    };
    const normal = progress();
    game.events.emit('ui:goldDecree', { id: 'royalArchitects' });
    const royal = progress();
    builder.task = null;
    check('Kraliyet Mimarları: şantiyeler 3 kat hızlı', (s.buffs.royalArchitects ?? 0) > now() && normal > 0 && near(royal / normal, 3), `${normal.toFixed(2)} -> ${royal.toFixed(2)}`);
    scene.construction.demolish(site);
  }

  // --- Peyzaj: kemer, çit, kiraz, çardak ---
  rich();
  sim.give({ gold: 2000 });
  {
    const map = scene.world.map;
    // Yolun üstüne kemer: yol karosu kalır, altından geçilir
    let road = null;
    for (let r = 1; r < 30 && !road; r++) {
      for (let dy = -r; dy <= r && !road; dy++) {
        for (let dx = -r; dx <= r && !road; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if (map.get(x, y) === 'path' && map.getOccupant(x, y) === 0 && scene.construction.checkPlacement('marbleArch', x, y).ok) road = { x, y };
        }
      }
    }
    const arch = road && scene.construction.placeSite('marbleArch', road.x, road.y).building;
    if (arch) {
      const job = scene.jobs.jobs.find((j) => j.buildingId === arch.id);
      if (job) scene.jobs.cancel(job);
      scene.construction.complete(arch);
    }
    check('kemer yolun üstüne kurulur ve altından geçilir', arch && map.get(road.x, road.y) === 'path' && map.isWalkable(road.x, road.y) && map.getOccupant(road.x, road.y) === arch.id && scene.world.isReachable(road.x, road.y));
    check('kemerin üstüne başka yapı kurulamaz', arch && !scene.construction.checkPlacement('bench', road.x, road.y).ok);
    const neighbor = arch && [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: road.x + dx, y: road.y + dy })).find((t) => map.isWalkable(t.x, t.y));
    check('yol bulma kemerin içinden geçer', neighbor && scene.world.findPath(neighbor, { x: road.x, y: road.y }));
    window.__arch = arch && { id: arch.id, x: road.x, y: road.y };
    // Yan yana iki çit birleşir
    let spot = null;
    for (let r = 3; r < 30 && !spot; r++) {
      for (let dy = -r; dy <= r && !spot; dy++) {
        for (let dx = -r; dx <= r && !spot; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if (scene.construction.checkPlacement('flowerFence', x, y).ok && scene.construction.checkPlacement('flowerFence', x + 1, y).ok) spot = { x, y };
        }
      }
    }
    const f1 = scene.construction.placeSite('flowerFence', spot.x, spot.y).building;
    const f2 = scene.construction.checkPlacement('flowerFence', spot.x + 1, spot.y).ok ? scene.construction.placeSite('flowerFence', spot.x + 1, spot.y).building : null;
    for (const f of [f1, f2].filter(Boolean)) {
      const job = scene.jobs.jobs.find((j) => j.buildingId === f.id);
      if (job) scene.jobs.cancel(job);
      scene.construction.complete(f);
    }
    check('yan yana çiçekli çitler birleşir', f1?.connect?.right && f2?.connect?.left && !f1.connect.left);
    // Kiraz ağacı mevsimle değişir
    const cherry = sim.place('cherryTree');
    const { getStructureSprite } = await import('/src/art/sprites/index.js');
    check('kiraz ağacı kurulur, dört mevsim ayrı görünür', cherry && new Set(['spring', 'summer', 'autumn', 'winter'].map((season) => getStructureSprite('cherryTree', { season }))).size === 4);
    // Çardak: iki oturak; iki sakin oturup sohbet eder, arkadaşlık hızla gelişir
    const gazebo = sim.place('gazebo');
    const seats = gazebo ? scene.world.getGatherSpots(gazebo) : [];
    check('çardak kurulur, iki oturaklı', gazebo && seats.length === 2 && seats.every((t) => t.seat));
    const [a, b] = s.characters.filter((c) => !c.isChild && !c.away && !c.illness && c.visible).slice(-2);
    const brain = scene.behavior.brain;
    for (const c of [a, b]) scene.behavior.endTask(c);
    const planA = brain.planGathering(a, gazebo);
    scene.behavior.startPlan(a, planA, s.time.hour);
    const planB = brain.planGathering(b, gazebo, planA.spot);
    scene.behavior.startPlan(b, planB, s.time.hour);
    const rel0 = scene.relationships.get(a, b);
    let both = false;
    for (let i = 0; i < 12 && !both; i++) {
      hours(0.25);
      both = [a, b].every((c) => c.task?.activity === 'gazebo' && c.task.phase === 'perform');
    }
    hours(0.25);
    const sat = [a, b].every((c) => c.task?.activity === 'gazebo' && c.pose === 'sit');
    check('iki sakin çardakta oturup sohbet eder', both && sat, `${a.task?.activity}/${a.pose} ${b.task?.activity}/${b.pose}`);
    check('çardakta arkadaşlık gelişir (x1,6), aşk olasılığı x2,5', scene.relationships.get(a, b) > rel0 && ACTIVITIES.gazebo.friendshipMultiplier === 1.6 && ACTIVITIES.gazebo.romanceMultiplier === 2.5);
  }

  // --- Sakin adı ---
  {
    const c = s.characters.find((x) => !x.isChild);
    const other = s.characters.find((x) => x !== c);
    const old = c.name;
    game.events.emit('ui:renameCharacter', { id: c.id, name: '  Deniz  Ulaş  ' });
    check('sakinin adı değiştirilir', c.name === 'Deniz Ulaş' && c.customName && s.journal.at(-1).text.includes(old));
    game.events.emit('ui:renameCharacter', { id: c.id, name: other.name });
    game.events.emit('ui:renameCharacter', { id: c.id, name: '   ' });
    check('boş ya da başkasının adı verilemez', c.name === 'Deniz Ulaş');
    game.events.emit('ui:renameCharacter', { id: c.id, name: 'Çokuzunbiradıolankasabalı' });
    check('ad en çok 16 harf', c.name.length === 16);
    window.__renamed = { id: c.id, name: c.name };
  }

  // --- İşçi atama / sabitleme ---
  {
    const lumber = scene.world.getCompleted('lumberHut').find((b) => !b.damaged);
    lumber.excludedWorkers.clear();
    const adults = s.characters.filter((c) => !c.isChild && !c.away && c.visible);
    const pinned = adults[0];
    const free = adults[1];
    game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: pinned.id });
    check('sakin iş yerine sabitlenir', pinned.workplaceId === lumber.id);
    const origin = { x: pinned.tileX, y: pinned.tileY };
    const work = scene.jobs.findWorkFor(pinned, origin);
    check('sabit sakin yalnızca kendi iş yerinde çalışır', work === null || (work.building === lumber && !work.job));
    if (lumber.workerSlots === 1) {
      const other = scene.jobs.findWorkFor(free, { x: free.tileX, y: free.tileY });
      check('sabit çalışanın yuvası başkasına verilmez', !other || other.building !== lumber);
      game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: free.id });
      check('yuva sayısından fazla sakin sabitlenemez', free.workplaceId === null);
    }
    for (let i = 0; i < 96 && !(s.time.hour >= 9 && s.time.hour < 12); i++) hours(0.25);
    let worked = false;
    for (let i = 0; i < 16 && !worked; i++) {
      hours(0.25);
      worked = pinned.task?.workBuildingId === lumber.id;
      if (pinned.task?.jobId || (pinned.task?.workBuildingId && pinned.task.workBuildingId !== lumber.id)) break;
    }
    check('sabit sakin mesaide kendi iş yerine gider', worked, `${pinned.task?.activity} ${sim.stamp()}`);
    game.events.emit('ui:unpinWorker', { characterId: pinned.id });
    check('sabitleme kaldırılır', pinned.workplaceId === null);
    window.__pin = { id: free.id, buildingId: lumber.id };
    game.events.emit('ui:pinWorker', { buildingId: lumber.id, characterId: free.id });
  }

  // --- Kasaba Arşivi ve istatistikler ---
  {
    const len0 = s.history.length;
    const day0 = s.time.day;
    while (s.time.day === day0) hours(1);
    check('her gün başında arşive özet yazılır', s.history.length >= Math.min(64, len0 + 1) && s.history.at(-1).day === s.time.day && ['population', 'welfare', 'stock', 'gold'].every((k) => Number.isFinite(s.history.at(-1)[k])));
    const w0 = s.stats.weddings;
    const b0 = s.stats.births;
    const [x, y] = s.characters;
    game.events.emit('relationship:married', { a: x, b: y, venue: null, festival: false });
    game.events.emit('family:childBorn', { child: x, parents: [x, y], home: null });
    check('düğün ve doğum sayaçları', s.stats.weddings === w0 + 1 && s.stats.births === b0 + 1);
    s.stats.weddings = w0;
    s.stats.births = b0;
    const saved = s.history.slice();
    for (let i = 0; i < 80; i++) s.history.push({ ...saved.at(-1), day: -i });
    scene.stats.record();
    check('arşiv en çok 64 gün saklar', s.history.length === 64);
    s.history = saved;
    game.events.emit('ui:toggleStats');
    game.render(0);
    // (17. aşama) Arşiv ortalanmış bir penceredir: arkasında karartılmış zemin, köşede ✕
    const archive = document.querySelector('.archive-panel');
    const layerEl = document.getElementById('ui-layer');
    check(
      'Kasaba Arşivi ortalanmış pencerede açılır: 4 grafik ve tarih',
      archive && !archive.hidden && archive.classList.contains('modal-window') && layerEl.classList.contains('has-modal') && archive.querySelector('.modal-close') &&
        archive.querySelectorAll('canvas').length === 4 && archive.querySelectorAll('.archive-total').length >= 12
    );
    game.events.emit('ui:toggleStats');
    check('Arşiv kapanınca zemin karartması kalkar', archive.hidden && !layerEl.classList.contains('has-modal') && document.querySelector('.modal-backdrop').hidden);
    // Fotoğraf modu
    game.events.emit('ui:toggleCinematic');
    const layer = document.getElementById('ui-layer');
    check('fotoğraf modu arayüzü gizler', layer.classList.contains('is-cinematic') && scene.cinematic);
    game.render(0);
    game.events.emit('ui:toggleCinematic');
    check('fotoğraf modundan çıkılır', !layer.classList.contains('is-cinematic') && !scene.cinematic);
    game.events.emit('ui:toggleCinematic');
    s.dilemma.history = {};
    dil.maybeStart('bards');
    check('karar penceresi açılınca fotoğraf modu biter', !layer.classList.contains('is-cinematic') && !scene.cinematic);
    game.events.emit('ui:chooseDilemma', { optionId: s.dilemma.active.defaultId });
  }

  // ===== 14. aşama =====
  const clickAt = (wx, wy) => {
    // Haritaya gerçek bir sol tık: dünya noktasını ekrana çevirip girdiye bırakır, sahne bir karede işler
    const cam = scene.camera;
    game.input.pendingClick = { x: (wx - cam.x) * cam.zoom, y: (wy - cam.y) * cam.zoom };
    sim.step(1);
  };
  // --- Rötuş: tekne kapasitesi ve Büyük İhracat Seferi ---
  check('ticaret teknesi taban kapasitesi %35 arttı (864)', EXPORT.capacity === 864);
  {
    for (let i = 0; i < 60 && s.trade.boat; i++) hours(0.25);
    s.resources.gold = 100;
    check('Büyük İhracat Seferi altın ister', !H13.grandVoyageStatus(s).ok);
    sim.give({ gold: 1000, wood: 1600, stone: 1500, food: 900 });
    const gold0 = s.resources.gold;
    game.events.emit('ui:grandVoyage', { buildingId: harbor.id });
    check('Büyük İhracat Seferi ilan edilir, kervan hemen yola çıkar', s.resources.gold === gold0 - EXPORT.grandVoyage.price && s.trade.boat?.grand && s.trade.grandDay === s.time.day);
    check('aynı gün ikinci sefer ilan edilemez', !H13.grandVoyageStatus(s).ok);
    let shipped = null;
    const off = game.events.on('harbor:shipped', (p) => (shipped = p));
    for (let i = 0; i < 80 && !shipped; i++) hours(0.25);
    off();
    const units = shipped ? Object.values(shipped.cargo).reduce((a, b) => a + b, 0) : 0;
    check('kervan teknesi 2,5 kat yük alır ve 350 sınırına boşaltır', shipped?.grand && units > H13.boatCapacity(s) && units <= H13.boatCapacity(s, true), `${units} birim`);
    check('kervan yükü %10 daha değerli', shipped && shipped.gold === H13.cargoValue(shipped.cargo, L.relicExportValue(s) * EXPORT.grandVoyage.valueBonus));
  }

  // --- Hava: sis ve yaz fırtınası ---
  {
    const { WEATHER_TYPES } = await import('/src/data/weather.js');
    scene.weather.force('mist');
    hours(1.5);
    const left = (s.weather.nextChangeAt - s.totalMinutes) / 60;
    check('sabah sisi çöker (yoğunluk ve süre)', s.weather.mist > 0.9 && left > 0 && left <= 4.5, `${s.weather.mist.toFixed(2)} · ${left.toFixed(1)} sa kaldı`);
    check('sis dinlendirir: dışarıda keyif yavaş düşer', WEATHER_TYPES.mist.funDecay < 1);
    // Zar: yazın öğleden sonra fırtına çıkabilir, kışın çıkmaz
    const day0 = s.time.day;
    const type0 = s.weather.type;
    const rolls = { summer: 0, winter: 0 };
    for (let d = 0; d < 40; d++) {
      for (const [season, base] of [['summer', 5], ['winter', 13]]) {
        s.time.day = base + (d % 4) + 16 * Math.floor(d / 4);
        s.weather.type = 'sunny';
        if (scene.weather.rollSpecial(14) === 'thunderstorm') rolls[season]++;
      }
    }
    s.time.day = day0;
    check('gök gürültülü fırtına yalnızca yazın, ara sıra', rolls.summer > 3 && rolls.summer < 30 && rolls.winter === 0, JSON.stringify(rolls));
    scene.weather.force('thunderstorm');
    let flashes = 0;
    const off = game.events.on('weather:lightning', () => flashes++);
    sim.step(400);
    const rainPeak = s.weather.rain;
    sim.step(2000);
    off();
    check('fırtınada şimşek çakar ve gök gürler', flashes >= 2 && rainPeak > 0.9 && WEATHER_TYPES.thunderstorm.downpour > 1, `${flashes} şimşek · yağmur ${s.weather.rain.toFixed(2)} · ${s.weather.type} · duraklı ${s.time.paused}`);
    scene.weather.force(type0 === 'mist' || type0 === 'thunderstorm' ? 'sunny' : type0);
  }

  // --- Mevsim festivalleri ---
  {
    const { SEASON_FESTIVALS } = await import('/src/data/festivals.js');
    const SF = await import('/src/systems/SeasonFestivalSystem.js');
    check('festival günleri mevsimin son günü', SF.isFestivalDay(4) && SF.isFestivalDay(8) && SF.isFestivalDay(16) && !SF.isFestivalDay(5) && !SF.isFestivalDay(3));
    // Duyuru: festival günü sabah 08:00
    const day0 = s.time.day;
    const fday = day0 + ((4 - (day0 % 4)) % 4 || 0) || day0;
    s.time.day = SF.isFestivalDay(day0) ? day0 : day0 + (4 - (day0 % 4));
    const announced = [];
    const offA = game.events.on('seasonFestival:announced', (p) => announced.push(p.theme));
    scene.seasonFestivals.onHour(8);
    offA();
    check('festival günü sabah duyurulur', announced.length === 1 && s.seasonFestival.stage === 'announced' && SF.currentSeasonFestival(s)?.stage === 'announced');
    s.time.day = day0;
    s.seasonFestival.stage = null;
    for (const theme of ['spring', 'summer', 'autumn', 'winter']) {
      if (s.events.festival.active) scene.townEvents.endFestival();
      Object.assign(s.seasonFestival, { day: s.time.day, theme, stage: 'announced' });
      const started = scene.seasonFestivals.start();
      const f = s.events.festival;
      const venue = scene.world.getBuilding(f.venueId);
      const expectVenue = SEASON_FESTIVALS[theme].venues.find((t) => scene.world.getCompleted(t).length);
      check(`${SEASON_FESTIVALS[theme].name}: başlar, yeri ve süslemeleri kurulur`, started && f.active && f.theme === theme && venue?.type === expectVenue && s.seasonFestival.decor.length >= 1 && (s.buffs[SEASON_FESTIVALS[theme].buff] ?? 0) > s.totalMinutes, `${venue?.type} · ${s.seasonFestival.decor.map((d) => d.kind).join(',')}`);
      hours(1.5);
      const attendees = s.seasonFestival.attendees.length;
      if (theme === 'spring') check('Çiçek Şenliği: herkes saçına çiçek takar, aşk ve dostluk artar', s.characters.every((c) => c.flowerCrown) && buffMultiplier(s, 'romance') >= 2.5 && buffMultiplier(s, 'friendship') >= 1.8);
      if (theme === 'winter') check('Işıklar Gecesi: şölen ateşi festivaldekileri ısıtır, kardan adam yükselir', s.characters.filter((c) => s.seasonFestival.attendees.includes(c.id)).every((c) => (c.buffs.warmUntil ?? 0) > s.totalMinutes) && s.seasonFestival.decor.some((d) => d.kind === 'snowman'));
      const ends = [];
      const offE = game.events.on('seasonFestival:ended', (p) => ends.push(p));
      scene.townEvents.endFestival();
      offE();
      const memory = SEASON_FESTIVALS[theme].memory;
      const remembered = s.characters.filter((c) => c.memories.some((m) => m.text === memory)).length;
      check(`${SEASON_FESTIVALS[theme].name}: sakinler katılır, biter, anılara yazılır, Mevsim Coşkusu`, attendees >= 3 && ends.length === 1 && remembered === attendees && !s.events.festival.active && s.seasonFestival.held[theme] >= 1 && (s.buffs.seasonCheer ?? 0) > s.totalMinutes, `${attendees} katılımcı, ${remembered} anı`);
    }
    check('festival bitince çiçek taçları çıkar ve süslemeler kaldırılır', s.characters.every((c) => !c.flowerCrown) && s.seasonFestival.decor.length === 0);
  }

  // --- Anılar ve hatıralar ---
  {
    const { MEMORY, addMemory } = await import('/src/systems/MemorySystem.js');
    const [a, b] = s.characters.filter((c) => !c.isChild);
    const before = a.memories.length;
    game.events.emit('relationship:married', { a, b, venue: null, festival: true });
    check('düğün iki sakinin de anısına yazılır', a.memories.at(-1).text === `${b.name} ile şenlikte evlendi` && b.memories.at(-1).text === `${a.name} ile şenlikte evlendi` && a.memories.length === before + 1);
    game.events.emit('skill:levelUp', { character: a, skill: 'masonry', level: { level: 3, name: 'Usta' } });
    check('Usta unvanı anıya yazılır', a.memories.at(-1).text === 'Usta Taşçı unvanını kazandı');
    {
      // Kalabalıkta dostluk anıları sınırlı; en iyi arkadaşlık "dost oldu"nun yerini alır
      const others = s.characters.filter((c) => c !== a && c !== b);
      const friendLevel = { key: 'friend', name: 'Dost' };
      const kept = a.memories.slice();
      for (const o of others.slice(0, 7)) game.events.emit('relationship:levelUp', { a, b: o, level: friendLevel });
      const dostCount = a.memories.filter((m) => m.text.endsWith(' ile dost oldu')).length;
      // Bu testte dost olunanlardan, daha önce en iyi arkadaşı olmamış biri (anılar yinelenmez)
      const pal = others
        .slice(0, 7)
        .find((o) => a.memories.some((m) => m.text === `${o.name} ile dost oldu`) && !a.memories.some((m) => m.text === `${o.name} ile en iyi arkadaş oldu`));
      game.events.emit('relationship:levelUp', { a, b: pal, level: { key: 'bestFriend', name: 'En İyi Arkadaş' } });
      check('dostluk anıları sınırlı; en iyi arkadaşlık eski dostluk anısının yerini alır', dostCount <= MEMORY.friends && !a.memories.some((m) => m.text === `${pal.name} ile dost oldu`) && a.memories.at(-1).text === `${pal.name} ile en iyi arkadaş oldu`, `${dostCount} dostluk`);
      a.memories = kept;
    }
    game.events.emit('health:cured', { character: a, building: null, wasIll: true });
    check('hastalanıp iyileşmek anıya yazılır', a.memories.at(-1).text.includes("Şifacı'nın iksiriyle iyileşti"));
    const first = a.memories[0].text;
    for (let i = 0; i < 60; i++) addMemory(s, a, `deneme ${i}`, 'heart');
    check('anılar en çok 40; ilk anı korunur', a.memories.length === MEMORY.max && a.memories[0].text === first && a.memories.at(-1).text === 'deneme 59');
    check('her sakinin bir hayat hikâyesi var', s.characters.every((c) => c.memories.length >= 1));
    {
      // Defter dolunca önce küçük anılar (dostluk...) silinir; aynı anı yinelenmez
      const saved = b.memories.slice();
      b.memories = [saved[0]];
      addMemory(s, b, 'Düğün anısı', 'ring', { kind: 'wedding' });
      addMemory(s, b, 'Kaan ile dost oldu', 'heart', { kind: 'friend' });
      addMemory(s, b, 'Kaan ile dost oldu', 'heart', { kind: 'friend' });
      const dup = b.memories.filter((m) => m.text === 'Kaan ile dost oldu').length;
      for (let i = 0; i < 60; i++) addMemory(s, b, `dost ${i}`, 'heart', { kind: 'friend' });
      check('aynı anı yinelenmez; defter dolunca önce dostluk anıları silinir, düğün kalır', dup === 1 && b.memories.length === MEMORY.max && b.memories.some((m) => m.text === 'Düğün anısı') && b.memories[0] === saved[0]);
      b.memories = saved;
    }
    // Nostalji: sakin bankta otururken güzel bir anısını hatırlar
    a.recall = null;
    a.needs.fun = 40;
    const task0 = a.task;
    a.task = { activity: 'bench', phase: 'perform', elapsed: 0, duration: 60 };
    const recalled = [];
    const offR = game.events.on('memory:recalled', (p) => recalled.push(p));
    scene.memories.update({ gameMinutes: 2000 });
    scene.memories.update({ gameMinutes: 2000 });
    offR();
    a.task = task0;
    check('sakin bankta güzel bir anısını hatırlar: keyif ve anı balonu', recalled.length === 1 && recalled[0].character === a && a.needs.fun >= 40 + MEMORY.fun - 1e-6 && a.recall?.text === recalled[0].memory.text, `${recalled.length} kez`);
    game.events.emit('ui:selectCharacter', a.id);
    game.render(0);
    const rows = document.querySelectorAll('.memory-row').length;
    check('Karakter Paneli anıları listeler (son 5 / tümü)', rows === 5 && document.querySelector('.memory-toggle') && !document.querySelector('.memory-toggle').hidden, `${rows} satır`);
    game.events.emit('ui:selectCharacter', null);
  }

  // --- Oyuncunun dünyayla etkileşimi ---
  {
    // Kediyi / köpeği fareyle sevmek
    const pet = s.animals.find((x) => x.isPet && x.visible);
    const cheers = [];
    const offC = game.events.on('pet:cheered', (p) => cheers.push(p));
    scene.camera.centerOn(pet.x, pet.y, game.renderer.width, game.renderer.height);
    clickAt(pet.x, pet.y - 4);
    offC();
    check('kediye / köpeğe tıklayınca sevinçle zıplar, kalpler uçuşur', cheers.length === 1 && cheers[0].animal === pet && pet.cheer > 0, `${pet.kind} ${pet.name}`);
    // Öncelikli kesim: ağaca tıklamak
    const map = scene.world.map;
    let tree = null;
    for (let r = 2; r < 25 && !tree; r++) {
      for (let dy = -r; dy <= r && !tree; dy++) {
        for (let dx = -r; dx <= r && !tree; dx++) {
          const x = plaza.centerX + dx;
          const y = plaza.centerY + dy;
          if ((map.getObject(x, y) === 'oak' || map.getObject(x, y) === 'pine') && !scene.jobs.jobAt(x, y) && scene.world.getApproachSpots(x, y).length) tree = { x, y };
        }
      }
    }
    const idle = s.characters.find((c) => !c.isChild && c.visible && !c.away && c.workplaceId === null);
    scene.behavior.endTask(idle);
    scene.behavior.startPlan(idle, scene.behavior.brain.resolveLeisure(idle, 'stroll', 12) ?? { activity: 'wait', duration: 30, spot: { x: idle.tileX, y: idle.tileY } }, 12);
    scene.camera.centerOn(tree.x * 16 + 8, tree.y * 16 + 8, game.renderer.width, game.renderer.height);
    const urgent = [];
    const offU = game.events.on('job:urgent', (p) => urgent.push(p));
    clickAt(tree.x * 16 + 8, tree.y * 16 + 10);
    offU();
    const job = scene.jobs.jobAt(tree.x, tree.y);
    check('ağaca tıklayınca öncelikli kesim emri verilir', job?.urgent && job.type === 'chop' && urgent.length === 1);
    const other = scene.jobs.designate(...(() => {
      for (let r = 2; r < 25; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = plaza.centerX + dx;
        const y = plaza.centerY + dy;
        if (map.getObject(x, y) === 'rock' && !scene.jobs.jobAt(x, y)) return [x, y];
      }
      return [0, 0];
    })());
    const pick = scene.jobs.findWorkFor(idle, { x: idle.tileX, y: idle.tileY });
    check('öncelikli hedef bütün işlerden önce seçilir', pick?.job === job, pick?.job?.type);
    if (other) scene.jobs.cancel(other);
    check('boştaki işçi elindekini bırakıp koşar', urgent.length === 1 && (!idle.task || idle.task.activity !== 'stroll'));
    // Toplanma Zili
    const R = await import('/src/systems/RallySystem.js');
    for (let i = 0; i < 96 && !(s.time.hour >= 10 && s.time.hour < 13); i++) hours(0.25);
    s.rally = null;
    check('toplanma zili çalınabilir', R.rallyStatus(s).ok);
    game.events.emit('ui:rallyBell');
    check('zil çalınca toplanma bir saat sürer', R.isRallyActive(s) && s.rally.until - s.totalMinutes === 60);
    hours(0.5);
    const gathered = s.characters.filter((c) => c.task?.activity === 'rally').length;
    const awake = s.characters.filter((c) => c.visible && !c.away).length;
    check('uyanık sakinler meydanda toplanır', gathered >= Math.max(3, Math.floor(awake * 0.6)), `${gathered}/${awake}`);
    game.events.emit('ui:rallyBell');
    check('zil hemen yeniden çalınamaz', !R.rallyStatus(s).ok);
    hours(0.75);
    check('bir saat sonra toplanma biter', !R.isRallyActive(s) && s.rally.ended);
    window.__mem = { id: s.characters[0].id, count: s.characters[0].memories.length };
  }

  // ===== 15. aşama =====
  {
    const { RECONCILE, CONFLICT } = await import('/src/data/family.js');
    const { OPPOSING_TRAITS } = await import('/src/data/characters.js');
    const { MASTERPIECES, MASTERWORK } = await import('/src/data/masterpieces.js');
    const MW = await import('/src/systems/Masterworks.js');
    const { townHappinessBonus: bonusOf } = await import('/src/systems/TownStatus.js');
    const { getCharacterSprite } = await import('/src/art/sprites/index.js');
    const sc = () => game.scenes.current;
    const adults = s.characters.filter((c) => !c.isChild && !c.away);
    const [ra, rb, rc] = adults;
    const rel = sc().relationships;

    // --- Sosyal denge ---
    check('atışma bekleme süresi uzadı, olasılıklar törpülendi', CONFLICT.cooldownMinutes >= 600 && CONFLICT.encounterChancePerMinute <= 0.004 && CONFLICT.workChancePerMinute <= 0.012);
    const rate = (place) => {
      let ok = 0;
      const off = game.events.on('relationship:reconciled', () => ok++);
      for (let i = 0; i < 3000; i++) {
        rel.set(ra, rb, -30);
        sc().conflicts.tryReconcile(ra, rb, place, 1);
      }
      off();
      return ok / 3000;
    };
    const chatRate = rate('chat');
    const venueRates = ['inn', 'gazebo', 'campfire', 'festival'].map(rate);
    check('gönül alma yerlerinde (han, çardak, ateş, festival) barışma olasılığı 4 kat (+%300)', venueRates.every((r) => r > chatRate * 3 && r < chatRate * 5.5), `sohbet ${chatRate.toFixed(3)} · ${venueRates.map((r) => r.toFixed(3)).join(' ')}`);
    // Barışma: el sıkışma balonu, yerli anı ve günlük
    rel.set(ra, rb, -30);
    ra.visible = true;
    rb.visible = true;
    let tries = 0;
    while (rel.get(ra, rb) < RECONCILE.below && tries++ < 500) sc().conflicts.tryReconcile(ra, rb, 'inn', 5);
    check('barışınca başlarında el sıkışma balonu çıkar', ra.bubble?.icon === 'handshake' && rb.bubble?.icon === 'handshake', ra.bubble?.icon);
    check("barışma anısı yeriyle yazılır (Han'da ... ile barıştı)", ra.memories.some((m) => m.text === `Han'da ${rb.name} ile barıştı`) && rb.memories.some((m) => m.text === `Han'da ${ra.name} ile barıştı`), ra.memories.at(-1).text);
    check('barışma günlüğe ve sayaca yazılır', s.journal.at(-1).text.includes('handa barıştı') && s.stats.reconciliations >= 1, s.journal.at(-1).text);
    // Gönül alma yerinde zıt kişilikliler atışmaz; meydanda atışabilir
    const [tx, ty] = OPPOSING_TRAITS[0];
    const traits = [ra.traits, rb.traits];
    ra.traits = [tx];
    rb.traits = [ty];
    const quarrels = (activity) => {
      let n = 0;
      const off = game.events.on('relationship:quarrel', () => n++);
      sc().conflicts.cooldowns.clear();
      rel.set(ra, rb, 0);
      for (let i = 0; i < 600; i++) {
        sc().relationships.groups = [{ kind: 'chat', activity, buildingId: null, members: [ra, rb] }];
        sc().conflicts.update({ gameMinutes: 10, hour: 12 });
        sc().conflicts.cooldowns.clear();
        if (rel.get(ra, rb) < 0) rel.set(ra, rb, 0);
      }
      off();
      return n;
    };
    const atGazebo = quarrels('gazebo');
    const atFountain = quarrels('fountain');
    check('çardakta / handa atışılmaz, meydanda atışılabilir', atGazebo === 0 && atFountain > 0, `çardak ${atGazebo} · meydan ${atFountain}`);
    [ra.traits, rb.traits] = traits;
    rel.set(ra, rb, 20);

    // --- Meslek kıyafetleri ---
    const skills0 = { ...rc.skills };
    rc.skills = {};
    sc().craftsmanship.refreshOutfit(rc);
    check('Çırak sade köylü giysisi giyer', rc.outfit === null);
    rc.skills = { mining: 600 };
    sc().craftsmanship.refreshOutfit(rc);
    check('Kalfa madenci bandana ve fener takar', rc.outfit === 'miner:2' && rc.look.outfit === 'miner:2');
    rc.skills = { mining: 1400 };
    sc().craftsmanship.refreshOutfit(rc);
    const { addExperience } = await import('/src/systems/SkillSystem.js');
    addExperience(game.events, rc, 'mineIron', 200);
    check('Usta olunca kostüm hemen giyilir (kademe atlama olayıyla)', rc.outfit === 'miner:3', rc.outfit);
    const plain = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: false, bag: false, outfit: null }).toDataURL();
    const dressed = getCharacterSprite(rc.appearance, 'down', 'idle0', rc.look).toDataURL();
    const coatOnly = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: true, bag: false, outfit: null }).toDataURL();
    const coatHelmet = getCharacterSprite(rc.appearance, 'down', 'idle0', { child: false, coat: true, bag: false, outfit: 'miner:3' }).toDataURL();
    check('Usta kostümü sprite üzerinde çizilir; paltoyla kask görünmeye devam eder', plain !== dressed && coatOnly !== coatHelmet);
    const kid = s.characters.find((c) => c.isChild);
    if (kid) {
      kid.skills = { mining: 2000 };
      sc().craftsmanship.refreshOutfit(kid);
    }
    check('çocuklar meslek kıyafeti giymez', !kid || (kid.outfit === null && kid.look.outfit === null));
    const kits = ['woodcutting', 'farming', 'masonry', 'mining', 'herbalism', 'baking', 'cooking', 'husbandry', 'fishing', 'building', 'crafting', 'scholarship'];
    const views = [];
    for (const k of kits) {
      rc.skills = { [k]: 2000 };
      sc().craftsmanship.refreshOutfit(rc);
      for (const f of ['down', 'up', 'left', 'right']) for (const fr of ['idle0', 'walk0', 'sit0']) views.push(getCharacterSprite(rc.appearance, f, fr, rc.look).width);
    }
    check('her meslek kiti her yönde ve karede çizilir', views.length === kits.length * 12 && views.every((w) => w === 12));
    // Zanaat rozeti
    rc.skills = { baking: 2000 };
    sc().craftsmanship.refreshOutfit(rc);
    game.events.emit('ui:selectCharacter', rc.id);
    game.render(0);
    const badge = document.querySelector('.craft-badge');
    check('Karakter Paneli altın zanaat rozetiyle "Usta Fırıncı" gösterir', badge && !badge.hidden && badge.classList.contains('is-gold') && badge.textContent.includes('Usta Fırıncı'), badge?.textContent);
    rc.skills = { baking: 600 };
    sc().craftsmanship.refreshOutfit(rc);
    game.render(0);
    check('Kalfa gümüş rozet', badge.classList.contains('is-silver') && badge.textContent.includes('Kalfa Fırıncı'), badge.textContent);
    game.events.emit('ui:selectCharacter', null);

    // --- Usta işi eserler ---
    const mine = s.buildings.find((b) => b.type === 'ironMine' && b.functional) ?? sim.place('ironMine');
    const mw = s.masterworks;
    rc.skills = { mining: 600 };
    mw.lastByMaker = {};
    let made = 0;
    const offMade = game.events.on('masterwork:created', () => made++);
    for (let i = 0; i < 300; i++) game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    check('Kalfa usta işi eser çıkarmaz', made === 0);
    rc.skills = { mining: 2000 };
    rc.workplaceId = null;
    rc.equipment.tool = null;
    const before = mw.items.length;
    for (let i = 0; i < 4000; i++) {
      mw.lastByMaker = {};
      mw.today = 0;
      mw.items = mw.items.filter((it) => it.status !== 'stored');
      game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    }
    const baseRate = made / 4000;
    check('Usta mesai sonunda %4 şansla eser çıkarır', baseRate > 0.03 && baseRate < 0.05, baseRate.toFixed(3));
    made = 0;
    rc.workplaceId = mine.id;
    rc.equipment.tool = 'sturdyTool';
    for (let i = 0; i < 4000; i++) {
      mw.lastByMaker = {};
      mw.today = 0;
      mw.items = mw.items.filter((it) => it.status !== 'stored');
      game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    }
    const topRate = made / 4000;
    check('sabit iş yeri ve Sağlam Alet şansı %8e çıkarır', topRate > 0.065 && topRate < 0.095, topRate.toFixed(3));
    rc.workplaceId = null;
    // Günde bir eser
    mw.items = mw.items.filter((it) => it.status !== 'stored');
    mw.lastByMaker = {};
    mw.today = 0;
    made = 0;
    for (let i = 0; i < 2000; i++) game.events.emit('work:finished', { character: rc, activity: 'mineIron', building: mine });
    check(`usta iki eser arasında ${MASTERWORK.makerCooldownDays} gün dinlenir`, made === 1, `${made}`);
    {
      // Kasabada günde en çok bir eser: başka bir usta da aynı gün eser çıkaramaz
      const other = adults.find((o) => o !== rc && o !== ra);
      const skillsO = { ...other.skills };
      other.skills = { mining: 2000 };
      let extra = 0;
      const offX = game.events.on('masterwork:created', () => extra++);
      for (let i = 0; i < 2000; i++) game.events.emit('work:finished', { character: other, activity: 'mineIron', building: mine });
      offX();
      other.skills = skillsO;
      check(`kasabada günde en çok ${MASTERWORK.townPerDay} usta işi eser`, extra === 0, `${extra}`);
    }
    offMade();
    const item = mw.items.find((it) => it.status === 'stored');
    check('eser vitrine (depoya) girer, ustanın anısına ve günlüğe yazılır', item?.type === 'ironStatue' && item.maker === rc.name && rc.memories.at(-1).text.includes(MASTERPIECES.ironStatue.name) && s.journal.some((j) => j.text.includes(MASTERPIECES.ironStatue.name)));
    check('eser çıkınca ustanın başında kutlama balonu ve kıvılcımlar', rc.bubble?.icon === 'masterpiece' && rc.celebrateAt !== null);
    // Sergileme
    mw.items = mw.items.filter((it) => it.status !== 'exhibited');
    const happy0 = bonusOf(s);
    game.events.emit('ui:exhibitMasterwork', { id: item.id });
    check('sergilenen eser kasaba refahına kalıcı +1 katar', item.status === 'exhibited' && Math.abs(bonusOf(s) - happy0 - 1) < 1e-9 && MW.masterworkHappiness(s) === 1);
    game.events.emit('ui:exhibitMasterwork', { id: item.id });
    check('aynı eser iki kez sergilenmez', MW.masterworkHappiness(s) === 1);
    // Satış
    const forSale = sc().craftsmanship.create(rc, 'lifeElixir');
    const gold0 = s.resources.gold;
    s.events.merchant.present = false;
    game.events.emit('ui:sellMasterwork', { id: forSale.id, source: 'merchant' });
    check('tüccar yokken tüccara eser satılamaz', forSale.status === 'stored' && s.resources.gold === gold0);
    const harborOk = s.buildings.some((b) => b.type === 'harbor' && b.functional && !b.damaged);
    game.events.emit('ui:sellMasterwork', { id: forSale.id, source: 'harbor' });
    check('eser limandan yüksek fiyata (200-400 altın) ihraç edilir', !harborOk || (forSale.status === 'sold' && s.resources.gold === gold0 + MASTERPIECES.lifeElixir.value && MASTERPIECES.lifeElixir.value >= 200 && MASTERPIECES.lifeElixir.value <= 400), `${s.resources.gold - gold0} altın`);
    check('bütün eserlerin fiyatı liman ve tüccarda 200-400 altın', Object.keys(MASTERPIECES).every((k) => [MW.masterworkPrice(k, 'harbor'), MW.masterworkPrice(k, 'merchant')].every((p) => p >= 200 && p <= 400)));
    // Sergi sınırı
    for (let i = 0; i < 20; i++) game.events.emit('ui:exhibitMasterwork', { id: sc().craftsmanship.create(rc, 'townRug').id });
    check(`sergi katkısı en çok +${MASTERWORK.maxExhibitHappiness}`, MW.masterworkHappiness(s) === MASTERWORK.maxExhibitHappiness);
    // Arşiv vitrini: düğmeden sergileme
    const fresh = sc().craftsmanship.create(rc, 'carvedChest');
    game.events.emit('ui:toggleStats');
    game.render(0);
    const rowEl = [...document.querySelectorAll('.masterwork-row.is-stored')].find((r) => r.textContent.includes(MASTERPIECES.carvedChest.name));
    rowEl?.querySelector('button')?.click();
    game.events.emit('ui:toggleStats');
    check("Kasaba Arşivi'nin vitrininde eser listelenir ve Sergile düğmesi çalışır", rowEl && fresh.status === 'exhibited');
    window.__mw15 = { count: mw.items.length, made: mw.made, exhibited: MW.exhibitedMasterworks(s).length, makerId: rc.id };
    rc.skills = { ...skills0, mining: Math.max(2000, ...Object.values(skills0), 0) + 600 }; // ana mesleği madencilik (sonraki testler saatlerce çalıştırır: pay bırakılır)
    sc().craftsmanship.refreshOutfit(rc);
  }

  // ===== 16. aşama =====
  {
    const X = await import('/src/systems/Exploration.js');
    const D = await import('/src/data/exploration.js');
    const sc = () => game.scenes.current;
    const exs = () => sc().expeditions;
    const ex = s.exploration;
    const adults = () => s.characters.filter((c) => !c.isChild && !c.away);
    // --- Risk: meslek ve ekipman ---
    const mineOpt = D.ADVENTURES.mountainPass.options.find((o) => o.id === 'mine');
    const pathOpt = D.ADVENTURES.mountainPass.options.find((o) => o.id === 'path');
    const fake = (skills, tool = null) => ({ name: 'Deneme', skills, equipment: { tool } });
    check('macera riski kafilesiz tabandır', Math.abs(X.optionRisk([fake({})], mineOpt).chance - mineOpt.risk.chance) < 1e-9);
    check('Sağlam Aletli Usta Madenci maden riskini sıfırlar', X.optionRisk([fake({}), fake({ mining: 2000 }, 'sturdyTool')], mineOpt).chance === 0);
    check('aletsiz Usta Madenci riski sıfırlamaz, yarıya indirir', Math.abs(X.optionRisk([fake({ mining: 2000 })], mineOpt).chance - mineOpt.risk.chance * 0.5) < 1e-9);
    check('Kalfa Şifacı patikanın riskini sıfırlar', X.optionRisk([fake({ herbalism: 600 })], pathOpt).chance === 0);
    check('seçenek açıklaması kafilenin riskini söyler', X.describeOption([fake({ mining: 2000 }, 'sturdyTool')], mineOpt).includes('Risk yok') && X.describeOption([fake({})], mineOpt).includes('Kaza riski %35'));

    // --- Sefer düzenleme ---
    for (const c of s.characters) c.illness = null;
    s.dilemma.expedition = null;
    s.dilemma.active = null;
    s.time.paused = false;
    const hall = s.buildings.find((b) => b.type === 'townHall' && b.functional);
    sim.give({ food: 200 });
    ex.lastLaunchDay = -99;
    const st0 = X.expeditionLaunchStatus(s, 'townHall');
    check('Belediye Konağı\'ndan sefer düzenlenebilir', hall && st0.ok, st0.reason);
    const food0 = s.resources.food;
    game.events.emit('ui:launchExpedition', { source: 'townHall' });
    const exp = s.dilemma.expedition;
    check('3 kişilik kafile yola çıkar, erzak ödenir, iki macera planlanır', exp && exp.members.length === 3 && s.resources.food === food0 - D.EXPLORATION.cost.food && exp.adventures.length === 2, exp && exp.adventures.join(','));
    check('aynı anda ikinci sefer düzenlenemez', !X.expeditionLaunchStatus(s, 'townHall').ok);
    const team = exp.members.map((id) => s.characters.find((c) => c.id === id));
    hours(1);
    check('kafile harita kenarına yürür ya da ufukta kaybolur', team.every((c) => c.away));
    // --- İlk macera ---
    let guard = 0;
    while (!(s.dilemma.active?.kind === 'adventure') && guard++ < 200) sim.step(50);
    const act = s.dilemma.active;
    game.render(0);
    const modal = document.querySelector('.dilemma');
    check('yolculuğun ortasında Maceracı Günlüğü penceresi açılır ve oyun durur', act?.kind === 'adventure' && s.time.paused && !modal.hidden && modal.textContent.includes('Maceracı Günlüğü'), act?.id);
    const scen = D.ADVENTURES[act.id];
    check('pencere kafileyi ve seçeneklerin riskini gösterir', team.every((c) => modal.textContent.includes(c.name)) && act.options.some((o) => /Kaza riski|Risk yok/.test(o.detail)));
    // Riskli seçeneği güvenceye al: kafileye kuralı karşılayan bir usta (aletiyle) ver
    const risky = scen.options.find((o) => o.risk && o.safeWith);
    const rule = risky.safeWith[0];
    const keepSkills = { ...team[0].skills };
    const keepTool = team[0].equipment.tool;
    team[0].skills = { [rule.skill]: 2000 };
    if (rule.tool) team[0].equipment.tool = 'sturdyTool';
    const resolved = [];
    const offR = game.events.on('adventure:resolved', (p) => resolved.push(p));
    game.events.emit('ui:chooseDilemma', { optionId: risky.id });
    check('usta kafilede iken riskli yol kazasız geçer ve seferin adını verir', resolved[0]?.success && resolved[0].risk.chance === 0 && exp.route === risky.route && !s.time.paused && !s.dilemma.active, exp.route);
    check('macera ganimeti seferde birikir', Object.keys(exp.loot).length > 0 && exp.log.length === 1);
    team[0].skills = keepSkills;
    team[0].equipment.tool = keepTool;
    // --- İkinci macera: kaza zorlanır (risk 1) ---
    guard = 0;
    while (!(s.dilemma.active?.kind === 'adventure') && guard++ < 300) sim.step(50);
    const act2 = s.dilemma.active;
    const scen2 = D.ADVENTURES[act2.id];
    const bold = scen2.options.find((o) => o.risk);
    const saved = { risk: bold.risk, safeWith: bold.safeWith, easeWith: bold.easeWith };
    bold.risk = { ...bold.risk, chance: 1 };
    bold.safeWith = [];
    bold.easeWith = [];
    const lootBefore = JSON.stringify(exp.loot);
    game.events.emit('ui:chooseDilemma', { optionId: bold.id });
    Object.assign(bold, saved);
    offR();
    check('kazada bir sakin yaralanır, ganimet azalır, bulgu gelmez', resolved[1] && !resolved[1].success && exp.hurt.length === 1 && resolved[1].found.length === 0, lootBefore + ' -> ' + JSON.stringify(exp.loot));
    const victim = s.characters.find((c) => c.id === exp.hurt[0]);
    exp.loot.herbs = (exp.loot.herbs ?? 0) + 3; // şifalı ot ganimeti (Şifacı Kulübesi'nin stoğuna, yoksa yiyeceğe)
    // --- Dönüş ---
    const returned = [];
    const offB = game.events.on('expedition:returned', (p) => returned.push(p));
    guard = 0;
    while (s.dilemma.expedition && guard++ < 120) hours(0.5);
    offB();
    const back = returned[0];
    check('kafile döner: kimse kaybolmaz, herkes görünür ve kasabada', back && team.every((c) => s.characters.includes(c) && !c.away && c.visible !== undefined) && !s.dilemma.expedition);
    check("maceracıların anısına seferin hikâyesi yazılır (… Seferi'nden … döndü)", team.every((c) => c.memories.some((m) => m.text.startsWith(`${back.route} Seferi'nden`))), team[0].memories.at(-1)?.text);
    check('kazada yaralanan dönünce hasta yatar ve anısına yazılır', victim.illness && victim.memories.some((m) => m.text.includes(scen2.title)));
    check('dönenler handa anlatacak bir hikâye taşır', team.every((c) => c.tale && c.tale.route === back.route));
    check('şifalı ot ganimeti günlüğe yazılır', s.journal.some((j) => j.text.includes(`${back.route} Seferi'nden döndü`)));
    check('sefer günlüğü ve sayaç', ex.log.at(-1)?.route === back.route && ex.expeditions >= 1 && s.stats.adventures >= 2);
    // --- Hikâye anlatma ---
    const innB = s.buildings.find((b) => b.type === 'inn' && b.functional);
    const teller = team.find((c) => c !== victim) ?? team[0];
    const listeners = s.characters.filter((c) => !team.includes(c) && !c.isChild && !c.away).slice(0, 2);
    const fun0 = listeners.map((c) => c.needs.fun);
    for (const c of [teller, ...listeners]) {
      c.task = { activity: 'inn', buildingId: innB.id, phase: 'perform', elapsed: 0, duration: 999 };
      c.visible = true;
    }
    teller.needs.fun = 50;
    for (const c of listeners) c.needs.fun = Math.min(c.needs.fun, 80);
    const fun1 = listeners.map((c) => c.needs.fun);
    exs().updateTales(D.EXPLORATION.tale.minutes + 1);
    check('maceracı handa hikâyesini anlatır: başında dağ balonu, dinleyenlerin keyfi artar', teller.bubble?.icon === 'adventure' && listeners.every((c, i) => c.needs.fun > fun1[i]) && teller.tale.told === 1 && s.stats.talesTold >= 1, `${fun0} -> ${listeners.map((c) => c.needs.fun)}`);
    check('anlatmak maceracının anısına yazılır', teller.memories.some((m) => m.text.includes('handa ballandıra ballandıra anlattı')));
    for (const c of [teller, ...listeners]) c.task = null;
    // --- Ganimetler ---
    const shards0 = ex.items.relicShard;
    const relics0 = s.civic.relics ?? 0;
    ex.items.relicShard = 2;
    exs().grantFind('relicShard', 'test');
    check('üç Kadim Yadigâr Parçası birleşince kalıcı +2 refah', ex.items.relicShard === 0 && Math.abs((s.civic.relics ?? 0) - relics0 - 1) < 1e-9);
    ex.items.relicShard = shards0;
    ex.cityMap = false;
    const iv = X.merchantIntervalMultiplier(s);
    exs().grantFind('cityMap', 'test');
    check('Kayıp Şehir Haritası tüccarı iki kat sık getirir', iv === 1 && ex.cityMap && X.merchantIntervalMultiplier(s) === 0.5);
    const sh = ex.items.relicShard;
    exs().grantFind('cityMap', 'test');
    check('ikinci harita yadigâr parçasına döner', ex.items.relicShard === (sh + 1) % 3 || ex.items.relicShard === sh + 1);
    // Üzüm asması
    ex.items.vineSeed = 0;
    const gardenB = s.buildings.find((b) => b.type === 'garden' && b.functional) ?? sim.place('garden');
    const vineSpot = [[-1, 0], [2, 0], [0, -1], [0, 2], [-1, -1], [2, 2], [-1, 1], [2, 1]].map(([dx, dy]) => ({ x: gardenB.tileX + dx, y: gardenB.tileY + dy })).find((p) => {
      ex.items.vineSeed = 1;
      const ok = sc().construction.checkPlacement('grapeVine', p.x, p.y).ok;
      ex.items.vineSeed = 0;
      return ok;
    });
    const noSeed = sc().construction.checkPlacement('grapeVine', vineSpot?.x ?? 0, vineSpot?.y ?? 0);
    check('fide olmadan asma dikilemez', !noSeed.ok && noSeed.reason.includes('Üzüm Fidesi'), noSeed.reason);
    ex.items.vineSeed = 1;
    const far = sim.findSpot('grapeVine') ?? null;
    const farCheck = sc().construction.checkPlacement('grapeVine', plaza.centerX, plaza.centerY + 1);
    check('asma yalnızca bahçe / çardak kenarına dikilir', !farCheck.ok || far !== null, farCheck.reason);
    const vine = vineSpot ? sc().construction.placeSite('grapeVine', vineSpot.x, vineSpot.y) : { ok: false };
    if (vine.ok) {
      const job = sc().jobs.jobs.find((j) => j.buildingId === vine.building.id);
      if (job) sc().jobs.cancel(job);
      sc().construction.complete(vine.building);
    }
    sim.step(5);
    check('fide dikilince harcanır, yanındaki bahçenin verimi +%10', vine.ok && ex.items.vineSeed === 0 && Math.abs((gardenB.factors?.vines ?? 1) - 1.1) < 1e-9, `${vineSpot?.x},${vineSpot?.y} ${gardenB.factors?.vines}`);
    if (vine.ok) sc().construction.demolish(vine.building);
    check('asma sökülünce fide sandığa döner', ex.items.vineSeed === 1);
    // Kadim Meşale
    ex.items.ancientTorch = 1;
    const torch = sim.place('ancientTorch');
    check('meşale dikilir ve ganimet harcanır', torch && ex.items.ancientTorch === 0);
    while (s.time.hour >= 6 && s.time.hour < 19) hours(1);
    hours(0.1);
    const lights = [];
    torch.collectLights(lights, { time: 0, windowsLit: true, hour: 20 });
    check('gece mavi alevle yanar (mavi ışık)', torch.lit && lights.some((l) => l.color[2] > l.color[0]));
    const warmTest = s.characters.find((c) => !c.away && c.visible);
    if (warmTest) {
      warmTest.x = torch.center.x + 10;
      warmTest.y = torch.center.y + 4;
      warmTest.buffs.warmUntil = 0;
      sc().heating.warmCharacters(1);
    }
    check('meşalenin yanındakinin içi ısınır', !warmTest || (warmTest.buffs.warmUntil ?? 0) > s.totalMinutes);
    // --- Harabe sırları ve kadim yazıtlar ---
    for (const k of D.INSCRIPTION_KEYS) delete ex.inscriptions[k];
    ex.decoding = null;
    const fountainRuin = s.buildings.find((b) => b.type === 'ancientFountain') ?? { type: 'ancientFountain' };
    game.events.emit('ruin:restored', { building: fountainRuin, from: 'Kadim Çeşme', treasure: null });
    check('onarılan harabenin içinden kadim yazıt çıkar', ex.inscriptions.aqueduct?.status === 'found');
    s.research.active = null;
    const academyB = s.buildings.find((b) => b.definition.academy && b.functional);
    game.events.emit('ui:decodeInscription', { id: 'aqueduct' });
    check('yazıt Bilgelik Evi\'nde çözülmeye başlar', ex.decoding?.id === 'aqueduct' && ex.inscriptions.aqueduct.status === 'decoding');
    sc().research.work(academyB, D.INSCRIPTIONS.aqueduct.work + 1);
    sim.step(5);
    check('çözülen Antik Su Kemeri Şeması bahçelere kalıcı +%15', X.hasScheme(s, 'aqueduct') && X.schemeGardenMultiplier(s) === 1.15 && Math.abs((gardenB.factors?.scheme ?? 1) - 1.15) < 1e-9);
    ex.inscriptions.steelCasting = { status: 'decoded' };
    ex.inscriptions.millstone = { status: 'decoded' };
    const iron0 = s.resources.iron;
    ex.ironCredit = 0;
    for (let i = 0; i < 5; i++) sc().crafting.saveIron(2);
    check('Kadim Çelik Döküm: atölye demirinin %20\'si geri döner', s.resources.iron === iron0 + 2, `${iron0} -> ${s.resources.iron}`);
    check('Kadim Değirmen Taşı: fırın %15 hızlı', X.schemeBakeMultiplier(s) === 1.15);
    window.__x16 = { inscriptions: Object.keys(ex.inscriptions).length, map: ex.cityMap, tales: team.filter((c) => c.tale).length, teamIds: team.map((c) => c.id), expeditions: ex.expeditions };
  }

  // ===== 18. aşama =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const map = W.map;
    const B = await import('/src/data/buildings.js');
    const LD = await import('/src/data/landscape.js');
    const LS = await import('/src/systems/Landscape.js');
    const { TILE_TYPES } = await import('/src/data/tiles.js');
    const { townHappiness: happy } = await import('/src/systems/TownStatus.js');
    const step = (n) => sim.step(n);
    sim.give({ wood: 300, stone: 300, food: 200, iron: 80, wool: 60, bread: 60 });
    // Temiz, düz bir zemin dikdörtgeni (yapı ve yol yok; içindeki ağaç / kaya temizlenir; kasabaya bağlı)
    const clearRect = (w, h, from = 4) => {
      const p = W.landmarks.plaza;
      for (let r = from; r < 38; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x0 = p.centerX + dx;
            const y0 = p.centerY + dy;
            let ok = true;
            for (let y = y0 - 1; y <= y0 + h && ok; y++) {
              for (let x = x0 - 1; x <= x0 + w && ok; x++) {
                if (!map.inBounds(x, y) || !TILE_TYPES[map.get(x, y)].ground || map.getOccupant(x, y)) ok = false;
              }
            }
            if (!ok) continue;
            for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) map.setObject(x, y, null);
            W.refreshStaticData();
            if (W.isReachable(x0, y0)) return { x: x0, y: y0 };
          }
        }
      }
      return null;
    };
    const instant = (b) => {
      const job = S.jobs.jobs.find((j) => j.buildingId === b.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(b);
      return b;
    };
    const placeAt = (type, x, y) => {
      const r = S.construction.placeSite(type, x, y, { quiet: true });
      return r.ok ? instant(r.building) : null;
    };

    // --- İnşa menüsü sekmeleri ---
    check('inşa menüsü üç sekme: Yapılar, Yol & Zemin, Peyzaj & Dekorasyon', LD.BUILD_TABS.map((t) => t.id).join(',') === 'buildings,roads,decor');
    check('fırçalar Yol & Zemin, sokak eşyaları Peyzaj sekmesinde', ['path', 'stonePath', 'plazaTile', 'bridge'].every((t) => B.buildTabFor(t) === 'roads') && ['woodFence', 'fenceGate', 'ironLantern', 'signpost', 'parkBench', 'planter', 'birchTree', 'oakTree', 'pineTree', 'lantern', 'bench', 'flowerBed', 'cherryTree'].every((t) => B.buildTabFor(t) === 'decor') && B.buildTabFor('cabin') === 'buildings');
    check('yeni öğeler inşa menüsünde', ['plazaTile', 'woodFence', 'fenceGate', 'ironLantern', 'signpost', 'parkBench', 'planter', 'birchTree', 'oakTree', 'pineTree'].every((t) => B.BUILD_MENU.includes(t)));
    game.events.emit('ui:setTool', { tool: 'build', buildType: 'woodFence' });
    game.render(0);
    const activeTab = document.querySelector('.build-tab.is-active')?.dataset.tab;
    const visibleItems = [...document.querySelectorAll('.build-item')].filter((b) => !b.hidden).map((b) => b.dataset.type);
    check('öğe seçilince sekmesi açılır ve yalnızca o sekmenin öğeleri görünür', activeTab === 'decor' && visibleItems.includes('woodFence') && !visibleItems.includes('cabin') && !visibleItems.includes('path'), `${activeTab} ${visibleItems.length}`);
    document.querySelector('.build-tab[data-tab="roads"]')?.click();
    const roadItems = [...document.querySelectorAll('.build-item')].filter((b) => !b.hidden).map((b) => b.dataset.type);
    check('Yol & Zemin sekmesine tıklayınca fırçalar listelenir', roadItems.join(',') === 'path,stonePath,plazaTile,bridge', roadItems.join(','));
    game.events.emit('ui:setTool', { tool: 'select' });

    // --- Zemin fırçaları: maliyet ve hız ---
    check('toprak patika 1 odun, parke 1 taş, taş plaka 2 taş', B.TILE_BUILDS.path.cost.wood === 1 && B.TILE_BUILDS.stonePath.cost.stone === 1 && B.TILE_BUILDS.plazaTile.cost.stone === 2);
    check('yürüme hızı: patika +%10, parke +%25, taş plaka +%20', near(TILE_TYPES.path.speedMultiplier, 1.1) && near(TILE_TYPES.cobble.speedMultiplier, 1.25) && near(TILE_TYPES.plaza.speedMultiplier, 1.2));
    const area = clearRect(10, 7);
    check('test için açık çimen alanı bulundu', area, JSON.stringify(area));
    const ax = area.x;
    const ay = area.y;
    // Sürükleyerek kesintisiz çizim: fare uzak bir karoya sıçrasa da aradaki karolar dolar
    const wood0 = st.resources.wood;
    S.tools.setTool('build', 'path');
    S.tools.beginStroke({ tileX: ax, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 6, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 6, tileY: ay + 4 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    const line = [];
    for (let x = ax; x <= ax + 6; x++) line.push(map.get(x, ay + 1));
    for (let y = ay + 2; y <= ay + 4; y++) line.push(map.get(ax + 6, y));
    check('sürüklenen patika kesintisiz (aradaki karolar dolar, viraj döner)', line.every((t) => t === 'path'), line.join(','));
    check('patika karo başına 1 odun harcar', wood0 - st.resources.wood === 10, wood0 - st.resources.wood);
    check('patika sakinler için yürünebilir ve kasabaya bağlı', W.isReachable(ax + 3, ay + 1));
    // Otomatik viraj / kavşak köşeleri: virajın dış köşesi yuvarlanır
    const calls = [];
    const mock = { drawImage: (img, x, y) => calls.push([x, y]) };
    map.drawRoadCorners(mock, ax + 6, ay + 1, 0, 0, 'summer');
    const outer = calls.length;
    calls.length = 0;
    map.drawRoadCorners(mock, ax + 3, ay + 1, 0, 0, 'summer');
    check('virajda köşe yuvarlanır (otomatik kenarlık), düz yolda köşe çizilmez', outer >= 1 && calls.length === 0, `${outer}/${calls.length}`);
    S.construction.paintTile('path', ax + 3, ay + 2);
    calls.length = 0;
    map.drawRoadCorners(mock, ax + 3, ay + 1, 0, 0, 'summer');
    check('kavşakta iç köşelere çimen tutamı taşar', calls.length >= 1, calls.length);

    // Parke ve taş plaka
    const stone0 = st.resources.stone;
    S.construction.paintTile('stonePath', ax + 1, ay + 1);
    S.construction.paintTile('plazaTile', ax + 2, ay + 1);
    check('parke patikanın, taş plaka zeminin üstüne döşenir', map.get(ax + 1, ay + 1) === 'cobble' && map.get(ax + 2, ay + 1) === 'plaza' && stone0 - st.resources.stone === 3);

    // Çamur: yağmurda patika yavaş ve pahalı, parke etkilenmez
    const pathSpeed = map.getSpeedMultiplier(ax + 4, ay + 1);
    const pathCost = map.getMoveCost(ax + 4, ay + 1);
    const savedWeather = { ...st.weather };
    st.weather.rain = 1;
    step(1);
    check('yağmurda toprak patika çamurlanır (yavaş, yol bulma kaçınır)', map.wet && map.getSpeedMultiplier(ax + 4, ay + 1) < pathSpeed && map.getMoveCost(ax + 4, ay + 1) > pathCost, `${map.getSpeedMultiplier(ax + 4, ay + 1)}`);
    check('yağmurda parke taş çamurlanmaz', near(map.getSpeedMultiplier(ax + 1, ay + 1), 1.25));
    check('harita ipucu çamuru söyler', W.getTileInfo(ax + 4, ay + 1).muddy === true);
    Object.assign(st.weather, savedWeather);
    st.weather.rain = 0;
    step(1);

    // A*: yollar öncelikli — düz çimen yerine bir sıra yandaki parke yoldan yürür
    for (let x = ax; x <= ax + 9; x++) S.construction.paintTile('stonePath', x, ay + 6);
    W.refreshStaticData();
    const route = W.findPath({ x: ax, y: ay + 5 }, { x: ax + 9, y: ay + 5 });
    const onRoad = route ? route.filter((p) => TILE_TYPES[map.get(p.x, p.y)].road).length : 0;
    check('A* yeni döşenen yolu öncelikli kullanır', route && onRoad >= route.length - 3, `${onRoad}/${route?.length}`);

    // --- Yıkım fırçası: yolu kaldırır, harcananın yarısını iade eder ---
    const woodBefore = st.resources.wood;
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 4, tileY: ay + 1 });
    S.tools.continueStroke({ tileX: ax + 5, tileY: ay + 1 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('yıkım fırçası patikayı kaldırır (altındaki çimen geri gelir)', map.get(ax + 4, ay + 1) !== 'path' && TILE_TYPES[map.get(ax + 5, ay + 1)].ground);
    check('iki karo patika = 1 odun iade (%50, küsurat birikir)', st.resources.wood - woodBefore === 1, st.resources.wood - woodBefore);
    const stoneBefore = st.resources.stone;
    S.construction.demolishAt(ax + 2, ay + 1);
    check('taş plaka kaldırılınca harita üretildiğindeki zemine döner ve 1 taş iade', TILE_TYPES[map.get(ax + 2, ay + 1)].ground && st.resources.stone - stoneBefore === 1);

    // --- Ahşap çit ve çit kapısı ---
    const fy = ay + 3;
    const f1 = placeAt('woodFence', ax, fy);
    const f2 = placeAt('woodFence', ax + 1, fy);
    const gate = placeAt('fenceGate', ax + 2, fy);
    const f3 = placeAt('woodFence', ax + 3, fy);
    const f4 = placeAt('woodFence', ax + 3, fy + 1);
    check('çitler yönüne göre birleşir (yatay, köşe)', f2?.connect?.left && f2.connect.right && f3?.connect?.left && f3.connect.down && f4?.connect?.up && !f1.connect.left);
    check('çit kapısı çitlerle birleşir ve sakinler kapıdan geçer', gate?.connect?.left && gate.connect.right && map.isWalkable(ax + 2, fy) && !map.isWalkable(ax + 1, fy));
    // Fırçayla art arda dikilen çit
    S.tools.setTool('build', 'woodFence');
    const before = W.getBuildingsOfType('woodFence').length;
    const by = ay + 5;
    S.tools.beginStroke({ tileX: ax + 5, tileY: by });
    S.tools.continueStroke({ tileX: ax + 8, tileY: by });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('çit fırçası sürükleyince art arda dört çit diker', W.getBuildingsOfType('woodFence').length - before === 4, W.getBuildingsOfType('woodFence').length - before);
    for (const b of W.buildings.filter((b) => b.type === 'woodFence' && b.underConstruction)) instant(b);

    // --- Mahalle tabelası ---
    const sign = placeAt('signpost', ax + 9, ay);
    check('tabela önerilen bir sokak adıyla dikilir', sign && LD.STREET_NAMES.includes(sign.label) && sign.name === sign.label, sign?.label);
    game.events.emit('ui:renameSign', { id: sign.id, name: '  Çiçekli   Sokak ' });
    check('tabelaya tıklayıp ad verilir (boşluklar toparlanır)', sign.label === 'Çiçekli Sokak' && W.getTileInfo(ax + 9, ay).building.name === 'Çiçekli Sokak' && W.getTileInfo(ax + 9, ay).building.sign);
    game.events.emit('ui:selectBuilding', sign.id);
    game.render(0);
    const signInput = document.querySelector('.sign-name-input');
    check('yapı panelinde tabelanın ad kutusu', signInput && !signInput.closest('.building-sign').hidden && signInput.value === 'Çiçekli Sokak');
    game.events.emit('ui:selectBuilding', null);

    // --- Estetik: süsler çevreye estetik yayar, yürüyen keyiflenir ---
    const score0 = st.landscape.score;
    const beauty0 = S.landscape.aestheticAt(ax + 8, ay + 3);
    const decor = [placeAt('planter', ax + 7, ay + 4), placeAt('planter', ax + 8, ay + 2), placeAt('parkBench', ax + 8, ay + 4), placeAt('ironLantern', ax + 9, ay + 4), placeAt('planter', ax + 9, ay + 2)];
    step(1);
    const here = LS.aestheticLevel(S.landscape.aestheticAt(ax + 8, ay + 3));
    check('süsler çevredeki 4-5 karoya "Çevre Estetiği" yayar', (window.__dec18 = decor.map((d) => !!d).join(",")) && decor.every(Boolean) && S.landscape.aestheticAt(ax + 8, ay + 3) >= LD.AESTHETIC.pleasantThreshold && S.landscape.aestheticAt(ax + 8, ay + 3) - beauty0 > 3, `${here} ${S.landscape.aestheticAt(ax + 8, ay + 3).toFixed(2)} önce ${beauty0.toFixed(2)} ${window.__dec18}`);
    {
      const fake = { width: 20, height: 20, tiles: new Uint8Array(400), inBounds: (x, y) => x >= 0 && y >= 0 && x < 20 && y < 20, index: (x, y) => y * 20 + x, get: () => 'grass' };
      const f = LS.computeAestheticField(fake, [{ type: 'planter', functional: true, tileX: 10, tileY: 10 }]);
      check('estetik merkezde tam, 4 karoda azalarak sürer, 5 karonun ötesinde biter', near(f[fake.index(10, 10)], LD.AESTHETIC.values.planter) && f[fake.index(14, 10)] > 0 && f[fake.index(14, 10)] < f[fake.index(12, 10)] && f[fake.index(16, 10)] === 0);
    }
    check('kasabanın estetik puanı artar', st.landscape.score > score0, `${score0} -> ${st.landscape.score}`);
    // Refah çarpanı: estetik yüzdesi kasaba refahına çarpan olarak eklenir
    const pct = st.landscape.percent;
    const needs0 = st.characters.map((c) => ({ ...c.needs }));
    for (const c of st.characters) for (const k of Object.keys(c.needs)) c.needs[k] = 40;
    st.landscape.percent = 0;
    const h0 = happy(st);
    st.landscape.percent = 5;
    const h5 = happy(st);
    st.landscape.percent = pct;
    st.characters.forEach((c, i) => Object.assign(c.needs, needs0[i]));
    check('kasaba estetiği refaha kalıcı çarpan ekler (+%5 en çok)', h5 > h0 && h5 <= h0 * 1.05 + 0.01 && LS.aestheticWelfareMultiplier({ landscape: { percent: 5 } }) === 1.05, `${h0.toFixed(1)} -> ${h5.toFixed(1)}`);
    check('estetik yüzdesi +%1 ile +%5 arası', LD.aestheticPercent(0) === 0 && LD.aestheticPercent(12) === 1 && LD.aestheticPercent(9999) === 5);
    // Yürüyen sakin: güzel sokakta keyfi dolar, anı yazılır (sokağın adıyla)
    const walker = st.characters.find((c) => !c.isChild && c.visible);
    const keep = { x: walker.x, y: walker.y, task: walker.task, waypoints: walker.waypoints, wi: walker.waypointIndex, fun: walker.needs.fun, memories: walker.memories.slice() };
    walker.x = (ax + 8) * 16 + 8;
    walker.y = (ay + 3) * 16 + 12;
    walker.task = { activity: 'stroll', phase: 'travel' };
    walker.waypoints = [{ x: walker.x + 16, y: walker.y }];
    walker.waypointIndex = 0;
    walker.needs.fun = 40;
    walker.memories = walker.memories.filter((m) => m.kind !== 'stroll');
    S.landscape.update({ gameMinutes: 300, hour: 11 });
    check('güzel sokaktan geçenin keyfi dolar', walker.needs.fun > 40, walker.needs.fun.toFixed(1));
    const strollMem = walker.memories.filter((m) => m.kind === 'stroll').map((m) => m.text);
    check('"Güzel bir sokakta yürüdü" ya da "Çiçek kokusunu içine çekti" anısı (sokağın adıyla)', strollMem.some((t) => t.startsWith('Güzel bir sokakta yürüdü') || t === 'Çiçek kokusunu içine çekti'), strollMem.join(' | '));
    check('yakındaki tabela anıya sokağın adını verir', S.landscape.nearestStreet(walker) === 'Çiçekli Sokak');
    // Karanlık: gece ışıksız yerde yürüyen ürker, fener altında ürkmez
    const lantern = decor[3];
    lantern.lit = true;
    walker.needs.fun = 50;
    walker.x = lantern.center.x + 8;
    walker.y = lantern.center.y;
    S.landscape.update({ gameMinutes: 30, hour: 23 });
    const litFun = walker.needs.fun;
    const litDark = walker.inDark;
    const far = clearRect(3, 3, 14);
    walker.x = far.x * 16 + 8;
    walker.y = far.y * 16 + 12;
    walker.needs.fun = 50;
    S.landscape.update({ gameMinutes: 30, hour: 23 });
    check('gece fener altında yürüyen ürkmez, karanlık sokakta keyfi kaçar', !litDark && litFun >= 50 && walker.inDark && walker.needs.fun < 50, `${litFun.toFixed(2)} / ${walker.needs.fun.toFixed(2)}`);
    check('demir fener geceleri yanar (ışık listesinde)', LS.isLitPoint(LS.litSources(W.buildings), lantern.center.x + 40, lantern.center.y));
    Object.assign(walker, { x: keep.x, y: keep.y, task: keep.task, waypoints: keep.waypoints, waypointIndex: keep.wi });
    walker.needs.fun = keep.fun;
    // Park bankı: güzel köşede oturan manzarayı izler, keyfi daha hızlı dolar
    const sitter = st.characters.find((c) => c !== walker && !c.isChild && c.visible);
    const keep2 = { x: sitter.x, y: sitter.y, task: sitter.task, fun: sitter.needs.fun };
    const bench = decor[2];
    sitter.x = bench.seatPoint.x;
    sitter.y = bench.seatPoint.y;
    sitter.task = { activity: 'bench', phase: 'perform', buildingId: bench.id };
    sitter.needs.fun = 30;
    S.landscape.update({ gameMinutes: 20, hour: 11 });
    check('güzel köşedeki park bankında oturanın keyfi fazladan dolar', sitter.needs.fun > 30.5, sitter.needs.fun.toFixed(2));
    Object.assign(sitter, { x: keep2.x, y: keep2.y, task: keep2.task });
    sitter.needs.fun = keep2.fun;
    check('park bankı oturulabilen bank listesinde', B.BENCH_TYPES.includes('parkBench') && W.freeSpots(bench).length === 1);
    check('çiçek saksısının çevresi çiçek koklama noktası', W.flowerSpots.some((p) => Math.abs(p.x - decor[0].tileX) <= 1 && Math.abs(p.y - decor[0].tileY) <= 1));

    // --- Süs ağaçları: iki günde büyür, gölgesinde dinlenilir ---
    const treeArea = clearRect(3, 3, 10);
    const tree = placeAt('oakTree', treeArea.x + 1, treeArea.y + 1);
    step(1);
    check('fidan dikilir (büyüme 0)', tree && tree.growthStage === 0 && tree.plantedAt !== null && tree.name === 'Meşe Fidanı');
    tree.plantedAt -= 24 * 60;
    step(1);
    check('bir günde genç ağaç olur', tree.growthStage === 1);
    tree.plantedAt -= 25 * 60;
    step(1);
    check('iki günde ulu ağaç olur ve adı değişir', tree.growthStage === 2 && tree.name === 'Süs Meşesi');
    const resident = st.characters.find((c) => !c.isChild);
    const shadePlan = S.behavior.brain.resolveLeisure(resident, 'shade', 11);
    check('sakin ulu ağacın gölgesinde dinlenmeyi planlar', shadePlan && Math.abs(shadePlan.spot.x - tree.tileX) + Math.abs(shadePlan.spot.y - tree.tileY) === 1, JSON.stringify(shadePlan?.spot));
    check('süs ağacı kesilmez (toplama emri verilmez)', !S.jobs.isHarvestable(tree.tileX, tree.tileY));

    // --- Yıkım: dekorasyonlar, çitler ve yapılar yarı iadeyle geri dönüşür ---
    const woodD = st.resources.wood;
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 5, tileY: ay + 5 });
    S.tools.continueStroke({ tileX: ax + 8, tileY: ay + 5 });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('yıkım fırçası sürüklenen çitleri söker ve yarısını iade eder', [5, 6, 7, 8].every((dx) => map.getOccupant(ax + dx, ay + 5) === 0) && st.resources.wood - woodD === 4, st.resources.wood - woodD);
    const cabin = sim.place('cabin');
    S.tools.setTool('demolish');
    S.tools.beginStroke({ tileX: ax + 7, tileY: ay + 6 });
    S.tools.continueStroke({ tileX: cabin.tileX, tileY: cabin.tileY });
    S.tools.finishStroke();
    S.tools.setTool('select');
    check('sürükleyen yıkım fırçası büyük yapıları yıkmaz (yalnızca ilk tık)', W.getBuilding(cabin.id));
    window.__l18 = { sign: { id: sign.id, label: sign.label }, tree: { id: tree.id, plantedAt: tree.plantedAt }, credit: { ...st.landscape.refundCredit }, roads: st.landscape.roadsPainted, gateId: gate.id, gate: { x: ax + 2, y: fy } };
  }

  // ===== 19. aşama: sosyal yaşam, aile kurma, huylar ve dedikodu =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const map = W.map;
    const SO = await import('/src/data/social.js');
    const TR = await import('/src/utils/turkish.js');
    const RS = await import('/src/systems/RelationshipSystem.js');
    const { ACTIVITIES: ACT } = await import('/src/data/activities.js');
    const { MEAL_FOOD_COST: MEAL } = await import('/src/data/resources.js');
    const { TILE_TYPES } = await import('/src/data/tiles.js');
    const { WeddingConfetti } = await import('/src/rendering/WeddingConfetti.js');
    const brain = S.behavior.brain;
    const social = S.social;
    sim.give({ wood: 400, stone: 400, food: 300, iron: 80, wool: 60, bread: 60 });
    const clearRect = (w, h, from = 4) => {
      const p = W.landmarks.plaza;
      for (let r = from; r < 38; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x0 = p.centerX + dx;
            const y0 = p.centerY + dy;
            let ok = true;
            for (let y = y0 - 1; y <= y0 + h && ok; y++) for (let x = x0 - 1; x <= x0 + w && ok; x++) if (!map.inBounds(x, y) || !TILE_TYPES[map.get(x, y)].ground || map.getOccupant(x, y)) ok = false;
            if (!ok) continue;
            for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) map.setObject(x, y, null);
            W.refreshStaticData();
            if (W.isReachable(x0, y0)) return { x: x0, y: y0 };
          }
        }
      }
      return null;
    };
    const placeAt = (type, x, y) => {
      const r = S.construction.placeSite(type, x, y, { quiet: true });
      if (!r.ok) return null;
      const job = S.jobs.jobs.find((j) => j.buildingId === r.building.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(r.building);
      return r.building;
    };
    // Rastgeleliği sabitle (yalnızca bu adımlar için)
    const forced = (rng, value, fn) => {
      const keep = rng.next;
      rng.next = () => value;
      try {
        return fn();
      } finally {
        rng.next = keep;
      }
    };
    const free = (c, x, y) => {
      S.behavior.endTask(c);
      if (c.insideBuildingId) W.getBuilding(c.insideBuildingId)?.occupants.delete(c.id);
      c.insideBuildingId = null;
      c.visible = true;
      c.pose = 'stand';
      c.newcomer = false;
      c.relocating = false;
      c.illness = null;
      if (x !== undefined) {
        c.x = x * 16 + 8;
        c.y = y * 16 + 12;
      }
    };
    const events = [];
    const offs = ['pet:purred', 'social:partyStarted', 'social:homeFreed', 'gossip:shared', 'gossip:spread', 'social:familyDinner', 'social:date'].map((n) => game.events.on(n, (p) => events.push(n)));

    // --- Türkçe ekler ---
    check('Türkçe ekler: Emre\'nin, Ozan\'ın, Duru\'nun, Kemal\'in, Gül\'ün', TR.genitive('Emre') === "Emre'nin" && TR.genitive('Ozan') === "Ozan'ın" && TR.genitive('Duru') === "Duru'nun" && TR.genitive('Kemal') === "Kemal'in" && TR.genitive('Gül') === "Gül'ün");
    check("Türkçe ekler: Leyla'dan, Mert'ten, Deniz'den, Ayşe'den, Ozan'dan", TR.ablative('Leyla') === "Leyla'dan" && TR.ablative('Mert') === "Mert'ten" && TR.ablative('Deniz') === "Deniz'den" && TR.ablative('Ayşe') === "Ayşe'den" && TR.ablative('Ozan') === "Ozan'dan");

    // --- Huylar ---
    check('her sakinin geçerli bir huyu var', st.characters.every((c) => SO.QUIRK_KEYS.includes(c.quirk)), st.characters.filter((c) => !SO.QUIRKS[c.quirk]).map((c) => c.name).join(','));
    const counts = Object.fromEntries(SO.QUIRK_KEYS.map((k) => [k, st.characters.filter((c) => c.quirk === k).length]));
    check('dört huyun dördü de kasabada görülür', SO.QUIRK_KEYS.every((k) => counts[k] > 0), JSON.stringify(counts));
    const least = social.leastCommonQuirk(null);
    check('göçmen kasabada en az görülen huyu alır', counts[least] === Math.min(...Object.values(counts)), `${least} ${JSON.stringify(counts)}`);
    const adults = st.characters.filter((c) => !c.isChild && !c.away && !c.role);
    const kid = { quirk: null };
    forced(social.rng, 0.1, () => social.inheritQuirk(kid, [adults[0], adults[1]]));
    check('çocuk çoğunlukla bir ebeveyninin huyunu alır', kid.quirk === adults[0].quirk || kid.quirk === adults[1].quirk, kid.quirk);
    const musician = adults.find((c) => c.quirk === 'musician') ?? adults[0];
    const mw = {};
    brain.addQuirkLeisure({ ...musician, quirk: 'musician' }, 11, mw);
    const ew = {};
    brain.addQuirkLeisure({ ...musician, quirk: 'musician' }, 19, ew);
    check('Müzisyen gündüz çalmaz, akşam (17:00 sonrası) çalmak ister', mw.music === 0 && ew.music > 0, `${mw.music} / ${ew.music}`);

    // Hayvansever: kediye yürür, kedi bekler, varınca okşar (+10 keyif, mırlama)
    const pet = st.animals.find((a) => a.isPet);
    const lover = adults.find((c) => c !== musician);
    if (pet) {
      pet.visible = true;
      pet.mode = 'idle';
      pet.timer = 5;
      const tile = { x: Math.floor(pet.x / 16), y: Math.floor(pet.y / 16) };
      free(lover, tile.x, tile.y + 1);
      lover.quirk = 'animalLover';
      const petPlan = brain.planPetAnimal(lover, 8);
      check('Hayvansever yakındaki kediye / köpeğe yürümeyi planlar', petPlan?.activity === 'petAnimal' && petPlan.petId === pet.id && petPlan.petName.includes(TR.genitive(pet.name)), JSON.stringify(petPlan));
      lover.task = { ...petPlan, phase: 'travel', elapsed: 0 };
      social.update({ gameMinutes: 1, hour: 11 });
      check('yürürken hayvan onu bekler (heldUntil)', pet.heldBy === lover.id && pet.heldUntil > st.totalMinutes);
      const px = pet.x;
      const py = pet.y;
      for (let i = 0; i < 20; i++) S.animals.updatePet(pet, 0.5, 11, 'summer', false);
      check('bekleyen hayvan yerinden kıpırdamaz', pet.x === px && pet.y === py && pet.pose === 'sit');
      lover.x = pet.x + 6;
      lover.y = pet.y;
      lover.task.phase = 'perform';
      lover.needs.fun = 40;
      const cuddles = st.stats.petCuddles ?? 0;
      social.update({ gameMinutes: 1, hour: 11 });
      check('varınca başını okşar: keyif +10, kalp ve mırlama', lover.needs.fun >= 50 && st.stats.petCuddles === cuddles + 1 && events.includes('pet:purred') && !pet.heldUntil, lover.needs.fun.toFixed(1));
      check('durum metni hayvanın adıyla', S.behavior.performLabel(lover, lover.task, ACT.petAnimal).includes(`${TR.genitive(pet.name)} başını okşuyor`), S.behavior.performLabel(lover, lover.task, ACT.petAnimal));
      free(lover);
    } else check('kasabada sevilecek bir kedi / köpek var', false);

    // Kitap Kurdu: fener altındaki bank ve Bilgelik Evi
    const area = clearRect(6, 3);
    const lantern = placeAt('lantern', area.x, area.y);
    const benchA = placeAt('bench', area.x + 1, area.y + 1);
    const benchB = placeAt('bench', area.x + 3, area.y + 1);
    const reader = adults.find((c) => c !== lover && c !== musician);
    free(reader, area.x + 2, area.y + 2);
    const readPlan = brain.resolveLeisure(reader, 'readBench', 11);
    check('Kitap Kurdu fener altındaki banka oturup kitap okumayı planlar', lantern && readPlan?.activity === 'readBench' && [benchA.id, benchB.id].includes(readPlan.buildingId), JSON.stringify(readPlan));
    const libPlan = brain.resolveLeisure(reader, 'readLibrary', 11);
    check("Kitap Kurdu Bilgelik Evi'nde kitap okumayı planlar", libPlan?.activity === 'readLibrary' && W.getBuilding(libPlan.buildingId)?.type === 'academy' && ACT.readLibrary.indoor);

    // Müzisyen: akşam handa / meydanda çalar, en çok 4 dinleyicinin keyfi dolar
    const fountain = W.getCompleted('fountain')[0];
    free(musician);
    const musicPlan = brain.planMusic(musician, 19, 50);
    check('Müzisyen akşam handa ya da meydan havuzunda çalmayı planlar', musicPlan?.activity === 'music' && ['inn', 'fountain'].includes(W.getBuilding(musicPlan.buildingId)?.type) && ['Handa', 'Meydanda'].includes(musicPlan.placeAt) && brain.planMusic(musician, 10, 50) === null);
    const stage = clearRect(8, 3, 12);
    musician.x = stage.x * 16 + 8;
    musician.y = stage.y * 16 + 12;
    musician.task = { activity: 'music', phase: 'perform', buildingId: fountain.id, placeAt: 'Meydanda', elapsed: 0, duration: 60 };
    const crowd = adults.filter((c) => c !== musician && c !== lover && c !== reader).slice(0, 5);
    crowd.forEach((c, i) => {
      free(c);
      c.x = musician.x + (i + 1) * 7;
      c.y = musician.y;
      c.needs.fun = 30;
    });
    const serenades = st.stats.serenades ?? 0;
    social.update({ gameMinutes: 10, hour: 19 });
    const raised = crowd.filter((c) => c.needs.fun > 34).length;
    check('çalan müzisyenin çevresindeki en yakın 4 dinleyicinin keyfi hızla dolar (5.si uzakta)', raised === 4 && crowd[4].needs.fun === 30 && musician.task.listeners === 4 && st.stats.serenades === serenades + 1, `${raised} ${crowd.map((c) => c.needs.fun.toFixed(1))}`);
    check('durum metni: "Meydanda melodiler çalıyor"', S.behavior.performLabel(musician, musician.task, ACT.music) === 'Meydanda melodiler çalıyor');
    free(musician);

    // Doğa Tutkunu: genç süs ağacının gölgesinde ya da nehir kenarında manzara
    const treeArea = clearRect(3, 3, 6);
    const young = placeAt('oakTree', treeArea.x + 1, treeArea.y + 1);
    young.plantedAt = st.totalMinutes - 25 * 60;
    sim.step(1);
    const fan = crowd[0];
    free(fan, treeArea.x + 1, treeArea.y + 3);
    let viewPlan = null;
    for (let i = 0; i < 12 && viewPlan?.view !== 'tree'; i++) viewPlan = brain.planViewpoint(fan, 40);
    check('Doğa Tutkunu genç süs ağacının gölgesinde manzarayı izler', young.growthStage === 1 && viewPlan?.activity === 'viewpoint' && viewPlan.view === 'tree', JSON.stringify(viewPlan));
    check('durum metni: "Süs ağacının gölgesinde manzarayı izliyor"', S.behavior.performLabel(fan, viewPlan, ACT.viewpoint) === 'Süs ağacının gölgesinde manzarayı izliyor');

    // --- Flört ve randevu ---
    const singles = adults.filter((c) => c.partnerId === null);
    let pair = null;
    for (let i = 0; i < singles.length && !pair; i++) for (let j = i + 1; j < singles.length && !pair; j++) if (RS.canRomance(singles[i], singles[j])) pair = [singles[i], singles[j]];
    check('randevu için iki bekâr yetişkin bulundu', pair, singles.map((c) => `${c.name}${c.age}`).join(','));
    const [A, B] = pair;
    const others = st.characters.filter((c) => c !== A && c !== B);
    for (const o of others) {
      for (const c of [A, B]) if (RS.getFriendship(st, c, o) >= SO.DATING.crushScore && RS.canRomance(c, o)) S.relationships.set(c, o, 10); // hoşlandıkları tek kişi birbirleri olsun
    }
    S.relationships.set(A, B, 45);
    free(A, area.x + 2, area.y + 2);
    free(B, area.x + 4, area.y + 2);
    A.lastDateAt = null;
    B.lastDateAt = null;
    const datePlan = forced(brain.rng, 0.01, () => brain.planDate(A, 18.5));
    check('ilişkisi yüksek (Dost) bekâr, hoşlandığı kişiyi randevuya çağırır', datePlan && datePlan.dateWithId === B.id && datePlan.inviteId === B.id, JSON.stringify(datePlan));
    check('randevu yeri çardak, han ya da yan yana iki bank', ['gazebo', 'inn', 'bench'].includes(datePlan.activity));
    const loner = { ...A, id: -999, homeId: null, partnerId: null, lastDateAt: null, parentIds: [] };
    check('hoşlandığı (Dost seviyesinde) kimse olmayan bekâr randevu istemez', forced(brain.rng, 0.01, () => brain.planDate(loner, 18.5)) === null);
    // Yan yana iki bankta randevu
    const benchPair = brain.benchPair(A);
    check('yan yana iki boş bank bulunur', benchPair && benchPair.map((b) => b.id).sort().join() === [benchA.id, benchB.id].sort().join(), JSON.stringify(benchPair?.map((b) => b.id)));
    const benchDate = { ...brain.benchPlan(benchPair[0], 'bench', 40), dateBenchId: benchPair[1].id, inviteId: B.id, dateWithId: B.id };
    S.behavior.startPlan(A, benchDate, 18.5);
    check('davet edilen yandaki banka oturmaya gelir (randevu)', B.task?.dateWithId === A.id && B.task.buildingId === benchPair[1].id && B.task.meetWithId === A.id && A.lastDateAt === st.totalMinutes, JSON.stringify(B.task && { a: B.task.activity, b: B.task.buildingId }));
    check('durum metni: "… ile randevuya gidiyor"', A.activityLabel.includes(`${B.name} ile randevuya gidiyor`), A.activityLabel);
    // Bankta yan yana: fazladan ilişki puanı, keyif, ilk randevu anısı
    for (const [c, b] of [[A, benchPair[0]], [B, benchPair[1]]]) {
      c.clearPath();
      c.x = b.seatPoint.x;
      c.y = b.seatPoint.y;
      c.task.phase = 'perform';
      c.pose = 'sit';
    }
    const before = RS.getFriendship(st, A, B);
    const dates = st.stats.dates ?? 0;
    social.update({ gameMinutes: 10, hour: 12 });
    check('randevudaki çiftin ilişki puanı fazladan artar', RS.getFriendship(st, A, B) >= before + SO.DATING.bonusRate * 10 * 0.5 - 1e-6 && st.stats.dates === dates + 1, `${before.toFixed(2)} -> ${RS.getFriendship(st, A, B).toFixed(2)}`);
    check('ilk randevu Yaşam Günlüğü\'ne yazılır', A.memories.some((m) => m.kind === 'date' && m.text.includes(B.name)) && B.memories.some((m) => m.kind === 'date' && m.text.includes(A.name)));
    check('durum metni: "… ile bankta yan yana oturuyor"', A.activityLabel === `${B.name} ile bankta yan yana oturuyor`, A.activityLabel);
    // Bankta yan yana oturan çift aşık olabilir
    S.relationships.set(A, B, 90);
    forced(S.relationships.rng, 0, () => social.update({ gameMinutes: 1, hour: 12 }));
    check('bankta yan yana oturan çift aşık olur (sevgili)', RS.arePartners(A, B) && !A.married);
    const loverPlan = forced(brain.rng, 0.01, () => {
      A.lastDateAt = null;
      B.lastDateAt = null;
      free(A, area.x + 2, area.y + 2);
      free(B, area.x + 4, area.y + 2);
      return brain.planDate(A, 19);
    });
    check('sevgililer de birbirlerini randevuya çağırır', loverPlan?.dateWithId === B.id);
    free(A, area.x + 2, area.y + 2);
    free(B, area.x + 4, area.y + 2);

    // --- Ortak ev: evlenen çift aynı kulübeye taşınır, boşalan kulübe göçmenlere açılır ---
    const homeArea = clearRect(6, 3, 8);
    const cabin1 = placeAt('cabin', homeArea.x, homeArea.y);
    const cabin2 = placeAt('cabin', homeArea.x + 3, homeArea.y);
    check('kulübe kapasitesi 2', cabin1?.capacity === 2 && cabin2?.capacity === 2);
    A.homeId = cabin1.id;
    B.homeId = cabin2.id;
    const freedBefore = st.stats.homesFreed ?? 0;
    const partiesBefore = st.stats.weddingParties ?? 0;
    // Dostlar düğüne davetli olsun
    const guests = others.filter((o) => !o.isChild && !o.away && o.visible).slice(0, 8);
    for (const g of guests) S.relationships.set(A, g, Math.max(RS.getFriendship(st, A, g), 30));
    S.relationships.marry(A, B, fountain, false);
    const home = W.getBuilding(A.homeId);
    check('evlenen çift aynı eve taşınır (birinin kulübesinde yer varsa oraya)', A.married && B.married && A.homeId === B.homeId && (A.relocating || B.relocating) && (home === cabin1 || home === cabin2 || home.upgraded), `${A.homeId} ${B.homeId}`);
    const vacated = [cabin1, cabin2].filter((h) => h !== home);
    check('boşalan kulübe göçmenlere açılır (günlük ve sayaç)', vacated.every((h) => W.getResidents(h).length === 0) && st.stats.homesFreed === freedBefore + vacated.length && events.includes('social:homeFreed') && st.journal.slice(-6).some((j) => j.text.includes('yeni göçmenlere açık')));
    const eligible = (h) => W.getResidents(h).length < h.capacity && !W.getResidents(h).some((c) => c.married);
    check('göç sistemi boşalan kulübeyi yeni sakinlere ayırabilir; çiftin evine göçmen yerleşmez', vacated.every(eligible) && !eligible(home) && S.population.findHome() !== null);
    // --- Düğün kutlaması ---
    const party = st.social.party;
    check('meydanda düğün kutlaması başlar (çift ve en çok 6 dost davetli)', party && party.coupleIds.includes(A.id) && party.coupleIds.includes(B.id) && party.guestIds.length > 0 && party.guestIds.length <= SO.WEDDING_PARTY.guests && st.stats.weddingParties === partiesBefore + 1, JSON.stringify(party && { g: party.guestIds.length }));
    check('davetliler çiftin dostları (puan en az 25)', party.guestIds.every((id) => Math.max(RS.getFriendship(st, A, W.getCharacter(id)), RS.getFriendship(st, B, W.getCharacter(id))) >= SO.WEDDING_PARTY.guestScore));
    check('düğün kutlaması günlüğe yazılır', st.journal.slice(-8).some((j) => j.text.startsWith('Meydanda düğün kutlaması') && j.text.includes(A.name)));
    A.needs.energy = 80;
    A.relocating = true;
    S.behavior.endTask(A);
    const partyPlan = brain.decide(A, 19);
    check('çift yeni evine taşınmadan önce meydandaki kutlamaya koşar', partyPlan.activity === 'weddingParty' && partyPlan.buildingId === fountain.id, JSON.stringify({ a: partyPlan.activity }));
    check('düğün haberi dedikoduya düşer (çift ve davetliler bilir)', st.social.gossip.some((n) => n.kind === 'wedding' && n.heardBy.includes(A.id) && n.heardBy.includes(party.guestIds[0])));
    // Konfeti çizilir
    let pixels = 0;
    new WeddingConfetti().draw({ fillRect: () => pixels++ }, party, 0.5);
    check('konfeti yağar (çizim)', pixels > 40, pixels);
    game.render(0);
    const guestId = party.guestIds[0];
    party.attended.push(guestId);
    sim.step(30);
    party.until = st.totalMinutes; // kutlama 45 dakika sürer: sonuna atla
    social.update({ gameMinutes: 1, hour: 19 });
    const partyDetail = JSON.stringify({ p: st.social.party, g: W.getCharacter(guestId).memories.slice(-3).map((m) => m.text) });
    check('kutlama biter, katılanların anısına "düğününde konfeti attı" yazılır', st.social.party === null && W.getCharacter(guestId).memories.some((m) => m.text === `${A.name} ile ${TR.genitive(B.name)} düğününde konfeti attı`) && A.memories.some((m) => m.text.includes('düğünlerini kutladı')), partyDetail);
    check('ev kapasiteleri aşılmaz', st.buildings.filter((b) => b.capacity).every((b) => W.getResidents(b).length <= b.capacity));

    // --- Evli çiftin akşam yemeği ---
    for (const c of [A, B]) {
      free(c, home.tileX, home.tileY + 2);
      c.homeId = home.id;
      c.dinnerDay = null;
      c.needs.hunger = 55;
    }
    const day = st.time.day;
    check('akşam yemeği yalnızca 18:00-20:30 arası', brain.planHomeDinner(A, 12) === null && brain.planHomeDinner(A, 21) === null);
    const dinner = brain.planHomeDinner(A, 18.5);
    check('acıkan eş, eşini evde birlikte yemeğe çağırır', dinner?.activity === 'homeDinner' && dinner.buildingId === home.id && dinner.dinnerWithId === B.id, JSON.stringify(dinner));
    S.behavior.startPlan(A, dinner, 18.5);
    check('eşi de sofraya gelir (günde bir kez)', B.task?.activity === 'homeDinner' && B.task.dinnerWithId === A.id && A.dinnerDay === day && B.dinnerDay === day && brain.planHomeDinner(A, 19) === null);
    const food = st.resources.food + st.resources.bread * 2.5 + st.pantry.credit;
    for (const c of [A, B]) {
      c.clearPath();
      c.task.phase = 'perform';
      S.behavior.enterIndoor(c, c.task, home);
    }
    const foodAfter = st.resources.food + st.resources.bread * 2.5 + st.pantry.credit;
    check('evde yenen akşam yemeği stoktan ödenir (kişi başı bir öğün)', Math.abs(food - foodAfter - MEAL * 2) < 1e-6 && A.insideBuildingId === home.id && B.insideBuildingId === home.id, `${food} -> ${foodAfter}`);
    A.needs.fun = 40;
    A.needs.social = 40;
    const dinners = st.stats.familyDinners ?? 0;
    social.update({ gameMinutes: 10, hour: 18.6 });
    check('birlikte yerken birbirlerinin keyfini ve sosyalliğini doldururlar', A.needs.fun >= 43 && A.needs.social >= 48 && A.buffs.cozyNight && B.buffs.cozyNight && st.stats.familyDinners === dinners + 1, `${A.needs.fun.toFixed(1)} ${A.needs.social.toFixed(1)}`);
    check('durum metni: "Eşi … ile evde akşam yemeği yiyor" ve ilk yemek anısı', A.activityLabel === `Eşi ${B.name} ile evde akşam yemeği yiyor` && A.memories.some((m) => m.kind === 'home'), A.activityLabel);
    for (const c of [A, B]) {
      S.behavior.endTask(c);
      free(c, home.tileX, home.tileY + 2);
    }

    // --- Dedikodu ---
    const M = adults.find((c) => c !== A && c !== B && !c.away);
    const L = adults.find((c) => c !== A && c !== B && c !== M && !c.away);
    const piece = { name: 'İşlemeli Yadigâr Sandık', icon: 'mwChest' };
    game.events.emit('masterwork:created', { item: {}, piece, character: M, building: null });
    const mwNews = st.social.gossip[st.social.gossip.length - 1];
    check('usta işi eser bir haber olur; ustası bilir', mwNews.kind === 'masterwork' && mwNews.heardBy.length === 1 && mwNews.heardBy[0] === M.id && mwNews.story === `${TR.genitive(M.name)} ustalıkla yaptığı ${piece.name} eserini`, mwNews.story);
    const heard = st.stats.gossipHeard ?? 0;
    const newsCount = (c) => c.memories.filter((m) => m.kind === 'gossip' && m.text.includes(piece.name)).length;
    const shared = social.share(M, L);
    check('sohbette haber aktarılır; dinleyenin son duyduğu haber olur', shared && L.lastNews?.id === mwNews.id && L.lastNews.from === M.name && mwNews.heardBy.includes(L.id) && st.stats.gossipHeard === heard + 1);
    check('haberi ilk kez duyanın Yaşam Günlüğü\'ne not düşer (ustanın kendi ağzından)', L.memories.some((m) => m.kind === 'gossip' && m.text === `${TR.ablative(M.name)}, ustalıkla yaptığı ${piece.name} eserini kendi ağzından dinledi`), L.memories[L.memories.length - 1]?.text);
    check('başlarında fısıltı / haber balonu', M.bubble?.icon === 'whisper' || !M.visible);
    const notesBefore = newsCount(L);
    social.share(M, L);
    check('aynı haber ikinci kez anlatılmaz', mwNews.heardBy.filter((id) => id === L.id).length === 1 && newsCount(L) === notesBefore);
    // Seferden dönüş haberi: "Leyla'dan, Emre'nin ... getirdiği kadim haritayı duydu"
    const E = adults.find((c) => c !== M && c !== L && c !== A && c !== B);
    game.events.emit('expedition:returned', { members: [E], route: 'Kayıp Tapınak', finds: ['cityMap'], loot: {}, memories: {}, text: 'Kadim bir harita buldular.' });
    const exNews = st.social.gossip[st.social.gossip.length - 1];
    check('seferden dönüş haberi: "…\'nin Kayıp Tapınak Seferi\'nden getirdiği kadim haritayı"', exNews.kind === 'expedition' && exNews.story === `${TR.genitive(E.name)} Kayıp Tapınak Seferi'nden getirdiği kadim haritayı`, exNews.story);
    social.share(E, L);
    check('haberi kahramanı anlatınca: "… getirdikleri kadim haritayı kendi ağzından dinledi"', L.memories.some((m) => m.text === `${TR.ablative(E.name)}, Kayıp Tapınak Seferi'nden getirdikleri kadim haritayı kendi ağzından dinledi`) && L.lastNews.id === exNews.id, L.memories.at(-1)?.text);
    // Başkasından duyan: "Leyla'dan, Emre'nin Kayıp Tapınak Seferi'nden getirdiği kadim haritayı duydu"
    const Z = adults.find((c) => ![A, B, M, L, E].includes(c) && !exNews.heardBy.includes(c.id) && c !== adults.find((x) => ![A, B, M, L, E].includes(x)));
    if (Z) {
      for (const n of st.social.gossip) if (n !== exNews && !n.heardBy.includes(Z.id)) n.heardBy.push(Z.id);
      social.share(L, Z);
      check('Yaşam Günlüğü: "X\'dan, Y\'nin … getirdiği kadim haritayı duydu"', Z.memories.some((m) => m.text === `${TR.ablative(L.name)}, ${TR.genitive(E.name)} Kayıp Tapınak Seferi'nden getirdiği kadim haritayı duydu`), Z.memories.at(-1)?.text);
    } else check('başkasından duyacak bir sakin var', false);
    // Sohbet grubunda kendiliğinden yayılır
    const X = adults.find((c) => ![A, B, M, L, E].includes(c));
    const keepGroups = S.relationships.groups;
    S.relationships.groups = [{ kind: 'chat', members: [L, X] }];
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    S.relationships.groups = keepGroups;
    check('aynı yerde sohbet edenler haberi birbirine aktarır', X.lastNews && exNews.heardBy.includes(X.id), X.lastNews?.text);
    // Yolda karşılaşıp selamlaşma
    const Y = adults.find((c) => ![A, B, M, L, E, X, Z].includes(c) && !exNews.heardBy.includes(c.id));
    for (const [c, dx] of [[X, 0], [Y, 6]]) {
      free(c, homeArea.x + 1, homeArea.y + 3);
      c.x += dx;
      c.task = { activity: 'stroll', phase: 'travel', elapsed: 0 };
    }
    S.relationships.groups = [];
    social.greetCooldowns.clear();
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    check('yolda karşılaşıp selamlaşanlar haberi aktarır', exNews.heardBy.includes(Y.id) && Y.lastNews?.fromId === X.id, Y.lastNews?.text);
    const heardNow = st.stats.gossipHeard;
    forced(social.rng, 0, () => social.spreadGossip(1, st.totalMinutes));
    check('aynı ikili bir süre yeniden selamlaşmaz', st.stats.gossipHeard === heardNow);
    S.relationships.groups = keepGroups;
    for (const c of [X, Y]) free(c);
    // Barışma haberi günde bir kez
    const recBefore = st.social.gossip.filter((n) => n.kind === 'reconcile').length;
    st.social.reconcileNewsDay = null;
    game.events.emit('relationship:reconciled', { a: M, b: L, place: 'inn' });
    game.events.emit('relationship:reconciled', { a: E, b: X, place: 'chat' });
    check('barışma haberi olur (günde bir)', st.social.gossip.filter((n) => n.kind === 'reconcile').length === recBefore + 1);
    // Kasabanın çoğu duyunca günlüğe "dilden dile"
    const everyone = st.characters.filter((c) => !c.role);
    const needed = Math.ceil(everyone.length * SO.GOSSIP.spreadShare);
    for (const c of everyone) if (mwNews.heardBy.length < needed - 1 && !mwNews.heardBy.includes(c.id)) mwNews.heardBy.push(c.id);
    const lastOne = everyone.find((c) => !mwNews.heardBy.includes(c.id));
    for (const n of st.social.gossip) if (n !== mwNews && !n.heardBy.includes(lastOne.id)) n.heardBy.push(lastOne.id); // yalnızca bu haberi duymamış olsun
    social.share(M, lastOne);
    check('haber kasabanın çoğuna yayılınca günlüğe "dilden dile" yazılır', mwNews.spread && st.journal.slice(-5).some((j) => j.text.startsWith('Kasabada dilden dile')), `${mwNews.heardBy.length}/${everyone.length}`);
    // Eski haberler dolaşımdan düşer
    mwNews.at -= 5 * 1440;
    social.expireNews();
    check('4 günden eski haber dolaşımdan düşer (sakinin son duyduğu kalır)', !st.social.gossip.includes(mwNews) && L.lastNews);

    // --- Karakter Detay Kartı ---
    game.events.emit('ui:selectCharacter', A.id);
    game.render(0);
    const card = document.querySelector('.character-panel .social-life')?.textContent ?? '';
    const quirkName = SO.QUIRKS[A.quirk].name;
    check('kartta Sosyal Hayat: huyu, eşi ve evi', card.includes(quirkName) && card.includes(B.name) && card.includes('Eşiyle') && card.includes('birlikte yaşıyor'), card);
    check('kartta huy çipi kişilik etiketlerinin yanında', [...document.querySelectorAll('.character-panel .quirk-chip')].some((e) => e.textContent.includes(quirkName)));
    game.events.emit('ui:selectCharacter', L.id);
    game.render(0);
    const card2 = document.querySelector('.character-panel .social-life')?.textContent ?? '';
    check('kartta son duyduğu dedikodu (kimden, ne zaman)', card2.includes(L.lastNews.text) && card2.includes(`${L.lastNews.from} anlattı`), card2);
    game.events.emit('ui:selectCharacter', null);
    // (16. aşama hatası, 19. aşamada stres matrisinde bulundu) sefere yürürken görevi kesilen sakin yeniden kenara yönelir
    {
      const walker = adults.find((c) => ![A, B, L].includes(c) && !c.away);
      free(walker);
      walker.away = { stage: 'leaving', until: st.totalMinutes + 600, exit: W.findEntryTile(S.behavior.rng) };
      walker.task = null;
      S.behavior.updateCharacter(walker, { gameMinutes: 1, hour: 11, simDt: 1 / 60 });
      check('sefere yürürken görevi kesilen sakin yeniden harita kenarına yönelir', walker.task?.activity === 'expedition' || walker.away.stage === 'away', walker.task?.activity);
      S.behavior.endTask(walker);
      walker.away = null;
      free(walker);
    }
    offs.forEach((off) => off());
    window.__s19 = { a: A.id, b: B.id, home: home.id, quirks: Object.fromEntries(st.characters.map((c) => [c.id, c.quirk])), news: { id: L.id, text: L.lastNews.text, from: L.lastNews.from }, gossip: st.social.gossip.length, dinnerDay: A.dinnerDay, dates: st.stats.dates, dinners: st.stats.familyDinners };
  }

  // ===== 20. aşama: Ulu Saat Kulesi, Altın Çağ, Tarihçe Kütüğü, prestij peyzajı =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const GA = await import('/src/systems/GoldenAge.js');
    const GD = await import('/src/data/goldenAge.js');
    const { BUILDINGS: BD } = await import('/src/data/buildings.js');
    const { offersFor: offers } = await import('/src/data/trade.js');
    const TS = await import('/src/systems/TownStatus.js');
    const { getSeason: season } = await import('/src/data/seasons.js');
    const tower = GA.towerOf(st);
    const stages = BD.wonder.wonder.stages;
    sim.give({ wood: 600, stone: 900, iron: 400, gold: 4000, food: 200 });

    // --- Kulenin kuralları ---
    check('kulenin adı Ulu Saat Kulesi; Kasaba seviyesi ve 20 sakinle açılır', BD.wonder.name === 'Ulu Saat Kulesi' && BD.wonder.requiresTier === 3 && BD.wonder.requiresPopulation === 20 && GD.TOWER_UNLOCK.population === 20);
    check('üç aşama: Temel, Gövde, Mekanizma & Çan', stages.map((x) => x.name).join(',') === 'Temel,Gövde,Mekanizma & Çan');
    check('Temel bol taş ve kereste ister', Object.keys(stages[0].cost).sort().join() === 'stone,wood' && stages[0].cost.stone >= 300 && stages[0].cost.wood >= 300);
    check('Gövde taş ve demir ister; Yapı Ustaları hızlandırır', stages[1].cost.stone > 0 && stages[1].cost.iron > 0 && stages[1].masters.includes('building'));
    check('Mekanizma & Çan Kadim Dişli ister; usta zanaatkârlar hızlandırır', stages[2].cost.gears === 8 && stages[2].masters.includes('crafting'));
    // Ustalık katkısı
    const fake = (wonderStage) => ({ definition: BD.wonder, underConstruction: false, project: { kind: 'stage' }, wonderStage });
    const { skillLevel } = await import('/src/systems/SkillSystem.js');
    const pro = { skills: { building: 99999 } };
    const mid = { skills: { building: 700 } };
    const crafter = { skills: { crafting: 99999 } };
    const mason = { skills: { masonry: 99999 } };
    check('Gövdede Usta yapı ustası 1,6 kat, Kalfa 1,25 kat hızlı', GA.towerMasteryMultiplier(pro, fake(1), skillLevel) === GD.TOWER_MASTERY.master && GA.towerMasteryMultiplier(mid, fake(1), skillLevel) === GD.TOWER_MASTERY.journeyman && GA.towerMasteryMultiplier({ skills: {} }, fake(1), skillLevel) === 1, `${GA.towerMasteryMultiplier(mid, fake(1), skillLevel)}`);
    check('Mekanizma & Çan aşamasında usta zanaatkâr hızlandırır, taşçı hızlandırmaz', GA.towerMasteryMultiplier(crafter, fake(2), skillLevel) === GD.TOWER_MASTERY.master && GA.towerMasteryMultiplier(mason, fake(2), skillLevel) === 1);

    // --- Kadim Dişli ve aşamanın gerçek inşası (kule geçici olarak Gövde'ye döndürülür) ---
    const workshop = W.getCompleted('workshop')[0];
    tower.wonderStage = 2;
    st.resources.gears = 0;
    check('Gövde bitince 8 Kadim Dişli gerekir', GA.gearsNeeded(st) === 8, GA.gearsNeeded(st));
    const keepCraft = workshop.craft;
    workshop.craft = null;
    const pick = S.crafting.chooseItem(workshop);
    check('Zanaat Atölyesi önce Kadim Dişli döker', pick.item === 'clockGear' && pick.recipe.cost.iron === GD.CLOCK_GEAR.cost.iron, JSON.stringify(pick));
    const casts = [];
    const offCast = game.events.on('goldenAge:gearCast', (p) => casts.push(p));
    S.crafting.work(workshop, 1);
    S.crafting.work(workshop, GD.CLOCK_GEAR.work);
    offCast();
    check('dökülen dişli stoğa girer (Mallar)', st.resources.gears === 1 && casts.length === 1 && workshop.craft === null);
    check('dişli eksikken Mekanizma aşaması başlatılamaz', S.construction.checkProject(tower).reason?.includes('Kadim Dişli'), S.construction.checkProject(tower).reason);
    st.resources.gears = 8;
    check('dişliler tamamlanınca atölye dişli dökmeyi bırakır', GA.gearsNeeded(st) === 0 && S.crafting.chooseItem(workshop).item !== 'clockGear');
    const started = S.construction.startProject(tower);
    check('Mekanizma & Çan aşaması başlar, dişliler harcanır', started.ok && tower.project?.kind === 'stage' && st.resources.gears === 0 && GA.towerStageIndex(tower) === 2, started.reason);
    const job = S.jobs.jobs.find((j) => j.buildingId === tower.id && j.project);
    const builder = st.characters.find((c) => !c.isChild && !c.away && c.visible);
    const keepSkills = { ...builder.skills };
    builder.skills = { ...builder.skills, crafting: 99999 };
    S.behavior.endTask(builder);
    const task = { activity: 'build', jobId: job.id, phase: 'perform', elapsed: 0, duration: 60 };
    builder.task = task;
    const workBefore = st.chronicle.towerWork[builder.id] ?? 0;
    const progBefore = job.progress;
    S.behavior.performWork(builder, task, 10);
    const gained = job.progress - progBefore;
    check('kule şantiyesindeki görev tanınır (çekiç balonları)', S.behavior.towerFor(task) === tower);
    check('usta zanaatkârın emeği kuleyi hızlandırır ve Tarihçe\'ye yazılır', (st.chronicle.towerWork[builder.id] ?? 0) - workBefore === gained && gained > 10 * 1.5, `${gained.toFixed(1)}`);
    builder.skills = keepSkills;
    S.behavior.endTask(builder);
    S.construction.cancelProject(tower);
    tower.wonderStage = 3;
    workshop.craft = keepCraft;
    check('kule yeniden tamam (Altın Çağ sürüyor)', tower.wonderComplete && GA.isGoldenAge(st));

    // --- Altın Çağ: kalıcı etkiler ---
    check('Altın Çağ kule tamamlanınca başladı ve Tarihçe\'ye yazıldı', st.goldenAge.since && st.chronicle.goldenAge && st.chronicle.towerStages[3]?.name === 'Mekanizma & Çan');
    const since = st.goldenAge.since;
    for (const c of st.characters) c.needs.fun = 30;
    st.goldenAge.since = null;
    const plainWork = TS.townWorkMultiplier(st);
    const plainHappy = TS.townHappiness(st);
    st.goldenAge.since = since;
    check('çalışma şevki kalıcı +%10', Math.abs(TS.townWorkMultiplier(st) / plainWork - GD.GOLDEN_AGE.workMultiplier) < 1e-9);
    check('kasaba refahına kalıcı +%10 çarpan', Math.abs(TS.townHappiness(st) - Math.min(100, plainHappy * GD.GOLDEN_AGE.welfareMultiplier)) < 1e-6, `${plainHappy.toFixed(1)} -> ${TS.townHappiness(st).toFixed(1)}`);
    // Kule saati 08:00 ve 18:00'de çalar
    const awake = st.characters.filter((c) => !c.isChild && !c.away && !c.isSleeping).slice(0, 3);
    awake.forEach((c) => (c.needs.energy = 40));
    const chimes = st.goldenAge.chimes;
    const heard = [];
    const offChime = game.events.on('goldenAge:chime', (p) => heard.push(p));
    game.events.emit('time:hour', 9);
    check('kule saati 09:00\'da çalmaz', st.goldenAge.chimes === chimes);
    game.events.emit('time:hour', 8);
    check('kule saati 08:00\'de çalar: duyanların yorgunluğu azalır', st.goldenAge.chimes === chimes + 1 && heard.length === 1 && heard[0].heard > 0 && awake.every((c) => c.needs.energy >= 40 + GD.GOLDEN_AGE.chimeEnergy - 1e-6), `${awake.map((c) => c.needs.energy.toFixed(0))}`);
    game.events.emit('time:hour', 18);
    offChime();
    check('kule saati 18:00\'de de çalar', st.goldenAge.chimes === chimes + 2);
    game.render(0);
    check('çan ses dalgası çizilir', S.chimeWaves.startedAt !== null);
    let dots = 0;
    const waves = new S.chimeWaves.constructor();
    waves.ring();
    waves.draw({ fillRect: () => dots++, drawImage: () => dots++ }, tower, 10);
    waves.draw({ fillRect: () => dots++, drawImage: () => dots++ }, tower, 10.8);
    check('ses dalgası halkaları ve altın notalar', dots > 40, dots);

    // --- Çağ Kutlaması (yeniden başlatılarak denenir) ---
    const keepChronicleAge = st.chronicle.goldenAge;
    const celebrations = st.stats.ageCelebrations ?? 0;
    const startedEvents = [];
    const offStart = game.events.on('goldenAge:celebrationStarted', (p) => startedEvents.push(p));
    S.goldenAge.begin(tower);
    offStart();
    const cel = st.goldenAge.celebration;
    check('Çağ Kutlaması meydanda başlar, çan ilk kez çalar', cel && cel.until - st.totalMinutes === GD.AGE_CELEBRATION.minutes && startedEvents.length === 1 && st.stats.ageCelebrations === celebrations + 1 && W.getBuilding(cel.venueId));
    const guest = st.characters.find((c) => !c.isChild && !c.away && c.visible && !c.isSleeping);
    guest.needs.energy = 80;
    guest.needs.hunger = 80;
    S.behavior.endTask(guest);
    const celPlan = S.behavior.brain.decide(guest, 11);
    check('sakinler Çağ Kutlaması\'na koşar', celPlan.activity === 'ageCelebration' && celPlan.buildingId === cel.venueId, celPlan.activity);
    guest.task = { ...celPlan, phase: 'perform', elapsed: 0 };
    guest.needs.fun = 30;
    S.goldenAge.update({ gameMinutes: 10, hour: 11 });
    check('kutlamadakilerin keyfi dolar', guest.needs.fun > 33 && cel.attended.includes(guest.id));
    cel.until = st.totalMinutes;
    S.goldenAge.update({ gameMinutes: 1, hour: 11 });
    check('kutlama biter; katılanlar "ilk çanı" anısını taşır, oyun sürer', st.goldenAge.celebration === null && guest.memories.some((m) => m.text.includes('ilk çanını')) && GA.isGoldenAge(st));
    S.behavior.endTask(guest);
    st.chronicle.goldenAge = keepChronicleAge;

    // --- Prestij peyzajı ---
    st.goldenAge.since = null;
    const locked = S.construction.checkPlacement('marbleFountain', plaza.centerX + 7, plaza.centerY + 7).reason;
    st.goldenAge.since = since;
    check('Mermer Çeşme ve Altın Çağ Feneri Altın Çağ\'da açılır', String(locked).includes('Altın Çağ') && BD.marbleFountain.requiresGoldenAge && BD.goldenLantern.requiresGoldenAge, locked);
    const mf = sim.place('marbleFountain');
    const gl = sim.place('goldenLantern');
    check('Mermer Çeşme kurulur (estetik ve keyif alanı)', mf && mf.functional && BD.marbleFountain.funAura && W.aesthetics.some((v) => v > 0));
    gl.lit = true;
    const lights = [];
    gl.collectLights(lights, { time: 0, windowsLit: true });
    check('Altın Çağ Feneri gece geniş altın ışık yayar', lights.some((l) => l.radius === 96));
    const sprites = await import('/src/art/sprites/index.js');
    check('prestij yapılarının görselleri çizilir (çeşme dört kare)', sprites.getStructureSprite('marbleFountain', { frame: 2 }).width === 32 && sprites.getStructureSprite('goldenLantern', { lit: true }).height === 40);

    // --- Gezgin tüccar: daha sık, nadir tohum ve antik kitap ---
    const sk = season(st.time.day).key;
    check('Altın Çağ\'da tüccar nadir tohum ve antik kitap getirir', offers(sk, 4, true).some((o) => o.id === 'rareSeeds') && offers(sk, 4, true).some((o) => o.id === 'ancientBooks') && !offers(sk, 4, false).some((o) => o.goldenAge));
    check('tüccar daha sık gelir (ziyaret arası x0,6)', GA.goldenMerchantInterval(st) === GD.GOLDEN_AGE.merchantInterval);
    const seeds = st.exploration.items.vineSeed;
    S.townEvents.grantRare('vineSeed');
    const books = st.goldenAge.books;
    S.townEvents.grantRare('ancientBook');
    check('nadir tohum egzotik fide olur; antik kitap araştırmayı %5 hızlandırır', st.exploration.items.vineSeed === seeds + 1 && st.goldenAge.books === books + 1 && Math.abs(GA.bookResearchMultiplier(st) - (1 + st.goldenAge.books * 0.05)) < 1e-9);

    // --- Tarihçe Kütüğü ---
    const ch = st.chronicle;
    check('Tarihçe: kurucu sakinler', ch.founders.length >= 1 && ch.founders.every((f) => typeof f.name === 'string'), ch.founders.map((f) => f.name).join(','));
    check('Tarihçe: ilk evlenen çift ve ilk usta eseri', (ch.firstCouple?.a && ch.firstCouple?.b) && ch.firstMasterwork?.maker, JSON.stringify([ch.firstCouple, ch.firstMasterwork]));
    check('Tarihçe: kulenin aşamaları ve baş ustası', [1, 2, 3].every((i) => ch.towerStages[i]) && GA.towerMasterOf(st)?.name);
    game.events.emit('ui:toggleStats');
    const archive = document.querySelector('.archive-panel');
    archive.querySelector('.archive-tab[data-tab="chronicle"]').click();
    game.render(0);
    const text = archive.querySelector('.chronicle-view')?.textContent ?? '';
    check('Arşiv\'de Tarihçe Kütüğü sekmesi: berat açılır', !archive.querySelector('.chronicle-view').hidden && archive.querySelector('.archive-view').hidden && text.includes('Tarihçe Kütüğü') && text.includes('Kurucu Sakinler') && text.includes(ch.founders[0].name), text.slice(0, 120));
    check('beratta altın harfler: ilk çift, ilk eser, baş usta, Altın Çağ', archive.querySelectorAll('.chronicle-gold').length >= 4 && text.includes('Mekanizma & Çan') && text.includes('Altın Çağ'));
    archive.querySelector('.archive-tab[data-tab="archive"]').click();
    game.render(0);
    check('Kasaba Arşivi sekmesine geri dönülür', !archive.querySelector('.archive-view').hidden);
    game.events.emit('ui:toggleStats');
    window.__s20 = { since: JSON.stringify(st.goldenAge.since), chimes: st.goldenAge.chimes, books: st.goldenAge.books, founders: ch.founders.length, master: GA.towerMasterOf(st)?.name, stages: Object.keys(ch.towerStages).length, couple: ch.firstCouple?.a, fountain: mf.id };
  }

  // --- Kayıt gidiş-dönüşü (sürüm 19) ---
  const ill = s.characters.find((c) => !c.isChild);
  scene.health.fallIll(ill);
  hut.remedies = 4;
  farm.damaged = true;
  s.dilemma.storm = { kind: 'storm', at: s.totalMinutes + 600, fortified: true, watchChance: 0 };
  const animals = s.animals.length;
  game.events.emit('ui:save');
  const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
  game.events.emit('ui:load');
  const s2 = game.state;
  const ill2 = s2.characters.find((c) => c.id === ill.id);
  check('kayıt sürümü 32', raw.version === 32);
  // (20. aşama) Altın Çağ, Tarihçe Kütüğü, prestij yapısı kaydı
  {
    const T = window.__s20;
    check('kayıttan Altın Çağ (başlangıcı, çan sayısı, antik kitaplar) döner', JSON.stringify(s2.goldenAge.since) === T.since && s2.goldenAge.chimes === T.chimes && s2.goldenAge.books === T.books);
    check('kayıttan Tarihçe Kütüğü (kurucular, ilk çift, kulenin aşamaları ve baş ustası) döner', s2.chronicle.founders.length === T.founders && Object.keys(s2.chronicle.towerStages).length === T.stages && s2.chronicle.firstCouple?.a === T.couple && (await import('/src/systems/GoldenAge.js')).towerMasterOf(s2)?.name === T.master);
    check('kayıttan Mermer Çeşme ve Kadim Dişli stoğu döner', s2.buildings.some((b) => b.id === T.fountain && b.type === 'marbleFountain') && s2.resources.gears === raw.resources.gears);
  }
  // (19. aşama) evlilik, ortak ev, huylar, dedikodu kaydı
  {
    const T = window.__s19;
    const a2 = s2.characters.find((c) => c.id === T.a);
    const b2 = s2.characters.find((c) => c.id === T.b);
    check('kayıttan evli çift ve ortak evleri döner', a2?.married && b2?.married && a2.partnerId === T.b && a2.homeId === T.home && b2.homeId === T.home);
    check('kayıttan karakter huyları döner', s2.characters.every((c) => T.quirks[c.id] === undefined || c.quirk === T.quirks[c.id]));
    check('kayıttan son duyulan haber ve dolaşan dedikodular döner', s2.characters.find((c) => c.id === T.news.id)?.lastNews?.text === T.news.text && s2.social.gossip.length === T.gossip);
    check('kayıttan akşam yemeği günü ve sosyal sayaçlar döner', a2.dinnerDay === T.dinnerDay && s2.stats.dates === T.dates && s2.stats.familyDinners === T.dinners);
  }
  // (18. aşama) peyzaj kaydı
  {
    const L = window.__l18;
    const sign2 = s2.buildings.find((b) => b.id === L.sign.id);
    const tree2 = s2.buildings.find((b) => b.id === L.tree.id);
    check('kayıttan tabelanın adı döner', sign2?.label === L.sign.label && sign2.name === L.sign.label);
    check('kayıttan süs ağacının dikiliş anı ve büyümesi döner', tree2?.plantedAt === L.tree.plantedAt && tree2.growthStage === 2);
    check('kayıttan yıkım iadesinin küsuratı ve döşenen yol sayacı döner', JSON.stringify(s2.landscape.refundCredit) === JSON.stringify(L.credit) && s2.landscape.roadsPainted === L.roads);
    check('kayıttan çit kapısı yine yürünebilir ve çitler birleşik', game.scenes.current.world.map.isWalkable(L.gate.x, L.gate.y) && s2.buildings.find((b) => b.id === L.gateId)?.connect?.left);
    check('yüklenince kasaba estetiği yeniden hesaplanır', s2.landscape.score > 0 && game.scenes.current.world.aesthetics.some((v) => v > 0));
  }
  check('kayıttan anılar döner', s2.characters.find((c) => c.id === window.__mem.id)?.memories.length === window.__mem.count);
  check('kayıttan festival geçmişi, kervan seferi ve sayaçlar döner', ['spring', 'summer', 'autumn', 'winter'].every((t) => s2.seasonFestival.held[t] >= 1) && s2.trade.grandVoyages >= 1 && s2.stats.rallies >= 1 && s2.stats.seasonFestivals >= 4);
  check('kayıttan yadigârlar, ipek ve fermanlar döner', RELIC_KEYS.every((id) => s2.luxury.relics[id]) && s2.luxury.silk && s2.luxury.decreeDays.goldBonus !== undefined && s2.luxury.goldSpent === s.luxury.goldSpent);
  check('kayıttan arşiv ve sayaçlar döner', s2.history.length === s.history.length && s2.stats.weddings === s.stats.weddings);
  check('kayıttan sakin adı ve sabit işçi döner', s2.characters.some((c) => c.id === window.__renamed.id && c.name === window.__renamed.name && c.customName) && s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId === window.__pin.buildingId, `${s2.characters.map((c) => c.name).join(',')} pin ${s2.characters.find((c) => c.id === window.__pin.id)?.workplaceId}/${window.__pin.buildingId} önce ${s.characters.find((c) => c.id === window.__pin.id)?.workplaceId}`);
  check('kayıttan kemer yine altından geçilir', !window.__arch || (game.scenes.current.world.map.isWalkable(window.__arch.x, window.__arch.y) && game.scenes.current.world.map.getOccupant(window.__arch.x, window.__arch.y) === window.__arch.id));
  check('kayıttan araştırmalar döner', ['gears', 'architecture', 'herbalism', 'insulation'].every((id) => s2.research.done[id]) && s2.research.active === null);
  check('kayıttan liman, hazine ve ihracat döner', s2.trade.shipments === raw.trade.shipments && raw.trade.shipments >= 2 && s2.trade.goldEarned > 0 && s2.resources.gold === raw.resources.gold && s2.buildings.find((b) => b.type === 'harbor')?.exportThreshold === null);
  check('kayıttan harika aşaması döner', s2.buildings.find((b) => b.type === 'wonder')?.wonderStage === 3 && s2.buildings.find((b) => b.type === 'wonder')?.wonderComplete);
  check('kayıttan okul mezunu döner', s2.characters.some((c) => c.educated));
  check('kayıttan hayvanlar ve adları döner', s2.animals.length === animals && s2.animals.some((a) => a.name === cat.name));
  check('kayıttan hastalık, iksir ve hasar döner', ill2?.illness && s2.buildings.find((b) => b.id === hut.id)?.remedies === 4 && s2.buildings.find((b) => b.id === farm.id)?.damaged);
  check('kayıttan usta işi eserler (sergilenen ve satılanlar) döner', s2.masterworks.items.length === raw.masterworks.items.length && s2.masterworks.made === raw.masterworks.made && raw.masterworks.made >= window.__mw15.made && s2.masterworks.items.filter((i) => i.status === 'exhibited').length === raw.masterworks.items.filter((i) => i.status === 'exhibited').length);
  check('yüklenince ustanın kıyafeti deneyiminden yeniden giyilir', s2.characters.find((c) => c.id === window.__mw15.makerId)?.outfit === 'miner:3');
  check('kayıttan keşif ganimetleri, yazıtlar ve şemalar döner', Object.keys(s2.exploration.inscriptions).length === window.__x16.inscriptions && s2.exploration.cityMap === window.__x16.map && s2.exploration.expeditions === window.__x16.expeditions && s2.exploration.inscriptions.aqueduct?.status === 'decoded');
  check('kayıttan maceracıların anlatacağı hikâyeler döner', s2.characters.filter((c) => window.__x16.teamIds.includes(c.id) && c.tale).length === window.__x16.tales);
  check('kayıttan ferman ve fırtına döner', s2.civic.storageLevel === 1 && s2.civic.craftGuild && s2.dilemma.storm?.fortified);
  // ===== 21. aşama: kişisel kese ve çanta, vatandaş dilekçeleri, Yönetim Güveni, isyan ve yağma =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CZ = await import('/src/systems/Citizens.js');
    const CD = await import('/src/data/citizens.js');
    const PT = await import('/src/systems/Petitions.js');
    const TR = await import('/src/systems/TrustSystem.js');
    const { Character: Ch } = await import('/src/entities/Character.js');
    const now = () => st.totalMinutes;
    sim.give({ wood: 300, stone: 300, food: 250, bread: 60, iron: 80, gold: 2000 });
    for (const t of ['market', 'mill', 'healerHut', 'inn', 'storage', 'workshop']) if (!W.getCompleted(t).length) sim.place(t);
    const hudOf = () => game.ui.components.find((x) => x.renderWelfare);
    const renderNow = () => {
      hudOf().welfareAt = -Infinity; // üst çubuk yarım saniyede bir yenilenir: hemen çizilsin
      game.render(0);
    };
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6; // bu bölümde dilekçeleri test kendisi açar
    if (st.trust.revolt) S.trust.endRevolt();
    st.trust.value = 75;
    const adults = st.characters.filter((c) => !c.isChild && !c.away && c.visible);
    const A = adults[0];
    const B = adults[1];
    const resetBag = (c) => {
      c.inventory = [];
      c.equipment.bag = null;
    };

    // --- Kişisel kese ve çanta ---
    const fresh = new Ch({ id: 99001, name: 'Deneme', traits: [], appearance: A.appearance });
    const kid = new Ch({ id: 99002, name: 'Minik', traits: [], appearance: A.appearance, growsUpAt: 1e9 });
    check('yeni sakine başlangıç harçlığı (yetişkin 12, çocuk 3) ve boş çanta', fresh.coins === CD.PURSE.allowance.adult && kid.coins === CD.PURSE.allowance.child && fresh.inventory.length === 0);
    check('her sakinin kesesi sayı ve çantası dizi', st.characters.every((c) => Number.isFinite(c.coins) && c.coins >= 0 && Array.isArray(c.inventory)));
    const keepBag = A.equipment.bag;
    resetBag(A);
    check('çanta 4 yuva; Sırt Çantası kuşanınca 6; çocukta 2 (ekipman yuvası değişmez)', CZ.inventoryCapacity(A) === 4 && (A.equipment.bag = 'backpack', CZ.inventoryCapacity(A) === 6) && CZ.inventoryCapacity(kid) === 2 && A.equipment.bag === 'backpack');
    A.equipment.bag = null;
    const put = CZ.addItem(A, 'bread', 8);
    check('eşyalar istiflenir (ekmek 6\'lık yığın), fazlası yeni yuvaya', put === 8 && A.inventory.length === 2 && A.inventory[0].qty === 6 && CZ.countItem(A, 'bread') === 8);
    CZ.addItem(A, 'souvenir', 1, 'Boncuk Kolye');
    CZ.addItem(A, 'herb', 1);
    check('çanta dolunca yeni tür sığmaz', CZ.addItem(A, 'fruit', 1) === 0 && A.inventory.length === 4 && CZ.roomFor(A, 'fruit') === 0);
    check('çantadan eşya çıkar', CZ.takeItem(A, 'bread', 3) === 3 && CZ.countItem(A, 'bread') === 5);
    check('çantanın kısa yazımı adlı hatırayı gösterir', CZ.describeInventory(A).includes('Boncuk Kolye') && CZ.describeInventory(A).includes('Ekmek ×'));
    resetBag(A);

    // Yevmiye: gerçek bir vardiya bitince
    let shift = null;
    for (const c of adults) {
      if (shift) break;
      S.behavior.endTask(c);
      const plan = S.behavior.brain.planWork(c);
      if (!plan?.workBuildingId) continue;
      S.behavior.startPlan(c, plan, 10);
      if (!c.task) continue;
      c.clearPath();
      c.task.phase = 'perform';
      shift = c;
    }
    if (shift) {
      const before = shift.coins;
      const wages = st.stats.wagesPaid;
      shift.task.elapsed = (shift.task.duration ?? 60) + 1;
      sim.step(1);
      check('vardiya bitince yevmiye keseye girer (hazineden düşülmez)', shift.coins >= before + CD.PURSE.wage.shift && st.stats.wagesPaid > wages, `${before}->${shift.coins}`);
    } else check('vardiya bitince yevmiye keseye girer (hazineden düşülmez)', false, 'çalışan yok');
    let coins = B.coins;
    const gold = st.resources.gold;
    game.events.emit('work:jobDone', { character: B, job: { type: 'build' }, yields: {} });
    game.events.emit('work:jobDone', { character: B, job: { type: 'chop' }, yields: {} });
    game.events.emit('masterwork:created', { character: B, piece: { name: 'x' } });
    check('inşaat (+2), hasat (+1) ve usta işi eser (+15) ödülü; kasaba hazinesi değişmez', B.coins === coins + 18 && st.resources.gold === gold, `${coins}->${B.coins}`);
    coins = kid.coins;
    S.purse.pay(kid, 5);
    check('çocuklara yevmiye ödenmez', kid.coins === coins);

    // İş yerinden pay: fırıncı ekmeği kasaba stoğundan alır (kaybolmaz, çantaya geçer)
    const mill = W.getCompleted('mill')[0];
    resetBag(B);
    sim.give({ bread: 40 });
    let townBread = st.resources.bread;
    for (let i = 0; i < 60 && CZ.countItem(B, 'bread') === 0; i++) S.purse.onShift(B, mill);
    check('fırıncı vardiya sonunda ekmek payını kasaba stoğundan çantasına alır', CZ.countItem(B, 'bread') === 1 && st.resources.bread === townBread - 1, `${townBread}->${st.resources.bread}`);
    resetBag(B);
    for (let i = 0; i < 60 && CZ.countItem(B, 'herb') === 0; i++) S.purse.onShift(B, W.getCompleted('healerHut')[0]);
    const hutB = W.getCompleted('healerHut')[0];
    check('şifacı kulübesinden şifalı ot payı', CZ.countItem(B, 'herb') === 1 || (hutB?.herbs ?? 0) < 3, `ot ${hutB?.herbs}`);

    // Çantadan yemek
    resetBag(B);
    CZ.addItem(B, 'bread', 2);
    S.behavior.endTask(B);
    B.needs.hunger = 10;
    const snackPlan = S.behavior.brain.decide(B, 13);
    check('çok acıkınca yürümeden çantasından yer (snack)', snackPlan.activity === 'snack' && snackPlan.bagItem === 'bread', snackPlan.activity);
    S.behavior.startPlan(B, snackPlan, 13);
    sim.step(3);
    const snackLabel = B.activityLabel;
    const meals = st.stats.bagMeals;
    for (let i = 0; i < 300 && B.task?.activity === 'snack'; i++) sim.step(5);
    check('çantadaki ekmek yenir: tokluk dolar, ekmek azalır, sayaç artar', B.needs.hunger >= 60 && CZ.countItem(B, 'bread') < 2 && st.stats.bagMeals === meals + 1, `${Math.round(B.needs.hunger)} ${CZ.countItem(B, 'bread')}`);
    check('durum metni: "Çantasından ekmek çıkarıp yiyor"', snackLabel === 'Çantasından ekmek çıkarıp yiyor', snackLabel);

    // Şifalı ot çayı
    resetBag(B);
    CZ.addItem(B, 'herb', 1);
    S.health.fallIll(B);
    const remain = B.illness.remaining;
    S.behavior.endTask(B);
    B.needs.hunger = 90;
    const tea = S.behavior.brain.decide(B, 13);
    check('üşüyen sakin çantasındaki şifalı otu demler', tea.activity === 'herbTea', tea.activity);
    S.purse.herbTea(B);
    check('şifalı ot hastalığın kalan süresini %40 kısaltır ve çantadan çıkar', Math.abs(B.illness.remaining - remain * 0.6) < 1e-6 && CZ.countItem(B, 'herb') === 0);
    B.illness = null;

    // Pazar alışverişi ve han azığı
    const market = W.getCompleted('market')[0];
    resetBag(B);
    B.coins = 20;
    const bought = S.purse.shop(B, market);
    check('Pazar Yeri\'nden alışveriş: kese azalır, eşya çantaya girer', bought && B.coins === 20 - CD.SHOP.prices[bought] && CZ.countItem(B, bought) === 1, bought);
    const bought2 = S.purse.shop(B, market);
    check('hatıra adıyla çantada durur ve anıya yazılır', [bought, bought2].includes('souvenir') && B.inventory.some((x) => x.kind === 'souvenir' && x.name) && B.memories.at(-1).text.includes("Pazar Yeri'nden"), `${bought},${bought2}`);
    B.coins = 2;
    resetBag(B);
    check('kesesi yetmeyen alışveriş yapamaz', S.purse.shop(B, market) === 'fruit' ? B.coins === 0 : B.coins === 2);
    B.coins = 20;
    resetBag(B);
    S.behavior.endTask(B);
    B.lastShopAt = null;
    B.needs = { hunger: 95, energy: 95, social: 95, fun: 95 };
    let shopPlan = null;
    for (let i = 0; i < 200 && shopPlan?.activity !== 'shop'; i++) {
      B.lastShopAt = null;
      shopPlan = S.behavior.brain.decide(B, 19);
    }
    check('boş zamanında kesesi olan sakin Pazar Yeri\'ne alışverişe gider', shopPlan?.activity === 'shop' && shopPlan.buildingId === market.id);
    const inn = W.getCompleted('inn')[0];
    inn.meals = 6;
    resetBag(B);
    let took = false;
    for (let i = 0; i < 80 && !took; i++) took = S.purse.takeaway(B, inn);
    check('handa yemekten sonra azık (Börek) alır: handaki pişmiş yemek bir azalır', took && CZ.countItem(B, 'pie') === 1 && inn.meals === 5);

    // Karakter kartı: Kişisel Kese & Çanta
    game.events.emit('ui:selectCharacter', B.id);
    renderNow();
    const pbox = document.querySelector('.character-panel .purse-box');
    const card = pbox?.closest('.character-panel');
    const purseText = pbox?.textContent ?? '';
    check('Karakter kartında "Kişisel Kese & Çanta" satırı: altın ve çantadaki eşyalar', card && !card.hidden && card.textContent.includes('Kişisel Kese & Çanta') && purseText.includes(String(B.coins)) && purseText.includes('Börek') && pbox.querySelectorAll('.bag-slot').length === CZ.inventoryCapacity(B), purseText);

    // --- Vatandaş dilekçeleri ---
    const nat = adults.find((c) => c.homeId !== null) ?? A;
    const natQuirk = nat.quirk;
    nat.quirk = 'natureEnthusiast';
    const opts = Object.fromEntries(S.petitions.optionsFor(nat));
    check('Doğa Tutkunu en çok fidan ister', opts.sapling === 5 && Object.values(opts).every((w) => w <= 5));
    const bw = adults.find((c) => c !== nat);
    const keepQuirk = bw.quirk;
    bw.quirk = 'bookworm';
    const bwOpts = Object.keys(Object.fromEntries(S.petitions.optionsFor(bw)));
    check('Kitap Kurdu Bilgelik Evi / araştırma / antik kitap ister', bwOpts.some((k) => ['academy', 'research', 'books'].includes(k)), bwOpts.join(','));
    bw.quirk = 'musician';
    check('Müzisyen meydanda buluşma ister', Object.fromEntries(S.petitions.optionsFor(bw)).gathering === 5);
    bw.quirk = keepQuirk;
    const toasts = [];
    const offToast = game.events.on('toast', (t) => toasts.push(t.text));
    const p1 = S.petitions.create('sapling', nat.id);
    offToast();
    check('dilekçe oluşur: parşömen balonu, günlük ve bildirim', p1 && p1.kind === 'sapling' && (!nat.visible || nat.bubble?.icon === 'scroll') && st.journal.slice(-3).some((j) => j.text.startsWith('Dilekçe') && j.icon === 'scroll') && toasts.some((t) => t.includes('fidan')), p1?.kind);
    check('dilekçenin süresi 2,5 gün', p1.deadline - p1.createdAt === CD.PETITIONS.deadlineMinutes);
    check('aynı sakin aynı anda tek dilekçe verir', S.petitions.create('sapling', nat.id) === null);
    game.events.emit('ui:selectCharacter', nat.id);
    renderNow();
    const box = document.querySelector('.character-panel .petition-box');
    check('kartta dilekçe kutusu: istek, ne yapılmalı, kalan süre, Kabul Et / Fidanı Dik / Reddet', !box.hidden && box.textContent.includes('Evimin yakınına') && box.textContent.includes('Kalan süre') && [...box.querySelectorAll('button')].map((b) => b.textContent).join(',') === 'Kabul Et,Fidanı Dik,Reddet');
    const hudChips = [...document.querySelectorAll('.hud-buffs .buff-chip.is-petition')].map((b) => b.textContent);
    check('üst çubukta dilekçe çipi (tıklayınca sakin seçilir)', hudChips.some((t) => t.includes(nat.name)), hudChips.join('|'));
    // Kabul ve hemen karşılama
    const trust0 = st.trust.value = 60;
    game.events.emit('ui:acceptPetition', { id: p1.id });
    check('kabul: söz verildi, yarım gün ek süre, güven +1', p1.status === 'accepted' && p1.deadline - p1.createdAt === CD.PETITIONS.deadlineMinutes + CD.PETITIONS.acceptExtraMinutes && st.trust.value === trust0 + 1);
    const fun0 = nat.needs.fun = 40;
    const wood0 = st.resources.wood;
    game.events.emit('ui:grantPetition', { id: p1.id });
    const tree = st.buildings.filter((b) => PT.PETITION_TYPES.sapling.includes(b.type) && !(p1.baseline.ids ?? []).includes(b.id)).find((b) => PT.distanceToHome(W.getBuilding(nat.homeId), b) <= CD.PETITIONS.nearHome);
    check('"Fidanı Dik": evinin yakınına fidan dikilir (bedeli ödenir)', tree && st.resources.wood < wood0, tree?.type);
    check('karşılanan dilekçe: güven +8, keyif +20, olumlu anı, "Sesimiz Duyuldu" refah bonusu', !S.petitions.find(p1.id) && st.trust.value === trust0 + 1 + 8 && nat.needs.fun === fun0 + 20 && nat.memories.at(-1).fond && nat.memories.at(-1).text.includes('dileği yerine getirildi') && st.buffs.heard > now() && st.petitions.log.at(-1).outcome === 'fulfilled', `${st.trust.value}`);
    // Ret
    const p2 = S.petitions.create('street', nat.id) ?? S.petitions.create(null, nat.id);
    st.trust.value = 60;
    nat.needs.fun = 50;
    game.events.emit('ui:selectCharacter', nat.id);
    renderNow();
    [...document.querySelectorAll('.character-panel .petition-box button')].find((b) => b.textContent === 'Reddet').click();
    check('"Reddet" düğmesi: güven -5, keyif -12, olumsuz anı', !S.petitions.find(p2.id) && st.trust.value === 55 && nat.needs.fun === 38 && nat.memories.at(-1).fond === false && st.petitions.log.at(-1).outcome === 'rejected');
    // Süre dolması (kabul edilmiş: ek ceza)
    const p3 = S.petitions.create('stock', A.id) ?? S.petitions.create('tool', A.id) ?? S.petitions.create(null, A.id);
    st.resources.wood = 0;
    game.events.emit('ui:acceptPetition', { id: p3.id });
    st.trust.value = 60;
    p3.deadline = now();
    S.petitions.hourly(12);
    check('süresi dolan dilekçe: güven -6 (sözü tutulmadıysa -3 daha), olumsuz anı', !S.petitions.find(p3.id) && (st.petitions.log.at(-1).outcome === 'expired' ? st.trust.value === 60 - 9 : st.petitions.log.at(-1).outcome === 'fulfilled'), `${st.petitions.log.at(-1).outcome} ${st.trust.value}`);
    sim.give({ wood: 250 });
    // Kışlık stok: hedefe ulaşınca kendiliğinden karşılanır
    st.resources.wood = 20;
    st.resources.food = 20;
    st.resources.bread = 0;
    st.pantry.credit = 0;
    const pS = S.petitions.open(B, 'stock');
    check('kışlık stok dilekçesinin hedefi var; ilerleme metni', pS.target.wood > 20 && pS.target.food > 20 && PT.petitionProgress(st, pS).includes(`Odun 20/${pS.target.wood}`));
    S.petitions.hourly(10);
    check('stok hedefe ulaşmadan karşılanmaz', S.petitions.find(pS.id));
    sim.give({ wood: pS.target.wood, food: pS.target.food });
    S.petitions.hourly(11);
    check('stok güvenli seviyeye çıkınca dilekçe karşılanır', !S.petitions.find(pS.id) && st.petitions.log.at(-1).outcome === 'fulfilled');
    // Sağlam alet
    const keepTool = B.equipment.tool;
    B.equipment.tool = null;
    st.equipment.sturdyTool = 0;
    const pT = S.petitions.open(B, 'tool');
    const iron0 = st.resources.iron;
    game.events.emit('ui:grantPetition', { id: pT.id });
    check('"Aleti Ver": Sağlam Alet kuşanır (demir ve odun ödenir), dilekçe karşılanır', B.equipment.tool === 'sturdyTool' && st.resources.iron === iron0 - CD.PETITION_KINDS.tool.grant.iron && !S.petitions.find(pT.id));
    B.equipment.tool = keepTool;
    // Meydanda buluşma: Toplanma Zili
    st.rally = null;
    const pG = S.petitions.open(B, 'gathering');
    game.events.emit('ui:grantPetition', { id: pG.id });
    check('"Zili Çal": toplanma zili çalar, buluşma dilekçesi karşılanır', !S.petitions.find(pG.id) && st.rally && st.petitions.log.at(-1).outcome === 'fulfilled');
    st.rally = null;
    // Kendiliğinden oluşma aralığı
    st.time.hour = 10;
    st.petitions.nextAt = now();
    const made0 = st.petitions.made;
    S.petitions.hourly(10);
    const gap = st.petitions.nextAt - now();
    check('dilekçeler kendiliğinden 2-3 günde bir gelir', st.petitions.made === made0 + 1 && gap >= CD.PETITIONS.intervalMinutes[0] && gap <= CD.PETITIONS.intervalMinutes[1], gap);
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;

    // --- Yönetim Güveni ---
    st.trust.value = 50;
    st.heating.cold = false;
    for (const c of st.characters) c.needs.hunger = Math.max(c.needs.hunger, 60);
    st.town.welfare = 80;
    S.trust.hourly();
    check('yüksek refahta (%70+) güven saat başı artar', Math.abs(st.trust.value - 50.25) < 1e-6, st.trust.value);
    st.town.welfare = 30;
    st.trust.value = 50;
    S.trust.hourly();
    check('refah %35 altında güven erir', Math.abs(st.trust.value - 49.5) < 1e-6, st.trust.value);
    st.town.welfare = 50;
    st.trust.value = 50;
    st.heating.cold = true;
    const starving = st.characters.slice(0, 3);
    for (const c of starving) c.needs.hunger = 5;
    S.trust.hourly();
    check('açlık ve soğuk güveni düşürür', st.trust.value < 50 - 0.3 - 0.06 * 2, st.trust.value);
    st.heating.cold = false;
    for (const c of starving) c.needs.hunger = 70;
    st.trust.value = 70;
    S.trust.trust.eventDays = {};
    S.trust.onEvent('festival');
    check('şenlik güveni artırır', st.trust.value === 70 + CD.TRUST.events.festival);
    renderNow();
    const tm = document.querySelector('.hud .trust-mini');
    const tf = document.querySelector('.hud .trust-mini-fill');
    check('üst çubukta refahın yanında Yönetim Güveni (ince çubuk ve kalkan); ipucunda yüzdesi', tm && tm.dataset.trust === String(Math.round(st.trust.value)) && tf.style.width === `${Math.round(st.trust.value)}%` && document.querySelector('.hud-welfare').title.includes(`Yönetim Güveni: %${Math.round(st.trust.value)}`));

    // --- İsyan ---
    for (const c of st.characters) c.needs.fun = 15;
    st.town.welfare = 30;
    st.trust.value = 20;
    st.trust.lowSince = null;
    S.trust.hourly();
    check('güven kritik eşiğin altına inince isyan hemen çıkmaz (12 saat bekler)', !st.trust.revolt && st.trust.lowSince !== null);
    st.trust.lowSince = now() - CD.REVOLT.graceHours * 60;
    st.trust.value = 20;
    S.trust.hourly();
    const rv = st.trust.revolt;
    const adultCount = st.characters.filter((c) => !c.isChild && !c.role).length;
    check('güven 12 saat %25 altında kalınca isyan çıkar', rv && rv.rioters.length >= CD.REVOLT.minRioters && rv.rioters.length <= Math.ceil(adultCount * CD.REVOLT.maxShare) && st.stats.revolts >= 1, rv?.rioters.length);
    check('isyan kasaba günlüğüne alarm düşer', st.journal.slice(-4).some((j) => j.text.startsWith('ALARM') && j.icon === 'torch'));
    const rioter = W.getCharacter(rv.rioters[0]);
    S.behavior.endTask(rioter);
    rioter.needs = { hunger: 90, energy: 90, social: 60, fun: 15 };
    rioter.carrying = null;
    const riotPlan = S.behavior.brain.decide(rioter, 10);
    check('isyancı mesaide işe gitmez, meydanda öfkeyle toplanır', riotPlan.activity === 'protest', riotPlan.activity);
    S.behavior.startPlan(rioter, riotPlan, 10);
    check('isyancının durum metni: öfkeyle meydana yürüyor', /öfke|Öfke|yönetime/.test(rioter.activityLabel), rioter.activityLabel);
    renderNow();
    check('üst çubukta isyan alarmı', [...document.querySelectorAll('.hud-buffs .buff-chip.is-revolt')].some((b) => b.textContent.includes('İsyan')));
    // Yağma: gerçek baskın (Kiler)
    const storage = W.getCompleted('storage')[0];
    sim.give({ food: 120, wood: 120, gold: 500 });
    const res0 = { food: st.resources.food, wood: st.resources.wood, gold: st.resources.gold };
    const totals = () => st.characters.reduce((a, c) => {
      const r = CZ.inventoryResources(c);
      a.food += r.food ?? 0;
      a.wood += r.wood ?? 0;
      a.coins += c.coins;
      return a;
    }, { food: 0, wood: 0, coins: 0 });
    const t0 = totals();
    for (const id of rv.rioters) resetBag(W.getCharacter(id));
    const t0b = totals();
    const hasHall = st.buildings.some((b) => b.functional && b.type === 'townHall');
    const lootedEv = { food: 0, wood: 0, gold: 0 };
    const offLoot = game.events.on('riot:looted', ({ goods, gold }) => {
      lootedEv.food += goods.food ?? 0;
      lootedEv.wood += goods.wood ?? 0;
      lootedEv.gold += gold;
    });
    const raid = S.trust.startRaid(storage.id);
    check('yağma baskını: en çok 3 isyancı Kiler\'e yürür', raid && raid.members.length >= 1 && raid.members.length <= 3 && raid.members.every((id) => rv.rioters.includes(id)) && raid.members.every((id) => W.getCharacter(id).task?.activity !== 'protest'));
    st.time.hour = 10;
    for (let i = 0; i < 12 && st.trust.revolt?.raids.length; i++) sim.step(225);
    offLoot();
    const t1 = totals();
    check('yağmacılar Kiler\'e yürüyüp erzak ve odun yağmalar', lootedEv.food > 0 && lootedEv.wood > 0 && raid.members.some((id) => CZ.countItem(W.getCharacter(id), 'firewood') > 0), JSON.stringify(lootedEv));
    check('yağmalanan odun çantalarda: kasaba deposundan düşülenle birebir', t1.wood - t0b.wood === lootedEv.wood, `${t1.wood - t0b.wood}/${lootedEv.wood}`);
    // Birebir aktarım (anlık ölçüm): bir yağmacının tek baskını
    const looter0 = W.getCharacter(st.trust.revolt.rioters[0]);
    resetBag(looter0);
    sim.give({ food: 100, wood: 100 });
    st.trust.revolt.raids.push({ id: 998, targetId: storage.id, target: storage.name, members: [looter0.id], done: [], startedAt: now(), until: now() + 240, goods: {}, gold: 0 });
    const before1 = { food: st.resources.food, wood: st.resources.wood, gold: st.resources.gold, coins: looter0.coins };
    const got1 = S.trust.loot(looter0, storage);
    const inv1 = CZ.inventoryResources(looter0);
    check('yağmalanan mallar kaybolmaz: kasaba deposundan düşülen erzak ve odun birebir yağmacının çantasına geçer', got1 && before1.food - st.resources.food === inv1.food && before1.wood - st.resources.wood === inv1.wood && inv1.food === Math.min(CD.REVOLT.loot.food, 12) && inv1.wood > 0, JSON.stringify([inv1, before1.food - st.resources.food]));
    check('yağmacının çantasındaki yer sınırı aşılmaz', looter0.inventory.length <= CZ.inventoryCapacity(looter0));
    const goldLoot = lootedEv.gold;
    check(hasHall ? 'Kiler yağmasında hazine (Belediye Konağı\'nda) korunur' : 'Kiler yağmasında hazineden altın da yağmalanır', hasHall ? goldLoot === 0 : goldLoot > 0, `${goldLoot}`);
    check('yağma günlüğe, sayaçlara ve yağmacının anısına yazılır', st.stats.raids >= 1 && st.stats.lootedGoods >= lootedEv.wood && st.journal.some((j) => j.text.startsWith('ALARM · Yağma')) && raid.members.some((id) => W.getCharacter(id).memories.at(-1)?.text.includes('yağmasına')));
    // Hazine yağması: Belediye Konağı
    const hall = W.getCompleted('townHall')[0];
    if (hall) {
      const looter = W.getCharacter(st.trust.revolt.rioters[0]);
      const raid2 = { id: 999, targetId: hall.id, target: hall.name, members: [looter.id], done: [], startedAt: now(), until: now() + 240, goods: {}, gold: 0 };
      st.trust.revolt.raids.push(raid2);
      const g0 = st.resources.gold;
      const c0 = looter.coins;
      const got = S.trust.loot(looter, hall);
      check('Belediye Konağı yağması: hazineden düşülen altın birebir yağmacının kesesine geçer', got.gold > 0 && g0 - st.resources.gold === got.gold && looter.coins - c0 === got.gold && got.gold <= CD.REVOLT.loot.gold);
    } else check('Belediye Konağı yağması: hazineden düşülen altın birebir yağmacının kesesine geçer', true, 'konak yok');
    // Yatıştırma
    st.town.welfare = 60;
    st.trust.relief = {};
    st.trust.value = 20;
    const foodStatus = TR.reliefStatus(st, 'food');
    const supply0 = scene.economy.foodSupply();
    game.events.emit('ui:relief', { kind: 'food' });
    check('acil erzak dağıtımı: yiyecek harcanır, güven +10', st.trust.value === 30 && Math.round(supply0 - scene.economy.foodSupply()) === foodStatus.cost && st.trust.revolt, st.trust.value);
    check('erzak 12 saatte bir dağıtılabilir', !TR.reliefStatus(st, 'food').ok);
    const g1 = st.resources.gold;
    const someone = W.getCharacter(st.trust.revolt.rioters[0]);
    const sc0 = someone.coins;
    game.events.emit('ui:relief', { kind: 'gold' });
    check('altın dağıtımı: hazineden sakinlerin keselerine, güven eşiği aşınca isyan biter', st.resources.gold < g1 && someone.coins > sc0 && !st.trust.revolt && st.journal.some((j) => j.text.startsWith('İsyan yatıştı')), `${st.trust.value}`);
    S.behavior.endTask(someone);
    someone.needs = { hunger: 90, energy: 90, social: 60, fun: 15 };
    const after = S.behavior.brain.decide(someone, 10);
    check('isyan bitince sakinler işlerinin başına döner', after.activity !== 'protest' && after.activity !== 'loot', after.activity);
    // Refah kritikse isyan güven yüksek olsa da sürer; refah düzelince biter
    st.trust.value = 60;
    st.town.welfare = 20;
    st.trust.lowSince = now() - CD.REVOLT.graceHours * 60;
    S.trust.hourly();
    check('refah uzun süre %25 altında kalırsa da isyan çıkar', st.trust.revolt);
    st.town.welfare = 60;
    st.trust.value = 60;
    S.trust.hourly();
    check('refah ve güven eşiği aşınca isyan kendiliğinden biter', !st.trust.revolt);
    for (const c of st.characters) c.needs.fun = 70;
    st.trust.value = 77;
    nat.quirk = natQuirk;
    // Kayıt için açık bir dilekçe ve dolu bir çanta bırak
    resetBag(A);
    CZ.addItem(A, 'souvenir', 1, 'Pirinç Yüzük');
    CZ.addItem(A, 'ration', 5);
    A.coins = 321;
    const pk = S.petitions.open(A, 'street');
    A.equipment.bag = keepBag;
    const T = { id: A.id, coins: A.coins, inv: JSON.stringify(A.inventory), trust: st.trust.value, pid: pk.id, pkind: pk.kind, deadline: pk.deadline, made: st.petitions.made, revolts: st.trust.revolts, raids: st.stats.raids };
    // --- Kayıt gidiş-dönüşü (sürüm 18): kese, çanta, dilekçe, güven ---
    game.events.emit('ui:save');
    const raw18 = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    game.events.emit('ui:load');
    const s3 = game.state;
    const a3 = s3.characters.find((c) => c.id === T.id);
    check('kayıt sürümü 32: sakinlerin kesesi ve çantası kayda yazılır', raw18.version === 32 && raw18.characters.every((c) => Number.isFinite(c.coins) && Array.isArray(c.inventory)) && raw18.trust && raw18.petitions);
    check('kayıttan kişisel kese ve çanta (adlı hatıra dahil) döner', a3?.coins === T.coins && JSON.stringify(a3.inventory) === T.inv, `${a3?.coins} ${JSON.stringify(a3?.inventory)}`);
    check('kayıttan Yönetim Güveni ve isyan sayacı döner', Math.abs(s3.trust.value - T.trust) < 1e-9 && s3.trust.revolts === T.revolts && s3.stats.raids === T.raids);
    const pk3 = s3.petitions.list.find((p) => p.id === T.pid);
    check('kayıttan açık dilekçe (türü, sahibi, süresi) ve sayaçlar döner', pk3?.kind === T.pkind && pk3.characterId === T.id && pk3.deadline === T.deadline && s3.petitions.made === T.made);
  }

  // ===== 22. aşama: iç vergi ve öşür, Krallık Vergisi, Kraliyet Fermanları, Kraliyet Heykeli, köyü terk etme =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CR = await import('/src/systems/Crown.js');
    const CD = await import('/src/data/crown.js');
    const TS = await import('/src/systems/TownStatus.js');
    const CZ = await import('/src/systems/Citizens.js');
    const now = () => st.totalMinutes;
    const renderNow = () => {
      game.ui.components.find((x) => x.renderWelfare).welfareAt = -Infinity;
      game.render(0);
    };
    sim.give({ wood: 500, stone: 500, food: 300, bread: 80, iron: 80, gold: 3000 });
    st.trust.value = 70;
    if (st.trust.revolt) S.trust.endRevolt();
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = now() + 1e6;
    st.crown.nextLevyAt = now() + 1e6;
    st.crown.notice = null;
    const adults = () => st.characters.filter((c) => !c.isChild && !c.role);

    // --- İç vergi kademeleri ---
    check('dört vergi kademesi: Muaf %0, Düşük %10, Standart %20 (varsayılan), Ağır %45', CD.TAX_RATE_KEYS.join(',') === 'exempt,low,standard,heavy' && CD.TAX_RATES.exempt.percent === 0 && CD.TAX_RATES.low.percent === 10 && CD.TAX_RATES.standard.percent === 20 && CD.TAX_RATES.heavy.percent === 45 && CD.TAX.defaultRate === 'standard');
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'low' }));
    check('vergi kademesi istenen an değişir ("ui:setTaxRate") ve günlüğe yazılır', st.tax.rate === 'low' && st.journal.at(-1).text.includes('Düşük'));
    // Tahsilat: keselerden hazineye birebir, öşür çantadan kilere
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'standard' }));
    for (const c of adults()) {
      c.coins = 50;
      c.inventory = [];
    }
    const payer = adults()[0];
    CZ.addItem(payer, 'ration', 6);
    CZ.addItem(payer, 'firewood', 11);
    sim.give({ food: 50, wood: 50 }); // kilerde öşre yer olsun
    const gold0 = st.resources.gold;
    const food0 = st.resources.food;
    const wood0 = st.resources.wood;
    const trust0 = st.trust.value;
    const res = S.tax.collect();
    const expect = adults().length * 10;
    check('Standart Vergi: her yetişkinin kesesinden %20 kesilir, birebir Kasaba Hazinesi\'ne geçer', res.gold === expect && st.resources.gold === gold0 + expect && adults().every((c) => c.coins === 40), `${res.gold}/${expect}`);
    check('öşür: çantadaki fazla erzak ve odundan %20 kilere geçer (birer tanesi bırakılır)', st.resources.food === food0 + 1 && st.resources.wood === wood0 + 2 && CZ.countItem(payer, 'ration') === 5 && CZ.countItem(payer, 'firewood') === 9, `${st.resources.food - food0} ${st.resources.wood - wood0}`);
    check('Standart Vergi güveni değiştirmez; tahsilat günlüğe yazılır', st.trust.value === trust0 && st.journal.at(-1).text.startsWith('İç vergi tahsil edildi'));
    check('sıradaki tahsilat 3 gün sonra öğlen 12:00', st.tax.nextAt - now() <= 3 * 1440 && st.tax.nextAt > now() && st.tax.nextAt % 1440 === 720 && (Math.floor(st.tax.nextAt / 1440) + 1) % 3 === 0, CR.formatStamp(st.tax.nextAt));
    check('çocuklardan ve kesesi boş olandan vergi alınmaz', CR.coinTax({ isChild: true, coins: 99 }, 45) === 0 && CR.coinTax({ coins: 1 }, 45) === 0 && CR.coinTax({ coins: 10 }, 45) === 4);
    // Muafiyet ve düşük vergi
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'exempt' }));
    const fan = adults()[1];
    fan.needs.fun = 50;
    st.trust.value = 60;
    const g1 = st.resources.gold;
    S.tax.collect();
    check('Vergi Muafiyeti: kesinti yok, güven +6, keyif +5', st.resources.gold === g1 && adults().every((c) => c.coins === 40) && st.trust.value === 66 && fan.needs.fun === 55);
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'low' }));
    st.trust.value = 60;
    const g2 = st.resources.gold;
    S.tax.collect();
    check('Düşük / Adil Vergi: %10 kesinti, güven +2', st.resources.gold === g2 + adults().length * 4 && st.trust.value === 62);
    // Ağır Vergi
    const workStd = ((st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'standard' })), TS.townWorkMultiplier(st));
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'heavy' }));
    const workHeavy = TS.townWorkMultiplier(st);
    check('Ağır Vergi seçiliyken çalışma hızı -%15', Math.abs(workHeavy / workStd - 0.85) < 1e-9, `${workHeavy}/${workStd}`);
    st.trust.value = 40;
    fan.needs.fun = 50;
    const c0 = fan.coins;
    S.tax.collect();
    check('Ağır Vergi / Haraç: %45 kesinti, güven -8, keyif -10', fan.coins === c0 - Math.floor(c0 * 0.45) && st.trust.value === 32 && fan.needs.fun === 40);
    S.tax.collect();
    S.tax.collect();
    check('Ağır Vergi güveni hızla isyan sınırının altına iter', st.trust.value < 25, st.trust.value);
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'standard' }));
    st.trust.value = 70;
    // Belediye panelinde vergi düğmeleri
    if (!W.getCompleted('townHall').length) {
      st.town.tier = Math.max(st.town.tier, 3);
      sim.place('townHall');
    }
    const hall = W.getCompleted('townHall')[0];
    // (28.1) kilit hazırlığı: Düşük -> (kilit açılır) Standart: kilit şimdi 3 gün sürer
    st.tax.lockedUntil = 0;
    game.events.emit('ui:setTaxRate', { rate: 'low' });
    st.tax.lockedUntil = 0;
    game.events.emit('ui:setTaxRate', { rate: 'standard' });
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    const taxButtons = [...document.querySelectorAll('.building-crown .tax-rate-button')];
    check('Belediye Konağı panelinde dört vergi düğmesi; seçili kademe vurgulu', taxButtons.length === 4 && taxButtons.find((b) => b.dataset.rate === 'standard').classList.contains('is-active'));
    // (28.1) Vergi Fermanı kilidi sürerken düğmeler devre dışıdır ve "Ferman kilitli" yazar
    check('(28.1) kilit sürerken (az önce Standart seçildi) öteki vergi düğmeleri devre dışı, kartta "Ferman kilitli: ..."', st.tax.lockedUntil > st.totalMinutes && taxButtons.filter((b) => b.dataset.rate !== 'standard').every((b) => b.disabled) && !taxButtons.find((b) => b.dataset.rate === 'standard').disabled && document.querySelector('.building-crown').textContent.includes('Ferman kilitli'), document.querySelector('.building-crown .tax-card')?.textContent);
    taxButtons.find((b) => b.dataset.rate === 'low').click();
    check('(28.1) kilitliyken düğmeye zorla basılsa bile kademe değişmez', st.tax.rate === 'standard');
    st.tax.lockedUntil = 0;
    renderNow();
    document.querySelector('.building-crown .tax-rate-button.is-low').click();
    check('panelden kademe seçilir (kilit açıkken)', st.tax.rate === 'low');
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'standard' }));

    // --- (28.1) Vergi Fermanı: kademe değişince 3 oyun günü kilitlenir (tahsilat öncesi geçiş istismarı) ---
    {
      const t0 = st.totalMinutes;
      const setTime = (total) => {
        st.time.day = Math.floor(total / 1440) + 1;
        st.time.hour = Math.floor((total % 1440) / 60);
        st.time.minute = total % 60;
      };
      const rateEvents = [];
      const offLocked = game.events.on('tax:rateLocked', (p) => rateEvents.push(p));
      st.tax.lockedUntil = 0;
      check('(28.1) yeni oyunda / kilitsizken kademe serbestçe değişir', CD.TAX.lockDays === 3 && S.tax.setRate('heavy') === true && st.tax.rate === 'heavy');
      check('(28.1) değişince lockedUntil = şimdi + 3 oyun günü (4320 dk)', st.tax.lockedUntil === t0 + 3 * 1440 && CR.taxLockLeft(st) === 3 * 1440);
      // İstismar: tahsilattan hemen önce Ağır'a geçip hemen ardından Muaf'a çekmek
      const gold0 = st.resources.gold;
      S.tax.collect();
      check('(28.1) Ağır Vergi tahsilatı yapılır', st.resources.gold >= gold0 && st.tax.last.rate === 'heavy');
      setTime(t0 + 2); // tahsilattan 2 dakika sonra
      const toExempt = S.tax.setRate('exempt');
      check('(28.1) tahsilattan hemen sonra Muaf\'a kaçış reddedilir: kademe Ağır kalır, "tax:rateLocked" yayılır', toExempt === false && st.tax.rate === 'heavy' && rateEvents.length === 1 && rateEvents[0].rate === 'exempt' && rateEvents[0].minutesLeft === 3 * 1440 - 2, JSON.stringify({ toExempt, rate: st.tax.rate, ev: rateEvents, lock: st.tax.lockedUntil, t0, now: st.totalMinutes }));
      check('(28.1) Ağır Vergi\'nin kalıcı hız cezası kilit boyunca sürer', CR.taxWorkMultiplier(st) === 0.85);
      setTime(t0 + 3 * 1440 - 1);
      check('(28.1) kilidin bitmesine 1 dakika kala hâlâ kilitli', S.tax.setRate('low') === false && st.tax.rate === 'heavy');
      setTime(t0 + 3 * 1440);
      check('(28.1) 3 gün dolunca kilit açılır; yeni değişiklik yeniden kilitler', CR.taxLockLeft(st) === 0 && S.tax.setRate('low') === true && st.tax.rate === 'low' && st.tax.lockedUntil === t0 + 6 * 1440);
      setTime(t0 + 3 * 1440);
      check('(28.1) aynı kademeyi seçmek kilit koymaz ve toast üretmez', (() => { const lock = st.tax.lockedUntil; st.tax.lockedUntil = 0; const r = S.tax.setRate('low'); const ok = r === false && st.tax.lockedUntil === 0; st.tax.lockedUntil = lock; return ok; })());
      offLocked();
      // Kayıt gidiş-dönüşü: kilit kayda yazılır ve geri döner; eski (v31) kayıtta alan yoksa kilit yok
      const raw = JSON.parse(JSON.stringify(S.saves.snapshot()));
      check('(28.1) kilit kayda yazılır (tax.lockedUntil)', raw.tax.lockedUntil === st.tax.lockedUntil && st.tax.lockedUntil > 0);
      // v31 -> v32 göçü (SaveManager.migrate): yangınlara emergencyMuster: false, vergiye lockedUntil: 0
      const SM = await import('/src/state/SaveManager.js');
      const CFG = await import('/src/config.js');
      const legacy = JSON.parse(JSON.stringify(raw));
      legacy.version = 31;
      delete legacy.tax.lockedUntil;
      for (const b of legacy.buildings) delete b.emergencyMuster;
      const keepSlot = localStorage.getItem(CFG.CONFIG.SESSION_KEY);
      localStorage.setItem(CFG.CONFIG.SESSION_KEY, JSON.stringify(legacy));
      const migrated = SM.SaveManager.read('session');
      if (keepSlot === null) localStorage.removeItem(CFG.CONFIG.SESSION_KEY); else localStorage.setItem(CFG.CONFIG.SESSION_KEY, keepSlot);
      check('(28.1) v31 kaydı v32\'ye göç eder: tax.lockedUntil = 0 ve her yapıda emergencyMuster = false', CFG.CONFIG.SAVE_VERSION === 32 && migrated && migrated.tax.lockedUntil === 0 && migrated.buildings.every((b) => b.emergencyMuster === false), JSON.stringify(migrated?.tax?.lockedUntil));
      setTime(t0);
      st.tax.lockedUntil = 0;
      S.tax.setRate('standard');
      st.tax.lockedUntil = 0;
    }

    // --- Krallık Vergisi ---
    const keepTier = st.town.tier;
    const keepSince = st.goldenAge.since;
    st.goldenAge.since = null;
    st.crown.reputation = 50;
    st.town.tier = 1;
    const a1 = CR.levyAmount(st);
    st.town.tier = 3;
    const a3 = CR.levyAmount(st);
    st.goldenAge.since = keepSince ?? { day: 1, hour: 0, minute: 0 };
    const a3g = CR.levyAmount(st);
    check('Krallık Vergisi seviye, nüfus ve Altın Çağ\'la ölçeklenir', a3 > a1 && a3g === Math.round(a3 * CD.LEVY.goldenAge) && a1 === CD.LEVY.base + CD.LEVY.perTier + CD.LEVY.perResident * st.characters.length, `${a1} ${a3} ${a3g}`);
    st.goldenAge.since = keepSince;
    st.town.tier = keepTier;
    // Tahsildar uyarısı: iki gün önce
    st.crown.nextLevyAt = now() + 2 * 1440;
    st.crown.notice = null;
    const notices = [];
    const offN = game.events.on('crown:levyNotice', (p) => notices.push(p));
    S.crown.hourly(st.time.hour);
    offN();
    const amount = st.crown.notice?.amount;
    renderNow();
    check('vergi gününden 2 gün önce "Kraliyet Tahsildarı Yolda" uyarısı ve tutarı (günlük, üst çubuk)', notices.length === 1 && amount === CR.levyAmount(st) && st.journal.at(-1).text.includes('Kraliyet Tahsildarı yolda') && [...document.querySelectorAll('.hud-buffs .buff-chip.is-crown')].some((b) => b.textContent.includes(`${amount} altın`)));
    // Ödeme
    st.resources.gold = amount + 100;
    st.crown.reputation = 50;
    st.trust.value = 60;
    st.crown.nextLevyAt = now();
    S.crown.hourly(st.time.hour);
    check('vakti gelince hazineden ödenir: güven +3, itibar +8', st.resources.gold === 100 && st.trust.value === 63 && st.crown.reputation === 58 && st.crown.lastLevy.ok && !st.crown.notice);
    check('sıradaki Krallık Vergisi tam 6 gün sonra', st.crown.nextLevyAt - now() === 6 * 1440);
    check('ilk Krallık Vergisi takvimde 6. günün öğlenidir', CR.nextOnSchedule(0, CD.LEVY.everyDays, CD.LEVY.hour) === 5 * 1440 + 720);
    // Altın yetmezse yarısına kadar malla
    sim.give({ food: 200, wood: 200, stone: 200 });
    const amt2 = CR.levyAmount(st);
    st.resources.gold = Math.ceil(amt2 * 0.6);
    st.crown.notice = { at: now(), amount: amt2 };
    st.crown.nextLevyAt = now();
    const stock0 = st.resources.food + st.resources.wood + st.resources.stone;
    S.crown.hourly(st.time.hour);
    check('altın yetmezse vergi tutarının yarısına kadarı malla ödenir (1 altın = 2 birim)', st.crown.lastLevy.ok && st.resources.gold === 0 && stock0 - (st.resources.food + st.resources.wood + st.resources.stone) === (amt2 - Math.ceil(amt2 * 0.6)) * 2, JSON.stringify(st.crown.lastLevy));
    // Ödenemezse ceza
    st.resources.gold = 7;
    sim.give({ food: 100, wood: 100, stone: 100 });
    const amt3 = CR.levyAmount(st);
    st.crown.notice = { at: now(), amount: amt3 };
    st.crown.nextLevyAt = now();
    st.trust.value = 60;
    st.crown.reputation = 50;
    delete st.buffs.royalPenalty;
    const bonus0 = TS.townHappinessBonus(st);
    S.crown.hourly(st.time.hour);
    const L3 = st.crown.lastLevy;
    check('ödenemeyen Krallık Vergisi: hazineye el konur, depodan zorla mal çekilir', !L3.ok && L3.gold === 7 && st.resources.gold === 0 && Object.values(L3.goods).reduce((a, b) => a + b, 0) > 0 && st.resources.food < 100, JSON.stringify(L3));
    check('ceza: güven -12, itibar -20, refah darbesi (Kraliyet Cezası -8)', st.trust.value === 48 && st.crown.reputation === 30 && TS.townHappinessBonus(st) === bonus0 - 8 && st.journal.at(-1).text.startsWith('ALARM · Krallık Vergisi'));
    check('düşük itibar vergiyi artırır', CR.reputationLevel(st.crown.reputation).levy > 1);
    delete st.buffs.royalPenalty;
    st.crown.reputation = 60;
    st.crown.nextLevyAt = now() + 1e6;
    sim.give({ wood: 400, stone: 400, food: 250, bread: 80, iron: 80, gold: 3000 });

    // --- Kraliyet Fermanları ---
    st.town.tier = 1;
    check('Mezra seviyesinde ferman gelmez', S.crown.availableDecrees().length === 0);
    st.town.tier = Math.max(keepTier, 3);
    check('Köy seviyesinden itibaren fermanlar gelir (tersane her zaman)', S.crown.availableDecrees().includes('shipyard'));
    st.crown.statueRight = false;
    const placeBefore = S.construction.checkPlacement('royalStatue', 1, 1);
    check('Aslanlı Heykel beratsız dikilemez', !placeBefore.ok && placeBefore.reason.includes('Kraliyet Beratı'));
    const d1 = S.crown.openDecree('shipyard');
    check('ferman açılır: seviyeye göre ihtiyaç, 3 günlük süre, ödül; günlük ve bildirim', d1.need.wood === 30 * Math.min(4, st.town.tier) && d1.deadline - d1.createdAt === CD.DECREE.deadlineMinutes && d1.reward.item === 'statueRight' && st.journal.at(-1).text.includes('Kraliyet Fermanı'));
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    const deliverBtn = [...document.querySelectorAll('.building-crown .royal-decree button')].find((b) => b.textContent === 'Teslim Et');
    check('Belediye panelinde ferman kartı: istek, ihtiyaç, ödül ve Teslim Et / Reddet', deliverBtn && !deliverBtn.disabled && document.querySelector('.building-crown .royal-decree').textContent.includes('Reddet'));
    const w1 = st.resources.wood;
    const gd1 = st.resources.gold;
    st.crown.reputation = 60;
    st.trust.value = 60;
    deliverBtn.click();
    check('ferman teslim edilir: kaynaklar harcanır, altın ödülü ve Kraliyet Beratı; itibar +10, güven +4', st.resources.wood === w1 - d1.need.wood && st.resources.gold === gd1 + d1.reward.gold && st.crown.statueRight && st.crown.reputation === 70 && st.trust.value === 64 && !st.crown.decree);
    renderNow();
    const placeAfter = S.construction.checkPlacement('royalStatue', 1, 1);
    check('berat alınınca Aslanlı Heykel İnşa menüsünde açılır', !placeAfter.reason?.includes('Kraliyet Beratı'), placeAfter.reason);
    const bonusBefore = TS.landmarkBonus(st);
    const statue = sim.place('royalStatue', { maxRadius: 30 });
    check('Kraliyet Aslanlı Heykeli dikilir: kalıcı refah +4 ve estetik', statue && TS.landmarkBonus(st) === bonusBefore + 4 && W.aesthetics.some((v) => v > 0));
    st.trust.value = 50;
    st.town.welfare = 50;
    S.crown.hourly(st.time.hour);
    check('heykel saat başı güven verir', Math.abs(st.trust.value - (50 + CD.ROYAL_STATUE.trustPerHour)) < 1e-9, st.trust.value);
    // Garnizon: Kadim Dişli ödülü
    const gears0 = st.resources.gears;
    S.crown.openDecree('garrison');
    game.events.emit('ui:deliverDecree');
    check('Garnizon fermanı: ekmek ve demir teslim edilir, Kadim Dişli ödülü', st.resources.gears === gears0 + 2 && st.crown.decreeLog.at(-1).outcome === 'delivered');
    // Saray kütüphanesi: araştırma
    const dL = S.crown.openDecree('library');
    check('kütüphane fermanı araştırma bitmeden teslim edilemez', !CR.decreeStatus(st, dL).ok);
    dL.baseline.done = Object.keys(st.research.done).length - 1;
    const books0 = st.goldenAge.books;
    game.events.emit('ui:deliverDecree');
    check('araştırma tamamlanınca teslim edilir: Antik Kitap (ya da kitaplık doluysa altın)', st.crown.decreeLog.at(-1).outcome === 'delivered' && (st.goldenAge.books === books0 + 1 || st.crown.decreeLog.at(-1).item === null));
    // Usta işi eser
    st.masterworks.items.push({ id: 9999, type: 'ironStatue', maker: 'Usta', makerId: -1, status: 'stored', day: 1, hour: 1 });
    const seeds0 = st.exploration.items.vineSeed;
    S.crown.openDecree('treasure');
    game.events.emit('ui:deliverDecree');
    check('saray hazinesi fermanı: depodaki usta işi eser Krallığa gider, Nadir Tohum ödülü', st.masterworks.items.find((i) => i.id === 9999).status === 'sold' && st.exploration.items.vineSeed === seeds0 + 1);
    st.masterworks.items = st.masterworks.items.filter((i) => i.id !== 9999);
    // Süresi dolan ve reddedilen ferman: ceza
    S.crown.openDecree('feast');
    st.crown.decree.deadline = now();
    st.crown.reputation = 60;
    st.trust.value = 60;
    const gf = st.resources.gold;
    S.crown.hourly(st.time.hour);
    const fine = st.crown.decreeLog.at(-1);
    check('süresi dolan ferman: Krallık altın cezası keser, itibar -12, güven -4', fine.outcome === 'expired' && st.resources.gold === gf - fine.fine.gold && fine.fine.gold > 0 && st.crown.reputation === 48 && Math.abs(st.trust.value - (56 + CD.ROYAL_STATUE.trustPerHour)) < 1e-9, st.trust.value); // heykelin saatlik güveni de işler
    S.crown.openDecree('shipyard');
    game.events.emit('ui:selectBuilding', hall.id);
    renderNow();
    [...document.querySelectorAll('.building-crown .royal-decree button')].find((b) => b.textContent === 'Reddet').click();
    check('"Reddet" düğmesi: ferman reddedilir ve ceza kesilir', st.crown.decreeLog.at(-1).outcome === 'rejected' && !st.crown.decree);
    check('berat zaten varsa tersane ödülü altına döner', S.crown.rewardFor('shipyard').item === 'statueRight' && st.crown.statueRight);

    // --- Kötü şöhret ve göç ---
    st.trust.value = 30;
    let im = TS.immigrationStatus(st);
    check('güven %35 altındayken kötü şöhret yüzünden göçmen gelmez', !im.ok && im.checks.find((c) => c.key === 'fame').ok === false);
    st.trust.value = 45;
    im = TS.immigrationStatus(st);
    check('güven %50 altındayken sabah en çok 1 göçmen', im.checks.find((c) => c.key === 'fame').ok && im.maxPerMorning === 1);
    st.trust.value = 80;
    check('güven toparlanınca göç normale döner', TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok && TS.immigrationStatus(st).maxPerMorning >= 2);

    // --- Köyü terk etme ---
    const E = st.exodus;
    st.trust.value = 10;
    st.town.welfare = 10;
    E.lowSince = now() - 30 * 60;
    E.active = false;
    E.lastAt = null;
    if (st.trust.revolt) S.trust.endRevolt();
    S.desertion.hourly();
    check('isyan yağmaya varmadan terk ediş başlamaz', !E.active);
    for (const c of st.characters) c.needs.fun = 5;
    S.trust.startRevolt();
    check('terk ediş denemesi için isyan var', st.trust.revolt);
    st.trust.revolt.looted = { food: 12 };
    // En mutsuz bekâr sakin ayrılsın: herkes mutlu, o mutsuz
    for (const c of st.characters) c.needs = { hunger: 90, energy: 90, social: 90, fun: 90 };
    const single = st.characters.find((c) => !c.isChild && !c.married && !c.away && c.visible && !c.role && !st.characters.some((o) => o.parentIds.includes(c.id)));
    single.needs.fun = 0;
    single.coins = 77;
    single.inventory = [];
    CZ.addItem(single, 'bread', 3);
    const singleId = single.id;
    const pop0 = st.characters.length;
    const leftEv = [];
    const offL = game.events.on('population:left', (p) => leftEv.push(p));
    S.desertion.hourly();
    check('güven / refah %20 altında 24 saat kalınca ve isyan yağmaya varınca terk ediş başlar (göç durur)', E.active && TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok === false && st.journal.some((j) => j.text.startsWith('ALARM · Umut tükendi')));
    check('en mutsuz sakin bohçasını toplar (emigrating), elindeki işi bırakır', single.emigrating && single.emigrating.exit && single.bubble?.icon === 'bundle' || (single.emigrating && !single.visible));
    const plan = S.behavior.brain.decide(single, 11);
    check('köyü terk eden harita kenarına yürür (emigrate)', plan.activity === 'emigrate' && plan.spot.x === single.emigrating.exit.x);
    game.events.emit('ui:selectCharacter', singleId);
    renderNow();
    check('karakter kartında "Köyü terk ediyor" etiketi', document.querySelector('.character-panel .purse-rioter.is-leaving')?.textContent === 'Köyü terk ediyor');
    for (let i = 0; i < 40 && st.characters.some((c) => c.id === singleId); i++) sim.step(225);
    offL();
    check('sakin kesesi ve çantasıyla kasabadan temelli ayrılır', !st.characters.some((c) => c.id === singleId) && st.characters.length === pop0 - 1 && leftEv[0]?.coins === 77 && leftEv[0]?.items === 3 && E.left >= 1 && E.coins >= 77 && st.stats.emigrants >= 1, JSON.stringify(leftEv[0] ? { coins: leftEv[0].coins, items: leftEv[0].items } : null));
    check('günlüğe acı bir not düşer', st.journal.some((j) => j.text.includes('köyden temelli ayrıldı') && j.icon === 'bundle'));
    const dangling = st.characters.filter((c) => c.partnerId === singleId || c.parentIds.includes(singleId)).length + Object.keys(st.relationships).filter((k) => k.split('-').map(Number).includes(singleId)).length + st.buildings.filter((b) => b.occupants.has(singleId) || b.workerIds.has(singleId)).length + (st.trust.revolt?.rioters.includes(singleId) ? 1 : 0);
    check('ayrılan sakine işaret eden referans kalmaz (eş, ebeveyn, ilişki, yapı, isyan)', dangling === 0, dangling);
    // Evli çift ailesiyle birlikte ayrılır
    const wife = st.characters.find((c) => c.married && !c.away && st.characters.find((p) => p.id === c.partnerId && !p.away));
    if (wife) {
      for (const c of st.characters) c.needs.fun = 90;
      wife.needs.fun = 0;
      E.lastAt = null;
      const group = S.desertion.leaveNext();
      check('evli sakin eşi (ve çocuklarıyla) birlikte ayrılır', group && group.includes(wife) && group.some((c) => c.id === wife.partnerId) && group.every((c) => c.emigrating), group?.map((c) => c.name).join(','));
      for (const c of group ?? []) S.desertion.depart(c);
      check('ayrılan çiftin bağı kimsede kalmaz', !st.characters.some((c) => group.some((g) => g.id === c.partnerId)));
    } else check('evli sakin eşi (ve çocuklarıyla) birlikte ayrılır', true, 'evli çift yok');
    // Çekirdek sakinler
    const keepCore = CD.EXODUS.core;
    const staying = st.characters.filter((c) => !c.role && !c.emigrating).length;
    CD.EXODUS.core = staying;
    E.lastAt = null;
    check(`en az ${keepCore} çekirdek sakin her koşulda kalır (çekirdek dolunca kimse ayrılmaz)`, S.desertion.leaveNext() === null);
    CD.EXODUS.core = staying - 1;
    const one = S.desertion.leaveNext();
    check('çekirdeğe bir kişilik yer kalınca aile değil yalnızca bir sakin ayrılır', one?.length === 1);
    for (const c of one ?? []) c.emigrating = null;
    CD.EXODUS.core = keepCore;
    check('çekirdek sakin sayısı 3', keepCore === 3);
    // Kriz çözülünce terk ediş biter, göç döner
    st.trust.value = 70;
    st.town.welfare = 70;
    S.desertion.hourly();
    check('güven ve refah toparlanınca terk ediş biter, göç yeniden açılır', !E.active && E.lowSince === null && TS.immigrationStatus(st).checks.find((c) => c.key === 'fame').ok && st.journal.some((j) => j.text.startsWith('Kasabaya umut döndü')));
    if (st.trust.revolt) S.trust.endRevolt();

    // --- Kayıt gidiş-dönüşü (sürüm 19) ---
    (st.tax.lockedUntil = 0, game.events.emit('ui:setTaxRate', { rate: 'low' }));
    S.crown.openDecree('shipyard');
    const leaver = st.characters.find((c) => !c.isChild && !c.away && !c.role);
    leaver.emigrating = { since: now(), exit: { x: 1, y: 1 } };
    const T = { rate: st.tax.rate, collections: st.tax.collections, rep: st.crown.reputation, decree: st.crown.decree.id, kind: st.crown.decree.kind, deadline: st.crown.decree.deadline, right: st.crown.statueRight, left: E.left, emig: leaver.id, paid: st.crown.paid, levies: st.crown.levies, emigrants: st.stats.emigrants };
    game.events.emit('ui:save');
    const raw19 = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    game.events.emit('ui:load');
    const s4 = game.state;
    check('kayıt sürümü 32: vergi, Krallık ve terk ediş kayda yazılır', raw19.version === 32 && raw19.tax && raw19.crown && raw19.exodus);
    check('kayıttan vergi kademesi ve tahsilat sayacı döner', s4.tax.rate === T.rate && s4.tax.collections === T.collections);
    check('kayıttan Krallık İtibarı, vergi sayaçları, süren ferman ve Kraliyet Beratı döner', s4.crown.reputation === T.rep && s4.crown.decree?.id === T.decree && s4.crown.decree.kind === T.kind && s4.crown.decree.deadline === T.deadline && s4.crown.statueRight === T.right && s4.crown.paid === T.paid && s4.crown.levies === T.levies);
    check('kayıttan göç istatistikleri ve yola çıkmış sakin döner', s4.exodus.left === T.left && s4.stats.emigrants === T.emigrants && s4.characters.find((c) => c.id === T.emig)?.emigrating?.exit?.x === 1);
    check('kayıttan Kraliyet Aslanlı Heykeli döner', s4.buildings.some((b) => b.type === 'royalStatue'));
  }

  // ===== 23. aşama: yangın ve itfaiye, Su Kuyusu, Gözcü Kulesi ve bekçiler, haydut baskınları, hasar / tamir, yaralanma =====
  {
    const S = game.scenes.current;
    const st = game.state;
    const W = S.world;
    const CRI = await import('/src/systems/Crisis.js');
    const CD = await import('/src/data/crisis.js');
    const BD = await import('/src/data/buildings.js');
    const HS = await import('/src/systems/HealthSystem.js');
    const SP = await import('/src/systems/StructureSystem.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const now = () => st.totalMinutes;
    const crisis = () => game.scenes.current.crisis;
    const renderNow = () => {
      game.ui.components.find((x) => x.renderWelfare).welfareAt = -Infinity;
      game.render(0);
    };
    const adults = () => st.characters.filter((c) => !c.isChild && !c.role);
    // Doğal krizler testi bozmasın: Huzurlu; testler fonksiyonları doğrudan çağırır
    st.crisis.difficulty = 'huzurlu';
    st.crisis.raid = null;
    st.crisis.nextRaidWarnAt = null;
    for (const b of st.buildings) {
      b.isBurning = false;
      b.isDamaged = false;
    }
    st.town.tier = 4;
    st.trust.value = 70;
    if (st.trust.revolt) S.trust.endRevolt();
    st.petitions.list = [];
    st.petitions.nextAt = now() + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = now() + 1e6;
    st.crown.nextLevyAt = now() + 1e6;
    st.crown.notice = null;
    sim.give({ wood: 600, stone: 600, food: 300, bread: 80, iron: 80, gold: 800 });
    const placeAt = (type, x, y) => {
      const res = S.construction.placeSite(type, x, y);
      if (!res.ok) return null;
      const job = S.jobs.jobs.find((j) => j.buildingId === res.building.id);
      if (job) S.jobs.cancel(job);
      S.construction.complete(res.building);
      return res.building;
    };
    const firstOf = (type) => st.buildings.find((b) => b.type === type && b.functional && !b.damaged);
    const popBefore = st.characters.length;
    const buildingsBefore = st.buildings.length;

    // --- Ayar: Tehlike Sıklığı ---
    check('üç tehlike sıklığı: Huzurlu (çarpan 0), Dengeli (1, varsayılan), Çetin (1,5)', CD.CRISIS_DIFFICULTY_KEYS.join(',') === 'huzurlu,dengeli,cetin' && CD.CRISIS_DIFFICULTY.huzurlu.rate === 0 && CD.CRISIS_DIFFICULTY.dengeli.rate === 1 && CD.CRISIS_DIFFICULTY.cetin.rate === 1.5 && CD.DEFAULT_DIFFICULTY === 'dengeli' && CRI.emptyCrisis().difficulty === 'dengeli');
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'cetin' });
    check('"ui:setCrisisDifficulty" tehlike sıklığını değiştirir ve çarpanı verir', st.crisis.difficulty === 'cetin' && CRI.crisisRate(st) === 1.5);
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'yok' });
    check('bilinmeyen tehlike sıklığı yok sayılır', st.crisis.difficulty === 'cetin');
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'huzurlu' });
    game.events.emit('ui:toggleSettings');
    renderNow();
    const crisisBtns = [...document.querySelectorAll('.settings-crisis')];
    check('Ayarlar penceresinde Tehlike Sıklığı: üç düğme, seçili olan vurgulu', crisisBtns.length === 3 && crisisBtns.map((b) => b.textContent).join(',') === 'Huzurlu,Dengeli,Çetin' && crisisBtns.find((b) => b.dataset.difficulty === 'huzurlu').classList.contains('is-active'));
    crisisBtns.find((b) => b.dataset.difficulty === 'dengeli').click();
    renderNow();
    check('Ayarlar düğmesi tehlike sıklığını seçer', st.crisis.difficulty === 'dengeli' && crisisBtns.find((b) => b.dataset.difficulty === 'dengeli').classList.contains('is-active'));
    game.events.emit('ui:toggleSettings');
    crisis().warnRaid();
    game.events.emit('ui:setCrisisDifficulty', { difficulty: 'huzurlu' });
    check('Huzurlu\'ya geçince bekleyen haydut tehlikesi geçer', !st.crisis.raid && st.crisis.nextRaidWarnAt === null && st.crisis.difficulty === 'huzurlu');

    // --- Doğal kriz kapıları: gün, tehlike sıklığı ---
    const realDay = st.time.day;
    st.time.day = 7;
    st.crisis.difficulty = 'dengeli';
    check('doğal yangın 8. günden önce çıkmaz, haydut 10. günden önce görülmez', !CRI.naturalCrisisAllowed(st, 'fire'));
    st.time.day = 8;
    check('8. günde doğal yangın açılır; haydut hâlâ kapalı', CRI.naturalCrisisAllowed(st, 'fire') && !CRI.naturalCrisisAllowed(st, 'bandit'));
    st.time.day = 10;
    check('10. günde haydut izleri açılır', CRI.naturalCrisisAllowed(st, 'bandit'));
    st.crisis.difficulty = 'huzurlu';
    check('Huzurlu: hiçbir doğal kriz çıkmaz', !CRI.naturalCrisisAllowed(st, 'fire') && !CRI.naturalCrisisAllowed(st, 'bandit'));
    st.time.day = realDay;

    // --- Su Kuyusu ---
    st.town.tier = 1;
    const lockWell = S.construction.checkPlacement('well', plaza.centerX + 3, plaza.centerY + 3);
    check('Su Kuyusu Köy seviyesinde açılır', !lockWell.ok && lockWell.reason.includes('Köy'), lockWell.reason);
    st.town.tier = 4;
    const wellDef = BD.BUILDINGS.well;
    check('Su Kuyusu tanımı: 1x1, odun + taş, Güvenlik, yangın emniyeti 8 karo / %80, sulama 4 karo / %10', wellDef.size.w === 1 && wellDef.cost.wood > 0 && wellDef.cost.stone > 0 && wellDef.category === 'Güvenlik' && wellDef.requiresTier === 2 && CD.FIRE.wellRadius === 8 && CD.FIRE.wellReduction === 0.8 && CD.WELL.gardenRadius === 4 && CD.WELL.gardenBonus === 0.1);
    check('Su Kuyusu İnşa menüsünde', BD.BUILD_MENU.includes('well') && BD.BUILD_MENU.includes('guardTower'));
    // Yangın olasılığı: kuyusuz / kuyulu
    const target = st.buildings.find((b) => b.type === 'workshop' && b.functional) ?? st.buildings.find((b) => b.type === 'lumberHut' && b.functional);
    for (const w of st.buildings.filter((b) => b.type === 'well')) w.damaged = true; // eski testlerden kalan olursa sayılmasın
    st.crisis.difficulty = 'dengeli';
    const chanceNoWell = CRI.fireChance(st, target);
    for (const w of st.buildings.filter((b) => b.type === 'well')) w.damaged = false;
    let wellSpot = null;
    for (let r = 1; r <= 6 && !wellSpot; r++) {
      for (let dy = -r; dy <= r && !wellSpot; dy++) {
        for (let dx = -r; dx <= r && !wellSpot; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = target.tileX + dx;
          const y = target.tileY + dy;
          if (S.construction.checkPlacement('well', x, y).ok) wellSpot = { x, y };
        }
      }
    }
    const wellB = wellSpot ? placeAt('well', wellSpot.x, wellSpot.y) : null;
    check('Su Kuyusu kurulur (anında tamam)', wellB && wellB.functional && wellB.type === 'well');
    const chanceWell = CRI.fireChance(st, target);
    check('yakında Su Kuyusu varken yangın ihtimali %80 azalır (×0,2)', chanceNoWell > 0 && Math.abs(chanceWell - chanceNoWell * 0.2) < 1e-12, `${chanceNoWell} -> ${chanceWell}`);
    st.crisis.difficulty = 'cetin';
    check('Çetin: yangın ihtimali %50 artar', Math.abs(CRI.fireChance(st, target) - chanceWell * 1.5) < 1e-12);
    st.crisis.difficulty = 'huzurlu';
    check('Huzurlu: yangın ihtimali sıfır', CRI.fireChance(st, target) === 0);
    check('kuyunun yangın etkisi 8 karoyla sınırlı', CRI.wellNear(st, target)?.id === wellB.id && !CRI.wellNear(st, { ...target, type: target.type, tileX: wellB.tileX + 30, tileY: wellB.tileY, definition: target.definition }, 8));
    // Bahçe sulaması
    let garden = st.buildings.find((b) => b.type === 'garden' && b.functional);
    for (let r = 2; r <= 24 && !garden; r++) {
      for (let dy = -r; dy <= r && !garden; dy++) {
        for (let dx = -r; dx <= r && !garden; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && S.construction.checkPlacement('garden', plaza.centerX + dx, plaza.centerY + dy).ok) garden = placeAt('garden', plaza.centerX + dx, plaza.centerY + dy);
        }
      }
    }
    const wellsNow = () => st.buildings.filter((b) => b.type === 'well');
    let wellNearGarden = CRI.wellNear(st, garden, 4);
    for (let r = 1; r <= 3 && !wellNearGarden; r++) {
      for (let dy = -r - 1; dy <= r + 2 && !wellNearGarden; dy++) {
        for (let dx = -r - 1; dx <= r + 2 && !wellNearGarden; dx++) {
          if (S.construction.checkPlacement('well', garden.tileX + dx, garden.tileY + dy).ok) wellNearGarden = placeAt('well', garden.tileX + dx, garden.tileY + dy);
        }
      }
    }
    const live = SP.productionFactors(garden, W, false, { farm: 1 });
    wellsNow().forEach((w) => (w.damaged = true));
    const dry = SP.productionFactors(garden, W, false, { farm: 1 });
    wellsNow().forEach((w) => (w.damaged = false));
    check('kuyusuz bahçede sulama çarpanı 1', dry.well === 1);
    check('4 karo yakınındaki bahçeye kuyu +%10 sulama verimi verir', Boolean(wellNearGarden) && Math.abs(live.well - 1.1) < 1e-9 && Math.abs(live.total / dry.total - 1.1) < 1e-9, JSON.stringify([dry.well, live.well, live.total / dry.total]));

    // --- Gözcü Kulesi ---
    st.town.tier = 2;
    const lockTower = S.construction.checkPlacement('guardTower', plaza.centerX + 3, plaza.centerY + 3);
    check('Gözcü Kulesi Kasaba seviyesinde açılır', !lockTower.ok && lockTower.reason.includes('Kasaba'), lockTower.reason);
    st.town.tier = 4;
    const towerDef = BD.BUILDINGS.guardTower;
    check('Gözcü Kulesi tanımı: 2x2, odun + taş + demir, nöbet işi (patrol), Güvenlik', towerDef.size.w === 2 && towerDef.cost.wood > 0 && towerDef.cost.stone > 0 && towerDef.cost.iron > 0 && towerDef.workActivity === 'patrol' && towerDef.guard === true && towerDef.category === 'Güvenlik' && towerDef.requiresTier === 3);
    // Baskın uyarısı: kulesiz 1 gün
    st.crisis.raid = null;
    const raidNoTower = crisis().warnRaid();
    check('kulesiz haydut baskını 1 gün önceden haber verilir', raidNoTower && !raidNoTower.early && raidNoTower.arriveAt - raidNoTower.warnedAt === 1440 && raidNoTower.tribute >= 25 && raidNoTower.tribute <= 40, JSON.stringify(raidNoTower));
    check('haydut izi günlüğe ve bildirime düşer', st.journal.at(-1).text.includes('haydut izleri'));
    renderNow();
    const raidChip = [...document.querySelectorAll('.hud-buffs .buff-chip')].find((c) => c.textContent.includes('Haydut izleri'));
    check('üst çubuğun altında haydut izi çipi (geri sayım) görünür', Boolean(raidChip) && raidChip.textContent.includes('sa'), raidChip?.textContent);
    // Savunma: kulesiz yetişkin + alet
    st.equipment.sturdyTool = 0;
    check('kulesiz savunma için depoda sağlam alet gerekir', !CRI.defenseStatus(st).ok && CRI.defenseStatus(st).reason.includes('alet'));
    st.equipment.sturdyTool = 2;
    check('kulesiz savunma: yeterli yetişkin ve alet varsa yapılabilir', CRI.defenseStatus(st).ok && CRI.defenseStatus(st).tower === null);
    // B: haraç (altın)
    sim.give({ gold: 500 });
    st.crisis.difficulty = 'dengeli';
    const tribute = st.crisis.raid.tribute;
    const g0 = st.resources.gold;
    const food0 = st.resources.food;
    const trustB0 = st.trust.value;
    const injuredBefore = st.characters.filter((c) => c.isInjured).length;
    const damagedBefore = st.buildings.filter((b) => b.damaged).length;
    const resB = crisis().resolveRaid('tribute');
    check('B) Haraç: hazineden tam haraç gider; hasar ve yaralı yok; Güven -2', resB.ok && g0 - st.resources.gold === tribute && st.resources.food === food0 && st.characters.filter((c) => c.isInjured).length === injuredBefore && st.buildings.filter((b) => b.damaged).length === damagedBefore && Math.abs(st.trust.value - (trustB0 - 2)) < 1e-9 && !st.crisis.raid && st.crisis.tributes >= 1);
    check('baskın çözülünce sıradaki haydut izi 8-10 gün sonraya kurulur', Number.isFinite(st.crisis.nextRaidWarnAt) && st.crisis.nextRaidWarnAt - now() >= 8 * 1440 && st.crisis.nextRaidWarnAt - now() <= 10 * 1440);
    st.crisis.difficulty = 'huzurlu';
    // B: altın yoksa erzak
    crisis().warnRaid();
    sim.give({ gold: 3, food: 200, bread: 0 });
    const payFood = CRI.tributeStatus(st, st.crisis.raid.tribute);
    const foodB0 = st.resources.food;
    crisis().resolveRaid('tribute');
    check('altın yetmezse haraç kilerden erzakla ödenir', payFood.ok && payFood.gold === 0 && payFood.food > 0 && foodB0 - st.resources.food >= payFood.food - 2 && st.resources.gold === 3, JSON.stringify(payFood));
    // Haraç ödenemez
    crisis().warnRaid();
    sim.give({ gold: 0, food: 0, bread: 0 });
    const badPay = crisis().resolveRaid('tribute');
    check('haraç ödenemezse seçim reddedilir, baskın sürer', !badPay.ok && Boolean(st.crisis.raid));
    // C: hazırlıksız yakalanma
    sim.give({ wood: 500, stone: 500, food: 400, bread: 0, gold: 1000 });
    for (const b of st.buildings) b.isDamaged = false;
    const foodC0 = st.resources.food;
    const goldC0 = st.resources.gold;
    const woodC0 = st.resources.wood;
    const stoneC0 = st.resources.stone;
    const trustC0 = st.trust.value;
    const dmgC0 = st.buildings.filter((b) => b.damaged).length;
    const resC = crisis().resolveRaid('caught');
    const stolenFood = foodC0 - st.resources.food;
    const stolenGold = goldC0 - st.resources.gold;
    const damagedC = st.buildings.filter((b) => b.damaged);
    check('C) Hazırlıksız: en çok stoğun %15\'i gider (asla tamamı değil), odun ve taş dokunulmaz', resC.ok && stolenFood > 0 && stolenFood <= Math.floor(foodC0 * 0.15) && stolenGold > 0 && stolenGold <= Math.floor(goldC0 * 0.15) && st.resources.food > 0 && st.resources.gold > 0 && st.resources.wood === woodC0 && st.resources.stone === stoneC0, `${stolenFood}/${foodC0} ${stolenGold}/${goldC0}`);
    check('C) tam olarak 1 yapı HASARLI olur (haritadan silinmez); Güven -8', damagedC.length === dmgC0 + 1 && damagedC[0].damageKind === 'raid' && st.buildings.includes(damagedC[0]) && Math.abs(st.trust.value - (trustC0 - 8)) < 1e-9, damagedC.map((b) => b.name).join(','));
    check('hasarlı yapı sınırdakilerden seçilir (kasaba merkezine en uzak)', damagedC[0] && st.buildings.filter((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type)).every((b) => Math.hypot(b.tileX - plaza.centerX, b.tileY - plaza.centerY) <= Math.hypot(damagedC[0].tileX - plaza.centerX, damagedC[0].tileY - plaza.centerY) + 1e-9 || b.damaged));
    check('stok 1 iken hiçbir şey çalınmaz (asla tamamı değil)', CRI.stolenAmount(1) === 0 && CRI.stolenAmount(0) === 0 && CRI.stolenAmount(100) === 15 && CRI.stolenAmount(7) === 1);
    // Kuleyi kur
    const tower = sim.place('guardTower', { maxRadius: 40 });
    check('Gözcü Kulesi kurulur', tower && tower.functional && CRI.towerOf(st)?.id === tower.id);
    check('kule varken yetişkinler yeterliyse 1-2 bekçi yuvası; sayı yetişkin sayısına göre', (() => { crisis().guardHour(); return tower.guardSlots === (CRI.ablePeople(st).length >= CD.GUARD.twoGuardsAdults ? 2 : 1) && tower.workerSlots === tower.guardSlots; })());
    check('kuleli savunma: en az 2 sağlam yetişkin yeter (alet gerekmez)', (() => { st.equipment.sturdyTool = 0; return CRI.defenseStatus(st).ok && CRI.defenseStatus(st).tower?.id === tower.id; })());
    // Kule güven katkısı
    st.trust.value = 50;
    crisis().guardHour();
    check('Gözcü Kulesi saat başı Yönetim Güveni\'ne katkı verir (+0,2 ve nöbetçi başına +0,1)', Math.abs(st.trust.value - (50 + CD.GUARD.trustPerHour + tower.workerIds.size * CD.GUARD.trustPerGuard)) < 1e-9, String(st.trust.value));
    const lightRadius = (await import('/src/data/landscape.js')).DARKNESS.lights.guardTower;
    {
      const LS = await import('/src/systems/Landscape.js');
      const wasLit = tower.lit;
      tower.lit = true;
      const sources = LS.litSources([tower]);
      const nearby = { x: tower.center.x + 40, y: tower.center.y + 40 };
      const lit = sources.length === 1 && LS.isLitPoint(sources, nearby.x, nearby.y) && !LS.isLitPoint(sources, tower.center.x + 400, tower.center.y);
      tower.lit = wasLit;
      check('kule geceleri çevresini aydınlatır: yakınındaki yürüyen sakin karanlıkta ürkmez (ışık yarıçapı ~90 piksel)', lightRadius >= 80 && Boolean(towerDef.litHours) && lit);
    }
    // Bekçi nöbeti
    let patrolling = null;
    // Nöbet üretimden sonra gelir (boştaki yetişkinlerin işi); testte bir sakini kuleye sabitleyip nöbeti doğrularız
    const guardCandidate = adults().find((c) => !c.away && !c.illness && c.workplaceId === null);
    game.events.emit('ui:pinWorker', { buildingId: tower.id, characterId: guardCandidate.id });
    for (let i = 0; i < 30 && !patrolling; i++) {
      hours(1);
      patrolling = st.characters.find((c) => c.task?.activity === 'patrol');
    }
    check('Kasaba Bekçisi: 1-2 yetişkin kuleye nöbete gider (devriye)', patrolling && !patrolling.isChild && tower.workerIds.has(patrolling.id) && patrolling.activityLabel.includes('bekçi'), patrolling?.activityLabel);
    check('nöbetçi sayısı kule yuvalarını aşmaz', tower.workerIds.size <= tower.guardSlots);
    // Kuleyle baskın 2 gün önceden
    st.crisis.raid = null;
    const raidTower = crisis().warnRaid();
    check('Gözcü Kulesi varken haydut baskını 2 gün önceden haber verilir', raidTower.early && raidTower.arriveAt - raidTower.warnedAt === 2 * 1440);
    // A: bekçilerle püskürt
    sim.give({ wood: 500, stone: 500, food: 400, gold: 500 });
    for (const c of st.characters) c.isInjured = false;
    const goldA0 = st.resources.gold;
    const stockA = { wood: st.resources.wood, stone: st.resources.stone, food: st.resources.food };
    const trustA0 = st.trust.value;
    const dmgA0 = st.buildings.filter((b) => b.damaged).length;
    const resA = crisis().resolveRaid('defend');
    const gainA = st.resources.gold - goldA0;
    const hurt = st.characters.filter((c) => c.isInjured);
    check('A) Bekçilerle Püskürt: kaynak kaybı yok, +15-25 altın ganimet, Güven +6, "Haydutlar Kovuldu" bonusu', resA.ok && gainA >= 15 && gainA <= 25 && st.resources.wood === stockA.wood && st.resources.stone === stockA.stone && st.resources.food === stockA.food && Math.abs(st.trust.value - (trustA0 + 6)) < 1e-9 && st.buffs.banditsRepelled > now(), `${gainA}`);
    check('A) hiçbir yapı hasar görmez; en çok 1 savunmacı hafif yaralanır', st.buildings.filter((b) => b.damaged).length === dmgA0 && hurt.length <= 1);
    check('A) savunmacılar "Haydutları kasabadan kovduk" anısı kazanır; dedikodu dolaşır', resA.defenders.length > 0 && st.characters.find((c) => c.id === resA.defenders[0]).memories.some((m) => m.text === 'Haydutları kasabadan kovduk') && st.social.gossip.some((n) => n.kind === 'raid'));
    check('günlüğe baskın sonucu yazılır', st.journal.some((j) => j.text.startsWith('Haydutlar püskürtüldü')));
    check('bonus "Haydutlar Kovuldu" refaha eklenir', (await import('/src/systems/TownStatus.js')).townHappinessBonus(st) >= 4);
    // Savunma yoksa A reddedilir
    crisis().warnRaid();
    const savedTower = tower.damaged;
    tower.damaged = true;
    st.equipment.sturdyTool = 0;
    const adultsAble = CRI.ablePeople(st);
    const savedAway = adultsAble.map((c) => c.away);
    adultsAble.forEach((c, i) => { if (i >= 2) c.away = { stage: 'away', until: now() + 1e6 }; });
    const denyA = crisis().resolveRaid('defend');
    check('savunma yetmiyorsa "Bekçilerle Püskürt" reddedilir (nedeniyle), baskın sürer', !denyA.ok && Boolean(st.crisis.raid) && denyA.reason.length > 0, denyA.reason);
    // Otomatik çözüm: süre dolunca savunma yoksa hazırlıksız yakalanır
    st.crisis.raid.arriveAt = now();
    const cb = st.crisis.caught;
    crisis().hourly();
    check('karar verilmezse varışta savunma yetmiyorsa C uygulanır (kendiliğinden)', !st.crisis.raid && st.crisis.caught === cb + 1);
    adultsAble.forEach((c, i) => (c.away = savedAway[i]));
    tower.damaged = savedTower;
    st.equipment.sturdyTool = 1;
    crisis().warnRaid();
    st.crisis.raid.arriveAt = now();
    const rb = st.crisis.repelled;
    crisis().hourly();
    check('karar verilmezse varışta savunma yetiyorsa A uygulanır (kendiliğinden)', !st.crisis.raid && st.crisis.repelled === rb + 1);
    // Baskın penceresi
    crisis().warnRaid();
    game.events.emit('ui:openRaid');
    renderNow();
    const modal = document.querySelector('.crisis-panel');
    const optionBtns = modal ? [...modal.querySelectorAll('.crisis-option .upgrade-button')] : [];
    check('haydut izi çipi/Kule paneli: üç net seçenekli pencere (A püskürt, B haraç, C hazırlıksız)', modal && !modal.hidden && optionBtns.length === 3 && optionBtns[0].textContent.startsWith('A') && optionBtns[1].textContent.startsWith('B') && optionBtns[2].textContent.startsWith('C'), optionBtns.map((b) => b.textContent).join(' | '));
    sim.give({ gold: 800 });
    renderNow();
    const tribBefore = st.crisis.tributes;
    [...document.querySelectorAll('.crisis-panel .crisis-option .upgrade-button')][1].click();
    renderNow();
    check('pencerede "Haraç Öde" düğmesi baskını çözer ve pencere kapanır', st.crisis.tributes === tribBefore + 1 && !st.crisis.raid && document.querySelector('.crisis-panel').hidden);
    game.events.emit('ui:selectBuilding', null);
    crisis().warnRaid();
    game.events.emit('ui:selectBuilding', tower.id);
    renderNow();
    check('Gözcü Kulesi panelinde haydut baskını kartı (üç seçenek) ve bekçiler', document.querySelectorAll('.building-crisis .crisis-option').length === 3 && document.querySelector('.building-crisis').textContent.includes('Asayiş'));
    crisis().resolveRaid('tribute');
    game.events.emit('ui:selectBuilding', null);

    // --- Yangın ---
    // Gündüz olsun (sakinler uyanık): koşacak itfaiyeciler gerekir
    for (let i = 0; i < 24 && st.time.hour !== 9; i++) hours(1);
    for (const b of st.buildings) b.isDamaged = false;
    st.trust.value = 60;
    const burner = st.buildings.find((b) => b.type === 'lumberHut' && b.functional) ?? st.buildings.find((b) => BD.DAMAGEABLE_TYPES.includes(b.type) && b.functional);
    const trustF0 = st.trust.value;
    let fireEvent = null;
    const offFire = game.events.on('crisis:fireStarted', (p) => (fireEvent = p));
    crisis().startFire(burner);
    offFire();
    check('yangın başlar: isBurning, fireProgress 0, hasar nedeni "yangın"', burner.isBurning && burner.fireProgress === 0 && burner.damageKind === 'fire' && !burner.damaged);
    check('yangın günlüğe yazılır ve "yangın çıktı" olayı yayılır', st.journal.some((j) => j.text.includes(`${burner.name} yangın çıktı`)) && fireEvent?.building === burner && fireEvent.responders.length > 0 && fireEvent.responders.length <= CD.FIRE.maxFighters);
    renderNow();
    const fireChip = [...document.querySelectorAll('.hud-buffs .buff-chip')].find((c) => c.textContent.includes('yanıyor'));
    check('üst çubuk altında yangın uyarı çipi ("yanıyor · %…")', Boolean(fireChip) && fireChip.textContent.includes(burner.name), fireChip?.textContent);
    check('yanan yapı çalışmaz (iş yeri boşta)', (() => { sim.step(2); return burner.idle === true; })());
    const p0 = burner.fireProgress;
    crisis().update({ gameMinutes: 60 });
    check('yangın zamanla yayılır (6 saatte %100)', Math.abs(burner.fireProgress - p0 - 100 / 6) < 1e-6, String(burner.fireProgress));
    // (28.1) Panel: Acil Seferberlik (eski "Acil Söndür" bedava sihri kalktı)
    game.events.emit('ui:selectBuilding', burner.id);
    sim.give({ gold: 5 });
    st.resources.gold = 5;
    renderNow();
    st.trust.value = 60;
    const musterBtn = () => [...document.querySelectorAll('.building-crisis button')].find((b) => b.textContent.startsWith('Acil Seferberlik') || b.textContent.startsWith('Seferberlik'));
    check('yanan yapının panelinde "Acil Seferberlik" düğmesi vardır, "Acil Söndür" yoktur', Boolean(musterBtn()) && ![...document.querySelectorAll('.building-crisis button')].some((b) => b.textContent.includes('Söndür')));
    check('altın 30\'dan azsa Acil Seferberlik düğmesi devre dışı ve reddedilir (yangın değişmez)', musterBtn().disabled && !crisis().muster(burner).ok && !burner.emergencyMuster && burner.isBurning && st.resources.gold === 5);
    st.resources.gold = 100;
    renderNow();
    const trustE0 = st.trust.value;
    const extinguishedBefore = st.crisis.extinguished;
    const ablesAwake = CRI.ablePeople(st).filter((c) => !c.isSleeping);
    const normalAssigned = ablesAwake.filter((c) => crisis().fireAssignment(c)?.id === burner.id).length;
    check('seferberlikten önce en çok 4 kişi yangına atanır', normalAssigned <= CD.FIRE.maxFighters, String(normalAssigned));
    const dur0 = S.behavior.brain.crisisDuration('fetchWater', burner);
    musterBtn().click();
    check('Acil Seferberlik: 30 altın düşer, yangın SÖNMEZ (hasar yok, Güven değişmez), bayrak açılır', burner.isBurning && burner.emergencyMuster === true && st.resources.gold === 70 && Math.abs(st.trust.value - trustE0) < 1e-9 && st.crisis.extinguished === extinguishedBefore && st.journal.some((j) => j.text.includes('Acil Seferberlik')));
    const musterAssigned = ablesAwake.filter((c) => crisis().fireAssignment(c)?.id === burner.id).length;
    check('seferberlikte yangına en çok 8 uyanık sağlam yetişkin atanır (normalde 4)', musterAssigned === Math.min(CD.FIRE.muster.fighters, ablesAwake.length) && (ablesAwake.length <= 4 || musterAssigned > normalAssigned), `${musterAssigned}/${ablesAwake.length}`);
    check('seferberlikte kova işleri 2 kat hızlıdır (süre yarıya iner)', dur0 > 0 && S.behavior.brain.crisisDuration('fetchWater', burner) === dur0 / 2 && S.behavior.brain.crisisDuration('fightFire', burner) === CD.FIRE.muster.speed ** -1 * 3);
    st.resources.gold = 100;
    check('seferberlik ikinci kez ilan edilmez (altın düşmez)', !crisis().muster(burner).ok && st.resources.gold === 100);
    // Yorgunluk: kova atanlar söndükten sonra Enerji -40 / Keyif -20 kaybeder; atmayanlar etkilenmez
    const thrower = adults()[0];
    const idler = adults().find((c) => c.id !== thrower.id && c.id !== adults()[1].id);
    const needsKeep = adults().map((c) => [c, c.needs.energy, c.needs.fun, c.isInjured, c.injuryTimer]); // test sonunda geri yüklenir (sonraki senaryolar bozulmasın)
    for (const c of [thrower, adults()[1], idler]) { c.needs.energy = 90; c.needs.fun = 70; }
    let fatigueEvent = null;
    const offFat = game.events.on('crisis:musterFatigue', (p) => (fatigueEvent = p));
    for (let i = 0; i < CRI.bucketsNeeded(st, burner); i++) crisis().onBucket(i % 2 ? adults()[1] : thrower, burner);
    offFat();
    check('Seferberlik yangını söndü: hasarsız, kova atanlar Enerji -40 ve Keyif -20 (+4 el birliği) kaybeder', !burner.isBurning && !burner.damaged && !burner.emergencyMuster && Math.abs(thrower.needs.energy - 50) < 1e-9 && Math.abs(thrower.needs.fun - 54) < 1e-9 && fatigueEvent?.helpers.includes(thrower.id) && st.journal.some((j) => j.text.includes('aşırı yorgun')));
    check('kova atmayan sakin seferberlik yorgunluğundan etkilenmez', idler.needs.energy === 90 && idler.needs.fun === 70);
    // Seferberliğe rağmen söndürülemeyen yangın: yapı hasar alır ama kova atanlar yine yorulur; bayrak kayda yazılır ve sıfırlanır
    {
      const t2 = st.buildings.find((b) => b !== burner && b.functional && !b.damaged && !b.isBurning && BD.DAMAGEABLE_TYPES.includes(b.type));
      if (t2) {
        st.resources.gold = Math.max(st.resources.gold, 100);
        crisis().startFire(t2);
        check('yeni yangında seferberlik bayrağı kapalı başlar', t2.emergencyMuster === false);
        crisis().muster(t2);
        const rawLive = JSON.parse(JSON.stringify(S.saves.snapshot()));
        check('seferberlik bayrağı kayda yazılır (buildings[].emergencyMuster)', rawLive.buildings.find((b) => b.id === t2.id).emergencyMuster === true && rawLive.buildings.filter((b) => b.id !== t2.id).every((b) => b.emergencyMuster === false));
        const burnHelper = adults()[2];
        burnHelper.needs.energy = 80;
        burnHelper.needs.fun = 60;
        crisis().onBucket(burnHelper, t2);
        t2.fireProgress = 99;
        crisis().update({ gameMinutes: 30 });
        check('seferberlikte bile söndürülemeyen yangın yapıyı hasarlı bırakır; kova atan yine Enerji -40 / Keyif -20 kaybeder, bayrak sıfırlanır', !t2.isBurning && t2.damaged && !t2.emergencyMuster && Math.abs(burnHelper.needs.energy - 40) < 1e-9 && Math.abs(burnHelper.needs.fun - 40) < 1e-9);
        t2.isDamaged = false;
        t2.damageKind = null;
      }
    }
    for (const [c, e, f, inj, timer] of needsKeep) { c.needs.energy = e; c.needs.fun = f; c.isInjured = inj; c.injuryTimer = timer; }
    game.events.emit('ui:selectBuilding', null);
    // Kova ile söndürme (kuyu uzakta: 4 kova)
    wellsNow().forEach((w) => (w.damaged = true)); // kuyular devre dışı: kuyusuz kasaba
    const farTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.isBurning);
    st.trust.value = 60;
    if (farTarget) {
      crisis().startFire(farTarget);
      const helperA = adults()[0];
      const helperB = adults()[1];
      const trustK0 = st.trust.value;
      const fireOutEvents = [];
      const offOut = game.events.on('crisis:fireOut', (p) => fireOutEvents.push(p));
      for (let i = 0; i < 3; i++) crisis().onBucket(i % 2 ? helperA : helperB, farTarget);
      check('kuyu yokken yangın için 4 kova gerekir', farTarget.isBurning && farTarget.fireWater === 3 && CRI.bucketsNeeded(st, farTarget) === 4);
      crisis().onBucket(helperA, farTarget);
      offOut();
      check('4. kovada yangın söner: hasarsız, "yangını el birliğiyle söndürdük" anısı ve Güven +2', !farTarget.isBurning && !farTarget.damaged && fireOutEvents.length === 1 && fireOutEvents[0].helpers.length === 2 && helperA.memories.some((m) => m.text === 'Yangını el birliğiyle söndürdük') && Math.abs(st.trust.value - (trustK0 + 2)) < 1e-9 && st.journal.some((j) => j.text.includes('el birliğiyle')));
    } else check('kuyu yokken kova ile söndürme (uygun yapı bulunamadı)', false);
    wellsNow().forEach((w) => (w.damaged = false));
    const nearTarget = target;
    nearTarget.isBurning = false;
    nearTarget.isDamaged = false;
    crisis().startFire(nearTarget);
    check('yakında Su Kuyusu varken (kova zinciri) 3 kova yeter', CRI.bucketsNeeded(st, nearTarget) === 3);
    for (let i = 0; i < 3; i++) crisis().onBucket(adults()[i % 2], nearTarget);
    check('3 kovada yangın söner (kuyu yakın)', !nearTarget.isBurning && !nearTarget.damaged);
    // Sakinler gerçekten koşar: kovalar atılır ve yangın söner (sim ile)
    {
      const fightTarget = nearTarget;
      let seen = new Set();
      let buckets = 0;
      const offB = game.events.on('crisis:bucket', () => buckets++);
      crisis().startFire(fightTarget);
      for (let i = 0; i < 72 && fightTarget.isBurning; i++) {
        sim.step(19);
        for (const c of st.characters) if (c.task && ['fetchWater', 'fightFire'].includes(c.task.activity)) seen.add(c.task.activity);
      }
      offB();
      check('sakinler işi bırakıp kova taşır: su alır (fetchWater), yangına boşaltır (fightFire) ve yangını söndürür', !fightTarget.isBurning && seen.has('fetchWater') && seen.has('fightFire') && buckets >= 3 && !fightTarget.damaged, `${[...seen]} ${buckets} kova`);
      check('yangını söndüren kova taşıyıcıların başında su kovası balonu çıkar', (() => { try { return UI.getBubbleSprite('bucket') && UI.getBubbleSprite('shield') && UI.getBubbleSprite('bandit') && UI.getBubbleSprite('bandage'); } catch (e) { return false; } })());
    }
    // Kuyu yokken nehirden su taşıma: kovayı dolduranlar yangına koşar (sorumlu sakinler kova doluyken sıralamadan düşmez)
    {
      wellsNow().forEach((w) => (w.damaged = true));
      const riverTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.isBurning && b.id !== nearTarget.id) ?? nearTarget;
      riverTarget.isBurning = false;
      let thrownRiver = 0;
      let filledRiver = 0;
      const offT = game.events.on('crisis:bucketThrown', () => thrownRiver++);
      const offF = game.events.on('crisis:bucketFilled', () => filledRiver++);
      const sourceKind = crisis().waterSource(riverTarget, adults()[0])?.kind ?? null;
      crisis().startFire(riverTarget);
      for (let i = 0; i < 72 && riverTarget.isBurning; i++) {
        sim.step(19);
        if (st.dilemma.active) sim.step(1900);
      }
      offT();
      offF();
      wellsNow().forEach((w) => (w.damaged = false));
      check('kuyu yokken sakinler nehirden su taşır: kovayı dolduranlar yangına koşar, kovalar atılır ve yangın hasarsız söner', sourceKind === 'river' && !riverTarget.isBurning && !riverTarget.damaged && thrownRiver >= 4 && filledRiver >= thrownRiver, `${sourceKind} dolan ${filledRiver} atılan ${thrownRiver} hasar ${riverTarget.damaged}`);
    }
    // Yanıp biten yangın: hasarlı ama silinmez
    const burnTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && b.id !== nearTarget.id) ?? nearTarget;
    const burnCount = st.buildings.length;
    st.trust.value = 60;
    const burnTrust0 = st.trust.value;
    crisis().startFire(burnTarget);
    burnTarget.fireProgress = 99;
    crisis().update({ gameMinutes: 30 });
    check('söndürülemeyen yangın: yapı HASARLI olur (isDamaged), haritadan SİLİNMEZ', !burnTarget.isBurning && burnTarget.damaged && burnTarget.isDamaged === true && burnTarget.damageKind === 'fire' && st.buildings.length === burnCount && st.buildings.includes(burnTarget));
    check('yanıp biten yapıda Güven -2; günlük ve sayaç', Math.abs(st.trust.value - (burnTrust0 - 2)) < 1e-9 && st.crisis.burned >= 1 && st.journal.some((j) => j.text.includes('yanıp hasar gördü')));
    sim.step(6);
    check('hasarlı yapı üretim yapamaz (boşta, çalışan yok)', burnTarget.idle === true && burnTarget.workerSlots >= 0 && [...burnTarget.workerIds].length === 0);
    renderNow();
    check('hasarlı yapı için "N hasarlı yapı" çipi', [...document.querySelectorAll('.hud-buffs .buff-chip')].some((c) => c.textContent.includes('hasarlı yapı')));

    // --- Tamir ---
    game.events.emit('ui:selectBuilding', burnTarget.id);
    renderNow();
    const repairBtn = [...document.querySelectorAll('.building-crisis button')].find((b) => b.textContent === 'Tamir Et');
    const cost = CRI.instantRepairCost(burnTarget.type);
    const expectCost = Object.fromEntries(Object.entries(burnTarget.definition.cost).filter(([r]) => r === 'wood' || r === 'stone').map(([r, v]) => [r, Math.max(1, Math.ceil(v * 0.5))]));
    expectCost.gold = 25;
    check('(28.1) anında Tamir Et bedeli inşa maliyetinin %50\'si (odun, taş) + 25 altın', JSON.stringify(cost) === JSON.stringify(expectCost) && Object.keys(cost).every((r) => r === 'wood' || r === 'stone' || r === 'gold'), JSON.stringify(cost));
    const mendCost = CRI.repairCost(burnTarget.type);
    check('(28.1) ustaların onarımı (mend) maliyetin %20\'si: anında tamirden belirgin ucuz, altın istemez', mendCost.gold === undefined && Object.entries(mendCost).every(([r, v]) => v === Math.max(1, Math.ceil(burnTarget.definition.cost[r] * 0.2)) && v <= cost[r]) && CD.REPAIR.costRatio === 0.2);
    check('hasarlı yapının panelinde "Tamir Et" düğmesi ve hasar kartı', Boolean(repairBtn) && document.querySelector('.building-crisis').textContent.includes('Hasar'));
    sim.give({ wood: 0, stone: 0 });
    renderNow();
    const poor = crisis().repairNow(burnTarget);
    check('kaynak yetmezse Tamir Et reddedilir, yapı hasarlı kalır', !poor.ok && burnTarget.damaged);
    sim.give({ wood: 400, stone: 400 });
    st.resources.gold = 10;
    const noGold = crisis().repairNow(burnTarget);
    check('(28.1) 25 altın yoksa Tamir Et reddedilir (altın şartı)', !noGold.ok && burnTarget.damaged && st.resources.gold === 10 && noGold.reason.includes('Altın'), noGold.reason);
    st.resources.gold = 200;
    const wr0 = st.resources.wood;
    const sr0 = st.resources.stone;
    const goldR0 = st.resources.gold;
    const repairs0 = st.crisis.repairs;
    game.events.emit('ui:repairBuilding', { buildingId: burnTarget.id });
    check('Tamir Et: bedel düşülür, yapı ANINDA onarılır (isDamaged = false)', !burnTarget.damaged && wr0 - st.resources.wood === (cost.wood ?? 0) && sr0 - st.resources.stone === (cost.stone ?? 0) && goldR0 - st.resources.gold === 25 && burnTarget.damageKind === null && st.crisis.repairs === repairs0 + 1);
    check('onarım günlüğe yazılır (yangın hasarından)', st.journal.some((j) => j.text.includes(`${burnTarget.name} yangın hasarından onarıldı`)));
    game.events.emit('ui:selectBuilding', null);
    sim.step(2);
    check('onarılan yapı yeniden çalışabilir', burnTarget.idle === false || burnTarget.definition.crafting || burnTarget.definition.processing || burnTarget.definition.apothecary);
    // Ustalar otomatik onarır
    const autoTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.project);
    sim.give({ wood: 400, stone: 400 });
    crisis().damage(autoTarget, 'fire');
    autoTarget.damagedAt = now() - 30; // henüz 2 saat dolmadı
    crisis().autoRepair();
    check('hasardan 2 saat geçmeden usta onarımı başlamaz (oyuncuya fırsat)', !autoTarget.project);
    autoTarget.damagedAt = now() - 150;
    const wA = st.resources.wood;
    crisis().autoRepair();
    check('boştaki ustalar 2 saat sonra kaynak varsa onarım projesini kendiliğinden başlatır (maliyet %20)', autoTarget.project?.kind === 'mend' && autoTarget.project.work === CD.REPAIR.buildWork && wA - st.resources.wood === (CRI.repairCost(autoTarget.type).wood ?? 0));
    let mended = false;
    for (let i = 0; i < 40 && !mended; i++) {
      hours(1);
      mended = !autoTarget.damaged;
    }
    check('inşaatçılar kısa sürede binayı onarır (isDamaged = false)', mended && !autoTarget.project, `${autoTarget.damaged}`);
    // Fırtına hasarı: usta kendiliğinden başlatmaz, ama onarım maliyeti artık yangınla aynı %20 (28.1)
    const stormTarget = st.buildings.find((b) => b.functional && BD.DAMAGEABLE_TYPES.includes(b.type) && !b.damaged && !b.project);
    stormTarget.damaged = true;
    crisis().autoRepair();
    const stormSpec = CRI.mendSpecFor(stormTarget);
    const stormWood = stormTarget.definition.cost.wood ? Math.max(1, Math.ceil(stormTarget.definition.cost.wood * 0.2)) : undefined;
    check('fırtına hasarı eski kurala bağlı kalır: oyuncu başlatır (maliyet %20), usta kendiliğinden başlamaz', !stormTarget.project && stormSpec.buildWork === 90 && stormSpec.cost.wood === stormWood, JSON.stringify(stormSpec.cost));
    st.resources.gold = Math.max(st.resources.gold, 100);
    crisis().repairNow(stormTarget);
    check('"Tamir Et" fırtına hasarını da anında onarır', !stormTarget.damaged);

    // --- Hafif yaralanma ve Şifacı ---
    const victim = adults()[2];
    victim.isInjured = false;
    const popD = st.characters.length;
    crisis().injure(victim, 'fire');
    check('yaralanma: isInjured ve 1,5 günlük (2160 dk) injuryTimer; sakin ölmez', victim.isInjured && victim.injuryTimer === 36 * 60 && st.characters.includes(victim));
    check('yaralı sakin %20 yavaş yürür ve çalışır', Math.abs(HS.healthWalkMultiplier(victim, now()) - 0.8) < 1e-9 && Math.abs(HS.healthWorkMultiplier(victim, now()) - 0.8) < 1e-9 && HS.healthWalkMultiplier(adults().find((c) => !c.isInjured && !c.illness && !HS.hasVigor(c, now())), now()) === 1);
    game.events.emit('ui:selectCharacter', victim.id);
    renderNow();
    check('Karakter Kartı "🩹 Hafif Yaralı" etiketini gösterir', [...document.querySelectorAll('.condition-chip')].some((c) => c.textContent.includes('Hafif Yaralı')), [...document.querySelectorAll('.condition-chip')].map((c) => c.textContent).join('|'));
    renderNow();
    check('yaralılar üst çubukta "hafif yaralı" çipinde sayılır', [...document.querySelectorAll('.hud-buffs .buff-chip')].some((c) => c.textContent.includes('hafif yaralı')));
    game.events.emit('ui:selectCharacter', null);
    // Çocuklar yaralanmaz
    const kid = st.characters.find((c) => c.isChild);
    if (kid) check('çocuklar yaralanmaz', !crisis().injure(kid, 'raid') && !kid.isInjured);
    // Şifacı yokken kendiliğinden iyileşme
    const healers = st.buildings.filter((b) => b.type === 'healerHut');
    const healerStates = healers.map((b) => b.damaged);
    healers.forEach((b) => (b.damaged = true));
    victim.task = null;
    crisis().update({ gameMinutes: 36 * 60 + 1 });
    check('Şifacı Kulübesi yoksa bile yara 1,5 günde kendiliğinden iyileşir', !victim.isInjured && st.journal.some((j) => j.text.includes('yarası kendiliğinden iyileşti')));
    // Şifacıda iyileşme
    healers.forEach((b, i) => (b.damaged = healerStates[i]));
    const healer = firstOf('healerHut') ?? sim.place('healerHut', { maxRadius: 40 });
    const patient = adults().find((c) => c !== victim && !c.illness && !c.away);
    patient.isInjured = false;
    crisis().injure(patient, 'raid');
    patient.needs.fun = 40;
    const treated0 = st.crisis.treated;
    let healedAt = null;
    for (let i = 0; i < 48 && !healedAt; i++) {
      hours(1);
      if (!patient.isInjured) healedAt = i;
    }
    check('yaralı sakin Şifacı Kulübesi\'ne gider, orada iyileşir (isInjured = false)', healedAt !== null && st.crisis.treated === treated0 + 1, `${healedAt} saat`);
    check('şifacıda sarılınca keyif artar ve Yaşam Günlüğü\'ne "Şifacıda yaraları sarıldı" yazılır', patient.memories.some((m) => m.text === 'Şifacıda yaraları sarıldı') && st.journal.some((j) => j.text.includes('Şifacı Kulübesi\'nde sarıldı')));
    // Şifalı ot
    const herbal = adults().find((c) => !c.isInjured && !c.illness);
    herbal.isInjured = true;
    herbal.injuryTimer = 36 * 60;
    game.events.emit('citizen:herbTea', { character: herbal });
    check('şifalı ot demleyen yaralının yarası çabuk kapanır', herbal.injuryTimer <= 180);
    herbal.isInjured = false;
    herbal.injuryTimer = 0;

    // --- Ana üreteç yalıtımı (KURAL 1) ---
    {
      const mainRng = S.behavior.rng;
      const rngStateBefore = mainRng.state;
      let randomCalls = 0;
      const realRandom = Math.random;
      Math.random = () => { randomCalls++; return realRandom(); };
      const b = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged);
      crisis().startFire(b);
      crisis().onBucket(adults()[0], b);
      crisis().extinguish(b, { byPlayer: true });
      crisis().startFire(b);
      b.fireProgress = 100;
      crisis().update({ gameMinutes: 1 });
      crisis().repairNow(b);
      crisis().warnRaid();
      crisis().resolveRaid('defend');
      crisis().warnRaid();
      crisis().resolveRaid('caught');
      for (const x of st.buildings) x.isDamaged = false;
      crisis().injure(adults()[3], 'raid');
      crisis().update({ gameMinutes: 3000 });
      st.crisis.difficulty = 'cetin';
      crisis().rollFire();
      crisis().hourly();
      st.crisis.difficulty = 'huzurlu';
      Math.random = realRandom;
      check('kriz sistemi oyunun ana rastgele sayı üretecini ve Math.random\'u tüketmez', mainRng.state === rngStateBefore && randomCalls === 0, `${mainRng.state}/${rngStateBefore} ${randomCalls}`);
      check('kriz sistemi kendi tohumlanmış üretecini kullanır (seed + 26)', crisis().rng !== S.behavior.rng && crisis().rng.state !== undefined);
      st.crisis.raid = null;
      for (const x of st.buildings) { x.isBurning = false; x.isDamaged = false; }
      for (const c of st.characters) { c.isInjured = false; c.injuryTimer = 0; }
    }

    // --- Doğal takvim (Çetin) ve yükleme sonrası 24 saat koruması ---
    {
      const c = crisis();
      st.crisis.difficulty = 'cetin';
      st.crisis.raid = null;
      st.crisis.nextRaidWarnAt = null;
      const dayKept = st.time.day;
      st.time.day = Math.max(dayKept, 12);
      const firesBefore = st.crisis.fires;
      const graceSaved = c.graceUntil;
      c.graceUntil = now() + 1440;
      c.hourly();
      check('kayıt yüklendikten sonraki ilk 24 saatte doğal kriz çıkmaz (haydut takvimi bile kurulmaz)', st.crisis.nextRaidWarnAt === null && st.crisis.fires === firesBefore && !st.crisis.raid);
      c.graceUntil = null;
      c.hourly();
      check('koruma bitince haydut izi takvimi kurulur (Çetin: 8-10 günlük aralık ≥ 1/1,5)', Number.isFinite(st.crisis.nextRaidWarnAt));
      st.crisis.nextRaidWarnAt = now() - 1;
      c.hourly();
      check('takvim gelince doğal haydut izi uyarısı çıkar', Boolean(st.crisis.raid));
      st.crisis.raid = null;
      st.crisis.difficulty = 'huzurlu';
      st.crisis.nextRaidWarnAt = now() - 1;
      c.hourly();
      check('Huzurlu: takvim dolsa bile doğal haydut izi çıkmaz', !st.crisis.raid);
      // Çetin'de doğal yangın zamanla kesinlikle çıkar (günlük yoklama, kendi üretecinden)
      st.crisis.difficulty = 'cetin';
      for (const x of st.buildings) x.isBurning = false;
      let natural = 0;
      for (let i = 0; i < 400 && natural === 0; i++) {
        c.rollFire();
        natural = st.buildings.filter((x) => x.isBurning).length;
      }
      check('Çetin: doğal yangın yoklaması ateşli yapılarda yangın çıkarır', natural === 1);
      for (const x of st.buildings) { x.isBurning = false; x.isDamaged = false; }
      st.crisis.difficulty = 'huzurlu';
      st.crisis.nextRaidWarnAt = null;
      st.crisis.raid = null;
      c.graceUntil = graceSaved;
      st.time.day = dayKept;
    }

    // --- Sanat ---
    {
      const w = ART.getStructureSprite('well', {});
      const t = ART.getStructureSprite('guardTower', {});
      const tl = ART.getStructureSprite('guardTower', { lit: true });
      check('Su Kuyusu sprite\'ı 16x24, Gözcü Kulesi 32x56 (geceleri farklı)', w.width === 16 && w.height === 24 && t.width === 32 && t.height === 56 && t !== tl);
      check('yeni simgeler: alev, kova, kalkan, haydut, bandaj, tamir (dünya ve arayüz)', ['fire', 'bucket', 'shield', 'bandit', 'bandage', 'repair'].every((n) => { try { return UI.getIconSprite(n) && UI.getAnyIconURL(n); } catch (e) { return false; } }));
    }

    check('kriz boyunca kimse ölmedi ve nüfus eksilmedi; hiçbir yapı haritadan silinmedi', st.characters.length >= popBefore && st.buildings.length >= buildingsBefore);
    // --- Kayıt gidiş-dönüşü (sürüm 20) ---
    {
      const b = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged);
      const d = st.buildings.find((x) => x.functional && BD.DAMAGEABLE_TYPES.includes(x.type) && !x.damaged && x !== b);
      crisis().startFire(b);
      b.fireProgress = 42;
      b.fireWater = 2;
      crisis().damage(d, 'raid');
      const hurtOne = adults()[4];
      crisis().injure(hurtOne, 'raid');
      hurtOne.injuryTimer = 1000;
      st.crisis.difficulty = 'cetin';
      st.crisis.raid = null;
      crisis().warnRaid();
      const T = { b: b.id, d: d.id, hurt: hurtOne.id, raid: JSON.stringify(st.crisis.raid), fires: st.crisis.fires, repairs: st.crisis.repairs, extinguished: st.crisis.extinguished };
      game.events.emit('ui:save');
      const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
      game.events.emit('ui:load');
      const s5 = game.state;
      const b2 = s5.buildings.find((x) => x.id === T.b);
      const d2 = s5.buildings.find((x) => x.id === T.d);
      const h2 = s5.characters.find((c) => c.id === T.hurt);
      check('kayıt sürümü 32: kriz durumu, yanan / hasarlı yapı bayrakları ve yaralı sakin kayda yazılır', raw.version === 32 && raw.crisis && raw.buildings.find((x) => x.id === T.b).isBurning === true && raw.buildings.find((x) => x.id === T.d).isDamaged === true && raw.characters.find((c) => c.id === T.hurt).isInjured === true);
      check('kayıttan yanan yapı (ilerleme ve kova sayısı), hasarlı yapı ve hasar nedeni döner', b2.isBurning && b2.fireProgress === 42 && b2.fireWater === 2 && d2.isDamaged && d2.damageKind === 'raid');
      check('kayıttan yaralı sakin ve kalan iyileşme süresi döner', h2.isInjured && h2.injuryTimer === 1000);
      check('kayıttan tehlike sıklığı, bekleyen haydut baskını ve sayaçlar döner', s5.crisis.difficulty === 'cetin' && JSON.stringify(s5.crisis.raid) === T.raid && s5.crisis.fires === T.fires && s5.crisis.repairs === T.repairs && s5.crisis.extinguished === T.extinguished);
      check('yüklemeden sonra krizin kendi üreteci ve koruma süresi yeniden kurulur (aktif kriz kaydedildiyse koruma yok)', game.scenes.current.crisis.graceUntil === null);
      // Aktif kriz yokken yükleyince koruma var
      const s6s = game.scenes.current;
      for (const x of s5.buildings) { x.isBurning = false; x.isDamaged = false; }
      s5.crisis.raid = null;
      game.events.emit('ui:save');
      game.events.emit('ui:load');
      check('aktif kriz yokken yüklenince ilk 24 oyun saatinde doğal kriz korumasında', game.scenes.current.crisis.graceUntil === game.state.totalMinutes + 1440);
      // Eski (v19) kayıt: kriz yok
      game.events.emit('ui:save');
      const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
      old.version = 19;
      delete old.crisis;
      for (const x of old.buildings) for (const k of ['isBurning', 'isDamaged', 'fireProgress', 'fireWater', 'damageKind', 'damagedAt']) delete x[k];
      for (const c of old.characters) { delete c.isInjured; delete c.injuryTimer; }
      localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
      game.events.emit('ui:load');
      const s7 = game.state;
      check('v19 kaydı yüklenince hiçbir yapı yanmıyor / hasarlı değil, kimse yaralı değil, kriz boş ve Dengeli', s7.buildings.every((x) => !x.isBurning && !x.isDamaged) && s7.characters.every((c) => !c.isInjured) && s7.crisis.difficulty === 'dengeli' && !s7.crisis.raid && s7.crisis.fires === 0);
      check('v19 kaydı yüklenince ilk 24 saatte kriz çıkmaz', game.scenes.current.crisis.graceUntil === s7.totalMinutes + 1440);
    }
  }

  // ===== 24. aşama (24.1): tarımsal çeşitlilik, bahçenin ekim tercihi, Keten ve Şerbetçiotu, Ürün Silosu, mahsul bozulması =====
  {
    const S = () => game.scenes.current;
    const st = game.state;
    const CR = await import('/src/data/crops.js');
    const GR = await import('/src/systems/Granary.js');
    const BD = await import('/src/data/buildings.js');
    const RS = await import('/src/data/resources.js');
    const TS = await import('/src/systems/TownStatus.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    // Testi doğal krizler, dilekçe ve fermanlar bozmasın
    st.crisis.difficulty = 'huzurlu';
    st.crisis.raid = null;
    st.crisis.nextRaidWarnAt = null;
    st.petitions.list = [];
    st.petitions.nextAt = st.totalMinutes + 1e6;
    st.crown.decree = null;
    st.crown.nextDecreeAt = st.totalMinutes + 1e6;
    st.crown.nextLevyAt = st.totalMinutes + 1e6;
    const placeAt = (type, x, y) => {
      const res = S().construction.placeSite(type, x, y);
      if (!res.ok) return null;
      const job = S().jobs.jobs.find((j) => j.buildingId === res.building.id);
      if (job) S().jobs.cancel(job);
      S().construction.complete(res.building);
      return res.building;
    };
    const events = [];
    const offs = ['crop:changed', 'goods:firstProduced', 'granary:spoiled', 'toast'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    const recalc = () => S().economy.recalculateCapacity();

    // --- Veri ---
    check('üç mahsul: Buğday / Sebze (varsayılan, yiyecek), Keten, Meyve / Şerbetçiotu', CR.CROP_KEYS.join(',') === 'grain,flax,hops' && CR.DEFAULT_CROP === 'grain' && CR.CROPS.grain.resource === 'food' && CR.CROPS.flax.resource === 'flax' && CR.CROPS.hops.resource === 'hops');
    check('Sebze Bahçesi üç mahsulü seçebilir; öteki üretim yapıları seçemez', BD.BUILDINGS.garden.crops.join(',') === 'grain,flax,hops' && GR.canChooseCrop('garden') && !GR.canChooseCrop('lumberHut') && !GR.canChooseCrop('sheepFarm'));
    check('Buğday verimi bahçenin eski verimiyle aynı (saatte 5 yiyecek)', CR.CROPS.grain.perHour === BD.BUILDINGS.garden.production.perHour && BD.BUILDINGS.garden.production.resource === 'food');
    check('Keten ve Şerbetçiotu yeni mal kalemleri (Mallar listesinde, gıda değil)', RS.GOODS_KEYS.includes('flax') && RS.GOODS_KEYS.includes('hops') && !RS.RESOURCES.flax.foodValue && !RS.RESOURCES.hops.foodValue && !RS.FOOD_KEYS.includes('flax') && RS.STARTING_RESOURCES.flax === 0 && RS.STARTING_RESOURCES.hops === 0);
    check('tarımsal kaynaklar: yiyecek, ekmek, keten, şerbetçiotu', CR.AGRI_KEYS.join(',') === 'food,bread,flax,hops' && GR.isAgricultural('bread') && !GR.isAgricultural('wood') && !GR.isAgricultural('wool'));
    const siloDef = BD.BUILDINGS.silo;
    check('Ürün Silosu: 2x2, Depolama, Köy seviyesinde, odun ve taş maliyetli, +150 tarımsal kapasite', siloDef && siloDef.size.w === 2 && siloDef.size.h === 2 && siloDef.category === 'Depolama' && siloDef.requiresTier === 2 && Object.keys(siloDef.cost).sort().join(',') === 'stone,wood' && siloDef.granary.capacity === 150 && siloDef.buildable && siloDef.demolishable);
    check('Ürün Silosu Yapılar sekmesinde, Kiler\'in hemen ardından', BD.BUILD_MENU.indexOf('silo') === BD.BUILD_MENU.indexOf('storage') + 1 && BD.buildTabFor('silo') === 'buildings');

    // --- Seviye kilidi ---
    sim.give({ wood: 600, stone: 600, food: 120, bread: 0, flax: 0, hops: 0 });
    const tierWas = st.town.tier;
    st.town.tier = Math.max(2, tierWas);
    const spot = sim.findSpot('silo');
    st.town.tier = 1;
    const locked = spot ? S().construction.checkPlacement('silo', spot.x, spot.y) : { ok: true };
    st.town.tier = 2;
    const open = spot ? S().construction.checkPlacement('silo', spot.x, spot.y) : { ok: false };
    check('Ürün Silosu Mezra\'da kilitli, Köy seviyesinde kurulabilir', spot && !locked.ok && open.ok, locked.reason);
    st.town.tier = Math.max(2, tierWas);

    // --- Bahçe ve ekim tercihi ---
    for (const b of st.buildings.filter((x) => x.type === 'silo')) S().construction.demolish?.(b);
    const garden = sim.place('garden');
    check('yeni bahçe Buğday / Sebze ekili başlar ve yiyecek üretir', garden && garden.crop === 'grain' && GR.productionOf(garden).resource === 'food' && GR.productionOf(garden).perHour === 5);
    const switchesBefore = st.granary.switches;
    events.length = 0;
    garden.productionBuffer = 0.7;
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    check('ekim tercihi Keten\'e geçer: ürün keten, saatte 3', garden.crop === 'flax' && GR.productionOf(garden).resource === 'flax' && GR.productionOf(garden).perHour === 3);
    check('mahsul değişince olay, bildirim ve sayaç; yarım kalan hasat sıfırlanır', events.some((e) => e.n === 'crop:changed' && e.p.crop === 'flax' && e.p.from === 'grain') && events.some((e) => e.n === 'toast' && /Keten/.test(e.p.text)) && st.granary.switches === switchesBefore + 1 && garden.productionBuffer === 0);
    events.length = 0;
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'wheat' });
    const lumber = st.buildings.find((b) => b.type === 'lumberHut');
    if (lumber) game.events.emit('ui:setCrop', { buildingId: lumber.id, crop: 'flax' });
    check('aynı mahsul, geçersiz mahsul ve bahçe olmayan yapı reddedilir', garden.crop === 'flax' && !events.some((e) => e.n === 'crop:changed') && (!lumber || lumber.crop === null));
    const cycle = [];
    for (const c of ['hops', 'grain', 'flax', 'hops']) {
      game.events.emit('ui:setCrop', { buildingId: garden.id, crop: c });
      cycle.push(`${garden.crop}:${GR.productionOf(garden).resource}`);
    }
    check('mahsul değiştirme döngüsü (Şerbetçiotu → Buğday → Keten → Şerbetçiotu) üretimi her seferinde izler', cycle.join(',') === 'hops:hops,grain:food,flax:flax,hops:hops', cycle.join(','));
    check('Buğday dışı mahsulde bahçe tanımı değişmez (yalnızca yapıya özgü üretim)', BD.BUILDINGS.garden.production.resource === 'food' && GR.productionOf(garden) !== BD.BUILDINGS.garden.production);

    // --- Hasat (gerçek BehaviorSystem.performWork) ---
    const worker = st.characters.find((c) => !c.isChild && !c.role);
    const work = (b, minutes) => {
      for (let i = 0; i < minutes; i++) S().behavior.performWork(worker, { workBuildingId: b.id, activity: 'farm' }, 1);
    };
    st.time.day = 6; // yaz (mevsim verimi 1'in üstünde)
    S().structures.update({ hour: 10, gameMinutes: 0 });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    sim.give({ food: 50, flax: 0, hops: 0 });
    st.stats.goods.flax = 0;
    events.length = 0;
    garden.producedToday = 0;
    const foodBefore = st.resources.food;
    work(garden, 120);
    check('Keten hasadı: bahçıvan çalıştıkça keten birikir, bahçeden yiyecek gelmez', st.resources.flax > 0 && st.resources.food === foodBefore && garden.producedToday === st.resources.flax, `keten ${st.resources.flax}, yiyecek ${foodBefore}->${st.resources.food}`);
    check('ilk keten: ilk mal olayı ve Kasaba Günlüğü\'ne not', events.some((e) => e.n === 'goods:firstProduced' && e.p.resource === 'flax') && st.journal.some((j) => /keten/.test(j.text)) && st.stats.goods.flax === st.resources.flax);
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'hops' });
    st.stats.goods.hops = 0;
    work(garden, 120);
    check('Şerbetçiotu hasadı: şerbetçiotu birikir, keten artmaz', st.resources.hops > 0 && st.stats.goods.hops === st.resources.hops && st.journal.some((j) => /şerbetçiotu/.test(j.text)));
    const flaxPer = (() => {
      game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'grain' });
      const f0 = st.resources.food;
      work(garden, 120);
      return st.resources.food - f0;
    })();
    check('Buğday\'a dönünce yine yiyecek gelir (verim keten / şerbetçiotundan yüksek)', flaxPer > st.resources.hops, `buğday +${flaxPer}, şerbetçiotu ${st.resources.hops}`);
    check('Keten ve Şerbetçiotu gıda sayılmaz (göç koşulu / toplam besin)', (() => { const a = TS.foodSupply(st); sim.give({ flax: 90, hops: 90 }); const b = TS.foodSupply(st); return a === b; })());
    // Bahçıvanın etkinlik metni
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    const lbl = S().behavior.performLabel(worker, { activity: 'farm', buildingId: garden.id }, { label: 'Bahçeyi çapalıyor' });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'grain' });
    const lbl2 = S().behavior.performLabel(worker, { activity: 'farm', buildingId: garden.id }, { label: 'Bahçeyi çapalıyor' });
    check('bahçıvanın etkinlik metni mahsule göre (Buğday\'da eski metin)', /keten/i.test(lbl) && lbl2 === 'Bahçeyi çapalıyor', `${lbl} / ${lbl2}`);
    // Zanaat ve mevsim: kışın keten de donar
    st.time.day = 14;
    S().structures.update({ hour: 10, gameMinutes: 0 });
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    check('kışın keten tarlası da donar (mevsim çarpanı her mahsule uygulanır)', garden.upgraded || garden.frozen);
    st.time.day = 6;
    S().structures.update({ hour: 10, gameMinutes: 0 });

    // --- HUD: Mallar listesi ---
    game.render(0);
    const hud = game.ui.components.find((x) => x.renderWelfare);
    check('üst çubuktaki Mallar listesinde Keten ve Şerbetçiotu kalemleri', hud.resources.flax && hud.resources.hops && hud.goodsMenu.contains(hud.resources.flax.box) && hud.goodsMenu.contains(hud.resources.hops.box));
    hud.renderGoodsDetail(st);
    check('Mallar ipucu keteni üreten bahçeyi sayar', /1 yapı/.test(hud.resources.flax.box.title) && /Keten/.test(hud.resources.flax.box.title), hud.resources.flax.box.title.split('\n')[0]);
    check('Keten ve Şerbetçiotu simgeleri (arayüz ve sırtta taşıma demeti)', ['flax', 'hops'].every((n) => UI.getIconDataURL(n) && UI.getCarrySprite(n)));

    // --- Ürün Silosu: kapasite ---
    recalc();
    const base = st.storageCapacity;
    check('silo yokken tarımsal sınır genel kapasiteyle aynı', st.granaryCapacity === 0 && GR.storageLimit(st, 'food') === base && GR.storageLimit(st, 'flax') === base && GR.storageLimit(st, 'gold') === Infinity);
    const silo = sim.place('silo');
    recalc();
    check('Ürün Silosu kurulunca yiyecek, ekmek, keten ve şerbetçiotu sınırı +150', silo && st.granaryCapacity === 150 && ['food', 'bread', 'flax', 'hops'].every((r) => GR.storageLimit(st, r) === base + 150));
    check('silo odun, taş, yün ve demirin sınırını değiştirmez; genel kapasite aynı', st.storageCapacity === base && ['wood', 'stone', 'wool', 'iron'].every((r) => GR.storageLimit(st, r) === base));
    sim.give({ food: base, wood: base, flax: base });
    const addedFood = S().economy.add('food', 400);
    const addedWood = S().economy.add('wood', 50);
    const addedFlax = S().economy.add('flax', 400);
    check('depoya giriş: yiyecek ve keten 150 fazla sığar, odun sığmaz', addedFood === 150 && addedWood === 0 && addedFlax === 150 && st.resources.food === base + 150);
    const silo2 = sim.place('silo');
    recalc();
    check('iki silo +300', silo2 && st.granaryCapacity === 300 && GR.storageLimit(st, 'hops') === base + 300);
    // Değirmen: ekmek deposu dolu sayılmaz
    sim.give({ bread: base + 10 });
    const mill = st.buildings.find((b) => b.type === 'mill' && b.functional) ?? sim.place('mill');
    if (mill) {
      S().structures.updateProcessing(mill, BD.BUILDINGS.mill.processing);
      check('ekmek genel kapasiteyi aşsa da siloda yer varsa fırın çalışır', !/dolu/.test(mill.processStatus ?? ''), mill.processStatus);
    }
    // Panel
    const panel = game.ui.components.find((x) => x.renderCrafting);
    const show = (b) => {
      panel.buildingId = b.id;
      panel.element.hidden = false;
      panel.lastKey = '';
      panel.render(game);
    };
    show(silo);
    check('Silo panelinde tarımsal depo katkısı ve stok sınırları', panel.lines.textContent.includes('Tarımsal depo katkısı: +150') && panel.lines.textContent.includes(`Yiyecek ${st.resources.food}/${base + 300}`) && /çürümez/.test(panel.lines.textContent));
    show(garden);
    const btns = [...panel.cropBox.querySelectorAll('button')];
    check('bahçe panelinde Ekim Tercihi: üç düğme, seçili olan vurgulu', !panel.cropBox.hidden && /Ekim Tercihi/.test(panel.cropBox.textContent) && btns.length === 3 && btns.filter((b) => b.classList.contains('is-active')).map((b) => b.dataset.crop).join() === garden.crop);
    btns.find((b) => b.dataset.crop === 'hops').click();
    panel.render(game);
    check('düğmeye tıklayınca mahsul değişir ve panel yenilenir', garden.crop === 'hops' && panel.cropBox.querySelector('.is-active').dataset.crop === 'hops' && /Şerbetçiotu/.test(panel.cropBox.textContent));
    check('silo varken panel bozulmanın önlendiğini söyler', /bozulmaz/.test(panel.cropBox.textContent));
    show(lumber ?? silo);
    check('bahçe olmayan yapıda Ekim Tercihi gizli', panel.cropBox.hidden);
    panel.buildingId = null;
    panel.element.hidden = true;

    // --- Bozulma (yağmur / kış, silosuz) ---
    const G = S().granary;
    const removeSilos = () => {
      for (const b of st.buildings.filter((x) => x.type === 'silo')) {
        b.underConstruction = true; // işlemez hale getir (yıkımdan bağımsız)
      }
      recalc();
    };
    const restoreSilos = () => {
      for (const b of st.buildings.filter((x) => x.type === 'silo')) b.underConstruction = false;
      recalc();
    };
    const setWeather = (type) => {
      st.weather.type = type;
      st.weather.rain = type === 'rainy' ? 1 : 0;
    };
    removeSilos();
    st.granary.spoiled = {};
    st.granary.buffers = {};
    st.time.day = 6;
    setWeather('sunny');
    sim.give({ food: 180, flax: 180, hops: 180, bread: 80 });
    G.spoil(10);
    check('kuru yaz havasında mahsul bozulmaz', st.resources.food === 180 && st.resources.flax === 180);
    setWeather('rainy');
    const rainy = G.spoilWeather();
    const lost = G.spoil(10);
    check('silosuz kasabada yağmurda güvenli stoğun (80) üstündeki ham mahsul bozulur', rainy && lost.food === 4 && lost.flax === 4 && lost.hops === 4 && st.resources.food === 176, JSON.stringify(lost));
    check('ekmek bozulmaz; bozulan miktar sayaçta, bildirim bir kez', st.resources.bread === 80 && st.granary.spoiled.food === 4 && events.filter((e) => e.n === 'toast' && /Nem ve soğuk/.test(e.p.text)).length === 1, `ekmek ${st.resources.bread}, sayaç ${JSON.stringify(st.granary.spoiled)}, bildirim ${events.filter((e) => e.n === 'toast').map((e) => e.p.text).join(' | ')}`);
    events.length = 0;
    G.spoil(1);
    check('aynı gün ikinci bozulmada yeni bildirim yok; küsurat birikir', !events.some((e) => e.n === 'toast') && st.granary.buffers.food > 0 && st.granary.buffers.food < 1);
    setWeather('sunny');
    st.time.day = 14; // kış
    sim.give({ food: 60, flax: 200 });
    const w = G.spoil(10);
    check('kışın da bozulur; güvenli stok altındaki yiyecek korunur', !w.food && w.flax > 0 && st.resources.food === 60);
    // Gerçek saat olayı
    sim.give({ flax: 200 });
    const f0 = st.resources.flax;
    for (let i = 0; i < 5; i++) game.events.emit('time:hour', 10);
    check('saat başı (time:hour) bozulma işler', st.resources.flax < f0 && st.resources.flax >= f0 - 5, `${f0}->${st.resources.flax}`);
    restoreSilos();
    sim.give({ food: 300, flax: 300, hops: 300 });
    setWeather('rainy');
    const safe = G.spoil(24);
    check('Ürün Silosu varken yağmurda ve kışın hiçbir mahsul bozulmaz', Object.keys(safe).length === 0 && st.resources.food === 300 && st.resources.flax === 300 && GR.spoilageAt(st, 'food', 24) === 0);
    setWeather('sunny');
    st.time.day = 6;

    // --- Görseller ---
    const sprites = ['grain', 'flax', 'hops'].map((c) => ART.getStructureSprite('garden', { season: 'summer', crop: c }));
    const reader = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const pixels = (cv) => {
      reader.canvas.width = cv.width;
      reader.canvas.height = cv.height;
      reader.clearRect(0, 0, cv.width, cv.height);
      reader.drawImage(cv, 0, 0);
      return reader.getImageData(0, 0, cv.width, cv.height).data;
    };
    const px = (cv) => { const d = pixels(cv); let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) | 0; return h; };
    check('üç mahsulün tarla dokusu farklı (48x48)', sprites.every((sp) => sp.width === 48 && sp.height === 48) && new Set(sprites.map(px)).size === 3);
    const goldPixels = (cv) => { const d = pixels(cv); let n = 0, blue = 0, purple = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 230 && d[i + 1] > 190 && d[i + 2] < 110) n++; if (d[i] < 120 && d[i + 1] > 150 && d[i + 2] > 200) blue++; if (d[i] > 120 && d[i + 1] < 80 && d[i + 2] > 100) purple++; } return { n, blue, purple }; };
    const [gp, fp, hp] = sprites.map(goldPixels);
    check('Buğday altın sarısı, Keten açık mavi çiçekli, Şerbetçiotu mor salkımlı', gp.n > 40 && fp.blue > 20 && hp.purple > 10 && fp.n < gp.n, JSON.stringify([gp, fp, hp]));
    check('mahsul tarlası her mevsim çizilir; kışın karla örtülür', ['grain', 'flax', 'hops'].every((c) => ['spring', 'summer', 'autumn', 'winter'].every((s2) => ART.getStructureSprite('garden', { season: s2, crop: c }).width === 48)));
    const siloSprite = ART.getStructureSprite('silo', {});
    check('Ürün Silosu görseli 32x48; kışın çatısı karlanır', siloSprite.width === 32 && siloSprite.height === 48 && ART.getStructureSprite('silo', { season: 'winter' }) !== siloSprite);
    check('yapının görseli seçili mahsulü kullanır', garden.currentSprite({ season: 'summer', time: 0 }) === ART.getStructureSprite('garden', { season: 'summer', crop: garden.crop }));

    // --- Kayıt gidiş-dönüşü (sürüm 21) ---
    game.events.emit('ui:setCrop', { buildingId: garden.id, crop: 'flax' });
    const other = sim.place('garden');
    game.events.emit('ui:setCrop', { buildingId: other.id, crop: 'hops' });
    sim.give({ flax: 77, hops: 33 });
    st.granary.spoiled = { food: 12, flax: 5 };
    st.granary.buffers = { hops: 0.25 };
    const T = { g: garden.id, o: other.id, switches: st.granary.switches };
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: bahçelerin mahsulü, Keten / Şerbetçiotu stoğu ve silo sayaçları kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && raw.buildings.find((b) => b.id === T.g).crop === 'flax' && raw.buildings.find((b) => b.id === T.o).crop === 'hops' && raw.resources.flax === 77 && raw.resources.hops === 33 && raw.granary.spoiled.food === 12);
    game.events.emit('ui:load');
    const s2 = game.state;
    const g2 = s2.buildings.find((b) => b.id === T.g);
    const o2 = s2.buildings.find((b) => b.id === T.o);
    check('kayıttan bahçelerin mahsulü ve üretimi döner', g2.crop === 'flax' && o2.crop === 'hops' && GR.productionOf(g2).resource === 'flax' && GR.productionOf(o2).resource === 'hops');
    check('kayıttan Keten / Şerbetçiotu stoğu, bozulma sayaçları, küsurat ve değişiklik sayısı döner', s2.resources.flax === 77 && s2.resources.hops === 33 && s2.granary.spoiled.food === 12 && s2.granary.spoiled.flax === 5 && s2.granary.buffers.hops === 0.25 && s2.granary.switches === T.switches);
    check('yüklemeden sonra silo kapasitesi yeniden hesaplanır', s2.granaryCapacity === 300 && GR.storageLimit(s2, 'food') === s2.storageCapacity + 300);
    check('yüklenen kasabada ekim tercihi değiştirilebilir', (() => { game.events.emit('ui:setCrop', { buildingId: g2.id, crop: 'grain' }); return g2.crop === 'grain'; })());
    // Bozuk mahsul değeri
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.buildings.find((b) => b.id === T.o).crop = 'tütün';
    bad.granary = { spoiled: { food: -5, gold: 9 }, buffers: { food: 7 }, switches: 'x' };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('geçersiz mahsul Buğday\'a, bozuk silo sayaçları boşa döner', game.state.buildings.find((b) => b.id === T.o).crop === 'grain' && !game.state.granary.spoiled.food && !game.state.granary.spoiled.gold && !game.state.granary.buffers.food && game.state.granary.switches === 0);
    // Eski (v20) kayıt: mahsul, keten / şerbetçiotu ve silo yok
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 20;
    delete old.granary;
    delete old.resources.flax;
    delete old.resources.hops;
    old.buildings = old.buildings.filter((b) => b.type !== 'silo');
    for (const b of old.buildings) delete b.crop;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const s3 = game.state;
    check('v20 kaydı yüklenince bütün bahçeler Buğday / Sebze ekili, yiyecek üretir', s3.buildings.filter((b) => b.type === 'garden').length >= 2 && s3.buildings.filter((b) => b.type === 'garden').every((b) => b.crop === 'grain' && GR.productionOf(b).resource === 'food'));
    check('v20 kaydında Keten / Şerbetçiotu 0, silo kapasitesi 0, silo sayaçları boş', s3.resources.flax === 0 && s3.resources.hops === 0 && s3.granaryCapacity === 0 && Object.keys(s3.granary.spoiled).length === 0 && s3.granary.switches === 0);
    check('v20 kaydında bahçe dışı yapıların mahsulü yok', s3.buildings.filter((b) => b.type !== 'garden').every((b) => b.crop === null));
    offs.forEach((off) => off());
  }

  // ===== 24. aşama (24.2): Dokuma Tezgâhı ve Kumaş, Şerbethane ve Fıçı Şerbeti, han tüketimi, Dayanıklı Giysi, lüks iş önceliği =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const BD = await import('/src/data/buildings.js');
    const RS = await import('/src/data/resources.js');
    const RF = await import('/src/data/refinery.js');
    const RX = await import('/src/systems/Refinery.js');
    const EQ = await import('/src/systems/Equipment.js');
    const TS = await import('/src/systems/TownStatus.js');
    const CZ = await import('/src/systems/Citizens.js');
    const ACT = (await import('/src/data/activities.js')).ACTIVITIES;
    const SK = await import('/src/data/skills.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    s0.crown.decree = null;
    s0.crown.nextDecreeAt = s0.totalMinutes + 1e6;
    s0.crown.nextLevyAt = s0.totalMinutes + 1e6;
    const events = [];
    const offs = ['goods:firstProduced', 'citizen:sherbet', 'citizen:bought', 'processing:made'].map((n) => game.events.on(n, (p) => events.push({ n, p })));

    // --- Veri ---
    check('Kumaş ve Fıçı Şerbeti yeni mal kalemleri (Mallar listesinde, gıda değil, başlangıçta 0)', ['cloth', 'sherbet'].every((k) => RS.GOODS_KEYS.includes(k) && !RS.RESOURCES[k].foodValue && RS.STARTING_RESOURCES[k] === 0));
    const loomDef = BD.BUILDINGS.loom;
    const brewDef = BD.BUILDINGS.brewery;
    check('Dokuma Tezgâhı: 2x2, Kasaba seviyesi, odun + taş + demir, 1 dokumacı, 2 keten -> 1 kumaş, lüks iş', loomDef.size.w === 2 && loomDef.size.h === 2 && loomDef.requiresTier === 3 && loomDef.cost.wood > 0 && loomDef.cost.stone > 0 && loomDef.cost.iron > 0 && loomDef.workers === 1 && loomDef.workActivity === 'weave' && loomDef.processing.input.flax === 2 && loomDef.processing.output.cloth === 1 && loomDef.luxury === true);
    check('Şerbethane: 2x2, Kasaba seviyesi, taş + kereste, 1 mahzen ustası, 2 şerbetçiotu -> 1 fıçı, lüks iş', brewDef.size.w === 2 && brewDef.size.h === 2 && brewDef.requiresTier === 3 && Object.keys(brewDef.cost).sort().join() === 'stone,wood' && brewDef.workers === 1 && brewDef.workActivity === 'brewSherbet' && brewDef.processing.input.hops === 2 && brewDef.processing.output.sherbet === 1 && brewDef.luxury === true);
    check('iki yapı Yapılar sekmesinde, Kasaba Hanı\'nın ardından', BD.BUILD_MENU.indexOf('loom') === BD.BUILD_MENU.indexOf('inn') + 1 && BD.BUILD_MENU.indexOf('brewery') === BD.BUILD_MENU.indexOf('loom') + 1 && BD.buildTabFor('loom') === 'buildings');
    check('dokumacı zanaatkârlık, mahzen ustası aşçılık deneyimi kazanır; etkinlik metinleri ve aletleri var', SK.ACTIVITY_SKILLS.weave === 'crafting' && SK.ACTIVITY_SKILLS.brewSherbet === 'cooking' && ACT.weave.tool === 'shuttle' && ACT.brewSherbet.tool === 'ladle' && ACT.weave.idleLabel && ACT.brewSherbet.idleLabel);
    check('çanta eşyaları: Dayanıklı Giysi ve Şerbet Testisi', (await import('/src/data/citizens.js')).ITEMS.garment && (await import('/src/data/citizens.js')).ITEMS.sherbetJug.fun === 15);

    // --- Seviye kilidi ---
    sim.give({ wood: 800, stone: 800, iron: 200, food: 300, bread: 60, flax: 0, hops: 0, cloth: 0, sherbet: 0 });
    s0.town.tier = 3;
    const spot = sim.findSpot('loom');
    s0.town.tier = 2;
    const lockedLoom = spot ? S().construction.checkPlacement('loom', spot.x, spot.y) : { ok: true };
    const lockedBrew = spot ? S().construction.checkPlacement('brewery', spot.x, spot.y) : { ok: true };
    s0.town.tier = 3;
    check('Dokuma Tezgâhı ve Şerbethane Köy\'de kilitli, Kasaba seviyesinde kurulabilir', spot && !lockedLoom.ok && !lockedBrew.ok && /Kasaba/.test(lockedLoom.reason) && S().construction.checkPlacement('loom', spot.x, spot.y).ok, lockedLoom.reason);
    s0.town.tier = 4;

    // --- Girdi / çıktı oranları (gerçek performWork) ---
    const loom = sim.place('loom');
    const brewery = sim.place('brewery');
    const worker = s0.characters.find((c) => !c.isChild && !c.role);
    const work = (b, activity, minutes) => {
      for (let i = 0; i < minutes; i++) S().behavior.performWork(worker, { workBuildingId: b.id, activity }, 1);
    };
    const refresh = () => S().structures.update({ hour: 10, gameMinutes: 0 });
    check('iki yapı kuruldu ve iş yuvası var', loom && brewery && loom.workerSlots === 1 && brewery.workerSlots === 1);
    sim.give({ flax: 0, cloth: 0 });
    refresh();
    check('kilerde keten yokken tezgâh boşta, panelde nedeni', loom.idle && /Keten bekleniyor/.test(loom.processStatus) && /Keten/.test(loom.processStatus), loom.processStatus);
    sim.give({ flax: 40, cloth: 0, food: 300 });
    s0.stats.goods.cloth = 0;
    events.length = 0;
    refresh();
    check('keten gelince tezgâh hazır', !loom.idle && loom.processStatus === null);
    loom.producedToday = 0;
    work(loom, 'weave', 180);
    const woven = s0.resources.cloth;
    check('dokuma: her top kumaş tam 2 keten harcar', woven > 0 && 40 - s0.resources.flax === woven * 2 && loom.producedToday === woven, `kumaş ${woven}, keten ${s0.resources.flax}`);
    check('ilk kumaş: ilk mal olayı, günlük notu ve toplam sayaç', events.some((e) => e.n === 'goods:firstProduced' && e.p.resource === 'cloth') && s0.journal.some((j) => /kumaş/.test(j.text)) && s0.stats.goods.cloth === woven);
    sim.give({ flax: 1 });
    work(loom, 'weave', 120);
    check('tek keten kalınca dokuma durur (yarım top yok)', s0.resources.flax === 1 && s0.resources.cloth === woven);
    sim.give({ hops: 30, sherbet: 0 });
    s0.stats.goods.sherbet = 0;
    refresh();
    work(brewery, 'brewSherbet', 180);
    check('şerbethane: her fıçı tam 2 şerbetçiotu harcar', s0.resources.sherbet > 0 && 30 - s0.resources.hops === s0.resources.sherbet * 2 && s0.stats.goods.sherbet === s0.resources.sherbet, `fıçı ${s0.resources.sherbet}, şerbetçiotu ${s0.resources.hops}`);
    sim.give({ flax: 40, cloth: S().economy.limit('cloth') });
    refresh();
    check('kumaş deposu doluysa tezgâh boşta', loom.idle && /dolu/.test(loom.processStatus), loom.processStatus);
    sim.give({ cloth: 0 });
    // Kasaba açken lüks işler durur
    const pop = s0.characters.length;
    sim.give({ food: Math.floor(pop * 2), bread: 0, hops: 10 });
    s0.pantry.credit = 0;
    refresh();
    check('kasaba açken (kişi başı besin 3\'ün altında) tezgâh ve mahzen boşta', RX.luxuryHungry(s0) && loom.idle && brewery.idle && /besin azaldı/.test(loom.processStatus));
    sim.give({ food: 300, hops: 10, flax: 10 });
    refresh();
    check('besin gelince lüks işler yeniden açılır', !RX.luxuryHungry(s0) && !loom.idle && !brewery.idle);
    check('boşta tezgâhta dokumacının etkinlik metni', (() => { loom.idle = true; const l = S().behavior.performLabel(worker, { activity: 'weave', buildingId: loom.id }, ACT.weave); loom.idle = false; return /keten bekliyor/.test(l); })());

    // --- İş gücü önceliği ---
    {
      const J = S().jobs;
      const savedJobs = J.jobs;
      J.jobs = [];
      const idler = s0.characters.find((c) => !c.isChild && !c.role && c.workplaceId == null && !c.away && !building_has(c));
      function building_has(c) { return s0.buildings.some((b) => b.workerIds.has(c.id)); }
      const origin = { x: idler.tileX, y: idler.tileY };
      const first = J.findWorkFor(idler, origin);
      // Bütün temel iş yerlerini dolu / boşta say: geriye yalnızca lüks işler kalsın
      const basics = s0.buildings.filter((b) => b.functional && b.workerSlots && !b.definition.luxury);
      const saved = basics.map((b) => b.idle);
      for (const b of basics) b.idle = true;
      const second = J.findWorkFor(idler, origin);
      basics.forEach((b, i) => (b.idle = saved[i]));
      J.jobs = savedJobs;
      check('iş seçiminde temel üretim yerleri (bahçe, fırın, ...) lüks işlerden önce gelir', first && first.building && !first.building.definition.luxury, first?.building?.type);
      check('temel yuvalar dolunca boştaki sakin dokuma tezgâhına / mahzene geçer (ticaret fazlası)', second && second.building && second.building.definition.luxury, second?.building?.type);
    }

    // --- Gerçek vardiya: sabitlenen dokumacı mesaide gelir, dokur ve yevmiye alır ---
    {
      st().time.day = 6;
      st().time.hour = 8;
      st().time.minute = 0;
      sim.give({ flax: 60, cloth: 0, food: 300 });
      const weaver = s0.characters.find((c) => !c.isChild && !c.role && !c.away && !c.illness && !c.isInjured && c.id !== worker.id);
      game.events.emit('ui:pinWorker', { buildingId: loom.id, characterId: weaver.id });
      const coins0 = weaver.coins;
      const wages0 = s0.stats.wagesPaid ?? 0; // (28.1) kesedeki net değişim harcama / vergiyle karışır: ödenen yevmiye sayacına bakılır
      const xp0 = weaver.skills?.crafting ?? 0;
      let sawWeave = false;
      for (let h = 0; h < 10; h++) {
        hours(1);
        if (weaver.task?.activity === 'weave' && weaver.task.phase === 'perform') sawWeave = true;
      }
      check('sabitlenen dokumacı mesaide tezgâhta çalışır (weave) ve kumaş dokur', weaver.workplaceId === loom.id && sawWeave && s0.resources.cloth > 0, `kumaş ${s0.resources.cloth}`);
      check('dokumacının vardiyası yevmiye ve zanaatkârlık deneyimi kazandırır', (s0.stats.wagesPaid ?? 0) > wages0 && (weaver.skills?.crafting ?? 0) > xp0, `${coins0}->${weaver.coins} vergi ${s0.tax.rate} tahsilat ${s0.tax.collections} xp ${xp0}->${weaver.skills?.crafting ?? 0} gün ${s0.time.day}`);
      game.events.emit('ui:unpinWorker', { buildingId: loom.id, characterId: weaver.id });
    }

    // --- Han: fıçı ikmali, şerbet, iki kat dolum, Keyifli Damak, testi ---
    const inn = s0.buildings.find((b) => b.type === 'inn' && b.functional) ?? sim.place('inn');
    const R = S().refinery;
    inn.sherbet = 0;
    sim.give({ sherbet: 30 });
    const moved = R.restock();
    check('saat başı kasaba deposundan hana en çok 2 fıçı taşınır', moved >= 2 && inn.sherbet === 2 && s0.resources.sherbet === 30 - moved);
    for (let i = 0; i < 10; i++) R.restock();
    check('handa en çok 12 fıçı durur', inn.sherbet === 12);
    const guest = s0.characters.find((c) => !c.isChild && !c.role && !c.away && c.id !== worker.id);
    guest.needs.fun = 40;
    guest.coins = 30;
    guest.inventory = [];
    delete guest.buffs.merryPalate;
    const served0 = s0.stats.sherbetServed ?? 0;
    const task = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    events.length = 0;
    const ok = R.serve(guest, task, inn);
    check('handa sohbete oturan sakin fıçı şerbeti içer: +15 keyif', ok && task.sherbet === true && guest.needs.fun === 55 && s0.stats.sherbetServed === served0 + 1 && events.some((e) => e.n === 'citizen:sherbet'));
    const until = guest.buffs.merryPalate;
    const nextNoon = (Math.floor(s0.totalMinutes / 1440) + 1) * 1440 + 12 * 60;
    check('Keyifli Damak: ertesi gün 12:00\'ye kadar sürer', until === nextNoon && RX.hasPalate(guest, s0.totalMinutes) && !RX.hasPalate(guest, nextNoon));
    check('kesesi yeten sakin çantasına bir Şerbet Testisi alır (5 altın, handan 1 fıçı)', CZ.countItem(guest, 'sherbetJug') === 1 && guest.coins === 25 && inn.sherbet === 10 && events.some((e) => e.n === 'citizen:bought' && e.p.kind === 'sherbetJug'));
    const t2 = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    R.serve(guest, t2, inn);
    check('testisi olan ikinci testiyi almaz', CZ.countItem(guest, 'sherbetJug') === 1 && inn.sherbet === 9);
    inn.sherbet = 0;
    const t3 = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0 };
    check('handa fıçı yoksa şerbet yok', !R.serve(guest, t3, inn) && !t3.sherbet);
    // İki kat sosyallik ve keyif (gerçek BehaviorSystem.perform)
    {
      const B = S().behavior;
      const a = ACT.inn;
      const run = (withSherbet) => {
        inn.sherbet = withSherbet ? 5 : 0;
        guest.needs.social = 20;
        guest.needs.fun = 20;
        const tk = { activity: 'inn', phase: 'perform', buildingId: inn.id, elapsed: 0, duration: 1e6 };
        guest.task = tk;
        B.perform(guest, tk, a, { gameMinutes: 1, hour: 19 });
        const f1 = guest.needs.fun;
        const s1 = guest.needs.social;
        B.perform(guest, tk, a, { gameMinutes: 10, hour: 19 });
        return { social: guest.needs.social - s1, fun: guest.needs.fun - f1, sherbet: tk.sherbet, jumped: f1 - 20 };
      };
      const plain = run(false);
      const merry = run(true);
      check('handa şerbet içen sakinin sosyallik barı iki kat hızlı dolar', merry.sherbet && !plain.sherbet && plain.social > 0 && Math.abs(merry.social - 2 * plain.social) < 1e-6, `${plain.social.toFixed(3)} / ${merry.social.toFixed(3)}`);
      check('… keyif barı da iki kat hızlı dolar ve +15 ilk bardakta', merry.fun > plain.fun * 1.9 && merry.jumped >= 15, `${plain.fun.toFixed(3)} / ${merry.fun.toFixed(3)} / +${merry.jumped.toFixed(1)}`);
      check('perform şerbeti yalnızca bir kez ikram eder (ilk adımda)', inn.sherbet === 4);
      guest.task = null;
    }
    // Keyifli Damak: keyif yavaş düşer (gerçek NeedsSystem)
    {
      const needs = S().systems.find((x) => x.constructor.name === 'NeedsSystem');
      const drop = (palate) => {
        if (palate) guest.buffs.merryPalate = s0.totalMinutes + 600;
        else delete guest.buffs.merryPalate;
        guest.needs.fun = 80;
        needs.update({ gameMinutes: 60, hour: 10, realDt: 0, simDt: 0 });
        return 80 - guest.needs.fun;
      };
      const normal = drop(false);
      const merryDrop = drop(true);
      check('Keyifli Damak varken keyif %25 yavaş düşer', normal > 0 && Math.abs(merryDrop - normal * RF.INN_SHERBET.palate.funDecay) < normal * 0.05, `${normal.toFixed(3)} / ${merryDrop.toFixed(3)}`);
      delete guest.buffs.merryPalate;
    }
    // Testiden içme
    guest.needs.fun = 20;
    guest.inventory = [{ kind: 'sherbetJug', qty: 1 }];
    const asleep = guest.task;
    const drank = R.drinkJugs();
    check('keyfi düşen sakin çantasındaki testiden içer (+15 keyif, testi biter)', drank >= 1 && guest.needs.fun === 35 && CZ.countItem(guest, 'sherbetJug') === 0);
    guest.needs.fun = 80;
    guest.inventory = [{ kind: 'sherbetJug', qty: 1 }];
    R.drinkJugs();
    check('keyfi yerindeyse testiye dokunmaz', CZ.countItem(guest, 'sherbetJug') === 1);
    guest.inventory = [];

    // --- Kumaş: Dayanıklı Giysi, soğuk direnci, refah ---
    {
      const market = s0.buildings.find((b) => b.type === 'market' && b.functional) ?? sim.place('market');
      const P = S().purse;
      const buyer = s0.characters.find((c) => !c.isChild && !c.role && c.id !== guest.id && c.id !== worker.id);
      const setup = (day, cloth) => {
        s0.time.day = day;
        sim.give({ cloth });
        buyer.coins = 40;
        buyer.inventory = [{ kind: 'souvenir', qty: 1, name: 'Boncuk Kolye' }, { kind: 'ration', qty: 6 }, { kind: 'ration', qty: 6 }];
        buyer.illness = null;
        buyer.exposure = 0;
      };
      setup(6, 10);
      const summer = P.shop(buyer, market);
      setup(10, 10);
      const g0 = s0.stats.garments ?? 0;
      const autumn = P.shop(buyer, market);
      check('sonbaharda Pazar Yeri\'nin terzisi kumaştan Dayanıklı Giysi diker (8 altın, 1 kumaş)', summer !== 'garment' && autumn === 'garment' && CZ.countItem(buyer, 'garment') === 1 && buyer.coins === 32 && s0.resources.cloth === 9 && s0.stats.garments === g0 + 1, `${summer} / ${autumn}`);
      check('giysisi olan ikinciyi almaz', P.shop(buyer, market) !== 'garment' || CZ.countItem(buyer, 'garment') === 1);
      setup(14, 0);
      buyer.inventory = buyer.inventory.filter((x) => x.kind !== 'garment');
      check('kasabada kumaş yokken giysi dikilmez', P.shop(buyer, market) !== 'garment');
      const bare = { equipment: { tool: null, clothing: null, bag: null }, inventory: [] };
      const dressed = { equipment: { tool: null, clothing: null, bag: null }, inventory: [{ kind: 'garment', qty: 1 }] };
      const coat = { equipment: { tool: null, clothing: 'winterCoat', bag: null }, inventory: [{ kind: 'garment', qty: 1 }] };
      check('Dayanıklı Giysi kışın soğuğa karşı +0,3 korur; paltoyla toplanır (en çok 1)', EQ.coldProtection(bare) === 0 && Math.abs(EQ.coldProtection(dressed) - 0.3) < 1e-9 && EQ.coldProtection(coat) <= 1 && EQ.coldProtection(coat) > EQ.coldProtection({ ...coat, inventory: [] }));
      const cloth0 = s0.stats.goods.cloth;
      s0.stats.goods.cloth = 0;
      const b0 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = 85;
      const b1 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = 900;
      const b2 = TS.townHappinessBonus(s0);
      s0.stats.goods.cloth = cloth0;
      check('dokunan kumaş refaha kalıcı katkı verir: her 40 topta +1, en çok +3', RX.clothWelfare({ stats: { goods: { cloth: 39 } } }) === 0 && b1 - b0 === 2 && b2 - b0 === 3);
      s0.time.day = 6;
    }

    // --- HUD, panel ---
    game.render(0);
    const hud = game.ui.components.find((x) => x.renderWelfare);
    check('Mallar listesinde Kumaş ve Fıçı Şerbeti', hud.resources.cloth && hud.resources.sherbet && hud.goodsMenu.contains(hud.resources.cloth.box) && hud.goodsMenu.contains(hud.resources.sherbet.box));
    hud.renderGoodsDetail(s0);
    check('Kumaş ipucu tezgâhı üretici sayar', /1 yapı/.test(hud.resources.cloth.box.title), hud.resources.cloth.box.title.split('\n')[0]);
    const panel = game.ui.components.find((x) => x.renderCrafting);
    const show = (b) => { panel.buildingId = b.id; panel.element.hidden = false; panel.lastKey = ''; panel.render(game); return panel.lines.textContent; };
    sim.give({ flax: 20, cloth: 0 });
    refresh();
    const loomText = show(loom);
    check('Dokuma Tezgâhı paneli: saatlik oran, toplam kumaş ve refah katkısı, giysi ve lüks iş notu', /dokumacı başı/.test(loomText) && /Keten 4 → Kumaş 2/.test(loomText) && /Dokunan toplam kumaş/.test(loomText) && /Dayanıklı Giysi/.test(loomText) && /Lüks iş/.test(loomText), loomText.slice(0, 160));
    inn.sherbet = 7;
    const brewText = show(brewery);
    check('Şerbethane paneli: oran ve hanlardaki fıçılar', /mahzen ustası başı/.test(brewText) && /Şerbetçiotu 4 → Fıçı Şerbeti 2/.test(brewText) && /7\/12/.test(brewText));
    const innText = show(inn);
    check('Han paneli handaki fıçıyı ve etkisini gösterir', /Fıçı şerbeti: 7\/12/.test(innText) && /iki kat/.test(innText));
    const millB = s0.buildings.find((b) => b.type === 'mill' && b.functional);
    if (millB) check('değirmen paneli eski metinlerini korur', /fırıncı başı/.test(show(millB)) && /Öğünlerde önce ekmek/.test(panel.lines.textContent));
    panel.buildingId = null;
    panel.element.hidden = true;

    // --- Görseller ---
    const L0 = ART.getStructureSprite('loom', {});
    const L1 = ART.getStructureSprite('loom', { active: true, frame: 1 });
    const B0 = ART.getStructureSprite('brewery', {});
    const B1 = ART.getStructureSprite('brewery', { active: true, frame: 1 });
    check('Dokuma Tezgâhı ve Şerbethane görselleri 32x40; çalışırken mekik / ateş kareleri farklı; kışın çatı karlanır', [L0, L1, B0, B1].every((x) => x.width === 32 && x.height === 40) && L0 !== L1 && B0 !== B1 && L0.toDataURL() !== L1.toDataURL() && B0.toDataURL() !== B1.toDataURL() && ART.getStructureSprite('loom', { season: 'winter' }).toDataURL() !== L0.toDataURL());
    check('yeni simgeler, balonlar, taşıma demetleri ve aletler (kumaş, fıçı, mekik, kepçe)', ['cloth', 'sherbet'].every((n) => UI.getIconDataURL(n) && UI.getCarrySprite(n) && UI.getBubbleSprite(n)) && UI.getHeldToolSprite('shuttle', false) && UI.getHeldToolSprite('ladle', true));

    // --- Kayıt gidiş-dönüşü (sürüm 22) ---
    inn.sherbet = 6;
    sim.give({ cloth: 21, sherbet: 13 });
    guest.inventory = [{ kind: 'sherbetJug', qty: 2 }, { kind: 'garment', qty: 1 }];
    guest.buffs.merryPalate = s0.totalMinutes + 500;
    s0.stats.sherbetServed = 17;
    s0.stats.garments = 4;
    s0.stats.goods.cloth = 55;
    const T = { inn: inn.id, loom: loom.id, brew: brewery.id, guest: guest.id, palate: guest.buffs.merryPalate };
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: tezgâh, şerbethane, Kumaş / Fıçı Şerbeti, handaki fıçılar ve çanta eşyaları kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && raw.resources.cloth === 21 && raw.resources.sherbet === 13 && raw.buildings.find((b) => b.id === T.inn).sherbet === 6 && raw.buildings.some((b) => b.id === T.loom && b.type === 'loom') && raw.characters.find((c) => c.id === T.guest).inventory.some((x) => x.kind === 'garment'));
    game.events.emit('ui:load');
    const s2 = st();
    const inn2 = s2.buildings.find((b) => b.id === T.inn);
    const g2 = s2.characters.find((c) => c.id === T.guest);
    check('kayıttan yapılar, stoklar ve handaki fıçılar döner', s2.buildings.find((b) => b.id === T.loom)?.type === 'loom' && s2.buildings.find((b) => b.id === T.brew)?.type === 'brewery' && s2.resources.cloth === 21 && s2.resources.sherbet === 13 && inn2.sherbet === 6);
    check('kayıttan testi, giysi, Keyifli Damak ve sayaçlar döner', CZ.countItem(g2, 'sherbetJug') === 2 && CZ.countItem(g2, 'garment') === 1 && g2.buffs.merryPalate === T.palate && s2.stats.sherbetServed === 17 && s2.stats.garments === 4 && s2.stats.goods.cloth === 55 && TS.townHappinessBonus(s2) >= 1);
    check('yüklenen kasabada tezgâh yeniden dokuyabilir', (() => { sim.give({ flax: 10, food: 300 }); game.scenes.current.structures.update({ hour: 10, gameMinutes: 0 }); return !s2.buildings.find((b) => b.id === T.loom).idle; })());
    // Bozuk değer
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.buildings.find((b) => b.id === T.inn).sherbet = 'çok';
    bad.buildings.find((b) => b.id === T.loom).sherbet = 9;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk fıçı değeri 0\'a döner; han olmayan yapıda fıçı tutulmaz', st().buildings.find((b) => b.id === T.inn).sherbet === 0 && st().buildings.find((b) => b.id === T.loom).sherbet === 0);
    // Eski (v21) kayıt
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 21;
    delete old.resources.cloth;
    delete old.resources.sherbet;
    old.buildings = old.buildings.filter((b) => b.type !== 'loom' && b.type !== 'brewery');
    for (const b of old.buildings) delete b.sherbet;
    for (const c of old.characters) {
      c.inventory = (c.inventory ?? []).filter((x) => x.kind !== 'garment' && x.kind !== 'sherbetJug');
      if (c.buffs) delete c.buffs.merryPalate;
    }
    delete old.stats.sherbetServed;
    delete old.stats.garments;
    delete old.stats.jugsDrunk;
    delete old.stats.sherbetJugs;
    if (old.stats.goods) { delete old.stats.goods.cloth; delete old.stats.goods.sherbet; }
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const s3 = st();
    check('v21 kaydı yüklenince Kumaş / Fıçı Şerbeti 0, hanlarda fıçı yok, yeni yapı ve eşya yok', s3.resources.cloth === 0 && s3.resources.sherbet === 0 && s3.buildings.filter((b) => b.type === 'inn').every((b) => b.sherbet === 0) && !s3.buildings.some((b) => b.type === 'loom' || b.type === 'brewery') && s3.characters.every((c) => !c.inventory.some((x) => x.kind === 'garment' || x.kind === 'sherbetJug')));
    check('v21 kaydında kumaşın refah katkısı 0, bir gün sorunsuz yaşar', RX.clothWelfare(s3) === 0 && (() => { const d = s3.time.day; hours(24); return game.state.time.day === d + 1; })());
    offs.forEach((off) => off());
  }

  // ===== 24. aşama (24.3): Ticaret İskelesi / Kervan Konağı, ihracat sözleşmeleri, pazar doygunluğu, hammadde ithalatı =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const BD = await import('/src/data/buildings.js');
    const TD = await import('/src/data/tradePost.js');
    const TP = await import('/src/systems/TradePost.js');
    const TR = await import('/src/data/trade.js');
    const ART = await import('/src/art/sprites/index.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.time.speed = 4; // hours() 4x hızı varsayar
    s0.time.paused = false;
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    s0.crown.decree = null;
    s0.crown.nextDecreeAt = s0.totalMinutes + 1e6;
    s0.crown.nextLevyAt = s0.totalMinutes + 1e6;
    const events = [];
    const offs = ['trade:shipArrived', 'trade:shipLeft', 'trade:contractDone', 'trade:imported', 'toast'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    // Saat ilerletirken açılan karar penceresini varsayılan seçenekle kapat (oyun durmasın)
    const hrs = (h) => {
      for (let i = 0; i < h; i++) {
        const active = st().dilemma.active;
        if (active) {
          const o = active.options?.find((x) => x.default) ?? active.options?.[0];
          if (o) game.events.emit('ui:chooseDilemma', { optionId: o.id });
          st().dilemma.active = null;
        }
        st().time.paused = false;
        st().time.speed = 4;
        hours(1);
      }
    };
    const setTime = (total) => {
      s0.time.day = Math.floor(total / 1440) + 1;
      s0.time.hour = Math.floor((total % 1440) / 60);
      s0.time.minute = total % 60;
    };

    // --- Veri ---
    const def = BD.BUILDINGS.tradingPost;
    check('Ticaret İskelesi: 3x2, Kasaba seviyesi, kereste + taş + demir, tek, Ticaret kategorisi', def && def.size.w === 3 && def.size.h === 2 && def.requiresTier === 3 && def.cost.wood > 0 && def.cost.stone > 0 && def.cost.iron > 0 && def.unique && def.category === 'Ticaret' && def.placement === 'tradeSite');
    check('Ticaret İskelesi inşa menüsünde, Büyük Ticaret Limanı\'nın ardından', BD.BUILD_MENU.indexOf('tradingPost') === BD.BUILD_MENU.indexOf('harbor') + 1 && BD.buildTabFor('tradingPost') === 'buildings');
    const TRD = await import('/src/data/trade.js');
    const premiums = Object.entries(TD.CONTRACTS).map(([r, c]) => [r, c.gold / (c.qty * TRD.EXPORT.values[r])]);
    check('(28.1) her ihracat sözleşmesi, Büyük Ticaret Limanı\'nın otomatik satış fiyatından (EXPORT.values) en az %40 kârlıdır', premiums.every(([, p]) => p >= TD.CONTRACT_MIN_PREMIUM) && Object.values(TD.CONTRACTS).every((c, i) => c.gold > 0), premiums.map(([r, p]) => `${r} x${p.toFixed(2)}`).join(' '));
    check('talepler (28.1): Kumaş 10 -> 85, Şerbet 8 -> 80, Ekmek 25 -> 105 altın; ziyaret 3-4 günde bir, 24 saat', TD.CONTRACTS.cloth.qty === 10 && TD.CONTRACTS.cloth.gold === 85 && TD.CONTRACTS.sherbet.qty === 8 && TD.CONTRACTS.sherbet.gold === 80 && TD.CONTRACTS.bread.qty === 25 && TD.CONTRACTS.bread.gold === 105 && TD.CONTRACTS.food.gold === 75 && TD.CONTRACTS.wool.gold === 65 && TD.VISIT.intervalDays.join() === '3,4' && TD.VISIT.stayHours === 24);
    check('ithalat paketleri: 30 odun 15, 25 taş 15, 10 demir 20 altın', TD.IMPORTS.wood.get.wood === 30 && TD.IMPORTS.wood.give.gold === 15 && TD.IMPORTS.stone.get.stone === 25 && TD.IMPORTS.stone.give.gold === 15 && TD.IMPORTS.iron.get.iron === 10 && TD.IMPORTS.iron.give.gold === 20);
    check('ziyaretin üç talebi: Kumaş, Şerbet ve sırayla Ekmek / Erzak / Yün', [0, 1, 2, 3].map((v) => TP.contractsFor(v).map((c) => c.resource).join('+')).join(',') === 'cloth+sherbet+bread,cloth+sherbet+food,cloth+sherbet+wool,cloth+sherbet+bread');
    check('Büyük Ticaret Limanı da kumaş ve fıçı şerbetini ihraç eder', TR.EXPORT.values.cloth > TR.EXPORT.values.bread && TR.EXPORT.values.sherbet > TR.EXPORT.values.bread);

    // --- Seviye kilidi ve yerleşim ---
    sim.give({ wood: 900, stone: 900, iron: 300, food: 400, bread: 120, gold: 1000, cloth: 0, sherbet: 0, wool: 60 });
    s0.town.tier = 4;
    const spot = sim.findSpot('tradingPost');
    s0.town.tier = 2;
    const locked = spot ? S().construction.checkPlacement('tradingPost', spot.x, spot.y) : { ok: true };
    s0.town.tier = 4;
    check('Ticaret İskelesi Köy\'de kilitli, Kasaba\'da yolun / suyun kenarına kurulabilir', spot && !locked.ok && /Kasaba/.test(locked.reason) && S().construction.checkPlacement('tradingPost', spot.x, spot.y).ok, locked.reason);
    // Ne yola ne suya değen bir yer reddedilir
    let far = null;
    const map = S().world.map;
    for (let y = 2; y < map.height - 3 && !far; y++) for (let x = 2; x < map.width - 4 && !far; x++) {
      const c = S().construction.checkPlacement('tradingPost', x, y);
      if (!c.ok && /yolun kenarına/.test(c.reason)) far = c;
    }
    check('yoldan ve sudan uzak yer reddedilir (nedeni yazılır)', far && /Nehir kıyısına/.test(far.reason));
    // Su kenarında gemi, yolda kervan
    let waterAt = null;
    for (let y = 2; y < map.height - 3 && !waterAt; y++) for (let x = 4; x < map.width; x++) if (map.get(x, y) === 'water' && map.get(x, y + 1) === 'water' && map.get(x - 1, y) !== 'water') { waterAt = { x, y }; break; }
    const fakeRiver = { definition: def, tileX: waterAt.x - 3, tileY: waterAt.y, type: 'tradingPost' };
    const vRiver = S().tradePost.visitorFor(fakeRiver);
    check('yanında su varsa Ticaret Gemisi (iskele), yoksa Kervan (konak) gelir', vRiver.mode === 'ship' && vRiver.side === 'right');

    // --- Takvim ---
    const post = sim.place('tradingPost');
    const tp = s0.tradePost;
    const T0 = s0.totalMinutes;
    check('iskele kurulunca ilk gemi / kervan en az 12 saat sonra 09:00\'da gelir', post && tp.nextShipAt >= T0 + 720 && tp.nextShipAt % 1440 === 540 && tp.nextShipAt - T0 < 720 + 1440, `${T0} -> ${tp.nextShipAt}`);
    const mode = S().tradePost.visitorFor(post).mode;
    check('köydeki iskele yol kenarında: kervan gelecek (ya da suyun yanında gemi)', ['ship', 'caravan'].includes(mode));
    const R = S().tradePost;
    const arriveNow = () => {
      setTime(tp.nextShipAt);
      R.hourly();
    };
    const leaveNow = () => {
      setTime(tp.ship.leavesAt);
      R.hourly();
    };
    setTime(tp.nextShipAt - 60);
    R.hourly();
    check('vakti gelmeden gelen olmaz', !tp.ship);
    events.length = 0;
    arriveNow();
    const ship = tp.ship;
    check('gemi / kervan geldi: 24 saat kalır, 3 talep ve ithalat stoğu getirir', ship && tp.visits === 1 && ship.leavesAt - ship.arrivedAt === 1440 && ship.contracts.length === 3 && ship.contracts.map((c) => c.resource).join() === 'cloth,sherbet,bread' && ship.stock.wood === 3 && ship.mode === mode && TP.shipDocked(s0));
    check('varışta bildirim ve Kasaba Günlüğü notu', events.some((e) => e.n === 'trade:shipArrived') && events.some((e) => e.n === 'toast' && /24 saat/.test(e.p.text)) && s0.journal.some((j) => /talep ediliyor/.test(j.text)));
    R.update();
    check('yanaşan gemi / kervan iskelede çizilir (flamalı ambar)', post.visitor && post.visitor.mode === mode && post.currentSprite({ season: 'summer', time: 0 }) === ART.getStructureSprite('tradingPost', { docked: true }));

    // --- İhracat sözleşmeleri ---
    sim.give({ cloth: 25, sherbet: 3, bread: 30 });
    const gold0 = s0.resources.gold;
    events.length = 0;
    const g1 = R.complete(0);
    check('Kumaş Talebi tamamlanır: 10 kumaş düşer, hazineye 85 altın', g1 === 85 && s0.resources.cloth === 15 && s0.resources.gold === gold0 + 85 && ship.contracts[0].done && tp.completed === 1 && tp.goldEarned === 85 && tp.exported.cloth === 10 && events.some((e) => e.n === 'trade:contractDone'));
    check('tamamlanan sözleşme ikinci kez ödenmez', R.complete(0) === 0 && s0.resources.cloth === 15 && TP.contractStatus(s0, 0).reason === 'Bu sözleşme tamamlandı');
    const short = TP.contractStatus(s0, 1);
    check('depoda yetmeyen mal reddedilir (nedeni yazılır)', !short.ok && /Yetersiz fıçı şerbeti \(3\/8\)/.test(short.reason) && R.complete(1) === 0 && s0.resources.sherbet === 3, short.reason);
    check('Ekmek Talebi: 25 ekmek -> 105 altın', R.complete(2) === 105 && s0.resources.bread === 5);
    check('Kasaba günlüğüne sözleşme notu', s0.journal.some((j) => /İhracat sözleşmesi: 10 kumaş/.test(j.text)));

    // --- İthalat ---
    sim.give({ wood: 100, stone: 100, iron: 10, gold: 100 });
    const ok1 = R.buy('wood');
    check('Odun Paketi: 15 altın, 30 odun anında ambara iner', ok1 && s0.resources.wood === 130 && s0.resources.gold === 85 && ship.stock.wood === 2 && tp.imports === 1 && tp.goldSpent === 15 && tp.imported.wood === 30);
    R.buy('wood');
    R.buy('wood');
    check('her paketten ziyaret başına 3 tane; sonra tüccarın stoğu biter', !R.buy('wood') && ship.stock.wood === 0 && /stoğu bitti/.test(TP.importStatus(s0, 'wood').reason));
    check('Taş ve Demir Paketi: 25 taş 15, 10 demir 20 altın', R.buy('stone') && R.buy('iron') && s0.resources.stone === 125 && s0.resources.iron === 20);
    sim.give({ gold: 10 });
    check('altın yetmezse ithalat yapılmaz', !R.buy('iron') && /Yetersiz altın/.test(TP.importStatus(s0, 'iron').reason));
    sim.give({ gold: 500, stone: S().economy.limit('stone') });
    check('depoda yer yoksa ithalat yapılmaz', !R.buy('stone') && /yer yok/.test(TP.importStatus(s0, 'stone').reason));
    sim.give({ stone: 100 });

    // --- Ayrılış ve 3-4 günlük takvim ---
    events.length = 0;
    leaveNow();
    check('24 saat dolunca ayrılır; sözleşme ve ithalat kapanır', !tp.ship && events.some((e) => e.n === 'trade:shipLeft') && !TP.contractStatus(s0, 0).ok && /kasabada değil/.test(TP.importStatus(s0, 'wood').reason) && tp.log.length === 1);
    R.update();
    check('ayrılınca iskele boş çizilir', post.visitor === null);
    const leftAt = s0.totalMinutes;
    check('sonraki ziyaret 3 gün sonra 09:00', tp.nextShipAt === Math.floor(leftAt / 1440) * 1440 + 3 * 1440 + 540 || tp.nextShipAt === leftAt + 3 * 1440, `${leftAt} -> ${tp.nextShipAt}`);
    arriveNow();
    const a2 = s0.totalMinutes;
    check('ikinci ziyaretin üçüncü talebi Erzak', tp.ship.contracts[2].resource === 'food' && tp.visits === 2);
    leaveNow();
    check('sonraki ziyaret 4 gün sonra (sırayla 3 ve 4)', Math.round((tp.nextShipAt - s0.totalMinutes) / 1440) === 4 || Math.floor(tp.nextShipAt / 1440) - Math.floor(s0.totalMinutes / 1440) === 4, `${a2} ${s0.totalMinutes} -> ${tp.nextShipAt}`);

    // --- Pazar doygunluğu ---
    tp.market = {};
    tp.streak = { resource: 'cloth', count: 1 }; // ilk ziyarette kumaş satıldı
    sim.give({ cloth: 200, sherbet: 100, bread: 100, food: 300, wool: 100, gold: 500 });
    const sell = (resource) => R.complete(tp.ship.contracts.findIndex((c) => c.resource === resource));
    arriveNow();
    const p2 = sell('cloth');
    leaveNow();
    arriveNow();
    const p3 = sell('cloth');
    check('Kumaş 3 kez peş peşe satılınca bir sonraki fiyat %12 düşer', p2 === 85 && p3 === 85 && Math.abs(tp.market.cloth - 0.88) < 1e-9 && TP.contractPrice(s0, tp.ship.contracts[0]) === 75, JSON.stringify(tp.market));
    leaveNow();
    arriveNow();
    const p4 = sell('cloth');
    check('dördüncü satış düşük fiyattan (75 altın) ve çarpan yeniden düşer (%76)', p4 === 75 && Math.abs(tp.market.cloth - 0.76) < 1e-9);
    const p5 = sell('sherbet');
    check('başka mal (şerbet) satılınca kumaşın fiyatı %5 toparlanır, seri bozulur', p5 === 80 && Math.abs(tp.market.cloth - 0.81) < 1e-9 && tp.streak.resource === 'sherbet' && tp.streak.count === 1);
    leaveNow();
    arriveNow();
    check('kumaş satılmayan ziyaretten sonra da her varışta %5 toparlanır', Math.abs(tp.market.cloth - 0.81) < 1e-9 || Math.abs(tp.market.cloth - 0.86) < 1e-9);
    sell('sherbet');
    leaveNow();
    arriveNow();
    check('satılmayan kumaş varışta toparlanır', Math.abs(tp.market.cloth - 0.86) < 1e-9 + 0.05 && tp.market.cloth > 0.81, JSON.stringify(tp.market));
    for (let i = 0; i < 6; i++) {
      leaveNow();
      arriveNow();
    }
    check('zamanla eski kârlı seviyesine (tam fiyat) döner', tp.market.cloth === undefined && TP.priceMultiplier(s0, 'cloth') === 1 && TP.contractPrice(s0, tp.ship.contracts[0]) === 85);
    tp.market = { cloth: 0.5 };
    check('çarpan en düşük %55\'te durur (kayıttan bile)', TP.restoreTradePost({ market: { cloth: 0.1 } }).market.cloth === 0.55);
    tp.market = {};
    tp.streak = { resource: null, count: 0 };

    // --- Gerçek saatler: takvim olaylarla işler; iskele çalışmıyorsa gelen olmaz ---
    leaveNow();
    tp.nextShipAt = s0.totalMinutes + 30;
    post.isDamaged = true;
    post.damaged = true;
    hrs(2);
    check('iskele hasarlıyken gemi / kervan gelmez', !tp.ship && tp.nextShipAt !== null);
    post.damaged = false;
    post.isDamaged = false;
    hrs(2);
    check('iskele onarılınca ilk saatte gelir (time:hour)', tp.ship && TP.shipDocked(s0), `gemi ${!!tp.ship} · sıradaki ${tp.nextShipAt} · şimdi ${s0.totalMinutes} · hazır ${TP.tradePostReady(s0)} · proje ${post.project?.kind} · işler ${post.functional} · state ${st() === s0} · hız ${s0.time.speed} · durdu ${s0.time.paused} · karar ${s0.dilemma.active?.id ?? '-'} · saat ${s0.time.hour}:${s0.time.minute}`);
    hrs(26);
    check('gerçek saatlerle 24 saat sonra ayrılır', !tp.ship && tp.nextShipAt > s0.totalMinutes);

    // --- Panel: sözleşme kartları ve tek tıkla tamamlama ---
    arriveNow();
    sim.give({ cloth: 30, sherbet: 2, gold: 300, wood: 50 });
    const panel = game.ui.components.find((x) => x.renderCrafting);
    const show = () => { panel.buildingId = post.id; panel.element.hidden = false; panel.lastKey = ''; panel.render(game); };
    show();
    const cards = panel.tradeBox.querySelectorAll('.trade-contract');
    const btns = [...panel.tradeBox.querySelectorAll('.contract-button')];
    check('iskele panelinde üç sözleşme kartı ve ithalat düğmeleri', !panel.tradeBox.hidden && cards.length === 3 && btns.length === 3 && panel.tradeBox.querySelectorAll('.import-button').length === 3 && /burada/.test(panel.tradeBox.textContent));
    check('yetmeyen malın düğmesi kapalı, yetenin açık', !btns[0].disabled && btns[1].disabled);
    const c0 = s0.resources.cloth;
    btns[0].click();
    show();
    check('karttaki düğmeye tıklayınca sözleşme tamamlanır', s0.resources.cloth === c0 - 10 && tp.ship.contracts[0].done && panel.tradeBox.querySelector('.trade-contract.is-done'));
    const w0 = s0.resources.wood;
    panel.tradeBox.querySelector('.import-button[data-kind="wood"]').click();
    check('ithalat düğmesiyle Odun Paketi alınır', s0.resources.wood === w0 + 30);
    leaveNow();
    show();
    check('gemi yokken panel sıradaki varışı gösterir', /Sıradaki gemi \/ kervan/.test(panel.tradeBox.textContent) && panel.tradeBox.querySelectorAll('.trade-contract').length === 0);
    panel.buildingId = null;
    panel.element.hidden = true;

    // --- Görseller ---
    const p0 = ART.getStructureSprite('tradingPost', {});
    const pd = ART.getStructureSprite('tradingPost', { docked: true });
    const shipS = ART.getTradeShipSprite(false, false);
    const shipL = ART.getTradeShipSprite(true, true);
    const car = ART.getCaravanSprite(false);
    check('iskele 48x40 (gemi gelince flamalı), gemi 40x32, kervan 40x28; aynalı ve gece fenerli çeşitleri', p0.width === 48 && p0.height === 40 && pd.toDataURL() !== p0.toDataURL() && shipS.width === 40 && shipS.height === 32 && car.width === 40 && car.height === 28 && shipL.toDataURL() !== shipS.toDataURL() && ART.getStructureSprite('tradingPost', { season: 'winter' }).toDataURL() !== p0.toDataURL());
    check('sözleşme simgesi', UI.getIconDataURL('contract'));

    // --- Kayıt gidiş-dönüşü (sürüm 23) ---
    arriveNow();
    sim.give({ cloth: 40 });
    R.complete(0);
    R.buy('iron');
    tp.market = { sherbet: 0.76 };
    tp.streak = { resource: 'cloth', count: 2 };
    const snap = JSON.stringify({ ship: tp.ship, next: tp.nextShipAt, visits: tp.visits, market: tp.market, streak: tp.streak, completed: tp.completed, earned: tp.goldEarned, spent: tp.goldSpent });
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: gemi takvimi, aktif sözleşmeler ve pazar çarpanları kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && raw.tradePost && raw.tradePost.ship.contracts.length === 3 && raw.tradePost.ship.contracts[0].done === true && raw.tradePost.market.sherbet === 0.76);
    game.events.emit('ui:load');
    const t2 = st().tradePost;
    check('kayıttan yanaşmış gemi, tamamlanan sözleşme, ithalat stoğu, çarpanlar ve sayaçlar birebir döner', JSON.stringify({ ship: t2.ship, next: t2.nextShipAt, visits: t2.visits, market: t2.market, streak: t2.streak, completed: t2.completed, earned: t2.goldEarned, spent: t2.goldSpent }) === snap);
    check('yüklenen kasabada gemi hâlâ burada, kalan sözleşme tamamlanabilir', TP.shipDocked(st()) && (() => { sim.give({ bread: 50, food: 100, wool: 50 }); return game.scenes.current.tradePost.complete(2) > 0; })());
    // Bozuk değerler
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.tradePost.market = { cloth: 'ucuz', sherbet: 7, iron: 0.2 };
    bad.tradePost.ship.contracts.push({ resource: 'altın', qty: 5, gold: 999 });
    bad.tradePost.ship.stock.wood = 99;
    bad.tradePost.streak = { resource: 'kömür', count: 5 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    const t3 = st().tradePost;
    check('bozuk çarpan, bilinmeyen mal, taşan stok ve seri temizlenir', Object.keys(t3.market).length === 0 && t3.ship.contracts.length === 3 && t3.ship.stock.wood === 3 && t3.streak.resource === null);
    // Eski (v22) kayıt
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 22;
    delete old.tradePost;
    old.buildings = old.buildings.filter((b) => b.type !== 'tradingPost');
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const t4 = st().tradePost;
    check('v22 kaydı yüklenince dış ticaret boş: gemi, takvim, sözleşme ve çarpan yok', !t4.ship && t4.nextShipAt === null && t4.visits === 0 && Object.keys(t4.market).length === 0 && t4.completed === 0 && !st().buildings.some((b) => b.type === 'tradingPost'));
    check('v22 kasabasına iskele kurulunca takvim kurulur (ilk gemi gelir) ve bir gün sorunsuz yaşar', (() => {
      st().town.tier = 4;
      sim.give({ wood: 400, stone: 400, iron: 100 });
      const b = sim.place('tradingPost');
      const d = st().time.day;
      hrs(24);
      window.__v22dbg = `yapı ${!!b} · takvim ${st().tradePost.nextShipAt} · gemi ${!!st().tradePost.ship} · gün ${d}->${game.state.time.day}`;
      return b && (st().tradePost.nextShipAt !== null || st().tradePost.ship) && st().tradePost.visits <= 1 && game.state.time.day === d + 1;
    })(), window.__v22dbg);
    offs.forEach((off) => off());
  }

  // ===== 25. aşama (25.1): yaşam evreleri ve yaş döngüsü (Çocuk -> Genç -> Yetişkin -> Kıdemli Bilge), emeklilik, Bilge Nasihati =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const LD = await import('/src/data/lifeStages.js');
    const LS = await import('/src/systems/LifeStages.js');
    const TS = await import('/src/systems/TownStatus.js');
    const CR = await import('/src/systems/Crisis.js');
    const EX = await import('/src/systems/Exploration.js');
    const RS = await import('/src/systems/RelationshipSystem.js');
    const ART = await import('/src/art/sprites/index.js');
    const CH = await import('/src/art/sprites/characters.js');
    const { Character } = await import('/src/entities/Character.js');
    const { CONFIG } = await import('/src/config.js');
    const Y = LD.AGING.daysPerYear;
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    const residents = () => st().characters.filter((c) => !c.role);
    const adultsNow = () => residents().filter((c) => !c.isChild && c.lifeStage !== 'elder');
    const events = [];
    const offs = ['lifeStage:changed', 'lifeStage:retired', 'toast', 'journal:added'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    const lastJournal = () => st().journal.slice(-4).map((e) => e.text).join(' / ');
    const hrs251 = (h) => {
      for (let i = 0; i < h; i++) {
        const active = st().dilemma.active;
        if (active) {
          const o = active.options?.find((x) => x.default) ?? active.options?.[0];
          if (o) game.events.emit('ui:chooseDilemma', { optionId: o.id });
          st().dilemma.active = null;
        }
        st().time.paused = false;
        st().time.speed = 4;
        hours(1);
      }
    };

    // --- Veri ve saf hesaplar ---
    check('dört yaşam evresi: Çocuk, Genç, Yetişkin, Kıdemli Bilge', LD.LIFE_STAGE_KEYS.join() === 'child,youth,adult,elder' && LD.LIFE_STAGES.child.name === 'Çocuk' && LD.LIFE_STAGES.youth.name === 'Genç' && LD.LIFE_STAGES.adult.name === 'Yetişkin' && LD.LIFE_STAGES.elder.name === 'Kıdemli Bilge');
    check('bir yaş = bir oyun yılı (4 mevsim), Genç 21\'e kadar, Kıdemli Bilge 70 yaşında', Y === CONFIG.DAYS_PER_SEASON * 4 && LD.AGING.youthUntil === 21 && LD.AGING.elderAt === 70);
    check('evre yaştan türetilir; kazanılmış bilge unvanı korunur', LS.stageFor({ isChild: true, age: 40 }) === 'child' && LS.stageFor({ age: 18 }) === 'youth' && LS.stageFor({ age: 20 }) === 'youth' && LS.stageFor({ age: 21 }) === 'adult' && LS.stageFor({ age: 69 }) === 'adult' && LS.stageFor({ age: 70 }) === 'elder' && LS.stageFor({ age: 50, lifeStage: 'elder' }) === 'elder');
    check('doğum günleri kimlikten (yılın ilk 8 günü), yaş / gün dönüşümü tutarlı', [1, 2, 3, 17, 99].every((id) => LS.birthdayOffset(id) >= 0 && LS.birthdayOffset(id) < 8 && LS.ageFromDays(LS.daysForAge(33, id)) === 33) && new Set([1, 2, 3, 4, 5, 6, 7, 8].map(LS.birthdayOffset)).size === 8);

    // --- Karakter modeli ---
    check('her sakinin geçerli bir evresi ve gün cinsinden yaşı var', residents().every((c) => LS.isLifeStage(c.lifeStage) && Number.isInteger(c.ageInDays) && c.age === Math.floor(c.ageInDays / Y) && (c.lifeStage === 'child') === c.isChild));
    const mk = (age, extra = {}) => new Character({ name: 'Deneme', age, traits: ['cheerful'], appearance: { hair: 'short', hairColor: 'brown', skin: 'light', shirt: 'sky', pants: 'navy' }, ...extra });
    const k27 = mk(27);
    const k19 = mk(19);
    const k72 = mk(72);
    check('yeni sakin: 27 yaşında Yetişkin, 19 yaşında Genç, 72 yaşında Kıdemli Bilge; yaş değişmez', k27.lifeStage === 'adult' && k27.age === 27 && k27.ageInDays === 27 * Y + LS.birthdayOffset(k27.id) && k19.lifeStage === 'youth' && k19.isYouth && k72.lifeStage === 'elder' && k72.isElder && k72.age === 72);
    check('bilge profili: ağır adımlar, bank / çardak / kütüphane sevgisi; gencin ve yetişkinin profili aynı iş düzeninde', k72.profile.elder && Math.abs(k72.profile.speed / k27.profile.speed - LD.ELDER.speed) < 1e-9 && k72.profile.leisure.bench > k27.profile.leisure.bench * 2.9 && k19.profile.work.breakChance === mk(19, { traits: ['cheerful'] }).profile.work.breakChance && JSON.stringify(k19.profile.thresholds) === JSON.stringify(k27.profile.thresholds));
    const kid = mk(5, { growsUpAt: 999999 });
    check('çocuk: evresi Çocuk, yaş sayacı yürür ama büyümesi FamilySystem\'in işidir', kid.lifeStage === 'child' && kid.ageOneDay() === null && kid.lifeStage === 'child' && kid.isChild);
    kid.growUp();
    check('büyüyen çocuk 18 yaşında Genç evresine geçer (görünüşü genç fularlı)', kid.lifeStage === 'youth' && kid.age === 18 && kid.ageInDays === 18 * Y && kid.agedDays === 0 && kid.look.stage === 'youth' && !kid.look.child);

    // --- Gün dönümünde yaşlanma ---
    const sys = S().lifeStages;
    const before = new Map(st().characters.map((c) => [c.id, c.ageInDays]));
    const merchant = st().characters.find((c) => c.role);
    sys.ageEveryone();
    check('gün dönümünde her kasabalının yaşı bir gün ilerler (ziyaretçi yaşlanmaz)', residents().every((c) => c.ageInDays === before.get(c.id) + 1) && (!merchant || merchant.ageInDays === before.get(merchant.id)));
    let changed = 0;
    const offDay = game.events.on('time:newDay', () => changed++);
    const d0 = st().time.day;
    const daysBefore = new Map(residents().map((c) => [c.id, { days: c.ageInDays, child: c.isChild }]));
    hrs251(25);
    offDay();
    const aged = residents().filter((c) => daysBefore.has(c.id));
    check('gerçek saatle de: 00:00\'da bir kez yaşlanılır', changed === 1 && st().time.day === d0 + 1 && aged.length > 3 && aged.every((c) => c.ageInDays === daysBefore.get(c.id).days + 1 || (daysBefore.get(c.id).child && !c.isChild)), `${changed} gün dönümü`);

    // --- Kıdemli Bilge'ye geçiş ---
    const pool = adultsNow().sort((a, b) => a.id - b.id);
    const sage = pool[0]; // en düşük kimlik: çekirdek kuralında ilk gönüllü o olur
    sage.ageInDays = 70 * Y - 1;
    sage.age = 69;
    events.length = 0;
    const memBefore = sage.memories.length;
    sys.ageEveryone();
    const toast = events.find((e) => e.n === 'toast' && e.p.text.includes(sage.name));
    const elderEntry = st().journal.slice(-6).find((e) => e.icon === 'book' && e.text.includes(sage.name));
    check('70. doğum gününde Kıdemli Bilge olur: olay, kutlama bildirimi, anı', sage.lifeStage === 'elder' && sage.age === 70 && events.some((e) => e.n === 'lifeStage:changed' && e.p.character === sage && e.p.from === 'adult' && e.p.to === 'elder') && toast && (sage.memories.length === memBefore + 1 || sage.memories.length === memBefore) && sage.memories[sage.memories.length - 1].kind === 'elder', `${toast?.p.text} | ${sage.lifeStage} ${sage.age} mem ${memBefore}->${sage.memories.length} last ${sage.memories[sage.memories.length - 1]?.kind} ev ${events.map((e) => e.n).join(',')}`);
    check('Kasaba Günlüğü\'ne kutlama cümlesi düşer ("... kıdemli bir bilgesi oldu, gençlere yol gösterecek!" ve benzerleri)', LD.ELDER_LINES.map((l) => l.replace('{name}', sage.name)).includes(elderEntry?.text) && st().lifeStages.elders >= 1 && toast?.p.text === st().lifeStages.lastElderLine && elderEntry.text === toast.p.text, `${elderEntry?.text} / ${toast?.p.text}`);
    check('bilge ölmez / silinmez: kasabada kalır, emekli olur', st().characters.includes(sage) && sage.retired && !sage.away);
    check('bilge görünüşü: kırlaşmış saç ve baston (aynı 12x18 boyut), sprite yetişkinden farklı', (() => {
      const a = ART.getCharacterSprite(sage.appearance, 'down', 'idle0', { ...sage.look, stage: null });
      const e = ART.getCharacterSprite(sage.appearance, 'down', 'idle0', sage.look);
      return sage.look.stage === 'elder' && e.width === a.width && e.height === a.height && e.toDataURL() !== a.toDataURL() && CH.lookKey(sage.look).endsWith('E');
    })());
    check('oturan bilge bastonu bırakır; genç fularlı; çocuk silüeti küçük kalır', (() => {
      const p = sage.appearance;
      const sit = ART.getCharacterSprite(p, 'down', 'sit0', { stage: 'elder' });
      const sitA = ART.getCharacterSprite(p, 'down', 'sit0', {});
      const youth = ART.getCharacterSprite(p, 'right', 'walk0', { stage: 'youth' });
      const adult = ART.getCharacterSprite(p, 'right', 'walk0', {});
      const child = ART.getCharacterSprite(p, 'down', 'idle0', { child: true, stage: 'elder' });
      const child0 = ART.getCharacterSprite(p, 'down', 'idle0', { child: true });
      return sit.toDataURL() !== sitA.toDataURL() && youth.toDataURL() !== adult.toDataURL() && child.height === 14 && child.toDataURL() === child0.toDataURL();
    })());

    // --- Emeklilik ve çekirdek sakin kuralı ---
    const origin = { x: sage.tileX, y: sage.tileY };
    check('emekli bilge ağır işlere gitmez (iş bulucu boş döner, sabit iş yeri olsa bile)', S().jobs.findWorkFor(sage, origin) === null && (() => {
      const b = st().buildings.find((x) => x.functional && x.workerSlots);
      const prev = sage.workplaceId;
      sage.workplaceId = b?.id ?? null;
      const r = S().jobs.findWorkFor(sage, origin);
      sage.workplaceId = prev;
      return r === null;
    })());
    check('emekli bilge itfaiye / baskın savunmasına ve keşif seferine sayılmaz', !CR.ablePeople(st()).includes(sage) && !EX.idleAdults(st().characters).includes(sage));
    check('emekli bilge kasaba refahına +1 katar (en çok +3)', LS.elderWelfare(st()) === Math.min(3, residents().filter((c) => c.retired).length) && LS.elderWelfare(st()) >= 1);
    const others = adultsNow();
    const keep = others.slice(0, 2);
    const fake = others.slice(2);
    for (const c of fake) {
      c.lifeStage = 'elder';
      c.retired = true; // zaten emekli bilgeler
    }
    events.length = 0;
    sys.refreshRetirement();
    const elders = residents().filter((c) => c.lifeStage === 'elder').sort((a, b) => a.id - b.id);
    const volunteers = elders.filter((c) => !c.retired);
    check('çekirdek sakin güvencesi: 2 yetişkin kalınca en düşük kimlikli bilge gönüllü usta olarak çalışır (en az 3 çalışan)', keep.length === 2 && volunteers.length === 1 && volunteers[0] === elders[0] && LS.coreWorkers(st()).length + volunteers.length === 3 && events.some((e) => e.n === 'lifeStage:retired' && e.p.retired === false) && lastJournal().includes('gönüllü usta'), lastJournal());
    check('gönüllü bilge emekli sayılmaz: savunmaya sayılır, refah yalnızca emeklileri sayar (en çok +3)', volunteers[0] === sage && CR.ablePeople(st()).includes(sage) && LS.elderWelfare(st()) === Math.min(3, elders.length - 1));
    for (const c of fake) c.lifeStage = 'adult';
    sys.refreshRetirement();
    check('yeterli yetişkin dönünce bilge yeniden emekli olur (günlük notu); eski "bilgeler" emekli değil', sage.retired && fake.every((c) => !c.retired) && lastJournal().includes('yeniden emekliliğin'), lastJournal());
    check('refah bonusu townHappinessBonus\'a eklenir (bilge yokken 0)', (() => {
      const withSage = TS.townHappinessBonus(st());
      sage.retired = false;
      const without = TS.townHappinessBonus(st());
      sage.retired = true;
      return Math.abs(withSage - without - 1) < 1e-9;
    })());

    // --- Boş zaman: çardak, bank, kütüphane ---
    const brain = S().behavior.brain;
    const sedentary = new Set(['bench', 'gazebo', 'fountain', 'shade', 'readBench', 'readLibrary', 'campfire', 'inn', 'monument', 'ancientSpring']);
    const share = (c) => {
      let n = 0;
      let total = 0;
      for (let i = 0; i < 120; i++) {
        const p = brain.planLeisure(c, 15);
        if (!p) continue;
        total++;
        if (sedentary.has(p.activity)) n++;
      }
      return total ? n / total : 0;
    };
    const adultRef = adultsNow()[0];
    const elderShare = share(sage);
    const adultShare = share(adultRef);
    check('bilge boş zamanında çardak, bank, havuz ve kütüphaneyi yeğler (yetişkinden belirgin fazla)', elderShare > adultShare + 0.15 && elderShare > 0.5, `bilge %${Math.round(elderShare * 100)}, yetişkin %${Math.round(adultShare * 100)}`);

    // --- Bilge Nasihati ---
    const listener = adultRef;
    const kidNear = residents().find((c) => c.isChild);
    sage.visible = true;
    sage.task = { activity: 'bench', phase: 'perform', elapsed: 0 };
    listener.visible = true;
    listener.task = { activity: 'wait', phase: 'perform', elapsed: 0 };
    listener.x = sage.x + 10;
    listener.y = sage.y;
    listener.needs.fun = 40;
    listener.needs.social = 40;
    const advice0 = st().lifeStages.adviceMinutes;
    sys.update({ gameMinutes: 100 });
    check('Bilge Nasihati: boş zamanını geçiren bilgenin yanındaki yetişkinin keyfi ve sosyalliği dolar', Math.abs(listener.needs.fun - (40 + 100 * LD.ELDER.advice.fun)) < 1e-6 && Math.abs(listener.needs.social - (40 + 100 * LD.ELDER.advice.social)) < 1e-6 && st().lifeStages.adviceMinutes === advice0 + 100, `${listener.needs.fun.toFixed(2)} / ${listener.needs.social.toFixed(2)}`);
    listener.x = sage.x + LD.ELDER.advice.radius + 20;
    listener.needs.fun = 40;
    sys.update({ gameMinutes: 100 });
    check('uzaktaki sakin nasihat duymaz', listener.needs.fun === 40);
    listener.x = sage.x + 10;
    sage.task = { activity: 'sleep', phase: 'perform', elapsed: 0 };
    sys.update({ gameMinutes: 100 });
    check('uyuyan / çalışan bilge nasihat vermez', listener.needs.fun === 40);
    sage.retired = false;
    sage.task = { activity: 'bench', phase: 'perform', elapsed: 0 };
    sys.update({ gameMinutes: 100 });
    check('gönüllü (çalışan) bilge de nasihat vermez; yalnızca emekliler', listener.needs.fun === 40);
    sage.retired = true;
    sage.task = null;
    listener.task = null;

    // --- Genç -> Yetişkin ---
    const young = adultsNow().find((c) => c !== sage && c !== listener) ?? adultsNow()[1];
    young.ageInDays = 21 * Y - 1;
    young.age = 20;
    young.lifeStage = 'youth';
    young.profile = young.buildProfile();
    sys.ageEveryone();
    check('21. doğum gününde Genç, Yetişkin olur (günlük notu)', young.lifeStage === 'adult' && young.age === 21 && lastJournal().includes(`${young.name} 21 yaşına bastı`), lastJournal());

    // --- İzole üreteç ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'lifeStages' && v && v.rng && Number.isFinite(v.rng.state)).map(([k, v]) => [k, v.rng]);
    const states = rngs.map(([, r]) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const t = adultsNow()[2];
    t.ageInDays = 70 * Y - 1;
    t.age = 69;
    for (let i = 0; i < 20; i++) sys.ageEveryone();
    sys.refreshRetirement();
    sys.update({ gameMinutes: 30 });
    Math.random = realRandom;
    check('yaşlanma, evre geçişi, emeklilik ve nasihat ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 27)', rngs.length > 5 && rngs.every(([, r], i) => r.state === states[i]) && randomCalls === 0 && sys.rng !== S().behavior.rng && t.lifeStage === 'elder', `${rngs.length} üreteç, Math.random ${randomCalls}`);

    // --- Gönül ilişkisinde yaş farkı ---
    const [p1, p2] = [mk(27), mk(41)];
    const gap0 = LS.ageGap(p1, p2);
    let stable = true;
    for (let i = 0; i < 40; i++) {
      p1.ageOneDay();
      p2.ageOneDay();
      if (LS.ageGap(p1, p2) !== gap0) stable = false;
    }
    check('gönül ilişkisinde yaş farkı kuşak yaşına göre: doğum günleri farkı günden güne değiştirmez (27 / 41 -> 14)', gap0 === 14 && stable && RS.canRomance(p1, p2));
    const g18 = mk(5, { growsUpAt: 1 });
    g18.growUp();
    for (let i = 0; i < 40; i++) g18.ageOneDay();
    check('büyüyen çocuğun kuşak yaşı 18: 32 yetişkini (fark 14) aşık olabilir, 33 olamaz', LS.ageGap(g18, mk(32)) === 14 && LS.ageGap(g18, mk(33)) === 15 && g18.age === 20);

    // --- Karakter Detay Kartı ---
    game.events.emit('ui:selectCharacter', sage.id);
    game.render(0);
    const badge = document.querySelector('.character-panel .life-stage-badge');
    const row = document.querySelector('.character-panel .life-stage-row')?.textContent ?? '';
    check('kartta yaşam evresi rozeti: Kıdemli Bilge, yaşı ve "Emekli"', badge?.classList.contains('is-elder') && badge.textContent.includes('Kıdemli Bilge') && row.includes(`${sage.age} yaşında`) && row.includes('Emekli') && badge.title.includes('doğum gününe'), row);
    game.events.emit('ui:selectCharacter', residents().find((c) => c.lifeStage === 'adult').id);
    game.render(0);
    const row2 = document.querySelector('.character-panel .life-stage-row')?.textContent ?? '';
    check('yetişkinin rozeti Yetişkin', document.querySelector('.character-panel .life-stage-badge')?.classList.contains('is-adult') && row2.includes('Yetişkin') && row2.includes('yaşında'), row2);
    const child = residents().find((c) => c.isChild);
    if (child) {
      game.events.emit('ui:selectCharacter', child.id);
      game.render(0);
      check('çocuğun rozeti Çocuk', document.querySelector('.character-panel .life-stage-badge')?.classList.contains('is-child'));
    }
    game.events.emit('ui:selectCharacter', null);

    // --- Kayıt (sürüm 24) ---
    st().lifeStages.adviceMinutes = 321;
    const snap = residents().map((c) => `${c.id}:${c.lifeStage}:${c.ageInDays}:${c.agedDays}`).join('|');
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: yaşam evresi, gün cinsinden yaş ve sayaçlar kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && raw.characters.every((c) => LS.isLifeStage(c.lifeStage) && Number.isInteger(c.ageInDays) && Number.isInteger(c.agedDays)) && raw.lifeStages.adviceMinutes === 321 && raw.characters.every((c) => !('retired' in c)));
    game.events.emit('ui:load');
    const back = residents().map((c) => `${c.id}:${c.lifeStage}:${c.ageInDays}:${c.agedDays}`).join('|');
    const sage2 = st().characters.find((c) => c.id === sage.id);
    check('kayıttan evreler, yaşlar ve sayaçlar birebir döner; emeklilik yeniden hesaplanır', back === snap && st().lifeStages.adviceMinutes === 321 && sage2.lifeStage === 'elder' && sage2.retired && sage2.profile.elder);
    // Bozuk değerler
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const b0 = bad.characters.find((c) => !c.growsUpAt && c.lifeStage === 'adult');
    b0.lifeStage = 'zombi';
    b0.ageInDays = -40;
    b0.age = 33;
    const b1 = bad.characters.find((c) => c.id === sage.id);
    b1.ageInDays = 'yetmiş';
    b1.age = 71;
    bad.lifeStages = { adviceMinutes: 'çok', elders: -3 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    const c0 = st().characters.find((c) => c.id === b0.id);
    const c1 = st().characters.find((c) => c.id === b1.id);
    check('bozuk evre ve yaş sayacı yaştan yeniden kurulur, bozuk sayaçlar sıfırlanır', c0.lifeStage === 'adult' && c0.age === 33 && c0.ageInDays === LS.daysForAge(33, c0.id) && c1.lifeStage === 'elder' && c1.age === 71 && st().lifeStages.adviceMinutes === 0 && st().lifeStages.elders === 0);
    // Eski (v23) kayıt
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 23;
    delete old.lifeStages;
    for (const c of old.characters) {
      delete c.lifeStage;
      delete c.ageInDays;
      delete c.agedDays;
      if (!c.growsUpAt && c.age >= 70) c.age = 66; // v23'te bilge yoktu
    }
    const ages = new Map(old.characters.map((c) => [c.id, c.age]));
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v23 kaydı: evresi olmayan yetişkinler (18-20 yaşındakiler de) Yetişkin, çocuklar Çocuk; yaşlar aynı, bilge yok, sayaçlar boş', residents().every((c) => (c.isChild ? c.lifeStage === 'child' : c.lifeStage === 'adult') && (c.isChild || c.age === ages.get(c.id)) && c.agedDays === 0) && residents().some((c) => !c.isChild && c.age < 21) && !residents().some((c) => c.retired) && JSON.stringify(st().lifeStages) === JSON.stringify(LS.emptyLifeStages()));
    check('yetişkinlik geri dönmez: Yetişkin evresindeki 19 yaşındaki sakin Genç\'e dönmez', LS.stageFor({ age: 19, lifeStage: 'adult' }) === 'adult' && (() => { const c = residents().find((x) => !x.isChild && x.age < 21); c.ageOneDay(); return c.lifeStage === 'adult'; })());
    const dd = st().time.day;
    hrs251(26);
    check('v23 kasabası bir gün sorunsuz yaşar, yaşlar ilerler', st().time.day >= dd + 1 && residents().every((c) => LS.isLifeStage(c.lifeStage) && c.agedDays >= 1));
    offs.forEach((off) => off());
  }

  // ===== 25. aşama (25.2): Usta-Çırak sistemi ve mesleki eğitim =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const AD = await import('/src/data/apprenticeship.js');
    const AP = await import('/src/systems/Apprenticeship.js');
    const CZ = await import('/src/data/citizens.js');
    const CI = await import('/src/systems/Citizens.js');
    const ACT = (await import('/src/data/activities.js')).ACTIVITIES;
    const SK = await import('/src/systems/SkillSystem.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    const Y = 16;
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const sys = () => S().apprenticeship;
    const events = [];
    const offs = ['apprentice:enrolled', 'apprentice:released', 'apprentice:graduated', 'apprentice:crafted', 'apprentice:proud', 'toast'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    const journal = () => st().journal.slice(-6).map((e) => e.text).join(' / ');
    const hrs252 = (h) => {
      for (let i = 0; i < h; i++) {
        const active = st().dilemma.active;
        if (active) {
          const o = active.options?.find((x) => x.default) ?? active.options?.[0];
          if (o) game.events.emit('ui:chooseDilemma', { optionId: o.id });
          st().dilemma.active = null;
        }
        st().time.paused = false;
        st().time.speed = 4;
        hours(1);
      }
    };
    const makeYouth = (c, age = 19) => {
      c.ageInDays = age * Y;
      c.agedDays = 0;
      c.age = age;
      c.lifeStage = 'youth';
      c.profile = c.buildProfile();
      c.apprenticeship = null;
      c.workplaceId = null;
      return c;
    };

    // --- Veri ---
    check('yedi zanaat dalı altı yapıda: Demirci / Terzi, Marangoz, Şifacı, Fırıncı, Dokumacı, Şerbethane Ustası', AD.PROFESSION_TYPES.join() === 'workshop,lumberHut,healerHut,mill,loom,brewery' && AD.PROFESSIONS.workshop.name.includes('Terzi') && AD.PROFESSIONS.brewery.master === 'Şerbethane Ustası' && AD.PROFESSION_TYPES.every((t) => SK.levelFor && AD.PROFESSIONS[t].lines.master.length >= 3 && AD.PROFESSIONS[t].lines.apprentice.length >= 3));
    check('her dalın çırak işi çantaya girebilen, değeri olan bir eşya (Acemi Çivisi, Basit Bez, Kıtır Kurabiye...)', AD.PROFESSION_TYPES.every((t) => CZ.ITEMS[AD.PROFESSIONS[t].item]?.craft && CZ.ITEMS[AD.PROFESSIONS[t].item].value > 0) && CZ.ITEMS.noviceNails.name === 'Acemi Çivisi' && CZ.ITEMS.plainCloth.name === 'Basit Bez' && CZ.ITEMS.crispCookie.name === 'Kıtır Kurabiye' && CZ.ITEMS.crispCookie.food);
    check('çırak etkinliği: mesai işi, taburede oturur, üretim yok', ACT.apprentice.kind === 'work' && ACT.apprentice.pose === 'sit' && !ACT.apprentice.effects);
    check('çırak verisi temizlenir: geçersiz dal / yapı reddedilir, ilerleme 0-100', AP.sanitizeApprenticeship({ profession: 'kuyumcu', buildingId: 3 }) === null && AP.sanitizeApprenticeship({ profession: 'mill' }) === null && AP.sanitizeApprenticeship({ profession: 'mill', buildingId: 3, progress: 250, masterId: 'x' }).progress === 100 && AP.sanitizeApprenticeship({ profession: 'mill', buildingId: 3, progress: -5 }).progress === 0 && AP.sanitizeApprenticeship({ profession: 'mill', buildingId: 3 }).masterId === null);
    check('mezuniyet: %100 Yetkin Usta (Usta kademesi), %60 Kıdemli Kalfa, altı kısmi deneyim', AP.graduationFor(100).title === 'Yetkin Usta' && SK.levelFor(AP.graduationFor(100).xp).level === 3 && AP.graduationFor(75).title === 'Kıdemli Kalfa' && SK.levelFor(AP.graduationFor(75).xp).level === 2 && AP.graduationFor(30).title === null && AP.graduationFor(30).xp === 180);

    // --- Hazırlık: oduncu kulübesi, usta ve genç ---
    sim.give({ wood: 400, stone: 300, iron: 80, food: 400, bread: 60 });
    const hut = sim.place('lumberHut');
    const adults = st().characters.filter((c) => !c.role && !c.isChild && !c.away && c.lifeStage !== 'elder' && !c.emigrating).sort((a, b) => a.id - b.id);
    const youth = makeYouth(adults[adults.length - 1]);
    const master = adults[0];
    master.workplaceId = hut.id;
    master.skills.woodcutting = 1600;
    master.lifeStage = 'adult';
    check('Genç çırak olabilir, yetişkin olamaz; yetişkin usta olabilir, Genç olamaz', AP.canApprentice(youth) && !AP.canApprentice(master) && AP.canMaster(master) && !AP.canMaster(youth));
    check('yapının ustası: oraya sabitlenmiş en deneyimli yetişkin', AP.pickMaster(st(), hut) === master);
    check('çırak kapısı başta kapalı, kontenjan 1 (Seviye 2\'de 2)', !AP.doorOpen(st(), hut) && AP.apprenticeSlots(hut) === 1 && AP.apprenticeSlots({ upgraded: true }) === 2 && AP.acceptsApprentice(st(), hut));

    // --- Çırak kapısı kapalıyken hiçbir şey değişmez ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'apprenticeship' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const before = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    for (let h = 0; h < 24; h++) sys().hourly(h);
    sys().shiftEnded(youth);
    Math.random = realRandom;
    check('kapı kapalıyken sabah kimse çırak yazılmaz; çıraklık ana üreteçleri ve Math.random\'u tüketmez', !youth.apprenticeship && rngs.every((r, i) => r.state === before[i]) && randomCalls === 0 && sys().rng !== S().behavior.rng);

    // --- Oyuncu çırak yazar ---
    events.length = 0;
    game.events.emit('ui:enrollApprentice', { characterId: youth.id, buildingId: hut.id });
    const a = youth.apprenticeship;
    check('"Çırak Al": Genç oduncu kulübesine çırak yazılır { masterId, profession, progress: 0 }', a && a.masterId === master.id && a.profession === 'lumberHut' && a.buildingId === hut.id && a.progress === 0 && events.some((e) => e.n === 'apprentice:enrolled') && journal().includes('Marangozluk çıraklığına başladı'), journal());
    check('kontenjan dolu: ikinci genç aynı kulübeye yazılamaz', (() => {
      const other = makeYouth(adults[adults.length - 2]);
      const ok = !sys().enroll(other, hut);
      other.lifeStage = 'adult';
      other.profile = other.buildProfile();
      other.ageInDays = 30 * Y;
      other.age = 30;
      return ok && !AP.acceptsApprentice(st(), hut);
    })());

    // --- Plan: ustası tezgâhtayken taburesine, değilse her zamanki işine ---
    master.task = null;
    check('ustası tezgâhta değilken çırak planı yok (her zamanki işine döner)', sys().planFor(youth) === null);
    master.task = { activity: 'lumber', workBuildingId: hut.id, buildingId: hut.id, phase: 'perform', elapsed: 0, finalPoint: { x: hut.center.x, y: hut.center.y } };
    const plan = sys().planFor(youth);
    check('ustası tezgâhtayken çırak onun yanındaki taburesine gider (yer ayırmaz, üretim yuvası almaz)', plan?.activity === 'apprentice' && plan.buildingId === hut.id && !plan.reserve && !plan.workBuildingId && plan.finalPoint.x === hut.center.x + AD.APPRENTICE.standOffset.x);
    const food0 = s0.resources.food;
    s0.resources.food = 0;
    s0.resources.bread = 0;
    const pantry0 = s0.pantry.credit;
    s0.pantry.credit = 0;
    check('kasabada gıda kıtlığı varken çırak tezgâha değil işe koşar', sys().planFor(youth) === null && !AP.townCanSpare(st()));
    s0.resources.food = food0 + 400;
    s0.resources.bread = 60;
    s0.pantry.credit = pantry0;

    // --- Öğrenme, Gururlu Usta, verim ---
    const task = { activity: 'apprentice', buildingId: hut.id, phase: 'perform', elapsed: 0 };
    youth.task = task;
    const e0 = youth.needs.energy = 80;
    events.length = 0;
    const ok = sys().learn(youth, task, 60);
    check('bir mesai saatinde ilerleme %1,67 (60 saatte %100), çırak yarı yorulur', ok && Math.abs(youth.apprenticeship.progress - 60 * AD.APPRENTICE.perMinute) < 1e-9 && youth.needs.energy < e0 && youth.needs.energy > e0 - 1 && youth.activityLabel.includes(master.name), youth.activityLabel);
    check('Gururlu Usta: yanında çırağı çalışan ustanın morali (keyfi yavaş düşer) ve günlük notu', master.buffs.proudMaster > st().totalMinutes && events.some((e) => e.n === 'apprentice:proud' && e.p.master === master) && journal().includes('gurur duyuyor'), journal());
    check('Gururlu Usta etkisi: NeedsSystem\'de ustanın keyfi %25 yavaş düşer', (() => {
      const NS = S().systems.find((x) => x.constructor.name === 'NeedsSystem');
      const other = adults[1];
      const f = (c) => { c.needs.fun = 80; };
      f(master); f(other);
      const sm = master.buffs.proudMaster;
      // aynı koşulda karşılaştırmak için profilleri ve öteki bonusları eşitle
      const pm = master.profile, po = other.profile;
      const bm = master.buffs, bo = other.buffs;
      master.buffs = { proudMaster: st().totalMinutes + 600 };
      other.buffs = {};
      const im = master.inventory, io = other.inventory; // (25.5) Ata Mirası Gururu karışmasın
      master.inventory = [];
      other.inventory = [];
      const tm = master.task, to = other.task;
      master.task = other.task = null;
      master.profile = other.profile;
      const vis = [master.visible, other.visible];
      master.visible = other.visible = false;
      NS.update({ gameMinutes: 60, hour: 12 });
      const dm = 80 - master.needs.fun, dO = 80 - other.needs.fun;
      master.profile = pm; other.profile = po;
      [master.visible, other.visible] = vis;
      master.buffs = bm; other.buffs = bo;
      master.inventory = im; other.inventory = io;
      master.task = tm; other.task = to;
      master.buffs.proudMaster = sm;
      return dm > 0 && Math.abs(dm / dO - AD.PROUD_MASTER.funDecay) < 0.02;
    })());
    check('çırak %50\'nin altındayken ustanın verimi değişmez', sys().masterBoost(master, master.task) === 1);
    youth.apprenticeship.progress = 55;
    check('çırak %50\'yi geçince getir-götür işi ustanın tezgâhına +%5 verim', sys().masterBoost(master, master.task) === AD.PROUD_MASTER.workBoost);
    check('çıraksız sakinin çalışmasına çarpan uygulanmaz (tam olarak 1)', sys().masterBoost(adults[1], { workBuildingId: hut.id }) === 1);
    master.task = null;
    check('usta tezgâhtan kalkınca çırak da kalkar (görev biter)', sys().learn(youth, task, 1) === false);

    // --- Çırak İşi ---
    youth.inventory = [];
    let crafted = 0;
    for (let i = 0; i < 40 && crafted < 2; i++) {
      sys().shiftEnded(youth);
      crafted = CI.countItem(youth, 'woodenSpoon');
    }
    check('Çırak İşi: %50\'den sonra mesai sonunda hammadde tüketmeden çantaya Tahta Kaşık; ilk iş anısı ve günlüğü', crafted >= 1 && youth.apprenticeship.crafted >= 1 && youth.memories.some((m) => m.kind === 'apprentice' && m.text.includes('tahta kaşık')) && st().apprenticeship.crafted >= 1, `${crafted} kaşık`);
    const wood0 = s0.resources.wood;
    youth.apprenticeship.progress = 20;
    const c0 = youth.apprenticeship.crafted;
    for (let i = 0; i < 20; i++) sys().shiftEnded(youth);
    check('%50\'nin altında çırak işi çıkmaz; kasaba stoğu hiç azalmaz', youth.apprenticeship.crafted === c0 && s0.resources.wood === wood0);
    youth.apprenticeship.progress = 60;
    if (!st().buildings.some((b) => b.type === 'market' && b.functional)) sim.place('market');
    youth.inventory = [{ kind: 'woodenSpoon', qty: 3 }];
    const coins0 = youth.coins;
    sys().shiftEnded(youth);
    check('3 çırak işi birikince Pazar Yeri\'nde satılır (kesesine değeri kadar altın)', CI.countItem(youth, 'woodenSpoon') <= 1 && youth.coins >= coins0 + 6 && st().apprenticeship.sold >= 3, `${coins0} -> ${youth.coins}`);

    // --- Sözler (metin baloncuğu, ikon balonuna dokunmaz) ---
    master.task = { activity: 'lumber', workBuildingId: hut.id, buildingId: hut.id, phase: 'perform', elapsed: 0 };
    youth.visible = master.visible = true;
    youth.bubble = null;
    master.bubble = null;
    let spoke = null;
    for (let i = 0; i < 200 && !spoke; i++) {
      youth.speech = master.speech = null;
      sys().learn(youth, task, 30);
      spoke = youth.speech ?? master.speech;
    }
    const allLines = [...AD.PROFESSIONS.lumberHut.lines.master, ...AD.PROFESSIONS.lumberHut.lines.apprentice];
    check('usta ve çırak konuşur ("Öğreniyorum ustam!", "Ölç iki kere, kes bir kere!"...); ikon balonu boş kalır', spoke && allLines.includes(spoke.text) && youth.bubble === null && master.bubble === null, spoke?.text);
    check('tabure ve konuşma baloncuğu çizilir (sprite 8x4)', UI.getStoolSprite().width === 8 && UI.getStoolSprite().height === 4 && (() => { try { game.render(0); return true; } catch { return false; } })());

    // --- Gerçek saatlerle mesai ---
    youth.apprenticeship.progress = 10;
    master.task = null;
    youth.task = null;
    const p0 = youth.apprenticeship.progress;
    let seen = 0;
    for (let h = 0; h < 40; h++) {
      hrs252(1);
      if (youth.task?.activity === 'apprentice' && youth.task.phase === 'perform') seen++;
    }
    check('gerçek mesaide çırak ustasının yanında oturup öğrenir (ilerleme artar, görev "apprentice")', youth.apprenticeship && youth.apprenticeship.progress > p0 + 2 && seen > 0, `%${p0} -> %${youth.apprenticeship?.progress.toFixed(1)} · ${seen} saat`);

    // --- Karakter Detay Kartı ---
    game.events.emit('ui:selectCharacter', youth.id);
    game.render(0);
    const card = document.querySelector('.character-panel .apprentice-box')?.textContent ?? '';
    check('çırağın kartında ustası, meslek dalı ve "%X Çıraklık" çubuğu', card.includes(master.name) && card.includes('Marangozluk') && /%\d+ Çıraklık/.test(card) && document.querySelector('.character-panel .apprentice-fill'), card);
    game.events.emit('ui:selectCharacter', master.id);
    game.render(0);
    const card2 = document.querySelector('.character-panel .apprentice-box')?.textContent ?? '';
    check('ustanın kartında "Çırağı: [İsim]"', card2.includes('Çırağı') && card2.includes(youth.name), card2);
    game.events.emit('ui:selectBuilding', hut.id);
    game.render(0);
    const panel = document.querySelector('.building-apprentice');
    check('atölye panelinde Çırak Kapısı, usta ve çırağın ilerlemesi', panel && !panel.hidden && panel.textContent.includes('Çırak Kapısı') && panel.textContent.includes(youth.name), panel?.textContent);
    panel.querySelector('.apprentice-door')?.click();
    check('Çırak Kapısı düğmesi kapıyı açar', AP.doorOpen(st(), hut));
    game.events.emit('ui:selectBuilding', null);
    game.events.emit('ui:selectCharacter', null);

    // --- Kayıt (sürüm 25) ---
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const snap = JSON.stringify(youth.apprenticeship);
    check('kayıt sürümü 32: çıraklık, açık kapılar ve sayaçlar kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && JSON.stringify(raw.characters.find((c) => c.id === youth.id).apprenticeship) === snap && raw.apprenticeship.open.includes(hut.id) && raw.apprenticeship.enrolled >= 1);
    game.events.emit('ui:load');
    const y2 = st().characters.find((c) => c.id === youth.id);
    check('kayıttan çıraklık, kapı ve sayaçlar birebir döner', JSON.stringify(y2.apprenticeship) === snap && AP.doorOpen(st(), st().buildings.find((b) => b.id === hut.id)) && st().apprenticeship.crafted >= 1);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.characters.find((c) => c.id === youth.id).apprenticeship = { profession: 'simyacı', buildingId: hut.id };
    const adultRaw = bad.characters.find((c) => c.id === master.id);
    adultRaw.apprenticeship = { profession: 'mill', buildingId: hut.id, progress: 40 };
    bad.apprenticeship = { open: [hut.id, 999999, 'x'], enrolled: -2, minutes: 'uzun' };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk çıraklık temizlenir (bilinmeyen dal, yetişkine çıraklık, var olmayan kapı, bozuk sayaç)', !st().characters.find((c) => c.id === youth.id).apprenticeship && !st().characters.find((c) => c.id === master.id).apprenticeship && st().apprenticeship.open.join() === String(hut.id) && st().apprenticeship.enrolled === 0 && st().apprenticeship.minutes === 0);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 24;
    delete old.apprenticeship;
    for (const c of old.characters) delete c.apprenticeship;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v24 kaydı: çırak yok, kapılar kapalı, sayaçlar boş', !st().characters.some((c) => c.apprenticeship) && JSON.stringify(st().apprenticeship) === JSON.stringify(AP.emptyApprenticeshipState()));

    // --- Sabah kapısı ve mezuniyet ---
    const hut2 = st().buildings.find((b) => b.id === hut.id);
    const yy = makeYouth(st().characters.find((c) => c.id === youth.id), 20);
    const m2 = st().characters.find((c) => c.id === master.id);
    m2.workplaceId = hut2.id;
    game.events.emit('ui:toggleApprenticeDoor', { buildingId: hut2.id });
    S().apprenticeship.hourly(AD.APPRENTICE.enrollHour);
    check('açık Çırak Kapısı: boştaki genç sabah 07:00\'de kendiliğinden çırak yazılır', yy.apprenticeship?.buildingId === hut2.id);
    yy.apprenticeship.progress = 100;
    yy.skills.woodcutting = 0;
    yy.ageInDays = 21 * Y - 1;
    events.length = 0;
    S().lifeStages.ageEveryone();
    check('21 yaşında %100 çırak "Yetkin Usta" olarak yetişkinliğe başlar (Usta kademesi, yüksek verim)', yy.lifeStage === 'adult' && !yy.apprenticeship && SK.skillLevel(yy, 'woodcutting').level === 3 && SK.workBonus(yy, 'lumber') > 1.3 && events.some((e) => e.n === 'apprentice:graduated' && e.p.title === 'Yetkin Usta') && journal().includes('Yetkin Usta'), journal());
    const y3 = makeYouth(st().characters.find((c) => c.id !== yy.id && c.id !== m2.id && !c.isChild && !c.role && c.lifeStage === 'adult' && !c.away), 20);
    S().apprenticeship.enroll(y3, hut2);
    y3.apprenticeship.progress = 70;
    y3.skills.woodcutting = 0;
    y3.ageInDays = 21 * Y - 1;
    S().lifeStages.ageEveryone();
    check('%70 ile yetişkin olan "Kıdemli Kalfa" (Kalfa kademesi)', SK.skillLevel(y3, 'woodcutting').level === 2 && y3.skills.woodcutting === AD.GRADUATION.journeymanXp && st().apprenticeship.graduated >= 2);
    offs.forEach((off) => off());
  }

  // ===== 25. aşama (25.3): mizaç kalıtımı, kişilik gelişimi ve yeni nesil huylar =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const SO = await import('/src/data/social.js');
    const TD = await import('/src/data/temperament.js');
    const TM = await import('/src/systems/Temperament.js');
    const CZ = await import('/src/data/citizens.js');
    const CI = await import('/src/systems/Citizens.js');
    const PT = await import('/src/systems/Petitions.js');
    const RF = await import('/src/data/refinery.js');
    const LD = await import('/src/data/lifeStages.js');
    const UI = await import('/src/art/ui/index.js');
    const { Character } = await import('/src/entities/Character.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const sys = () => S().temperament;
    const people = () => st().characters.filter((c) => !c.role && !c.isChild && !c.away && !c.emigrating).sort((a, b) => a.id - b.id);
    const mkChild = (parents) => new Character({ name: 'Minik', age: 5, traits: ['cheerful'], appearance: { hair: 'short', hairColor: 'brown', skin: 'light', shirt: 'sky', pants: 'navy' }, growsUpAt: 1e9, parentIds: parents.map((p) => p.id) });
    const journal = () => st().journal.slice(-5).map((e) => e.text).join(' / ');

    // --- Veri ---
    check('sekiz huy: dört kuruluş huyu + dört yeni nesil huy (Zanaatkâr Ruhu, Girişimci Kanı, Bilge Düşünür, Şenlik Neşesi)', SO.ALL_QUIRK_KEYS.length === 8 && SO.QUIRK_KEYS.join() === 'animalLover,bookworm,musician,natureEnthusiast' && SO.GENERATION_QUIRK_KEYS.join() === 'craftsman,entrepreneur,philosopher,festive' && SO.QUIRKS.craftsman.name === 'Zanaatkâr Ruhu' && SO.QUIRKS.entrepreneur.name === 'Girişimci Kanı' && SO.QUIRKS.philosopher.name === 'Bilge Düşünür' && SO.QUIRKS.festive.name === 'Şenlik Neşesi');
    check('yeni huyların Türkçe açıklaması, renkli rozeti ve 9x9 simgesi var', SO.GENERATION_QUIRK_KEYS.every((k) => SO.QUIRKS[k].description.length > 60 && SO.QUIRKS[k].color && UI.getIconSprite(SO.QUIRKS[k].icon).width === 9 && UI.getIconSprite(SO.QUIRKS[k].icon).height === 9));
    check('yeni huyların her biri dört mizaç sözü taşır', SO.GENERATION_QUIRK_KEYS.every((k) => TD.TEMPERAMENT_LINES[k].length >= 4));
    check('kuruluş / göç dağıtımı 19. aşamanın dört huyuyla kalır (yeni nesil huy sayılmaz, seçilmez)', (() => {
      const before = people().map((c) => c.quirk);
      people().slice(0, 3).forEach((c) => (c.quirk = 'festive'));
      const picks = new Set(Array.from({ length: 30 }, () => S().social.leastCommonQuirk(null)));
      people().forEach((c, i) => (c.quirk = before[i]));
      return [...picks].every((k) => SO.QUIRK_KEYS.includes(k));
    })());

    // --- Gelişim kapısı: Altın Çağ ---
    const [pa, pb] = people();
    const savedSince = s0.goldenAge.since;
    s0.goldenAge.since = null;
    const k0 = mkChild([pa, pb]);
    k0.quirk = 'bookworm';
    sys().onGrownUp(k0);
    check('Altın Çağ başlamadan büyüyen çocuğun huyu değişmez (kule öncesi oyun aynı kalır)', k0.quirk === 'bookworm' && !k0.quirkOrigin && !TM.developmentOpen(st()));
    s0.goldenAge.since = s0.time.day;
    check('Altın Çağ başlayınca kişilik gelişimi açılır', TM.developmentOpen(st()));

    // --- Aile etkisi ve özgün gelişim ---
    pa.quirk = 'festive';
    pb.quirk = 'craftsman';
    let family = 0;
    let self = 0;
    const kinds = new Set();
    for (let i = 0; i < 200; i++) {
      const k = mkChild([pa, pb]);
      k.quirk = 'musician';
      sys().onGrownUp(k);
      if (k.quirkOrigin.kind === 'family') {
        family++;
        if (!['festive', 'craftsman'].includes(k.quirk) || ![pa.name, pb.name].includes(k.quirkOrigin.fromName)) family = -999;
      } else if (k.quirkOrigin.kind === 'self') self++;
      kinds.add(k.quirk);
    }
    check('Aile etkisi: ebeveynlerinden birinin huyunu miras alma olasılığı yüksek (~%60)', family > 95 && family < 145 && family + self === 200, `${family} aile / ${self} özgün`);
    const orphan = mkChild([]);
    orphan.quirk = 'musician';
    const counts = sys().counts(orphan);
    sys().onGrownUp(orphan);
    const min = Math.min(...Object.values(counts));
    check('Özgün gelişim: kasabada en az görülen huylardan biri (sekizi aday, dengeli)', orphan.quirkOrigin.kind === 'self' && counts[orphan.quirk] === min && SO.ALL_QUIRK_KEYS.includes(orphan.quirk), `${orphan.quirk} (${JSON.stringify(counts)})`);
    check('huyun kaynağı, anısı ve Kasaba Günlüğü notu yazılır', pa.quirk && orphan.memories.some((m) => m.kind === 'temperament') && st().temperament.developed >= 201 && st().temperament.family === family && /mizaçla/.test(journal()), journal());

    // --- Usta etkisi ---
    const master = people()[2];
    master.quirk = 'philosopher';
    let own = 0;
    let craft = 0;
    let none = 0;
    for (let i = 0; i < 200; i++) {
      const y = mkChild([]);
      y.quirk = 'animalLover';
      sys().onGraduated({ character: y, profession: 'workshop', progress: 80, masterId: master.id });
      if (y.quirkOrigin?.kind === 'mentor' && y.quirk === 'philosopher') own++;
      else if (y.quirkOrigin?.kind === 'craft' && y.quirk === 'craftsman') craft++;
      else if (!y.quirkOrigin && y.quirk === 'animalLover') none++;
    }
    check('Usta etkisi: %50+ çıraklıkla yetişkin olan ustasının huyunu ya da mesleğin doğasını (Demirci -> Zanaatkâr Ruhu) alır', own > 30 && craft > 30 && none > 50 && own + craft + none === 200, `usta ${own} · meslek ${craft} · değişmedi ${none}`);
    const weak = mkChild([]);
    weak.quirk = 'animalLover';
    for (let i = 0; i < 30; i++) sys().onGraduated({ character: weak, profession: 'workshop', progress: 30, masterId: master.id });
    check('%50 altında biten çıraklık mizacı değiştirmez', weak.quirk === 'animalLover' && !weak.quirkOrigin);
    check('Genç -> Yetişkin (Altın Çağ): usta etkisi olmadıysa mizaç aile etkisiyle ya da özgün olarak olgunlaşır; usta etkisi aynı gün korunur', (() => {
      const y = people()[5];
      const saved = [y.quirk, y.quirkOrigin, y.parentIds];
      y.parentIds = [pa.id];
      y.quirk = 'animalLover';
      y.quirkOrigin = null;
      game.events.emit('lifeStage:changed', { character: y, from: 'youth', to: 'adult' });
      const matured = y.quirkOrigin && ['family', 'self'].includes(y.quirkOrigin.kind);
      y.quirk = 'craftsman';
      y.quirkOrigin = { kind: 'craft', fromId: null, fromName: 'Demircilik ve Terzilik', day: st().time.day };
      game.events.emit('lifeStage:changed', { character: y, from: 'youth', to: 'adult' });
      const keptMentor = y.quirk === 'craftsman' && y.quirkOrigin.kind === 'craft';
      [y.quirk, y.quirkOrigin, y.parentIds] = saved;
      return matured && keptMentor;
    })());
    check('mesleklerin doğası: atölye / kulübe / tezgâh Zanaatkâr, şifacı Bilge Düşünür, fırın ve şerbethane Şenlik Neşesi', TD.PROFESSION_QUIRKS.workshop === 'craftsman' && TD.PROFESSION_QUIRKS.loom === 'craftsman' && TD.PROFESSION_QUIRKS.healerHut === 'philosopher' && TD.PROFESSION_QUIRKS.brewery === 'festive');

    // --- Zanaatkâr Ruhu: atölyede şevk ---
    sim.give({ wood: 400, stone: 300, iron: 80, food: 400, bread: 60, gold: 300, sherbet: 20 });
    const hut = sim.place('lumberHut');
    const [w1, w2] = [people()[3], people()[4]];
    const workRun = (c) => {
      const prof = c.profile;
      const skills = c.skills;
      const buffs = c.buffs;
      const equip = c.equipment;
      c.profile = w2.profile;
      c.skills = {};
      c.buffs = {};
      c.equipment = { tool: null, clothing: null, bag: null };
      c.needs.fun = 80;
      const b0 = hut.productionBuffer;
      S().behavior.performWork(c, { activity: 'lumber', workBuildingId: hut.id, buildingId: hut.id, phase: 'perform' }, 5);
      const out = { amount: hut.productionBuffer - b0, fun: 80 - c.needs.fun };
      Object.assign(c, { profile: prof, skills, buffs, equipment: equip });
      return out;
    };
    w1.quirk = 'craftsman';
    hut.productionBuffer = 0;
    const r1 = workRun(w1);
    w1.quirk = 'musician';
    hut.productionBuffer = 0;
    const r2 = workRun(w1);
    check('Zanaatkâr Ruhu zanaat yapısında %8 hızlı çalışır ve %40 az sıkılır; öteki sakinler aynı', r2.amount > 0 && Math.abs(r1.amount / r2.amount - TD.TEMPERAMENT.craftWorkSpeed) < 1e-6 && Math.abs(r1.fun / r2.fun - TD.TEMPERAMENT.craftFunCost) < 1e-6, `${r1.amount.toFixed(3)} / ${r2.amount.toFixed(3)} · ${r1.fun.toFixed(2)} / ${r2.fun.toFixed(2)}`);

    // --- Pazar ve kese ---
    if (!st().buildings.some((b) => b.type === 'market' && b.functional)) sim.place('market');
    const market = st().buildings.find((b) => b.type === 'market' && b.functional);
    const brain = S().behavior.brain;
    const realNext = brain.citizenRng.next;
    const shopper = people()[5];
    const tryShop = (quirk) => {
      shopper.quirk = quirk;
      shopper.coins = 80;
      shopper.lastShopAt = null;
      shopper.inventory = [];
      brain.citizenRng.next = () => 0.15; // SHOP.chance (0.12) üstünde, x1,5 (0.18) ve x2,5 altında
      const p = brain.planShop(shopper);
      brain.citizenRng.next = realNext;
      return p;
    };
    const shopRes = ['entrepreneur', 'craftsman', 'musician', 'festive'].map((q) => tryShop(q)?.activity ?? null);
    check('Girişimci Kanı ve Zanaatkâr Pazar\'a daha sık uğrar (aynı zar, büyük olasılık); öteki sakinler değişmez', shopRes.join() === 'shop,shop,,', `${shopRes.join()} · ${shopper.name} ${shopper.insideBuildingId} ${shopper.tileX},${shopper.tileY}`);
    const purse = S().purse;
    shopper.quirk = 'craftsman';
    shopper.inventory = [];
    shopper.coins = 40;
    const bought = purse.shop(shopper, market);
    check('Zanaatkâr Ruhu Pazar\'dan tezgâhı için malzeme (Acemi Çivisi) bakar', bought === 'noviceNails' && CI.countItem(shopper, 'noviceNails') === 1 && shopper.coins === 40 - TD.TEMPERAMENT.craftShop.price);
    shopper.quirk = 'entrepreneur';
    shopper.inventory = [];
    shopper.illness = null;
    shopper.exposure = 0;
    shopper.coins = 20;
    const thrift = purse.shop(shopper, market);
    shopper.coins = 60;
    const rich = purse.shop(shopper, market);
    check('Girişimci Kanı kesesini biriktirir: 30 altının altına düşecekse almaz, kesesi bolsa alır', thrift === null && rich !== null, `${thrift} / ${rich}`);
    shopper.coins = 10;
    const paid = purse.pay(shopper, 2);
    shopper.quirk = 'musician';
    const paid2 = purse.pay(shopper, 2);
    check('Girişimci her yevmiyeye +1 pazarlık payı alır', paid === 3 && paid2 === 2);
    shopper.quirk = 'entrepreneur';
    shopper.needs.fun = 50;
    shopper.away = null;
    game.events.emit('trade:contractDone', { contract: { resource: 'cloth', qty: 10 }, gold: 40 });
    check('ihracat sözleşmesi tamamlanınca Girişimcinin keyfi artar ve sevinir', shopper.needs.fun === 50 + TD.TEMPERAMENT.contractFun && (!shopper.visible || shopper.speech?.text === 'Bu işten kâr çıkar!'));

    // --- Şenlik Neşesi: testi, aura, dans ---
    const inn = st().buildings.find((b) => b.type === 'inn' && b.functional) ?? sim.place('inn');
    const guest = people()[6];
    const serve = (quirk, casks) => {
      guest.quirk = quirk;
      guest.inventory = [];
      guest.coins = 50;
      inn.sherbet = casks;
      const task = { activity: 'inn', phase: 'perform' };
      S().refinery.serve(guest, task, inn);
      return CI.countItem(guest, 'sherbetJug');
    };
    check('Şenlik Neşesi\'nin çantasında testi eksik olmaz: handa 2 fıçı kalmışken bile alır (öteki sakin almaz)', serve('festive', 2) === 1 && serve('musician', 2) === 0);
    guest.quirk = 'festive';
    guest.inventory = [{ kind: 'sherbetJug', qty: 1 }];
    inn.sherbet = 6;
    guest.coins = 50;
    S().refinery.serve(guest, { activity: 'inn', phase: 'perform' }, inn);
    check('Şenlik Neşesi iki testi taşır', CI.countItem(guest, 'sherbetJug') === 2);
    guest.needs.fun = 50;
    guest.away = null;
    const isSleep = guest.task;
    guest.task = null;
    S().refinery.drinkJugs();
    check('Şenlik Neşesi keyfi 60\'ın altına inince testiden içer (öteki sakinler 35)', guest.needs.fun > 50 && CI.countItem(guest, 'sherbetJug') === 1);
    guest.task = isSleep;
    const dancer = people()[7] ?? people()[0];
    const near = people()[1];
    dancer.quirk = 'festive';
    near.quirk = 'musician';
    dancer.visible = near.visible = true;
    dancer.task = { activity: 'fountain', phase: 'perform', elapsed: 0 };
    near.task = { activity: 'wait', phase: 'perform', elapsed: 0 };
    near.x = dancer.x + 10;
    near.y = dancer.y;
    near.needs.fun = 40;
    const aura0 = st().temperament.auraMinutes;
    sys().applyFestiveAura([dancer], 100);
    check('Şenlik Neşesi aurası: yanındaki sakinin neşesi yükselir', Math.abs(near.needs.fun - (40 + 100 * TD.TEMPERAMENT.festiveAura.perMinute)) < 1e-6 && st().temperament.auraMinutes === aura0 + 100);
    near.x = dancer.x + 100;
    near.needs.fun = 40;
    sys().applyFestiveAura([dancer], 100);
    check('uzaktaki sakin auradan etkilenmez', near.needs.fun === 40);

    // --- Bilge Düşünür: nasihatten iki kat moral ---
    const sage = people()[2];
    const thinker = people()[3];
    sage.lifeStage = 'elder';
    sage.retired = true;
    sage.visible = thinker.visible = true;
    sage.task = { activity: 'bench', phase: 'perform', elapsed: 0 };
    thinker.task = { activity: 'wait', phase: 'perform', elapsed: 0 };
    thinker.lifeStage = 'adult';
    thinker.x = sage.x + 8;
    thinker.y = sage.y;
    thinker.quirk = 'philosopher';
    thinker.needs.fun = 30;
    S().lifeStages.applyAdvice(50);
    const gainP = thinker.needs.fun - 30;
    thinker.quirk = 'musician';
    thinker.needs.fun = 30;
    S().lifeStages.applyAdvice(50);
    const gainM = thinker.needs.fun - 30;
    check('Bilge Düşünür Kıdemli Bilgelerin nasihatinden iki kat moral alır', gainM > 0 && Math.abs(gainP / gainM - TD.TEMPERAMENT.sageAdvice) < 1e-6, `${gainP.toFixed(2)} / ${gainM.toFixed(2)}`);
    sage.lifeStage = 'adult';
    sage.retired = false;
    sage.task = thinker.task = dancer.task = near.task = null;

    // --- Mizaç sözleri (metin katmanı) ---
    thinker.quirk = 'philosopher';
    thinker.task = { activity: 'bench', phase: 'perform', elapsed: 0 };
    thinker.speech = null;
    thinker.bubble = null;
    for (let i = 0; i < 400 && !thinker.speech; i++) sys().update({ gameMinutes: 5 });
    check('yeni huylar mizacına uygun sözler söyler ("Bilmek, iki kere yaşamaktır."...); ikon balonu boş kalır', thinker.speech && TD.TEMPERAMENT_LINES.philosopher.includes(thinker.speech.text) && thinker.bubble === null, thinker.speech?.text);
    thinker.task = null;

    // --- Zanaatkâr çırak işini saklar ---
    const youth = people()[4];
    youth.lifeStage = 'youth';
    youth.ageInDays = 19 * 16;
    youth.age = 19;
    youth.quirk = 'craftsman';
    youth.apprenticeship = { masterId: null, profession: 'lumberHut', buildingId: hut.id, progress: 60, since: 0, crafted: 0 };
    youth.inventory = [{ kind: 'woodenSpoon', qty: 4 }, { kind: 'woodenSpoon', qty: 1 }];
    S().apprenticeship.shiftEnded(youth);
    const keptC = CI.countItem(youth, 'woodenSpoon');
    youth.quirk = 'musician';
    youth.inventory = [{ kind: 'woodenSpoon', qty: 4 }];
    S().apprenticeship.shiftEnded(youth);
    check('Zanaatkâr Ruhu çırak işlerinden ikisini satmadan çantasında saklar', keptC === TD.TEMPERAMENT.craftKeep && CI.countItem(youth, 'woodenSpoon') === 0, `${keptC}`);
    youth.apprenticeship = null;
    youth.lifeStage = 'adult';
    youth.ageInDays = 30 * 16;
    youth.age = 30;

    // --- Dilekçeler ---
    const P = S().petitions;
    const opt = (quirk) => {
      const c = people()[5];
      c.quirk = quirk;
      return Object.fromEntries(P.optionsFor(c));
    };
    st().tax.rate = 'standard';
    // (27.2) Altın Çağ'da yeni nesil huyların kendi dilekçeleri NEW_GEN_PRIORITY.weight katıdır (öncesinde 25.3'teki 5)
    const { NEW_GEN_PRIORITY } = await import('/src/systems/PetitionSystem.js');
    const kq = st().goldenAge?.since ? NEW_GEN_PRIORITY.weight : 1;
    check('yeni dilekçeler: Zanaatkâr "Atölye Malzemesi", Girişimci "Pazar Harçları", Şenlik "Fazladan Şerbet" (ve Buluşma x5), Bilge Düşünür kitap / araştırma', opt('craftsman').craftTools === 5 * kq && opt('entrepreneur').marketFees === 5 * kq && opt('festive').sherbetCask === 5 * kq && opt('festive').gathering === 5 && (opt('philosopher').books || opt('philosopher').academy || opt('philosopher').research) && !opt('musician').craftTools && !opt('animalLover').marketFees);
    check('dilekçe metinleri Türkçe ve tanımlı', CZ.PETITION_KINDS.marketFees.text.includes('Pazar harçları hafifletilsin') && CZ.PETITION_KINDS.sherbetCask.text.includes('Hana fazladan bir şerbet fıçısı açılsın'));
    const pc = people()[5];
    pc.quirk = 'entrepreneur';
    st().petitions.list = [];
    const pf = P.open(pc, 'marketFees');
    check('Pazar Harçları: iç vergi Düşük kademesine inince karşılanır', !PT.petitionMet(st(), pf) && (() => { st().tax.rate = 'low'; return PT.petitionMet(st(), pf); })() && st().temperament.petitions.marketFees >= 1);
    st().tax.rate = 'standard';
    st().petitions.list = [];
    pc.quirk = 'craftsman';
    const pt = P.open(pc, 'craftTools');
    const iron0 = st().resources.iron;
    P.grant(pt.id);
    check('Atölye Malzemesi "Hemen Karşıla": demir ve odun düşer, dilekçe karşılanır', !P.find(pt.id) && st().resources.iron === iron0 - 6);
    st().petitions.list = [];
    pc.quirk = 'festive';
    inn.sherbet = 2;
    const ps = P.open(pc, 'sherbetCask');
    const sh0 = st().resources.sherbet;
    P.grant(ps.id);
    check('Fazladan Şerbet "Fıçıyı Aç": depodan 3 fıçı hana taşınır, dilekçe karşılanır', !P.find(ps.id) && inn.sherbet === 5 && st().resources.sherbet === sh0 - 3);
    st().petitions.list = [];

    // --- İzole üreteç ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'temperament' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const kk = { parentIds: [pa.id], quirk: 'musician', role: null, memories: [] };
    sys().onGrownUp(kk);
    sys().onGraduated({ character: kk, profession: 'mill', progress: 90, masterId: pa.id });
    dancer.task = { activity: 'fountain', phase: 'perform', elapsed: 0 };
    for (let i = 0; i < 50; i++) sys().update({ gameMinutes: 5 });
    dancer.task = null;
    Math.random = realRandom;
    check('mizaç gelişimi, aura ve sözler ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 29)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && sys().rng !== S().behavior.rng, `${rngs.length} üreteç`);

    // --- Karakter Detay Kartı ---
    const shown = people()[0];
    shown.quirk = 'festive';
    shown.quirkOrigin = { kind: 'family', fromId: pb.id, fromName: pb.name, day: 30 };
    game.events.emit('ui:selectCharacter', shown.id);
    game.render(0);
    const chip = document.querySelector('.character-panel .quirk-chip');
    const social = document.querySelector('.character-panel .social-life')?.textContent ?? '';
    check('kartta renkli huy rozeti (Şenlik Neşesi), açıklaması ve mizacın kaynağı (Aile mirası · kimden)', chip?.classList.contains('quirk-festive') && chip.textContent.includes('Şenlik Neşesi') && chip.title.includes('hana koşar') && social.includes('Aile mirası') && social.includes(pb.name), social);
    game.events.emit('ui:selectCharacter', null);

    // --- Kayıt (sürüm 26) ---
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: yeni huylar, huyun kaynağı ve mizaç sayaçları kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && raw.characters.find((c) => c.id === shown.id).quirk === 'festive' && raw.characters.find((c) => c.id === shown.id).quirkOrigin.kind === 'family' && raw.temperament.developed >= 200);
    const snapT = JSON.stringify(st().temperament);
    game.events.emit('ui:load');
    const sh2 = st().characters.find((c) => c.id === shown.id);
    check('kayıttan yeni huy, kaynağı ve sayaçlar birebir döner (yeni huy yeniden dağıtılmaz)', sh2.quirk === 'festive' && sh2.quirkOrigin?.fromName === pb.name && JSON.stringify(st().temperament) === JSON.stringify(TM.restoreTemperament(JSON.parse(snapT))), `${sh2.quirk} ${JSON.stringify(sh2.quirkOrigin)} ${JSON.stringify(st().temperament)} vs ${snapT}`);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.characters.find((c) => c.id === shown.id).quirkOrigin = { kind: 'büyü', fromName: 3 };
    bad.temperament = { developed: 'çok', petitions: { marketFees: 2, uydurma: 4 } };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk huy kaynağı ve sayaçlar temizlenir', st().characters.find((c) => c.id === shown.id).quirkOrigin === null && st().temperament.developed === 0 && JSON.stringify(st().temperament.petitions) === '{"marketFees":2}');
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 25;
    delete old.temperament;
    for (const c of old.characters) {
      delete c.quirkOrigin;
      if (SO.QUIRKS[c.quirk]?.generation) c.quirk = 'musician'; // v25'te yeni nesil huy yoktu
    }
    const quirks = old.characters.map((c) => `${c.id}:${c.quirk}`).join(',');
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v25 kaydı: eski huylar aynen korunur, huy kaynağı yok, mizaç sayaçları boş', st().characters.map((c) => `${c.id}:${c.quirk}`).join(',') === quirks && st().characters.every((c) => !c.quirkOrigin) && JSON.stringify(st().temperament) === JSON.stringify(TM.emptyTemperament()));
    s0.goldenAge && (st().goldenAge.since = savedSince);
  }

  // ===== 25. aşama (25.4): Aile Kütüğü, yeni evlilikler ve konut mirası =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const LN = await import('/src/systems/Lineage.js');
    const LD = await import('/src/data/lineage.js');
    const RS = await import('/src/systems/RelationshipSystem.js');
    const PT = await import('/src/systems/Petitions.js');
    const { Character } = await import('/src/entities/Character.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const sys = () => S().lineageSystem;
    const people = () => st().characters.filter((c) => !c.role && !c.away && !c.emigrating).sort((a, b) => a.id - b.id);
    const mk = (name, parents = [], age = 25) => new Character({ name, age, traits: ['cheerful'], appearance: { hair: 'short', hairColor: 'brown', skin: 'light', shirt: 'sky', pants: 'navy' }, parentIds: parents.map((p) => p.id) });
    const journal = () => st().journal.slice(-6).map((e) => e.text).join(' / ');
    const events = [];
    const offs = ['lineage:newHome', 'lineage:extendedFamily', 'lineage:housingPetition', 'lineage:handover', 'lineage:gen2Wedding'].map((n) => game.events.on(n, (p) => events.push({ n, p })));

    // --- Veri modeli ---
    check('her sakinin kütük verisi var: kuşak, doğum ebeveynleri, ocak, çocuklar', people().every((c) => Number.isInteger(c.generation) && c.generation >= 1 && Array.isArray(c.parents) && Array.isArray(c.children) && st().lineage.families[c.familyId]));
    check('kurucu ve göçmenler 1. kuşak, kasabada doğanlar ebeveyninin bir fazlası; çocuk listesi ebeveyn kayıtlarıyla tutarlı', people().every((c) => {
      const ps = c.parents.map((id) => st().characters.find((x) => x.id === id)).filter(Boolean);
      return (ps.length ? c.generation === Math.max(...ps.map((p) => p.generation)) + 1 : c.generation === 1) && ps.every((p) => p.children.includes(c.id));
    }));
    check('kuşak adları: 1. Kuşak Kurucu, 1. Kuşak Göçmen, 2. Kuşak Kasabalı, 3. Kuşak Torun', (() => {
      const f = st().chronicle.founders[0];
      const founder = st().characters.find((c) => c.id === f?.id);
      const x = { id: -1, generation: 1 };
      return (!founder || LN.generationName(st(), founder) === '1. Kuşak Kurucu') && LN.generationName(st(), x) === '1. Kuşak Göçmen' && LN.generationName(st(), { id: -2, generation: 2 }) === '2. Kuşak Kasabalı' && LN.generationName(st(), { id: -3, generation: 3 }) === '3. Kuşak Torun';
    })());

    // --- Doğum ve göç ---
    const [ma, pa] = people();
    const baby = mk('Bebek', [ma, pa], 5);
    baby.growsUpAt = 1e9;
    st().characters.push(baby);
    game.events.emit('family:childBorn', { child: baby, parents: [ma, pa], home: st().buildings.find((b) => b.id === ma.homeId) ?? null });
    check('doğum: çocuk ebeveyninin bir fazla kuşağı, ilk ebeveyninin ocağı; ebeveynlerin çocuk listesine girer', baby.generation === Math.max(ma.generation, pa.generation) + 1 && baby.familyId === ma.familyId && ma.children.includes(baby.id) && pa.children.includes(baby.id) && baby.parents.join() === [ma.id, pa.id].join());
    const comer = mk('Gezgin');
    const fams0 = Object.keys(st().lineage.families).length;
    sys().onJoined(comer);
    check('göçmen 1. kuşaktır ve kendi ocağını açar ("[Ad] Ocağı")', comer.generation === 1 && Object.keys(st().lineage.families).length === fams0 + 1 && st().lineage.families[comer.familyId].name === 'Gezgin Ocağı');

    // --- Akrabalık engeli ---
    const sib1 = mk('Kardeş1', [ma, pa]);
    const sib2 = mk('Kardeş2', [ma]);
    const cousin = mk('Kuzen', [comer]);
    check('birinci derece kan bağı: ebeveyn-çocuk ve (üvey de olsa) kardeşler akrabadır; kuzen ve yabancı değildir', LN.closeKin(ma, sib1) && LN.closeKin(sib1, ma) && LN.closeKin(sib1, sib2) && !LN.closeKin(sib1, cousin) && !LN.closeKin(ma, comer));
    sib1.parentIds = [];
    sib2.parentIds = [];
    check('ebeveyni köyden ayrılıp kaydı temizlense de (parentIds boş) kardeşler doğum kaydından tanınır, aşık olamazlar', LN.closeKin(sib1, sib2) && !RS.isFamily(sib1, sib2) && !RS.canRomance(sib1, sib2) && RS.canRomance(sib1, cousin));
    check('ebeveyn ile çocuğu flört edemez (canRomance)', !RS.canRomance(ma, mk('Evlat', [ma])));

    // --- 2. kuşak düğünü: Tarihçe (Altın Çağ öncesinde ev değişmez) ---
    const savedSince = st().goldenAge.since;
    st().goldenAge.since = null;
    st().chronicle.firstGen2Couple = null;
    const g2a = people().find((c) => c.generation === 1 && c !== ma && c !== pa) ?? people()[2];
    const g2b = people().filter((c) => c !== g2a && c !== ma && c !== pa)[0];
    const keep = [g2a.generation, g2b.generation, g2a.homeId, g2b.homeId, g2a.parents, g2b.parents];
    g2a.generation = 2;
    g2a.parents = [ma.id];
    events.length = 0;
    game.events.emit('relationship:married', { a: g2a, b: g2b, venue: null, festival: false });
    const ch = st().chronicle.firstGen2Couple;
    check('Kasabanın 2. Kuşak İlk Düğünü Tarihçe\'ye ve Kasaba Günlüğü\'ne yazılır', ch && ch.a === g2a.name && ch.b === g2b.name && journal().includes('Kasabanın 2. Kuşak İlk Düğünü') && events.some((e) => e.n === 'lineage:gen2Wedding' && e.p.first), journal());
    check('Altın Çağ öncesinde konut mirası evlere dokunmaz (kule öncesi oyun aynı kalır)', !events.some((e) => ['lineage:newHome', 'lineage:extendedFamily', 'lineage:housingPetition'].includes(e.n)));
    events.length = 0;
    game.events.emit('relationship:married', { a: g2a, b: g2b, venue: null, festival: false });
    check('ikinci 2. kuşak düğünü Tarihçe\'deki ilk çifti değiştirmez', st().chronicle.firstGen2Couple.a === ch.a && events.some((e) => e.n === 'lineage:gen2Wedding' && !e.p.first) && st().lineage.gen2Weddings >= 2);
    game.events.emit('ui:toggleStats');
    const archive = document.querySelector('.archive-panel');
    archive.querySelector('.archive-tab[data-tab="chronicle"]').click();
    game.render(0);
    const chText = archive.querySelector('.chronicle-view')?.textContent ?? '';
    check('Arşiv\'deki Tarihçe Kütüğü\'nde altın harflerle: "Kasabanın 2. Kuşak İlk Düğünü: [İsim] & [İsim]"', chText.includes('Kasabanın 2. Kuşak İlk Düğünü') && chText.includes(`${ch.a} & ${ch.b}`), chText.slice(0, 200));
    game.events.emit('ui:toggleStats');

    // --- Yeni Yuva (Altın Çağ) ---
    st().goldenAge.since = st().time.day;
    sim.give({ wood: 600, stone: 400, food: 300 });
    const fresh = sim.place('cabin');
    for (const c of st().characters) if (c.homeId === fresh.id) c.homeId = null;
    events.length = 0;
    const r1 = sys().settle(g2a, g2b);
    check('Yeni Yuva: boş kulübe varsa yeni çift oraya taşınır; reisliği 2. kuşak eş alır', r1 === 'newHome' && g2a.homeId === g2b.homeId && st().characters.filter((c) => c.homeId === g2a.homeId).length === 2 && g2a.relocating && st().lineage.heads[g2a.homeId] === g2a.id && journal().includes('kendi yuvalarını kurdu'), journal());
    // Geniş Aile: boş kulübe yok, çift ebeveyn evinde
    const homeP = st().buildings.find((b) => b.id === ma.homeId);
    g2a.homeId = g2b.homeId = homeP.id; // önce çift ebeveyn evine, sonra boş kulübeler doldurulur
    const blockers = [];
    for (const h of st().buildings.filter((b) => b.type === 'cabin' && b.functional)) {
      if (S().world.getResidents(h).length === 0) {
        const filler = people().find((c) => c !== g2a && c !== g2b && c !== ma && c !== pa && c.homeId !== h.id && !blockers.some(([x]) => x === c));
        blockers.push([filler, filler.homeId]);
        filler.homeId = h.id;
      }
    }
    g2a.homeId = g2b.homeId = homeP.id;
    events.length = 0;
    const r2 = sys().settle(g2a, g2b);
    check('Geniş Aile: boş kulübe yoksa çift ebeveyninin evinde birlikte yaşar', r2 === 'extended' && events.some((e) => e.n === 'lineage:extendedFamily') && journal().includes('Geniş Aile'), `${r2} · ma ev ${ma.homeId} / ${homeP.id} · çift ${g2a.homeId},${g2b.homeId} · ${g2a.parents} · boş ${st().buildings.filter((b) => b.type === 'cabin' && b.functional && S().world.getResidents(b).length === 0).length}`);
    // Yeni Konut Talebi: ayrı evlerde kaldılar
    const other = st().buildings.find((b) => b.type === 'cabin' && b.functional && b.id !== homeP.id);
    g2b.homeId = other.id;
    st().petitions.list = [];
    events.length = 0;
    const r3 = sys().settle(g2a, g2b);
    const pet = st().petitions.list.find((p) => p.kind === 'newHome');
    check('Yeni Konut Talebi: aynı çatı altında yer yoksa Belediye Konağı\'na dilekçe verilir', r3 === 'petition' && pet && pet.baseline.partnerId && journal().includes('Yeni Konut Talebi'), journal());
    check('Yeni Konut Talebi çift aynı eve yerleşince karşılanır', !PT.petitionMet(st(), pet) && (() => { g2b.homeId = g2a.homeId; return PT.petitionMet(st(), pet); })());
    st().petitions.list = [];
    for (const [c, h] of blockers) c.homeId = h;

    // --- Ocak Devri ---
    const elder = people().find((c) => !c.isChild && c !== g2a && c !== g2b && c.homeId !== null) ?? people()[3];
    const heir = g2a;
    const ek = [elder.lifeStage, elder.children, heir.married, heir.parents];
    elder.children = [heir.id];
    heir.married = true;
    st().lineage.heads[elder.homeId] = elder.id;
    events.length = 0;
    game.events.emit('lifeStage:changed', { character: elder, from: 'adult', to: 'elder' });
    check('Ocak Devri: Kıdemli Bilge olan reis ocağın reisliğini evli yetişkin çocuğuna devreder (anı ve günlük)', st().lineage.heads[elder.homeId] === heir.id && heir.memories.some((m) => m.kind === 'home' && m.text.includes(elder.name)) && journal().includes('Ocak Devri') && st().lineage.handovers >= 1, journal());
    game.events.emit('ui:selectBuilding', elder.homeId);
    game.render(0);
    const panelText = document.querySelector('.building-panel')?.textContent ?? '';
    check('ev panelinde ocak reisi (devredildi) ve ocaklar', panelText.includes(`Ocak reisi: ${heir.name}`) && panelText.includes('ocak devredildi'), panelText.slice(0, 300));
    game.events.emit('ui:selectBuilding', null);
    [elder.lifeStage, elder.children, heir.married, heir.parents] = ek;
    heir.parents = [ma.id];

    // --- Karakter Detay Kartı ---
    game.events.emit('ui:selectCharacter', g2a.id);
    game.render(0);
    const fam = document.querySelector('.character-panel .family-list')?.textContent ?? '';
    check('kartta kuşak rozeti ("2. Kuşak Kasabalı"), ocağı ve anne-baba / çocuklar', document.querySelector('.character-panel .lineage-badge.gen-2') && fam.includes('2. Kuşak Kasabalı') && fam.includes(st().lineage.families[g2a.familyId].name), fam);
    game.events.emit('ui:selectCharacter', ma.id);
    game.render(0);
    const fam2 = document.querySelector('.character-panel .family-list')?.textContent ?? '';
    check('ebeveynin kartında çocukları listelenir', fam2.includes('Çocukları') && fam2.includes('Bebek'), fam2);
    game.events.emit('ui:selectCharacter', null);

    // --- İzole üreteç ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'lineageSystem' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    const traveller = mk('Yolcu'); // Character kurucusu animasyon için Math.random kullanır: denetimden önce
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    for (const c of st().characters) if (c.homeId === fresh.id) c.homeId = null;
    sys().settle(g2a, g2b);
    LN.rebuildLineage(st());
    sys().onJoined(traveller);
    Math.random = realRandom;
    check('kütük, Yeni Yuva ve kurulum ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 30)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && sys().rng !== S().behavior.rng);
    st().characters.splice(st().characters.indexOf(baby), 1);
    ma.children = ma.children.filter((id) => id !== baby.id);
    pa.children = pa.children.filter((id) => id !== baby.id);

    // --- Kayıt (sürüm 27) ---
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const rc = raw.characters.find((c) => c.id === g2a.id);
    check('kayıt sürümü 32: kuşak, doğum ebeveynleri, ocak, çocuklar, ocak reisleri ve 2. kuşak ilk düğünü kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && rc.generation === 2 && rc.parents.includes(ma.id) && Number.isFinite(rc.familyId) && Array.isArray(rc.children) && raw.lineage.families[rc.familyId] && raw.chronicle.firstGen2Couple.a === ch.a);
    const snap = st().characters.map((c) => `${c.id}:${c.generation}:${c.familyId}:${c.parents.join('+')}:${c.children.join('+')}`).join('|');
    game.events.emit('ui:load');
    const back = st().characters.map((c) => `${c.id}:${c.generation}:${c.familyId}:${c.parents.join('+')}:${c.children.join('+')}`).join('|');
    check('kayıttan kütük birebir döner', back === snap && st().chronicle.firstGen2Couple?.a === ch.a && st().lineage.gen2Weddings >= 2);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const bc = bad.characters.find((c) => c.id === g2a.id);
    bc.generation = -4;
    bc.familyId = 99999;
    bc.children = ['x', 5e9];
    bad.lineage.heads = { 123456: 1, [bc.homeId]: 777777 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    const c2 = st().characters.find((c) => c.id === g2a.id);
    check('bozuk kuşak, ocak, çocuk listesi ve reis temizlenir / yeniden kurulur', c2.generation === 2 && st().lineage.families[c2.familyId] && c2.children.every((id) => st().characters.some((x) => x.id === id)) && !st().lineage.heads[123456] && st().lineage.heads[bc.homeId] === undefined);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 26;
    delete old.lineage;
    delete old.chronicle.firstGen2Couple;
    for (const c of old.characters) {
      delete c.generation;
      delete c.parents;
      delete c.familyId;
      delete c.children;
    }
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    const ps = st().characters.filter((c) => !c.role);
    check('v26 kaydı: ebeveyni kayıtlı olmayan herkes 1. Kuşak (Kurucu / Göçmen), kendi ocağıyla; kasabada doğanlar 2. kuşak; Tarihçe boş', ps.every((c) => (c.parentIds.length ? c.generation >= 2 : c.generation === 1) && st().lineage.families[c.familyId]) && !st().chronicle.firstGen2Couple && st().lineage.gen2Weddings === 0 && Object.keys(st().lineage.families).length === ps.filter((c) => c.generation === 1).length);
    st().goldenAge.since = savedSince;
    offs.forEach((off) => off());
  }

  // ===== 25. aşama (25.5): aile yadigârları, miras intikali ve Kuşak Şöleni =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const HD = await import('/src/data/heirloom.js');
    const HL = await import('/src/systems/Heirloom.js');
    const CZ = await import('/src/data/citizens.js');
    const CI = await import('/src/systems/Citizens.js');
    const UI = await import('/src/art/ui/index.js');
    const { CONFIG } = await import('/src/config.js');
    const Y = 16;
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const sys = () => S().heirloomSystem;
    const people = () => st().characters.filter((c) => !c.role && !c.away && !c.emigrating && !c.isChild).sort((a, b) => a.id - b.id);
    const journal = () => st().journal.slice(-6).map((e) => e.text).join(' / ');
    const events = [];
    const offs = ['heirloom:created', 'heirloom:passed', 'heirloom:archived', 'heirloom:feast'].map((n) => game.events.on(n, (p) => events.push({ n, p })));
    const strip = () => { for (const c of st().characters) c.inventory = (c.inventory ?? []).filter((x) => !CZ.ITEMS[x.kind]?.heirloom); };
    strip();
    const savedSince = st().goldenAge.since;

    // --- Veri ---
    check('altı aile yadigârı: Ata Yadigârı Çekiç, Ata Yadigârı Mekik, Eski Seyyah Pusulası, Kadim Maya Kavanozu, Usta Mala, Bilge Günlüğü', HD.HEIRLOOM_KINDS.length === 6 && HD.HEIRLOOM_KINDS.every((k) => CZ.ITEMS[k]?.heirloom && CZ.ITEMS[k].locked && CZ.ITEMS[k].stack === 1 && !CZ.ITEMS[k].value && UI.getIconSprite(HD.HEIRLOOMS[k].icon).width === 9) && CZ.ITEMS.heirloomCompass.name === 'Eski Seyyah Pusulası' && CZ.ITEMS.heirloomYeast.name === 'Kadim Maya Kavanozu' && CZ.ITEMS.heirloomJournal.name === 'Bilge Günlüğü');
    const [e1, k1, k2, m1, x1] = people();
    const kind = (c, patch) => {
      const keep = { memories: c.memories, skills: c.skills, workplaceId: c.workplaceId, quirk: c.quirk };
      Object.assign(c, patch);
      const r = HL.heirloomKindFor(st(), c);
      Object.assign(c, keep);
      return r;
    };
    const loom = st().buildings.find((b) => b.type === 'loom') ?? null;
    check('yadigâr meslek geçmişine / kişiliğe göre: seyyah pusulası, demirci çekici, fırıncı mayası, inşaatçı malası, düşünür günlüğü' + (loom ? ', dokumacı mekiği' : ''), kind(e1, { memories: [{ kind: 'expedition', text: 'x' }] }) === 'heirloomCompass' && kind(e1, { memories: [], skills: { crafting: 900 } }) === 'heirloomHammer' && kind(e1, { memories: [], skills: { baking: 900 } }) === 'heirloomYeast' && kind(e1, { memories: [], skills: { building: 900 } }) === 'heirloomTrowel' && kind(e1, { memories: [], skills: {}, quirk: 'philosopher' }) === 'heirloomJournal' && (!loom || kind(e1, { memories: [], skills: { crafting: 900 }, workplaceId: loom.id }) === 'heirloomShuttle'));
    check('yadigârın hikâyesi: "Mehmet Usta\'nın 30 yıllık emektar çekici. Kuşaktan kuşağa aktarılır."', HL.heirloomStory({ name: 'Mehmet', age: 48 }, 'heirloomHammer') === "Mehmet Usta'nın 30 yıllık emektar çekici. Kuşaktan kuşağa aktarılır.");

    // --- Altın Çağ kapısı ve oluşma ---
    st().goldenAge.since = null;
    e1.ageInDays = 70 * Y - 1;
    e1.lifeStage = 'adult';
    S().lifeStages.ageEveryone();
    check('Altın Çağ öncesinde bilgeleşen sakinde yadigâr belirmez (erken oyun aynı kalır)', e1.lifeStage === 'elder' && !CI.heirloomSlot(e1));
    st().goldenAge.since = st().time.day;
    e1.lifeStage = 'adult';
    e1.ageInDays = 70 * Y - 1;
    const fill = [{ kind: 'bread', qty: 3 }, { kind: 'fruit', qty: 2 }, { kind: 'souvenir', qty: 1, name: 'Kuş Düdüğü' }, { kind: 'herb', qty: 1 }, { kind: 'ration', qty: 2 }, { kind: 'pie', qty: 1 }];
    e1.inventory = [...fill.slice(0, CI.inventoryCapacity(e1) - 1), { kind: 'firewood', qty: 5 }];
    const wood0 = st().resources.wood;
    events.length = 0;
    S().lifeStages.ageEveryone();
    const slot = CI.heirloomSlot(e1);
    check('Kıdemli Bilge olunca çantasında aile yadigârı belirir (hikâyesi, sahibi, devir zinciri)', slot && slot.qty === 1 && slot.heirloom.ownerId === e1.id && slot.heirloom.chain.join() === e1.name && slot.heirloom.story.includes(`${e1.name} Usta'nın`) && events.some((x) => x.n === 'heirloom:created') && e1.memories.some((m) => m.kind === 'heirloom') && journal().includes('aile yadigârı'), journal());
    check('çanta doluysa en sondaki sıradan eşya yer açar (odun ambara döner); yadigâr yer kaplar', e1.inventory.length === CI.inventoryCapacity(e1) && !e1.inventory.some((x) => x.kind === 'firewood') && st().resources.wood > wood0 - 1, `${e1.inventory.map((x) => x.kind).join(',')} · kapasite ${CI.inventoryCapacity(e1)} · odun ${wood0} -> ${st().resources.wood}`);
    check('her sakin bir yadigâr taşır (ikinci kez belirmez)', sys().create(e1) === null && e1.inventory.filter((x) => CZ.ITEMS[x.kind]?.heirloom).length === 1);

    // --- Kilit: satılmaz, feda edilmez, yok edilmez ---
    check('yadigâr çantadan alınamaz (takeItem reddeder: satış, öşür, yemek)', CI.takeItem(e1, slot.kind, 1) === 0 && CI.heirloomSlot(e1) === slot);
    const saved = CI.sanitizeInventory(JSON.parse(JSON.stringify(e1.inventory)));
    check('kayıttan gelen çantada yadigârın hikâyesi ve zinciri korunur', saved.find((x) => x.kind === slot.kind)?.heirloom?.story === slot.heirloom.story);
    const coins0 = e1.coins;
    if (!st().buildings.some((b) => b.type === 'market' && b.functional)) sim.place('market');
    e1.apprenticeship = null;
    const tithe = S().tax ? (S().tax.collect?.(), true) : true;
    check('vergi tahsilatı ve Pazar yadigâra dokunmaz', tithe && CI.heirloomSlot(e1) === slot && e1.coins >= 0 && coins0 >= 0);

    // --- Mirasçı seçimi ---
    for (const c of [k1, k2, m1, x1]) {
      c.lifeStage = 'adult';
      c.inventory = (c.inventory ?? []).filter((x) => !CZ.ITEMS[x.kind]?.heirloom);
    }
    e1.children = [k1.id, k2.id];
    e1.mentees = [];
    for (const c of st().characters) if (c.apprenticeship?.masterId === e1.id) c.apprenticeship = null;
    k1.parents = [e1.id];
    k2.parents = [e1.id];
    k1.ageInDays = 30 * Y;
    k2.ageInDays = 25 * Y;
    const sk = [k1.skills, k2.skills];
    k1.skills = {};
    k2.skills = { [HD.HEIRLOOMS[slot.kind].skills[0]]: 2000 };
    check('mirasçı: aynı mesleği yapan evladı (daha yaşlı kardeşinden önce)', HL.pickHeir(st(), e1, slot.kind) === k2);
    k2.skills = {};
    check('mirasçı: meslek ayrımı yoksa en yaşlı evladı', HL.pickHeir(st(), e1, slot.kind) === k1);
    const kids = e1.children;
    e1.children = [];
    e1.mentees = [{ id: m1.id, progress: 90 }, { id: x1.id, progress: 40 }];
    check('evladı yoksa en çok emek verdiği (en yüksek ilerlemeyle yetiştirdiği) çırağı', HL.pickHeir(st(), e1, slot.kind) === m1);
    e1.mentees = [];
    const g = x1.generation;
    x1.generation = 2;
    st().relationships[[e1.id, x1.id].sort((a, b) => a - b).join('-')] = 80;
    const friend = HL.pickHeir(st(), e1, slot.kind);
    check('evladı ve çırağı yoksa kasabada doğan kuşaktan en yakın dostu (manevi evlat)', friend === x1 || (friend && friend.generation >= 2), friend?.name);
    x1.generation = g;
    e1.children = kids;
    [k1.skills, k2.skills] = sk;
    check('mezun olan çırak ustanın çırak geçmişine yazılır', (() => {
      const before = (m1.mentees ?? []).length;
      game.events.emit('apprentice:graduated', { character: x1, profession: 'workshop', title: null, progress: 77, masterId: m1.id });
      return m1.mentees.length === before + 1 && m1.mentees.find((q) => q.id === x1.id).progress === 77;
    })());

    // --- Tören ---
    st().chronicle.firstHeirloom = null;
    st().heirloom.feast = null;
    st().rally = null;
    slot.heirloom.since = st().time.day;
    sys().ceremonies();
    check('yadigâr belirdiği gün devredilmez (ertesi akşamki törene kalır)', CI.heirloomSlot(e1) === slot);
    slot.heirloom.since = st().time.day - 1;
    e1.visible = k1.visible = true;
    e1.speech = k1.speech = null;
    events.length = 0;
    sys().ceremonies();
    const passed = events.find((x) => x.n === 'heirloom:passed');
    check('akşam töreni: Kıdemli Bilge yadigârını evladına törenle devreder (zincir, anılar)', passed && passed.p.to === k1 && passed.p.first && CI.heirloomSlot(k1) === slot && !CI.heirloomSlot(e1) && slot.heirloom.chain.join('>') === `${e1.name}>${k1.name}` && k1.memories.some((m) => m.kind === 'heirloom' && m.text.includes(e1.name)));
    check('devir anında metin katmanında veda sözleri ("Bu ... artık senin evlat, hakkını ver!", "Ocağımız sana emanet..."); ikon balonu boş', e1.speech && k1.speech && HD.HANDOVER_LINES.elder.some((l) => e1.speech.text.startsWith(l.split('{')[0].trim().slice(0, 8))) && HD.HANDOVER_LINES.heir.includes(k1.speech.text), `${e1.speech?.text} / ${k1.speech?.text}`);
    const ch = st().chronicle.firstHeirloom;
    check('ilk devir: Tarihçe\'ye "İlk Kuşak Mirası Devredildi" ve Kasaba Günlüğü\'ne', ch && ch.elder === e1.name && ch.heir === k1.name && ch.item === slot.name && journal().includes('İlk Kuşak Mirası Devredildi'), journal());
    const fountain = st().buildings.find((b) => b.type === 'fountain' && b.functional);
    check('Kuşak Şöleni: meydan havuzunda konfeti (1 saat) ve Toplanma Zili', !fountain || (st().heirloom.feast && st().heirloom.feast.until - st().heirloom.feast.startedAt === HD.HEIRLOOM.feastMinutes && st().rally && st().rally.until > st().totalMinutes), JSON.stringify(st().heirloom.feast));
    check('Kuşak Şöleni konfetisi çizilir', (() => { try { game.render(0); return true; } catch { return false; } })());
    game.events.emit('ui:toggleStats');
    const archive = document.querySelector('.archive-panel');
    archive.querySelector('.archive-tab[data-tab="chronicle"]').click();
    game.render(0);
    const chText = archive.querySelector('.chronicle-view')?.textContent ?? '';
    check('Tarihçe Kütüğü\'nde altın harflerle: "İlk Kuşak Mirası Devredildi: [Büyük] ... [Genç] ..."', chText.includes('İlk Kuşak Mirası Devredildi') && chText.includes(e1.name) && chText.includes(k1.name), chText.slice(0, 200));
    game.events.emit('ui:toggleStats');

    // --- Ata Mirası Gururu ---
    check('Ata Mirası Gururu: yadigârı taşıyan yeni nesilin keyfi %10 yavaş düşer', (() => {
      const NS = S().systems.find((x) => x.constructor.name === 'NeedsSystem');
      const other = k2;
      const save = [k1.buffs, other.buffs, k1.task, other.task, k1.visible, other.visible, k1.profile];
      k1.buffs = {};
      other.buffs = {};
      k1.task = other.task = null;
      k1.visible = other.visible = false;
      k1.profile = other.profile;
      k1.needs.fun = other.needs.fun = 80;
      const shiv = [k1.coatVisible, other.coatVisible];
      NS.update({ gameMinutes: 60, hour: 12 });
      const dk = 80 - k1.needs.fun;
      const dO = 80 - other.needs.fun;
      [k1.buffs, other.buffs, k1.task, other.task, k1.visible, other.visible, k1.profile] = save;
      return dk > 0 && Math.abs(dk / dO - HD.HEIRLOOM.prideFunDecay) < 0.02;
    })());
    game.events.emit('ui:selectCharacter', k1.id);
    game.render(0);
    const bagSlot = document.querySelector('.character-panel .bag-slot.is-heirloom');
    const cond = document.querySelector('.character-panel .character-conditions')?.textContent ?? '';
    check('kartın çantasında yadigâr parıldayan altın çerçevede, ipucunda hikâyesi ve zinciri; "Ata Mirası Gururu" etiketi', bagSlot && bagSlot.title.includes(slot.heirloom.story) && bagSlot.title.includes(`${e1.name} → ${k1.name}`) && bagSlot.title.includes('satılmaz') && cond.includes('Ata Mirası Gururu'), cond);
    game.events.emit('ui:selectCharacter', null);

    // --- İkinci devir: şölen yok ---
    const e2 = k2;
    e2.lifeStage = 'adult';
    e2.ageInDays = 70 * Y - 1;
    S().lifeStages.ageEveryone();
    const slot2 = CI.heirloomSlot(e2);
    slot2.heirloom.since = st().time.day - 1;
    e2.children = [m1.id];
    m1.inventory = [];
    st().heirloom.feast = null;
    events.length = 0;
    sys().ceremonies();
    check('sonraki devirlerde Tarihçe\'deki ilk kayıt değişmez, şölen yeniden kurulmaz', events.some((x) => x.n === 'heirloom:passed' && !x.p.first) && st().chronicle.firstHeirloom.heir === k1.name && !st().heirloom.feast && st().heirloom.transfers >= 2);

    // --- Köyden ayrılan taşıyıcı: kaybolmaz ---
    const carrier = m1;
    const cs = CI.heirloomSlot(carrier);
    carrier.children = [];
    carrier.mentees = [];
    events.length = 0;
    const a0 = st().heirloom.archive.length;
    game.events.emit('population:left', { character: carrier, coins: 0, items: 0 });
    check('köyden ayrılan taşıyıcının mirasçısı yoksa yadigâr kasaba arşivine emanet edilir (yok olmaz)', !CI.heirloomSlot(carrier) && st().heirloom.archive.length === a0 + 1 && st().heirloom.archive.at(-1).kind === cs.kind && events.some((x) => x.n === 'heirloom:archived'));

    // --- Ocak Devri yadigâr da getirir ---
    const elderH = x1;
    elderH.inventory = [];
    elderH.lifeStage = 'elder';
    game.events.emit('lineage:handover', { elder: elderH, heir: k1, home: null });
    check('ocağını devreden sakinin çantasında da yadigâr belirir', CI.heirloomSlot(elderH));
    elderH.lifeStage = 'adult';

    // --- İzole üreteç ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'heirloomSystem' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const hs = CI.heirloomSlot(elderH);
    hs.heirloom.since = st().time.day - 1;
    elderH.lifeStage = 'elder';
    elderH.children = [k2.id];
    k2.inventory = [];
    k2.lifeStage = 'adult';
    st().rally = { until: 0, rungAt: st().totalMinutes, venueId: null };
    sys().ceremonies();
    sys().create(e1);
    Math.random = realRandom;
    check('yadigâr oluşumu ve devri ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 31)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && sys().rng !== S().behavior.rng && CI.heirloomSlot(k2));
    elderH.lifeStage = 'adult';

    // --- Kayıt (sürüm 28) ---
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const rk = raw.characters.find((c) => c.id === k1.id);
    check('kayıt sürümü 32: çantadaki yadigâr (hikâye, zincir), çırak geçmişi, yadigâr sayaçları, arşiv ve ilk devir kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && rk.inventory.some((x) => x.kind === slot.kind && x.heirloom.chain.length === 2) && Array.isArray(raw.characters.find((c) => c.id === m1.id)?.mentees ?? []) && raw.heirloom.transfers >= 2 && raw.heirloom.archive.length >= 1 && raw.chronicle.firstHeirloom.heir === k1.name);
    const snap = JSON.stringify(st().characters.map((c) => CI.heirloomSlot(c)?.heirloom ?? null));
    game.events.emit('ui:load');
    check('kayıttan yadigârlar, zincirleri, sayaçlar ve arşiv birebir döner', JSON.stringify(st().characters.map((c) => CI.heirloomSlot(c)?.heirloom ?? null)) === snap && st().heirloom.archive.length >= 1 && st().chronicle.firstHeirloom?.elder === e1.name);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    const bk = bad.characters.find((c) => c.id === k1.id);
    bk.inventory.find((x) => x.kind === slot.kind).heirloom = { story: 7, chain: 'x' };
    bk.mentees = [{ id: 'a' }, { id: 3, progress: 400 }];
    bad.heirloom = { created: 'çok', archive: [{ kind: 'uydurma', name: 'x' }], feast: { x: 1 } };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    const kb = st().characters.find((c) => c.id === k1.id);
    check('bozuk yadigâr bilgisi, çırak geçmişi ve sayaçlar temizlenir (yadigâr çantada kalır)', CI.heirloomSlot(kb) && typeof CI.heirloomSlot(kb).heirloom.story === 'string' && Array.isArray(CI.heirloomSlot(kb).heirloom.chain) && kb.mentees.length === 1 && kb.mentees[0].progress === 100 && st().heirloom.created === 0 && st().heirloom.archive.length === 0 && st().heirloom.feast === null);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 27;
    delete old.heirloom;
    delete old.chronicle.firstHeirloom;
    for (const c of old.characters) {
      delete c.mentees;
      c.inventory = (c.inventory ?? []).filter((x) => !HD.HEIRLOOMS[x.kind]);
    }
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v27 kaydı: yadigâr, çırak geçmişi ve sayaç yok; Tarihçe\'de ilk devir yok; oyun sorunsuz', st().characters.every((c) => !CI.heirloomSlot(c) && c.mentees.length === 0) && JSON.stringify(st().heirloom) === JSON.stringify(HL.emptyHeirloomState()) && !st().chronicle.firstHeirloom);
    st().goldenAge.since = savedSince;
    offs.forEach((off) => off());
  }

  // ===== 26. aşama (26.1): mevsimlik panayır döngüsü ve meydan şenlikleri =====
  FairClass.prototype.prepare = realPrepare; // panayır artık açık
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const FD = await import('/src/data/fair.js');
    const FA = await import('/src/systems/Fair.js');
    const { FairSystem } = await import('/src/systems/FairSystem.js');
    const { FairDecor } = await import('/src/rendering/FairDecor.js');
    const { Random } = await import('/src/utils/random.js');
    const { TOWN_BUFFS } = await import('/src/data/town.js');
    const { getSeason } = await import('/src/data/seasons.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    const keep = { since: s0.goldenAge.since, day: s0.time.day, hour: s0.time.hour, minute: s0.time.minute, cf: s0.currentFestival, festival: { ...s0.events.festival }, sf: JSON.parse(JSON.stringify(s0.seasonFestival)) };
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    rich();
    if (!S().world.getCompleted('fountain').length) sim.place('fountain', { instant: true });
    const fs = () => S().fairSystem;
    const goto = (day, hour, minute = 0) => { const t = st().time; t.day = day; t.hour = hour; t.minute = minute; };
    const reset = () => { st().currentFestival = null; Object.assign(st().events.festival, { active: false, theme: null, endsAt: 0 }); st().seasonFestival.stage = null; st().seasonFestival.day = null; fs().attendees.clear(); };
    const evs = [];
    const offs = ['fair:prep', 'fair:ended', 'festival:started', 'festival:ended', 'seasonFestival:announced', 'toast'].map((n) => game.events.on(n, (p) => evs.push({ n, p })));
    const mapHash = () => {
      const m = S().world.map;
      let h = 0;
      for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) { const k = `${m.get(x, y)}|${m.getObject(x, y) ?? ''}|${m.getOccupant(x, y)}`; for (let i = 0; i < k.length; i++) h = (Math.imul(h, 31) + k.charCodeAt(i)) | 0; }
      return h;
    };
    const performers = () => st().characters.filter((c) => c.task?.activity === 'festival' && c.task.phase === 'perform');

    // --- Veri ---
    check('dört mevsimlik panayır: Bahar Çiçek Panayırı, Yaz Güneşi Şenliği, Hasat Bayramı, Kış Dönümü Ateşi', JSON.stringify(FD.FAIR_TYPES) === JSON.stringify(['spring', 'summer', 'autumn', 'winter']) && FD.FAIRS.spring.name === 'Bahar Çiçek Panayırı' && FD.FAIRS.summer.name === 'Yaz Güneşi Şenliği' && FD.FAIRS.autumn.name === 'Hasat Bayramı' && FD.FAIRS.winter.name === 'Kış Dönümü Ateşi');
    check('panayır saatleri: hazırlık 06:00, şenlik 18:00 - 22:00 (08:00 - 17:00 mesaisinden sonra)', FD.FAIR.prepHour === 6 && FD.FAIR.partyHour === 18 && FD.FAIR.endHour === 22 && FD.FAIR.partyHour > 17);
    check('panayır günü her mevsimin son günüdür (4, 8, 12, 16, 20...)', [4, 8, 12, 16, 20, 28, 32].every((d) => FA.isFairDay(d) && getSeason(d).dayOfSeason === getSeason(d).daysInSeason) && [1, 2, 3, 5, 6, 7, 29, 30].every((d) => !FA.isFairDay(d)));
    check('mevsime göre süs: çelenk, güneş feneri, hasat sepeti, meşale; Panayır Coşkusu bonusu tanımlı', FD.FAIRS.spring.prop === 'wreath' && FD.FAIRS.summer.prop === 'sunLantern' && FD.FAIRS.autumn.prop === 'basket' && FD.FAIRS.winter.prop === 'torch' && TOWN_BUFFS.fairSpirit.name === 'Panayır Coşkusu');

    // --- Altın Çağ kapısı: erken oyun aynı kalır, eski festival çalışmaya devam eder ---
    s0.goldenAge.since = null;
    reset();
    goto(8, 5, 59);
    evs.length = 0;
    sim.step(5);
    check('Altın Çağ öncesinde panayır kurulmaz (06:00 geçti, currentFestival null, panayır olayı yok)', st().time.hour === 6 && st().currentFestival === null && !evs.some((e) => e.n === 'fair:prep'));
    goto(8, 7, 59);
    sim.step(5);
    check('Altın Çağ öncesinde 14. aşamanın mevsim festivali 08:00\'de eskisi gibi duyurulur', st().seasonFestival.stage === 'announced' && evs.some((e) => e.n === 'seasonFestival:announced'));
    reset();

    // --- Altın Çağ açık: doğal akışla bütün gün (Hazırlık 06:00, mesai, 18:00 şenlik, 22:00 kapanış) ---
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };
    s0.chronicle.firstFair = null; // bu bölümün kendi sayacı: önceki aşamaların uzun koşusunda kurulan panayırlar sayılmaz
    s0.stats.fairs = 0;
    const hash0 = mapHash();
    goto(8, 5, 59);
    evs.length = 0;
    sim.step(5);
    const fair = FD.FAIRS.summer;
    check('06:00: Yaz Güneşi Şenliği hazırlığı başlar (currentFestival { type, day, phase: prep }), şenlik kuralları henüz yok', JSON.stringify(st().currentFestival) === JSON.stringify({ type: 'summer', day: 8, phase: 'prep', participants: [] }) && !st().events.festival.active && evs.some((e) => e.n === 'fair:prep'));
    check('başlangıçta kutlama mesajı üst bildirime ve Kasaba Günlüğü\'ne düşer', evs.some((e) => e.n === 'toast' && e.p.text === 'Meydanda Yaz Güneşi Şenliği başladı! Bu akşam herkes meydanda toplanıyor.') && st().journal.some((e) => e.text === fair.start && e.day === 8));
    goto(8, 7, 59);
    sim.step(5);
    check('panayır gününde eski mevsim festivali duyurulmaz (yerini panayıra bırakır)', st().seasonFestival.stage === null && !evs.some((e) => e.n === 'seasonFestival:announced'));
    // 08:00 - 17:00 mesaisi: kimse şenlik etkinliğine girmez, kasaba normal çalışır
    let festivalInDay = 0;
    while (st().time.hour < 17) {
      sim.step(60);
      festivalInDay += st().characters.filter((c) => c.task?.activity === 'festival').length;
    }
    check('hazırlık evresinde (06:00 - 17:00) hiçbir sakin şenliğe gitmez; şenlik kuralları kapalı, mesai aksamaz', st().time.hour === 17 && festivalInDay === 0 && !st().events.festival.active && st().currentFestival?.phase === 'prep', `${festivalInDay} · ${st().time.hour}:00`);
    check('hazırlıkta harita matrisi (zemin, nesne, doluluk) hiç değişmez', mapHash() === hash0);
    while (st().time.hour < 18) sim.step(60);
    check('18:00: şenlik saati başlar (phase party), kasaba şenliği 22:00\'ye kadar, Panayır Coşkusu bonusu etkin', st().currentFestival?.phase === 'party' && st().events.festival.active && st().events.festival.theme === 'fair' && st().events.festival.endsAt === (st().time.day - 1) * 1440 + 22 * 60 && st().buffs.fairSpirit === st().events.festival.endsAt && evs.some((e) => e.n === 'festival:started' && e.p.fair === true) && st().journal.some((e) => e.text.startsWith('Şenlik saati: Yaz Güneşi Şenliği') && e.day === 8), `${JSON.stringify(st().currentFestival)} ${JSON.stringify(st().events.festival)} evs ${evs.filter((e) => e.n === 'festival:started').map((e) => e.p.fair)} j ${st().journal.filter((e) => e.day === 8).map((e) => e.text.slice(0, 30)).join(' / ')}`);
    sim.step(450);
    check('şenlik saatinde sakinler meydan havuzunda toplanır ve dans eder', performers().length >= 3 && S().world.getBuilding(st().events.festival.venueId)?.type === 'fountain', `${performers().length} sakin`);
    check('şenlik saatinde harita matrisi yine değişmez (süsler yalnızca çizim)', mapHash() === hash0);
    while (st().time.hour < 22) sim.step(30);
    sim.step(120);
    check('22:00 kapanış: panayır ve şenlik biter, süsler kalkar (currentFestival null), Mevsim Coşkusu armağanı, kasaba normale döner', st().currentFestival === null && st().buffs.seasonCheer > st().totalMinutes && !st().events.festival.active && evs.some((e) => e.n === 'fair:ended') && mapHash() === hash0);
    check('ilk panayır Tarihçe Kütüğü\'ne, sayaca ve katılanların anılarına düşer', st().chronicle.firstFair?.type === 'summer' && st().chronicle.firstFair.name === fair.name && st().chronicle.firstFair.count >= 3 && st().stats.fairs === 1 && st().characters.some((c) => c.memories.some((m) => m.text === fair.memory)));
    const first = JSON.stringify(st().chronicle.firstFair);

    // --- Dört mevsim, doğrudan çağrılarla: tür, yer, mesaj ---
    for (const [i, type] of FD.FAIR_TYPES.entries()) {
      reset();
      const day = 4 * (i + 1);
      goto(day, 6);
      evs.length = 0;
      const prepared = fs().onHour(6) ?? true;
      const cf = st().currentFestival;
      check(`${FD.FAIRS[type].name}: ${day}. günde hazırlık kurulur, mesaj: "${FD.FAIRS[type].start}"`, cf?.type === type && cf.phase === 'prep' && cf.day === day && evs.some((e) => e.n === 'toast' && e.p.text === FD.FAIRS[type].start) && prepared);
      goto(day, 18);
      fs().onHour(18);
      const f = st().events.festival;
      check(`${FD.FAIRS[type].name}: 18:00'de meydanda şenlik başlar, 22:00'de kapanır`, st().currentFestival.phase === 'party' && f.active && S().world.getBuilding(f.venueId).type === 'fountain');
      goto(day, 22);
      fs().onHour(22);
      check(`${FD.FAIRS[type].name}: 22:00'de biter`, st().currentFestival === null && evs.some((e) => e.n === 'fair:ended' && e.p.type === type));
    }
    check('sonraki panayırlar Tarihçe\'deki ilk kaydı değiştirmez; sayaç artar', JSON.stringify(st().chronicle.firstFair) === first && st().stats.fairs === 5);

    // --- Panayır yalnızca mevsimin son günü; yer yoksa kurulmaz; Altın Çağ ortası eski festival çalışır ---
    reset();
    goto(7, 6);
    fs().onHour(6);
    check('mevsimin son günü olmayan günde panayır kurulmaz', st().currentFestival === null);
    reset();
    const fountains = S().world.getCompleted('fountain');
    goto(8, 6);
    const venueNow = FA.fairVenue(S().world);
    check('panayır yeri meydan havuzu (yoksa kamp ateşi, han)', venueNow?.type === 'fountain');
    s0.goldenAge.since = null;
    goto(8, 8);
    S().seasonFestivals.onHour(8);
    check('Altın Çağ gün içinde başlarsa o günün festivali eskisi gibi sürer (panayır kurulmamıştı)', st().seasonFestival.stage === 'announced' && st().currentFestival === null);
    reset();
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };

    // --- Panayır Coşkusu, Şenlik Neşesi 2. kuşak dansçı, nostalji sözleri (ayrı metin katmanı) ---
    reset();
    goto(8, 6);
    fs().onHour(6);
    goto(8, 18);
    fs().onHour(18);
    const crowd = st().characters.filter((c) => !c.away && !c.isChild && !c.isElder).slice(0, 5);
    const [dancer, near, far, elder, plain] = crowd;
    const saved = crowd.map((c) => ({ c, task: c.task, quirk: c.quirk, generation: c.generation, lifeStage: c.lifeStage, x: c.x, y: c.y, speech: c.speech, visible: c.visible, fun: c.needs.fun, social: c.needs.social }));
    for (const c of crowd) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; c.needs.fun = 40; c.needs.social = 40; c.quirk = 'bookworm'; c.generation = 1; }
    dancer.quirk = 'festive'; dancer.generation = 2;
    near.x = dancer.x + 10; near.y = dancer.y;
    far.x = dancer.x + 400; far.y = dancer.y;
    plain.x = dancer.x - 400; plain.y = dancer.y + 400; elder.x = dancer.x + 300; elder.y = dancer.y - 300; // dansçıdan uzak: ek neşe yalnızca yakındakine
    elder.lifeStage = 'elder';
    const bubbles = crowd.map((c) => c.bubble);
    fs().update({ gameMinutes: 10 });
    const base = FD.FAIR.funPerMinute * 10;
    check('Panayır Coşkusu: meydandakilerin keyfi ve sosyalliği hızlı dolar', Math.abs(plain.needs.fun - (40 + base)) < 1e-6 && Math.abs(plain.needs.social - (40 + FD.FAIR.socialPerMinute * 10)) < 1e-6 && plain.needs.fun > 40);
    check('Şenlik Neşesi\'li 2. kuşak dansçı yanındakilere fazladan neşe yayar (yakındakine +, uzaktakine yok)', Math.abs(near.needs.fun - (40 + base + FD.FAIR.festiveJoy.perMinute * 10)) < 1e-6 && Math.abs(far.needs.fun - (40 + base)) < 1e-6);
    dancer.generation = 1;
    near.needs.fun = 40;
    fs().update({ gameMinutes: 10 });
    check('1. kuşak Şenlik Neşesi\'li sakin bu fazladan neşeyi yaymaz (yalnızca 2. kuşak)', Math.abs(near.needs.fun - (40 + base)) < 1e-6);
    // Konuşmalar: olasılık 1'e çıkarılır (dakika çok büyük)
    for (const c of crowd) c.speech = null;
    dancer.generation = 2;
    fs().update({ gameMinutes: 1e4 });
    check('Kıdemli Bilge gençleri izlerken nostalji sözü söyler (c.speech)', FD.ELDER_LINES.includes(elder.speech?.text));
    check('Şenlik Neşesi\'li 2. kuşak dansçı neşeli söz söyler; öteki sakinler panayırın tezahüratını', FD.FESTIVE_DANCER_LINES.includes(dancer.speech?.text) && FD.FAIRS.summer.cheers.includes(plain.speech?.text));
    check('sözler ayrı metin katmanında: ikon baloncuğuna (c.bubble) dokunulmaz', crowd.every((c, i) => c.bubble === bubbles[i]) && crowd.every((c) => c.speech === null || (typeof c.speech.text === 'string' && c.speech.at === -1 && c.speech.duration === FD.FAIR.speechSeconds)));
    for (const o of saved) Object.assign(o.c, { task: o.task, quirk: o.quirk, generation: o.generation, lifeStage: o.lifeStage, x: o.x, y: o.y, speech: o.speech, visible: o.visible });
    for (const o of saved) { o.c.needs.fun = o.fun; o.c.needs.social = o.social; }

    // --- İzole üreteç (seed + 32) ---
    reset();
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'fairSystem' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const own0 = fs().rng.state;
    goto(8, 6); fs().onHour(6);
    goto(8, 18); fs().onHour(18);
    for (const c of crowd) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; }
    fs().update({ gameMinutes: 5000 });
    goto(8, 22); fs().onHour(22);
    Math.random = realRandom;
    for (const o of saved) Object.assign(o.c, { task: o.task, speech: o.speech, visible: o.visible });
    check('panayır, süsleri ve sözleri ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 32)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && fs().rng !== S().behavior.rng && fs().rng.state !== own0);
    const probe = new FairSystem(game, S().world, new Random(st().seed + 32), { attract: true });
    check('FairSystem tohumu seed + 32\'dir (TownScene aynı üretecle kurar)', probe.rng.state === (st().seed + 32) >>> 0 && S().fairSystem.rng.state !== undefined);
    probe.destroy();

    // --- Çizim: 4 mevsim x 2 evre, ışıklar, sıfır iz ---
    {
      const calls = [];
      const fake = { fillRect: (x, y, w, h, c) => calls.push([x, y, w, h, c]) };
      const venue = FA.fairVenue(S().world);
      const dec = new FairDecor();
      let ok = true;
      const counts = {};
      for (const type of FD.FAIR_TYPES) for (const phase of ['prep', 'party']) {
        calls.length = 0;
        try { dec.draw(fake, venue, 1.3, type, phase); } catch { ok = false; }
        counts[`${type}-${phase}`] = calls.length;
        const lights = [];
        dec.collectLights(lights, venue, type, phase);
        if (phase === 'prep' && lights.length) ok = false;
        if (phase === 'party' && !lights.length) ok = false;
        if (calls.some((c) => c.slice(0, 4).some((v) => !Number.isFinite(v)) || typeof c[4] !== 'string')) ok = false;
      }
      check('FairDecor: dört mevsim iki evrede çizilir (hazırlıkta tent + flama, şenlikte ek süs ve ışık), geçersiz değer yok', ok && FD.FAIR_TYPES.every((t) => counts[`${t}-party`] > counts[`${t}-prep`] && counts[`${t}-prep`] > 20), JSON.stringify(counts));
    }

    // --- Kayıt (sürüm 29) ---
    reset();
    goto(12, 6); fs().onHour(6);
    goto(12, 18); fs().onHour(18);
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: currentFestival { type, day, phase } kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && JSON.stringify({ ...raw.currentFestival, participants: undefined }) === JSON.stringify({ type: 'autumn', day: 12, phase: 'party' }) && Array.isArray(raw.currentFestival.participants) && raw.chronicle.firstFair?.type === 'summer');
    st().currentFestival = null;
    game.events.emit('ui:load');
    check('kayıttan süren panayır birebir döner (şenlik kuralları ve Tarihçe\'deki ilk kayıt ile)', JSON.stringify(st().currentFestival) === JSON.stringify(raw.currentFestival) && st().currentFestival.phase === 'party' && st().events.festival.active && st().chronicle.firstFair?.name === fair.name && st().stats.fairs >= 5);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.currentFestival = { type: 'uydurma', day: 'x', phase: 'party' };
    bad.chronicle.firstFair = { type: 3 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk panayır durumu ve Tarihçe kaydı temizlenir (null), oyun sorunsuz', st().currentFestival === null && st().chronicle.firstFair === null);
    game.events.emit('ui:save');
    const stale = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    stale.currentFestival = { type: 'winter', day: st().time.day - 3, phase: 'prep' };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(stale));
    game.events.emit('ui:load');
    check('geçmiş güne ait panayır durumu kayıttan açılışta temizlenir', st().currentFestival === null);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 28;
    delete old.currentFestival;
    delete old.chronicle.firstFair;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v28 kaydı: currentFestival yok -> null; Tarihçe\'de ilk panayır yok; oyun sorunsuz ilerler', st().currentFestival === null && st().chronicle.firstFair === null && (sim.step(120), true));

    // Eski durum geri
    S().seasonFestivals.sf && Object.assign(st().seasonFestival, keep.sf);
    st().goldenAge.since = keep.since;
    st().currentFestival = null;
    Object.assign(st().events.festival, keep.festival, { active: false });
    goto(keep.day, keep.hour, keep.minute);
    offs.forEach((off) => off());
  }

  // ===== 26. aşama (26.2): Büyük Ziyafet Sofrası, geleneksel ikramlar ve refah patlaması =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const FD = await import('/src/data/feast.js');
    const FT = await import('/src/systems/Feast.js');
    const FA = await import('/src/systems/Fair.js');
    const FDATA = await import('/src/data/fair.js');
    const { FeastSystem } = await import('/src/systems/FeastSystem.js');
    const { FairDecor } = await import('/src/rendering/FairDecor.js');
    const { Random } = await import('/src/utils/random.js');
    const { TOWN_BUFFS } = await import('/src/data/town.js');
    const { TRUST } = await import('/src/data/citizens.js');
    const { foodSupply } = await import('/src/systems/TownStatus.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    const keep = { since: s0.goldenAge.since, day: s0.time.day, hour: s0.time.hour, minute: s0.time.minute, festival: { ...s0.events.festival }, res: { ...s0.resources } };
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    rich();
    if (!S().world.getCompleted('fountain').length) sim.place('fountain', { instant: true });
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };
    const fair = () => S().fairSystem;
    const fs = () => S().feastSystem;
    const goto = (day, hour, minute = 0) => { const t = st().time; t.day = day; t.hour = hour; t.minute = minute; };
    const reset = () => { st().currentFestival = null; st().currentFeast = null; Object.assign(st().events.festival, { active: false, theme: null, endsAt: 0 }); st().seasonFestival.stage = null; st().seasonFestival.day = null; fair().attendees.clear(); for (const k of ['tradition', 'bounty']) delete st().buffs[k]; };
    const pop = () => st().characters.filter((c) => !c.role).length;
    const evs = [];
    const offs = ['feast:set', 'feast:started', 'feast:ended', 'fair:prep', 'toast'].map((n) => game.events.on(n, (p) => evs.push({ n, p })));
    const mapHash = () => {
      const m = S().world.map;
      let h = 0;
      for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) { const k = `${m.get(x, y)}|${m.getObject(x, y) ?? ''}|${m.getOccupant(x, y)}`; for (let i = 0; i < k.length; i++) h = (Math.imul(h, 31) + k.charCodeAt(i)) | 0; }
      return h;
    };
    const supplyOf = (food, bread, extra = {}) => { st().pantry.credit = 0; Object.assign(st().resources, { food, bread, sherbet: 0, cloth: 0, ...extra }); return foodSupply(st()); };

    // --- Veri ---
    check('üç sofra seviyesi: Zengin Şölen Sofrası, Mütevazı Sofra, Sembolik İkram; kişi başı en az 3 besin güvencesi', FD.TIER_KEYS.join() === 'rich,modest,symbolic' && FD.TIERS.rich.name === 'Zengin Şölen Sofrası' && FD.TIERS.modest.name === 'Mütevazı Sofra' && FD.TIERS.symbolic.name === 'Sembolik İkram' && FD.FEAST.minPerCapita === 3);
    check('Gelenek Bağı ve Bolluk Ziyafeti bonusları; güven desteği +5 / +10', TOWN_BUFFS.tradition.name === 'Gelenek Bağı' && TOWN_BUFFS.bounty.name === 'Bolluk Ziyafeti' && FD.FEAST.buffs.rich.join() === 'tradition,bounty' && FD.FEAST.buffs.modest.join() === 'tradition' && FD.FEAST.buffs.symbolic.length === 0 && TRUST.events.feast === 5 && TRUST.events.feastRich === 10);

    // --- Gıda güvencesi (saf hesap) ---
    const n = pop();
    const hungry = supplyOf(n * 3 - 1, 0, { sherbet: 9, cloth: 9 });
    const planH = FT.planFeast(st());
    check('kişi başı besin 3\'ün altındayken lüks mal olsa bile sofra sembolik kalır ve kilerden HİÇBİR şey ayrılmaz', hungry < n * 3 && planH.tier === 'symbolic' && Object.values(planH.contributions).every((v) => v === 0), `${hungry} / ${n * 3}`);
    supplyOf(n * 3, 0, { sherbet: 9, cloth: 9 });
    check('tam eşikte (kişi başı 3) de hiçbir şey ayrılmaz', FT.planFeast(st()).tier === 'symbolic' && Object.values(FT.planFeast(st()).contributions).every((v) => v === 0));
    let guard = true;
    let tiers = new Set();
    for (const food of [n * 3 + 1, n * 3 + 3, n * 4, n * 6, n * 10, 400, 2000]) for (const bread of [0, 5, 40]) for (const extra of [{}, { sherbet: 4, cloth: 2 }]) {
      const sup = supplyOf(food, bread, extra);
      const p = FT.planFeast(st());
      tiers.add(p.tier);
      const donated = p.contributions.food + p.contributions.bread * 2.5;
      if (p.tier === 'symbolic' && donated !== 0) guard = false;
      if (sup - donated < n * 3 - 1e-9 && donated > 0) guard = false; // ayrıldıktan sonra kişi başı 3'ün altına inmemeli
      if (p.tier === 'rich' && !(extra.sherbet && p.contributions.sherbet >= 1 && p.contributions.cloth === 1)) guard = false;
      if (p.tier !== 'rich' && (p.contributions.sherbet || p.contributions.cloth)) guard = false;
    }
    check('42 farklı kiler durumunda bağış hiçbir zaman besini kişi başı 3\'ün altına indirmez; lüks mal yoksa sofra zengin olmaz', guard && tiers.has('modest') && tiers.has('rich'), [...tiers].join());
    supplyOf(n * 5, 10);
    const planM = FT.planFeast(st());
    check('lüks mal yokken Mütevazı Sofra: yalnızca ekmek ve yiyecek ayrılır', planM.tier === 'modest' && planM.contributions.sherbet === 0 && planM.contributions.cloth === 0 && planM.contributions.food + planM.contributions.bread > 0 && planM.servings >= 1);
    supplyOf(n * 8, 20, { sherbet: 3, cloth: 2 });
    const planR = FT.planFeast(st());
    check('Fıçı Şerbeti ve Kumaş varken Zengin Şölen Sofrası: şerbet fıçıları, kumaş örtü, ikram sakin sayısından fazla', planR.tier === 'rich' && planR.contributions.sherbet >= 1 && planR.contributions.cloth === 1 && planR.servings > n);

    // --- Panayır yoksa sofra yok ---
    reset();
    goto(7, 5, 59);
    evs.length = 0;
    sim.step(5);
    check('panayır günü olmayan günde sofra kurulmaz', st().currentFeast === null && !evs.some((e) => e.n === 'feast:set'));
    s0.goldenAge.since = null;
    goto(8, 5, 59);
    sim.step(5);
    check('Altın Çağ öncesinde panayır da sofra da yok (erken oyun aynı kalır)', st().currentFeast === null && st().currentFestival === null);
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };
    reset();

    // --- Doğal akışla zengin sofra: 06:00 kuruluş, mesai, 18:00 açılış, 22:00 toplanma ---
    supplyOf(n * 8, 20, { sherbet: 5, cloth: 2 });
    const before = { ...st().resources };
    const hash0 = mapHash();
    goto(12, 5, 59);
    evs.length = 0;
    sim.step(5);
    const feast = st().currentFeast;
    check('06:00: panayırla birlikte Zengin Şölen Sofrası kurulur, kilerden erzak, şerbet ve kumaş ayrılır (currentFeast { tier, contributions })', feast?.tier === 'rich' && feast.day === 12 && feast.served === 0 && evs.some((e) => e.n === 'feast:set') && st().resources.sherbet === before.sherbet - feast.contributions.sherbet && st().resources.cloth === before.cloth - 1 && st().resources.food <= before.food - feast.contributions.food, JSON.stringify(feast));
    check('sofra kurulunca Kasaba Günlüğü\'ne yazılır', st().journal.some((e) => e.day === 12 && e.text === FD.TIERS.rich.set));
    check('kurulumdan sonra da besin değeri kişi başı 3\'ün üstünde', foodSupply(st()) >= pop() * 3);
    let early = 0;
    const festBefore = new Set(st().characters.filter((c) => c.task?.activity === 'festival').map((c) => c.id)); // (28.1) önceki şenlikten kalma görevler sayılmaz
    while (st().time.hour < 17) {
      sim.step(60);
      early += st().characters.filter((c) => !festBefore.has(c.id) && c.task?.activity === 'festival').length + (st().currentFeast?.served ?? 0);
    }
    check('gündüz mesaisinde (06:00 - 17:00) kimse sofraya gitmez, ikram verilmez, bonuslar kapalıdır', early === 0 && !('tradition' in st().buffs && st().buffs.tradition > st().totalMinutes), `${early}`);
    check('hazırlıkta sofra yalnızca çizimdir: harita matrisi aynı', mapHash() === hash0);
    // (27.1) 26.1 bölümünün aynı günlü (G12) panayırı artık iptal / hazırlıkta erzağını kilere geri verdiği için o sofra da Zengin olabilir
    // ve günlük güven anahtarını önceden işaretleyebilir: bu sofranın kendi +10'unu ölçmek için önceki işaret temizlenir
    if (st().trust.eventDays.feastRich === 12) st().trust.eventDays.feastRich = null;
    const trustBefore = st().trust.eventDays.feastRich;
    while (st().time.hour < 18) sim.step(60);
    sim.step(30);
    const t = st();
    check('18:00: Gelenek Bağı ve Bolluk Ziyafeti etkin (22:00 + 8 saat), güven +10 (feastRich)', t.buffs.tradition > t.totalMinutes + 4 * 60 && t.buffs.bounty > t.totalMinutes + 4 * 60 && t.trust.eventDays.feastRich === 12 && trustBefore !== 12 && evs.some((e) => e.n === 'feast:started' && e.p.tier === 'rich'), `${t.buffs.tradition} ${t.buffs.bounty} ${t.totalMinutes} ${t.trust.eventDays.feastRich} ${trustBefore} ${JSON.stringify(t.currentFestival)} ${JSON.stringify(t.currentFeast)} ${evs.map((e) => e.n).join(',')}`);
    sim.step(450);
    const served = st().currentFeast?.served ?? 0;
    check('şenlik saatinde sakinler sofradan ikram alır (en çok ikram sayısı kadar); zengin sofrada Keyifli Damak', served >= 3 && served <= st().currentFeast.servings && st().characters.filter((c) => c.feasted === 12).length === served && st().characters.some((c) => c.feasted === 12 && (c.buffs.merryPalate ?? 0) > st().totalMinutes), `${served}/${st().currentFeast.servings}`);
    check('şenlik saatinde harita matrisi yine aynı', mapHash() === hash0);
    const resAtParty = { ...st().resources };
    while (st().time.hour < 22) sim.step(30);
    sim.step(120);
    const e = evs.find((x) => x.n === 'feast:ended');
    check('22:00: sofra toplanır (currentFeast null), sayaç artar, yenmeyen erzak kilere döner, Günlük satırı', st().currentFeast === null && e && e.p.served >= served && e.p.served <= e.p.total && st().stats.feasts >= 1 && e.p.refund.food + e.p.refund.bread >= 0 && st().resources.food >= resAtParty.food + e.p.refund.food - 400 && st().journal.some((x) => x.day === 12 && x.text.includes('toplandı')));
    check('kapanıştan sonra harita matrisi aynı, besin değeri kişi başı 3\'ün üstünde', mapHash() === hash0 && foodSupply(st()) >= pop() * 3);

    // --- Mütevazı ve sembolik sofra, doğrudan çağrılarla ---
    reset();
    supplyOf(n * 6, 10);
    goto(16, 6);
    fair().onHour(6);
    check('lüks mal yokken panayırda Mütevazı Sofra kurulur', st().currentFeast?.tier === 'modest' && st().currentFeast.contributions.sherbet === 0);
    goto(16, 18);
    fair().onHour(18);
    check('mütevazı sofrada yalnızca Gelenek Bağı (Bolluk Ziyafeti yok); güven +5', st().buffs.tradition > st().totalMinutes && !(st().buffs.bounty > st().totalMinutes) && st().trust.eventDays.feast === 16);
    goto(16, 22);
    fair().onHour(22);
    reset();
    const lowFood = supplyOf(n * 3 - 2, 0, { sherbet: 4, cloth: 2 });
    const resLow = { ...st().resources };
    goto(20, 6);
    fair().onHour(6);
    const sym = st().currentFeast;
    check('kıtlıkta sembolik hafif ikram: kilerden, şerbetten ve kumaştan hiçbir şey ayrılmaz', sym?.tier === 'symbolic' && JSON.stringify(st().resources) === JSON.stringify(resLow) && lowFood < n * 3);
    const trustSym = st().trust.eventDays.feast;
    goto(20, 18);
    fair().onHour(18);
    check('sembolik ikramda Gelenek Bağı yok, güven desteği yok', !(st().buffs.tradition > st().totalMinutes) && st().trust.eventDays.feast === trustSym);
    goto(20, 22);
    fair().onHour(22);

    // --- Şifa etkisi ---
    reset();
    supplyOf(n * 8, 20, { sherbet: 5, cloth: 2 });
    goto(24, 6); fair().onHour(6);
    goto(24, 18); fair().onHour(18);
    const hurt = st().characters.find((c) => !c.role && !c.isChild && !c.away);
    const hs = { injured: hurt.isInjured, timer: hurt.injuryTimer, task: hurt.task };
    hurt.task = { activity: 'festival', phase: 'perform' }; // uyumuyor: ek iyileşme tam 1 kat
    hurt.isInjured = true;
    hurt.injuryTimer = 500;
    fs().update({ gameMinutes: 10 });
    check('Gelenek Bağı sürerken hafif yaralı iki kat hızlı iyileşir (ek 10 dakika)', hurt.injuryTimer === 490);
    delete st().buffs.tradition;
    fs().update({ gameMinutes: 10 });
    check('bonus yokken ek iyileşme yok', hurt.injuryTimer === 490);
    st().buffs.tradition = st().totalMinutes + 600;
    hurt.injuryTimer = 4;
    fs().update({ gameMinutes: 10 });
    check('iyileşme biterse yara kapanır (isInjured false)', hurt.isInjured === false);
    hurt.isInjured = hs.injured;
    hurt.injuryTimer = hs.timer;
    hurt.task = hs.task;

    // --- Huy sözleri (ayrı metin katmanı) ve ikram ---
    const crowd = st().characters.filter((c) => !c.role && !c.away && !c.isChild).slice(0, 4);
    const [fest, craft, entre, plain] = crowd;
    const saved = crowd.map((c) => ({ c, task: c.task, quirk: c.quirk, speech: c.speech, visible: c.visible, needs: { ...c.needs }, feasted: c.feasted, buffs: { ...c.buffs } }));
    for (const c of crowd) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; c.feasted = undefined; }
    fest.quirk = 'festive'; craft.quirk = 'craftsman'; entre.quirk = 'entrepreneur'; plain.quirk = 'bookworm';
    const bubbles = crowd.map((c) => c.bubble);
    const seen = { festive: false, craftsman: false, entrepreneur: false, plain: false };
    const cur = st().currentFeast;
    cur.served = 0;
    for (let i = 0; i < 60; i++) {
      for (const c of crowd) c.speech = null;
      fs().update({ gameMinutes: 1e4 });
      if (FD.QUIRK_LINES.festive.includes(fest.speech?.text)) seen.festive = true;
      if (FD.QUIRK_LINES.craftsman.includes(craft.speech?.text)) seen.craftsman = true;
      if (FD.QUIRK_LINES.entrepreneur.includes(entre.speech?.text)) seen.entrepreneur = true;
      if (FD.TOAST_LINES.rich.includes(plain.speech?.text)) seen.plain = true;
    }
    check('Şenlik Neşesi şarkı tutturur, Zanaatkâr Ruhu işçiliği över, Girişimci Kanı bolluğu ticaret itibarına yorar; diğerleri kadeh sözü söyler', seen.festive && seen.craftsman && seen.entrepreneur && seen.plain, JSON.stringify(seen));
    check('sözler ayrı metin katmanında: ikon baloncuğuna (c.bubble) dokunulmaz', crowd.every((c, i) => c.bubble === bubbles[i]) && crowd.every((c) => c.speech === null || (c.speech.at === -1 && c.speech.duration === FD.FEAST.speechSeconds)));
    check('ikram tek seferliktir: her sakin gün başına bir kez alır (hunger, fun, social dolar)', crowd.every((c) => c.feasted === 24) && st().currentFeast.served <= st().currentFeast.servings);
    for (const o of saved) Object.assign(o.c, { task: o.task, quirk: o.quirk, speech: o.speech, visible: o.visible, feasted: o.feasted, needs: o.needs, buffs: o.buffs });

    // --- İzole üreteç (seed + 33) ---
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'feastSystem' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const own0 = fs().rng.state;
    for (const c of crowd) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; c.feasted = undefined; }
    fs().update({ gameMinutes: 5000 });
    goto(24, 22); fair().onHour(22);
    reset();
    supplyOf(n * 8, 20, { sherbet: 5, cloth: 2 });
    goto(28, 6); fair().onHour(6);
    Math.random = realRandom;
    for (const o of saved) Object.assign(o.c, { task: o.task, speech: o.speech, visible: o.visible, feasted: o.feasted });
    check('sofra, ikramlar ve sözler ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 33)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && fs().rng !== S().behavior.rng && fs().rng !== fair().rng && fs().rng.state !== own0);
    const probe = new FeastSystem(game, S().world, new Random(st().seed + 33), { attract: true });
    check('FeastSystem tohumu seed + 33\'tür', probe.rng.state === (st().seed + 33) >>> 0);
    probe.destroy();

    // --- Çizim ---
    {
      const calls = [];
      const fake = { fillRect: (x, y, w, h, c) => calls.push([x, y, w, h, c]) };
      const venue = FA.fairVenue(S().world);
      const dec = new FairDecor();
      let ok = true;
      const counts = {};
      const colors = (list) => new Set(list.map((c) => c[4])).size;
      for (const tier of FD.TIER_KEYS) for (const [label, left] of [['dolu', 8], ['bos', 0]]) {
        calls.length = 0;
        try { dec.draw(fake, venue, 1.1, 'spring', 'party', { tier, left, total: 8 }); } catch { ok = false; }
        counts[`${tier}-${label}`] = calls.length;
        if (calls.some((c) => c.slice(0, 4).some((v) => !Number.isFinite(v)) || typeof c[4] !== 'string')) ok = false;
      }
      calls.length = 0;
      dec.draw(fake, venue, 1.1, 'spring', 'party', null);
      const noFeast = calls.length;
      calls.length = 0;
      dec.draw(fake, venue, 1.1, 'spring', 'prep', { tier: 'rich', left: 8, total: 8 });
      const prepRich = calls.length;
      const lights = [];
      dec.collectLights(lights, venue, 'spring', 'party', { tier: 'rich', left: 8, total: 8 });
      const lights0 = [];
      dec.collectLights(lights0, venue, 'spring', 'party', null);
      check('FairDecor sofrası: üç seviye dolu / boş çizilir (dolu sofra daha çok öğe), hazırlıkta yalnızca örtü, şenlikte mum ışığı', ok && FD.TIER_KEYS.every((k) => counts[`${k}-dolu`] > noFeast && counts[`${k}-dolu`] >= counts[`${k}-bos`]) && counts['rich-dolu'] > counts['modest-dolu'] && counts['modest-dolu'] > counts['symbolic-dolu'] && prepRich < counts['rich-dolu'] && lights.length === lights0.length + 1, JSON.stringify(counts));
    }

    // --- Kayıt (sürüm 30) ---
    reset();
    supplyOf(n * 8, 20, { sherbet: 5, cloth: 2 });
    goto(32, 6); fair().onHour(6);
    goto(32, 18); fair().onHour(18);
    st().currentFeast.served = 3;
    const liveFeast = JSON.stringify(st().currentFeast);
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: currentFeast { tier, contributions } kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && JSON.stringify(raw.currentFeast) === liveFeast && raw.currentFeast.tier === 'rich');
    st().currentFeast = null;
    game.events.emit('ui:load');
    check('kayıttan süren sofra birebir döner (ikram sayacı dahil)', JSON.stringify(st().currentFeast) === liveFeast && st().currentFestival?.phase === 'party');
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.currentFeast = { tier: 'uydurma', day: 'x', contributions: { food: -3 } };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk sofra durumu temizlenir (null), oyun sorunsuz', st().currentFeast === null);
    game.events.emit('ui:save');
    const odd = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    odd.currentFeast = { tier: 'rich', day: st().time.day, contributions: { food: 'çok', bread: -2, sherbet: 1.7, cloth: null }, servings: 0, served: 99 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(odd));
    game.events.emit('ui:load');
    const o = st().currentFeast;
    check('eksik / saçma sayılar düzeltilir (ikram en az 1, yenen ikramı aşmaz, bağış tam sayı >= 0)', !o || (o.servings >= 1 && o.served <= o.servings && Object.values(o.contributions).every((v) => Number.isInteger(v) && v >= 0)));
    game.events.emit('ui:save');
    const stale = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    stale.currentFestival = null;
    stale.currentFeast = { tier: 'modest', day: st().time.day, contributions: { food: 3, bread: 0, sherbet: 0, cloth: 0 }, servings: 5, served: 0 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(stale));
    game.events.emit('ui:load');
    check('panayırı olmayan günde kalan sofra durumu açılışta temizlenir', st().currentFeast === null);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 29;
    delete old.currentFeast;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v29 kaydı: currentFeast yok -> null; oyun sorunsuz ilerler', st().currentFeast === null && (sim.step(120), true));

    // Eski durum geri
    reset();
    Object.assign(st().resources, keep.res);
    st().goldenAge.since = keep.since;
    Object.assign(st().events.festival, keep.festival, { active: false });
    goto(keep.day, keep.hour, keep.minute);
    offs.forEach((off) => off());
  }

  // ===== 26. aşama (26.3): gezgin konuklar, seyyar ozanlar ve nadir takaslar =====
  GuestClass.prototype.arrive = realArrive; // konuklar artık açık
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const GD = await import('/src/data/guest.js');
    const GU = await import('/src/systems/Guest.js');
    const FDATA = await import('/src/data/fair.js');
    const { GuestSystem } = await import('/src/systems/GuestSystem.js');
    const { GuestEffects } = await import('/src/rendering/GuestEffects.js');
    const { Random } = await import('/src/utils/random.js');
    const { TOWN_BUFFS } = await import('/src/data/town.js');
    const { immigrationStatus } = await import('/src/systems/TownStatus.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    const keep = { since: s0.goldenAge.since, day: s0.time.day, hour: s0.time.hour, minute: s0.time.minute, festival: { ...s0.events.festival }, res: { ...s0.resources }, book: JSON.parse(JSON.stringify(s0.guestBook)) };
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    rich();
    if (!S().world.getCompleted('fountain').length) sim.place('fountain', { instant: true });
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };
    const gs = () => S().guestSystem;
    const goto = (day, hour, minute = 0) => { const t = st().time; t.day = day; t.hour = hour; t.minute = minute; };
    const clearGuest = () => { if (st().activeGuest) { gs().character = null; S().world.guests = []; st().activeGuest = null; } gs().targetKey = null; };
    const reset = () => { clearGuest(); st().guestBook = GU.emptyGuestBook(); st().currentFestival = null; st().currentFeast = null; Object.assign(st().events.festival, { active: false, theme: null, endsAt: 0 }); st().seasonFestival.stage = null; for (const k of ['bardSong']) delete st().buffs[k]; };
    const makeGuest = (type, extra = {}) => {
      clearGuest();
      const entry = S().world.findEntryTile(new Random(7));
      const p = S().world.standPoint(entry.x, entry.y);
      st().activeGuest = { type, name: GD.GUEST_TYPES[type].names[0], look: 0, arrivalDay: st().time.day, departureDay: st().time.day + 1, x: p.x, y: p.y, leaving: false, resting: false, barters: 0, lastBarterDay: null, exit: null, ...extra };
      gs().spawn();
      gs().route();
      return gs().character;
    };
    const evs = [];
    const offs = ['guest:arrived', 'guest:left', 'guest:barter', 'toast'].map((n) => game.events.on(n, (p) => evs.push({ n, p })));
    const supply = (res) => { st().pantry.credit = 0; Object.assign(st().resources, res); };

    // --- Veri ---
    check('üç gezgin: Seyyar Ozan, Nadir Takasçı, Yaşlı Seyyah (aralık 6-8 gün, kalış 24-48 saat, giriş 09:00)', GD.GUEST_KEYS.join() === 'bard,collector,storyteller' && GD.GUEST_TYPES.bard.name === 'Seyyar Ozan' && GD.GUEST_TYPES.collector.name === 'Nadir Takasçı' && GD.GUEST_TYPES.storyteller.name === 'Yaşlı Seyyah' && GD.GUEST.intervalDays.join() === '6,8' && GD.GUEST.stayDays.join() === '1,2' && GD.GUEST.arrivalHour === 9);
    check('nadir takaslar: Antik Şema, Mermer Heykel Parçası, Egzotik Tohum; Ozan Ezgisi bonusu', GD.BARTER_KEYS.join() === 'schema,shard,seed' && GD.BARTER_OFFERS.schema.name === 'Antik Şema' && GD.BARTER_OFFERS.shard.name === 'Mermer Heykel Parçası' && GD.BARTER_OFFERS.seed.name === 'Egzotik Tohum' && TOWN_BUFFS.bardSong.name === 'Ozan Ezgisi');

    // --- Altın Çağ kapısı ---
    reset();
    s0.goldenAge.since = null;
    goto(9, 8, 59);
    evs.length = 0;
    sim.step(5);
    check('Altın Çağ öncesinde konuk gelmez (arrivalDue false, activeGuest null, olay yok)', !GU.arrivalDue(st()) && st().activeGuest === null && S().world.guests.length === 0 && !evs.some((e) => e.n === 'guest:arrived'));
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };

    // --- Doğal akışla ilk konuk: 09:00 giriş, geçici misafir, nüfus ve konut etkilenmez ---
    reset();
    const free0 = immigrationStatus(st()).freeBeds;
    const popBefore = st().characters.length;
    const worldBefore = S().world.characters.length;
    st().guestBook.nextDay = 10;
    goto(10, 8, 59);
    evs.length = 0;
    sim.step(5);
    const ag = st().activeGuest;
    check('09:00: konuk harita kenarından girer (activeGuest { type, arrivalDay, departureDay }), toast ve Günlük', ag && ag.arrivalDay === 10 && ag.departureDay >= 11 && ag.departureDay <= 12 && st().time.hour === 9 && evs.some((e) => e.n === 'guest:arrived') && st().journal.some((e) => e.day === 10 && e.text.includes(ag.name)) && S().world.guests.length === 1, JSON.stringify(ag));
    const gc = S().world.guests[0];
    check('konuk geçici misafirdir (isGuest): state.characters ve world.characters\'ta yok; nüfus, konut ve göç kapasitesi aynı', gc?.isGuest === true && !st().characters.includes(gc) && !S().world.characters.includes(gc) && st().characters.length === popBefore && S().world.characters.length === worldBefore && immigrationStatus(st()).freeBeds === free0 && gc.homeId == null);
    let leaks = 0;
    for (let i = 0; i < 70; i++) {
      sim.step(60);
      const g = S().world.guests[0];
      if (g && (st().characters.includes(g) || S().world.characters.includes(g))) leaks++;
      if (st().characters.some((c) => c.isGuest) || S().world.characters.some((c) => c.isGuest) || st().characters.length !== S().world.characters.length) leaks++;
    }
    check('günlerce kalış boyunca konuk hiçbir zaman sakin listesine karışmaz (nüfus sayacı iki listede de tutarlı, konuk sayılmaz)', leaks === 0);
    const leftEv = () => evs.find((e) => e.n === 'guest:left');
    let guard = 0;
    while (!leftEv() && guard++ < 200) sim.step(120);
    const book = st().guestBook;
    const dd = leftEv()?.p.guest.departureDay;
    check('kalış 24-48 saat: ayrılış gününün sabahı teşekkür mesajıyla yola çıkar; konuk kalkar, sonraki geliş 6-8 gün sonra', leftEv() && st().activeGuest === null && S().world.guests.length === 0 && leftEv().p.guest.arrivalDay === 10 && (dd === 11 || dd === 12) && st().time.day >= dd && evs.some((e) => e.n === 'toast' && e.p.text === GD.GUEST_TYPES[leftEv().p.guest.type].thanks.replace('{name}', leftEv().p.guest.name)) && book.nextDay - dd >= 6 && book.nextDay - dd <= 8 && book.visits === 1, `${dd} ${book.nextDay} ${st().time.day}`);

    // --- Panayır yakınında erken gelebilir ---
    reset();
    st().guestBook.nextDay = 13;
    goto(12, 8, 59);
    sim.step(5);
    check('panayır günü (12) sıradaki gün 13 olsa bile konuk panayırla birlikte gelir', st().activeGuest?.arrivalDay === 12);
    reset();
    st().guestBook.nextDay = 15;
    goto(12, 8, 59);
    sim.step(5);
    check('sıradaki gün panayırdan 2 günden fazla uzaksa erken gelmez', st().activeGuest === null);

    // --- Seyyar Ozan ---
    reset();
    const crowd = st().characters.filter((c) => !c.role && !c.away && !c.isChild).slice(0, 3);
    const [lis, far, adult] = crowd;
    const saved = crowd.map((c) => ({ c, task: c.task, x: c.x, y: c.y, needs: { ...c.needs }, visible: c.visible, speech: c.speech }));
    goto(12, 19, 0);
    const bard = makeGuest('bard');
    bard.clearPath();
    gs().onHour(18);
    check('ozan 18:00\'de çalmaya başlar: Ozan Ezgisi bonusu 22:00\'ye kadar etkin', st().buffs.bardSong > st().totalMinutes && st().buffs.bardSong <= st().totalMinutes + 3 * 60 + 1);
    for (const c of crowd) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; c.needs.fun = 40; }
    lis.x = bard.x + 20; lis.y = bard.y;
    far.x = bard.x + 600; far.y = bard.y;
    gs().dest = { key: 'play', tile: null, rest: false };
    const bubbles = crowd.map((c) => c.bubble);
    gs().update({ gameMinutes: 10 });
    check('dinleyenin keyif barı hızla dolar (yakında + , uzakta değişmez); ozan çalıyor', Math.abs(lis.needs.fun - (40 + GD.GUEST_TYPES.bard.funPerMinute * 10)) < 1e-6 && far.needs.fun === 40 && bard.playing === true);
    bard.speech = null;
    gs().update({ gameMinutes: 1e4 });
    check('şarkı sözleri ayrı metin katmanında (c.speech); ikon baloncuğuna dokunulmaz', GD.GUEST_TYPES.bard.lines.includes(bard.speech?.text) && bard.speech.at === -1 && bard.speech.duration === GD.GUEST.speechSeconds && crowd.every((c, i) => c.bubble === bubbles[i]) && !bard.bubble);
    gs().onHour(23);
    for (const o of saved) Object.assign(o.c, { task: o.task, x: o.x, y: o.y, needs: o.needs, visible: o.visible, speech: o.speech });

    // --- Nadir Takasçı ---
    reset();
    goto(12, 12, 0);
    const col = makeGuest('collector');
    supply({ cloth: 12, sherbet: 12, food: 300, bread: 20, gold: 50 });
    const foodB = st().resources.food;
    const goldB = st().resources.gold;
    const exB = JSON.stringify(st().exploration);
    evs.length = 0;
    gs().onHour(12);
    const cost = Object.entries(GD.BARTER_OFFERS[evs.find((e) => e.n === 'guest:barter')?.p.key ?? 'seed'].cost);
    check('öğlen fazla lüks mallarla nadir takas: bedel depodan düşer, ganimet kasabaya geçer, sayaçlar ve Günlük', evs.some((e) => e.n === 'guest:barter') && cost.every(([r, q]) => st().resources[r] === 12 - q) && JSON.stringify(st().exploration) !== exB && st().guestBook.barters === 1 && Object.values(st().guestBook.rare).reduce((a, b) => a + b, 0) === 1 && st().journal.some((e) => e.text.startsWith('Nadir takas:')));
    check('takas kilerdeki erzağa ve altına dokunmaz', st().resources.food === foodB && st().resources.gold === goldB);
    const b1 = st().guestBook.barters;
    gs().onHour(12);
    check('aynı gün ikinci takas yok', st().guestBook.barters === b1);
    st().activeGuest.lastBarterDay = null;
    supply({ cloth: 2, sherbet: 2 });
    evs.length = 0;
    gs().onHour(12);
    check('stok rezervde (Kumaş 2, Şerbet 2) ise takas yapılmaz: "fazla lüks mal yok" der, stok aynı', !evs.some((e) => e.n === 'guest:barter') && st().resources.cloth === 2 && st().resources.sherbet === 2 && col.speech?.text === GD.GUEST_TYPES.collector.noBarter);
    supply({ cloth: 12, sherbet: 12 });
    st().activeGuest.lastBarterDay = null;
    st().activeGuest.barters = 2;
    gs().onHour(12);
    check('kalış başına en çok 2 takas', st().guestBook.barters === b1);
    check('takaslar tüm teklifleri sırayla kullanabilir: her teklif bedeli ve ganimeti tanımlı', GD.BARTER_KEYS.every((k) => Object.keys(GD.BARTER_OFFERS[k].cost).every((r) => ['cloth', 'sherbet'].includes(r)) && ['inscription', 'relicShard', 'vineSeed'].includes(GD.BARTER_OFFERS[k].grant)));

    // --- Yaşlı Seyyah (Masalcı) ---
    reset();
    goto(12, 11, 0);
    const tel = makeGuest('storyteller');
    tel.clearPath();
    gs().dest = { key: 'tell', tile: null, rest: false };
    const cand = st().characters.filter((c) => !c.role && !c.away);
    const kid = cand[0], elder = cand[1], grown = cand[2];
    const savedT = [kid, elder, grown].map((c) => ({ c, task: c.task, x: c.x, y: c.y, skills: { ...c.skills }, speech: c.speech, visible: c.visible, lifeStage: c.lifeStage, growsUpAt: c.growsUpAt }));
    for (const c of [kid, elder, grown]) { c.task = null; c.visible = true; c.speech = null; c.x = tel.x + 15; c.y = tel.y; }
    kid.lifeStage = 'youth'; elder.lifeStage = 'elder'; grown.lifeStage = 'adult';
    const xp0 = [kid.skills.scholarship ?? 0, grown.skills.scholarship ?? 0];
    const w0 = st().guestBook.wisdom;
    gs().update({ gameMinutes: 10 });
    check('masalcı çardakta anlatırken dinleyen genç / çocuğun Bilgelik deneyimi artar, yetişkininki artmaz; Kasaba Bilgeliği sayacı', Math.abs((kid.skills.scholarship ?? 0) - (xp0[0] + GD.GUEST_TYPES.storyteller.xpPerMinute * 10)) < 1e-6 && (grown.skills.scholarship ?? 0) === xp0[1] && st().guestBook.wisdom > w0 && tel.activityLabel === 'Masal anlatıyor');
    tel.speech = null; elder.speech = null;
    gs().update({ gameMinutes: 1e4 });
    check('masallar ve Kıdemli Bilge ile nostaljik sohbet ayrı metin katmanında', (GD.GUEST_TYPES.storyteller.lines.includes(tel.speech?.text) || GD.GUEST_TYPES.storyteller.elderLines.includes(tel.speech?.text)) && (!elder.speech || GD.GUEST_TYPES.storyteller.elderLines.includes(elder.speech.text)));
    for (const o of savedT) Object.assign(o.c, { task: o.task, x: o.x, y: o.y, skills: o.skills, speech: o.speech, visible: o.visible, lifeStage: o.lifeStage, growsUpAt: o.growsUpAt });

    // --- Gece dinlenme, uyanma, ayrılış ---
    reset();
    goto(20, 21, 30);
    makeGuest('bard', { departureDay: 21 });
    const bc = S().world.guests[0];
    goto(20, 22, 0);
    gs().onHour(22);
    check('22:00\'de konuk dinlenme yerine (han, yoksa çardak / meydan) yürür', gs().dest?.rest === true);
    bc.clearPath();
    gs().update({ gameMinutes: 1 });
    check('dinlenmeye çekilince görünmez olur (resting), kayda da yazılır', st().activeGuest.resting === true && bc.visible === false);
    goto(21, 7, 0);
    gs().onHour(7);
    check('07:00\'de uyanır ve yeniden görünür', st().activeGuest.resting === false && bc.visible === true);
    goto(21, 9, 0);
    evs.length = 0;
    gs().onHour(9);
    check('ayrılış gününün 09:00\'unda yola çıkar (leaving), kenara varınca ayrılır', st().activeGuest.leaving === true || st().activeGuest === null);
    let steps = 0;
    while (st().activeGuest && steps++ < 400) sim.step(30);
    check('ayrılınca teşekkür mesajı, world.guests boşalır, nextDay 6-8 gün sonra', st().activeGuest === null && S().world.guests.length === 0 && evs.some((e) => e.n === 'guest:left') && st().guestBook.nextDay >= 21 + 6);

    // --- İzole üreteç (seed + 34) ---
    reset();
    const rngs = Object.entries(S()).filter(([k, v]) => k !== 'guestSystem' && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const states = rngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    const own0 = gs().rng.state;
    st().guestBook.nextDay = 30;
    goto(30, 9, 0);
    gs().onHour(9);
    supply({ cloth: 12, sherbet: 12 });
    gs().onHour(12);
    gs().update({ gameMinutes: 5000 });
    Math.random = realRandom;
    check('konuk geliş zamanı, kimliği, takasları ve sözleri ana üreteçleri ve Math.random\'u tüketmez (kendi üreteci seed + 34)', rngs.length > 5 && rngs.every((r, i) => r.state === states[i]) && randomCalls === 0 && gs().rng !== S().behavior.rng && gs().rng !== S().fairSystem.rng && gs().rng.state !== own0);
    clearGuest();
    const probe = new GuestSystem(game, S().world, new Random(st().seed + 34), { attract: true });
    check('GuestSystem tohumu seed + 34\'tür', probe.rng.state === (st().seed + 34) >>> 0);
    probe.destroy();
    S().world.guests = gs().character ? [gs().character] : [];

    // --- Çizim ---
    {
      const calls = [];
      const imgs = [];
      const fake = { fillRect: (x, y, w, h, c) => calls.push([x, y, w, h, c]), drawImage: (img, x, y) => imgs.push([x, y]) };
      const fx = new GuestEffects();
      let ok = true;
      const counts = {};
      for (const type of GD.GUEST_KEYS) for (const facing of ['left', 'right', 'down', 'up']) {
        calls.length = 0;
        try { fx.drawAccessory(fake, 100, 100, 18, facing, type, 1.2, true); } catch { ok = false; }
        counts[type] = calls.length;
        if (!calls.length || calls.some((c) => c.slice(0, 4).some((v) => !Number.isFinite(v)) || typeof c[4] !== 'string')) ok = false;
      }
      const g = { visible: true, playing: true, x: 100, y: 100 };
      fx.drawNotes(fake, g, 2.3);
      const noteCount = imgs.length;
      imgs.length = 0;
      fx.drawNotes(fake, { ...g, playing: false }, 2.3);
      check('GuestEffects: üç tür dört yönde aksesuarla çizilir, ozan çalarken notalar yükselir (çalmazken yok)', ok && GD.GUEST_KEYS.every((t) => counts[t] > 3) && noteCount > 2 && imgs.length === 0, JSON.stringify(counts));
    }

    // --- Kayıt (sürüm 31) ---
    reset();
    goto(40, 20, 0);
    makeGuest('collector', { departureDay: 41, barters: 1, lastBarterDay: 40 });
    st().guestBook.visits = 3; st().guestBook.barters = 2; st().guestBook.rare = { schema: 1, shard: 1, seed: 0 }; st().guestBook.wisdom = 12.345; st().guestBook.nextDay = 49;
    const liveG = JSON.stringify(st().activeGuest);
    const liveB = JSON.stringify(st().guestBook);
    game.events.emit('ui:save');
    const raw = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    check('kayıt sürümü 32: activeGuest ve guestBook kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw.version === 32 && JSON.stringify(raw.activeGuest) === liveG && JSON.stringify(raw.guestBook) === liveB);
    st().activeGuest = null;
    game.events.emit('ui:load');
    check('kayıttan konuk kaldığı yerde döner (haritada yeniden oluşur), defter birebir', JSON.stringify(st().activeGuest) === liveG && JSON.stringify(st().guestBook) === liveB && S().world.guests.length === 1 && S().world.guests[0].isGuest === true);
    game.events.emit('ui:save');
    const bad = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    bad.activeGuest = { type: 'uydurma', arrivalDay: 'x' };
    bad.guestBook = { nextDay: 'çok', visits: -4, lastType: 'uydurma', rare: { schema: 'x' }, wisdom: 'bol' };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(bad));
    game.events.emit('ui:load');
    check('bozuk konuk ve defter temizlenir, oyun sorunsuz', st().activeGuest === null && st().guestBook.nextDay === null && st().guestBook.visits === 0 && st().guestBook.lastType === null && st().guestBook.wisdom === 0 && S().world.guests.length === 0);
    game.events.emit('ui:save');
    const odd = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    odd.activeGuest = { type: 'bard', name: '', look: 99, arrivalDay: 5, departureDay: 2, x: 10, y: 10, barters: -3 };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(odd));
    game.events.emit('ui:load');
    const og = st().activeGuest;
    check('eksik / saçma alanlar düzeltilir (ayrılış varıştan önce olamaz, görünüş geçerli, ad dolu, takas >= 0)', og === null || (og.departureDay >= og.arrivalDay && og.look === 0 && og.name.length > 0 && og.barters === 0));
    game.events.emit('ui:save');
    const stale = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    stale.activeGuest = { type: 'storyteller', name: 'Eski Konuk', look: 0, arrivalDay: 1, departureDay: 2, x: 50, y: 50, leaving: false, resting: false, barters: 0, lastBarterDay: null };
    localStorage.setItem('lmgame.save.v2', JSON.stringify(stale));
    game.events.emit('ui:load');
    check('süresi dolmuş konuk açılışta sessizce uğurlanır, sonraki geliş günü kurulur', st().activeGuest === null && S().world.guests.length === 0 && st().guestBook.nextDay >= st().time.day + 6);
    game.events.emit('ui:save');
    const old = JSON.parse(localStorage.getItem('lmgame.save.v2'));
    old.version = 30;
    delete old.activeGuest;
    delete old.guestBook;
    localStorage.setItem('lmgame.save.v2', JSON.stringify(old));
    game.events.emit('ui:load');
    check('v30 kaydı: activeGuest yok -> null, boş konuk defteri; oyun sorunsuz ilerler', st().activeGuest === null && JSON.stringify(st().guestBook) === JSON.stringify(GU.emptyGuestBook()) && (sim.step(120), true));

    // Eski durum geri
    reset();
    Object.assign(st().resources, keep.res);
    st().guestBook = JSON.parse(JSON.stringify(keep.book));
    st().goldenAge.since = keep.since;
    Object.assign(st().events.festival, keep.festival, { active: false });
    goto(keep.day, keep.hour, keep.minute);
    offs.forEach((off) => off());
  }

  // ===== 27. aşama (27.1): kayıt bütünlüğü, ziyafet kileri ve determinizm onarımları =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const FA = await import('/src/systems/Fair.js');
    const FT = await import('/src/systems/Feast.js');
    const FDATA = await import('/src/data/fair.js');
    const GD = await import('/src/data/guest.js');
    const GU = await import('/src/systems/Guest.js');
    const LS = await import('/src/systems/LifeStages.js');
    const { storageLimit } = await import('/src/systems/Granary.js');
    const { updateSpeechBubbles, drawSpeechBubbles } = await import('/src/rendering/SpeechBubbles.js');
    const { GUEST_ID } = await import('/src/systems/GuestSystem.js');
    const { Random } = await import('/src/utils/random.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    const keep = { since: s0.goldenAge.since, day: s0.time.day, hour: s0.time.hour, minute: s0.time.minute, festival: { ...s0.events.festival }, res: { ...s0.resources } };
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    rich();
    if (!S().world.getCompleted('fountain').length) sim.place('fountain', { instant: true });
    s0.goldenAge.since = { day: 1, hour: 8, minute: 0 };
    const goto = (day, hour, minute = 0) => { const t = st().time; t.day = day; t.hour = hour; t.minute = minute; };
    const clearGuest = () => { const g = S().guestSystem; if (st().activeGuest) { g.character = null; S().world.guests = []; st().activeGuest = null; } g.targetKey = null; };
    const reset = () => { clearGuest(); st().currentFestival = null; st().currentFeast = null; Object.assign(st().events.festival, { active: false, theme: null, endsAt: 0 }); st().seasonFestival.stage = null; S().fairSystem.attendees.clear(); for (const k of ['tradition', 'bounty']) delete st().buffs[k]; };
    const fairDay = (() => { let d = 40; while (!FA.isFairDay(d)) d++; return d; })();
    const residents = () => st().characters.filter((c) => !c.role && !c.isChild && !c.away);
    const dance = (list) => { for (const c of list) { c.task = { activity: 'festival', phase: 'perform' }; c.visible = true; c.speech = null; } };
    const save = () => { game.events.emit('ui:save'); return JSON.parse(localStorage.getItem('lmgame.save.v2')); };
    const load = (data) => { if (data) localStorage.setItem('lmgame.save.v2', JSON.stringify(data)); game.events.emit('ui:load'); };

    // --- 1.1 Ziyafet: çift ikram ve negatif kiler iadesi ---
    reset();
    goto(fairDay, 19);
    st().currentFestival = { type: 'summer', day: fairDay, phase: 'party', participants: [] };
    Object.assign(st().events.festival, { active: true, theme: FDATA.FAIR.theme, endsAt: st().totalMinutes + 180 });
    st().currentFeast = { tier: 'modest', day: fairDay, contributions: { food: 30, bread: 0, sherbet: 0, cloth: 0 }, servings: 3, served: 0, eatenIds: [] };
    const eaters = residents().slice(0, 3);
    dance(eaters);
    S().feastSystem.update({ gameMinutes: 1 });
    const eatenBefore = [...st().currentFeast.eatenIds];
    check('27.1: ikram alanlar sofrada kayda girer (currentFeast.eatenIds)', st().currentFeast.served === 3 && eatenBefore.length === 3 && eaters.every((c) => eatenBefore.includes(c.id)), JSON.stringify(st().currentFeast));
    const raw1 = save();
    check('27.1: kayıt sürümü 32 korunur; eatenIds kayda yazılır', CONFIG.SAVE_VERSION === 32 && raw1.version === 32 && JSON.stringify(raw1.currentFeast.eatenIds) === JSON.stringify(eatenBefore));
    load();
    const reloaded = st().characters.filter((c) => eatenBefore.includes(c.id));
    check('27.1: yüklemede eatenIds\'teki sakinlerin c.feasted işareti yeniden kurulur', reloaded.length === 3 && reloaded.every((c) => c.feasted === fairDay), reloaded.map((c) => c.feasted).join());
    st().currentFeast.servings = 10; // sofrada yer olsa bile aynı sakin ikinci kez yemez
    for (const c of reloaded) c.feasted = undefined; // bellek işareti silinse de kayıttaki liste korur
    dance(reloaded);
    const hunger = reloaded.map((c) => c.needs.hunger);
    S().feastSystem.update({ gameMinutes: 1 });
    check('27.1: kayıt -> yükleme sonrası aynı sakin ikinci kez ikram almaz (served ve tokluk aynı)', st().currentFeast.served === 3 && st().currentFeast.eatenIds.length === 3 && reloaded.every((c, i) => c.needs.hunger === hunger[i]), `${st().currentFeast.served}`);
    const fresh = residents().find((c) => !eatenBefore.includes(c.id));
    dance([fresh]);
    S().feastSystem.update({ gameMinutes: 1 });
    check('27.1: henüz yemeyen sakin ikramını alır', st().currentFeast.served === 4 && st().currentFeast.eatenIds.includes(fresh.id));
    st().currentFeast.servings = 4;
    const more = residents().filter((c) => !st().currentFeast.eatenIds.includes(c.id)).slice(0, 3);
    dance(more);
    S().feastSystem.update({ gameMinutes: 1 });
    check('27.1: sofra dolunca (served >= servings) ikram durur', st().currentFeast.served === 4 && st().currentFeast.eatenIds.length === 4 && S().feastSystem.serve(more[0], st().currentFeast, { hunger: 1, fun: 1, social: 1 }, st().totalMinutes) === false);
    // Bozuk / eski kayıttan taşmış sayaç: oran 0'ın altına inmez
    st().currentFeast.served = 9;
    st().resources.food = 100;
    const endEv = [];
    const offEnd = game.events.on('feast:ended', (p) => endEv.push(p));
    S().feastSystem.clearTable();
    offEnd();
    check('27.1: served > servings olsa bile 22:00 iadesi negatif olmaz, kilerden erzak silinmez', st().resources.food === 100 && endEv[0]?.refund.food === 0 && endEv[0].refund.bread === 0, JSON.stringify(endEv[0]?.refund));
    check('27.1: sanitizeCurrentFeast: eatenIds yoksa [] (v2-v31), bozuksa temizlenir, served en az eatenIds kadar', JSON.stringify(FT.sanitizeCurrentFeast({ tier: 'modest', day: 3, contributions: {}, servings: 4, served: 1 }).eatenIds) === '[]' && JSON.stringify(FT.sanitizeCurrentFeast({ tier: 'modest', day: 3, contributions: {}, servings: 4, served: 0, eatenIds: [5, 'x', 5, 7.2, null] }).eatenIds) === '[5,7]' && FT.sanitizeCurrentFeast({ tier: 'modest', day: 3, contributions: {}, servings: 4, served: 0, eatenIds: [1, 2] }).served === 2 && JSON.stringify(FT.sanitizeCurrentFeast({ tier: 'modest', day: 3, servings: 2, eatenIds: 'bozuk' }).eatenIds) === '[]');
    // 1.2 Depo sınırı
    const limit = storageLimit(st(), 'food');
    st().currentFeast = { tier: 'modest', day: fairDay, contributions: { food: 40, bread: 0, sherbet: 0, cloth: 0 }, servings: 4, served: 0, eatenIds: [] };
    st().resources.food = limit - 5;
    S().feastSystem.clearTable();
    check('27.1: 22:00 iadesi depo sınırını aşmaz (Granary.storageLimit)', st().resources.food === limit, `${st().resources.food}/${limit}`);

    // --- 1.2 Panayır iptali: sabah ayrılan erzak kilere döner ---
    reset();
    st().resources.food = 120; st().resources.bread = 30; st().resources.sherbet = 8; st().resources.cloth = 6;
    const before = { food: 120, bread: 30, sherbet: 8, cloth: 6 };
    goto(fairDay, 6);
    S().fairSystem.onHour(6);
    const set = st().currentFeast;
    const taken = set ? set.contributions.food + set.contributions.bread + set.contributions.sherbet + set.contributions.cloth : 0;
    const venues = FDATA.FAIR.venues.flatMap((t) => S().world.getCompleted(t)).filter((b) => !b.damaged);
    for (const b of venues) b.damaged = true;
    const cancelEv = [];
    const offC = ['fair:cancelled', 'feast:cancelled'].map((n) => game.events.on(n, (p) => cancelEv.push(n)));
    goto(fairDay, 18);
    S().fairSystem.onHour(18);
    for (const b of venues) b.damaged = false;
    offC.forEach((off) => off());
    check('27.1: şenlikten önce meydan hasarlıysa panayır iptal edilir, sabah ayrılan erzağın tamamı kilere döner', set && taken > 0 && st().currentFestival === null && st().currentFeast === null && cancelEv.includes('fair:cancelled') && cancelEv.includes('feast:cancelled') && ['food', 'bread', 'sherbet', 'cloth'].every((k) => st().resources[k] === before[k]), `${JSON.stringify(set?.contributions)} ${JSON.stringify(st().resources)}`);
    // Hazırlık evresinde kapanan panayır (şenlik saatine ulaşılamadı): saat başı sofra kaldırılır, erzak döner
    reset();
    Object.assign(st().resources, before);
    goto(fairDay, 6);
    S().fairSystem.onHour(6);
    const set2 = st().currentFeast;
    goto(fairDay, 22);
    S().fairSystem.onHour(22);
    S().feastSystem.dropStale();
    check('27.1: hazırlık evresinde kaldırılan sofranın erzağı da kilere döner', set2 && st().currentFeast === null && ['food', 'bread', 'sherbet', 'cloth'].every((k) => st().resources[k] === before[k]), JSON.stringify(st().resources));
    // İade de depo sınırına uyar
    reset();
    Object.assign(st().resources, before);
    goto(fairDay, 6);
    S().fairSystem.onHour(6);
    const set3 = st().currentFeast;
    st().resources.food = storageLimit(st(), 'food') - 1;
    S().feastSystem.returnTable();
    check('27.1: iptal iadesi depo sınırını aşmaz', set3 && st().resources.food === storageLimit(st(), 'food'));

    // --- 1.3 Panayır katılımcıları kayda girer ---
    reset();
    goto(fairDay, 6);
    S().fairSystem.onHour(6);
    goto(fairDay, 18);
    S().fairSystem.onHour(18);
    const dancers = residents().slice(0, 4);
    dance(dancers);
    S().fairSystem.update({ gameMinutes: 1 });
    const ids = dancers.map((c) => c.id);
    check('27.1: dans eden sakinler currentFestival.participants\'a yazılır', st().currentFestival?.phase === 'party' && ids.every((id) => st().currentFestival.participants.includes(id)), JSON.stringify(st().currentFestival));
    const raw2 = save();
    load();
    check('27.1: şenlik ortasında kayıt -> yükleme katılımcıları korur (FairSystem.attendees participants\'tan kurulur)', JSON.stringify(raw2.currentFestival.participants) === JSON.stringify(st().currentFestival.participants) && ids.every((id) => S().fairSystem.attendees.has(id)));
    for (const c of st().characters) if (c.task?.activity === 'festival') c.task = null; // yüklemeden sonra kimse dans etmese bile
    const endF = [];
    const offF = game.events.on('fair:ended', (p) => endF.push(p));
    goto(fairDay, 22);
    S().fairSystem.onHour(22);
    offF();
    const fm = FDATA.FAIRS[raw2.currentFestival.type].memory;
    check('27.1: kapanış sayımı ve anılar yüklemeden önce dans edenleri de içerir', endF[0] && ids.every((id) => endF[0].attendees.includes(id)) && ids.every((id) => S().world.getCharacter(id)?.memories.some((m) => m.text === fm)), `${endF[0]?.attendees.length}`);
    check('27.1: sanitizeCurrentFestival: participants yoksa [] (v2-v31), bozuk girdiler temizlenir', JSON.stringify(FA.sanitizeCurrentFestival({ type: 'summer', day: 4, phase: 'party' }).participants) === '[]' && JSON.stringify(FA.sanitizeCurrentFestival({ type: 'summer', day: 4, phase: 'party', participants: [3, 3, 'x', 9] }).participants) === '[3,9]');
    reset();

    // --- 2.1 Konuşma balonu süresi simülasyonda düşer (çizim salt okunur) ---
    {
      const talker = residents()[0];
      talker.speech = { text: 'Deneme', at: -1, duration: 2 };
      sim.step(60); // 1 sn (başsız: hiç çizim yok)
      const midLeft = talker.speech?.remaining;
      sim.step(70);
      check('27.1: c.speech hiç çizilmeden update adımlarıyla biter (başsız simülasyon = çizimli oyun)', Math.abs(midLeft - 1) < 1e-6 && talker.speech === null, `${midLeft} ${JSON.stringify(talker.speech)}`);
      talker.speech = { text: 'Deneme', at: -1, duration: 2 };
      st().time.paused = true;
      sim.step(200);
      const kept = talker.speech;
      st().time.paused = false;
      check('27.1: oyun duraklatılmışken söz süresi işlemez', kept && (kept.remaining ?? kept.duration) === 2, JSON.stringify(kept));
      const ops = [];
      const ctx = { save() {}, restore() {}, measureText: () => ({ width: 30 }), fillRect: (...a) => ops.push(a), fillText: (...a) => ops.push(a), set font(v) {}, set textBaseline(v) {}, set globalAlpha(v) {}, set fillStyle(v) {} };
      talker.visible = true;
      talker.speech = { text: 'Deneme', at: -1, duration: 2, remaining: 0.5 };
      const snap = JSON.stringify(talker.speech);
      for (let i = 0; i < 300; i++) drawSpeechBubbles({ ctx }, { x: 0, y: 0, zoom: 2 }, [talker]);
      // (27.3) çizim yalnızca genişlik önbelleğini (width / widthText) yazar; metin ve süre aynı kalır
      const { width: _w, widthText: _wt, ...rest } = talker.speech;
      check('27.1: drawSpeechBubbles salt okunurdur (300 kare çizimde söz ve süresi aynı)', JSON.stringify(rest) === snap && _wt === talker.speech.text && ops.length > 0);
      const a = { speech: { text: 'a', at: -1, duration: 1 } };
      const b = { speech: { text: 'b', at: -1, duration: 3 } };
      updateSpeechBubbles([a], [b], 1.5);
      check('27.1: updateSpeechBubbles sakinlerin ve konukların sözlerini birlikte eskitir', a.speech === null && Math.abs(b.speech.remaining - 1.5) < 1e-9);
      talker.speech = null;
    }

    // --- 2.2 Konuk ortak Entity kimlik sayacını ilerletmez ---
    const Ch = st().characters[0].constructor;
    const app = st().characters[0].appearance;
    const makeGuest = (type, extra = {}) => {
      clearGuest();
      const entry = S().world.findEntryTile(new Random(7));
      const p = S().world.standPoint(entry.x, entry.y);
      st().activeGuest = { type, name: GD.GUEST_TYPES[type].names[0], look: 0, arrivalDay: st().time.day, departureDay: st().time.day + 1, x: p.x, y: p.y, leaving: false, resting: false, barters: 0, lastBarterDay: null, exit: null, ...extra };
      S().guestSystem.spawn();
      S().guestSystem.route();
      return S().guestSystem.character;
    };
    goto(fairDay + 3, 10);
    const id1 = new Ch({ name: 'Sayaç', traits: [], appearance: app }).id;
    const gch = makeGuest('storyteller');
    const id2 = new Ch({ name: 'Sayaç', traits: [], appearance: app }).id;
    check('27.1: konuk sabit negatif kimlikle kurulur; Entity kimlik sayacı kaymaz (sonraki çocuğun kimliği aynı)', gch.id === GUEST_ID && GUEST_ID < 0 && id2 === id1 + 1 && !st().characters.some((c) => c.id === gch.id), `${id1} -> ${id2}, konuk ${gch.id}`);

    // --- 2.3 Ayrılan konuk kayıt / yüklemede buharlaşmaz ---
    clearGuest();
    goto(fairDay + 4, 9, 30);
    const leaver = makeGuest('bard', { departureDay: fairDay + 4, arrivalDay: fairDay + 3 });
    const plaza = S().world.landmarks.plaza;
    const mid = S().world.standPoint(plaza.centerX, plaza.centerY + 2);
    leaver.x = mid.x; leaver.y = mid.y; leaver.clearPath();
    S().guestSystem.sendAway();
    const exitSaved = st().activeGuest?.exit;
    check('27.1: ayrılan konuk çıkış karosunu kayda yazar (activeGuest.exit)', st().activeGuest?.leaving === true && exitSaved && Number.isInteger(exitSaved.x) && S().guestSystem.character.isMoving);
    const raw3 = save();
    load();
    const back = S().world.guests[0];
    const lastWp = back?.waypoints?.[back.waypoints.length - 1];
    const exitPt = S().world.standPoint(exitSaved.x, exitSaved.y);
    sim.step(2);
    check('27.1: ayrılırken kayıt -> yükleme: konuk haritada kalır ve kayıttaki çıkışa yürür (anında buharlaşmaz)', st().activeGuest?.leaving === true && S().world.guests.length === 1 && back.isMoving && lastWp && lastWp.x === exitPt.x && lastWp.y === exitPt.y, `${JSON.stringify(st().activeGuest)}`);
    const left = [];
    const offL = game.events.on('guest:left', (p) => left.push(p));
    for (let i = 0; i < 400 && st().activeGuest; i++) sim.step(30);
    offL();
    check('27.1: yüklemeden sonra çıkışa vararak teşekkürle ayrılır', st().activeGuest === null && left.length === 1 && left[0].thanks === true && S().world.guests.length === 0);
    // Eski kayıt (exit alanı yok): en yakın kenar karosuna yürür
    delete raw3.activeGuest.exit;
    Object.assign(raw3.activeGuest, { x: mid.x, y: mid.y }); // meydanın ortasında yürürken kaydedilmiş gibi
    load(raw3);
    const old = S().world.guests[0];
    check('27.1: exit alanı olmayan (v31 öncesi biçim) ayrılan konuk en yakın kenara giden rotayla döner', st().activeGuest?.leaving === true && st().activeGuest.exit === null && old?.isMoving, `${JSON.stringify(st().activeGuest)} ${JSON.stringify(raw3.activeGuest)} ${raw3.time.day} ${raw3.time.hour} ${old?.tileX},${old?.tileY}`);
    // Yol tıkanınca rota yeniden kurulur
    const gsys = S().guestSystem;
    let rerouted = 0;
    const realWalk = gsys.walkToExit.bind(gsys);
    gsys.walkToExit = () => { rerouted++; return realWalk(); };
    const bench = S().construction.placeSite('parkBench', ...Object.values(sim.findSpot('parkBench'))).building; // gerçek şantiye: 'world:blocked'
    const afterPlace = rerouted;
    S().construction.demolish(bench, { quiet: true }); // gerçek yıkım: 'building:removed'
    gsys.walkToExit = realWalk;
    check('27.1: world:blocked (yeni şantiye) ve building:removed (yıkım) ayrılan konuğun çıkış rotasını yeniden hesaplatır', afterPlace === 1 && rerouted === 2 && st().activeGuest?.leaving === true, `${afterPlace} ${rerouted}`);
    clearGuest();
    goto(fairDay + 5, 11);
    const teller = makeGuest('storyteller', { departureDay: fairDay + 6 });
    gsys.targetKey = 'eski-hedef';
    const bench2 = S().construction.placeSite('parkBench', ...Object.values(sim.findSpot('parkBench'))).building;
    const walkable = (teller.waypoints ?? []).every((w) => S().world.map.isWalkable(Math.floor(w.x / 16), Math.floor(w.y / 16)));
    check('27.1: kalan konukta tıkanma sonrası hedef anahtarı sıfırlanır, yeni rota yürünebilir karolardan geçer', gsys.targetKey !== 'eski-hedef' && gsys.targetKey?.startsWith('tell') && walkable, gsys.targetKey);
    S().construction.demolish(bench2, { quiet: true });
    clearGuest();
    // destroy() dinleyicileri temizler
    const before3 = game.events.listeners?.get?.('world:blocked')?.size;
    const probe = new (S().guestSystem.constructor)(game, S().world, new Random(1), { attract: true });
    probe.destroy();
    const after3 = game.events.listeners?.get?.('world:blocked')?.size;
    check('27.1: GuestSystem.destroy world:blocked / building:removed dinleyicilerini kaldırır', before3 === after3, `${before3} ${after3}`);
    S().world.guests = [];

    // --- 3.1 Seferdeki / göç eden sakinler çekirdek iş gücü sayılmaz ---
    {
      const mk = (id, extra = {}) => ({ id, role: null, isChild: false, lifeStage: 'adult', emigrating: false, away: false, ...extra });
      const fake = (list) => ({ characters: list });
      const base = [mk(1), mk(2), mk(3), mk(9, { lifeStage: 'elder' })];
      const p0 = LS.retirementPlan(fake(base));
      const awayList = [mk(1), mk(2, { away: true }), mk(3), mk(9, { lifeStage: 'elder' })];
      const p1 = LS.retirementPlan(fake(awayList));
      const emList = [mk(1), mk(2), mk(3, { emigrating: true }), mk(9, { lifeStage: 'elder' })];
      const p2 = LS.retirementPlan(fake(emList));
      check('27.1: 3 yetişkinden 1\'i seferdeyse çekirdek kadro 2\'ye düşer, emekli bilge gönüllü usta olur', p0.retired.has(9) && LS.coreWorkers(fake(awayList)).length === 2 && p1.volunteers.has(9) && !p1.retired.has(9));
      check('27.1: köyü terk etmekte olan sakin de çekirdek kadrodan düşer', LS.coreWorkers(fake(emList)).length === 2 && p2.volunteers.has(9));
      // Gerçek sistemde: kasabada yalnızca 3 çalışabilir sakin varmış gibi (geri kalanı geçici çocuk) ve biri sefere çıkınca
      const ls = S().lifeStages;
      const pool = st().characters.filter((c) => !c.role && !c.isChild && c.lifeStage !== 'elder' && !c.emigrating);
      const elder = st().characters.find((c) => !c.role && !c.isChild && !c.away && !c.emigrating);
      const saved = st().characters.map((c) => ({ c, emigrating: c.emigrating, lifeStage: c.lifeStage, away: c.away, retired: c.retired }));
      const workers = pool.filter((c) => c !== elder).slice(0, 3);
      for (const c of st().characters) if (c !== elder && !workers.includes(c) && !c.role) c.emigrating = true; // geri kalanlar geçici olarak kadro dışı
      elder.lifeStage = 'elder';
      elder.retired = true;
      ls.refreshRetirement({ silent: true });
      const wasRetired = elder.retired;
      workers[0].away = true;
      ls.refreshRetirement({ silent: true });
      const volunteer = elder.retired === false;
      workers[0].away = saved.find((o) => o.c === workers[0]).away;
      ls.refreshRetirement({ silent: true });
      const backRetired = elder.retired;
      for (const o of saved) Object.assign(o.c, { emigrating: o.emigrating, lifeStage: o.lifeStage, away: o.away, retired: o.retired });
      ls.refreshRetirement({ silent: true });
      check('27.1: LifeStageSystem: sefere çıkan sakin yüzünden kadro 2\'ye düşünce bilge gönüllü usta olur, dönünce yeniden emekli', wasRetired === true && volunteer && backRetired === true);
    }

    // --- 3.2 Emekli bilge sabit iş yuvasını kilitlemez ---
    {
      const shop = S().world.buildings.find((b) => b.functional && b.workerSlots > 0 && !b.underConstruction);
      const sage = st().characters.find((c) => !c.role && !c.isChild && !shop.workerIds.has(c.id) && !c.away);
      const savedS = { workplaceId: sage.workplaceId, retired: sage.retired, lifeStage: sage.lifeStage };
      const others = S().world.characters.filter((o) => o !== sage && o.workplaceId === shop.id && !shop.workerIds.has(o.id) && !o.away && !o.retired).length;
      sage.workplaceId = shop.id;
      sage.lifeStage = 'elder';
      sage.retired = true;
      const r1 = S().jobs.reservedForPinned(shop);
      sage.retired = false;
      const r2 = S().jobs.reservedForPinned(shop);
      Object.assign(sage, savedS);
      check('27.1: emekli bilge (retired) sabit iş yuvasını tutmaz; gönüllü ustaya dönünce yine sayılır', r1 === others && r2 === others + 1, `${shop.type} ${r1}/${r2}`);
    }

    // Eski durum geri
    reset();
    Object.assign(st().resources, keep.res);
    st().goldenAge.since = keep.since;
    Object.assign(st().events.festival, keep.festival, { active: false });
    goto(keep.day, keep.hour, keep.minute);
  }

  // ===== 27. aşama (27.2): tıkanan mekaniklerin açılması (çıraklık, ocak devri, yadigâr, yeni nesil dilekçeler) =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const AD = await import('/src/data/apprenticeship.js');
    const AP = await import('/src/systems/Apprenticeship.js');
    const LN = await import('/src/systems/Lineage.js');
    const HL = await import('/src/systems/Heirloom.js');
    const HD = await import('/src/data/heirloom.js');
    const CZ = await import('/src/data/citizens.js');
    const CI = await import('/src/systems/Citizens.js');
    const PS = await import('/src/systems/PetitionSystem.js');
    const PT = await import('/src/systems/Petitions.js');
    const { CONFIG } = await import('/src/config.js');
    const Y = 16;
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const keepGA = s0.goldenAge.since;
    s0.goldenAge.since = s0.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
    sim.give({ wood: 600, stone: 400, iron: 120, food: 500, bread: 80 });
    const people = () => st().characters.filter((c) => !c.role && !c.away && !c.emigrating && !c.isChild).sort((a, b) => a.id - b.id);
    // Her senaryo değiştirdiği sakin alanlarını kaydedip geri yükler
    const FIELDS = ['lifeStage', 'ageInDays', 'agedDays', 'age', 'apprenticeship', 'workplaceId', 'task', 'away', 'married', 'partnerId', 'homeId', 'parents', 'children', 'generation', 'inventory', 'mentees', 'quirk', 'retired', 'relocating', 'emigrating'];
    const snapshot = () => st().characters.map((c) => ({ c, v: Object.fromEntries(FIELDS.map((k) => [k, Array.isArray(c[k]) ? [...c[k]] : c[k] && typeof c[k] === 'object' ? { ...c[k] } : c[k]])) }));
    const restore = (snap) => { for (const o of snap) Object.assign(o.c, o.v); };
    const snap0 = snapshot();
    const keepHeads = { ...s0.lineage.heads };
    const keepLineage = { handovers: s0.lineage.handovers, newHomes: s0.lineage.newHomes, petitions: s0.lineage.petitions, extended: s0.lineage.extended };
    const makeYouth = (c, age = 19) => { c.ageInDays = age * Y; c.agedDays = 0; c.age = age; c.lifeStage = 'youth'; c.profile = c.buildProfile(); c.apprenticeship = null; c.workplaceId = null; c.task = null; return c; };
    const mainRngs = Object.entries(S()).filter(([k, v]) => !['apprenticeship', 'lineageSystem', 'heirloomSystem', 'petitions'].includes(k) && v && v.rng && Number.isFinite(v.rng.state)).map(([, v]) => v.rng);
    const rngBefore = mainRngs.map((r) => r.state);
    let randomCalls = 0;
    const realRandom = Math.random;
    Math.random = () => { randomCalls++; return realRandom(); };
    // Yalnızca bu adımın sistem çağrıları ölçülür (sim.place gibi test yardımcıları değil)
    let rngViolations = 0;
    let isoCalls = 0;
    const iso = (fn) => {
      const b = mainRngs.map((r) => r.state);
      const rc = randomCalls;
      const out = fn();
      isoCalls++;
      if (randomCalls !== rc || mainRngs.some((r, i) => r.state !== b[i])) rngViolations++;
      return out;
    };

    // --- 1.1 Tezgâh Pratiği (boştaki atölye) ve ot toplayan Şifacı ---
    const sysA = () => S().apprenticeship;
    const ws = S().world.getCompleted('workshop').find((b) => !b.damaged) ?? sim.place('workshop');
    const hh = S().world.getCompleted('healerHut').find((b) => !b.damaged) ?? sim.place('healerHut');
    for (const c of st().characters) if (c.apprenticeship && [ws.id, hh.id].includes(c.apprenticeship.buildingId)) c.apprenticeship = null;
    const pool = people().filter((c) => c.lifeStage !== 'elder');
    const smith = pool[0];
    const healer = pool[1];
    const y1 = makeYouth(pool[pool.length - 1]);
    const y2 = makeYouth(pool[pool.length - 2]);
    const y3 = makeYouth(pool[pool.length - 3]);
    for (const [m, b, skill] of [[smith, ws, 'crafting'], [healer, hh, 'herbalism']]) { m.workplaceId = b.id; m.lifeStage = 'adult'; m.skills[skill] = 1600; m.task = null; m.away = false; }
    ws.damaged = false; ws.isBurning = false; hh.damaged = false; hh.isBurning = false;
    const enrolled1 = sysA().enroll(y1, ws);
    const enrolled2 = sysA().enroll(y2, hh);
    check('27.2: gençler Zanaat Atölyesi ve Şifacı Kulübesi\'ne çırak yazılır (ustaları atanır)', enrolled1 && enrolled2 && y1.apprenticeship.masterId === smith.id && y2.apprenticeship.masterId === healer.id, `${y1.apprenticeship?.masterId} ${y2.apprenticeship?.masterId}`);
    const prevIdle = ws.idle;
    ws.idle = false;
    check('27.2: 25.2 kuralı korunur: boşta olmayan atölyede usta tezgâhta değilken plan yok', iso(() => sysA().planFor(y1)) === null);
    ws.idle = true; // herkes ekipmanlı: sipariş yok, atölye boşta bekliyor
    const prac = iso(() => sysA().planFor(y1));
    check('27.2: atölye boştayken (idle) kayıtlı usta kasabadaysa çırak taburesine "Tezgâh Pratiği"ne gider', prac?.activity === 'apprentice' && prac.buildingId === ws.id && !prac.workBuildingId && sysA().masterAtWork(y1) === null && sysA().practiceMaster(y1) === smith, JSON.stringify(prac));
    delete smith.buffs.proudMaster; delete smith.buffs.proudSince;
    const t1 = { activity: 'apprentice', buildingId: ws.id, phase: 'perform', elapsed: 0 };
    y1.task = t1;
    const p1 = y1.apprenticeship.progress;
    const okP = iso(() => sysA().learn(y1, t1, 60));
    check('27.2: Tezgâh Pratiği normalin %60\'ı hızla ilerler; usta gururu / verim katkısı yok', okP && Math.abs(y1.apprenticeship.progress - p1 - 60 * AD.APPRENTICE.perMinute * AD.APPRENTICE.practiceRate) < 1e-9 && !(smith.buffs.proudMaster > st().totalMinutes) && y1.activityLabel.includes('Tezgâh Pratiği'), `${y1.apprenticeship.progress} ${y1.activityLabel}`);
    smith.away = true;
    check('27.2: ustası seferdeyken boştaki atölyede de pratik yok (çırak işine döner)', iso(() => sysA().planFor(y1)) === null && iso(() => sysA().learn(y1, t1, 1)) === false);
    smith.away = false;
    // Şifacı ustası kulübenin otlarını topluyor
    hh.idle = false;
    healer.task = { activity: 'gatherHerbs', buildingId: hh.id, workBuildingId: hh.id, phase: 'perform', elapsed: 0 };
    const planH = iso(() => sysA().planFor(y2));
    const t2 = { activity: 'apprentice', buildingId: hh.id, phase: 'perform', elapsed: 0 };
    y2.task = t2;
    const p2 = y2.apprenticeship.progress;
    const okH = iso(() => sysA().learn(y2, t2, 60));
    check('27.2: Şifacı ustası ot toplarken (gatherHerbs) mesaidedir: çırak kulübede tam hızla öğrenir', planH?.activity === 'apprentice' && sysA().masterAtWork(y2) === healer && okH && Math.abs(y2.apprenticeship.progress - p2 - 60 * AD.APPRENTICE.perMinute) < 1e-9);
    healer.task = null;
    hh.idle = true; // raflar dolu
    check('27.2: raflar dolu (idle) Şifacı Kulübesi\'nde de Tezgâh Pratiği', iso(() => sysA().planFor(y2))?.activity === 'apprentice' && iso(() => sysA().learn(y2, t2, 10)));
    // --- 1.2 Hasarlı / yanan yapı ve mesai ortası güvenlik ---
    hh.damaged = true;
    check('27.2: hasarlı yapıya çırak yazılmaz, ders planlanmaz; ders sürerken hasar alınca çırak kalkar', !AP.acceptsApprentice(st(), hh) && !sysA().enroll(y3, hh) && iso(() => sysA().planFor(y2)) === null && iso(() => sysA().learn(y2, t2, 1)) === false);
    hh.damaged = false;
    ws.isBurning = true;
    check('27.2: yanan yapıya çırak yazılmaz, ders planlanmaz; yanarken ders biter', !AP.acceptsApprentice(st(), ws) && iso(() => sysA().planFor(y1)) === null && iso(() => sysA().learn(y1, t1, 1)) === false);
    ws.isBurning = false;
    const res0 = { food: s0.resources.food, bread: s0.resources.bread, credit: s0.pantry.credit };
    s0.resources.food = 0; s0.resources.bread = 0; s0.pantry.credit = 0;
    const midFood = iso(() => sysA().learn(y1, t1, 1));
    Object.assign(s0.resources, { food: res0.food, bread: res0.bread }); s0.pantry.credit = res0.credit;
    check('27.2: mesai ortasında gıda kişi başı 6\'nın altına düşerse çırak dersi bırakır (temel işe döner)', midFood === false && iso(() => sysA().learn(y1, t1, 1)) === true);
    const others = st().characters.filter((c) => !c.role && !c.isChild && c.lifeStage !== 'youth' && !c.retired && !c.away && !c.emigrating);
    const awayKeep = others.map((c) => c.away);
    others.slice(2).forEach((c) => { c.away = true; });
    const midCore = iso(() => sysA().learn(y1, t1, 1));
    others.forEach((c, i) => { c.away = awayKeep[i]; });
    check('27.2: mesai ortasında çekirdek iş gücü 3\'ün altına düşerse çırak dersi bırakır', midCore === false);
    ws.idle = prevIdle;
    y1.apprenticeship = null; y2.apprenticeship = null;
    restore(snap0);

    // --- 2.1 Ocak Devri: tek şans değil; evli ev halkına devir; kütükteki reislik ---
    const LS = () => S().lineageSystem;
    const freeCabin = () => S().world.getCompleted('cabin').find((h) => h.functional && S().world.getResidents(h).length === 0) ?? sim.place('cabin');
    const [E, K, P, M1, M2, E2, E3, K3] = people().filter((c) => c.lifeStage !== 'elder');
    const asElder = (c) => { c.lifeStage = 'elder'; c.age = 70; c.ageInDays = 70 * Y; c.retired = true; };
    const cab1 = freeCabin();
    for (const c of st().characters) if (c !== E && c.homeId === cab1.id) c.homeId = null; // (28.1) boş sanılan kulübeye sonradan yerleşen olursa tohum kaymasında devir erken tetiklenmesin
    for (const c of [E]) c.homeId = cab1.id;
    asElder(E);
    E.children = [K.id]; K.parents = [E.id]; K.married = false; K.partnerId = null; P.married = false; P.partnerId = null;
    E.married = false; E.partnerId = null;
    for (const [homeId, headId] of Object.entries(st().lineage.heads)) if (headId === E.id) delete st().lineage.heads[homeId]; // (28.1) E'nin başka ocaklarda kalmış reisliği tek devir sayacını bozmasın
    st().lineage.heads[cab1.id] = E.id;
    const h0 = st().lineage.handovers;
    iso(() => LS().onElder(E));
    const noHeir = st().lineage.heads[cab1.id] === E.id && st().lineage.handovers === h0;
    K.married = P.married = true; K.partnerId = P.id; P.partnerId = K.id;
    const hEv = [];
    const offH = game.events.on('lineage:handover', (p) => hEv.push(p));
    iso(() => LS().onMarried(K, P));
    offH();
    check('27.2: bilgenin evladı 70 yaşında evli değilse devir bekler; evlat sonradan evlenince Ocak Devri tetiklenir', noHeir && st().lineage.heads[cab1.id] === K.id && st().lineage.handovers === h0 + 1 && hEv[0]?.heir === K && hEv[0]?.elder === E, `${noHeir} ${st().lineage.heads[cab1.id]} E${E.id} K${K.id} P${P.id} hEv${hEv.length} Ehome${E.homeId} cab1 ${cab1.id} Khome${K.homeId} Phome${P.homeId} elder ${E.lifeStage} Kstage ${K.lifeStage} Kaway ${K.away}`);
    // Evladı olmayan bilge: aynı evde yaşayan evli (kuşağı büyük) sakine devreder
    const cab2 = freeCabin() === cab1 ? sim.place('cabin') : freeCabin();
    E2.homeId = M1.homeId = M2.homeId = cab2.id;
    asElder(E2); E2.children = []; E2.married = false; E2.partnerId = null;
    M1.married = M2.married = true; M1.partnerId = M2.id; M2.partnerId = M1.id; M1.generation = 2; M2.generation = 1; M1.parents = []; M2.parents = [];
    st().lineage.heads[cab2.id] = E2.id;
    const pick2 = LN.chooseHearthHeir(st(), E2, cab2);
    iso(() => LS().onElder(E2));
    check('27.2: evli evladı olmayan bilgenin ocağı aynı evde yaşayan evli 2. kuşak sakine geçer', pick2 === M1 && st().lineage.heads[cab2.id] === M1.id && M1.memories.some((m) => m.kind === 'home' && m.text.includes(E2.name)), `${pick2?.name}`);
    // Kütükte reis göründüğü ev: bilge başka evde yaşasa da o evin reisliğini evladına devreder
    const cab3 = sim.place('cabin');
    asElder(E3); E3.homeId = cab2.id; E3.children = [K3.id]; K3.parents = [E3.id]; K3.homeId = cab3.id; K3.married = true; K3.partnerId = null;
    st().lineage.heads[cab3.id] = E3.id;
    check('27.2: hearthsOf: bilgenin kütükte (lineage.heads) reis göründüğü evler de sayılır', LN.hearthsOf(st(), E3).some((h) => h.id === cab3.id));
    iso(() => LS().onElder(E3));
    check('27.2: kütükteki ocağın reisliği evli evlada devredilir', st().lineage.heads[cab3.id] === K3.id);
    restore(snap0);
    s0.lineage.heads = { ...keepHeads };
    Object.assign(s0.lineage, keepLineage);

    // --- 2.2 Altın Çağ başlarken bekleyen çiftler; Yeni Konut Talebi ---
    {
      const [A, B, C, D] = people().filter((c) => c.lifeStage !== 'elder');
      const homeA = A.homeId;
      const homeB = B.homeId !== homeA ? B.homeId : C.homeId;
      A.married = B.married = true; A.partnerId = B.id; B.partnerId = A.id; A.generation = 2; B.generation = 2; A.parents = []; B.parents = [];
      B.homeId = homeB;
      freeCabin();
      const emptyIds = S().world.getCompleted('cabin').filter((h) => h.functional && S().world.getResidents(h).length === 0).map((h) => h.id);
      const nh = st().lineage.newHomes;
      // (28.1) dünya kaydığında başka bekleyen 2. kuşak çiftler boş kulübeleri önceden kapabilir: yalnızca A ve B bekleyen çift olsun
      const marriedKeep = st().characters.filter((c) => c !== A && c !== B).map((c) => [c, c.married]);
      for (const [c] of marriedKeep) c.married = false;
      iso(() => LS().settleWaiting());
      for (const [c, m] of marriedKeep) c.married = m;
      check('27.2: Altın Çağ başlarken (goldenAge:began) ayrı evlerde kalan evli 2. kuşak çift boş kulübede yuva kurar', A.homeId === B.homeId && emptyIds.includes(A.homeId) && st().lineage.newHomes === nh + 1, `${A.homeId} ${B.homeId} ${emptyIds}`);
      const listening = [...(game.events.listeners.get('goldenAge:began') ?? [])].length > 0;
      check('27.2: LineageSystem goldenAge:began olayını dinler', listening);
      // Boş kulübe yokken: dilekçe; kulübe sayısı artsa da çift ayrıysa karşılanmaz
      A.homeId = homeA; B.homeId = homeB;
      const empties = S().world.getCompleted('cabin').filter((h) => S().world.getResidents(h).length === 0);
      // boş kulübeler geçici olarak kullanılamaz (harabe) gösterilir: kasabada boş kulübe yok
      const conds = empties.map((h) => h.condition);
      const hide = (on) => empties.forEach((h, i) => { h.condition = on ? 'ruined' : conds[i]; });
      hide(true);
      s0.petitions.list = [];
      const dbg = `${A.homeId}/${B.homeId} boş: ${S().world.getCompleted('cabin').filter((h) => h.functional && S().world.getResidents(h).length === 0).map((h) => h.id)} gizli: ${empties.map((h) => h.id)}`;
      const r1 = iso(() => LS().settle(A, B));
      hide(false);
      const pet = st().petitions.list.find((p) => p.kind === 'newHome');
      const fakeMore = pet ? { ...pet, baseline: { ...pet.baseline, cabins: 0 } } : null;
      check('27.2: boş kulübe yokken Yeni Konut Talebi açılır; kulübe sayısı artsa da çift ayrı yaşarken karşılanmaz', r1 === 'petition' && pet && pet.characterId === A.id && !PT.petitionMet(st(), fakeMore), `${r1} ${JSON.stringify(pet)} ${dbg}`);
      // Sınırlar: çiftte zaten açık dilekçe varken ya da liste doluyken yenisi açılmaz
      const n0 = st().petitions.list.length;
      hide(true);
      const r2 = iso(() => LS().settle(A, B));
      st().petitions.list.push({ id: 9901, kind: 'gathering', characterId: C.id, baseline: {}, deadline: 1e12, status: 'open' });
      const n1 = st().petitions.list.length;
      const cand = people().filter((o) => ![A, B, C].includes(o) && !CI.petitionOf(st(), o));
      const X1 = cand[0];
      const X2 = cand.find((o) => o.homeId !== X1.homeId);
      const r3 = iso(() => LS().settle(X1, X2));
      hide(false);
      check('27.2: Yeni Konut Talebi dilekçe sınırlarına uyar (sakin başına bir, en çok ' + CZ.PETITIONS.maxOpen + ')', r2 === 'petition' && r3 === 'petition' && n0 === 1 && st().petitions.list.length === n1 && n1 === CZ.PETITIONS.maxOpen);
      st().petitions.list = st().petitions.list.filter((p) => p.id !== 9901);
      // Yeni kulübe tamamlanınca çift oraya taşınır, dilekçe çift aynı çatı altında buluşunca karşılanır
      const done0 = st().petitions.fulfilled;
      const nc = sim.place('cabin');
      S().petitions.checkAll();
      check('27.2: yeni kulübe bitince ayrı yaşayan dilekçeli çift taşınır; dilekçe aynı eve kavuşunca karşılanır', A.homeId !== null && A.homeId === B.homeId && !st().petitions.list.some((p) => p.kind === 'newHome') && st().petitions.fulfilled === done0 + 1, `${A.homeId} ${B.homeId} yeni ${nc?.id}`);
      restore(snap0);
      s0.petitions.list = [];
      s0.lineage.heads = { ...keepHeads };
      Object.assign(s0.lineage, keepLineage);
    }

    // --- 3.1 Yadigâr: ilk mirasçıda yadigâr varsa sıradaki uygun mirasçıya geçer ---
    {
      const strip = () => { for (const c of st().characters) c.inventory = (c.inventory ?? []).filter((x) => !CZ.ITEMS[x.kind]?.heirloom); };
      strip();
      const [H, K1, K2] = people().filter((c) => c.lifeStage !== 'elder');
      asElder(H);
      H.children = [K1.id, K2.id];
      K1.ageInDays = 40 * Y; K2.ageInDays = 30 * Y; K1.lifeStage = K2.lifeStage = 'adult';
      const slot = (c, kind) => ({ kind, qty: 1, name: HD.HEIRLOOMS[kind].name, heirloom: CI.sanitizeHeirloomMeta({ ownerId: c.id, ownerName: c.name, story: 'x', since: 1, chain: [c.name] }) });
      H.inventory = [slot(H, 'heirloomHammer')];
      const first = HL.pickHeir(st(), H, 'heirloomHammer');
      K1.inventory = [...(K1.inventory ?? []), slot(K1, 'heirloomTrowel')]; // ilk sıradaki zaten bir yadigâr taşıyor
      const second = HL.pickHeir(st(), H, 'heirloomHammer');
      const passed = iso(() => S().heirloomSystem.pass(H, second, H.inventory[0]));
      check('27.2: ilk sıradaki mirasçıda zaten yadigâr varsa sıradaki uygun evlat seçilir ve tören iptal olmaz', first === K1 && second === K2 && passed && CI.heirloomSlot(K2)?.kind === 'heirloomHammer' && CI.heirloomSlot(K1)?.kind === 'heirloomTrowel', `${first?.name} ${second?.name}`);
      // 3.2 Çırak geçmişi çalışma zamanında da 12 ile sınırlı (kayıttaki kuralla birebir)
      H.mentees = [];
      const ids = people().map((c) => c.id).filter((id) => id !== H.id);
      for (let i = 0; i < 15; i++) S().heirloomSystem.recordMentee(H.id, { id: ids[i % ids.length] + (i >= ids.length ? 100000 : 0) }, 10 + i);
      const live = JSON.stringify(H.mentees);
      check('27.2: master.mentees çalışma zamanında son ' + HL.MAX_MENTEES + ' kayıtla sınırlı ve sanitizeMentees ile birebir aynı', H.mentees.length === HL.MAX_MENTEES && live === JSON.stringify(HL.sanitizeMentees(H.mentees)) && H.mentees[H.mentees.length - 1].progress === 24, `${H.mentees.length}`);
      strip();
      restore(snap0);
    }

    // --- 4.1 Yeni nesil mizaç dilekçeleri Altın Çağ'da öncelikli ---
    {
      const P = S().petitions;
      const c = people()[3];
      const keepQ = c.quirk;
      c.quirk = 'craftsman';
      st().tax.rate = 'standard';
      const wGA = Object.fromEntries(P.optionsFor(c)).craftTools;
      const since = s0.goldenAge.since;
      s0.goldenAge.since = null;
      const wPre = Object.fromEntries(P.optionsFor(c)).craftTools;
      s0.goldenAge.since = since;
      check('27.2: Altın Çağ\'da Zanaatkâr\'ın kendi dilekçesinin ağırlığı ' + PS.NEW_GEN_PRIORITY.weight + ' katı (öncesinde 25.3\'teki gibi 5)', wGA === 5 * PS.NEW_GEN_PRIORITY.weight && wPre === 5, `${wGA} ${wPre}`);
      s0.petitions.list = [];
      const keepLog = s0.petitions.log;
      s0.petitions.log = [];
      const p = iso(() => P.create());
      const owner = st().characters.find((x) => x.id === p?.characterId);
      check('27.2: Altın Çağ\'da henüz yeni nesil dilekçe açılmamışken yeni nesil huylu uygun aday öncelik alır, kendi dilekçesini açar', p && owner && PS.NEW_GEN_PETITIONS[owner.quirk] && P.newGenKinds(owner, [[p.kind, 1]]).length === 1, `${p?.kind} ${owner?.quirk}`);
      check('27.2: açılan dilekçe "Altın Çağ\'da açıldı" sayılır (bir sonraki seçimde zorunlu öncelik kalkar)', P.newGenOpenedInGoldenAge());
      check('27.2: Bilge Düşünür\'ün araştırma ve kitapları bittiyse bilgelik sohbeti (Toplanma) kendi dilekçesi sayılır', P.newGenKinds({ quirk: 'philosopher' }, [['sapling', 1], ['gathering', 15]]).map(([k]) => k).join() === 'gathering' && P.newGenKinds({ quirk: 'philosopher' }, [['books', 5], ['gathering', 1]]).map(([k]) => k).join() === 'books');
      s0.petitions.list = [];
      s0.petitions.log = keepLog;
      c.quirk = keepQ;
    }

    Math.random = realRandom;
    check('27.2: bu adımın sistemleri ana üreteçleri ve Math.random\'u tüketmez (dilekçe seed + 23, çıraklık + 28, soy + 30, yadigâr + 31)', mainRngs.length > 5 && isoCalls > 15 && rngViolations === 0, `${rngViolations}/${isoCalls}`);
    void rngBefore;
    check('27.2: kayıt sürümü 32 korunur', CONFIG.SAVE_VERSION === 32);
    restore(snap0);
    s0.lineage.heads = { ...keepHeads };
    Object.assign(s0.lineage, keepLineage);
    s0.goldenAge.since = keepGA;
  }

  // ===== 27. aşama (27.3): sıfır tahsisatlı çizim ve arayüz görünürlüğü (konuk kartı, ziyafet bloğu, çıraklık notu, yadigâr zinciri) =====
  {
    const S = () => game.scenes.current;
    const st = () => game.state;
    const GD = await import('/src/data/guest.js');
    const FD = await import('/src/data/feast.js');
    const FA = await import('/src/systems/Fair.js');
    const AP = await import('/src/systems/Apprenticeship.js');
    const AD = await import('/src/data/apprenticeship.js');
    const CZ = await import('/src/data/citizens.js');
    const CI = await import('/src/systems/Citizens.js');
    const { RenderQueue } = await import('/src/rendering/RenderQueue.js');
    const { GuestEffects } = await import('/src/rendering/GuestEffects.js');
    const { FairDecor } = await import('/src/rendering/FairDecor.js');
    const SB = await import('/src/rendering/SpeechBubbles.js');
    const GP = await import('/src/ui/components/GuestPanel.js');
    const BP = await import('/src/ui/components/BuildingPanel.js');
    const { Random } = await import('/src/utils/random.js');
    const { CONFIG } = await import('/src/config.js');
    const s0 = st();
    s0.crisis.difficulty = 'huzurlu';
    s0.crisis.raid = null;
    s0.crisis.nextRaidWarnAt = null;
    s0.petitions.list = [];
    s0.petitions.nextAt = s0.totalMinutes + 1e6;
    const keepGA = s0.goldenAge.since;
    s0.goldenAge.since = s0.goldenAge.since ?? { day: 1, hour: 8, minute: 0 };
    const keepTime = { ...s0.time };
    const people = () => st().characters.filter((c) => !c.role && !c.away && !c.emigrating && !c.isChild).sort((a, b) => a.id - b.id);

    // --- 1.1 GuestEffects: kuyruğa her karede yeni kapanış yerine sabit işlev ---
    {
      const ge = new GuestEffects();
      const q = new RenderQueue();
      const fnSeen = new Set();
      const viaQueue = [];
      const direct = [];
      const rq = { fillRect: (...a) => viaQueue.push(a), drawImage: () => {} };
      const rd = { fillRect: (...a) => direct.push(a), drawImage: () => {} };
      const guest = { visible: true, x: 100.4, y: 200.6, sortY: 200, spriteHeight: 18, facing: 'left', playing: true };
      for (let f = 0; f < 30; f++) {
        for (const type of GD.GUEST_KEYS) {
          ge.queue(q, guest, type, f * 0.1);
          fnSeen.add(q.items[q.count - 1].fn);
          q.flush(rq);
          ge.drawAccessory(rd, guest.x, guest.y, guest.spriteHeight, guest.facing, type, f * 0.1, guest.playing);
        }
      }
      check('27.3: GuestEffects kuyruğa 90 karede tek ve aynı çizim işlevini verir (kapanış üretmez), çıktı doğrudan çizimle birebir', fnSeen.size === 1 && fnSeen.has(ge.drawQueued) && JSON.stringify(viaQueue) === JSON.stringify(direct) && viaQueue.length > 500 && q.items.length === 1 && q.items[0].a === null, `${fnSeen.size} ${viaQueue.length}`);
      // RenderQueue: addCall sırayı bozmaz (addImage / addCustom ile birlikte derinlik sıralı)
      const order = [];
      const q2 = new RenderQueue();
      q2.addImage(5, 'img5', 0, 0);
      q2.addCall(3, (r, a) => order.push(a), 'call3');
      q2.addCustom(4, () => order.push('custom4'));
      q2.flush({ drawImage: (img) => order.push(img) });
      check('27.3: RenderQueue.addCall derinlik sırasına uyar ve kare sonunda argümanları bırakır', order.join() === 'call3,custom4,img5' && q2.items.every((it) => it.fn === null && it.a === null && it.draw === null));
    }

    // --- 1.2 SpeechBubbles: genişlik bir kez ölçülür ---
    {
      let measures = 0;
      const ops = [];
      const ctx = { save() {}, restore() {}, measureText: (t) => { measures++; return { width: t.length * 5 }; }, fillRect: (...a) => ops.push(a), fillText: (...a) => ops.push(a), set font(v) {}, set textBaseline(v) {}, set globalAlpha(v) {}, set fillStyle(v) {} };
      const c = { visible: true, x: 120, y: 220, spriteHeight: 18, bubble: null, speech: { text: 'Öğreniyorum ustam!', at: -1, duration: 3, remaining: 2 } };
      for (let i = 0; i < 50; i++) SB.drawSpeechBubbles({ ctx }, { x: 0, y: 0, zoom: 2 }, [c]);
      const firstW = c.speech.width;
      const frame = ops.slice(0, ops.length / 50);
      const same = Array.from({ length: 50 }, (_, i) => JSON.stringify(ops.slice(i * frame.length, (i + 1) * frame.length))).every((x) => x === JSON.stringify(frame));
      c.speech.text = 'Bak ustam, çivi!';
      SB.drawSpeechBubbles({ ctx }, { x: 0, y: 0, zoom: 2 }, [c]);
      check('27.3: konuşma balonu genişliği ilk çizimde bir kez ölçülür (50 karede 1 measureText), her kare aynı çizilir; metin değişince yeniden ölçülür', measures === 2 && firstW === 'Öğreniyorum ustam!'.length * 5 + 10 && same && c.speech.width === 'Bak ustam, çivi!'.length * 5 + 10, `${measures} ${firstW}`);
      check('27.3: balon önbelleği sözün süresine dokunmaz (remaining aynı)', c.speech.remaining === 2 && c.speech.duration === 3);
    }

    // --- 1.3 FairDecor: yeniden kullanılan dikdörtgenler, kararlı çıktı ---
    {
      const fd = new FairDecor();
      const venue = { x: 400, y: 300, width: 32, height: 32 };
      const b1 = fd.bounds(venue);
      const b2 = fd.bounds({ x: 10, y: 10, width: 16, height: 16 });
      const left2 = b2.left; // aynı nesne sonraki çağrıda yeniden yazılır
      const t1 = fd.tableRect(venue);
      let invalid = 0;
      const run = () => {
        const calls = [];
        const r = { fillRect: (...a) => { if (a.slice(0, 4).some((v) => !Number.isFinite(v)) || typeof a[4] !== 'string') invalid++; calls.push(a); } };
        for (const type of ['spring', 'summer', 'autumn', 'winter']) for (const tier of [null, 'symbolic', 'modest', 'rich']) fd.draw(r, venue, 2.7, type, 'party', tier ? { tier, left: 3, total: 7 } : null);
        const lights = [];
        for (const type of ['spring', 'summer', 'autumn', 'winter']) fd.collectLights(lights, venue, type, 'party', { tier: 'rich', left: 1, total: 2 });
        return JSON.stringify([calls, lights]);
      };
      const r1 = run();
      const r2 = run();
      check('27.3: FairDecor bounds / tableRect aynı nesneyi yeniden kullanır; dört mevsim ve üç sofra çizimi kararlı ve geçerli', b1 === b2 && t1 === fd.tableRect(venue) && left2 === 10 - 28 && r1 === r2 && r1.length > 10000 && invalid === 0, `${r1.length} ${invalid}`);
    }

    // --- 2.1 Gezgin konuk tıklanır, misafir kartı açılır ---
    const gs = () => S().guestSystem;
    const makeGuest = (type, extra = {}) => {
      if (st().activeGuest) { gs().character = null; S().world.guests = []; st().activeGuest = null; }
      const entry = S().world.findEntryTile(new Random(11));
      const p = S().world.standPoint(entry.x, entry.y);
      st().activeGuest = { type, name: GD.GUEST_TYPES[type].names[0], look: 0, arrivalDay: st().time.day, departureDay: st().time.day + 1, x: p.x, y: p.y, leaving: false, resting: false, barters: 0, lastBarterDay: null, exit: null, ...extra };
      gs().spawn();
      return gs().character;
    };
    st().time.hour = 13;
    const guest = makeGuest('collector', { arrivalDay: st().time.day - 1, barters: 1, lastBarterDay: st().time.day - 1 });
    guest.visible = true;
    guest.clearPath();
    const card = () => document.querySelector('.guest-panel');
    const hitX = guest.x;
    const hitY = guest.y - 6;
    const hit = S().world.findCharacterAt(hitX, hitY);
    const cam = S().camera;
    game.input.pendingClick = { x: (hitX - cam.x) * cam.zoom, y: (hitY - cam.y) * cam.zoom };
    S().handleSelectionInput(true);
    game.render(0);
    check('27.3: World.findCharacterAt gezgin konuğu da bulur (isGuest)', hit === guest && hit.isGuest === true && S().world.findCharacterAt(hitX, hitY, { guests: false }) !== guest);
    check('27.3: haritada konuğa tıklamak misafir kartını açar (sakin / yapı seçimi kalkar)', S().guestSelected === true && card() && !card().hidden && S().selectedId === null && S().selectedBuildingId === null && card().textContent.includes(st().activeGuest.name) && card().textContent.includes('Nadir Takasçı'), card()?.textContent.slice(0, 120));
    const sum = GP.guestSummary(st(), guest);
    check('27.3: misafir kartı: ne kadar süredir kasabada (saat), ayrılış ve şu anki işi', sum.rows.some(([l, v]) => l === 'Kasabada' && v.startsWith(`${24 + 13 - 9} saattir`)) && sum.rows.some(([l, v]) => l === 'Ayrılış' && v === `G${st().activeGuest.departureDay} 09:00`) && card().textContent.includes('saattir'), JSON.stringify(sum.rows));
    check('27.3: Nadir Takasçı kartında takas özeti: bu kalıştaki takas sayısı, rezerv ve teklifler (bedel -> karşılık)', card().textContent.includes('1/2 takas') && card().querySelectorAll('.guest-offer').length === GD.BARTER_KEYS.length && card().textContent.includes('Antik Şema') && card().textContent.includes('Kumaş 5 · Fıçı Şerbeti 3 ->'));
    game.events.emit('guest:barter', { key: 'seed', offer: GD.BARTER_OFFERS.seed, text: GD.BARTER_OFFERS.seed.text });
    game.render(0);
    check('27.3: takas olunca kartta son takas: ne verildi, ne alındı', card().textContent.includes('Fıçı Şerbeti 3 verildi -> Egzotik Tohum alındı'));
    const res0 = { cloth: st().resources.cloth, sherbet: st().resources.sherbet };
    Object.assign(st().resources, { cloth: 20, sherbet: 20 });
    game.render(0);
    const okCount = card().querySelectorAll('.guest-offer.is-ok').length;
    Object.assign(st().resources, { cloth: 0, sherbet: 0 });
    game.render(0);
    const noneOk = card().querySelectorAll('.guest-offer.is-ok').length;
    Object.assign(st().resources, res0);
    check('27.3: teklifler stok rezervin üstündeyse "Uygun", değilse "Stok yetmez"', okCount === GD.BARTER_KEYS.length && noneOk === 0);
    game.events.emit('ui:selectCharacter', people()[0].id);
    game.render(0);
    check('27.3: bir sakin seçilince misafir kartı kapanır', S().guestSelected === false && card().hidden && S().selectedId === people()[0].id);
    game.events.emit('ui:selectGuest', true);
    game.render(0);
    const reopened = !card().hidden;
    card().querySelector('.character-close').click();
    game.render(0);
    check('27.3: kart ✕ ile kapanır', reopened && card().hidden && S().guestSelected === false);
    const bard = makeGuest('bard');
    game.events.emit('ui:selectGuest', true);
    game.render(0);
    const bardText = card().textContent;
    gs().finish(false);
    game.render(0);
    check('27.3: ozan kartında akşam çalma saatleri; konuk ayrılınca kart kendiliğinden kapanır', bard && bardText.includes('18:00 - 22:00') && bardText.includes('Ozan Ezgisi') && card().hidden && S().guestSelected === false);
    const sc = { activeGuest: { type: 'storyteller', name: 'X', arrivalDay: 3, departureDay: 4, barters: 0, leaving: false, resting: false }, time: { day: 3, hour: 12 }, guestBook: { wisdom: 12.7 }, resources: {} };
    const ss = GP.guestSummary(sc, { activityLabel: 'Masal anlatıyor' });
    check('27.3: masalcı kartında masal saatleri ve Kasaba Bilgeliği', ss.rows.some(([l, v]) => l === 'Masal saati' && v.startsWith('10:00 - 17:00')) && ss.rows.some(([l, v]) => l === 'Kasaba Bilgeliği' && v === '12 puan') && ss.rows.some(([l, v]) => l === 'Kasabada' && v.startsWith('3 saattir')));

    // --- 2.2 Büyük Ziyafet Sofrası havuz panelinde ---
    {
      const fountain = S().world.getCompleted('fountain')[0] ?? sim.place('fountain', { instant: true });
      let fairDay = st().time.day;
      while (!FA.isFairDay(fairDay)) fairDay++;
      Object.assign(st().time, { day: fairDay, hour: 19, minute: 0 });
      st().currentFestival = { type: 'summer', day: fairDay, phase: 'party', participants: [] };
      st().currentFeast = { tier: 'rich', day: fairDay, contributions: { food: 22, bread: 9, sherbet: 5, cloth: 1 }, servings: 32, served: 7, eatenIds: [] };
      const now = st().totalMinutes;
      const keepBuffs = { tradition: st().buffs.tradition, bounty: st().buffs.bounty };
      st().buffs.tradition = now + 11 * 60;
      st().buffs.bounty = now + 11 * 60;
      game.events.emit('ui:selectBuilding', fountain.id);
      game.render(0);
      const box = document.querySelector('.building-feast');
      const text = box?.textContent ?? '';
      check('27.3: havuz paneli süren Büyük Ziyafet Sofrası\'nı gösterir: kademe, evre, kilerden ayrılanlar, ikram sayacı', box && !box.hidden && text.includes('Zengin Şölen Sofrası') && text.includes('Şenlik saati') && text.includes('Yiyecek 22 · Ekmek 9 · Fıçı Şerbeti 5 · Kumaş 1') && text.includes('7/32 verildi · 25 kaldı'), text.slice(0, 200));
      check('27.3: sofranın bonusları: Gelenek Bağı ve Bolluk Ziyafeti (kalan saatiyle)', text.includes('Gelenek Bağı · 11 sa') && text.includes('Bolluk Ziyafeti · 11 sa') && box.querySelectorAll('.feast-buff:not(.is-off)').length === 2);
      st().currentFeast = { tier: 'symbolic', day: fairDay, contributions: { food: 0, bread: 0, sherbet: 0, cloth: 0 }, servings: 30, served: 0, eatenIds: [] };
      st().currentFestival.phase = 'prep';
      const info = BP.feastInfo(st());
      game.render(0);
      check('27.3: Sembolik İkramda kilerden bir şey ayrılmadığı ve bonus olmadığı yazar; hazırlık evresi', info.name === 'Sembolik İkram' && info.contributions.includes('Hiçbir şey') && info.buffs.length === 0 && info.phase.startsWith('Hazırlık') && document.querySelector('.building-feast').textContent.includes('Bonus yok'));
      st().currentFeast = null;
      st().currentFestival = null;
      game.render(0);
      check('27.3: sofra yokken blok gizlenir', document.querySelector('.building-feast').hidden && BP.feastInfo(st()) === null);
      Object.assign(st().buffs, keepBuffs);
      game.events.emit('ui:selectBuilding', null);
    }

    // --- 3.1 Çıraklık bekleme nedeni ve yadigâr zinciri karakter kartında ---
    {
      const ws = S().world.getCompleted('workshop').find((b) => !b.damaged) ?? sim.place('workshop');
      const pool = people().filter((c) => c.lifeStage !== 'elder');
      const master = pool[0];
      const youth = pool[pool.length - 1];
      const keep = { y: { lifeStage: youth.lifeStage, ageInDays: youth.ageInDays, age: youth.age, apprenticeship: youth.apprenticeship, workplaceId: youth.workplaceId, inventory: youth.inventory }, m: { task: master.task, workplaceId: master.workplaceId, away: master.away } };
      sim.give({ food: 500, bread: 60 });
      youth.apprenticeship = { masterId: master.id, profession: 'workshop', buildingId: ws.id, progress: 42, since: 0, crafted: 0 };
      youth.lifeStage = 'youth';
      master.away = false;
      const idle0 = ws.idle;
      ws.idle = true;
      master.task = null;
      const sIdle = AP.apprenticeStatus(st(), youth);
      game.events.emit('ui:selectCharacter', youth.id);
      game.render(0);
      const note = document.querySelector('.character-panel:not(.guest-panel) .apprentice-note')?.textContent ?? '';
      ws.idle = false;
      master.task = { activity: 'craft', workBuildingId: ws.id, buildingId: ws.id };
      const sWork = AP.apprenticeStatus(st(), youth);
      master.task = null;
      const sAway = AP.apprenticeStatus(st(), youth);
      const hh = { id: -77, type: 'healerHut' };
      const herbState = { ...st(), buildings: [...st().buildings, hh] };
      const y2 = { apprenticeship: { masterId: master.id, profession: 'healerHut', buildingId: -77 } };
      master.task = { activity: 'gatherHerbs', workBuildingId: -77 };
      const sHerb = AP.apprenticeStatus(herbState, y2);
      ws.damaged = true;
      const sDamaged = AP.apprenticeStatus(st(), youth);
      ws.damaged = false;
      ws.idle = idle0;
      check('27.3: kartta çıraklık nedeni: boştaki atölyede "Sipariş bekleniyor: Tezgâh Pratiği", usta tezgâhta / ot topluyor / tezgâhta değil / atölye hasarlı', sIdle.text.startsWith('Sipariş bekleniyor: Tezgâh Pratiği') && sIdle.ok && note === sIdle.text && sWork.text === 'Ustasının yanında öğreniyor' && sHerb.text.startsWith('Usta ot topluyor') && !sAway.ok && sDamaged.text.includes('hasarlı'), `${note} | ${sAway.text}`);
      // Yadigâr zinciri okunur satır
      const slot = { kind: 'heirloomHammer', qty: 1, name: 'Ata Yadigârı Çekiç', heirloom: CI.sanitizeHeirloomMeta({ ownerId: master.id, ownerName: 'Mehmet', story: "Mehmet Usta'nın 30 yıllık emektar çekici.", since: 1, chain: ['Mehmet', 'Ayşe', youth.name] }) };
      youth.inventory = [slot];
      game.render(0);
      const chainEl = document.querySelector('.character-panel:not(.guest-panel) .heirloom-chain');
      check('27.3: yadigârın devir zinciri karakter kartında okunur satır olarak listelenir (Mehmet → Ayşe → ...)', chainEl && chainEl.querySelectorAll('.chain-link').length === 3 && chainEl.textContent === `Mehmet→Ayşe→${youth.name}` && chainEl.closest('.purse-box').textContent.includes('Aile yadigârıAta Yadigârı Çekiç'), `${chainEl?.textContent} ${chainEl?.querySelectorAll('.chain-link').length}`);
      Object.assign(youth, keep.y);
      Object.assign(master, keep.m);
      game.events.emit('ui:selectCharacter', null);
    }

    check('27.3: kayıt sürümü 32 korunur', CONFIG.SAVE_VERSION === 32);
    if (st().activeGuest) gs().finish(false);
    S().world.guests = [];
    Object.assign(st().time, keepTime);
    s0.goldenAge.since = keepGA;
  }

  return out;
});
results.push(...pageResults);
const ok = report(errors);
await browser.close();
process.exit(ok ? 0 : 1);
