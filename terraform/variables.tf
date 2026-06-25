variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Custom domain for CloudFront (optional)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront custom domain"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Docker image tag to deploy (from Docker Hub / ECR)"
  type        = string
  default     = "latest"
}

variable "adzuna_app_id" {
  description = "Adzuna API App ID (optional — fetched from SSM Parameter Store at runtime)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "adzuna_app_key" {
  description = "Adzuna API App Key (optional — fetched from SSM Parameter Store at runtime)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "docker_hub_webhook_secret" {
  description = "Secret for Docker Hub webhook authentication"
  type        = string
  sensitive   = true
  default     = ""
}


