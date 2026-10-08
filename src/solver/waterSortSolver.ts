import { Tube, Move, SolverResult } from '../types/game';

export const TUBE_CAPACITY = 4;

/**
 * Checks if a tube is completely solved (full and monochromatic)
 */
export function isTubeComplete(tube: Tube, capacity: number = TUBE_CAPACITY): boolean {
  if (tube.length !== capacity) return false;
  const first = tube[0];
  return tube.every((c) => c === first);
}

/**
 * Checks if a tube is monochromatic (all elements present have the same color)
 */
export function isTubeMonochromatic(tube: Tube): boolean {
  if (tube.length === 0) return true;
  const first = tube[0];
  return tube.every((c) => c === first);
}

/**
 * Checks if the whole puzzle is currently solved according to Game Design Document (Section 13 & 14):
 * 1. Every non-empty tube contains only ONE color (monochromatic, no mixed colors).
 * 2. All units of each distinct color are unified (not split across different tubes).
 * 3. (Section 14: Special case where single color is not completely full is allowed if all colors are separated).
 */
export function isPuzzleSolved(tubes: Tube[], capacity: number = TUBE_CAPACITY): boolean {
  // If every non-empty tube is completely full and monochromatic, it's definitely solved
  const allFullSolved = tubes.every((tube) => tube.length === 0 || isTubeComplete(tube, capacity));
  if (allFullSolved) return true;

  // General rule (Section 13 & 14):
  // 1. No tube can have mixed colors
  for (const tube of tubes) {
    if (tube.length > 0 && !isTubeMonochromatic(tube)) {
      return false;
    }
  }

  // 2. No color can be scattered across more than one tube (all units of color X are in a single tube)
  const seenColors = new Set<string>();
  for (const tube of tubes) {
    if (tube.length > 0) {
      const color = tube[0];
      if (seenColors.has(color)) {
        // Color is scattered across multiple tubes, not solved yet
        return false;
      }
      seenColors.add(color);
    }
  }

  return seenColors.size > 0;
}

/**
 * Calculates top contiguous color and its count in a tube
 */
export function getTopColorInfo(tube: Tube): { color: string | null; count: number } {
  if (tube.length === 0) return { color: null, count: 0 };
  const color = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === color) {
      count++;
    } else {
      break;
    }
  }
  return { color, count };
}

/**
 * Checks if a move from tube `fromIdx` to `toIdx` is valid
 */
export function canPour(
  fromTube: Tube,
  toTube: Tube,
  capacity: number = TUBE_CAPACITY
): { valid: boolean; count: number; color: string | null } {
  if (fromTube.length === 0) return { valid: false, count: 0, color: null };
  if (toTube.length >= capacity) return { valid: false, count: 0, color: null };

  const { color: fromColor, count: fromCount } = getTopColorInfo(fromTube);
  if (!fromColor) return { valid: false, count: 0, color: null };

  // If destination is not empty, top colors must match
  if (toTube.length > 0) {
    const toTopColor = toTube[toTube.length - 1];
    if (toTopColor !== fromColor) {
      return { valid: false, count: 0, color: null };
    }
  }

  const spaceAvailable = capacity - toTube.length;
  const countToPour = Math.min(fromCount, spaceAvailable);

  return { valid: countToPour > 0, count: countToPour, color: fromColor };
}

/**
 * Checks if there exists ANY legal pour move in the current puzzle state.
 * Returns true if at least one valid A -> B move exists.
 * Used for Section 15 & 16: Deadlock (死局) detection.
 */
export function hasAnyLegalMove(tubes: Tube[], capacity: number = TUBE_CAPACITY): boolean {
  const numTubes = tubes.length;
  for (let from = 0; from < numTubes; from++) {
    const fromTube = tubes[from];
    if (fromTube.length === 0) continue;
    // If fromTube is already complete and full, we skip it
    if (isTubeComplete(fromTube, capacity)) continue;

    for (let to = 0; to < numTubes; to++) {
      if (from === to) continue;
      const check = canPour(fromTube, tubes[to], capacity);
      if (check.valid) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Executes a pour move, returning new tubes array
 */
export function executePour(
  tubes: Tube[],
  fromIdx: number,
  toIdx: number,
  capacity: number = TUBE_CAPACITY
): { newTubes: Tube[]; count: number; color: string } | null {
  const check = canPour(tubes[fromIdx], tubes[toIdx], capacity);
  if (!check.valid || !check.color) return null;

  const newTubes = tubes.map((t) => [...t]);
  const pouredUnits: string[] = [];
  for (let i = 0; i < check.count; i++) {
    pouredUnits.push(newTubes[fromIdx].pop()!);
  }
  for (let i = 0; i < check.count; i++) {
    newTubes[toIdx].push(check.color);
  }

  return { newTubes, count: check.count, color: check.color };
}

/**
 * Canonical state representation to prune equivalent permutations.
 * Tubes are sorted so order of tubes doesn't create duplicate states.
 */
function getCanonicalKey(tubes: Tube[]): string {
  const signatures = tubes.map((t) => t.join(','));
  signatures.sort();
  return signatures.join('|');
}

/**
 * BFS Solver for Water Sort Puzzle.
 * Guarantees finding the minimal step solution if one exists.
 */
export function solveWaterSort(
  initialTubes: Tube[],
  capacity: number = TUBE_CAPACITY,
  maxIterations: number = 60000
): SolverResult {
  const startTime = performance.now();

  // Validate basic state
  if (isPuzzleSolved(initialTubes, capacity)) {
    return {
      solvable: true,
      optimalSteps: 0,
      moves: [],
      visitedNodes: 1,
      timeMs: performance.now() - startTime,
    };
  }

  // Pre-check color balance: each color count must typically be equal to capacity
  const colorCounts: Record<string, number> = {};
  for (const tube of initialTubes) {
    for (const color of tube) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  for (const [c, count] of Object.entries(colorCounts)) {
    if (count % capacity !== 0) {
      return {
        solvable: false,
        optimalSteps: 0,
        moves: [],
        visitedNodes: 0,
        timeMs: performance.now() - startTime,
        reason: `颜色 [${c}] 总格数 (${count}) 不是容量 (${capacity}) 的倍数，无法完全归位！`,
      };
    }
  }

  interface QueueNode {
    tubes: Tube[];
    moves: Move[];
  }

  const queue: QueueNode[] = [{ tubes: initialTubes, moves: [] }];
  const visited = new Set<string>();
  visited.add(getCanonicalKey(initialTubes));

  let iterations = 0;

  while (queue.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      return {
        solvable: false,
        optimalSteps: 0,
        moves: [],
        visitedNodes: iterations,
        timeMs: performance.now() - startTime,
        reason: `已搜索超过 ${maxIterations} 个分支节点，搜索深度超限。`,
      };
    }

    const { tubes, moves } = queue.shift()!;

    // Check if goal reached
    if (isPuzzleSolved(tubes, capacity)) {
      return {
        solvable: true,
        optimalSteps: moves.length,
        moves,
        visitedNodes: iterations,
        timeMs: performance.now() - startTime,
      };
    }

    const numTubes = tubes.length;
    let firstEmptyIdx = -1;
    for (let i = 0; i < numTubes; i++) {
      if (tubes[i].length === 0) {
        firstEmptyIdx = i;
        break;
      }
    }

    // Generate valid moves
    for (let from = 0; from < numTubes; from++) {
      const fromTube = tubes[from];
      if (fromTube.length === 0) continue;

      // Don't pour from an already complete tube
      if (isTubeComplete(fromTube, capacity)) continue;

      const { color: fromColor, count: fromCount } = getTopColorInfo(fromTube);
      if (!fromColor) continue;

      // Check if fromTube is monochromatic
      const fromIsMono = isTubeMonochromatic(fromTube);

      let pouredToEmpty = false;

      for (let to = 0; to < numTubes; to++) {
        if (from === to) continue;
        const toTube = tubes[to];

        if (toTube.length >= capacity) continue;

        // Symmetry prune for empty destination tubes:
        // Pouring into any empty tube is functionally equivalent.
        // Also: NEVER pour from a monochromatic tube into an empty tube (useless move).
        if (toTube.length === 0) {
          if (fromIsMono) continue; // Pouring monochromatic partial tube to empty is redundant
          if (pouredToEmpty) continue; // Only try the first available empty tube
          if (to !== firstEmptyIdx && firstEmptyIdx !== -1) continue;
          pouredToEmpty = true;
        } else {
          // Dest is not empty: top colors must match
          if (toTube[toTube.length - 1] !== fromColor) continue;
        }

        // Avoid immediately undoing last move
        if (moves.length > 0) {
          const lastMove = moves[moves.length - 1];
          if (lastMove.from === to && lastMove.to === from) continue;
        }

        const space = capacity - toTube.length;
        const count = Math.min(fromCount, space);
        if (count === 0) continue;

        // Perform move
        const nextTubes = tubes.map((t) => [...t]);
        for (let k = 0; k < count; k++) {
          nextTubes[from].pop();
        }
        for (let k = 0; k < count; k++) {
          nextTubes[to].push(fromColor);
        }

        const key = getCanonicalKey(nextTubes);
        if (!visited.has(key)) {
          visited.add(key);
          const nextMoves = [...moves, { from, to, colorId: fromColor, count }];
          queue.push({ tubes: nextTubes, moves: nextMoves });
        }
      }
    }
  }

  return {
    solvable: false,
    optimalSteps: 0,
    moves: [],
    visitedNodes: iterations,
    timeMs: performance.now() - startTime,
    reason: '无解：所有可能操作均已穷举，无法完成分色。',
  };
}

/**
 * Evaluates level difficulty from step count and search complexity
 */
export function evaluateDifficulty(optimalSteps: number, visitedNodes: number): {
  stars: number;
  label: string;
  tagColor: string;
} {
  if (optimalSteps <= 10) {
    return { stars: 1, label: '简单', tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' };
  } else if (optimalSteps <= 18) {
    return { stars: 2, label: '普通', tagColor: 'text-sky-400 bg-sky-950/60 border-sky-500/30' };
  } else if (optimalSteps <= 28) {
    return { stars: 3, label: '困难', tagColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30' };
  } else if (optimalSteps <= 38) {
    return { stars: 4, label: '大师', tagColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30' };
  } else {
    return { stars: 5, label: '极限', tagColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30' };
  }
}
