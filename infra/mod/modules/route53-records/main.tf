data "aws_route53_zone" "main" {
  provider = aws.dns_master
  name     = var.zone_name
}

resource "aws_route53_record" "main" {
  provider = aws.dns_master
  # キーを name と type の組み合わせにして、必ずユニークになるように修正
  for_each = { for record in var.records : "${record.name}-${record.type}" => record }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type

  dynamic "alias" {
    for_each = each.value.alias != null ? [each.value.alias] : []
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = false
    }
  }

  ttl     = each.value.alias == null ? each.value.ttl : null
  records = each.value.alias == null ? each.value.content : null
}