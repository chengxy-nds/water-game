import { CURATED_LEVELS } from '../src/data/curatedLevels';
import { solveWaterSort, TUBE_CAPACITY } from '../src/solver/waterSortSolver';

const lvl = CURATED_LEVELS[49];
console.log('Level', lvl.id, lvl.title);
console.log('bottles:', JSON.stringify(lvl.bottles.map(b => ({ id: b.id, type: b.type, layers: b.layers, hiddenTopLayers: b.hiddenTopLayers, leakTarget: b.leakTargetBottleId }))));

const t0 = Date.now();
const r = solveWaterSort(lvl.bottles, TUBE_CAPACITY, 3000000);
console.log('solvable:', r.solvable, 'steps:', r.optimalSteps, 'visited:', r.visitedNodes, 'ms:', Date.now() - t0);
if (r.reason) console.log('reason:', r.reason);
if (r.solvable) console.log('moves:', JSON.stringify(r.moves.slice(0, 40)));
