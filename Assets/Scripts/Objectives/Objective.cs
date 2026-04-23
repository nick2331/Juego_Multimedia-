using UnityEngine;

namespace PhobiaHorror.Objectives
{
    public enum ObjectiveType
    {
        CollectItem,
        ActivateSwitch,
        ReachLocation,
        SurviveTime,
        KillEnemies,
        EscapeExit
    }

    [System.Serializable]
    public class ObjectiveData
    {
        public string title;
        [TextArea] public string description;
        public ObjectiveType type;
        public int requiredAmount = 1;
        public bool isOptional = false;
    }

    public class Objective : MonoBehaviour
    {
        [Header("Objetivo")]
        public ObjectiveData data;

        [HideInInspector] public int currentAmount = 0;
        [HideInInspector] public bool isCompleted = false;

        public static event System.Action<Objective> OnObjectiveUpdated;
        public static event System.Action<Objective> OnObjectiveCompleted;

        public void AddProgress(int amount = 1)
        {
            if (isCompleted) return;
            currentAmount += amount;
            OnObjectiveUpdated?.Invoke(this);

            if (currentAmount >= data.requiredAmount)
                Complete();
        }

        public void Complete()
        {
            if (isCompleted) return;
            isCompleted = true;
            currentAmount = data.requiredAmount;
            OnObjectiveCompleted?.Invoke(this);
        }

        public float GetProgress() => (float)currentAmount / data.requiredAmount;
        public string GetProgressText() => $"{currentAmount}/{data.requiredAmount}";
    }
}
