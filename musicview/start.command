#!/bin/bash
set -e
cd "$(dirname "$0")"
printf '\nStarting Retro Room YouTube from:\n%s\n\n' "$PWD"
node verify-image.mjs
if [ ! -d node_modules ]; then
  printf '\nInstalling dependencies...\n'
  npm install
fi
printf '\nStarting Vite on http://127.0.0.1:4173\n\n'
npm run dev
