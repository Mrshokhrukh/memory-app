# Memoryscape Deployment Guide

## 🚀 Production Deployment Options

This guide covers multiple deployment strategies for the Memoryscape platform, from simple cloud deployments to enterprise-grade infrastructure.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher
- **Redis**: 7.0 or higher (for session management and caching)
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: 20GB+ available space
- **SSL Certificate**: Required for production

### Environment Variables
Create a `.env` file with the following variables:

\`\`\`bash
# Server Configuration
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb://username:password@host:port/memoryscape

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRE=7d

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (Optional - for sessions)
REDIS_URL=redis://localhost:6379
\`\`\`

## 🌐 Deployment Options

### Option 1: Vercel + MongoDB Atlas (Recommended for MVP)

**Advantages**: Fastest deployment, automatic scaling, built-in CDN
**Best for**: MVP launch, small to medium scale

#### Backend Deployment (Vercel)

1. **Prepare the backend for Vercel**:
\`\`\`bash
# Create vercel.json in server directory
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
\`\`\`

2. **Deploy to Vercel**:
\`\`\`bash
cd server
npm install -g vercel
vercel --prod
\`\`\`

3. **Configure environment variables** in Vercel dashboard

#### Frontend Deployment (Vercel)

1. **Build and deploy frontend**:
\`\`\`bash
cd client
npm run build
vercel --prod
\`\`\`

2. **Update API URLs** in client environment:
\`\`\`bash
REACT_APP_API_URL=https://your-backend.vercel.app/api
REACT_APP_SERVER_URL=https://your-backend.vercel.app
\`\`\`

#### Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas cluster**:
   - Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a new cluster (free tier available)
   - Configure network access (allow all IPs: 0.0.0.0/0)
   - Create database user with read/write permissions

2. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

3. **Initialize database**:
\`\`\`bash
# Run this script to create initial indexes
node scripts/init-database.js
\`\`\`

### Option 2: DigitalOcean Droplet (Recommended for Production)

**Advantages**: Full control, cost-effective, scalable
**Best for**: Production deployment, custom requirements

#### Server Setup

1. **Create DigitalOcean Droplet**:
   - Ubuntu 22.04 LTS
   - Minimum 2GB RAM, 2 vCPUs
   - Enable monitoring and backups

2. **Initial server setup**:
\`\`\`bash
# Connect to your droplet
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

# Install Redis
apt-get install -y redis-server

# Install Nginx
apt-get install -y nginx

# Install PM2 for process management
npm install -g pm2

# Install Git
apt-get install -y git
\`\`\`

3. **Clone and setup application**:
\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/memoryscape.git
cd memoryscape

# Setup backend
cd server
npm install --production
cp .env.example .env
# Edit .env with your configuration
nano .env

# Setup frontend
cd ../client
npm install
npm run build

# Create application user
useradd -m -s /bin/bash memoryscape
chown -R memoryscape:memoryscape /home/memoryscape/memoryscape
\`\`\`

4. **Configure PM2**:
\`\`\`bash
# Switch to application user
su - memoryscape
cd memoryscape/server

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'memoryscape-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/memoryscape/api-error.log',
    out_file: '/var/log/memoryscape/api-out.log',
    log_file: '/var/log/memoryscape/api.log'
  }]
}
EOF

# Create log directory
sudo mkdir -p /var/log/memoryscape
sudo chown memoryscape:memoryscape /var/log/memoryscape

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

5. **Configure Nginx**:
\`\`\`bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/memoryscape

# Add this configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend (React app)
    location / {
        root /home/memoryscape/memoryscape/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/memoryscape /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### Option 3: AWS Deployment

**Advantages**: Enterprise-grade, highly scalable, comprehensive services
**Best for**: Large scale, enterprise customers

#### Using AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI**:
\`\`\`bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Install EB CLI
pip install awsebcli
\`\`\`

2. **Initialize Elastic Beanstalk application**:
\`\`\`bash
cd server
eb init memoryscape-api --platform node.js --region us-east-1
eb create production --instance-type t3.medium
\`\`\`

3. **Deploy backend**:
\`\`\`bash
# Create .ebextensions directory for configuration
mkdir .ebextensions

# Create environment configuration
cat > .ebextensions/environment.config << EOF
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.17.0
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.medium
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
EOF

# Deploy
eb deploy
\`\`\`

4. **Deploy frontend to S3 + CloudFront**:
\`\`\`bash
cd ../client

# Build for production
npm run build

# Create S3 bucket
aws s3 mb s3://memoryscape-frontend-bucket

# Upload build files
aws s3 sync build/ s3://memoryscape-frontend-bucket --delete

# Create CloudFront distribution (via AWS Console)
# Point to S3 bucket with proper caching rules
\`\`\`

### Database Setup

#### MongoDB Atlas (Recommended)
1. Create MongoDB Atlas cluster
2. Configure network access (IP whitelist)
3. Create database user
4. Get connection string
5. Run initial data migration

#### Self-hosted MongoDB
\`\`\`bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use memoryscape
db.createUser({
  user: "memoryscape_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
\`\`\`

### SSL Certificate Setup

#### Using Let's Encrypt (Free)
\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### Monitoring & Logging

#### Setup PM2 for Process Management
\`\`\`bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server/server.js --name "memoryscape-api"
pm2 start client/build/static/js/main.js --name "memoryscape-client"

# Save PM2 configuration
pm2 save
pm2 startup
\`\`\`

#### Setup Log Rotation
\`\`\`bash
# Install logrotate
sudo apt-get install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/memoryscape
\`\`\`

\`\`\`
/var/log/memoryscape/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload memoryscape-api
    endscript
}
\`\`\`

### Performance Optimization

#### Enable Gzip Compression
\`\`\`javascript
// Add to server.js
const compression = require('compression');
app.use(compression());
\`\`\`

#### Setup CDN (CloudFlare)
1. Create CloudFlare account
2. Add domain to CloudFlare
3. Update DNS settings
4. Enable caching and optimization features

#### Database Indexing
\`\`\`javascript
// Add indexes for better performance
db.users.createIndex({ email: 1 });
db.capsules.createIndex({ owner: 1, type: 1 });
db.memoryitems.createIndex({ capsule: 1, createdAt: -1 });
db.memoryitems.createIndex({ author: 1 });
\`\`\`

### Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] Security headers configured
- [ ] Regular security updates scheduled

### Backup Strategy

#### Database Backup
\`\`\`bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/memoryscape_$DATE"
tar -czf "/backups/memoryscape_$DATE.tar.gz" "/backups/memoryscape_$DATE"
rm -rf "/backups/memoryscape_$DATE"

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
\`\`\`

#### File Backup
\`\`\`bash
# Backup uploaded files (if not using cloud storage)
rsync -av /app/server/uploads/ /backups/uploads/
\`\`\`

### Health Monitoring

#### Setup Health Checks
\`\`\`javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
\`\`\`

#### Setup Monitoring (Optional)
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Sentry**: Error tracking and performance monitoring

### Scaling Considerations

#### Horizontal Scaling
- Load balancer configuration
- Session management with Redis
- Database read replicas
- CDN for static assets

#### Vertical Scaling
- Server resource monitoring
- Database optimization
- Caching strategies
- Code optimization

This deployment guide ensures a robust, secure, and scalable production environment for Memoryscape.
