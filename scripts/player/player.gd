extends CharacterBody3D

# ── Nodos (asignar en el Inspector del Editor) ────────────────────
@onready var camera:          Camera3D         = $CameraHolder/Camera3D
@onready var camera_holder:   Node3D           = $CameraHolder
@onready var flashlight_node: SpotLight3D      = $CameraHolder/Camera3D/Flashlight
@onready var interact_ray:    RayCast3D        = $CameraHolder/Camera3D/InteractRay
@onready var anim_player:     AnimationPlayer  = $AnimationPlayer
@onready var footstep_audio:  AudioStreamPlayer3D = $FootstepAudio
@onready var hurt_audio:      AudioStreamPlayer3D = $HurtAudio

# ── Movimiento ────────────────────────────────────────────────────
@export var walk_speed:   float = 5.0
@export var sprint_speed: float = 9.0
@export var crouch_speed: float = 2.5
@export var jump_force:   float = 5.0
@export var gravity:      float = 20.0
@export var mouse_sensitivity: float = 0.002

# ── Stamina ───────────────────────────────────────────────────────
@export var max_stamina:    float = 100.0
@export var stamina_drain:  float = 25.0
@export var stamina_regen:  float = 15.0
var current_stamina: float = 100.0

# ── Vida ──────────────────────────────────────────────────────────
@export var max_health:   float = 100.0
@export var regen_delay:  float = 8.0
@export var regen_rate:   float = 5.0
var current_health: float = 100.0
var regen_timer:    float = 0.0
var is_dead:        bool  = false

# ── Sonidos de pasos ──────────────────────────────────────────────
@export var footstep_sounds: Array[AudioStream] = []
@export var hurt_sounds:     Array[AudioStream] = []
var footstep_timer: float = 0.0

# ── Estado ────────────────────────────────────────────────────────
var is_sprinting: bool = false
var is_crouching: bool = false

# Modificadores externos (efectos de fobia)
var speed_multiplier:       float = 1.0
var sensitivity_multiplier: float = 1.0

# ── Señales ───────────────────────────────────────────────────────
signal health_changed(percent: float)
signal stamina_changed(percent: float)
signal player_died

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	current_health  = max_health
	current_stamina = max_stamina
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and not is_dead:
		rotate_y(-event.relative.x * mouse_sensitivity * sensitivity_multiplier)
		camera_holder.rotate_x(-event.relative.y * mouse_sensitivity * sensitivity_multiplier)
		camera_holder.rotation.x = clamp(camera_holder.rotation.x, deg_to_rad(-85), deg_to_rad(85))

func _physics_process(delta: float) -> void:
	if is_dead: return

	_handle_pause()
	_apply_gravity(delta)
	_handle_jump()
	_handle_crouch()
	_handle_movement(delta)
	_handle_stamina(delta)
	_handle_health_regen(delta)
	_handle_footsteps(delta)
	_handle_interact()
	move_and_slide()

# ─────────────────────────────────────────────────────────────────
func _handle_pause() -> void:
	if Input.is_action_just_pressed("pause"):
		GameManager.toggle_pause()

func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= gravity * delta

func _handle_jump() -> void:
	if Input.is_action_just_pressed("jump") and is_on_floor() and not is_crouching:
		velocity.y = jump_force

func _handle_crouch() -> void:
	if Input.is_action_just_pressed("crouch"):
		is_crouching = !is_crouching

func _handle_movement(delta: float) -> void:
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	is_sprinting = Input.is_action_pressed("sprint") and current_stamina > 0 \
	               and not is_crouching and input_dir.y < 0

	var target_speed: float
	if is_crouching:     target_speed = crouch_speed
	elif is_sprinting:   target_speed = sprint_speed
	else:                target_speed = walk_speed
	target_speed *= speed_multiplier

	if direction:
		velocity.x = direction.x * target_speed
		velocity.z = direction.z * target_speed
	else:
		velocity.x = move_toward(velocity.x, 0, target_speed)
		velocity.z = move_toward(velocity.z, 0, target_speed)

func _handle_stamina(delta: float) -> void:
	if is_sprinting and velocity.length() > 0.5:
		current_stamina = max(0.0, current_stamina - stamina_drain * delta)
	else:
		current_stamina = min(max_stamina, current_stamina + stamina_regen * delta)
	stamina_changed.emit(current_stamina / max_stamina)

func _handle_health_regen(delta: float) -> void:
	if current_health >= max_health: return
	regen_timer += delta
	if regen_timer >= regen_delay:
		current_health = min(max_health, current_health + regen_rate * delta)
		health_changed.emit(current_health / max_health)

func _handle_footsteps(delta: float) -> void:
	var moving := velocity.length() > 0.5 and is_on_floor()
	if not moving: return
	var interval := 0.35 if is_sprinting else 0.55
	footstep_timer += delta
	if footstep_timer >= interval:
		footstep_timer = 0.0
		_play_footstep()

func _play_footstep() -> void:
	if footstep_sounds.is_empty(): return
	footstep_audio.stream = footstep_sounds[randi() % footstep_sounds.size()]
	footstep_audio.volume_db = -10.0
	footstep_audio.play()

func _handle_interact() -> void:
	if Input.is_action_just_pressed("interact") and interact_ray.is_colliding():
		var target := interact_ray.get_collider()
		if target and target.has_method("interact"):
			target.interact(self)

# ── API Pública ───────────────────────────────────────────────────
func take_damage(amount: float) -> void:
	if is_dead: return
	regen_timer = 0.0
	current_health = max(0.0, current_health - amount)
	health_changed.emit(current_health / max_health)
	if not hurt_sounds.is_empty():
		hurt_audio.stream = hurt_sounds[randi() % hurt_sounds.size()]
		hurt_audio.play()
	if current_health <= 0.0:
		_die()

func heal(amount: float) -> void:
	current_health = min(max_health, current_health + amount)
	health_changed.emit(current_health / max_health)

func _die() -> void:
	is_dead = true
	player_died.emit()
	GameManager.notify_player_died()

func get_health_percent() -> float: return current_health / max_health
func get_stamina_percent() -> float: return current_stamina / max_stamina
