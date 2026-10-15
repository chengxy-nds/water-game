const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

function generateBagSVG(color, isLocked = false) {
  if (isLocked) {
    return `
    <svg viewBox="6 0 92 124" width="368" height="496" xmlns="http://www.w3.org/2000/svg">
      <path d="M 38,27 C 38,2 66,2 66,27" fill="none" stroke="#94a3b8" stroke-width="3.2" stroke-linecap="round"/>
      <polygon points="12,28 76,28 92,22 26,22" fill="#475569" stroke="#64748b" stroke-width="0.8"/>
      <polygon points="12,28 76,28 76,118 12,114" fill="#cbd5e1" />
      <polygon points="76,28 85,25 85,114 76,118" fill="#94a3b8" />
      <polygon points="85,25 94,22 94,110 85,114" fill="#64748b" />
      <polygon points="12,96 76,100 76,118 12,114" fill="#94a3b8" />
      <polygon points="76,100 94,92 94,110 76,118" fill="#475569" />
      <polygon points="76,118 85,103 94,110" fill="#334155" />
      <circle cx="28" cy="35" r="3.4" fill="#e2e8f0" stroke="#64748b" stroke-width="1"/>
      <circle cx="28" cy="35" r="1.7" fill="#334155"/>
      <circle cx="58" cy="35" r="3.4" fill="#e2e8f0" stroke="#64748b" stroke-width="1"/>
      <circle cx="58" cy="35" r="1.7" fill="#334155"/>
      <path d="M 28,35 C 28,2 58,2 58,35" fill="none" stroke="#e2e8f0" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="23" y="44" width="42" height="50" rx="5.5" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2.5"/>
      <g transform="translate(30, 59)">
        <rect x="0" y="2" width="22" height="17" rx="4.5" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
        <polygon points="21,6 30,1 30,16 21,11" fill="#f8fafc" stroke="#64748b" stroke-width="1" stroke-linejoin="round"/>
        <polygon points="8,4.5 8,12.5 15,8.5" fill="#475569"/>
      </g>
    </svg>
    `;
  }

  const colMap = {
    red: { bagMain: '#d4151d', bagDark: '#990910' },
    yellow: { bagMain: '#f5a600', bagDark: '#c27d00' },
    blue: { bagMain: '#1c31cc', bagDark: '#101d8a' }
  };
  const c = colMap[color] || colMap.yellow;

  return `
  <svg viewBox="6 0 92 124" width="368" height="496" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bagFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="70%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#eef2f6" />
      </linearGradient>
      <clipPath id="bagWinClip">
        <rect x="24.5" y="45.5" width="39" height="47" rx="4.2" />
      </clipPath>
    </defs>

    <path d="M 38,27 C 38,1 66,1 66,27" fill="none" stroke="#cbd5e1" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 38,27 C 38,1 66,1 66,27" fill="none" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round"/>

    <polygon points="12,28 76,28 94,22 28,22" fill="#94a3b8" stroke="#cbd5e1" stroke-width="0.8" stroke-linejoin="round"/>
    <polygon points="15,27.5 74,27.5 89,23 29,23" fill="#64748b" />

    <polygon points="12,28 76,28 76,118 12,114" fill="url(#bagFrontGrad)" stroke="#e2e8f0" stroke-width="0.6" />

    <polygon points="76,28 85.5,24.8 85.5,113.5 76,118" fill="#d9dde3" />
    <polygon points="85.5,24.8 94,22 94,109.5 85.5,113.5" fill="#b8bec8" />
    <line x1="85.5" y1="24.8" x2="85.5" y2="113.5" stroke="#9ea6b2" stroke-width="0.8" />

    <polygon points="11.8,95 76.2,99 76.2,118.2 11.8,114.2" fill="${c.bagMain}" />
    <polygon points="76,99 94.2,91 94.2,109.8 76,118.2" fill="${c.bagDark}" />
    <polygon points="76,118.2 85.5,101.5 94.2,109.8" fill="rgba(0, 0, 0, 0.18)" />
    <line x1="76" y1="118.2" x2="85.5" y2="101.5" stroke="rgba(255,255,255,0.22)" stroke-width="0.7" />

    <rect x="23" y="44" width="42" height="50" rx="5.8" fill="#d9d9d9" stroke="${c.bagMain}" stroke-width="3.2"/>
    <g clip-path="url(#bagWinClip)">
      <rect x="24" y="45" width="28" height="48" fill="#d9d9d9" />
      <rect x="52" y="45" width="13" height="48" fill="#a8a8a8" />
      <polygon points="24,45 43,45 24,80" fill="rgba(255, 255, 255, 0.38)" />
      <polygon points="48,45 55,45 30,93 24,93" fill="rgba(255, 255, 255, 0.18)" />
    </g>

    <circle cx="28" cy="35" r="3.5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.1"/>
    <circle cx="28" cy="35" r="1.8" fill="#475569"/>
    <circle cx="58" cy="35" r="3.5" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.1"/>
    <circle cx="58" cy="35" r="1.8" fill="#475569"/>
    <path d="M 28,35 C 28,2 58,2 58,35" fill="none" stroke="#f8fafc" stroke-width="3.6" stroke-linecap="round"/>
  </svg>
  `;
}

async function main() {
  const bags = [
    { name: 'bag_item_red.png', color: 'red', locked: false },
    { name: 'bag_item_yellow.png', color: 'yellow', locked: false },
    { name: 'bag_item_blue.png', color: 'blue', locked: false },
    { name: 'bag_item_video.png', color: '', locked: true }
  ];

  for (const b of bags) {
    const svg = generateBagSVG(b.color, b.locked);
    const pngPath = path.join(outDir, b.name);
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    console.log(`✓ Baked ${b.name}`);

    // 创建对应 meta
    const metaPath = pngPath + '.meta';
    if (!fs.existsSync(metaPath)) {
      const uuid = crypto.randomUUID();
      const meta = {
        ver: '1.0.27',
        importer: 'image',
        imported: true,
        uuid: uuid,
        files: ['.json', '.png'],
        subMetas: {
          '6c48a': {
            importer: 'texture',
            uuid: uuid + '@6c48a',
            displayName: b.name.replace('.png', ''),
            id: '6c48a',
            name: 'texture',
            userData: { wrapModeS: 'clamp-to-edge', wrapModeT: 'clamp-to-edge', imageUuidOrDatabaseUri: uuid, isUuid: true, visible: false },
            ver: '1.0.22', imported: true, files: ['.json'], subMetas: {}
          },
          'f9941': {
            importer: 'sprite-frame',
            uuid: uuid + '@f9941',
            displayName: b.name.replace('.png', ''),
            id: 'f9941',
            name: 'spriteFrame',
            userData: { trimThreshold: 1, rotated: false, packable: true, pixelsToUnit: 100, pivotX: 0.5, pivotY: 0.5, meshType: 0 },
            ver: '1.0.17', imported: true, files: ['.json'], subMetas: {}
          }
        }
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      console.log(`  Created meta with uuid: ${uuid}`);
    }
  }
}

main().catch(console.error);
