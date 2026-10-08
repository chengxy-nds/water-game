import React, { useRef, useState, useEffect } from 'react';
import { Tube } from '../types/game';
import { TestTube, TestTubeRef } from './TestTube';
import { WaterStream } from './WaterStream';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { TUBE_CAPACITY } from '../solver/waterSortSolver';
import { soundManager } from '../utils/audio';

// SVG bubble cluster animation simulating overflow as liquid level rises to the brim
const TubeOverflowBubbles: React.FC<{ colorHex: string; id: number | string; isSelected?: boolean }> = ({ colorHex, id, isSelected = false }) => (
  <div
    className="absolute -top-3 left-1/2 pointer-events-none z-30 w-16 h-10 flex items-center justify-center transition-transform duration-200"
    style={{
      transform: isSelected ? 'translate(-50%, -24px) scale(1.03)' : 'translate(-50%, 0)',
    }}
  >
    <svg className="w-full h-full overflow-visible" viewBox="0 0 60 30">
      <defs>
        <radialGradient id={`bubble-glow-${id}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="40%" stopColor={colorHex} stopOpacity="0.75" />
          <stop offset="85%" stopColor={colorHex} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Bubble 1: Main Center Overflow Bubble */}
      <g className="bubble-anim" style={{ animationDelay: '0s', animationDuration: '2.1s', transformOrigin: '30px 18px' }}>
        <circle cx="30" cy="18" r="5" fill={`url(#bubble-glow-${id})`} stroke="rgba(255,255,255,0.75)" strokeWidth="0.8" />
        <ellipse cx="28.5" cy="16.5" rx="1.6" ry="0.9" fill="#ffffff" opacity="0.95" />
      </g>

      {/* Bubble 2: Left Overflow Bubble */}
      <g className="bubble-anim" style={{ animationDelay: '0.45s', animationDuration: '1.9s', transformOrigin: '22px 20px' }}>
        <circle cx="22" cy="20" r="3.8" fill={`url(#bubble-glow-${id})`} stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
        <ellipse cx="21" cy="18.8" rx="1.2" ry="0.6" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Bubble 3: Right Overflow Bubble */}
      <g className="bubble-anim" style={{ animationDelay: '0.85s', animationDuration: '2.3s', transformOrigin: '38px 19px' }}>
        <circle cx="38" cy="19" r="4.3" fill={`url(#bubble-glow-${id})`} stroke="rgba(255,255,255,0.65)" strokeWidth="0.7" />
        <ellipse cx="36.8" cy="17.6" rx="1.4" ry="0.7" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Bubble 4: Floating Micro Spume Bead 1 */}
      <g className="bubble-anim" style={{ animationDelay: '1.3s', animationDuration: '2.0s', transformOrigin: '26px 22px' }}>
        <circle cx="26" cy="22" r="2.5" fill={`url(#bubble-glow-${id})`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="25.2" cy="21.2" r="0.7" fill="#ffffff" opacity="0.95" />
      </g>

      {/* Bubble 5: Floating Micro Spume Bead 2 */}
      <g className="bubble-anim" style={{ animationDelay: '0.65s', animationDuration: '2.2s', transformOrigin: '34px 21px' }}>
        <circle cx="34" cy="21" r="2.8" fill={`url(#bubble-glow-${id})`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="33.3" cy="20.3" r="0.8" fill="#ffffff" opacity="0.95" />
      </g>
    </svg>
  </div>
);

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

  // Measure exact real-world DOM offsets whenever pour animation starts
  useEffect(() => {
    if (!pourAnimation) {
      exactOffsetRef.current = null;
      return;
    }

    const sourceRef = tubeRefs.current[pourAnimation.sourceIndex];
    const targetRef = tubeRefs.current[pourAnimation.targetIndex];

    if (sourceRef && targetRef) {
      const sBox = sourceRef.getBoundingBox();
      const tBox = targetRef.getBoundingBox();

      if (sBox && tBox) {
        const isTargetRight = tBox.left >= sBox.left;
        const tiltAngle = isTargetRight ? 75 : -75;
        const rad = (Math.abs(tiltAngle) * Math.PI) / 180;

        // Source and target mouth centers at rest
        const sMouthX = sBox.left + sBox.width * 0.5;
        const sMouthY = sBox.top + 6;
        const tMouthX = tBox.left + tBox.width * 0.5;
        const tMouthY = tBox.top + 6;

        // When tilted by 75deg around mouth center (50% 6px),
        // the lower corner (spout) moves by:
        const spoutDx = (isTargetRight ? 1 : -1) * (15 * Math.cos(rad));
        const spoutDy = 15 * Math.sin(rad);

        // We want the spout to hover directly 20px above target mouth opening:
        const desiredSpoutX = tMouthX;
        const desiredSpoutY = tMouthY - 20;

        // Required translation for the source bottle's mouth center:
        const requiredMouthX = desiredSpoutX - spoutDx;
        const requiredMouthY = desiredSpoutY - spoutDy;

        const exactX = requiredMouthX - sMouthX;
        const exactY = requiredMouthY - sMouthY;

        exactOffsetRef.current = { exactX, exactY, tiltAngle };
      }
    }
  }, [pourAnimation?.sourceIndex, pourAnimation?.targetIndex]);

  // Update stream points in sync with animation frame
  useEffect(() => {
    if (!pourAnimation || pourAnimation.phase !== 'pouring') {
      setStreamFrom(null);
      setStreamTo(null);
      return;
    }

    const updateStreamCoords = () => {
      const sourceRef = tubeRefs.current[pourAnimation.sourceIndex];
      const targetRef = tubeRefs.current[pourAnimation.targetIndex];

      if (sourceRef && targetRef) {
        const spout = sourceRef.getSpoutPos();
        const mouth = targetRef.getMouthPos();
        if (spout && mouth) {
          setStreamFrom(spout);
          setStreamTo(mouth);
        }
      }
    };

    updateStreamCoords();
    const interval = setInterval(updateStreamCoords, 16);
    return () => clearInterval(interval);
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
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-6 px-3 select-none"
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

      {/* CSS-Animated Liquid Surface Ripple Waves at Target Bottle Mouth */}
      {pourAnimation && pourAnimation.phase === 'pouring' && streamTo && (
        <div
          className="fixed pointer-events-none z-50 flex items-center justify-center transition-opacity duration-200"
          style={{
            left: `${streamTo.x}px`,
            top: `${streamTo.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Concentric 3D Water Surface Waves & Droplet Splash Impact */}
          <div className="relative w-20 h-10 flex items-center justify-center">
            {/* Ripple Wave 1 (CSS Keyframe Animated) */}
            <div
              className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple-1 pointer-events-none"
              style={{
                borderColor: getColor(pourAnimation.colorId).hex,
                boxShadow: `0 0 10px ${getColor(pourAnimation.colorId).hex}99`,
              }}
            />

            {/* Ripple Wave 2 (Staggered Delay Keyframe Animated) */}
            <div
              className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple-2 pointer-events-none"
              style={{
                borderColor: '#ffffff',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.85)',
              }}
            />

            {/* Ripple Wave 3 (Tertiary Expansion Wave) */}
            <div
              className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple-3 pointer-events-none"
              style={{
                borderColor: getColor(pourAnimation.colorId).hex,
                boxShadow: `0 0 6px ${getColor(pourAnimation.colorId).hex}66`,
              }}
            />

            {/* Central Impact Flash Core simulating droplet entry */}
            <div
              className="w-3.5 h-2 rounded-full bg-white shadow-[0_0_12px_#ffffff] anim-twinkle pointer-events-none"
            />
            <div
              className="absolute w-2 h-1 rounded-full pointer-events-none"
              style={{
                backgroundColor: getColor(pourAnimation.colorId).hex,
              }}
            />
          </div>
        </div>
      )}

      {/* Row 1 Rack & Bottles */}
      <div className="relative flex flex-col items-center mb-6">
        <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-6 md:gap-8 z-10 px-2 sm:px-4">
          {row1Tubes.map((tube, localIdx) => {
            const globalIdx = localIdx;
            const isSelected = selectedIndex === globalIdx;
            const isHintSource = hint?.from === globalIdx;
            const isHintTarget = hint?.to === globalIdx;
            const isPouringSource = pourAnimation?.sourceIndex === globalIdx;
            const isPouringTarget = pourAnimation?.targetIndex === globalIdx;
            const pourTransforms = getPourTransforms(isPouringSource);
            const showTargetRipples = isPouringTarget && pourAnimation?.phase === 'pouring';

            // Check if tube is filled to full capacity or rising to brim
            const isFilled =
              (tube.length >= TUBE_CAPACITY && (!isPouringSource || (pourAnimation?.drainCount ?? 0) === 0)) ||
              (isPouringTarget && tube.length + (pourAnimation?.riseCount || 0) >= TUBE_CAPACITY);
            const topColor =
              isPouringTarget && pourAnimation?.colorId
                ? pourAnimation.colorId
                : tube.length > 0
                ? tube[tube.length - 1]
                : null;
            const bubbleColorHex = topColor ? getColor(topColor).hex : '#38bdf8';

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

                {/* SVG bubble cluster animation when tube is filled to capacity */}
                {isFilled && (
                  <TubeOverflowBubbles
                    colorHex={bubbleColorHex}
                    id={globalIdx}
                    isSelected={isSelected}
                  />
                )}

                {/* CSS-Animated Liquid Surface Ripple Waves atop Target Bottle Mouth */}
                {showTargetRipples && (
                  <div
                    className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none z-40 flex items-center justify-center"
                  >
                    <div className="relative w-16 h-8 flex items-center justify-center">
                      {/* 3 sequentially triggered .anim-surface-ripple classes */}
                      <div
                        className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-1 pointer-events-none"
                        style={{
                          borderColor: getColor(pourAnimation.colorId).hex,
                          boxShadow: `0 0 10px ${getColor(pourAnimation.colorId).hex}99`,
                        }}
                      />
                      <div
                        className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-2 pointer-events-none"
                        style={{
                          borderColor: '#ffffff',
                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.85)',
                        }}
                      />
                      <div
                        className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-3 pointer-events-none"
                        style={{
                          borderColor: getColor(pourAnimation.colorId).hex,
                          boxShadow: `0 0 6px ${getColor(pourAnimation.colorId).hex}66`,
                        }}
                      />
                      {/* Central Impact Flash Core */}
                      <div className="w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] anim-twinkle pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ambient Floor Glow Line */}
        <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mt-2" />
      </div>

      {/* Row 2 Rack & Bottles (if more than 6 tubes) */}
      {row2Tubes.length > 0 && (
        <div className="relative flex flex-col items-center mt-2">
          <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-6 md:gap-8 z-10 px-2 sm:px-4">
            {row2Tubes.map((tube, localIdx) => {
              const globalIdx = rowSplit + localIdx;
              const isSelected = selectedIndex === globalIdx;
              const isHintSource = hint?.from === globalIdx;
              const isHintTarget = hint?.to === globalIdx;
              const isPouringSource = pourAnimation?.sourceIndex === globalIdx;
              const isPouringTarget = pourAnimation?.targetIndex === globalIdx;
              const pourTransforms = getPourTransforms(isPouringSource);
              const showTargetRipples = isPouringTarget && pourAnimation?.phase === 'pouring';

              // Check if tube is filled to full capacity or rising to brim
              const isFilled =
                (tube.length >= TUBE_CAPACITY && (!isPouringSource || (pourAnimation?.drainCount ?? 0) === 0)) ||
                (isPouringTarget && tube.length + (pourAnimation?.riseCount || 0) >= TUBE_CAPACITY);
              const topColor =
                isPouringTarget && pourAnimation?.colorId
                  ? pourAnimation.colorId
                  : tube.length > 0
                  ? tube[tube.length - 1]
                  : null;
              const bubbleColorHex = topColor ? getColor(topColor).hex : '#38bdf8';

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

                  {/* SVG bubble cluster animation when tube is filled to capacity */}
                  {isFilled && (
                    <TubeOverflowBubbles
                      colorHex={bubbleColorHex}
                      id={globalIdx}
                      isSelected={isSelected}
                    />
                  )}

                  {/* CSS-Animated Liquid Surface Ripple Waves atop Target Bottle Mouth */}
                  {showTargetRipples && (
                    <div
                      className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none z-40 flex items-center justify-center"
                    >
                      <div className="relative w-16 h-8 flex items-center justify-center">
                        {/* 3 sequentially triggered .anim-surface-ripple classes */}
                        <div
                          className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-1 pointer-events-none"
                          style={{
                            borderColor: getColor(pourAnimation.colorId).hex,
                            boxShadow: `0 0 10px ${getColor(pourAnimation.colorId).hex}99`,
                          }}
                        />
                        <div
                          className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-2 pointer-events-none"
                          style={{
                            borderColor: '#ffffff',
                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.85)',
                          }}
                        />
                        <div
                          className="absolute w-12 h-12 rounded-full border border-solid anim-surface-ripple anim-surface-ripple-3 pointer-events-none"
                          style={{
                            borderColor: getColor(pourAnimation.colorId).hex,
                            boxShadow: `0 0 6px ${getColor(pourAnimation.colorId).hex}66`,
                          }}
                        />
                        {/* Central Impact Flash Core */}
                        <div className="w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff] anim-twinkle pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ambient Floor Glow Line */}
          <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mt-2" />
        </div>
      )}
    </div>
  );
};
