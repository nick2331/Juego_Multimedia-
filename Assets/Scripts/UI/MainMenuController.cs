using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace PhobiaHorror.UI
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("Paneles")]
        public GameObject mainPanel;
        public GameObject levelSelectPanel;
        public GameObject settingsPanel;
        public GameObject creditsPanel;

        [Header("Selección de Nivel")]
        public Button[] levelButtons;
        public TextMeshProUGUI levelDescriptionText;
        public Image levelPreviewImage;

        [Header("Selección de Modo")]
        public Toggle survivalToggle;
        public Toggle escapeToggle;
        public Toggle objectivesToggle;

        [Header("Info de Niveles")]
        public LevelInfo[] levelInfos;

        [Header("Animación")]
        public Animator titleAnimator;
        public AudioClip hoverSound;
        public AudioClip clickSound;
        private AudioSource audioSource;

        private Core.PhobiaLevel selectedLevel = Core.PhobiaLevel.Arachnophobia;
        private Core.GameMode selectedMode = Core.GameMode.Escape;

        [System.Serializable]
        public class LevelInfo
        {
            public string levelName;
            [TextArea] public string description;
            public Sprite previewImage;
            public Color accentColor;
        }

        void Awake()
        {
            audioSource = GetComponent<AudioSource>();
        }

        void Start()
        {
            ShowPanel(mainPanel);

            for (int i = 0; i < levelButtons.Length; i++)
            {
                int idx = i;
                levelButtons[i].onClick.AddListener(() => SelectLevel(idx));
            }

            SelectLevel(0);
        }

        void SelectLevel(int idx)
        {
            selectedLevel = (Core.PhobiaLevel)idx;

            if (levelInfos.Length > idx && levelDescriptionText != null)
            {
                levelDescriptionText.text = levelInfos[idx].description;
                if (levelPreviewImage != null && levelInfos[idx].previewImage != null)
                    levelPreviewImage.sprite = levelInfos[idx].previewImage;
            }

            audioSource?.PlayOneShot(clickSound, 0.5f);

            // Resaltar botón seleccionado
            for (int i = 0; i < levelButtons.Length; i++)
            {
                var colors = levelButtons[i].colors;
                colors.normalColor = i == idx ? new Color(0.3f, 0.3f, 0.3f) : Color.black;
                levelButtons[i].colors = colors;
            }
        }

        Core.GameMode GetSelectedMode()
        {
            if (survivalToggle != null && survivalToggle.isOn) return Core.GameMode.Survival;
            if (objectivesToggle != null && objectivesToggle.isOn) return Core.GameMode.Objectives;
            return Core.GameMode.Escape;
        }

        // ─── Botones ────────────────────────────────────────────
        public void OnPlayButton() => ShowPanel(levelSelectPanel);
        public void OnSettingsButton() => ShowPanel(settingsPanel);
        public void OnCreditsButton() => ShowPanel(creditsPanel);
        public void OnBackButton() => ShowPanel(mainPanel);
        public void OnQuitButton() => Application.Quit();

        public void OnStartGameButton()
        {
            selectedMode = GetSelectedMode();
            PlayClickSound();
            Core.GameManager.Instance?.StartLevel(selectedLevel, selectedMode);
        }

        public void PlayHoverSound() => audioSource?.PlayOneShot(hoverSound, 0.3f);
        public void PlayClickSound() => audioSource?.PlayOneShot(clickSound, 0.6f);

        void ShowPanel(GameObject panel)
        {
            mainPanel?.SetActive(false);
            levelSelectPanel?.SetActive(false);
            settingsPanel?.SetActive(false);
            creditsPanel?.SetActive(false);
            panel?.SetActive(true);
        }
    }
}
