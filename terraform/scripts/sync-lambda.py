#!/usr/bin/env python3
"""
Docker Hub → ECR Sync Lambda

Triggered by Docker Hub webhook. Copies the image directly from Docker Hub
to ECR using the Docker Registry HTTP API and boto3 — no Docker daemon needed.
"""

import json
import os
import hmac
import hashlib
import requests
import boto3

DOCKER_HUB_REPO = os.environ["DOCKER_HUB_REPO"]
ECR_REPOSITORY  = os.environ["ECR_REPOSITORY"]
LAMBDA_FUNCTION = os.environ["LAMBDA_FUNCTION"]
WEBHOOK_SECRET  = os.environ.get("WEBHOOK_SECRET", "")
AWS_REGION      = os.environ.get("AWS_REGION", "us-east-1")

ecr_client = boto3.client("ecr", region_name=AWS_REGION)
lambda_client = boto3.client("lambda", region_name=AWS_REGION)

# Docker Hub anonymous auth
DOCKER_HUB = "registry-1.docker.io"
AUTH_SERVICE = "registry.docker.io"


def docker_token(scope: str) -> str:
    url = f"https://auth.docker.io/token?service={AUTH_SERVICE}&scope={scope}"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()["token"]


def docker_get(url: str, token: str) -> requests.Response:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": ", ".join([
            "application/vnd.docker.distribution.manifest.v2+json",
            "application/vnd.docker.distribution.manifest.list.v2+json",
            "application/vnd.oci.image.manifest.v1+json",
            "application/vnd.oci.image.index.v1+json",
        ]),
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp


def digest_header(resp: requests.Response) -> str:
    return resp.headers.get("Docker-Content-Digest", "")


def download_blob(url: str, token: str) -> bytes:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=120, stream=True)
    resp.raise_for_status()
    return resp.content


def upload_layer(repo_name: str, blob: bytes, digest: str):
    start = ecr_client.initiate_layer_upload(repositoryName=repo_name)
    upload_id = start["uploadId"]
    part = start.get("partSize", 0)

    ecr_client.upload_layer_part(
        repositoryName=repo_name,
        uploadId=upload_id,
        partFirstByte=0,
        partLastByte=len(blob) - 1,
        layerPartBlob=blob,
    )

    ecr_client.complete_layer_upload(
        repositoryName=repo_name,
        uploadId=upload_id,
        layerDigests=[digest],
    )


def parse_repo(repo: str) -> str:
    if "/" not in repo:
        return f"library/{repo}"
    return repo


def verify_signature(body: bytes, sig: str) -> bool:
    if not WEBHOOK_SECRET:
        return True
    expected = "sha256=" + hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


def handler(event, context):
    print(f"Event: {json.dumps(event)[:500]}")

    # ── Verify webhook ──────────────────────────────────────────────────
    headers = event.get("headers", {}) or {}
    sig = headers.get("x-hub-signature-256", "") or headers.get("X-Hub-Signature-256", "")
    body = event.get("body", "").encode()
    if not verify_signature(body, sig):
        return {"statusCode": 403, "body": "Invalid signature"}

    # ── Parse payload ───────────────────────────────────────────────────
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": "Invalid JSON"}

    tag = payload.get("push_data", {}).get("tag", "latest")
    repo_slug = parse_repo(DOCKER_HUB_REPO)
    print(f"Syncing {repo_slug}:{tag} → {ECR_REPOSITORY}")

    # ── Get Docker Hub auth token ───────────────────────────────────────
    scope = f"repository:{repo_slug}:pull"
    token = docker_token(scope)

    # ── Fetch manifest ──────────────────────────────────────────────────
    manifest_url = f"https://{DOCKER_HUB}/v2/{repo_slug}/manifests/{tag}"
    manifest_resp = docker_get(manifest_url, token)
    manifest = manifest_resp.json()

    # Handle manifest list — pick first platform
    media_type = manifest.get("mediaType", "")
    if "manifest.list" in media_type or "index" in media_type:
        print("Multi-arch manifest, picking first entry")
        entry = manifest["manifests"][0]
        manifest_digest = entry["digest"]
        manifest_resp = docker_get(
            f"https://{DOCKER_HUB}/v2/{repo_slug}/manifests/{manifest_digest}", token
        )
        manifest = manifest_resp.json()

    config_digest = manifest["config"]["digest"]
    layer_digests = [l["digest"] for l in manifest.get("layers", [])]
    print(f"Config: {config_digest}, Layers: {layer_digests}")

    # ── Download config blob ───────────────────────────────────────────
    print(f"Downloading config {config_digest}")
    config_blob = download_blob(
        f"https://{DOCKER_HUB}/v2/{repo_slug}/blobs/{config_digest}", token
    )
    upload_layer(ECR_REPOSITORY.split("/")[-1], config_blob, config_digest)

    # ── Download & upload each layer ────────────────────────────────────
    for d in layer_digests:
        print(f"Downloading layer {d}")
        blob = download_blob(
            f"https://{DOCKER_HUB}/v2/{repo_slug}/blobs/{d}", token
        )
        upload_layer(ECR_REPOSITORY.split("/")[-1], blob, d)

    # ── Push manifest to ECR ────────────────────────────────────────────
    manifest_str = json.dumps(manifest)
    repo_name = ECR_REPOSITORY.split("/")[-1]

    ecr_client.put_image(
        repositoryName=repo_name,
        imageManifest=manifest_str,
        imageTag=tag,
    )
    ecr_client.put_image(
        repositoryName=repo_name,
        imageManifest=manifest_str,
        imageTag="latest",
    )
    print("Image pushed to ECR")

    # ── Update Lambda ───────────────────────────────────────────────────
    ecr_image = f"{ECR_REPOSITORY}:{tag}"
    response = lambda_client.update_function_code(
        FunctionName=LAMBDA_FUNCTION,
        ImageUri=ecr_image,
        Publish=True,
    )
    print(f"Lambda updated: {response['FunctionArn']} (v{response['Version']})")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "status": "ok",
            "tag": tag,
            "lambda": response["FunctionArn"],
            "version": response["Version"],
        }),
    }
