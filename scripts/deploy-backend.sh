#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Build and push the backend Docker image to Docker Hub
#
# Usage:
#   ./scripts/deploy-backend.sh <tag>
#   ./scripts/deploy-backend.sh v1.2.3
#
# If no tag is given, defaults to the short git SHA.
# Docker Hub webhook triggers the sync Lambda which copies the image to
# ECR and updates the Lambda function.
# ─────────────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo latest)}"
IMAGE="tsabunkar/whats-next-backend"

echo "==> Tag: ${TAG}"
echo "==> Image: ${IMAGE}:${TAG}"

# ── Build ───────────────────────────────────────────────────────────────────
echo "==> Building Docker image..."
docker build -t "${IMAGE}:${TAG}" -t "${IMAGE}:latest" "${ROOT}/backend"

# ── Push to Docker Hub ──────────────────────────────────────────────────────
echo "==> Pushing to Docker Hub..."
docker push "${IMAGE}:${TAG}"
docker push "${IMAGE}:latest"

echo "==> Done. Image ${IMAGE}:${TAG} pushed to Docker Hub."
echo "    Docker Hub webhook will trigger sync to ECR and Lambda update."
