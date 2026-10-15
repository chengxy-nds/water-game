import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bottle, Bag, MoveHistoryItem, ColorKey } from './types/game';
import { getLevelConfig, MECHANIC_INTROS } from './data/levelGenerator';
import { COLORS } from './constants/colors';
import { audioEngine } from './audio/audioEngine';
import {
  canSelectBottle,
  canSelectBottleNoToast,
  canPourInto,
  getPourableCount,
  pickNextNeededBagColor,
  checkGameWon,
  isCompleteBottle,
} from './game/waterSortLogic';
import { buildLiquidLayersMarkup } from './physics/liquidMarkup';
import {
  performLiquidPourAnimation,
  triggerBottleVFX,
} from './animation/pourAnimationEngine';
import { TopBar } from './components/UI/TopBar';
import { ModeBanner } from './components/UI/ModeBanner';
import { ControlBar } from './components/UI/ControlBar';
import { BagsBar } from './components/Bags/BagsBar';
import { BottleView } from './components/Bottle/BottleView';
import { LevelSelectModal } from './components/Modals/LevelSelectModal';
import { WinModal } from './components/Modals/WinModal';
import { MechanicIntroModal } from './components/Modals/MechanicIntroModal';

export const App: React.FC = () => {
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [packedTotal, setPackedTotal] = useState<number>(0);
  const [pourCountTotal, setPourCountTotal] = useState<number>(0);
  const [remainingMoves, setRemainingMoves] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [shuffleUses, setShuffleUses] = useState<number>(1);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 弹窗状态
  const [levelModalOpen, setLevelModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [winModalOpen, setWinModalOpen] = useState<boolean>(false);
  const [wasGiantCatWin, setWasGiantCatWin] = useState<boolean>(false);
  const [currentMechanicKey, setCurrentMechanicKey] = useState<string | null>(null);

  const shownMechanicIntrosRef = useRef<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const bagsStageRef = useRef<HTMLDivElement>(null);
  const fxOverlayRef = useRef<SVGSVGElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sloshRafRef = useRef<number | null>(null);
  const sloshStartRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2300);
  }, []);

  const stopSelectSloshAnimation = useCallback(() => {
    if (sloshRafRef.current) {
      cancelAnimationFrame(sloshRafRef.current);
      sloshRafRef.current = null;
    }
  }, []);

  const startSelectSloshAnimation = useCallback(
    (bottleIdx: number) => {
      stopSelectSloshAnimation();
      sloshStartRef.current = performance.now();

      const tickSlosh = (now: number) => {
        if (isAnimating) {
          sloshRafRef.current = null;
          return;
        }
        const b = bottles[bottleIdx];
        const liqGroup = document.getElementById(`liquid-group-${bottleIdx}`);
        if (!b || b.removed || !liqGroup || b.layers.length === 0) return;

        const dt = (now - sloshStartRef.current) / 1000;
        if (dt > 1.35) {
          sloshRafRef.current = null;
          return;
        }
        const amp = Math.exp(-2.8 * dt) * 1.02;
        const phase = dt * 13.5;

        liqGroup.innerHTML = buildLiquidLayersMarkup(b.layers, bottleIdx, {
          topLayerScale: 1,
          tiltAngle: 0,
          mysteryCount: b.mysteryCount || 0,
          maxCap: b.maxCap || 4,
          isGiantCat: !!b.isGiantCat,
          sloshPhase: phase,
          sloshAmplitude: amp,
          currentLevelId,
        });

        sloshRafRef.current = requestAnimationFrame(tickSlosh);
      };

      sloshRafRef.current = requestAnimationFrame(tickSlosh);
    },
    [bottles, isAnimating, currentLevelId, stopSelectSloshAnimation]
  );

  const initGame = useCallback(
    (levelId: number) => {
      stopSelectSloshAnimation();
      const cfg = getLevelConfig(levelId);
      setBottles(cfg.bottles());
      setBags(cfg.hasBags ? JSON.parse(JSON.stringify(cfg.bags)) : []);
      setRemainingMoves(cfg.moveLimit);
      setPackedTotal(0);
      setPourCountTotal(0);
      setSelectedIndex(null);
      setIsAnimating(false);
      setMoveHistory([]);
      setShuffleUses(1);
      setWinModalOpen(false);
      setWasGiantCatWin(false);

      if (cfg.introMechanicKey && !shownMechanicIntrosRef.current.has(cfg.introMechanicKey)) {
        shownMechanicIntrosRef.current.add(cfg.introMechanicKey);
        setCurrentMechanicKey(cfg.introMechanicKey);
        audioEngine.playSound('pack');
      } else {
        setCurrentMechanicKey(null);
      }
    },
    [stopSelectSloshAnimation]
  );

  useEffect(() => {
    initGame(currentLevelId);
  }, [currentLevelId, initGame]);

  const cloneState = useCallback((): MoveHistoryItem => {
    return {
      bottles: JSON.parse(JSON.stringify(bottles)),
      bags: JSON.parse(JSON.stringify(bags)),
      packedTotal,
      pourCountTotal,
      remainingMoves,
      shuffleUses,
    };
  }, [bottles, bags, packedTotal, pourCountTotal, remainingMoves, shuffleUses]);

  // 倾倒动画
  const performLiquidPour = useCallback(
    (srcIdx: number, dstIdx: number) => {
      const srcBottle = bottles[srcIdx];
      const dstBottle = bottles[dstIdx];
      if (!srcBottle || !dstBottle) return;

      const moveCount = getPourableCount(srcBottle, dstBottle);
      if (moveCount === 0) return;

      const gridEl = gridRef.current;
      const bagsStageEl = bagsStageRef.current;
      const fxOverlayEl = fxOverlayRef.current;
      if (!gridEl || !fxOverlayEl) return;

      setMoveHistory((prev) => [...prev, cloneState()]);
      setIsAnimating(true);
      stopSelectSloshAnimation();
      setSelectedIndex(null);

      const pourColor = srcBottle.layers[srcBottle.layers.length - 1];
      const cfg = getLevelConfig(currentLevelId);

      performLiquidPourAnimation({
        srcIdx,
        dstIdx,
        bottles,
        bags,
        moveCount,
        pourColor,
        gridEl,
        bagsStageEl,
        fxOverlayEl,
        currentLevelId,
        hasBags: !!cfg.hasBags,
        onFinish: ({
          isDstCompleted,
          wasGiantCat,
          targetBagIdx,
          revealedMysteryLayerIdx,
          revealedMysteryColor,
          brokenSpecials,
        }) => {
          setPourCountTotal((prev) => prev + 1);

          setBottles((prev) => {
            const nextBottles = JSON.parse(JSON.stringify(prev)) as Bottle[];
            const s = nextBottles[srcIdx];
            const d = nextBottles[dstIdx];

            for (let k = 0; k < moveCount; k++) {
              s.layers.pop();
              d.layers.push(pourColor);
            }

            // 盲盒揭晓
            if (revealedMysteryLayerIdx !== undefined && revealedMysteryLayerIdx >= 0) {
              s.mysteryCount = Math.max(0, s.layers.length - 1);
              if (revealedMysteryColor && COLORS[revealedMysteryColor]) {
                audioEngine.playSound('mystery_reveal');
                triggerBottleVFX(srcIdx, 'mystery_reveal', {
                  layerIdx: revealedMysteryLayerIdx,
                  colorKey: revealedMysteryColor,
                });
                showToast(`✨ 星雾散尽：显露【${COLORS[revealedMysteryColor].name}】！`);
              }
            }

            // 底座震裂
            if (brokenSpecials && brokenSpecials.length > 0) {
              brokenSpecials.forEach((item) => {
                const b = nextBottles[item.bIdx];
                if (b) {
                  b.special = 'none';
                  audioEngine.playSound(item.wasIce ? 'ice_break' : 'stone_break');
                  triggerBottleVFX(item.bIdx, item.wasIce ? 'ice_shatter' : 'stone_shatter');
                  showToast(item.wasIce ? '❄️ 共振破冰：极地霜晶座已碎裂！' : '🪨 共振碎石：曜石底座已崩解！');
                }
              });
            }

            if (isDstCompleted) {
              if (cfg.hasBags) {
                d.layers = [];
                d.corked = false;
                d.removed = true;
              } else {
                d.corked = true;
                d.corkAnimProgress = 1.0;
              }

              setPackedTotal((prevPt) => {
                const newPt = prevPt + 1;
                // 解锁星缎礼袍、极地全冰雕、羊皮礼袋
                nextBottles.forEach((b, bIdx) => {
                  if (
                    !b.removed &&
                    ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) &&
                    newPt >= (b.unlockOrder || 1)
                  ) {
                    const prevSpec = b.special;
                    b.special = 'none';
                    if (prevSpec === 'full_ice') {
                      audioEngine.playSound('ice_break');
                      triggerBottleVFX(bIdx, 'ice_shatter', { fullBody: true });
                      showToast('🧊 礼盒契约达成：极地全冰雕瓶已破冰！');
                    } else {
                      audioEngine.playSound('mystery_reveal');
                      triggerBottleVFX(bIdx, 'cover_unveil', { coverType: prevSpec });
                      showToast(
                        prevSpec === 'silk_drape'
                          ? '🧣 礼盒契约达成：星缎礼袍已揭幕！'
                          : '🛍️ 礼盒契约达成：羊皮礼袋已解封！'
                      );
                    }
                  }
                });

                return newPt;
              });

              if (cfg.hasBags) {
                setBags((prevBags) => {
                  const nextBags = JSON.parse(JSON.stringify(prevBags)) as Bag[];
                  if (nextBags[targetBagIdx]) {
                    nextBags[targetBagIdx].packedBottle = pourColor;
                    nextBags[targetBagIdx].justPacked = true;
                  }
                  return nextBags;
                });

                setTimeout(() => {
                  setBags((currBags) => {
                    const nextBags = JSON.parse(JSON.stringify(currBags)) as Bag[];
                    if (nextBags[targetBagIdx]) {
                      nextBags[targetBagIdx].justPacked = false;
                    }
                    const activeColors = nextBags.filter((b) => !b.locked && b.color).map((b) => b.color);
                    const remainingBoardColors: ColorKey[] = [];
                    nextBottles.forEach((b) => {
                      if (!b.removed) {
                        b.layers.forEach((c) => {
                          if (!remainingBoardColors.includes(c)) remainingBoardColors.push(c);
                        });
                      }
                    });
                    const unservedColor = remainingBoardColors.find((c) => !activeColors.includes(c));
                    const stillHasSameColorOnBoard = remainingBoardColors.includes(pourColor);

                    if (!stillHasSameColorOnBoard && unservedColor && nextBags[targetBagIdx]) {
                      nextBags[targetBagIdx].packedBottle = null;
                      nextBags[targetBagIdx].color = unservedColor;
                    }
                    return nextBags;
                  });

                  if (wasGiantCat || checkGameWon(nextBottles, wasGiantCat)) {
                    setWasGiantCatWin(wasGiantCat);
                    setWinModalOpen(true);
                  }
                }, 680);
              } else {
                // 无购物袋直通凝萃模式
                if (wasGiantCat || checkGameWon(nextBottles, wasGiantCat)) {
                  setWasGiantCatWin(wasGiantCat);
                  setTimeout(() => setWinModalOpen(true), 240);
                }
              }
            }

            return nextBottles;
          });

          if (remainingMoves !== null) {
            setRemainingMoves((m) => {
              const nextM = m !== null ? m - 1 : null;
              if (nextM !== null && nextM <= 0) {
                showToast('⚠️ 限定步数已用尽！可点击右下角撤回或重新挑战');
              }
              return nextM;
            });
          }

          setIsAnimating(false);
        },
      });
    },
    [
      bottles,
      bags,
      remainingMoves,
      currentLevelId,
      cloneState,
      stopSelectSloshAnimation,
      showToast,
    ]
  );

  // 瓶子点击交互
  const handleBottleClick = useCallback(
    (idx: number) => {
      if (isAnimating) return;
      const clicked = bottles[idx];
      if (!clicked || clicked.removed) return;

      if (clicked.special === 'ad_cam' || clicked.special === 'ad_cam_blue') {
        setMoveHistory((prev) => [...prev, cloneState()]);
        setBottles((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], special: 'none' };
          return next;
        });
        audioEngine.playSound('pack');
        showToast('🎬 激励视频奖励：已免费开启 +1 备用琉璃空瓶！');
        return;
      }

      if (remainingMoves !== null && remainingMoves <= 0) {
        showToast('⚠️ 剩余步数已用尽！请点击右下角撤回一步或重开本关');
        return;
      }

      if (selectedIndex === null) {
        if (canSelectBottle(clicked, showToast)) {
          setSelectedIndex(idx);
          audioEngine.playSound('select');
          startSelectSloshAnimation(idx);
        }
        return;
      }

      if (selectedIndex === idx) {
        stopSelectSloshAnimation();
        setSelectedIndex(null);
        audioEngine.playSound('select');
        return;
      }

      const src = bottles[selectedIndex];
      if (canPourInto(src, clicked)) {
        stopSelectSloshAnimation();
        performLiquidPour(selectedIndex, idx);
      } else if (canSelectBottle(clicked, showToast)) {
        setSelectedIndex(idx);
        audioEngine.playSound('select');
        startSelectSloshAnimation(idx);
      } else {
        stopSelectSloshAnimation();
        setSelectedIndex(null);
      }
    },
    [
      bottles,
      selectedIndex,
      isAnimating,
      remainingMoves,
      cloneState,
      performLiquidPour,
      startSelectSloshAnimation,
      stopSelectSloshAnimation,
      showToast,
    ]
  );

  // 礼盒袋点击
  const handleBagClick = useCallback(
    (bagIdx: number) => {
      if (isAnimating) return;
      const bag = bags[bagIdx];
      if (!bag) return;

      if (bag.locked) {
        setMoveHistory((prev) => [...prev, cloneState()]);
        setBags((prev) => {
          const next = [...prev];
          next[bagIdx] = {
            ...next[bagIdx],
            locked: false,
            color: pickNextNeededBagColor(bottles, next),
          };
          return next;
        });
        audioEngine.playSound('pack');
        showToast('🛍️ 已为您解锁第 4 个礼盒手提袋槽位！');
      } else if (bag.color && COLORS[bag.color]) {
        showToast(`🛍️ 集满同色【${COLORS[bag.color].name}】药水即可自动装入此礼盒袋！`);
      }
    },
    [bags, bottles, isAnimating, cloneState, showToast]
  );

  // 底部 4 大按钮逻辑（100% 对齐 demo/index.html）
  // 1. 提示
  const handleShuffle = useCallback(() => {
    if (isAnimating) return;
    const wasFree = shuffleUses > 0;
    if (shuffleUses > 0) setShuffleUses((u) => u - 1);

    for (let i = 0; i < bottles.length; i++) {
      const src = bottles[i];
      if (!canSelectBottleNoToast(src)) continue;
      for (let j = 0; j < bottles.length; j++) {
        if (i === j) continue;
        const dst = bottles[j];
        if (canPourInto(src, dst) && dst.layers.length > 0) {
          setSelectedIndex(i);
          startSelectSloshAnimation(i);
          showToast(wasFree ? '💡 工坊推演：已为您寻得最佳凝萃步！' : '🎬 激励视频推演：已为您自动执行一步！');
          setTimeout(() => performLiquidPour(i, j), 120);
          return;
        }
      }
    }

    for (let i = 0; i < bottles.length; i++) {
      const src = bottles[i];
      if (!canSelectBottleNoToast(src) || new Set(src.layers).size <= 1) continue;
      for (let j = 0; j < bottles.length; j++) {
        if (i === j) continue;
        const dst = bottles[j];
        if (canPourInto(src, dst) && dst.layers.length === 0) {
          setSelectedIndex(i);
          startSelectSloshAnimation(i);
          showToast('💡 工坊推演：先将顶层秘药腾挪至空瓶！');
          setTimeout(() => performLiquidPour(i, j), 120);
          return;
        }
      }
    }

    const camBottle = bottles.find((b) => !b.removed && (b.special === 'ad_cam' || b.special === 'ad_cam_blue'));
    if (camBottle) {
      setMoveHistory((prev) => [...prev, cloneState()]);
      setBottles((prev) =>
        prev.map((b) => (b.id === camBottle.id ? { ...b, special: 'none' } : b))
      );
      audioEngine.playSound('pack');
      showToast('🎬 激励视频辅助：已为您开启一只备用琉璃瓶！');
      return;
    }

    showToast('💡 建议点击【+空瓶】开启新器皿或【撤回】调整顺序！');
  }, [bottles, isAnimating, shuffleUses, cloneState, performLiquidPour, startSelectSloshAnimation, showToast]);

  // 2. +空瓶
  const handleAddBottle = useCallback(() => {
    if (isAnimating) return;
    setMoveHistory((prev) => [...prev, cloneState()]);

    if (remainingMoves !== null && remainingMoves <= 3) {
      setRemainingMoves((m) => (m !== null ? m + 5 : null));
      audioEngine.playSound('pack');
      showToast('🎬 激励视频奖励：已为您延长 +5 步星晷步数！');
      return;
    }

    const camBottle = bottles.find((b) => !b.removed && (b.special === 'ad_cam' || b.special === 'ad_cam_blue'));
    if (camBottle) {
      setBottles((prev) =>
        prev.map((b) => (b.id === camBottle.id ? { ...b, special: 'none' } : b))
      );
      audioEngine.playSound('pack');
      showToast('🎬 激励视频奖励：已免费开启 +1 备用琉璃空瓶！');
      return;
    }

    const lockedIdx = bottles.findIndex(
      (b) => !b.removed && !b.corked && (b.special !== 'none' || (b.mysteryCount && b.mysteryCount > 0))
    );
    if (lockedIdx !== -1) {
      const lockedBottle = bottles[lockedIdx];
      if (lockedBottle.special !== 'none') {
        const oldSpec = lockedBottle.special;
        setBottles((prev) =>
          prev.map((b, idx) => (idx === lockedIdx ? { ...b, special: 'none', poursToBreak: 0 } : b))
        );
        if (oldSpec === 'ice_base' || oldSpec === 'full_ice') {
          audioEngine.playSound('ice_break');
          triggerBottleVFX(lockedIdx, 'ice_shatter', { fullBody: oldSpec === 'full_ice' });
        } else if (oldSpec === 'stone_base') {
          audioEngine.playSound('stone_break');
          triggerBottleVFX(lockedIdx, 'stone_shatter');
        } else {
          audioEngine.playSound('mystery_reveal');
          triggerBottleVFX(lockedIdx, 'cover_unveil', { coverType: oldSpec });
        }
        showToast('🎬 激励视频奖励：已为您直接解除一处器皿封印！');
      } else {
        const revIdx = (lockedBottle.mysteryCount || 1) - 1;
        const revCol = lockedBottle.layers[revIdx] || 'green';
        setBottles((prev) =>
          prev.map((b, idx) => (idx === lockedIdx ? { ...b, mysteryCount: 0 } : b))
        );
        audioEngine.playSound('mystery_reveal');
        triggerBottleVFX(lockedIdx, 'mystery_reveal', { layerIdx: revIdx, colorKey: revCol });
        showToast('🎬 激励视频奖励：已为您驱散一整瓶星雾盲盒！');
      }
      return;
    }

    setBottles((prev) => [
      ...prev,
      { id: prev.length, maxCap: 4, layers: [], special: 'none' },
    ]);
    audioEngine.playSound('pack');
    showToast('🎬 激励视频奖励：已为您额外陈列 +1 备用琉璃瓶！');
  }, [bottles, isAnimating, remainingMoves, cloneState, showToast]);

  // 3. 撤回
  const handleUndo = useCallback(() => {
    if (isAnimating) return;
    if (moveHistory.length === 0) {
      showToast('当前已是初始状态');
      return;
    }
    stopSelectSloshAnimation();
    setMoveHistory((prev) => {
      const nextHistory = [...prev];
      const last = nextHistory.pop();
      if (last) {
        setBottles(last.bottles);
        setBags(last.bags);
        setPackedTotal(last.packedTotal);
        setPourCountTotal(last.pourCountTotal || 0);
        setRemainingMoves(last.remainingMoves);
        setShuffleUses(last.shuffleUses);
        setSelectedIndex(null);
        audioEngine.playSound('select');
        showToast('↩️ 已为您回溯至上一步');
      }
      return nextHistory;
    });
  }, [isAnimating, moveHistory, stopSelectSloshAnimation, showToast]);

  // 一键解除全部封印
  const handleUnlockAll = useCallback(() => {
    setMoveHistory((prev) => [...prev, cloneState()]);
    setBottles((prev) =>
      prev.map((b) => {
        if (b.removed) return b;
        return {
          ...b,
          special: 'none',
          mysteryCount: 0,
        };
      })
    );
    setBags((prev) =>
      prev.map((bg) => {
        if (bg.locked) {
          return {
            ...bg,
            locked: false,
            color: pickNextNeededBagColor(bottles, prev),
          };
        }
        return bg;
      })
    );
    if (remainingMoves !== null) setRemainingMoves((m) => (m !== null ? m + 10 : null));
    audioEngine.playSound('pack');
    showToast('⚡ 星光工坊秘宝：已解除当前关全部封印与空瓶！');
  }, [bottles, remainingMoves, cloneState, showToast]);

  const cfg = getLevelConfig(currentLevelId);

  // 磨砂玻璃横幅文案
  let bannerText = '✨ 琉璃工坊：凝萃同色秘药，满瓶即落原木塞封存';
  let bannerProgress = `封存 ${bottles.filter((b) => b.corked).length}/${Math.max(1, bottles.filter((b) => b.layers.length > 0).length)}`;
  if (cfg.isCatBossLevel) {
    const catBottle = bottles.find((b) => b.isGiantCat);
    const curCatLayers = catBottle ? catBottle.layers.length : 0;
    const catColName = COLORS[(catBottle && catBottle.catTargetColor) || 'pink'].name;
    bannerText = `🐱 皇家典藏：请将 8 层【${catColName}】汇入中央灵猫水晶瓶`;
    bannerProgress = `凝萃 ${curCatLayers}/8`;
  }

  const activeIntro = currentMechanicKey ? MECHANIC_INTROS[currentMechanicKey] : null;

  return (
    <>
      <div className="ambient-glow" />

      <div className="app-shell">
        {/* 1. 顶部果冻玻璃导航栏 */}
        <TopBar
          levelNum={currentLevelId}
          remainingMoves={remainingMoves}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenLevelSelect={() => setLevelModalOpen(true)}
          onQuickUnlock={handleUnlockAll}
        />

        {/* 2A. 礼盒打包模式专属：顶部 4 个高精 3D 礼盒购物袋 */}
        {cfg.hasBags && (
          <div ref={bagsStageRef} className="bags-stage" id="bags-stage">
            <BagsBar bags={bags} onBagClick={handleBagClick} />
          </div>
        )}

        {/* 2B. 无购物袋模式专属：磨砂玻璃目标进度条 */}
        {!cfg.hasBags && (
          <div className="mode-banner show" id="mode-banner">
            <span id="mode-banner-text">{bannerText}</span>
            <span className="mode-banner-tag" id="mode-banner-progress">
              {bannerProgress}
            </span>
          </div>
        )}

        {/* 3. 中央自适应 2.5D 瓶子舞台 */}
        <div className="bottles-stage">
          <div ref={gridRef} id="bottles-grid" className={`bottles-grid ${cfg.gridClass || ''}`}>
            {bottles.map((b, idx) => (
              <BottleView
                key={`bottle-${b.id}`}
                bottle={b}
                idx={idx}
                isSelected={selectedIndex === idx}
                levelId={currentLevelId}
                onClick={() => handleBottleClick(idx)}
              />
            ))}
          </div>
        </div>

        {/* 4. 底部 4 大果冻玻璃道具与选关栏 */}
        <ControlBar
          shuffleUses={shuffleUses}
          onShuffle={handleShuffle}
          onAddBottle={handleAddBottle}
          onOpenLevelSelect={() => setLevelModalOpen(true)}
          onUndo={handleUndo}
        />
      </div>

      {/* 全屏流体与星尘光效层 */}
      <svg id="fx-overlay" ref={fxOverlayRef} />

      {/* 交互 Toast 气泡 */}
      <div className={`toast-msg ${toastMsg ? 'show' : ''}`} id="toast-msg">
        {toastMsg}
      </div>

      {/* 弹窗 1：200 关波浪形难度选关面板 */}
      <LevelSelectModal
        isOpen={levelModalOpen}
        currentLevelId={currentLevelId}
        onSelectLevel={(id) => {
          setCurrentLevelId(id);
          showToast(`✨ 已开启：第 ${id} 关`);
        }}
        onClose={() => setLevelModalOpen(false)}
      />

      {/* 弹窗 2：商业级【新玩法 / 新特殊瓶登场图鉴】果冻玻璃弹窗 */}
      <MechanicIntroModal
        isOpen={!!activeIntro}
        intro={activeIntro}
        levelId={currentLevelId}
        onStart={() => {
          setCurrentMechanicKey(null);
          audioEngine.playSound('select');
        }}
      />

      {/* 弹窗 3：工坊设置/荣誉面板 */}
      <WinModal
        isOpen={settingsModalOpen}
        isSettingsMode={true}
        levelNum={currentLevelId}
        levelTitle={cfg.title}
        userMoves={pourCountTotal}
        optimalMoves={cfg.optimalMoves || 17}
        onNextLevel={() => {
          setSettingsModalOpen(false);
          const nextId = (currentLevelId % 200) + 1;
          setCurrentLevelId(nextId);
          showToast(`✨ 已开启：第 ${nextId} 关`);
        }}
        onRestart={() => {
          setSettingsModalOpen(false);
          initGame(currentLevelId);
          showToast('🔄 当前试炼已重新陈列');
        }}
        onOpenLevelSelect={() => {
          setSettingsModalOpen(false);
          setLevelModalOpen(true);
        }}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* 弹窗 4：通关结算面板 */}
      <WinModal
        isOpen={winModalOpen}
        isSettingsMode={false}
        isGiantCat={wasGiantCatWin}
        levelNum={currentLevelId}
        levelTitle={cfg.title}
        userMoves={pourCountTotal}
        optimalMoves={cfg.optimalMoves || 17}
        onNextLevel={() => {
          setWinModalOpen(false);
          const nextId = (currentLevelId % 200) + 1;
          setCurrentLevelId(nextId);
          showToast(`✨ 已开启：第 ${nextId} 关`);
        }}
        onRestart={() => {
          setWinModalOpen(false);
          initGame(currentLevelId);
          showToast('🔄 当前试炼已重新陈列');
        }}
        onOpenLevelSelect={() => {
          setWinModalOpen(false);
          setLevelModalOpen(true);
        }}
      />
    </>
  );
};

export default App;
