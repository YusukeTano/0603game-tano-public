terraform {
  backend "s3" {
    # backend-setupで作成したS3バケット
    bucket = "0603game-prd-tfstate-002540791269"

    # このスタック専用のStateファイルのパス
    key = "static-website/terraform.tfstate"

    region         = "ap-northeast-1"
    dynamodb_table = "0603game-prd-tfstate-lock"
    encrypt        = true
    role_arn       = "arn:aws:iam::002540791269:role/TerraformExecutionRole"
  }
}
