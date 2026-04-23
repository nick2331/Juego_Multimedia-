using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Phobias
{
    /// <summary>
    /// Efectos del nivel Claustrofobia:
    /// - Paredes que parecen cerrarse (vignette pulsante + FOV reducido)
    /// - Latido de corazón que se acelera
    /// - Respiración pesada
    /// - Sonidos de crujidos estructurales
    /// - El jugador se mueve más lento en pasillos muy estrechos
    /// </summary>
    public class ClaustrophobiaEffect : PhobiaEffectBase
    {
        [Header("Efecto de Paredes Cerrándose")]
        public float normalFOV = 75f;
        public float claustroFOV = 55f;
        public float fovPulseSpeed = 1.2f;
        public float fovPulseAmount = 3f;

        [Header("Pulso de Vignette")]
        public float vignetteMinIntensity = 0.35f;
        public float vignetteMaxIntensity = 0.7f;
        public float vignettePulseSpeed = 1f;

        [Header("Latido")]
        public AudioClip heartbeatSlow;
        public AudioClip heartbeatFast;
        public AudioClip heavyBreathing;
        public AudioClip wallCreakSound;

        [Header("Detección de Espacio")]
        public float openSpaceRadius = 4f;
        public float tightSpaceSlowMultiplier = 0.6f;
        public LayerMask wallLayerMask;

        private Camera playerCamera;
        private AudioSource heartbeatSource;
        private AudioSource ambientSource;
        private Effects.PostProcessingController postFX;

        private float pulseTimer = 0f;
        private float wallCreakTimer = 0f;
        private bool inTightSpace = false;

        protected override void Start()
        {
            base.Start();

            var playerCam = Camera.main;
            if (playerCam != null) playerCamera = playerCam;

            var sources = GetComponents<AudioSource>();
            if (sources.Length >= 2)
            {
                heartbeatSource = sources[0];
                ambientSource = sources[1];
            }
            else
            {
                heartbeatSource = gameObject.AddComponent<AudioSource>();
                ambientSource = gameObject.AddComponent<AudioSource>();
            }

            postFX = Effects.PostProcessingController.Instance;
        }

        void Update()
        {
            if (!isActive) return;

            CheckTightSpace();
            PulseFOV();
            PulseVignette();
            HandleHeartbeat();
            HandleWallCreaks();
        }

        void CheckTightSpace()
        {
            if (Player.PlayerController.Instance == null) return;
            Vector3 pos = Player.PlayerController.Instance.transform.position;

            // Medir espacio libre en las 4 direcciones horizontales
            int blockedDirections = 0;
            Vector3[] dirs = { Vector3.forward, Vector3.back, Vector3.left, Vector3.right };
            foreach (var dir in dirs)
            {
                if (Physics.Raycast(pos, dir, openSpaceRadius, wallLayerMask))
                    blockedDirections++;
            }

            float tightness = blockedDirections / 4f;
            inTightSpace = tightness >= 0.5f;
            intensity = Mathf.Lerp(intensity, tightness, Time.deltaTime * 1.5f);

            // Ralentizar al jugador en espacios apretados
            var pc = Player.PlayerController.Instance;
            if (pc != null)
                pc.speedMultiplier = inTightSpace ? tightSpaceSlowMultiplier : 1f;

            ApplyEffect(intensity);
        }

        protected override void ApplyEffect(float t)
        {
            postFX?.SetVignetteIntensity(Mathf.Lerp(0.3f, vignetteMaxIntensity, t));
        }

        void PulseFOV()
        {
            if (playerCamera == null) return;
            pulseTimer += Time.deltaTime * fovPulseSpeed;

            float targetFOV = Mathf.Lerp(normalFOV, claustroFOV, intensity);
            float pulse = Mathf.Sin(pulseTimer) * fovPulseAmount * intensity;
            playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFOV + pulse, Time.deltaTime * 3f);
        }

        void PulseVignette()
        {
            float pulseValue = Mathf.Sin(pulseTimer * vignettePulseSpeed) * 0.5f + 0.5f;
            float vigIntensity = Mathf.Lerp(vignetteMinIntensity, vignetteMaxIntensity, pulseValue * intensity);
            postFX?.SetVignetteIntensity(vigIntensity);
        }

        void HandleHeartbeat()
        {
            if (heartbeatSource == null) return;

            if (intensity > 0.3f && !heartbeatSource.isPlaying)
            {
                heartbeatSource.clip = intensity > 0.6f ? heartbeatFast : heartbeatSlow;
                heartbeatSource.loop = true;
                heartbeatSource.volume = Mathf.Lerp(0f, 0.9f, intensity);
                heartbeatSource.Play();
            }
            else if (intensity <= 0.3f && heartbeatSource.isPlaying)
            {
                heartbeatSource.Stop();
            }

            if (heartbeatSource.isPlaying)
                heartbeatSource.volume = Mathf.Lerp(heartbeatSource.volume, intensity * 0.9f, Time.deltaTime);
        }

        void HandleWallCreaks()
        {
            wallCreakTimer += Time.deltaTime;
            float creatInterval = Mathf.Lerp(20f, 5f, intensity);

            if (wallCreakTimer >= creatInterval && wallCreakSound != null)
            {
                wallCreakTimer = 0f;
                ambientSource.PlayOneShot(wallCreakSound, Random.Range(0.4f, 0.9f));
            }
        }
    }
}
