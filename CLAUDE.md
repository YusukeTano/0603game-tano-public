# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

0603game is a Terraform project that manages AWS infrastructure for a static game website (located in `public/` directory). It uses a multi-account, multi-environment configuration (dev/stg/prd) with integrated CI/CD pipelines via GitHub Actions.

## Infrastructure Architecture

### Environment Separation
- **dev environment**: AWS Account 330723288310 (ap-northeast-1)
- **stg environment**: AWS Account 434023888095 (ap-northeast-1) 
- **prd environment**: AWS Account 002540791269 (ap-northeast-1)
- **DNS management**: AWS Account 252170044718 (dedicated Route53 hosted zone management)

### Terraform Directory Structure
```
infra/
├── backend-setup/          # Terraform state management (S3 + DynamoDB)
│   ├── environments/       # Environment-specific backend configurations
│   └── modules/backend/    # Backend resource definitions
├── static-website/         # Static website infrastructure (CloudFront + S3 + ACM)
│   └── environments/       # Environment-specific website configurations
└── mod/modules/            # Reusable Terraform modules
    ├── acm-certificate/    # SSL certificate auto-issuance & validation
    ├── cloudfront-oac/     # CloudFront + OAC (Origin Access Control)
    ├── route53-records/    # DNS record management
    └── s3-private-bucket/  # Private S3 bucket creation
```

## Common Development Commands

### Terraform Operations (run from environment directories)
```bash
# Navigate to environment directory
cd infra/static-website/environments/dev  # or stg, prd

# Standard Terraform workflow
terraform fmt -recursive     # Format (project-wide)
terraform init              # Initialize
terraform validate          # Validate
terraform plan              # Create execution plan
terraform apply             # Apply infrastructure changes
terraform destroy           # Destroy infrastructure (use with caution)

# Linting (run from project root)
tflint --recursive infra/static-website/environments/dev/
```

### AWS Authentication
```bash
# AWS profile configuration (auto-configured via .envrc)
export AWS_PROFILE=0603game-TerraformOperator
```

### Static Site Deployment
```bash
# Manual S3 sync
aws s3 sync ./public/ s3://tano-0603game-bucket/ --delete
```

## CI/CD Workflow

### Development Flow
1. **Feature Branch Creation** (`feature/**`) 
   - `terraform-lint-validate-dev.yml`: Format, validate, lint + auto-draft PR creation
2. **PR Ready** (draft removal)
   - `terraform-plan-dev.yml`: Execute Terraform plan + post PR comment with results
3. **Main Merge**
   - `terraform-apply-dev.yml`: Auto-apply to dev environment (only when infra changes detected)

### Production Deployment
- **Version Tag** (`v*.*.*`) push: `terraform-deploy-prd.yml` applies to production environment

### Static Site Deployment
- **Main Merge**: `deploy-to-s3.yml` syncs public directory to S3

## Important Configuration

### Terraform Version
- Fixed version: `1.9.2` (managed in `.terraform-version`)
- Minimum required: `>= 1.5.0`

### AWS Provider Configuration
- **Multi-provider setup**: Separate providers for each environment + DNS management
- **Cross-account access**: IAM role AssumeRole for permission delegation
- **OIDC authentication**: GitHub Actions AWS authentication (no secrets required)

### Remote State Management
- **S3 backend**: Environment-isolated state files
- **DynamoDB**: State locking mechanism
- **Encryption**: Server-side encryption on S3 buckets

## Development Notes

### Environment Variables and Profiles
- `.envrc` auto-configures AWS_PROFILE
- Environment-specific settings managed in respective terraform.tfvars files

### Module Dependencies
- Shared modules in `infra/mod/modules/` are referenced by multiple environments
- Module changes require consideration of impact across all environments

### Multi-Account Operations
- DNS operations execute in dedicated account (252170044718)
- Permission isolation per environment using different AWS accounts

### Security Best Practices
- All S3 buckets have public access block enabled
- CloudFront uses OAC (Origin Access Control) for secure S3 access
- Terraform state has encryption and versioning enabled

## Troubleshooting

### Common Issues
1. **Authentication errors**: Verify AWS_PROFILE configuration
2. **State locking**: Check DynamoDB table status
3. **DNS validation**: Allow time for Route53 record propagation
4. **Module dependencies**: Run `terraform get -update` to refresh modules

### Debug Commands
```bash
# Terraform debugging
export TF_LOG=DEBUG
terraform plan

# AWS credentials verification
aws sts get-caller-identity
```