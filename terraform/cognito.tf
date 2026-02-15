resource "aws_cognito_user_pool" "pool" {
  name = "cognition-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }
  
  sms_configuration {
    external_id    = "cognition-external-id"
    sns_caller_arn = aws_iam_role.sms_role.arn
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  lambda_config {
    pre_token_generation = aws_lambda_function.pre_token_gen.arn
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }
  
  schema {
      attribute_data_type = "String"
      name = "phone_number"
      required = false
      mutable = true
  }

  # Add custom attribute definition so Lambda can populate it (if needed as a standard attribute)
  # For 'custom:role', we generally don't strictly need a schema definition unless we want it settable/readable via API
  # but Pre-Token Gen can inject into ID Token regardless.
}

resource "aws_cognito_user_pool_client" "client" {
  name = "cognition-frontend-client"

  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret = false # No secret for PUBLIC clients (SPA/Mobile)

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH" # For testing
  ]
  
  # Token validity configuration
  access_token_validity  = 60 # minutes
  id_token_validity      = 60 # minutes
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_iam_role" "sms_role" {
  name = "cognito_sms_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cognito-idp.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "cognition-external-id"
          }
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "sms_policy" {
  name = "cognito_sms_policy"
  role = aws_iam_role.sms_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:publish"
        ]
        Resource = "*"
      }
    ]
  })
}
