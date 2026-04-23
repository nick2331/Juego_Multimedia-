using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace PhobiaHorror.UI
{
    public class HUDController : MonoBehaviour
    {
        public static HUDController Instance { get; private set; }

        [Header("Vida")]
        public Slider healthBar;
        public Image healthBarFill;
        public Color healthHighColor = new Color(0.2f, 0.8f, 0.2f);
        public Color healthLowColor = new Color(0.8f, 0.1f, 0.1f);

        [Header("Cordura")]
        public Slider sanityBar;
        public Image sanityBarFill;
        public Color sanityHighColor = new Color(0.3f, 0.5f, 0.9f);
        public Color sanityLowColor = new Color(0.6f, 0.1f, 0.8f);
        public TextMeshProUGUI sanityWarningText;

        [Header("Batería de Linterna")]
        public Slider batteryBar;
        public Image batteryBarFill;
        public Color batteryFullColor = Color.yellow;
        public Color batteryEmptyColor = Color.red;
        public GameObject batteryDeadWarning;

        [Header("Stamina")]
        public Slider staminaBar;
        public CanvasGroup staminaGroup;

        [Header("Objetivos")]
        public TextMeshProUGUI objectiveText;
        public TextMeshProUGUI objectiveProgressText;

        [Header("Nivel / Modo")]
        public TextMeshProUGUI levelNameText;
        public TextMeshProUGUI gameModeText;
        public TextMeshProUGUI timerText;

        [Header("Daño")]
        public Image damageOverlay;

        [Header("Crosshair")]
        public Image crosshair;

        void Awake()
        {
            Instance = this;
        }

        void Start()
        {
            Player.PlayerHealth.OnHealthChanged += UpdateHealth;
            Player.SanitySystem.OnSanityChanged += UpdateSanity;
            Player.FlashlightController.OnBatteryChanged += UpdateBattery;
            Player.SanitySystem.OnLowSanity += ShowSanityWarning;
            Player.FlashlightController.OnFlashlightDead += OnFlashlightDead;
            Objectives.Objective.OnObjectiveUpdated += UpdateObjective;

            // Título del nivel
            var gameState = Core.GameManager.Instance?.state;
            if (gameState != null)
            {
                levelNameText?.SetText(gameState.selectedLevel.ToString().Replace("phobia", "fobia").ToUpper());
                gameModeText?.SetText(GetModeText(gameState.selectedMode));
            }
        }

        void OnDestroy()
        {
            Player.PlayerHealth.OnHealthChanged -= UpdateHealth;
            Player.SanitySystem.OnSanityChanged -= UpdateSanity;
            Player.FlashlightController.OnBatteryChanged -= UpdateBattery;
            Player.SanitySystem.OnLowSanity -= ShowSanityWarning;
            Player.FlashlightController.OnFlashlightDead -= OnFlashlightDead;
            Objectives.Objective.OnObjectiveUpdated -= UpdateObjective;
        }

        void Update()
        {
            UpdateStamina();
            UpdateTimer();
        }

        void UpdateHealth(float percent)
        {
            if (healthBar != null) healthBar.value = percent;
            if (healthBarFill != null)
                healthBarFill.color = Color.Lerp(healthLowColor, healthHighColor, percent);
        }

        void UpdateSanity(float percent)
        {
            if (sanityBar != null) sanityBar.value = percent;
            if (sanityBarFill != null)
                sanityBarFill.color = Color.Lerp(sanityLowColor, sanityHighColor, percent);
        }

        void UpdateBattery(float percent)
        {
            if (batteryBar != null) batteryBar.value = percent;
            if (batteryBarFill != null)
                batteryBarFill.color = Color.Lerp(batteryEmptyColor, batteryFullColor, percent);
            batteryDeadWarning?.SetActive(percent <= 0f);
        }

        void UpdateStamina()
        {
            var pc = Player.PlayerController.Instance;
            if (pc == null || staminaBar == null) return;

            float pct = pc.GetStaminaPercent();
            staminaBar.value = pct;

            if (staminaGroup != null)
                staminaGroup.alpha = Mathf.Lerp(staminaGroup.alpha, pct < 1f ? 1f : 0f, Time.deltaTime * 3f);
        }

        void UpdateTimer()
        {
            if (timerText == null) return;

            var lm = Core.LevelManager.Instance;
            if (lm == null) return;

            if (Core.GameManager.Instance?.state.selectedMode == Core.GameMode.Survival)
            {
                float progress = lm.GetSurvivalProgress();
                float remaining = lm.survivalTimeRequired * (1f - progress);
                int minutes = (int)(remaining / 60f);
                int seconds = (int)(remaining % 60f);
                timerText.text = $"{minutes:00}:{seconds:00}";
            }
        }

        void ShowSanityWarning(bool isLow)
        {
            if (sanityWarningText != null)
                sanityWarningText.gameObject.SetActive(isLow);
        }

        void OnFlashlightDead()
        {
            batteryDeadWarning?.SetActive(true);
        }

        void UpdateObjective(Objectives.Objective obj)
        {
            if (objectiveText != null) objectiveText.text = obj.data.title;
            if (objectiveProgressText != null) objectiveProgressText.text = obj.GetProgressText();
        }

        string GetModeText(Core.GameMode mode)
        {
            return mode switch
            {
                Core.GameMode.Survival => "SUPERVIVENCIA",
                Core.GameMode.Escape => "ESCAPADA",
                Core.GameMode.Objectives => "OBJETIVOS",
                _ => ""
            };
        }
    }
}
