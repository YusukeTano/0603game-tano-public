# infra/static-website/environments/stg/backend.tf

terraform {
  backend "s3" {
    # パート1で作成したstg用のS3バケット
    bucket = "0603game-stg-tfstate-086266612383" # 変更

    # stgスタック専用のStateファイルのパス
    key = "static-website/stg/terraform.tfstate" # 変更

    region         = "ap-northeast-1"
    dynamodb_table = "0603game-stg-tfstate-lock" # 変更
    encrypt        = true
    role_arn       = "arn:aws:iam::086266612383:role/TerraformExecutionRole-stg" # 変更
  }
}