import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onNextLevel: () => void;
  onUnlockAll: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onNextLevel,
  onUnlockAll,
  onRestart,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-mask show">
      <div className="modal-card">
        <div className="modal-title">⚙️ 倒水不能停 · 菜单</div>
        <div className="modal-sub">
          支持 6 大代表性创意关卡与真实容器腔体共振水流声效，点击底部【关卡】按钮即可自由切换体验！
        </div>

        <button
          type="button"
          className="modal-btn gold"
          onClick={() => {
            onNextLevel();
            onClose();
          }}
        >
          ⏭️ 进入下一代表关卡
        </button>

        <button
          type="button"
          className="modal-btn"
          onClick={() => {
            onUnlockAll();
            onClose();
          }}
        >
          🔓 一键解锁当前关空瓶与机关
        </button>

        <button
          type="button"
          className="modal-btn"
          onClick={() => {
            onRestart();
            onClose();
          }}
        >
          🔄 重新开始当前关
        </button>

        <button type="button" className="modal-btn" onClick={onClose}>
          ▶️ 继续游戏
        </button>
      </div>
    </div>
  );
};
