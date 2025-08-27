# Docker Connection Diagnostic Script
Write-Host "========== Docker Connection Diagnostics ==========" -ForegroundColor Cyan

# 1. Check if Docker is running
Write-Host "`n[1] Checking Docker service status..." -ForegroundColor Green
try {
    $dockerInfo = docker info
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running or not responding" -ForegroundColor Red
    Write-Host "  Try restarting Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# 2. Check container status
Write-Host "`n[2] Checking container status..." -ForegroundColor Green
$containers = docker-compose ps --format json
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to get container status" -ForegroundColor Red
    exit 1
}

Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps

# 3. Check container logs
Write-Host "`n[3] Checking container logs..." -ForegroundColor Green
Write-Host "Web container logs:" -ForegroundColor Cyan
docker-compose logs --tail 20 web
Write-Host "`nProxy container logs:" -ForegroundColor Cyan
docker-compose logs --tail 20 proxy

# 4. Check network connectivity
Write-Host "`n[4] Checking network connectivity..." -ForegroundColor Green
Write-Host "Internal port mappings:" -ForegroundColor Cyan
docker port webserver-web-1
docker port webserver-proxy-1

# 5. Check host ports
Write-Host "`n[5] Checking host ports..." -ForegroundColor Green
Write-Host "Checking port 3000 (Node direct):" -ForegroundColor Cyan
try {
    $result3000 = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    if ($result3000.TcpTestSucceeded) {
        Write-Host "✓ Port 3000 is open and responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Port 3000 is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking port 3000: $_" -ForegroundColor Red
}

Write-Host "`nChecking port 3001 (Docker mapped):" -ForegroundColor Cyan
try {
    $result3001 = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue
    if ($result3001.TcpTestSucceeded) {
        Write-Host "✓ Port 3001 is open and responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Port 3001 is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking port 3001: $_" -ForegroundColor Red
}

Write-Host "`nChecking port 443 (HTTPS):" -ForegroundColor Cyan
try {
    $result443 = Test-NetConnection -ComputerName localhost -Port 443 -WarningAction SilentlyContinue
    if ($result443.TcpTestSucceeded) {
        Write-Host "✓ Port 443 is open and responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Port 443 is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking port 443: $_" -ForegroundColor Red
}

# 6. List processes using the ports
Write-Host "`n[6] Checking processes using ports..." -ForegroundColor Green
Write-Host "Processes using port 3000:" -ForegroundColor Cyan
$processes3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}}
$processes3000 | Format-Table -AutoSize

Write-Host "Processes using port 3001:" -ForegroundColor Cyan
$processes3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}}
$processes3001 | Format-Table -AutoSize

Write-Host "Processes using port 443:" -ForegroundColor Cyan
$processes443 = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue | 
    Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, 
        @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess).ProcessName}},
        @{Name="PID";Expression={$_.OwningProcess}}
$processes443 | Format-Table -AutoSize

# 7. Check certificate files
Write-Host "`n[7] Checking certificate files..." -ForegroundColor Green
$certPath = Join-Path (Get-Location) "certs"
$certFiles = Get-ChildItem $certPath -Force -ErrorAction SilentlyContinue
if ($certFiles) {
    Write-Host "Certificate files in $certPath:" -ForegroundColor Cyan
    $certFiles | Format-Table Name, Length, LastWriteTime
    
    # Check certificate content
    if (Test-Path "$certPath\server.crt" -PathType Leaf) {
        $certSize = (Get-Item "$certPath\server.crt").Length
        Write-Host "Certificate file size: $certSize bytes"
        if ($certSize -lt 100) {
            Write-Host "✗ Certificate file appears to be too small or empty" -ForegroundColor Red
        } else {
            Write-Host "✓ Certificate file appears to be valid" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ server.crt file is missing" -ForegroundColor Red
    }
    
    if (Test-Path "$certPath\server.key" -PathType Leaf) {
        $keySize = (Get-Item "$certPath\server.key").Length
        Write-Host "Key file size: $keySize bytes"
        if ($keySize -lt 100) {
            Write-Host "✗ Key file appears to be too small or empty" -ForegroundColor Red
        } else {
            Write-Host "✓ Key file appears to be valid" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ server.key file is missing" -ForegroundColor Red
    }
} else {
    Write-Host "✗ No certificate files found in $certPath" -ForegroundColor Red
}

# 8. Summary and recommendations
Write-Host "`n[8] Diagnosis Summary:" -ForegroundColor Green

if (-not $result3001.TcpTestSucceeded) {
    Write-Host "✗ Docker container on port 3001 is not accessible" -ForegroundColor Red
    Write-Host "  Possible solutions:" -ForegroundColor Yellow
    Write-Host "  1. Restart Docker: docker-compose down && docker-compose up -d --build" -ForegroundColor Yellow
    Write-Host "  2. Check if another process is using port 3001" -ForegroundColor Yellow
    Write-Host "  3. Try changing the port in docker-compose.yml to another port (e.g., 3002)" -ForegroundColor Yellow
} else {
    Write-Host "✓ Docker container on port 3001 is accessible" -ForegroundColor Green
}

if (-not $result443.TcpTestSucceeded) {
    Write-Host "✗ HTTPS proxy on port 443 is not accessible" -ForegroundColor Red
    Write-Host "  Possible solutions:" -ForegroundColor Yellow
    Write-Host "  1. Check if nginx container is running" -ForegroundColor Yellow
    Write-Host "  2. Verify certificate files exist and are readable" -ForegroundColor Yellow
    Write-Host "  3. Check if another process is using port 443" -ForegroundColor Yellow
} else {
    Write-Host "✓ HTTPS proxy on port 443 is accessible" -ForegroundColor Green
}

Write-Host "`n========== End of Diagnostics ==========" -ForegroundColor Cyan
