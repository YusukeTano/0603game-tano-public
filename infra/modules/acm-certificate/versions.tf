# versions.tf（宣言あり）
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = ">= 5.0"
      configuration_aliases = [aws.dns_master]
    }
  }
}
