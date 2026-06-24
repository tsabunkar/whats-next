# ---------------------------------------------------------------------------
# Backend Lambda function (container image) + API Gateway HTTP API
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "backend" {
  function_name = local.backend_name
  role          = aws_iam_role.backend.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:${local.image_tag}"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      PORT              = "8080"
      LOG_LEVEL         = "info"
      CAREERS_JSON_PATH = "./data/careers.json"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.backend,
    aws_iam_role_policy_attachment.backend_vpc,
  ]

  tags = {
    Name = local.backend_name
  }
}

# ---------------------------------------------------------------------------
# API Gateway HTTP API for backend
# ---------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "backend" {
  name          = "${local.backend_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id             = aws_apigatewayv2_api.backend.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.backend.invoke_arn
}

resource "aws_apigatewayv2_route" "backend_compute" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "POST /compute/career-match"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "backend_health" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_route" "backend_root" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_lambda_permission" "backend" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*"
}
