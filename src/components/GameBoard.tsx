import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Bottle } from '../types/game';
import {
  BOTTLE_CHAMBER_BOTTOM,
  BOTTLE_MOUTH_CENTER,
  TestTube,
  getBottleLiquidSurfaceY,
  getBottlePourSpoutPoint,
} from './TestTube';
import { WaterStream } from './WaterStream';
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

/**
 * 瓶子上下货架分层排布算法：
 * 1. 一排最多 7 个瓶子
 * 2. 瓶子少时（<=3 瓶）单排放置；
 * 3. 4~14 瓶优雅均分成 2 层货架（如 4 瓶 2+2，5 瓶 3+2，6 瓶 3+3，7 瓶 4+3，10 瓶 5+5 等），避免瓶子过少全挤在 1 行不美观；
 * 4. >= 15 瓶均分成 3 层货架（每层最多 7 瓶）。
 */
export const getRowDistribution = (total: number): number[] => {
  if (total <= 0) return [];
  if (total <= 3) return [total];
  if (total <= 14) {
    const top = Math.ceil(total / 2);
    return [top, total - top];
  }
  const rows = 3;
  const base = Math.floor(total / rows);
  const rem = total % rows;
  return [
    Math.min(7, base + (rem > 0 ? 1 : 0)),
    Math.min(7, base + (rem > 1 ? 1 : 0)),
    Math.min(7, base),
  ];
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

  // Live coordinates of water stream
  const pourStreamPositions = useMemo(() => {
    if (!pourAnimation || pourAnimation.phase !== 'pouring') return null;
    const sourceSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${pourAnimation.sourceIndex} svg`);
    const targetSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${pourAnimation.targetIndex} svg`);
    const sourceMatrix = sourceSvg?.getScreenCTM() ?? null;
    const targetMatrix = targetSvg?.getScreenCTM() ?? null;
    if (!sourceSvg || !targetSvg || !sourceMatrix || !targetMatrix) return null;

    const sourceLip = sourceSvg.createSVGPoint();
    const spoutPoint = getBottlePourSpoutPoint(pourAnimation.tiltAngle);
    sourceLip.x = spoutPoint.x;
    sourceLip.y = spoutPoint.y;
    const targetMouth = targetSvg.createSVGPoint();
    targetMouth.x = BOTTLE_MOUTH_CENTER.x;
    targetMouth.y = BOTTLE_MOUTH_CENTER.y;
    return {
      from: sourceLip.matrixTransform(sourceMatrix),
      to: targetMouth.matrixTransform(targetMatrix),
    };
  }, [pourAnimation]);

  // Leak stream coordinates: source bottle bottom → target bottle top (screen space)
  const [leakFrom, setLeakFrom] = useState<{ x: number; y: number } | null>(null);
  const [leakTo, setLeakTo] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!leakAnimation) {
      setLeakFrom(null);
      setLeakTo(null);
      return;
    }
    const sourceSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${leakAnimation.sourceIndex} svg`);
    const targetSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${leakAnimation.targetIndex} svg`);
    const sourceMatrix = sourceSvg?.getScreenCTM() ?? null;
    const targetMatrix = targetSvg?.getScreenCTM() ?? null;
    if (sourceMatrix && targetMatrix) {
      const sourceBottom = sourceSvg!.createSVGPoint();
      sourceBottom.x = BOTTLE_MOUTH_CENTER.x;
      sourceBottom.y = BOTTLE_CHAMBER_BOTTOM;
      const sourceBottomScreen = sourceBottom.matrixTransform(sourceMatrix);

      const targetBottomY = getBottleLiquidSurfaceY(
        bottles[leakAnimation.targetIndex].layers.length,
        TUBE_CAPACITY
      );
      const targetImpact = targetSvg!.createSVGPoint();
      targetImpact.x = BOTTLE_MOUTH_CENTER.x;
      targetImpact.y = targetBottomY;
      const targetImpactScreen = targetImpact.matrixTransform(targetMatrix);

      setLeakFrom({ x: sourceBottomScreen.x, y: sourceBottomScreen.y });
      setLeakTo({ x: targetImpactScreen.x, y: targetImpactScreen.y });
    }
  }, [leakAnimation]);

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
          compact={rowCount >= 3}
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
      className={`relative w-full max-w-xl mx-auto flex flex-col items-center justify-start ${rowCount >= 3 ? 'pt-[3vh]' : 'pt-[6vh]'} pb-2 px-1 select-none`}
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
          fromPos={pourStreamPositions?.from ?? null}
          toPos={pourStreamPositions?.to ?? null}
          colorId={pourAnimation?.colorId || 'red'}
          active={!!pourAnimation && pourAnimation.phase === 'pouring'}
          showSplash={false}
        />
        {/* Bottom-leak drip stream: source bottle base → target bottle mouth */}
        <WaterStream
          fromPos={leakFrom}
          toPos={leakTo}
          colorId={leakAnimation?.colorId || 'red'}
          active={!!leakAnimation}
        />
      </div>

      <div className={`relative z-10 flex flex-col items-center ${rowCount >= 3 ? 'gap-2 sm:gap-3' : 'gap-5 sm:gap-6'}`}>
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
              <div className="flex flex-nowrap items-end justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 z-10">
                {row.bottles.map((bottle, localIdx) => renderTube(bottle, row.startIndex + localIdx))}
              </div>

              {/* Frosted Glow Shelf Platform from Figma 2:1039 */}
              <div
                className="h-[10px] -mt-1 pointer-events-none select-none z-0 transition-all duration-300 flex items-center justify-center"
                style={{
                  width: `${Math.min(382, Math.max(160, row.bottles.length * (rowCount >= 3 ? 48 : 62) + 32))}px`,
                  maxWidth: '94vw',
                }}
              >
                <img
                  src="/figma/shelf_base.png"
                  alt="陈列底座"
                  className="w-full h-full object-fill drop-shadow-[0_4px_12px_rgba(56,189,248,0.35)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
