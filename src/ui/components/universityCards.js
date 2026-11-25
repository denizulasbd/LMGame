// (32.4) Darülfünun arayüzü: Yapı Bilgi Paneli'nin Darülfünun bölümü (Müderris, derste olanlar, öğrenciler ve ilerleme çubukları,
// sıradakiler, mezun sayısı, çarpanlar), Bilgelik Evi paneline tek satır, sakin kartı rozeti ve itibar dökümündeki "Eğitim" satırı.
// Paneli yalnızca okur. Şalter ENGINES.university kapalıyken hiçbir şey çizmez.
import { el } from '../dom.js';
import { getAnyIconURL } from '../../art/ui/index.js';
import { UNIVERSITY as U, UNIVERSITY_TEXT as TX } from '../../data/university.js';
import { RENOWN_TARGET } from '../../data/renown.js';
import { engineOn } from '../../systems/Engines.js';
import {
  universityOf, studentsOf, admissionQueue, fieldName, studyRatio, lectureMultiplier, archiveFactor, educationLevel, educationAdults,
  renownEducationShare, isLectureHour,
} from '../../systems/University.js';

const text = (t, cls = '') => el('div', { className: `upgrade-text${cls ? ` ${cls}` : ''}`, text: t });
const pct = (r) => `%${Math.round(r * 100)}`;
const mul = (v) => `×${Math.round(v * 100) / 100}`.replace('.', ',');

function icon(name) {
  try {
    return el('img', { src: getAnyIconURL(name), alt: '' });
  } catch {
    return el('img', { src: getAnyIconURL('book'), alt: '' });
  }
}

/** Derste olan öğrenciler (içeride, perform). */
function inLecture(state, building) {
  return state.characters.filter((c) => c.task?.activity === 'lecture' && c.task.buildingId === building.id && c.task.phase === 'perform');
}

/** Müderris (yapının çalışanı ya da son çalışanı) ve içeride mi. */
function professorOf(state, building) {
  const id = [...(building.workerIds ?? [])][0];
  const c = id !== undefined ? state.characters.find((x) => x.id === id) : null;
  return c ? { c, inside: c.task?.workBuildingId === building.id && c.task.phase === 'perform' } : null;
}

/** Değişim anahtarı (BuildingPanel): yalnızca bu değişince yeniden çizilir. */
export function universityKey(building, state) {
  if (!engineOn('university') || building.type !== 'university') return '';
  const students = studentsOf(state).map((c) => `${c.id}:${Math.floor(studyRatio(c) * 100)}:${c.task?.activity === 'lecture' ? 1 : 0}`).join(',');
  const queue = admissionQueue(state).map((c) => c.id).join(',');
  const prof = professorOf(state, building);
  return `${students}|${queue}|${prof ? `${prof.c.id}${prof.inside ? 'i' : ''}` : '-'}|${JSON.stringify(state.university ?? null)}|${lectureMultiplier(state, building).total}|${state.time.hour}`;
}

/** Yapı Bilgi Paneli bölümü (düğüm listesi; boşsa bölüm gizlenir). */
export function universitySection(building, state) {
  if (!engineOn('university') || building.type !== 'university' || !building.functional) return [];
  const students = studentsOf(state).sort((a, b) => studyRatio(b) - studyRatio(a) || a.id - b.id);
  const queue = admissionQueue(state);
  const prof = professorOf(state, building);
  const now = inLecture(state, building);
  const m = lectureMultiplier(state, building);
  const st = state.university ?? {};
  const hour = state.time.hour + state.time.minute / 60;
  const nodes = [
    el('div', { className: 'building-section-title', text: TX.name }),
    el('div', { className: 'decree luxury-card university-card' }, [
      el('div', { className: 'decree-head' }, [icon('book'), `Öğrenciler ${students.length}/${U.capacity}`, el('span', { className: 'decree-state', text: isLectureHour(hour) ? 'Ders saati' : `Ders ${U.hours.from}:00-${U.hours.to}:00` })]),
      text(prof ? `${TX.professor}: ${prof.c.name}${prof.inside ? ' (derste: ders ×2)' : ' (şu an yapıda değil)'}` : `${TX.professor}: yok (ders saatinde bir yetişkin gelir; Bilgelik becerisi yüksek ve eğitimli olan öne çıkar)`),
      text(`Şu an derste: ${now.length ? now.map((c) => c.name).join(', ') : 'kimse yok'}`),
      text(`Çarpanlar: Müderris ${m.professor > 1 ? mul(m.professor) : `×1 (yok; varken ${mul(U.professorMultiplier)})`} · Kraliyet Arşivi ${archiveFactor(state) > 1 ? mul(m.archive) : 'yok'} · misafir bilge ${m.guest > 1 ? mul(m.guest) : `yok (içerideyken ${mul(U.guestMultiplier)})`} · şimdi ${mul(m.total)}`),
      text(`Günde en çok ${U.minutesPerDay} dk ders; mezuniyet için ${U.graduateMinutes} ilerleme (Genç Yetişkin olurken)`),
    ]),
  ];
  if (students.length) {
    nodes.push(el('div', { className: 'university-list' }, students.map((c) => el('div', { className: 'university-row' }, [
      el('span', { className: 'university-name', text: `${c.name} · ${fieldName(c.higherStudy.field)}${c.apprenticeship ? ' · çırak' : ''}` }),
      el('span', { className: 'university-bar' }, [el('span', { className: 'university-fill', style: `width:${Math.round(studyRatio(c) * 100)}%` })]),
      el('span', { className: 'university-pct', text: pct(studyRatio(c)) }),
    ]))));
  } else nodes.push(text('Öğrenci yok: Bilgelik Evi mezunu gençler (18-20) gün dönümünde kabul edilir'));
  nodes.push(text(queue.length ? `Sırada: ${queue.slice(0, 5).map((c) => c.name).join(', ')}${queue.length > 5 ? ` (+${queue.length - 5})` : ''}` : 'Sırada bekleyen yok'));
  nodes.push(text(`Mezun ${st.graduated ?? 0} · yarım bırakan ${st.dropped ?? 0} · toplam kabul ${st.admitted ?? 0}`));
  return nodes;
}

/** Bilgelik Evi paneline tek satır. */
export function academyUniversityLine() {
  return engineOn('university') ? TX.academyLine : null;
}

/** Sakin kartı rozeti: { text, icon, cls } ya da null. */
export function universityTag(c) {
  if (!engineOn('university') || !c) return null;
  if (c.higherStudy) return { text: `Darülfünun öğrencisi · ${fieldName(c.higherStudy.field)} · ${pct(studyRatio(c))}`, icon: 'book', cls: 'is-vigor' };
  if (c.graduate) return { text: `Darülfünun mezunu · ${fieldName(c.graduate.field)}`, icon: 'star', cls: 'is-vigor' };
  return null;
}

/** (32.3 itibar dökümü) "Eğitim +1,4 (Darülfünun mezunu %10 · Bilgelik Evi mezunu %30)" ya da null. */
export function educationRenownLine(state) {
  if (!engineOn('university')) return null;
  const adults = educationAdults(state);
  const n = Math.max(1, adults.length);
  const two = adults.filter((c) => educationLevel(c) === 2).length;
  const one = adults.filter((c) => educationLevel(c) === 1).length;
  const v = Math.round(renownEducationShare(state) * RENOWN_TARGET.education.weight * 10) / 10;
  return `Eğitim +${String(v).replace('.', ',')} (Darülfünun mezunu ${pct(two / n)} · Bilgelik Evi mezunu ${pct(one / n)}${engineOn('educationMerit') ? '' : ', sayılmıyor'})`;
}

/** Arşiv (StatsPanel) için kısa özet. */
export function universityLedger(state) {
  if (!engineOn('university') || !(state.university || universityOf(state))) return null;
  const st = state.university ?? {};
  return {
    title: TX.name,
    body: [`öğrenci ${studentsOf(state).length}`, `mezun ${st.graduated ?? 0}`, `yarım bırakan ${st.dropped ?? 0}`],
    meta: `${st.studentDays ?? 0} öğrenci-gün · bölümler ${Object.entries(st.fields ?? {}).map(([k, v]) => `${fieldName(k)} ${v}`).join(', ') || '-'}`,
  };
}
