// Kasaba sakini. Kim olduğu (isim, görünüm, özellikler, ihtiyaçlar) ve anlık hâli
// (konum, yön, poz, yürüdüğü yol, ifade balonu) burada tutulur. Ne yapacağına
// src/ai/Brain.js karar verir, src/systems/ altındaki sistemler uygular.
//
// 9. aşama: aile bağları (partnerId, married, parentIds), çocukluk (growsUpAt: büyüyeceği oyun
// dakikası; null = yetişkin) ve kişisel ekipman (equipment: { tool, clothing, bag } -> data/equipment.js).
import { CONFIG } from '../config.js';
import { Entity } from './Entity.js';
import { NEED_KEYS } from '../data/characters.js';
import { CHILDREN } from '../data/family.js';
import { buildTraitProfile } from '../ai/TraitProfile.js';
import { getCharacterSprite, characterHeight, CHARACTER_WIDTH, CHARACTER_HEIGHT } from '../art/sprites/index.js';
import {
  getBubbleSprite,
  getHeldToolSprite,
  getCarrySprite,
  getBackpackSprite,
  BUBBLE_WIDTH,
  BUBBLE_HEIGHT,
} from '../art/ui/index.js';

const HALF_WIDTH = CHARACTER_WIDTH / 2;
const BUBBLE_POP_TIME = 0.15;
const SWING_SECONDS = 0.25; // çalışırken alet bu sürede bir kalkıp iner

// Elde tutulan aletin karaktere göre konumu: [kalkık, inik] (sağa bakarken; sola aynalanır)
const TOOL_OFFSETS = {
  right: [[3, -17], [5, -12]],
  left: [[-8, -17], [-10, -12]],
  down: [[2, -15], [3, -11]],
  up: [[-2, -19], [-1, -15]],
};

// Olta (9x9, sapı sol altta, ucu sağ üstte): sapın karakterin elinde olacağı konum [x, y] ve
// ucunun sprite içindeki yeri. Sola bakarken sprite aynalanır.
const ROD_OFFSETS = { right: [3, -17], left: [-12, -17] };
const ROD_TIP = { right: { x: 11.5, y: -16.5 }, left: { x: -11.5, y: -16.5 } };
const BOBBER_DISTANCE = 17; // olta ucundan şamandıraya yatay mesafe
const LINE_COLOR = 'rgba(238, 251, 255, 0.85)';

// Kazmanın vurduğu nokta (karakterin ayağına göre), baktığı yöne göre: toz buradan kalkar
const DUST_OFFSETS = { up: [1, -19], down: [3, -2], right: [9, -8], left: [-9, -8] };

const EMPTY_EQUIPMENT = { tool: null, clothing: null, bag: null };

export class Character extends Entity {
  constructor({
    id,
    name,
    age = 20,
    traits = [],
    appearance,
    needs,
    homeId = null,
    x = 0,
    y = 0,
    growsUpAt = null,
    parentIds = [],
    partnerId = null,
    married = false,
    partnerSince = null,
    marriedAt = null,
    lastChildAt = null,
    equipment = null,
    relocating = false,
    illness = null,
    exposure = 0,
    away = null,
    schooling = 0,
    schoolDay = 0,
    schoolToday = 0,
    educated = false,
    workplaceId = null,
    customName = false,
  }) {
    super({ id, x, y });
    this.name = name;
    this.age = age;
    this.traits = traits;
    this.appearance = appearance;
    this.needs = needs ?? Object.fromEntries(NEED_KEYS.map((k) => [k, 100]));
    this.homeId = homeId;
    // Aile: çocuksa büyüyeceği oyun dakikası; ebeveynleri; partneri / eşi
    this.growsUpAt = growsUpAt;
    this.parentIds = [...parentIds];
    this.partnerId = partnerId;
    this.married = married;
    this.partnerSince = partnerSince; // partner olduğu oyun dakikası
    this.marriedAt = marriedAt; // evlendiği oyun dakikası
    this.lastChildAt = lastChildAt; // ailesine son çocuğun katıldığı oyun dakikası
    this.relocating = relocating; // evlenince eşiyle paylaşacağı yeni eve taşınacak
    this.equipment = { ...EMPTY_EQUIPMENT, ...(equipment ?? {}) };
    // 11. aşama: sağlık ve keşif seferi
    this.illness = illness ? { ...illness } : null; // üşütme: { since, remaining (oyun dakikası) }
    this.exposure = exposure; // hastalığa yakınlık 0-100 (soğuk, yağmur, açlık, bitkinlik; data/health.js)
    this.away = away ? { ...away } : null; // keşif seferinde: { stage: 'leaving' | 'away', until, exit }
    // 12. aşama: okul (çocukken Bilgelik Evi'nde dinlenen ders dakikası; yeterliyse büyüyünce Kalfa başlar)
    this.schooling = schooling;
    this.schoolDay = schoolDay;
    this.schoolToday = schoolToday;
    this.educated = educated; // okulu bitirip meslekte Kalfa olarak başladı
    // 13. aşama: oyuncunun sabitlediği iş yeri (yalnızca orada çalışır) ve oyuncunun verdiği ad
    this.workplaceId = workplaceId;
    this.customName = customName;
    this.profile = buildTraitProfile(traits, { child: this.isChild });

    // Anlık durum (kaydedilmez, yapay zekâ yeniden kurar)
    this.facing = 'down';
    this.pose = 'stand'; // stand | walk | sit | gather | work | fish | tend | hidden
    this.visible = true;
    this.insideBuildingId = null;
    this.activityLabel = 'Etrafa bakınıyor';
    this.task = null;
    this.waypoints = null;
    this.waypointIndex = 0;
    this.animTime = Math.random() * 2; // herkes aynı anda nefes almasın
    this.bubble = null;
    this.bubbleCooldown = 2 + Math.random() * 4;
    this.tool = null; // çalışırken elindeki alet
    this.carrying = null; // kilere taşıdığı yük { resource, amount }
    this.newcomer = false; // kasabaya yeni geldi, önce evine yerleşecek
    this.workEffect = null; // çalışırken çizilen efekt ('dust')
    this.buffs = {}; // kişisel geçici bonuslar: { warmMeal, warmUntil: bitiş dakikası }
    this.skills = {}; // meslek deneyimi: { woodcutting: çalışılan dakika, ... } (data/skills.js)
    this.role = null; // 'merchant' gibi kasabalı olmayan ziyaretçiler için
    this.backpack = false; // gezgin tüccarın sırt çantası
    this.coatVisible = false; // paltosu varsa sonbahar ve kışın giyer (CraftingSystem günceller)
    this.lookCache = null;
  }

  /** Henüz büyümemiş çocuk mu? */
  get isChild() {
    return this.growsUpAt !== null;
  }

  /** Sprite görünüşü: çocuk / palto / sırt çantası (önbellekli nesne; anahtar değişince yenilenir). */
  get look() {
    const child = this.isChild;
    const coat = !child && this.coatVisible;
    const bag = !child && this.equipment.bag === 'backpack';
    const cached = this.lookCache;
    if (!cached || cached.child !== child || cached.coat !== coat || cached.bag !== bag) this.lookCache = { child, coat, bag };
    return this.lookCache;
  }

  get spriteHeight() {
    return characterHeight(this.look);
  }

  /** Çocuk büyüyüp yetişkin olur: çalışabilir, kendi kişilik düzenine kavuşur. */
  growUp() {
    this.growsUpAt = null;
    this.age = CHILDREN.adultAge;
    this.profile = buildTraitProfile(this.traits);
  }

  get tileX() {
    return Math.floor(this.x / CONFIG.TILE_SIZE);
  }

  get tileY() {
    return Math.floor(this.y / CONFIG.TILE_SIZE);
  }

  get isMoving() {
    return this.waypoints !== null;
  }

  get isSleeping() {
    return this.task?.activity === 'sleep' && this.task.phase === 'perform';
  }

  /** Y-sıralama anahtarı; oturan karakter bankın önünde kalsın diye yarım piksel öne alınır. */
  get sortY() {
    return this.pose === 'sit' ? this.y + 0.5 : this.y;
  }

  setWaypoints(points) {
    this.waypoints = points.length > 0 ? points : null;
    this.waypointIndex = 0;
  }

  clearPath() {
    this.waypoints = null;
    this.waypointIndex = 0;
  }

  /** Kalan yol noktaları (seçili karakterin rotasını çizmek için). */
  remainingWaypoints() {
    return this.waypoints ? this.waypoints.slice(this.waypointIndex) : [];
  }

  showBubble(icon, duration = 2.2) {
    this.bubble = { icon, time: 0, duration };
  }

  faceToward(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx >= 0 ? 'right' : 'left';
    else this.facing = dy >= 0 ? 'down' : 'up';
  }

  /** Dünya pikselindeki nokta bu karakterin üzerinde mi (tıklama için). */
  hitTest(worldX, worldY) {
    if (!this.visible) return false;
    const top = this.y - this.spriteHeight + (this.pose === 'sit' ? 2 : 0);
    return worldX >= this.x - HALF_WIDTH - 1 && worldX <= this.x + HALF_WIDTH + 1 && worldY >= top && worldY <= this.y + 2;
  }

  currentFrame() {
    const t = this.animTime;
    switch (this.pose) {
      case 'walk':
        return Math.floor(t / 0.16) % 2 === 0 ? 'walk0' : 'walk1';
      case 'sit':
        return t % 2.2 > 1.6 ? 'sit1' : 'sit0';
      case 'gather':
        return Math.floor(t / 0.28) % 2 === 0 ? 'idle0' : 'idle1';
      case 'work':
        return Math.floor(t / SWING_SECONDS) % 2 === 0 ? 'idle0' : 'idle1';
      case 'fish':
        return t % 2.6 > 2 ? 'idle1' : 'idle0'; // olta başında uzun uzun bekler
      default:
        return t % 1.6 > 1.1 ? 'idle1' : 'idle0';
    }
  }

  currentSprite() {
    const frame = this.currentFrame();
    const facing = frame.startsWith('sit') ? 'down' : this.facing;
    return getCharacterSprite(this.appearance, facing, frame, this.look);
  }

  queueDraw(queue) {
    if (!this.visible) return;
    const sprite = this.currentSprite();
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    queue.addImage(this.sortY, sprite, x - HALF_WIDTH, y - sprite.height + 1);

    // Gezgin tüccarın sırt çantası: yukarı bakarken önde (sırtı görünür), diğer yönlerde arkada
    if (this.backpack) {
      const view = this.facing === 'up' ? 'back' : this.facing === 'down' ? 'front' : this.facing;
      const sprite = getBackpackSprite(view);
      const bob = this.pose === 'walk' && Math.floor(this.animTime / 0.16) % 2 === 0 ? 1 : 0;
      const offsetX = this.facing === 'left' ? 1 : this.facing === 'right' ? -7 : -5;
      queue.addImage(this.sortY + (this.facing === 'up' ? 0.01 : -0.01), sprite, x + offsetX, y - CHARACTER_HEIGHT - 3 + bob);
    }
    // Olta: karakterin önünde, uzun süre sabit durur
    if (this.tool === 'rod' && this.pose === 'fish') {
      const side = this.facing === 'left' ? 'left' : 'right';
      const [dx, dy] = ROD_OFFSETS[side];
      const lift = this.animTime % 2.6 > 2.3 ? -1 : 0; // ara sıra oltayı kaldırıp indirir
      queue.addImage(this.sortY + 0.01, getHeldToolSprite('rod', side === 'left', this.hasSturdyTool), x + dx, y + dy + lift);
    }
    // Çoban değneği: yere dayalı, dik tutulur; elinin olduğu yanda, gövdenin önünde görünür
    else if (this.tool && this.pose === 'tend') {
      const sprite = getHeldToolSprite(this.tool, this.facing === 'left', false);
      const dx = this.facing === 'left' ? -8 : 3;
      queue.addImage(this.sortY + 0.01, sprite, x + dx, y - sprite.height + 1);
    }
    // Alet: yukarı bakarken karakterin arkasında, diğer yönlerde önünde
    else if (this.tool && this.pose === 'work') {
      const raised = Math.floor(this.animTime / SWING_SECONDS) % 2 === 0;
      const [dx, dy] = TOOL_OFFSETS[this.facing][raised ? 0 : 1];
      const order = this.facing === 'up' ? -0.01 : 0.01;
      queue.addImage(this.sortY + order, getHeldToolSprite(this.tool, this.facing === 'left', this.hasSturdyTool), x + dx, y + dy);
    }
    // Taşınan yük başın üstünde
    if (this.carrying) {
      const bob = this.pose === 'walk' && Math.floor(this.animTime / 0.16) % 2 === 0 ? 1 : 0;
      queue.addImage(this.sortY + 0.02, getCarrySprite(this.carrying.resource), x - 4, y - this.spriteHeight - 3 + bob);
    }
  }

  /** Sağlam Alet kuşanmışsa çalışırken elindeki alet parlak çeliktir. */
  get hasSturdyTool() {
    return this.equipment.tool === 'sturdyTool';
  }

  /** Dünya katmanında, gece örtüsünün altında çizilen efektler: kazma tozu, olta ipi. */
  drawEffects(renderer, time) {
    if (!this.visible || this.waypoints) return;
    if (this.workEffect === 'dust' && this.pose === 'work') this.drawWorkDust(renderer);
    if (this.tool === 'rod' && this.pose === 'fish') this.drawFishingLine(renderer, time);
  }

  /**
   * Kazma her indiğinde vurulan noktadan toz kalkar ve birkaç taş kıymığı fırlar. Nokta karakterin
   * baktığı yöne göre aletin ucudur; böylece efekt her zaman çalışanla aynı yerde ve aynı ritimde.
   */
  drawWorkDust(renderer) {
    const [ox, oy] = DUST_OFFSETS[this.facing];
    const period = SWING_SECONDS * 2;
    // Alet inerken (salınımın ikinci yarısı) vuruş olur: t = vuruştan bu yana geçen oran
    const t = ((this.animTime + SWING_SECONDS) % period) / period;
    const cx = Math.round(this.x) + ox;
    const cy = Math.round(this.y) + oy;
    for (let i = 0; i < 4; i++) {
      // Toz bulutu iki yana açılır (yukarı bakarken başın iki yanında görünür)
      const side = i % 2 === 0 ? -1 : 1;
      const spread = side * (3 + t * 6 + (i >> 1) * 2);
      const size = t < 0.35 ? 2 : 3;
      const alpha = (0.85 * (1 - t)).toFixed(2);
      const px = Math.round(cx + spread);
      const py = Math.round(cy - t * 6 - (i >> 1) * 2);
      renderer.fillRect(px, py, size, size, `rgba(233, 214, 170, ${alpha})`);
      renderer.fillRect(px, py + size, size, 1, `rgba(150, 128, 96, ${(0.5 * (1 - t)).toFixed(2)})`);
    }
    if (t < 0.5) {
      const k = t / 0.5;
      for (const dir of [-1, 1]) {
        const px = Math.round(cx + dir * (2 + k * 6));
        const py = Math.round(cy - Math.sin(k * Math.PI) * 5 + k * 3);
        renderer.fillRect(px, py, 1, 1, dir < 0 ? '#b9bcc6' : '#8b8f9c');
      }
    }
  }

  /** Balıkçının olta ipi ve şamandırası. */
  drawFishingLine(renderer, time) {
    const side = this.facing === 'left' ? 'left' : 'right';
    const dir = side === 'left' ? -1 : 1;
    const tip = ROD_TIP[side];
    const startX = Math.round(this.x + tip.x);
    const startY = Math.round(this.y + tip.y);
    const bob = Math.sin(time * 2.2 + this.id) > 0.55 ? 1 : 0;
    const endX = Math.round(this.x + tip.x + dir * BOBBER_DISTANCE);
    const endY = Math.round(this.y + 1) + bob;

    // İp: uçtan şamandıraya sarkan hafif bir yay (her adımda bir piksel)
    const steps = Math.abs(endX - startX);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sag = Math.sin(t * Math.PI) * 4 * (1 - t * 0.3);
      renderer.fillRect(startX + dir * i, Math.round(startY + (endY - startY) * t * t + sag * (1 - t)), 1, 1, LINE_COLOR);
    }
    // Şamandıra ve çevresindeki halka
    renderer.fillRect(endX, endY - 1, 2, 1, '#ffffff');
    renderer.fillRect(endX, endY, 2, 1, '#e8463c');
    const ring = (time * 0.9 + this.id * 0.37) % 1;
    if (ring < 0.7) {
      const r = 2 + Math.floor(ring * 5);
      const alpha = (0.7 - ring).toFixed(2);
      renderer.fillRect(endX - r, endY + 1, r * 2 + 2, 1, `rgba(238, 251, 255, ${alpha})`);
    }
  }

  /** Başın üstündeki ifade balonu (her şeyin üstünde çizilir). */
  drawOverlay(renderer) {
    if (!this.visible || !this.bubble) return;
    const pop = this.bubble.time < BUBBLE_POP_TIME ? 2 : 0;
    const top = Math.round(this.y) - this.spriteHeight + (this.pose === 'sit' ? 2 : 0) - (this.carrying ? 5 : 0);
    renderer.drawImage(
      getBubbleSprite(this.bubble.icon),
      Math.round(this.x) - Math.floor(BUBBLE_WIDTH / 2) + 3,
      top - BUBBLE_HEIGHT + 3 + pop
    );
  }

  /**
   * Kayıt için veri. Görev ve yol kaydedilmez (yapay zekâ yüklemeden sonra yeniden karar verir);
   * konum, ihtiyaçlar, kim olduğu, evde mi olduğu, sırtındaki yük, oturuyor olması, aile bağları,
   * çocukluk süresi ve kuşandığı ekipman saklanır.
   */
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      age: this.age,
      traits: this.traits,
      appearance: this.appearance,
      needs: this.needs,
      homeId: this.homeId,
      facing: this.facing,
      insideBuildingId: this.insideBuildingId,
      carrying: this.carrying,
      newcomer: this.newcomer,
      sitting: this.pose === 'sit',
      activityLabel: this.activityLabel,
      buffs: this.buffs,
      skills: this.skills,
      growsUpAt: this.growsUpAt,
      parentIds: this.parentIds,
      partnerId: this.partnerId,
      married: this.married,
      partnerSince: this.partnerSince,
      marriedAt: this.marriedAt,
      lastChildAt: this.lastChildAt,
      relocating: this.relocating,
      equipment: this.equipment,
      illness: this.illness,
      exposure: this.exposure,
      away: this.away,
      schooling: this.schooling,
      schoolDay: this.schoolDay,
      schoolToday: this.schoolToday,
      educated: this.educated,
      workplaceId: this.workplaceId,
      customName: this.customName,
    };
  }

  static fromJSON(data) {
    const c = new Character(data);
    if (data.facing) c.facing = data.facing;
    c.carrying = data.carrying ?? null;
    c.newcomer = Boolean(data.newcomer);
    if (data.insideBuildingId) {
      c.insideBuildingId = data.insideBuildingId;
      c.visible = false;
      c.pose = 'hidden';
    } else if (data.sitting) {
      c.pose = 'sit';
    }
    if (data.activityLabel) c.activityLabel = data.activityLabel;
    c.buffs = { ...(data.buffs ?? {}) };
    c.skills = { ...(data.skills ?? {}) };
    // Sefere yola çıkmışken kaydedildiyse yüklenince doğrudan seferde sayılır (görünmez)
    if (c.away) {
      c.away.stage = 'away';
      c.visible = false;
      c.pose = 'hidden';
      c.insideBuildingId = null;
    }
    return c;
  }
}
