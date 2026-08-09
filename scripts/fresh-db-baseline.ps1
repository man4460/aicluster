# Fresh local DB: push current schema, then mark all migrations applied (baseline).
$ErrorActionPreference = "Stop"
$root = "C:\Users\MAN\Desktop\ProjectAi\Ai Cluster"
Set-Location $root

$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
Write-Host "== Reset database =="
& $mysql -u root -p4460 --protocol=TCP -h 127.0.0.1 -e "DROP DATABASE IF EXISTS mawell_buffet; CREATE DATABASE mawell_buffet CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

Write-Host "== prisma db push =="
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { throw "db push failed" }

Write-Host "== Baseline migrations as applied =="
$dirs = Get-ChildItem ".\prisma\migrations" -Directory | Sort-Object Name
$i = 0
foreach ($d in $dirs) {
  $i++
  Write-Host "[$i/$($dirs.Count)] resolve --applied $($d.Name)"
  npx prisma migrate resolve --applied $d.Name
  if ($LASTEXITCODE -ne 0) { throw "resolve failed for $($d.Name)" }
}

Write-Host "== Seed =="
npm run db:seed
if ($LASTEXITCODE -ne 0) { throw "seed failed" }

Write-Host "== DONE =="
npx prisma migrate status
