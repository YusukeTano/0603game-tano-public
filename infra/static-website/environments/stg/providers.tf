# infra/static-website/environments/stg/providers.tf

# デフォルトプロバイダ
provider "aws" {
  region = "ap-northeast-1"
  assume_role {
    role_arn     = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg" # 変更
    session_name = "tf-session-static-website-stg"                         # 変更
  }
}

# ACM証明書用のプロバイダ
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  assume_role {
    role_arn     = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg" # 変更
    session_name = "tf-session-static-website-stg-acm"                       # 変更
  }
}

# DNS操作用のプロバイダ (これは変更なし)
provider "aws" {
  alias  = "dns_master"
  region = "ap-northeast-1"
  assume_role {
    role_arn     = "arn:aws:iam::252170044718:role/Route53CrossAccountManagerRole"
    session_name = "tf-session-dns-cross-account-stg" # session_nameだけ変更
  }
}