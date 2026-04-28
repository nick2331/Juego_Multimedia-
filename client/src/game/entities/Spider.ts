import {
  Scene, MeshBuilder, StandardMaterial, Color3, Vector3,
  Mesh, AbstractMesh, ActionManager,
} from "@babylonjs/core";
import type { Player } from "./Player";

export type SpiderState = "idle" | "patrol" | "chase" | "attack" | "dead";

export class Spider {
  private mesh:  Mesh;
  private _state: SpiderState = "idle";
  private _scene: Scene;
  private _player: Player;

  private speed      = 4;
  private chaseSpeed = 7;
  private health     = 60;
  private attackDmg  = 15;
  private attackCd   = 1.5;
  private attackTimer = 0;
  private sightRange  = 18;
  private attackRange = 1.8;

  private _patrolTarget: Vector3;
  private _idleTimer = 0;

  onDied?: () => void;

  constructor(scene: Scene, player: Player, position: Vector3) {
    this._scene  = scene;
    this._player = player;

    // Simple box mesh — replace with actual 3D model when available
    this.mesh = MeshBuilder.CreateBox("spider", { width: 1, height: 0.5, depth: 1.4 }, scene);
    this.mesh.position = position.clone();
    this.mesh.position.y = 0.25;
    this.mesh.checkCollisions = true;

    const mat = new StandardMaterial("spiderMat", scene);
    mat.diffuseColor = new Color3(0.08, 0.05, 0.05);
    mat.specularColor = new Color3(0.2, 0.05, 0.05);
    this.mesh.material = mat;

    // Legs (visual only)
    for (let i = 0; i < 4; i++) {
      const leg = MeshBuilder.CreateCylinder("leg"+i, { diameter: 0.06, height: 0.8 }, scene);
      leg.parent = this.mesh;
      const side = i < 2 ? 1 : -1;
      const fwd  = i % 2 === 0 ? 0.4 : -0.4;
      leg.position = new Vector3(side * 0.6, 0.1, fwd);
      leg.rotation.z = (side * Math.PI) / 4;
      leg.material   = mat;
    }

    this._patrolTarget = this._randomNearby();
  }

  // ── Per-frame ─────────────────────────────────────────────────
  update(dt: number): void {
    if (this._state === "dead") return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this._updateState(dt);
    this._faceMovement(dt);
  }

  private _updateState(dt: number): void {
    const distToPlayer = Vector3.Distance(this.mesh.position, this._player.position);

    switch (this._state) {
      case "idle":
        this._idleTimer -= dt;
        if (distToPlayer <= this.sightRange) { this._state = "chase"; break; }
        if (this._idleTimer <= 0) this._state = "patrol";
        break;

      case "patrol": {
        const distTarget = Vector3.Distance(this.mesh.position, this._patrolTarget);
        if (distTarget < 0.5) { this._state = "idle"; this._idleTimer = 2 + Math.random() * 3; break; }
        if (distToPlayer <= this.sightRange) { this._state = "chase"; break; }
        const dir = this._patrolTarget.subtract(this.mesh.position);
        dir.y = 0; dir.normalize();
        this.mesh.position.addInPlace(dir.scale(this.speed * dt));
        break;
      }

      case "chase":
        if (distToPlayer <= this.attackRange) { this._state = "attack"; break; }
        if (distToPlayer > this.sightRange * 1.5) { this._state = "patrol"; this._patrolTarget = this._randomNearby(); break; }
        const dir = this._player.position.subtract(this.mesh.position);
        dir.y = 0; dir.normalize();
        this.mesh.position.addInPlace(dir.scale(this.chaseSpeed * dt));
        break;

      case "attack":
        if (distToPlayer > this.attackRange * 1.3) { this._state = "chase"; break; }
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCd;
          this._player.takeDamage(this.attackDmg);
          this._bounceBack();
        }
        break;
    }
  }

  private _faceMovement(_dt: number): void {
    if (this._state === "chase" || this._state === "attack") {
      const dir = this._player.position.subtract(this.mesh.position);
      dir.y = 0;
      if (dir.length() > 0.01) {
        this.mesh.lookAt(this.mesh.position.add(dir));
      }
    }
  }

  private _bounceBack(): void {
    const away = this.mesh.position.subtract(this._player.position).normalize();
    this.mesh.position.addInPlace(away.scale(0.5));
  }

  takeDamage(amount: number): void {
    if (this._state === "dead") return;
    this.health -= amount;
    if (this.health <= 0) this._die();
    else if (this._state !== "chase") this._state = "chase";
  }

  dropFromCeiling(targetPos: Vector3): void {
    this.mesh.position = targetPos.add(new Vector3(0, 4, 0));
    this._state = "chase";
  }

  private _die(): void {
    this._state = "dead";
    this.mesh.dispose();
    this.onDied?.();
  }

  private _randomNearby(): Vector3 {
    const r = 8 + Math.random() * 10;
    const a = Math.random() * Math.PI * 2;
    return this.mesh.position.add(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }

  dispose(): void { if (!this.mesh.isDisposed()) this.mesh.dispose(); }

  get position(): Vector3 { return this.mesh.position; }
  get state():    SpiderState { return this._state; }
}
