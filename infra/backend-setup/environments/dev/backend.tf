# infra/backend-setup/environments/dev/backend.tf

terraform {
  backend "s3" {
    # applyで作成されたdev用のバケット名
    bucket = "0603game-dev-tfstate-330723288310"

    # dev用のStateファイルのパス
    key = "backend-setup/dev/terraform.tfstate"

    region = "ap-northeast-1"

    # applyで作成されたdev用のテーブル名
    dynamodb_table = "0603game-dev-tfstate-lock"

    encrypt = true

    # dev用のロールARN
    role_arn = "arn:aws:iam::330723288310:role/TerraformExecutionRole-dev"
  }
}

