import React from 'react';

interface ControlBarProps {
  shuffleUses: number;
  onShuffle: () => void;
  onAddBottle: () => void;
  onOpenLevelSelect: () => void;
  onUndo: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  shuffleUses,
  onShuffle,
  onAddBottle,
  onOpenLevelSelect,
  onUndo,
}) => {
  return (
    <div className="bottom-bar">
      <div className="big-action-btn" id="shuffle-btn" onClick={onShuffle} title="智能提示 / 破局推演">
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
          <path d="M10,34 C18,34 20,16 32,16 L37,16" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
          <polygon points="34,9 44,16 34,23" fill="#ffffff" />
          <path d="M10,16 C18,16 20,34 32,34 L37,34" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
          <polygon points="34,27 44,34 34,41" fill="#ffffff" />
        </svg>
        <span className="btn-label">提示</span>
        <div className="badge-jelly" id="shuffle-count">
          {shuffleUses > 0 ? shuffleUses : '🎬'}
        </div>
      </div>

      <div className="big-action-btn jelly-gold" id="add-bottle-btn" onClick={onAddBottle} title="看广告免费+1备用空瓶或破除机关">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="btn-label">+空瓶</span>
        <div className="badge-jelly ad-tag">🎬</div>
      </div>

      <div className="big-action-btn jelly-cyan" id="level-select-btn" onClick={onOpenLevelSelect} title="打开200关星光工坊选单">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" fill="#ffffff" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" fill="#fde047" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" fill="#bae6fd" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" fill="#ffffff" />
        </svg>
        <span className="btn-label">关卡</span>
      </div>

      <div className="big-action-btn" id="undo-btn" onClick={onUndo} title="撤回上一步">
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
          <path
            d="M22,16 L11,24 L22,32 L22,26 C30,26 34,30 34,37 C37,31 37,20 26,19 L22,19 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="btn-label">撤回</span>
        <div className="badge-jelly ad-tag" id="undo-badge">
          🎬
        </div>
      </div>
    </div>
  );
};
