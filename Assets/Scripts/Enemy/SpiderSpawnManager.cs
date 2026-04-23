using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace PhobiaHorror.Enemy
{
    public class SpiderSpawnManager : MonoBehaviour
    {
        [Header("Araña Prefab")]
        public GameObject spiderPrefab;

        [Header("Puntos de Spawn")]
        public Transform[] spawnPoints;
        public Transform[] ceilingDropPoints;

        [Header("Configuración de Spawn")]
        public int initialSpiders = 2;
        public int maxSpiders = 6;
        public float spawnInterval = 45f;
        public float jumpScareCooldown = 60f;

        [Header("Jump Scares del Techo")]
        public float ceilingDropCheckRadius = 5f;
        public float ceilingDropInterval = 30f;

        private List<SpiderAI> activeSpiders = new List<SpiderAI>();
        private float spawnTimer = 0f;
        private float jumpScareTimer = 0f;
        private float ceilingDropTimer = 0f;
        private Transform playerTransform;

        void Start()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) playerTransform = player.transform;

            for (int i = 0; i < initialSpiders; i++)
                SpawnSpider();

            ceilingDropTimer = ceilingDropInterval * 0.5f;
        }

        void Update()
        {
            CleanDeadSpiders();

            spawnTimer += Time.deltaTime;
            ceilingDropTimer += Time.deltaTime;

            if (activeSpiders.Count < maxSpiders && spawnTimer >= spawnInterval)
            {
                spawnTimer = 0f;
                SpawnSpider();
            }

            if (ceilingDropTimer >= ceilingDropInterval && ceilingDropPoints.Length > 0)
            {
                ceilingDropTimer = 0f;
                TryCeilingDrop();
            }
        }

        void SpawnSpider()
        {
            if (spawnPoints.Length == 0 || spiderPrefab == null) return;

            Transform spawnPoint = GetFarthestSpawnFromPlayer();
            if (spawnPoint == null) return;

            var go = Instantiate(spiderPrefab, spawnPoint.position, spawnPoint.rotation);
            var spider = go.GetComponent<SpiderAI>();
            if (spider != null)
                activeSpiders.Add(spider);
        }

        void TryCeilingDrop()
        {
            if (playerTransform == null || spiderPrefab == null) return;

            // Encontrar punto de techo cercano al jugador
            Transform dropPoint = GetNearestCeilingDropToPlayer();
            if (dropPoint == null) return;

            var go = Instantiate(spiderPrefab, dropPoint.position + Vector3.up * 3f, Quaternion.identity);
            var spider = go.GetComponent<SpiderAI>();
            if (spider != null)
            {
                activeSpiders.Add(spider);
                spider.DropFromCeiling(dropPoint.position);
            }
        }

        Transform GetFarthestSpawnFromPlayer()
        {
            if (playerTransform == null) return spawnPoints[Random.Range(0, spawnPoints.Length)];

            Transform best = null;
            float maxDist = 0f;
            foreach (var sp in spawnPoints)
            {
                float d = Vector3.Distance(sp.position, playerTransform.position);
                if (d > maxDist)
                {
                    maxDist = d;
                    best = sp;
                }
            }
            return best;
        }

        Transform GetNearestCeilingDropToPlayer()
        {
            if (playerTransform == null) return null;

            Transform best = null;
            float minDist = float.MaxValue;
            foreach (var pt in ceilingDropPoints)
            {
                float d = Vector3.Distance(
                    new Vector3(pt.position.x, 0, pt.position.z),
                    new Vector3(playerTransform.position.x, 0, playerTransform.position.z));

                if (d < minDist && d < ceilingDropCheckRadius * 2f)
                {
                    minDist = d;
                    best = pt;
                }
            }
            return best;
        }

        void CleanDeadSpiders()
        {
            activeSpiders.RemoveAll(s => s == null);
        }

        public int GetActiveSpiderCount() => activeSpiders.Count;
    }
}
