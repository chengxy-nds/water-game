const fs = require('fs');
const path = require('path');

const src = 'e:/GithubProjects/water-game/demo/v9.html';
const dst = 'e:/GithubProjects/water-game/index.html';

const content = fs.readFileSync(src, 'utf8');
fs.writeFileSync(dst, content, 'utf8');

console.log(`✓ 成功将 v9.html 同步至 index.html (${content.length} 字节)！`);
