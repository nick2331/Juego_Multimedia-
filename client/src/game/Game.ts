import {
  Engine, Scene, Color4, Vector3, HemisphericLight,
  DirectionalLight, ShadowGenerator, Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { Player } from "./entities/Player";
import { SpawnManager } from "./systems/SpawnManager";
import { LevelBuilder } from "./scenes/LevelBuilder";
import { HUD } from "./ui/HUD";

export type PhobiaLevel = "arachnophobia" | "claustrophobia" | "nyctophobia" | "acrophobia";
export type GameMode    = "survival" | "escape" | "objectives";

export class Game {
  private engine:  Engine;
  private scene:   Scene | null = null;
  private player:  Player | null = null;
  private spawn:   SpawnManager | null = null;

  isRunning   = false;
  currentMode: GameMode = "escape";
  private currentLevel: PhobiaLevel = "arachnophobia";

  private survivalTimer = 0;
  private survivalGoal  = 180; // 3 min
  private objectives    = { total: 3, done: 0 };
  private exitUnlocked  = false;

  constructor(private canvas: HTMLCanvasElement, private hud: HUD) {
    this.engine = new Engine(canvas, true, { stencil: true });
    window.addEventListener("resize", () => this.engine.resize());
  }

  // ── Start / Stop ──────────────────────────────────────────────
  async startLevel(level: string, mode: string): Promise<void> {
    this.stop();
    this.currentLevel = level as PhobiaLevel;
    this.currentMode  = mode  as GameMode;
    this.survivalTimer = 0;
    this.objectives    = { total: 3, done: 0 };
    this.exitUnlocked  = false;

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.01, 0.01, 0.02, 1);
    this._setupFog();
    this._setupLights();

    await LevelBuilder.build(this.scene, level as PhobiaLevel);

    this.player = new Player(this.scene, this.canvas, this.hud);
    this.player.onDied   = () => this._onPlayerDied();
    this.player.onPickup = (name) => this.hud.showMessage("Recogido: " + name);

    this.spawn = new SpawnManager(this.scene, this.player, level as PhobiaLevel);

    this.isRunning = true;
    this.engine.runRenderLoop(() => {
      if (!this.scene || !this.isRunning) return;
      const dt = this.engine.getDeltaTime() / 1000;
      this._update(dt);
      this.scene.render();
    });
  }

  stop(): void {
    this.isRunning = false;
    this.spawn?.dispose();
    this.player?.dispose();
    this.scene?.dispose();
    this.scene  = null;
    this.player = null;
    this.spawn  = null;
    this.engine.stopRenderLoop();
    document.exitPointerLock?.();
  }

  pause():  void { this.isRunning = false; document.exitPointerLock?.(); }
  resume(): void { this.isRunning = true;  this.canvas.requestPointerLock(); }

  // ── Per-frame update ─────────────────────────────────────────
  private _update(dt: number): void {
    this.player?.update(dt);
    this.spawn?.update(dt);

    if (this.currentMode === "survival") {
      this.survivalTimer += dt;
      const remaining = Math.max(0, this.survivalGoal - this.survivalTimer);
      this.hud.setTimer(remaining);
      if (this.survivalTimer >= this.survivalGoal) this._onWin();
    }
  }

  // ── Game events ──────────────────────────────────────────────
  completeObjective(): void {
    this.objectives.done++;
    this.hud.showMessage(`Objetivo ${this.objectives.done}/${this.objectives.total} completado`);
    if (this.objectives.done >= this.objectives.total) {
      this.exitUnlocked = true;
      this.hud.showMessage("¡Salida desbloqueada!");
    }
  }

  tryExit(): void {
    if (this.currentMode === "survival") return;
    if (this.currentMode === "objectives" && !this.exitUnlocked) {
      this.hud.showMessage("Completa los objetivos primero");
      return;
    }
    this._onWin();
  }

  private _onPlayerDied(): void {
    this.isRunning = false;
    document.exitPointerLock?.();
    document.getElementById("hud")!.classList.remove("visible");
    document.getElementById("death-screen")!.classList.add("visible");
  }

  private _onWin(): void {
    this.isRunning = false;
    document.exitPointerLock?.();
    document.getElementById("hud")!.classList.remove("visible");
    document.getElementById("win-screen")!.classList.add("visible");
    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: this.currentLevel,
        mode:  this.currentMode,
        time:  this.survivalTimer,
      }),
    }).catch(() => {});
  }

  // ── Scene setup ───────────────────────────────────────────────
  private _setupFog(): void {
    if (!this.scene) return;
    this.scene.fogMode    = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.04;
    this.scene.fogColor   = new Color3(0.02, 0.02, 0.03);
  }

  private _setupLights(): void {
    if (!this.scene) return;
    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.05;
    ambient.diffuse   = new Color3(0.1, 0.1, 0.2);

    const dir = new DirectionalLight("sun", new Vector3(-1, -2, -1), this.scene);
    dir.intensity = 0.3;
    dir.diffuse   = new Color3(0.15, 0.1, 0.2);

    this._shadowGen = new ShadowGenerator(1024, dir);
    this._shadowGen.useBlurExponentialShadowMap = true;
  }

  private _shadowGen?: ShadowGenerator;
  get shadowGenerator(): ShadowGenerator | undefined { return this._shadowGen; }
}
