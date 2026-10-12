import React from 'react';
import { FlaskConical, Lightbulb, RotateCcw, Undo2 } from 'lucide-react';

interface ControlBarProps {
  canUndo: boolean;
  undoCount?: number;
  hintCount?: number;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
  onAddTube: () => void;
  disabled?: boolean;
}

const BUTTON_STYLE =
  'control-action-button';

interface ActionButtonProps {
  label: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  title,
  icon,
  onClick,
  disabled,
  badge,
}) => (
  <div className="control-action-wrap">
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} className={BUTTON_STYLE}>
      <span className="control-action-icon">{icon}</span>
      {badge !== undefined && badge > 0 && <span className="control-action-badge">{badge}</span>}
    </button>
    <span className="control-action-label">{label}</span>
  </div>
);

export const ControlBar: React.FC<ControlBarProps> = ({
  canUndo,
  undoCount,
  hintCount,
  onUndo,
  onRestart,
  onHint,
  onAddTube,
  disabled = false,
}) => (
  <div className="control-bar">
    <ActionButton label="撤销" title="撤销上一步" icon={<Undo2 size={24} strokeWidth={2.6} />} onClick={onUndo} disabled={!canUndo || disabled} badge={undoCount} />
    <ActionButton label="重来" title="重来本关" icon={<RotateCcw size={24} strokeWidth={2.6} />} onClick={onRestart} disabled={disabled} />
    <ActionButton label="提示" title="获取提示" icon={<Lightbulb size={24} strokeWidth={2.4} />} onClick={onHint} disabled={disabled} badge={hintCount} />
    <ActionButton label="加一瓶" title="增加一个空试管" icon={<FlaskConical size={24} strokeWidth={2.4} />} onClick={onAddTube} disabled={disabled} />
  </div>
);
