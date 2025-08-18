# ACM証明書モジュールを呼び出し
module "acm" {
  source = "../../../modules/acm-certificate"
  # providerをエイリアスで指定
  providers = {
    aws           = aws.us-east-1 # このモジュール内のデフォルトはus-east-1
    aws.dns_master = aws.dns_master # dns_masterプロバイダを渡す
  }

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  tags                      = var.common_tags
}

# S3バケットモジュールを呼び出し
module "s3_website" {
  source = "../../../modules/s3-private-bucket"

  bucket_name = "tano-0603game-bucket-${var.aws_account_id}" # 重複しないようにアカウントIDを付与
  tags        = var.common_tags
}
