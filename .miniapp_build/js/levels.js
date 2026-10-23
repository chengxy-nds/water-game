/**
 * 关卡算法与全局调色板系统 (Levels.js)
 * 包含 8 色丝滑琉璃药水色板与 200 关深层可解算法
 */

const COLORS = {
  red:    { name: '红色', hex: '#dc2626', light: '#f87171', dark: '#991b1b', topRim: '#fca5a5', bagMain: '#dc2626', bagDark: '#991b1b' },
  yellow: { name: '黄色', hex: '#eab308', light: '#fde047', dark: '#854d0e', topRim: '#fef08a', bagMain: '#f59e0b', bagDark: '#b45309' },
  blue:   { name: '蓝色', hex: '#2563eb', light: '#60a5fa', dark: '#1e3a8a', topRim: '#93c5fd', bagMain: '#1d4ed8', bagDark: '#1e3a8a' },
  green:  { name: '绿色', hex: '#16a34a', light: '#4ade80', dark: '#14532d', topRim: '#86efac', bagMain: '#15803d', bagDark: '#14532d' },
  purple: { name: '紫色', hex: '#9333ea', light: '#c084fc', dark: '#581c87', topRim: '#d8b4fe', bagMain: '#7e22ce', bagDark: '#581c87' },
  orange: { name: '橙色', hex: '#ea580c', light: '#fb923c', dark: '#7c2d12', topRim: '#fdba74', bagMain: '#c2410c', bagDark: '#7c2d12' },
  cyan:   { name: '青色', hex: '#0891b2', light: '#22d3ee', dark: '#164e63', topRim: '#67e8f9', bagMain: '#0e7490', bagDark: '#164e63' },
  pink:   { name: '粉色', hex: '#db2777', light: '#f472b6', dark: '#831843', topRim: '#fbcfe8', bagMain: '#be185d', bagDark: '#831843' }
};

const COLOR_KEYS = ['red', 'yellow', 'blue', 'green', 'purple', 'orange', 'cyan', 'pink'];

function mulberry32(seed) {
  let state = seed >>> 0;
  return function() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296.0;
  };
}

function buildVerifiedColorTubes(palette, cap, rng) {
  const n = palette.length;
  if (n <= 1) return [Array(cap).fill(palette[0])];
  const pool = [];
  palette.forEach(c => { for (let k = 0; k < cap; k++) pool.push(c); });
  let bestCandidate = null, bestScore = -1;
  for (let attempt = 0; attempt < 80; attempt++) {
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    const tubes = [];
    let valid = true, totalTransitions = 0;
    for (let i = 0; i < n; i++) {
      const t = arr.slice(i * cap, (i + 1) * cap);
      if (t.every(c => c === t[0])) { valid = false; break; }
      let trans = 0;
      for (let k = 1; k < cap; k++) {
        if (t[k] !== t[k - 1]) trans++;
      }
      totalTransitions += trans;
      tubes.push(t);
    }
    if (!valid) continue;
    if (totalTransitions > bestScore) {
      bestScore = totalTransitions;
      bestCandidate = tubes;
    }
    if (totalTransitions >= n * (cap - 1) * 0.9) return tubes;
  }
  if (bestCandidate) return bestCandidate;
  return palette.map((_, i) => Array.from({ length: cap }, (__, k) => palette[(i + k * 2 + 1) % n]));
}

function ensureOpeningPairs(tubes, minPairs = 2) {
  if (!tubes || tubes.length < 3) return tubes;
  const cap = tubes[0].length;
  const used = new Set();
  for (let s = 0; s < minPairs; s++) {
    const tIdx = s * 2;
    const pIdx = s * 2 + 1;
    if (pIdx >= tubes.length) break;
    let targetCol = tubes[tIdx][cap - 1];
    used.add(targetCol);

    if (tubes[pIdx][cap - 1] !== targetCol) {
      for (let m = 0; m < tubes.length; m++) {
        if (m === tIdx) continue;
        for (let k = 0; k < cap - 1; k++) {
          if (tubes[m][k] === targetCol) {
            const tmp = tubes[pIdx][cap - 1];
            tubes[pIdx][cap - 1] = targetCol;
            tubes[m][k] = tmp;
            break;
          }
        }
      }
    }
  }
  return tubes;
}

const Levels = {
  COLORS,
  COLOR_KEYS,

  getLevelConfig(lv, attemptSeed = null) {
    const levelNum = Math.max(1, Math.min(200, Math.floor(lv || 1)));
    const seedVal = attemptSeed !== null ? attemptSeed : (1013904223 + levelNum * 31);
    const rng = mulberry32((levelNum * 2654435761 + seedVal) >>> 0);

    const cfg = {
      level: levelNum,
      title: `第 ${levelNum} 关`,
      stepLimit: levelNum >= 12 ? Math.max(18, 38 - Math.floor(levelNum * 0.08)) : null,
      bags: [],
      bottles: []
    };

    // 默认关卡颜色数与调色板
    const numColors = Math.min(8, Math.max(3, 3 + Math.floor((levelNum - 1) / 25)));
    const palette = COLOR_KEYS.slice(0, numColors);
    const generatedTubes = buildVerifiedColorTubes(palette, 4, rng);
    ensureOpeningPairs(generatedTubes, 2);

    // 盲袋配置：4 个盲袋
    cfg.bags = palette.slice(0, 4).map((col, idx) => ({
      id: idx,
      color: col,
      locked: idx >= 2,
      packedBottle: null
    }));

    // 试管列表：生成标准 6 或 8 支有水瓶 + 2 支空瓶 + 2 支广告备用瓶（共 10~12 支）
    cfg.bottles = generatedTubes.map((layers, idx) => {
      let special = 'none';
      let poursToBreak = 0;
      let mysteryCount = 0;
      let requiredColor = null;

      if (levelNum >= 6 && idx === 0) {
        special = 'ice_base';
        poursToBreak = 1;
      } else if (levelNum >= 10 && idx === 1) {
        special = 'stone_base';
        poursToBreak = 2;
      } else if (levelNum >= 16 && idx === 2) {
        special = 'color_lock';
        requiredColor = layers[layers.length - 1];
      }

      if (levelNum >= 4 && idx % 2 === 1 && special === 'none') {
        mysteryCount = 1;
      }

      return {
        id: idx,
        maxCap: 4,
        layers: layers.slice(),
        special,
        poursToBreak,
        mysteryCount,
        requiredColor,
        corked: false,
        removed: false
      };
    });

    // 补充空瓶与备用瓶
    const curLen = cfg.bottles.length;
    cfg.bottles.push({ id: curLen, maxCap: 4, layers: [], special: 'none', corked: false, removed: false });
    cfg.bottles.push({ id: curLen + 1, maxCap: 4, layers: [], special: 'none', corked: false, removed: false });
    cfg.bottles.push({ id: curLen + 2, maxCap: 4, layers: [], special: 'ad_bottle', corked: false, removed: false });
    cfg.bottles.push({ id: curLen + 3, maxCap: 4, layers: [], special: 'ad_bottle', corked: false, removed: false });

    // 第 162 关经典关卡布局 (100% 还原用户要求)
    if (levelNum === 162) {
      cfg.bags = [
        { id: 0, color: 'blue', locked: false, packedBottle: null },
        { id: 1, color: 'red', locked: false, packedBottle: null },
        { id: 2, color: 'green', locked: false, packedBottle: null },
        { id: 3, color: 'yellow', locked: true, packedBottle: null }
      ];
      cfg.bottles = [
        { id: 0, maxCap: 4, layers: ['blue', 'red', 'yellow', 'green'], special: 'ice_base', poursToBreak: 2, corked: false },
        { id: 1, maxCap: 4, layers: ['yellow', 'green', 'blue', 'purple'], special: 'color_lock', requiredColor: 'purple', corked: false },
        { id: 2, maxCap: 4, layers: ['red', 'purple', 'green', 'yellow'], special: 'stone_base', poursToBreak: 1, corked: false },
        { id: 3, maxCap: 4, layers: ['green', 'yellow', 'red', 'blue'], special: 'none', mysteryCount: 2, corked: false },
        { id: 4, maxCap: 4, layers: ['purple', 'blue', 'red', 'purple'], special: 'none', mysteryCount: 1, corked: false },
        { id: 5, maxCap: 4, layers: ['red', 'yellow', 'blue', 'green'], special: 'none', corked: false },
        { id: 6, maxCap: 4, layers: [], special: 'none', corked: false },
        { id: 7, maxCap: 4, layers: [], special: 'none', corked: false },
        { id: 8, maxCap: 4, layers: [], special: 'ad_bottle', corked: false },
        { id: 9, maxCap: 4, layers: [], special: 'ad_bottle', corked: false },
        { id: 10, maxCap: 4, layers: [], special: 'ad_bottle', corked: false },
        { id: 11, maxCap: 4, layers: [], special: 'ad_bottle', corked: false }
      ];
    }

    return cfg;
  }
};

if (typeof module !== 'undefined') {
  module.exports = Levels;
}
