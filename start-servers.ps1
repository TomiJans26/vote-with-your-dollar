# VWYD Server Launcher with Auto-Restart
# Usage: powershell -File start-servers.ps1

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectDir "backend"
$frontendDir = Join-Path $projectDir "frontend"

Write-Host "🚀 Starting VWYD servers..." -ForegroundColor Cyan

# Kill any existing instances
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*app.py*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start backend with auto-restart loop
$backendJob = Start-Job -Name "vwyd-backend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    while ($true) {
        Write-Output "[$(Get-Date)] Starting Flask backend..."
        & python app.py 2>&1
        $exitCode = $LASTEXITCODE
        Write-Output "[$(Get-Date)] Backend exited with code $exitCode. Restarting in 3s..."
        Start-Sleep -Seconds 3
    }
} -ArgumentList $backendDir

# Start frontend
$frontendJob = Start-Job -Name "vwyd-frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    while ($true) {
        Write-Output "[$(Get-Date)] Starting Vite dev server..."
        & npm run dev 2>&1
        $exitCode = $LASTEXITCODE
        Write-Output "[$(Get-Date)] Frontend exited with code $exitCode. Restarting in 3s..."
        Start-Sleep -Seconds 3
    }
} -ArgumentList $frontendDir

Write-Host "✅ Backend job: $($backendJob.Id)" -ForegroundColor Green
Write-Host "✅ Frontend job: $($frontendJob.Id)" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
