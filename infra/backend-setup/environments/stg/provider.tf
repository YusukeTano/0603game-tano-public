# infra/backend-setup/environments/stg/provider.tf

provider "aws" {
  region = "ap-northeast-1"

  assume_role {
    role_arn     = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg"
    session_name = "tf-session-0603game-stg-backend"
  }
}