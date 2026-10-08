import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tube, Level, PlayerStats, Difficulty } from './types/game';
import { CURATED_LEVELS } from './data/curatedLevels';
import {
  canPour,
  executePour,
  isPuzzleSolved,
  isTubeComplete,
  solveWaterSort,
  hasAnyLegalMove,
  TUBE_CAPACITY,
} from './solver/waterSortSolver';
import { generateSolvableLevel } from './generator/levelGenerator';
import { soundManager } from './utils/audio';

import { GameHeader } from './components/GameHeader';
import { ShoppingBags } from './components/ShoppingBags';
import { GameBoard, CompletionAnimationState } from './components/GameBoard';
import { ControlBar } from './components/ControlBar';
import { WinModal } from './components/WinModal';
import { LevelSelectorModal } from './components/LevelSelectorModal';
import { LevelWorkshop } from './components/LevelWorkshop';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { SettingsModal } from './components/SettingsModal';
import { DeadlockModal } from './components/DeadlockModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { HintModal, HintData } from './components/HintModal';

const STATS_STORAGE_KEY = 'water_sort_player_stats_v1';
const PREFS_STORAGE_KEY = 'water_sort_preferences_v1';

export default function App() {
  // Current active level (Default to Level 2 matching reference screenshot)
  const [currentLevel, setCurrentLevel] = useState<Level>(CURATED_LEVELS[1]);
  const [tubes, setTubes] = useState<Tube[]>(() =>
    CURATED_LEVELS[1].tubes.map((t) => [...t])
  );

  // History for Undo
  const [history, setHistory] = useState<Tube[][]>([]);
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

  // Modals
  const [levelSelectorOpen, setLevelSelectorOpen] = useState<boolean>(false);
  const [workshopOpen, setWorkshopOpen] = useState<boolean>(false);
  const [dailyOpen, setDailyOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [showSymbols, setShowSymbols] = useState<boolean>(false);

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
        if (parsed.showSymbols !== undefined) setShowSymbols(parsed.showSymbols);
      }
    } catch {
      // ignore
    }
  }, []);

  const savePreferences = (sound: boolean, vib: boolean, sym: boolean) => {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ soundEnabled: sound, vibrateEnabled: vib, showSymbols: sym })
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
    setCurrentLevel(lvl);
    setTubes(lvl.tubes.map((t) => [...t]));
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
    setCompletionAnimation(null);
    setActiveGulpColor(null);
    setCollectedTubeIndices([]);
    setCollectedColors(new Set());
  }, []);

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
      const check = canPour(tubes[fromIdx], tubes[toIdx], TUBE_CAPACITY);
      if (!check.valid || !check.color) return false;

      // Measure exact DOM positions of both static tube slots
      const sSlot = document.getElementById(`tube-slot-${fromIdx}`);
      const tSlot = document.getElementById(`tube-slot-${toIdx}`);

      const numTubes = tubes.length;
      const isMultiRow = numTubes > 6;
      const rowSplit = isMultiRow ? (numTubes === 11 ? 5 : Math.ceil(numTubes / 2)) : numTubes;

      const fromRow = Math.floor(fromIdx / rowSplit);
      const fromCol = fromIdx % rowSplit;
      const toRow = Math.floor(toIdx / rowSplit);
      const toCol = toIdx % rowSplit;

      let exactX = (toCol - fromCol) * 65;
      let exactY = (toRow - fromRow) * 200 - 20;
      let tiltAngle = toCol >= fromCol ? 72 : -72;

      if (sSlot && tSlot) {
        const sBox = sSlot.getBoundingClientRect();
        const tBox = tSlot.getBoundingClientRect();

        const sScaleY = sBox.height / 150;
        const tScaleY = tBox.height / 150;
        const sMouthX = sBox.left + sBox.width * 0.5;
        const sMouthY = sBox.top + 9 * sScaleY;
        const tMouthX = tBox.left + tBox.width * 0.5;
        const tMouthY = tBox.top + 9 * tScaleY;

        const isTargetRight = tMouthX >= sMouthX;
        tiltAngle = isTargetRight ? 72 : -72;

        // When tilted 72deg, the lower mouth lip rotates downwards and outwards.
        // Align the pouring mouth lip directly touching the target bottle mouth rim!
        exactX = (tMouthX - sMouthX) - (isTargetRight ? 11 : -11);
        exactY = (tMouthY - sMouthY) - 15;
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

      // Phase 2: Tilt, spout water stream with mouths touching (Extended to 1100ms for slow observation)
      setTimeout(() => {
        setPourAnimation({
          sourceIndex: fromIdx,
          targetIndex: toIdx,
          colorId: check.color!,
          count: check.count,
          phase: 'pouring',
          tiltAngle,
          translateX: exactX,
          translateY: exactY,
          drainCount: 0.85,
          riseCount: 0.85,
        });

        if (vibrateEnabled) soundManager.vibrate(35);
      }, 450);

      // Phase 3: Finish liquid stream, commit state change and return
      setTimeout(() => {
        const result = executePour(tubes, fromIdx, toIdx, TUBE_CAPACITY);
        if (result) {
          const finalMoves = movesCount + 1;
          setHistory((prev) => [...prev, tubes.map((t) => [...t])]);
          setTubes(result.newTubes);
          setMovesCount(finalMoves);

          const isTargetComplete = isTubeComplete(result.newTubes[toIdx], TUBE_CAPACITY);
          const isPuzzleComplete = isPuzzleSolved(result.newTubes, TUBE_CAPACITY);

          if (isTargetComplete) {
            const completedColor = result.newTubes[toIdx][0];

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
                const hasMove = hasAnyLegalMove(result.newTubes, TUBE_CAPACITY);
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
              const hasMove = hasAnyLegalMove(result.newTubes, TUBE_CAPACITY);
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
    [tubes, soundEnabled, vibrateEnabled, movesCount, calculateFlyVector, triggerWinCelebration]
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
      if (isWon || pourAnimation || isAutoSolving || isDeadlocked) return;

      if (selectedIndex === null) {
        if (tubes[clickedIdx].length === 0) {
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
        const sourceTube = tubes[selectedIndex];
        const targetTube = tubes[clickedIdx];
        const canDoPour = canPour(sourceTube, targetTube, TUBE_CAPACITY).valid;

        if (canDoPour) {
          performPour(selectedIndex, clickedIdx);
        } else {
          const isTargetFull = targetTube.length >= TUBE_CAPACITY;
          const isColorMismatch =
            targetTube.length > 0 &&
            sourceTube.length > 0 &&
            targetTube[targetTube.length - 1] !== sourceTube[sourceTube.length - 1];

          if (isTargetFull || isColorMismatch) {
            triggerInvalidFeedback(clickedIdx);
            if (targetTube.length > 0 && !isTargetFull) {
              setSelectedIndex(clickedIdx);
            }
          } else if (targetTube.length === 0) {
            triggerInvalidFeedback(clickedIdx);
            setSelectedIndex(null);
          } else {
            if (targetTube.length > 0) {
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
    [selectedIndex, tubes, isWon, pourAnimation, isAutoSolving, isDeadlocked, soundEnabled, vibrateEnabled, performPour, triggerInvalidFeedback]
  );

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isAutoSolving || !!completionAnimation) return;
    const previousState = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setTubes(previousState);
    setMovesCount((m) => Math.max(0, m - 1));
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    setCompletionAnimation(null);
    setActiveGulpColor(null);

    // Sync collected colors & tube indices with restored state
    const restoredIndices: number[] = [];
    const restoredColors = new Set<string>();
    previousState.forEach((t, idx) => {
      if (isTubeComplete(t, TUBE_CAPACITY)) {
        restoredIndices.push(idx);
        restoredColors.add(t[0]);
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

    tubes.forEach((tube, idx) => {
      if (!isTubeComplete(tube, TUBE_CAPACITY)) {
        unfinishedIndices.push(idx);
        poolOfLiquids.push(...tube);
      }
    });

    if (poolOfLiquids.length === 0 || unfinishedIndices.length <= 1) return;

    // Fisher-Yates shuffle
    const shuffled = [...poolOfLiquids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newTubes = tubes.map((t) => [...t]);
    let ptr = 0;
    unfinishedIndices.forEach((idx) => {
      const origCount = tubes[idx].length;
      newTubes[idx] = shuffled.slice(ptr, ptr + origCount);
      ptr += origCount;
    });

    setHistory((prev) => [...prev, tubes.map((t) => [...t])]);
    setTubes(newTubes);
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    if (soundEnabled) soundManager.playSelect();
    if (vibrateEnabled) soundManager.vibrate(30);
  };

  // Reset level
  const handleConfirmReset = () => {
    setResetConfirmOpen(false);
    setTubes(currentLevel.tubes.map((t) => [...t]));
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
    if (extraTubesAdded >= 2 || tubes.length >= 14 || isAutoSolving) return;
    setTubes((prev) => [...prev, []]);
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
      const result = solveWaterSort(tubes, TUBE_CAPACITY, 25000);
      if (result.solvable && result.moves.length > 0) {
        const move = result.moves[0];
        performPour(move.from, move.to);
      } else {
        setIsAutoSolving(false);
      }
    }, 2350);

    return () => {
      if (autoSolveTimerRef.current) clearTimeout(autoSolveTimerRef.current);
    };
  }, [isAutoSolving, tubes, isWon, performPour]);

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
            background: 'radial-gradient(circle at 50% 30%, #0d2155 0%, #07153b 50%, #020718 100%)',
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
          onOpenMoreMenu={() => setLevelSelectorOpen(true)}
        />

        {/* 2. Top Gift Shopping Bags Rack (4 Bags from Reference Image) */}
        <div className="pt-0.5 pb-1">
          <ShoppingBags
            tubes={tubes}
            onUnlockBonus={handleAddTube}
            bonusUnlocked={extraTubesAdded > 0}
            activeGulpColor={activeGulpColor}
            collectedColors={collectedColors}
          />
        </div>

        {/* 3. Central Game Board (70% Visual Core) */}
        <main className="flex-1 flex flex-col items-center justify-center py-1 px-1">
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
            tubes={tubes}
            selectedIndex={selectedIndex}
            hint={hint}
            pourAnimation={pourAnimation}
            completionAnimation={completionAnimation}
            collectedTubeIndices={collectedTubeIndices}
            showSymbols={showSymbols}
            soundEnabled={soundEnabled}
            shakingTubeIndex={shakingTubeIndex}
            onTubeClick={handleTubeClick}
            disabled={isWon || isDeadlocked || !!completionAnimation}
          />
        </main>

        {/* 4. Bottom Hero Action Buttons: Shuffle & Undo (Exact Image Match) */}
        <footer className="w-full">
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
          canAddTube={extraTubesAdded < 2 && tubes.length < 14}
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
          showSymbols={showSymbols}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundManager.enabled = next;
            savePreferences(next, vibrateEnabled, showSymbols);
          }}
          onToggleVibrate={() => {
            const next = !vibrateEnabled;
            setVibrateEnabled(next);
            savePreferences(soundEnabled, next, showSymbols);
          }}
          onToggleSymbols={() => {
            const next = !showSymbols;
            setShowSymbols(next);
            savePreferences(soundEnabled, vibrateEnabled, next);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
