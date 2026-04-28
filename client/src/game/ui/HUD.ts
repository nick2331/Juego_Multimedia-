import type { InventoryItem } from "../systems/Inventory";

export class HUD {
  private healthInner:  HTMLElement;
  private batteryInner: HTMLElement;
  private sanityInner:  HTMLElement;
  private interactEl:   HTMLElement;
  private itemMsgEl:    HTMLElement;
  private invSlots:     NodeListOf<HTMLElement>;
  private vignetteEl:   HTMLElement;
  private bloodEl:      HTMLElement;
  private msgTimeout:   ReturnType<typeof setTimeout> | null = null;
  private bloodTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.healthInner  = document.querySelector("#health-bar  .bar-inner")!;
    this.batteryInner = document.querySelector("#battery-bar .bar-inner")!;
    this.sanityInner  = document.querySelector("#sanity-bar  .bar-inner")!;
    this.interactEl   = document.getElementById("interact-prompt")!;
    this.itemMsgEl    = document.getElementById("item-msg")!;
    this.invSlots     = document.querySelectorAll(".inv-slot");
    this.vignetteEl   = document.getElementById("vignette")!;
    this.bloodEl      = document.getElementById("blood-vignette")!;
  }

  updateHealth(pct: number):  void { this.healthInner.style.width  = (pct * 100) + "%"; }
  updateBattery(pct: number): void { this.batteryInner.style.width = (pct * 100) + "%"; }
  updateSanity(pct: number):  void { this.sanityInner.style.width  = (pct * 100) + "%"; }

  setTimer(seconds: number): void {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.showMessage(`⏱ ${m}:${s.toString().padStart(2, "0")}`, 1.2);
  }

  showInteractPrompt(text: string): void {
    this.interactEl.textContent = text;
    this.interactEl.classList.add("visible");
  }
  hideInteractPrompt(): void { this.interactEl.classList.remove("visible"); }

  showMessage(text: string, duration = 2.5): void {
    if (this.msgTimeout) clearTimeout(this.msgTimeout);
    this.itemMsgEl.textContent = text;
    this.itemMsgEl.classList.add("show");
    this.msgTimeout = setTimeout(() => this.itemMsgEl.classList.remove("show"), duration * 1000);
  }

  flashBlood(): void {
    if (this.bloodTimeout) clearTimeout(this.bloodTimeout);
    this.bloodEl.style.opacity = "1";
    this.bloodTimeout = setTimeout(() => { this.bloodEl.style.opacity = "0"; }, 400);
  }

  refreshInventory(items: InventoryItem[]): void {
    this.invSlots.forEach((slot, i) => {
      const item = items[i];
      if (item) {
        slot.textContent = item.icon ?? this._typeIcon(item.type);
        slot.classList.add("filled");
        slot.title = item.name;
      } else {
        slot.textContent = "—";
        slot.classList.remove("filled");
        slot.title = "";
      }
    });
  }

  async showScores(): Promise<void> {
    try {
      const res  = await fetch("/api/scores");
      const data = await res.json() as Array<{ level: string; mode: string; time: number }>;
      const msg  = data.slice(0, 5)
        .map((s, i) => `${i + 1}. ${s.level} (${s.mode}) — ${Math.floor(s.time)}s`)
        .join("\n") || "Sin puntuaciones aún";
      alert("🏆 TOP SCORES\n\n" + msg);
    } catch {
      alert("No se pudieron cargar las puntuaciones.");
    }
  }

  private _typeIcon(type: string): string {
    const icons: Record<string, string> = {
      battery: "🔋", medkit: "💊", sedative: "💉", keycard: "🔑", objective: "📦",
    };
    return icons[type] ?? "?";
  }
}
