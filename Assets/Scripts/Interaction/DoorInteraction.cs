using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Interaction
{
    public class DoorInteraction : MonoBehaviour, IInteractable
    {
        [Header("Puerta")]
        public bool isLocked = false;
        public bool requiresKeyCard = false;
        public bool isOpen = false;

        [Header("Animación")]
        public Transform doorPivot;
        public float openAngle = 90f;
        public float openSpeed = 3f;

        [Header("Audio")]
        public AudioClip openSound;
        public AudioClip closeSound;
        public AudioClip lockedSound;

        private AudioSource audioSource;
        private Quaternion closedRotation;
        private Quaternion openRotation;
        private bool isMoving = false;

        void Awake()
        {
            audioSource = GetComponent<AudioSource>();
            if (doorPivot == null) doorPivot = transform;

            closedRotation = doorPivot.localRotation;
            openRotation = Quaternion.Euler(doorPivot.localEulerAngles + Vector3.up * openAngle);
        }

        public string GetInteractionPrompt()
        {
            if (isLocked) return "Bloqueada";
            return isOpen ? "Cerrar puerta" : "Abrir puerta";
        }

        public void Interact(GameObject interactor)
        {
            if (isMoving) return;

            if (isLocked)
            {
                if (requiresKeyCard)
                {
                    var inv = interactor.GetComponent<Player.InventorySystem>();
                    if (inv != null && inv.RemoveItem(Player.ItemType.KeyCard))
                    {
                        isLocked = false;
                        ToggleDoor();
                    }
                    else
                    {
                        audioSource?.PlayOneShot(lockedSound);
                    }
                }
                else
                {
                    audioSource?.PlayOneShot(lockedSound);
                }
                return;
            }

            ToggleDoor();
        }

        void ToggleDoor()
        {
            isOpen = !isOpen;
            StartCoroutine(AnimateDoor());
        }

        IEnumerator AnimateDoor()
        {
            isMoving = true;
            Quaternion targetRot = isOpen ? openRotation : closedRotation;
            AudioClip clip = isOpen ? openSound : closeSound;

            if (clip != null) audioSource?.PlayOneShot(clip);

            while (Quaternion.Angle(doorPivot.localRotation, targetRot) > 0.5f)
            {
                doorPivot.localRotation = Quaternion.Slerp(
                    doorPivot.localRotation, targetRot, openSpeed * Time.deltaTime);
                yield return null;
            }

            doorPivot.localRotation = targetRot;
            isMoving = false;
        }
    }
}
