# ---------------------------------------------------------------------------
# CodeBuild project for Docker Hub → ECR image sync
#
# Lambda cannot run a Docker daemon, so CodeBuild handles the actual
# docker pull/tag/push operations. The sync Lambda triggers this project
# when a webhook arrives from Docker Hub.
# ---------------------------------------------------------------------------

resource "aws_codebuild_project" "sync" {
  name         = "${local.sync_name}-project"
  description  = "Pull image from Docker Hub, push to ECR, update Lambda"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "DOCKER_HUB_REPO"
      value = local.docker_hub_repo
    }
    environment_variable {
      name  = "ECR_REPOSITORY"
      value = aws_ecr_repository.backend.repository_url
    }
    environment_variable {
      name  = "LAMBDA_FUNCTION"
      value = aws_lambda_function.backend.function_name
    }
    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }
  }

  source {
    type      = "NO_SOURCE"
    buildspec = data.local_file.buildspec.content
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "sync"
    }
  }

  tags = {
    Name = "${local.sync_name}-project"
  }
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${local.sync_name}-project"
  retention_in_days = 7
}

data "local_file" "buildspec" {
  filename = "${path.module}/scripts/buildspec.yml"
}

resource "aws_iam_role" "codebuild" {
  name = "${local.sync_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codebuild.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "codebuild" {
  name        = "${local.sync_name}-codebuild-policy"
  description = "Policy for CodeBuild sync project"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ]
        Resource = [aws_ecr_repository.backend.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
        ]
        Resource = [aws_lambda_function.backend.arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codebuild" {
  role       = aws_iam_role.codebuild.name
  policy_arn = aws_iam_policy.codebuild.arn
}
