# 🚀 GES Website Deployment Guide

## 📁 Project Structure

```
GES/
├── Frontend (Public Website)
│   ├── index.html              # Main website
│   ├── styles.css              # Website styles
│   ├── script.js               # Website functionality
│   ├── GES_LOGO.png           # Your logo
│   └── catalouge/             # Product images folder
│       └── products/          # All product categories
│
├── Admin Dashboard
│   ├── admin.html             # Admin interface
│   ├── admin-styles.css       # Admin styles
│   ├── admin-script.js        # Admin functionality
│   └── server.js              # Node.js backend
│
├── Backend
│   ├── package.json           # Dependencies
│   ├── generate_products.py   # Product data generator
│   └── .gitignore            # Git ignore rules
│
└── Documentation
    ├── README.md
    ├── ADMIN_GUIDE.md
    └── DEPLOYMENT_GUIDE.md (this file)
```

---

## 🌐 Hosting Options & Recommendations

### Option 1: **DigitalOcean Droplet** ⭐ RECOMMENDED
**Best for**: Full control, scalability, professional setup

**Specs Needed**:
- **Basic Droplet**: $6/month
- 1 GB RAM / 1 CPU
- 25 GB SSD
- Ubuntu 22.04 LTS

**Pros**:
- ✅ Full control over server
- ✅ Can run Node.js backend
- ✅ Support for admin dashboard
- ✅ Easy to scale
- ✅ SSH access
- ✅ Good for business

**Cons**:
- ❌ Requires basic server management
- ❌ Need to setup SSL/domain yourself

**Monthly Cost**: $6-12

---

### Option 2: **Hostinger VPS** ⭐ GREAT VALUE
**Best for**: Budget-friendly with good performance

**Specs**:
- **VPS Plan**: Starting at $4/month
- 1 vCPU / 4 GB RAM
- 50 GB NVMe SSD
- Node.js support

**Pros**:
- ✅ Very affordable
- ✅ Managed panel (hPanel)
- ✅ Free SSL
- ✅ Good support
- ✅ Easy to use

**Cons**:
- ❌ Less flexibility than DO

**Monthly Cost**: $4-8

---

### Option 3: **AWS Lightsail** 💼 ENTERPRISE
**Best for**: If you want AWS ecosystem

**Specs**:
- **Lightsail Instance**: $5/month
- 1 GB RAM / 1 vCPU
- 40 GB SSD
- Managed databases available

**Pros**:
- ✅ AWS ecosystem
- ✅ Easy scaling
- ✅ Good documentation
- ✅ Reliable

**Cons**:
- ❌ More complex than others
- ❌ Additional costs for extras

**Monthly Cost**: $5-10

---

### Option 4: **Vercel + Railway** 🚄 MODERN STACK
**Best for**: Modern deployment, automatic scaling

**Setup**:
- Frontend on **Vercel** (FREE)
- Backend on **Railway** ($5/month)

**Pros**:
- ✅ Automatic deployments
- ✅ GitHub integration
- ✅ Free SSL
- ✅ CDN included
- ✅ Modern workflow

**Cons**:
- ❌ Two separate services
- ❌ Less control

**Monthly Cost**: $5 (Railway) + $0 (Vercel)

---

### Option 5: **Shared Hosting** (NOT RECOMMENDED)
**Examples**: Hostgator, Bluehost, GoDaddy

**Why NOT recommended**:
- ❌ No Node.js support (for admin dashboard)
- ❌ Limited control
- ❌ Slower performance
- ❌ Can only host static files

**Note**: You can host ONLY the public website, but NO admin dashboard

---

## 🏆 My Recommendation

### For Your Business: **DigitalOcean Droplet**

**Why?**
1. ✅ Professional and reliable
2. ✅ Full Node.js support (admin dashboard works)
3. ✅ Easy to manage
4. ✅ Scalable as you grow
5. ✅ Good documentation
6. ✅ SSH access for updates

**Cost Breakdown**:
- Droplet: $6/month
- Domain: $12/year (~$1/month)
- **Total: ~$7/month** or **~$84/year**

---

## 📋 Pre-Deployment Checklist

### 1. **Environment Variables**
Create `.env` file:
```bash
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=generate-a-random-secret-key
```

### 2. **Update Admin Credentials**
Edit `server.js`:
```javascript
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
```

### 3. **Add Production Script**
Already added in `package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### 4. **Optimize Images** (Optional but recommended)
Your images are quite large. Consider compressing them to improve loading speed.

---

## 🚀 Deployment Steps (DigitalOcean)

### Step 1: Create Droplet

1. Go to https://digitalocean.com
2. Create account (get $200 credit for 60 days with referral)
3. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **Region**: Choose closest to India (Bangalore)
   - **Authentication**: SSH Key (recommended) or Password

### Step 2: Connect to Server

```bash
ssh root@your_droplet_ip
```

### Step 3: Initial Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx (web server)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Python3 (for generate_products.py)
apt install -y python3 python3-pip
```

### Step 4: Upload Your Project

**Option A: Using Git** (Recommended)
```bash
# On your local machine, initialize git
cd /Users/satnams/Desktop/satnam/GES
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
# Then on server:
git clone https://github.com/yourusername/GES.git
cd GES
```

**Option B: Using SCP** (Direct upload)
```bash
# On your local machine
cd /Users/satnams/Desktop/satnam
tar -czf GES.tar.gz GES/
scp GES.tar.gz root@your_droplet_ip:/root/

# On server
cd /root
tar -xzf GES.tar.gz
cd GES
```

### Step 5: Install Dependencies

```bash
cd /root/GES
npm install --production
```

### Step 6: Configure Environment

```bash
# Create .env file
nano .env
```

Add:
```
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your-random-secret-key-here
```

### Step 7: Start Application with PM2

```bash
# Start the app
pm2 start server.js --name ges-website

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it gives you
```

### Step 8: Configure Nginx

```bash
nano /etc/nginx/sites-available/ges
```

Add:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/ges /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 9: Setup SSL (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your_domain.com -d www.your_domain.com
```

### Step 10: Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 🌐 Domain Setup

### Option 1: Buy Domain
- **Namecheap**: ~$10/year
- **GoDaddy**: ~$15/year
- **Google Domains**: ~$12/year

### Option 2: Use Existing Domain
If you already have a domain, just update DNS:

**DNS Records**:
```
Type: A
Name: @
Value: your_droplet_ip

Type: A
Name: www
Value: your_droplet_ip
```

---

## 📊 Estimated Costs

### Setup Costs (One-time)
- Domain: $12/year
- SSL: FREE (Let's Encrypt)

### Monthly Costs
- DigitalOcean Droplet: $6/month
- **Total: $6-7/month** or **~$84/year**

### Total First Year: ~$96

---

## 🔄 Updates & Maintenance

### Update Website Content
```bash
# SSH into server
ssh root@your_droplet_ip

# Navigate to project
cd /root/GES

# Pull latest changes (if using Git)
git pull

# Or upload new files via SCP

# Restart application
pm2 restart ges-website
```

### Update Product Images
1. Upload images via admin dashboard
2. Or use SCP to upload directly
3. Run: `python3 generate_products.py`
4. Restart: `pm2 restart ges-website`

### Backup Strategy
```bash
# Create backup script
nano /root/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cd /root
tar -czf $BACKUP_DIR/ges_backup_$DATE.tar.gz GES/

# Keep only last 7 backups
ls -t $BACKUP_DIR/ges_backup_*.tar.gz | tail -n +8 | xargs rm -f
```

Make executable and add to cron:
```bash
chmod +x /root/backup.sh
crontab -e
# Add: 0 2 * * * /root/backup.sh
```

---

## 🔐 Security Best Practices

1. **Change default admin password** immediately
2. **Use strong SSH keys** instead of passwords
3. **Keep system updated**: `apt update && apt upgrade`
4. **Use firewall** (UFW)
5. **Regular backups**
6. **Monitor logs**: `pm2 logs ges-website`
7. **Use HTTPS** (SSL certificate)

---

## 📞 Support & Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs ges-website
```

### Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### Check Server Resources
```bash
htop
df -h
free -m
```

### Common Issues

**Issue**: Website not loading
```bash
pm2 restart ges-website
systemctl restart nginx
```

**Issue**: Out of disk space
```bash
# Clean old logs
pm2 flush
# Remove old backups
# Compress images
```

---

## 🎯 Quick Start Command Summary

```bash
# Initial setup (one-time)
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx python3
npm install -g pm2

# Deploy application
cd /root/GES
npm install --production
pm2 start server.js --name ges-website
pm2 save
pm2 startup

# Configure Nginx + SSL
nano /etc/nginx/sites-available/ges
ln -s /etc/nginx/sites-available/ges /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
certbot --nginx -d your_domain.com
```

---

## ✅ Final Checklist

- [ ] Domain purchased and DNS configured
- [ ] DigitalOcean droplet created
- [ ] Server setup completed
- [ ] Application deployed
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Admin credentials changed
- [ ] Backup script configured
- [ ] Firewall enabled
- [ ] Website tested
- [ ] Admin dashboard tested

---

## 🆘 Need Help?

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Nginx Docs**: https://nginx.org/en/docs/

---

**🎉 Your website is ready to go live!**

**Estimated Total Cost**: ~$7/month ($84/year)

**Time to Deploy**: 30-60 minutes

**Difficulty**: Beginner-Intermediate



