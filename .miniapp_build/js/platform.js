/**
 * 跨平台环境适配器 (Platform.js)
 * 工业级支持 TapTap 小游戏 (tap)、微信小游戏 (wx)、抖音小游戏 (tt) 与 Web 浏览器
 * 严格杜绝在无 DOM 沙箱中直接调用 document / window 导致黑屏崩溃
 */

const Platform = {
  // 识别当前宿主环境
  type: (function() {
    if (typeof tap !== 'undefined') return 'taptap';
    if (typeof wx !== 'undefined') return 'wechat';
    if (typeof tt !== 'undefined') return 'douyin';
    return 'browser';
  })(),

  getHost() {
    if (typeof tap !== 'undefined') return tap;
    if (typeof wx !== 'undefined') return wx;
    if (typeof tt !== 'undefined') return tt;
    return null;
  },

  // 获取主屏 Canvas (小游戏规范：主屏 canvas 默认全局注入或由 host.createCanvas 创建)
  getMainCanvas() {
    // 1. 全局已存在 canvas 对象
    if (typeof canvas !== 'undefined' && canvas && typeof canvas.getContext === 'function') {
      return canvas;
    }
    // 2. 宿主小游戏环境 API
    const host = this.getHost();
    if (host && typeof host.createCanvas === 'function') {
      try {
        const c = host.createCanvas();
        if (c) return c;
      } catch (e) {}
    }
    // 3. Web 浏览器 DOM 环境
    if (typeof document !== 'undefined') {
      let c = document.getElementById('game-canvas') || document.getElementById('gameCanvas');
      if (c) return c;
      c = document.createElement('canvas');
      c.id = 'game-canvas';
      document.body.appendChild(c);
      return c;
    }
    return null;
  },

  // 别名兼容
  createCanvas(width, height) {
    if (width && height) {
      return this.createOffscreenCanvas(width, height);
    }
    return this.getMainCanvas();
  },

  createMainCanvas() {
    return this.getMainCanvas();
  },

  // 创建离屏 Canvas
  createOffscreenCanvas(width = 300, height = 300) {
    const host = this.getHost();
    if (host && typeof host.createOffscreenCanvas === 'function') {
      try {
        return host.createOffscreenCanvas({ type: '2d', width, height });
      } catch (e) {}
    }
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      return c;
    }
    return null;
  },

  // 获取系统屏幕尺寸与像素比
  getSystemInfo() {
    const host = this.getHost();
    if (host && typeof host.getSystemInfoSync === 'function') {
      try {
        const info = host.getSystemInfoSync();
        return {
          windowWidth: info.windowWidth || 375,
          windowHeight: info.windowHeight || 667,
          pixelRatio: Math.min(info.pixelRatio || 2, 3),
          platform: info.platform || 'mobile'
        };
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      const c = document.getElementById('game-canvas') || document.getElementById('gameCanvas');
      const w = (c && c.clientWidth) ? c.clientWidth : (window.innerWidth || 375);
      const h = (c && c.clientHeight) ? c.clientHeight : (window.innerHeight || 667);
      const dpr = Math.min(window.devicePixelRatio || 2, 3);
      return {
        windowWidth: w,
        windowHeight: h,
        pixelRatio: dpr,
        platform: 'browser'
      };
    }

    return {
      windowWidth: 375,
      windowHeight: 667,
      pixelRatio: 2,
      platform: 'unknown'
    };
  },

  getScreenSize() {
    const info = this.getSystemInfo();
    return {
      width: info.windowWidth,
      height: info.windowHeight,
      dpr: info.pixelRatio
    };
  },

  // 跨平台统一触控交互监听 (统一分发 clientX, clientY)
  onTouch(callback) {
    const host = this.getHost();

    // 1. 小游戏端触控事件
    if (host) {
      const handler = (e) => {
        const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
        if (t) callback(t.clientX, t.clientY);
      };
      if (typeof host.onTouchStart === 'function') {
        host.onTouchStart(handler);
        return;
      }
    }

    // 2. 浏览器 Web DOM 触控/鼠标事件
    if (typeof window !== 'undefined') {
      const getCoords = (e) => {
        const c = document.getElementById('game-canvas') || document.getElementById('gameCanvas');
        const rect = c ? c.getBoundingClientRect() : { left: 0, top: 0 };
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      window.addEventListener('pointerdown', (e) => {
        const pt = getCoords(e);
        callback(pt.x, pt.y);
      });

      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          const pt = getCoords(e.touches[0]);
          callback(pt.x, pt.y);
        }
      }, { passive: true });
    }
  },

  onTouchStart(callback) {
    this.onTouch(callback);
  },

  onTouchEnd(callback) {
    this.onTouch(callback);
  },

  // 触感震动
  triggerHaptic(duration = 15) {
    const host = this.getHost();
    if (host && typeof host.vibrateShort === 'function') {
      try { host.vibrateShort({ type: 'light' }); return; } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(duration); } catch (e) {}
    }
  },

  // 本地持久化存储
  getStorage(key, defVal = null) {
    const host = this.getHost();
    if (host && typeof host.getStorageSync === 'function') {
      try {
        const val = host.getStorageSync(key);
        return val !== '' && val !== null && val !== undefined ? val : defVal;
      } catch (e) { return defVal; }
    }
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      return val !== null ? val : defVal;
    }
    return defVal;
  },

  setStorage(key, val) {
    const host = this.getHost();
    if (host && typeof host.setStorageSync === 'function') {
      try { host.setStorageSync(key, val); return; } catch (e) {}
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, String(val));
    }
  }
};

if (typeof module !== 'undefined') {
  module.exports = Platform;
}

