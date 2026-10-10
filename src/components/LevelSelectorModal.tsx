import React, { useState } from 'react';
import { Level, Difficulty, PlayerStats } from '../types/game';
import { CURATED_LEVELS } from '../data/curatedLevels';
import { X, Star, Sparkles, Shuffle } from 'lucide-react';

interface LevelSelectorModalProps {
  currentLevelId: number | string;
  stats: PlayerStats;
  onSelectLevel: (level: Level) => void;
  onGenerateLevel: (difficulty: Difficulty) => void;
  onClose: () => void;
}

// Glossy blue 3D button — same style as the main game page buttons.
const GLOSSY_BLUE =
  'bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)]';

// Compact glossy-blue active state for tabs & filter chips.
const GLOSSY_ACTIVE =
  'bg-gradient-to-b from-[#60a5fa] to-[#1d4ed8] border border-[#93c5fd] shadow-[0_2px_8px_rgba(29,78,216,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.7)] text-white';

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  currentLevelId,
  stats,
  onSelectLevel,
  onGenerateLevel,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'curated' | 'endless'>('curated');
  const [filterDiff, setFilterDiff] = useState<string>('all');

  const filteredLevels = CURATED_LEVELS.filter((lvl) => {
    if (filterDiff === 'all') return true;
    return lvl.difficulty === filterDiff;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03081a]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-gradient-to-b from-[#0e2052] via-[#081436] to-[#03081a] border border-[#2a3a6e] shadow-2xl flex flex-col overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">关卡探索</h2>
            <p className="text-xs text-blue-200/60">选择关卡或开启无限随机推演</p>
          </div>
          <button
            onClick={onClose}
            className={`relative p-1.5 rounded-xl text-white active:scale-95 transition-transform cursor-pointer overflow-hidden ${GLOSSY_BLUE}`}
          >
            <div className="absolute top-0.5 left-1 right-1 h-2 rounded-t-[10px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <X className="relative w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="relative px-5 pt-3 pb-2 flex items-center gap-2 border-b border-white/10 bg-[#081436]/60">
          <button
            onClick={() => setActiveTab('curated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'curated'
                ? GLOSSY_ACTIVE
                : 'bg-white/[0.06] text-blue-200/70 hover:bg-white/[0.12]'
            }`}
          >
            经典关卡 ({CURATED_LEVELS.length})
          </button>
          <button
            onClick={() => setActiveTab('endless')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'endless'
                ? GLOSSY_ACTIVE
                : 'bg-white/[0.06] text-blue-200/70 hover:bg-white/[0.12]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>无限生成挑战</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="relative flex-1 overflow-y-auto p-5">
          {activeTab === 'curated' && (
            <div>
              {/* Difficulty Filter Chips */}
              <div className="flex items-center gap-1.5 mb-4 text-xs flex-wrap">
                <span className="text-blue-200/60 mr-1 text-[11px]">难度:</span>
                {[
                  { id: 'all', label: '全部' },
                  { id: 'easy', label: '简单' },
                  { id: 'medium', label: '普通' },
                  { id: 'hard', label: '困难' },
                  { id: 'master', label: '大师' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilterDiff(item.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filterDiff === item.id
                        ? `${GLOSSY_ACTIVE} font-bold`
                        : 'bg-white/[0.06] text-blue-200/60 hover:text-white hover:bg-white/[0.12]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Grid of Levels */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredLevels.map((lvl) => {
                  const isCurrent = currentLevelId === lvl.id;
                  const record = stats.completedLevels[String(lvl.id)];
                  const isCompleted = !!record;
                  // Allow playing any curated level directly so players can explore!
                  const stars = record ? record.stars : 0;

                  return (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        onSelectLevel(lvl);
                        onClose();
                      }}
                      className={`relative p-3 rounded-2xl border text-left transition-all group flex flex-col justify-between h-28 ${
                        isCurrent
                          ? 'bg-cyan-500/10 border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/50'
                          : isCompleted
                          ? 'bg-white/[0.07] border-white/20 hover:border-white/40'
                          : 'bg-white/[0.04] border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="text-sm font-black text-white group-hover:text-cyan-300">
                          第 {lvl.id} 关
                        </span>
                        {/* Difficulty Badge */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            lvl.difficulty === 'easy'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40'
                              : lvl.difficulty === 'medium'
                              ? 'bg-sky-500/15 text-sky-300 border border-sky-400/40'
                              : lvl.difficulty === 'hard'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-400/40'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-400/40'
                          }`}
                        >
                          {lvl.difficulty === 'easy'
                            ? '简单'
                            : lvl.difficulty === 'medium'
                            ? '普通'
                            : lvl.difficulty === 'hard'
                            ? '困难'
                            : '大师'}
                        </span>
                      </div>

                      {/* Best Steps info */}
                      <div className="text-[10px] text-blue-200/60">
                        {record ? (
                          <span className="text-emerald-400 font-medium">
                            最佳: {record.bestSteps}步 (最优{lvl.optimalSteps}步)
                          </span>
                        ) : (
                          <span>理论最优: {lvl.optimalSteps} 步</span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'endless' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-400/25 text-blue-200/80">
                <h3 className="text-sm font-black text-purple-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>实时动态关卡生成器 (Solver 驱动)</span>
                </h3>
                <p className="text-xs text-blue-200/60 leading-relaxed">
                  每个随机关卡由后台 Solver 现场推导计算，确保 100% 绝对有解，并自动计算出精准的理论最少步数与星级门槛！
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    diff: 'easy' as Difficulty,
                    title: '轻松微澜',
                    colors: '4 色 · 6 试管',
                    desc: '适合放松热身，约 8~14 步',
                    btnColor: 'from-emerald-500 to-teal-600',
                  },
                  {
                    diff: 'medium' as Difficulty,
                    title: '激流思辨',
                    colors: '6 色 · 8 试管',
                    desc: '适度烧脑，约 15~24 步',
                    btnColor: 'from-sky-500 to-blue-600',
                  },
                  {
                    diff: 'hard' as Difficulty,
                    title: '渊薮绝境',
                    colors: '8~9 色 · 10 试管',
                    desc: '深度推演，约 25~40 步',
                    btnColor: 'from-purple-500 to-pink-600',
                  },
                ].map((item) => (
                  <div
                    key={item.diff}
                    className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-black text-white">{item.title}</h4>
                      <p className="text-[11px] text-cyan-400 font-medium mb-1">
                        {item.colors}
                      </p>
                      <p className="text-[11px] text-blue-200/60 mb-4">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        onGenerateLevel(item.diff);
                        onClose();
                      }}
                      className={`relative w-full py-2.5 px-3 rounded-xl bg-gradient-to-r ${item.btnColor} text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md border border-white/20 transition-all active:scale-95 overflow-hidden`}
                    >
                      <div className="absolute top-0.5 left-2 right-2 h-2 rounded-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                      <Shuffle className="relative w-3.5 h-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                      <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                        立即生成并开局
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
