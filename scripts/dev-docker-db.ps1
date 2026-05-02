# รัน MySQL ใน Docker แล้วเปิด Next dev บนเครื่อง (hot reload)
# ใช้: npm run dev:docker-db:ps1
# หรือจาก root: powershell -ExecutionPolicy Bypass -File scripts/dev-docker-db.ps1
#
# ก่อนรันครั้งแรก: คัดลอก env.local.docker-db.example เป็น .env.local แล้วแก้ DATABASE_URL ให้ตรงรหัส/พอร์ต

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[dev-docker-db] Starting MySQL (docker compose db)..." -ForegroundColor Cyan
docker compose up -d db --wait
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev-docker-db] If --wait is not supported, run: npm run docker:db  then npm run dev" -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "[dev-docker-db] MySQL ready. Starting Next.js dev..." -ForegroundColor Green
npm run dev
