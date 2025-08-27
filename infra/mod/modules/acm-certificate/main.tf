# DNSゾーンの情報を取得
data "aws_route53_zone" "main" {
  provider = aws.dns_master
  name     = var.base_domain
}

# ACM証明書をリクエスト (DNS検証方式)
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method = "DNS"
  tags              = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# DNS検証用のCNAMEレコードを作成
resource "aws_route53_record" "validation" {
  provider = aws.dns_master
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# DNS検証が完了するまで待機
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
  validation_record_fqdns = [
    for record in aws_route53_record.validation : record.fqdn
  ]
}
