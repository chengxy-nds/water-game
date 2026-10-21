const fs = require('fs');

const v8 = fs.readFileSync('e:/GithubProjects/water-game/demo/v8.html', 'utf8');
const v9 = fs.readFileSync('e:/GithubProjects/water-game/demo/v9.html', 'utf8');

function getFunctionBody(code, fnName) {
  const marker = `function ${fnName}(`;
  const s = code.indexOf(marker);
  if (s === -1) return '';
  let depth = 0;
  let bodyStart = -1;
  for (let i = s; i < code.length; i++) {
    if (code[i] === '{') {
      if (depth === 0) bodyStart = i;
      depth++;
    } else if (code[i] === '}') {
      depth--;
      if (depth === 0) {
        return code.slice(s, i + 1);
      }
    }
  }
  return '';
}

['canSelectBottle', 'canPourInto', 'findBestPourMove'].forEach(fn => {
  console.log(`\n=================== ${fn} (v8 vs v9) ===================`);
  const b8 = getFunctionBody(v8, fn);
  const b9 = getFunctionBody(v9, fn);
  if (b8 === b9) {
    console.log('IDENTICAL');
  } else {
    console.log('--- V8 ---');
    console.log(b8);
    console.log('--- V9 ---');
    console.log(b9);
  }
});
