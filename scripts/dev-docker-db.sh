#!/usr/bin/env bash
# รัน MySQL ใน Docker แล้วเปิด Next dev บนเครื่อง
# ใช้จาก root: bash scripts/dev-docker-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[dev-docker-db] Starting MySQL..."
docker compose up -d db --wait
echo "[dev-docker-db] Starting Next.js dev..."
exec npm run dev
