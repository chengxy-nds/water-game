import { CURATED_LEVELS } from '../src/data/curatedLevels';
import { solveWaterSort, evaluateDifficulty, TUBE_CAPACITY } from '../src/solver/waterSortSolver';

const results: {
  id: number;
  title: string;
  colors: number;
  ok: boolean;
  solvable: boolean;
  steps: number;
  visited: number;
  timeMs: number;
  reason?: string;
  balanceErrors: string[];
}[] = [];

const difficultyRank: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

let previousDifficultyRank = -1;
let previousMechanicCount = -1;
for (const level of CURATED_LEVELS) {
  const bottles = level.bottles;
  const balanceErrors: string[] = [];

  const mechanicCount = bottles.filter((b) => b.type === 'masked' || b.type === 'hidden' || b.type === 'bottom_leak').length;
  const currentDifficultyRank = difficultyRank[level.difficulty] ?? -1;
  if (currentDifficultyRank < previousDifficultyRank || mechanicCount < previousMechanicCount) {
    throw new Error(
      `Level progression violation: #${level.id} (${level.title}) has difficulty ${level.difficulty} and ${mechanicCount} special bottles, but previous level was already harder.`
    );
  }
  previousDifficultyRank = currentDifficultyRank;
  previousMechanicCount = mechanicCount;

  // 1. bottom_leak target integrity check
  for (const b of bottles) {
    if (b.type === 'bottom_leak') {
      if (!b.leakTargetBottleId) {
        balanceErrors.push(`${b.id} is a bottom_leak bottle but has no leakTargetBottleId`);
        continue;
      }
      const target = bottles.find((other) => other.id === b.leakTargetBottleId);
      if (!target) {
        balanceErrors.push(`${b.id} points to missing target bottle ${b.leakTargetBottleId}`);
      } else if (target.id === b.id) {
        balanceErrors.push(`${b.id} cannot leak into itself`);
      }
    }
  }

  // 2. capacity check
  for (const b of bottles) {
    if (b.layers.length > b.capacity) {
      balanceErrors.push(`${b.id} has ${b.layers.length} layers > capacity ${b.capacity}`);
    }
  }

  // 3. color balance (each color exactly TUBE_CAPACITY)
  const colorCounts: Record<string, number> = {};
  for (const b of bottles) {
    for (const c of b.layers) colorCounts[c] = (colorCounts[c] || 0) + 1;
  }
  for (const [c, n] of Object.entries(colorCounts)) {
    if (n !== TUBE_CAPACITY) balanceErrors.push(`color ${c} count=${n} (expected ${TUBE_CAPACITY})`);
  }

  // 3. solve
  const solved = solveWaterSort(bottles, TUBE_CAPACITY, 500000);

  results.push({
    id: level.id as number,
    title: level.title,
    colors: Object.keys(colorCounts).length,
    ok: balanceErrors.length === 0,
    solvable: solved.solvable,
    steps: solved.optimalSteps,
    visited: solved.visitedNodes,
    timeMs: solved.timeMs,
    reason: solved.reason,
    balanceErrors,
  });
}

let anyFail = false;
for (const r of results) {
  const diff = r.solvable ? evaluateDifficulty(r.steps, r.visited).label : 'N/A';
  const status = !r.ok ? 'BALANCE-ERR' : r.solvable ? 'SOLVED' : 'UNSOLVED';
  if (status !== 'SOLVED' || !r.ok) anyFail = true;
  console.log(
    `#${String(r.id).padStart(2)} [${status}] ${r.title.padEnd(14)} colors=${r.colors} steps=${r.steps} visited=${r.visited} (${r.timeMs.toFixed(0)}ms) diff=${diff}`
  );
  if (r.balanceErrors.length) {
    for (const e of r.balanceErrors) console.log(`        !! ${e}`);
  }
  if (!r.solvable && r.reason) console.log(`        reason: ${r.reason}`);
}

console.log('\n---');
console.log(`Total levels: ${results.length}`);
console.log(`Balance errors: ${results.filter((r) => !r.ok).length}`);
console.log(`Unsolved: ${results.filter((r) => !r.solvable).length}`);
console.log(anyFail ? '*** FAILURES PRESENT ***' : 'ALL LEVELS VALID & SOLVABLE');
