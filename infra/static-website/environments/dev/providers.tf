# infra/static-website/environments/dev/providers.tf

# デフォルトプロバイダ
provider "aws" {
  region = "ap-northeast-1"
  assume_role {
    role_arn     = local.execution_role_arn
    session_name = "tf-session-static-website-${local.env}"
  }
}

# ACM証明書用のプロバイダ
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  assume_role {
    role_arn     = local.execution_role_arn
    session_name = "tf-session-static-website-${local.env}-acm"
  }
}

# DNS操作用のプロバイダ
provider "aws" {
  alias  = "dns_master"
  region = "ap-northeast-1"
  assume_role {
    role_arn     = local.dns_manager_role_arn
    session_name = "tf-session-dns-cross-account-${local.env}"
  }
}