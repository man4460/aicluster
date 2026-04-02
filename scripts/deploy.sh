#!/usr/bin/env bash
# Deploy บนเครื่องที่รันแอป
# จากโฟลเดอร์อื่น: ~/aicluster/deploy  หรือ  npm link แล้วรัน  mawell-deploy
set -euo pipefail

ROOT="${DEPLOY_PATH:-$HOME/aicluster}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$ROOT"

if [[ ! -f "package.json" ]]; then
  echo "ERROR: ไม่พบ package.json ใน $ROOT — ตั้ง DEPLOY_PATH ให้ชี้โฟลเดอร์ clone ของ repo"
  exit 1
fi

echo ">>> git fetch / reset ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo ">>> npm install"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo ">>> prisma migrate (ถ้ามี migration ใหม่)"
npm run db:migrate

echo ">>> build"
npm run build

echo ">>> pm2 restart"
pm2 restart ecosystem.config.cjs --only mawell-serve --update-env || \
  pm2 start ecosystem.config.cjs --only mawell-serve

echo ">>> done"
