# Check virtualization status on Windows
Write-Host "Checking virtualization support..." -ForegroundColor Cyan

# Check if CPU supports virtualization
$cpu = Get-WmiObject Win32_Processor
Write-Host "`nCPU Information:" -ForegroundColor Yellow
Write-Host "  Name: $($cpu.Name)"
Write-Host "  Virtualization Firmware Enabled: $($cpu.VirtualizationFirmwareEnabled)"

# Check Hyper-V status
Write-Host "`nHyper-V Status:" -ForegroundColor Yellow
$hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
Write-Host "  Hyper-V State: $($hyperv.State)"

# Check system info
Write-Host "`nSystem Virtualization Info:" -ForegroundColor Yellow
systeminfo | findstr /C:"Hyper-V"

# Check BIOS settings
Write-Host "`nBIOS Virtualization Settings:" -ForegroundColor Yellow
$vt = (Get-CimInstance -ClassName Win32_ComputerSystem).HypervisorPresent
Write-Host "  Hypervisor Present: $vt"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Diagnosis:" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

if ($cpu.VirtualizationFirmwareEnabled -eq $false) {
    Write-Host "ISSUE: Virtualization is DISABLED in BIOS" -ForegroundColor Red
    Write-Host "ACTION: You need to enable Intel VT-x in BIOS settings" -ForegroundColor Yellow
} elseif ($hyperv.State -eq "Disabled") {
    Write-Host "ISSUE: Hyper-V is disabled in Windows" -ForegroundColor Red
    Write-Host "ACTION: Run PowerShell as Admin and execute:" -ForegroundColor Yellow
    Write-Host "  Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All" -ForegroundColor Cyan
} elseif ($vt -eq $true) {
    Write-Host "SUCCESS: Virtualization is enabled!" -ForegroundColor Green
    Write-Host "NOTE: If Docker still fails, try:" -ForegroundColor Yellow
    Write-Host "  1. Uninstall Docker Desktop completely" -ForegroundColor Cyan
    Write-Host "  2. Restart computer" -ForegroundColor Cyan
    Write-Host "  3. Reinstall Docker Desktop (choose WSL2 backend)" -ForegroundColor Cyan
} else {
    Write-Host "UNKNOWN: Unable to determine status" -ForegroundColor Yellow
}

Write-Host ""
