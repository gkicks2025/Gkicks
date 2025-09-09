# Quick VPS Setup Guide

**VPS IP:** `72.60.111.2`  
**Domain:** `g-kicks.shop`

## Prerequisites

- SSH access to your VPS (72.60.111.2)
- Domain g-kicks.shop pointing to your VPS IP
- Root or sudo access on the VPS

## Quick Deployment Steps

### 1. DNS Configuration

Ensure your domain DNS is configured:

```
A Record: @ -> 72.60.111.2
A Record: www -> 72.60.111.2
A Record: admin -> 72.60.111.2 (optional)
```

### 2. Connect to VPS

```bash
ssh root@72.60.111.2
# or
ssh your_username@72.60.111.2
```

### 3. Quick Deployment

Option A - Using the deployment script:
```bash
# Make script executable
chmod +x deploy-to-vps.sh

# Run deployment
./deploy-to-vps.sh
```

Option B - Manual deployment:
```bash
# Copy files to VPS
scp -r . root@72.60.111.2:/tmp/gkicks-deployment/

# SSH to VPS and run deployment
ssh root@72.60.111.2
cd /tmp/gkicks-deployment
chmod +x deploy.sh
./deploy.sh
```

### 4. Environment Configuration

On your VPS, update the environment file:

```bash
cd /var/www/gkicks
cp .env.production.example .env.production
nano .env.production
```

Key configurations to update:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/gkicks_prod"

# Domain
APP_URL=https://g-kicks.shop
NEXTAUTH_URL=https://g-kicks.shop

# Security
NEXTAUTH_SECRET=your_secure_secret_here
JWT_SECRET=your_jwt_secret_here
```

### 5. SSL Certificate Setup

SSL will be automatically configured for g-kicks.shop during deployment.

### 6. Start Services

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
pm2 status
sudo systemctl status nginx
```

## Verification

### Check Application Status
```bash
# PM2 status
pm2 status
pm2 logs gkicks-app

# Nginx status
sudo nginx -t
sudo systemctl status nginx

# Database connection
mysql -u root -p -e "SHOW DATABASES;"
```

### Test URLs
- Main site: https://g-kicks.shop
- API health: https://g-kicks.shop/api/health
- Admin (if configured): https://admin.g-kicks.shop

## Troubleshooting

### Common Issues

1. **DNS not propagated**
   ```bash
   nslookup g-kicks.shop
   dig g-kicks.shop
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

3. **Application not starting**
   ```bash
   pm2 logs gkicks-app
   pm2 restart gkicks-app
   ```

4. **Database connection issues**
   ```bash
   mysql -u root -p
   SHOW DATABASES;
   ```

### Useful Commands

```bash
# Restart application
pm2 restart gkicks-app

# View logs
pm2 logs gkicks-app --lines 50

# Restart Nginx
sudo systemctl restart nginx

# Check disk space
df -h

# Check memory usage
free -h

# Monitor processes
htop
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Root login disabled (if using non-root user)
- [ ] SSL certificates installed
- [ ] Database secured with strong passwords
- [ ] Regular backups configured

## Backup & Monitoring

The deployment includes:
- Automated daily backups
- System monitoring scripts
- Log rotation
- Health checks

Monitor your application:
```bash
# Run monitoring script
./scripts/monitor.sh

# Check backup status
ls -la /var/backups/gkicks/
```

## Support

If you encounter issues:
1. Check the logs: `pm2 logs gkicks-app`
2. Verify DNS: `nslookup g-kicks.shop`
3. Test SSL: `curl -I https://g-kicks.shop`
4. Check services: `pm2 status && sudo systemctl status nginx`

---

**Quick Access:**
- SSH: `ssh root@72.60.111.2`
- Website: https://g-kicks.shop
- Logs: `pm2 logs gkicks-app`
- Restart: `pm2 restart gkicks-app`