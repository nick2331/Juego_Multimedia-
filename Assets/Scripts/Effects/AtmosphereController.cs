using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace PhobiaHorror.Effects
{
    /// <summary>
    /// Controla las luces del ambiente: parpadeos, apagados, etc.
    /// Crea la atmósfera de horror estilo Lethal Company.
    /// </summary>
    public class AtmosphereController : MonoBehaviour
    {
        [Header("Luces de Ambiente")]
        public List<Light> environmentLights = new List<Light>();
        public float flickerChance = 0.3f;
        public float flickerInterval = 8f;
        public float outageChance = 0.1f;
        public float outageDuration = 2f;

        [Header("Niebla")]
        public bool manageFog = true;
        public float fogStart = 5f;
        public float fogEnd = 35f;
        public Color normalFogColor = new Color(0.05f, 0.05f, 0.07f);
        public Color alertFogColor = new Color(0.08f, 0.02f, 0.02f);

        [Header("Audio Ambiente")]
        public AudioClip ambientHumSound;
        public AudioClip electricSparkSound;
        public float sparkInterval = 20f;

        private AudioSource audioSource;
        private float flickerTimer = 0f;
        private float sparkTimer = 0f;
        private bool powerOutage = false;
        private List<float> originalIntensities = new List<float>();
        private bool enemyNearby = false;

        void Start()
        {
            audioSource = GetComponent<AudioSource>();

            foreach (var light in environmentLights)
                originalIntensities.Add(light != null ? light.intensity : 1f);

            if (manageFog)
            {
                RenderSettings.fog = true;
                RenderSettings.fogMode = FogMode.Linear;
                RenderSettings.fogStartDistance = fogStart;
                RenderSettings.fogEndDistance = fogEnd;
                RenderSettings.fogColor = normalFogColor;
            }

            if (ambientHumSound != null)
            {
                audioSource.clip = ambientHumSound;
                audioSource.loop = true;
                audioSource.volume = 0.3f;
                audioSource.Play();
            }

            Core.LevelManager.OnLevelStart += OnLevelStart;
        }

        void OnDestroy()
        {
            Core.LevelManager.OnLevelStart -= OnLevelStart;
        }

        void OnLevelStart()
        {
            StartCoroutine(RandomFlickerRoutine());
        }

        void Update()
        {
            CheckEnemyProximity();
            UpdateFogColor();

            sparkTimer += Time.deltaTime;
            if (sparkTimer >= sparkInterval && electricSparkSound != null)
            {
                sparkTimer = 0f;
                audioSource.PlayOneShot(electricSparkSound, Random.Range(0.2f, 0.5f));
            }
        }

        void CheckEnemyProximity()
        {
            var player = Player.PlayerController.Instance;
            if (player == null) return;

            Collider[] hits = Physics.OverlapSphere(player.transform.position, 15f);
            enemyNearby = false;
            foreach (var hit in hits)
            {
                if (hit.CompareTag("Enemy")) { enemyNearby = true; break; }
            }
        }

        void UpdateFogColor()
        {
            Color target = enemyNearby ? alertFogColor : normalFogColor;
            RenderSettings.fogColor = Color.Lerp(RenderSettings.fogColor, target, Time.deltaTime * 0.5f);
        }

        IEnumerator RandomFlickerRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(Random.Range(flickerInterval * 0.5f, flickerInterval * 1.5f));

                if (powerOutage) continue;

                if (Random.value < outageChance)
                    yield return StartCoroutine(PowerOutage());
                else if (Random.value < flickerChance)
                    yield return StartCoroutine(FlickerLights());
            }
        }

        IEnumerator FlickerLights()
        {
            int flickerCount = Random.Range(3, 8);
            for (int i = 0; i < flickerCount; i++)
            {
                SetAllLights(Random.Range(0.1f, 0.5f));
                yield return new WaitForSeconds(Random.Range(0.05f, 0.15f));
                RestoreLights();
                yield return new WaitForSeconds(Random.Range(0.05f, 0.1f));
            }
        }

        IEnumerator PowerOutage()
        {
            powerOutage = true;
            SetAllLights(0f);
            yield return new WaitForSeconds(outageDuration);
            powerOutage = false;

            // Restaurar con parpadeos
            yield return StartCoroutine(FlickerLights());
            RestoreLights();
        }

        void SetAllLights(float intensity)
        {
            foreach (var light in environmentLights)
                if (light != null) light.intensity = intensity;
        }

        void RestoreLights()
        {
            for (int i = 0; i < environmentLights.Count; i++)
            {
                if (environmentLights[i] != null && i < originalIntensities.Count)
                    environmentLights[i].intensity = originalIntensities[i];
            }
        }
    }
}
