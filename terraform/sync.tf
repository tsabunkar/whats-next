# ---------------------------------------------------------------------------
# Docker Hub → ECR sync infrastructure
#
# Flow:
#   1. Docker Hub webhook POSTs to API Gateway endpoint
#   2. API Gateway invokes sync Lambda
#   3. Sync Lambda pulls image from Docker Hub, pushes to ECR,
#      then updates the backend Lambda function code
# ---------------------------------------------------------------------------

data "archive_file" "sync_lambda" {
  type        = "zip"
  source_file = "${path.module}/scripts/sync-lambda.py"
  output_path = "${path.module}/scripts/sync-lambda-payload.zip"
}

# API Gateway for webhook
resource "aws_apigatewayv2_api" "sync" {
  name          = "${local.sync_name}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "sync" {
  api_id      = aws_apigatewayv2_api.sync.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "sync" {
  api_id             = aws_apigatewayv2_api.sync.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.sync.invoke_arn
}

resource "aws_apigatewayv2_route" "sync_webhook" {
  api_id    = aws_apigatewayv2_api.sync.id
  route_key = "POST /webhook"
  target    = "integrations/${aws_apigatewayv2_integration.sync.id}"
}

resource "aws_lambda_permission" "sync" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sync.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.sync.execution_arn}/*/*"
}

# Sync Lambda function (Python — handles webhook, syncs image, updates Lambda)
resource "aws_lambda_function" "sync" {
  function_name    = local.sync_name
  role             = aws_iam_role.sync.arn
  handler          = "sync-lambda.handler"
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 512
  filename         = data.archive_file.sync_lambda.output_path
  source_code_hash = data.archive_file.sync_lambda.output_base64sha256

  environment {
    variables = {
      CODEBUILD_PROJECT = aws_codebuild_project.sync.name
      DOCKER_HUB_REPO   = local.docker_hub_repo
      ECR_REPOSITORY    = aws_ecr_repository.backend.repository_url
      LAMBDA_FUNCTION   = aws_lambda_function.backend.function_name
      WEBHOOK_SECRET    = var.docker_hub_webhook_secret
      AWS_REGION        = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.sync,
  ]

  tags = {
    Name = local.sync_name
  }
}
