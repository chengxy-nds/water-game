const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

const s9 = c9.slice(c9.indexOf('<script>') + 8, c9.indexOf('const MECHANIC_INTROS'));
const s10 = c10.slice(c10.indexOf('<script>') + 8, c10.indexOf('const MECHANIC_INTROS'));

console.log('Includes TapTapBridge in v9:', s9.includes('TapTapBridge'));
console.log('Includes TapTapBridge in v10:', s10.includes('TapTapBridge'));

if (s9.includes('TapTapBridge')) {
  // 把 v9 中的 TapTapBridge 去掉后再比对
  const s9Clean = s9.replace(/(\/\/ =+[\s\S]*?TapTapBridge[\s\S]*?document\.addEventListener\('visibilitychange'[\s\S]*?\}\);)/, '');
  console.log('Diff without TapTapBridge:', s9Clean === s10, 'Lengths:', s9Clean.length, s10.length);
}
