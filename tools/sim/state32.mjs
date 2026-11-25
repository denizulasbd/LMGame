// (32.6b) "Ortada bırakılmış" Aşama 32 durumu: açık dava, süren kamu hizmeti, yasak, utanç, kenara yürüyen sürgün, süren ders,
// süren kulüp buluşması ve telafi buluşması. Hem bütünleşme testi (tests/32.6b-integration.mjs) hem fikstür üretimi (autopilot
// --asama32-state, fixtures/save-v41-asama32.json) bunu çalıştırır. Sayfa içinde koşar: page.evaluate(buildMidState32).
// Yalnızca durum kurar (zar çekmez: suç zarı sabitlenir); sakinleri kimlik sırasıyla seçer, bulamadığını atlar ve neyi kurduğunu döndürür.
export const buildMidState32 = async () => {
  const st = window.game.state;
  const sc = window.game.scenes.current;
  const { Random } = await import('/src/utils/random.js');
  const J = await import('/src/systems/Justice.js');
  const C = await import('/src/systems/Clubs.js');
  const U = await import('/src/systems/University.js');
  const out = { openCase: null, service: null, ban: null, shamed: null, exile: null, lecture: null, live: null, makeup: null };
  const fixed = (v) => Object.assign(new Random(1), { next: () => v });
  const bld = st.buildings.find((b) => b.type === 'storage' && b.functional) ?? st.buildings.find((b) => b.type === 'inn' && b.functional);
  const free = () => st.characters.filter((c) => !c.role && !c.isChild && J.crimeCandidate(st, c) && !c.sentence && !c.higherStudy && !c.club && !c.apprenticeship).sort((a, b) => a.id - b.id);
  const freeAny = () => st.characters.filter((c) => !c.role && !c.isChild && J.crimeCandidate(st, c) && !c.sentence).sort((a, b) => a.id - b.id);
  const real = sc.crime.dice;
  const caught = (who, motive = 'temptation') => {
    sc.crime.dice = fixed(0);
    const k = sc.crime.commit(who, { crime: { crime: 'pantryRation', variant: 'ration', buildingId: bld?.id ?? null, motive } }, bld ?? null);
    sc.crime.dice = real;
    return k;
  };
  if (bld && J.courtOf(st)) {
    const pool = free().length >= 5 ? free() : freeAny();
    const [aOpen, aService, aBan, aShame, aExile] = pool;
    if (aService) {
      const k = caught(aService, 'poverty');
      if (k && sc.court.decide(k, 'serviceHeavy')) {
        aService.sentence.serviceDay = st.time.day;
        aService.sentence.serviceToday = 60;
        out.service = aService.id;
      }
    }
    if (aBan) {
      const k = caught(aBan, 'temptation');
      if (k && sc.court.decide(k, 'ban')) out.ban = aBan.id;
    }
    if (aExile) {
      const k = caught(aExile, 'grudge');
      if (k && sc.court.decide(k, 'exile') && aExile.sentence?.exile) out.exile = aExile.id; // kenara yürüyor: kayıt bu sırada alınır
    }
    if (aShame && sc.moodlets?.apply) {
      sc.moodlets.apply(aShame, 'shamed', { reason: 'shamed_exile', whoName: 'Bir komşu' });
      if (aShame.moodlets?.some((x) => x.key === 'shamed')) out.shamed = aShame.id;
    }
    if (aOpen) {
      const k = caught(aOpen, 'hunger');
      if (k?.status === 'open') out.openCase = k.id;
    }
  }
  const student = st.characters.find((c) => c.higherStudy);
  if (student) {
    student.higherStudy.day = st.time.day;
    student.higherStudy.today = Math.max(student.higherStudy.today ?? 0, 30);
    student.higherStudy.minutes = Math.max(student.higherStudy.minutes ?? 0, 200);
    out.lecture = student.id;
  }
  const keys = ['gardenClub', 'sewingClub', 'paintingClub'].filter((k) => C.clubBuilding(st, k));
  const withMembers = keys.filter((k) => C.membersOf(st, k).length >= 3);
  if (withMembers[0]) {
    const k = withMembers[0];
    const r = (st.clubs[k] ??= { sessions: 0, lastSession: null, attendance: [], recent: [], works: 0, products: 0 });
    const ids = C.membersOf(st, k).map((c) => c.id);
    r.live = { day: st.time.day, until: st.totalMinutes + 90, ids, came: ids.slice(0, 2), excused: [] };
    out.live = k;
  }
  if (withMembers[1]) {
    const k = withMembers[1];
    const r = (st.clubs[k] ??= { sessions: 0, lastSession: null, attendance: [], recent: [], works: 0, products: 0 });
    r.makeup = st.time.day + 1;
    r.planned = Math.max(r.planned ?? 0, 3);
    r.realized = Math.max(r.realized ?? 0, 2);
    r.madeUp = Math.max(r.madeUp ?? 0, 1);
    r.lead = { day: st.time.day, tiles: 14.5, minutes: 32 };
    out.makeup = k;
  }
  return out;
};
