using UnityEngine;
using System.Collections;

namespace PhobiaHorror.Enemy
{
    /// <summary>
    /// IA de la araña: patrulla, caza, ataca y dispara telarañas.
    /// Puede caer del techo y trepar por paredes.
    /// </summary>
    public class SpiderAI : EnemyBase
    {
        [Header("Araña — Ataques Especiales")]
        public GameObject webProjectilePrefab;
        public Transform webShootPoint;
        public float webAttackRange = 10f;
        public float webAttackCooldown = 5f;
        public float webSlowDuration = 3f;

        [Header("Araña — Caída del Techo")]
        public bool canDropFromCeiling = true;
        public float ceilingDropChance = 0.15f;
        public float ceilingRayLength = 8f;

        [Header("Araña — Animación")]
        public Animator spiderAnimator;
        private static readonly int AnimWalk   = Animator.StringToHash("Walk");
        private static readonly int AnimRun    = Animator.StringToHash("Run");
        private static readonly int AnimAttack = Animator.StringToHash("Attack");
        private static readonly int AnimWeb    = Animator.StringToHash("WebShoot");
        private static readonly int AnimDrop   = Animator.StringToHash("Drop");
        private static readonly int AnimDie    = Animator.StringToHash("Die");

        [Header("Araña — Efectos")]
        public ParticleSystem webTrailFX;
        public AudioClip webShootSound;
        public AudioClip skitterSound;
        public AudioClip hissSound;

        private float webAttackTimer = 0f;
        private bool isDropping = false;

        protected override void Awake()
        {
            base.Awake();
            attackDamage = 30f;
            moveSpeed = 4f;
            chaseSpeed = 7f;
            attackRange = 2.2f;
        }

        protected override void Update()
        {
            base.Update();
            webAttackTimer += Time.deltaTime;

            if (currentState == EnemyState.Chase && !isDropping)
                TryWebAttack();

            UpdateAnimations();
        }

        void TryWebAttack()
        {
            if (playerTransform == null) return;
            if (webAttackTimer < webAttackCooldown) return;
            if (webProjectilePrefab == null) return;

            float dist = Vector3.Distance(transform.position, playerTransform.position);
            if (dist <= webAttackRange && dist > attackRange)
            {
                webAttackTimer = 0f;
                StartCoroutine(WebAttackRoutine());
            }
        }

        IEnumerator WebAttackRoutine()
        {
            agent.isStopped = true;
            spiderAnimator?.SetTrigger(AnimWeb);
            audioSource.PlayOneShot(webShootSound);

            yield return new WaitForSeconds(0.4f);

            if (playerTransform == null) yield break;

            Vector3 dir = (playerTransform.position - webShootPoint.position).normalized;
            GameObject web = Instantiate(webProjectilePrefab, webShootPoint.position, Quaternion.LookRotation(dir));
            var proj = web.GetComponent<WebProjectile>();
            if (proj != null) proj.Initialize(dir, webSlowDuration);

            yield return new WaitForSeconds(0.5f);
            agent.isStopped = false;
        }

        void UpdateAnimations()
        {
            if (spiderAnimator == null) return;

            bool moving = agent.velocity.magnitude > 0.3f;
            bool running = currentState == EnemyState.Chase || currentState == EnemyState.Attack;

            spiderAnimator.SetBool(AnimWalk, moving && !running);
            spiderAnimator.SetBool(AnimRun, moving && running);
        }

        protected override void PerformAttack()
        {
            base.PerformAttack();
            spiderAnimator?.SetTrigger(AnimAttack);
            audioSource.PlayOneShot(hissSound);
        }

        protected override void StatePatrol()
        {
            base.StatePatrol();

            // Sonido de skitter aleatorio al patrullar
            if (Random.value < 0.001f)
                audioSource.PlayOneShot(skitterSound, 0.3f);
        }

        /// <summary>
        /// Genera una araña cayendo desde el techo sobre el jugador.
        /// Llamado por SpiderSpawnManager para jump scares.
        /// </summary>
        public void DropFromCeiling(Vector3 dropPosition)
        {
            if (!canDropFromCeiling) return;
            StartCoroutine(DropRoutine(dropPosition));
        }

        IEnumerator DropRoutine(Vector3 dropPos)
        {
            isDropping = true;
            agent.enabled = false;
            transform.position = dropPos;
            spiderAnimator?.SetTrigger(AnimDrop);

            audioSource.PlayOneShot(hissSound, 1f);

            yield return new WaitForSeconds(0.6f);
            agent.enabled = true;
            isDropping = false;
            TransitionTo(EnemyState.Chase);
        }

        protected override void Die()
        {
            spiderAnimator?.SetTrigger(AnimDie);
            base.Die();
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.red;
            Gizmos.DrawWireSphere(transform.position, attackRange);
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, sightRange);
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(transform.position, webAttackRange);
        }
    }
}
