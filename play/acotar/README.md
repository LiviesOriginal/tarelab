# A Court of Letters and Guesses

A mobile-first, vanilla Vite word game inspired by Sarah J. Maas's **A Court of Thorns and Roses** universe.

## Stack
- Vite
- Vanilla JavaScript
- CSS
- No React
- No backend
- localStorage for streak/progress

## Look and feel
The gold frame, corner art, moon and star, and castle are transparent WebP images in `src/assets/` (`frame-tl/tr/bl/br.webp`, `castle.webp`). They are drawn behind every screen by `decorMarkup()` in `src/main.js`, and styled at the top of `src/styles.css`.

## How it plays
- One clue per day. The clue is picked by the player's local date, and after the last clue in `src/data.js` the list loops.
- Today's guesses are saved, so refreshing the page can't be used to retry.
- **Victory Streak** is the only stat: days in a row solved before running out of guesses. Running out of guesses resets it to 0 and reveals the answer. Skipping a day does not reset it.
- Every clue that has been played (solved or missed) is added to the archive as "Clue N". The archive never shows answers. Archive replays don't affect the streak.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

The production files are generated in `dist/`.

## GitHub
Upload the project files to a repository. Do not upload `node_modules/`.

## Cloudflare Pages
Use:
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Adding puzzles
Edit `src/data.js`. Every puzzle needs:
- `id`
- `book`
- `answer` (exactly 5 letters)
- `clue`

Keep clues genuinely connected to the answer. The game also has a common five-letter guess dictionary in the same file.

## Important
This is an unofficial fan-made project and is not affiliated with Sarah J. Maas or her publishers. It is designed for personal/fan use and contains spoilers through the currently published ACOTAR books.
