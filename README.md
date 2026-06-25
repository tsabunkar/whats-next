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
# Create Terraform state bucket (one-time)
./scripts/setup-state.sh

# Deploy all AWS resources
cd terraform
terraform init
terraform apply

# Note these outputs for later use
terraform output frontend_bucket_name
terraform output frontend_cloudfront_id
terraform output sync_webhook_url
```

### 2. Store secrets

```bash
./scripts/store-secrets.sh
```

### 3. Docker Hub webhook

Configure a webhook in Docker Hub repository `tsabunkar/whats-next-backend` pointing to the `sync_webhook_url` output.

## Deploy

### Backend

```bash
./scripts/deploy-backend.sh v1.2.3
```

This builds the Docker image and pushes to Docker Hub. The Docker Hub webhook automatically triggers CodeBuild to sync the image to ECR and update the Lambda.

### Frontend

```bash
./scripts/deploy-frontend.sh <s3-bucket> <cf-dist-id>
```

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
