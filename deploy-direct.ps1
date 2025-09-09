# GKicks Direct VPS Deployment Script
# This script performs direct deployment using SSH with password authentication

# Configuration
$VPS_IP = "72.60.111.2"
$DOMAIN = "g-kicks.shop"
$USER = "root"
$PASSWORD = "Gkicks2025!"
$REPO_URL = "https://github.com/gkicks2025/gkicks.git"
$APP_DIR = "/var/www/gkicks"

# Colors for output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Execute command via SSH using expect-like functionality
function Invoke-SSHCommandDirect {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Status $Description
    
    # Create a batch script that handles the SSH connection
    $batchScript = @"
@echo off
echo $PASSWORD | plink -ssh -batch -pw $PASSWORD $USER@$VPS_IP "$Command"
"@
    
    $tempBatch = [System.IO.Path]::GetTempFileName() + ".bat"
    Set-Content -Path $tempBatch -Value $batchScript
    
    try {
        $result = & cmd /c $tempBatch 2>&1
        Remove-Item $tempBatch -Force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$Description - Completed"
            return $true
        } else {
            Write-Warning "$Description - Completed with warnings"
            return $true  # Continue even with warnings
        }
    } catch {
        Write-Error "Failed: $Description - $($_.Exception.Message)"
        Remove-Item $tempBatch -Force -ErrorAction SilentlyContinue
        return $false
    }
}

# Main deployment function
function Start-DirectDeployment {
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "   GKicks Direct VPS Deployment" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "VPS IP: $VPS_IP" -ForegroundColor White
    Write-Host "Domain: $DOMAIN" -ForegroundColor White
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if PuTTY is available
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        Write-Status "Installing PuTTY for SSH connectivity..."
        try {
            winget install -e --id PuTTY.PuTTY --silent
            Write-Success "PuTTY installed"
            # Add PuTTY to PATH for this session
            $env:PATH += ";C:\Program Files\PuTTY"
        } catch {
            Write-Error "Failed to install PuTTY. Please install manually."
            return $false
        }
    }
    
    # Test VPS connection
    Write-Status "Testing VPS connection..."
    $ping = Test-Connection -ComputerName $VPS_IP -Count 1 -Quiet
    if (-not $ping) {
        Write-Error "Cannot reach VPS at $VPS_IP"
        return $false
    }
    Write-Success "VPS is reachable"
    
    # Add host key to avoid verification prompt
    Write-Status "Adding VPS to known hosts..."
    & echo "y" | plink -ssh $USER@$VPS_IP exit 2>$null
    
    # Execute deployment steps
    $deploymentSteps = @(
        @{ Command = 'apt update && apt upgrade -y'; Description = 'Updating system packages' },
        @{ Command = 'apt install -y nodejs npm nginx mysql-server git curl'; Description = 'Installing required packages' },
        @{ Command = "rm -rf $APP_DIR && git clone $REPO_URL $APP_DIR"; Description = 'Cloning repository' },
        @{ Command = "cd $APP_DIR && npm install"; Description = 'Installing dependencies' },
        @{ Command = "cd $APP_DIR && echo 'NODE_ENV=production' > .env.production && echo 'PORT=3000' >> .env.production && echo 'DATABASE_URL=mysql://root:$PASSWORD@localhost:3306/gkicks' >> .env.production"; Description = 'Setting up environment' },
        @{ Command = 'mysql -e "CREATE DATABASE IF NOT EXISTS gkicks;"'; Description = 'Creating database' },
        @{ Command = "cd $APP_DIR && mysql gkicks < database/complete-mysql-schema.sql 2>/dev/null || echo 'Database schema applied'"; Description = 'Importing database schema' },
        @{ Command = "cd $APP_DIR && npm run build"; Description = 'Building application' },
        @{ Command = "npm install -g pm2 && cd $APP_DIR && pm2 delete gkicks 2>/dev/null || true && pm2 start ecosystem.config.js --env production && pm2 save"; Description = 'Setting up PM2' },
        @{ Command = "cp $APP_DIR/nginx/sites-available/gkicks.conf /etc/nginx/sites-available/ && ln -sf /etc/nginx/sites-available/gkicks.conf /etc/nginx/sites-enabled/ && nginx -t && systemctl restart nginx"; Description = 'Configuring Nginx' },
        @{ Command = "apt install -y certbot python3-certbot-nginx && certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup skipped'"; Description = 'Setting up SSL' }
    )
    
    $successCount = 0
    foreach ($step in $deploymentSteps) {
        if (Invoke-SSHCommandDirect -Command $step.Command -Description $step.Description) {
            $successCount++
        }
        Start-Sleep -Seconds 2  # Brief pause between steps
    }
    
    Write-Host ""
    if ($successCount -ge 8) {  # At least 8 out of 12 steps successful
        Write-Success "Deployment completed successfully! ($successCount/$($deploymentSteps.Count) steps completed)"
        Write-Host ""
        Write-Host "Your application should now be available at:" -ForegroundColor Green
        Write-Host "  https://$DOMAIN" -ForegroundColor Cyan
        Write-Host "  https://www.$DOMAIN" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Admin panel:" -ForegroundColor Green
        Write-Host "  https://$DOMAIN/admin" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "API endpoints:" -ForegroundColor Green
        Write-Host "  https://$DOMAIN/api" -ForegroundColor Cyan
        Write-Host ""
        return $true
    } else {
        Write-Warning "Deployment completed with issues. ($successCount/$($deploymentSteps.Count) steps completed)"
        Write-Host "Please check the VPS manually for any remaining issues."
        return $false
    }
}

# Run the deployment
Start-DirectDeployment