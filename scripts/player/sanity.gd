extends Node

# ── Configuración ─────────────────────────────────────────────────
@export var max_sanity:             float = 100.0
@export var loss_in_dark:           float = 2.0
@export var loss_near_enemy:        float = 18.0
@export var enemy_detect_radius:    float = 12.0
@export var regen_rate:             float = 4.0
@export var regen_delay:            float = 5.0
@export var low_sanity_threshold:   float = 40.0
@export var hallucination_sounds:   Array[AudioStream] = []

var current_sanity: float = 100.0
var regen_timer:    float = 0.0
var halluc_timer:   float = 0.0

signal sanity_changed(percent: float)
signal sanity_depleted
signal low_sanity_changed(is_low: bool)

@onready var audio := AudioStreamPlayer.new()
@onready var player: CharacterBody3D = get_parent()

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	current_sanity = max_sanity
	add_child(audio)

func _process(delta: float) -> void:
	var losing := false

	if _is_in_dark():
		_lose(loss_in_dark * delta)
		losing = true

	if _enemy_nearby():
		_lose(loss_near_enemy * delta)
		losing = true

	if not losing:
		regen_timer += delta
		if regen_timer >= regen_delay:
			current_sanity = min(max_sanity, current_sanity + regen_rate * delta)
			sanity_changed.emit(get_percent())
	else:
		regen_timer = 0.0

	if current_sanity < low_sanity_threshold:
		_try_hallucination(delta)

func _lose(amount: float) -> void:
	regen_timer = 0.0
	current_sanity = max(0.0, current_sanity - amount)
	sanity_changed.emit(get_percent())
	low_sanity_changed.emit(current_sanity < low_sanity_threshold)
	if current_sanity <= 0.0:
		sanity_depleted.emit()
		if player.has_method("take_damage"):
			player.take_damage(999.0)

func restore(amount: float) -> void:
	current_sanity = min(max_sanity, current_sanity + amount)
	sanity_changed.emit(get_percent())

func _is_in_dark() -> bool:
	var fl := player.get_node_or_null("CameraHolder/Camera3D/Flashlight")
	if fl and fl.has_method("is_flashlight_on"):
		return not fl.is_flashlight_on()
	return false

func _enemy_nearby() -> bool:
	var enemies := get_tree().get_nodes_in_group("enemies")
	for e in enemies:
		if player.global_position.distance_to(e.global_position) <= enemy_detect_radius:
			return true
	return false

func _try_hallucination(delta: float) -> void:
	halluc_timer += delta
	var interval := lerpf(6.0, 20.0, get_percent())
	if halluc_timer >= interval and not hallucination_sounds.is_empty():
		halluc_timer = 0.0
		audio.stream = hallucination_sounds[randi() % hallucination_sounds.size()]
		audio.volume_db = randf_range(-12.0, -3.0)
		audio.play()

func get_percent() -> float: return current_sanity / max_sanity
func is_critical() -> bool:  return current_sanity < low_sanity_threshold * 0.5
