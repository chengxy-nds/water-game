import React from 'react';

interface WinModalProps {
  isOpen: boolean;
  isSettingsMode?: boolean;
  isGiantCat?: boolean;
  levelNum: number;
  levelTitle: string;
  userMoves: number;
  optimalMoves: number;
  onNextLevel: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onClose?: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  isSettingsMode = false,
  isGiantCat = false,
  levelNum,
  levelTitle,
  userMoves,
  optimalMoves,
  onNextLevel,
  onRestart,
  onOpenLevelSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  const actualUserMoves = Math.max(1, userMoves);
  const diff = Math.max(0, actualUserMoves - optimalMoves);

  let title = `第 ${levelNum} 关完美封存`;
  let sub = '秘药尽数归宗，星光流转完美封存！';
  let badgePill = 'PASSED';
  let praise = '✨ 炉火纯青！你的凝萃技艺逼近理论极致！';

  if (isSettingsMode) {
    badgePill = `LV.${levelNum}`;
    title = levelTitle;
    sub = '星光琉璃工坊 · 200关大师级试炼 · 100%无广告可解';
    praise = '💡 点击底部【关卡】可随时品鉴 1~200 关典藏器皿！';
  } else if (isGiantCat) {
    title = '皇家灵猫凝萃大成';
    sub = '八层秘药尽数汇入灵猫水晶瓶，原木塞已落定封存！';
  }

  if (!isSettingsMode) {
    if (diff === 0) praise = '🏆 传世宗师！你达成了零误差理论最优解！';
    else if (diff > 6) praise = '🎉 渐入佳境！所有特殊器皿均已圆满封存！';
  }

  return (
    <div className="modal-mask show" id="modal-mask">
      <div className="glass-jelly-card">
        <div className="trophy-jelly-wrap">
          <div className="trophy-jelly-box">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="#fef08a" />
            </svg>
          </div>
          <div className="passed-jelly-pill" id="modal-badge-pill">{badgePill}</div>
        </div>

        <div className="glass-modal-title" id="modal-title">{title}</div>
        <div className="glass-modal-sub" id="modal-sub">{sub}</div>

        <div className="jelly-stars-row">
          <svg className="jelly-star-svg" viewBox="0 0 36 36">
            <defs>
              <linearGradient id="jStarG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            <path
              d="M18,2 L22.8,11.6 L33.4,13.1 L25.7,20.6 L27.5,31.2 L18,26.2 L8.5,31.2 L10.3,20.6 L2.6,13.1 L13.2,11.6 Z"
              fill="url(#jStarG)"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="jelly-star-svg" viewBox="0 0 36 36">
            <path
              d="M18,2 L22.8,11.6 L33.4,13.1 L25.7,20.6 L27.5,31.2 L18,26.2 L8.5,31.2 L10.3,20.6 L2.6,13.1 L13.2,11.6 Z"
              fill="url(#jStarG)"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="jelly-star-svg" viewBox="0 0 36 36">
            <path
              d="M18,2 L22.8,11.6 L33.4,13.1 L25.7,20.6 L27.5,31.2 L18,26.2 L8.5,31.2 L10.3,20.6 L2.6,13.1 L13.2,11.6 Z"
              fill="url(#jStarG)"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="glass-scorecard">
          <div>
            <div className="score-col-label">本次用步</div>
            <div className="score-col-val" id="score-user-moves">{actualUserMoves} 步</div>
          </div>
          <div className="score-divider" />
          <div>
            <div className="score-col-label">理论最优解</div>
            <div className="score-col-val cyan" id="score-opt-moves">{optimalMoves} 步</div>
          </div>
          <div className="score-divider" />
          <div>
            <div className="score-col-label">最优解差距</div>
            <div className="score-col-val amber" id="score-diff-moves">+{diff}</div>
          </div>
        </div>

        <div className="score-praise-line" id="score-praise-line">{praise}</div>

        {isSettingsMode ? (
          <button className="jelly-primary-pill-btn" onClick={onClose}>
            继续当前试炼 →
          </button>
        ) : (
          <button className="jelly-primary-pill-btn" id="modal-next-btn" onClick={onNextLevel}>
            开启下一关试炼 →
          </button>
        )}

        <div className="glass-secondary-row">
          <button className="glass-secondary-btn" id="modal-restart-btn" onClick={onRestart}>
            ↻ 重新凝萃
          </button>
          <button className="glass-secondary-btn" id="modal-open-levels-btn" onClick={onOpenLevelSelect}>
            ☰ 典藏选单
          </button>
        </div>
      </div>
    </div>
  );
};
