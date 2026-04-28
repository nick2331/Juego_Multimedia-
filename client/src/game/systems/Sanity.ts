import { Scene, Vector3 } from "@babylonjs/core";
import type { Player } from "../entities/Player";
import type { HUD } from "../ui/HUD";

export class Sanity {
  private value = 100;
  private regenTimer = 0;
  private halluTimer = 0;

  readonly lossInDark    = 2;
  readonly lossNearEnemy = 18;
  readonly regenRate     = 4;
  readonly regenDelay    = 5;
  readonly lowThreshold  = 40;
  readonly enemyRadius   = 12;

  private _scene: Scene;
  private _player: Player;
  private _hud: HUD;
  private _interval: ReturnType<typeof setInterval> | null = null;

  onLow?: (isLow: boolean) => void;
  onSanityChanged?: (pct: number) => void;

  constructor(scene: Scene, player: Player, hud: HUD) {
    this._scene  = scene;
    this._player = player;
    this._hud    = hud;
  }

  update(dt: number): void {
    let losing = false;

    if (!this._player.flashlight.isFlashlightOn) {
      this._lose(this.lossInDark * dt);
      losing = true;
    }

    if (this._enemyNearby()) {
      this._lose(this.lossNearEnemy * dt);
      losing = true;
    }

    if (!losing) {
      this.regenTimer += dt;
      if (this.regenTimer >= this.regenDelay) {
        this.value = Math.min(100, this.value + this.regenRate * dt);
        this._hud.updateSanity(this.value / 100);
        this._updateVignette();
      }
    } else {
      this.regenTimer = 0;
    }

    if (this.value < this.lowThreshold) {
      this.halluTimer += dt;
      this.onLow?.(true);
    } else {
      this.onLow?.(false);
    }
  }

  private _lose(amount: number): void {
    this.regenTimer = 0;
    this.value = Math.max(0, this.value - amount);
    this._hud.updateSanity(this.value / 100);
    this.onSanityChanged?.(this.value / 100);
    this._updateVignette();
    if (this.value <= 0) this._player.takeDamage(999);
  }

  restore(amount: number): void {
    this.value = Math.min(100, this.value + amount);
    this._hud.updateSanity(this.value / 100);
    this._updateVignette();
  }

  private _enemyNearby(): boolean {
    const enemies = this._scene.meshes.filter(m => m.name.startsWith("spider"));
    return enemies.some(e =>
      Vector3.Distance(this._player.position, e.position) <= this.enemyRadius,
    );
  }

  private _updateVignette(): void {
    const pct   = this.value / 100;
    const alpha = Math.max(0, Math.min(0.85, (1 - pct) * 1.4 - 0.2));
    const el = document.getElementById("vignette");
    if (el) el.style.opacity = String(alpha);
  }

  get percent(): number { return this.value / 100; }

  dispose(): void {
    if (this._interval) clearInterval(this._interval);
  }
}
