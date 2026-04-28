import { Scene, SpotLight, Vector3, Color3, UniversalCamera } from "@babylonjs/core";

export class Flashlight {
  private light: SpotLight;
  private battery = 100;
  private isOn    = true;
  private flickering = false;
  private flickerTimer = 0;

  readonly drainRate       = 3;      // % per second
  readonly flickerThreshold = 20;
  drainMultiplier = 1;               // modified by nyctophobia

  onBatteryChanged?: (pct: number) => void;
  onDied?: () => void;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.light = new SpotLight(
      "flashlight",
      Vector3.Zero(),
      new Vector3(0, 0, 1),
      Math.PI / 5,
      12,
      scene,
    );
    this.light.intensity  = 2.5;
    this.light.diffuse    = new Color3(0.95, 0.9, 0.8);
    this.light.range      = 22;
    this.light.shadowEnabled = true;

    // Follow camera each frame
    scene.registerBeforeRender(() => {
      if (!camera) return;
      this.light.position  = camera.position.clone();
      this.light.direction = camera.getDirection(Vector3.Forward());
    });
  }

  update(dt: number): void {
    if (!this.isOn || this.battery <= 0) return;
    this.battery = Math.max(0, this.battery - this.drainRate * this.drainMultiplier * dt);
    this.onBatteryChanged?.(this.battery / 100);
    this.light.intensity = 2.5 * (0.15 + 0.85 * (this.battery / 100));

    if (this.battery <= this.flickerThreshold && !this.flickering) this.flickering = true;
    if (this.flickering) this._doFlicker(dt);
    if (this.battery <= 0) this._kill();
  }

  private _doFlicker(dt: number): void {
    this.flickerTimer += dt;
    if (this.flickerTimer > 0.03 + Math.random() * 0.09) {
      this.flickerTimer = 0;
      this.light.intensity = Math.random() < 0.3 ? 0 : 2.5 * Math.random();
    }
  }

  toggle(): void {
    if (this.battery <= 0) return;
    this.isOn = !this.isOn;
    this.light.setEnabled(this.isOn);
  }

  recharge(amount: number): void {
    this.battery = Math.min(100, this.battery + amount);
    if (this.battery > this.flickerThreshold) { this.flickering = false; }
    if (this.battery > 0 && !this.isOn) { this.isOn = true; this.light.setEnabled(true); }
    this.onBatteryChanged?.(this.battery / 100);
  }

  private _kill(): void {
    this.isOn = false;
    this.flickering = false;
    this.light.setEnabled(false);
    this.onDied?.();
  }

  get isFlashlightOn(): boolean { return this.isOn && this.battery > 0; }
  get batteryPct():     number  { return this.battery / 100; }

  dispose(): void { this.light.dispose(); }
}
