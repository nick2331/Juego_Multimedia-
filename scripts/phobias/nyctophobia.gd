extends "res://scripts/phobias/phobia_base.gd"

# Efectos Nictofobia:
#  - Duplica el drenaje de batería de la linterna
#  - Mayor pérdida de cordura en oscuridad
#  - Sombras/siluetas que el jugador "cree" ver

@export var drain_multiplier:    float = 2.2
@export var sanity_dark_mult:    float = 2.0
@export var shadow_sounds:       Array[AudioStream] = []
@export var shadow_interval_min: float = 8.0
@export var shadow_interval_max: float = 20.0

var _shadow_timer:   float = 0.0
var _next_shadow:    float = 0.0
var _applied:        bool  = false

@onready var _audio := AudioStreamPlayer.new()

func _setup() -> void:
	add_child(_audio)
	_next_shadow = randf_range(shadow_interval_min, shadow_interval_max)

func _on_activate() -> void:
	_apply_modifiers()

func _on_deactivate() -> void:
	_remove_modifiers()

func _apply_modifiers() -> void:
	if _applied: return
	_applied = true
	var fl := player.get_node_or_null("CameraHolder/Camera3D/Flashlight")
	if fl and "drain_multiplier" in fl:
		fl.drain_multiplier *= drain_multiplier
	var sanity := player.get_node_or_null("Sanity")
	if sanity and "loss_in_dark" in sanity:
		sanity.loss_in_dark *= sanity_dark_mult

func _remove_modifiers() -> void:
	if not _applied: return
	_applied = false
	var fl := player.get_node_or_null("CameraHolder/Camera3D/Flashlight")
	if fl and "drain_multiplier" in fl:
		fl.drain_multiplier /= drain_multiplier
	var sanity := player.get_node_or_null("Sanity")
	if sanity and "loss_in_dark" in sanity:
		sanity.loss_in_dark /= sanity_dark_mult

func _tick(delta: float) -> void:
	_shadow_timer += delta
	if _shadow_timer >= _next_shadow:
		_shadow_timer = 0.0
		_next_shadow  = randf_range(shadow_interval_min, shadow_interval_max)
		_play_shadow_sound()

func _play_shadow_sound() -> void:
	if shadow_sounds.is_empty(): return
	_audio.stream   = shadow_sounds[randi() % shadow_sounds.size()]
	_audio.volume_db = randf_range(-14.0, -4.0)
	_audio.play()
