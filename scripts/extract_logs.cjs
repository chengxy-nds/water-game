const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'public/报错日志');
const extractBase = path.join(baseDir, 'extracted');
if (fs.existsSync(extractBase)) {
  fs.rmSync(extractBase, { recursive: true, force: true });
}
fs.mkdirSync(extractBase, { recursive: true });

const zips = fs.readdirSync(baseDir).filter(f => f.endsWith('.zip'));
zips.forEach((zip, idx) => {
  const targetDir = path.join(extractBase, 'device_' + idx);
  fs.mkdirSync(targetDir, { recursive: true });
  const fullZip = path.join(baseDir, zip);
  console.log(`Unzipping: ${zip} -> device_${idx}`);
  execSync(`powershell -Command "Expand-Archive -LiteralPath '${fullZip}' -DestinationPath '${targetDir}' -Force"`, { stdio: 'inherit' });
});

console.log('✓ All log archives extracted successfully.');
