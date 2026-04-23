# Phobia Horror Game — Estilo Lethal Company

Juego de horror en primera persona con 4 niveles basados en fobias famosas. Inspirado en Lethal Company.

---

## 🕷️ Las 4 Fobias / Niveles

| # | Fobia | Monstruo | Entorno |
|---|-------|----------|---------|
| 1 | **Aracnofobia** (Arañas) | Araña gigante con IA | Cueva/laboratorio oscuro con telarañas |
| 2 | **Claustrofobia** (Espacios cerrados) | Criatura de las paredes | Bunker subterráneo con pasillos estrechos |
| 3 | **Nictofobia** (Oscuridad) | Sombra sin forma | Edificio abandonado sin luz |
| 4 | **Acrofobia** (Alturas) | Entidad voladora | Rascacielos en ruinas, pasarelas |

---

## 🎮 Modos de Juego

- **Supervivencia**: Sobrevive X minutos mientras el monstruo te caza
- **Escapada**: Encuentra la salida antes de que la cordura llegue a 0
- **Objetivos**: Recoge ítems/activa palancas mientras evitas al monstruo

---

## 🛠️ Configuración en Unity — Guía Paso a Paso

### Paso 1: Instalar Unity

1. Descarga **Unity Hub** desde https://unity.com/download
2. Instala **Unity 2022.3 LTS** (versión estable recomendada)
3. Al instalar Unity, marca también:
   - ✅ Microsoft Visual Studio Community (editor de código)
   - ✅ Windows Build Support (o el de tu plataforma)

### Paso 2: Crear el Proyecto Unity

1. Abre Unity Hub → **New Project**
2. Selecciona template: **Universal Render Pipeline (URP)**
3. Nombre del proyecto: `PhobiaHorrorGame`
4. Selecciona la carpeta donde tienes clonado este repositorio
5. Click en **Create Project**

> ⚠️ IMPORTANTE: Unity generará muchos archivos automáticamente en la carpeta del proyecto.

### Paso 3: Instalar Paquetes Necesarios

Ve a **Window → Package Manager** e instala:

| Paquete | Para qué sirve |
|---------|---------------|
| `AI Navigation` | Pathfinding de la araña (NavMesh) |
| `Cinemachine` | Efectos de cámara (vértigo, sacudidas) |
| `Input System` | Control moderno del jugador |
| `Post Processing` | Efectos visuales (grain, vignette, bloom) |
| `TextMeshPro` | Textos de la UI |
| `ProBuilder` | Crear geometría de niveles dentro de Unity |

Para instalar: **Package Manager → Unity Registry → busca el nombre → Install**

### Paso 4: Configurar URP para Gráficos de Horror

1. En **Project → Assets**, busca `UniversalRenderPipelineAsset`
2. Configura:
   - **Shadows**: Distance = 150, Cascades = 4
   - **Post Processing**: ✅ Enabled
   - **HDR**: ✅ Enabled
   - **Anti Aliasing**: SMAA

### Paso 5: Copiar los Scripts

Los scripts de este repositorio van en:
```
Assets/Scripts/
```

1. Copia toda la carpeta `Assets/` de este repo a tu proyecto Unity
2. Unity compilará los scripts automáticamente

### Paso 6: Configurar la Escena Principal (Nivel Aracnofobia)

#### Jerarquía de la Escena (Hierarchy):
```
Scene: Level_Arachnophobia
├── --- MANAGERS ---
│   ├── GameManager          [GameManager.cs]
│   ├── LevelManager         [LevelManager.cs]  
│   ├── AudioManager         [AudioManager.cs]
│   ├── UIManager            [UIManager.cs]
│   └── ObjectiveManager     [ObjectiveManager.cs]
│
├── --- PLAYER ---
│   └── Player               [PlayerController.cs, PlayerHealth.cs, SanitySystem.cs]
│       ├── CameraHolder
│       │   └── MainCamera   [FlashlightController.cs]
│       │       └── Flashlight (Spotlight)
│       └── CharacterController
│
├── --- ENEMIES ---
│   └── SpiderSpawnManager   [SpiderSpawnManager.cs]
│       └── SpawnPoint_01..N
│
├── --- LEVEL GEOMETRY ---
│   ├── Floor
│   ├── Walls
│   ├── Ceiling
│   └── Props (telarañas, huevos, etc.)
│
├── --- LIGHTING ---
│   ├── DirectionalLight (muy tenue, color azul oscuro)
│   └── FlickeringLights (puntos de luz parpadeantes)
│
├── --- UI ---
│   └── Canvas
│       ├── HUD              [HUDController.cs]
│       ├── PauseMenu
│       └── DeathScreen
│
└── --- POST PROCESSING ---
    └── GlobalVolume         [PostProcessingController.cs]
```

### Paso 7: Configurar el Player

1. Crea un **GameObject vacío** → llámalo `Player`
2. Añade componentes:
   - `CharacterController` (Height: 1.8, Radius: 0.3)
   - Script `PlayerController`
   - Script `PlayerHealth`
   - Script `SanitySystem`
3. Crea un **hijo** llamado `CameraHolder`
4. Dentro crea otro hijo `MainCamera` con componente `Camera`
5. Añade al `MainCamera`:
   - Script `FlashlightController`
   - Un `Spotlight` hijo (la linterna)
   - `AudioListener`

### Paso 8: Configurar la Araña (Spider Enemy)

1. Importa o crea un modelo 3D de araña (ver sección Assets)
2. Añade componente `NavMeshAgent` al modelo
3. Añade scripts:
   - `EnemyBase`
   - `SpiderAI`
4. Configura en el Inspector:
   - Speed: 5
   - Detection Range: 20
   - Attack Range: 2
   - Attack Damage: 25

### Paso 9: Configurar NavMesh (Para que la Araña Camine)

1. Selecciona toda la geometría del nivel (suelo, paredes)
2. En el Inspector → **Static** → marca ✅ **Navigation Static**
3. Ve a **Window → AI → Navigation**
4. Tab **Bake** → click **Bake**
5. Verás una malla azul sobre el suelo — eso es el NavMesh

### Paso 10: Post-Processing (Gráficos Estilo Horror)

1. Crea un `Global Volume` en la escena: **GameObject → Volume → Global Volume**
2. En el Inspector, click **New** para crear un Profile
3. Click **Add Override** y añade:
   - **Film Grain**: Intensity 0.4, Type: Thin2
   - **Vignette**: Intensity 0.4, color negro
   - **Color Adjustments**: Saturation -20, contrast +10
   - **Bloom**: Intensity 0.5
   - **Chromatic Aberration**: Intensity 0.3
4. Asigna el script `PostProcessingController` al Volume

---

## 🎨 Assets Gratuitos Recomendados

### Modelos 3D
- **[Unity Asset Store - Gratuitos]**
  - "Abandoned Hospital" para ambiente
  - "Modular Cave" para el nivel de arañas
  - "Horror Hospital" para claustrofobia
  - "Spider (Animated)" para el enemigo

### Texturas
- **ambientcg.com** — texturas PBR gratuitas
- **3dtextures.me** — texturas de hormigón, óxido, cemento

### Sonidos
- **freesound.org** — efectos de horror
- **Sonniss GDC Audio** — pack gratuito de audio para juegos

### Fuentes (para el UI)
- **Share Tech Mono** (Google Fonts) — estilo Lethal Company

---

## 📁 Estructura de Archivos del Proyecto

```
Assets/
├── Scripts/
│   ├── Core/           GameManager, LevelManager, GameState
│   ├── Player/         PlayerController, PlayerHealth, Flashlight, Sanity
│   ├── Enemy/          EnemyBase, SpiderAI, SpiderSpawnManager
│   ├── Phobias/        ArachnophobiaEffect, ClaustrophobiaEffect, etc.
│   ├── Interaction/    InteractionSystem, DoorInteraction, ItemPickup
│   ├── UI/             UIManager, HUDController
│   ├── Audio/          AudioManager, AmbientSoundController
│   ├── Objectives/     ObjectiveManager, Objective
│   └── Effects/        PostProcessingController, AtmosphereController
├── Scenes/
│   ├── MainMenu.unity
│   ├── Level_Arachnophobia.unity
│   ├── Level_Claustrophobia.unity
│   ├── Level_Nyctophobia.unity
│   └── Level_Acrophobia.unity
├── Prefabs/
│   ├── Player/
│   ├── Enemies/
│   ├── Environment/
│   └── UI/
├── Materials/
├── Textures/
├── Audio/
└── Animations/
```

---

## 🐛 Problemas Comunes

| Error | Solución |
|-------|----------|
| "NavMeshAgent is not on NavMesh" | Re-hacer el Bake del NavMesh |
| Scripts con errores rojos | Instalar el paquete `AI Navigation` |
| Pantalla completamente negra | Verificar que la cámara tiene URP Renderer |
| `PostProcessingController` no funciona | Asignar el Volume Profile en el Inspector |

---

## 🔮 Próximas Funciones (IA del Monstruo)

La IA avanzada del monstruo se implementará con:
- **ML-Agents** (Unity): Entrenamiento por refuerzo
- El monstruo aprenderá a predecir movimientos del jugador
- Memoria de rutas del mapa
- Comportamiento adaptativo según nivel de cordura del jugador
