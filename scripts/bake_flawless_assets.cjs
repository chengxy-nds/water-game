const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const v10Path = path.resolve(__dirname, '../demo/v10.html');
const v10Content = fs.readFileSync(v10Path, 'utf8');

// 提取 COLORS
const COLORS = {
  red:    { name: '红色', left: '#b30804', mid: '#c40a05', highlight: '#dc1e18', right: '#9c0603', topMid: '#e31a1a', topRim: '#fc2829', topLight: '#ff7878' },
  yellow: { name: '黄色', left: '#ebb008', mid: '#fcc00b', highlight: '#ffd438', right: '#d99f04', topMid: '#fbd126', topRim: '#ffdb2c', topLight: '#fffb8b' },
  blue:   { name: '蓝色', left: '#1515ad', mid: '#1b1bc0', highlight: '#3238d9', right: '#101096', topMid: '#3a56ca', topRim: '#4a68d8', topLight: '#7a96ff' },
  green:  { name: '绿色', left: '#689905', mid: '#72a506', highlight: '#86ba14', right: '#588503', topMid: '#97cb1d', topRim: '#b2df4f', topLight: '#cff877' },
  purple: { name: '紫色', left: '#5f1294', mid: '#7319b0', highlight: '#8e2dcf', right: '#4b0c78', topMid: '#9638d6', topRim: '#b055ed', topLight: '#deb3ff' },
  orange: { name: '橙色', left: '#cf4400', mid: '#e65000', highlight: '#f5681a', right: '#b03800', topMid: '#ff731c', topRim: '#ff8f3d', topLight: '#ffc285' },
  cyan:   { name: '青色', left: '#0784c4', mid: '#0e9ae0', highlight: '#2bb6f7', right: '#056da6', topMid: '#2cb9fc', topRim: '#57ccff', topLight: '#a6e9ff' },
  pink:   { name: '粉色', left: '#c71864', mid: '#e02476', highlight: '#f54290', right: '#a31050', topMid: '#f74d97', topRim: '#ff70ae', topLight: '#ffb3d2' }
};

let colorDefs = '';
Object.entries(COLORS).forEach(([key, col]) => {
  colorDefs += `<linearGradient id="liq-${key}" x1="0%" y1="0%" x2="100%" y2="8%"><stop offset="0%" stop-color="${col.highlight}"/><stop offset="18%" stop-color="${col.topMid}"/><stop offset="52%" stop-color="${col.mid}"/><stop offset="84%" stop-color="${col.right}"/><stop offset="100%" stop-color="${col.left}"/></linearGradient>`;
  colorDefs += `<linearGradient id="top-${key}" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="${col.topLight}"/><stop offset="38%" stop-color="${col.topRim}"/><stop offset="85%" stop-color="${col.topMid}"/><stop offset="100%" stop-color="${col.mid}"/></linearGradient>`;
});

// 从 v10.html 精准提取 staticDefs (从 liq-mystery 到 defsEl.innerHTML)
const dMarker = 'd += `\n        <linearGradient id="liq-mystery"';
const dStart = v10Content.indexOf(dMarker) + 6;
const dEnd = v10Content.indexOf('`;\n      defsEl.innerHTML = d;', dStart);
const staticDefs = v10Content.substring(dStart, dEnd);
console.log('Successfully extracted staticDefs, length:', staticDefs.length);

// 从 v10.html 提取 burlap patterns 和 gradients (约 2138 行)
const patStart = v10Content.indexOf('<pattern id="burlapWeaveLightPat"');
const patEnd = v10Content.indexOf('<!-- 3D 黄色旋转箭头', patStart);
const burlapDefs = v10Content.substring(patStart, patEnd);

// 提取 UI 滤镜
const uiDefsStart = v10Content.indexOf('<defs id="global-ui-3d-defs">') + '<defs id="global-ui-3d-defs">'.length;
const uiDefsEnd = v10Content.indexOf('</defs>', uiDefsStart);
const uiDefs = v10Content.substring(uiDefsStart, uiDefsEnd);

const allDefs = colorDefs + '\n' + staticDefs + '\n' + burlapDefs + '\n' + uiDefs;

// 几何常数 (严格匹配 v10.html)
const vbMinX = 16.5, vbMinY = 3, vbW = 67, vbH = 204;
const neckLipTopY = 9.2;
const neckStemTopY = 20.0;
const shoulderTopY = 26.0;
const shoulderBotY = 55.0;
const bBotY = 193.0;
const innerBotY = bBotY - 1.8; // 191.2
const outerBotY = bBotY + 2.4; // 195.4
const pillarTopY = 46.5;
const pillarH = (bBotY - 9) - pillarTopY; // 137.5

const smoothOuterBodyPath = `
  M 36.4,${neckStemTopY}
  L 63.6,${neckStemTopY}
  L 63.6,${shoulderTopY}
  C 76.4,${shoulderTopY + 3.8} 82.2,${shoulderTopY + 12.5} 82.2,${shoulderBotY}
  L 82.2,${outerBotY}
  A 32.2,8.8 0 0,1 17.8,${outerBotY}
  L 17.8,${shoulderBotY}
  C 17.8,${shoulderTopY + 12.5} 23.6,${shoulderTopY + 3.8} 36.4,${shoulderTopY}
  Z
`;

const smoothClipPath = `
  M 37.2,${neckLipTopY}
  L 62.8,${neckLipTopY}
  L 62.8,${shoulderTopY}
  C 74.8,${shoulderTopY + 4.2} 80.2,${shoulderTopY + 13.0} 80.2,${shoulderBotY}
  L 80.2,${innerBotY}
  A 30.2,7.5 0 0,1 19.8,${innerBotY}
  L 19.8,${shoulderBotY}
  C 19.8,${shoulderTopY + 13.0} 25.2,${shoulderTopY + 4.2} 37.2,${shoulderTopY}
  Z
`;

const neckGroupSvg = `
  <g id="neck-group">
    <path d="M 36.0,20.2 Q 37.2,23.2 36.4,26.2 A 13.8,2.7 0 0,0 63.6,26.2 Q 62.8,23.2 64.0,20.2 Z" class="neck-dark-bg" fill="#1b438a" opacity="0.32" />
    <ellipse cx="50" cy="24.5" rx="10.4" ry="1.6" fill="rgba(120, 175, 255, 0.24)" />
    <path d="M 36.6,25.8 A 13.4,2.5 0 0,0 63.4,25.8" fill="none" stroke="#4a80db" stroke-width="1.15" opacity="0.88" />
    <path d="M 31.4,9.2 C 29.8,13.5 31.0,18.2 36.2,20.6 A 14.2,3.3 0 0,0 63.8,20.6 C 69.0,18.2 70.2,13.5 68.6,9.2 A 18.6,3.8 0 0,1 31.4,9.2 Z" class="neck-glass-lip" fill="url(#neckLipGrad)" opacity="0.82" stroke="#3b73cc" stroke-width="1.0" />
    <path d="M 57.2,11.2 C 61.5,11.0 63.6,11.6 62.8,15.2 C 62.2,18.2 60.0,19.8 56.4,20.1 C 57.0,17.2 57.5,14.0 57.2,11.2 Z" fill="rgba(230, 245, 255, 0.85)" />
    <path d="M 32.8,11.0 C 35.2,11.4 36.4,12.8 36.6,16.2 C 36.8,18.6 35.8,19.6 34.0,19.0 C 32.4,16.8 32.0,13.5 32.8,11.0 Z" fill="rgba(140, 190, 255, 0.62)" />
    <path d="M 35.8,20.4 A 14.6,3.3 0 0,0 64.2,20.4" fill="none" stroke="#6ea6f7" stroke-width="1.3" stroke-linecap="round" />
    <ellipse cx="50" cy="9.2" rx="18.5" ry="3.7" fill="url(#neckTopRimGrad)" opacity="0.82" stroke="#6b9fed" stroke-width="1.0" />
    <path d="M 32.0,9.6 A 18.1,3.5 0 0,0 68.0,9.6" fill="none" stroke="#b8d8ff" stroke-width="1.3" stroke-linecap="round" />
    <ellipse cx="50" cy="9.0" rx="10.2" ry="1.9" class="neck-dark-bg" fill="url(#mouthBoreGrad)" opacity="0.72" stroke="#5c92e6" stroke-width="0.95" />
    <path d="M 40.6,9.4 A 9.5,1.7 0 0,0 59.4,9.4" fill="none" stroke="#8cbaff" stroke-width="0.95" stroke-linecap="round" opacity="0.88" />
  </g>
`;

const glassBackSvg = `
  <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" />
  <rect x="17.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractL)" opacity="0.78" />
  <rect x="79.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractR)" opacity="0.82" />
  <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6" fill="rgba(22, 32, 58, 0.16)" stroke="url(#glassBaseInnerFloorGrad)" stroke-width="1.15" />
`;

const glassFrontSvg = `
  <g clip-path="url(#smoothClipDef)">
    <ellipse cx="34" cy="37.5" rx="13.5" ry="9.2" fill="url(#leftShoulderDomeGrad)" />
    <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" />
    <path class="shoulder-sheen" d="M 53.8,28.2 C 64.8,30.2 72.0,35.5 74.5,42.8 L 62.5,43.2 C 60.6,36.5 56.8,31.5 51.2,29.8 Z" fill="url(#windowShoulderGrad)" />
    <rect x="63.0" y="${pillarTopY}" width="11.4" height="${pillarH}" rx="2.4" fill="url(#rightPillarSheen)" />
    <path class="shoulder-sheen" d="M 65.2,29.8 C 74.2,34.2 78.0,40.2 78.6,47.5" fill="none" stroke="rgba(225, 242, 255, 0.65)" stroke-width="1.5" stroke-linecap="round" />
  </g>
  <path d="M 19.6,${innerBotY} A 30.4,7.5 0 0,0 80.4,${innerBotY} L 82.2,${outerBotY} A 32.2,8.8 0 0,1 17.8,${outerBotY} Z" fill="url(#baseCushionGrad)" />
  <path d="M 20.5,${innerBotY + 1.4} A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4} A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z" fill="url(#glassBaseRimHighlight)" opacity="0.68" />
  <path d="M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.25" stroke-linecap="round" />
  <path d="M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.55" stroke-linecap="round" />
  <path d="M 26.0,${outerBotY + 4.8} A 25.0,5.2 0 0,0 74.0,${outerBotY + 4.8}" fill="none" stroke="rgba(255, 255, 255, 0.52)" stroke-width="0.95" stroke-linecap="round" />
  <path d="M 32.0,${neckLipTopY} C 30.2,13.4 31.4,18.2 36.4,20.4 C 37.5,22.2 37.5,24.4 36.4,${shoulderTopY} C 23.6,${shoulderTopY + 4.2} 17.8,${shoulderTopY + 13.0} 17.8,${shoulderBotY} L 17.8,${outerBotY} A 32.2,8.8 0 0,0 82.2,${outerBotY} L 82.2,${shoulderBotY} C 82.2,${shoulderTopY + 13.0} 76.4,${shoulderTopY + 4.2} 63.6,${shoulderTopY} C 62.5,24.4 62.5,22.2 63.6,20.4 C 68.6,18.2 69.8,13.4 68.0,${neckLipTopY}" fill="none" stroke="url(#naturalRimGrad)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
  ${neckGroupSvg}
`;

const tubeEmptySvg = `
  ${glassBackSvg}
  ${glassFrontSvg}
`;

const tubeAdAuraSvg = `
  <ellipse cx="50" cy="${bBotY + 4}" rx="44" ry="11" fill="url(#purpleVortexGrad)" />
  <ellipse cx="50" cy="${bBotY + 4}" rx="38" ry="8.5" fill="none" stroke="#e879f9" stroke-width="1.8" stroke-dasharray="22 8" opacity="0.88"/>
  <ellipse cx="50" cy="${bBotY + 4}" rx="28" ry="5.8" fill="none" stroke="#f0abfc" stroke-width="1.5" stroke-dasharray="14 6" opacity="0.92"/>
  <ellipse cx="13" cy="122" rx="5" ry="55" fill="url(#purpleSideGlow)" />
  <ellipse cx="87" cy="122" rx="5" ry="55" fill="url(#purpleSideGlow)" />
  <g transform="translate(50, 112) rotate(-12) scale(1.28)" style="filter:drop-shadow(0 4px 8px rgba(59, 7, 100, 0.45));">
    <rect x="-15" y="-6" width="30" height="22" rx="4.5" fill="#581c87" stroke="#e9d5ff" stroke-width="1.4"/>
    <rect x="-15" y="-8" width="30" height="21" rx="4.5" fill="url(#camPurpleFaceGrad)" />
    <g transform="rotate(-10, -15, -8)">
      <rect x="-15" y="-14" width="30" height="6.5" rx="2" fill="#3b0764" stroke="#ffffff" stroke-width="0.9"/>
      <polygon points="-11,-14 -6,-14 -9,-7.5 -14,-7.5" fill="#ffffff"/>
      <polygon points="-1,-14 4,-14 1,-7.5 -4,-7.5" fill="#ffffff"/>
      <polygon points="9,-14 14,-14 11,-7.5 6,-7.5" fill="#ffffff"/>
    </g>
    <polygon points="-4,-2 6,4 -4,10" fill="#a3e635" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="9" cy="-3.5" r="1.3" fill="#ffffff" opacity="0.9"/>
  </g>
`;

const burlapBase = `
  <ellipse cx="42" cy="34" rx="45" ry="11.5" transform="rotate(-5, 42, 34)" fill="url(#terracottaShadowGrad)" />
  <ellipse cx="48" cy="31" rx="38" ry="8.5" fill="rgba(115, 48, 8, 0.36)" />
  <path d="M 11,19.5 C 11,13 25,10 50,10 C 75,10 89,13 89,19.5 L 87.5,27.5 C 86,35.5 72,39.5 50,39.5 C 28,39.5 14,35.5 12.5,27.5 Z" fill="url(#burlapSideWallLight)" />
  <path d="M 11,19.5 C 11,13 25,10 50,10 C 75,10 89,13 89,19.5 L 87.5,27.5 C 86,35.5 72,39.5 50,39.5 C 28,39.5 14,35.5 12.5,27.5 Z" fill="url(#burlapWeaveLightPat)" opacity="0.28" />
  <path d="M 50,7.5 C 76,7.5 89,11.5 89,19.2 C 89,26.8 76,31.2 50,31.2 C 24,31.2 11,26.8 11,19.2 C 11,11.5 24,7.5 50,7.5 Z" fill="url(#burlapWeaveLightPat)" />
  <path d="M 50,7.5 C 76,7.5 89,11.5 89,19.2 C 89,26.8 76,31.2 50,31.2 C 24,31.2 11,26.8 11,19.2 C 11,11.5 24,7.5 50,7.5 Z" fill="url(#burlapTopShade)" stroke="rgba(255, 248, 225, 0.68)" stroke-width="1.1" />
`;

const burlapSpecial = `
  ${burlapBase}
  <g transform="translate(50, 19.5)">
    <ellipse cx="0" cy="0" rx="22" ry="6.2" fill="none" stroke="#fffdf7" stroke-width="1.9" stroke-dasharray="1.8 3.2" stroke-linecap="round" opacity="0.88"/>
    <ellipse cx="0" cy="0" rx="17" ry="4.6" fill="none" stroke="#fffdf7" stroke-width="1.5" stroke-dasharray="1.5 2.8" stroke-linecap="round" opacity="0.78"/>
  </g>
`;

// 生成烘焙 HTML (3x 尺寸：试管 201x612，软垫 300x138)
const bakeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: transparent; overflow: hidden; }
  .asset-box { position: absolute; overflow: visible; }
  svg { width: 100%; height: 100%; display: block; overflow: visible; }
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute; width:0; height:0;">
  <defs>
    ${allDefs}
    <clipPath id="smoothClipDef">
      <path d="${smoothClipPath}" />
    </clipPath>
  </defs>
</svg>

<!-- 1. tube_empty (201 x 612) -->
<div id="tube_empty" class="asset-box" style="left:0; top:0; width:201px; height:612px;">
  <svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
    ${tubeEmptySvg}
  </svg>
</div>

<!-- 1. tube_empty (201 x 612) -->
<div id="tube_empty" class="asset-box" style="left:0; top:0; width:201px; height:612px;">
  <svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
    ${tubeEmptySvg}
  </svg>
</div>

<!-- 2. tube_glass_back (201 x 612) -->
<div id="tube_glass_back" class="asset-box" style="left:300px; top:0; width:201px; height:612px;">
  <svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
    ${glassBackSvg}
  </svg>
</div>

<!-- 3. tube_glass_front (201 x 612) -->
<div id="tube_glass_front" class="asset-box" style="left:600px; top:0; width:201px; height:612px;">
  <svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
    ${glassFrontSvg}
  </svg>
</div>

<!-- 4. tube_ad_aura (201 x 612) -->
<div id="tube_ad_aura" class="asset-box" style="left:900px; top:0; width:201px; height:612px;">
  <svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
    ${tubeAdAuraSvg}
  </svg>
</div>

<!-- 5. burlap_coaster_normal (300 x 138) -->
<div id="burlap_coaster_normal" class="asset-box" style="left:0; top:700px; width:300px; height:138px;">
  <svg viewBox="0 0 100 46" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    ${burlapBase}
  </svg>
</div>

<!-- 6. burlap_coaster_special (300 x 138) -->
<div id="burlap_coaster_special" class="asset-box" style="left:400px; top:700px; width:300px; height:138px;">
  <svg viewBox="0 0 100 46" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    ${burlapSpecial}
  </svg>
</div>

<!-- 7. liquid_gradients_atlas (256 x 64: 8 rows of 8px height) -->
<div id="liquid_gradients_atlas" class="asset-box" style="left:800px; top:700px; width:256px; height:64px;">
  <svg viewBox="0 0 256 64" width="256" height="64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect x="0" y="0" width="256" height="8" fill="url(#liq-red)" />
    <rect x="0" y="8" width="256" height="8" fill="url(#liq-yellow)" />
    <rect x="0" y="16" width="256" height="8" fill="url(#liq-blue)" />
    <rect x="0" y="24" width="256" height="8" fill="url(#liq-green)" />
    <rect x="0" y="32" width="256" height="8" fill="url(#liq-purple)" />
    <rect x="0" y="40" width="256" height="8" fill="url(#liq-orange)" />
    <rect x="0" y="48" width="256" height="8" fill="url(#liq-cyan)" />
    <rect x="0" y="56" width="256" height="8" fill="url(#liq-pink)" />
  </svg>
</div>

<!-- 8. meniscus_gradients_atlas (512 x 64: 8 squares of 64x64) -->
<div id="meniscus_gradients_atlas" class="asset-box" style="left:800px; top:780px; width:512px; height:64px;">
  <svg viewBox="0 0 512 64" width="512" height="64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect x="0" y="0" width="64" height="64" fill="url(#top-red)" />
    <rect x="64" y="0" width="64" height="64" fill="url(#top-yellow)" />
    <rect x="128" y="0" width="64" height="64" fill="url(#top-blue)" />
    <rect x="192" y="0" width="64" height="64" fill="url(#top-green)" />
    <rect x="256" y="0" width="64" height="64" fill="url(#top-purple)" />
    <rect x="320" y="0" width="64" height="64" fill="url(#top-orange)" />
    <rect x="384" y="0" width="64" height="64" fill="url(#top-cyan)" />
    <rect x="448" y="0" width="64" height="64" fill="url(#top-pink)" />
  </svg>
</div>

</body>
</html>
`;

const htmlFile = path.resolve(__dirname, 'bake_textures.html');
fs.writeFileSync(htmlFile, bakeHtml);
console.log('✓ 已生成烘焙 HTML:', htmlFile);

// 运行 Chrome headless 进行无损截图
const sheetFile = path.resolve(__dirname, 'bake_sheet.png');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const cmd = `"${chromePath}" --headless=new --default-background-color=00000000 --screenshot="${sheetFile}" --window-size=1400,1000 "file:///${htmlFile.replace(/\\/g, '/')}"`;
console.log('[Chrome] 正在渲染高保真矢量素材图集...');
execSync(cmd, { stdio: 'inherit' });

if (!fs.existsSync(sheetFile)) {
  throw new Error('Chrome 渲染图集失败！');
}
console.log('✓ 图集渲染成功！开始切片...');

// 切片配置
const slices = [
  { name: 'tube_empty.png', left: 0, top: 0, width: 201, height: 612 },
  { name: 'tube_glass_back.png', left: 300, top: 0, width: 201, height: 612 },
  { name: 'tube_glass_front.png', left: 600, top: 0, width: 201, height: 612 },
  { name: 'tube_glass_ad.png', left: 900, top: 0, width: 201, height: 612 },
  { name: 'burlap_coaster_normal.png', left: 0, top: 700, width: 300, height: 138 },
  { name: 'burlap_coaster_special.png', left: 400, top: 700, width: 300, height: 138 },
  { name: 'liquid_gradients_atlas.png', left: 800, top: 700, width: 256, height: 64 },
  { name: 'meniscus_gradients_atlas.png', left: 800, top: 780, width: 512, height: 64 }
];

const targetDirs = [
  'E:/GithubProjects/倒水game-godot/assets/textures',
  'C:/倒水game-godot/assets/textures'
];

async function run() {
  for (const s of slices) {
    const croppedBuffer = await sharp(sheetFile)
      .extract({ left: s.left, top: s.top, width: s.width, height: s.height })
      .png()
      .toBuffer();

    for (const dir of targetDirs) {
      if (fs.existsSync(dir)) {
        const dest = path.join(dir, s.name);
        fs.writeFileSync(dest, croppedBuffer);
        console.log(`  -> 写入: ${dest} (${s.width}x${s.height})`);
      }
    }
  }
  console.log('=== 所有高保真矢量资产光栅化完毕！===');
}

run().catch(console.error);
