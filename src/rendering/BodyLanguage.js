// (29.8) Beden dili: ruh halinin gövdedeki izi. YALNIZCA çizim kaydırmaları ve küçük kaplama pikselleridir (yeni sprite sayfası yok);
// oyun durumuna hiçbir şey yazılmaz, zar / Math.random / Date.now yoktur, zaman karakterin animTime'ından türer ve kare başına
// nesne / dizi / kapanış ayrılmaz.
//
// Öncelik yukarıdan aşağıya; bir sakinde aynı anda TEK gövde hareketi (bodyKind):
//   grief   : c.mood.grief ya da travma çekirdeği -> yürürken sallanma yok, gövde 1 piksel aşağıda, ara sıra tek piksel gözyaşı
//   joy     : euphoric / celebrated / wish_come_true -> dururken ve yürürken 2 piksellik zıplama (0,4 sn aralıkla)
//   tired   : exhausted ya da c.mood.shirk -> yürüme sallanması yarı hızda, dururken hafif yana kayma
//   side    : side_by_side (çalışırken) -> iki sakin arasında ara sıra küçük pırıltı
//   rub     : rubbing_wrong (çalışırken) -> birbirine sırt dönük yön
//   special : bugün özel günü -> başının üstünde küçük kurdele / çiçek pikseli
import { MOODLETS } from '../data/moodlets.js';

/** Çizim bağlamı: TownScene her karede yazar (çizime özgü; oyun durumu DEĞİL). */
export const expressionContext = { day: 0, totalMinutes: 0, characters: null };

export function setExpressionContext(state) {
  expressionContext.day = state.time.day;
  expressionContext.totalMinutes = state.totalMinutes;
  expressionContext.characters = state.characters;
}

const JOY_KEYS = { euphoric: true, celebrated: true, wish_come_true: true };
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

/** Kimliğe göre sakin (çizimde, dizi taranır; ayırma yok). */
export function findCharacter(id) {
  const list = expressionContext.characters;
  if (!list) return null;
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function moodletOf(c, key) {
  const list = c.moodlets;
  if (!list) return null;
  for (let i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
  return null;
}

/** 'grief' | 'joy' | 'tired' | 'side' | 'rub' | 'special' | null: önceliğe göre tek gövde hareketi. */
export function bodyKind(c, day = expressionContext.day) {
  const mood = c.mood;
  const list = c.moodlets;
  let grief = Boolean(mood?.grief);
  let joy = false;
  let tired = Boolean(mood?.shirk);
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const key = list[i].key;
      if (JOY_KEYS[key]) joy = true;
      else if (key === 'exhausted') tired = true;
      else if (MOODLETS[key]?.tone === 'trauma') grief = true;
    }
  }
  if (grief) return 'grief';
  if (joy) return 'joy';
  if (tired) return 'tired';
  if (c.pose === 'work') {
    const side = moodletOf(c, 'side_by_side');
    if (side && Number.isFinite(side.whoId)) return 'side';
    const rub = moodletOf(c, 'rubbing_wrong');
    if (rub && Number.isFinite(rub.whoId)) return 'rub';
  }
  if (c.specialDay && c.specialDay.day === day) return 'special';
  return null;
}

/** Yürüyüş karesi için süre (tükenmiş sakinde yarı hız). */
export function walkPeriod(kind) {
  return kind === 'tired' ? 0.32 : 0.16;
}

/** Gövde kaydırması: { x, y } SABİT nesneye yazılır (ayırma yok). */
export const bodyOffset = { x: 0, y: 0 };
export function computeBodyOffset(c, kind) {
  let x = 0;
  let y = 0;
  const walking = c.pose === 'walk';
  const standing = !walking && c.pose !== 'sit' && c.pose !== 'work' && c.pose !== 'fish' && c.pose !== 'gather' && c.pose !== 'tend';
  const t = c.animTime;
  if (kind === 'grief') y = 1;
  else if (kind === 'joy' && (walking || standing)) y = Math.floor(t / 0.2) % 2 === 0 ? -2 : 0;
  else if (kind === 'tired' && standing) x = Math.floor(t / 1.4) % 3 === 1 ? 1 : 0;
  bodyOffset.x = x;
  bodyOffset.y = y;
  return bodyOffset;
}

/** Çizimde gösterilen yön: birbirine kırgın çalışanlar sırt döner (c.facing'e dokunulmaz). */
export function displayFacing(c, kind) {
  if (kind !== 'rub') return c.facing;
  const rub = moodletOf(c, 'rubbing_wrong');
  const other = rub ? findCharacter(rub.whoId) : null;
  if (!other) return c.facing;
  const dx = other.x - c.x;
  const dy = other.y - c.y;
  // sırtı ötekine dönük: ona doğru bakmanın tersi
  const toward = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up';
  return OPPOSITE[toward];
}

// --- kaplama pikselleri (dünya koordinatı; Character.drawOverlay çağırır) ---
const TEAR = '#8ec9ff';
const RIBBON = '#ff7fb0';
const RIBBON_DARK = '#c24b7e';
const SPARK = '#ffe58a';
const SPARK_HOT = '#ffffff';

/** Gözyaşı, özel gün kurdelesi ve yan yana çalışan çiftin pırıltısı. Salt okunur. */
export function drawBodyDecor(renderer, c, kind) {
  if (kind === null || (kind !== 'grief' && kind !== 'side' && kind !== 'special')) return;
  const t = c.animTime;
  const x = Math.round(c.x);
  const top = Math.round(c.y) - c.spriteHeight;
  if (kind === 'grief') {
    // her 3,6 sn'de yarım saniye: tek piksel gözyaşı yanaktan aşağı süzülür
    const phase = t % 3.6;
    if (phase < 0.6) {
      const side = c.facing === 'left' ? -2 : c.facing === 'right' ? 1 : (c.id & 1) === 0 ? -2 : 1;
      renderer.fillRect(x + side, top + 6 + Math.floor(phase * 6), 1, 1, TEAR);
    }
  } else if (kind === 'special') {
    // başın üstünde minik kurdele (iki pembe piksel + düğüm)
    const dx = c.facing === 'left' ? -3 : 1;
    renderer.fillRect(x + dx, top - 1, 2, 1, RIBBON);
    renderer.fillRect(x + dx + 2, top - 1, 1, 1, RIBBON_DARK);
    renderer.fillRect(x + dx - 1, top - 1, 1, 1, RIBBON_DARK);
  } else if (kind === 'side') {
    const rec = moodletOf(c, 'side_by_side');
    const other = rec ? findCharacter(rec.whoId) : null;
    if (!other || !(c.id < other.id || bodyKind(other) !== 'side')) return;
    // ara sıra (her çift için ~%20 dilim) iki sakinin arasında küçük pırıltı
    const slice = Math.floor(t / 1.5);
    if ((slice + c.id + other.id) % 5 !== 0) return;
    const mx = Math.round((c.x + other.x) / 2);
    const my = Math.round((c.y + other.y) / 2) - c.spriteHeight + 4;
    const blink = Math.floor(t / 0.25) % 2 === 0;
    renderer.fillRect(mx, my - (blink ? 1 : 0), 1, 3, SPARK);
    renderer.fillRect(mx - 1, my + (blink ? 0 : 1), 3, 1, SPARK);
    renderer.fillRect(mx, my + (blink ? 0 : 1), 1, 1, SPARK_HOT);
  }
}
