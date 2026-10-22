const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [
  { name: 'banner_4', path: './materials/banner_4.jpg', key: 'upload-banner-4-v1' },
  { name: 'icon', path: './materials/icon.jpg', key: 'upload-icon-v1' },
  { name: 'shot_1', path: './materials/shot_1.jpg', key: 'upload-shot-1-v1' },
  { name: 'shot_2', path: './materials/shot_2.jpg', key: 'upload-shot-2-v1' },
  { name: 'shot_3', path: './materials/shot_3.jpg', key: 'upload-shot-3-v1' },
];

const results = {};

files.forEach(item => {
  console.log(`Uploading ${item.name}...`);
  const cmd = `npx @taptap/cli upload "${item.path}" --app-id 991208 --dev-id 501490 --idempotency-key "${item.key}" --yes`;
  const output = execSync(cmd, { encoding: 'utf8' });
  const parsed = JSON.parse(output);
  if (parsed.ok && parsed.data) {
    results[item.name] = {
      url: parsed.data.url,
      info: parsed.data.info
    };
    console.log(`✓ ${item.name} uploaded successfully:`, parsed.data.url);
  } else {
    console.error(`✗ Failed to upload ${item.name}:`, output);
  }
});

fs.writeFileSync(path.join(__dirname, 'uploaded_assets.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('✓ All assets uploaded and saved to scripts/uploaded_assets.json');
