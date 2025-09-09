#!/bin/bash

# GKicks Backup Script
# This script creates backups of the database and application files

set -e

# Configuration
APP_NAME="gkicks"
APP_DIR="/var/www/gkicks"
BACKUP_DIR="/var/backups/gkicks"
LOG_FILE="/var/log/gkicks-backup.log"
RETENTION_DAYS=7
DATE=$(date +"%Y%m%d_%H%M%S")

# Load environment variables
if [ -f "$APP_DIR/.env.production" ]; then
    source "$APP_DIR/.env.production"
else
    echo "Error: .env.production file not found" | tee -a "$LOG_FILE"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Database backup
backup_database() {
    log_info "Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/db_${APP_NAME}_${DATE}.sql"
    
    if mysqldump -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$db_backup_file"; then
        # Compress the backup
        gzip "$db_backup_file"
        log_success "Database backup created: ${db_backup_file}.gz"
        
        # Verify backup integrity
        if gunzip -t "${db_backup_file}.gz" 2>/dev/null; then
            log_success "Database backup integrity verified"
        else
            log_error "Database backup integrity check failed"
            return 1
        fi
    else
        log_error "Database backup failed"
        return 1
    fi
}

# Application files backup
backup_app_files() {
    log_info "Starting application files backup..."
    
    local app_backup_file="$BACKUP_DIR/app_${APP_NAME}_${DATE}.tar.gz"
    
    # Exclude node_modules, .git, logs, and temporary files
    if tar -czf "$app_backup_file" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude=".next" \
        --exclude="logs" \
        --exclude="*.log" \
        --exclude="tmp" \
        --exclude="temp" \
        -C "$(dirname "$APP_DIR")" \
        "$(basename "$APP_DIR")"; then
        log_success "Application files backup created: $app_backup_file"
    else
        log_error "Application files backup failed"
        return 1
    fi
}

# Environment files backup
backup_env_files() {
    log_info "Starting environment files backup..."
    
    local env_backup_file="$BACKUP_DIR/env_${APP_NAME}_${DATE}.tar.gz"
    
    # Backup environment and configuration files
    if tar -czf "$env_backup_file" \
        -C "$APP_DIR" \
        ".env.production" \
        "ecosystem.config.js" \
        2>/dev/null; then
        log_success "Environment files backup created: $env_backup_file"
    else
        log_warning "Some environment files may not exist, backup may be incomplete"
    fi
}

# Nginx configuration backup
backup_nginx_config() {
    log_info "Starting Nginx configuration backup..."
    
    local nginx_backup_file="$BACKUP_DIR/nginx_${APP_NAME}_${DATE}.tar.gz"
    
    if tar -czf "$nginx_backup_file" \
        "/etc/nginx/sites-available/${APP_NAME}" \
        "/etc/nginx/nginx.conf" \
        2>/dev/null; then
        log_success "Nginx configuration backup created: $nginx_backup_file"
    else
        log_warning "Nginx configuration backup may be incomplete"
    fi
}

# SSL certificates backup
backup_ssl_certs() {
    log_info "Starting SSL certificates backup..."
    
    local ssl_backup_file="$BACKUP_DIR/ssl_${APP_NAME}_${DATE}.tar.gz"
    
    if [ -d "/etc/letsencrypt/live" ]; then
        if tar -czf "$ssl_backup_file" \
            "/etc/letsencrypt/live" \
            "/etc/letsencrypt/renewal" \
            2>/dev/null; then
            log_success "SSL certificates backup created: $ssl_backup_file"
        else
            log_warning "SSL certificates backup may be incomplete"
        fi
    else
        log_info "No SSL certificates found to backup"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -eq 0 ]; then
        log_info "No old backups to clean up"
    else
        log_success "Cleaned up $deleted_count old backup files"
    fi
}

# Upload to remote storage (optional)
upload_to_remote() {
    if [ -n "$BACKUP_REMOTE_PATH" ] && [ -n "$BACKUP_REMOTE_USER" ] && [ -n "$BACKUP_REMOTE_HOST" ]; then
        log_info "Uploading backups to remote storage..."
        
        # Upload today's backups
        if rsync -avz --progress "$BACKUP_DIR/"*"$DATE"* "$BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST:$BACKUP_REMOTE_PATH/"; then
            log_success "Backups uploaded to remote storage"
        else
            log_error "Failed to upload backups to remote storage"
        fi
    else
        log_info "Remote backup not configured, skipping upload"
    fi
}

# Generate backup report
generate_report() {
    log_info "Generating backup report..."
    
    local report_file="$BACKUP_DIR/backup_report_${DATE}.txt"
    
    {
        echo "GKicks Backup Report"
        echo "==================="
        echo "Date: $(date)"
        echo "Backup Directory: $BACKUP_DIR"
        echo ""
        echo "Files created:"
        ls -lh "$BACKUP_DIR/"*"$DATE"* 2>/dev/null || echo "No backup files found"
        echo ""
        echo "Disk usage:"
        du -sh "$BACKUP_DIR"
        echo ""
        echo "Available disk space:"
        df -h "$BACKUP_DIR"
    } > "$report_file"
    
    log_success "Backup report generated: $report_file"
}

# Send notification (optional)
send_notification() {
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        local subject="GKicks Backup Completed - $(date '+%Y-%m-%d')"
        local report_file="$BACKUP_DIR/backup_report_${DATE}.txt"
        
        if [ -f "$report_file" ]; then
            mail -s "$subject" "$NOTIFICATION_EMAIL" < "$report_file"
            log_success "Notification sent to $NOTIFICATION_EMAIL"
        fi
    fi
}

# Main backup function
main() {
    log_info "Starting GKicks backup process..."
    
    # Check if required tools are available
    for tool in mysqldump tar gzip; do
        if ! command -v $tool >/dev/null 2>&1; then
            log_error "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Create backup directory
    create_backup_dir
    
    # Perform backups
    backup_database || log_error "Database backup failed"
    backup_app_files || log_error "Application files backup failed"
    backup_env_files
    backup_nginx_config
    backup_ssl_certs
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Upload to remote storage
    upload_to_remote
    
    # Generate report
    generate_report
    
    # Send notification
    send_notification
    
    log_success "Backup process completed successfully"
}

# Handle script interruption
trap 'log_error "Backup process interrupted"; exit 1' INT TERM

# Run main function
main "$@"

exit 0