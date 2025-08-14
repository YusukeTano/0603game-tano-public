terraform {
  backend "s3" {
    # applyで作成されたS3バケット名
    bucket = "0603game-prd-tfstate-002540791269"

    # このバックエンドリソース自体のStateファイルのパス
    key = "backend/terraform.tfstate"

    region = "ap-northeast-1"

    # applyで作成されたDynamoDBテーブル名
    dynamodb_table = "0603game-prd-tfstate-lock"

    encrypt = true

    # バックエンド操作もassume_roleで行う
    role_arn = "arn:aws:iam::002540791269:role/TerraformExecutionRole"
  }
}