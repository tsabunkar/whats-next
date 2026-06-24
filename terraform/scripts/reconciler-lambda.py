#!/usr/bin/env python3
"""
Argo CD-style GitOps Reconciler for Lambda

Periodically checks the GitOps repo's deploy/config.yaml for the desired
image tag and reconciles the Lambda function if it doesn't match.

Runs every 5 minutes via EventBridge schedule.
"""

import os
import json
import base64
import urllib.request
import urllib.error
import boto3

GITHUB_REPO      = os.environ["GITHUB_REPO"]
CONFIG_FILE_PATH = os.environ.get("CONFIG_FILE_PATH", "deploy/config.yaml")
GITHUB_TOKEN     = os.environ.get("GITHUB_TOKEN", "")
LAMBDA_FUNCTION  = os.environ["LAMBDA_FUNCTION"]
AWS_REGION       = os.environ.get("AWS_REGION", "us-east-1")

lambda_client = boto3.client("lambda", region_name=AWS_REGION)


def fetch_desired_tag() -> str | None:
    """Fetch the desired image tag from the GitOps deploy config."""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{CONFIG_FILE_PATH}"
    headers = {
        "Accept": "application/vnd.github.v3.raw",
        "User-Agent": "whats-next-reconciler",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode()
            for line in content.splitlines():
                line = line.strip()
                if line.startswith("tag:"):
                    return line.split(":", 1)[1].strip().strip('"').strip("'")
            return None
    except urllib.error.HTTPError as e:
        print(f"Failed to fetch config: {e.code} {e.reason}")
        return None


def get_current_image_tag() -> str | None:
    """Get the currently deployed image tag from the Lambda function."""
    try:
        response = lambda_client.get_function_configuration(
            FunctionName=LAMBDA_FUNCTION
        )
        # Image URI is like: <account>.dkr.ecr.<region>.amazonaws.com/<repo>:<tag>
        image_uri = response.get("ImageUri", "")
        if ":" in image_uri:
            return image_uri.split(":")[-1]
        return None
    except Exception as e:
        print(f"Failed to get Lambda config: {e}")
        return None


def reconcile():
    desired_tag = fetch_desired_tag()
    if not desired_tag:
        print("No desired tag found in deploy config")
        return

    current_tag = get_current_image_tag()
    print(f"Desired: {desired_tag}, Current: {current_tag}")

    if desired_tag == current_tag:
        print("Already reconciled — no action needed")
        return

    # Get the ECR image URI
    ecr_client = boto3.client("ecr", region_name=AWS_REGION)
    response = lambda_client.get_function_configuration(
        FunctionName=LAMBDA_FUNCTION
    )
    image_uri = response.get("ImageUri", "")
    repo_uri = image_uri.rsplit(":", 1)[0] if ":" in image_uri else image_uri
    new_image_uri = f"{repo_uri}:{desired_tag}"

    print(f"Reconciling Lambda to image: {new_image_uri}")
    response = lambda_client.update_function_code(
        FunctionName=LAMBDA_FUNCTION,
        ImageUri=new_image_uri,
        Publish=True,
    )
    print(f"Lambda updated to {response['FunctionArn']} (version {response['Version']})")


def handler(event, context):
    print(f"Reconciler triggered by: {event.get('source', 'schedule')}")
    reconcile()
    return {"statusCode": 200, "body": "ok"}


if __name__ == "__main__":
    reconcile()
