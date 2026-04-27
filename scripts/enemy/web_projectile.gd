extends Area3D

@export var speed:         float = 12.0
@export var max_lifetime:  float = 4.0

var direction:      Vector3 = Vector3.ZERO
var slow_duration:  float   = 3.0
var lifetime:       float   = 0.0

func initialize(dir: Vector3, duration: float) -> void:
	direction     = dir.normalized()
	slow_duration = duration

func _physics_process(delta: float) -> void:
	lifetime += delta
	if lifetime >= max_lifetime:
		queue_free()
		return
	global_position += direction * speed * delta

func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		if body.has_method("apply_web_slow"):
			body.apply_web_slow(slow_duration)
		elif body.has_node("Inventory"):
			pass
		_stick_to(body)
	elif not body.is_in_group("enemies"):
		queue_free()

func _stick_to(target: Node3D) -> void:
	set_physics_process(false)
	var slow_node := _make_slow_component(target)
	target.add_child(slow_node)
	queue_free()

func _make_slow_component(target: Node3D) -> Node:
	var timer_node := Timer.new()
	timer_node.wait_time    = slow_duration
	timer_node.one_shot     = true
	timer_node.autostart    = true
	timer_node.name         = "WebSlowTimer"
	timer_node.timeout.connect(func():
		if is_instance_valid(target) and target.has_meta("web_slowed"):
			target.remove_meta("web_slowed")
			if "speed_multiplier" in target:
				target.speed_multiplier = 1.0
		timer_node.queue_free()
	)
	if "speed_multiplier" in target:
		target.speed_multiplier = 0.35
	target.set_meta("web_slowed", true)
	return timer_node
