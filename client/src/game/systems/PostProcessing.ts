import {
  DefaultRenderingPipeline, Scene, Camera, Color4,
} from "@babylonjs/core";

export class PostProcessing {
  private pipeline: DefaultRenderingPipeline;

  constructor(scene: Scene, camera: Camera) {
    // LDR pipeline (false) — más compatible con todos los navegadores
    this.pipeline = new DefaultRenderingPipeline("main", false, scene, [camera]);

    // Bloom — luces que brillan (se nota en las lámparas del nivel)
    this.pipeline.bloomEnabled   = true;
    this.pipeline.bloomThreshold = 0.6;
    this.pipeline.bloomWeight    = 0.35;
    this.pipeline.bloomKernel    = 64;
    this.pipeline.bloomScale     = 0.5;

    // Film grain — da textura sucia
    this.pipeline.grainEnabled      = true;
    this.pipeline.grain.intensity   = 14;
    this.pipeline.grain.animated    = true;

    // Chromatic aberration — borde de horror
    this.pipeline.chromaticAberrationEnabled                    = true;
    this.pipeline.chromaticAberration.aberrationAmount          = 1.2;
    this.pipeline.chromaticAberration.radialIntensity           = 0.8;

    // FXAA antialiasing
    this.pipeline.fxaaEnabled = true;

    // Image processing — contraste suave, no aplasta los negros
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.contrast  = 1.4;
    this.pipeline.imageProcessing.exposure  = 1.05;

    // Vignette suave en bordes
    this.pipeline.imageProcessing.vignetteEnabled   = true;
    this.pipeline.imageProcessing.vignetteWeight    = 3.5;
    this.pipeline.imageProcessing.vignetteCameraFov = 0.5;
    this.pipeline.imageProcessing.vignetteColor     = new Color4(0, 0, 0, 0);
    this.pipeline.imageProcessing.vignetteBlendMode = 1;
  }

  // Se llama cuando cambia la cordura — más distorsión al bajar
  setSanityLevel(pct: number): void {
    const t = Math.max(0, 1 - pct);
    this.pipeline.chromaticAberration.aberrationAmount = 1.2 + t * 8;
    this.pipeline.imageProcessing.contrast             = 1.4 + t * 1.2;
    this.pipeline.grain.intensity                      = 14  + t * 30;
  }

  dispose(): void {
    try { this.pipeline.dispose(); } catch (_) { /* safe */ }
  }
}
