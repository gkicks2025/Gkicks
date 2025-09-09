#!/bin/bash

# GKicks Cron Setup Script
# This script sets up automated backup and monitoring tasks

set -e

# Configuration
APP_DIR="/var/www/gkicks"
SCRIPTS_DIR="$APP_DIR/scripts"
LOG_DIR="/var/log"
USER="www-data"  # Change this to your application user

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Make scripts executable
make_scripts_executable() {
    log_info "Making scripts executable..."
    
    local scripts=(
        "$SCRIPTS_DIR/backup.sh"
        "$SCRIPTS_DIR/monitor.sh"
        "$SCRIPTS_DIR/production-db-setup.js"
        "$SCRIPTS_DIR/deploy.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            log_success "Made $script executable"
        else
            log_warning "Script not found: $script"
        fi
    done
}

# Create log rotation configuration
setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/gkicks << 'EOF'
/var/log/gkicks-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Restart PM2 processes to reopen log files
        if command -v pm2 >/dev/null 2>&1; then
            su - www-data -c "pm2 reloadLogs" >/dev/null 2>&1 || true
        fi
    endscript
}

/var/www/gkicks/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    copytruncate
}
EOF
    
    log_success "Log rotation configuration created"
}

# Setup cron jobs
setup_cron_jobs() {
    log_info "Setting up cron jobs..."
    
    # Create temporary cron file
    local temp_cron="/tmp/gkicks_cron_temp"
    
    # Get existing cron jobs for the user (if any)
    crontab -u "$USER" -l 2>/dev/null > "$temp_cron" || echo "# GKicks Cron Jobs" > "$temp_cron"
    
    # Remove existing GKicks cron jobs
    grep -v "# GKicks" "$temp_cron" > "${temp_cron}.clean" 2>/dev/null || echo "" > "${temp_cron}.clean"
    mv "${temp_cron}.clean" "$temp_cron"
    
    # Add new cron jobs
    cat >> "$temp_cron" << EOF

# GKicks Application Cron Jobs
# Backup database and files daily at 2:00 AM
0 2 * * * $SCRIPTS_DIR/backup.sh >> $LOG_DIR/gkicks-backup.log 2>&1

# Monitor application every 5 minutes
*/5 * * * * $SCRIPTS_DIR/monitor.sh >> $LOG_DIR/gkicks-monitor.log 2>&1

# Generate detailed monitoring report daily at 8:00 AM
0 8 * * * $SCRIPTS_DIR/monitor.sh --email-report >> $LOG_DIR/gkicks-monitor.log 2>&1

# Clean up old log files weekly (Sunday at 3:00 AM)
0 3 * * 0 find $LOG_DIR -name "gkicks-*.log.*" -mtime +30 -delete

# Check SSL certificate expiry monthly (1st day at 9:00 AM)
0 9 1 * * openssl s_client -servername \$(echo "\$APP_URL" | sed 's|https\\?://||' | cut -d'/' -f1) -connect \$(echo "\$APP_URL" | sed 's|https\\?://||' | cut -d'/' -f1):443 2>/dev/null | openssl x509 -noout -dates | grep notAfter

# Restart PM2 processes weekly (Sunday at 4:00 AM) to prevent memory leaks
0 4 * * 0 /usr/bin/pm2 restart all >> $LOG_DIR/gkicks-restart.log 2>&1

# Update system packages monthly (1st day at 5:00 AM)
0 5 1 * * apt update && apt upgrade -y >> $LOG_DIR/system-update.log 2>&1
EOF
    
    # Install the new cron jobs
    crontab -u "$USER" "$temp_cron"
    
    # Clean up
    rm "$temp_cron"
    
    log_success "Cron jobs installed for user: $USER"
}

# Create systemd service for monitoring (alternative to cron)
create_systemd_service() {
    log_info "Creating systemd service for monitoring..."
    
    # Create service file
    cat > /etc/systemd/system/gkicks-monitor.service << EOF
[Unit]
Description=GKicks Application Monitor
After=network.target mysql.service nginx.service

[Service]
Type=oneshot
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPTS_DIR/monitor.sh
StandardOutput=append:$LOG_DIR/gkicks-monitor.log
StandardError=append:$LOG_DIR/gkicks-monitor.log
EOF
    
    # Create timer file
    cat > /etc/systemd/system/gkicks-monitor.timer << EOF
[Unit]
Description=Run GKicks Monitor every 5 minutes
Requires=gkicks-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # Create backup service
    cat > /etc/systemd/system/gkicks-backup.service << EOF
[Unit]
Description=GKicks Application Backup
After=network.target mysql.service

[Service]
Type=oneshot
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPTS_DIR/backup.sh
StandardOutput=append:$LOG_DIR/gkicks-backup.log
StandardError=append:$LOG_DIR/gkicks-backup.log
EOF
    
    # Create backup timer
    cat > /etc/systemd/system/gkicks-backup.timer << EOF
[Unit]
Description=Run GKicks Backup daily at 2:00 AM
Requires=gkicks-backup.service

[Timer]
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # Reload systemd and enable timers
    systemctl daemon-reload
    systemctl enable gkicks-monitor.timer
    systemctl enable gkicks-backup.timer
    systemctl start gkicks-monitor.timer
    systemctl start gkicks-backup.timer
    
    log_success "Systemd services and timers created and enabled"
}

# Setup fail2ban for security
setup_fail2ban() {
    log_info "Setting up Fail2ban for additional security..."
    
    if ! command -v fail2ban-server >/dev/null 2>&1; then
        log_info "Installing Fail2ban..."
        apt update
        apt install -y fail2ban
    fi
    
    # Create custom jail for the application
    cat > /etc/fail2ban/jail.d/gkicks.conf << EOF
[gkicks-auth]
enabled = true
port = http,https
filter = gkicks-auth
logpath = $APP_DIR/logs/auth.log
maxretry = 5
bantime = 3600
findtime = 600

[gkicks-api]
enabled = true
port = http,https
filter = gkicks-api
logpath = $APP_DIR/logs/api.log
maxretry = 10
bantime = 1800
findtime = 300
EOF
    
    # Create filter for authentication failures
    cat > /etc/fail2ban/filter.d/gkicks-auth.conf << 'EOF'
[Definition]
failregex = ^.*Authentication failed.*IP: <HOST>.*$
            ^.*Invalid login attempt.*from <HOST>.*$
            ^.*Failed login.*<HOST>.*$
ignoreregex =
EOF
    
    # Create filter for API abuse
    cat > /etc/fail2ban/filter.d/gkicks-api.conf << 'EOF'
[Definition]
failregex = ^.*Rate limit exceeded.*IP: <HOST>.*$
            ^.*API abuse detected.*from <HOST>.*$
            ^.*Too many requests.*<HOST>.*$
ignoreregex =
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log_success "Fail2ban configured for GKicks application"
}

# Create health check endpoint
create_health_check() {
    log_info "Creating health check endpoint..."
    
    # Create a simple health check script
    cat > "$SCRIPTS_DIR/health-check.js" << 'EOF'
#!/usr/bin/env node

// Simple health check endpoint for monitoring
const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.production' });

const PORT = process.env.HEALTH_CHECK_PORT || 3001;

const server = http.createServer(async (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    try {
      // Check database connection
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
      });
      
      await connection.execute('SELECT 1');
      await connection.end();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime()
      }));
    } catch (error) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
EOF
    
    chmod +x "$SCRIPTS_DIR/health-check.js"
    
    log_success "Health check endpoint created"
}

# Display setup summary
show_summary() {
    log_info "\n=== GKicks Cron Setup Summary ==="
    
    echo -e "${GREEN}Installed Components:${NC}"
    echo "✓ Backup script with daily execution (2:00 AM)"
    echo "✓ Monitoring script with 5-minute intervals"
    echo "✓ Log rotation configuration"
    echo "✓ Systemd services and timers (alternative to cron)"
    echo "✓ Fail2ban security configuration"
    echo "✓ Health check endpoint"
    
    echo -e "\n${YELLOW}Cron Jobs Installed:${NC}"
    crontab -u "$USER" -l | grep -A 20 "# GKicks" || echo "No cron jobs found"
    
    echo -e "\n${YELLOW}Systemd Timers:${NC}"
    systemctl list-timers | grep gkicks || echo "No systemd timers found"
    
    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo "• View cron jobs: crontab -u $USER -l"
    echo "• Check systemd timers: systemctl list-timers"
    echo "• View backup logs: tail -f $LOG_DIR/gkicks-backup.log"
    echo "• View monitor logs: tail -f $LOG_DIR/gkicks-monitor.log"
    echo "• Check fail2ban status: fail2ban-client status"
    echo "• Test health check: curl http://localhost:3001/health"
    
    echo -e "\n${GREEN}Setup completed successfully!${NC}"
}

# Main function
main() {
    log_info "Starting GKicks cron and automation setup..."
    
    # Check prerequisites
    check_root
    
    # Setup components
    make_scripts_executable
    setup_log_rotation
    setup_cron_jobs
    create_systemd_service
    setup_fail2ban
    create_health_check
    
    # Show summary
    show_summary
}

# Handle script interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"

exit 0