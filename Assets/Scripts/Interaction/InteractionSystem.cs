using UnityEngine;
using TMPro;

namespace PhobiaHorror.Interaction
{
    public interface IInteractable
    {
        string GetInteractionPrompt();
        void Interact(GameObject interactor);
    }

    public class InteractionSystem : MonoBehaviour
    {
        public static InteractionSystem Instance { get; private set; }

        [Header("Configuración")]
        public float interactionRange = 3f;
        public KeyCode interactKey = KeyCode.E;
        public LayerMask interactableMask;

        [Header("UI")]
        public TextMeshProUGUI interactionPromptText;
        public GameObject interactionPromptPanel;

        private Camera playerCamera;
        private IInteractable currentTarget;

        void Awake() => Instance = this;

        void Start()
        {
            playerCamera = Camera.main;
            if (interactionPromptPanel != null)
                interactionPromptPanel.SetActive(false);
        }

        void Update()
        {
            CheckForInteractable();

            if (Input.GetKeyDown(interactKey) && currentTarget != null)
                currentTarget.Interact(gameObject);
        }

        void CheckForInteractable()
        {
            if (playerCamera == null) return;

            Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);
            IInteractable found = null;

            if (Physics.Raycast(ray, out RaycastHit hit, interactionRange, interactableMask))
                found = hit.collider.GetComponent<IInteractable>();

            if (found != currentTarget)
            {
                currentTarget = found;
                UpdatePromptUI();
            }
        }

        void UpdatePromptUI()
        {
            bool hasTarget = currentTarget != null;

            if (interactionPromptPanel != null)
                interactionPromptPanel.SetActive(hasTarget);

            if (hasTarget && interactionPromptText != null)
                interactionPromptText.text = $"[E] {currentTarget.GetInteractionPrompt()}";
        }
    }
}
