#!/bin/bash

# GES Website Deployment Script
# This script helps deploy your website to a server

echo "🚀 GES Website Deployment Helper"
echo "=================================="
echo ""

# Check if running on server or local
if [ -f "/etc/os-release" ]; then
    echo "✅ Running on server"
    SERVER_MODE=true
else
    echo "📦 Running locally - preparing for deployment"
    SERVER_MODE=false
fi

if [ "$SERVER_MODE" = true ]; then
    echo ""
    echo "🔧 Server Deployment Steps:"
    echo ""
    
    # Install dependencies
    echo "1️⃣  Installing Node.js dependencies..."
    npm install --production
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo "⚠️  .env file not found!"
        echo "   Creating from .env.example..."
        cp .env.example .env
        echo "   ⚠️  IMPORTANT: Edit .env and change the credentials!"
    fi
    
    # Generate products data
    echo ""
    echo "2️⃣  Generating product data..."
    python3 generate_products.py
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo ""
        echo "3️⃣  Installing PM2..."
        npm install -g pm2
    fi
    
    # Start/Restart application
    echo ""
    echo "4️⃣  Starting application with PM2..."
    pm2 delete ges-website 2>/dev/null || true
    pm2 start server.js --name ges-website
    pm2 save
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Check status: pm2 status"
    echo "📝 View logs: pm2 logs ges-website"
    echo "🔄 Restart: pm2 restart ges-website"
    echo ""
    echo "🌐 Your website should be running on http://localhost:3000"
    echo "🔐 Admin dashboard: http://localhost:3000/admin.html"
    
else
    echo ""
    echo "📦 Local Preparation Steps:"
    echo ""
    
    # Create deployment package
    echo "1️⃣  Creating deployment package..."
    
    # Create a clean directory
    DEPLOY_DIR="../GES-deploy"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy necessary files
    echo "   Copying files..."
    cp -r catalouge "$DEPLOY_DIR/"
    cp index.html "$DEPLOY_DIR/"
    cp styles.css "$DEPLOY_DIR/"
    cp script.js "$DEPLOY_DIR/"
    cp ges_logo.png "$DEPLOY_DIR/"
    cp admin.html "$DEPLOY_DIR/"
    cp admin-styles.css "$DEPLOY_DIR/"
    cp admin-script.js "$DEPLOY_DIR/"
    cp server.js "$DEPLOY_DIR/"
    cp package.json "$DEPLOY_DIR/"
    cp generate_products.py "$DEPLOY_DIR/"
    cp .env.example "$DEPLOY_DIR/"
    cp .gitignore "$DEPLOY_DIR/"
    cp README.md "$DEPLOY_DIR/"
    cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"
    cp ADMIN_GUIDE.md "$DEPLOY_DIR/"
    
    # Create archive
    echo ""
    echo "2️⃣  Creating archive..."
    cd ..
    tar -czf GES-website.tar.gz GES-deploy/
    
    echo ""
    echo "✅ Deployment package created!"
    echo ""
    echo "📦 Package location: $(pwd)/GES-website.tar.gz"
    echo "📁 Clean directory: $(pwd)/GES-deploy/"
    echo ""
    echo "📤 Next steps:"
    echo "   1. Upload GES-website.tar.gz to your server"
    echo "   2. Extract: tar -xzf GES-website.tar.gz"
    echo "   3. Run: cd GES-deploy && bash deploy.sh"
    echo ""
fi



