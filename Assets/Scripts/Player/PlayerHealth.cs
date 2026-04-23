using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Player
{
    public class PlayerHealth : MonoBehaviour
    {
        public static PlayerHealth Instance { get; private set; }

        [Header("Vida")]
        public float maxHealth = 100f;
        [HideInInspector] public float currentHealth;

        [Header("Regeneración")]
        public bool canRegenerate = true;
        public float regenDelay = 8f;
        public float regenRate = 5f;

        [Header("Daño Visual")]
        public UnityEngine.UI.Image damageOverlay;
        public float damageOverlayDuration = 0.5f;

        [Header("Audio")]
        public AudioClip[] hurtSounds;
        public AudioClip deathSound;

        private AudioSource audioSource;
        private float regenTimer = 0f;
        private bool isDead = false;
        private Coroutine damageOverlayCoroutine;

        public static event System.Action<float> OnHealthChanged;
        public static event System.Action OnDeath;

        void Awake()
        {
            Instance = this;
            audioSource = GetComponent<AudioSource>();
            currentHealth = maxHealth;
        }

        void Update()
        {
            if (isDead || !canRegenerate) return;

            regenTimer += Time.deltaTime;
            if (regenTimer >= regenDelay && currentHealth < maxHealth)
            {
                currentHealth += regenRate * Time.deltaTime;
                currentHealth = Mathf.Min(maxHealth, currentHealth);
                OnHealthChanged?.Invoke(currentHealth / maxHealth);
            }
        }

        public void TakeDamage(float amount)
        {
            if (isDead) return;

            currentHealth -= amount;
            currentHealth = Mathf.Max(0f, currentHealth);
            regenTimer = 0f;

            PlayHurtSound();
            ShowDamageOverlay();
            OnHealthChanged?.Invoke(currentHealth / maxHealth);

            if (currentHealth <= 0f)
                Die();
        }

        public void Heal(float amount)
        {
            if (isDead) return;
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            OnHealthChanged?.Invoke(currentHealth / maxHealth);
        }

        void Die()
        {
            isDead = true;
            if (deathSound != null)
                audioSource.PlayOneShot(deathSound);

            OnDeath?.Invoke();
            GameManager.Instance.PlayerDied();
        }

        void PlayHurtSound()
        {
            if (hurtSounds.Length > 0)
                audioSource.PlayOneShot(hurtSounds[Random.Range(0, hurtSounds.Length)], 0.8f);
        }

        void ShowDamageOverlay()
        {
            if (damageOverlay == null) return;
            if (damageOverlayCoroutine != null) StopCoroutine(damageOverlayCoroutine);
            damageOverlayCoroutine = StartCoroutine(FadeDamageOverlay());
        }

        IEnumerator FadeDamageOverlay()
        {
            Color c = damageOverlay.color;
            c.a = 0.6f;
            damageOverlay.color = c;

            float t = 0f;
            while (t < damageOverlayDuration)
            {
                t += Time.deltaTime;
                c.a = Mathf.Lerp(0.6f, 0f, t / damageOverlayDuration);
                damageOverlay.color = c;
                yield return null;
            }
            c.a = 0f;
            damageOverlay.color = c;
        }

        public bool IsDead() => isDead;
        public float GetHealthPercent() => currentHealth / maxHealth;
    }
}
