#!/bin/bash

# GKicks VPS Deployment Script
# VPS IP: 72.60.111.2
# Domain: g-kicks.shop

set -e

# Configuration
VPS_IP="72.60.111.2"
DOMAIN="g-kicks.shop"
APP_NAME="gkicks"
APP_DIR="/var/www/gkicks"
USER="root"  # Change this to your VPS user
REPO_URL="https://github.com/yourusername/gkicks.git"  # Update with your repo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we can connect to VPS
check_vps_connection() {
    print_status "Checking VPS connection to $VPS_IP..."
    if ping -c 1 $VPS_IP > /dev/null 2>&1; then
        print_success "VPS is reachable"
    else
        print_error "Cannot reach VPS at $VPS_IP"
        exit 1
    fi
}

# Deploy to VPS
deploy_to_vps() {
    print_status "Starting deployment to VPS..."
    
    # Copy deployment files to VPS
    print_status "Copying deployment files to VPS..."
    scp -r . $USER@$VPS_IP:/tmp/gkicks-deployment/
    
    # Execute deployment on VPS
    ssh $USER@$VPS_IP << 'EOF'
        cd /tmp/gkicks-deployment
        chmod +x deploy.sh
        ./deploy.sh
EOF
    
    print_success "Deployment completed!"
}

# Setup domain DNS (informational)
show_dns_setup() {
    print_status "DNS Configuration Required:"
    echo "Please configure your domain DNS settings:"
    echo "Domain: $DOMAIN"
    echo "A Record: @ -> $VPS_IP"
    echo "A Record: www -> $VPS_IP"
    echo "A Record: admin -> $VPS_IP (optional for admin subdomain)"
    echo ""
}

# Main deployment function
main() {
    echo "====================================="
    echo "   GKicks VPS Deployment Script"
    echo "====================================="
    echo "VPS IP: $VPS_IP"
    echo "Domain: $DOMAIN"
    echo "====================================="
    echo ""
    
    # Check VPS connection
    check_vps_connection
    
    # Show DNS setup instructions
    show_dns_setup
    
    # Confirm deployment
    read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_vps
        
        echo ""
        print_success "Deployment Summary:"
        echo "• VPS IP: $VPS_IP"
        echo "• Domain: $DOMAIN"
        echo "• Application URL: https://$DOMAIN"
        echo "• Admin Panel: https://admin.$DOMAIN (if configured)"
        echo ""
        print_warning "Next Steps:"
        echo "1. Configure your domain DNS to point to $VPS_IP"
        echo "2. Wait for DNS propagation (5-30 minutes)"
        echo "3. SSL certificates will be automatically generated"
        echo "4. Monitor logs: ssh $USER@$VPS_IP 'pm2 logs'"
        echo ""
    else
        print_warning "Deployment cancelled"
    fi
}

# Run main function
main "$@"