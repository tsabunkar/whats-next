#!/bin/bash

echo "Checking deployment status..."

echo "Frontend CloudFront domain:"
cd terraform && terraform output -raw frontend_cloudfront_domain

echo ""
echo "Webhook URL (for Docker Hub configuration):"
terraform output -raw webhook_url

echo ""
echo "Backend ECR repository URL:"
terraform output -raw backend_ecr_repository_url

echo ""
echo "To configure Docker Hub webhook:"
echo "1. Go to Docker Hub repository settings"
echo "2. Add a webhook pointing to the URL above"
echo "3. Whenever you push to Docker Hub, the sync lambda will automatically update ECR and the backend Lambda"