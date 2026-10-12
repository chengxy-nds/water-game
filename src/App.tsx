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
import { GameBoard, CompletionAnimationState, LeakAnimationState, getRowDistribution } from './components/GameBoard';
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
import { QuickDemo } from './components/QuickDemo';

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

// 提取关卡所有液体颜色，左边3个袋子随机抽取目标色，超出3个放入待补充队列
const initBagPool = (lvl: Level) => {
  const allColors: string[] = [];
  lvl.bottles.forEach((b) => {
    b.layers.forEach((c) => {
      if (!allColors.includes(c)) allColors.push(c);
    });
  });
  // 随机打乱
  const shuffled = [...allColors].sort(() => Math.random() - 0.5);
  const active: (string | null)[] = [
    shuffled[0] || null,
    shuffled[1] || null,
    shuffled[2] || null,
  ];
  const pending = shuffled.slice(3);
  return { active, pending };
};

export default function App() {
  // Current active level (Default to Level 1)
  const [currentLevel, setCurrentLevel] = useState<Level>(CURATED_LEVELS[0]);
  const [bottles, setBottles] = useState<Bottle[]>(() =>
    CURATED_LEVELS[0].bottles.map((b) => ({ ...b, layers: [...b.layers] }))
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

  // Shopping Bags Lifecycle: 3 dynamic bags on left, 1 ad video bonus bag on right
  const [activeBagColors, setActiveBagColors] = useState<(string | null)[]>(() => initBagPool(CURATED_LEVELS[0]).active);
  const [pendingBagColors, setPendingBagColors] = useState<string[]>(() => initBagPool(CURATED_LEVELS[0]).pending);
  const [liftingSlotIndex, setLiftingSlotIndex] = useState<number | null>(null);
  const [replenishingSlotIndex, setReplenishingSlotIndex] = useState<number | null>(null);
  const [unlockedBonusColor, setUnlockedBonusColor] = useState<string | null>(null);

  // Bottle Completion Celebration (Cork drop -> Whirl -> Fly -> Shopping Bag Gulp -> Hand Lift)
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
    const bagPool = initBagPool(lvl);
    setActiveBagColors(bagPool.active);
    setPendingBagColors(bagPool.pending);
    setLiftingSlotIndex(null);
    setReplenishingSlotIndex(null);
    setUnlockedBonusColor(null);
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

  // Bottle completed animation flow: Cork Pop -> Whirling -> Fly to Bag -> Bag Gulp -> Hand Lift-Away -> Bag Replenishment
  const handleBottleCompleted = useCallback(
    (
      targetTubeIdx: number,
      completedColor: string,
      isPuzzleComplete: boolean,
      finalMoves: number,
      newBottles: Bottle[]
    ) => {
      // 保证该目标色已在 activeBagColors 之中展示，以保证飞入目标精准存在
      setActiveBagColors((prevActive) => {
        if (prevActive.includes(completedColor)) return prevActive;
        const replaceIdx = prevActive.findIndex((c) => !c || !collectedColors.has(c));
        const targetIdx = replaceIdx !== -1 ? replaceIdx : 0;
        const oldColor = prevActive[targetIdx];
        const next = [...prevActive];
        next[targetIdx] = completedColor;
        setPendingBagColors((prevPending) => {
          const filtered = prevPending.filter((c) => c !== completedColor);
          if (oldColor) filtered.push(oldColor);
          return filtered;
        });
        return next;
      });

      // 1. Cork Drop: 木塞塞入瓶口
      setTimeout(() => {
        if (soundEnabled) soundManager.playCorkPop();
        setCompletionAnimation({
          tubeIndex: targetTubeIdx,
          colorId: completedColor,
          phase: 'cork_drop',
          flyX: 0,
          flyY: 0,
        });
      }, 300);

      // 2. Whirling: 闪烁粒子光环围绕瓶身旋转
      setTimeout(() => {
        if (soundEnabled) soundManager.playTubeComplete();
        setCompletionAnimation((prev) =>
          prev ? { ...prev, phase: 'whirling' } : null
        );
      }, 750);

      // 3. Flying: 瓶子起飞滑向对应的购物袋
      setTimeout(() => {
        const { flyX, flyY } = calculateFlyVector(targetTubeIdx, completedColor);
        setCompletionAnimation((prev) =>
          prev ? { ...prev, phase: 'flying', flyX, flyY } : null
        );
      }, 1450);

      // 4. Bag Gulp: 购物袋弹性吞咽并将瓶子收纳
      setTimeout(() => {
        if (soundEnabled) soundManager.playBagCatch();
        setActiveGulpColor(completedColor);
        setCollectedTubeIndices((prev) => [...prev, targetTubeIdx]);
        setCompletionAnimation(null);
      }, 2100);

      // 5. Hand Grab & Lift Away: 一只手伸出抓紧提绳，向上将该购物袋拎走飞出屏幕
      setTimeout(() => {
        setActiveGulpColor(null);
        setActiveBagColors((curActive) => {
          const slotIdx = curActive.indexOf(completedColor);
          if (slotIdx !== -1) {
            setLiftingSlotIndex(slotIdx);
            if (soundEnabled) soundManager.playTubeComplete();
          } else if (unlockedBonusColor === completedColor) {
            setLiftingSlotIndex(3);
            if (soundEnabled) soundManager.playTubeComplete();
          }
          return curActive;
        });
      }, 2500);

      // 6. Bag Replenishment: 购物袋被拎走后，从待收集池中补充新购物袋弹入该槽位
      setTimeout(() => {
        setLiftingSlotIndex((currentLifting) => {
          const slotIdx = currentLifting;
          if (slotIdx !== null) {
            setCollectedColors((prev) => new Set(prev).add(completedColor));

            if (slotIdx === 3) {
              // 第 4 槽位完成收集，重置该槽位
              setUnlockedBonusColor(null);
            } else {
              setPendingBagColors((prevPending) => {
                let nextColor: string | null = null;
                let newPending = [...prevPending];
                if (newPending.length > 0) {
                  nextColor = newPending[0];
                  newPending = newPending.slice(1);
                }

                setActiveBagColors((prevActive) => {
                  const nextActive = [...prevActive];
                  nextActive[slotIdx] = nextColor;
                  return nextActive;
                });

                if (nextColor) {
                  setReplenishingSlotIndex(slotIdx);
                  setTimeout(() => {
                    setReplenishingSlotIndex(null);
                  }, 550);
                }

                return newPending;
              });
            }
          }
          return null;
        });

        // 7. 结算胜负或死锁检测
        if (isPuzzleComplete) {
          triggerWinCelebration(finalMoves);
        } else {
          const hasMove = hasAnyLegalMove(newBottles, TUBE_CAPACITY);
          if (!hasMove) {
            setIsDeadlocked(true);
          }
        }
      }, 3250);
    },
    [soundEnabled, calculateFlyVector, collectedColors, triggerWinCelebration]
  );

  const performPour = useCallback(
    (fromIdx: number, toIdx: number) => {
      const check = canPour(bottles[fromIdx], bottles[toIdx], TUBE_CAPACITY);
      if (!check.valid || !check.color) return false;

      // Measure exact DOM positions of both static tube slots
      const sSlot = document.getElementById(`tube-slot-${fromIdx}`);
      const tSlot = document.getElementById(`tube-slot-${toIdx}`);

      const rowSizes = getRowDistribution(bottles.length);
      const getTubeRowCol = (idx: number) => {
        let accumulated = 0;
        for (let r = 0; r < rowSizes.length; r++) {
          if (idx < accumulated + rowSizes[r]) {
            return { row: r, col: idx - accumulated };
          }
          accumulated += rowSizes[r];
        }
        return { row: 0, col: idx };
      };

      const fromPos = getTubeRowCol(fromIdx);
      const toPos = getTubeRowCol(toIdx);

      let exactX = (toPos.col - fromPos.col) * 65;
      let exactY = (toPos.row - fromPos.row) * 180 - 20;
      let isTargetRight = toPos.col >= fromPos.col;

      // Tilt magnitude follows how much liquid the source tube currently holds
      const sourceUnits = bottles[fromIdx].layers.length;
      const tiltForUnits = (units: number) => {
        const u = Math.max(1, Math.min(4, Math.round(units)));
        const baseAngles: Record<number, number> = {
          4: 55,
          3: 66,
          2: 76,
          1: 86,
        };
        return baseAngles[u] || 75;
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
            handleBottleCompleted(toIdx, completedColor, isPuzzleComplete, finalMoves, result.newBottles);
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
    [bottles, soundEnabled, vibrateEnabled, movesCount, handleBottleCompleted, triggerWinCelebration]
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
          handleBottleCompleted(targetIdx, completedColor, isPuzzleComplete, finalMoves, result.newBottles);
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
    [bottles, soundEnabled, vibrateEnabled, movesCount, handleBottleCompleted, triggerWinCelebration]
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
            if (canLeak(sourceBottle, targetBottle, TUBE_CAPACITY, selectedIndex, clickedIdx, bottles)) {
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
    if (history.length === 0 || isAutoSolving || !!completionAnimation || liftingSlotIndex !== null) return;
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
    const bagPool = initBagPool(currentLevel);
    setActiveBagColors(bagPool.active);
    setPendingBagColors(bagPool.pending);
    setLiftingSlotIndex(null);
    setReplenishingSlotIndex(null);
    setUnlockedBonusColor(null);
    if (soundEnabled) soundManager.playUndo();
  };

  // Add extra empty tube & unlock bonus bag color
  const handleAddTube = () => {
    if (bottles.length >= 21 || isAutoSolving) return;
    setBottles((prev) => [
      ...prev,
      { id: `extra-${prev.length + 1}`, type: 'empty', capacity: TUBE_CAPACITY, layers: [] },
    ]);
    setExtraTubesAdded((c) => c + 1);

    // 看完视频解锁一个具体颜色：优先取待收集池中的下一色，或关卡未完成颜色
    if (!unlockedBonusColor) {
      let chosenColor: string | null = null;
      if (pendingBagColors.length > 0) {
        chosenColor = pendingBagColors[0];
        setPendingBagColors((prev) => prev.slice(1));
      } else {
        const levelColors = Array.from(new Set(currentLevel.bottles.flatMap((b) => b.layers)));
        const uncollected = levelColors.filter((c) => !collectedColors.has(c));
        chosenColor = uncollected.length > 0 ? uncollected[0] : (levelColors[0] || 'yellow');
      }
      setUnlockedBonusColor(chosenColor);
    }

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

  const handleHint = () => {
    soundManager.playClick();
    const result = solveWaterSort(bottles, TUBE_CAPACITY, 25000);
    if (result.solvable && result.moves.length > 0) {
      const move = result.moves[0];
      setHint({ from: move.from, to: move.to });
      setTimeout(() => {
        setHint(null);
      }, 5000);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative select-none bg-[#0A0F2E]">
      {/* Background Starry Twilight (Figma Frame 2:934 Match) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #0A0F2E 0%, #0D1535 50%, #080E28 100%)',
          }}
        />
        {/* Subtle twinkling stars across cosmic sky */}
        <span className="absolute top-[8%] left-[10%] text-sky-200/50 text-xs anim-twinkle">✦</span>
        <span className="absolute top-[5%] right-[12%] text-sky-200/40 text-sm anim-twinkle" style={{ animationDelay: '1.2s' }}>✦</span>
        <span className="absolute top-[26%] left-[4%] text-sky-300/35 text-xs anim-twinkle" style={{ animationDelay: '0.8s' }}>✦</span>
        <span className="absolute top-[28%] right-[8%] text-sky-300/30 text-xs anim-twinkle" style={{ animationDelay: '1.6s' }}>✦</span>
        <span className="absolute bottom-[22%] left-[8%] text-sky-200/40 text-xs anim-twinkle" style={{ animationDelay: '0.5s' }}>✦</span>
      </div>

      {/* Main Game Interface matching Figma 2:934 (瓶中有序 · 游戏主界面) */}
      <div className="relative z-10 flex flex-col justify-between flex-1 max-w-[430px] mx-auto w-full h-full overflow-hidden">
        {/* 1. Top Header: Settings, Level Capsule, Daily Challenge */}
        <GameHeader
          currentLevel={currentLevel}
          movesCount={movesCount}
          coins={280}
          onOpenLevelSelector={() => setLevelSelectorOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenChallenge={() => setDailyOpen(true)}
          onBack={() => setLevelSelectorOpen(true)}
        />

        {/* 2. Top Gift Shopping Bags Rack: 3 Dynamic Bags + 1 Video Unlock Bag */}
        <div className="pt-0 pb-1 flex-shrink-0">
          <ShoppingBags
            activeBagColors={activeBagColors}
            liftingSlotIndex={liftingSlotIndex}
            replenishingSlotIndex={replenishingSlotIndex}
            activeGulpColor={activeGulpColor}
            collectedColors={collectedColors}
            onUnlockBonus={handleAddTube}
            bonusUnlocked={extraTubesAdded > 0}
            unlockedBonusColor={unlockedBonusColor}
          />
        </div>

        {/* 3. Central Game Board (Shelves with bottles and guidance tip bar) */}
        <main className="flex-1 min-h-0 flex flex-col items-stretch justify-center py-1 px-1">
          {/* Clean Hint callout banner if active */}
          {hint && (
            <div className="mb-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse mx-auto">
              <span>💡 将 #{hint.from + 1} 瓶倒入 #{hint.to + 1} 瓶</span>
            </div>
          )}

          {isAutoSolving && (
            <div className="mb-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse mx-auto">
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

        {/* 3. Bottom Hero Action Buttons: 4 Control Buttons */}
        <footer className="relative z-20 pb-3 w-full flex flex-col items-center">
          <ControlBar
            canUndo={history.length > 0}
            onUndo={handleUndo}
            onRestart={() => setResetConfirmOpen(true)}
            onHint={handleHint}
            onAddTube={handleAddTube}
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
