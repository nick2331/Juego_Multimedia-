import { Scene, Vector3 } from "@babylonjs/core";
import { Spider } from "../entities/Spider";
import type { Player } from "../entities/Player";
import type { PhobiaLevel } from "../Game";

const LEVEL_CONFIG: Record<PhobiaLevel, { maxSpiders: number; interval: number; ceiling: number }> = {
  arachnophobia:  { maxSpiders: 5, interval: 12, ceiling: 0.5 },
  claustrophobia: { maxSpiders: 2, interval: 25, ceiling: 0.2 },
  nyctophobia:    { maxSpiders: 3, interval: 18, ceiling: 0.3 },
  acrophobia:     { maxSpiders: 2, interval: 30, ceiling: 0.1 },
};

export class SpawnManager {
  private spiders: Spider[] = [];
  private timer    = 0;
  private cfg: typeof LEVEL_CONFIG[PhobiaLevel];

  constructor(
    private scene: Scene,
    private player: Player,
    level: PhobiaLevel,
  ) {
    this.cfg = LEVEL_CONFIG[level];
    // First spider faster
    this.timer = this.cfg.interval * 0.4;
    // Spawn initial spider immediately for arachnophobia
    if (level === "arachnophobia") this._spawn();
  }

  update(dt: number): void {
    this._clean();
    if (this.spiders.length >= this.cfg.maxSpiders) { this.timer = 0; return; }
    this.timer += dt;
    if (this.timer >= this.cfg.interval) {
      this.timer = 0;
      this._spawn();
    }
    this.spiders.forEach(s => s.update(dt));
  }

  private _spawn(): void {
    const pos = this._pickSpawnPos();
    const spider = new Spider(this._scene, this.player, pos);
    spider.onDied = () => { this.spiders = this.spiders.filter(s => s !== spider); };

    if (Math.random() < this.cfg.ceiling) {
      spider.dropFromCeiling(this.player.position.add(new Vector3(
        (Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4,
      )));
    }

    this.spiders.push(spider);
  }

  private _pickSpawnPos(): Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 12 + Math.random() * 8;
    return new Vector3(
      this.player.position.x + Math.cos(angle) * dist,
      0,
      this.player.position.z + Math.sin(angle) * dist,
    );
  }

  private _clean(): void {
    this.spiders = this.spiders.filter(s => s.state !== "dead");
  }

  getSpiders(): Spider[] { return this.spiders; }

  dispose(): void {
    this.spiders.forEach(s => s.dispose());
    this.spiders = [];
  }
}
