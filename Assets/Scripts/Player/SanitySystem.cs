using UnityEngine;
using System.Collections;
using PhobiaHorror.Effects;

namespace PhobiaHorror.Player
{
    /// <summary>
    /// Sistema de cordura: decrece cerca del monstruo o en la oscuridad.
    /// Al llegar a 0 el jugador muere de terror.
    /// </summary>
    public class SanitySystem : MonoBehaviour
    {
        public static SanitySystem Instance { get; private set; }

        [Header("Cordura")]
        public float maxSanity = 100f;
        public float currentSanity { get; private set; }

        [Header("Pérdida de Cordura")]
        public float sanityLossInDark = 2f;
        public float sanityLossNearEnemy = 15f;
        public float sanityLossNearEnemyRadius = 12f;

        [Header("Recuperación")]
        public float sanityRegenRate = 4f;
        public float sanityRegenDelay = 5f;

        [Header("Efectos por Umbral")]
        [Range(0, 100)] public float lowSanityThreshold = 40f;
        [Range(0, 100)] public float criticalSanityThreshold = 20f;

        [Header("Audio de Alucinaciones")]
        public AudioClip[] hallucinationSounds;
        public float hallucinationInterval = 15f;

        private AudioSource audioSource;
        private float regenTimer = 0f;
        private float hallucinationTimer = 0f;
        private bool inDark = false;
        private bool nearEnemy = false;
        private PostProcessingController postFX;

        public static event System.Action<float> OnSanityChanged;
        public static event System.Action OnSanityDepleted;
        public static event System.Action<bool> OnLowSanity;

        void Awake()
        {
            Instance = this;
            audioSource = GetComponent<AudioSource>();
            currentSanity = maxSanity;
        }

        void Start()
        {
            postFX = FindObjectOfType<PostProcessingController>();
        }

        void Update()
        {
            CheckDarkness();
            CheckEnemyProximity();
            UpdateSanity();
            HandleHallucinations();
        }

        void CheckDarkness()
        {
            var flashlight = FlashlightController.Instance;
            inDark = flashlight == null || !flashlight.IsOn();
        }

        void CheckEnemyProximity()
        {
            Collider[] hits = Physics.OverlapSphere(transform.position, sanityLossNearEnemyRadius);
            nearEnemy = false;
            foreach (var hit in hits)
            {
                if (hit.CompareTag("Enemy"))
                {
                    nearEnemy = true;
                    break;
                }
            }
        }

        void UpdateSanity()
        {
            bool losing = false;

            if (inDark)
            {
                LoseSanity(sanityLossInDark * Time.deltaTime);
                losing = true;
            }

            if (nearEnemy)
            {
                LoseSanity(sanityLossNearEnemy * Time.deltaTime);
                losing = true;
            }

            if (!losing)
            {
                regenTimer += Time.deltaTime;
                if (regenTimer >= sanityRegenDelay)
                {
                    currentSanity += sanityRegenRate * Time.deltaTime;
                    currentSanity = Mathf.Min(maxSanity, currentSanity);
                    OnSanityChanged?.Invoke(currentSanity / maxSanity);
                }
            }
            else
            {
                regenTimer = 0f;
            }

            // Actualizar efectos visuales
            postFX?.UpdateSanityEffects(currentSanity / maxSanity);

            bool isLow = currentSanity < lowSanityThreshold;
            OnLowSanity?.Invoke(isLow);
        }

        void LoseSanity(float amount)
        {
            currentSanity -= amount;
            currentSanity = Mathf.Max(0f, currentSanity);
            regenTimer = 0f;
            OnSanityChanged?.Invoke(currentSanity / maxSanity);

            if (currentSanity <= 0f)
            {
                OnSanityDepleted?.Invoke();
                PlayerHealth.Instance?.TakeDamage(999f);
            }
        }

        void HandleHallucinations()
        {
            if (currentSanity > lowSanityThreshold) return;

            hallucinationTimer += Time.deltaTime;
            float interval = Mathf.Lerp(hallucinationInterval * 0.3f, hallucinationInterval,
                                         currentSanity / lowSanityThreshold);

            if (hallucinationTimer >= interval)
            {
                hallucinationTimer = 0f;
                PlayHallucinationSound();
            }
        }

        void PlayHallucinationSound()
        {
            if (hallucinationSounds.Length == 0) return;
            var clip = hallucinationSounds[Random.Range(0, hallucinationSounds.Length)];
            audioSource.PlayOneShot(clip, Random.Range(0.3f, 0.8f));
        }

        public float GetSanityPercent() => currentSanity / maxSanity;
        public bool IsCritical() => currentSanity < criticalSanityThreshold;
    }
}
