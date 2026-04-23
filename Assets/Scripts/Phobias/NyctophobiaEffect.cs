using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Phobias
{
    /// <summary>
    /// Efectos del nivel Nictofobia:
    /// - Oscuridad casi total, solo la linterna ilumina
    /// - La batería drena más rápido
    /// - Sonidos en la oscuridad
    /// - Sombras que se mueven cuando no miras
    /// - El enemigo solo es visible en la luz de la linterna
    /// </summary>
    public class NyctophobiaEffect : PhobiaEffectBase
    {
        [Header("Oscuridad")]
        public float ambientLightIntensity = 0.02f;
        public Color ambientLightColor = new Color(0.02f, 0.02f, 0.05f);

        [Header("Linterna")]
        public float batteryDrainMultiplier = 2.5f;
        public float flashlightRange = 14f;
        public float flashlightAngle = 45f;

        [Header("Enemigo Invisible en Oscuridad")]
        public GameObject shadowEntityPrefab;
        private GameObject shadowEntity;

        [Header("Sonidos en la Oscuridad")]
        public AudioClip[] darkSounds;
        public AudioClip whisperSound;
        public float darkSoundInterval = 12f;

        [Header("Sombras Que Se Mueven")]
        public GameObject[] shadowObjects;
        public float shadowMoveRadius = 8f;

        [Header("Niebla")]
        public float fogDensityInDark = 0.08f;
        public float fogDensityInLight = 0.03f;
        public Color fogColor = new Color(0f, 0f, 0.02f);

        private AudioSource audioSource;
        private Effects.PostProcessingController postFX;
        private float darkSoundTimer = 0f;
        private float shadowMoveTimer = 0f;
        private bool playerInDark = false;

        protected override void Start()
        {
            base.Start();
            audioSource = GetComponent<AudioSource>();
            postFX = Effects.PostProcessingController.Instance;
        }

        public override void Activate()
        {
            base.Activate();
            ConfigureDarkEnvironment();
            ConfigureFlashlight();
        }

        void ConfigureDarkEnvironment()
        {
            RenderSettings.ambientLight = ambientLightColor;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Exponential;
            RenderSettings.fogDensity = fogDensityInDark;
            RenderSettings.fogColor = fogColor;
        }

        void ConfigureFlashlight()
        {
            var flashlight = Player.FlashlightController.Instance;
            if (flashlight == null) return;

            flashlight.drainMultiplier = batteryDrainMultiplier;

            if (flashlight.flashlight != null)
            {
                flashlight.flashlight.range = flashlightRange;
                flashlight.flashlight.spotAngle = flashlightAngle;
            }
        }

        void Update()
        {
            if (!isActive) return;

            CheckPlayerInDark();
            HandleDarkSounds();
            AnimateShadowObjects();
            UpdateFog();
        }

        void CheckPlayerInDark()
        {
            var flashlight = Player.FlashlightController.Instance;
            playerInDark = flashlight == null || !flashlight.IsOn();
            intensity = playerInDark ? Mathf.Min(1f, intensity + Time.deltaTime * 0.5f)
                                     : Mathf.Max(0f, intensity - Time.deltaTime);
            ApplyEffect(intensity);
        }

        protected override void ApplyEffect(float t)
        {
            postFX?.SetFilmGrainIntensity(Mathf.Lerp(0.3f, 0.8f, t));
        }

        void HandleDarkSounds()
        {
            if (!playerInDark) return;

            darkSoundTimer += Time.deltaTime;
            if (darkSoundTimer >= darkSoundInterval && darkSounds.Length > 0)
            {
                darkSoundTimer = 0f;
                audioSource.PlayOneShot(darkSounds[Random.Range(0, darkSounds.Length)],
                                        Random.Range(0.3f, 0.7f));
            }
        }

        void AnimateShadowObjects()
        {
            // Mover sombras decorativas solo cuando el jugador no las mira directamente
            shadowMoveTimer += Time.deltaTime;
            if (shadowMoveTimer < 3f) return;
            shadowMoveTimer = 0f;

            Camera cam = Camera.main;
            if (cam == null) return;

            foreach (var shadow in shadowObjects)
            {
                if (shadow == null) continue;
                Vector3 viewPos = cam.WorldToViewportPoint(shadow.transform.position);
                bool onScreen = viewPos.z > 0 && viewPos.x > 0.1f && viewPos.x < 0.9f
                                               && viewPos.y > 0.1f && viewPos.y < 0.9f;
                if (!onScreen)
                {
                    // Teletransportar la sombra a otra posición
                    Vector3 randomOffset = Random.insideUnitSphere * shadowMoveRadius;
                    randomOffset.y = 0f;
                    shadow.transform.position = Player.PlayerController.Instance.transform.position + randomOffset;
                }
            }
        }

        void UpdateFog()
        {
            float targetDensity = playerInDark ? fogDensityInDark : fogDensityInLight;
            RenderSettings.fogDensity = Mathf.Lerp(RenderSettings.fogDensity, targetDensity, Time.deltaTime);
        }
    }
}
