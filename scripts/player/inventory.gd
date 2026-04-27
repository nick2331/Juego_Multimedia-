extends Node

enum ItemType { BATTERY, MEDKIT, SEDATIVE, OBJECTIVE, KEYCARD }

class InventoryItem:
	var item_name: String
	var type:      ItemType
	var value:     float
	var icon:      Texture2D
	func _init(n: String, t: ItemType, v: float, i: Texture2D = null) -> void:
		item_name = n; type = t; value = v; icon = i

@export var max_slots: int = 4
var items: Array[InventoryItem] = []

signal item_picked_up(item: InventoryItem)
signal item_used(item: InventoryItem)
signal inventory_full

@onready var player = get_parent()

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	pass

func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("use_item"):
		use_first_usable()

func try_pickup(item: InventoryItem) -> bool:
	if items.size() >= max_slots:
		inventory_full.emit()
		return false
	items.append(item)
	item_picked_up.emit(item)
	return true

func use_first_usable() -> void:
	for item in items:
		if item.type in [ItemType.BATTERY, ItemType.MEDKIT, ItemType.SEDATIVE]:
			_apply(item)
			items.erase(item)
			item_used.emit(item)
			return

func _apply(item: InventoryItem) -> void:
	match item.type:
		ItemType.BATTERY:
			var fl := player.get_node_or_null("CameraHolder/Camera3D/Flashlight")
			if fl and fl.has_method("recharge"): fl.recharge(item.value)
		ItemType.MEDKIT:
			if player.has_method("heal"): player.heal(item.value)
		ItemType.SEDATIVE:
			var sanity := player.get_node_or_null("Sanity")
			if sanity and sanity.has_method("restore"): sanity.restore(item.value)

func has_item(type: ItemType) -> bool:
	return items.any(func(i): return i.type == type)

func remove_item(type: ItemType) -> bool:
	for item in items:
		if item.type == type:
			items.erase(item)
			return true
	return false
