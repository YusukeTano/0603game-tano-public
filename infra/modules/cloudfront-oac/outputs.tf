output "distribution_id" {
  description = "CloudFrontディストリビューションのID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFrontディストリビューションのARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "domain_name" {
  description = "CloudFrontディストリビューションのドメイン名"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "hosted_zone_id" {
  description = "CloudFrontディストリビューションのRoute53ホストゾーンID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}
