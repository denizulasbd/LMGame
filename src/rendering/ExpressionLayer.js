// (29.8) Duygu Katmanı ve düşünce balonu. SALT OKUNUR çizimdir: oyun durumuna hiçbir şey yazılmaz, zar / Math.random / Date.now yoktur
// (animasyon zamanı sahnenin animationTime'ından, düşünce dilimi oyun saatinden türer), kare başına nesne / dizi / kapanış ayrılmaz.
//
//   Duygu Katmanı (M tuşu, dock'ta "Duygular"; tercih tarayıcıda hatırlanır; fotoğraf modunda gizli):
//     açıkken her sakinin başının üstünde ruh hali işareti (travma: koyu bulut · coşkulu: pırıltı · yorgun / bıkkın: ter damlası ·
//     dengeli: işaret yok); seçili sakin varken ondan ekrandaki diğer sakinlere ince bağ çizgileri (en çok 8, mutlak puana göre).
//     Kapalıyken işaret yalnızca seçili ve imlecin üstündeki sakinde görünür.
//   Bağ çizgisi rengi (öncelik sırasıyla): eş / sevgili pembe · ruh ikizi altın · kırgın / rakip kırmızı · ilişki puanı ≥ 40 yeşil.
//   Düşünce balonu: (floor(totalMinutes / 20) + c.id) % 9 === 0 olan 20 dakikalık dilimde, sakin 'perform' evresinde boş zaman / sosyal
//     etkinlikteyse ve konuşma balonu yoksa; içeriği en yüksek puanlı arzunun (doyum < 40 ise korkunun) simgesi. Çocukta / uyuyanda yok.
//   Ekrandaki balon (konuşma + düşünce) sayısı en çok BUBBLE_LIMIT: öncelik seçili sakin, sonra konuşma, sonra düşünce.
import { WANTS, FEARS } from '../data/wants.js';
import { ACTIVITIES } from '../data/activities.js';
import { getFriendship, arePartners } from '../systems/RelationshipSystem.js';
import { hasTag } from '../systems/Chemistry.js';
import { getAnyIconSprite } from '../art/ui/index.js';

export const EMOTION_PREF_KEY = 'lmgame.ui.emotionLayer';
export const BUBBLE_LIMIT = 12;
export const MAX_LINKS = 8;
export const THOUGHT_SLICE_MINUTES = 20;
export const THOUGHT_MODULUS = 9;
const FEAR_BELOW = 40; // doyum bunun altındaysa düşünce korkudur
const RIVAL_BELOW = -10; // BOND_POINTS.rival.below ile aynı
const FRIEND_FROM = 40;

export const LINK_COLORS = { pink: '#ff7fb0', gold: '#ffd24a', red: '#ff5a4d', green: '#5fd06a' };
// Ruh hali işaret renkleri moodlet çiplerinin tonlarıyla aynıdır (styles/ui.css .moodlet-chip)
export const MARK_COLORS = { trauma: '#8a3fa0', positive: '#d9a520', negative: '#d98a2c' };

export function readEmotionPref() {
  try {
    return localStorage.getItem(EMOTION_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function writeEmotionPref(on) {
  try {
    localStorage.setItem(EMOTION_PREF_KEY, on ? '1' : '0');
  } catch {
    /* depolama erişilemez: tercih yalnızca bu oturumda geçerli */
  }
}

/** 'cloud' | 'sparkle' | 'sweat' | null: baskın hisse göre ruh hali işareti. */
export function moodMarkOf(c) {
  const m = c.mood;
  if (!m) return null;
  if (m.tone === 'trauma') return 'cloud';
  if (m.feel === 'Coşkulu' || m.feel === 'İlhamlı') return 'sparkle';
  if (m.tone === 'negative' && (m.feel === 'Yorgun' || m.feel === 'Bıkkın')) return 'sweat';
  return null;
}

/** 'pink' | 'gold' | 'red' | 'green' | null: a'nın b ile bağının çizgi rengi. score: getFriendship değeri. */
export function bondColorOf(a, b, score) {
  if (arePartners(a, b)) return 'pink';
  if (hasTag(a, b.id, 'kindred') || hasTag(b, a.id, 'kindred')) return 'gold';
  if (hasTag(a, b.id, 'resentful') || hasTag(b, a.id, 'resentful') || score < RIVAL_BELOW) return 'red';
  if (score >= FRIEND_FROM) return 'green';
  return null;
}

/** Düşünce balonu bu sakinin başında şu dakikada görünür mü (saf)? */
export function thoughtVisible(c, totalMinutes) {
  if (!c.visible || c.isChild || c.isSleeping || c.speech || c.role) return false;
  if ((Math.floor(totalMinutes / THOUGHT_SLICE_MINUTES) + c.id) % THOUGHT_MODULUS !== 0) return false;
  const t = c.task;
  if (!t || t.phase !== 'perform') return false;
  const kind = ACTIVITIES[t.activity]?.kind;
  return kind === 'leisure' || kind === 'social';
}

/** Düşüncenin simgesi: doyum < 40 ise en ağır korku, değilse en yüksek puanlı arzu (yoksa öteki); ikisi de yoksa null. */
export function thoughtIconOf(c) {
  const wants = c.wants;
  const fears = c.fears;
  let want = null;
  let wantPoints = -1;
  if (wants) {
    for (let i = 0; i < wants.length; i++) {
      const def = WANTS[wants[i].key];
      if (def && def.points > wantPoints) {
        wantPoints = def.points;
        want = def;
      }
    }
  }
  let fear = null;
  let fearPoints = -1;
  if (fears) {
    for (let i = 0; i < fears.length; i++) {
      const def = FEARS[fears[i].key];
      if (def && def.points > fearPoints) {
        fearPoints = def.points;
        fear = def;
      }
    }
  }
  if (c.satisfaction < FEAR_BELOW) return (fear ?? want)?.icon ?? null;
  return (want ?? fear)?.icon ?? null;
}

// --- ruh hali işareti desenleri ('.' boş) ---
const CLOUD = ['..xxx..', '.xxxxx.', 'xxxxxxx', '.yyyyy.'];
const SPARKLE_A = ['..y..', '.yYy.', 'yYWYy', '.yYy.', '..y..'];
const SPARKLE_B = ['.....', '..y..', '.yWy.', '..y..', '.....'];
const SWEAT = ['.y.', 'yYy', 'yYy', '.y.'];
const SWEAT_B = ['...', '.y.', 'yYy', '.y.'];

function drawPattern(ctx, rows, px, py, u, base, light, hot) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let k = 0; k < row.length; k++) {
      const ch = row.charCodeAt(k);
      if (ch === 46) continue; // '.'
      ctx.fillStyle = ch === 120 /* x */ ? base : ch === 121 /* y */ ? light : hot;
      ctx.fillRect(px + k * u, py + r * u, u, u);
    }
  }
}

function drawMark(ctx, mark, sx, sy, u, time) {
  if (mark === 'cloud') {
    // koyu bulut hafifçe salınır
    const bob = Math.floor(time / 0.6) % 2 === 0 ? 0 : u;
    drawPattern(ctx, CLOUD, sx + 5 * u, sy - 3 * u + bob, u, '#3a2147', MARK_COLORS.trauma, '#ffffff');
  } else if (mark === 'sparkle') {
    drawPattern(ctx, Math.floor(time / 0.35) % 2 === 0 ? SPARKLE_A : SPARKLE_B, sx + 5 * u, sy - 4 * u, u, '#d9a520', '#ffe58a', '#ffffff');
  } else if (mark === 'sweat') {
    // damla yavaşça süzülür
    drawPattern(ctx, Math.floor(time / 0.5) % 2 === 0 ? SWEAT : SWEAT_B, sx + 5 * u, sy - 2 * u, u, MARK_COLORS.negative, '#8fd0ff', '#ffffff');
  }
}

// --- düşünce balonu (bulut) ---
const INK = '#1b1423';
const PAPER = '#fff8e7';
function cloudRects(ctx, x, y, w, h, pad, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2 - pad, y - pad, w - 4 + pad * 2, h + pad * 2); // gövde (köşeleri oyuk)
  ctx.fillRect(x - pad, y + 2 - pad, w + pad * 2, h - 4 + pad * 2);
  ctx.fillRect(x + 4 - pad, y - 3 - pad, 6 + pad * 2, 3 + pad * 2); // üst tümsekler
  ctx.fillRect(x + w - 10 - pad, y - 2 - pad, 5 + pad * 2, 2 + pad * 2);
}

/**
 * Düşünce balonlarını çizer (ekran koordinatı; resetCamera sonrası). phase: 0 hepsi, 1 yalnızca seçili sakin, 2 seçili dışındakiler.
 * budget: { left } (paylaşılan balon bütçesi, konuşma balonlarıyla aynı nesne).
 */
export function drawThoughtBubbles(renderer, camera, characters, totalMinutes, budget, selectedId, phase = 0) {
  const ctx = renderer.ctx;
  const z = camera.zoom;
  const slice = THOUGHT_SLICE_MINUTES;
  for (let i = 0; i < characters.length; i++) {
    const c = characters[i];
    if (phase === 1 && c.id !== selectedId) continue;
    if (phase === 2 && c.id === selectedId) continue;
    if (budget && budget.left <= 0) return;
    if (!thoughtVisible(c, totalMinutes)) continue;
    const icon = thoughtIconOf(c);
    if (!icon) continue;
    const sprite = getAnyIconSprite(icon);
    if (!sprite) continue;
    const k = Math.max(1, Math.floor(z));
    const w = sprite.width * k + 8;
    const h = sprite.height * k + 6;
    const sx = Math.round((c.x - camera.x) * z);
    const sy = Math.round((c.y - c.spriteHeight - (c.bubble ? 12 : 2) - camera.y) * z);
    const x = sx - Math.round(w / 2);
    const y = sy - h - 12;
    const into = totalMinutes % slice;
    const alpha = into < 1 ? into : slice - into < 1 ? slice - into : 1;
    ctx.globalAlpha = alpha;
    cloudRects(ctx, x, y, w, h, 1, INK);
    cloudRects(ctx, x, y, w, h, 0, PAPER);
    // iki küçük daire: balonu sakine bağlar
    ctx.fillStyle = INK;
    ctx.fillRect(sx - 1, y + h + 1, 6, 5);
    ctx.fillRect(sx - 3, y + h + 6, 4, 4);
    ctx.fillStyle = PAPER;
    ctx.fillRect(sx, y + h + 2, 4, 3);
    ctx.fillRect(sx - 2, y + h + 7, 2, 2);
    ctx.drawImage(sprite, x + 4, y + 3, sprite.width * k, sprite.height * k);
    ctx.globalAlpha = 1;
    if (budget) budget.left--;
  }
}

export class ExpressionLayer {
  constructor(events) {
    this.events = events;
    this.enabled = readEmotionPref();
    this.budget = { left: BUBBLE_LIMIT };
    // bağ çizgileri: sabit yuvalar (her karede yeni dizi / nesne ayrılmaz)
    this.linkCount = 0;
    this.linkChar = new Array(MAX_LINKS).fill(null);
    this.linkColor = new Array(MAX_LINKS).fill(null);
    this.linkScore = new Float64Array(MAX_LINKS);
  }

  destroy() {
    /* abonelik yok: 'ui:toggleEmotions'ı TownScene dinler (sahne her yeniden kurulduğunda sızıntı olmasın) */
  }

  setEnabled(on) {
    const next = Boolean(on);
    if (next === this.enabled) return;
    this.enabled = next;
    writeEmotionPref(next);
    this.events.emit('ui:emotionsChanged', next);
  }

  beginFrame() {
    this.budget.left = BUBBLE_LIMIT;
    return this.budget;
  }

  /** Seçili sakinden ekrandaki diğerlerine bağ yuvalarını doldurur (en çok 8, |puan| azalan; eşitlikte küçük kimlik). */
  collectLinks(state, camera, renderer, selected) {
    this.linkCount = 0;
    if (!selected || !selected.visible) return 0;
    const z = camera.zoom;
    const list = state.characters;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o === selected || !o.visible || o.role) continue;
      const sx = (o.x - camera.x) * z;
      const sy = (o.y - camera.y) * z;
      if (sx < -24 || sy < -24 || sx > renderer.width + 24 || sy > renderer.height + 24) continue;
      const score = getFriendship(state, selected, o);
      const color = bondColorOf(selected, o, score);
      if (!color) continue;
      const mag = Math.abs(score);
      let slot = this.linkCount;
      if (slot === MAX_LINKS) {
        if (mag <= this.linkScore[MAX_LINKS - 1]) continue; // eşitlikte önce gelen (küçük sıra) kalır
        slot = MAX_LINKS - 1;
      } else this.linkCount++;
      while (slot > 0 && this.linkScore[slot - 1] < mag) {
        this.linkScore[slot] = this.linkScore[slot - 1];
        this.linkChar[slot] = this.linkChar[slot - 1];
        this.linkColor[slot] = this.linkColor[slot - 1];
        slot--;
      }
      this.linkScore[slot] = mag;
      this.linkChar[slot] = o;
      this.linkColor[slot] = color;
    }
    return this.linkCount;
  }

  /**
   * Duygu Katmanı çizimi (ekran koordinatı). selectedId / hoveredId: kapalıyken işaret yalnızca bu iki sakinde görünür.
   * Fotoğraf modunda çağrılmaz (TownScene).
   */
  draw(renderer, camera, state, time, selectedId, hoveredId) {
    const ctx = renderer.ctx;
    const z = camera.zoom;
    const chars = state.characters;
    const on = this.enabled;
    if (!on && selectedId === null && hoveredId === null) return;
    let selected = null;
    if (selectedId !== null) for (let i = 0; i < chars.length; i++) if (chars[i].id === selectedId) selected = chars[i];
    if (on && selected) {
      const n = this.collectLinks(state, camera, renderer, selected);
      if (n > 0) {
        const ax = Math.round((selected.x - camera.x) * z);
        const ay = Math.round((selected.y - selected.spriteHeight / 2 - camera.y) * z);
        ctx.save();
        ctx.lineWidth = Math.max(1, Math.round(z / 2));
        ctx.globalAlpha = 0.75;
        for (let i = 0; i < n; i++) {
          const o = this.linkChar[i];
          ctx.strokeStyle = LINK_COLORS[this.linkColor[i]];
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(Math.round((o.x - camera.x) * z), Math.round((o.y - o.spriteHeight / 2 - camera.y) * z));
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (!c.visible) continue;
      if (!on && c.id !== selectedId && c.id !== hoveredId) continue;
      const mark = moodMarkOf(c);
      if (!mark) continue;
      const sx = Math.round((c.x - camera.x) * z);
      const sy = Math.round((c.y - c.spriteHeight - camera.y) * z);
      drawMark(ctx, mark, sx, sy, Math.max(1, Math.round(z / 2)), time);
    }
  }
}
