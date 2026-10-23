/**
 * TapTap 专有开发版本上传与自测流水线（仅上传开发版本，绝不提审）
 * 严格遵照官方 CLI 文档设计：
 * 1. 构建工业级纯 Canvas 引擎
 * 2. 上传小游戏包并解析
 * 3. 创建开发版本记录 (dev stage)
 * 4. 绑定主包体槽位供自测
 * 5. 刷新真机自测二维码至 taptap_test_qr.png
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const devId = '501490';
const appId = '991208';
const zipPath = path.join(rootDir, 'water_game_miniapp.zip');

function run(cmd) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8' });
}

console.log('=== [Step 1] 构建最新纯 Canvas 引擎并打包 ===');
run(`node scripts/build_pure_canvas_v11.cjs`);

console.log('=== [Step 2] 查询已上传包体列表计算最新版本号 ===');
const listRaw = run(`taptap-cli package-management list-mini-app-packages --dev-id ${devId} --app-id ${appId}`);
const listJson = JSON.parse(listRaw);
const packages = (listJson.data && listJson.data.result && listJson.data.result.list) || [];

let maxVer = [1, 0, 6];
if (packages.length > 0) {
  packages.forEach(p => {
    const parts = (p.user_package_version || '1.0.0').split('.').map(Number);
    if (parts.length === 3) {
      if (parts[0] > maxVer[0] || 
         (parts[0] === maxVer[0] && parts[1] > maxVer[1]) ||
         (parts[0] === maxVer[0] && parts[1] === maxVer[1] && parts[2] > maxVer[2])) {
        maxVer = parts;
      }
    }
  });
}
const nextVer = `${maxVer[0]}.${maxVer[1]}.${maxVer[2] + 1}`;
const currentBoundPackageId = packages[0] ? String(packages[0].package_id) : '351949';
console.log(`当前最新包版本: ${packages[0]?.user_package_version || '1.0.6'} (ID: ${currentBoundPackageId})`);
console.log(`本次准备创建的下一个开发版本号: ${nextVer}`);

console.log('\n=== [Step 3] 上传小游戏包体 ===');
const uploadRaw = run(`taptap-cli upload-mini-app-package water_game_miniapp.zip --dev-id ${devId} --app-id ${appId} --yes`);
const uploadJson = JSON.parse(uploadRaw);
const artifactId = uploadJson.data.miniAppArtifactId;
const taskId = uploadJson.data.taskId;
console.log(`✓ 上传成功，解析状态: ${uploadJson.data.parseStatus}, artifactId: ${artifactId}`);

console.log('\n=== [Step 4] 注册开发版本 ===');
const submitDataPath = path.join(__dirname, `submit_canvas_data_${nextVer}.json`);
fs.writeFileSync(submitDataPath, JSON.stringify({
  artifact_id: artifactId,
  enable_split: false,
  package_version: nextVer,
  task_id: taskId
}, null, 2), 'utf8');

const submitRaw = run(`taptap-cli package-management submit-mini-app-package --dev-id ${devId} --app-id ${appId} --data @scripts/submit_canvas_data_${nextVer}.json --yes`);
const submitJson = JSON.parse(submitRaw);
const newPackageId = submitJson.data.result.package_id;
console.log(`✓ 成功创建开发版本: ${nextVer} (package_id: ${newPackageId})`);

console.log('\n=== [Step 5] 绑定主包体槽位 (用于扫码自测) ===');
const bindDataPath = path.join(__dirname, `bind_canvas_package_${nextVer}.json`);
fs.writeFileSync(bindDataPath, JSON.stringify({
  slot: 'main',
  package: {
    id: String(newPackageId),
    type: 'mini_app'
  },
  expected: {
    kind: 'mini_app',
    mini_app_package_id: currentBoundPackageId
  },
  force: false
}, null, 2), 'utf8');

run(`taptap-cli app select-package --dev-id ${devId} --app-id ${appId} --data @scripts/bind_canvas_package_${nextVer}.json --yes`);
console.log(`✓ 成功将 package_id ${newPackageId} 绑定至主槽位`);

console.log('\n=== [Step 6] 获取真机自测二维码 ===');
const qrDataPath = path.join(__dirname, `test_qr_${nextVer}.json`);
fs.writeFileSync(qrDataPath, JSON.stringify({ package_id: newPackageId }, null, 2), 'utf8');

const qrRaw = run(`taptap-cli package-management get-test-qr-code --dev-id ${devId} --app-id ${appId} --data @scripts/test_qr_${nextVer}.json`);
const qrJson = JSON.parse(qrRaw);
const qrUrl = qrJson.data.result.qr_code_url;
console.log(`自测二维码直链: ${qrUrl}`);

const qrOutFile = path.join(rootDir, 'taptap_test_qr.png');
run(`powershell -Command "Invoke-WebRequest -Uri '${qrUrl}' -OutFile '${qrOutFile}'"`);
console.log(`✓ 最新测试二维码已保存至: ${qrOutFile}`);

console.log('\n======================================================');
console.log(`🎉 开发版本 ${nextVer} (ID: ${newPackageId}) 部署完毕！`);
console.log('📌 注意：根据指示已严格【杜绝提审】，当前保持在 draft 草稿状态，请用 TapTap 客户端扫码自测。');
console.log('======================================================');
