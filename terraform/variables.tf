variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "whats-next"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
  default     = "whats-next-frontend-bucket"
}

variable "backend_ecr_repository_name" {
  description = "Name of the ECR repository for backend images"
  type        = string
  default     = "whats-next-backend"
}

variable "docker_username" {
  description = "Docker Hub username for pulling images (optional for public repos)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "docker_password" {
  description = "Docker Hub password or token for pulling images (optional for public repos)"
  type        = string
  default     = ""
  sensitive   = true
}