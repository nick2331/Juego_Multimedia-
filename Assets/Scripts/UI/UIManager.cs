using UnityEngine;
using System.Collections;

namespace PhobiaHorror.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Paneles")]
        public GameObject hudPanel;
        public GameObject pausePanel;
        public GameObject deathPanel;
        public GameObject victoryPanel;
        public GameObject levelSelectPanel;

        [Header("Pantalla de Muerte")]
        public UnityEngine.UI.Image deathFadeOverlay;
        public TMPro.TextMeshProUGUI deathMessageText;
        public string[] deathMessages = {
            "La oscuridad te consumió...",
            "No escapaste...",
            "El terror ganó...",
            "Tu cordura se desmoronó..."
        };

        [Header("Transición")]
        public UnityEngine.UI.Image blackFadePanel;
        public float fadeDuration = 1.5f;

        void Awake()
        {
            Instance = this;
        }

        void Start()
        {
            Core.GameManager.OnPhaseChanged += HandlePhaseChanged;
            Player.PlayerHealth.OnDeath += ShowDeathScreen;
            Core.GameManager.OnLevelCompleted += ShowVictoryScreen;
        }

        void OnDestroy()
        {
            Core.GameManager.OnPhaseChanged -= HandlePhaseChanged;
            Player.PlayerHealth.OnDeath -= ShowDeathScreen;
            Core.GameManager.OnLevelCompleted -= ShowVictoryScreen;
        }

        void HandlePhaseChanged(Core.GamePhase phase)
        {
            hudPanel?.SetActive(phase == Core.GamePhase.Playing);
            pausePanel?.SetActive(phase == Core.GamePhase.Paused);
        }

        void ShowDeathScreen()
        {
            StartCoroutine(DeathSequence());
        }

        IEnumerator DeathSequence()
        {
            yield return new WaitForSecondsRealtime(1f);

            if (deathFadeOverlay != null)
            {
                Color c = deathFadeOverlay.color;
                float t = 0f;
                while (t < fadeDuration)
                {
                    t += Time.unscaledDeltaTime;
                    c.a = Mathf.Lerp(0f, 1f, t / fadeDuration);
                    deathFadeOverlay.color = c;
                    yield return null;
                }
            }

            if (deathPanel != null) deathPanel.SetActive(true);
            if (deathMessageText != null)
                deathMessageText.text = deathMessages[Random.Range(0, deathMessages.Length)];
        }

        void ShowVictoryScreen()
        {
            StartCoroutine(VictorySequence());
        }

        IEnumerator VictorySequence()
        {
            yield return new WaitForSeconds(2f);
            victoryPanel?.SetActive(true);
        }

        public void OnResumeButton() => Core.GameManager.Instance?.TogglePause();
        public void OnRestartButton() => Core.GameManager.Instance?.RestartLevel();
        public void OnMainMenuButton() => Core.GameManager.Instance?.ReturnToMainMenu();

        public IEnumerator FadeIn()
        {
            if (blackFadePanel == null) yield break;
            blackFadePanel.gameObject.SetActive(true);
            Color c = Color.black;
            c.a = 1f;
            blackFadePanel.color = c;
            float t = 0f;
            while (t < fadeDuration)
            {
                t += Time.deltaTime;
                c.a = Mathf.Lerp(1f, 0f, t / fadeDuration);
                blackFadePanel.color = c;
                yield return null;
            }
            blackFadePanel.gameObject.SetActive(false);
        }
    }
}
