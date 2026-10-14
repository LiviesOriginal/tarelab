# The Climb

This is the Vite project for the Climb experience. Its React bundle was
extracted unchanged from the original `climb.html` page to retain the existing
interface and behavior.

## Development and build

```bash
npm install
npm run dev
npm run check
```

The production build is written to `../climb/`, which is served as `/climb/` by
the site's existing static-root deployment. The generated files are tracked
with the site so deployments that publish the repository root include the app.
Run `npm run build` after changing the app source and include the updated
`climb/` output.

The site's `_redirects` preserves `/climb` and `/climb.html` by sending them to
`/climb/`. The service worker is scoped to `/climb/` and precaches the app shell,
bundle, and icon so the experience can load offline after its first visit.
