# ทดสอบ Docker Compose: build + up + HTTP smoke test
# ใช้: จาก root โปรเจกต์ หลังตั้ง .env (MYSQL_ROOT_PASSWORD, AUTH_SECRET)
#   powershell -ExecutionPolicy Bypass -File scripts/docker-verify.ps1
# ถ้าไม่ต้องการล้างคอนเทนเนอร์หลังจบ: $env:DOCKER_VERIFY_KEEP = "1"

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "ไม่พบ docker — ติดตั้ง Docker Desktop แล้วเปิดให้ daemon รันก่อน"
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker daemon ไม่ได้รัน — เปิด Docker Desktop (หรือ OrbStack) แล้วลองใหม่"
}

if (-not $env:MYSQL_ROOT_PASSWORD -or -not $env:AUTH_SECRET) {
  if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
      if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $k = $matches[1].Trim()
        $v = $matches[2].Trim().Trim([char]34)
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
      }
    }
  }
}

if (-not $env:MYSQL_ROOT_PASSWORD -or -not $env:AUTH_SECRET) {
  Write-Error "ตั้ง MYSQL_ROOT_PASSWORD และ AUTH_SECRET ใน .env ที่ root หรือใน session ก่อน"
}

$port = if ($env:APP_PORT) { $env:APP_PORT } else { "3000" }

Write-Host "[docker-verify] docker compose build app …"
docker compose build app
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[docker-verify] docker compose up -d …"
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[docker-verify] รอแอปพร้อม (สูงสุด ~90s) …"
$ok = $false
for ($i = 0; $i -lt 45; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 5
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { $ok = $true; break }
  } catch {
    # ยังไม่พร้อม
  }
}

if (-not $ok) {
  Write-Host "[docker-verify] ล้มเหลว — logs จาก service app:"
  docker compose logs --tail 80 app
  docker compose down
  exit 1
}

Write-Host "[docker-verify] ผ่าน: ได้ HTTP จาก http://127.0.0.1:$port/"

if ($env:DOCKER_VERIFY_KEEP -ne "1") {
  Write-Host "[docker-verify] docker compose down …"
  docker compose down
} else {
  Write-Host "[docker-verify] คอนเทนเนอร์ยังรันอยู่ — หยุดด้วย: docker compose down"
}

exit 0
