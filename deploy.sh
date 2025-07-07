#!/bin/bash

# Job Tracker - DigitalOcean Deployment Script
# This script deploys the application to DigitalOcean via SSH

set -e

echo "🚀 Starting deployment to DigitalOcean..."

# Configuration
SERVER_IP="167.172.85.216"
SERVER_USER="root"
APP_DIR="/opt/job-tracker"
REPO_URL="https://github.com/your-username/job-tracker.git"  # Update this with your actual repo URL

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
required_vars=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "JWT_SECRET" "CORS_ORIGIN" "NEXT_PUBLIC_API_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Test SSH connection
echo "🔐 Testing SSH connection to $SERVER_IP..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    echo "❌ Error: Cannot connect to $SERVER_IP via SSH"
    echo "Please ensure:"
    echo "  1. Your SSH key is added to the server"
    echo "  2. SSH key is loaded in your SSH agent (ssh-add ~/.ssh/your_key)"
    echo "  3. The server is running and accessible"
    exit 1
fi

echo "✅ SSH connection successful"

# Create deployment directory on server
echo "📁 Setting up deployment directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR"

# Copy files to server
echo "📤 Copying files to server..."
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='dist' . $SERVER_USER@$SERVER_IP:$APP_DIR/

# Copy environment files
echo "📤 Copying environment configuration..."
scp .env $SERVER_USER@$SERVER_IP:$APP_DIR/.env
scp frontend/.env $SERVER_USER@$SERVER_IP:$APP_DIR/frontend/.env

# Deploy on server
echo "🏗️  Building and starting containers on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
cd $APP_DIR

# Install Docker and Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Build and start containers
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Deployment successful on server!"
    echo "📊 Service status:"
    docker-compose -f docker-compose.prod.yml ps
else
    echo "❌ Deployment failed. Checking logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi
EOF

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Your application should be available at: $NEXTAUTH_URL"
    echo "📊 Check service status: ssh $SERVER_USER@$SERVER_IP 'cd $APP_DIR && docker-compose -f docker-compose.prod.yml ps'"
    echo "📋 View logs: ssh $SERVER_USER@$SERVER_IP 'cd $APP_DIR && docker-compose -f docker-compose.prod.yml logs -f'"
else
    echo "❌ Deployment failed!"
    exit 1
fi 