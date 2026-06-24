# ---------------------------------------------------------------------------
# Terraform configuration for What's Next — Career Oracle
# Deploys frontend (S3+CloudFront) and backend (Lambda container + API Gateway)
# with Docker Hub → ECR sync and GitOps-style CD
# ---------------------------------------------------------------------------

terraform {
  required_version = ">= 1.6"

  backend "s3" {
    bucket       = "whats-next-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "whats-next"
      ManagedBy = "terraform"
    }
  }
}

# ---------------------------------------------------------------------------
# Local variables
# ---------------------------------------------------------------------------
locals {
  project_name    = "whats-next"
  backend_name    = "${local.project_name}-backend"
  frontend_name   = "${local.project_name}-frontend"
  sync_name       = "${local.project_name}-sync"
  image_tag       = var.image_tag == "" ? "latest" : var.image_tag
  docker_hub_repo = "tsabunkar/${local.backend_name}"
}
