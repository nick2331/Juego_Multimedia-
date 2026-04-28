import {
  Scene, UniversalCamera, Vector3, MeshBuilder, StandardMaterial,
  Color3, SpotLight, Ray, PickingInfo, ActionManager, ExecuteCodeAction,
  KeyboardEventTypes,
} from "@babylonjs/core";
import { Flashlight } from "../systems/Flashlight";
import { Sanity } from "../systems/Sanity";
import { Inventory } from "../systems/Inventory";
import type { HUD } from "../ui/HUD";

export class Player {
  readonly camera:    UniversalCamera;
  readonly flashlight:Flashlight;
  readonly sanity:    Sanity;
  readonly inventory: Inventory;

  onDied?:   () => void;
  onPickup?: (name: string) => void;

  private _health = 100;
  private _speed  = 8;
  private _scene: Scene;
  private _hud: HUD;
  private _keys: Set<string> = new Set();
  private _dead = false;
  private _interactCooldown = 0;

  constructor(scene: Scene, canvas: HTMLCanvasElement, hud: HUD) {
    this._scene = scene;
    this._hud   = hud;

    // FPS Camera
    this.camera = new UniversalCamera("cam", new Vector3(0, 1.7, 0), scene);
    this.camera.setTarget(new Vector3(0, 1.7, 1));
    this.camera.minZ = 0.1;
    this.camera.fov  = 1.2;
    this.camera.attachControl(canvas, true);
    this.camera.speed = 0;           // manual movement
    this.camera.angularSensibility = 800;
    this.camera.checkCollisions = true;
    this.camera.applyGravity    = true;
    this.camera.ellipsoid       = new Vector3(0.5, 0.9, 0.5);
    scene.gravity = new Vector3(0, -20, 0);

    // Flashlight attached to camera
    this.flashlight = new Flashlight(scene, this.camera);

    // Systems
    this.sanity    = new Sanity(scene, this, hud);
    this.inventory = new Inventory(hud);

    // Input
    this._setupInput(canvas);

    // Pointer lock on click
    canvas.addEventListener("click", () => canvas.requestPointerLock());

    hud.updateHealth(1);
    hud.updateBattery(1);
    hud.updateSanity(1);
  }

  // ── Per-frame ─────────────────────────────────────────────────
  update(dt: number): void {
    if (this._dead) return;
    this._handleMovement(dt);
    this._updateInteractPrompt();
    this.flashlight.update(dt);
    this.sanity.update(dt);
    this._interactCooldown = Math.max(0, this._interactCooldown - dt);
  }

  // ── Health ────────────────────────────────────────────────────
  takeDamage(amount: number): void {
    if (this._dead) return;
    this._health = Math.max(0, this._health - amount);
    this._hud.updateHealth(this._health / 100);
    this._hud.flashBlood();
    if (this._health <= 0) this._die();
  }

  heal(amount: number): void {
    this._health = Math.min(100, this._health + amount);
    this._hud.updateHealth(this._health / 100);
  }

  get position(): Vector3 { return this.camera.position; }
  get isDead(): boolean   { return this._dead; }

  // ── Input ─────────────────────────────────────────────────────
  private _setupInput(canvas: HTMLCanvasElement): void {
    window.addEventListener("keydown", (e) => {
      this._keys.add(e.code);
      if (e.code === "KeyF") this.flashlight.toggle();
      if (e.code === "KeyE") this._interact();
      if (e.code === "KeyQ") this._useItem();
    });
    window.addEventListener("keyup", (e) => this._keys.delete(e.code));
  }

  private _handleMovement(dt: number): void {
    const speed = this._speed * (this._keys.has("ShiftLeft") ? 1.6 : 1.0);
    const fwd   = this.camera.getDirection(Vector3.Forward());
    const right = this.camera.getDirection(Vector3.Right());
    fwd.y   = 0; fwd.normalize();
    right.y = 0; right.normalize();

    let move = Vector3.Zero();
    if (this._keys.has("KeyW") || this._keys.has("ArrowUp"))    move.addInPlace(fwd);
    if (this._keys.has("KeyS") || this._keys.has("ArrowDown"))  move.addInPlace(fwd.scale(-1));
    if (this._keys.has("KeyA") || this._keys.has("ArrowLeft"))  move.addInPlace(right.scale(-1));
    if (this._keys.has("KeyD") || this._keys.has("ArrowRight")) move.addInPlace(right);

    if (move.length() > 0) {
      move.normalize().scaleInPlace(speed * dt);
      this.camera.position.addInPlace(move);
    }
  }

  // ── Interact (raycast) ────────────────────────────────────────
  private _updateInteractPrompt(): void {
    const hit = this._castInteractRay();
    if (hit?.pickedMesh?.metadata?.interactable) {
      const label = hit.pickedMesh.metadata.promptText ?? "[E] Interactuar";
      this._hud.showInteractPrompt(label);
    } else {
      this._hud.hideInteractPrompt();
    }
  }

  private _interact(): void {
    if (this._interactCooldown > 0) return;
    const hit = this._castInteractRay();
    if (hit?.pickedMesh?.metadata?.interactable) {
      this._interactCooldown = 0.4;
      hit.pickedMesh.metadata.onInteract?.(this);
    }
  }

  private _castInteractRay(): PickingInfo | null {
    const origin = this.camera.position.clone();
    const dir    = this.camera.getDirection(Vector3.Forward());
    const ray    = new Ray(origin, dir, 2.5);
    return this._scene.pickWithRay(ray);
  }

  private _useItem(): void {
    this.inventory.useFirst(this);
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
