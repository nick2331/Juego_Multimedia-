import {
  Engine, Scene, Color4, Vector3,
  HemisphericLight, DirectionalLight, Color3,
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

  isRunning    = false;
  currentMode: GameMode = "escape";
  private currentLevel: PhobiaLevel = "arachnophobia";
  private survivalTimer = 0;
  private survivalGoal  = 180;
  private objectives    = { total: 3, done: 0 };
  private exitUnlocked  = false;

  constructor(private canvas: HTMLCanvasElement, private hud: HUD) {
    this.engine = new Engine(canvas, true, { antialias: true });
    window.addEventListener("resize", () => this.engine.resize());
  }

  async startLevel(level: string, mode: string): Promise<void> {
    this.stop();
    this.currentLevel  = level as PhobiaLevel;
    this.currentMode   = mode as GameMode;
    this.survivalTimer = 0;
    this.objectives    = { total: 3, done: 0 };
    this.exitUnlocked  = false;

    this.scene = new Scene(this.engine);
    // Visible dark-blue sky instead of pure black
    this.scene.clearColor     = new Color4(0.06, 0.06, 0.12, 1);
    this.scene.collisionsEnabled = true;

    this._setupFog(level as PhobiaLevel);
    this._setupLights(level as PhobiaLevel);

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

  private _update(dt: number): void {
    this.player?.update(dt);
    this.spawn?.update(dt);
    if (this.currentMode === "survival") {
      this.survivalTimer += dt;
      const rem = Math.max(0, this.survivalGoal - this.survivalTimer);
      this.hud.setTimer(rem);
      if (this.survivalTimer >= this.survivalGoal) this._onWin();
    }
  }

  completeObjective(): void {
    this.objectives.done++;
    this.hud.showMessage(`Objetivo ${this.objectives.done}/${this.objectives.total} completado`);
    if (this.objectives.done >= this.objectives.total) {
      this.exitUnlocked = true;
      this.hud.showMessage("Salida desbloqueada!");
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
  }

  private _setupFog(level: PhobiaLevel): void {
    if (!this.scene) return;
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    const fogMap: Record<PhobiaLevel, [number, number, Color3]> = {
      arachnophobia:  [20, 55, new Color3(0.06, 0.06, 0.10)],
      claustrophobia: [10, 35, new Color3(0.05, 0.05, 0.09)],
      nyctophobia:    [8,  28, new Color3(0.02, 0.02, 0.04)],
      acrophobia:     [30, 90, new Color3(0.10, 0.10, 0.18)],
    };
    const [start, end, color] = fogMap[level];
    this.scene.fogStart = start;
    this.scene.fogEnd   = end;
    this.scene.fogColor = color;
  }

  private _setupLights(level: PhobiaLevel): void {
    if (!this.scene) return;

    const amb = new HemisphericLight("amb", new Vector3(0, 1, 0), this.scene);
    amb.intensity   = level === "nyctophobia" ? 0.5 : 2.8;
    amb.diffuse     = new Color3(0.75, 0.72, 0.85);
    amb.groundColor = new Color3(0.35, 0.32, 0.42);

    const dir = new DirectionalLight("dir", new Vector3(-0.5, -1, -0.5), this.scene);
    dir.intensity = level === "nyctophobia" ? 0.3 : 1.4;
    dir.diffuse   = new Color3(0.9, 0.85, 1.0);
  }
}
