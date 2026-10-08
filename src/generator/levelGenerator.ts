import { Tube, Level, Difficulty } from '../types/game';
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

    // 3. Fill tubes
    const tubes: Tube[] = [];
    let poolIdx = 0;
    for (let i = 0; i < numColors; i++) {
      const tube: Tube = [];
      for (let j = 0; j < TUBE_CAPACITY; j++) {
        tube.push(pool[poolIdx++]);
      }
      tubes.push(tube);
    }

    // 4. Add empty tubes
    for (let i = 0; i < emptyTubes; i++) {
      tubes.push([]);
    }

    // 5. Check with Solver
    const solverResult = solveWaterSort(tubes, TUBE_CAPACITY, 25000);

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
          tubes,
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
  const tubes: Tube[] = [];

  // Start with solved state
  for (const color of availableColors) {
    tubes.push([color, color, color, color]);
  }
  for (let i = 0; i < emptyTubes; i++) {
    tubes.push([]);
  }

  // Apply reverse moves
  for (let step = 0; step < scrambleMoves * 3; step++) {
    const nonFullTubes = tubes.map((t, idx) => idx).filter((idx) => tubes[idx].length < TUBE_CAPACITY);
    const nonEmptyTubes = tubes.map((t, idx) => idx).filter((idx) => tubes[idx].length > 0);

    if (nonEmptyTubes.length === 0 || nonFullTubes.length === 0) continue;

    const fromIdx = nonEmptyTubes[Math.floor(rng() * nonEmptyTubes.length)];
    const toIdx = nonFullTubes[Math.floor(rng() * nonFullTubes.length)];
    if (fromIdx === toIdx) continue;

    // Pop one element and push to toIdx
    const elem = tubes[fromIdx].pop()!;
    tubes[toIdx].push(elem);
  }

  const solverResult = solveWaterSort(tubes, TUBE_CAPACITY, 30000);
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
        tubes,
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
  const fallbackTubes: Tube[] = [
    ['red', 'blue', 'emerald', 'amber'],
    ['amber', 'emerald', 'blue', 'red'],
    ['blue', 'red', 'amber', 'emerald'],
    ['emerald', 'amber', 'red', 'blue'],
    ['purple', 'pink', 'purple', 'pink'],
    ['pink', 'purple', 'pink', 'purple'],
    [],
    [],
  ];
  return {
    id: `daily-${dateString}`,
    title: `今日谜题 · ${dateString}`,
    difficulty: 'hard',
    tubes: fallbackTubes,
    optimalSteps: 18,
    description: `全球同题每日倒水挑战`,
  };
}
