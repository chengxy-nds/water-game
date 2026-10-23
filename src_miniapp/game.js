/**
 * 《倒水不能停》TapTap & 微信小游戏统一主引擎入口 (100% 完整原版全机制)
 */

var Platform = (typeof Platform !== 'undefined') ? Platform : (typeof require !== 'undefined' ? require('./js/platform.js') : (typeof window !== 'undefined' ? window.Platform : globalThis.Platform));
var Levels = (typeof Levels !== 'undefined') ? Levels : (typeof require !== 'undefined' ? require('./js/levels.js') : (typeof window !== 'undefined' ? window.Levels : globalThis.Levels));
var GameLogic = (typeof GameLogic !== 'undefined') ? GameLogic : (typeof require !== 'undefined' ? require('./js/game_logic.js') : (typeof window !== 'undefined' ? window.GameLogic : globalThis.GameLogic));
var Renderer = (typeof Renderer !== 'undefined') ? Renderer : (typeof require !== 'undefined' ? require('./js/renderer.js') : (typeof window !== 'undefined' ? window.Renderer : globalThis.Renderer));
var AudioManager = (typeof AudioManager !== 'undefined') ? AudioManager : (typeof require !== 'undefined' ? require('./js/audio.js') : (typeof window !== 'undefined' ? window.AudioManager : globalThis.AudioManager));

console.log('Water Sort Full Fidelity Engine Initializing...');

const canvas = Platform.getMainCanvas();
if (!canvas) {
  console.error('[Engine Fatal] Could not obtain main Canvas element.');
}

const sysInfo = Platform.getSystemInfo();
const audioManager = new AudioManager(Platform);
const gameLogic = new GameLogic(Levels, Platform);
const renderer = new Renderer(canvas, Levels);

renderer.resize(sysInfo);

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    renderer.resize(Platform.getSystemInfo());
  });
}

// 读取关卡，默认加载第 162 关经典关
const savedLevel = parseInt(Platform.getStorage('water_game_current_level', 162), 10);
gameLogic.loadLevel(savedLevel);

// 16ms 内首屏同步绘制
renderer.render(gameLogic, audioManager);
console.log('Water Sort First Frame Rendered.');

// 60FPS 渲染循环
function gameLoop() {
  renderer.render(gameLogic, audioManager);
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(gameLoop);
  }
}
if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(gameLoop);
}

// 统一触控交互监听
Platform.onTouch((clientX, clientY) => {
  const hit = renderer.hitTest(clientX, clientY, gameLogic.isVictory);
  if (!hit) return;

  switch (hit.type) {
    case 'BAG': {
      gameLogic.handleBagTap(hit.index);
      audioManager.playSelect();
      break;
    }

    case 'BOTTLE': {
      const res = gameLogic.handleBottleTap(hit.index);
      if (!res) break;

      if (res.type === 'SELECT') {
        audioManager.playSelect();
      } else if (res.type === 'POUR') {
        gameLogic.isAnimating = true;
        renderer.startPourAnimation(res.plan, () => {
          const outcome = gameLogic.applyPour(res.plan);
          audioManager.playPour();
          gameLogic.isAnimating = false;

          if (outcome.isVictory) {
            audioManager.playWin();
            Platform.setStorage('water_game_current_level', gameLogic.currentLevel + 1);
          }
        });
      }
      break;
    }

    case 'RESTART': {
      gameLogic.restart();
      audioManager.playSelect();
      break;
    }

    case 'SHUFFLE': {
      const ok = gameLogic.shuffle();
      if (ok) audioManager.playSelect();
      break;
    }

    case 'UNDO': {
      const ok = gameLogic.undo();
      if (ok) audioManager.playSelect();
      break;
    }

    case 'HINT': {
      const pair = gameLogic.hint();
      if (pair) audioManager.playSelect();
      break;
    }

    case 'NEXT_LEVEL': {
      renderer.resetVictoryParticles();
      const nextLvl = gameLogic.currentLevel + 1;
      gameLogic.loadLevel(nextLvl);
      Platform.setStorage('water_game_current_level', nextLvl);
      audioManager.playSelect();
      break;
    }
  }
});

console.log('Water Sort Full Fidelity Engine Running!');

