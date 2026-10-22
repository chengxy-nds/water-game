const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const modules = ['basic-info', 'media', 'release-regions', 'platform-status', 'other-settings'];

modules.forEach(mod => {
  const dataFile = path.join(__dirname, `req_${mod}.json`);
  fs.writeFileSync(dataFile, JSON.stringify({ module_id: mod }), 'utf8');
  try {
    const output = execSync(`npx @taptap/cli app get-app-module --app-id 991208 --dev-id 501490 --data @scripts/req_${mod}.json`, { encoding: 'utf8' });
    fs.writeFileSync(path.join(__dirname, `res_${mod}.json`), output, 'utf8');
    console.log(`✓ Got module: ${mod}`);
  } catch (err) {
    console.error(`✗ Error getting ${mod}:`, err.message);
  }
});
