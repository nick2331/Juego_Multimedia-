extends "res://scripts/phobias/phobia_base.gd"

# Efectos Aracnofobia:
#  - Tiembla la cámara al ver una araña cerca
#  - Aumenta loss_near_enemy en el nodo Sanity
#  - Puede mostrar siluetas fantasma de arañas

@export var shake_radius:      float = 8.0
@export var max_shake:         float = 0.015
@export var sanity_multiplier: float = 1.6
@export var jumpscare_sounds:  Array[AudioStream] = []

var _shake_offset:  Vector3 = Vector3.ZERO
var _sfx_cooldown:  float   = 0.0
var _jumpscare_done:bool    = false

@onready var _audio := AudioStreamPlayer.new()

func _setup() -> void:
	add_child(_audio)
	var sanity := player.get_node_or_null("Sanity")
	if sanity:
		sanity.loss_near_enemy *= sanity_multiplier

func _tick(delta: float) -> void:
	_sfx_cooldown = max(0.0, _sfx_cooldown - delta)
	var spider := _closest_spider()
	if spider == null:
		_shake_offset = Vector3.ZERO
		return
	var dist := player.global_position.distance_to(spider.global_position)
	if dist <= shake_radius:
		var t := 1.0 - (dist / shake_radius)
		_apply_shake(t)
		if dist <= 3.0 and not _jumpscare_done and _sfx_cooldown <= 0.0:
			_play_jumpscare()
	else:
		_shake_offset = Vector3.ZERO

func _apply_shake(t: float) -> void:
	var cam_holder := player.get_node_or_null("CameraHolder")
	if cam_holder == null: return
	var s := max_shake * t * intensity
	_shake_offset = Vector3(
		randf_range(-s, s),
		randf_range(-s, s),
		0.0
	)
	cam_holder.position = _shake_offset

func _play_jumpscare() -> void:
	if jumpscare_sounds.is_empty(): return
	_sfx_cooldown   = 8.0
	_audio.stream   = jumpscare_sounds[randi() % jumpscare_sounds.size()]
	_audio.volume_db = randf_range(-6.0, 0.0)
	_audio.play()

func _closest_spider() -> Node3D:
	var enemies := get_tree().get_nodes_in_group("enemies")
	var closest: Node3D = null
	var best_dist := INF
	for e in enemies:
		var d := player.global_position.distance_to(e.global_position)
		if d < best_dist:
			best_dist = d
			closest   = e
	return closest

func _on_deactivate() -> void:
	var cam_holder := player.get_node_or_null("CameraHolder")
	if cam_holder:
		cam_holder.position = Vector3.ZERO
