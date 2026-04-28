import {
  Scene, MeshBuilder, StandardMaterial, PBRMaterial,
  Color3, Vector3, Mesh, TransformNode,
} from "@babylonjs/core";
import type { Player } from "./Player";

export type SpiderState = "idle" | "patrol" | "chase" | "attack" | "dead";

export class Spider {
  private root:   TransformNode;
  private _state: SpiderState = "idle";
  private _scene: Scene;
  private _player: Player;

  private speed       = 4;
  private chaseSpeed  = 7.5;
  private health      = 60;
  private attackDmg   = 15;
  private attackCd    = 1.5;
  private attackTimer = 0;
  private sightRange  = 18;
  private attackRange = 1.8;
  private _patrolTarget: Vector3;
  private _idleTimer  = 0;
  private _legTime    = 0;
  private _legs:  Mesh[]  = [];

  onDied?: () => void;

  constructor(scene: Scene, player: Player, position: Vector3) {
    this._scene  = scene;
    this._player = player;

    this.root = new TransformNode("spider_root", scene);
    this.root.position = position.clone();
    this.root.position.y = 0.3;

    this._buildMesh();
    this._patrolTarget = this._randomNearby();
  }

  // ── Build 3D spider mesh ───────────────────────────────────────
  private _buildMesh(): void {
    const bodyMat = new PBRMaterial("spiderBody", this._scene);
    bodyMat.albedoColor = new Color3(0.04, 0.03, 0.03);
    bodyMat.roughness   = 0.7;
    bodyMat.metallic    = 0.3;

    const legMat = new PBRMaterial("spiderLeg", this._scene);
    legMat.albedoColor = new Color3(0.06, 0.04, 0.04);
    legMat.roughness   = 0.8;
    legMat.metallic    = 0.2;

    const eyeMat = new StandardMaterial("spiderEye", this._scene);
    eyeMat.emissiveColor = new Color3(1, 0.05, 0);
    eyeMat.disableLighting = true;

    // Cephalothorax (front)
    const thorax = MeshBuilder.CreateSphere("thorax",
      { diameterX: 0.55, diameterY: 0.38, diameterZ: 0.48 }, this._scene);
    thorax.parent   = this.root;
    thorax.position = new Vector3(0, 0.05, 0.28);
    thorax.material = bodyMat;

    // Abdomen (rear, larger)
    const abdomen = MeshBuilder.CreateSphere("abdomen",
      { diameterX: 0.72, diameterY: 0.55, diameterZ: 0.85 }, this._scene);
    abdomen.parent   = this.root;
    abdomen.position = new Vector3(0, 0.08, -0.38);
    abdomen.material = bodyMat;

    // 8 eyes (2 rows of 4)
    for (let i = 0; i < 8; i++) {
      const eye = MeshBuilder.CreateSphere("eye" + i, { diameter: 0.055 }, this._scene);
      eye.parent   = thorax;
      const row    = Math.floor(i / 4);
      const col    = i % 4;
      eye.position = new Vector3((col - 1.5) * 0.1, 0.12 - row * 0.09, 0.28);
      eye.material = eyeMat;
    }

    // 8 legs (4 per side)
    const legAngles = [0.3, 0.6, 0.9, 1.2]; // from front to back
    for (let side = 0; side < 2; side++) {
      const sx = side === 0 ? 1 : -1;
      for (let li = 0; li < 4; li++) {
        const legRoot = new TransformNode("legRoot" + side + li, this._scene);
        legRoot.parent   = this.root;
        legRoot.position = new Vector3(sx * 0.2, 0, 0.3 - li * 0.22);

        // Upper segment
        const upper = MeshBuilder.CreateCylinder("upper" + side + li,
          { diameter: 0.065, height: 0.55, tessellation: 6 }, this._scene);
        upper.parent    = legRoot;
        upper.position  = new Vector3(sx * 0.28, 0, 0);
        upper.rotation.z = sx * (0.6 + legAngles[li] * 0.15);
        upper.rotation.x = -0.2;
        upper.material  = legMat;

        // Lower segment (longer)
        const lower = MeshBuilder.CreateCylinder("lower" + side + li,
          { diameter: 0.045, height: 0.65, tessellation: 6 }, this._scene);
        lower.parent    = upper;
        lower.position  = new Vector3(sx * 0.2, -0.5, 0.1);
        lower.rotation.z = sx * 0.4;
        lower.rotation.x = 0.8;
        lower.material  = legMat;

        this._legs.push(upper, lower);
      }
    }
  }

  // ── Per-frame ─────────────────────────────────────────────────
  update(dt: number): void {
    if (this._state === "dead") return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this._updateState(dt);
    this._animateLegs(dt);
  }

  private _animateLegs(dt: number): void {
    const moving = this._state === "chase" || this._state === "patrol";
    if (!moving) return;
    this._legTime += dt * (this._state === "chase" ? 12 : 7);
    this._legs.forEach((leg, i) => {
      const phase = (i % 2) * Math.PI;
      leg.rotation.x = Math.sin(this._legTime + phase) * 0.25;
    });
    // Body bob
    this.root.position.y = 0.3 + Math.abs(Math.sin(this._legTime * 0.5)) * 0.06;
  }

  private _updateState(dt: number): void {
    const dist = Vector3.Distance(this.root.position, this._player.position);

    switch (this._state) {
      case "idle":
        this._idleTimer -= dt;
        if (dist <= this.sightRange) { this._state = "chase"; break; }
        if (this._idleTimer <= 0)     this._state = "patrol";
        break;

      case "patrol": {
        const dTarget = Vector3.Distance(this.root.position, this._patrolTarget);
        if (dTarget < 0.5) {
          this._state = "idle";
          this._idleTimer = 2 + Math.random() * 3;
          break;
        }
        if (dist <= this.sightRange) { this._state = "chase"; break; }
        const dir = this._patrolTarget.subtract(this.root.position);
        dir.y = 0; dir.normalize();
        this.root.position.addInPlace(dir.scale(this.speed * dt));
        break;
      }

      case "chase":
        if (dist <= this.attackRange)         { this._state = "attack"; break; }
        if (dist > this.sightRange * 1.5)     { this._state = "patrol"; this._patrolTarget = this._randomNearby(); break; }
        const d2 = this._player.position.subtract(this.root.position);
        d2.y = 0; d2.normalize();
        this.root.position.addInPlace(d2.scale(this.chaseSpeed * dt));
        this._facePlayer();
        break;

      case "attack":
        if (dist > this.attackRange * 1.3) { this._state = "chase"; break; }
        this._facePlayer();
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCd;
          this._player.takeDamage(this.attackDmg);
          // Lunge toward player
          const lunge = this._player.position.subtract(this.root.position).normalize().scale(0.3);
          this.root.position.addInPlace(lunge);
        }
        break;
    }
  }

  private _facePlayer(): void {
    const dir = this._player.position.subtract(this.root.position);
    dir.y = 0;
    if (dir.length() > 0.01) {
      this.root.lookAt(this.root.position.add(dir));
    }
  }

  takeDamage(amount: number): void {
    if (this._state === "dead") return;
    this.health -= amount;
    if (this.health <= 0) this._die();
    else this._state = "chase";
  }

  dropFromCeiling(targetPos: Vector3): void {
    this.root.position = targetPos.add(new Vector3(
      (Math.random() - 0.5) * 2, 4, (Math.random() - 0.5) * 2,
    ));
    this._state = "chase";
  }

  private _die(): void {
    this._state = "dead";
    this.root.dispose();
    this.onDied?.();
  }

  private _randomNearby(): Vector3 {
    const r = 8 + Math.random() * 10;
    const a = Math.random() * Math.PI * 2;
    return this.root.position.add(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }

  dispose(): void { if (!this.root.isDisposed()) this.root.dispose(); }

  get position(): Vector3 { return this.root.position; }
  get state():    SpiderState { return this._state; }
}
