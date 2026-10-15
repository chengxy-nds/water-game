import React from 'react';
import { Bottle } from '../../types/game';
import { renderBottleSVG } from '../../rendering/bottleRenderer';

interface BottleViewProps {
  bottle: Bottle;
  idx: number;
  isSelected: boolean;
  levelId: number;
  onClick: () => void;
}

export const BottleView: React.FC<BottleViewProps> = ({
  bottle,
  idx,
  isSelected,
  levelId,
  onClick,
}) => {
  let cls = 'bottle-slot';
  if (bottle.isGiantCat) cls += ' giant-cat-slot';
  else if (bottle.maxCap === 8) cls += ' tall-8-slot';

  if (bottle.removed) {
    cls += ' bottle-removed';
    return <div className={cls} />;
  }

  if (isSelected) cls += ' selected';

  return (
    <div
      className={cls}
      onClick={onClick}
      dangerouslySetInnerHTML={{
        __html: renderBottleSVG(bottle, idx, levelId),
      }}
    />
  );
};
