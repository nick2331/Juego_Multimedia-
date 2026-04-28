// Ambient floating particles shown on menu screens
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; alpha: number;
}

export class Particles {
  private ctx:  CanvasRenderingContext2D;
  private pts:  Particle[] = [];
  private raf:  number = 0;
  private running = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this._populate();
    this._loop();
  }

  stop(): void { this.running = false; cancelAnimationFrame(this.raf); }

  private _populate(): void {
    const n = Math.floor((this.canvas.width * this.canvas.height) / 18000);
    this.pts = Array.from({ length: n }, () => this._make());
  }

  private _make(): Particle {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.3 - 0.05,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.05,
    };
  }

  private _loop(): void {
    this.raf = requestAnimationFrame(() => { if (this.running) { this._draw(); this._loop(); } });
  }

  private _draw(): void {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of this.pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5 || p.x < -5 || p.x > canvas.width + 5) Object.assign(p, this._make(), { y: canvas.height + 5 });
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,30,30,${p.alpha})`;
      ctx.fill();
    }
  }

  private _resize(): void {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._populate();
  }
}
