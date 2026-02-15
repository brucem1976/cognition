terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# ─── IAM ──────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "sms_role" {
  name = "cognito_sms_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "cognito-idp.amazonaws.com" }
      Condition = {
        StringEquals = {
          "sts:ExternalId" = "cognition-external-id"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "sms_policy" {
  name = "cognito_sms_policy"
  role = aws_iam_role.sms_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["sns:publish"]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# ─── Lambda ───────────────────────────────────────────────────────────────────

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "pre_token_gen" {
  function_name    = "cognito_pre_token_gen"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_exec.arn
  memory_size      = 128
  timeout          = 3
}

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_token_gen.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.pool.arn
}

# ─── Cognito ──────────────────────────────────────────────────────────────────

resource "aws_cognito_user_pool" "pool" {
  name = "cognition-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OPTIONAL"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "phone_number"
    required            = false
    mutable             = true
  }

  sms_configuration {
    external_id    = "cognition-external-id"
    sns_caller_arn = aws_iam_role.sms_role.arn
  }

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  lambda_config {
    pre_token_generation = aws_lambda_function.pre_token_gen.arn
  }

  # Email configuration — currently using Cognito default.
  # To switch to SES, uncomment the email_configuration block below
  # and apply the SES resources in ses.tf first.
  #
  # email_configuration {
  #   email_sending_account = "DEVELOPER"
  #   source_arn            = aws_ses_email_identity.cognito.arn
  #   from_email_address    = "noreply@yourdomain.com"
  # }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "cognition-frontend-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  enable_token_revocation = true
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
}
