import type { GameLevel } from './types';

// logical play-space
export const LW = 1000;
export const LH = 620;

// physics
export const GRAV = 1500;
export const MAXDRAG = 250;
export const MAXPOWER = 1500;

// slingshot pouch rest point
export const ANCHOR = { x: 180, y: 452 };

// Mug target geometry. rimRx/rimRy define the (invisible) scoring ring.
// cx = center of travel; amp/omega drive the Advanced/Expert glide.
export const MUG = {
  cx: 710,
  rimY: 300,
  rimRx: 78,
  rimRy: 24,
  bodyH: 150,
  amp: 120,
  omega: 1.5,
};

// ---------------------------------------------------------------------------
// MUG ART: drop a transparent PNG at  public/mug.png  and it replaces the
// placeholder automatically (no rebuild needed with `npm run dev`).
// Line the opening up with the scoring ring using these three knobs:
//   drawW     – width to draw your image, in play units (ring is ~156 wide)
//   openXFrac – where the cup opening sits ACROSS your art (0=left … 1=right)
//   openYFrac – where the cup opening sits DOWN your art   (0=top  … 1=bottom)
// The point (openXFrac, openYFrac) in your image is pinned to (mug.x, rimY).
// If dunks land above the drawn opening, raise openYFrac; if off to a side,
// nudge openXFrac; if the opening is a different size, tweak MUG.rimRx/rimRy.
// ---------------------------------------------------------------------------
export const MUG_PLACEMENT = { drawW: 300, openXFrac: 0.5, openYFrac: 0.2 };

export interface LevelDefinition {
  label: string;
  movingMug: boolean;
  showTrajectory: boolean;
  background: [string, string];
  accent: string;
}

export const LEVELS: Record<GameLevel, LevelDefinition> = {
  beginner: {
    label: 'Beginner',
    movingMug: false,
    showTrajectory: true,
    background: ['#F4D45A', '#C8922F'],
    accent: '#F4D45A',
  },
  advanced: {
    label: 'Advanced',
    movingMug: true,
    showTrajectory: true,
    background: ['#F28C28', '#A84320'],
    accent: '#F28C28',
  },
  expert: {
    label: 'Expert',
    movingMug: true,
    showTrajectory: false,
    background: ['#D94C4C', '#681F2B'],
    accent: '#D94C4C',
  },
};

export const ROUND_SIZE = 15;
export const ROUND_SECONDS = 30;

export const MAKE_WORDS = ['swish!', 'nailed it!', 'perfect dunk!', 'spiced & sunk!', 'cozy shot!'];

export const WIN_MSGS = [
  "You're my pumpkin-spice MVP 🎃",
  'Cozy champion — I knew you had it 🍂',
  "That's my favorite person right there 🍁",
  'Sweet toss, sweeter you 🧡',
  'Warmed my heart and the cocoa 🔥',
  'Absolute autumn legend 🍂',
];

export const TIMEUP_MSGS = [
  'Still the cutest tosser I know 🍁',
  'The clock won, but you win with me 🧡',
  'One more? I love watching you play 🍂',
  "So close — you've got this next time 🎃",
  'My favorite marshmallow partner 🍂',
];

export const LEAF_CHARS = ['🍁', '🍂'];
export const LEAF_COUNT = 16;

export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
