extends SpotLight3D

# ── Configuración ─────────────────────────────────────────────────
@export var max_battery:       float = 100.0
@export var drain_rate:        float = 3.0
@export var flicker_threshold: float = 20.0
@export var normal_energy:     float = 2.0

@export var toggle_sound: AudioStream
@export var dead_sound:   AudioStream

# Modificador externo (Nictofobia lo sube)
var drain_multiplier: float = 1.0

var current_battery: float = 100.0
var is_on:           bool  = true
var is_flickering:   bool  = false
var flicker_timer:   float = 0.0

signal battery_changed(percent: float)
signal flashlight_died

@onready var audio := AudioStreamPlayer3D.new()

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	current_battery = max_battery
	add_child(audio)

func _process(delta: float) -> void:
	if not is_on or current_battery <= 0.0: return
	_drain(delta)
	if is_flickering: _update_flicker(delta)

func _drain(delta: float) -> void:
	current_battery = max(0.0, current_battery - drain_rate * drain_multiplier * delta)
	battery_changed.emit(current_battery / max_battery)

	# Reducir energía con la batería
	light_energy = lerp(normal_energy * 0.15, normal_energy, current_battery / max_battery)

	if current_battery <= flicker_threshold and not is_flickering:
		is_flickering = true
	if current_battery <= 0.0:
		_kill()

func _update_flicker(delta: float) -> void:
	flicker_timer += delta
	if flicker_timer >= randf_range(0.03, 0.12):
		flicker_timer = 0.0
		light_energy = randf_range(normal_energy * 0.05, normal_energy * 0.9)

func toggle() -> void:
	is_on = !is_on
	visible = is_on and current_battery > 0.0
	if toggle_sound:
		audio.stream = toggle_sound
		audio.play()

func recharge(amount: float) -> void:
	current_battery = min(max_battery, current_battery + amount)
	battery_changed.emit(current_battery / max_battery)
	if current_battery > flicker_threshold:
		is_flickering = false
		light_energy  = normal_energy
	if current_battery > 0.0 and not is_on:
		is_on   = true
		visible = true

func _kill() -> void:
	is_on        = false
	is_flickering = false
	visible      = false
	if dead_sound:
		audio.stream = dead_sound
		audio.play()
	flashlight_died.emit()

func is_flashlight_on() -> bool: return is_on and current_battery > 0.0
func get_battery_percent() -> float: return current_battery / max_battery
