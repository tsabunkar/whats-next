#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Build and push the backend Docker image to Docker Hub
#
# Also updates deploy/config.yaml with the new tag and commits it to Git so
# the Argo CD-style reconciler can pick it up. Docker Hub webhook triggers
# the sync Lambda which copies the image to ECR and updates the Lambda.
#
# Usage:
#   ./scripts/deploy-backend.sh <tag>
#   ./scripts/deploy-backend.sh v1.2.3
#
# If no tag is given, defaults to the short git SHA.
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

# ── Update deploy/config.yaml ────────────────────────────────────────────────
CONFIG="${ROOT}/deploy/config.yaml"
if [ -f "${CONFIG}" ]; then
  echo "==> Updating deploy/config.yaml with tag ${TAG}..."

  # Use sed to replace the tag line (portable across macOS and Linux)
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s/^  tag:.*/  tag: ${TAG}/" "${CONFIG}"
  else
    sed -i "s/^  tag:.*/  tag: ${TAG}/" "${CONFIG}"
  fi

  if git -C "${ROOT}" diff --quiet "${CONFIG}" 2>/dev/null; then
    echo "    No changes to commit."
  else
    git -C "${ROOT}" add "${CONFIG}"
    git -C "${ROOT}" commit -m "deploy: ${TAG}"
    echo "    Config committed. Run 'git push' to publish the update."
    echo "    (The reconciler will pick this up and ensure convergence.)"
  fi
else
  echo "WARN:  ${CONFIG} not found — skipping deploy config update."
fi

echo "==> Done. Image ${IMAGE}:${TAG} pushed to Docker Hub."
echo "    Docker Hub webhook will trigger sync to ECR and Lambda update."
