# Phobia Horror Game — Godot 4

Juego FPS de terror de primera persona inspirado en Lethal Company.  
4 niveles temáticos basados en fobias, 3 modos de juego, enemigo araña con IA de navegación.

---

## Requisitos

| Herramienta | Versión | Descarga |
|---|---|---|
| Godot 4 | 4.3 o superior | https://godotengine.org/download |
| Blender (opcional, exportar modelos) | 4.x | https://www.blender.org |

No se necesita instalar nada más. Godot incluye todo: editor, motor y exportador.

---

## Cómo abrir el proyecto

1. Descarga e instala **Godot 4** (versión estándar, no Mono/.NET).
2. Abre Godot → **Import** → selecciona la carpeta `Juego_Multimedia-`.
3. Espera a que importe los recursos (primera vez puede tardar 1-2 min).
4. Pulsa **F5** o el botón ▶ para ejecutar.

---

## Estructura de carpetas

```
Juego_Multimedia-/
├── scenes/
│   ├── levels/
│   │   ├── level_arachnophobia.tscn
│   │   ├── level_claustrophobia.tscn
│   │   ├── level_nyctophobia.tscn
│   │   └── level_acrophobia.tscn
│   ├── player/
│   │   └── player.tscn
│   ├── enemies/
│   │   ├── spider.tscn
│   │   └── web_projectile.tscn
│   └── ui/
│       └── hud.tscn
├── scripts/
│   ├── core/
│   │   ├── game_manager.gd      ← Autoload global singleton
│   │   └── level_manager.gd
│   ├── player/
│   │   ├── player.gd
│   │   ├── flashlight.gd
│   │   ├── sanity.gd
│   │   └── inventory.gd
│   ├── enemy/
│   │   ├── enemy_base.gd
│   │   ├── spider_ai.gd
│   │   ├── spider_spawn_manager.gd
│   │   └── web_projectile.gd
│   ├── phobias/
│   │   ├── phobia_base.gd
│   │   ├── arachnophobia.gd
│   │   ├── claustrophobia.gd
│   │   ├── nyctophobia.gd
│   │   └── acrophobia.gd
│   ├── interaction/
│   │   ├── door.gd
│   │   ├── item_pickup.gd
│   │   └── exit_trigger.gd
│   └── ui/
│       └── hud.gd
└── assets/
    ├── models/        ← FBX de Mixamo van aquí
    ├── textures/
    ├── sounds/
    └── fonts/
```

---

## Descargar el modelo de araña (Mixamo)

1. Ve a **https://www.adobe.com/products/mixamo.html** y crea cuenta gratuita.
2. Busca **"Spider"** en la pestaña Characters.
3. Descarga en formato **FBX for Unity** (funciona perfecto en Godot).
4. Arrastra el `.fbx` a la carpeta `assets/models/` dentro del editor de Godot.
5. Godot lo importa automáticamente como `MeshInstance3D` + `AnimationPlayer`.
6. Crea una escena `spider.tscn`, añade el modelo como hijo de un `CharacterBody3D`.
7. Asigna el script `scripts/enemy/spider_ai.gd` al `CharacterBody3D`.

### Animaciones necesarias (descarga en Mixamo individualmente):
- **Idle** — Spider idle
- **Walk** — Spider walk
- **Run** — Spider run
- **Attack** — Spider attack

---

## Descargar entornos (Fab.com)

1. Ve a **https://www.fab.com** (antes Marketplace de Epic).
2. Busca assets gratuitos de horror:
   - *"Horror Corridor"* o *"Abandoned Facility"*
   - *"Dark Dungeon"*
3. Descarga el paquete — elige formato **.glb** o **.obj** si hay opción.
4. Importa en Godot arrastrando a la carpeta `assets/models/`.

---

## Configurar la escena del jugador (player.tscn)

```
CharacterBody3D  [script: player.gd]  [grupo: "player"]
├── CollisionShape3D  (CapsuleShape3D)
├── CameraHolder  (Node3D)
│   └── Camera3D
│       ├── Flashlight  (SpotLight3D)  [script: flashlight.gd]
│       └── InteractRay  (RayCast3D)  longitud=2.5
├── AudioStreamPlayer3D  (nombre: FootstepAudio)
├── AudioStreamPlayer3D  (nombre: HurtAudio)
├── Inventory  (Node)  [script: inventory.gd]
├── Sanity  (Node)  [script: sanity.gd]
└── PhobiaEffect  (Node)  [script: arachnophobia.gd / claustrophobia.gd / etc.]
```

---

## Configurar la araña (spider.tscn)

```
CharacterBody3D  [script: spider_ai.gd]  [grupo: "enemies"]
├── CollisionShape3D  (CapsuleShape3D  r=0.5, h=1.2)
├── NavigationAgent3D
├── AudioStreamPlayer3D  (nombre: AudioStreamPlayer3D)
├── AnimationPlayer
└── SpiderMesh  (MeshInstance3D)  ← tu FBX de Mixamo
```

**Propiedades a configurar en el Inspector:**
- `web_scene` → arrastra `web_projectile.tscn`
- `web_range` → 10.0
- `web_cooldown` → 5.0
- `hiss_sound` → archivo de audio .ogg

---

## Configurar el HUD (hud.tscn)

La escena HUD debe tener esta jerarquía:

```
CanvasLayer  [script: hud.gd]
├── MarginContainer
│   └── VBox (VBoxContainer)
│       ├── HealthBar   (ProgressBar)
│       ├── BatteryBar  (ProgressBar)
│       └── SanityBar   (ProgressBar)
├── InteractLabel  (Label)  — centrado en pantalla
├── InventoryPanel  (PanelContainer)
│   └── Grid  (GridContainer)  columns=4
├── Crosshair  (TextureRect)  — punto central
├── Vignette  (ColorRect)  — full-screen, color negro, alpha 0 por defecto
├── ItemMessage  (Label)
├── DeathScreen  (Control)
├── WinScreen  (Control)
└── PauseMenu  (Control)
```

---

## Modos de juego

| Modo | Descripción |
|---|---|
| **Survival** | Sobrevive X segundos con la linterna encendida |
| **Escape** | Recoge los objetos objetivo y activa la salida |
| **Objectives** | Completa N misiones (interruptores, cajas, etc.) |

Selecciona el modo desde `GameManager` antes de cargar el nivel:
```gdscript
GameManager.start_level(GameManager.PhobiaLevel.ARACHNOPHOBIA, GameManager.GameMode.ESCAPE)
```

---

## Controles

| Acción | Tecla |
|---|---|
| Mover | WASD |
| Saltar | Espacio |
| Correr | Shift |
| Agacharse | Ctrl |
| Interactuar | E |
| Linterna | F |
| Usar ítem | Q |
| Pausa | Escape |

---

## Sonidos recomendados (gratuitos)

- **Freesound.org** — efectos de sonido libres (búsqueda: "spider", "heartbeat", "wind", "door creak")
- **Pixabay** — música ambiental de horror sin copyright
- Formatos soportados por Godot: `.ogg` (recomendado para loops), `.wav`, `.mp3`

---

## Rendimiento

El proyecto usa el renderizador **Forward Plus** para sombras dinámicas y luces volumétricas.  
Si el equipo es bajo de recursos, cambia a **Mobile** en:  
`Proyecto → Configuración del Proyecto → Renderizador → Modo de renderizado`
