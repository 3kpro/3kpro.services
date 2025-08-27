# Test connectivity to various endpoints
Write-Host "======= SYSTEM INFO ========" -ForegroundColor Cyan
[System.Environment]::OSVersion
Write-Host ""

Write-Host "======= NODE VERSION =======" -ForegroundColor Cyan
try {
    node --version
} catch {
    Write-Host "Node.js not found or not in PATH" -ForegroundColor Red
}
Write-Host ""

Write-Host "======= TEST LOCAL NODE SERVER =======" -ForegroundColor Cyan
try {
    Write-Host "Testing http://localhost:3000/health..."
    $result = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/health -TimeoutSec 5
    Write-Host "StatusCode: $($result.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($result.Content)" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to local Node server: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "======= TEST DOCKER CONNECTION =======" -ForegroundColor Cyan
try {
    Write-Host "Docker version:"
    docker --version
    
    Write-Host "Docker containers:"
    docker ps
    
    Write-Host "Testing http://localhost:3001/health..."
    try {
        $result = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3001/health -TimeoutSec 5
        Write-Host "StatusCode: $($result.StatusCode)" -ForegroundColor Green
        Write-Host "Content: $($result.Content)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to connect to Docker Node server: $_" -ForegroundColor Red
    }
} catch {
    Write-Host "Docker not found or not running: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "======= TEST HTTPS CONNECTION =======" -ForegroundColor Cyan
try {
    Write-Host "Testing https://localhost/ (insecure)..."
    $result = Invoke-WebRequest -Uri https://localhost -SkipCertificateCheck -TimeoutSec 5
    Write-Host "StatusCode: $($result.StatusCode)" -ForegroundColor Green
    Write-Host "Title: $($result.ParsedHtml.title)" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to HTTPS endpoint: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "======= PROCESSES ON PORTS =======" -ForegroundColor Cyan
Write-Host "Port 3000:" -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}} |
    Format-Table -AutoSize

Write-Host "Port 3001:" -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}} |
    Format-Table -AutoSize

Write-Host "Port 443:" -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}} |
    Format-Table -AutoSize

Write-Host "======= CERTIFICATE FILES =======" -ForegroundColor Cyan
Get-ChildItem .\certs\ -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
