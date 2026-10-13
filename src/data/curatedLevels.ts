import { Level, Bottle } from "../types/game";

const CAP = 4;

function normal(id: string, layers: string[]): Bottle {
  return { id, type: "normal", capacity: CAP, layers };
}
function empty(id: string): Bottle {
  return { id, type: "empty", capacity: CAP, layers: [] };
}
function masked(id: string, layers: string[], threshold = 2): Bottle {
  return {
    id,
    type: "masked",
    capacity: CAP,
    layers,
    maskRevealed: false,
    unlockTargetCompletedBottles: threshold,
    countsTowardObjective: true,
  };
}
function hidden(id: string, layers: string[], bottomLayers: number): Bottle {
  return { id, type: "hidden", capacity: CAP, layers, hiddenBottomLayers: bottomLayers };
}
function videoEmpty(id: string): Bottle {
  return { id, type: "video_empty", capacity: CAP, layers: [], locked: true };
}
function leak(id: string, layers: string[], targetId: string): Bottle {
  return { id, type: "bottom_leak", capacity: CAP, layers, leakTargetBottleId: targetId };
}

// 统一颜色映射：红→red 蓝→blue 黄→yellow 绿→green 紫→purple 橙→orange 青→cyan 粉→pink
// 瓶内颜色数组顺序严格按【底部 → 顶部】排列
export const CURATED_LEVELS: Level[] = [
  // 第 1 关：新手入门（3色半满，大空隙好倒，2个免费空瓶）
  {
    id: 1,
    title: "初识三色倒水",
    optimalSteps: 5,
    difficulty: "easy",
    bottles: [
      normal("b1", ["red", "blue"]),
      normal("b2", ["blue", "yellow"]),
      normal("b3", ["yellow", "red"]),
      normal("b4", ["red", "blue", "yellow"]),
      empty("b5"),
      empty("b6"),
    ],
  },
  // 第 2 关：双排启蒙（3色半满，3个免费空瓶，空间充裕）
  {
    id: 2,
    title: "双排三色整理",
    optimalSteps: 6,
    difficulty: "easy",
    bottles: [
      // 第一排 (4瓶)
      normal("b1", ["red", "blue", "green"]),
      normal("b2", ["green", "red", "blue"]),
      normal("b3", ["blue", "green", "red"]),
      normal("b4", ["red", "green", "blue"]),
      // 第二排 (3瓶)：全部免费空瓶
      empty("b5"),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 3 关：四色双排（半满留白，2个免费空瓶，自由腾挪）
  {
    id: 3,
    title: "四色空间规划",
    optimalSteps: 8,
    difficulty: "easy",
    bottles: [
      // 第一排 (4瓶)
      normal("b1", ["red", "yellow", "green"]),
      normal("b2", ["green", "blue", "red"]),
      normal("b3", ["yellow", "green", "blue"]),
      normal("b4", ["blue", "red", "yellow"]),
      // 第二排 (4瓶)
      normal("b5", ["red", "blue"]),
      normal("b6", ["green", "yellow"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 4 关：初识布帘瓶（门槛1，有2个免费空瓶+1个辅助视频空瓶，绝对不卡死）
  {
    id: 4,
    title: "初识布帘与订单",
    optimalSteps: 8,
    difficulty: "easy",
    bottles: [
      // 第一排 (5瓶)
      normal("b1", ["yellow", "green", "blue"]),
      normal("b2", ["green", "red", "yellow"]),
      masked("b3", ["blue", "yellow", "green", "red"], 1),
      normal("b4", ["red", "blue", "red"]),
      empty("b5"),
      // 第二排 (4瓶)
      normal("b6", ["yellow", "blue"]),
      normal("b7", ["green", "red"]),
      empty("b8"),
      videoEmpty("b9"), // 辅助道具空瓶：不看视频靠 b5, b8 也完全能通关！
    ],
  },
  // 第 5 关：双排10瓶（完全对标标杆参考图！半满瓶+大量顶部容积+两翼辅助视频空瓶）
  {
    id: 5,
    title: "双排试炼与半满瓶",
    optimalSteps: 10,
    difficulty: "medium",
    bottles: [
      // 第一排 (5瓶)：半满瓶（1~2格水，顶部留有2~3格空闲容积随时可倒入）
      normal("b1", ["yellow", "green"]),
      normal("b2", ["green", "blue"]),
      normal("b3", ["blue", "purple"]),
      normal("b4", ["green"]),
      normal("b5", ["red", "purple"]),

      // 第二排 (5瓶)：
      videoEmpty("b6"), // 左翼辅助视频空瓶（可看不看）
      normal("b7", ["red", "yellow"]),
      normal("b8", ["red", "purple"]),
      normal("b9", ["red", "blue"]),
      videoEmpty("b10"), // 右翼辅助视频空瓶（可看不看）
    ],
  },
  // 第 6 关：六色深度整理（12瓶双排 6+6，有2个免费空瓶+1个视频空瓶辅助）
  {
    id: 6,
    title: "六色双排整理",
    optimalSteps: 12,
    difficulty: "medium",
    bottles: [
      // 第一排 (6瓶)
      normal("b1", ["red", "blue", "yellow"]),
      normal("b2", ["green", "purple", "cyan"]),
      normal("b3", ["yellow", "green", "red"]),
      normal("b4", ["purple", "cyan", "blue"]),
      normal("b5", ["cyan", "yellow", "green"]),
      empty("b6"),
      // 第二排 (6瓶)
      normal("b7", ["blue", "purple", "red"]),
      normal("b8", ["green", "cyan", "purple"]),
      normal("b9", ["red", "blue", "yellow"]),
      masked("b10", ["yellow", "purple", "cyan", "red"], 1),
      empty("b11"),
      videoEmpty("b12"), // 辅助视频空瓶
    ],
  },
  // 第 7 关：进阶阶梯布帘（12瓶双排 6+6，门槛1与2，2个免费空瓶+1个视频空瓶）
  {
    id: 7,
    title: "阶梯布帘挑战",
    optimalSteps: 14,
    difficulty: "medium",
    bottles: [
      // 第一排 (6瓶)
      normal("b1", ["blue", "yellow", "red", "green"]),
      normal("b2", ["purple", "orange", "cyan"]),
      masked("b3", ["green", "blue", "yellow", "red"], 2),
      normal("b4", ["orange", "cyan", "purple"]),
      normal("b5", ["red", "green", "blue"]),
      empty("b6"),
      // 第二排 (6瓶)
      videoEmpty("b7"), // 辅助视频空瓶
      normal("b8", ["cyan", "orange", "purple"]),
      normal("b9", ["yellow", "red", "green"]),
      masked("b10", ["purple", "cyan", "orange", "blue"], 1),
      normal("b11", ["blue", "yellow", "orange"]),
      empty("b12"),
    ],
  },
  // 第 8 关：双排满编（14瓶 7+7，2个免费空瓶+2个辅助视频空瓶）
  {
    id: 8,
    title: "双排高熵试炼",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      // 第一排 (7瓶)
      normal("b1", ["red", "yellow", "blue", "green"]),
      normal("b2", ["purple", "orange", "cyan", "pink"]),
      normal("b3", ["yellow", "blue", "green", "red"]),
      masked("b4", ["pink", "cyan", "purple", "orange"], 2),
      normal("b5", ["orange", "purple", "pink", "cyan"]),
      normal("b6", ["green", "red", "yellow", "blue"]),
      empty("b7"),
      // 第二排 (7瓶)
      videoEmpty("b8"),
      normal("b9", ["cyan", "pink", "orange", "purple"]),
      normal("b10", ["blue", "green", "red", "yellow"]),
      masked("b11", ["red", "yellow", "blue", "green"], 1),
      normal("b12", ["purple", "orange", "cyan", "pink"]),
      empty("b13"),
      videoEmpty("b14"),
    ],
  },
  // 第 9 关：三排雏形（15瓶 5+5+5，包含免费空瓶与辅助视频瓶）
  {
    id: 9,
    title: "三排空间规划",
    optimalSteps: 20,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red", "yellow", "blue"]),
      normal("b2", ["green", "purple", "orange"]),
      normal("b3", ["cyan", "pink", "red"]),
      normal("b4", ["yellow", "green", "blue"]),
      empty("b5"),

      videoEmpty("b6"),
      normal("b7", ["purple", "orange", "cyan"]),
      normal("b8", ["pink", "red", "yellow"]),
      normal("b9", ["green", "blue", "purple"]),
      empty("b10"),

      normal("b11", ["orange", "cyan", "pink"]),
      normal("b12", ["blue", "green", "yellow"]),
      masked("b13", ["red", "purple", "orange", "cyan"], 1),
      empty("b14"),
      videoEmpty("b15"),
    ],
  },
  // 第 10 关：首章终极大关（21瓶满屏 3行×7列，高熵巅峰集大成，天然自带免费空瓶！）
  {
    id: 10,
    title: "满屏高熵终极考验",
    optimalSteps: 28,
    difficulty: "master",
    bottles: [
      // 第 1 行 (7 瓶)
      normal("b1", ["red", "yellow", "blue", "green"]),
      normal("b2", ["purple", "orange", "cyan", "pink"]),
      normal("b3", ["yellow", "blue", "green", "red"]),
      masked("b4", ["pink", "cyan", "purple", "orange"], 2),
      normal("b5", ["orange", "purple", "pink", "cyan"]),
      normal("b6", ["green", "red", "yellow", "blue"]),
      empty("b7"), // 免费空瓶1

      // 第 2 行 (7 瓶)：两翼为辅助视频空瓶（可看不看）
      videoEmpty("b8"),
      normal("b9", ["cyan", "pink", "orange", "purple"]),
      normal("b10", ["blue", "green", "red", "yellow"]),
      masked("b11", ["red", "yellow", "blue", "green"], 3),
      normal("b12", ["purple", "orange", "cyan", "pink"]),
      normal("b13", ["yellow", "green", "blue", "red"]),
      videoEmpty("b14"),

      // 第 3 行 (7 瓶)
      normal("b15", ["pink", "cyan", "purple", "orange"]),
      normal("b16", ["green", "blue", "yellow", "red"]),
      empty("b17"), // 免费空瓶2
      masked("b18", ["orange", "purple", "pink", "cyan"], 1),
      normal("b19", ["blue", "red", "green", "yellow"]),
      normal("b20", ["cyan", "pink", "orange", "purple"]),
      empty("b21"), // 免费空瓶3
    ],
  },
  // 第 11 关
  {
    id: 11,
    title: "五色分拣",
    optimalSteps: 11,
    difficulty: "medium",
    bottles: [
      normal("b1", ["blue", "yellow", "yellow", "green"]),
      normal("b2", ["blue", "green", "red", "red"]),
      normal("b3", ["blue", "green", "red", "green"]),
      normal("b4", ["red", "yellow", "yellow", "blue"]),
      empty("b5"),
      empty("b6"),
    ],
  },
  // 第 12 关
  {
    id: 12,
    title: "避免堵死颜色",
    optimalSteps: 10,
    difficulty: "medium",
    bottles: [
      normal("b1", ["red", "green", "green", "yellow"]),
      normal("b2", ["blue", "blue", "blue", "green"]),
      normal("b3", ["red", "yellow", "yellow", "blue"]),
      normal("b4", ["red", "green", "yellow", "red"]),
      empty("b5"),
      empty("b6"),
    ],
  },
  // 第 13 关
  {
    id: 13,
    title: "五色交错",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      normal("b1", ["yellow", "red", "green", "yellow"]),
      normal("b2", ["red", "purple", "blue", "red"]),
      normal("b3", ["red", "yellow", "blue", "purple"]),
      normal("b4", ["blue", "blue", "purple", "green"]),
      normal("b5", ["green", "green", "purple", "yellow"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 14 关
  {
    id: 14,
    title: "单空瓶规划",
    optimalSteps: 12,
    difficulty: "medium",
    bottles: [
      normal("b1", ["red", "green", "yellow", "red"]),
      normal("b2", ["yellow", "yellow", "purple", "purple"]),
      normal("b3", ["green", "green", "red", "red"]),
      normal("b4", ["blue", "purple", "purple", "blue"]),
      normal("b5", ["yellow", "green", "blue", "blue"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 15 关
  {
    id: 15,
    title: "基础进阶综合",
    optimalSteps: 19,
    difficulty: "medium",
    bottles: [
      normal("b1", ["orange", "green", "purple", "blue"]),
      normal("b2", ["green", "red", "blue", "blue"]),
      normal("b3", ["purple", "blue", "purple", "orange"]),
      normal("b4", ["yellow", "purple", "yellow", "yellow"]),
      normal("b5", ["orange", "red", "orange", "red"]),
      normal("b6", ["green", "red", "green", "yellow"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 16 关
  {
    id: 16,
    title: "五色多层交错",
    optimalSteps: 16,
    difficulty: "medium",
    bottles: [
      normal("b1", ["blue", "yellow", "red", "green"]),
      normal("b2", ["red", "green", "purple", "green"]),
      normal("b3", ["green", "blue", "purple", "red"]),
      normal("b4", ["red", "blue", "yellow", "yellow"]),
      normal("b5", ["yellow", "purple", "blue", "purple"]),
      empty("b6"),
    ],
  },
  // 第 17 关
  {
    id: 17,
    title: "少空瓶挑战",
    optimalSteps: 17,
    difficulty: "medium",
    bottles: [
      normal("b1", ["yellow", "blue", "red", "yellow"]),
      normal("b2", ["yellow", "purple", "green", "purple"]),
      normal("b3", ["purple", "blue", "green", "red"]),
      normal("b4", ["red", "green", "blue", "green"]),
      normal("b5", ["red", "blue", "yellow", "purple"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 18 关
  {
    id: 18,
    title: "回合顺序规划",
    optimalSteps: 14,
    difficulty: "medium",
    bottles: [
      normal("b1", ["yellow", "purple", "yellow", "blue"]),
      normal("b2", ["blue", "blue", "purple", "green"]),
      normal("b3", ["purple", "green", "red", "red"]),
      normal("b4", ["green", "yellow", "green", "red"]),
      normal("b5", ["purple", "yellow", "blue", "red"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 19 关
  {
    id: 19,
    title: "复盘与撤销教学",
    optimalSteps: 13,
    difficulty: "medium",
    bottles: [
      normal("b1", ["blue", "red", "red", "blue"]),
      normal("b2", ["blue", "red", "purple", "purple"]),
      normal("b3", ["purple", "green", "yellow", "yellow"]),
      normal("b4", ["green", "yellow", "yellow", "green"]),
      normal("b5", ["green", "red", "purple", "blue"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 20 关
  {
    id: 20,
    title: "普通机制阶段考核",
    optimalSteps: 14,
    difficulty: "medium",
    bottles: [
      normal("b1", ["green", "purple", "blue", "red"]),
      normal("b2", ["blue", "blue", "green", "yellow"]),
      normal("b3", ["yellow", "blue", "red", "yellow"]),
      normal("b4", ["purple", "green", "red", "red"]),
      normal("b5", ["yellow", "purple", "purple", "green"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 21 关
  {
    id: 21,
    title: "六色混合",
    optimalSteps: 14,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple", "yellow", "blue", "green"]),
      normal("b2", ["red", "purple", "yellow", "red"]),
      normal("b3", ["green", "green", "yellow", "blue"]),
      normal("b4", ["green", "red", "blue", "blue"]),
      normal("b5", ["red", "yellow", "purple", "purple"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 22 关
  {
    id: 22,
    title: "长同色段利用",
    optimalSteps: 17,
    difficulty: "medium",
    bottles: [
      normal("b1", ["blue", "green", "blue", "green"]),
      normal("b2", ["green", "red", "green", "purple"]),
      normal("b3", ["yellow", "purple", "red", "blue"]),
      normal("b4", ["yellow", "purple", "red", "yellow"]),
      normal("b5", ["red", "yellow", "blue", "purple"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 23 关
  {
    id: 23,
    title: "遮罩瓶教学",
    optimalSteps: 13,
    difficulty: "medium",
    bottles: [
      normal("b1", ["red", "green", "green", "red"]),
      masked("b2", ["red", "red", "purple", "yellow"], 2),
      normal("b3", ["blue", "blue", "purple", "purple"]),
      normal("b4", ["blue", "yellow", "blue", "yellow"]),
      normal("b5", ["green", "purple", "yellow", "green"]),
      empty("b6"),
      empty("b7"),
    ],
  },
  // 第 24 关
  {
    id: 24,
    title: "遮罩阈值提高",
    optimalSteps: 16,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple", "yellow", "orange", "yellow"]),
      masked("b2", ["orange", "red", "yellow", "green"], 2),
      normal("b3", ["orange", "blue", "purple", "purple"]),
      normal("b4", ["blue", "blue", "red", "orange"]),
      normal("b5", ["blue", "purple", "yellow", "red"]),
      normal("b6", ["red", "green", "green", "green"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 25 关
  {
    id: 25,
    title: "遮罩与普通瓶配合",
    optimalSteps: 19,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple", "yellow", "orange", "purple"]),
      masked("b2", ["yellow", "red", "green", "blue"], 2),
      normal("b3", ["blue", "purple", "yellow", "orange"]),
      normal("b4", ["green", "blue", "green", "orange"]),
      normal("b5", ["red", "purple", "orange", "red"]),
      normal("b6", ["blue", "green", "red", "yellow"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 26 关
  {
    id: 26,
    title: "遮罩瓶基础",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["blue", "blue", "green", "yellow"]),
      masked("b2", ["red", "orange", "yellow", "purple"], 2),
      normal("b3", ["green", "green", "red", "yellow"]),
      normal("b4", ["red", "orange", "blue", "red"]),
      normal("b5", ["purple", "green", "yellow", "orange"]),
      normal("b6", ["purple", "blue", "purple", "orange"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 27 关
  {
    id: 27,
    title: "先解锁还是先整理",
    optimalSteps: 16,
    difficulty: "hard",
    bottles: [
      normal("b1", ["purple", "blue", "yellow", "green"]),
      masked("b2", ["yellow", "purple", "blue", "purple"], 2),
      normal("b3", ["red", "orange", "orange", "green"]),
      normal("b4", ["blue", "red", "red", "orange"]),
      normal("b5", ["green", "green", "orange", "purple"]),
      normal("b6", ["red", "yellow", "yellow", "blue"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 28 关
  {
    id: 28,
    title: "遮罩瓶双目标",
    optimalSteps: 15,
    difficulty: "hard",
    bottles: [
      normal("b1", ["orange", "red", "red", "green"]),
      masked("b2", ["green", "purple", "yellow", "yellow"], 2),
      normal("b3", ["orange", "blue", "blue", "green"]),
      normal("b4", ["red", "yellow", "orange", "green"]),
      normal("b5", ["purple", "purple", "purple", "blue"]),
      normal("b6", ["orange", "blue", "yellow", "red"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 29 关
  {
    id: 29,
    title: "遮罩瓶较晚解锁",
    optimalSteps: 19,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green", "yellow", "orange", "purple"]),
      masked("b2", ["red", "blue", "red", "yellow"], 2),
      normal("b3", ["yellow", "red", "blue", "green"]),
      normal("b4", ["purple", "red", "purple", "purple"]),
      normal("b5", ["orange", "orange", "blue", "green"]),
      normal("b6", ["yellow", "orange", "green", "blue"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 30 关
  {
    id: 30,
    title: "遮罩瓶综合",
    optimalSteps: 17,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green", "green", "yellow", "orange"]),
      masked("b2", ["red", "orange", "blue", "blue"], 2),
      normal("b3", ["purple", "blue", "yellow", "green"]),
      normal("b4", ["orange", "yellow", "red", "orange"]),
      normal("b5", ["red", "purple", "red", "green"]),
      normal("b6", ["blue", "purple", "purple", "yellow"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 31 关
  {
    id: 31,
    title: "隐藏底部1层",
    optimalSteps: 20,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green", "orange", "green", "yellow"]),
      normal("b2", ["purple", "yellow", "blue", "yellow"]),
      hidden("b3", ["red", "purple", "blue", "red"], 1),
      normal("b4", ["blue", "purple", "orange", "purple"]),
      normal("b5", ["red", "blue", "orange", "green"]),
      normal("b6", ["yellow", "red", "green", "orange"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 32 关
  {
    id: 32,
    title: "揭晓后再规划",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["blue", "green", "blue", "orange"]),
      normal("b2", ["green", "red", "green", "blue"]),
      hidden("b3", ["yellow", "orange", "orange", "orange"], 1),
      normal("b4", ["yellow", "red", "yellow", "purple"]),
      normal("b5", ["red", "red", "purple", "purple"]),
      normal("b6", ["yellow", "purple", "green", "blue"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 33 关
  {
    id: 33,
    title: "隐藏底部2层",
    optimalSteps: 20,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green", "blue", "green", "yellow"]),
      normal("b2", ["orange", "blue", "yellow", "purple"]),
      hidden("b3", ["green", "red", "blue", "red"], 2),
      normal("b4", ["orange", "green", "red", "red"]),
      normal("b5", ["orange", "blue", "orange", "purple"]),
      normal("b6", ["purple", "yellow", "yellow", "purple"]),
      empty("b7"),
      empty("b8"),
    ],
  },
  // 第 34 关
  {
    id: 34,
    title: "两只隐藏瓶",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green", "purple", "yellow", "orange"]),
      normal("b2", ["red", "blue", "purple", "orange"]),
      hidden("b3", ["cyan", "orange", "orange", "blue"], 2),
      normal("b4", ["purple", "green", "yellow", "green"]),
      normal("b5", ["blue", "red", "blue", "purple"]),
      normal("b6", ["red", "yellow", "yellow", "cyan"]),
      normal("b7", ["red", "cyan", "green", "cyan"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 35 关
  {
    id: 35,
    title: "隐藏与普通瓶配合",
    optimalSteps: 23,
    difficulty: "hard",
    bottles: [
      normal("b1", ["purple", "blue", "cyan", "red"]),
      normal("b2", ["blue", "orange", "yellow", "purple"]),
      hidden("b3", ["cyan", "red", "orange", "green"], 2),
      normal("b4", ["cyan", "orange", "blue", "cyan"]),
      normal("b5", ["purple", "yellow", "purple", "green"]),
      normal("b6", ["orange", "green", "yellow", "blue"]),
      normal("b7", ["green", "red", "yellow", "red"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 36 关
  {
    id: 36,
    title: "两种特殊瓶组合",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["yellow", "purple", "cyan", "cyan"]),
      masked("b2", ["orange", "green", "purple", "green"], 2),
      hidden("b3", ["cyan", "purple", "blue", "green"], 1),
      normal("b4", ["orange", "red", "yellow", "green"]),
      normal("b5", ["orange", "yellow", "blue", "yellow"]),
      normal("b6", ["purple", "red", "cyan", "blue"]),
      normal("b7", ["red", "blue", "red", "orange"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 37 关
  {
    id: 37,
    title: "隐藏层连续揭晓",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["yellow", "blue", "blue", "green"]),
      masked("b2", ["green", "purple", "red", "orange"], 2),
      hidden("b3", ["purple", "red", "yellow", "yellow"], 1),
      normal("b4", ["orange", "cyan", "yellow", "red"]),
      normal("b5", ["cyan", "red", "purple", "cyan"]),
      normal("b6", ["cyan", "orange", "green", "purple"]),
      normal("b7", ["blue", "green", "blue", "orange"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 38 关
  {
    id: 38,
    title: "遮罩解锁路线",
    optimalSteps: 20,
    difficulty: "hard",
    bottles: [
      normal("b1", ["purple", "red", "yellow", "purple"]),
      masked("b2", ["blue", "cyan", "orange", "blue"], 2),
      hidden("b3", ["red", "red", "purple", "yellow"], 2),
      normal("b4", ["orange", "orange", "green", "yellow"]),
      normal("b5", ["cyan", "blue", "green", "yellow"]),
      normal("b6", ["blue", "green", "green", "red"]),
      normal("b7", ["purple", "cyan", "orange", "cyan"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 39 关
  {
    id: 39,
    title: "有限空瓶综合",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["cyan", "yellow", "green", "orange"]),
      masked("b2", ["purple", "orange", "cyan", "blue"], 2),
      hidden("b3", ["purple", "yellow", "green", "orange"], 2),
      normal("b4", ["blue", "cyan", "green", "green"]),
      normal("b5", ["blue", "orange", "purple", "red"]),
      normal("b6", ["purple", "blue", "yellow", "yellow"]),
      normal("b7", ["red", "red", "cyan", "red"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 40 关
  {
    id: 40,
    title: "特殊瓶阶段考核",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["yellow", "cyan", "green", "cyan"]),
      masked("b2", ["red", "yellow", "orange", "yellow"], 2),
      hidden("b3", ["cyan", "green", "blue", "green"], 2),
      normal("b4", ["purple", "blue", "orange", "blue"]),
      normal("b5", ["cyan", "red", "purple", "purple"]),
      normal("b6", ["blue", "purple", "yellow", "red"]),
      normal("b7", ["green", "red", "orange", "orange"]),
      empty("b8"),
    ],
  },
  // 第 41 关
  {
    id: 41,
    title: "单层漏水教学",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      leak("b1", ["yellow", "yellow"], "b6"),
      normal("b2", ["green", "blue", "green", "red"]),
      normal("b3", ["blue", "purple", "red", "green"]),
      normal("b4", ["red", "purple", "red", "purple"]),
      normal("b5", ["blue", "yellow", "green", "blue"]),
      normal("b6", ["purple", "yellow"]),
      empty("b7"),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 42 关
  {
    id: 42,
    title: "匹配底色与目标顶色",
    optimalSteps: 17,
    difficulty: "hard",
    bottles: [
      leak("b1", ["green", "green"], "b6"),
      normal("b2", ["yellow", "red", "red", "purple"]),
      normal("b3", ["yellow", "purple", "red", "blue"]),
      normal("b4", ["blue", "green", "blue", "yellow"]),
      normal("b5", ["yellow", "purple", "blue", "red"]),
      normal("b6", ["purple", "green"]),
      empty("b7"),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 43 关
  {
    id: 43,
    title: "漏水与普通整理",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      leak("b1", ["yellow", "yellow"], "b6"),
      normal("b2", ["red", "green", "red", "orange"]),
      normal("b3", ["green", "orange", "blue", "blue"]),
      normal("b4", ["purple", "green", "green", "blue"]),
      normal("b5", ["red", "yellow", "purple", "blue"]),
      normal("b6", ["purple", "yellow"]),
      normal("b7", ["orange", "purple", "red", "orange"]),
      empty("b8"),
      empty("b9"),
    ],
  },
  // 第 44 关
  {
    id: 44,
    title: "漏水路线规划",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      leak("b1", ["green", "green"], "b6"),
      normal("b2", ["red", "blue", "blue", "orange"]),
      normal("b3", ["purple", "red", "blue", "red"]),
      normal("b4", ["blue", "orange", "purple", "yellow"]),
      normal("b5", ["yellow", "red", "orange", "orange"]),
      normal("b6", ["yellow", "green"]),
      normal("b7", ["purple", "yellow", "green", "purple"]),
      empty("b8"),
      empty("b9"),
      empty("b10"),
    ],
  },
  // 第 45 关
  {
    id: 45,
    title: "有限空间中的漏水",
    optimalSteps: 15,
    difficulty: "hard",
    bottles: [
      leak("b1", ["purple", "purple"], "b6"),
      normal("b2", ["yellow", "green", "red", "green"]),
      normal("b3", ["blue", "blue", "blue", "red"]),
      normal("b4", ["orange", "yellow", "green", "green"]),
      normal("b5", ["purple", "red", "orange", "yellow"]),
      normal("b6", ["blue", "purple"]),
      normal("b7", ["red", "orange", "orange", "yellow"]),
      empty("b8"),
      empty("b9"),
      empty("b10"),
    ],
  },
  // 第 46 关
  {
    id: 46,
    title: "漏水与隐藏瓶",
    optimalSteps: 18,
    difficulty: "master",
    bottles: [
      leak("b1", ["orange", "orange"], "b6"),
      hidden("b2", ["green", "yellow", "yellow", "yellow"], 1),
      normal("b3", ["yellow", "red", "green", "purple"]),
      normal("b4", ["blue", "green", "purple", "orange"]),
      normal("b5", ["red", "blue", "green", "red"]),
      normal("b6", ["red", "orange"]),
      normal("b7", ["blue", "purple", "purple", "blue"]),
      empty("b8"),
      empty("b9"),
      empty("b10"),
    ],
  },
  // 第 47 关
  {
    id: 47,
    title: "隐藏瓶与目标配对",
    optimalSteps: 21,
    difficulty: "master",
    bottles: [
      leak("b1", ["cyan", "cyan"], "b7"),
      hidden("b2", ["blue", "blue", "red", "purple"], 1),
      normal("b3", ["orange", "yellow", "green", "purple"]),
      normal("b4", ["yellow", "blue", "red", "purple"]),
      normal("b5", ["red", "yellow", "orange", "orange"]),
      normal("b6", ["blue", "cyan", "yellow", "green"]),
      normal("b7", ["orange", "cyan"]),
      normal("b8", ["purple", "green", "green", "red"]),
      empty("b9"),
      empty("b10"),
      empty("b11"),
    ],
  },
  // 第 48 关
  {
    id: 48,
    title: "逐层揭晓隐藏色",
    optimalSteps: 21,
    difficulty: "master",
    bottles: [
      leak("b1", ["red", "red"], "b7"),
      hidden("b2", ["orange", "purple", "green", "green"], 2),
      normal("b3", ["yellow", "cyan", "green", "cyan"]),
      normal("b4", ["purple", "purple", "orange", "blue"]),
      normal("b5", ["cyan", "orange", "yellow", "yellow"]),
      normal("b6", ["green", "red", "blue", "yellow"]),
      normal("b7", ["purple", "red"]),
      normal("b8", ["cyan", "blue", "blue", "orange"]),
      empty("b9"),
      empty("b10"),
      empty("b11"),
    ],
  },
  // 第 49 关
  {
    id: 49,
    title: "遮罩与隐藏双机制",
    optimalSteps: 15,
    difficulty: "master",
    bottles: [
      leak("b1", ["yellow", "yellow"], "b6"),
      hidden("b2", ["blue", "red", "blue", "red"], 1),
      masked("b3", ["orange", "green", "green", "red"], 2),
      normal("b4", ["orange", "orange", "purple", "blue"]),
      normal("b5", ["purple", "blue", "orange", "red"]),
      normal("b6", ["yellow", "yellow"]),
      normal("b7", ["green", "purple", "purple", "green"]),
      empty("b8"),
      empty("b9"),
      empty("b10"),
    ],
  },
  // 第 50 关
  {
    id: 50,
    title: "三层问号最终挑战",
    optimalSteps: 20,
    difficulty: "master",
    bottles: [
      leak("b1", ["green", "green"], "b6"),
      hidden("b2", ["red", "red", "purple", "blue"], 3),
      masked("b3", ["purple", "orange", "yellow", "orange"], 2),
      normal("b4", ["purple", "green", "blue", "purple"]),
      normal("b5", ["red", "orange", "orange", "yellow"]),
      normal("b6", ["blue", "green"]),
      normal("b7", ["red", "yellow", "yellow", "blue"]),
      empty("b8"),
      empty("b9"),
      empty("b10"),
    ],
  },
];
