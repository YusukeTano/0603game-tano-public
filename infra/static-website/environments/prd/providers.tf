# デフォルトプロバイダ (prdアカウントのap-northeast-1)
provider "aws" {
  region = "ap-northeast-1"
  assume_role {
    role_arn     = "arn:aws:iam::002540791269:role/TerraformExecutionRole"
    session_name = "tf-session-static-website-prd"
  }
}

# ACM証明書用のプロバイダ (prdアカウントのus-east-1)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  assume_role {
    role_arn     = "arn:aws:iam::002540791269:role/TerraformExecutionRole"
    session_name = "tf-session-static-website-prd-acm"
  }
}

# DNS操作用のプロバイダ (DNS管理アカウントのRoute53)
provider "aws" {
  alias  = "dns_master"
  region = "ap-northeast-1" # Route53はグローバルなのでリージョンはどこでもOK
  assume_role {
    role_arn     = "arn:aws:iam::252170044718:role/Route53CrossAccountManagerRole"
    session_name = "tf-session-dns-cross-account"
  }
}
