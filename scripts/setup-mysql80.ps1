# Install MySQL Community Server 8.0.39 as Windows service MySQL80 on port 3306
$ErrorActionPreference = "Continue"
$logPath = "C:\Users\MAN\Desktop\ProjectAi\Ai Cluster\scripts\setup-mysql80.log"
function Log($msg) {
  $line = "$(Get-Date -Format o) $msg"
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

Set-Content -Path $logPath -Value "=== MySQL 8.0.39 setup ===" -Encoding UTF8

$zip = "$env:TEMP\mysql-8.0.39-winx64.zip"
$extractRoot = "$env:TEMP\mysql-8.0.39-extract"
$target = "C:\Program Files\MySQL\MySQL Server 8.0"
$mysqld = Join-Path $target "bin\mysqld.exe"
$mysql = Join-Path $target "bin\mysql.exe"
$iniDir = "C:\ProgramData\MySQL\MySQL Server 8.0"
$ini = Join-Path $iniDir "my.ini"
$datadir = Join-Path $iniDir "Data"
$initLog = Join-Path $iniDir "initialize.log"
$serviceName = "MySQL80"
$rootPassword = "4460"
$dbName = "mawell_buffet"

try {
  if (-not (Test-Path $zip)) { throw "Zip not found: $zip" }

  Log "Stop other MySQL services (free 3306)"
  foreach ($s in @("MySQL84", "MySQL93", "MySQL80")) {
    Stop-Service -Name $s -Force -ErrorAction SilentlyContinue
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
      Set-Service -Name $s -StartupType Manual -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Seconds 2

  if (-not (Test-Path $mysqld)) {
    Log "Extract zip"
    if (Test-Path $extractRoot) { Remove-Item -LiteralPath $extractRoot -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
    Expand-Archive -Path $zip -DestinationPath $extractRoot -Force
    $src = Get-ChildItem $extractRoot -Directory | Where-Object { $_.Name -like "mysql-8.0.39*" } | Select-Object -First 1
    if (-not $src) { throw "Extracted mysql-8.0.39 folder not found" }

    Log "Install files to $target"
    New-Item -ItemType Directory -Force -Path "C:\Program Files\MySQL" | Out-Null
    if (Test-Path $target) { Remove-Item -LiteralPath $target -Recurse -Force }
    Move-Item -LiteralPath $src.FullName -Destination $target
  } else {
    Log "Binaries already present at $target"
  }

  if (-not (Test-Path $mysqld)) { throw "mysqld missing: $mysqld" }
  $ver = & $mysql --version 2>&1 | Out-String
  Log "Client: $ver"

  Log "Write my.ini"
  New-Item -ItemType Directory -Force -Path $iniDir | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $iniDir "Uploads") | Out-Null
  @"
[client]
port=3306

[mysql]
no-beep

[mysqld]
basedir="C:/Program Files/MySQL/MySQL Server 8.0"
datadir="C:/ProgramData/MySQL/MySQL Server 8.0/Data"
port=3306
secure-file-priv="C:/ProgramData/MySQL/MySQL Server 8.0/Uploads"
default_authentication_plugin=caching_sha2_password
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
"@ | Set-Content -Path $ini -Encoding ASCII

  Log "Initialize datadir"
  if (Test-Path $datadir) { Remove-Item -LiteralPath $datadir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $datadir | Out-Null
  $cmd = "`"$mysqld`" --defaults-file=`"$ini`" --initialize-insecure --console"
  Log "Running: $cmd"
  cmd /c "$cmd > `"$initLog`" 2>&1"
  $initExit = $LASTEXITCODE
  if (Test-Path $initLog) { Get-Content $initLog -Tail 30 | ForEach-Object { Log $_ } }
  if ($initExit -ne 0) { throw "initialize failed: $initExit" }
  if (-not (Test-Path (Join-Path $datadir "mysql"))) { throw "system schema missing" }

  $existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($existing) {
    Log "Remove old $serviceName service"
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    & $mysqld --remove $serviceName 2>&1 | ForEach-Object { Log $_ }
    Start-Sleep -Seconds 1
  }

  Log "Install service $serviceName"
  & $mysqld --install $serviceName --defaults-file="$ini" 2>&1 | ForEach-Object { Log $_ }
  Set-Service -Name $serviceName -StartupType Automatic
  Start-Service -Name $serviceName -ErrorAction Stop
  Start-Sleep -Seconds 6
  $svc = Get-Service $serviceName
  Log "Status: $($svc.Status)"
  if ($svc.Status -ne "Running") { throw "Service failed to start" }

  $sql = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';
CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SELECT VERSION() AS version;
"@
  Log "Set root password + create DB"
  $r1 = & $mysql -u root --protocol=TCP -h 127.0.0.1 -e $sql 2>&1 | Out-String
  Log $r1

  $r2 = & $mysql -u root "-p$rootPassword" --protocol=TCP -h 127.0.0.1 -N -e "SELECT VERSION();" 2>&1 | Out-String
  Log "VERIFY: $r2"
  if ($r2 -notmatch "8\.0\.39") { throw "Expected 8.0.39, got: $r2" }
  Log "DONE OK"
  exit 0
} catch {
  Log "ERROR: $($_.Exception.Message)"
  $errFile = Get-ChildItem $datadir -Filter "*.err" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($errFile) { Get-Content $errFile.FullName -Tail 40 | ForEach-Object { Log $_ } }
  exit 1
}
