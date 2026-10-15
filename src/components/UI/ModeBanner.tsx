import React from 'react';

interface ModeBannerProps {
  currentPacked: number;
  totalTarget: number;
  text?: string;
}

export const ModeBanner: React.FC<ModeBannerProps> = ({
  currentPacked,
  totalTarget,
  text = '✨ 凝萃同色琉璃秘药，满瓶即落原木塞封存',
}) => {
  return (
    <div className="mode-banner show" id="mode-banner">
      <span id="mode-banner-text">{text}</span>
      <span className="mode-banner-tag" id="mode-banner-progress">
        封存 {currentPacked}/{totalTarget}
      </span>
    </div>
  );
};
