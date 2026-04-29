import {
  Scene, MeshBuilder, StandardMaterial, PBRMaterial,
  Color3, Vector3, Mesh, TransformNode,
} from "@babylonjs/core";
import type { Player } from "./Player";

export type EnemyState = "idle" | "patrol" | "chase" | "attack" | "dead";

export class Shadow {
  private root:   TransformNode;
  private _state: EnemyState = "idle";
  private _scene: Scene;
  private _player: Player;

  private speed       = 5.5;
  private chaseSpeed  = 10;
  private health      = 40;
  private attackDmg   = 22;
  private attackCd    = 1.0;
  private attackTimer = 0;
  private sightRange  = 20;
  private attackRange = 1.6;
  private _patrolTarget: Vector3;
  private _idleTimer  = 0;
  private _floatTime  = 0;
  private _arms: Mesh[] = [];

  onDied?: () => void;

  constructor(scene: Scene, player: Player, position: Vector3) {
    this._scene  = scene;
    this._player = player;

    this.root = new TransformNode("shadow_root", scene);
    this.root.position = position.clone();
    this.root.position.y = 0.1;

    this._buildMesh();
    this._patrolTarget = this._randomNearby();
  }

  private _buildMesh(): void {
    const bodyMat = new StandardMaterial("shadowBody", this._scene);
    bodyMat.diffuseColor  = new Color3(0.04, 0.02, 0.06);
    bodyMat.emissiveColor = new Color3(0.03, 0.01, 0.05);
    bodyMat.specularColor = new Color3(0, 0, 0);

    const eyeMat = new StandardMaterial("shadowEye", this._scene);
    eyeMat.emissiveColor   = new Color3(0.6, 0, 1);
    eyeMat.disableLighting = true;

    // Head
    const head = MeshBuilder.CreateSphere("shadowHead",
      { diameterX: 0.42, diameterY: 0.48, diameterZ: 0.4 }, this._scene);
    head.parent   = this.root;
    head.position = new Vector3(0, 2.0, 0);
    head.material = bodyMat;

    // Glowing eyes
    for (let i = 0; i < 2; i++) {
      const eye = MeshBuilder.CreateSphere("shadowEye" + i, { diameter: 0.07 }, this._scene);
      eye.parent   = head;
      eye.position = new Vector3(i === 0 ? -0.09 : 0.09, 0.04, 0.21);
      eye.material = eyeMat;
    }

    // Neck
    const neck = MeshBuilder.CreateCylinder("shadowNeck",
      { diameter: 0.18, height: 0.3, tessellation: 8 }, this._scene);
    neck.parent   = this.root;
    neck.position = new Vector3(0, 1.72, 0);
    neck.material = bodyMat;

    // Torso (tall, narrow)
    const torso = MeshBuilder.CreateCylinder("shadowTorso",
      { diameterTop: 0.28, diameterBottom: 0.22, height: 1.0, tessellation: 8 }, this._scene);
    torso.parent   = this.root;
    torso.position = new Vector3(0, 1.2, 0);
    torso.material = bodyMat;

    // Hips / lower body tapering to nothing
    const hips = MeshBuilder.CreateCylinder("shadowHips",
      { diameterTop: 0.22, diameterBottom: 0.04, height: 0.9, tessellation: 8 }, this._scene);
    hips.parent   = this.root;
    hips.position = new Vector3(0, 0.55, 0);
    hips.material = bodyMat;

    // Arms (2 long thin limbs)
    const armData = [
      { x: -0.22, rz:  0.5 },
      { x:  0.22, rz: -0.5 },
    ];
    armData.forEach(({ x, rz }, i) => {
      const upper = MeshBuilder.CreateCylinder("shadowArmU" + i,
        { diameter: 0.08, height: 0.75, tessellation: 6 }, this._scene);
      upper.parent    = this.root;
      upper.position  = new Vector3(x, 1.45, 0);
      upper.rotation.z = rz;
      upper.material  = bodyMat;

      const lower = MeshBuilder.CreateCylinder("shadowArmL" + i,
        { diameter: 0.06, height: 0.7, tessellation: 6 }, this._scene);
      lower.parent    = this.root;
      lower.position  = new Vector3(x * 1.6, 0.9, 0.1);
      lower.rotation.z = rz * 0.6;
      lower.rotation.x = 0.4;
      lower.material  = bodyMat;

      this._arms.push(upper, lower);
    });
  }

  update(dt: number): void {
    if (this._state === "dead") return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this._updateState(dt);
    this._animateFloat(dt);
  }

  private _animateFloat(dt: number): void {
    this._floatTime += dt;
    const baseY = 0.1 + Math.sin(this._floatTime * 1.5) * 0.12;
    this.root.position.y = baseY;
    // Arms wave ominously
    this._arms.forEach((arm, i) => {
      const phase = i * Math.PI * 0.5;
      arm.rotation.x = Math.sin(this._floatTime * 1.2 + phase) * 0.18;
    });
  }

  private _updateState(dt: number): void {
    const dist = Vector3.Distance(this.root.position, this._player.position);

    switch (this._state) {
      case "idle":
        this._idleTimer -= dt;
        if (dist <= this.sightRange) { this._state = "chase"; break; }
        if (this._idleTimer <= 0)    { this._state = "patrol"; }
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

      case "chase": {
        if (dist <= this.attackRange)       { this._state = "attack"; break; }
        if (dist > this.sightRange * 1.5)   { this._state = "patrol"; this._patrolTarget = this._randomNearby(); break; }
        const d2 = this._player.position.subtract(this.root.position);
        d2.y = 0; d2.normalize();
        this.root.position.addInPlace(d2.scale(this.chaseSpeed * dt));
        this._facePlayer();
        break;
      }

      case "attack":
        if (dist > this.attackRange * 1.3) { this._state = "chase"; break; }
        this._facePlayer();
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCd;
          this._player.takeDamage(this.attackDmg);
          this._player.sanity.restore(-15);
        }
        break;
    }
  }

  private _facePlayer(): void {
    const dir = this._player.position.subtract(this.root.position);
    dir.y = 0;
    if (dir.length() > 0.01) this.root.lookAt(this.root.position.add(dir));
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
  get state():    EnemyState { return this._state; }
}
