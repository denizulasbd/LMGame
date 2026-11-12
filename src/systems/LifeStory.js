// (29.9) Yaşam Öyküsü: bir sakinin hayatını 3-6 cümlelik Türkçe bir metne döker. SAF ve şablon tabanlıdır: zar çekmez, durum yazmaz,
// aynı durum her zaman aynı metni verir. Kaynaklar: geliş biçimi ve yaş, meslek / unvan, eş ve çocuklar, kişilik değişim günlüğü
// (c.evolutions), doyum kademesi, sadakat rozeti, en önemli 2 anı (düğün, evlat, usta işi eser, yas, yangından kurtarılma, teselli;
// tırnaksız cümleye çevrilir, arzu / korku kaynaklı anılar öyküye girmez).
// Vefatta (population:dying) RiteSystem öyküyü üretip kitabeye (rites.names[].story, en çok STORY_MAX karakter) yazar.
import { TRAITS } from '../data/characters.js';
import { CAUSE_TEXT } from '../data/evolution.js';
import { primarySkill } from './SkillSystem.js';
import { grandmasterTitle } from './Grandmaster.js';
import { partnerOf, childrenOf } from './RelationshipSystem.js';
import { satisfactionTier } from './Wants.js';
import { loyaltyTier } from './Loyalty.js';
import { genitive } from '../utils/turkish.js';

export const STORY_MAX = 400;
const MIN_SENTENCES = 3;
const MAX_SENTENCES = 6;
const WISH_MIN = 3; // (29.10) bu kadar dilek gerçekleştiyse doyum kademesinden türeyen cümle öyküye girer

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

/** 0-99 arası sayının Türkçe yazılışı ("altmış sekiz"); büyükler rakamla. */
export function numberWords(n) {
  const v = Math.floor(Number(n));
  if (!(v >= 0) || v > 99) return String(Number.isFinite(v) ? v : 0);
  if (v === 0) return 'sıfır';
  return `${TENS[Math.floor(v / 10)]} ${ONES[v % 10]}`.trim();
}

const upper = (s) => (s ? s.charAt(0).toLocaleUpperCase('tr') + s.slice(1) : s);

const CLOSING = {
  radiant: 'gönlü zengin',
  fulfilled: 'gönlü hoş',
  content: 'gönlü rahat',
  restless: 'içi huzursuz',
  crushed: 'gönlü kırık',
};

const EVO_VERB = { turned: 'ağır bastı', deepened: 'derinleşti', acquired: 'ortaya çıktı' };

const IMMIGRANT_MEMORY = 'Kasabaya göçmen olarak katıldı'; // MemorySystem: population:joined
const FOUNDER_MEMORY = 'Kasabanın ilk sakinlerinden biri oldu'; // MemorySystem: yeni oyunun ilk sakinleri
const CHILD_MEMORY = 'Kasabada doğup büyüyor'; // MemorySystem: ilk sakinlerin çocukları

/**
 * Geliş biçimi: 'founder' | 'immigrant' | 'born'. (29.10) Kurucular da 'arrival' türünde ilk anıyla başladığı için tür değil kaynak
 * okunur: anne / baba ya da 2+. kuşak -> doğan; Tarihçe'nin kurucu listesi (state.chronicle.founders) ya da kurucu ilk anısı -> kurucu;
 * göçmen anısı ("Kasabaya göçmen olarak katıldı") -> göçmen. Hiçbiri yoksa (çok eski kayıt) kurucu sayılır.
 */
export function originOf(c, state = null) {
  const hasParents = (c.parentIds?.length ?? 0) > 0 || (c.parents?.length ?? 0) > 0;
  if (hasParents || (c.generation ?? 1) > 1) return 'born';
  if ((state?.chronicle?.founders ?? []).some((f) => f.id === c.id)) return 'founder';
  const mem = c.memories ?? [];
  if (mem[0]?.text === FOUNDER_MEMORY) return 'founder';
  if (mem[0]?.text === CHILD_MEMORY) return 'born';
  if (mem.some((m) => m.kind === 'arrival' && m.text === IMMIGRANT_MEMORY)) return 'immigrant';
  return 'founder';
}

function originSentence(c, state, dead) {
  const kind = originOf(c, state);
  if (kind === 'born') return `${c.name} bu kasabada dünyaya geldi`;
  if (kind === 'immigrant') return `${c.name} kasabaya göçmen olarak geldi`;
  return dead ? `${c.name} kasabanın kurucularındandı` : `${c.name} kasabanın kurucularından`;
}

function professionSentence(c, dead) {
  if (c.isChild) return `Henüz çocuk; günlerini oyunla ve büyümeyle geçiriyor`;
  const gm = grandmasterTitle(c);
  if (c.isVenerable) return dead ? 'Saygın Büyük olarak kasabanın gönlünde yer etti' : 'Saygın Büyük olarak kasabanın gönlünde yer ediyor';
  const main = primarySkill(c);
  if (gm) return dead ? `Ömrünü zanaata verdi ve ${gm} oldu` : `Ömrünü zanaata veriyor ve ${gm} sayılıyor`;
  if (main && main.level.level >= 2) {
    const title = `${main.level.name} ${main.def.title}`;
    return dead ? `Ömrünü ${main.def.name.toLocaleLowerCase('tr')} işine verdi ve ${title} oldu` : `${main.def.name} işinde yıllarını verdi ve ${title} oldu`;
  }
  if (main) return dead ? `${main.def.name} işinde çırak olarak çalıştı` : `${main.def.name} işinde çırak olarak çalışıyor`;
  return null;
}

function familySentence(c, state, dead) {
  const partner = partnerOf(state, c);
  const ids = new Set([...(c.children ?? []), ...childrenOf(state, c).map((k) => k.id)]);
  const n = ids.size;
  const parts = [];
  if (partner) parts.push(`${partner.name} ile ${c.married ? 'evlendi' : 'gönül bağı kurdu'}`);
  if (n > 0) parts.push(`${numberWords(n)} evlat ${dead ? 'büyüttü' : n > 1 ? 'büyütüyor' : 'büyütüyor'}`);
  return parts.length ? parts.join(', ') : null;
}

function evolutionSentence(c, dead) {
  const log = (c.evolutions ?? []).filter((e) => TRAITS[e.to] || e.kind === 'deepened');
  if (!log.length) return null;
  const clause = (e, skipCause = false) => {
    // (29.10) nedeni boş değişim "Zamanla" yerine nedensiz cümleyle anlatılır; ikinci değişimin nedeni ilkiyle aynıysa yinelenmez
    const cause = !skipCause && CAUSE_TEXT[e.cause] ? `${CAUSE_TEXT[e.cause]} ` : '';
    const trait = TRAITS[e.to]?.name ?? 'kişiliği';
    return e.kind === 'turned' ? `${cause}${trait} yanı ${EVO_VERB.turned}` : e.kind === 'acquired' ? `${cause}içinde ${trait} bir yan belirdi` : `${cause}${trait} yanı ${EVO_VERB.deepened}`;
  };
  const first = log[0];
  const last = log.length > 1 ? log[log.length - 1] : null;
  const head = upper(clause(first));
  return last ? `${head}, yıllar geçtikçe ${clause(last, last.cause === first.cause)}` : head;
}

// (29.10) dilek sayısı yerine doyum kademesinden tek ifade (Hâlinden Memnun kademesinde cümle yok)
const WISH_TEXT = {
  radiant: ['Hayattan umduğunu fazlasıyla buldu', 'Hayattan umduğunu fazlasıyla buluyor'],
  fulfilled: ['Dileklerinin çoğuna kavuştu', 'Dileklerinin çoğuna kavuşuyor'],
  restless: ['Aradığını pek bulamadı', 'Aradığını henüz bulamadı'],
  crushed: ['Umduklarının azını gördü', 'Umduklarının azını görüyor'],
};

function wishSentence(c, dead) {
  if (c.isChild || (c.wishCount ?? 0) < WISH_MIN) return null;
  const pair = WISH_TEXT[satisfactionTier(c.satisfaction).key];
  return pair ? pair[dead ? 0 : 1] : null;
}

function loyaltySentence(c, dead) {
  const tier = c.isChild || c.role ? null : loyaltyTier(c);
  if (tier === 'loyal') return dead ? 'Yönetime sadık kaldı' : 'Yönetime gönülden sadık';
  if (tier === 'bitter') return dead ? 'Yönetime kırgındı' : 'Yönetime kırgın';
  return null;
}

// (29.10) Anılar tırnaksız cümleye çevrilir. Yalnızca bu türler öyküye girer (öncelik sırasıyla); arzu / korku kaynaklı anılar
// ("Dileği oldu: …", "Korktuğu başına geldi: …") ve diğerleri girmez. Düğün ve evlat anısı aile cümlesi zaten anlatıyorsa atlanır.
const MEMORY_RULES = [
  { key: 'wedding', named: true, test: (m) => m.kind === 'wedding', re: /^(.+) ile (.+) evlendi$/, text: (x) => `${x[1]} ile ${x[2]} evlendiği günü hiç unutmadı`, skipIfPartner: true },
  { key: 'child', test: (m) => m.kind === 'child', re: /^Çocuğu (.+) dünyaya geldi$/, text: (x) => `Evladı ${x[1]} dünyaya geldiğinde gözleri doldu`, skipIfChildren: true },
  { key: 'masterwork', test: (m) => m.kind === 'masterwork', re: /^Usta işi bir eser yaptı: (.+)$/, text: (x) => `Elinden ${x[1]} adlı usta işi bir eser çıktı` },
  { key: 'mourning', named: true, test: (m) => m.kind === 'life', re: /^(.+) yasını tuttu$/, text: (x) => `${x[1]} yasını tuttu` },
  { key: 'fire', test: (m) => m.kind === 'life', re: /^(.+) yangında (evini|iş yerini) kurtardı$/, text: (x) => `Bir yangında ${x[2] === 'evini' ? 'evini' : 'iş yerini'} ${x[1]} kurtardı` },
  { key: 'consoled', test: (m) => m.kind === 'life', re: /^(.+) (yasında|korkusunda|kederinde) onu teselli etti$/, text: (x) => `${x[2] === 'yasında' ? 'Yasında' : x[2] === 'korkusunda' ? 'Korkusunda' : 'Kederinde'} ${x[1]} onu teselli etti` },
];

function memorySentence(c, state) {
  const mem = (c.memories ?? []).filter((m) => typeof m.text === 'string');
  if (!mem.length) return null;
  const hasPartner = Boolean(partnerOf(state, c));
  const hasChildren = (c.children?.length ?? 0) > 0 || childrenOf(state, c).length > 0;
  const picks = [];
  for (const rule of MEMORY_RULES) {
    if (picks.length >= 2) break;
    if ((rule.skipIfPartner && hasPartner) || (rule.skipIfChildren && hasChildren)) continue;
    // aynı türün en yeni anısı
    for (let i = mem.length - 1; i >= 0; i--) {
      const m = mem[i];
      if (!rule.test(m)) continue;
      const x = rule.re.exec(m.text);
      if (!x) continue;
      picks.push({ text: rule.text(x), named: Boolean(rule.named) });
      break;
    }
  }
  if (!picks.length) return null;
  // ikinci cümle noktalı virgülle bağlanır; özel adla başlıyorsa (düğün, yas) baş harfi küçültülmez
  const second = (p) => (p.named ? p.text : p.text.charAt(0).toLocaleLowerCase('tr') + p.text.slice(1));
  return picks.length > 1 ? `${picks[0].text}; ${second(picks[1])}` : picks[0].text;
}

function closingSentence(c, dead) {
  const tier = c.isChild ? null : CLOSING[satisfactionTier(c.satisfaction).key];
  const age = `${upper(numberWords(c.age))} yaşında`;
  if (dead) return `${age}, ${tier ?? 'gönlü rahat'} göçtü`;
  return `${age}${tier ? `; ${tier}` : ''}`;
}

/**
 * Sakinin yaşam öyküsü (3-6 cümle). opts.dead: geçmiş zamanlı veda öyküsü (kitabe); opts.max: karakter sınırı (varsayılan STORY_MAX
 * kitabe içindir; kartta sınırsız bırakmak için 0 ver).
 * Sıra: geliş, meslek, aile, kişilik değişimi, dilek, sadakat, anılar, kapanış. Uzunsa en sondaki isteğe bağlı cümleler düşer.
 */
export function lifeStory(c, state, opts = {}) {
  if (!c || !state) return '';
  const dead = Boolean(opts.dead);
  const max = opts.max === undefined ? 0 : opts.max;
  // görünüm sırası: meslek, aile, kişilik değişimi, dilek, sadakat, anılar; yer kısıtlıysa öncelik: anılar sadakatten önce gelir
  const parts = [professionSentence(c, dead), familySentence(c, state, dead), evolutionSentence(c, dead), wishSentence(c, dead), loyaltySentence(c, dead), memorySentence(c, state)];
  const head = originSentence(c, state, dead);
  const tail = closingSentence(c, dead);
  const room = MAX_SENTENCES - 2;
  const chosen = new Set();
  for (const i of [0, 1, 2, 3, 5, 4]) if (parts[i] && chosen.size < room) chosen.add(i);
  let middle = parts.filter((t, i) => chosen.has(i));
  // en az 3 cümle
  while (middle.length + 2 < MIN_SENTENCES) middle.push(dead ? 'Günlerini kasabanın sıradan ve değerli işlerinde geçirdi' : 'Günlerini kasabanın sıradan ve değerli işlerinde geçiriyor');
  const build = (mid) => [head, ...mid, tail].map((s) => `${upper(s)}.`).join(' ');
  let text = build(middle);
  if (max > 0) {
    while (text.length > max && middle.length > Math.max(0, MIN_SENTENCES - 2)) {
      middle = middle.slice(0, -1);
      text = build(middle);
    }
    if (text.length > max) text = `${text.slice(0, max - 1).trimEnd()}…`;
  }
  return text;
}

/** Kitabe için: vefat anındaki öykü (geçmiş zaman, en çok STORY_MAX karakter). */
export function epitaphStory(c, state) {
  return lifeStory(c, state, { dead: true, max: STORY_MAX });
}

/** Kartın tek cümlelik durumu: "Kederli · Deniz'in yasını tutuyor" (baskın his + en ağır moodlet'in nedeni). */
export function statusSentence(c, state, MOODLETS, reasonText) {
  const feel = c.mood?.feel ?? 'Dengeli';
  const list = c.moodlets ?? [];
  let top = null;
  let topWeight = -1;
  for (let i = 0; i < list.length; i++) {
    const def = MOODLETS[list[i].key];
    if (def && def.weight > topWeight) {
      top = list[i];
      topWeight = def.weight;
    }
  }
  if (!top) return `${feel} · gündelik hayatına dengeyle devam ediyor`;
  if (top.key === 'mourning' && top.whoName) return `${feel} · ${genitive(top.whoName)} yasını tutuyor`;
  const name = MOODLETS[top.key].name;
  let why = reasonText(top);
  // (29.10) neden metni moodlet adıyla başlıyorsa (wish_come_true: "Dileği oldu: …", dread_realized: "Korktuğu başına geldi: …") yinelenmesin
  const lead = name.toLocaleLowerCase('tr');
  if (why && why.toLocaleLowerCase('tr').startsWith(lead)) why = why.slice(name.length).replace(/^\s*[:·-]\s*/, '');
  return why ? `${feel} · ${name}: ${why}` : `${feel} · ${name}`;
}
