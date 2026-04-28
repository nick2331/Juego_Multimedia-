import { Game } from "./game/Game";
import { HUD } from "./game/ui/HUD";
import { Particles } from "./game/ui/Particles";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Ambient particle background on menus
const particles = new Particles(document.getElementById("particles") as HTMLCanvasElement);
particles.start();

const hud = new HUD();
const game = new Game(canvas, hud);

// ── Navigation wiring ────────────────────────────────────────────
const show = (id: string) => {
  document.querySelectorAll<HTMLElement>(".overlay").forEach(el => el.classList.remove("visible"));
  document.getElementById(id)?.classList.add("visible");
};

let selectedLevel = "arachnophobia";

document.getElementById("btn-play")!.addEventListener("click", () => show("level-select"));
document.getElementById("btn-scores")!.addEventListener("click", () => hud.showScores());
document.getElementById("btn-settings")!.addEventListener("click", () => {});

document.getElementById("btn-back-level")!.addEventListener("click", () => show("main-menu"));
document.getElementById("btn-back-mode")!.addEventListener("click", () => show("level-select"));

document.querySelectorAll<HTMLElement>(".level-card").forEach(card => {
  card.addEventListener("click", () => {
    selectedLevel = card.dataset.level!;
    show("mode-select");
  });
});

document.querySelectorAll<HTMLElement>(".mode-card").forEach(card => {
  card.addEventListener("click", async () => {
    const mode = card.dataset.mode!;
    show(""); // hide all
    document.getElementById("loading-screen")!.classList.remove("hidden");
    await game.startLevel(selectedLevel, mode);
    document.getElementById("loading-screen")!.classList.add("hidden");
    document.getElementById("hud")!.classList.add("visible");
  });
});

document.getElementById("btn-resume")!.addEventListener("click", () => {
  game.resume();
  document.getElementById("pause-menu")!.classList.remove("visible");
  document.getElementById("hud")!.classList.add("visible");
});

document.getElementById("btn-quit")!.addEventListener("click", () => {
  game.stop();
  document.getElementById("hud")!.classList.remove("visible");
  show("main-menu");
});

document.getElementById("btn-retry")!.addEventListener("click", () => {
  document.getElementById("death-screen")!.classList.remove("visible");
  document.getElementById("loading-screen")!.classList.remove("hidden");
  game.startLevel(selectedLevel, game.currentMode).then(() => {
    document.getElementById("loading-screen")!.classList.add("hidden");
    document.getElementById("hud")!.classList.add("visible");
  });
});

document.getElementById("btn-death-menu")!.addEventListener("click", () => {
  game.stop();
  document.getElementById("hud")!.classList.remove("visible");
  show("main-menu");
});

document.getElementById("btn-next")!.addEventListener("click", () => {
  game.stop();
  document.getElementById("hud")!.classList.remove("visible");
  show("level-select");
});

document.getElementById("btn-win-menu")!.addEventListener("click", () => {
  game.stop();
  document.getElementById("hud")!.classList.remove("visible");
  show("main-menu");
});

// Pause on Escape
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && game.isRunning) {
    game.pause();
    document.getElementById("hud")!.classList.remove("visible");
    document.getElementById("pause-menu")!.classList.add("visible");
  }
});

// Finish loading bar animation
const bar  = document.getElementById("loading-bar")!;
const text = document.getElementById("loading-text")!;
let pct = 0;
const tick = setInterval(() => {
  pct += Math.random() * 15;
  if (pct >= 100) { pct = 100; clearInterval(tick); }
  bar.style.width = pct + "%";
  const msgs = ["Cargando assets...","Iniciando motor...","Generando nivel...","Preparando IA...","Listo"];
  text.textContent = msgs[Math.min(Math.floor(pct / 25), 4)];
}, 200);
setTimeout(() => document.getElementById("loading-screen")!.classList.add("hidden"), 2200);
