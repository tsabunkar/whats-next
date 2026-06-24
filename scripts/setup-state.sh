#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Bootstrap the S3 state backend for Terraform
#
# Creates the S3 bucket referenced in main.tf's backend "s3" block.
# Locking uses Terraform 1.6+ native S3 file locking (use_lockfile = true),
# so no DynamoDB table is needed.
#
# Usage:
#   ./scripts/setup-state.sh [bucket-name] [region]
#
# Defaults:
#   bucket = whats-next-terraform-state
#   region = us-east-1
# ─────────────────────────────────────────────────────────────────────────────

BUCKET="${1:-whats-next-terraform-state}"
REGION="${2:-us-east-1}"

echo "==> Creating S3 bucket: ${BUCKET}"
if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "    Bucket already exists, skipping."
else
  if [ "${REGION}" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}"
  else
    aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}"
  fi

  aws s3api put-bucket-versioning \
    --bucket "${BUCKET}" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "${BUCKET}" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

  echo "    Bucket created and configured."
fi

echo "==> Done. You can now run: terraform init"
