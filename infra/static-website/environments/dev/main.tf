# infra/static-website/environments/dev/main.tf

module "acm" {
  source = "../../../mod/modules/acm-certificate"
  providers = {
    aws           = aws.us-east-1
    aws.dns_master = aws.dns_master
  }
  domain_name               = local.fqdn
  base_domain               = local.base_domain  # "tanoyuusuke.com"（ゾーン検索用）
  subject_alternative_names = [local.www_fqdn]
  tags                      = local.tags
}

module "s3_website" {
  source      = "../../../mod/modules/s3-private-bucket"
  bucket_name = local.bucket_name
  tags        = local.tags
}

module "cloudfront_cdn" {
  source                  = "../../../mod/modules/cloudfront-oac"
  acm_certificate_arn     = module.acm.certificate_arn
  s3_origin_domain_name   = module.s3_website.bucket_regional_domain_name
  # ⭐ bucket_id を使用（既存の出力をそのまま使える！）
  s3_bucket_id = module.s3_website.bucket_id
  domain_aliases          = local.domain_aliases
  tags                    = local.tags
}

resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = module.s3_website.bucket_id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [ {
        Effect    = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action    = "s3:GetObject",
        Resource  = "${module.s3_website.bucket_arn}/*",
        Condition = {
          StringEquals = { "AWS:SourceArn" = module.cloudfront_cdn.distribution_arn }
        }
    } ]
  })
}

module "dns" {
  source = "../../../mod/modules/route53-records"
  providers = {
    aws.dns_master = aws.dns_master
  }
  zone_name = local.zone_name
  records = [
    {
      name = local.fqdn, type = "A",
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    {
      name = local.www_fqdn, type = "A",
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    {
      name = local.fqdn, type = "AAAA",
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    },
    {
      name = local.www_fqdn, type = "AAAA",
      alias = {
        name    = module.cloudfront_cdn.domain_name
        zone_id = module.cloudfront_cdn.hosted_zone_id
      }
    }
  ]
}