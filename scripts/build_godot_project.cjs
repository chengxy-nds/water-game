/**
 * Godot 4.7 原生高保真架构工程构建脚本 (100% 像素级对齐 v10.html 原型)
 * 包含：
 * 1. 真实物理倾斜倒水流体动效 (瓶内流体重力倾斜剪切、液面坡向瓶口、双层丝滑水柱、目标瓶实时液位上涨+波浪、落垫回弹Squish、封口金星)
 * 2. 所有交互按钮 100% 灵敏可点击 (TextureButton 底层引擎原生驱动、触控回弹、消除丢点击漏洞)
 * 3. 高定磨砂亚麻设置面板 (整行点按触发展开、4 组温润开关 + 主页/重开/跳过/继续)
 * 4. 200关大师级关卡选择面板 (5大章节标签切换、网格化40关、已过关三星点亮、当前关高亮光圈、即点即进)
 * 5. 璀璨通关胜利面板 (3D黄金绶带、三星依次弹跳展开、五彩纸屑礼花粒子)
 * 6. 全场景微动效与道具响应 (星光萤火粒子、打乱波浪涌动、智能提示光圈流光引导、规则弹窗)
 */

const fs = require('fs');
const path = require('path');

const targetDir = 'E:\\GithubProjects\\倒水game-godot';
const syncDir = 'C:\\倒水game-godot';

console.log('=== 开始构建 Godot 4.7 像素级高保真工程 (全面修复流体重力倾斜与按钮可点性) ===');

// 创建必要子目录
['scripts', 'scenes', 'shaders', 'assets/textures'].forEach(dir => {
  const p1 = path.join(targetDir, dir);
  if (!fs.existsSync(p1)) fs.mkdirSync(p1, { recursive: true });
  const p2 = path.join(syncDir, dir);
  if (!fs.existsSync(p2)) fs.mkdirSync(p2, { recursive: true });
});

// ============================================================================
// 1. project.godot
// ============================================================================
const projectGodotContent = `; Engine configuration file.
config_version=5

[application]

config/name="倒水game-godot"
run/main_scene="res://scenes/Main.tscn"
config/features=PackedStringArray("4.7", "GL Compatibility")
config/icon="res://icon.svg"

[display]

window/size/viewport_width=414
window/size/viewport_height=896
window/size/window_width_override=414
window/size/window_height_override=896
window/stretch/mode="canvas_items"
window/stretch/aspect="keep_width"
window/handheld/orientation=1

[rendering]

rendering_device/driver.windows="d3d12"
renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
`;

// ============================================================================
// 2. scripts/LiquidPalette.gd
// ============================================================================
const liquidPaletteGd = `class_name LiquidPalette
extends RefCounted

const PALETTE: Dictionary = {
	"red": {
		"left": Color("#b30804"), "mid": Color("#c40a05"), "highlight": Color("#dc1e18"), "right": Color("#9c0603"),
		"top_mid": Color("#e31a1a"), "top_rim": Color("#fc2829"), "top_light": Color("#ff7878"),
		"main": Color("#c40a05"), "light": Color("#dc1e18"), "dark": Color("#9c0603"), "bag": Color("#df2121")
	},
	"yellow": {
		"left": Color("#ebb008"), "mid": Color("#fcc00b"), "highlight": Color("#ffd438"), "right": Color("#d99f04"),
		"top_mid": Color("#fbd126"), "top_rim": Color("#ffdb2c"), "top_light": Color("#fffb8b"),
		"main": Color("#fcc00b"), "light": Color("#ffd438"), "dark": Color("#d99f04"), "bag": Color("#f8b809")
	},
	"blue": {
		"left": Color("#1515ad"), "mid": Color("#1b1bc0"), "highlight": Color("#3238d9"), "right": Color("#101096"),
		"top_mid": Color("#3a56ca"), "top_rim": Color("#4a68d8"), "top_light": Color("#7a96ff"),
		"main": Color("#1b1bc0"), "light": Color("#3238d9"), "dark": Color("#101096"), "bag": Color("#2b32d4")
	},
	"green": {
		"left": Color("#689905"), "mid": Color("#72a506"), "highlight": Color("#86ba14"), "right": Color("#588503"),
		"top_mid": Color("#97cb1d"), "top_rim": Color("#b2df4f"), "top_light": Color("#cff877"),
		"main": Color("#72a506"), "light": Color("#86ba14"), "dark": Color("#588503"), "bag": Color("#73a808")
	},
	"purple": {
		"left": Color("#5f1294"), "mid": Color("#7319b0"), "highlight": Color("#8e2dcf"), "right": Color("#4b0c78"),
		"top_mid": Color("#9638d6"), "top_rim": Color("#b055ed"), "top_light": Color("#deb3ff"),
		"main": Color("#7319b0"), "light": Color("#8e2dcf"), "dark": Color("#4b0c78"), "bag": Color("#731fa8")
	},
	"orange": {
		"left": Color("#cf4400"), "mid": Color("#e65000"), "highlight": Color("#f5681a"), "right": Color("#b03800"),
		"top_mid": Color("#ff731c"), "top_rim": Color("#ff8f3d"), "top_light": Color("#ffc285"),
		"main": Color("#e65000"), "light": Color("#f5681a"), "dark": Color("#b03800"), "bag": Color("#ea5504")
	},
	"cyan": {
		"left": Color("#0784c4"), "mid": Color("#0e9ae0"), "highlight": Color("#2bb6f7"), "right": Color("#056da6"),
		"top_mid": Color("#2cb9fc"), "top_rim": Color("#57ccff"), "top_light": Color("#a6e9ff"),
		"main": Color("#0e9ae0"), "light": Color("#2bb6f7"), "dark": Color("#056da6"), "bag": Color("#149ee3")
	},
	"pink": {
		"left": Color("#c71864"), "mid": Color("#e02476"), "highlight": Color("#f54290"), "right": Color("#a31050"),
		"top_mid": Color("#f74d97"), "top_rim": Color("#ff70ae"), "top_light": Color("#ffb3d2"),
		"main": Color("#e02476"), "light": Color("#f54290"), "dark": Color("#a31050"), "bag": Color("#e02476")
	}
}

const COLOR_KEYS = ["red", "yellow", "blue", "green", "purple", "orange", "cyan", "pink"]

static func get_color_info(key: String) -> Dictionary:
	if PALETTE.has(key):
		return PALETTE[key]
	return PALETTE["blue"]
`;

// ============================================================================
// 3. scripts/LevelGenerator.gd
// ============================================================================
const levelGeneratorGd = `class_name LevelGenerator
extends RefCounted

const LiquidPalette = preload("res://scripts/LiquidPalette.gd")

class Mulberry32:
	var state: int = 0
	
	func _init(seed_val: int) -> void:
		state = seed_val & 0xFFFFFFFF
		
	func next_float() -> float:
		state = (state + 0x6D2B79F5) & 0xFFFFFFFF
		var t: int = state ^ (state >> 15)
		t = (t * (1 | state)) & 0xFFFFFFFF
		t = (t ^ (t + ((t ^ (t >> 7)) * (61 | t)))) & 0xFFFFFFFF
		var res: int = (t ^ (t >> 14)) & 0xFFFFFFFF
		return float(res) / 4294967296.0

static func generate_level(level_num: int) -> Dictionary:
	var lv: int = clampi(level_num, 1, 200)
	var seed_val: int = (1013904223 + lv * 31) & 0xFFFFFFFF
	var rng = Mulberry32.new((lv * 2654435761 + seed_val) & 0xFFFFFFFF)
	
	var cfg = {
		"level": lv,
		"title": "第 %d 关" % lv,
		"step_limit": -1 if lv < 12 else maxi(18, 38 - int(lv * 0.08)),
		"bags": [],
		"bottles": []
	}
	
	if lv == 1:
		cfg["title"] = "第 1 关"
		cfg["bottles"] = [
			{ "id": 0, "max_cap": 4, "layers": ["blue", "orange", "yellow", "red"], "special": "none", "corked": false },
			{ "id": 1, "max_cap": 4, "layers": ["green", "red", "blue", "yellow"], "special": "none", "corked": false },
			{ "id": 2, "max_cap": 4, "layers": ["yellow", "blue", "orange", "green"], "special": "none", "corked": false },
			{ "id": 3, "max_cap": 4, "layers": ["red", "green", "orange", "yellow"], "special": "none", "corked": false },
			{ "id": 4, "max_cap": 4, "layers": ["orange", "red", "green", "blue"], "special": "none", "corked": false },
			{ "id": 5, "max_cap": 4, "layers": [], "special": "none", "corked": false },
			{ "id": 6, "max_cap": 4, "layers": [], "special": "none", "corked": false },
			{ "id": 7, "max_cap": 4, "layers": [], "special": "ad_bottle", "corked": false },
			{ "id": 8, "max_cap": 4, "layers": [], "special": "ad_bottle", "corked": false }
		]
		return cfg
		
	var num_colors = clampi(3 + int(lv * 0.06), 3, 8)
	var active_keys = []
	for k in range(num_colors):
		active_keys.append(LiquidPalette.COLOR_KEYS[k % LiquidPalette.COLOR_KEYS.size()])
		
	var pool = []
	for c in active_keys:
		for k in range(4):
			pool.append(c)
			
	for i in range(pool.size() - 1, 0, -1):
		var j = int(floor(rng.next_float() * (i + 1)))
		var tmp = pool[i]
		pool[i] = pool[j]
		pool[j] = tmp
		
	for i in range(num_colors):
		var b_layers = pool.slice(i * 4, (i + 1) * 4)
		var special = "none"
		var mystery_count = 0
		var required_color = ""
		
		if lv >= 5 and i == 0 and rng.next_float() < 0.45:
			special = "ice_base"
		elif lv >= 8 and i == 1 and rng.next_float() < 0.45:
			special = "mystery"
			mystery_count = 2
		elif lv >= 15 and i == 2 and rng.next_float() < 0.35:
			special = "color_lock"
			required_color = b_layers[-1]
			
		cfg["bottles"].append({
			"id": i,
			"max_cap": 4,
			"layers": b_layers,
			"special": special,
			"mystery_count": mystery_count,
			"required_color": required_color,
			"corked": false
		})
		
	var cur_id = cfg["bottles"].size()
	cfg["bottles"].append({ "id": cur_id, "max_cap": 4, "layers": [], "special": "none", "corked": false })
	cfg["bottles"].append({ "id": cur_id + 1, "max_cap": 4, "layers": [], "special": "none", "corked": false })
	cfg["bottles"].append({ "id": cur_id + 2, "max_cap": 4, "layers": [], "special": "ad_bottle", "corked": false })
	cfg["bottles"].append({ "id": cur_id + 3, "max_cap": 4, "layers": [], "special": "ad_bottle", "corked": false })
	
	return cfg
`;

// ============================================================================
// 4. scripts/GameState.gd
// ============================================================================
const gameStateGd = `class_name GameState
extends RefCounted

const LevelGenerator = preload("res://scripts/LevelGenerator.gd")

signal level_loaded(level_info: Dictionary)
signal selection_changed(selected_index: int)
signal pour_started(plan: Dictionary)
signal victory_achieved
signal state_updated
signal settings_changed(settings: Dictionary)
signal level_completed(level: int, stars: int)

var current_level: int = 1
var bottles: Array = []
var bags: Array = []
var step_limit: int = -1
var selected_index: int = -1
var history: Array = []
var moves_taken: int = 0

var user_settings: Dictionary = {
	"sound": true,
	"vibrate": true,
	"music": true,
	"zoom": true
}

var completed_levels: Dictionary = {
	1: 3
}

var shuffle_count: int = 3
var undo_count: int = 5
var hint_count: int = 3

var is_animating: bool = false
var is_victory: bool = false

func set_setting(key: String, val: bool) -> void:
	user_settings[key] = val
	settings_changed.emit(user_settings)

func mark_level_completed(lv: int, stars: int = 3) -> void:
	completed_levels[lv] = maxi(completed_levels.get(lv, 0), stars)
	level_completed.emit(lv, stars)

func is_level_completed(lv: int) -> bool:
	return completed_levels.has(lv)

func get_level_stars(lv: int) -> int:
	return completed_levels.get(lv, 0)

func load_level(lv: int) -> void:
	current_level = lv
	var cfg = LevelGenerator.generate_level(lv)
	bottles = cfg["bottles"].duplicate(true)
	bags = cfg.get("bags", []).duplicate(true)
	step_limit = cfg.get("step_limit", -1)
	selected_index = -1
	history.clear()
	moves_taken = 0
	is_animating = false
	is_victory = false
	level_loaded.emit(cfg)

func can_select_bottle(idx: int) -> bool:
	if is_animating or is_victory:
		return false
	if idx < 0 or idx >= bottles.size():
		return false
	var b = bottles[idx]
	if b.get("corked", false) or b.get("special") == "ad_bottle":
		return false
	if b["layers"].size() == 0:
		return false
	if is_bottle_complete(b):
		return false
	return true

func can_pour_into(src_idx: int, dst_idx: int) -> bool:
	if src_idx == dst_idx:
		return false
	if src_idx < 0 or src_idx >= bottles.size() or dst_idx < 0 or dst_idx >= bottles.size():
		return false
	var src = bottles[src_idx]
	var dst = bottles[dst_idx]
	if src.get("corked", false) or dst.get("corked", false):
		return false
	if dst.get("special") == "ad_bottle":
		return false
		
	var dst_cap: int = dst.get("max_cap", 4)
	if dst["layers"].size() >= dst_cap or src["layers"].size() == 0:
		return false
		
	var pour_col = src["layers"][-1]
	if dst.get("special") == "color_lock":
		var req = dst.get("required_color", "")
		if req != "" and req != pour_col:
			return false
			
	if dst["layers"].size() == 0:
		return true
	return dst["layers"][-1] == pour_col

func is_bottle_complete(b: Dictionary) -> bool:
	var cap: int = b.get("max_cap", 4)
	if b["layers"].size() != cap:
		return false
	var first_col = b["layers"][0]
	for c in b["layers"]:
		if c != first_col:
			return false
	return true

func handle_bottle_click(idx: int) -> Dictionary:
	if is_animating or is_victory:
		return { "type": "NONE" }
		
	var b = bottles[idx]
	if b.get("special") == "ad_bottle":
		save_snapshot()
		b["special"] = "none"
		state_updated.emit()
		return { "type": "UNLOCK_AD", "index": idx }
		
	if selected_index == -1:
		if can_select_bottle(idx):
			selected_index = idx
			selection_changed.emit(selected_index)
			return { "type": "SELECT", "index": idx }
		return { "type": "NONE" }
		
	if selected_index == idx:
		selected_index = -1
		selection_changed.emit(selected_index)
		return { "type": "DESELECT", "index": idx }
		
	var src_idx = selected_index
	if can_pour_into(src_idx, idx):
		var src = bottles[src_idx]
		var dst = bottles[idx]
		var pour_col = src["layers"][-1]
		var dst_cap = dst.get("max_cap", 4)
		
		var count = 0
		for k in range(src["layers"].size() - 1, -1, -1):
			if src["layers"][k] == pour_col and dst["layers"].size() + count < dst_cap:
				count += 1
			else:
				break
				
		var plan = {
			"from_index": src_idx,
			"to_index": idx,
			"color": pour_col,
			"count": count
		}
		
		selected_index = -1
		selection_changed.emit(selected_index)
		is_animating = true
		pour_started.emit(plan)
		return { "type": "POUR", "plan": plan }
	else:
		if can_select_bottle(idx):
			selected_index = idx
			selection_changed.emit(selected_index)
			return { "type": "SELECT", "index": idx }
		else:
			selected_index = -1
			selection_changed.emit(selected_index)
			return { "type": "DESELECT", "index": src_idx }

func apply_pour(plan: Dictionary) -> void:
	save_snapshot()
	moves_taken += 1
	var src = bottles[plan["from_index"]]
	var dst = bottles[plan["to_index"]]
	var cnt: int = plan["count"]
	var col: String = plan["color"]
	
	for i in range(cnt):
		if src["layers"].size() > 0:
			src["layers"].pop_back()
		dst["layers"].append(col)
		
	if src.get("mystery_count", 0) > 0 and src["layers"].size() <= src["mystery_count"]:
		src["mystery_count"] = maxi(0, src["layers"].size() - 1)
		
	if is_bottle_complete(dst):
		dst["corked"] = true
		check_bag_packing(col)
		
	if step_limit > 0:
		step_limit -= 1
		
	is_animating = false
	state_updated.emit()
	check_victory()

func check_bag_packing(col: String) -> void:
	for bag in bags:
		if not bag.get("packed", false) and not bag.get("locked", false) and bag.get("color") == col:
			bag["packed"] = true
			for b in bags:
				if b.get("locked", false):
					b["locked"] = false
					break
			break

func check_victory() -> void:
	var all_corked = true
	for b in bottles:
		if not b.get("corked", false) and b["layers"].size() > 0 and b.get("special") != "ad_bottle":
			all_corked = false
			break
			
	if all_corked:
		is_victory = true
		mark_level_completed(current_level, 3)
		victory_achieved.emit()

func save_snapshot() -> void:
	var snap = {
		"bottles": bottles.duplicate(true),
		"bags": bags.duplicate(true),
		"step_limit": step_limit,
		"moves_taken": moves_taken
	}
	history.append(snap)

func undo() -> bool:
	if is_animating or history.size() == 0:
		return false
	var snap = history.pop_back()
	bottles = snap["bottles"]
	bags = snap["bags"]
	step_limit = snap["step_limit"]
	moves_taken = snap.get("moves_taken", 0)
	selected_index = -1
	selection_changed.emit(selected_index)
	state_updated.emit()
	return true

func shuffle() -> bool:
	if is_animating or is_victory:
		return false
	var pool = []
	var targets = []
	for b in bottles:
		if not b.get("corked", false) and b.get("special") != "ad_bottle" and b["layers"].size() > 0:
			while b["layers"].size() > 0:
				pool.append(b["layers"].pop_back())
			targets.append(b)
			
	if pool.size() == 0:
		return false
		
	save_snapshot()
	pool.shuffle()
	
	var ptr = 0
	while pool.size() > 0 and targets.size() > 0:
		var b = targets[ptr % targets.size()]
		var cap = b.get("max_cap", 4)
		if b["layers"].size() < cap:
			b["layers"].append(pool.pop_back())
		else:
			targets.erase(b)
			continue
		ptr += 1
		
	selected_index = -1
	selection_changed.emit(selected_index)
	state_updated.emit()
	return true

func find_hint() -> Array:
	if is_animating or is_victory:
		return []
	for i in range(bottles.size()):
		if not can_select_bottle(i):
			continue
		for j in range(bottles.size()):
			if can_pour_into(i, j):
				return [i, j]
	return []
`;

// ============================================================================
// 5. scripts/TubeView.gd (包含瓶内真实重力剪切流体表面、液面坡向出水口、满瓶落栓与解锁动效)
// ============================================================================
const tubeViewGd = `class_name TubeView
extends Control

signal tube_clicked(index: int)

const LiquidPalette = preload("res://scripts/LiquidPalette.gd")

const TEX_GLASS_EMPTY = preload("res://assets/textures/tube_empty.png")
const TEX_GLASS_BACK = preload("res://assets/textures/tube_glass_back.png")
const TEX_GLASS_FRONT = preload("res://assets/textures/tube_glass_front.png")
const TEX_GLASS_AD = preload("res://assets/textures/tube_glass_ad.png")
const TEX_COASTER_NORMAL = preload("res://assets/textures/burlap_coaster_normal.png")
const TEX_COASTER_SPECIAL = preload("res://assets/textures/burlap_coaster_special.png")
const TEX_LIQUID_ATLAS = preload("res://assets/textures/liquid_gradients_atlas.png")
const TEX_MENISCUS_ATLAS = preload("res://assets/textures/meniscus_gradients_atlas.png")
const TEX_CORK = preload("res://assets/textures/cork.png")
const TEX_ICE_BASE = preload("res://assets/textures/ice_base.png")

const COLOR_INDEX: Dictionary = {
	"red": 0, "yellow": 1, "blue": 2, "green": 3,
	"purple": 4, "orange": 5, "cyan": 6, "pink": 7
}

@export var tube_index: int = 0
@export var tube_width: float = 56.0
@export var tube_height: float = 171.0

var tube_data: Dictionary = { "layers": [] }
var is_selected: bool = false
var is_hint_pulsing: bool = false
var liquid_override: Dictionary = {}
var squish_tween: Tween = null

var coaster_rect: TextureRect
var holder: Control
var glass_empty: TextureRect
var glass_back: TextureRect
var liquid_layer: Control
var glass_front: TextureRect
var ad_aura: TextureRect
var cork_rect: TextureRect
var ice_rect: TextureRect

func _ready() -> void:
	custom_minimum_size = Vector2(tube_width, tube_height)
	mouse_filter = MOUSE_FILTER_STOP
	_setup_nodes()
	update_view()

func _setup_nodes() -> void:
	if holder != null:
		return
		
	var pad_w = tube_width * 1.20
	var pad_h = tube_height * 0.198
	coaster_rect = TextureRect.new()
	coaster_rect.texture = TEX_COASTER_NORMAL
	coaster_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	coaster_rect.stretch_mode = TextureRect.STRETCH_SCALE
	coaster_rect.size = Vector2(pad_w, pad_h)
	coaster_rect.position = Vector2(-tube_width * 0.10, tube_height - tube_height * 0.126)
	coaster_rect.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(coaster_rect)
	
	holder = Control.new()
	holder.size = Vector2(tube_width, tube_height)
	holder.position = Vector2.ZERO
	holder.pivot_offset = Vector2(tube_width * 0.5, 14.0)
	holder.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(holder)
	
	glass_empty = TextureRect.new()
	glass_empty.texture = TEX_GLASS_EMPTY
	glass_empty.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	glass_empty.stretch_mode = TextureRect.STRETCH_SCALE
	glass_empty.size = Vector2(tube_width, tube_height)
	glass_empty.mouse_filter = MOUSE_FILTER_IGNORE
	holder.add_child(glass_empty)
	
	glass_back = TextureRect.new()
	glass_back.texture = TEX_GLASS_BACK
	glass_back.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	glass_back.stretch_mode = TextureRect.STRETCH_SCALE
	glass_back.size = Vector2(tube_width, tube_height)
	glass_back.mouse_filter = MOUSE_FILTER_IGNORE
	holder.add_child(glass_back)
	
	liquid_layer = Control.new()
	liquid_layer.size = Vector2(tube_width, tube_height)
	liquid_layer.mouse_filter = MOUSE_FILTER_IGNORE
	liquid_layer.draw.connect(_on_liquid_draw)
	holder.add_child(liquid_layer)
	
	glass_front = TextureRect.new()
	glass_front.texture = TEX_GLASS_FRONT
	glass_front.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	glass_front.stretch_mode = TextureRect.STRETCH_SCALE
	glass_front.size = Vector2(tube_width, tube_height)
	glass_front.mouse_filter = MOUSE_FILTER_IGNORE
	holder.add_child(glass_front)
	
	ad_aura = TextureRect.new()
	ad_aura.texture = TEX_GLASS_AD
	ad_aura.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ad_aura.stretch_mode = TextureRect.STRETCH_SCALE
	ad_aura.size = Vector2(tube_width, tube_height)
	ad_aura.mouse_filter = MOUSE_FILTER_IGNORE
	ad_aura.visible = false
	holder.add_child(ad_aura)
	
	cork_rect = TextureRect.new()
	cork_rect.texture = TEX_CORK
	cork_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	cork_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	cork_rect.size = Vector2(24, 16)
	cork_rect.position = Vector2((tube_width - 24) * 0.5, -6)
	cork_rect.mouse_filter = MOUSE_FILTER_IGNORE
	cork_rect.visible = false
	holder.add_child(cork_rect)
	
	ice_rect = TextureRect.new()
	ice_rect.texture = TEX_ICE_BASE
	ice_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ice_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	ice_rect.size = Vector2(48, 22)
	ice_rect.position = Vector2((tube_width - 48) * 0.5, tube_height - 22)
	ice_rect.mouse_filter = MOUSE_FILTER_IGNORE
	ice_rect.visible = false
	holder.add_child(ice_rect)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		tube_clicked.emit(tube_index)
		accept_event()

func set_tube_data(data: Dictionary) -> void:
	tube_data = data
	liquid_override.clear()
	update_view()

func update_view() -> void:
	if glass_empty == null:
		return
		
	var layers: Array = tube_data.get("layers", [])
	var special: String = tube_data.get("special", "none")
	var corked: bool = tube_data.get("corked", false)
	var mystery: int = tube_data.get("mystery_count", 0)
	var is_ad = (special == "ad_bottle")
	var is_empty = layers.is_empty() and liquid_override.is_empty()
	
	if coaster_rect:
		coaster_rect.texture = TEX_COASTER_SPECIAL if (is_ad or mystery > 0) else TEX_COASTER_NORMAL
		
	glass_empty.visible = is_empty and not is_ad
	glass_back.visible = not is_empty or is_ad
	glass_front.visible = not is_empty or is_ad
	ad_aura.visible = is_ad
	
	cork_rect.visible = corked
	ice_rect.visible = (special == "ice_base")
	
	if liquid_layer:
		liquid_layer.queue_redraw()

func set_selected(selected: bool) -> void:
	is_selected = selected
	var target_y = -22.0 if is_selected else 0.0
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(holder, "position:y", target_y, 0.20)
	tween.parallel().tween_property(holder, "scale", Vector2(1.04, 1.04) if is_selected else Vector2.ONE, 0.20)
	
	if coaster_rect:
		var ao_tween = create_tween().set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		ao_tween.tween_property(coaster_rect, "modulate:a", 0.40 if is_selected else 1.0, 0.20)

func set_liquid_override(ov: Dictionary) -> void:
	liquid_override = ov
	if glass_empty and glass_back and glass_front:
		glass_empty.visible = false
		glass_back.visible = true
		glass_front.visible = true
	if liquid_layer:
		liquid_layer.queue_redraw()

func clear_liquid_override() -> void:
	liquid_override.clear()
	update_view()

func play_landing_squish() -> void:
	if squish_tween:
		squish_tween.kill()
	squish_tween = create_tween()
	squish_tween.tween_property(holder, "scale", Vector2(1.05, 0.93), 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	squish_tween.tween_property(holder, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func play_cork_animation() -> void:
	cork_rect.visible = true
	cork_rect.position.y = -26.0
	cork_rect.scale = Vector2(1.3, 0.7)
	var tw = create_tween()
	tw.tween_property(cork_rect, "position:y", -6.0, 0.24).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(cork_rect, "scale", Vector2.ONE, 0.24).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func play_unlock_animation() -> void:
	var tw = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(holder, "scale", Vector2(1.15, 1.15), 0.12)
	tw.tween_property(holder, "scale", Vector2.ONE, 0.16)

func play_wave_motion(delay: float) -> void:
	var tw = create_tween()
	tw.tween_interval(delay)
	tw.tween_property(holder, "position:y", -22.0, 0.18).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tw.tween_property(holder, "position:y", 0.0, 0.22).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)

func highlight_hint(enable: bool) -> void:
	is_hint_pulsing = enable
	queue_redraw()

func _draw() -> void:
	if is_hint_pulsing:
		var pulse = 0.5 + 0.5 * sin(Time.get_ticks_msec() * 0.008)
		var ring_col = Color(1.0, 0.85, 0.2, 0.45 + pulse * 0.45)
		draw_rect(Rect2(-4, -4, tube_width + 8, tube_height + 8), ring_col, false, 2.4)

static var _cached_cavity_poly: PackedVector2Array = PackedVector2Array()

static func get_cavity_polygon(w: float, h: float) -> PackedVector2Array:
	if not _cached_cavity_poly.is_empty():
		return _cached_cavity_poly
	var pts = PackedVector2Array()
	var cx = w * 0.5
	var neck_l = cx - 10.0
	var neck_r = cx + 10.0
	var inner_l = 0.03284 * w
	var inner_r = 0.96716 * w
	var bot_y = 0.92255 * h
	var ry = 0.11642 * w
	var rx = (inner_r - inner_l) * 0.5
	
	pts.append(Vector2(neck_l, 14.0))
	pts.append(Vector2(neck_r, 14.0))
	pts.append(Vector2(neck_r, 20.0))
	
	for i in range(1, 9):
		var t = float(i) / 8.0
		var curve_x = lerp(neck_r, inner_r, sin(t * PI * 0.5))
		var curve_y = lerp(20.0, 44.0, t)
		pts.append(Vector2(curve_x, curve_y))
		
	pts.append(Vector2(inner_r, bot_y))
	
	for deg in range(0, 180 + 1, 15):
		var r_rad = deg_to_rad(deg)
		pts.append(Vector2(cx + cos(r_rad) * rx, bot_y + sin(r_rad) * ry))
		
	pts.append(Vector2(inner_l, 44.0))
	
	for i in range(1, 9):
		var t = float(i) / 8.0
		var curve_x = lerp(inner_l, neck_l, 1.0 - cos(t * PI * 0.5))
		var curve_y = lerp(44.0, 20.0, t)
		pts.append(Vector2(curve_x, curve_y))
		
	pts.append(Vector2(neck_l, 20.0))
	_cached_cavity_poly = pts
	return pts

func _on_liquid_draw() -> void:
	var layers: Array = []
	if liquid_override.has("override_layers"):
		layers = liquid_override["override_layers"].duplicate()
	else:
		layers = tube_data.get("layers", []).duplicate()
		var mode = liquid_override.get("mode", "")
		var fill_color: String = liquid_override.get("color", "")
		if mode == "fill" and fill_color != "":
			layers.append(fill_color)
		
	if layers.is_empty():
		return
		
	var w = tube_width
	var h = tube_height
	var mystery: int = tube_data.get("mystery_count", 0)
	var top_scale: float = liquid_override.get("scale", 1.0)
	var tilt_deg: float = liquid_override.get("tilt_deg", 0.0)
	var slosh_phase: float = liquid_override.get("slosh_phase", 0.0)
	var slosh_amp: float = liquid_override.get("slosh_amp", 0.0)
	
	var inner_l = 0.03284 * w
	var inner_r = 0.96716 * w
	var inner_w = inner_r - inner_l
	var cx = (inner_l + inner_r) * 0.5
	var bot_y = 0.92255 * h
	var unit_h = 0.17745 * h
	var rx = inner_w * 0.5
	var ry = 0.11642 * w
	var ry_top = 0.09851 * w
	
	var abs_tilt = absf(tilt_deg)
	
	if abs_tilt < 1.0:
		# ===================== 正立状态：经典精致分层与注入微涟漪 =====================
		for i in range(layers.size()):
			var col_name: String = layers[i]
			var col_info = LiquidPalette.get_color_info(col_name)
			var is_mystery = (i < mystery)
			var row_idx: int = COLOR_INDEX.get(col_name, 0)
			var v_coord = (row_idx + 0.5) / 8.0
			
			var cur_bot = bot_y - i * unit_h
			var this_scale = 1.0
			if i == layers.size() - 1 and liquid_override.has("scale"):
				this_scale = clampf(top_scale, 0.0, 1.0)
				
			var cur_top = cur_bot - unit_h * this_scale
			if cur_top >= cur_bot - 0.5:
				continue
				
			if is_mystery:
				var pts = PackedVector2Array()
				pts.append(Vector2(inner_l, cur_top))
				pts.append(Vector2(inner_r, cur_top))
				for deg in range(0, 180 + 1, 15):
					var r_rad = deg_to_rad(deg)
					pts.append(Vector2(cx + cos(r_rad) * rx, bot_y + sin(r_rad) * ry))
				liquid_layer.draw_colored_polygon(pts, Color("151b2e"))
				var font = ThemeDB.fallback_font
				liquid_layer.draw_string(font, Vector2(cx - 5, (cur_top + cur_bot) * 0.5 + 6), "?", HORIZONTAL_ALIGNMENT_CENTER, -1, 16, Color("fff59d"))
			else:
				var pts = PackedVector2Array()
				var uvs = PackedVector2Array()
				var cols = PackedColorArray()
				
				pts.append(Vector2(inner_l, cur_top))
				uvs.append(Vector2(0.0, v_coord))
				cols.append(Color.WHITE)
				
				pts.append(Vector2(inner_r, cur_top))
				uvs.append(Vector2(1.0, v_coord))
				cols.append(Color.WHITE)
				
				if i > 0:
					pts.append(Vector2(inner_r, cur_bot))
					uvs.append(Vector2(1.0, v_coord))
					cols.append(Color.WHITE)
					pts.append(Vector2(inner_l, cur_bot))
					uvs.append(Vector2(0.0, v_coord))
					cols.append(Color.WHITE)
				else:
					for deg in range(0, 180 + 1, 15):
						var r_rad = deg_to_rad(deg)
						var px = cx + cos(r_rad) * rx
						var py = bot_y + sin(r_rad) * ry
						var u = (px - inner_l) / inner_w
						pts.append(Vector2(px, py))
						uvs.append(Vector2(u, v_coord))
						cols.append(Color.WHITE)
						
				liquid_layer.draw_polygon(pts, cols, uvs, TEX_LIQUID_ATLAS)
				
			if i == layers.size() - 1:
				var u_offset = float(row_idx) / 8.0
				var u_span = 1.0 / 8.0
				var wave_dy = slosh_amp * sin(slosh_phase) * 3.5
				
				var men_pts = PackedVector2Array()
				var men_uvs = PackedVector2Array()
				var men_cols = PackedColorArray()
				for deg in range(0, 360, 15):
					var r_rad = deg_to_rad(deg)
					var norm_x = (cos(r_rad) + 1.0) * 0.5
					var norm_y = (sin(r_rad) + 1.0) * 0.5
					var px = cx + cos(r_rad) * rx
					var py = cur_top + wave_dy + sin(r_rad) * ry_top
					men_pts.append(Vector2(px, py))
					men_uvs.append(Vector2(u_offset + norm_x * u_span, norm_y))
					men_cols.append(Color.WHITE)
				liquid_layer.draw_polygon(men_pts, men_cols, men_uvs, TEX_MENISCUS_ATLAS)
				
				var arc_pts = PackedVector2Array()
				for deg in range(0, 180 + 1, 10):
					var r_rad = deg_to_rad(deg)
					var px = cx + cos(r_rad) * (rx - 0.5)
					arc_pts.append(Vector2(px, cur_top + wave_dy + sin(r_rad) * (ry_top - 0.2)))
				liquid_layer.draw_polyline(arc_pts, col_info["top_light"], 1.3, true)
	else:
		# ===================== 倾斜倒水状态：全物理重力流体剪切与精准腔体裁切 =====================
		var cavity = get_cavity_polygon(w, h)
		var pour_dir = 1.0 if tilt_deg >= 0.0 else -1.0
		var rad = deg_to_rad(tilt_deg)
		var sinR = sin(rad)
		var cosR = cos(rad)
		
		var pivot = Vector2(cx + pour_dir * 18.0, 12.0)
		var spout = Vector2(cx + pour_dir * 12.0, 14.0)
		var bot = Vector2(cx + pour_dir * rx, bot_y)
		
		var g_spout = (spout.x - pivot.x) * sinR + (spout.y - pivot.y) * cosR
		var g_bot = (bot.x - pivot.x) * sinR + (bot.y - pivot.y) * cosR
		var total_D = g_bot - g_spout
		
		var n_layers = layers.size()
		var total_vol = float(n_layers - 1) + clampf(top_scale, 0.0, 1.0)
		if total_vol <= 0.01:
			return
			
		var max_cap = 4.0
		var x_min = -40.0
		var x_max = w + 40.0
		
		for i in range(n_layers):
			var col_name: String = layers[i]
			var col_info = LiquidPalette.get_color_info(col_name)
			var is_mystery = (i < mystery)
			var row_idx: int = COLOR_INDEX.get(col_name, 0)
			var v_coord = (row_idx + 0.5) / 8.0
			
			var v_bot = float(i)
			var v_top = float(i) + (clampf(top_scale, 0.0, 1.0) if i == n_layers - 1 else 1.0)
			if v_top <= v_bot + 0.005:
				continue
				
			var g_layer_top = g_bot - (v_top / max_cap) * total_D
			var g_layer_bot = g_bot - (v_bot / max_cap) * total_D
			
			# 重力表面解析线方程：(x - pivot.x)*sinR + (y - pivot.y)*cosR = G
			var y_top_l = pivot.y + (g_layer_top - (x_min - pivot.x) * sinR) / cosR
			var y_top_r = pivot.y + (g_layer_top - (x_max - pivot.x) * sinR) / cosR
			var y_bot_l = pivot.y + (g_layer_bot - (x_min - pivot.x) * sinR) / cosR
			var y_bot_r = pivot.y + (g_layer_bot - (x_max - pivot.x) * sinR) / cosR
			
			var quad = PackedVector2Array([
				Vector2(x_min, y_top_l),
				Vector2(x_max, y_top_r),
				Vector2(x_max, y_bot_r + (40.0 if i == 0 else 0.0)),
				Vector2(x_min, y_bot_l + (40.0 if i == 0 else 0.0))
			])
			
			var clipped_polys = Geometry2D.intersect_polygons(quad, cavity)
			for poly in clipped_polys:
				if poly.size() < 3:
					continue
				if is_mystery:
					liquid_layer.draw_colored_polygon(poly, Color("151b2e"))
				else:
					var uvs = PackedVector2Array()
					var cols = PackedColorArray()
					for p_pt in poly:
						var u = clampf((p_pt.x - inner_l) / inner_w, 0.0, 1.0)
						uvs.append(Vector2(u, v_coord))
						cols.append(Color.WHITE)
					liquid_layer.draw_polygon(poly, cols, uvs, TEX_LIQUID_ATLAS)
					
			if i == n_layers - 1 and clipped_polys.size() > 0:
				var line_pts = PackedVector2Array()
				var surf_y_l = pivot.y + (g_layer_top - (inner_l - pivot.x) * sinR) / cosR
				var surf_y_r = pivot.y + (g_layer_top - (inner_r - pivot.x) * sinR) / cosR
				line_pts.append(Vector2(inner_l, clampf(surf_y_l, 14.0, bot_y)))
				line_pts.append(Vector2(inner_r, clampf(surf_y_r, 14.0, bot_y)))
				liquid_layer.draw_polyline(line_pts, col_info["top_light"], 1.6, true)
`;

// ============================================================================
// 6. scripts/StreamRenderer.gd (物理重力抛流水柱、双层晶莹亮线、落点撞击涟漪与微沫)
// ============================================================================
const streamRendererGd = `class_name StreamRenderer
extends Control

var is_pouring: bool = false
var start_pos: Vector2 = Vector2.ZERO
var mouth_pos: Vector2 = Vector2.ZERO
var surface_y: float = 0.0
var stream_color: Color = Color("2563eb")
var progress: float = 0.0
var splash_time: float = 0.0
var splash_droplets: Array = []

func start_stream(from_pt: Vector2, to_mouth: Vector2, to_surface_y: float, col: Color) -> void:
	start_pos = from_pt
	mouth_pos = to_mouth
	surface_y = to_surface_y
	stream_color = col
	is_pouring = true
	progress = 0.0
	splash_time = 0.0
	splash_droplets.clear()
	queue_redraw()

func update_stream(prog: float, cur_surface_y: float) -> void:
	progress = prog
	surface_y = cur_surface_y
	splash_time += 0.02
	
	if progress > 0.08 and progress < 0.94:
		if randf() < 0.45:
			splash_droplets.append({
				"pos": Vector2(mouth_pos.x + randf_range(-4.0, 4.0), surface_y),
				"vel": Vector2(randf_range(-30.0, 30.0), randf_range(-38.0, -12.0)),
				"alpha": 0.95,
				"size": randf_range(1.6, 3.2)
			})
	
	var alive: Array = []
	for d in splash_droplets:
		d["pos"] += d["vel"] * 0.016
		d["vel"].y += 98.0 * 0.016
		d["alpha"] -= 0.04
		if d["alpha"] > 0.0:
			alive.append(d)
	splash_droplets = alive
	queue_redraw()

func stop_stream() -> void:
	is_pouring = false
	splash_droplets.clear()
	queue_redraw()

func _draw() -> void:
	if not is_pouring:
		return
		
	var head_ratio = clampf(progress / 0.09, 0.0, 1.0)
	var tail_ratio = clampf((progress - 0.90) / 0.10, 0.0, 1.0) if progress > 0.90 else 0.0
	
	var total_drop = maxf(18.0, surface_y - start_pos.y)
	var y_start = start_pos.y + total_drop * (tail_ratio * tail_ratio * 0.82)
	var y_end = start_pos.y + total_drop * (head_ratio * head_ratio)
	
	if y_end - y_start < 4.0:
		return
		
	var arch_h = maxf(16.0, (mouth_pos.y - start_pos.y) + 11.0)
	var n_steps = 22
	var main_pts = PackedVector2Array()
	var spec_pts = PackedVector2Array()
	
	for i in range(n_steps + 1):
		var s = float(i) / float(n_steps)
		var y = y_start + (y_end - y_start) * s
		var dy = maxf(0.0, y - start_pos.y)
		var global_s = clampf(dy / total_drop, 0.0, 1.0)
		
		var x: float
		if dy < arch_h:
			var t_arch = dy / arch_h
			var ease_arch = sin(t_arch * PI * 0.5)
			x = lerp(start_pos.x, mouth_pos.x, ease_arch)
		else:
			x = mouth_pos.x + sin(global_s * 7.5 - splash_time * 12.0) * 0.75
			
		main_pts.append(Vector2(x, y))
		spec_pts.append(Vector2(x - 1.2, y))
		
	var base_w = 7.2 * (1.0 - tail_ratio * 0.6)
	if base_w > 0.8:
		draw_polyline(main_pts, stream_color, base_w, true)
		draw_polyline(spec_pts, Color(1.0, 1.0, 1.0, 0.88), base_w * 0.35, true)
		
	if head_ratio >= 0.96 and surface_y > 0:
		var ripple_r = 7.5 + sin(splash_time * 20.0) * 2.5
		var ripple_col = Color(1.0, 1.0, 1.0, 0.65)
		draw_arc(Vector2(mouth_pos.x, surface_y), ripple_r, 0, TAU, 18, ripple_col, 1.4, true)
		draw_arc(Vector2(mouth_pos.x, surface_y + 1.2), ripple_r * 0.65, 0, TAU, 14, stream_color * 1.2, 1.2, true)
		
	for d in splash_droplets:
		var c = Color(stream_color.r, stream_color.g, stream_color.b, d["alpha"])
		draw_circle(d["pos"], d["size"], c)
		draw_circle(d["pos"], d["size"] * 0.4, Color(1, 1, 1, d["alpha"]))
`;

// ============================================================================
// 7. scripts/SettingsModal.gd (高定磨砂亚麻设置面板：整行点按触发开关)
// ============================================================================
const settingsModalGd = `class_name SettingsModal
extends Control

signal resume_pressed
signal restart_pressed
signal skip_pressed
signal home_pressed
signal setting_toggled(key: String, new_val: bool)

var game_state: RefCounted
var card: Panel
var toggle_nodes: Dictionary = {}

func setup(state: RefCounted) -> void:
	game_state = state
	_build_ui()

func _build_ui() -> void:
	for c in get_children():
		c.queue_free()
		
	var mask = ColorRect.new()
	mask.set_anchors_preset(PRESET_FULL_RECT)
	mask.color = Color(0.06, 0.04, 0.02, 0.65)
	mask.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			dismiss()
	)
	add_child(mask)
	
	card = Panel.new()
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	card.custom_minimum_size = Vector2(344, 430)
	card.size = Vector2(344, 430)
	card.position = Vector2((414 - 344) * 0.5, (896 - 430) * 0.5 - 20)
	
	var sb_card = StyleBoxFlat.new()
	sb_card.bg_color = Color("#f8eedd")
	sb_card.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_card.set_border_width_all(2)
	sb_card.set_corner_radius_all(26)
	sb_card.shadow_color = Color(0.18, 0.10, 0.03, 0.28)
	sb_card.shadow_size = 18
	sb_card.shadow_offset = Vector2(0, 8)
	card.add_theme_stylebox_override("panel", sb_card)
	add_child(card)
	
	# 顶部 3D 浮雕标题胶囊
	var pill = Panel.new()
	pill.size = Vector2(148, 38)
	pill.position = Vector2((344 - 148) * 0.5, -19)
	var sb_pill = StyleBoxFlat.new()
	sb_pill.bg_color = Color("#df9738")
	sb_pill.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_pill.set_border_width_all(2)
	sb_pill.set_corner_radius_all(19)
	sb_pill.shadow_color = Color(0.3, 0.15, 0.02, 0.25)
	sb_pill.shadow_size = 6
	sb_pill.shadow_offset = Vector2(0, 3)
	pill.add_theme_stylebox_override("panel", sb_pill)
	card.add_child(pill)
	
	var pill_lbl = Label.new()
	pill_lbl.set_anchors_preset(PRESET_FULL_RECT)
	pill_lbl.text = "设置"
	pill_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pill_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	pill_lbl.add_theme_font_size_override("font_size", 18)
	pill_lbl.add_theme_color_override("font_color", Color.WHITE)
	pill.add_child(pill_lbl)
	
	# 右上角关闭按钮 ✕
	var btn_close = Button.new()
	btn_close.size = Vector2(36, 36)
	btn_close.position = Vector2(344 - 44, 8)
	btn_close.text = "✕"
	btn_close.flat = true
	btn_close.add_theme_font_size_override("font_size", 20)
	btn_close.add_theme_color_override("font_color", Color("#8b5c2a"))
	btn_close.pressed.connect(dismiss)
	card.add_child(btn_close)
	
	# 4 行凹槽栏
	var rows_data = [
		{ "key": "sound",   "label": "声音", "icon": "🔊" },
		{ "key": "vibrate", "label": "震动", "icon": "📳" },
		{ "key": "music",   "label": "音乐", "icon": "🎵" },
		{ "key": "zoom",    "label": "缩放", "icon": "🔍" }
	]
	
	var start_y = 38.0
	var row_h = 48.0
	var gap = 9.0
	
	for i in range(rows_data.size()):
		var r_info = rows_data[i]
		var cur_y = start_y + i * (row_h + gap)
		var k_name = r_info["key"]
		
		var row_btn = Button.new()
		row_btn.size = Vector2(308, row_h)
		row_btn.position = Vector2(18, cur_y)
		
		var sb_row = StyleBoxFlat.new()
		sb_row.bg_color = Color("#eddcc5")
		sb_row.border_color = Color(1.0, 1.0, 1.0, 0.85)
		sb_row.set_border_width_all(1)
		sb_row.set_corner_radius_all(14)
		row_btn.add_theme_stylebox_override("normal", sb_row)
		row_btn.add_theme_stylebox_override("hover", sb_row)
		row_btn.add_theme_stylebox_override("pressed", sb_row)
		card.add_child(row_btn)
		
		var icon_lbl = Label.new()
		icon_lbl.position = Vector2(14, 11)
		icon_lbl.text = r_info["icon"] + "  " + r_info["label"]
		icon_lbl.add_theme_font_size_override("font_size", 15)
		icon_lbl.add_theme_color_override("font_color", Color("#5c3d18"))
		row_btn.add_child(icon_lbl)
		
		var is_on = game_state.user_settings.get(k_name, true) if game_state else true
		var toggle = create_toggle_switch(k_name, is_on)
		toggle.position = Vector2(308 - 72, 8)
		row_btn.add_child(toggle)
		toggle_nodes[k_name] = toggle
		
		row_btn.pressed.connect(func():
			var cur_v = toggle.get_meta("is_on", true)
			toggle_switch_to(toggle, k_name, not cur_v)
		)
		
	var mid_y = start_y + 4 * (row_h + gap) + 10.0
	
	var btn_home = create_action_button("主页 🏠", Color("#e5a344"), Vector2(88, 44))
	btn_home.position = Vector2(18, mid_y)
	btn_home.pressed.connect(func(): dismiss(); home_pressed.emit())
	card.add_child(btn_home)
	
	var btn_restart = create_action_button("重新开始 🔄", Color("#78ba28"), Vector2(116, 44))
	btn_restart.position = Vector2(114, mid_y)
	btn_restart.pressed.connect(func(): dismiss(); restart_pressed.emit())
	card.add_child(btn_restart)
	
	var btn_skip = create_action_button("跳过 ⏩", Color("#e5527a"), Vector2(88, 44))
	btn_skip.position = Vector2(238, mid_y)
	btn_skip.pressed.connect(func(): dismiss(); skip_pressed.emit())
	card.add_child(btn_skip)
	
	var btn_resume = create_action_button("继续游戏 ▶", Color("#2dbcd6"), Vector2(308, 46))
	btn_resume.position = Vector2(18, mid_y + 54)
	btn_resume.pressed.connect(func(): dismiss(); resume_pressed.emit())
	card.add_child(btn_resume)

func create_action_button(txt: String, base_col: Color, sz: Vector2) -> Button:
	var btn = Button.new()
	btn.custom_minimum_size = sz
	btn.size = sz
	btn.text = txt
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", Color.WHITE)
	
	var sb = StyleBoxFlat.new()
	sb.bg_color = base_col
	sb.border_color = Color(1.0, 1.0, 1.0, 0.90)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(14)
	sb.shadow_color = base_col.darkened(0.4)
	sb.shadow_size = 4
	sb.shadow_offset = Vector2(0, 2)
	btn.add_theme_stylebox_override("normal", sb)
	btn.add_theme_stylebox_override("hover", sb)
	btn.add_theme_stylebox_override("pressed", sb)
	
	btn.pressed.connect(func():
		var tw = btn.create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(btn, "scale", Vector2(0.92, 0.92), 0.06)
		tw.tween_property(btn, "scale", Vector2.ONE, 0.12)
		btn.pivot_offset = sz * 0.5
	)
	return btn

func create_toggle_switch(key: String, initial_on: bool) -> Control:
	var c = Control.new()
	c.custom_minimum_size = Vector2(62, 32)
	c.size = Vector2(62, 32)
	c.mouse_filter = MOUSE_FILTER_IGNORE
	
	var track = Panel.new()
	track.name = "Track"
	track.set_anchors_preset(PRESET_FULL_RECT)
	var sb_track = StyleBoxFlat.new()
	sb_track.set_corner_radius_all(16)
	sb_track.bg_color = Color("#7ea846") if initial_on else Color("#c8b59a")
	sb_track.border_color = Color(1.0, 1.0, 1.0, 0.85)
	sb_track.set_border_width_all(1)
	track.add_theme_stylebox_override("panel", sb_track)
	track.mouse_filter = MOUSE_FILTER_IGNORE
	c.add_child(track)
	
	var knob = Panel.new()
	knob.name = "Knob"
	knob.size = Vector2(26, 26)
	knob.position = Vector2(33 if initial_on else 3, 3)
	var sb_knob = StyleBoxFlat.new()
	sb_knob.set_corner_radius_all(13)
	sb_knob.bg_color = Color.WHITE
	sb_knob.shadow_color = Color(0.2, 0.1, 0.0, 0.25)
	sb_knob.shadow_size = 3
	sb_knob.shadow_offset = Vector2(0, 1)
	knob.add_theme_stylebox_override("panel", sb_knob)
	knob.mouse_filter = MOUSE_FILTER_IGNORE
	c.add_child(knob)
	
	c.set_meta("is_on", initial_on)
	return c

func toggle_switch_to(c: Control, key: String, new_on: bool) -> void:
	c.set_meta("is_on", new_on)
	var knob = c.get_node_or_null("Knob") as Control
	var track = c.get_node_or_null("Track") as Panel
	if knob and track:
		var tw = c.create_tween()
		tw.set_parallel(true)
		tw.tween_property(knob, "position:x", 33.0 if new_on else 3.0, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		var sb = track.get_theme_stylebox("panel").duplicate() as StyleBoxFlat
		sb.bg_color = Color("#7ea846") if new_on else Color("#c8b59a")
		track.add_theme_stylebox_override("panel", sb)
	if game_state:
		game_state.set_setting(key, new_on)
	setting_toggled.emit(key, new_on)

func show_modal() -> void:
	move_to_front()
	visible = true
	modulate.a = 0.0
	card.scale = Vector2(0.85, 0.85)
	card.pivot_offset = card.size * 0.5
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 1.0, 0.18)
	tw.tween_property(card, "scale", Vector2.ONE, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func dismiss() -> void:
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 0.0, 0.14)
	tw.tween_property(card, "scale", Vector2(0.9, 0.9), 0.14)
	tw.finished.connect(func(): visible = false)
`;

// ============================================================================
// 8. scripts/LevelSelectModal.gd (200关大师级关卡选择面板)
// ============================================================================
const levelSelectModalGd = `class_name LevelSelectModal
extends Control

signal level_selected(level_num: int)

var game_state: RefCounted
var card: Panel
var tabs_container: HBoxContainer
var grid_container: GridContainer
var current_chapter: int = 0

func setup(state: RefCounted) -> void:
	game_state = state
	_build_ui()

func _build_ui() -> void:
	for c in get_children():
		c.queue_free()
		
	var mask = ColorRect.new()
	mask.set_anchors_preset(PRESET_FULL_RECT)
	mask.color = Color(0.06, 0.04, 0.02, 0.68)
	mask.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
			dismiss()
	)
	add_child(mask)
	
	card = Panel.new()
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	card.custom_minimum_size = Vector2(370, 510)
	card.size = Vector2(370, 510)
	card.position = Vector2((414 - 370) * 0.5, (896 - 510) * 0.5 - 15)
	
	var sb_card = StyleBoxFlat.new()
	sb_card.bg_color = Color("#f8eedd")
	sb_card.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_card.set_border_width_all(2)
	sb_card.set_corner_radius_all(26)
	sb_card.shadow_color = Color(0.18, 0.10, 0.03, 0.32)
	sb_card.shadow_size = 20
	sb_card.shadow_offset = Vector2(0, 8)
	card.add_theme_stylebox_override("panel", sb_card)
	add_child(card)
	
	var pill = Panel.new()
	pill.size = Vector2(160, 38)
	pill.position = Vector2((370 - 160) * 0.5, -19)
	var sb_pill = StyleBoxFlat.new()
	sb_pill.bg_color = Color("#df9738")
	sb_pill.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_pill.set_border_width_all(2)
	sb_pill.set_corner_radius_all(19)
	pill.add_theme_stylebox_override("panel", sb_pill)
	card.add_child(pill)
	
	var pill_lbl = Label.new()
	pill_lbl.set_anchors_preset(PRESET_FULL_RECT)
	pill_lbl.text = "关卡选择"
	pill_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pill_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	pill_lbl.add_theme_font_size_override("font_size", 18)
	pill_lbl.add_theme_color_override("font_color", Color.WHITE)
	pill.add_child(pill_lbl)
	
	var btn_close = Button.new()
	btn_close.size = Vector2(36, 36)
	btn_close.position = Vector2(370 - 44, 8)
	btn_close.text = "✕"
	btn_close.flat = true
	btn_close.add_theme_font_size_override("font_size", 20)
	btn_close.add_theme_color_override("font_color", Color("#8b5c2a"))
	btn_close.pressed.connect(dismiss)
	card.add_child(btn_close)
	
	var sub_lbl = Label.new()
	sub_lbl.position = Vector2(0, 24)
	sub_lbl.size = Vector2(370, 24)
	sub_lbl.text = "200关大师级试炼 · 点击任一关卡立即挑战"
	sub_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub_lbl.add_theme_font_size_override("font_size", 12)
	sub_lbl.add_theme_color_override("font_color", Color("#7c582c"))
	card.add_child(sub_lbl)
	
	tabs_container = HBoxContainer.new()
	tabs_container.position = Vector2(16, 52)
	tabs_container.size = Vector2(338, 32)
	tabs_container.add_theme_constant_override("separation", 6)
	card.add_child(tabs_container)
	
	var tab_names = ["1-40关", "41-80关", "81-120关", "121-160关", "161-200关"]
	for i in range(tab_names.size()):
		var t_btn = Button.new()
		t_btn.text = tab_names[i]
		t_btn.size_flags_horizontal = SIZE_EXPAND_FILL
		t_btn.add_theme_font_size_override("font_size", 11)
		t_btn.pressed.connect(func(): _switch_chapter(i))
		tabs_container.add_child(t_btn)
		
	var scroll = ScrollContainer.new()
	scroll.position = Vector2(16, 92)
	scroll.size = Vector2(338, 400)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	card.add_child(scroll)
	
	grid_container = GridContainer.new()
	grid_container.columns = 4
	grid_container.size_flags_horizontal = SIZE_EXPAND_FILL
	grid_container.add_theme_constant_override("h_separation", 8)
	grid_container.add_theme_constant_override("v_separation", 8)
	scroll.add_child(grid_container)
	
	_update_chapter_tabs()
	_populate_grid()

func _switch_chapter(ch: int) -> void:
	current_chapter = ch
	_update_chapter_tabs()
	_populate_grid()

func _update_chapter_tabs() -> void:
	var children = tabs_container.get_children()
	for i in range(children.size()):
		var btn: Button = children[i]
		var is_active = (i == current_chapter)
		var sb = StyleBoxFlat.new()
		sb.set_corner_radius_all(10)
		sb.set_border_width_all(1)
		if is_active:
			sb.bg_color = Color("#df9738")
			sb.border_color = Color.WHITE
			btn.add_theme_color_override("font_color", Color.WHITE)
		else:
			sb.bg_color = Color("#eddcc5")
			sb.border_color = Color(1.0, 1.0, 1.0, 0.7)
			btn.add_theme_color_override("font_color", Color("#6e491e"))
		btn.add_theme_stylebox_override("normal", sb)
		btn.add_theme_stylebox_override("hover", sb)
		btn.add_theme_stylebox_override("pressed", sb)

func _populate_grid() -> void:
	for c in grid_container.get_children():
		c.queue_free()
		
	var start_lv = current_chapter * 40 + 1
	var end_lv = start_lv + 39
	var cur_playing = game_state.current_level if game_state else 1
	
	for lv in range(start_lv, end_lv + 1):
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(76, 56)
		
		var is_current = (lv == cur_playing)
		var is_cleared = game_state.is_level_completed(lv) if game_state else false
		var stars = game_state.get_level_stars(lv) if game_state else 0
		
		btn.text = "关卡 %d\n%s" % [lv, "★★★" if (is_cleared or stars >= 3) else ("★☆☆" if stars > 0 else "☆☆☆")]
		btn.add_theme_font_size_override("font_size", 12)
		
		var sb = StyleBoxFlat.new()
		sb.set_corner_radius_all(12)
		sb.set_border_width_all(2 if is_current else 1)
		
		if is_current:
			sb.bg_color = Color("#fff8e7")
			sb.border_color = Color("#df9738")
			btn.add_theme_color_override("font_color", Color("#b86812"))
		elif is_cleared:
			sb.bg_color = Color("#eef6db")
			sb.border_color = Color("#8aa858")
			btn.add_theme_color_override("font_color", Color("#4b6e1a"))
		else:
			sb.bg_color = Color.WHITE
			sb.border_color = Color(0.85, 0.85, 0.85)
			btn.add_theme_color_override("font_color", Color("#5c3d18"))
			
		btn.add_theme_stylebox_override("normal", sb)
		btn.add_theme_stylebox_override("hover", sb)
		btn.add_theme_stylebox_override("pressed", sb)
		
		btn.pressed.connect(func():
			level_selected.emit(lv)
			dismiss()
		)
		grid_container.add_child(btn)

func show_modal() -> void:
	move_to_front()
	visible = true
	modulate.a = 0.0
	card.scale = Vector2(0.85, 0.85)
	card.pivot_offset = card.size * 0.5
	if game_state:
		current_chapter = int((game_state.current_level - 1) / 40)
	_update_chapter_tabs()
	_populate_grid()
	
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 1.0, 0.18)
	tw.tween_property(card, "scale", Vector2.ONE, 0.20).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func dismiss() -> void:
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 0.0, 0.14)
	tw.tween_property(card, "scale", Vector2(0.9, 0.9), 0.14)
	tw.finished.connect(func(): visible = false)
`;

// ============================================================================
// 9. scripts/VictoryModal.gd (通关胜利结算面板)
// ============================================================================
const victoryModalGd = `class_name VictoryModal
extends Control

signal next_level_pressed
signal restart_pressed

var card: Panel
var stars_container: HBoxContainer
var star_labels: Array = []
var confetti_layer: Control
var confetti_particles: Array = []

func setup() -> void:
	_build_ui()

func _build_ui() -> void:
	for c in get_children():
		c.queue_free()
		
	var mask = ColorRect.new()
	mask.set_anchors_preset(PRESET_FULL_RECT)
	mask.color = Color(0.06, 0.04, 0.02, 0.68)
	add_child(mask)
	
	# 五彩纸屑层 (置于卡片下方，绝不遮挡按钮点击)
	confetti_layer = Control.new()
	confetti_layer.set_anchors_preset(PRESET_FULL_RECT)
	confetti_layer.mouse_filter = MOUSE_FILTER_IGNORE
	confetti_layer.draw.connect(_on_confetti_draw)
	add_child(confetti_layer)
	
	card = Panel.new()
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	card.custom_minimum_size = Vector2(344, 360)
	card.size = Vector2(344, 360)
	card.position = Vector2((414 - 344) * 0.5, (896 - 360) * 0.5 - 20)
	
	var sb_card = StyleBoxFlat.new()
	sb_card.bg_color = Color("#f8eedd")
	sb_card.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_card.set_border_width_all(2)
	sb_card.set_corner_radius_all(26)
	sb_card.shadow_color = Color(0.2, 0.12, 0.03, 0.35)
	sb_card.shadow_size = 20
	sb_card.shadow_offset = Vector2(0, 8)
	card.add_theme_stylebox_override("panel", sb_card)
	add_child(card)
	
	var pill = Panel.new()
	pill.size = Vector2(160, 40)
	pill.position = Vector2((344 - 160) * 0.5, -20)
	var sb_pill = StyleBoxFlat.new()
	sb_pill.bg_color = Color("#e5a344")
	sb_pill.border_color = Color(1.0, 1.0, 1.0, 0.95)
	sb_pill.set_border_width_all(2)
	sb_pill.set_corner_radius_all(20)
	pill.add_theme_stylebox_override("panel", sb_pill)
	card.add_child(pill)
	
	var pill_lbl = Label.new()
	pill_lbl.set_anchors_preset(PRESET_FULL_RECT)
	pill_lbl.text = "过关成功"
	pill_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pill_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	pill_lbl.add_theme_font_size_override("font_size", 20)
	pill_lbl.add_theme_color_override("font_color", Color.WHITE)
	pill.add_child(pill_lbl)
	
	stars_container = HBoxContainer.new()
	stars_container.position = Vector2(0, 48)
	stars_container.size = Vector2(344, 90)
	stars_container.alignment = BoxContainer.ALIGNMENT_CENTER
	stars_container.add_theme_constant_override("separation", 18)
	card.add_child(stars_container)
	
	star_labels.clear()
	for i in range(3):
		var star_lbl = Label.new()
		star_lbl.text = "★"
		star_lbl.add_theme_font_size_override("font_size", 48 if i != 1 else 62)
		star_lbl.add_theme_color_override("font_color", Color("#f5b942"))
		star_lbl.add_theme_color_override("font_shadow_color", Color(0.8, 0.45, 0.05, 0.9))
		star_lbl.add_theme_constant_override("shadow_offset_y", 2)
		star_lbl.pivot_offset = Vector2(24, 24)
		stars_container.add_child(star_lbl)
		star_labels.append(star_lbl)
		
	var tip_lbl = Label.new()
	tip_lbl.name = "TipLabel"
	tip_lbl.position = Vector2(0, 150)
	tip_lbl.size = Vector2(344, 30)
	tip_lbl.text = "精彩绝伦！完美通关"
	tip_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tip_lbl.add_theme_font_size_override("font_size", 16)
	tip_lbl.add_theme_color_override("font_color", Color("#5c3d18"))
	card.add_child(tip_lbl)
	
	var btn_re = Button.new()
	btn_re.custom_minimum_size = Vector2(136, 46)
	btn_re.size = Vector2(136, 46)
	btn_re.position = Vector2(24, 280)
	btn_re.text = "重玩本关 🔄"
	btn_re.add_theme_font_size_override("font_size", 15)
	btn_re.add_theme_color_override("font_color", Color.WHITE)
	var sb_re = StyleBoxFlat.new()
	sb_re.bg_color = Color("#e5a344")
	sb_re.border_color = Color.WHITE
	sb_re.set_border_width_all(1)
	sb_re.set_corner_radius_all(16)
	btn_re.add_theme_stylebox_override("normal", sb_re)
	btn_re.add_theme_stylebox_override("hover", sb_re)
	btn_re.add_theme_stylebox_override("pressed", sb_re)
	btn_re.pressed.connect(func(): dismiss(); restart_pressed.emit())
	card.add_child(btn_re)
	
	var btn_next = Button.new()
	btn_next.custom_minimum_size = Vector2(150, 46)
	btn_next.size = Vector2(150, 46)
	btn_next.position = Vector2(170, 280)
	btn_next.text = "进入下一关 ➔"
	btn_next.add_theme_font_size_override("font_size", 16)
	btn_next.add_theme_color_override("font_color", Color.WHITE)
	var sb_next = StyleBoxFlat.new()
	sb_next.bg_color = Color("#78ba28")
	sb_next.border_color = Color.WHITE
	sb_next.set_border_width_all(1)
	sb_next.set_corner_radius_all(16)
	btn_next.add_theme_stylebox_override("normal", sb_next)
	btn_next.add_theme_stylebox_override("hover", sb_next)
	btn_next.add_theme_stylebox_override("pressed", sb_next)
	btn_next.pressed.connect(func(): dismiss(); next_level_pressed.emit())
	card.add_child(btn_next)

func show_victory(lv: int) -> void:
	move_to_front()
	visible = true
	modulate.a = 0.0
	card.scale = Vector2(0.82, 0.82)
	card.pivot_offset = card.size * 0.5
	
	var tip = card.get_node_or_null("TipLabel") as Label
	if tip:
		tip.text = "恭喜完成第 %d 关 · 完美通关！" % lv
		
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 1.0, 0.22)
	tw.tween_property(card, "scale", Vector2.ONE, 0.26).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	
	for i in range(star_labels.size()):
		var s_lbl: Label = star_labels[i]
		s_lbl.scale = Vector2.ZERO
		var s_tw = create_tween()
		s_tw.tween_interval(0.20 + i * 0.14)
		s_tw.tween_property(s_lbl, "scale", Vector2(1.25, 1.25), 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		s_tw.tween_property(s_lbl, "scale", Vector2.ONE, 0.12)
		
	confetti_particles.clear()
	var cols = [Color("#ff4757"), Color("#2ed573"), Color("#1e90ff"), Color("#ffa502"), Color("#9b59b6")]
	for k in range(45):
		confetti_particles.append({
			"pos": Vector2(414 * 0.5 + randf_range(-60, 60), 400),
			"vel": Vector2(randf_range(-180, 180), randf_range(-380, -120)),
			"size": Vector2(randf_range(6, 12), randf_range(5, 9)),
			"rot": randf_range(0, TAU),
			"rot_speed": randf_range(-12, 12),
			"col": cols[randi() % cols.size()],
			"life": randf_range(1.5, 2.4),
			"age": 0.0
		})

func _process(delta: float) -> void:
	if not visible or confetti_particles.is_empty():
		return
	var alive: Array = []
	for p in confetti_particles:
		p["age"] += delta
		p["pos"] += p["vel"] * delta
		p["vel"].y += 240.0 * delta
		p["rot"] += p["rot_speed"] * delta
		if p["age"] < p["life"]:
			alive.append(p)
	confetti_particles = alive
	if confetti_layer:
		confetti_layer.queue_redraw()

func _on_confetti_draw() -> void:
	for p in confetti_particles:
		var alpha = clampf(1.0 - (p["age"] / p["life"]), 0.0, 1.0)
		var c = Color(p["col"].r, p["col"].g, p["col"].b, alpha)
		var t = Transform2D().rotated(p["rot"]).translated(p["pos"])
		confetti_layer.draw_set_transform_matrix(t)
		confetti_layer.draw_rect(Rect2(-p["size"] * 0.5, p["size"]), c)
	confetti_layer.draw_set_transform_matrix(Transform2D.IDENTITY)

func dismiss() -> void:
	var tw = create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "modulate:a", 0.0, 0.16)
	tw.tween_property(card, "scale", Vector2(0.9, 0.9), 0.16)
	tw.finished.connect(func(): visible = false)
`;

// ============================================================================
// 10. scripts/PebbleButton.gd (原生 TextureButton 引擎驱动，100% 灵敏零丢点击)
// ============================================================================
const pebbleButtonGd = `class_name PebbleButton
extends TextureButton

signal action_triggered(key: String)

@export var button_key: String = ""
@export var button_texture: Texture2D
@export var badge_count: int = -1

var badge_overlay: Control

func _ready() -> void:
	custom_minimum_size = Vector2(72, 72)
	size = Vector2(72, 72)
	mouse_filter = MOUSE_FILTER_STOP
	texture_normal = button_texture
	ignore_texture_size = true
	stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	pivot_offset = Vector2(36, 36)
	
	pressed.connect(func():
		var tw = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(self, "scale", Vector2(0.90, 0.90), 0.06)
		tw.tween_property(self, "scale", Vector2.ONE, 0.12)
		action_triggered.emit(button_key)
	)
	
	badge_overlay = Control.new()
	badge_overlay.size = Vector2(72, 72)
	badge_overlay.mouse_filter = MOUSE_FILTER_IGNORE
	badge_overlay.draw.connect(_on_badge_draw)
	add_child(badge_overlay)

func set_badge(count: int) -> void:
	badge_count = count
	if badge_overlay:
		badge_overlay.queue_redraw()

func _on_badge_draw() -> void:
	if badge_count <= 0:
		return
	var badge_pos = Vector2(56.0, 16.0)
	var badge_r = 10.5
	badge_overlay.draw_circle(badge_pos + Vector2(0, 1.5), badge_r, Color(0.1, 0.2, 0.35, 0.35))
	badge_overlay.draw_circle(badge_pos, badge_r, Color("#2563eb"))
	badge_overlay.draw_arc(badge_pos, badge_r - 0.5, 0, TAU, 16, Color(1, 1, 1, 0.85), 1.2, true)
	var font = ThemeDB.fallback_font
	badge_overlay.draw_string(font, badge_pos + Vector2(-4.0, 4.5), str(badge_count), HORIZONTAL_ALIGNMENT_CENTER, -1, 13, Color.WHITE)
`;

// ============================================================================
// 11. scripts/Main.gd (主协调器：原生按钮全绑定、流体重力倾斜与全场景微动效)
// ============================================================================
const mainGd = `extends Control

const LiquidPalette = preload("res://scripts/LiquidPalette.gd")
const LevelGenerator = preload("res://scripts/LevelGenerator.gd")
const GameState = preload("res://scripts/GameState.gd")
const TubeView = preload("res://scripts/TubeView.gd")
const PebbleButton = preload("res://scripts/PebbleButton.gd")
const StreamRenderer = preload("res://scripts/StreamRenderer.gd")
const SettingsModal = preload("res://scripts/SettingsModal.gd")
const LevelSelectModal = preload("res://scripts/LevelSelectModal.gd")
const VictoryModal = preload("res://scripts/VictoryModal.gd")

const TEX_BTN_RESTART = preload("res://assets/textures/btn_level.png")
const TEX_BTN_SHUFFLE = preload("res://assets/textures/btn_shuffle.png")
const TEX_BTN_UNDO = preload("res://assets/textures/btn_undo.png")
const TEX_BTN_HINT = preload("res://assets/textures/btn_add_bottle.png")

@onready var top_bar: Control = $TopBar
@onready var btn_settings: TextureButton = $TopBar/BtnSettings
@onready var level_pill: TextureButton = $TopBar/LevelPill
@onready var btn_help: TextureButton = $TopBar/BtnHelp
@onready var top_label: Label = $TopBar/LevelPill/TitleLabel
@onready var bags_stage: HBoxContainer = $BagsStage
@onready var tubes_layer: Control = $TubesStage
@onready var hint_layer: Control = $HintLayer
@onready var stream_renderer: StreamRenderer = $StreamRenderer
@onready var bottom_bar: HBoxContainer = $BottomBar
@onready var settings_modal: SettingsModal = $SettingsModal
@onready var level_select_modal: LevelSelectModal = $LevelSelectModal
@onready var victory_modal: VictoryModal = $VictoryModal

var game_state: GameState = GameState.new()
var tube_views: Array = []
var active_hint_pair: Array = []
var hint_arrow_pts: PackedVector2Array = PackedVector2Array()

func _ready() -> void:
	game_state.level_loaded.connect(_on_level_loaded)
	game_state.selection_changed.connect(_on_selection_changed)
	game_state.pour_started.connect(_on_pour_started)
	game_state.victory_achieved.connect(_on_victory)
	game_state.state_updated.connect(_on_state_updated)
	
	settings_modal.setup(game_state)
	settings_modal.restart_pressed.connect(func(): game_state.load_level(game_state.current_level))
	settings_modal.skip_pressed.connect(func(): game_state.load_level(game_state.current_level + 1))
	settings_modal.home_pressed.connect(func(): level_select_modal.show_modal())
	
	level_select_modal.setup(game_state)
	level_select_modal.level_selected.connect(func(lv): game_state.load_level(lv))
	
	victory_modal.setup()
	victory_modal.next_level_pressed.connect(_on_next_level_pressed)
	victory_modal.restart_pressed.connect(func(): game_state.load_level(game_state.current_level))
	
	hint_layer.draw.connect(_on_hint_draw)
	
	btn_settings.pressed.connect(func(): settings_modal.show_modal())
	level_pill.pressed.connect(func(): level_select_modal.show_modal())
	btn_help.pressed.connect(_on_help_pressed)
	
	setup_bottom_buttons()
	game_state.load_level(1)
	
	_check_cmdline_actions()

func _check_cmdline_actions() -> void:
	var all_args = OS.get_cmdline_args() + OS.get_cmdline_user_args()
	if "--capture" in all_args:
		await get_tree().create_timer(0.4).timeout
		_save_and_quit("screenshot_preview.png")
	elif "--capture-settings" in all_args:
		settings_modal.show_modal()
		await get_tree().create_timer(0.4).timeout
		_save_and_quit("screenshot_settings.png")
	elif "--capture-level" in all_args:
		level_select_modal.show_modal()
		await get_tree().create_timer(0.4).timeout
		_save_and_quit("screenshot_level.png")
	elif "--capture-pour" in all_args:
		game_state.handle_bottle_click(0)
		game_state.handle_bottle_click(5)
		await get_tree().create_timer(0.45).timeout
		_save_and_quit("screenshot_pour.png")
	elif "--capture-victory" in all_args:
		_on_victory()
		await get_tree().create_timer(0.45).timeout
		_save_and_quit("screenshot_victory.png")

func _save_and_quit(filename: String) -> void:
	var img = get_viewport().get_texture().get_image()
	img.save_png("res://" + filename)
	print("CAPTURE_SAVED: ", filename)
	get_tree().quit()

func _on_help_pressed() -> void:
	settings_modal.show_modal()

func _on_level_loaded(cfg: Dictionary) -> void:
	top_label.text = cfg["title"]
	active_hint_pair.clear()
	hint_arrow_pts.clear()
	hint_layer.queue_redraw()
	victory_modal.visible = false
	settings_modal.visible = false
	level_select_modal.visible = false
	if bags_stage:
		bags_stage.visible = not cfg.get("bags", []).is_empty()
	build_tubes(cfg["bottles"])

func build_tubes(bottles: Array) -> void:
	for c in tubes_layer.get_children():
		c.queue_free()
	tube_views.clear()
	
	var total = bottles.size()
	var b_w: float = 56.0
	var b_h: float = 171.0
	var spacing: float = 9.0
	
	var row1_count = int(ceil(float(total) / 2.0))
	var row2_count = total - row1_count
	
	var row1_total_w = row1_count * b_w + (row1_count - 1) * spacing
	var start_x1 = (414.0 - row1_total_w) * 0.5
	var row1_y = 257.0
	
	for i in range(row1_count):
		var tv = TubeView.new()
		tv.tube_index = i
		tv.tube_width = b_w
		tv.tube_height = b_h
		var stagger_y = -25.0 if (i % 2 == 1) else 0.0
		tv.position = Vector2(start_x1 + i * (b_w + spacing), row1_y + stagger_y)
		tv.tube_clicked.connect(_on_tube_clicked)
		tubes_layer.add_child(tv)
		tv.set_tube_data(bottles[i])
		tube_views.append(tv)
		
	if row2_count > 0:
		var row2_total_w = row2_count * b_w + (row2_count - 1) * spacing
		var start_x2 = (414.0 - row2_total_w) * 0.5
		var row2_y = 485.0
		
		for i in range(row2_count):
			var idx = row1_count + i
			var tv = TubeView.new()
			tv.tube_index = idx
			tv.tube_width = b_w
			tv.tube_height = b_h
			var stagger_y = -25.0 if (i % 2 == 1) else 0.0
			tv.position = Vector2(start_x2 + i * (b_w + spacing), row2_y + stagger_y)
			tv.tube_clicked.connect(_on_tube_clicked)
			tubes_layer.add_child(tv)
			tv.set_tube_data(bottles[idx])
			tube_views.append(tv)

func setup_bottom_buttons() -> void:
	for c in bottom_bar.get_children():
		c.queue_free()
		
	var btns_data = [
		{ "key": "restart", "tex": TEX_BTN_RESTART, "badge": -1 },
		{ "key": "shuffle", "tex": TEX_BTN_SHUFFLE, "badge": 3 },
		{ "key": "undo",    "tex": TEX_BTN_UNDO,    "badge": 5 },
		{ "key": "hint",    "tex": TEX_BTN_HINT,    "badge": 3 }
	]
	
	for b_info in btns_data:
		var btn = PebbleButton.new()
		btn.button_key = b_info["key"]
		btn.button_texture = b_info["tex"]
		btn.badge_count = b_info["badge"]
		btn.action_triggered.connect(_on_action_button_pressed)
		bottom_bar.add_child(btn)

func _on_tube_clicked(idx: int) -> void:
	if not active_hint_pair.is_empty():
		for h_idx in active_hint_pair:
			if h_idx < tube_views.size():
				tube_views[h_idx].highlight_hint(false)
		active_hint_pair.clear()
		hint_arrow_pts.clear()
		hint_layer.queue_redraw()
		
	var res = game_state.handle_bottle_click(idx)
	if res.get("type") == "UNLOCK_AD":
		if idx < tube_views.size():
			tube_views[idx].play_unlock_animation()

func _on_selection_changed(sel_idx: int) -> void:
	for i in range(tube_views.size()):
		tube_views[i].set_selected(i == sel_idx)

func get_physical_spill_angle_deg(volume_layers: float, max_cap: int = 4) -> float:
	var v = clampf((volume_layers / float(max_cap)) * 4.0, 0.0, 4.0)
	if v >= 1.0:
		return 96.0 - (v - 1.0) * 11.0
	else:
		return 96.0 + (1.0 - v) * 7.0

func _on_pour_started(plan: Dictionary) -> void:
	var from_idx: int = plan["from_index"]
	var to_idx: int = plan["to_index"]
	var from_tv: TubeView = tube_views[from_idx]
	var to_tv: TubeView = tube_views[to_idx]
	
	var pour_col_name: String = plan["color"]
	var col_info = LiquidPalette.get_color_info(pour_col_name)
	var move_count: int = plan["count"]
	
	var src_b = game_state.bottles[from_idx]
	var dst_b = game_state.bottles[to_idx]
	var src_cap: int = src_b.get("max_cap", 4)
	var dst_cap: int = dst_b.get("max_cap", 4)
	var initial_dst_layers: int = dst_b["layers"].size()
	var start_src_vol: float = float(src_b["layers"].size())
	var end_src_vol: float = start_src_vol - float(move_count)
	
	var orig_pos = from_tv.position
	# 边界安全倒水方向判定 (100% 对齐 v10.html 原型算法)
	var can_pour_from_left = (to_tv.position.x - 110.0) >= 4.0
	var can_pour_from_right = (to_tv.position.x + 110.0) <= 410.0
	var pour_dir = 1.0 if from_tv.position.x <= to_tv.position.x else -1.0
	if pour_dir == 1.0 and not can_pour_from_left and can_pour_from_right:
		pour_dir = -1.0
	elif pour_dir == -1.0 and not can_pour_from_right and can_pour_from_left:
		pour_dir = 1.0
		
	var start_tilt = pour_dir * get_physical_spill_angle_deg(start_src_vol, src_cap)
	var end_tilt = pour_dir * get_physical_spill_angle_deg(end_src_vol, src_cap)
	
	from_tv.holder.pivot_offset = Vector2(from_tv.tube_width * 0.5 + pour_dir * 18.0, 12.0)
	var target_fly_pos = to_tv.position + Vector2(-pour_dir * 38.0, -58.0)
	
	from_tv.z_index = 10
	
	var move_dur = 0.24
	var pour_dur = 0.46 + (move_count - 1) * 0.10
	var return_dur = 0.22
	
	var seq = create_tween()
	
	# ===================== 阶段 1：飞渡到目标瓶口，同时倾斜 =====================
	seq.set_parallel(true)
	seq.tween_property(from_tv, "position", target_fly_pos, move_dur).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	seq.tween_method(func(p: float):
		var cur_t = lerp(0.0, start_tilt, p)
		from_tv.holder.rotation_degrees = cur_t
		from_tv.set_liquid_override({
			"mode": "drain",
			"scale": 1.0,
			"color": pour_col_name,
			"tilt_deg": cur_t
		})
	, 0.0, 1.0, move_dur).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	seq.set_parallel(false)
	
	# ===================== 阶段 2：重力流体丝滑喷射与双瓶液位同步上涨/下降 =====================
	seq.tween_callback(func():
		var spout_pt = from_tv.global_position + Vector2(from_tv.tube_width * 0.5 + pour_dir * 22.0, 14.0)
		var mouth_pt = to_tv.global_position + Vector2(to_tv.tube_width * 0.5, 12.0)
		var dst_unit_h = to_tv.tube_height * 0.17745
		var dst_bot_y = to_tv.global_position.y + to_tv.tube_height * 0.92255
		var cur_surface_y = dst_bot_y - initial_dst_layers * dst_unit_h
		stream_renderer.start_stream(spout_pt, mouth_pt, cur_surface_y, col_info["mid"])
	)
	
	seq.tween_method(func(p: float):
		var cur_tilt = lerp(start_tilt, end_tilt, p)
		from_tv.holder.rotation_degrees = cur_tilt
		
		# 源瓶液体实时重力倾斜与连续排空 (支持多层连续倒入)
		var cur_rem_vol = start_src_vol - float(move_count) * p
		var rem_layers = []
		var base_keep = int(floor(cur_rem_vol))
		for k in range(base_keep):
			if k < src_b["layers"].size():
				rem_layers.append(src_b["layers"][k])
		var cur_frac = cur_rem_vol - float(base_keep)
		if cur_frac > 0.005 and rem_layers.size() < src_b["layers"].size():
			rem_layers.append(src_b["layers"][rem_layers.size()])
		else:
			cur_frac = 1.0
			
		from_tv.set_liquid_override({
			"mode": "drain",
			"override_layers": rem_layers,
			"scale": cur_frac,
			"color": pour_col_name,
			"tilt_deg": cur_tilt
		})
		
		# 目标瓶液体实时上涨 + 弯月面波浪微涟漪
		var full_added = int(floor(float(move_count) * p))
		var dst_layers = dst_b["layers"].duplicate()
		for k in range(full_added):
			dst_layers.append(pour_col_name)
		var dst_frac = (float(move_count) * p) - float(full_added)
		if dst_frac > 0.005:
			dst_layers.append(pour_col_name)
		else:
			dst_frac = 1.0
			
		var slosh_amp = sin(p * PI) * 0.42
		to_tv.set_liquid_override({
			"mode": "fill",
			"override_layers": dst_layers,
			"scale": dst_frac,
			"color": pour_col_name,
			"slosh_phase": p * 24.0,
			"slosh_amp": slosh_amp,
			"tilt_deg": 0.0
		})
		
		var dst_unit_h = to_tv.tube_height * 0.17745
		var dst_bot_y = to_tv.global_position.y + to_tv.tube_height * 0.92255
		var live_surface_y = dst_bot_y - (initial_dst_layers + move_count * p) * dst_unit_h
		stream_renderer.update_stream(p, live_surface_y)
	, 0.0, 1.0, pour_dur)
	
	# ===================== 阶段 3：断流、旋转复位并飞回原垫 + 落地Squish回弹 =====================
	seq.tween_callback(func():
		stream_renderer.stop_stream()
	)
	
	seq.set_parallel(true)
	seq.tween_property(from_tv, "position", orig_pos, return_dur).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	seq.tween_method(func(p: float):
		var cur_t = lerp(end_tilt, 0.0, p)
		from_tv.holder.rotation_degrees = cur_t
		var fin_rem_vol = start_src_vol - float(move_count)
		var fin_layers = []
		var fin_keep = int(floor(fin_rem_vol))
		for k in range(fin_keep):
			if k < src_b["layers"].size():
				fin_layers.append(src_b["layers"][k])
		from_tv.set_liquid_override({
			"mode": "drain",
			"override_layers": fin_layers,
			"scale": 1.0,
			"color": pour_col_name,
			"tilt_deg": cur_t
		})
	, 0.0, 1.0, return_dur).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	seq.set_parallel(false)
	
	seq.tween_callback(func():
		from_tv.z_index = 0
		from_tv.holder.pivot_offset = Vector2(from_tv.tube_width * 0.5, 14.0)
		from_tv.play_landing_squish()
		from_tv.clear_liquid_override()
		to_tv.clear_liquid_override()
		game_state.apply_pour(plan)
		
		if game_state.is_bottle_complete(game_state.bottles[to_idx]):
			to_tv.play_cork_animation()
	)

func _on_state_updated() -> void:
	for i in range(tube_views.size()):
		if i < game_state.bottles.size():
			tube_views[i].set_tube_data(game_state.bottles[i])

func _on_action_button_pressed(key: String) -> void:
	match key:
		"restart":
			game_state.load_level(game_state.current_level)
		"undo":
			game_state.undo()
		"shuffle":
			for i in range(tube_views.size()):
				tube_views[i].play_wave_motion(i * 0.04)
			var tw = create_tween()
			tw.tween_interval(0.24)
			tw.tween_callback(func(): game_state.shuffle())
		"hint":
			var pair = game_state.find_hint()
			if pair.size() == 2:
				active_hint_pair = pair
				tube_views[pair[0]].highlight_hint(true)
				tube_views[pair[1]].highlight_hint(true)
				
				var p0 = tube_views[pair[0]].global_position + Vector2(tube_views[pair[0]].tube_width * 0.5, 12.0)
				var p1 = tube_views[pair[1]].global_position + Vector2(tube_views[pair[1]].tube_width * 0.5, 12.0)
				var ctrl = (p0 + p1) * 0.5 - Vector2(0, 48.0)
				hint_arrow_pts.clear()
				for s in range(21):
					var t = float(s) / 20.0
					var q0 = p0.lerp(ctrl, t)
					var q1 = ctrl.lerp(p1, t)
					hint_arrow_pts.append(q0.lerp(q1, t))
				hint_layer.queue_redraw()
				
				var tw = create_tween()
				tw.tween_interval(3.5)
				tw.tween_callback(func():
					if not active_hint_pair.is_empty():
						tube_views[pair[0]].highlight_hint(false)
						tube_views[pair[1]].highlight_hint(false)
						active_hint_pair.clear()
						hint_arrow_pts.clear()
						hint_layer.queue_redraw()
				)

func _on_hint_draw() -> void:
	if hint_arrow_pts.size() > 1:
		var pulse = 0.6 + 0.4 * sin(Time.get_ticks_msec() * 0.01)
		draw_polyline(hint_arrow_pts, Color(1.0, 0.85, 0.2, 0.75 * pulse), 3.2, true)
		draw_polyline(hint_arrow_pts, Color.WHITE, 1.4, true)

func _on_victory() -> void:
	victory_modal.show_victory(game_state.current_level)

func _on_next_level_pressed() -> void:
	victory_modal.visible = false
	game_state.load_level(game_state.current_level + 1)
`;

// ============================================================================
// 12. scenes/Main.tscn (全屏舞台、原生可点按钮与高保真模态层)
// ============================================================================
const mainTscn = `[gd_scene format=3 uid="uid://c6watergamemain"]

[ext_resource type="Script" path="res://scripts/Main.gd" id="1_main"]
[ext_resource type="Script" path="res://scripts/StreamRenderer.gd" id="2_stream"]
[ext_resource type="Script" path="res://scripts/SettingsModal.gd" id="3_settings_m"]
[ext_resource type="Script" path="res://scripts/LevelSelectModal.gd" id="4_level_m"]
[ext_resource type="Script" path="res://scripts/VictoryModal.gd" id="5_victory_m"]
[ext_resource type="Texture2D" path="res://assets/textures/bg_game.png" id="6_bg"]
[ext_resource type="Texture2D" path="res://assets/textures/btn_settings.png" id="7_settings"]
[ext_resource type="Texture2D" path="res://assets/textures/btn_power.png" id="8_help"]
[ext_resource type="Texture2D" path="res://assets/textures/level_pill.png" id="9_pill"]
[ext_resource type="Texture2D" path="res://assets/textures/bag_item_yellow.png" id="10_bag_yellow"]
[ext_resource type="Texture2D" path="res://assets/textures/bag_item_red.png" id="11_bag_red"]
[ext_resource type="Texture2D" path="res://assets/textures/bag_item_blue.png" id="12_bag_blue"]
[ext_resource type="Texture2D" path="res://assets/textures/bag_item_video.png" id="13_bag_video"]

[sub_resource type="Gradient" id="Gradient_ambient"]
offsets = PackedFloat32Array(0, 0.45, 1)
colors = PackedColorArray(1, 0.95, 0.8, 0, 1, 0.9, 0.65, 0.65, 1, 0.95, 0.8, 0)

[node name="Main" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("1_main")

[node name="Background" type="TextureRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
texture = ExtResource("6_bg")
expand_mode = 1
stretch_mode = 6

[node name="AmbientParticles" type="CPUParticles2D" parent="."]
position = Vector2(207, 448)
amount = 26
lifetime = 6.0
emission_shape = 3
emission_rect_extents = Vector2(207, 448)
direction = Vector2(0, -1)
spread = 24.0
gravity = Vector2(0, -6)
initial_velocity_min = 12.0
initial_velocity_max = 28.0
scale_amount_min = 2.0
scale_amount_max = 4.0
color_ramp = SubResource("Gradient_ambient")

[node name="TubesStage" type="Control" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2

[node name="HintLayer" type="Control" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2

[node name="StreamRenderer" type="Control" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2
script = ExtResource("2_stream")

[node name="TopBar" type="Control" parent="."]
layout_mode = 1
anchors_preset = 10
anchor_right = 1.0
offset_bottom = 76.0
grow_horizontal = 2
mouse_filter = 2

[node name="BtnSettings" type="TextureButton" parent="TopBar"]
layout_mode = 1
anchors_preset = 4
anchor_top = 0.5
anchor_bottom = 0.5
offset_left = 20.0
offset_top = -24.0
offset_right = 68.0
offset_bottom = 24.0
grow_vertical = 2
mouse_filter = 0
texture_normal = ExtResource("7_settings")
ignore_texture_size = true
stretch_mode = 5

[node name="LevelPill" type="TextureButton" parent="TopBar"]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -78.0
offset_top = -20.0
offset_right = 78.0
offset_bottom = 20.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 0
texture_normal = ExtResource("9_pill")
ignore_texture_size = true
stretch_mode = 6

[node name="TitleLabel" type="Label" parent="TopBar/LevelPill"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
offset_top = -1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2
theme_override_colors/font_color = Color(0.15, 0.28, 0.5, 1)
theme_override_colors/font_shadow_color = Color(1, 1, 1, 0.85)
theme_override_constants/shadow_offset_x = 0
theme_override_constants/shadow_offset_y = 1
theme_override_font_sizes/font_size = 20
text = "第 1 关"
horizontal_alignment = 1
vertical_alignment = 1

[node name="BtnHelp" type="TextureButton" parent="TopBar"]
layout_mode = 1
anchors_preset = 6
anchor_top = 0.5
anchor_right = 1.0
anchor_bottom = 0.5
offset_left = -68.0
offset_top = -24.0
offset_right = -20.0
offset_bottom = 24.0
grow_horizontal = 0
grow_vertical = 2
mouse_filter = 0
texture_normal = ExtResource("8_help")
ignore_texture_size = true
stretch_mode = 5

[node name="BagsStage" type="HBoxContainer" parent="."]
visible = false
layout_mode = 1
anchors_preset = 10
anchor_right = 1.0
offset_top = 78.0
offset_bottom = 160.0
grow_horizontal = 2
theme_override_constants/separation = 16
alignment = 1
mouse_filter = 2

[node name="Bag1" type="TextureRect" parent="BagsStage"]
custom_minimum_size = Vector2(56, 78)
layout_mode = 2
texture = ExtResource("10_bag_yellow")
expand_mode = 1
stretch_mode = 5

[node name="Bag2" type="TextureRect" parent="BagsStage"]
custom_minimum_size = Vector2(56, 78)
layout_mode = 2
texture = ExtResource("11_bag_red")
expand_mode = 1
stretch_mode = 5

[node name="Bag3" type="TextureRect" parent="BagsStage"]
custom_minimum_size = Vector2(56, 78)
layout_mode = 2
texture = ExtResource("12_bag_blue")
expand_mode = 1
stretch_mode = 5

[node name="Bag4" type="TextureRect" parent="BagsStage"]
custom_minimum_size = Vector2(56, 78)
layout_mode = 2
texture = ExtResource("13_bag_video")
expand_mode = 1
stretch_mode = 5

[node name="BottomBar" type="HBoxContainer" parent="."]
layout_mode = 1
anchors_preset = 12
anchor_top = 1.0
anchor_right = 1.0
anchor_bottom = 1.0
offset_top = -98.0
offset_bottom = -22.0
grow_horizontal = 2
grow_vertical = 0
mouse_filter = 2
theme_override_constants/separation = 18
alignment = 1

[node name="SettingsModal" type="Control" parent="."]
visible = false
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("3_settings_m")

[node name="LevelSelectModal" type="Control" parent="."]
visible = false
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("4_level_m")

[node name="VictoryModal" type="Control" parent="."]
visible = false
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("5_victory_m")
`;

// ============================================================================
// 文件写入与双向同步
// ============================================================================
const fileMap = {
  'project.godot': projectGodotContent,
  'scripts/LiquidPalette.gd': liquidPaletteGd,
  'scripts/LevelGenerator.gd': levelGeneratorGd,
  'scripts/GameState.gd': gameStateGd,
  'scripts/TubeView.gd': tubeViewGd,
  'scripts/StreamRenderer.gd': streamRendererGd,
  'scripts/SettingsModal.gd': settingsModalGd,
  'scripts/LevelSelectModal.gd': levelSelectModalGd,
  'scripts/VictoryModal.gd': victoryModalGd,
  'scripts/PebbleButton.gd': pebbleButtonGd,
  'scripts/Main.gd': mainGd,
  'scenes/Main.tscn': mainTscn
};

for (const [relPath, content] of Object.entries(fileMap)) {
  const p1 = path.join(targetDir, relPath);
  fs.writeFileSync(p1, content, 'utf8');
  const p2 = path.join(syncDir, relPath);
  fs.writeFileSync(p2, content, 'utf8');
  console.log('✓ 已写入并同步:', relPath);
}

console.log('\n=== 全套倒水流体动效与按钮修复构建完毕！===');
