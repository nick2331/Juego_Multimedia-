# PHOBIA — Horror Experience

Juego FPS de terror en el navegador, inspirado en Lethal Company.  
**Stack**: Babylon.js · TypeScript · Vite · Node.js + Express · Render.com

---

## Juega en el navegador

Sin instalación. Abre el link de Render y listo.

---

## Estructura

```
Juego_Multimedia-/
├── client/                  ← Frontend (Babylon.js + TypeScript + Vite)
│   ├── index.html           ← Mega interfaz (menús, HUD, overlays)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.ts          ← Punto de entrada, navegación
│       └── game/
│           ├── Game.ts      ← Motor principal, loop, fases
│           ├── scenes/
│           │   └── LevelBuilder.ts   ← 4 niveles procedurales
│           ├── entities/
│           │   ├── Player.ts         ← FPS camera, movimiento, interacción
│           │   └── Spider.ts         ← IA araña (idle/patrol/chase/attack)
│           ├── systems/
│           │   ├── Flashlight.ts     ← SpotLight con batería y parpadeo
│           │   ├── Sanity.ts         ← Pérdida/recuperación de cordura
│           │   ├── Inventory.ts      ← 4 slots, items usables
│           │   └── SpawnManager.ts   ← Spawns dinámicos por nivel
│           └── ui/
│               ├── HUD.ts            ← Barras, inventario, mensajes
│               └── Particles.ts      ← Partículas ambientales en menús
├── server/                  ← Backend (Node.js + Express)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts         ← Express server
│       └── routes/
│           └── scores.ts    ← GET/POST puntuaciones
├── render.yaml              ← Deploy automático en Render.com
└── .gitignore
```

---

## Correr localmente

### 1. Requisitos
- **Node.js 20+** — https://nodejs.org

### 2. Frontend
```bash
cd client
npm install
npm run dev
# Abre http://localhost:3000
```

### 3. Backend (opcional para desarrollo)
```bash
cd server
npm install
npm run dev
# API en http://localhost:4000
```

---

## Deploy en Render.com

1. Sube el código a GitHub (ya está en `claude/spider-phobia-game-SjSBk`).
2. Ve a **https://render.com** → New → Blueprint.
3. Conecta tu repo de GitHub.
4. Render detecta `render.yaml` automáticamente.
5. Haz clic en **Apply** — despliega frontend + backend en ~3 minutos.

**Gratis**: el plan free de Render sirve perfectamente para este proyecto.

---

## Controles

| Acción | Tecla |
|---|---|
| Mover | WASD |
| Correr | Shift |
| Interactuar | E |
| Linterna | F |
| Usar ítem | Q |
| Pausa | Escape |

---

## Niveles

| Nivel | Fobia | Efecto |
|---|---|---|
| Aracnofobia | Arañas | Más arañas, caídas del techo, camera shake |
| Claustrofobia | Espacios cerrados | FOV reducido, latido del corazón |
| Nictofobia | Oscuridad | Batería drena x2, poca luz |
| Acrofobia | Alturas | Plataformas elevadas, vértigo de FOV |

## Modos

| Modo | Objetivo |
|---|---|
| Survival | Sobrevive 3 minutos |
| Escape | Recoge ítems y activa la salida |
| Objectives | Completa 3 objetivos antes de salir |
