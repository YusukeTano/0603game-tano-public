# infra/static-website/environments/stg/backend.tf

terraform {
  backend "s3" {
    # パート1で作成したstg用のS3バケット
    bucket = "0603game-stg-tfstate-086266612383"

    # stgスタック専用のStateファイルのパス
    key = "static-website/stg/terraform.tfstate"

    region = "ap-northeast-1"

    # パート1で作成したstg用のDynamoDBテーブル
    dynamodb_table = "0603game-stg-tfstate-lock"

    encrypt = true

    # stg用の実行ロールARN
    assume_role = {
      role_arn = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg"
    }
  }
}