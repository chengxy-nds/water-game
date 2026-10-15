import React from 'react';
import { MechanicIntro } from '../../types/game';
import { renderBottleSVG } from '../../rendering/bottleRenderer';

interface MechanicIntroModalProps {
  isOpen: boolean;
  intro: MechanicIntro | null;
  levelId: number;
  onStart: () => void;
}

export const MechanicIntroModal: React.FC<MechanicIntroModalProps> = ({
  isOpen,
  intro,
  levelId,
  onStart,
}) => {
  if (!isOpen || !intro) return null;

  const sampleB = intro.sampleBottle
    ? intro.sampleBottle()
    : intro.previewBottle;
  const previewSvg = sampleB ? renderBottleSVG(sampleB, 99, levelId) : '';

  return (
    <div className="modal-mask show" id="mechanic-modal-mask">
      <div className="glass-jelly-card">
        <div className="new-mech-badge" id="mech-badge">
          {intro.badge}
        </div>
        <div className="glass-modal-title" id="mech-title">
          {intro.title}
        </div>
        {intro.sub && (
          <div className="glass-modal-sub" id="mech-sub">
            {intro.sub}
          </div>
        )}
        <div
          className="mech-preview-pedestal"
          id="mech-preview-stage"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <div
          className="mech-rule-box"
          id="mech-desc"
          dangerouslySetInnerHTML={{ __html: intro.desc }}
        />
        <button
          className="jelly-primary-pill-btn"
          id="mech-close-btn"
          onClick={onStart}
        >
          领略奥秘，开启试炼 →
        </button>
      </div>
    </div>
  );
};
