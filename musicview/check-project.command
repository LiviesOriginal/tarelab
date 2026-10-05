#!/bin/bash
set -e
cd "$(dirname "$0")"
printf '\nProject folder:\n%s\n\n' "$PWD"
node verify-image.mjs
printf '\nPackage scripts:\n'
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts,null,2))"
printf '\nIf the verification passed, run: npm install && npm run dev\n'
read -r -p 'Press Enter to close this window...'
