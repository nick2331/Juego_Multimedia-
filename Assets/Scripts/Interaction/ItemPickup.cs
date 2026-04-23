using UnityEngine;

namespace PhobiaHorror.Interaction
{
    public class ItemPickup : MonoBehaviour, IInteractable
    {
        [Header("Ítem")]
        public Player.Item itemData;

        [Header("Efectos")]
        public AudioClip pickupSound;
        public GameObject pickupFX;
        public float bobSpeed = 2f;
        public float bobAmount = 0.1f;

        private Vector3 startPos;
        private AudioSource audioSource;

        void Awake()
        {
            startPos = transform.position;
            audioSource = GetComponent<AudioSource>();
        }

        void Update()
        {
            // Efecto de flotado
            transform.position = startPos + Vector3.up * (Mathf.Sin(Time.time * bobSpeed) * bobAmount);
            transform.Rotate(Vector3.up * 60f * Time.deltaTime);
        }

        public string GetInteractionPrompt() => $"Recoger {itemData?.itemName ?? "ítem"}";

        public void Interact(GameObject interactor)
        {
            var inv = interactor.GetComponent<Player.InventorySystem>();
            if (inv == null || itemData == null) return;

            if (inv.TryPickupItem(itemData))
            {
                if (pickupFX != null) Instantiate(pickupFX, transform.position, Quaternion.identity);
                if (pickupSound != null) AudioSource.PlayClipAtPoint(pickupSound, transform.position);
                Destroy(gameObject);
            }
        }
    }
}
