using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace PhobiaHorror.Phobias
{
    /// <summary>
    /// Efectos del nivel Aracnofobia:
    /// - Arañas decorativas que se mueven en las paredes/techo
    /// - Telarañas en el campo visual
    /// - Sonidos de patas y crujidos
    /// - Jump scare de araña en pantalla
    /// </summary>
    public class ArachnophobiaEffect : PhobiaEffectBase
    {
        [Header("Arañas Decorativas")]
        public GameObject decorativeSpiderPrefab;
        public Transform[] wallCrawlPositions;
        public int decorativeSpiderCount = 8;
        public float spiderMoveSpeed = 0.5f;

        [Header("Telarañas en Pantalla")]
        public UnityEngine.UI.Image[] webOverlays;
        public float webAppearanceThreshold = 0.4f;

        [Header("Jump Scare")]
        public UnityEngine.UI.Image jumpScareImage;
        public Sprite[] jumpScareSprites;
        public float jumpScareDuration = 0.15f;
        public float jumpScareInterval = 90f;

        [Header("Efectos de Ambiente")]
        public GameObject[] webDecorPrefabs;
        public AudioClip[] spiderSkitterSounds;
        public AudioClip webTearSound;

        [Header("Luz Parpadeante")]
        public Light[] flickeringLights;
        public float flickerFrequency = 0.1f;

        private AudioSource audioSource;
        private List<GameObject> spawnedSpiders = new List<GameObject>();
        private float jumpScareTimer = 0f;
        private float flickerTimer = 0f;

        protected override void Start()
        {
            base.Start();
            audioSource = GetComponent<AudioSource>();
        }

        void Update()
        {
            if (!isActive) return;

            jumpScareTimer += Time.deltaTime;
            HandleFlickeringLights();

            // Incrementar intensidad basada en arañas cercanas
            var spawnMgr = FindObjectOfType<Enemy.SpiderSpawnManager>();
            if (spawnMgr != null)
            {
                float ratio = (float)spawnMgr.GetActiveSpiderCount() / 6f;
                intensity = Mathf.Lerp(intensity, ratio, Time.deltaTime * 0.5f);
                ApplyEffect(intensity);
            }

            if (jumpScareTimer >= jumpScareInterval)
            {
                jumpScareTimer = 0f;
                StartCoroutine(TriggerJumpScare());
            }

            UpdateWebOverlays();
        }

        protected override void ApplyEffect(float t)
        {
            // Oscurecer la pantalla ligeramente cuantas más arañas hay
        }

        void UpdateWebOverlays()
        {
            foreach (var web in webOverlays)
            {
                if (web == null) continue;
                float targetAlpha = intensity >= webAppearanceThreshold ?
                    Mathf.InverseLerp(webAppearanceThreshold, 1f, intensity) * 0.6f : 0f;
                Color c = web.color;
                c.a = Mathf.Lerp(c.a, targetAlpha, Time.deltaTime * 2f);
                web.color = c;
            }
        }

        void HandleFlickeringLights()
        {
            flickerTimer += Time.deltaTime;
            if (flickerTimer >= flickerFrequency)
            {
                flickerTimer = 0f;
                foreach (var light in flickeringLights)
                {
                    if (light == null) continue;
                    light.intensity = Random.Range(0.5f, 1.8f);
                }
            }
        }

        IEnumerator TriggerJumpScare()
        {
            if (jumpScareImage == null || jumpScareSprites.Length == 0) yield break;

            jumpScareImage.sprite = jumpScareSprites[Random.Range(0, jumpScareSprites.Length)];
            Color c = jumpScareImage.color;
            c.a = 1f;
            jumpScareImage.color = c;

            // Vibrar cámara (señal al PostFX)
            Effects.PostProcessingController.Instance?.TriggerJumpScare();

            if (spiderSkitterSounds.Length > 0)
                audioSource.PlayOneShot(spiderSkitterSounds[Random.Range(0, spiderSkitterSounds.Length)], 1f);

            yield return new WaitForSeconds(jumpScareDuration);

            // Desvanecer
            float t = 0f;
            while (t < 0.3f)
            {
                t += Time.deltaTime;
                c.a = Mathf.Lerp(1f, 0f, t / 0.3f);
                jumpScareImage.color = c;
                yield return null;
            }
            c.a = 0f;
            jumpScareImage.color = c;
        }

        public override void Activate()
        {
            base.Activate();
            SpawnDecorativeSpiders();
        }

        void SpawnDecorativeSpiders()
        {
            if (decorativeSpiderPrefab == null || wallCrawlPositions.Length == 0) return;

            for (int i = 0; i < decorativeSpiderCount; i++)
            {
                int idx = Random.Range(0, wallCrawlPositions.Length);
                var sp = Instantiate(decorativeSpiderPrefab, wallCrawlPositions[idx].position,
                                     Quaternion.identity, transform);
                spawnedSpiders.Add(sp);
            }
        }
    }
}
