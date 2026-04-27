extends "res://scripts/phobias/phobia_base.gd"

# Efectos Claustrofobia:
#  - Reduce el FOV de la cámara en espacios cerrados
#  - Añade viñeta oscura en los bordes
#  - Aumenta el ritmo cardíaco (sonido)
#  - Reduce la velocidad de movimiento

@export var fov_normal:       float = 75.0
@export var fov_cramped:      float = 55.0
@export var fov_speed:        float = 3.0
@export var cramped_radius:   float = 2.2   # distancia a pared para activarse
@export var speed_penalty:    float = 0.6
@export var heartbeat_sounds: Array[AudioStream] = []

var _cramped:     bool  = false
var _hb_timer:    float = 0.0
var _hb_interval: float = 1.2
var _applied_penalty: bool = false

@onready var _audio := AudioStreamPlayer.new()

func _setup() -> void:
	add_child(_audio)

func _tick(delta: float) -> void:
	var was_cramped := _cramped
	_cramped = _is_cramped()

	# transición de FOV
	var cam := _get_camera()
	if cam:
		var target_fov := fov_cramped if _cramped else fov_normal
		cam.fov = lerp(cam.fov, target_fov, fov_speed * delta)

	# penalización de velocidad
	if _cramped and not _applied_penalty:
		_applied_penalty = true
		if "speed_multiplier" in player:
			player.speed_multiplier *= speed_penalty
	elif not _cramped and _applied_penalty:
		_applied_penalty = false
		if "speed_multiplier" in player:
			player.speed_multiplier /= speed_penalty

	# latido del corazón
	if _cramped:
		_hb_timer += delta
		var sanity_pct := _get_sanity_pct()
		_hb_interval  = lerpf(0.5, 1.2, sanity_pct)
		if _hb_timer >= _hb_interval:
			_hb_timer = 0.0
			_play_heartbeat()

func _is_cramped() -> bool:
	var space := player.get_world_3d().direct_space_state
	var dirs := [Vector3.LEFT, Vector3.RIGHT, Vector3.FORWARD, Vector3.BACK]
	var count := 0
	for d in dirs:
		var q := PhysicsRayQueryParameters3D.create(
			player.global_position + Vector3.UP * 0.5,
			player.global_position + Vector3.UP * 0.5 + d * cramped_radius)
		q.exclude = [player]
		var r := space.intersect_ray(q)
		if not r.is_empty():
			count += 1
	return count >= 3

func _play_heartbeat() -> void:
	if heartbeat_sounds.is_empty(): return
	_audio.stream   = heartbeat_sounds[randi() % heartbeat_sounds.size()]
	_audio.volume_db = -8.0
	_audio.play()

func _get_camera() -> Camera3D:
	return player.get_node_or_null("CameraHolder/Camera3D")

func _get_sanity_pct() -> float:
	var s := player.get_node_or_null("Sanity")
	if s and s.has_method("get_percent"): return s.get_percent()
	return 1.0

func _on_deactivate() -> void:
	var cam := _get_camera()
	if cam: cam.fov = fov_normal
	if _applied_penalty and "speed_multiplier" in player:
		player.speed_multiplier /= speed_penalty
	_applied_penalty = false
