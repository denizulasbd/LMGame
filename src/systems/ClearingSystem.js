// (34.3) Alan açma: ağaç ve kaya olan yere kurulan şantiyenin içi, nesneler toplanana kadar geçilebilir kalır (toplayıcılar iç karolara
// ulaşsın; inşaat işi başlamaz: JobSystem.isSiteClearing). Son nesne toplanınca şantiye karoları kapanır ve inşaat başlayabilir;
// kapanmak için içeride kimsenin durmaması beklenir. Şantiye iptal edilirse işler JobSystem.cancelForBuilding ile düşer.
const REOPEN_MINUTES = 30; // oyun dakikası

export class ClearingSystem {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {import('../world/World.js').World} world
   * @param {import('./JobSystem.js').JobSystem} jobs
   */
  constructor(game, world, jobs) {
    this.world = world;
    this.jobs = jobs;
    this.sinceCheck = 0;
    this.events = game.events;
    this.waiting = new Set(); // alanı açılmış, kapanmayı bekleyen şantiye kimlikleri
    this.unsubscribe = game.events.on('job:completed', ({ job }) => {
      if (job.siteId) this.waiting.add(job.siteId);
    });
  }

  destroy() {
    this.unsubscribe();
  }

  update(tick) {
    // Oyuncu bir toplama işaretini kaldırdıysa şantiye sonsuza dek beklemesin: yarım saatte bir eksik işler yeniden açılır
    this.sinceCheck += tick?.gameMinutes ?? 0;
    if (this.sinceCheck >= REOPEN_MINUTES) {
      this.sinceCheck = 0;
      this.reopen();
    }
    if (this.waiting.size === 0) return;
    for (const id of [...this.waiting]) {
      const building = this.world.getBuilding(id);
      if (!building || !building.underConstruction) {
        this.waiting.delete(id);
        continue;
      }
      if (this.hasHarvestable(building)) continue; // sıradaki nesne hâlâ duruyor
      const { w, h } = building.definition.size;
      const inside = (c) => c.tileX >= building.tileX && c.tileX < building.tileX + w && c.tileY >= building.tileY && c.tileY < building.tileY + h;
      if (this.world.characters.some((c) => c.visible && inside(c))) continue; // içeridekiler çıkana kadar bekle
      for (let y = building.tileY; y < building.tileY + h; y++) {
        for (let x = building.tileX; x < building.tileX + w; x++) this.world.map.setOccupant(x, y, building.id, false);
      }
      this.waiting.delete(id);
      this.world.refreshStaticData();
      this.events.emit('world:blocked', { tiles: this.footprint(building) });
      this.events.emit('site:cleared', { building });
    }
  }

  /** Alan açan her şantiyede, işi olmayan ağaç / kayaya yeniden öncelikli iş açar. */
  reopen() {
    for (const building of this.world.buildings) {
      if (!building.underConstruction) continue;
      const missing = this.footprint(building).filter(({ x, y }) => this.world.hasHarvestable(x, y) && !this.jobs.jobs.some((j) => !j.buildingId && j.x === x && j.y === y));
      if (missing.length > 0) this.jobs.designateSite(building, missing);
    }
  }

  hasHarvestable(building) {
    return this.footprint(building).some(({ x, y }) => this.world.hasHarvestable(x, y));
  }

  footprint(building) {
    const { w, h } = building.definition.size;
    const out = [];
    for (let y = building.tileY; y < building.tileY + h; y++) for (let x = building.tileX; x < building.tileX + w; x++) out.push({ x, y });
    return out;
  }
}
