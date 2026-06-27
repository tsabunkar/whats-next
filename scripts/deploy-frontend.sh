#!/bin/bash

# Exit on any error
set -e

echo "Building frontend..."
cd frontend
VITE_API_URL="${VITE_API_URL:-$(cd ../terraform && terraform output -raw backend_function_url | sed 's|/$||')}" npm run build

echo "Syncing to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"

echo "Frontend deployment complete!"