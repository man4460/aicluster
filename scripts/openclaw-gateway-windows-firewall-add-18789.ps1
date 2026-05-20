#Requires -RunAsAdministrator
<#
.SYNOPSIS
  เพิ่มกฎ Windows Firewall รับ inbound TCP สำหรับ OpenClaw Gateway (ดีฟอลต์พอร์ต 18789)
.DESCRIPTION
  รันบน **เครื่องที่เป็น OpenClaw Gateway** (ไม่ใช่เครื่อง Next.js) ใน PowerShell แบบ Administrator
.PARAMETER Port
  พอร์ตที่ Gateway ฟัง (ดีฟอลต์ 18789)
.EXAMPLE
  .\scripts\openclaw-gateway-windows-firewall-add-18789.ps1
  .\scripts\openclaw-gateway-windows-firewall-add-18789.ps1 -Port 18789
#>
param(
  [int]$Port = 18789
)

$displayName = "OpenClaw Gateway TCP $Port (Inbound)"
$existing = Get-NetFirewallRule -DisplayName $displayName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "มีกฎชื่อ '$displayName' อยู่แล้ว — ไม่สร้างซ้ำ"
  exit 0
}

New-NetFirewallRule -DisplayName $displayName `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort $Port `
  -Action Allow `
  -Profile Any | Out-Null

Write-Host "สร้างกฎ Firewall แล้ว: $displayName"
Write-Host "จากเครื่องอื่นลอง: Test-NetConnection -ComputerName <IP-gateway> -Port $Port"
