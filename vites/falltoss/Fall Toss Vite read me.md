# Marshmallow Toss 🎃 — React + Vite + TypeScript

A cozy fall-themed slingshot game: flick pumpkin-spice marshmallows into the mug
before the clock runs out, and race the leaderboard for the fastest finish.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

Other scripts:

```bash
npm run build     # type-check + production build to /dist
npm run preview   # serve the production build locally
```

## Add your mug art

The mug is a drop-in image. Put a **transparent PNG** at:

```
public/mug.png
```

With `npm run dev` running it loads automatically and replaces the dashed
`mug.png` placeholder — no rebuild. Align the opening with the (invisible)
scoring ring via the knobs in `src/game/constants.ts`:

| knob        | meaning                                                        |
| ----------- | -------------------------------------------------------------- |
| `drawW`     | width to draw the image, in play units (scoring ring is ~156)  |
| `openXFrac` | where the opening sits across your art (0 = left … 1 = right)  |
| `openYFrac` | where the opening sits down your art  (0 = top  … 1 = bottom)  |

The point `(openXFrac, openYFrac)` in your image is pinned to the mug opening,
so dunks land where the art shows. If a make disappears *above* the drawn
opening, raise `openYFrac`; if it's off to a side, nudge `openXFrac`. If your
opening is a different size than the hit zone, tweak `MUG.rimRx` / `MUG.rimRy`
(that's the scoring ring itself).

Note: the built-in whipped cream / pumpkin from earlier versions are **not**
drawn anymore — bake anything you want into your PNG. Steam still rises from the
opening; to remove it, delete the steam-drawing block in
`src/game/engine.ts` (`render()`).

## How it's put together

The canvas game loop stays imperative (that's the right tool for 60fps); the
UI around it is idiomatic React driven by state.

```
src/
  main.tsx            React entry
  App.tsx             screen state + engine bridge + all UI components
  index.css           all styles
  game/
    constants.ts      physics, geometry, colors, copy, mug-placement knobs
    types.ts          shared types
    leaderboard.ts    localStorage-backed top-3 boards (6 categories)
    engine.ts         canvas engine: physics, rendering, slingshot, gliding mug
public/
  mug.png             <- your art goes here
```

**The bridge:** React tells the engine to `start / pause / resume / stop`; the
engine calls back on discrete events (`onScore`, `onFinish`) and ticks the clock
once per second (`onTick`) so React isn't re-rendering every frame.

## Gameplay

- **Difficulty** — Novice (mug stays put) or Expert (mug glides side to side +
  red background). Both show the aim arc.
- **Target** — 5 / 8 / 12 dunks, which also sets the clock (25 / 30 / 45s).
- **Leaderboard** — top-3 fastest finishes per target × difficulty (6 boards),
  saved in the browser via `localStorage`. Beat a time to enter 3 initials.

## Scores & privacy

High scores live in your browser's `localStorage` under `marshmallowTossScoresV2`
— no server, no account. They persist on the same browser/device and reset if
you clear site data or use a different browser. If storage is unavailable, the
game falls back to in-memory scores for the session.
