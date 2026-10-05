# Retro Room TV — background fix v1.6

This revision changes **only the background/scene sizing behavior**.

- Uses the exact `Bookcase Photo Edit` source image bundled in `public/Bookcase-Photo-Edit-EXACT-81f1c3ab.png`.
- Explicitly sizes and positions the image in pixels from the source image dimensions so mobile browsers do not apply different `object-fit` rounding/cropping behavior.
- On narrow portrait phones, zooms the scene out slightly so less of the TV is cut off.
- Uses a matching blurred copy of the exact photo behind the reduced mobile crop so the viewport remains filled without black bars.
- The player, playlist parsing, YouTube API logic, and playlist interactions are otherwise unchanged.


## Background assets (derived from the supplied photo)

The desktop and mobile backgrounds are derived only from the supplied `Bookcase Photo Edit.png`.
No AI-generated room imagery is used.

- `public/background-desktop-16x9.jpg` — 1920×1080, source-photo crop/resample.
- `public/background-mobile-9x19_5.jpg` — 1080×2340, the exact source photo centered vertically in a portrait canvas with blurred padding made from the same photo.

The mobile canvas is 9:19.5, matching modern tall-phone proportions more closely than 9:16. It keeps the original TV display fully inside the portrait canvas; the extra vertical canvas is filled with a blurred copy of the same source photo, not generated room content.
