import React from 'react';
import { Bottle, BottleSpecial } from '../../types/game';
import { hash01 } from '../../physics/liquidMath';

export const renderIkeaWoodCorkSVG = (isSeated = true): string => `
  <g>
    <path d="M 38.5,12.5 L 61.5,12.5 L 57.2,28.5 A 7.5,2.2 0 0,1 42.8,28.5 Z"
          fill="url(#corkBodyWoodGrad)" stroke="#5c3818" stroke-width="0.9" />
    <ellipse cx="50" cy="12.0" rx="14.2" ry="3.6"
             fill="url(#corkRimWoodGrad)" stroke="#6e421a" stroke-width="0.95" />
    <ellipse cx="50" cy="11.6" rx="9.5" ry="2.2"
             fill="#fcead2" opacity="0.45" />
    <line x1="41.5" y1="7.5" x2="42.2" y2="12.0" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
    <line x1="57.8" y1="7.2" x2="57.0" y2="11.8" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
    ${
      isSeated
        ? `
      <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4"
            fill="none" stroke="#b8d8ff" stroke-width="1.35" stroke-linecap="round" opacity="0.9" />
    `
        : ''
    }
  </g>
`;

export const renderRibbonAndDroppingCorkMarkup = (
  idx: number,
  animP = 0.0,
  neckOffsetY = 0,
  bBotY = 193
): string => {
  let fx = `<g transform="translate(0, ${neckOffsetY})">`;

  if (animP < 0.18) {
    const t = animP / 0.18;
    const easeIn = t * t * t;
    const corkY = -88 * (1 - easeIn);
    const stretchY = 1 + 0.18 * t;
    const scaleX = 1 - 0.06 * t;
    fx += `
      <rect x="37" y="${(corkY - 22).toFixed(1)}" width="26" height="22" rx="8"
            fill="rgba(245, 226, 196, ${(0.35 * t).toFixed(2)})" />
      <g transform="translate(50, ${corkY.toFixed(1)}) scale(${scaleX.toFixed(3)}, ${stretchY.toFixed(3)}) translate(-50, 0)">
        ${renderIkeaWoodCorkSVG(false)}
      </g>
    `;
  } else {
    let impactOffsetY = 0;
    let impactScaleX = 1;
    let impactScaleY = 1;

    if (animP < 0.38) {
      const hitP = (animP - 0.18) / 0.2;
      const squash = Math.sin(hitP * Math.PI * 2.2) * Math.exp(-3.2 * hitP);
      impactOffsetY = squash * 5.2;
      impactScaleX = 1 + squash * 0.11;
      impactScaleY = 1 - squash * 0.14;

      const shockP = Math.min(1, hitP * 1.4);
      const shockRx = 18 + shockP * 26;
      const shockRy = 4 + shockP * 5;
      const shockOp = Math.max(0, (1 - shockP) * 0.9);
      fx += `
        <ellipse cx="50" cy="11.5" rx="${shockRx.toFixed(1)}" ry="${shockRy.toFixed(1)}"
                 fill="none" stroke="#ffffff" stroke-width="${(3.2 * (1 - shockP)).toFixed(2)}"
                 opacity="${shockOp.toFixed(2)}" />
      `;
    }

    fx += `
      <g transform="translate(50, ${(11.5 + impactOffsetY).toFixed(2)}) scale(${impactScaleX.toFixed(3)}, ${impactScaleY.toFixed(3)}) translate(-50, -11.5)">
        ${renderIkeaWoodCorkSVG(true)}
      </g>
    `;

    if (animP >= 0.26) {
      const swirlP = Math.min(1, (animP - 0.26) / 0.74);
      const botY = bBotY + 5 - neckOffsetY;
      const frontY = botY - swirlP * (botY - 8);
      const tailY = Math.min(botY + 4, frontY + 95);

      fx += `<g style="filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.9));">`;

      const buildSpiralRibbon = (phaseOffset: number) => {
        const N = 26;
        const leftPts: string[] = [];
        const rightPts: string[] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const y = tailY - (tailY - frontY) * u;
          const globalHeightFrac = (botY - y) / Math.max(40, botY - 10);
          const theta = globalHeightFrac * Math.PI * 3.6 - swirlP * Math.PI * 5.0 + phaseOffset;
          const radiusX = y < 38 ? 16 + (y - 10) * 0.78 : 38;
          const x = 50 + Math.sin(theta) * radiusX;
          const halfW = Math.sin(u * Math.PI) * 3.8;
          leftPts.push(`${(x - halfW).toFixed(1)},${y.toFixed(1)}`);
          rightPts.push(`${(x + halfW).toFixed(1)},${y.toFixed(1)}`);
        }
        return `M ${leftPts.join(' L ')} L ${rightPts.reverse().join(' L ')} Z`;
      };

      fx += `<path d="${buildSpiralRibbon(0)}" fill="#ffffff" opacity="0.95" />`;
      fx += `<path d="${buildSpiralRibbon(Math.PI)}" fill="#fff5cc" opacity="0.88" />`;

      for (let p = 0; p < 95; p++) {
        const u1 = hash01(p * 3 + 1);
        const u2 = hash01(p * 3 + 2);
        const u3 = hash01(p * 3 + 3);
        const py = tailY + 10 - u1 * (tailY - frontY + 22);
        if (py >= 4 && py <= botY + 6) {
          const hFrac = (botY - py) / Math.max(40, botY - 10);
          const ang = hFrac * Math.PI * 3.6 - swirlP * Math.PI * 5.0 + (p % 2) * Math.PI + (u2 - 0.5) * 1.4;
          const radX = (py < 38 ? 16 + (py - 10) * 0.78 : 38) + (u3 - 0.5) * 16;
          const px = 50 + Math.sin(ang) * radX;
          const pr = 0.65 + (p % 4) * 0.45;
          const op = Math.sin(u1 * Math.PI) * (0.55 + 0.45 * u3);
          const pCol = p % 3 === 0 ? '#ffe885' : '#ffffff';
          fx += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(2)}" fill="${pCol}" opacity="${op.toFixed(2)}" />`;
        }
      }

      if (swirlP > 0.15) {
        const ringRx = frontY < 38 ? 19 : 37;
        fx += `
          <ellipse cx="50" cy="${frontY.toFixed(1)}" rx="${ringRx}" ry="6.5"
                   fill="rgba(255, 255, 255, 0.35)" stroke="#ffffff" stroke-width="2.0" />
        `;
      }
      fx += `</g>`;
    }
  }

  fx += `</g>`;
  return fx;
};

interface GimmicksProps {
  bottle: Bottle;
  idx: number;
}

export const BottleGimmicks: React.FC<GimmicksProps> = ({ bottle, idx }) => {
  const { special } = bottle;

  if (special === 'ad_cam_blue' || special === 'ad_cam') {
    const isBlue = special === 'ad_cam_blue';
    const bgFill = isBlue ? `url(#camBlueBadgeGrad-${idx})` : `url(#camPurpleBadgeGrad-${idx})`;
    const faceFill = isBlue ? `url(#camBlueFaceGrad-${idx})` : `url(#camPurpleFaceGrad-${idx})`;
    const playColor = isBlue ? '#1472e3' : '#7b1fa2';
    const borderColor = isBlue ? '#a8d5ff' : '#df9eff';

    return (
      <g transform="translate(50, 115)">
        <circle cx="0" cy="0" r="28" fill="rgba(30, 136, 229, 0.22)" className="animate-pulse" />
        <circle cx="0" cy="0" r="23" fill={bgFill} stroke={borderColor} stroke-width="2.5" />
        <rect x="-11" y="-8.5" width="16" height="17" rx="3.5" fill={faceFill} stroke="#ffffff" stroke-width="1.2" />
        <polygon points="5,-4.5 14,-10 14,10 5,4.5" fill={faceFill} stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
        <polygon points="-5,-4.5 -5,4.5 2,0" fill={playColor} />
      </g>
    );
  }

  if (special === 'silk_drape') {
    return (
      <g>
        <path
          d="M 28,10.5 C 19,16 11,28 10,48 L 8,155 Q 50,172 92,155 L 90,48 C 89,28 81,16 72,10.5 Z"
          fill={`url(#silkDrapeGrad-${idx})`}
          stroke="#4274a8"
          stroke-width="1.6"
        />
        <path d="M 22,25 Q 16,95 24,162" fill="none" stroke="#7aa9dc" stroke-width="2.2" opacity="0.75" />
        <path d="M 38,18 Q 32,90 42,168" fill="none" stroke="#ffffff" stroke-width="2.8" opacity="0.85" />
        <path d="M 62,18 Q 68,90 58,168" fill="none" stroke="#ffffff" stroke-width="2.8" opacity="0.85" />
        <path d="M 78,25 Q 84,95 76,162" fill="none" stroke="#7aa9dc" stroke-width="2.2" opacity="0.75" />
        <path d="M 32,48 L 68,48" stroke="#ffb300" stroke-width="1.8" />
        <g transform="translate(50, 85)">
          <rect x="-14" y="-18" width="28" height="36" rx="4" fill="#ffffff" stroke="#c0d4ec" stroke-width="1.4" />
          <path d="M -6,-7 L 6,-7 L 5,1 L -5,1 Z" fill="#ff7043" />
          <path d="M -3,-7 C -3,-11 3,-11 3,-7" stroke="#d84315" stroke-width="1.2" fill="none" />
          <text x="0" y="13" text-anchor="middle" font-size="13" font-weight="900" fill="#1e3a68">
            1
          </text>
        </g>
      </g>
    );
  }

  if (special === 'ice_base') {
    return (
      <g>
        <polygon points="12,175 26,146 48,156 42,198 10,195" fill={`url(#iceFacetLeftGrad-${idx})`} stroke="#bcefff" stroke-width="1.4" stroke-linejoin="round" />
        <polygon points="36,172 58,142 82,165 74,204 32,201" fill={`url(#iceFacetMidGrad-${idx})`} stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" />
        <polygon points="68,166 90,144 98,172 92,198 68,200" fill={`url(#iceFacetRightGrad-${idx})`} stroke="#bcefff" stroke-width="1.4" stroke-linejoin="round" />
        <polyline points="22,158 28,176 22,192" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
        <polyline points="58,152 52,174 60,194" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
        <polyline points="84,154 78,174 86,188" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
        <g transform="translate(50, 185)">
          <circle cx="0" cy="0" r="11" fill="rgba(8, 68, 118, 0.88)" stroke="#ffffff" stroke-width="1.6" />
          <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="900">
            ❄️{bottle.unlockOrder || 2}
          </text>
        </g>
      </g>
    );
  }

  if (special === 'full_ice') {
    return (
      <g>
        <path
          d="M 33,26 L 67,26 L 70,54 Q 85,61 85,72 L 85,188 A 35,9 0 0,1 15,188 L 15,72 Q 15,61 30,54 Z"
          fill={`url(#fullIceGrad-${idx})`}
          stroke="#e3f9ff"
          stroke-width="2.2"
        />
        <g transform="translate(50, 102)">
          <circle cx="0" cy="0" r="15" fill="rgba(8, 68, 118, 0.78)" stroke="#ffffff" stroke-width="1.8" />
          <text x="0" y="5" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="900">
            🧊
          </text>
        </g>
      </g>
    );
  }

  if (special === 'stone_base') {
    return (
      <g>
        <polygon points="2,168 18,148 39,158 56,144 77,156 93,146 98,176 92,202 8,202" fill="#594028" stroke="#3b2816" stroke-width="1.4" stroke-linejoin="round" />
        <polygon points="4,174 19,154 39,165 36,200 8,197" fill={`url(#stoneLeftGrad-${idx})`} stroke="#4a331d" stroke-width="1.3" stroke-linejoin="round" />
        <polygon points="28,174 54,152 74,172 67,205 26,202" fill={`url(#stoneMidGrad-${idx})`} stroke="#3b2816" stroke-width="1.4" stroke-linejoin="round" />
        <polygon points="62,168 86,150 97,175 90,201 64,202" fill={`url(#stoneRightGrad-${idx})`} stroke="#4a331d" stroke-width="1.3" stroke-linejoin="round" />
        <polyline points="18,162 25,176 20,192" fill="none" stroke="#ffca28" stroke-width="1.5" stroke-linecap="round" />
        <polyline points="54,158 49,175 57,194" fill="none" stroke="#ffd54f" stroke-width="1.7" stroke-linecap="round" />
        <polyline points="82,158 76,176 84,190" fill="none" stroke="#ffca28" stroke-width="1.4" stroke-linecap="round" />
        <g transform="translate(50, 184)">
          <circle cx="0" cy="0" r="11.5" fill="#3e2723" stroke="#ffd54f" stroke-width="1.8" />
          <text x="0" y="4" text-anchor="middle" fill="#ffe082" font-size="12" font-weight="900">
            🪨{bottle.unlockOrder || 3}
          </text>
        </g>
      </g>
    );
  }

  if (special === 'paper_bag') {
    return (
      <g>
        <polygon points="9,50 82,53 84,199 7,195" fill={`url(#kraftBagGrad-${idx})`} stroke="#6e3f14" stroke-width="1.4" stroke-linejoin="round" />
        <polygon points="82,53 94,46 96,191 84,199" fill="#875120" stroke="#542f0c" stroke-width="1.3" stroke-linejoin="round" />
        <line x1="88" y1="50" x2="90" y2="195" stroke="#5e340e" stroke-width="1.1" stroke-dasharray="4 3" />
        <polygon points="9,50 15,44 21,50 27,44 33,51 39,45 45,51 51,45 57,52 63,46 69,52 75,46 82,53 94,46 88,41 82,47" fill="#e6b47e" stroke="#78471a" stroke-width="1.1" stroke-linejoin="round" />
        <line x1="12" y1="54" x2="10" y2="193" stroke="rgba(255, 235, 205, 0.55)" stroke-width="2.0" />
        <path d="M 9,66 L 82.5,69 L 94.5,62" fill="none" stroke="#b71c1c" stroke-width="4.5" stroke-linejoin="round" />
        <circle cx="46" cy="68" r="7.5" fill="#d32f2f" stroke="#ffdf6b" stroke-width="1.5" />
        <g transform="translate(31, 88)">
          <rect x="-2" y="0" width="34" height="66" rx="17" fill="rgba(48, 24, 8, 0.78)" stroke="#ffdf6b" stroke-width="1.6" />
          <path d="M 9,10 L 21,10 L 21,15 Q 29,20 29,28 L 29,57 A 14,3.8 0 0,1 1,57 L 1,28 Q 1,20 9,15 Z" fill="#870810" stroke="#ffffff" stroke-width="1.6" />
        </g>
      </g>
    );
  }

  return null;
};
