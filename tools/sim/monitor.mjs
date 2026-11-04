// Uzun simülasyonların bekçisi: oyun saatinde bir örnek alır, sonunda özet döndürür. Oyunu değiştirmez, yalnızca okur.
//
//   Takılma (stuck)  : uyanık, dışarıda, seferde olmayan bir sakin bir şey yapmadan (görevi yok ya da yolda) aynı karoda
//                      STUCK_MINUTES oyun dakikası kalırsa; ya da yürüyemez bir karoda (su, yapı) BLOCKED_MINUTES yolda / boşta kalırsa;
//                      ya da harita dışına çıkarsa
//   Referanslar      : ev, eş / sevgili (karşılıklı mı), ebeveyn, sabit iş yeri, içinde bulunduğu yapı, yapıların çalışan
//                      ve içerideki listeleri, rezervasyonlar, iş emirlerinin atananları; evdeki kişi sayısı kapasiteyi aşıyor mu
//   İş gücü          : çalışanı olan ama hiç üretmeyen (ya da çalışma noktası kalmamış) yapılar, sonsuz bekleyen iş emirleri
//
// Kullanım (Node tarafı):  await installMonitor(page);  ...  window.__monitor.sample() her saat;  await monitorReport(page)

export const STUCK_MINUTES = 150;     // görevsiz / yolda aynı karoda bu kadar kalan sakin takılmış sayılır
export const BLOCKED_MINUTES = 120;  // yürünemez karoda (su, yapı) görevsiz / yolda bu kadar kalan takılmış sayılır (3 örnek)
export const JOB_STALE_DAYS = 4;      // atanmış iş emri bu kadar gün ilerlemezse "sonsuz bekleme" sayılır

export async function installMonitor(page) {
  await page.evaluate(async () => {
    window.__outfitFor = (await import('/src/systems/SkillSystem.js')).outfitFor;
    window.__charSprite = (await import('/src/art/sprites/index.js')).getCharacterSprite;
  });
  await page.evaluate(
    ({ STUCK_MINUTES, BLOCKED_MINUTES, JOB_STALE_DAYS }) => {
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
        events: { weddings: 0, births: 0, grownUp: 0, quarrels: 0, reconciled: 0, ill: 0, cured: 0, cold: 0, warmed: 0, masterworks: 0, exhibited: 0, sold: 0 },
        outfitErrors: [], // (15. aşama) çizilemeyen ya da yanlış kademede kıyafet
      };
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

      const stamp = () => ({ day: game.state.time.day, hour: game.state.time.hour });
      // Takılan sakinin ayrıntısı: görevi, bulunduğu karodaki yapı, konumu (hata ayıklamak için)
      const detail = (c, map, world) => {
        const b = world.getBuilding(map.getOccupant(c.tileX, c.tileY));
        const task = c.task ? { activity: c.task.activity, phase: c.task.phase, buildingId: c.task.buildingId ?? null, jobId: c.task.jobId ?? null, spot: c.task.spot ?? null } : null;
        return { x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, task, building: b ? `${b.type}#${b.id}${b.underConstruction ? ' (şantiye)' : ''}` : null, inside: c.insideBuildingId, tile: map.get(c.tileX, c.tileY) };
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
          if (!t || t.tile !== tile || !idleish) {
            m.track.set(c.id, { tile, since: idleish ? now : null, flagged: false, blockFlag: false });
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
        // (16. aşama) Seferde kaybolan ya da takılan kafile
        const exp = s.dilemma.expedition;
        for (const c of s.characters) if (c.away && !exp?.members.includes(c.id)) broke(`${c.name}: seferde sanılıyor ama süren sefer yok`);
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
            m.staleJobs.push(`G${s.time.day} ${job.type}#${job.id} @${job.x},${job.y} atanan ${job.assignees.length}`);
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
          outfits: s.characters.filter((c) => c.outfit).map((c) => c.outfit),
          feuds: Object.values(s.relationships).filter((v) => v < 0).length,
          maxFeuds: m.maxFeuds,
          pairs: Object.keys(s.relationships).length,
          quarrels: s.stats.quarrels ?? 0,
          reconciliations: s.stats.reconciliations ?? 0,
          events: m.events,
          welfare: Math.round(s.town.welfare ?? 0),
          tier: s.town.tier,
        };
      };
      window.__monitor = m;
    },
    { STUCK_MINUTES, BLOCKED_MINUTES, JOB_STALE_DAYS }
  );
}

export function monitorReport(page) {
  return page.evaluate(() => window.__monitor.report());
}
