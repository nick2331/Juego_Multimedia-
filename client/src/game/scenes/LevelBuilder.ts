import {
  Scene, MeshBuilder, StandardMaterial, Color3, Vector3, PointLight, Mesh,
} from "@babylonjs/core";
import type { PhobiaLevel } from "../Game";

// -- Helpers -------------------------------------------------------
function mat(scene: Scene, r: number, g: number, b: number, emR = 0.06, emG = 0.06, emB = 0.07): StandardMaterial {
  const m = new StandardMaterial("m" + Math.random().toFixed(5), scene);
  m.diffuseColor  = new Color3(r, g, b);
  m.emissiveColor = new Color3(emR, emG, emB);
  m.specularColor = new Color3(0.2, 0.2, 0.25);
  return m;
}

function box(scene: Scene, w: number, h: number, d: number, x: number, y: number, z: number, m: StandardMaterial, collide = true): Mesh {
  const mesh = MeshBuilder.CreateBox("b", { width: w, height: h, depth: d }, scene);
  mesh.position.set(x, y, z);
  mesh.material = m;
  if (collide) mesh.checkCollisions = true;
  return mesh;
}

function cylinder(scene: Scene, dia: number, h: number, x: number, y: number, z: number, m: StandardMaterial): Mesh {
  const mesh = MeshBuilder.CreateCylinder("cy", { diameter: dia, height: h, tessellation: 12 }, scene);
  mesh.position.set(x, y, z);
  mesh.material = m;
  mesh.checkCollisions = true;
  return mesh;
}

function sphere(scene: Scene, dia: number, x: number, y: number, z: number, m: StandardMaterial): Mesh {
  const mesh = MeshBuilder.CreateSphere("sp", { diameter: dia, segments: 8 }, scene);
  mesh.position.set(x, y, z);
  mesh.material = m;
  return mesh;
}

function lamp(scene: Scene, x: number, z: number, h: number, r: number, g: number, b: number, intensity: number, range: number, flicker = false): void {
  // Pole
  const poleMat = mat(scene, 0.3, 0.3, 0.32);
  cylinder(scene, 0.12, h, x, h / 2, z, poleMat);
  // Bulb sphere with emissive
  const bulbMat = mat(scene, r, g, b, r * 0.8, g * 0.8, b * 0.8);
  sphere(scene, 0.35, x, h + 0.1, z, bulbMat);
  // Actual light
  const l = new PointLight("lp", new Vector3(x, h, z), scene);
  l.diffuse   = new Color3(r, g, b);
  l.intensity = intensity;
  l.range     = range;
  if (flicker) {
    const base = intensity;
    scene.registerBeforeRender(() => {
      if (Math.random() < 0.012) l.intensity = Math.random() < 0.3 ? 0 : base * (0.5 + Math.random() * 0.5);
    });
  }
}

function ceilingLight(scene: Scene, x: number, z: number, h: number, r: number, g: number, b: number, intensity: number, range: number, flicker = false): void {
  const bulbMat = mat(scene, r, g, b, r * 0.9, g * 0.9, b * 0.9);
  // Ceiling fixture
  const fix = MeshBuilder.CreateBox("fix", { width: 0.6, height: 0.08, depth: 0.6 }, scene);
  fix.position.set(x, h - 0.04, z);
  fix.material = bulbMat;
  const l = new PointLight("cl", new Vector3(x, h - 0.5, z), scene);
  l.diffuse   = new Color3(r, g, b);
  l.intensity = intensity;
  l.range     = range;
  if (flicker) {
    const base = intensity;
    scene.registerBeforeRender(() => {
      if (Math.random() < 0.01) l.intensity = Math.random() < 0.25 ? 0 : base * (0.55 + Math.random() * 0.45);
    });
  }
}

// Interactable pickup item
function addPickup(scene: Scene, x: number, z: number, type: "medkit" | "battery" | "sedative", onUse: (scene: Scene) => void): void {
  const colors: Record<string, [number, number, number]> = {
    medkit:   [0.9, 0.1, 0.1],
    battery:  [0.9, 0.85, 0.1],
    sedative: [0.1, 0.4, 0.9],
  };
  const labels: Record<string, string> = {
    medkit:   "[E] Recoger Botiquin (+30 HP)",
    battery:  "[E] Recoger Bateria (+40%)",
    sedative: "[E] Recoger Sedante (+30 SAN)",
  };
  const [r, g, b] = colors[type];
  const pickupMat = mat(scene, r, g, b, r * 0.6, g * 0.6, b * 0.6);
  const mesh = MeshBuilder.CreateBox("pickup_" + type, { width: 0.4, height: 0.4, depth: 0.4 }, scene);
  mesh.position.set(x, 0.2, z);
  mesh.material = pickupMat;
  // Bobbing animation
  let t = Math.random() * Math.PI * 2;
  scene.registerBeforeRender(() => {
    t += 0.025;
    mesh.position.y = 0.2 + Math.sin(t) * 0.08;
    mesh.rotation.y += 0.015;
  });
  mesh.metadata = {
    interactable: true,
    promptText: labels[type],
    onInteract: (player: { heal: (n:number)=>void; flashlight: { recharge:(n:number)=>void }; sanity: { restore:(n:number)=>void } }) => {
      if (type === "medkit")   player.heal(30);
      if (type === "battery")  player.flashlight.recharge(40);
      if (type === "sedative") player.sanity.restore(30);
      onUse(scene);
      mesh.dispose();
    },
  };
  // Glow light under pickup
  const gl = new PointLight("glow", new Vector3(x, 0.3, z), scene);
  gl.diffuse   = new Color3(r, g, b);
  gl.intensity = 0.8;
  gl.range     = 3;
}

// ================================================================
export class LevelBuilder {
  static async build(scene: Scene, level: PhobiaLevel): Promise<void> {
    switch (level) {
      case "arachnophobia":  LevelBuilder._warehouse(scene); break;
      case "claustrophobia": LevelBuilder._maze(scene);      break;
      case "nyctophobia":    LevelBuilder._plant(scene);     break;
      case "acrophobia":     LevelBuilder._tower(scene);     break;
    }
  }

  // -- ARACNOFOBIA: Almacen urbano abandonado -------------------
  private static _warehouse(scene: Scene): void {
    const wallM  = mat(scene, 0.65, 0.60, 0.56);
    const floorM = mat(scene, 0.45, 0.40, 0.38);
    const woodM  = mat(scene, 0.62, 0.44, 0.26);
    const metalM = mat(scene, 0.50, 0.50, 0.56);
    const concM  = mat(scene, 0.68, 0.65, 0.62);

    // --- ROOM 1: Spawn ---
    const r1w = 10, r1d = 10, h = 4.5;
    box(scene, r1w, 0.3, r1d, 0, -0.15, 0, floorM);           // floor
    box(scene, r1w, 0.2, r1d, 0, h, 0, wallM, false);         // ceiling
    box(scene, r1w, h, 0.25, 0, h/2, r1d/2, wallM);           // N wall
    box(scene, r1w, h, 0.25, 0, h/2, -r1d/2, wallM);          // S wall
    box(scene, 0.25, h, r1d, -r1w/2, h/2, 0, wallM);          // W wall
    // E wall with door gap (leave open toward corridor)

    // --- CORRIDOR 1 ---
    box(scene, 3.5, 0.3, 12, 7, -0.15, 0, floorM);
    box(scene, 3.5, 0.2, 12, 7, h, 0, wallM, false);
    box(scene, 0.25, h, 12, 5.1, h/2, 0, wallM);
    box(scene, 0.25, h, 12, 8.9, h/2, 0, wallM);

    // --- ROOM 2: Main Hall ---
    const r2x = 15, r2w = 18, r2d = 18;
    box(scene, r2w, 0.3, r2d, r2x, -0.15, 0, floorM);
    box(scene, r2w, 0.2, r2d, r2x, h+0.8, 0, wallM, false);
    box(scene, 0.25, h+0.8, r2d, r2x-r2w/2, (h+0.8)/2, 0, wallM);  // W (door gap)
    box(scene, r2w, h+0.8, 0.25, r2x, (h+0.8)/2, r2d/2, wallM);    // N
    box(scene, r2w, h+0.8, 0.25, r2x, (h+0.8)/2, -r2d/2, wallM);   // S
    box(scene, 0.25, h+0.8, r2d, r2x+r2w/2, (h+0.8)/2, 0, wallM);  // E

    // --- CORRIDOR 2: North ---
    box(scene, 3.5, 0.3, 10, r2x, -0.15, 14, floorM);
    box(scene, 3.5, 0.2, 10, r2x, h, 14, wallM, false);
    box(scene, 0.25, h, 10, r2x-1.75, h/2, 14, wallM);
    box(scene, 0.25, h, 10, r2x+1.75, h/2, 14, wallM);

    // --- ROOM 3: Storage ---
    box(scene, 12, 0.3, 12, r2x, -0.15, 24, floorM);
    box(scene, 12, 0.2, 12, r2x, h, 24, wallM, false);
    box(scene, 0.25, h, 12, r2x-6, h/2, 24, wallM);
    box(scene, 0.25, h, 12, r2x+6, h/2, 24, wallM);
    box(scene, 12, h, 0.25, r2x, h/2, 30, wallM);

    // --- CORRIDOR 3: East ---
    box(scene, 10, 0.3, 3.5, r2x+14, -0.15, 0, floorM);
    box(scene, 10, 0.2, 3.5, r2x+14, h, 0, wallM, false);
    box(scene, 10, h, 0.25, r2x+14, h/2, 1.75, wallM);
    box(scene, 10, h, 0.25, r2x+14, h/2, -1.75, wallM);

    // --- ROOM 4: Exit Room ---
    box(scene, 10, 0.3, 10, r2x+24, -0.15, 0, floorM);
    box(scene, 10, 0.2, 10, r2x+24, h, 0, wallM, false);
    box(scene, 0.25, h, 10, r2x+24-5, h/2, 0, wallM);
    box(scene, 10, h, 0.25, r2x+24, h/2, 5, wallM);
    box(scene, 10, h, 0.25, r2x+24, h/2, -5, wallM);
    box(scene, 0.25, h, 10, r2x+24+5, h/2, 0, wallM);

    // -- Lights ----------------------------------------------
    ceilingLight(scene, 0, 0, h, 1.0, 0.82, 0.4, 4.0, 16, true);
    ceilingLight(scene, 7, 0, h, 1.0, 0.82, 0.4, 3.5, 14, true);
    ceilingLight(scene, r2x-4, -4, h+0.5, 1.0, 0.80, 0.35, 4.5, 18, true);
    ceilingLight(scene, r2x+4, -4, h+0.5, 1.0, 0.80, 0.35, 4.5, 18, false);
    ceilingLight(scene, r2x-4,  4, h+0.5, 1.0, 0.80, 0.35, 4.5, 18, true);
    ceilingLight(scene, r2x+4,  4, h+0.5, 1.0, 0.80, 0.35, 4.5, 18, false);
    ceilingLight(scene, r2x, 24, h, 1.0, 0.82, 0.4, 4.0, 16, true);
    ceilingLight(scene, r2x+14, 0, h, 1.0, 0.82, 0.4, 3.5, 14, true);
    // Exit green
    ceilingLight(scene, r2x+24, 0, h, 0.1, 1.0, 0.3, 5.0, 14);
    // Emergency red
    lamp(scene, r2x, 0.5, 1.2, 0.9, 0.1, 0.05, 1.5, 6);

    // -- Street poles inside main hall ------------------------
    lamp(scene, r2x-5, -5, 3.8, 1.0, 0.9, 0.5, 3.0, 12, false);
    lamp(scene, r2x+5, -5, 3.8, 1.0, 0.9, 0.5, 3.0, 12, false);
    lamp(scene, r2x-5,  5, 3.8, 1.0, 0.9, 0.5, 3.0, 12, false);
    lamp(scene, r2x+5,  5, 3.8, 1.0, 0.9, 0.5, 3.0, 12, false);

    // -- Props: crates, barrels, pillars ---------------------
    [[-3,3],[2,-3],[3,2],[-2,-3]].forEach(([x,z]) => {
      box(scene, 0.65, 0.65, 0.65, x, 0.33, z, woodM);
    });
    // Stacked crates in main hall
    box(scene, 0.8, 0.8, 0.8, r2x-6, 0.4, -5, woodM);
    box(scene, 0.8, 0.8, 0.8, r2x-6, 1.2, -5, woodM);
    box(scene, 0.8, 0.8, 0.8, r2x+6,  0.4,  5, woodM);
    // Barrels (cylinders)
    [
      [r2x-3, -7], [r2x+3, -7], [r2x-3, 7], [r2x+3, 7],
      [r2x+22, -3], [r2x+22, 3],
    ].forEach(([bx, bz]) => cylinder(scene, 0.55, 0.85, bx, 0.43, bz, metalM));
    // Concrete pillars in main hall
    [[-6,-6],[-6,6],[6,-6],[6,6]].map(([px,pz]) => [r2x+px, pz]).forEach(([px,pz]) =>
      cylinder(scene, 0.6, h+0.8, px, (h+0.8)/2, pz, concM)
    );

    // -- Pickups ---------------------------------------------
    addPickup(scene, -3, -2, "medkit",   () => {});
    addPickup(scene,  r2x, -7, "battery", () => {});
    addPickup(scene,  r2x, 22, "medkit",  () => {});
    addPickup(scene,  r2x+14, 3, "sedative", () => {});
    addPickup(scene,  r2x+22, -3, "battery", () => {});
  }

  // -- CLAUSTROFOBIA: Bunker subterraneo ------------------------
  private static _maze(scene: Scene): void {
    const wallM  = mat(scene, 0.58, 0.58, 0.64);
    const floorM = mat(scene, 0.40, 0.40, 0.44);
    const pipeMat = mat(scene, 0.35, 0.68, 0.35);
    const H = 3.0;

    const addCorridor = (cx: number, cz: number, w: number, d: number) => {
      box(scene, w, 0.3, d, cx, -0.15, cz, floorM);
      box(scene, w, 0.2, d, cx, H, cz, wallM, false);
      if (w > d) { // horizontal corridor - add N/S walls
        box(scene, w, H, 0.25, cx, H/2, cz + d/2, wallM);
        box(scene, w, H, 0.25, cx, H/2, cz - d/2, wallM);
      } else { // vertical - add E/W walls
        box(scene, 0.25, H, d, cx + w/2, H/2, cz, wallM);
        box(scene, 0.25, H, d, cx - w/2, H/2, cz, wallM);
      }
    };

    // Main vertical spine
    addCorridor(0, 0, 3, 30);
    // Horizontal branches
    addCorridor(0, 8, 20, 3);
    addCorridor(0, -8, 20, 3);
    // Side arms
    addCorridor(-8, 0, 3, 14);
    addCorridor(8, 0, 3, 14);
    addCorridor(-8, 12, 8, 8);
    addCorridor(8, 12, 8, 8);
    addCorridor(-8, -12, 8, 8);
    addCorridor(8, -12, 8, 8);
    // Dead-end rooms
    box(scene, 6, 0.3, 6, 0, -0.15, 18, floorM);
    box(scene, 6, H, 0.25, 0, H/2, 21, wallM);
    box(scene, 0.25, H, 6, -3, H/2, 18, wallM);
    box(scene, 0.25, H, 6,  3, H/2, 18, wallM);
    box(scene, 6, 0.2, 6, 0, H, 18, wallM, false);

    // Lights every 5m along corridors
    for (let z = -13; z <= 18; z += 5)
      ceilingLight(scene, 0, z, H, 0.9, 0.85, 1.0, 4.0, 12, true);
    for (let x = -16; x <= 16; x += 6) {
      ceilingLight(scene, x, 8, H, 0.9, 0.85, 1.0, 3.5, 11, true);
      ceilingLight(scene, x, -8, H, 0.9, 0.85, 1.0, 3.5, 11, true);
    }
    ceilingLight(scene, 0, 18, H, 0.1, 1.0, 0.3, 4.5, 12); // exit

    // Pipes along walls
    for (let z = -12; z <= 16; z += 4)
      cylinder(scene, 0.12, 0.6, 1.2, 2.2, z, pipeMat);

    // Pickups
    addPickup(scene, 0, -12, "medkit",   () => {});
    addPickup(scene, -7, 4,  "battery",  () => {});
    addPickup(scene,  7, -4, "sedative", () => {});
    addPickup(scene,  0,  14, "medkit",  () => {});
  }

  // -- NICTOFOBIA: Planta industrial oscura --------------------
  private static _plant(scene: Scene): void {
    const wallM  = mat(scene, 0.35, 0.35, 0.40, 0.04, 0.04, 0.05);
    const floorM = mat(scene, 0.28, 0.28, 0.32, 0.03, 0.03, 0.04);
    const metalM = mat(scene, 0.40, 0.40, 0.46, 0.04, 0.04, 0.06);
    const H = 7;

    // Big outer shell
    box(scene, 44, 0.3, 44, 0, -0.15, 0, floorM);
    box(scene, 44, H, 0.25, 0, H/2, 22, wallM);
    box(scene, 44, H, 0.25, 0, H/2, -22, wallM);
    box(scene, 0.25, H, 44, -22, H/2, 0, wallM);
    box(scene, 0.25, H, 44,  22, H/2, 0, wallM);
    box(scene, 44, 0.25, 44, 0, H, 0, wallM, false);

    // Machines / obstacles (mixed shapes)
    const machineData: [number, number, number, number, number][] = [
      [9,9,3,4,3], [9,-9,4,3,3], [-9,9,4,3,3], [-9,-9,3,4,3],
      [0,14,5,5,2], [14,0,2,5,5], [-14,0,2,5,5], [0,-14,5,5,2],
    ];
    machineData.forEach(([x,z,w,mh,d]) => {
      box(scene, w, mh, d, x, mh/2, z, metalM);
    });
    // Round tanks
    [[16,16],[16,-16],[-16,16],[-16,-16]].forEach(([x,z]) =>
      cylinder(scene, 3, 5, x, 2.5, z, metalM)
    );
    // Tall columns
    [[-10,0],[10,0],[0,10],[0,-10]].forEach(([x,z]) =>
      cylinder(scene, 0.6, H, x, H/2, z, metalM)
    );

    // Very dim emergency lights only
    [[0,0],[14,14],[14,-14],[-14,14],[-14,-14]].forEach(([x,z]) => {
      const l = new PointLight("em", new Vector3(x, H-0.5, z), scene);
      l.diffuse = new Color3(0.6, 0.04, 0.04);
      l.intensity = 1.2;
      l.range = 10;
    });
    // One slightly brighter yellow (broken lamp)
    const broken = new PointLight("brk", new Vector3(4, 6.5, 4), scene);
    broken.diffuse = new Color3(0.8, 0.6, 0.1);
    broken.intensity = 1.8;
    broken.range = 12;
    scene.registerBeforeRender(() => {
      if (Math.random() < 0.02) broken.intensity = Math.random() < 0.35 ? 0 : 1.8 * (0.4 + Math.random() * 0.6);
    });
    // Exit faint green
    const el = new PointLight("exit", new Vector3(19, 1, 19), scene);
    el.diffuse = new Color3(0.05, 0.7, 0.1); el.intensity = 1.2; el.range = 6;

    // Pickups hidden in dark
    addPickup(scene, -6, 6,   "medkit",   () => {});
    addPickup(scene,  10, -3, "battery",  () => {});
    addPickup(scene, -10, 3,  "battery",  () => {});
    addPickup(scene,  0, 12,  "sedative", () => {});
    addPickup(scene, -3, -10, "medkit",   () => {});
  }

  // -- ACROFOBIA: Torre con plataformas ------------------------
  private static _tower(scene: Scene): void {
    const platM  = mat(scene, 0.55, 0.60, 0.65);
    const metalM = mat(scene, 0.45, 0.45, 0.52);
    const stoneM = mat(scene, 0.65, 0.62, 0.58);

    // Abyss
    const abyss = MeshBuilder.CreateGround("abyss", { width: 400, height: 400 }, scene);
    abyss.position.y = -70;
    abyss.material = mat(scene, 0.02, 0.02, 0.03);

    // Platforms
    const plats: [number, number, number, number, number][] = [
      [0,   0,  0,  14, 14],
      [18,  5,  0,  10, 10],
      [18,  12, 18, 10, 10],
      [0,   19, 24, 12, 12],
      [-16, 26, 18, 10, 10],
    ];
    plats.forEach(([x,y,z,w,d]) => {
      box(scene, w, 0.6, d, x, y, z, platM);
      // Railing
      box(scene, w, 0.8, 0.15, x, y+0.7, z+d/2, metalM);
      box(scene, w, 0.8, 0.15, x, y+0.7, z-d/2, metalM);
      box(scene, 0.15, 0.8, d, x+w/2, y+0.7, z, metalM);
      box(scene, 0.15, 0.8, d, x-w/2, y+0.7, z, metalM);
    });

    // Bridges (narrow - scary!)
    box(scene, 1.5, 0.3, 18, 9, 5, 0, metalM);   // p0->p1
    box(scene, 1.5, 0.3, 18, 18, 12, 9, metalM);  // p1->p2
    box(scene, 18, 0.3, 1.5, 9, 19, 24, metalM);  // p2->p3
    box(scene, 1.5, 0.3, 12, -8, 26, 21, metalM); // p3->p4

    // Structural columns
    [[0,0],[18,0],[18,18],[0,24],[-16,18]].forEach(([x,z]) =>
      cylinder(scene, 0.9, 35, x, 17, z, stoneM)
    );

    // Platform lights (cool blue-white)
    [[0,2,0],[18,7,0],[18,14,18],[0,21,24],[-16,28,18]].forEach(([x,y,z]) => {
      const l = new PointLight("pl", new Vector3(x, y, z), scene);
      l.diffuse = new Color3(0.65, 0.75, 1.0); l.intensity = 4.5; l.range = 16;
    });
    // Exit green
    const el = new PointLight("exit", new Vector3(-16, 27, 18), scene);
    el.diffuse = new Color3(0.1, 1.0, 0.3); el.intensity = 5.0; el.range = 12;

    // Pickups on platforms
    addPickup(scene, 0,  0,   "medkit",   () => {});
    addPickup(scene, 16, 5,   "battery",  () => {});
    addPickup(scene, 16, 12,  "medkit",   () => {});
    addPickup(scene, 0,  19,  "sedative", () => {});
  }
}
