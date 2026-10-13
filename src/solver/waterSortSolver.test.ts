import test from 'node:test';
import assert from 'node:assert/strict';

import { CURATED_LEVELS } from '../data/curatedLevels';
import { canLeak, canPour, isDirectlyBelow, isPuzzleSolved } from './waterSortSolver';

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

test('bottom leak can pour into its designated matching target bottle when it is directly below', () => {
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
  const target = { ...makeBottle(['red'], 'normal'), id: 'b5', leakSourceBottleId: 'b1' };

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
  const target = { ...makeBottle([], 'normal'), id: 'b2', leakSourceBottleId: 'b1' };

  assert.equal(canLeak(source, target, 4, 0, 1, bottles), false);
});

test('bottom leak requires matching top color when target is not empty', () => {
  const source = {
    ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'),
    leakTargetBottleId: 'target',
  };
  const target = {
    ...makeBottle(['green', 'green'], 'normal'),
    id: 'target',
    leakSourceBottleId: 'b',
  };

  assert.equal(canLeak(source, target, 4), false);
});

test('bottom leak must point to its designated target bottle', () => {
  const source = {
    ...makeBottle(['red', 'red', 'red', 'blue'], 'bottom_leak'),
    id: 'source',
    leakTargetBottleId: 'b2',
  };
  const target = { ...makeBottle(['red', 'red'], 'normal'), id: 'other', leakSourceBottleId: 'source' };

  assert.equal(canLeak(source, target, 4), false);
});

test('bottom leak requires a reciprocal target link', () => {
  const source = {
    ...makeBottle(['red', 'red', 'red'], 'bottom_leak'),
    id: 'source',
    leakTargetBottleId: 'target',
  };
  const target = { ...makeBottle(['red'], 'normal'), id: 'target' };

  assert.equal(canLeak(source, target, 4), false);
});

test('campaign contains 100 levels and starts with seven bottles', () => {
  assert.equal(CURATED_LEVELS.length, 100);
  assert.deepEqual(CURATED_LEVELS.map((level) => level.id), Array.from({ length: 100 }, (_, index) => index + 1));
  assert.equal(CURATED_LEVELS[0].bottles.length, 7);
  assert.equal(CURATED_LEVELS[0].optimalSteps, 5);
});

test('every curated level matches its resource and color audit', () => {
  for (const level of CURATED_LEVELS) {
    const audit = level.designAudit;
    assert.ok(audit, `level ${level.id} is missing its audit`);
    assert.equal(audit.bottleCount, level.bottles.length, `level ${level.id} bottle count`);
    assert.equal(audit.freeEmptyBottleCount, level.bottles.filter((bottle) => bottle.type === 'empty').length);
    assert.equal(audit.videoEmptyBottleCount, level.bottles.filter((bottle) => bottle.type === 'video_empty').length);
    assert.equal(audit.maskedBottleCount, level.bottles.filter((bottle) => bottle.type === 'masked').length);
    assert.equal(audit.hiddenBottleCount, level.bottles.filter((bottle) => bottle.type === 'hidden').length);
    assert.equal(audit.bottomLeakBottleCount, level.bottles.filter((bottle) => bottle.type === 'bottom_leak').length);
    assert.equal(audit.colorCount, new Set(level.bottles.flatMap((bottle) => bottle.layers)).size);
    assert.equal(audit.freeShoppingBagCount, 3);
    assert.equal(audit.videoShoppingBagCount, level.id === 1 ? 0 : 1);

    const colorTotals = new Map<string, number>();
    for (const bottle of level.bottles) {
      for (const color of bottle.layers) colorTotals.set(color, (colorTotals.get(color) ?? 0) + 1);
    }
    for (const [color, count] of colorTotals) assert.equal(count, 4, `level ${level.id} color ${color} count`);
  }
});

test('difficulty score never decreases and special bottles enter progressively', () => {
  for (let index = 1; index < CURATED_LEVELS.length; index += 1) {
    const previous = CURATED_LEVELS[index - 1].designAudit!.difficultyScore;
    const current = CURATED_LEVELS[index].designAudit!.difficultyScore;
    assert.ok(current >= previous, `difficulty score drops at level ${index + 1}: ${previous} -> ${current}`);
  }

  assert.equal(CURATED_LEVELS[4].designAudit!.maskedBottleCount, 0);
  assert.equal(CURATED_LEVELS[5].designAudit!.maskedBottleCount, 1);
  assert.equal(CURATED_LEVELS[14].designAudit!.hiddenBottleCount, 0);
  assert.equal(CURATED_LEVELS[15].designAudit!.hiddenBottleCount, 1);
  assert.equal(CURATED_LEVELS[49].designAudit!.bottomLeakBottleCount, 0);
  assert.equal(CURATED_LEVELS[50].designAudit!.bottomLeakBottleCount, 1);
  assert.equal(CURATED_LEVELS[99].designAudit!.bottomLeakBottleCount, 1);
});

test('special bottle positions are distributed and leak targets stay directly below', () => {
  for (const level of CURATED_LEVELS) {
    const rowCount = Math.max(3, Math.ceil(level.bottles.length / 7));
    const rowSizes = level.bottles.length <= 5
      ? [level.bottles.length]
      : level.bottles.length <= 14
      ? [Math.ceil(level.bottles.length / 2), Math.floor(level.bottles.length / 2)]
      : Array.from({ length: rowCount }, (_, index) =>
        Math.floor(level.bottles.length / rowCount) + (index >= rowCount - level.bottles.length % rowCount ? 1 : 0),
      );
    let rowStart = 0;

    for (const rowSize of rowSizes) {
      const row = level.bottles.slice(rowStart, rowStart + rowSize);
      const layoutGroup = (type: string) => type === 'empty' || type === 'video_empty' ? 'empty' : type;
      for (let index = 1; index < row.length; index += 1) {
        const previousGroup = layoutGroup(row[index - 1].type);
        const currentGroup = layoutGroup(row[index].type);
        if (previousGroup !== 'normal' && currentGroup !== 'normal') {
          assert.notEqual(currentGroup, previousGroup, `level ${level.id} clusters ${currentGroup} bottles`);
        }
      }
      rowStart += rowSize;
    }

    const leakIndex = level.bottles.findIndex((bottle) => bottle.type === 'bottom_leak');
    if (leakIndex >= 0) {
      const targetIndex = level.bottles.findIndex((bottle) => bottle.id === level.bottles[leakIndex].leakTargetBottleId);
      assert.equal(rowSizes[0], rowSizes[1], `level ${level.id} leak rows must share the same width`);
      assert.ok(isDirectlyBelow(leakIndex, targetIndex, level.bottles), `level ${level.id} leak target alignment`);
      assert.equal(level.bottles[targetIndex].leakSourceBottleId, level.bottles[leakIndex].id);
      assert.equal(level.bottles[leakIndex].leakTargetBottleId, level.bottles[targetIndex].id);
    }
  }
});
