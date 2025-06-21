terraform {
  backend "s3" {
    bucket         = "tano-tfstate-aft-setup"
    key            = "aft-setup/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "tano-tflock-aft"
    encrypt        = true
  }
}
