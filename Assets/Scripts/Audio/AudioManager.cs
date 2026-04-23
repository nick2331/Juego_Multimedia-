using UnityEngine;
using System.Collections.Generic;

namespace PhobiaHorror.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Fuentes de Audio")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource ambientSource;

        [Header("Música por Fase")]
        public AudioClip menuMusic;
        public AudioClip[] level_calm;
        public AudioClip[] level_chase;
        public AudioClip[] level_tension;
        public AudioClip deathStinger;
        public AudioClip victoryStinger;

        [Header("Configuración")]
        [Range(0f, 1f)] public float masterVolume = 1f;
        [Range(0f, 1f)] public float musicVolume = 0.4f;
        [Range(0f, 1f)] public float sfxVolume = 1f;

        private bool chaseActive = false;
        private float musicFadeTimer = 0f;
        private AudioClip targetClip;

        void Awake()
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void Start()
        {
            Core.GameManager.OnPhaseChanged += HandlePhaseChanged;
            Enemy.EnemyBase.OnEnemyDied += HandleEnemyDied;
        }

        void OnDestroy()
        {
            Core.GameManager.OnPhaseChanged -= HandlePhaseChanged;
            Enemy.EnemyBase.OnEnemyDied -= HandleEnemyDied;
        }

        void Update()
        {
            CheckChaseState();
        }

        void CheckChaseState()
        {
            var enemies = FindObjectsOfType<Enemy.EnemyBase>();
            bool anyChasing = false;
            foreach (var e in enemies)
            {
                if (e.GetState() == Enemy.EnemyState.Chase || e.GetState() == Enemy.EnemyState.Attack)
                {
                    anyChasing = true;
                    break;
                }
            }

            if (anyChasing != chaseActive)
            {
                chaseActive = anyChasing;
                UpdateMusicForChase();
            }
        }

        void UpdateMusicForChase()
        {
            AudioClip[] pool = chaseActive ? level_chase : level_calm;
            if (pool.Length > 0)
                PlayMusic(pool[Random.Range(0, pool.Length)]);
        }

        void HandlePhaseChanged(Core.GamePhase phase)
        {
            switch (phase)
            {
                case Core.GamePhase.MainMenu:
                    PlayMusic(menuMusic);
                    break;
                case Core.GamePhase.Playing:
                    if (level_calm.Length > 0)
                        PlayMusic(level_calm[0]);
                    break;
                case Core.GamePhase.PlayerDead:
                    StopMusic();
                    PlaySFX(deathStinger);
                    break;
                case Core.GamePhase.LevelComplete:
                    PlaySFX(victoryStinger);
                    break;
            }
        }

        void HandleEnemyDied(Enemy.EnemyBase enemy)
        {
            if (!chaseActive && level_tension.Length > 0)
                PlayMusic(level_tension[Random.Range(0, level_tension.Length)]);
        }

        public void PlayMusic(AudioClip clip)
        {
            if (clip == null || (musicSource.clip == clip && musicSource.isPlaying)) return;
            StartCoroutine(FadeToMusic(clip));
        }

        System.Collections.IEnumerator FadeToMusic(AudioClip clip)
        {
            float vol = musicSource.volume;
            while (musicSource.volume > 0.01f)
            {
                musicSource.volume -= Time.deltaTime * 2f;
                yield return null;
            }
            musicSource.Stop();
            musicSource.clip = clip;
            musicSource.Play();
            while (musicSource.volume < musicVolume * masterVolume)
            {
                musicSource.volume += Time.deltaTime * 1.5f;
                yield return null;
            }
            musicSource.volume = musicVolume * masterVolume;
        }

        public void StopMusic() => StartCoroutine(FadeToMusic(null));

        public void PlaySFX(AudioClip clip, float volumeScale = 1f)
        {
            if (clip != null)
                sfxSource.PlayOneShot(clip, sfxVolume * masterVolume * volumeScale);
        }

        public void PlayAmbient(AudioClip clip)
        {
            if (clip == null) return;
            ambientSource.clip = clip;
            ambientSource.loop = true;
            ambientSource.volume = 0.3f * masterVolume;
            ambientSource.Play();
        }
    }
}
