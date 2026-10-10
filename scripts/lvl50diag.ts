import { CURATED_LEVELS } from '../src/data/curatedLevels';
import { solveWaterSort, TUBE_CAPACITY } from '../src/solver/waterSortSolver';
import { Bottle } from '../src/types/game';

const lvl = CURATED_LEVELS[49];
const base = lvl.bottles;

function variant(name: string, mutate: (b: Bottle) => Bottle) {
  const bottles = base.map((b) => ({ ...b, layers: [...b.layers] })).map(mutate);
  const t0 = Date.now();
  const r = solveWaterSort(bottles, TUBE_CAPACITY, 200000);
  console.log(`[${name}] solvable=${r.solvable} steps=${r.optimalSteps} visited=${r.visitedNodes} ms=${Date.now() - t0} ${r.reason ?? ''}`);
}

// 1. all special bottles -> normal (pure 8-color puzzle)
variant('all-normal', (b) => (b.type === 'bottom_leak' || b.type === 'hidden' || b.type === 'masked' ? { ...b, type: 'normal' as const } : b));
// 2. only leak special
variant('leak-only', (b) => (b.type === 'hidden' || b.type === 'masked' ? { ...b, type: 'normal' as const } : b));
// 3. only hidden special
variant('hidden-only', (b) => (b.type === 'bottom_leak' || b.type === 'masked' ? { ...b, type: 'normal' as const } : b));
// 4. only masked special
variant('masked-only', (b) => (b.type === 'bottom_leak' || b.type === 'hidden' ? { ...b, type: 'normal' as const } : b));
// 5. leak + hidden (masked normal)
variant('leak+hidden', (b) => (b.type === 'masked' ? { ...b, type: 'normal' as const } : b));
