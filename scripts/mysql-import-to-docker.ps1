# Import .sql into Docker Compose service `db`
# Usage (from repo root): powershell -ExecutionPolicy Bypass -File scripts/mysql-import-to-docker.ps1 -DumpPath .\dump.sql [-RecreateDatabase]

param(
  [Parameter(Mandatory = $true)]
  [string] $DumpPath,
  [switch] $RecreateDatabase
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Test-Path -LiteralPath $DumpPath)) {
  Write-Error "File not found: $DumpPath"
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "docker not found"
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker daemon not running"
}

if (Test-Path .env) {
  Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $k = $matches[1].Trim()
      $v = $matches[2].Trim().Trim([char]34)
      [Environment]::SetEnvironmentVariable($k, $v, "Process")
    }
  }
}

if (-not $env:MYSQL_ROOT_PASSWORD) {
  Write-Error "MYSQL_ROOT_PASSWORD missing in .env"
}

$db = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "mawell_buffet" }
$cid = docker compose ps -q db
if (-not $cid) {
  Write-Error "db container not running (docker compose up -d db)"
}

Write-Host "[import] copy dump into container..."
docker cp -- $DumpPath "${cid}:/tmp/mawell_import.sql"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$p = $env:MYSQL_ROOT_PASSWORD
if ($RecreateDatabase) {
  Write-Warning "[import] DROP + CREATE $db (Docker DB data for this DB name is replaced)"
  $drop = "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  docker compose exec -T -e "MYSQL_PWD=$p" db mysql -uroot -e $drop
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "[import] mysql source /tmp/mawell_import.sql -> $db"
docker compose exec -T -e "MYSQL_PWD=$p" db mysql --default-character-set=utf8mb4 $db -e "source /tmp/mawell_import.sql"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker compose exec -T db rm -f /tmp/mawell_import.sql
Write-Host "[import] done"
