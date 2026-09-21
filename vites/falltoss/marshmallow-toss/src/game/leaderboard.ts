import { BOARD_DEFS } from './constants';
import type { ScoreEntry, Scores } from './types';

const SKEY = 'marshmallowTossScoresV2';

export const modeKey = (t: number, hard: boolean): string => `${t}|${hard ? 'expert' : 'novice'}`;
export const modeLabel = (hard: boolean): string => (hard ? 'Expert' : 'Novice');

function defaultScores(): Scores {
  // XYZ placeholders with beatable times (all under that target's clock)
  const times: Record<number, number[]> = { 5: [15, 19, 23], 8: [19, 24, 28], 12: [30, 37, 43] };
  const out: Scores = {};
  for (const d of BOARD_DEFS) {
    out[modeKey(d.t, d.hard)] = times[d.t].map((t) => ({ i: 'XYZ', t }));
  }
  return out;
}

let SCORES: Scores = defaultScores();

export function loadScores(): void {
  let hadStored = false;
  try {
    const raw = localStorage.getItem(SKEY);
    if (raw) {
      SCORES = JSON.parse(raw) as Scores;
      hadStored = true;
    }
  } catch {
    /* storage blocked — fall back to in-memory defaults */
  }
  for (const d of BOARD_DEFS) {
    const k = modeKey(d.t, d.hard);
    if (!Array.isArray(SCORES[k])) SCORES[k] = [];
  }
  if (!hadStored) saveScores();
}

export function saveScores(): void {
  try {
    localStorage.setItem(SKEY, JSON.stringify(SCORES));
  } catch {
    /* storage blocked — keep scores for this session only */
  }
}

export function getBoard(key: string): ScoreEntry[] {
  return SCORES[key] ?? [];
}

export function qualifies(key: string, t: number): boolean {
  const b = SCORES[key] ?? [];
  return b.length < 3 || t < b[b.length - 1].t;
}

export function insertScore(key: string, initials: string, t: number): number {
  const b = (SCORES[key] ?? []).slice();
  const entry: ScoreEntry = { i: initials, t };
  b.push(entry);
  b.sort((a, c) => a.t - c.t);
  const nb = b.slice(0, 3);
  SCORES[key] = nb;
  saveScores();
  return nb.indexOf(entry);
}
