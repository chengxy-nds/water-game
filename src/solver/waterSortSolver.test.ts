import test from 'node:test';
import assert from 'node:assert/strict';

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

test('bottom leak can pour into an empty target bottle', () => {
  const source = { ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'), id: 'source' };
  const target = { ...makeBottle([], 'normal'), id: 'target' };

  assert.equal(canLeak(source, target, 4), true);
});

test('bottom leak requires matching top color when target is not empty', () => {
  const source = makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak');
  const target = makeBottle(['green', 'green'], 'normal');

  assert.equal(canLeak(source, target, 4), false);
});
