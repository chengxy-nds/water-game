const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

const defs = `
  <defs>
    <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 252, 242, 0.22)"/>
      <stop offset="22%" stop-color="rgba(255, 248, 232, 0.08)"/>
      <stop offset="58%" stop-color="rgba(255, 246, 225, 0.05)"/>
      <stop offset="84%" stop-color="rgba(255, 254, 248, 0.24)"/>
      <stop offset="100%" stop-color="rgba(255, 250, 235, 0.18)"/>
    </linearGradient>
    <linearGradient id="baseCushionGrad" x1="0%" y1="0%" x2="100%" y2="12%">
      <stop offset="0%" stop-color="rgba(255, 252, 240, 0.65)"/>
      <stop offset="14%" stop-color="rgba(165, 215, 255, 0.38)"/>
      <stop offset="32%" stop-color="rgba(28, 36, 58, 0.48)"/>
      <stop offset="52%" stop-color="rgba(18, 26, 48, 0.56)"/>
      <stop offset="72%" stop-color="rgba(42, 56, 88, 0.42)"/>
      <stop offset="88%" stop-color="rgba(195, 232, 255, 0.62)"/>
      <stop offset="100%" stop-color="rgba(255, 252, 240, 0.72)"/>
    </linearGradient>
    <linearGradient id="glassBaseInnerFloorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.58)"/>
      <stop offset="25%" stop-color="rgba(160, 212, 255, 0.32)"/>
      <stop offset="50%" stop-color="rgba(30, 42, 68, 0.40)"/>
      <stop offset="78%" stop-color="rgba(175, 224, 255, 0.46)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.66)"/>
    </linearGradient>
    <linearGradient id="glassBaseRimHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.18)"/>
      <stop offset="18%" stop-color="rgba(255, 255, 255, 0.82)"/>
      <stop offset="38%" stop-color="rgba(215, 242, 255, 0.92)"/>
      <stop offset="50%" stop-color="rgba(145, 205, 255, 0.38)"/>
      <stop offset="62%" stop-color="rgba(215, 242, 255, 0.92)"/>
      <stop offset="82%" stop-color="rgba(255, 255, 255, 0.82)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.22)"/>
    </linearGradient>
    <linearGradient id="glassWallSideRefractL" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.46)"/>
      <stop offset="60%" stop-color="rgba(175, 220, 255, 0.18)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="glassWallSideRefractR" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.0)"/>
      <stop offset="40%" stop-color="rgba(175, 220, 255, 0.20)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.52)"/>
    </linearGradient>
    <linearGradient id="naturalRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.88)"/>
      <stop offset="25%" stop-color="rgba(255, 248, 225, 0.68)"/>
      <stop offset="65%" stop-color="rgba(255, 255, 255, 0.52)"/>
      <stop offset="90%" stop-color="rgba(255, 244, 210, 0.56)"/>
      <stop offset="100%" stop-color="rgba(255, 250, 235, 0.42)"/>
    </linearGradient>
    <linearGradient id="rightPillarSheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.0)"/>
      <stop offset="50%" stop-color="rgba(255, 255, 255, 0.72)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="leftWallSheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/>
      <stop offset="60%" stop-color="rgba(255, 255, 255, 0.16)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>
`;

const neckLipTopY = 6.0;
const neckStemTopY = 7.5;
const shoulderTopY = 22.0;
const shoulderBotY = 35.0;
const bBotY = 196.0;
const innerBotY = 194.2;
const outerBotY = 198.4;

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

// 1. 底层：内底台面与后壁
function buildBackSVG() {
  return `
<svg width="300" height="660" viewBox="12 2 76 210" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <!-- 后壁微光与轮廓基底 -->
  <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" />
  <!-- 瓶底内壁椭圆台面 -->
  <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6" fill="rgba(22, 32, 58, 0.22)" stroke="url(#glassBaseInnerFloorGrad)" stroke-width="1.2" />
</svg>
`;
}

// 2. 顶层外壳：沉底厚玻璃折射层、月牙焦散弧、瓶肩高光、双层外唇
function buildFrontSVG() {
  return `
<svg width="300" height="660" viewBox="12 2 76 210" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <!-- 左右两侧真实侧壁折射光带 -->
  <rect x="17.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractL)" opacity="0.82" />
  <rect x="79.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractR)" opacity="0.86" />

  <!-- 3D 沉底厚玻璃高折射层 -->
  <path d="M 19.6,${innerBotY} A 30.4,7.5 0 0,0 80.4,${innerBotY} L 82.2,${outerBotY} A 32.2,8.8 0 0,1 17.8,${outerBotY} Z" fill="url(#baseCushionGrad)" />

  <!-- 厚底内部月牙形焦散反光弧 -->
  <path d="M 20.5,${innerBotY + 1.4} A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4} A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z" fill="url(#glassBaseRimHighlight)" opacity="0.75" />

  <!-- 瓶底双层高折射亮弧 -->
  <path d="M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.3" stroke-linecap="round" />
  <path d="M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.4" stroke-linecap="round" />
  <path d="M 24.5,${outerBotY + 1.8} A 25.5,5.2 0 0,0 75.5,${outerBotY + 1.8}" fill="none" stroke="rgba(255, 255, 255, 0.78)" stroke-width="1.15" stroke-linecap="round" opacity="0.85" />

  <!-- 瓶肩高光块与双侧垂直高光柱 -->
  <path d="M 24.5,${shoulderTopY + 2.5} Q 32.5,${shoulderTopY - 0.5} 37.0,${shoulderTopY - 0.5} L 37.0,${shoulderTopY + 3.2} Q 31.5,${shoulderTopY + 3.2} 24.5,${shoulderTopY + 6.2} Z" fill="url(#naturalRimGrad)" opacity="0.88" />
  <rect x="74.5" y="${shoulderBotY + 12.0}" width="3.2" height="${innerBotY - shoulderBotY - 26.0}" rx="1.6" fill="url(#rightPillarSheen)" opacity="0.60" />
  <rect x="22.2" y="${shoulderBotY + 12.0}" width="2.4" height="${innerBotY - shoulderBotY - 26.0}" rx="1.2" fill="url(#leftWallSheen)" opacity="0.52" />

  <!-- 3D 纤细修长外轮廓线 -->
  <path d="${smoothOuterBodyPath}" fill="none" stroke="rgba(255, 255, 255, 0.90)" stroke-width="1.25" stroke-linejoin="round" />

  <!-- 玻璃瓶口双层纯白与琉璃外唇 -->
  <ellipse cx="50" cy="${neckLipTopY}" rx="14.2" ry="3.6" fill="url(#naturalRimGrad)" stroke="rgba(255, 255, 255, 0.98)" stroke-width="1.35" />
  <ellipse cx="50" cy="${neckLipTopY + 0.4}" rx="11.4" ry="2.4" fill="none" stroke="rgba(215, 240, 255, 0.80)" stroke-width="0.9" />
</svg>
`;
}

// 3. 完整合体版 (Back + Front)
function buildCompositeSVG() {
  return `
<svg width="300" height="660" viewBox="12 2 76 210" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <!-- 后壁微光与轮廓基底 -->
  <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" />
  <!-- 瓶底内壁椭圆台面 -->
  <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6" fill="rgba(22, 32, 58, 0.22)" stroke="url(#glassBaseInnerFloorGrad)" stroke-width="1.2" />

  <!-- 左右两侧真实侧壁折射光带 -->
  <rect x="17.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractL)" opacity="0.82" />
  <rect x="79.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractR)" opacity="0.86" />

  <!-- 3D 沉底厚玻璃高折射层 -->
  <path d="M 19.6,${innerBotY} A 30.4,7.5 0 0,0 80.4,${innerBotY} L 82.2,${outerBotY} A 32.2,8.8 0 0,1 17.8,${outerBotY} Z" fill="url(#baseCushionGrad)" />

  <!-- 厚底内部月牙形焦散反光弧 -->
  <path d="M 20.5,${innerBotY + 1.4} A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4} A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z" fill="url(#glassBaseRimHighlight)" opacity="0.75" />

  <!-- 瓶底双层高折射亮弧 -->
  <path d="M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.3" stroke-linecap="round" />
  <path d="M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.4" stroke-linecap="round" />
  <path d="M 24.5,${outerBotY + 1.8} A 25.5,5.2 0 0,0 75.5,${outerBotY + 1.8}" fill="none" stroke="rgba(255, 255, 255, 0.78)" stroke-width="1.15" stroke-linecap="round" opacity="0.85" />

  <!-- 瓶肩高光块与双侧垂直高光柱 -->
  <path d="M 24.5,${shoulderTopY + 2.5} Q 32.5,${shoulderTopY - 0.5} 37.0,${shoulderTopY - 0.5} L 37.0,${shoulderTopY + 3.2} Q 31.5,${shoulderTopY + 3.2} 24.5,${shoulderTopY + 6.2} Z" fill="url(#naturalRimGrad)" opacity="0.88" />
  <rect x="74.5" y="${shoulderBotY + 12.0}" width="3.2" height="${innerBotY - shoulderBotY - 26.0}" rx="1.6" fill="url(#rightPillarSheen)" opacity="0.60" />
  <rect x="22.2" y="${shoulderBotY + 12.0}" width="2.4" height="${innerBotY - shoulderBotY - 26.0}" rx="1.2" fill="url(#leftWallSheen)" opacity="0.52" />

  <!-- 3D 纤细修长外轮廓线 -->
  <path d="${smoothOuterBodyPath}" fill="none" stroke="rgba(255, 255, 255, 0.90)" stroke-width="1.25" stroke-linejoin="round" />

  <!-- 玻璃瓶口双层纯白与琉璃外唇 -->
  <ellipse cx="50" cy="${neckLipTopY}" rx="14.2" ry="3.6" fill="url(#naturalRimGrad)" stroke="rgba(255, 255, 255, 0.98)" stroke-width="1.35" />
  <ellipse cx="50" cy="${neckLipTopY + 0.4}" rx="11.4" ry="2.4" fill="none" stroke="rgba(215, 240, 255, 0.80)" stroke-width="0.9" />
</svg>
`;
}

function createMeta(baseUuid, name) {
  return JSON.stringify({
    "ver": "1.0.27",
    "importer": "image",
    "imported": true,
    "uuid": baseUuid,
    "files": [".json", ".png"],
    "subMetas": {
      "6c48a": {
        "importer": "texture",
        "uuid": `${baseUuid}@6c48a`,
        "displayName": name,
        "id": "6c48a",
        "name": "texture",
        "userData": {
          "wrapModeS": "clamp-to-edge",
          "wrapModeT": "clamp-to-edge",
          "imageUuidOrDatabaseUri": baseUuid,
          "isUuid": true,
          "visible": false,
          "minfilter": "linear",
          "magfilter": "linear",
          "mipfilter": "none",
          "anisotropy": 0
        },
        "ver": "1.0.22",
        "imported": true,
        "files": [".json"],
        "subMetas": {}
      },
      "f9941": {
        "importer": "sprite-frame",
        "uuid": `${baseUuid}@f9941`,
        "displayName": name,
        "id": "f9941",
        "name": "spriteFrame",
        "userData": {
          "trimThreshold": 1,
          "rotated": false,
          "offsetX": 0,
          "offsetY": 0,
          "trimX": 30,
          "trimY": 0,
          "width": 240,
          "height": 660,
          "rawWidth": 300,
          "rawHeight": 660,
          "borderTop": 0,
          "borderBottom": 0,
          "borderLeft": 0,
          "borderRight": 0,
          "packable": true,
          "pixelsToUnit": 100,
          "pivotX": 0.5,
          "pivotY": 0.5,
          "meshType": 0,
          "vertices": {
            "rawPosition": [-120, -330, 0, 120, -330, 0, -120, 330, 0, 120, 330, 0],
            "indexes": [0, 1, 2, 2, 1, 3],
            "uv": [30, 660, 270, 660, 30, 0, 270, 0],
            "nuv": [0.1, 0, 0.9, 0, 0.1, 1, 0.9, 1],
            "minPos": [-120, -330, 0],
            "maxPos": [120, 330, 0]
          },
          "isUuid": true,
          "imageUuidOrDatabaseUri": `${baseUuid}@6c48a`,
          "atlasUuid": "",
          "trimType": "auto"
        },
        "ver": "1.0.12",
        "imported": true,
        "files": [".json"],
        "subMetas": {}
      }
    },
    "userData": {
      "type": "sprite-frame",
      "fixAlphaTransparencyArtifacts": false,
      "hasAlpha": true,
      "redirect": `${baseUuid}@6c48a`
    }
  }, null, 2);
}

const BACK_UUID = 'e8a0110-3882-4aa1-92be-b1e600a01011';
const FRONT_UUID = 'e8a0110-3882-4aa1-92be-b1e600a01012';

async function bake() {
  console.log('[Bake Layered] 正在烘焙前后分层 3D 水晶试管贴图...');
  await sharp(Buffer.from(buildBackSVG())).png().toFile(path.join(outDir, 'tube_glass_back.png'));
  await sharp(Buffer.from(buildFrontSVG())).png().toFile(path.join(outDir, 'tube_glass_front.png'));
  await sharp(Buffer.from(buildCompositeSVG())).png().toFile(path.join(outDir, 'tube_glass.png'));

  // 写入 meta 文件
  fs.writeFileSync(path.join(outDir, 'tube_glass_back.png.meta'), createMeta(BACK_UUID, 'tube_glass_back'));
  fs.writeFileSync(path.join(outDir, 'tube_glass_front.png.meta'), createMeta(FRONT_UUID, 'tube_glass_front'));

  console.log('✓ 成功烘焙 tube_glass_back.png, tube_glass_front.png, tube_glass.png 并写入 meta！');
}

bake().catch(console.error);
