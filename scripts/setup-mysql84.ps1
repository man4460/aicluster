# Setup MySQL Server 8.4 as Windows service on port 3306
$ErrorActionPreference = "Stop"
$mysqlRoot = "C:\Program Files\MySQL\MySQL Server 8.4"
$mysqld = Join-Path $mysqlRoot "bin\mysqld.exe"
$mysql = Join-Path $mysqlRoot "bin\mysql.exe"
$basedir = $mysqlRoot
$datadir = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"
$iniDir = "C:\ProgramData\MySQL\MySQL Server 8.4"
$ini = Join-Path $iniDir "my.ini"
$serviceName = "MySQL84"
$rootPassword = "4460"
$dbName = "mawell_buffet"

Write-Host "== Stop MySQL93 (free port 3306) =="
Stop-Service -Name "MySQL93" -Force -ErrorAction SilentlyContinue
Set-Service -Name "MySQL93" -StartupType Manual -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

if (-not (Test-Path $mysqld)) { throw "mysqld not found: $mysqld" }

New-Item -ItemType Directory -Force -Path $iniDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $iniDir "Uploads") | Out-Null

$iniContent = @"
[client]
port=3306

[mysql]
no-beep

[mysqld]
basedir="$($basedir -replace '\\','/')"
datadir="$($datadir -replace '\\','/')"
port=3306
secure-file-priv="$($iniDir -replace '\\','/')/Uploads"
default_authentication_plugin=caching_sha2_password
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
"@
Set-Content -Path $ini -Value $iniContent -Encoding ASCII

if (-not (Test-Path (Join-Path $datadir "mysql"))) {
  Write-Host "== Initialize datadir =="
  New-Item -ItemType Directory -Force -Path $datadir | Out-Null
  & $mysqld --defaults-file="$ini" --initialize-insecure --console
  if ($LASTEXITCODE -ne 0) { throw "initialize failed: $LASTEXITCODE" }
} else {
  Write-Host "== Datadir already initialized =="
}

$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "== Install service $serviceName =="
  & $mysqld --install $serviceName --defaults-file="$ini"
  if ($LASTEXITCODE -ne 0) { throw "service install failed: $LASTEXITCODE" }
} else {
  Write-Host "== Service $serviceName already exists =="
}

Set-Service -Name $serviceName -StartupType Automatic
Write-Host "== Start $serviceName =="
Start-Service -Name $serviceName
Start-Sleep -Seconds 4

Write-Host "== Set root password + create database =="
$sql = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';
CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SELECT VERSION() AS version;
SHOW DATABASES;
"@
& $mysql -u root --protocol=TCP -h 127.0.0.1 -e $sql
if ($LASTEXITCODE -ne 0) {
  # first connect may be socket/named-pipe without password
  & $mysql -u root -e $sql
}

Write-Host "== Done =="
Get-Service MySQL84, MySQL93 | Format-Table Name, Status, StartType -AutoSize
& $mysql -u root "-p$rootPassword" --protocol=TCP -h 127.0.0.1 -e "SELECT VERSION();"
