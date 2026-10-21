const fs = require('fs');
const path = require('path');

// 1. 同步 types.ts
const workspaceTypes = fs.readFileSync(path.join(__dirname, '../src/types/game.ts'), 'utf-8');
const cocosTypesPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/core/types.ts';
fs.writeFileSync(cocosTypesPath, workspaceTypes, 'utf-8');
console.log('✓ Synced types.ts to Cocos');

// 2. 同步 waterSortLogic.ts
const workspaceLogic = fs.readFileSync(path.join(__dirname, '../src/game/waterSortLogic.ts'), 'utf-8');
const cocosLogicPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/core/waterSortLogic.ts';
const cocosLogic = workspaceLogic.replace("../types/game", "./types");
fs.writeFileSync(cocosLogicPath, cocosLogic, 'utf-8');
console.log('✓ Synced waterSortLogic.ts to Cocos');
// 3. 同步 levelGenerator.ts
const workspaceLevels = fs.readFileSync(path.join(__dirname, '../src/data/levelGenerator.ts'), 'utf-8');
const cocosLevelsPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/core/levelGenerator.ts';
const cocosLevels = workspaceLevels
  .replace("../types/game", "./types")
  .replace("../constants/colors", "./colors");
fs.writeFileSync(cocosLevelsPath, cocosLevels, 'utf-8');
console.log('✓ Synced levelGenerator.ts to Cocos');
