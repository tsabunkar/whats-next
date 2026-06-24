#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Build and deploy the frontend to S3 + CloudFront
#
# Usage:
#   ./scripts/deploy-frontend.sh <bucket> <cf-dist-id>
#   ./scripts/deploy-frontend.sh whats-next-frontend-12345678 EXXXXXXX
#
# Pass bucket name and CloudFront distribution ID from terraform output.
# You can also set S3_BUCKET and CF_DIST_ID as env vars.
# ─────────────────────────────────────────────────────────────────────────────

BUCKET="${1:-${S3_BUCKET:-}}"
CF_ID="${2:-${CF_DIST_ID:-}}"

if [ -z "$BUCKET" ] || [ -z "$CF_ID" ]; then
  echo "Usage: $0 <s3-bucket> <cloudfront-dist-id>"
  echo "       S3_BUCKET=<bucket> CF_DIST_ID=<id> $0"
  echo ""
  echo "Get values from: terraform output frontend_bucket_name && terraform output frontend_cloudfront_id"
  exit 1
fi

cd "$(dirname "$0")/../frontend"

# Build
echo "==> Building frontend..."
VITE_API_URL="${VITE_API_URL:-}" npm run build

# Deploy
echo "==> Syncing to s3://${BUCKET} ..."
aws s3 sync dist/ "s3://${BUCKET}" --delete

echo "==> Invalidating CloudFront ${CF_ID} ..."
aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths '/*'

echo "==> Done"
