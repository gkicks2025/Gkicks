#!/bin/bash
# Script to start PM2 with environment variables from .env.production

cd /var/www/gkicks

# Load environment variables
export $(grep -v '^#' .env.production | grep -v '^$' | xargs -d '\n')

# Set NODE_ENV
export NODE_ENV=production

# Start PM2 with environment variables
pm2 start npm --name 'gkicks-app' -- start

echo "PM2 started with environment variables:"
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_USER: $SMTP_USER"
echo "NODE_ENV: $NODE_ENV"