# GKicks Deployment Resume Guide

**VPS:** 72.60.111.2  
**Domain:** g-kicks.shop  
**Status:** Ready for deployment after 4 hours

## Quick Deployment Steps

### 1. Connect to VPS
```bash
ssh root@72.60.111.2
```

### 2. System Setup
```bash
# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y nodejs npm nginx mysql-server git certbot python3-certbot-nginx
npm install -g pm2
```

### 3. Application Setup
```bash
# Clone repository
git clone https://github.com/gkicks2025/gkicks.git /var/www/gkicks
cd /var/www/gkicks

# Install dependencies
npm install

# Setup environment
cp .env.production.example .env.production
nano .env.production  # Edit database credentials and other settings
```

### 4. Database Setup
```bash
# Secure MySQL installation
mysql_secure_installation

# Create database
mysql -u root -p -e "CREATE DATABASE gkicks_prod;"

# Import schema
mysql -u root -p gkicks_prod < database/complete-mysql-schema.sql
```

### 5. Build and Start Application
```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Configure Nginx
```bash
# Copy Nginx configuration
cp nginx/sites-available/gkicks.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/gkicks.conf /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

### 7. Setup SSL Certificate
```bash
# Generate SSL certificate
certbot --nginx -d g-kicks.shop -d www.g-kicks.shop
```

## Post-Deployment Checklist

- [ ] DNS A records configured (@ and www → 72.60.111.2)
- [ ] SSL certificates generated and working
- [ ] Database configured and migrated
- [ ] Application running (check with `pm2 status`)
- [ ] Nginx configured and running (check with `systemctl status nginx`)
- [ ] Firewall configured (`ufw enable`)

## Verification Commands

```bash
# Check application status
pm2 status

# Check Nginx status
systemctl status nginx

# Test website
curl -I https://g-kicks.shop
```

## Expected URLs After Deployment

- **Main Site:** https://g-kicks.shop
- **Admin Panel:** https://admin.g-kicks.shop
- **API Endpoint:** https://g-kicks.shop/api

## Troubleshooting

If you encounter issues:

1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check application logs: `tail -f /var/www/gkicks/logs/app.log`
4. Restart services: `pm2 restart all && systemctl restart nginx`

---

**Note:** Make sure to update the Git repository URL in step 3 with your actual repository URL before deployment.