extends Node3D

@export var spider_scene:       PackedScene
@export var max_spiders:        int   = 4
@export var spawn_interval:     float = 20.0
@export var ceiling_drop_chance:float = 0.4   # 40% chance to drop from ceiling

@export var spawn_points: Array[NodePath] = []

var active_spiders: Array[Node] = []
var spawn_timer:    float       = 0.0

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	spawn_timer = spawn_interval * 0.5  # primera araña aparece antes

func _process(delta: float) -> void:
	_clean_dead_spiders()
	if active_spiders.size() >= max_spiders: return
	spawn_timer += delta
	if spawn_timer >= spawn_interval:
		spawn_timer = 0.0
		_spawn_spider()

# ── Spawn ─────────────────────────────────────────────────────────
func _spawn_spider() -> void:
	if spider_scene == null or spawn_points.is_empty(): return
	var point := _pick_spawn_point()
	if point == null: return

	var spider := spider_scene.instantiate()
	get_tree().current_scene.add_child(spider)
	active_spiders.append(spider)

	if randf() < ceiling_drop_chance and spider.has_method("drop_from_ceiling"):
		spider.drop_from_ceiling(point.global_position)
	else:
		spider.global_position = point.global_position

	if spider.has_signal("enemy_died"):
		spider.enemy_died.connect(_on_spider_died.bind(spider))

func _pick_spawn_point() -> Node3D:
	var player := get_tree().get_first_node_in_group("player")
	var candidates: Array[Node3D] = []

	for path in spawn_points:
		var node := get_node_or_null(path) as Node3D
		if node == null: continue
		# no spawnear justo encima del jugador (mínimo 8 m)
		if player == null or node.global_position.distance_to(player.global_position) >= 8.0:
			candidates.append(node)

	if candidates.is_empty(): return null
	return candidates[randi() % candidates.size()]

# ── Limpieza ──────────────────────────────────────────────────────
func _clean_dead_spiders() -> void:
	active_spiders = active_spiders.filter(func(s): return is_instance_valid(s))

func _on_spider_died(spider: Node) -> void:
	active_spiders.erase(spider)

# ── API pública ───────────────────────────────────────────────────
func force_spawn(pos: Vector3) -> void:
	if spider_scene == null: return
	var spider := spider_scene.instantiate()
	get_tree().current_scene.add_child(spider)
	active_spiders.append(spider)
	if spider.has_method("drop_from_ceiling"):
		spider.drop_from_ceiling(pos)
	else:
		spider.global_position = pos
	if spider.has_signal("enemy_died"):
		spider.enemy_died.connect(_on_spider_died.bind(spider))

func get_active_count() -> int:
	_clean_dead_spiders()
	return active_spiders.size()
