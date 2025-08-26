# infra/static-website/environments/dev/backend.tf

terraform {
  backend "s3" {
    # パート1で作成したdev用のS3バケット
    bucket = "0603game-dev-tfstate-330723288310"

    # devスタック専用のStateファイルのパス
    key = "static-website/dev/terraform.tfstate"

    region         = "ap-northeast-1"
    
    # パート1で作成したdev用のDynamoDBテーブル
    dynamodb_table = "0603game-dev-tfstate-lock"
    
    encrypt        = true

    # dev用の実行ロールARN
    assume_role  = {
      role_arn = "arn:aws:iam::330723288310:role/TerraformExecutionRole-dev"
    }
  }
}