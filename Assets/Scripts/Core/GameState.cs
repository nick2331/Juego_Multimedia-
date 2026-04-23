using UnityEngine;

namespace PhobiaHorror.Core
{
    public enum GamePhase
    {
        MainMenu,
        LevelSelect,
        Playing,
        Paused,
        PlayerDead,
        LevelComplete,
        GameOver
    }

    public enum PhobiaLevel
    {
        Arachnophobia = 0,  // Arañas
        Claustrophobia = 1, // Espacios cerrados
        Nyctophobia = 2,    // Oscuridad
        Acrophobia = 3      // Alturas
    }

    public enum GameMode
    {
        Survival,   // Sobrevive X minutos
        Escape,     // Encuentra la salida
        Objectives  // Recoge ítems / activa palancas
    }

    [System.Serializable]
    public class GameState
    {
        public GamePhase currentPhase = GamePhase.MainMenu;
        public PhobiaLevel selectedLevel = PhobiaLevel.Arachnophobia;
        public GameMode selectedMode = GameMode.Escape;
        public int completedLevels = 0;
        public float totalPlayTime = 0f;
        public int deathCount = 0;
    }
}
