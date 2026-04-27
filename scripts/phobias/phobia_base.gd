extends Node

# Base class for all phobia effect nodes.
# Attach a concrete subclass to the Player node.

@export var intensity: float = 1.0   # 0..1, driven by sanity or triggers

signal effect_activated
signal effect_deactivated

var _active: bool = false

@onready var player = get_parent()

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	_setup()

func _process(delta: float) -> void:
	if _active:
		_tick(delta)

# ── Overridable ───────────────────────────────────────────────────
func _setup() -> void:
	pass

func _tick(_delta: float) -> void:
	pass

func activate() -> void:
	if _active: return
	_active = true
	effect_activated.emit()
	_on_activate()

func deactivate() -> void:
	if not _active: return
	_active = false
	effect_deactivated.emit()
	_on_deactivate()

func _on_activate() -> void:
	pass

func _on_deactivate() -> void:
	pass

func is_active() -> bool:
	return _active
