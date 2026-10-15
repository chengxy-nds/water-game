import React, { useState, useEffect } from 'react';
import { getLevelConfig } from '../../data/levelGenerator';

interface LevelSelectModalProps {
  isOpen: boolean;
  currentLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

const CHAPTERS = [
  { id: 0, label: '1-40关' },
  { id: 1, label: '41-80关' },
  { id: 2, label: '81-120关' },
  { id: 3, label: '121-160关' },
  { id: 4, label: '161-200关' },
];

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  currentLevelId,
  onSelectLevel,
  onClose,
}) => {
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveChapter(Math.floor((currentLevelId - 1) / 40));
    }
  }, [isOpen, currentLevelId]);

  if (!isOpen) return null;

  const startLv = activeChapter * 40 + 1;
  const endLv = Math.min(200, startLv + 39);
  const levels = [];
  for (let lv = startLv; lv <= endLv; lv++) {
    levels.push(lv);
  }

  return (
    <div className="modal-mask show" id="level-modal-mask">
      <div className="glass-jelly-card">
        <div className="glass-modal-title">✨ 星光琉璃典藏选单</div>
        <div className="glass-modal-sub">200关大师级炼金试炼 · 步步精妙皆可破局</div>

        <div className="chapter-tabs" id="chapter-tabs">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              className={`chapter-tab-btn ${activeChapter === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChapter(ch.id)}
            >
              {ch.label}
            </button>
          ))}
        </div>

        <div className="level-grid-scroll" id="level-grid-list">
          {levels.map((lv) => {
            const cfg = getLevelConfig(lv);
            const isCurrent = lv === currentLevelId;
            const isBoss = cfg.isCatBossLevel || cfg.pos === 10;
            const stars = cfg.waveStars || 3;
            const starsStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);

            let cls = 'level-cell';
            if (isCurrent) cls += ' active';
            else if (isBoss) cls += ' boss-cell';

            return (
              <div
                key={lv}
                className={cls}
                onClick={() => {
                  onSelectLevel(lv);
                  onClose();
                }}
              >
                <div className="level-cell-num">第 {lv} 关</div>
                <div className="level-cell-tag">{cfg.shortTag}</div>
                <div className="level-cell-wave">{starsStr}</div>
              </div>
            );
          })}
        </div>

        <button className="jelly-primary-pill-btn" id="level-modal-close-btn" onClick={onClose}>
          返回当前试炼 →
        </button>
      </div>
    </div>
  );
};
