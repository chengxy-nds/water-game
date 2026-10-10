import { Bottle, Level, Difficulty } from '../types/game';
import { solveWaterSort, TUBE_CAPACITY } from '../solver/waterSortSolver';
import { COLOR_KEYS } from '../utils/colors';

// Seeded PRNG for Daily Challenges and repeatable generation
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function makeBottle(id: string, type: Bottle['type'], layers: string[]): Bottle {
  return { id, type, capacity: TUBE_CAPACITY, layers };
}

/**
 * Generates a valid, verified solvable water sort level with exact optimal steps
 */
export function generateSolvableLevel(options: {
  numColors: number;
  emptyTubes?: number;
  minSteps?: number;
  maxSteps?: number;
  maxAttempts?: number;
  rng?: () => number;
}): { level: Level; optimalSteps: number; visitedNodes: number } | null {
  const {
    numColors,
    emptyTubes = 2,
    minSteps = 8,
    maxSteps = 40,
    maxAttempts = 50,
    rng = Math.random,
  } = options;

  const availableColors = [...COLOR_KEYS].slice(0, Math.min(numColors, COLOR_KEYS.length));
  if (availableColors.length < 2) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Prepare color pool: each color appears exactly TUBE_CAPACITY times
    const pool: string[] = [];
    for (const color of availableColors) {
      for (let i = 0; i < TUBE_CAPACITY; i++) {
        pool.push(color);
      }
    }

    // 2. Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // 3. Fill bottles
    const bottles: Bottle[] = [];
    let poolIdx = 0;
    for (let i = 0; i < numColors; i++) {
      const layers: string[] = [];
      for (let j = 0; j < TUBE_CAPACITY; j++) {
        layers.push(pool[poolIdx++]);
      }
      bottles.push(makeBottle(`b${i + 1}`, 'normal', layers));
    }

    // 4. Add empty bottles
    for (let i = 0; i < emptyTubes; i++) {
      bottles.push(makeBottle(`b${numColors + i + 1}`, 'empty', []));
    }

    // 5. Check with Solver
    const solverResult = solveWaterSort(bottles, TUBE_CAPACITY, 25000);

    if (
      solverResult.solvable &&
      solverResult.optimalSteps >= minSteps &&
      solverResult.optimalSteps <= maxSteps
    ) {
      let diff: Difficulty = 'easy';
      if (solverResult.optimalSteps > 28) diff = 'master';
      else if (solverResult.optimalSteps > 18) diff = 'hard';
      else if (solverResult.optimalSteps > 11) diff = 'medium';

      return {
        level: {
          id: `gen-${Date.now()}-${attempt}`,
          title: `随机关卡 (${numColors}色)`,
          difficulty: diff,
          bottles,
          optimalSteps: solverResult.optimalSteps,
          description: `最优解 ${solverResult.optimalSteps} 步 · 经过 Solver 演算验证`,
          isCustom: true,
        },
        optimalSteps: solverResult.optimalSteps,
        visitedNodes: solverResult.visitedNodes,
      };
    }
  }

  // Fallback: If random distribution failed within maxAttempts, generate via reverse scramble
  return generateReverseScrambledLevel(numColors, emptyTubes, minSteps, rng);
}

/**
 * Reverse-moves scramble: starts fully solved and applies valid reverse pour actions
 */
export function generateReverseScrambledLevel(
  numColors: number,
  emptyTubes: number = 2,
  scrambleMoves: number = 20,
  rng: () => number = Math.random
): { level: Level; optimalSteps: number; visitedNodes: number } | null {
  const availableColors = [...COLOR_KEYS].slice(0, Math.min(numColors, COLOR_KEYS.length));
  const bottles: Bottle[] = [];

  // Start with solved state
  for (let i = 0; i < availableColors.length; i++) {
    const color = availableColors[i];
    bottles.push(makeBottle(`b${i + 1}`, 'normal', [color, color, color, color]));
  }
  for (let i = 0; i < emptyTubes; i++) {
    bottles.push(makeBottle(`b${availableColors.length + i + 1}`, 'empty', []));
  }

  // Apply reverse moves
  for (let step = 0; step < scrambleMoves * 3; step++) {
    const nonFullBottles = bottles.map((_, idx) => idx).filter((idx) => bottles[idx].layers.length < TUBE_CAPACITY);
    const nonEmptyBottles = bottles.map((_, idx) => idx).filter((idx) => bottles[idx].layers.length > 0);

    if (nonEmptyBottles.length === 0 || nonFullBottles.length === 0) continue;

    const fromIdx = nonEmptyBottles[Math.floor(rng() * nonEmptyBottles.length)];
    const toIdx = nonFullBottles[Math.floor(rng() * nonFullBottles.length)];
    if (fromIdx === toIdx) continue;

    const elem = bottles[fromIdx].layers.pop()!;
    bottles[toIdx].layers.push(elem);
  }

  const solverResult = solveWaterSort(bottles, TUBE_CAPACITY, 30000);
  if (solverResult.solvable && solverResult.optimalSteps >= 5) {
    let diff: Difficulty = 'easy';
    if (solverResult.optimalSteps > 25) diff = 'master';
    else if (solverResult.optimalSteps > 16) diff = 'hard';
    else if (solverResult.optimalSteps > 10) diff = 'medium';

    return {
      level: {
        id: `scramble-${Date.now()}`,
        title: `生成挑战 (${numColors}色)`,
        difficulty: diff,
        bottles,
        optimalSteps: solverResult.optimalSteps,
        description: `最优解 ${solverResult.optimalSteps} 步`,
        isCustom: true,
      },
      optimalSteps: solverResult.optimalSteps,
      visitedNodes: solverResult.visitedNodes,
    };
  }

  return null;
}

/**
 * Generates Daily Challenge seeded by current date
 */
export function getDailyChallenge(dateString: string): Level {
  const seed = hashString(`daily-water-sort-${dateString}`);
  const rng = createPRNG(seed);

  // Daily challenge parameters: 6-8 colors, moderate to high difficulty
  const numColors = 6 + Math.floor(rng() * 3); // 6, 7 or 8 colors
  const generated = generateSolvableLevel({
    numColors,
    emptyTubes: 2,
    minSteps: 15,
    maxSteps: 36,
    maxAttempts: 60,
    rng,
  });

  if (generated) {
    return {
      ...generated.level,
      id: `daily-${dateString}`,
      title: `今日谜题 · ${dateString}`,
      description: `全球同题每日倒水挑战 · 最优解 ${generated.optimalSteps} 步`,
      optimalSteps: generated.optimalSteps,
    };
  }

  // Curated fallback for daily if PRNG edge case
  const fallbackBottles: Bottle[] = [
    makeBottle('b1', 'normal', ['red', 'blue', 'emerald', 'amber']),
    makeBottle('b2', 'normal', ['amber', 'emerald', 'blue', 'red']),
    makeBottle('b3', 'normal', ['blue', 'red', 'amber', 'emerald']),
    makeBottle('b4', 'normal', ['emerald', 'amber', 'red', 'blue']),
    makeBottle('b5', 'normal', ['purple', 'pink', 'purple', 'pink']),
    makeBottle('b6', 'normal', ['pink', 'purple', 'pink', 'purple']),
    makeBottle('b7', 'empty', []),
    makeBottle('b8', 'empty', []),
  ];
  return {
    id: `daily-${dateString}`,
    title: `今日谜题 · ${dateString}`,
    difficulty: 'hard',
    bottles: fallbackBottles,
    optimalSteps: 18,
    description: `全球同题每日倒水挑战`,
  };
}
