import {
  Scene, MeshBuilder, Color3, Vector3,
  PointLight, PBRMaterial, Mesh, SpotLight,
  StandardMaterial,
} from "@babylonjs/core";
import type { PhobiaLevel } from "../Game";

// ── Material cache ────────────────────────────────────────────────
function concreteMat(scene: Scene, r = 0.12, g = 0.11, b = 0.12): PBRMaterial {
  const m = new PBRMaterial("concrete_" + Math.random(), scene);
  m.albedoColor = new Color3(r, g, b);
  m.roughness   = 0.95;
  m.metallic    = 0.05;
  return m;
}
function metalMat(scene: Scene, r = 0.08, g = 0.08, b = 0.09): PBRMaterial {
  const m = new PBRMaterial("metal_" + Math.random(), scene);
  m.albedoColor = new Color3(r, g, b);
  m.roughness   = 0.6;
  m.metallic    = 0.8;
  return m;
}

// ── Room / corridor builder ───────────────────────────────────────
function addRoom(
  scene: Scene,
  cx: number, cz: number,
  w: number, d: number, h: number,
  wallMat: PBRMaterial, floorMat: PBRMaterial,
  openings: ("N"|"S"|"E"|"W")[] = [],
): void {
  const y0 = 0;

  // Floor
  const floor = MeshBuilder.CreateBox("floor", { width: w, height: 0.25, depth: d }, scene);
  floor.position.set(cx, y0 - 0.125, cz);
  floor.material = floorMat;
  floor.checkCollisions = true;
  floor.receiveShadows  = true;

  // Ceiling
  const ceil = MeshBuilder.CreateBox("ceil", { width: w, height: 0.25, depth: d }, scene);
  ceil.position.set(cx, h + 0.125, cz);
  ceil.material = wallMat;

  // Walls — skip side that has opening
  const walls: {w:number;h:number;d:number;x:number;z:number;tag:string}[] = [
    { tag:"N", w, h, d:0.25, x:cx,       z:cz+d/2   },
    { tag:"S", w, h, d:0.25, x:cx,       z:cz-d/2   },
    { tag:"E", w:0.25, h, d, x:cx+w/2,   z:cz       },
    { tag:"W", w:0.25, h, d, x:cx-w/2,   z:cz       },
  ];
  walls.forEach(({ tag, w: ww, h: hh, d: dd, x, z }) => {
    if (openings.includes(tag as "N"|"S"|"E"|"W")) return;
    const wall = MeshBuilder.CreateBox("wall_" + tag, { width: ww, height: hh, depth: dd }, scene);
    wall.position.set(x, hh / 2, z);
    wall.material = wallMat;
    wall.checkCollisions = true;
  });
}

// Ceiling strip light with optional flicker
function addCeilingLight(
  scene: Scene, x: number, z: number, h: number,
  color: Color3, intensity: number, flicker = false,
): PointLight {
  const light = new PointLight("pl_" + x + "_" + z, new Vector3(x, h - 0.3, z), scene);
  light.diffuse   = color;
  light.intensity = intensity;
  light.range     = 10;

  if (flicker) {
    let t = 0;
    scene.registerBeforeRender(() => {
      t += 0.016;
      if (Math.random() < 0.02) {
        light.intensity = Math.random() < 0.3 ? 0 : intensity * (0.5 + Math.random() * 0.5);
      }
    });
  }
  return light;
}

// Simple prop box (crate)
function addCrate(scene: Scene, x: number, z: number, size = 0.7, mat: PBRMaterial): void {
  const crate = MeshBuilder.CreateBox("crate", { width: size, height: size, depth: size }, scene);
  crate.position.set(x, size / 2, z);
  crate.rotation.y = Math.random() * Math.PI;
  crate.material   = mat;
  crate.checkCollisions = true;
}

// Vertical pipe
function addPipe(scene: Scene, x: number, z: number, h: number, mat: PBRMaterial): void {
  const pipe = MeshBuilder.CreateCylinder("pipe", { diameter: 0.18, height: h }, scene);
  pipe.position.set(x, h / 2, z);
  pipe.material = mat;
}

// ═══════════════════════════════════════════════════════════════════
export class LevelBuilder {
  static async build(scene: Scene, level: PhobiaLevel): Promise<void> {
    switch (level) {
      case "arachnophobia":  LevelBuilder._buildWarehouse(scene);   break;
      case "claustrophobia": LevelBuilder._buildMaze(scene);        break;
      case "nyctophobia":    LevelBuilder._buildDarkPlant(scene);   break;
      case "acrophobia":     LevelBuilder._buildTower(scene);       break;
    }
  }

  // ── ARACNOFOBIA: Almacén abandonado ───────────────────────────
  private static _buildWarehouse(scene: Scene): void {
    const wall  = concreteMat(scene, 0.11, 0.10, 0.11);
    const floor = concreteMat(scene, 0.08, 0.07, 0.08);
    const metal = metalMat(scene);
    const crate = concreteMat(scene, 0.20, 0.14, 0.08); // wooden crates

    // Layout: spawn room → main hall → 3 side rooms
    //  [Spawn]─[Corr1]─[Main Hall]─[Corr2]─[StorageA]
    //                      |
    //                   [Corr3]
    //                      |
    //                  [StorageB]──[Corr4]──[EXIT]

    // Spawn room (8×8×3.5)
    addRoom(scene, 0, 0, 8, 8, 3.5, wall, floor, ["N"]);
    addCeilingLight(scene, 0, 0, 3.5, new Color3(0.9, 0.7, 0.3), 1.2, true);

    // Corridor 1 (N, 3×10)
    addRoom(scene, 0, 9, 3, 10, 3.2, wall, floor, ["S", "N"]);
    addCeilingLight(scene, 0, 9, 3.2, new Color3(0.8, 0.6, 0.2), 0.8, true);

    // Main Hall (16×16×4)
    addRoom(scene, 0, 22, 16, 16, 4, wall, floor, ["S", "E", "W", "N"]);
    addCeilingLight(scene, -4, 22, 4, new Color3(0.7, 0.5, 0.2), 1.0, true);
    addCeilingLight(scene,  4, 22, 4, new Color3(0.7, 0.5, 0.2), 1.0, true);
    addCeilingLight(scene,  0, 18, 4, new Color3(0.9, 0.3, 0.1), 0.6, false); // emergency red

    // Corridor 2 (E, 10×3)
    addRoom(scene, 13, 22, 10, 3, 3.2, wall, floor, ["W", "E"]);
    addCeilingLight(scene, 13, 22, 3.2, new Color3(0.8, 0.6, 0.2), 0.7, true);

    // Storage A (10×10×3.5)
    addRoom(scene, 22, 22, 10, 10, 3.5, wall, floor, ["W"]);
    addCeilingLight(scene, 22, 22, 3.5, new Color3(0.4, 0.6, 0.9), 0.9, false);

    // Corridor 3 (S from main)
    addRoom(scene, 0, 33, 3, 10, 3.2, wall, floor, ["N", "S"]);
    addCeilingLight(scene, 0, 33, 3.2, new Color3(0.8, 0.6, 0.2), 0.6, true);

    // Storage B (10×10×3.5)
    addRoom(scene, 0, 42, 10, 10, 3.5, wall, floor, ["N", "E"]);
    addCeilingLight(scene, 0, 42, 3.5, new Color3(0.8, 0.6, 0.2), 0.9, true);

    // Corridor 4 (E from B)
    addRoom(scene, 13, 42, 10, 3, 3.2, wall, floor, ["W", "E"]);

    // EXIT room (6×6×3.5) — green light
    addRoom(scene, 22, 42, 6, 6, 3.5, wall, floor, ["W"]);
    const exitLight = new PointLight("exit_light", new Vector3(22, 3, 42), scene);
    exitLight.diffuse   = new Color3(0.1, 1, 0.2);
    exitLight.intensity = 1.5;
    exitLight.range     = 8;

    // Props — crates scattered around
    [
      [2, 3], [-2, 3], [3, -2], [-3, -2],
      [-5, 22], [5, 20], [-4, 26], [4, 26],
      [20, 18], [24, 20], [21, 25],
      [-2, 41], [3, 44], [-4, 43],
    ].forEach(([x, z]) => addCrate(scene, x, z, 0.6 + Math.random() * 0.5, crate));

    // Stacked crates
    [[6, 22, 1.4], [-6, 18, 1.2]].forEach(([x, z, sy]) => {
      const c = MeshBuilder.CreateBox("bigcrate", { width: 1.2, height: sy, depth: 1.2 }, scene);
      c.position.set(x, sy/2, z);
      c.material = crate;
      c.checkCollisions = true;
    });

    // Pipes on walls
    [[7.5,5],[−7.5,5],[-7.5,15],[7.5,15]].forEach(([x,z]) =>
      addPipe(scene, x, z, 3.5, metal));
  }

  // ── CLAUSTROFOBIA: Laberinto de pasillos estrechos ────────────
  private static _buildMaze(scene: Scene): void {
    const wall  = concreteMat(scene, 0.10, 0.10, 0.13);
    const floor = concreteMat(scene, 0.06, 0.06, 0.08);

    const H = 2.8; // low ceiling
    const W = 3;   // narrow corridors

    // Cross-shaped maze
    addRoom(scene,  0,  0, W, 20, H, wall, floor, ["N", "S"]);
    addRoom(scene,  0, 10, 20, W, H, wall, floor, ["E", "W"]);
    addRoom(scene, -8,  0, W, 12, H, wall, floor, ["N", "S"]);
    addRoom(scene,  8,  0, W, 12, H, wall, floor, ["N", "S"]);
    addRoom(scene,  0,-12, W, 8,  H, wall, floor, ["N", "S"]);
    addRoom(scene,  0, 22, W, 8,  H, wall, floor, ["S", "N"]);

    // Small rooms at ends
    addRoom(scene,  0, 28, 5, 5, H, wall, floor, ["S"]);
    addRoom(scene, -8,-5,  5, 5, H, wall, floor, ["N"]);
    addRoom(scene,  8,-5,  5, 5, H, wall, floor, ["N"]);
    addRoom(scene,  0,-18, 6, 6, H, wall, floor, ["N"]);

    // Flickering lights every 6m
    for (let z = -15; z <= 25; z += 5) {
      addCeilingLight(scene, 0, z, H, new Color3(0.6, 0.6, 0.8), 0.7, true);
    }
    for (let x = -16; x <= 16; x += 5) {
      addCeilingLight(scene, x, 10, H, new Color3(0.6, 0.5, 0.3), 0.6, true);
    }

    // Exit light
    const el = new PointLight("el", new Vector3(0, H-0.3, 28), scene);
    el.diffuse = new Color3(0.1, 1, 0.2); el.intensity = 1.2; el.range = 6;
  }

  // ── NICTOFOBIA: Planta industrial oscura ──────────────────────
  private static _buildDarkPlant(scene: Scene): void {
    const wall  = metalMat(scene, 0.07, 0.07, 0.08);
    const floor = metalMat(scene, 0.05, 0.05, 0.06);
    const metal = metalMat(scene);

    // Large open plant floor
    addRoom(scene, 0, 0, 40, 40, 6, wall, floor, []);

    // Interior dividers (machines/walls)
    [
      [-8, 0, 0.4, 12, 4],
      [ 8, 0, 0.4, 12, 4],
      [ 0, 8, 12,  0.4, 4],
      [ 0,-8, 12,  0.4, 4],
    ].forEach(([x, z, w, d, h]) => {
      const div = MeshBuilder.CreateBox("div", { width: w, height: h, depth: d }, scene);
      div.position.set(x, h/2, z);
      div.material = wall;
      div.checkCollisions = true;
    });

    // Machinery blocks
    [[10,10,3,4,3],[-10,10,4,3,3],[10,-10,3,4,3],[-10,-10,4,3,3]].forEach(([x,z,w,h,d]) => {
      const m = MeshBuilder.CreateBox("machine", { width: w, height: h, depth: d }, scene);
      m.position.set(x, h/2, z);
      m.material = metal;
      m.checkCollisions = true;
    });

    // Almost ALL lights broken — only dim emergency reds
    [[-15,15],[15,15],[-15,-15],[15,-15],[0,0]].forEach(([x,z]) => {
      const l = new PointLight("em", new Vector3(x, 5.5, z), scene);
      l.diffuse = new Color3(0.5, 0.02, 0.02);
      l.intensity = 0.15;
      l.range = 8;
    });

    // Exit light (barely visible)
    const el = new PointLight("el", new Vector3(17, 1, 17), scene);
    el.diffuse = new Color3(0, 0.5, 0.1); el.intensity = 0.4; el.range = 4;

    // Pipes
    for (let i = 0; i < 6; i++) {
      addPipe(scene, -18 + i*3, -19, 6, metal);
    }
  }

  // ── ACROFOBIA: Torre industrial multi-nivel ───────────────────
  private static _buildTower(scene: Scene): void {
    const wall  = concreteMat(scene, 0.14, 0.16, 0.18);
    const floor = concreteMat(scene, 0.10, 0.12, 0.14);
    const metal = metalMat(scene, 0.15, 0.15, 0.16);

    // Ground level
    const ground = MeshBuilder.CreateBox("ground", { width: 200, height: 1, depth: 200 }, scene);
    ground.position.set(0, -60.5, 0);
    const gm = new PBRMaterial("gm", scene);
    gm.albedoColor = new Color3(0.02, 0.03, 0.04);
    gm.roughness = 1; gm.metallic = 0;
    ground.material = gm;

    // Platform 0 — base (spawn)
    const p0 = MeshBuilder.CreateBox("p0", { width: 12, height: 0.4, depth: 12 }, scene);
    p0.position.set(0, 0, 0); p0.material = floor; p0.checkCollisions = true;
    // Railing
    _addRailing(scene, 0, 0, 12, 12, metal);

    // Platform 1
    const p1 = MeshBuilder.CreateBox("p1", { width: 8, height: 0.4, depth: 8 }, scene);
    p1.position.set(16, 5, 0); p1.material = floor; p1.checkCollisions = true;
    _addRailing(scene, 16, 0, 8, 8, metal);

    // Platform 2
    const p2 = MeshBuilder.CreateBox("p2", { width: 8, height: 0.4, depth: 8 }, scene);
    p2.position.set(16, 11, 16); p2.material = floor; p2.checkCollisions = true;

    // Platform 3
    const p3 = MeshBuilder.CreateBox("p3", { width: 10, height: 0.4, depth: 10 }, scene);
    p3.position.set(0, 18, 22); p3.material = floor; p3.checkCollisions = true;

    // Platform 4 (top exit)
    const p4 = MeshBuilder.CreateBox("p4", { width: 8, height: 0.4, depth: 8 }, scene);
    p4.position.set(-12, 25, 18); p4.material = floor; p4.checkCollisions = true;

    // Narrow bridges
    const b1 = MeshBuilder.CreateBox("b1", { width: 1.5, height: 0.3, depth: 16 }, scene);
    b1.position.set(8, 5, 0); b1.material = metal; b1.checkCollisions = true;

    const b2 = MeshBuilder.CreateBox("b2", { width: 1.5, height: 0.3, depth: 16 }, scene);
    b2.position.set(16, 11, 8); b2.material = metal; b2.checkCollisions = true;

    const b3 = MeshBuilder.CreateBox("b3", { width: 16, height: 0.3, depth: 1.5 }, scene);
    b3.position.set(8, 18, 22); b3.material = metal; b3.checkCollisions = true;

    const b4 = MeshBuilder.CreateBox("b4", { width: 1.5, height: 0.3, depth: 12 }, scene);
    b4.position.set(-12, 25, 12); b4.material = metal; b4.checkCollisions = true;

    // Structural columns
    [[0,0],[ 16,0],[16,16],[0,22],[-12,18]].forEach(([x,z]) => {
      const col = MeshBuilder.CreateCylinder("col", { diameter: 0.8, height: 30 }, scene);
      col.position.set(x, 15, z);
      col.material = metal;
      col.checkCollisions = true;
    });

    // Lights at each platform
    [[0,2,0],[16,7,0],[16,13,16],[0,20,22],[-12,27,18]].forEach(([x,y,z]) => {
      const l = new PointLight("pl", new Vector3(x, y, z), scene);
      l.diffuse = new Color3(0.6, 0.7, 0.9); l.intensity = 1.2; l.range = 12;
    });

    // Exit light on top
    const el = new PointLight("el", new Vector3(-12, 26, 18), scene);
    el.diffuse = new Color3(0.1, 1, 0.3); el.intensity = 1.5; el.range = 8;

    // Sky fog (very low density here — you can see the drop)
    scene.fogDensity = 0.012;
  }
}

function _addRailing(scene: Scene, cx: number, _cy: number, w: number, d: number, mat: PBRMaterial): void {
  const r = 0.08, h = 1.0;
  [[cx, d/2],[cx, -d/2],[cx+w/2, 0],[cx-w/2, 0]].forEach(([x, z]) => {
    const post = MeshBuilder.CreateBox("rail", { width: w, height: 0.06, depth: r }, scene);
    post.position.set(x, h, z);
    post.material = mat;
  });
}
