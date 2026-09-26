# GALIGAGA test build

This ZIP contains the current Galigaga Vite project from `LiviesOriginal/tarelab` (`main` branch).

## Run locally

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

The game loads its existing sprite/audio assets from the referenced Galaga GitHub asset host, so internet access is required while testing.


## Current layout/progression

- Logo enlarged and centered.
- SOUND and MENU controls are in the top HUD, outside the gameplay arena.
- Stage display uses `STAGE 01 / SCREEN 1` formatting.
- Stage 01 and 02 have 2 screens each; Stage 03 and onward have 3 screens each.
