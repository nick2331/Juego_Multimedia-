using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Phobias
{
    /// <summary>
    /// Efectos del nivel Acrofobia:
    /// - Vértigo al mirar hacia abajo desde alturas
    /// - Tambaleo de cámara proporcional a la altura
    /// - Sonido de viento que aumenta con la altura
    /// - FOV que reduce al asomarse a bordes
    /// - Daño por caída
    /// </summary>
    public class AcrophobiaEffect : PhobiaEffectBase
    {
        [Header("Alturas")]
        public float groundLevel = 0f;
        public float maxHeightEffect = 40f;
        public float vertigoDistanceFromEdge = 1.5f;

        [Header("Vértigo Visual")]
        public float vertigoFOVReduction = 20f;
        public float cameraSwayAmount = 2f;
        public float cameraSwaySpeed = 1.5f;

        [Header("Color al Borde")]
        public Color edgeVignetteColor = new Color(0f, 0f, 0f, 1f);

        [Header("Daño por Caída")]
        public float fallDamageThreshold = 6f;
        public float fallDamageMultiplier = 10f;

        [Header("Viento")]
        public AudioClip windSound;
        public float windMaxVolume = 0.8f;

        [Header("Sonidos de Vértigo")]
        public AudioClip vertigoSound;
        public AudioClip heartbeatSound;

        private Camera playerCamera;
        private AudioSource windSource;
        private AudioSource sfxSource;
        private Effects.PostProcessingController postFX;
        private Player.PlayerController playerController;

        private float baseHeight = 0f;
        private float currentHeight = 0f;
        private float heightRatio = 0f;
        private float swayTimer = 0f;
        private bool nearEdge = false;
        private float lastGroundedY = 0f;
        private bool wasGrounded = true;
        private float fallStartY = 0f;

        protected override void Start()
        {
            base.Start();
            playerCamera = Camera.main;
            postFX = Effects.PostProcessingController.Instance;
            playerController = Player.PlayerController.Instance;

            var sources = GetComponents<AudioSource>();
            windSource = sources.Length > 0 ? sources[0] : gameObject.AddComponent<AudioSource>();
            sfxSource  = sources.Length > 1 ? sources[1] : gameObject.AddComponent<AudioSource>();

            if (windSound != null)
            {
                windSource.clip = windSound;
                windSource.loop = true;
                windSource.volume = 0f;
                windSource.Play();
            }
        }

        void Update()
        {
            if (!isActive || playerController == null) return;

            MeasureHeight();
            CheckEdgeProximity();
            ApplyCameraSway();
            UpdateWindSound();
            CheckFallDamage();
            ApplyEffect(intensity);
        }

        void MeasureHeight()
        {
            currentHeight = playerController.transform.position.y - groundLevel;
            heightRatio = Mathf.Clamp01(currentHeight / maxHeightEffect);
            intensity = Mathf.Lerp(intensity, heightRatio, Time.deltaTime * 2f);
        }

        void CheckEdgeProximity()
        {
            if (playerCamera == null) return;

            // Raycast hacia abajo desde la posición del jugador
            bool hitGround = Physics.Raycast(
                playerController.transform.position,
                Vector3.down,
                vertigoDistanceFromEdge + currentHeight,
                ~0,
                QueryTriggerInteraction.Ignore);

            nearEdge = !hitGround && heightRatio > 0.1f;

            if (nearEdge)
            {
                postFX?.SetVignetteColor(edgeVignetteColor);
                postFX?.SetVignetteIntensity(Mathf.Lerp(0.3f, 0.65f, heightRatio));

                // Reducir FOV al borde
                playerCamera.fieldOfView = Mathf.Lerp(
                    playerCamera.fieldOfView,
                    75f - vertigoFOVReduction * heightRatio,
                    Time.deltaTime * 4f);
            }
            else
            {
                playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, 75f, Time.deltaTime * 3f);
            }
        }

        void ApplyCameraSway()
        {
            if (playerCamera == null || !nearEdge) return;

            swayTimer += Time.deltaTime * cameraSwaySpeed;
            float swayAmount = cameraSwayAmount * heightRatio;
            float swayX = Mathf.Sin(swayTimer) * swayAmount;
            float swayY = Mathf.Cos(swayTimer * 0.7f) * swayAmount * 0.5f;

            playerCamera.transform.localRotation = Quaternion.Euler(
                playerCamera.transform.localRotation.eulerAngles.x + swayY,
                playerCamera.transform.localRotation.eulerAngles.y,
                swayX);
        }

        void UpdateWindSound()
        {
            windSource.volume = Mathf.Lerp(windSource.volume, heightRatio * windMaxVolume, Time.deltaTime * 2f);
        }

        void CheckFallDamage()
        {
            bool grounded = IsGrounded();

            if (!wasGrounded && grounded)
            {
                float fallDistance = fallStartY - playerController.transform.position.y;
                if (fallDistance > fallDamageThreshold)
                {
                    float damage = (fallDistance - fallDamageThreshold) * fallDamageMultiplier;
                    Player.PlayerHealth.Instance?.TakeDamage(damage);
                }
            }

            if (!grounded && wasGrounded)
                fallStartY = playerController.transform.position.y;

            wasGrounded = grounded;
        }

        bool IsGrounded()
        {
            return Physics.Raycast(playerController.transform.position, Vector3.down, 1.2f);
        }

        protected override void ApplyEffect(float t)
        {
            // Los efectos principales se aplican en los métodos anteriores
            if (t > 0.6f && heartbeatSound != null && !sfxSource.isPlaying)
                sfxSource.PlayOneShot(heartbeatSound, t * 0.7f);
        }
    }
}
