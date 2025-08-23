# infra/backend-setup/environments/stg/backend.tf (移行後)

terraform {
  backend "s3" {
    # applyで作成されたstg用のバケット名
    bucket = "0603game-stg-tfstate-086266612383"

    # stg用のStateファイルのパス
    key = "backend-setup/stg/terraform.tfstate"

    region         = "ap-northeast-1"
    
    # applyで作成されたstg用のテーブル名
    dynamodb_table = "0603game-stg-tfstate-lock"

    encrypt        = true

    # stg用のロールARN
    role_arn       = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg"
  }
}