terraform {
  required_version = "~> 1.12"      # 1.12.x系を許容（1.13 には上がらない）
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"            # AWS Provider の最新安定版 (6.x 系)
    }
  }
}

provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-252170044718-0603game-sso"  # ← あなたの SSO プロファイル名
}
