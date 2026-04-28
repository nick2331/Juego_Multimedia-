import {
  Scene, MeshBuilder, Color3, Vector3,
  PointLight, PBRMaterial,
} from "@babylonjs/core";
import type { PhobiaLevel } from "../Game";

export class LevelBuilder {
  static async build(scene: Scene, level: PhobiaLevel): Promise<void> {
    switch (level) {
      case "arachnophobia":   return LevelBuilder._arachnophobia(scene);
      case "claustrophobia":  return LevelBuilder._claustrophobia(scene);
      case "nyctophobia":     return LevelBuilder._nyctophobia(scene);
      case "acrophobia":      return LevelBuilder._acrophobia(scene);
    }
  }

  // ── Aracnofobia: almacén oscuro con tuberías ─────────────────
  private static _arachnophobia(scene: Scene): void {
    const mat = new PBRMaterial("wall", scene);
    mat.albedoColor    = new Color3(0.08, 0.05, 0.05);
    mat.roughness      = 0.95;
    mat.metallic       = 0.0;

    const floor = MeshBuilder.CreateGround("floor", { width: 40, height: 40, subdivisions: 2 }, scene);
    floor.material = mat;
    floor.receiveShadows = true;

    // Paredes
    [
      { pos: new Vector3(0, 3, 20),  rot: 0,         w: 40, h: 6 },
      { pos: new Vector3(0, 3, -20), rot: 0,         w: 40, h: 6 },
      { pos: new Vector3(20, 3, 0),  rot: Math.PI/2, w: 40, h: 6 },
      { pos: new Vector3(-20, 3, 0), rot: Math.PI/2, w: 40, h: 6 },
    ].forEach(({ pos, rot, w, h }) => {
      const wall = MeshBuilder.CreatePlane("wall", { width: w, height: h }, scene);
      wall.position = pos;
      wall.rotation.y = rot;
      wall.material   = mat;
    });

    const ceiling = MeshBuilder.CreateGround("ceiling", { width: 40, height: 40 }, scene);
    ceiling.position.y = 6;
    ceiling.rotation.x = Math.PI;
    ceiling.material   = mat;

    // Luces rojas débiles
    [-10, 10].forEach(x => {
      const l = new PointLight("pl" + x, new Vector3(x, 4, 0), scene);
      l.intensity = 0.4;
      l.diffuse   = new Color3(0.6, 0.05, 0.05);
      l.range     = 12;
    });

    // Pilares
    for (let i = 0; i < 6; i++) {
      const col = MeshBuilder.CreateCylinder("col" + i, { diameter: 0.6, height: 6 }, scene);
      col.position = new Vector3(
        (Math.random() - 0.5) * 30,
        3,
        (Math.random() - 0.5) * 30,
      );
      col.material = mat;
    }
  }

  // ── Claustrofobia: pasillos estrechos ────────────────────────
  private static _claustrophobia(scene: Scene): void {
    const mat = new PBRMaterial("concrete", scene);
    mat.albedoColor = new Color3(0.12, 0.12, 0.15);
    mat.roughness   = 0.9;

    const addBox = (name: string, w: number, h: number, d: number, pos: Vector3) => {
      const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      m.position  = pos;
      m.material  = mat;
      m.checkCollisions = true;
    };

    // Floor
    const f = MeshBuilder.CreateGround("f", { width: 60, height: 60 }, scene);
    f.material = mat; f.checkCollisions = true;

    // Corridors
    addBox("c1", 4, 3, 20, new Vector3(0,  1.5,  0));
    addBox("c2", 20, 3, 4, new Vector3(8,  1.5, 10));
    addBox("c3", 4, 3, 20, new Vector3(16, 1.5,  0));
    addBox("c4", 20, 3, 4, new Vector3(8,  1.5,-10));

    [-2, 2].forEach(x => {
      const l = new PointLight("cl"+x, new Vector3(x, 2.5, 0), scene);
      l.intensity = 0.5; l.range = 8;
      l.diffuse   = new Color3(0.3, 0.3, 0.5);
    });
  }

  // ── Nictofobia: nave industrial, casi sin luz ────────────────
  private static _nyctophobia(scene: Scene): void {
    const mat = new PBRMaterial("iron", scene);
    mat.albedoColor = new Color3(0.04, 0.04, 0.06);
    mat.roughness   = 0.8; mat.metallic = 0.5;

    const floor = MeshBuilder.CreateGround("f", { width: 50, height: 50 }, scene);
    floor.material = mat;

    const ceil = MeshBuilder.CreateGround("ceil", { width: 50, height: 50 }, scene);
    ceil.position.y = 8; ceil.rotation.x = Math.PI; ceil.material = mat;

    // Máquinas como obstáculos
    for (let i = 0; i < 8; i++) {
      const m = MeshBuilder.CreateBox("machine"+i, {
        width: 2 + Math.random() * 2,
        height: 1 + Math.random() * 3,
        depth: 2 + Math.random() * 2,
      }, scene);
      m.position    = new Vector3((Math.random()-0.5)*40, m.scaling.y*0.5, (Math.random()-0.5)*40);
      m.material    = mat;
      m.checkCollisions = true;
    }

    // Luz de emergencia roja muy tenue
    const em = new PointLight("em", new Vector3(0, 7, 0), scene);
    em.intensity = 0.1; em.range = 30;
    em.diffuse   = new Color3(0.4, 0.0, 0.0);
  }

  // ── Acrofobia: plataformas elevadas ─────────────────────────
  private static _acrophobia(scene: Scene): void {
    const mat = new PBRMaterial("stone", scene);
    mat.albedoColor = new Color3(0.15, 0.18, 0.2);
    mat.roughness   = 0.85;

    // Base ground very far below
    const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    ground.position.y = -60;
    const gm = new PBRMaterial("gm", scene);
    gm.albedoColor = new Color3(0.02, 0.03, 0.04);
    ground.material = gm;

    // Floating platforms
    const platforms = [
      { pos: new Vector3(0, 0, 0),    size: [10, 0.5, 10] },
      { pos: new Vector3(14, 4, 0),   size: [6, 0.5, 6]   },
      { pos: new Vector3(14, 8, 12),  size: [6, 0.5, 6]   },
      { pos: new Vector3(0, 12, 18),  size: [8, 0.5, 8]   },
      { pos: new Vector3(-12, 16, 8), size: [5, 0.5, 5]   },
      { pos: new Vector3(-12, 20, -4),size: [6, 0.5, 6]   },
    ];
    platforms.forEach(({ pos, size }, i) => {
      const p = MeshBuilder.CreateBox("plat"+i, { width: size[0], height: size[1], depth: size[2] }, scene);
      p.position = pos; p.material = mat; p.checkCollisions = true;
    });

    // Sky light
    const l = new PointLight("sky", new Vector3(0, 30, 0), scene);
    l.intensity = 1.5; l.range = 100;
    l.diffuse   = new Color3(0.3, 0.35, 0.5);
  }
}
