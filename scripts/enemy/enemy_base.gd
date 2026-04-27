extends CharacterBody3D

# ── Estados ───────────────────────────────────────────────────────
enum State { IDLE, PATROL, ALERT, CHASE, ATTACK, DEAD }

# ── Stats ─────────────────────────────────────────────────────────
@export var max_health:     float = 100.0
@export var attack_damage:  float = 25.0
@export var attack_range:   float = 1.8
@export var attack_cooldown:float = 1.5

@export var patrol_speed:   float = 2.5
@export var chase_speed:    float = 6.0

# ── Detección ─────────────────────────────────────────────────────
@export var sight_range:    float = 18.0
@export var sight_angle:    float = 100.0
@export var hearing_range:  float = 12.0

# ── Patrulla ──────────────────────────────────────────────────────
@export var patrol_points:  Array[NodePath] = []
@export var patrol_wait:    float = 2.0

# ── Audio ─────────────────────────────────────────────────────────
@export var idle_sounds:    Array[AudioStream] = []
@export var alert_sound:    AudioStream
@export var attack_sound:   AudioStream
@export var death_sound:    AudioStream

# ── Estado interno ────────────────────────────────────────────────
var current_state:   State = State.PATROL
var current_health:  float
var attack_timer:    float = 0.0
var patrol_index:    int   = 0
var patrol_timer:    float = 0.0
var idle_sfx_timer:  float = 0.0

var player: CharacterBody3D = null

@onready var nav_agent := $NavigationAgent3D
@onready var audio     := $AudioStreamPlayer3D

signal state_changed(new_state: State)
signal enemy_died

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	current_health = max_health
	add_to_group("enemies")
	player = get_tree().get_first_node_in_group("player")
	nav_agent.velocity_computed.connect(_on_velocity_computed)

func _physics_process(delta: float) -> void:
	if current_state == State.DEAD: return
	attack_timer    += delta
	idle_sfx_timer  += delta
	_play_idle_sfx()
	_update_state(delta)

# ─────────────────────────────────────────────────────────────────
func _update_state(delta: float) -> void:
	match current_state:
		State.IDLE:   _state_idle(delta)
		State.PATROL: _state_patrol(delta)
		State.ALERT:  _state_alert(delta)
		State.CHASE:  _state_chase()
		State.ATTACK: _state_attack()

func _state_idle(delta: float) -> void:
	patrol_timer += delta
	if _can_see_player() or _can_hear_player():
		_set_state(State.CHASE)
	elif patrol_timer >= patrol_wait:
		_set_state(State.PATROL)

func _state_patrol(delta: float) -> void:
	if patrol_points.is_empty(): return
	if _can_see_player() or _can_hear_player():
		if alert_sound: audio.stream = alert_sound; audio.play()
		_set_state(State.CHASE)
		return
	var target := get_node(patrol_points[patrol_index])
	nav_agent.target_position = target.global_position
	if nav_agent.is_navigation_finished():
		_set_state(State.IDLE)
		patrol_index = (patrol_index + 1) % patrol_points.size()
	else:
		_move_along_nav(patrol_speed)

func _state_alert(_delta: float) -> void:
	if _can_see_player():
		_set_state(State.CHASE)

func _state_chase() -> void:
	if player == null: return
	nav_agent.target_position = player.global_position
	var dist := global_position.distance_to(player.global_position)
	if dist <= attack_range:
		_set_state(State.ATTACK)
		return
	_move_along_nav(chase_speed)

func _state_attack() -> void:
	if player == null: return
	var dist := global_position.distance_to(player.global_position)
	if dist > attack_range:
		_set_state(State.CHASE)
		return
	look_at(Vector3(player.global_position.x, global_position.y, player.global_position.z))
	if attack_timer >= attack_cooldown:
		attack_timer = 0.0
		_perform_attack()

func _perform_attack() -> void:
	if attack_sound: audio.stream = attack_sound; audio.play()
	if player and player.has_method("take_damage"):
		if global_position.distance_to(player.global_position) <= attack_range:
			player.take_damage(attack_damage)

# ── Movimiento NavMesh ────────────────────────────────────────────
func _move_along_nav(speed: float) -> void:
	if nav_agent.is_navigation_finished(): return
	var next := nav_agent.get_next_path_position()
	var dir  := (next - global_position).normalized()
	nav_agent.set_velocity(dir * speed)

func _on_velocity_computed(safe_velocity: Vector3) -> void:
	velocity = safe_velocity
	move_and_slide()

# ── Detección ─────────────────────────────────────────────────────
func _can_see_player() -> bool:
	if player == null: return false
	var to_player := player.global_position - global_position
	if to_player.length() > sight_range: return false
	var angle := rad_to_deg(transform.basis.z.angle_to(-to_player.normalized()))
	if angle > sight_angle * 0.5: return false
	var space := get_world_3d().direct_space_state
	var query  := PhysicsRayQueryParameters3D.create(
		global_position + Vector3.UP * 0.5,
		player.global_position + Vector3.UP * 0.5)
	query.exclude = [self]
	var result := space.intersect_ray(query)
	return result.is_empty() or result.collider == player

func _can_hear_player() -> bool:
	if player == null: return false
	var dist  := global_position.distance_to(player.global_position)
	var range := hearing_range
	if player.has_method("get_stamina_percent") and player.is_sprinting:
		range *= 1.8
	elif player.velocity.length() < 0.1:
		range *= 0.3
	return dist <= range

# ── Daño / Muerte ─────────────────────────────────────────────────
func take_damage(amount: float) -> void:
	if current_state == State.DEAD: return
	current_health -= amount
	if current_health <= 0.0: _die()

func _die() -> void:
	_set_state(State.DEAD)
	if death_sound: audio.stream = death_sound; audio.play()
	enemy_died.emit()
	await get_tree().create_timer(3.0).timeout
	queue_free()

func _set_state(new_state: State) -> void:
	current_state = new_state
	patrol_timer  = 0.0
	state_changed.emit(new_state)

func _play_idle_sfx() -> void:
	if idle_sounds.is_empty() or idle_sfx_timer < randf_range(8.0, 16.0): return
	idle_sfx_timer = 0.0
	audio.stream = idle_sounds[randi() % idle_sounds.size()]
	audio.volume_db = -15.0
	audio.play()
