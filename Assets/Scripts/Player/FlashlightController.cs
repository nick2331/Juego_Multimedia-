using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Player
{
    public class FlashlightController : MonoBehaviour
    {
        public static FlashlightController Instance { get; private set; }

        [Header("Linterna")]
        public Light flashlight;
        public KeyCode toggleKey = KeyCode.F;

        [Header("Batería")]
        public float maxBattery = 100f;
        public float batteryDrainRate = 3f;
        public float batteryRechargeRate = 0f; // 0 = no recarga automática
        [HideInInspector] public float currentBattery;

        [Header("Efecto de Parpadeo")]
        public float flickerThreshold = 20f;
        public float flickerIntensityMin = 0.3f;
        public float flickerIntensityMax = 1.5f;
        public float flickerSpeed = 0.05f;

        [Header("Luz de la Linterna")]
        public float normalIntensity = 2f;
        public float normalRange = 20f;
        public float batteryLowIntensity = 0.5f;

        [Header("Audio")]
        public AudioClip flashlightToggleSound;
        public AudioClip batteryDeadSound;

        private AudioSource audioSource;
        private bool isOn = true;
        private bool isFlickering = false;
        private Coroutine flickerCoroutine;

        // Modificador externo para Nictofobia
        [HideInInspector] public float drainMultiplier = 1f;

        public static event System.Action<float> OnBatteryChanged;
        public static event System.Action OnFlashlightDead;

        void Awake()
        {
            Instance = this;
            audioSource = GetComponent<AudioSource>();
            currentBattery = maxBattery;

            if (flashlight == null)
                flashlight = GetComponentInChildren<Light>();
        }

        void Update()
        {
            if (Input.GetKeyDown(toggleKey))
                ToggleFlashlight();

            if (isOn)
                DrainBattery();
        }

        void DrainBattery()
        {
            if (currentBattery <= 0f) return;

            currentBattery -= batteryDrainRate * drainMultiplier * Time.deltaTime;
            currentBattery = Mathf.Max(0f, currentBattery);
            OnBatteryChanged?.Invoke(currentBattery / maxBattery);

            if (currentBattery <= flickerThreshold && !isFlickering)
                StartFlicker();

            if (currentBattery <= 0f)
                FlashlightDead();

            // Reducir intensidad con la batería
            float batteryRatio = currentBattery / maxBattery;
            flashlight.intensity = Mathf.Lerp(batteryLowIntensity, normalIntensity, batteryRatio);
        }

        void ToggleFlashlight()
        {
            isOn = !isOn;
            flashlight.enabled = isOn;

            if (flashlightToggleSound != null)
                audioSource.PlayOneShot(flashlightToggleSound);

            if (!isOn && flickerCoroutine != null)
            {
                StopCoroutine(flickerCoroutine);
                isFlickering = false;
            }
        }

        void StartFlicker()
        {
            isFlickering = true;
            if (flickerCoroutine != null) StopCoroutine(flickerCoroutine);
            flickerCoroutine = StartCoroutine(FlickerRoutine());
        }

        IEnumerator FlickerRoutine()
        {
            while (isOn && currentBattery > 0f && currentBattery <= flickerThreshold)
            {
                float intensity = Random.Range(flickerIntensityMin, flickerIntensityMax);
                flashlight.intensity = intensity;
                float waitTime = Random.Range(flickerSpeed * 0.5f, flickerSpeed * 2f);
                yield return new WaitForSeconds(waitTime);
            }

            isFlickering = false;
            flashlight.intensity = normalIntensity;
        }

        void FlashlightDead()
        {
            isOn = false;
            flashlight.enabled = false;
            isFlickering = false;
            if (flickerCoroutine != null) StopCoroutine(flickerCoroutine);

            if (batteryDeadSound != null)
                audioSource.PlayOneShot(batteryDeadSound);

            OnFlashlightDead?.Invoke();
        }

        public void RechargeBattery(float amount)
        {
            currentBattery = Mathf.Min(maxBattery, currentBattery + amount);
            OnBatteryChanged?.Invoke(currentBattery / maxBattery);

            if (currentBattery > flickerThreshold && isFlickering)
            {
                isFlickering = false;
                if (flickerCoroutine != null) StopCoroutine(flickerCoroutine);
                flashlight.intensity = normalIntensity;
            }

            if (currentBattery > 0f && !isOn)
            {
                isOn = true;
                flashlight.enabled = true;
            }
        }

        public bool IsOn() => isOn && currentBattery > 0f;
        public float GetBatteryPercent() => currentBattery / maxBattery;
    }
}
