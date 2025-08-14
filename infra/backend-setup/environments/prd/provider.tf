provider "aws" {
  region = "ap-northeast-1"

  assume_role {
    # prdアカウント(0025...)で作成したロールのARN
    role_arn     = "arn:aws:iam::002540791269:role/TerraformExecutionRole"
    session_name = "tf-session-0603game-prd-backend"
  }
}
