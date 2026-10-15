import React from 'react';
import { Bag } from '../../types/game';
import { renderBagSVG } from '../../rendering/bagRenderer';

interface BagsBarProps {
  bags: Bag[];
  onBagClick: (idx: number) => void;
}

export const BagsBar: React.FC<BagsBarProps> = ({ bags, onBagClick }) => {
  return (
    <>
      {bags.map((bag, idx) => (
        <div
          key={`bag-${idx}`}
          className="bag-slot"
          onClick={() => onBagClick(idx)}
          dangerouslySetInnerHTML={{ __html: renderBagSVG(bag, idx) }}
        />
      ))}
    </>
  );
};
