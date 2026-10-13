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
function videoEmpty(id: string): Bottle {
  return { id, type: "video_empty", capacity: CAP, layers: [], locked: true };
}
function hidden(id: string, layers: string[], bottomLayers: number): Bottle {
  return { id, type: "hidden", capacity: CAP, layers, hiddenBottomLayers: bottomLayers };
}
function leak(id: string, layers: string[], targetId: string): Bottle {
  return { id, type: "bottom_leak", capacity: CAP, layers, leakTargetBottleId: targetId };
}

// 统一颜色映射：红→red 蓝→blue 黄→yellow 绿→green 紫→purple 橙→orange 青→cyan 粉→pink
// 瓶内颜色数组顺序严格按【底部 → 顶部】排列
// 【严格铁律】：每种颜色在关卡中严格恒等于 4 格（不多不少正好填满 1 个纯色瓶）！
// 【空瓶铁律】：免费空瓶严格仅有 1 个（大关 2 个），绝无多余空瓶！
export const CURATED_LEVELS: Level[] = [
  // 第 1 关
  {
    id: 1,
    title: "初识三色倒水",
    optimalSteps: 9,
    difficulty: "easy",
    bottles: [
      normal("b1", ["red","blue","red","yellow"]),
      normal("b2", ["red","blue","blue","yellow"]),
      normal("b3", ["red","yellow","yellow","blue"]),
      empty("b4"),
    ],
  },
  // 第 2 关
  {
    id: 2,
    title: "色彩三维整理",
    optimalSteps: 10,
    difficulty: "easy",
    bottles: [
      normal("b1", ["yellow","blue","red","yellow"]),
      normal("b2", ["blue","red","yellow","blue"]),
      normal("b3", ["yellow","red","red","blue"]),
      empty("b4"),
    ],
  },
  // 第 3 关
  {
    id: 3,
    title: "单空瓶极限博弈",
    optimalSteps: 5,
    difficulty: "easy",
    bottles: [
      normal("b1", ["red","red","red","blue"]),
      normal("b2", ["yellow","blue","blue","blue"]),
      normal("b3", ["yellow","yellow","red","yellow"]),
      empty("b4"),
    ],
  },
  // 第 4 关
  {
    id: 4,
    title: "四色空间初展",
    optimalSteps: 12,
    difficulty: "easy",
    bottles: [
      normal("b1", ["green","yellow","green","blue"]),
      normal("b2", ["red","blue","green","blue"]),
      normal("b3", ["red","yellow","blue","yellow"]),
      normal("b4", ["yellow","red","red","green"]),
      empty("b5"),
    ],
  },
  // 第 5 关
  {
    id: 5,
    title: "初识备用视频瓶",
    optimalSteps: 10,
    difficulty: "medium",
    bottles: [
      normal("b1", ["green","yellow","yellow","blue"]),
      normal("b2", ["yellow","blue","green","green"]),
      normal("b3", ["green","red","red","yellow"]),
      normal("b4", ["blue","red","blue","red"]),
      empty("b5"),
      videoEmpty("b6"),
    ],
  },
  // 第 6 关
  {
    id: 6,
    title: "双排四色规划",
    optimalSteps: 11,
    difficulty: "medium",
    bottles: [
      normal("b1", ["green","yellow","green","blue"]),
      normal("b2", ["blue","green","green","red"]),
      normal("b3", ["yellow","blue","red","red"]),
      normal("b4", ["red","yellow","blue","yellow"]),
      empty("b5"),
    ],
  },
  // 第 7 关
  {
    id: 7,
    title: "初识布帘订单",
    optimalSteps: 10,
    difficulty: "medium",
    bottles: [
      masked("b1", ["red","yellow","red","yellow"], 1),
      normal("b2", ["green","green","yellow","green"]),
      normal("b3", ["blue","blue","blue","red"]),
      normal("b4", ["red","blue","green","yellow"]),
      empty("b5"),
    ],
  },
  // 第 8 关
  {
    id: 8,
    title: "布帘连携挑战",
    optimalSteps: 10,
    difficulty: "medium",
    bottles: [
      masked("b1", ["green","blue","green","blue"], 1),
      normal("b2", ["green","yellow","blue","red"]),
      normal("b3", ["blue","green","red","red"]),
      normal("b4", ["yellow","yellow","yellow","red"]),
      empty("b5"),
      videoEmpty("b6"),
    ],
  },
  // 第 9 关
  {
    id: 9,
    title: "双层交错排序",
    optimalSteps: 12,
    difficulty: "medium",
    bottles: [
      normal("b1", ["yellow","red","yellow","red"]),
      normal("b2", ["green","red","blue","green"]),
      normal("b3", ["blue","yellow","green","yellow"]),
      normal("b4", ["red","green","blue","blue"]),
      empty("b5"),
    ],
  },
  // 第 10 关
  {
    id: 10,
    title: "四色巅峰流转",
    optimalSteps: 11,
    difficulty: "medium",
    bottles: [
      normal("b1", ["red","green","red","green"]),
      normal("b2", ["blue","red","green","red"]),
      normal("b3", ["yellow","blue","blue","yellow"]),
      normal("b4", ["green","yellow","yellow","blue"]),
      empty("b5"),
      videoEmpty("b6"),
    ],
  },
  // 第 11 关
  {
    id: 11,
    title: "五色斑斓入局",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      normal("b1", ["green","red","purple","yellow"]),
      normal("b2", ["yellow","red","blue","yellow"]),
      normal("b3", ["blue","green","green","purple"]),
      normal("b4", ["green","purple","blue","red"]),
      normal("b5", ["purple","blue","yellow","red"]),
      empty("b6"),
    ],
  },
  // 第 12 关
  {
    id: 12,
    title: "五色双排博弈",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple","purple","red","yellow"]),
      normal("b2", ["blue","purple","blue","blue"]),
      normal("b3", ["green","yellow","green","red"]),
      normal("b4", ["purple","yellow","red","green"]),
      normal("b5", ["green","blue","red","yellow"]),
      empty("b6"),
      videoEmpty("b7"),
    ],
  },
  // 第 13 关
  {
    id: 13,
    title: "阶梯布帘揭幕",
    optimalSteps: 13,
    difficulty: "medium",
    bottles: [
      masked("b1", ["blue","purple","yellow","yellow"], 1),
      normal("b2", ["purple","red","blue","purple"]),
      normal("b3", ["blue","red","purple","blue"]),
      normal("b4", ["red","yellow","green","green"]),
      normal("b5", ["yellow","red","green","green"]),
      empty("b6"),
    ],
  },
  // 第 14 关
  {
    id: 14,
    title: "单侧备用破局",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      normal("b1", ["blue","purple","red","yellow"]),
      normal("b2", ["purple","purple","red","green"]),
      normal("b3", ["purple","green","green","yellow"]),
      normal("b4", ["yellow","blue","red","blue"]),
      normal("b5", ["green","blue","red","yellow"]),
      empty("b6"),
      videoEmpty("b7"),
    ],
  },
  // 第 15 关
  {
    id: 15,
    title: "五色深度整理",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple","yellow","red","red"]),
      normal("b2", ["yellow","green","red","green"]),
      normal("b3", ["green","blue","yellow","purple"]),
      normal("b4", ["blue","purple","red","yellow"]),
      normal("b5", ["green","blue","purple","blue"]),
      empty("b6"),
    ],
  },
  // 第 16 关
  {
    id: 16,
    title: "多单并行流转",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      masked("b1", ["purple","red","green","green"], 1),
      normal("b2", ["red","green","purple","yellow"]),
      normal("b3", ["purple","blue","blue","red"]),
      normal("b4", ["purple","green","red","yellow"]),
      normal("b5", ["blue","yellow","blue","yellow"]),
      empty("b6"),
    ],
  },
  // 第 17 关
  {
    id: 17,
    title: "空间收紧试炼",
    optimalSteps: 11,
    difficulty: "medium",
    bottles: [
      normal("b1", ["red","red","green","green"]),
      normal("b2", ["red","green","blue","yellow"]),
      normal("b3", ["green","purple","yellow","yellow"]),
      normal("b4", ["blue","blue","blue","purple"]),
      normal("b5", ["purple","yellow","purple","red"]),
      empty("b6"),
      videoEmpty("b7"),
    ],
  },
  // 第 18 关
  {
    id: 18,
    title: "布帘双重考验",
    optimalSteps: 15,
    difficulty: "medium",
    bottles: [
      masked("b1", ["green","blue","yellow","blue"], 1),
      normal("b2", ["red","yellow","yellow","purple"]),
      normal("b3", ["blue","green","green","red"]),
      normal("b4", ["purple","red","yellow","purple"]),
      normal("b5", ["blue","purple","red","green"]),
      empty("b6"),
    ],
  },
  // 第 19 关
  {
    id: 19,
    title: "双层满编试炼",
    optimalSteps: 17,
    difficulty: "medium",
    bottles: [
      normal("b1", ["yellow","green","blue","purple"]),
      normal("b2", ["blue","red","yellow","red"]),
      normal("b3", ["purple","green","green","purple"]),
      normal("b4", ["yellow","green","blue","purple"]),
      normal("b5", ["red","blue","red","yellow"]),
      empty("b6"),
      videoEmpty("b7"),
    ],
  },
  // 第 20 关
  {
    id: 20,
    title: "中盘巅峰破局",
    optimalSteps: 12,
    difficulty: "medium",
    bottles: [
      masked("b1", ["green","purple","purple","blue"], 1),
      normal("b2", ["blue","blue","yellow","yellow"]),
      normal("b3", ["yellow","red","red","red"]),
      normal("b4", ["yellow","green","red","blue"]),
      normal("b5", ["green","purple","green","purple"]),
      empty("b6"),
      videoEmpty("b7"),
    ],
  },
  // 第 21 关
  {
    id: 21,
    title: "六色宏大展布",
    optimalSteps: 21,
    difficulty: "medium",
    bottles: [
      normal("b1", ["purple","red","blue","yellow"]),
      normal("b2", ["orange","purple","blue","red"]),
      normal("b3", ["blue","green","orange","red"]),
      normal("b4", ["red","yellow","yellow","green"]),
      normal("b5", ["blue","green","purple","yellow"]),
      normal("b6", ["purple","orange","green","orange"]),
      empty("b7"),
    ],
  },
  // 第 22 关
  {
    id: 22,
    title: "冷暖色相分离",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red","red","blue","orange"]),
      normal("b2", ["orange","yellow","blue","green"]),
      normal("b3", ["purple","blue","orange","yellow"]),
      normal("b4", ["blue","purple","red","purple"]),
      normal("b5", ["green","orange","red","green"]),
      normal("b6", ["yellow","yellow","purple","green"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 23 关
  {
    id: 23,
    title: "高熵交错排序",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["orange","green","orange","blue"]),
      normal("b2", ["red","red","blue","purple"]),
      normal("b3", ["purple","red","purple","yellow"]),
      normal("b4", ["yellow","orange","orange","purple"]),
      normal("b5", ["yellow","blue","yellow","green"]),
      normal("b6", ["green","blue","green","red"]),
      empty("b7"),
    ],
  },
  // 第 24 关
  {
    id: 24,
    title: "布帘二重奏",
    optimalSteps: 17,
    difficulty: "hard",
    bottles: [
      masked("b1", ["blue","orange","orange","orange"], 1),
      normal("b2", ["red","purple","yellow","blue"]),
      normal("b3", ["orange","purple","blue","purple"]),
      normal("b4", ["green","yellow","yellow","green"]),
      normal("b5", ["blue","red","green","red"]),
      normal("b6", ["yellow","red","purple","green"]),
      empty("b7"),
    ],
  },
  // 第 25 关
  {
    id: 25,
    title: "单侧备用解围",
    optimalSteps: 21,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green","blue","orange","yellow"]),
      normal("b2", ["green","purple","green","purple"]),
      normal("b3", ["red","yellow","yellow","blue"]),
      normal("b4", ["orange","purple","orange","blue"]),
      normal("b5", ["orange","red","green","blue"]),
      normal("b6", ["red","purple","red","yellow"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 26 关
  {
    id: 26,
    title: "六色迷宫突围",
    optimalSteps: 19,
    difficulty: "hard",
    bottles: [
      normal("b1", ["orange","green","purple","orange"]),
      normal("b2", ["yellow","yellow","yellow","red"]),
      normal("b3", ["green","blue","purple","blue"]),
      normal("b4", ["blue","yellow","purple","green"]),
      normal("b5", ["orange","red","orange","red"]),
      normal("b6", ["green","red","purple","blue"]),
      empty("b7"),
    ],
  },
  // 第 27 关
  {
    id: 27,
    title: "深层颜色挖掘",
    optimalSteps: 15,
    difficulty: "hard",
    bottles: [
      masked("b1", ["yellow","yellow","yellow","orange"], 1),
      normal("b2", ["purple","purple","red","green"]),
      normal("b3", ["orange","red","purple","blue"]),
      normal("b4", ["yellow","purple","orange","blue"]),
      normal("b5", ["red","green","red","green"]),
      normal("b6", ["green","blue","blue","orange"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 28 关
  {
    id: 28,
    title: "双层满编试炼",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["orange","green","green","blue"]),
      normal("b2", ["orange","yellow","red","purple"]),
      normal("b3", ["red","yellow","blue","blue"]),
      normal("b4", ["blue","yellow","red","purple"]),
      normal("b5", ["red","orange","green","purple"]),
      normal("b6", ["green","orange","yellow","purple"]),
      empty("b7"),
    ],
  },
  // 第 29 关
  {
    id: 29,
    title: "布帘连续掀起",
    optimalSteps: 16,
    difficulty: "hard",
    bottles: [
      masked("b1", ["yellow","orange","blue","yellow"], 1),
      normal("b2", ["green","orange","red","red"]),
      normal("b3", ["red","red","green","blue"]),
      normal("b4", ["purple","purple","green","blue"]),
      normal("b5", ["orange","yellow","purple","blue"]),
      normal("b6", ["green","orange","yellow","purple"]),
      empty("b7"),
    ],
  },
  // 第 30 关
  {
    id: 30,
    title: "精密倒水路径",
    optimalSteps: 19,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red","orange","purple","blue"]),
      normal("b2", ["orange","green","yellow","red"]),
      normal("b3", ["green","yellow","green","purple"]),
      normal("b4", ["red","blue","orange","yellow"]),
      normal("b5", ["orange","blue","red","green"]),
      normal("b6", ["purple","purple","blue","yellow"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 31 关
  {
    id: 31,
    title: "极限空间周转",
    optimalSteps: 16,
    difficulty: "hard",
    bottles: [
      normal("b1", ["purple","blue","yellow","yellow"]),
      normal("b2", ["red","yellow","orange","purple"]),
      normal("b3", ["yellow","blue","red","blue"]),
      normal("b4", ["orange","green","orange","purple"]),
      normal("b5", ["blue","purple","green","green"]),
      normal("b6", ["red","red","green","orange"]),
      empty("b7"),
    ],
  },
  // 第 32 关
  {
    id: 32,
    title: "订单高速补充",
    optimalSteps: 19,
    difficulty: "hard",
    bottles: [
      masked("b1", ["red","green","orange","green"], 1),
      normal("b2", ["red","blue","orange","blue"]),
      normal("b3", ["orange","blue","purple","red"]),
      normal("b4", ["blue","purple","green","yellow"]),
      normal("b5", ["purple","green","yellow","yellow"]),
      normal("b6", ["orange","red","yellow","purple"]),
      empty("b7"),
    ],
  },
  // 第 33 关
  {
    id: 33,
    title: "高压同色聚合",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red","blue","orange","orange"]),
      normal("b2", ["red","green","orange","blue"]),
      normal("b3", ["yellow","purple","green","blue"]),
      normal("b4", ["red","green","yellow","purple"]),
      normal("b5", ["green","blue","red","yellow"]),
      normal("b6", ["purple","purple","yellow","orange"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 34 关
  {
    id: 34,
    title: "三阶布帘启迪",
    optimalSteps: 17,
    difficulty: "hard",
    bottles: [
      masked("b1", ["green","green","orange","yellow"], 1),
      normal("b2", ["red","red","purple","green"]),
      normal("b3", ["orange","yellow","blue","orange"]),
      normal("b4", ["yellow","blue","green","purple"]),
      normal("b5", ["orange","yellow","purple","blue"]),
      normal("b6", ["blue","red","purple","red"]),
      empty("b7"),
    ],
  },
  // 第 35 关
  {
    id: 35,
    title: "大章节中继冲刺",
    optimalSteps: 18,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red","red","purple","yellow"]),
      normal("b2", ["purple","purple","yellow","green"]),
      normal("b3", ["red","green","red","purple"]),
      normal("b4", ["blue","yellow","blue","orange"]),
      normal("b5", ["yellow","orange","green","orange"]),
      normal("b6", ["orange","blue","green","blue"]),
      empty("b7"),
      videoEmpty("b8"),
    ],
  },
  // 第 36 关
  {
    id: 36,
    title: "七色彩虹交汇",
    optimalSteps: 21,
    difficulty: "hard",
    bottles: [
      normal("b1", ["orange","green","blue","cyan"]),
      normal("b2", ["green","blue","green","yellow"]),
      normal("b3", ["red","yellow","red","orange"]),
      normal("b4", ["blue","orange","purple","purple"]),
      normal("b5", ["yellow","blue","red","cyan"]),
      normal("b6", ["cyan","red","orange","green"]),
      normal("b7", ["purple","purple","cyan","yellow"]),
      empty("b8"),
    ],
  },
  // 第 37 关
  {
    id: 37,
    title: "长列双排博弈",
    optimalSteps: 21,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green","red","yellow","cyan"]),
      normal("b2", ["blue","blue","purple","blue"]),
      normal("b3", ["purple","cyan","yellow","yellow"]),
      normal("b4", ["orange","yellow","orange","green"]),
      normal("b5", ["purple","orange","green","green"]),
      normal("b6", ["red","orange","blue","cyan"]),
      normal("b7", ["red","purple","red","cyan"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 38 关
  {
    id: 38,
    title: "错落有致分拣",
    optimalSteps: 21,
    difficulty: "hard",
    bottles: [
      masked("b1", ["purple","purple","cyan","purple"], 1),
      normal("b2", ["red","blue","red","green"]),
      normal("b3", ["cyan","orange","orange","orange"]),
      normal("b4", ["yellow","green","blue","orange"]),
      normal("b5", ["red","blue","cyan","blue"]),
      normal("b6", ["green","green","yellow","purple"]),
      normal("b7", ["yellow","red","cyan","yellow"]),
      empty("b8"),
    ],
  },
  // 第 39 关
  {
    id: 39,
    title: "双重战略缓冲",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["yellow","red","cyan","blue"]),
      normal("b2", ["orange","cyan","yellow","red"]),
      normal("b3", ["green","orange","orange","purple"]),
      normal("b4", ["blue","orange","blue","green"]),
      normal("b5", ["red","green","red","purple"]),
      normal("b6", ["cyan","yellow","purple","cyan"]),
      normal("b7", ["yellow","purple","green","blue"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 40 关
  {
    id: 40,
    title: "阶梯订单狂潮",
    optimalSteps: 15,
    difficulty: "hard",
    bottles: [
      masked("b1", ["cyan","red","cyan","cyan"], 1),
      normal("b2", ["blue","blue","blue","yellow"]),
      normal("b3", ["orange","green","green","blue"]),
      normal("b4", ["yellow","red","orange","red"]),
      normal("b5", ["purple","orange","yellow","yellow"]),
      normal("b6", ["red","purple","purple","purple"]),
      normal("b7", ["green","cyan","orange","green"]),
      empty("b8"),
    ],
  },
  // 第 41 关
  {
    id: 41,
    title: "三排雏形初现",
    optimalSteps: 19,
    difficulty: "hard",
    bottles: [
      normal("b1", ["red","purple","purple","yellow"]),
      normal("b2", ["cyan","blue","cyan","cyan"]),
      normal("b3", ["green","orange","green","orange"]),
      normal("b4", ["red","purple","red","orange"]),
      normal("b5", ["blue","yellow","yellow","blue"]),
      normal("b6", ["cyan","red","blue","orange"]),
      normal("b7", ["yellow","green","green","purple"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 42 关
  {
    id: 42,
    title: "多行交织规划",
    optimalSteps: 21,
    difficulty: "hard",
    bottles: [
      masked("b1", ["green","blue","cyan","red"], 1),
      normal("b2", ["orange","orange","red","cyan"]),
      normal("b3", ["blue","blue","cyan","yellow"]),
      normal("b4", ["purple","orange","purple","yellow"]),
      normal("b5", ["red","green","purple","yellow"]),
      normal("b6", ["purple","yellow","green","cyan"]),
      normal("b7", ["red","blue","orange","green"]),
      empty("b8"),
    ],
  },
  // 第 43 关
  {
    id: 43,
    title: "广袤空间周转",
    optimalSteps: 22,
    difficulty: "hard",
    bottles: [
      normal("b1", ["green","cyan","blue","purple"]),
      normal("b2", ["blue","blue","yellow","green"]),
      normal("b3", ["green","orange","purple","cyan"]),
      normal("b4", ["yellow","purple","blue","red"]),
      normal("b5", ["cyan","orange","green","orange"]),
      normal("b6", ["purple","red","orange","red"]),
      normal("b7", ["cyan","yellow","red","yellow"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 44 关
  {
    id: 44,
    title: "高熵绝境逢生",
    optimalSteps: 22,
    difficulty: "master",
    bottles: [
      masked("b1", ["purple","cyan","orange","yellow"], 1),
      normal("b2", ["orange","green","blue","blue"]),
      normal("b3", ["orange","cyan","yellow","cyan"]),
      normal("b4", ["orange","cyan","purple","green"]),
      normal("b5", ["red","purple","red","green"]),
      normal("b6", ["yellow","blue","yellow","red"]),
      normal("b7", ["green","red","purple","blue"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 45 关
  {
    id: 45,
    title: "巅峰对决前夕",
    optimalSteps: 22,
    difficulty: "master",
    bottles: [
      normal("b1", ["orange","orange","orange","blue"]),
      normal("b2", ["blue","purple","cyan","green"]),
      normal("b3", ["yellow","red","green","purple"]),
      normal("b4", ["purple","green","yellow","blue"]),
      normal("b5", ["green","yellow","red","cyan"]),
      normal("b6", ["cyan","yellow","cyan","purple"]),
      normal("b7", ["orange","red","blue","red"]),
      empty("b8"),
      videoEmpty("b9"),
    ],
  },
  // 第 46 关
  {
    id: 46,
    title: "满屏高熵启幕",
    optimalSteps: 24,
    difficulty: "master",
    bottles: [
      videoEmpty("b1"),
      masked("b2", ["orange","orange","orange","pink"], 1),
      normal("b3", ["blue","purple","yellow","cyan"]),
      normal("b4", ["purple","red","purple","orange"]),
      normal("b5", ["blue","yellow","pink","cyan"]),
      normal("b6", ["cyan","blue","pink","purple"]),
      normal("b7", ["pink","green","cyan","green"]),
      normal("b8", ["green","red","red","yellow"]),
      normal("b9", ["blue","red","yellow","green"]),
      empty("b10"),
      empty("b11"),
      videoEmpty("b12"),
    ],
  },
  // 第 47 关
  {
    id: 47,
    title: "二十一瓶阵列",
    optimalSteps: 28,
    difficulty: "master",
    bottles: [
      videoEmpty("b1"),
      masked("b2", ["yellow","red","green","pink"], 1),
      normal("b3", ["pink","blue","yellow","orange"]),
      normal("b4", ["pink","blue","red","purple"]),
      normal("b5", ["cyan","blue","red","purple"]),
      normal("b6", ["cyan","orange","green","cyan"]),
      normal("b7", ["orange","green","blue","yellow"]),
      normal("b8", ["cyan","red","green","purple"]),
      normal("b9", ["yellow","purple","orange","pink"]),
      empty("b10"),
      empty("b11"),
      videoEmpty("b12"),
    ],
  },
  // 第 48 关
  {
    id: 48,
    title: "三阶布帘锁阵",
    optimalSteps: 25,
    difficulty: "master",
    bottles: [
      videoEmpty("b1"),
      masked("b2", ["yellow","blue","red","orange"], 1),
      normal("b3", ["cyan","green","blue","purple"]),
      normal("b4", ["red","red","blue","purple"]),
      normal("b5", ["yellow","green","purple","cyan"]),
      normal("b6", ["pink","blue","cyan","pink"]),
      normal("b7", ["yellow","cyan","pink","green"]),
      normal("b8", ["purple","orange","orange","red"]),
      normal("b9", ["pink","yellow","green","orange"]),
      empty("b10"),
      empty("b11"),
      videoEmpty("b12"),
    ],
  },
  // 第 49 关
  {
    id: 49,
    title: "高熵混沌破局",
    optimalSteps: 27,
    difficulty: "master",
    bottles: [
      videoEmpty("b1"),
      masked("b2", ["yellow","cyan","cyan","red"], 1),
      normal("b3", ["purple","blue","green","blue"]),
      normal("b4", ["orange","pink","red","cyan"]),
      normal("b5", ["red","yellow","orange","yellow"]),
      normal("b6", ["red","purple","blue","yellow"]),
      normal("b7", ["orange","pink","purple","green"]),
      normal("b8", ["orange","cyan","pink","green"]),
      normal("b9", ["green","purple","blue","pink"]),
      empty("b10"),
      empty("b11"),
      videoEmpty("b12"),
    ],
  },
  // 第 50 关
  {
    id: 50,
    title: "满屏高熵终极巅峰",
    optimalSteps: 27,
    difficulty: "master",
    bottles: [
      videoEmpty("b1"),
      masked("b2", ["purple","blue","green","pink"], 1),
      normal("b3", ["blue","orange","purple","red"]),
      normal("b4", ["orange","red","yellow","red"]),
      normal("b5", ["green","yellow","pink","orange"]),
      normal("b6", ["purple","pink","pink","green"]),
      normal("b7", ["cyan","orange","cyan","yellow"]),
      normal("b8", ["yellow","cyan","green","blue"]),
      normal("b9", ["purple","cyan","red","blue"]),
      empty("b10"),
      empty("b11"),
      videoEmpty("b12"),
    ],
  },
];
