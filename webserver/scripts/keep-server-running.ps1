# Auto-restart script for MemoryLane server
param(
    [int]$CheckIntervalSeconds = 30
)

Write-Host "Starting MemoryLane server monitor..." -ForegroundColor Green
Set-Location 'C:\Users\mark\OneDrive\3KPRO\Workspace\GitHub\3kpro.services\webserver'

while ($true) {
    try {
        # Test if server is responding
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): Server is healthy ✅" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): Server not responding, restarting..." -ForegroundColor Yellow
        
        # Kill any existing node processes
        Get-Process | Where-Object { $_.ProcessName -match 'node' } | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped existing Node processes" -ForegroundColor Yellow
        
        # Wait a moment
        Start-Sleep -Seconds 3
        
        # Start server in background
        Write-Host "Starting new server..." -ForegroundColor Yellow
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"
        
        # Wait for startup
        Start-Sleep -Seconds 10
        Write-Host "Server restart complete" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds $CheckIntervalSeconds
}
