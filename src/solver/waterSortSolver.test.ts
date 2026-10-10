import test from 'node:test';
import assert from 'node:assert/strict';

import { CURATED_LEVELS } from '../data/curatedLevels';
import { canLeak, canPour, isPuzzleSolved } from './waterSortSolver';

const makeBottle = (layers: string[], type: 'normal' | 'bottom_leak' = 'normal') => ({
  id: 'b',
  type,
  capacity: 4,
  layers,
} as const);

test('rejects duplicate solved colors across multiple full bottles', () => {
  const bottles = [
    makeBottle(['red', 'red', 'red', 'red']),
    makeBottle(['red', 'red', 'red', 'red']),
    { id: 'e', type: 'empty' as const, capacity: 4, layers: [] },
  ];

  assert.equal(isPuzzleSolved(bottles, 4), false);
});

test('accepts a valid solved board with one color per bottle', () => {
  const bottles = [
    makeBottle(['red', 'red', 'red', 'red']),
    makeBottle(['blue', 'blue', 'blue', 'blue']),
    { id: 'e', type: 'empty' as const, capacity: 4, layers: [] },
  ];

  assert.equal(isPuzzleSolved(bottles, 4), true);
});

test('bottom leak bottles cannot be used as normal pour sources', () => {
  const source = makeBottle(['red', 'blue', 'blue', 'blue'], 'bottom_leak');
  const target = makeBottle(['blue', 'blue', 'blue']);

  assert.equal(canPour(source, target, 4).valid, false);
});

test('bottom leak can pour into its designated empty target bottle when it is directly below', () => {
  const bottles = Array.from({ length: 8 }, (_, idx) => ({
    id: `b${idx + 1}`,
    type: 'normal' as const,
    capacity: 4,
    layers: [],
  }));
  const source = {
    ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'),
    id: 'b1',
    leakTargetBottleId: 'b5',
  };
  const target = { ...makeBottle([], 'normal'), id: 'b5' };

  assert.equal(canLeak(source, target, 4, 0, 4, bottles), true);
});

test('bottom leak rejects a side-by-side target bottle', () => {
  const bottles = Array.from({ length: 8 }, (_, idx) => ({
    id: `b${idx + 1}`,
    type: 'normal' as const,
    capacity: 4,
    layers: [],
  }));
  const source = {
    ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'),
    id: 'b1',
    leakTargetBottleId: 'b2',
  };
  const target = { ...makeBottle([], 'normal'), id: 'b2' };

  assert.equal(canLeak(source, target, 4, 0, 1, bottles), false);
});

test('bottom leak requires matching top color when target is not empty', () => {
  const source = makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak');
  const target = makeBottle(['green', 'green'], 'normal');

  assert.equal(canLeak(source, target, 4), false);
});

test('bottom leak must point to its designated target bottle', () => {
  const source = {
    ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'),
    id: 'source',
    leakTargetBottleId: 'b2',
  };
  const target = { ...makeBottle(['red', 'red'], 'normal'), id: 'other' };

  assert.equal(canLeak(source, target, 4), false);
});

test('special bottom leak level stays at the final progression slot', () => {
  const leakLevel = CURATED_LEVELS.find((level) =>
    level.bottles.some((bottle) => bottle.type === 'bottom_leak'),
  );

  assert.equal(leakLevel?.id, 51);
  assert.equal(CURATED_LEVELS[45].bottles.some((bottle) => bottle.type === 'bottom_leak'), false);
});
