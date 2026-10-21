const fs = require('fs');
const path = require('path');

const c9 = fs.readFileSync(path.join(__dirname, '../demo/v9.html'), 'utf-8');
const c10 = fs.readFileSync(path.join(__dirname, '../demo/v10.html'), 'utf-8');

// 去除两边的 TapTapBridge，以便只比对用户的实际改动
const clean = (s) => {
  return s
    .replace(/\/\/ =+[\s\S]*?TapTapBridge[\s\S]*?document\.addEventListener\('visibilitychange'[\s\S]*?\}\);/g, '')
    .replace(/const savedInitProgress = TapTapBridge[\s\S]*?let currentLevelId = savedInitProgress\.levelId \|\| 1;/g, 'let currentLevelId = 1;')
    .replace(/let streakWins = savedInitProgress\.streakWins \|\| 1;/g, 'let streakWins = 1;')
    .replace(/let activeThemeId = savedInitProgress\.activeTheme \|\| 'zen_amber';/g, "let activeThemeId = 'zen_amber';")
    .replace(/TapTapBridge\.saveProgress\([\s\S]*?\);/g, '')
    .replace(/TapTapBridge\.init\(\);/g, '')
    .replace(/TapTapBridge\.showRewardAd\([\s\S]*?\}\);/g, '/* reward_ad */');
};

const cl9 = clean(c9).split('\n').map(l => l.trim()).filter(Boolean);
const cl10 = clean(c10).split('\n').map(l => l.trim()).filter(Boolean);

console.log(`Clean lines: v9=${cl9.length}, v10=${cl10.length}`);

// 找 v10 独有的行
const s9Set = new Set(cl9);
const s10Set = new Set(cl10);

const onlyIn10 = [];
cl10.forEach((line, idx) => {
  if (!s9Set.has(line)) {
    onlyIn10.push({ idx: idx + 1, line: line.slice(0, 120) });
  }
});

console.log(`Total lines unique to v10: ${onlyIn10.length}`);
console.log('Sample lines unique to v10 (first 40):', JSON.stringify(onlyIn10.slice(0, 40), null, 2));
