import { CURATED_LEVELS } from '../src/data/curatedLevels';
import { solveWaterSort, TUBE_CAPACITY } from '../src/solver/waterSortSolver';
const lvl = CURATED_LEVELS[49];
const t0 = Date.now();
const r = solveWaterSort(lvl.bottles, TUBE_CAPACITY, 1500000);
console.log('solvable:', r.solvable, 'steps:', r.optimalSteps, 'visited:', r.visitedNodes, 'ms:', Date.now() - t0);
if (r.reason) console.log('reason:', r.reason);
