using UnityEngine;
using UnityEngine.SceneManagement;
using PhobiaHorror.Core;

namespace PhobiaHorror.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Estado del Juego")]
        public GameState state = new GameState();

        [Header("Configuración de Niveles")]
        public string[] levelSceneNames = new string[]
        {
            "Level_Arachnophobia",
            "Level_Claustrophobia",
            "Level_Nyctophobia",
            "Level_Acrophobia"
        };
        public string mainMenuScene = "MainMenu";

        [Header("Cursor")]
        public bool lockCursorOnPlay = true;

        public static event System.Action<GamePhase> OnPhaseChanged;
        public static event System.Action OnPlayerDied;
        public static event System.Action OnLevelCompleted;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void Start()
        {
            SetPhase(GamePhase.MainMenu);
        }

        void Update()
        {
            if (state.currentPhase == GamePhase.Playing)
                state.totalPlayTime += Time.deltaTime;

            if (Input.GetKeyDown(KeyCode.Escape))
                TogglePause();
        }

        public void SetPhase(GamePhase newPhase)
        {
            state.currentPhase = newPhase;

            switch (newPhase)
            {
                case GamePhase.Playing:
                    SetCursorLocked(lockCursorOnPlay);
                    Time.timeScale = 1f;
                    break;
                case GamePhase.Paused:
                    SetCursorLocked(false);
                    Time.timeScale = 0f;
                    break;
                case GamePhase.PlayerDead:
                    SetCursorLocked(false);
                    Time.timeScale = 0.3f;
                    state.deathCount++;
                    OnPlayerDied?.Invoke();
                    break;
                case GamePhase.LevelComplete:
                    SetCursorLocked(false);
                    Time.timeScale = 1f;
                    state.completedLevels++;
                    OnLevelCompleted?.Invoke();
                    break;
            }

            OnPhaseChanged?.Invoke(newPhase);
        }

        public void StartLevel(PhobiaLevel level, GameMode mode)
        {
            state.selectedLevel = level;
            state.selectedMode = mode;
            SetPhase(GamePhase.Playing);
            SceneManager.LoadScene(levelSceneNames[(int)level]);
        }

        public void TogglePause()
        {
            if (state.currentPhase == GamePhase.Playing)
                SetPhase(GamePhase.Paused);
            else if (state.currentPhase == GamePhase.Paused)
                SetPhase(GamePhase.Playing);
        }

        public void PlayerDied()
        {
            SetPhase(GamePhase.PlayerDead);
        }

        public void LevelComplete()
        {
            SetPhase(GamePhase.LevelComplete);
        }

        public void ReturnToMainMenu()
        {
            Time.timeScale = 1f;
            SetPhase(GamePhase.MainMenu);
            SceneManager.LoadScene(mainMenuScene);
        }

        public void RestartLevel()
        {
            Time.timeScale = 1f;
            SetPhase(GamePhase.Playing);
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }

        void SetCursorLocked(bool locked)
        {
            Cursor.lockState = locked ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !locked;
        }
    }
}
