#!/bin/bash

# Exit on any error
set -e

echo "Building frontend..."
cd frontend
npm run build

echo "Syncing to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"

echo "Frontend deployment complete!"