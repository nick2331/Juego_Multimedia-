extends CanvasLayer

# ── Nodos esperados en la escena HUD ─────────────────────────────
@onready var health_bar:       ProgressBar  = $MarginContainer/VBox/HealthBar
@onready var battery_bar:      ProgressBar  = $MarginContainer/VBox/BatteryBar
@onready var sanity_bar:       ProgressBar  = $MarginContainer/VBox/SanityBar
@onready var interact_label:   Label        = $InteractLabel
@onready var inventory_panel:  Control      = $InventoryPanel
@onready var inventory_grid:   GridContainer= $InventoryPanel/Grid
@onready var crosshair:        TextureRect  = $Crosshair
@onready var vignette:         ColorRect    = $Vignette
@onready var death_screen:     Control      = $DeathScreen
@onready var win_screen:       Control      = $WinScreen
@onready var pause_menu:       Control      = $PauseMenu
@onready var item_msg_label:   Label        = $ItemMessage

var _player: Node = null
var _msg_timer: float = 0.0

# ─────────────────────────────────────────────────────────────────
func _ready() -> void:
	death_screen.hide()
	win_screen.hide()
	pause_menu.hide()
	interact_label.hide()
	item_msg_label.hide()

	await get_tree().process_frame
	_player = get_tree().get_first_node_in_group("player")
	if _player:
		_connect_player_signals()

	GameManager.phase_changed.connect(_on_phase_changed)

func _process(delta: float) -> void:
	_update_vignette()
	if _msg_timer > 0.0:
		_msg_timer -= delta
		if _msg_timer <= 0.0:
			item_msg_label.hide()

# ── Señales del jugador ───────────────────────────────────────────
func _connect_player_signals() -> void:
	if _player.has_signal("health_changed"):
		_player.health_changed.connect(_on_health_changed)
	var fl := _player.get_node_or_null("CameraHolder/Camera3D/Flashlight")
	if fl and fl.has_signal("battery_changed"):
		fl.battery_changed.connect(_on_battery_changed)
	var sanity := _player.get_node_or_null("Sanity")
	if sanity and sanity.has_signal("sanity_changed"):
		sanity.sanity_changed.connect(_on_sanity_changed)
	var inv := _player.get_node_or_null("Inventory")
	if inv:
		if inv.has_signal("item_picked_up"):
			inv.item_picked_up.connect(_on_item_picked_up)
		if inv.has_signal("item_used"):
			inv.item_used.connect(_on_item_used)
		if inv.has_signal("inventory_full"):
			inv.inventory_full.connect(_on_inventory_full)

# ── Actualizaciones de barras ─────────────────────────────────────
func _on_health_changed(pct: float) -> void:
	health_bar.value = pct * 100.0

func _on_battery_changed(pct: float) -> void:
	battery_bar.value = pct * 100.0

func _on_sanity_changed(pct: float) -> void:
	sanity_bar.value = pct * 100.0

# ── Inventario ────────────────────────────────────────────────────
func _on_item_picked_up(item: Object) -> void:
	_refresh_inventory()
	_show_message("Recogido: " + item.item_name)

func _on_item_used(item: Object) -> void:
	_refresh_inventory()
	_show_message("Usado: " + item.item_name)

func _on_inventory_full() -> void:
	_show_message("¡Inventario lleno!")

func _refresh_inventory() -> void:
	for child in inventory_grid.get_children():
		child.queue_free()
	if _player == null: return
	var inv := _player.get_node_or_null("Inventory")
	if inv == null: return
	for item in inv.items:
		var slot := TextureRect.new()
		slot.custom_minimum_size = Vector2(48, 48)
		slot.stretch_mode        = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if item.icon: slot.texture = item.icon
		slot.tooltip_text = item.item_name
		inventory_grid.add_child(slot)

# ── Interacción ───────────────────────────────────────────────────
func show_interact_prompt(text: String) -> void:
	interact_label.text = text
	interact_label.show()

func hide_interact_prompt() -> void:
	interact_label.hide()

# ── Viñeta (sanidad baja) ─────────────────────────────────────────
func _update_vignette() -> void:
	if _player == null: return
	var sanity := _player.get_node_or_null("Sanity")
	if sanity == null: return
	var pct := sanity.get_percent()
	var alpha := clampf((1.0 - pct) * 1.4 - 0.2, 0.0, 0.8)
	vignette.modulate.a = alpha

# ── Fases de juego ────────────────────────────────────────────────
func _on_phase_changed(phase: int) -> void:
	death_screen.visible = (phase == GameManager.GamePhase.DEAD)
	win_screen.visible   = (phase == GameManager.GamePhase.LEVEL_COMPLETE)
	pause_menu.visible   = (phase == GameManager.GamePhase.PAUSED)

# ── Mensaje temporal ──────────────────────────────────────────────
func _show_message(text: String, duration: float = 2.5) -> void:
	item_msg_label.text = text
	item_msg_label.show()
	_msg_timer = duration
