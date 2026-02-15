# ─── SES Email Configuration for Cognito ──────────────────────────────────────
#
# This file sets up AWS SES to send emails on behalf of Cognito (verification
# codes, password resets, etc.) instead of the default Cognito email service.
#
# The default Cognito email service has a 50 emails/day limit.
# SES removes this limit and allows custom From addresses and templates.
#
# ┌─────────────────────────────────────────────────────────────────────┐
# │ HOW TO ACTIVATE                                                    │
# │                                                                    │
# │ 1. Set `email_domain` below to your verified domain                │
# │ 2. Run `terraform apply` — this creates the SES identity + DKIM   │
# │ 3. Add the 3 CNAME records shown in `terraform output` to your    │
# │    domain's DNS (Route 53 or your provider)                        │
# │ 4. Wait for SES to verify the domain (may take a few minutes)     │
# │ 5. Uncomment the `email_configuration` block in main.tf           │
# │ 6. Run `terraform apply` again to link Cognito → SES              │
# │                                                                    │
# │ NOTE: New SES accounts start in "sandbox" mode (can only send to  │
# │ verified emails). Request production access via the AWS Console:   │
# │ SES → Account dashboard → Request production access               │
# └─────────────────────────────────────────────────────────────────────┘

variable "email_domain" {
  description = "The domain to verify with SES for sending Cognito emails (e.g. yourdomain.com)"
  type        = string
  default     = "example.com" # ← Change this to your actual domain
}

variable "from_email" {
  description = "The From address for Cognito emails (must be on the verified domain)"
  type        = string
  default     = "noreply@example.com" # ← Change this to match your domain
}

# ─── SES Domain Identity ─────────────────────────────────────────────────────

resource "aws_ses_domain_identity" "cognito" {
  domain = var.email_domain
}

resource "aws_ses_domain_dkim" "cognito" {
  domain = aws_ses_domain_identity.cognito.domain
}

# ─── IAM Policy: Allow Cognito to send via SES ───────────────────────────────

resource "aws_iam_role" "cognito_ses_role" {
  name = "cognito_ses_email_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "cognito-idp.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "cognito_ses_policy" {
  name = "cognito_ses_send_email"
  role = aws_iam_role.cognito_ses_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Effect   = "Allow"
      Resource = aws_ses_domain_identity.cognito.arn
    }]
  })
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "ses_domain_identity_arn" {
  description = "ARN to use in Cognito email_configuration.source_arn"
  value       = aws_ses_domain_identity.cognito.arn
}

output "ses_dkim_records" {
  description = "Add these 3 CNAME records to your domain's DNS to verify DKIM"
  value = [
    for token in aws_ses_domain_dkim.cognito.dkim_tokens :
    "${token}._domainkey.${var.email_domain} → ${token}.dkim.amazonses.com"
  ]
}

output "ses_verification_record" {
  description = "Add this TXT record to your domain's DNS to verify domain ownership"
  value       = "_amazonses.${var.email_domain} → ${aws_ses_domain_identity.cognito.verification_token}"
}
