# What's Next — Career Oracle

A flash-card career-discovery quiz with 3D card transitions, growing tree progress visualization, Vedic astrology overlay, and live salary data via Adzuna.

## Architecture

### High-Level

```
┌──────────────────────────┐     ┌───────────────────────────────┐
│  Developer                │     │  Docker Hub                   │
│  ./scripts/deploy-*.sh    │────►│  tsabunkar/whats-next-backend │
└────────┬────────┬─────────┘     └───────────────┬───────────────┘
         │        │                               │ webhook
         │        │                               ▼
         │        │                      ┌──────────────────┐
         │        │                      │  CloudFront      │
         │        │                      │  (webhook)       │
         │        │                      └────────┬─────────┘
         │        │                               │
         │        │                               ▼
         │        │                      ┌──────────────────┐
         │        │                      │  API Gateway     │
         │        │                      │  (REGIONAL)      │
         │        │                      │  POST /webhook   │
         │        │                      └────────┬─────────┘
         │        │                               │ VTL template
         │        │                               ▼
         │        │                      ┌──────────────────┐
         │        │                      │  SQS             │
         │        │                      │  webhook-sync    │
         │        │                      └────────┬─────────┘
         │        │                               │ event source
         │        │                               ▼
         │        │                      ┌──────────────────┐
         │        │                      │  Worker Lambda   │
         │        │                      │  (Go)            │
         │        │                      └────────┬─────────┘
         │        │                               │
         ▼        ▼                               ▼
┌──────────────────┐                     ┌──────────────────┐
│  S3 + CloudFront │                     │  ECR Repository  │
│  Frontend (SPA)  │                     └────────┬─────────┘
└──────────────────┘                              │
                                                  ▼
                                        ┌──────────────────┐
                                        │  Backend Lambda  │
                                        │  (Container)     │
                                        └──────────────────┘
```

### Low-Level

```
                              ┌──────────────────────────────┐
                              │  CloudFront (webhook)        │
                              │  d129g49hz04mtl.cloudfront.  │
                              │  net/webhook                  │
                              │  Origin: API Gateway /prod    │
                              │  Forwards: Content-Type,      │
                              │  Content-Length, User-Agent  │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Gateway REST API (REGIONAL)                                │
│  POST /webhook → aws_api_gateway_integration.type = "AWS"       │
│                                                                  │
│  VTL Request Template:                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #set($repoName = $input.path('$.repository.repo_name')) │    │
│  │ #set($tag = $input.path('$.push_data.tag'))             │    │
│  │ #if ($tag == '')                                        │    │
│  │ #set($tag = 'latest')                                   │    │
│  │ #end                                                     │    │
│  │ Action=SendMessage&MessageBody=                          │    │
│  │   $util.urlEncode("{""repo_name"":""$repoName"",        │    │
│  │     ""tag"":""$tag""}")                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Response: 202 {"status":"accepted"}                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ sqs:SendMessage
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SQS Queue (whats-next-webhook-sync)                            │
│  - Visibility timeout: 300s                                     │
│  - Message retention: 86400s (1 day)                            │
│  - Receive wait time: 20s (long polling)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQS event source mapping (batch_size=1)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Worker Lambda (whats-next-sync-worker)                         │
│  - Runtime: provided.al2 (Go)                                   │
│  - Timeout: 300s, Memory: 512MB                                 │
│  - Env: ECR_REPOSITORY_URI, TARGET_LAMBDA_NAME,                 │
│         DOCKER_USERNAME, DOCKER_PASSWORD                        │
│                                                                  │
│  Flow:                                                           │
│  1. Parse SQS message body as SyncPayload                        │
│  2. Validate repo_name == "tsabunkar/whats-next-backend"         │
│  3. Pull image from Docker Hub                                   │
│  4. Push image to ECR with same tag                              │
│  5. Update backend Lambda function code to new image URI         │
└──────────────────────┬───────────┬──────────────────────────────┘
                       │           │
                       ▼           ▼
            ┌─────────────────┐   ┌──────────────────────┐
            │  ECR Repository │   │  Backend Lambda      │
            │  whats-next-    │   │  whats-next-backend-  │
            │  backend        │   │  lambda (container)   │
            └─────────────────┘   └──────────────────────┘
```

### Key Design Decisions

- **No sync Lambda**: API Gateway's VTL template integrates directly with SQS via `type="AWS"`, eliminating a cold-start-prone intermediary Lambda.
- **CloudFront as reverse proxy for API Gateway**: Docker Hub's webhook failed to reach API Gateway
  directly due to a TLS SNI handshake issue. The fix and reasoning:
  1. **`execute-api.amazonaws.com` is multi-tenant** — AWS hosts millions of APIs on one domain.
     The TLS handshake requires the client to send an SNI header naming your specific API ID.
  2. **curl sends the correct SNI** — your terminal resolves the right hostname and completes
     the handshake. Direct API Gateway calls work from your machine.
  3. **Docker Hub's webhook client does not** — it's an older HTTP client that fails the SNI
     handshake. It never sends an HTTP request (Docker Hub shows `Code: N/A`, meaning no HTTP
     response was ever received).
  4. **CloudFront provides a clean TLS endpoint** — `*.cloudfront.net` is single-tenant per
     distribution. Docker Hub's client handshakes perfectly with CloudFront, which then forwards
     the request to API Gateway as an internal AWS call, bypassing the public SNI requirement.
  5. **Verified by access logs** — API Gateway logs showed zero requests from Docker Hub IPs
     hitting the direct URL. After adding CloudFront, logs confirmed successful requests arriving
     via the CloudFront distribution.
- **REGIONAL endpoint**: API Gateway is set to REGIONAL (not EDGE) — CloudFront handles CDN/edge termination.
- **Payload validation in VTL**: `repo_name` is validated in the VTL template; non-matching repos are still sent to SQS as lightweight messages so the worker can log and skip them.
- **Worker Lambda does heavy lifting**: Pulls Docker image via `go-containerregistry`, pushes to ECR, then updates the backend Lambda — all in one function with 5-minute timeout.

## Infrastructure (Terraform)

All AWS resources are defined in `terraform/main.tf`:

### Frontend
- **S3 bucket** (`whats-next-frontend-bucket`) — static file hosting
- **CloudFront distribution** — CDN with origin access identity for S3 access
- **S3 bucket policy** — restricts access to CloudFront only

### Backend
- **ECR repository** (`whats-next-backend`) — stores container images
- **Backend Lambda** — container-based Go function serving the API
- **Worker Lambda** — Go function triggered by SQS, syncs Docker Hub → ECR → updates backend Lambda
- **SQS queue** (`whats-next-webhook-sync`) — decouples webhook reception from image sync

### Webhook Pipeline
- **API Gateway REST API** (REGIONAL) — webhook endpoint
- **VTL request template** — transforms Docker Hub JSON to SQS `SendMessage` form body
- **CloudFront distribution** — reverse proxy in front of API Gateway for Docker Hub network compatibility
- **IAM roles** — `api-gateway-sqs` (SendMessage), `lambda` (ReceiveMessage/DeleteMessage + ECR + Lambda update)

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
terraform output webhook_cloudfront_url
```

### 2. Build Lambda Functions

```bash
# Build and package Lambda functions
make build-lambdas
make package-lambdas

# The zip files are created in terraform/:
#   lambda_worker.zip   → whats-next-sync-worker
#   lambda_backend.zip  → (placeholder; actual image comes via ECR)
```

Terraform's `filebase64sha256` on the zip triggers a Lambda update when the binary changes.

### 3. Store secrets

```bash
# Store Docker Hub credentials (used by Worker Lambda)
aws ssm put-parameter --name /whats-next/docker-username --value "<your-username>" --type SecureString
aws ssm put-parameter --name /whats-next/docker-password --value "<your-password>" --type SecureString
```

Or update the Terraform variables `docker_username` / `docker_password` directly before `terraform apply`.

### 4. Configure Docker Hub webhook

1. Go to Docker Hub → `tsabunkar/whats-next-backend` → Webhooks
2. Add a webhook with URL: `https://d129g49hz04mtl.cloudfront.net/webhook`
   (replace with your `webhook_cloudfront_url` output)

## Deploy

### Backend

```bash
./scripts/deploy-backend.sh
```

This builds the Docker image with tag `v2` and pushes to Docker Hub. The webhook automatically triggers the sync pipeline.

#### Incrementing tags

Edit `scripts/deploy-backend.sh` to change the tag, or run manually:

```bash
cd backend
docker build -t tsabunkar/whats-next-backend:v3 .   # increment tag
docker push tsabunkar/whats-next-backend:v3
```

The Worker Lambda pulls the new tag from Docker Hub and deploys it to ECR and the backend Lambda.

**Recommended tag scheme**: use semantic versioning: `v1.0.0`, `v1.1.0`, `v2.0.0`, etc. Each push to Docker Hub triggers the sync for that exact tag.

**To roll back**: push a previous tag (e.g. `v1.0.0`) again — the webhook syncs and redeploys that version.

### Frontend

```bash
export S3_BUCKET=$(cd terraform && terraform output -raw frontend_bucket_name)
export CF_DIST_ID=$(cd terraform && terraform output -raw frontend_cloudfront_id)
./scripts/deploy-frontend.sh
```

This builds the React SPA, syncs to S3, and creates a CloudFront invalidation.

### Check Deployment Status

```bash
./scripts/check-deployment.sh
```

Shows the CloudFront domain, webhook URL, and ECR repository URL.

### Monitor Sync

```bash
# Watch Worker Lambda logs in real-time
aws logs tail /aws/lambda/whats-next-sync-worker --follow

# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url $(cd terraform && terraform output -raw webhook_sqs_queue_url) \
  --attribute-names ApproximateNumberOfMessages
```

## Rollback

Push a previous image tag to Docker Hub — the webhook triggers the sync pipeline which redeploys the backend Lambda to that tag.

Alternatively, manually update the backend Lambda:
```bash
aws lambda update-function-code \
  --function-name whats-next-backend-lambda \
  --image-uri 494039644227.dkr.ecr.us-east-1.amazonaws.com/whats-next-backend:<tag>
```

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

lambda/           # Lambda function code
  worker/         # Go — image sync (Docker Hub → ECR → Lambda)
  backend/        # Go — API server container image

terraform/        # AWS infra as code
  *.tf            # all resources (main.tf, variables.tf)

scripts/          # deployment automation
  deploy-backend.sh     # build + push to Docker Hub
  deploy-frontend.sh    # build + sync to S3 + CF invalidation
  check-deployment.sh   # show current URLs and statuses
```
