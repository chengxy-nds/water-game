const fs = require('fs');

const scenePath = 'E:/GithubProjects/water-game-cocos/assets/scene.scene';
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));

console.log('Total objects in scene:', scene.length);

const canvasChildren = [];
scene.forEach((obj, idx) => {
  if (obj._parent && obj._parent.__id__ === 2) {
    canvasChildren.push({ id: idx, name: obj._name, pos: obj._lpos });
  }
});

console.log('Canvas children:', JSON.stringify(canvasChildren, null, 2));

// 查找 Background 节点
const bg = scene.find(obj => obj._name === 'Background');
if (bg) {
  console.log('Background node found at:', bg._lpos);
  // 查看其挂载的 Sprite 组件
  const spriteComp = scene.find(obj => obj.__type__ === 'cc.Sprite' && obj.node && obj.node.__id__ === scene.indexOf(bg));
  if (spriteComp) {
    console.log('Background Sprite spriteFrame:', spriteComp._spriteFrame);
  }
}
