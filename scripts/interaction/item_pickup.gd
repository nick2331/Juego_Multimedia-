extends Area3D

@export var item_name:   String  = "Item"
@export var item_type:   int     = 0     # matches inventory.gd ItemType enum
@export var item_value:  float   = 25.0
@export var item_icon:   Texture2D
@export var pickup_sound:AudioStream
@export var bob_speed:   float   = 1.5
@export var bob_height:  float   = 0.12

var _bob_time: float = 0.0
var _base_y:   float = 0.0
var _picked_up:bool  = false

signal picked_up(item_name: String)

@onready var _audio := AudioStreamPlayer3D.new()

func _ready() -> void:
	add_child(_audio)
	_base_y = position.y
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if _picked_up: return
	_bob_time  += delta
	position.y  = _base_y + sin(_bob_time * bob_speed) * bob_height

func _on_body_entered(body: Node3D) -> void:
	if _picked_up: return
	if not body.is_in_group("player"): return
	var inv := body.get_node_or_null("Inventory")
	if inv == null: return

	var item := _build_item()
	if inv.call("try_pickup", item):
		_do_pickup()

func _build_item() -> Object:
	# Dynamically construct an InventoryItem
	# inventory.gd is not autoloaded so we load its inner class via the script
	var inv_script := load("res://scripts/player/inventory.gd")
	var item       := inv_script.InventoryItem.new(item_name, item_type, item_value, item_icon)
	return item

func _do_pickup() -> void:
	_picked_up = true
	picked_up.emit(item_name)
	if pickup_sound:
		_audio.stream = pickup_sound
		_audio.play()
		await _audio.finished
	queue_free()

# Called by player's interact ray (E key) as alternative to walk-over
func interact(_interactor: Node) -> void:
	_on_body_entered(_interactor)
