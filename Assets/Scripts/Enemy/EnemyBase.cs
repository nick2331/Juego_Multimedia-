using UnityEngine;
using UnityEngine.AI;

namespace PhobiaHorror.Enemy
{
    public enum EnemyState
    {
        Idle,
        Patrol,
        Alert,      // Oyó algo
        Chase,      // Ve al jugador
        Attack,
        Stunned,
        Dead
    }

    [RequireComponent(typeof(NavMeshAgent))]
    public abstract class EnemyBase : MonoBehaviour
    {
        [Header("Stats")]
        public float maxHealth = 100f;
        protected float currentHealth;
        public float moveSpeed = 3.5f;
        public float chaseSpeed = 6f;
        public float attackDamage = 25f;
        public float attackCooldown = 1.5f;
        public float attackRange = 2f;

        [Header("Detección")]
        public float sightRange = 18f;
        public float sightAngle = 110f;
        public float hearingRange = 12f;
        public LayerMask playerLayer;
        public LayerMask obstacleLayer;

        [Header("Patrulla")]
        public Transform[] patrolPoints;
        protected int currentPatrolIndex = 0;
        public float patrolWaitTime = 2f;

        [Header("Audio")]
        public AudioClip[] idleSounds;
        public AudioClip[] alertSounds;
        public AudioClip attackSound;
        public AudioClip deathSound;

        protected NavMeshAgent agent;
        protected AudioSource audioSource;
        protected Transform playerTransform;
        protected EnemyState currentState = EnemyState.Patrol;

        protected float attackTimer = 0f;
        protected float patrolTimer = 0f;
        protected float alertTimer = 0f;
        protected float idleSoundTimer = 0f;

        public static event System.Action<EnemyBase> OnEnemyDied;

        protected virtual void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            audioSource = GetComponent<AudioSource>();
            currentHealth = maxHealth;
        }

        protected virtual void Start()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) playerTransform = player.transform;
            agent.speed = moveSpeed;
        }

        protected virtual void Update()
        {
            if (currentState == EnemyState.Dead) return;

            attackTimer += Time.deltaTime;
            idleSoundTimer += Time.deltaTime;

            PlayIdleSound();
            UpdateStateMachine();
        }

        protected virtual void UpdateStateMachine()
        {
            switch (currentState)
            {
                case EnemyState.Idle:    StateIdle();    break;
                case EnemyState.Patrol:  StatePatrol();  break;
                case EnemyState.Alert:   StateAlert();   break;
                case EnemyState.Chase:   StateChase();   break;
                case EnemyState.Attack:  StateAttack();  break;
                case EnemyState.Stunned: StateStunned(); break;
            }
        }

        protected virtual void StateIdle()
        {
            agent.isStopped = true;
            if (CanSeePlayer() || CanHearPlayer())
                TransitionTo(EnemyState.Chase);
            else
            {
                patrolTimer += Time.deltaTime;
                if (patrolTimer >= patrolWaitTime)
                    TransitionTo(EnemyState.Patrol);
            }
        }

        protected virtual void StatePatrol()
        {
            agent.isStopped = false;
            agent.speed = moveSpeed;

            if (CanSeePlayer() || CanHearPlayer())
            {
                PlayAlertSound();
                TransitionTo(EnemyState.Chase);
                return;
            }

            if (patrolPoints.Length == 0) return;

            if (agent.remainingDistance <= agent.stoppingDistance + 0.2f)
            {
                patrolTimer += Time.deltaTime;
                if (patrolTimer >= patrolWaitTime)
                {
                    patrolTimer = 0f;
                    currentPatrolIndex = (currentPatrolIndex + 1) % patrolPoints.Length;
                    agent.SetDestination(patrolPoints[currentPatrolIndex].position);
                    TransitionTo(EnemyState.Idle);
                }
            }
        }

        protected virtual void StateAlert()
        {
            agent.isStopped = true;
            alertTimer += Time.deltaTime;

            if (CanSeePlayer())
                TransitionTo(EnemyState.Chase);
            else if (alertTimer >= 4f)
                TransitionTo(EnemyState.Patrol);
        }

        protected virtual void StateChase()
        {
            if (playerTransform == null) return;

            agent.isStopped = false;
            agent.speed = chaseSpeed;
            agent.SetDestination(playerTransform.position);

            float distToPlayer = Vector3.Distance(transform.position, playerTransform.position);

            if (distToPlayer <= attackRange)
                TransitionTo(EnemyState.Attack);
            else if (!CanSeePlayer() && distToPlayer > sightRange * 1.5f)
                TransitionTo(EnemyState.Patrol);
        }

        protected virtual void StateAttack()
        {
            agent.isStopped = true;

            if (playerTransform == null) return;

            transform.LookAt(new Vector3(playerTransform.position.x, transform.position.y, playerTransform.position.z));

            float distToPlayer = Vector3.Distance(transform.position, playerTransform.position);
            if (distToPlayer > attackRange)
            {
                TransitionTo(EnemyState.Chase);
                return;
            }

            if (attackTimer >= attackCooldown)
            {
                attackTimer = 0f;
                PerformAttack();
            }
        }

        protected virtual void StateStunned()
        {
            agent.isStopped = true;
        }

        protected virtual void PerformAttack()
        {
            if (attackSound != null) audioSource.PlayOneShot(attackSound);

            var playerHealth = Player.PlayerHealth.Instance;
            if (playerHealth != null)
            {
                float dist = Vector3.Distance(transform.position, playerTransform.position);
                if (dist <= attackRange)
                    playerHealth.TakeDamage(attackDamage);
            }
        }

        protected bool CanSeePlayer()
        {
            if (playerTransform == null) return false;

            Vector3 dirToPlayer = (playerTransform.position - transform.position).normalized;
            float angle = Vector3.Angle(transform.forward, dirToPlayer);
            if (angle > sightAngle * 0.5f) return false;

            float dist = Vector3.Distance(transform.position, playerTransform.position);
            if (dist > sightRange) return false;

            if (Physics.Raycast(transform.position + Vector3.up * 0.5f, dirToPlayer, dist, obstacleLayer))
                return false;

            return true;
        }

        protected bool CanHearPlayer()
        {
            if (playerTransform == null) return false;
            var pc = Player.PlayerController.Instance;
            if (pc == null || !pc.IsMoving()) return false;

            float dist = Vector3.Distance(transform.position, playerTransform.position);
            float radius = pc.IsSprinting() ? hearingRange : hearingRange * 0.5f;
            return dist <= radius;
        }

        public virtual void TakeDamage(float damage)
        {
            currentHealth -= damage;
            if (currentHealth <= 0f) Die();
        }

        protected virtual void Die()
        {
            currentState = EnemyState.Dead;
            agent.isStopped = true;
            if (deathSound != null) audioSource.PlayOneShot(deathSound);
            OnEnemyDied?.Invoke(this);
            Destroy(gameObject, 3f);
        }

        protected void TransitionTo(EnemyState newState)
        {
            currentState = newState;
            patrolTimer = 0f;
            alertTimer = 0f;
        }

        void PlayIdleSound()
        {
            if (idleSounds.Length == 0 || idleSoundTimer < Random.Range(8f, 15f)) return;
            idleSoundTimer = 0f;
            audioSource.PlayOneShot(idleSounds[Random.Range(0, idleSounds.Length)], 0.4f);
        }

        void PlayAlertSound()
        {
            if (alertSounds.Length > 0)
                audioSource.PlayOneShot(alertSounds[Random.Range(0, alertSounds.Length)]);
        }

        public EnemyState GetState() => currentState;
    }
}
