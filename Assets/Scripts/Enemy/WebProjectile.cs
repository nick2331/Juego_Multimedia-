using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Enemy
{
    public class WebProjectile : MonoBehaviour
    {
        public float speed = 12f;
        public float lifetime = 4f;
        private Vector3 direction;
        private float slowDuration;
        private bool hit = false;

        public void Initialize(Vector3 dir, float slowDur)
        {
            direction = dir;
            slowDuration = slowDur;
            Destroy(gameObject, lifetime);
        }

        void Update()
        {
            if (!hit)
                transform.position += direction * speed * Time.deltaTime;
        }

        void OnTriggerEnter(Collider other)
        {
            if (hit) return;

            if (other.CompareTag("Player"))
            {
                hit = true;
                var pc = other.GetComponent<Player.PlayerController>();
                if (pc != null)
                    StartCoroutine(SlowPlayer(pc));
            }
            else if (!other.isTrigger)
            {
                // Pegar en pared
                hit = true;
                GetComponent<Rigidbody>()?.Sleep();
                Destroy(gameObject, 2f);
            }
        }

        IEnumerator SlowPlayer(Player.PlayerController pc)
        {
            pc.speedMultiplier = 0.3f;
            yield return new WaitForSeconds(slowDuration);
            pc.speedMultiplier = 1f;
            Destroy(gameObject);
        }
    }
}
