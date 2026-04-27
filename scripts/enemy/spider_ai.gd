extends "res://scripts/enemy/enemy_base.gd"

# ── Telaraña ──────────────────────────────────────────────────────
@export var web_scene:        PackedScene
@export var web_range:        float = 10.0
@export var web_cooldown:     float = 5.0
@export var web_slow_duration:float = 3.0
@export var web_shoot_sound:  AudioStream

# ── Caída del techo ───────────────────────────────────────────────
@export var can_drop_ceiling: bool  = true
@export var hiss_sound:       AudioStream
@export var land_fx_scene:    PackedScene

# ── Animaciones ───────────────────────────────────────────────────
@onready var anim: AnimationPlayer = $AnimationPlayer

var web_timer:   float = 0.0
var is_dropping: bool  = false

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	super._ready()
	attack_damage  = 30.0
	patrol_speed   = 3.0
	chase_speed    = 7.5
	attack_range   = 2.0
	web_timer      = web_cooldown

func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	web_timer = min(web_cooldown, web_timer + delta)
	if current_state == State.CHASE and not is_dropping:
		_try_web_attack()
	_update_animation()

# ── Telaraña ──────────────────────────────────────────────────────
func _try_web_attack() -> void:
	if player == null or web_scene == null: return
	if web_timer < web_cooldown: return
	var dist := global_position.distance_to(player.global_position)
	if dist <= web_range and dist > attack_range:
		web_timer = 0.0
		_shoot_web()

func _shoot_web() -> void:
	if web_shoot_sound:
		audio.stream = web_shoot_sound
		audio.play()
	var web := web_scene.instantiate()
	get_tree().current_scene.add_child(web)
	web.global_position = global_position + Vector3.UP * 1.0
	var dir := (player.global_position - web.global_position).normalized()
	if web.has_method("initialize"):
		web.initialize(dir, web_slow_duration)

# ── Caída del techo ───────────────────────────────────────────────
func drop_from_ceiling(target_pos: Vector3) -> void:
	if not can_drop_ceiling or is_dropping: return
	is_dropping = true
	global_position = target_pos + Vector3.UP * 3.5
	if hiss_sound:
		audio.stream = hiss_sound
		audio.volume_db = 0.0
		audio.play()
	velocity = Vector3.DOWN * 8.0
	await get_tree().create_timer(0.7).timeout
	if land_fx_scene:
		var fx := land_fx_scene.instantiate()
		get_tree().current_scene.add_child(fx)
		fx.global_position = global_position
	is_dropping = false
	_set_state(State.CHASE)

# ── Override ataque ───────────────────────────────────────────────
func _perform_attack() -> void:
	super._perform_attack()
	if anim and anim.has_animation("Attack"):
		anim.play("Attack")
	if hiss_sound:
		audio.stream = hiss_sound
		audio.play()

# ── Animaciones ───────────────────────────────────────────────────
func _update_animation() -> void:
	if anim == null: return
	match current_state:
		State.PATROL: if anim.has_animation("Walk"):   anim.play("Walk")
		State.CHASE:  if anim.has_animation("Run"):    anim.play("Run")
		State.IDLE:   if anim.has_animation("Idle"):   anim.play("Idle")
		State.DEAD:   if anim.has_animation("Death"):  anim.play("Death")
