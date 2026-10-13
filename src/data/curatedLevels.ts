import { Bottle, Difficulty, Level, LevelDesignAudit } from "../types/game";
import { COLOR_KEYS } from "../utils/colors";

const CAPACITY = 4;
const LEVEL_COUNT = 100;
const FREE_SHOPPING_BAGS = 3;

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
};

const countLayerTransitions = (bottles: Bottle[]) => bottles.reduce((total, bottle) => {
  let transitions = 0;
  for (let index = 1; index < bottle.layers.length; index += 1) {
    if (bottle.layers[index] !== bottle.layers[index - 1]) transitions += 1;
  }
  return total + transitions;
}, 0);

const getLayoutRows = (total: number) => {
  if (total <= 5) return [total];
  if (total <= 14) return [Math.ceil(total / 2), Math.floor(total / 2)];
  const rowCount = Math.max(3, Math.ceil(total / 7));
  const base = Math.floor(total / rowCount);
  const remainder = total % rowCount;
  return Array.from({ length: rowCount }, (_, index) => base + (index >= rowCount - remainder ? 1 : 0));
};

const getBottleLayoutGroup = (bottle: Bottle) => {
  if (bottle.type === "empty" || bottle.type === "video_empty") return "empty";
  return bottle.type === "normal" ? null : bottle.type;
};

const scoreBottleLayout = (bottles: Bottle[]) => {
  const rowSizes = getLayoutRows(bottles.length);
  let score = 0;
  let rowStart = 0;

  for (const rowSize of rowSizes) {
    const rowCounts = new Map<string, number>();
    for (let column = 0; column < rowSize; column += 1) {
      const group = getBottleLayoutGroup(bottles[rowStart + column]);
      if (!group) continue;
      rowCounts.set(group, (rowCounts.get(group) ?? 0) + 1);
      if (column > 0 && getBottleLayoutGroup(bottles[rowStart + column - 1]) === group) score += 14;
    }
    for (const count of rowCounts.values()) score += Math.max(0, count - 1) * 5;
    rowStart += rowSize;
  }

  return score;
};

const shuffleBottleLayout = (bottles: Bottle[], random: () => number) => {
  const leakBottle = bottles.find((bottle) => bottle.type === "bottom_leak");
  const leakTarget = leakBottle
    ? bottles.find((bottle) => bottle.id === leakBottle.leakTargetBottleId)
    : undefined;
  const reserved = new Map<number, Bottle>();

  if (leakBottle && leakTarget) {
    const rowSizes = getLayoutRows(bottles.length);
    const targetRowSize = rowSizes[1] ?? 0;
    const alignedColumns = Math.max(1, Math.min(rowSizes[0], targetRowSize));
    const sourceColumn = Math.floor(random() * alignedColumns);
    reserved.set(sourceColumn, leakBottle);
    reserved.set(rowSizes[0] + sourceColumn, leakTarget);
  }

  let bestLayout = bottles;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const remaining = shuffle(
      bottles.filter((bottle) => bottle !== leakBottle && bottle !== leakTarget),
      random,
    );
    let nextRemaining = 0;
    const candidate = Array.from({ length: bottles.length }, (_, index) => {
      const fixedBottle = reserved.get(index);
      return fixedBottle ?? remaining[nextRemaining++];
    });
    const score = scoreBottleLayout(candidate);
    if (score < bestScore) {
      bestLayout = candidate;
      bestScore = score;
      if (score === 0) break;
    }
  }

  return bestLayout;
};

interface LeakPairConfig {
  leakLayers: string[];
  targetLayers: string[];
}

const createLeakBottlePair = (id: number, colors: string[], random: () => number): LeakPairConfig => {
  const availableColors = shuffle([...colors], random);
  const c1 = availableColors[0];
  const c2 = availableColors[1] ?? availableColors[0];
  const c3 = availableColors[2] ?? availableColors[0];

  if (id <= 60) {
    return {
      leakLayers: [c1, c1, c1],
      targetLayers: [c1],
    };
  } else if (id <= 75) {
    const variant = Math.floor(random() * 2);
    if (variant === 0) {
      return {
        leakLayers: [c1, c1, c2],
        targetLayers: [c1],
      };
    } else {
      return {
        leakLayers: [c1, c2],
        targetLayers: [c2, c1],
      };
    }
  } else {
    const variant = Math.floor(random() * 3);
    if (variant === 0) {
      return {
        leakLayers: [c1, c2, c3],
        targetLayers: [c1],
      };
    } else if (variant === 1) {
      return {
        leakLayers: [c1, c2],
        targetLayers: [c3, c1],
      };
    } else {
      return {
        leakLayers: [c1],
        targetLayers: [c2, c3, c1],
      };
    }
  }
};

const mixColorPool = (
  pool: string[],
  bottleCount: number,
  minimumTransitions: number,
  seed: number,
  minimumMaskCandidates: number,
  colors: string[],
): string[][] => {
  const hasEnoughMaskCandidates = (layers: string[][]) => minimumMaskCandidates === 0 || colors.some((color) =>
    layers.filter((bottleLayers) => !bottleLayers.includes(color)).length >= minimumMaskCandidates,
  );

  let bestLayers: string[][] | null = null;
  let bestTransitions = -1;

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const random = createSeededRandom(seed + Math.imul(attempt + 1, 0x9e3779b1));
    const shuffled = shuffle([...pool], random);
    const layers = Array.from({ length: bottleCount }, (_, i) =>
      shuffled.slice(i * CAPACITY, (i + 1) * CAPACITY),
    );
    const hasSolvedBottle = layers.some((b) => b.every((c) => c === b[0]));
    const transitions = layers.reduce((total, b) => {
      for (let i = 1; i < b.length; i += 1) {
        if (b[i] !== b[i - 1]) total += 1;
      }
      return total;
    }, 0);

    if (!hasSolvedBottle) {
      if (transitions > bestTransitions) {
        bestTransitions = transitions;
        bestLayers = layers;
      }
      if (transitions >= minimumTransitions && hasEnoughMaskCandidates(layers)) {
        return layers;
      }
    }
  }

  return bestLayers ?? Array.from({ length: bottleCount }, (_, i) => pool.slice(i * CAPACITY, (i + 1) * CAPACITY));
};

const ZERO_EMPTY_LEVEL_IDS = new Set([6, 12, 18, 25, 34, 44, 54, 64, 74, 84, 94]);

const getProfile = (id: number) => {
  const colorCount = Math.min(10, 4 + Math.floor((id - 1) / 10));
  const videoEmptyBottleCount = id < 21 ? 1 : id < 81 ? 2 : 3;
  const maskedBottleCount = id < 6 ? 0 : id < 21 ? 1 : id < 41 ? 2 : id < 61 ? 2 : id < 81 ? 3 : 3;
  const hiddenBottleCount = id < 16 ? 0 : id < 36 ? 1 : id < 56 ? 1 : id < 81 ? 2 : 2;
  const bottomLeakBottleCount = id >= 51 ? 1 : 0;
  const videoShoppingBagCount = id === 1 ? 0 : 1;
  const difficulty: Difficulty = id <= 10 ? "easy" : id <= 30 ? "medium" : id <= 60 ? "hard" : "master";
  const levelInChapter = ((id - 1) % 10) + 1;
  const chapterLength = id <= 60 ? 10 : 40;
  const chapterProgress = id <= 60 ? levelInChapter : id - 60;

  // 免费空瓶精益供给策略：
  // 1. Level 1 作为七瓶启程教学关保留 2 个空瓶；
  // 2. 含漏水瓶关卡必须保证上下两行宽度相等，优先给 0 个（技巧倒水）或 1 个满足正对；
  // 3. ZERO_EMPTY_LEVEL_IDS：0 个空瓶（靠不满瓶或接口瓶自身空余槽位互相倒腾）；
  // 4. 其余绝大多数关卡严格遵循“能给 1 个过去的绝不给 2 个”，只给 1 个免费空瓶！
  let freeEmptyBottleCount: number;
  if (id === 1) {
    freeEmptyBottleCount = 2;
  } else if (bottomLeakBottleCount > 0) {
    const baseCount = colorCount + 1 + videoEmptyBottleCount;
    const isRowAligned = (total: number) => {
      const rows = getLayoutRows(total);
      return rows.length >= 2 && rows[0] === rows[1];
    };
    if (isRowAligned(baseCount + 0) && (id % 4 === 0 || ZERO_EMPTY_LEVEL_IDS.has(id))) {
      freeEmptyBottleCount = 0;
    } else if (isRowAligned(baseCount + 1)) {
      freeEmptyBottleCount = 1;
    } else if (isRowAligned(baseCount + 0)) {
      freeEmptyBottleCount = 0;
    } else {
      freeEmptyBottleCount = 2;
    }
  } else {
    freeEmptyBottleCount = ZERO_EMPTY_LEVEL_IDS.has(id) ? 0 : 1;
  }

  const hasPartialBottles = ZERO_EMPTY_LEVEL_IDS.has(id) && bottomLeakBottleCount === 0;

  return {
    colorCount,
    freeEmptyBottleCount,
    hasPartialBottles,
    videoEmptyBottleCount,
    maskedBottleCount,
    hiddenBottleCount,
    bottomLeakBottleCount,
    videoShoppingBagCount,
    difficulty,
    chapterProgress,
    chapterLength,
  };
};

const makeFullBottle = (id: string, layers: string[], type: Bottle["type"], specialIndex: number): Bottle => {
  if (type === "masked") {
    return {
      id,
      type,
      capacity: CAPACITY,
      layers,
      maskRevealed: false,
      unlockTargetCompletedBottles: specialIndex,
      countsTowardObjective: true,
    };
  }
  if (type === "hidden") {
    return { id, type, capacity: CAPACITY, layers, hiddenBottomLayers: specialIndex % 2 === 0 ? 1 : 2 };
  }
  return { id, type: "normal", capacity: CAPACITY, layers };
};

const getDifficultyScore = (audit: Omit<LevelDesignAudit, "difficultyScore">, levelId: number) =>
  audit.colorCount * 120 +
  audit.layerTransitions * 3 +
  audit.maskedBottleCount * 18 +
  audit.hiddenBottleCount * 20 +
  audit.bottomLeakBottleCount * 24 +
  audit.queuedShoppingColors * 2 -
  audit.freeEmptyBottleCount * 10 -
  audit.videoEmptyBottleCount * 4 -
  audit.videoShoppingBagCount * 2 +
  levelId * 5;

const buildLevel = (
  id: number,
  previousTransitionsByColorCount: Map<number, number>,
  previousDifficultyScore: { value: number },
): Level => {
  const profile = getProfile(id);
  const colors = COLOR_KEYS.slice(0, profile.colorCount);
  const hasBottomLeak = profile.bottomLeakBottleCount > 0;
  const random = createSeededRandom(0x6c8e9cf5 + Math.imul(id, 0x27d4eb2d));

  let leakConfig: LeakPairConfig | null = null;
  let remainingPool: string[];
  let normalBottleCount: number;

  if (hasBottomLeak) {
    leakConfig = createLeakBottlePair(id, colors, random);
    const pool = colors.flatMap((color) => Array(CAPACITY).fill(color));
    const used = [...leakConfig.leakLayers, ...leakConfig.targetLayers];
    for (const color of used) {
      const idx = pool.indexOf(color);
      if (idx !== -1) pool.splice(idx, 1);
    }
    remainingPool = pool;
    normalBottleCount = profile.colorCount - 1;
  } else {
    remainingPool = colors.flatMap((color) => Array(CAPACITY).fill(color));
    normalBottleCount = profile.colorCount;
  }

  const maxLayerTransitions = normalBottleCount * (CAPACITY - 1);
  const requestedTransitions = Math.ceil(
    maxLayerTransitions * (profile.chapterProgress / profile.chapterLength),
  );
  const minimumTransitions = Math.min(
    maxLayerTransitions,
    Math.max(previousTransitionsByColorCount.get(profile.colorCount) ?? 0, requestedTransitions),
  );

  const seed = (0x1f123bb5 + Math.imul(id, 0x45d9f3b)) >>> 0;
  const rawLayerSets = mixColorPool(
    remainingPool,
    normalBottleCount,
    minimumTransitions,
    seed,
    profile.maskedBottleCount,
    colors,
  );

  let layerSets: string[][];
  if (profile.hasPartialBottles && rawLayerSets.length >= 2) {
    const lastBottleLayers = rawLayerSets[rawLayerSets.length - 1];
    const partial1 = lastBottleLayers.slice(0, 2);
    const partial2 = lastBottleLayers.slice(2, 4);
    layerSets = [...rawLayerSets.slice(0, -1), partial1, partial2];
  } else {
    layerSets = rawLayerSets;
  }

  const layerTransitions = layerSets.reduce((total, layers) => {
    for (let index = 1; index < layers.length; index += 1) {
      if (layers[index] !== layers[index - 1]) total += 1;
    }
    return total;
  }, 0);
  previousTransitionsByColorCount.set(profile.colorCount, layerTransitions);

  const maskCandidates = colors
    .map((color) => layerSets.flatMap((layers, index) => layers.includes(color) ? [] : [index]))
    .filter((indices) => indices.length >= profile.maskedBottleCount)
    .sort((left, right) => right.length - left.length)[0] ?? [];
  const maskedBottleIndices = new Set(shuffle(maskCandidates, random).slice(0, profile.maskedBottleCount));
  const specialTypes: Bottle["type"][] = Array.from({ length: layerSets.length }, (_, index) =>
    maskedBottleIndices.has(index) ? "masked" : "normal",
  );
  const hiddenBottleIndices = shuffle(
    specialTypes.flatMap((type, index) => type === "normal" ? [index] : []),
    random,
  ).slice(0, profile.hiddenBottleCount);
  for (const index of hiddenBottleIndices) specialTypes[index] = "hidden";
  const maskedUnlockThreshold = 1;
  const coloredBottles = layerSets.map((layers, index) =>
    makeFullBottle(
      `b${index + 1}`,
      layers,
      specialTypes[index] ?? "normal",
      specialTypes[index] === "masked" ? maskedUnlockThreshold : index,
    ),
  );

  let bottles: Bottle[];
  if (hasBottomLeak && leakConfig) {
    const totalBottleCount = profile.colorCount + 1 + profile.freeEmptyBottleCount + profile.videoEmptyBottleCount;
    const leakTargetIndex = getLayoutRows(totalBottleCount)[0];
    const targetId = `b${leakTargetIndex + 1}`;
    const leakBottle: Bottle = {
      id: "b1",
      type: "bottom_leak",
      capacity: CAPACITY,
      layers: leakConfig.leakLayers,
      leakTargetBottleId: targetId,
    };
    const leakTarget: Bottle = {
      id: targetId,
      type: "normal",
      capacity: CAPACITY,
      layers: leakConfig.targetLayers,
      leakSourceBottleId: "b1",
    };
    bottles = [leakBottle];
    let nextColoredIndex = 0;
    while (bottles.length < leakTargetIndex) {
      const bottle = coloredBottles[nextColoredIndex++];
      bottles.push({ ...bottle, id: `b${bottles.length + 1}` });
    }
    bottles.push(leakTarget);
    while (nextColoredIndex < coloredBottles.length) {
      const bottle = coloredBottles[nextColoredIndex++];
      bottles.push({ ...bottle, id: `b${bottles.length + 1}` });
    }
  } else {
    bottles = coloredBottles;
  }

  for (let index = 0; index < profile.freeEmptyBottleCount; index += 1) {
    bottles.push({ id: `b${bottles.length + 1}`, type: "empty", capacity: CAPACITY, layers: [] });
  }
  for (let index = 0; index < profile.videoEmptyBottleCount; index += 1) {
    bottles.push({ id: `b${bottles.length + 1}`, type: "video_empty", capacity: CAPACITY, layers: [], locked: true });
  }
  bottles = shuffleBottleLayout(bottles, random);

  const visibleColors = new Set<string>();
  for (const bottle of bottles) {
    const firstVisibleLayer = bottle.type === "hidden" ? Math.min(bottle.layers.length, bottle.hiddenBottomLayers ?? 0) : 0;
    bottle.layers.slice(firstVisibleLayer).forEach((color) => visibleColors.add(color));
  }

  const auditWithoutScore: Omit<LevelDesignAudit, "difficultyScore"> = {
    bottleCount: bottles.length,
    fullColorBottleCount: bottles.filter((bottle) => bottle.layers.length === CAPACITY).length,
    partialBottleCount: bottles.filter((bottle) => bottle.layers.length > 0 && bottle.layers.length < CAPACITY).length,
    freeEmptyBottleCount: bottles.filter((bottle) => bottle.type === "empty").length,
    videoEmptyBottleCount: bottles.filter((bottle) => bottle.type === "video_empty").length,
    colorCount: new Set(bottles.flatMap((bottle) => bottle.layers)).size,
    visibleColorCount: visibleColors.size,
    freeShoppingBagCount: FREE_SHOPPING_BAGS,
    videoShoppingBagCount: profile.videoShoppingBagCount,
    queuedShoppingColors: Math.max(0, visibleColors.size - FREE_SHOPPING_BAGS),
    maskedBottleCount: bottles.filter((bottle) => bottle.type === "masked").length,
    hiddenBottleCount: bottles.filter((bottle) => bottle.type === "hidden").length,
    bottomLeakBottleCount: bottles.filter((bottle) => bottle.type === "bottom_leak").length,
    layerTransitions: countLayerTransitions(bottles),
  };
  const rawScore = getDifficultyScore(auditWithoutScore, id);
  const difficultyScore = Math.max(previousDifficultyScore.value, rawScore);
  previousDifficultyScore.value = difficultyScore;

  const designAudit: LevelDesignAudit = {
    ...auditWithoutScore,
    difficultyScore,
  };

  return {
    id,
    title: id === 1 ? "七瓶启程" : `第 ${Math.ceil(id / 10)} 章 · 色彩整理 ${String(id).padStart(2, "0")}`,
    difficulty: profile.difficulty,
    bottles,
    designAudit,
  };
};

const previousTransitionsByColorCount = new Map<number, number>();
const previousDifficultyScore = { value: 0 };
const generatedLevels = Array.from({ length: LEVEL_COUNT }, (_, index) =>
  buildLevel(index + 1, previousTransitionsByColorCount, previousDifficultyScore),
);

const introLayers = [
  ["red", "red", "blue", "blue"],
  ["blue", "blue", "green", "green"],
  ["green", "green", "yellow", "yellow"],
  ["yellow", "yellow", "red", "red"],
];
const firstLevelBottles: Bottle[] = [
  ...introLayers.map((layers, index) => ({ id: `b${index + 1}`, type: "normal" as const, capacity: CAPACITY, layers })),
  { id: "b5", type: "empty", capacity: CAPACITY, layers: [] },
  { id: "b6", type: "empty", capacity: CAPACITY, layers: [] },
  { id: "b7", type: "video_empty", capacity: CAPACITY, layers: [], locked: true },
];
const arrangedFirstLevelBottles = shuffleBottleLayout(
  firstLevelBottles,
  createSeededRandom(0x17a4c3d9),
);
const firstLevelAuditWithoutScore: Omit<LevelDesignAudit, "difficultyScore"> = {
  bottleCount: arrangedFirstLevelBottles.length,
  fullColorBottleCount: 4,
  partialBottleCount: 0,
  freeEmptyBottleCount: 2,
  videoEmptyBottleCount: 1,
  colorCount: 4,
  visibleColorCount: 4,
  freeShoppingBagCount: FREE_SHOPPING_BAGS,
  videoShoppingBagCount: 0,
  queuedShoppingColors: 1,
  maskedBottleCount: 0,
  hiddenBottleCount: 0,
  bottomLeakBottleCount: 0,
  layerTransitions: countLayerTransitions(arrangedFirstLevelBottles),
};
const firstLevel: Level = {
  id: 1,
  title: "七瓶启程",
  difficulty: "easy",
  optimalSteps: 5,
  bottles: arrangedFirstLevelBottles,
  designAudit: {
    ...firstLevelAuditWithoutScore,
    difficultyScore: getDifficultyScore(firstLevelAuditWithoutScore, 1),
  },
};

generatedLevels[0] = firstLevel;
export const CURATED_LEVELS: Level[] = generatedLevels;
