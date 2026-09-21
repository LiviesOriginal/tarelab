# GALIGO — repo-based graphics build

This Vite build uses the graphics and audio assets from https://github.com/sunny567s35/Galaga_game and wraps them in the GALIGO shell/features requested:

- Welcome/title screen
- 15 total lives carried through the run
- Persistent top-3 high scores in localStorage
- 3-letter initials for new high scores
- Custom game-over messages
- Sound toggle and menu navigation on the play screen
- Mobile drag/touch movement and hold-to-fire
- Keyboard controls for desktop testing
- Stage/screen transitions

The asset URLs point at the repository's `main` branch so the package does not duplicate those binary assets locally.
