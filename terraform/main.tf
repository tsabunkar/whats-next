terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 bucket for frontend hosting
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# CloudFront distribution for frontend
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  depends_on = [aws_s3_bucket.frontend]
}

# CloudFront origin access identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "Access identity for frontend S3 bucket"
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ECR repository for backend images
resource "aws_ecr_repository" "backend" {
  name = var.backend_ecr_repository_name
}

# Push placeholder image to ECR before creating the backend Lambda
resource "null_resource" "placeholder_image" {
  depends_on = [aws_ecr_repository.backend]

  triggers = {
    dockerfile_hash = filebase64sha256("${path.module}/../lambda/backend/Dockerfile.placeholder")
  }

  provisioner "local-exec" {
    command = <<EOT
      set -e
      cd ${path.module}/../lambda/backend
      docker build -f Dockerfile.placeholder -t whats-next-backend-placeholder .
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}
      docker tag whats-next-backend-placeholder ${aws_ecr_repository.backend.repository_url}:placeholder
      docker push ${aws_ecr_repository.backend.repository_url}:placeholder
    EOT
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda functions
resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunctionConfiguration"
        ]
        Resource = aws_lambda_function.backend.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.webhook_sync.arn
      }
    ]
  })
}

# CloudWatch log group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/whats-next-webhook"
  retention_in_days = 7
}

# IAM role for API Gateway to write CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cw"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Set the CloudWatch role ARN in API Gateway account settings
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# SQS queue for decoupling webhook from image sync
resource "aws_sqs_queue" "webhook_sync" {
  name                       = "${var.project_name}-webhook-sync"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 20
}

# Lambda function for Docker image synchronization (lightweight - sends to SQS)
resource "aws_lambda_function" "sync" {
  filename         = "lambda_sync.zip"
  source_code_hash = filebase64sha256("lambda_sync.zip")
  role             = aws_iam_role.lambda.arn
  handler          = "bootstrap"
  runtime          = "provided.al2"
  function_name    = "${var.project_name}-sync-lambda"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      ECR_REPOSITORY_URI = aws_ecr_repository.backend.repository_url
      TARGET_LAMBDA_NAME = aws_lambda_function.backend.function_name
      DOCKER_USERNAME    = var.docker_username
      DOCKER_PASSWORD    = var.docker_password
      SQS_QUEUE_URL      = aws_sqs_queue.webhook_sync.url
    }
  }
}

# Lambda function for backend service
resource "aws_lambda_function" "backend" {
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:placeholder"
  role          = aws_iam_role.lambda.arn
  function_name = "${var.project_name}-backend-lambda"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      # Add any environment variables your backend needs
    }
  }

  depends_on = [
    null_resource.placeholder_image
  ]

  lifecycle {
    ignore_changes = [image_uri]
  }
}

# Worker Lambda for heavy image sync processing (triggered by SQS)
resource "aws_lambda_function" "worker" {
  filename         = "lambda_worker.zip"
  source_code_hash = filebase64sha256("lambda_worker.zip")
  role             = aws_iam_role.lambda.arn
  handler          = "bootstrap"
  runtime          = "provided.al2"
  function_name    = "${var.project_name}-sync-worker"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      ECR_REPOSITORY_URI = aws_ecr_repository.backend.repository_url
      TARGET_LAMBDA_NAME = aws_lambda_function.backend.function_name
      DOCKER_USERNAME    = var.docker_username
      DOCKER_PASSWORD    = var.docker_password
    }
  }
}

# SQS event source mapping for worker Lambda
resource "aws_lambda_event_source_mapping" "worker" {
  event_source_arn = aws_sqs_queue.webhook_sync.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 1
}

# API Gateway for webhook endpoint
resource "aws_api_gateway_rest_api" "webhook" {
  name        = "${var.project_name}-webhook-api"
  description = "API Gateway for Docker Hub webhook"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway resource
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook.id
  parent_id   = aws_api_gateway_rest_api.webhook.root_resource_id
  path_part   = "webhook"
}

# API Gateway method
resource "aws_api_gateway_method" "webhook" {
  rest_api_id   = aws_api_gateway_rest_api.webhook.id
  resource_id   = aws_api_gateway_resource.webhook.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway integration with Lambda
resource "aws_api_gateway_integration" "webhook" {
  rest_api_id             = aws_api_gateway_rest_api.webhook.id
  resource_id             = aws_api_gateway_resource.webhook.id
  http_method             = aws_api_gateway_method.webhook.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.sync.invoke_arn
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "webhook" {
  depends_on = [
    aws_api_gateway_integration.webhook,
    aws_api_gateway_method.webhook,
    aws_api_gateway_resource.webhook,
  ]

  rest_api_id = aws_api_gateway_rest_api.webhook.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.webhook,
      aws_api_gateway_method.webhook,
      aws_api_gateway_resource.webhook,
    ]))
    redeployment_at = timestamp()
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "webhook" {
  stage_name    = "prod"
  rest_api_id   = aws_api_gateway_rest_api.webhook.id
  deployment_id = aws_api_gateway_deployment.webhook.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      sourceIp           = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      httpMethod         = "$context.httpMethod"
      resourcePath       = "$context.resourcePath"
      status             = "$context.status"
      protocol           = "$context.protocol"
      responseLength     = "$context.responseLength"
      integrationStatus  = "$context.integrationStatus"
      integrationLatency = "$context.integrationLatency"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sync.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook.execution_arn}/*/*"
}

# CloudFront distribution in front of API Gateway for Docker Hub webhook
resource "aws_cloudfront_distribution" "webhook" {
  origin {
    domain_name = "${aws_api_gateway_rest_api.webhook.id}.execute-api.${var.aws_region}.amazonaws.com"
    origin_id   = "api-gateway-webhook"
    origin_path = "/prod"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = false
  comment         = "CloudFront distribution for Docker Hub webhook"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway-webhook"
    compress         = true

    forwarded_values {
      query_string = true
      headers      = ["Content-Type", "Content-Length", "User-Agent"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Outputs
output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "frontend_cloudfront_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "frontend_cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "backend_ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "webhook_url" {
  value = "https://${aws_api_gateway_rest_api.webhook.id}.execute-api.${var.aws_region}.amazonaws.com/prod/webhook"
}

output "webhook_cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.webhook.domain_name}/webhook"
}

output "webhook_sqs_queue_url" {
  value = aws_sqs_queue.webhook_sync.url
}