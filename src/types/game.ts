export interface ColorDef {
  id: string;
  name: string;
  hex: string;
  topHex?: string; // lighter shade for 3D top meniscus disk
  shadeHex?: string; // darker shade for cylindrical 3D edge shading
  gradient: string;
  shadow: string;
  symbol: string; // for colorblind mode
  textColor: string;
}

export type Tube = string[]; // array of color IDs, bottom to top. length <= capacity (usually 4)

export interface Move {
  from: number; // tube index
  to: number;   // tube index
  colorId: string;
  count: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface Level {
  id: number | string;
  title: string;
  difficulty: Difficulty;
  tubes: Tube[]; // initial configuration
  optimalSteps?: number;
  description?: string;
  isCustom?: boolean;
}

export interface SolverResult {
  solvable: boolean;
  optimalSteps: number;
  moves: Move[];
  visitedNodes: number;
  timeMs: number;
  reason?: string;
}

export interface PlayerStats {
  completedLevels: Record<string, { stars: number; bestSteps: number; completedAt: string }>;
  dailyChallengeCompleted: Record<string, { stars: number; steps: number }>;
  hintsUsedTotal: number;
  totalPours: number;
}
