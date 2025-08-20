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

  bucket_name = "bucket-${var.project}-${var.environment}-${var.aws_account_id}" # 重複しないようにアカウントIDを付与
  tags        = var.common_tags
}

# infra/static-website/environments/prd/main.tf

# --- 既存の module "acm" と module "s3_website" はこのまま ---

# --- 以下を追記 ---
module "cloudfront_cdn" {
  source = "../../../modules/cloudfront-oac"

  # ACMモジュールの出力を入力として渡す
  acm_certificate_arn = module.acm.certificate_arn

  # S3モジュールの出力を入力として渡す
  s3_origin_domain_name = module.s3_website.bucket_regional_domain_name

  domain_aliases = ["${var.domain_name}", "www.${var.domain_name}"]
  tags           = var.common_tags
}