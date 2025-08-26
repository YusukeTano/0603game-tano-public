# infra/backend-setup/environments/dev/provider.tf

provider "aws" {
  region = "ap-northeast-1"

  assume_role {
    role_arn     = "arn:aws:iam::330723288310:role/TerraformExecutionRole-dev"
    session_name = "tf-session-0603game-dev-backend"
  }
}

