# Terraform Infrastructure

This directory contains the Terraform configuration for deploying the Whats Next application infrastructure.

## Architecture Overview

The infrastructure consists of:

1. **Frontend**:
   - S3 bucket for static file hosting
   - CloudFront CDN for content delivery
   - CloudFront origin access identity for secure S3 access

2. **Backend**:
   - ECR repository for Docker images
   - Sync Lambda function that handles Docker Hub webhooks
   - Backend Lambda function that serves the API
   - API Gateway for webhook endpoint

## Deployment Process

1. **Frontend Deployment**:
   - Build the frontend: `npm run build`
   - Sync to S3: `aws s3 sync dist/ s3://$S3_BUCKET`
   - Invalidate CloudFront: `aws cloudfront create-invalidation`

2. **Backend Deployment**:
   - Build Docker image: `docker build -t tsabunkar/whats-next-backend .`
   - Push to Docker Hub: `docker push tsabunkar/whats-next-backend`
   - Docker Hub webhook triggers sync Lambda
   - Sync Lambda pulls image from Docker Hub and pushes to ECR
   - Sync Lambda updates backend Lambda with new ECR image

## Prerequisites

- AWS CLI configured
- Terraform installed
- Docker installed (for backend deployment)
- Node.js and npm (for frontend deployment)

## Setup

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Plan the infrastructure:
   ```bash
   terraform plan
   ```

3. Apply the infrastructure:
   ```bash
   terraform apply
   ```

## Outputs

After applying, Terraform will provide several outputs:

- `frontend_bucket_name`: S3 bucket name for frontend hosting
- `frontend_cloudfront_id`: CloudFront distribution ID
- `frontend_cloudfront_domain`: CloudFront domain name
- `backend_ecr_repository_url`: ECR repository URL
- `webhook_url`: Webhook URL for Docker Hub integration

## Deployment Scripts

- `scripts/deploy-frontend.sh`: Deploys the frontend to S3 and invalidates CloudFront
- `scripts/deploy-backend.sh`: Builds and pushes the backend Docker image to Docker Hub

The Lambda functions are built separately using the Makefile:
- `make build-lambda-sync`: Builds the sync Lambda function
- `make build-lambda-backend`: Builds the backend Lambda function
- `make package-lambda-sync`: Packages the sync Lambda function
- `make package-lambda-backend`: Packages the backend Lambda function