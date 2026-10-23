// ============================================================================
// 02_constants_levels.js: 颜色定义、200关生成算法与特殊机制规则配置
// ============================================================================

const COLORS = {
  red:    { name: '红色', left: '#b30804', mid: '#c40a05', highlight: '#dc1e18', right: '#9c0603', topMid: '#e31a1a', topRim: '#fc2829', topLight: '#ff7878', bagMain: '#d4151d', bagDark: '#990910' },
  yellow: { name: '黄色', left: '#ebb008', mid: '#fcc00b', highlight: '#ffd438', right: '#d99f04', topMid: '#fbd126', topRim: '#ffdb2c', topLight: '#fffb8b', bagMain: '#f5a600', bagDark: '#c27d00' },
  blue:   { name: '蓝色', left: '#1515ad', mid: '#1b1bc0', highlight: '#3238d9', right: '#101096', topMid: '#3a56ca', topRim: '#4a68d8', topLight: '#7a96ff', bagMain: '#1c31cc', bagDark: '#101d8a' },
  green:  { name: '绿色', left: '#689905', mid: '#72a506', highlight: '#86ba14', right: '#588503', topMid: '#97cb1d', topRim: '#b2df4f', topLight: '#cff877', bagMain: '#5AA21A', bagDark: '#3F7710' },
  purple: { name: '紫色', left: '#5f1294', mid: '#7319b0', highlight: '#8e2dcf', right: '#4b0c78', topMid: '#9638d6', topRim: '#b055ed', topLight: '#deb3ff', bagMain: '#731fa8', bagDark: '#4d1078' },
  orange: { name: '橙色', left: '#cf4400', mid: '#e65000', highlight: '#f5681a', right: '#b03800', topMid: '#ff731c', topRim: '#ff8f3d', topLight: '#ffc285', bagMain: '#ea5504', bagDark: '#b33c00' },
  cyan:   { name: '青色', left: '#0784c4', mid: '#0e9ae0', highlight: '#2bb6f7', right: '#056da6', topMid: '#2cb9fc', topRim: '#57ccff', topLight: '#a6e9ff', bagMain: '#149ee3', bagDark: '#0b72ab' },
  pink:   { name: '粉色', left: '#c71864', mid: '#e02476', highlight: '#f54290', right: '#a31050', topMid: '#f74d97', topRim: '#ff70ae', topLight: '#ffb3d2', bagMain: '#e02476', bagDark: '#a31050' }
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
  for (let attempt = 0; attempt < 90; attempt++) {
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    const tubes = [];
    let valid = true, totalTransitions = 0;
    let distinctBottoms = new Set(), distinctTops = new Set();
    for (let i = 0; i < n; i++) {
      const t = arr.slice(i * cap, (i + 1) * cap);
      if (t.every(c => c === t[0])) { valid = false; break; }
      let trans = 0, maxRun = 1, curRun = 1;
      for (let k = 1; k < cap; k++) {
        if (t[k] !== t[k - 1]) { trans++; curRun = 1; }
        else { curRun++; if (curRun > maxRun) maxRun = curRun; }
      }
      const allowedRun = cap >= 8 ? 2 : 1;
      if (maxRun > allowedRun && attempt < 65) { valid = false; break; }
      if (cap >= 4 && t[cap - 1] === t[cap - 2] && attempt < 75) { valid = false; break; }
      distinctBottoms.add(t[0]); distinctTops.add(t[cap - 1]);
      totalTransitions += trans;
      tubes.push(t);
    }
    if (!valid) continue;
    const score = totalTransitions * 10 + distinctBottoms.size * 6 + distinctTops.size * 8;
    if (score > bestScore) { bestScore = score; bestCandidate = tubes; }
    if (totalTransitions >= n * (cap - 1) * 0.94 && distinctTops.size >= Math.min(n, 4)) return tubes;
  }
  if (bestCandidate) return bestCandidate;
  return palette.map((_, i) => Array.from({ length: cap }, (__, k) => palette[(i + k * 2 + 1) % n]));
}

function ensureOpeningPairs(tubes, minPairs = 2, customFreeIndices = null) {
  if (!tubes || tubes.length < 3) return tubes;
  const cap = tubes[0].length;
  const freeIndices = customFreeIndices ? customFreeIndices.slice() : [];
  if (freeIndices.length === 0) {
    for (let i = 0; i < tubes.length; i += 2) freeIndices.push(i);
    for (let i = 1; i < tubes.length; i += 2) freeIndices.push(i);
  }

  const usedPairColors = new Set();
  const pairsToMake = Math.min(minPairs, Math.floor(freeIndices.length / 2));
  for (let step = 0; step < pairsToMake; step++) {
    const targetBottleIdx = freeIndices[step * 2];
    const partnerBottleIdx = freeIndices[step * 2 + 1];
    if (partnerBottleIdx === undefined || partnerBottleIdx >= tubes.length) break;

    let desiredColor = tubes[targetBottleIdx][cap - 1];
    if (usedPairColors.has(desiredColor)) {
      for (let m = 0; m < tubes.length; m++) {
        for (let k = 0; k < cap; k++) {
          const cand = tubes[m][k];
          if (!usedPairColors.has(cand)) {
            const tmp = tubes[targetBottleIdx][cap - 1];
            tubes[targetBottleIdx][cap - 1] = cand;
            tubes[m][k] = tmp;
            desiredColor = cand;
            break;
          }
        }
        if (!usedPairColors.has(desiredColor)) break;
      }
    }
    usedPairColors.add(desiredColor);

    if (tubes[partnerBottleIdx][cap - 1] !== desiredColor) {
      let swapped = false;
      for (let m = 0; m < tubes.length && !swapped; m++) {
        if (m === targetBottleIdx) continue;
        for (let k = 0; k < cap - 1; k++) {
          if (tubes[m][k] === desiredColor && tubes[m][k] !== tubes[partnerBottleIdx][cap - 1]) {
            const tmp = tubes[partnerBottleIdx][cap - 1];
            tubes[partnerBottleIdx][cap - 1] = desiredColor;
            tubes[m][k] = tmp;
            swapped = true;
            break;
          }
        }
      }
    }
  }

  if (cap === 4 && freeIndices.length >= 4) {
    const pairColor0 = tubes[freeIndices[0]][cap - 1];
    const freeSet = new Set(freeIndices.slice(0, Math.min(4, freeIndices.length)));
    for (let m = 0; m < tubes.length; m++) {
      for (let k = 0; k < cap - 1; k++) {
        if (tubes[m][k] === pairColor0 && (!freeSet.has(m) || k === 0)) {
          for (const fIdx of freeIndices.slice(0, 4)) {
            if (tubes[fIdx][cap - 2] !== pairColor0 && tubes[fIdx][cap - 1] !== pairColor0) {
              const tmp = tubes[fIdx][cap - 2];
              tubes[fIdx][cap - 2] = pairColor0;
              tubes[m][k] = tmp;
              break;
            }
          }
        }
      }
    }
  }
  return tubes;
}

let currentLevelAttemptSeed = Math.floor(Math.random() * 1000000000);

function getLevelConfig(lv, attemptSeed = null) {
  const levelNum = Math.max(1, Math.min(200, Math.floor(lv || 1)));
  const seedVal = attemptSeed !== null ? attemptSeed : (currentLevelAttemptSeed || 1013904223);
  const rng = mulberry32((levelNum * 2654435761 + seedVal) >>> 0);
  const chapter = Math.floor((levelNum - 1) / 10) + 1;
  const pos = ((levelNum - 1) % 10) + 1;

  // 基础关卡目标、盲袋与机制设定
  const cfg = {
    level: levelNum,
    title: `第 ${levelNum} 关`,
    hasBags: true,
    stepLimit: null,
    isVariedHeight: false,
    bags: []
  };

  // 步数限制（高难关卡增加适度紧迫感）
  if (levelNum >= 15) {
    const baseMoves = Math.max(20, 42 - Math.floor(levelNum * 0.08));
    cfg.stepLimit = (pos === 4 || pos === 8 || pos === 10) ? baseMoves : null;
  }

  // 颜色选择器
  const numColors = Math.min(8, Math.max(3, 3 + Math.floor((levelNum - 1) / 25)));
  const palette = COLOR_KEYS.slice(0, numColors);
  const tubesA = buildVerifiedColorTubes(palette, 4, rng);
  ensureOpeningPairs(tubesA, 2);

  // 盲袋配置：初始生成 4 个盲袋，前 2 个直接展示，后续带锁定标志
  const bagColors = palette.slice(0, Math.min(4, palette.length));
  cfg.bags = bagColors.map((col, idx) => ({
    id: idx,
    color: col,
    locked: idx >= 2,
    packedBottle: null,
    removed: false
  }));

  // 水瓶生成逻辑
  cfg.createBottles = function() {
    const list = [];
    tubesA.forEach((layers, idx) => {
      let special = 'none';
      let poursToBreak = 0;
      let mysteryCount = 0;
      let countdownMoves = null;
      let requiredColor = null;

      if (pos === 2 && idx === 0 && levelNum >= 8) {
        special = 'ice_base';
        poursToBreak = 1;
      } else if (pos === 4 && idx === 1 && levelNum >= 14) {
        special = 'stone_base';
        poursToBreak = 2;
      } else if (pos === 6 && idx === 2 && levelNum >= 20) {
        special = 'color_lock';
        requiredColor = layers[layers.length - 1];
      } else if (pos === 7 && idx === 0 && levelNum >= 26) {
        special = 'one_way_in';
      } else if (pos === 9 && idx === 1 && levelNum >= 32) {
        special = 'one_way_out';
      }

      if (levelNum >= 5 && idx % 2 === 1 && special === 'none') {
        mysteryCount = 1;
      }

      list.push({
        id: idx,
        maxCap: 4,
        layers: layers.slice(),
        special,
        poursToBreak,
        mysteryCount,
        countdownMoves,
        requiredColor,
        corked: false,
        removed: false
      });
    });

    // 默认提供 2 个空瓶作为初始倒水空间
    const nextId = list.length;
    list.push({ id: nextId, maxCap: 4, layers: [], special: 'none', corked: false, removed: false });
    list.push({ id: nextId + 1, maxCap: 4, layers: [], special: 'none', corked: false, removed: false });

    // 第 162 关经典特殊设计
    if (levelNum === 162) {
      list.forEach((b, i) => {
        if (i === 0) { b.special = 'ice_base'; b.poursToBreak = 2; }
        if (i === 1) { b.special = 'color_lock'; b.requiredColor = 'purple'; }
        if (i === 2) { b.special = 'stone_base'; b.poursToBreak = 1; }
        if (i === 3) { b.mysteryCount = 2; }
      });
    }

    return list;
  };

  return cfg;
}

const MECHANIC_INTROS = {
  mystery: { title: '解锁新玩法', desc: '倒出顶层药水，即可揭晓下方 <b>?</b> 隐藏的颜色。' },
  ice_base: { title: '解锁新玩法', desc: '进行 <b>同色药水合并</b> 或装满整瓶，即可震碎瓶底凝霜。' },
  color_lock: { title: '解锁新玩法', desc: '带有专属色标的水瓶，<b>只能倒入对应颜色的药水</b>。' },
  one_way_in: { title: '解锁新玩法', desc: '瓶口装有单向漏斗，<b>只能往里倒水，不能向外倒出</b>。' },
  one_way_out: { title: '解锁新玩法', desc: '单向古瓶<b>只能向外倒水</b>，排空后自动变为普通空瓶。' }
};
