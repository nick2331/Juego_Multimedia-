import {
  DefaultRenderingPipeline, Scene, Camera, ColorCurves, Color4,
} from "@babylonjs/core";

export class PostProcessing {
  private pipeline: DefaultRenderingPipeline;

  constructor(scene: Scene, camera: Camera) {
    this.pipeline = new DefaultRenderingPipeline("main", true, scene, [camera]);

    // Bloom — luces que brillan
    this.pipeline.bloomEnabled         = true;
    this.pipeline.bloomThreshold       = 0.35;
    this.pipeline.bloomWeight          = 0.55;
    this.pipeline.bloomKernel          = 64;
    this.pipeline.bloomScale           = 0.5;

    // Film grain — textura sucia tipo Lethal Company
    this.pipeline.grainEnabled         = true;
    this.pipeline.grain.intensity      = 22;
    this.pipeline.grain.animated       = true;

    // Chromatic aberration — distorsión de horror
    this.pipeline.chromaticAberrationEnabled = true;
    this.pipeline.chromaticAberration.aberrationAmount  = 1.8;
    this.pipeline.chromaticAberration.radialIntensity   = 1.0;

    // FXAA
    this.pipeline.fxaaEnabled = true;

    // Image processing
    this.pipeline.imageProcessingEnabled = true;
    const ip = this.pipeline.imageProcessing;
    ip.contrast  = 2.1;
    ip.exposure  = 0.65;

    // Vignette integrada
    ip.vignetteEnabled     = true;
    ip.vignetteWeight      = 5.5;
    ip.vignetteCameraFov   = 0.55;
    ip.vignetteColor       = new Color4(0, 0, 0, 0);
    ip.vignetteBlendMode   = 1; // MULTIPLY

    // Color curves — fría/desaturada como Lethal Company
    ip.colorCurvesEnabled = true;
    const c = new ColorCurves();
    c.globalSaturation = -25;
    c.globalExposure   = -5;
    c.shadowsHue       = 220;
    c.shadowsDensity   = 20;
    c.highlightsHue    = 40;
    c.highlightsDensity = 10;
    ip.colorCurves = c;
  }

  // Llamar desde Sanity cuando la cordura baja
  setSanityLevel(pct: number): void {
    const t = 1 - pct;
    this.pipeline.chromaticAberration.aberrationAmount = 1.8 + t * 10;
    this.pipeline.imageProcessing.contrast             = 2.1 + t * 1.8;
    this.pipeline.grain.intensity                      = 22  + t * 40;
  }

  dispose(): void { this.pipeline.dispose(); }
}
