terraform {
  required_version = "~> 1.9"    # 最適な安定系列（1.9.x に追随、1.10 には上がらない）
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"        # 6.0.x 〜 6.x.y に追随
    }
  }
}

provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-252170044718-0603game-sso"
}
