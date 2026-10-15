const fs = require('fs');

const scenePath = 'E:/GithubProjects/water-game-cocos/assets/scene.scene';
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));

const layoutMap = {
  Header: 550,
  ShoppingBags: 415,
  ModeBanner: 445,
  GameBoard: 35,
  Footer: -490
};

let modifiedCount = 0;
scene.forEach(obj => {
  if (layoutMap[obj._name] !== undefined && obj._parent && obj._parent.__id__ === 2) {
    const targetY = layoutMap[obj._name];
    console.log(`Updating ${obj._name}: ${obj._lpos.y} -> ${targetY}`);
    obj._lpos.y = targetY;
    modifiedCount++;
  }
});

fs.writeFileSync(scenePath, JSON.stringify(scene, null, 2), 'utf8');
console.log(`✓ scene.scene updated successfully (${modifiedCount} nodes adjusted).`);
