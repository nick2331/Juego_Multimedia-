# Phobia Horror Game — Unreal Engine 5

Juego de horror FPS con 4 niveles basados en fobias, inspirado en Lethal Company.
Motor: **Unreal Engine 5.3** | Gráficos: **Lumen + Nanite + Niagara**

---

## 🕷️ Los 4 Niveles de Fobia

| # | Fobia | Monstruo | Entorno | Efecto especial |
|---|-------|----------|---------|-----------------|
| 1 | **Aracnofobia** | Araña gigante | Cueva/laboratorio | Jump scares, telarañas ralentizan, arañas en paredes |
| 2 | **Claustrofobia** | Criatura de las paredes | Bunker subterráneo | FOV se cierra, vignette pulsante, corazón que late |
| 3 | **Nictofobia** | Sombra sin forma | Edificio abandonado | Solo la linterna ilumina, batería drena rápido |
| 4 | **Acrofobia** | Entidad voladora | Rascacielos en ruinas | Vértigo real, cámara oscila, daño por caída |

---

## 🎮 3 Modos de Juego

| Modo | Descripción |
|------|-------------|
| **Supervivencia** | Sobrevive 3 minutos mientras el monstruo te caza |
| **Escapada** | Encuentra la salida antes de que tu cordura llegue a 0 |
| **Objetivos** | Recoge ítems / activa palancas, luego escapa |

---

## 🛠️ GUÍA COMPLETA — Configurar en Unreal Engine 5

### PASO 1 — Instalar Unreal Engine 5

1. Descarga **Epic Games Launcher** desde https://www.unrealengine.com/download
2. Instala **Unreal Engine 5.3** desde el Launcher
3. Haz clic en **Install** → espera (~30-60 GB)

---

### PASO 2 — Crear el Proyecto

1. Abre el Epic Games Launcher → pestaña **Unreal Engine** → **Launch**
2. En la pantalla de proyectos: **Games** → selecciona **First Person**
   > ⚠️ Usar la plantilla First Person porque ya incluye movimiento FPS y cámara
3. Configura:
   - **Quality Preset**: Maximum Quality
   - **Starter Content**: Yes
   - **Ray Tracing**: Yes (si tu GPU lo soporta)
   - **Folder**: apunta a tu carpeta `Juego_Multimedia-`
   - **Name**: `PhobiaHorrorGame`
4. Clic en **Create**

---

### PASO 3 — Copiar los Scripts C++

1. Cierra Unreal Engine
2. Copia la carpeta `Source/` de este repositorio a tu proyecto UE5
3. Abre el archivo `.uproject` con botón derecho → **Generate Visual Studio project files**
4. Abre el `.sln` generado en Visual Studio (o Rider)
5. Compila con **Ctrl+Shift+B** (Build Solution)
6. Vuelve a abrir el proyecto en Unreal

---

### PASO 4 — 🕷️ PERSONAJE DE ARAÑA GRATIS (Mixamo)

**Mixamo** es de Adobe y es 100% gratuito con cuenta.

1. Ve a **https://www.mixamo.com** → crea una cuenta gratuita
2. En la búsqueda escribe: **"Spider"** o **"Monster"**
3. Descarga estos assets gratuitos:
   - **Y Bot** (personaje base para humanoides si los necesitas)
   - Busca también **"zombie"**, **"creature"** para enemigos alternativos
4. Para la araña específica, busca en la sección Characters: **"Arachnid"**
5. Selecciona el personaje → click **Download**:
   - Format: **FBX for Unreal Engine**
   - Pose: **T-pose**
   - FPS: 30
6. Descarga también las **animaciones** por separado:
   - Walk cycle
   - Run cycle
   - Attack
   - Idle
   - Death

**Importar a Unreal:**
1. Arrastra el `.fbx` a `Content/Characters/Spider/`
2. En el diálogo de importación:
   - ✅ Import Animations
   - ✅ Create Physics Asset
   - Skeleton: crear nuevo
3. Clic **Import All**

---

### PASO 5 — 🏚️ ENTORNOS GRATIS (Fab.com — Marketplace de Epic)

**Fab.com** (antes Marketplace de Unreal) tiene packs gratuitos permanentes y mensuales.

1. Ve a **https://www.fab.com** (o desde el Epic Launcher → Marketplace)
2. Busca estos packs **GRATUITOS** (filtrar por Price: Free):

   **Para el nivel Aracnofobia (cueva/laboratorio):**
   - Busca: **"Modular Dungeon"** → "Modular Dungeon Tiles" (gratis)
   - Busca: **"Underground Cave"** → varios packs gratuitos
   - Busca: **"Horror Props"** → telarañas, huesos, etc.

   **Para el nivel Claustrofobia (bunker):**
   - Busca: **"Military Bunker"** o **"Modular Underground"**
   - Busca: **"Industrial Corridor"**

   **Para el nivel Nictofobia (edificio abandonado):**
   - Busca: **"Abandoned Hospital"** → hay versiones gratuitas
   - Busca: **"Abandoned Apartment"**

   **Para el nivel Acrofobia (rascacielos):**
   - Busca: **"Urban Buildings"** o **"Modular Skyscraper"**
   - Busca: **"Catwalk"** para pasarelas

3. Haz clic en **Add to My Library** en cada pack
4. En el Launcher → Library → encuentra el pack → **Add to Project**

---

### PASO 6 — 🪨 TEXTURAS FOTORREALISTAS GRATIS (Quixel Bridge)

Quixel Megascans está **completamente integrado en UE5** y es gratis.

1. En Unreal Engine: menú superior → **Window → Quixel Bridge**
2. Inicia sesión con tu cuenta Epic
3. Busca texturas para tu juego:
   - **Concrete cracked** → para paredes del bunker
   - **Stone cave** → para la cueva de arañas
   - **Rusted metal** → para el rascacielos
   - **Cobweb** → telarañas decorativas
   - **Dirt floor** → suelos
4. Selecciona la textura → **Download** → luego **Add to Project**
   > Las texturas se añaden directamente como Materials en tu Content Browser

---

### PASO 7 — Configurar el Behavior Tree de la Araña

En UE5, la IA usa **Behavior Trees** + **Blackboard** (sistema visual, sin código):

1. En Content Browser: clic derecho → **Artificial Intelligence → Behavior Tree**
   - Nómbralo: `BT_Spider`
2. Clic derecho → **Artificial Intelligence → Blackboard**
   - Nómbralo: `BB_Spider`
3. Abre `BT_Spider`, asigna `BB_Spider` como Blackboard
4. Construye el árbol de comportamiento:

```
ROOT
└── Selector (¿Qué hace la araña?)
    ├── Sequence (Atacar si está en rango)
    │   ├── BTDecorator: Is In Attack Range
    │   └── BTTask: PerformAttack
    ├── Sequence (Perseguir si ve al jugador)
    │   ├── BTDecorator: bPlayerVisible == true
    │   └── BTTask: MoveTo (PlayerActor)
    ├── Sequence (Ir al último sonido oído)
    │   ├── BTDecorator: bPlayerHeard == true
    │   └── BTTask: MoveTo (TargetLocation)
    └── BTTask: Patrol (moverse entre PatrolPoints)
```

5. Abre el Blueprint de `BP_Spider` (hijo de `SpiderCharacter`)
6. En **Class Defaults**: asigna `BT_Spider` a la propiedad `BehaviorTree`
7. Asigna `SpiderAIController` como el **AI Controller Class**

---

### PASO 8 — Configurar Lumen (Iluminación Global)

Lumen es la tecnología de iluminación de UE5 que hace los gráficos increíbles:

1. Menú: **Edit → Project Settings → Engine → Rendering**
2. Activa:
   - ✅ **Global Illumination**: Lumen
   - ✅ **Reflections**: Lumen
   - ✅ **Hardware Ray Tracing**: Enabled (si tu GPU lo soporta)
   - ✅ **Shadows**: Virtual Shadow Maps
3. En tu escena, crea un **Directional Light** muy tenue (Intensity: 0.1)
   - Color: azul oscuro (RGB: 0.02, 0.02, 0.08)
   - ✅ Atmosphere Sun Light

---

### PASO 9 — Post-Processing (Gráficos Estilo Horror)

1. En el Viewport: `Place Actors (Shift+1)` → busca **Post Process Volume**
2. Arrástralo a la escena → en detalles activa: ✅ **Infinite Extent (Unbound)**
3. Configura estos overrides:

| Efecto | Valor |
|--------|-------|
| **Film Grain Intensity** | 0.4 |
| **Film Grain Size** | 2.0 |
| **Vignette Intensity** | 0.4 |
| **Chromatic Aberration** | 0.15 |
| **Bloom Intensity** | 0.5 |
| **Color Grading Saturation** | 0.7 (desaturar un poco) |
| **Color Grading Shadows** | Tinte azul oscuro |
| **Exposure Compensation** | -0.5 (más oscuro) |
| **Depth of Field** | Bokeh, Focus Distance: 300 |

4. Asigna el script `BP_PostProcessController` (crear en Blueprint) al volumen

---

### PASO 10 — Configurar el NavMesh (Pathfinding de la Araña)

1. En el menú: **Place Actors (Shift+1)** → busca **Nav Mesh Bounds Volume**
2. Escala el volumen para cubrir todo tu nivel
3. Menú: **Build → Build Paths** (o presiona `P` para ver la malla verde)
4. La araña ahora puede navegar automáticamente por el nivel

---

### PASO 11 — Configurar el Player Blueprint

1. En Content Browser → crea **Blueprint Class** → parent: `PhobiaPlayerCharacter`
   - Nómbralo: `BP_Player`
2. En el Blueprint Editor:
   - Añade un **Spot Light** al socket `FlashlightSocket` del mesh
   - En el componente `FlashlightComp`, asigna esa SpotLight a la propiedad `SpotLight`
3. En **Project Settings → Maps & Modes**:
   - Default Pawn Class: `BP_Player`
   - Game Mode: `BP_PhobiaGameMode`

---

### PASO 12 — Jerarquía de la Escena

```
World Outliner (Nivel Aracnofobia)
├── 🎮 GAMEPLAY
│   ├── BP_PhobiaGameMode
│   ├── BP_SpiderSpawnManager
│   │   ├── SpawnPoint_01...06
│   │   └── CeilingDropPoint_01...04
│   └── BP_ExitTrigger
│
├── 🧑 PLAYER START
│   └── PlayerStart
│
├── 💡 ILUMINACIÓN
│   ├── DirectionalLight (muy tenue, azul)
│   ├── FlickeringLight_01...08 (Point Lights)
│   └── SkyAtmosphere
│
├── 🏚️ GEOMETRÍA
│   ├── Floor (Nanite Mesh)
│   ├── Walls (Modular, Nanite)
│   ├── Ceiling
│   ├── Props_Webs (telarañas decorativas)
│   └── Props_EggSacks
│
├── 🎬 POST PROCESSING
│   └── PostProcessVolume (Infinite Extent)
│
└── 🔊 AUDIO
    ├── AmbientSound_Cave
    └── AmbientSound_Creaks
```

---

## 🎨 Assets Recomendados — Lista Completa

### Personajes (Mixamo — Gratis)
| Asset | URL |
|-------|-----|
| Spider Monster | mixamo.com → busca "spider" |
| Zombie (Claustrofobia) | mixamo.com → busca "zombie" |
| Shadow Figure (Nictofobia) | mixamo.com → busca "ghost" |
| Flying Creature (Acrofobia) | mixamo.com → busca "gargoyle" |

### Entornos (Fab.com — Gratis)
| Pack | Nivel |
|------|-------|
| Modular Dungeon Kit | Aracnofobia |
| Dark Underground | Claustrofobia |
| Abandoned Building Interior | Nictofobia |
| Modular Urban Buildings | Acrofobia |

### Audio (Freesound.org — Gratis CC0)
| Sonido | Búsqueda |
|--------|----------|
| Latidos | "heartbeat horror" |
| Arañas | "spider crawling" |
| Viento | "wind howl" |
| Ambiente horror | "horror ambient drone" |
| Pasos | "footstep concrete" |

### Fuentes UI
- **Share Tech Mono** (Google Fonts) → estilo terminal como Lethal Company

---

## 🏗️ Estructura del Proyecto C++

```
Source/PhobiaHorrorGame/
├── Core/
│   ├── PhobiaTypes.h          Enums: EPhobiaLevel, EGameMode, EGamePhase
│   ├── PhobiaGameMode          Lógica de juego, fase, supervivencia
│   └── PhobiaGameInstance      Estado persistente entre niveles
│
├── Player/
│   ├── PhobiaPlayerCharacter   FPS: movimiento, input, interacción, vida
│   ├── SanityComponent         Cordura: baja en oscuridad/cerca del monstruo
│   ├── FlashlightComponent     Linterna: batería, parpadeo, on/off
│   └── InventoryComponent      Ítems: batería, medkit, sedativo, keycard
│
├── Enemy/
│   ├── EnemyBaseCharacter      Base: salud, estados, audio, ataque
│   ├── SpiderCharacter         Araña: telaraña, caída del techo, hiss
│   ├── SpiderAIController      IA: percepción (vista+oído), Blackboard, BT
│   ├── WebProjectileActor      Proyectil: vuela, ralentiza al jugador
│   └── SpiderSpawnManager      Spawn: periódico + jump scares del techo
│
├── Phobias/
│   ├── PhobiaEffectComponent   Base abstracta para efectos de fobia
│   ├── ArachnophobiaEffect     Jump scares, luces parpadeantes, skitter
│   ├── ClaustrophobiaEffect    FOV angosto, corazón, ralentiza en pasillos
│   ├── NyctophobiaEffect       Oscuridad, batería rápida, sombras que se mueven
│   └── AcrophobiaEffect        Vértigo, sway de cámara, daño por caída, viento
│
└── Interaction/
    ├── InteractableInterface   Interface: GetInteractionText() + Interact()
    ├── DoorActor               Puertas animadas, bloqueo por keycard
    ├── ItemPickupActor         Ítems flotantes con brillo de color
    └── ExitTriggerActor        Salida del nivel, verde/rojo según objetivos
```

---

## 🤖 Próximas Funciones — IA con Machine Learning

La IA del monstruo se mejorará con:

1. **Unity ML-Agents equivalente en UE5**: usar el plugin **Learning Agents** (incluido en UE 5.3)
2. El monstruo aprenderá mediante **Reinforcement Learning**:
   - Reward positivo: llegar al jugador
   - Reward negativo: ser evadido
3. **Comportamiento adaptativo**: si el jugador siempre esconde en el mismo lugar, la araña aprenderá a revisar ese lugar primero
4. **Predicción de movimiento**: la IA predecirá hacia dónde va el jugador en base a historial

---

## ❓ Problemas Comunes

| Error | Solución |
|-------|----------|
| "Unresolved external symbol" | Revisa que `PhobiaHorrorGame.Build.cs` tenga todos los módulos |
| La araña no se mueve | Construir el NavMesh: `Build → Build Paths` |
| Pantalla muy oscura | Sube `Exposure Compensation` en el Post Process Volume |
| AI no detecta al jugador | Asegúrate que el jugador tiene el tag `Player` + AIPerception activo |
| Lumen muy lento | Cambia a Path Tracing off, Hardware RT off si GPU < RTX 2070 |
| Los FBX de Mixamo importan en T-pose | Normal, las animaciones van separadas — reimportar con "Import Animations" |
