extends Node

# ── Configuración ─────────────────────────────────────────────────
@export var survival_duration: float = 180.0
@export var intro_duration: float    = 3.0

# ── Objetivos ─────────────────────────────────────────────────────
var objectives_total:     int = 0
var objectives_completed: int = 0
var exit_unlocked:        bool = false

# ── Supervivencia ─────────────────────────────────────────────────
var survival_elapsed: float = 0.0
var level_active:     bool  = false

# ── Señales ───────────────────────────────────────────────────────
signal level_started
signal objective_completed(current: int, total: int)
signal all_objectives_done
signal exit_unlocked_signal
signal survival_tick(progress: float)

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	await get_tree().create_timer(intro_duration).timeout
	level_active = true
	level_started.emit()

func _process(delta: float) -> void:
	if not level_active: return
	if GameManager.selected_mode == GameManager.GameMode.SURVIVAL:
		survival_elapsed += delta
		survival_tick.emit(survival_elapsed / survival_duration)
		if survival_elapsed >= survival_duration:
			GameManager.notify_level_complete()

# ─────────────────────────────────────────────────────────────────
func register_objective() -> void:
	objectives_total += 1

func complete_objective() -> void:
	objectives_completed += 1
	objective_completed.emit(objectives_completed, objectives_total)
	if objectives_completed >= objectives_total:
		all_objectives_done.emit()
		unlock_exit()

func unlock_exit() -> void:
	exit_unlocked = true
	exit_unlocked_signal.emit()

func trigger_exit() -> void:
	if GameManager.selected_mode == GameManager.GameMode.ESCAPE:
		GameManager.notify_level_complete()

func get_survival_progress() -> float:
	return survival_elapsed / survival_duration if survival_duration > 0 else 0.0
