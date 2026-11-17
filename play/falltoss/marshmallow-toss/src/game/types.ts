export interface ScoreEntry {
  i: string;
  t: number;
}

export type Scores = Record<string, ScoreEntry[]>;

export interface BoardDef {
  t: number;
  hard: boolean;
}

export interface GameConfig {
  target: number;
  hard: boolean;
  timeLimit: number;
}

export interface FinishResult {
  won: boolean;
  finishTime: number;
  score: number;
  target: number;
  hard: boolean;
}

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onTick: (secondsLeft: number) => void;
  onStatus: (text: string) => void;
  onFinish: (result: FinishResult) => void;
}

export interface GameEngine {
  start: (cfg: GameConfig) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  destroy: () => void;
}

export type Screen = 'menu' | 'playing' | 'end';
