using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.Collections;

namespace PhobiaHorror.Effects
{
    /// <summary>
    /// Controla los efectos de post-procesado en tiempo real.
    /// Requiere un Global Volume con URP en la escena.
    /// </summary>
    public class PostProcessingController : MonoBehaviour
    {
        public static PostProcessingController Instance { get; private set; }

        [Header("Volume")]
        public Volume globalVolume;

        // Componentes de post-procesado
        private Vignette vignette;
        private FilmGrain filmGrain;
        private ChromaticAberration chromaticAberration;
        private ColorAdjustments colorAdjustments;
        private Bloom bloom;
        private LensDistortion lensDistortion;
        private DepthOfField depthOfField;

        [Header("Valores por Defecto")]
        public float defaultVignetteIntensity = 0.35f;
        public float defaultFilmGrainIntensity = 0.35f;
        public float defaultChromaticIntensity = 0.1f;
        public float defaultBloomIntensity = 0.5f;

        [Header("Jump Scare")]
        public float jumpScareChromatic = 1f;
        public float jumpScareBloom = 3f;
        public float jumpScareDuration = 0.2f;

        void Awake()
        {
            Instance = this;

            if (globalVolume == null)
                globalVolume = GetComponent<Volume>();

            if (globalVolume != null)
            {
                globalVolume.profile.TryGet(out vignette);
                globalVolume.profile.TryGet(out filmGrain);
                globalVolume.profile.TryGet(out chromaticAberration);
                globalVolume.profile.TryGet(out colorAdjustments);
                globalVolume.profile.TryGet(out bloom);
                globalVolume.profile.TryGet(out lensDistortion);
                globalVolume.profile.TryGet(out depthOfField);
            }
        }

        void Start()
        {
            Player.SanitySystem.OnLowSanity += HandleLowSanity;
            Player.PlayerHealth.OnHealthChanged += HandleHealthChanged;
        }

        void OnDestroy()
        {
            Player.SanitySystem.OnLowSanity -= HandleLowSanity;
            Player.PlayerHealth.OnHealthChanged -= HandleHealthChanged;
        }

        // ─── Vignette ─────────────────────────────────────────────
        public void SetVignetteIntensity(float intensity)
        {
            if (vignette != null)
                vignette.intensity.value = intensity;
        }

        public void SetVignetteColor(Color color)
        {
            if (vignette != null)
                vignette.color.value = color;
        }

        // ─── Film Grain ───────────────────────────────────────────
        public void SetFilmGrainIntensity(float intensity)
        {
            if (filmGrain != null)
                filmGrain.intensity.value = intensity;
        }

        // ─── Sanity Effects ───────────────────────────────────────
        public void UpdateSanityEffects(float sanityPercent)
        {
            float insanity = 1f - sanityPercent;

            // Desaturar más cuanto menos cordura
            if (colorAdjustments != null)
                colorAdjustments.saturation.value = Mathf.Lerp(0f, -70f, insanity);

            // Chromatic aberration aumenta con la locura
            if (chromaticAberration != null)
                chromaticAberration.intensity.value = Mathf.Lerp(defaultChromaticIntensity, 0.9f, insanity);

            // Lens distortion al borde de la locura
            if (lensDistortion != null)
                lensDistortion.intensity.value = Mathf.Lerp(0f, -0.5f, Mathf.Pow(insanity, 2f));

            // Vignette oscurece
            if (vignette != null)
                vignette.intensity.value = Mathf.Lerp(defaultVignetteIntensity, 0.7f, insanity);
        }

        void HandleLowSanity(bool isLow)
        {
            if (filmGrain != null)
                filmGrain.intensity.value = isLow ? 0.6f : defaultFilmGrainIntensity;
        }

        void HandleHealthChanged(float healthPercent)
        {
            // Pantalla más roja/oscura con poca vida
            if (colorAdjustments != null)
                colorAdjustments.colorFilter.value = Color.Lerp(Color.white, new Color(0.8f, 0.2f, 0.2f),
                                                                  1f - healthPercent);
        }

        // ─── Jump Scare ───────────────────────────────────────────
        public void TriggerJumpScare()
        {
            StartCoroutine(JumpScareRoutine());
        }

        IEnumerator JumpScareRoutine()
        {
            if (chromaticAberration != null) chromaticAberration.intensity.value = jumpScareChromatic;
            if (bloom != null) bloom.intensity.value = jumpScareBloom;
            if (lensDistortion != null) lensDistortion.intensity.value = -0.3f;

            yield return new WaitForSeconds(jumpScareDuration);

            float t = 0f;
            while (t < 0.5f)
            {
                t += Time.deltaTime;
                float ratio = t / 0.5f;
                if (chromaticAberration != null)
                    chromaticAberration.intensity.value = Mathf.Lerp(jumpScareChromatic, defaultChromaticIntensity, ratio);
                if (bloom != null)
                    bloom.intensity.value = Mathf.Lerp(jumpScareBloom, defaultBloomIntensity, ratio);
                if (lensDistortion != null)
                    lensDistortion.intensity.value = Mathf.Lerp(-0.3f, 0f, ratio);
                yield return null;
            }
        }
    }
}
