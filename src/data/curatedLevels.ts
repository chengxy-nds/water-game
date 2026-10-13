import { Bottle, Difficulty, Level, LevelDesignAudit } from "../types/game";
import { COLOR_KEYS } from "../utils/colors";

const CAPACITY = 4;
const LEVEL_COUNT = 100;
const FREE_EMPTY_BOTTLES = 2;
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

const mixColorLayers = (colors: string[], minimumTransitions: number, seed: number, minimumMaskCandidates: number) => {
  const maximumTransitions = colors.length * (CAPACITY - 1);

  const hasEnoughMaskCandidates = (layers: string[][]) => minimumMaskCandidates === 0 || colors.some((color) =>
    layers.filter((bottleLayers) => !bottleLayers.includes(color)).length >= minimumMaskCandidates,
  );

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const random = createSeededRandom(seed + Math.imul(attempt + 1, 0x9e3779b1));
    const colorPool = shuffle(colors.flatMap((color) => Array(CAPACITY).fill(color)), random);
    const layers = colors.map((_, bottleIndex) => colorPool.slice(bottleIndex * CAPACITY, (bottleIndex + 1) * CAPACITY));
    const hasSolvedBottle = layers.some((bottleLayers) => bottleLayers.every((color) => color === bottleLayers[0]));
    const transitions = layers.reduce((total, bottleLayers) => {
      for (let index = 1; index < bottleLayers.length; index += 1) {
        if (bottleLayers[index] !== bottleLayers[index - 1]) total += 1;
      }
      return total;
    }, 0);

    if (!hasSolvedBottle && transitions >= minimumTransitions && hasEnoughMaskCandidates(layers)) return layers;
  }

  const protectedColor = colors[0];
  const otherLayers = shuffle(
    colors.slice(1).flatMap((color) => Array(CAPACITY).fill(color)),
    createSeededRandom(seed ^ 0xa5a5a5a5),
  );
  const fallbackLayers = colors.map((_, bottleIndex) => {
    if (bottleIndex < 2) {
      return [protectedColor, protectedColor, ...otherLayers.slice(bottleIndex * 2, bottleIndex * 2 + 2)];
    }
    const start = 4 + (bottleIndex - 2) * CAPACITY;
    return otherLayers.slice(start, start + CAPACITY);
  });
  return fallbackLayers;
};

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

  return {
    colorCount,
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

const getLayerSets = (id: number, colors: string[], minimumTransitions: number, minimumMaskCandidates: number) => {
  const seed = (0x1f123bb5 + Math.imul(id, 0x45d9f3b)) >>> 0;
  return mixColorLayers(colors, minimumTransitions, seed, minimumMaskCandidates);
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

const buildLevel = (id: number, previousTransitionsByColorCount: Map<number, number>): Level => {
  const profile = getProfile(id);
  const colors = COLOR_KEYS.slice(0, profile.colorCount);
  const hasBottomLeak = profile.bottomLeakBottleCount > 0;
  const normalColors = hasBottomLeak ? colors.slice(1) : colors;
  const maxLayerTransitions = normalColors.length * (CAPACITY - 1);
  const requestedTransitions = Math.ceil(
    maxLayerTransitions * (profile.chapterProgress / profile.chapterLength),
  );
  const minimumTransitions = Math.min(
    maxLayerTransitions,
    Math.max(previousTransitionsByColorCount.get(profile.colorCount) ?? 0, requestedTransitions),
  );
  const layerSets = getLayerSets(id, normalColors, minimumTransitions, profile.maskedBottleCount);
  const layerTransitions = layerSets.reduce((total, layers) => {
    for (let index = 1; index < layers.length; index += 1) {
      if (layers[index] !== layers[index - 1]) total += 1;
    }
    return total;
  }, 0);
  previousTransitionsByColorCount.set(profile.colorCount, layerTransitions);

  const random = createSeededRandom(0x6c8e9cf5 + Math.imul(id, 0x27d4eb2d));
  const maskCandidates = normalColors
    .map((color) => layerSets.flatMap((layers, index) => layers.includes(color) ? [] : [index]))
    .filter((indices) => indices.length >= profile.maskedBottleCount)
    .sort((left, right) => right.length - left.length)[0] ?? [];
  const maskedBottleIndices = new Set(shuffle(maskCandidates, random).slice(0, profile.maskedBottleCount));
  const specialTypes = Array.from({ length: layerSets.length }, (_, index) =>
    maskedBottleIndices.has(index) ? "masked" as const : "normal" as const,
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
  if (hasBottomLeak) {
    const totalBottleCount = profile.colorCount + 1 + FREE_EMPTY_BOTTLES + profile.videoEmptyBottleCount;
    const leakTargetIndex = getLayoutRows(totalBottleCount)[0];
    const targetId = `b${leakTargetIndex + 1}`;
    const leakBottle: Bottle = {
      id: "b1",
      type: "bottom_leak",
      capacity: CAPACITY,
      layers: [colors[0], colors[0], colors[0]],
      leakTargetBottleId: targetId,
    };
    const leakTarget: Bottle = {
      id: targetId,
      type: "normal",
      capacity: CAPACITY,
      layers: [colors[0]],
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

  for (let index = 0; index < FREE_EMPTY_BOTTLES; index += 1) {
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
  const designAudit: LevelDesignAudit = {
    ...auditWithoutScore,
    difficultyScore: getDifficultyScore(auditWithoutScore, id),
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
const generatedLevels = Array.from({ length: LEVEL_COUNT }, (_, index) =>
  buildLevel(index + 1, previousTransitionsByColorCount),
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
