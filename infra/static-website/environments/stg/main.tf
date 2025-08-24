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

  # ⭐ bucket_id を使用（既存の出力をそのまま使える！）
  s3_bucket_id = module.s3_website.bucket_id

  domain_aliases = ["${var.domain_name}", "www.${var.domain_name}"]
  tags           = var.common_tags
}

# --- 既存の module "acm", "s3_website", "cloudfront_cdn" はこのまま ---

# --- 以下を追記 ---

# 4. S3バケットポリシーの設定
# CloudFrontが作成された後に、その情報を使ってポリシーを適用
resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = module.s3_website.bucket_id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action    = "s3:GetObject",
        Resource  = "${module.s3_website.bucket_arn}/*",
        Condition = {
          StringEquals = {
            # CloudFrontモジュールのARNを参照してアクセスを制限
            "AWS:SourceArn" = module.cloudfront_cdn.distribution_arn
          }
        }
      }
    ]
  })
}

# 5. Route 53 レコードの作成 (本番リリース)
module "dns" {
  source = "../../../modules/route53-records"
  providers = {
    aws.dns_master = aws.dns_master
  }

  zone_name = var.domain_name
  records = [
    # --- Aレコード (IPv4) ---
    {
      name = var.domain_name
      type = "A"
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    {
      name = "www.${var.domain_name}"
      type = "A"
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    # --- AAAAレコード (IPv6) ---
    {
      name = var.domain_name
      type = "AAAA"
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    {
      name = "www.${var.domain_name}"
      type = "AAAA"
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    }
  ]
}