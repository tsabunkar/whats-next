#!/bin/bash

# Exit on any error
set -e

echo "Building Docker image..."
cd backend
docker build -t tsabunkar/whats-next-backend:v2 .

echo "Pushing to Docker Hub..."
docker push tsabunkar/whats-next-backend:v2

echo "Backend image pushed to Docker Hub!"
echo "The sync lambda will be triggered via webhook to sync to ECR."