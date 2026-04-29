import { Scene, Vector3 } from "@babylonjs/core";
import { Spider } from "../entities/Spider";
import { Shadow } from "../entities/Shadow";
import { Bat }    from "../entities/Bat";
import { Gargoyle } from "../entities/Gargoyle";
import type { Player } from "../entities/Player";
import type { PhobiaLevel } from "../Game";

type AnyEnemy = Spider | Shadow | Bat | Gargoyle;

const LEVEL_CONFIG: Record<PhobiaLevel, { max: number; interval: number; ceiling: number }> = {
  arachnophobia:  { max: 5, interval: 12, ceiling: 0.5 },
  claustrophobia: { max: 2, interval: 25, ceiling: 0.2 },
  nyctophobia:    { max: 3, interval: 18, ceiling: 0.3 },
  acrophobia:     { max: 2, interval: 30, ceiling: 0.1 },
};

export class SpawnManager {
  private enemies: AnyEnemy[] = [];
  private timer   = 0;
  private level:  PhobiaLevel;
  private cfg:    typeof LEVEL_CONFIG[PhobiaLevel];

  constructor(
    private scene: Scene,
    private player: Player,
    level: PhobiaLevel,
  ) {
    this.level = level;
    this.cfg   = LEVEL_CONFIG[level];
    this.timer = this.cfg.interval * 0.4;
    // Spawn first enemy immediately for arachnophobia
    if (level === "arachnophobia") this._spawn();
  }

  update(dt: number): void {
    this._clean();
    if (this.enemies.length >= this.cfg.max) { this.timer = 0; return; }
    this.timer += dt;
    if (this.timer >= this.cfg.interval) {
      this.timer = 0;
      this._spawn();
    }
    this.enemies.forEach(e => e.update(dt));
  }

  private _spawn(): void {
    const pos   = this._pickSpawnPos();
    const enemy = this._createEnemy(pos);
    enemy.onDied = () => { this.enemies = this.enemies.filter(e => e !== enemy); };

    if (Math.random() < this.cfg.ceiling) {
      enemy.dropFromCeiling(this.player.position.add(new Vector3(
        (Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4,
      )));
    }

    this.enemies.push(enemy);
  }

  private _createEnemy(pos: Vector3): AnyEnemy {
    switch (this.level) {
      case "arachnophobia":  return new Spider(this.scene, this.player, pos);
      case "claustrophobia": return new Shadow(this.scene, this.player, pos);
      case "nyctophobia":    return new Bat(this.scene, this.player, pos);
      case "acrophobia":     return new Gargoyle(this.scene, this.player, pos);
    }
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
    this.enemies = this.enemies.filter(e => e.state !== "dead");
  }

  getEnemies(): AnyEnemy[] { return this.enemies; }

  dispose(): void {
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];
  }
}
