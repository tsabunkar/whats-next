# ---------------------------------------------------------------------------
# Argo CD-style GitOps reconciliation for Lambda
#
# This Lambda function periodically checks the deploy/config.yaml in the
# GitOps repo and reconciles the backend Lambda function if the image tag
# differs from what's currently deployed.
#
# This follows the Argo CD pattern:
#   - Git repo is the source of truth (desired state)
#   - This Lambda is the "controller" (reconciler)
#   - It continuously compares desired vs actual state
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "reconciler" {
  function_name = "${local.backend_name}-reconciler"
  role          = aws_iam_role.reconciler.arn
  handler       = "reconciler-lambda.handler"
  runtime       = "python3.12"
  timeout       = 120
  memory_size   = 256
  filename      = data.archive_file.reconciler.output_path
  source_code_hash = data.archive_file.reconciler.output_base64sha256

  environment {
    variables = {
      GITHUB_REPO       = var.github_repo
      CONFIG_FILE_PATH  = "deploy/config.yaml"
      GITHUB_TOKEN      = var.github_token
      LAMBDA_FUNCTION   = aws_lambda_function.backend.function_name
      AWS_REGION        = var.aws_region
    }
  }

  tags = {
    Name = "${local.backend_name}-reconciler"
  }
}

# EventBridge schedule — run every 5 minutes
resource "aws_cloudwatch_event_rule" "reconciler" {
  name                = "${local.backend_name}-reconciler-schedule"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "reconciler" {
  rule      = aws_cloudwatch_event_rule.reconciler.name
  target_id = "lambda"
  arn       = aws_lambda_function.reconciler.arn
}

resource "aws_lambda_permission" "reconciler" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reconciler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reconciler.arn
}

# --- IAM for reconciler ---
resource "aws_iam_role" "reconciler" {
  name = "${local.backend_name}-reconciler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "reconciler" {
  name        = "${local.backend_name}-reconciler-policy"
  description = "Policy for GitOps reconciler Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:UpdateFunctionConfiguration",
        ]
        Resource = [aws_lambda_function.backend.arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "reconciler" {
  role       = aws_iam_role.reconciler.name
  policy_arn = aws_iam_policy.reconciler.arn
}

resource "aws_iam_role_policy_attachment" "reconciler_basic" {
  role       = aws_iam_role.reconciler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Zip archive for reconciler Lambda ---
data "archive_file" "reconciler" {
  type        = "zip"
  source_file = "${path.module}/scripts/reconciler-lambda.py"
  output_path = "${path.module}/scripts/reconciler-lambda-payload.zip"
}
