import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bottle, Level, PlayerStats, Difficulty } from './types/game';
import { CURATED_LEVELS } from './data/curatedLevels';
import {
  canPour,
  executePour,
  executeLeak,
  canLeak,
  isPuzzleSolved,
  isBottleComplete,
  solveWaterSort,
  hasAnyLegalMove,
  TUBE_CAPACITY,
} from './solver/waterSortSolver';
import { generateSolvableLevel } from './generator/levelGenerator';
import { soundManager } from './utils/audio';

import { GameHeader } from './components/GameHeader';
import { ShoppingBags } from './components/ShoppingBags';
import { GameBoard, CompletionAnimationState, LeakAnimationState } from './components/GameBoard';
import { ControlBar } from './components/ControlBar';
import { WinModal } from './components/WinModal';
import { LevelSelectorModal } from './components/LevelSelectorModal';
import { LevelWorkshop } from './components/LevelWorkshop';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { SettingsModal } from './components/SettingsModal';
import { DeadlockModal } from './components/DeadlockModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { HintModal, HintData } from './components/HintModal';
import { RulesModal } from './components/RulesModal';
import { MechanicIntroModal, MechanicIntroData } from './components/MechanicIntroModal';

const STATS_STORAGE_KEY = 'water_sort_player_stats_v1';
const PREFS_STORAGE_KEY = 'water_sort_preferences_v1';
const MECHANIC_TUTORIAL_KEY = 'water_sort_mechanics_seen_v1';

const MECHANIC_INTRO: Record<'normal' | 'masked' | 'hidden' | 'bottom_leak', MechanicIntroData> = {
  normal: {
    key: 'normal',
    title: '普通瓶',
    subtitle: '这是基础玩法：把同色液体按顶部连续段倒到空瓶或同色瓶中。',
    bullets: [
      '每个瓶子最多装 4 层。',
      '只能倒出瓶顶连续同色的一段。',
      '目标瓶必须为空或顶层颜色相同。',
    ],
  },
  masked: {
    key: 'masked',
    title: '遮罩瓶',
    subtitle: '遮罩瓶最初会被布盖住，直到你完成足够多的目标瓶才会揭开。',
    bullets: [
      '它刚开始看不见内部液体。',
      '完成指定数量的目标瓶后，遮罩会自动掉落。',
      '揭开后，它和普通瓶完全一样，继续按正常规则倒水。',
    ],
  },
  hidden: {
    key: 'hidden',
    title: '隐藏瓶',
    subtitle: '隐藏瓶底部有一层或多层颜色被遮住，玩家不能直接利用未知底层信息。',
    bullets: [
      '你只能看到顶部已知颜色。',
      '底层隐藏颜色不会一次性全部暴露。',
      '只有顶层被倒出后，下一层才会逐步显现。',
    ],
  },
  bottom_leak: {
    key: 'bottom_leak',
    title: '底部漏水瓶',
    subtitle: '这类瓶子不能像普通瓶一样口口倒水，必须走底部漏水机制。',
    bullets: [
      '它只能从底部漏出一层液体。',
      '目标瓶必须是指定的固定目标瓶。',
      '源瓶底部颜色必须和目标瓶顶部颜色一致。',
    ],
  },
};

const getSeenMechanics = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(MECHANIC_TUTORIAL_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveSeenMechanics = (seen: Record<string, boolean>) => {
  try {
    localStorage.setItem(MECHANIC_TUTORIAL_KEY, JSON.stringify(seen));
  } catch {
    // ignore
  }
};

const detectLevelMechanics = (lvl: Level): Array<keyof typeof MECHANIC_INTRO> => {
  const found: Array<keyof typeof MECHANIC_INTRO> = [];
  if (lvl.bottles.some((b) => b.type === 'masked')) found.push('masked');
  if (lvl.bottles.some((b) => b.type === 'hidden')) found.push('hidden');
  if (lvl.bottles.some((b) => b.type === 'bottom_leak')) found.push('bottom_leak');
  return found;
};

export default function App() {
  // Current active level (Default to Level 2 matching reference screenshot)
  const [currentLevel, setCurrentLevel] = useState<Level>(CURATED_LEVELS[1]);
  const [bottles, setBottles] = useState<Bottle[]>(() =>
    CURATED_LEVELS[1].bottles.map((b) => ({ ...b, layers: [...b.layers] }))
  );
  const [levelEntryId, setLevelEntryId] = useState(0);

  // History for Undo
  const [history, setHistory] = useState<Bottle[][]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [extraTubesAdded, setExtraTubesAdded] = useState<number>(0);

  // Selection & Interactions
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false);

  // Lightweight Invalid Operation Feedback
  const [shakingTubeIndex, setShakingTubeIndex] = useState<number | null>(null);

  // Deadlock detection state
  const [isDeadlocked, setIsDeadlocked] = useState<boolean>(false);

  // Reset confirmation modal state
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  // 3-Tier Hint Modal state
  const [activeHintData, setActiveHintData] = useState<HintData | null>(null);

  // Bottle Completion Celebration (Cork drop -> Whirl -> Fly -> Shopping Bag Gulp)
  const [completionAnimation, setCompletionAnimation] = useState<CompletionAnimationState | null>(null);
  const [collectedTubeIndices, setCollectedTubeIndices] = useState<number[]>([]);
  const [activeGulpColor, setActiveGulpColor] = useState<string | null>(null);
  const [collectedColors, setCollectedColors] = useState<Set<string>>(new Set());

  const pourRafRef = useRef<number | null>(null);

  // Pouring Animation state
  const [pourAnimation, setPourAnimation] = useState<{
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
  } | null>(null);

  // Bottom-leak animation state (source bottle base → target bottle mouth)
  const [leakAnimation, setLeakAnimation] = useState<LeakAnimationState | null>(null);

  // Modals
  const [levelSelectorOpen, setLevelSelectorOpen] = useState<boolean>(false);
  const [workshopOpen, setWorkshopOpen] = useState<boolean>(false);
  const [dailyOpen, setDailyOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [mechanicIntro, setMechanicIntro] = useState<MechanicIntroData | null>(null);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const stored = localStorage.getItem(STATS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      completedLevels: {},
      dailyChallengeCompleted: {},
      hintsUsedTotal: 0,
      totalPours: 0,
    };
  });

  // Load preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.soundEnabled !== undefined) {
          setSoundEnabled(parsed.soundEnabled);
          soundManager.enabled = parsed.soundEnabled;
        }
        if (parsed.vibrateEnabled !== undefined) setVibrateEnabled(parsed.vibrateEnabled);
        if (parsed.bgmEnabled !== undefined) {
          setBgmEnabled(parsed.bgmEnabled);
          soundManager.setMusicEnabled(parsed.bgmEnabled);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const savePreferences = (sound: boolean, vib: boolean, bgm: boolean) => {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ soundEnabled: sound, vibrateEnabled: vib, bgmEnabled: bgm })
      );
    } catch {
      // ignore
    }
  };

  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  const startLevel = useCallback((lvl: Level) => {
    setLevelEntryId((entryId) => entryId + 1);
    setCurrentLevel(lvl);
    setBottles(lvl.bottles.map((b) => ({ ...b, layers: [...b.layers] })));
    setHistory([]);
    setMovesCount(0);
    setExtraTubesAdded(0);
    setSelectedIndex(null);
    setHint(null);
    setIsWon(false);
    setIsAutoSolving(false);
    setIsDeadlocked(false);
    setResetConfirmOpen(false);
    setActiveHintData(null);
    if (pourRafRef.current) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }
    setCompletionAnimation(null);
    setActiveGulpColor(null);
    setCollectedTubeIndices([]);
    setCollectedColors(new Set());
  }, []);

  useEffect(() => {
    const seen = getSeenMechanics();
    const introKey = (() => {
      if (!seen.normal) return 'normal';
      const mechs = detectLevelMechanics(currentLevel);
      for (const key of ['masked', 'hidden', 'bottom_leak'] as const) {
        if (mechs.includes(key) && !seen[key]) return key;
      }
      return null;
    })();

    if (!introKey) return;

    setMechanicIntro(MECHANIC_INTRO[introKey]);
    const nextSeen = { ...seen, [introKey]: true };
    saveSeenMechanics(nextSeen);
  }, [currentLevel]);

  const calculateFlyVector = useCallback((tubeIdx: number, colorId: string) => {
    const tubeEl = document.getElementById(`tube-slot-${tubeIdx}`);
    const bagEl = document.getElementById(`shopping-bag-${colorId}`);
    if (tubeEl && bagEl) {
      const tubeRect = tubeEl.getBoundingClientRect();
      const bagRect = bagEl.getBoundingClientRect();
      const targetX = bagRect.left + bagRect.width * 0.5;
      const targetY = bagRect.top + bagRect.height * 0.55;
      const curX = tubeRect.left + tubeRect.width * 0.5;
      const curY = tubeRect.top + tubeRect.height * 0.5;
      return {
        flyX: targetX - curX,
        flyY: targetY - curY,
      };
    }
    return { flyX: 0, flyY: -320 };
  }, []);

  const triggerWinCelebration = useCallback(
    (finalSteps: number) => {
      setIsWon(true);
      setIsAutoSolving(false);

      let stars = 3;
      if (currentLevel.optimalSteps) {
        if (finalSteps > currentLevel.optimalSteps * 1.5) stars = 1;
        else if (finalSteps > currentLevel.optimalSteps + 2) stars = 2;
      }

      const lvlKey = String(currentLevel.id);
      const prevRecord = stats.completedLevels[lvlKey];
      const newStars = prevRecord ? Math.max(prevRecord.stars, stars) : stars;
      const newBest = prevRecord ? Math.min(prevRecord.bestSteps, finalSteps) : finalSteps;

      const updatedStats: PlayerStats = {
        ...stats,
        completedLevels: {
          ...stats.completedLevels,
          [lvlKey]: {
            stars: newStars,
            bestSteps: newBest,
            completedAt: new Date().toISOString(),
          },
        },
        totalPours: stats.totalPours + 1,
      };

      if (String(currentLevel.id).startsWith('daily-')) {
        const todayKey = String(currentLevel.id).replace('daily-', '');
        updatedStats.dailyChallengeCompleted = {
          ...updatedStats.dailyChallengeCompleted,
          [todayKey]: { stars, steps: finalSteps },
        };
      }

      saveStats(updatedStats);
    },
    [currentLevel, stats]
  );

  const performPour = useCallback(
    (fromIdx: number, toIdx: number) => {
      const check = canPour(bottles[fromIdx], bottles[toIdx], TUBE_CAPACITY);
      if (!check.valid || !check.color) return false;

      // Measure exact DOM positions of both static tube slots
      const sSlot = document.getElementById(`tube-slot-${fromIdx}`);
      const tSlot = document.getElementById(`tube-slot-${toIdx}`);

      const numTubes = bottles.length;
      const isMultiRow = numTubes > 6;
      const rowSplit = isMultiRow ? (numTubes === 11 ? 5 : Math.ceil(numTubes / 2)) : numTubes;

      const fromRow = Math.floor(fromIdx / rowSplit);
      const fromCol = fromIdx % rowSplit;
      const toRow = Math.floor(toIdx / rowSplit);
      const toCol = toIdx % rowSplit;

      let exactX = (toCol - fromCol) * 65;
      let exactY = (toRow - fromRow) * 200 - 20;
      let isTargetRight = toCol >= fromCol;

      // Tilt magnitude follows how much liquid the source tube currently holds:
      // a full bottle only needs a shallow tip to spill, while a nearly empty
      // bottle must be raised much higher to pour out the last of its liquid.
      const sourceUnits = bottles[fromIdx].layers.length;
      const tiltForUnits = (units: number) => {
        const fillRatio = Math.max(0, Math.min(1, units / TUBE_CAPACITY));
        return 38 + (1 - fillRatio) * 44; // 38° (full) → 82° (near empty)
      };
      let tiltAngle = (isTargetRight ? 1 : -1) * tiltForUnits(sourceUnits);

      if (sSlot && tSlot) {
        const sBox = sSlot.getBoundingClientRect();
        const tBox = tSlot.getBoundingClientRect();

        const sScaleY = sBox.height / 150;
        const tScaleY = tBox.height / 150;
        const sMouthX = sBox.left + sBox.width * 0.5;
        const sMouthY = sBox.top + 9 * sScaleY;
        const tMouthX = tBox.left + tBox.width * 0.5;
        const tMouthY = tBox.top + 9 * tScaleY;

        isTargetRight = tMouthX >= sMouthX;
        tiltAngle = (isTargetRight ? 1 : -1) * tiltForUnits(sourceUnits);

        // Align the pouring mouth lip directly over target bottle mouth center.
        exactX = (tMouthX - sMouthX) - (isTargetRight ? 4.0 : -4.0);
        exactY = (tMouthY - sMouthY) - 18.5;
      }

      // Phase 1: Fly and align above target tube lip
      setPourAnimation({
        sourceIndex: fromIdx,
        targetIndex: toIdx,
        colorId: check.color,
        count: check.count,
        phase: 'flying',
        tiltAngle: tiltAngle * 0.25,
        translateX: exactX * 0.85,
        translateY: exactY - 24,
        drainCount: 0,
        riseCount: 0,
      });

      if (vibrateEnabled) soundManager.vibrate(20);

      // Phase 2: Tilt, spout water stream with mouths touching & gradual liquid transfer
      setTimeout(() => {
        const streamStartTime = performance.now();
        const pourDuration = 1000; // ms for continuous fluid transfer

        setPourAnimation({
          sourceIndex: fromIdx,
          targetIndex: toIdx,
          colorId: check.color!,
          count: check.count,
          phase: 'pouring',
          tiltAngle,
          translateX: exactX,
          translateY: exactY,
          drainCount: 0,
          riseCount: 0,
        });

        if (vibrateEnabled) soundManager.vibrate(35);

        // Smooth liquid level progression loop (rising in target, draining in source)
        const animatePourStream = (now: number) => {
          const elapsed = now - streamStartTime;
          const progress = Math.min(1, Math.max(0, elapsed / pourDuration));
          // S-curve ease for natural fluid acceleration and deceleration
          const easeProgress =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const currentAmount = check.count * easeProgress;
          // Keep tipping the bottle up as it drains (less water → higher tilt).
          const remainingUnits = sourceUnits - currentAmount;
          const currentTilt = (isTargetRight ? 1 : -1) * tiltForUnits(remainingUnits);

          setPourAnimation((prev) => {
            if (!prev || prev.phase !== 'pouring') return prev;
            return {
              ...prev,
              drainCount: currentAmount,
              riseCount: currentAmount,
              tiltAngle: currentTilt,
            };
          });

          if (progress < 1) {
            pourRafRef.current = requestAnimationFrame(animatePourStream);
          }
        };

        pourRafRef.current = requestAnimationFrame(animatePourStream);
      }, 450);

      // Phase 3: Finish liquid stream, commit state change and return
      setTimeout(() => {
        if (pourRafRef.current) {
          cancelAnimationFrame(pourRafRef.current);
          pourRafRef.current = null;
        }
        const result = executePour(bottles, fromIdx, toIdx, TUBE_CAPACITY);
        if (result) {
          const finalMoves = movesCount + 1;
          setHistory((prev) => [...prev, bottles.map((b) => ({ ...b, layers: [...b.layers] }))]);
          setBottles(result.newBottles);
          setMovesCount(finalMoves);

          const isTargetComplete = isBottleComplete(result.newBottles[toIdx], TUBE_CAPACITY);
          const isPuzzleComplete = isPuzzleSolved(result.newBottles, TUBE_CAPACITY);

          if (isTargetComplete) {
            const completedColor = result.newBottles[toIdx].layers[0];

            // 1. Cork Drop: Wood cork stopper drops down into bottle mouth
            setTimeout(() => {
              if (soundEnabled) soundManager.playCorkPop();
              setCompletionAnimation({
                tubeIndex: toIdx,
                colorId: completedColor,
                phase: 'cork_drop',
                flyX: 0,
                flyY: 0,
              });
            }, 300);

            // 2. Whirling: Sparkling particle halo rotates around bottle body
            setTimeout(() => {
              if (soundEnabled) soundManager.playTubeComplete();
              setCompletionAnimation((prev) =>
                prev ? { ...prev, phase: 'whirling' } : null
              );
            }, 750);

            // 3. Flying: Bottle takes off and glides smoothly up into matching shopping bag
            setTimeout(() => {
              const { flyX, flyY } = calculateFlyVector(toIdx, completedColor);
              setCompletionAnimation((prev) =>
                prev ? { ...prev, phase: 'flying', flyX, flyY } : null
              );
            }, 1450);

            // 4. Bag Gulp: Shopping bag gulps with elastic bounce and collects bottle inside
            setTimeout(() => {
              if (soundEnabled) soundManager.playBagCatch();
              setActiveGulpColor(completedColor);
              setCollectedColors((prev) => new Set(prev).add(completedColor));
              setCollectedTubeIndices((prev) => [...prev, toIdx]);
              setCompletionAnimation(null);
            }, 2100);

            // 5. Bag settles & check puzzle win or deadlock
            setTimeout(() => {
              setActiveGulpColor(null);
              if (isPuzzleComplete) {
                triggerWinCelebration(finalMoves);
              } else {
                const hasMove = hasAnyLegalMove(result.newBottles, TUBE_CAPACITY);
                if (!hasMove) {
                  setIsDeadlocked(true);
                }
              }
            }, 2700);
          } else {
            // Target tube was not completed by this pour
            if (isPuzzleComplete) {
              triggerWinCelebration(finalMoves);
            } else {
              const hasMove = hasAnyLegalMove(result.newBottles, TUBE_CAPACITY);
              if (!hasMove) {
                setTimeout(() => {
                  setIsDeadlocked(true);
                }, 400);
              }
            }
          }
        }

        setPourAnimation((prev) =>
          prev
            ? {
                ...prev,
                phase: 'returning',
                tiltAngle: 0,
                translateX: 0,
                translateY: -20,
                drainCount: 0,
                riseCount: 0,
              }
            : null
        );
      }, 1550);

      // Phase 4: Settle tube back to rack
      setTimeout(() => {
        setPourAnimation(null);
        setSelectedIndex(null);
        setHint(null);
      }, 2150);

      return true;
    },
    [bottles, soundEnabled, vibrateEnabled, movesCount, calculateFlyVector, triggerWinCelebration]
  );

  const performLeak = useCallback(
    (sourceIdx: number, targetIdx: number) => {
      const source = bottles[sourceIdx];
      if (!canLeak(source, bottles[targetIdx], TUBE_CAPACITY)) return false;

      const leakColor = source.layers[0];

      // Bottom-leak drip animation: stream drops from source bottle base into target mouth.
      setLeakAnimation({ sourceIndex: sourceIdx, targetIndex: targetIdx, colorId: leakColor });
      if (vibrateEnabled) soundManager.vibrate(20);

      setTimeout(() => {
        setLeakAnimation(null);
        const result = executeLeak(bottles, sourceIdx, targetIdx, TUBE_CAPACITY);
        if (!result) return;

        const finalMoves = movesCount + 1;
        setHistory((prev) => [...prev, bottles.map((b) => ({ ...b, layers: [...b.layers] }))]);
        setBottles(result.newBottles);
        setMovesCount(finalMoves);

        const isTargetComplete = isBottleComplete(result.newBottles[targetIdx], TUBE_CAPACITY);
        const isPuzzleComplete = isPuzzleSolved(result.newBottles, TUBE_CAPACITY);

        if (isTargetComplete) {
          const completedColor = result.newBottles[targetIdx].layers[0];
          setTimeout(() => {
            if (soundEnabled) soundManager.playCorkPop();
            setCompletionAnimation({ tubeIndex: targetIdx, colorId: completedColor, phase: 'cork_drop', flyX: 0, flyY: 0 });
          }, 200);
          setTimeout(() => {
            if (soundEnabled) soundManager.playTubeComplete();
            setCompletionAnimation((prev) => (prev ? { ...prev, phase: 'whirling' } : null));
          }, 650);
          setTimeout(() => {
            const { flyX, flyY } = calculateFlyVector(targetIdx, completedColor);
            setCompletionAnimation((prev) => (prev ? { ...prev, phase: 'flying', flyX, flyY } : null));
          }, 1350);
          setTimeout(() => {
            if (soundEnabled) soundManager.playBagCatch();
            setActiveGulpColor(completedColor);
            setCollectedColors((prev) => new Set(prev).add(completedColor));
            setCollectedTubeIndices((prev) => [...prev, targetIdx]);
            setCompletionAnimation(null);
          }, 2000);
          setTimeout(() => {
            setActiveGulpColor(null);
            if (isPuzzleComplete) {
              triggerWinCelebration(finalMoves);
            } else if (!hasAnyLegalMove(result.newBottles, TUBE_CAPACITY)) {
              setIsDeadlocked(true);
            }
          }, 2600);
        } else {
          if (isPuzzleComplete) {
            triggerWinCelebration(finalMoves);
          } else if (!hasAnyLegalMove(result.newBottles, TUBE_CAPACITY)) {
            setTimeout(() => setIsDeadlocked(true), 300);
          }
        }

        setSelectedIndex(null);
        setHint(null);
      }, 900);

      return true;
    },
    [bottles, soundEnabled, vibrateEnabled, movesCount, calculateFlyVector, triggerWinCelebration]
  );

  const triggerInvalidFeedback = useCallback(
    (tubeIdx: number) => {
      setShakingTubeIndex(tubeIdx);
      if (soundEnabled) soundManager.playInvalidSoft();
      if (vibrateEnabled) soundManager.vibrate(25);
      setTimeout(() => {
        setShakingTubeIndex((prev) => (prev === tubeIdx ? null : prev));
      }, 420);
    },
    [soundEnabled, vibrateEnabled]
  );

  const handleTubeClick = useCallback(
    (clickedIdx: number) => {
      if (isWon || pourAnimation || leakAnimation || isAutoSolving || isDeadlocked) return;

      if (selectedIndex === null) {
        if (bottles[clickedIdx].layers.length === 0) {
          triggerInvalidFeedback(clickedIdx);
          return;
        }
        setSelectedIndex(clickedIdx);
        if (soundEnabled) soundManager.playSelect();
        if (vibrateEnabled) soundManager.vibrate(15);
      } else if (selectedIndex === clickedIdx) {
        setSelectedIndex(null);
        if (soundEnabled) soundManager.playSelect();
      } else {
        const sourceBottle = bottles[selectedIndex];
        const targetBottle = bottles[clickedIdx];

        // Bottom-leak: the selected bottle only leaks into its designated target.
        if (sourceBottle.type === 'bottom_leak') {
          const leakTargetIdx = bottles.findIndex((b) => b.id === sourceBottle.leakTargetBottleId);
          if (clickedIdx === leakTargetIdx) {
            if (canLeak(sourceBottle, targetBottle, TUBE_CAPACITY)) {
              performLeak(selectedIndex, clickedIdx);
            } else {
              triggerInvalidFeedback(clickedIdx);
            }
            return;
          }
          // Clicked a non-target bottle: fall through to a normal mouth pour.
        }

        const canDoPour = canPour(sourceBottle, targetBottle, TUBE_CAPACITY).valid;

        if (canDoPour) {
          performPour(selectedIndex, clickedIdx);
        } else {
          const isTargetFull = targetBottle.layers.length >= TUBE_CAPACITY;
          const isColorMismatch =
            targetBottle.layers.length > 0 &&
            sourceBottle.layers.length > 0 &&
            targetBottle.layers[targetBottle.layers.length - 1] !==
              sourceBottle.layers[sourceBottle.layers.length - 1];

          if (isTargetFull || isColorMismatch) {
            triggerInvalidFeedback(clickedIdx);
            if (targetBottle.layers.length > 0 && !isTargetFull) {
              setSelectedIndex(clickedIdx);
            }
          } else if (targetBottle.layers.length === 0) {
            triggerInvalidFeedback(clickedIdx);
            setSelectedIndex(null);
          } else {
            if (targetBottle.layers.length > 0) {
              setSelectedIndex(clickedIdx);
              if (soundEnabled) soundManager.playSelect();
              if (vibrateEnabled) soundManager.vibrate(15);
            } else {
              triggerInvalidFeedback(clickedIdx);
              setSelectedIndex(null);
            }
          }
        }
      }
    },
    [selectedIndex, bottles, isWon, pourAnimation, leakAnimation, isAutoSolving, isDeadlocked, soundEnabled, vibrateEnabled, performPour, performLeak, triggerInvalidFeedback]
  );

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isAutoSolving || !!completionAnimation) return;
    const previousState = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setBottles(previousState);
    setMovesCount((m) => Math.max(0, m - 1));
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    if (pourRafRef.current) {
      cancelAnimationFrame(pourRafRef.current);
      pourRafRef.current = null;
    }
    setCompletionAnimation(null);
    setActiveGulpColor(null);

    // Sync collected colors & tube indices with restored state
    const restoredIndices: number[] = [];
    const restoredColors = new Set<string>();
    previousState.forEach((b, idx) => {
      if (isBottleComplete(b, TUBE_CAPACITY)) {
        restoredIndices.push(idx);
        restoredColors.add(b.layers[0]);
      }
    });
    setCollectedTubeIndices(restoredIndices);
    setCollectedColors(restoredColors);

    if (soundEnabled) soundManager.playUndo();
    if (vibrateEnabled) soundManager.vibrate(15);
  };

  // Shuffle Item Logic: Rearrange liquids in unfinished tubes
  const handleShuffle = () => {
    if (isWon || isAutoSolving || pourAnimation) return;

    const unfinishedIndices: number[] = [];
    const poolOfLiquids: string[] = [];

    bottles.forEach((bottle, idx) => {
      if (!isBottleComplete(bottle, TUBE_CAPACITY)) {
        unfinishedIndices.push(idx);
        poolOfLiquids.push(...bottle.layers);
      }
    });

    if (poolOfLiquids.length === 0 || unfinishedIndices.length <= 1) return;

    // Fisher-Yates shuffle
    const shuffled = [...poolOfLiquids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newBottles = bottles.map((b) => ({ ...b, layers: [...b.layers] }));
    let ptr = 0;
    unfinishedIndices.forEach((idx) => {
      const origCount = bottles[idx].layers.length;
      newBottles[idx].layers = shuffled.slice(ptr, ptr + origCount);
      ptr += origCount;
    });

    setHistory((prev) => [...prev, bottles.map((b) => ({ ...b, layers: [...b.layers] }))]);
    setBottles(newBottles);
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    if (soundEnabled) soundManager.playSelect();
    if (vibrateEnabled) soundManager.vibrate(30);
  };

  // Reset level
  const handleConfirmReset = () => {
    setResetConfirmOpen(false);
    setBottles(currentLevel.bottles.map((b) => ({ ...b, layers: [...b.layers] })));
    setHistory([]);
    setMovesCount(0);
    setExtraTubesAdded(0);
    setSelectedIndex(null);
    setHint(null);
    setIsWon(false);
    setIsDeadlocked(false);
    setCompletionAnimation(null);
    setActiveGulpColor(null);
    setCollectedTubeIndices([]);
    setCollectedColors(new Set());
    if (soundEnabled) soundManager.playUndo();
  };

  // Add extra empty tube
  const handleAddTube = () => {
    if (bottles.length >= 21 || isAutoSolving) return;
    setBottles((prev) => [
      ...prev,
      { id: `extra-${prev.length + 1}`, type: 'empty', capacity: TUBE_CAPACITY, layers: [] },
    ]);
    setExtraTubesAdded((c) => c + 1);
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    if (soundEnabled) soundManager.playSelect();
    if (vibrateEnabled) soundManager.vibrate(20);
  };

  // Auto-Solve loop
  const autoSolveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAutoSolving) {
      if (autoSolveTimerRef.current) clearInterval(autoSolveTimerRef.current);
      return;
    }

    if (isWon) {
      setIsAutoSolving(false);
      return;
    }

    autoSolveTimerRef.current = setTimeout(() => {
      const result = solveWaterSort(bottles, TUBE_CAPACITY, 25000);
      if (result.solvable && result.moves.length > 0) {
        const move = result.moves[0];
        if (move.kind === 'leak') {
          performLeak(move.from, move.to);
        } else {
          performPour(move.from, move.to);
        }
      } else {
        setIsAutoSolving(false);
      }
    }, 2350);

    return () => {
      if (autoSolveTimerRef.current) clearTimeout(autoSolveTimerRef.current);
    };
  }, [isAutoSolving, bottles, isWon, performPour, performLeak]);

  const handleNextLevel = () => {
    const currentId = typeof currentLevel.id === 'number' ? currentLevel.id : 0;
    const nextCurated = CURATED_LEVELS.find((l) => l.id === currentId + 1);
    if (nextCurated) {
      startLevel(nextCurated);
    } else {
      const generated = generateSolvableLevel({ numColors: 7, minSteps: 20 });
      if (generated) {
        startLevel(generated.level);
      } else {
        startLevel(CURATED_LEVELS[0]);
      }
    }
  };

  const handleGenerateProceduralLevel = (diff: Difficulty) => {
    const numColors = diff === 'easy' ? 4 : diff === 'medium' ? 6 : 8;
    const minSteps = diff === 'easy' ? 8 : diff === 'medium' ? 14 : 24;
    const generated = generateSolvableLevel({ numColors, minSteps });
    if (generated) {
      startLevel(generated.level);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative select-none bg-[#03081a]">
      {/* Background Starry Twilight (Reference Screenshot Match) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 68% 34% at 50% -2%, rgba(0, 139, 160, 0.4) 0%, rgba(9, 58, 105, 0.2) 48%, transparent 100%), linear-gradient(180deg, #06132e 0%, #081a39 56%, #050e24 100%)',
          }}
        />
        {/* Subtle twinkling stars across cosmic sky */}
        <span className="absolute top-[8%] left-[10%] text-sky-200/50 text-xs anim-twinkle">✦</span>
        <span className="absolute top-[5%] right-[12%] text-sky-200/40 text-sm anim-twinkle" style={{ animationDelay: '1.2s' }}>✦</span>
        <span className="absolute top-[26%] left-[4%] text-sky-300/35 text-xs anim-twinkle" style={{ animationDelay: '0.8s' }}>✦</span>
        <span className="absolute top-[28%] right-[8%] text-sky-300/30 text-xs anim-twinkle" style={{ animationDelay: '1.6s' }}>✦</span>
        <span className="absolute bottom-[22%] left-[8%] text-sky-200/40 text-xs anim-twinkle" style={{ animationDelay: '0.5s' }}>✦</span>
      </div>

      {/* Main Game Interface (Header -> Bags -> Central Game Area -> Hero Control Footer) */}
      <div className="relative z-10 flex flex-col justify-between flex-1 max-w-lg mx-auto w-full h-full overflow-hidden">
        {/* 1. Top Header: Settings, Level Capsule, Mobile Mini-App Pill */}
        <GameHeader
          currentLevel={currentLevel}
          onOpenLevelSelector={() => setLevelSelectorOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenRules={() => setRulesOpen(true)}
          onOpenMoreMenu={() => setLevelSelectorOpen(true)}
        />

        {/* 2. Top Gift Shopping Bags Rack (4 Bags from Reference Image) */}
        <div className="pt-0.5 pb-1">
          <ShoppingBags
            bottles={bottles}
            onUnlockBonus={handleAddTube}
            bonusUnlocked={extraTubesAdded > 0}
            activeGulpColor={activeGulpColor}
            collectedColors={collectedColors}
          />
        </div>

        {/* 3. Central Game Board (70% Visual Core) */}
        <main className="flex-1 min-h-0 flex flex-col items-stretch justify-start py-1 px-1">
          {/* Clean Hint callout banner if active */}
          {hint && (
            <div className="mb-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
              <span>💡 将 #{hint.from + 1} 瓶倒入 #{hint.to + 1} 瓶</span>
            </div>
          )}

          {isAutoSolving && (
            <div className="mb-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
              <span>⚡ 自动演示中...</span>
            </div>
          )}

          <GameBoard
            bottles={bottles}
            levelEntryId={levelEntryId}
            selectedIndex={selectedIndex}
            hint={hint}
            pourAnimation={pourAnimation}
            leakAnimation={leakAnimation}
            completionAnimation={completionAnimation}
            collectedTubeIndices={collectedTubeIndices}
            soundEnabled={soundEnabled}
            shakingTubeIndex={shakingTubeIndex}
            onTubeClick={handleTubeClick}
            disabled={isWon || isDeadlocked || !!completionAnimation}
          />
        </main>

        {/* 4. Bottom Hero Action Buttons: Shuffle & Undo (Exact Image Match) */}
        <footer className="relative z-20 -top-20 w-full">
          <ControlBar
            canUndo={history.length > 0}
            shuffleCount={1}
            onShuffle={handleShuffle}
            onUndo={handleUndo}
            disabled={isWon || isDeadlocked}
          />
        </footer>
      </div>

      {/* Deadlock Support Modal */}
      {isDeadlocked && !isWon && (
        <DeadlockModal
          onUndo={handleUndo}
          onReset={handleConfirmReset}
          canAddTube={bottles.length < 21}
          onAddTube={handleAddTube}
        />
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <ResetConfirmModal
          onConfirm={handleConfirmReset}
          onCancel={() => setResetConfirmOpen(false)}
        />
      )}

      {/* 3-Tier Hint Modal */}
      {activeHintData && (
        <HintModal
          hint={activeHintData}
          onUpgradeTier={() => {
            setActiveHintData((prev) =>
              prev ? { ...prev, tier: Math.min(3, prev.tier + 1) as 1 | 2 | 3 } : null
            );
          }}
          onApplyHighlight={() => {
            if (activeHintData) {
              setHint({
                from: activeHintData.fromTubeIndex,
                to: activeHintData.toTubeIndex,
              });
              setTimeout(() => {
                setHint(null);
              }, 6000);
            }
          }}
          onClose={() => setActiveHintData(null)}
        />
      )}

      {/* Victory Celebration Modal */}
      {isWon && (
        <WinModal
          levelTitle={currentLevel.title}
          movesCount={movesCount}
          optimalSteps={currentLevel.optimalSteps}
          onNextLevel={handleNextLevel}
          onReplay={handleConfirmReset}
          onSelectLevel={() => {
            setIsWon(false);
            setLevelSelectorOpen(true);
          }}
          hasNextLevel={
            typeof currentLevel.id === 'number' && currentLevel.id < CURATED_LEVELS.length
          }
        />
      )}

      {/* Level Selection Modal */}
      {levelSelectorOpen && (
        <LevelSelectorModal
          currentLevelId={currentLevel.id}
          stats={stats}
          onSelectLevel={startLevel}
          onGenerateLevel={handleGenerateProceduralLevel}
          onClose={() => setLevelSelectorOpen(false)}
        />
      )}

      {/* Level Workshop */}
      {workshopOpen && (
        <LevelWorkshop
          onLoadCustomLevel={startLevel}
          onClose={() => setWorkshopOpen(false)}
        />
      )}

      {/* Daily Challenge Modal */}
      {dailyOpen && (
        <DailyChallengeModal
          stats={stats}
          onPlayDaily={startLevel}
          onClose={() => setDailyOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          soundEnabled={soundEnabled}
          vibrateEnabled={vibrateEnabled}
          bgmEnabled={bgmEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundManager.enabled = next;
            savePreferences(next, vibrateEnabled, bgmEnabled);
          }}
          onToggleVibrate={() => {
            const next = !vibrateEnabled;
            setVibrateEnabled(next);
            savePreferences(soundEnabled, next, bgmEnabled);
          }}
          onToggleBgm={() => {
            const next = !bgmEnabled;
            setBgmEnabled(next);
            soundManager.setMusicEnabled(next);
            savePreferences(soundEnabled, vibrateEnabled, next);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {mechanicIntro && (
        <MechanicIntroModal
          data={mechanicIntro}
          onClose={() => setMechanicIntro(null)}
        />
      )}
    </div>
  );
}
