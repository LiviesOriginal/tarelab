import type { GameLevel, ScoreEntry } from './types';

const SKEY = 'marshmallowTossScoresV5';

type LevelBoards = Record<GameLevel, ScoreEntry[]>;

function defaultScores(): LevelBoards {
  const entries = [5, 4, 3].map((score) => ({ i: 'XYZ', score }));
  return { beginner: entries.slice(), advanced: entries.slice(), expert: entries.slice() };
}

function normalizeScores(entries: unknown): ScoreEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(
      (entry): entry is ScoreEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        'i' in entry &&
        typeof entry.i === 'string' &&
        'score' in entry &&
        typeof entry.score === 'number' &&
        Number.isInteger(entry.score) &&
        entry.score >= 0,
    )
    .map(({ i, score }) => ({ i: i.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'XYZ', score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

let SCORES = defaultScores();

export function loadScores(): void {
  try {
    const raw = localStorage.getItem(SKEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Record<GameLevel, unknown>>;
      SCORES = {
        beginner: normalizeScores(stored.beginner),
        advanced: normalizeScores(stored.advanced),
        expert: normalizeScores(stored.expert),
      };
      return;
    }
    SCORES = defaultScores();
    saveScores();
  } catch {
    SCORES = defaultScores();
  }
}

export function saveScores(): void {
  try {
    localStorage.setItem(SKEY, JSON.stringify(SCORES));
  } catch {
    /* storage blocked — keep scores for this session only */
  }
}

export function getBoard(level: GameLevel): ScoreEntry[] {
  return SCORES[level];
}

export function qualifies(level: GameLevel, score: number): boolean {
  const board = SCORES[level];
  return board.length < 3 || score > board[board.length - 1].score;
}

export function insertScore(level: GameLevel, initials: string, score: number): number {
  const b = SCORES[level].slice();
  const entry: ScoreEntry = { i: initials, score };
  b.push(entry);
  b.sort((a, c) => c.score - a.score);
  SCORES[level] = b.slice(0, 3);
  saveScores();
  return SCORES[level].indexOf(entry);
}
