# What's Next — Career Oracle

A flash-card career-discovery quiz with 3D card transitions, growing tree progress visualization, Vedic astrology overlay, and live salary data via Adzuna.

## Architecture

```
┌──────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  S3 + CF     │   │  Lambda (Go)         │   │  Docker Hub  │
│  Frontend    │◄──│  API Gateway HTTP API │◄──│  (source)    │
│  (React SPA) │   │  Container Image     │   │              │
└──────────────┘   └──────────┬───────────┘   └──────┬───────┘
                              │                       │
                              │                webhook│
                              │                       ▼
                              │              ┌──────────────┐
                              │              │ API Gateway  │
                              │              │ + Lambda     │
                              │              │ (sync)       │
                              │              └──────┬───────┘
                              │                     │
                              │                     │
                              ▼                     ▼
                        ┌──────────────────────────────┐
                        │        ECR Repository        │
                        └──────────────────────────────┘
```

### Latest Deployment Strategy not directly from local to ECR rather dockerhub -> sync lambda -> ECR -> career-match lambda

```
                     ┌─────────────────────────┐
                     │  Developer              │
                     │  ./scripts/deploy-*.sh  │
                     └────┬──────────┬─────────┘
                          │          │
               ┌──────────┘          └──────────┐
               ▼                                  ▼
     ┌─────────────────┐              ┌──────────────────────┐
     │  Frontend       │              │  Backend             │
     │  npm run build  │              │  docker build        │
     │  dist/          │              │  docker push         │
     └────────┬────────┘              │  → Docker Hub        │
              │                       └──────────┬───────────┘
              ▼                                  │ webhook
     ┌─────────────────┐                         ▼
     │  aws s3 sync    │              ┌──────────────────────┐
     │  dist/ → S3     │              │  API Gateway        │
     └────────┬────────┘              │  POST /webhook      │
              │                       └──────────┬───────────┘
              ▼                                  │
     ┌─────────────────┐                         ▼
     │  CloudFront     │              ┌──────────────────────┐
     │  invalidation   │              │  Sync Lambda         │
     │  /*             │              │                      │
     └─────────────────┘              │  1. Auth with        │
                                      │     Docker Hub       │
                                      │  2. Download manifest│
                                      │  3. Download layers  │
                                      │  4. Upload to ECR    │
                                      │  5. Push manifest    │
                                      │  6. Update Lambda    │
                                      └──────────┬───────────┘
                                                 │
                                     ┌───────────┴───────────┐
                                     ▼                       ▼
                           ┌─────────────────┐     ┌─────────────────┐
                           │  ECR            │     │  Lambda (Go)    │
                           │  Container      │────►│  API Gateway    │
                           │  Image          │     │  Career Match   │
                           └─────────────────┘     └─────────────────┘
```

- **Frontend**: React SPA (Vite, TypeScript, Tailwind, framer-motion) — static files in S3 + CloudFront
- **Backend**: Go binary in Docker → Lambda container (via ECR) — API Gateway HTTP API
- **Sync**: Docker Hub webhook → API Gateway → Lambda → CodeBuild → ECR → Lambda deploy

## New Terraform Infrastructure

We've implemented a complete Terraform infrastructure for the deployment process described above. The setup includes:

1. **Frontend Infrastructure**:
   - S3 bucket for static file hosting
   - CloudFront CDN for content delivery
   - CloudFront origin access identity for secure S3 access

2. **Backend Infrastructure**:
   - ECR repository for Docker images
   - Sync Lambda function that handles Docker Hub webhooks
   - Backend Lambda function that serves the API
   - API Gateway for webhook endpoint

3. **Security**:
   - IAM roles and policies for Lambda functions
   - Secure S3 bucket policies
   - Proper API Gateway configuration

## Prerequisites

- Node 16+
- Go 1.22+
- Docker
- AWS CLI configured with credentials
- Terraform 1.6+
- Docker Hub account (`tsabunkar`)

## Setup

### 1. Infrastructure

```bash
# Deploy all AWS resources using Terraform
cd terraform
terraform init
terraform apply

# Note these outputs for later use
terraform output frontend_bucket_name
terraform output frontend_cloudfront_id
terraform output webhook_url
```

### 2. Build Lambda Functions

```bash
# Build and package Lambda functions
make build-lambdas
make package-lambdas
```

Note: You'll need to manually upload the packaged Lambda functions (`lambda_sync.zip` and `lambda_backend.zip`) to AWS before the first deployment, or use the `lambda_function_filename` and `source_code_hash` attributes in the Terraform configuration.

### 2. Store secrets

```bash
./scripts/store-secrets.sh
```

### 3. Docker Hub webhook

Configure a webhook in Docker Hub repository `tsabunkar/whats-next-backend` pointing to the `sync_webhook_url` output.

## Deploy

The deployment process is now fully automated:

### Backend

```bash
npm run deploy:backend
```

This builds the Docker image and pushes to Docker Hub. The Docker Hub webhook automatically triggers the sync Lambda to sync the image to ECR and update the backend Lambda.

### Frontend

```bash
npm run deploy:frontend
```

This automatically gets the required Terraform outputs, builds the frontend, syncs to S3, and creates a CloudFront invalidation.

### Check Deployment Status

```bash
./scripts/check-deployment.sh
```

This shows the CloudFront domain, webhook URL, and ECR repository URL.

### Rollback

Push a previous image tag to Docker Hub — the webhook triggers CodeBuild which redeploys the Lambda.

## Local dev

```bash
# Backend
cd backend
cp .env.example .env   # fill in Adzuna credentials
docker compose up

# Frontend (separate terminal)
cd frontend
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

## Project layout

```
backend/          # Go Lambda backend
  cmd/server/     # entry point
  internal/       # handlers, compute engine, providers
  data/           # careers.json

frontend/         # React SPA
  src/pages/      # Landing, Quest, Astrology, Results
  src/components/ # GrowingTree, etc.
  src/store/      # Zustand quest store

terraform/        # AWS infra as code
  scripts/        # Lambda handlers + CodeBuild buildspec
  *.tf            # resources

scripts/          # deployment automation
  setup-state.sh       # create S3 state bucket
  store-secrets.sh     # store Adzuna creds in SSM Parameter Store
  deploy-backend.sh    # build + push to Docker Hub
  deploy-frontend.sh   # build + sync to S3 + CF invalidation
```
