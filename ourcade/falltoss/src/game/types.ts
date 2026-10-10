export interface ScoreEntry {
  i: string;
  score: number;
}

export type GameLevel = 'beginner' | 'advanced' | 'expert';
export type AttemptOutcome = 'made' | 'missed';

export interface FinishResult {
  score: number;
  level: GameLevel;
}

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onAttempts: (attempts: AttemptOutcome[]) => void;
  onTick: (secondsLeft: number) => void;
  onStatus: (text: string) => void;
  onFinish: (result: FinishResult) => void;
}

export interface GameEngine {
  start: (level: GameLevel) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  destroy: () => void;
}

export type Screen = 'menu' | 'playing' | 'end';
