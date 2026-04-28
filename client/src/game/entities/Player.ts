import {
  Scene, UniversalCamera, Vector3, Ray, PickingInfo,
} from "@babylonjs/core";
import { Flashlight } from "../systems/Flashlight";
import { Sanity } from "../systems/Sanity";
import { Inventory } from "../systems/Inventory";
import type { HUD } from "../ui/HUD";

export class Player {
  readonly camera:     UniversalCamera;
  readonly flashlight: Flashlight;
  readonly sanity:     Sanity;
  readonly inventory:  Inventory;

  onDied?:   () => void;
  onPickup?: (name: string) => void;

  private _health  = 100;
  private _speed   = 7;
  private _scene:  Scene;
  private _hud:    HUD;
  private _keys:   Set<string> = new Set();
  private _dead    = false;
  private _interactCd = 0;

  // Head bob
  private _bobTime    = 0;
  private _bobBase    = 1.72;
  private _isMoving   = false;

  // Screen shake on damage
  private _shakeTimer = 0;
  private _shakeBase  = Vector3.Zero();

  constructor(scene: Scene, canvas: HTMLCanvasElement, hud: HUD) {
    this._scene = scene;
    this._hud   = hud;

    this.camera = new UniversalCamera("cam", new Vector3(0, this._bobBase, -2), scene);
    this.camera.setTarget(new Vector3(0, this._bobBase, 1));
    this.camera.minZ              = 0.08;
    this.camera.fov               = 1.18;
    this.camera.attachControl(canvas, true);
    this.camera.speed             = 0;
    this.camera.angularSensibility = 700;
    this.camera.checkCollisions   = true;
    this.camera.applyGravity      = true;
    this.camera.ellipsoid         = new Vector3(0.4, 0.85, 0.4);
    scene.gravity = new Vector3(0, -22, 0);

    this.flashlight = new Flashlight(scene, this.camera);
    this.sanity     = new Sanity(scene, this, hud);
    this.inventory  = new Inventory(hud);

    this._setupInput(canvas);
    canvas.addEventListener("click", () => canvas.requestPointerLock());

    hud.updateHealth(1);
    hud.updateBattery(1);
    hud.updateSanity(1);
  }

  // ── Per-frame ─────────────────────────────────────────────────
  update(dt: number): void {
    if (this._dead) return;
    this._handleMovement(dt);
    this._updateHeadBob(dt);
    this._updateShake(dt);
    this._updateInteractPrompt();
    this.flashlight.update(dt);
    this.sanity.update(dt);
    this._interactCd = Math.max(0, this._interactCd - dt);
  }

  // ── Head bob ─────────────────────────────────────────────────
  private _updateHeadBob(dt: number): void {
    if (this._isMoving) {
      const isSprinting = this._keys.has("ShiftLeft");
      const freq = isSprinting ? 13 : 9;
      const amp  = isSprinting ? 0.07 : 0.045;
      this._bobTime += dt * freq;
      const bob = Math.sin(this._bobTime) * amp;
      const sway = Math.cos(this._bobTime * 0.5) * amp * 0.4;
      this.camera.position.y = this._bobBase + bob;
      // Slight horizontal sway
      const right = this.camera.getDirection(Vector3.Right());
      right.y = 0; right.normalize().scaleInPlace(sway);
      this.camera.position.addInPlace(right);
    } else {
      this._bobTime = 0;
      this.camera.position.y += (this._bobBase - this.camera.position.y) * dt * 8;
    }
  }

  // ── Screen shake on damage ────────────────────────────────────
  private _updateShake(dt: number): void {
    if (this._shakeTimer <= 0) return;
    this._shakeTimer -= dt;
    const s = this._shakeTimer * 0.04;
    this.camera.position.x += (Math.random() - 0.5) * s;
    this.camera.position.z += (Math.random() - 0.5) * s;
  }

  // ── Health ────────────────────────────────────────────────────
  takeDamage(amount: number): void {
    if (this._dead) return;
    this._health = Math.max(0, this._health - amount);
    this._hud.updateHealth(this._health / 100);
    this._hud.flashBlood();
    this._shakeTimer = 0.35;
    if (this._health <= 0) this._die();
  }

  heal(amount: number): void {
    this._health = Math.min(100, this._health + amount);
    this._hud.updateHealth(this._health / 100);
  }

  get position(): Vector3 { return this.camera.position; }
  get isDead():   boolean  { return this._dead; }

  // ── Input ─────────────────────────────────────────────────────
  private _setupInput(canvas: HTMLCanvasElement): void {
    window.addEventListener("keydown", (e) => {
      this._keys.add(e.code);
      if (e.code === "KeyF") this.flashlight.toggle();
      if (e.code === "KeyE") this._interact();
      if (e.code === "KeyQ") this.inventory.useFirst(this);
    });
    window.addEventListener("keyup", (e) => this._keys.delete(e.code));
    canvas.addEventListener("click", () => canvas.requestPointerLock());
  }

  private _handleMovement(dt: number): void {
    const sprint = this._keys.has("ShiftLeft");
    const speed  = this._speed * (sprint ? 1.65 : 1.0);
    const fwd    = this.camera.getDirection(Vector3.Forward());
    const right  = this.camera.getDirection(Vector3.Right());
    fwd.y   = 0; fwd.normalize();
    right.y = 0; right.normalize();

    let move = Vector3.Zero();
    if (this._keys.has("KeyW") || this._keys.has("ArrowUp"))    move.addInPlace(fwd);
    if (this._keys.has("KeyS") || this._keys.has("ArrowDown"))  move.addInPlace(fwd.negate());
    if (this._keys.has("KeyA") || this._keys.has("ArrowLeft"))  move.addInPlace(right.negate());
    if (this._keys.has("KeyD") || this._keys.has("ArrowRight")) move.addInPlace(right);

    this._isMoving = move.length() > 0;
    if (this._isMoving) {
      move.normalize().scaleInPlace(speed * dt);
      this.camera.position.addInPlace(move);
    }
  }

  // ── Interact ─────────────────────────────────────────────────
  private _updateInteractPrompt(): void {
    const hit = this._castRay();
    if (hit?.pickedMesh?.metadata?.interactable) {
      this._hud.showInteractPrompt(hit.pickedMesh.metadata.promptText ?? "[E] Interactuar");
    } else {
      this._hud.hideInteractPrompt();
    }
  }

  private _interact(): void {
    if (this._interactCd > 0) return;
    const hit = this._castRay();
    if (hit?.pickedMesh?.metadata?.interactable) {
      this._interactCd = 0.4;
      hit.pickedMesh.metadata.onInteract?.(this);
    }
  }

  private _castRay(): PickingInfo | null {
    const ray = new Ray(this.camera.position.clone(), this.camera.getDirection(Vector3.Forward()), 2.5);
    return this._scene.pickWithRay(ray);
  }

  private _die(): void {
    this._dead = true;
    this.onDied?.();
  }

  dispose(): void {
    this.flashlight.dispose();
    this.sanity.dispose();
    this.camera.dispose();
  }
}
