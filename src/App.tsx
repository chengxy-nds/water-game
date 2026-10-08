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
import { GiftBagsBar } from './components/GiftBagsBar';
import { GameBoard } from './components/GameBoard';
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
  // Current active level
  const [currentLevel, setCurrentLevel] = useState<Level>(CURATED_LEVELS[0]);
  const [tubes, setTubes] = useState<Tube[]>(() =>
    CURATED_LEVELS[0].tubes.map((t) => [...t])
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

  // Rule 10: Lightweight Invalid Operation Feedback (tube shake & soft acoustic feedback)
  const [shakingTubeIndex, setShakingTubeIndex] = useState<number | null>(null);

  // Rule 15 & 16: Deadlock detection state
  const [isDeadlocked, setIsDeadlocked] = useState<boolean>(false);

  // Rule 18: Reset confirmation modal state
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  // Rule 19 & 20: 3-Tier Hint Modal state
  const [activeHintData, setActiveHintData] = useState<HintData | null>(null);

  // Pouring Animation state with multi-phase fluid physics
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

  // Save preferences
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

  // Save stats
  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  // Start a specific level
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
  }, []);

  // Total stars collected
  const starsCollected = Object.values(stats.completedLevels).reduce(
    (sum, record) => sum + record.stars,
    0
  );

  // Handle Pour action with physical 4-stage liquid animation
  const performPour = useCallback(
    (fromIdx: number, toIdx: number) => {
      const check = canPour(tubes[fromIdx], tubes[toIdx], TUBE_CAPACITY);
      if (!check.valid || !check.color) return false;

      const numTubes = tubes.length;
      const isMultiRow = numTubes > 6;
      const rowSplit = isMultiRow ? Math.ceil(numTubes / 2) : numTubes;

      const fromRow = Math.floor(fromIdx / rowSplit);
      const fromCol = fromIdx % rowSplit;
      const toRow = Math.floor(toIdx / rowSplit);
      const toCol = toIdx % rowSplit;

      const isTargetRight = toCol >= fromCol;
      const tiltAngle = isTargetRight ? 68 : -68;
      const deltaX = (toCol - fromCol) * 80 + (isTargetRight ? 36 : -36);
      const deltaY = (toRow - fromRow) * 230 - 50;

      // Phase 1: Fly and align above target tube lip
      setPourAnimation({
        sourceIndex: fromIdx,
        targetIndex: toIdx,
        colorId: check.color,
        count: check.count,
        phase: 'flying',
        tiltAngle: tiltAngle * 0.4,
        translateX: deltaX * 0.7,
        translateY: deltaY - 20,
        drainCount: 0,
        riseCount: 0,
      });

      if (vibrateEnabled) soundManager.vibrate(20);

        // Phase 2: Tilt, spout water stream and dynamic liquid exchange
      setTimeout(() => {
        setPourAnimation({
          sourceIndex: fromIdx,
          targetIndex: toIdx,
          colorId: check.color!,
          count: check.count,
          phase: 'pouring',
          tiltAngle,
          translateX: deltaX,
          translateY: deltaY,
          drainCount: 0.85,
          riseCount: 0.85,
        });

        // Dynamic physical water stream sound is triggered in GameBoard during 'pouring' phase based on liquid volume
        if (vibrateEnabled) soundManager.vibrate(35);
      }, 220);

      // Phase 3: Finish liquid stream, commit state change and return
      setTimeout(() => {
        const result = executePour(tubes, fromIdx, toIdx, TUBE_CAPACITY);
        if (result) {
          // Save history
          setHistory((prev) => [...prev, tubes.map((t) => [...t])]);
          setTubes(result.newTubes);
          setMovesCount((m) => m + 1);

          // Check if target tube is now full & monochromatic
          if (isTubeComplete(result.newTubes[toIdx], TUBE_CAPACITY)) {
            if (soundEnabled) soundManager.playTubeComplete();
          }

          // Check for victory
          if (isPuzzleSolved(result.newTubes, TUBE_CAPACITY)) {
            setIsWon(true);
            setIsAutoSolving(false);

            const finalSteps = movesCount + 1;
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
          } else {
            // Check for Deadlock (Section 15 & 16: No valid moves remaining, and not yet won)
            const hasMove = hasAnyLegalMove(result.newTubes, TUBE_CAPACITY);
            if (!hasMove) {
              setTimeout(() => {
                setIsDeadlocked(true);
              }, 400);
            }
          }
        }

        // Return tube smoothly
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
      }, 640);

      // Phase 4: Settle tube back to rack
      setTimeout(() => {
        setPourAnimation(null);
        setSelectedIndex(null);
        setHint(null);
      }, 880);

      return true;
    },
    [tubes, soundEnabled, vibrateEnabled, movesCount, currentLevel, stats]
  );

  // Helper to trigger Section 10 lightweight invalid operation feedback:
  // - Target bottle gently shakes horizontally (anim-invalid-shake)
  // - Soft non-intrusive sound tone
  // - Gentle haptic vibration
  // - Step count does NOT increase
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

  // Tube click handler
  const handleTubeClick = useCallback(
    (clickedIdx: number) => {
      if (isWon || pourAnimation || isAutoSolving || isDeadlocked) return;

      if (selectedIndex === null) {
        // First click: Select tube
        if (tubes[clickedIdx].length === 0) {
          // Rule 9.2: Empty bottle cannot be poured from
          triggerInvalidFeedback(clickedIdx);
          return;
        }
        setSelectedIndex(clickedIdx);
        if (soundEnabled) soundManager.playSelect();
        if (vibrateEnabled) soundManager.vibrate(15);
      } else if (selectedIndex === clickedIdx) {
        // Rule 9.1: Pour into self is ignored / deselects
        setSelectedIndex(null);
        if (soundEnabled) soundManager.playSelect();
      } else {
        // Second click: Attempt pour from selectedIndex to clickedIdx
        const sourceTube = tubes[selectedIndex];
        const targetTube = tubes[clickedIdx];
        const canDoPour = canPour(sourceTube, targetTube, TUBE_CAPACITY).valid;

        if (canDoPour) {
          performPour(selectedIndex, clickedIdx);
        } else {
          // Section 9: Check reasons why it cannot pour:
          // 9.3: Pour into full bottle
          // 9.4: Color mismatch
          const isTargetFull = targetTube.length >= TUBE_CAPACITY;
          const isColorMismatch =
            targetTube.length > 0 &&
            sourceTube.length > 0 &&
            targetTube[targetTube.length - 1] !== sourceTube[sourceTube.length - 1];

          if (isTargetFull || isColorMismatch) {
            // Trigger lightweight invalid shake on target bottle
            triggerInvalidFeedback(clickedIdx);
            // If clicked tube has water and is not full, user might have wanted to select it instead
            if (targetTube.length > 0 && !isTargetFull) {
              setSelectedIndex(clickedIdx);
            }
          } else if (targetTube.length === 0) {
            // Target is empty but pour invalid (e.g. source empty or monochromatic redundant)
            triggerInvalidFeedback(clickedIdx);
            setSelectedIndex(null);
          } else {
            // General invalid switch
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

  // Section 17: Undo move (Section 17.2: Undo restores movesCount to previous effective state)
  const handleUndo = () => {
    if (history.length === 0 || isAutoSolving) return;
    const previousState = history[history.length - 1];
    setHistory((h) => h.slice(0, h.length - 1));
    setTubes(previousState);
    setMovesCount((m) => Math.max(0, m - 1));
    setSelectedIndex(null);
    setHint(null);
    setIsDeadlocked(false);
    if (soundEnabled) soundManager.playUndo();
    if (vibrateEnabled) soundManager.vibrate(15);
  };

  // Section 18: Reset level (Opens confirmation modal first)
  const handleRequestReset = () => {
    if (isAutoSolving) setIsAutoSolving(false);
    setResetConfirmOpen(true);
  };

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

  // Section 19 & 20: 3-Tier Hint System powered by Solver
  const handleHint = () => {
    if (isWon || isAutoSolving) return;

    // Run solver on current board state
    const result = solveWaterSort(tubes, TUBE_CAPACITY, 35000);
    if (result.solvable && result.moves.length > 0) {
      const nextMove = result.moves[0];
      const fromTube = tubes[nextMove.from];
      const colorId = fromTube && fromTube.length > 0 ? fromTube[fromTube.length - 1] : nextMove.colorId;

      setActiveHintData({
        tier: 1, // Start with Tier 1 (Direction hint)
        colorId,
        fromTubeIndex: nextMove.from,
        toTubeIndex: nextMove.to,
      });

      if (soundEnabled) soundManager.playSelect();

      // Record hints used in stats
      saveStats({
        ...stats,
        hintsUsedTotal: stats.hintsUsedTotal + 1,
      });
    } else {
      if (soundEnabled) soundManager.playError();
    }
  };

  // Auto-Solve loop
  const autoSolveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleAutoSolve = () => {
    if (isAutoSolving) {
      setIsAutoSolving(false);
      if (autoSolveTimerRef.current) clearInterval(autoSolveTimerRef.current);
    } else {
      setIsAutoSolving(true);
    }
  };

  useEffect(() => {
    if (!isAutoSolving) {
      if (autoSolveTimerRef.current) clearInterval(autoSolveTimerRef.current);
      return;
    }

    if (isWon) {
      setIsAutoSolving(false);
      return;
    }

    // Step the solver once every 980ms to allow smooth physical pouring
    autoSolveTimerRef.current = setTimeout(() => {
      const result = solveWaterSort(tubes, TUBE_CAPACITY, 25000);
      if (result.solvable && result.moves.length > 0) {
        const move = result.moves[0];
        performPour(move.from, move.to);
      } else {
        // Done or unsolvable
        setIsAutoSolving(false);
      }
    }, 980);

    return () => {
      if (autoSolveTimerRef.current) clearTimeout(autoSolveTimerRef.current);
    };
  }, [isAutoSolving, tubes, isWon, performPour]);

  // Next level navigation
  const handleNextLevel = () => {
    const currentId = typeof currentLevel.id === 'number' ? currentLevel.id : 0;
    const nextCurated = CURATED_LEVELS.find((l) => l.id === currentId + 1);
    if (nextCurated) {
      startLevel(nextCurated);
    } else {
      // Reached end of curated, generate a challenging level
      const generated = generateSolvableLevel({ numColors: 7, minSteps: 20 });
      if (generated) {
        startLevel(generated.level);
      } else {
        startLevel(CURATED_LEVELS[0]);
      }
    }
  };

  // Generate procedural level
  const handleGenerateProceduralLevel = (diff: Difficulty) => {
    const numColors = diff === 'easy' ? 4 : diff === 'medium' ? 6 : 8;
    const minSteps = diff === 'easy' ? 8 : diff === 'medium' ? 14 : 24;
    const generated = generateSolvableLevel({ numColors, minSteps });
    if (generated) {
      startLevel(generated.level);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060b18] text-slate-100 flex flex-col justify-between overflow-x-hidden relative selection:bg-cyan-500 selection:text-slate-900">
      {/* Background ambient lighting & starry sparkles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/15 via-sky-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[120px]" />

        {/* Scattered 4-point twinkle stars (Reference Match!) */}
        <div className="absolute top-12 left-10 text-cyan-200/40 text-xs anim-twinkle">✦</div>
        <div className="absolute top-28 right-16 text-sky-200/30 text-sm anim-twinkle" style={{ animationDelay: '1.2s' }}>✦</div>
        <div className="absolute top-1/3 left-8 text-blue-200/40 text-[10px] anim-twinkle" style={{ animationDelay: '0.6s' }}>✦</div>
        <div className="absolute top-1/2 right-12 text-cyan-100/35 text-xs anim-twinkle" style={{ animationDelay: '1.8s' }}>✦</div>
        <div className="absolute bottom-28 left-20 text-indigo-200/40 text-[10px] anim-twinkle" style={{ animationDelay: '2.1s' }}>✦</div>
        <div className="absolute bottom-40 right-24 text-sky-200/30 text-xs anim-twinkle" style={{ animationDelay: '0.9s' }}>✦</div>
      </div>

      {/* Main Game Interface */}
      <div className="relative z-10 flex flex-col justify-between flex-1 max-w-5xl mx-auto w-full">
        {/* Header */}
        <GameHeader
          currentLevel={currentLevel}
          movesCount={movesCount}
          optimalSteps={currentLevel.optimalSteps}
          starsCollected={starsCollected}
          totalLevelsCount={CURATED_LEVELS.length}
          onOpenLevelSelector={() => setLevelSelectorOpen(true)}
          onOpenDaily={() => setDailyOpen(true)}
          onOpenWorkshop={() => setWorkshopOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Top Packaging Gift Bags Goal Bar (Matching Reference Image 1 & 3) */}
        <GiftBagsBar tubes={tubes} />

        {/* Central Game Board */}
        <main className="flex-1 flex flex-col items-center justify-center my-auto py-2">
          {/* Hint callout banner if active */}
          {hint && (
            <div className="mb-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <span>💡 Solver 提示：将 #{hint.from + 1} 倒入 #{hint.to + 1}</span>
            </div>
          )}

          {isAutoSolving && (
            <div className="mb-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <span>⚡ 自动演示中... (点击下方“暂停”随时接管)</span>
            </div>
          )}

          <GameBoard
            tubes={tubes}
            selectedIndex={selectedIndex}
            hint={hint}
            pourAnimation={pourAnimation}
            showSymbols={showSymbols}
            soundEnabled={soundEnabled}
            shakingTubeIndex={shakingTubeIndex}
            onTubeClick={handleTubeClick}
            disabled={isWon || isDeadlocked}
          />
        </main>

        {/* Footer / Controls */}
        <footer className="pb-4 pt-2">
          <ControlBar
            canUndo={history.length > 0}
            canAddTube={extraTubesAdded < 2 && tubes.length < 14}
            extraTubesAdded={extraTubesAdded}
            isAutoSolving={isAutoSolving}
            isHintActive={!!hint || !!activeHintData}
            onUndo={handleUndo}
            onReset={handleRequestReset}
            onAddTube={handleAddTube}
            onHint={handleHint}
            onToggleAutoSolve={toggleAutoSolve}
            disabled={isWon || isDeadlocked}
          />

          <div className="text-center text-[10px] text-slate-500 font-medium">
            《智力倒水》TapTap 精准版 · 内置 BFS 求解器与最优解推导
          </div>
        </footer>
      </div>

      {/* Deadlock Support Modal (Section 15 & 16: Non-punitive deadlock) */}
      {isDeadlocked && !isWon && (
        <DeadlockModal
          onUndo={handleUndo}
          onReset={handleConfirmReset}
          canAddTube={extraTubesAdded < 2 && tubes.length < 14}
          onAddTube={handleAddTube}
        />
      )}

      {/* Reset Confirmation Modal (Section 18) */}
      {resetConfirmOpen && (
        <ResetConfirmModal
          onConfirm={handleConfirmReset}
          onCancel={() => setResetConfirmOpen(false)}
        />
      )}

      {/* 3-Tier Hint Modal (Section 19 & 20) */}
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
              // Auto clear highlight after 6s
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

      {/* Level Workshop & Solver Diagnostics */}
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
