# Frees ports used by Bradobrei stack: 5173, 9000, 5432, 3000.
# Kills listeners that are NOT Docker/WSL (com.docker.backend, wslrelay, vmmem*, vmcompute).
# Use -StopCompose to run "docker compose down" in bradobrei_party first (releases container ports).

param(
    [switch]$StopCompose
)

$ErrorActionPreference = 'SilentlyContinue'

$ports = @(5173, 9000, 5432, 3000)
$skipExact = @('com.docker.backend', 'wslrelay', 'vmcompute')

$composeDir = Split-Path -Parent $PSScriptRoot
if ($StopCompose) {
    Push-Location -LiteralPath $composeDir
    Write-Host 'docker compose down...'
    docker compose down
    Pop-Location
    Start-Sleep -Seconds 2
}

function Test-SkipProcess {
    param([System.Diagnostics.Process]$proc)
    if (-not $proc) { return $true }
    if ($proc.Id -le 4) { return $true }
    if ($skipExact -contains $proc.ProcessName) { return $true }
    if ($proc.ProcessName -like 'vmmem*') { return $true }
    return $false
}

foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $listeners) {
        $procId = $conn.OwningProcess
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if (Test-SkipProcess $proc) { continue }
        Write-Host "Port $port : stopping $($proc.ProcessName) (PID $procId)"
        Stop-Process -Id $procId -Force
    }
}

Write-Host 'Done.'
