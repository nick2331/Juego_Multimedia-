extends Node3D

@export var requires_keycard: bool        = false
@export var open_sound:       AudioStream
@export var locked_sound:     AudioStream
@export var open_angle:       float       = 90.0
@export var open_speed:       float       = 3.0

var _is_open:   bool  = false
var _is_locked: bool  = false
var _angle_cur: float = 0.0

signal door_opened
signal door_locked_attempt

@onready var _audio := AudioStreamPlayer3D.new()
@onready var _hinge := $Hinge   # Node3D acting as the rotation pivot

func _ready() -> void:
	add_child(_audio)
	_is_locked = requires_keycard

func _process(delta: float) -> void:
	var target := open_angle if _is_open else 0.0
	_angle_cur  = lerpf(_angle_cur, target, open_speed * delta)
	if is_instance_valid(_hinge):
		_hinge.rotation_degrees.y = _angle_cur

# Called by the player's interact system
func interact(interactor: Node) -> void:
	if _is_locked:
		_try_unlock(interactor)
		return
	_toggle()

func _try_unlock(interactor: Node) -> void:
	var inv := interactor.get_node_or_null("Inventory")
	if inv and inv.has_method("remove_item"):
		# ItemType.KEYCARD == 4  (matches inventory.gd enum)
		if inv.remove_item(4):
			_is_locked = false
			_toggle()
			return
	door_locked_attempt.emit()
	if locked_sound:
		_audio.stream = locked_sound
		_audio.play()

func _toggle() -> void:
	_is_open = not _is_open
	if open_sound:
		_audio.stream = open_sound
		_audio.play()
	if _is_open:
		door_opened.emit()

func lock() -> void:
	_is_locked = true

func unlock() -> void:
	_is_locked = false

func is_open() -> bool:
	return _is_open
