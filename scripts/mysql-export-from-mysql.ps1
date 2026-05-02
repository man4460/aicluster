# Export ฐาน mawell_buffet จาก MySQL ต้นทาง (เช่น บน Windows ที่พอร์ต 3306) เป็นไฟล์ .sql
# ต้องมี mysqldump ใน PATH (ติดตั้ง MySQL Client / XAMPP / MariaDB)
# ใช้: จาก root โปรเจกต์
#   powershell -ExecutionPolicy Bypass -File scripts/mysql-export-from-mysql.ps1
#   powershell ... -SourcePort 3306 -OutPath .\mawell_buffet_backup.sql
#
# จากนั้นนำเข้า Docker:
#   powershell ... -File scripts/mysql-import-to-docker.ps1 -DumpPath .\mawell_buffet_backup.sql -RecreateDatabase

param(
  [string] $SourceHost = "127.0.0.1",
  [int] $SourcePort = 3306,
  [string] $SourceUser = "root",
  [string] $SourcePassword = "",
  [string] $Database = "mawell_buffet",
  [string] $OutPath = ".\mawell_buffet_dump.sql"
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
  Write-Error "ไม่พบ mysqldump — ติดตั้ง MySQL Client หรือเพิ่ม bin ของ MySQL/XAMPP เข้า PATH"
}

if (-not $SourcePassword) {
  $secure = Read-Host -AsSecureString "รหัส MySQL ต้นทาง (user $SourceUser)"
  $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $SourcePassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
  } finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
  }
}

$env:MYSQL_PWD = $SourcePassword
try {
  Write-Host "[export] $SourceHost`:$SourcePort / $Database -> $OutPath"
  $dumpArgs = @(
    "-h", $SourceHost, "-P", "$SourcePort", "-u", $SourceUser,
    "--single-transaction", "--routines", "--triggers",
    "--set-gtid-purged=OFF", "--column-statistics=0",
    $Database
  )
  & mysqldump @dumpArgs > $OutPath
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $OutPath -ErrorAction SilentlyContinue
    exit $LASTEXITCODE
  }
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

Write-Host "[export] เสร็จ — ขั้นต่อไป: scripts/mysql-import-to-docker.ps1 -DumpPath $OutPath -RecreateDatabase"
