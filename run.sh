#!/bin/zsh
set -ex
tsc --pretty
npx eslint . --ext .ts
npm start