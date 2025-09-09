#!/bin/bash

# GKicks Monitoring Script
# This script monitors the health and performance of the GKicks application

set -e

# Configuration
APP_NAME="gkicks"
APP_DIR="/var/www/gkicks"
LOG_FILE="/var/log/gkicks-monitor.log"
ALERT_EMAIL="admin@yourdomain.com"
APP_URL="https://yourdomain.com"
API_URL="https://yourdomain.com/api/health"
MAX_RESPONSE_TIME=5000  # milliseconds
MAX_CPU_USAGE=80        # percentage
MAX_MEMORY_USAGE=80     # percentage
MAX_DISK_USAGE=85       # percentage

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

# Send alert function
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Send email alert if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[ALERT] GKicks - $subject" "$ALERT_EMAIL"
        log_info "Alert sent to $ALERT_EMAIL: $subject"
    fi
    
    # Log the alert
    log_error "ALERT: $subject - $message"
}

# Check if application is running
check_app_process() {
    log_info "Checking application processes..."
    
    # Check PM2 processes
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="gkicks-app") | .pm2_env.status' 2>/dev/null || echo "not_found")
        
        if [ "$pm2_status" = "online" ]; then
            log_success "PM2 process 'gkicks-app' is running"
        else
            send_alert "Application Process Down" "PM2 process 'gkicks-app' is not running (status: $pm2_status)"
            return 1
        fi
    else
        log_warning "PM2 not found, checking Node.js processes"
        
        if pgrep -f "node.*next" >/dev/null; then
            log_success "Node.js application process is running"
        else
            send_alert "Application Process Down" "No Node.js application process found"
            return 1
        fi
    fi
    
    return 0
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    # Load environment variables
    if [ -f "$APP_DIR/.env.production" ]; then
        source "$APP_DIR/.env.production"
    else
        log_error "Environment file not found"
        return 1
    fi
    
    # Test database connection
    if mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" "$MYSQL_DATABASE" >/dev/null 2>&1; then
        log_success "Database connection is healthy"
    else
        send_alert "Database Connection Failed" "Cannot connect to MySQL database at $MYSQL_HOST:$MYSQL_PORT"
        return 1
    fi
    
    return 0
}

# Check web application response
check_web_response() {
    log_info "Checking web application response..."
    
    # Check main application
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$APP_URL" --max-time 10 2>/dev/null || echo "timeout")
    
    if [ "$response_time" = "timeout" ]; then
        send_alert "Web Application Timeout" "Application at $APP_URL is not responding"
        return 1
    fi
    
    # Convert to milliseconds
    local response_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if [ "$response_ms" -gt "$MAX_RESPONSE_TIME" ]; then
        send_alert "Slow Response Time" "Application response time is ${response_ms}ms (threshold: ${MAX_RESPONSE_TIME}ms)"
        log_warning "Slow response time: ${response_ms}ms"
    else
        log_success "Web application is responding (${response_ms}ms)"
    fi
    
    # Check API health endpoint if available
    if curl -f -s "$API_URL" >/dev/null 2>&1; then
        log_success "API health endpoint is responding"
    else
        log_warning "API health endpoint is not responding or not configured"
    fi
    
    return 0
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    if [ "$cpu_usage" -gt "$MAX_CPU_USAGE" ]; then
        send_alert "High CPU Usage" "CPU usage is ${cpu_usage}% (threshold: ${MAX_CPU_USAGE}%)"
    else
        log_success "CPU usage is normal (${cpu_usage}%)"
    fi
    
    # Check memory usage
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_mem * 100 / total_mem))
    
    if [ "$memory_usage" -gt "$MAX_MEMORY_USAGE" ]; then
        send_alert "High Memory Usage" "Memory usage is ${memory_usage}% (threshold: ${MAX_MEMORY_USAGE}%)"
    else
        log_success "Memory usage is normal (${memory_usage}%)"
    fi
    
    # Check disk usage
    local disk_usage=$(df "$APP_DIR" | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    if [ "$disk_usage" -gt "$MAX_DISK_USAGE" ]; then
        send_alert "High Disk Usage" "Disk usage is ${disk_usage}% (threshold: ${MAX_DISK_USAGE}%)"
    else
        log_success "Disk usage is normal (${disk_usage}%)"
    fi
    
    return 0
}

# Check Nginx status
check_nginx() {
    log_info "Checking Nginx status..."
    
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
        
        # Check Nginx configuration
        if nginx -t >/dev/null 2>&1; then
            log_success "Nginx configuration is valid"
        else
            send_alert "Nginx Configuration Error" "Nginx configuration test failed"
            return 1
        fi
    else
        send_alert "Nginx Service Down" "Nginx service is not running"
        return 1
    fi
    
    return 0
}

# Check SSL certificate expiry
check_ssl_certificate() {
    log_info "Checking SSL certificate..."
    
    local domain=$(echo "$APP_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    
    if [ -n "$domain" ]; then
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$cert_info" ]; then
            local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
            local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                send_alert "SSL Certificate Expiring Soon" "SSL certificate for $domain expires in $days_until_expiry days"
            else
                log_success "SSL certificate is valid (expires in $days_until_expiry days)"
            fi
        else
            log_warning "Could not retrieve SSL certificate information"
        fi
    else
        log_info "No HTTPS domain configured for SSL check"
    fi
    
    return 0
}

# Check log files for errors
check_logs() {
    log_info "Checking application logs for errors..."
    
    local error_count=0
    local log_files=(
        "$APP_DIR/logs/error.log"
        "$APP_DIR/logs/app.log"
        "/var/log/nginx/error.log"
        "/var/log/mysql/error.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            # Check for errors in the last hour
            local recent_errors=$(grep -i "error\|critical\|fatal" "$log_file" | grep "$(date '+%Y-%m-%d %H')" | wc -l 2>/dev/null || echo "0")
            
            if [ "$recent_errors" -gt 0 ]; then
                error_count=$((error_count + recent_errors))
                log_warning "Found $recent_errors recent errors in $log_file"
            fi
        fi
    done
    
    if [ "$error_count" -gt 10 ]; then
        send_alert "High Error Rate" "Found $error_count errors in application logs in the last hour"
    elif [ "$error_count" -gt 0 ]; then
        log_warning "Found $error_count errors in logs (within acceptable range)"
    else
        log_success "No recent errors found in logs"
    fi
    
    return 0
}

# Generate monitoring report
generate_report() {
    log_info "Generating monitoring report..."
    
    local report_file="/tmp/gkicks_monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "GKicks Monitoring Report"
        echo "======================="
        echo "Date: $(date)"
        echo "Server: $(hostname)"
        echo ""
        echo "System Information:"
        echo "- Uptime: $(uptime)"
        echo "- Load Average: $(uptime | awk -F'load average:' '{print $2}')"
        echo "- Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
        echo "- Disk Usage: $(df -h "$APP_DIR" | tail -1 | awk '{print $5" used of "$2}')"
        echo ""
        echo "Application Status:"
        if command -v pm2 >/dev/null 2>&1; then
            echo "- PM2 Processes:"
            pm2 list 2>/dev/null | grep -E "(gkicks|online|stopped|errored)" || echo "  No PM2 processes found"
        fi
        echo ""
        echo "Network Connectivity:"
        echo "- Application URL: $APP_URL"
        curl -I "$APP_URL" 2>/dev/null | head -1 || echo "  Connection failed"
        echo ""
        echo "Recent Log Summary:"
        echo "- Error count (last hour): $(grep -i "error" "$LOG_FILE" 2>/dev/null | grep "$(date '+%Y-%m-%d %H')" | wc -l || echo "0")"
    } > "$report_file"
    
    log_success "Monitoring report generated: $report_file"
    
    # Optionally send report via email
    if [ -n "$ALERT_EMAIL" ] && [ "$1" = "--email-report" ]; then
        mail -s "GKicks Monitoring Report - $(date '+%Y-%m-%d %H:%M')" "$ALERT_EMAIL" < "$report_file"
        log_info "Report sent to $ALERT_EMAIL"
    fi
}

# Main monitoring function
main() {
    log_info "Starting GKicks monitoring check..."
    
    local failed_checks=0
    
    # Run all checks
    check_app_process || ((failed_checks++))
    check_database || ((failed_checks++))
    check_web_response || ((failed_checks++))
    check_system_resources || ((failed_checks++))
    check_nginx || ((failed_checks++))
    check_ssl_certificate || ((failed_checks++))
    check_logs || ((failed_checks++))
    
    # Generate report
    generate_report "$@"
    
    if [ "$failed_checks" -eq 0 ]; then
        log_success "All monitoring checks passed"
    else
        log_error "$failed_checks monitoring checks failed"
        send_alert "Monitoring Check Failures" "$failed_checks out of 7 monitoring checks failed. Please check the logs for details."
    fi
    
    log_info "Monitoring check completed"
}

# Handle script interruption
trap 'log_error "Monitoring script interrupted"; exit 1' INT TERM

# Run main function
main "$@"

exit 0