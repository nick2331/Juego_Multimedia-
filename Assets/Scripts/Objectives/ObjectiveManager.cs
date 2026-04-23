using UnityEngine;
using System.Collections.Generic;

namespace PhobiaHorror.Objectives
{
    public class ObjectiveManager : MonoBehaviour
    {
        public static ObjectiveManager Instance { get; private set; }

        [Header("Objetivos del Nivel")]
        public List<Objective> objectives = new List<Objective>();
        public bool requireAllToComplete = false;

        private int completedCount = 0;

        public static event System.Action OnAllObjectivesComplete;
        public static event System.Action<Objective> OnObjectiveComplete;

        void Awake()
        {
            Instance = this;
        }

        void OnEnable()
        {
            Objective.OnObjectiveCompleted += HandleObjectiveCompleted;
        }

        void OnDisable()
        {
            Objective.OnObjectiveCompleted -= HandleObjectiveCompleted;
        }

        void Start()
        {
            // Auto-detectar objetivos en la escena si no están asignados
            if (objectives.Count == 0)
                objectives.AddRange(FindObjectsOfType<Objective>());
        }

        void HandleObjectiveCompleted(Objective obj)
        {
            if (!objectives.Contains(obj)) return;

            completedCount++;
            OnObjectiveComplete?.Invoke(obj);

            bool allDone = requireAllToComplete
                ? completedCount >= objectives.Count
                : completedCount >= GetMandatoryCount();

            if (allDone)
            {
                OnAllObjectivesComplete?.Invoke();

                if (Core.GameManager.Instance.state.selectedMode == Core.GameMode.Objectives)
                    Core.GameManager.Instance.LevelComplete();
            }
        }

        int GetMandatoryCount()
        {
            int count = 0;
            foreach (var obj in objectives)
                if (!obj.data.isOptional) count++;
            return count;
        }

        public Objective GetObjectiveByType(ObjectiveType type)
        {
            return objectives.Find(o => o.data.type == type);
        }

        public List<Objective> GetIncompleteObjectives()
        {
            return objectives.FindAll(o => !o.isCompleted);
        }

        public float GetOverallProgress()
        {
            if (objectives.Count == 0) return 0f;
            float total = 0f;
            foreach (var obj in objectives) total += obj.GetProgress();
            return total / objectives.Count;
        }
    }
}
