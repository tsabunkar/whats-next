output "frontend_bucket_name" {
  description = "S3 bucket name for frontend static files"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_cloudfront_url" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_cloudfront_id" {
  description = "CloudFront distribution ID for invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}

output "backend_api_url" {
  description = "API Gateway URL for the backend Lambda"
  value       = aws_apigatewayv2_api.backend.api_endpoint
}

output "backend_lambda_name" {
  description = "Backend Lambda function name"
  value       = aws_lambda_function.backend.function_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend images"
  value       = aws_ecr_repository.backend.repository_url
}

output "sync_lambda_name" {
  description = "Docker Hub → ECR sync Lambda function name"
  value       = aws_lambda_function.sync.function_name
}

output "sync_webhook_url" {
  description = "API Gateway URL for Docker Hub webhook"
  value       = "${aws_apigatewayv2_api.sync.api_endpoint}/webhook"
}


