#!/usr/bin/env python3
"""
Docker Hub → ECR Sync Lambda

Triggered by Docker Hub webhook. Starts a CodeBuild project that pulls the
image from Docker Hub, pushes it to Amazon ECR, and updates the backend
Lambda function to use the new image.

Lambda cannot run Docker daemon directly, so CodeBuild handles the actual
docker pull/tag/push/update operations.
"""

import os
import json
import hmac
import hashlib
import boto3

CODEBUILD_PROJECT  = os.environ["CODEBUILD_PROJECT"]
DOCKER_HUB_REPO    = os.environ["DOCKER_HUB_REPO"]
ECR_REPOSITORY     = os.environ["ECR_REPOSITORY"]
LAMBDA_FUNCTION    = os.environ["LAMBDA_FUNCTION"]
WEBHOOK_SECRET     = os.environ.get("WEBHOOK_SECRET", "")
AWS_REGION         = os.environ.get("AWS_REGION", "us-east-1")

codebuild_client = boto3.client("codebuild", region_name=AWS_REGION)
lambda_client    = boto3.client("lambda", region_name=AWS_REGION)


def verify_signature(body: bytes, signature_header: str) -> bool:
    """Verify Docker Hub webhook signature using HMAC-SHA256."""
    if not WEBHOOK_SECRET:
        return True
    digest = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    expected = f"sha256={digest}"
    return hmac.compare_digest(expected, signature_header)


def handler(event, context):
    print(f"Received event: {json.dumps(event)[:500]}...")

    # --- Verify webhook signature ---
    headers = event.get("headers", {}) or {}
    signature = (
        headers.get("x-hub-signature-256", "")
        or headers.get("X-Hub-Signature-256", "")
    )
    body = event.get("body", "").encode()
    if not verify_signature(body, signature):
        return {"statusCode": 403, "body": "Invalid signature"}

    # --- Parse webhook payload ---
    try:
        payload = json.loads(body.decode() if isinstance(body, bytes) else body)
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": "Invalid JSON"}

    push_data = payload.get("push_data", {})
    tag = push_data.get("tag", "latest")
    print(f"Syncing tag: {tag}")

    # --- Start CodeBuild project ---
    try:
        response = codebuild_client.start_build(
            projectName=CODEBUILD_PROJECT,
            environmentVariablesOverride=[
                {"name": "TAG", "value": tag, "type": "PLAINTEXT"},
            ],
        )
        build_id = response["build"]["id"]
        print(f"CodeBuild started: {build_id}")
    except Exception as e:
        print(f"Failed to start CodeBuild: {e}")
        # Fallback: update Lambda with existing ECR image if already synced
        try:
            ecr_image = f"{ECR_REPOSITORY}:{tag}"
            lambda_response = lambda_client.update_function_code(
                FunctionName=LAMBDA_FUNCTION,
                ImageUri=ecr_image,
                Publish=True,
            )
            print(f"Lambda updated via fallback: {lambda_response['FunctionArn']}")
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "status": "fallback",
                    "tag": tag,
                    "lambda": lambda_response["FunctionArn"],
                    "version": lambda_response["Version"],
                }),
            }
        except Exception as fallback_error:
            print(f"Fallback also failed: {fallback_error}")
            return {
                "statusCode": 500,
                "body": json.dumps({"status": "error", "error": str(e)}),
            }

    return {
        "statusCode": 200,
        "body": json.dumps({
            "status": "ok",
            "tag": tag,
            "codebuild": build_id,
        }),
    }
