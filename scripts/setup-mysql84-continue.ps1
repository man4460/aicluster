# Continue MySQL 8.4 service setup (datadir already initialized)
$ErrorActionPreference = "Continue"
$logPath = "C:\Users\MAN\Desktop\ProjectAi\Ai Cluster\scripts\setup-mysql84.log"
function Log($msg) {
  $line = "$(Get-Date -Format o) $msg"
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$mysql = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
$ini = "C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"
$serviceName = "MySQL84"
$rootPassword = "4460"
$dbName = "mawell_buffet"

try {
  Set-Content -Path $logPath -Value "=== MySQL84 continue setup ===" -Encoding UTF8
  Log "Stop MySQL93 if running"
  Stop-Service -Name "MySQL93" -Force -ErrorAction SilentlyContinue
  Set-Service -Name "MySQL93" -StartupType Manual -ErrorAction SilentlyContinue

  $svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if (-not $svc) {
    Log "Installing service $serviceName"
    $out = & $mysqld --install $serviceName --defaults-file="$ini" 2>&1 | Out-String
    Log $out
  } else {
    Log "Service already exists: $($svc.Status)"
  }

  # Ensure service runs as NetworkService like MySQL93 (optional; default LocalSystem is fine)
  Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
  Log "Starting $serviceName"
  Start-Service -Name $serviceName -ErrorAction Stop
  Start-Sleep -Seconds 5
  $svc = Get-Service -Name $serviceName
  Log "Service status: $($svc.Status)"

  if ($svc.Status -ne "Running") {
    throw "Service not running"
  }

  Log "Configure root password and database"
  $sql = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';
CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '$rootPassword';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SELECT VERSION() AS version;
SHOW DATABASES;
"@
  $result = & $mysql -u root --protocol=TCP -h 127.0.0.1 -e $sql 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    Log "TCP login failed, trying default socket/pipe"
    $result = & $mysql -u root -e $sql 2>&1 | Out-String
  }
  Log $result

  # Verify with password
  $verify = & $mysql -u root "-p$rootPassword" --protocol=TCP -h 127.0.0.1 -e "SELECT VERSION() AS v; SHOW DATABASES LIKE '$dbName';" 2>&1 | Out-String
  Log "VERIFY:`n$verify"
  Log "DONE OK"
} catch {
  Log "ERROR: $($_.Exception.Message)"
  Log ($_ | Out-String)
  exit 1
}
