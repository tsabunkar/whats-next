#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Store Adzuna API credentials in AWS SSM Parameter Store (SecureString)
#
# Run this after terraform apply so Lambda can fetch credentials at runtime.
# Values are never written to git, Terraform state, or env vars in Lambda.
#
# Usage:
#   ./scripts/store-secrets.sh
#   ADZUNA_APP_ID=xxx ADZUNA_APP_KEY=yyy ./scripts/store-secrets.sh
#
# If env vars are not set, prompts for input.
# ─────────────────────────────────────────────────────────────────────────────

REGION="${AWS_REGION:-us-east-1}"

ADZUNA_APP_ID="${ADZUNA_APP_ID:-}"
ADZUNA_APP_KEY="${ADZUNA_APP_KEY:-}"

if [ -z "$ADZUNA_APP_ID" ]; then
  read -r -p "Adzuna App ID: " ADZUNA_APP_ID
fi

if [ -z "$ADZUNA_APP_KEY" ]; then
  read -r -s -p "Adzuna App Key: " ADZUNA_APP_KEY
  echo
fi

echo "==> Storing /whats-next/adzuna/app-id ..."
aws ssm put-parameter \
  --name "/whats-next/adzuna/app-id" \
  --value "$ADZUNA_APP_ID" \
  --type SecureString \
  --overwrite \
  --region "$REGION"

echo "==> Storing /whats-next/adzuna/app-key ..."
aws ssm put-parameter \
  --name "/whats-next/adzuna/app-key" \
  --value "$ADZUNA_APP_KEY" \
  --type SecureString \
  --overwrite \
  --region "$REGION"

echo "==> Done. Secrets stored in SSM Parameter Store."
