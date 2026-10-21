const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../demo/v9.html')
];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');

  // 1. 广告瓶子 (ad_cam / ad_cam_blue) 点击接入 TapTap 激励视频
  const oldAdCamCode = `      if (clicked.special === 'ad_cam' || clicked.special === 'ad_cam_blue') {
        moveHistory.push(cloneState());
        clicked.special = 'none';
        playSound('pack');
        showToast('🎬 激励视频奖励：已为您开启 +1 备用琉璃空瓶！');
        renderAll();
        return;
      }`;

  const newAdCamCode = `      if (clicked.special === 'ad_cam' || clicked.special === 'ad_cam_blue') {
        TapTapBridge.showRewardAd({
          onReward: () => {
            moveHistory.push(cloneState());
            clicked.special = 'none';
            playSound('pack');
            showToast('🎬 激励视频奖励：已为您开启 +1 备用琉璃空瓶！');
            renderAll();
          },
          onCancel: () => {
            showToast('⚠️ 需观看完整视频才能开启备用瓶哦');
          }
        });
        return;
      }`;

  if (content.includes(oldAdCamCode)) {
    content = content.replace(oldAdCamCode, newAdCamCode);
    console.log('✓ Wired ad_cam to TapTapBridge.showRewardAd in:', path.basename(file));
  }

  // 2. 广告购物袋 (bag.locked) 点击接入 TapTap 激励视频
  const oldBagLockCode = `      if (bag.locked) {
        const nextCol = pickNextNeededBagColor(bagIdx);
        if (!nextCol) {
          showToast('🛍️ 当前场上剩余药水均已有对应购物袋，无需额外开启！');
          return;
        }
        activeHintPair = null;
        moveHistory.push(cloneState());
        bag.locked = false;
        bag.removed = false;
        bag.color = nextCol;
        playSound('pack');
        showToast('🎬 已为您额外开启 +1 个高定礼盒槽位！');
        renderAll();
        setTimeout(() => checkAndPackWaitingCorkedBottles(), 180);
      }`;

  const newBagLockCode = `      if (bag.locked) {
        const nextCol = pickNextNeededBagColor(bagIdx);
        if (!nextCol) {
          showToast('🛍️ 当前场上剩余药水均已有对应购物袋，无需额外开启！');
          return;
        }
        TapTapBridge.showRewardAd({
          onReward: () => {
            activeHintPair = null;
            moveHistory.push(cloneState());
            bag.locked = false;
            bag.removed = false;
            bag.color = nextCol;
            playSound('pack');
            showToast('🎬 激励视频奖励：已为您额外开启 +1 个高定礼盒槽位！');
            renderAll();
            setTimeout(() => checkAndPackWaitingCorkedBottles(), 180);
          },
          onCancel: () => {
            showToast('⚠️ 需观看完整视频才能解锁额外购物袋哦');
          }
        });
      }`;

  if (content.includes(oldBagLockCode)) {
    content = content.replace(oldBagLockCode, newBagLockCode);
    console.log('✓ Wired bag.locked to TapTapBridge.showRewardAd in:', path.basename(file));
  }

  // 3. 星晷步数耗尽续步 (oom-add-moves-btn)
  const oldOomBtnCode = `    document.getElementById('oom-add-moves-btn')?.addEventListener('click', () => {
      oomModalMask?.classList.remove('show');
      if (remainingMoves !== null) remainingMoves += 5;
      playSound('pack');
      renderAll();
      showToast('🎬 激励视频奖励：已为您免费续 +5 步星晷步数！');
    });`;

  const newOomBtnCode = `    document.getElementById('oom-add-moves-btn')?.addEventListener('click', () => {
      TapTapBridge.showRewardAd({
        onReward: () => {
          oomModalMask?.classList.remove('show');
          if (remainingMoves !== null) remainingMoves += 5;
          playSound('pack');
          renderAll();
          showToast('🎬 激励视频奖励：已为您免费续 +5 步星晷步数！');
        },
        onCancel: () => {
          showToast('⚠️ 需观看完整视频才能获得补充步数哦');
        }
      });
    });`;

  if (content.includes(oldOomBtnCode)) {
    content = content.replace(oldOomBtnCode, newOomBtnCode);
    console.log('✓ Wired oom-add-moves-btn to TapTapBridge.showRewardAd in:', path.basename(file));
  }

  // 4. 底部道具 +空瓶 次数补充
  const oldAddBottleCode = `      if (addBottleUses <= 0) {
        addBottleUses = 2;
        playSound('pack');
        showToast('🎬 已为您免费补充 +2 次加瓶道具！');
        renderAll();
        return;
      }`;

  const newAddBottleCode = `      if (addBottleUses <= 0) {
        TapTapBridge.showRewardAd({
          onReward: () => {
            addBottleUses = 2;
            playSound('pack');
            showToast('🎬 激励视频奖励：已为您补充 +2 次加瓶道具！');
            renderAll();
          },
          onCancel: () => {
            showToast('⚠️ 需观看完整视频才能补充道具哦');
          }
        });
        return;
      }`;

  if (content.includes(oldAddBottleCode)) {
    content = content.replace(oldAddBottleCode, newAddBottleCode);
    console.log('✓ Wired addBottleUses reload to TapTapBridge.showRewardAd in:', path.basename(file));
  }

  // 5. 商店视频解锁主题
  const oldShopUnlockCode = `          } else {
            item.unlocked = true;
            applyTheme(item.id);
            playSound('pack');
            showToast(\`🎬 已为您免费解锁并装备主题：【\${item.name}】！\`);
          }`;

  const newShopUnlockCode = `          } else {
            TapTapBridge.showRewardAd({
              onReward: () => {
                item.unlocked = true;
                applyTheme(item.id);
                playSound('pack');
                showToast(\`🎬 激励视频奖励：已为您解锁并装备主题：【\${item.name}】！\`);
                const unlockedThemes = SHOP_THEMES.filter(t => t.unlocked).map(t => t.id);
                TapTapBridge.saveProgress(currentLevelId, { streakWins, activeTheme: item.id, unlockedThemes });
              },
              onCancel: () => {
                showToast('⚠️ 需观看完整视频才能免费解锁该主题哦');
              }
            });
          }`;

  if (content.includes(oldShopUnlockCode)) {
    content = content.replace(oldShopUnlockCode, newShopUnlockCode);
    console.log('✓ Wired shop theme unlock to TapTapBridge.showRewardAd in:', path.basename(file));
  }

  fs.writeFileSync(file, content, 'utf-8');
});
