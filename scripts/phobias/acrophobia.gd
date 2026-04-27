extends "res://scripts/phobias/phobia_base.gd"

# Efectos Acrofobia:
#  - Vértigo (oscilación del FOV) cuando el jugador está a gran altura
#  - Temblor de cámara proporcional a la altura
#  - Mayor daño por caída
#  - Sonido de viento / zumbido

@export var height_threshold:  float = 4.0    # metros sobre el suelo
@export var max_vertigo_fov:   float = 6.0    # variación pico del FOV
@export var vertigo_speed:     float = 1.8
@export var fall_damage_mult:  float = 2.0
@export var wind_sounds:       Array[AudioStream] = []

var _height:       float = 0.0
var _vertigo_time: float = 0.0
var _fov_base:     float = 75.0
var _wind_playing: bool  = false
var _prev_was_on_floor: bool = true
var _air_speed_y:       float = 0.0

@onready var _audio := AudioStreamPlayer.new()

func _setup() -> void:
	add_child(_audio)
	_fov_base = _get_camera().fov if _get_camera() else 75.0

func _tick(delta: float) -> void:
	_height = _measure_height()
	_update_vertigo(delta)
	_check_fall_damage()

func _measure_height() -> float:
	var space := player.get_world_3d().direct_space_state
	var q := PhysicsRayQueryParameters3D.create(
		player.global_position,
		player.global_position + Vector3.DOWN * 40.0)
	q.exclude = [player]
	var r := space.intersect_ray(q)
	if r.is_empty(): return 40.0
	return player.global_position.distance_to(r.position)

func _update_vertigo(delta: float) -> void:
	if _height < height_threshold:
		_vertigo_time = 0.0
		var cam := _get_camera()
		if cam: cam.fov = lerpf(cam.fov, _fov_base, 6.0 * delta)
		_stop_wind()
		return

	_vertigo_time += delta
	var t      := min((_height - height_threshold) / 10.0, 1.0) * intensity
	var swing  := sin(_vertigo_time * vertigo_speed) * max_vertigo_fov * t
	var cam    := _get_camera()
	if cam: cam.fov = _fov_base + swing
	_start_wind()

func _check_fall_damage() -> void:
	var on_floor := player.is_on_floor() if player.has_method("is_on_floor") else true
	if on_floor and not _prev_was_on_floor:
		var impact := abs(_air_speed_y)
		if impact > 8.0:
			var damage := (impact - 8.0) * fall_damage_mult * 5.0
			if player.has_method("take_damage"):
				player.take_damage(damage)
	_prev_was_on_floor = on_floor
	if not on_floor:
		_air_speed_y = player.velocity.y if "velocity" in player else 0.0

func _start_wind() -> void:
	if _wind_playing or wind_sounds.is_empty(): return
	_wind_playing   = true
	_audio.stream   = wind_sounds[randi() % wind_sounds.size()]
	_audio.volume_db = -12.0
	_audio.play()

func _stop_wind() -> void:
	if not _wind_playing: return
	_wind_playing = false
	_audio.stop()

func _get_camera() -> Camera3D:
	return player.get_node_or_null("CameraHolder/Camera3D")

func _on_deactivate() -> void:
	var cam := _get_camera()
	if cam: cam.fov = _fov_base
	_stop_wind()
