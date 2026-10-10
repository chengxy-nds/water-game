import React, { useState } from 'react';
import { Bottle, Level, SolverResult } from '../types/game';
import { solveWaterSort, TUBE_CAPACITY, evaluateDifficulty } from '../solver/waterSortSolver';
import { COLOR_PALETTE, COLOR_KEYS, getColor } from '../utils/colors';
import { X, Play, Plus, Trash2, Cpu, CheckCircle2, AlertTriangle, Copy, ArrowRight } from 'lucide-react';

interface LevelWorkshopProps {
  onLoadCustomLevel: (level: Level) => void;
  onClose: () => void;
}

export const LevelWorkshop: React.FC<LevelWorkshopProps> = ({ onLoadCustomLevel, onClose }) => {
  // Current editor bottles state
  const [bottles, setBottles] = useState<Bottle[]>([
    { id: 'w1', type: 'normal', capacity: 4, layers: ['red', 'blue', 'emerald', 'amber'] },
    { id: 'w2', type: 'normal', capacity: 4, layers: ['amber', 'emerald', 'blue', 'red'] },
    { id: 'w3', type: 'normal', capacity: 4, layers: ['blue', 'red', 'amber', 'emerald'] },
    { id: 'w4', type: 'empty', capacity: 4, layers: [] },
    { id: 'w5', type: 'empty', capacity: 4, layers: [] },
  ]);

  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Add bottle
  const handleAddTube = () => {
    if (bottles.length >= 12) return;
    setBottles([...bottles, { id: `w${bottles.length + 1}`, type: 'empty', capacity: 4, layers: [] }]);
    setSolverResult(null);
  };

  // Remove bottle
  const handleRemoveTube = (index: number) => {
    if (bottles.length <= 3) return;
    setBottles(bottles.filter((_, i) => i !== index));
    setSolverResult(null);
  };

  // Click bottle in editor: if not full, add selected color; or if right click or special mode, remove
  const handleTubeCellClick = (tubeIndex: number) => {
    const bottle = bottles[tubeIndex];
    if (bottle.layers.length < TUBE_CAPACITY) {
      const nextBottles = bottles.map((b, i) =>
        i === tubeIndex ? { ...b, layers: [...b.layers, selectedColor] } : b
      );
      setBottles(nextBottles);
      setSolverResult(null);
    }
  };

  const handlePopTop = (tubeIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const bottle = bottles[tubeIndex];
    if (bottle.layers.length > 0) {
      const nextBottles = bottles.map((b, i) =>
        i === tubeIndex ? { ...b, layers: b.layers.slice(0, b.layers.length - 1) } : b
      );
      setBottles(nextBottles);
      setSolverResult(null);
    }
  };

  // Clear all bottles
  const handleClearAll = () => {
    setBottles(bottles.map((b) => ({ ...b, layers: [] })));
    setSolverResult(null);
  };

  // Run Solver diagnostic
  const handleRunDiagnostic = () => {
    setIsSolving(true);
    setSolverResult(null);

    // Run solver in next tick to not block UI rendering
    setTimeout(() => {
      const result = solveWaterSort(bottles, TUBE_CAPACITY, 50000);
      setSolverResult(result);
      setIsSolving(false);
    }, 50);
  };

  // Start playing custom level
  const handlePlayLevel = () => {
    const customLevel: Level = {
      id: `custom-${Date.now()}`,
      title: '工坊自制关卡',
      difficulty: solverResult ? (solverResult.optimalSteps > 20 ? 'hard' : 'medium') : 'medium',
      bottles: bottles.map((b) => ({
        ...b,
        type: b.layers.length === 0 ? 'empty' : 'normal',
        layers: [...b.layers],
      })),
      optimalSteps: solverResult?.optimalSteps,
      description: solverResult?.solvable
        ? `工坊验证 · 最优解 ${solverResult.optimalSteps} 步`
        : '自制挑战关卡',
      isCustom: true,
    };
    onLoadCustomLevel(customLevel);
    onClose();
  };

  // Copy JSON
  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(bottles.map((b) => b.layers), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Evaluate difficulty badge
  const diffInfo = solverResult?.solvable
    ? evaluateDifficulty(solverResult.optimalSteps, solverResult.visitedNodes)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>关卡工坊 & Solver 实验室</span>
                <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                  TapTap 开发者工具
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                自由摆盘、实时一键验题、推导理论最优解与状态图
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {/* Color Palette Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                当前画笔颜色：
                <span className="text-cyan-400 ml-1">
                  {COLOR_PALETTE[selectedColor]?.name}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                提示：点击试管填充颜色，点击【✕】移除顶层
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_KEYS.map((key) => {
                const c = COLOR_PALETTE[key];
                const isSelected = selectedColor === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedColor(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 border-white scale-105 shadow-md shadow-cyan-500/30'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                    style={{
                      backgroundColor: `${c.hex}22`,
                      color: c.textColor === '#1e293b' ? '#fde047' : '#ffffff',
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Tubes Editor Canvas */}
          <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
            <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6 mb-4">
              {bottles.map((bottle, tIdx) => (
                <div key={tIdx} className="flex flex-col items-center gap-1.5">
                  {/* Top pop button */}
                  {bottle.layers.length > 0 ? (
                    <button
                      onClick={(e) => handlePopTop(tIdx, e)}
                      title="撤出顶层"
                      className="text-[10px] w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="w-5 h-5" />
                  )}

                  {/* Bottle Body */}
                  <div
                    onClick={() => handleTubeCellClick(tIdx)}
                    className="relative w-12 sm:w-14 h-40 sm:h-44 rounded-b-[1.75rem] rounded-t-lg border-2 border-slate-700/80 hover:border-cyan-400/80 bg-slate-900/60 cursor-pointer p-1 flex flex-col-reverse justify-start overflow-hidden transition-all shadow-inner group"
                  >
                    {bottle.layers.map((colorId, layerIdx) => {
                      const color = getColor(colorId);
                      return (
                        <div
                          key={layerIdx}
                          className="w-full h-8 sm:h-9 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border-t border-white/10"
                          style={{ backgroundColor: color.hex }}
                        >
                          {color.symbol}
                        </div>
                      );
                    })}

                    {bottle.layers.length === 0 && (
                      <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold pointer-events-none">
                        空管
                      </div>
                    )}
                  </div>

                  {/* Bottle Bottom Index & Delete */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="font-semibold">#{tIdx + 1}</span>
                    {bottles.length > 3 && (
                      <button
                        onClick={() => handleRemoveTube(tIdx)}
                        title="删除此管"
                        className="text-slate-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar for canvas */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleAddTube}
                disabled={bottles.length >= 12}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>添加试管</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold transition-all"
              >
                清空液体
              </button>

              <button
                onClick={handleCopyJSON}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNotification ? '已复制！' : '复制配置'}</span>
              </button>
            </div>
          </div>

          {/* Solver Diagnostics Dashboard */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Solver 演算结果</h3>
              </div>

              <button
                onClick={handleRunDiagnostic}
                disabled={isSolving}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSolving ? '正在推演...' : '⚡ 一键解题 / 验题'}
              </button>
            </div>

            {solverResult && (
              <div className="flex flex-col gap-3 pt-2">
                {/* Result metrics cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">可解性验证</span>
                    <span
                      className={`text-sm font-black flex items-center gap-1 mt-0.5 ${
                        solverResult.solvable ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {solverResult.solvable ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>完全有解</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span>无法解出</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">理论最优解</span>
                    <span className="text-sm font-black text-cyan-400 mt-0.5">
                      {solverResult.solvable ? `${solverResult.optimalSteps} 步` : '--'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">搜索状态节点</span>
                    <span className="text-sm font-black text-purple-400 mt-0.5">
                      {solverResult.visitedNodes.toLocaleString()} 个
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">演算耗时</span>
                    <span className="text-sm font-black text-amber-400 mt-0.5">
                      {solverResult.timeMs.toFixed(1)} ms
                    </span>
                  </div>
                </div>

                {/* Difficulty & reason */}
                {solverResult.solvable && diffInfo && (
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      关卡难度自动定级：
                      <span className={`ml-2 px-2 py-0.5 rounded font-black border ${diffInfo.tagColor}`}>
                        {diffInfo.label} ({diffInfo.stars} 星)
                      </span>
                    </span>
                    <span className="text-slate-400">
                      3星门槛：{solverResult.optimalSteps + 2} 步以内
                    </span>
                  </div>
                )}

                {!solverResult.solvable && solverResult.reason && (
                  <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                    {solverResult.reason}
                  </div>
                )}

                {/* Step by step optimal solution path */}
                {solverResult.solvable && solverResult.moves.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      最优推导全路径 (共 {solverResult.moves.length} 步)：
                    </span>
                    <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
                      {solverResult.moves.map((move, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-slate-300"
                        >
                          <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                          <span>
                            瓶{move.from + 1} → 瓶{move.to + 1}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full ml-auto"
                            style={{ backgroundColor: getColor(move.colorId).hex }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            返回游戏
          </button>

          <button
            onClick={handlePlayLevel}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>进入此关游玩</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
