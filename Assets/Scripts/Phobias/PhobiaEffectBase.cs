using UnityEngine;

namespace PhobiaHorror.Phobias
{
    /// <summary>
    /// Clase base para todos los efectos de fobia.
    /// Cada nivel hereda de esta clase y sobreescribe sus métodos.
    /// </summary>
    public abstract class PhobiaEffectBase : MonoBehaviour
    {
        [Header("Intensidad del Efecto")]
        [Range(0f, 1f)] public float intensity = 0f;
        public float intensityIncreaseRate = 0.02f;

        protected bool isActive = false;

        protected virtual void Start()
        {
            Core.LevelManager.OnLevelStart += Activate;
        }

        protected virtual void OnDestroy()
        {
            Core.LevelManager.OnLevelStart -= Activate;
        }

        public virtual void Activate()
        {
            isActive = true;
        }

        public virtual void Deactivate()
        {
            isActive = false;
        }

        public virtual void SetIntensity(float value)
        {
            intensity = Mathf.Clamp01(value);
            ApplyEffect(intensity);
        }

        protected abstract void ApplyEffect(float intensity);
    }
}
