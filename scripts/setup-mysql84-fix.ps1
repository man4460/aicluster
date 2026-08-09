# Fix MySQL 8.4: remove invalid option, re-init empty system schema, start service
$ErrorActionPreference = "Continue"
$logPath = "C:\Users\MAN\Desktop\ProjectAi\Ai Cluster\scripts\setup-mysql84.log"
function Log($msg) {
  $line = "$(Get-Date -Format o) $msg"
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$mysql = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
$iniDir = "C:\ProgramData\MySQL\MySQL Server 8.4"
$ini = Join-Path $iniDir "my.ini"
$datadir = Join-Path $iniDir "Data"
$serviceName = "MySQL84"
$rootPassword = "4460"
$dbName = "mawell_buffet"
$initLog = Join-Path $iniDir "initialize.log"

Set-Content -Path $logPath -Value "=== MySQL84 fix reinit v2 ===" -Encoding UTF8

try {
  Log "Stop services"
  Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
  Stop-Service -Name "MySQL93" -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2

  Log "Write my.ini (8.4 compatible)"
  @"
[client]
port=3306

[mysql]
no-beep

[mysqld]
basedir="C:/Program Files/MySQL/MySQL Server 8.4"
datadir="C:/ProgramData/MySQL/MySQL Server 8.4/Data"
port=3306
secure-file-priv="C:/ProgramData/MySQL/MySQL Server 8.4/Uploads"
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
"@ | Set-Content -Path $ini -Encoding ASCII

  Log "Remove broken datadir and re-initialize"
  if (Test-Path $datadir) {
    Remove-Item -LiteralPath $datadir -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $datadir | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $iniDir "Uploads") | Out-Null

  # Path has spaces — quote via cmd.exe for reliable parsing
  $cmd = "`"$mysqld`" --defaults-file=`"$ini`" --initialize-insecure --console"
  Log "Running: $cmd"
  cmd /c "$cmd > `"$initLog`" 2>&1"
  $initExit = $LASTEXITCODE
  Log "initialize exit=$initExit"
  if (Test-Path $initLog) { Get-Content $initLog -Tail 40 | ForEach-Object { Log $_ } }
  if ($initExit -ne 0) { throw "initialize failed: $initExit" }

  if (-not (Test-Path (Join-Path $datadir "mysql"))) {
    throw "mysql system schema missing after initialize"
  }
  $mysqlFiles = @(Get-ChildItem (Join-Path $datadir "mysql") -ErrorAction SilentlyContinue)
  Log "System schema files: $($mysqlFiles.Count)"
  if ($mysqlFiles.Count -lt 1) { throw "mysql system schema empty" }

  Log "Start $serviceName"
  Start-Service -Name $serviceName -ErrorAction Stop
  Start-Sleep -Seconds 6
  $svc = Get-Service $serviceName
  Log "Status: $($svc.Status)"
  if ($svc.Status -ne "Running") { throw "Service failed to start" }

  $sql = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword'; CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES; SELECT VERSION() AS version;"
  Log "Set password + create DB"
  $r1 = & $mysql -u root --protocol=TCP -h 127.0.0.1 -e $sql 2>&1 | Out-String
  Log $r1
  if ($LASTEXITCODE -ne 0) {
    $r1b = & $mysql -u root -e $sql 2>&1 | Out-String
    Log $r1b
  }

  $r2 = & $mysql -u root "-p$rootPassword" --protocol=TCP -h 127.0.0.1 -N -e "SELECT VERSION(); SHOW DATABASES LIKE '$dbName';" 2>&1 | Out-String
  Log "VERIFY:`n$r2"
  if ($r2 -notmatch "8\.4") { throw "Verify failed" }
  Log "DONE OK"
  exit 0
} catch {
  Log "ERROR: $($_.Exception.Message)"
  $errFile = Get-ChildItem $datadir -Filter "*.err" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($errFile) {
    Log "---- errlog tail ----"
    Get-Content $errFile.FullName -Tail 40 | ForEach-Object { Log $_ }
  }
  exit 1
}
