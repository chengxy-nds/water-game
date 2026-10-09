import React, { useRef, useState, useEffect } from 'react';
import { Tube } from '../types/game';
import { TestTube, TestTubeRef } from './TestTube';
import { WaterStream } from './WaterStream';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { TUBE_CAPACITY, isTubeComplete } from '../solver/waterSortSolver';
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

interface GameBoardProps {
  tubes: Tube[];
  levelEntryId?: number;
  selectedIndex: number | null;
  hint: { from: number; to: number } | null;
  pourAnimation: PourAnimationState | null;
  completionAnimation?: CompletionAnimationState | null;
  collectedTubeIndices?: number[];
  showSymbols: boolean;
  soundEnabled?: boolean;
  shakingTubeIndex?: number | null;
  onTubeClick: (index: number) => void;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tubes,
  levelEntryId = 0,
  selectedIndex,
  hint,
  pourAnimation,
  completionAnimation = null,
  collectedTubeIndices = [],
  showSymbols,
  soundEnabled = true,
  shakingTubeIndex = null,
  onTubeClick,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tubeRefs = useRef<(TestTubeRef | null)[]>([]);

  // Keep tube refs array matched with tubes length
  useEffect(() => {
    tubeRefs.current = tubeRefs.current.slice(0, tubes.length);
  }, [tubes.length]);

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
          const targetTube = tubes[pourAnimation.targetIndex];
          const startVolume = targetTube ? targetTube.length : 0;
          const count = pourAnimation.count;
          soundManager.playDynamicPour(startVolume, count, TUBE_CAPACITY);
        }
      }
    } else {
      pouredPhaseTriggeredRef.current = false;
    }
  }, [pourAnimation?.phase, pourAnimation?.targetIndex, pourAnimation?.count, tubes, soundEnabled]);

  // Live coordinates of water stream
  const [streamFrom, setStreamFrom] = useState<{ x: number; y: number } | null>(null);
  const [streamTo, setStreamTo] = useState<{ x: number; y: number } | null>(null);

  // Measure exact real-world stream coordinates
  useEffect(() => {
    if (!pourAnimation || pourAnimation.phase !== 'pouring') {
      setStreamFrom(null);
      setStreamTo(null);
      return;
    }

    const sourceSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${pourAnimation.sourceIndex} svg`);
    const targetSvg = document.querySelector<SVGSVGElement>(`#tube-slot-${pourAnimation.targetIndex} svg`);
    const sourceMatrix = sourceSvg?.getScreenCTM() ?? null;
    const targetMatrix = targetSvg?.getScreenCTM() ?? null;

    if (sourceMatrix && targetMatrix) {
      const sourceIsTiltRight = pourAnimation.tiltAngle > 0;
      const sourceLip = sourceSvg!.createSVGPoint();
      sourceLip.x = sourceIsTiltRight ? 43 : 17;
      sourceLip.y = 9;
      const sourceLipScreen = sourceLip.matrixTransform(sourceMatrix);

      const targetTube = tubes[pourAnimation.targetIndex];
      const currentLiquidUnits = targetTube
        ? targetTube.length + (pourAnimation.riseCount || 0)
        : 0;

      // Exact vertical surface level matching target tube liquid geometry
      const getTargetSurfaceSvgY = (units: number) => {
        const boundaries = [138, 105, 79.33, 53.67, 28];
        const uClamped = Math.max(0, Math.min(4, units));
        const base = Math.min(3, Math.floor(uClamped));
        const frac = uClamped - base;
        return boundaries[base] + frac * (boundaries[base + 1] - boundaries[base]);
      };

      const surfaceSvgY = getTargetSurfaceSvgY(currentLiquidUnits);
      const targetSurface = targetSvg!.createSVGPoint();
      targetSurface.x = 30;
      targetSurface.y = surfaceSvgY;
      const targetSurfaceScreen = targetSurface.matrixTransform(targetMatrix);

      setStreamFrom({ x: sourceLipScreen.x, y: sourceLipScreen.y });
      setStreamTo({ x: targetSurfaceScreen.x, y: targetSurfaceScreen.y });
    }
  }, [pourAnimation, tubes]);

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

  const rowCount = Math.min(3, Math.max(1, Math.ceil(tubes.length / 7)));
  const baseRowSize = Math.floor(tubes.length / rowCount);
  const extraTubes = tubes.length % rowCount;
  const rows: { startIndex: number; tubes: Tube[] }[] = [];
  let rowStartIndex = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowSize = baseRowSize + (rowIndex >= rowCount - extraTubes ? 1 : 0);
    rows.push({
      startIndex: rowStartIndex,
      tubes: tubes.slice(rowStartIndex, rowStartIndex + rowSize),
    });
    rowStartIndex += rowSize;
  }

  const renderTube = (tube: Tube, globalIdx: number) => {
    const isSelected = selectedIndex === globalIdx;
    const isHintSource = hint?.from === globalIdx;
    const isHintTarget = hint?.to === globalIdx;
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
          ref={(el) => { tubeRefs.current[globalIdx] = el; }}
          index={globalIdx}
          tube={tube}
          levelEntryId={levelEntryId}
          compact={rowCount >= 3}
          isSelected={isSelected}
          isHintSource={isHintSource}
          isHintTarget={isHintTarget}
          isPouringSource={isPouringSource}
          isPouringFluid={isPouringSource && pourAnimation?.phase === 'pouring'}
          isPouringTarget={isPouringTarget}
          isShaking={shakingTubeIndex === globalIdx}
          tiltAngle={pourTransforms.tiltAngle}
          translateX={pourTransforms.translateX}
          translateY={pourTransforms.translateY}
          showSymbols={showSymbols}
          sourceDrainingCount={isPouringSource ? pourAnimation?.drainCount ?? 0 : 0}
          drainingTotalCount={isPouringSource ? pourAnimation?.count ?? 0 : 0}
          targetRisingCount={isPouringTarget ? pourAnimation?.riseCount ?? 0 : 0}
          activePourColor={pourAnimation?.colorId || null}
          completionPhase={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.phase ?? null : null}
          flyX={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.flyX ?? 0 : 0}
          flyY={completionAnimation?.tubeIndex === globalIdx ? completionAnimation?.flyY ?? 0 : 0}
          hasCork={collectedTubeIndices.includes(globalIdx) || (isTubeComplete(tube, TUBE_CAPACITY) && completionAnimation?.tubeIndex !== globalIdx)}
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
          fromPos={streamFrom}
          toPos={streamTo}
          colorId={pourAnimation?.colorId || 'red'}
          active={!!pourAnimation && pourAnimation.phase === 'pouring'}
        />
      </div>

      <div className={`relative z-10 flex flex-col items-center ${rowCount >= 3 ? 'gap-3 sm:gap-4' : 'gap-8 sm:gap-10'}`}>
        {rows.map((row, rowIndex) => {
          const isPouringInRow = pourAnimation
            ? pourAnimation.sourceIndex >= row.startIndex && pourAnimation.sourceIndex < row.startIndex + row.tubes.length
            : false;

          return (
            <div
              key={`tube-row-${rowIndex}`}
              className={`relative flex items-end justify-center transition-transform duration-300 ${
                isPouringInRow ? 'z-40' : 'z-10'
              }`}
            >
              <div className="flex flex-nowrap items-end justify-center gap-1 sm:gap-2 md:gap-3">
                {row.tubes.map((tube, localIdx) => renderTube(tube, row.startIndex + localIdx))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
