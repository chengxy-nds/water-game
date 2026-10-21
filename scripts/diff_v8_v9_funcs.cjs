const fs = require('fs');

const v8 = fs.readFileSync('e:/GithubProjects/water-game/demo/v8.html', 'utf8');
const v9 = fs.readFileSync('e:/GithubProjects/water-game/demo/v9.html', 'utf8');

// 提取 computeProceduralStageLayout
const idxLayout = v9.indexOf('function computeProceduralStageLayout');
if (idxLayout !== -1) {
  console.log('=== computeProceduralStageLayout ===');
  console.log(v9.slice(idxLayout, idxLayout + 1800));
}

// 提取 startSettleSloshAnimation
const idxSettle = v9.indexOf('function startSettleSloshAnimation');
if (idxSettle !== -1) {
  console.log('\n=== startSettleSloshAnimation ===');
  console.log(v9.slice(idxSettle, idxSettle + 1000));
}

// 提取 updateBottleSelectionDOM
const idxSelDOM = v9.indexOf('function updateBottleSelectionDOM');
if (idxSelDOM !== -1) {
  console.log('\n=== updateBottleSelectionDOM ===');
  console.log(v9.slice(idxSelDOM, idxSelDOM + 800));
}
