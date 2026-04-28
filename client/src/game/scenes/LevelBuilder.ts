import {
  Scene, MeshBuilder, Color3, Vector3,
  PointLight, PBRMaterial, Mesh,
} from "@babylonjs/core";
import type { PhobiaLevel } from "../Game";

// ── Materials ─────────────────────────────────────────────────────
function mkMat(scene: Scene, r: number, g: number, b: number, rough = 0.92, metal = 0.05): PBRMaterial {
  const m = new PBRMaterial("m" + Math.random().toFixed(6), scene);
  m.albedoColor = new Color3(r, g, b);
  m.roughness   = rough;
  m.metallic    = metal;
  return m;
}

// ── Add a light fixture ───────────────────────────────────────────
function addLight(
  scene: Scene, x: number, y: number, z: number,
  r: number, g: number, b: number,
  intensity: number, range: number,
  flicker = false,
): PointLight {
  const l = new PointLight("l_" + x + "_" + z, new Vector3(x, y, z), scene);
  l.diffuse   = new Color3(r, g, b);
  l.specular  = new Color3(r * 0.5, g * 0.5, b * 0.5);
  l.intensity = intensity;
  l.range     = range;
  if (flicker) {
    const base = intensity;
    scene.registerBeforeRender(() => {
      if (Math.random() < 0.015)
        l.intensity = Math.random() < 0.25 ? 0 : base * (0.6 + Math.random() * 0.4);
    });
  }
  return l;
}

// ── Build a closed room box (floor + ceiling + 4 walls) ───────────
// openings: sides where there is NO wall (passage holes)
function buildRoom(
  scene: Scene,
  cx: number, cz: number,
  w: number, d: number, h: number,
  wallMat: PBRMaterial, floorMat: PBRMaterial,
  openings: Array<"N" | "S" | "E" | "W"> = [],
): void {
  // Floor
  const fl = MeshBuilder.CreateBox("fl", { width: w, height: 0.3, depth: d }, scene);
  fl.position.set(cx, -0.15, cz);
  fl.material = floorMat;
  fl.checkCollisions = true;
  fl.receiveShadows  = true;

  // Ceiling
  const ceil = MeshBuilder.CreateBox("ce", { width: w + 0.3, height: 0.3, depth: d + 0.3 }, scene);
  ceil.position.set(cx, h + 0.15, cz);
  ceil.material = wallMat;

  const wallDefs: { tag: "N"|"S"|"E"|"W"; ww: number; hh: number; dd: number; x: number; z: number }[] = [
    { tag: "N", ww: w, hh: h, dd: 0.3, x: cx,       z: cz + d / 2 },
    { tag: "S", ww: w, hh: h, dd: 0.3, x: cx,       z: cz - d / 2 },
    { tag: "E", ww: 0.3, hh: h, dd: d, x: cx + w / 2, z: cz },
    { tag: "W", ww: 0.3, hh: h, dd: d, x: cx - w / 2, z: cz },
  ];
  wallDefs.forEach(({ tag, ww, hh, dd, x, z }) => {
    if (openings.includes(tag)) return;
    const wall = MeshBuilder.CreateBox("w_" + tag, { width: ww, height: hh, depth: dd }, scene);
    wall.position.set(x, hh / 2, z);
    wall.material = wallMat;
    wall.checkCollisions = true;
  });
}

// ── Crate prop ───────────────────────────────────────────────────
function addCrate(scene: Scene, x: number, z: number, mat: PBRMaterial, size = 0.7): void {
  const c = MeshBuilder.CreateBox("cr", { width: size, height: size, depth: size * (0.8 + Math.random() * 0.4) }, scene);
  c.position.set(x, size / 2, z);
  c.rotation.y = Math.random() * Math.PI;
  c.material   = mat;
  c.checkCollisions = true;
}

// ═══════════════════════════════════════════════════════════════════
export class LevelBuilder {
  static async build(scene: Scene, level: PhobiaLevel): Promise<void> {
    switch (level) {
      case "arachnophobia":  LevelBuilder._warehouse(scene); break;
      case "claustrophobia": LevelBuilder._maze(scene);      break;
      case "nyctophobia":    LevelBuilder._plant(scene);     break;
      case "acrophobia":     LevelBuilder._tower(scene);     break;
    }
  }

  // ── ARACNOFOBIA — Almacén abandonado ─────────────────────────
  private static _warehouse(scene: Scene): void {
    const wallM  = mkMat(scene, 0.22, 0.20, 0.20);
    const floorM = mkMat(scene, 0.16, 0.14, 0.14);
    const crateM = mkMat(scene, 0.32, 0.22, 0.12);
    const metalM = mkMat(scene, 0.18, 0.18, 0.20, 0.6, 0.7);

    // ── Rooms ──────────────────────────────────────────────────
    // Spawn room (player starts here)
    buildRoom(scene,  0,  0,  9, 9, 4, wallM, floorM, ["N"]);
    // Corridor 1
    buildRoom(scene,  0, 10,  3, 11, 4, wallM, floorM, ["S", "N"]);
    // Main hall
    buildRoom(scene,  0, 22, 18, 16, 5, wallM, floorM, ["S", "E", "W", "N"]);
    // Corridor 2 (east)
    buildRoom(scene, 14, 22,  11, 3, 4, wallM, floorM, ["W", "E"]);
    // Storage A
    buildRoom(scene, 22, 22, 10, 10, 4, wallM, floorM, ["W"]);
    // Corridor 3 (north)
    buildRoom(scene,  0, 33,   3, 11, 4, wallM, floorM, ["S", "N"]);
    // Storage B
    buildRoom(scene,  0, 42,  12, 10, 4, wallM, floorM, ["S", "E"]);
    // Corridor 4 (east to exit)
    buildRoom(scene, 10, 42,  11, 3, 4, wallM, floorM, ["W", "E"]);
    // EXIT room — green light
    buildRoom(scene, 18, 42,   8, 8, 4, wallM, floorM, ["W"]);

    // ── Lights — warm yellow-orange ───────────────────────────
    addLight(scene,  0, 3.6,  0, 1.0, 0.75, 0.3, 2.8, 14, true);
    addLight(scene,  0, 3.6, 10, 1.0, 0.75, 0.3, 2.2, 12, true);
    addLight(scene, -4, 4.6, 22, 1.0, 0.70, 0.25, 3.0, 16, true);
    addLight(scene,  4, 4.6, 22, 1.0, 0.70, 0.25, 3.0, 16, true);
    addLight(scene,  0, 4.6, 26, 0.9, 0.65, 0.2, 2.5, 14, false);
    addLight(scene, 14, 3.6, 22, 1.0, 0.75, 0.3, 2.5, 12, true);
    addLight(scene, 22, 3.6, 22, 0.8, 0.60, 0.3, 2.8, 13, false);
    addLight(scene,  0, 3.6, 33, 1.0, 0.75, 0.3, 2.2, 12, true);
    addLight(scene,  0, 3.6, 42, 1.0, 0.75, 0.3, 2.5, 13, true);
    addLight(scene, 10, 3.6, 42, 1.0, 0.75, 0.3, 2.0, 12, true);
    // EXIT green
    addLight(scene, 18, 3.0, 42, 0.1, 1.0, 0.3, 3.5, 12, false);
    // Emergency red in main hall
    addLight(scene,  0, 0.8, 18, 0.9, 0.05, 0.05, 1.2, 8, false);

    // ── Crates ───────────────────────────────────────────────
    const cp: [number, number][] = [
      [2,3],[-2,3],[3,-2],[-3,-2],
      [-6,22],[6,20],[-5,26],[5,26],[0,28],
      [20,19],[24,20],[21,25],[23,24],
      [-3,40],[4,44],[-4,43],[2,42],
    ];
    cp.forEach(([x, z]) => addCrate(scene, x, z, crateM, 0.55 + Math.random() * 0.5));

    // Stacked crates
    addCrate(scene,  6, 22, crateM, 1.2);
    addCrate(scene,  6, 22, crateM, 0.8); // second layer — place manually
    const stack = MeshBuilder.CreateBox("stack", { width: 1.2, height: 1.2, depth: 1.2 }, scene);
    stack.position.set(6, 1.8, 22); stack.material = crateM; stack.checkCollisions = true;

    // Pipes on walls
    [[-4.2, 5], [4.2, 5], [-4.2, 15], [4.2, 15]].forEach(([x, z]) => {
      const p = MeshBuilder.CreateCylinder("pipe", { diameter: 0.2, height: 4.5 }, scene);
      p.position.set(x, 2.2, z); p.material = metalM;
    });
  }

  // ── CLAUSTROFOBIA — Laberinto de pasillos ─────────────────────
  private static _maze(scene: Scene): void {
    const wallM  = mkMat(scene, 0.20, 0.20, 0.24);
    const floorM = mkMat(scene, 0.14, 0.14, 0.17);

    const H = 3.0, W = 3.2;

    buildRoom(scene,  0,  0, W, 22, H, wallM, floorM, ["N", "S"]);
    buildRoom(scene,  0, 11, 22, W, H, wallM, floorM, ["E", "W"]);
    buildRoom(scene, -9,  0, W, 14, H, wallM, floorM, ["N", "S"]);
    buildRoom(scene,  9,  0, W, 14, H, wallM, floorM, ["N", "S"]);
    buildRoom(scene,  0,-12, W,  8, H, wallM, floorM, ["N", "S"]);
    buildRoom(scene,  0, 22, W,  8, H, wallM, floorM, ["S", "N"]);
    // End rooms
    buildRoom(scene,  0, 28,  6, 6, H, wallM, floorM, ["S"]);
    buildRoom(scene, -9, -8,  6, 6, H, wallM, floorM, ["N"]);
    buildRoom(scene,  9, -8,  6, 6, H, wallM, floorM, ["N"]);
    buildRoom(scene,  0,-18,  7, 7, H, wallM, floorM, ["N"]);

    // Lights every 5m along corridors
    for (let z = -16; z <= 26; z += 5)
      addLight(scene, 0, H - 0.4, z, 0.8, 0.8, 1.0, 2.5, 10, true);
    for (let x = -18; x <= 18; x += 5)
      addLight(scene, x, H - 0.4, 11, 0.8, 0.7, 0.5, 2.5, 10, true);

    // Exit green
    addLight(scene, 0, H - 0.5, 28, 0.1, 1.0, 0.3, 3.0, 10);
  }

  // ── NICTOFOBIA — Planta industrial oscura ─────────────────────
  private static _plant(scene: Scene): void {
    const wallM  = mkMat(scene, 0.12, 0.12, 0.14, 0.65, 0.7);
    const floorM = mkMat(scene, 0.09, 0.09, 0.10, 0.8, 0.5);

    buildRoom(scene, 0, 0, 42, 42, 7, wallM, floorM, []);

    // Interior dividers
    const divs: [number, number, number, number][] = [
      [-9, 0, 0.4, 14], [9, 0, 0.4, 14],
      [0, 9, 14, 0.4],  [0, -9, 14, 0.4],
    ];
    divs.forEach(([x, z, w, d]) => {
      const dv = MeshBuilder.CreateBox("dv", { width: w, height: 5, depth: d }, scene);
      dv.position.set(x, 2.5, z); dv.material = wallM; dv.checkCollisions = true;
    });

    // Heavy machinery blocks
    [[11,11,3,4],[−11,11,4,3],[11,-11,3,4],[-11,-11,4,3]].forEach(([x,z,w,d]) => {
      const m = MeshBuilder.CreateBox("mach", { width: w, height: 3.5, depth: d }, scene);
      m.position.set(x, 1.75, z); m.material = wallM; m.checkCollisions = true;
    });

    // VERY dim red emergency lights — barely see anything
    [[-16,16],[16,16],[-16,-16],[16,-16],[0,0]].forEach(([x,z]) =>
      addLight(scene, x, 5.8, z, 0.7, 0.05, 0.05, 0.6, 10));

    // Slightly brighter yellow emergency lights (damaged)
    [[-5,5],[5,-5]].forEach(([x,z]) =>
      addLight(scene, x, 5.8, z, 0.8, 0.6, 0.1, 0.9, 8, true));

    // Exit (barely visible green glow)
    addLight(scene, 18, 1.5, 18, 0.05, 0.8, 0.1, 1.8, 6);
  }

  // ── ACROFOBIA — Torre multi-nivel ─────────────────────────────
  private static _tower(scene: Scene): void {
    const platM  = mkMat(scene, 0.22, 0.26, 0.28);
    const metalM = mkMat(scene, 0.20, 0.20, 0.22, 0.55, 0.8);

    // Abyss floor far below
    const abyss = MeshBuilder.CreateBox("abyss", { width: 300, height: 1, depth: 300 }, scene);
    abyss.position.set(0, -65, 0);
    abyss.material = mkMat(scene, 0.02, 0.02, 0.03);

    const makePlat = (name: string, x: number, y: number, z: number, w: number, d: number): Mesh => {
      const p = MeshBuilder.CreateBox(name, { width: w, height: 0.5, depth: d }, scene);
      p.position.set(x, y, z); p.material = platM; p.checkCollisions = true;
      return p;
    };

    makePlat("p0", 0, 0, 0, 12, 12);    // spawn
    makePlat("p1", 16, 5, 0, 9, 9);
    makePlat("p2", 16, 11, 16, 9, 9);
    makePlat("p3", 0, 18, 22, 11, 11);
    makePlat("p4", -14, 25, 18, 9, 9);   // exit

    // Bridges (narrow — scary)
    const mkBridge = (x: number, y: number, z: number, w: number, d: number) => {
      const b = MeshBuilder.CreateBox("br", { width: w, height: 0.3, depth: d }, scene);
      b.position.set(x, y, z); b.material = metalM; b.checkCollisions = true;
    };
    mkBridge(8,  5,   0, 1.4, 16);   // p0 → p1
    mkBridge(16, 11,  8, 1.4, 16);   // p1 → p2
    mkBridge(8,  18, 22, 16,  1.4);  // p2 → p3
    mkBridge(-7, 25, 18, 1.4, 14);   // p3 → p4

    // Structural columns
    [[0,0],[16,0],[16,16],[0,22],[-14,18]].forEach(([x,z]) => {
      const col = MeshBuilder.CreateCylinder("col", { diameter: 0.9, height: 35 }, scene);
      col.position.set(x, 17, z); col.material = metalM; col.checkCollisions = true;
    });

    // Lights at each platform — cool blue-white for height atmosphere
    addLight(scene,  0,  3,  0, 0.7, 0.8, 1.0, 3.0, 14);
    addLight(scene, 16,  8,  0, 0.7, 0.8, 1.0, 3.0, 14);
    addLight(scene, 16, 14, 16, 0.7, 0.8, 1.0, 2.8, 13);
    addLight(scene,  0, 21, 22, 0.7, 0.8, 1.0, 3.0, 14);
    addLight(scene, -14, 28, 18, 0.7, 0.8, 1.0, 3.0, 14);
    // Exit
    addLight(scene, -14, 26, 18, 0.1, 1.0, 0.3, 4.0, 10);
  }
}
