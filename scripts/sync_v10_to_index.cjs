const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. 将 demo/v10.html 复制到 index.html
const v10Path = path.join(__dirname, '../demo/v10.html');
const indexPath = path.join(__dirname, '../index.html');

fs.copyFileSync(v10Path, indexPath);
console.log('✓ Successfully copied demo/v10.html to index.html');

// 2. 注入 TapTapBridge (包含凭证、防沉迷、双写持久化、熔断保护)
execSync('node scripts/integrate_taptap.cjs', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 3. 串联 5 大核心广告场景到 TapTap 激励视频
execSync('node scripts/wire_reward_ads.cjs', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 4. 执行生产构建
execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 5. 重新生成符合 TapTap 官方单目录规范的 H5 zip 发布包
execSync('node scripts/pack_taptap_zip.cjs', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

console.log('✓ All V10 integration & packaging steps completed successfully!');
