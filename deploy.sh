#!/bin/bash

# GKicks VPS Deployment Script
# This script automates the deployment of GKicks e-commerce application to a VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="gkicks"
DOMAIN="g-kicks.shop"
APP_DIR="/var/www/gkicks-shop/GKICKS-SHOP-2.0"
LOG_DIR="/var/log/gkicks"
BACKUP_DIR="/var/backups/gkicks"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
DATE=$(date +%Y%m%d_%H%M%S)

# Functions
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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_system() {
    log_info "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS version"
        exit 1
    fi
    
    # Check available space
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 2097152 ]]; then  # 2GB in KB
        log_warning "Less than 2GB free space available"
    fi
    
    log_success "System check completed"
}

install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update system
    apt update && apt upgrade -y
    
    # Install required packages
    apt install -y curl wget git nginx mysql-server ufw fail2ban certbot python3-certbot-nginx
    
    # Install Node.js
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    log_success "Dependencies installed"
}

setup_mysql() {
    log_info "Setting up MySQL database..."
    
    # Secure MySQL installation
    mysql_secure_installation
    
    # Create database and user
    read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASS
    echo
    read -p "Enter password for gkicks_user: " -s MYSQL_USER_PASS
    echo
    
    mysql -u root -p$MYSQL_ROOT_PASS <<EOF
CREATE DATABASE IF NOT EXISTS gkicks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gkicks_user'@'localhost' IDENTIFIED BY '$MYSQL_USER_PASS';
GRANT ALL PRIVILEGES ON gkicks.* TO 'gkicks_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    log_success "MySQL database setup completed"
}

setup_directories() {
    log_info "Setting up directories..."
    
    # Create necessary directories
    mkdir -p $LOG_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/www
    
    # Set permissions
    chown -R www-data:www-data $LOG_DIR
    chown -R www-data:www-data $BACKUP_DIR
    
    log_success "Directories created"
}

clone_repository() {
    log_info "Cloning repository..."
    
    if [[ -d "/var/www/gkicks-shop" ]]; then
        log_warning "Repository already exists. Updating..."
        cd /var/www/gkicks-shop
        git pull origin main
    else
        cd /var/www
        REPO_URL="https://github.com/gkicks2025/gkicks.git"
        git clone $REPO_URL gkicks-shop
    fi
    
    chown -R www-data:www-data /var/www/gkicks-shop
    
    log_success "Repository cloned/updated"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    cd $APP_DIR
    
    if [[ ! -f ".env.production" ]]; then
        if [[ -f ".env.production.example" ]]; then
            cp .env.production.example .env.production
            log_warning "Please edit .env.production with your actual values"
            read -p "Press Enter to continue after editing .env.production..."
        else
            log_error ".env.production.example not found"
            exit 1
        fi
    fi
    
    log_success "Environment setup completed"
}

install_app_dependencies() {
    log_info "Installing application dependencies..."
    
    cd $APP_DIR
    
    # Install dependencies
    npm install --production
    
    # Build application
    npm run build
    
    log_success "Application dependencies installed and built"
}

run_migrations() {
    log_info "Running database migrations..."
    
    cd $APP_DIR
    
    # Run database setup scripts
    if [[ -f "setup-main-database.js" ]]; then
        node setup-main-database.js
    fi
    
    if [[ -f "execute-mysql-schema.js" ]]; then
        node execute-mysql-schema.js
    fi
    
    log_success "Database migrations completed"
}

setup_nginx() {
    log_info "Setting up Nginx..."
    
    # Copy Nginx configuration
    if [[ -f "nginx/sites-available/gkicks.conf" ]]; then
        cp nginx/sites-available/gkicks.conf $NGINX_AVAILABLE/gkicks
        
        # Update domain name
        read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
        sed -i "s/yourdomain.com/$DOMAIN_NAME/g" $NGINX_AVAILABLE/gkicks
        
        # Enable site
        ln -sf $NGINX_AVAILABLE/gkicks $NGINX_ENABLED/gkicks
        
        # Remove default site
        rm -f $NGINX_ENABLED/default
        
        # Test configuration
        nginx -t
        
        # Reload Nginx
        systemctl reload nginx
    else
        log_error "Nginx configuration file not found"
        exit 1
    fi
    
    log_success "Nginx setup completed"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " SETUP_SSL
    
    if [[ $SETUP_SSL == "y" || $SETUP_SSL == "Y" ]]; then
        read -p "Enter your email for Let's Encrypt: " EMAIL
        read -p "Enter your domain name: " DOMAIN
        
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
        
        log_success "SSL certificate installed"
    else
        log_warning "SSL setup skipped"
    fi
}

setup_pm2() {
    log_info "Setting up PM2..."
    
    cd $APP_DIR
    
    # Start application with PM2
    if [[ -f "ecosystem.config.js" ]]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start npm --name "$APP_NAME" -- start
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    log_success "PM2 setup completed"
}

setup_firewall() {
    log_info "Setting up firewall..."
    
    # Configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    
    log_success "Firewall configured"
}

setup_backup() {
    log_info "Setting up backup system..."
    
    # Create backup script
    cat > /usr/local/bin/backup-gkicks.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/gkicks"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/gkicks-shop/GKICKS-SHOP-2.0"

# Load environment variables
source $APP_DIR/.env.production

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/gkicks_db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/gkicks_uploads_$DATE.tar.gz -C $APP_DIR/public uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "gkicks_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "gkicks_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x /usr/local/bin/backup-gkicks.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-gkicks.sh >> /var/log/gkicks/backup.log 2>&1") | crontab -
    
    log_success "Backup system configured"
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Install and configure fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Create log rotation
    cat > /etc/logrotate.d/gkicks << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    log_success "Monitoring setup completed"
}

run_health_check() {
    log_info "Running health check..."
    
    # Check if services are running
    systemctl is-active --quiet nginx || log_error "Nginx is not running"
    systemctl is-active --quiet mysql || log_error "MySQL is not running"
    pm2 list | grep -q "online" || log_error "PM2 applications are not running"
    
    # Check if application is responding
    sleep 5
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application health check passed"
    else
        log_warning "Application health check failed - this might be normal if the app is still starting"
    fi
    
    log_success "Health check completed"
}

print_summary() {
    echo
    echo "======================================"
    echo "    DEPLOYMENT COMPLETED SUCCESSFULLY"
    echo "======================================"
    echo
    echo "Application URL: https://$(hostname -f)"
    echo "Admin Panel: https://$(hostname -f)/admin"
    echo "Application Directory: $APP_DIR"
    echo "Log Directory: $LOG_DIR"
    echo "Backup Directory: $BACKUP_DIR"
    echo
    echo "Useful Commands:"
    echo "  - View application status: pm2 status"
    echo "  - View logs: pm2 logs"
    echo "  - Restart application: pm2 restart $APP_NAME"
    echo "  - View Nginx status: systemctl status nginx"
    echo "  - View MySQL status: systemctl status mysql"
    echo "  - Run backup: /usr/local/bin/backup-gkicks.sh"
    echo
    echo "Next Steps:"
    echo "1. Update DNS records to point to this server"
    echo "2. Test the application thoroughly"
    echo "3. Configure monitoring and alerting"
    echo "4. Set up regular security updates"
    echo
}

# Main deployment function
main() {
    log_info "Starting GKicks VPS deployment..."
    
    check_root
    check_system
    install_dependencies
    setup_mysql
    setup_directories
    clone_repository
    setup_environment
    install_app_dependencies
    run_migrations
    setup_nginx
    setup_ssl
    setup_pm2
    setup_firewall
    setup_backup
    setup_monitoring
    run_health_check
    print_summary
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"