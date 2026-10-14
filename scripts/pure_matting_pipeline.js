import fs from 'fs';
import path from 'path';
import https from 'https';
import { processMatting } from '../.agents/tools/matting-server/index.js';

const API_KEY = 'AQ.Ab8RN6J0r0gUg64mM6ul4LM_zzpKFMECpE-f-wGzycVp_HTBbg';

function rpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
    const req = https.request({
      hostname: 'stitch.googleapis.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Goog-Api-Key': API_KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function backupFile(targetPath) {
  if (fs.existsSync(targetPath)) {
    const backupPath = targetPath.replace(/\.([a-z0-9]+)$/i, '.backup.$1');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(targetPath, backupPath);
      console.log(`[Backup] ${targetPath} -> ${backupPath}`);
    }
  }
}

// 目标：专门由用户在 Stitch 中设计的单体独立素材 (Single isolated sprites)
const ASSETS_TO_PROCESS = [
  {
    id: 'de8298df15bb425bad899ecd62e8b789',
    label: 'video_bottle',
    targetGamePath: 'public/assets_figma/bottle_video_unlock.png'
  },
  {
    id: '270f5cdf5fca462ea02020ef4097f03c',
    label: 'cloth_masked_bottle',
    targetGamePath: 'public/assets_figma/cloth_cover_clean.png'
  },
  {
    id: '5f97bde2fee045b099cc66c6f7e3a898',
    label: 'frozen_ice_bottle',
    targetGamePath: 'public/assets_figma/bottle_frozen_ice.png'
  },
  {
    id: 'bca7f1a8ef134535b1beba96a89594bc',
    label: 'completed_cork_bottle',
    targetGamePath: 'public/assets_figma/bottle_completed_cork.png'
  }
];

async function main() {
  console.log('=== Pure Local AI Matting Pipeline (Zero Manual Coordinate Cropping) ===');
  ensureDir('raw_assets');
  ensureDir('processed_assets');
  ensureDir('public/assets_figma');

  for (const asset of ASSETS_TO_PROCESS) {
    console.log(`\n>>> Processing [${asset.label}] (${asset.id})`);
    
    // 1. 从 Stitch MCP 获取原图下载地址
    const screenRes = await rpc('tools/call', {
      name: 'get_screen',
      arguments: { name: `projects/6713590118866054197/screens/${asset.id}` },
    });
    const parsed = JSON.parse(screenRes.result.content[0].text);
    const dlUrl = parsed.screenshot?.downloadUrl;
    if (!dlUrl) {
      console.error(`Missing downloadUrl for ${asset.label}`);
      continue;
    }

    const rawFile = path.join('raw_assets', `stitch_raw_${asset.label}.png`);
    await download(dlUrl, rawFile);
    console.log(`[1. Downloaded Raw] ${rawFile} (${fs.statSync(rawFile).size} bytes)`);

    // 2. 整图直接送进本地 AI 抠图模型 (rembg/ONNX Matting) 去除所有背景
    const mattedFile = path.join('processed_assets', `matted_${asset.label}.png`);
    console.log(`[2. Running Local AI Matting] -> ${mattedFile}`);
    const mattingResult = await processMatting(rawFile, mattedFile);
    console.log(`[2. Matting Success] Saved ${mattedFile} (${mattingResult.sizeBytes} bytes)`);

    // 3. 备份并替换游戏内素材
    backupFile(asset.targetGamePath);
    fs.copyFileSync(mattedFile, asset.targetGamePath);
    console.log(`[3. Game Replaced] -> ${asset.targetGamePath}`);
  }

  console.log('\n=== All Stitch Single Assets Matted & Replaced Successfully! ===');
}

main().catch(console.error);
