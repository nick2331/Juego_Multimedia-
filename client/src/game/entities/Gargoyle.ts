import {
  Scene, MeshBuilder, StandardMaterial, PBRMaterial,
  Color3, Vector3, Mesh, TransformNode,
} from "@babylonjs/core";
import type { Player } from "./Player";

export type EnemyState = "idle" | "patrol" | "chase" | "attack" | "dead";

export class Gargoyle {
  private root:   TransformNode;
  private _state: EnemyState = "idle";
  private _scene: Scene;
  private _player: Player;

  private speed       = 2.5;
  private chaseSpeed  = 4.5;
  private health      = 150;
  private attackDmg   = 40;
  private attackCd    = 2.2;
  private attackTimer = 0;
  private sightRange  = 16;
  private attackRange = 2.2;
  private _patrolTarget: Vector3;
  private _idleTimer  = 0;
  private _walkTime   = 0;
  private _roarTimer  = 0;
  private _limbs: Mesh[] = [];

  onDied?: () => void;

  constructor(scene: Scene, player: Player, position: Vector3) {
    this._scene  = scene;
    this._player = player;

    this.root = new TransformNode("gargoyle_root", scene);
    this.root.position = position.clone();
    this.root.position.y = 0.1;

    this._buildMesh();
    this._patrolTarget = this._randomNearby();
  }

  private _buildMesh(): void {
    const stoneMat = new StandardMaterial("gargoyleStone", this._scene);
    stoneMat.diffuseColor  = new Color3(0.42, 0.38, 0.35);
    stoneMat.emissiveColor = new Color3(0.04, 0.03, 0.02);
    stoneMat.specularColor = new Color3(0.15, 0.14, 0.12);

    const darkMat = new StandardMaterial("gargoyleDark", this._scene);
    darkMat.diffuseColor  = new Color3(0.28, 0.25, 0.23);
    darkMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const eyeMat = new StandardMaterial("gargoyleEye", this._scene);
    eyeMat.emissiveColor   = new Color3(1, 0.2, 0);
    eyeMat.disableLighting = true;

    // Head (large, brutish)
    const head = MeshBuilder.CreateBox("gargoyleHead",
      { width: 0.65, height: 0.58, depth: 0.55 }, this._scene);
    head.parent   = this.root;
    head.position = new Vector3(0, 1.9, 0.06);
    head.material = stoneMat;

    // Horns
    for (let i = 0; i < 2; i++) {
      const horn = MeshBuilder.CreateCylinder("gargoyleHorn" + i,
        { diameterTop: 0.02, diameterBottom: 0.1, height: 0.4, tessellation: 5 }, this._scene);
      horn.parent    = head;
      horn.position  = new Vector3(i === 0 ? -0.2 : 0.2, 0.36, 0);
      horn.rotation.z = i === 0 ? -0.3 : 0.3;
      horn.material  = darkMat;
    }

    // Eyes (sunken, glowing)
    for (let i = 0; i < 2; i++) {
      const eye = MeshBuilder.CreateSphere("gargoyleEye" + i, { diameter: 0.1 }, this._scene);
      eye.parent   = head;
      eye.position = new Vector3(i === 0 ? -0.16 : 0.16, 0.04, 0.27);
      eye.material = eyeMat;
    }

    // Jaw (slightly protruding lower)
    const jaw = MeshBuilder.CreateBox("gargoyleJaw",
      { width: 0.5, height: 0.22, depth: 0.38 }, this._scene);
    jaw.parent   = head;
    jaw.position = new Vector3(0, -0.3, 0.06);
    jaw.material = stoneMat;

    // Neck
    const neck = MeshBuilder.CreateCylinder("gargoyleNeck",
      { diameter: 0.3, height: 0.24, tessellation: 8 }, this._scene);
    neck.parent   = this.root;
    neck.position = new Vector3(0, 1.65, 0);
    neck.material = stoneMat;

    // Torso (wide, hunched forward)
    const torso = MeshBuilder.CreateBox("gargoyleTorso",
      { width: 0.9, height: 0.85, depth: 0.65 }, this._scene);
    torso.parent   = this.root;
    torso.position = new Vector3(0, 1.15, 0);
    torso.rotation.x = 0.22;
    torso.material = stoneMat;

    // Hips
    const hips = MeshBuilder.CreateBox("gargoyleHips",
      { width: 0.75, height: 0.42, depth: 0.55 }, this._scene);
    hips.parent   = this.root;
    hips.position = new Vector3(0, 0.7, 0);
    hips.material = stoneMat;

    // Folded wings (vestigial, stone-like)
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;
      const wing = MeshBuilder.CreateBox("gargoyleWing" + i,
        { width: 0.12, height: 0.9, depth: 0.6 }, this._scene);
      wing.parent    = this.root;
      wing.position  = new Vector3(sx * 0.56, 1.1, -0.18);
      wing.rotation.z = sx * 0.25;
      wing.rotation.x = -0.3;
      wing.material  = darkMat;
    }

    // Legs (thick, short)
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;

      const thigh = MeshBuilder.CreateCylinder("gargoyleThigh" + i,
        { diameter: 0.24, height: 0.55, tessellation: 8 }, this._scene);
      thigh.parent   = this.root;
      thigh.position = new Vector3(sx * 0.24, 0.4, 0);
      thigh.rotation.x = 0.15;
      thigh.material = stoneMat;

      const shin = MeshBuilder.CreateCylinder("gargoyleShin" + i,
        { diameter: 0.18, height: 0.5, tessellation: 8 }, this._scene);
      shin.parent   = this.root;
      shin.position = new Vector3(sx * 0.26, 0.08, 0.06);
      shin.rotation.x = -0.2;
      shin.material = stoneMat;

      this._limbs.push(thigh, shin);
    }

    // Arms (thick, clawed - just boxes for simplicity)
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;

      const upper = MeshBuilder.CreateCylinder("gargoyleArmU" + i,
        { diameter: 0.2, height: 0.6, tessellation: 8 }, this._scene);
      upper.parent   = this.root;
      upper.position = new Vector3(sx * 0.6, 1.1, 0.1);
      upper.rotation.z = sx * 0.8;
      upper.rotation.x = 0.3;
      upper.material = stoneMat;

      const lower = MeshBuilder.CreateCylinder("gargoyleArmL" + i,
        { diameter: 0.16, height: 0.55, tessellation: 8 }, this._scene);
      lower.parent   = this.root;
      lower.position = new Vector3(sx * 0.85, 0.72, 0.28);
      lower.rotation.z = sx * 0.55;
      lower.rotation.x = 0.5;
      lower.material = stoneMat;

      this._limbs.push(upper, lower);
    }
  }

  update(dt: number): void {
    if (this._state === "dead") return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this._roarTimer  = Math.max(0, this._roarTimer - dt);
    this._updateState(dt);
    this._animateWalk(dt);
  }

  private _animateWalk(dt: number): void {
    const moving = this._state === "chase" || this._state === "patrol";
    if (!moving) {
      // Slight breathing
      this._walkTime += dt * 1.2;
      this.root.position.y = 0.1 + Math.sin(this._walkTime) * 0.02;
      return;
    }
    this._walkTime += dt * (this._state === "chase" ? 5 : 3);
    this._limbs.forEach((limb, i) => {
      const phase = (i % 2) * Math.PI;
      limb.rotation.x += Math.sin(this._walkTime + phase) * 0.008;
    });
    this.root.position.y = 0.1 + Math.abs(Math.sin(this._walkTime * 0.5)) * 0.05;
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
        if (dTarget < 0.8) {
          this._state = "idle";
          this._idleTimer = 3 + Math.random() * 4;
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
        if (dist > this.sightRange * 1.8)   { this._state = "patrol"; this._patrolTarget = this._randomNearby(); break; }
        const d2 = this._player.position.subtract(this.root.position);
        d2.y = 0; d2.normalize();
        this.root.position.addInPlace(d2.scale(this.chaseSpeed * dt));
        this._facePlayer();
        break;
      }

      case "attack":
        if (dist > this.attackRange * 1.4) { this._state = "chase"; break; }
        this._facePlayer();
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCd;
          this._player.takeDamage(this.attackDmg);
          // Heavy slam - pushes player back
          const knock = this._player.position.subtract(this.root.position).normalize().scale(1.5);
          this._player.camera.position.addInPlace(knock);
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
    const r = 6 + Math.random() * 8;
    const a = Math.random() * Math.PI * 2;
    return this.root.position.add(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }

  dispose(): void { if (!this.root.isDisposed()) this.root.dispose(); }

  get position(): Vector3 { return this.root.position; }
  get state():    EnemyState { return this._state; }
}
