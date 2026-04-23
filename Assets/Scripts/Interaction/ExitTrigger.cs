using UnityEngine;

namespace PhobiaHorror.Interaction
{
    /// <summary>
    /// Zona de salida del nivel. El jugador debe llegar aquí para escapar.
    /// </summary>
    public class ExitTrigger : MonoBehaviour
    {
        [Header("Requisito de Objetivos")]
        public bool requireAllObjectives = true;

        [Header("Efectos")]
        public ParticleSystem exitParticles;
        public Light exitLight;
        public AudioClip exitSound;
        public AudioClip lockedSound;

        [Header("UI")]
        public GameObject exitLockedUI;
        public GameObject exitOpenUI;

        private AudioSource audioSource;
        private bool isUnlocked = false;

        void Awake()
        {
            audioSource = GetComponent<AudioSource>();
        }

        void Start()
        {
            Objectives.ObjectiveManager.OnAllObjectivesComplete += UnlockExit;

            if (!requireAllObjectives)
                UnlockExit();
            else
                SetLocked();
        }

        void OnDestroy()
        {
            Objectives.ObjectiveManager.OnAllObjectivesComplete -= UnlockExit;
        }

        void UnlockExit()
        {
            isUnlocked = true;
            exitLockedUI?.SetActive(false);
            exitOpenUI?.SetActive(true);
            exitParticles?.Play();
            if (exitLight != null) exitLight.color = Color.green;
        }

        void SetLocked()
        {
            exitLockedUI?.SetActive(true);
            exitOpenUI?.SetActive(false);
            if (exitLight != null) exitLight.color = Color.red;
        }

        void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Player")) return;

            if (isUnlocked)
            {
                audioSource?.PlayOneShot(exitSound);
                Core.LevelManager.Instance?.TriggerExit();
            }
            else
            {
                audioSource?.PlayOneShot(lockedSound, 0.7f);
            }
        }
    }
}
