import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Bottle } from '../types/game';
import {
  BOTTLE_CHAMBER_BOTTOM,
  BOTTLE_MOUTH_CENTER,
  BOTTLE_VIEWBOX_WIDTH,
  BOTTLE_VIEWBOX_HEIGHT,
  TestTube,
  TubeSizeVariant,
  getBottleLiquidSurfaceY,
  getBottlePourSpoutPoint,
} from './TestTube';
import { WaterStream, WaterStreamTargetPoints } from './WaterStream';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { TUBE_CAPACITY, isBottleReadyToCollect } from '../solver/waterSortSolver';
import { soundManager } from '../utils/audio';



export interface PourAnimationState {
  sourceIndex: number;
  targetIndex: number;
  colorId: string;
  count: number;
  phase: 'flying' | 'pouring' | 'returning';
  tiltAngle: number;
  translateX: number;
  translateY: number;
  drainCount: number;
  riseCount: number;
}

export interface CompletionAnimationState {
  tubeIndex: number;
  colorId: string;
  phase: 'cork_drop' | 'whirling' | 'flying';
  flyX: number;
  flyY: number;
}

export interface LeakAnimationState {
  sourceIndex: number;
  targetIndex: number;
  colorId: string;
}

interface GameBoardProps {
  bottles: Bottle[];
  levelEntryId?: number;
  selectedIndex: number | null;
  hint: { from: number; to: number } | null;
  pourAnimation: PourAnimationState | null;
  leakAnimation?: LeakAnimationState | null;
  completionAnimation?: CompletionAnimationState | null;
  collectedTubeIndices?: number[];
  soundEnabled?: boolean;
  shakingTubeIndex?: number | null;
  onTubeClick: (index: number) => void;
  disabled?: boolean;
}

export const MAX_BOTTLES_PER_ROW = 7;

/**
 * 瓶子上下货架分层排布算法：
 * 1. 一排最多 7 个瓶子（严格保证 MAX_BOTTLES_PER_ROW = 7）；
 * 2. 1~5 瓶单排居中展示；
 * 3. 6~14 瓶优雅均分成 2 层货架（每层最多 7 瓶，如 6 瓶 3+3，7 瓶 4+3，10 瓶 5+5，14 瓶 7+7）；
 * 4. >= 15 瓶均分成 3 层货架（每层最多 7 瓶，如 15 瓶 5+5+5，21 瓶 7+7+7）。
 */
export const getRowDistribution = (total: number): number[] => {
  if (total <= 0) return [];
  if (total <= 5) return [total];
  if (total <= 14) {
    const top = Math.min(MAX_BOTTLES_PER_ROW, Math.ceil(total / 2));
    const bottom = total - top;
    return [top, bottom];
  }
  const rows = Math.max(3, Math.ceil(total / MAX_BOTTLES_PER_ROW));
  const base = Math.floor(total / rows);
  const remainder = total % rows;
  const result: number[] = [];
  for (let i = 0; i < rows; i++) {
    result.push(Math.min(MAX_BOTTLES_PER_ROW, base + (i >= rows - remainder ? 1 : 0)));
  }
  return result;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  bottles,
  levelEntryId = 0,
  selectedIndex,
  hint,
  pourAnimation,
  leakAnimation = null,
  completionAnimation = null,
  collectedTubeIndices = [],
  soundEnabled = true,
  shakingTubeIndex = null,
  onTubeClick,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic acoustic physical feedback: Liquid stream pouring sound with rising pitch
  // As liquid is injected into the tube, the air column resonance & impact pitch rise with liquid level
  const pouredPhaseTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!pourAnimation) {
      pouredPhaseTriggeredRef.current = false;
      return;
    }

    if (pourAnimation.phase === 'pouring') {
      if (!pouredPhaseTriggeredRef.current) {
        pouredPhaseTriggeredRef.current = true;
        if (soundEnabled) {
          const targetTube = bottles[pourAnimation.targetIndex];
          const startVolume = targetTube ? targetTube.layers.length : 0;
          const count = pourAnimation.count;
          soundManager.playDynamicPour(startVolume, count, TUBE_CAPACITY);
        }
      }
    } else {
      pouredPhaseTriggeredRef.current = false;
    }
  }, [pourAnimation?.phase, pourAnimation?.targetIndex, pourAnimation?.count, bottles, soundEnabled]);

  // Live coordinates of water stream: tilted spout lip → target mouth entry → surface impact
  const pourStreamPositions = useMemo((): WaterStreamTargetPoints | null => {
    if (!pourAnimation || pourAnimation.phase !== 'pouring') return null;

    // 1. Spout & Mouth physical anchors (100% immune to mobile WebKit transform matrix bugs)
    const spoutAnchor = document.getElementById('active-pour-spout-anchor');
    const targetMouthAnchor = document.getElementById(`tube-mouth-anchor-${pourAnimation.targetIndex}`);
    const targetSlot = document.getElementById(`tube-slot-${pourAnimation.targetIndex}`);
    const targetSvg = targetSlot?.querySelector<SVGSVGElement>('svg');

    let fromX = 0;
    let fromY = 0;
    let mouthX = 0;
    let mouthY = 0;
    let mouthRadiusX = 16;
    let mouthRadiusY = 4.5;

    if (spoutAnchor && targetMouthAnchor) {
      const sRect = spoutAnchor.getBoundingClientRect();
      const mRect = targetMouthAnchor.getBoundingClientRect();
      fromX = sRect.left + sRect.width / 2;
      fromY = sRect.top + sRect.height / 2;
      mouthX = mRect.left + mRect.width / 2;
      mouthY = mRect.top + mRect.height / 2;
    } else {
      const tRect = targetSlot?.getBoundingClientRect();
      if (!tRect) return null;
      mouthX = tRect.left + tRect.width * (BOTTLE_MOUTH_CENTER.x / BOTTLE_VIEWBOX_WIDTH);
      mouthY = tRect.top + tRect.height * (BOTTLE_MOUTH_CENTER.y / BOTTLE_VIEWBOX_HEIGHT);
      fromX = mouthX + (pourAnimation.tiltAngle >= 0 ? -16 : 16);
      fromY = mouthY - 14;
    }

    // 2. Target liquid surface screen coordinates (impact point)
    const targetBottle = bottles[pourAnimation.targetIndex];
    const initialUnits = targetBottle ? targetBottle.layers.length : 0;
    const currentUnits = Math.min(TUBE_CAPACITY, initialUnits + pourAnimation.riseCount);
    const surfaceSvgY = getBottleLiquidSurfaceY(currentUnits, TUBE_CAPACITY);

    let impactY = mouthY + 50;
    if (targetSvg) {
      const tRect = targetSvg.getBoundingClientRect();
      impactY = tRect.top + (surfaceSvgY / BOTTLE_VIEWBOX_HEIGHT) * tRect.height;
      mouthRadiusX = (20 / BOTTLE_VIEWBOX_WIDTH) * tRect.width;
      mouthRadiusY = (6 / BOTTLE_VIEWBOX_HEIGHT) * tRect.height;
    }

    return {
      from: { x: fromX, y: fromY },
      mouth: { x: mouthX, y: mouthY },
      impact: { x: mouthX, y: impactY },
      tiltAngle: pourAnimation.tiltAngle,
      mouthRadiusX,
      mouthRadiusY,
    };
  }, [pourAnimation, bottles]);

  // Leak stream coordinates: source bottle bottom → target bottle top (screen space)
  const [leakFrom, setLeakFrom] = useState<{ x: number; y: number } | null>(null);
  const [leakTo, setLeakTo] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!leakAnimation) {
      setLeakFrom(null);
      setLeakTo(null);
      return;
    }
    const sourceSlot = document.querySelector<HTMLDivElement>(`#tube-slot-${leakAnimation.sourceIndex}`);
    const targetSlot = document.querySelector<HTMLDivElement>(`#tube-slot-${leakAnimation.targetIndex}`);
    if (sourceSlot && targetSlot) {
      const sRect = sourceSlot.getBoundingClientRect();
      const tRect = targetSlot.getBoundingClientRect();

      const sourceBottomX = sRect.left + sRect.width * 0.5;
      const sourceBottomY = sRect.top + sRect.height * (BOTTLE_CHAMBER_BOTTOM / BOTTLE_VIEWBOX_HEIGHT);

      const targetBottle = bottles[leakAnimation.targetIndex];
      const targetUnits = targetBottle ? targetBottle.layers.length : 0;
      const targetBottomY = getBottleLiquidSurfaceY(targetUnits, TUBE_CAPACITY);
      const targetImpactX = tRect.left + tRect.width * 0.5;
      const targetImpactY = tRect.top + tRect.height * (targetBottomY / BOTTLE_VIEWBOX_HEIGHT);

      setLeakFrom({ x: sourceBottomX, y: sourceBottomY });
      setLeakTo({ x: targetImpactX, y: targetImpactY });
    }
  }, [leakAnimation, bottles]);

  // Helper: compute exact physical transform for pouring bottle
  const getPourTransforms = (isPouringSource: boolean) => {
    if (!isPouringSource || !pourAnimation) {
      return { tiltAngle: 0, translateX: 0, translateY: 0 };
    }

    return {
      tiltAngle: pourAnimation.tiltAngle,
      translateX: pourAnimation.translateX,
      translateY: pourAnimation.translateY,
    };
  };

  const rowDistribution = getRowDistribution(bottles.length);
  const rowCount = rowDistribution.length;

  // 瓶子统一使用黄金恒定尺寸，绝不随加瓶数量而变小
  const sizeVariant: TubeSizeVariant = 'normal';

  // 水平间距保持自然呼吸感，左右不拥挤
  const rowGapClass = 'gap-1.5 xs:gap-2 sm:gap-2.5';

  const rows: { startIndex: number; bottles: Bottle[] }[] = [];
  let rowStartIndex = 0;

  for (const size of rowDistribution) {
    rows.push({
      startIndex: rowStartIndex,
      bottles: bottles.slice(rowStartIndex, rowStartIndex + size),
    });
    rowStartIndex += size;
  }

  // When a bottom_leak bottle is selected, resolve and highlight its fixed target
  const leakTargetIdx =
    selectedIndex !== null && bottles[selectedIndex]?.type === 'bottom_leak'
      ? bottles.findIndex((b) => b.id === bottles[selectedIndex].leakTargetBottleId)
      : -1;

  const renderTube = (bottle: Bottle, globalIdx: number) => {
    const isSelected = selectedIndex === globalIdx;
    const isHintSource = hint?.from === globalIdx;
    const isHintTarget = hint?.to === globalIdx;
    const isLeakTarget = leakTargetIdx !== -1 && leakTargetIdx === globalIdx;
    const isPouringSource = pourAnimation?.sourceIndex === globalIdx;
    const isPouringTarget = pourAnimation?.targetIndex === globalIdx;
    const pourTransforms = getPourTransforms(isPouringSource);

    return (
      <div
        id={`tube-slot-${globalIdx}`}
        key={`tube-wrap-${globalIdx}`}
        className={`relative flex flex-col items-center ${
          isPouringSource ? 'z-50' : isSelected ? 'z-30' : 'z-10'
        }`}
      >
        <TestTube
          index={globalIdx}
          bottle={bottle}
          levelEntryId={levelEntryId}
          sizeVariant={sizeVariant}
          isSelected={isSelected}
          isHintSource={isHintSource}
          isHintTarget={isHintTarget}
          isLeakTarget={isLeakTarget}
          isPouringSource={isPouringSource}
          isPouringFluid={pourAnimation?.phase === 'pouring' && (isPouringSource || isPouringTarget)}
          isPouringTarget={isPouringTarget}
          isShaking={shakingTubeIndex === globalIdx}
          tiltAngle={pourTransforms.tiltAngle}
          translateX={pourTransforms.translateX}
          translateY={pourTransforms.translateY}
          sourceDrainingCount={isPouringSource ? pourAnimation?.drainCount ?? 0 : 0}
          drainingTotalCount={isPouringSource ? pourAnimation?.count ?? 0 : 0}
          targetRisingCount={isPouringTarget ? pourAnimation?.riseCount ?? 0 : 0}
          activePourColor={pourAnimation?.colorId || null}
          completionPhase={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.phase ?? null : null}
          flyX={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.flyX ?? 0 : 0}
          flyY={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.flyY ?? 0 : 0}
          hasCork={collectedTubeIndices.includes(globalIdx) || (isBottleReadyToCollect(bottle, TUBE_CAPACITY) && completionAnimation?.tubeIndex !== globalIdx)}
          isCollected={collectedTubeIndices.includes(globalIdx)}
          onClick={onTubeClick}
          disabled={disabled || !!pourAnimation || !!completionAnimation}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-full mx-auto flex flex-col items-center justify-start ${rowCount >= 3 ? 'pt-[1.5vh]' : 'pt-[3.5vh]'} pb-2 px-4 xs:px-5 sm:px-6 select-none`}
    >
      {/* SVG <defs> and <filter> defining 'gooey' filter and jelly liquid layer gradients */}
      <svg className="fixed w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="gooey" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>

          {/* Liquid Jelly Depth Gradients for all palette colors */}
          {Object.values(COLOR_PALETTE).map((color) => (
            <linearGradient
              key={`liquid-gradient-${color.id}`}
              id={`jelly-gradient-${color.id}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="15%" stopColor={color.hex} stopOpacity="0.95" />
              <stop offset="60%" stopColor={color.hex} stopOpacity="1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Procedural Viscous Water Stream with gooey filter applied for liquid cohesion */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <WaterStream
          streamPoints={pourStreamPositions}
          colorId={pourAnimation?.colorId || 'red'}
          active={!!pourAnimation && pourAnimation.phase === 'pouring'}
          showSplash={true}
        />
        {/* Bottom-leak drip stream: source bottle base → target bottle mouth */}
        <WaterStream
          fromPos={leakFrom}
          toPos={leakTo}
          colorId={leakAnimation?.colorId || 'red'}
          active={!!leakAnimation}
        />
      </div>

      <div className={`relative z-10 flex flex-col items-center ${rowCount >= 3 ? 'gap-3.5 xs:gap-4.5 sm:gap-5' : 'gap-5 xs:gap-6 sm:gap-7'}`}>
        {rows.map((row, rowIndex) => {
          const isPouringInRow = pourAnimation
            ? pourAnimation.sourceIndex >= row.startIndex && pourAnimation.sourceIndex < row.startIndex + row.bottles.length
            : false;

          return (
            <div
              key={`tube-row-${rowIndex}`}
              className={`relative flex flex-col items-center justify-end transition-transform duration-300 ${
                isPouringInRow ? 'z-40' : 'z-10'
              }`}
            >
              <div className={`flex flex-nowrap items-end justify-center ${rowGapClass} z-10`}>
                {row.bottles.map((bottle, localIdx) => renderTube(bottle, row.startIndex + localIdx))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
