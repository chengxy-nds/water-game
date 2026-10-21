const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../demo/v9.html')
];

const TAP_BRIDGE_CODE = `
    // ==========================================
    // 0. TapTap 官方小游戏开放平台 SDK 桥接层 (TapTapBridge)
    // ==========================================
    const TAP_CONFIG = {
      clientId: '2churuxkey3zhktug2',
      clientToken: 'bAmMtLUCeY0ZITLYJjcODrVe644poeQNXGNOjXNf',
      serverUrl: 'https://2churuxkey3zhktug2.cloud.tds1.tapapis.cn',
      clientPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5GV2XtqasAcxt8Ld4i5pFIxi2l+I1Z2k5rU5q+SZJ8qlVLcsE/tw0WnRiPftaHku7/gp3YMtrr/T0FUzVG0S1dSMuyXR7kfbTqBJ0lj3lExr0tCuEf+B9SHN7GNtU+/dbgZkYfztnYhGC4ZqEjYGAnXzholnBGUOuC5Yu1xU7BA0LJ+u571GP4LsvkaHokJPYTNtYZTI9mnHZyFg6kiTVsQ9Uv29ONQfQGGuQ9L6bYZ3Zb9Dfh34HdzDMaL6S61dOkidgBaeeWG8IV7zzEXcghlG8PkZcea5YDlL/7fM0IOav+PCH4rOO9haiCN0x86QXZnSMKXlnZ4N2+itak52gQIDAQAB',
      isLocalEnv: ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:'
    };

    const TapTapBridge = {
      isReady: false,
      currentUser: null,
      antiAddictionPassed: true,

      // 1. 本地存储安全读写（双写架构基石）
      storage: {
        get(key, defaultVal) {
          try {
            const val = localStorage.getItem('water_game_' + key);
            return val !== null ? JSON.parse(val) : defaultVal;
          } catch (e) {
            return defaultVal;
          }
        },
        set(key, val) {
          try {
            localStorage.setItem('water_game_' + key, JSON.stringify(val));
          } catch (e) {
            console.warn('[TapBridge] 本地存储写入失败:', e);
          }
        }
      },

      // 2. 初始化 TapSDK 与防沉迷
      async init() {
        console.log('[TapBridge] 启动 TapTap 平台环境检查...');
        if (TAP_CONFIG.isLocalEnv) {
          console.log('[TapBridge] 当前为本地/离线开发环境，自动启用单机安全沙盒模式');
          this.isReady = true;
          return;
        }

        try {
          // 异步动态加载 TapSDK 库（3秒超时熔断机制，杜绝网络异常卡死启动）
          const loaded = await this._loadScriptWithTimeout('https://cdn.jsdelivr.net/npm/@taptap/tapsdk-web@latest/dist/tap-sdk.umd.js', 3000);
          if (loaded && window.TapSDK) {
            window.TapSDK.init({
              appId: TAP_CONFIG.clientId,
              clientToken: TAP_CONFIG.clientToken,
              serverURL: TAP_CONFIG.serverUrl
            });
            console.log('[TapBridge] TapSDK 核心引擎初始化完成');

            // 唤起 TapTap 授权与防沉迷
            if (window.TapSDK.TDSUser) {
              this.currentUser = await window.TapSDK.TDSUser.loginWithTapTap().catch(() => null);
              if (this.currentUser) {
                console.log('[TapBridge] TapTap 用户登录就绪:', this.currentUser.objectId);
                if (window.TapSDK.AntiAddiction) {
                  window.TapSDK.AntiAddiction.startup(this.currentUser.objectId);
                }
              }
            }
          }
        } catch (err) {
          console.warn('[TapBridge] TapSDK 初始化异常，已安全降级至本地模式:', err);
        } finally {
          this.isReady = true;
        }
      },

      // 3. 游戏进度读取与持久化
      loadProgress() {
        return {
          levelId: this.storage.get('level_id', 1),
          streakWins: this.storage.get('streak_wins', 1),
          activeTheme: this.storage.get('active_theme', 'zen_amber'),
          unlockedThemes: this.storage.get('unlocked_themes', ['zen_amber', 'starlight', 'volcanic'])
        };
      },

      saveProgress(levelId, extra = {}) {
        if (typeof levelId === 'number' && levelId >= 1) {
          this.storage.set('level_id', levelId);
        }
        if (extra.streakWins !== undefined) {
          this.storage.set('streak_wins', extra.streakWins);
        }
        if (extra.activeTheme) {
          this.storage.set('active_theme', extra.activeTheme);
        }
        if (extra.unlockedThemes) {
          this.storage.set('unlocked_themes', extra.unlockedThemes);
        }
        // 如果已连上 TapTap 云存档，进行静默同步
        if (window.TapSDK && window.TapSDK.CloudStorage && this.currentUser) {
          window.TapSDK.CloudStorage.saveData({
            levelId,
            updatedAt: Date.now(),
            ...extra
          }).catch(e => console.debug('[TapBridge] 云存档静默同步旁路:', e));
        }
      },

      // 4. 激励视频广告调度（IAA变现）
      showRewardAd(options = {}) {
        const { onReward, onCancel, onError } = options;
        // 如果在 TapTap 环境中且有广告实例
        if (window.TapAd && typeof window.TapAd.showRewardVideo === 'function') {
          window.TapAd.showRewardVideo({
            onReward: () => onReward && onReward(),
            onClose: () => onCancel && onCancel(),
            onError: (err) => {
              console.warn('[TapBridge] 广告加载异常，触发免阻断放行:', err);
              onReward && onReward();
            }
          });
          return;
        }
        // 本地环境或未开通广告时直接发放奖励（保证审核及玩家体验免阻断）
        console.log('[TapBridge] 模拟观看激励广告成功，发放奖励');
        onReward && onReward();
      },

      // 辅助方法：带超时的脚本加载
      _loadScriptWithTimeout(src, timeoutMs) {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          let timedOut = false;
          const timer = setTimeout(() => {
            timedOut = true;
            resolve(false);
          }, timeoutMs);

          script.onload = () => {
            if (!timedOut) {
              clearTimeout(timer);
              resolve(true);
            }
          };
          script.onerror = () => {
            if (!timedOut) {
              clearTimeout(timer);
              resolve(false);
            }
          };
          document.head.appendChild(script);
        });
      }
    };

    // 页面切后台自动静音适配（TapTap 官方标准规范）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend().catch(() => {});
        }
      } else {
        if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      }
    });
`;

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  if (content.includes('TapTapBridge')) {
    console.log('Already integrated TapTapBridge in:', path.basename(file));
    return;
  }

  // 1. 在 <script> 开头注入 TapTapBridge
  const scriptTag = '<script>';
  const idx = content.indexOf(scriptTag);
  if (idx !== -1) {
    content = content.slice(0, idx + scriptTag.length) + '\n' + TAP_BRIDGE_CODE + '\n' + content.slice(idx + scriptTag.length);
  }

  // 2. 从 TapTapBridge 恢复进度
  content = content.replace(
    'let currentLevelId = 1;',
    'const savedInitProgress = TapTapBridge.loadProgress();\n    let currentLevelId = savedInitProgress.levelId || 1;'
  );

  content = content.replace(
    'let streakWins = 1;',
    'let streakWins = savedInitProgress.streakWins || 1;'
  );

  content = content.replace(
    "let activeThemeId = 'zen_amber';",
    "let activeThemeId = savedInitProgress.activeTheme || 'zen_amber';"
  );

  // 3. 在通关、下一关、选关、切换主题时调用持久化
  content = content.replace(
    "showToast(`✨ 已开启：关卡 ${currentLevelId}`);",
    "showToast(`✨ 已开启：关卡 ${currentLevelId}`);\n      TapTapBridge.saveProgress(currentLevelId, { streakWins, activeTheme: activeThemeId });"
  );

  content = content.replace(
    "showToast(`✨ 已开启：关卡 ${lv}`);",
    "showToast(`✨ 已开启：关卡 ${lv}`);\n          TapTapBridge.saveProgress(currentLevelId, { streakWins, activeTheme: activeThemeId });"
  );

  // 4. 在 initGame 启动处触发 TapTapBridge.init()
  content = content.replace(
    'initGlobalBottleDefs();\n    initGame();',
    'initGlobalBottleDefs();\n    TapTapBridge.init();\n    initGame();'
  );

  fs.writeFileSync(file, content, 'utf-8');
  console.log('✓ Successfully integrated TapTapBridge into:', path.basename(file));
});
