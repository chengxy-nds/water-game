import React, { useState } from 'react';
import { Level, Difficulty, PlayerStats } from '../types/game';
import { CURATED_LEVELS } from '../data/curatedLevels';
import { X, Star, Lock, Sparkles, Shuffle } from 'lucide-react';

interface LevelSelectorModalProps {
  currentLevelId: number | string;
  stats: PlayerStats;
  onSelectLevel: (level: Level) => void;
  onGenerateLevel: (difficulty: Difficulty) => void;
  onClose: () => void;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">关卡探索</h2>
            <p className="text-xs text-slate-400">选择关卡或开启无限随机推演</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-slate-800/60 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('curated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'curated'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            经典关卡 ({CURATED_LEVELS.length})
          </button>
          <button
            onClick={() => setActiveTab('endless')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'endless'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>无限生成挑战</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'curated' && (
            <div>
              {/* Difficulty Filter Chips */}
              <div className="flex items-center gap-1.5 mb-4 text-xs">
                <span className="text-slate-400 mr-1 text-[11px]">难度:</span>
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
                        ? 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
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
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/50'
                          : isCompleted
                          ? 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
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
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : lvl.difficulty === 'medium'
                              ? 'bg-sky-950 text-sky-400 border border-sky-500/30'
                              : lvl.difficulty === 'hard'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
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
                      <div className="text-[10px] text-slate-400">
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
                                : 'text-slate-700'
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
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/20 text-slate-200">
                <h3 className="text-sm font-black text-purple-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>实时动态关卡生成器 (Solver 驱动)</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
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
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-black text-white">{item.title}</h4>
                      <p className="text-[11px] text-cyan-400 font-medium mb-1">
                        {item.colors}
                      </p>
                      <p className="text-[11px] text-slate-400 mb-4">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        onGenerateLevel(item.diff);
                        onClose();
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r ${item.btnColor} text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>立即生成并开局</span>
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
