import React from 'react';
import { BookOpenText, X } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

const GLOSSY_BLUE =
  'bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)]';

const RuleItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
    <div className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-300">{title}</div>
    <div className="text-sm leading-6 text-slate-100/90">{children}</div>
  </div>
);

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03081a]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a2a55]/85 via-[#0e1e42]/80 to-[#0a1630]/85 backdrop-blur-2xl border border-white/15 shadow-2xl p-5 flex flex-col overflow-hidden max-h-[85vh]">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-300/30 text-cyan-300 flex items-center justify-center">
              <BookOpenText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">玩法规则</h3>
          </div>
          <button
            onClick={onClose}
            className={`relative p-1.5 rounded-xl text-white active:scale-95 transition-transform cursor-pointer overflow-hidden ${GLOSSY_BLUE}`}
          >
            <div className="absolute top-0.5 left-1 right-1 h-2 rounded-t-[10px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <X className="relative w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </button>
        </div>

        <div className="relative mt-4 space-y-3 overflow-y-auto pr-1">
          <RuleItem title="基础规则">
            每个瓶子容量固定为 4。只能倒出瓶顶连续同色的一段，倒入目标瓶时目标瓶必须为空或顶层颜色相同，且不能超出容量。
          </RuleItem>

          <RuleItem title="胜利条件">
            只有当每个非空瓶都满且单色，并且每种颜色只出现在一个瓶中时，才算完成。不能出现“多个瓶子都装满同一颜色”却被判定胜利。
          </RuleItem>

          <RuleItem title="遮罩瓶">
            这类瓶子在初始阶段会被布遮住，只有当达到设定的完成瓶数阈值后才会揭开。揭开后，它和普通瓶的倒水规则相同。
          </RuleItem>

          <RuleItem title="隐藏瓶">
            底部存在隐藏层时，玩家只能看见顶部已知颜色，不能直接利用底层未知颜色。倒出顶部后，下一层会逐步揭示，避免一次性暴露全部内容。
          </RuleItem>

          <RuleItem title="底部漏水瓶">
            这是特殊机制瓶，不能当普通倒水瓶使用。它只能从底部漏出一层液体，并且必须漏入指定目标瓶，且目标瓶顶部颜色要和源瓶底部颜色一致。
          </RuleItem>
        </div>
      </div>
    </div>
  );
};
