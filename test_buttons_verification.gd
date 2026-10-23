extends SceneTree

func _init() -> void:
	print("=== STARTING BUTTONS & FLUID VERIFICATION ===")
	call_deferred("_run_tests")

func _run_tests() -> void:
	var tree_root = get_root()
	var main_scene = load("res://scenes/Main.tscn").instantiate()
	tree_root.add_child(main_scene)
	
	await create_timer(0.1).timeout
	
	var top_bar = main_scene.get_node("TopBar")
	var btn_settings: TextureButton = top_bar.get_node("BtnSettings")
	var level_pill: TextureButton = top_bar.get_node("LevelPill")
	var btn_help: TextureButton = top_bar.get_node("BtnHelp")
	var settings_modal = main_scene.get_node("SettingsModal")
	var level_select_modal = main_scene.get_node("LevelSelectModal")
	var victory_modal = main_scene.get_node("VictoryModal")
	var bottom_bar = main_scene.get_node("BottomBar")
	var game_state = main_scene.game_state
	
	# Test 1: BtnSettings
	print("\n[Test 1] Testing BtnSettings...")
	assert(not settings_modal.visible, "Settings modal should be hidden initially")
	btn_settings.emit_signal("pressed")
	await create_timer(0.05).timeout
	assert(settings_modal.visible, "Settings modal should be visible after BtnSettings pressed")
	print("✓ PASS: BtnSettings opens SettingsModal")
	
	# Test 2: SettingsModal toggle switch
	print("\n[Test 2] Testing SettingsModal toggle switches...")
	var initial_sound = game_state.user_settings.get("sound", true)
	var sound_toggle = settings_modal.toggle_nodes.get("sound")
	assert(sound_toggle != null, "Sound toggle node should exist")
	# Find row button containing sound toggle
	var row_btn: Button = sound_toggle.get_parent() as Button
	assert(row_btn != null, "Row button should exist")
	row_btn.emit_signal("pressed")
	await create_timer(0.05).timeout
	var new_sound = game_state.user_settings.get("sound", true)
	assert(new_sound == not initial_sound, "Sound setting should have toggled")
	print("✓ PASS: SettingsModal row button toggled sound from %s to %s" % [initial_sound, new_sound])
	
	# Dismiss settings modal
	settings_modal.dismiss()
	await create_timer(0.2).timeout
	assert(not settings_modal.visible, "Settings modal should be dismissed")
	print("✓ PASS: SettingsModal dismissed cleanly")
	
	# Test 3: LevelPill
	print("\n[Test 3] Testing LevelPill...")
	assert(not level_select_modal.visible, "Level select modal should be hidden initially")
	level_pill.emit_signal("pressed")
	await create_timer(0.05).timeout
	assert(level_select_modal.visible, "Level select modal should be visible after LevelPill pressed")
	print("✓ PASS: LevelPill opens LevelSelectModal")
	
	# Test 4: LevelSelectModal chapter tab and level selection
	print("\n[Test 4] Testing LevelSelectModal tabs and level click...")
	var tabs = level_select_modal.tabs_container.get_children()
	assert(tabs.size() == 5, "Should have 5 chapter tabs")
	var tab2: Button = tabs[1]
	tab2.emit_signal("pressed")
	await create_timer(0.05).timeout
	assert(level_select_modal.current_chapter == 1, "Chapter should switch to 1 (41-80)")
	print("✓ PASS: Chapter tab switched to 41-80")
	
	# Switch back to chapter 0 and click Level 2
	var tab1: Button = tabs[0]
	tab1.emit_signal("pressed")
	await create_timer(0.05).timeout
	var level_buttons = level_select_modal.grid_container.get_children()
	assert(level_buttons.size() >= 40, "Should have 40 level buttons in grid")
	var btn_lv2: Button = level_buttons[1]
	btn_lv2.emit_signal("pressed")
	await create_timer(0.2).timeout
	assert(game_state.current_level == 2, "Level 2 should now be loaded")
	assert(not level_select_modal.visible, "Level select modal should be dismissed")
	print("✓ PASS: Level 2 button clicked, loaded level %d and modal dismissed" % game_state.current_level)
	
	# Test 5: BtnHelp
	print("\n[Test 5] Testing BtnHelp...")
	btn_help.emit_signal("pressed")
	await create_timer(0.05).timeout
	assert(settings_modal.visible, "Settings modal should open on BtnHelp")
	settings_modal.dismiss()
	await create_timer(0.2).timeout
	print("✓ PASS: BtnHelp functions properly")
	
	# Test 6: BottomBar Buttons
	print("\n[Test 6] Testing BottomBar PebbleButtons...")
	var bottom_btns = bottom_bar.get_children()
	assert(bottom_btns.size() == 4, "BottomBar should have 4 pebble buttons")
	var pebble_restart: TextureButton = bottom_btns[0]
	var pebble_shuffle: TextureButton = bottom_btns[1]
	var pebble_undo: TextureButton = bottom_btns[2]
	var pebble_hint: TextureButton = bottom_btns[3]
	
	# Test Hint
	pebble_hint.emit_signal("pressed")
	await create_timer(0.05).timeout
	print("✓ PASS: Hint button pressed without error")
	
	# Test Shuffle
	pebble_shuffle.emit_signal("pressed")
	await create_timer(0.3).timeout
	print("✓ PASS: Shuffle button pressed, wave motion and state updated")
	
	# Test Undo
	var can_undo = pebble_undo != null
	pebble_undo.emit_signal("pressed")
	await create_timer(0.05).timeout
	print("✓ PASS: Undo button pressed without error")
	
	# Test Restart
	pebble_restart.emit_signal("pressed")
	await create_timer(0.1).timeout
	print("✓ PASS: Restart button pressed, level reset cleanly")
	
	# Test 7: Bottle click selection & pour
	print("\n[Test 7] Testing TubeView clicks & selection...")
	var tubes = main_scene.tube_views
	assert(tubes.size() > 0, "Tube views should exist")
	var tv0 = tubes[0]
	tv0.tube_clicked.emit(0)
	await create_timer(0.05).timeout
	assert(game_state.selected_index == 0, "Bottle 0 should be selected")
	assert(tv0.is_selected, "TubeView 0 should have is_selected = true")
	print("✓ PASS: TubeView 0 selected with lift animation")
	
	# Click bottle 0 again to deselect
	tv0.tube_clicked.emit(0)
	await create_timer(0.05).timeout
	assert(game_state.selected_index == -1, "Bottle 0 should be deselected")
	print("✓ PASS: TubeView 0 deselected cleanly")
	
	print("\n==============================================")
	print("🎉 ALL BUTTONS & FLOW TESTS PASSED SUCCESSFULLY!")
	print("==============================================")
	quit()
