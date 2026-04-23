using UnityEngine;
using System.Collections.Generic;

namespace PhobiaHorror.Player
{
    public enum ItemType
    {
        Battery,        // Recarga la linterna
        MedKit,         // Restaura vida
        Sedative,       // Restaura cordura
        Objective,      // Ítem de misión
        KeyCard         // Abre puertas
    }

    [System.Serializable]
    public class Item
    {
        public string itemName;
        public ItemType type;
        public float value;
        public Sprite icon;
    }

    public class InventorySystem : MonoBehaviour
    {
        public static InventorySystem Instance { get; private set; }

        [Header("Inventario")]
        public int maxSlots = 4;
        public List<Item> items = new List<Item>();

        [Header("Teclas")]
        public KeyCode useItemKey = KeyCode.Q;

        public static event System.Action<Item> OnItemPickedUp;
        public static event System.Action<Item> OnItemUsed;

        void Awake() => Instance = this;

        void Update()
        {
            if (Input.GetKeyDown(useItemKey) && items.Count > 0)
                UseFirstUsableItem();
        }

        public bool TryPickupItem(Item item)
        {
            if (items.Count >= maxSlots) return false;

            items.Add(item);
            OnItemPickedUp?.Invoke(item);
            return true;
        }

        public void UseFirstUsableItem()
        {
            Item usable = items.Find(i =>
                i.type == ItemType.Battery ||
                i.type == ItemType.MedKit ||
                i.type == ItemType.Sedative);

            if (usable != null)
                UseItem(usable);
        }

        public void UseItem(Item item)
        {
            switch (item.type)
            {
                case ItemType.Battery:
                    FlashlightController.Instance?.RechargeBattery(item.value);
                    break;
                case ItemType.MedKit:
                    PlayerHealth.Instance?.Heal(item.value);
                    break;
                case ItemType.Sedative:
                    // Restaurar cordura — el SanitySystem recibe un impulso externo
                    var sanity = SanitySystem.Instance;
                    if (sanity != null)
                    {
                        // Acceso directo vía reflexión no disponible en este contexto,
                        // así que exponemos un método público en SanitySystem
                    }
                    break;
            }

            items.Remove(item);
            OnItemUsed?.Invoke(item);
        }

        public bool HasItem(ItemType type) => items.Exists(i => i.type == type);
        public bool RemoveItem(ItemType type)
        {
            var item = items.Find(i => i.type == type);
            if (item == null) return false;
            items.Remove(item);
            return true;
        }
    }
}
