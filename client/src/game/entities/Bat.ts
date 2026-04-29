import {
  Scene, MeshBuilder, StandardMaterial, PBRMaterial,
  Color3, Vector3, Mesh, TransformNode,
} from "@babylonjs/core";
import type { Player } from "./Player";

export type EnemyState = "idle" | "patrol" | "chase" | "attack" | "dead";

export class Bat {
  private root:   TransformNode;
  private _state: EnemyState = "idle";
  private _scene: Scene;
  private _player: Player;

  private speed       = 6;
  private chaseSpeed  = 12;
  private health      = 28;
  private attackDmg   = 10;
  private attackCd    = 0.7;
  private attackTimer = 0;
  private sightRange  = 24;
  private attackRange = 1.5;
  private _patrolTarget: Vector3;
  private _idleTimer  = 0;
  private _flapTime   = 0;
  private _flyHeight  = 2.4;
  private _wings: Mesh[] = [];
  private _swooping  = false;
  private _swoopTimer = 0;

  onDied?: () => void;

  constructor(scene: Scene, player: Player, position: Vector3) {
    this._scene  = scene;
    this._player = player;

    this.root = new TransformNode("bat_root", scene);
    this.root.position = position.clone();
    this.root.position.y = this._flyHeight;

    this._buildMesh();
    this._patrolTarget = this._randomNearby();
  }

  private _buildMesh(): void {
    const bodyMat = new StandardMaterial("batBody", this._scene);
    bodyMat.diffuseColor  = new Color3(0.08, 0.05, 0.1);
    bodyMat.emissiveColor = new Color3(0.02, 0.01, 0.03);
    bodyMat.specularColor = new Color3(0.05, 0.05, 0.05);

    const wingMat = new StandardMaterial("batWing", this._scene);
    wingMat.diffuseColor  = new Color3(0.12, 0.04, 0.14);
    wingMat.emissiveColor = new Color3(0.04, 0.0, 0.05);
    wingMat.backFaceCulling = false;

    const eyeMat = new StandardMaterial("batEye", this._scene);
    eyeMat.emissiveColor   = new Color3(1, 0.5, 0);
    eyeMat.disableLighting = true;

    // Body
    const body = MeshBuilder.CreateSphere("batBody",
      { diameterX: 0.36, diameterY: 0.28, diameterZ: 0.46 }, this._scene);
    body.parent   = this.root;
    body.position = new Vector3(0, 0, 0);
    body.material = bodyMat;

    // Head
    const head = MeshBuilder.CreateSphere("batHead",
      { diameterX: 0.26, diameterY: 0.24, diameterZ: 0.24 }, this._scene);
    head.parent   = this.root;
    head.position = new Vector3(0, 0.1, 0.26);
    head.material = bodyMat;

    // Ears (2 triangular-ish cones)
    for (let i = 0; i < 2; i++) {
      const ear = MeshBuilder.CreateCylinder("batEar" + i,
        { diameterTop: 0, diameterBottom: 0.1, height: 0.2, tessellation: 4 }, this._scene);
      ear.parent   = head;
      ear.position = new Vector3(i === 0 ? -0.08 : 0.08, 0.16, 0.0);
      ear.rotation.z = i === 0 ? -0.3 : 0.3;
      ear.material = bodyMat;
    }

    // Eyes
    for (let i = 0; i < 2; i++) {
      const eye = MeshBuilder.CreateSphere("batEye" + i, { diameter: 0.06 }, this._scene);
      eye.parent   = head;
      eye.position = new Vector3(i === 0 ? -0.07 : 0.07, 0.02, 0.13);
      eye.material = eyeMat;
    }

    // Wings (flat elongated boxes, one per side, pivot at body center)
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;
      const wing = MeshBuilder.CreateBox("batWing" + i,
        { width: 0.06, height: 0.8, depth: 1.1 }, this._scene);
      wing.parent    = this.root;
      wing.position  = new Vector3(sx * 0.55, 0, -0.05);
      wing.rotation.z = sx * 0.15;
      wing.material  = wingMat;
      this._wings.push(wing);
    }

    // Tail
    const tail = MeshBuilder.CreateCylinder("batTail",
      { diameterTop: 0.02, diameterBottom: 0.07, height: 0.35, tessellation: 5 }, this._scene);
    tail.parent   = this.root;
    tail.position = new Vector3(0, -0.05, -0.28);
    tail.rotation.x = 0.4;
    tail.material = bodyMat;
  }

  update(dt: number): void {
    if (this._state === "dead") return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this._updateState(dt);
    this._animateFlap(dt);
  }

  private _animateFlap(dt: number): void {
    const speed = this._state === "chase" ? 16 : 9;
    this._flapTime += dt * speed;
    const flapAngle = Math.sin(this._flapTime) * 0.75;
    this._wings[0].rotation.z =  0.15 + flapAngle;
    this._wings[1].rotation.z = -0.15 - flapAngle;
    // Slight body roll
    this.root.rotation.z = Math.sin(this._flapTime * 0.4) * 0.1;
    // Hover up/down
    if (!this._swooping) {
      this.root.position.y = this._flyHeight + Math.sin(this._flapTime * 0.3) * 0.15;
    }
  }

  private _updateState(dt: number): void {
    const dist = Vector3.Distance(
      new Vector3(this.root.position.x, 0, this.root.position.z),
      new Vector3(this._player.position.x, 0, this._player.position.z),
    );

    if (this._swooping) {
      this._swoopTimer -= dt;
      const dir3 = this._player.position.subtract(this.root.position).normalize();
      this.root.position.addInPlace(dir3.scale(this.chaseSpeed * 1.4 * dt));
      const distFull = Vector3.Distance(this.root.position, this._player.position);
      if (distFull <= this.attackRange || this._swoopTimer <= 0) {
        if (distFull <= this.attackRange && this.attackTimer <= 0) {
          this.attackTimer = this.attackCd;
          this._player.takeDamage(this.attackDmg);
        }
        this._swooping = false;
        this.root.position.y = this._flyHeight;
      }
      return;
    }

    switch (this._state) {
      case "idle":
        this._idleTimer -= dt;
        if (dist <= this.sightRange) { this._state = "chase"; break; }
        if (this._idleTimer <= 0)    { this._state = "patrol"; }
        break;

      case "patrol": {
        const ptFlat = new Vector3(this._patrolTarget.x, this.root.position.y, this._patrolTarget.z);
        const dTarget = Vector3.Distance(
          new Vector3(this.root.position.x, 0, this.root.position.z),
          new Vector3(this._patrolTarget.x, 0, this._patrolTarget.z),
        );
        if (dTarget < 0.8) {
          this._state = "idle";
          this._idleTimer = 1.5 + Math.random() * 2.5;
          break;
        }
        if (dist <= this.sightRange) { this._state = "chase"; break; }
        const dir = this._patrolTarget.subtract(this.root.position);
        dir.y = 0; dir.normalize();
        this.root.position.addInPlace(dir.scale(this.speed * dt));
        break;
      }

      case "chase": {
        if (dist > this.sightRange * 1.5) { this._state = "patrol"; this._patrolTarget = this._randomNearby(); break; }
        const d2 = this._player.position.subtract(this.root.position);
        d2.y = 0; d2.normalize();
        this.root.position.addInPlace(d2.scale(this.chaseSpeed * dt));
        this._facePlayer();
        // Swoop attack when close
        if (dist <= 5 && this.attackTimer <= 0) {
          this._swooping   = true;
          this._swoopTimer = 0.6;
        }
        break;
      }

      case "attack":
        this._state = "chase";
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
      (Math.random() - 0.5) * 4, 1, (Math.random() - 0.5) * 4,
    ));
    this._state = "chase";
  }

  private _die(): void {
    this._state = "dead";
    this.root.dispose();
    this.onDied?.();
  }

  private _randomNearby(): Vector3 {
    const r = 8 + Math.random() * 12;
    const a = Math.random() * Math.PI * 2;
    return this.root.position.add(new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }

  dispose(): void { if (!this.root.isDisposed()) this.root.dispose(); }

  get position(): Vector3 { return this.root.position; }
  get state():    EnemyState { return this._state; }
}
