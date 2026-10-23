const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. 读取 bottle_defs_func.js 中的静态渐变
const funcPath = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/70af0a25-ca3a-4bf5-8e88-71c5e5be1970/scratch/bottle_defs_func.js';
const funcCode = fs.readFileSync(funcPath, 'utf8');

// 提取静态渐变部分 (从 line 10 到 line 115)
const staticDefsStart = funcCode.indexOf('d += `\n') + 7;
const staticDefsEnd = funcCode.indexOf('`;\n      defsEl.innerHTML = d;');
const staticDefs = funcCode.slice(staticDefsStart, staticDefsEnd);

// 读取 v10.html 中的 COLORS 定义，并把颜色渐变也生成出来
const v10Path = path.resolve(__dirname, '../demo/v10.html');
const v10Content = fs.readFileSync(v10Path, 'utf8');

const COLORS = {
  red:    { name: '红色', left: '#b30804', mid: '#c40a05', highlight: '#dc1e18', right: '#9c0603', topMid: '#e31a1a', topRim: '#fc2829', topLight: '#ff7878', bagMain: '#d4151d', bagDark: '#990910' },
  yellow: { name: '黄色', left: '#ebb008', mid: '#fcc00b', highlight: '#ffd438', right: '#d99f04', topMid: '#fbd126', topRim: '#ffdb2c', topLight: '#fffb8b', bagMain: '#f5a600', bagDark: '#c27d00' },
  blue:   { name: '蓝色', left: '#1515ad', mid: '#1b1bc0', highlight: '#3238d9', right: '#101096', topMid: '#3a56ca', topRim: '#4a68d8', topLight: '#7a96ff', bagMain: '#1c31cc', bagDark: '#101d8a' },
  green:  { name: '绿色', left: '#689905', mid: '#72a506', highlight: '#86ba14', right: '#588503', topMid: '#97cb1d', topRim: '#b2df4f', topLight: '#cff877', bagMain: '#5AA21A', bagDark: '#3F7710' },
  purple: { name: '紫色', left: '#5f1294', mid: '#7319b0', highlight: '#8e2dcf', right: '#4b0c78', topMid: '#9638d6', topRim: '#b055ed', topLight: '#deb3ff', bagMain: '#731fa8', bagDark: '#4d1078' },
  orange: { name: '橙色', left: '#cf4400', mid: '#e65000', highlight: '#f5681a', right: '#b03800', topMid: '#ff731c', topRim: '#ff8f3d', topLight: '#ffc285', bagMain: '#ea5504', bagDark: '#b33c00' },
  cyan:   { name: '青色', left: '#0784c4', mid: '#0e9ae0', highlight: '#2bb6f7', right: '#056da6', topMid: '#2cb9fc', topRim: '#57ccff', topLight: '#a6e9ff', bagMain: '#149ee3', bagDark: '#0b72ab' },
  pink:   { name: '粉色', left: '#c71864', mid: '#e02476', highlight: '#f54290', right: '#a31050', topMid: '#f74d97', topRim: '#ff70ae', topLight: '#ffb3d2', bagMain: '#e02476', bagDark: '#a31050' }
};

let colorDefs = '';
Object.entries(COLORS).forEach(([key, col]) => {
  colorDefs += `<linearGradient id="liq-${key}" x1="0%" y1="0%" x2="100%" y2="8%"><stop offset="0%" stop-color="${col.highlight}"/><stop offset="18%" stop-color="${col.topMid}"/><stop offset="52%" stop-color="${col.mid}"/><stop offset="84%" stop-color="${col.right}"/><stop offset="100%" stop-color="${col.left}"/></linearGradient>`;
  colorDefs += `<linearGradient id="top-${key}" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="${col.topLight}"/><stop offset="38%" stop-color="${col.topRim}"/><stop offset="85%" stop-color="${col.topMid}"/><stop offset="100%" stop-color="${col.mid}"/></linearGradient>`;
});

const allDefs = colorDefs + '\n' + staticDefs;

console.log('Successfully prepared allDefs, total length:', allDefs.length);

// 提取尺寸常量 (紧贴瓶身黄金裁切: viewBox: 16 6 68 194)
// 彻底去除多余的左右透明留白，让瓶身与液体充满 100% 饱满物理空间！
const vbMinX = 16, vbMinY = 6, vbW = 68, vbH = 194;
const neckLipTopY = 9.2;
const neckStemTopY = 20.4;
const shoulderTopY = 38.0;
const shoulderBotY = 48.0;
const bBotY = 193.0;
const innerBotY = bBotY - 1.8;
const outerBotY = bBotY + 2.4;
const pillarTopY = shoulderBotY;
const pillarH = innerBotY - pillarTopY;
const neckOffsetY = 0;

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

// A: 玻璃背壳 (Back Shell)
const svgBack = `
<svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${allDefs}
  </defs>
  <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" />
  <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6"
           fill="rgba(22, 32, 58, 0.16)" stroke="url(#glassBaseInnerFloorGrad)" stroke-width="1.15" />
</svg>
`;

// B: 玻璃前壳 (Front Shell - 包含全部立柱高光、瓶肩反光、厚底焦散、翻边瓶口与水晶描边)
const svgFront = `
<svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${allDefs}
    <clipPath id="front-bclip">
      <path d="${smoothClipPath}" />
    </clipPath>
  </defs>

  <rect x="17.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractL)" opacity="0.78" />
  <rect x="79.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractR)" opacity="0.82" />

  <g clip-path="url(#front-bclip)">
    <ellipse cx="34" cy="${37.5 + neckOffsetY}" rx="13.5" ry="9.2" fill="url(#leftShoulderDomeGrad)" />
    <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" />
    <path class="shoulder-sheen"
          d="M 53.8,${28.2 + neckOffsetY}
             C 64.8,${30.2 + neckOffsetY} 72.0,${35.5 + neckOffsetY} 74.5,${42.8 + neckOffsetY}
             L 62.5,${43.2 + neckOffsetY}
             C 60.6,${36.5 + neckOffsetY} 56.8,${31.5 + neckOffsetY} 51.2,${29.8 + neckOffsetY}
             Z"
          fill="url(#windowShoulderGrad)" />
    <rect x="63.0" y="${pillarTopY}" width="11.4" height="${pillarH}" rx="2.4"
          fill="url(#rightPillarSheen)" />
    <path class="shoulder-sheen"
          d="M 65.2,${29.8 + neckOffsetY} C 74.2,${34.2 + neckOffsetY} 78.0,${40.2 + neckOffsetY} 78.6,${47.5 + neckOffsetY}"
          fill="none" stroke="rgba(225, 242, 255, 0.65)" stroke-width="1.5" stroke-linecap="round" />
  </g>

  <path d="M 19.6,${innerBotY}
           A 30.4,7.5 0 0,0 80.4,${innerBotY}
           L 82.2,${outerBotY}
           A 32.2,8.8 0 0,1 17.8,${outerBotY}
           Z"
        fill="url(#baseCushionGrad)" />
  <path d="M 20.5,${innerBotY + 1.4}
           A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4}
           A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z"
        fill="url(#glassBaseRimHighlight)" opacity="0.68" />
  <path d="M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}"
        fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.25" stroke-linecap="round" />
  <path d="M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}"
        fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.55" stroke-linecap="round" />
  <path d="M 26.0,${outerBotY + 4.8} A 25.0,5.2 0 0,0 74.0,${outerBotY + 4.8}"
        fill="none" stroke="rgba(255, 255, 255, 0.52)" stroke-width="0.95" stroke-linecap="round" />

  <path d="M 32.0,${neckLipTopY}
           C 30.2,${13.4 + neckOffsetY} 31.4,${18.2 + neckOffsetY} 36.4,${20.4 + neckOffsetY}
           C 37.5,${22.2 + neckOffsetY} 37.5,${24.4 + neckOffsetY} 36.4,${shoulderTopY}
           C 23.6,${shoulderTopY + 4.2} 17.8,${shoulderTopY + 13.0} 17.8,${shoulderBotY}
           L 17.8,${outerBotY}
           A 32.2,8.8 0 0,0 82.2,${outerBotY}
           L 82.2,${shoulderBotY}
           C 82.2,${shoulderTopY + 13.0} 76.4,${shoulderTopY + 4.2} 63.6,${shoulderTopY}
           C 62.5,${24.4 + neckOffsetY} 62.5,${22.2 + neckOffsetY} 63.6,${20.4 + neckOffsetY}
           C 68.6,${18.2 + neckOffsetY} 69.8,${13.4 + neckOffsetY} 68.0,${neckLipTopY}"
        fill="none" stroke="url(#naturalRimGrad)"
        stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />

  <g id="neck-group" transform="translate(0, ${neckOffsetY})">
    <path d="M 36.0,20.2 Q 37.2,23.2 36.4,26.2 A 13.8,2.7 0 0,0 63.6,26.2 Q 62.8,23.2 64.0,20.2 Z"
          class="neck-dark-bg" fill="#1b438a" opacity="0.32" />
    <ellipse cx="50" cy="24.5" rx="10.4" ry="1.6" fill="rgba(120, 175, 255, 0.24)" />
    <path d="M 36.6,25.8 A 13.4,2.5 0 0,0 63.4,25.8"
          fill="none" stroke="#4a80db" stroke-width="1.15" opacity="0.88" />
    <path d="M 31.4,9.2 C 29.8,13.5 31.0,18.2 36.2,20.6 A 14.2,3.3 0 0,0 63.8,20.6 C 69.0,18.2 70.2,13.5 68.6,9.2 A 18.6,3.8 0 0,1 31.4,9.2 Z"
          class="neck-glass-lip" fill="url(#neckLipGrad)" opacity="0.82"
          stroke="#3b73cc" stroke-width="1.0" />
    <path d="M 57.2,11.2 C 61.5,11.0 63.6,11.6 62.8,15.2 C 62.2,18.2 60.0,19.8 56.4,20.1 C 57.0,17.2 57.5,14.0 57.2,11.2 Z"
          fill="rgba(230, 245, 255, 0.85)" />
    <path d="M 32.8,11.0 C 35.2,11.4 36.4,12.8 36.6,16.2 C 36.8,18.6 35.8,19.6 34.0,19.0 C 32.4,16.8 32.0,13.5 32.8,11.0 Z"
          fill="rgba(140, 190, 255, 0.62)" />
    <path d="M 35.8,20.4 A 14.6,3.3 0 0,0 64.2,20.4"
          fill="none" stroke="#6ea6f7" stroke-width="1.3" stroke-linecap="round" />
    <ellipse cx="50" cy="9.2" rx="18.5" ry="3.7"
             fill="url(#neckTopRimGrad)" opacity="0.82" stroke="#6b9fed" stroke-width="1.0" />
    <path d="M 32.0,9.6 A 18.1,3.5 0 0,0 68.0,9.6"
          fill="none" stroke="#b8d8ff" stroke-width="1.3" stroke-linecap="round" />
    <ellipse cx="50" cy="9.0" rx="10.2" ry="1.9"
             class="neck-dark-bg" fill="url(#mouthBoreGrad)" opacity="0.72" stroke="#5c92e6" stroke-width="0.95" />
    <path d="M 40.6,9.4 A 9.5,1.7 0 0,0 59.4,9.4"
          fill="none" stroke="#8cbaff" stroke-width="0.95" stroke-linecap="round" opacity="0.88" />
  </g>
</svg>
`;

// C: 专属备用广告试管 (Ad Tube)
const svgAd = `
<svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${allDefs}
    <clipPath id="ad-bclip">
      <path d="${smoothClipPath}" />
    </clipPath>
  </defs>
  <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" opacity="0.65" />
  <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6"
           fill="rgba(48, 18, 72, 0.22)" stroke="#c084fc" stroke-width="1.1" />
  <g clip-path="url(#ad-bclip)">
    <ellipse cx="34" cy="${37.5 + neckOffsetY}" rx="13.5" ry="9.2" fill="url(#leftShoulderDomeGrad)" opacity="0.7" />
    <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" opacity="0.75" />
    <rect x="63.0" y="${pillarTopY}" width="11.4" height="${pillarH}" rx="2.4" fill="url(#rightPillarSheen)" opacity="0.8" />
  </g>
  <path d="M 19.6,${innerBotY}
           A 30.4,7.5 0 0,0 80.4,${innerBotY}
           L 82.2,${outerBotY}
           A 32.2,8.8 0 0,1 17.8,${outerBotY}
           Z"
        fill="url(#baseCushionGrad)" opacity="0.8" />
  <path d="M 20.5,${innerBotY + 1.4}
           A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4}
           A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z"
        fill="url(#glassBaseRimHighlight)" opacity="0.75" />
  <path d="M 32.0,${neckLipTopY}
           C 30.2,${13.4 + neckOffsetY} 31.4,${18.2 + neckOffsetY} 36.4,${20.4 + neckOffsetY}
           C 37.5,${22.2 + neckOffsetY} 37.5,${24.4 + neckOffsetY} 36.4,${shoulderTopY}
           C 23.6,${shoulderTopY + 4.2} 17.8,${shoulderTopY + 13.0} 17.8,${shoulderBotY}
           L 17.8,${outerBotY}
           A 32.2,8.8 0 0,0 82.2,${outerBotY}
           L 82.2,${shoulderBotY}
           C 82.2,${shoulderTopY + 13.0} 76.4,${shoulderTopY + 4.2} 63.6,${shoulderTopY}
           C 62.5,${24.4 + neckOffsetY} 62.5,${22.2 + neckOffsetY} 63.6,${20.4 + neckOffsetY}
           C 68.6,${18.2 + neckOffsetY} 69.8,${13.4 + neckOffsetY} 68.0,${neckLipTopY}"
        fill="none" stroke="#d884ff"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
  <g id="neck-group" transform="translate(0, ${neckOffsetY})">
    <ellipse cx="50" cy="9.2" rx="18.5" ry="3.7"
             fill="url(#neckTopRimGrad)" opacity="0.82" stroke="#c084fc" stroke-width="1.0" />
    <ellipse cx="50" cy="9.0" rx="10.2" ry="1.9"
             fill="#3b0764" opacity="0.65" stroke="#a855f7" stroke-width="0.95" />
  </g>
</svg>
`;

// D: 原版 100% 复刻 3D 粗麻布编织软垫 (含暖赤陶地面阴影、圆润枕状侧壁与麻线经纬)
const svgCoaster = `
<svg viewBox="0 0 100 46" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${allDefs}
  </defs>
  <!-- 1. 暖赤陶色柔和地面投影 -->
  <ellipse cx="42" cy="34" rx="45" ry="11.5" transform="rotate(-5, 42, 34)" fill="rgba(152, 68, 8, 0.44)" filter="url(#warmCastShadowBlur)" />
  <ellipse cx="48" cy="31" rx="38" ry="8.5" fill="rgba(115, 48, 8, 0.36)" filter="url(#warmCastShadowBlur)" />

  <!-- 2. 3D 软垫厚实侧面 -->
  <path d="M 11,19.5
           C 11,13 25,10 50,10
           C 75,10 89,13 89,19.5
           L 87.5,27.5
           C 86,35.5 72,39.5 50,39.5
           C 28,39.5 14,35.5 12.5,27.5 Z"
        fill="url(#burlapSideWallLight)" />

  <!-- 3. 3D 软垫饱满顶面与高光边缘 -->
  <path d="M 50,7.5
           C 76,7.5 89,11.5 89,19.2
           C 89,26.8 76,31.2 50,31.2
           C 24,31.2 11,26.8 11,19.2
           C 11,11.5 24,7.5 50,7.5 Z"
        fill="url(#burlapTopShade)"
        stroke="rgba(255, 248, 225, 0.68)" stroke-width="1.1" />

  <!-- 4. 软垫表面接触 AO 阴影 -->
  <ellipse cx="50" cy="18.5" rx="28" ry="6.2" fill="url(#burlapContactAOGrad)" opacity="0.75" />
</svg>
`;

async function main() {
  const targetW = 204; // 3x 超清 204x582 (68:194)
  const targetH = 582;

  const coasterW = 240; // 软垫 240x110 (100:46)
  const coasterH = 110;

  const destDirs = [
    path.resolve(__dirname, '../../倒水game-godot/assets/textures'),
    'C:/倒水game-godot/assets/textures'
  ];

  for (const dir of destDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(Buffer.from(svgBack)).resize(targetW, targetH).png().toFile(path.join(dir, 'tube_glass_back.png'));
    await sharp(Buffer.from(svgFront)).resize(targetW, targetH).png().toFile(path.join(dir, 'tube_glass_front.png'));
    await sharp(Buffer.from(svgAd)).resize(targetW, targetH).png().toFile(path.join(dir, 'tube_glass_ad.png'));
    await sharp(Buffer.from(svgCoaster)).resize(coasterW, coasterH).png().toFile(path.join(dir, 'burlap_coaster_normal.png'));

    console.log(`✓ 已成功生成极致晶莹琉璃瓶身与3D软垫到: ${dir}`);
  }
}

main().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
