using UnityEngine;
using System.Collections;
using PhobiaHorror.Core;

namespace PhobiaHorror.Core
{
    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        [Header("Configuración del Nivel")]
        public PhobiaLevel phobiaType;
        public GameMode gameMode;

        [Header("Supervivencia")]
        public float survivalTimeRequired = 180f;
        private float survivalTimer = 0f;

        [Header("Puntos de Spawn y Exit")]
        public Transform playerSpawnPoint;
        public Transform exitPoint;

        [Header("Intro del Nivel")]
        public float introBlackScreenDuration = 3f;
        [TextArea] public string levelIntroText;

        private bool levelActive = false;

        public static event System.Action OnLevelStart;
        public static event System.Action<float> OnSurvivalTimerUpdate;

        void Awake()
        {
            Instance = this;
        }

        void Start()
        {
            StartCoroutine(LevelIntroSequence());
        }

        void Update()
        {
            if (!levelActive) return;

            if (gameMode == GameMode.Survival)
            {
                survivalTimer += Time.deltaTime;
                OnSurvivalTimerUpdate?.Invoke(survivalTimer / survivalTimeRequired);

                if (survivalTimer >= survivalTimeRequired)
                    GameManager.Instance.LevelComplete();
            }
        }

        IEnumerator LevelIntroSequence()
        {
            yield return new WaitForSeconds(introBlackScreenDuration);
            levelActive = true;
            OnLevelStart?.Invoke();
        }

        public void TriggerExit()
        {
            if (gameMode == GameMode.Escape)
                GameManager.Instance.LevelComplete();
        }

        public float GetSurvivalProgress()
        {
            return survivalTimeRequired > 0 ? survivalTimer / survivalTimeRequired : 0f;
        }
    }
}
