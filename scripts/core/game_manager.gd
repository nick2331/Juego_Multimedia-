extends Node

# ── Enums ─────────────────────────────────────────────────────────
enum PhobiaLevel { ARACHNOPHOBIA, CLAUSTROPHOBIA, NYCTOPHOBIA, ACROPHOBIA }
enum GameMode    { SURVIVAL, ESCAPE, OBJECTIVES }
enum GamePhase   { MAIN_MENU, PLAYING, PAUSED, DEAD, LEVEL_COMPLETE }

# ── Estado global ─────────────────────────────────────────────────
var current_phase: GamePhase = GamePhase.MAIN_MENU
var selected_level: PhobiaLevel = PhobiaLevel.ARACHNOPHOBIA
var selected_mode:  GameMode    = GameMode.ESCAPE
var death_count:    int         = 0
var completed_levels: int       = 0
var total_play_time: float      = 0.0

# ── Escenas de nivel ──────────────────────────────────────────────
const LEVEL_SCENES = {
	PhobiaLevel.ARACHNOPHOBIA: "res://scenes/levels/level_arachnophobia.tscn",
	PhobiaLevel.CLAUSTROPHOBIA: "res://scenes/levels/level_claustrophobia.tscn",
	PhobiaLevel.NYCTOPHOBIA:   "res://scenes/levels/level_nyctophobia.tscn",
	PhobiaLevel.ACROPHOBIA:    "res://scenes/levels/level_acrophobia.tscn",
}
const MAIN_MENU_SCENE = "res://scenes/main_menu.tscn"

# ── Señales ───────────────────────────────────────────────────────
signal phase_changed(new_phase: GamePhase)
signal player_died
signal level_completed

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _process(delta: float) -> void:
	if current_phase == GamePhase.PLAYING:
		total_play_time += delta

# ─────────────────────────────────────────────────────────────────
func start_level(level: PhobiaLevel, mode: GameMode) -> void:
	selected_level = level
	selected_mode  = mode
	set_phase(GamePhase.PLAYING)
	get_tree().change_scene_to_file(LEVEL_SCENES[level])

func return_to_menu() -> void:
	set_phase(GamePhase.MAIN_MENU)
	Engine.time_scale = 1.0
	get_tree().change_scene_to_file(MAIN_MENU_SCENE)

func restart_level() -> void:
	set_phase(GamePhase.PLAYING)
	Engine.time_scale = 1.0
	get_tree().reload_current_scene()

func notify_player_died() -> void:
	death_count += 1
	set_phase(GamePhase.DEAD)
	player_died.emit()

func notify_level_complete() -> void:
	completed_levels += 1
	set_phase(GamePhase.LEVEL_COMPLETE)
	level_completed.emit()

func toggle_pause() -> void:
	if current_phase == GamePhase.PLAYING:
		set_phase(GamePhase.PAUSED)
	elif current_phase == GamePhase.PAUSED:
		set_phase(GamePhase.PLAYING)

func set_phase(new_phase: GamePhase) -> void:
	current_phase = new_phase
	match new_phase:
		GamePhase.PLAYING:
			Engine.time_scale = 1.0
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		GamePhase.PAUSED:
			Engine.time_scale = 0.0
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		GamePhase.DEAD:
			Engine.time_scale = 0.3
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		GamePhase.MAIN_MENU, GamePhase.LEVEL_COMPLETE:
			Engine.time_scale = 1.0
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	phase_changed.emit(new_phase)
