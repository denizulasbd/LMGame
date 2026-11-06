// Türkçe ad ekleri (ünlü uyumu ve ünsüz benzeşmesiyle): "Leyla'dan", "Emre'nin", "Mert'ten", "Ozan'ın".
// Dedikodu ve anı cümleleri sakin adlarına ek getirirken kullanır.

const BACK = 'aıou';
const FRONT = 'eiöü';
const VOWELS = BACK + FRONT + 'âîû';
const HARD = 'fstkçşhp'; // sert ünsüzler: -dan -> -tan
// İnce "l" ile biten adlar kalın ünlüye rağmen ince ek alır: "Kemal'in", "Hilal'den"
const FRONT_L = new Set(['kemal', 'cemal', 'celal', 'hilal', 'bilal', 'hayal', 'ikbal', 'meral', 'iclal', 'nihal', 'lal']);

function lastVowel(word) {
  const lower = word.toLocaleLowerCase('tr');
  if (FRONT_L.has(lower.split(' ').pop())) return 'e';
  for (let i = lower.length - 1; i >= 0; i--) if (VOWELS.includes(lower[i])) return lower[i];
  return 'e';
}

function endsWithVowel(word) {
  return VOWELS.includes(word.toLocaleLowerCase('tr').slice(-1));
}

function endsWithHard(word) {
  return HARD.includes(word.toLocaleLowerCase('tr').slice(-1));
}

/** İyelik / tamlayan eki: "Emre'nin", "Ozan'ın", "Duru'nun", "Kemal'in". */
export function genitive(name) {
  const v = lastVowel(name);
  const vowel = 'aı'.includes(v) || v === 'â' ? 'ı' : 'ou'.includes(v) || v === 'û' ? 'u' : 'öü'.includes(v) ? 'ü' : 'i';
  return `${name}'${endsWithVowel(name) ? 'n' : ''}${vowel}n`;
}

/** Ayrılma eki: "Leyla'dan", "Mert'ten", "Elif'ten", "Deniz'den". */
export function ablative(name) {
  const v = lastVowel(name);
  const vowel = BACK.includes(v) || 'âû'.includes(v) ? 'a' : 'e';
  return `${name}'${endsWithHard(name) ? 't' : 'd'}${vowel}n`;
}
