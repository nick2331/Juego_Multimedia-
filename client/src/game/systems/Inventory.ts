import type { HUD } from "../ui/HUD";
import type { Player } from "../entities/Player";

export type ItemType = "battery" | "medkit" | "sedative" | "keycard" | "objective";

export interface InventoryItem {
  name:  string;
  type:  ItemType;
  value: number;
  icon?: string;
}

export class Inventory {
  private items: InventoryItem[] = [];
  private readonly maxSlots = 4;
  private _hud: HUD;

  constructor(hud: HUD) { this._hud = hud; }

  tryPickup(item: InventoryItem): boolean {
    if (this.items.length >= this.maxSlots) {
      this._hud.showMessage("Inventario lleno");
      return false;
    }
    this.items.push(item);
    this._hud.refreshInventory(this.items);
    return true;
  }

  useFirst(player: Player): void {
    const idx = this.items.findIndex(i =>
      i.type === "battery" || i.type === "medkit" || i.type === "sedative",
    );
    if (idx === -1) return;
    const item = this.items.splice(idx, 1)[0];
    this._apply(item, player);
    this._hud.refreshInventory(this.items);
    this._hud.showMessage("Usado: " + item.name);
  }

  private _apply(item: InventoryItem, player: Player): void {
    switch (item.type) {
      case "battery":  player.flashlight.recharge(item.value); break;
      case "medkit":   player.heal(item.value);                break;
      case "sedative": player.sanity.restore(item.value);      break;
    }
  }

  hasItem(type: ItemType): boolean {
    return this.items.some(i => i.type === type);
  }

  removeItem(type: ItemType): boolean {
    const idx = this.items.findIndex(i => i.type === type);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this._hud.refreshInventory(this.items);
    return true;
  }

  getItems(): InventoryItem[] { return [...this.items]; }
}
