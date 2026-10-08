import React, { useRef, useState, useEffect } from 'react';
import { Tube } from '../types/game';
import { TestTube, TestTubeRef } from './TestTube';
import { WaterStream } from './WaterStream';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { TUBE_CAPACITY } from '../solver/waterSortSolver';
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

interface GameBoardProps {
  tubes: Tube[];
  selectedIndex: number | null;
  hint: { from: number; to: number } | null;
  pourAnimation: PourAnimationState | null;
  showSymbols: boolean;
  soundEnabled?: boolean;
  shakingTubeIndex?: number | null;
  onTubeClick: (index: number) => void;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tubes,
  selectedIndex,
  hint,
  pourAnimation,
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

  // Exact DOM-measured translation offsets
  const exactOffsetRef = useRef<{ exactX: number; exactY: number; tiltAngle: number } | null>(null);

  // Measure exact real-world DOM offsets and stream coordinates
  useEffect(() => {
    if (!pourAnimation || pourAnimation.phase !== 'pouring') {
      if (!pourAnimation) exactOffsetRef.current = null;
      setStreamFrom(null);
      setStreamTo(null);
      return;
    }

    const sourceRef = tubeRefs.current[pourAnimation.sourceIndex];
    const targetRef = tubeRefs.current[pourAnimation.targetIndex];

    if (sourceRef && targetRef) {
      const sBox = sourceRef.getBoundingBox();
      const tBox = targetRef.getBoundingBox();

      if (sBox && tBox) {
        // Target is to the right of source?
        const isTargetRight = tBox.left >= sBox.left;
        const tiltAngle = isTargetRight ? 65 : -65;

        // Static mouth centers of source and target
        const sMouthX = sBox.left + sBox.width * 0.5;
        const sMouthY = sBox.top + 14;
        const tMouthX = tBox.left + tBox.width * 0.5;
        const tMouthY = tBox.top + 14;

        // Lip offset relative to mouth center when rotated by 65deg around (50% 14px):
        const lipDx = isTargetRight ? 12 : -12;
        const lipDy = 8;

        // We want the pouring lip to hover directly above target mouth center:
        const spoutX = tMouthX;
        const spoutY = tMouthY - 14;

        // Required translation for the source bottle:
        const exactX = (spoutX - lipDx) - sMouthX;
        const exactY = (spoutY - lipDy) - sMouthY;

        exactOffsetRef.current = { exactX, exactY, tiltAngle };

        // The water flows downwards from spout directly into target tube!
        // Start: at the hovering spout (spoutX, spoutY)
        // Landing: inside target bottle mouth (tMouthX, tMouthY + 20)
        setStreamFrom({ x: spoutX, y: spoutY + 4 });
        setStreamTo({ x: tMouthX, y: tMouthY + 22 });
      }
    }
  }, [pourAnimation]);

  // Helper: compute exact physical transform for pouring bottle
  const getPourTransforms = (isPouringSource: boolean) => {
    if (!isPouringSource || !pourAnimation) {
      return { tiltAngle: 0, translateX: 0, translateY: 0 };
    }

    if (exactOffsetRef.current) {
      const { exactX, exactY, tiltAngle } = exactOffsetRef.current;
      if (pourAnimation.phase === 'flying') {
        return {
          tiltAngle: tiltAngle * 0.25,
          translateX: exactX * 0.65,
          translateY: exactY - 24,
        };
      } else if (pourAnimation.phase === 'pouring') {
        return {
          tiltAngle,
          translateX: exactX,
          translateY: exactY,
        };
      } else if (pourAnimation.phase === 'returning') {
        return {
          tiltAngle: 0,
          translateX: 0,
          translateY: -24,
        };
      }
    }

    return {
      tiltAngle: pourAnimation.tiltAngle,
      translateX: pourAnimation.translateX,
      translateY: pourAnimation.translateY,
    };
  };

  const numTubes = tubes.length;
  const isMultiRow = numTubes > 6;
  const rowSplit = isMultiRow ? Math.ceil(numTubes / 2) : numTubes;

  const row1Tubes = tubes.slice(0, rowSplit);
  const row2Tubes = isMultiRow ? tubes.slice(rowSplit) : [];

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center py-2 sm:py-4 px-1 select-none"
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

      {/* Row 1 Bottles */}
      <div className="relative flex flex-col items-center mb-3 sm:mb-5">
        <div className="flex flex-nowrap items-end justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 z-10 px-0.5 sm:px-2">
          {row1Tubes.map((tube, localIdx) => {
            const globalIdx = localIdx;
            const isSelected = selectedIndex === globalIdx;
            const isHintSource = hint?.from === globalIdx;
            const isHintTarget = hint?.to === globalIdx;
            const isPouringSource = pourAnimation?.sourceIndex === globalIdx;
            const isPouringTarget = pourAnimation?.targetIndex === globalIdx;
            const pourTransforms = getPourTransforms(isPouringSource);

            return (
              <div key={`tube-wrap-${globalIdx}`} className="relative flex flex-col items-center">
                <TestTube
                  ref={(el) => { tubeRefs.current[globalIdx] = el; }}
                  index={globalIdx}
                  tube={tube}
                  isSelected={isSelected}
                  isHintSource={isHintSource}
                  isHintTarget={isHintTarget}
                  isPouringSource={isPouringSource}
                  isPouringTarget={isPouringTarget}
                  isShaking={shakingTubeIndex === globalIdx}
                  tiltAngle={pourTransforms.tiltAngle}
                  translateX={pourTransforms.translateX}
                  translateY={pourTransforms.translateY}
                  showSymbols={showSymbols}
                  sourceDrainingCount={isPouringSource ? pourAnimation.drainCount : 0}
                  targetRisingCount={isPouringTarget ? pourAnimation.riseCount : 0}
                  activePourColor={pourAnimation?.colorId || null}
                  onClick={onTubeClick}
                  disabled={disabled || !!pourAnimation}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2 Bottles (if more than 6 tubes) */}
      {row2Tubes.length > 0 && (
        <div className="relative flex flex-col items-center mt-0.5 sm:mt-1.5">
          <div className="flex flex-nowrap items-end justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 z-10 px-0.5 sm:px-2">
            {row2Tubes.map((tube, localIdx) => {
              const globalIdx = rowSplit + localIdx;
              const isSelected = selectedIndex === globalIdx;
              const isHintSource = hint?.from === globalIdx;
              const isHintTarget = hint?.to === globalIdx;
              const isPouringSource = pourAnimation?.sourceIndex === globalIdx;
              const isPouringTarget = pourAnimation?.targetIndex === globalIdx;
              const pourTransforms = getPourTransforms(isPouringSource);

              return (
                <div key={`tube-wrap-${globalIdx}`} className="relative flex flex-col items-center">
                  <TestTube
                    ref={(el) => { tubeRefs.current[globalIdx] = el; }}
                    index={globalIdx}
                    tube={tube}
                    isSelected={isSelected}
                    isHintSource={isHintSource}
                    isHintTarget={isHintTarget}
                    isPouringSource={isPouringSource}
                    isPouringTarget={isPouringTarget}
                    isShaking={shakingTubeIndex === globalIdx}
                    tiltAngle={pourTransforms.tiltAngle}
                    translateX={pourTransforms.translateX}
                    translateY={pourTransforms.translateY}
                    showSymbols={showSymbols}
                    sourceDrainingCount={isPouringSource ? pourAnimation.drainCount : 0}
                    targetRisingCount={isPouringTarget ? pourAnimation.riseCount : 0}
                    activePourColor={pourAnimation?.colorId || null}
                    onClick={onTubeClick}
                    disabled={disabled || !!pourAnimation}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
