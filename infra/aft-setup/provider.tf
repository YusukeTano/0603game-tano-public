terraform {
  required_version = ">= 1.4.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.9.0, < 5.0.0"
    }
  }
}

provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-252170044718-0603game-sso"
}
