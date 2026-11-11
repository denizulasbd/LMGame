// Uzun simülasyonların bekçisi: oyun saatinde bir örnek alır, sonunda özet döndürür. Oyunu değiştirmez, yalnızca okur.
//
//   Takılma (stuck)  : uyanık, dışarıda, seferde olmayan bir sakin bir şey yapmadan (görevi yok ya da yolda) aynı karoda
//                      STUCK_MINUTES oyun dakikası kalırsa; ya da yürüyemez bir karoda (su, yapı) BLOCKED_MINUTES yolda / boşta kalırsa;
//                      ya da harita dışına çıkarsa
//   Referanslar      : ev, eş / sevgili (karşılıklı mı), ebeveyn, sabit iş yeri, içinde bulunduğu yapı, yapıların çalışan
//                      ve içerideki listeleri, rezervasyonlar, iş emirlerinin atananları; evdeki kişi sayısı kapasiteyi aşıyor mu
//   İş gücü          : çalışanı olan ama hiç üretmeyen (ya da çalışma noktası kalmamış) yapılar, sonsuz bekleyen iş emirleri
//
//   (21. aşama) Vatandaşlık: kesesi sayı olmayan / eksi sakin, çantası kapasitesini aşan ya da bozuk eşyalı sakin, kayıp sakine
//                      ait dilekçe, aynı sakinin iki dilekçesi, kayıp isyancı, yıkılmış yapıyı hedefleyen yağma, aralık dışı
//                      güven kopuk referanstır; güvenin en düşük / en yüksek değeri, isyan saatleri, yağma, dilekçe sonuçları,
//                      yevmiye, alışveriş ve çantadan yemek raporlanır
//   (22. aşama) Krallık: geçersiz vergi kademesi / ferman, takvimsiz Krallık Vergisi, harita kenarına varamadan süresi geçen
//                      göçmen, nüfusun çekirdeğin (3) altına inmesi kopuk referanstır; vergi tahsilatları, Krallık Vergisi ödemeleri
//                      ve cezaları, fermanlar, Kraliyet Beratı ve terk edenler raporlanır
//   (20. aşama) Ulu Saat Kulesi: geçersiz aşama, iş emri olmayan süren aşama, Altın Çağ'sız tamamlanmış kule, bitiş
//                      vaktini aşan Çağ Kutlaması kopuk referanstır; kulenin ulaştığı aşama ve Altın Çağ raporlanır
//   (19. aşama) Sosyal yaşam: evli çift ortak eve taşınamadan RELOCATE_HOURS saatten uzun "taşınıyor" kalırsa ya da
//                      boş yatak varken MAX_APART_HOURS saat ayrı evlerde yaşarsa sıkışma sayılır; kutlama bitiş vaktini
//                      aşarsa, huyu olmayan sakin, kayıp sakine işaret eden haber / kutlama kopuk referanstır; nüfusun en
//                      düşük ve en yüksek değeri, evsiz sakinler ve sosyal sayaçlar (randevu, düğün kutlaması, akşam
//                      yemeği, dedikodu, müzik, hayvan sevme, kitap, boşalan ev) raporlanır
//
// Kullanım (Node tarafı):  await installMonitor(page);  ...  window.__monitor.sample() her saat;  await monitorReport(page)

export const STUCK_MINUTES = 150;     // görevsiz / yolda aynı karoda bu kadar kalan sakin takılmış sayılır
export const BLOCKED_MINUTES = 120;  // yürünemez karoda (su, yapı) görevsiz / yolda bu kadar kalan takılmış sayılır (3 örnek)
export const JOB_STALE_DAYS = 4;      // atanmış iş emri bu kadar gün ilerlemezse "sonsuz bekleme" sayılır
export const RELOCATE_HOURS = 30;     // (19. aşama) yeni evine bu kadar saatte varamayan sakin taşınmada sıkışmış sayılır
export const MAX_APART_HOURS = 48;    // boş yatak varken evli çift bu kadar saat ayrı evlerde kalırsa sıkışma

export async function installMonitor(page) {
  await page.evaluate(async () => {
    window.__outfitFor = (await import('/src/systems/SkillSystem.js')).outfitFor;
    window.__charSprite = (await import('/src/art/sprites/index.js')).getCharacterSprite;
    window.__citizens = await import('/src/systems/Citizens.js');
    window.__citizenData = await import('/src/data/citizens.js');
    window.__crownData = await import('/src/data/crown.js');
    window.__crisisData = await import('/src/data/crisis.js');
    window.__foodSupplyOf = (await import('/src/systems/TownStatus.js')).foodSupply;
    // (24. aşama) eski sürümlerde (karşılaştırma koşuları) bu modül yoktur: tarım denetimi atlanır, gıda güvencesi yine ölçülür
    window.__granaryMod = await import('/src/systems/Granary.js').catch(() => null);
    window.__refineryMod = await import('/src/systems/Refinery.js').catch(() => null); // (24.2)
    window.__tradeMod = await import('/src/systems/TradePost.js').catch(() => null); // (24.3)
    window.__moodDefs = (await import('/src/data/moodlets.js').catch(() => null))?.MOODLETS ?? null; // (29.2)
    window.__lifeMod = await import('/src/systems/LifeStages.js').catch(() => null); // (25.1)
    window.__lateMod = await import('/src/systems/LateGame.js').catch(() => null); // (28.4)
    window.__tsMod = await import('/src/systems/TownStatus.js').catch(() => null);
    window.__apprMod = await import('/src/systems/Apprenticeship.js').catch(() => null); // (25.2)
    window.__socialData = await import('/src/data/social.js').catch(() => null); // (25.3)
    window.__lineageMod = await import('/src/systems/Lineage.js').catch(() => null); // (25.4)
    window.__heirData = await import('/src/data/heirloom.js').catch(() => null); // (25.5)
  });
  await page.evaluate(
    ({ STUCK_MINUTES, BLOCKED_MINUTES, JOB_STALE_DAYS, RELOCATE_HOURS, MAX_APART_HOURS }) => {
      const game = window.game;
      const m = {
        samples: 0,
        stuck: [],          // { day, hour, name, tile, label, reason }
        broken: [],         // referans hataları (ilk 50)
        brokenCount: 0,
        overfull: [],       // kapasitesi aşılan evler
        staleJobs: [],
        worked: new Set(),  // bugün mesaide çalışanı görülen yapılar
        idleWorkplaces: {}, // "tür@x,y" -> çalışanı varken üretmeyen gün sayısı
        track: new Map(),   // karakter id -> { tile, since, flagged }
        jobTrack: new Map(),// iş id -> { progress, since, flagged }
        maxPop: 0,
        maxFeuds: 0, // (15. aşama) aynı anda en çok küs (eksi puanlı) çift
        minNeeds: { hunger: 100, energy: 100, social: 100, fun: 100 },
        events: { weddings: 0, births: 0, grownUp: 0, quarrels: 0, reconciled: 0, ill: 0, cured: 0, cold: 0, warmed: 0, masterworks: 0, exhibited: 0, sold: 0, expeditions: 0, adventures: 0, mishaps: 0, tales: 0, returned: 0 },
        outfitErrors: [], // (15. aşama) çizilemeyen ya da yanlış kademede kıyafet
        // (19. aşama) sosyal yaşam
        socialStuck: [], // taşınmada / ayrı evde sıkışan evli çiftler
        relocateSince: new Map(), // sakin id -> taşınmaya başladığı dakika
        apartSince: new Map(), // "a-b" -> ayrı evlerde yaşamaya başladıkları dakika
        minPop: Infinity,
        homelessMax: 0,
        weddingParties: 0,
        // (21. aşama)
        trustMin: Infinity,
        trustMax: -Infinity,
        revoltSamples: 0,
        petitionEvents: { opened: 0, fulfilled: 0, rejected: 0, expired: 0 },
      };
      game.events.on('petition:opened', () => m.petitionEvents.opened++);
      game.events.on('petition:resolved', ({ outcome }) => m.petitionEvents[outcome]++);
      const on = (name, key) => game.events.on(name, () => m.events[key]++);
      on('relationship:married', 'weddings');
      on('family:childBorn', 'births');
      on('family:grownUp', 'grownUp');
      on('relationship:quarrel', 'quarrels');
      on('relationship:reconciled', 'reconciled');
      on('health:fellIll', 'ill');
      on('health:cured', 'cured');
      on('heating:cold', 'cold');
      on('heating:restored', 'warmed');
      on('masterwork:created', 'masterworks');
      on('masterwork:exhibited', 'exhibited');
      on('masterwork:sold', 'sold');
      on('expedition:departed', 'expeditions');
      on('expedition:returned', 'returned');
      on('expedition:taleTold', 'tales');
      m.events.parties = 0;
      on('social:partyStarted', 'parties');
      m.events.homesFreed = 0;
      on('social:homeFreed', 'homesFreed');
      game.events.on('adventure:resolved', ({ success }) => {
        m.events.adventures++;
        if (!success) m.events.mishaps++;
      });

      const stamp = () => ({ day: game.state.time.day, hour: game.state.time.hour });
      // Takılan sakinin ayrıntısı: görevi, bulunduğu karodaki yapı, konumu (hata ayıklamak için)
      const detail = (c, map, world) => {
        const b = world.getBuilding(map.getOccupant(c.tileX, c.tileY));
        const task = c.task ? { activity: c.task.activity, phase: c.task.phase, buildingId: c.task.buildingId ?? null, jobId: c.task.jobId ?? null, spot: c.task.spot ?? null } : null;
        const walk = c.waypoints ? { left: c.waypoints.length - c.waypointIndex, next: c.waypoints[c.waypointIndex] ?? null, tileSpeed: map.getSpeedMultiplier(c.tileX, c.tileY), profileSpeed: c.profile.speed, ill: Boolean(c.illness), injured: Boolean(c.isInjured) } : null;
        return { x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, task, building: b ? `${b.type}#${b.id}${b.underConstruction ? ' (şantiye)' : ''}` : null, inside: c.insideBuildingId, tile: map.get(c.tileX, c.tileY), walk, moving: c.isMoving };
      };
      const broke = (text) => {
        m.brokenCount++;
        if (m.broken.length < 50) m.broken.push(`G${game.state.time.day} ${String(game.state.time.hour).padStart(2, '0')} ${text}`);
      };

      m.sample = () => {
        const scene = game.scenes.current;
        const world = scene.world;
        const map = world.map;
        const s = game.state;
        const now = s.totalMinutes;
        m.samples++;
        m.maxPop = Math.max(m.maxPop, s.characters.length);
        m.maxFeuds = Math.max(m.maxFeuds, Object.values(s.relationships).filter((v) => v < 0).length);
        const ids = new Set(s.characters.map((c) => c.id));
        const byId = new Map(s.characters.map((c) => [c.id, c]));
        const buildings = new Map(s.buildings.map((b) => [b.id, b]));

        // ---- (29.2) Ruh halleri: katman tavanları, bilinmeyen anahtar, süresi geçmiş kayıt; yetişkinlerin ortalama iş çarpanı ----
        {
          const caps = { core: 1, action: 3, need: 2 };
          const defs = window.__moodDefs;
          let sum = 0; let n = 0; let lo = Infinity; let hi = 0;
          for (const c of s.characters) {
            const count = { core: 0, action: 0, need: 0 };
            for (const x of c.moodlets) {
              const d = defs?.[x.key];
              if (!d) { broke(`${c.name}: bilinmeyen moodlet ${x.key}`); continue; }
              count[d.layer]++;
              if (x.until !== null && x.until < now - 61) broke(`${c.name}: süresi geçmiş moodlet ${x.key}`);
            }
            for (const k of Object.keys(caps)) if (count[k] > caps[k]) broke(`${c.name}: ${k} katmanında ${count[k]} moodlet (tavan ${caps[k]})`);
            if (c.moodlets.length > 6) broke(`${c.name}: 6'dan fazla moodlet`);
            m.moodMax = Math.max(m.moodMax ?? 0, c.moodlets.length);
            if (!c.isChild && !c.role) { sum += c.mood.workMul; n++; lo = Math.min(lo, c.mood.workMul); hi = Math.max(hi, c.mood.workMul); }
          }
          if (n) { const w = (m.moodWork ??= { n: 0, sum: 0, min: Infinity, max: 0 }); w.n++; w.sum += sum / n; w.min = Math.min(w.min, lo); w.max = Math.max(w.max, hi); }
        }

        // ---- (29.1) Sosyal kimya: kayıp sakine işaret eden ilişki kaydı, sınır dışı kimya, bilinmeyen etiket, tek yönlü kimya ----
        for (const c of s.characters) {
          for (const [key, rel] of Object.entries(c.relationships ?? {})) {
            const id = Number(key);
            if (id !== 0 && !ids.has(id)) broke(`${c.name}: kimya kaydı kayıp sakine (#${id}) işaret ediyor`);
            if (!Number.isInteger(rel.chemistry) || rel.chemistry < -2 || rel.chemistry > 3) broke(`${c.name}: sınır dışı kimya ${rel.chemistry}`);
            if (rel.tags.some((t) => !['grateful', 'admiration', 'resentful', 'jealous', 'kindred'].includes(t))) broke(`${c.name}: bilinmeyen duygusal etiket ${rel.tags}`);
            const back = id !== 0 ? byId.get(id)?.relationships?.[c.id] : null;
            if (id !== 0 && ids.has(id) && (!back || back.chemistry !== rel.chemistry)) broke(`${c.name}: #${id} ile kimya tek yönlü / uyumsuz`);
          }
        }

        // ---- Takılma ----
        for (const c of s.characters) {
          for (const k of Object.keys(m.minNeeds)) if (c.needs[k] !== undefined) m.minNeeds[k] = Math.min(m.minNeeds[k], c.needs[k]);
          if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) broke(`${c.name}: konum sayı değil (${c.x},${c.y})`);
          if (c.away) {
            m.track.delete(c.id);
            continue;
          }
          const tile = `${c.tileX},${c.tileY}`;
          if (c.visible && !map.inBounds(c.tileX, c.tileY) && !c.newcomer) broke(`${c.name}: harita dışında (${tile})`);
          const idleish = c.visible && (!c.task || c.task.phase === 'travel');
          let t = m.track.get(c.id);
          // Süre, sakinin bu karoda boşta / yolda kalmaya BAŞLADIĞI örnekten sayılır (çalışırken geçen süre sayılmaz)
          // (23. aşama) Yalnızca gerçekten kıpırdamayan sakin takılmış sayılır: aynı karoda olmak yetmez, konum da (4 pikselden fazla)
          // değişmemiş olmalı. Her saat başı aynı kavşaktan (meydan) geçen uzun bir yürüyüş, buçuk saat örneklerinde hep aynı karoda
          // görünüp yanlışlıkla "takıldı" sayılabiliyordu (tohum 13, G15: Duru uzun yolları normal yürüyordu).
          if (!t || t.tile !== tile || !idleish || Math.hypot(c.x - t.x, c.y - t.y) > 4) {
            m.track.set(c.id, { tile, x: c.x, y: c.y, since: idleish ? now : null, flagged: false, blockFlag: false });
            continue;
          }
          if (t.since === null) t.since = now;
          if (!t.flagged && now - t.since >= STUCK_MINUTES) {
            t.flagged = true;
            m.stuck.push({ ...stamp(), name: c.name, tile, label: c.activityLabel, task: c.task?.activity ?? null, phase: c.task?.phase ?? null, reason: 'hareketsiz', detail: detail(c, map, world) });
          }
          // Yürünemez karoda yolda / boşta (bank, iskele gibi hedefler 'perform' evresinde sayılmaz)
          if (!c.isMoving && map.inBounds(c.tileX, c.tileY) && !map.isWalkable(c.tileX, c.tileY) && !t.blockFlag && now - t.since >= BLOCKED_MINUTES) {
            t.blockFlag = true;
            m.stuck.push({ ...stamp(), name: c.name, tile, label: c.activityLabel, task: c.task?.activity ?? null, phase: c.task?.phase ?? null, reason: 'yürünemez karoda', detail: detail(c, map, world) });
          }
        }
        for (const id of [...m.track.keys()]) if (!ids.has(id)) m.track.delete(id);

        // ---- Referans bütünlüğü ----
        const homeCount = new Map();
        for (const c of s.characters) {
          if (c.homeId !== null) {
            const home = buildings.get(c.homeId);
            if (!home) broke(`${c.name}: evi yok (homeId ${c.homeId})`);
            else homeCount.set(home.id, (homeCount.get(home.id) ?? 0) + 1);
          }
          if (c.partnerId !== null) {
            const p = byId.get(c.partnerId);
            if (!p) broke(`${c.name}: eşi / sevgilisi kayıp (${c.partnerId})`);
            else if (p.partnerId !== c.id) broke(`${c.name} -> ${p.name}: ilişki karşılıklı değil`);
            else if (c.married !== p.married) broke(`${c.name} -> ${p.name}: evlilik bayrağı tek taraflı`);
          } else if (c.married) broke(`${c.name}: evli ama eşi yok`);
          for (const pid of c.parentIds) if (!ids.has(pid)) broke(`${c.name}: ebeveyni kayıp (${pid})`);
          if (c.parentIds.includes(c.id)) broke(`${c.name}: kendi ebeveyni`);
          if (c.workplaceId !== null && !buildings.has(c.workplaceId)) broke(`${c.name}: sabit iş yeri yok (${c.workplaceId})`);
          if (c.insideBuildingId !== null) {
            const b = buildings.get(c.insideBuildingId);
            if (!b) broke(`${c.name}: var olmayan yapının içinde (${c.insideBuildingId})`);
            else if (!b.occupants.has(c.id)) broke(`${c.name}: ${b.type} içinde ama yapı onu bilmiyor`);
          }
          if (c.isChild && c.workplaceId !== null) broke(`${c.name}: çocuk ama sabit iş yeri var`);
        }
        for (const b of s.buildings) {
          for (const id of b.occupants) {
            const c = byId.get(id);
            if (!c) broke(`${b.type}#${b.id}: içeride var olmayan sakin ${id}`);
            else if (c.insideBuildingId !== b.id) broke(`${b.type}#${b.id}: içeride sanılan ${c.name} başka yerde`);
          }
          for (const id of b.workerIds) if (!ids.has(id)) broke(`${b.type}#${b.id}: çalışan listesinde var olmayan sakin ${id}`);
          if (b.workerSlots && b.workerIds.size > b.workerSlots) broke(`${b.type}#${b.id}: ${b.workerIds.size}/${b.workerSlots} çalışan (kapasite aşıldı)`);
          const residents = homeCount.get(b.id) ?? 0;
          if (b.capacity && residents > b.capacity) m.overfull.push(`G${s.time.day} ${b.type}#${b.id} ${residents}/${b.capacity}`);
        }
        // ---- (19. aşama) Evlilik akışı: taşınma, ortak ev, kutlama, huylar, dedikodu ----
        m.minPop = Math.min(m.minPop, s.characters.length);
        // (28.4) Geç oyun beklentisi: açıkken anlık refah ve eksik lüks örnekleri
        if (window.__lateMod && window.__tsMod && window.__lateMod.lateGameActive(s)) {
          const lt = (m.late ??= { n: 0, sum: 0, min: 100, max: 0, below100: 0, missingSum: 0, below90: 0, since: s.time.day });
          const hp = window.__tsMod.townHappiness(s);
          lt.n += 1; lt.sum += hp; lt.min = Math.min(lt.min, hp); lt.max = Math.max(lt.max, hp);
          if (hp < 99.5) lt.below100 += 1;
          if (hp < 90) lt.below90 += 1;
          lt.missingSum += window.__lateMod.missingLuxuries(s).length;
        }
        m.homelessMax = Math.max(m.homelessMax, s.characters.filter((c) => c.homeId === null && !c.role && !c.isVenerable).length); // (28.3) Saygın Büyükler yataksızdır
        const freeBed = s.buildings.some((b) => b.functional && b.capacity && (homeCount.get(b.id) ?? 0) <= b.capacity - 2);
        for (const c of s.characters) {
          if (!(window.__socialData ? window.__socialData.QUIRKS[c.quirk] : ['animalLover', 'bookworm', 'musician', 'natureEnthusiast'].includes(c.quirk))) broke(`${c.name}: huyu yok (${c.quirk})`);
          if (c.relocating && !c.away) {
            if (!m.relocateSince.has(c.id)) m.relocateSince.set(c.id, now);
            else if (now - m.relocateSince.get(c.id) > RELOCATE_HOURS * 60) {
              m.socialStuck.push(`G${s.time.day} ${c.name}: ${RELOCATE_HOURS} saattir yeni evine taşınamıyor (${c.activityLabel})`);
              m.relocateSince.set(c.id, now + 1e9); // bir kez raporla
            }
          } else m.relocateSince.delete(c.id);
          const p = c.married ? byId.get(c.partnerId) : null;
          if (!p || c.id > p.id) continue;
          const key = `${c.id}-${p.id}`;
          if (c.homeId !== p.homeId && freeBed && !c.isVenerable && !p.isVenerable) { // (28.3) Saygın Büyük yataksızdır
            if (!m.apartSince.has(key)) m.apartSince.set(key, now);
            else if (now - m.apartSince.get(key) > MAX_APART_HOURS * 60) {
              m.socialStuck.push(`G${s.time.day} ${c.name} & ${p.name}: boş yatak varken ${MAX_APART_HOURS} saattir ayrı evlerde`);
              m.apartSince.set(key, now + 1e9);
            }
          } else m.apartSince.delete(key);
        }
        const party = s.social?.party;
        if (party) {
          if (now > party.until + 60) broke(`düğün kutlaması bitiş vaktini aştı (${Math.round((now - party.until) / 60)} saat)`);
          for (const id of [...party.coupleIds, ...party.guestIds]) if (!ids.has(id)) broke(`düğün kutlaması: kayıp sakin ${id}`);
        }
        for (const n of s.social?.gossip ?? []) {
          if (n.heardBy.some((id) => !ids.has(id))) broke(`haber #${n.id}: kayıp sakin duymuş`);
          if (new Set(n.heardBy).size !== n.heardBy.length) broke(`haber #${n.id}: aynı sakin iki kez duymuş`);
        }
        for (const c of s.characters) if (c.lastNews && typeof c.lastNews.text !== 'string') broke(`${c.name}: bozuk son haber`);

        // ---- (21. aşama) Kese, çanta, dilekçeler, güven ve isyan ----
        {
          const CZ = window.__citizens;
          const ITEMS = window.__citizenData.ITEMS;
          const t = s.trust;
          const tv = t?.value;
          if (!Number.isFinite(tv) || tv < 0 || tv > 100) broke(`Yönetim Güveni aralık dışı (${tv})`);
          m.trustMin = Math.min(m.trustMin, tv);
          m.trustMax = Math.max(m.trustMax, tv);
          if (t?.revolt) m.revoltSamples++;
          for (const c of s.characters) {
            if (!Number.isFinite(c.coins) || c.coins < 0) broke(`${c.name}: kesesi bozuk (${c.coins})`);
            if (!Array.isArray(c.inventory)) broke(`${c.name}: çantası yok`);
            else {
              if (c.inventory.length > CZ.inventoryCapacity(c)) broke(`${c.name}: çantası taşıyor (${c.inventory.length}/${CZ.inventoryCapacity(c)})`);
              for (const it of c.inventory) if (!ITEMS[it.kind] || !(it.qty > 0) || it.qty > ITEMS[it.kind].stack) broke(`${c.name}: bozuk eşya ${JSON.stringify(it)}`);
            }
          }
          const owners = new Set();
          for (const p of s.petitions?.list ?? []) {
            if (!ids.has(p.characterId)) broke(`dilekçe #${p.id}: sahibi kayıp`);
            if (owners.has(p.characterId)) broke(`dilekçe #${p.id}: sakinin iki dilekçesi var`);
            owners.add(p.characterId);
          }
          const rv = t?.revolt;
          if (rv) {
            for (const id of rv.rioters) if (!ids.has(id)) broke(`isyan: kayıp isyancı ${id}`);
            for (const r of rv.raids) if (!buildings.has(r.targetId)) broke(`yağma #${r.id}: hedef yapı yok`);
          }
        }

        // ---- (22. aşama) Vergi, Krallık ve terk ediş ----
        {
          const CD = window.__crownData;
          if (!CD.TAX_RATES[s.tax?.rate]) broke(`geçersiz vergi kademesi (${s.tax?.rate})`);
          if (!Number.isFinite(s.tax?.nextAt)) broke('vergi takvimi yok');
          if (!Number.isFinite(s.crown?.nextLevyAt)) broke('Krallık Vergisi takvimi yok');
          if (s.crown?.decree && !CD.DECREES[s.crown.decree.kind]) broke(`bilinmeyen ferman ${s.crown.decree.kind}`);
          if (s.crown?.decree && now > s.crown.decree.deadline + 120) broke('ferman süresi geçtiği hâlde sonuçlanmadı');
          for (const c of s.characters) if (c.emigrating && now - c.emigrating.since > CD.EXODUS.leaveTimeoutMinutes + 120) broke(`${c.name}: köyü terk edemiyor (yolda takıldı)`);
          if (s.characters.filter((c) => !c.role).length < Math.min(CD.EXODUS.core, m.startPop ?? CD.EXODUS.core)) broke(`nüfus çekirdeğin altına indi (${s.characters.length})`);
          m.startPop ??= s.characters.length;
          if (s.exodus?.active) m.exodusSamples = (m.exodusSamples ?? 0) + 1;
        }

        // ---- (24. aşama) Gıda güvencesi ve tarım: kişi başı besin, kritik saatler, geçerli mahsul ----
        // (stok sınırı denetlenmez: kiler yıkılınca ya da testler kaynak verince stok sınırın üstünde kalabilir, oyun bunu kırpmaz)
        {
          const pop = Math.max(1, s.characters.length);
          const perCap = window.__foodSupplyOf(s) / pop;
          if (s.time.day >= 3) {
            m.foodMinPerCap = Math.min(m.foodMinPerCap ?? Infinity, perCap);
            if (perCap < 3) m.foodCriticalSamples = (m.foodCriticalSamples ?? 0) + 1; // bir öğünlük bile besin yok
            m.foodPerCapSum = (m.foodPerCapSum ?? 0) + perCap;
            m.foodPerCapN = (m.foodPerCapN ?? 0) + 1;
          }
          const GR = window.__granaryMod;
          if (GR) {
            for (const b of s.buildings) {
              if (b.type === 'garden' && !['grain', 'flax', 'hops'].includes(b.crop)) broke(`${b.name}: geçersiz mahsul (${b.crop})`);
              if (b.type !== 'garden' && b.crop !== null) broke(`${b.name}: bahçe olmayan yapıda mahsul (${b.crop})`);
              if (b.type === 'garden' && b.functional) m.cropHours = { ...(m.cropHours ?? {}), [b.crop]: ((m.cropHours ?? {})[b.crop] ?? 0) + 1 };
            }
          }
        }

        // ---- (24.2) Katma değerli üretim: handaki fıçılar geçerli mi, açken lüks işçi çalışıyor mu ----
        if (window.__refineryMod) {
          for (const b of s.buildings) {
            if (b.type === 'inn' && !(b.sherbet >= 0 && b.sherbet <= 12)) broke(`${b.name}: geçersiz fıçı sayısı (${b.sherbet})`);
            if (b.type !== 'inn' && b.sherbet) broke(`${b.name}: han olmayan yapıda fıçı (${b.sherbet})`);
          }
          if (window.__refineryMod.luxuryHungry(s)) {
            const working = s.characters.filter((c) => c.task?.phase === 'perform' && ['weave', 'brewSherbet'].includes(c.task.activity)).length;
            m.hungryLuxury = (m.hungryLuxury ?? 0) + working;
          }
        }

        // ---- (24.3) Dış ticaret: gemi 24 saatten fazla kalmaz, sözleşmeler ve çarpanlar geçerli ----
        if (window.__tradeMod && s.tradePost) {
          const tp = s.tradePost;
          if (tp.ship) {
            if (now > tp.ship.leavesAt + 120) broke('ticaret gemisi / kervanı ayrılma vaktini aştı');
            if (tp.ship.contracts.length !== 3) broke(`ticaret gemisinde ${tp.ship.contracts.length} sözleşme`);
            if (!s.buildings.some((b) => b.type === 'tradingPost')) broke('iskele yokken gemi / kervan var');
          }
          for (const [r, v] of Object.entries(tp.market)) if (!(v >= 0.55 && v < 1)) broke(`geçersiz pazar çarpanı ${r}: ${v}`);
          m.tradeMinMarket = Math.min(m.tradeMinMarket ?? 1, ...Object.values(tp.market), 1);
        }

        // ---- (25.1) Yaşam evreleri: evre yaşla tutarlı, yaş sayacı geçerli, emekli bilge çalışmıyor, çekirdek sakin güvencesi ----
        if (window.__lifeMod) {
          const L = window.__lifeMod;
          for (const c of s.characters) {
            if (c.role) continue;
            if (!L.isLifeStage(c.lifeStage)) broke(`${c.name}: geçersiz yaşam evresi (${c.lifeStage})`);
            else if ((c.lifeStage === 'child') !== c.isChild) broke(`${c.name}: çocukluk ile evre uyuşmuyor (${c.lifeStage})`);
            if (!Number.isInteger(c.ageInDays) || c.ageInDays < 0 || c.age !== L.ageFromDays(c.ageInDays)) broke(`${c.name}: geçersiz yaş sayacı (${c.age} / ${c.ageInDays})`);
            if (c.retired && c.lifeStage !== 'elder') broke(`${c.name}: bilge olmadığı hâlde emekli`);
            if (c.retired && (c.task?.jobId || c.task?.workBuildingId)) m.retiredWorking = (m.retiredWorking ?? 0) + 1;
          }
          const plan = L.retirementPlan(s);
          if (s.characters.some((c) => c.lifeStage === 'elder' && !c.role && c.retired !== plan.retired.has(c.id))) m.retireLag = (m.retireLag ?? 0) + 1;
          const counts = L.stageCounts(s);
          m.maxElders = Math.max(m.maxElders ?? 0, counts.elder);
          m.maxYouth = Math.max(m.maxYouth ?? 0, counts.youth);
          if (counts.elder > 0 && L.coreWorkers(s).length + plan.volunteers.size < Math.min(3, counts.youth + counts.adult + counts.elder)) broke('çekirdek sakin güvencesi bozuldu');
        }

        // ---- (25.2) Çıraklık: çırak Genç, yapısı var ve zanaat yapısı, ilerleme 0-100, kontenjan aşılmaz, tabure ustanın yanında ----
        if (window.__apprMod && s.apprenticeship) {
          const A = window.__apprMod;
          let active = 0;
          for (const c of s.characters) {
            const a = c.apprenticeship;
            if (!a) {
              if (c.task?.activity === 'apprentice') broke(`${c.name}: çırak değilken çıraklık yapıyor`);
              continue;
            }
            active++;
            if (c.lifeStage !== 'youth') m.adultApprentices = (m.adultApprentices ?? 0) + 1;
            const b = s.buildings.find((x) => x.id === a.buildingId);
            if (!b || !A.professionFor(b.type)) broke(`${c.name}: çıraklık yapısı yok`);
            if (!(a.progress >= 0 && a.progress <= 100)) broke(`${c.name}: geçersiz çıraklık ilerlemesi (${a.progress})`);
            if (a.masterId !== null && !s.characters.some((x) => x.id === a.masterId)) broke(`${c.name}: kayıp usta (${a.masterId})`);
            if (a.masterId === null) m.orphanSamples = (m.orphanSamples ?? 0) + 1;
          }
          for (const b of s.buildings) if (A.professionFor(b.type) && A.apprenticesAt(s, b).length > A.apprenticeSlots(b)) broke(`${b.name}: çırak kontenjanı aşıldı`);
          m.maxApprentices = Math.max(m.maxApprentices ?? 0, active);
        }

        // ---- (25.5) Yadigârlar: her sakinde en çok bir yadigâr, kasabada yadigâr kaybolmaz ----
        if (s.heirloom && window.__heirData) {
          let n = 0;
          for (const c of s.characters) {
            const h = (c.inventory ?? []).filter((x) => window.__heirData.HEIRLOOMS[x.kind]);
            if (h.length > 1) broke(`${c.name}: birden fazla yadigâr`);
            n += h.length;
          }
          const total = n + s.heirloom.archive.length;
          if (total < (m.heirloomMax ?? 0)) broke(`yadigâr kayboldu (${total} < ${m.heirloomMax})`);
          m.heirloomMax = Math.max(m.heirloomMax ?? 0, total);
        }

        // ---- (25.4) Aile Kütüğü: kuşak, ocak, çocuk listesi tutarlı; birinci derece akraba çift (ensest) yok ----
        if (s.lineage && window.__lineageMod) {
          const L = window.__lineageMod;
          const ids = new Map(s.characters.map((c) => [c.id, c]));
          for (const c of s.characters) {
            if (c.role) continue;
            if (!Number.isInteger(c.generation) || c.generation < 1) broke(`${c.name}: geçersiz kuşak (${c.generation})`);
            if (!s.lineage.families[c.familyId]) broke(`${c.name}: ocağı yok (${c.familyId})`);
            for (const pid of c.parents ?? []) {
              const p = ids.get(pid);
              if (p && c.generation !== Math.max(...c.parents.map((x) => ids.get(x)?.generation ?? 0)) + 1) broke(`${c.name}: kuşağı ebeveyniyle uyuşmuyor`);
              if (p && !p.children.includes(c.id)) broke(`${p.name}: çocuk listesinde ${c.name} yok`);
            }
            if (c.partnerId !== null) {
              const o = ids.get(c.partnerId);
              if (o && L.closeKin(c, o)) broke(`${c.name} ve ${o.name}: birinci derece akraba çift`);
            }
          }
          m.maxGeneration2 = Math.max(m.maxGeneration2 ?? 0, ...s.characters.map((c) => c.generation ?? 1));
        }

        // ---- (25.3) Mizaç: huy tanımlı mı, kaynak geçerli mi ----
        if (s.temperament && window.__socialData) {
          const Q = window.__socialData.QUIRKS;
          for (const c of s.characters) {
            if (c.role) continue;
            if (c.quirk && !Q[c.quirk]) broke(`${c.name}: bilinmeyen huy (${c.quirk})`);
            if (c.quirkOrigin && !['family', 'mentor', 'craft', 'self'].includes(c.quirkOrigin.kind)) broke(`${c.name}: geçersiz huy kaynağı`);
          }
          const gen = s.characters.filter((c) => Q[c.quirk]?.generation).length;
          m.maxGeneration = Math.max(m.maxGeneration ?? 0, gen);
        }

        // ---- (23. aşama) Krizler: yangın, hasar, haydut baskını, yaralanma ----
        {
          const KD = window.__crisisData;
          if (!KD.CRISIS_DIFFICULTY[s.crisis?.difficulty]) broke(`geçersiz tehlike sıklığı (${s.crisis?.difficulty})`);
          for (const b of s.buildings) {
            if (b.isBurning) {
              m.fireSamples = (m.fireSamples ?? 0) + 1;
              if (b.fireProgress >= 100) broke(`${b.name}: yangın %100'e vardı ama yapı hasara geçmedi`);
              if (b.damaged) broke(`${b.name}: hem yanıyor hem hasarlı`);
              if (b.underConstruction) broke(`${b.name}: şantiye yanıyor`);
              if (!b.fireSince) b.fireSince = now;
              if (now - b.fireSince > KD.FIRE.burnMinutes + 240) broke(`${b.name}: yangın bitiş vaktini aştı`);
            } else b.fireSince = null;
            if (b.damaged) {
              m.damagedSamples = (m.damagedSamples ?? 0) + 1;
              if (!b.damagedSince) b.damagedSince = now;
              if (b.damageKind && !KD.DAMAGE_KINDS[b.damageKind]) broke(`${b.name}: bilinmeyen hasar nedeni ${b.damageKind}`);
              // Boşta ustalar ya da oyuncu iki günden uzun süre onarmadıysa takılmıştır (kaynak yoksa uyarı)
              if (now - b.damagedSince > 3 * 1440 && !b.project) m.longDamaged = (m.longDamaged ?? 0) + 1;
            } else b.damagedSince = null;
          }
          for (const c of s.characters) {
            if (c.isInjured) {
              m.injuredSamples = (m.injuredSamples ?? 0) + 1;
              if (!(c.injuryTimer > 0)) broke(`${c.name}: yaralı ama iyileşme süresi yok`);
              if (c.injuryTimer > KD.INJURY.naturalHours * 60 + 1) broke(`${c.name}: yaralanma süresi sınırı aştı`);
            }
          }
          const rd = s.crisis?.raid;
          if (rd && now > rd.arriveAt + 180) broke('haydut baskını varış vaktini aştı ama çözülmedi');
          if (s.buildings.filter((b) => b.type === 'guardTower').some((b) => b.workerIds.size > b.guardSlots)) broke('Gözcü Kulesi: nöbetçi sayısı yuvaları aştı');
        }

        // ---- (20. aşama) Ulu Saat Kulesi ve Altın Çağ ----
        const tower = s.buildings.find((b) => b.type === 'wonder');
        if (tower) {
          m.towerMax = Math.max(m.towerMax ?? 0, tower.wonderStage + (tower.project ? 0.5 : 0));
          if (tower.wonderStage > 3 || tower.wonderStage < 0) broke(`kule: geçersiz aşama ${tower.wonderStage}`);
          if (tower.wonderComplete && !s.goldenAge?.since) broke('kule tamamlandı ama Altın Çağ başlamadı');
          if (tower.project && !scene.jobs.jobs.some((j) => j.buildingId === tower.id)) broke('kule: süren aşamanın iş emri yok');
        }
        const cel = s.goldenAge?.celebration;
        if (cel && now > cel.until + 60) broke(`Çağ Kutlaması bitiş vaktini aştı (${Math.round((now - cel.until) / 60)} saat)`);
        if ((s.resources.gears ?? 0) < 0) broke('Kadim Dişli stoğu eksiye düştü');

        // (16. aşama) Seferde kaybolan ya da takılan kafile
        const exp = s.dilemma.expedition;
        for (const c of s.characters) if (c.away && !exp?.members.includes(c.id)) broke(`${c.name}: seferde sanılıyor ama süren sefer yok (${c.away.stage}, ${c.task?.activity ?? 'görevsiz'}/${c.task?.phase ?? '-'}: ${c.activityLabel})`);
        if (exp) {
          for (const id of exp.members) if (!ids.has(id)) broke(`sefer: kafileden ${id} kayıp`);
          if (now > exp.until + 240 && !s.dilemma.active) broke(`sefer: dönüş vakti çoktan geçti (${Math.round((now - exp.until) / 60)} saat)`);
        }
        if (s.dilemma.active?.kind === 'adventure' && !exp) broke('macera penceresi açık ama süren sefer yok');
        for (const [key, cid] of world.reservations) if (!ids.has(cid)) broke(`rezervasyon ${key}: var olmayan sakin ${cid}`);
        for (const job of scene.jobs.jobs) {
          for (const a of job.assignees ?? []) if (!ids.has(a)) broke(`iş ${job.type}#${job.id}: atanan sakin yok (${a})`);
          if (job.buildingId && !buildings.has(job.buildingId)) broke(`iş ${job.type}#${job.id}: yapısı yok`);
          const jt = m.jobTrack.get(job.id);
          if (!jt || jt.progress !== job.progress) m.jobTrack.set(job.id, { progress: job.progress, since: now, flagged: false, type: job.type });
          else if (!jt.flagged && (job.assignees?.length ?? 0) > 0 && now - jt.since > JOB_STALE_DAYS * 1440) {
            jt.flagged = true;
            const jb = job.buildingId ? buildings.get(job.buildingId) : null;
            // (29.2) teşhis: yapı türü, ilerleme ve atananların o anki görevi / ruh hali
            m.staleJobs.push(`G${s.time.day} ${job.type}#${job.id} @${job.x},${job.y} atanan ${job.assignees.length}${jb ? ` · ${jb.type}${job.project ? ` (${job.project})` : ''}` : ''} · ilerleme ${Math.round(job.progress ?? 0)}/${Math.round(job.work ?? 0)} · ${job.assignees.map((id) => { const c = byId.get(id); return c ? `${c.name}:${c.task?.activity ?? '-'}/${c.task?.phase ?? '-'}${c.task?.jobId === job.id ? '*' : ''}:${c.mood?.feel}${c.mood?.shirk ? '!' : ''}` : id; }).join(', ')}`);
          }
        }

        // ---- (15. aşama) Meslek kıyafetleri: deneyime uygun kademe, sprite çizilebiliyor ----
        if (s.time.hour === 12) {
          for (const c of s.characters) {
            // Kademe anında (kademe atlama olayıyla) güncellenir; aynı kademede ana meslek değişirse kit saat başı tazelenir
            const want = window.__outfitFor(c);
            const level = (o) => (o ? o.split(':')[1] : null);
            if (level(c.outfit) !== level(want)) m.outfitErrors.push(`G${s.time.day} ${c.name}: ${c.outfit} != ${want}`);
            if (c.outfit) {
              const sprite = window.__charSprite(c.appearance, 'down', 'walk0', c.look);
              if (!sprite || sprite.width !== 12) m.outfitErrors.push(`G${s.time.day} ${c.name}: ${c.outfit} çizilemedi`);
            }
          }
          m.outfitErrors.length = Math.min(m.outfitErrors.length, 30);
        }

        // ---- Çalışanı olan ama üretmeyen iş yeri (16:30 örneği: mesai bitmeden günün üretimi) ----
        if (s.time.hour >= 9 && s.time.hour <= 15) for (const b of s.buildings) if (b.workerIds.size > 0) m.worked.add(b.id);
        if (s.time.hour === 16) {
          for (const b of s.buildings) {
            if (!b.functional || !b.definition.production || b.damaged) continue;
            const key = `${b.type}@${b.tileX},${b.tileY}`;
            const full = (s.resources[b.definition.production.resource] ?? 0) >= s.storageCapacity; // depo dolu: üretim boşa gider
            if (m.worked.has(b.id) && b.producedToday === 0 && !full) m.idleWorkplaces[key] = (m.idleWorkplaces[key] ?? 0) + 1;
            else delete m.idleWorkplaces[key];
          }
          m.worked.clear();
        }
      };
      m.report = () => {
        const s = game.state;
        const stalled = Object.entries(m.idleWorkplaces).filter(([, d]) => d >= 3).map(([k, d]) => `${k} (${d} gün)`);
        return {
          samples: m.samples,
          day: s.time.day,
          pop: s.characters.length,
          maxPop: m.maxPop,
          children: s.characters.filter((c) => c.isChild).length,
          married: s.characters.filter((c) => c.married).length,
          stuck: m.stuck,
          broken: m.broken,
          brokenCount: m.brokenCount,
          overfull: m.overfull.slice(0, 20),
          overfullCount: m.overfull.length,
          staleJobs: m.staleJobs,
          stalledWorkplaces: stalled,
          minNeeds: m.minNeeds,
          outfitErrors: m.outfitErrors,
          decoded: Object.values(s.exploration?.inscriptions ?? {}).filter((i) => i.status === 'decoded').length,
          exotic: s.buildings.filter((b) => (b.type === 'grapeVine' || b.type === 'ancientTorch') && b.functional).length,
          outfits: s.characters.filter((c) => c.outfit).map((c) => c.outfit),
          feuds: Object.values(s.relationships).filter((v) => v < 0).length,
          maxFeuds: m.maxFeuds,
          pairs: Object.keys(s.relationships).length,
          quarrels: s.stats.quarrels ?? 0,
          reconciliations: s.stats.reconciliations ?? 0,
          // (19. aşama) sosyal yaşam
          social: {
            stuck: m.socialStuck,
            minPop: Number.isFinite(m.minPop) ? m.minPop : s.characters.length,
            homelessMax: m.homelessMax,
            couples: s.characters.filter((c) => c.married).length / 2,
            couplesTogether: s.characters.filter((c) => c.married && s.characters.find((p) => p.id === c.partnerId)?.homeId === c.homeId).length / 2,
            dates: s.stats.dates ?? 0,
            parties: s.stats.weddingParties ?? 0,
            dinners: s.stats.familyDinners ?? 0,
            gossip: s.stats.gossipHeard ?? 0,
            serenades: s.stats.serenades ?? 0,
            cuddles: s.stats.petCuddles ?? 0,
            books: s.stats.booksRead ?? 0,
            homesFreed: s.stats.homesFreed ?? 0,
            news: s.social?.gossip.length ?? 0,
            quirks: Object.fromEntries(['animalLover', 'bookworm', 'musician', 'natureEnthusiast'].map((q) => [q, s.characters.filter((c) => c.quirk === q).length])),
          },
          // (24. aşama) gıda güvencesi (her sürümde) ve tarımsal çeşitlilik
          food: {
            minPerCap: Number.isFinite(m.foodMinPerCap) ? Math.round(m.foodMinPerCap * 10) / 10 : null,
            avgPerCap: m.foodPerCapN ? Math.round((m.foodPerCapSum / m.foodPerCapN) * 10) / 10 : null,
            criticalHours: m.foodCriticalSamples ?? 0,
            end: Math.round(window.__foodSupplyOf(s)),
          },
          agri: window.__granaryMod
            ? {
                silos: s.buildings.filter((b) => b.type === 'silo' && b.functional).length,
                gardens: s.buildings.filter((b) => b.type === 'garden' && b.functional).map((b) => b.crop).join(','),
                cropHours: m.cropHours ?? {},
                flax: s.stats.goods?.flax ?? 0,
                hops: s.stats.goods?.hops ?? 0,
                spoiled: { ...(s.granary?.spoiled ?? {}) },
                switches: s.granary?.switches ?? 0,
                granaryCapacity: s.granaryCapacity ?? 0,
              }
            : null,
          // (25.5)
          heirloom: s.heirloom && window.__heirData
            ? {
                carried: s.characters.flatMap((c) => (c.inventory ?? []).filter((x) => window.__heirData.HEIRLOOMS[x.kind]).map((x) => `${c.name}:${x.name}:${x.heirloom?.chain?.join('>')}`)),
                state: { created: s.heirloom.created, transfers: s.heirloom.transfers, archive: s.heirloom.archive.length },
                first: s.chronicle?.firstHeirloom ?? null,
              }
            : null,
          // (25.4)
          lineage: s.lineage
            ? {
                generations: s.characters.filter((c) => !c.role).reduce((m2, c) => ({ ...m2, [c.generation]: (m2[c.generation] ?? 0) + 1 }), {}),
                families: Object.keys(s.lineage.families).length,
                maxGeneration: m.maxGeneration2 ?? 1,
                gen2Married: s.characters.filter((c) => c.married && (c.generation ?? 1) >= 2).length,
                firstGen2Couple: s.chronicle?.firstGen2Couple ?? null,
                state: { ...s.lineage, families: undefined, heads: Object.keys(s.lineage.heads).length },
              }
            : null,
          // (25.3)
          temperament: s.temperament && window.__socialData
            ? {
                counts: Object.fromEntries(Object.keys(window.__socialData.QUIRKS).map((k) => [k, s.characters.filter((c) => c.quirk === k).length])),
                maxGeneration: m.maxGeneration ?? 0,
                state: { ...s.temperament },
                petitions: { ...(s.temperament.petitions ?? {}) },
              }
            : null,
          // (25.2)
          apprentice: window.__apprMod && s.apprenticeship
            ? {
                open: s.apprenticeship.open.length,
                active: s.characters.filter((c) => c.apprenticeship).length,
                maxActive: m.maxApprentices ?? 0,
                list: s.characters.filter((c) => c.apprenticeship).map((c) => `${c.name}:${c.apprenticeship.profession}:%${Math.floor(c.apprenticeship.progress)}`),
                grandmasters: s.characters.filter((c) => c.isGrandmaster).map((c) => `${c.name}:${c.grandmasterProfession}:${c.grandmasterBatches}`), // (28.2)
                orphanSamples: m.orphanSamples ?? 0,
                adultApprentices: m.adultApprentices ?? 0,
                state: { ...s.apprenticeship, open: undefined },
              }
            : null,
          // (25.1)
          life: window.__lifeMod
            ? {
                counts: window.__lifeMod.stageCounts(s),
                maxElders: m.maxElders ?? 0,
                maxYouth: m.maxYouth ?? 0,
                retired: s.characters.filter((c) => c.retired).length,
                retiredWorking: m.retiredWorking ?? 0,
                retireLag: m.retireLag ?? 0,
                ages: s.characters.filter((c) => !c.role).map((c) => c.age),
                state: { ...(s.lifeStages ?? {}) },
                // (28.3) Saygın Büyükler, nüfus (toplam / kotaya sayılan), en yaşlı sakin ve vefatın kopuk referans bırakmadığı (yukarıdaki referans denetimi) örnekleri
                venerable: s.characters.filter((c) => c.isVenerable).map((c) => `${c.name}:${c.age}/${c.lifespan}`),
                births: s.stats?.births ?? 0,
                // (29.2) ruh halleri: verilen moodlet sayıları, son günün dağılımı, baskın ruh halleri, örneklerdeki ortalama iş çarpanı
                moodlets: {
                  given: { ...(s.moodlets?.given ?? {}) },
                  consoled: s.moodlets?.consoled ?? 0,
                  grieved: s.moodlets?.grieved ?? 0,
                  mourners: s.moodlets?.mourners ?? 0,
                  now: s.characters.reduce((o, c) => { for (const x of c.moodlets) o[x.key] = (o[x.key] ?? 0) + 1; return o; }, {}),
                  feels: s.characters.reduce((o, c) => { o[c.mood.feel] = (o[c.mood.feel] ?? 0) + 1; return o; }, {}),
                  work: m.moodWork ?? null,
                  max: m.moodMax ?? 0,
                },
                // (29.1) sosyal kimya ve duygusal etiketler
                chemistry: (() => {
                  const dist = {}; const tags = {}; let records = 0; let ruler = 0;
                  for (const c of s.characters) for (const [k, r] of Object.entries(c.relationships ?? {})) {
                    if (k === '0') ruler += r.tags.length; else if (Number(k) > c.id) { dist[r.chemistry] = (dist[r.chemistry] ?? 0) + 1; records++; }
                    for (const t of r.tags) tags[t] = (tags[t] ?? 0) + 1;
                  }
                  return { records, dist, tags, ruler, given: s.stats.emotionTags ?? 0, kindred: s.stats.kindredBonds ?? 0, sparks: s.stats.sparks ?? 0, treats: s.stats.treats ?? 0, greetings: s.stats.tagGreetings ?? 0 };
                })(),
                valley: s.valley,
                doctrine: s.doctrine?.chosen ?? null,
                late: m.late ?? null, // (28.4)
                population: s.characters.length,
                active: s.characters.filter((c) => !c.isVenerable).length,
                lifespanMissing: s.characters.filter((c) => !c.role && !(c.lifespan >= 80 && c.lifespan <= 90)).length,
                venerableWithHome: s.characters.filter((c) => c.isVenerable && c.homeId !== null).length,
              }
            : null,
          // (24.3)
          trade: window.__tradeMod && s.tradePost
            ? {
                posts: s.buildings.filter((b) => b.type === 'tradingPost' && b.functional).length,
                visits: s.tradePost.visits,
                completed: s.tradePost.completed,
                goldEarned: s.tradePost.goldEarned,
                goldSpent: s.tradePost.goldSpent,
                imports: s.tradePost.imports,
                exported: { ...s.tradePost.exported },
                imported: { ...s.tradePost.imported },
                market: { ...s.tradePost.market },
                minMarket: m.tradeMinMarket ?? 1,
              }
            : null,
          // (24.2)
          refinery: window.__refineryMod
            ? {
                looms: s.buildings.filter((b) => b.type === 'loom' && b.functional).length,
                breweries: s.buildings.filter((b) => b.type === 'brewery' && b.functional).length,
                clothWoven: s.stats.goods?.cloth ?? 0,
                sherbetMade: s.stats.goods?.sherbet ?? 0,
                cloth: s.resources.cloth ?? 0,
                sherbet: s.resources.sherbet ?? 0,
                served: s.stats.sherbetServed ?? 0,
                innCasks: s.buildings.filter((b) => b.type === 'inn').map((b) => b.sherbet).join(','),
                jugs: s.stats.sherbetJugs ?? 0,
                jugsDrunk: s.stats.jugsDrunk ?? 0,
                garments: s.stats.garments ?? 0,
                dressed: s.characters.filter((c) => c.inventory.some((x) => x.kind === 'garment')).length,
                welfare: window.__refineryMod.clothWelfare(s),
                hungryLuxury: m.hungryLuxury ?? 0,
              }
            : null,
          // (23. aşama)
          crisis: {
            difficulty: s.crisis?.difficulty,
            fires: s.crisis?.fires ?? 0,
            extinguished: s.crisis?.extinguished ?? 0,
            burned: s.crisis?.burned ?? 0,
            raids: s.crisis?.raids ?? 0,
            repelled: s.crisis?.repelled ?? 0,
            tributes: s.crisis?.tributes ?? 0,
            caught: s.crisis?.caught ?? 0,
            injuries: s.crisis?.injuries ?? 0,
            treated: s.crisis?.treated ?? 0,
            repairs: s.crisis?.repairs ?? 0,
            injuredNow: s.characters.filter((c) => c.isInjured).length,
            damagedNow: s.buildings.filter((b) => b.damaged).length,
            burningNow: s.buildings.filter((b) => b.isBurning).length,
            fireHours: m.fireSamples ?? 0,
            damagedHours: m.damagedSamples ?? 0,
            injuredHours: m.injuredSamples ?? 0,
            longDamaged: m.longDamaged ?? 0,
            wells: s.buildings.filter((b) => b.type === 'well' && b.functional).length,
            towers: s.buildings.filter((b) => b.type === 'guardTower' && b.functional).length,
            guards: s.buildings.filter((b) => b.type === 'guardTower').reduce((n, b) => n + b.workerIds.size, 0),
            raidPending: Boolean(s.crisis?.raid),
          },
          // (22. aşama)
          crown: {
            rate: s.tax?.rate,
            collections: s.tax?.collections ?? 0,
            taxGold: s.tax?.totalGold ?? 0,
            taxGoods: s.tax?.totalGoods ?? 0,
            levies: s.crown?.levies ?? 0,
            paid: s.crown?.paid ?? 0,
            failed: s.crown?.failed ?? 0,
            reputation: Math.round(s.crown?.reputation ?? 0),
            delivered: s.crown?.delivered ?? 0,
            decreesFailed: s.crown?.decreesFailed ?? 0,
            statueRight: Boolean(s.crown?.statueRight),
            statues: s.buildings.filter((b) => b.type === 'royalStatue' && b.functional).length,
            emigrants: s.stats.emigrants ?? 0,
            exodusHours: m.exodusSamples ?? 0,
          },
          // (21. aşama)
          citizens: {
            trust: Math.round(s.trust?.value ?? 0),
            trustMin: Number.isFinite(m.trustMin) ? Math.round(m.trustMin) : null,
            trustMax: Number.isFinite(m.trustMax) ? Math.round(m.trustMax) : null,
            revolts: s.stats.revolts ?? 0,
            revoltHours: m.revoltSamples,
            raids: s.stats.raids ?? 0,
            lootedGoods: s.stats.lootedGoods ?? 0,
            lootedGold: s.stats.lootedGold ?? 0,
            reliefs: s.stats.reliefs ?? 0,
            petitions: { made: s.petitions?.made ?? 0, fulfilled: s.petitions?.fulfilled ?? 0, rejected: s.petitions?.rejected ?? 0, expired: s.petitions?.expired ?? 0, accepted: s.petitions?.accepted ?? 0, open: s.petitions?.list.length ?? 0 },
            wages: s.stats.wagesPaid ?? 0,
            purchases: s.stats.purchases ?? 0,
            bagMeals: s.stats.bagMeals ?? 0,
            ...window.__citizens.purseTotals(s),
          },
          // (20. aşama)
          golden: {
            towerMax: m.towerMax ?? 0,
            stage: s.buildings.find((b) => b.type === 'wonder')?.wonderStage ?? 0,
            since: s.goldenAge?.since?.day ?? null,
            chimes: s.goldenAge?.chimes ?? 0,
            celebrations: s.stats.ageCelebrations ?? 0,
            master: s.chronicle?.towerMaster?.name ?? null,
          },
          events: m.events,
          welfare: Math.round(s.town.welfare ?? 0),
          tier: s.town.tier,
        };
      };
      window.__monitor = m;
    },
    { STUCK_MINUTES, BLOCKED_MINUTES, JOB_STALE_DAYS, RELOCATE_HOURS, MAX_APART_HOURS }
  );
}

export function monitorReport(page) {
  return page.evaluate(() => window.__monitor.report());
}
