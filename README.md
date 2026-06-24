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
                              │              CodeBuild
                              │           (pull + push)
                              │                     │
                              ▼                     ▼
                        ┌──────────────────────────────┐
                        │        ECR Repository        │
                        └──────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  GitOps Reconciler (runs every 5 min via EventBridge)       │
  │  Reads deploy/config.yaml → ensures Lambda matches the tag  │
  └──────────────────────────────────────────────────────────────┘
```

- **Frontend**: React SPA (Vite, TypeScript, Tailwind, framer-motion) — static files in S3 + CloudFront
- **Backend**: Go binary in Docker → Lambda container (via ECR) — API Gateway HTTP API
- **Sync**: Docker Hub webhook → API Gateway → Lambda → CodeBuild → ECR → Lambda deploy
- **GitOps**: `deploy/config.yaml` is source of truth; reconciler converges within 5 min

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

### 2. Docker Hub webhook

Configure a webhook in Docker Hub repository `tsabunkar/whats-next-backend` pointing to the `sync_webhook_url` output.

## Deploy

### Backend

```bash
./scripts/deploy-backend.sh v1.2.3
```

This builds the Docker image, pushes to Docker Hub, updates `deploy/config.yaml`, and commits to Git. The Docker Hub webhook automatically triggers CodeBuild to sync the image to ECR and update the Lambda. The reconciler confirms convergence within 5 minutes.

### Frontend

```bash
VITE_API_URL=https://your-api-url.execute-api.us-east-1.amazonaws.com \
  ./scripts/deploy-frontend.sh
```

The script reads the S3 bucket and CloudFront distribution ID from Terraform outputs, builds the frontend, syncs to S3, and invalidates the CloudFront cache.

### Rollback

```bash
# Edit deploy/config.yaml, set tag to the previous version
git add deploy/config.yaml && git commit -m "rollback to v1.2.2"
git push
# Reconciler Lambda picks up the change and redeploys within 5 min
```

## Local dev

```bash
# Backend
cd backend
cp .env.example .env   # fill in Adzuna credentials
docker-compose up

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

deploy/           # GitOps config
  config.yaml     # desired state (Argo CD source of truth)

scripts/          # deployment automation
  setup-state.sh       # create S3 state bucket
  deploy-backend.sh    # build + push to Docker Hub
  deploy-frontend.sh   # build + sync to S3 + CF invalidation
```
