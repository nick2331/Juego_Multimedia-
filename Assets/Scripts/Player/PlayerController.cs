using UnityEngine;

namespace PhobiaHorror.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        public static PlayerController Instance { get; private set; }

        [Header("Movimiento")]
        public float walkSpeed = 4f;
        public float sprintSpeed = 7f;
        public float crouchSpeed = 2f;
        public float gravity = -20f;
        public float jumpHeight = 1.2f;

        [Header("Stamina")]
        public float maxStamina = 100f;
        public float staminaDrainRate = 20f;
        public float staminaRegenRate = 15f;
        [HideInInspector] public float currentStamina;

        [Header("Cámara")]
        public Transform cameraHolder;
        public float mouseSensitivity = 2f;
        public float maxLookAngle = 85f;

        [Header("Agacharse")]
        public float standHeight = 1.8f;
        public float crouchHeight = 0.9f;
        public float crouchTransitionSpeed = 8f;

        [Header("Audio del Jugador")]
        public AudioClip[] footstepSounds;
        public AudioClip breathingHeavy;
        public float footstepInterval = 0.5f;

        private CharacterController controller;
        private AudioSource audioSource;
        private Vector3 velocity;
        private float verticalRotation = 0f;
        private bool isCrouching = false;
        private bool isSprinting = false;
        private float footstepTimer = 0f;
        private bool isMovementFrozen = false;

        // Modificadores externos (efectos de fobia)
        [HideInInspector] public float speedMultiplier = 1f;
        [HideInInspector] public float sensitivityMultiplier = 1f;

        void Awake()
        {
            Instance = this;
            controller = GetComponent<CharacterController>();
            audioSource = GetComponent<AudioSource>();
            currentStamina = maxStamina;
        }

        void Update()
        {
            if (isMovementFrozen) return;

            HandleMouseLook();
            HandleMovement();
            HandleCrouch();
            HandleStamina();
            HandleFootsteps();
        }

        void HandleMouseLook()
        {
            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity * sensitivityMultiplier;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity * sensitivityMultiplier;

            transform.Rotate(Vector3.up * mouseX);

            verticalRotation -= mouseY;
            verticalRotation = Mathf.Clamp(verticalRotation, -maxLookAngle, maxLookAngle);
            cameraHolder.localRotation = Quaternion.Euler(verticalRotation, 0f, 0f);
        }

        void HandleMovement()
        {
            float h = Input.GetAxis("Horizontal");
            float v = Input.GetAxis("Vertical");

            isSprinting = Input.GetKey(KeyCode.LeftShift) && currentStamina > 0 && !isCrouching && v > 0;

            float targetSpeed = isCrouching ? crouchSpeed : (isSprinting ? sprintSpeed : walkSpeed);
            targetSpeed *= speedMultiplier;

            Vector3 move = (transform.right * h + transform.forward * v).normalized;
            move *= targetSpeed;

            if (controller.isGrounded && velocity.y < 0)
                velocity.y = -2f;

            if (Input.GetButtonDown("Jump") && controller.isGrounded && !isCrouching)
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);

            velocity.y += gravity * Time.deltaTime;
            controller.Move((move + velocity) * Time.deltaTime);
        }

        void HandleCrouch()
        {
            if (Input.GetKeyDown(KeyCode.LeftControl))
                isCrouching = !isCrouching;

            float targetHeight = isCrouching ? crouchHeight : standHeight;
            controller.height = Mathf.Lerp(controller.height, targetHeight, crouchTransitionSpeed * Time.deltaTime);
        }

        void HandleStamina()
        {
            if (isSprinting)
            {
                currentStamina -= staminaDrainRate * Time.deltaTime;
                currentStamina = Mathf.Max(0f, currentStamina);
            }
            else
            {
                currentStamina += staminaRegenRate * Time.deltaTime;
                currentStamina = Mathf.Min(maxStamina, currentStamina);
            }

            if (currentStamina < 20f && isSprinting)
                PlayBreathingHeavy();
        }

        void HandleFootsteps()
        {
            bool isMoving = controller.velocity.magnitude > 0.5f && controller.isGrounded;
            if (!isMoving) return;

            float interval = isSprinting ? footstepInterval * 0.6f : footstepInterval;
            footstepTimer += Time.deltaTime;

            if (footstepTimer >= interval)
            {
                footstepTimer = 0f;
                if (footstepSounds.Length > 0)
                {
                    int idx = Random.Range(0, footstepSounds.Length);
                    audioSource.PlayOneShot(footstepSounds[idx], 0.6f);
                }
            }
        }

        void PlayBreathingHeavy()
        {
            if (breathingHeavy != null && !audioSource.isPlaying)
                audioSource.PlayOneShot(breathingHeavy, 0.5f);
        }

        public void FreezeMovement(bool freeze) => isMovementFrozen = freeze;
        public bool IsCrouching() => isCrouching;
        public bool IsSprinting() => isSprinting;
        public bool IsMoving() => controller.velocity.magnitude > 0.2f;
        public float GetStaminaPercent() => currentStamina / maxStamina;
    }
}
