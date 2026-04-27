extends Area3D

@export var locked_by_default: bool        = true
@export var exit_sound:        AudioStream
@export var locked_sound:      AudioStream

var _unlocked: bool = false

signal exit_used
signal exit_locked_attempt

@onready var _audio := AudioStreamPlayer3D.new()

func _ready() -> void:
	add_child(_audio)
	_unlocked = not locked_by_default
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player"): return
	if not _unlocked:
		exit_locked_attempt.emit()
		if locked_sound:
			_audio.stream = locked_sound
			_audio.play()
		return
	_trigger_exit()

func _trigger_exit() -> void:
	if exit_sound:
		_audio.stream = exit_sound
		_audio.play()
	exit_used.emit()
	GameManager.notify_level_complete()

func unlock() -> void:
	_unlocked = true

func lock() -> void:
	_unlocked = false

# Called by level_manager when all objectives are done
func interact(_interactor: Node) -> void:
	_on_body_entered(_interactor)
