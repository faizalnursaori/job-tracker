#!/bin/bash

# Job Tracker - DigitalOcean Deployment Script
# This script deploys the application to DigitalOcean

set -e

echo "🚀 Starting deployment to DigitalOcean..."

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

# Build and deploy with docker-compose
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo "🌐 Your application should be available at: $NEXTAUTH_URL"
    echo "📊 Check service status: docker-compose -f docker-compose.prod.yml ps"
    echo "📋 View logs: docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "❌ Deployment failed. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi 